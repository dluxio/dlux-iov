/**
 * Inspector-Watcher.js - Watches for changes in the A-Frame Inspector and syncs them to state
 */

import { getState, setState } from './state.js';
import { updateMonacoEditor } from './monaco.js';
import { logAction } from './debug.js';

// Keep track of the original state when the inspector opens
let originalState = null;

// Mutation observer to watch for inspector attribute changes
let inspectorObserver = null;

// DOM elements
let watcherPanel = null;
let statusDisplay = null;
let saveButton = null;
let entityCount = null;
let lastUpdate = null;

// Throttling variables
let changesPending = false;
let lastSaveTime = 0;
const THROTTLE_TIME = 500; // ms

// Also observe document clicks to catch when users interact with inspector
// Keep track of the last click timestamp to avoid duplicate triggers between click and mouseup
let lastClickTimestamp = 0;

// DEBUG variables to track what's triggering the saves
window._watcherDebug = {
    lastEvent: null,
    lastSource: null,
    lastTriggeredAt: null,
    trackEvent: function(event, source) {
        this.lastEvent = {
            type: event.type,
            target: event.target.tagName,
            path: Array.from(event.composedPath()).slice(0, 3).map(el => el.tagName || el.nodeName).join(' > ')
        };
        this.lastSource = source;
        this.lastTriggeredAt = new Date().toISOString();
        console.log('[Watcher Debug]', this.lastSource, this.lastEvent);
    }
};

/**
 * Setup hook to integrate with the A-Frame inspector events directly once it's loaded
 */
function setupInspectorIntegrationOnLoad() {
    console.log('[Watcher] Setting up inspector integration on load hook');
    
    // Function to hook into inspector once it's loaded
    function hookIntoInspector() {
        if (window.AFRAME && window.AFRAME.INSPECTOR) {
            console.log('[Watcher] AFRAME Inspector detected, attaching hooks');
            
            // Hook into inspector events directly
            try {
                // Track the selected entity for better change detection
                let currentSelectedEntity = null;
                
                // Instead of using .on() which may not exist, use DOM-based event listeners
                
                // Monitor selection changes
                document.addEventListener('mousedown', function(e) {
                    // Only process if the inspector is open
                    if (document.body.classList.contains('aframe-inspector-opened')) {
                        // Only trigger for clicks in the entity list or scene
                        const clickedInEntityList = e.target.closest('.scenegraph-entities');
                        const clickedInScene = e.target.closest('a-scene') && !e.target.closest('.aframe-inspector');
                        
                        if (!clickedInEntityList && !clickedInScene) {
                            return;
                        }
                        
                        // After a click, check what entity might be selected by looking at the inspector panels
                        setTimeout(() => {
                            const selectedEl = document.querySelector('.inspector-panel .entityId');
                            if (selectedEl) {
                                const selectedId = selectedEl.textContent || selectedEl.innerText;
                                if (selectedId) {
                                    const entity = document.getElementById(selectedId);
                                    if (entity) {
                                        currentSelectedEntity = entity;
                                        console.log('[Watcher] Entity selected via DOM monitoring:', currentSelectedEntity);
                                    }
                                }
                            }
                        }, 100);
                    }
                });
                
                // Monitor entity transforms
                document.addEventListener('mouseup', function(e) {
                    // Debug which handler is being triggered
                    const debugMouseInfo = {
                        target: e.target.tagName,
                        id: e.target.id,
                        class: e.target.className,
                        path: e.composedPath().map(el => el.tagName || el.nodeName).slice(0, 5).join(' > ')
                    };
                    
                    // Track debug info
                    window._watcherDebug.trackEvent(e, 'setupInspectorIntegration-mouseup');
                    
                    // Only process if the inspector is open and we have a selected entity
                    if (document.body.classList.contains('aframe-inspector-opened') && 
                        currentSelectedEntity && 
                        currentSelectedEntity.object3D) {
                        
                        // Only process mouseup events that could be related to transformation gizmos
                        // This includes: clicking in the scene, or releasing after dragging a transform control
                        const isTransformGizmoInteraction = 
                            e.target.closest('.transformControls') || 
                            (e.target.closest('a-scene') && !e.target.closest('.aframe-inspector')) || 
                            document.querySelector('.transformControls.active');
                        
                        // Ignore clicks completely outside the scene or on UI elements
                        const isSceneClick = e.target.closest('a-scene') && !e.target.closest('.aframe-inspector');
                        if (!isTransformGizmoInteraction && !isSceneClick) {
                            console.log('[Watcher] Ignoring mouseup not related to transformations:', debugMouseInfo);
                            return;
                        }
                        
                        // Check if it's just a UI click, not a transform
                        const isJustUIClick = !isTransformGizmoInteraction && e.target.closest('a-scene');
                        if (isJustUIClick) {
                            console.log('[Watcher] Ignoring simple UI click in scene:', debugMouseInfo);
                            return;
                        }
                        
                        // Force an update of the entity's transform
                        const position = currentSelectedEntity.getAttribute('position');
                        const rotation = currentSelectedEntity.getAttribute('rotation');
                        const scale = currentSelectedEntity.getAttribute('scale');
                        
                        console.log('[Watcher] Transformation detected via gizmo:', {
                            position, rotation, scale
                        });
                        
                        // Trigger save with delay
                        setTimeout(() => {
                            throttledSaveChanges('transform-gizmo');
                        }, 100);
                    } else {
                        console.log('[Watcher] Mouseup ignored - inspector not open or no selection:', debugMouseInfo);
                    }
                });
                
                // Check for a components panel to monitor component changes
                const checkForComponentsPanel = setInterval(() => {
                    const componentsPanel = document.querySelector('.components');
                    if (componentsPanel) {
                        console.log('[Watcher] Found components panel, adding event listeners');
                        
                        // Add event listeners for input changes
                        componentsPanel.addEventListener('input', function(e) {
                            console.log(`[Watcher] Inspector input change detected in ${componentName || 'unknown'} component`, e.target.value);
                            throttledSaveChanges('input-change');
                        });
                        
                        componentsPanel.addEventListener('change', function(e) {
                            console.log(`[Watcher] Component value changed: ${e.target.tagName}.${e.target.getAttribute('data-component-name')}`);
                            throttledSaveChanges('component-change');
                        });
                        
                        clearInterval(checkForComponentsPanel);
                    }
                }, 1000);
                
                // Hook into controls for adding/removing entities
                const checkForSceneGraph = setInterval(() => {
                    const sceneGraph = document.querySelector('.scenegraph');
                    if (sceneGraph) {
                        console.log('[Watcher] Found scene graph, monitoring for entity changes');
                        
                        // Look for add entity button
                        const addEntityButtons = document.querySelectorAll('.button.addEntity');
                        if (addEntityButtons.length > 0) {
                            addEntityButtons.forEach(button => {
                                button.addEventListener('click', function() {
                                    console.log('[Watcher] Add entity button clicked');
                                    // Wait for entity to be added
                                    setTimeout(() => {
                                        throttledSaveChanges('add-entity');
                                    }, 200);
                                });
                            });
                        }
                        
                        // Look for delete entity button
                        const deleteEntityButtons = document.querySelectorAll('.button.deleteEntity');
                        if (deleteEntityButtons.length > 0) {
                            deleteEntityButtons.forEach(button => {
                                button.addEventListener('click', function() {
                                    console.log('[Watcher] Delete entity button clicked');
                                    // Wait for entity to be deleted
                                    setTimeout(() => {
                                        throttledSaveChanges('delete-entity');
                                    }, 200);
                                });
                            });
                        }
                        
                        clearInterval(checkForSceneGraph);
                    }
                }, 1000);
                
                console.log('[Watcher] Successfully set up DOM-based monitoring for inspector');
                updateStatus('Connected to Inspector', 'normal');
            } catch (error) {
                console.error('[Watcher] Error setting up inspector hooks:', error);
            }
        } else {
            console.log('[Watcher] AFRAME Inspector not available yet, will try again later');
            // Try again later
            setTimeout(hookIntoInspector, 1000);
        }
    }
    
    // Start trying to hook into the inspector
    hookIntoInspector();
    
    // Also listen for the inspector's loaded event
    document.addEventListener('inspector-loaded', () => {
        console.log('[Watcher] Inspector loaded event detected, setting up hooks');
        setTimeout(hookIntoInspector, 500);
    });
}

