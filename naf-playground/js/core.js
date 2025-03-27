/**
 * Core.js - Core logic and initialization for the Collaborative A-Frame Scene Builder
 */

import { getState, setState, subscribe } from './state.js';
import { logAction } from './debug.js';
import { generateEntityId } from './utils.js';
import {
  shouldSkipAttribute,
  parseVector,
  extractGeometryData,
  cleanEntityData,
  extractEntityAttributes
} from './entity-utils.js';

import {
  VECTOR_ATTRIBUTES,
  SYSTEM_ENTITY_TYPES,
  SYSTEM_ENTITY_IDS,
  SYSTEM_COMPONENTS,
  SYSTEM_DATA_ATTRIBUTES,
  FILTERED_ENTITY_TYPES,
  FILTERED_ENTITY_IDS,
  FILTERED_COMPONENTS,
  FILTERED_DATA_ATTRIBUTES,
  STANDARD_PRIMITIVES
} from './config.js';

/**
 * Set up hooks for the A-Frame Inspector
 */
export function setupInspectorHook() {
    console.log('Setting up inspector hook...');
    
    const scene = document.querySelector('a-scene');
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
                        console.log('[DEBUG] Inspector closed event received');
                        if (originalState) {
                            console.log('[DEBUG] Restoring original state:', originalState);
                            setState(originalState, 'inspector-close');
                        }
                    });
                }
            });
        }
        
        // Add the inspector-hook component to the scene
        console.log('Adding inspector-hook component to scene');
        scene.setAttribute('inspector-hook', '');
        
        // Override the default inspector open behavior
        if (AFRAME.INSPECTOR) {
            const originalOpen = AFRAME.INSPECTOR.open;
            AFRAME.INSPECTOR.open = function() {
                console.log('Inspector open requested');
                // Only open if explicitly enabled
                if (scene.getAttribute('inspector').enabled) {
                    originalOpen.call(AFRAME.INSPECTOR);
                } else {
                    console.log('Inspector is disabled, ignoring open request');
                }
            };
        }
        
        // Add click handler to the open-inspector button
        const openInspectorBtn = document.getElementById('open-inspector');
        if (openInspectorBtn) {
            openInspectorBtn.addEventListener('click', () => {
                console.log('Open inspector button clicked');
                scene.setAttribute('inspector', 'enabled: true');
                if (AFRAME.INSPECTOR && AFRAME.INSPECTOR.open) {
                    AFRAME.INSPECTOR.open();
                }
            });
        }
        
    } catch (error) {
        console.error('Error setting up inspector hook:', error);
    }
} 