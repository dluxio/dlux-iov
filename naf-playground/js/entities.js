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
 * 3. Legacy API:
 *    - For backward compatibility, addBox(), addSphere(), etc. are still available
 *    - These call addEntity() internally with the appropriate type
 * 
 * === DEFAULT BEHAVIORS ===
 * 
 * - All entities will get random colors unless a specific color is provided
 * - Position defaults are set to prevent entities from falling through the floor
 * - Custom primitive types can be added easily via registerPrimitiveType()
 */

import { getState, setState } from './state.js';
import { updateMonacoEditor } from './monaco.js';
import { logAction } from './debug.js';

// Store default properties for custom primitives
const customPrimitiveDefaults = {};

/**
 * Generate a UUID for entity identification (local implementation to avoid circular imports)
 * @returns {string} UUID
 */
function generateLocalEntityUUID() {
    return 'entity-' + Date.now() + '-' + Math.floor(Math.random() * 1000000);
}

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
 * @param {string} type - Type of entity (box, sphere, etc.)
 * @param {Object} properties - Entity properties
 * @returns {Object} Object containing the entity element and its UUID
 */
export function createEntity(type, properties) {
    console.log(`Creating entity: ${type}`, properties);
    
    try {
        // Generate a unique UUID for this entity locally (instead of requiring from state.js)
        const uuid = generateLocalEntityUUID();
        
        // Create the element
        const entityElement = document.createElement(`a-${type}`);
        
        // Set UUID in dataset for DOM-state mapping
        entityElement.dataset.entityUuid = uuid;
        
        // Also set an ID for backward compatibility, but we won't rely on it
        const tempId = `${type}-${Date.now()}`;
        entityElement.id = tempId;
        
        // Set attributes based on properties
        setEntityAttributes(entityElement, properties);
        
        // Add to scene
        const scene = document.querySelector('a-scene');
        if (!scene) {
            console.error('A-Scene not found when trying to add entity');
            return { element: null, uuid: null };
        }
        console.log('Found a-scene:', scene);
        
        scene.appendChild(entityElement);
        console.log(`Entity with UUID ${uuid} added to scene`, entityElement);
        
        // Use flushToDOM to ensure all attributes are properly set
        // This forces A-Frame to write all component data to the DOM
        entityElement.flushToDOM();
        
        // Now extract attributes from the DOM element to ensure we have all the defaults
        const finalProperties = extractEntityAttributes(entityElement, type);
        
        // Update state with the new entity - using imported functions 
        const currentState = getState();
        const newEntities = { ...currentState.entities };
        const newEntityMapping = { ...currentState.entityMapping };
        
        // Store the complete properties for state storage
        newEntities[uuid] = finalProperties;
        
        // Update the entity mapping
        newEntityMapping[tempId] = uuid;
        
        // Update state
        setState({ 
            entities: newEntities,
            entityMapping: newEntityMapping
        });
        
        // Update code editor using dynamic import to avoid circular dependencies
        // Use a more robust method with retry logic
        updateMonacoSafely();
        
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
    
    // Special handling for vector properties - set these first to ensure proper positioning
    if (properties.position) {
        // Ensure position is set properly to avoid falling through floor
        const position = properties.position;
        
        // Format position as a string for A-Frame
        const posStr = typeof position === 'object' ? 
            `${position.x} ${position.y} ${position.z}` : position;
        
        // Set position attribute
        console.log(`Setting position for ${id} to ${posStr}`);
        entity.setAttribute('position', posStr);
    }
    
    if (properties.rotation) {
        // Format rotation as a string for A-Frame
        const rotation = properties.rotation;
        const rotStr = typeof rotation === 'object' ? 
            `${rotation.x} ${rotation.y} ${rotation.z}` : rotation;
        
        // Set rotation attribute
        entity.setAttribute('rotation', rotStr);
    }
    
    if (properties.scale) {
        // Format scale as a string for A-Frame
        const scale = properties.scale;
        const scaleStr = typeof scale === 'object' ? 
            `${scale.x} ${scale.y} ${scale.z}` : scale;
        
        // Set scale attribute
        entity.setAttribute('scale', scaleStr);
    }
    
    // Ensure color is set first for sky elements
    if (tagName === 'a-sky' && properties.color) {
        console.log(`Setting sky color to ${properties.color}`);
        entity.setAttribute('color', properties.color);
    }
    
    // Set all other properties
    Object.keys(properties).forEach(key => {
        // Skip position, rotation, scale as they're already handled
        if (['position', 'rotation', 'scale'].includes(key)) return;
        
        // Skip color for sky as we've already handled it
        if (tagName === 'a-sky' && key === 'color') return;
        
        // Skip type property as it's not an actual attribute
        if (key === 'type') return;
        
        const value = properties[key];
        
        // Handle conversion of value if it's an object with x,y,z properties (vector-like)
        if (value !== null && typeof value === 'object' && 'x' in value && 'y' in value && 'z' in value) {
            // Convert vector-like object to string format
            const vectorStr = `${value.x} ${value.y} ${value.z}`;
            console.log(`Converting object value for ${key} to vector string: ${vectorStr}`);
            entity.setAttribute(key, vectorStr);
        } 
        // Handle other object values that might need conversion (like colors)
        else if (value !== null && typeof value === 'object' && Object.keys(value).length > 0) {
            // For general objects, convert to string format that A-Frame might expect
            if ('r' in value && 'g' in value && 'b' in value) {
                // Convert RGB object to color string
                const colorStr = `rgb(${value.r}, ${value.g}, ${value.b})`;
                console.log(`Converting object value for ${key} to color string: ${colorStr}`);
                entity.setAttribute(key, colorStr);
            } else {
                // For other objects, JSON stringify may not be appropriate for A-Frame
                // but it's better than passing the object directly
                console.warn(`Converting complex object for ${key} to string representation`);
                try {
                    const stringValue = JSON.stringify(value);
                    entity.setAttribute(key, stringValue);
                } catch (error) {
                    console.error(`Error converting object value for ${key}:`, error);
                    console.log(`Falling back to string conversion for ${key}`);
                    entity.setAttribute(key, String(value));
                }
            }
        } else {
            // Set regular attribute
            entity.setAttribute(key, value);
        }
    });
    
    // Double-check position after all attributes are set
    if (!entity.hasAttribute('position') && tagName !== 'a-sky') {
        console.warn(`Entity ${id} has no position attribute, setting default`);
        entity.setAttribute('position', '0 0 0');
    }
    
    // Double-check sky color after setting all attributes
    if (tagName === 'a-sky') {
        const color = entity.getAttribute('color');
        console.log(`Final sky color: ${color || 'not set'}`);
        if (!color) {
            console.log('Sky color missing, setting default #ECECEC');
            entity.setAttribute('color', '#ECECEC');
        }
    }
}

/**
 * Convert a position/rotation/scale object to A-Frame vector string
 * @param {Object} obj - Object with x, y, z properties
 * @returns {string} - A-Frame vector string
 */
function objectToVectorString(obj) {
    return `${obj.x} ${obj.y} ${obj.z}`;
}

/**
 * Convert A-Frame vector string to object
 * @param {string|Object} str - A-Frame vector string or vector object
 * @returns {Object} - Object with x, y, z properties
 */
function vectorStringToObject(str) {
    // If str is already an object with x, y, z properties, return it directly
    if (str !== null && typeof str === 'object' && 'x' in str && 'y' in str && 'z' in str) {
        return {
            x: typeof str.x === 'number' ? str.x : parseFloat(str.x) || 0,
            y: typeof str.y === 'number' ? str.y : parseFloat(str.y) || 0,
            z: typeof str.z === 'number' ? str.z : parseFloat(str.z) || 0
        };
    }
    
    // Handle edge cases
    if (!str || typeof str !== 'string') {
        console.warn(`Invalid vector string: ${str}, using default values`);
        return { x: 0, y: 0, z: 0 };
    }
    
    try {
        // Split by whitespace and parse as numbers
        const parts = str.trim().split(/\s+/).map(v => {
            const parsed = parseFloat(v);
            return isNaN(parsed) ? 0 : parsed;
        });
        
        // Create vector object with defaults for missing components
        return { 
            x: parts[0] !== undefined ? parts[0] : 0, 
            y: parts[1] !== undefined ? parts[1] : 0, 
            z: parts[2] !== undefined ? parts[2] : 0 
        };
    } catch (error) {
        console.warn(`Error parsing vector string: ${str}`, error);
        return { x: 0, y: 0, z: 0 };
    }
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
 * Delete an entity
 * @param {string} uuid - Entity UUID to delete
 * @returns {boolean} Success status
 */
export function deleteEntity(uuid) {
    console.log(`Deleting entity with UUID: ${uuid}`);
    
    try {
        // Find the entity by UUID
        const entity = findEntityElementByUUID(uuid);
        if (!entity) {
            console.error(`Entity with UUID ${uuid} not found in DOM`);
            
            // Even if the DOM element is missing, we should still remove it from state
            const currentState = getState();
            if (currentState.entities[uuid]) {
                const newEntities = { ...currentState.entities };
                delete newEntities[uuid];
                
                // Also clean up any mapping references
                const newEntityMapping = { ...currentState.entityMapping };
                for (const id in newEntityMapping) {
                    if (newEntityMapping[id] === uuid) {
                        delete newEntityMapping[id];
                    }
                }
                
                setState({ 
                    entities: newEntities,
                    entityMapping: newEntityMapping
                });
                
                updateMonacoSafely();
                logAction(`Deleted entity from state: ${uuid}`);
                return true;
            }
            
            return false;
        }
        
        // Store the ID for mapping cleanup
        const elementId = entity.id;
        
        // Remove from DOM
        entity.parentNode.removeChild(entity);
        
        // Update state
        const currentState = getState();
        const newEntities = { ...currentState.entities };
        const newEntityMapping = { ...currentState.entityMapping };
        
        // Remove from entities object
        delete newEntities[uuid];
        
        // Remove from entity mapping if exists
        if (elementId && newEntityMapping[elementId]) {
            delete newEntityMapping[elementId];
        }
        
        // Update state
        setState({ 
            entities: newEntities,
            entityMapping: newEntityMapping
        });
        
        // Update code editor
        updateMonacoSafely();
        
        logAction(`Deleted entity: ${uuid}`);
        
        return true;
    } catch (error) {
        console.error(`Error deleting entity ${uuid}:`, error);
        return false;
    }
}

/**
 * Update an entity's attributes
 * @param {string} uuid - Entity UUID
 * @param {Object} updates - Attribute updates
 * @returns {boolean} Success status
 */
export function updateEntity(uuid, updates) {
    console.log(`Updating entity with UUID: ${uuid}`, updates);
    
    try {
        // Get current state
        const currentState = getState();
        
        // Check if entity exists in state
        if (!currentState.entities[uuid]) {
            console.error(`Entity with UUID ${uuid} not found in state`);
            return false;
        }
        
        // Find the DOM element for this UUID
        const entityElement = findEntityElementByUUID(uuid);
        if (!entityElement) {
            console.error(`DOM element for entity UUID ${uuid} not found`);
            return false;
        }
        
        // Apply updates to DOM element
        setEntityAttributes(entityElement, updates);
        
        // Flush changes to DOM to ensure A-Frame's internal state is updated
        entityElement.flushToDOM();
        
        // Extract the full set of attributes post-update
        const tagName = entityElement.tagName.toLowerCase();
        const type = tagName.startsWith('a-') ? tagName.substring(2) : tagName;
        const finalProperties = extractEntityAttributes(entityElement, type);
        
        // Update state
        const newEntities = { ...currentState.entities };
        
        // Update entity in state with complete property set
        newEntities[uuid] = finalProperties;
        
        // Update state
        setState({ entities: newEntities });
        
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
 * Find a DOM element by entity UUID
 * @param {string} uuid - Entity UUID to find
 * @returns {Element|null} The DOM element or null if not found
 */
function findEntityElementByUUID(uuid) {
    return document.querySelector(`[data-entity-uuid="${uuid}"]`);
}

/**
 * Recreate all entities from the state
 * @param {Object} entitiesState - The state of all entities
 * @returns {void}
 */
export function recreateEntitiesFromState(entitiesState = null) {
    console.log('Recreating entities from state...');
    
    // If no entities provided, get them from the state
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
                skyElement.dataset.entityUuid = generateLocalEntityUUID();
                skyElement.setAttribute('color', '#ECECEC');
                scene.appendChild(skyElement);
                skyElement.flushToDOM();
            } else if (!skyElement.getAttribute('color')) {
                // Ensure sky has color if it exists
                console.log('Adding default color to existing sky element');
                skyElement.setAttribute('color', '#ECECEC');
                skyElement.flushToDOM();
                
                // Ensure sky element has UUID
                if (!skyElement.dataset.entityUuid) {
                    skyElement.dataset.entityUuid = generateLocalEntityUUID();
                }
            }
        }
        
        // Remove current user entities (except system entities like camera and lights)
        const currentEntities = Array.from(scene.querySelectorAll('[data-entity-uuid]')).filter(entity => {
            // Skip system entities
            const tagName = entity.tagName.toLowerCase();
            if (['a-scene', 'a-assets'].includes(tagName)) {
                return false;
            }
            
            // Keep system entities 
            if (['builder-camera', 'default-light', 'directional-light'].includes(entity.id)) {
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
                // Only remove if it's a direct child of the scene
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
                    existingEntity.flushToDOM();
                    return;
                }
                
                // Create entity without updating state
                const entityElement = document.createElement(`a-${type}`);
                
                // Set UUID in dataset
                entityElement.dataset.entityUuid = uuid;
                
                // Give it an ID for backward compatibility
                entityElement.id = `${type}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
                
                // Copy entity data except 'type'
                const properties = { ...entityData };
                delete properties.type;
                
                // Set attributes
                setEntityAttributes(entityElement, properties);
                
                // Add to scene
                console.log(`Adding entity to scene: ${uuid}`);
                scene.appendChild(entityElement);
                
                // Flush to DOM to ensure all attributes are properly set
                entityElement.flushToDOM();
                
                // Update entity mapping with the new ID
                const currentState = getState();
                const newEntityMapping = { ...currentState.entityMapping };
                newEntityMapping[entityElement.id] = uuid;
                setState({ entityMapping: newEntityMapping }, false);
                
            } catch (err) {
                console.error(`Error creating entity ${uuid}:`, err);
            }
        });
        
        logAction('Recreated entities from state');
    } catch (error) {
        console.error('Error recreating entities from state:', error);
    }
}

/**
 * Generate HTML representation of all entities
 * @returns {string} - HTML string
 */
export function generateEntitiesHTML() {
    const state = getState();
    const entities = state.entities;
    
    let html = '';
    
    // Add each entity as HTML
    Object.keys(entities).forEach(uuid => {
        const entityData = entities[uuid];
        const type = entityData.type;
        
        // Skip if type is missing (should not happen)
        if (!type) {
            console.warn(`Entity ${uuid} has no type, skipping HTML generation`);
            return;
        }
        
        // Start tag
        html += `  <a-${type}`;
        
        // If we have an ID mapping for this UUID, include the ID
        let entityId = null;
        if (state.entityMapping) {
            // Look for an ID mapping for this UUID
            for (const id in state.entityMapping) {
                if (state.entityMapping[id] === uuid) {
                    entityId = id;
                    break;
                }
            }
        }
        
        // Add ID if found
        if (entityId) {
            html += ` id="${entityId}"`;
        }
        
        // Add attributes
        Object.keys(entityData).forEach(key => {
            if (key !== 'type') {
                const value = entityData[key];
                
                // Format object values (position, rotation, scale)
                if (typeof value === 'object' && value !== null) {
                    // Handle vector properties
                    if ('x' in value && 'y' in value && 'z' in value) {
                        const vectorStr = objectToVectorString(value);
                        html += ` ${key}="${vectorStr}"`;
                    }
                    // Handle color objects
                    else if ('r' in value && 'g' in value && 'b' in value) {
                        const colorStr = `rgb(${value.r}, ${value.g}, ${value.b})`;
                        html += ` ${key}="${colorStr}"`;
                    }
                    // Handle other objects
                    else {
                        try {
                            const jsonStr = JSON.stringify(value);
                            html += ` ${key}='${jsonStr}'`;
                        } catch (e) {
                            console.warn(`Could not stringify object value for ${key}`, e);
                            html += ` ${key}="${value}"`;
                        }
                    }
                } else {
                    html += ` ${key}="${value}"`;
                }
            }
        });
        
        // Always add the UUID as a data attribute - this is crucial for entity tracking
        html += ` data-entity-uuid="${uuid}"`;
        
        // Close tag
        html += '></a-' + type + '>\n';
    });
    
    return html;
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
 * Generate a random color in hex format
 * @returns {string} Random hex color
 */
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

/**
 * Generate a random position within defined limits
 * @param {Object} options - Configuration options
 * @param {number} [options.minX=-5] - Minimum X coordinate
 * @param {number} [options.maxX=5] - Maximum X coordinate
 * @param {number} [options.minY=0.5] - Minimum Y coordinate (usually above floor)
 * @param {number} [options.maxY=3] - Maximum Y coordinate
 * @param {number} [options.minZ=-5] - Minimum Z coordinate
 * @param {number} [options.maxZ=0] - Maximum Z coordinate
 * @returns {Object} Random position {x, y, z}
 */
export function getRandomPosition(options = {}) {
    const {
        minX = -5, maxX = 5,
        minY = 0.5, maxY = 3,
        minZ = -5, maxZ = 0
    } = options;
    
    return {
        x: minX + Math.random() * (maxX - minX),
        y: minY + Math.random() * (maxY - minY),
        z: minZ + Math.random() * (maxZ - minZ)
    };
}

/**
 * Add multiple entities at once with random positions and colors
 * @param {string} primitiveType - Type of primitive to add
 * @param {number} count - Number of entities to add
 * @param {Object} options - Options for positioning and properties
 * @returns {Array} Array of created entity IDs
 */
export function addMultipleEntities(primitiveType, count, options = {}) {
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
 * Register a custom primitive type with default properties
 * @param {string} primitiveType - The type of primitive (e.g., 'custom-cube')
 * @param {Object} defaultProps - Default properties for this primitive type
 */
export function registerPrimitiveType(primitiveType, defaultProps) {
    console.log(`Registering custom primitive type: ${primitiveType}`);
    customPrimitiveDefaults[primitiveType] = defaultProps;
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
        // Skip certain system entities
        if (['builder-camera', 'default-light', 'directional-light'].includes(element.id)) {
            return;
        }
        
        // Get existing UUID if any
        let uuid = element.dataset.entityUuid;
        const id = element.id;
        
        // If the element has no UUID, generate one
        if (!uuid) {
            uuid = generateLocalEntityUUID();
            element.dataset.entityUuid = uuid;
            console.log(`Generated UUID ${uuid} for entity ${id || element.tagName.toLowerCase()}`);
            hasChanges = true;
            
            // Extract entity data and update state
            const tagName = element.tagName.toLowerCase();
            const type = tagName.startsWith('a-') ? tagName.substring(2) : tagName;
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
 * Add an entity to the scene with customized default properties based on primitive type
 * @param {string} primitiveType - Type of primitive (box, sphere, cylinder, plane, etc.)
 * @param {Object} properties - Optional properties to override defaults
 * @param {boolean} [updateEditor=true] - Whether to update the editor after adding
 * @returns {string} The UUID of the created entity
 */
export function addEntity(primitiveType, properties = {}, updateEditor = true) {
    let defaultProps = {};
    
    // Check if we have a custom primitive type registered
    if (customPrimitiveDefaults[primitiveType]) {
        defaultProps = { ...customPrimitiveDefaults[primitiveType] };
    } else {
        // Set default properties based on primitive type
        switch(primitiveType) {
            case 'box':
                defaultProps = {
                    position: { x: 0, y: 1, z: -3 },
                    width: 1,
                    height: 1,
                    depth: 1
                };
                
                // Ensure position.y is at least 0.5 to prevent falling through floor
                if (properties.position && typeof properties.position === 'object') {
                    properties.position.y = Math.max(0.5, properties.position.y || 0);
                }
                break;
                
            case 'sphere':
                defaultProps = {
                    position: { x: 0, y: 1.5, z: -3 }, // Higher Y to account for radius
                    radius: 0.5
                };
                
                // Ensure position.y is at least radius (or 0.5) to prevent falling through floor
                if (properties.position && typeof properties.position === 'object') {
                    const radius = properties.radius || defaultProps.radius;
                    properties.position.y = Math.max(radius, properties.position.y || 0);
                }
                break;
                
            case 'cylinder':
                defaultProps = {
                    position: { x: 0, y: 0.75, z: -3 }, // Y is half height by default
                    radius: 0.5,
                    height: 1.5
                };
                
                // Ensure position.y is at least half height to prevent falling through floor
                if (properties.position && typeof properties.position === 'object') {
                    const height = properties.height || defaultProps.height;
                    properties.position.y = Math.max(height / 2, properties.position.y || 0);
                }
                break;
                
            case 'plane':
                defaultProps = {
                    position: { x: 0, y: 0, z: -4 },
                    rotation: { x: -90, y: 0, z: 0 }, // Flat on the ground
                    width: 4,
                    height: 4
                };
                
                // For planes, we usually want y=0 but add a tiny offset to prevent z-fighting
                if (properties.position && typeof properties.position === 'object' && !properties.position.y) {
                    properties.position.y = 0.01;
                }
                break;
                
            case 'light':
                defaultProps = {
                    position: { x: 0, y: 2, z: -3 },
                    type: 'point',
                    intensity: 0.75,
                    distance: 50,
                    color: '#FFFFFF' // Lights should be white by default
                };
                break;
                
            default:
                // Generic entity defaults
                defaultProps = {
                    position: { x: 0, y: 1, z: -3 }
                };
        }
    }
    
    // Add a random color for all entities except lights
    if (primitiveType !== 'light' && !properties.color) {
        defaultProps.color = getRandomColor();
    }
    
    // Combine default properties with provided properties
    const combinedProps = { ...defaultProps, ...properties };
    
    // Create entity
    const { element, uuid } = createEntity(primitiveType, combinedProps);
    
    // Ensure all UUIDs are present (including this new one)
    ensureEntityUUIDs();
    
    // Force update the editor if requested
    if (updateEditor) {
        // Small delay to ensure state is updated first
        forceEditorUpdate(50, 1);
    }
    
    return uuid;
}

/**
 * Add a box entity to the scene (legacy function for backward compatibility)
 * @param {Object} properties - Optional properties for the box
 * @param {boolean} [updateEditor=true] - Whether to update the editor after adding
 * @returns {string} The ID of the created entity
 */
export function addBox(properties = {}, updateEditor = true) {
    return addEntity('box', properties, updateEditor);
}

/**
 * Add a sphere entity to the scene (legacy function for backward compatibility)
 * @param {Object} properties - Optional properties for the sphere
 * @param {boolean} [updateEditor=true] - Whether to update the editor after adding
 * @returns {string} The ID of the created entity
 */
export function addSphere(properties = {}, updateEditor = true) {
    return addEntity('sphere', properties, updateEditor);
}

/**
 * Add a cylinder entity to the scene (legacy function for backward compatibility)
 * @param {Object} properties - Optional properties for the cylinder
 * @param {boolean} [updateEditor=true] - Whether to update the editor after adding
 * @returns {string} The ID of the created entity
 */
export function addCylinder(properties = {}, updateEditor = true) {
    return addEntity('cylinder', properties, updateEditor);
}

/**
 * Add a plane entity to the scene (legacy function for backward compatibility)
 * @param {Object} properties - Optional properties for the plane
 * @param {boolean} [updateEditor=true] - Whether to update the editor after adding
 * @returns {string} The ID of the created entity
 */
export function addPlane(properties = {}, updateEditor = true) {
    return addEntity('plane', properties, updateEditor);
}

/**
 * Extract all relevant attributes from an entity after flushToDOM
 * @param {Element} entity - The A-Frame entity element
 * @param {string} type - The entity type (box, sphere, etc.)
 * @returns {Object} - Complete entity properties
 */
function extractEntityAttributes(entity, type) {
    console.log(`Extracting attributes for ${type} entity:`, entity);
    
    // Start with the entity type
    const properties = { type };
    
    // Get position, rotation, scale (these are crucial for proper positioning)
    const vectorAttributes = ['position', 'rotation', 'scale'];
    vectorAttributes.forEach(attr => {
        // Get the attribute directly from the element
        const value = entity.getAttribute(attr);
        if (value) {
            // Store as object since that's our internal format
            properties[attr] = vectorStringToObject(value);
        } else {
            // If missing, use A-Frame defaults
            switch (attr) {
                case 'position':
                    properties[attr] = { x: 0, y: 0, z: 0 };
                    break;
                case 'rotation': 
                    properties[attr] = { x: 0, y: 0, z: 0 };
                    break;
                case 'scale':
                    properties[attr] = { x: 1, y: 1, z: 1 };
                    break;
            }
        }
    });
    
    // Get other common attributes based on entity type
    switch (type) {
        case 'box':
            extractAttribute(entity, properties, 'width');
            extractAttribute(entity, properties, 'height');
            extractAttribute(entity, properties, 'depth');
            extractAttribute(entity, properties, 'color');
            break;
        case 'sphere':
            extractAttribute(entity, properties, 'radius');
            extractAttribute(entity, properties, 'color');
            break;
        case 'cylinder':
            extractAttribute(entity, properties, 'radius');
            extractAttribute(entity, properties, 'height');
            extractAttribute(entity, properties, 'color');
            break;
        case 'plane':
            extractAttribute(entity, properties, 'width');
            extractAttribute(entity, properties, 'height');
            extractAttribute(entity, properties, 'color');
            break;
        case 'sky':
            extractAttribute(entity, properties, 'color');
            break;
    }
    
    // For primitives with light components, get those attributes too
    if (entity.hasAttribute('light')) {
        const light = entity.getAttribute('light');
        properties.light = light;
    }
    
    // Get any other attributes
    Array.from(entity.attributes).forEach(attr => {
        const name = attr.name;
        
        // Skip attributes we've already processed and those that start with data-
        if (vectorAttributes.includes(name) || 
            ['id', 'class', 'mixin'].includes(name) || 
            name.startsWith('data-') ||
            name === 'type' ||
            name === 'aframe-injected' ||
            properties[name] !== undefined) {
            return;
        }
        
        // Add the attribute to properties
        properties[name] = attr.value;
    });
    
    console.log(`Extracted properties for ${type}:`, properties);
    return properties;
}

/**
 * Helper to extract a single attribute
 * @param {Element} entity - The entity element
 * @param {Object} properties - Properties object to update
 * @param {string} attrName - Name of the attribute to extract
 */
function extractAttribute(entity, properties, attrName) {
    const value = entity.getAttribute(attrName);
    if (value !== null && value !== undefined) {
        properties[attrName] = value;
    }
}

/**
 * Debug helper to log the position of all entities
 * Useful for debugging positioning issues
 */
export function logEntityPositions() {
    const scene = document.querySelector('a-scene');
    if (!scene) {
        console.error('No scene found');
        return;
    }
    
    const entities = Array.from(scene.querySelectorAll('[id]'));
    
    console.group('Entity Positions');
    entities.forEach(entity => {
        const id = entity.id;
        if (!id) return;
        
        const position = entity.getAttribute('position');
        const domPosition = entity.getAttribute('position');
        const component = entity.components?.position?.data;
        
        console.log(`Entity #${id}:`, {
            positionAttr: position,
            domPosition: domPosition,
            component: component,
            object3D: entity.object3D?.position ? {
                x: entity.object3D.position.x,
                y: entity.object3D.position.y,
                z: entity.object3D.position.z
            } : 'N/A'
        });
    });
    console.groupEnd();
}

