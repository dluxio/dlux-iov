/**
 * entity-api.js - Unified API for entity manipulation
 * 
 * This module provides a single interface for all entity operations,
 * ensuring that all state changes go through the watcher as the
 * single source of truth.
 */

import { getState } from './state.js';
import { positionToString, stringToPosition, generateEntityId, showNotification } from './utils.js';
import { logAction } from './debug.js';

// Local references to functions that will be imported dynamically
// to avoid circular dependencies
let _entitiesModule = null;
let _watcherModule = null;

// Entity types that are implemented through components rather than dedicated tags
const COMPONENT_BASED_TYPES = ['torus', 'dodecahedron', 'octahedron', 'tetrahedron', 'cone', 'ring'];

// Store default properties for custom primitives
const customPrimitiveDefaults = {};

/**
 * Initialize the entity API by loading required modules
 * @returns {Promise} Promise that resolves when initialization is complete
 */
export async function initEntityAPI() {
  try {
    // Load dependencies asynchronously to avoid circular imports
    const [entitiesModule, watcherModule] = await Promise.all([
      import('./entities.js'),
      import('./watcher.js')
    ]);
    
    _entitiesModule = entitiesModule;
    _watcherModule = watcherModule;
    
    console.log('Entity API initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize entity API:', error);
    return false;
  }
}

/**
 * Ensures the watcher is available for state updates
 * @private
 * @throws {Error} Throws error if watcher is not available
 */
function _ensureWatcher() {
  if (!window.watcher || typeof window.watcher.saveEntitiesToState !== 'function') {
    throw new Error('Watcher is required but not available for entity operations');
  }
}

/**
 * Get a random color for entities
 * @returns {string} Random color in hex format
 * @private
 */
