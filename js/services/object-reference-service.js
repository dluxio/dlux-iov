/**
 * Object Reference Service
 *
 * Centralized service for managing object references and lifecycles.
 * This service provides a single source of truth for critical object references
 * like providers, editors, and handlers that were previously scattered throughout
 * the component.
 *
 * @follows Rule #3: Single Source of Truth - One authoritative source for object references
 * @follows Rule #7: Single Responsibility - Only manages object references and lifecycle
 * @follows Rule #10: Immutable External State - Components use service methods, not direct assignment
 */

class ObjectReferenceService {
    constructor() {
        // Critical object references
        this.references = {
            // WebSocket provider reference
            provider: null,

            // TipTap editor instance
            bodyEditor: null,

            // Y.js document reference
            ydoc: null,

            // IndexedDB provider reference
            indexeddbProvider: null,

            // Animation frame IDs
            awarenessHeartbeat: null,

            // Handler instances
            customJsonMessageHandler: null,

            // Drag and drop state
            dragHandleHoveredNode: null
        };

        // Lifecycle tracking
        this.lifecycleState = {
            isCleaningUp: false,
            creatingEditors: false,
            providerStatus: 'idle', // idle, connecting, connected, disconnected, error
            isCreatingProvider: false,
            isCleaningUpProvider: false,
            isUpgradingEditors: false  // Track editor upgrade state
        };

        // Provider promise tracking
        this.providerPromise = null;
        this.lastProviderSource = null;

        this.DEBUG = false; // Disable verbose logging
    }

