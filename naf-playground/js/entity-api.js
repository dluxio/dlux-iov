/**
 * entity-api.js - Unified API for entity manipulation
 * 
 * This module provides a single interface for all entity operations,
 * ensuring that all state changes go through the watcher as the
 * single source of truth.
 */

import { getState } from './state.js';
import { generateEntityId, showNotification } from './utils.js';
import { logAction } from './debug.js';
import {
  shouldSkipAttribute,
  parseVector,
  vectorToString,
  extractGeometryData,
  applyGeometryData,
  cleanEntityData,
  extractEntityAttributes
} from './entity-utils.js';

import {
  STANDARD_PRIMITIVES,
  VECTOR_ATTRIBUTES,
  GEOMETRY_ATTRIBUTES,
  COMPONENT_BASED_TYPES,
  VECTOR_DEFAULTS,
  GEOMETRY_DEFAULTS,
  LIGHT_DEFAULTS,
  SYSTEM_ENTITY_TYPES,
  SYSTEM_ENTITY_IDS,
  SYSTEM_COMPONENTS,
  SYSTEM_DATA_ATTRIBUTES,
  FILTERED_ENTITY_TYPES,
  FILTERED_ENTITY_IDS,
  FILTERED_COMPONENTS,
  FILTERED_DATA_ATTRIBUTES,
  UI_CONFIG
} from './config.js';

// Local references to functions that will be imported dynamically
// to avoid circular dependencies
let _entitiesModule = null;
let _watcherModule = null;

// Store default properties for custom primitives
const customPrimitiveDefaults = {};

