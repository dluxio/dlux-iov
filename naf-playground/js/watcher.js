/**
 * watcher.js - A-Frame entity change detection system
 * 
 * This module provides a robust change detection system for A-Frame entities,
 * working both in the Inspector and in regular preview mode. It uses A-Frame's
 * component system to track individual entity changes and saves the scene state
 * when changes are detected.
 */

import { getState, setState, updateEntityState } from './state.js';
import { logAction } from './debug.js';
import { generateEntityId } from './utils.js';
import {
  shouldSkipAttribute,
  parseVector,
  vectorToString,
  extractGeometryData,
  cleanEntityData,
  extractEntityAttributes
} from './entity-utils.js';

import {
  INTERNAL_ATTRIBUTES,
  PRESERVED_DATA_ATTRIBUTES,
  VECTOR_ATTRIBUTES,
  COMPONENT_BASED_TYPES,
  STANDARD_PRIMITIVES,
  GEOMETRY_ATTRIBUTES,
  VECTOR_DEFAULTS,
  GEOMETRY_DEFAULTS,
  SYSTEM_ENTITY_TYPES,
  SYSTEM_ENTITY_IDS,
  SYSTEM_COMPONENTS,
  SYSTEM_DATA_ATTRIBUTES,
  FILTERED_ENTITY_TYPES,
  FILTERED_ENTITY_IDS,
  FILTERED_COMPONENTS,
  FILTERED_DATA_ATTRIBUTES,
  PANEL_IDS,
  WATCHER_CONFIG,
  EXCLUDED_ATTRIBUTES
} from './config.js';

import { skyManager } from './sky-manager.js';

// Constants
const PANEL_ID = PANEL_IDS.WATCHER;
const THROTTLE_TIME = WATCHER_CONFIG.THROTTLE_TIME;

// State variables
let watcherPanel = null;
let statusEl = null;
let entityCountEl = null;
let lastUpdateEl = null;
let saveButton = null;

// Track changes and save status
let changesPending = false;
let lastSaveTime = 0;

// Entity registry to track all entities
const entityRegistry = new Map();

// Configuration
const config = {
  autoSaveDelay: WATCHER_CONFIG.AUTO_SAVE_DELAY,
  debugMode: WATCHER_CONFIG.DEBUG_MODE
};

// Create global reference
if (typeof window !== 'undefined') {
  window.watcher = window.watcher || {};
}

let isInitializing = true;

/**
 * Set up watcher methods on the global watcher object
 */
export function setupWatcherMethods() {
    console.log('[Watcher] Setting up watcher methods');
    
    // Ensure the watcher object exists
    if (typeof window !== 'undefined' && !window.watcher) {
      window.watcher = {};
    }
    
    // Set up start method
    window.watcher.startWatching = function() {
        console.log('[Watcher] Starting watcher system...');
        
        // Set up mutation observer for scene changes
        setupSceneObserver();
        
        // Set up A-Frame hooks
        setupAFrameHooks();
        
        // Set up inspector detection
        setupInspectorDetection();
        
        console.log('[Watcher] Watcher system started successfully');
        
        return this;
    };
    
    // Set up core methods
    window.watcher.saveEntitiesToState = saveEntitiesToState;
    
    window.watcher.save = function(source = 'api-call') {
        return saveEntitiesToState(source);
    };
    
    // Add helper methods
    window.watcher.setupSceneObserver = setupSceneObserver;
    window.watcher.setupAFrameHooks = setupAFrameHooks;
    window.watcher.setupInspectorDetection = setupInspectorDetection;
    
    // Register this watcher instance as active
    window.watcher.active = true;
    
    return window.watcher;
}

// Initialize the A-Frame entity watcher component
if (window.AFRAME) {
  // Register the entity-watcher component
  AFRAME.registerComponent('entity-watcher', {
    schema: {
      enabled: { type: 'boolean', default: true }
    },
    
    init: function() {
      this.originalData = {};
      this.lastCheck = Date.now();
      this.isInitialized = false;
      
      // Wait for entity to be fully initialized and scene to be ready
      if (document.querySelector('a-scene').hasLoaded) {
        // Add a small delay to ensure entity is fully initialized
        setTimeout(() => {
          this.captureBaseline();
          this.isInitialized = true;
        }, 100);
      } else {
        document.querySelector('a-scene').addEventListener('loaded', () => {
          // Add a small delay to ensure entity is fully initialized
          setTimeout(() => {
            this.captureBaseline();
            this.isInitialized = true;
          }, 100);
        });
      }
    },
    
    update: function(oldData) {
      // Only process updates after initialization
      if (!this.isInitialized) return;
      
      // Skip too frequent updates during initialization
      const now = Date.now();
      if (now - this.lastCheck < 100) return;
      this.lastCheck = now;
      
      // Skip if this is a system entity
      if (isSystemEntity(this.el)) return;
      
      // Detect changes
      if (this.hasComponentChanges()) {
        // Update baseline first to prevent continuous detection
        this.captureBaseline();
        // Then trigger save
        throttledSaveChanges(`entity-component-update:${this.el.id || 'unnamed'}`);
      }
    },
    
    remove: function() {
      // Entity is being removed, trigger a save
      // Unregister this entity from our registry
      unregisterEntity(this.el);
      throttledSaveChanges(`entity-removed:${this.el.id || 'unnamed'}`);
    },
    
    play: function() {
      // When entity comes back to life, recapture baseline
      this.captureBaseline();
    },
    
    captureBaseline: function() {
      // Skip if this is a system entity
      if (isSystemEntity(this.el)) return;
      
      // Get all components on this entity
      const componentNames = Object.keys(this.el.components || {});
      
      // Store original data for each component
      this.originalData = {};
      componentNames.forEach(name => {
        // Skip the watcher itself and system components
        if (name === 'entity-watcher' || SYSTEM_COMPONENTS.includes(name)) return;
        
        // Store component data
        const comp = this.el.components[name];
        if (comp) {
          // Deep clone the data to avoid reference issues
          this.originalData[name] = JSON.parse(JSON.stringify(comp.data));
        }
      });
    },
    
    hasComponentChanges: function() {
      // If not initialized yet, no changes
      if (!this.isInitialized) return false;
      
      // Skip if this is a system entity
      if (isSystemEntity(this.el)) return false;
      
      // Get all components on this entity
      const componentNames = Object.keys(this.el.components || {});
      
      // Check for new components first
      for (const name of componentNames) {
        // Skip the watcher itself and system components
        if (name === 'entity-watcher' || SYSTEM_COMPONENTS.includes(name)) continue;
        
        // If component wasn't in original data, it's new
        if (!this.originalData.hasOwnProperty(name)) {
          if (config.debugMode) {
            console.log(`[Watcher] New component detected: ${name} on ${this.el.id || 'unnamed'}`);
          }
          return true;
        }
      }
      
      // Check for changed components
      for (const name in this.originalData) {
        const comp = this.el.components[name];
        
        // If component was removed, it's a change
        if (!comp) {
          if (config.debugMode) {
            console.log(`[Watcher] Component removed: ${name} from ${this.el.id || 'unnamed'}`);
          }
          return true;
        }
        
        // Skip position/rotation/scale for continuous updates
        if (['position', 'rotation', 'scale'].includes(name)) {
          // Only check these if they've changed significantly
          const newData = comp.data;
          const oldData = this.originalData[name];
          
          // Check if vector has changed significantly (using a larger threshold)
          const hasSignificantChange = ['x', 'y', 'z'].some(axis => {
            return Math.abs((newData[axis] || 0) - (oldData[axis] || 0)) > 0.01;
          });
          
          if (hasSignificantChange) {
            if (config.debugMode) {
              console.log(`[Watcher] Significant ${name} change detected on ${this.el.id || 'unnamed'}`);
            }
            return true;
          }
          continue;
        }
        
        // For other components, do a deep comparison
        try {
          const newJSON = JSON.stringify(comp.data);
          const oldJSON = JSON.stringify(this.originalData[name]);
          if (newJSON !== oldJSON) {
            if (config.debugMode) {
              console.log(`[Watcher] Component ${name} changed on ${this.el.id || 'unnamed'}`);
            }
            return true;
          }
        } catch (e) {
          // If we can't compare, assume no change
          console.warn(`[Watcher] Could not compare ${name} data, assuming no change`, e);
        }
      }
      
      return false;
    }
  });
  
  console.log('[Watcher] Entity watcher component registered');
} else {
  console.warn('[Watcher] A-Frame not found, entity watching disabled');
}

