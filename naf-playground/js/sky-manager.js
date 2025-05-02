/**
 * SkyManager - Centralized management of sky/environment in A-Frame
 * 
 * This manager handles all sky-related operations:
 * 1. Basic color sky (<a-sky color="#...")
 * 2. 360 image sky (<a-sky src="...")
 * 3. Video sky (<a-videosphere src="...")
 * 4. Environment component sky
 * 5. Gradient sky (custom shader)
 */

import { getState, setState } from './state.js';
import { generateEntityId } from './utils.js';
import { environmentManager } from './environment-manager.js';
import { assetManager, ASSET_TYPES } from './asset-manager.js';
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
 * @property {'color'|'environment'|'image'|'video'|'gradient'|'none'} type - The type of sky
 * @property {Object} data - The sky configuration data
 * @property {string} [data.color] - Color for color sky
 * @property {string[]} [data.colors] - Colors array for gradient sky
 * @property {string} [data.direction] - Direction for gradient (vertical, horizontal, radial)
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
    this.currentVideoAssetId = null;
    
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
   * Modified to be purely reactive - will not create any entities automatically
   */
  init() {
    if (this.initialized) return;

    console.log('[SkyManager] Initializing in reactive mode - will only respond to state changes');
    
    // Set up state change listener if not already set up
    document.addEventListener('state-changed', (event) => {
      const { changes, newState } = event.detail;
      // Only proceed if we have a valid state and sky changes
      if (newState && changes && changes.sky) {
        console.log('[SkyManager] Sky state changed, updating sky...');
        this._applySkyFromState(newState.sky);
      }
    });
    
    // Apply current sky from state if it exists
    try {
      const state = getState();
      if (state && state.sky) {
        console.log('[SkyManager] Applying initial sky from current state');
        this._applySkyFromState(state.sky);
      } else {
        console.log('[SkyManager] No sky in current state, nothing to apply initially');
      }
    } catch (error) {
      console.error('[SkyManager] Error applying initial sky:', error);
    }

    this.initialized = true;
    this._dispatchSkyEvent(SKY_EVENTS.SKY_INITIALIZED, { reactiveMode: true });
  }

  /**
   * Update sky configuration
   * This is the main entry point for updating the sky and is the ONLY method
   * that should update the state. All other methods should just respond to state changes.
   * When this method is called, it updates the state, which triggers the state-changed event,
   * which calls _applySkyFromState to update the DOM.
   * @param {Object} config - New sky configuration
   */
  updateSky(config) {
    if (!config) return;

    console.log('[SkyManager] Updating sky configuration via state');
    
    // Update sky in state - this will trigger the state-changed event
    // which will then call _applySkyFromState() via the event listener
    setState({ 
      sky: {
        ...config,
        uuid: config.uuid || generateEntityId('sky')
      }
    }, 'sky-manager-update');

    // No longer directly modifying DOM - let the state change handler do it
  }

  /**
   * Ensure sky exists in scene
   * This is a more direct approach that doesn't rely on other components
   */
  ensureSkyExists() {
    try {
      const state = getState();
      const sky = state.sky;
      if (!sky) {
        console.log('[SkyManager] No sky in state, nothing to ensure');
        return;
      }

      console.log('[SkyManager] Ensuring sky exists:', sky.type);
      
      // Get or create sky entity - be more assertive about creating it
      let skyEntity = document.getElementById('sky');
      
      // If the sky entity doesn't exist or is the wrong type (for video vs regular sky),
      // create a new one with the right type
      const needsNewEntity = !skyEntity || 
        (sky.type === 'video' && skyEntity.tagName.toLowerCase() !== 'a-videosphere') ||
        (sky.type !== 'video' && skyEntity.tagName.toLowerCase() !== 'a-sky');
        
      if (needsNewEntity) {
        console.log('[SkyManager] Creating new sky entity for type:', sky.type);
        // Remove existing if needed
        if (skyEntity) {
          this._removeExistingSky();
        }
        
        // Apply from state
        this._applySkyFromState(sky);
      } else {
        console.log('[SkyManager] Updating existing sky entity');
        // Update existing entity
        switch (sky.type) {
          case 'color':
            // Handle both new and legacy formats
            if (sky.data && sky.data.color) {
              skyEntity.setAttribute('color', sky.data.color);
            } else if (sky.color) {
              // Legacy format
              console.log('[SkyManager] Using legacy sky color format');
              skyEntity.setAttribute('color', sky.color);
            } else {
              // Fallback to default
              console.warn('[SkyManager] No color found in sky data, using default');
              skyEntity.setAttribute('color', DEFAULT_SKY_COLOR);
            }
            break;
          case 'environment':
            skyEntity.setAttribute('environment', sky.data.environment);
            break;
          case 'image':
            // For image, use the asset system
            this._ensureImageAsset(sky.data.image, skyEntity);
            break;
          case 'video':
            // For video, use the asset system
            this._ensureVideoAsset(sky.data.video, skyEntity);
            break;
          case 'gradient':
            // For gradient, ensure the shader is registered and update material
            this._ensureGradientShader();
            if (sky.data.colors && sky.data.colors.length >= 2) {
              skyEntity.setAttribute('material', {
                shader: 'gradient',
                topColor: sky.data.colors[0],
                bottomColor: sky.data.colors[1],
                direction: sky.data.direction || 'vertical'
              });
            }
            break;
        }

        // Set UUID
        skyEntity.setAttribute('data-entity-uuid', sky.uuid);
        
        // Store reference
        this.skyElement = skyEntity;
      }
      
      console.log('[SkyManager] Sky exists check complete');
    } catch (error) {
      console.error('[SkyManager] Error ensuring sky exists:', error);
    }
  }

  /**
   * Ensure image asset exists and is linked to the sky
   * @private
   * @param {string} imageSrc - Image source URL
   * @param {Element} skyEntity - Sky element to update
   */
  _ensureImageAsset(imageSrc, skyEntity) {
    if (!imageSrc) return;
    
    // Register and load the image asset using asset manager
    const assetId = assetManager.registerAsset(ASSET_TYPES.IMAGE, imageSrc, {
      id: `sky-image-${Date.now()}`,
      tags: ['sky', 'background']
    });
    
    // Update sky entity to reference the asset
    skyEntity.dataset.assetId = assetId;
    skyEntity.setAttribute('src', `#${assetId}`);
    
    // Start loading the asset
    assetManager.loadAsset(assetId).then(() => {
      console.log(`[SkyManager] Sky image asset loaded: ${assetId}`);
    }).catch(error => {
      console.error(`[SkyManager] Error loading sky image: ${error}`);
    });
  }

  /**
   * Ensure video asset exists and is linked to the sky
   * @private
   * @param {string} videoSrc - Video source URL
   * @param {Element} skyEntity - Sky element to update
   */
  _ensureVideoAsset(videoSrc, skyEntity) {
    if (!videoSrc) return;
    
    // Register and load the video asset using asset manager
    const assetId = assetManager.registerAsset(ASSET_TYPES.VIDEO, videoSrc, {
      id: `sky-video-${Date.now()}`,
      tags: ['sky', 'background', 'video']
    });
    
    // Update sky entity to reference the asset
    skyEntity.dataset.assetId = assetId;
    skyEntity.setAttribute('src', `#${assetId}`);
    
    // Track this video asset ID for cleanup
    this.currentVideoAssetId = assetId;
    
    // Start loading the asset
    assetManager.loadAsset(assetId).then(videoAsset => {
      console.log(`[SkyManager] Sky video asset loaded: ${assetId}`);
    }).catch(error => {
      console.error(`[SkyManager] Error loading sky video: ${error}`);
    });
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
   * @returns {boolean} - True if entity is a sky
   */
  isSkyEntity(entity) {
    if (!entity) return false;
    
    // Check tag name
    const tagName = entity.tagName ? entity.tagName.toLowerCase() : '';
    if (tagName === 'a-sky' || tagName === 'a-videosphere') {
      return true;
    }
    
    // Check data attributes
    if (entity.dataset && (entity.dataset.skyType || entity.dataset.entityType === 'sky')) {
      return true;
    }
    
    // Check if it has the sky ID
    if (entity.id === 'sky') {
      return true;
    }
    
    // Check UUID
    const uuid = entity.dataset ? entity.dataset.entityUuid : null;
    if (uuid && (uuid.includes('sky') || uuid.startsWith('sky-'))) {
      return true;
    }
    
    return false;
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
   * Apply sky configuration from state
   * Updated to only modify DOM based on state, not change state itself
   * @private
   * @param {Object} skyConfig - Sky configuration to apply
   */
  _applySkyFromState(skyConfig) {
    try {
      // Validate sky configuration
      if (!skyConfig || !skyConfig.type) {
        console.warn('[SkyManager] Invalid sky configuration in state:', skyConfig);
        return;
      }

      console.log(`[SkyManager] Applying sky from state, type: ${skyConfig.type}`);

      // Remove any existing sky first
      this._removeExistingSky();

      // Apply the appropriate sky type
      switch (skyConfig.type) {
        case SKY_TYPES.COLOR:
          // Handle both new and legacy formats
          if (skyConfig.data && skyConfig.data.color) {
            this._applyColorSky(skyConfig.data.color, skyConfig.uuid);
          } else if (skyConfig.color) {
            // Legacy format
            console.log('[SkyManager] Using legacy sky color format in _applySkyFromState');
            this._applyColorSky(skyConfig.color, skyConfig.uuid);
          } else {
            console.warn('[SkyManager] Missing color in sky data, using default');
            this._applyColorSky(DEFAULT_SKY_COLOR, skyConfig.uuid);
          }
          break;

        case SKY_TYPES.ENVIRONMENT:
          if (!skyConfig.data || !skyConfig.data.environment) {
            console.warn('[SkyManager] Missing environment in sky data');
          } else {
            this._applyEnvironmentSky(skyConfig.data.environment, skyConfig.uuid);
          }
          break;

        case SKY_TYPES.IMAGE:
          if (!skyConfig.data || !skyConfig.data.image) {
            console.warn('[SkyManager] Missing image URL in sky data');
          } else {
            this._applyImageSky(skyConfig.data.image, skyConfig.uuid);
          }
          break;

        case SKY_TYPES.VIDEO:
          if (!skyConfig.data || !skyConfig.data.video) {
            console.warn('[SkyManager] Missing video URL in sky data');
          } else {
            this._applyVideoSky(skyConfig.data.video, skyConfig.uuid);
          }
          break;
          
        case SKY_TYPES.GRADIENT:
          if (!skyConfig.data || !skyConfig.data.colors || skyConfig.data.colors.length < 2) {
            console.warn('[SkyManager] Missing colors for gradient sky, falling back to default sky');
            this._applyColorSky(DEFAULT_SKY_COLOR, skyConfig.uuid);
          } else {
            this._applyGradientSky(
              skyConfig.data.colors,
              skyConfig.data.direction || 'vertical',
              skyConfig.uuid
            );
          }
          break;

        case SKY_TYPES.NONE:
          // No sky - already removed existing
          console.log('[SkyManager] No sky requested, removed existing sky');
          break;

        default:
          console.warn(`[SkyManager] Unknown sky type: ${skyConfig.type}`);
          // Apply default color as fallback
          this._applyColorSky(DEFAULT_SKY_COLOR, skyConfig.uuid);
      }

      // Update current configuration reference
      this.currentConfig = skyConfig;
      this.currentSkyType = skyConfig.type;
      this.currentSkyData = skyConfig.data;

      // Dispatch sky changed event
      this._dispatchSkyEvent(SKY_EVENTS.SKY_CHANGED, {
        config: skyConfig,
        element: this.skyElement,
        previousConfig: this.currentConfig
      });
    } catch (error) {
      console.error('[SkyManager] Error applying sky configuration:', error);
      // Dispatch error event
      this._dispatchSkyEvent(SKY_EVENTS.SKY_ERROR, {
        error,
        config: skyConfig
      });
    }
  }

  /**
   * Remove existing sky element
   * @private
   */
  _removeExistingSky() {
    const scene = document.querySelector('a-scene');
    if (!scene) {
      console.warn('[SkyManager] Scene not found, cannot remove sky');
      return;
    }

    // Also clean up any video assets to prevent persistence
    if (this.currentVideoAssetId) {
      const assetsEl = scene.querySelector('a-assets');
      if (assetsEl) {
        const videoAsset = assetsEl.querySelector(`#${this.currentVideoAssetId}`);
        if (videoAsset) {
          console.log(`[SkyManager] Removing video asset: ${this.currentVideoAssetId}`);
          try {
            // Pause and release resources
            if (videoAsset.pause) videoAsset.pause();
            if (videoAsset.removeAttribute) {
              videoAsset.removeAttribute('src');
              videoAsset.load(); // This forces the browser to release resources
            }
            // Remove from DOM
            if (videoAsset.parentNode) {
              videoAsset.parentNode.removeChild(videoAsset);
            }
          } catch (e) {
            console.warn('[SkyManager] Error removing video asset:', e);
          }
        }
      }
      this.currentVideoAssetId = null;
    }

    const existingSky = scene.querySelector('a-sky, a-videosphere');
    if (existingSky) {
      console.log('[SkyManager] Removing existing sky entity');
      
      // First, safely detach from Three.js scene
      try {
        if (existingSky.object3D && existingSky.object3D.parent) {
          // Detach from three.js parent
          existingSky.object3D.parent.remove(existingSky.object3D);
          
          // Clear any children
          if (existingSky.object3D.children && existingSky.object3D.children.length > 0) {
            [...existingSky.object3D.children].forEach(child => {
              existingSky.object3D.remove(child);
            });
          }
        }
      } catch (e) {
        console.warn('[SkyManager] Error detaching sky from three.js scene:', e);
      }
      
      // Wait a tick for three.js to process
      setTimeout(() => {
        try {
          // Then remove from DOM
          if (existingSky.parentNode) {
            existingSky.parentNode.removeChild(existingSky);
            console.log('[SkyManager] Successfully removed sky from DOM');
            
            // Update state to reflect DOM change
            const state = getState();
            const updatedState = {
              ...state,
              sky: {
                ...state.sky,
                domElementCreated: false
              }
            };
            setState(updatedState, 'sky-dom-sync');
          }
        } catch (e) {
          console.warn('[SkyManager] Error removing sky element from DOM:', e);
        }
      }, 0);
      
      this.skyElement = null;
    } else {
      console.log('[SkyManager] No existing sky to remove');
    }
  }

  /**
   * Apply color sky
   * @param {string} color - Sky color
   * @param {string} uuid - Sky UUID
   */
  _applyColorSky(color, uuid) {
    console.log(`[SkyManager] Creating color sky with color: ${color}`);
    const scene = document.querySelector('a-scene');
    if (!scene) {
      console.warn('[SkyManager] Scene not found, cannot create sky');
      return;
    }

    const sky = document.createElement('a-sky');
    sky.id = 'sky';
    sky.dataset.entityUuid = uuid || generateEntityId('sky');
    sky.dataset.skyType = 'color';
    sky.setAttribute('color', color);
    scene.insertBefore(sky, scene.firstChild);
    this.skyElement = sky;
    
    // Update state to track DOM element
    const state = getState();
    const updatedState = {
      ...state,
      sky: {
        ...state.sky,
        domElementCreated: true
      }
    };
    setState(updatedState, 'sky-dom-sync');
  }

  /**
   * Apply environment sky
   * @param {string} environment - Environment preset or data
   * @param {string} uuid - Sky UUID
   */
  _applyEnvironmentSky(environment, uuid) {
    console.log(`[SkyManager] Creating environment sky with preset: ${environment}`);
    const scene = document.querySelector('a-scene');
    if (!scene) {
      console.warn('[SkyManager] Scene not found, cannot create sky');
      return;
    }

    const sky = document.createElement('a-sky');
    sky.id = 'sky';
    sky.dataset.entityUuid = uuid || generateEntityId('sky');
    sky.dataset.skyType = 'environment';
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
    console.log(`[SkyManager] Creating image sky with URL: ${image}`);
    const scene = document.querySelector('a-scene');
    if (!scene) {
      console.warn('[SkyManager] Scene not found, cannot create sky');
      return;
    }

    // Register and load image asset using asset manager
    const assetId = assetManager.registerAsset(ASSET_TYPES.IMAGE, image, {
      id: `sky-image-${Date.now()}`,
      tags: ['sky', 'background']
    });
    
    // Create the sky entity that will use this asset
    const sky = document.createElement('a-sky');
    sky.id = 'sky';
    sky.dataset.entityUuid = uuid || generateEntityId('sky');
    sky.dataset.skyType = 'image';
    sky.dataset.assetId = assetId; // Store reference to the asset
    sky.setAttribute('src', `#${assetId}`);
    
    // Insert the sky into the scene
    scene.insertBefore(sky, scene.firstChild);
    this.skyElement = sky;
    
    // Start loading the asset
    assetManager.loadAsset(assetId).then(() => {
      console.log(`[SkyManager] Sky image asset loaded: ${assetId}`);
      
      // Update state to track DOM element and asset reference
      const state = getState();
      const updatedState = {
        ...state,
        sky: {
          ...state.sky,
          domElementCreated: true,
          assetId // Store the asset ID in the sky state
        }
      };
      setState(updatedState, 'sky-dom-sync');
    }).catch(error => {
      console.error(`[SkyManager] Error loading sky image: ${error}`);
    });
  }

  /**
   * Apply video sky
   * @param {string} video - Video URL
   * @param {string} uuid - Sky UUID
   */
  _applyVideoSky(video, uuid) {
    console.log(`[SkyManager] Creating video sky with URL: ${video}`);
    
    // Check if video URL exists and is accessible
    fetch(video, { method: 'HEAD' })
      .then(response => {
        if (response.ok) {
          console.log(`[SkyManager] Video URL is accessible: ${video}, status: ${response.status}`);
        } else {
          console.error(`[SkyManager] Video URL is not accessible: ${video}, status: ${response.status}`);
        }
      })
      .catch(error => {
        console.error(`[SkyManager] Error checking video URL: ${video}`, error);
      });
    
    const scene = document.querySelector('a-scene');
    if (!scene) {
      console.warn('[SkyManager] Scene not found, cannot create sky');
      return;
    }

    // Check if a-assets exists, create if needed
    let assetsEl = scene.querySelector('a-assets');
    if (!assetsEl) {
      console.log('[SkyManager] Creating a-assets element');
      assetsEl = document.createElement('a-assets');
      scene.appendChild(assetsEl);
    } else {
      console.log('[SkyManager] Found existing a-assets element');
    }

    // Register and load video asset using asset manager
    const assetId = assetManager.registerAsset(ASSET_TYPES.VIDEO, video, {
      id: `sky-video-${Date.now()}`,
      tags: ['sky', 'background', 'video']
    });
    
    console.log(`[SkyManager] Registered video asset with ID: ${assetId}`);
    
    // Store this video asset ID for potential cleanup
    this.currentVideoAssetId = assetId;
    
    // Add a timeout to create a fallback if asset loading takes too long
    const fallbackTimer = setTimeout(() => {
      console.log(`[SkyManager] Asset loading timeout - creating fallback video sky for: ${video}`);
      this._createFallbackVideoSky(video, uuid);
    }, 5000); // 5 second timeout
    
    // Start loading the asset
    assetManager.loadAsset(assetId).then(videoAsset => {
      // Clear the fallback timer since asset loaded
      clearTimeout(fallbackTimer);
      
      console.log(`[SkyManager] Sky video asset loaded: ${assetId}`, videoAsset);
      
      // Check if the video element is valid
      if (!videoAsset) {
        console.error(`[SkyManager] Video asset is null or undefined for ${assetId}`);
        return;
      }
      
      // Check if the video is playable
      if (videoAsset && videoAsset.tagName === 'VIDEO') {
        console.log(`[SkyManager] Video asset is a valid VIDEO element: ${videoAsset.tagName}`);
        
        // Log video element properties
        console.log(`[SkyManager] Video properties: src=${videoAsset.src}, readyState=${videoAsset.readyState}, networkState=${videoAsset.networkState}`);
        
        // Set up listeners
        videoAsset.addEventListener('canplay', () => {
          console.log(`[SkyManager] Video can play now: ${assetId}`);
          // Create the sky entity when video is ready
          this._createSkyEntityAfterVideoLoaded(assetId, uuid);
        });
        
        videoAsset.addEventListener('error', (error) => {
          console.error(`[SkyManager] Video error event: ${assetId}`, error);
        });
        
        // Force load the video
        if (videoAsset.load) {
          console.log(`[SkyManager] Forcing video load for: ${assetId}`);
          videoAsset.load();
        }
      } else {
        // Fallback in case we got an unexpected element type
        console.warn(`[SkyManager] Unexpected video asset type: ${videoAsset.tagName}, falling back to direct creation`);
        this._createSkyEntityAfterVideoLoaded(assetId, uuid);
      }
    }).catch(error => {
      // Clear the fallback timer since we got an error
      clearTimeout(fallbackTimer);
      
      console.error(`[SkyManager] Error loading sky video: ${error}`);
      
      // Try the fallback approach immediately on error
      console.log(`[SkyManager] Trying fallback approach after asset loading error`);
      this._createFallbackVideoSky(video, uuid);
      
      this._dispatchSkyEvent(SKY_EVENTS.SKY_ERROR, {
        error: error.toString(),
        src: video
      });
    });
  }
  
  /**
   * Create the sky entity after video is confirmed to be loaded
   * @private
   * @param {string} assetId - The video asset ID
   * @param {string} uuid - Sky UUID
   */
  _createSkyEntityAfterVideoLoaded(assetId, uuid) {
    const scene = document.querySelector('a-scene');
    if (!scene) return;
    
    // Remove any existing videosphere first to prevent duplicates
    const existingVideoSphere = scene.querySelector('a-videosphere');
    if (existingVideoSphere) {
      console.log('[SkyManager] Removing existing videosphere before creating new one');
      if (existingVideoSphere.parentNode) {
        existingVideoSphere.parentNode.removeChild(existingVideoSphere);
      }
    }
    
    // Create the sky entity
    const sky = document.createElement('a-videosphere');
    sky.id = 'sky';
    
    // Generate a sky UUID if not provided
    const skyUuid = uuid || generateEntityId('sky');
    
    // Set the entity UUID both as a dataset property and as an attribute
    // Both ways of setting it ensures it's captured by different parts of the system
    sky.dataset.entityUuid = skyUuid;
    sky.setAttribute('data-entity-uuid', skyUuid);
    
    // Set sky type for proper identification
    sky.dataset.skyType = 'video';
    sky.setAttribute('data-sky-type', 'video');
    
    // Store reference to the asset
    sky.dataset.assetId = assetId;
    sky.setAttribute('data-asset-id', assetId);
    
    // Set the src attribute to reference the asset
    sky.setAttribute('src', `#${assetId}`);
    
    // Insert the sky into the scene (at the beginning for proper rendering order)
    scene.insertBefore(sky, scene.firstChild);
    this.skyElement = sky;
    
    console.log(`[SkyManager] Created video sky with UUID: ${skyUuid}, referencing asset: ${assetId}`);
    
    // Update state to reflect DOM element creation and asset reference
    const state = getState();
    const updatedState = {
      ...state,
      sky: {
        ...state.sky,
        domElementCreated: true,
        assetId, // Store the asset ID in the sky state
        uuid: skyUuid // Ensure the UUID is stored in state
      }
    };
    setState(updatedState, 'sky-dom-sync');
    
    // Explicitly trigger the watcher to register this new entity
    setTimeout(() => {
      if (window.watcher && typeof window.watcher.saveEntitiesToState === 'function') {
        console.log('[SkyManager] Forcing watcher to register video sky entity');
        window.watcher.saveEntitiesToState('video-sky-creation');
      }
    }, 300);
    
    // Dispatch sky changed event
    this._dispatchSkyEvent(SKY_EVENTS.SKY_CHANGED, { 
      type: 'video',
      assetId,
      uuid: skyUuid
    });
  }

  /**
   * Directly create a videosphere without waiting for the asset system
   * @param {string} videoSrc - Video source URL
   * @param {string} uuid - Sky UUID
   */
  _createFallbackVideoSky(videoSrc, uuid) {
    console.log(`[SkyManager] Creating fallback video sky with direct source: ${videoSrc}`);
    try {
      const scene = document.querySelector('a-scene');
      if (!scene) {
        console.warn('[SkyManager] Scene not found, cannot create fallback sky');
        return;
      }
      
      // Create a-assets if it doesn't exist
      let assetsEl = scene.querySelector('a-assets');
      if (!assetsEl) {
        assetsEl = document.createElement('a-assets');
        scene.appendChild(assetsEl);
      }
      
      // Check if video already exists in assets
      const videoId = `sky-video-${Date.now()}`;
      let videoEl = document.querySelector(`#${videoId}`);
      
      if (!videoEl) {
        // Create video element directly
        videoEl = document.createElement('video');
        videoEl.id = videoId;
        videoEl.setAttribute('src', videoSrc);
        videoEl.setAttribute('crossorigin', 'anonymous');
        videoEl.setAttribute('autoplay', '');
        videoEl.setAttribute('loop', '');
        videoEl.setAttribute('muted', '');
        videoEl.setAttribute('playsinline', '');
        
        // Add to assets
        assetsEl.appendChild(videoEl);
        console.log(`[SkyManager] Created direct video element with ID: ${videoId}`);
      }
      
      // Create videosphere after a short delay to ensure the video element is registered
      setTimeout(() => {
        try {
          // Generate UUID if not provided
          const skyUuid = uuid || generateEntityId('sky');
          
          // Check if videosphere already exists
          let sky = document.querySelector('a-videosphere');
          if (sky) {
            // Update existing videosphere
            sky.setAttribute('src', `#${videoId}`);
            sky.dataset.entityUuid = skyUuid;
            sky.setAttribute('data-entity-uuid', skyUuid);
            sky.dataset.skyType = 'video';
            sky.setAttribute('data-sky-type', 'video');
            console.log(`[SkyManager] Updated existing videosphere with UUID: ${skyUuid}`);
          } else {
            // Create new videosphere
            sky = document.createElement('a-videosphere');
            sky.id = 'sky';
            sky.dataset.entityUuid = skyUuid;
            sky.setAttribute('data-entity-uuid', skyUuid);
            sky.dataset.skyType = 'video';
            sky.setAttribute('data-sky-type', 'video');
            sky.setAttribute('src', `#${videoId}`);
            
            // Add to scene
            scene.insertBefore(sky, scene.firstChild);
            console.log(`[SkyManager] Created new fallback videosphere with UUID: ${skyUuid}`);
          }
          
          this.skyElement = sky;
          
          // Update state
          const state = getState();
          const updatedState = {
            ...state,
            sky: {
              ...state.sky,
              domElementCreated: true,
              uuid: skyUuid,
              type: 'video',
              data: {
                video: videoSrc
              }
            }
          };
          setState(updatedState, 'sky-fallback');
          
          // Explicitly trigger the watcher
          setTimeout(() => {
            if (window.watcher && typeof window.watcher.saveEntitiesToState === 'function') {
              console.log('[SkyManager] Forcing watcher to register fallback video sky');
              window.watcher.saveEntitiesToState('fallback-video-sky');
            }
          }, 300);
        } catch (innerError) {
          console.error('[SkyManager] Error creating videosphere:', innerError);
        }
      }, 500);
    } catch (error) {
      console.error('[SkyManager] Error in fallback video sky creation:', error);
    }
  }

  /**
   * Apply gradient sky
   * @param {string[]} colors - Array of color values
   * @param {string} direction - Gradient direction ('vertical', 'horizontal', 'radial')
   * @param {string} uuid - Sky UUID
   */
  _applyGradientSky(colors, direction, uuid) {
    console.log(`[SkyManager] Creating gradient sky with direction: ${direction}`);
    const scene = document.querySelector('a-scene');
    if (!scene) {
      console.warn('[SkyManager] Scene not found, cannot create sky');
      return;
    }

    // Check if gradient shader exists, register if needed
    this._ensureGradientShader();

    // Create sky element
    const sky = document.createElement('a-sky');
    sky.id = 'sky';
    sky.dataset.entityUuid = uuid || generateEntityId('sky');
    sky.dataset.skyType = 'gradient';
    
    // Set gradient properties
    sky.setAttribute('material', {
      shader: 'gradient',
      topColor: colors[0],
      bottomColor: colors[1],
      direction: direction
    });
    
    scene.insertBefore(sky, scene.firstChild);
    this.skyElement = sky;
    
    // Update state to track DOM element
    const state = getState();
    const updatedState = {
      ...state,
      sky: {
        ...state.sky,
        domElementCreated: true
      }
    };
    setState(updatedState, 'sky-dom-sync');
  }
  
  /**
   * Ensure gradient shader is registered with A-Frame
   * @private
   */
  _ensureGradientShader() {
    // Check if shader is already registered
    if (AFRAME && AFRAME.shaders && AFRAME.shaders.gradient) {
      return;
    }
    
    console.log('[SkyManager] Registering gradient shader');
    
    // Register the gradient shader
    AFRAME.registerShader('gradient', {
      schema: {
        topColor: {type: 'color', default: '#1e88e5'},
        bottomColor: {type: 'color', default: '#81d4fa'},
        direction: {type: 'string', default: 'vertical', oneOf: ['vertical', 'horizontal', 'radial']}
      },
      
      vertexShader: `
        varying vec2 vUv;
        
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        varying vec2 vUv;
        
        #define VERTICAL 0
        #define HORIZONTAL 1
        #define RADIAL 2
        
        uniform int directionMode;
        
        void main() {
          float mixFactor;
          
          if (directionMode == VERTICAL) {
            mixFactor = vUv.y;
          } else if (directionMode == HORIZONTAL) {
            mixFactor = vUv.x;
          } else {
            // Radial gradient
            float dist = distance(vUv, vec2(0.5, 0.5));
            mixFactor = 1.0 - clamp(dist * 2.0, 0.0, 1.0);
          }
          
          gl_FragColor = vec4(mix(bottomColor, topColor, mixFactor), 1.0);
        }
      `,
      
      init: function(data) {
        this.material = new THREE.ShaderMaterial({
          uniforms: {
            topColor: { value: new THREE.Color(data.topColor) },
            bottomColor: { value: new THREE.Color(data.bottomColor) },
            directionMode: { value: data.direction === 'horizontal' ? 1 
                                   : (data.direction === 'radial' ? 2 : 0) }
          },
          vertexShader: this.vertexShader,
          fragmentShader: this.fragmentShader,
          side: THREE.BackSide
        });
      },
      
      update: function(data) {
        if (this.material) {
          this.material.uniforms.topColor.value.set(data.topColor);
          this.material.uniforms.bottomColor.value.set(data.bottomColor);
          this.material.uniforms.directionMode.value = 
            data.direction === 'horizontal' ? 1 : (data.direction === 'radial' ? 2 : 0);
        }
      }
    });
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