/**
 * Document Service
 *
 * Single source of truth for all document-related data and caching.
 * Manages document metadata, IndexedDB scan results, and integrates
 * with AuthStateManager for permissions.
 *
 * Follows the 8 architectural rules:
 * 1. Single Source of Truth - All document data flows through this service
 * 2. Clear Separation - Service layer handles data, not UI
 * 3. No Duplicate State - Unified metadata cache for all documents
 * 4. Explicit Cache Keys - Clear naming convention
 * 5. User-Specific Caching - Respects user context
 * 6. Reactive Updates - Event-driven cache invalidation
 * 7. Predictable Behavior - Consistent 5-minute TTL
 * 8. Offline-First - Leverages CacheService's offline support
 */

import { cacheService } from './cache-service.js';
import { authStateManager } from './auth-state-manager.js';

class DocumentService {
    constructor() {
        this.DEBUG = window.DEBUG || false;

        // Memory caches for performance
        this.metadataCache = new Map();
        this.scanCache = null;
        this.scanCacheTime = 0;

        // Cache key prefixes
        this.CACHE_KEYS = {
            METADATA: 'dlux_document_metadata',
            SCAN_RESULTS: (username) => `dlux_indexeddb_scan_${username}`,
            SCAN_TIME: (username) => `dlux_indexeddb_scan_time_${username}`
        };

        // Consistent TTL following Option 3
        this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes

        // Setup event listeners
        this.setupEventListeners();
    }

    /**
     * Setup event listeners for cache invalidation
     */
    setupEventListeners() {
        // Listen for user changes to invalidate user-specific caches
        window.addEventListener('userChanged', (event) => {
            if (this.DEBUG) {
                console.log('📄 DocumentService: User changed, clearing caches', event.detail);
            }
            this.clearAllCaches();
        });

        // Listen for document updates
        window.addEventListener('documentUpdated', (event) => {
            const { documentId } = event.detail;
            if (documentId) {
                this.invalidateDocumentCache(documentId);
            }
        });
    }

    /**
     * Get document metadata (unified for local and cloud documents)
     * @param {string} documentId - Format: "owner/permlink" or "local-uuid"
     * @returns {Object|null} Document metadata or null
     */
    async getDocumentMetadata(documentId) {
        if (!documentId) return null;

        // Check memory cache first
        if (this.metadataCache.has(documentId)) {
            const cached = this.metadataCache.get(documentId);
            if (Date.now() - cached.timestamp < this.CACHE_TTL) {
                if (this.DEBUG) console.log('📄 DocumentService: Metadata from memory cache', documentId);
                return cached.data;
            }
        }

        // Check persistent cache
        const cacheKey = `${this.CACHE_KEYS.METADATA}_${documentId}`;
        const cached = cacheService.get(cacheKey);
        if (cached) {
            // Refresh memory cache
            this.metadataCache.set(documentId, {
                data: cached,
                timestamp: Date.now()
            });
            if (this.DEBUG) console.log('📄 DocumentService: Metadata from persistent cache', documentId);
            return cached;
        }

        // No cached data available
        return null;
    }

    /**
     * Cache document metadata
     * @param {string} documentId - Document identifier
     * @param {Object} metadata - Metadata to cache
     */
    cacheDocumentMetadata(documentId, metadata) {
        if (!documentId || !metadata) return;

        // Store in memory cache
        this.metadataCache.set(documentId, {
            data: metadata,
            timestamp: Date.now()
        });

        // Store in persistent cache
        const cacheKey = `${this.CACHE_KEYS.METADATA}_${documentId}`;
        cacheService.set(cacheKey, metadata, {
            ttl: this.CACHE_TTL,
            username: authStateManager.getUser()
        });

        if (this.DEBUG) {
            console.log('📄 DocumentService: Cached metadata', {
                documentId,
                metadata,
                username: authStateManager.getUser()
            });
        }
    }

    /**
     * Get IndexedDB scan results
     * @returns {Array|null} Array of local documents or null
     */
    getIndexedDBScanCache() {
        // Get current username
        const username = authStateManager.getUser();
        if (!username || username === 'GUEST') {
            return null; // No cache for unauthenticated users
        }

        // Check memory cache with TTL
        if (this.scanCache && (Date.now() - this.scanCacheTime) < this.CACHE_TTL) {
            if (this.DEBUG) console.log('📄 DocumentService: Scan results from memory cache');
            return this.scanCache;
        }

        // Check persistent cache with user-specific keys
        const cached = cacheService.get(this.CACHE_KEYS.SCAN_RESULTS(username));
        const cachedTime = cacheService.get(this.CACHE_KEYS.SCAN_TIME(username));

        if (cached && cachedTime) {
            // Refresh memory cache
            this.scanCache = cached;
            this.scanCacheTime = cachedTime;
            if (this.DEBUG) console.log('📄 DocumentService: Scan results from persistent cache');
            return cached;
        }

        return null;
    }

