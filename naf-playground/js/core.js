/**
 * Core.js - Core logic and initialization for the Collaborative A-Frame Scene Builder
 */

import { initState, getState, setState, subscribe } from './state.js';
import { initUI } from './ui.js';
import { initMonacoEditor } from './monaco.js';
import { initCameraManager } from './camera.js';
import { setupNetworkedScene } from './network.js';
import { logAction } from './debug.js';

// DOM elements
let scene;

/**
 * Initialize the application
 */
export function initApp() {
    console.log('Initializing application...');
    
    // Wait for A-Frame to be ready
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        // Wait for A-Frame to initialize
        if (AFRAME && AFRAME.scenes.length > 0) {
            AFRAME.scenes[0].addEventListener('loaded', onSceneLoaded);
        } else {
            // If A-Frame isn't initialized yet, wait for it
            document.addEventListener('aframe-loaded', () => {
                AFRAME.scenes[0].addEventListener('loaded', onSceneLoaded);
            });
            // Add a fallback in case the aframe-loaded event doesn't fire
            setTimeout(() => {
                if (AFRAME && AFRAME.scenes.length > 0) {
                    AFRAME.scenes[0].addEventListener('loaded', onSceneLoaded);
                } else {
                    console.error('A-Frame scenes not available after timeout');
                    // Try to initialize with existing scene element
                    const sceneEl = document.querySelector('a-scene');
                    if (sceneEl) {
                        onSceneLoaded();
                    }
                }
            }, 1000);
        }
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            // Same check after DOM is ready
            if (AFRAME && AFRAME.scenes.length > 0) {
                AFRAME.scenes[0].addEventListener('loaded', onSceneLoaded);
            } else {
                // Wait a bit more for A-Frame to initialize
                setTimeout(() => {
                    if (AFRAME && AFRAME.scenes.length > 0) {
                        AFRAME.scenes[0].addEventListener('loaded', onSceneLoaded);
                    } else {
                        console.error('A-Frame scenes not available after timeout');
                        // Try to initialize with existing scene element
                        const sceneEl = document.querySelector('a-scene');
                        if (sceneEl) {
                            onSceneLoaded();
                        }
                    }
                }, 1000);
            }
        });
    }
}

/**
 * Called when the A-Frame scene is loaded
 */
function onSceneLoaded() {
    console.log('A-Frame scene loaded callback triggered');
    
    try {
        scene = document.querySelector('a-scene');
        if (!scene) {
            console.error('A-Scene not found in onSceneLoaded');
            // Try to recover
            setTimeout(() => {
                scene = document.querySelector('a-scene');
                if (scene) {
                    console.log('Found a-scene after delay');
                    checkSceneReady();
                } else {
                    console.error('Still no a-scene found after delay');
                }
            }, 1000);
            return;
        }
        
        console.log('A-Frame scene found:', scene);
        console.log('Scene is loaded:', scene.hasLoaded);
        
        // Make sure scene is actually loaded before continuing
        checkSceneReady();
    } catch (error) {
        console.error('Error in onSceneLoaded:', error);
    }
}

/**
 * Check if the scene is truly ready before continuing
 */
function checkSceneReady() {
    if (scene.hasLoaded) {
        console.log('Scene is confirmed loaded, continuing initialization');
        continueInitialization();
    } else {
        console.log('Scene not yet loaded, waiting...');
        scene.addEventListener('loaded', () => {
            console.log('Scene loaded event received, continuing initialization');
            continueInitialization();
        });
        
        // Fallback if event never fires
        setTimeout(() => {
            if (!scene.hasLoaded) {
                console.warn('Scene still not loaded after wait, forcing continuation');
                continueInitialization();
            }
        }, 2000);
    }
}

/**
 * Continue initialization after scene is loaded
 */
function continueInitialization() {
    try {
        console.log('Continuing initialization...');
        
        // Initialize state with the current scene
        console.log('Initializing state...');
        initState(scene);
        
        // Set up A-Frame Inspector hook first
        console.log('Setting up Inspector hook...');
        setupInspectorHook();
        
        // Initialize camera manager
        console.log('Initializing camera manager...');
        initCameraManager();
        
        // Initialize networking components
        console.log('Setting up networked scene...');
        setupNetworkedScene();
        
        // Make sure A-Frame is fully initialized before UI and editor
        initializeDependencies();
    } catch (error) {
        console.error('Error in continueInitialization:', error);
    }
}

/**
 * Handle state changes
 * @param {Object} newState - The new state
 * @param {Object} changes - What changed in the state
 */
function onStateChange(newState, changes) {
    console.log('State change detected:', changes);
    
    // Update the scene based on state changes
    if (changes.entities) {
        console.log('Entity changes detected, updating scene and editor');
        updateSceneFromState(newState);
        
        // Import needed here to avoid circular dependency
        import('./monaco.js').then(monaco => {
            console.log('Updating Monaco editor from state change');
            monaco.updateMonacoEditor();
        }).catch(err => {
            console.error('Error importing monaco module:', err);
        });
    }
    
    if (changes.camera) {
        // Camera state change handled by camera.js
        console.log('Camera changes detected');
    }
    
    // Other specific state changes can be handled here
}

