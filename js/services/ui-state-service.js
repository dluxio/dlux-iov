/**
 * UI State Service
 *
 * Centralized service for managing UI-specific state.
 * This service provides a single source of truth for UI elements like
 * messages, form inputs, and loading states that were previously
 * scattered throughout the component.
 *
 * @follows Rule #3: Single Source of Truth - One authoritative source for UI state
 * @follows Rule #7: Single Responsibility - Only manages UI-specific state
 * @follows Rule #10: Immutable External State - Components use service methods, not direct assignment
 */

import { reactive } from '/js/vue.esm-browser.js';

class UIStateService {
    constructor() {
        // Make state reactive for Vue integration
        this.state = reactive({
            // Connection and status messages
            connectionMessage: 'Not connected',

            // Form inputs
            titleInput: '',
            permlinkInput: '',
            customJsonString: '{}',

            // Loading states
            isLoadingFromURL: false,
            showLoadingMessage: '',
            authModalActive: false,

            // UI flags
            isCreatingNewDocument: false,
            isInitialMount: true,
            isUnmounting: false,

            // Deferred connection states
            deferredCollabConnection: null,
            deferredLocalConnection: null,

            // Editor interaction tracking
            editorHasBeenFocused: false,
            editorInteractionCount: 0,
            isInTable: false,

            // Document operation states
            loadingDocs: false,
            saving: false,

            // Modal states
            showShareModal: false
        });

        this.DEBUG = window.DEBUG || false;

        // Track update sources for debugging
        this.lastUpdateSource = null;
    }

    /**
     * Update connection message
     * @param {string} message - Connection status message
     * @param {string} source - Source of the update for debugging
     */
    updateConnectionMessage(message, source = 'unknown') {
        if (this.DEBUG) {
            console.log('🎨 UIStateService: Updating connection message', {
                message,
                source,
                previousMessage: this.state.connectionMessage
            });
        }

        this.state.connectionMessage = message;
        this.lastUpdateSource = source;

        // Emit event for components that need to react
        window.dispatchEvent(new CustomEvent('connection-message-changed', {
            detail: {
                message,
                source
            }
        }));
    }

    /**
     * Update title input
     * @param {string} title - Title value
     * @param {string} source - Source of the update
     */
    updateTitleInput(title, source = 'unknown') {
        if (this.DEBUG) {
            console.log('🎨 UIStateService: Updating title input', {
                title,
                source,
                previousTitle: this.state.titleInput
            });
        }

        this.state.titleInput = title || '';
        this.lastUpdateSource = source;
    }

    /**
     * Update permlink input
     * @param {string} permlink - Permlink value
     * @param {string} source - Source of the update
     */
    updatePermlinkInput(permlink, source = 'unknown') {
        if (this.DEBUG) {
            console.log('🎨 UIStateService: Updating permlink input', {
                permlink,
                source,
                previousPermlink: this.state.permlinkInput
            });
        }

        this.state.permlinkInput = permlink || '';
        this.lastUpdateSource = source;
    }

    /**
     * Update custom JSON string
     * @param {string|Object} json - JSON string or object
     * @param {string} source - Source of the update
     */
    updateCustomJsonString(json, source = 'unknown') {
        if (this.DEBUG) {
            console.log('🎨 UIStateService: Updating custom JSON string', {
                jsonType: typeof json,
                source
            });
        }

        if (typeof json === 'object') {
            this.state.customJsonString = JSON.stringify(json, null, 2);
        } else {
            this.state.customJsonString = json || '{}';
        }

        this.lastUpdateSource = source;
    }

    /**
     * Update loading from URL state
     * @param {boolean} isLoading - Whether loading from URL
     * @param {string} source - Source of the update
     */
    updateLoadingFromURL(isLoading, source = 'unknown') {
        if (this.DEBUG) {
            console.log('🎨 UIStateService: Updating loading from URL', {
                isLoading,
                source,
                previousState: this.state.isLoadingFromURL
            });
        }

        this.state.isLoadingFromURL = isLoading;
        this.lastUpdateSource = source;
    }

    /**
     * Update loading message
     * @param {string} message - Loading message
     * @param {string} source - Source of the update
     */
    updateLoadingMessage(message, source = 'unknown') {
        if (this.DEBUG) {
            console.log('🎨 UIStateService: Updating loading message', {
                message,
                source
            });
        }

        this.state.showLoadingMessage = message || '';
        this.lastUpdateSource = source;
    }