/**
 * Initialize the watcher system
 * @returns {Promise} Promise that resolves when initialization is complete
 */
export function initWatcher() {
  return new Promise((resolve) => {
    console.log('[Watcher] Initializing...');
    
    // Ensure the global watcher object exists
    if (typeof window !== 'undefined' && !window.watcher) {
      window.watcher = {};
    }
    
    // Setup core watcher methods first
    setupWatcherMethods();
    
    // Create the watcher panel
    createWatcherPanel();
    
    // Add A-Frame event listeners
    setupAFrameEventListeners();
    
    // Setup A-Frame hooks
    setupAFrameHooks();
    
    // Capture the initial entity baseline
    captureEntityBaseline();
    
    // Watch for A-Frame inspector state changes
    const body = document.body;
    const inspectorObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && 
            mutation.attributeName === 'class' &&
            (body.classList.contains('aframe-inspector-opened') || 
             body.classList.contains('a-inspector-closed'))) {
          checkInspectorState();
        }
      });
    });
    
    // Start observing inspector changes
    inspectorObserver.observe(body, { attributes: true });
    
    // Check if the inspector is already open
    if (body.classList.contains('aframe-inspector-opened')) {
      console.log('[Watcher] Inspector already open, setting up hooks...');
      setupInspectorHooks();
    }
    
    // Set up scene observer for changes
    setupSceneObserver();
    
    // Make sure all the required methods exist
    const requiredMethods = [
      'save', 
      'saveEntitiesToState',
      'startWatching'
    ];
    
    requiredMethods.forEach(method => {
      if (typeof window.watcher[method] !== 'function') {
        console.warn(`[Watcher] Method "${method}" is missing, adding fallback implementation`);
        window.watcher[method] = function(source = 'api-call') {
          console.log(`[Watcher] Called fallback implementation of ${method} from ${source}`);
          return Promise.resolve();
        };
      }
    });
    
    // Start the watcher if not already started
    if (typeof window.watcher.startWatching === 'function') {
      window.watcher.startWatching();
    }
    
    // Dispatch event to signal watcher is initialized
    document.dispatchEvent(new CustomEvent('watcher-initialized', {
      detail: { timestamp: Date.now() }
    }));
    
    console.log('[Watcher] Initialized with the following methods:', Object.keys(window.watcher));
    
    // Setup complete, resolve the promise
    resolve(window.watcher);
    
    // Perform initial state capture after a short delay
    setTimeout(() => {
      console.log('[Watcher] Performing initial state capture');
      saveEntitiesToState('watcher-start');
    }, 1000);
  });
}

/**
 * Set up A-Frame specific event listeners
 */
function setupAFrameEventListeners() {
  const scene = document.querySelector('a-scene');
  if (!scene) {
    console.warn('[Watcher] No scene found for event listeners');
    // Try again later
    setTimeout(setupAFrameEventListeners, 1000);
    return;
  }
  
  // Listen for child-attached event (when an entity is added to the scene)
  scene.addEventListener('child-attached', (event) => {
    const entity = event.detail.el;
    
    // Skip system entities
    if (isSystemEntity(entity)) return;
    
    // Add entity-watcher component if not present
    if (!entity.getAttribute('entity-watcher')) {
      entity.setAttribute('entity-watcher', '');
    }
    
    // Register entity
    registerEntity(entity);
    
    // Save changes
    throttledSaveChanges('entity-attached');
  });
  
  // Listen for child-detached event (when an entity is removed from the scene)
  scene.addEventListener('child-detached', (event) => {
    const entity = event.detail.el;
    
    // Skip system entities
    if (isSystemEntity(entity)) return;
    
    // Unregister entity
    unregisterEntity(entity);
    
    // Save changes
    throttledSaveChanges('entity-detached');
  });
  
  console.log('[Watcher] A-Frame event listeners set up');
}

/**
 * Create the watcher panel UI
 */
