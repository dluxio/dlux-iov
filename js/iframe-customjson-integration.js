/**
 * DLUX Enhanced Post Iframe Integration Pattern
 * 
 * Base class for iframe components that need to synchronize custom JSON
 * with the parent TipTap editor's Y.js collaborative document
 * 
 * Usage:
 * 1. Extend this class in your iframe component
 * 2. Override updateLocalState() to handle incoming custom JSON
 * 3. Call sendUpdate() whenever your component changes data
 * 4. The parent will handle collaborative sync via Y.js
 */
export class IframeCustomJsonIntegration {
    constructor(options = {}) {
        // Configuration
        this.iframeId = options.iframeId || this.generateUniqueId();
        this.componentType = options.componentType || 'generic-component';
        this.version = options.version || '1.0';
        this.debounceDelay = options.debounceDelay || 100; // ms
        
        // State
        this.localState = {};
        this.isConnected = false;
        this.syncDebounceTimer = null;
        this.messageQueue = [];
        
        // Bind methods
        this.handleMessage = this.handleMessage.bind(this);
        
        // Auto-connect on construction
        if (options.autoConnect !== false) {
            this.connect();
        }
    }
    
    /**
     * Connect to parent editor and register this iframe
     */
    connect() {
        if (this.isConnected) return;
        
        // Listen for messages from parent
        window.addEventListener('message', this.handleMessage);
        
        // Register with parent
        this.sendMessage({
            type: 'CUSTOM_JSON_REGISTER',
            iframeId: this.iframeId,
            payload: {
                type: this.componentType,
                version: this.version,
                timestamp: Date.now()
            }
        });
        
        // Request current custom JSON state
        this.sendMessage({
            type: 'CUSTOM_JSON_REQUEST',
            iframeId: this.iframeId
        });
        
        this.isConnected = true;
        console.log('✅ Iframe connected to parent editor:', {
            iframeId: this.iframeId,
            componentType: this.componentType
        });
    }
    
    /**
     * Disconnect from parent editor
     */
    disconnect() {
        if (!this.isConnected) return;
        
        // Unregister from parent
        this.sendMessage({
            type: 'CUSTOM_JSON_UNREGISTER',
            iframeId: this.iframeId
        });
        
        // Stop listening
        window.removeEventListener('message', this.handleMessage);
        
        // Clear timers
        if (this.syncDebounceTimer) {
            clearTimeout(this.syncDebounceTimer);
            this.syncDebounceTimer = null;
        }
        
        this.isConnected = false;
        console.log('👋 Iframe disconnected from parent editor');
    }
    
    /**
     * Handle incoming messages from parent
     */
    handleMessage(event) {
        // Ignore non-object messages
        if (!event.data || typeof event.data !== 'object') return;
        
        const { type, iframeId, payload } = event.data;
        
        // Ignore messages for other iframes
        if (iframeId && iframeId !== this.iframeId) return;
        
        switch (type) {
            case 'CUSTOM_JSON_STATE':
                // Initial state from parent
                console.log('📥 Received custom JSON state from parent:', {
                    size: JSON.stringify(payload).length,
                    keys: Object.keys(payload || {})
                });
                this.syncFromParent(payload || {});
                break;
                
            case 'CUSTOM_JSON_UPDATE_BROADCAST':
                // Update from another collaborator
                console.log('📢 Received custom JSON broadcast:', {
                    size: JSON.stringify(payload).length
                });
                this.syncFromParent(payload || {});
                break;
        }
    }
    
    /**
     * Sync state from parent (override this in your component)
     */
    syncFromParent(customJson) {
        // Update local state
        this.localState = { ...customJson };
        
        // Call component-specific update handler
        this.updateLocalState(customJson);
    }
    
    /**
     * Override this method to handle custom JSON updates in your component
     */
    updateLocalState(customJson) {
        console.log('📝 updateLocalState() should be overridden in your component');
    }
    
    /**
     * Send custom JSON update to parent
     */
    sendUpdate(updates) {
        if (!this.isConnected) {
            console.warn('⚠️ Cannot send update - not connected to parent');
            return;
        }
        
        // Validate updates
        if (!updates || typeof updates !== 'object') {
            console.warn('⚠️ Invalid updates - must be an object');
            return;
        }
        
        // Update local state immediately for responsive UI
        Object.assign(this.localState, updates);
        
        // Debounce updates to parent
        clearTimeout(this.syncDebounceTimer);
        this.syncDebounceTimer = setTimeout(() => {
            this.sendMessage({
                type: 'CUSTOM_JSON_UPDATE',
                iframeId: this.iframeId,
                payload: updates
            });
            
            console.log('📤 Sent custom JSON update to parent:', {
                size: JSON.stringify(updates).length,
                keys: Object.keys(updates)
            });
        }, this.debounceDelay);
    }
    