    /**
     * Update auth modal active state
     * @param {boolean} isActive - Whether auth modal is active
     * @param {string} source - Source of the update
     */
    updateAuthModalActive(isActive, source = 'unknown') {
        if (this.DEBUG) {
            console.log('🎨 UIStateService: Updating auth modal active', {
                isActive,
                source,
                previousState: this.state.authModalActive
            });
        }

        this.state.authModalActive = isActive;
        this.lastUpdateSource = source;
    }

    /**
     * Update creating new document state
     * @param {boolean} isCreating - Whether creating new document
     * @param {string} source - Source of the update
     */
    updateCreatingNewDocument(isCreating, source = 'unknown') {
        if (this.DEBUG) {
            console.log('🎨 UIStateService: Updating creating new document', {
                isCreating,
                source,
                previousState: this.state.isCreatingNewDocument
            });
        }

        this.state.isCreatingNewDocument = isCreating;
        this.lastUpdateSource = source;
    }

    /**
     * Update initial mount state
     * @param {boolean} isInitial - Whether initial mount
     * @param {string} source - Source of the update
     */
    updateInitialMount(isInitial, source = 'unknown') {
        this.state.isInitialMount = isInitial;
        this.lastUpdateSource = source;
    }

    /**
     * Update unmounting state
     * @param {boolean} isUnmounting - Whether component is unmounting
     * @param {string} source - Source of the update
     */
    updateUnmountingState(isUnmounting, source = 'unknown') {
        this.state.isUnmounting = isUnmounting;
        this.lastUpdateSource = source;
    }

    /**
     * Set deferred collaboration connection
     * @param {Object} connection - Connection details
     * @param {string} source - Source of the update
     */
    setDeferredCollabConnection(connection, source = 'unknown') {
        if (this.DEBUG) {
            console.log('🎨 UIStateService: Setting deferred collab connection', {
                hasConnection: !!connection,
                source
            });
        }

        this.state.deferredCollabConnection = connection;
        this.lastUpdateSource = source;
    }

    /**
     * Clear deferred collaboration connection
     * @param {string} source - Source of the clear
     */
    clearDeferredCollabConnection(source = 'unknown') {
        if (this.DEBUG) {
            console.log('🎨 UIStateService: Clearing deferred collab connection', { source });
        }

        this.state.deferredCollabConnection = null;
        this.lastUpdateSource = source;
    }

    /**
     * Set deferred local connection
     * @param {Object} connection - Connection details
     * @param {string} source - Source of the update
     */
    setDeferredLocalConnection(connection, source = 'unknown') {
        if (this.DEBUG) {
            console.log('🎨 UIStateService: Setting deferred local connection', {
                hasConnection: !!connection,
                source
            });
        }

        this.state.deferredLocalConnection = connection;
        this.lastUpdateSource = source;
    }

    /**
     * Clear deferred local connection
     * @param {string} source - Source of the clear
     */
    clearDeferredLocalConnection(source = 'unknown') {
        if (this.DEBUG) {
            console.log('🎨 UIStateService: Clearing deferred local connection', { source });
        }

        this.state.deferredLocalConnection = null;
        this.lastUpdateSource = source;
    }

    /**
     * Update editor focus state
     * @param {boolean} hasFocus - Whether editor has been focused
     * @param {string} source - Source of the update
     */
    updateEditorFocusState(hasFocus, source = 'unknown') {
        if (this.DEBUG && !this.state.editorHasBeenFocused && hasFocus) {
            console.log('🎨 UIStateService: Editor focused for first time', { source });
        }

        if (hasFocus && !this.state.editorHasBeenFocused) {
            this.state.editorHasBeenFocused = true;
            this.state.editorInteractionCount++;
        }

        this.lastUpdateSource = source;
    }

    /**
     * Update table selection state
     * @param {boolean} isInTable - Whether selection is in table
     * @param {string} source - Source of the update
     */
    updateTableSelectionState(isInTable, source = 'unknown') {
        if (this.state.isInTable !== isInTable) {
            if (this.DEBUG) {
                console.log('🎨 UIStateService: Table selection state changed', {
                    isInTable,
                    source
                });
            }

            this.state.isInTable = isInTable;
            this.lastUpdateSource = source;
        }
    }

