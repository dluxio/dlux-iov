/**
 * InVR VR Collaborative Editor
 * 
 * Full VR experience with:
 * - WebXR support for VR headsets
 * - Networked A-Frame for VR avatars and presence
 * - Spatial audio for communication
 * - Hand tracking for entity manipulation
 * - Integration with DLUX VR presence system
 * - YDoc for real-time collaboration
 */

export class InVRCollaborativeVREditor {
    constructor() {
        this.roomId = null;
        this.doc = null;
        this.provider = null;
        this.awareness = null;
        
        // VR State
        this.inVR = false;
        this.vrDisplay = null;
        this.vrSession = null;
        this.spatialAudio = null;
        
        // User & Presence
        this.currentUser = null;
        this.connectedUsers = new Map();
        this.userCursors = new Map();
        
        // Scene & Entities
        this.scene = null;
        this.sceneEntities = null; // YDoc Map
        this.selectedEntity = null;
        this.transformMode = 'move'; // move, rotate, scale
        
        // Hand Tracking
        this.leftHand = null;
        this.rightHand = null;
        this.handMenuVisible = false;
        this.grabbedEntity = null;
        
        // Audio
        this.audioContext = null;
        this.voiceChat = null;
        this.isMuted = false;
        
        // DLUX Integration
        this.dluxWallet = null;
        this.vrSpaceSession = null;
        
        // UI Elements
        this.ui = {
            entryPanel: null,
            statusPanel: null,
            userList: null,
            desktopControls: null
        };
        
        // Activity tracking
        this.activityFeed = [];
        this.maxActivityItems = 50;
        
        // Performance monitoring
        this.frameRate = 0;
        this.lastFrameTime = 0;
        
        console.log('[InVR VR] Editor instance created');
    }

    async initialize() {
        console.log('[InVR VR] Initializing VR collaborative editor...');
        
        try {
            // Initialize UI references
            this.initializeUI();
            
            // Get room ID from URL or generate one
            this.roomId = this.getRoomId();
            
            // Initialize DLUX Wallet for secure communication
            await this.initializeDluxWallet();
            
            // Initialize A-Frame scene
            await this.initializeScene();
            
            // Initialize collaboration (YDoc)
            await this.initializeCollaboration();
            
            // Initialize VR presence system
            await this.initializeVRPresence();
            
            // Initialize hand tracking and controls
            this.initializeHandTracking();
            
            // Initialize spatial audio
            await this.initializeSpatialAudio();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Start monitoring and updates
            this.startUpdateLoop();
            
            console.log('[InVR VR] Editor initialized successfully');
            this.updateUI();
            
        } catch (error) {
            console.error('[InVR VR] Initialization failed:', error);
            throw error;
        }
    }

    initializeUI() {
        this.ui.entryPanel = document.getElementById('vr-entry-panel');
        this.ui.statusPanel = document.getElementById('vr-status-panel');
        this.ui.userList = document.getElementById('vr-user-list');
        this.ui.desktopControls = document.getElementById('desktop-controls');
        
        // Update room display
        document.getElementById('current-room').textContent = this.roomId || 'Generating...';
    }

