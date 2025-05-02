/**
 * Initialization Manager - Centralizes application initialization sequence
 */

import { initState } from './state.js';
import { initUI } from './ui.js';
import { initMonacoEditor } from './monaco.js';
import { initDebug } from './debug.js';
import { initEntityAPI } from './entity-api.js';
import { initEntities } from './entities.js';
import { setupEventListeners } from './event-handlers.js';
import { setupGlobalErrorHandler } from './error-handlers.js';
import { showInitializationError } from './error-handlers.js';
import { logAction } from './debug.js';
import { loadScene } from './scene-loader.js';
import { STARTUP_SCENE_PATH, INITIALIZATION_CONFIG } from './config.js';

class InitializationManager {
    constructor() {
        this.initialized = false;
        this.sceneLoaded = false;
        this.initializationState = {
            aframe: false,
            scene: false,
            sceneWatcher: false,
            state: false,
            network: false,
            ui: false,
            editor: false,
            debug: false,
            entities: false,
            entityAPI: false,
            monaco: false,
            watcher: false,
            draggable: false,
            sceneLoader: false
        };
        this.dependencies = {
            aframe: [],
            scene: ['aframe'],
            sceneWatcher: ['scene'],
            state: ['scene', 'sceneWatcher'],
            sceneLoader: ['state'],
            network: ['scene', 'state'],
            entities: ['state', 'sceneWatcher', 'sceneLoader'],
            watcher: ['state', 'sceneWatcher', 'entities'],
            ui: ['state', 'watcher'],
            monaco: ['aframe', 'sceneLoader'],
            editor: ['state', 'ui', 'monaco'],
            debug: ['state'],
            entityAPI: ['state', 'entities', 'watcher'],
            draggable: ['ui']
        };
    }

    /**
     * Initialize the application
     */
    async initialize() {
        if (this.initialized) {
            console.log('Initialization already complete');
            return;
        }

        console.log('Starting initialization process...');

        try {
            // Track initialization start time
            this.startTime = Date.now();

            // Wait for A-Frame to be available
            console.log('Waiting for A-Frame...');
            this.initializationState.aframe = false;
            await this.waitForAFrame();
            this.initializationState.aframe = true;
            console.log('A-Frame initialization complete');

            // Initialize scene first
            console.log('Initializing scene...');
            this.initializationState.scene = false;
            await this.initializeScene();
            this.initializationState.scene = true;
            console.log('Scene initialization complete');
            
            // Initialize watcher early to ensure it's available during scene loading
            console.log('Initializing watcher...');
            this.initializationState.watcher = false;
            await this.initializeWatcher();
            this.initializationState.watcher = true;
            console.log('Watcher initialization complete');

            // Initialize state after scene
            console.log('Initializing state...');
            this.initializationState.state = false;
            await this.initializeState();
            this.initializationState.state = true;
            console.log('State initialization complete');

            // Initialize network for multi-user experiences
            console.log('Initializing network...');
            this.initializationState.network = false;
            await this.initializeNetwork();
            this.initializationState.network = true;
            await this.waitForNAF();
            console.log('Network initialization complete');

            // Initialize entity systems
            console.log('Initializing entities API...');
            this.initializationState.entityAPI = false;
            await this.initializeEntityAPI();
            this.initializationState.entityAPI = true;
            console.log('Entity API initialization complete');

            // Initialize entity tracker
            console.log('Initializing entities...');
            this.initializationState.entities = false;
            await this.initializeEntities();
            this.initializationState.entities = true;
            console.log('Entity initialization complete');

            // Initialize Monaco editor
            console.log('Initializing Monaco...');
            this.initializationState.monaco = false;
            await this.initializeMonaco();
            this.initializationState.monaco = true;
            console.log('Monaco initialization complete');

            // Initialize UI components
            console.log('Initializing UI...');
            this.initializationState.ui = false;
            await this.initializeUI();
            this.initializationState.ui = true;
            console.log('UI initialization complete');

            // Initialize scene editor
            console.log('Initializing editor...');
            this.initializationState.editor = false;
            await this.initializeEditor();
            this.initializationState.editor = true;
            console.log('Editor initialization complete');

            // Initialize draggable UI elements
            console.log('Initializing draggable UI...');
            this.initializationState.draggable = false;
            await this.initializeDraggable();
            this.initializationState.draggable = true;
            console.log('Draggable UI initialization complete');

            // Initialize debugging tools
            console.log('Initializing debug tools...');
            this.initializationState.debug = false;
            await this.initializeDebug();
            this.initializationState.debug = true;
            console.log('Debug tools initialization complete');

            // Setup event listeners
            console.log('Setting up event listeners...');
            this.initializationState.events = false;
            await this.setupEventListeners();
            this.initializationState.events = true;
            console.log('Event listeners setup complete');

            // Initialize scene watcher (for entity changes)
            console.log('Initializing scene watcher...');
            this.initializationState.sceneWatcher = false;
            await this.initializeSceneWatcher();
            this.initializationState.sceneWatcher = true;
            console.log('Scene watcher initialization complete');

            // Initialization complete
            this.initialized = true;
            const duration = Date.now() - this.startTime;
            console.log(`Initialization complete in ${duration}ms`);

            // Initialize watcher a second time to ensure it's properly connected to all entities
            console.log('Reinitializing watcher after scene load...');
            await this.initializeWatcher();
            console.log('Watcher reinitialization complete');

            // Dispatch event for any listeners
            document.dispatchEvent(new CustomEvent('initialization-complete', {
                detail: { duration, initializationState: this.initializationState }
            }));

            // Load initial scene after everything is fully initialized
            console.log('Loading initial scene...');
            this.initializationState.scene_loaded = false;
            await this.loadInitialScene();
            this.initializationState.scene_loaded = true;
            console.log('Initial scene loaded');

            return true;
        } catch (error) {
            console.error('Initialization process failed:', error);
            this.handleInitializationError(error);
            
            // Try to recover from errors
            this.attemptRecovery();
            
            return false;
        }
    }

