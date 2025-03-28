/**
 * Debug.js - Debug panel functionality
 */

import { getState, subscribe } from './state.js';
import { logEntityPositions } from './entities.js';

// DOM elements
let debugPanel = null;
let isDebugPanelVisible = true; // Changed to true by default
let refreshInterval = null;

// Maximum number of actions to display
const MAX_ACTIONS = 50;

// Action history
let actionHistory = [];

/**
 * Initialize debug tools
 */
export function initDebug() {
    console.log('Initializing debug tools...');
    
    // Get the debug panel element
    debugPanel = document.getElementById('state-debug-panel');
    if (!debugPanel) {
        console.error('Debug panel element not found');
        return;
    }
    
    // Subscribe to state changes
    subscribe((state) => {
        if (isDebugPanelVisible) {
            updateDebugPanel();
        }
    });
    
    // Listen for watcher update events
    document.addEventListener('watcher-changes-saved', (event) => {
        console.log('[Debug] Watcher changes saved event received');
        if (isDebugPanelVisible) {
            // Add a status message to the action history
            logAction(`Watcher saved ${event.detail.entityCount} entities from inspector`);
            // Update the debug panel
            updateDebugPanel();
        }
    });
    
    // Add custom CSS for styling
    const style = document.createElement('style');
    style.textContent = `
        .debug-panel {
            font-family: monospace;
            font-size: 12px;
            line-height: 1.4;
            color: #fff;
        }
        .debug-panel pre {
            margin: 0;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        .debug-panel .action {
            margin: 5px 0;
            padding: 5px;
            border-left: 2px solid #666;
            background: rgba(255, 255, 255, 0.05);
        }
        .debug-panel .action:hover {
            background: rgba(255, 255, 255, 0.1);
        }
        .debug-panel .timestamp {
            color: #888;
            font-size: 10px;
        }
        .debug-panel .refresh-indicator {
            position: absolute;
            top: 10px;
            left: 10px;
            color: #888;
            font-size: 10px;
        }
        .entity-uuid { color: #88f; font-weight: bold; }
        .dom-status { font-style: italic; }
        .dom-status.found { color: #8f8; }
        .dom-status.missing { color: #f88; }
        .entity-props { margin-left: 10px; padding-left: 5px; border-left: 1px solid #555; }
        .property-name { color: #bbb; margin-right: 5px; }
        .property-value { color: #ff9; }
        .debug-section h6 { margin: 5px 0; color: #aaa; }
    `;
    document.head.appendChild(style);
    
    // Add event listener for manual refresh
    document.addEventListener('refresh-debug-panel', () => {
        updateDebugPanel();
    });
    
    // Start continuous refresh
    startContinuousRefresh();
    
    console.log('Debug tools initialized');
}

/**
 * Toggle the debug panel visibility
 */
export function toggleDebugPanel() {
    if (!debugPanel) {
        return;
    }
    
    isDebugPanelVisible = !isDebugPanelVisible;
    debugPanel.style.display = isDebugPanelVisible ? 'block' : 'none';
    
    if (isDebugPanelVisible) {
        startContinuousRefresh();
        updateDebugPanel();
    } else {
        stopContinuousRefresh();
    }
}

/**
 * Start continuous refresh of the debug panel
 */
function startContinuousRefresh() {
    // Clear any existing interval
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    
    // Update every 500ms
    refreshInterval = setInterval(() => {
        updateDebugPanel();
    }, 500);
}

/**
 * Stop continuous refresh of the debug panel
 */
function stopContinuousRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

/**
 * Update the debug panel with current state information
 */
