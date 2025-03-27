/**
 * UI.js - UI panel components and event handlers
 */

import { getState, setState } from './state.js';
import { logAction } from './debug.js';
import { 
    VECTOR_ATTRIBUTES,
    COMPONENT_BASED_TYPES,
    VECTOR_DEFAULTS,
    GEOMETRY_DEFAULTS,
    LIGHT_DEFAULTS,
    UI_CONFIG
} from './config.js';

// DOM elements
let addBoxBtn;
let addSphereBtn;
let addCylinderBtn;
let addPlaneBtn;
let addLightBtn;
let addTorusBtn;
let addDodecahedronBtn;
let openInspectorBtn;
let saveCodeBtn;
let cameraSelector;
let editorStatus;
let createRandomSceneBtn;

/**
 * Initialize the UI components
 */
export function initUI() {
    console.log('Initializing UI components...');
    
    // Clear any existing listeners to prevent duplicates
    clearExistingListeners();
    
    // Get UI elements - fixing IDs to match the HTML
    addBoxBtn = document.getElementById('add-box');
    addSphereBtn = document.getElementById('add-sphere');
    addCylinderBtn = document.getElementById('add-cylinder');
    addPlaneBtn = document.getElementById('add-plane');
    addLightBtn = document.getElementById('add-light');
    addTorusBtn = document.getElementById('add-torus');
    addDodecahedronBtn = document.getElementById('add-dodecahedron');
    openInspectorBtn = document.getElementById('open-inspector');
    saveCodeBtn = document.getElementById('save-code-btn');
    editorStatus = document.getElementById('editor-status');
    cameraSelector = document.getElementById('camera-selector');
    createRandomSceneBtn = document.getElementById('create-random-scene');
    
    // Initialize camera selector
    initCameraSelector();
    
    // Logging for debugging
    console.log('UI Elements found:');
    console.log('- addBoxBtn:', addBoxBtn);
    console.log('- addSphereBtn:', addSphereBtn);
    console.log('- addCylinderBtn:', addCylinderBtn);
    console.log('- addPlaneBtn:', addPlaneBtn);
    console.log('- addLightBtn:', addLightBtn);
    console.log('- addTorusBtn:', addTorusBtn);
    console.log('- addDodecahedronBtn:', addDodecahedronBtn);
    console.log('- openInspectorBtn:', openInspectorBtn);
    console.log('- saveCodeBtn:', saveCodeBtn);
    console.log('- editorStatus:', editorStatus);
    console.log('- cameraSelector:', cameraSelector);
    console.log('- createRandomSceneBtn:', createRandomSceneBtn);
    
    // Add event listeners
    if (addBoxBtn) {
        console.log('Adding click listener to addBoxBtn');
        addBoxBtn.addEventListener('click', () => {
            console.log('Add box button clicked');
            addEntityHandler('box');
        });
    } else {
        console.error('Add box button not found - looking for element with ID "add-box"');
        // Try to find by CSS selector as fallback
        const altBoxBtn = document.querySelector('.entity-btn:first-child');
        if (altBoxBtn) {
            console.log('Found box button by alternate selector, adding listener');
            altBoxBtn.addEventListener('click', () => {
                console.log('Add box button clicked (alt)');
                addEntityHandler('box');
            });
        }
    }
    
    if (addSphereBtn) {
        addSphereBtn.addEventListener('click', () => {
            console.log('Add sphere button clicked');
            addEntityHandler('sphere');
        });
    } else {
        console.warn('Add sphere button not found');
    }
    
    if (addCylinderBtn) {
        addCylinderBtn.addEventListener('click', () => {
            console.log('Add cylinder button clicked');
            addEntityHandler('cylinder');
        });
    } else {
        console.warn('Add cylinder button not found');
    }
    
    if (addPlaneBtn) {
        addPlaneBtn.addEventListener('click', () => {
            console.log('Add plane button clicked');
            addEntityHandler('plane');
        });
    } else {
        console.warn('Add plane button not found');
    }
    
    if (addLightBtn) {
        addLightBtn.addEventListener('click', () => {
            console.log('Add light button clicked');
            addEntityHandler('light');
        });
    } else {
        console.warn('Add light button not found');
    }
    
    if (addTorusBtn) {
        addTorusBtn.addEventListener('click', () => {
            console.log('Add torus button clicked');
            addEntityHandler('torus');
        });
    }
    
    if (addDodecahedronBtn) {
        addDodecahedronBtn.addEventListener('click', () => {
            console.log('Add dodecahedron button clicked');
            addEntityHandler('dodecahedron');
        });
    }
    
    if (openInspectorBtn) {
        openInspectorBtn.addEventListener('click', () => {
            console.log('Open inspector button clicked');
            openInspector();
        });
    } else {
        console.error('Open inspector button not found');
    }
    
    // Add event listener for the save code button
    if (saveCodeBtn) {
        saveCodeBtn.addEventListener('click', () => {
            console.log('Save code button clicked');
            manuallyApplyEditorChanges();
        });
    } else {
        console.warn('Save code button not found');
    }
    
    // Create random scene button
    if (createRandomSceneBtn) {
        createRandomSceneBtn.addEventListener('click', () => {
            console.log('Create random scene button clicked');
            
            // Import main module to access createRandomScene function
            import('./main.js').then(main => {
                if (main.createRandomScene) {
                    main.createRandomScene();
                } else {
                    console.error('createRandomScene function not found in main module');
                }
            }).catch(err => {
                console.error('Error importing main module:', err);
            });
        });
    }
    
    // Initialize editor status
    if (editorStatus) {
        editorStatus.textContent = 'Ready';
    }
    
    // Directly access all UI buttons by their container and add listeners as backup
    // Only do this if the primary buttons weren't found
    if (!addBoxBtn || !addSphereBtn || !addCylinderBtn || !addPlaneBtn || !addLightBtn) {
        console.log('Using backup method to add event listeners by class');
        
        const entityButtons = document.querySelectorAll('.entity-btn');
        console.log('Found', entityButtons.length, 'entity buttons by class selector');
        
        // Track which types have been handled to avoid duplicates
        const handledTypes = new Set();
        
        entityButtons.forEach(button => {
            const text = button.textContent.trim().toLowerCase();
            
            // Skip if we've already handled this type or if the primary button was found
            if (handledTypes.has(text)) {
                console.log(`Skipping backup listener for ${text} (already handled)`);
                return;
            }
            
            // Skip if the primary button was successfully set up
            if ((text === 'box' && addBoxBtn) || 
                (text === 'sphere' && addSphereBtn) || 
                (text === 'cylinder' && addCylinderBtn) || 
                (text === 'plane' && addPlaneBtn) || 
                (text === 'light' && addLightBtn)) {
                console.log(`Skipping backup listener for ${text} (primary button found)`);
                return;
            }
            
            console.log('Adding backup listener to button:', text);
            handledTypes.add(text);
            
            button.addEventListener('click', () => {
                console.log(`Button ${text} clicked (backup)`);
                switch (text) {
                    case 'box': addEntityHandler('box'); break;
                    case 'sphere': addEntityHandler('sphere'); break;
                    case 'cylinder': addEntityHandler('cylinder'); break;
                    case 'plane': addEntityHandler('plane'); break;
                    case 'light': addEntityHandler('light'); break;
                }
            });
        });
    } else {
        console.log('All primary buttons found, skipping backup method');
    }
    
    // Add backup listener for inspector button only if needed
    if (!openInspectorBtn) {
        const inspectorBtn = document.querySelector('.tool-btn');
        if (inspectorBtn && inspectorBtn.textContent.includes('Inspector')) {
            console.log('Adding backup listener to inspector button');
            inspectorBtn.addEventListener('click', () => {
                console.log('Inspector button clicked (backup)');
                openInspector();
            });
        }
    }
    
    console.log('UI initialization complete');
    logAction('UI initialized');
}

