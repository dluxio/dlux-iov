/**
 * Y.js Document Service
 *
 * Centralizes all Y.js document operations to ensure consistent handling,
 * proper cleanup, and adherence to TipTap v3 best practices.
 *
 * This service manages:
 * - Document lifecycle (create, load, destroy)
 * - State updates with transaction origins
 * - Observer management with automatic cleanup
 * - Batch operations for performance
 *
 * Usage:
 * ```javascript
 * import { ydocService } from './ydoc-service.js';
 *
 * // Create a new document
 * const doc = ydocService.createDocument('my-doc-id');
 *
 * // Update metadata
 * ydocService.updateMetadata('title', 'My Document');
 *
 * // Observe changes
 * const unsubscribe = ydocService.observeConfig((event) => {
 *   console.log('Config changed:', event);
 * });
 * ```
 */

// Y.js is available via window.Y from the TipTap collaboration bundle
const DEBUG = false;

class YDocService {
    constructor() {
        this.ydoc = null;
        this.observers = new Map();
        this.docId = null;
    }

    /**
     * Create a new Y.js document
     * @param {string} docId - Unique document identifier
     * @returns {Y.Doc} The created document
     */
    createDocument(docId) {
        const Y = window.Y;
        if (!Y) {
            throw new Error('Y.js not available - ensure collaboration bundle is loaded');
        }

        if (this.ydoc) {
            console.warn('⚠️ YDocService: Document already exists, destroying old one');
            this.destroyDocument();
        }

        this.docId = docId;
        this.ydoc = new Y.Doc({ guid: docId });

        // Initialize structure with proper transactions
        this.ydoc.transact(() => {
            const config = this.ydoc.getMap('config');
            const metadata = this.ydoc.getMap('metadata');
            const permissions = this.ydoc.getMap('permissions');

            // Initialize config
            config.set('created', new Date().toISOString());
            config.set('version', '1.0');

            // Initialize metadata
            metadata.set('title', '');
            metadata.set('tags', []);
            metadata.set('beneficiaries', []);
            metadata.set('customJson', {});
            metadata.set('initialized', true);
        }, 'schema-init');

        if (DEBUG) console.log('📄 YDocService: Document created', { docId });
        return this.ydoc;
    }

    /**
     * Load an existing document
     * @param {Y.Doc} ydoc - Existing Y.js document
     * @param {string} docId - Document identifier
     */
    loadDocument(ydoc, docId) {
        if (this.ydoc) {
            this.destroyDocument();
        }

        this.ydoc = ydoc;
        this.docId = docId;

        if (DEBUG) console.log('📄 YDocService: Document loaded', { docId });
    }

    /**
     * Destroy the current document and cleanup
     */
    destroyDocument() {
        if (!this.ydoc) return;

        // Clean up all observers
        this.removeAllObservers();

        // Destroy Y.js document
        this.ydoc.destroy();
        this.ydoc = null;
        this.docId = null;

        if (DEBUG) console.log('🗑️ YDocService: Document destroyed');
    }

    /**
     * Update a config value
     * @param {string} key - Config key
     * @param {any} value - New value
     */
    updateConfig(key, value) {
        if (!this.ydoc) {
            console.error('❌ YDocService: No document loaded');
            return;
        }

        this.ydoc.transact(() => {
            const config = this.ydoc.getMap('config');
            config.set(key, value);
            config.set('lastModified', new Date().toISOString());
        }, 'config-update');

        if (DEBUG) console.log('⚙️ YDocService: Config updated', { key, value });
    }

    /**
     * Update a metadata value
     * @param {string} key - Metadata key
     * @param {any} value - New value
     */
    updateMetadata(key, value) {
        if (!this.ydoc) {
            console.error('❌ YDocService: No document loaded');
            return;
        }

        this.ydoc.transact(() => {
            const metadata = this.ydoc.getMap('metadata');
            metadata.set(key, value);
        }, 'metadata-update');

        if (DEBUG) console.log('📝 YDocService: Metadata updated', { key, value });
    }

