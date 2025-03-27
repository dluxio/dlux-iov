import { RIG_CONFIG, vectorToString } from './config.js';
import { getState, setState } from './state.js';

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
            console.log('RIG_CONFIG:', JSON.stringify(RIG_CONFIG, null, 2));

            // Get the avatar rig entity (this will be created after the template is attached)
            const avatarRig = this.scene.querySelector('#avatar-rig');
            if (avatarRig) {
                console.log('Found avatar-rig entity:', avatarRig);
                console.log('Current avatar-rig position:', avatarRig.getAttribute('position'));

                // Store reference to local avatar
                this.localAvatar = avatarRig;

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

        // Set initial position
        avatarRig.setAttribute('position', vectorToString(RIG_CONFIG.spawn));

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