/**
 * Clear existing listeners to prevent duplicates
 */
function clearExistingListeners() {
    console.log('Clearing existing listeners');
    
    // Create new clones to replace elements, removing all listeners
    const elements = [
        'add-box', 
        'add-sphere', 
        'add-cylinder', 
        'add-plane', 
        'add-light', 
        'open-inspector'
    ];
    
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            const clone = element.cloneNode(true);
            element.parentNode.replaceChild(clone, element);
            console.log(`Cleared listeners for ${id}`);
        }
    });
    
    // Also clear any listeners added by class
    const entityButtons = document.querySelectorAll('.entity-btn');
    entityButtons.forEach(button => {
        const clone = button.cloneNode(true);
        button.parentNode.replaceChild(clone, button);
    });
    
    const toolButtons = document.querySelectorAll('.tool-btn');
    toolButtons.forEach(button => {
        const clone = button.cloneNode(true);
        button.parentNode.replaceChild(clone, button);
    });
    
    console.log('All listeners cleared');
}

/**
 * Handler for adding entities
 * @param {string} entityType - Type of entity to add
 */
function addEntityHandler(entityType) {
    // First ensure watcher is ready
    if (!window.watcher) {
        console.log('Watcher not ready, waiting for initialization...');
        // Wait for watcher to be ready
        const checkWatcher = setInterval(() => {
            if (window.watcher) {
                clearInterval(checkWatcher);
                createEntityWithWatcher(entityType);
            }
        }, 100);
        
        // Set a timeout to prevent infinite waiting
        setTimeout(() => {
            if (!window.watcher) {
                clearInterval(checkWatcher);
                console.error('Watcher failed to initialize after timeout');
                import('./utils.js').then(utils => {
                    utils.showNotification('Error: Watcher not initialized', 'error');
                });
            }
        }, 5000);
    } else {
        createEntityWithWatcher(entityType);
    }
}

