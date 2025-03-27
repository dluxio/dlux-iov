/**
 * Entities.js - Entity creation and management
 * 
 * This module provides a generalized system for adding entities to the A-Frame scene.
 * 
 * === USAGE ===
 * 
 * 1. Basic entity creation:
 *    - Use addEntity(type, properties) for any primitive type
 *      Example: addEntity('box', { color: 'red', position: { x: 0, y: 1, z: -3 } })
 * 
 * 2. Custom primitives:
 *    - Register custom primitives with registerPrimitiveType(type, defaultProps)
 *      Example: registerPrimitiveType('torus', { radius: 1, 'radius-tubular': 0.1 })
 *    - Then use addEntity() with your custom type
 *      Example: addEntity('torus', { color: 'blue' })
 * 
 * === DEFAULT BEHAVIORS ===
 * 
 * - All entities will get random colors unless a specific color is provided
 * - Position defaults are set to prevent entities from falling through the floor
 * - Custom primitive types can be added easily via registerPrimitiveType()
 */

import { getState, setState } from './state.js';
import { logAction } from './debug.js';
import { generateEntityId, logDeprecationWarning } from './utils.js';
import { skyManager } from './sky-manager.js';
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
  VECTOR_ATTRIBUTES,
  GEOMETRY_ATTRIBUTES,
  COMPONENT_BASED_TYPES,
  VECTOR_DEFAULTS,
  GEOMETRY_DEFAULTS,
  DEFAULT_SKY_COLOR,
  LIGHT_DEFAULTS,
  DEFAULT_ENTITY_COLOR
} from './config.js';

// Store default properties for custom primitives
const customPrimitiveDefaults = {};

/**
 * Setup custom primitives and their default properties
 * This allows for extending the system with new entity types
 */
function setupCustomPrimitives() {
    console.log('Setting up custom primitives...');
    
    // Example: Register a custom primitive for a chair
    customPrimitiveDefaults['chair'] = {
        position: { x: 0, y: 0.5, z: -3 },
        color: '#8B4513',  // Brown
        height: 0.8,
        width: 0.5,
        depth: 0.5
    };
    
    // Add more custom primitives as needed
    
    console.log('Custom primitives setup complete:', Object.keys(customPrimitiveDefaults));
}

/**
 * Initialize the entities module
 * @returns {Promise} A promise that resolves when initialization is complete
 */
export function initEntities() {
    console.log('Initializing entities module...');
    
    try {
        // Set up custom primitive defaults
        setupCustomPrimitives();
        
        // Ensure all entities have UUIDs during initialization
        setTimeout(() => {
            ensureEntityUUIDs();
        }, 1000); // Short delay to ensure scene is loaded
        
        return Promise.resolve();
    } catch (error) {
        console.error('Error initializing entities module:', error);
        return Promise.resolve();
    }
}

/**
 * Create a new entity and add it to the scene
 * @param {string} type - DOM element type (box, sphere, entity, etc.)
 * @param {Object} properties - Entity properties
 * @param {string} [semanticType] - Semantic entity type for ID generation (e.g., "dodecahedron")
 * @returns {Object} Object containing the entity element and its UUID
 * @deprecated Use createEntity from entity-api.js instead
 */
export function createEntity(type, properties, semanticType) {
    logDeprecationWarning('createEntity', 'createEntity', 'entity-api.js');
    console.log(`Creating entity: ${type}${semanticType ? ` (${semanticType})` : ''}`, properties);
    
    try {
        // Extract user-provided ID if available
        const userProvidedId = properties.id;
        
        // Generate a unique UUID for this entity using the centralized function
        // Use semanticType for ID generation if provided, otherwise use type
        const idType = semanticType || type;
        const uuid = generateEntityId(idType, { userId: userProvidedId });
        
        // Create the element
        const entityElement = document.createElement(`a-${type}`);
        
        // Set UUID in dataset for DOM-state mapping
        entityElement.dataset.entityUuid = uuid;
        
        // Set ID based on UUID for consistency
        entityElement.id = uuid;
        
        // Remove id from properties to avoid duplicate attributes
        if (properties.id) {
            const propsCopy = {...properties};
            delete propsCopy.id;
            properties = propsCopy;
        }
        
        // Set attributes based on properties
        setEntityAttributes(entityElement, properties);
        
        // Add the entity-watcher component BEFORE adding to scene
        // This ensures the watcher component is initialized properly
        entityElement.setAttribute('entity-watcher', '');
        
        // Add to scene
        const scene = document.querySelector('a-scene');
        if (!scene) {
            console.error('A-Scene not found when trying to add entity');
            return { element: null, uuid: null };
        }
        
        scene.appendChild(entityElement);
        console.log(`Entity with UUID ${uuid} added to scene`, entityElement);
        
        // Don't force flushToDOM to avoid writing all default attributes
        // But ensure the watcher has a chance to detect the new entity
        if (window.watcher && typeof window.watcher.save === 'function') {
            // Short delay to allow A-Frame to process the entity
            setTimeout(() => {
                window.watcher.save();
            }, 100);
        }
        
        return { element: entityElement, uuid };
    } catch (error) {
        console.error('Error creating entity:', error);
        return { element: null, uuid: null };
    }
}