/**
 * Initialize the inspector watcher
 */
export function initInspectorWatcher() {
    console.log('Initializing inspector watcher...');
    
    // Create the watcher panel that will display on top of the inspector
    createWatcherPanel();
    
    // Set up event listeners for inspector open/close
    setupInspectorEvents();
    
    // Set up mutation observer to watch for entity changes
    setupEntityObserver();
    
    // Set up integration with inspector events when it loads
    setupInspectorIntegrationOnLoad();
    
    console.log('Inspector watcher initialized');
}

/**
 * Create the watcher panel element
 */
function createWatcherPanel() {
    // Create the panel element
    watcherPanel = document.createElement('div');
    watcherPanel.id = 'inspector-watcher-panel';
    watcherPanel.className = 'inspector-watcher-panel';
    watcherPanel.style.display = 'none';
    
    // Panel styling
    Object.assign(watcherPanel.style, {
        position: 'fixed',
        bottom: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(20, 20, 30, 0.85)',
        color: '#fff',
        padding: '8px 15px',
        borderRadius: '5px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
        zIndex: '10000',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        maxWidth: '500px',
        width: 'auto',
        textAlign: 'center',
        backdropFilter: 'blur(2px)'
    });
    
    // Create status display element
    statusDisplay = document.createElement('div');
    statusDisplay.textContent = 'Watching for changes...';
    statusDisplay.style.flex = '1';
    statusDisplay.className = 'watcher-status';
    
    // Create entity count element
    entityCount = document.createElement('div');
    entityCount.textContent = 'Entities: 0';
    entityCount.className = 'watcher-entity-count';
    entityCount.style.fontSize = '12px';
    entityCount.style.color = '#8cf';
    
    // Create last update time element
    lastUpdate = document.createElement('div');
    lastUpdate.textContent = 'Last update: never';
    lastUpdate.className = 'watcher-last-update';
    lastUpdate.style.fontSize = '11px';
    lastUpdate.style.color = '#aaa';
    
    // Create save button
    saveButton = document.createElement('button');
    saveButton.textContent = 'Save Now';
    saveButton.className = 'watcher-save-button';
    Object.assign(saveButton.style, {
        backgroundColor: '#2c7cff',
        color: 'white',
        border: 'none',
        borderRadius: '3px',
        padding: '5px 10px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '12px'
    });
    
    saveButton.addEventListener('click', () => {
        captureAndSaveChanges();
    });
    
    // Create info container for entity count and last update
    const infoContainer = document.createElement('div');
    infoContainer.style.display = 'flex';
    infoContainer.style.flexDirection = 'column';
    infoContainer.style.alignItems = 'flex-start';
    infoContainer.style.gap = '2px';
    infoContainer.appendChild(entityCount);
    infoContainer.appendChild(lastUpdate);
    
    // Add elements to panel
    watcherPanel.appendChild(statusDisplay);
    watcherPanel.appendChild(infoContainer);
    watcherPanel.appendChild(saveButton);
    
    // Add to document body
    document.body.appendChild(watcherPanel);
    
    // Add custom CSS
    const style = document.createElement('style');
    style.textContent = `
        .inspector-watcher-panel {
            transition: opacity 0.3s ease, transform 0.3s ease, background-color 0.3s ease;
        }
        .watcher-save-button:hover {
            background-color: #3d8bff;
        }
        .watcher-status.saving {
            color: #ffcc00;
        }
        .watcher-status.saved {
            color: #00ff99;
        }
        .watcher-status.error {
            color: #ff5555;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px) translateX(-50%); }
            to { opacity: 1; transform: translateY(0) translateX(-50%); }
        }
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        @keyframes fadeInOut {
            0% { opacity: 0.8; }
            50% { opacity: 1; }
            100% { opacity: 0.8; }
        }
        @keyframes shake {
            0%, 100% { transform: translateX(-50%); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-52%); }
            20%, 40%, 60%, 80% { transform: translateX(-48%); }
        }
    `;
    document.head.appendChild(style);
}

