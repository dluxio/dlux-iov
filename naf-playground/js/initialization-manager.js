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

class InitializationManager {
    constructor() {
        this.initialized = false;
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
            draggable: false
        };
        this.dependencies = {
            aframe: [],
            scene: ['aframe'],
            sceneWatcher: ['scene'],
            state: ['scene', 'sceneWatcher'],
            network: ['scene', 'state'],
            ui: ['state', 'watcher'],
            editor: ['state', 'ui', 'monaco'],
            debug: ['state'],
            watcher: ['state', 'sceneWatcher', 'entities'],
            entities: ['state', 'sceneWatcher'],
            entityAPI: ['state', 'entities', 'watcher'],
            monaco: ['aframe'],
            draggable: ['ui']
        };
    }

    /**
     * Initialize the application
     */
    async initialize() {
        if (this.initialized) {
            console.warn('Application already initialized');
            return;
        }

        try {
            // Set up global error handler first
            setupGlobalErrorHandler();

            // 1. Wait for A-Frame
            await this.waitForAFrame();
            this.initializationState.aframe = true;
            console.log('A-Frame initialized');

            // 2. Initialize scene
            await this.initializeScene();
            this.initializationState.scene = true;
            console.log('Scene initialized');

            // 3. Initialize scene watcher
            await this.initializeSceneWatcher();
            this.initializationState.sceneWatcher = true;
            console.log('Scene watcher initialized');

            // 4. Initialize state
            await this.initializeState();
            this.initializationState.state = true;
            console.log('State initialized');

            // 5. Initialize network
            await this.initializeNetwork();
            this.initializationState.network = true;
            console.log('Network initialized');

            // 6. Initialize Monaco
            await this.initializeMonaco();
            this.initializationState.monaco = true;
            console.log('Monaco initialized');

            // 7. Initialize entities
            await this.initializeEntities();
            this.initializationState.entities = true;
            console.log('Entities initialized');

            // 8. Initialize watcher
            await this.initializeWatcher();
            this.initializationState.watcher = true;
            console.log('Watcher initialized');

            // 9. Initialize UI
            await this.initializeUI();
            this.initializationState.ui = true;
            console.log('UI initialized');

            // 10. Initialize draggable
            await this.initializeDraggable();
            this.initializationState.draggable = true;
            console.log('Draggable initialized');

            // 11. Initialize entity API
            await this.initializeEntityAPI();
            this.initializationState.entityAPI = true;
            console.log('Entity API initialized');

            // 12. Initialize editor
            await this.initializeEditor();
            this.initializationState.editor = true;
            console.log('Editor initialized');

            // 13. Initialize debug
            await this.initializeDebug();
            this.initializationState.debug = true;
            console.log('Debug initialized');

            // 14. Set up event listeners
            await this.setupEventListeners();
            console.log('Event listeners initialized');

            this.initialized = true;
            console.log('Application initialized successfully');
            logAction('Application initialized');
        } catch (error) {
            console.error('Initialization failed:', error);
            this.handleInitializationError(error);
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
        
        // Show error UI
        showInitializationError(error);
        
        // Reset initialization state
        this.initialized = false;
        Object.keys(this.initializationState).forEach(key => {
            this.initializationState[key] = false;
        });
    }

    /**
     * Check if all dependencies are initialized
     */
    checkDependencies(component) {
        return this.dependencies[component].every(dep => this.initializationState[dep]);
    }

    /**
     * Get initialization state
     */
    getInitializationState() {
        return {
            initialized: this.initialized,
            state: { ...this.initializationState }
        };
    }

    /**
     * Initialize Monaco
     */
    async initializeMonaco() {
        return new Promise((resolve, reject) => {
            // Set up Monaco environment
            window.MonacoEnvironment = {
                getWorkerUrl: function(moduleId, label) {
                    console.log('Monaco requesting worker for:', moduleId, label);
                    return 'monaco-editor/vs/base/worker/workerMain.js';
                }
            };

            // Configure Monaco loader
            if (typeof require === 'undefined') {
                reject(new Error('Monaco require function not available'));
                return;
            }

            require.config({ 
                paths: { 'vs': 'monaco-editor/vs' },
                waitSeconds: 30
            });

            // Load Monaco
            if (typeof monaco === 'undefined') {
                require(['vs/editor/editor.main'], () => {
                    console.log('Monaco modules loaded successfully');
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    /**
     * Initialize watcher
     */
    async initializeWatcher() {
        try {
            console.log('Initializing watcher...');
            
            // Import watcher module
            const { startWatcher } = await import('./watcher.js');
            
            // Start the watcher and get the instance
            const watcher = startWatcher();
            
            // Initialize draggable functionality for the watcher panel
            const watcherPanel = document.getElementById('watcher-panel');
            if (watcherPanel) {
                // Import and initialize draggable
                const { initDraggable } = await import('./draggable.js');
                initDraggable(watcherPanel);
                
                // Add to dock
                const dock = document.getElementById('window-dock');
                if (dock) {
                    const watcherIcon = dock.querySelector('[data-window="watcher-panel"]');
                    if (watcherIcon) {
                        watcherIcon.classList.add('active');
                    }
                }
            }
            
            return watcher;
        } catch (error) {
            console.error('Failed to initialize watcher:', error);
            throw error;
        }
    }

    /**
     * Initialize scene watcher
     */
    async initializeSceneWatcher() {
        try {
            // Import scene watcher module
            const { watchScene } = await import('./watcher.js');
            
            // Get the scene element
            const scene = document.querySelector('a-scene');
            if (!scene) {
                throw new Error('Scene element not found');
            }
            
            // Wait for scene to be fully loaded
            if (!scene.hasLoaded) {
                await new Promise(resolve => scene.addEventListener('loaded', resolve));
            }
            
            // Add a small delay to ensure all entities are properly initialized
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Start watching the scene
            return watchScene(scene);
        } catch (error) {
            console.error('Failed to initialize scene watcher:', error);
            throw error;
        }
    }

    /**
     * Initialize draggable
     */
    async initializeDraggable() {
        try {
            // Import draggable module
            const { initDraggable, initDock } = await import('./draggable.js');
            
            // Initialize draggable functionality for UI container
            const uiContainer = document.getElementById('ui-container');
            if (uiContainer) {
                initDraggable(uiContainer);
                console.log('UI container draggable initialized');
            }
            
            // Initialize draggable functionality for editor window
            const editorWindow = document.getElementById('editor-window');
            if (editorWindow) {
                initDraggable(editorWindow);
                console.log('Editor window draggable initialized');
            }
            
            // Initialize draggable functionality for state debug panel
            const debugPanel = document.getElementById('state-debug-panel');
            if (debugPanel) {
                initDraggable(debugPanel);
                console.log('State debug panel draggable initialized');
            } else {
                console.error('State debug panel element not found');
            }

            // Initialize dock functionality
            initDock();
            console.log('Window dock initialized');

            // Mark all window icons as active in the dock
            const dock = document.getElementById('window-dock');
            if (dock) {
                const windowIds = ['ui-container', 'editor-window', 'state-debug-panel', 'watcher-panel'];
                windowIds.forEach(windowId => {
                    const icon = dock.querySelector(`[data-window="${windowId}"]`);
                    if (icon) {
                        icon.classList.add('active');
                    }
                });
            }
            
            return true;
        } catch (error) {
            console.error('Failed to initialize draggable:', error);
            throw error;
        }
    }
}

// Create singleton instance
const initializationManager = new InitializationManager();

// Export initialization function
export async function initializeApp() {
    return initializationManager.initialize();
}

// Export state getter
export function getInitializationState() {
    return initializationManager.getInitializationState();
} 