/**
 * Set attributes on an entity from properties object
 * @param {Element} entity - A-Frame entity element
 * @param {Object} properties - Properties to set
 */
function setEntityAttributes(entity, properties) {
    const tagName = entity.tagName.toLowerCase();
    const id = entity.id;
    
    console.log(`Setting attributes for ${tagName} id=${id}`, properties);
    
    // Handle geometry data first
    if (properties.geometry || GEOMETRY_ATTRIBUTES.some(attr => attr in properties)) {
        applyGeometryData(entity, properties.geometry || properties, properties.type);
    }
    
    // Set all other properties
    Object.entries(properties).forEach(([key, value]) => {
        // Skip geometry properties as they're already handled
        if (key === 'geometry' || GEOMETRY_ATTRIBUTES.includes(key)) return;
        
        // Skip type property as it's not an actual attribute
        if (key === 'type') return;
        
        // Skip null/undefined values
        if (value === null || value === undefined) return;
        
        // Format vector attributes
        if (VECTOR_ATTRIBUTES.includes(key)) {
            entity.setAttribute(key, vectorToString(value));
        } else if (typeof value === 'object') {
            entity.setAttribute(key, JSON.stringify(value));
        } else {
            entity.setAttribute(key, value);
        }
    });
}

/**
 * Format properties for storage in state
 * @param {string} type - Entity type
 * @param {Object} properties - Entity properties
 * @returns {Object} - Formatted properties
 */
function formatPropertiesForState(type, properties) {
    const stateProperties = {
        type,
        ...properties
    };
    
    return stateProperties;
}

/**
 * Delete an entity from the scene
 * @param {string} uuid - UUID of the entity to delete
 * @returns {boolean} Whether the deletion was successful
 * @deprecated Use deleteEntity from entity-api.js instead
 */
export function deleteEntity(uuid) {
    logDeprecationWarning('deleteEntity', 'deleteEntity', 'entity-api.js');
    try {
        console.log(`Deleting entity with UUID: ${uuid}`);
        
        // Find the entity in the DOM
        const entity = document.querySelector(`[data-entity-uuid="${uuid}"]`);
        
        if (!entity) {
            console.warn(`Entity with UUID ${uuid} not found in DOM for deletion`);
            
            // Update state to ensure it's removed there as well
            updateStateAfterEntityChange('delete', uuid);
            
            return false;
        }
        
        // Remove from DOM
        entity.parentNode.removeChild(entity);
        console.log(`Entity with UUID ${uuid} removed from DOM`);
        
        // Update state
        updateStateAfterEntityChange('delete', uuid);
        
        logAction(`Deleted entity ${uuid}`);
        
        return true;
    } catch (error) {
        console.error(`Error deleting entity with UUID ${uuid}:`, error);
        return false;
    }
}

/**
 * Update the state after an entity change operation
 * @param {string} operation - Type of operation (delete, update, etc.)
 * @param {string} uuid - Entity UUID
 */
function updateStateAfterEntityChange(operation, uuid) {
    // Require the watcher to update state
    if (window.watcher && typeof window.watcher.saveEntitiesToState === 'function') {
        console.log(`Using watcher to update state after ${operation} for entity ${uuid}`);
        window.watcher.saveEntitiesToState(`entity-${operation}`);
        return;
    }
    
    // Throw error if watcher is not available - it's now required
    throw new Error(`Watcher is required but not available for ${operation} of entity ${uuid}`);
}

/**
 * Update an entity's attributes
 * @param {string} uuid - Entity UUID
 * @param {Object} updates - Attribute updates
 * @returns {boolean} Success status
 * @deprecated Use updateEntity from entity-api.js instead
 */