/**
 * Create an entity once the watcher is ready
 * @param {string} entityType - Type of entity to create
 */
function createEntityWithWatcher(entityType) {
    // Import entity-api module to use the unified API
    import('./entity-api.js').then(entityApi => {
        try {
            // Use the createEntity function from entity-api with minimal properties
            // The entity API will handle default position, color, etc.
            entityApi.createEntity(entityType).then(result => {
                // Log action
                const entityUUID = result.uuid;
                logAction(`Added ${entityType} entity (UUID: ${entityUUID})`);
                console.log(`Created ${entityType} with UUID: ${entityUUID}`);
                
                // Show notification
                import('./utils.js').then(utils => {
                    utils.showNotification(`Added ${entityType} to scene`);
                }).catch(err => {
                    console.error('Error importing utils:', err);
                });
            }).catch(error => {
                console.error(`Error creating ${entityType}:`, error);
                // Show error notification
                import('./utils.js').then(utils => {
                    utils.showNotification(`Error adding ${entityType}: ${error.message}`, 'error');
                }).catch(err => {
                    console.error('Error importing utils:', err);
                });
            });
        } catch (error) {
            console.error(`Error adding ${entityType}:`, error);
            // Show error notification
            import('./utils.js').then(utils => {
                utils.showNotification(`Error adding ${entityType}: ${error.message}`, 'error');
            }).catch(err => {
                console.error('Error importing utils:', err);
            });
        }
    }).catch(err => {
        console.error('Error importing entity-api module:', err);
    });
}

/**
 * Open the A-Frame Inspector
 */
function openInspector() {
    console.log('Opening A-Frame Inspector...');
    
    // Add the inspector class to the body to trigger our CSS rules
    document.body.classList.add('aframe-inspector-opened');
    
    // Get the scene
    const scene = document.querySelector('a-scene');
    
    // Attempt to open the inspector
    if (scene) {
        // Use our new on-demand loading function if available
        if (typeof window.loadAFrameInspector === 'function') {
            window.loadAFrameInspector();
        } else if (scene.components && scene.components.inspector) {
            scene.components.inspector.openInspector();
        } else if (typeof AFRAME !== 'undefined' && AFRAME.INSPECTOR) {
            AFRAME.INSPECTOR.open();
        } else {
            // Try keyboard shortcut
            document.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'i',
                altKey: true,
                ctrlKey: true
            }));
        }
        
        logAction('Opened A-Frame Inspector');
    } else {
        console.error('No A-Frame scene found when trying to open inspector');
    }
}

/**
 * Handle camera change from dropdown
 */
function handleCameraChange(event) {
    const cameraId = event.target.value;
    const scene = document.querySelector('a-scene');
    if (!scene) return;

    // Get the camera entity
    const camera = scene.querySelector(`#${cameraId}`);
    if (!camera) return;

    // Set the camera as active
    camera.setAttribute('camera', 'active', true);
    
    logAction(`Switched to camera: ${cameraId}`);
}

