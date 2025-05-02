/**
 * Engine Manager - Handles loading and initializing engine components
 * 
 * This module is responsible for:
 * 1. Loading engine configuration from engine-config.json
 * 2. Setting up avatar and camera systems
 * 3. Initializing network components
 * 4. Managing any other engine-specific functionality
 */

import { getState, setState } from './state.js';
import { generateEntityId } from './utils.js';

// Default engine config path
const DEFAULT_ENGINE_CONFIG_PATH = 'engine-config.json';

class EngineManager {
  constructor() {
    this.config = null;
    this.initialized = false;
    this.scene = null;
    this.avatarSystem = null;
    this.cameraSystem = null;
  }

  /**
   * Initialize the engine manager
   * @param {HTMLElement} scene - The A-Frame scene element
   * @returns {Promise<void>}
   */
  async init(scene) {
    if (this.initialized) return;
    
    this.scene = scene;
    
    try {
      // Load engine configuration
      console.log('[EngineManager] Loading engine configuration');
      await this.loadEngineConfig();
      
      // Setup systems
      console.log('[EngineManager] Setting up engine systems');
      await this.setupSystems();
      
      this.initialized = true;
      console.log('[EngineManager] Engine manager initialized');
    } catch (error) {
      console.error('[EngineManager] Error initializing engine manager:', error);
      throw error;
    }
  }

  /**
   * Load engine configuration from file
   * @param {string} configPath - Path to engine config file
   * @returns {Promise<Object>} - Loaded config
   */
  async loadEngineConfig(configPath = DEFAULT_ENGINE_CONFIG_PATH) {
    try {
      console.log(`[EngineManager] Loading engine config from: ${configPath}`);
      
      const response = await fetch(configPath);
      if (!response.ok) {
        throw new Error(`Failed to load engine config: ${response.status} ${response.statusText}`);
      }
      
      this.config = await response.json();
      console.log('[EngineManager] Engine config loaded:', this.config);
      
      // Update state with engine configuration
      const state = getState();
      setState({
        ...state,
        engine: {
          ...this.config,
          loaded: true
        }
      }, 'engine-manager');
      
      return this.config;
    } catch (error) {
      console.error('[EngineManager] Error loading engine config:', error);
      throw error;
    }
  }

  /**
   * Setup engine systems based on loaded config
   * @returns {Promise<void>}
   */
  async setupSystems() {
    if (!this.config) {
      console.error('[EngineManager] Cannot setup systems - config not loaded');
      return;
    }
    
    if (!this.scene) {
      console.error('[EngineManager] Cannot setup systems - scene not available');
      return;
    }
    
    try {
      // Setup avatar system if enabled
      if (this.config.avatar?.enabled) {
        await this.setupAvatarSystem();
      }
      
      // Setup camera system
      await this.setupCameraSystem();
      
      // Setup network if enabled
      if (this.config.network?.enabled) {
        this.setupNetwork();
      }
      
      // Setup physics if enabled
      if (this.config.physics?.enabled) {
        this.setupPhysics();
      }
    } catch (error) {
      console.error('[EngineManager] Error setting up systems:', error);
      throw error;
    }
  }

  /**
   * Setup avatar system
   * @returns {Promise<void>}
   */
  async setupAvatarSystem() {
    try {
      console.log('[EngineManager] Setting up avatar system');
      
      // Import avatar system dynamically - it's already an initialized singleton instance
      const avatarModule = await import('./avatar-system.js');
      this.avatarSystem = avatarModule.default;
      
      // Initialize avatar system with the scene
      if (!this.avatarSystem.isInitialized) {
        await this.avatarSystem.init(this.scene);
      }
      
      console.log('[EngineManager] Avatar system initialized');
    } catch (error) {
      console.error('[EngineManager] Error setting up avatar system:', error);
      throw error;
    }
  }

