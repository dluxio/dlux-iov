/**
 * entity-api.js - Unified API for entity manipulation
 * 
 * This module provides a single interface for all entity operations,
 * ensuring that all state changes go through the watcher as the
 * single source of truth.
 */

import { getState, setState, updateEntityState } from './state.js';
import { generateEntityId, showNotification, EventManager } from './utils.js';
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
import { skyManager } from './sky-manager.js';

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

// Create an instance of EventManager for event handling
const eventManager = new EventManager();

// Local references to functions that will be imported dynamically
// to avoid circular dependencies
let _entitiesModule = null;
let _watcherModule = null;

// Store default properties for custom primitives
const customPrimitiveDefaults = {};

// Use standardized system entity IDs
const systemEntityIds = [...SYSTEM_ENTITY_IDS];

// DOM status tracking
let domStatus = 'uninitialized'; // possible values: uninitialized, synced, error, updating

/**
 * Set the DOM synchronization status
 * @param {string} status - The new status (synced, error, updating, uninitialized)
 */
function setDOMStatus(status) {
    domStatus = status;
    console.log(`[Entity API] DOM status set to: ${status}`);
    
    // Dispatch DOM status change event
    const event = new CustomEvent('dom-status-changed', {
        detail: { status, timestamp: Date.now() }
    });
    document.dispatchEvent(event);
}

/**
 * Get the current DOM synchronization status
 * @returns {string} The current status
 */
export function getDOMStatus() {
    return domStatus;
}

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
    
    // Initialize DOM status
    setDOMStatus('synced');
    
    console.log('Entity API initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize entity API:', error);
    setDOMStatus('error');
    return false;
  }
}

/**
 * Ensure watcher is available, with fallback logic for missing watcher
 * @private
 */