    /**
     * Cache IndexedDB scan results
     * @param {Array} documents - Array of document objects
     */
    cacheIndexedDBScan(documents) {
        if (!Array.isArray(documents)) return;

        const username = authStateManager.getUser();
        if (!username || username === 'GUEST') {
            return; // Don't cache for unauthenticated users
        }

        const now = Date.now();

        // Store in memory cache
        this.scanCache = documents;
        this.scanCacheTime = now;

        // Store in persistent cache with user-specific keys
        cacheService.set(this.CACHE_KEYS.SCAN_RESULTS(username), documents, {
            ttl: this.CACHE_TTL,
            username: username
        });

        cacheService.set(this.CACHE_KEYS.SCAN_TIME(username), now, {
            ttl: this.CACHE_TTL,
            username: username
        });

        if (this.DEBUG) {
            console.log('📄 DocumentService: Cached IndexedDB scan', {
                documentCount: documents.length,
                username: username
            });
        }
    }

    /**
     * Invalidate cache for a specific document
     * @param {string} documentId - Document to invalidate
     */
    invalidateDocumentCache(documentId) {
        if (!documentId) return;

        // Clear from memory cache
        this.metadataCache.delete(documentId);

        // Clear from persistent cache
        const cacheKey = `${this.CACHE_KEYS.METADATA}_${documentId}`;
        cacheService.remove(cacheKey);

        if (this.DEBUG) {
            console.log('📄 DocumentService: Invalidated document cache', documentId);
        }
    }

    /**
     * Clear all caches
     */
    clearAllCaches() {
        // Clear memory caches
        this.metadataCache.clear();
        this.scanCache = null;
        this.scanCacheTime = 0;

        // Clear persistent caches with our prefixes
        const currentUser = authStateManager.getUser();

        // Clear metadata caches using CacheService
        const keysToRemove = cacheService.findKeysByPattern(key => {
            return key && key.startsWith(this.CACHE_KEYS.METADATA);
        });

        keysToRemove.forEach(key => {
            cacheService.remove(key);
        });

        // Clear scan caches - find all user-specific scan caches
        const scanKeys = cacheService.findKeysByPattern(key => {
            return key && (key.startsWith('dlux_indexeddb_scan_') || key.startsWith('dlux_indexeddb_scan_time_'));
        });

        scanKeys.forEach(key => {
            cacheService.remove(key);
        });

        if (this.DEBUG) {
            console.log('📄 DocumentService: Cleared all caches');
        }
    }

    /**
     * Get document permission (delegates to AuthStateManager)
     * @param {Object} document - Document object with owner/permlink
     * @returns {Object} Permission result from AuthStateManager
     */
    async getDocumentPermission(document) {
        if (!document || !document.owner || !document.permlink) {
            return { hasPermission: false, level: 'no-access' };
        }

        return authStateManager.checkCollaborativePermission(document);
    }

    /**
     * Preload document metadata (for preventing UI flash)
     * @param {string} owner - Document owner
     * @param {string} permlink - Document permlink
     * @returns {Object|null} Metadata or null
     */
    async preloadDocumentMetadata(owner, permlink) {
        if (!owner || !permlink) return null;

        const documentId = `${owner}/${permlink}`;

        // Check if already cached
        const cached = await this.getDocumentMetadata(documentId);
        if (cached) return cached;

        // Note: Actual loading logic would be implemented by the component
        // This service just manages the cache
        return null;
    }

    /**
     * Update document metadata and cache it internally
     * @param {string} documentId - Document ID (owner/permlink)
     * @param {Object} updates - Metadata updates to apply
     * @returns {Object} Updated metadata
     */
    async updateDocumentMetadata(documentId, updates) {
        if (!documentId || !updates) return null;

        // Get existing metadata or create new
        const existing = await this.getDocumentMetadata(documentId) || {};

        // Merge updates
        const updated = {
            ...existing,
            ...updates,
            timestamp: Date.now()
        };

        // Cache internally
        this.cacheDocumentMetadata(documentId, updated);

        if (this.DEBUG) {
            console.log('📄 DocumentService: Updated metadata', {
                documentId,
                updates,
                updated
            });
        }

        return updated;
    }

    /**
     * Update document name and cache it
     * @param {Object} document - Document object with owner/permlink
     * @param {string} newName - New document name
     * @returns {Object} Updated metadata
     */
    async updateDocumentName(document, newName) {
        if (!document || !newName) return null;

        const documentId = document.id || `${document.owner}/${document.permlink}`;

        return this.updateDocumentMetadata(documentId, {
            documentName: newName,
            name: newName,
            title: newName,
            owner: document.owner,
            permlink: document.permlink
        });
    }
}

// Create singleton instance
export const documentService = new DocumentService();

// Make available globally for debugging
if (window.DEBUG) {
    window.documentService = documentService;
}

export default DocumentService;
