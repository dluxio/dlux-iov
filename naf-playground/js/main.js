/**
 * Main.js - Entry point for the Collaborative A-Frame Scene Builder
 */

import { initApp } from './core.js';
import { initDebug } from './debug.js';
import { getUrlParams } from './utils.js';
import { initState, subscribe } from './state.js';
import { initUI } from './ui.js';
import { initEntities } from './entities.js';
import { initMonacoEditor, updateMonacoEditor, isEditorInitialized } from './monaco.js';
import { initCamera } from './camera.js';
import { initNetwork } from './network.js';
import { waitForDependencies } from './utils.js';
import { generateEntityId } from './utils.js';
import { initEntityAPI } from './entity-api.js';
// import { initInspectorWatcher } from './inspector-watcher.js'; // Removed - using watcher.js instead

// Add global error handler to catch any uncaught errors
window.addEventListener('error', function(event) {
    console.error('Global error caught:', event.error);
});

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing application...');
    
    try {
        // Initialize the debug panel first
        console.log('Initializing debug panel...');
        initDebug();
        console.log('Debug panel initialized');
        
        // Initialize the main application with error handling
        console.log('Initializing main application...');
        init().catch(error => {
            console.error('Error during main application initialization:', error);
            showInitializationError(error);
        });
        console.log('Main application initialization started');
        
        // Check for URL parameters with error handling
        try {
            const params = getUrlParams();
            
            // Auto-connect to server if specified in URL
            if (params.server) {
                const serverUrlInput = document.getElementById('server-url');
                const connectBtn = document.getElementById('connect-btn');
                
                if (serverUrlInput && connectBtn) {
                    serverUrlInput.value = params.server;
                    // Trigger the connect button after a short delay
                    setTimeout(() => {
                        connectBtn.click();
                    }, 1000);
                }
            }
        } catch (urlError) {
            console.error('Error processing URL parameters:', urlError);
        }
    } catch (error) {
        console.error('Error during application initialization:', error);
        showInitializationError(error);
    }
    
    // Add test state synchronization on app initialization
    // to ensure Monaco editor reflects the state
    setTimeout(() => {
        // Safety check to avoid errors if DOM elements don't exist
        if (!document.getElementById('monaco-editor')) {
            console.warn('Monaco editor container not found, skipping initial sync');
            return;
        }
        
        // First ensure Monaco editor is initialized before updating state
        let monacoInitAttempts = 0;
        const maxInitAttempts = 5;
        
        function ensureMonacoInitialized() {
            console.log(`Monaco initialization check attempt ${monacoInitAttempts + 1}/${maxInitAttempts}`);
            
            // Check if Monaco editor element exists and has content
            const editorContainer = document.getElementById('monaco-editor');
            const hasEditor = editorContainer && 
                             (editorContainer.querySelector('.monaco-editor') || 
                              window._fallbackMonacoEditor);
                             
            if (hasEditor) {
                console.log('Monaco editor appears to be initialized, continuing with state check');
                checkAndUpdateState();
            } else {
                monacoInitAttempts++;
                if (monacoInitAttempts < maxInitAttempts) {
                    console.log('Monaco editor not yet initialized, trying again in 1 second...');
                    setTimeout(ensureMonacoInitialized, 1000);
                } else {
                    console.warn('Maximum Monaco initialization attempts reached, trying to force initialize');
                    
                    // Force Monaco initialization
                    import('./monaco.js').then(monaco => {
                        console.log('Imported monaco module, forcing initialization');
                        if (typeof monaco.initMonacoEditor === 'function') {
                            monaco.initMonacoEditor();
                            // Wait a bit more after forcing initialization
                            setTimeout(checkAndUpdateState, 1000);
                        } else {
                            console.error('Monaco initMonacoEditor function not available');
                            // Still try to continue with state check
                            checkAndUpdateState();
                        }
                    }).catch(err => {
                        console.error('Error importing monaco module:', err);
                        // Try state check anyway
                        checkAndUpdateState();
                    });
                }
            }
        }
        
        function checkAndUpdateState() {
            console.log('Proceeding with state initialization and editor update');
            
            // Import and check state
            import('./state.js').then(state => {
                // Log current state
                const currentState = state.getState();
                console.log('Initial state check:', currentState);
                
                // If state is empty, add a default entity to test synchronization
                if (!currentState.entities || Object.keys(currentState.entities).length === 0) {
                    console.log('No entities in state, adding a test entity');
                    
                    // Use entity-api.js instead of direct entities.js call
                    import('./entity-api.js').then(entityApi => {
                        if (typeof entityApi.createEntity === 'function') {
                            // Create test entity using the entity API
                            entityApi.createEntity('box', {
                                position: { x: 0, y: 1, z: -3 },
                                color: '#4CC3D9'
                            });
                            console.log('Test entity created via entity-api.js');
                        }
                    }).catch(err => {
                        console.error('Error importing entity-api module:', err);
                    });
                }
                
                // Force Monaco update with the current state after a short delay
                setTimeout(() => {
                    import('./monaco.js').then(monaco => {
                        if (window._fallbackMonacoEditor && typeof monaco.updateMonacoEditor === 'function') {
                            console.log('Forcing initial Monaco update from state using fallback editor');
                            // Ensure editor is set before updating
                            if (!monaco.getEditorContent()) {
                                console.log('Setting editor reference to fallback before update');
                                // Use a workaround to set the editor reference
                                window.sceneBuilderDebug.forceEditorUpdate();
                            } else {
                                monaco.updateMonacoEditor();
                            }
                        } else if (typeof monaco.updateMonacoEditor === 'function') {
                            console.log('Forcing initial Monaco update from state with regular update');
                            monaco.updateMonacoEditor();
                        } else {
                            console.error('Monaco updateMonacoEditor function not available');
                        }
                    }).catch(err => {
                        console.error('Error importing monaco module for state sync:', err);
                    });
                }, 1000);
            }).catch(err => {
                console.error('Error importing state module for initial check:', err);
            });
        }
        
        // Start the process
        ensureMonacoInitialized();
    }, 3000);
});

