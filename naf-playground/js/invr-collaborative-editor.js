/**
 * InVR Collaborative Editor
 * Real-time collaborative A-Frame scene editing with YDoc
 */

export class InVRCollaborativeEditor {
    constructor() {
        this.doc = null;
        this.provider = null;
        this.sceneEntities = null;
        this.selectedEntity = null;
        this.userInfo = null;
        this.roomId = null;
        
        this.scene = null;
        this.sceneContent = null;
        this.inspector = null;
        this.activityFeed = null;
        
        this.localEntities = new Map();
        this.connectedUsers = new Map();
    }

    async initialize() {
        console.log('[InVR] Initializing...');
        
        this.initializeDOMElements();
        this.roomId = this.getRoomId();
        await this.initializeWallet();
        await this.initializeCollaboration();
        this.initializeSceneInteractions();
        this.initializeUIHandlers();
        
        console.log('[InVR] Ready');
    }

    initializeDOMElements() {
        this.scene = document.getElementById('invr-scene');
        this.sceneContent = document.getElementById('scene-content');
        this.inspector = document.getElementById('entity-inspector');
        this.activityFeed = document.getElementById('activity-feed');
    }

    getRoomId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('room') || `invr-${Date.now()}`;
    }

    async initializeWallet() {
        try {
            const userData = await window.dluxWallet?.getCurrentUser();
            this.userInfo = userData?.user ? {
                name: userData.user,
                isAuthenticated: true
            } : {
                name: `Guest-${Math.random().toString(36).substr(2, 6)}`,
                isAuthenticated: false
            };
        } catch (error) {
            this.userInfo = {
                name: `Guest-${Math.random().toString(36).substr(2, 6)}`,
                isAuthenticated: false
            };
        }
    }

    async initializeCollaboration() {
        this.doc = new Y.Doc();
        this.sceneEntities = this.doc.getMap('entities');
        
        const wsUrl = 'wss://presence.dlux.io/api/collab/invr';
        this.provider = new Y.WebsocketProvider(wsUrl, this.roomId, this.doc);
        
        this.sceneEntities.observe((event) => {
            event.changes.keys.forEach((change, key) => {
                const entityData = this.sceneEntities.get(key);
                if (change.action === 'add' || change.action === 'update') {
                    this.createOrUpdateEntity(key, entityData);
                } else if (change.action === 'delete') {
                    this.removeEntity(key);
                }
            });
        });
    }

    initializeSceneInteractions() {
        this.loadExistingEntities();
    }

    initializeUIHandlers() {
        document.querySelectorAll('.entity-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.createEntity(e.target.dataset.type);
            });
        });
    }

    createEntity(type) {
        const entityId = `entity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const entityData = this.getDefaultEntityData(type);
        entityData.id = entityId;
        entityData.createdBy = this.userInfo.name;
        
        this.sceneEntities.set(entityId, entityData);
        this.addActivity(`➕ Created ${type}`);
        
        return entityId;
    }

    getDefaultEntityData(type) {
        const defaults = {
            box: {
                type: 'box',
                position: { x: 0, y: 1, z: -2 },
                geometry: { primitive: 'box' },
                material: { color: '#4CC3D9' }
            },
            sphere: {
                type: 'sphere',
                position: { x: 0, y: 1, z: -2 },
                geometry: { primitive: 'sphere', radius: 0.5 },
                material: { color: '#EF2D5E' }
            }
        };
        return defaults[type] || defaults.box;
    }

    createOrUpdateEntity(entityId, entityData) {
        let entity = document.getElementById(entityId);
        
        if (!entity) {
            entity = document.createElement('a-entity');
            entity.id = entityId;
            entity.classList.add('collab-entity');
            this.sceneContent.appendChild(entity);
        }
        
        this.updateEntityAttributes(entity, entityData);
    }

    updateEntityAttributes(entity, entityData) {
        if (entityData.position) {
            entity.setAttribute('position', 
                `${entityData.position.x} ${entityData.position.y} ${entityData.position.z}`);
        }
        if (entityData.geometry) {
            entity.setAttribute('geometry', entityData.geometry);
        }
        if (entityData.material) {
            entity.setAttribute('material', entityData.material);
        }
    }

    removeEntity(entityId) {
        const entity = document.getElementById(entityId);
        if (entity) {
            entity.remove();
        }
    }

    loadExistingEntities() {
        this.sceneEntities.forEach((entityData, entityId) => {
            this.createOrUpdateEntity(entityId, entityData);
        });
    }

    addActivity(message) {
        const activity = document.createElement('div');
        activity.className = 'activity-item';
        activity.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
        this.activityFeed.insertBefore(activity, this.activityFeed.firstChild);
        
        const activities = this.activityFeed.querySelectorAll('.activity-item');
        if (activities.length > 10) {
            activities[activities.length - 1].remove();
        }
    }
} 