export function updateEntity(uuid, updates) {
    logDeprecationWarning('updateEntity', 'updateEntity', 'entity-api.js');
    try {
        console.log(`Updating entity with UUID: ${uuid}`, updates);
        
        // Check if entity exists
        const entity = findEntityElementByUUID(uuid);
        if (!entity) {
            console.error(`Entity with UUID ${uuid} not found for update`);
            return false;
        }
        
        // Update entity attributes
        setEntityAttributes(entity, updates);
        
        // If entity is an A-Frame entity, update A-Frame specific properties
        if (entity.tagName.toLowerCase().startsWith('a-')) {
            // If specific attributes need A-Frame specific handling, do it here
            // For example, if setting material color
            if (updates.color) {
                entity.setAttribute('color', updates.color);
            }
            
            // If updating position, rotation, scale
            if (updates.position) {
                entity.setAttribute('position', vectorToString(updates.position));
            }
            if (updates.rotation) {
                entity.setAttribute('rotation', vectorToString(updates.rotation));
            }
            if (updates.scale) {
                entity.setAttribute('scale', vectorToString(updates.scale));
            }
            
            // Get the tag name to determine entity type
            const tagName = entity.tagName.toLowerCase();
            const type = tagName.startsWith('a-') ? tagName.substring(2) : tagName;
            const finalProperties = extractEntityAttributes(entity, type);
        }
        
        // Update state using watcher
        if (window.watcher && typeof window.watcher.saveEntitiesToState === 'function') {
            window.watcher.saveEntitiesToState('entity-update');
        } else {
            throw new Error('Watcher is required but not available for entity update');
        }
        
        // Update code editor
        updateMonacoSafely();
        
        logAction(`Updated entity: ${uuid}`);
        
        return true;
    } catch (error) {
        console.error(`Error updating entity ${uuid}:`, error);
        return false;
    }
}

/**
 * Find entity element by UUID
 * @param {string} uuid - Entity UUID
 * @returns {Element|null} DOM element or null if not found
 * @deprecated Use getEntityElement from entity-api.js instead
 */
export function findEntityElementByUUID(uuid) {
    logDeprecationWarning('findEntityElementByUUID', 'getEntityElement', 'entity-api.js');
    return getEntityElement(uuid);
}

/**
 * Recreate entities from state - This creates DOM elements from state data
 * @param {Object} entitiesState - Optional: specific entities state to use (if not provided, use current state)
 * 
 * ID Generation Pattern:
 * - Entities are assigned consistent IDs in the format `type-entity-N` (e.g., box-entity-1, sphere-entity-2)
 * - User-provided IDs from the code panel are preserved
 * - IDs remain consistent across scene recreation, enabling reliable selection and manipulation
 * 
 * @deprecated Use recreateAllEntities from entity-api.js instead
 */