/**
 * Set up entity observer to directly detect attribute changes
 * This is a more direct approach than relying just on the MutationObserver
 */
function setupDirectPropertyChangeObserver() {
    console.log('[Watcher] Setting up direct property change observer');
    
    try {
        // Only hook position component if it exists
        if (AFRAME && AFRAME.components && AFRAME.components.position) {
            const origUpdateComponent = AFRAME.components.position.Component.prototype.updateProperties;
            AFRAME.components.position.Component.prototype.updateProperties = function(attrValue) {
                // Check if this component is part of a raycaster/cursor entity that should be ignored
                if (this.el && (
                    this.el.hasAttribute('raycaster') || 
                    this.el.hasAttribute('cursor') ||
                    this.el.classList.contains('aframeInspectorMouseCursor') || 
                    this.el.id === 'aframeInspectorMouseCursor' ||
                    this.el.hasAttribute('data-aframe-inspector')
                )) {
                    // If it's an inspector entity, use the original method but don't trigger save
                    return origUpdateComponent.call(this, attrValue);
                }
                
                console.log('[Watcher] Direct position component update detected:', attrValue);
                // Call original method
                origUpdateComponent.call(this, attrValue);
                // Trigger change detection
                throttledSaveChanges('position-component');
            };
        }
        
        // Hook into component update cycle directly
        if (AFRAME && AFRAME.AEntity && AFRAME.AEntity.prototype.updateComponents) {
            const origUpdateComponents = AFRAME.AEntity.prototype.updateComponents;
            AFRAME.AEntity.prototype.updateComponents = function() {
                // Check if this is a raycaster/cursor entity that should be ignored
                if (isIgnorableEntity(this)) {
                    // If it's an inspector entity, use the original method but don't trigger save
                    return origUpdateComponents.call(this);
                }
                
                console.log('[Watcher] Entity updateComponents detected');
                // Call original method
                origUpdateComponents.call(this);
                // Trigger change detection
                throttledSaveChanges('updateComponents');
            };
        }
        
        // Hook into the setAttribute method to catch all component changes
        if (AFRAME && AFRAME.AEntity && AFRAME.AEntity.prototype.setAttribute) {
            const origSetAttribute = AFRAME.AEntity.prototype.setAttribute;
            AFRAME.AEntity.prototype.setAttribute = function(attr, value) {
                // Special handling for raycaster attributes - always ignore these
                if (attr === 'raycaster' || attr === 'cursor') {
                    // Silently ignore raycaster/cursor attributes without logging
                    return origSetAttribute.call(this, attr, value);
                }
                
                // Capture the ignorable state before the attribute is set
                const wasIgnorable = isIgnorableEntity(this);
                
                // Always call the original method to ensure proper A-Frame functionality
                origSetAttribute.call(this, attr, value);
                
                // If this is adding an inspector-related attribute, mark it to be ignored
                if (attr === 'data-aframe-inspector') {
                    // Silently ignore
                    return; // Don't trigger changes
                }
                
                // If it's an inspector entity, don't trigger save
                if (wasIgnorable || isIgnorableEntity(this)) {
                    // Silently ignore inspector entities
                    return;
                }
                
                // Only log for real entity updates we care about
                console.log(`[Watcher] Entity setAttribute detected: ${attr} = ${JSON.stringify(value)}`);
                // Trigger change detection
                throttledSaveChanges('setAttribute-' + attr);
            };
        }
        
        // Add a scene load listener to detect when new entities are added
        const scene = document.querySelector('a-scene');
        if (scene) {
            scene.addEventListener('child-attached', function(evt) {
                const el = evt.detail.el;
                if (isIgnorableEntity(el)) {
                    return;
                }
                
                console.log('[Watcher] New entity attached to scene:', el);
                // Trigger change detection
                throttledSaveChanges('child-attached');
            });
            
            scene.addEventListener('child-detached', function(evt) {
                const el = evt.detail.el;
                if (isIgnorableEntity(el)) {
                    return;
                }
                
                console.log('[Watcher] Entity detached from scene:', el);
                // Trigger change detection
                throttledSaveChanges('child-detached');
            });
        }
        
        // No longer using AFRAME.INSPECTOR.on since it might not exist
        // Instead, we'll rely on DOM events and MutationObserver to detect changes
        
        console.log('[Watcher] Direct property change observers set up');
    } catch (error) {
        console.error('[Watcher] Error setting up direct property change observer:', error);
        // Continue with other operations even if this fails
    }
}

/**
 * Check if an entity is an inspector-specific entity that should be ignored
 * @param {Element} entity - The entity to check
 * @returns {boolean} - True if the entity should be ignored
 */