/**
 * Update the camera selection dropdown
 * @param {Array} cameras - Array of camera IDs
 * @param {string} activeCamera - Currently active camera ID
 */
export function updateCameraSelect(cameras, activeCamera) {
    if (!cameraSelector) {
        console.warn('Camera selector not found');
        return;
    }

    // Store current selection
    const currentSelection = cameraSelector.value;
    
    // Clear existing options
    cameraSelector.innerHTML = '';
    
    // Add avatar rig option
    const avatarRigOption = document.createElement('option');
    avatarRigOption.value = 'avatar-rig';
    avatarRigOption.textContent = 'Avatar Rig';
    cameraSelector.appendChild(avatarRigOption);
    
    // Restore previous selection if it still exists
    if (currentSelection) {
        cameraSelector.value = currentSelection;
    } else {
        cameraSelector.value = activeCamera || 'avatar-rig';
    }
}

/**
 * Show a notification toast
 * @param {string} message - Message to display
 * @param {string} type - Type of notification (success, error)
 */
export function showNotification(message, type = 'success') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    // Add to DOM
    document.body.appendChild(toast);
    
    // Remove after animation
    setTimeout(() => {
        document.body.removeChild(toast);
    }, 3000);
}

/**
 * Apply changes from the editor manually
 */
function manuallyApplyEditorChanges() {
    console.log('Manually applying editor changes to scene...');
    
    // Show status indicating processing is happening
    showStatus('Applying changes...', 'status-processing');
    
    // Set a timeout to detect if the operation takes too long
    const timeoutId = setTimeout(() => {
        showStatus('Still working... (this may take a moment)', 'status-processing');
    }, 1500);
    
    import('./monaco.js').then(monaco => {
        try {
            // Get content from editor
            const content = monaco.getEditorContent();
            
            if (content && content.trim()) {
                // Parse content using DOMParser first to validate that it's valid HTML
                try {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(content, 'text/html');
                    
                    // Check if the HTML contains an a-scene
                    const sceneEl = doc.querySelector('a-scene');
                    if (!sceneEl) {
                        clearTimeout(timeoutId);
                        showError('The HTML must contain an a-scene element');
                        return;
                    }
                    
                    // Apply content to the scene
                    const result = monaco.applyEditorContent(content);
                    
                    // Handle result
                    if (result.success) {
                        clearTimeout(timeoutId);
                        console.log('Successfully applied editor changes');
                        if (result.warning) {
                            showWarning('Changes applied with some warnings');
                            console.warn('Apply warnings:', result.warning);
                        } else {
                            showSuccess('Changes applied successfully');
                        }
                    } else {
                        clearTimeout(timeoutId);
                        showError(result.error || 'Unknown error applying changes');
                    }
                } catch (parseError) {
                    clearTimeout(timeoutId);
                    console.error('Error parsing editor content:', parseError);
                    showError('Invalid HTML: ' + parseError.message);
                }
            } else {
                clearTimeout(timeoutId);
                showError('Editor content is empty');
            }
        } catch (error) {
            clearTimeout(timeoutId);
            console.error('Error applying editor changes:', error);
            showError('Error applying changes: ' + error.message);
            
            // Provide recovery suggestion based on the error
            if (error.message.includes('removeChild') || error.message.includes('not a child')) {
                showNotification('Try refreshing the page if scene is corrupted', 'warning', 5000);
            }
        }
    }).catch(err => {
        clearTimeout(timeoutId);
        console.error('Error importing monaco module:', err);
        showError('Failed to load editor module');
    });
}

/**
 * Show a status message in the editor status area
 * @param {string} message - Status message
 * @param {string} statusClass - CSS class for styling
 */
function showStatus(message, statusClass) {
    if (editorStatus) {
        editorStatus.textContent = message;
        
        // Remove all status classes
        editorStatus.classList.remove('status-saved', 'status-changed', 'status-error', 'status-processing');
        
        // Add the specific status class
        if (statusClass) {
            editorStatus.classList.add(statusClass);
        }
    }
}

/**
 * Show success message in editor status
 * @param {string} message - Success message
 */
