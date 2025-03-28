/**
 * Event Handlers - Centralized event handling for the application
 */

import { getState, setState } from './state.js';
import { logAction } from './debug.js';

/**
 * Set up general event listeners for the application
 */
export function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Get the current state before inspector opens to track changes
    let preInspectorState = null;
    
    // Listen for A-Frame inspector events
    document.addEventListener('inspector-loaded', () => {
        console.log('A-Frame Inspector loaded');
        // Make sure the body has the inspector class
        document.body.classList.add('aframe-inspector-opened');
        
        // Store current state to compare changes later
        preInspectorState = getState();
        console.log('[DEBUG] Stored pre-inspector state:', preInspectorState);
    });
    
    // Create a MutationObserver to watch for inspector class changes
    // This handles cases where inspector is opened via keyboard shortcuts
    const bodyObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class') {
                const bodyClasses = document.body.classList;
                console.log('Body class changed, contains inspector class:', 
                    bodyClasses.contains('aframe-inspector-opened'));
                
                // Get UI container
                const uiContainer = document.getElementById('ui-container');
                
                // If inspector is open
                if (bodyClasses.contains('aframe-inspector-opened')) {
                    // Only hide UI container
                    if (uiContainer && uiContainer.style.display !== 'none') {
                        console.log('Fixing inspector view (UI still visible)');
                        uiContainer.style.display = 'none';
                    }
                } else {
                    // If inspector is closed
                    if (uiContainer && uiContainer.style.display === 'none') {
                        console.log('Fixing standard view (UI still hidden)');
                        uiContainer.style.display = 'flex';
                    }
                }
            }
        });
    });
    
    // Start observing the body element
    bodyObserver.observe(document.body, { attributes: true });
    
    // Listen for window resize events
    window.addEventListener('resize', () => {
        // Ensure all components are properly sized
        const editorContainer = document.getElementById('monaco-editor');
        if (editorContainer) {
            // Monaco editor should handle resize automatically with automaticLayout: true
            console.log('Window resized, editor should adapt automatically');
        }
    });
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (event) => {
        // Ctrl+Alt+I to open inspector
        if (event.ctrlKey && event.altKey && event.key === 'i') {
            console.log('Keyboard shortcut detected to open inspector');
            if (AFRAME.INSPECTOR && AFRAME.INSPECTOR.open) {
                AFRAME.INSPECTOR.open();
            }
        }
    });
    
    logAction('Event listeners setup complete');
} 