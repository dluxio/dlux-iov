/**
 * Main.js - Main entry point for the application
 */

import { initMonacoEditor } from './monaco.js';
import { initUI } from './ui.js';
import { initEntityAPI } from './entity-api.js';
import { initEntities } from './entities.js';
import { setupEventListeners } from './event-handlers.js';
import { showInitializationError } from './error-handlers.js';
import { logAction, initDebug } from './debug.js';

// Export initialization functions for use by initialization manager
export {
    initMonacoEditor,
    initUI,
    initEntityAPI,
    initEntities,
    setupEventListeners,
    showInitializationError,
    logAction,
    initDebug
}; 