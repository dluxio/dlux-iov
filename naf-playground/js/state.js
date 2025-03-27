/**
 * State.js - Centralized state management system
 * Serves as the single source of truth for the application
 */

import { showNotification, generateEntityId } from './utils.js';
import {
  shouldSkipAttribute,
  parseVector,
  vectorToString,
  extractGeometryData,
  cleanEntityData,
  extractEntityAttributes
} from './entity-utils.js';

import {
  VECTOR_ATTRIBUTES,
  COMPONENT_BASED_TYPES,
  GEOMETRY_ATTRIBUTES,
  VECTOR_DEFAULTS,
  GEOMETRY_DEFAULTS,
  DEFAULT_SKY_COLOR,
  LIGHT_DEFAULTS,
  UI_CONFIG,
  generateInitialState
} from './config.js';

export class StateManager {
  constructor() {
    this.state = generateInitialState();
    this.history = [];
    this.isApplyingState = false;
    this.lastUpdateSource = null;
    this.listeners = new Set();

    // Add validation state
    this.validationState = {
      errors: [],
      warnings: []
    };
  }

  /**
   * Record a state change in history
   * @private
   */
  recordChange() {
    const change = {
      timestamp: Date.now(),
      source: this.lastUpdateSource,
      state: { ...this.state }
    };

    this.history.push(change);

    // Trim history if it gets too long
    if (this.history.length > 1000) {
      this.history = this.history.slice(-1000);
    }
  }

  /**
   * Update state without triggering DOM updates
   * @param {Object} updates - Updates to apply
   * @param {string} source - Source of the update
   */
  updateState(updates, source = 'unknown') {
    if (this.isApplyingState) {
        console.warn('Preventing circular state update from:', source);
        return;
    }

    this.isApplyingState = true;
    this.lastUpdateSource = source;

    // Handle entity updates
    if (updates.entities) {
        Object.entries(updates.entities).forEach(([uuid, entityData]) => {
            // Skip networked entities
            if (uuid.startsWith('entity-entity-') || 
                (entityData && entityData.networked) || 
                uuid === 'naf-template' || 
                uuid === 'naf-avatar' || 
                uuid === 'naf-camera') {
                return;
            }

            if (!this.state.entities[uuid]) {
                this.state.entities[uuid] = {};
            }
            this.state.entities[uuid] = {
                ...this.state.entities[uuid],
                ...entityData
            };
        });
        delete updates.entities;
    }

    // Merge remaining updates
    this.state = {
        ...this.state,
        ...updates
    };

    // Update modified timestamp
    this.state.metadata.modified = Date.now();

    // Record change in history
    this.recordChange();

    // Notify listeners
    this.notifyListeners();

    this.isApplyingState = false;

    // Dispatch state change event for network sync
    if (source !== 'network') {
        document.dispatchEvent(new CustomEvent('state-changed', {
            detail: {
                type: 'update',
                data: this.state,
                source
            }
        }));
    }
  }

  /**
   * Apply state changes to DOM
   * @param {Array} changes - Array of changes to apply
   * @param {boolean} batch - Whether to batch changes
   */
  applyToDOM(changes, batch = true) {
    if (batch) {
      requestAnimationFrame(() => this._applyChanges(changes));
    } else {
      this._applyChanges(changes);
    }
  }

  /**
   * Internal method to apply changes to DOM
   * @private
   */
  _applyChanges(changes) {
    this.isApplyingState = true;
    try {
      changes.forEach(change => {
        const entity = document.querySelector(`[data-entity-uuid="${change.uuid}"]`);
        if (!entity) return;

        // Apply changes based on type
        switch (change.type) {
          case 'update':
            this._applyEntityUpdate(entity, change.data);
            break;
          case 'delete':
            entity.remove();
            break;
          case 'create':
            // Handle entity creation
            break;
        }
      });
    } finally {
      this.isApplyingState = false;
    }
  }