// Add a listener to know when A-Frame is ready
window.addEventListener('aframe-loaded', () => {
    console.log('A-Frame loaded event detected');
});

// Check application state after initialization
setTimeout(() => {
    console.log('--- Application Status Check ---');
    console.log('A-Frame Scene:', document.querySelector('a-scene') ? 'Found' : 'Not Found');
    console.log('Add Box Button:', document.getElementById('add-box') ? 'Found' : 'Not Found');
    console.log('Monaco Editor Container:', document.getElementById('monaco-editor') ? 'Found' : 'Not Found');
    
    // Check Monaco editor status
    const editorContainer = document.getElementById('monaco-editor');
    if (editorContainer) {
        console.log('Monaco Editor Container Children:', editorContainer.children.length);
        console.log('Monaco Editor Present:', editorContainer.querySelector('.monaco-editor') ? 'Yes' : 'No');
        
        // Force a state sync to Monaco if it exists but doesn't show content
        if (editorContainer.querySelector('.monaco-editor') && 
            (!window.monaco || !window.monaco.editor || 
             !window.sceneBuilderDebug || 
             document.querySelector('.monaco-editor').textContent.includes('Test scene'))) {
            
            console.log('Detected Monaco editor with test content, attempting state sync');
            
            // Import monaco.js to force an update
            import('./monaco.js').then(monaco => {
                console.log('Imported monaco.js, forcing editor update');
                if (typeof monaco.updateMonacoEditor === 'function') {
                    monaco.updateMonacoEditor();
                    console.log('Forced Monaco update from main.js');
                }
            }).catch(err => {
                console.error('Error importing monaco module for forced update:', err);
            });
        }
    }
}, 5000);

// Export debug functions globally
export function checkStatus() {
    const scene = document.querySelector('a-scene');
    const addBoxBtn = document.getElementById('add-box');
    const monacoEditor = document.getElementById('monaco-editor');
    
    console.log('--- Application Status ---');
    console.log('A-Frame Scene:', scene ? 'Found' : 'Not Found');
    if (scene) {
        console.log('Scene Loaded:', scene.hasLoaded);
        console.log('Entity Count:', scene.querySelectorAll('[id]').length);
    }
    
    console.log('Add Box Button:', addBoxBtn ? 'Found' : 'Not Found');
    console.log('Monaco Editor Container:', monacoEditor ? 'Found' : 'Not Found');
    
    if (monacoEditor) {
        console.log('Monaco Editor Container Children:', monacoEditor.children.length);
        console.log('Monaco Editor Element:', monacoEditor.querySelector('.monaco-editor') ? 'Found' : 'Not Found');
    }
    
    // Import state.js to check state
    import('./state.js').then(state => {
        console.log('Current State:', state.getState());
    }).catch(err => {
        console.error('Error importing state module:', err);
    });
    
    return 'Status check complete. See console for details.';
}

