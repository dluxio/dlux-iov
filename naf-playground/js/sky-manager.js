/**
 * SkyManager - Centralized management of sky/environment in A-Frame
 * 
 * This manager handles all sky-related operations:
 * 1. Basic color sky (<a-sky color="#...")
 * 2. 360 image sky (<a-sky src="...")
 * 3. Video sky (<a-videosphere src="...")
 * 4. Environment component sky
 */

import { getState, setState } from './state.js';
import { generateEntityId } from './utils.js';
import { environmentManager } from './environment-manager.js';
import {
  DEFAULT_SKY_COLOR,
  SKY_TYPES,
  DEFAULT_SKY_CONFIG,
  SYSTEM_ENTITY_TYPES
} from './config.js';

// Define event types for sky changes
export const SKY_EVENTS = {
  SKY_CHANGED: 'sky-changed',
  SKY_INITIALIZED: 'sky-initialized',
  SKY_ERROR: 'sky-error'
};

/**
 * @typedef {Object} SkyConfig
 * @property {'color'|'environment'|'image'|'video'} type - The type of sky
 * @property {Object} data - The sky configuration data
 * @property {string} [data.color] - Color for color sky
 * @property {string} [data.environment] - Environment map for environment sky
 * @property {string} [data.image] - Image URL for image sky
 * @property {string} [data.video] - Video URL for video sky
 * @property {string} uuid - Unique identifier for the sky
 */

class SkyManager {
  constructor() {
    this.initialized = false;
    this.skyElement = null;
    this.currentConfig = null;
    this.currentSkyType = null;
    this.currentSkyData = null;
    
    // Set up state listener for sky changes
    document.addEventListener('state-changed', (event) => {
      const { changes, newState } = event.detail;
      // Only proceed if we have a valid state and sky changes
      if (newState && changes && changes.sky) {
        console.log('[SkyManager] Sky state changed, updating sky...');
        this._applySkyFromState(newState.sky);
      }
    });
  }

  /**
   * Initialize the sky manager
   */
  init() {
    if (this.initialized) return;

    // Get current state
    const state = getState();
    
    // Initialize sky if it doesn't exist
    if (!state.sky) {
      console.log('Initializing sky with default settings');
      setState({
        sky: {
          type: 'color',
          data: { color: DEFAULT_SKY_COLOR },
          uuid: 'sky-entity-1'  // Use consistent UUID
        }
      });
    } else {
      // Ensure sky exists in scene
      this.ensureSkyExists();
    }

    this.initialized = true;
  }

  /**
   * Update sky configuration
   * @param {Object} config - New sky configuration
   */
  updateSky(config) {
    if (!config) return;

    // Get current state
    const state = getState();
    
    // Update sky in state
    const sky = {
      ...config,
      uuid: state.sky?.uuid || generateEntityId('sky')
    };

    setState({ sky });

    // Update environment state
    if (state.environment) {
      setState({
        environment: {
          ...state.environment,
          sky
        }
      });
    }

    // Ensure sky exists in scene
    this.ensureSkyExists();
  }

  /**
   * Ensure sky exists in scene
   */
  ensureSkyExists() {
    const state = getState();
    const sky = state.sky;
    if (!sky) return;

    // Get or create sky entity
    let skyEntity = document.getElementById('sky');
    if (!skyEntity) {
      skyEntity = document.createElement('a-sky');
      skyEntity.id = 'sky';
      document.querySelector('a-scene').appendChild(skyEntity);
    }

    // Update sky attributes based on type
    switch (sky.type) {
      case 'color':
        skyEntity.setAttribute('color', sky.data.color);
        break;
      case 'environment':
        skyEntity.setAttribute('environment', sky.data.environment);
        break;
      case 'image':
        skyEntity.setAttribute('src', sky.data.image);
        break;
      case 'video':
        skyEntity.setAttribute('src', sky.data.video);
        break;
    }

    // Set UUID
    skyEntity.setAttribute('data-entity-uuid', sky.uuid);
  }

  /**
   * Get current sky configuration
   * @returns {Object} Current sky configuration
   */
  getCurrentSky() {
    return getState().sky;
  }

  /**
   * Check if an entity is a sky entity
   * @param {Element} entity - Entity to check
   * @returns {boolean} True if entity is a sky entity
   */
  isSkyEntity(entity) {
    return entity && entity.tagName.toLowerCase() === 'a-sky';
  }

  /**
   * Dispatch a sky-related event
   * @private
   * @param {string} eventType - Type of event to dispatch
   * @param {Object} detail - Event details
   */
  _dispatchSkyEvent(eventType, detail) {
    const event = new CustomEvent(eventType, {
      detail: {
        ...detail,
        timestamp: Date.now(),
        manager: this
      }
    });
    document.dispatchEvent(event);
  }

