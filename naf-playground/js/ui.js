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
import * as sceneLoader from './scene-loader.js';

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
    saveCodeBtn = document.getElementById('apply-changes');
    editorStatus = document.getElementById('editor-status');
    cameraSelector = document.getElementById('camera-selector');
    createRandomSceneBtn = document.getElementById('create-random-scene');
    
    // Initialize camera selector
    initCameraSelector();
    
    // Initialize scene selector
    setupSceneLoaderUI();
    
    // Initialize asset manager UI
    initAssetManagerUI();
    
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
        createRandomSceneBtn.addEventListener('click', async () => {
            console.log('Create random scene button clicked');
            
            // Import the entity API module
            const entityApi = await import('./entity-api.js');
            
            // Create a mix of different entities
            const entities = [
                { type: 'box', count: 3 },
                { type: 'sphere', count: 2 },
                { type: 'cylinder', count: 2 },
                { type: 'torus', count: 2 },
                { type: 'dodecahedron', count: 1 }
            ];
            
            // Add each group of entities
            for (const entity of entities) {
                await entityApi.addMultipleEntities(entity.type, entity.count, {
                    positionOptions: {
                        minX: -5,
                        maxX: 5,
                        minY: 0,
                        maxY: 3,
                        minZ: -5,
                        maxZ: -3
                    }
                });
            }
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

/**
 * Set up scene loader buttons
 */
function setupSceneLoaderUI() {
    const uiPanel = document.getElementById('ui-panel');
    if (!uiPanel) {
        console.warn('UI panel element not found, cannot set up scene loader UI');
        return;
    }
    
    // First, remove any existing scene selectors to prevent duplicates
    const existingSelectors = document.querySelectorAll('.scene-selector, .scene-loader');
    existingSelectors.forEach(selector => {
        console.log('Removing existing scene selector', selector);
        selector.parentNode?.removeChild(selector);
    });
    
    console.log('Setting up scene loader UI');
    
    // Create scene selector elements
    const sceneLoaderContainer = document.createElement('div');
    sceneLoaderContainer.className = 'tool-item scene-loader';
    
    const sceneLoaderLabel = document.createElement('label');
    sceneLoaderLabel.htmlFor = 'scene-selector';
    sceneLoaderLabel.textContent = 'Scene:';
    
    const sceneSelector = document.createElement('select');
    sceneSelector.id = 'scene-selector';
    sceneSelector.className = 'scene-selector';
    
    // Import config to get current startup scene
    import('./config.js').then(config => {
        const STARTUP_SCENE_PATH = config.STARTUP_SCENE_PATH || 'scenes/blank-scene.json';
        
        // Import scene loader
        import('./scene-loader.js').then(sceneLoaderModule => {
            const sceneLoader = sceneLoaderModule;
            
            // Get available scenes
            sceneLoader.getAvailableScenes().then(scenes => {
                // Add options for each scene
                scenes.forEach(scene => {
                    const option = document.createElement('option');
                    option.value = scene.path;
                    option.textContent = scene.name;
                    
                    // Mark the startup scene as selected
                    if (scene.path === STARTUP_SCENE_PATH) {
                        option.selected = true;
                    }
                    
                    sceneSelector.appendChild(option);
                });
                
                console.log(`Added ${sceneSelector.options.length} scenes to selector`);
            });
            
            // Assemble the UI
            sceneLoaderContainer.appendChild(sceneLoaderLabel);
            sceneLoaderContainer.appendChild(sceneSelector);
            
            // Find the right place to insert it (before camera selector)
            const cameraSelector = uiPanel.querySelector('.camera-selector');
            if (cameraSelector && cameraSelector.parentNode) {
                // Insert before the camera selector item (the parent div)
                uiPanel.insertBefore(sceneLoaderContainer, cameraSelector.parentNode);
            } else {
                // Fallback to appending to the tool buttons section
                const toolButtons = uiPanel.querySelector('.tool-buttons');
                if (toolButtons) {
                    toolButtons.appendChild(sceneLoaderContainer);
                } else {
                    uiPanel.appendChild(sceneLoaderContainer);
                }
            }
            
            // Handle scene selection change
            sceneSelector.addEventListener('change', (e) => {
                const selectedValue = e.target.value;
                if (selectedValue) {
                    loadSelectedScene(selectedValue);
                }
            });
            
            function loadSelectedScene(selectedValue) {
                console.log(`Loading scene: ${selectedValue}`);
                
                // Load the scene using the scene loader
                console.log(`Loading scene from file: ${selectedValue}`);
                
                sceneLoader.loadScene(selectedValue)
                    .then(() => {
                        // Update Monaco editor after scene load
                        import('./monaco.js').then(monaco => {
                            if (typeof monaco.updateMonacoEditor === 'function') {
                                console.log('Updating Monaco editor after scene load');
                                monaco.updateMonacoEditor(true);
                            }
                        }).catch(err => console.error('Error importing monaco:', err));
                    })
                    .catch(err => {
                        console.error('Error loading scene:', err);
                    });
            }
        }).catch(err => {
            console.error('Error setting up scene loader UI:', err);
        });
    }).catch(err => {
        console.error('Error importing config:', err);
    });
}

/**
 * Initialize the Asset Manager UI
 * This function sets up the asset manager interface and the modal for adding/editing assets
 */
function initAssetManagerUI() {
    console.log('Initializing Asset Manager UI...');
    
    // Import the asset manager
    import('./asset-manager.js').then(({ assetManager, ASSET_TYPES }) => {
        // Initialize the asset manager
        assetManager.init();
        
        // Elements
        const addAssetBtn = document.getElementById('add-asset-btn');
        const assetList = document.getElementById('asset-list');
        const assetModal = document.getElementById('asset-modal');
        const closeModal = document.querySelector('.close-modal');
        const submitAssetBtn = document.getElementById('submit-asset');
        const assetNameInput = document.getElementById('asset-name');
        const assetTypeSelect = document.getElementById('asset-type');
        const assetSrcInput = document.getElementById('asset-src');
        const assetTagsInput = document.getElementById('asset-tags');
        const assetModalTitle = document.getElementById('asset-modal-title');
        
        let currentEditAssetId = null;
        
        // Add event listeners
        if (addAssetBtn) {
            addAssetBtn.addEventListener('click', () => openAssetModal());
        } else {
            console.error('Add asset button not found');
        }
        
        if (closeModal) {
            closeModal.addEventListener('click', () => closeAssetModal());
        }
        
        if (submitAssetBtn) {
            submitAssetBtn.addEventListener('click', () => {
                if (currentEditAssetId) {
                    updateAsset();
                } else {
                    addNewAsset();
                }
            });
        }
        
        // Initialize the asset list
        refreshAssetList();
        
        // Listen for state changes to refresh the list
        document.addEventListener('state-changed', (event) => {
            if (event.detail && event.detail.type === 'update') {
                refreshAssetList();
            }
        });
        
        /**
         * Open the asset modal for adding a new asset or editing an existing one
         * @param {String} assetId - ID of an asset to edit (optional)
         */
        function openAssetModal(assetId = null) {
            if (assetId) {
                // Editing existing asset
                const state = getState();
                const asset = state.assets[assetId];
                
                if (!asset) {
                    console.error(`Asset not found: ${assetId}`);
                    return;
                }
                
                currentEditAssetId = assetId;
                assetModalTitle.textContent = 'Edit Asset';
                submitAssetBtn.textContent = 'Update Asset';
                
                // Fill the form with asset data
                assetNameInput.value = asset.name || '';
                assetTypeSelect.value = asset.type || 'image';
                assetSrcInput.value = asset.src || '';
                assetTagsInput.value = asset.tags ? asset.tags.join(', ') : '';
            } else {
                // Adding new asset
                currentEditAssetId = null;
                assetModalTitle.textContent = 'Add New Asset';
                submitAssetBtn.textContent = 'Add Asset';
                
                // Clear the form
                assetNameInput.value = '';
                assetTypeSelect.value = 'image';
                assetSrcInput.value = '';
                assetTagsInput.value = '';
            }
            
            // Show the modal
            assetModal.style.display = 'flex';
        }
        
        /**
         * Close the asset modal
         */
        function closeAssetModal() {
            assetModal.style.display = 'none';
            currentEditAssetId = null;
        }
        
        /**
         * Add a new asset
         */
        function addNewAsset() {
            const name = assetNameInput.value.trim();
            const type = assetTypeSelect.value;
            const src = assetSrcInput.value.trim();
            const tags = assetTagsInput.value.split(',').map(tag => tag.trim()).filter(Boolean);
            
            if (!src) {
                console.error('Asset source is required');
                return;
            }
            
            // Register the asset
            assetManager.registerAsset(type, src, {
                name,
                tags
            });
            
            // Close the modal
            closeAssetModal();
            
            // Refresh the asset list
            refreshAssetList();
        }
        
        /**
         * Update an existing asset
         */
        function updateAsset() {
            if (!currentEditAssetId) return;
            
            const name = assetNameInput.value.trim();
            const type = assetTypeSelect.value;
            const src = assetSrcInput.value.trim();
            const tags = assetTagsInput.value.split(',').map(tag => tag.trim()).filter(Boolean);
            
            if (!src) {
                console.error('Asset source is required');
                return;
            }
            
            // Get the current state
            const state = getState();
            const currentAsset = state.assets[currentEditAssetId];
            
            // Update the asset
            assetManager._updateAssetState(currentEditAssetId, {
                name,
                type,
                src,
                tags
            });
            
            // Close the modal
            closeAssetModal();
            
            // Refresh the asset list
            refreshAssetList();
        }
        
        /**
         * Delete an asset
         * @param {String} assetId - ID of the asset to delete
         */
        function deleteAsset(assetId) {
            // Get the current state
            const state = getState();
            
            // Make a copy of the assets without the one we're deleting
            const newAssets = { ...state.assets };
            delete newAssets[assetId];
            
            // Unload the asset if it's loaded
            if (assetManager.isAssetLoaded(assetId)) {
                assetManager.unloadAsset(assetId);
            }
            
            // Update the state
            setState({ assets: newAssets }, 'asset-delete');
            
            // Refresh the list
            refreshAssetList();
        }
        
        /**
         * Refresh the asset list display
         */
        function refreshAssetList() {
            // Get all assets from state
            const state = getState();
            const assets = state.assets || {};
            
            // Clear the current list
            assetList.innerHTML = '';
            
            // If no assets, show the empty message
            if (Object.keys(assets).length === 0) {
                assetList.innerHTML = '<div class="no-assets">No assets found. Add an asset to get started.</div>';
                return;
            }
            
            // Add each asset to the list
            for (const [id, asset] of Object.entries(assets)) {
                // Create asset item
                const assetItem = document.createElement('div');
                assetItem.className = 'asset-item';
                
                // Create preview
                const preview = document.createElement('div');
                preview.className = 'asset-preview';
                
                // Add preview content based on type
                if (asset.type === 'image' && asset.src) {
                    const img = document.createElement('img');
                    img.src = asset.src;
                    preview.appendChild(img);
                } else {
                    // Add icon based on type
                    const icon = document.createElement('i');
                    icon.className = getAssetTypeIcon(asset.type);
                    preview.appendChild(icon);
                }
                
                // Create info section
                const info = document.createElement('div');
                info.className = 'asset-info';
                
                const name = document.createElement('div');
                name.className = 'asset-name';
                name.textContent = asset.name || id;
                
                const type = document.createElement('div');
                type.className = 'asset-type';
                type.textContent = asset.type;
                
                info.appendChild(name);
                info.appendChild(type);
                
                // Create actions
                const actions = document.createElement('div');
                actions.className = 'asset-actions';
                
                const editBtn = document.createElement('button');
                editBtn.className = 'asset-edit-btn';
                editBtn.innerHTML = '<i class="fas fa-edit"></i>';
                editBtn.title = 'Edit';
                editBtn.addEventListener('click', () => openAssetModal(id));
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'asset-delete-btn';
                deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
                deleteBtn.title = 'Delete';
                deleteBtn.addEventListener('click', () => {
                    if (confirm(`Are you sure you want to delete this asset?`)) {
                        deleteAsset(id);
                    }
                });
                
                actions.appendChild(editBtn);
                actions.appendChild(deleteBtn);
                
                // Assemble asset item
                assetItem.appendChild(preview);
                assetItem.appendChild(info);
                assetItem.appendChild(actions);
                
                // Add to the list
                assetList.appendChild(assetItem);
            }
        }
        
        /**
         * Get an icon class for an asset type
         * @param {String} assetType - The type of asset
         * @returns {String} - Icon class
         */
        function getAssetTypeIcon(assetType) {
            const icons = {
                'image': 'fas fa-image',
                'video': 'fas fa-video',
                'audio': 'fas fa-music',
                'model': 'fas fa-cube',
                'material': 'fas fa-palette',
                'texture': 'fas fa-th'
            };
            
            return icons[assetType] || 'fas fa-file';
        }
    }).catch(err => {
        console.error('Error initializing asset manager UI:', err);
    });
} 