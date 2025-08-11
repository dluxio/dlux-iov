/**
 * Document Storage Service
 *
 * Wrapper service that delegates document storage operations to CacheService.
 * This maintains backward compatibility while ensuring all storage operations
 * go through the centralized CacheService following architectural rules.
 */

import { cacheService } from './cache-service.js';

class DocumentStorageService {
    constructor() {
        this.STORAGE_KEY = 'dlux_tiptap_files';
        this.MAX_STORAGE_SIZE = 10 * 1024 * 1024; // 10MB limit
        this.DEBUG = window.DEBUG || false;

        // Delegate to CacheService for all operations
        this.cacheService = cacheService;
    }

    /**
     * Get all stored documents
     * @returns {Array} Array of stored documents
     */
    getAllDocuments() {
        return this.cacheService.getAllDocuments();
    }

    /**
     * Save all documents to storage
     * @param {Array} documents - Array of documents to save
     * @returns {boolean} Success status
     */
    saveAllDocuments(documents) {
        return this.cacheService.saveAllDocuments(documents);
    }

    /**
     * Get a specific document by ID
     * @param {string} id - Document ID
     * @returns {Object|null} Document object or null
     */
    getDocument(id) {
        return this.cacheService.getDocument(id);
    }

    /**
     * Add or update a document
     * @param {Object} document - Document to add/update
     * @returns {boolean} Success status
     */
    saveDocument(document) {
        return this.cacheService.saveDocument(document);
    }

    /**
     * Delete a document
     * @param {string} id - Document ID to delete
     * @returns {boolean} Success status
     */
    deleteDocument(id) {
        return this.cacheService.deleteDocument(id);
    }

    /**
     * Update metadata for a specific document
     * @param {string} documentId - Document ID
     * @param {Object} updates - Metadata updates
     * @returns {boolean} Success status
     */
    updateDocumentMetadata(documentId, updates) {
        return this.cacheService.updateDocumentMetadata(documentId, updates);
    }

    /**
     * Get documents for a specific user
     * @param {string} username - Username to filter by
     * @returns {Array} Array of user's documents
     */
    getUserDocuments(username) {
        return this.cacheService.getUserDocuments(username);
    }

    /**
     * Clear all documents from storage
     * @returns {boolean} Success status
     */
    clearAllDocuments() {
        return this.cacheService.clearAllDocuments();
    }

    /**
     * Get storage size info
     * @returns {Object} Storage size information
     */
    getStorageInfo() {
        return this.cacheService.getDocumentStorageInfo();
    }

    /**
     * Migrate from old storage format if needed
     */
    migrateOldFormat() {
        try {
            const oldData = localStorage.getItem('files');
            if (oldData && !localStorage.getItem(this.STORAGE_KEY)) {
                // Parse and save using CacheService
                const documents = JSON.parse(oldData);
                if (Array.isArray(documents)) {
                    this.cacheService.saveAllDocuments(documents);
                    localStorage.removeItem('files');
                    console.log('✅ DocumentStorageService: Migrated old storage format');
                }
            }
        } catch (error) {
            console.error('❌ DocumentStorageService: Migration failed:', error);
        }
    }
}

// Create singleton instance
export const documentStorageService = new DocumentStorageService();

// Make available globally for debugging
if (window.DEBUG) {
    window.documentStorageService = documentStorageService;
}

export default DocumentStorageService;
