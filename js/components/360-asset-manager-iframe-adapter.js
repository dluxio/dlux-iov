/**
 * 360° Asset Manager Iframe Adapter
 *
 * This adapter allows the 360-asset-manager component to work both as:
 * 1. A regular Vue component (emitting events)
 * 2. An iframe component (using postMessage protocol)
 *
 * To use in iframe mode, wrap your component initialization with this adapter
 */

import { IframeCustomJsonIntegration } from '../iframe-customjson-integration.js';

/**
 * Adapter class for 360° Asset Manager iframe integration
 */
export class Asset360IframeAdapter extends IframeCustomJsonIntegration {
    constructor(vueComponent, options = {}) {
        super({
            ...options,
            componentType: '360-gallery',
            version: '2.0'
        });

        this.vueComponent = vueComponent;
        this.lastEmittedData = null;

        // Intercept Vue component's emit method
        this.setupEmitInterceptor();
    }

    /**
     * Setup interceptor for Vue component's $emit
     */
    setupEmitInterceptor() {
        const originalEmit = this.vueComponent.$emit;
        const adapter = this;

        // Override $emit to also send via postMessage when in iframe
        this.vueComponent.$emit = function(event, ...args) {
            // Call original emit for normal Vue event handling
            originalEmit.apply(this, [event, ...args]);

            // If we're in an iframe and this is an assets update, send via postMessage
            if (adapter.isInIframe() && event === 'assets-updated') {
                const data = args[0];
                adapter.handleAssetsUpdate(data);
            }
        };
    }

    /**
     * Check if we're running in an iframe
     */
    isInIframe() {
        try {
            return window.self !== window.top;
        } catch (_e) {
            return true;
        }
    }

    /**
     * Handle assets update from Vue component
     */
    handleAssetsUpdate(data) {
        // Convert to custom JSON format
        const customJsonUpdate = {
            '360-gallery': {
                assets: data.assets || [],
                navigation: data.navigation || [],
                settings: {
                    autoplay: this.vueComponent.autoplay || false,
                    speed: this.vueComponent.rotationSpeed || 1,
                    fov: this.vueComponent.fieldOfView || 75
                },
                metadata: {
                    lastUpdated: new Date().toISOString(),
                    version: '2.0'
                }
            }
        };

        // Store last emitted data
        this.lastEmittedData = customJsonUpdate;

        // Send to parent via postMessage
        this.sendUpdate(customJsonUpdate);
    }

    /**
     * Handle incoming custom JSON from parent
     */
    updateLocalState(customJson) {
        if (!customJson['360-gallery']) return;

        const galleryData = customJson['360-gallery'];

        // Update Vue component's data
        if (galleryData.assets && Array.isArray(galleryData.assets)) {
            this.vueComponent.assets = [...galleryData.assets];
        }

        if (galleryData.navigation && Array.isArray(galleryData.navigation)) {
            this.vueComponent.navigation = [...galleryData.navigation];
        }

        if (galleryData.settings) {
            if (typeof galleryData.settings.autoplay !== 'undefined') {
                this.vueComponent.autoplay = galleryData.settings.autoplay;
            }
            if (typeof galleryData.settings.speed !== 'undefined') {
                this.vueComponent.rotationSpeed = galleryData.settings.speed;
            }
            if (typeof galleryData.settings.fov !== 'undefined') {
                this.vueComponent.fieldOfView = galleryData.settings.fov;
            }
        }

        // Trigger Vue component re-render if needed
        if (this.vueComponent.$forceUpdate) {
            this.vueComponent.$forceUpdate();
        }
    }

    /**
     * Get current gallery data
     */
    getGalleryData() {
        return this.lastEmittedData || {
            '360-gallery': {
                assets: this.vueComponent.assets || [],
                navigation: this.vueComponent.navigation || [],
                settings: {
                    autoplay: this.vueComponent.autoplay || false,
                    speed: this.vueComponent.rotationSpeed || 1,
                    fov: this.vueComponent.fieldOfView || 75
                }
            }
        };
    }
}

/**
 * Mixin for Vue components to add iframe integration
 */
export const Asset360IframeMixin = {
    data() {
        return {
            iframeAdapter: null
        };
    },

    mounted() {
        // Initialize iframe adapter if we're in an iframe
        if (this.isInIframe()) {
            this.iframeAdapter = new Asset360IframeAdapter(this, {
                autoConnect: true
            });
            console.log('✅ 360° Asset Manager iframe adapter initialized');
        }
    },

    beforeDestroy() {
        // Cleanup iframe adapter
        if (this.iframeAdapter) {
            this.iframeAdapter.disconnect();
            this.iframeAdapter = null;
        }
    },

    methods: {
        isInIframe() {
            try {
                return window.self !== window.top;
            } catch (_e) {
                return true;
            }
        }
    }
};

/**
 * Usage example:
 *
 * In your 360-asset-manager.js component:
 *
 * import { Asset360IframeMixin } from './360-asset-manager-iframe-adapter.js';
 *
 * const Asset360Manager = {
 *     name: 'Asset360Manager',
 *     mixins: [Asset360IframeMixin],
 *     // ... rest of your component
 * }
 *
 * Or manually initialize:
 *
 * mounted() {
 *     this.iframeAdapter = new Asset360IframeAdapter(this);
 *     this.iframeAdapter.connect();
 * }
 */
