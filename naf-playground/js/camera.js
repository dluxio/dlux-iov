/**
 * Camera.js - Camera management and builder camera logic
 */

import { getState, setState } from './state.js';
import { updateCameraSelect } from './ui.js';
import { logAction } from './debug.js';

// DOM elements
let cameraPositionEl;
let activeCameraEl;
let cameraStateSavedEl;

// The builder camera element
let builderCamera;

// Current active camera
let activeCamera = 'builder-camera';

// Camera update interval
let cameraUpdateInterval;

// Debounce function for saving camera position
let saveCameraPositionTimeout;
let saveCameraPending = false;

/**
 * Initialize the camera manager
 */
export function initCameraManager() {
    console.log('Initializing camera manager...');
    
    // Get DOM elements
    cameraPositionEl = document.getElementById('camera-position');
    activeCameraEl = document.getElementById('active-camera');
    cameraStateSavedEl = document.getElementById('camera-state-saved');
    
    // Get builder camera
    builderCamera = document.getElementById('builder-camera');
    
    // Ensure builder camera exists
    if (!builderCamera) {
        console.error('Builder camera not found, creating it');
        createBuilderCamera();
    }
    
    // Make sure builder camera is active
    activeCamera = 'builder-camera';
    
    // Update camera info in debug panel
    updateCameraInfo();
    
    // Start camera updates
    startCameraUpdates();
    
    // Restore camera position from state
    restoreCameraPosition();
    
    // Setup mutation observer to detect camera changes
    setupMutationObserver();
    
    console.log('Camera manager initialized');
    return Promise.resolve();
}

// Add alias for backward compatibility
export const initCamera = initCameraManager;

/**
 * Create the builder camera if it doesn't exist
 */
function createBuilderCamera() {
    console.log('Creating builder camera...');
    
    const scene = document.querySelector('a-scene');
    if (!scene) {
        console.error('No A-Frame scene found for creating builder camera');
        return;
    }
    
    let camera = document.getElementById('builder-camera');
    if (camera) {
        console.log('Builder camera already exists');
        return;
    }
    
    // Create camera entity
    camera = document.createElement('a-entity');
    camera.id = 'builder-camera';
    camera.setAttribute('camera', '');
    camera.setAttribute('position', '0 1.6 3');
    camera.setAttribute('look-controls', '');
    camera.setAttribute('wasd-controls', '');
    
    // Add cursor for interaction
    const cursor = document.createElement('a-cursor');
    camera.appendChild(cursor);
    
    // Add to scene - use rAF to ensure scene is ready
    if (scene.hasLoaded) {
        scene.appendChild(camera);
        console.log('Builder camera added to scene');
    } else {
        // Wait for scene to load
        scene.addEventListener('loaded', () => {
            scene.appendChild(camera);
            console.log('Builder camera added to scene (after load)');
        });
    }
}

/**
 * Start periodic updates of camera position
 */
function startCameraUpdates() {
    // Clear any existing interval
    if (cameraUpdateInterval) {
        clearInterval(cameraUpdateInterval);
    }
    
    // Update camera position every 200ms
    cameraUpdateInterval = setInterval(() => {
        updateCameraInfo();
    }, 200);
}

/**
 * Update camera information in the debug panel
 */
function updateCameraInfo() {
    // Get current camera
    const camera = document.getElementById(activeCamera);
    if (!camera) {
        console.error(`Active camera ${activeCamera} not found`);
        return;
    }
    
    // Get position
    const position = camera.getAttribute('position');
    
    // Format position for display
    const formattedPosition = `${position.x.toFixed(2)} ${position.y.toFixed(2)} ${position.z.toFixed(2)}`;
    
    // Update debug panel
    cameraPositionEl.textContent = formattedPosition;
    activeCameraEl.textContent = activeCamera;
    
    // Compare with saved position in state
    const state = getState();
    const savedPosition = state.camera.position;
    
    // Check if position has changed
    const positionChanged = 
        Math.abs(position.x - savedPosition.x) > 0.01 ||
        Math.abs(position.y - savedPosition.y) > 0.01 ||
        Math.abs(position.z - savedPosition.z) > 0.01;
    
    // Update saved status
    if (positionChanged) {
        cameraStateSavedEl.textContent = 'Unsaved';
        cameraStateSavedEl.className = 'status-error';
    } else {
        cameraStateSavedEl.textContent = 'Saved';
        cameraStateSavedEl.className = 'status-saved';
    }
    
    // If it's the builder camera and position changed, maybe save it
    // Don't save on every frame to avoid performance issues
    if (activeCamera === 'builder-camera' && positionChanged) {
        // Use a debounce to avoid saving too frequently
        saveCameraPositionDebounced();
    }
}