function createWatcherPanel() {
    if (document.getElementById(PANEL_ID)) {
        return; // Panel already exists
    }
    
    // Create panel
    watcherPanel = document.createElement('div');
    watcherPanel.id = PANEL_ID;
    watcherPanel.className = 'window';
    
    // Add content
    watcherPanel.innerHTML = `
        <div class="window-header">
            <span class="window-title">Scene Watcher</span>
            <div class="window-controls">
                <button class="window-btn minimize-btn">_</button>
                <button class="window-btn maximize-btn">□</button>
                <button class="window-btn close-btn">×</button>
            </div>
        </div>
        
        <div class="window-content">
            <div class="watcher-stats">
                <div class="stat-item">
                    <div class="stat-label">Entities</div>
                    <div class="stat-value" id="entity-count">0</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Changes</div>
                    <div class="stat-value" id="changes-count">0</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Last Update</div>
                    <div class="stat-value" id="last-update">Never</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Status</div>
                    <div class="stat-value" id="watcher-status">Ready</div>
                </div>
            </div>
            
            <div class="watcher-actions">
                <button class="watcher-btn save" id="save-changes">Save Changes</button>
                <button class="watcher-btn" id="toggle-debug">Debug</button>
            </div>
        </div>
        
        <div class="resize-handle right"></div>
        <div class="resize-handle bottom"></div>
        <div class="resize-handle corner"></div>
    `;
    
    // Add to document
    document.body.appendChild(watcherPanel);
    
    // Get references to elements
    statusEl = watcherPanel.querySelector('#watcher-status');
    entityCountEl = watcherPanel.querySelector('#entity-count');
    lastUpdateEl = watcherPanel.querySelector('#last-update');
    saveButton = watcherPanel.querySelector('#save-changes');
    
    // Add event listeners
    saveButton.addEventListener('click', () => {
        saveEntitiesToState('manual-save');
    });
    
    // Add watcher-active class by default
    watcherPanel.classList.add('watcher-active');

    // Initialize draggable functionality after a small delay to ensure DOM is ready
    setTimeout(() => {
        import('./draggable.js').then(module => {
            module.initDraggable(watcherPanel);
        });
    }, 0);
    
    console.log('[Watcher] Panel created');
}

/**
 * Set up A-Frame hooks for detecting changes
 */
function setupAFrameHooks() {
  console.log('[Watcher] Setting up A-Frame hooks');
  
  if (!window.AFRAME) {
    console.error('[Watcher] A-Frame not found');
    return;
  }

  try {
    // 1. Hook into scene loading to add the entity-watcher component to all entities
    setupSceneLoadedHook();
    
    // 2. Hook into scene's entity added events
    setupEntityAddedHook();
    
    // 3. Register a DOM observer to catch changes that happen outside A-Frame's component system
    setupSceneObserver();
    
    // 4. Hook into A-Frame's component definitions to catch all component updates
    setupComponentHooks();
    
    console.log('[Watcher] A-Frame hooks successfully set up');
  } catch (error) {
    console.error('[Watcher] Error setting up A-Frame hooks:', error);
  }
}

/**
 * Set up a hook for when the scene is loaded
 */
function setupSceneLoadedHook() {
  // Function to add entity-watcher to all existing entities
  function addWatcherToAllEntities() {
    const scene = document.querySelector('a-scene');
    if (!scene) return;
    
    // Use our consistent recursive function to find ALL A-Frame entities
    const entities = getAllAFrameEntities(scene);
    
    console.log(`[Watcher] Found ${entities.length} A-Frame entities in scene`);
    
    entities.forEach(entity => {
      if (!isSystemEntity(entity) && !entity.getAttribute('entity-watcher')) {
        console.log(`[Watcher] Adding watcher to entity:`, entity.tagName.toLowerCase(), entity.id || '(no id)');
        entity.setAttribute('entity-watcher', '');
        
        // Use flushToDOM to ensure component is registered
        if (typeof entity.flushToDOM === 'function') {
          entity.flushToDOM();
        }
      }
    });
    
    // Do an initial capture after a slight delay to ensure all entities are processed
    setTimeout(captureEntityBaseline, 100);
  }
  
  // Listen for scene loaded event
  document.addEventListener('a-scene-loaded', addWatcherToAllEntities);
  
  // Also try to add now in case the scene is already loaded
  setTimeout(addWatcherToAllEntities, 1000);
}

/**
 * Set up a hook for when new entities are added to the scene
 */
function setupEntityAddedHook() {
  // We'll use A-Frame's child-attached event that fires when new entities are added
  const scene = document.querySelector('a-scene');
  if (!scene) return;
  
  scene.addEventListener('child-attached', function(e) {
    const entity = e.detail.el;
    
    // Skip system entities
    if (isSystemEntity(entity)) return;
    
    // Check if it's an A-Frame entity (all primitives start with 'A-')
    if (entity.tagName && entity.tagName.toLowerCase().startsWith('a-')) {
      // Add the entity-watcher component if it doesn't have it
      if (!entity.getAttribute('entity-watcher')) {
        entity.setAttribute('entity-watcher', '');
        
        // Use flushToDOM to ensure all attributes are properly set
        if (typeof entity.flushToDOM === 'function') {
          entity.flushToDOM();
        }
      }
      
      if (config.debugMode) {
        console.log('[Watcher] New entity attached:', entity);
      }
      
      // Register the entity in our tracking system
      registerEntity(entity);
      
      // Trigger a save when a new entity is added
      throttledSaveChanges('entity-added');
    }
  });
}

/**
 * Set up an observer to watch for scene changes
 */
function setupSceneObserver() {
  // Get the scene
  const scene = document.querySelector('a-scene');
  if (!scene) {
    console.warn('[Watcher] No scene found for observer setup');
    // Try again later
    setTimeout(setupSceneObserver, 1000);
    return;
  }
  
  // Set up a MutationObserver to detect DOM changes
  const sceneObserver = new MutationObserver((mutations) => {
    let entitiesAdded = false;
    let entitiesRemoved = false;
    
    mutations.forEach((mutation) => {
      // Check for added nodes
      if (mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach((node) => {
          // Check if it's an A-Frame entity by tag prefix
          if (node.tagName && node.tagName.toLowerCase().startsWith('a-')) {
            // Skip system entities
            if (isSystemEntity(node)) return;
            
            // Add the watcher component if not already present
            if (!node.getAttribute('entity-watcher')) {
              node.setAttribute('entity-watcher', '');
              
              // Use flushToDOM to ensure all attributes are properly set
              if (typeof node.flushToDOM === 'function') {
                node.flushToDOM();
              }
            }
            
            // Register the entity
            registerEntity(node);
            entitiesAdded = true;
          }
        });
      }
      
      // Check for removed nodes
      if (mutation.removedNodes.length > 0) {
        entitiesRemoved = true;
      }
    });
    
    // If entities were added or removed, trigger a save
    if (entitiesAdded || entitiesRemoved) {
      throttledSaveChanges(entitiesAdded ? 'entity-added' : 'entity-removed');
    }
  });
  
  // Start observing the scene
  sceneObserver.observe(scene, {
    childList: true,
    subtree: true,
    attributes: true
  });
  
  console.log('[Watcher] Scene observer set up');
}