/**
 * Force update the Monaco editor with retry mechanism
 * @param {number} [delay=100] - Delay in ms before updating
 * @param {number} [retries=2] - Number of retries if update fails
 */
export function forceEditorUpdate(delay = 100, retries = 2) {
    console.log(`Scheduling Monaco editor update in ${delay}ms with ${retries} retries if needed`);
    
    setTimeout(() => {
        updateMonacoWithRetry(0, retries);
    }, delay);
}

/**
 * Update the Monaco editor with retry mechanism
 * @param {number} attempt - Current attempt number
 * @param {number} maxRetries - Maximum number of retries
 */
function updateMonacoWithRetry(attempt = 0, maxRetries = 2) {
    const currentAttempt = attempt + 1;
    console.log(`Updating Monaco editor (attempt ${currentAttempt}/${maxRetries + 1})`);
    
    import('./monaco.js').then(monaco => {
        try {
            if (typeof monaco.updateMonacoEditor === 'function') {
                monaco.updateMonacoEditor();
                
                // Success, no need to retry
                console.log('Monaco editor updated successfully');
            } else {
                // Editor function not available
                console.error('Monaco updateMonacoEditor function not found');
                
                // Try fallback editor if available
                if (window._fallbackMonacoEditor && window._fallbackMonacoEditor.setValue) {
                    // This is a last resort direct approach
                    console.log('Attempting update with fallback editor');
                    
                    // Generate HTML directly if possible
                    try {
                        const html = generateEntitiesHTML();
                        window._fallbackMonacoEditor.setValue(html);
                        console.log('Fallback editor updated successfully');
                    } catch (genError) {
                        console.error('Error generating HTML for fallback editor:', genError);
                    }
                }
                
                // Try again if we have retries left
                if (attempt < maxRetries) {
                    console.log('Retrying editor update...');
                    setTimeout(() => updateMonacoWithRetry(currentAttempt, maxRetries), 200);
                }
            }
        } catch (error) {
            console.error('Error during Monaco update:', error);
            
            // Retry if we haven't exceeded max attempts
            if (attempt < maxRetries) {
                console.log('Retrying after error...');
                setTimeout(() => updateMonacoWithRetry(currentAttempt, maxRetries), 200);
            }
        }
    }).catch(err => {
        console.error('Error importing monaco module:', err);
        
        // Retry if we haven't exceeded max attempts
        if (attempt < maxRetries) {
            console.log('Retrying after import error...');
            setTimeout(() => updateMonacoWithRetry(currentAttempt, maxRetries), 200);
        }
    });
}