    /**
     * Wait for A-Frame to be ready
     */
    async waitForAFrame() {
        return new Promise((resolve) => {
            if (window.AFRAME) {
                resolve();
            } else {
                document.addEventListener('aframe-loaded', resolve);
            }
        });
    }

    /**
     * Initialize scene
     */
    async initializeScene() {
        const scene = document.querySelector('a-scene');
        if (!scene) {
            throw new Error('Scene element not found');
        }

        // Wait for scene to be loaded
        if (!scene.hasLoaded) {
            await new Promise(resolve => scene.addEventListener('loaded', resolve));
        }

        return scene;
    }

    /**
     * Initialize state
     */
    async initializeState() {
        const scene = document.querySelector('a-scene');
        return initState(scene);
    }

    /**
     * Initialize network
     */
    async initializeNetwork() {
        // Wait for NAF to be ready
        await this.waitForNAF();
        // Network initialization will be handled by NAF
        return Promise.resolve();
    }

    /**
     * Wait for NAF to be ready
     */
    async waitForNAF() {
        return new Promise((resolve) => {
            if (window.NAF) {
                resolve();
            } else {
                document.addEventListener('naf-loaded', resolve);
            }
        });
    }

    /**
     * Initialize entities
     */
    async initializeEntities() {
        return initEntities();
    }

    /**
     * Initialize entity API
     */
    async initializeEntityAPI() {
        return initEntityAPI();
    }

    /**
     * Initialize UI
     */
    async initializeUI() {
        return initUI();
    }

    /**
     * Initialize editor
     */
    async initializeEditor() {
        return initMonacoEditor();
    }

    /**
     * Initialize debug
     */
    async initializeDebug() {
        return initDebug();
    }

    /**
     * Set up event listeners
     */
    async setupEventListeners() {
        return setupEventListeners();
    }

    /**
     * Handle initialization error
     */
    handleInitializationError(error) {
        // Log error
        console.error('Initialization failed:', error);
        
        // Show error message to user
        showInitializationError(error);
        
        // Try to recover critical components if possible
        this.attemptRecovery();
    }