/**
 * Add hooks to key A-Frame component systems to capture updates
 */
function setupComponentHooks() {
  // Detect if we can hook into core systems
  if (!AFRAME.components || !AFRAME.components.position) {
    console.warn('[Watcher] Could not find A-Frame core components');
    return;
  }
  
  // Hook into the position component as a representative example
  // We'll monitor this closely since it's commonly updated
  const originalUpdatePosition = AFRAME.components.position.Component.prototype.update;
  AFRAME.components.position.Component.prototype.update = function(oldData) {
    // Call the original method
    const result = originalUpdatePosition.call(this, oldData);
    
    // Skip for system entities
    if (isSystemEntity(this.el)) return result;
    
    // Trigger a save for this position update
    throttledSaveChanges('position-update');
    
    return result;
  };
  
  // Do the same for rotation
  if (AFRAME.components.rotation) {
    const originalUpdateRotation = AFRAME.components.rotation.Component.prototype.update;
    AFRAME.components.rotation.Component.prototype.update = function(oldData) {
      // Call the original method
      const result = originalUpdateRotation.call(this, oldData);
      
      // Skip for system entities
      if (isSystemEntity(this.el)) return result;
      
      // Trigger a save for this rotation update
      throttledSaveChanges('rotation-update');
      
      return result;
    };
  }
  
  // And scale
  if (AFRAME.components.scale) {
    const originalUpdateScale = AFRAME.components.scale.Component.prototype.update;
    AFRAME.components.scale.Component.prototype.update = function(oldData) {
      // Call the original method
      const result = originalUpdateScale.call(this, oldData);
      
      // Skip for system entities
      if (isSystemEntity(this.el)) return result;
      
      // Trigger a save for this scale update
      throttledSaveChanges('scale-update');
      
      return result;
    };
  }
}

/**
 * Register an entity in our registry
 * @param {Element} entity - The entity to register
 */
function registerEntity(entity) {
  // Skip system entities
  if (isSystemEntity(entity)) return;
  
  // Get a unique identifier for this entity
  const id = entity.id || entity.getAttribute('data-entity-uuid');
  if (!id) return;
  
  // Store in registry
  entityRegistry.set(id, {
    entity: entity,
    lastUpdated: Date.now()
  });
  
  // Ensure entity has watcher component
  if (!entity.getAttribute('entity-watcher')) {
    entity.setAttribute('entity-watcher', '');
  }

  // Capture initial entity data
  const entityData = captureEntityData(entity);
  
  // Update state with this entity
  updateEntityState(id, entityData, 'registration');
  
  // Update entity count
  updateEntityCount();
}

/**
 * Unregister an entity from the registry
 * @param {Element} entity - Entity to unregister
 * @returns {boolean} - Whether the entity was unregistered
 */
function unregisterEntity(entity) {
  if (!entity) return false;
  
  // Get entity ID or UUID
  const id = entity.id || entity.getAttribute('data-entity-uuid');
  if (!id) return false;
  
  // Check if in registry
  if (!entityRegistry.has(id)) return false;
  
  // Remove from registry
  entityRegistry.delete(id);
  
  return true;
}

/**
 * Set up detection for when the inspector is opened/closed
 */
function setupInspectorDetection() {
  // Watch for inspector opening/closing via body class changes
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const isInspectorOpen = document.body.classList.contains('aframe-inspector-opened');
        
        if (isInspectorOpen) {
          console.log('[Watcher] Inspector opened');
          updateStatus('Inspector opened', 'info');
          showWatcherPanel();
          
          // Set up specialized inspector hooks
          setupInspectorHooks();
        } else {
          console.log('[Watcher] Inspector closed');
          updateStatus('Inspector closed', 'info');
          
          // Final save when closing inspector
          if (changesPending) {
            captureAndSaveChanges('inspector-closed');
          }
          
          // Only hide panel if we're not in debug mode
          if (!config.debugMode) {
            hideWatcherPanel();
          }
        }
      }
    }
  });
  
  observer.observe(document.body, { attributes: true });
}

/**
 * Show the watcher panel
 */
function showWatcherPanel() {
  if (watcherPanel) {
    watcherPanel.style.display = 'block';
  }
}

/**
 * Hide the watcher panel
 */
function hideWatcherPanel() {
  if (watcherPanel) {
    watcherPanel.style.display = 'none';
  }
}

/**
 * Update the status display in the watcher panel
 * @param {string} message - Status message
 * @param {string} type - Status type (info, saving, saved, error)
 */
function updateStatus(message, type = 'info') {
  if (!statusEl) return;
  
  statusEl.textContent = message;
  
  // Set color based on type
  switch (type) {
    case 'info':
      statusEl.className = 'watcher-status status-info';
      break;
    case 'saving':
      statusEl.className = 'watcher-status status-saving';
      break;
    case 'saved':
      statusEl.className = 'watcher-status status-saved';
      break;
    case 'error':
      statusEl.className = 'watcher-status status-error';
      break;
    default:
      statusEl.className = 'watcher-status status-info';
  }
  
  // Log to console in debug mode
  if (config.debugMode) {
    console.log(`[Watcher] Status: ${message} (${type})`);
  }
}

/**
 * Update the entity count display
 */
function updateEntityCount() {
  if (!entityCountEl) return;
  
  const scene = document.querySelector('a-scene');
  if (!scene) {
    entityCountEl.textContent = 'Entities: 0';
    return;
  }
  
  let count = 0;
  const entities = scene.querySelectorAll('a-entity, a-box, a-sphere, a-cylinder, a-plane, a-sky');
  
  entities.forEach(entity => {
    if (!isSystemEntity(entity)) {
      count++;
    }
  });
  
  entityCountEl.textContent = `Entities: ${count}`;
}

/**
 * Check if an entity is a system entity
 * @param {Element} entity - Entity to check
 * @returns {boolean} True if entity is a system entity
 */
function isSystemEntity(entity) {
    if (!entity) return false;
    
    // Check if it's a sky entity first
    if (skyManager.isSkyEntity(entity)) return false;
    
    // Check if it's an environment entity
    if (entity.id === 'environment') return false;
    
    // Check system entity IDs
    if (SYSTEM_ENTITY_IDS.includes(entity.id)) return true;
    
    // Check system components
    const hasSystemComponent = SYSTEM_COMPONENTS.some(comp => entity.hasAttribute(comp));
    if (hasSystemComponent) return true;
    
    // Check system data attributes
    const hasSystemDataAttr = SYSTEM_DATA_ATTRIBUTES.some(attr => entity.hasAttribute(attr));
    if (hasSystemDataAttr) return true;
    
    return false;
}