function isIgnorableEntity(entity) {
    if (!entity) return true;
    
    // ALWAYS ignore entities with raycaster or cursor - these are never user entities
    if (entity.hasAttribute('raycaster') || entity.hasAttribute('cursor')) {
        return true;
    }
    
    // Check for dynamically added raycaster through components object
    if (entity.components && entity.components.raycaster) {
        return true;
    }
    
    // Check for system entities
    if (['builder-camera', 'default-light', 'directional-light'].includes(entity.id)) {
        return true;
    }

    // Check if this is a camera or an entity with camera
    if (entity.tagName === 'A-CAMERA' || (entity.components && entity.components.camera)) {
        return true;
    }
    
    // Check for inspector-specific entities
    if (entity.classList && (
        entity.classList.contains('aframeInspectorMouseCursor') || 
        entity.id === 'aframeInspectorMouseCursor' || 
        entity.hasAttribute('data-aframe-inspector') ||
        entity.getAttribute('data-aframe-inspector') === 'true'
    )) {
        return true;
    }
    
    // Check for temporary inspector helpers
    if (entity.classList && (
        entity.classList.contains('helper') || 
        entity.classList.contains('axisHelper') || 
        entity.classList.contains('axisCone')
    )) {
        return true;
    }
    
    // Check for parent relationships
    const parent = entity.parentNode;
    if (parent && parent.hasAttribute && parent.hasAttribute('data-aframe-inspector')) {
        return true;
    }
    
    // Check if the entity is inside the inspector UI
    if (entity.closest && entity.closest('.aframe-inspector-inner')) {
        return true;
    }
    
    // Check if entity has inspector-related properties in its dataset
    if (entity.dataset && (
        entity.dataset.aframeInspector === 'true' ||
        entity.dataset.aframeCursor === 'true' ||
        entity.dataset.aframeRaycaster === 'true'
    )) {
        return true;
    }
    
    // Check if this is a temporary entity (with randomly generated/numbered ID that matches inspector patterns)
    if (entity.id && (
        entity.id.startsWith('aframe-inspector-') || 
        entity.id.startsWith('raycast-') ||
        entity.id.includes('cursor') ||
        entity.id.includes('helper')
    )) {
        return true;
    }
    
    return false;
}

/**
 * Set up direct attribute monitor using a simpler approach that doesn't require component hooks
 */
function setupAttributeMonitor() {
    console.log('[Watcher] Setting up direct attribute monitor');
    
    // Create a separate observer specifically for attribute changes
    const attributeObserver = new MutationObserver((mutations) => {
        let componentChanged = false;
        
        for (const mutation of mutations) {
            if (mutation.type === 'attributes') {
                const target = mutation.target;
                
                // Look for A-Frame entity elements by tag name pattern
                if (target.tagName && target.tagName.toLowerCase().startsWith('a-')) {
                    // Ignore system entities and raycaster/cursor entities
                    if (isIgnorableEntity(target)) {
                        continue;
                    }
                    
                    // If it's a component attribute (not class, etc)
                    if (!['class', 'style', 'aframe-injected', 'data-aframe-inspector'].includes(mutation.attributeName)) {
                        console.log(`[Watcher] Direct attribute change detected: ${target.tagName.toLowerCase()}.${mutation.attributeName}`);
                        componentChanged = true;
                        break;
                    }
                }
            }
        }
        
        if (componentChanged) {
            throttledSaveChanges();
        }
    });
    
    // Start observing the scene for attribute changes
    const scene = document.querySelector('a-scene');
    if (scene) {
        attributeObserver.observe(scene, {
            attributes: true,
            subtree: true
            // No attributeFilter - observe all attributes
        });
        console.log('[Watcher] Attribute monitor started');
    } else {
        console.warn('[Watcher] Could not find scene for attribute monitor');
    }
    
    // Return the observer so it can be stopped later if needed
    return attributeObserver;
}

/**
 * Monitor inspector input events directly for changes to values in the forms
 */