    /**
     * Set WebSocket provider reference with proper lifecycle management
     * @param {Object|Promise} providerOrPromise - WebSocket provider instance or promise
     * @param {string} source - Source of the update for debugging
     * @returns {Promise<Object>} The provider instance
     */
    async setProvider(providerOrPromise, source = 'unknown') {
        // ALWAYS log provider setting for debugging
        console.log('🔗 ObjectReferenceService: Setting provider - DETAILED LOG', {
            hasExistingProvider: !!this.references.provider,
            existingStatus: this.lifecycleState.providerStatus,
            source,
            isPromise: providerOrPromise && typeof providerOrPromise.then === 'function',
            isCreatingProvider: this.lifecycleState.isCreatingProvider,
            providerType: providerOrPromise ? providerOrPromise.constructor.name : 'null',
            hasWs: providerOrPromise ? !!providerOrPromise.ws : false,
            providerKeys: providerOrPromise ? Object.keys(providerOrPromise) : [],
            timestamp: new Date().toISOString()
        });

        // WSFIX: Log provider details when storing
        if (providerOrPromise && typeof providerOrPromise.then !== 'function') {
            console.log('WSFIX: ObjectReferenceService storing provider', JSON.stringify({
                timestamp: new Date().toISOString(),
                source,
                providerType: providerOrPromise?.constructor?.name,
                hasIsSynced: providerOrPromise ? 'isSynced' in providerOrPromise : false,
                isSyncedValue: providerOrPromise?.isSynced,
                hasSynced: providerOrPromise ? 'synced' in providerOrPromise : false,
                syncedValue: providerOrPromise?.synced,
                hasIsAuthenticated: providerOrPromise ? 'isAuthenticated' in providerOrPromise : false,
                isAuthenticatedValue: providerOrPromise?.isAuthenticated
            }, null, 2));
        }

        // Prevent concurrent provider creation
        if (this.lifecycleState.isCreatingProvider) {
            console.warn('⚠️ Provider creation already in progress, returning existing promise');
            return this.providerPromise;
        }

        // If provider is connecting, return it instead of replacing
        if (this.references.provider && this.lifecycleState.providerStatus === 'connecting') {
            console.log('🔄 Provider is currently connecting, returning existing provider');
            return this.references.provider;
        }

        this.lifecycleState.isCreatingProvider = true;
        this.lastProviderSource = source;

        try {
            // Clean up existing provider if needed (but not if it's connecting)
            if (this.references.provider && this.lifecycleState.providerStatus !== 'connecting') {
                await this.cleanupProvider(`${source}-replacement`);
            }

            // Handle both immediate providers and promises
            let provider;
            if (providerOrPromise && typeof providerOrPromise.then === 'function') {
                this.providerPromise = providerOrPromise;
                this.lifecycleState.providerStatus = 'connecting';
                this.emitProviderStatusChange('connecting', source);

                provider = await providerOrPromise;

                // Log resolved provider details
                console.log('🔗 Provider Promise Resolved - DETAILED LOG', {
                    providerType: provider ? provider.constructor.name : 'null',
                    hasWs: provider ? !!provider.websocket : false,
                    wsExists: provider ? 'websocket' in provider : false,
                    providerKeys: provider ? Object.keys(provider) : [],
                    providerPrototype: provider ? Object.getPrototypeOf(provider) : null,
                    prototypeKeys: provider ? Object.keys(Object.getPrototypeOf(provider)) : [],
                    synced: provider ? provider.synced : 'N/A',
                    // provider.status doesn't exist in v3
                    wsStatus: provider && provider.websocket ?
                        (provider.websocket.readyState === 0 ? 'CONNECTING' :
                            provider.websocket.readyState === 1 ? 'OPEN' :
                                provider.websocket.readyState === 2 ? 'CLOSING' :
                                    provider.websocket.readyState === 3 ? 'CLOSED' : 'UNKNOWN') : 'No WebSocket',
                    wsReadyState: provider && provider.websocket ? provider.websocket.readyState : 'No websocket property',
                    source
                });

                // WSFIX: Log resolved provider state
                console.log('WSFIX: ObjectReferenceService promise resolved', JSON.stringify({
                    timestamp: new Date().toISOString(),
                    source,
                    providerType: provider?.constructor?.name,
                    hasIsSynced: provider ? 'isSynced' in provider : false,
                    isSyncedValue: provider?.isSynced,
                    hasSynced: provider ? 'synced' in provider : false,
                    syncedValue: provider?.synced,
                    hasIsAuthenticated: provider ? 'isAuthenticated' in provider : false,
                    isAuthenticatedValue: provider?.isAuthenticated
                }, null, 2));
            } else {
                provider = providerOrPromise;
            }

            // Set the provider
            this.references.provider = provider;
            this.lifecycleState.providerStatus = provider ? 'connected' : 'idle';
            this.providerPromise = null;

            // WSFIX: Log final stored provider state
            console.log('WSFIX: ObjectReferenceService provider stored', JSON.stringify({
                timestamp: new Date().toISOString(),
                source,
                hasProvider: !!this.references.provider,
                providerType: this.references.provider?.constructor?.name,
                isSynced: this.references.provider?.isSynced,
                isAuthenticated: this.references.provider?.isAuthenticated,
                lifecycleStatus: this.lifecycleState.providerStatus
            }, null, 2));

            if (this.DEBUG) {
                console.log('✅ Provider set successfully', {
                    source,
                    status: this.lifecycleState.providerStatus,
                    hasProvider: !!this.references.provider
                });
            }

            this.emitProviderStatusChange(this.lifecycleState.providerStatus, source);

            return this.references.provider;

        } catch (error) {
            console.error('❌ Failed to set provider:', error);
            this.lifecycleState.providerStatus = 'error';
            this.providerPromise = null;
            this.emitProviderStatusChange('error', source);
            throw error;
        } finally {
            this.lifecycleState.isCreatingProvider = false;
        }
    }

    /**
     * Emit provider status change event
     */
    emitProviderStatusChange(status, source) {
        window.dispatchEvent(new CustomEvent('provider-status-changed', {
            detail: {
                status,
                hasProvider: !!this.references.provider,
                source
            }
        }));
    }

    /**
     * Get WebSocket provider reference
     * @returns {Object|null}
     */
    getProvider() {
        return this.references.provider;
    }