function saveCameraPositionDebounced() {
    if (saveCameraPositionTimeout) {
        clearTimeout(saveCameraPositionTimeout);
    }
    
    // Use setTimeout with a short delay for debouncing (this is appropriate usage)
    saveCameraPositionTimeout = setTimeout(() => {
        saveCameraPosition();
    }, 500); // Wait 500ms after last movement - this is a debounce, not an arbitrary delay
}

/**
 * Save the current camera position to state
 */
export function saveCameraPosition() {
    // Get current camera
    const camera = document.getElementById(activeCamera);
    if (!camera) {
        console.error(`Active camera ${activeCamera} not found`);
        return;
    }
    
    // Get position and rotation
    const position = camera.getAttribute('position');
    const rotation = camera.getAttribute('rotation');
    
    // Update state
    setState({
        camera: {
            active: activeCamera,
            position: {
                x: position.x,
                y: position.y,
                z: position.z
            },
            rotation: {
                x: rotation.x,
                y: rotation.y,
                z: rotation.z
            },
            saved: true
        }
    });
    
    // Update camera info
    updateCameraInfo();
    
    logAction(`Saved camera position: ${activeCamera}`);
}

/**
 * Switch to a different camera
 * @param {string} cameraId - ID of the camera to switch to
 */
export function switchCamera(cameraId) {
    console.log(`Switching to camera: ${cameraId}`);
    
    // Save current camera position first
    saveCameraPosition();
    
    // Get the camera
    const camera = document.getElementById(cameraId);
    if (!camera) {
        console.error(`Camera with ID ${cameraId} not found`);
        return false;
    }
    
    // Get all cameras
    const cameras = document.querySelectorAll('[camera]');
    
    // Disable all cameras
    cameras.forEach(cam => {
        const cameraComponent = cam.getAttribute('camera');
        if (cameraComponent) {
            cam.setAttribute('camera', 'active', false);
        }
    });
    
    // Enable the selected camera
    camera.setAttribute('camera', 'active', true);
    
    // Update active camera
    activeCamera = cameraId;
    
    // Update state with active camera
    setState({
        camera: {
            active: activeCamera
        }
    });
    
    // Update camera info
    updateCameraInfo();
    
    logAction(`Switched to camera: ${cameraId}`);
    
    return true;
}

/**
 * Update the list of cameras in the scene
 */
function updateCameraList() {
    // Find all cameras in the scene
    const cameras = Array.from(document.querySelectorAll('[camera]')).map(cam => cam.id);
    
    // Make sure builder camera is always available
    if (!cameras.includes('builder-camera')) {
        cameras.push('builder-camera');
    }
    
    // Update the camera select dropdown
    updateCameraSelect(cameras, activeCamera);
    
    return cameras;
}

/**
 * Setup a mutation observer to detect camera additions/removals
 */
function setupMutationObserver() {
    // Create a mutation observer
    const observer = new MutationObserver((mutations) => {
        let needsUpdate = false;
        
        mutations.forEach(mutation => {
            // If nodes were added or removed
            if (mutation.addedNodes.length || mutation.removedNodes.length) {
                needsUpdate = true;
                
                // Check for builder camera removal
                for (let i = 0; i < mutation.removedNodes.length; i++) {
                    const node = mutation.removedNodes[i];
                    if (node.id === 'builder-camera') {
                        console.warn('Builder camera was removed, restoring it');
                        setTimeout(createBuilderCamera, 0);
                        
                        // Make sure it's the active camera
                        setTimeout(() => {
                            switchCamera('builder-camera');
                        }, 10);
                    }
                }
            }
        });
        
        if (needsUpdate) {
            // Update camera list if needed
            updateCameraList();
        }
    });
    
    // Observe the scene for changes
    const scene = document.querySelector('a-scene');
    observer.observe(scene, { childList: true, subtree: true });
}

/**
 * Restore camera position from state
 */
export function restoreCameraPosition() {
    const state = getState();
    const cameraData = state.camera;
    
    // Get the camera
    const camera = document.getElementById(cameraData.active);
    if (!camera) {
        console.error(`Camera with ID ${cameraData.active} not found`);
        return false;
    }
    
    // Set position and rotation
    camera.setAttribute('position', `${cameraData.position.x} ${cameraData.position.y} ${cameraData.position.z}`);
    camera.setAttribute('rotation', `${cameraData.rotation.x} ${cameraData.rotation.y} ${cameraData.rotation.z}`);
    
    // Switch to this camera
    switchCamera(cameraData.active);
    
    logAction(`Restored camera position: ${cameraData.active}`);
    
    return true;
}

// Export camera utility functions
export { updateCameraInfo, updateCameraList }; 