// Add direct import checks to verify everything is loading
setTimeout(() => {
    console.log('Verifying module imports...');
    
    try {
        // Directly import all modules to check if they load
        import('./state.js').then(module => {
            console.log('state.js loaded:', Object.keys(module));
            window.sceneBuilder.state = module;
        }).catch(err => console.error('Failed to load state.js:', err));
        
        import('./ui.js').then(module => {
            console.log('ui.js loaded:', Object.keys(module));
            window.sceneBuilder.ui = module;
        }).catch(err => console.error('Failed to load ui.js:', err));
        
        import('./entities.js').then(module => {
            console.log('entities.js loaded:', Object.keys(module));
            window.sceneBuilder.entities = module;
        }).catch(err => console.error('Failed to load entities.js:', err));
        
        import('./monaco.js').then(module => {
            console.log('monaco.js loaded:', Object.keys(module));
            window.sceneBuilder.monaco = module;
        }).catch(err => console.error('Failed to load monaco.js:', err));
        
        import('./camera.js').then(module => {
            console.log('camera.js loaded:', Object.keys(module));
            window.sceneBuilder.camera = module;
        }).catch(err => console.error('Failed to load camera.js:', err));
        
        import('./network.js').then(module => {
            console.log('network.js loaded:', Object.keys(module));
            window.sceneBuilder.network = module;
        }).catch(err => console.error('Failed to load network.js:', err));
        
        import('./debug.js').then(module => {
            console.log('debug.js loaded:', Object.keys(module));
            window.sceneBuilder.debug = module;
        }).catch(err => console.error('Failed to load debug.js:', err));
        
        import('./utils.js').then(module => {
            console.log('utils.js loaded:', Object.keys(module));
            window.sceneBuilder.utils = module;
        }).catch(err => console.error('Failed to load utils.js:', err));
        
        console.log('Module verification complete');
    } catch (error) {
        console.error('Error verifying module imports:', error);
    }
}, 2000);

// Make debugging functions accessible from the console
window.sceneBuilder = window.sceneBuilder || {};
window.sceneBuilder.checkStatus = checkStatus;
window.sceneBuilder.testAddBox = () => {
    try {
        console.log('Manual test: Adding a box entity');
        
        // Import entity-api instead of entities.js
        import('./entity-api.js').then(entityApi => {
            const properties = {
                position: { x: 0, y: 1, z: -3 },
                width: 1,
                height: 1,
                depth: 1,
                color: '#4CC3D9'
            };
            
            // Create entity using entity API
            entityApi.createEntity('box', properties).then(result => {
                console.log('Box entity created:', result);
                
                // Force Monaco update
                import('./monaco.js').then(monaco => {
                    if (typeof monaco.updateMonacoEditor === 'function') {
                        console.log('Forcing Monaco update after box creation');
                        monaco.updateMonacoEditor();
                    }
                }).catch(err => {
                    console.error('Error importing monaco module:', err);
                });
                
                return `Box entity created with ID: ${result.uuid}`;
            });
        }).catch(err => {
            console.error('Error importing entity-api module:', err);
            return 'Error creating box entity. See console for details.';
        });
    } catch (error) {
        console.error('Error in testAddBox:', error);
        return 'Error adding box. See console for details.';
    }
};

console.log('Debug functions exposed via window.sceneBuilder');

