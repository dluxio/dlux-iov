/**
 * Scene Loader - Loads scene data from external files
 */

import { setState, getState } from './state.js';
import { generateEntityId } from './utils.js';
import { logAction } from './debug.js';
import { updateMonacoEditor } from './monaco.js';
import { recreateAllEntities } from './entity-api.js';
import { environmentManager } from './environment-manager.js';
import engineManager from './engine-manager.js';
import { DEFAULT_SCENE_PATH, STARTUP_SCENE_PATH } from './config.js';

/**
 * Load a scene from a JSON file
 * @param {string} scenePath - Path to the scene JSON file
 * @returns {Promise<Object>} - The loaded scene data
 */
export async function loadSceneFromFile(scenePath = DEFAULT_SCENE_PATH) {
  logAction(`Loading scene from: ${scenePath}`);
  
  try {
    const response = await fetch(scenePath);
    if (!response.ok) {
      throw new Error(`Failed to load scene: ${response.status} ${response.statusText}`);
    }
    
    const sceneData = await response.json();
    
    // Validate the scene data has the minimum required structure
    if (!sceneData.entities && !Array.isArray(sceneData.entities)) {
      console.warn(`[SceneLoader] Scene from ${scenePath} is missing entities array, initializing as empty array`);
      sceneData.entities = [];
    }
    
    if (!sceneData.metadata) {
      console.warn(`[SceneLoader] Scene from ${scenePath} is missing metadata, adding default metadata`);
      sceneData.metadata = {
        title: "Unnamed Scene",
        description: "Scene with default metadata",
        created: new Date().toISOString(),
        modified: new Date().toISOString()
      };
    }
    
    return sceneData;
  } catch (error) {
    console.error('Error loading scene file:', error);
    
    // If we fail to load the requested scene, try loading the default scene
    if (scenePath !== DEFAULT_SCENE_PATH) {
      console.warn(`Falling back to default scene: ${DEFAULT_SCENE_PATH}`);
      return loadSceneFromFile(DEFAULT_SCENE_PATH);
    }
    
    // If even the default scene fails, create a minimal scene with lights
    console.warn('Creating minimal fallback scene with basic lights');
    return {
      metadata: {
        title: "Fallback Scene",
        description: "Basic scene created as fallback when scene load fails",
        created: new Date().toISOString(),
        modified: new Date().toISOString()
      },
      sky: {
        type: "color",
        data: {
          color: "#AAAAAA"
        }
      },
      entities: [
        {
          type: "light",
          id: "ambient-light",
          light: {
            type: "ambient",
            color: "#BBB",
            intensity: 0.5
          }
        },
        {
          type: "light",
          id: "directional-light",
          light: {
            type: "directional",
            color: "#FFF",
            intensity: 1.0,
            castShadow: true
          },
          position: { x: -1, y: 1, z: 0 }
        }
      ]
    };
  }
}

/**
 * Create state object from scene data
 * @param {Object} sceneData - Scene data from JSON file
 * @returns {Object} State object
 */