export function recreateEntitiesFromState(entitiesState) {
    logDeprecationWarning('recreateEntitiesFromState', 'recreateAllEntities', 'entity-api.js');
    // If no specific state provided, use current state
    if (!entitiesState) {
        const state = getState();
        entitiesState = state.entities || {};
    }
    
    // Get the scene
    const scene = document.querySelector('a-scene');
    if (!scene) {
        console.error('No A-Frame scene found when recreating entities');
        return;
    }
    
    try {
        // First, handle special case for sky (look it up by UUID prefix and type)
        let skyUUID = null;
        for (const uuid in entitiesState) {
            if (entitiesState[uuid].type === 'sky') {
                skyUUID = uuid;
                break;
            }
        }
        
        // Handle sky entity
        if (skyUUID && entitiesState[skyUUID]) {
            const skyData = entitiesState[skyUUID];
            console.log('Handling sky element from state:', skyData);
            
            // Find existing sky or create a new one
            let skyElement = scene.querySelector('a-sky');
            
            if (!skyElement) {
                console.log('Creating new sky element');
                skyElement = document.createElement('a-sky');
                scene.appendChild(skyElement);
            } else {
                console.log('Using existing sky element:', skyElement.outerHTML);
            }
            
            // Set the UUID in dataset
            skyElement.dataset.entityUuid = skyUUID;
            
            // Set the color attribute (this is a special case for sky)
            if (skyData.color) {
                console.log(`Setting sky color to ${skyData.color}`);
                skyElement.setAttribute('color', skyData.color);
            } else {
                // Default color
                console.log('Using default color for sky (#ECECEC)');
                skyElement.setAttribute('color', '#ECECEC');
            }
            
            // Flush to DOM to ensure attributes are set
            skyElement.flushToDOM();
            
            // Remove sky from entities to prevent double processing
            const processedEntities = { ...entitiesState };
            delete processedEntities[skyUUID];
            entitiesState = processedEntities;
        } else {
            console.log('No sky data in state, ensuring default sky exists');
            
            // Find existing sky or create a new one with default values
            let skyElement = scene.querySelector('a-sky');
            
            if (!skyElement) {
                console.log('Creating default sky element');
                skyElement = document.createElement('a-sky');
                skyElement.dataset.entityUuid = generateEntityId();
                skyElement.setAttribute('color', DEFAULT_SKY_COLOR);
                scene.appendChild(skyElement);
                skyElement.flushToDOM();
            } else if (!skyElement.getAttribute('color')) {
                // Ensure sky has color if it exists
                console.log('Adding default color to existing sky element');
                skyElement.setAttribute('color', DEFAULT_SKY_COLOR);
                skyElement.flushToDOM();
            }
        }
        
        // Find all entities in the scene, except sky which we've already handled
        const currentEntities = Array.from(scene.querySelectorAll('[data-entity-uuid]')).filter(entity => {
            // Skip system entities
            const tagName = entity.tagName.toLowerCase();
            if (['a-scene', 'a-assets'].includes(tagName)) {
                return false;
            }
            
            // Skip system entities
            if (['default-light', 'directional-light', 'sky', 'naf-template'].includes(entity.id)) {
                return false;
            }
            
            // Skip the sky as we've already handled it
            if (tagName === 'a-sky') {
                return false;
            }
            
            // Skip assets and templates
            if (entity.closest('a-assets') || tagName === 'template') {
                return false;
            }
            
            return true;
        });
        
        console.log(`Found ${currentEntities.length} entities to potentially remove`);
        
        // Remove all current entities safely
        currentEntities.forEach(entity => {
            try {
                if (entity.parentNode === scene) {
                    console.log(`Removing entity: ${entity.dataset.entityUuid}`);
                    scene.removeChild(entity);
                } else {
                    console.log(`Skipping entity not directly in scene: ${entity.dataset.entityUuid} (parent: ${entity.parentNode?.tagName || 'unknown'})`);
                }
            } catch (err) {
                console.warn(`Error removing entity ${entity.dataset.entityUuid}:`, err);
            }
        });
        
        // Create entities from state
        Object.keys(entitiesState).forEach(uuid => {
            try {
                const entityData = entitiesState[uuid];
                const type = entityData.type;
                
                // Skip if no type (should not happen)
                if (!type) {
                    console.error(`Entity ${uuid} has no type`, entityData);
                    return;
                }
                
                // Skip the sky (already handled)
                if (type === 'sky') {
                    return;
                }
                
                // Check if entity already exists by UUID
                const existingEntity = findEntityElementByUUID(uuid);
                if (existingEntity) {
                    console.log(`Entity ${uuid} already exists, updating instead of recreating`);
                    // Update existing entity attributes instead
                    const properties = { ...entityData };
                    delete properties.type;
                    setEntityAttributes(existingEntity, properties);
                    return;
                }
                
                // Special handling for non-standard primitives that need geometry component
                let entityElement;
                
                // For dodecahedron and other component-based types
                if (COMPONENT_BASED_TYPES.includes(type)) {
                    // Create as a regular entity with geometry component
                    entityElement = document.createElement('a-entity');
                    
                    // Set the geometry component explicitly
                    const geometryData = entityData.geometry || { primitive: type };
                    if (!geometryData.primitive) {
                        geometryData.primitive = type;
                    }
                    
                    // Set radius if available
                    if (entityData.radius && !geometryData.radius) {
                        geometryData.radius = entityData.radius;
                    }
                    
                    // Set the geometry component
                    entityElement.setAttribute('geometry', geometryData);
                    
                    // Store semantic type in dataset for future reference
                    entityElement.dataset.entityType = type;
                } else {
                    // Standard primitives can be created directly
                    entityElement = document.createElement(`a-${type}`);
                }
                
                // Set UUID in dataset
                entityElement.dataset.entityUuid = uuid;
                
                // Give it an ID for backward compatibility if not already using UUID as ID
                if (entityElement.id !== uuid) {
                    entityElement.id = uuid;
                }
                
                // Copy entity data except 'type' and 'geometry' (handled separately for special types)
                const properties = { ...entityData };
                delete properties.type;
                if (COMPONENT_BASED_TYPES.includes(type)) {
                    delete properties.geometry;
                }
                
                // Set remaining attributes
                setEntityAttributes(entityElement, properties);
                
                // Add to scene
                console.log(`Adding entity to scene: ${uuid} (${type})`);
                scene.appendChild(entityElement);
                
                // Add the entity-watcher component to ensure it's tracked
                if (!entityElement.hasAttribute('entity-watcher')) {
                    entityElement.setAttribute('entity-watcher', '');
                }
                
                // No longer directly update entity mapping here, let watcher handle it
            } catch (err) {
                console.error(`Error creating entity ${uuid}:`, err);
            }
        });
        
        // After recreating all entities, trigger a watcher save to ensure consistency
        if (window.watcher && typeof window.watcher.saveEntitiesToState === 'function') {
            setTimeout(() => {
                window.watcher.saveEntitiesToState('recreate-from-state');
            }, 300); // Small delay to allow A-Frame to process all entity creations
        } else {
            throw new Error('Watcher is required but not available for recreating entities from state');
        }
        
        logAction('Recreated entities from state');
    } catch (error) {
        console.error('Error recreating entities from state:', error);
    }
}