// Export commonly needed functions for console debugging
// This is helpful for developers to access core functionality from the browser console
window.sceneBuilder = {
    // These will be populated by the modules
    checkStatus: () => {
        console.log('SceneBuilder status check:');
        const scene = document.querySelector('a-scene');
        console.log('- Scene exists:', !!scene);
        console.log('- Scene loaded:', scene ? scene.hasLoaded : false);
        console.log('- Add box button exists:', !!document.getElementById('add-box'));
        console.log('- Monaco editor exists:', !!document.getElementById('monaco-editor'));
    },
    
    // Direct test functions for debugging
    testOpenInspector: () => {
        console.log('Manually trying to open inspector...');
        try {
            const scene = document.querySelector('a-scene');
            if (scene && scene.components && scene.components.inspector) {
                scene.components.inspector.openInspector();
            } else if (AFRAME && AFRAME.INSPECTOR) {
                AFRAME.INSPECTOR.open();
            } else {
                // Try keyboard shortcut
                document.dispatchEvent(new KeyboardEvent('keydown', {
                    key: 'i',
                    altKey: true,
                    ctrlKey: true
                }));
            }
        } catch (error) {
            console.error('Error in testOpenInspector:', error);
        }
    },
    
    troubleshoot: () => {
        console.log('Running troubleshooting...');
        
        // Check all core elements
        const checks = {
            'a-scene': document.querySelector('a-scene'),
            'add-box button': document.getElementById('add-box'),
            'inspector button': document.getElementById('open-inspector'),
            'monaco-editor': document.getElementById('monaco-editor'),
            'AFRAME global': typeof AFRAME !== 'undefined',
            'NAF global': typeof NAF !== 'undefined'
        };
        
        console.table(checks);
        
        // Try to reinitialize UI if buttons don't have event listeners
        import('./ui.js').then(ui => {
            console.log('Reinitializing UI...');
            ui.initUI();
            console.log('UI reinitialized');
        }).catch(err => console.error('Failed to reinitialize UI:', err));
        
        // Manually add event listeners to critical buttons as backup
        if (checks['add-box button']) {
            console.log('Re-adding event listener to box button');
            const addBoxBtn = document.getElementById('add-box');
            addBoxBtn.addEventListener('click', () => {
                import('./entity-api.js').then(entityApi => {
                    const properties = {
                        position: { x: 0, y: 1.5, z: -3 },
                        width: 1,
                        height: 1,
                        depth: 1,
                        color: '#4CC3D9'
                    };
                    
                    entityApi.createEntity('box', properties).catch(err => 
                        console.error('Error in box creation:', err)
                    );
                }).catch(err => console.error('Error importing entity-api module:', err));
            });
        }
        
        if (checks['inspector button']) {
            console.log('Re-adding event listener to inspector button');
            const openInspectorBtn = document.getElementById('open-inspector');
            openInspectorBtn.addEventListener('click', () => {
                const scene = document.querySelector('a-scene');
                if (scene) {
                    if (scene.components && scene.components.inspector) {
                        scene.components.inspector.openInspector();
                    } else if (AFRAME && AFRAME.INSPECTOR) {
                        AFRAME.INSPECTOR.open();
                    } else {
                        document.dispatchEvent(new KeyboardEvent('keydown', {
                            key: 'i',
                            altKey: true,
                            ctrlKey: true
                        }));
                    }
                }
            });
        }
        
        console.log('Troubleshooting complete - try clicking buttons now or refreshing the page');
        return 'Troubleshooting complete. Try clicking buttons or refresh the page.';
    }
};

// Module state
let initialized = false;
let editorReady = false;

/**
 * Main initialization function
 */
export async function init() {
    console.log('Initializing application...');
    
    try {
        // Wait for A-Frame to be ready
        await waitForAFrame();
        
        // Preload the A-Frame inspector since it's a core feature
        preloadInspector();
        
        // Initialize state first
        initState();
        
        // Initialize UI next
        initUI();
        
        // Initialize entities
        initEntities();
        
        // Initialize Entity API
        initEntityAPI();
        
        // Initialize Monaco editor last
        await initializeEditor();
        
        // Setup event listeners
        setupEventListeners();
        
        // Mark as initialized
        initialized = true;
        
        console.log('Application initialization complete');
    } catch (error) {
        console.error('Error during initialization:', error);
        showInitializationError(error);
    }
}

/**
 * Wait for A-Frame to be ready
 * @returns {Promise} Promise that resolves when A-Frame is ready
 */
async function waitForAFrame() {
    console.log('Waiting for A-Frame...');
    
    return waitForDependencies([
        () => typeof AFRAME !== 'undefined',
        () => document.querySelector('a-scene') !== null,
        () => document.querySelector('a-scene').hasLoaded
    ], 'A-Frame and scene', 30000, 100);
}