/**
 * Capture the current state of all entities in the scene as a baseline
 */
function captureEntityBaseline() {
  console.log('[Watcher] Capturing entity baseline');
  
  const scene = document.querySelector('a-scene');
  if (!scene) {
    console.warn('[Watcher] No scene found for baseline capture');
    return;
  }
  
  // Clear existing registry
  entityRegistry.clear();
  
  // Get all entities in the scene using our consistent function
  const entities = getAllAFrameEntities(scene);
  
  let count = 0;
  entities.forEach(entity => {
    // Skip system entities
    if (isSystemEntity(entity)) return;
    
    // Make sure it has a unique ID
    if (!entity.id && !entity.hasAttribute('data-entity-uuid')) {
      const uuid = 'entity-' + Math.random().toString(36).substring(2, 10);
      entity.setAttribute('data-entity-uuid', uuid);
    }
    
    // Register entity
    registerEntity(entity);
    
    // Add entity-watcher component if not present
    if (!entity.getAttribute('entity-watcher')) {
      entity.setAttribute('entity-watcher', '');
      
      // Use flushToDOM to ensure component is registered
      if (typeof entity.flushToDOM === 'function') {
        entity.flushToDOM();
      }
    }
    
    count++;
  });
  
  console.log(`[Watcher] Baseline captured with ${count} entities`);
  updateEntityCount();
  updateStatus('Baseline captured', 'info');
  
  // Trigger save after baseline capture to ensure state is updated
  setTimeout(() => {
    captureAndSaveChanges('baseline-capture');
  }, 500); // Increased from 200ms to 500ms
}

/**
 * Set up special hooks for the inspector
 */
function setupInspectorHooks() {
  console.log('[Watcher] Setting up inspector-specific hooks');
  
  // Schedule a re-capture since the inspector might add system entities
  setTimeout(captureEntityBaseline, 500);
  
  // Add any inspector-specific hooks
  
  // 1. Watch for inspector UI events (for gizmo interactions)
  watchInspectorGizmos();
  
  // 2. Re-add watchers to any entities that might be modified by inspector
  // (Some entities might have their components replaced by the inspector)
  setTimeout(() => {
    const scene = document.querySelector('a-scene');
    if (!scene) return;
    
    const entities = scene.querySelectorAll('a-entity, a-box, a-sphere, a-cylinder, a-plane, a-sky');
    entities.forEach(entity => {
      if (!isSystemEntity(entity) && !entity.getAttribute('entity-watcher')) {
        entity.setAttribute('entity-watcher', '');
      }
    });
  }, 1000);
  
  // 3. Set up periodic polling just for inspector mode (as a backup)
  const intervalId = setInterval(() => {
    if (!document.body.classList.contains('aframe-inspector-opened')) {
      // Inspector closed, clear interval
      clearInterval(intervalId);
      return;
    }
    
    // Check if there are entities without watchers
    const scene = document.querySelector('a-scene');
    if (!scene) return;
    
    let foundNew = false;
    const entities = scene.querySelectorAll('a-entity, a-box, a-sphere, a-cylinder, a-plane, a-sky');
    
    entities.forEach(entity => {
      if (!isSystemEntity(entity) && !entity.getAttribute('entity-watcher')) {
        entity.setAttribute('entity-watcher', '');
        foundNew = true;
      }
    });
    
    if (foundNew) {
      throttledSaveChanges('inspector-polling');
    }
  }, 2000);
}

/**
 * Watch for inspector gizmo interactions (transform controls)
 */
function watchInspectorGizmos() {
  let transformActive = false;
  let pendingUpdate = false;
  
  // Function to check if transform controls are active
  function checkForTransformControls() {
    const transformControls = document.querySelector('.transformControls');
    const isActive = transformControls && transformControls.classList.contains('active');
    
    // If transform state changed
    if (isActive !== transformActive) {
      transformActive = isActive;
      
      // If transform ended, trigger an update
      if (!isActive && !pendingUpdate) {
        pendingUpdate = true;
        // Wait a bit for A-Frame to finish updating
        setTimeout(() => {
          captureAndSaveChanges('inspector-transform');
          pendingUpdate = false;
        }, 100);
      }
    }
  }
  
  // Check periodically when inspector is open
  const gizmoInterval = setInterval(() => {
    if (!document.body.classList.contains('aframe-inspector-opened')) {
      clearInterval(gizmoInterval);
      return;
    }
    
    checkForTransformControls();
  }, 200); // More frequent checks for better responsiveness
  
  // Watch for inspector property changes
  const observer = new MutationObserver((mutations) => {
    if (!document.body.classList.contains('aframe-inspector-opened')) return;
    
    mutations.forEach(mutation => {
      if (mutation.type === 'attributes' || 
          (mutation.type === 'childList' && mutation.target.closest('.property-row'))) {
        // Debounce the update
        if (!pendingUpdate) {
          pendingUpdate = true;
          setTimeout(() => {
            captureAndSaveChanges('inspector-property-change');
            pendingUpdate = false;
          }, 250);
        }
      }
    });
  });
  
  // Observe the inspector panel for changes
  const inspectorPanel = document.querySelector('.a-inspector');
  if (inspectorPanel) {
    observer.observe(inspectorPanel, {
      attributes: true,
      childList: true,
      subtree: true,
      characterData: true
    });
  }
  
  // Handle mouseup events for transform operations
  document.addEventListener('mouseup', () => {
    if (!document.body.classList.contains('aframe-inspector-opened')) return;
    
    // If transform was active, ensure we capture the final state
    if (transformActive) {
      transformActive = false;
      if (!pendingUpdate) {
        pendingUpdate = true;
        setTimeout(() => {
          captureAndSaveChanges('inspector-transform-end');
          pendingUpdate = false;
        }, 100);
      }
    }
  });
}

/**
 * Throttle save changes to avoid too many updates
 * @param {string} source - Source of the changes
 */