/**
 * Format an attribute-value pair for HTML output
 * This is a centralized utility for formatting entity attributes as HTML
 * @param {string} key - The attribute name
 * @param {any} value - The attribute value
 * @returns {string} Formatted HTML attribute string
 */
function formatAttributeHTML(key, value) {
    // Skip null/undefined values
    if (value === null || value === undefined) return '';
    
    let formattedValue;
    
    // Format vector attributes
    if (VECTOR_ATTRIBUTES.includes(key)) {
        formattedValue = vectorToString(value);
    }
    // Handle objects
    else if (typeof value === 'object') {
        try {
            formattedValue = JSON.stringify(value);
        } catch (e) {
            console.warn(`Could not stringify object value for ${key}`, e);
            formattedValue = value.toString();
        }
    }
    // Handle simple values
    else {
        formattedValue = value.toString();
    }
    
    // Use appropriate quotes based on value content
    const quoteChar = formattedValue.includes('"') ? "'" : '"';
    return ` ${key}=${quoteChar}${formattedValue}${quoteChar}`;
}

/**
 * Generate HTML representation of all entities in state
 * @returns {string} HTML string representing all entities in state
 */
export function generateEntitiesHTML() {
    const state = getState();
    const entities = state.entities;
    let html = '';
    
    Object.keys(entities).forEach(uuid => {
        const entityData = entities[uuid];
        if (!entityData || !entityData.type) return;
        
        // Clean and standardize the data
        const cleanedData = cleanEntityData(entityData);
        const type = cleanedData.type;
        
        // Determine if this is a component-based type
        const isComponentBased = COMPONENT_BASED_TYPES.includes(type);
        const hasExplicitGeometry = cleanedData.geometry && Object.keys(cleanedData.geometry).length > 0;
        
        // Determine tag name
        const tagName = (isComponentBased || hasExplicitGeometry) ? 'a-entity' : `a-${type}`;
        
        // Start tag
        html += `  <${tagName}`;
        
        // Add ID if we have a mapping
        if (state.entityMapping) {
            for (const id in state.entityMapping) {
                if (state.entityMapping[id] === uuid) {
                    html += ` id="${id}"`;
                    break;
                }
            }
        }
        
        // Add UUID and DOM attributes
        html += ` data-entity-uuid="${uuid}"`;
        html += ` DOM="true"`;
        
        // Add all other attributes
        Object.entries(cleanedData).forEach(([key, value]) => {
            // Skip special attributes
            if (key === 'type' || key === 'id' || shouldSkipAttribute(key)) return;
            
            // Handle geometry specially for component-based types
            if (key === 'geometry') {
                if (isComponentBased || hasExplicitGeometry) {
                    const geometryData = { ...value };
                    if (isComponentBased) {
                        geometryData.primitive = type;
                    }
                    html += formatAttributeHTML('geometry', geometryData);
                }
                return;
            }
            
            // Format and add other attributes
            html += formatAttributeHTML(key, value);
        });
        
        // Close tag
        html += `></${tagName}>\n`;
    });
    
    return html || '\n';
}

/**
 * Update the Monaco editor safely using a retry mechanism
 */
function updateMonacoSafely(retryCount = 0, maxRetries = 3) {
    console.log(`Attempting to update Monaco editor (attempt ${retryCount + 1}/${maxRetries + 1})`);
    
    // Dynamic import to avoid circular dependencies
    import('./monaco.js').then(monaco => {
        try {
            // Check if editor instance is available
            const editorInstance = monaco.getEditorInstance ? monaco.getEditorInstance() : null;
            
            if (editorInstance) {
                console.log('Monaco editor instance found, updating content');
                monaco.updateMonacoEditor();
            } else if (window._fallbackMonacoEditor && monaco.setEditorInstance) {
                console.log('Using fallback Monaco editor for update');
                monaco.setEditorInstance(window._fallbackMonacoEditor);
                monaco.updateMonacoEditor();
            } else if (retryCount < maxRetries) {
                console.log('Monaco editor not available, will retry after delay');
                setTimeout(() => updateMonacoSafely(retryCount + 1, maxRetries), 1000);
            } else if (window.sceneBuilderDebug && window.sceneBuilderDebug.forceEditorUpdate) {
                console.log('Using debug function to force editor update as last resort');
                window.sceneBuilderDebug.forceEditorUpdate();
            } else {
                console.error('Failed to update Monaco editor after all retries');
            }
        } catch (error) {
            console.error('Error during Monaco update:', error);
            if (retryCount < maxRetries) {
                setTimeout(() => updateMonacoSafely(retryCount + 1, maxRetries), 1000);
            }
        }
    }).catch(err => {
        console.error('Error importing monaco module:', err);
        if (retryCount < maxRetries) {
            setTimeout(() => updateMonacoSafely(retryCount + 1, maxRetries), 1000);
        }
    });
}

