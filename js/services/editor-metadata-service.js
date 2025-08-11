/**
 * Editor Metadata Service
 *
 * Centralized service for managing editor-related metadata including timestamps,
 * flags, and state tracking. This service ensures consistent handling of editor
 * lifecycle data across the application.
 *
 * @follows Rule #3: Single Source of Truth - One authoritative source for editor metadata
 * @follows Rule #7: Single Responsibility - Only manages editor metadata
 * @follows Rule #10: Immutable External State - All updates through service methods
 */

class EditorMetadataService {
    constructor() {
        this.metadata = {
            // Timestamps
            editorCreatedAt: null,
            lastSavedAt: null,
            lastModifiedAt: null,
            autoSaveTimestamp: 0,
            lastUserActivity: null,

            // Save state
            saveInProgress: false,
            autoSaveFrame: null,
            saveError: null,
            lastSaveSize: 0,

            // Editor state flags
            isInitialized: false,
            isReady: false,
            hasUnsyncedChanges: false,
            isProcessingQueue: false,

            // Document tracking
            currentDocumentId: null,
            documentVersion: 0,
            syncVersion: 0,

            // Performance tracking
            initDuration: 0,
            lastRenderTime: 0,
            updateCount: 0
        };

        // Event tracking
        this.listeners = new Map();
        this.DEBUG = window.DEBUG || false;
    }

    /**
     * Initialize editor metadata for a new document
     * @param {string} documentId - Document identifier
     * @param {string} source - Source of initialization
     */
    initializeForDocument(documentId, source = 'unknown') {
        if (this.DEBUG) {
            console.log('📊 EditorMetadataService: Initializing for document', {
                documentId,
                source,
                previousDocument: this.metadata.currentDocumentId
            });
        }

        // Reset all metadata
        this.reset();

        // Set new document
        this.metadata.currentDocumentId = documentId;
        this.metadata.editorCreatedAt = Date.now();

        this.emitChange('initialized', {
            documentId,
            source
        });
    }

    /**
     * Mark editor as ready
     * @param {string} source - Source of ready state
     */
    setEditorReady(source = 'unknown') {
        if (this.metadata.isReady) {
            console.warn('⚠️ Editor already marked as ready');
            return;
        }

        this.metadata.isReady = true;
        this.metadata.initDuration = this.metadata.editorCreatedAt
            ? Date.now() - this.metadata.editorCreatedAt
            : 0;

        if (this.DEBUG) {
            console.log('✅ EditorMetadataService: Editor ready', {
                source,
                initDuration: this.metadata.initDuration,
                documentId: this.metadata.currentDocumentId
            });
        }

        this.emitChange('ready', {
            source,
            initDuration: this.metadata.initDuration
        });
    }

    /**
     * Update save state
     * @param {boolean} inProgress - Whether save is in progress
     * @param {Object} details - Additional save details
     */
    updateSaveState(inProgress, details = {}) {
        const previousState = this.metadata.saveInProgress;
        this.metadata.saveInProgress = inProgress;

        if (inProgress) {
            this.metadata.saveError = null;
        } else {
            // Save completed
            if (details.success) {
                this.metadata.lastSavedAt = Date.now();
                this.metadata.lastSaveSize = details.size || 0;
                this.metadata.hasUnsyncedChanges = false;
                this.metadata.syncVersion = this.metadata.documentVersion;
            } else if (details.error) {
                this.metadata.saveError = details.error;
            }
        }

        if (this.DEBUG && previousState !== inProgress) {
            console.log('💾 EditorMetadataService: Save state changed', {
                inProgress,
                details,
                lastSaved: this.metadata.lastSavedAt
            });
        }

        this.emitChange('saveStateChanged', {
            inProgress,
            ...details
        });
    }

    /**
     * Track content modification
     * @param {string} source - Source of modification
     */
    markModified(source = 'unknown') {
        this.metadata.lastModifiedAt = Date.now();
        this.metadata.documentVersion++;
        this.metadata.updateCount++;

        // Check if we have unsynced changes
        if (this.metadata.syncVersion < this.metadata.documentVersion) {
            this.metadata.hasUnsyncedChanges = true;
        }

        this.metadata.lastUserActivity = Date.now();

        if (this.DEBUG && this.metadata.updateCount % 100 === 0) {
            console.log('📝 EditorMetadataService: Document modified', {
                source,
                version: this.metadata.documentVersion,
                updateCount: this.metadata.updateCount,
                hasUnsyncedChanges: this.metadata.hasUnsyncedChanges
            });
        }

        this.emitChange('modified', {
            source,
            version: this.metadata.documentVersion
        });
    }

    /**
     * Update auto-save timestamp
     * @param {string} source - Source of auto-save trigger
     */
    updateAutoSaveTimestamp(source = 'unknown') {
        this.metadata.autoSaveTimestamp = Date.now();

        if (this.metadata.autoSaveFrame) {
            cancelAnimationFrame(this.metadata.autoSaveFrame);
            this.metadata.autoSaveFrame = null;
        }
    }

