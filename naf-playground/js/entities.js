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

/**
 * Initialize the entities module
 * @returns {Promise} A promise that resolves when initialization is complete
 */
export function initEntities() {
    console.log('Initializing entities module...');
    
    // Check if A-Frame scene exists
    const scene = document.querySelector('a-scene');
    if (!scene) {
        console.error('A-Scene not found during entities initialization');
        return Promise.reject(new Error('A-Scene not found'));
    }
    
    // Initialize any module-level variables or setup
    
    console.log('Entities module initialization complete');
    return Promise.resolve();
}

/**
 * Create a new entity and add it to the scene
 * @param {string} id - Unique ID for the entity
 * @param {string} type - Type of entity (box, sphere, etc.)
 * @param {Object} properties - Entity properties
 */
export function createEntity(id, type, properties) {
    console.log(`Creating entity: ${type} with ID: ${id}`, properties);
    
    try {
        // Create the element
        const entityElement = document.createElement(`a-${type}`);
        entityElement.id = id;
        
        // Set attributes based on properties
        setEntityAttributes(entityElement, properties);
        
        // Add to scene
        const scene = document.querySelector('a-scene');
        if (!scene) {
            console.error('A-Scene not found when trying to add entity');
            return null;
        }
        console.log('Found a-scene:', scene);
        
        scene.appendChild(entityElement);
        console.log(`Entity ${id} added to scene`, entityElement);
        
        // Use flushToDOM to ensure all attributes are properly set
        // This forces A-Frame to write all component data to the DOM
        entityElement.flushToDOM();
        
        // Now extract attributes from the DOM element to ensure we have all the defaults
        const finalProperties = extractEntityAttributes(entityElement, type);
        
        // Update state with the new entity
        const currentState = getState();
        const newEntities = { ...currentState.entities };
        
        // Store the complete properties for state storage
        newEntities[id] = finalProperties;
        
        // Update state
        setState({ entities: newEntities });
        
        // Update code editor using dynamic import to avoid circular dependencies
        // Use a more robust method with retry logic
        updateMonacoSafely();
        
        return entityElement;
    } catch (error) {
        console.error('Error creating entity:', error);
        return null;
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
 * @param {string} id - Entity ID to delete
 */
export function deleteEntity(id) {
    console.log(`Deleting entity with ID: ${id}`);
    
    // Find the entity
    const entity = document.getElementById(id);
    if (!entity) {
        console.error(`Entity with ID ${id} not found`);
        return false;
    }
    
    // Remove from DOM
    entity.parentNode.removeChild(entity);
    
    // Update state
    const currentState = getState();
    const newEntities = { ...currentState.entities };
    
    // Remove from entities object
    delete newEntities[id];
    
    // Update state
    setState({ entities: newEntities });
    
    // Update code editor
    updateMonacoSafely();
    
    logAction(`Deleted entity: ${id}`);
    
    return true;
}

/**
 * Update an entity's attributes
 * @param {string} id - Entity ID
 * @param {Object} updates - Attribute updates
 */
export function updateEntity(id, updates) {
    console.log(`Updating entity with ID: ${id}`, updates);
    
    // Find the entity
    const entity = document.getElementById(id);
    if (!entity) {
        console.error(`Entity with ID ${id} not found`);
        return false;
    }
    
    // Apply updates
    setEntityAttributes(entity, updates);
    
    // Flush changes to DOM to ensure A-Frame's internal state is updated
    entity.flushToDOM();
    
    // Extract the full set of attributes post-update
    const tagName = entity.tagName.toLowerCase();
    const type = tagName.startsWith('a-') ? tagName.substring(2) : tagName;
    const finalProperties = extractEntityAttributes(entity, type);
    
    // Update state
    const currentState = getState();
    const newEntities = { ...currentState.entities };
    
    // Update entity in state with complete property set
    newEntities[id] = finalProperties;
    
    // Update state
    setState({ entities: newEntities });
    
    // Update code editor
    updateMonacoSafely();
    
    logAction(`Updated entity: ${id}`);
    
    return true;
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
        // First, handle special case for sky
        const skyId = 'sky';
        const skyData = entitiesState[skyId];
        
        // Check if sky exists in state
        if (skyData) {
            console.log('Handling sky element from state:', skyData);
            
            // Find existing sky or create a new one
            let skyElement = scene.querySelector('a-sky');
            
            if (!skyElement) {
                console.log('Creating new sky element');
                skyElement = document.createElement('a-sky');
                skyElement.id = skyId;
                scene.appendChild(skyElement);
            } else {
                console.log('Using existing sky element:', skyElement.outerHTML);
            }
            
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
            delete entitiesState[skyId];
        } else {
            console.log('No sky data in state, ensuring default sky exists');
            
            // Find existing sky or create a new one with default values
            let skyElement = scene.querySelector('a-sky');
            
            if (!skyElement) {
                console.log('Creating default sky element');
                skyElement = document.createElement('a-sky');
                skyElement.id = skyId;
                skyElement.setAttribute('color', '#ECECEC');
                scene.appendChild(skyElement);
                skyElement.flushToDOM();
            } else if (!skyElement.getAttribute('color')) {
                // Ensure sky has color if it exists
                console.log('Adding default color to existing sky element');
                skyElement.setAttribute('color', '#ECECEC');
                skyElement.flushToDOM();
            }
        }
        
        // Remove current entities (except system entities like camera and lights)
        const currentEntities = Array.from(scene.querySelectorAll('[id]')).filter(entity => {
            // Skip elements with empty/null/undefined id
            if (!entity.id) {
                return false;
            }
            
            // Skip system entities
            if (['builder-camera', 'default-light', 'directional-light', 'sky'].includes(entity.id)) {
                return false;
            }
            
            // Skip assets and other special elements
            if (entity.closest('a-assets') || 
                entity.tagName.toLowerCase() === 'a-assets' ||
                entity.tagName.toLowerCase() === 'a-sky') {
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
                    console.log(`Removing entity: ${entity.id}`);
                    scene.removeChild(entity);
                } else {
                    console.log(`Skipping entity not directly in scene: ${entity.id} (parent: ${entity.parentNode?.tagName || 'unknown'})`);
                }
            } catch (err) {
                console.warn(`Error removing entity ${entity.id}:`, err);
            }
        });
        
        // Create entities from state
        Object.keys(entitiesState).forEach(id => {
            try {
                const entityData = entitiesState[id];
                const type = entityData.type;
                
                // Skip if no type (should not happen)
                if (!type) {
                    console.error(`Entity ${id} has no type`, entityData);
                    return;
                }
                
                // Check if entity already exists (in case removal failed)
                const existingEntity = document.getElementById(id);
                if (existingEntity) {
                    console.log(`Entity ${id} already exists, updating instead of recreating`);
                    // Update existing entity attributes instead
                    const properties = { ...entityData };
                    delete properties.type;
                    setEntityAttributes(existingEntity, properties);
                    existingEntity.flushToDOM();
                    return;
                }
                
                // Create entity without updating state
                const entityElement = document.createElement(`a-${type}`);
                entityElement.id = id;
                
                // Copy entity data except 'type'
                const properties = { ...entityData };
                delete properties.type;
                
                // Set attributes
                setEntityAttributes(entityElement, properties);
                
                // Add to scene
                console.log(`Adding entity to scene: ${id}`);
                scene.appendChild(entityElement);
                
                // Flush to DOM to ensure all attributes are properly set
                entityElement.flushToDOM();
            } catch (err) {
                console.error(`Error creating entity ${id}:`, err);
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
    Object.keys(entities).forEach(id => {
        const entityData = entities[id];
        const type = entityData.type;
        
        // Start tag
        html += `  <a-${type} id="${id}"`;
        
        // Add attributes
        Object.keys(entityData).forEach(key => {
            if (key !== 'type') {
                const value = entityData[key];
                
                // Format object values (position, rotation, scale)
                if (typeof value === 'object' && value !== null) {
                    const vectorStr = objectToVectorString(value);
                    html += ` ${key}="${vectorStr}"`;
                } else {
                    html += ` ${key}="${value}"`;
                }
            }
        });
        
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

// Store custom primitive types and their default properties
const customPrimitiveDefaults = {};

// Export for access from other modules
export { customPrimitiveDefaults };

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
 * Add an entity to the scene with customized default properties based on primitive type
 * @param {string} primitiveType - Type of primitive (box, sphere, cylinder, plane, etc.)
 * @param {Object} properties - Optional properties to override defaults
 * @param {boolean} [updateEditor=true] - Whether to update the editor after adding
 * @returns {string} The ID of the created entity
 */
export function addEntity(primitiveType, properties = {}, updateEditor = true) {
    const id = `${primitiveType}-${Date.now()}`;
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
    createEntity(id, primitiveType, combinedProps);
    
    // Force update the editor if requested
    if (updateEditor) {
        // Small delay to ensure state is updated first
        forceEditorUpdate(50, 1);
    }
    
    return id;
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