function setupInspectorInputMonitoring() {
    console.log('[Watcher] Setting up inspector input monitoring');
    
    // Function to handle any input change in the inspector
    function handleInspectorInputChange(e) {
        // Check if the event target is an input element in the inspector
        if (e.target && e.target.closest('.aframe-inspector')) {
            // Only process if it's an input, select, or other form control
            if (e.target.tagName && (
                e.target.tagName === 'INPUT' || 
                e.target.tagName === 'SELECT' ||
                e.target.tagName === 'TEXTAREA' ||
                e.target.classList.contains('value') ||
                e.target.classList.contains('color') ||
                e.target.classList.contains('vec3')
            )) {
                // Get the component name from the closest propertyRow if available
                let componentName = '';
                const propertyRow = e.target.closest('.propertyRow');
                if (propertyRow && propertyRow.dataset && propertyRow.dataset.componentName) {
                    componentName = propertyRow.dataset.componentName;
                }
                
                console.log(`[Watcher] Inspector input change detected in ${componentName || 'unknown'} component`, e.target.value);
                
                // Use throttling to avoid too many updates
                throttledSaveChanges();
            }
        }
    }
    
    // Monitor for input events (covers text inputs, sliders, etc.)
    document.addEventListener('input', handleInspectorInputChange);
    
    // Monitor for change events (covers dropdowns, checkboxes, etc.)
    document.addEventListener('change', handleInspectorInputChange);
    
    // Monitor for button clicks in the inspector that might modify values
    document.addEventListener('click', function(e) {
        if (e.target && e.target.closest('.aframe-inspector')) {
            // Check if it's a button that modifies entity values
            if (e.target.tagName === 'BUTTON' || 
                e.target.classList.contains('button') ||
                e.target.classList.contains('actionButton')) {
                
                // Specifically target only buttons that would modify entities
                const isEntityModifierButton = 
                    e.target.closest('.addComponentContainer') || // Add component button
                    e.target.closest('.propertyRow') || // Component property buttons
                    e.target.closest('.collapsible-header') || // Collapse/expand component
                    e.target.closest('.actions') || // Actions buttons like copy/paste
                    e.target.classList.contains('addEntity') || // Add entity button
                    e.target.classList.contains('deleteEntity') || // Delete entity button
                    e.target.textContent.includes('Add') || // Add buttons
                    e.target.textContent.includes('Remove'); // Remove buttons
                
                if (!isEntityModifierButton) {
                    return;
                }
                
                console.log('[Watcher] Inspector entity-modifier button click detected', e.target);
                
                // Delay the save as button actions might take time to complete
                setTimeout(() => {
                    throttledSaveChanges('control-panel-click');
                }, 200);
            }
        }
    });
    
    // Special case for color pickers which might use custom events
    document.addEventListener('colorpickerupdate', function(e) {
        console.log('[Watcher] Color picker update detected', e.detail);
        throttledSaveChanges('color-picker');
    });
    
    // Monitor drag events for position/rotation handles
    document.addEventListener('mouseup', function(e) {
        if (document.body.classList.contains('aframe-inspector-opened')) {
            // Debug info for tracking
            const debugMouseInfo = {
                target: e.target.tagName,
                id: e.target.id,
                class: e.target.className,
                path: e.composedPath().map(el => el.tagName || el.nodeName).slice(0, 5).join(' > ')
            };
            
            // Track debug info
            window._watcherDebug.trackEvent(e, 'setupInspectorInputMonitoring-mouseup');
            
            // Only trigger for specific inspector interactions that modify entities
            const interactedWithInspectorControls = 
                e.target.closest('.vector') || 
                e.target.closest('.color-wrapper') ||
                e.target.closest('input[type="number"]') ||
                e.target.closest('input[type="range"]') ||
                e.target.closest('.transformControls') ||
                (e.target.closest('a-scene') && document.querySelector('.transformControls.active'));
                
            if (!interactedWithInspectorControls) {
                // Debug which mouseup events we're ignoring
                console.log('[Watcher] Ignoring mouseup not on inspector controls:', debugMouseInfo);
                return;
            }
            
            console.log('[Watcher] Inspector control interaction detected:', debugMouseInfo);
            
            // When mouse is released after potentially dragging something
            setTimeout(() => {
                throttledSaveChanges('inspector-control-mouseup');
            }, 100);
        }
    });
    
    console.log('[Watcher] Inspector input monitoring set up');
    
    // Return a cleanup function to remove the event listeners if needed
    return function cleanup() {
        document.removeEventListener('input', handleInspectorInputChange);
        document.removeEventListener('change', handleInspectorInputChange);
    };
}

/**
 * Set up event listeners for inspector open/close
 */
function setupInspectorEvents() {
    // Listen for inspector opened event
    document.addEventListener('inspector-opened', () => {
        console.log('[Watcher] Inspector opened');
        
        // Store original state
        originalState = getState();
        console.log('[Watcher] Stored original state:', originalState);
        
        // Show the watcher panel with animation
        watcherPanel.style.display = 'flex';
        watcherPanel.style.animation = 'fadeIn 0.3s forwards';
        
        // Update entity count
        updateEntityCount();
        
        // Start observing entities
        startObserver();
        
        // Set up monitoring
        // Give it time for the inspector to fully initialize
        setTimeout(() => {
            // Try the direct approach, but don't worry if it fails
            try {
                setupDirectPropertyChangeObserver();
            } catch (err) {
                console.warn('[Watcher] Could not set up direct property change observer:', err);
            }
            
            // Set up the more reliable attribute monitor
            setupAttributeMonitor();
            
            // Set up input monitoring
            setupInspectorInputMonitoring();
        }, 1000);
    });
    
    // Listen for inspector closed event
    document.addEventListener('inspector-closed', () => {
        console.log('[Watcher] Inspector closed');
        
        // Final save before closing
        captureAndSaveChanges();
        
        // Hide the watcher panel
        watcherPanel.style.animation = '';
        watcherPanel.style.display = 'none';
        
        // Stop observing entities
        stopObserver();
    });
    
    // Also listen for mutations on the body element to detect inspector
    // This is a backup in case the custom events aren't fired
    const bodyObserver = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            if (mutation.attributeName === 'class') {
                const bodyClasses = document.body.classList;
                
                // If inspector opened
                if (bodyClasses.contains('aframe-inspector-opened') && 
                    watcherPanel.style.display === 'none') {
                    console.log('[Watcher] Inspector detected via body class change');
                    
                    // Store original state
                    originalState = getState();
                    
                    // Show the watcher panel
                    watcherPanel.style.display = 'flex';
                    watcherPanel.style.animation = 'fadeIn 0.3s forwards';
                    
                    // Update entity count and start observer
                    updateEntityCount();
                    startObserver();
                    
                    // Set up direct property change observer after a delay
                    setTimeout(() => {
                        setupDirectPropertyChangeObserver();
                        setupInspectorInputMonitoring();
                    }, 1000);
                    
                    // Dispatch custom event in case other handlers need it
                    document.dispatchEvent(new CustomEvent('inspector-opened'));
                }
                
                // If inspector closed
                if (!bodyClasses.contains('aframe-inspector-opened') && 
                    watcherPanel.style.display === 'flex') {
                    console.log('[Watcher] Inspector closed detected via body class change');
                    
                    // Final save
                    captureAndSaveChanges();
                    
                    // Hide panel
                    watcherPanel.style.animation = '';
                    watcherPanel.style.display = 'none';
                    
                    // Stop observer
                    stopObserver();
                    
                    // Dispatch custom event in case other handlers need it
                    document.dispatchEvent(new CustomEvent('inspector-closed'));
                }
            }
        }
    });
    
    // Start observing body class changes
    bodyObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ['class']
    });
}

/**
 * Set up mutation observer to watch for entity changes
 */