    /**
     * Batch update multiple values
     * @param {Object} configUpdates - Config updates
     * @param {Object} metadataUpdates - Metadata updates
     */
    batchUpdate(configUpdates = {}, metadataUpdates = {}) {
        if (!this.ydoc) {
            console.error('❌ YDocService: No document loaded');
            return;
        }

        this.ydoc.transact(() => {
            const config = this.ydoc.getMap('config');
            const metadata = this.ydoc.getMap('metadata');

            // Apply config updates
            Object.entries(configUpdates).forEach(([key, value]) => {
                config.set(key, value);
            });

            // Apply metadata updates
            Object.entries(metadataUpdates).forEach(([key, value]) => {
                metadata.set(key, value);
            });

            // Update last modified
            config.set('lastModified', new Date().toISOString());
        }, 'batch-update');

        if (DEBUG) console.log('📦 YDocService: Batch update completed', {
            configCount: Object.keys(configUpdates).length,
            metadataCount: Object.keys(metadataUpdates).length
        });
    }

    /**
     * Get config value
     * @param {string} key - Config key
     * @returns {any} Config value
     */
    getConfig(key) {
        if (!this.ydoc) return null;
        const config = this.ydoc.getMap('config');
        return config.get(key);
    }

    /**
     * Get metadata value
     * @param {string} key - Metadata key
     * @returns {any} Metadata value
     */
    getMetadata(key) {
        if (!this.ydoc) return null;
        const metadata = this.ydoc.getMap('metadata');
        return metadata.get(key);
    }

    /**
     * Get permission for a user
     * @param {string} account - User account
     * @returns {Object|null} Permission object
     */
    getPermission(account) {
        if (!this.ydoc) return null;
        const permissions = this.ydoc.getMap('permissions');
        return permissions.get(account);
    }

    /**
     * Get all config values as a plain object
     * @returns {Object} All config entries
     */
    getAllConfig() {
        if (!this.ydoc) return {};
        const config = this.ydoc.getMap('config');
        const result = {};
        for (const [key, value] of config.entries()) {
            result[key] = value;
        }
        return result;
    }

    /**
     * Get all metadata values as a plain object
     * @returns {Object} All metadata entries
     */
    getAllMetadata() {
        if (!this.ydoc) return {};
        const metadata = this.ydoc.getMap('metadata');
        const result = {};
        for (const [key, value] of metadata.entries()) {
            result[key] = value;
        }
        return result;
    }

    /**
     * Observe config changes
     * @param {Function} callback - Observer callback
     * @returns {Function} Unsubscribe function
     */
    observeConfig(callback) {
        if (!this.ydoc) {
            console.error('❌ YDocService: No document loaded');
            return () => {};
        }

        const config = this.ydoc.getMap('config');
        const observerId = `config-${Date.now()}`;

        const observer = (event) => {
            callback(event);
        };

        config.observe(observer);
        this.observers.set(observerId, { map: config, observer });

        // Return unsubscribe function
        return () => {
            config.unobserve(observer);
            this.observers.delete(observerId);
        };
    }

    /**
     * Observe metadata changes
     * @param {Function} callback - Observer callback
     * @returns {Function} Unsubscribe function
     */
    observeMetadata(callback) {
        if (!this.ydoc) {
            console.error('❌ YDocService: No document loaded');
            return () => {};
        }

        const metadata = this.ydoc.getMap('metadata');
        const observerId = `metadata-${Date.now()}`;

        const observer = (event) => {
            callback(event);
        };

        metadata.observe(observer);
        this.observers.set(observerId, { map: metadata, observer });

        // Return unsubscribe function
        return () => {
            metadata.unobserve(observer);
            this.observers.delete(observerId);
        };
    }

    /**
     * Observe permission changes
     * @param {Function} callback - Observer callback
     * @returns {Function} Unsubscribe function
     */
    observePermissions(callback) {
        if (!this.ydoc) {
            console.error('❌ YDocService: No document loaded');
            return () => {};
        }

        const permissions = this.ydoc.getMap('permissions');
        const observerId = `permissions-${Date.now()}`;

        const observer = (event) => {
            callback(event);
        };

        permissions.observe(observer);
        this.observers.set(observerId, { map: permissions, observer });

        // Return unsubscribe function
        return () => {
            permissions.unobserve(observer);
            this.observers.delete(observerId);
        };
    }

    /**
     * Remove all observers
     */
    removeAllObservers() {
        this.observers.forEach(({ map, observer }) => {
            map.unobserve(observer);
        });
        this.observers.clear();

        if (DEBUG) console.log('🧹 YDocService: All observers removed');
    }