function _getRandomColor() {
  const colors = [
    '#FF5733', '#33FF57', '#3357FF', '#F033FF', '#FF33A8', '#33FFF9', '#FCFF33', 
    '#4CC3D9', '#EF2D5E', '#FFC65D', '#7BC8A4', '#6A7CFF', '#FF6A6A'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Get default properties for an entity based on its type
 * @param {string} entityType - The type of entity (box, sphere, etc.)
 * @param {Object} baseProperties - Any existing properties to extend
 * @returns {Object} Default properties
 * @private
 */
function _getDefaultProperties(entityType, baseProperties = {}) {
  // Copy the base properties to avoid mutation
  const properties = { ...baseProperties };
  
  try {
    // Get state for camera position if available
    const cameraPos = { x: 0, y: 1.6, z: -3 }; // Default fallback position
    const cameraRot = { y: 0 }; // Default fallback rotation
    
    // Try to get camera data from state
    const state = getState();
    if (state && state.camera) {
      if (state.camera.position) {
        cameraPos.x = state.camera.position.x || cameraPos.x;
        cameraPos.y = state.camera.position.y || cameraPos.y;
        cameraPos.z = state.camera.position.z || cameraPos.z;
      }
      if (state.camera.rotation) {
        cameraRot.y = state.camera.rotation.y || cameraRot.y;
      }
    }
    
    // Calculate a position in front of the camera if no position provided
    if (!properties.position) {
      const radians = cameraRot.y * (Math.PI / 180);
      const distance = 3; // Distance in front of camera
      const x = cameraPos.x - Math.sin(radians) * distance;
      const z = cameraPos.z - Math.cos(radians) * distance;
      
      // For plane, we want it on the ground
      if (entityType === 'plane') {
        properties.position = { x, y: 0, z };
      } else if (entityType === 'light') {
        properties.position = { x, y: cameraPos.y + 1, z };
      } else {
        properties.position = { x, y: cameraPos.y, z };
      }
    }
    
    // Set default color if not provided
    if (!properties.color && entityType !== 'light') {
      properties.color = _getRandomColor();
    }
    
    // Set entity-specific defaults
    switch (entityType) {
      case 'box':
        properties.width = properties.width || 1;
        properties.height = properties.height || 1;
        properties.depth = properties.depth || 1;
        break;
      case 'sphere':
        properties.radius = properties.radius || 0.5;
        break;
      case 'cylinder':
        properties.radius = properties.radius || 0.5;
        properties.height = properties.height || 1.5;
        break;
      case 'plane':
        properties.width = properties.width || 4;
        properties.height = properties.height || 4;
        properties.rotation = properties.rotation || { x: -90, y: 0, z: 0 };
        break;
      case 'light':
        properties.type = properties.type || 'point';
        properties.intensity = properties.intensity || 1;
        properties.distance = properties.distance || 20;
        break;
      case 'torus':
        properties.radius = properties.radius || 0.5;
        properties.radiusTubular = properties.radiusTubular || 0.1;
        break;
      case 'dodecahedron':
        properties.radius = properties.radius || 0.5;
        break;
    }
  } catch (error) {
    console.error('[Entity API] Error applying default properties:', error);
  }
  
  return properties;
}

/**
 * Create an entity directly in the DOM without relying on entities.js
 * @private
 * @param {string} type - Entity type
 * @param {Object} properties - Entity properties
 * @param {string} [semanticType] - Optional semantic type
 * @returns {Object} Object with the created entity and UUID
 */
async function _createEntityDirectly(type, properties, semanticType = null) {
  // Extract properties to avoid modifying the original
  const propsToApply = { ...properties };
  
  // Check if we should preserve UUID (used when recreating from state)
  let uuid;
  if (propsToApply._preserveUuid) {
    uuid = propsToApply._preserveUuid;
    delete propsToApply._preserveUuid; // Remove from properties to avoid applying it as an attribute
  } else {
    // Generate UUID for the entity
    uuid = await import('./utils.js').then(utils => {
      return utils.generateEntityId(type);
    });
  }
  
  // Determine the element type based on the entity type
  let elementType = 'a-entity';
  
  // Component-based types need special handling
  const componentBasedTypes = ['torus', 'dodecahedron', 'octahedron', 'tetrahedron', 'cone', 'ring'];
  
  if (componentBasedTypes.includes(type)) {
    // These are created as a-entity with geometry component
    elementType = 'a-entity';
  } else if (type !== 'entity') {
    // Standard primitives use a-{type} format
    elementType = `a-${type}`;
  }
  
  // Create the element
  const element = document.createElement(elementType);
  
  // Set UUID as data attribute
  element.setAttribute('data-entity-uuid', uuid);
  
  // Handle entity ID
  if (propsToApply.id) {
    // If ID is provided, use it directly
    element.id = propsToApply.id;
    delete propsToApply.id; // Remove from properties as we've already applied it
  } else {
    // Generate an ID based on the UUID, keeping the format consistent with data-entity-uuid
    // This ensures the ID uses the same pattern as the UUID
    element.id = uuid;
  }
  
  // For component-based types, set up the geometry component
  if (componentBasedTypes.includes(type)) {
    element.setAttribute('geometry', `primitive: ${type}`);
  }
  
  // Apply all properties to the element
  for (const [key, value] of Object.entries(propsToApply)) {
    // Skip null or undefined values
    if (value === null || value === undefined) continue;
    
    // Handle special cases like position, rotation, scale
    if (['position', 'rotation', 'scale'].includes(key) && typeof value === 'object') {
      const stringValue = positionToString(value);
      element.setAttribute(key, stringValue);
    } else if (key === 'geometry' && typeof value === 'object') {
      // For custom geometry components
      const geomParts = [];
      for (const [geomKey, geomValue] of Object.entries(value)) {
        geomParts.push(`${geomKey}: ${geomValue}`);
      }
      element.setAttribute('geometry', geomParts.join('; '));
    } else if (key === 'material' && typeof value === 'object') {
      // For custom material components
      const matParts = [];
      for (const [matKey, matValue] of Object.entries(value)) {
        matParts.push(`${matKey}: ${matValue}`);
      }
      element.setAttribute('material', matParts.join('; '));
    } else {
      // Standard attribute
      element.setAttribute(key, value);
    }
  }
  
  // Add to scene
  const scene = document.querySelector('a-scene');
  if (!scene) {
    throw new Error('No A-Frame scene found');
  }
  
  // Check for duplicate IDs before adding to scene
  if (element.id) {
    const existingWithId = document.getElementById(element.id);
    if (existingWithId) {
      console.warn(`[Entity API] Entity with ID ${element.id} already exists, generating unique ID`);
      // Generate a new unique ID while maintaining the original entity-type pattern
      // Add a timestamp suffix to make it unique
      element.id = `${element.id}-${Date.now().toString(36)}`;
    }
  }
  
  scene.appendChild(element);
  
  return { element, uuid };
}

/**
 * Create a new entity with the specified type and properties
 * @param {string} type - Entity type (box, sphere, cylinder, etc.)
 * @param {Object} properties - Entity properties (position, color, etc.)
 * @param {string} [semanticType] - Optional semantic type for specialized entities
 * @returns {Object} Object containing the entity element and UUID
 */
export async function createEntity(type, properties = {}, semanticType) {
  // Generate a UUID first to use for both the data-entity-uuid and id
  let entityUuid;
  try {
    entityUuid = await import('./utils.js').then(utils => {
      return utils.generateEntityId(type);
    });
  } catch (error) {
    console.error('[Entity API] Error generating entity UUID:', error);
    return null;
  }
  
  // Check if an explicit ID is provided and validate it
  if (properties.id && typeof properties.id === 'string') {
    // Check if ID exists already to prevent duplicates
    if (document.getElementById(properties.id)) {
      console.warn(`[Entity API] Entity with ID ${properties.id} already exists, will use UUID as ID instead`);
      // Use the UUID as ID instead
      properties.id = entityUuid;
    }
    
    // Ensure id follows valid pattern
    if (!/^[A-Za-z][\w-]*$/.test(properties.id)) {
      console.warn(`[Entity API] Invalid entity ID format: ${properties.id}, must start with a letter and contain only letters, numbers, underscores, and hyphens`);
      // Use the UUID as ID instead
      properties.id = entityUuid;
    }
  } else {
    // Set the ID to be the same as the UUID for consistency
    properties.id = entityUuid;
  }
  
  // Apply default properties based on entity type
  const enrichedProperties = _getDefaultProperties(type, properties);
  
  // Force _preserveUuid to use our pre-generated UUID
  enrichedProperties._preserveUuid = entityUuid;
  
  console.log(`[Entity API] Creating ${semanticType || type} entity`, enrichedProperties);
  
  try {
    // Use our direct creation method
    const result = await _createEntityDirectly(type, enrichedProperties, semanticType);
    
    // Ensure entity was created
    if (!result || !result.uuid) {
      console.error(`[Entity API] Failed to create ${type} entity`);
      return null;
    }
    
    // Save changes to state via watcher
    _ensureWatcher();
    window.watcher.saveEntitiesToState('entity-api-create');
    
    logAction(`Created ${type} entity: ${result.uuid} with ID: ${result.element.id}`);
    return result;
  } catch (error) {
    console.error(`[Entity API] Error creating ${type} entity:`, error);
    return null;
  }
}

/**
 * Update an existing entity's properties
 * @param {string} uuid - Entity UUID
 * @param {Object} properties - New or updated properties
 * @returns {boolean} Success status
 */
export async function updateEntity(uuid, properties) {
  console.log(`[Entity API] Updating entity ${uuid}`, properties);
  
  // Ensure modules are loaded
  if (!_entitiesModule) await initEntityAPI();
  
  try {
    // Check if entity exists
    const entity = document.querySelector(`[data-entity-uuid="${uuid}"]`);
    if (!entity) {
      console.error(`[Entity API] Entity ${uuid} not found`);
      return false;
    }
    
    // Apply property updates to the DOM element
    if (_entitiesModule.setEntityAttributes) {
      _entitiesModule.setEntityAttributes(entity, properties);
    } else {
      // Fallback to manual attribute setting
      Object.entries(properties).forEach(([key, value]) => {
        // Special handling for vectors
        if (['position', 'rotation', 'scale'].includes(key) && typeof value === 'object') {
          entity.setAttribute(key, positionToString(value));
        } else {
          entity.setAttribute(key, value);
        }
      });
    }
    
    // Save changes to state via watcher
    _ensureWatcher();
    window.watcher.saveEntitiesToState('entity-api-update');
    
    logAction(`Updated entity ${uuid}`);
    return true;
  } catch (error) {
    console.error(`[Entity API] Error updating entity ${uuid}:`, error);
    return false;
  }
}

/**
 * Delete an entity by UUID
 * @param {string} uuid - Entity UUID
 * @returns {boolean} Success status
 */
export async function deleteEntity(uuid) {
  console.log(`[Entity API] Deleting entity ${uuid}`);
  
  // Ensure modules are loaded
  if (!_entitiesModule) await initEntityAPI();
  
  try {
    // Find the entity in the DOM
    const entity = document.querySelector(`[data-entity-uuid="${uuid}"]`);
    
    // Remove from DOM if found
    if (entity && entity.parentNode) {
      entity.parentNode.removeChild(entity);
    } else {
      console.warn(`[Entity API] Entity ${uuid} not found in DOM for deletion`);
    }
    
    // Save changes to state via watcher
    _ensureWatcher();
    window.watcher.saveEntitiesToState('entity-api-delete');
    
    logAction(`Deleted entity ${uuid}`);
    return true;
  } catch (error) {
    console.error(`[Entity API] Error deleting entity ${uuid}:`, error);
    return false;
  }
}

/**
 * Get entity data by UUID
 * @param {string} uuid - Entity UUID
 * @returns {Object|null} Entity data or null if not found
 */
export function getEntityData(uuid) {
  const state = getState();
  return state.entities[uuid] ? {...state.entities[uuid]} : null;
}

/**
 * Get all entities in the current state
 * @param {Object} [filters] - Optional filters to apply (type, property values, etc.)
 * @returns {Object} Map of entity UUIDs to entity data
 */
export function getAllEntities(filters = {}) {
  const state = getState();
  const entities = {...state.entities};
  
  // Apply filters if provided
  if (Object.keys(filters).length > 0) {
    const filteredEntities = {};
    
    Object.entries(entities).forEach(([uuid, data]) => {
      let matchesAll = true;
      
      // Check each filter
      Object.entries(filters).forEach(([key, value]) => {
        if (key === 'type' && data.type !== value) {
          matchesAll = false;
        } else if (data[key] !== value) {
          matchesAll = false;
        }
      });
      
      if (matchesAll) {
        filteredEntities[uuid] = data;
      }
    });
    
    return filteredEntities;
  }
  
  return entities;
}

/**
 * Find entities by type
 * @param {string} type - Entity type to search for
 * @returns {Array} Array of entity UUIDs that match the type
 */
export function findEntitiesByType(type) {
  const state = getState();
  
  return Object.entries(state.entities)
    .filter(([_, data]) => data.type === type)
    .map(([uuid]) => uuid);
}

/**
 * Find entities by property value
 * @param {string} property - Property name to check
 * @param {any} value - Value to match
 * @returns {Array} Array of entity UUIDs that match
 */
export function findEntitiesByProperty(property, value) {
  const state = getState();
  
  return Object.entries(state.entities)
    .filter(([_, data]) => data[property] === value)
    .map(([uuid]) => uuid);
}

/**
 * Add multiple entities of the same type with variations
 * @param {string} type - Entity type
 * @param {number} count - Number of entities to create
 * @param {Object} options - Creation options including positionOptions and baseProperties
 * @returns {Array} Array of created entity UUIDs
 */
export async function addMultipleEntities(type, count, options = {}) {
  console.log(`[Entity API] Adding ${count} ${type} entities`);
  
  try {
    const entityIds = [];
    const {
      positionOptions = {},
      baseProperties = {}
    } = options;
    
    // Get random position function
    const getRandomPosition = (options) => {
      const {
        minX = -5, maxX = 5,
        minY = 0, maxY = 3,
        minZ = -5, maxZ = -3
      } = options;
      
      return {
        x: minX + Math.random() * (maxX - minX),
        y: minY + Math.random() * (maxY - minY),
        z: minZ + Math.random() * (maxZ - minZ)
      };
    };
    
    // Create each entity
    for (let i = 0; i < count; i++) {
      // Get random position
      const position = getRandomPosition(positionOptions);
      
      // Create entity with base properties + random position
      const entityProps = {
        ...baseProperties,
        position
      };
      
      // Add default properties specific to the entity type
      const enrichedProps = _getDefaultProperties(type, entityProps);
      
      // Create the entity
      try {
        const result = await _createEntityDirectly(type, enrichedProps);
        if (result && result.uuid) {
          entityIds.push(result.uuid);
        }
      } catch (err) {
        console.error(`[Entity API] Error creating entity ${i+1}/${count}:`, err);
      }
    }
    
    // Save all changes at once
    _ensureWatcher();
    window.watcher.saveEntitiesToState('entity-api-add-multiple');
    
    logAction(`Added ${entityIds.length} ${type} entities`);
    return entityIds;
  } catch (error) {
    console.error(`[Entity API] Error adding multiple ${type} entities:`, error);
    return [];
  }
}

/**
 * Recreate all entities from the current state
 * Useful for full scene rebuilds
 * @param {Object} [entitiesState] - Optional specific entities state to use (defaults to current state)
 * @returns {boolean} Success status
 */
export async function recreateAllEntities(entitiesState = null) {
  console.log('[Entity API] Recreating all entities from state');
  
  try {
    // Get current state if not provided
    const state = entitiesState || getState().entities;
    
    if (!state) {
      console.error('[Entity API] No valid state provided for recreating entities');
      return false;
    }
    
    // Clear existing entities from the scene
    const scene = document.querySelector('a-scene');
    if (!scene) {
      console.error('[Entity API] No A-Frame scene found');
      return false;
    }
    
    // Store existing entity IDs to avoid conflicts
    const existingIds = new Set();
    const existingEntities = scene.querySelectorAll('[data-entity-uuid]');
    existingEntities.forEach(entity => {
      if (entity.id) {
        existingIds.add(entity.id);
      }
      entity.parentNode.removeChild(entity);
    });
    
    // Recreate each entity from state
    const entities = state;
    const creationPromises = [];
    
    for (const [uuid, entityData] of Object.entries(entities)) {
      if (!entityData) continue;
      
      const entityType = entityData.type || 'entity';
      
      // Extract properties, filtering out non-attribute data
      const properties = { ...entityData };
      delete properties.type; // Remove type as it's not an attribute
      
      // Ensure uuid is preserved
      properties._preserveUuid = uuid;
      
      // Set ID to match UUID for consistency
      // If the entity data already has an ID, prefer that, but ensure it doesn't conflict
      const preferredId = properties.id || uuid;
      
      // If ID exists in the document or is in our set of IDs to be created,
      // use the UUID instead which is guaranteed to be unique
      if (document.getElementById(preferredId) || existingIds.has(preferredId)) {
        properties.id = uuid;
      } else {
        properties.id = preferredId;
        existingIds.add(preferredId); // Track this ID to prevent future conflicts
      }
      
      // Create the entity with the preserved UUID
      const createPromise = _createEntityDirectly(entityType, properties)
        .catch(err => console.error(`[Entity API] Error recreating entity ${uuid}:`, err));
        
      creationPromises.push(createPromise);
    }
    
    // Wait for all entities to be created
    await Promise.all(creationPromises);
    
    // Save to state via watcher
    _ensureWatcher();
    window.watcher.saveEntitiesToState('entity-api-recreate');
    
    logAction('Recreated all entities from state');
    return true;
  } catch (error) {
    console.error('[Entity API] Error recreating entities:', error);
    return false;
  }
}

/**
 * Copy an entity with optional property overrides
 * @param {string} uuid - UUID of entity to copy
 * @param {Object} propertyOverrides - Properties to override in the copy
 * @returns {string|null} UUID of new entity or null if failed
 */
export async function duplicateEntity(uuid, propertyOverrides = {}) {
  console.log(`[Entity API] Duplicating entity ${uuid}`);
  
  try {
    // Get the original entity data
    const entityData = getEntityData(uuid);
    if (!entityData) {
      console.error(`[Entity API] Entity ${uuid} not found for duplication`);
      return null;
    }
    
    // Create new properties object with overrides
    const properties = {...entityData, ...propertyOverrides};
    
    // Ensure position is offset slightly if not explicitly overridden
    if (!propertyOverrides.position && properties.position) {
      properties.position = {
        x: properties.position.x + 0.2,
        y: properties.position.y,
        z: properties.position.z - 0.2
      };
    }
    
    // Remove type as it's the first parameter
    const type = properties.type;
    delete properties.type;
    
    // Remove UUID as it will be generated
    delete properties.uuid;
    
    // Create new entity
    const result = await createEntity(type, properties);
    
    if (result && result.uuid) {
      showNotification(`Entity duplicated: ${result.uuid}`, 'success');
      return result.uuid;
    }
    
    return null;
  } catch (error) {
    console.error(`[Entity API] Error duplicating entity ${uuid}:`, error);
    return null;
  }
}

/**
 * Check if an entity with the given UUID exists
 * @param {string} uuid - Entity UUID to check
 * @returns {boolean} True if entity exists
 */
export function entityExists(uuid) {
  const state = getState();
  return !!state.entities[uuid];
}

/**
 * Force an update of the DOM and state from the current entities
 * @returns {Object} Updated entities state
 */
export function forceStateUpdate() {
  _ensureWatcher();
  return window.watcher.saveEntitiesToState('entity-api-force-update');
}

/**
 * Get entity DOM element by UUID
 * @param {string} uuid - Entity UUID
 * @returns {Element|null} DOM element or null if not found
 */
export function getEntityElement(uuid) {
  return document.querySelector(`[data-entity-uuid="${uuid}"]`);
}

/**
 * Register a new component-based entity type
 * @param {string} type - Type name (e.g., "dodecahedron")
 * @param {Object} defaultProps - Default properties for this type
 * @returns {boolean} Success status
 */
export async function registerEntityType(type, defaultProps) {
  // Ensure modules are loaded
  if (!_entitiesModule) await initEntityAPI();
  
  try {
    if (_entitiesModule.registerPrimitiveType) {
      _entitiesModule.registerPrimitiveType(type, defaultProps);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`[Entity API] Error registering entity type ${type}:`, error);
    return false;
  }
}

/**
 * Generate a random position within specified bounds
 * @param {Object} options - Position options
 * @param {number} [options.minX=-5] - Minimum X
 * @param {number} [options.maxX=5] - Maximum X
 * @param {number} [options.minY=0] - Minimum Y
 * @param {number} [options.maxY=3] - Maximum Y
 * @param {number} [options.minZ=-5] - Minimum Z
 * @param {number} [options.maxZ=-3] - Maximum Z
 * @returns {Object} Object containing x, y, z coordinates
 */
export function getRandomPosition(options = {}) {
  const {
    minX = -5, maxX = 5,
    minY = 0, maxY = 3,
    minZ = -5, maxZ = -3
  } = options;

  return {
    x: minX + Math.random() * (maxX - minX),
    y: minY + Math.random() * (maxY - minY),
    z: minZ + Math.random() * (maxZ - minZ)
  };
}

/**
 * Register a custom primitive type with default properties
 * This allows for extending the system with new entity types
 * @param {string} primitiveType - Type name
 * @param {Object} defaultProps - Default properties
 */
export function registerPrimitiveType(primitiveType, defaultProps) {
  console.log(`[Entity API] Registering custom primitive: ${primitiveType}`);
  customPrimitiveDefaults[primitiveType] = defaultProps;
}

/**
 * Get entity UUID from DOM element ID
 * @param {string} domId - DOM element ID
 * @returns {string|null} Entity UUID or null if not found
 */
export function getEntityUUIDById(domId) {
  const element = document.getElementById(domId);
  if (!element) return null;
  
  return element.getAttribute('data-entity-uuid');
}

/**
 * Log positions of all entities to console
 * Useful for debugging
 */
export function logEntityPositions() {
  console.log('[Entity API] Entity positions:');
  const scene = document.querySelector('a-scene');
  if (!scene) {
    console.error('[Entity API] No scene found');
    return;
  }
  
  const entities = Array.from(scene.querySelectorAll('[id]'));
  console.table(entities.map(entity => {
    const id = entity.id;
    const uuid = entity.getAttribute('data-entity-uuid') || 'N/A';
    const position = entity.getAttribute('position') || 'N/A';
    return { id, uuid, position };
  }));
}

/**
 * Ensure all entities in the scene have UUIDs
 * This is critical for maintaining consistent entity tracking
 * @returns {Object} Object containing updated entities and mapping
 */
export async function ensureEntityUUIDs() {
  console.log('[Entity API] Ensuring all entities have UUIDs');
  
  try {
    const state = getState();
    const updatedEntities = { ...state.entities };
    const updatedMapping = { ...state.entityMapping };
    let hasChanges = false;
    
    // Get the scene
    const scene = document.querySelector('a-scene');
    if (!scene) {
      console.error('[Entity API] No scene found');
      return { entities: updatedEntities, entityMapping: updatedMapping, changes: false };
    }
    
    // Find all entities
    const entityElements = scene.querySelectorAll('a-entity, a-box, a-sphere, a-cylinder, a-plane, a-sky');
    
    // Process each entity
    entityElements.forEach(element => {
      // Skip elements without IDs as they're not tracked entities
      if (!element.id) return;
      
      // Check if element has a UUID
      const uuid = element.getAttribute('data-entity-uuid');
      if (!uuid) {
        // Generate a UUID if missing
        const id = element.id;
        console.log(`[Entity API] Entity without UUID found: ${id}`);
        
        // Determine type from tag name or geometry
        const tagName = element.tagName.toLowerCase();
        let type = tagName.startsWith('a-') ? tagName.substring(2) : tagName;
        
        // Check for geometry component to handle special cases
        const geometryAttr = element.getAttribute('geometry');
        if (geometryAttr && geometryAttr.primitive) {
          type = geometryAttr.primitive;
        }
        
        // Generate a new UUID
        const newUuid = generateEntityId(type);
        element.setAttribute('data-entity-uuid', newUuid);
        console.log(`[Entity API] Assigned UUID ${newUuid} to entity ${id}`);
        
        // Update mappings
        updatedMapping[id] = newUuid;
        
        // Extract entity data
        const entityData = _extractEntityAttributes(element, type);
        updatedEntities[newUuid] = entityData;
        hasChanges = true;
      } else {
        // Ensure this UUID is in state
        if (!state.entities[uuid]) {
          console.log(`[Entity API] Found entity with UUID ${uuid} but missing from state, adding it`);
          const tagName = element.tagName.toLowerCase();
          const type = tagName.startsWith('a-') ? tagName.substring(2) : tagName;
          const entityData = _extractEntityAttributes(element, type);
          updatedEntities[uuid] = entityData;
          hasChanges = true;
        }
      }
    });
    
    // Update state if we made changes
    if (hasChanges) {
      _ensureWatcher();
      window.watcher.saveEntitiesToState('entity-api-ensure-uuids');
    }
    
    return { 
      entities: updatedEntities, 
      entityMapping: updatedMapping, 
      changes: hasChanges 
    };
  } catch (error) {
    console.error('[Entity API] Error ensuring entity UUIDs:', error);
    return { entities: {}, entityMapping: {}, changes: false };
  }
}

/**
 * Extract attributes from entity element to use in state
 * @private
 * @param {Element} entity - Entity DOM element
 * @param {string} type - Entity type
 * @returns {Object} Entity properties for state
 */
function _extractEntityAttributes(entity, type) {
  try {
    // Get geometry attributes if available
    const geometry = entity.getAttribute('geometry');
    
    // Start with basic properties including type
    const properties = { type };
    
    // Handle vector attributes (position, rotation, scale)
    const vectorAttributes = ['position', 'rotation', 'scale'];
    vectorAttributes.forEach(attr => {
      const value = entity.getAttribute(attr);
      if (value) {
        properties[attr] = typeof value === 'string' ? stringToPosition(value) : value;
      }
    });
    
    // Handle geometry properties for component-based entities
    if (geometry && typeof geometry === 'object') {
      properties.geometry = geometry;
    }
    
    // Add all other attributes
    Array.from(entity.attributes).forEach(attr => {
      const name = attr.name;
      
      // Skip attributes we've already processed or that aren't relevant for state
      if (vectorAttributes.includes(name) || 
          name === 'geometry' || 
          name === 'id' || 
          name === 'class' || 
          name === 'data-entity-uuid') {
        return;
      }
      
      properties[name] = attr.value;
    });
    
    return properties;
  } catch (error) {
    console.error('[Entity API] Error extracting entity attributes:', error);
    return { type };
  }
}

/**
 * Generate HTML representation of all entities in state
 * Useful for Monaco editor and state visualization
 * @returns {string} HTML string representing all entities in state
 */
export function generateEntitiesHTML() {
  const state = getState();
  const entities = state.entities;
  let html = '';
  
  // Process each entity
  for (const uuid in entities) {
    // Skip missing entity data
    if (!entities[uuid]) continue;
    
    const entityData = entities[uuid];
    const type = entityData.type;
    
    // Skip entities without a type
    if (!type) continue;
    
    // Determine tag name based on entity type
    let tagName = '';
    
    // Standard primitives use a-{type} format
    const standardPrimitives = ['box', 'sphere', 'cylinder', 'plane', 'cone', 'ring', 'torus'];
    
    if (standardPrimitives.includes(type)) {
      tagName = `a-${type}`;
    } else if (COMPONENT_BASED_TYPES.includes(type)) {
      // Component-based types use a-entity with geometry component
      tagName = 'a-entity';
    } else {
      // Default to a-entity
      tagName = 'a-entity';
    }
    
    // Start tag
    html += `  <${tagName}`;
    
    // Add id attribute if present
    if (entityData.id) {
      html += ` id="${entityData.id}"`;
    }
    
    // Add data-entity-uuid
    html += ` data-entity-uuid="${uuid}"`;
    
    // Add DOM="true" attribute for entities created via DOM (helps with tracking)
    html += ` DOM="true"`;
    
    // Handle component-based types
    if (COMPONENT_BASED_TYPES.includes(type)) {
      html += ` geometry="primitive: ${type}`;
      
      // Add any geometry attributes from state
      if (entityData.geometry) {
        for (const key in entityData.geometry) {
          if (key !== 'primitive') {
            html += `; ${key}: ${entityData.geometry[key]}`;
          }
        }
      }
      
      html += '"';
    }
    
    // Add all other attributes
    for (const key in entityData) {
      const value = entityData[key];
      
      // Skip special attributes
      if (key === 'type' || key === 'id' || key === 'geometry' || value === undefined || value === null) {
        continue;
      }
      
      // Format attribute value
      html += ` ${key}="${_formatAttributeHTML(key, value)}"`;
    }
    
    // Close tag
    html += `></${tagName}>\n`;
  }
  
  return html;
}

/**
 * Format attribute value for HTML output
 * @private
 * @param {string} key - Attribute name
 * @param {any} value - Attribute value
 * @returns {string} Formatted attribute value
 */
function _formatAttributeHTML(key, value) {
  // Handle vector attributes
  if (['position', 'rotation', 'scale'].includes(key) && typeof value === 'object') {
    const vectorStr = positionToString(value);
    return vectorStr;
  }
  
  // Handle color objects
  if (key === 'color' && typeof value === 'object' && 'r' in value && 'g' in value && 'b' in value) {
    const colorStr = `rgb(${value.r}, ${value.g}, ${value.b})`;
    return colorStr;
  }
  
  // Handle objects
  if (typeof value === 'object') {
    const jsonStr = JSON.stringify(value);
    return jsonStr.replace(/"/g, '&quot;');
  }
  
  // Default string value
  return String(value);
} 