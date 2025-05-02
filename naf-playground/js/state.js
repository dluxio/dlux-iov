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
    this.state = {
      entities: {},
      entityMapping: {},
      assets: {}, // New dedicated assets collection
      metadata: {
        created: Date.now(),
        modified: Date.now(),
        version: '1.0'
      },
      validation: {
        errors: [],
        warnings: []
      }
    };
    
    this.stateHistory = [];
    this.historyIndex = -1;
    this.listeners = new Set();
    this.isApplyingState = false;
    this.lastUpdateSource = 'init';
    this.validationState = {
      errors: [],
      warnings: []
    };
  }

  /**
   * Records a change in the state history
   * @private
   */
  recordChange() {
    const change = {
      state: JSON.parse(JSON.stringify(this.state)),
      timestamp: Date.now(),
      source: this.lastUpdateSource
    };
    
    this.stateHistory.push(change);
    this.historyIndex = this.stateHistory.length - 1;
    
    // Trim history if it gets too long
    if (this.stateHistory.length > 1000) {
      this.stateHistory = this.stateHistory.slice(-1000);
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
   * This completely resets the state to a clean initial state
   */
  resetState() {
    console.log('[StateManager] Performing complete state reset');
    
    // Clear entity DOM elements first
    try {
      this._clearDOMEntities();
    } catch (error) {
      console.error('[StateManager] Error cleaning up DOM elements during reset:', error);
    }
    
    // Import the generateInitialState function if we need it
    const initialState = generateInitialState();
    
    // Create a completely fresh state to avoid any references to old state
    this.state = JSON.parse(JSON.stringify(initialState));
    this.lastUpdateSource = 'complete-reset';
    
    // Explicitly clear entity mapping to ensure it's completely reset
    this.state.entities = {};
    this.state.entityMapping = {};
    
    // Update timestamps
    this.state.metadata.modified = Date.now();
    this.state.metadata.created = Date.now();
    
    // Record change and notify listeners
    this.recordChange();
    this.notifyListeners();
    
    // Dispatch state change event for complete reset
    document.dispatchEvent(new CustomEvent('state-changed', {
      detail: {
        type: 'reset',
        data: this.state,
        source: 'complete-reset'
      }
    }));
    
    console.log('[StateManager] State reset complete - state completely cleared');
  }
  
  /**
   * Clear DOM entities (helper method for resetState)
   * @private
   */
  _clearDOMEntities() {
    const scene = document.querySelector('a-scene');
    if (!scene) {
      console.warn('[StateManager] Scene not found when clearing DOM entities');
      return;
    }
    
    console.log('[StateManager] Cleaning up DOM entities');
    
    // Find all entity elements with uuid attribute
    const entities = scene.querySelectorAll('[data-entity-uuid]');
    let removedCount = 0;
    let preservedCount = 0;
    
    // System entity types we should keep
    const systemEntityTypes = ['avatar', 'camera', 'rig'];
    const systemEntityIds = ['local-avatar', 'avatar-rig', 'avatar-camera'];
    
    // Collect all entities to remove first, then remove them
    // This prevents issues with removing while iterating
    const entitiesToRemove = [];
    
    entities.forEach(entity => {
      const uuid = entity.getAttribute('data-entity-uuid');
      const entityId = entity.id || 'unnamed';
      
      // Check if this is a system entity we should keep
      const isSystemEntity = 
        // Check if it has system entity ID
        systemEntityIds.includes(entityId) ||
        // Check UUID for system entity patterns
        (uuid && systemEntityTypes.some(type => uuid.includes(type)));
      
      if (!isSystemEntity) {
        entitiesToRemove.push(entity);
        console.log(`[StateManager] Will remove entity from DOM: ${entityId} (${uuid})`);
      } else {
        preservedCount++;
        console.log(`[StateManager] Keeping system entity: ${entityId} (${uuid})`);
      }
    });
    
    // Now remove all identified entities
    entitiesToRemove.forEach(entity => {
      try {
        if (entity.parentNode) {
          entity.parentNode.removeChild(entity);
          removedCount++;
        }
      } catch (removeError) {
        console.warn(`[StateManager] Error removing entity ${entity.id || 'unnamed'}:`, removeError);
      }
    });
    
    console.log(`[StateManager] Removed ${removedCount} entities from DOM, preserved ${preservedCount} system entities`);
    
    // Also check for the local-avatar entity directly, since it might not have a data-entity-uuid
    const localAvatar = scene.querySelector('#local-avatar');
    if (!localAvatar) {
      console.warn('[StateManager] local-avatar entity was not found after clearing DOM entities!');
    } else {
      console.log('[StateManager] local-avatar entity is preserved');
    }
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
    // Get or create state manager
    if (!window.stateManager) {
        window.stateManager = new StateManager();
    }

    // Initialize sky if it doesn't exist
    const state = window.stateManager.getState();
    const skyUuid = 'sky-entity-' + Date.now();
    
    if (!state.sky) {
        window.stateManager.updateState({
            sky: {
                type: 'color',
                data: { color: DEFAULT_SKY_COLOR },
                uuid: skyUuid,
                domElementCreated: true
            }
        }, 'state-init');
    }

    // Initialize environment if it doesn't exist
    if (!state.environment) {
        window.stateManager.updateState({
            environment: {
                sky: state.sky || {
                    type: 'color',
                    data: { color: DEFAULT_SKY_COLOR },
                    uuid: skyUuid
                }
            }
        }, 'state-init');
    }

    // Ensure sky exists in scene with proper attributes
    let skyEntity = scene.querySelector('a-sky');
    if (!skyEntity) {
        skyEntity = document.createElement('a-sky');
        skyEntity.id = 'sky';
        skyEntity.setAttribute('color', DEFAULT_SKY_COLOR);
        skyEntity.setAttribute('data-entity-uuid', state.sky?.uuid || skyUuid);
        skyEntity.setAttribute('data-sky-type', 'color');
        scene.appendChild(skyEntity);
    } else {
        // Update existing sky entity with required attributes if missing
        if (!skyEntity.hasAttribute('data-entity-uuid')) {
            skyEntity.setAttribute('data-entity-uuid', state.sky?.uuid || skyUuid);
        }
        if (!skyEntity.hasAttribute('data-sky-type')) {
            skyEntity.setAttribute('data-sky-type', 'color');
        }
    }
    
    // Force the watcher to capture the sky entity in state
    setTimeout(() => {
        if (window.watcher && typeof window.watcher.saveEntitiesToState === 'function') {
            console.log('[StateManager] Forcing watcher update to capture sky entity');
            window.watcher.saveEntitiesToState('sky-init');
        }
    }, 500);

    return window.stateManager;
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