export function createStateFromScene(sceneData) {
  // Get current state for structure, but don't keep entities or mappings
  const state = getState();
  const newState = {
    entities: {},
    entityMapping: {},
    assets: {}, // Assets will be loaded from scene data
    metadata: {
      ...state.metadata,
      modified: Date.now()
    }
  };

  // Copy any important state fields that should persist
  if (state.camera) {
    newState.camera = state.camera;
  }

  // Process assets first, since entities might reference them
  if (sceneData.assets && Array.isArray(sceneData.assets)) {
    console.log('[SceneLoader] Processing assets from scene data:', sceneData.assets.length);
    
    // Process each asset and add to state
    sceneData.assets.forEach(assetData => {
      if (!assetData.id || !assetData.src) {
        console.warn('[SceneLoader] Invalid asset in scene data, skipping:', assetData);
        return;
      }
      
      // Create asset object
      const assetId = assetData.id;
      newState.assets[assetId] = {
        id: assetId,
        type: assetData.type || 'image', // Default to image if not specified
        src: assetData.src,
        loaded: false,
        loading: false,
        metadata: assetData.metadata || {},
        tags: assetData.tags || [],
        created: Date.now()
      };
    });
    
    console.log('[SceneLoader] Added assets to state:', Object.keys(newState.assets).length);
  }
  
  // Process sky configuration
  if (sceneData.sky) {
    const skyUuid = generateEntityId('sky');
    
    // Convert legacy format to new structure if needed
    let skyType = 'color';
    let skyData = {};
    
    if (sceneData.sky.type && 
        ['color', 'image', 'video', 'environment', 'gradient', 'none'].includes(sceneData.sky.type)) {
      // New format with explicit type
      skyType = sceneData.sky.type;
      skyData = sceneData.sky.data || {};
    } else if (sceneData.sky.color) {
      // Legacy format with just color
      skyType = 'color';
      skyData = { color: sceneData.sky.color };
    }
    
    // Handle old format attributes that might be at the root level
    if (sceneData.sky.image && !skyData.image) {
      skyType = 'image';
      skyData.image = sceneData.sky.image;
    }
    
    if (sceneData.sky.video && !skyData.video) {
      skyType = 'video';
      skyData.video = sceneData.sky.video;
    }
    
    if (sceneData.sky.environment && !skyData.environment) {
      skyType = 'environment';
      skyData.environment = sceneData.sky.environment;
    }
    
    // Check if the sky references an asset
    if ((skyType === 'image' || skyType === 'video') && sceneData.sky.assetId) {
      skyData.assetId = sceneData.sky.assetId;
      
      // If there's an assetId, make sure it exists in assets
      if (!newState.assets[skyData.assetId]) {
        // Create an asset entry for it
        const assetType = skyType === 'image' ? 'image' : 'video';
        const assetSrc = skyType === 'image' ? skyData.image : skyData.video;
        
        if (assetSrc) {
          newState.assets[skyData.assetId] = {
            id: skyData.assetId,
            type: assetType,
            src: assetSrc,
            loaded: false,
            loading: false,
            tags: ['sky', 'background'],
            created: Date.now()
          };
        }
      }
    }
    
    // Create sky configuration in the proper format for SkyManager
    const skyConfig = {
      type: skyType,
      data: skyData,
      uuid: skyUuid
    };
    
    // Add to state for later use by SkyManager
    newState.sky = skyConfig;
    
    // We no longer create an entity for the sky directly
    // Instead, SkyManager will handle it based on the sky configuration in state
    console.log('[SceneLoader] Added sky configuration to state:', skyConfig);
  }

  // Process entities - if there are any in the scene data
  if (sceneData.entities && Array.isArray(sceneData.entities)) {
    // Process entities from scene data
    sceneData.entities.forEach(entity => {
      // Skip if no entity data
      if (!entity) return;
      
      // Generate ID if not present
      const uuid = entity.uuid || generateEntityId(entity.type);
      
      // Check for asset references and update to proper format
      if (entity.assetId && (entity.src === undefined)) {
        // Entity references an asset by ID
        if (newState.assets[entity.assetId]) {
          // Set the src attribute to reference the asset
          entity.src = `#${entity.assetId}`;
        }
      }
      
      // Add entity to state
      newState.entities[uuid] = {
        ...entity,
        uuid
      };
    });
  }

  return newState;
}

/**
 * Apply scene data to the application
 * @param {Object} sceneData - The scene data to apply
 * @returns {Promise<void>}
 */