    getRoomId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('room') || 
               urlParams.get('invite') || 
               `invr-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    }

    async initializeDluxWallet() {
        try {
            this.dluxWallet = window.dluxWallet;
            if (!this.dluxWallet) {
                throw new Error('DLUX Wallet not available');
            }
            
            // Get current user
            const userData = await this.dluxWallet.getCurrentUser();
            this.currentUser = {
                id: userData?.user || `guest-${Math.random().toString(36).substr(2, 8)}`,
                name: userData?.user || 'Guest User',
                isGuest: !userData?.user,
                avatar: this.generateAvatarColor(userData?.user || 'guest')
            };
            
            this.updateConnectionStatus('wallet', 'connected');
            console.log('[InVR VR] DLUX Wallet initialized:', this.currentUser);
            
        } catch (error) {
            console.warn('[InVR VR] DLUX Wallet failed, using guest mode:', error);
            this.currentUser = {
                id: `guest-${Math.random().toString(36).substr(2, 8)}`,
                name: 'Guest User',
                isGuest: true,
                avatar: '#00ff88'
            };
        }
    }

    async initializeScene() {
        this.scene = document.getElementById('invr-vr-scene');
        if (!this.scene) {
            throw new Error('A-Frame scene not found');
        }
        
        // Wait for A-Frame to be ready
        if (this.scene.hasLoaded) {
            await this.onSceneLoaded();
        } else {
            this.scene.addEventListener('loaded', () => this.onSceneLoaded());
        }
    }

    async onSceneLoaded() {
        console.log('[InVR VR] A-Frame scene loaded');
        
        // Get references to important entities
        this.leftHand = document.getElementById('left-hand');
        this.rightHand = document.getElementById('right-hand');
        
        // Set up VR session handlers
        this.scene.addEventListener('enter-vr', () => this.onEnterVR());
        this.scene.addEventListener('exit-vr', () => this.onExitVR());
        
        // Set up hand menu interactions
        this.setupHandMenus();
        
        this.updateConnectionStatus('scene', 'connected');
    }

    async initializeCollaboration() {
        try {
            // Initialize YDoc
            this.doc = new Y.Doc();
            
            // Create shared maps for different data types
            this.sceneEntities = this.doc.getMap('entities');
            this.userPresence = this.doc.getMap('presence');
            
            // Initialize WebSocket provider for real-time sync
            const wsUrl = `wss://presence.dlux.io/api/collab/invr?room=${this.roomId}`;
            this.provider = new Y.WebsocketProvider(wsUrl, `invr-${this.roomId}`, this.doc);
            
            // Initialize awareness for user presence
            this.awareness = this.provider.awareness;
            
            // Set local user state
            this.awareness.setLocalState({
                user: this.currentUser,
                cursor: { x: 0, y: 0, z: 0 },
                hand_positions: { left: null, right: null },
                in_vr: false,
                timestamp: Date.now()
            });
            
            // Listen for changes
            this.sceneEntities.observe(this.onEntitiesChanged.bind(this));
            this.awareness.on('change', this.onPresenceChanged.bind(this));
            
            // Connection events
            this.provider.on('status', (event) => {
                console.log('[InVR VR] Collaboration status:', event.status);
                this.updateConnectionStatus('collaboration', event.status === 'connected' ? 'connected' : 'connecting');
            });
            
