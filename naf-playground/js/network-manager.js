/**
 * Network manager for handling networked entity updates
 */

import { updateEntityState, applyStateToDOM } from './state.js';

class NetworkedEntityManager {
  constructor() {
    this.isProcessingNetworkUpdate = false;
    this.pendingUpdates = new Map();
    this.updateTimeout = null;
  }

  /**
   * Initialize network manager
   */
  init() {
    // Listen for NAF events
    document.body.addEventListener('entityCreated', this.handleEntityCreated.bind(this));
    document.body.addEventListener('entityRemoved', this.handleEntityRemoved.bind(this));
    
    // Listen for component updates
    this.setupComponentListeners();
  }

  /**
   * Setup listeners for networked component updates
   */
  setupComponentListeners() {
    const scene = document.querySelector('a-scene');
    if (!scene) return;

    // Listen for component changes that come from the network
    scene.addEventListener('componentchanged', (event) => {
      const entity = event.detail.target;
      const uuid = entity.dataset.entityUuid;
      
      // Skip if no UUID or if change is local
      if (!uuid || !event.detail.isNetworked) return;

      this.queueNetworkUpdate(uuid, entity);
    });
  }

  /**
   * Handle network entity creation
   * @param {CustomEvent} event - Entity created event
   */
  handleEntityCreated(event) {
    const entity = event.detail.el;
    const uuid = entity.dataset.entityUuid;

    if (!uuid) {
      console.warn('Network entity created without UUID');
      return;
    }

    // Queue update to capture initial state
    this.queueNetworkUpdate(uuid, entity);
  }

  /**
   * Handle network entity removal
   * @param {CustomEvent} event - Entity removed event
   */
  handleEntityRemoved(event) {
    const entity = event.detail.el;
    const uuid = entity.dataset.entityUuid;

    if (!uuid) return;

    // Update state to remove entity
    updateEntityState(uuid, null, 'network');
  }

  /**
   * Queue a network update for processing
   * @param {string} uuid - Entity UUID
   * @param {Element} entity - Entity element
   */
  queueNetworkUpdate(uuid, entity) {
    // Skip if we're currently processing updates
    if (this.isProcessingNetworkUpdate) return;

    this.pendingUpdates.set(uuid, entity);
    this.scheduleUpdate();
  }

  /**
   * Schedule processing of network updates
   */
  scheduleUpdate() {
    if (this.updateTimeout) return;

    this.updateTimeout = setTimeout(() => {
      this.processNetworkUpdates();
    }, 50); // Small delay to batch updates
  }

  /**
   * Process all pending network updates
   */
  processNetworkUpdates() {
    if (this.pendingUpdates.size === 0) return;

    this.isProcessingNetworkUpdate = true;
    try {
      const updates = [];
      
      this.pendingUpdates.forEach((entity, uuid) => {
        // Extract current entity state
        const data = this.extractNetworkedData(entity);
        if (!data) return;

        // Queue update
        updates.push({
          type: 'update',
          uuid,
          data
        });

        // Update state
        updateEntityState(uuid, data, 'network');
      });

      // Apply all updates to DOM
      if (updates.length > 0) {
        applyStateToDOM(updates, true);
      }
    } finally {
      this.isProcessingNetworkUpdate = false;
      this.pendingUpdates.clear();
      this.updateTimeout = null;
    }
  }

  /**
   * Extract networked data from entity
   * @param {Element} entity - Entity element
   * @returns {Object} Entity data
   */
  extractNetworkedData(entity) {
    try {
      // Get networked components
      const networked = entity.getAttribute('networked');
      if (!networked) return null;

      // Get basic type
      let type = entity.tagName.toLowerCase().replace('a-', '');
      
      // Check for component-based type
      const geometry = entity.getAttribute('geometry');
      if (type === 'entity' && geometry?.primitive) {
        type = geometry.primitive;
      }

      // Build data object
      const data = {
        type,
        networked: networked
      };

      // Get synchronized components
      if (networked.template) {
        const template = document.querySelector(networked.template);
        if (template) {
          const components = template.getAttribute('networked-template')?.components;
          if (components) {
            components.split(',').forEach(comp => {
              const value = entity.getAttribute(comp.trim());
              if (value !== null) {
                data[comp.trim()] = value;
              }
            });
          }
        }
      }

      return data;
    } catch (error) {
      console.error('Error extracting networked data:', error);
      return null;
    }
  }
}

// Create singleton instance
const networkManager = new NetworkedEntityManager();

export function initNetworkManager() {
  networkManager.init();
}

export default networkManager; 