export async function applySceneData(sceneData) {
  console.log('[SceneLoader] Applying scene data to app state');
  
  try {
    // Remove A-Frame's default camera and lights to prevent conflicts
    removeAFrameDefaultCamera();
    removeAFrameDefaultLights();
    
    // Validate scene data before proceeding
    if (!sceneData) {
      console.error('[SceneLoader] Invalid scene data - cannot apply null or undefined data');
      sceneData = {
        metadata: {
          title: "Emergency Fallback Scene",
          description: "Created due to invalid scene data"
        },
        entities: []
      };
    }
    
    // Convert scene data to application state format
    const newState = createStateFromScene(sceneData);
    
    // Ensure entities is never null or undefined
    if (!newState.entities) {
      console.warn('[SceneLoader] Entities missing in created state, initializing as empty object');
      newState.entities = {};
    }
    
    // Ensure entityMapping is never null or undefined
    if (!newState.entityMapping) {
      console.warn('[SceneLoader] EntityMapping missing in created state, initializing as empty object');
      newState.entityMapping = {};
    }
    
    // Ensure metadata is never null or undefined
    if (!newState.metadata) {
      console.warn('[SceneLoader] Metadata missing in created state, initializing as empty object');
      newState.metadata = {
        title: "Untitled Scene",
        loaded: Date.now(),
        modified: Date.now()
      };
    }
    
    // Apply the new state
    setState(newState, 'scene-loader');
    
    // Add source info to metadata
    if (sceneData.metadata && !newState.metadata.source) {
      newState.metadata.source = sceneData.metadata.title || 'Unknown source';
    }
    
    // Update the loading time in metadata
    newState.metadata.loaded = Date.now();
    
    // Log what we're applying
    console.log(`[SceneLoader] Applying scene: ${newState.metadata?.title || 'Untitled'}`);
    console.log(`[SceneLoader] Scene contains ${(newState.entities ? Object.keys(newState.entities).length : 0)} entities`);
    
    // Update application state - this will trigger state-changed events
    // which will be picked up by SkyManager and other managers
    setState(newState, 'scene-loader');
    
    // Initialize environment manager if it's not already initialized
    if (environmentManager && !environmentManager.initialized) {
      console.log('[SceneLoader] Initializing environment manager');
      environmentManager.init();
    }
    
    // Ensure environment exists based on state
    if (environmentManager && environmentManager.initialized) {
      console.log('[SceneLoader] Ensuring environment exists');
      environmentManager.ensureEnvironmentExists();
    }
    
    // Ensure SkyManager is initialized and processes the sky from state
    try {
      // Import skyManager to ensure it's loaded
      const { skyManager } = await import('./sky-manager.js');
      
      if (!skyManager.initialized) {
        console.log('[SceneLoader] Initializing SkyManager');
        skyManager.init();
      }
      
      // Force ensure the sky exists based on the state - use a small delay to ensure state is updated
      console.log('[SceneLoader] Ensuring sky exists based on state');
      setTimeout(() => {
        // Try again with a fresh state reference
        try {
          const currentState = getState();
          if (currentState && currentState.sky) {
            console.log('[SceneLoader] Direct sky application from state in timeout');
            skyManager._applySkyFromState(currentState.sky);
          } else {
            console.log('[SceneLoader] No sky in state during timeout callback');
          }
        } catch (innerError) {
          console.error('[SceneLoader] Error in delayed sky initialization:', innerError);
        }
      }, 300);
      
      // Immediate attempt as well
      skyManager.ensureSkyExists();
      
    } catch (skyError) {
      console.error('[SceneLoader] Error initializing sky:', skyError);
    }
    
    // Try to recreate entities, with robust error handling
    try {
      // Check if watcher is available before recreating entities
      if (!window.watcher || typeof window.watcher.save !== 'function') {
        console.warn('[SceneLoader] Watcher not available for scene recreation, will try without it');
        // Instead of just warning, create a dummy watcher to prevent further warnings
        if (!window.watcher) {
          window.watcher = {
            save: () => console.log('[SceneLoader] Using dummy watcher.save()'),
            saveEntitiesToState: () => console.log('[SceneLoader] Using dummy watcher.saveEntitiesToState()')
          };
          console.log('[SceneLoader] Created dummy watcher to prevent warnings');
        }
      }
      
      // Recreate all entities in the scene from the new state
      await recreateAllEntities();
      console.log('[SceneLoader] Successfully recreated all entities from scene data');
    } catch (entityError) {
      console.error('[SceneLoader] Error recreating entities, will try to continue:', entityError);
    }
    
    // Update the Monaco editor with robust error handling
    try {
      // Update the Monaco editor to reflect the new state
      if (typeof updateMonacoEditor === 'function') {
        updateMonacoEditor(true);
      } else {
        console.warn('[SceneLoader] Monaco editor update function not available, trying to import');
        // Try importing the module directly
        try {
          const monaco = await import('./monaco.js');
          if (monaco && typeof monaco.updateMonacoEditor === 'function') {
            monaco.updateMonacoEditor(true);
          } else {
            console.warn('[SceneLoader] Could not find updateMonacoEditor function after import');
          }
        } catch (importError) {
          console.warn('[SceneLoader] Failed to import monaco.js module:', importError);
        }
      }
    } catch (editorError) {
      console.error('[SceneLoader] Error updating editor, continuing anyway:', editorError);
    }
    
    // Process sky and environment
    try {
      // Process sky data from the scene
      if (sceneData.sky) {
        console.log('[SceneLoader] Applying sky from scene data:', sceneData.sky);
        
        // Ensure sky has a UUID
        if (!sceneData.sky.uuid) {
          sceneData.sky.uuid = generateEntityId('sky');
        }
        
        // Add sky to state
        newState.sky = sceneData.sky;
        
        // Find or create the sky entity in the DOM after a short delay
        setTimeout(() => {
          // Look for existing sky entity
          let skyEntity = document.querySelector('a-sky, a-videosphere');
          if (skyEntity) {
            // Update existing sky with proper attributes
            skyEntity.dataset.entityUuid = sceneData.sky.uuid;
            skyEntity.dataset.skyType = sceneData.sky.type || 'color';
            
            // Update color for color skies
            if (sceneData.sky.type === 'color' && sceneData.sky.data?.color) {
              skyEntity.setAttribute('color', sceneData.sky.data.color);
            }
          }
          
          // Force watcher to capture the sky
          if (window.watcher && typeof window.watcher.saveEntitiesToState === 'function') {
            window.watcher.saveEntitiesToState('scene-sky-setup');
          }
        }, 500);
      }
      
      // Process environment data
      if (sceneData.environment) {
        // ... existing environment processing code ...
      }
    } catch (skyEnvError) {
      console.error('[SceneLoader] Error processing sky and environment:', skyEnvError);
    }
    
    logAction('Scene applied successfully');
    return newState;
  } catch (error) {
    console.error('[SceneLoader] Error applying scene data:', error);
    throw error;
  }
}