    /**
     * Get document statistics
     * @returns {Object} Document stats
     */
    getStats() {
        if (!this.ydoc) return null;

        const config = this.ydoc.getMap('config');
        const metadata = this.ydoc.getMap('metadata');
        const permissions = this.ydoc.getMap('permissions');

        return {
            docId: this.docId,
            configSize: config.size,
            metadataSize: metadata.size,
            permissionsCount: permissions.size,
            observerCount: this.observers.size,
            created: config.get('created'),
            lastModified: config.get('lastModified')
        };
    }

    /**
     * Check if document is ready
     * @returns {boolean} Document ready state
     */
    isReady() {
        return !!this.ydoc;
    }

    /**
     * Check if document is destroyed
     * @returns {boolean} Document destroyed state
     */
    isDestroyed() {
        return !this.ydoc || this.ydoc.isDestroyed;
    }

    /**
     * Check if document is valid (exists and not destroyed)
     * @returns {boolean} Document validity
     */
    isValid() {
        return this.ydoc && !this.ydoc.isDestroyed;
    }

    /**
     * Check if there are pending transactions
     * @returns {boolean} Whether transactions are pending
     */
    hasPendingTransactions() {
        if (!this.ydoc) return false;
        return this.ydoc.transactionCleanups && this.ydoc.transactionCleanups.size > 0;
    }

    /**
     * Get Y.js client ID
     * @returns {number|null} Client ID
     */
    getClientId() {
        return this.ydoc ? this.ydoc.clientID : null;
    }

    /**
     * Get subdocument count
     * @returns {number} Number of subdocuments
     */
    getSubdocCount() {
        return this.ydoc ? this.ydoc.subdocs.size : 0;
    }

    /**
     * Get undo stack size
     * @returns {number} Undo stack size
     */
    getUndoStackSize() {
        return this.ydoc?.undoManager?.undoStack?.length || 0;
    }

    /**
     * Get redo stack size
     * @returns {number} Redo stack size
     */
    getRedoStackSize() {
        return this.ydoc?.undoManager?.redoStack?.length || 0;
    }

    /**
     * Get internal map count
     * @returns {number} Number of internal maps
     */
    getMapCount() {
        return this.ydoc ? this.ydoc._map.size : 0;
    }

    /**
     * Properly destroy the document
     * Alias for destroyDocument() to match expected interface
     */
    destroy() {
        this.destroyDocument();
    }

    /**
     * Subscribe to Y.js update events
     * @param {Function} handler - Update handler
     * @returns {Function} Unsubscribe function
     */
    onUpdate(handler) {
        if (!this.ydoc) {
            console.error('❌ YDocService: No document loaded');
            return () => {};
        }

        this.ydoc.on('update', handler);

        // Return unsubscribe function
        return () => {
            if (this.ydoc) {
                this.ydoc.off('update', handler);
            }
        };
    }

    /**
     * Get a Y.js map directly (use sparingly)
     * @param {string} mapName - Name of the map
     * @returns {Y.Map|null} The Y.js map or null
     */
    getMap(mapName) {
        if (!this.ydoc) return null;
        return this.ydoc.getMap(mapName);
    }

    /**
     * Execute a transaction on a specific map
     * @param {string} mapName - Name of the map
     * @param {Function} callback - Transaction callback
     * @param {string} origin - Transaction origin tag
     */
    transactOnMap(mapName, callback, origin = 'map-update') {
        if (!this.ydoc) {
            console.error('❌ YDocService: No document loaded');
            return;
        }

        this.ydoc.transact(() => {
            const map = this.ydoc.getMap(mapName);
            callback(map);
        }, origin);
    }

    /**
     * Set cloud sync status
     * @param {boolean} active - Whether cloud sync is active
     * @param {string} timestamp - Timestamp of the sync event
     */
    setCloudSyncStatus(active, timestamp = new Date().toISOString()) {
        this.transactOnMap('config', (config) => {
            config.set('cloudSyncActive', active);
            if (active) {
                config.set('lastWebSocketSync', timestamp);
            } else {
                config.set('lastDisconnect', timestamp);
            }
        }, 'cloud-sync-status');
    }

    /**
     * Set tier upgrade status
     * @param {boolean} upgraded - Whether tier was upgraded
     * @param {string} time - Time of upgrade
     */
    setTierUpgrade(upgraded, time = new Date().toISOString()) {
        this.transactOnMap('config', (config) => {
            config.set('tierUpgraded', upgraded);
            config.set('tierUpgradeTime', time);
        }, 'tier-upgrade');
    }