/**
 * Update the scene based on the current state
 * @param {Object} state - The current state
 */
function updateSceneFromState(state) {
    console.log('Updating scene from state...');
    
    // Use dynamic import to avoid circular dependencies
    import('./entities.js').then(entities => {
        console.log('Recreating entities from state in scene');
        entities.recreateEntitiesFromState(state.entities);
    }).catch(err => {
        console.error('Error importing entities module:', err);
    });
}

/**
 * Set up hooks for the A-Frame Inspector
 */
function setupInspectorHook() {
    console.log('Setting up inspector hook...');
    
    if (!scene) {
        console.error('Cannot set up inspector hook: scene is not defined');
        return;
    }
    
    // Check if AFRAME is available
    if (!AFRAME) {
        console.error('Cannot set up inspector hook: AFRAME is not defined');
        return;
    }
    
    try {
        // Setup called before inspector opens
        if (!AFRAME.components['inspector-hook']) {
            console.log('Registering inspector-hook component');
            AFRAME.registerComponent('inspector-hook', {
                init: function() {
                    console.log('Inspector hook component initialized');
                    
                    // Store original scene state before inspector opens
                    let originalState = null;
                    
                    // Listen for inspector opened event
                    window.addEventListener('inspector-opened', () => {
                        console.log('[DEBUG] Inspector opened event received');
                        // Save the current state when inspector opens
                        originalState = getState();
                        console.log('[DEBUG] Saved original state for when inspector closes:', originalState);
                    });
                    
                    // Listen for inspector closed event
                    window.addEventListener('inspector-closed', () => {
                        console.log('[DEBUG] Inspector closed event received in inspector-hook component');
                        // Capture entity changes made in inspector
                        if (originalState) {
                            console.log('[DEBUG] Calling captureInspectorChanges with stored state');
                            captureInspectorChanges(originalState);
                        } else {
                            console.warn('[DEBUG] No original state found, cannot compare changes');
                            // Still try to capture current state
                            captureInspectorChanges({});
                        }
                    });
                    
                    // Add an extra way to open the inspector
                    document.addEventListener('keydown', (event) => {
                        if (event.ctrlKey && event.altKey && event.key === 'i') {
                            console.log('Keyboard shortcut detected to open inspector');
                            if (AFRAME.INSPECTOR && AFRAME.INSPECTOR.open) {
                                AFRAME.INSPECTOR.open();
                            }
                        }
                    });
                    
                    // Backup event listener at the document level in case component event doesn't fire
                    document.addEventListener('inspector-closed', () => {
                        console.log('[DEBUG] Inspector closed event captured at document level');
                        // Check if we should process this or if component already handled it
                        setTimeout(() => {
                            const currentEntities = Object.keys(getState().entities).length;
                            if (originalState && currentEntities === Object.keys(originalState.entities).length) {
                                console.log('[DEBUG] State appears unchanged, processing inspector-closed event at document level');
                                captureInspectorChanges(originalState);
                            }
                        }, 100);
                    });
                }
            });
        } else {
            console.log('inspector-hook component already registered');
        }
        
        // Add the component to the scene
        console.log('Adding inspector-hook component to scene');
        scene.setAttribute('inspector-hook', '');
        console.log('Inspector hook setup complete');
    } catch (error) {
        console.error('Error setting up inspector hook:', error);
    }
}

/**
 * Capture changes made in the inspector and update the state
 * @param {Object} originalState - The state before inspector opened
 */