/**
 * Clean up A-Frame's auto-created default camera
 * This prevents conflicts with our avatar camera system
 */
function removeAFrameDefaultCamera() {
  console.log('[SceneLoader] Checking for A-Frame default camera');
  const scene = document.querySelector('a-scene');
  if (!scene) return;
  
  // A-Frame creates a default camera if none is present
  // It could be an a-entity[camera] without ID or data-entity-uuid
  const defaultCameras = scene.querySelectorAll('a-entity[camera]');
  
  let removedCount = 0;
  
  defaultCameras.forEach(camera => {
    // Only remove cameras that don't have data-entity-uuid (not part of our system)
    // and don't have an ID (likely A-Frame defaults)
    if (!camera.dataset.entityUuid && !camera.id) {
      console.log('[SceneLoader] Removing A-Frame default camera:', camera);
      scene.removeChild(camera);
      removedCount++;
    }
  });
  
  if (removedCount > 0) {
    console.log(`[SceneLoader] Removed ${removedCount} A-Frame default cameras`);
  } else {
    console.log('[SceneLoader] No A-Frame default cameras found');
  }
}

/**
 * Clean up A-Frame's auto-created default lighting
 * This prevents duplicate lights when loading our scene's lighting configuration
 */
function removeAFrameDefaultLights() {
  console.log('[SceneLoader] Checking for A-Frame default lights');
  const scene = document.querySelector('a-scene');
  if (!scene) return;
  
  // A-Frame creates a default directional light and ambient light if none present
  // These default lights don't have IDs, so we need to find them by their attributes
  const defaultLights = scene.querySelectorAll('a-entity[light]');
  
  let removedCount = 0;
  let removedLights = []; // Keep track of removed lights
  
  defaultLights.forEach(light => {
    // Only remove lights that don't have data-entity-uuid (not part of our system)
    // and don't have an ID (likely A-Frame defaults)
    if (!light.dataset.entityUuid && !light.id) {
      console.log('[SceneLoader] Removing A-Frame default light:', light);
      
      // Before removing, check if this light is in the state
      if (light.getAttribute('data-entity-uuid')) {
        removedLights.push(light.getAttribute('data-entity-uuid'));
      }
      
      scene.removeChild(light);
      removedCount++;
    }
  });
  
  if (removedCount > 0) {
    console.log(`[SceneLoader] Removed ${removedCount} A-Frame default lights`);
    
    // Also remove these lights from state if they exist
    if (removedLights.length > 0) {
      // Get current state
      const state = getState();
      if (state && state.entities) {
        let changed = false;
        
        // Look for any entity in state that doesn't exist in DOM anymore
        Object.keys(state.entities).forEach(uuid => {
          const entity = state.entities[uuid];
          if (entity.type === 'light' && !document.querySelector(`[data-entity-uuid="${uuid}"]`)) {
            console.log(`[SceneLoader] Removing light entity from state: ${uuid}`);
            delete state.entities[uuid];
            changed = true;
          }
        });
        
        // Update state if changed
        if (changed) {
          setState(state, 'remove-default-lights');
        }
      }
    }
  } else {
    console.log('[SceneLoader] No A-Frame default lights found');
  }
}

/**
 * Load and apply a scene from a file
 * @param {string} scenePath - Path to the scene file
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - The applied state
 */