    /**
     * Set initial content loaded status
     * @param {boolean} loaded - Whether initial content is loaded
     * @param {string} reference - Reference to initial content
     */
    setInitialContentLoaded(loaded, reference) {
        this.transactOnMap('config', (config) => {
            config.set('initialContentLoaded', loaded);
        }, 'initial-content');

        if (reference) {
            this.transactOnMap('metadata', (metadata) => {
                metadata.set('initialContentReference', reference);
            }, 'initial-content');
        }
    }

    /**
     * Get document metadata (name and lastModified)
     * @returns {Object} Document metadata
     */
    getDocumentMetadata() {
        if (!this.ydoc) return { documentName: null, lastModified: null };

        const config = this.ydoc.getMap('config');
        return {
            documentName: config.get('documentName'),
            lastModified: config.get('lastModified')
        };
    }

    /**
     * Validate document structure
     * @param {Y.Doc} ydoc - Y.js document to validate
     * @returns {boolean} Whether document structure is valid
     */
    validateDocumentStructure(ydoc = this.ydoc) {
        if (!ydoc) return false;

        try {
            const config = ydoc.getMap('config');
            const metadata = ydoc.getMap('metadata');
            const permissions = ydoc.getMap('permissions');

            // Check all required maps exist and are accessible
            return config && metadata && permissions;
        } catch (error) {
            console.error('❌ YDocService: Document validation failed', error);
            return false;
        }
    }

    /**
     * Set server version in config
     * @param {string} version - Server version
     * @param {number} checkTime - Time of version check
     */
    setServerVersion(version, checkTime = Date.now()) {
        this.transactOnMap('config', (config) => {
            config.set('serverVersion', version);
            config.set('serverVersionCheckTime', checkTime);
        }, 'server-version');
    }

    /**
     * Create a temporary Y.js document (not managed by this service)
     * @param {string} guid - Optional GUID for the document
     * @returns {Y.Doc} Temporary Y.js document
     */
    createTempDocument(guid = null) {
        const Y = window.Y;
        if (!Y) {
            throw new Error('Y.js not available - ensure collaboration bundle is loaded');
        }

        const options = guid ? { guid } : {};
        return new Y.Doc(options);
    }

    /**
     * Apply Y.js update to a document
     * @param {Y.Doc} doc - Y.js document
     * @param {Uint8Array} update - Update to apply
     */
    applyUpdate(doc, update) {
        const Y = window.Y;
        if (!Y || !Y.applyUpdate) {
            throw new Error('Y.js applyUpdate not available');
        }

        Y.applyUpdate(doc, update);
    }

    /**
     * Encode document state as update
     * @param {Y.Doc} doc - Y.js document
     * @returns {Uint8Array} Encoded state
     */
    encodeStateAsUpdate(doc) {
        const Y = window.Y;
        if (!Y || !Y.encodeStateAsUpdate) {
            throw new Error('Y.js encodeStateAsUpdate not available');
        }

        return Y.encodeStateAsUpdate(doc);
    }

    /**
     * Get Y.js constructor (for cases where Y is needed directly)
     * @returns {Object} Y.js module
     */
    getYjs() {
        const Y = window.Y;
        if (!Y) {
            throw new Error('Y.js not available - ensure collaboration bundle is loaded');
        }
        return Y;
    }

    /**
     * Check if a document is empty (no content in maps)
     * @param {Y.Doc} doc - Y.js document to check
     * @returns {boolean} Whether document is empty
     */
    isDocumentEmpty(doc) {
        if (!doc) return true;

        try {
            const config = doc.getMap('config');
            const metadata = doc.getMap('metadata');

            // Document is considered empty if maps have no entries
            return config.size === 0 && metadata.size === 0;
        } catch (error) {
            console.error('Error checking document emptiness:', error);
            return true;
        }
    }

    /**
     * Clone document state from one Y.js document to another
     * @param {Y.Doc} sourceDoc - Source document
     * @param {Y.Doc} targetDoc - Target document
     */
    cloneDocumentState(sourceDoc, targetDoc) {
        const Y = this.getYjs();
        const state = Y.encodeStateAsUpdate(sourceDoc);
        Y.applyUpdate(targetDoc, state);
    }
}

// Export singleton instance
export const ydocService = new YDocService();

// Also export class for testing
export { YDocService };