function throttledSaveChanges(source = 'unknown') {
  // Skip if we're still initializing
  if (!document.querySelector('a-scene').hasLoaded) return;
  
  changesPending = true;
  updateStatus('Changes detected...', 'saving');
  
  if (config.debugMode) {
    console.log(`[Watcher] Changes detected from: ${source}`);
  }
  
  if (window._watcherSaveTimeout) {
    clearTimeout(window._watcherSaveTimeout);
  }
  
  const now = Date.now();
  const delay = now - lastSaveTime > THROTTLE_TIME * 2 ? 
    Math.min(500, config.autoSaveDelay) : config.autoSaveDelay;
  
  window._watcherSaveTimeout = setTimeout(() => {
    if (changesPending) {
      captureAndSaveChanges(source);
      // Update status after save
      updateStatus('Changes saved', 'saved');
      changesPending = false;
      
      // After a short delay, return to ready state
      setTimeout(() => {
        updateStatus('Ready', 'info');
      }, 2000);
    }
  }, delay);
  
  updateEntityCount();
}

/**
 * Capture and save changes to state
 * @param {string} [source='unknown'] - Source of the save operation
 */
function captureAndSaveChanges(source) {
    console.log(`Capturing changes from ${source}...`);
    
    // Get all entities in the scene
    const scene = document.querySelector('a-scene');
    if (!scene) {
        console.error('No scene found');
        return;
    }
    
    // Get environment entity
    const environment = scene.querySelector('#environment');
    if (environment) {
        // Update environment state
        const state = getState();
        const environmentState = {
            id: 'environment',
            type: 'environment',
            currentPreset: state.environment?.currentPreset || 'default',
            sky: state.sky,
            lights: []
        };
        
        // Get all lights from environment
        environment.querySelectorAll('[light]').forEach(light => {
            const lightState = {
                id: light.id,
                type: 'light',
                uuid: light.dataset.entityUuid || generateEntityId('light'),
                light: {}
            };
            
            // Parse light attributes
            const lightAttr = light.getAttribute('light');
            if (lightAttr) {
                lightAttr.split(';').forEach(prop => {
                    const [key, value] = prop.split(':').map(s => s.trim());
                    if (key && value) {
                        lightState.light[key] = value;
                    }
                });
            }
            
            environmentState.lights.push(lightState);
        });
        
        setState({ environment: environmentState });
    }
    
    // SPECIAL HANDLING FOR SKY ENTITIES
    // Look for sky entities (a-sky or a-videosphere)
    const skyEntity = scene.querySelector('a-sky, a-videosphere');
    if (skyEntity) {
        const tagName = skyEntity.tagName.toLowerCase();
        const isVideoSky = tagName === 'a-videosphere';
        const skyType = isVideoSky ? 'video' : (skyEntity.dataset.skyType || 'color');
        const uuid = skyEntity.dataset.entityUuid || generateEntityId('sky');
        
        // Ensure the entity has a uuid
        if (!skyEntity.dataset.entityUuid) {
            skyEntity.dataset.entityUuid = uuid;
        }
        
        // Create sky state object
        const skyState = {
            type: skyType,
            uuid: uuid,
            domElementCreated: true,
            data: {}
        };
        
        // Extract appropriate data based on type
        if (skyType === 'color') {
            // Color sky
            skyState.data.color = skyEntity.getAttribute('color') || '#ECECEC';
        } else if (skyType === 'image' || skyType === 'video') {
            // Image or video sky
            const src = skyEntity.getAttribute('src');
            
            // Handle asset references
            if (src && src.startsWith('#')) {
                const assetId = src.substring(1);
                const assetEl = document.querySelector(`#${assetId}`);
                
                if (assetEl) {
                    const assetSrc = assetEl.getAttribute('src');
                    skyState.data[skyType] = assetSrc;
                    skyState.data.assetId = assetId;
                } else {
                    skyState.data[skyType] = src;
                }
            } else {
                skyState.data[skyType] = src;
            }
        } else if (skyType === 'gradient') {
            // Gradient sky
            const material = skyEntity.getAttribute('material');
            if (material) {
                skyState.data.colors = [material.topColor || '#449bf2', material.bottomColor || '#8C4B3F'];
                skyState.data.direction = material.direction || 'vertical';
            }
        } else if (skyType === 'environment') {
            // Environment sky
            skyState.data.environment = skyEntity.getAttribute('environment');
        }
        
        // Update state with sky information
        setState({ sky: skyState }, `${source}-sky-update`);
        
        console.log(`[Watcher] Sky entity registered in state.sky: ${skyType}`);
    } else {
        // No sky entity found, set sky state to null
        setState({ sky: null }, `${source}-sky-null`);
    }
    
    // Get all user entities
    const entities = {};
    const entityMapping = {};
    
    scene.querySelectorAll('[data-entity-uuid]').forEach(entity => {
        // Skip system entities
        if (isSystemEntity(entity)) return;
        
        // Handle sky entities - register them in entities collection too
        // (Removed the skip code that was here before)
        const uuid = entity.dataset.entityUuid;
        if (!uuid) return;
        
        // Check if this is a sky entity - if so, add it to entities with type 'sky'
        if (skyManager && skyManager.isSkyEntity && skyManager.isSkyEntity(entity)) {
            const tagName = entity.tagName.toLowerCase();
            const isVideoSky = tagName === 'a-videosphere';
            const skyType = isVideoSky ? 'video' : (entity.dataset.skyType || 'color');
            
            // Create condensed sky entity data for entities collection
            entities[uuid] = {
                type: 'sky',
                skyType: skyType,
                uuid: uuid,
                DOM: true // Add DOM flag to indicate entity exists in DOM
            };
            
            // Add appropriate properties based on sky type
            if (skyType === 'color') {
                entities[uuid].color = entity.getAttribute('color') || '#ECECEC';
            } else if (skyType === 'image' || skyType === 'video') {
                entities[uuid].src = entity.getAttribute('src');
            }
            
            entityMapping[uuid] = entity.id || 'sky';
            return; // Continue to the next entity
        }
        
        // Handle regular entities as before
        const type = entity.tagName.toLowerCase().replace('a-', '');
        const properties = extractEntityAttributes(entity, type);
        
        // Clean up the properties
        const cleanedProperties = {};
        for (const [key, value] of Object.entries(properties)) {
            if (!EXCLUDED_ATTRIBUTES.includes(key)) {
                cleanedProperties[key] = value;
            }
        }
        
        entities[uuid] = {
            type,
            ...cleanedProperties,
            DOM: true // Add DOM flag to indicate entity exists in DOM
        };
        
        entityMapping[uuid] = entity.id;
    });
    
    // Update state
    setState({
        entities,
        entityMapping
    });
    
    // Update status UI
    updateStatus('Changes saved', 'saved');
    lastSaveTime = Date.now();
    changesPending = false;
    
    // Update last update time
    if (lastUpdateEl) {
        lastUpdateEl.textContent = new Date().toLocaleTimeString();
    }
    
    // Update entity count
    updateEntityCount();
    
    // Dispatch event to notify other systems
    const eventDetail = {
        source,
        entityCount: Object.keys(entities).length,
        hasSky: skyEntity !== null,
        timestamp: Date.now()
    };
    
    // Dispatch the watcher-changes-saved event for other components to listen for
    document.dispatchEvent(new CustomEvent('watcher-changes-saved', {
        detail: eventDetail
    }));
    
    // Log the action
    logAction('Scene changes captured', {
        source,
        entityCount: Object.keys(entities).length,
        hasSky: skyEntity !== null
    });
    
    return entities;
}