/**
 * Get a random position within the scene bounds
 * @param {Object} options - Position options
 * @returns {Object} Random position object
 * @deprecated Use getRandomPosition from entity-api.js instead
 */
export function getRandomPosition(options = {}) {
    logDeprecationWarning('getRandomPosition', 'getRandomPosition', 'entity-api.js');
    return getRandomPosition(options);
}

/**
 * Register a new primitive type with default properties
 * @param {string} primitiveType - Type of primitive to register
 * @param {Object} defaultProps - Default properties for the primitive
 * @deprecated Use registerPrimitiveType from entity-api.js instead
 */
export function registerPrimitiveType(primitiveType, defaultProps) {
    logDeprecationWarning('registerPrimitiveType', 'registerPrimitiveType', 'entity-api.js');
    return registerPrimitiveType(primitiveType, defaultProps);
}

/**
 * Log all entity positions to the console
 * @deprecated Use logEntityPositions from entity-api.js instead
 */
export function logEntityPositions() {
    logDeprecationWarning('logEntityPositions', 'logEntityPositions', 'entity-api.js');
    return logEntityPositions();
}

/**
 * Add multiple entities of the same type with randomized properties
 * @param {string} primitiveType - Type of primitive to add (box, sphere, etc.)
 * @param {number} count - Number of entities to add
 * @param {Object} options - Configuration options
 * @returns {Array} Array of created entity UUIDs
 * @deprecated Use addMultipleEntities from entity-api.js instead
 */
export function addMultipleEntities(primitiveType, count, options = {}) {
    logDeprecationWarning('addMultipleEntities', 'addMultipleEntities', 'entity-api.js');
    const entityIds = [];
    const {
        positionOptions = {},
        baseProperties = {},
        updateEditor = true
    } = options;
    
    for (let i = 0; i < count; i++) {
        // Get random position
        const position = getRandomPosition(positionOptions);
        
        // Create entity with random position and any base properties
        const id = addEntity(primitiveType, {
            ...baseProperties,
            position
        }, updateEditor);
        
        entityIds.push(id);
    }
    
    // Explicitly update the Monaco editor after adding all entities
    if (updateEditor) {
        forceEditorUpdate(150, 2);
    }
    
    return entityIds;
}

/**
 * Ensure all entities in the scene have UUIDs
 * This should be called after scene load and after any direct DOM manipulation
 * @returns {Object} Object containing UUID mapping updates
 */
export function ensureEntityUUIDs() {
    console.log('Ensuring all entities have UUIDs...');
    
    const state = getState();
    const updatedEntities = { ...state.entities };
    const updatedMapping = { ...state.entityMapping };
    let hasChanges = false;
    
    // Find all entity elements in the scene
    const scene = document.querySelector('a-scene');
    if (!scene) {
        console.error('No A-Frame scene found');
        return { entities: updatedEntities, entityMapping: updatedMapping, changes: false };
    }
    
    // Check all entity elements, including system entities
    const entityElements = scene.querySelectorAll('a-entity, a-box, a-sphere, a-cylinder, a-plane, a-sky');
    entityElements.forEach(element => {
        // Skip system entities
        if (['default-light', 'directional-light', 'sky', 'naf-template'].includes(element.id)) {
            return;
        }
        
        // Get existing UUID if any
        let uuid = element.dataset.entityUuid;
        const id = element.id;
        
        // If the element has no UUID, generate one
        if (!uuid) {
            // Get entity type from tag name
            const tagName = element.tagName.toLowerCase();
            let type = tagName.startsWith('a-') ? tagName.substring(2) : tagName;
            
            // Check for specialized geometry types
            if (type === 'entity') {
                const geometryAttr = element.getAttribute('geometry');
                if (geometryAttr && geometryAttr.primitive) {
                    // Component-based types should use their semantic type
                    if (COMPONENT_BASED_TYPES.includes(geometryAttr.primitive)) {
                        type = geometryAttr.primitive;
                        console.log(`Found component-based type: ${type}`);
                    }
                }
                
                // Also check data attribute as fallback
                if (element.dataset.entityType) {
                    type = element.dataset.entityType;
                    console.log(`Found semantic type from dataset: ${type}`);
                }
            }
            
            // Generate UUID using type-based pattern
            uuid = generateEntityId(type);
            element.dataset.entityUuid = uuid;
            console.log(`Generated UUID ${uuid} for entity ${id || element.tagName.toLowerCase()}`);
            hasChanges = true;
            
            // Extract entity data and update state
            const entityData = extractEntityAttributes(element, type);
            
            // Update state
            updatedEntities[uuid] = entityData;
            
            // Update mapping if ID exists
            if (id) {
                updatedMapping[id] = uuid;
            }
        }
        // If the element has UUID but no corresponding state entry, add it
        else if (!state.entities[uuid]) {
            const tagName = element.tagName.toLowerCase();
            const type = tagName.startsWith('a-') ? tagName.substring(2) : tagName;
            const entityData = extractEntityAttributes(element, type);
            
            // Update state
            updatedEntities[uuid] = entityData;
            hasChanges = true;
            
            // Update mapping if ID exists
            if (id && !updatedMapping[id]) {
                updatedMapping[id] = uuid;
            }
        }
    });
    
    // Update state if changes were made
    if (hasChanges) {
        setState({ 
            entities: updatedEntities,
            entityMapping: updatedMapping
        });
        
        // Update Monaco editor to reflect changes
        updateMonacoSafely();
    }
    
    return { 
        entities: updatedEntities, 
        entityMapping: updatedMapping, 
        changes: hasChanges 
    };
}

