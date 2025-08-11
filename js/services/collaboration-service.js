/**
 * Collaboration Service
 *
 * Single source of truth for collaboration analytics and statistics.
 * Manages collaboration info, stats, and analytics data caching.
 *
 * Follows the 8 architectural rules:
 * 1. Single Source of Truth - All collaboration data flows through this service
 * 2. Clear Separation - Service layer handles data, not UI
 * 3. No Duplicate State - Unified analytics cache
 * 4. Explicit Cache Keys - Clear naming convention
 * 5. User-Specific Caching - Respects user context
 * 6. Reactive Updates - Event-driven cache invalidation
 * 7. Predictable Behavior - Consistent 5-minute TTL (unified from 2-5 min)
 * 8. Offline-First - Leverages CacheService's offline support
 */

import { cacheService } from './cache-service.js';
import { authStateManager } from './auth-state-manager.js';

class CollaborationService {
    constructor() {
        this.DEBUG = window.DEBUG || false;

        // Memory cache for performance
        this.analyticsCache = new Map();

        // Cache key prefixes
        this.CACHE_KEYS = {
            INFO: 'dlux_collab_info',
            STATS: 'dlux_collab_stats',
            ANALYTICS: 'dlux_collab_analytics'
        };

        // Unified TTL following Option 3 (was 2-5 minutes, now consistent 5)
        this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes

        // Setup event listeners
        this.setupEventListeners();
    }

    /**
     * Setup event listeners for cache invalidation
     */
    setupEventListeners() {
        // Listen for user changes
        window.addEventListener('userChanged', (event) => {
            if (this.DEBUG) {
                console.log('📊 CollaborationService: User changed, clearing caches', event.detail);
            }
            this.clearAllCaches();
        });

        // Listen for collaboration updates
        window.addEventListener('collaborationUpdated', (event) => {
            const { documentId } = event.detail;
            if (documentId) {
                this.invalidateDocumentCache(documentId);
            }
        });
    }

    /**
     * Get collaboration info for a document
     * @param {string} documentId - Format: "owner/permlink"
     * @returns {Object|null} Collaboration info or null
     */
    getCollaborationInfo(documentId) {
        if (!documentId) return null;

        const cacheKey = `${this.CACHE_KEYS.INFO}_${documentId}`;

        // Check memory cache
        if (this.analyticsCache.has(cacheKey)) {
            const cached = this.analyticsCache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.CACHE_TTL) {
                if (this.DEBUG) console.log('📊 CollaborationService: Info from memory cache', documentId);
                return cached.data;
            }
        }

        // Check persistent cache
        const cached = cacheService.get(cacheKey);
        if (cached) {
            // Refresh memory cache
            this.analyticsCache.set(cacheKey, {
                data: cached,
                timestamp: Date.now()
            });
            if (this.DEBUG) console.log('📊 CollaborationService: Info from persistent cache', documentId);
            return cached;
        }