/**
 * Capture entity data for state
 * @param {Element} entity - Entity to capture data from
 * @returns {Object} Entity data
 */
function captureEntityData(entity) {
  try {
    // Get basic type from tag name
    let type = entity.tagName.toLowerCase().replace('a-', '');
    
    // Check for component-based type
    const geometry = entity.getAttribute('geometry');
    if (type === 'entity' && geometry?.primitive) {
      type = geometry.primitive;
    }

    // Extract attributes using standardized function
    return extractEntityAttributes(entity, type);
  } catch (error) {
    console.error('Error extracting entity data:', error);
    return { type };
  }
}

/**
 * Check if two objects are deeply equal
 * @param {Object} obj1 - First object
 * @param {Object} obj2 - Second object
 * @returns {boolean} - Whether the objects are equal
 */
function deepEqual(obj1, obj2) {
  // Simple case: primitive values or same object
  if (obj1 === obj2) return true;
  
  // If either is not an object or null, they're not equal
  if (typeof obj1 !== 'object' || obj1 === null ||
      typeof obj2 !== 'object' || obj2 === null) {
    return false;
  }
  
  // Check that both have the same number of keys
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  // Check each key
  for (const key of keys1) {
    // If key is not in obj2 or values are not equal
    if (!keys2.includes(key)) return false;
    
    // Special handling for vectors (position, rotation, scale)
    if (['position', 'rotation', 'scale'].includes(key) && 
        typeof obj1[key] === 'object' && 
        typeof obj2[key] === 'object') {
      
      // Check each axis with some tolerance for floating point precision
      const axes = ['x', 'y', 'z'];
      for (const axis of axes) {
        if (Math.abs((obj1[key][axis] || 0) - (obj2[key][axis] || 0)) > 0.0001) {
          return false;
        }
      }
      continue;
    }
    
    // For other objects, recursively check equality
    if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
      if (!deepEqual(obj1[key], obj2[key])) return false;
    } 
    // For primitive values, directly compare
    else if (obj1[key] !== obj2[key]) {
      return false;
    }
  }
  
  return true;
}

/**
 * Check and update the inspector state
 * @returns {boolean} - Whether the inspector is open
 */
function checkInspectorState() {
  const isInspectorOpen = document.body.classList.contains('aframe-inspector-opened');
  
  if (isInspectorOpen) {
    // If inspector just opened and we haven't set up hooks yet
    setupInspectorHooks();
    
    // Make sure the panel is visible
    if (watcherPanel) {
      watcherPanel.style.display = 'block';
    }
    
    updateStatus('Inspector active', 'info');
  } else {
    // Inspector closed, run a final capture
    setTimeout(() => {
      captureEntityBaseline();
      updateStatus('Ready', 'info');
    }, 500);
  }
  
  return isInspectorOpen;
}

/**
 * Save button click handler
 * @param {Event} e - Click event
 */
function onSaveButtonClick(e) {
  e.preventDefault();
  throttledSaveChanges('manual-save');
}

/**
 * Get all A-Frame entities in the scene recursively
 * @param {Element} root - The root element to start searching from
 * @returns {Array<Element>} - Array of A-Frame entities
 */
function getAllAFrameEntities(root) {
  const results = [];
  
  // Recursive function to traverse the DOM
  function traverse(element) {
    // Check if this element is an A-Frame entity
    if (element.tagName && 
        element.tagName.toLowerCase().startsWith('a-') && 
        element.tagName.toLowerCase() !== 'a-scene' && 
        element.tagName.toLowerCase() !== 'a-assets') {
      results.push(element);
    }
    
    // Check all children
    const children = element.children;
    if (children && children.length) {
      for (let i = 0; i < children.length; i++) {
        traverse(children[i]);
      }
    }
  }
  
  // Start traversal
  traverse(root);
  
  return results;
}

// Initialize when the document is loaded or ready
if (document.readyState === 'complete') {
  initWatcher();
} else {
  window.addEventListener('load', initWatcher);
}

// Export global functions for external use
window.watcher = {
  save: function() { throttledSaveChanges('external-call'); },
  capture: captureEntityBaseline,
  checkInspectorState: checkInspectorState,
  config: config
};

/**
 * Enhanced entity watcher for tracking DOM changes
 */

class EntityWatcher {
  constructor() {
    this.pendingChanges = new Map();
    this.updateTimeout = null;
    this.isObserving = false;
    this.observer = new MutationObserver(this.handleMutations.bind(this));
  }

  /**
   * Start observing DOM changes
   */
  start() {
    if (this.isObserving) return;

    const scene = document.querySelector('a-scene');
    if (!scene) {
      console.warn('No A-Frame scene found, watcher not started');
      return;
    }

    this.observer.observe(scene, {
      childList: true,
      attributes: true,
      subtree: true,
      attributeOldValue: true,
      characterData: false
    });

    this.isObserving = true;
    console.log('Entity watcher started');
  }

  /**
   * Stop observing DOM changes
   */
  stop() {
    if (!this.isObserving) return;
    this.observer.disconnect();
    this.isObserving = false;
    this.clearPendingChanges();
    console.log('Entity watcher stopped');
  }

  /**
   * Handle DOM mutations
   * @param {MutationRecord[]} mutations - Array of mutation records
   */
  handleMutations(mutations) {
    // Group mutations by entity
    mutations.forEach(mutation => {
      const entity = mutation.target;
      
      // Skip if not an A-Frame entity
      if (!entity.tagName || !entity.tagName.toLowerCase().startsWith('a-')) return;
      
      // Get entity type
      const type = entity.tagName.toLowerCase().replace('a-', '');
      
      // Skip filtered entity types
      if (FILTERED_ENTITY_TYPES.includes(type)) return;
      
      // Skip if no UUID
      const uuid = entity.dataset.entityUuid;
      if (!uuid) return;

      // Skip system entities (but not sky)
      if (isSystemEntity(entity) && !skyManager.isSkyEntity(entity)) return;

      // Queue change for processing
      this.queueChange(uuid, entity);
    });

    // Schedule update
    this.scheduleUpdate();
  }

