/**
 * Document Data Service
 *
 * Centralized service for managing document-level data state.
 * This service provides a single source of truth for document properties
 * that were previously managed as scattered component state.
 *
 * @follows Rule #3: Single Source of Truth - One authoritative source for document data
 * @follows Rule #7: Single Responsibility - Only manages document data state
 * @follows Rule #10: Immutable External State - Components use service methods, not direct assignment
 */

import { reactive } from '/js/vue.esm-browser.js';

class DocumentDataService {
    constructor() {
        // Make state reactive for Vue integration
        this.state = reactive({
            // Document save state
            hasUnsavedChanges: false,
            hasUserIntent: false,

            // Document type state
            fileType: 'local', // 'local' | 'collaborative' | 'temp'
            isTemporaryDocument: false,

            // Persistence state
            hasIndexedDBPersistence: false,

            // Connection state
            connectionStatus: 'disconnected', // 'disconnected' | 'connecting' | 'connected' | 'auth-required' | 'permission-denied' | 'auth-invalid' | 'error' | 'offline'

            // Loading state (delegates to DocumentStateService)
            isLoadingDocument: false
        });

        this.DEBUG = window.DEBUG || false;

        // Track update sources for debugging
        this.lastUpdateSource = null;
    }

    /**
     * Update document save state
     * @param {boolean} hasChanges - Whether document has unsaved changes
     * @param {boolean} hasIntent - Whether user has made intentional edits
     * @param {string} source - Source of the update for debugging
     */
    updateSaveState(hasChanges, hasIntent = null, source = 'unknown') {
        if (this.DEBUG) {
            console.log('📝 DocumentDataService: Updating save state', {
                hasChanges,
                hasIntent,
                source,
                previousState: {
                    hasUnsavedChanges: this.state.hasUnsavedChanges,
                    hasUserIntent: this.state.hasUserIntent
                }
            });
        }

        this.state.hasUnsavedChanges = hasChanges;

        // Only update hasUserIntent if explicitly provided
        if (hasIntent !== null) {
            this.state.hasUserIntent = hasIntent;
        }

        this.lastUpdateSource = source;

        // Emit event for components that need to react
        window.dispatchEvent(new CustomEvent('document-save-state-changed', {
            detail: {
                hasUnsavedChanges: this.state.hasUnsavedChanges,
                hasUserIntent: this.state.hasUserIntent,
                source
            }
        }));
    }

    /**
     * Mark document as having unsaved changes
     * @param {string} source - Source of the change
     */
    markAsUnsaved(source = 'unknown') {
        this.updateSaveState(true, true, source);
    }

    /**
     * Mark document as saved
     * @param {string} source - Source of the save
     */
    markAsSaved(source = 'unknown') {
        this.updateSaveState(false, false, source);
    }

    /**
     * Update document type
     * @param {string} type - 'local' | 'collaborative' | 'temp'
     * @param {string} source - Source of the update
     */
    updateFileType(type, source = 'unknown') {
        if (this.DEBUG) {
            console.log('📝 DocumentDataService: Updating file type', {
                type,
                source,
                previousType: this.state.fileType
            });
        }

        const validTypes = ['local', 'collaborative', 'temp'];
        if (!validTypes.includes(type)) {
            console.error('Invalid file type:', type);
            return;
        }

        this.state.fileType = type;
        this.lastUpdateSource = source;

        // Update related flags based on type
        if (type === 'temp') {
            this.state.isTemporaryDocument = true;
        }

        // Emit event for components that need to react
        window.dispatchEvent(new CustomEvent('document-type-changed', {
            detail: {
                fileType: type,
                source
            }
        }));
    }

    /**
     * Update temporary document status
     * @param {boolean} isTemp - Whether document is temporary
     * @param {string} source - Source of the update
     */
    updateTemporaryStatus(isTemp, source = 'unknown') {
        if (this.DEBUG) {
            console.log('📝 DocumentDataService: Updating temporary status', {
                isTemp,
                source,
                previousStatus: this.state.isTemporaryDocument
            });
        }

        this.state.isTemporaryDocument = isTemp;
        this.lastUpdateSource = source;
    }

