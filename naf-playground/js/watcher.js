/**
 * watcher.js - A-Frame entity change detection system
 * 
 * This module provides a robust change detection system for A-Frame entities,
 * working both in the Inspector and in regular preview mode. It uses A-Frame's
 * component system to track individual entity changes and saves the scene state
 * when changes are detected.
 */

import { getState, setState } from './state.js';
import { updateMonacoEditor } from './monaco.js';
import { logAction } from './debug.js';

// Constants
const PANEL_ID = 'watcher-panel';
const THROTTLE_TIME = 2000; // ms between saves

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
  autoSaveDelay: 1000, // ms to wait before auto-saving
  debugMode: false,    // enable debug logging
};

// Create global reference
if (typeof window !== 'undefined') {
  window.watcher = window.watcher || {};
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
      
      // Wait a bit for entity to be fully initialized
      setTimeout(() => {
        this.captureBaseline();
        this.isInitialized = true;
      }, 100);
    },
    
    update: function(oldData) {
      // Only process updates after initialization
      if (!this.isInitialized) return;
      
      // Skip too frequent updates during initialization
      const now = Date.now();
      if (now - this.lastCheck < 50) return;
      this.lastCheck = now;
      
      // Detect changes
      if (this.hasComponentChanges()) {
        // Trigger save with a source that identifies this component
        throttledSaveChanges(`entity-component-update:${this.el.id || 'unnamed'}`);
        // Update baseline
        this.captureBaseline();
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
      // Capture current component data as a baseline
      this.originalData = {};
      
      // Skip if this is a system entity
      if (isSystemEntity(this.el)) return;
      
      // Get all components on this entity
      const componentNames = Object.keys(this.el.components || {});
      
      // Store current values
      componentNames.forEach(name => {
        // Skip the watcher itself
        if (name === 'entity-watcher') return;
        
        // Skip raycaster and cursor
        if (name === 'raycaster' || name === 'cursor') return;
        
        // Try to get component data
        const comp = this.el.components[name];
        if (comp && comp.data) {
          try {
            // Make deep copy of data
            this.originalData[name] = JSON.parse(JSON.stringify(comp.data));
          } catch (e) {
            // For components we can't JSON stringify, just store reference
            this.originalData[name] = comp.data;
          }
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
        // Skip the watcher itself
        if (name === 'entity-watcher') continue;
        
        // Skip raycaster and cursor
        if (name === 'raycaster' || name === 'cursor') continue;
        
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
          
          // Check if vector has changed significantly
          const hasSignificantChange = ['x', 'y', 'z'].some(axis => {
            return Math.abs((newData[axis] || 0) - (oldData[axis] || 0)) > 0.0001;
          });
          
          if (hasSignificantChange) {
            if (config.debugMode) {
              console.log(`[Watcher] Transformation changed on ${this.el.id || 'unnamed'}`);
            }
            return true;
          }
          
          continue;
        }
        
        // For other components, just check if data changed
        try {
          const oldJSON = JSON.stringify(this.originalData[name]);
          const newJSON = JSON.stringify(comp.data);
          
          if (oldJSON !== newJSON) {
            if (config.debugMode) {
              console.log(`[Watcher] Component changed: ${name} on ${this.el.id || 'unnamed'}`);
            }
            return true;
          }
        } catch (e) {
          // For components we can't compare with JSON, assume they changed
          console.warn(`[Watcher] Cannot compare ${name} data, assuming changed`, e);
          return true;
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
 * Initialize the watcher
 */
function initWatcher() {
  console.log('[Watcher] Initializing...');
  
  // Create the watcher panel
  createWatcherPanel();
  
  // Add A-Frame event listeners
  setupAFrameEventListeners();
  
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
  
  // Add the save function to the global watcher object
  if (typeof window !== 'undefined') {
    window.watcher.saveEntitiesToState = saveEntitiesToState;
    window.watcher.save = function(source = 'api-call') {
      return saveEntitiesToState(source);
    };
  }
  
  console.log('[Watcher] Initialized');
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
  watcherPanel.className = 'watcher-panel';
  
  // Add content
  watcherPanel.innerHTML = `
    <style>
      .watcher-panel {
        position: fixed;
        bottom: 10px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(20, 20, 30, 0.85);
        color: white;
        padding: 10px 15px;
        border-radius: 5px;
        font-family: Arial, sans-serif;
        font-size: 12px;
        z-index: 999;
        display: flex;
        flex-direction: column;
        gap: 8px;
        pointer-events: all;
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4);
        transition: background 0.3s ease, transform 0.2s ease;
        min-width: 250px;
        backdrop-filter: blur(2px);
        animation: fadeIn 0.5s ease-out;
      }
      .watcher-panel:hover {
        background: rgba(0, 0, 0, 0.8);
      }
      .watcher-panel.watcher-saving {
        background: rgba(255, 152, 0, 0.7);
      }
      .watcher-panel.watcher-saved {
        background: rgba(76, 175, 80, 0.7);
      }
      .watcher-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        padding-bottom: 6px;
        font-weight: bold;
      }
      .watcher-content {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .watcher-row {
        display: flex;
        justify-content: space-between;
        gap: 10px;
      }
      .watcher-label {
        opacity: 0.8;
      }
      .watcher-value {
        font-weight: bold;
      }
      .watcher-status {
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 11px;
        text-align: center;
        transition: all 0.2s ease;
      }
      .status-info {
        background: rgba(33, 150, 243, 0.3);
      }
      .status-error {
        background: rgba(244, 67, 54, 0.3);
      }
      .status-saving {
        background: rgba(255, 152, 0, 0.3);
        animation: pulse 1s infinite;
      }
      .status-saved {
        background: rgba(76, 175, 80, 0.3);
      }
      .status-flash {
        animation: flash 0.5s;
      }
      .watcher-save-button {
        background: rgba(33, 150, 243, 0.5);
        border: none;
        color: white;
        padding: 6px 12px;
        border-radius: 3px;
        cursor: pointer;
        font-size: 12px;
        font-weight: bold;
        transition: background 0.2s ease;
        display: block;
        width: 100%;
        margin-top: 4px;
      }
      .watcher-save-button:hover {
        background: rgba(33, 150, 243, 0.8);
      }
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.7; }
        100% { opacity: 1; }
      }
      @keyframes flash {
        0% { background: rgba(76, 175, 80, 0.8); }
        100% { background: rgba(76, 175, 80, 0.3); }
      }
      @keyframes fadeIn {
        0% { opacity: 0; transform: translateY(10px) translateX(-50%); }
        100% { opacity: 1; transform: translateY(0) translateX(-50%); }
      }
    </style>
    <div class="watcher-header">
      <span>Scene Watcher</span>
      <span class="watcher-status status-info">Ready</span>
    </div>
    <div class="watcher-content">
      <div class="watcher-row">
        <span class="watcher-label">Entities:</span>
        <span id="watcher-entity-count" class="watcher-value">0</span>
      </div>
      <div class="watcher-row">
        <span class="watcher-label">Last update:</span>
        <span id="watcher-last-update" class="watcher-value">-</span>
      </div>
      <div class="watcher-row" style="justify-content: center; margin-top: 4px;">
        <button id="watcher-save-button" class="watcher-save-button">Save Now</button>
        <button id="debug-panel-toggle" class="watcher-save-button" style="margin-left: 8px;">Debug State</button>
      </div>
    </div>
  `;
  
  // Add to body
  document.body.appendChild(watcherPanel);
  
  // Get references to elements
  statusEl = document.querySelector('.watcher-status');
  entityCountEl = document.getElementById('watcher-entity-count');
  lastUpdateEl = document.getElementById('watcher-last-update');
  saveButton = document.getElementById('watcher-save-button');
  
  // Add event listener to save button
  saveButton.addEventListener('click', onSaveButtonClick);
  
  // Add event listener for debug panel toggle
  const debugToggleButton = document.getElementById('debug-panel-toggle');
  debugToggleButton.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('toggle-debug-panel'));
  });
  
  console.log('[Watcher] Panel created');
  
  return watcherPanel;
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
    // 1. Create a component that will be added to every entity to track changes
    AFRAME.registerComponent('entity-watcher', {
      schema: { type: 'string' }, // Simple schema, not actually used
      
      init: function() {
        this.originalComponents = this.captureCurrentComponents();
        this.lastUpdated = Date.now();
        
        // Make sure the entity has a unique identifier
        this.ensureEntityHasUUID();
        
        // Register this entity
        registerEntity(this.el);
        
        // Log the initialization
        if (config.debugMode) {
          console.log('[Watcher] Entity initialized:', this.getEntityInfo());
        }
      },
      
      update: function() {
        const entityId = this.el.id || this.el.getAttribute('data-entity-uuid');
        
        // Skip updates for system entities
        if (isSystemEntity(this.el)) return;
        
        // Check if components have changed
        const currentComponents = this.captureCurrentComponents();
        const hasChanged = this.haveComponentsChanged(currentComponents);
        
        if (hasChanged) {
          this.lastUpdated = Date.now();
          throttledSaveChanges('component-update-' + entityId);
          
          // Update our record of components
          this.originalComponents = currentComponents;
          
          if (config.debugMode) {
            console.log('[Watcher] Entity updated:', this.getEntityInfo());
          }
        }
      },
      
      remove: function() {
        const entityId = this.el.id || this.el.getAttribute('data-entity-uuid');
        
        // Skip for system entities
        if (isSystemEntity(this.el)) return;
        
        // Remove this entity from the registry
        unregisterEntity(this.el);
        
        // Trigger a save when an entity is removed
        throttledSaveChanges('entity-removed-' + entityId);
        
        if (config.debugMode) {
          console.log('[Watcher] Entity removed:', this.getEntityInfo());
        }
      },
      
      // Helper function to ensure the entity has a UUID
      ensureEntityHasUUID: function() {
        if (!this.el.id && !this.el.hasAttribute('data-entity-uuid')) {
          // Generate a UUID
          const uuid = 'entity-' + Math.random().toString(36).substring(2, 10);
          this.el.setAttribute('data-entity-uuid', uuid);
        }
      },
      
      // Helper function to capture the current state of all components
      captureCurrentComponents: function() {
        const components = {};
        
        // Get all component names from the entity
        for (const name in this.el.components) {
          // Skip the entity-watcher component and system components
          if (name === 'entity-watcher' || 
              name === 'raycaster' || 
              name === 'cursor' ||
              name === 'look-controls') {
            continue;
          }
          
          // Try to get the component data
          try {
            const comp = this.el.components[name];
            if (comp && comp.data) {
              // For object data, we need to clone to avoid reference issues
              if (typeof comp.data === 'object') {
                components[name] = JSON.stringify(comp.data);
              } else {
                components[name] = comp.data;
              }
            }
          } catch (e) {
            console.warn('[Watcher] Error capturing component:', name, e);
          }
        }
        
        return components;
      },
      
      // Helper function to check if components have changed
      haveComponentsChanged: function(newComponents) {
        // First check if the number of components is different
        if (Object.keys(this.originalComponents).length !== Object.keys(newComponents).length) {
          return true;
        }
        
        // Check each component for changes
        for (const name in newComponents) {
          // If component didn't exist before or has changed
          if (!(name in this.originalComponents) || 
              newComponents[name] !== this.originalComponents[name]) {
            return true;
          }
        }
        
        // Check for removed components
        for (const name in this.originalComponents) {
          if (!(name in newComponents)) {
            return true;
          }
        }
        
        return false;
      },
      
      // Helper function to get entity info for logging
      getEntityInfo: function() {
        return {
          id: this.el.id || this.el.getAttribute('data-entity-uuid'),
          tagName: this.el.tagName.toLowerCase(),
          componentCount: Object.keys(this.originalComponents).length
        };
      }
    });
    
    // 2. Hook into scene loading to add the entity-watcher component to all entities
    setupSceneLoadedHook();
    
    // 3. Hook into scene's entity added events
    setupEntityAddedHook();
    
    // 4. Register a DOM observer to catch changes that happen outside A-Frame's component system
    setupSceneObserver();
    
    // 5. Hook into A-Frame's component definitions to catch all component updates
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
 * Check if an entity is a system entity that should be ignored
 * @param {Element} entity - Entity to check
 * @returns {boolean} - Whether the entity is a system entity
 */
function isSystemEntity(entity) {
  // Skip system entities by ID
  const systemIds = [
    'camera', 'builder-camera', 'rig', 'default-light', 'directional-light',
    'ambient-light', 'sky', 'cameraRig', 'cursor', 'default-cursor'
  ];
  
  if (entity.id && systemIds.includes(entity.id)) {
    return true;
  }
  
  // Skip inspector helper entities and invisible entities
  if (entity.classList && entity.classList.contains('inspector-helper')) {
    return true;
  }
  
  // Skip entities with raycaster or cursor components
  if (entity.getAttribute && (
    entity.getAttribute('raycaster') !== null ||
    entity.getAttribute('cursor') !== null
  )) {
    return true;
  }
  
  // Skip entities belonging to the inspector
  if (entity.closest && entity.closest('.a-inspector, .a-dom-wrapper')) {
    return true;
  }
  
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
  }, 200);
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
  // Since the gizmos operate somewhat outside A-Frame's component system,
  // we need to add specific detection for them

  // Function to check if transform controls are active
  function checkForTransformControls() {
    const transformControls = document.querySelector('.transformControls');
    if (transformControls && transformControls.classList.contains('active')) {
      // If transform controls are active, we might have missed some updates
      throttledSaveChanges('transform-controls-active');
    }
  }
  
  // Check periodically when inspector is open
  const gizmoInterval = setInterval(() => {
    if (!document.body.classList.contains('aframe-inspector-opened')) {
      clearInterval(gizmoInterval);
      return;
    }
    
    checkForTransformControls();
  }, 1000);
  
  // Also check on mouseup events, which is when transform operations typically end
  document.addEventListener('mouseup', () => {
    if (!document.body.classList.contains('aframe-inspector-opened')) return;
    
    // Short delay to allow for A-Frame to update entity
    setTimeout(checkForTransformControls, 100);
  });
}

/**
 * Throttle save changes to avoid too many updates
 * @param {string} source - Source of the changes
 */
function throttledSaveChanges(source = 'unknown') {
  // Set change pending flag
  changesPending = true;
  
  // Update status to show changes are pending
  updateStatus('Changes detected...', 'saving');
  
  // Log the source if in debug mode
  if (config.debugMode) {
    console.log(`[Watcher] Changes detected from: ${source}`);
  }
  
  // Cancel any existing timeout
  if (window._watcherSaveTimeout) {
    clearTimeout(window._watcherSaveTimeout);
  }
  
  // Get current time to check throttling
  const now = Date.now();
  
  // Determine delay based on last save time
  const delay = now - lastSaveTime > THROTTLE_TIME * 2 ? 
    Math.min(300, config.autoSaveDelay) : config.autoSaveDelay;
  
  // Set a new timeout for saving
  window._watcherSaveTimeout = setTimeout(() => {
    // Only save if changes are still pending
    if (changesPending) {
      captureAndSaveChanges(source);
    }
  }, delay);
  
  // Update UI immediately for better feedback
  updateEntityCount();
}

/**
 * Capture all entities and save changes to application state
 * Export this to make it available to other modules
 * @param {string} source - Source of the save operation
 * @returns {Object} - The updated entities state
 */
export function saveEntitiesToState(source = 'unknown') {
  console.log(`[Watcher] Saving entities to state from: ${source}`);
  return captureAndSaveChanges(source);
}

/**
 * Capture all entities and save changes to application state
 * @param {string} source - Source of the save operation
 * @returns {Object} - The updated entities state
 */
function captureAndSaveChanges(source = 'unknown') {
  console.log(`[Watcher] Capturing changes from: ${source}`);
  updateStatus('Saving changes...', 'saving');
  
  try {
    // Reset the changes pending flag
    changesPending = false;
    
    // Update the last save time
    lastSaveTime = Date.now();
    
    // Get the scene
    const scene = document.querySelector('a-scene');
    if (!scene) {
      console.error('[Watcher] Cannot save - no scene found');
      updateStatus('Error: No scene found', 'error');
      return null;
    }
    
    // Debug logging for DOM element detection
    console.log('[Watcher Debug] Checking scene for A-Frame elements:');
    
    // Direct query for specific primitives to verify they're detected
    const boxes = scene.querySelectorAll('a-box');
    const spheres = scene.querySelectorAll('a-sphere');
    const cylinders = scene.querySelectorAll('a-cylinder');
    const dodecahedrons = scene.querySelectorAll('a-dodecahedron');
    
    console.log(`[Watcher Debug] Direct element counts: boxes=${boxes.length}, spheres=${spheres.length}, cylinders=${cylinders.length}, dodecahedrons=${dodecahedrons.length}`);
    
    // Log each primitive for debugging
    dodecahedrons.forEach((element, i) => {
      console.log(`[Watcher Debug] Dodecahedron ${i}:`, {
        id: element.id,
        uuid: element.dataset.entityUuid,
        position: element.getAttribute('position'),
        isConnected: element.isConnected,
        parent: element.parentNode?.tagName
      });
    });
    
    // Get current state to compare
    const currentState = getState();
    const oldEntities = currentState.entities || {};
    
    // Track if any changes were detected
    let changesDetected = false;
    
    // Current entities object to build
    const entities = {};
    const entityMapping = {};
    
    // Find all entities in the scene, including nested ones
    // This ensures we catch ALL A-Frame entities regardless of nesting level
    const sceneEntities = getAllAFrameEntities(scene);
    
    console.log(`[Watcher Debug] Found ${sceneEntities.length} total A-Frame entities in scene`);
    let count = 0;
    
    // First, collect all entity IDs that exist in the DOM
    const domEntityIds = new Set();
    
    // Process each entity in the DOM
    sceneEntities.forEach(entity => {
      // Skip system entities
      if (isSystemEntity(entity)) return;
      
      count++;
      
      // Get entity ID or UUID
      let id = entity.dataset.entityUuid || entity.id;
      if (!id) return; // Skip entities without ID (shouldn't happen)
      
      // For backward compatibility, if entity has an ID but no UUID, 
      // check if it's mapped in the state
      if (!entity.dataset.entityUuid && entity.id && currentState.entityMapping[entity.id]) {
        id = currentState.entityMapping[entity.id];
        // Set the UUID on the element to ensure future consistency
        entity.dataset.entityUuid = id;
      }
      
      // Add to the set of DOM entity IDs
      domEntityIds.add(id);
      
      // Capture entity data
      const entityData = captureEntityData(entity);
      
      // Mark entity as definitely existing in DOM
      entityData.DOM = true;
      
      // Check if entity has changed
      if (!oldEntities[id] || !deepEqual(oldEntities[id], entityData)) {
        changesDetected = true;
        
        if (config.debugMode) {
          console.log(`[Watcher] Entity changed: ${id}`);
        }
      }
      
      // Add to entities object
      entities[id] = entityData;
      
      // Add to entity mapping if entity has an ID
      if (entity.id) {
        entityMapping[entity.id] = id;
      }
    });
    
    // Now check for entities in the old state that are not in the DOM
    Object.keys(oldEntities || {}).forEach(id => {
      if (!domEntityIds.has(id)) {
        // Entity is not in DOM - mark it explicitly
        if (oldEntities[id]) {
          entities[id] = { ...oldEntities[id], DOM: false };
          
          // If the type wasn't already set, make sure it's included
          if (!entities[id].type && oldEntities[id].type) {
            entities[id].type = oldEntities[id].type;
          }
          
          changesDetected = true;
          
          if (config.debugMode) {
            console.log(`[Watcher] Entity not in DOM: ${id}`);
          }
        }
      }
    });
    
    // If no changes and not a manual save, don't update state
    if (!changesDetected && source !== 'manual-save') {
      console.log('[Watcher] No changes detected, skipping save');
      updateStatus('No changes detected', 'info');
      
      // Still update the last update time
      if (lastUpdateEl) {
        lastUpdateEl.textContent = new Date().toLocaleTimeString();
      }
      
      return entities;
    }
    
    // Update the state with new entities
    setState({ 
      entities: entities,
      entityMapping: entityMapping
    });
    
    // Debug logging to check DOM status in state
    console.log('[Watcher Debug] Entity DOM status check:');
    Object.keys(entities).forEach(id => {
      const entity = entities[id];
      const elementExists = !!document.querySelector(`[data-entity-uuid="${id}"]`);
      console.log(`[Watcher Debug] Entity ${id} (${entity.type}): DOM in state=${entity.DOM}, DOM element exists=${elementExists}`);
    });
    
    // Update the Monaco editor if available
    if (typeof updateMonacoEditor === 'function') {
      try {
        updateMonacoEditor(true); // Force update
      } catch (e) {
        console.error('[Watcher] Error updating Monaco editor:', e);
      }
    }
    
    // Update entity count display
    updateEntityCount(count);
    
    // Update status to success
    updateStatus('Changes saved', 'success');
    
    // Update last update time
    if (lastUpdateEl) {
      lastUpdateEl.textContent = new Date().toLocaleTimeString();
    }
    
    // Emit a custom event that other modules can listen for
    document.dispatchEvent(new CustomEvent('watcher-changes-saved', {
      detail: {
        entityCount: count,
        source: source,
        changesDetected: changesDetected
      }
    }));
    
    // After a short delay, update status to ready
    setTimeout(() => {
      updateStatus('Ready', 'info');
    }, 2000);
    
    logAction(`Saved ${count} entities`);
    
    return entities;
  } catch (error) {
    console.error('[Watcher] Error saving changes:', error);
    updateStatus('Error saving changes', 'error');
    
    // Reset the changes pending flag so it can be tried again
    changesPending = true;
    
    return null;
  }
}

/**
 * Capture data for a single entity
 * @param {Element} entity - Entity to capture
 * @returns {Object} - Entity data
 */
function captureEntityData(entity) {
  const data = {};
  
  // Get the tag name of the entity to determine type
  const tagName = entity.tagName.toLowerCase();
  data.type = tagName.startsWith('a-') ? tagName.substring(2) : 'entity';
  
  // Get the entity ID and UUID
  if (entity.id) {
    data.id = entity.id;
  }
  
  // Initial DOM status - can be overridden later
  data.DOM = true;
  
  // Get only explicitly set attributes using getDOMAttribute
  // This avoids capturing all the default values that A-Frame sets internally
  
  // Always capture position, rotation, scale if they're set explicitly
  if (entity.hasAttribute('position')) {
    const posAttr = entity.getDOMAttribute('position');
    if (posAttr) {
      data.position = typeof posAttr === 'string' 
        ? posAttr.split(' ').reduce((obj, val, idx) => {
            const axes = ['x', 'y', 'z'];
            if (idx < 3) obj[axes[idx]] = parseFloat(val);
            return obj;
          }, {})
        : posAttr;
    }
  }
  
  if (entity.hasAttribute('rotation')) {
    const rotAttr = entity.getDOMAttribute('rotation');
    if (rotAttr) {
      data.rotation = typeof rotAttr === 'string'
        ? rotAttr.split(' ').reduce((obj, val, idx) => {
            const axes = ['x', 'y', 'z'];
            if (idx < 3) obj[axes[idx]] = parseFloat(val);
            return obj;
          }, {})
        : rotAttr;
    }
  }
  
  if (entity.hasAttribute('scale')) {
    const scaleAttr = entity.getDOMAttribute('scale');
    if (scaleAttr) {
      data.scale = typeof scaleAttr === 'string'
        ? scaleAttr.split(' ').reduce((obj, val, idx) => {
            const axes = ['x', 'y', 'z'];
            if (idx < 3) obj[axes[idx]] = parseFloat(val);
            return obj;
          }, {})
        : scaleAttr;
    }
  }
  
  // Initialize material and geometry objects if needed
  data.material = {};
  data.geometry = { primitive: data.type };
  
  // Get all other attributes that are explicitly set
  Array.from(entity.attributes).forEach(attr => {
    const name = attr.name;
    
    // Skip attributes we've already handled or that we don't want to capture
    if (['position', 'rotation', 'scale', 'id', 'class', 'aframe-injected'].includes(name) || 
        name.startsWith('data-') ||
        name === 'entity-watcher') {
      return;
    }
    
    // Handle color - always store in material
    if (name === 'color') {
      const colorAttr = entity.getDOMAttribute('color');
      if (colorAttr) {
        data.material.color = colorAttr;
      }
      return;
    }
    
    // Handle material attributes
    if (name === 'material') {
      const materialAttr = entity.getDOMAttribute('material');
      if (materialAttr) {
        // Merge with existing material properties
        data.material = { ...data.material, ...materialAttr };
      }
      return;
    }
    
    // Handle geometry attributes
    if (name === 'geometry') {
      const geometryAttr = entity.getDOMAttribute('geometry');
      if (geometryAttr) {
        // Merge with existing geometry properties
        data.geometry = { ...data.geometry, ...geometryAttr };
      }
      return;
    }
    
    // Handle primitive-specific attributes - store in geometry
    const primitiveAttrs = {
      'box': ['width', 'height', 'depth'],
      'sphere': ['radius'],
      'cylinder': ['radius', 'height'],
      'plane': ['width', 'height'],
      'dodecahedron': ['radius'],
      'octahedron': ['radius'],
      'tetrahedron': ['radius'],
      'icosahedron': ['radius']
    };
    
    // If this is a primitive-specific attribute, store it in geometry
    if (data.type in primitiveAttrs && primitiveAttrs[data.type].includes(name)) {
      const attrValue = entity.getDOMAttribute(name);
      if (attrValue !== undefined && attrValue !== null) {
        data.geometry[name] = attrValue;
      }
      return;
    }
    
    // For other attributes, get the DOM attribute value directly
    const value = entity.getDOMAttribute(name);
    if (value !== undefined && value !== null) {
      data[name] = value;
    }
  });
  
  // Clean up empty objects
  if (Object.keys(data.material).length === 0) {
    delete data.material;
  }
  if (Object.keys(data.geometry).length === 1 && data.geometry.primitive) {
    delete data.geometry;
  }
  
  return data;
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