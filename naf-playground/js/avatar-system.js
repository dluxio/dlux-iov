import { RIG_CONFIG, vectorToString } from './config.js';
import { getState, setState } from './state.js';
import engineManager from './engine-manager.js';

/**
 * Avatar System - Handles networked avatars and camera synchronization
 */
class AvatarSystem {
    constructor() {
        this.scene = null;
        this.localAvatar = null;
        this.remoteAvatars = new Map();
        this.isInitialized = false;
    }

    /**
     * Initialize the avatar system
     * @param {HTMLElement} scene - The A-Frame scene element
     */
    init(scene) {
        this.scene = scene;
        this.setupLocalAvatar();
        this.setupNetworkHandlers();
        this.isInitialized = true;
    }

    /**
     * Setup the local avatar
     */
    setupLocalAvatar() {
        // Wait for both scene loading and network connection
        const waitForInitialization = () => {
            return new Promise((resolve) => {
                const checkInit = () => {
                    const sceneLoaded = this.scene.hasLoaded;
                    const networked = this.scene.components['networked-scene'];
                    const networkConnected = networked && networked.data.connectOnLoad === false ? true : networked.hasConnected;
                    
                    if (sceneLoaded && networkConnected) {
                        resolve();
                    } else {
                        console.log('Waiting for initialization...', { sceneLoaded, networkConnected });
                        setTimeout(checkInit, 100);
                    }
                };
                checkInit();
            });
        };

        // Initialize avatar once everything is ready
        waitForInitialization().then(() => {
            console.log('Scene and network initialized, setting up avatar...');
            
            // Get the avatar rig entity (this will be created after the template is attached)
            const avatarRig = this.scene.querySelector('#avatar-rig');
            if (avatarRig) {
                console.log('Found avatar-rig entity:', avatarRig);
                console.log('Current avatar-rig position:', avatarRig.getAttribute('position'));

                // Store reference to local avatar
                this.localAvatar = avatarRig;
                
                // Get position from engine config if available, fall back to RIG_CONFIG
                let rigPosition;
                if (engineManager.initialized && engineManager.config?.avatar?.spawn?.position) {
                    rigPosition = engineManager.config.avatar.spawn.position;
                    console.log('Using engine config for avatar position:', rigPosition);
                } else {
                    rigPosition = RIG_CONFIG.spawn || { x: 0, y: 0, z: 3 };
                    console.log('Using default RIG_CONFIG for avatar position:', rigPosition);
                }
                
                // Set avatar position based on config
                avatarRig.setAttribute('position', vectorToString(rigPosition));
                
                // Get camera and ensure it's at the correct height
                const camera = avatarRig.querySelector('#avatar-camera');
                if (camera) {
                    // Determine camera height from config
                    let cameraHeight;
                    if (engineManager.initialized && engineManager.config?.avatar?.template?.children) {
                        // Try to find camera height in engine config
                        const cameraConfig = engineManager.config.avatar.template.children.find(
                            child => child.id === 'avatar-camera'
                        );
                        if (cameraConfig && cameraConfig.position && cameraConfig.position.y !== undefined) {
                            cameraHeight = cameraConfig.position.y;
                            console.log('Using engine config for camera height:', cameraHeight);
                        } else {
                            cameraHeight = RIG_CONFIG.height || 1.6;
                            console.log('Falling back to RIG_CONFIG for camera height:', cameraHeight);
                        }
                    } else {
                        cameraHeight = RIG_CONFIG.height || 1.6;
                        console.log('Using default height for camera:', cameraHeight);
                    }
                    
                    const cameraPosition = { x: 0, y: cameraHeight, z: 0 };
                    console.log(`Setting camera position to height ${cameraHeight}`, cameraPosition);
                    camera.setAttribute('position', vectorToString(cameraPosition));
                    
                    // Ensure camera controls are active
                    camera.setAttribute('camera', 'active', true);
                    camera.setAttribute('look-controls', 'enabled', true);
                    camera.setAttribute('wasd-controls', 'enabled', true);
                } else {
                    console.warn('Camera not found in avatar rig');
                }

                // Setup camera sync
                this.setupCameraSync(avatarRig);
            } else {
                console.error('Avatar rig entity not found in scene');
                // Try to find it again after a short delay in case the template hasn't been attached yet
                setTimeout(() => {
                    const retryAvatarRig = this.scene.querySelector('#avatar-rig');
                    if (retryAvatarRig) {
                        console.log('Found avatar rig on retry:', retryAvatarRig);
                        console.log('Current avatar-rig position:', retryAvatarRig.getAttribute('position'));
                        
                        this.localAvatar = retryAvatarRig;
                        
                        // Get position from engine config if available, fall back to RIG_CONFIG
                        let rigPosition;
                        if (engineManager.initialized && engineManager.config?.avatar?.spawn?.position) {
                            rigPosition = engineManager.config.avatar.spawn.position;
                            console.log('Using engine config for avatar position on retry:', rigPosition);
                        } else {
                            rigPosition = RIG_CONFIG.spawn || { x: 0, y: 0, z: 3 };
                            console.log('Using default RIG_CONFIG for avatar position on retry:', rigPosition);
                        }
                        
                        // Set avatar position based on config
                        retryAvatarRig.setAttribute('position', vectorToString(rigPosition));
                        
                        // Get camera and ensure it's at the correct height
                        const camera = retryAvatarRig.querySelector('#avatar-camera');
                        if (camera) {
                            // Determine camera height from config
                            let cameraHeight;
                            if (engineManager.initialized && engineManager.config?.avatar?.template?.children) {
                                // Try to find camera height in engine config
                                const cameraConfig = engineManager.config.avatar.template.children.find(
                                    child => child.id === 'avatar-camera'
                                );
                                if (cameraConfig && cameraConfig.position && cameraConfig.position.y !== undefined) {
                                    cameraHeight = cameraConfig.position.y;
                                    console.log('Using engine config for camera height on retry:', cameraHeight);
                                } else {
                                    cameraHeight = RIG_CONFIG.height || 1.6;
                                    console.log('Falling back to RIG_CONFIG for camera height on retry:', cameraHeight);
                                }
                            } else {
                                cameraHeight = RIG_CONFIG.height || 1.6;
                                console.log('Using default height for camera on retry:', cameraHeight);
                            }
                            
                            const cameraPosition = { x: 0, y: cameraHeight, z: 0 };
                            console.log(`Setting camera position to height ${cameraHeight} on retry`, cameraPosition);
                            camera.setAttribute('position', vectorToString(cameraPosition));
                            
                            // Ensure camera controls are active
                            camera.setAttribute('camera', 'active', true);
                            camera.setAttribute('look-controls', 'enabled', true);
                            camera.setAttribute('wasd-controls', 'enabled', true);
                        } else {
                            console.warn('Camera not found in avatar rig on retry');
                        }
                        
                        this.setupCameraSync(retryAvatarRig);
                    } else {
                        console.error('Avatar rig still not found after retry');
                    }
                }, 1000);
            }
        });
    }