  /**
   * Apply updates to an entity
   * @private
   */
  _applyEntityUpdate(entity, data) {
    // Handle geometry data first
    if (data.geometry || GEOMETRY_ATTRIBUTES.some(attr => attr in data)) {
        applyGeometryData(entity, data.geometry || data, data.type);
        
        // Remove geometry properties since they're handled
        if (data.geometry) delete data.geometry;
        GEOMETRY_ATTRIBUTES.forEach(attr => delete data[attr]);
    }

    // Apply all other attributes
    Object.entries(data).forEach(([key, value]) => {
        if (key === 'type') return; // Don't set type attribute
        
        if (value === null || value === undefined) {
            entity.removeAttribute(key);
        } else {
            // Format vector attributes
            if (VECTOR_ATTRIBUTES.includes(key)) {
                entity.setAttribute(key, vectorToString(value));
            } else if (typeof value === 'object') {
                entity.setAttribute(key, JSON.stringify(value));
            } else {
                entity.setAttribute(key, value);
            }
        }
    });
  }

  /**
   * Add state change listener
   * @param {Function} listener - Callback function
   */
  addListener(listener) {
    this.listeners.add(listener);
  }

  /**
   * Remove state change listener
   * @param {Function} listener - Callback function
   */
  removeListener(listener) {
    this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of state change
   * @private
   */
  notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.state, this.lastUpdateSource);
      } catch (error) {
        console.error('Error in state listener:', error);
      }
    });
  }

  /**
   * Get current state
   * @returns {Object} Current state
   */
  getState() {
    return {
      ...this.state,
      validation: { ...this.validationState }
    };
  }

  /**
   * Set state with source tracking
   * @param {Object} newState - New state to set
   * @param {string} source - Source of the state update
   */
  setState(newState, source = 'unknown') {
    if (this.isApplyingState) {
      console.warn('Preventing circular state update from:', source);
      return;
    }

    this.isApplyingState = true;
    this.lastUpdateSource = source;

    // Validate new state
    const validation = this.validateState(newState);
    this.validationState.errors = validation.errors;
    this.validationState.warnings = validation.warnings;

    // Handle entity updates
    if (newState.entities) {
      const filteredEntities = Object.entries(newState.entities).reduce((acc, [uuid, entityData]) => {
        // Skip networked entities
        if (uuid.startsWith('entity-entity-') || 
            (entityData && entityData.networked) || 
            uuid === 'naf-template' || 
            uuid === 'naf-avatar' || 
            uuid === 'naf-camera') {
          return acc;
        }
        
        acc[uuid] = {
          ...(this.state.entities[uuid] || {}),
          ...entityData
        };
        return acc;
      }, {});
      
      this.state.entities = {
        ...this.state.entities,
        ...filteredEntities
      };
      delete newState.entities;
    }

    // Merge remaining state changes
    this.state = {
      ...this.state,
      ...newState
    };

    // Update modified timestamp
    this.state.metadata.modified = Date.now();

    // Notify listeners
    this.notifyListeners();

    this.isApplyingState = false;

    // Dispatch state change event for network sync
    if (source !== 'network') {
      document.dispatchEvent(new CustomEvent('state-changed', {
        detail: {
          type: 'update',
          data: this.state,
          source
        }
      }));
    }
  }

  /**
   * Reset state to default
   */
  resetState() {
    this.setState({
      entities: {},
      selectedEntity: null,
      camera: {
        position: { ...VECTOR_DEFAULTS.position },
        rotation: { ...VECTOR_DEFAULTS.rotation }
      },
      userSettings: {
        darkMode: true
      }
    }, 'reset');
  }

  /**
   * Check if state is properly initialized
   * @returns {boolean} True if state is ready
   */
  isStateInitialized() {
    return this.state && typeof this.state.entities === 'object';
  }

  /**
   * Validates state updates
   * @param {Object} newState - The new state to validate
   * @returns {Object} Validation result
   */
  validateState(newState) {
    const errors = [];
    const warnings = [];

    // Validate entities if present
    if (newState.entities) {
      Object.entries(newState.entities).forEach(([uuid, entity]) => {
        if (!entity) {
          warnings.push(`Entity ${uuid} has no data`);
          return;
        }
        if (!entity.type && !entity.geometry?.primitive) {
          warnings.push(`Entity ${uuid} missing type or geometry primitive`);
        }
      });
    }

    return { errors, warnings };
  }

  /**
   * Initialize the state with the current scene
   * @param {HTMLElement} scene - The A-Frame scene element
   */
  initState(scene) {
    console.log('Initializing state with scene...');
    
    if (!scene) {
      console.error('No scene found during state initialization');
      return this.state;
    }
    
    // Get all entities with data-entity-uuid
    const entityElements = scene.querySelectorAll('[data-entity-uuid]');
    
    // If no entities found, create default scene
    if (entityElements.length === 0) {
      console.log('No entities found, creating default scene');
      const defaultState = generateInitialState();
      
      // Create DOM elements for default entities
      Object.entries(defaultState.entities).forEach(([uuid, entityData]) => {
        const element = this.createEntityElement(entityData);
        if (element) {
          scene.appendChild(element);
          entityData.DOM = true;
        }
      });
      
      // Update state with default entities
      this.state.entities = defaultState.entities;
      this.state.entityMapping = defaultState.entityMapping;
    } else {
      // Process existing entities
      const entities = {};
      const entityMapping = {};
      
      entityElements.forEach(element => {
        const uuid = element.getAttribute('data-entity-uuid');
        if (!uuid) return;
        
        const id = element.id;
        if (!id) return;
        
        // Update mapping
        entityMapping[id] = uuid;
        
        // Extract entity data
        const type = element.tagName.toLowerCase().replace('a-', '');
        const properties = extractEntityAttributes(element, type);
        
        // Add to entities object with DOM flag
        entities[uuid] = {
          type,
          ...properties,
          uuid,
          DOM: true
        };
      });
      
      // Update state with found entities
      this.state.entities = entities;
      this.state.entityMapping = entityMapping;
    }
    
    // Log the state for debugging
    console.log('Initialized state:', this.state);
    
    return this.state;
  }

  /**
   * Create a DOM element for an entity
   * @private
   */
  createEntityElement(entityData) {
    const element = document.createElement(`a-${entityData.type}`);
    element.id = entityData.id;
    element.setAttribute('data-entity-uuid', entityData.uuid);
    
    // Set all attributes
    Object.entries(entityData).forEach(([key, value]) => {
      if (key === 'type' || key === 'uuid' || key === 'id' || key === 'DOM') return;
      
      if (typeof value === 'object') {
        element.setAttribute(key, JSON.stringify(value));
      } else {
        element.setAttribute(key, value);
      }
    });
    
    return element;
  }
}