    /**
     * Set auto-save frame
     * @param {number} frameId - Animation frame ID
     */
    setAutoSaveFrame(frameId) {
        if (this.metadata.autoSaveFrame) {
            cancelAnimationFrame(this.metadata.autoSaveFrame);
        }
        this.metadata.autoSaveFrame = frameId;
    }

    /**
     * Update processing queue state
     * @param {boolean} isProcessing - Whether queue is being processed
     */
    updateProcessingState(isProcessing) {
        this.metadata.isProcessingQueue = isProcessing;
    }

    /**
     * Get editor age in milliseconds
     * @returns {number} Age in milliseconds, or 0 if not initialized
     */
    getEditorAge() {
        if (!this.metadata.editorCreatedAt) {
            return 0;
        }
        return Date.now() - this.metadata.editorCreatedAt;
    }

    /**
     * Check if editor is in early initialization phase
     * @param {number} threshold - Threshold in milliseconds (default 3000ms)
     * @returns {boolean} True if within initialization phase
     */
    isInInitPhase(threshold = 3000) {
        return this.getEditorAge() < threshold;
    }

    /**
     * Get time since last save
     * @returns {number} Milliseconds since last save, or Infinity if never saved
     */
    getTimeSinceLastSave() {
        if (!this.metadata.lastSavedAt) {
            return Infinity;
        }
        return Date.now() - this.metadata.lastSavedAt;
    }

    /**
     * Get time since last modification
     * @returns {number} Milliseconds since last modification, or Infinity if never modified
     */
    getTimeSinceLastModification() {
        if (!this.metadata.lastModifiedAt) {
            return Infinity;
        }
        return Date.now() - this.metadata.lastModifiedAt;
    }

    /**
     * Check if auto-save is needed
     * @param {number} threshold - Auto-save threshold in milliseconds (default 30s)
     * @returns {boolean} True if auto-save should be triggered
     */
    needsAutoSave(threshold = 30000) {
        // Don't auto-save if:
        // - No unsynced changes
        // - Save is already in progress
        // - Within initialization phase
        // - Last save was too recent

        if (!this.metadata.hasUnsyncedChanges ||
            this.metadata.saveInProgress ||
            this.isInInitPhase() ||
            this.getTimeSinceLastSave() < 5000) { // Min 5s between saves
            return false;
        }

        return this.getTimeSinceLastModification() >= threshold;
    }

    /**
     * Get complete metadata state
     * @returns {Object} Current metadata state
     */
    getState() {
        return {
            ...this.metadata,
            editorAge: this.getEditorAge(),
            timeSinceLastSave: this.getTimeSinceLastSave(),
            timeSinceLastModification: this.getTimeSinceLastModification(),
            isInInitPhase: this.isInInitPhase()
        };
    }

    /**
     * Get metadata for specific document
     * @param {string} documentId - Document ID to check
     * @returns {Object|null} Metadata if current document, null otherwise
     */
    getDocumentMetadata(documentId) {
        if (this.metadata.currentDocumentId !== documentId) {
            return null;
        }
        return this.getState();
    }

    /**
     * Reset all metadata
     */
    reset() {
        // Cancel any pending frames
        if (this.metadata.autoSaveFrame) {
            cancelAnimationFrame(this.metadata.autoSaveFrame);
        }

        // Reset to initial state
        this.metadata = {
            editorCreatedAt: null,
            lastSavedAt: null,
            lastModifiedAt: null,
            autoSaveTimestamp: 0,
            lastUserActivity: null,
            saveInProgress: false,
            autoSaveFrame: null,
            saveError: null,
            lastSaveSize: 0,
            isInitialized: false,
            isReady: false,
            hasUnsyncedChanges: false,
            isProcessingQueue: false,
            currentDocumentId: null,
            documentVersion: 0,
            syncVersion: 0,
            initDuration: 0,
            lastRenderTime: 0,
            updateCount: 0
        };

        this.emitChange('reset', {});
    }

    /**
     * Add metadata change listener
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    onMetadataChange(callback) {
        const id = Symbol('listener');
        this.listeners.set(id, callback);

        return () => {
            this.listeners.delete(id);
        };
    }

    /**
     * Emit metadata change event
     * @param {string} type - Change type
     * @param {Object} detail - Change details
     */
    emitChange(type, detail) {
        for (const [id, callback] of this.listeners) {
            try {
                callback({
                    type,
                    detail,
                    metadata: this.getState()
                });
            } catch (error) {
                console.error('Error in metadata change listener:', error);
            }
        }
    }
}

// Create singleton instance
const editorMetadataService = new EditorMetadataService();

// Export for use in modules
export { editorMetadataService };

// Also make available globally for debugging
if (typeof window !== 'undefined') {
    window.editorMetadataService = editorMetadataService;
}