function captureInspectorChanges(originalState) {
    console.log('Capturing changes from Inspector...');
    console.log('[DEBUG] Original state before inspector opened:', originalState);
    
    // Need to manually remove the inspector class to ensure UI displays properly
    document.body.classList.remove('aframe-inspector-opened');
    
    // Import UUID generator from state
    import('./state.js').then(stateModule => {
        const generateEntityUUID = stateModule.generateEntityUUID;
        const setState = stateModule.setState;
        
        // Get current scene entities
        const currentEntities = {};
        const currentEntityMapping = {};
        
        // Find all entities (excluding the persistent camera and other system entities)
        const entities = scene.querySelectorAll('a-entity, a-box, a-sphere, a-cylinder, a-plane, a-sky');
        let entityCount = 0;
        
        entities.forEach(entity => {
            // Skip system entities
            if (['builder-camera', 'default-light', 'directional-light'].includes(entity.id)) {
                return;
            }
            
            entityCount++;
            
            // Get or generate UUID
            let uuid = entity.dataset.entityUuid;
            
            // If no UUID exists, generate one and assign it
            if (!uuid) {
                uuid = generateEntityUUID();
                entity.dataset.entityUuid = uuid;
                console.log(`Generated new UUID ${uuid} for entity:`, entity);
            }
            
            // Get the entity tag name to determine type
            const tagName = entity.tagName.toLowerCase();
            const type = tagName.startsWith('a-') ? tagName.substring(2) : tagName;
            
            // Get entity component data
            const entityData = getEntityData(entity);
            
            // Add type to entity data
            entityData.type = type;
            
            // Store entity data in current entities
            currentEntities[uuid] = entityData;
            
            // Update entity mapping if entity has an ID
            if (entity.id) {
                currentEntityMapping[entity.id] = uuid;
            }
        });
        
        console.log(`[DEBUG] Found ${entityCount} entities to capture from inspector`);
        console.log('[DEBUG] Current entities after inspector:', currentEntities);
        console.log('[DEBUG] Entity mapping after inspector:', currentEntityMapping);
        
        // Update state with new entities and mapping
        setState({ 
            entities: currentEntities,
            entityMapping: currentEntityMapping
        });
        
        // Verify state was updated properly
        const newState = stateModule.getState();
        console.log('[DEBUG] State after update:', newState);
        
        // Dispatch a custom event to notify that inspector changes have been applied
        // This helps coordinate state updates with the monaco editor
        const event = new CustomEvent('inspector-changes-applied', { 
            detail: { 
                originalState, 
                newState 
            } 
        });
        document.dispatchEvent(event);
        
        // Force update the Monaco editor to reflect these changes
        import('./monaco.js').then(monaco => {
            if (monaco.updateMonacoEditor) {
                console.log('Updating Monaco editor to reflect inspector changes');
                // Use a longer delay to ensure state update is complete
                setTimeout(() => {
                    try {
                        monaco.updateMonacoEditor(true); // Force update
                        console.log('[DEBUG] Monaco editor update completed');
                    } catch (err) {
                        console.error('Error updating Monaco editor:', err);
                    }
                }, 500); // Increased delay to ensure state is ready
            } else {
                console.warn('Monaco editor update function not available');
            }
        }).catch(err => {
            console.error('Error importing monaco module:', err);
        });
        
        // Show notification
        import('./utils.js').then(utils => {
            utils.showNotification('Inspector changes synced with editor');
        }).catch(err => {
            console.error('Error importing utils module:', err);
        });
        
        logAction('Updated state from inspector changes');
    }).catch(err => {
        console.error('Error importing state module:', err);
    });
}

/**
 * Get all component data from an entity
 * @param {Element} entity - A-Frame entity
 * @returns {Object} - Component data
 */
function getEntityData(entity) {
    const data = {};
    
    // Get all component names
    const componentNames = entity.getAttributeNames()
        .filter(name => name !== 'id' && name !== 'data-entity-uuid');
    
    // Get component data for each component
    componentNames.forEach(name => {
        // Skip aframe-injected attribute and class
        if (name === 'aframe-injected' || name === 'class') {
            return;
        }
        
        // Normalize component name (handle dot notation)
        const normalizedName = name.replace('.', '__');
        data[normalizedName] = entity.getAttribute(name);
    });
    
    return data;
}

/**
 * Initialize dependencies in the correct order,
 * checking that each is ready before proceeding
 */
function initializeDependencies() {
    console.log('Starting dependency initialization...');
    
    // Check if A-Frame is fully initialized
    if (!AFRAME || !scene || !scene.hasLoaded) {
        console.log('A-Frame not yet fully initialized, waiting...');
        setTimeout(initializeDependencies, 100);
        return;
    }
    
    console.log('A-Frame verified as initialized, checking Monaco dependencies...');
    
    // Check if Monaco loader is available
    if (typeof require === 'undefined') {
        console.error('Monaco loader not available. Will retry...');
        setTimeout(initializeDependencies, 100);
        return;
    }
    
    // Initialize Monaco with proper dependency checking
    initMonacoWithCheck(() => {
        // After Monaco is initialized (or failed but proceeded anyway),
        // initialize UI
        console.log('Initializing UI...');
        initUI();
        
        // Subscribe to state changes
        console.log('Subscribing to state changes...');
        subscribe(onStateChange);
        
        console.log('Application initialization complete');
        logAction('Application initialized');
    });
}

/**
 * Initialize Monaco with proper dependency checking
 * @param {Function} callback - Function to call after initialization attempt
 */
function initMonacoWithCheck(callback) {
    console.log('Initializing Monaco editor with dependency checks...');
    
    try {
        // Check if Monaco is already available
        if (window.monaco && window.monaco.editor) {
            console.log('Monaco already available, initializing editor directly');
            initMonacoEditor();
            if (callback) callback();
            return;
        }
        
        // Try to load Monaco
        require.config({ paths: { 'vs': '/monaco-editor/vs' }});
        
        require(['vs/editor/editor.main'], function() {
            console.log('Monaco modules loaded, initializing editor');
            
            try {
                initMonacoEditor();
                console.log('Monaco editor initialized successfully');
            } catch (err) {
                console.error('Error initializing Monaco editor:', err);
            }
            
            if (callback) callback();
        }, function(err) {
            console.error('Failed to load Monaco modules:', err);
            
            // Continue with the rest of the app even if Monaco fails
            if (callback) callback();
        });
    } catch (err) {
        console.error('Error in Monaco initialization process:', err);
        
        // Continue with the rest of the app even if Monaco fails
        if (callback) callback();
    }
}

// Export core functions for other modules
export { captureInspectorChanges }; 