  /**
   * Queue a change for processing
   * @param {string} uuid - Entity UUID
   * @param {Element} entity - Entity element
   */
  queueChange(uuid, entity) {
    this.pendingChanges.set(uuid, entity);
  }

  /**
   * Schedule a state update
   */
  scheduleUpdate() {
    if (this.updateTimeout) return;
    
    this.updateTimeout = setTimeout(() => {
      this.processPendingChanges();
    }, 100); // Debounce time
  }

  /**
   * Process all pending changes
   */
  processPendingChanges() {
    if (this.pendingChanges.size === 0) return;

    console.log(`Processing ${this.pendingChanges.size} pending changes`);

    this.pendingChanges.forEach((entity, uuid) => {
      const data = this.extractEntityData(entity);
      if (data) {
        updateEntityState(uuid, data, 'dom');
      }
    });

    this.clearPendingChanges();
  }

  /**
   * Clear all pending changes
   */
  clearPendingChanges() {
    this.pendingChanges.clear();
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
      this.updateTimeout = null;
    }
  }

  /**
   * Extract entity data from DOM element
   * @param {Element} entity - Entity element
   * @returns {Object} Entity data
   */
  extractEntityData(entity) {
    try {
      // Get basic type from tag name
      let type = entity.tagName.toLowerCase().replace('a-', '');
      
      // Check for component-based type
      const geometry = entity.getAttribute('geometry');
      if (type === 'entity' && geometry?.primitive) {
        type = geometry.primitive;
      }

      // Extract attributes using standardized function
      return extractEntityAttributes(entity, type);
    } catch (error) {
      console.error('Error extracting entity data:', error);
      return { type };
    }
  }
}

// Create singleton instance
const entityWatcher = new EntityWatcher();

/**
 * Start the watcher system
 */
export function startWatcher() {
    console.log('[Watcher] Starting watcher system...');
    
    // Set up mutation observer for scene changes
    setupSceneObserver();
    
    // Set up A-Frame hooks
    setupAFrameHooks();
    
    // Set up inspector detection
    setupInspectorDetection();
    
    // Set up global watcher object
    window.watcher = {
        start: function() {
            console.log('[Watcher] Starting watcher instance...');
            // Start the entity watcher
            entityWatcher.start();
            return this;
        },
        stop: function() {
            console.log('[Watcher] Stopping watcher instance...');
            // Stop the entity watcher
            entityWatcher.stop();
            return this;
        },
        saveEntitiesToState: saveEntitiesToState,
        capture: captureEntityBaseline,
        checkInspectorState: checkInspectorState,
        config: config
    };
    
    console.log('[Watcher] Watcher system started successfully');
    
    // Initial state capture
    setTimeout(() => {
        console.log('[Watcher] Performing initial state capture');
        saveEntitiesToState('watcher-start');
    }, 1000);
    
    return window.watcher;
}

// Add a function to safely update Monaco
function updateMonacoSafely(retryCount = 0, maxRetries = 3) {
    console.log(`[Watcher] Attempting to update Monaco editor (attempt ${retryCount + 1}/${maxRetries + 1})`);
    
    // Dynamic import to avoid circular dependencies
    import('./monaco.js').then(monaco => {
        try {
            if (typeof monaco.updateMonacoEditor === 'function') {
                monaco.updateMonacoEditor(true); // Force update
                console.log('[Watcher] Monaco editor updated successfully');
            } else if (retryCount < maxRetries) {
                console.log('[Watcher] Monaco editor not available, will retry after delay');
                setTimeout(() => updateMonacoSafely(retryCount + 1, maxRetries), 1000);
            } else {
                console.error('[Watcher] Failed to update Monaco editor after all retries');
            }
        } catch (error) {
            console.error('[Watcher] Error during Monaco update:', error);
            if (retryCount < maxRetries) {
                setTimeout(() => updateMonacoSafely(retryCount + 1, maxRetries), 1000);
            }
        }
    }).catch(err => {
        console.error('[Watcher] Error importing monaco module:', err);
        if (retryCount < maxRetries) {
            setTimeout(() => updateMonacoSafely(retryCount + 1, maxRetries), 1000);
        }
    });
}

/**
 * Watch for entity changes in the scene
 * @param {HTMLElement} scene - The A-Frame scene element
 */
export function watchScene(scene) {
    console.log('Setting up scene watcher...');
    
    // Create a MutationObserver to watch for entity changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            const entity = mutation.target;
            
            // Skip if not an A-Frame entity
            if (!entity.tagName || !entity.tagName.toLowerCase().startsWith('a-')) {
                return;
            }
            
            // Get entity type
            const type = entity.tagName.toLowerCase().replace('a-', '');
            
            // Skip filtered entity types
            if (FILTERED_ENTITY_TYPES.includes(type)) {
                return;
            }
            
            // Process all other entity changes
            const id = entity.dataset.entityUuid || entity.id;
            if (id) {
                // Queue change for processing
                entityWatcher.queueChange(id, entity);
                entityWatcher.scheduleUpdate();
            }
        });
    });
    
    // Start observing the scene
    observer.observe(scene, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['id', 'data-entity-uuid', 'position', 'rotation', 'scale', 'color', 'material', 'geometry']
    });
    
    console.log('Scene watcher initialized');
}

// Set initializing to false after a delay
setTimeout(() => {
  console.log('[Watcher] Initialization complete, enabling all updates');
  isInitializing = false;
}, 5000); // 5 seconds should be enough for initialization

/**
 * Capture all entities and save changes to application state
 * Export this to make it available to other modules
 * @param {string} source - Source of the save operation
 * @returns {Object} - The updated entities state
 */
export function saveEntitiesToState(source = 'unknown') {
  console.log(`[Watcher] Saving entities to state from: ${source}`);
  
  // Don't process certain sources during initialization
  if (isInitializing && (source === 'blank-scene-loader' || source === 'recreate-from-state')) {
    console.log(`[Watcher] Skipping update during initialization from source: ${source}`);
    return {};
  }
  
  return captureAndSaveChanges(source);
} 