            this.addActivity(`🚀 Joined room: ${this.roomId}`);
            
        } catch (error) {
            console.error('[InVR VR] Collaboration initialization failed:', error);
            this.updateConnectionStatus('collaboration', 'disconnected');
            throw error;
        }
    }

    async initializeVRPresence() {
        try {
            // Join VR space using DLUX presence system
            if (this.dluxWallet) {
                this.vrSpaceSession = await this.dluxWallet.joinVRSpace('document', this.roomId, {
                    subspace: 'main',
                    voice_enabled: true
                });
                
                console.log('[InVR VR] VR presence session created:', this.vrSpaceSession);
            }
            
            // Initialize NAF (Networked A-Frame)
            if (typeof NAF !== 'undefined') {
                // Configure NAF schemas
                NAF.schemas.add({
                    template: '#avatar-template',
                    components: [
                        'position',
                        'rotation',
                        {
                            component: 'material',
                            property: 'color'
                        }
                    ]
                });
                
                NAF.schemas.add({
                    template: '#entity-box-template',
                    components: [
                        'position',
                        'rotation',
                        'scale',
                        {
                            component: 'material',
                            property: 'color'
                        }
                    ]
                });
                
                // Connect to NAF
                await this.connectToNAF();
            }
            
            this.updateConnectionStatus('presence', 'connected');
            
        } catch (error) {
            console.warn('[InVR VR] VR presence initialization failed:', error);
            this.updateConnectionStatus('presence', 'disconnected');
        }
    }

    async connectToNAF() {
        return new Promise((resolve, reject) => {
            const scene = this.scene;
            
            // Update NAF room name
            const nafScene = scene.getAttribute('networked-scene');
            nafScene.room = `invr-${this.roomId}`;
            scene.setAttribute('networked-scene', nafScene);
            
            // NAF connection events
            scene.addEventListener('connected', () => {
                console.log('[InVR VR] NAF connected');
                resolve();
            });
            
            scene.addEventListener('clientConnected', (event) => {
                console.log('[InVR VR] NAF client connected:', event.detail.clientId);
                this.onUserJoined(event.detail.clientId);
            });
            
            scene.addEventListener('clientDisconnected', (event) => {
                console.log('[InVR VR] NAF client disconnected:', event.detail.clientId);
                this.onUserLeft(event.detail.clientId);
            });
            
            // Connect to NAF
            if (typeof NAF !== 'undefined' && NAF.connection) {
                NAF.connection.connect();
            }
            
            // Timeout after 10 seconds
            setTimeout(() => {
                if (!scene.is('connected')) {
                    console.warn('[InVR VR] NAF connection timeout, continuing without networking');
                    resolve();
                }
            }, 10000);
        });
    }

    initializeHandTracking() {
        // Set up hand controller event listeners
        if (this.leftHand) {
            this.leftHand.addEventListener('triggerdown', (e) => this.onHandTrigger('left', true));
            this.leftHand.addEventListener('triggerup', (e) => this.onHandTrigger('left', false));
            this.leftHand.addEventListener('gripdown', (e) => this.onHandGrip('left', true));
            this.leftHand.addEventListener('gripup', (e) => this.onHandGrip('left', false));
            this.leftHand.addEventListener('menudown', (e) => this.toggleHandMenu('left'));
        }
        
        if (this.rightHand) {
            this.rightHand.addEventListener('triggerdown', (e) => this.onHandTrigger('right', true));
            this.rightHand.addEventListener('triggerup', (e) => this.onHandTrigger('right', false));
            this.rightHand.addEventListener('gripdown', (e) => this.onHandGrip('right', true));
            this.rightHand.addEventListener('gripup', (e) => this.onHandGrip('right', false));
            this.rightHand.addEventListener('menudown', (e) => this.toggleHandMenu('right'));
        }
        
        console.log('[InVR VR] Hand tracking initialized');
    }

    async initializeSpatialAudio() {
        try {
            // Request microphone permission
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                },
                video: false 
            });
            
            // Initialize Web Audio API
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Set up spatial audio system
            this.spatialAudio = {
                listener: this.audioContext.listener,
                sources: new Map(),
                localStream: stream
            };
            
            // Set up NAF audio
            if (typeof NAF !== 'undefined') {
                NAF.microphone.setup();
            }
            
            this.updateConnectionStatus('audio', 'connected');
            console.log('[InVR VR] Spatial audio initialized');
            
        } catch (error) {
            console.warn('[InVR VR] Spatial audio initialization failed:', error);
            this.updateConnectionStatus('audio', 'disconnected');
        }
    }

    setupEventListeners() {
        // VR Entry buttons
        document.getElementById('enter-vr-btn').addEventListener('click', () => this.enterVR());
        document.getElementById('enter-desktop-btn').addEventListener('click', () => this.enterDesktop());
        
        // Desktop controls
        document.getElementById('create-box-btn').addEventListener('click', () => this.createEntity('box'));
        document.getElementById('create-sphere-btn').addEventListener('click', () => this.createEntity('sphere'));
        document.getElementById('create-light-btn').addEventListener('click', () => this.createEntity('light'));
        document.getElementById('save-scene-btn').addEventListener('click', () => this.saveScene());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        
        // Window events
        window.addEventListener('beforeunload', () => this.cleanup());
    }

    setupHandMenus() {
        // Left hand menu (creation)
        const leftMenu = document.getElementById('left-hand-menu');
        if (leftMenu) {
            leftMenu.querySelectorAll('.hand-menu-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    const action = e.target.getAttribute('data-action');
                    this.handleHandMenuAction(action);
                });
            });
        }
        
        // Right hand menu (transformation)
        const rightMenu = document.getElementById('right-hand-menu');
        if (rightMenu) {
            rightMenu.querySelectorAll('.hand-menu-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    const action = e.target.getAttribute('data-action');
                    this.handleHandMenuAction(action);
                });
            });
        }
    }

    async enterVR() {
        try {
            if (this.scene.enterVR) {
                await this.scene.enterVR();
            } else {
                console.warn('[InVR VR] VR not supported on this device');
                this.enterDesktop();
            }
        } catch (error) {
            console.error('[InVR VR] Failed to enter VR:', error);
            this.enterDesktop();
        }
    }

    enterDesktop() {
        console.log('[InVR VR] Entering desktop mode');
        this.ui.entryPanel.style.display = 'none';
        this.ui.statusPanel.style.display = 'block';
        this.ui.userList.style.display = 'block';
        this.ui.desktopControls.style.display = 'flex';
        
        // Update awareness
        this.awareness.setLocalStateField('in_vr', false);
        this.awareness.setLocalStateField('mode', 'desktop');
    }

    onEnterVR() {
        console.log('[InVR VR] Entered VR mode');
        this.inVR = true;
        
        // Hide UI overlays
        this.ui.entryPanel.style.display = 'none';
        this.ui.statusPanel.style.display = 'none';
        this.ui.userList.style.display = 'none';
        this.ui.desktopControls.style.display = 'none';
        
        // Update awareness
        this.awareness.setLocalStateField('in_vr', true);
        this.awareness.setLocalStateField('mode', 'vr');
        
        // Show workspace grid
        const grid = document.getElementById('workspace-grid');
        if (grid) grid.setAttribute('visible', 'true');
        
        this.addActivity(`🥽 ${this.currentUser.name} entered VR`);
    }

    onExitVR() {
        console.log('[InVR VR] Exited VR mode');
        this.inVR = false;
        
        // Show desktop UI
        this.ui.statusPanel.style.display = 'block';
        this.ui.userList.style.display = 'block';
        this.ui.desktopControls.style.display = 'flex';
        
        // Update awareness
        this.awareness.setLocalStateField('in_vr', false);
        this.awareness.setLocalStateField('mode', 'desktop');
        
        this.addActivity(`🖥️ ${this.currentUser.name} switched to desktop`);
    }

    // Hand Interaction Methods
    onHandTrigger(hand, pressed) {
        if (!this.inVR) return;
        
        if (pressed) {
            // Trigger pressed - check for entity selection/manipulation
            const handEl = hand === 'left' ? this.leftHand : this.rightHand;
            const intersection = handEl.components.raycaster.getIntersection();
            
            if (intersection && intersection.el.classList.contains('grabbable')) {
                this.grabEntity(intersection.el, hand);
            }
        } else {
            // Trigger released - release grabbed entity
            if (this.grabbedEntity) {
                this.releaseEntity();
            }
        }
    }

    onHandGrip(hand, pressed) {
        if (!this.inVR) return;
        
        if (pressed) {
            // Grip pressed - scale gesture or secondary action
            console.log(`[InVR VR] ${hand} hand grip pressed`);
        }
    }

    toggleHandMenu(hand) {
        if (!this.inVR) return;
        
        const menuId = hand === 'left' ? 'left-hand-menu' : 'right-hand-menu';
        const menu = document.getElementById(menuId);
        
        if (menu) {
            const isVisible = menu.getAttribute('visible') === 'true';
            menu.setAttribute('visible', !isVisible);
            this.handMenuVisible = !isVisible;
            
            console.log(`[InVR VR] ${hand} hand menu ${!isVisible ? 'shown' : 'hidden'}`);
        }
    }

    handleHandMenuAction(action) {
        switch (action) {
            case 'create-box':
                this.createEntity('box');
                break;
            case 'create-sphere':
                this.createEntity('sphere');
                break;
            case 'create-light':
                this.createEntity('light');
                break;
            case 'delete-selected':
                this.deleteSelectedEntity();
                break;
            case 'scale-mode':
                this.transformMode = 'scale';
                break;
            case 'rotate-mode':
                this.transformMode = 'rotate';
                break;
            case 'move-mode':
                this.transformMode = 'move';
                break;
            case 'color-picker':
                this.openColorPicker();
                break;
        }
        
        // Hide hand menus after action
        this.hideHandMenus();
    }

    hideHandMenus() {
        document.getElementById('left-hand-menu').setAttribute('visible', 'false');
        document.getElementById('right-hand-menu').setAttribute('visible', 'false');
        this.handMenuVisible = false;
    }

    // Entity Management
    createEntity(type) {
        const entityId = `entity-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        
        // Get spawn position (in front of user)
        const camera = document.getElementById('vr-camera');
        const cameraPosition = camera.getAttribute('position');
        const cameraRotation = camera.getAttribute('rotation');
        
        // Calculate position in front of camera
        const distance = 2;
        const position = {
            x: cameraPosition.x + Math.sin(THREE.Math.degToRad(cameraRotation.y)) * distance,
            y: cameraPosition.y,
            z: cameraPosition.z - Math.cos(THREE.Math.degToRad(cameraRotation.y)) * distance
        };
        
        const entityData = {
            id: entityId,
            type: type,
            position: position,
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            properties: this.getDefaultProperties(type),
            creator: this.currentUser.id,
            created_at: Date.now()
        };
        
        // Add to YDoc for sync
        this.sceneEntities.set(entityId, entityData);
        
        this.addActivity(`📦 ${this.currentUser.name} created ${type}`);
        
        return entityId;
    }

    getDefaultProperties(type) {
        switch (type) {
            case 'box':
                return {
                    geometry: { primitive: 'box', width: 1, height: 1, depth: 1 },
                    material: { color: '#4CC3D9' }
                };
            case 'sphere':
                return {
                    geometry: { primitive: 'sphere', radius: 0.5 },
                    material: { color: '#EF2D5E' }
                };
            case 'light':
                return {
                    light: { type: 'point', color: '#ffffff', intensity: 1 },
                    position_offset: { x: 0, y: 2, z: 0 }
                };
            default:
                return {};
        }
    }

    grabEntity(entityEl, hand) {
        if (this.grabbedEntity) return;
        
        this.grabbedEntity = {
            element: entityEl,
            hand: hand,
            initialPosition: entityEl.getAttribute('position'),
            offset: { x: 0, y: 0, z: 0 }
        };
        
        // Visual feedback
        entityEl.setAttribute('material', 'color', '#ffff00');
        
        console.log(`[InVR VR] Grabbed entity with ${hand} hand`);
    }

    releaseEntity() {
        if (!this.grabbedEntity) return;
        
        const entityEl = this.grabbedEntity.element;
        const entityId = entityEl.getAttribute('id');
        
        // Update entity data in YDoc
        const entityData = this.sceneEntities.get(entityId);
        if (entityData) {
            entityData.position = entityEl.getAttribute('position');
            entityData.rotation = entityEl.getAttribute('rotation');
            entityData.modified_at = Date.now();
            entityData.modified_by = this.currentUser.id;
            
            this.sceneEntities.set(entityId, entityData);
        }
        
        // Reset visual feedback
        const originalColor = entityData?.properties?.material?.color || '#4CC3D9';
        entityEl.setAttribute('material', 'color', originalColor);
        
        this.grabbedEntity = null;
        console.log('[InVR VR] Released entity');
    }

    deleteSelectedEntity() {
        if (!this.selectedEntity) return;
        
        const entityId = this.selectedEntity.getAttribute('id');
        
        // Remove from YDoc
        this.sceneEntities.delete(entityId);
        
        this.addActivity(`🗑️ ${this.currentUser.name} deleted entity`);
        this.selectedEntity = null;
    }

    // Collaboration Event Handlers
    onEntitiesChanged(event) {
        event.changes.keys.forEach((change, key) => {
            if (change.action === 'add') {
                this.createEntityElement(this.sceneEntities.get(key));
            } else if (change.action === 'update') {
                this.updateEntityElement(this.sceneEntities.get(key));
            } else if (change.action === 'delete') {
                this.removeEntityElement(key);
            }
        });
    }

    createEntityElement(entityData) {
        if (!entityData) return;
        
        // Check if entity already exists
        if (document.getElementById(entityData.id)) {
            return;
        }
        
        const entity = document.createElement('a-entity');
        entity.setAttribute('id', entityData.id);
        entity.classList.add('collab-entity', 'grabbable');
        
        // Set geometry
        if (entityData.properties.geometry) {
            entity.setAttribute('geometry', entityData.properties.geometry);
        }
        
        // Set material
        if (entityData.properties.material) {
            entity.setAttribute('material', entityData.properties.material);
        }
        
        // Set light
        if (entityData.properties.light) {
            entity.setAttribute('light', entityData.properties.light);
        }
        
        // Set transform
        entity.setAttribute('position', entityData.position);
        entity.setAttribute('rotation', entityData.rotation);
        entity.setAttribute('scale', entityData.scale);
        
        // Add to scene
        const container = document.getElementById('vr-scene-content');
        container.appendChild(entity);
        
        console.log('[InVR VR] Created entity element:', entityData.id);
    }

    updateEntityElement(entityData) {
        if (!entityData) return;
        
        const entity = document.getElementById(entityData.id);
        if (!entity) return;
        
        // Update transform
        entity.setAttribute('position', entityData.position);
        entity.setAttribute('rotation', entityData.rotation);
        entity.setAttribute('scale', entityData.scale);
        
        // Update properties
        if (entityData.properties.material) {
            entity.setAttribute('material', entityData.properties.material);
        }
    }

    removeEntityElement(entityId) {
        const entity = document.getElementById(entityId);
        if (entity) {
            entity.remove();
            console.log('[InVR VR] Removed entity element:', entityId);
        }
    }

    onPresenceChanged() {
        const states = this.awareness.getStates();
        
        // Update user list
        this.connectedUsers.clear();
        states.forEach((state, clientId) => {
            if (state.user && clientId !== this.awareness.clientID) {
                this.connectedUsers.set(clientId, state.user);
            }
        });
        
        this.updateUserList();
        this.updateUserPresence();
    }

    onUserJoined(clientId) {
        console.log('[InVR VR] User joined:', clientId);
        this.addActivity(`👋 User joined the session`);
    }

    onUserLeft(clientId) {
        console.log('[InVR VR] User left:', clientId);
        this.connectedUsers.delete(clientId);
        this.updateUserList();
        this.addActivity(`👋 User left the session`);
    }

    // UI Updates
    updateConnectionStatus(component, status) {
        const statusElement = document.getElementById(`${component}-status`);
        const textElement = document.getElementById(`${component}-text`);
        
        if (statusElement) {
            statusElement.className = `status-indicator ${status}`;
        }
        
        if (textElement) {
            const statusText = {
                connected: 'Connected',
                connecting: 'Connecting...',
                disconnected: 'Disconnected'
            };
            textElement.textContent = statusText[status] || status;
        }
    }

    updateUserList() {
        const userListContent = document.getElementById('user-list-content');
        const userCount = document.getElementById('user-count');
        
        if (!userListContent || !userCount) return;
        
        const totalUsers = this.connectedUsers.size + 1; // +1 for current user
        userCount.textContent = totalUsers;
        
        userListContent.innerHTML = '';
        
        // Add current user
        const currentUserEl = this.createUserListItem(this.currentUser, true);
        userListContent.appendChild(currentUserEl);
        
        // Add connected users
        this.connectedUsers.forEach((user, clientId) => {
            const userEl = this.createUserListItem(user, false);
            userListContent.appendChild(userEl);
        });
    }

    createUserListItem(user, isCurrent) {
        const userDiv = document.createElement('div');
        userDiv.className = 'vr-user-item';
        
        const avatar = document.createElement('div');
        avatar.className = 'user-avatar-small';
        avatar.style.backgroundColor = user.avatar || '#00ff88';
        avatar.textContent = user.name.charAt(0).toUpperCase();
        
        const name = document.createElement('span');
        name.textContent = user.name + (isCurrent ? ' (You)' : '');
        
        userDiv.appendChild(avatar);
        userDiv.appendChild(name);
        
        return userDiv;
    }

    updateUserPresence() {
        // Update hand positions and presence indicators in VR
        const states = this.awareness.getStates();
        
        states.forEach((state, clientId) => {
            if (state.user && clientId !== this.awareness.clientID) {
                this.updateUserAvatar(clientId, state);
            }
        });
    }

    updateUserAvatar(clientId, state) {
        // This would update NAF networked avatars with hand positions, etc.
        // Implementation depends on specific NAF setup
    }

    addActivity(message) {
        const timestamp = new Date().toLocaleTimeString();
        this.activityFeed.unshift({
            message,
            timestamp,
            id: Date.now()
        });
        
        // Keep only recent activities
        if (this.activityFeed.length > this.maxActivityItems) {
            this.activityFeed = this.activityFeed.slice(0, this.maxActivityItems);
        }
        
        console.log(`[InVR VR Activity] ${message}`);
    }

    // Utility Methods
    generateAvatarColor(userId) {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7', '#a29bfe'];
        const hash = this.simpleHash(userId);
        return colors[hash % colors.length];
    }

    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    onKeyDown(event) {
        if (this.inVR) return; // Ignore keyboard in VR mode
        
        switch (event.key) {
            case 'b':
                this.createEntity('box');
                break;
            case 's':
                this.createEntity('sphere');
                break;
            case 'l':
                this.createEntity('light');
                break;
            case 'Delete':
                this.deleteSelectedEntity();
                break;
        }
    }

    async saveScene() {
        try {
            const sceneData = {
                entities: Object.fromEntries(this.sceneEntities.entries()),
                metadata: {
                    room_id: this.roomId,
                    saved_by: this.currentUser.id,
                    saved_at: Date.now(),
                    entity_count: this.sceneEntities.size
                }
            };
            
            // Save to localStorage as backup
            localStorage.setItem(`invr-scene-${this.roomId}`, JSON.stringify(sceneData));
            
            this.addActivity(`💾 Scene saved by ${this.currentUser.name}`);
            console.log('[InVR VR] Scene saved successfully');
            
        } catch (error) {
            console.error('[InVR VR] Failed to save scene:', error);
        }
    }

    startUpdateLoop() {
        const update = () => {
            // Update hand positions in awareness
            if (this.inVR && this.leftHand && this.rightHand) {
                this.awareness.setLocalStateField('hand_positions', {
                    left: this.leftHand.getAttribute('position'),
                    right: this.rightHand.getAttribute('position')
                });
            }
            
            // Update cursor position for desktop users
            if (!this.inVR) {
                const camera = document.getElementById('vr-camera');
                if (camera) {
                    this.awareness.setLocalStateField('cursor', camera.getAttribute('position'));
                }
            }
            
            // Continue loop
            requestAnimationFrame(update);
        };
        
        requestAnimationFrame(update);
    }

    updateUI() {
        document.getElementById('current-room').textContent = this.roomId;
    }

    cleanup() {
        console.log('[InVR VR] Cleaning up...');
        
        if (this.provider) {
            this.provider.destroy();
        }
        
        if (this.spatialAudio && this.spatialAudio.localStream) {
            this.spatialAudio.localStream.getTracks().forEach(track => track.stop());
        }
        
        if (this.vrSpaceSession && this.dluxWallet) {
            this.dluxWallet.leaveVRSpace();
        }
    }
}

console.log('[InVR VR] VR Editor class loaded'); 