/**
 * Get entity UUID by DOM ID (for backward compatibility)
 * @param {string} domId - The DOM ID to look up
 * @returns {string|null} The UUID or null if not found
 */
export function getEntityUUIDById(domId) {
    const state = getState();
    return state.entityMapping[domId] || null;
}

/**
 * Get entity DOM element by UUID
 * @param {string} uuid - Entity UUID
 * @returns {Element|null} DOM element or null if not found
 */
export function getEntityElementByUUID(uuid) {
    return findEntityElementByUUID(uuid);
}

/**
 * Get entity data from state by UUID
 * @param {string} uuid - Entity UUID
 * @returns {Object|null} Entity data or null if not found
 */
export function getEntityDataByUUID(uuid) {
    const state = getState();
    return state.entities[uuid] || null;
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
 * Find entities by type
 * @param {string} type - Entity type to find
 * @returns {Array<string>} Array of matching entity UUIDs
 */
export function findEntitiesByType(type) {
    const state = getState();
    return Object.keys(state.entities).filter(uuid => 
        state.entities[uuid].type === type
    );
}

/**
 * Find entities by property value
 * @param {string} property - Property name to match
 * @param {any} value - Value to match
 * @returns {Array<string>} Array of matching entity UUIDs
 */
export function findEntitiesByProperty(property, value) {
    const state = getState();
    return Object.keys(state.entities).filter(uuid => {
        const entityData = state.entities[uuid];
        
        // Handle deep property paths (e.g., 'position.x')
        if (property.includes('.')) {
            const parts = property.split('.');
            let current = entityData;
            
            // Navigate the property path
            for (let i = 0; i < parts.length; i++) {
                if (current === undefined || current === null) {
                    return false;
                }
                current = current[parts[i]];
            }
            
            return current === value;
        }
        
        // Simple property match
        return entityData[property] === value;
    });
} 