/**
 * Add an entity to the scene and update state
 * @param {string} primitiveType - Type of entity to add (box, sphere, etc.)
 * @param {Object} properties - Entity properties
 * @param {boolean} updateEditor - Whether to update the monaco editor
 * @returns {string} UUID of the created entity
 * @deprecated Use createEntity from entity-api.js instead
 */
export function addEntity(primitiveType, properties = {}, updateEditor = true) {
    logDeprecationWarning('addEntity', 'createEntity', 'entity-api.js');
    
    // Get default properties for this type
    let defaultProps = {};
    
    // Set entity-specific defaults using standardized constants
    if (GEOMETRY_DEFAULTS[primitiveType]) {
        defaultProps = { ...GEOMETRY_DEFAULTS[primitiveType] };
    }
    
    // Add default position and rotation
    defaultProps.position = { ...VECTOR_DEFAULTS.position };
    defaultProps.rotation = { ...VECTOR_DEFAULTS.rotation };
    defaultProps.scale = { ...VECTOR_DEFAULTS.scale };
    
    // Special cases for entities that need additional defaults
    switch (primitiveType) {
        case 'plane':
            defaultProps.rotation = { ...VECTOR_DEFAULTS.rotation, x: -90 };
            break;
        case 'light':
            const lightDefaults = LIGHT_DEFAULTS.point;
            defaultProps.type = 'point';
            defaultProps.intensity = lightDefaults.intensity;
            defaultProps.distance = lightDefaults.distance;
            defaultProps.color = lightDefaults.color;
            break;
    }
    
    // Add a default color for all entities except lights
    if (primitiveType !== 'light' && !properties.color) {
        defaultProps.color = DEFAULT_ENTITY_COLOR;
    }
    
    // Set default properties using standardized constants
    if (!defaultProps.position) {
        defaultProps.position = { ...VECTOR_DEFAULTS.position };
    }
    if (!defaultProps.rotation) {
        defaultProps.rotation = { ...VECTOR_DEFAULTS.rotation };
    }
    if (!defaultProps.scale) {
        defaultProps.scale = { ...VECTOR_DEFAULTS.scale };
    }

    // Set entity-specific defaults using standardized constants
    if (GEOMETRY_DEFAULTS[primitiveType]) {
        Object.assign(defaultProps, GEOMETRY_DEFAULTS[primitiveType]);
    }

    // Special cases for entities that need additional defaults
    switch (primitiveType) {
        case 'plane':
            // For planes, we want it on the ground
            defaultProps.position.y = 0;
            defaultProps.rotation.x = -90;
            
            // For planes, we usually want y=0 but add a tiny offset to prevent z-fighting
            if (properties.position && typeof properties.position === 'object' && !properties.position.y) {
                properties.position.y = 0.01;
            }
            break;
            
        case 'dodecahedron':
        case 'octahedron':
        case 'tetrahedron':
        case 'icosahedron':
            // Ensure position.y is at least radius to prevent falling through floor
            if (properties.position && typeof properties.position === 'object') {
                const radius = properties.radius || defaultProps.radius;
                properties.position.y = Math.max(radius, properties.position.y || 0);
            }
            break;
            
        case 'light':
            const lightDefaults = LIGHT_DEFAULTS.point;
            defaultProps.type = 'point';
            defaultProps.intensity = lightDefaults.intensity;
            defaultProps.distance = lightDefaults.distance;
            defaultProps.color = lightDefaults.color;
            break;
    }

    // Combine default properties with provided properties
    const combinedProps = { ...defaultProps, ...properties };
    
    let element, uuid;
    
    if (COMPONENT_BASED_TYPES.includes(primitiveType)) {
        // For component-based types, create an a-entity with the appropriate components
        // Extract properties specific to the geometry component
        const geometryProps = { primitive: primitiveType };
        
        // Add radius if specified
        if (combinedProps.radius) {
            geometryProps.radius = combinedProps.radius;
            // Remove from the combined props to avoid duplication
            delete combinedProps.radius;
        }
        
        // Create entity with semantic type to get appropriate IDs
        const entityResult = createEntity('entity', combinedProps, primitiveType);
        element = entityResult.element;
        uuid = entityResult.uuid;
        
        if (element) {
            // Set the geometry component
            element.setAttribute('geometry', geometryProps);
            
            // Store the semantic type in a data attribute for reference
            element.dataset.entityType = primitiveType;
        }
    } else {
        // For standard primitives, create normally
        const entityResult = createEntity(primitiveType, combinedProps);
        element = entityResult.element;
        uuid = entityResult.uuid;
    }
    
    // Force update the editor if requested
    if (updateEditor && element) {
        // Small delay to ensure watcher has processed the entity
        setTimeout(() => {
            forceEditorUpdate(100, 1);
        }, 50);
    }
    
    return uuid;
}