    /**
     * Check if component dependencies are met
     * @param {string} component - Component name
     * @returns {boolean} - Whether all dependencies are met
     */
    checkDependencies(component) {
        const deps = this.dependencies[component] || [];
        return deps.every(dep => this.initializationState[dep]);
    }

    /**
     * Get initialization state
     * @returns {Object} - Current initialization state
     */
    getInitializationState() {
        return { ...this.initializationState };
    }

    /**
     * Initialize Monaco editor
     */
    async initializeMonaco() {
        return new Promise((resolve, reject) => {
            try {
                // Check if monaco is already configured
                if (typeof monaco !== 'undefined' && monaco.editor) {
                    console.log('Monaco already initialized');
                    resolve();
                    return;
                }
                
                // Check if we have the loader
                if (typeof require === 'undefined') {
                    console.warn('Monaco require not found, will try alternate initialization');
                    // Set a fallback resolve after a timeout
                    setTimeout(resolve, 1000);
                    return;
                }
                
                // Configure loader
                require.config({ paths: { 'vs': 'monaco-editor/vs' }});
                
                // Load monaco
                require(['vs/editor/editor.main'], () => {
                    console.log('Monaco loaded via require');
                    resolve();
                });
                
                // Set a timeout just in case
                setTimeout(() => {
                    if (typeof monaco === 'undefined' || !monaco.editor) {
                        console.warn('Monaco failed to load in time, continuing anyway');
                    }
                    resolve();
                }, 5000);
            } catch (error) {
                console.error('Monaco initialization error:', error);
                // Don't reject, continue initializing
                resolve();
            }
        });
    }

    /**
     * Initialize watcher for entity changes
     */
    async initializeWatcher() {
        return new Promise(async (resolve) => {
            try {
                // Import watcher module
                const { initWatcher } = await import('./watcher.js');
                
                // Initialize watcher if not already done
                if (!window.watcher) {
                    console.log('Creating new watcher instance');
                    
                    // Initialize the watcher module
                    await initWatcher();
                    
                    // Ensure we have fallback methods even if initialization fails
                    if (!window.watcher) {
                        console.log('Creating dummy watcher after initialization');
                        window.watcher = {
                            save: () => console.log('[Watcher] Using dummy save method'),
                            saveEntitiesToState: () => console.log('[Watcher] Using dummy saveEntitiesToState method'),
                            startWatching: () => console.log('[Watcher] Using dummy startWatching method')
                        };
                    } else if (!window.watcher.saveEntitiesToState) {
                        window.watcher.saveEntitiesToState = () => console.log('[Watcher] Using dummy saveEntitiesToState method');
                    }
                } else {
                    console.log('Watcher already initialized');
                }
                
                resolve();
            } catch (error) {
                console.error('Error in watcher initialization:', error);
                
                // Create a dummy watcher to prevent errors
                if (!window.watcher) {
                    console.log('Creating dummy watcher after error');
                    window.watcher = {
                        save: () => console.log('[Watcher] Using dummy save method'),
                        saveEntitiesToState: () => console.log('[Watcher] Using dummy saveEntitiesToState method'),
                        startWatching: () => console.log('[Watcher] Using dummy startWatching method')
                    };
                }
                
                resolve();
            }
        });
    }

    /**
     * Initialize scene watcher
     */
    async initializeSceneWatcher() {
        return new Promise((resolve) => {
            try {
                const scene = document.querySelector('a-scene');
                if (!scene) {
                    console.warn('Scene not found for watcher initialization');
                    resolve();
                    return;
                }
                
                // Set up scene load handler
                const handleSceneLoaded = () => {
                    console.log('Scene loaded event detected');
                    
                    // Only initialize if scene is actually loaded
                    if (scene.hasLoaded) {
                        scene.removeEventListener('loaded', handleSceneLoaded);
                        resolve();
                    }
                };
                
                // If scene is already loaded, resolve immediately
                if (scene.hasLoaded) {
                    console.log('Scene already loaded');
                    resolve();
                } else {
                    // Otherwise wait for loaded event
                    console.log('Waiting for scene to load...');
                    scene.addEventListener('loaded', handleSceneLoaded);
                    
                    // Set timeout in case scene load event never fires
                    setTimeout(() => {
                        scene.removeEventListener('loaded', handleSceneLoaded);
                        console.warn('Scene load timeout, continuing anyway');
                        resolve();
                    }, 5000);
                }
            } catch (error) {
                console.error('Error in scene watcher initialization:', error);
                resolve();
            }
        });
    }