function setupEntityObserver() {
    // Create an observer instance
    inspectorObserver = new MutationObserver((mutations) => {
        let entityUpdated = false;
        
        for (const mutation of mutations) {
            // Handle attribute changes to A-Frame entities
            if (mutation.type === 'attributes') {
                const target = mutation.target;
                // Check if this is an A-Frame entity or component
                if (target.tagName && (
                    target.tagName.toLowerCase().startsWith('a-') || 
                    target.hasAttribute('data-entity-uuid')
                )) {
                    console.log(`[Watcher] Detected attribute change to ${target.tagName.toLowerCase()}, attribute: ${mutation.attributeName}`);
                    entityUpdated = true;
                    break;
                } 
                // Also check for changes to inspector inputs that might be editing entities
                else if (target.classList && (
                    target.classList.contains('propertyRow') || 
                    target.classList.contains('value') ||
                    target.classList.contains('vec3') ||
                    target.classList.contains('color')
                )) {
                    console.log(`[Watcher] Detected change in inspector input: ${mutation.attributeName}`);
                    entityUpdated = true;
                    break;
                }
            } 
            // Handle addition/removal of A-Frame entities
            else if (mutation.type === 'childList') {
                // Check added nodes
                for (const node of mutation.addedNodes) {
                    if (node.tagName && node.tagName.toLowerCase().startsWith('a-')) {
                        console.log(`[Watcher] Detected addition of ${node.tagName.toLowerCase()}`);
                        entityUpdated = true;
                        break;
                    }
                }
                
                // Check removed nodes
                for (const node of mutation.removedNodes) {
                    if (node.tagName && node.tagName.toLowerCase().startsWith('a-')) {
                        console.log(`[Watcher] Detected removal of ${node.tagName.toLowerCase()}`);
                        entityUpdated = true;
                        break;
                    }
                }
                
                if (entityUpdated) break;
            }
        }
        
        // If an entity was updated, throttle the save
        if (entityUpdated) {
            throttledSaveChanges();
        }
    });
}

/**
 * Start observing for entity changes
 */
function startObserver() {
    if (!inspectorObserver) return;
    
    try {
        // Get the scene element
        const scene = document.querySelector('a-scene');
        if (!scene) {
            console.error('[Watcher] No scene found to observe');
            return;
        }
        
        // Also observe the inspector GUI to catch direct manipulation
        const inspectorContainer = document.querySelector('.aframe-inspector');
        
        // Start observing the scene for direct entity changes
        inspectorObserver.observe(scene, {
            attributes: true,
            childList: true,
            subtree: true
        });
        
        // If inspector container exists, also observe it
        if (inspectorContainer) {
            console.log('[Watcher] Also observing inspector container');
            inspectorObserver.observe(inspectorContainer, {
                attributes: true,
                childList: true,
                subtree: true
            });
        } else {
            // Set a timeout to try again after inspector might have loaded
            setTimeout(() => {
                const laterInspectorContainer = document.querySelector('.aframe-inspector');
                if (laterInspectorContainer) {
                    console.log('[Watcher] Found inspector container on retry, observing it');
                    inspectorObserver.observe(laterInspectorContainer, {
                        attributes: true,
                        childList: true,
                        subtree: true
                    });
                }
            }, 1000);
        }
        
        // Also observe document clicks to catch when users interact with inspector
        document.addEventListener('click', function(e) {
            // Track debug info
            window._watcherDebug.trackEvent(e, 'startObserver-click');
            
            // Debug info for tracking
            const debugClickInfo = {
                target: e.target.tagName,
                id: e.target.id,
                class: e.target.className,
                time: new Date().toISOString()
            };
            
            // If click is inside the inspector
            if (e.target && e.target.closest('.aframe-inspector')) {
                // Only trigger for clicks on controls that would modify entities
                const clickedInControlPanel = e.target.closest('.components') || 
                                      e.target.closest('.propertyRow') ||
                                      e.target.closest('.control') ||
                                      e.target.closest('.vector') ||
                                      e.target.closest('.color-wrapper') ||
                                      e.target.closest('.scenegraph');
                
                // Ignore clicks on irrelevant UI elements
                if (!clickedInControlPanel) {
                    console.log('[Watcher] Ignoring click not on control panel:', debugClickInfo);
                    return;
                }

                // Ignore clicks on raycast/cursor elements
                if (isIgnorableEntity(e.target) || (e.target.closest && isIgnorableEntity(e.target.closest('a-entity')))) {
                    console.log('[Watcher] Ignoring click on ignorable entity:', debugClickInfo);
                    return;
                }
                
                // Check for duplicate trigger (e.g., if mouseup already triggered the save)
                const now = Date.now();
                if (now - lastClickTimestamp < 300) {
                    console.log('[Watcher] Ignoring duplicate click trigger:', debugClickInfo);
                    return;
                }
                
                lastClickTimestamp = now;
                console.log('[Watcher] Control panel click detected in inspector:', debugClickInfo);
                
                // Wait a short time then check for changes
                setTimeout(() => {
                    throttledSaveChanges('control-panel-click');
                }, 200);
            }
        });
        
        // Also observe keypresses for number inputs and other value changes
        document.addEventListener('keyup', function(e) {
            // If keypress is inside the inspector
            if (e.target && e.target.closest('.aframe-inspector')) {
                // Only check for keys that would change values
                if (e.key === 'Enter' || e.key === 'Tab' || 
                    e.key >= '0' && e.key <= '9' || 
                    e.key === '.' || e.key === '-' || 
                    e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                    console.log('[Watcher] Value changing keypress detected in inspector');
                    throttledSaveChanges('keypress');
                }
            }
        });
        
        console.log('[Watcher] Started observing scene and inspector for changes');
        updateStatus('Watching for changes...', 'normal');
    } catch (error) {
        console.error('[Watcher] Error setting up observers:', error);
        updateStatus('Error setting up watchers', 'error');
    }
}

/**
 * Stop observing for entity changes
 */