/**
 * Force update the Monaco editor with retry mechanism
 * @param {number} [delay=100] - Delay in ms before updating
 * @param {number} [retries=2] - Number of retries if update fails
 */
export function forceEditorUpdate(delay = 100, retries = 2) {
    console.log(`Scheduling Monaco editor update in ${delay}ms with ${retries} retries if needed`);
    
    setTimeout(() => {
        updateMonacoSafely(0, retries);
    }, delay);
}

/**
 * Get entity UUID by DOM ID (for backward compatibility)
 * @param {string} domId - The DOM ID to look up
 * @returns {string|null} The UUID or null if not found
 * @deprecated Use getEntityUUIDById from entity-api.js instead
 */
export function getEntityUUIDById(domId) {
    logDeprecationWarning('getEntityUUIDById', 'getEntityUUIDById', 'entity-api.js');
    return getEntityUUIDById(domId);
}

/**
 * Get entity DOM element by UUID
 * @param {string} uuid - Entity UUID
 * @returns {Element|null} DOM element or null if not found
 * @deprecated Use getEntityElement from entity-api.js instead
 */
export function getEntityElementByUUID(uuid) {
    logDeprecationWarning('getEntityElementByUUID', 'getEntityElement', 'entity-api.js');
    return getEntityElement(uuid);
}

/**
 * Get entity data from state by UUID
 * @param {string} uuid - Entity UUID
 * @returns {Object|null} Entity data or null if not found
 * @deprecated Use getEntityData from entity-api.js instead
 */
export function getEntityDataByUUID(uuid) {
    logDeprecationWarning('getEntityDataByUUID', 'getEntityData', 'entity-api.js');
    return getEntityData(uuid);
}

/**
 * Get all entity UUIDs in the scene
 * @returns {Array<string>} Array of entity UUIDs
 */
export function getAllEntityUUIDs() {
    const state = getState();
    return Object.keys(state.entities);
}

/**
 * Find all entities of a specific type
 * @param {string} type - Entity type to find
 * @returns {Array} Array of entity UUIDs that match the type
 * @deprecated Use findEntitiesByType from entity-api.js instead
 */
export function findEntitiesByType(type) {
    logDeprecationWarning('findEntitiesByType', 'findEntitiesByType', 'entity-api.js');
    try {
        const state = getState();
        const results = [];
        
        Object.entries(state.entities).forEach(([uuid, data]) => {
            if (data.type === type) {
                results.push(uuid);
            }
        });
        
        return results;
    } catch (error) {
        console.error(`Error finding entities of type ${type}:`, error);
        return [];
    }
}

/**
 * Find entities that have a specific property matching a value
 * @param {string} property - Property name to check
 * @param {any} value - Value to match
 * @returns {Array} Array of entity UUIDs that match the criteria
 * @deprecated Use findEntitiesByProperty from entity-api.js instead
 */
export function findEntitiesByProperty(property, value) {
    logDeprecationWarning('findEntitiesByProperty', 'findEntitiesByProperty', 'entity-api.js');
    try {
        const state = getState();
        const results = [];
        
        Object.entries(state.entities).forEach(([uuid, data]) => {
            if (data[property] === value) {
                results.push(uuid);
            }
        });
        
        return results;
    } catch (error) {
        console.error(`Error finding entities with ${property}=${value}:`, error);
        return [];
    }
} 