    /**
     * Update IndexedDB persistence status
     * @param {boolean} hasPersistence - Whether document has IndexedDB persistence
     * @param {string} source - Source of the update
     */
    updatePersistenceStatus(hasPersistence, source = 'unknown') {
        if (this.DEBUG) {
            console.log('📝 DocumentDataService: Updating persistence status', {
                hasPersistence,
                source,
                previousStatus: this.state.hasIndexedDBPersistence
            });
        }

        this.state.hasIndexedDBPersistence = hasPersistence;
        this.lastUpdateSource = source;

        // Emit event for components that need to react
        window.dispatchEvent(new CustomEvent('document-persistence-changed', {
            detail: {
                hasIndexedDBPersistence: hasPersistence,
                source
            }
        }));
    }

    /**
     * Reset all document data to defaults
     * @param {string} source - Source of the reset
     */
    reset(source = 'unknown') {
        if (this.DEBUG) {
            console.log('📝 DocumentDataService: Resetting all state', {
                source,
                previousState: { ...this.state }
            });
        }

        this.state.hasUnsavedChanges = false;
        this.state.hasUserIntent = false;
        this.state.fileType = 'local';
        this.state.isTemporaryDocument = false;
        this.state.hasIndexedDBPersistence = false;
        this.state.connectionStatus = 'disconnected';
        this.state.isLoadingDocument = false;

        this.lastUpdateSource = source;

        // Emit reset event
        window.dispatchEvent(new CustomEvent('document-data-reset', {
            detail: { source }
        }));
    }

    /**
     * Get current state snapshot
     * @returns {Object} Current state
     */
    getState() {
        return {
            ...this.state,
            lastUpdateSource: this.lastUpdateSource
        };
    }

    /**
     * Check if document has unsaved changes
     * @returns {boolean}
     */
    hasUnsavedChanges() {
        return this.state.hasUnsavedChanges;
    }

    /**
     * Check if document has user intent
     * @returns {boolean}
     */
    hasUserIntent() {
        return this.state.hasUserIntent;
    }

    /**
     * Get document type
     * @returns {string} 'local' | 'collaborative' | 'temp'
     */
    getFileType() {
        return this.state.fileType;
    }

    /**
     * Check if document is temporary
     * @returns {boolean}
     */
    isTemporary() {
        return this.state.isTemporaryDocument;
    }

    /**
     * Check if document has IndexedDB persistence
     * @returns {boolean}
     */
    hasPersistence() {
        return this.state.hasIndexedDBPersistence;
    }

    /**
     * Update connection status
     * @param {string} status - Connection status value
     * @param {string} source - Source of the update
     */
    updateConnectionStatus(status, source = 'unknown') {
        if (this.DEBUG) {
            console.log('📝 DocumentDataService: Updating connection status', {
                status,
                source,
                previousStatus: this.state.connectionStatus
            });
        }

        const validStatuses = ['idle', 'disconnected', 'connecting', 'connected', 'auth-required', 'permission-denied', 'auth-invalid', 'error', 'offline'];
        if (!validStatuses.includes(status)) {
            console.error('Invalid connection status:', status);
            return;
        }

        this.state.connectionStatus = status;
        this.lastUpdateSource = source;

        // Emit event for components that need to react
        window.dispatchEvent(new CustomEvent('connection-status-changed', {
            detail: {
                connectionStatus: status,
                source
            }
        }));
    }

    /**
     * Update loading state
     * @param {boolean} isLoading - Whether document is loading
     * @param {string} source - Source of the update
     */
    updateLoadingState(isLoading, source = 'unknown') {
        if (this.DEBUG) {
            console.log('📝 DocumentDataService: Updating loading state', {
                isLoading,
                source,
                previousState: this.state.isLoadingDocument
            });
        }

        this.state.isLoadingDocument = isLoading;
        this.lastUpdateSource = source;

        // Emit event for components that need to react
        window.dispatchEvent(new CustomEvent('loading-state-changed', {
            detail: {
                isLoadingDocument: isLoading,
                source
            }
        }));
    }

    /**
     * Get connection status
     * @returns {string}
     */
    getConnectionStatus() {
        return this.state.connectionStatus;
    }

    /**
     * Check if document is loading
     * @returns {boolean}
     */
    isLoading() {
        return this.state.isLoadingDocument;
    }
}

// Export singleton instance
export const documentDataService = new DocumentDataService();

// Also export class for testing
export default DocumentDataService;

// Make available globally for debugging
if (typeof window !== 'undefined') {
    window.documentDataService = documentDataService;
}
