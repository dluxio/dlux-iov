/**
 * Main.js - Main entry point for the application
 */

import { initMonacoEditor } from './monaco.js';
import { initUI } from './ui.js';
import { initEntityAPI } from './entity-api.js';
import { initEntities } from './entities.js';
import { setupEventListeners } from './event-handlers.js';
import { showInitializationError } from './error-handlers.js';
import { logAction } from './debug.js';

// Export initialization state
export let initialized = false;

// Export initialization functions for app-manager to use
export { 
    initMonacoEditor,
    initUI,
    initEntityAPI,
    initEntities,
    setupEventListeners,
    showInitializationError,
    logAction
}; 