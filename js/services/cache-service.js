/**
 * Cache Service
 *
 * Centralized service for managing all cached data with auth-aware invalidation.
 * Provides consistent caching strategies across the application with automatic
 * cleanup when authentication state changes.
 */

// Removed import to prevent circular dependency - username will be passed as parameter

class CacheService {
    constructor() {
        this.caches = new Map();
        this.DEBUG = window.DEBUG || false;

        // Define cache keys
        this.CACHE_KEYS = {
            COLLABORATIVE_DOCS: 'dlux_collaborative_docs_cache',
            PERMISSIONS: 'dlux_permissions_cache',
            METADATA: 'dlux_metadata_cache',
            USER_COLORS: 'dlux_user_colors_cache',
            DOCUMENT_STORAGE: 'dlux_tiptap_files', // Document metadata storage
            // AUTH_HEADERS: 'dlux_auth_headers_cache' // UNUSED - auth headers stored in sessionStorage as collaborationAuthHeaders_${username}
        };

        // Cache TTL in milliseconds
        this.DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
        this.PERMISSIONS_TTL = 5 * 60 * 1000; // 5 minutes for permissions (unified)

        // Listen for auth changes to invalidate caches
        this.setupAuthListener();
    }

    /**
     * Set up listener for authentication changes
     */
    setupAuthListener() {
        if (typeof window !== 'undefined') {
            console.log('🎯 CacheService: Setting up window listener for userChanged event');

            // Listen for auth state changes from authStateManager
            window.addEventListener('userChanged', (event) => {
                const { oldUser, newUser } = event.detail;
                console.log('✅ CacheService: Received userChanged event', {
                    oldUser,
                    newUser
                });
                if (this.DEBUG) {
                    console.log('🔄 CacheService: User changed event received', {
                        oldUser,
                        newUser
                    });
                }
                // ✅ OFFLINE-FIRST: Don't invalidate caches on user switch
                // Each user's work environment is preserved
                console.log('📱 OFFLINE-FIRST: Preserving all user caches for offline work capability');
            });
        }
    }

    /**
     * Get item from cache
     * @param {string} key - Cache key
     * @param {string} subKey - Sub-key within cache (optional)
     * @param {string} currentUser - Current username for validation (optional)
     * @returns {any} Cached value or null
     */
    get(key, subKey = null, currentUser = null) {
        try {
            // Check memory cache first
            const memoryCache = this.caches.get(key);
            if (memoryCache && this.isValidCache(memoryCache, currentUser)) {
                return subKey ? memoryCache.data[subKey] : memoryCache.data;
            }

            // Check localStorage
            const stored = localStorage.getItem(key);
            if (!stored) return null;

            const parsed = JSON.parse(stored);
            if (!this.isValidCache(parsed, currentUser)) {
                this.remove(key);
                return null;
            }

            // Store in memory cache for faster access
            this.caches.set(key, parsed);

            return subKey ? parsed.data[subKey] : parsed.data;
        } catch (error) {
            console.error('❌ CacheService: Failed to get cache:', error);
            return null;
        }
    }

    /**
     * Set item in cache
     * @param {string} key - Cache key
     * @param {any} data - Data to cache
     * @param {Object} options - Cache options
     * @returns {boolean} Success status
     */
    set(key, data, options = {}) {
        try {
            const ttl = options.ttl || this.getDefaultTTL(key);
            const username = options.username; // Username must be provided in options

            const cacheEntry = {
                data,
                timestamp: Date.now(),
                expiry: Date.now() + ttl,
                username,
                version: '1.0'
            };

            // Store in memory
            this.caches.set(key, cacheEntry);

            // Store in localStorage
            localStorage.setItem(key, JSON.stringify(cacheEntry));

            if (this.DEBUG) {
                console.log('✅ CacheService: Cached data:', {
                    key,
                    ttl,
                    username,
                    dataSize: JSON.stringify(data).length
                });
            }

            return true;
        } catch (error) {
            console.error('❌ CacheService: Failed to set cache:', error);
            return false;
        }
    }

