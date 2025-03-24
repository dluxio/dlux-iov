/**
 * State.js - Centralized state management system
 * Serves as the single source of truth for the application
 */

import { broadcastStateUpdate } from './network.js';
import { showNotification, generateEntityId } from './utils.js';

// The application state
let state = {
    entities: {},     // All entities in the scene with their attributes and UUIDs
    entityMapping: {}, // Maps DOM elements to entity UUIDs
    selectedEntity: null,
    camera: {
        position: { x: 0, y: 1.6, z: 5 },
        rotation: { x: 0, y: 0, z: 0 },
        active: 'builder-camera',
        saved: true
    },
    metadata: {
        title: 'Untitled Scene',
        description: '',
        created: Date.now(),
        modified: Date.now()
    },
    network: {
        status: 'disconnected',
        room: 'defaultRoom',
        url: ''
    },
    userSettings: {
        darkMode: true
    }
};

// Subscribers to state changes
const subscribers = [];

/**
 * Generate a UUID for entity identification
 * @returns {string} UUID
 */
export function generateEntityUUID() {
    return generateEntityId();
}

/**
 * Initialize the state with the current scene
 * @param {Element} [scene] - The A-Frame scene element (optional)
 * @returns {Promise} - A promise that resolves when the state is initialized
 */
export function initState(scene) {
    console.log('Initializing state...');
    
    try {
        // If no scene provided, try to find it
        if (!scene) {
            scene = document.querySelector('a-scene');
        }
        
        // If scene is still not available, return a rejected promise
        if (!scene) {
            console.warn('A-Frame scene not found during state initialization');
            // Initialize with empty entities instead of failing
            state = {
                ...state,
                entities: {},
                entityMapping: {}
            };
            console.log('State initialized with empty entities', state);
            return Promise.resolve();
        }
        
        // Initialize entities from the current scene
        const entities = scene.querySelectorAll('a-entity, a-box, a-sphere, a-cylinder, a-plane, a-sky');
        const entityState = {};
        const entityMapping = {};
        
        entities.forEach(entity => {
            // Skip the persistent entities that we manage separately
            if (entity.id === 'builder-camera' || 
                entity.id === 'default-light' || 
                entity.id === 'directional-light') {
                return;
            }
            
            // Generate UUID for this entity
            const uuid = entity.dataset.entityUuid || generateEntityUUID();
            
            // Ensure the entity has the UUID in its dataset
            entity.dataset.entityUuid = uuid;
            
            // Get entity attributes
            const attributes = {};
            
            // Get the entity type from its tag name
            const tagName = entity.tagName.toLowerCase();
            const type = tagName.startsWith('a-') ? tagName.substring(2) : tagName;
            attributes.type = type;
            
            // Get all other attributes
            entity.getAttributeNames().forEach(attr => {
                if (attr !== 'id' && attr !== 'data-entity-uuid') {
                    // Normalize component name (handle dot notation)
                    const normalizedName = attr.replace('.', '__');
                    attributes[normalizedName] = entity.getAttribute(attr);
                }
            });
            
            // Store in entity state
            entityState[uuid] = attributes;
            
            // Map DOM element to UUID (using WeakMap would be better but we need serialization)
            if (entity.id) {
                entityMapping[entity.id] = uuid;
            }
        });
        
        // Set initial state
        state = {
            ...state,
            entities: entityState,
            entityMapping: entityMapping
        };
        
        console.log('State initialized with scene entities', state);
        return Promise.resolve();
    } catch (error) {
        console.error('Error initializing state:', error);
        // Initialize with empty entities instead of failing
        state = {
            ...state,
            entities: {},
            entityMapping: {}
        };
        console.log('State initialized with empty entities due to error', state);
        return Promise.resolve();
    }
}

/**
 * Get the current state
 * @returns {Object} - The current state
 */
export function getState() {
    return JSON.parse(JSON.stringify(state)); // Return a copy to prevent direct mutation
}

/**
 * Set the application state
 * @param {Object} newState - New state to merge
 * @param {boolean} [notifySubscribers=true] - Whether to notify subscribers
 */