function _ensureWatcher() {
    const watcher = window.watcher;
    
    if (!watcher) {
        console.warn('[Entity API] Watcher not available, creating fallback implementation');
        // Create a minimal watcher with stub methods
        window.watcher = {
            save: (source) => {
                console.log(`[Entity API] Watcher save called (stub) from source: ${source}`);
                return Promise.resolve({});
            },
            getEntities: () => {
                const state = getState();
                return state.entities || {};
            },
            processEntity: (entity) => entity,
            findEntityByUUID: (uuid) => {
                const state = getState();
                return state.entities?.[uuid] || null;
            },
            saveEntitiesToState: (source) => {
                console.log(`[Entity API] Watcher saveEntitiesToState fallback called from source: ${source}`);
                // Get all entities with UUIDs from the DOM
                const entities = {};
                const scene = document.querySelector('a-scene');
                if (scene) {
                    const entityElements = scene.querySelectorAll('[data-entity-uuid]');
                    entityElements.forEach(el => {
                        const uuid = el.dataset.entityUuid;
                        // Skip the sky element - it's already managed separately in state.sky
                        if (uuid && !skyManager.isSkyEntity(el)) {
                            const type = el.tagName.toLowerCase().replace('a-', '');
                            entities[uuid] = {
                                uuid,
                                type,
                                ...extractEntityAttributes(el, type)
                            };
                        }
                    });
                }
                // Update state with collected entities
                setState({entities}, source);
                return entities;
            }
        };
        return window.watcher;
    }
    
    // Check if watcher has all the required methods
    const requiredMethods = ['save', 'getEntities', 'processEntity', 'findEntityByUUID', 'saveEntitiesToState'];
    const missingMethods = requiredMethods.filter(method => typeof watcher[method] !== 'function');
    
    if (missingMethods.length > 0) {
        console.warn(`[Entity API] Watcher missing required methods: ${missingMethods.join(', ')}, using fallback for these methods`);
        // Create fallback implementations for missing methods
        missingMethods.forEach(method => {
            switch (method) {
                case 'save':
                    watcher.save = (source) => {
                        console.log(`[Entity API] Watcher save fallback called from source: ${source}`);
                        return Promise.resolve({});
                    };
                    break;
                case 'getEntities':
                    watcher.getEntities = () => {
                        const state = getState();
                        return state.entities || {};
                    };
                    break;
                case 'processEntity':
                    watcher.processEntity = (entity) => entity;
                    break;
                case 'findEntityByUUID':
                    watcher.findEntityByUUID = (uuid) => {
                        const state = getState();
                        return state.entities?.[uuid] || null;
                    };
                    break;
                case 'saveEntitiesToState':
                    watcher.saveEntitiesToState = (source) => {
                        console.log(`[Entity API] Watcher saveEntitiesToState fallback called from source: ${source}`);
                        // Get all entities with UUIDs from the DOM
                        const entities = {};
                        const scene = document.querySelector('a-scene');
                        if (scene) {
                            const entityElements = scene.querySelectorAll('[data-entity-uuid]');
                            entityElements.forEach(el => {
                                const uuid = el.dataset.entityUuid;
                                // Skip the sky element - it's already managed separately in state.sky
                                if (uuid && !skyManager.isSkyEntity(el)) {
                                    const type = el.tagName.toLowerCase().replace('a-', '');
                                    entities[uuid] = {
                                        uuid,
                                        type,
                                        ...extractEntityAttributes(el, type)
                                    };
                                }
                            });
                        }
                        // Update state with collected entities
                        setState({entities}, source);
                        return entities;
                    };
                    break;
            }
        });
    }
    
    return watcher;
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
        // Create light component if it doesn't exist
        properties.light = properties.light || {};
        
        // Get the right light type - respect existing type if specified
        const lightType = properties.light.type || 'point';
        
        // Get defaults for this specific light type
        const lightDefaults = LIGHT_DEFAULTS[lightType] || LIGHT_DEFAULTS.point;
        
        // Apply defaults while preserving any existing values
        properties.light.type = lightType; // Preserve the original type
        properties.light.intensity = properties.light.intensity !== undefined ? properties.light.intensity : lightDefaults.intensity;
        properties.light.color = properties.light.color || lightDefaults.color;
        
        // Only apply distance for point and spot lights
        if (lightType === 'point' || lightType === 'spot') {
          properties.light.distance = properties.light.distance !== undefined ? 
            properties.light.distance : lightDefaults.distance;
        }
        
        // Apply position if it's a directional or spot light and position isn't set
        if ((lightType === 'directional' || lightType === 'spot') && 
            LIGHT_DEFAULTS[lightType]?.position && !properties.position) {
          properties.position = { ...LIGHT_DEFAULTS[lightType].position };
        }
        
        // Remove type as direct property if it was set there instead of in light component
        if (properties.type === 'directional' || properties.type === 'ambient' || 
            properties.type === 'point' || properties.type === 'spot') {
          delete properties.type;
        }
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
 * Recreate all entities in the scene from the current state
 * This completely rebuilds the scene based on the state
 * @returns {Promise<Array>} - Array of recreated entity elements
 */
export async function recreateAllEntities(entities = null, options = {}) {
    console.log('[Entity API] recreateAllEntities called with entities:', entities ? Object.keys(entities).length : 'null');
    
    // Verify we have a scene
    const scene = document.querySelector('a-scene');
    if (!scene) {
        console.error('[Entity API] Cannot recreate entities: No scene found');
        setDOMStatus('error');
        return false;
    }
    
    // Get entities from state if not provided
    const entitiesToRecreate = entities || getState().entities || {};
    
    // Check if we have any entities to recreate
    if (Object.keys(entitiesToRecreate).length === 0) {
        console.warn('[Entity API] No entities to recreate');
        return true;
    }
    
    try {
        console.log(`[Entity API] Starting recreation of ${Object.keys(entitiesToRecreate).length} entities`);
        
        // First, clear all existing entities to avoid duplicates
        // Use clearEntitiesAsync to ensure completion
        await clearEntitiesAsync();
        
        // Counter for tracking created entities
        let created = 0;
        let failed = 0;
        let systemEntities = 0;

        // Wait for a frame to ensure A-Frame is ready
        await new Promise(resolve => setTimeout(resolve, 10));

        // First pass: Create environment entities (lights, sky)
        const lightEntities = Object.entries(entitiesToRecreate)
            .filter(([uuid, data]) => data.type === 'entity' && data.light);
        
        console.log(`[Entity API] Creating ${lightEntities.length} light entities first`);
        
        for (const [uuid, entityData] of lightEntities) {
            try {
                // Create the entity - Important: directly use createEntityElement to bypass 
                // filtering for system entities like lights
                const element = await createEntityElement(entityData);
                if (element) {
                    created++;
                    console.log(`[Entity API] Created light entity: ${uuid}`);
                } else {
                    failed++;
                    console.warn(`[Entity API] Failed to create light entity: ${uuid}`);
                }
            } catch (err) {
                console.error(`[Entity API] Error creating light entity ${uuid}:`, err);
                failed++;
            }
        }
        
        // Wait for lights to be created
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Second pass: Create all other entities
        const otherEntities = Object.entries(entitiesToRecreate)
            .filter(([uuid, data]) => !(data.type === 'entity' && data.light));
        
        console.log(`[Entity API] Creating ${otherEntities.length} other entities`);
        
        for (const [uuid, entityData] of otherEntities) {
            try {
                // Check if it's a system entity
                if (shouldFilterEntity(entityData)) {
                    systemEntities++;
                    continue; // Skip system entities
                }
                
                // Create the entity
                const element = await createEntityElement(entityData);
                if (element) {
                    created++;
                } else {
                    failed++;
                    console.warn(`[Entity API] Failed to create entity: ${uuid}`);
                }
            } catch (err) {
                console.error(`[Entity API] Error creating entity ${uuid}:`, err);
                failed++;
            }
        }
        
        console.log(`[Entity API] Entity recreation complete: ${created} created, ${failed} failed, ${systemEntities} system entities skipped`);
        
        // Force a state update to ensure entity mapping is complete
        const state = getState();
        setState({
            entities: state.entities,
            entityMapping: state.entityMapping
        }, 'recreate-entities-complete');
        
        // Mark as DOM status synchronized with state
        setDOMStatus('synced');
        
        // Call DOM update complete event
        eventManager.emit('dom-update-complete', { 
            created, 
            failed,
            systemEntities
        });
        
        return true;
    } catch (error) {
        console.error('[Entity API] Error in recreateAllEntities:', error);
        setDOMStatus('error');
        return false;
    }
}

/**
 * Clear all non-system entities from the scene with a Promise
 * @returns {Promise<number>} Number of entities removed
 */
export function clearEntitiesAsync() {
    return new Promise(resolve => {
        console.log('[Entity API] Clearing non-system entities from scene');
        
        try {
            const scene = document.querySelector('a-scene');
            if (!scene) {
                console.error('[Entity API] No scene found for clearing entities');
                resolve(0);
                return;
            }
            
            // Get all entities with an id and data-entity-uuid
            const entities = Array.from(scene.querySelectorAll('[data-entity-uuid]'));
            let removedCount = 0;
            
            // First pass: detach from three.js scene to prevent rendering errors
            entities.forEach(entity => {
                // Skip system entities
                if (SYSTEM_ENTITY_IDS.includes(entity.id)) {
                    return;
                }
                
                // Check for system components
                if (SYSTEM_COMPONENTS.some(comp => entity.hasAttribute(comp))) {
                    return;
                }
                
                // Check for system data attributes
                if (SYSTEM_DATA_ATTRIBUTES.some(attr => entity.hasAttribute(attr))) {
                    return;
                }
                
                // Detach from three.js scene first to prevent renderer errors
                try {
                    if (entity.object3D) {
                        // Remove from three.js scene graph safely
                        if (entity.object3D.parent) {
                            entity.object3D.parent.remove(entity.object3D);
                        }
                        
                        // Clear any children to prevent dangling references
                        if (entity.object3D.children && entity.object3D.children.length > 0) {
                            // Clone the array since it might be modified during iteration
                            [...entity.object3D.children].forEach(child => {
                                entity.object3D.remove(child);
                            });
                        }
                    }
                } catch (detachError) {
                    console.warn('[Entity API] Error detaching entity from three.js scene:', detachError);
                }
            });
            
            // Short delay to let three.js finish any pending operations
            setTimeout(() => {
                // Second pass: remove entities from DOM
                entities.forEach(entity => {
                    // Skip system entities (same checks as above)
                    if (SYSTEM_ENTITY_IDS.includes(entity.id) || 
                        SYSTEM_COMPONENTS.some(comp => entity.hasAttribute(comp)) ||
                        SYSTEM_DATA_ATTRIBUTES.some(attr => entity.hasAttribute(attr))) {
                        return;
                    }
                    
                    // Remove from DOM safely
                    try {
                        if (entity.parentNode) {
                            entity.parentNode.removeChild(entity);
                            removedCount++;
                        }
                    } catch (removeError) {
                        console.warn('[Entity API] Error removing entity from DOM:', removeError);
                    }
                });
                
                console.log(`[Entity API] Removed ${removedCount} entities from scene`);
                resolve(removedCount);
            }, 50); // Slightly longer timeout for three.js cleanup
        } catch (error) {
            console.error('[Entity API] Error clearing entities:', error);
            resolve(0);
        }
    });
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
 * Check if an entity should be filtered out
 * @param {Object} entityData - Entity data from state
 * @returns {boolean} True if entity should be filtered out
 */
function shouldFilterEntity(entityData) {
  if (!entityData) return true;
  
  // Check if entity type is in filtered types
  if (FILTERED_ENTITY_TYPES.includes(entityData.type)) {
    return true;
  }
  
  // Check if entity ID is in filtered IDs
  if (entityData.id && FILTERED_ENTITY_IDS.includes(entityData.id)) {
    return true;
  }
  
  // Check for filtered components
  for (const component of FILTERED_COMPONENTS) {
    if (entityData[component]) {
      return true;
    }
  }
  
  // Check for filtered data attributes
  for (const attr of FILTERED_DATA_ATTRIBUTES) {
    if (entityData[attr]) {
      return true;
    }
  }
  
  return false;
}

/**
 * Create a DOM element for an entity from entity data
 * @param {Object} entityData - Entity data from state
 * @returns {Element} Created DOM element
 */
async function createEntityElement(entityData) {
  if (!entityData || !entityData.type) {
    console.error('[Entity API] Invalid entity data for element creation:', entityData);
    return null;
  }
  
  try {
    // Determine proper tag based on type
    const tagName = STANDARD_PRIMITIVES.includes(entityData.type) 
      ? `a-${entityData.type}` 
      : 'a-entity';
    
    // Create element
    const element = document.createElement(tagName);
    
    // Set ID and UUID
    if (entityData.id) {
      element.id = entityData.id;
    }
    element.setAttribute('data-entity-uuid', entityData.uuid);
    
    // Set all attributes
    Object.entries(entityData).forEach(([key, value]) => {
      // Skip special attributes
      if (key === 'type' || key === 'uuid' || key === 'id' || key === 'DOM') {
        return;
      }
      
      // Format vector attributes
      if (VECTOR_ATTRIBUTES.includes(key)) {
        element.setAttribute(key, vectorToString(value));
      } else if (key === 'light' && typeof value === 'object') {
        // Special handling for light components
        const lightAttrs = Object.entries(value)
          .map(([lightKey, lightValue]) => {
            // If the light value is a vector, convert to string
            if (lightValue && typeof lightValue === 'object' && 'x' in lightValue) {
              return `${lightKey}: ${lightValue.x} ${lightValue.y} ${lightValue.z}`;
            }
            return `${lightKey}: ${lightValue}`;
          })
          .join('; ');
        
        element.setAttribute('light', lightAttrs);
      } else if (typeof value === 'object') {
        element.setAttribute(key, JSON.stringify(value));
      } else {
        element.setAttribute(key, value);
      }
    });
    
    // Get scene and append the element to it
    const scene = document.querySelector('a-scene');
    if (!scene) {
      console.error('[Entity API] No scene found for adding entity');
      return null;
    }
    
    // Add entity-watcher component for change tracking
    element.setAttribute('entity-watcher', '');
    
    // Finally add to DOM
    scene.appendChild(element);
    console.log(`[Entity API] Added entity to scene: ${entityData.id || entityData.uuid}`);
    
    // Update DOM status of the entity in state
    try {
      const state = getState();
      if (state.entities && state.entities[entityData.uuid]) {
        // Update entity DOM status directly in the state object
        setState({
          entities: {
            ...state.entities,
            [entityData.uuid]: {
              ...state.entities[entityData.uuid],
              DOM: true
            }
          }
        }, 'createEntityElement');
      }
      
      // Add to entity mapping if not present
      if (entityData.id && state.entityMapping && !state.entityMapping[entityData.id]) {
        const updatedMapping = { ...state.entityMapping };
        updatedMapping[entityData.id] = entityData.uuid;
        setState({ entityMapping: updatedMapping }, 'createEntityElement-mapping');
      }
    } catch (stateError) {
      console.warn('[Entity API] Error updating entity state:', stateError);
    }
    
    return element;
  } catch (error) {
    console.error('[Entity API] Error creating entity element:', error);
    return null;
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
    
    // Use engine manager if it's initialized
    if (window.engineManager && window.engineManager.initialized) {
        return window.engineManager.isSystemEntity(entity, uuid);
    }
    
    // Legacy fallback behavior if engineManager is not available
    // This will eventually be removed
    
    // Check entity ID directly for common system entity IDs
    const systemIds = ['local-avatar', 'avatar-rig', 'avatar-camera', 'camera', 'sky'];
    if (entity.id && systemIds.some(id => entity.id.includes(id))) {
        return true;
    }
    
    // Check if entity type is a system entity type
    if (systemEntityIds.includes(entity.type)) {
        return true;
    }
    
    // Check for camera component which indicates a system entity
    if (entity.camera !== undefined) {
        return true;
    }
    
    // Check if entity is the sky entity from state
    const state = getState();
    if (state.sky && (uuid === state.sky.uuid || entity.type === 'sky')) {
        return true;
    }
    
    // Check if entity is a networked or auto-generated entity
    if (uuid && (uuid.startsWith('entity-entity-') || uuid.includes('avatar') || uuid.includes('camera') || uuid.includes('rig'))) {
        return true;
    }
    
    // Check if entity has networked component
    if (entity.networked) {
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

/**
 * Clear all non-system entities from the scene
 * @returns {number} Number of entities removed
 */
export function clearEntities() {
  console.log('[Entity API] Clearing non-system entities from scene');
  
  try {
    const scene = document.querySelector('a-scene');
    if (!scene) {
      console.error('[Entity API] No scene found for clearing entities');
      return 0;
    }
    
    // Get all entities with an id and data-entity-uuid
    const entities = Array.from(scene.querySelectorAll('[data-entity-uuid]'));
    let removedCount = 0;
    
    // First pass: detach from three.js scene to prevent rendering errors
    entities.forEach(entity => {
      // Skip system entities
      if (SYSTEM_ENTITY_IDS.includes(entity.id)) {
        return;
      }
      
      // Check for system components
      if (SYSTEM_COMPONENTS.some(comp => entity.hasAttribute(comp))) {
        return;
      }
      
      // Check for system data attributes
      if (SYSTEM_DATA_ATTRIBUTES.some(attr => entity.hasAttribute(attr))) {
        return;
      }
      
      // Detach from three.js scene first to prevent renderer errors
      try {
        if (entity.object3D) {
          // Remove from three.js scene graph safely
          if (entity.object3D.parent) {
            entity.object3D.parent.remove(entity.object3D);
          }
          
          // Clear any children to prevent dangling references
          if (entity.object3D.children && entity.object3D.children.length > 0) {
            // Clone the array since it might be modified during iteration
            [...entity.object3D.children].forEach(child => {
              entity.object3D.remove(child);
            });
          }
        }
      } catch (detachError) {
        console.warn('[Entity API] Error detaching entity from three.js scene:', detachError);
      }
    });
    
    // Short delay to let three.js finish any pending operations
    setTimeout(() => {
      // Second pass: remove entities from DOM
      entities.forEach(entity => {
        // Skip system entities (same checks as above)
        if (SYSTEM_ENTITY_IDS.includes(entity.id) || 
            SYSTEM_COMPONENTS.some(comp => entity.hasAttribute(comp)) ||
            SYSTEM_DATA_ATTRIBUTES.some(attr => entity.hasAttribute(attr))) {
          return;
        }
        
        // Remove from DOM safely
        try {
          if (entity.parentNode) {
            entity.parentNode.removeChild(entity);
            removedCount++;
          }
        } catch (removeError) {
          console.warn('[Entity API] Error removing entity from DOM:', removeError);
        }
      });
      
      console.log(`[Entity API] Removed ${removedCount} entities from scene`);
    }, 0);
    
    return entities.length; // Approximate count since actual removal happens after timeout
  } catch (error) {
    console.error('[Entity API] Error clearing entities:', error);
    return 0;
  }
} 