  /**
   * Setup camera system
   * @returns {Promise<void>}
   */
  async setupCameraSystem() {
    try {
      console.log('[EngineManager] Setting up camera system');
      
      // For now, just ensure the camera is set correctly
      // In the future, this could be expanded to handle multiple cameras, etc.
      const cameraOptions = this.config.camera?.options || {};
      const defaultCameraId = this.config.camera?.default || 'avatar-camera';
      
      // Find the default camera
      const defaultCamera = this.scene.querySelector(`#${defaultCameraId}`);
      if (defaultCamera) {
        // Set camera options
        Object.entries(cameraOptions).forEach(([key, value]) => {
          defaultCamera.setAttribute('camera', key, value);
        });
        
        // Make sure it's active
        defaultCamera.setAttribute('camera', 'active', true);
        
        // Ensure look-controls and wasd-controls are enabled
        if (defaultCameraId === 'avatar-camera') {
          defaultCamera.setAttribute('look-controls', 'enabled', true);
          defaultCamera.setAttribute('wasd-controls', 'enabled', true);
          
          // Ensure camera is at proper height if it's the avatar camera
          // Import the RIG_CONFIG to get the correct height
          try {
            const configModule = await import('./config.js');
            const RIG_CONFIG = configModule.RIG_CONFIG || { height: 1.6 };
            const cameraHeight = RIG_CONFIG.height || 1.6;
            
            // Set camera position to maintain proper height
            const currentPos = defaultCamera.getAttribute('position') || { x: 0, y: 0, z: 0 };
            currentPos.y = cameraHeight;
            
            console.log(`[EngineManager] Setting camera height to ${cameraHeight}`, currentPos);
            defaultCamera.setAttribute('position', currentPos);
            
            // Find the avatar-rig and ensure its position is set correctly too
            const avatarRig = this.scene.querySelector('#avatar-rig');
            if (avatarRig) {
              const rigPosition = configModule.RIG_CONFIG?.spawn || { x: 0, y: 0, z: 3 };
              console.log(`[EngineManager] Setting avatar rig position`, rigPosition);
              avatarRig.setAttribute('position', `${rigPosition.x} ${rigPosition.y} ${rigPosition.z}`);
            }
          } catch (configError) {
            console.warn('[EngineManager] Error importing config for camera height:', configError);
            // Set a default height if we can't import the config
            const currentPos = defaultCamera.getAttribute('position') || { x: 0, y: 0, z: 0 };
            currentPos.y = 1.6; // Default eye height
            defaultCamera.setAttribute('position', currentPos);
          }
        }
        
        console.log(`[EngineManager] Camera #${defaultCameraId} configured with options:`, cameraOptions);
      } else {
        console.warn(`[EngineManager] Default camera #${defaultCameraId} not found`);
      }
      
      console.log('[EngineManager] Camera system initialized');
    } catch (error) {
      console.error('[EngineManager] Error setting up camera system:', error);
    }
  }

  /**
   * Setup network functionality
   */
  setupNetwork() {
    try {
      console.log('[EngineManager] Setting up network');
      
      // Apply network configuration to scene
      const networkConfig = this.config.network;
      if (networkConfig) {
        // Apply network attributes to scene
        const networkAttrs = {
          room: networkConfig.room || 'default',
          connectOnLoad: networkConfig.connectOnLoad !== false,
          debug: networkConfig.debug === true,
          debugLevel: networkConfig.debugLevel || 'none'
        };
        
        // Set networked-scene component on scene
        const networkAttrString = Object.entries(networkAttrs)
          .map(([key, value]) => `${key}: ${value}`)
          .join('; ');
        
        this.scene.setAttribute('networked-scene', networkAttrString);
      }
      
      console.log('[EngineManager] Network initialized');
    } catch (error) {
      console.error('[EngineManager] Error setting up network:', error);
    }
  }