        return null;
    }

    /**
     * Cache collaboration info
     * @param {string} documentId - Document identifier
     * @param {Object} info - Collaboration info to cache
     */
    cacheCollaborationInfo(documentId, info) {
        if (!documentId || !info) return;

        const cacheKey = `${this.CACHE_KEYS.INFO}_${documentId}`;

        // Store in memory cache
        this.analyticsCache.set(cacheKey, {
            data: info,
            timestamp: Date.now()
        });

        // Store in persistent cache
        cacheService.set(cacheKey, info, {
            ttl: this.CACHE_TTL,
            username: authStateManager.getUser()
        });

        if (this.DEBUG) {
            console.log('📊 CollaborationService: Cached collaboration info', {
                documentId,
                info,
                username: authStateManager.getUser()
            });
        }
    }

    /**
     * Get collaboration stats for a document
     * @param {string} documentId - Format: "owner/permlink"
     * @returns {Object|null} Collaboration stats or null
     */
    getCollaborationStats(documentId) {
        if (!documentId) return null;

        const cacheKey = `${this.CACHE_KEYS.STATS}_${documentId}`;

        // Check memory cache
        if (this.analyticsCache.has(cacheKey)) {
            const cached = this.analyticsCache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.CACHE_TTL) {
                if (this.DEBUG) console.log('📊 CollaborationService: Stats from memory cache', documentId);
                return cached.data;
            }
        }

        // Check persistent cache
        const cached = cacheService.get(cacheKey);
        if (cached) {
            // Refresh memory cache
            this.analyticsCache.set(cacheKey, {
                data: cached,
                timestamp: Date.now()
            });
            if (this.DEBUG) console.log('📊 CollaborationService: Stats from persistent cache', documentId);
            return cached;
        }

        return null;
    }

    /**
     * Cache collaboration stats
     * @param {string} documentId - Document identifier
     * @param {Object} stats - Collaboration stats to cache
     */
    cacheCollaborationStats(documentId, stats) {
        if (!documentId || !stats) return;

        const cacheKey = `${this.CACHE_KEYS.STATS}_${documentId}`;

        // Store in memory cache
        this.analyticsCache.set(cacheKey, {
            data: stats,
            timestamp: Date.now()
        });

        // Store in persistent cache
        cacheService.set(cacheKey, stats, {
            ttl: this.CACHE_TTL,
            username: authStateManager.getUser()
        });

        if (this.DEBUG) {
            console.log('📊 CollaborationService: Cached collaboration stats', {
                documentId,
                stats,
                username: authStateManager.getUser()
            });
        }
    }

    /**
     * Get generic analytics data
     * @param {string} key - Analytics key
     * @returns {any|null} Analytics data or null
     */
    getAnalytics(key) {
        if (!key) return null;

        const cacheKey = `${this.CACHE_KEYS.ANALYTICS}_${key}`;

        // Check memory cache
        if (this.analyticsCache.has(cacheKey)) {
            const cached = this.analyticsCache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.CACHE_TTL) {
                return cached.data;
            }
        }

        // Check persistent cache
        const cached = cacheService.get(cacheKey);
        if (cached) {
            // Refresh memory cache
            this.analyticsCache.set(cacheKey, {
                data: cached,
                timestamp: Date.now()
            });
            return cached;
        }

        return null;
    }

    /**
     * Cache generic analytics data
     * @param {string} key - Analytics key
     * @param {any} data - Data to cache
     */
    cacheAnalytics(key, data) {
        if (!key || data === undefined) return;

        const cacheKey = `${this.CACHE_KEYS.ANALYTICS}_${key}`;

        // Store in memory cache
        this.analyticsCache.set(cacheKey, {
            data,
            timestamp: Date.now()
        });

        // Store in persistent cache
        cacheService.set(cacheKey, data, {
            ttl: this.CACHE_TTL,
            username: authStateManager.getUser()
        });
    }

    /**
     * Invalidate cache for a specific document
     * @param {string} documentId - Document to invalidate
     */
    invalidateDocumentCache(documentId) {
        if (!documentId) return;

        // Clear all cache types for this document
        const keys = [
            `${this.CACHE_KEYS.INFO}_${documentId}`,
            `${this.CACHE_KEYS.STATS}_${documentId}`
        ];

        keys.forEach(key => {
            // Clear from memory cache
            this.analyticsCache.delete(key);

            // Clear from persistent cache
            cacheService.remove(key);
        });

        if (this.DEBUG) {
            console.log('📊 CollaborationService: Invalidated document cache', documentId);
        }
    }

    /**
     * Force refresh caches for a document
     * @param {string} documentId - Document to refresh
     */
    forceRefresh(documentId) {
        if (!documentId) return;

        this.invalidateDocumentCache(documentId);

        if (this.DEBUG) {
            console.log('📊 CollaborationService: Force refreshed caches', documentId);
        }
    }

    /**
     * Clear all caches
     */
    clearAllCaches() {
        // Clear memory cache
        this.analyticsCache.clear();

        // Clear persistent caches with our prefixes using CacheService
        const prefixes = Object.values(this.CACHE_KEYS);

        // Use CacheService to find keys instead of direct localStorage access
        const keysToRemove = cacheService.findKeysByPattern(key => {
            return prefixes.some(prefix => key.startsWith(prefix));
        });

        keysToRemove.forEach(key => {
            cacheService.remove(key);
        });

        if (this.DEBUG) {
            console.log('📊 CollaborationService: Cleared all caches');
        }
    }

    /**
     * Check if data needs refresh (for UI indicators)
     * @param {string} documentId - Document to check
     * @param {string} dataType - 'info' or 'stats'
     * @returns {boolean} True if data is stale or missing
     */
    needsRefresh(documentId, dataType = 'info') {
        if (!documentId) return true;

        const cacheKey = dataType === 'stats'
            ? `${this.CACHE_KEYS.STATS}_${documentId}`
            : `${this.CACHE_KEYS.INFO}_${documentId}`;

        // Check memory cache
        if (this.analyticsCache.has(cacheKey)) {
            const cached = this.analyticsCache.get(cacheKey);
            return (Date.now() - cached.timestamp) >= this.CACHE_TTL;
        }

        // Check persistent cache
        const cached = cacheService.get(cacheKey);
        return !cached;
    }
}

// Create singleton instance
export const collaborationService = new CollaborationService();

// Make available globally for debugging
if (window.DEBUG) {
    window.collaborationService = collaborationService;
}

export default CollaborationService;