function stopObserver() {
    if (!inspectorObserver) return;
    
    // Disconnect the observer
    inspectorObserver.disconnect();
    console.log('[Watcher] Stopped observing scene for changes');
}

/**
 * Throttle save changes to avoid too many updates
 * @param {string} source - Identifies what triggered the save
 */
function throttledSaveChanges(source = 'unknown') {
    console.log(`[Watcher] Changes requested from: ${source}`);
    
    // Mark that we have pending changes
    changesPending = true;
    
    // Update status immediately to provide feedback
    updateStatus('Changes detected...', 'saving');
    
    // If we haven't saved recently, save after a short delay to allow multiple changes to accumulate
    const now = Date.now();
    
    // Clear any existing timeout
    if (window._watcherSaveTimeout) {
        clearTimeout(window._watcherSaveTimeout);
    }
    
    // Set a relatively short delay for good responsiveness
    const delay = now - lastSaveTime > THROTTLE_TIME * 2 ? 300 : THROTTLE_TIME;
    
    // Set a new timeout to save after the delay
    window._watcherSaveTimeout = setTimeout(() => {
        // Only save if we still have pending changes
        if (changesPending) {
            captureAndSaveChanges(source);
        }
    }, delay);
    
    // Update UI to provide feedback
    updateEntityCount();
}

/**
 * Update the entity count display
 */
function updateEntityCount() {
    // Count entities in scene (excluding system entities)
    const scene = document.querySelector('a-scene');
    if (!scene) return;
    
    const entities = scene.querySelectorAll('a-entity, a-box, a-sphere, a-cylinder, a-plane, a-sky');
    let count = 0;
    
    entities.forEach(entity => {
        // Skip system entities and inspector-specific entities
        if (isIgnorableEntity(entity)) {
            return;
        }
        count++;
    });
    
    // Update the display
    entityCount.textContent = `Entities: ${count}`;
}

/**
 * Update the status display
 * @param {string} message - Status message
 * @param {string} type - Status type (normal, saving, saved, error)
 */
function updateStatus(message, type = 'normal') {
    statusDisplay.textContent = message;
    
    // Remove all status classes
    statusDisplay.classList.remove('saving', 'saved', 'error');
    
    // Add the appropriate class
    if (type !== 'normal') {
        statusDisplay.classList.add(type);
    }
    
    // Animate the panel based on type
    if (type === 'saved') {
        watcherPanel.style.animation = 'pulse 0.5s';
        // Flash green background briefly
        watcherPanel.style.backgroundColor = 'rgba(20, 80, 30, 0.85)';
        // Reset animation and background after it completes
        setTimeout(() => {
            watcherPanel.style.animation = '';
            watcherPanel.style.backgroundColor = 'rgba(20, 20, 30, 0.85)';
        }, 500);
    } else if (type === 'saving') {
        // Flash yellow background for saving
        watcherPanel.style.backgroundColor = 'rgba(80, 80, 20, 0.85)';
        watcherPanel.style.animation = 'fadeInOut 1s infinite';
    } else if (type === 'error') {
        // Flash red background for errors
        watcherPanel.style.backgroundColor = 'rgba(80, 20, 20, 0.85)';
        watcherPanel.style.animation = 'shake 0.5s';
        setTimeout(() => {
            watcherPanel.style.animation = '';
            watcherPanel.style.backgroundColor = 'rgba(20, 20, 30, 0.85)';
        }, 1000);
    } else {
        // Reset to normal
        watcherPanel.style.backgroundColor = 'rgba(20, 20, 30, 0.85)';
        watcherPanel.style.animation = '';
    }
}

/**
 * Update the last update time
 */
function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    lastUpdate.textContent = `Last update: ${timeString}`;
}

/**
 * Capture and save changes from inspector to state
 * @param {string} source - Identifies what triggered the save
 */