  /**
   * Validate sky configuration
   * @param {Object} config - Sky configuration to validate
   * @returns {SkyValidationResult}
   */
  _validateSkyConfig(config) {
    if (!config) {
      return { isValid: false, error: 'Sky configuration is required' };
    }

    if (!config.type || !Object.values(SKY_TYPES).includes(config.type)) {
      return { isValid: false, error: `Invalid sky type. Must be one of: ${Object.values(SKY_TYPES).join(', ')}` };
    }

    if (!config.data) {
      return { isValid: false, error: 'Sky data is required' };
    }

    if (!config.uuid) {
      return { isValid: false, error: 'Sky UUID is required' };
    }

    // Validate based on type
    switch (config.type) {
      case SKY_TYPES.COLOR:
        if (!config.data.color) {
          return { isValid: false, error: 'Color is required for color sky type' };
        }
        break;

      case SKY_TYPES.IMAGE:
        if (!config.data.image) {
          return { isValid: false, error: 'Image source is required for image sky type' };
        }
        break;

      case SKY_TYPES.VIDEO:
        if (!config.data.video) {
          return { isValid: false, error: 'Video source is required for video sky type' };
        }
        break;

      case SKY_TYPES.ENVIRONMENT:
        if (!config.data.environment) {
          return { isValid: false, error: 'Environment preset or data is required for environment sky type' };
        }
        break;

      case SKY_TYPES.NONE:
        // No additional validation needed
        break;
    }

    return { isValid: true };
  }

  /**
   * Update sky configuration and state
   * @private
   * @param {Object} skyConfig - The sky configuration to update
   */
  _updateState(skyConfig) {
    // Get current state
    const state = getState() || {};
    
    // Create sky entity data
    const skyEntity = {
      type: SYSTEM_ENTITY_TYPES.SKY,
      color: skyConfig.data.color,
      uuid: skyConfig.uuid,
      DOM: true
    };

    // Update state with sky configuration and entity
    setState({
      sky: skyConfig,
      entities: {
        ...state.entities,
        [skyConfig.uuid]: skyEntity
      },
      entityMapping: {
        ...state.entityMapping,
        'sky': skyConfig.uuid
      }
    }, 'sky-update');
  }

  /**
   * Apply sky configuration from state
   * @private
   * @param {Object} skyConfig - Sky configuration to apply
   */
  _applySkyFromState(skyConfig) {
    try {
      // Validate sky configuration
      if (!skyConfig || !skyConfig.type) {
        throw new Error('Invalid sky configuration');
      }

      // Apply the sky configuration
      this._applySky(skyConfig);

      // Update state with new configuration
      this._updateState(skyConfig);

      // Dispatch sky changed event
      this._dispatchSkyEvent(SKY_EVENTS.SKY_CHANGED, {
        config: skyConfig,
        element: this.skyElement,
        previousConfig: this.currentConfig
      });

      // Update current configuration
      this.currentConfig = skyConfig;
    } catch (error) {
      console.error('[SkyManager] Error applying sky configuration:', error);
      this._applyColorSky(DEFAULT_SKY_COLOR);
      this._dispatchSkyEvent(SKY_EVENTS.SKY_ERROR, {
        error,
        config: skyConfig
      });
      throw error;
    }
  }

  /**
   * Remove existing sky element
   */
  _removeExistingSky() {
    const scene = document.querySelector('a-scene');
    if (!scene) return;

    const existingSky = scene.querySelector('a-sky, a-videosphere');
    if (existingSky) {
      existingSky.remove();
      this.skyElement = null;
    }
  }

  /**
   * Apply color sky
   * @param {string} color - Sky color
   * @param {string} uuid - Sky UUID
   */
  _applyColorSky(color, uuid) {
    const scene = document.querySelector('a-scene');
    if (!scene) return;

    const sky = document.createElement('a-sky');
    sky.id = 'sky';
    sky.dataset.entityUuid = uuid;
    sky.setAttribute('color', color);
    scene.insertBefore(sky, scene.firstChild);
    this.skyElement = sky;
  }

  /**
   * Apply environment sky
   * @param {string} environment - Environment preset or data
   * @param {string} uuid - Sky UUID
   */
  _applyEnvironmentSky(environment, uuid) {
    const scene = document.querySelector('a-scene');
    if (!scene) return;

    const sky = document.createElement('a-sky');
    sky.id = 'sky';
    sky.dataset.entityUuid = uuid;
    sky.setAttribute('environment', environment);
    scene.insertBefore(sky, scene.firstChild);
    this.skyElement = sky;
  }

  /**
   * Apply image sky
   * @param {string} image - Image URL
   * @param {string} uuid - Sky UUID
   */
  _applyImageSky(image, uuid) {
    const scene = document.querySelector('a-scene');
    if (!scene) return;

    const sky = document.createElement('a-sky');
    sky.id = 'sky';
    sky.dataset.entityUuid = uuid;
    sky.setAttribute('src', image);
    scene.insertBefore(sky, scene.firstChild);
    this.skyElement = sky;
  }

  /**
   * Apply video sky
   * @param {string} video - Video URL
   * @param {string} uuid - Sky UUID
   */
  _applyVideoSky(video, uuid) {
    const scene = document.querySelector('a-scene');
    if (!scene) return;

    const sky = document.createElement('a-videosphere');
    sky.id = 'sky';
    sky.dataset.entityUuid = uuid;
    sky.setAttribute('src', video);
    scene.insertBefore(sky, scene.firstChild);
    this.skyElement = sky;
  }

  /**
   * Get current sky configuration
   * @returns {SkyConfig}
   */
  getCurrentConfig() {
    return this.currentConfig || DEFAULT_SKY_CONFIG;
  }

  /**
   * Get sky element
   * @returns {Element|null}
   */
  getSkyElement() {
    return this.skyElement;
  }
}

// Create singleton instance
const skyManager = new SkyManager();

// Export singleton instance
export { skyManager }; 