    /**
     * Clean up WebSocket provider with proper disconnect sequence
     * @param {string} source - Source of the cleanup
     */
    async cleanupProvider(source = 'unknown') {
        if (this.DEBUG) {
            console.log('🧹 ObjectReferenceService: Cleaning up provider', {
                hasProvider: !!this.references.provider,
                status: this.lifecycleState.providerStatus,
                isCleaningUp: this.lifecycleState.isCleaningUpProvider,
                source
            });
        }

        // Prevent concurrent cleanup
        if (this.lifecycleState.isCleaningUpProvider) {
            console.log('⚠️ Provider cleanup already in progress');
            return;
        }

        if (!this.references.provider) {
            return; // Nothing to clean up
        }

        this.lifecycleState.isCleaningUpProvider = true;
        this.lastProviderSource = source;

        try {
            const provider = this.references.provider;

            // Clear awareness first
            if (provider.awareness) {
                provider.awareness.setLocalState(null);
                provider.awareness.destroy();
            }

            // Disconnect provider
            if (provider.disconnect) {
                provider.disconnect();

                // Wait for provider to disconnect (v3 pattern)
                await new Promise((resolve) => {
                    // Listen for status event
                    const statusHandler = ({ status }) => {
                        if (status === 'disconnected') {
                            provider.off('status', statusHandler);
                            resolve();
                        }
                    };
                    provider.on('status', statusHandler);

                    // Fallback timeout after 2 seconds
                    setTimeout(() => {
                        provider.off('status', statusHandler);
                        resolve();
                    }, 2000);
                });
            }

            // Destroy provider
            if (provider.destroy) {
                provider.destroy();
            }

            // Clear references
            this.references.provider = null;
            this.lifecycleState.providerStatus = 'disconnected';
            this.providerPromise = null;

            this.emitProviderStatusChange('disconnected', source);

        } catch (error) {
            console.error('❌ Error during provider cleanup:', error);
            // Still clear references even if cleanup failed
            this.references.provider = null;
            this.lifecycleState.providerStatus = 'error';
        } finally {
            this.lifecycleState.isCleaningUpProvider = false;
        }
    }

    /**
     * Set TipTap editor reference
     * @param {Object} editor - TipTap editor instance
     * @param {string} source - Source of the update
     */
    setBodyEditor(editor, source = 'unknown') {
        if (this.DEBUG) {
            console.log('🔗 ObjectReferenceService: Setting body editor', {
                hasEditor: !!editor,
                source,
                previousEditor: !!this.references.bodyEditor
            });
        }

        // Clean up previous editor if exists
        if (this.references.bodyEditor && this.references.bodyEditor !== editor) {
            this.cleanupBodyEditor('editor-replacement');
        }

        this.references.bodyEditor = editor;

        // Emit event
        window.dispatchEvent(new CustomEvent('editor-changed', {
            detail: {
                hasEditor: !!editor,
                source
            }
        }));
    }

    /**
     * Get TipTap editor reference
     * @returns {Object|null}
     */
    getBodyEditor() {
        return this.references.bodyEditor;
    }

    /**
     * Clean up TipTap editor
     * @param {string} source - Source of the cleanup
     */
    cleanupBodyEditor(source = 'unknown') {
        if (this.DEBUG) {
            console.log('🔗 ObjectReferenceService: Cleaning up body editor', {
                hasEditor: !!this.references.bodyEditor,
                source
            });
        }

        if (this.references.bodyEditor) {
            try {
                // Destroy editor if not already destroyed
                if (!this.references.bodyEditor.isDestroyed) {
                    this.references.bodyEditor.destroy();
                }
            } catch (error) {
                console.error('Error destroying editor:', error);
            }

            this.references.bodyEditor = null;
        }
    }