    /**
     * Setup camera synchronization
     * @param {HTMLElement} avatarRig - The avatar rig entity
     */
    setupCameraSync(avatarRig) {
        const camera = avatarRig.querySelector('#avatar-camera');
        if (!camera) {
            console.error('Camera not found in avatar rig');
            return;
        }

        // Set initial position from engine config
        let rigPosition;
        if (engineManager.initialized && engineManager.config?.avatar?.spawn?.position) {
            rigPosition = engineManager.config.avatar.spawn.position;
        } else {
            rigPosition = RIG_CONFIG.spawn;
        }
        avatarRig.setAttribute('position', vectorToString(rigPosition));

        // Add event listeners for camera movement
        camera.addEventListener('componentchanged', (event) => {
            if (event.detail.name === 'position') {
                this.updateAvatarPosition(avatarRig, event.detail.newData);
            }
        });
    }

    /**
     * Update avatar position
     * @param {HTMLElement} avatarRig - The avatar rig entity
     * @param {Object} position - New position
     */
    updateAvatarPosition(avatarRig, position) {
        if (!avatarRig || !position) return;

        // Update position on the rig
        avatarRig.setAttribute('position', vectorToString(position));

        // Update state if available
        try {
            const state = getState();
            if (state && state.avatar) {
                state.avatar.position = { ...position };
                setState(state);
            }
        } catch (error) {
            console.warn('Could not update avatar position in state:', error);
        }
    }

    /**
     * Setup network event handlers
     */
    setupNetworkHandlers() {
        // Handle remote avatar updates
        this.scene.addEventListener('entityCreated', (event) => {
            const entity = event.detail.entity;
            if (entity && entity.id && entity.id.startsWith('avatar-')) {
                this.remoteAvatars.set(entity.id, entity);
                console.log('Remote avatar created:', entity.id);
            }
        });

        // Handle remote avatar removal
        this.scene.addEventListener('entityRemoved', (event) => {
            const entityId = event.detail.entityId;
            if (entityId && entityId.startsWith('avatar-')) {
                this.remoteAvatars.delete(entityId);
                console.log('Remote avatar removed:', entityId);
            }
        });
    }
}

// Create and export a single instance
const avatarSystem = new AvatarSystem();
export default avatarSystem; 