  /**
   * Setup physics system
   */
  setupPhysics() {
    try {
      console.log('[EngineManager] Setting up physics');
      
      // Apply physics configuration
      const physicsConfig = this.config.physics;
      if (physicsConfig) {
        // Set physics system attributes on scene
        if (physicsConfig.gravity) {
          const gravity = physicsConfig.gravity;
          this.scene.setAttribute('physics', `gravity: ${gravity.x} ${gravity.y} ${gravity.z}; debug: ${physicsConfig.debug}`);
        }
      }
      
      console.log('[EngineManager] Physics initialized');
    } catch (error) {
      console.error('[EngineManager] Error setting up physics:', error);
    }
  }

  /**
   * Get engine configuration
   * @returns {Object} Current engine configuration
   */
  getConfig() {
    return this.config;
  }

  /**
   * Save engine configuration to file (in a real app, this would be a server request)
   * @returns {Promise<boolean>} Whether the save was successful
   */
  async saveConfig() {
    try {
      console.log('[EngineManager] Saving engine configuration');
      
      // In a real application, this would trigger a request to save on the server
      // For browser-only implementation, create and trigger a download
      const dataStr = JSON.stringify(this.config, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = 'engine-config.json';
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      console.log('[EngineManager] Engine configuration saved');
      return true;
    } catch (error) {
      console.error('[EngineManager] Error saving engine configuration:', error);
      return false;
    }
  }

  /**
   * Check if an entity is a system entity based on engine configuration
   * @param {Object} entity - Entity data or DOM element
   * @param {string} uuid - Entity UUID (optional)
   * @returns {boolean} Whether entity is a system entity
   */
  isSystemEntity(entity, uuid) {
    if (!entity) return false;
    
    // Get system configuration
    const systemConfig = this.config?.system;
    if (!systemConfig) return false;
    
    const systemEntityIds = systemConfig.entityIds || [];
    const systemComponents = systemConfig.components || [];
    const systemDataAttrs = systemConfig.dataAttributes || [];
    
    // DOM element checks
    if (entity instanceof HTMLElement) {
      // Check entity ID
      if (systemEntityIds.includes(entity.id)) return true;
      
      // Check for avatar and camera related items
      if (entity.id && (entity.id.includes('avatar') || entity.id.includes('camera') || entity.id.includes('rig'))) {
        return true;
      }
      
      // Check for system components
      const hasSystemComponent = systemComponents.some(comp => entity.hasAttribute(comp));
      if (hasSystemComponent) return true;
      
      // Check for networked entities
      if (entity.hasAttribute('networked')) return true;
      
      // Check entity UUID
      const entityUuid = entity.getAttribute('data-entity-uuid');
      if (entityUuid && (entityUuid.includes('avatar') || entityUuid.includes('camera') || entityUuid.includes('rig'))) {
        return true;
      }
      
      // Check for system data attributes
      const hasSystemDataAttr = systemDataAttrs.some(attr => entity.hasAttribute(attr));
      if (hasSystemDataAttr) return true;
      
      // EXPLICITLY do not consider lights as system entities
      if (entity.hasAttribute('light') && !systemEntityIds.includes(entity.id)) {
        return false;
      }
    } 
    // State entity object checks
    else {
      // Check ID
      if (entity.id && systemEntityIds.includes(entity.id)) return true;
      
      // Check for avatar and camera related IDs
      if (entity.id && (entity.id.includes('avatar') || entity.id.includes('camera') || entity.id.includes('rig'))) {
        return true;
      }
      
      // Check for camera component
      if (entity.camera !== undefined) return true;
      
      // Check if entity is a networked entity
      if (entity.networked) return true;
      
      // Check UUID patterns
      if (uuid && (uuid.includes('avatar') || uuid.includes('camera') || uuid.includes('rig'))) {
        return true;
      }
      
      // EXPLICITLY do not consider lights as system entities unless they are in systemEntityIds
      if (entity.type === 'light' && !systemEntityIds.includes(entity.id)) {
        return false;
      }
    }
    
    return false;
  }
}

// Create and export singleton instance
const engineManager = new EngineManager();
export default engineManager; 