export async function loadScene(scenePath = DEFAULT_SCENE_PATH, options = {}) {
  try {
    console.log(`[SceneLoader] Loading scene from: ${scenePath}`, options);
    
    // Step 1: Ensure engine manager is initialized
    try {
      const scene = document.querySelector('a-scene');
      if (!engineManager.initialized && scene) {
        console.log('[SceneLoader] Initializing engine manager');
        await engineManager.init(scene);
      }
    } catch (engineError) {
      console.error('[SceneLoader] Engine initialization error:', engineError);
      // Continue anyway - we can still load the scene
    }
    
    // Step 2: Reset state if needed
    try {
      // Clear existing state completely before loading new scene
      const stateModule = await import('./state.js');
      
      // Reset state to empty - this will clear all existing entities
      console.log('[SceneLoader] Resetting state before loading new scene');
      stateModule.resetState();
      
      // Wait for state reset to propagate
      await new Promise(resolve => setTimeout(resolve, 200));

      // Ensure local-avatar entity exists - it might have been removed during state reset
      console.log('[SceneLoader] Checking for local-avatar entity');
      const localAvatar = document.querySelector('#local-avatar');
      if (!localAvatar) {
        console.log('[SceneLoader] Creating new local-avatar entity');
        const scene = document.querySelector('a-scene');
        if (scene) {
          // Get avatar positioning from engine config
          let position = "0 0 3"; // Default position
          if (engineManager.initialized && engineManager.config?.avatar?.spawn?.position) {
            const posData = engineManager.config.avatar.spawn.position;
            position = `${posData.x} ${posData.y} ${posData.z}`;
          }
          
          // Create new local-avatar entity with the template
          const newAvatar = document.createElement('a-entity');
          newAvatar.id = 'local-avatar';
          newAvatar.setAttribute('networked', 'template: #avatar-template; attachTemplateToLocal: true;');
          newAvatar.setAttribute('position', position);
          scene.appendChild(newAvatar);
          
          console.log('[SceneLoader] Local-avatar recreated with position:', position);
          
          // Give a moment for the entity to initialize
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } else {
        console.log('[SceneLoader] Local-avatar entity already exists');
      }
    } catch (resetError) {
      console.error('[SceneLoader] Error resetting state:', resetError);
      // Continue anyway - we'll apply the new scene data over whatever state exists
    }
    
    // Step 3: Load scene data from file
    let sceneData;
    try {
      sceneData = await loadSceneFromFile(scenePath);
      console.log('[SceneLoader] File loaded:', sceneData.metadata?.title || 'Untitled Scene');
    } catch (loadError) {
      console.error('[SceneLoader] Critical error loading scene data:', loadError);
      throw loadError; // This error is critical, so propagate it
    }
    
    // Step 4: Apply the scene data
    let newState;
    try {
      console.log('[SceneLoader] Applying scene data to state');
      newState = await applySceneData(sceneData);
    } catch (applyError) {
      console.error('[SceneLoader] Error applying scene data:', applyError);
      throw applyError; // This error is critical, so propagate it
    }
    
    // Step 5: Ensure sky is properly initialized (this is crucial)
    try {
      console.log('[SceneLoader] Ensuring sky is properly initialized');
      
      // Import sky manager
      const { skyManager } = await import('./sky-manager.js');
      
      // Initialize if not already
      if (!skyManager.initialized) {
        console.log('[SceneLoader] Initializing SkyManager in dedicated step');
        skyManager.init();
      }
      
      // Force sky recreation from current state
      const currentState = getState();
      if (currentState && currentState.sky) {
        console.log('[SceneLoader] Directly applying sky in dedicated step:', currentState.sky.type);
        // Allow time for DOM elements to be ready
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Force direct application of sky
        try {
          skyManager._applySkyFromState(currentState.sky);
          console.log('[SceneLoader] Sky applied successfully in dedicated step');
        } catch (skyApplyError) {
          console.error('[SceneLoader] Error applying sky directly:', skyApplyError);
        }
      } else {
        console.log('[SceneLoader] No sky found in state during dedicated step');
      }
    } catch (skyStepError) {
      console.error('[SceneLoader] Error in dedicated sky step:', skyStepError);
    }

    // Give time for sky to be created before proceeding
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Step 6: Re-setup avatar and camera systems to ensure they're properly configured
    try {
      console.log('[SceneLoader] Re-initializing avatar and camera systems');
      if (engineManager.initialized) {
        // Check if we already have an avatar-rig to avoid creating duplicates
        const existingAvatarRig = document.querySelector('#avatar-rig');
        
        // Re-setup avatar system if enabled in engine config and no avatar-rig exists
        if (engineManager.config.avatar?.enabled && !existingAvatarRig) {
          console.log('[SceneLoader] Setting up avatar system - no avatar-rig found');
          await engineManager.setupAvatarSystem();
        } else if (existingAvatarRig) {
          console.log('[SceneLoader] Avatar rig already exists, skipping avatar system setup');
        }
        
        // Re-setup camera system to ensure camera properties are correct
        await engineManager.setupCameraSystem();
        
        // Ensure avatar position is correctly set from engine config
        const avatarRig = document.querySelector('#avatar-rig');
        if (avatarRig && engineManager.config?.avatar?.spawn?.position) {
          const rigPosition = engineManager.config.avatar.spawn.position;
          console.log('[SceneLoader] Setting avatar position from engine config:', rigPosition);
          avatarRig.setAttribute('position', `${rigPosition.x} ${rigPosition.y} ${rigPosition.z}`);
          
          // Get avatar camera and ensure it's set up correctly
          const avatarCamera = avatarRig.querySelector('#avatar-camera');
          if (avatarCamera) {
            // Set camera to active
            avatarCamera.setAttribute('camera', 'active', true);
            
            // Enable controls
            avatarCamera.setAttribute('look-controls', 'enabled', true);
            avatarCamera.setAttribute('wasd-controls', 'enabled', true);
            
            // Set camera height from engine config if available
            let cameraHeight = 1.6; // Default height
            if (engineManager.config?.avatar?.template?.children) {
              const cameraConfig = engineManager.config.avatar.template.children.find(
                child => child.id === 'avatar-camera'
              );
              if (cameraConfig && cameraConfig.position && cameraConfig.position.y !== undefined) {
                cameraHeight = cameraConfig.position.y;
              }
            }
            
            // Apply camera height
            const currentPos = avatarCamera.getAttribute('position') || { x: 0, y: 0, z: 0 };
            currentPos.y = cameraHeight;
            avatarCamera.setAttribute('position', `${currentPos.x} ${currentPos.y} ${currentPos.z}`);
            
            console.log(`[SceneLoader] Avatar camera reactivated at height ${cameraHeight} with controls enabled`);
          } else {
            console.warn('[SceneLoader] Avatar camera not found for reactivation');
          }
        } else {
          console.warn('[SceneLoader] Could not find avatar rig or engine config for avatar position');
        }
      }
    } catch (systemError) {
      console.error('[SceneLoader] Error re-initializing avatar/camera systems:', systemError);
      // Non-critical error, continue
    }
    
    // Step 7: Update Monaco editor
    try {
      console.log('[SceneLoader] Updating Monaco editor to match new scene');
      const monaco = await import('./monaco.js');
      
      // First clear the editor to prevent old content persistence
      if (typeof monaco.resetEditorToBlank === 'function') {
        await monaco.resetEditorToBlank();
      }
      
      // Then update with current state
      if (typeof monaco.updateMonacoEditor === 'function') {
        await monaco.updateMonacoEditor(true);
      }
    } catch (editorError) {
      console.error('[SceneLoader] Error syncing Monaco editor:', editorError);
      // Non-critical error, continue
    }
    
    // Step 8: Force a sync between DOM and state
    try {
      console.log('[SceneLoader] Syncing DOM and state');
      
      // Create a function to initialize a dummy watcher if needed
      const ensureWatcher = () => {
        if (!window.watcher) {
          console.log('[SceneLoader] Creating persistent watcher object');
          
          // Create base watcher object with required methods
          const dummyWatcher = {
            save: function(src) {
              console.log(`[SceneLoader] Using dummy watcher.save() from ${src || 'unknown'}`);
              return Promise.resolve();
            },
            saveEntitiesToState: function(src) {
              console.log(`[SceneLoader] Using dummy watcher.saveEntitiesToState() from ${src || 'unknown'}`);
              return Promise.resolve();
            },
            pendingOperations: []
          };
          
          // Add queue execution method
          dummyWatcher._executeQueuedOps = function() {
            console.log(`[SceneLoader] Executing ${this.pendingOperations.length} queued watcher operations`);
            const operations = [...this.pendingOperations];
            this.pendingOperations = [];
            
            operations.forEach(op => {
              try {
                if (typeof this[op.method] === 'function') {
                  console.log(`[SceneLoader] Executing queued ${op.method} from ${op.source}`);
                  this[op.method](op.source);
                }
              } catch (e) {
                console.warn(`[SceneLoader] Error executing queued operation ${op.method}:`, e);
              }
            });
          };
          
          // Assign the watcher to the window object
          window.watcher = dummyWatcher;
          
          // Watch for the real watcher to be initialized
          document.addEventListener('watcher-initialized', () => {
            if (window.watcher && window.watcher._executeQueuedOps) {
              window.watcher._executeQueuedOps();
            }
          }, { once: true });
        } else if (!window.watcher.saveEntitiesToState) {
          // If watcher exists but is missing the method, add it
          console.log('[SceneLoader] Adding missing saveEntitiesToState method to existing watcher');
          window.watcher.saveEntitiesToState = function(src) {
            console.log(`[SceneLoader] Using added watcher.saveEntitiesToState() from ${src || 'unknown'}`);
            return Promise.resolve();
          };
        }
        
        return window.watcher;
      };
      
      // Ensure watcher exists and has all needed methods
      const watcher = ensureWatcher();
      
      // Double check the method exists and log detailed info for debugging
      if (watcher) {
        console.log('[SceneLoader] Watcher object details:', {
          hasOwnSaveMethod: typeof watcher.save === 'function',
          hasOwnSaveEntitiesToStateMethod: typeof watcher.saveEntitiesToState === 'function',
          watcherType: Object.prototype.toString.call(watcher)
        });
        
        // Force-define method if it's still missing at this point
        if (typeof watcher.saveEntitiesToState !== 'function') {
          console.log('[SceneLoader] Forcing definition of saveEntitiesToState method');
          watcher.saveEntitiesToState = function(src) {
            console.log(`[SceneLoader] Using force-defined saveEntitiesToState() from ${src || 'unknown'}`);
            return Promise.resolve();
          };
        }
        
        // Now use the method which should definitely exist
        await watcher.saveEntitiesToState('scene-loader-post-sync');
        console.log('[SceneLoader] Successfully synced DOM and state');
      } else {
        console.warn('[SceneLoader] Failed to create or access watcher object');
      }
    } catch (syncError) {
      console.error('[SceneLoader] Error in post-load sync:', syncError);
      // Create emergency dummy watcher if an error occurred
      if (!window.watcher || typeof window.watcher.saveEntitiesToState !== 'function') {
        window.watcher = window.watcher || {};
        window.watcher.saveEntitiesToState = (src) => {
          console.log(`[SceneLoader] Using emergency saveEntitiesToState() from ${src || 'unknown'}`);
          return Promise.resolve();
        };
      }
    }
    
    // Step 9: Final check to ensure avatar system is properly initialized
    try {
      // Check if avatar rig exists, if not, try to force a reinit
      const avatarRig = document.querySelector('#avatar-rig');
      if (!avatarRig) {
        console.warn('[SceneLoader] Avatar rig not found in final check, attempting to reinitialize avatar system');
        
        // Ensure local-avatar exists
        let localAvatar = document.querySelector('#local-avatar');
        if (!localAvatar) {
          console.log('[SceneLoader] Creating local-avatar in final check');
          const scene = document.querySelector('a-scene');
          if (scene) {
            // Get avatar positioning from engine config
            let position = "0 0 3"; // Default position
            if (engineManager.initialized && engineManager.config?.avatar?.spawn?.position) {
              const posData = engineManager.config.avatar.spawn.position;
              position = `${posData.x} ${posData.y} ${posData.z}`;
            }
            
            // Create new local-avatar
            localAvatar = document.createElement('a-entity');
            localAvatar.id = 'local-avatar';
            localAvatar.setAttribute('networked', 'template: #avatar-template; attachTemplateToLocal: true;');
            localAvatar.setAttribute('position', position);
            scene.appendChild(localAvatar);
            
            console.log('[SceneLoader] Created local-avatar with position:', position);
          }
        }
        
        // Wait a moment for templates to attach
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Check one more time for avatar rig before reinitializing
        const rigCheckBeforeInit = document.querySelector('#avatar-rig');
        
        // Only reinitialize the avatar system if still no avatar-rig exists
        if (!rigCheckBeforeInit && engineManager.initialized && engineManager.config.avatar?.enabled) {
          console.log('[SceneLoader] Reinitializing avatar system');
          await engineManager.setupAvatarSystem();
          
          // Check again for the avatar rig
          const finalCheck = document.querySelector('#avatar-rig');
          if (finalCheck) {
            console.log('[SceneLoader] Avatar rig successfully recreated in final check');
          } else {
            console.error('[SceneLoader] Failed to recreate avatar rig despite reinitializing avatar system');
          }
        } else if (rigCheckBeforeInit) {
          console.log('[SceneLoader] Avatar rig appeared after waiting, no need to reinitialize avatar system');
        }
      } else {
        console.log('[SceneLoader] Avatar rig found in final check');
      }
    } catch (finalError) {
      console.error('[SceneLoader] Error in final avatar system check:', finalError);
    }
    
    console.log('[SceneLoader] Successfully loaded and applied new scene');
    return newState;
  } catch (error) {
    console.error('[SceneLoader] Critical error loading scene:', error);
    
    // If the specified scene fails, try loading the default startup scene as fallback
    if (scenePath !== STARTUP_SCENE_PATH) {
      console.warn(`[SceneLoader] Falling back to startup scene: ${STARTUP_SCENE_PATH}`);
      return loadScene(STARTUP_SCENE_PATH, options);
    }
    
    // If even that fails, just throw the error
    throw error;
  }
}

/**
 * Save current state to a JSON file
 * @param {string} filename - Name of the file to save
 * @returns {Promise<boolean>} - Whether the save was successful
 */
export async function saveCurrentScene(filename) {
  try {
    const state = getState();
    const sceneData = convertStateToSceneData(state);
    
    // In a real application, this would trigger a download
    // or communicate with a server to save the file
    console.log('Scene data ready for saving:', sceneData);
    
    // For browser-only implementation, create and trigger a download
    const dataStr = JSON.stringify(sceneData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = filename || 'scene.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    logAction(`Scene saved as: ${exportFileDefaultName}`);
    return true;
  } catch (error) {
    console.error('Error saving scene:', error);
    return false;
  }
}

/**
 * Convert application state to scene data format
 * @param {Object} state - The application state
 * @returns {Object} - Scene data in the expected format
 */
export function convertStateToSceneData(state) {
  // Import the new implementation for consistency
  try {
    const { convertStateToSceneData: newConvert } = require('./convertStateToSceneData.js');
    return newConvert(state);
  } catch (error) {
    console.warn('[SceneLoader] Could not import new convertStateToSceneData implementation, using fallback', error);
    
    // Fallback implementation
    const entities = [];
    const skyData = {};
    const environmentData = {};
    
    // Process entities
    Object.values(state.entities).forEach(entity => {
      // Skip system entities based on engine manager
      if (engineManager.initialized && engineManager.isSystemEntity(entity, entity.uuid)) {
        console.log(`Skipping system entity during export: ${entity.id || entity.type}`);
        return;
      }
      
      if (entity.type === 'sky') {
        // Handle sky entity according to the new structure
        skyData.type = 'color';
        if (entity.color) {
          skyData.data = { color: entity.color };
        }
      } else if (entity.type === 'environment') {
        // Handle environment entity separately
        environmentData.preset = entity.preset || 'default';
        environmentData.lighting = entity.lighting !== false;
        environmentData.ground = entity.ground !== false;
      } else {
        // Add regular entity to entities array
        const cleanEntity = { ...entity };
        delete cleanEntity.uuid;
        delete cleanEntity.DOM;
        
        entities.push(cleanEntity);
      }
    });
    
    // Get sky data from state.sky if exists and not already set from entities
    if (state.sky && Object.keys(skyData).length === 0) {
      skyData.type = state.sky.type || 'color';
      skyData.data = state.sky.data || {};
      
      // Handle legacy format
      if (state.sky.color && !skyData.data.color) {
        skyData.data.color = state.sky.color;
      }
    }
    
    return {
      metadata: {
        ...state.metadata,
        modified: Date.now()
      },
      sky: Object.keys(skyData).length > 0 ? skyData : undefined,
      environment: Object.keys(environmentData).length > 0 ? environmentData : undefined,
      entities
    };
  }
}

/**
 * Get available scenes for the scene selector
 * @returns {Promise<Array>} - Array of scene objects with name and path
 */
export async function getAvailableScenes() {
  // In a production app, this would fetch from a server or scan a directory
  // For this demo, we'll return predefined scenes
  return [
    { name: 'Default Scene', path: 'scenes/default-scene.json' },
    { name: 'Blank Scene', path: 'scenes/blank-scene.json' },
    { name: 'Advanced Scene', path: 'scenes/advanced-scene.json' },
    { name: 'Minimalist Scene', path: 'scenes/minimalist-scene.json' },
    { name: 'Gradient Sky Demo', path: 'scenes/gradient-sky-demo.json' },
    { name: 'Image Skybox Demo', path: 'scenes/image-skybox-demo.json' },
    { name: 'Video Skybox Demo', path: 'scenes/video-skybox-demo.json' }
  ];
}

/**
 * Create a scene selector UI
 * @param {HTMLElement} container - The container to render the selector in
 * @param {Function} onSelect - Callback when a scene is selected
 */
export function createSceneSelector(container, onSelect) {
  if (!container) return;
  
  // Get scenes - in a real application, this would be loaded from the server
  getAvailableScenes().then(scenes => {
    const selectorEl = document.createElement('div');
    selectorEl.className = 'scene-selector';
    
    const heading = document.createElement('h3');
    heading.textContent = 'Available Scenes';
    selectorEl.appendChild(heading);
    
    const list = document.createElement('ul');
    list.className = 'scene-list';
    
    scenes.forEach(scene => {
      const item = document.createElement('li');
      item.textContent = scene.name;
      item.dataset.path = scene.path;
      item.addEventListener('click', () => {
        if (typeof onSelect === 'function') {
          onSelect(scene.path);
        }
      });
      list.appendChild(item);
    });
    
    selectorEl.appendChild(list);
    container.appendChild(selectorEl);
  });
} 