// Create singleton instance
const entityState = new StateManager();

// Export functions that use the singleton
export function getState() {
  return entityState.getState();
}

export function setState(newState, source) {
  return entityState.setState(newState, source);
}

export function updateEntityState(uuid, data, source) {
  return entityState.updateState(uuid, data, source);
}

export function addStateListener(listener) {
  entityState.addListener(listener);
}

export function removeStateListener(listener) {
  entityState.removeListener(listener);
}

export function applyStateToDOM(changes, batch = true) {
  return entityState.applyToDOM(changes, batch);
}

export function resetState() {
  return entityState.resetState();
}

export function isStateInitialized() {
  return entityState.isStateInitialized();
}

/**
 * Subscribe to state changes
 * @param {Function} callback - Function to call when state changes
 * @returns {Function} Unsubscribe function
 */
export function subscribe(callback) {
  console.log('New subscriber added to state');
  entityState.addListener(callback);
  
  // Return unsubscribe function
  return () => {
    entityState.removeListener(callback);
    console.log('Subscriber removed from state');
  };
}

/**
 * Apply state updates received from the network
 * @param {Object} updates - Partial state updates from the network
 */
export function applyNetworkStateUpdate(updates) {
  // Use setState with 'network' as the source
  entityState.setState(updates, 'network');
}

// Export the initState function that uses the singleton
export function initState(scene) {
  return entityState.initState(scene);
}

// Export the singleton instance with default values
export default {
  ...entityState,
  position: { ...VECTOR_DEFAULTS.position },
  rotation: { ...VECTOR_DEFAULTS.rotation },
  scale: { ...VECTOR_DEFAULTS.scale }
}; 