/**
 * Initialize the Monaco editor
 * @returns {Promise} Promise that resolves when editor is initialized
 */
async function initializeEditor() {
    console.log('Initializing Monaco editor...');
    
    // First check if we have the loader.js script
    if (typeof require === 'undefined') {
        console.warn('Monaco loader not found, attempting to load it first');
        await loadMonacoLoader();
    }
    
    return new Promise((resolve) => {
        const startTime = Date.now();
        
        // Set up a one-time event listener for monaco-ready
        const monacoReadyHandler = () => {
            console.log('Monaco ready event received during initialization');
            window.removeEventListener('monaco-ready', monacoReadyHandler);
            // If editor not initialized yet, this will help speed up the process
        };
        window.addEventListener('monaco-ready', monacoReadyHandler);
        
        // Function to initialize with timeout and retry logic
        const attemptInitialization = (attempt = 1, maxAttempts = 3) => {
            console.log(`Monaco initialization attempt ${attempt}/${maxAttempts}`);
            
            // Set a timeout to prevent hanging if initialization fails
            const timeoutId = setTimeout(() => {
                console.warn(`Monaco initialization timed out on attempt ${attempt}`);
                if (attempt < maxAttempts) {
                    attemptInitialization(attempt + 1, maxAttempts);
                } else {
                    console.error('Monaco initialization failed after all attempts');
                    editorReady = false;
                    resolve(); // Resolve anyway to prevent app from hanging
                }
            }, 10000); // 10 second timeout
            
            // Attempt to initialize
            initMonacoEditor((success, error) => {
                clearTimeout(timeoutId); // Clear the timeout
                
                if (success) {
                    console.log(`Monaco editor successfully initialized (attempt ${attempt})`);
                    editorReady = true;
                    
                    // Set up synchronization between state changes and the Monaco editor
                    import('./monaco.js').then(monaco => {
                        // Set up improved state-to-editor sync if available
                        if (monaco.setupStateToEditorSync) {
                            monaco.setupStateToEditorSync();
                            console.log('Set up improved state-to-editor synchronization');
                        } else {
                            console.warn('Improved state-to-editor sync function not available');
                            // Fall back to old method
                            setupStateToEditorSync();
                        }
                        resolve();
                    }).catch(err => {
                        console.error('Error importing monaco module for sync setup:', err);
                        setupStateToEditorSync().then(resolve);
                    });
                } else {
                    console.error(`Monaco editor initialization failed on attempt ${attempt}:`, error);
                    
                    if (attempt < maxAttempts) {
                        console.log(`Retrying Monaco initialization (${attempt}/${maxAttempts})...`);
                        setTimeout(() => {
                            attemptInitialization(attempt + 1, maxAttempts);
                        }, 1000 * attempt); // Increasing backoff
                    } else {
                        console.error('Monaco editor initialization failed after all attempts');
                        
                        // Try alternative initialization method
                        retryEditorInitialization().then(() => {
                            const totalTime = Date.now() - startTime;
                            console.log(`Monaco initialization process completed in ${totalTime}ms`);
                            resolve();
                        });
                    }
                }
            });
        };
        
        // Start the initialization process
        attemptInitialization();
    });
}

/**
 * Load the Monaco loader script if it's not already loaded
 * @returns {Promise} Promise that resolves when the loader script is loaded
 */
function loadMonacoLoader() {
    return new Promise((resolve, reject) => {
        // Check if we already have the loader
        if (typeof require !== 'undefined') {
            console.log('Monaco loader already available');
            resolve();
            return;
        }
        
        console.log('Loading Monaco loader script...');
        const script = document.createElement('script');
        script.src = '/monaco-editor/vs/loader.js';
        script.async = true;
        
        script.onload = () => {
            console.log('Monaco loader script loaded successfully');
            // Give a moment for the loader to initialize
            setTimeout(resolve, 200);
        };
        
        script.onerror = (err) => {
            console.error('Failed to load Monaco loader script:', err);
            reject(new Error('Failed to load Monaco loader'));
        };
        
        document.head.appendChild(script);
    });
}

/**
 * Set up synchronization between state changes and the Monaco editor
 */
