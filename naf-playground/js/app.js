/**
 * App.js - Main application entry point
 */

import { initState, getState, setState } from './state.js';
import { initMonacoEditor, initUI, initEntityAPI, initEntities, setupEventListeners, showInitializationError, logAction } from './main.js';
import { setupInspectorHook } from './core.js';
import { setupGlobalErrorHandler } from './error-handlers.js';

// Flag to track initialization state
let initialized = false;

/**
 * Initialize the application
 */
export async function initApp() {
    console.log('Initializing application...');
    
    try {
        // Set up global error handler first
        setupGlobalErrorHandler();
        
        // Wait for A-Frame to be ready
        await waitForAFrame();
        
        // Get the scene after A-Frame is ready
        const scene = document.querySelector('a-scene');
        if (!scene) {
            throw new Error('A-Frame scene not found after waiting');
        }
        
        // Wait for scene to be loaded if it isn't already
        if (!scene.hasLoaded) {
            await new Promise(resolve => scene.addEventListener('loaded', resolve));
        }
        
        // Initialize state first with the loaded scene
        console.log('Initializing state with loaded scene...');
        initState(scene);
        
        // Initialize UI next
        console.log('Initializing UI...');
        initUI();
        
        // Initialize entities
        console.log('Initializing entities...');
        initEntities();
        
        // Initialize Entity API
        console.log('Initializing Entity API...');
        initEntityAPI();
        
        // Initialize Monaco editor
        console.log('Initializing Monaco editor...');
        await initMonacoEditor();
        
        // Setup event listeners
        console.log('Setting up event listeners...');
        setupEventListeners();
        
        // Setup inspector hook
        console.log('Setting up inspector hook...');
        setupInspectorHook();
        
        // Mark as initialized
        initialized = true;
        
        console.log('Application initialization complete');
        logAction('Application initialized');
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
    
    return new Promise((resolve) => {
        if (window.AFRAME) {
            resolve();
        } else {
            document.addEventListener('aframe-loaded', resolve);
        }
    });
}

// Start initialization when the DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
} 