function updateDebugPanel() {
    if (!debugPanel || !isDebugPanelVisible) return;
    
    // Get current state
    const state = getState();
    
    // Create content
    let content = '<h3>Debug Info</h3>';
    
    // Add refresh button for manual refresh
    content += '<button onclick="document.dispatchEvent(new CustomEvent(\'refresh-debug-panel\'))">Refresh</button>';
    
    // Add state section
    content += '<div class="debug-section">';
    content += '<h4>State</h4>';
    
    // Display entities
    content += '<div class="entity-list">';
    content += `<h5>Entities (${Object.keys(state.entities || {}).length})</h5>`;
    
    if (state.entities && Object.keys(state.entities).length > 0) {
        for (const uuid in state.entities) {
            const entity = state.entities[uuid];
            content += `<div class="entity">`;
            content += `<div><span class="entity-uuid">UUID: ${uuid}</span></div>`;
            content += `<div><span class="entity-type">Type: ${entity.type || 'unknown'}</span></div>`;
            
            // Check if entity exists in DOM (both ways for debugging)
            const domEntity = document.querySelector(`[data-entity-uuid="${uuid}"]`);
            const inDomByState = entity.DOM === true;
            const inDomByQuery = !!domEntity;
            
            // Use the DOM property from the entity state
            if (inDomByState) {
                content += `<div><span class="dom-status found">DOM: ✓</span>`;
                if (domEntity && domEntity.id) {
                    content += ` <span class="entity-id">ID: ${domEntity.id}</span>`;
                }
                content += `</div>`;
            } else {
                content += `<div><span class="dom-status missing">DOM: ✗</span></div>`;
            }
            
            // For debugging: if there's a mismatch, show it
            if (inDomByState !== inDomByQuery) {
                content += `<div><span style="color: red; font-weight: bold">⚠️ DOM Status Mismatch: state=${inDomByState}, query=${inDomByQuery}</span></div>`;
            }
            
            // Add properties
            content += `<div class="entity-props">`;
            content += `<h6>Properties:</h6>`;
            for (const prop in entity) {
                if (prop === 'type' || prop === 'DOM') continue; // Already shown or internal
                content += `<div><span class="property-name">${prop}:</span> `;
                
                // Format based on type
                if (typeof entity[prop] === 'object') {
                    // For objects, show as JSON
                    content += `<span class="property-value">${JSON.stringify(entity[prop])}</span>`;
                } else {
                    content += `<span class="property-value">${entity[prop]}</span>`;
                }
                content += '</div>';
            }
            content += `</div>`; // End properties
            
            content += '</div>'; // End entity
        }
    } else {
        content += '<div class="no-entities">No entities in state</div>';
    }
    content += '</div>';
    
    // Display entity mapping
    content += '<div class="entity-mapping">';
    content += `<h5>Entity Mapping (${Object.keys(state.entityMapping || {}).length})</h5>`;
    
    if (state.entityMapping && Object.keys(state.entityMapping).length > 0) {
        for (const id in state.entityMapping) {
            content += `<div><span class="entity-id">${id}</span> → `;
            content += `<span class="entity-uuid">${state.entityMapping[id]}</span></div>`;
        }
    } else {
        content += '<div class="no-mapping">No entity mappings</div>';
    }
    content += '</div>';
    
    content += '</div>'; // End state section
    
    // Add action history
    content += '<div class="debug-section">';
    content += '<h4>Action History</h4>';
    content += '<div class="actions">';
    
    if (actionHistory.length > 0) {
        actionHistory.forEach(action => {
            content += `<div class="action">${action.timestamp}: ${action.message}</div>`;
        });
    } else {
        content += '<div class="no-actions">No actions recorded</div>';
    }
    
    content += '</div>'; // End actions
    content += '</div>'; // End debug section
    
    // Set content
    const debugContent = debugPanel.querySelector('#debug-content');
    if (debugContent) {
        debugContent.innerHTML = content;
    }
}

/**
 * Log an action to the debug panel
 * @param {string} message - The action message to log
 */
export function logAction(message) {
    const timestamp = new Date().toLocaleTimeString();
    actionHistory.unshift({ timestamp, message });
    
    // Keep only the last MAX_ACTIONS
    if (actionHistory.length > MAX_ACTIONS) {
        actionHistory.pop();
    }
    
    // Update the panel if it's visible
    if (isDebugPanelVisible) {
        updateDebugPanel();
    }
} 