async function setupStateToEditorSync() {
    return new Promise((resolve) => {
        // Subscribe to state changes to update editor when scene changes
        subscribe((newState, changes) => {
            // Only update editor if entities changed
            if (changes.entities && initialized && editorReady) {
                console.log('State entities changed, forcing editor update...');
                // Force update to ensure UUID data is reflected
                updateMonacoEditor(true);
            }
        });
        resolve();
    });
}

/**
 * Set up general event listeners for the application
 */
function setupEventListeners() {
    // Get the current state before inspector opens to track changes
    let preInspectorState = null;
    
    // Listen for A-Frame inspector events
    document.addEventListener('inspector-loaded', () => {
        console.log('A-Frame Inspector loaded');
        // Make sure the body has the inspector class
        document.body.classList.add('aframe-inspector-opened');
        
        // Store current state to compare changes later
        import('./state.js').then(stateModule => {
            preInspectorState = stateModule.getState();
            console.log('[DEBUG] Stored pre-inspector state:', preInspectorState);
        });
    });
    
    // Create a MutationObserver to watch for inspector class changes
    // This handles cases where inspector is opened via keyboard shortcuts
    const bodyObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class') {
                const bodyClasses = document.body.classList;
                console.log('Body class changed, contains inspector class:', 
                    bodyClasses.contains('aframe-inspector-opened'));
                
                // If inspector is open and UI is still visible, fix it
                if (bodyClasses.contains('aframe-inspector-opened') && 
                    document.getElementById('ui-container').style.display !== 'none') {
                    console.log('Fixing inspector view (UI still visible)');
                    document.getElementById('ui-container').style.display = 'none';
                }
                
                // If inspector is closed but UI is still hidden, fix it
                if (!bodyClasses.contains('aframe-inspector-opened') && 
                    document.getElementById('ui-container').style.display === 'none') {
                    console.log('Fixing standard view (UI still hidden)');
                    document.getElementById('ui-container').style.display = 'flex';
                }
            }
        });
    });
    
    // Start observing the body element
    bodyObserver.observe(document.body, { attributes: true });
    
    // Listen for window resize events
    window.addEventListener('resize', () => {
        // Ensure all components are properly sized
        if (editorReady) {
            // Monaco editor should handle resize automatically with automaticLayout: true
            console.log('Window resized, editor should adapt automatically');
        }
    });
}

/**
 * Try to initialize the editor again with alternative methods
 * @returns {Promise} A promise that resolves when initialization is complete
 */
function retryEditorInitialization() {
    console.log('Retrying Monaco editor initialization...');
    
    return new Promise((resolve) => {
        // Wait for a moment before retrying
        setTimeout(() => {
            // Try to initialize with different options
            initMonacoEditor((success) => {
                if (success) {
                    console.log('Monaco editor successfully initialized on retry');
                    editorReady = true;
                    setupStateToEditorSync().then(resolve);
                } else {
                    console.error('Monaco editor initialization failed on retry');
                    // Show a notification to the user
                    showEditorError();
                }
                resolve();
            });
        }, 2000);
    });
}

/**
 * Show an initialization error to the user
 */
function showInitializationError(error) {
    console.error('Application initialization failed:', error);
    
    // Add an error message to the UI
    const appContainer = document.getElementById('app-container');
    if (appContainer) {
        const errorEl = document.createElement('div');
        errorEl.className = 'error-message';
        errorEl.innerHTML = `
            <h2>Application Error</h2>
            <p>The application failed to initialize properly. Please try refreshing the page.</p>
            <p>Error details: ${error.message || 'Unknown error'}</p>
            <button id="retry-button">Retry</button>
        `;
        appContainer.prepend(errorEl);
        
        // Add retry button functionality
        document.getElementById('retry-button').addEventListener('click', () => {
            errorEl.remove();
            init();
        });
    }
    
    // Also show in the console for debugging
    console.error('Full error details:', error);
}

/**
 * Show an editor-specific error message
 */
function showEditorError() {
    // Import the utils module for notifications
    import('./utils.js').then(utils => {
        utils.showNotification('Editor initialization failed. Some features may not work correctly.', 'error');
    }).catch(err => {
        console.error('Could not show notification:', err);
    });
}

/**
 * Creates a random scene with various entities
 */