    /**
     * Initialize draggable UI
     */
    async initializeDraggable() {
        return new Promise((resolve) => {
            try {
                if (!this.checkDependencies('draggable')) {
                    console.warn('Draggable dependencies not met, delaying initialization');
                    setTimeout(() => {
                        resolve();
                    }, 500);
                    return;
                }
                
                // Import and initialize draggable module
                import('./draggable.js').then(module => {
                    if (typeof module.initializeDraggableWindows === 'function') {
                        module.initializeDraggableWindows();
                        console.log('Draggable windows initialized');
                    } else {
                        console.warn('initializeDraggableWindows function not found');
                    }
                    resolve();
                }).catch(error => {
                    console.error('Failed to load draggable module:', error);
                    resolve();
                });
            } catch (error) {
                console.error('Error in draggable initialization:', error);
                resolve();
            }
        });
    }

    /**
     * Load the initial scene either from URL parameters or from the default startup scene
     */
    async loadInitialScene() {
        return new Promise(async (resolve) => {
            try {
                console.log('Loading initial scene...');
                
                // First check URL parameters
                const urlParams = new URLSearchParams(window.location.search);
                const sceneParam = urlParams.get('scene');
                
                if (sceneParam) {
                    console.log(`Loading scene from URL parameter: ${sceneParam}`);
                    try {
                        await loadScene(sceneParam);
                        this.sceneLoaded = true;
                        resolve();
                        return;
                    } catch (error) {
                        console.error('Error loading scene from URL parameter:', error);
                        // Continue to load default scene if URL param fails
                    }
                }
                
                // If no URL param or it failed, load the startup scene
                console.log(`Loading default startup scene: ${STARTUP_SCENE_PATH}`);
                try {
                    await loadScene(STARTUP_SCENE_PATH);
                    this.sceneLoaded = true;
                } catch (error) {
                    console.error('Error loading default startup scene:', error);
                }
                
                resolve();
            } catch (error) {
                console.error('Error in loadInitialScene:', error);
                resolve();
            }
        });
    }
    
    /**
     * Load scene from external file (no longer needed as initial startup, but kept for API compatibility)
     */
    async loadExternalScene() {
        return new Promise((resolve) => {
            // If a scene has already been loaded during initialization, skip this step
            if (this.sceneLoaded) {
                console.log('Scene already loaded during initialization, skipping');
                resolve();
                return;
            }
            
            // Otherwise, load the scene as before
            this.loadInitialScene().then(resolve).catch(() => resolve());
        });
    }

    /**
     * Attempt to recover from initialization errors
     */
    attemptRecovery() {
        console.log('Attempting to recover from initialization errors...');
        
        // Try to initialize critical components
        if (!this.initializationState.state) {
            console.log('Attempting to recover state...');
            this.initializeState().catch(e => console.error('State recovery failed:', e));
        }
        
        if (!this.initializationState.ui && this.initializationState.state) {
            console.log('Attempting to recover UI...');
            this.initializeUI().catch(e => console.error('UI recovery failed:', e));
        }
    }
}

/**
 * Initialize application with environment
 */
export async function initializeApp() {
    // Create initialization manager
    const initManager = new InitializationManager();

    try {
        // Start initialization process
        await initManager.initialize();
        
        // Initialize the engine UI
        try {
            const engineUI = await import('./engine-ui.js');
            engineUI.initEngineUI();
        } catch (engineUIError) {
            console.error('Error initializing engine UI:', engineUIError);
        }
        
        return true;
    } catch (error) {
        console.error('Initialization failed:', error);
        return false;
    }
}

/**
 * Get the current initialization state
 * @returns {Object} - Current initialization state
 */
export function getInitializationState() {
    return new InitializationManager().getInitializationState();
} 