function showSuccess(message) {
    if (editorStatus) {
        editorStatus.textContent = message || 'Changes saved';
        editorStatus.className = 'status-saved';
        
        // Reset after a delay
        setTimeout(() => {
            editorStatus.textContent = 'Ready';
        }, 3000);
    }
    
    // Also show notification
    import('./utils.js').then(utils => {
        utils.showNotification(message || 'Changes saved');
    }).catch(err => console.error('Error showing notification:', err));
}

/**
 * Show error message in editor status
 * @param {string} message - Error message
 */
function showError(message) {
    if (editorStatus) {
        editorStatus.textContent = message || 'Error';
        editorStatus.className = 'status-error';
        
        // Reset after a delay
        setTimeout(() => {
            editorStatus.textContent = 'Ready';
            editorStatus.className = 'status-saved';
        }, 5000);
    }
    
    // Also show notification
    import('./utils.js').then(utils => {
        utils.showNotification(message || 'Error applying changes', 'error');
    }).catch(err => console.error('Error showing notification:', err));
}

/**
 * Show warning message in editor status
 * @param {string} message - Warning message
 */
function showWarning(message) {
    if (editorStatus) {
        editorStatus.textContent = message || 'Warning';
        editorStatus.className = 'status-warning';
        
        // Reset after a delay
        setTimeout(() => {
            editorStatus.textContent = 'Ready';
            editorStatus.className = 'status-saved';
        }, 4000);
    }
    
    // Also show notification
    import('./utils.js').then(utils => {
        utils.showNotification(message || 'Changes applied with warnings', 'warning');
    }).catch(err => console.error('Error showing notification:', err));
}

// Add a function to safely update Monaco
function updateMonacoSafely(retryCount = 0, maxRetries = 3) {
    console.log(`[UI] Attempting to update Monaco editor (attempt ${retryCount + 1}/${maxRetries + 1})`);
    
    // Dynamic import to avoid circular dependencies
    import('./monaco.js').then(monaco => {
        try {
            if (typeof monaco.updateMonacoEditor === 'function') {
                monaco.updateMonacoEditor(true); // Force update
                console.log('[UI] Monaco editor updated successfully');
            } else if (retryCount < maxRetries) {
                console.log('[UI] Monaco editor not available, will retry after delay');
                setTimeout(() => updateMonacoSafely(retryCount + 1, maxRetries), 1000);
            } else {
                console.error('[UI] Failed to update Monaco editor after all retries');
            }
        } catch (error) {
            console.error('[UI] Error during Monaco update:', error);
            if (retryCount < maxRetries) {
                setTimeout(() => updateMonacoSafely(retryCount + 1, maxRetries), 1000);
            }
        }
    }).catch(err => {
        console.error('[UI] Error importing monaco module:', err);
        if (retryCount < maxRetries) {
            setTimeout(() => updateMonacoSafely(retryCount + 1, maxRetries), 1000);
        }
    });
}

function initCameraSelector() {
    if (!cameraSelector) {
        console.warn('Camera selector not found');
        return;
    }

    // Clear existing options
    cameraSelector.innerHTML = '';
    
    // Add avatar rig option
    const avatarRigOption = document.createElement('option');
    avatarRigOption.value = 'avatar-rig';
    avatarRigOption.textContent = 'Avatar Rig';
    cameraSelector.appendChild(avatarRigOption);
    
    // Add event listener for camera changes
    cameraSelector.addEventListener('change', (e) => {
        const selectedCamera = e.target.value;
        handleCameraChange({ target: { value: selectedCamera } });
    });
}

function updateCameraSelector() {
    if (!cameraSelector) {
        console.warn('Camera selector not found');
        return;
    }

    // Store current selection
    const currentSelection = cameraSelector.value;
    
    // Clear existing options
    cameraSelector.innerHTML = '';
    
    // Add avatar rig option
    const avatarRigOption = document.createElement('option');
    avatarRigOption.value = 'avatar-rig';
    avatarRigOption.textContent = 'Avatar Rig';
    cameraSelector.appendChild(avatarRigOption);
    
    // Restore previous selection if it still exists
    if (currentSelection) {
        cameraSelector.value = currentSelection;
    } else {
        cameraSelector.value = 'avatar-rig';
    }
} 