// Use standardized system entity IDs
const systemEntityIds = [...SYSTEM_ENTITY_IDS];

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
    // Check if watcher exists
    if (!window.watcher) {
        console.error('[Entity API] Watcher not found, attempting to initialize...');
        // Try to initialize the watcher system
        import('./watcher.js').then(watcherModule => {
            if (watcherModule.startWatcher) {
                watcherModule.startWatcher();
            }
        }).catch(err => {
            console.error('[Entity API] Failed to initialize watcher:', err);
        });
        throw new Error('Watcher is not initialized. Please try again in a moment.');
    }

    // Check if watcher has required methods
    if (typeof window.watcher.saveEntitiesToState !== 'function') {
        console.error('[Entity API] Watcher missing required methods');
        throw new Error('Watcher is not properly initialized');
    }

    // Check if watcher is started
    if (window.watcher.start && !window.watcher.isStarted) {
        console.log('[Entity API] Starting inactive watcher');
        window.watcher.start();
    }

    return true;
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
    // Replace camera position/rotation references with default values
    const cameraPos = { ...VECTOR_DEFAULTS.position }; // Use default position
    const cameraRot = { ...VECTOR_DEFAULTS.rotation }; // Use default rotation
    
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
        properties.position = { ...VECTOR_DEFAULTS.position, x, y: 0, z };
      } else if (entityType === 'light') {
        properties.position = { ...VECTOR_DEFAULTS.position, x, y: cameraPos.y + 1, z };
      } else {
        properties.position = { ...VECTOR_DEFAULTS.position, x, y: cameraPos.y, z };
      }
    }
    
    // Set default color if not provided
    if (!properties.color && entityType !== 'light') {
      properties.color = _getRandomColor();
    }
    
    // Set entity-specific defaults using standardized constants
    if (GEOMETRY_DEFAULTS[entityType]) {
      Object.assign(properties, GEOMETRY_DEFAULTS[entityType]);
    }
    
    // Special cases for entities that need additional defaults
    switch (entityType) {
      case 'plane':
        properties.rotation = properties.rotation || { ...VECTOR_DEFAULTS.rotation, x: -90 };
        break;
      case 'light':
        const lightDefaults = LIGHT_DEFAULTS.point;
        properties.type = properties.type || 'point';
        properties.intensity = properties.intensity || lightDefaults.intensity;
        properties.distance = properties.distance || lightDefaults.distance;
        properties.color = properties.color || lightDefaults.color;
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
 * @returns {Object} Object with the created element and UUID
 */
async function _createEntityDirectly(type, properties, semanticType = null) {
  // Extract properties to avoid modifying the original
  const propsToApply = { ...properties };
  
  // Generate UUID using semantic type if provided, otherwise use type
  const uuid = propsToApply._preserveUuid || generateEntityId(semanticType || type);
  
  // Create the element
  const element = document.createElement(type.startsWith('a-') ? type : `a-${type}`);
  
  // Set UUID in dataset
  element.dataset.entityUuid = uuid;
  
  // Set ID if not already set
  if (!element.id) {
    element.id = uuid;
  }
  
  // Handle geometry data first
  if (propsToApply.geometry || GEOMETRY_ATTRIBUTES.some(attr => attr in propsToApply)) {
    applyGeometryData(element, propsToApply.geometry || propsToApply, type);
    
    // Remove geometry properties since they're handled
    if (propsToApply.geometry) delete propsToApply.geometry;
    GEOMETRY_ATTRIBUTES.forEach(attr => delete propsToApply[attr]);
  }
  
  // Apply remaining properties
  Object.entries(propsToApply).forEach(([key, value]) => {
    // Skip null/undefined values and internal properties
    if (value === null || value === undefined || key === '_preserveUuid') return;
    
    // Format vector attributes
    if (VECTOR_ATTRIBUTES.includes(key)) {
      element.setAttribute(key, vectorToString(value));
    } else if (typeof value === 'object') {
      element.setAttribute(key, JSON.stringify(value));
    } else {
      element.setAttribute(key, value);
    }
  });
  
  // Add to scene
  const scene = document.querySelector('a-scene');
  if (!scene) {
    throw new Error('Scene not found');
  }
  scene.appendChild(element);
  
  return { element, uuid };
}

/**
 * Create a new entity
 * @param {string} type - Entity type (box, sphere, etc.)
 * @param {Object} properties - Entity properties
 * @param {string} [semanticType] - Optional semantic type
 * @returns {Promise<Object>} Created entity data
 */
export async function createEntity(type, properties = {}, semanticType) {
    // Skip creation of cursor entities as they are managed by A-Frame
    if (type === 'cursor') {
        console.warn(`Skipping creation of ${type} entity as it is managed by A-Frame`);
        return null;
    }
    
    console.log(`[Entity API] Creating entity of type: ${type}`);
    
    try {
        // Ensure watcher is available
        _ensureWatcher();
        
        // Get default properties
        const finalProperties = _getDefaultProperties(type, properties);
        
        // Create the entity directly
        const { element, uuid } = await _createEntityDirectly(type, finalProperties, semanticType);
        
        if (!element) {
            throw new Error('Failed to create entity element');
        }
        
        // Wait for entity to be initialized by A-Frame
        await new Promise((resolve, reject) => {
            // If element is already loaded, resolve immediately
            if (element.hasLoaded || element.components) {
                resolve();
                return;
            }
            
            // Otherwise wait for loaded event with timeout
            const timeout = setTimeout(() => {
                console.log(`[Entity API] Entity load timeout for ${uuid}, continuing anyway`);
                resolve();
            }, 1000);
            
            element.addEventListener('loaded', () => {
                clearTimeout(timeout);
                resolve();
            }, { once: true });
        });

        // Flush all components to the DOM to ensure default values are captured
        if (element.components) {
            Object.values(element.components).forEach(component => {
                if (component.flushToDOM) {
                    component.flushToDOM();
                }
            });
        }
        
        // Explicitly save state after entity creation
        console.log(`[Entity API] Saving state after creating entity ${uuid}`);
        await window.watcher.saveEntitiesToState('entity-api-create');
        
        // Return the created entity data
        return {
            uuid,
            element,
            type,
            properties: finalProperties
        };
    } catch (error) {
        console.error('[Entity API] Error creating entity:', error);
        throw error;
    }
}

/**
 * Update an existing entity's properties
 * @param {string} uuid - Entity UUID
 * @param {Object} properties - New or updated properties
 * @returns {boolean} Success status
 */
export async function updateEntity(uuid, properties) {
    // Skip updates to cursor entities
    const entity = getState().entities[uuid];
    if (entity && entity.type === 'cursor') {
        console.warn(`Skipping update of ${entity.type} entity as it is managed by A-Frame`);
        return null;
    }
    
    console.log(`[Entity API] Updating entity ${uuid}`, properties);
    
    try {
        // Check if entity exists
        const entityElement = document.querySelector(`[data-entity-uuid="${uuid}"]`);
        if (!entityElement) {
            console.error(`[Entity API] Entity ${uuid} not found`);
            return false;
        }
        
        // Handle geometry data first
        if (properties.geometry || GEOMETRY_ATTRIBUTES.some(attr => attr in properties)) {
            applyGeometryData(entityElement, properties.geometry || properties, properties.type);
            
            // Remove geometry properties since they're handled
            if (properties.geometry) delete properties.geometry;
            GEOMETRY_ATTRIBUTES.forEach(attr => delete properties[attr]);
        }
        
        // Apply remaining properties
        Object.entries(properties).forEach(([key, value]) => {
            // Skip null/undefined values and type property
            if (value === null || value === undefined || key === 'type') return;
            
            // Format vector attributes
            if (VECTOR_ATTRIBUTES.includes(key)) {
                entityElement.setAttribute(key, vectorToString(value));
            } else if (typeof value === 'object') {
                entityElement.setAttribute(key, JSON.stringify(value));
            } else {
                entityElement.setAttribute(key, value);
            }
        });
        
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
    // Skip deletion of cursor entities
    const entity = getState().entities[uuid];
    if (entity && entity.type === 'cursor') {
        console.warn(`Skipping deletion of ${entity.type} entity as it is managed by A-Frame`);
        return false;
    }
    
    console.log(`[Entity API] Deleting entity ${uuid}`);
    
    // Ensure modules are loaded
    if (!_entitiesModule) await initEntityAPI();
    
    try {
        // Find the entity in the DOM
        const entityElement = document.querySelector(`[data-entity-uuid="${uuid}"]`);
        
        // Remove from DOM if found
        if (entityElement && entityElement.parentNode) {
            entityElement.parentNode.removeChild(entityElement);
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
      // Only remove non-system entities using standardized filters
      if (!SYSTEM_ENTITY_IDS.includes(entity.id)) {
        entity.parentNode.removeChild(entity);
      }
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

    // Flush all entity components to the DOM before saving state
    const allEntities = scene.querySelectorAll('[data-entity-uuid]');
    allEntities.forEach(entity => {
      if (entity.components) {
        Object.values(entity.components).forEach(component => {
          if (component.flushToDOM) {
            component.flushToDOM();
          }
        });
      }
    });
    
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
    
    // Find all entities using standardized selectors
    const entitySelectors = [
        'a-entity',
        ...STANDARD_PRIMITIVES.map(type => `a-${type}`),
        'a-sky'
    ].join(', ');
    const entityElements = scene.querySelectorAll(entitySelectors);
    
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
        const entityData = extractEntityAttributes(element, type);
        updatedEntities[newUuid] = entityData;
        hasChanges = true;
      } else {
        // Ensure this UUID is in state
        if (!state.entities[uuid]) {
          console.log(`[Entity API] Found entity with UUID ${uuid} but missing from state, adding it`);
          const tagName = element.tagName.toLowerCase();
          const type = tagName.startsWith('a-') ? tagName.substring(2) : tagName;
          const entityData = extractEntityAttributes(element, type);
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
 * Check if an entity is a system entity
 * @param {Object} entity - Entity data from state
 * @param {string} uuid - Entity UUID
 * @returns {boolean} True if entity is a system entity
 */
function isSystemEntity(entity, uuid) {
    if (!entity) return false;
    
    // Check if entity type is in systemEntityIds
    if (systemEntityIds.includes(entity.type)) {
        return true;
    }
    
    // Check if entity is the sky entity from state
    const state = getState();
    if (state.sky && (uuid === state.sky.uuid || entity.type === SYSTEM_ENTITY_TYPES.SKY)) {
        return true;
    }
    
    // Check if entity is a networked or auto-generated entity
    if (uuid.startsWith('entity-entity-') || entity.networked) {
        return true;
    }
    
    return false;
}

/**
 * Generate HTML for a single entity
 * @param {Object} entity - Entity data from state
 * @param {string} uuid - Entity UUID
 * @returns {string} HTML string
 */
function generateEntityHTML(entity, uuid) {
    if (!entity || !entity.type) {
        console.warn('[EntityAPI] Invalid entity data:', entity);
        return '';
    }

    // Skip system entities
    if (isSystemEntity(entity, uuid)) {
        console.log(`[EntityAPI] Skipping system entity: ${entity.type} (${uuid})`);
        return '';
    }

    // Determine tag name - standard primitives use a-{type}, others use a-entity
    const tagName = STANDARD_PRIMITIVES.includes(entity.type) 
        ? `a-${entity.type}` 
        : 'a-entity';

    // Start tag
    let html = `  <${tagName}`;

    // Add required attributes
    if (entity.id) html += ` id="${entity.id}"`;
    html += ` data-entity-uuid="${uuid}"`;
    html += ` DOM="true"`;

    // Add all attributes except special ones
    Object.entries(entity).forEach(([key, value]) => {
        // Skip special attributes
        if (key === 'type' || key === 'id' || key === 'uuid' || shouldSkipAttribute(key)) {
            return;
        }

        // Format value based on type
        let formattedValue;
        if (VECTOR_ATTRIBUTES.includes(key)) {
            formattedValue = vectorToString(value);
        } else if (typeof value === 'object') {
            formattedValue = JSON.stringify(value);
        } else {
            formattedValue = value.toString();
        }

        // Add attribute with proper quote handling
        const quoteChar = formattedValue.includes('"') ? "'" : '"';
        html += ` ${key}=${quoteChar}${formattedValue}${quoteChar}`;
    });

    // Close tag
    html += `></${tagName}>\n`;

    return html;
}

/**
 * Generate HTML for all entities in state
 * @returns {string} HTML string
 */
export function generateEntitiesHTML() {
    const state = getState();
    const entities = state.entities || {};
    let html = '';
    
    // Process each entity
    Object.entries(entities).forEach(([uuid, entity]) => {
        // Generate entity HTML (system entities are filtered in generateEntityHTML)
        html += generateEntityHTML(entity, uuid);
    });
    
    return html;
} 