    /**
     * Set awareness heartbeat animation frame ID
     * @param {number} frameId - Animation frame ID
     * @param {string} source - Source of the update
     */
    setAwarenessHeartbeat(frameId, source = 'unknown') {
        if (this.DEBUG) {
            console.log('🔗 ObjectReferenceService: Setting awareness heartbeat', {
                frameId,
                source,
                previousFrame: this.references.awarenessHeartbeat
            });
        }

        // Cancel previous frame if exists
        if (this.references.awarenessHeartbeat && this.references.awarenessHeartbeat !== frameId) {
            cancelAnimationFrame(this.references.awarenessHeartbeat);
        }

        this.references.awarenessHeartbeat = frameId;
    }

    /**
     * Get awareness heartbeat frame ID
     * @returns {number|null}
     */
    getAwarenessHeartbeat() {
        return this.references.awarenessHeartbeat;
    }

    /**
     * Cancel awareness heartbeat
     * @param {string} source - Source of the cancellation
     */
    cancelAwarenessHeartbeat(source = 'unknown') {
        if (this.DEBUG) {
            console.log('🔗 ObjectReferenceService: Canceling awareness heartbeat', {
                hasFrame: !!this.references.awarenessHeartbeat,
                source
            });
        }

        if (this.references.awarenessHeartbeat) {
            cancelAnimationFrame(this.references.awarenessHeartbeat);
            this.references.awarenessHeartbeat = null;
        }
    }

    /**
     * Set custom JSON message handler
     * @param {Object} handler - Message handler instance
     * @param {string} source - Source of the update
     */
    setCustomJsonMessageHandler(handler, source = 'unknown') {
        if (this.DEBUG) {
            console.log('🔗 ObjectReferenceService: Setting custom JSON handler', {
                hasHandler: !!handler,
                source
            });
        }

        // Clean up previous handler if exists
        if (this.references.customJsonMessageHandler && this.references.customJsonMessageHandler !== handler) {
            this.cleanupCustomJsonMessageHandler('handler-replacement');
        }

        this.references.customJsonMessageHandler = handler;
    }

    /**
     * Get custom JSON message handler
     * @returns {Object|null}
     */
    getCustomJsonMessageHandler() {
        return this.references.customJsonMessageHandler;
    }

    /**
     * Clean up custom JSON message handler
     * @param {string} source - Source of the cleanup
     */
    cleanupCustomJsonMessageHandler(source = 'unknown') {
        if (this.DEBUG) {
            console.log('🔗 ObjectReferenceService: Cleaning up custom JSON handler', {
                hasHandler: !!this.references.customJsonMessageHandler,
                source
            });
        }

        if (this.references.customJsonMessageHandler) {
            try {
                // Destroy handler if it has destroy method
                if (typeof this.references.customJsonMessageHandler.destroy === 'function') {
                    this.references.customJsonMessageHandler.destroy();
                }
            } catch (error) {
                console.error('Error destroying handler:', error);
            }

            this.references.customJsonMessageHandler = null;
        }
    }

    /**
     * Set drag handle hovered node
     * @param {Object} node - ProseMirror node
     * @param {string} source - Source of the update
     */
    setDragHandleHoveredNode(node, source = 'unknown') {
        if (this.DEBUG) {
            console.log('🔗 ObjectReferenceService: Setting drag handle hovered node', {
                nodeType: node?.type?.name,
                source
            });
        }

        this.references.dragHandleHoveredNode = node;

        // Also set on window for compatibility
        if (window.dluxEditor) {
            window.dluxEditor.dragHandleHoveredNode = node;
        }
    }

    /**
     * Get drag handle hovered node
     * @returns {Object|null}
     */
    getDragHandleHoveredNode() {
        return this.references.dragHandleHoveredNode;
    }

    /**
     * Update lifecycle state
     * @param {string} key - State key
     * @param {boolean} value - State value
     * @param {string} source - Source of the update
     */
    updateLifecycleState(key, value, source = 'unknown') {
        if (this.DEBUG) {
            console.log('🔗 ObjectReferenceService: Updating lifecycle state', {
                key,
                value,
                source,
                previousValue: this.lifecycleState[key]
            });
        }

        if (key in this.lifecycleState) {
            this.lifecycleState[key] = value;

            // Emit event
            window.dispatchEvent(new CustomEvent('lifecycle-state-changed', {
                detail: {
                    key,
                    value,
                    source
                }
            }));
        } else {
            console.error('Invalid lifecycle state key:', key);
        }
    }