    /**
     * Remove item from cache
     * @param {string} key - Cache key
     */
    remove(key) {
        this.caches.delete(key);
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('❌ CacheService: Failed to remove cache:', error);
        }
    }

    /**
     * Clear all caches
     */
    clearAll() {
        this.caches.clear();

        // Clear all known cache keys from localStorage
        Object.values(this.CACHE_KEYS).forEach(key => {
            try {
                localStorage.removeItem(key);
            } catch (error) {
                console.error('❌ CacheService: Failed to clear cache:', key, error);
            }
        });

        if (this.DEBUG) {
            console.log('✅ CacheService: Cleared all caches');
        }
    }

    /**
     * Find localStorage keys matching a pattern
     * @param {Function} pattern - Function that returns true for matching keys
     * @returns {Array<string>} Array of matching keys
     */
    findKeysByPattern(pattern) {
        const keys = [];

        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && pattern(key)) {
                    keys.push(key);
                }
            }
        } catch (error) {
            console.error('❌ CacheService: Error finding keys by pattern:', error);
        }

        return keys;
    }

    /**
     * Remove legacy cache keys from localStorage
     * Used during cache migration to clean up old key formats
     * @param {Array<string>} keys - Array of localStorage keys to remove
     * @returns {number} Number of keys removed
     */
    removeLegacyKeys(keys) {
        let removedCount = 0;

        if (!Array.isArray(keys)) {
            console.error('❌ CacheService: removeLegacyKeys requires an array of keys');
            return 0;
        }

        keys.forEach(key => {
            try {
                if (localStorage.getItem(key) !== null) {
                    localStorage.removeItem(key);
                    removedCount++;
                }
            } catch (error) {
                console.error('❌ CacheService: Failed to remove legacy key:', key, error);
            }
        });

        if (this.DEBUG && removedCount > 0) {
            console.log('✅ CacheService: Removed legacy keys:', {
                removedCount,
                totalKeys: keys.length
            });
        }

        return removedCount;
    }

    /**
     * Invalidate caches for a specific user
     * @param {string} username - Username to invalidate caches for
     */
    invalidateUserCaches(username) {
        // ✅ OFFLINE-FIRST ARCHITECTURE: Preserve all caches for offline work
        // This method is called on user switch, but we DON'T want to clear caches
        // Each user's complete work environment should be preserved

        console.log('📱 OFFLINE-FIRST: invalidateUserCaches called but preserving all caches', {
            username,
            reason: 'Offline work capability requires preserving all user data',
            preserving: [
                'Auth headers (24hr validity)',
                'Document metadata (offline access)',
                'Permission levels (correct editor mode)',
                'IndexedDB scans (document lists)',
                'User preferences (consistent UX)'
            ]
        });

        // Don't clear anything - each user's offline capability is maintained
        return;
    }

    /**
     * Check if the application is offline
     * @returns {boolean} True if offline
     */
    isOffline() {
        // Check navigator.onLine (not 100% reliable but a good start)
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
            return true;
        }

        // Could add more sophisticated checks here (failed API calls, etc.)
        return false;
    }

    /**
     * Check if a cache entry is expired
     * @param {Object} cacheEntry - Cache entry to check
     * @param {number} ttl - Time to live in milliseconds (optional)
     * @returns {boolean} True if expired
     */
    isExpired(cacheEntry, ttl = null) {
        if (!cacheEntry || !cacheEntry.timestamp) return true;

        // Rule 8: Trust cache when offline
        if (this.isOffline()) {
            if (this.DEBUG) console.log('🔄 CacheService: Offline mode - trusting cache');
            return false;
        }

        // Use provided TTL or determine based on cache type
        const effectiveTTL = ttl || this.getDefaultTTL(cacheEntry.key || '');

        // Check if expired based on timestamp
        const age = Date.now() - cacheEntry.timestamp;
        return age > effectiveTTL;
    }

    /**
     * Check if cache entry is valid
     * @param {Object} cacheEntry - Cache entry to validate
     * @param {string} currentUser - Current username (optional)
     * @returns {boolean} Valid status
     */
    isValidCache(cacheEntry, currentUser = null) {
        if (!cacheEntry || typeof cacheEntry !== 'object') return false;
        if (!cacheEntry.data || !cacheEntry.timestamp) return false;

        // Use the new isExpired method for expiration check
        if (this.isExpired(cacheEntry)) {
            return false;
        }

        // Check user match for user-specific caches
        if (cacheEntry.username && currentUser) {
            if (cacheEntry.username !== currentUser) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get default TTL for a cache key
     * @param {string} key - Cache key
     * @returns {number} TTL in milliseconds
     */
    getDefaultTTL(key) {
        if (key.includes('permissions')) {
            return this.PERMISSIONS_TTL;
        }
        return this.DEFAULT_TTL;
    }

    /**
     * Get current user - must be provided by caller to avoid circular dependency
     * @param {string} username - Current username (optional)
     * @returns {string|null} Current username
     */
    getCurrentUser(username) {
        // Username must be provided by caller to avoid circular dependency
        return username || null;
    }

    /**
     * Cache collaborative documents
     * @param {Array} documents - Documents to cache
     * @param {string} username - Username for cache
     * @returns {boolean} Success status
     */
    cacheCollaborativeDocs(documents, username) {
        return this.set(this.CACHE_KEYS.COLLABORATIVE_DOCS, {
            documents,
            username,
            timestamp: Date.now()
        }, {
            username,
            ttl: this.DEFAULT_TTL
        });
    }

    /**
     * Get cached collaborative documents
     * @param {string} username - Username to get cache for
     * @returns {Object|null} Cached documents or null
     */
    getCachedCollaborativeDocs(username) {
        const cached = this.get(this.CACHE_KEYS.COLLABORATIVE_DOCS, null, username);
        if (cached && cached.username === username) {
            return cached;
        }
        return null;
    }

    /**
     * Cache document permissions
     * @param {string} documentId - Document identifier
     * @param {Array} permissions - Permissions array
     * @returns {boolean} Success status
     */
    cacheDocumentPermissions(documentId, permissions) {
        const key = `${this.CACHE_KEYS.PERMISSIONS}_${documentId}`;
        return this.set(key, permissions, {
            ttl: this.PERMISSIONS_TTL
        });
    }

    /**
     * Get cached document permissions
     * @param {string} documentId - Document identifier
     * @param {string} currentUser - Current username for validation (optional)
     * @returns {Array|null} Cached permissions or null
     */
    getCachedDocumentPermissions(documentId, currentUser = null) {
        const key = `${this.CACHE_KEYS.PERMISSIONS}_${documentId}`;
        return this.get(key, null, currentUser);
    }

    /**
     * Get cached permission level for a specific user and document
     * @param {string} documentId - Document identifier (owner/permlink)
     * @param {string} username - Username to check permission for
     * @returns {Object|null} Permission object with level and hasPermission or null
     */
    getCachedUserPermissionLevel(documentId, username) {
        // Check user-specific permission cache
        const userKey = `${this.CACHE_KEYS.PERMISSIONS}_${documentId}_${username}`;

        console.log('🔵 OFFLINE-CACHE-DEBUG: getCachedUserPermissionLevel called', {
            documentId,
            username,
            userKey,
            localStorageKeys: Object.keys(localStorage).filter(k => k.includes('permissions'))
        });

        // Get raw cache entry to check expiration
        try {
            const stored = localStorage.getItem(userKey);
            if (!stored) {
                console.log('🔵 OFFLINE-CACHE-DEBUG: No permission in localStorage for key', userKey);
                return null;
            }

            const parsed = JSON.parse(stored);

            console.log('🔵 OFFLINE-CACHE-DEBUG: Found permission in localStorage', {
                userKey,
                parsed,
                isExpired: this.isExpired(parsed)
            });

            // Check if expired using our new method
            if (this.isExpired(parsed)) {
                // Clean up expired entry
                console.log('🔵 OFFLINE-CACHE-DEBUG: Permission expired, removing', userKey);
                this.remove(userKey);
                return null;
            }

            // Validate user match
            if (parsed.username && parsed.username !== username) {
                return null;
            }

            // Return the data portion
            const data = parsed.data || parsed;
            if (data && data.level) {
                return {
                    hasPermission: data.hasPermission !== false,
                    level: data.level,
                    timestamp: data.timestamp || parsed.timestamp || Date.now(),
                    fromCache: true
                };
            }
        } catch (error) {
            if (this.DEBUG) console.error('❌ CacheService: Failed to get user permission cache:', error);
        }

        // Check document permissions array (list of all users) as fallback
        const docPermissions = this.getCachedDocumentPermissions(documentId, username);
        if (docPermissions && Array.isArray(docPermissions)) {
            const userPerm = docPermissions.find(p => p.account === username);
            if (userPerm) {
                return {
                    hasPermission: true,
                    level: userPerm.permission_level || userPerm.level || 'readonly',
                    timestamp: Date.now(),
                    fromCache: true
                };
            }
        }

        return null;
    }

    /**
     * Cache user's permission level for a document
     * @param {string} documentId - Document identifier (owner/permlink)
     * @param {string} username - Username
     * @param {Object} permission - Permission object with level
     * @returns {boolean} Success status
     */
    cacheUserPermissionLevel(documentId, username, permission) {
        const userKey = `${this.CACHE_KEYS.PERMISSIONS}_${documentId}_${username}`;
        return this.set(userKey, permission, {
            ttl: this.PERMISSIONS_TTL,
            username: username
        });
    }

    /**
     * Get user's color preference
     * @param {string} username - Username
     * @returns {string|null} User's color or null
     */
    getUserColor(username) {
        if (!username) return null;

        const cacheKey = `${this.CACHE_KEYS.USER_COLORS}_${username}`;
        const cached = this.get(cacheKey);
        return cached?.color || null;
    }

    /**
     * Set user's color preference
     * @param {string} username - Username
     * @param {string} color - Color value
     * @returns {boolean} Success status
     */
    setUserColor(username, color) {
        if (!username || !color) return false;

        const cacheKey = `${this.CACHE_KEYS.USER_COLORS}_${username}`;
        return this.set(cacheKey, {
            color,
            username,
            timestamp: Date.now()
        });
    }

    /**
     * Get server version from cache
     * @returns {Object|null} Server version info or null
     */
    getServerVersion() {
        const cached = this.get('dlux_server_version');
        return cached;
    }

    /**
     * Cache server version
     * @param {string} version - Server version
     * @returns {boolean} Success status
     */
    cacheServerVersion(version) {
        return this.set('dlux_server_version', {
            version,
            checkTime: Date.now()
        }, {
            ttl: 24 * 60 * 60 * 1000 // 24 hours
        });
    }

    // ===== AUTH HEADER METHODS =====
    // These methods manage collaboration auth headers with proper TTL

    /**
     * Cache auth headers for a specific user
     * @param {string} username - Username to cache headers for
     * @param {Object} headers - Auth headers object
     * @returns {boolean} Success status
     */
    cacheAuthHeaders(username, headers) {
        if (!username || !headers) return false;

        const cacheKey = `${this.CACHE_KEYS.AUTH_HEADERS}_${username}`;

        return this.set(cacheKey, headers, {
            ttl: 23 * 60 * 60 * 1000, // 23 hours (auth headers expire in 24)
            username // Associate with user for invalidation
        });
    }

    /**
     * Get cached auth headers for a specific user
     * @param {string} username - Username to get headers for
     * @returns {Object|null} Cached headers or null
     */
    getCachedAuthHeaders(username) {
        if (!username) return null;

        // ✅ SINGLE SOURCE OF TRUTH: Use sessionStorage with same key pattern as v3-user
        const sessionKey = `collaborationAuthHeaders_${username}`;

        try {
            const stored = sessionStorage.getItem(sessionKey);
            if (stored) {
                const headers = JSON.parse(stored);
                if (this.DEBUG) {
                    console.log('🔑 CacheService: Retrieved auth headers from sessionStorage', {
                        username,
                        key: sessionKey,
                        hasHeaders: true
                    });
                }
                return headers;
            }
        } catch (error) {
            console.error('❌ CacheService: Failed to parse auth headers:', error);
        }

        return null;
    }

    /**
     * Clear auth headers for a specific user
     * @param {string} username - Username to clear headers for
     * @returns {boolean} Success status
     */
    clearAuthHeaders(username) {
        if (!username) return false;

        // ✅ SINGLE SOURCE OF TRUTH: Clear from sessionStorage using same key pattern as v3-user
        const sessionKey = `collaborationAuthHeaders_${username}`;

        if (this.DEBUG) {
            console.log('🔑 CacheService: Clearing auth headers from sessionStorage', {
                username,
                key: sessionKey
            });
        }

        try {
            sessionStorage.removeItem(sessionKey);
            console.log('✅ CacheService: Successfully cleared auth headers from sessionStorage', {
                username,
                key: sessionKey
            });
            return true;
        } catch (error) {
            console.error('❌ CacheService: Failed to clear auth headers:', error);
            return false;
        }
    }

    // ===== DOCUMENT STORAGE METHODS =====
    // These methods provide centralized document metadata storage
    // to replace direct localStorage usage in DocumentStorageService

    /**
     * Get all stored documents (document metadata)
     * @returns {Array} Array of stored documents
     */
    getAllDocuments() {
        try {
            const stored = localStorage.getItem(this.CACHE_KEYS.DOCUMENT_STORAGE);
            if (!stored) return [];

            const parsed = JSON.parse(stored);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.error('❌ CacheService: Failed to get documents:', error);
            return [];
        }
    }

    /**
     * Save all documents to storage
     * @param {Array} documents - Array of documents to save
     * @returns {boolean} Success status
     */
    saveAllDocuments(documents) {
        try {
            if (!Array.isArray(documents)) {
                console.error('❌ CacheService: Invalid documents array');
                return false;
            }

            const serialized = JSON.stringify(documents);
            localStorage.setItem(this.CACHE_KEYS.DOCUMENT_STORAGE, serialized);

            if (this.DEBUG) {
                console.log('✅ CacheService: Saved documents:', {
                    count: documents.length,
                    size: serialized.length
                });
            }

            return true;
        } catch (error) {
            console.error('❌ CacheService: Failed to save documents:', error);
            return false;
        }
    }

    /**
     * Get a specific document by ID
     * @param {string} id - Document ID
     * @returns {Object|null} Document object or null
     */
    getDocument(id) {
        const documents = this.getAllDocuments();
        return documents.find(doc => doc.id === id) || null;
    }

    /**
     * Save or update a document
     * @param {Object} document - Document to save/update
     * @returns {boolean} Success status
     */
    saveDocument(document) {
        if (!document || !document.id) {
            console.error('❌ CacheService: Invalid document');
            return false;
        }

        const documents = this.getAllDocuments();
        const index = documents.findIndex(doc => doc.id === document.id);

        if (index !== -1) {
            // Update existing
            documents[index] = {
                ...documents[index],
                ...document,
                lastModified: new Date().toISOString()
            };
        } else {
            // Add new
            documents.push({
                ...document,
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString()
            });
        }

        return this.saveAllDocuments(documents);
    }

    /**
     * Delete a document
     * @param {string} id - Document ID to delete
     * @returns {boolean} Success status
     */
    deleteDocument(id) {
        const documents = this.getAllDocuments();
        const filtered = documents.filter(doc => doc.id !== id);

        if (filtered.length === documents.length) {
            console.warn('⚠️ CacheService: Document not found:', id);
            return false;
        }

        return this.saveAllDocuments(filtered);
    }

    /**
     * Update document metadata
     * @param {string} documentId - Document ID
     * @param {Object} updates - Metadata updates
     * @returns {boolean} Success status
     */
    updateDocumentMetadata(documentId, updates) {
        try {
            const documents = this.getAllDocuments();
            const documentIndex = documents.findIndex(doc => doc.id === documentId);

            if (documentIndex === -1) {
                console.warn('⚠️ CacheService: Document not found for metadata update:', documentId);
                return false;
            }

            // Update document with new metadata
            documents[documentIndex] = {
                ...documents[documentIndex],
                ...updates,
                lastModified: new Date().toISOString()
            };

            return this.saveAllDocuments(documents);
        } catch (error) {
            console.error('❌ CacheService: Failed to update document metadata:', error);
            return false;
        }
    }

    /**
     * Get documents for a specific user
     * @param {string} username - Username to filter by
     * @returns {Array} Array of user's documents
     */
    getUserDocuments(username) {
        if (!username) return [];
        const documents = this.getAllDocuments();
        return documents.filter(doc => doc.owner === username);
    }

    /**
     * Clear all documents from storage
     * @returns {boolean} Success status
     */
    clearAllDocuments() {
        try {
            localStorage.removeItem(this.CACHE_KEYS.DOCUMENT_STORAGE);
            if (this.DEBUG) {
                console.log('✅ CacheService: Cleared all documents');
            }
            return true;
        } catch (error) {
            console.error('❌ CacheService: Failed to clear documents:', error);
            return false;
        }
    }

    /**
     * Get storage size info
     * @returns {Object} Storage size information
     */
    getDocumentStorageInfo() {
        const documents = this.getAllDocuments();
        const serialized = JSON.stringify(documents);
        const MAX_STORAGE_SIZE = 10 * 1024 * 1024; // 10MB limit

        return {
            documentCount: documents.length,
            totalSize: serialized.length,
            sizeLimit: MAX_STORAGE_SIZE,
            percentUsed: (serialized.length / MAX_STORAGE_SIZE) * 100
        };
    }
}

// Create singleton instance
export const cacheService = new CacheService();

// Make available globally for debugging
if (window.DEBUG) {
    window.cacheService = cacheService;
}

export default CacheService;