export function createRandomScene() {
    console.log('Creating random scene...');
    
    // Use entity-api instead of entities.js
    import('./entity-api.js').then(async entityApi => {
        // Track created entities for debugging
        const createdEntities = [];
        
        try {
            // Add a plane as the floor
            const planeResult = await entityApi.createEntity('plane', {
                position: { x: 0, y: 0, z: -4 },
                rotation: { x: -90, y: 0, z: 0 },
                width: 20,
                height: 20,
                color: '#7BC8A4'
            });
            
            if (planeResult && planeResult.uuid) {
                createdEntities.push(planeResult.uuid);
            }
            
            // Add multiple boxes
            const boxResults = await entityApi.addMultipleEntities('box', 5, {
                positionOptions: {
                    minX: -8, maxX: 8,
                    minY: 0.5, maxY: 3,
                    minZ: -10, maxZ: -2
                },
                baseProperties: {
                    width: 1,
                    height: 1,
                    depth: 1
                }
            });
            
            if (boxResults && boxResults.length) {
                createdEntities.push(...boxResults);
            }
            
            // Add multiple spheres
            const sphereResults = await entityApi.addMultipleEntities('sphere', 3, {
                positionOptions: {
                    minX: -8, maxX: 8,
                    minY: 1, maxY: 3,
                    minZ: -10, maxZ: -2
                },
                baseProperties: {
                    radius: 0.75
                }
            });
            
            if (sphereResults && sphereResults.length) {
                createdEntities.push(...sphereResults);
            }
            
            // Add cylinders
            const cylinderResults = await entityApi.addMultipleEntities('cylinder', 3, {
                positionOptions: {
                    minX: -8, maxX: 8,
                    minY: 0.75, maxY: 2,
                    minZ: -10, maxZ: -2
                }
            });
            
            if (cylinderResults && cylinderResults.length) {
                createdEntities.push(...cylinderResults);
            }
            
            // Add a light
            const lightResult = await entityApi.createEntity('light', {
                type: 'point',
                position: { x: 0, y: 5, z: -5 },
                intensity: 1,
                distance: 50
            });
            
            if (lightResult && lightResult.uuid) {
                createdEntities.push(lightResult.uuid);
            }
            
            console.log(`Random scene created with ${createdEntities.length} entities`);
            
            // Force update the monaco editor
            import('./monaco.js').then(monaco => {
                if (typeof monaco.updateMonacoEditor === 'function') {
                    monaco.updateMonacoEditor();
                }
            }).catch(err => {
                console.error('Error updating monaco editor:', err);
            });
            
        } catch (error) {
            console.error('Error creating random scene:', error);
        }
    }).catch(err => {
        console.error('Error importing entity-api module:', err);
    });
}

/**
 * Preload the A-Frame inspector to make it load faster when first opened
 */
function preloadInspector() {
    console.log('Setting up A-Frame inspector for on-demand loading...');
    
    try {
        // Check if A-Frame is available
        if (typeof AFRAME === 'undefined') {
            console.warn('Cannot setup inspector: A-Frame not available');
            return;
        }
        
        // Don't preload - we'll load on demand when the user clicks the inspector button
        console.log('A-Frame inspector will be loaded on demand when requested');
        
        // Register a global function to load the inspector when needed
        window.loadAFrameInspector = () => {
            if (!window.AFRAME.INSPECTOR || !window.AFRAME.INSPECTOR.opened) {
                console.log('Loading A-Frame inspector on demand...');
                const script = document.createElement('script');
                script.src = '/aframe/aframe-inspector.min.js';
                script.onload = () => {
                    console.log('A-Frame inspector loaded successfully');
                    if (AFRAME.INSPECTOR && typeof AFRAME.INSPECTOR.open === 'function') {
                        AFRAME.INSPECTOR.open();
                    }
                };
                script.onerror = (err) => console.error('Error loading A-Frame inspector:', err);
                document.head.appendChild(script);
            } else if (AFRAME.INSPECTOR && typeof AFRAME.INSPECTOR.open === 'function') {
                AFRAME.INSPECTOR.open();
            }
        };
    } catch (error) {
        console.error('Error setting up inspector:', error);
        // Non-critical error, continue initialization
    }
}

// Start initialization when the DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
} 