    /**
     * Check if cleaning up
     * @returns {boolean}
     */
    isCleaningUp() {
        return this.lifecycleState.isCleaningUp;
    }

    /**
     * Check if creating editors
     * @returns {boolean}
     */
    isCreatingEditors() {
        return this.lifecycleState.creatingEditors;
    }

    /**
     * Clean up all references
     * @param {string} source - Source of the cleanup
     */
    cleanupAll(source = 'unknown') {
        if (this.DEBUG) {
            console.log('🔗 ObjectReferenceService: Cleaning up all references', { source });
        }

        this.updateLifecycleState('isCleaningUp', true, source);

        try {
            // Clean up in proper order
            this.cancelAwarenessHeartbeat('cleanup-all');
            this.cleanupCustomJsonMessageHandler('cleanup-all');
            this.cleanupBodyEditor('cleanup-all');
            this.cleanupProvider('cleanup-all');

            // Clear remaining references
            this.references.dragHandleHoveredNode = null;

            // Reset lifecycle state
            this.lifecycleState = {
                isCleaningUp: false,
                creatingEditors: false
            };
        } catch (error) {
            console.error('Error during cleanup:', error);
            this.updateLifecycleState('isCleaningUp', false, 'cleanup-error');
        }
    }

    /**
     * Set Y.js document reference
     * @param {Object} ydoc - Y.js document instance
     * @param {string} source - Source of the update
     */
    setYDoc(ydoc, source = 'unknown') {
        if (this.DEBUG) {
            console.log('📝 ObjectReferenceService: Setting Y.js document', {
                hasDoc: !!ydoc,
                source,
                previousDoc: !!this.references.ydoc
            });
        }

        this.references.ydoc = ydoc;

        window.dispatchEvent(new CustomEvent('ydoc-changed', {
            detail: { hasDoc: !!ydoc, source }
        }));
    }

    /**
     * Get Y.js document reference
     * @returns {Object|null}
     */
    getYDoc() {
        return this.references.ydoc;
    }

    /**
     * Set IndexedDB provider reference
     * @param {Object} provider - IndexedDB provider instance
     * @param {string} source - Source of the update
     */
    setIndexedDBProvider(provider, source = 'unknown') {
        if (this.DEBUG) {
            console.log('💾 ObjectReferenceService: Setting IndexedDB provider', {
                hasProvider: !!provider,
                source
            });
        }

        this.references.indexeddbProvider = provider;
    }

    /**
     * Get IndexedDB provider reference
     * @returns {Object|null}
     */
    getIndexedDBProvider() {
        return this.references.indexeddbProvider;
    }

    /**
     * Get provider status
     * @returns {string}
     */
    getProviderStatus() {
        return this.lifecycleState.providerStatus;
    }

    /**
     * Set upgrading editors state
     * @param {boolean} isUpgrading - Whether editors are being upgraded
     */
    setUpgradingEditors(isUpgrading) {
        this.lifecycleState.isUpgradingEditors = isUpgrading;
        if (this.DEBUG) {
            console.log('🔄 ObjectReferenceService: Upgrading editors state changed', {
                isUpgrading,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Check if editors are being upgraded
     * @returns {boolean}
     */
    isUpgradingEditors() {
        return this.lifecycleState.isUpgradingEditors;
    }

    /**
     * Get all references (for debugging)
     * @returns {Object}
     */
    getAllReferences() {
        return {
            references: { ...this.references },
            lifecycleState: { ...this.lifecycleState },
            providerPromise: !!this.providerPromise,
            lastProviderSource: this.lastProviderSource
        };
    }
}

// Export singleton instance
export const objectReferenceService = new ObjectReferenceService();

// Also export class for testing
export default ObjectReferenceService;

// Make available globally for debugging
if (typeof window !== 'undefined') {
    window.objectReferenceService = objectReferenceService;
}
