/**
 * Debug.js - Debug panel functionality
 */

import { getState } from './state.js';
import { logEntityPositions } from './entities.js';

// DOM elements
let actionsEl;

// Maximum number of actions to display
const MAX_ACTIONS = 20;

// Action history
let actionHistory = [];

/**
 * Initialize the debug panel
 */
export function initDebugPanel() {
    console.log('Initializing debug panel...');
    
    // Get DOM elements
    actionsEl = document.getElementById('actions');
    
    // Clear any existing actions
    while (actionsEl.firstChild) {
        actionsEl.removeChild(actionsEl.firstChild);
    }
}

/**
 * Log an action to the debug panel
 * @param {string} message - The action message
 * @param {string} type - The type of action (info, success, error)
 */
export function logAction(message, type = 'info') {
    console.log(`[${type}] ${message}`);
    
    // Create timestamp
    const timestamp = new Date().toLocaleTimeString();
    
    // Create action object
    const action = {
        timestamp,
        message,
        type
    };
    
    // Add to actions array
    actionHistory.unshift(action);
    
    // Trim actions if needed
    if (actionHistory.length > MAX_ACTIONS) {
        actionHistory.pop();
    }
    
    // Update UI
    updateActionsUI();
}

/**
 * Update the actions UI
 */
function updateActionsUI() {
    // Make sure actions element exists
    if (!actionsEl) {
        return;
    }
    
    // Clear existing actions
    while (actionsEl.firstChild) {
        actionsEl.removeChild(actionsEl.firstChild);
    }
    
    // Add each action
    actionHistory.forEach(action => {
        const actionEl = document.createElement('div');
        actionEl.className = `action action-${action.type}`;
        actionEl.textContent = `${action.timestamp}: ${action.message}`;
        actionsEl.appendChild(actionEl);
    });
}

/**
 * Clear all actions
 */
export function clearActions() {
    actionHistory.length = 0;
    updateActionsUI();
}

/**
 * Get all actions
 * @returns {Array} - Array of actions
 */
export function getActions() {
    return [...actionHistory];
}

/**
 * Initialize the debug module
 */
export function initDebug() {
    console.log('Initializing debug module...');
    
    // Create global sceneBuilder object for debugging
    window.sceneBuilder = window.sceneBuilder || {};
    
    // Expose useful methods for debugging in console
    window.sceneBuilder.getState = getState;
    window.sceneBuilder.logState = () => console.log(getState());
    window.sceneBuilder.logEntityPositions = logEntityPositions;
    window.sceneBuilder.showActions = () => {
        console.log('Action History:', actionHistory);
        return actionHistory;
    };
    
    // Add any other debugging helpers here
    
    console.log('Debug module initialized');
} 