function captureAndSaveChanges(source = 'unknown') {
    console.log(`[Watcher] Capturing and saving changes... (source: ${source})`);
    updateStatus('Saving changes...', 'saving');
    
    try {
        // Reset the changes pending flag
        changesPending = false;
        
        // Update the last save time
        lastSaveTime = Date.now();
        
        // Import required modules
        import('./state.js').then(stateModule => {
            const generateEntityUUID = stateModule.generateEntityUUID;
            
            // Get scene
            const scene = document.querySelector('a-scene');
            if (!scene) {
                console.error('[Watcher] No scene found when saving changes');
                updateStatus('Error: Scene not found', 'error');
                return;
            }
            
            // Track if any changes were actually detected
            let changesDetected = false;
            
            // Get current scene entities
            const currentEntities = {};
            const currentEntityMapping = {};
            
            // Get current state to compare
            const currentState = stateModule.getState();
            const oldEntities = currentState.entities || {};
            
            // Find all entities (excluding the persistent camera and other system entities)
            const entities = scene.querySelectorAll('a-entity, a-box, a-sphere, a-cylinder, a-plane, a-sky');
            let entityCount = 0;
            
            entities.forEach(entity => {
                // Skip system entities and inspector-specific entities
                if (isIgnorableEntity(entity)) {
                    // Skip silently without logging
                    return;
                }
                
                entityCount++;
                
                // Get or generate UUID
                let uuid = entity.dataset.entityUuid;
                
                // If no UUID exists, generate one and assign it
                if (!uuid) {
                    uuid = generateEntityUUID();
                    entity.dataset.entityUuid = uuid;
                    console.log(`[Watcher] Generated new UUID ${uuid} for entity:`, entity);
                    changesDetected = true;
                }
                
                // Get the entity tag name to determine type
                const tagName = entity.tagName.toLowerCase();
                const type = tagName.startsWith('a-') ? tagName.substring(2) : tagName;
                
                // Get entity component data
                const entityData = getEntityData(entity);
                
                // Add type to entity data
                entityData.type = type;
                
                // Check if this entity has changed from the previous state
                if (!oldEntities[uuid] || !deepEqual(oldEntities[uuid], entityData)) {
                    changesDetected = true;
                    console.log(`[Watcher] Entity ${uuid} has changed:`, 
                        oldEntities[uuid] ? 'Updated' : 'New');
                }
                
                // Store entity data in current entities
                currentEntities[uuid] = entityData;
                
                // Update entity mapping if entity has an ID
                if (entity.id) {
                    currentEntityMapping[entity.id] = uuid;
                }
            });
            
            // Check for deleted entities
            for (const uuid in oldEntities) {
                if (!currentEntities[uuid]) {
                    console.log(`[Watcher] Entity ${uuid} has been deleted`);
                    changesDetected = true;
                }
            }
            
            // If no changes were detected, don't update state
            if (!changesDetected && entityCount > 0) {
                console.log(`[Watcher] No changes detected in ${entityCount} entities`);
                updateStatus('No changes detected', 'normal');
                return;
            }
            
            console.log(`[Watcher] Found ${entityCount} entities to save from inspector`);
            
            // Update state with new entities and mapping
            stateModule.setState({ 
                entities: currentEntities,
                entityMapping: currentEntityMapping
            });
            
            // Verify state was updated properly
            const newState = stateModule.getState();
            console.log('[Watcher] State after update:', newState);
            
            // Dispatch a custom event to notify that watcher changes have been saved
            document.dispatchEvent(new CustomEvent('watcher-changes-saved', {
                detail: {
                    entities: currentEntities,
                    entityCount: entityCount,
                    changesDetected: changesDetected
                }
            }));
            
            // Update the entity count display
            updateEntityCount();
            
            // Update last update time
            updateLastUpdateTime();
            
            // Force update the Monaco editor to reflect these changes
            import('./monaco.js').then(monaco => {
                if (monaco.updateMonacoEditor) {
                    console.log('[Watcher] Updating Monaco editor to reflect inspector changes');
                    setTimeout(() => {
                        try {
                            monaco.updateMonacoEditor(true); // Force update
                            console.log('[Watcher] Monaco editor update completed');
                            
                            // Show success message
                            updateStatus(changesDetected 
                                ? 'Changes saved successfully!' 
                                : 'Scene saved (no changes)', 
                                'saved');
                            
                            // Reset status after a delay
                            setTimeout(() => {
                                updateStatus('Watching for changes...', 'normal');
                            }, 2000);
                            
                        } catch (err) {
                            console.error('[Watcher] Error updating Monaco editor:', err);
                            updateStatus('Error updating editor', 'error');
                        }
                    }, 500);
                } else {
                    console.warn('[Watcher] Monaco editor update function not available');
                    updateStatus('Warning: Editor update unavailable', 'error');
                }
            }).catch(err => {
                console.error('[Watcher] Error importing monaco module:', err);
                updateStatus('Error updating editor', 'error');
            });
            
            // Log action
            logAction(changesDetected 
                ? `Inspector changes saved by watcher (${entityCount} entities)` 
                : 'Scene saved (no changes detected)');
            
        }).catch(err => {
            console.error('[Watcher] Error importing state module:', err);
            updateStatus('Error saving changes', 'error');
        });
    } catch (error) {
        console.error('[Watcher] Error capturing changes:', error);
        updateStatus('Error saving changes', 'error');
        // Re-enable changes pending so it can be tried again
        changesPending = true;
    }
}

/**
 * Deep equality check for objects
 * @param {Object} obj1 - First object to compare
 * @param {Object} obj2 - Second object to compare
 * @returns {boolean} - Whether the objects are equal
 */
function deepEqual(obj1, obj2) {
    if (obj1 === obj2) return true;
    
    if (typeof obj1 !== 'object' || obj1 === null || 
        typeof obj2 !== 'object' || obj2 === null) {
        return obj1 === obj2;
    }
    
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) return false;
    
    for (const key of keys1) {
        // Skip comparing certain properties that might have precision differences
        if (key === 'position' || key === 'rotation' || key === 'scale') {
            // For vector properties, approximate equality is enough
            const vec1 = obj1[key];
            const vec2 = obj2[key];
            
            if (!vec1 || !vec2) return false;
            
            if (typeof vec1 === 'object' && typeof vec2 === 'object') {
                // Vector comparison with tolerance
                for (const axis of ['x', 'y', 'z']) {
                    if (vec1[axis] !== undefined && vec2[axis] !== undefined) {
                        // Allow for small floating point differences
                        if (Math.abs(vec1[axis] - vec2[axis]) > 0.001) {
                            return false;
                        }
                    } else if (vec1[axis] !== vec2[axis]) {
                        return false;
                    }
                }
                continue;
            }
        }
        
        // For color values, normalize first
        if (key === 'color') {
            // Simple string comparison for now
            if (String(obj1[key]).toLowerCase() !== String(obj2[key]).toLowerCase()) {
                return false;
            }
            continue;
        }
        
        if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
            return false;
        }
    }
    
    return true;
}

/**
 * Get all component data from an entity
 * @param {Element} entity - A-Frame entity
 * @returns {Object} - Component data
 */
function getEntityData(entity) {
    const data = {};
    
    // Get all component names
    const componentNames = entity.getAttributeNames()
        .filter(name => name !== 'id' && name !== 'data-entity-uuid');
    
    // Get component data for each component
    componentNames.forEach(name => {
        // Skip aframe-injected attribute and class
        if (name === 'aframe-injected' || name === 'class') {
            return;
        }
        
        // Normalize component name (handle dot notation)
        const normalizedName = name.replace('.', '__');
        data[normalizedName] = entity.getAttribute(name);
    });
    
    return data;
}

// Export the module functions
export { 
    captureAndSaveChanges,
    updateStatus,
    updateEntityCount
}; 