    /**
     * Get current local state
     */
    getState() {
        return { ...this.localState };
    }
    
    /**
     * Clear local state
     */
    clearState() {
        this.localState = {};
        this.sendUpdate({});
    }
    
    /**
     * Send message to parent window
     */
    sendMessage(message) {
        if (!window.parent || window.parent === window) {
            console.warn('⚠️ No parent window available');
            return;
        }
        
        try {
            window.parent.postMessage(message, '*');
        } catch (error) {
            console.error('❌ Failed to send message to parent:', error);
        }
    }
    
    /**
     * Generate unique iframe ID
     */
    generateUniqueId() {
        return `iframe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Get performance metrics
     */
    getMetrics() {
        return {
            iframeId: this.iframeId,
            componentType: this.componentType,
            isConnected: this.isConnected,
            stateSize: JSON.stringify(this.localState).length,
            messageQueueLength: this.messageQueue.length
        };
    }
}

/**
 * Example implementation for a 360° gallery component
 */
export class Gallery360Integration extends IframeCustomJsonIntegration {
    constructor(options = {}) {
        super({
            ...options,
            componentType: '360-gallery',
            version: '2.0'
        });
        
        // Component-specific state
        this.assets = [];
        this.settings = {
            autoplay: false,
            speed: 1,
            fov: 75
        };
    }
    
    /**
     * Handle updates from parent
     */
    updateLocalState(customJson) {
        // Extract 360 gallery data
        if (customJson['360-gallery']) {
            const galleryData = customJson['360-gallery'];
            
            if (galleryData.assets) {
                this.assets = galleryData.assets;
                this.renderAssets();
            }
            
            if (galleryData.settings) {
                Object.assign(this.settings, galleryData.settings);
                this.applySettings();
            }
        }
    }
    
    /**
     * Send asset update to parent
     */
    addAsset(asset) {
        this.assets.push(asset);
        
        this.sendUpdate({
            '360-gallery': {
                assets: this.assets,
                settings: this.settings
            }
        });
    }
    
    /**
     * Update settings
     */
    updateSettings(newSettings) {
        Object.assign(this.settings, newSettings);
        
        this.sendUpdate({
            '360-gallery': {
                assets: this.assets,
                settings: this.settings
            }
        });
    }
    
    // Component-specific rendering methods
    renderAssets() {
        console.log('Rendering assets:', this.assets);
        // Your rendering logic here
    }
    
    applySettings() {
        console.log('Applying settings:', this.settings);
        // Your settings logic here
    }
}

/**
 * Example implementation for a dApp component
 */
export class DappIntegration extends IframeCustomJsonIntegration {
    constructor(options = {}) {
        super({
            ...options,
            componentType: 'dapp',
            version: '1.0'
        });
        
        // dApp-specific state
        this.contracts = [];
        this.interactions = [];
        this.config = {};
    }
    
    updateLocalState(customJson) {
        if (customJson.dapp) {
            const dappData = customJson.dapp;
            
            if (dappData.contracts) {
                this.contracts = dappData.contracts;
            }
            
            if (dappData.interactions) {
                this.interactions = dappData.interactions;
            }
            
            if (dappData.config) {
                this.config = dappData.config;
            }
            
            this.renderDapp();
        }
    }
    
    addContract(contract) {
        this.contracts.push(contract);
        this.sendDappUpdate();
    }
    
    addInteraction(interaction) {
        this.interactions.push(interaction);
        this.sendDappUpdate();
    }
    
    updateConfig(config) {
        Object.assign(this.config, config);
        this.sendDappUpdate();
    }
    
    sendDappUpdate() {
        this.sendUpdate({
            dapp: {
                contracts: this.contracts,
                interactions: this.interactions,
                config: this.config
            }
        });
    }
    
    renderDapp() {
        console.log('Rendering dApp:', {
            contracts: this.contracts,
            interactions: this.interactions,
            config: this.config
        });
        // Your dApp rendering logic here
    }
}

// Export for use in iframe components
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        IframeCustomJsonIntegration,
        Gallery360Integration,
        DappIntegration
    };
}