    /**
     * Update loading documents state
     * @param {boolean} isLoading - Whether documents are loading
     * @param {string} source - Source of the update
     */
    updateLoadingDocs(isLoading, source = 'unknown') {
        if (this.state.loadingDocs !== isLoading) {
            if (this.DEBUG) {
                console.log('🎨 UIStateService: Updating loadingDocs', {
                    isLoading,
                    source,
                    previousState: this.state.loadingDocs
                });
            }

            this.state.loadingDocs = isLoading;
            this.lastUpdateSource = source;
        }
    }

    /**
     * Update saving state
     * @param {boolean} isSaving - Whether document is saving
     * @param {string} source - Source of the update
     */
    updateSaving(isSaving, source = 'unknown') {
        if (this.state.saving !== isSaving) {
            if (this.DEBUG) {
                console.log('🎨 UIStateService: Updating saving', {
                    isSaving,
                    source,
                    previousState: this.state.saving
                });
            }

            this.state.saving = isSaving;
            this.lastUpdateSource = source;
        }
    }

    /**
     * Update share modal visibility
     * @param {boolean} isVisible - Whether share modal is visible
     * @param {string} source - Source of the update
     */
    updateShowShareModal(isVisible, source = 'unknown') {
        if (this.state.showShareModal !== isVisible) {
            if (this.DEBUG) {
                console.log('🎨 UIStateService: Updating showShareModal', {
                    isVisible,
                    source,
                    previousState: this.state.showShareModal
                });
            }

            this.state.showShareModal = isVisible;
            this.lastUpdateSource = source;
        }
    }

    /**
     * Reset all UI state to defaults
     * @param {string} source - Source of the reset
     */
    reset(source = 'unknown') {
        if (this.DEBUG) {
            console.log('🎨 UIStateService: Resetting all UI state', { source });
        }

        this.state.connectionMessage = 'Not connected';
        this.state.titleInput = '';
        this.state.permlinkInput = '';
        this.state.customJsonString = '{}';
        this.state.isLoadingFromURL = false;
        this.state.showLoadingMessage = '';
        this.state.authModalActive = false;
        this.state.isCreatingNewDocument = false;
        this.state.isInitialMount = true;
        this.state.isUnmounting = false;
        this.state.deferredCollabConnection = null;
        this.state.deferredLocalConnection = null;
        this.state.editorHasBeenFocused = false;
        this.state.editorInteractionCount = 0;
        this.state.isInTable = false;
        this.state.loadingDocs = false;
        this.state.saving = false;
        this.state.showShareModal = false;

        this.lastUpdateSource = source;

        // Emit reset event
        window.dispatchEvent(new CustomEvent('ui-state-reset', {
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
     * Get connection message
     * @returns {string}
     */
    getConnectionMessage() {
        return this.state.connectionMessage;
    }

    /**
     * Check if loading from URL
     * @returns {boolean}
     */
    isLoadingFromURL() {
        return this.state.isLoadingFromURL;
    }

    /**
     * Check if auth modal is active
     * @returns {boolean}
     */
    isAuthModalActive() {
        return this.state.authModalActive;
    }

    /**
     * Check if creating new document
     * @returns {boolean}
     */
    isCreatingNewDocument() {
        return this.state.isCreatingNewDocument;
    }

    /**
     * Check if editor has been focused
     * @returns {boolean}
     */
    hasEditorBeenFocused() {
        return this.state.editorHasBeenFocused;
    }

    /**
     * Check if selection is in table
     * @returns {boolean}
     */
    isInTable() {
        return this.state.isInTable;
    }

    /**
     * Check if loading documents
     * @returns {boolean}
     */
    isLoadingDocs() {
        return this.state.loadingDocs;
    }

    /**
     * Check if saving
     * @returns {boolean}
     */
    isSaving() {
        return this.state.saving;
    }

    /**
     * Check if share modal is visible
     * @returns {boolean}
     */
    isShareModalVisible() {
        return this.state.showShareModal;
    }
}

// Export singleton instance
export const uiStateService = new UIStateService();

// Also export class for testing
export default UIStateService;

// Make available globally for debugging
if (typeof window !== 'undefined') {
    window.uiStateService = uiStateService;
}