export function setState(newState, shouldNotify = true) {
    console.log('Setting state:', newState);
    
    // Store original state for diff
    const originalState = JSON.parse(JSON.stringify(state));
    
    // Track what changed
    const changes = {};
    
    // Merge the new state with the current state
    if (newState.entities) {
        // Special handling for entities to detect specific entity changes
        const originalEntities = {...state.entities};
        state.entities = {...state.entities, ...newState.entities};
        
        // Identify which entities changed (added, modified, or removed)
        const changedEntityIds = new Set();
        
        // Check for added or modified entities
        for (const id in state.entities) {
            if (!originalEntities[id] || JSON.stringify(originalEntities[id]) !== JSON.stringify(state.entities[id])) {
                changedEntityIds.add(id);
            }
        }
        
        // Check for removed entities
        for (const id in originalEntities) {
            if (!state.entities[id]) {
                changedEntityIds.add(id);
            }
        }
        
        if (changedEntityIds.size > 0) {
            changes.entities = Array.from(changedEntityIds);
            console.log('Entity changes detected:', changes.entities);
        }
    }
    
    // Handle other state properties
    if (newState.selectedEntity !== undefined) {
        state.selectedEntity = newState.selectedEntity;
        changes.selectedEntity = true;
    }
    
    if (newState.camera) {
        state.camera = {...state.camera, ...newState.camera};
        changes.camera = true;
    }
    
    if (newState.userSettings) {
        state.userSettings = {...state.userSettings, ...newState.userSettings};
        changes.userSettings = true;
    }
    
    // Notify subscribers if there are changes and notification is enabled
    if (shouldNotify && Object.keys(changes).length > 0) {
        notifySubscribersFunc(changes);
    }
    
    return state;
}

/**
 * Apply state updates received from the network
 * @param {Object} updates - Partial state updates from the network
 */
export function applyNetworkStateUpdate(updates) {
    setState(updates, true);
}

/**
 * Subscribe to state changes
 * @param {Function} callback - Function to call when state changes
 * @returns {Function} Unsubscribe function
 */
export function subscribe(callback) {
    console.log('New subscriber added to state');
    subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
        const index = subscribers.indexOf(callback);
        if (index !== -1) {
            subscribers.splice(index, 1);
            console.log('Subscriber removed from state');
        }
    };
}

/**
 * Notify all subscribers of state changes
 * @param {Object} changes - Object indicating which parts of the state changed
 */
function notifySubscribersFunc(changes) {
    console.log('Notifying subscribers of state changes:', changes);
    
    subscribers.forEach(callback => {
        try {
            callback(state, changes);
        } catch (error) {
            console.error('Error in state subscriber callback:', error);
        }
    });
}

/**
 * Export state schema for external use
 */
export const stateSchema = {
    entities: 'Object containing all scene entities',
    camera: 'Current camera state',
    metadata: 'Scene metadata',
    network: 'Network connection status'
};

/**
 * Get all entities from the state
 * @returns {Object} Entities object
 */
export function getEntities() {
    return {...state.entities};
}

/**
 * Get entity data by UUID
 * @param {string} id - Entity UUID
 * @returns {Object|null} Entity data or null if not found
 */
export function getEntity(id) {
    return state.entities[id] ? {...state.entities[id]} : null;
}

/**
 * REMOVED: This function has been completely removed
 * @param {string} id - Entity ID to remove
 * @returns {boolean} Whether the operation was successful
 * @deprecated Use deleteEntity() from entities.js or watcher.saveEntitiesToState() instead
 */
export function removeEntity(id) {
    throw new Error('removeEntity() has been removed. Use deleteEntity() from entities.js or watcher.saveEntitiesToState() instead.');
}

/**
 * REMOVED: This function has been completely removed
 * @param {string} id - Entity ID to update
 * @param {Object} attributes - New attributes to apply
 * @returns {boolean} Whether the operation was successful
 * @deprecated Use updateEntity() from entities.js or watcher.saveEntitiesToState() instead
 */
export function updateEntity(id, attributes) {
    throw new Error('updateEntity() has been removed. Use updateEntity() from entities.js or watcher.saveEntitiesToState() instead.');
}

/**
 * Reset the application state to default
 */
export function resetState() {
    console.log('Resetting application state');
    
    setState({
        entities: {},
        selectedEntity: null,
        camera: {
            position: { x: 0, y: 1.6, z: 5 },
            rotation: { x: 0, y: 0, z: 0 }
        },
        userSettings: {
            darkMode: true
        }
    });
}

/**
 * Check if the state is properly initialized
 * @returns {boolean} True if state is ready
 */
export function isStateInitialized() {
    return state && typeof state.entities === 'object';
}

// Initialize with some default entities if needed
// resetState(); 