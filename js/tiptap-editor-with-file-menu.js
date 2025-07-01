import methodsCommon from './methods-common.js';

/**
 * ⚠️  CRITICAL: TipTap Editor Best Practices Validation
 * 
 * Before making ANY changes to this file, you MUST:
 * 1. Read TIPTAP_OFFLINE_FIRST_BEST_PRACTICES.md
 * 2. Validate against the decision tree and checklist in .cursorrules
 * 3. Follow the three-phase offline-first architecture
 * 
 * Key Architecture Rules:
 * - Phase 1: Basic Editor (offline-first, no Y.js, no Collaboration extension)
 * - Phase 2: Lazy Y.js (after user input, IndexedDB only, keep basic editor)
 * - Phase 3: Collaborative Mode (destroy basic editor, create collaborative editor)
 * 
 * TipTap Compliance Rules:
 * - Never dynamically add/remove extensions after editor creation
 * - Always destroy and recreate editors when switching modes
 * - Create Y.js documents before collaborative editors
 * - Use consistent Y.js types (XmlFragment for TipTap Collaboration)
 * 
 * Load Collaborative Editor ONLY for:
 * - Collaborative documents (existing cloud docs)
 * - Author links (shared collaborative URLs)
 * 
 * Load Basic Editor by default for:
 * - New documents
 * - Local documents  
 * - Any non-collaborative scenario
 * 
 * COLLABORATIVE CURSOR STRATEGY (2-TIER SYSTEM):
 * 
 * TIER 1: LOCAL DOCUMENTS (offline-first with upgrade capability)
 * - New documents (default)
 * - Local file editing  
 * - Basic editors without CollaborationCursor initially
 * - Can upgrade to Tier 2 with full cursor support
 * - Methods: createBasicEditors(), createLazyYjsDocument()
 * 
 * TIER 2: CLOUD DOCUMENTS (full collaborative with cursors)
 * - Collaborative docs from cloud
 * - Author links (?owner=user&permlink=doc)
 * - "Create Collaborative" button
 * - CollaborationCursor extension included at creation
 * - Methods: createCloudEditorsWithCursors()
 * 
 * UPGRADE PATH: Local → Cloud
 * - Single clean upgrade path (destroy/recreate with full cursors)
 * - No feature fragmentation or confusing options
 * 
 * CRITICAL: NEVER add CollaborationCursor dynamically (destroys editors)
 * 
 * @see TIPTAP_OFFLINE_FIRST_BEST_PRACTICES.md
 * @see .cursorrules (TipTap Editor Validation Rules)
 */

export default {
    name: 'TipTapEditorWithFileMenu',
    
    emits: ['content-changed', 'publishPost', 'requestAuthHeaders', 'request-auth-headers', 'tosign', 'update:fileToAdd', 'document-converted', 'collaborative-data-changed'],
    
    props: {
        username: {
            type: String,
            required: true
        },
        authHeaders: {
            type: Object,
            default: () => ({})
        },
        collaborationUrl: {
            type: String,
            default: 'wss://data.dlux.io/collaboration'
        },
        initialContent: {
            type: Object,
            default: () => ({})
        },
        // New props for post integration
        fileToAdd: {
            type: Object,
            default: null
        },
        postCustomJson: {
            type: Object,
            default: () => ({})
        },
        
        // DLUX-specific props for collaborative synchronization
        dluxPostType: {
            type: String,
            default: 'blog'
        },
        
        dluxAssets: {
            type: Array,
            default: () => []
        }
    },
    
    mixins: [methodsCommon],
    
    data() {
        return {
            // Instance management
            componentId: `tiptap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            isInitializing: false,
            creatingEditors: false, // RACE CONDITION FIX: Prevent multiple editor creation calls
            isCleaningUp: false, // RACE CONDITION FIX: Prevent multiple cleanup operations
            
            // TIPTAP BEST PRACTICE: Debounced auto-save
            debouncedAutoSave: null,
            
            // Y.js creation is now immediate - no debouncing needed
            
            // Authentication state
            serverAuthFailed: false,
            lastAuthCheck: null,
            
            // File management
            currentFile: null,
            isCollaborativeMode: false,
            hasUnsavedChanges: false,
            fileType: 'local', // 'local' or 'collaborative'
            
            // TipTap editors
            titleEditor: null,
            permlinkEditor: null,
            bodyEditor: null,
            
            // Collaboration
            ydoc: null,
            provider: null,
            connectionStatus: 'disconnected',
            connectionMessage: 'Not connected',
            lastDocumentLoaded: null,
            schemaVersionMismatch: false,
            
            // Y.js components no longer needed as separate storage
            
            // Content
            content: {
                title: '',
                body: '',
                tags: [],
                custom_json: {},
                permlink: '',
                beneficiaries: []
            },
            
            // UI state
            showPermlinkEditor: false,
            showAdvancedOptions: false,
            showStatusDetails: false,
            
            // Document name editing
            isEditingDocumentName: false,
            documentNameInput: '',
            
            // Modals & UI state
            showLoadModal: false,
            showSaveModal: false,
            showShareModal: false,
            showHistoryModal: false,
            showPublishModal: false,
            showJsonPreviewModal: false,
            jsonPreviewTab: 'complete', // 'complete', 'comment', 'comment_options', 'metadata'
            
            // Local storage files
            localFiles: [],
            
            // Collaborative documents
            collaborativeDocs: [],
            loadingDocs: false,
            
            // File operations
            saving: false,
            loading: false,
            deleting: false,
            publishing: false,
            
            // Save/Load forms
            saveForm: {
                filename: '',
                storageType: 'local', // 'local' or 'cloud'
                isPublic: false,
                description: '',
                isNewDocument: false
            },
            
            // Save as process state
            saveAsProcess: {
                inProgress: false,
                step: '', // 'saving_local', 'creating_server', 'initializing', 'copying_content', 'finalizing'
                message: '',
                localBackupId: null,
                serverDocId: null,
                error: null
            },
            
            shareForm: {
                username: '',
                permission: 'readonly'
            },
            
            // Document permissions and users
            documentPermissions: [],
            connectedUsers: [],
            loadingPermissions: false,
            
            // User customization
            userColor: null,
            showColorPicker: false,
            
            // Publish form
            publishForm: {
                tags: [],
                beneficiaries: [],
                customJson: {},
                votingWeight: 100
            },
            
            // Beneficiaries input
            beneficiaryInput: {
                account: '',
                percent: 1.0
            },
            
            // Custom JSON handling
            customJsonString: '',
            customJsonError: '',
            
            // Comment options (Hive-specific)
            commentOptions: {
                allowVotes: true,
                allowCurationRewards: true,
                maxAcceptedPayout: false, // false = allow payout, true = decline payout
                percentHbd: false // false = 50/50, true = 100% power up
            },
            
            // History & diff
            documentHistory: [],
            selectedVersions: [],
            
            // UI
            dropdownOpen: {},
            
            // Tag handling
            tagInput: '',
            availableTags: ['dlux', 'blog', 'video', 'collaboration', 'dapp', '360', 'hive', 'blockchain', 'web3'],
            
            // File attachments
            attachedFiles: [],
            
            // Reactive trigger for Y.js data changes
            collaborativeDataVersion: 0,
            
            // Flag to prevent triggering change handlers during data loading
            isLoadingPublishOptions: false,
            
            // Flag to prevent clearing unsaved flag during local publish option changes
            isUpdatingPublishOptions: false,
            
            // Flag to prevent infinite loops during custom JSON updates
            isUpdatingCustomJson: false,
            
            // COMPREHENSIVE COLLABORATIVE SOLUTION ADDITIONS
            // Collaborative authors tracking
            collaborativeAuthors: [],
            
            // Current document information for URL sharing
            currentDocumentInfo: null,
            
            // Enhanced IndexedDB persistence
            indexeddbProvider: null,
            
            // Temp document tracking (prevents draft clutter)
            isTemporaryDocument: false,
            tempDocumentId: null,
            isInitializingEditors: false,
            isUpdatingPermissions: false,
            isCleaningUp: false,
            tempDocumentCreationTimer: null,
            schemaVersionMismatch: false,
            
            // Auto-refresh timer for load modal
            autoRefreshTimer: null,
            
            // IndexedDB document cache for local version detection
            indexedDBDocuments: new Set()
        };
    },
    
    computed: {
        unifiedStatusInfo() {
            // Base status object
            const status = {
                state: 'unknown',
                icon: '❓',
                message: 'Unknown Status',
                details: '',
                actions: [],
                class: 'status-unknown'
            };

            // Stable action objects to prevent infinite recursion
            const reconnectAction = { label: 'Try Reconnecting', actionType: 'reconnect' };

            // TIPTAP BEST PRACTICE: Offline-First Status Logic
            // Check if we have Y.js document (indicates collaborative capability)
            const hasYjsDocument = !!this.ydoc;
            const isConnectedToServer = this.connectionStatus === 'connected';
            const hasWebSocketProvider = !!this.provider;



            // TIPTAP BEST PRACTICE: Distinguish between local Y.js and collaborative Y.js
            if (hasYjsDocument) {
                // COLLABORATIVE MODE: Y.js + WebSocket provider (cloud documents)
                if (hasWebSocketProvider && isConnectedToServer) {
                if (this.hasUnsavedChanges) {
                    return {
                            state: 'syncing',
                            icon: '🔄',
                            message: 'Syncing changes...',
                            details: 'Real-time collaboration active - changes syncing to cloud',
                        actions: [],
                            class: 'status-syncing'
                    };
                }
                    
                    // Use cached collaborator count to prevent infinite recursion
                    const collaborators = this.connectedUsers.length;
                    if (collaborators > 1) {
                return {
                            state: 'collaborating',
                            icon: '👥',
                            message: `${collaborators} users collaborating`,
                            details: 'Real-time collaboration active',
                    actions: [],
                            class: 'status-collaborating'
                };
            }

                    return {
                        state: 'synced',
                        icon: '☁️',
                        message: 'All changes synced',
                        details: 'Connected to collaboration server - offline-first enabled',
                        actions: [],
                        class: 'status-synced'
                    };
                }

                // COLLABORATIVE MODE: Y.js + WebSocket provider but not connected
                if (hasWebSocketProvider && this.connectionStatus === 'connecting') {
                return {
                        state: 'connecting',
                        icon: '🔄',
                        message: 'Connecting to server...',
                        details: 'Offline-first: Changes saved locally, will sync when connected',
                        actions: [],
                        class: 'status-connecting'
                    };
                }

                if (hasWebSocketProvider && (this.connectionStatus === 'disconnected' || this.connectionStatus === 'offline')) {
                if (this.hasUnsavedChanges) {
                    return {
                        state: 'offline-saving',
                        icon: '💾',
                        message: 'Saving offline...',
                            details: 'Offline-first: Changes saved locally, will sync when reconnected',
                            actions: [reconnectAction],
                        class: 'status-saving'
                    };
                }
                return {
                    state: 'offline-ready',
                    icon: '📱',
                        message: 'Available offline',
                        details: 'Offline-first: Document ready, will sync when connection restored',
                        actions: [reconnectAction],
                    class: 'status-offline'
                };
            }

                if (hasWebSocketProvider && this.connectionStatus === 'error') {
                return {
                        state: 'error',
                        icon: '❌',
                        message: this.connectionMessage || 'Connection Error',
                        details: 'Offline-first: Changes saved locally, check connection and try again',
                        actions: [reconnectAction],
                        class: 'status-error'
                    };
                }

                // LOCAL MODE: Y.js + IndexedDB only (no WebSocket provider)
                // This is the dotted cloud condition - local documents with Y.js persistence
                
                // TEMP DOCUMENT: Show saving state when changes are being saved
                if (this.isTemporaryDocument) {
                    if (this.hasUnsavedChanges) {
                    return {
                            state: 'saving-local',
                            icon: '💾',
                            message: 'Saving locally...',
                            details: 'Creating draft document - changes will be saved to browser storage',
                        actions: [],
                            class: 'status-saving'
                    };
                }
                
                    return {
                        state: 'temp-ready',
                        icon: '📝',
                        message: 'Ready to edit',
                        details: 'Temporary document - will become a draft when you make changes',
                        actions: [],
                        class: 'status-temp'
                    };
                }
                
                // ACTUAL LOCAL DOCUMENT: Color-coded save states
            if (this.hasUnsavedChanges) {
                    return {
                    state: 'saving-local',
                    icon: '💾',
                    message: 'Saving locally...',
                        details: 'Local document with Y.js persistence - changes saved to browser storage',
                        actions: [],
                    class: 'status-saving'
                    };
                }
                
                return {
                state: 'saved-local',
                    icon: '✅',
                message: 'Saved locally',
                    details: 'Local document with Y.js persistence - stored in browser storage',
                    actions: [],
                class: 'status-saved'
                };
            }
                
            // FALLBACK: No Y.js document (can happen during initialization or cleanup)
            if (this.isInitializingEditors) {
                // During initialization, show temp status
                return {
                    state: 'initializing',
                    icon: '⏳',
                    message: 'Initializing...',
                    details: 'Editor is starting up',
                    actions: [],
                    class: 'status-temp'
                };
            }
            
            // During cleanup operations, show cleanup status instead of warning
            if (this.isCleaningUp) {
                return {
                    state: 'cleaning-up',
                    icon: '🧹',
                    message: 'Cleaning up...',
                    details: 'Document cleanup in progress',
                    actions: [],
                    class: 'status-temp'
                };
            }
            
            // Check if no editors exist yet (normal state before any document is loaded)
            if (!this.titleEditor && !this.bodyEditor) {
                return {
                    state: 'no-document',
                    icon: '📄',
                    message: 'No document loaded',
                    details: 'Create a new document or open an existing one to start editing',
                    actions: [],
                    class: 'status-temp'
                };
            }
            
            // Only show warning if editors exist but Y.js document is missing (unexpected state)
            console.warn('⚠️ No Y.js document found - this may indicate an initialization issue');
            return {
                state: 'unknown',
                icon: '❓',
                message: 'Unknown Status',
                details: 'No Y.js document found - please refresh the page',
                actions: [{ label: 'Refresh Page', actionType: 'refresh' }],
                class: 'status-unknown'
            };
        },

        isConnected() {
            return this.connectionStatus === 'connected';
        },
        
        // Check if user is authenticated for collaborative features
        isAuthenticated() {
            const debugInfo = {
                serverAuthFailed: this.serverAuthFailed,
                hasAuthHeaders: !!this.authHeaders,
                hasAccount: !!this.authHeaders?.['x-account'],
                hasSignature: !!this.authHeaders?.['x-signature'],
                hasChallenge: !!this.authHeaders?.['x-challenge'],
                hasPubkey: !!this.authHeaders?.['x-pubkey'],
                isExpired: this.isAuthExpired
            };

            // If we've detected server-side auth failure, return false regardless of headers
            if (this.serverAuthFailed) {
                console.log('🔐 Authentication check failed: server rejected auth', debugInfo);
                return false;
            }

            if (!this.authHeaders || 
                !this.authHeaders['x-account'] || 
                !this.authHeaders['x-signature'] || 
                !this.authHeaders['x-challenge'] || 
                !this.authHeaders['x-pubkey']) {
                console.log('🔐 Authentication check failed: missing headers', debugInfo);
                return false;
            }

            // Additional validation: check if signature and pubkey are not just empty strings
            if (this.authHeaders['x-signature'].trim() === '' || 
                this.authHeaders['x-pubkey'].trim() === '' ||
                this.authHeaders['x-account'].trim() === '') {
                console.log('🔐 Authentication check failed: empty values detected', debugInfo);
                return false;
            }

            // Check if challenge is a valid timestamp
            const challengeTime = parseInt(this.authHeaders['x-challenge']);
            if (isNaN(challengeTime) || challengeTime <= 0) {
                console.log('🔐 Authentication check failed: invalid challenge timestamp', debugInfo);
                return false;
            }

            console.log('✅ Authentication check passed', debugInfo);
            return true;
        },
        
        // Get user's preferred color (from localStorage or generate)
        getUserColor() {
            if (this.userColor) return this.userColor;
            
            const stored = localStorage.getItem(`dlux_user_color_${this.username}`);
            if (stored) {
                this.userColor = stored;
                return stored;
            }
            
            // Generate random hex color for new users
            const color = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
            this.userColor = color;
            localStorage.setItem(`dlux_user_color_${this.username}`, color);
            return color;
        },
        
        // Check if auth headers are expired (older than 23 hours)
        isAuthExpired() {
            if (!this.authHeaders || !this.authHeaders['x-challenge']) {
                console.log('🔐 Auth expired check: no headers or challenge');
                return true;
            }
            
            const challengeTime = parseInt(this.authHeaders['x-challenge']);
            const now = Math.floor(Date.now() / 1000);
            const hoursOld = (now - challengeTime) / 3600;
            const isExpired = hoursOld >= 23;
            
            console.log('🔐 Auth expiry check:', {
                challengeTime,
                now,
                hoursOld: hoursOld.toFixed(1),
                isExpired,
                threshold: '23 hours'
            });
            
            return isExpired;
        },
        
        // REMOVED: canSave() - No longer needed with auto-save architecture
        // Traditional manual save replaced with:
        // - Auto-save indicators in File menu
        // - "Publish to Cloud" for offline documents
        // - "Duplicate Document" replaces "Save As"
        
        canShare() {
            return this.currentFile && this.currentFile.type === 'collaborative' && this.isAuthenticated;
        },
        
        canDelete() {
            return this.currentFile && !this.deleting;
        },
        
        canPublish() {
            const hasBasicContent = this.content.title.trim() && this.content.body.trim() && this.content.tags.length > 0;
            
            if (!hasBasicContent) return false;
            
            // If it's a collaborative document, check permissions
            if (this.currentFile && this.currentFile.type === 'collaborative') {
                // Owner can always publish
                if (this.currentFile.owner === this.username) return true;
                
                // Check if user has postable permission (only postable can publish to Hive)
                const userPermission = this.documentPermissions.find(p => p.account === this.username);
                return userPermission && userPermission.permissionType === 'postable';
            }
            
            // For local documents, always allow if basic content exists
            return true;
        },
        
        hasValidFilename() {
            return this.saveForm.filename && this.saveForm.filename.trim().length > 0;
        },
        
        // Show collaborative features only when authenticated
        showCollaborativeFeatures() {
            return this.isAuthenticated && !this.isAuthExpired;
        },
        
        recentFiles() {
            // Combine local and collaborative files, sorted by last modified
            const allFiles = [
                ...this.localFiles.map(f => ({ ...f, type: 'local' })),
                // Only show collaborative docs if authenticated
                ...(this.showCollaborativeFeatures ? this.collaborativeDocs.map(f => ({ ...f, type: 'collaborative' })) : [])
            ];
            
            return allFiles.sort((a, b) => {
                const aDate = new Date(a.updatedAt || a.lastModified || 0);
                const bDate = new Date(b.updatedAt || b.lastModified || 0);
                return bDate - aDate;
            }).slice(0, 5); // Show 5 most recent
        },
        
        // Generate permlink from title
        generatedPermlink() {
            // Get title from content first (most reliable), then try editor
            let title = '';
            
            if (this.content.title) {
                // Primary source: content.title (strip HTML if present)
                title = this.content.title.replace(/<[^>]*>/g, '').trim();
            } else if (this.titleEditor) {
                // Secondary source: titleEditor getText()
                title = this.titleEditor.getText().trim();
            }
            
            if (!title) return '';
            
            // Clean unwanted characters and format for permlink
            title = title
                .replace(/\u00A0/g, ' ')         // Non-breaking spaces
                .replace(/\u200B/g, '')          // Zero-width spaces
                .replace(/\uFEFF/g, '')          // Byte order marks
                .replace(/[\u2000-\u206F]/g, ' ') // General punctuation spaces
                .replace(/\s+/g, ' ')            // Multiple spaces to single
                .trim();
            
            if (!title) return '';
            
            // Generate clean permlink
            return title
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
                .trim()
                .replace(/\s+/g, '-')        // Replace spaces with hyphens
                .replace(/-+/g, '-')         // Remove duplicate hyphens
                .replace(/^-|-$/g, '')       // Remove leading/trailing hyphens
                .substring(0, 255);          // Limit length
        },
        
        // Calculate save as progress based on current step
        saveAsProgress() {
            const steps = {
                'saving_local': 20,
                'creating_server': 40,
                'initializing': 60,
                'copying_content': 80,
                'finalizing': 100
            };
            return steps[this.saveAsProcess.step] || 0;
        },
        
        // Get pending uploads for display
        pendingUploads() {
            return this.getPendingUploads();
        },
        
        // ✅ TIPTAP.DEV UNIFIED ARCHITECTURE: Single document model with unified status indicators
        allDocuments() {
            console.log('🔍 Building unified document list...');
            
            // Create a map to merge local and cloud versions of the same document
            const documentMap = new Map();
            
            // ✅ TIPTAP.DEV BEST PRACTICE: Process local documents first
            this.localFiles.forEach(localFile => {
                const key = this.getDocumentKey(localFile);
                console.log('📄 Processing local file:', { 
                    name: localFile.name, 
                    key, 
                    type: localFile.type,
                    isCollaborative: localFile.isCollaborative,
                    collaborativeId: localFile.collaborativeId,
                    owner: localFile.owner,
                    permlink: localFile.permlink
                });
                
                // ✅ UNIFIED ARCHITECTURE: Local documents that have been converted to collaborative
                // should be treated as collaborative documents with local cache
                const isConvertedCollaborative = localFile.isCollaborative && localFile.owner && localFile.permlink;
                
                // ✅ FIXED: Cloud indicator should show for ALL collaborative documents
                const hasCloudCapability = isConvertedCollaborative || (localFile.isCollaborative && localFile.owner && localFile.permlink);
                
                documentMap.set(key, {
                    ...localFile,
                    // UNIFIED MODEL: Single document with dual indicators
                    hasLocalVersion: true,
                    hasCloudVersion: hasCloudCapability, // Show cloud indicator for all collaborative documents
                    localFile: localFile,
                    cloudFile: hasCloudCapability ? localFile : null, // For collaborative docs, local file IS the cloud file
                    // Prefer collaborative if it has cloud capability, otherwise local
                    preferredType: hasCloudCapability ? 'collaborative' : 'local',
                    // Status indicators
                    localStatus: this.getLocalStatus(localFile),
                    cloudStatus: hasCloudCapability ? this.getCloudStatus(localFile) : 'none'
                });
            });
            
            // ✅ TIPTAP.DEV BEST PRACTICE: Process collaborative documents and merge intelligently
            if (this.showCollaborativeFeatures) {
                this.collaborativeDocs.forEach(cloudFile => {
                    const key = this.getDocumentKey(cloudFile);
                    const existing = documentMap.get(key);
                    
                    console.log('☁️ Processing cloud file:', { 
                        owner: cloudFile.owner, 
                        permlink: cloudFile.permlink, 
                        key,
                        hasExisting: !!existing,
                        existingType: existing?.type
                    });
                    
                    if (existing) {
                        // ✅ MERGE: Existing local version found
                        console.log('🔄 Merging local and cloud versions:', key);
                        
                        // If the existing document is already a converted collaborative document,
                        // just update the cloud metadata but keep the unified structure
                        if (existing.isCollaborative && existing.owner && existing.permlink) {
                            console.log('📄 Document already converted, updating cloud metadata only', {
                                existingKey: key,
                                existingId: existing.id,
                                existingOwner: existing.owner,
                                existingPermlink: existing.permlink,
                                cloudOwner: cloudFile.owner,
                                cloudPermlink: cloudFile.permlink
                            });
                            documentMap.set(key, {
                                ...existing,
                                // Update with latest cloud metadata
                                documentName: cloudFile.documentName || existing.documentName,
                                title: cloudFile.title || existing.title,
                                description: cloudFile.description || existing.description,
                                updatedAt: cloudFile.updatedAt || existing.updatedAt,
                                // Keep unified structure
                                cloudFile: cloudFile,
                                cloudStatus: this.getCloudStatus(cloudFile)
                            });
                        } else {
                            // Regular merge for non-converted documents
                            documentMap.set(key, {
                                ...existing,
                                ...cloudFile, // Cloud file data takes precedence for metadata
                                // Keep local file reference for actions
                                localFile: existing.localFile,
                                // Add cloud file reference
                                cloudFile: cloudFile,
                                // Update status flags
                                hasLocalVersion: existing.hasLocalVersion,
                                hasCloudVersion: true,
                                // TIPTAP BEST PRACTICE: Prefer cloud version for collaborative documents
                                preferredType: 'collaborative',
                                cloudStatus: this.getCloudStatus(cloudFile),
                                localStatus: existing.localStatus
                            });
                        }
                    } else {
                        // ✅ CLOUD-ONLY: Check if it has IndexedDB cache (offline-first pattern)
                        const localStatus = this.getLocalStatus(cloudFile);
                        console.log('☁️ Cloud-only document:', key, { localStatus });
                        
                        documentMap.set(key, {
                            ...cloudFile,
                            hasLocalVersion: localStatus !== 'none', // Dynamic based on IndexedDB check
                            hasCloudVersion: true,
                            localFile: null,
                            cloudFile: cloudFile,
                            preferredType: 'collaborative',
                            localStatus: localStatus,
                            cloudStatus: this.getCloudStatus(cloudFile)
                        });
                    }
                });
            }
            
            // ✅ TIPTAP.DEV COMPLIANCE: IndexedDB is a CACHE, not a separate document source
            // We don't create separate entries for IndexedDB-only documents
            // They are cached versions of cloud documents or orphaned cache entries
            
            // Convert map to array and sort by most recent activity
            const allFiles = Array.from(documentMap.values());
            
            console.log('📋 Final unified document list:', allFiles.map(f => ({
                key: this.getDocumentKey(f),
                name: f.name || f.documentName || f.permlink,
                hasLocal: f.hasLocalVersion,
                hasCloud: f.hasCloudVersion,
                preferredType: f.preferredType,
                isCollaborative: f.isCollaborative,
                cloudStatus: f.cloudStatus,
                owner: f.owner,
                permlink: f.permlink
            })));
            
            return allFiles.sort((a, b) => {
                const aDate = new Date(a.updatedAt || a.lastModified || 0);
                const bDate = new Date(b.updatedAt || b.lastModified || 0);
                return bDate - aDate;
            });
        },

        
        saveButtonText() {
            if (this.saving || this.saveAsProcess.inProgress) {
                return 'Saving...';
            }
            return this.saveForm.isNewDocument ? 'Save' : 'Save';
        },

        saveButtonDisabled() {
            if (this.saveAsProcess.inProgress) return true;
            if (!this.hasValidFilename) return true;
            if (this.saving) return true;
            if (this.saveForm.storageType === 'cloud' && (!this.isAuthenticated || this.isAuthExpired)) return true;
            return false;
        },

        cancelButtonText() {
            return this.saveAsProcess.inProgress ? 'Processing...' : 'Cancel';
        },

        documentCreationMessage() {
            if (this.currentFile && this.currentFile.type === 'collaborative') {
                return 'Your content will be copied to the new document.';
            }
            return 'You will switch to collaborative editing mode.';
        },

        saveFormTitle() {
            return this.saveForm.filename ? 'Save As' : 'New Collaborative Document';
        },
        
        avatarUrl() {
            return `https://images.hive.blog/u/${this.username}/avatar/small`;
        },
        
        ownerAvatarUrl() {
            return `https://images.hive.blog/u/${this.currentFile?.owner}/avatar/small`;
        },

        // Get collaborative documents owned by current user
        ownedCloudFiles() {
            if (!this.showCollaborativeFeatures || !this.authHeaders['x-account']) {
                return [];
            }
            return this.collaborativeDocs.filter(doc => doc.owner === this.authHeaders['x-account']);
        },

        // Check if current user should have read-only access to the collaborative document
        isReadOnlyMode() {
            // Only applies to collaborative documents
            if (!this.currentFile || this.currentFile.type !== 'collaborative') {
                console.log('🔐 Not a collaborative document, allowing full access');
                return false;
            }
            
            // Document owner always has full access (even when offline)
            if (this.currentFile.owner === this.username) {
                console.log('🔐 User is document owner, allowing full access');
                return false;
            }
            
            // OFFLINE-FIRST FIX: Don't enforce read-only mode when offline
            // If user could access the document, they likely have permissions
            if (this.connectionStatus === 'offline' || this.connectionStatus === 'disconnected') {
                console.log('🔐 Offline mode: Allowing editing (offline-first principle)');
                return false;
            }
            
            // Debug: Log current state
            console.log('🔐 Permission check debug:', {
                username: this.username,
                owner: this.currentFile.owner,
                documentPermissions: this.documentPermissions,
                isArray: Array.isArray(this.documentPermissions),
                length: this.documentPermissions?.length,
                connectionStatus: this.connectionStatus
            });
            
            // ENHANCED DEBUG: Log each permission in detail
            if (Array.isArray(this.documentPermissions)) {
                console.log('🔐 Detailed permissions:', this.documentPermissions.map(p => ({
                    account: p.account,
                    permissionType: p.permissionType,
                    isCurrentUser: p.account === this.username
                })));
            }
            
            // Ensure documentPermissions is an array
            if (!Array.isArray(this.documentPermissions)) {
                console.warn('🔒 documentPermissions is not an array, defaulting to read-only mode');
                return true;
            }
            
            // Check user's permission level
            const userPermission = this.documentPermissions.find(p => p.account === this.username);
            
            // ENHANCED DEBUG: Log permission search result
            console.log('🔐 Permission search result:', {
                searchingFor: this.username,
                foundPermission: userPermission,
                allAccounts: this.documentPermissions.map(p => p.account)
            });
            
            // If no permission found, default to read-only for safety (when online)
            if (!userPermission) {
                console.log('🔒 No permission found for user, defaulting to read-only mode');
                return true;
            }
            
            // Only 'readonly' permission type should be read-only
            // Users with 'editable' or 'postable' can edit content
            const isReadOnly = userPermission.permissionType === 'readonly';
            
            console.log(`🔐 Permission check for ${this.username}: ${userPermission.permissionType}, read-only: ${isReadOnly}`);
            
            return isReadOnly;
        },

        // FIXED: Get beneficiaries using same logic as add/remove methods
        displayBeneficiaries() {
            // Depend on collaborativeDataVersion for reactivity
            this.collaborativeDataVersion; // eslint-disable-line no-unused-expressions
            
            // Use the same logic as addCollaborativeBeneficiary/removeBeneficiary
                return this.getBeneficiaries();
        },

        // FIXED: Get tags using same logic as add/remove methods  
        displayTags() {
            // Depend on collaborativeDataVersion for reactivity
            this.collaborativeDataVersion; // eslint-disable-line no-unused-expressions
            
            // Use the same logic as addCollaborativeTag/removeTag
                return this.getTags();
        },

        // FIXED: Get custom JSON for display (computed property without setter to avoid cursor issues)
        displayCustomJson() {
            // Depend on collaborativeDataVersion for reactivity
            this.collaborativeDataVersion; // eslint-disable-line no-unused-expressions
            
            // Use the same logic as setCustomJsonField/removeCustomJsonField
            const customJson = this.getCustomJson();
            return Object.keys(customJson).length > 0 ? JSON.stringify(customJson, null, 2) : '';
        },

        // TIPTAP UNIFIED ARCHITECTURE: Cloud icon system for all documents
        documentTitleIndicator() {
            // TIPTAP BEST PRACTICE: Check for WebSocket provider to determine cloud vs local
            // Local documents: Y.js + IndexedDB only (dotted cloud)
            // Collaborative documents: Y.js + IndexedDB + WebSocket provider (solid/slashed cloud)
            const hasWebSocketProvider = !!this.provider;
            
            if (!hasWebSocketProvider) {
                // Local document with Y.js persistence (dotted cloud)
                return `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-muted" style="opacity: 0.6;">
                        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" stroke-dasharray="2,2"/>
                    </svg>
                `;
            }
            
            // Collaborative document with WebSocket provider - check connection status
            if (this.connectionStatus === 'connecting') {
                // Spinner cloud (connecting)
                return `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-primary">
                        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
                        <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1">
                            <animateTransform attributeName="transform" type="rotate" values="0 12 12;360 12 12" dur="1s" repeatCount="indefinite"/>
                        </circle>
                    </svg>
                `;
            }
            
            if (this.connectionStatus === 'connected') {
                // Solid cloud (connected)
                const color = this.hasUnsavedChanges ? 'text-warning' : 'text-success';
                return `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="${color}">
                        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
                    </svg>
                `;
            }
            
            // Offline/disconnected (slashed cloud)
            return `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-warning">
                    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
                    <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" stroke-width="2"/>
                </svg>
            `;
        },

        // COMPREHENSIVE SOLUTION: Enhanced connection status message
        getConnectionStatusMessage() {
            if (!this.isCollaborativeMode) {
                return 'Local Mode - Offline-first editing';
            }
            
            const authors = this.getCollaborativeAuthors();
            const authorCount = authors.length;
            const hasMultipleAuthors = authorCount > 1;
            
            switch (this.connectionStatus) {
                case 'connected':
                    if (hasMultipleAuthors) {
                        return `Connected - Collaborating with ${authorCount} authors`;
                    }
                    return 'Connected - Real-time collaboration active';
                    
                case 'connecting':
                    return 'Connecting to collaboration server...';
                    
                case 'disconnected':
                    if (hasMultipleAuthors) {
                        return `Offline - ${authorCount} authors in document`;
                    }
                    return 'Disconnected - Working offline';
                    
                case 'offline':
                    if (hasMultipleAuthors) {
                        return `Offline Mode - ${authorCount} authors in document`;
                    }
                    return 'Offline Mode - Local editing only';
                    
                default:
                    return this.connectionMessage || 'Status unknown';
            }
        },

        // COMPREHENSIVE SOLUTION: Show collaborative authors display
        showCollaborativeAuthorsDisplay() {
            const authors = this.getCollaborativeAuthors();
            return this.isCollaborativeMode && authors.length > 0;
        },

        // COMPREHENSIVE SOLUTION: Get shareable URL for current document
        shareableDocumentURL() {
            return this.generateShareableURL();
        },

    },
    
    methods: {
        // Helper method to generate unique document key for merging local/cloud versions
        getDocumentKey(file) {
            console.log('🔑 Generating document key for:', { 
                name: file.name, 
                id: file.id,
                owner: file.owner, 
                permlink: file.permlink,
                collaborativeId: file.collaborativeId,
                isCollaborative: file.isCollaborative,
                type: file.type
            });
            
            // ✅ TIPTAP.DEV UNIFIED ARCHITECTURE: Use consistent document ID pattern
            
            // PRIORITY 1: For collaborative documents (cloud documents), use owner/permlink
            if (file.owner && file.permlink) {
                const key = `${file.owner}/${file.permlink}`;
                console.log('🔑 Cloud/Collaborative document key:', key);
                return key;
            }
            
            // PRIORITY 2: For local documents that have been converted to collaborative
            if (file.collaborativeId) {
                console.log('🔑 Converted local document key:', file.collaborativeId);
                return file.collaborativeId;
            }
            
            // PRIORITY 3: For local documents with collaborative ID pattern (converted documents)
            const localKey = file.id || file.name || file.documentName || file.filename;
            if (localKey && localKey.includes('/') && localKey.split('/').length === 2 && file.isCollaborative) {
                console.log('🔑 Collaborative local document key (ID pattern):', localKey);
                return localKey;
            }
            
            // PRIORITY 4: For pure local documents, prefix to avoid conflicts with collaborative pattern
            const prefixedKey = `local:${localKey}`;
            console.log('🔑 Pure local document key:', prefixedKey);
            return prefixedKey;
        },

        // Get local document status - TipTap.dev offline-first pattern
        getLocalStatus(file) {
            if (!file) return 'none';
            
            const documentKey = this.getDocumentKey(file);
            
            // For local documents (localStorage), they always have local status
            if (file.id && !file.owner) {
                // This is a localStorage document
                if (this.hasUnsavedChanges && this.isCurrentDocument(file)) {
                    return 'saving'; // Orange - has unsaved changes
                }
                return 'saved'; // Blue - saved locally
            }
            
            // For cloud documents, check if they're cached in IndexedDB (offline-first pattern)
            if (file.owner && file.permlink) {
                // Debug logging for cloud documents
                console.log('🔍 Checking local cache for cloud document:', documentKey, {
                    hasIndexedDBCache: !!this.indexedDBDocuments,
                    cacheSize: this.indexedDBDocuments?.size || 0,
                    existsInCache: this.indexedDBDocuments?.has(documentKey),
                    allCachedDocs: this.indexedDBDocuments ? Array.from(this.indexedDBDocuments) : []
                });
                
                // Check if this cloud document is cached locally in IndexedDB
                if (this.indexedDBDocuments && this.indexedDBDocuments.has(documentKey)) {
                    // Check if currently saving
                    if (this.hasUnsavedChanges && this.isCurrentDocument(file)) {
                        return 'saving'; // Orange - has unsaved changes
                    }
                    return 'saved'; // Blue - cached locally in IndexedDB
                }
                
                return 'none'; // Cloud document not cached locally yet
            }
            
            return 'none'; // Unknown document type
        },

        // Get cloud document status  
        getCloudStatus(cloudFile) {
            if (!cloudFile) return 'none';
            
            // ✅ FIXED: Determine cloud status based on document properties and authentication
            // Check if this is a collaborative document (has owner/permlink)
            const isCollaborativeDoc = cloudFile.isCollaborative && cloudFile.owner && cloudFile.permlink;
            if (!isCollaborativeDoc) return 'none';
            
            // Check if user is authenticated (required for cloud features)
            if (!this.isAuthenticated || this.isAuthExpired) {
                return 'available'; // Gray - collaborative document but user not authenticated
            }
            
            // Check if this is the currently open document to determine connection status
            const isCurrentDoc = this.isCurrentDocument(cloudFile);
            
            if (isCurrentDoc) {
                // For currently open document, check WebSocket connection status
                if (this.provider && this.connectionStatus === 'connected') {
                    return 'synced'; // Green - synced to cloud
                } else if (this.provider && this.connectionStatus === 'connecting') {
                    return 'syncing'; // Yellow - syncing to cloud
                } else if (this.hasUnsavedChanges) {
                    return 'pending'; // Orange - has unsynced changes
                }
                return 'available'; // Gray - collaborative but not connected
            } else {
                // For non-current documents, show as available if user can access them
                const canAccess = cloudFile.owner === this.username || // User owns it
                                this.documentPermissions?.some(p => p.account === this.username); // User has permissions
                
                return canAccess ? 'available' : 'available'; // Gray - available in cloud
            }
        },

        // Status styling helpers
        getLocalStatusClass(status) {
            switch (status) {
                case 'saved': return 'text-primary'; // Blue - saved locally
                case 'saving': return 'text-warning'; // Orange - saving changes
                default: return 'text-muted';
            }
        },

        getLocalStatusTitle(status) {
            switch (status) {
                case 'saved': return 'Saved locally in browser storage';
                case 'saving': return 'Saving changes locally...';
                default: return 'Not saved locally';
            }
        },

        getCloudStatusClass(status) {
            switch (status) {
                case 'synced': return 'text-success'; // Green - synced to cloud
                case 'syncing': return 'text-info'; // Blue - syncing to cloud
                case 'pending': return 'text-warning'; // Orange - has unsynced changes
                case 'available': return 'text-secondary'; // Gray - available but not connected
                default: return 'text-muted';
            }
        },

        getCloudStatusTitle(status) {
            switch (status) {
                case 'synced': return 'Synced to cloud and up to date';
                case 'syncing': return 'Syncing changes to cloud...';
                case 'pending': return 'Has changes not yet synced to cloud';
                case 'available': return 'Collaborative document - click to connect to cloud';
                default: return 'Not a collaborative document';
            }
        },

        // Check if document has unsaved changes
        hasUnsavedChangesForDocument(file) {
            if (!this.hasUnsavedChanges || !this.currentFile) return false;
            
            // Check if this is the currently open document
            if (file.hasLocalVersion && this.currentFile.id === file.localFile?.id) return true;
            if (file.hasCloudVersion && this.currentFile.owner === file.cloudFile?.owner && this.currentFile.permlink === file.cloudFile?.permlink) return true;
            
            return false;
        },

        // Helper method to check if a file is the currently open document
        isCurrentDocument(file) {
            if (!this.currentFile || !file) return false;
            
            // Check by document key (works for both local and cloud documents)
            const currentKey = this.getDocumentKey(this.currentFile);
            const fileKey = this.getDocumentKey(file);
            
            return currentKey === fileKey;
        },

        // Helper method to create IndexedDB persistence and update cache
        createIndexedDBPersistence(documentId, ydoc) {
            const IndexeddbPersistence = window.IndexeddbPersistence || 
                                       (window.TiptapCollaborationBundle && window.TiptapCollaborationBundle.IndexeddbPersistence);
            
            if (IndexeddbPersistence && documentId && ydoc) {
                this.indexeddbProvider = new IndexeddbPersistence(documentId, ydoc);
                
                // Update our cache
                this.indexedDBDocuments.add(documentId);
                
                console.log('✅ IndexedDB persistence created for:', documentId);
                return this.indexeddbProvider;
            }
            
            return null;
        },

        // ✅ TIPTAP.DEV UNIFIED ARCHITECTURE: Document conversion methods
        // Convert local document to collaborative document (upgrade path)
        async convertLocalToCollaborative(localFile, collaborativeMetadata) {
            console.log('🔄 Converting local document to collaborative:', localFile.name, {
                originalId: localFile.id,
                newOwner: collaborativeMetadata.owner,
                newPermlink: collaborativeMetadata.permlink
            });
            
            // ✅ TIPTAP.DEV UNIFIED ARCHITECTURE: Transform local document to collaborative
            // Instead of creating separate entries, we upgrade the existing local document
            const updatedLocalFile = {
                ...localFile,
                // Add collaborative metadata while preserving local document structure
                collaborativeId: `${collaborativeMetadata.owner}/${collaborativeMetadata.permlink}`,
                owner: collaborativeMetadata.owner,
                permlink: collaborativeMetadata.permlink,
                documentName: collaborativeMetadata.documentName || localFile.name,
                isCollaborative: true,
                type: 'collaborative', // Change type to collaborative
                // Preserve original local ID for IndexedDB persistence
                originalLocalId: localFile.id,
                // CRITICAL: Update the document ID to use collaborative pattern for proper merging
                id: `${collaborativeMetadata.owner}/${collaborativeMetadata.permlink}`
            };
            
            console.log('🔄 Updated local file structure:', {
                oldId: localFile.id,
                newId: updatedLocalFile.id,
                collaborativeId: updatedLocalFile.collaborativeId,
                isCollaborative: updatedLocalFile.isCollaborative,
                type: updatedLocalFile.type
            });
            
            // Update localStorage with collaborative metadata
            const files = JSON.parse(localStorage.getItem('dlux_tiptap_files') || '[]');
            const fileIndex = files.findIndex(f => f.id === localFile.id);
            if (fileIndex !== -1) {
                // CRITICAL: Remove old entry and add new one with collaborative ID
                files.splice(fileIndex, 1);
                files.push(updatedLocalFile);
                localStorage.setItem('dlux_tiptap_files', JSON.stringify(files));
                console.log('✅ Local file metadata updated with collaborative information');
                console.log('🔍 Updated localStorage entry:', updatedLocalFile);
            } else {
                console.warn('⚠️ Could not find local file to update:', localFile.id);
            }
            
            // CRITICAL FIX: Transfer Y.js content from old local IndexedDB to new collaborative IndexedDB
            await this.transferYjsContentToCollaborative(localFile.id, updatedLocalFile.id);
            
            // Refresh local files list to reflect the change
            await this.loadLocalFiles();
            
            console.log('✅ Local document converted to collaborative with unified architecture');
            return updatedLocalFile;
        },

        // CRITICAL FIX: Transfer Y.js content from local IndexedDB to collaborative IndexedDB
        async transferYjsContentToCollaborative(oldLocalId, newCollaborativeId) {
            console.log('🔄 Transferring Y.js content from local to collaborative:', {
                from: oldLocalId,
                to: newCollaborativeId
            });
            
            try {
                const bundle = window.TiptapCollaboration?.default || window.TiptapCollaboration;
                if (!bundle) {
                    console.warn('⚠️ TipTap collaboration bundle not available for content transfer');
                    return;
                }
                
                const Y = bundle.Y?.default || bundle.Y;
                const IndexeddbPersistence = bundle.IndexeddbPersistence?.default || bundle.IndexeddbPersistence;
                
                if (!Y || !IndexeddbPersistence) {
                    console.warn('⚠️ Y.js or IndexeddbPersistence not available for content transfer');
                    return;
                }
                
                // Create temporary Y.js documents for content transfer
                const sourceDoc = new Y.Doc();
                const targetDoc = new Y.Doc();
                
                // Load content from old local IndexedDB
                const sourceProvider = new IndexeddbPersistence(oldLocalId, sourceDoc);
                await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => reject(new Error('Source IndexedDB sync timeout')), 5000);
                    sourceProvider.once('synced', () => {
                        clearTimeout(timeout);
                        resolve();
                    });
                });
                
                // ✅ VERIFIED: No direct XmlFragment manipulation - using binary state transfer
                console.log('📥 Loaded content from local IndexedDB - using binary state transfer');
                
                // ✅ FIXED: Use Y.js document state transfer instead of fragment manipulation
                // This is the safest and most reliable method for Y.js content transfer
                const sourceState = Y.encodeStateAsUpdate(sourceDoc);
                Y.applyUpdate(targetDoc, sourceState);
                
                console.log('📋 Applied Y.js document state transfer (binary update method)');
                
                // Save to new collaborative IndexedDB
                const targetProvider = new IndexeddbPersistence(newCollaborativeId, targetDoc);
                await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => reject(new Error('Target IndexedDB sync timeout')), 5000);
                    targetProvider.once('synced', () => {
                        clearTimeout(timeout);
                        resolve();
                    });
                });
                
                console.log('📤 Content transferred to collaborative IndexedDB successfully');
                
                // Clean up temporary documents
                sourceProvider.destroy();
                targetProvider.destroy();
                sourceDoc.destroy();
                targetDoc.destroy();
                
                // Optional: Clean up old local IndexedDB database
                // Note: We keep it for now in case of rollback needs
                console.log('💡 Old local IndexedDB preserved for potential rollback:', oldLocalId);
                
                console.log('✅ Y.js content transfer completed successfully');
                
            } catch (error) {
                console.error('❌ Failed to transfer Y.js content:', error);
                // Don't throw - conversion should continue even if content transfer fails
            }
        },

        // Link existing collaborative document to local storage (for offline access)
        async linkCollaborativeToLocal(cloudFile) {
            console.log('🔗 Linking collaborative document to local storage:', cloudFile.permlink);
            
            // Create local file entry with collaborative metadata
            const localFileEntry = {
                id: `${cloudFile.owner}/${cloudFile.permlink}`,
                name: cloudFile.documentName || cloudFile.permlink,
                documentName: cloudFile.documentName,
                collaborativeId: `${cloudFile.owner}/${cloudFile.permlink}`,
                owner: cloudFile.owner,
                permlink: cloudFile.permlink,
                isCollaborative: true,
                isOfflineFirst: true,
                lastModified: cloudFile.updatedAt || new Date().toISOString(),
                createdAt: new Date().toISOString()
            };
            
            // Add to localStorage
            const files = JSON.parse(localStorage.getItem('dlux_tiptap_files') || '[]');
            const existingIndex = files.findIndex(f => f.collaborativeId === localFileEntry.collaborativeId);
            
            if (existingIndex === -1) {
                files.push(localFileEntry);
                localStorage.setItem('dlux_tiptap_files', JSON.stringify(files));
                console.log('✅ Collaborative document linked to local storage');
            } else {
                console.log('📄 Collaborative document already linked to local storage');
            }
            
            // Refresh local files list
            await this.loadLocalFiles();
            
            return localFileEntry;
        },

        // Reusable editor extensions builder - eliminates duplicate code
        getEnhancedExtensions(field, bundle, options = {}) {
            const {
                includeCursor = false,
                includeEnhanced = false,
                cursorConfig = null
            } = options;

            // Enhanced extensions for consistent UX across both tiers
            if (includeEnhanced) {
                const enhancedExtensions = [];
                
                // Add Link extension (NOT part of StarterKit - must be added explicitly)
                if (bundle?.Link || window.TiptapLink) {
                    const Link = bundle.Link?.default || bundle.Link || window.TiptapLink;
                    enhancedExtensions.push(Link.configure({
                        openOnClick: false,
                        HTMLAttributes: {
                            class: 'text-primary',
                            target: '_blank',
                            rel: 'noopener noreferrer'
                        }
                    }));
                }
                
                // Add Typography extension for better markdown-like shortcuts
                if (bundle?.Typography || window.TiptapTypography) {
                    const Typography = bundle.Typography?.default || bundle.Typography || window.TiptapTypography;
                    enhancedExtensions.push(Typography.configure({
                        openDoubleQuote: '"',
                        closeDoubleQuote: '"',
                        openSingleQuote: "'",
                        closeSingleQuote: "'",
                        ellipsis: '…',
                        emDash: '—',
                        enDash: '–'
                }));
            }

                // Add Image extension for better media handling (body editor only)
                if (field === 'body' && (bundle?.Image || window.TiptapImage)) {
                    const Image = bundle.Image?.default || bundle.Image || window.TiptapImage;
                    enhancedExtensions.push(Image.configure({
                        inline: true,
                        allowBase64: true,
                        HTMLAttributes: {
                            class: 'img-fluid'
                        }
                }));
            }

                // Add Emoji support if available (body editor only)
                if (field === 'body' && (bundle?.Emoji || window.TiptapEmoji)) {
                    const Emoji = bundle.Emoji?.default || bundle.Emoji || window.TiptapEmoji;
                    enhancedExtensions.push(Emoji.configure({
                        suggestion: {
                            items: ({ query }) => {
                                const emojis = [
                                    { name: 'smile', emoji: '😄' },
                                    { name: 'heart', emoji: '❤️' },
                                    { name: 'thumbsup', emoji: '👍' },
                                    { name: 'fire', emoji: '🔥' },
                                    { name: 'rocket', emoji: '🚀' },
                                    { name: 'party', emoji: '🎉' },
                                    { name: 'eyes', emoji: '👀' },
                                    { name: 'thinking', emoji: '🤔' }
                                ];
                                return emojis.filter(item => 
                                    item.name.toLowerCase().includes(query.toLowerCase())
                                ).slice(0, 10);
                            }
                        }
                    }));
                }
                
                // Add TaskList and TaskItem extensions for checkbox support (body editor only)
                // TIPTAP BEST PRACTICE: Extensions now included in collaboration bundle
                if (field === 'body') {
                    // TaskList extension (required for checkbox functionality)
                    if (bundle?.TaskList) {
                        const TaskList = bundle.TaskList?.default || bundle.TaskList;
                        enhancedExtensions.push(TaskList.configure({
                            HTMLAttributes: {
                                class: 'task-list'
                            }
                        }));
                        console.log('✅ TaskList extension added to body editor');
                    }
                    
                    // TaskItem extension (required for TaskList to function)
                    if (bundle?.TaskItem) {
                        const TaskItem = bundle.TaskItem?.default || bundle.TaskItem;
                        enhancedExtensions.push(TaskItem.configure({
                            HTMLAttributes: {
                                class: 'task-item'
                            },
                            nested: true
                        }));
                        console.log('✅ TaskItem extension added to body editor');
                    }
                }
                
                return enhancedExtensions;
            }

            // CollaborationCursor extension (Tier 2 only)
            if (includeCursor) {
                const CollaborationCursor = bundle?.CollaborationCursor?.default || bundle?.CollaborationCursor;
                
                if (CollaborationCursor && this.provider) {
                    const userConfig = cursorConfig || {
                        name: this.username || 'Anonymous',
                        color: this.generateUserColor(this.username || 'Anonymous'),
                    };
                    
                    return [CollaborationCursor.configure({
                        provider: this.provider,
                        user: userConfig,
                    })];
                }
            }

            return [];
        },

        // File integration methods
        addFileToPost(file) {
            if (!file) return;
            
            // ===== READ-ONLY PERMISSION ENFORCEMENT =====
            if (this.isReadOnlyMode) {
                console.warn('🔒 Cannot add file to post: Read-only mode');
                return;
            }
            
            console.log('📎 Adding file to post:', file);
            
            // Add file to local attachments
            this.attachedFiles.push(file);
            
            // If in collaborative mode, add to collaborative structures
            let fileId = null;
            if (this.isCollaborativeMode && this.ydoc) {
                fileId = this.handleFileUpload(file);
                // Sync collaborative data to parent component
                this.syncToParent();
            }
            
            // Insert file reference into editor based on file type
            if (this.bodyEditor) {
                let insertText = '';
                
                if (file.type && file.type.startsWith('image/')) {
                    // Insert image
                    insertText = `![${file.name}](https://ipfs.dlux.io/ipfs/${file.hash})`;
                } else if (file.type && file.type.startsWith('video/')) {
                    // Insert video
                    insertText = `<video controls>\n  <source src="https://ipfs.dlux.io/ipfs/${file.hash}" type="${file.type}">\n  Your browser does not support the video tag.\n</video>`;
                } else {
                    // Insert file link
                    insertText = `[📁 ${file.name}](https://ipfs.dlux.io/ipfs/${file.hash})`;
                }
                
                // Insert at current cursor position
                this.bodyEditor.chain().focus().insertContent(insertText + '\n\n').run();
                this.hasUnsavedChanges = true;
            }
            
            console.log('✅ File added to post:', file.name, fileId ? `(Collaborative ID: ${fileId})` : '');
        },


        
        removeAttachedFile(index) {
            // ===== READ-ONLY PERMISSION ENFORCEMENT =====
            if (this.isReadOnlyMode) {
                console.warn('🔒 Cannot remove attached file: Read-only mode');
                return;
            }
            
            this.attachedFiles.splice(index, 1);
            this.hasUnsavedChanges = true;
        },

        // Get user's permission level for a specific document
        getUserPermissionLevel(file) {
            if (!file) return 'unknown';
            
            // Local files - user has full control
            if (file.type === 'local') {
                return 'owner';
            }
            
            // Collaborative files - check permissions
            if (file.type === 'collaborative') {
                // Document owner has full control
                if (file.owner === this.username) {
                    return 'owner';
                }
                
                // For other users, we need to check permissions
                // Since we don't load permissions for all docs in the list,
                // we'll make a reasonable assumption based on available data
                
                // If user is not authenticated, assume read-only
                if (!this.isAuthenticated) {
                    return 'readonly';
                }
                
                // If this is the currently loaded document, use actual permissions
                if (this.currentFile && 
                    file.owner === this.currentFile.owner && 
                    file.permlink === this.currentFile.permlink &&
                    this.documentPermissions.length > 0) {
                    
                    const userPermission = this.documentPermissions.find(p => p.account === this.username);
                    if (userPermission) {
                        return userPermission.permissionType;
                    }
                }
                
                // Default assumption for collaborative docs
                return 'readonly';
            }
            
            return 'unknown';
        },

        // Get permission level display info
        getPermissionDisplayInfo(permissionLevel) {
            const permissionMap = {
                'owner': {
                    label: 'Owner',
                    icon: 'fas fa-crown',
                    color: 'warning',
                    description: 'Full control - can edit, share, and delete'
                },
                'postable': {
                    label: 'Full Editor',
                    icon: 'fas fa-edit',
                    color: 'success',
                    description: 'Can edit content and publish to Hive'
                },
                'editable': {
                    label: 'Editor',
                    icon: 'fas fa-pen',
                    color: 'primary',
                    description: 'Can edit content but cannot publish'
                },
                'readonly': {
                    label: 'Viewer',
                    icon: 'fas fa-eye',
                    color: 'info',
                    description: 'Can view content only'
                },
                'unknown': {
                    label: 'Unknown',
                    icon: 'fas fa-question',
                    color: 'secondary',
                    description: 'Permission level unknown'
                }
            };
            
            return permissionMap[permissionLevel] || permissionMap['unknown'];
        },
        
        // Tag management
        addTag() {
            try {
                // ===== READ-ONLY PERMISSION ENFORCEMENT =====
                if (this.isReadOnlyMode) {
                    console.warn('🔒 Cannot add tag: Read-only mode');
                    return;
                }
                
                const tagValue = this.tagInput.trim().toLowerCase();
                
                if (!tagValue) return;
                
                // ===== REFACTORED: Single Path - Always use Y.js =====
                // Following offline-first architecture - Y.js is single source of truth
                const tags = this.getTags();
                if (!tags.includes(tagValue) && tags.length < 10) {
                    this.addCollaborativeTag(tagValue);
            this.hasUnsavedChanges = true;
                    this.clearUnsavedAfterSync();
                    
                    // TIPTAP BEST PRACTICE: Auto-save on metadata changes
                    this.debouncedAutoSave();
                }
                
                this.tagInput = '';
            } catch (error) {
                console.error('Error adding tag:', error);
                alert('Error adding tag: ' + error.message);
            }
        },
        
        removeTag(index) {
            try {
                // ===== READ-ONLY PERMISSION ENFORCEMENT =====
                if (this.isReadOnlyMode) {
                    console.warn('🔒 Cannot remove tag: Read-only mode');
                    return;
                }
                
                // ===== REFACTORED: Single Path - Always use Y.js =====
                const tags = this.getTags();
                if (index >= 0 && index < tags.length) {
                    this.removeCollaborativeTag(tags[index]);
            this.hasUnsavedChanges = true;
                    this.clearUnsavedAfterSync();
                    
                    // TIPTAP BEST PRACTICE: Auto-save on metadata changes
                    this.debouncedAutoSave();
                }
            } catch (error) {
                console.error('Error removing tag:', error);
                alert('Error removing tag: ' + error.message);
            }
        },
        
        addTagDirect(tag) {
            // Ensure tags is always an array
            if (!Array.isArray(this.content.tags)) {
                this.content.tags = [];
            }
            
            if (!this.content.tags.includes(tag) && this.content.tags.length < 10) {
                this.content.tags.push(tag);
                this.hasUnsavedChanges = true;
                this.clearUnsavedAfterSync(); // Unified sync indicator
            }
        },
        
        // Beneficiaries management
        addBeneficiary() {
            try {
                // ===== READ-ONLY PERMISSION ENFORCEMENT =====
                if (this.isReadOnlyMode) {
                    console.warn('🔒 Cannot add beneficiary: Read-only mode');
                    return;
                }
                
            const account = this.beneficiaryInput.account.replace('@', '').trim();
            const percent = parseFloat(this.beneficiaryInput.percent);
            
            if (!account || !percent || percent <= 0 || percent > 100) {
                alert('Please enter a valid account name and percentage (0.01-100%)');
                return;
            }
            
                const weight = Math.round(percent * 100);
                
                // ===== REFACTORED: Single Path - Always use Y.js =====
                this.addCollaborativeBeneficiary(account, weight);
                this.hasUnsavedChanges = true;
                this.clearUnsavedAfterSync();
                
                // TIPTAP BEST PRACTICE: Auto-save on metadata changes
                this.debouncedAutoSave();
            
            // Reset input
            this.beneficiaryInput.account = '';
            this.beneficiaryInput.percent = 1.0;
            } catch (error) {
                console.error('Error adding beneficiary:', error);
                alert('Error adding beneficiary: ' + error.message);
            }
        },
        
        removeBeneficiary(index) {
            try {
                // ===== READ-ONLY PERMISSION ENFORCEMENT =====
                if (this.isReadOnlyMode) {
                    console.warn('🔒 Cannot remove beneficiary: Read-only mode');
                    return;
                }
                
                // ===== REFACTORED: Single Path - Always use Y.js =====
                const beneficiaries = this.getBeneficiaries();
                if (index >= 0 && index < beneficiaries.length) {
                    this.removeCollaborativeBeneficiary(beneficiaries[index].id);
            this.hasUnsavedChanges = true;
                    this.clearUnsavedAfterSync();
                    
                    // TIPTAP BEST PRACTICE: Auto-save on metadata changes
                    this.debouncedAutoSave();
                }
            } catch (error) {
                console.error('Error removing beneficiary:', error);
                alert('Error removing beneficiary: ' + error.message);
            }
        },
        
        // Comment options change handler
        handleCommentOptionChange() {
            // Skip if we're currently loading publish options from Y.js
            if (this.isLoadingPublishOptions) {
                console.log('📋 Skipping comment option change during Y.js loading');
                return;
            }
            
            // ===== READ-ONLY PERMISSION ENFORCEMENT =====
            if (this.isReadOnlyMode) {
                console.warn('🔒 Cannot change comment options: Read-only mode');
                return;
            }
            
            console.log('📋 Comment options changed:', this.commentOptions);
            this.hasUnsavedChanges = true;
            
            // Set flag to prevent Y.js update listener from clearing unsaved flag
            this.isUpdatingPublishOptions = true;
            
            // ===== REFACTORED: Single Path - Always use Y.js (convert checkbox values to Y.js format) =====
            this.setPublishOption('allowVotes', this.commentOptions.allowVotes);
            this.setPublishOption('allowCurationRewards', this.commentOptions.allowCurationRewards);
            this.setPublishOption('maxAcceptedPayout', this.commentOptions.maxAcceptedPayout ? '0.000 HBD' : '1000000.000 HBD');
            this.setPublishOption('percentHbd', this.commentOptions.percentHbd ? 10000 : 5000);
            
            // Clear the flag after a short delay
            setTimeout(() => {
                this.isUpdatingPublishOptions = false;
            }, 200);
            
            // Trigger autosave to show saving indicator
            this.debouncedAutoSave();
        },
        
        // Custom JSON input handling - triggers on every keystroke
        handleCustomJsonInput() {
            // ===== READ-ONLY PERMISSION ENFORCEMENT =====
            if (this.isReadOnlyMode) {
                console.warn('🔒 Cannot modify custom JSON: Read-only mode');
                return;
            }
            
            console.log('⚙️ Custom JSON input detected - triggering status update');
            
            // ALWAYS trigger status updates when user types (even with invalid JSON)
            this.hasUnsavedChanges = true;
            
            // ✅ TEMP DOCUMENT ARCHITECTURE: Y.js document should already exist
            if (!this.ydoc) {
                console.error('❌ CRITICAL: Y.js document missing during custom JSON input');
                console.error('🔍 DEBUG: This violates temp document architecture - Y.js should exist from editor creation');
            }
            
            // Debounced validation and Y.js sync (only for valid JSON)
            this.debouncedValidateCustomJson();
        },

        // Custom JSON validation and Y.js sync - debounced to avoid excessive updates
        validateCustomJson() {
            console.log('🚀 validateCustomJson method called - START');
            console.log('🔍 DEBUG: isReadOnlyMode =', this.isReadOnlyMode);
            console.log('🔍 DEBUG: currentFile =', this.currentFile);
            console.log('🔍 DEBUG: username =', this.username);
            
            // ===== READ-ONLY PERMISSION ENFORCEMENT =====
            if (this.isReadOnlyMode) {
                console.warn('🔒 Cannot modify custom JSON: Read-only mode');
                console.warn('🔍 DEBUG: Blocked by read-only mode - isReadOnlyMode =', this.isReadOnlyMode);
                return;
            }
            
            console.log('⚙️ Validating custom JSON and syncing to Y.js...');
            console.log('🔍 DEBUG: customJsonString length:', this.customJsonString?.length || 0);
            console.log('🔍 DEBUG: customJsonString content:', this.customJsonString);
            
            // Set flag to prevent feedback loops during validation
            this.isUpdatingCustomJson = true;
            
            if (!this.customJsonString.trim()) {
                console.log('📝 Empty JSON detected - clearing existing fields');
                this.customJsonError = '';
                // Clear custom JSON when empty using collaborative methods
                const existingKeys = Object.keys(this.getCustomJson());
                console.log('🗑️ Clearing existing custom JSON keys:', existingKeys);
                existingKeys.forEach(key => {
                    this.removeCustomJsonField(key);
                });
                
                // Clear flag and trigger autosave for empty JSON
                this.isUpdatingCustomJson = false;
                this.debouncedAutoSave();
                console.log('✅ Empty JSON validation completed');
                return;
            }
            
            try {
                console.log('🔍 DEBUG: Attempting to parse JSON...');
                const parsedJson = JSON.parse(this.customJsonString);
                console.log('✅ JSON parsed successfully:', parsedJson);
                console.log('🔍 DEBUG: Parsed JSON keys:', Object.keys(parsedJson));
                this.customJsonError = '';
                
                // Follow same pattern as tags/beneficiaries - use collaborative methods
                // Clear existing custom JSON first
                const existingKeys = Object.keys(this.getCustomJson());
                console.log('🗑️ Clearing existing custom JSON keys before setting new ones:', existingKeys);
                existingKeys.forEach(key => {
                    const removeResult = this.removeCustomJsonField(key);
                    console.log(`🗑️ removeCustomJsonField result for ${key}:`, removeResult);
                });
                
                // Set new custom JSON fields using collaborative methods
                console.log('📝 Setting custom JSON fields:', Object.keys(parsedJson));
                Object.entries(parsedJson).forEach(([key, value]) => {
                    console.log(`📝 About to set custom JSON field: ${key} = ${value}`);
                    const result = this.setCustomJsonField(key, value);
                    console.log(`📝 setCustomJsonField result for ${key}:`, result);
                });
                
                // Clear flag and trigger autosave for valid JSON
                this.isUpdatingCustomJson = false;
                this.debouncedAutoSave();
                console.log('✅ Valid JSON validation completed');
                
            } catch (error) {
                console.log('❌ JSON parsing failed:', error.message);
                
                // Provide clear, helpful error message
                let userFriendlyError = 'Invalid JSON format. ';
                
                if (error.message.includes('Unexpected token')) {
                    userFriendlyError += 'Check for missing quotes, commas, or brackets. ';
                } else if (error.message.includes('Unexpected end')) {
                    userFriendlyError += 'JSON appears incomplete - check for missing closing brackets or quotes. ';
                }
                
                userFriendlyError += 'Example: {"key": "value", "number": 123}';
                
                this.customJsonError = userFriendlyError;
                
                // Clear flag even on error
                this.isUpdatingCustomJson = false;
                // Don't sync invalid JSON to Y.js, but keep hasUnsavedChanges = true
                // This shows the user that they have unsaved changes (invalid JSON)
                this.debouncedAutoSave();
                console.log('❌ Invalid JSON validation completed');
            }
        },
        
        // Permlink management  
        togglePermlinkEditor() {
            // ===== READ-ONLY PERMISSION ENFORCEMENT =====
            if (this.isReadOnlyMode) {
                console.warn('🔒 Cannot edit permlink: Read-only mode');
                return;
            }
            
            this.showPermlinkEditor = !this.showPermlinkEditor;
            if (this.showPermlinkEditor && this.permlinkEditor) {
                this.$nextTick(() => {
                    this.permlinkEditor.commands.focus();
                });
            }
        },
        
        useGeneratedPermlink() {
            // ===== READ-ONLY PERMISSION ENFORCEMENT =====
            if (this.isReadOnlyMode) {
                console.warn('🔒 Cannot use generated permlink: Read-only mode');
                return;
            }
            
            this.content.permlink = this.generatedPermlink;
            if (this.permlinkEditor) {
                this.permlinkEditor.commands.setContent(this.generatedPermlink);
            }
            this.hasUnsavedChanges = true;
            this.clearUnsavedAfterSync(); // Trigger auto-save for local documents
        },
        
        // Publishing
        async publishPost() {
            if (!this.canPublish) {
                alert('Please fill in title, content, and at least one tag before publishing.');
                return;
            }
            
            // Validate Hive-specific requirements
            if (!this.validateHiveRequirements()) {
                return;
            }
            
            this.showPublishModal = true;
        },
        
        // Validate Hive broadcasting requirements
        validateHiveRequirements() {
            const errors = [];
            
            // Validate permlink format (Hive requirement: lowercase, no spaces, alphanumeric + hyphens)
            const permlink = this.content.permlink || this.generatedPermlink;
            if (!/^[a-z0-9-]+$/.test(permlink)) {
                errors.push('Permlink must contain only lowercase letters, numbers, and hyphens');
            }
            
            // Validate title length (Hive limit: 255 characters)
            if (this.content.title.length > 255) {
                errors.push('Title must be 255 characters or less');
            }
            
            // Validate body length (Hive limit: ~64KB, but practical limit is lower)
            if (this.content.body.length > 60000) {
                errors.push('Post content is too long (max ~60,000 characters)');
            }
            
            // Validate tags (Hive limit: 10 tags, each max 24 characters)
            if (this.content.tags.length === 0) {
                errors.push('At least one tag is required');
            }
            if (this.content.tags.length > 10) {
                errors.push('Maximum 10 tags allowed');
            }
            this.content.tags.forEach(tag => {
                if (tag.length > 24) {
                    errors.push(`Tag "${tag}" is too long (max 24 characters)`);
                }
                if (!/^[a-z0-9-]+$/.test(tag)) {
                    errors.push(`Tag "${tag}" contains invalid characters (use lowercase letters, numbers, hyphens only)`);
                }
            });
            
            // Validate beneficiaries (Hive limit: total weight <= 10000, max 8 beneficiaries)
            if (this.publishForm.beneficiaries.length > 8) {
                errors.push('Maximum 8 beneficiaries allowed');
            }
            const totalWeight = this.publishForm.beneficiaries.reduce((sum, ben) => sum + ben.weight, 0);
            if (totalWeight > 10000) {
                errors.push('Total beneficiary percentage cannot exceed 100%');
            }
            
            // Validate JSON metadata size (practical limit for Hive)
            try {
                const jsonMetadata = JSON.stringify({
                    app: 'dlux/0.1',
                    format: 'markdown+html',
                    tags: this.content.tags,
                    dlux: this.isCollaborativeMode ? this.getCollaborativeData() : {},
                    attachedFiles: this.attachedFiles,
                    ...this.content.custom_json
                });
                
                if (jsonMetadata.length > 8192) {
                    errors.push('Post metadata is too large (reduce custom JSON or attached files)');
                }
            } catch (error) {
                errors.push('Invalid custom JSON format');
            }
            
            if (errors.length > 0) {
                alert('Cannot publish post:\n\n' + errors.join('\n'));
                return false;
            }
            
            return true;
        },
        
        async performPublish() {
            this.publishing = true;
            
            // Check for operation locks in collaborative mode
            if (this.isCollaborativeMode && this.ydoc) {
                const locks = this.ydoc.getMap('_locks');
                const existingLock = locks.get('publishing');
                
                if (existingLock && existingLock.user !== this.username) {
                    const lockAge = Date.now() - existingLock.timestamp;
                    if (lockAge < 30000) { // 30 second lock timeout
                        throw new Error(`Another user (${existingLock.user}) is currently publishing. Please wait.`);
                    }
                }
                
                // Set publish lock
                locks.set('publishing', {
                    user: this.username,
                    timestamp: Date.now()
                });
            }
            
            try {
                // Get current collaborative data if available
                const collaborativeData = this.isCollaborativeMode ? this.getCollaborativeData() : null;
                
                // Get tags from collaborative document or local content
                const sourceTags = collaborativeData?.tags || this.content.tags || [];
                
                // Format tags according to Hive best practices
                const formattedTags = sourceTags
                    .map(tag => tag.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                    .filter(tag => tag.length > 0 && tag.length <= 24)
                    .slice(0, 10); // Max 10 tags per Hive rules
                
                // Add tags to body for blockchain indexing (Hive best practice)
                const bodyWithTags = this.content.body + 
                    (formattedTags.length > 0 ? '\n\n' + formattedTags.map(tag => `#${tag}`).join(' ') : '');
                
                // Extract links from content for json_metadata.links
                const extractedLinks = this.extractLinksFromContent(this.content.body);
                
                // Get featured images for json_metadata.image
                const featuredImages = collaborativeData?.images?.slice(0, 5).map(img => img.url) || 
                                     this.attachedFiles.filter(f => f.type?.startsWith('image/')).slice(0, 5).map(f => f.url) || 
                                     [];
                
                // Format data according to Hive comment operation requirements
                // Reference: https://developers.hive.io/apidefinitions/#broadcast_ops_comment
                const hivePostData = {
                    // Required Hive comment operation parameters
                    parent_author: '', // Empty for top-level posts
                    parent_permlink: formattedTags[0] || 'dlux', // First tag as parent permlink, fallback to 'dlux'
                    author: this.username || '', // Will be set by parent component
                    permlink: this.content.permlink || this.generatedPermlink,
                    title: this.content.title,
                    body: bodyWithTags, // Include tags in body for blockchain indexing
                    
                    // Hive JSON metadata structure following best practices
                    json_metadata: JSON.stringify({
                        // Standard Hive metadata fields
                        app: 'dlux/1.0.0',
                        format: 'markdown+html',
                        tags: formattedTags, // Primary tags storage
                        image: featuredImages, // Featured images for previews
                        links: extractedLinks, // External links from content
                        
                        // DLUX-specific metadata
                        dlux: {
                            type: collaborativeData?.config?.postType || 'blog',
                            version: collaborativeData?.config?.version || '1.0.0',
                            
                            // Media assets from collaborative document
                            images: collaborativeData?.images || [],
                            videos: collaborativeData?.videos || [],
                            assets360: collaborativeData?.assets360 || [],
                            attachments: collaborativeData?.attachments || [],
                            
                            // Video transcoding data
                            videoData: collaborativeData?.videoData || {},
                            
                            // SPK Network contract references
                            spkContracts: [
                                ...(collaborativeData?.images?.map(img => img.contract).filter(Boolean) || []),
                                ...(collaborativeData?.videos?.map(vid => vid.contract).filter(Boolean) || [])
                            ],
                            
                            // Collaborative document reference
                            collaborative: this.currentFile && this.currentFile.type === 'collaborative' ? {
                            owner: this.currentFile.owner,
                                permlink: this.currentFile.permlink,
                                documentName: this.currentFile.documentName
                        } : null
                        },
                        
                        // Legacy attached files for backward compatibility
                        attachedFiles: this.attachedFiles,
                        
                        // Custom JSON from collaborative document or local content
                        ...(collaborativeData?.customJson || this.content.custom_json || {})
                    })
                };
                
                // Get beneficiaries from collaborative document or local form
                const sourceBeneficiaries = collaborativeData?.beneficiaries || this.publishForm.beneficiaries || [];
                
                // Get advanced options from collaborative document or defaults
                const maxAcceptedPayout = collaborativeData?.publishOptions?.maxAcceptedPayout || '1000000.000 HBD';
                const percentHbd = collaborativeData?.publishOptions?.percentHbd || 5000; // ✅ FIXED: 50/50 split default
                const allowVotes = collaborativeData?.publishOptions?.allowVotes !== false;
                const allowCurationRewards = collaborativeData?.publishOptions?.allowCurationRewards !== false;
                
                // Comment options for beneficiaries and advanced settings (separate operation)
                const commentOptions = sourceBeneficiaries.length > 0 || 
                                     maxAcceptedPayout !== '1000000.000 HBD' || 
                                     percentHbd !== 5000 || // ✅ FIXED: Compare against 50/50 split default
                                     !allowVotes || 
                                     !allowCurationRewards ? {
                    author: hivePostData.author,
                    permlink: hivePostData.permlink,
                    max_accepted_payout: maxAcceptedPayout,
                    percent_hbd: percentHbd,
                    allow_votes: allowVotes,
                    allow_curation_rewards: allowCurationRewards,
                    extensions: sourceBeneficiaries.length > 0 ? [
                        [0, {
                            beneficiaries: sourceBeneficiaries.map(ben => ({
                                account: ben.account,
                                weight: ben.weight
                            }))
                        }]
                    ] : []
                } : null;
                
                // Emit properly formatted Hive operations to parent
                this.$emit('publish-post', {
                    operations: [
                        ['comment', hivePostData],
                        ...(commentOptions ? [['comment_options', commentOptions]] : [])
                    ],
                    // Additional metadata for parent component
                    metadata: {
                        isCollaborative: this.isCollaborativeMode,
                        collaborativeData: collaborativeData,
                        localAttachments: this.attachedFiles
                    }
                });
                
                this.showPublishModal = false;
                this.hasUnsavedChanges = false;
                
                console.log('📰 Post formatted for Hive broadcast:', hivePostData.title);
                
            } catch (error) {
                console.error('Publish formatting failed:', error);
                alert('Publish failed: ' + error.message);
            } finally {
                // Clear publish lock in collaborative mode
                if (this.isCollaborativeMode && this.ydoc) {
                    const locks = this.ydoc.getMap('_locks');
                    locks.delete('publishing');
                }
                this.publishing = false;
            }
        },
        
        // Extract links from content for Hive json_metadata.links
        extractLinksFromContent(content) {
            if (!content) return [];
            
            // Regex to find URLs in content
            const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
            const links = content.match(urlRegex) || [];
            
            // Remove duplicates and limit to reasonable number
            return [...new Set(links)].slice(0, 10);
        },

        // JSON Preview functionality
        showJsonPreview() {
            this.showJsonPreviewModal = true;
            this.jsonPreviewTab = 'complete';
        },

        closeJsonPreview() {
            this.showJsonPreviewModal = false;
        },

        setJsonPreviewTab(tab) {
            this.jsonPreviewTab = tab;
        },

        getCompleteJsonPreview() {
            try {
                // Get current collaborative data if available
                const collaborativeData = this.isCollaborativeMode ? this.getCollaborativeData() : null;
                
                // Get tags from collaborative document or local content
                const sourceTags = collaborativeData?.tags || this.content.tags || [];
                
                // Format tags according to Hive best practices
                const formattedTags = sourceTags
                    .map(tag => tag.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                    .filter(tag => tag.length > 0 && tag.length <= 24)
                    .slice(0, 10);
                
                // Add tags to body for blockchain indexing
                const bodyWithTags = this.content.body + 
                    (formattedTags.length > 0 ? '\n\n' + formattedTags.map(tag => `#${tag}`).join(' ') : '');
                
                // Extract links and get featured images
                const extractedLinks = this.extractLinksFromContent(this.content.body);
                const featuredImages = collaborativeData?.images?.slice(0, 5).map(img => img.url) || 
                                     this.attachedFiles.filter(f => f.type?.startsWith('image/')).slice(0, 5).map(f => f.url) || 
                                     [];
                
                // Build comment operation
                const commentOperation = {
                    parent_author: '',
                    parent_permlink: formattedTags[0] || 'dlux',
                    author: this.username || 'username',
                    permlink: this.content.permlink || this.generatedPermlink,
                    title: this.content.title,
                    body: bodyWithTags,
                    json_metadata: JSON.stringify({
                        // Standard Hive metadata fields
                        app: 'dlux/1.0.0',
                        format: 'markdown+html',
                        tags: formattedTags,
                        image: featuredImages,
                        links: extractedLinks,
                        
                        // DLUX-specific metadata
                        dlux: {
                            type: collaborativeData?.config?.postType || 'blog',
                            version: collaborativeData?.config?.version || '1.0.0',
                            images: collaborativeData?.images || [],
                            videos: collaborativeData?.videos || [],
                            assets360: collaborativeData?.assets360 || [],
                            attachments: collaborativeData?.attachments || [],
                            videoData: collaborativeData?.videoData || {},
                            spkContracts: [
                                ...(collaborativeData?.images?.map(img => img.contract).filter(Boolean) || []),
                                ...(collaborativeData?.videos?.map(vid => vid.contract).filter(Boolean) || [])
                            ],
                            collaborative: this.currentFile && this.currentFile.type === 'collaborative' ? {
                                owner: this.currentFile.owner,
                                permlink: this.currentFile.permlink,
                                documentName: this.currentFile.documentName
                            } : null
                        },
                        
                        // Legacy attached files for backward compatibility
                        attachedFiles: this.attachedFiles,
                        
                        // Custom JSON from collaborative document or local content
                        ...(collaborativeData?.customJson || this.content.custom_json || {})
                    })
                };
                
                // Get beneficiaries and advanced options
                const sourceBeneficiaries = collaborativeData?.beneficiaries || this.publishForm.beneficiaries || [];
                const maxAcceptedPayout = collaborativeData?.publishOptions?.maxAcceptedPayout || '1000000.000 HBD';
                const percentHbd = collaborativeData?.publishOptions?.percentHbd || 5000; // ✅ FIXED: 50/50 split default
                const allowVotes = collaborativeData?.publishOptions?.allowVotes !== false;
                const allowCurationRewards = collaborativeData?.publishOptions?.allowCurationRewards !== false;
                
                // Build comment options operation
                const commentOptionsOperation = sourceBeneficiaries.length > 0 || 
                                             maxAcceptedPayout !== '1000000.000 HBD' || 
                                             percentHbd !== 5000 || // ✅ FIXED: Compare against 50/50 split default
                                             !allowVotes || 
                                             !allowCurationRewards ? {
                    author: commentOperation.author,
                    permlink: commentOperation.permlink,
                    max_accepted_payout: maxAcceptedPayout,
                    percent_hbd: percentHbd,
                    allow_votes: allowVotes,
                    allow_curation_rewards: allowCurationRewards,
                    extensions: sourceBeneficiaries.length > 0 ? [
                        [0, {
                            beneficiaries: sourceBeneficiaries.map(ben => ({
                                account: ben.account,
                                weight: ben.weight
                            }))
                        }]
                    ] : []
                } : null;
                
                // Complete operations array
                const operations = [
                    ['comment', commentOperation],
                    ...(commentOptionsOperation ? [['comment_options', commentOptionsOperation]] : [])
                ];
                
                return {
                    operations: operations,
                    metadata: {
                        isCollaborative: this.isCollaborativeMode,
                        collaborativeData: collaborativeData,
                        localAttachments: this.attachedFiles,
                        generatedAt: new Date().toISOString()
                    }
                };
                
            } catch (error) {
                console.error('Error generating JSON preview:', error);
                return {
                    error: error.message,
                    stack: error.stack
                };
            }
        },

        getCommentOperationPreview() {
            const complete = this.getCompleteJsonPreview();
            if (complete.error) return complete;
            
            return complete.operations.find(op => op[0] === 'comment')?.[1] || {};
        },

        getCommentOptionsPreview() {
            const complete = this.getCompleteJsonPreview();
            if (complete.error) return complete;
            
            return complete.operations.find(op => op[0] === 'comment_options')?.[1] || null;
        },

        getMetadataPreview() {
            const complete = this.getCompleteJsonPreview();
            if (complete.error) return complete;
            
            return complete.metadata || {};
        },

        copyJsonToClipboard(jsonData) {
            try {
                const jsonString = JSON.stringify(jsonData, null, 2);
                navigator.clipboard.writeText(jsonString).then(() => {
                    // Show success feedback
                    console.log('✅ JSON copied to clipboard');
                    // You could add a toast notification here
                }).catch(err => {
                    console.error('Failed to copy JSON:', err);
                    // Fallback: select text for manual copy
                    this.selectJsonText(jsonString);
                });
            } catch (error) {
                console.error('Error copying JSON:', error);
            }
        },

        validateJsonStructure() {
            const complete = this.getCompleteJsonPreview();
            if (complete.error) {
                return {
                    valid: false,
                    errors: [complete.error]
                };
            }
            
            const errors = [];
            const warnings = [];
            
            try {
                const comment = this.getCommentOperationPreview();
                
                // Validate required fields
                if (!comment.title || comment.title.length === 0) {
                    errors.push('Title is required');
                }
                if (!comment.body || comment.body.length === 0) {
                    errors.push('Body content is required');
                }
                if (!comment.author || comment.author.length === 0) {
                    errors.push('Author is required');
                }
                if (!comment.permlink || comment.permlink.length === 0) {
                    errors.push('Permlink is required');
                }
                
                // Validate field lengths
                if (comment.title && comment.title.length > 255) {
                    errors.push('Title exceeds 255 character limit');
                }
                if (comment.body && comment.body.length > 60000) {
                    warnings.push('Body content is very long (>60k chars)');
                }
                
                // Validate permlink format
                if (comment.permlink && !/^[a-z0-9-]+$/.test(comment.permlink)) {
                    errors.push('Permlink must contain only lowercase letters, numbers, and hyphens');
                }
                
                // Validate JSON metadata size
                if (comment.json_metadata) {
                    const jsonSize = new Blob([comment.json_metadata]).size;
                    if (jsonSize > 8192) { // 8KB limit
                        warnings.push(`JSON metadata is large (${(jsonSize/1024).toFixed(1)}KB). Consider reducing.`);
                    }
                }
                
                // Validate tags
                const metadata = JSON.parse(comment.json_metadata || '{}');
                if (metadata.tags) {
                    if (metadata.tags.length === 0) {
                        errors.push('At least one tag is required');
                    }
                    if (metadata.tags.length > 10) {
                        errors.push('Maximum 10 tags allowed');
                    }
                    metadata.tags.forEach((tag, index) => {
                        if (tag.length > 24) {
                            errors.push(`Tag ${index + 1} exceeds 24 character limit`);
                        }
                        if (!/^[a-z0-9-]+$/.test(tag)) {
                            errors.push(`Tag ${index + 1} contains invalid characters`);
                        }
                    });
                }
                
                // Validate beneficiaries
                const commentOptions = this.getCommentOptionsPreview();
                if (commentOptions && commentOptions.extensions) {
                    const beneficiaries = commentOptions.extensions[0]?.[1]?.beneficiaries || [];
                    if (beneficiaries.length > 8) {
                        errors.push('Maximum 8 beneficiaries allowed');
                    }
                    
                    const totalWeight = beneficiaries.reduce((sum, ben) => sum + ben.weight, 0);
                    if (totalWeight > 10000) {
                        errors.push('Total beneficiary weight exceeds 100%');
                    }
                }
                
                return {
                    valid: errors.length === 0,
                    errors: errors,
                    warnings: warnings
                };
                
            } catch (error) {
                return {
                    valid: false,
                    errors: ['JSON validation failed: ' + error.message]
                };
            }
        },
        
        // Enhanced content update to emit changes
        updateContent() {
            // Update content from editors
            if (this.titleEditor) {
                this.content.title = this.titleEditor.getHTML();
            }
            if (this.permlinkEditor) {
                this.content.permlink = this.permlinkEditor.getHTML();
            }
            if (this.bodyEditor) {
                this.content.body = this.bodyEditor.getHTML();
            }
            
            // Emit content changes to parent
            this.$emit('content-changed', {
                ...this.content,
                permlink: this.content.permlink || this.generatedPermlink,
                attachedFiles: this.attachedFiles
            });
        },
        
        // ✅ NEW BEST PRACTICE: Clean local document loading (follows newDocument pattern)
        async loadLocalDocument(file) {
            // ✅ SECURITY: Verify user has access to this local file
            if (!this.username) {
                console.error('❌ No user logged in - cannot load local document');
                alert('Please log in to access local documents.');
                return;
            }
            
            // Check file ownership
            const fileOwner = file.isCollaborative ? file.owner : (file.creator || file.author);
            if (fileOwner && fileOwner !== this.username) {
                console.error('❌ Access denied: Document belongs to different user', {
                    fileOwner,
                    currentUser: this.username,
                    fileName: file.name,
                    fileId: file.id
                });
                alert(`Access denied: This document belongs to ${fileOwner}. You are logged in as ${this.username}.`);
                return;
            }
            
            if (this.hasUnsavedChanges) {
                const confirmResult = await this.confirmUnsavedChanges();
                if (!confirmResult) return;
            }

            try {
                console.log('📋 Loading local document (NEW best practice pattern):', file.name);
                
                // Clean up URL parameters and existing collaborative connections
                this.clearCollabURLParams();
                this.fullCleanupCollaboration();
                await this.$nextTick();

                // Reset document state (same as newDocument)
                this.currentFile = file;
                this.fileType = 'local';
                this.isCollaborativeMode = false;
                
                // ✅ CRITICAL: Mark as NOT temporary since we're loading an existing document
                this.isTemporaryDocument = false;
                
                // Reset Vue reactive state
                this.content = { title: '', body: '', tags: [], custom_json: {} };
                this.customJsonString = '';
                this.customJsonError = '';
                this.tagInput = '';
                this.isUpdatingCustomJson = false;
                this.isLoadingPublishOptions = false;
                this.isUpdatingPublishOptions = false;
                this.hasUnsavedChanges = false;
                this.documentPermissions = [];
                this.collaborativeAuthors = [];

                // ✅ TIPTAP BEST PRACTICE: Create Y.js document + IndexedDB in one place
                const bundle = window.TiptapCollaboration?.default || window.TiptapCollaboration;
                if (!bundle) {
                    throw new Error('TipTap collaboration bundle is required');
                }

                // Create Y.js document
                this.ydoc = new Y.Doc();
                
                // Create IndexedDB persistence with file ID
                const IndexeddbPersistence = bundle.IndexeddbPersistence?.default || bundle.IndexeddbPersistence;
                if (IndexeddbPersistence) {
                    this.indexeddbProvider = new IndexeddbPersistence(file.id, this.ydoc);
                    
                    // Wait for content to sync from IndexedDB
                    await new Promise((resolve, reject) => {
                        const timeout = setTimeout(() => reject(new Error('IndexedDB sync timeout')), 5000);
                        this.indexeddbProvider.once('synced', () => {
                            clearTimeout(timeout);
                            resolve();
                        });
                    });
                    
                    console.log('💾 IndexedDB content synced for existing document');
                }

                // Initialize schema and create editors (same as newDocument)
                this.initializeCollaborativeSchema(bundle.Y?.default || bundle.Y);
                
                // ✅ SECURITY: Verify Y.js document ownership after loading from IndexedDB
                if (this.ydoc) {
                    const config = this.ydoc.getMap('config');
                    const docOwner = config.get('owner');  // ✅ FIX: Removed creator fallback - creator is never written to Y.js
                    if (docOwner && docOwner !== this.username) {
                        console.error('❌ Y.js document ownership mismatch in loadLocalDocument', {
                            yjsOwner: docOwner,
                            currentUser: this.username,
                            fileId: file.id
                        });
                        // Clean up the loaded document
                        if (this.ydoc) {
                            this.ydoc.destroy();
                            this.ydoc = null;
                        }
                        throw new Error(`Y.js document ownership verification failed: Document belongs to ${docOwner}`);
                    }
                    console.log('✅ Y.js document ownership verified for user:', this.username);
                }
                
                await this.createOfflineFirstCollaborativeEditors(bundle);

                // Load publish options and custom JSON from Y.js
                this.loadPublishOptionsFromYjs();
                this.loadCustomJsonFromYjs();

                // Update URL for local document persistence
                if (file.id && this.username) {
                    const permlink = file.id.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
                    this.updateURLWithLocalParams(this.username, permlink);
                }

                this.hasUnsavedChanges = false;
                this.isCleaningUp = false;
                
                // ✅ DISMISS MODAL: Local document loaded from IndexedDB
                this.showLoadModal = false;
                
                console.log('✅ Local document loaded using NEW best practice pattern');
                
            } catch (error) {
                console.error('❌ Failed to load local document:', error);
                alert('Failed to load document: ' + error.message);
                // ✅ DISMISS MODAL: Even on error, dismiss modal to prevent UI lock
                this.showLoadModal = false;
            }
        },
        
        // File Menu Actions (Y.js Offline-First Architecture)
        async newDocument() {
            if (this.hasUnsavedChanges) {
                const confirmResult = await this.confirmUnsavedChanges();
                if (!confirmResult) return;
            }
            
            try {
                console.log('📄 Creating new document (TipTap best practice)...');
                
                // Clean up URL if we're coming from a collaborative document
                this.clearCollabURLParams();
                
                // Clean up any existing collaborative connections first
                this.fullCleanupCollaboration();
                
                // Wait for complete cleanup
                await this.$nextTick();
                
                // Reset document state
                this.currentFile = null;
                this.fileType = 'local';
                this.content = {
                    title: '',
                    body: '',
                    tags: [],
                    custom_json: {},
                    permlink: '',
                    beneficiaries: []
                };
                this.attachedFiles = [];
                
                // ✅ CRITICAL FIX: Reset Vue reactive data properties
                this.customJsonString = '';
                this.customJsonError = '';
                this.tagInput = '';
                this.isUpdatingCustomJson = false;
                this.isLoadingPublishOptions = false;
                this.isUpdatingPublishOptions = false;
                
                // Reset temp document flags
                this.isTemporaryDocument = false;
                this.tempDocumentId = null;
                this.isInitializingEditors = false;
                
                // CRITICAL FIX: Ensure collaborative mode is reset for new documents
                // This prevents shouldUseCloudTier() from incorrectly choosing Cloud Tier
                this.isCollaborativeMode = false;
                
                // Reset save form
                this.saveForm = {
                    filename: '',
                    storageType: 'local',
                    isPublic: false,
                    description: '',
                    isNewDocument: false
                };
                
                // ✅ TIPTAP BEST PRACTICE: Create fresh temp Y.js document for new documents
                // Following temp document strategy - create Y.js immediately but don't persist until user edits
                const bundle = window.TiptapCollaboration?.default || window.TiptapCollaboration;
                if (!bundle) {
                    throw new Error('TipTap collaboration bundle is required');
                }
                
                // Create fresh Y.js document (temp document strategy)
                this.ydoc = new Y.Doc();
                this.initializeCollaborativeSchema(bundle.Y?.default || bundle.Y);
                
                // Set temp document flags
                this.isTemporaryDocument = true;
                this.tempDocumentId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                
                // Create Tier 1 editors (offline-first, no WebSocket)
                await this.createOfflineFirstCollaborativeEditors(bundle);
                
                this.hasUnsavedChanges = false;
                
                console.log('✅ New document ready with fresh offline-first editors');
                
            } catch (error) {
                console.error('❌ Failed to create new document:', error);
                alert('Failed to create new document: ' + error.message);
            }
        },
        
        async newCollaborativeDocument() {
            if (!this.showCollaborativeFeatures) {
                const confirmAuth = confirm('You need to authenticate to create collaborative documents. Authenticate now?');
                if (confirmAuth) {
                    this.requestAuthentication();
                    try {
                        await this.waitForAuthentication();
                        // Retry after authentication
                        return this.newCollaborativeDocument();
                    } catch (error) {
                        alert('Authentication failed. Please try again.');
                        return;
                    }
                }
                return;
            }
            
            if (this.hasUnsavedChanges) {
                const confirmResult = await this.confirmUnsavedChanges();
                if (!confirmResult) return;
            }
            
            // Clear URL from previous collaborative document
            this.clearCollabURLParams();
            
            // Show save modal for new collaborative document
            this.saveForm = {
                filename: `collaboration-${new Date().toISOString().split('T')[0]}`,
                storageType: 'cloud',
                isPublic: false,
                description: 'New collaborative document',
                isNewDocument: true
            };
            
            this.showSaveModal = true;
            
            console.log('🤝 Creating new collaborative document...');
        },
        
        // ✅ COLLABORATIVE DOCUMENT LOADING: Only for cloud/collaborative documents  
        async loadDocument(file) {
            // RACE CONDITION FIX: Prevent multiple simultaneous document loading
            // BUT allow loading during initialization for auto-connect
            if (this.loading) {
                console.log('⚠️ Document loading already in progress, skipping duplicate call');
                return;
            }
            
            // During initialization, only allow auto-connect document loading
            if (this.isInitializing) {
                console.log('📋 Loading document during initialization (auto-connect)');
            }
            
            if (this.hasUnsavedChanges) {
                const confirm = await this.confirmUnsavedChanges();
                if (!confirm) return;
            }
            
            this.loading = true;
            
            try {
                // STEP 1: Always destroy existing editors first (TipTap best practice)
                await this.cleanupCurrentDocument();
                await this.$nextTick();
                
                // STEP 2: Determine correct tier based on content type
                const requiresCloudTier = this.shouldUseCloudTier(file);
                const bundle = window.TiptapCollaboration?.default || window.TiptapCollaboration;
                
                if (!bundle) {
                    throw new Error('TipTap collaboration bundle is required');
                }
                
                // ✅ CRITICAL FIX: Clear URL parameters based on document type BEFORE loading
                if (requiresCloudTier && file.type === 'collaborative') {
                    // Clear local parameters when loading collaborative documents
                    this.clearLocalURLParams();
                } else {
                    // Clear collaborative parameters when loading local documents
                    this.clearCollabURLParams();
                }
                
                // ✅ CRITICAL FIX: Comprehensive Vue reactive state reset for document switching
                this.isCleaningUp = true; // Prevent observers from interfering
                this.content = { title: '', body: '', tags: [], custom_json: {} };
                this.customJsonString = '';
                this.customJsonError = '';
                this.tagInput = '';
                this.isUpdatingCustomJson = false;
                this.isLoadingPublishOptions = false;
                this.isUpdatingPublishOptions = false;
                this.hasUnsavedChanges = false;
                this.documentPermissions = [];
                this.collaborativeAuthors = [];
                console.log('✅ Vue reactive state reset for document type switching');
                
                // STEP 3: Create Y.js document + IndexedDB (TIPTAP BEST PRACTICE: All documents are offline-first collaborative)
                this.ydoc = new Y.Doc();
                
                // ✅ TIPTAP BEST PRACTICE: Use consistent document ID regardless of connection status
                // All documents use Y.js + IndexedDB - the only difference is WebSocket connection
                const documentId = file.id || file.permlink || `temp_${Date.now()}`;
                
                console.log('🔍 DEBUG: Main loadDocument - Document ID for IndexedDB:', documentId, 'from file:', {id: file.id, permlink: file.permlink, owner: file.owner, type: file.type});
                const IndexeddbPersistence = bundle.IndexeddbPersistence?.default || bundle.IndexeddbPersistence;
                
                if (IndexeddbPersistence) {
                    this.indexeddbProvider = new IndexeddbPersistence(documentId, this.ydoc);
                    
                    // ✅ TIPTAP BEST PRACTICE: Wait for IndexedDB sync with timeout (critical for content loading)
                    await new Promise((resolve, reject) => {
                        const timeout = setTimeout(() => reject(new Error('IndexedDB sync timeout')), 5000);
                        this.indexeddbProvider.once('synced', () => {
                            clearTimeout(timeout);
                            resolve();
                        });
                    });
                    
                    console.log('💾 IndexedDB persistence synced for document');
                }
                
                // Initialize collaborative schema
                this.initializeCollaborativeSchema(bundle.Y?.default || bundle.Y);
                
                // STEP 4: Create appropriate tier editor
                if (requiresCloudTier) {
                    await this.createCloudEditorsWithCursors(bundle); // Tier 2
                    this.isCollaborativeMode = true;
                    this.fileType = 'collaborative';
                } else {
                    await this.createOfflineFirstCollaborativeEditors(bundle); // Tier 1
                    this.isCollaborativeMode = false;
                    this.fileType = 'local';
                }
                
                // STEP 6: TipTap automatically loads content from Y.js/IndexedDB
                // NO manual content setting needed!
                
                // STEP 6.5: Wait for Y.js content to be fully available and synced
                console.log('⏳ Waiting for Y.js content to be fully available...');
                await this.waitForYjsContentAvailability();
                console.log('📄 Y.js content confirmed available');
                
                // ✅ CRITICAL: Force Vue to sync editor content to reactive state for UI updates
                console.log('🔄 Syncing editor content to Vue state for immediate display...');
                await this.syncEditorContentToVueState();
                
                // Force Vue reactivity update to ensure UI shows content immediately
                await this.$nextTick();
                console.log('📄 Editor content synced to Vue reactive state and UI updated');
                
                // STEP 6.6: Load publish options, custom JSON, and document name from Y.js after editors are ready
                this.loadPublishOptionsFromYjs();
                this.loadCustomJsonFromYjs();
                
                // ✅ TIPTAP BEST PRACTICE: Unified document metadata handling for ALL documents
                const documentName = file.name || file.documentName || file.title || `${file.owner || 'local'}/${file.permlink || file.id}`;
                console.log('🔍 DEBUG: Document loading - unified metadata approach:', {
                    fileName: file.name,
                    fileDocumentName: file.documentName,
                    fileTitle: file.title,
                    owner: file.owner,
                    permlink: file.permlink,
                    resolvedDocumentName: documentName,
                    hasYdoc: !!this.ydoc,
                    documentType: file.type
                });
                
                // ✅ UNIFIED: Store document metadata in Y.js config for ALL documents
                if (documentName && this.ydoc) {
                    // Store all metadata in Y.js config
                    const config = this.ydoc.getMap('config');
                    config.set('documentName', documentName);
                    config.set('lastModified', new Date().toISOString());
                    config.set('documentType', file.type || 'local');
                    config.set('documentId', file.id);
                    
                    if (file.type === 'collaborative') {
                        if (file.owner) config.set('owner', file.owner);
                        if (file.permlink) config.set('permlink', file.permlink);
                    }
                    
                    console.log('📄 Document metadata stored in Y.js config:', documentName);
                    
                    // Extract back from Y.js config for consistency
                    const configMetadata = this.extractDocumentMetadataFromConfig();
                    
                    this.currentFile = {
                        ...file,
                        name: configMetadata?.documentName || documentName,
                        title: configMetadata?.documentName || documentName,
                        documentName: configMetadata?.documentName || documentName,
                        lastModified: configMetadata?.lastModified || file.lastModified
                    };
                    console.log('📄 Final currentFile set from Y.js config:', this.currentFile.name);
                } else {
                    // Fallback if Y.js not ready
                    console.warn('⚠️ Y.js document not ready, using fallback metadata');
                    this.currentFile = {
                        ...file,
                        name: documentName,
                        title: documentName,
                        documentName: documentName
                    };
                }
                
                console.log('📄 Publish options, custom JSON, and document name loaded from Y.js');
                
                // ✅ OFFLINE-FIRST: Dismiss modal immediately after local content is loaded
                this.showLoadModal = false;
                this.hasUnsavedChanges = false;
                
                console.log('✅ Modal dismissed - local content loaded from IndexedDB');
                
                // STEP 7: For cloud documents, connect to cloud in background (non-blocking)
                if (requiresCloudTier && file.type === 'collaborative') {
                    // Initialize permissions immediately to prevent read-only mode during loading
                    console.log('🔐 Initializing permissions for collaborative document...');
                    this.documentPermissions = [{
                        account: file.owner,
                        permissionType: 'postable', // Owner always has full access
                        grantedBy: file.owner,
                        grantedAt: new Date().toISOString()
                    }];
                    
                    // If user is not the owner, give them editable permissions by default
                    if (this.username !== file.owner) {
                        this.documentPermissions.push({
                            account: this.username,
                            permissionType: 'editable', // Default to editable, will be refined later
                            grantedBy: file.owner,
                            grantedAt: new Date().toISOString(),
                            source: 'initial-assumption'
                        });
                        console.log('🔐 Initial assumption: User has editable permissions (will be refined)');
                    }
                    
                    // Update URL with collaborative parameters for shareability
                    console.log('🔗 Updating URL with collaborative parameters...', { owner: file.owner, permlink: file.permlink });
                    try {
                        this.updateURLWithCollabParams(file.owner, file.permlink);
                        console.log('✅ URL update completed successfully');
                    } catch (urlError) {
                        console.error('❌ URL update failed:', urlError);
                    }
                    
                    // ✅ BACKGROUND CLOUD CONNECTION: Don't block UI for cloud connection
                    this.connectToCollaborationServer(file).catch(error => {
                        console.error('❌ Background cloud connection failed:', error);
                        // Don't throw - let user continue with offline editing
                    });
                    
                    console.log('🔗 Cloud connection started in background');
                    
                } else if (file.type === 'local' || !requiresCloudTier) {
                    // ✅ CRITICAL FIX: Set local URL parameters for local documents
                    if (file.id && this.username) {
                        // Use file ID as permlink base (persistent tech ID)
                        const permlink = file.id.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
                        this.updateURLWithLocalParams(this.username, permlink);
                        console.log('🔗 Main loadDocument: URL updated with local file parameters:', permlink);
                    }
                }
                
                // ✅ Clear cleanup flag after successful document loading
                this.isCleaningUp = false;
                
                console.log(`✅ Document loaded using ${requiresCloudTier ? 'Tier 2 (Cloud)' : 'Tier 1 (Local)'} editors`);
                
            } catch (error) {
                console.error('Failed to load document:', error);
                alert('Failed to load document: ' + error.message);
            } finally {
                this.loading = false;
            }
        },
        
        // REMOVED: saveDocument() - Replaced by auto-save architecture
        // Y.js + IndexedDB handles all content persistence automatically
        // Users can:
        // - Name documents via clickable titles
        // - Publish to cloud via "Publish to Cloud" 
        // - Duplicate via "Duplicate Document"

        async updateLocalFileIndex() {
            // Only save metadata to localStorage, not content (Y.js + IndexedDB handles content)
            const files = JSON.parse(localStorage.getItem('dlux_tiptap_files') || '[]');
            const existingIndex = files.findIndex(f => f.id === this.currentFile.id);
            
            const fileInfo = {
                id: this.currentFile.id,
                name: this.currentFile.name,
                type: this.currentFile.type,
                lastModified: this.currentFile.lastModified,
                isOfflineFirst: this.currentFile.isOfflineFirst || false, // Flag for Y.js + IndexedDB files
                size: this.currentFile.isOfflineFirst ? 0 : (this.currentFile.size || 0), // Size managed by IndexedDB for offline-first files
                // ✅ SECURITY: Preserve creator field for user filtering
                creator: this.currentFile.creator || this.username || 'anonymous',
                createdAt: this.currentFile.createdAt || new Date().toISOString(),
                // Preserve collaborative metadata if it exists
                isCollaborative: this.currentFile.isCollaborative,
                owner: this.currentFile.owner,
                permlink: this.currentFile.permlink,
                collaborativeId: this.currentFile.collaborativeId
            };
            
            if (existingIndex >= 0) {
                files[existingIndex] = fileInfo;
            } else {
                files.push(fileInfo);
            }
            
            localStorage.setItem('dlux_tiptap_files', JSON.stringify(files));
            console.log('📝 Local file index updated:', fileInfo.name, fileInfo.isOfflineFirst ? '(Y.js + IndexedDB)' : '(localStorage)');
        },
        
        async saveAsDocument() {
            // Force showing save modal for "Save As"
            this.showSaveModal = true;
            
            // For collaborative documents, pre-fill current name for rename
            if (this.currentFile && this.currentFile.type === 'collaborative') {
                this.saveForm.filename = this.currentFile.documentName || this.currentFile.permlink || '';
                this.saveForm.storageType = 'cloud';
                this.saveForm.isNewDocument = false; // This is a rename, not new document
            } else if (this.currentFile && (this.currentFile.name || this.currentFile.documentName || this.currentFile.permlink)) {
                // If there's a current file with a name, this is a duplication
                const originalName = this.currentFile.name || 
                                   this.currentFile.documentName || 
                                   this.currentFile.permlink;
                this.saveForm.filename = `Copy of ${originalName}`;
                this.saveForm.storageType = 'local'; // Default to local for copies
                this.saveForm.isNewDocument = true; // This creates a new document
            } else if (this.ydoc && (this.getPlainTextTitle()?.trim() && this.getPlainTextTitle().trim() !== '')) {
                // If there's a Y.js doc with actual content, this is a duplication
                const titleFromContent = this.getPlainTextTitle().trim();
                this.saveForm.filename = `Copy of ${titleFromContent}`;
                this.saveForm.storageType = 'local'; // Default to local for copies
                this.saveForm.isNewDocument = true; // This creates a new document
            } else {
                // No existing document or content - this is creating a new document from scratch
                this.saveForm.filename = ''; // Clear filename to force new name
                this.saveForm.storageType = 'local'; // Default to local for new documents
                this.saveForm.isNewDocument = true; // Flag to indicate this is a "Save As"
            }
        },
        
        async performSaveAs() {
            const documentName = this.saveForm.filename || `document_${Date.now()}`;
            
            // Initialize save as process
            this.saveAsProcess = {
                inProgress: true,
                step: 'creating_document',
                message: 'Creating new document...',
                localBackupId: null,
                serverDocId: null,
                error: null
            };
            
            try {
                // ✅ TIPTAP.DEV UNIFIED ARCHITECTURE: Handle existing vs new documents properly
                const originalLocalFile = this.currentFile;
                
                // Step 1: Create new local document using offline-first pattern
                await this.createNewDocumentFromName(documentName);
                
                // Step 2: If saving to cloud, create server document
                if (this.saveForm.storageType === 'cloud') {
                    this.saveAsProcess.step = 'creating_server';
                    this.saveAsProcess.message = 'Creating document on server...';
                    
                    const response = await fetch('https://data.dlux.io/api/collaboration/documents', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...this.authHeaders
                        },
                        body: JSON.stringify({
                            documentName: documentName,
                            isPublic: this.saveForm.isPublic,
                            title: this.getPlainTextTitle() || documentName,
                            description: this.saveForm.description || 'Document created with DLUX TipTap Editor'
                        })
                    });
                    
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                        throw new Error(`Failed to create server document: ${errorData.error || response.statusText}`);
                    }
                    
                    const docData = await response.json();
                    const serverDoc = docData.document || docData;
                    
                    this.saveAsProcess.step = 'connecting';
                    this.saveAsProcess.message = 'Connecting to collaboration server...';
                    
                    // Connect existing Y.js document to server
                    await this.connectToCollaborationServer(serverDoc);
                    
                    // Update current file to collaborative
                    this.currentFile = {
                        ...serverDoc,
                        type: 'collaborative'
                    };
                    this.fileType = 'collaborative';
                    
                    // ✅ CRITICAL: If this was a "Save As" from an existing local document, link them
                    if (originalLocalFile && originalLocalFile.id && originalLocalFile.type === 'local') {
                        await this.convertLocalToCollaborative(originalLocalFile, {
                            owner: serverDoc.owner,
                            permlink: serverDoc.permlink,
                            documentName: serverDoc.documentName || documentName
                        });
                    }
                    
                    // Reload collaborative documents list
                    await this.loadCollaborativeDocs();
                }
                
                this.saveAsProcess.step = 'finalizing';
                this.saveAsProcess.message = 'Finalizing...';
                
                console.log('✅ Document saved successfully:', documentName);
                
            } catch (error) {
                console.error('❌ Save failed:', error);
                this.saveAsProcess.error = error.message;
                throw error;
            } finally {
                // Reset save as process state
                setTimeout(() => {
                    this.saveAsProcess = {
                        inProgress: false,
                        step: '',
                        message: '',
                        localBackupId: null,
                        serverDocId: null,
                        error: null
                    };
                }, 3000);
            }
        },
        
        async performSave() {
            if (!this.hasValidFilename) return;
            
            this.saving = true;
            
            try {
                // Check if this is renaming an existing collaborative document
                if (this.currentFile && this.currentFile.type === 'collaborative' && !this.saveForm.isNewDocument) {
                    await this.renameCollaborativeDocument();
                }
                // Check if this is a "Save As" to collaborative doc
                else if (this.saveForm.isNewDocument && this.saveForm.storageType === 'cloud') {
                    await this.performSaveAs();
                }
                // Check if we need to create a new local document (no current file or no Y.js doc)
                else if (!this.currentFile || (!this.ydoc && this.saveForm.storageType === 'local')) {
                    // Use createNewDocumentFromName to create a new local Y.js document
                    await this.createNewDocumentFromName(this.saveForm.filename);
                    
                    // If also saving to cloud, connect to server
                    if (this.saveForm.storageType === 'cloud') {
                        const response = await fetch('https://data.dlux.io/api/collaboration/documents', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                ...this.authHeaders
                            },
                            body: JSON.stringify({
                                documentName: this.saveForm.filename,
                                isPublic: this.saveForm.isPublic,
                                title: this.getPlainTextTitle() || this.saveForm.filename,
                                description: this.saveForm.description || 'Document created with DLUX TipTap Editor'
                            })
                        });
                        
                        if (!response.ok) {
                            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                            throw new Error(`Failed to create server document: ${errorData.error || response.statusText}`);
                        }
                        
                        const docData = await response.json();
                        const serverDoc = docData.document || docData;
                        
                        // TIER 1 → TIER 2 UPGRADE: Properly upgrade to cloud with full cursors
                        // ✅ TIPTAP.DEV UNIFIED ARCHITECTURE: Link local and cloud documents
                        const originalLocalFile = this.currentFile;
                        
                        // Update current file to collaborative first
                        this.currentFile = {
                            ...serverDoc,
                            type: 'collaborative'
                        };
                        this.fileType = 'collaborative';
                        
                        // ✅ CRITICAL: Update local file metadata to link with cloud document
                        if (originalLocalFile && originalLocalFile.id) {
                            await this.convertLocalToCollaborative(originalLocalFile, {
                                owner: serverDoc.owner,
                                permlink: serverDoc.permlink,
                                documentName: serverDoc.documentName || this.saveForm.filename
                            });
                        }
                        
                        // Upgrade to cloud tier with full collaborative features
                        await this.upgradeLocalToCloudWithCursors();
                    }
                } else {
                    // Regular save - Y.js + IndexedDB handles all content persistence automatically
                    // Check if we need to upgrade from Tier 1 (local) to Tier 2 (cloud)
                    if (this.saveForm.storageType === 'cloud') {
                        if (this.currentFile?.type === 'local') {
                            // TIER 1 → TIER 2 UPGRADE: Convert local document to collaborative
                            console.log('🔄 Upgrading existing local document to cloud with full cursors');
                            
                            // Create server document first
                            const response = await fetch('https://data.dlux.io/api/collaboration/documents', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    ...this.authHeaders
                                },
                                body: JSON.stringify({
                                    documentName: this.currentFile.filename || this.saveForm.filename,
                                    isPublic: this.saveForm.isPublic,
                                    title: this.getPlainTextTitle() || this.currentFile.filename,
                                    description: this.saveForm.description || 'Document created with DLUX TipTap Editor'
                                })
                            });
                            
                            if (!response.ok) {
                                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                                throw new Error(`Failed to create server document: ${errorData.error || response.statusText}`);
                            }
                            
                            const docData = await response.json();
                            const serverDoc = docData.document || docData;
                            
                            // ✅ TIPTAP.DEV UNIFIED ARCHITECTURE: Link local and cloud documents
                            const originalLocalFile = this.currentFile;
                            
                            // Update current file to collaborative
                            this.currentFile = {
                                ...serverDoc,
                                type: 'collaborative'
                            };
                            this.fileType = 'collaborative';
                            
                            // ✅ CRITICAL: Update local file metadata to link with cloud document
                            if (originalLocalFile && originalLocalFile.id) {
                                await this.convertLocalToCollaborative(originalLocalFile, {
                                    owner: serverDoc.owner,
                                    permlink: serverDoc.permlink,
                                    documentName: serverDoc.documentName || this.saveForm.filename
                                });
                            }
                            
                            // Upgrade to cloud tier with full collaborative features
                            await this.upgradeLocalToCloudWithCursors();
                        } else {
                            // Already collaborative, just ensure connection
                            await this.connectToCollaborationServer();
                        }
                    }
                }
                
                this.showSaveModal = false;
                this.hasUnsavedChanges = false;
                this.saveForm.filename = '';
                this.saveForm.isNewDocument = false;
            } catch (error) {
                console.error('Save failed:', error);
                alert('Save failed: ' + error.message);
            } finally {
                this.saving = false;
            }
        },
        
        async renameCollaborativeDocument() {
            if (!this.currentFile || this.currentFile.type !== 'collaborative') return;
            
            try {
                const response = await fetch(`https://data.dlux.io/api/collaboration/documents/${this.currentFile.owner}/${this.currentFile.permlink}/name`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        ...this.authHeaders
                    },
                    body: JSON.stringify({
                        documentName: this.saveForm.filename
                    })
                });
                
                if (response.ok) {
                    const updatedDoc = await response.json();
                    
                    // Update current file reference
                    this.currentFile.documentName = this.saveForm.filename;
                    
                    // TRIGGER SAVE INDICATOR: Show saving state for collaborative rename
                    this.hasUnsavedChanges = true;
                    
                    // Reload collaborative docs list to reflect the change
                    await this.loadCollaborativeDocs();
                    
                    // CLEAR SAVE INDICATOR: Document rename completed successfully
                    this.hasUnsavedChanges = false;
                    
                    console.log('📝 Document renamed successfully:', this.saveForm.filename);
                } else {
                    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                    throw new Error(`Failed to rename document: ${errorData.error || response.statusText}`);
                }
            } catch (error) {
                console.error('Rename failed:', error);
                throw error;
            }
        },
        
        async shareDocument() {
            // If local file, prompt to publish to cloud first
            if (this.currentFile && this.currentFile.type === 'local') {
                const confirmPublish = confirm('This document needs to be published to the cloud before sharing. Publish now?');
                if (confirmPublish) {
                    await this.convertToCollaborative();
                    // After publishing, continue to share modal
                    if (this.currentFile?.type === 'collaborative') {
                        await this.loadDocumentPermissions();
                        this.showShareModal = true;
                    }
                }
                return;
            }
            
            // For collaborative documents, show share modal directly
            if (this.currentFile?.type === 'collaborative') {
                await this.loadDocumentPermissions();
                this.showShareModal = true;
                return;
            }
            
            alert('Please create or load a document first to enable sharing.');
        },
        
        async performShare() {
            if (!this.shareForm.username.trim()) return;
            
            const username = this.shareForm.username.trim();
            
            // Debug logging to track permission values
            console.log('🔍 DEBUG: performShare called with:', {
                username: username,
                selectedPermission: this.shareForm.permission,
                shareFormState: { ...this.shareForm }
            });
            
            const requestPayload = {
                targetAccount: username,
                permissionType: this.shareForm.permission
            };
            
            console.log('🔍 DEBUG: Request payload being sent:', requestPayload);
            
            try {
                const response = await fetch(`https://data.dlux.io/api/collaboration/permissions/${this.currentFile.owner}/${this.currentFile.permlink}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...this.authHeaders
                    },
                    body: JSON.stringify(requestPayload)
                });
                
                console.log('🔍 DEBUG: Server response status:', response.status, response.statusText);
                
                if (response.ok) {
                    const responseData = await response.json().catch(() => null);
                    console.log('🔍 DEBUG: Server response data:', responseData);
                    
                    // Clear form
                    this.shareForm.username = '';
                    this.shareForm.permission = 'readonly';
                    
                    // Reload permissions to update the list
                    await this.loadDocumentPermissions();
                    console.log('🔍 DEBUG: Permissions after reload:', this.documentPermissions);
                    
                    // Update editor permissions in case they changed
                    this.updateEditorPermissions();
                    
                    alert(`Document shared with @${username}!`);
                } else {
                    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                    console.log('🔍 DEBUG: Server error response:', errorData);
                    throw new Error(`Failed to share document: ${errorData.error || response.statusText}`);
                }
            } catch (error) {
                console.error('Share failed:', error);
                alert('Share failed: ' + error.message);
            }
        },
        
        async loadDocumentPermissions() {
            if (!this.currentFile || this.currentFile.type !== 'collaborative') return;
            if (!this.isAuthenticated) {
                console.warn('Cannot load permissions: Not authenticated');
                return;
            }
            
            this.loadingPermissions = true;
            
            try {
                // First verify we have valid auth headers
                const authHeadersValid = Object.entries(this.authHeaders).every(([key, value]) => {
                    if (!value) {
                        console.warn(`Missing auth header: ${key}`);
                        return false;
                    }
                    return true;
                });

                if (!authHeadersValid) {
                    throw new Error('Invalid or missing authentication headers');
                }

                // Prepare headers with proper authentication
                const headers = {
                    ...this.authHeaders,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                };

                // Prepare the request with proper auth headers
                const permissionsUrl = `https://data.dlux.io/api/collaboration/permissions/${this.currentFile.owner}/${this.currentFile.permlink}`;
                const authHeaders = {
                    ...headers,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                    // Note: Using this.authHeaders which contains the proper x-account, x-signature, etc.
                };
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);
                let response = null;

                // Log attempt details
                console.log('🔐 Fetching permissions:', {
                    url: permissionsUrl,
                    headers: Object.keys(authHeaders),
                    authenticated: this.isAuthenticated,
                    timestamp: new Date().toISOString()
                });

                try {
                    // Make the request with optimized settings
                    response = await fetch(permissionsUrl, {
                        method: 'GET',
                        headers: authHeaders,
                        credentials: 'omit', // We know this works
                        signal: controller.signal,
                        mode: 'cors',
                        cache: 'no-cache'
                    });

                    // Log response details
                    console.log('Permission response:', {
                        url: permissionsUrl,
                        status: response?.status,
                        ok: response?.ok,
                        headers: Object.fromEntries(response?.headers?.entries() || [])
                    });

                    if (!response?.ok) {
                        console.warn(`🔐 Permission API failed with HTTP ${response?.status}:`, {
                            status: response?.status,
                            statusText: response?.statusText,
                            url: permissionsUrl,
                            isOwner: this.currentFile.owner === this.username
                        });
                        
                        // Handle different error types
                        if (response?.status === 403) {
                            console.warn('🔐 HTTP 403: Permission denied - this could indicate:');
                            console.warn('  - Authentication headers are expired or invalid');
                            console.warn('  - User lacks permission to view document permissions');
                            console.warn('  - Server-side authentication validation failed');
                            
                            // For 403 errors, try to be more permissive for document owners
                            if (this.currentFile.owner === this.username) {
                                console.log('🔐 User is document owner, assuming full permissions despite 403');
                                this.documentPermissions = [{
                                    account: this.username,
                                    permissionType: 'postable',
                                    grantedBy: this.username,
                                    grantedAt: new Date().toISOString()
                                }];
                                return; // Skip the error throw for owners
                            }
                        }
                        
                        // Set default permissions as array with proper structure
                        const defaultPermissions = [];
                        
                        // Add owner permission
                        defaultPermissions.push({
                            account: this.currentFile.owner,
                            permissionType: 'postable', // Owner has full access
                            grantedBy: this.currentFile.owner,
                            grantedAt: new Date().toISOString()
                        });
                        
                        // Add current user permission if different from owner
                        if (this.username !== this.currentFile.owner) {
                            // For non-403 errors, default to readonly for safety
                            // For 403 errors, this suggests auth issues rather than permission issues
                            const fallbackPermission = response?.status === 403 ? 'editable' : 'readonly';
                            console.log(`🔐 Setting fallback permission to '${fallbackPermission}' for HTTP ${response?.status}`);
                            
                            defaultPermissions.push({
                                account: this.username,
                                permissionType: fallbackPermission,
                                grantedBy: this.currentFile.owner,
                                grantedAt: new Date().toISOString()
                            });
                        }

                        console.log('Using default permissions array:', defaultPermissions);
                        this.documentPermissions = defaultPermissions;
                        throw new Error(`HTTP ${response?.status}`);
                    }

                    // Parse and set permissions
                    const data = await response.json();
                    this.documentPermissions = data.permissions || [];
                    console.log('✅ Permissions loaded successfully');
                } catch (error) {
                    console.warn('Permission request failed:', {
                        error: error.message,
                        url: permissionsUrl,
                        headers: Object.keys(authHeaders),
                        timestamp: new Date().toISOString()
                    });
                    throw error;
                } finally {
                    clearTimeout(timeoutId);
                }
            } catch (error) {
                console.error('Error loading permissions:', error);
                
                // Handle 403 errors more gracefully - don't completely fail
                if (error.message.includes('HTTP 403')) {
                    console.warn('🔐 Handling 403 error gracefully - user may still have access via sharing');
                    console.warn('🔐 This is likely a server-side issue where permission loading requires different auth than permission granting');
                    
                    // For 403 errors, assume the user has the permissions they were granted
                    // Since they can access the document, they likely have at least editable access
                    const assumedPermissions = [{
                        account: this.currentFile.owner,
                        permissionType: 'postable',
                        grantedBy: this.currentFile.owner,
                        grantedAt: new Date().toISOString()
                    }];
                    
                    // If user is not the owner, assume they have postable permissions
                    // (since they were able to access the document, they likely were granted access)
                    if (this.username !== this.currentFile.owner) {
                        assumedPermissions.push({
                            account: this.username,
                            permissionType: 'postable', // Assume full access since they can access the doc
                            grantedBy: this.currentFile.owner,
                            grantedAt: new Date().toISOString(),
                            note: 'Assumed due to 403 error - actual permissions may vary'
                        });
                        console.log('🔐 Assuming user has postable permissions due to document access despite 403');
                    }
                    
                    this.documentPermissions = assumedPermissions;
                    
                    // Show a user-friendly notification about the permission loading issue
                    setTimeout(() => {
                        console.log('🔐 Showing user notification about permission loading issue');
                        if (this.username !== this.currentFile.owner) {
                            // Only show to non-owners since they're affected by the 403
                            alert('Note: Unable to load exact permissions due to a server issue, but you should have the access you were granted. If you experience any issues, contact the document owner.');
                        }
                    }, 1000);
                    
                    // Don't re-throw 403 errors - let the user try to use the document
                    return;
                }
                
                // For other errors, set empty permissions and re-throw
                this.documentPermissions = [];
                throw error; // Re-throw to handle in the calling function
            } finally {
                this.loadingPermissions = false;
            }
        },
        
        async revokePermission(account) {
            if (!confirm(`Revoke access for @${account}?`)) return;
            
            try {
                const response = await fetch(`https://data.dlux.io/api/collaboration/permissions/${this.currentFile.owner}/${this.currentFile.permlink}/${account}`, {
                    method: 'DELETE',
                    headers: this.authHeaders
                });
                
                if (response.ok) {
                    await this.loadDocumentPermissions();
                    // Update editor permissions in case current user's permissions changed
                    this.updateEditorPermissions();
                    console.log(`Permission revoked for @${account}`);
                } else {
                    throw new Error('Failed to revoke permission');
                }
            } catch (error) {
                console.error('Revoke permission failed:', error);
                alert('Failed to revoke permission: ' + error.message);
            }
        },
        
        async deleteDocument() {
            if (!this.canDelete) return;
            
            const confirmMsg = this.currentFile.type === 'local' 
                ? `Delete local file "${this.currentFile.name}"?`
                : `Delete collaborative document "${this.currentFile.permlink}"? This action cannot be undone.`;
                
            if (!confirm(confirmMsg)) return;
            
            this.deleting = true;
            
            try {
                if (this.currentFile.type === 'local') {
                    await this.deleteLocalFile();
                } else {
                    await this.deleteCollaborativeDoc();
                }
                
                // Create new document after deletion
                await this.newDocument();
            } catch (error) {
                console.error('Delete failed:', error);
                alert('Delete failed: ' + error.message);
            } finally {
                this.deleting = false;
            }
        },
        
        // ✅ AUTO-REFRESH: Document list management methods
        async refreshDocumentLists() {
            console.log('🔄 Refreshing document lists...');
            
            // Refresh local files
            await this.loadLocalFiles();
            
            // Refresh collaborative documents if authenticated
            if (this.showCollaborativeFeatures && this.isAuthenticated && !this.isAuthExpired) {
                await this.loadCollaborativeDocs();
            }
            
            console.log('✅ Document lists refreshed');
        },
        
        startAutoRefresh() {
            // Clear any existing timer
            this.stopAutoRefresh();
            
            // Set up periodic refresh every 30 seconds while modal is open
            this.autoRefreshTimer = setInterval(() => {
                if (this.showLoadModal) {
                    console.log('🔄 Auto-refreshing document lists (periodic)...');
                    this.refreshDocumentLists();
                } else {
                    // Modal was closed, stop auto-refresh
                    this.stopAutoRefresh();
                }
            }, 30000); // 30 seconds
            
            console.log('⏰ Auto-refresh started (30s interval)');
        },
        
        stopAutoRefresh() {
            if (this.autoRefreshTimer) {
                clearInterval(this.autoRefreshTimer);
                this.autoRefreshTimer = null;
                console.log('⏰ Auto-refresh stopped');
            }
        },
        
        // Local Storage Operations
        async loadLocalFiles() {
            try {
                const files = JSON.parse(localStorage.getItem('dlux_tiptap_files') || '[]');
                
                // ✅ SECURITY FIX: Filter local files by current user
                // Only show files created by the current logged-in user
                if (this.username) {
                    this.localFiles = files.filter(file => {
                        // For collaborative documents converted to local, check owner
                        if (file.isCollaborative && file.owner) {
                            return file.owner === this.username;
                        }
                        // For pure local documents, check creator (if available)
                        if (file.creator) {
                            return file.creator === this.username;
                        }
                        // For legacy documents without creator info, check if they have user-specific metadata
                        if (file.author) {
                            return file.author === this.username;
                        }
                        // ✅ FALLBACK: For very old documents without user info, show them
                        // This maintains backward compatibility but isn't ideal for multi-user scenarios
                        console.warn('⚠️ Local document without user info found:', file.name, 'ID:', file.id);
                        return true; // Show legacy documents to avoid data loss
                    });
                    
                    console.log(`📋 Filtered local files: ${this.localFiles.length}/${files.length} files for user: ${this.username}`);
                } else {
                    // ✅ NO USER: If not logged in, don't show any local files
                    // This prevents unauthorized access to other users' documents
                    console.log('📋 No user logged in, hiding all local files for security');
                    this.localFiles = [];
                }
                
                // Also scan IndexedDB for Y.js documents
                await this.scanIndexedDBDocuments();
            } catch (error) {
                console.error('Failed to load local files:', error);
                this.localFiles = [];
            }
        },

        // Scan IndexedDB for Y.js documents to detect local versions of cloud documents
        async scanIndexedDBDocuments() {
            try {
                console.log('🔍 Scanning IndexedDB for Y.js documents...');
                
                // Y.js creates separate databases for each document (TipTap.dev best practice)
                // We need to list all databases and check for our document pattern
                if (!indexedDB.databases) {
                    console.log('📋 IndexedDB.databases() not supported, cannot scan');
                    return;
                }
                
                const databases = await indexedDB.databases();
                console.log(`📋 Found ${databases.length} total IndexedDB databases`);
                
                let foundDocuments = 0;
                this.indexedDBDocuments.clear();
                
                // Check each database to see if it matches our document pattern
                for (const dbInfo of databases) {
                    const dbName = dbInfo.name;
                    
                    // Check if this database name matches our owner/permlink pattern
                    if (dbName && dbName.includes('/')) {
                        // This looks like one of our Y.js document databases
                        this.indexedDBDocuments.add(dbName);
                        foundDocuments++;
                        console.log(`📋 Found Y.js document database: ${dbName}`);
                    }
                }
                
                console.log(`📋 IndexedDB documents found: ${foundDocuments}`);
                
            } catch (error) {
                console.error('Error in scanIndexedDBDocuments:', error);
                // Fallback: assume no documents if scanning fails
                console.log('📋 IndexedDB scanning failed, assuming no local documents');
            }
        },
        
        // ENHANCED DOCUMENT LOADING: TipTap Best Practice Implementation
        async loadLocalFile(file) {
            // ✅ SECURITY: Verify user has access to this local file
            if (!this.username) {
                console.error('❌ No user logged in - cannot load local file');
                throw new Error('Authentication required to access local files');
            }
            
            // Check file ownership
            const fileOwner = file.isCollaborative ? file.owner : (file.creator || file.author);
            if (fileOwner && fileOwner !== this.username) {
                console.error('❌ Access denied: File belongs to different user', {
                    fileOwner,
                    currentUser: this.username,
                    fileName: file.name,
                    fileId: file.id
                });
                throw new Error(`Access denied: This file belongs to ${fileOwner}. You are logged in as ${this.username}.`);
            }
            
            // ✅ TIPTAP BEST PRACTICE: Clean state FIRST, then set new URL
            // Clean up any existing state first (includes URL cleanup)
            this.fullCleanupCollaboration();
            
            this.currentFile = file;
            this.fileType = 'local';
            
            // Check if this is an offline-first file (uses Y.js + IndexedDB)
            if (file.isOfflineFirst) {
                console.log('📂 Loading offline-first local file:', file.name);
                
                // CRITICAL FIX: Local files should NOT use collaborative mode
                // They use Y.js for persistence but remain local (no WebSocket)
                this.isCollaborativeMode = false;
                
                // ✅ CRITICAL FIX: Ensure Vue reactive data is reset (redundant but safe)
                this.isCleaningUp = true; // Prevent updateCustomJsonDisplay from overriding our reset
                this.customJsonString = '';
                this.customJsonError = '';
                this.tagInput = '';
                this.isUpdatingCustomJson = false;
                this.isLoadingPublishOptions = false;
                this.isUpdatingPublishOptions = false;
                console.log('✅ Vue reactive data reset for local file load');
                
                // TIPTAP BEST PRACTICE: Pre-load Y.js document before editor creation
                await this.preloadYjsDocument(file);
                
                // ✅ SECURITY: Verify Y.js document ownership after loading from IndexedDB
                if (this.ydoc) {
                    const config = this.ydoc.getMap('config');
                    const docOwner = config.get('owner');  // ✅ FIX: Removed creator fallback - creator is never written to Y.js
                    if (docOwner && docOwner !== this.username) {
                        console.error('❌ Y.js document ownership mismatch', {
                            yjsOwner: docOwner,
                            currentUser: this.username,
                            fileId: file.id
                        });
                        // Clean up the loaded document
                        if (this.ydoc) {
                            this.ydoc.destroy();
                            this.ydoc = null;
                        }
                        throw new Error(`Y.js document ownership verification failed: Document belongs to ${docOwner}`);
                    }
                    console.log('✅ Y.js document ownership verified for user:', this.username);
                }
                
                // Create local editors with Y.js persistence (Tier 1)
                await this.createWorkingEditors(); // Will choose Local Tier due to isCollaborativeMode = false
                
                // ✅ CORRECT: TipTap automatically loads content from Y.js/IndexedDB
                // But we need to sync editor content to Vue component state for UI elements
                await this.$nextTick(); // Wait for editors to be fully initialized
                
                // CRITICAL: Sync editor content to Vue component state for UI reactivity
                // Add delay to allow TipTap to fully load content from Y.js
                setTimeout(async () => {
                    await this.syncEditorContentToVueState();
                    
                    // If still no content, try again after a longer delay
                    if (!this.content.title && !this.content.body) {
                        console.log('⏳ Content not loaded yet, retrying in 500ms...');
                        setTimeout(async () => {
                            await this.syncEditorContentToVueState();
                            
                            // ✅ TIPTAP BEST PRACTICE: Use editor methods instead of direct Y.js access
                            if (!this.content.title && !this.content.body) {
                                console.log('🔍 DEBUGGING: Testing if content exists using TipTap editor methods...');
                                if (this.titleEditor && this.bodyEditor) {
                                    const titleContent = this.titleEditor.getHTML() || '';
                                    const bodyContent = this.bodyEditor.getHTML() || '';
                                    const titleText = this.titleEditor.getText() || '';
                                    const bodyText = this.bodyEditor.getText() || '';
                                    
                                    console.log('🔍 Title editor has content:', !!titleContent);
                                    console.log('🔍 Body editor has content:', !!bodyContent);
                                    console.log('🔍 Title text length:', titleText.length);
                                    console.log('🔍 Body text length:', bodyText.length);
                                    console.log('🔍 Y.js document state vector:', this.ydoc?.getStateVector());
                                    console.log('🔍 IndexedDB provider status:', this.indexeddbProvider?.synced);
                                }
                            }
                        }, 500);
                    }
                }, 100);
                
                console.log('📂 Offline-first local file loaded from IndexedDB:', file.name);
                
            } else {
                console.log('📂 Loading legacy local file:', file.name);
                
                // Legacy local files stored in localStorage
                const content = JSON.parse(localStorage.getItem(`dlux_tiptap_file_${file.id}`) || '{}');
            this.isCollaborativeMode = false;
            this.content = content;
            
                await this.createStandardEditor(); // TIPTAP BEST PRACTICE: Create standard non-collaborative editor
            this.setEditorContent(content);
            
                console.log('📂 Legacy local file loaded from localStorage:', file.name);
            }
            
            // ✅ TIPTAP BEST PRACTICE: Set URL AFTER successful document load
            if (file.id && this.username) {
                // Use Y.js document ID as permlink base (persistent tech ID)
                const permlink = file.id.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
                this.updateURLWithLocalParams(this.username, permlink);
                console.log('🔗 URL updated with Y.js document ID as permlink:', permlink);
            }
        },
        

        
        async deleteLocalFile(fileId = null) {
            const targetFileId = fileId || this.currentFile?.id;
            
            if (!targetFileId) {
                console.error('No file ID provided for deletion');
                console.log('🔍 DEBUG: Deletion context:', {
                    providedFileId: fileId,
                    currentFileId: this.currentFile?.id,
                    currentFileName: this.currentFile?.name,
                    currentFileType: this.currentFile?.type,
                    currentFileOwner: this.currentFile?.owner,
                    currentFilePermlink: this.currentFile?.permlink,
                    isCollaborative: this.currentFile?.isCollaborative
                });
                
                // ✅ EDGE CASE FIX: If this is an orphaned file with collaborative metadata,
                // try to use alternative identifiers for deletion
                if (this.currentFile && this.currentFile.isCollaborative && this.currentFile.owner && this.currentFile.permlink) {
                    const collaborativeId = `${this.currentFile.owner}/${this.currentFile.permlink}`;
                    console.warn('⚠️ Attempting deletion using collaborative ID for orphaned file:', collaborativeId);
                    
                    // Try to find and delete by collaborative ID
                    const files = JSON.parse(localStorage.getItem('dlux_tiptap_files') || '[]');
                    const orphanedFile = files.find(f => 
                        f.isCollaborative && 
                        f.owner === this.currentFile.owner && 
                        f.permlink === this.currentFile.permlink
                    );
                    
                    if (orphanedFile) {
                        console.log('🚨 Found orphaned file, attempting cleanup:', orphanedFile.name);
                        await this.cleanupOrphanedFiles([orphanedFile]);
                        return;
                    }
                }
                
                // If we still can't find a way to delete, suggest diagnostic tools
                console.error('❌ Cannot delete file - no valid ID found. Try running diagnostic tools:');
                console.log('💡 Run: await window.tiptapEditor.diagnoseOrphanedFiles()');
                console.log('💡 Or: await window.tiptapEditor.cleanupOrphanedFiles()');
                
                // ✅ AUTO-RUN DIAGNOSTIC: Automatically run diagnostic to help user
                console.log('🔍 Auto-running diagnostic to identify the problem...');
                try {
                    const orphaned = await this.diagnoseOrphanedFiles();
                    if (orphaned.length > 0) {
                        console.log('🚨 FOUND ORPHANED FILES:', orphaned);
                        const autoFix = confirm(`Found ${orphaned.length} orphaned file(s) that may be causing deletion issues.\n\nFiles found:\n${orphaned.map(f => `- ${f.name} (${f.reason})`).join('\n')}\n\nAutomatically clean them up now?`);
                        if (autoFix) {
                            await this.cleanupOrphanedFiles(orphaned);
                        }
                    } else {
                        console.log('🔍 No orphaned files found. The issue may be different.');
                        
                        // ✅ ENHANCED DEBUG: Show detailed file structure analysis
                        console.log('🔍 DETAILED DEBUG: Analyzing file structure...');
                        const allFiles = JSON.parse(localStorage.getItem('dlux_tiptap_files') || '[]');
                        console.log('📋 All local files in localStorage:', allFiles);
                        console.log('📄 Current file being deleted:', this.currentFile);
                        
                        // Check for files with missing or malformed IDs
                        const filesWithoutIds = allFiles.filter(f => !f.id || f.id === '' || f.id === null || f.id === undefined);
                        const filesWithWeirdIds = allFiles.filter(f => f.id && (typeof f.id !== 'string' || f.id.length < 3));
                        
                        console.log('🚨 Files without proper IDs:', filesWithoutIds);
                        console.log('🚨 Files with suspicious IDs:', filesWithWeirdIds);
                        
                        if (filesWithoutIds.length > 0 || filesWithWeirdIds.length > 0) {
                            const problematicFiles = [...filesWithoutIds, ...filesWithWeirdIds];
                            const fixProblematic = confirm(`Found ${problematicFiles.length} file(s) with missing or malformed IDs that may be causing deletion issues.\n\nFiles:\n${problematicFiles.map(f => `- ${f.name || 'Unnamed'} (ID: ${f.id || 'MISSING'})`).join('\n')}\n\nFix these files by assigning proper IDs?`);
                            
                            if (fixProblematic) {
                                await this.fixFilesWithMalformedIds(problematicFiles);
                            }
                        } else {
                            alert('No orphaned files detected and all files have proper IDs.\n\nThe deletion issue may be caused by a different problem.\n\nPlease check the browser console for more details.');
                        }
                    }
                } catch (diagError) {
                    console.error('❌ Diagnostic failed:', diagError);
                }
                return;
            }
            
            // Get file info to check if it's offline-first
            const files = JSON.parse(localStorage.getItem('dlux_tiptap_files') || '[]');
            const fileInfo = files.find(f => f.id === targetFileId);
            
            if (fileInfo?.isOfflineFirst) {
                // For offline-first files, content is in IndexedDB (managed by Y.js)
                // We only remove the metadata entry
                console.log('🗑️ Deleting offline-first file metadata:', targetFileId);
                
                // Note: IndexedDB content will be cleaned up by Y.js garbage collection
                // or can be manually cleaned if needed in the future
            } else {
                // For legacy files, remove content from localStorage
            localStorage.removeItem(`dlux_tiptap_file_${targetFileId}`);
                console.log('🗑️ Deleted legacy file content from localStorage:', targetFileId);
            }
            
            // Remove from index (both types)
            const updatedFiles = files.filter(f => f.id !== targetFileId);
            localStorage.setItem('dlux_tiptap_files', JSON.stringify(updatedFiles));
            
            await this.loadLocalFiles();
            console.log('🗑️ Local file deleted:', targetFileId);
            
            // If we deleted the currently loaded file, create a new document
            if (this.currentFile?.id === targetFileId) {
                await this.newDocument();
            }
        },
        
        // Collaborative Document Operations
        async loadCollaborativeDocs() {
            if (!this.showCollaborativeFeatures) {
                console.log('Not authenticated for collaborative features');
                this.collaborativeDocs = [];
                return;
            }
            
            // RACE CONDITION FIX: Skip if already initializing to prevent double loading
            if (this.isInitializing) {
                console.log('📋 Loading collaborative documents during initialization...');
            }
            
            this.loadingDocs = true;
            
            try {
                const response = await fetch('https://data.dlux.io/api/collaboration/documents', {
                    headers: this.authHeaders
                });
                
                if (response.ok) {
                    const data = await response.json();
                    this.collaborativeDocs = data.documents || [];
                    console.log('✅ Loaded collaborative documents:', this.collaborativeDocs.length);
                    
                    // Refresh IndexedDB scan to detect local versions of cloud documents
                    await this.scanIndexedDBDocuments();
                } else {
                    console.error('Failed to load collaborative documents:', response.statusText);
                    if (response.status === 401) {
                        console.log('Authentication required for collaborative documents');
                    }
                }
            } catch (error) {
                console.error('Error loading collaborative documents:', error);
            } finally {
                this.loadingDocs = false;
                
                // RACE CONDITION FIX: Remove URL check from here
                // URL-based document loading is now handled by the new initialization flow
                // This prevents the race condition between checkAutoConnectParams() and loadCollaborativeDocs()
                console.log('📋 Collaborative documents loaded successfully');
            }
        },
        
        async loadCollaborativeFile(doc) {
            // Check if we're already loading this exact document
            if (this.isInitializing) {
                console.warn('⚠️ Already initializing, skipping load request');
                return;
            }
            
            // Check if this is the same document we just loaded (prevent rapid reloads)
            const docKey = `${doc.owner}/${doc.permlink}`;
            if (this.lastDocumentLoaded === docKey && this.connectionStatus === 'connected') {
                console.log('📋 Same document already loaded and connected, skipping');
                return;
            }
            
            this.lastDocumentLoaded = docKey;
            
            // ✅ CRITICAL FIX: Clean URL state FIRST to prevent parameter stacking
            this.clearCollabURLParams();
            console.log('🧹 URL parameters cleared before loading new collaborative document');
            
            // TIPTAP BEST PRACTICE: Only disconnect WebSocket when switching documents
            // Keep Y.js document and IndexedDB persistence alive for offline-first editing
            this.disconnectWebSocketOnly();
            
            // ✅ CRITICAL FIX: Reset Vue reactive data when switching documents
            this.isCleaningUp = true; // Prevent updateCustomJsonDisplay from overriding our reset
            this.customJsonString = '';
            this.customJsonError = '';
            this.tagInput = '';
            this.isUpdatingCustomJson = false;
            this.isLoadingPublishOptions = false;
            this.isUpdatingPublishOptions = false;
            console.log('✅ Vue reactive data reset for collaborative document switch');
            
            // Shorter delay since we're not destroying everything
            await new Promise(resolve => setTimeout(resolve, 100));
            
            this.currentFile = {
                ...doc,
                name: doc.documentName || doc.name || doc.title || `${doc.owner}/${doc.permlink}`, // Ensure name field is set
                type: 'collaborative'
            };
            this.fileType = 'collaborative';
            this.isCollaborativeMode = true;
            
            // COMPREHENSIVE SOLUTION: Store current document info for URL sharing
            this.currentDocumentInfo = {
                owner: doc.owner,
                permlink: doc.permlink,
                title: doc.title,
                description: doc.description
            };
            
            // STEP 1: Update URL with collaborative parameters immediately for shareability
            console.log('🔗 Updating URL with collaborative parameters...', { owner: doc.owner, permlink: doc.permlink });
            try {
                this.updateURLWithCollabParams(doc.owner, doc.permlink);
                console.log('✅ URL update completed successfully');
            } catch (urlError) {
                console.error('❌ URL update failed:', urlError);
            }
            
            // Load content structure - PRESERVE DOCUMENT TITLE
            this.content = {
                title: doc.title || doc.permlink.replace(/-/g, ' '), // Use actual document title, fallback to formatted permlink
                body: '',
                tags: ['dlux', 'collaboration'],
                custom_json: {
                    app: 'dlux/0.1.0',
                    authors: [doc.owner]
                }
            };
            
            // STEP 2: Initialize permissions immediately to prevent read-only mode during loading
            console.log('🔐 Initializing permissions for collaborative document...');
            this.documentPermissions = [{
                account: this.currentFile.owner,
                permissionType: 'postable', // Owner always has full access
                grantedBy: this.currentFile.owner,
                grantedAt: new Date().toISOString()
            }];
            
            // If user is not the owner, give them editable permissions by default
            // This will be refined after WebSocket connection or API call
            if (this.username !== this.currentFile.owner) {
                this.documentPermissions.push({
                    account: this.username,
                    permissionType: 'editable', // Default to editable, will be refined later
                    grantedBy: this.currentFile.owner,
                    grantedAt: new Date().toISOString(),
                    source: 'initial-assumption'
                });
                console.log('🔐 Initial assumption: User has editable permissions (will be refined)');
            }
            
            try {
                // UNIFIED APPROACH: Use the single entry point for editor creation
                console.log('🏗️ Creating collaborative editors using unified approach...');
                await this.createWorkingEditors(); // Will automatically use Tier 2 (Cloud) for collaborative docs
                
                // ✅ TIPTAP BEST PRACTICE: Store document name in Y.js config BEFORE connection
                const documentName = doc.documentName || doc.name || doc.title || `${doc.owner}/${doc.permlink}`;
                console.log('🔍 DEBUG: About to call setDocumentName with:', documentName);
                console.log('🔍 DEBUG: Y.js document exists:', !!this.ydoc);
                const setResult = this.setDocumentName(documentName);
                console.log('📄 Document name stored in Y.js config before collaborative connection:', documentName, 'Result:', setResult);
                
                // STEP 3: Then connect the existing Y.js document to the server
                console.log('🔗 Connecting to collaboration server...');
                await this.connectToCollaborationServer(doc);
                
                // STEP 4: Refine permissions based on successful connection
                console.log('🔐 Refining permissions based on WebSocket connection...');
                if (this.connectionStatus === 'connected') {
                    console.log('✅ WebSocket connected successfully - confirming user access');
                    
                    // WebSocket connection successful - confirm/upgrade permissions
                    const refinedPermissions = [{
                        account: this.currentFile.owner,
                        permissionType: 'postable', // Owner always has full access
                        grantedBy: this.currentFile.owner,
                        grantedAt: new Date().toISOString()
                    }];
                    
                    // For non-owners who can connect, confirm they have meaningful access
                    if (this.username !== this.currentFile.owner) {
                        // Since they successfully connected to WebSocket, they likely have edit access
                        refinedPermissions.push({
                            account: this.username,
                            permissionType: 'editable', // Confirmed by successful connection
                            grantedBy: this.currentFile.owner,
                            grantedAt: new Date().toISOString(),
                            source: 'confirmed-by-websocket-connection'
                        });
                        console.log('🔗 Non-owner successfully connected - confirming editable permissions');
                    }
                    
                    this.documentPermissions = refinedPermissions;
                    console.log('✅ Permissions confirmed by successful WebSocket connection');
                    this.updateEditorPermissions();
                } else {
                    console.warn('⚠️ WebSocket not connected - falling back to permission API');
                    
                    // FALLBACK: Try to load permissions via REST API
                    try {
                        console.log('🔐 Loading permissions for collaborative document...');
                        await this.loadDocumentPermissions();
                        console.log('✅ Permissions loaded, updating editor permissions...');
                        this.updateEditorPermissions();
                    } catch (error) {
                        console.warn('⚠️ Failed to load permissions:', error);
                        
                        // Final fallback: Offline-first permissions
                        console.log('🔒 Using offline-first fallback permissions');
                        this.documentPermissions = [{
                            account: this.currentFile.owner,
                            permissionType: 'postable',
                            grantedBy: this.currentFile.owner,
                            grantedAt: new Date().toISOString()
                        }];
                        
                        if (this.username !== this.currentFile.owner) {
                            // OFFLINE-FIRST: If user can access the document, assume they have editing rights
                            // This follows TipTap.dev best practice of offline-first collaborative editing
                            this.documentPermissions.push({
                                account: this.username,
                                permissionType: 'editable', // Offline-first: assume editing permissions
                                grantedBy: this.currentFile.owner,
                                grantedAt: new Date().toISOString(),
                                source: 'offline-first-fallback'
                            });
                            console.log('🔐 Offline-first: Assuming user has editing permissions since they can access document');
                        }
                        
                        this.updateEditorPermissions();
                    }
                }
                console.log('🤝 Collaborative document loaded:', doc.permlink);
            } catch (error) {
                console.error('❌ Failed to load collaborative document:', error);
                
                // Enhanced error handling for different types of failures
                if (error.message.includes('different constructor') || 
                    error.message.includes('already been defined') ||
                    error.message.includes('mismatched transaction')) {
                    console.log('🔄 Schema/type conflict detected, attempting clean retry...');
                    
                    // Force a complete cleanup
                                            this.fullCleanupCollaboration();
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    try {
                        // Try again with a fresh start - create editors first, then connect
                        console.log('🔄 Retry: Creating collaborative editors...');
                        await this.createStandardEditor();
                        console.log('🔄 Retry: Connecting to server...');
                        await this.connectToCollaborationServer(doc);
                        console.log('✅ Collaborative document loaded on retry:', doc.permlink);
                        return; // Success on retry
                    } catch (retryError) {
                        console.error('❌ Retry also failed:', retryError);
                        // Fall through to fallback mode
                    }
                }
                
                // Fall back to standard editor if collaboration fails
                console.log('🔄 Falling back to standard editor due to collaboration error');
                // FIXED: Don't change collaborative status - keep it as collaborative but offline
                // this.fileType = 'local';  // Keep as collaborative to show proper cloud indicator
                // this.isCollaborativeMode = false;  // Keep true to show slashed cloud, not dotted
                
                try {
                    await this.createStandardEditor();
                    
                    // Try to load content safely in standard mode
                    console.log('📄 Loading content in standard editor mode...');
                    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for editor initialization
                    this.setEditorContent(this.content);
                    
                    console.log('✅ Successfully loaded in standard editor mode');
                } catch (fallbackError) {
                    console.error('❌ Standard editor fallback also failed:', fallbackError);
                    
                    // Ultimate fallback - create minimal content
                    this.content = {
                        title: doc.permlink.replace(/-/g, ' '),
                        body: '<p>This document could not be loaded properly. There may be a compatibility issue with the content format.</p>',
                        tags: ['dlux', 'collaboration'],
                        custom_json: { app: 'dlux/0.1.0', authors: [doc.owner] },
                        permlink: '',
                        beneficiaries: []
                    };
                }
                
                // Show user-friendly error message
                this.connectionMessage = `Collaboration failed: ${error.message}. Using offline mode.`;
                this.connectionStatus = 'disconnected';
                
                // Show user notification
                console.warn('Operating in offline mode due to collaboration error');
                alert(`⚠️ Collaborative mode failed for this document.\n\nError: ${error.message}\n\nThe document has been loaded in offline mode. You can still edit it, but changes won't be synchronized with other users.`);
            }
        },
        

        
        async deleteCollaborativeDoc(doc = null) {
            const targetDoc = doc || this.currentFile;
            
            if (!targetDoc || !targetDoc.owner || !targetDoc.permlink) {
                console.error('No valid collaborative document provided for deletion');
                return;
            }
            
            try {
                const response = await fetch(`https://data.dlux.io/api/collaboration/documents/${targetDoc.owner}/${targetDoc.permlink}`, {
                    method: 'DELETE',
                    headers: this.authHeaders
                });
                
                if (response.ok) {
                    await this.loadCollaborativeDocs();
                    console.log('🗑️ Collaborative document deleted:', targetDoc.permlink);
                    
                    // If we deleted the currently loaded file, create a new document
                    if (this.currentFile?.permlink === targetDoc.permlink && this.currentFile?.owner === targetDoc.owner) {
                        await this.newDocument();
                    }
                } else {
                    const errorText = await response.text().catch(() => 'Unknown error');
                    throw new Error(`Failed to delete collaborative document: ${errorText}`);
                }
            } catch (error) {
                console.error('Failed to delete collaborative document:', error);
                
                if (error.message.includes('NetworkError')) {
                    throw new Error('Network error: Unable to connect to server. Please check your connection and try again.');
                }
                
                throw error;
            }
        },
        
        // ===== UNIFIED EDITOR CREATION: SINGLE ENTRY POINT =====
        // ✅ CORRECT: Unified editor creation following TipTap best practices
        async createWorkingEditors() {
            // RACE CONDITION FIX: Prevent multiple simultaneous editor creation calls
            if (this.creatingEditors) {
                console.log('⚠️ Editors are already being created, skipping duplicate call');
                return;
            }
            
            this.creatingEditors = true;
            console.log('🏗️ Creating editors using unified 2-tier approach...');
            
            try {
                const bundle = window.TiptapCollaboration?.default || window.TiptapCollaboration;
                
                if (!bundle) {
                    throw new Error('TipTap collaboration bundle is required');
                }
                
                // CRITICAL: Clean up any corrupted Y.js state before creating editors
                await this.cleanupCorruptedCollaborativeState();
                
                // ===== DECISION TREE: TIER 1 (LOCAL) vs TIER 2 (CLOUD) =====
                const shouldUseCloudTier = this.shouldUseCloudTier();
                
                if (shouldUseCloudTier) {
                    console.log('☁️ Using Tier 2: Cloud editors with full collaborative features');
                    await this.createCloudEditorsWithCursors(bundle);
                } else {
                    console.log('💻 Using Tier 1: Offline-first collaborative editors');
                    await this.createOfflineFirstCollaborativeEditors(bundle);
                }
                
                console.log('✅ Unified editor creation completed successfully');
                
            } catch (error) {
                console.error('❌ Failed to create editors:', error);
                
                // ENHANCED ERROR HANDLING: Check for specific Y.js collaboration errors
                if (error.message.includes('Unexpected case') || 
                    error.message.includes('mismatched transaction') ||
                    error.message.includes('different constructor')) {
                    console.log('🔄 Y.js collaboration error detected, attempting recovery...');
                    
                    try {
                        // Force complete cleanup and retry
                        await this.forceCleanupAndRetry(bundle);
                        console.log('✅ Editor creation succeeded on retry after cleanup');
                        return;
                    } catch (retryError) {
                        console.error('❌ Retry also failed:', retryError);
                        // Fall through to basic editor fallback
                    }
                }
                
                // FALLBACK: Create basic editors without Y.js collaboration
                console.log('🔄 Creating fallback basic editors without collaboration...');
                await this.createBasicEditorsAsFallback(bundle);
                
                // Show user notification about collaboration being disabled
                setTimeout(() => {
                    alert('⚠️ Collaborative features are temporarily disabled due to a technical issue. Your document will work normally, but real-time collaboration is not available. Please refresh the page to restore collaborative features.');
                }, 1000);
            } finally {
                // RACE CONDITION FIX: Always clear the creating flag
                this.creatingEditors = false;
            }
        },

        // ===== TIPTAP BEST PRACTICE: CORRUPTED STATE CLEANUP =====
        async cleanupCorruptedCollaborativeState() {
            console.log('🧹 Cleaning up potentially corrupted collaborative state...');
            
            try {
                // STEP 1: Clean up existing editors (preserve Y.js document if valid)
                await this.cleanupEditorsOnly();
                
                // STEP 2: Check for corrupted Y.js document
                if (this.ydoc) {
                    try {
                        // Test Y.js document integrity
                        const testMap = this.ydoc.getMap('test');
                        testMap.set('integrity_check', Date.now());
                        testMap.delete('integrity_check');
                        console.log('✅ Y.js document integrity check passed');
                    } catch (yjsError) {
                        console.warn('⚠️ Y.js document corrupted, destroying:', yjsError.message);
                        this.ydoc.destroy();
                        this.ydoc = null;
                    }
                }
                
                // STEP 3: Clean up IndexedDB provider if corrupted
                if (this.indexeddbProvider) {
                    try {
                        // Test IndexedDB provider
                        if (this.indexeddbProvider.synced === false) {
                            console.warn('⚠️ IndexedDB provider not synced, recreating...');
                            this.indexeddbProvider.destroy();
                            this.indexeddbProvider = null;
                        }
                    } catch (idbError) {
                        console.warn('⚠️ IndexedDB provider corrupted:', idbError.message);
                        this.indexeddbProvider = null;
                    }
                }
                
                // STEP 4: Clear any corrupted WebSocket provider
                if (this.provider) {
                    try {
                        this.provider.disconnect();
                        this.provider.destroy();
                    } catch (providerError) {
                        console.warn('⚠️ Error cleaning up WebSocket provider:', providerError.message);
                    }
                    this.provider = null;
                }
                
                // STEP 5: Reset collaborative state flags
                this.connectionStatus = 'offline';
                this.isInitializing = false;
                this.schemaVersionMismatch = false;
                
                console.log('✅ Corrupted state cleanup completed');
                
            } catch (error) {
                console.error('❌ Error during corrupted state cleanup:', error);
                // Continue anyway - we'll handle this in the retry logic
            }
        },

        // ===== TIPTAP BEST PRACTICE: FORCE CLEANUP AND RETRY =====
        async forceCleanupAndRetry(bundle) {
            console.log('🔄 Performing force cleanup and retry...');
            
            // STEP 1: Complete collaborative cleanup
            this.fullCleanupCollaboration();
            
            // STEP 2: Wait for cleanup to complete
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // STEP 3: Clear DOM elements completely
            this.cleanupDOMElements();
            
            // STEP 4: Force Vue to update refs
            await this.$nextTick();
            
            // STEP 5: Retry editor creation with fresh state
            const shouldUseCloudTier = this.shouldUseCloudTier();
            
            if (shouldUseCloudTier) {
                console.log('🔄 Retry: Creating cloud editors...');
                await this.createCloudEditorsWithCursors(bundle);
            } else {
                console.log('🔄 Retry: Creating offline-first editors...');
                await this.createOfflineFirstCollaborativeEditors(bundle);
            }
        },

        // ===== TIPTAP BEST PRACTICE: BASIC EDITOR FALLBACK =====
        async createBasicEditorsAsFallback(bundle) {
            console.log('🔄 Creating basic editors as fallback (no Y.js collaboration)...');
            
            try {
                // Clean up any remaining collaborative state
                await this.cleanupEditorsOnly();
                await this.$nextTick();
                
                const Editor = bundle.Editor?.default || bundle.Editor;
                const StarterKit = bundle.StarterKit?.default || bundle.StarterKit;
                const Placeholder = bundle.Placeholder?.default || bundle.Placeholder;
                
                if (!Editor || !StarterKit || !Placeholder) {
                    throw new Error('Required components missing for basic editors');
                }
                
                // Create basic extensions without Y.js collaboration
                const getBasicExtensions = (field) => {
                    return [
                        StarterKit.configure({
                            // Enable history for basic editors (no Y.js conflict)
                            history: true,
                            ...(field === 'title' ? {
                                heading: false,
                                bulletList: false,
                                orderedList: false,
                                blockquote: false,
                                codeBlock: false,
                                horizontalRule: false
                            } : {})
                        }),
                        Placeholder.configure({ 
                            placeholder: field === 'title' ? 'Enter title...' : 
                                       field === 'body' ? 'Start writing...' : 
                                       'Auto-generated from title'
                        }),
                        // Enhanced extensions for consistent UX
                        ...this.getEnhancedExtensions(field, bundle, { includeEnhanced: true })
                    ];
                };
                
                // Create basic editors with localStorage persistence
                this.titleEditor = new Editor({
                    element: this.$refs.titleEditor,
                    extensions: getBasicExtensions('title'),
                    editable: !this.isReadOnlyMode,
                    // ✅ TIPTAP 2.5+ PERFORMANCE: Immediate rendering eliminates flicker
                    immediatelyRender: true,
                    // ✅ TIPTAP 2.5+ PERFORMANCE: Only re-render when necessary (not on every keystroke)
                    shouldRerenderOnTransaction: false,
                    onUpdate: ({ editor }) => {
                        if (this.validatePermission('edit')) {
                            this.content.title = editor.getText();
                            this.hasUnsavedChanges = true;
                            this.debouncedAutoSave();
                        }
                    },
                    onTransaction: ({ editor, transaction }) => {
                        // TIPTAP BEST PRACTICE: Handle ALL editor state changes including TaskItem checkboxes
                        if (transaction.docChanged && this.validatePermission('edit')) {
                            console.log('📝 Basic title transaction detected document change (includes checkbox changes)');
                            this.content.title = editor.getText();
                            this.hasUnsavedChanges = true;
                            this.debouncedAutoSave();
                        }
                    }
                });
                
                this.bodyEditor = new Editor({
                    element: this.$refs.bodyEditor,
                    extensions: getBasicExtensions('body'),
                    editable: !this.isReadOnlyMode,
                    // ✅ TIPTAP 2.5+ PERFORMANCE: Immediate rendering eliminates flicker
                    immediatelyRender: true,
                    // ✅ TIPTAP 2.5+ PERFORMANCE: Only re-render when necessary (not on every keystroke)
                    shouldRerenderOnTransaction: false,
                    onUpdate: ({ editor }) => {
                        if (this.validatePermission('edit')) {
                            this.content.body = editor.getHTML();
                            this.hasUnsavedChanges = true;
                            this.debouncedAutoSave();
                        }
                    },
                    onTransaction: ({ editor, transaction }) => {
                        // TIPTAP BEST PRACTICE: Handle ALL editor state changes including TaskItem checkboxes
                        if (transaction.docChanged && this.validatePermission('edit')) {
                            console.log('📝 Basic body transaction detected document change (includes checkbox changes)');
                            this.content.body = editor.getHTML();
                            this.hasUnsavedChanges = true;
                            this.debouncedAutoSave();
                        }
                    }
                });
                
                this.permlinkEditor = new Editor({
                    element: this.$refs.permlinkEditor,
                    extensions: [
                        StarterKit.configure({ history: true }),
                        Placeholder.configure({ placeholder: 'Auto-generated from title' })
                    ],
                    editable: false,
                    // ✅ TIPTAP 2.5+ PERFORMANCE: Immediate rendering eliminates flicker
                    immediatelyRender: true,
                    // ✅ TIPTAP 2.5+ PERFORMANCE: Only re-render when necessary (not on every keystroke)
                    shouldRerenderOnTransaction: false
                });
                
                // Set fallback mode flags
                this.isCollaborativeMode = false;
                this.fileType = 'local';
                this.connectionStatus = 'offline';
                this.connectionMessage = 'Offline Mode - Collaborative features disabled';
                
                // Load existing content if available
                if (this.content && Object.keys(this.content).length > 0) {
                    this.setEditorContent(this.content);
                }
                
                console.log('✅ Basic fallback editors created successfully');
                
            } catch (fallbackError) {
                console.error('❌ Even basic editor fallback failed:', fallbackError);
                throw new Error('Complete editor initialization failure - please refresh the page');
            }
        },

        // ✅ CORRECT: Determine which editor tier to use
        shouldUseCloudTier(file = null) {
            const targetFile = file || this.currentFile;
            
            console.log('🔍 Tier decision - file type:', targetFile?.type, 'isCollaborativeMode:', this.isCollaborativeMode);
            
            // Tier 2 (Cloud with CollaborationCursor) for:
            // - Collaborative documents from server
            // - Author links (?owner=user&permlink=doc)
            // - Documents being actively shared
            if (targetFile?.type === 'collaborative') {
                console.log('📄 Collaborative document detected → Cloud Tier');
                return true;
            }
            if (targetFile?.owner && targetFile?.permlink) {
                console.log('👤 Document with owner/permlink → Cloud Tier');
                return true;
            }
            if (this.isCollaborativeMode) {
                console.log('🤝 Collaborative mode active → Cloud Tier');
                return true;
            }
            
            // Check for URL parameters (author links)
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('owner') && urlParams.get('permlink')) {
                console.log('🔗 Author link detected → Cloud Tier');
                return true;
            }
            
            // Tier 1 (Local with Y.js persistence) for:
            // - New documents
            // - Local documents
            // - Offline-first editing
            console.log('🏠 Local document → Local Tier');
            return false;
        },

        // ===== TIER 1: LOCAL EDITORS WITH TEMP Y.JS DOCUMENTS =====
        async createLocalEditorsWithUpgradeCapability(bundle) {
            console.log('💻 Creating Tier 1: Local editors with temp Y.js documents (offline-first)');
            
            // Set flag to prevent temp document creation during initialization
            this.isInitializingEditors = true;
            
            // Clean up existing editors only (preserve Y.js if exists)
            await this.cleanupEditorsOnly();
            await this.$nextTick();
            
            // Get components
            const Editor = bundle.Editor?.default || bundle.Editor;
            const StarterKit = bundle.StarterKit?.default || bundle.StarterKit;
            const Placeholder = bundle.Placeholder?.default || bundle.Placeholder;
            const Y = bundle.Y?.default || bundle.Y;
            const Collaboration = bundle.Collaboration?.default || bundle.Collaboration;
            const IndexeddbPersistence = bundle.IndexeddbPersistence?.default || bundle.IndexeddbPersistence;
            
            if (!Editor || !StarterKit || !Placeholder || !Y || !Collaboration) {
                throw new Error('Required components missing for local editors with Y.js');
            }
            
            // TIPTAP BEST PRACTICE: Create Y.js document immediately (if not already loaded)
            if (!this.ydoc) {
                this.ydoc = new Y.Doc();
                console.log('✅ Y.js document created for Tier 1');
                
                // Initialize collaborative schema
                this.initializeCollaborativeSchema(Y);
                
                // TEMP DOCUMENT STRATEGY: Set up temp document flags (no IndexedDB yet)
                if (!this.currentFile) {
                    this.isTemporaryDocument = true;
                    this.tempDocumentId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    console.log('✅ Temp document strategy enabled - IndexedDB will be created on user input');
                } else {
                    // Existing file - create IndexedDB immediately
                if (IndexeddbPersistence && !this.indexeddbProvider) {
                        this.indexeddbProvider = new IndexeddbPersistence(this.currentFile.id, this.ydoc);
                        console.log('✅ IndexedDB persistence created for existing file:', this.currentFile.id);
                    }
                }
            } else {
                console.log('✅ Using existing Y.js document (loaded from preloadYjsDocument)');
            }
            
            // Create extensions with Y.js collaboration (NO CollaborationCursor for Tier 1)
            const getLocalExtensions = (field) => {
                return [
                    StarterKit.configure({ 
                        history: false, // Y.js handles history
                        ...(field === 'title' ? {
                            heading: false,
                            bulletList: false,
                            orderedList: false,
                            blockquote: false,
                            codeBlock: false,
                            horizontalRule: false
                        } : {})
                    }),
                    Collaboration.configure({
                        document: this.ydoc,
                        field: field
                    }),
                    Placeholder.configure({ 
                        placeholder: field === 'title' ? 'Enter title...' : 
                                   field === 'body' ? 'Start writing...' : 
                                   'Auto-generated from title'
                    }),
                    // Enhanced extensions (Link, Typography, etc.) for consistent UX
                    ...this.getEnhancedExtensions(field, bundle, { includeEnhanced: true })
                ];
            };
            
            // Create editors with Y.js collaboration
            this.titleEditor = new Editor({
                element: this.$refs.titleEditor,
                extensions: getLocalExtensions('title'),
                editable: !this.isReadOnlyMode,
                // ✅ TIPTAP 2.5+ PERFORMANCE: Immediate rendering eliminates flicker
                immediatelyRender: true,
                // ✅ TIPTAP 2.5+ PERFORMANCE: Only re-render when necessary (not on every keystroke)
                shouldRerenderOnTransaction: false,
                onUpdate: ({ editor }) => {
                    if (this.validatePermission('edit')) {
                        // TEMP DOCUMENT STRATEGY: Debounced IndexedDB persistence creation
                        // Only create temp document after user stops typing for 2 seconds
                        if (this.isTemporaryDocument && !this.indexeddbProvider) {
                            this.debouncedCreateIndexedDBForTempDocument();
                        }
                        
                        this.hasUnsavedChanges = true;
                        this.clearUnsavedAfterSync();
                    }
                },
                onTransaction: ({ editor, transaction }) => {
                    // TIPTAP BEST PRACTICE: Handle ALL editor state changes including TaskItem checkboxes
                    if (transaction.docChanged && this.validatePermission('edit')) {
                        console.log('📝 Local title transaction detected document change (includes checkbox changes)');
                        
                        if (this.isTemporaryDocument && !this.indexeddbProvider) {
                            this.debouncedCreateIndexedDBForTempDocument();
                        }
                        
                        this.hasUnsavedChanges = true;
                        this.clearUnsavedAfterSync();
                    }
                }
            });
            
            this.bodyEditor = new Editor({
                element: this.$refs.bodyEditor,
                extensions: getLocalExtensions('body'),
                editable: !this.isReadOnlyMode,
                // ✅ TIPTAP 2.5+ PERFORMANCE: Immediate rendering eliminates flicker
                immediatelyRender: true,
                // ✅ TIPTAP 2.5+ PERFORMANCE: Only re-render when necessary (not on every keystroke)
                shouldRerenderOnTransaction: false,
                onUpdate: ({ editor }) => {
                    if (this.validatePermission('edit')) {
                        // TEMP DOCUMENT STRATEGY: Debounced IndexedDB persistence creation
                        // Only create temp document after user stops typing for 2 seconds
                        if (this.isTemporaryDocument && !this.indexeddbProvider) {
                            this.debouncedCreateIndexedDBForTempDocument();
                        }
                        
                        this.hasUnsavedChanges = true;
                        this.clearUnsavedAfterSync();
                    }
                },
                onTransaction: ({ editor, transaction }) => {
                    // TIPTAP BEST PRACTICE: Handle ALL editor state changes including TaskItem checkboxes
                    if (transaction.docChanged && this.validatePermission('edit')) {
                        console.log('📝 Local body transaction detected document change (includes checkbox changes)');
                        
                        if (this.isTemporaryDocument && !this.indexeddbProvider) {
                            this.debouncedCreateIndexedDBForTempDocument();
                        }
                        
                        this.hasUnsavedChanges = true;
                        this.clearUnsavedAfterSync();
                    }
                }
            });
            
            this.permlinkEditor = new Editor({
                element: this.$refs.permlinkEditor,
                extensions: [
                    StarterKit.configure({ history: false }),
                    Placeholder.configure({ placeholder: 'Auto-generated from title' })
                ],
                editable: false, // Permlink is auto-generated
                // ✅ TIPTAP 2.5+ PERFORMANCE: Immediate rendering eliminates flicker
                immediatelyRender: true,
                // ✅ TIPTAP 2.5+ PERFORMANCE: Only re-render when necessary (not on every keystroke)
                shouldRerenderOnTransaction: false
            });
            
            // Document is NOT added to drafts list yet (temp document strategy)
            this.isCollaborativeMode = false; // Local mode (no WebSocket provider)
            
            console.log('✅ Tier 1 local editors created with temp Y.js documents');
            
            // Clear initialization flag after a delay to allow TipTap's async initialization events to complete
            setTimeout(() => {
                this.isInitializingEditors = false;
                console.log('🎯 Tier 1 editor initialization complete - ready for real user edits');
            }, 500); // 500ms delay to ensure all TipTap initialization events have fired
        },

        // Setup triggers for draft persistence (only when user shows intent)
        setupDraftPersistenceTriggers() {
            // Debounced function to add document to drafts when user shows intent
            if (!this.debouncedDraftPersistence) {
                this.debouncedDraftPersistence = this.debounce(() => {
                    if (this.hasContentToSave() && !this.currentFile) {
                        console.log('📝 User has meaningful content, adding to drafts...');
                        this.ensureLocalFileEntry();
                    }
                }, 2000); // 2 second delay
            }
            
            this.debouncedDraftPersistence();
        },

        // Utility: Debounce function
        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        // ===== CLEAN EDITOR CLEANUP (PRESERVE Y.JS) =====
        async cleanupEditorsOnly() {
            console.log('🧹 Cleaning up editors only (preserving Y.js document)...');
            
            // Only destroy editors, preserve Y.js document and provider
            if (this.titleEditor) {
                try {
                    this.titleEditor.destroy();
                } catch (error) {
                    console.warn('⚠️ Error destroying title editor:', error.message);
                }
                this.titleEditor = null;
            }
            
            if (this.bodyEditor) {
                try {
                    this.bodyEditor.destroy();
                } catch (error) {
                    console.warn('⚠️ Error destroying body editor:', error.message);
                }
                this.bodyEditor = null;
            }
            
            if (this.permlinkEditor) {
                try {
                    this.permlinkEditor.destroy();
                } catch (error) {
                    console.warn('⚠️ Error destroying permlink editor:', error.message);
                }
                this.permlinkEditor = null;
            }
            
            console.log('✅ Editors cleaned up, Y.js document preserved');
        },

        // ===== UPGRADE PATH: TIER 1 → TIER 2 =====
        async upgradeLocalToCloudWithCursors() {
            console.log('🔄 Upgrading from Tier 1 (Local) to Tier 2 (Cloud with CollaborationCursor)...');
            
            try {
                // TIPTAP BEST PRACTICE: Preserve content before editor recreation
                const preservedContent = this.getEditorContent();
                
                // Get collaboration bundle
                const bundle = window.TiptapCollaboration?.default || window.TiptapCollaboration;
                if (!bundle) {
                    throw new Error('Collaboration bundle not available for cloud upgrade');
                }
                
                // TIPTAP BEST PRACTICE: Destroy and recreate editors with CollaborationCursor
                // (CollaborationCursor cannot be added dynamically to existing editors)
                console.log('🧹 Destroying Tier 1 editors for CollaborationCursor upgrade...');
                await this.cleanupEditorsOnly();
                
                // Create Tier 2 editors with CollaborationCursor
                await this.createCloudEditorsWithCursors(bundle);
                
                // Restore content to new editors
                if (preservedContent) {
                    this.setEditorContent(preservedContent);
                }
                
                console.log('✅ Successfully upgraded to Tier 2 with CollaborationCursor support');
                
            } catch (error) {
                console.error('❌ Failed to upgrade to cloud with cursors:', error);
                throw error;
            }
        },



        // REMOVED: createBasicEditors() - No longer needed per TipTap best practices
        // TipTap collaboration bundle is required for all editor operations

        async createStandardEditor() {
            console.log('🏗️ Creating offline-first collaborative editors (TipTap official pattern)...');
            
            // Clean up existing editors and create fresh ones
            await this.cleanupCurrentDocument();
            await this.$nextTick();
            
            // TIPTAP OFFICIAL PATTERN: Always create Y.js + Collaboration extension immediately
            const bundle = window.TiptapCollaboration?.default || window.TiptapCollaboration;
            
            if (bundle) {
                await this.createOfflineFirstCollaborativeEditors(bundle);
            } else {
                console.error('❌ Collaboration bundle required for TipTap editors - fallback removed per TipTap.dev guidelines');
                throw new Error('TipTap collaboration bundle is required');
            }
        },

        // TIPTAP BEST PRACTICE: Proper cleanup order following Y.js lifecycle
        async cleanupCurrentDocumentProperOrder() {
            console.log('🧹 Cleaning up document resources in proper order...');
            
            try {
                // STEP 1: Disconnect WebSocket provider first (TipTap best practice)
                if (this.provider) {
                    try {
                        if (this.provider.disconnect) {
                            this.provider.disconnect();
                        }
                        if (this.provider.destroy) {
                            this.provider.destroy();
                        }
                        console.log('✅ WebSocket provider cleaned up');
                    } catch (providerError) {
                        console.warn('⚠️ Error during provider cleanup:', providerError.message);
                    }
                    this.provider = null;
                }
                
                // STEP 2: Destroy editors before Y.js document (TipTap best practice)
                const editorCleanupPromises = [];
                
                if (this.titleEditor) {
                    editorCleanupPromises.push(
                        new Promise(resolve => {
                            try {
                                this.titleEditor.destroy();
                                console.log('✅ Title editor destroyed');
                            } catch (error) {
                                console.warn('⚠️ Error destroying title editor:', error.message);
                            }
                            this.titleEditor = null;
                            resolve();
                        })
                    );
                }
                
                if (this.bodyEditor) {
                    editorCleanupPromises.push(
                        new Promise(resolve => {
                            try {
                                this.bodyEditor.destroy();
                                console.log('✅ Body editor destroyed');
                            } catch (error) {
                                console.warn('⚠️ Error destroying body editor:', error.message);
                            }
                            this.bodyEditor = null;
                            resolve();
                        })
                    );
                }
                
                if (this.permlinkEditor) {
                    editorCleanupPromises.push(
                        new Promise(resolve => {
                            try {
                                this.permlinkEditor.destroy();
                                console.log('✅ Permlink editor destroyed');
                            } catch (error) {
                                console.warn('⚠️ Error destroying permlink editor:', error.message);
                            }
                            this.permlinkEditor = null;
                            resolve();
                        })
                    );
                }
                
                // Wait for all editors to be destroyed
                await Promise.all(editorCleanupPromises);
                
                // STEP 3: Destroy IndexedDB persistence before Y.js document
                if (this.indexeddbProvider) {
                    try {
                        this.indexeddbProvider.destroy();
                        console.log('✅ IndexedDB persistence destroyed');
                    } catch (indexeddbError) {
                        console.warn('⚠️ Error during IndexedDB cleanup:', indexeddbError.message);
                    }
                    this.indexeddbProvider = null;
                }
                
                // STEP 4: Destroy Y.js document LAST (TipTap best practice)
                if (this.ydoc) {
                    try {
                        this.ydoc.destroy();
                        console.log('✅ Y.js document destroyed');
                    } catch (ydocError) {
                        console.warn('⚠️ Error destroying Y.js document:', ydocError.message);
                    }
                    this.ydoc = null;
                }
                
                // STEP 5: Clean up temporary Y.js document if it exists
                if (this.tempYDoc) {
                    try {
                        this.tempYDoc.destroy();
                        console.log('✅ Temporary Y.js document destroyed');
                    } catch (tempYdocError) {
                        console.warn('⚠️ Error destroying temporary Y.js document:', tempYdocError.message);
                    }
                    this.tempYDoc = null;
                }
                
                // STEP 6: Reset state variables
                this.connectionStatus = 'disconnected';
                this.connectionMessage = '';
                this.isCollaborativeMode = false;
                this.isCreatingYjsDocument = false;
                this.lazyYjsComponents = null;
                
                // ✅ CRITICAL FIX: Reset Vue reactive data properties during comprehensive cleanup
                this.customJsonString = '';
                this.customJsonError = '';
                this.tagInput = '';
                this.isUpdatingCustomJson = false;
                this.isLoadingPublishOptions = false;
                this.isUpdatingPublishOptions = false;
                
                // Ensure collaborativeAuthors is always an array
                if (!Array.isArray(this.collaborativeAuthors)) {
                    this.collaborativeAuthors = [];
                }
                
                // Clear global instance tracking
                if (window.dluxCollaborativeInstance === this.componentId) {
                    window.dluxCollaborativeInstance = null;
                    window.dluxCollaborativeCleanup = null;
                    console.log('✅ Global collaborative instance tracking cleared');
                }
                
                console.log('✅ Document cleanup completed in proper order');
                
            } catch (error) {
                console.error('❌ Error during proper cleanup:', error);
                // Force reset to prevent stuck state
                this.provider = null;
                this.indexeddbProvider = null;
                this.titleEditor = null;
                this.bodyEditor = null;
                this.permlinkEditor = null;
                this.ydoc = null;
                this.isCreatingYjsDocument = false;
                this.lazyYjsComponents = null;
                this.collaborativeAuthors = [];
                
                if (window.dluxCollaborativeInstance === this.componentId) {
                    window.dluxCollaborativeInstance = null;
                    window.dluxCollaborativeCleanup = null;
                }
            }
        },

        // CRITICAL: Proper cleanup method to prevent transaction mismatch errors
        async cleanupCurrentDocument() {
            // RACE CONDITION FIX: Prevent multiple simultaneous cleanup operations
            if (this.isCleaningUp) {
                console.log('⚠️ Cleanup already in progress, skipping duplicate call');
                return;
            }
            
            console.log('🧹 Cleaning up current document resources...');
            
            // Set cleanup flag to prevent status warnings during cleanup
            this.isCleaningUp = true;
            
            try {
                // TIPTAP BEST PRACTICE: Disconnect collaboration provider first with null safety
                if (this.provider) {
                    try {
                        if (this.provider.disconnect) {
                    this.provider.disconnect();
                        }
                        if (this.provider.destroy) {
                    this.provider.destroy();
                        }
                    } catch (providerError) {
                        console.warn('⚠️ Error during provider cleanup:', providerError.message);
                    }
                    this.provider = null;
                }
                
                // Destroy IndexedDB persistence
                if (this.indexeddbProvider) {
                    try {
                    this.indexeddbProvider.destroy();
                    } catch (indexeddbError) {
                        console.warn('⚠️ Error during IndexedDB cleanup:', indexeddbError.message);
                    }
                    this.indexeddbProvider = null;
                }
                
                // Destroy editors safely with individual error handling
                if (this.titleEditor) {
                    try {
                    this.titleEditor.destroy();
                    } catch (titleError) {
                        console.warn('⚠️ Error destroying title editor:', titleError.message);
                    }
                    this.titleEditor = null;
                }
                if (this.bodyEditor) {
                    try {
                    this.bodyEditor.destroy();
                    } catch (bodyError) {
                        console.warn('⚠️ Error destroying body editor:', bodyError.message);
                    }
                    this.bodyEditor = null;
                }
                if (this.permlinkEditor) {
                    try {
                    this.permlinkEditor.destroy();
                    } catch (permlinkError) {
                        console.warn('⚠️ Error destroying permlink editor:', permlinkError.message);
                    }
                    this.permlinkEditor = null;
                }
                
                // Destroy Y.js document last
                if (this.ydoc) {
                    try {
                    this.ydoc.destroy();
                    } catch (ydocError) {
                        console.warn('⚠️ Error destroying Y.js document:', ydocError.message);
                    }
                    this.ydoc = null;
                }
                
                // Reset collaboration state and arrays
                this.connectionStatus = 'disconnected';
                this.connectionMessage = '';
                
                // ✅ CRITICAL FIX: Reset Vue reactive data properties during cleanup
                this.customJsonString = '';
                this.customJsonError = '';
                this.tagInput = '';
                this.isUpdatingCustomJson = false;
                this.isLoadingPublishOptions = false;
                this.isUpdatingPublishOptions = false;
                
                // CRITICAL: Don't reset isCollaborativeMode if we're loading a collaborative file
                // This preserves the collaborative mode flag set by loadCollaborativeFile()
                if (this.currentFile?.type !== 'collaborative') {
                this.isCollaborativeMode = false;
                }
                
                this.isCreatingYjsDocument = false;
                this.lazyYjsComponents = null;
                
                // Reset collaborative authors array to prevent forEach errors
                if (!Array.isArray(this.collaborativeAuthors)) {
                    this.collaborativeAuthors = [];
                }
                
                // Clear global instance tracking if this is the active instance
                if (window.dluxCollaborativeInstance === this.componentId) {
                    window.dluxCollaborativeInstance = null;
                    window.dluxCollaborativeCleanup = null;
                    console.log('🧹 Cleared global collaborative instance tracking');
                }
                
                console.log('✅ Document cleanup completed successfully');
                
            } catch (error) {
                console.error('❌ Error during document cleanup:', error);
                // Force reset to prevent stuck state
                this.provider = null;
                this.indexeddbProvider = null;
                this.titleEditor = null;
                this.bodyEditor = null;
                this.permlinkEditor = null;
                this.ydoc = null;
                this.isCreatingYjsDocument = false;
                this.lazyYjsComponents = null;
                
                // Ensure collaborativeAuthors is always an array
                this.collaborativeAuthors = [];
                
                // Clear global tracking on error too
                if (window.dluxCollaborativeInstance === this.componentId) {
                    window.dluxCollaborativeInstance = null;
                    window.dluxCollaborativeCleanup = null;
                }
            } finally {
                // Always clear cleanup flag
                this.isCleaningUp = false;
            }
        },

        // TIER 2: Create cloud editors with full CollaborationCursor support
        async createCloudEditorsWithCursors(bundle) {
            console.log('☁️ Creating Tier 2: Cloud editors with CollaborationCursor support');
            
            // Get components from the bundle
            const Editor = bundle.Editor?.default || bundle.Editor;
            const StarterKit = bundle.StarterKit?.default || bundle.StarterKit;
            const Y = bundle.Y?.default || bundle.Y;
            const Collaboration = bundle.Collaboration?.default || bundle.Collaboration;
            const CollaborationCursor = bundle.CollaborationCursor?.default || bundle.CollaborationCursor;
            const Placeholder = bundle.Placeholder?.default || bundle.Placeholder;
            const IndexeddbPersistence = bundle.IndexeddbPersistence?.default || bundle.IndexeddbPersistence;

            if (!Y || !Collaboration || !Editor || !StarterKit || !Placeholder) {
                throw new Error('Required collaboration components missing for cloud editors');
            }
            
            // CollaborationCursor is required for Tier 2
            if (!CollaborationCursor) {
                console.warn('⚠️ CollaborationCursor not available - falling back to Tier 1');
                return await this.createLocalEditorsWithUpgradeCapability(bundle);
            }

            // TIPTAP BEST PRACTICE: Create Y.js document immediately
            if (!this.ydoc) {
                this.ydoc = new Y.Doc();
                this.initializeCollaborativeSchema(Y);
                console.log('✅ Y.js document created for Tier 2');
                
                // Add IndexedDB persistence for cloud documents
                if (this.currentFile) {
                    const documentId = `${this.currentFile.owner}/${this.currentFile.permlink}`;
                    this.createIndexedDBPersistence(documentId, this.ydoc);
                }
            }

            // Create WebSocket provider if not exists (REQUIRED for CollaborationCursor)
            if (!this.provider && this.currentFile?.type === 'collaborative') {
                await this.connectToCollaborationServer(this.currentFile);
            }

            // SAFETY CHECK: CollaborationCursor requires a valid provider
            if (!this.provider) {
                console.warn('⚠️ No WebSocket provider available for CollaborationCursor - falling back to Tier 1');
                return await this.createLocalEditorsWithUpgradeCapability(bundle);
            }

            // Clean up existing editors only
            await this.cleanupEditorsOnly();
            await this.$nextTick();

            // Create extensions with CollaborationCursor (Tier 2)

            const getCloudExtensions = (field) => {
                const extensions = [];
                
                // 1. StarterKit (ESSENTIAL - contains Document node)
                if (StarterKit) {
                    extensions.push(StarterKit.configure({ 
                        history: false, // Y.js handles history
                        ...(field === 'title' ? {
                            heading: false,
                            bulletList: false,
                            orderedList: false,
                            blockquote: false,
                            codeBlock: false,
                            horizontalRule: false
                        } : {})
                    }));
                }
                
                // 2. Collaboration extension (REQUIRED for Y.js)
                if (Collaboration && this.ydoc) {
                    extensions.push(Collaboration.configure({
                        document: this.ydoc,
                        field: field
                    }));
                }
                
                // 3. CollaborationCursor (cloud tier only)
                if (CollaborationCursor && this.provider) {
                    extensions.push(CollaborationCursor.configure({
                        provider: this.provider, // ✅ Valid WebSocket provider required
                        user: {
                        name: this.username || 'Anonymous',
                        color: this.generateUserColor(this.username || 'Anonymous')
                    }
                    }));
                }
                
                // 4. Placeholder extension
                if (Placeholder) {
                    extensions.push(Placeholder.configure({ 
                        placeholder: field === 'title' ? 'Enter title...' : 
                                   field === 'body' ? 'Start writing...' : 
                                   'Auto-generated from title'
                    }));
                }
                
                // 5. Enhanced extensions for consistent UX
                const enhancedExts = this.getEnhancedExtensions(field, bundle, { includeEnhanced: true });
                extensions.push(...enhancedExts);
                
                return extensions;
            };

            // Create title editor with CollaborationCursor
            this.titleEditor = new Editor({
                element: this.$refs.titleEditor,
                extensions: getCloudExtensions('title'),
                editable: !this.isReadOnlyMode,
                // ✅ TIPTAP 2.5+ PERFORMANCE: Immediate rendering eliminates flicker
                immediatelyRender: true,
                // ✅ TIPTAP 2.5+ PERFORMANCE: Only re-render when necessary (not on every keystroke)
                shouldRerenderOnTransaction: false,
                onUpdate: ({ editor }) => {
                    if (this.validatePermission('edit')) {
                        this.hasUnsavedChanges = true;
                        this.updateContent(); // Update content for parent component
                        this.clearUnsavedAfterSync(); // Handle Y.js sync
                        this.debouncedAutoSave(); // Trigger autosave for local documents
                    }
                },
            });

            // Create body editor with CollaborationCursor
            this.bodyEditor = new Editor({
                element: this.$refs.bodyEditor,
                extensions: getCloudExtensions('body'),
                editable: !this.isReadOnlyMode,
                // ✅ TIPTAP 2.5+ PERFORMANCE: Immediate rendering eliminates flicker
                immediatelyRender: true,
                // ✅ TIPTAP 2.5+ PERFORMANCE: Only re-render when necessary (not on every keystroke)
                shouldRerenderOnTransaction: false,
                onUpdate: ({ editor }) => {
                    if (this.validatePermission('edit')) {
                        this.hasUnsavedChanges = true;
                        this.updateContent(); // Update content for parent component
                        this.clearUnsavedAfterSync(); // Handle Y.js sync
                        this.debouncedAutoSave(); // Trigger autosave for local documents
                    }
                },
            });

            // Create permlink editor (basic, no collaboration)
            this.permlinkEditor = new Editor({
                element: this.$refs.permlinkEditor,
                extensions: [
                    StarterKit.configure({ history: false }),
                    Placeholder.configure({ placeholder: 'Auto-generated from title' }),
                ],
                editable: false,
                // ✅ TIPTAP 2.5+ PERFORMANCE: Immediate rendering eliminates flicker
                immediatelyRender: true,
                // ✅ TIPTAP 2.5+ PERFORMANCE: Only re-render when necessary (not on every keystroke)
                shouldRerenderOnTransaction: false
            });

            this.isCollaborativeMode = true;
            this.fileType = 'collaborative';
            
            console.log('✅ Tier 2 cloud editors created with CollaborationCursor support');
        },

        // REMOVED: Duplicate method - using unified approach at line 3233



        // TIPTAP BEST PRACTICE: Proper collaborative editor lifecycle
        async createCollaborativeEditorsWithProperLifecycle(bundle) {
            console.log('🏗️ Creating collaborative editors with proper Y.js lifecycle...');
            
            try {
                // STEP 1: Clean up any existing resources following proper order
                await this.cleanupCurrentDocumentProperOrder();
                await this.$nextTick();
                
                // STEP 2: Create Y.js document FIRST (TipTap best practice)
                const Y = bundle.Y?.default || bundle.Y;
                if (!Y) {
                    throw new Error('Y.js not available in bundle');
                }
                
                this.ydoc = new Y.Doc();
                console.log('✅ Y.js document created');
                
                // STEP 3: Initialize collaborative schema in Y.js document
                this.initializeCollaborativeSchema(Y);
                
                // STEP 4: Create IndexedDB persistence AFTER Y.js document
                const IndexeddbPersistence = bundle.IndexeddbPersistence?.default || bundle.IndexeddbPersistence;
                if (IndexeddbPersistence && this.currentFile) {
                    const docName = `${this.currentFile.owner}-${this.currentFile.permlink}`;
                    this.indexeddbProvider = new IndexeddbPersistence(docName, this.ydoc);
                    console.log('✅ IndexedDB persistence created');
                }
                
                // STEP 5: Create WebSocket provider AFTER Y.js document
                if (this.currentFile?.type === 'collaborative') {
                    await this.connectToCollaborationServer(this.currentFile);
                }
                
                // STEP 6: Create editors LAST, after Y.js document is ready
                await this.createEditorsWithExistingYDoc(bundle);
                
                console.log('✅ Collaborative editors created with proper lifecycle');
                
            } catch (error) {
                console.error('❌ Failed to create collaborative editors with proper lifecycle:', error);
                throw error;
            }
        },

        // TIPTAP BEST PRACTICE: Create editors with existing Y.js document
        async createEditorsWithExistingYDoc(bundle) {
            console.log('🏗️ Creating editors with existing Y.js document...');
            
            if (!this.ydoc) {
                throw new Error('Y.js document must exist before creating editors');
            }
            
            // Get components from the bundle
            const Editor = bundle.Editor?.default || bundle.Editor;
            const StarterKit = bundle.StarterKit?.default || bundle.StarterKit;
            const Collaboration = bundle.Collaboration?.default || bundle.Collaboration;
            const CollaborationCursor = bundle.CollaborationCursor?.default || bundle.CollaborationCursor;
            const Placeholder = bundle.Placeholder?.default || bundle.Placeholder;

            if (!Editor || !StarterKit || !Collaboration || !Placeholder) {
                throw new Error('Required TipTap components missing from bundle');
            }

            // TIPTAP BEST PRACTICE: Global instance management to prevent content duplication
            if (window.dluxCollaborativeInstance && window.dluxCollaborativeInstance !== this.componentId) {
                console.log('🔄 Cleaning up previous collaborative instance...');
                if (window.dluxCollaborativeCleanup) {
                    await window.dluxCollaborativeCleanup();
                }
            }
            
            window.dluxCollaborativeInstance = this.componentId;
            window.dluxCollaborativeCleanup = () => this.cleanupCurrentDocumentProperOrder();

            // Wait for DOM elements to be ready
            await this.$nextTick();

            // Using reusable getEnhancedExtensions method
            const getEnhancedExtensions = (field) => {
                return this.getEnhancedExtensions(field, bundle, {
                    includeCursor: true,
                    includeEnhanced: false
                });
            };

            // Create title editor with existing Y.js document
            this.titleEditor = new Editor({
                element: this.$refs.titleEditor,
                extensions: getEnhancedExtensions('title'),
                editable: !this.isReadOnlyMode,
                editorProps: {
                    attributes: {
                        // Styling handled by CSS - no need for dynamic classes
                    }
                },
                onCreate: ({ editor }) => {
                    console.log('✅ Title editor created with existing Y.js document');
                },
                onUpdate: ({ editor }) => {
                    // TIPTAP BEST PRACTICE: Track user presence on content changes
                    if (this.user?.username) {
                        this.addAuthorToTracking(this.user.username);
                    }
                    this.updateContent();
                },
            });

            // Create body editor with existing Y.js document
            this.bodyEditor = new Editor({
                element: this.$refs.bodyEditor,
                extensions: getEnhancedExtensions('body'),
                editable: !this.isReadOnlyMode,
                editorProps: {
                    attributes: {
                        // Styling handled by CSS - no need for dynamic classes
                    }
                },
                onCreate: ({ editor }) => {
                    console.log('✅ Body editor created with existing Y.js document');
                },
                onUpdate: ({ editor }) => {
                    // TIPTAP BEST PRACTICE: Track user presence on content changes
                    if (this.user?.username) {
                        this.addAuthorToTracking(this.user.username);
                    }
                    this.updateContent();
                },
            });

            // Create permlink editor (read-only, no collaboration needed)
            this.permlinkEditor = new Editor({
                element: this.$refs.permlinkEditor,
                extensions: [
                    StarterKit.configure({
                        history: false,
                    }),
                    Placeholder.configure({
                        placeholder: 'Auto-generated from title',
                    }),
                ],
                editable: false,
                editorProps: {
                    attributes: {
                        // Styling handled by CSS - no need for dynamic classes
                    }
                },
                onCreate: ({ editor }) => {
                    console.log('✅ Permlink editor created');
                },
            });

            console.log('✅ All editors created with existing Y.js document');
        },

        async createOfflineFirstCollaborativeEditors(bundle) {
            // Set flag to prevent temp document creation during initialization
            this.isInitializingEditors = true;
            // TIPTAP BEST PRACTICE: Prevent multiple collaborative instances
            if (window.dluxCollaborativeInstance && window.dluxCollaborativeInstance !== this.componentId) {
                console.warn('⚠️ Another collaborative instance is active, cleaning up first');
                if (window.dluxCollaborativeCleanup) {
                    try {
                        await window.dluxCollaborativeCleanup();
                    } catch (error) {
                        console.warn('⚠️ Error during previous instance cleanup:', error.message);
                    }
                }
            }
            
            // Register this instance as the active collaborative instance
            window.dluxCollaborativeInstance = this.componentId;
            window.dluxCollaborativeCleanup = () => this.fullCleanupCollaboration();
            
            // Get components from the bundle
            const Editor = bundle.Editor?.default || bundle.Editor;
            const StarterKit = bundle.StarterKit?.default || bundle.StarterKit;
            const Y = bundle.Y?.default || bundle.Y;
            const Collaboration = bundle.Collaboration?.default || bundle.Collaboration;
            const CollaborationCursor = bundle.CollaborationCursor?.default || bundle.CollaborationCursor;
            const Placeholder = bundle.Placeholder?.default || bundle.Placeholder;

            if (!Y || !Collaboration || !Editor || !StarterKit || !Placeholder) {
                console.warn('⚠️ Required collaboration components missing, falling back to basic editors');
                await this.createBasicEditors();
                return;
            }
            
            // CollaborationCursor is optional but recommended for better UX
            if (!CollaborationCursor) {
                console.warn('⚠️ CollaborationCursor not available - user presence and cursors will not be shown');
            }

            // ===== TIPTAP OFFICIAL PATTERN: Create Y.js document if needed =====
            // Check if Y.js document already exists (from loadDocument)
            if (!this.ydoc) {
                console.log('🆕 Creating fresh Y.js document (TipTap official pattern)');
                this.ydoc = new Y.Doc();
                
                // Initialize collaborative schema
                this.initializeCollaborativeSchema(Y);
            } else {
                console.log('✅ Using existing Y.js document (from loadDocument)');
            }
            
            // For existing documents, create IndexedDB persistence immediately
            if (this.currentFile?.id || this.currentFile?.permlink) {
                const documentId = this.currentFile.id || this.currentFile.permlink;
                const IndexeddbPersistence = bundle.IndexeddbPersistence?.default || bundle.IndexeddbPersistence;
                
                if (IndexeddbPersistence) {
                    try {
                        this.indexeddbProvider = new IndexeddbPersistence(documentId, this.ydoc);
                        
                        // ✅ TIPTAP BEST PRACTICE: Wait for initial sync with timeout
                        await new Promise((resolve, reject) => {
                            const timeout = setTimeout(() => reject(new Error('IndexedDB sync timeout')), 5000);
                            this.indexeddbProvider.once('synced', () => {
                                clearTimeout(timeout);
                                resolve();
                            });
                        });
                        
                        console.log('💾 IndexedDB persistence synced for existing document');
                        
                        // Update custom JSON display after sync
                        this.updateCustomJsonDisplay();
                    } catch (error) {
                        console.warn('⚠️ Failed to initialize IndexedDB persistence:', error.message);
                    }
                }
            } else {
                // For new documents, create temp Y.js document WITHOUT IndexedDB persistence
                // This prevents auto-creation of drafts until user makes changes
                console.log('📝 Created temp Y.js document (no IndexedDB until user edits)');
                this.tempDocumentId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                this.isTemporaryDocument = true;
            }
            
            // Set offline mode for temp documents
                this.isCollaborativeMode = false;
                this.connectionStatus = 'offline';
                this.fileType = 'local';
            
            // TIPTAP OFFICIAL PATTERN: Always use Collaboration extension with Y.js
            // ✅ CORRECT: Build complete extension arrays with all required extensions
            const getCompleteExtensions = (field) => {
                const extensions = [];
                
                // 1. StarterKit (ESSENTIAL - contains Document node)
                const StarterKit = bundle?.StarterKit?.default || bundle?.StarterKit;
                if (StarterKit) {
                    extensions.push(StarterKit.configure({
                        history: false, // Y.js handles history
                        ...(field === 'title' ? {
                            // Title field: minimal formatting
                            heading: false,
                            bulletList: false,
                            orderedList: false,
                            blockquote: false,
                            codeBlock: false,
                            horizontalRule: false
                        } : {
                            // Body field: full formatting (StarterKit defaults)
                        })
                    }));
            }
            
                // 2. Collaboration extension (REQUIRED for Y.js)
                const Collaboration = bundle?.Collaboration?.default || bundle?.Collaboration;
                if (Collaboration && this.ydoc) {
                    extensions.push(Collaboration.configure({
                        document: this.ydoc,
                        field: field
                    }));
                }
                
                // 3. Placeholder extension
                const Placeholder = bundle?.Placeholder?.default || bundle?.Placeholder;
                if (Placeholder) {
                    extensions.push(Placeholder.configure({
                        placeholder: field === 'title' ? 'Enter title...' : 
                                   field === 'body' ? 'Start writing...' : 
                                   'Auto-generated from title'
                    }));
                }
                
                // 4. Enhanced extensions (Link, Typography, etc.)
                const enhancedExts = this.getEnhancedExtensions(field, bundle, {
                    includeCursor: false,  // No cursor for offline-first
                    includeEnhanced: true
                });
                extensions.push(...enhancedExts);
                
                return extensions;
            };
            
            // Create collaborative editors with all required extensions
            const titleExtensions = getCompleteExtensions('title');
            const bodyExtensions = getCompleteExtensions('body');

            // Note: CollaborationCursor will be added dynamically when provider connects
            // This follows TipTap best practice for offline-first architecture

            // TIPTAP BEST PRACTICE: Clean up existing editors before creating new ones
            if (this.titleEditor) {
                try {
                    this.titleEditor.destroy();
                } catch (error) {
                    console.warn('⚠️ Error destroying existing title editor:', error.message);
                }
                this.titleEditor = null;
            }

            this.titleEditor = new Editor({
                element: this.$refs.titleEditor,
                extensions: titleExtensions,
                // ✅ TIPTAP 2.5+ PERFORMANCE: Immediate rendering eliminates flicker
                immediatelyRender: true,
                // ✅ TIPTAP 2.5+ PERFORMANCE: Only re-render when necessary (not on every keystroke)
                shouldRerenderOnTransaction: false,
                    // TipTap Best Practice: Content validation for collaborative documents
                    enableContentCheck: true,
                emitContentError: true, // Also emit without checking (TipTap 3.0 best practice)
                    onContentError: ({ editor, error, disableCollaboration }) => {
                        console.error('🚨 Title content validation error:', error);
                    
                    // For collaborative documents, disable collaboration to prevent sync issues
                    if (this.isCollaborativeMode && disableCollaboration) {
                        console.warn('🔒 Disabling collaboration due to content validation error');
                        disableCollaboration();
                        editor.setEditable(false, false); // Prevent further edits, don't emit
                        this.schemaVersionMismatch = true; // Flag for UI notification
                    }
                    
                        this.handleContentValidationError('title', error, disableCollaboration);
                    },
                    editable: !this.isReadOnlyMode, // CRITICAL: Enforce read-only permissions
                    editorProps: {
                        attributes: {
                            // Styling handled by CSS - no need for dynamic classes
                        }
                    },
                onCreate: ({ editor }) => {
                    console.log(`✅ Enhanced collaborative title editor ready (${this.isReadOnlyMode ? 'READ-ONLY' : 'EDITABLE'})`);
                    
                    // TIPTAP BEST PRACTICE: Restore preserved content after Y.js editor creation
                    this.restorePreservedContent('title', editor);
                    },
                    onUpdate: ({ editor }) => {
                        // SECURITY: Block updates for read-only users
                        if (this.isReadOnlyMode) {
                            console.warn('🚫 Blocked title update: user has read-only permissions');
                            return;
                        }
                        
                        // TEMP DOCUMENT STRATEGY: Debounced IndexedDB persistence creation
                        // Only create temp document after user stops typing for 2 seconds
                        if (this.isTemporaryDocument && !this.indexeddbProvider) {
                            this.debouncedCreateIndexedDBForTempDocument();
                        }
                        
                                            // TIPTAP BEST PRACTICE: Defer Y.js operations outside of update callback
                    if (this.authHeaders?.['x-account']) {
                        // Use nextTick to defer Y.js operations after TipTap content processing
                        this.$nextTick(() => {
                            this.addAuthorToTracking(this.authHeaders['x-account']);
                        });
                    }
                        
                        // Y.js document already exists - content automatically synced
                        
                        // Store clean title text without artifacts
                        let cleanTitle = editor.getText().trim();
                        cleanTitle = cleanTitle
                            .replace(/\u00A0/g, ' ')         // Non-breaking spaces
                            .replace(/\u200B/g, '')          // Zero-width spaces  
                            .replace(/\uFEFF/g, '')          // Byte order marks
                            .replace(/[\u2000-\u206F]/g, ' ') // General punctuation spaces
                            .replace(/\s+/g, ' ')            // Multiple spaces to single
                            .trim();
                        this.content.title = cleanTitle;
                    
                    // Always show unsaved indicator for user feedback
                    this.hasUnsavedChanges = true;
                    
                    // Y.js + IndexedDB handles persistence automatically
                    // Just clear the unsaved indicator after a brief delay
                    this.clearUnsavedAfterSync();
                },
                onTransaction: ({ editor, transaction }) => {
                    // TIPTAP BEST PRACTICE: Handle ALL editor state changes including TaskItem checkboxes
                    // The transaction event fires for checkbox changes that onUpdate misses
                    if (transaction.docChanged && !this.isReadOnlyMode) {
                        console.log('📝 Title transaction detected document change (includes checkbox changes)');
                        
                        // Store clean title text without artifacts
                        let cleanTitle = editor.getText().trim();
                        cleanTitle = cleanTitle
                            .replace(/\u00A0/g, ' ')         // Non-breaking spaces
                            .replace(/\u200B/g, '')          // Zero-width spaces  
                            .replace(/\uFEFF/g, '')          // Byte order marks
                            .replace(/[\u2000-\u206F]/g, ' ') // General punctuation spaces
                            .replace(/\s+/g, ' ')            // Multiple spaces to single
                            .trim();
                        this.content.title = cleanTitle;
                        
                        this.hasUnsavedChanges = true;
                        this.clearUnsavedAfterSync();
                    }
                },
                // Add focus and blur handlers to debug cursor tracking
                onFocus: ({ editor }) => {
                    console.log('🎯 Title editor focused - cursor should be updated');
                    // Force cursor update by getting selection
                    const selection = editor.state.selection;
                    console.log('🎯 Title editor selection:', { from: selection.from, to: selection.to });
                    
                    // Update awareness with cursor info manually if needed
                    if (this.provider && this.provider.awareness) {
                        setTimeout(() => {
                            const currentState = this.provider.awareness.getLocalState();
                            console.log('🎯 Local awareness state after title focus:', currentState);
                        }, 100);
                    }
                },
                onBlur: ({ editor }) => {
                    console.log('🎯 Title editor blurred');
                },
                onSelectionUpdate: ({ editor }) => {
                    const selection = editor.state.selection;
                    console.log('🎯 Title cursor moved:', { from: selection.from, to: selection.to });
                }
            });

            // TIPTAP BEST PRACTICE: Clean up existing body editor before creating new one
            if (this.bodyEditor) {
                try {
                    this.bodyEditor.destroy();
                } catch (error) {
                    console.warn('⚠️ Error destroying existing body editor:', error.message);
                }
                this.bodyEditor = null;
            }

            this.bodyEditor = new Editor({
                element: this.$refs.bodyEditor,
                extensions: bodyExtensions,
                // ✅ TIPTAP 2.5+ PERFORMANCE: Immediate rendering eliminates flicker
                immediatelyRender: true,
                // ✅ TIPTAP 2.5+ PERFORMANCE: Only re-render when necessary (not on every keystroke)
                shouldRerenderOnTransaction: false,
                // TipTap Best Practice: Content validation for collaborative documents
                enableContentCheck: true,
                emitContentError: true, // Also emit without checking (TipTap 3.0 best practice)
                onContentError: ({ editor, error, disableCollaboration }) => {
                    console.error('🚨 Body content validation error:', error);
                    
                    // For collaborative documents, disable collaboration to prevent sync issues
                    if (this.isCollaborativeMode && disableCollaboration) {
                        console.warn('🔒 Disabling collaboration due to content validation error');
                        disableCollaboration();
                        editor.setEditable(false, false); // Prevent further edits, don't emit
                        this.schemaVersionMismatch = true; // Flag for UI notification
                    }
                    
                    this.handleContentValidationError('body', error, disableCollaboration);
                },
                editable: !this.isReadOnlyMode, // CRITICAL: Enforce read-only permissions
                    editorProps: {
                        attributes: {
                            // Styling handled by CSS - no need for dynamic classes
                        }
                    },
                onCreate: ({ editor }) => {
                    console.log(`✅ Enhanced collaborative body editor ready (${this.isReadOnlyMode ? 'READ-ONLY' : 'EDITABLE'})`);
                    
                    // TIPTAP BEST PRACTICE: Restore preserved content after Y.js editor creation
                    this.restorePreservedContent('body', editor);
                    },
                    onUpdate: ({ editor }) => {
                    // SECURITY: Block updates for read-only users
                    if (this.isReadOnlyMode) {
                        console.warn('🚫 Blocked body update: user has read-only permissions');
                        return;
                    }
                    
                    // TEMP DOCUMENT STRATEGY: Debounced IndexedDB persistence creation
                    // Only create temp document after user stops typing for 2 seconds
                    if (this.isTemporaryDocument && !this.indexeddbProvider) {
                        this.debouncedCreateIndexedDBForTempDocument();
                    }
                    
                    // TIPTAP BEST PRACTICE: Defer Y.js operations outside of update callback
                    if (this.authHeaders?.['x-account']) {
                        // Use nextTick to defer Y.js operations after TipTap content processing
                        this.$nextTick(() => {
                            this.addAuthorToTracking(this.authHeaders['x-account']);
                        });
                    }
                    
                    // Y.js document already exists - content automatically synced
                    
                        this.content.body = editor.getHTML();
                    
                    // Always show unsaved indicator for user feedback
                    this.hasUnsavedChanges = true;
                    
                    // Y.js + IndexedDB handles persistence automatically
                    // Just clear the unsaved indicator after a brief delay
                    this.clearUnsavedAfterSync();
                },
                onTransaction: ({ editor, transaction }) => {
                    // TIPTAP BEST PRACTICE: Handle ALL editor state changes including TaskItem checkboxes
                    // The transaction event fires for checkbox changes that onUpdate misses
                    if (transaction.docChanged && !this.isReadOnlyMode) {
                        console.log('📝 Body transaction detected document change (includes checkbox changes)');
                        
                        this.content.body = editor.getHTML();
                        this.hasUnsavedChanges = true;
                        this.clearUnsavedAfterSync();
                    }
                },
                // Add focus and blur handlers to debug cursor tracking
                onFocus: ({ editor }) => {
                    console.log('🎯 Body editor focused - cursor should be updated');
                    // Force cursor update by getting selection
                    const selection = editor.state.selection;
                    console.log('🎯 Body editor selection:', { from: selection.from, to: selection.to });
                    
                    // Update awareness with cursor info manually if needed
                    if (this.provider && this.provider.awareness) {
                        setTimeout(() => {
                            const currentState = this.provider.awareness.getLocalState();
                            console.log('🎯 Local awareness state after body focus:', currentState);
                        }, 100);
                    }
                },
                onBlur: ({ editor }) => {
                    console.log('🎯 Body editor blurred');
                },
                onSelectionUpdate: ({ editor }) => {
                    const selection = editor.state.selection;
                    console.log('🎯 Body cursor moved:', { from: selection.from, to: selection.to });
                }
            });

            // TIPTAP BEST PRACTICE: Don't set collaborative mode until Y.js document is created
            // This prevents read-only mode issues for new documents
            if (this.ydoc) {
                this.isCollaborativeMode = true;
                this.connectionStatus = 'offline';
                this.fileType = 'local';
            } else {
                // Start in local mode, upgrade to collaborative when Y.js document is created
                this.isCollaborativeMode = false;
                this.connectionStatus = 'disconnected';
                this.fileType = 'local';
            }

            console.log('✅ Enhanced offline collaborative editors created successfully');
            
            // CRITICAL FIX: Sync Y.js content into Vue reactive data after editors are created
            // This ensures the UI displays the content immediately when loading existing documents
            await this.$nextTick(); // Wait for editors to be fully initialized
            
            // Small delay to ensure Y.js content is fully loaded into editors
            setTimeout(() => {
                this.syncYjsContentToVue();
            }, 300);
            
            // Clear initialization flag after a delay to allow TipTap's async initialization events to complete
            setTimeout(() => {
                this.isInitializingEditors = false;
                console.log('🎯 Editor initialization complete - ready for real user edits');
            }, 500); // 500ms delay to ensure all TipTap initialization events have fired
        },

        // CRITICAL FIX: Sync Y.js content into Vue reactive data
        // This ensures the UI displays content immediately when loading existing documents
        syncYjsContentToVue() {
            console.log('🔄 Syncing Y.js content into Vue reactive data...');
            
            try {
                let hasContent = false;
                
                // Sync title content from editor to Vue reactive data
                if (this.titleEditor) {
                    const titleText = this.titleEditor.getText().trim();
                    const titleHTML = this.titleEditor.getHTML();
                    console.log('🔍 DEBUG: Title editor state:', {
                        hasText: !!titleText,
                        textLength: titleText.length,
                        htmlLength: titleHTML.length,
                        text: titleText,
                        html: titleHTML
                    });
                    
                    if (titleText) {
                        this.content.title = titleText;
                        hasContent = true;
                        console.log('📝 Synced title from Y.js to Vue:', titleText);
                    }
                } else {
                    console.log('⚠️ Title editor not available for sync');
                }
                
                // Sync body content from editor to Vue reactive data  
                if (this.bodyEditor) {
                    const bodyText = this.bodyEditor.getText().trim();
                    const bodyHTML = this.bodyEditor.getHTML();
                    console.log('🔍 DEBUG: Body editor state:', {
                        hasText: !!bodyText,
                        textLength: bodyText.length,
                        htmlLength: bodyHTML.length,
                        text: bodyText.substring(0, 100) + (bodyText.length > 100 ? '...' : ''),
                        html: bodyHTML.substring(0, 200) + (bodyHTML.length > 200 ? '...' : '')
                    });
                    
                    if (bodyText) {
                        // For body, we need to preserve the HTML structure, not just text
                        this.content.body = bodyHTML;
                        hasContent = true;
                        console.log('📝 Synced body from Y.js to Vue (HTML length):', bodyHTML.length);
                    }
                } else {
                    console.log('⚠️ Body editor not available for sync');
                }
                
                if (hasContent) {
                    // Force Vue reactivity update
                    this.$forceUpdate();
                    console.log('✅ Y.js content synced to Vue reactive data');
                } else {
                    console.log('📄 No content found in editors to sync - document may be empty or content not loaded yet');
                    
                    // Try again after a longer delay if no content was found
                    setTimeout(() => {
                        console.log('🔄 Retrying Y.js content sync after delay...');
                        this.syncYjsContentToVue();
                    }, 500);
                }
                
            } catch (error) {
                console.error('❌ Failed to sync Y.js content to Vue:', error);
            }
        },

        // ===== TEMP DOCUMENT STRATEGY: Debounced IndexedDB Creation =====
        debouncedCreateIndexedDBForTempDocument() {
            // CRITICAL FIX: Check flags immediately when called, not after delay
            if (this.isInitializingEditors || this.isUpdatingPermissions) {
                console.log('⏸️ Skipping temp document creation - editors are initializing or permissions updating');
                return;
            }
            
            if (!this.isTemporaryDocument || this.indexeddbProvider) {
                return; // Already has persistence or not a temp document
            }
            
            console.log('🔍 debouncedCreateIndexedDBForTempDocument called - real user input detected');
            
            // Clear any existing timer
            if (this.tempDocumentCreationTimer) {
                clearTimeout(this.tempDocumentCreationTimer);
            }
            
            // Set new timer - only create temp document after user stops typing for 2 seconds
            this.tempDocumentCreationTimer = setTimeout(() => {
                this.createIndexedDBForTempDocument();
            }, 2000);
        },

        // ===== TEMP DOCUMENT STRATEGY: Create IndexedDB on First Edit =====
        async createIndexedDBForTempDocument() {
            console.log('📝 User paused typing - creating IndexedDB persistence for temp document');
            
            try {
                const bundle = window.TiptapCollaboration?.default || window.TiptapCollaboration;
                const IndexeddbPersistence = bundle?.IndexeddbPersistence?.default || bundle?.IndexeddbPersistence;
                
                if (IndexeddbPersistence && this.ydoc) {
                    // ✅ CRITICAL: Generate clean document ID (no "temp" in URL)
                    const cleanDocumentId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    
                    // Create IndexedDB persistence with clean document ID
                    this.indexeddbProvider = new IndexeddbPersistence(cleanDocumentId, this.ydoc);
                    
                    // Wait for sync to complete
                    await new Promise(resolve => {
                        this.indexeddbProvider.on('synced', resolve);
                    });
                    
                    // ✅ CRITICAL: Update URL with clean document ID (no "temp")
                    if (this.username) {
                        const permlink = cleanDocumentId.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
                        this.updateURLWithLocalParams(this.username, permlink);
                        console.log('🔗 URL updated with clean document ID:', permlink);
                    }
                    
                    // Update the current file ID to match the clean document ID
                    if (this.currentFile) {
                        this.currentFile.id = cleanDocumentId;
                    }
                    
                    // Update custom JSON display after sync
                    this.updateCustomJsonDisplay();
                    
                    // Now add to drafts list
                    await this.ensureLocalFileEntry();
                    
                    console.log('✅ Temp document now has IndexedDB persistence and appears in drafts');
                    
                    // No longer temporary
                    this.isTemporaryDocument = false;
                    this.tempDocumentId = null; // Clear temp ID since we now have a clean one
                }
            } catch (error) {
                console.error('❌ Failed to create IndexedDB for temp document:', error);
            }
        },

        // ===== NEW TIPTAP OFFLINE-FIRST BEST PRACTICE METHOD =====
        // Create editors with collaboration extensions and temporary Y.js document from the start
        // REMOVED: createTrueOfflineFirstEditors() - Legacy method replaced by unified 2-tier system

        // ===== ENHANCED Y.JS DOCUMENT CREATION WITH EDITOR PRESERVATION =====
        async createPersistentYjsDocument(triggerEditor = null) {
            console.log('🏗️ Creating persistent Y.js document while preserving editors...');
            
            try {
                // Safety checks - prevent duplicate creation attempts
                if (this.ydoc) {
                    console.log('✅ Persistent Y.js document already exists, skipping creation');
                    return;
                }
                
                if (this.isCreatingYjsDocument) {
                    console.log('⏳ Y.js document creation already in progress, skipping');
                    return;
                }
                
                this.isCreatingYjsDocument = true;
                
                const { Y, bundle } = this.lazyYjsComponents;
                
                // STEP 1: Preserve current content from all editors (non-disruptive)
                const preservedContent = {
                    title: this.titleEditor?.getHTML() || '',
                    body: this.bodyEditor?.getHTML() || '',
                    permlink: this.permlinkEditor?.getHTML() || ''
                };
                
                console.log('💾 Preserved content before persistent Y.js creation:', preservedContent);
                
                // STEP 2: Create persistent Y.js document and IndexedDB persistence
                this.ydoc = new Y.Doc();
                
                const documentId = `local_${Date.now()}`;
                const IndexeddbPersistence = bundle?.IndexeddbPersistence?.default || bundle?.IndexeddbPersistence;
                
                if (IndexeddbPersistence) {
                    try {
                        this.indexeddbProvider = new IndexeddbPersistence(documentId, this.ydoc);
                        console.log('💾 IndexedDB persistence enabled for persistent document');
                    } catch (error) {
                        console.warn('⚠️ Failed to initialize IndexedDB persistence:', error.message);
                    }
                }
                
                // STEP 3: Initialize collaborative schema
                this.initializeCollaborativeSchema(Y);
                
                // STEP 4: Sync local state to Y.js
                this.syncLocalStateToYjs();
                
                // STEP 5: Store preserved content in Y.js for restoration
                this.ydoc.getMap('config').set('preservedContent', preservedContent);
                
                // STEP 6: TIPTAP BEST PRACTICE - Seamlessly switch collaboration documents
                // Instead of destroying editors, we'll replace the collaboration document
                await this.switchCollaborationDocument(this.ydoc, preservedContent);
                
                // STEP 7: Clean up temporary Y.js document
                if (this.tempYDoc) {
                    try {
                        this.tempYDoc.destroy();
                        console.log('🗑️ Temporary Y.js document cleaned up');
                    } catch (error) {
                        console.warn('⚠️ Error cleaning up temporary Y.js document:', error.message);
                    }
                    this.tempYDoc = null;
                }
                
                // STEP 8: Set collaborative mode
                this.isCollaborativeMode = true;
                this.connectionStatus = 'offline';
                this.fileType = 'local';
                
                // Clear lazy components
                this.lazyYjsComponents = null;
                
                console.log('✅ Persistent Y.js document created with editor preservation');
                
            } catch (error) {
                console.error('❌ Failed to create persistent Y.js document:', error);
                // Fallback to existing recreation method if seamless switching fails
                if (this.lazyYjsComponents) {
                    console.log('🔄 Falling back to editor recreation method...');
                    await this.connectEditorsToYDoc(this.lazyYjsComponents.bundle, preservedContent);
                }
                this.lazyYjsComponents = null;
            } finally {
                this.isCreatingYjsDocument = false;
            }
        },

        // ===== NEW METHOD TO SWITCH COLLABORATION DOCUMENT WITHOUT DESTROYING EDITORS =====
        async switchCollaborationDocument(newYDoc, preservedContent) {
            console.log('🔄 Switching collaboration document without destroying editors...');
            
            try {
                // TIPTAP BEST PRACTICE: This approach updates the collaboration extension's document reference
                // without destroying the entire editor, preserving state and user experience
                
                // Update title editor's collaboration document
                if (this.titleEditor) {
                    const titleCollaboration = this.titleEditor.extensionManager.extensions.find(
                        ext => ext.name === 'collaboration'
                    );
                    if (titleCollaboration) {
                        // CRITICAL: Update the document reference in the collaboration extension
                        titleCollaboration.options.document = newYDoc;
                        titleCollaboration.options.field = 'title';
                        
                        // Restore preserved content to the new document
                        if (preservedContent.title && preservedContent.title !== '<p></p>') {
                            setTimeout(() => {
                                // Use setContent to replace content entirely in the new Y.js document
                                this.titleEditor.commands.setContent(preservedContent.title);
                                console.log('📝 Title content restored to new Y.js document');
                            }, 100);
                        }
                        
                        console.log('✅ Title editor collaboration document updated seamlessly');
                    }
                }
                
                // Update body editor's collaboration document
                if (this.bodyEditor) {
                    const bodyCollaboration = this.bodyEditor.extensionManager.extensions.find(
                        ext => ext.name === 'collaboration'
                    );
                    if (bodyCollaboration) {
                        // CRITICAL: Update the document reference in the collaboration extension
                        bodyCollaboration.options.document = newYDoc;
                        bodyCollaboration.options.field = 'body';
                        
                        // Restore preserved content to the new document
                        if (preservedContent.body && preservedContent.body !== '<p></p>') {
                            setTimeout(() => {
                                // Use setContent to replace content entirely in the new Y.js document
                                this.bodyEditor.commands.setContent(preservedContent.body);
                                console.log('📝 Body content restored to new Y.js document');
                            }, 100);
                        }
                        
                        console.log('✅ Body editor collaboration document updated seamlessly');
                    }
                }
                
                console.log('✅ Collaboration document switched without editor destruction');
                
            } catch (error) {
                console.error('❌ Failed to switch collaboration document seamlessly:', error);
                // This error will be caught by the calling method and fall back to recreation
                throw error;
            }
        },

        // REMOVED: createLazyYjsDocument() - No longer needed with TipTap official pattern
        // Y.js documents are now created immediately with editors

        // ===== DEPRECATED METHOD =====
        // @deprecated This method name suggests editor destruction, which violates TipTap offline-first best practices
        // REMOVED: recreateEditorsWithYjs() - Legacy method replaced by unified 2-tier system

        // ===== LIGHTWEIGHT Y.JS FOR OFFLINE PERSISTENCE =====
        // Connect Y.js document for offline persistence without Collaboration extension
        // This avoids editor destruction for local documents that don't need real-time collaboration
        async connectYjsForOfflinePersistence(bundle, preservedContent) {
            console.log('🔄 [OFFLINE-FIRST] Connecting Y.js for offline persistence (no Collaboration extension)...');
            
            // For offline persistence, we don't need to recreate editors or add Collaboration extension
            // Y.js document is already created and will provide IndexedDB persistence
            // The existing basic editors continue to work, content is auto-saved to Y.js via manual sync
            
            try {
                // Wait for Y.js document to be ready
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Store Y reference for sync listeners
                this.Y = bundle.Y;
                
                // For offline persistence, we'll skip initial content sync to avoid type conflicts
                // The content will be synced naturally through the update listeners
                console.log('⏭️ Skipping initial content sync to avoid type conflicts');
                
                // Set up manual sync from editors to Y.js for offline persistence
                this.setupOfflinePersistenceSync();
                
                console.log('✅ Y.js offline persistence connected without editor recreation');
                
            } catch (error) {
                console.error('❌ Failed to connect Y.js for offline persistence:', error);
                // Instead of destroying editors, continue with basic functionality
                // The editors will work without Y.js sync until user explicitly requests collaboration
                console.warn('⚠️ Continuing without Y.js sync - editors remain functional');
                
                // Clear Y.js document to avoid partial state
                if (this.ydoc) {
                    try {
                        this.ydoc.destroy();
                        this.ydoc = null;
                    } catch (cleanupError) {
                        console.warn('⚠️ Failed to cleanup Y.js document:', cleanupError.message);
                    }
                }
                
                // Clear IndexedDB provider
                if (this.indexeddbProvider) {
                    try {
                        this.indexeddbProvider.destroy();
                        this.indexeddbProvider = null;
                    } catch (providerError) {
                        console.warn('⚠️ Failed to cleanup IndexedDB provider:', providerError.message);
                    }
                }
            }
        },

        // Set up manual sync from basic editors to Y.js for offline persistence
        setupOfflinePersistenceSync() {
            // For offline persistence, we'll use a simpler approach that doesn't conflict with TipTap Collaboration
            // Instead of trying to manually sync to Y.js XmlFragments, we'll just ensure content is preserved
            // and let the natural TipTap mechanisms handle Y.js sync when collaboration is enabled
            
            console.log('📝 Setting up lightweight offline persistence (avoiding Y.js type conflicts)');
            
            if (this.titleEditor) {
                // Remove any existing listeners to avoid duplicates
                this.titleEditor.off('update');
                
                this.titleEditor.on('update', ({ editor }) => {
                    if (this.isReadOnlyMode) return;
                    
                    // Update local content state only - avoid Y.js conflicts
                    let cleanTitle = editor.getText().trim();
                    cleanTitle = cleanTitle
                        .replace(/\u00A0/g, ' ')
                        .replace(/\u200B/g, '')
                        .replace(/\uFEFF/g, '')
                        .replace(/[\u2000-\u206F]/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim();
                    this.content.title = cleanTitle;
                    
                    this.hasUnsavedChanges = true;
                    this.clearUnsavedAfterSync();
                });
            }
            
            if (this.bodyEditor) {
                // Remove any existing listeners to avoid duplicates
                this.bodyEditor.off('update');
                
                this.bodyEditor.on('update', ({ editor }) => {
                    if (this.isReadOnlyMode) return;
                    
                    // Update local content state only - avoid Y.js conflicts
                    this.content.body = editor.getHTML();
                    this.hasUnsavedChanges = true;
                    this.clearUnsavedAfterSync();
                });
            }
            
            console.log('✅ Lightweight offline persistence listeners added (Y.js conflict-free)');
        },

        // REMOVED: upgradeToCollaborativeMode() - Legacy method replaced by upgradeLocalToCloudWithCursors()

        // ===== TIPTAP OFFLINE-FIRST BEST PRACTICE =====
        // Connect existing editors to Y.js document without destruction
        // Y.js documents are inherently collaborative - they can be connected/disconnected from providers
        async connectEditorsToYDoc(bundle, preservedContent) {
            console.log('🔄 [OFFLINE-FIRST] Connecting existing editors to Y.js document...');
            
            // NOTE: Dynamic extension reconfiguration is complex in TipTap
            // For now, we use the proven recreation approach which works reliably
            console.log('📝 [OFFLINE-FIRST] Using editor recreation approach for Y.js connection');
            
            // ===== PROVEN APPROACH: Editor recreation with Y.js =====
            const Editor = bundle.Editor?.default || bundle.Editor;
            const StarterKit = bundle.StarterKit?.default || bundle.StarterKit;
            const Collaboration = bundle.Collaboration?.default || bundle.Collaboration;
            const Placeholder = bundle.Placeholder?.default || bundle.Placeholder;
            
            console.log('🔄 Recreating editors with Y.js collaboration...');
            
            // Destroy existing editors
            if (this.titleEditor) {
                this.titleEditor.destroy();
                this.titleEditor = null;
            }
            if (this.bodyEditor) {
                this.bodyEditor.destroy();
                this.bodyEditor = null;
            }
            if (this.permlinkEditor) {
                this.permlinkEditor.destroy();
                this.permlinkEditor = null;
            }
            
            await this.$nextTick();
            
            // Recreate title editor with Y.js
            this.titleEditor = new Editor({
                element: this.$refs.titleEditor,
                extensions: [
                    StarterKit.configure({
                        history: false, // Y.js handles history
                        heading: false,
                        bulletList: false,
                        orderedList: false,
                        blockquote: false,
                        codeBlock: false,
                        horizontalRule: false
                    }),
                    Collaboration.configure({
                        document: this.ydoc,
                        field: 'title'
                    }),
                    Placeholder.configure({
                        placeholder: 'Enter title...'
                    })
                ],
                editable: !this.isReadOnlyMode, // CRITICAL: Enforce read-only permissions
                editorProps: {
                    attributes: {
                        // Styling handled by CSS - no need for dynamic classes
                    }
                },
                onCreate: ({ editor }) => {
                    console.log('✅ Y.js title editor recreated');
                    // Restore preserved content
                    if (preservedContent.title && preservedContent.title !== '<p></p>') {
                        setTimeout(() => {
                            editor.commands.insertContent(preservedContent.title);
                        }, 100);
                    }
                },
                onUpdate: ({ editor }) => {
                    if (this.isReadOnlyMode) return;
                    
                    let cleanTitle = editor.getText().trim();
                    cleanTitle = cleanTitle
                        .replace(/\u00A0/g, ' ')
                        .replace(/\u200B/g, '')
                        .replace(/\uFEFF/g, '')
                        .replace(/[\u2000-\u206F]/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim();
                    this.content.title = cleanTitle;
                    
                    this.hasUnsavedChanges = true;
                    this.clearUnsavedAfterSync();
                }
            });
            
            // Recreate body editor with Y.js
            this.bodyEditor = new Editor({
                element: this.$refs.bodyEditor,
                extensions: [
                    StarterKit.configure({
                        history: false // Y.js handles history
                    }),
                    Collaboration.configure({
                        document: this.ydoc,
                        field: 'body'
                    }),
                    Placeholder.configure({
                        placeholder: 'Start writing...'
                    })
                ],
                editable: !this.isReadOnlyMode, // CRITICAL: Enforce read-only permissions
                editorProps: {
                    attributes: {
                        // Styling handled by CSS - no need for dynamic classes
                    }
                },
                onCreate: ({ editor }) => {
                    console.log('✅ Y.js body editor recreated');
                    // Restore preserved content
                    if (preservedContent.body && preservedContent.body !== '<p></p>') {
                        setTimeout(() => {
                            editor.commands.insertContent(preservedContent.body);
                        }, 100);
                    }
                },
                onUpdate: ({ editor }) => {
                    if (this.isReadOnlyMode) return;
                    
                    this.content.body = editor.getHTML();
                    this.hasUnsavedChanges = true;
                    this.clearUnsavedAfterSync();
                }
            });
            
            console.log('✅ Editors recreated with Y.js collaboration and preserved content');
        },

        // ✅ TIPTAP BEST PRACTICE: Wait for Y.js content to be fully available before reading
        async waitForYjsContentAvailability() {
            if (!this.ydoc) {
                console.log('⚠️ No Y.js document available');
                return;
            }
            
            // Wait for Y.js document to have actual content
            const maxWaitTime = 3000; // 3 seconds max
            const checkInterval = 50; // Check every 50ms
            let waitTime = 0;
            
            while (waitTime < maxWaitTime) {
                // Check if Y.js has content available
                const titleFragment = this.ydoc.getXmlFragment('title');
                const bodyFragment = this.ydoc.getXmlFragment('body');
                
                const hasTitle = titleFragment && titleFragment.toString().trim() !== '';
                const hasBody = bodyFragment && bodyFragment.toString().trim() !== '';
                const hasAnyContent = hasTitle || hasBody;
                
                console.log('🔍 Y.js content check:', {
                    hasTitle,
                    hasBody,
                    hasAnyContent,
                    waitTime
                });
                
                if (hasAnyContent) {
                    console.log('✅ Y.js content available');
                    return;
                }
                
                // Wait a bit more
                await new Promise(resolve => setTimeout(resolve, checkInterval));
                waitTime += checkInterval;
            }
            
            console.log('⚠️ Y.js content availability timeout, proceeding anyway');
        },

        // ✅ CORRECT: Sync editor content to Vue component state using TipTap methods
        async syncEditorContentToVueState() {
            try {
                console.log('🔄 Syncing editor content to Vue component state...');
                
                // Add debugging to see what's in the editors
                console.log('🔍 Debug - titleEditor exists:', !!this.titleEditor);
                console.log('🔍 Debug - bodyEditor exists:', !!this.bodyEditor);
                
                // ✅ CORRECT: Use TipTap editor methods to get content
                if (this.titleEditor) {
                    const titleContent = this.titleEditor.getHTML();
                    const titleText = this.titleEditor.getText().trim();
                    
                    console.log('🔍 Debug - titleContent:', titleContent);
                    console.log('🔍 Debug - titleText:', titleText);
                    
                    if (titleText) {
                        this.content.title = titleText;
                        console.log('📝 Synced title from editor:', titleText);
                    } else {
                        console.log('⚠️ No title content found in editor');
                    }
                }
                
                if (this.bodyEditor) {
                    const bodyContent = this.bodyEditor.getHTML();
                    const bodyText = this.bodyEditor.getText().trim();
                    
                    console.log('🔍 Debug - bodyContent length:', bodyContent?.length || 0);
                    console.log('🔍 Debug - bodyText length:', bodyText?.length || 0);
                    
                    if (bodyText) {
                        this.content.body = bodyContent;
                        console.log('📝 Synced body from editor (first 50 chars):', bodyText.substring(0, 50) + '...');
                    } else {
                        console.log('⚠️ No body content found in editor');
                    }
                }
                
                // Sync other collaborative data from Y.js using proper methods
                if (this.ydoc) {
                    const tags = this.ydoc.getArray('tags');
                    if (tags && tags.length > 0) {
                        this.content.tags = tags.toArray();
                        console.log('🏷️ Synced tags from Y.js:', this.content.tags);
                    }
                    
                    const customJson = this.ydoc.getMap('customJson');
                    if (customJson && customJson.size > 0) {
                        this.content.custom_json = customJson.toJSON();
                        console.log('⚙️ Synced custom_json from Y.js');
                    }
                }
                
                console.log('✅ Editor content synced to Vue component state');
                
            } catch (error) {
                console.error('❌ Error syncing editor content to Vue state:', error);
            }
        },

        // TIPTAP BEST PRACTICE: Sync local state to Y.js document on creation
        syncLocalStateToYjs() {
            if (!this.ydoc) return;
            
            console.log('🔄 Syncing local state to Y.js document...');
            
            try {
                // Sync tags from local state to Y.js
                if (Array.isArray(this.content.tags) && this.content.tags.length > 0) {
                    const yTags = this.ydoc.getArray('tags');
                    this.content.tags.forEach(tag => {
                        if (!yTags.toArray().includes(tag)) {
                            yTags.push([tag]);
                            console.log('🏷️ Synced tag to Y.js:', tag);
                        }
                    });
                    // Clear local tags now that they're in Y.js
                    this.content.tags = [];
                }
                
                // Sync beneficiaries from local state to Y.js (if any)
                if (Array.isArray(this.content.beneficiaries) && this.content.beneficiaries.length > 0) {
                    const yBeneficiaries = this.ydoc.getArray('beneficiaries');
                    this.content.beneficiaries.forEach(beneficiary => {
                        yBeneficiaries.push([beneficiary]);
                        console.log('💰 Synced beneficiary to Y.js:', beneficiary.account);
                    });
                    // Clear local beneficiaries now that they're in Y.js
                    this.content.beneficiaries = [];
                }
                
                // Sync custom JSON from local state to Y.js (if any)
                if (this.content.custom_json && typeof this.content.custom_json === 'object') {
                    const yCustomJson = this.ydoc.getMap('customJson');
                    Object.entries(this.content.custom_json).forEach(([key, value]) => {
                        yCustomJson.set(key, value);
                        console.log('⚙️ Synced custom JSON field to Y.js:', key);
                    });
                    // Clear local custom JSON now that it's in Y.js
                    this.content.custom_json = {};
                }
                
                // Sync publish options from local state to Y.js (if any)
                if (this.content.publishOptions && typeof this.content.publishOptions === 'object') {
                    const yPublishOptions = this.ydoc.getMap('publishOptions');
                    Object.entries(this.content.publishOptions).forEach(([key, value]) => {
                        yPublishOptions.set(key, value);
                        console.log('📋 Synced publish option to Y.js:', key);
                    });
                    // Clear local publish options now that they're in Y.js
                    this.content.publishOptions = {};
                }
                
                // COMPREHENSIVE SOLUTION: Sync collaborative authors from local state to Y.js
                try {
                    // Defensive programming - ensure collaborativeAuthors is always an array
                    if (!Array.isArray(this.collaborativeAuthors)) {
                        console.warn('⚠️ collaborativeAuthors is not an array, reinitializing:', typeof this.collaborativeAuthors, this.collaborativeAuthors);
                        this.collaborativeAuthors = [];
                    }
                    
                    if (this.collaborativeAuthors.length > 0) {
                        // Use a simple Y.js array for authors to avoid complex nested structures
                        const authorsArray = this.ydoc.getArray('authors');
                        
                        // CRITICAL FIX: Validate array before forEach operation
                        if (!Array.isArray(this.collaborativeAuthors)) {
                            console.warn('⚠️ collaborativeAuthors is not an array in syncLocalStateToYjs:', typeof this.collaborativeAuthors, this.collaborativeAuthors);
                            this.collaborativeAuthors = []; // Reset to empty array
                            return; // Exit early
                        }
                        
                        const validAuthors = this.collaborativeAuthors.filter(author => {
                            if (!author) {
                                console.warn('⚠️ Null/undefined author found, skipping');
                                return false;
                            }
                            if (typeof author !== 'object' && typeof author !== 'string') {
                                console.warn('⚠️ Invalid author type:', typeof author, author);
                                return false;
                            }
                            return true;
                        });
                        
                        // Additional safety check for validAuthors array
                        if (!Array.isArray(validAuthors)) {
                            console.warn('⚠️ validAuthors filter returned non-array:', typeof validAuthors, validAuthors);
                            return; // Exit early
                        }
                        
                        validAuthors.forEach(author => {
                            const existingAuthors = authorsArray.toArray();
                            const authorUsername = typeof author === 'object' ? author.username : author;
                            
                            if (!authorUsername) {
                                console.warn('⚠️ Author missing username:', author);
                                return;
                            }
                            
                            const authorExists = existingAuthors.some(a => 
                                (typeof a === 'object' && a.username === authorUsername) ||
                                (typeof a === 'string' && a === authorUsername)
                            );
                            
                            if (!authorExists) {
                                // Push just the author object directly - no array wrapping
                                authorsArray.push(author);
                                console.log('👤 Synced collaborative author to Y.js:', authorUsername);
                            }
                        });
                        
                        // Also sync to customJson for compatibility
                        const customJson = this.ydoc.getMap('customJson');
                        if (!customJson.has('authors')) {
                            const authorUsernames = this.collaborativeAuthors
                                .filter(a => a && (a.username || typeof a === 'string'))
                                .map(a => typeof a === 'object' ? a.username : a);
                            if (authorUsernames.length > 0) {
                                customJson.set('authors', authorUsernames);
                                console.log('👤 Synced author list to customJson:', authorUsernames);
                            }
                        }
                    }
                } catch (authorError) {
                    console.warn('⚠️ Failed to sync collaborative authors, skipping:', authorError.message);
                    // Ensure collaborativeAuthors is reset to empty array on error
                    if (!Array.isArray(this.collaborativeAuthors)) {
                        this.collaborativeAuthors = [];
                    }
                    // Don't let author sync failure break the entire sync process
                }
                
                console.log('✅ Local state synced to Y.js document');
            } catch (error) {
                console.error('❌ Failed to sync local state to Y.js:', error);
            }
        },

        // CLEAN DLUX SCHEMA INITIALIZATION
        initializeCollaborativeSchema(Y) {
            console.log('🏗️ Initializing clean DLUX collaborative schema...');
            
            // Schema version tracking to prevent conflicts
            // Reference: https://tiptap.dev/docs/hocuspocus/guides/collaborative-editing#schema-updates
            const metadata = this.ydoc.getMap('_metadata');
            const currentSchemaVersion = '1.0.0';
            const existingVersion = metadata.get('schemaVersion');
            
            if (existingVersion && existingVersion !== currentSchemaVersion) {
                console.warn(`⚠️ Schema version mismatch: current=${currentSchemaVersion}, document=${existingVersion}`);
                // In production, you might want to disable editing or show a warning
                this.schemaVersionMismatch = true;
            } else {
                metadata.set('schemaVersion', currentSchemaVersion);
                metadata.set('lastUpdated', new Date().toISOString());
                this.schemaVersionMismatch = false;
            }
            
            // Core content (TipTap editors)
            this.ydoc.get('title', Y.XmlFragment);
            this.ydoc.get('body', Y.XmlFragment);
            
            // Post configuration
            const config = this.ydoc.getMap('config');
            if (!config.has('postType')) {
                config.set('postType', 'blog');
                config.set('version', '1.0.0');
                config.set('appVersion', 'dlux/1.0.0');
                config.set('createdBy', this.username || 'anonymous');
                // ✅ SECURITY: Set owner for access control verification
                config.set('owner', this.username || 'anonymous');
                config.set('creator', this.username || 'anonymous');
                config.set('createdAt', new Date().toISOString());
                config.set('lastModified', new Date().toISOString());
                config.set('initialContentLoaded', false); // TipTap best practice flag
                
                // ✅ TIPTAP BEST PRACTICE: Store document name in config metadata
                if (this.currentFile?.name && this.currentFile.name !== `${this.currentFile?.owner}/${this.currentFile?.permlink}`) {
                    config.set('documentName', this.currentFile.name);
                    console.log('📄 Document name stored in Y.js config:', this.currentFile.name);
                }
                
                console.log('🔐 Y.js document ownership set for user:', this.username);
            } else {
                // ✅ BACKWARD COMPATIBILITY: Set owner for existing documents that don't have it
                if (!config.has('owner') && this.username) {
                    config.set('owner', this.username);
                    config.set('creator', this.username);
                    config.set('createdAt', new Date().toISOString());
                    console.log('🔐 Added ownership to existing Y.js document for user:', this.username);
                }
            }
            
            // Advanced publishing options (atomic values only for conflict-free collaboration)
            const publishOptions = this.ydoc.getMap('publishOptions');
            if (!publishOptions.has('initialized')) {
                publishOptions.set('maxAcceptedPayout', '1000000.000 HBD'); // Default max
                publishOptions.set('percentHbd', 5000); // ✅ FIXED: 50/50 split (matches Vue default)
                publishOptions.set('allowVotes', true);
                publishOptions.set('allowCurationRewards', true);
                publishOptions.set('initialized', true);
            }
            
            // Conflict-free collaborative arrays and maps
            this.ydoc.getArray('tags');           // Conflict-free tag management
            this.ydoc.getArray('beneficiaries');  // Conflict-free beneficiary management
            this.ydoc.getArray('authors');        // Collaborative authors tracking
            this.ydoc.getMap('customJson');       // Granular custom field updates
            
            // Operation coordination and schema versioning
            this.ydoc.getMap('_locks');           // Operation locks (publishing, etc.)
            
            // Individual asset transform maps for conflict-free positioning
            // These will be created dynamically as assets are added
            
            // Media arrays (flat structure for performance)
            this.ydoc.getArray('images');
            this.ydoc.getArray('videos');
            this.ydoc.getArray('assets360');
            this.ydoc.getArray('attachments');
            
            // Video transcoding data
            this.ydoc.getMap('videoData');
            
            // User presence
            this.ydoc.getMap('presence');
            
            console.log(`✅ Clean DLUX schema initialized (v${currentSchemaVersion})`);
            
            // Set up observers
            this.setupObservers();
        },

        // Set up Y.js observers for real-time collaboration
        setupObservers() {
            if (!this.ydoc) return;
            
            console.log('🔍 Setting up collaborative observers...');
            
            try {
                // Observe post configuration changes
                const config = this.ydoc.getMap('config');
                config.observe((event) => {
                    console.log('⚙️ Post config changed:', event);
                    console.log('🔍 DEBUG: Config change details:', {
                        keysChanged: Array.from(event.changes.keys.keys()),
                        target: event.target,
                        transaction: event.transaction
                    });
                    
                    // ✅ TIPTAP BEST PRACTICE: Update document name when changed or added in Y.js config
                    event.changes.keys.forEach((change, key) => {
                        if (key === 'documentName' && (change.action === 'update' || change.action === 'add')) {
                            const newDocumentName = config.get('documentName');
                            console.log('📄 Document name changed/added in Y.js config:', newDocumentName);
                            
                            // Update current file and UI immediately
                            if (this.currentFile && newDocumentName) {
                                console.log('🔄 BEFORE UPDATE:', {
                                    oldCurrentFileName: this.currentFile.name,
                                    oldCurrentDocumentInfoTitle: this.currentDocumentInfo?.title,
                                    newDocumentName
                                });
                                
                                // Use Vue.set or object replacement to ensure reactivity
                                this.currentFile = {
                                    ...this.currentFile,
                                    name: newDocumentName,
                                    title: newDocumentName,
                                    documentName: newDocumentName
                                };
                                
                                // Update currentDocumentInfo for template display
                                if (this.currentDocumentInfo) {
                                    this.currentDocumentInfo.title = newDocumentName;
                                }
                                
                                console.log('🔄 AFTER UPDATE:', {
                                    newCurrentFileName: this.currentFile.name,
                                    newCurrentDocumentInfoTitle: this.currentDocumentInfo?.title
                                });
                                
                                console.log('✅ UI updated with new document name from Y.js config');
                                
                                // Force Vue reactivity update with nextTick to ensure DOM update
                                this.$nextTick(() => {
                                    this.$forceUpdate();
                                    console.log('🔄 Config observer: Vue reactivity forced after nextTick');
                                });
                            }
                        }
                    });
                    
                    this.syncToParent();
                });
                
                // Observe publish options changes (atomic settings only)
                const publishOptions = this.ydoc.getMap('publishOptions');
                publishOptions.observe((event) => {
                    console.log('📋 Publish options changed:', event);
                    
                    // For remote changes, update Vue data selectively
                    if (event.transaction.origin !== this.ydoc.clientID) {
                        console.log('📋 Remote publish options change detected, updating Vue data selectively');
                        
                        // Set loading flag to prevent feedback loop
                        this.isLoadingPublishOptions = true;
                        
                        // Update only the specific changed keys (convert formats for checkboxes)
                        event.changes.keys.forEach((change, key) => {
                            if (change.action === 'update' || change.action === 'add') {
                                const newValue = publishOptions.get(key);
                                if (key === 'allowVotes') this.commentOptions.allowVotes = Boolean(newValue);
                                else if (key === 'allowCurationRewards') this.commentOptions.allowCurationRewards = Boolean(newValue);
                                else if (key === 'maxAcceptedPayout') this.commentOptions.maxAcceptedPayout = (newValue === '0.000 HBD' || newValue === false);
                                else if (key === 'percentHbd') this.commentOptions.percentHbd = (newValue === 10000 || newValue === true);
                            }
                        });
                        
                        // Clear loading flag
                        this.$nextTick(() => {
                            this.isLoadingPublishOptions = false;
                        });
                    }
                    
                    // Trigger status indicator update and auto-save
                    this.hasUnsavedChanges = true;
                    this.debouncedAutoSave();
                    
                    this.syncToParent();
                });
                
                // Observe conflict-free collaborative arrays
                const tags = this.ydoc.getArray('tags');
                tags.observe((event) => {
                    console.log('🏷️ Tags changed:', event);
                    this.collaborativeDataVersion++; // Trigger Vue reactivity
                    this.syncToParent();
                });
                
                const beneficiaries = this.ydoc.getArray('beneficiaries');
                beneficiaries.observe((event) => {
                    console.log('💰 Beneficiaries changed:', event);
                    this.collaborativeDataVersion++; // Trigger Vue reactivity
                    this.syncToParent();
                });
                
                const customJson = this.ydoc.getMap('customJson');
                customJson.observe((event) => {
                    console.log('⚙️ Custom JSON changed:', event);
                    
                    // For remote changes, reload custom JSON from Y.js into textarea
                    if (event.transaction.origin !== this.ydoc.clientID) {
                        console.log('📡 Remote custom JSON change detected, reloading from Y.js');
                        this.loadCustomJsonFromYjs();
                    } else {
                        // For local changes, just update the display
                        this.updateCustomJsonDisplay();
                    }
                    
                    // Only trigger autosave if not currently updating custom JSON (prevents feedback loops)
                    if (!this.isUpdatingCustomJson) {
                        // Trigger status indicator update and auto-save
                        this.hasUnsavedChanges = true;
                        this.debouncedAutoSave();
                    } else {
                        console.log('🔄 Skipping autosave during custom JSON update to prevent feedback loop');
                    }
                    
                    this.syncToParent();
                });
                
                // Observe media changes
                ['images', 'videos', 'assets360', 'attachments'].forEach(arrayName => {
                    const array = this.ydoc.getArray(arrayName);
                    array.observe((event) => {
                        console.log(`📁 ${arrayName} changed:`, event);
                        this.syncToParent();
                    });
                });
                
                // Observe video data changes
                const videoData = this.ydoc.getMap('videoData');
                videoData.observe((event) => {
                    console.log('🎬 Video data changed:', event);
                    this.syncToParent();
                });
                
                // Observe user presence
                const presence = this.ydoc.getMap('presence');
                presence.observe((event) => {
                    console.log('👥 User presence changed:', event);
                    this.updatePresenceUI();
                });
                
                console.log('✅ Collaborative observers set up');
            } catch (error) {
                console.error('❌ Failed to set up observers:', error);
            }
        },

        // CLEAN DLUX COLLABORATIVE METHODS

        // Post Type Management
        setPostType(postType) {
            if (!this.validatePermission('setPostType')) return false;
            
            const config = this.ydoc.getMap('config');
            config.set('postType', postType);
            config.set('lastModified', new Date().toISOString());
            console.log(`📝 Post type set to: ${postType}`);
            return true;
        },

        getPostType() {
            const config = this.ydoc.getMap('config');
            return config.get('postType') || 'blog';
        },

        // Document Name Management (Y.js config metadata)
        setDocumentName(documentName) {
            if (!this.ydoc || !documentName) return false;
            
            try {
                const config = this.ydoc.getMap('config');
                config.set('documentName', documentName);
                config.set('lastModified', new Date().toISOString());
                console.log('📄 Document name set in Y.js config:', documentName);
                return true;
            } catch (error) {
                console.error('❌ Failed to set document name in Y.js config:', error);
                return false;
            }
        },

        getDocumentName() {
            if (!this.ydoc) return null;
            
            try {
                const config = this.ydoc.getMap('config');
                return config.get('documentName') || null;
            } catch (error) {
                console.error('❌ Failed to get document name from Y.js config:', error);
                return null;
            }
        },

        // Conflict-Free Advanced Options Management
        
        // Tag Management (Y.Array for conflict-free collaboration)
        addCollaborativeTag(tag) {
            if (!this.validatePermission('addTag')) return false;
            
            // Format tag according to Hive rules
            const formattedTag = tag.toLowerCase().replace(/[^a-z0-9-]/g, '');
            if (formattedTag.length === 0 || formattedTag.length > 24) {
                console.warn('⚠️ Invalid tag format:', tag);
                return false;
            }
            
            // TIPTAP BEST PRACTICE: Fallback pattern for offline-first collaborative editing
            if (this.ydoc) {
                // Y.js document exists - use collaborative array
            const tags = this.ydoc.getArray('tags');
            const existingTags = tags.toArray();
            
            // Check limits and duplicates
            if (existingTags.length >= 10) {
                console.warn('⚠️ Maximum 10 tags allowed');
                return false;
            }
            
            if (!existingTags.includes(formattedTag)) {
                tags.push([formattedTag]);
                    console.log('🏷️ Tag added to Y.js:', formattedTag);
                
                // ✅ CRITICAL FIX: Trigger temp document persistence for non-editor changes
                if (this.isTemporaryDocument && !this.indexeddbProvider) {
                    console.log('🚀 Tag addition triggering temp document persistence');
                    this.debouncedCreateIndexedDBForTempDocument();
                }
                
                this.syncToParent(); // Emit collaborative-data-changed event
                return true;
            }
            } else {
                // Y.js document not ready yet - use local state and schedule creation
                console.log('⏳ Y.js not ready, using local state for tag:', formattedTag);
                
                // Ensure tags array exists
                if (!Array.isArray(this.content.tags)) {
                    this.content.tags = [];
                }
                
                // Check limits and duplicates
                if (this.content.tags.length >= 10) {
                    console.warn('⚠️ Maximum 10 tags allowed');
                    return false;
                }
                
                if (!this.content.tags.includes(formattedTag)) {
                    this.content.tags.push(formattedTag);
                    console.log('🏷️ Tag added to local state:', formattedTag);
                    
                    // ❌ ARCHITECTURE VIOLATION: Y.js document should exist (temp document architecture)
                    console.error('❌ CRITICAL: Y.js document missing - violates temp document architecture');
                    console.warn('⚠️ Using local state fallback - this indicates an architecture issue');
                    
                    return true;
                }
            }
            
            return false;
        },

        removeCollaborativeTag(tag) {
            if (!this.validatePermission('removeTag')) return false;
            
            // TIPTAP BEST PRACTICE: Fallback pattern for offline-first collaborative editing
            if (this.ydoc) {
                // Y.js document exists - use collaborative array
            const tags = this.ydoc.getArray('tags');
            const index = tags.toArray().indexOf(tag);
            if (index >= 0) {
                tags.delete(index, 1);
                    console.log('🏷️ Tag removed from Y.js:', tag);
                
                // ✅ CRITICAL FIX: Trigger temp document persistence for non-editor changes
                if (this.isTemporaryDocument && !this.indexeddbProvider) {
                    console.log('🚀 Tag removal triggering temp document persistence');
                    this.debouncedCreateIndexedDBForTempDocument();
                }
                
                this.syncToParent(); // Emit collaborative-data-changed event
                return true;
                }
            } else {
                // Y.js document not ready yet - use local state
                console.log('⏳ Y.js not ready, removing from local state:', tag);
                
                // Ensure tags array exists
                if (!Array.isArray(this.content.tags)) {
                    this.content.tags = [];
                }
                
                const index = this.content.tags.indexOf(tag);
                if (index >= 0) {
                    this.content.tags.splice(index, 1);
                    console.log('🏷️ Tag removed from local state:', tag);
                    
                    // ❌ ARCHITECTURE VIOLATION: Y.js document should exist (temp document architecture)
                    console.error('❌ CRITICAL: Y.js document missing - violates temp document architecture');
                    console.warn('⚠️ Using local state fallback - this indicates an architecture issue');
                    
                    return true;
                }
            }
            return false;
        },

        setTags(tagArray) {
            if (!this.validatePermission('setTags')) return false;
            
            // Clear existing tags
            const tags = this.ydoc.getArray('tags');
            tags.delete(0, tags.length);
            
            // Add new tags
            const formattedTags = tagArray
                .map(tag => tag.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                .filter(tag => tag.length > 0 && tag.length <= 24)
                .slice(0, 10);
            
            formattedTags.forEach(tag => {
                if (!tags.toArray().includes(tag)) {
                    tags.push([tag]);
                }
            });
            
            console.log('🏷️ Tags set:', formattedTags);
            this.syncToParent(); // Emit collaborative-data-changed event
            return true;
        },

        getTags() {
            // TIPTAP BEST PRACTICE: Fallback pattern for offline-first collaborative editing
            if (this.ydoc) {
                // Y.js document exists - use collaborative array
            const tags = this.ydoc.getArray('tags');
            return tags.toArray();
            } else {
                // Y.js document not ready yet - use local state
                return Array.isArray(this.content.tags) ? this.content.tags : [];
            }
        },

        // Beneficiary Management (Y.Array for conflict-free collaboration)
        addCollaborativeBeneficiary(account, weight) {
            if (!this.validatePermission('addBeneficiary')) return false;
            
            // TIPTAP BEST PRACTICE: Fallback pattern for offline-first collaborative editing
            if (this.ydoc) {
                // Y.js document exists - use collaborative array
            const beneficiaries = this.ydoc.getArray('beneficiaries');
            const existing = beneficiaries.toArray();
            
            // Validate limits
            if (existing.length >= 8) {
                console.warn('⚠️ Maximum 8 beneficiaries allowed');
                return false;
            }
            
            // Check for duplicate account
            if (existing.some(b => b.account === account)) {
                console.warn('⚠️ Beneficiary already exists:', account);
                return false;
            }
            
            // Validate weight
            const validWeight = Math.min(Math.max(weight, 1), 10000);
            const totalWeight = existing.reduce((sum, b) => sum + b.weight, 0) + validWeight;
            
            if (totalWeight > 10000) {
                console.warn('⚠️ Total beneficiary weight would exceed 100%');
                return false;
            }
            
            const beneficiary = {
                account: account,
                weight: validWeight,
                id: `ben_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };
            
            beneficiaries.push([beneficiary]);
                console.log('💰 Beneficiary added to Y.js:', beneficiary);
            
            // ✅ CRITICAL FIX: Trigger temp document persistence for non-editor changes
            if (this.isTemporaryDocument && !this.indexeddbProvider) {
                console.log('🚀 Beneficiary addition triggering temp document persistence');
                this.debouncedCreateIndexedDBForTempDocument();
            }
            
            this.syncToParent(); // Emit collaborative-data-changed event
            return beneficiary.id;
            } else {
                // Y.js document not ready yet - use local state
                console.log('⏳ Y.js not ready, using local state for beneficiary:', account);
                
                // Ensure beneficiaries array exists
                if (!Array.isArray(this.content.beneficiaries)) {
                    this.content.beneficiaries = [];
                }
                
                // Validate limits
                if (this.content.beneficiaries.length >= 8) {
                    console.warn('⚠️ Maximum 8 beneficiaries allowed');
                    return false;
                }
                
                // Check for duplicate account
                if (this.content.beneficiaries.some(b => b.account === account)) {
                    console.warn('⚠️ Beneficiary already exists:', account);
                    return false;
                }
                
                // Validate weight
                const validWeight = Math.min(Math.max(weight, 1), 10000);
                const totalWeight = this.content.beneficiaries.reduce((sum, b) => sum + b.weight, 0) + validWeight;
                
                if (totalWeight > 10000) {
                    console.warn('⚠️ Total beneficiary weight would exceed 100%');
                    return false;
                }
                
                const beneficiary = {
                    account: account,
                    weight: validWeight,
                    id: `ben_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                };
                
                this.content.beneficiaries.push(beneficiary);
                console.log('💰 Beneficiary added to local state:', beneficiary);
                
                // ❌ ARCHITECTURE VIOLATION: Y.js document should exist (temp document architecture)
                console.error('❌ CRITICAL: Y.js document missing - violates temp document architecture');
                console.warn('⚠️ Using local state fallback - this indicates an architecture issue');
                
                return beneficiary.id;
            }
        },

        removeCollaborativeBeneficiary(id) {
            if (!this.validatePermission('removeBeneficiary')) return false;
            
            // TIPTAP BEST PRACTICE: Fallback pattern for offline-first collaborative editing
            if (this.ydoc) {
                // Y.js document exists - use collaborative array
            const beneficiaries = this.ydoc.getArray('beneficiaries');
            const index = beneficiaries.toArray().findIndex(b => b.id === id);
            
            if (index >= 0) {
                const removed = beneficiaries.toArray()[index];
                beneficiaries.delete(index, 1);
                    console.log('💰 Beneficiary removed from Y.js:', removed.account);
                
                // ✅ CRITICAL FIX: Trigger temp document persistence for non-editor changes
                if (this.isTemporaryDocument && !this.indexeddbProvider) {
                    console.log('🚀 Beneficiary removal triggering temp document persistence');
                    this.debouncedCreateIndexedDBForTempDocument();
                }
                
                this.syncToParent(); // Emit collaborative-data-changed event
                return true;
                }
            } else {
                // Y.js document not ready yet - use local state
                console.log('⏳ Y.js not ready, removing from local state:', id);
                
                // Ensure beneficiaries array exists
                if (!Array.isArray(this.content.beneficiaries)) {
                    this.content.beneficiaries = [];
                }
                
                const index = this.content.beneficiaries.findIndex(b => b.id === id);
                if (index >= 0) {
                    const removed = this.content.beneficiaries[index];
                    this.content.beneficiaries.splice(index, 1);
                    console.log('💰 Beneficiary removed from local state:', removed.account);
                    
                    // ❌ ARCHITECTURE VIOLATION: Y.js document should exist (temp document architecture)
                    console.error('❌ CRITICAL: Y.js document missing - violates temp document architecture');
                    console.warn('⚠️ Using local state fallback - this indicates an architecture issue');
                    
                    return true;
                }
            }
            return false;
        },

        updateBeneficiaryWeight(id, newWeight) {
            if (!this.validatePermission('updateBeneficiary')) return false;
            
            const beneficiaries = this.ydoc.getArray('beneficiaries');
            const existing = beneficiaries.toArray();
            const index = existing.findIndex(b => b.id === id);
            
            if (index >= 0) {
                const validWeight = Math.min(Math.max(newWeight, 1), 10000);
                const otherWeight = existing.reduce((sum, b, i) => i === index ? sum : sum + b.weight, 0);
                
                if (otherWeight + validWeight > 10000) {
                    console.warn('⚠️ Total beneficiary weight would exceed 100%');
                    return false;
                }
                
                const updated = { ...existing[index], weight: validWeight };
                beneficiaries.delete(index, 1);
                beneficiaries.insert(index, [updated]);
                console.log('💰 Beneficiary weight updated:', updated);
                return true;
            }
            return false;
        },

        getBeneficiaries() {
            // TIPTAP BEST PRACTICE: Fallback pattern for offline-first collaborative editing
            if (this.ydoc) {
                // Y.js document exists - use collaborative array
            const beneficiaries = this.ydoc.getArray('beneficiaries');
            return beneficiaries.toArray();
            } else {
                // Y.js document not ready yet - use local state
                return Array.isArray(this.content.beneficiaries) ? this.content.beneficiaries : [];
            }
        },

        // Custom JSON Management (Y.Map for granular conflict-free updates)
        setCustomJsonField(key, value) {
            console.log('🔧 setCustomJsonField called:', key, 'value:', value);
            const hasPermission = this.validatePermission('setCustomJsonField');
            console.log('🔐 setCustomJsonField permission check result:', hasPermission);
            if (!hasPermission) {
                console.warn('❌ setCustomJsonField blocked by permission validation');
                return false;
            }
            
            // TIPTAP BEST PRACTICE: Fallback pattern for offline-first collaborative editing
            if (this.ydoc) {
                // Y.js document exists - use collaborative map
                const customJson = this.ydoc.getMap('customJson');
                customJson.set(key, value);
                console.log('⚙️ Custom JSON field updated in Y.js:', key, 'value:', value);
                console.log('🔍 DEBUG: Y.js document GUID for custom JSON save:', this.ydoc.guid);
                
                // ✅ CRITICAL FIX: Trigger temp document persistence for non-editor changes
                if (this.isTemporaryDocument && !this.indexeddbProvider) {
                    console.log('🚀 Custom JSON change triggering temp document persistence');
                    this.debouncedCreateIndexedDBForTempDocument();
                }
                
                return true;
            } else {
                // ❌ ARCHITECTURE VIOLATION: Y.js document should exist (temp document architecture)
                console.error('❌ CRITICAL: Y.js document missing - violates temp document architecture');
                console.error('🔍 DEBUG: This should not happen with temp Y.js document strategy');
                console.error('🔍 DEBUG: All editors should have Y.js documents from creation');
                
                // Fallback to local state but log the violation
                if (!this.content.custom_json || typeof this.content.custom_json !== 'object') {
                    this.content.custom_json = {};
                }
                
                this.content.custom_json[key] = value;
                console.warn('⚠️ Using local state fallback - this indicates an architecture issue');
                
                return false; // Return false to indicate architecture violation
            }
        },

        removeCustomJsonField(key) {
            console.log('🗑️ removeCustomJsonField called:', key);
            const hasPermission = this.validatePermission('removeCustomJsonField');
            console.log('🔐 removeCustomJsonField permission check result:', hasPermission);
            if (!hasPermission) {
                console.warn('❌ removeCustomJsonField blocked by permission validation');
                return false;
            }
            
            // TIPTAP BEST PRACTICE: Fallback pattern for offline-first collaborative editing
            if (this.ydoc) {
                // Y.js document exists - use collaborative map
            const customJson = this.ydoc.getMap('customJson');
            if (customJson.has(key)) {
                customJson.delete(key);
                    console.log('⚙️ Custom JSON field removed from Y.js:', key);
                
                // ✅ CRITICAL FIX: Trigger temp document persistence for non-editor changes
                if (this.isTemporaryDocument && !this.indexeddbProvider) {
                    console.log('🚀 Custom JSON removal triggering temp document persistence');
                    this.debouncedCreateIndexedDBForTempDocument();
                }
                
                return true;
                }
            } else {
                // ❌ ARCHITECTURE VIOLATION: Y.js document should exist (temp document architecture)
                console.error('❌ CRITICAL: Y.js document missing - violates temp document architecture');
                console.error('🔍 DEBUG: This should not happen with temp Y.js document strategy');
                
                // Fallback to local state but log the violation
                if (!this.content.custom_json || typeof this.content.custom_json !== 'object') {
                    this.content.custom_json = {};
                }
                
                if (this.content.custom_json.hasOwnProperty(key)) {
                    delete this.content.custom_json[key];
                    console.warn('⚠️ Using local state fallback - this indicates an architecture issue');
                    return false; // Return false to indicate architecture violation
                }
            }
            return false;
        },

        getCustomJson() {
            // TIPTAP BEST PRACTICE: Fallback pattern for offline-first collaborative editing
            if (this.ydoc) {
                // Y.js document exists - use collaborative map
                const customJson = this.ydoc.getMap('customJson');
                return customJson.toJSON();
            } else {
                // Y.js document not ready yet - use local state
                return this.content.custom_json || {};
            }
        },

        // Load custom JSON from Y.js into Vue data (for document loading)
        loadCustomJsonFromYjs() {
            if (!this.ydoc) {
                console.log('⚠️ loadCustomJsonFromYjs: No Y.js document available');
                return;
            }
            
            console.log('📥 Loading custom JSON from Y.js...');
            console.log('🔍 DEBUG: Y.js document GUID for custom JSON load:', this.ydoc.guid);
            
            // Prevent feedback loops during loading
            this.isUpdatingCustomJson = true;
            
            try {
                const customJsonData = this.getCustomJson();
                const newDisplayJson = Object.keys(customJsonData).length > 0 
                    ? JSON.stringify(customJsonData, null, 2) 
                    : '';
                
                // Update the textarea content
                this.customJsonString = newDisplayJson;
                this.customJsonError = '';
                
                console.log('✅ Custom JSON loaded from Y.js:', Object.keys(customJsonData).length, 'fields');
                if (Object.keys(customJsonData).length > 0) {
                    console.log('🔍 Custom JSON content:', customJsonData);
                }
                
            } catch (error) {
                console.error('❌ Error loading custom JSON from Y.js:', error);
                this.customJsonError = 'Error loading custom JSON';
            } finally {
                // Clear flag after loading
                this.isUpdatingCustomJson = false;
            }
        },

        // Update the custom JSON textarea display from Y.js Map
        updateCustomJsonDisplay() {
            // Prevent feedback loops during custom JSON validation
            if (this.isUpdatingCustomJson) {
                console.log('🔄 Skipping custom JSON display update during validation to prevent feedback loop');
                return;
            }
            
            // ✅ CRITICAL FIX: Prevent overriding Vue data reset during document cleanup/switching
            if (this.isCleaningUp || this.isInitializingEditors || this.isUpdatingPermissions) {
                console.log('🔄 Skipping custom JSON display update during document cleanup/switching');
                return;
            }
            
            const customJsonData = this.getCustomJson();
            const newDisplayJson = Object.keys(customJsonData).length > 0 
                ? JSON.stringify(customJsonData, null, 2) 
                : '';
            
            // Only update if different and user isn't currently editing the textarea
            if (newDisplayJson !== this.customJsonString && document.activeElement?.tagName !== 'TEXTAREA') {
                this.customJsonString = newDisplayJson;
                this.customJsonError = '';
                console.log('📝 Custom JSON display updated from Y.js');
            }
        },

        // Atomic Publish Options (simple values, conflict-free)
        setPublishOption(key, value) {
            if (!this.validatePermission('setPublishOption')) return false;
            
            // TIPTAP BEST PRACTICE: Fallback pattern for offline-first collaborative editing
            if (this.ydoc) {
                // Y.js document exists - use collaborative map
            const publishOptions = this.ydoc.getMap('publishOptions');
            publishOptions.set(key, value);
                console.log('📋 Publish option updated in Y.js:', key, value);
            
            // ✅ CRITICAL FIX: Trigger temp document persistence for non-editor changes
            if (this.isTemporaryDocument && !this.indexeddbProvider) {
                console.log('🚀 Publish option change triggering temp document persistence');
                this.debouncedCreateIndexedDBForTempDocument();
            }
            
            return true;
            } else {
                // Y.js document not ready yet - use local state
                console.log('⏳ Y.js not ready, using local state for publish option:', key);
                
                // Ensure publish options object exists
                if (!this.content.publishOptions || typeof this.content.publishOptions !== 'object') {
                    this.content.publishOptions = {};
                }
                
                this.content.publishOptions[key] = value;
                console.log('📋 Publish option updated in local state:', key, value);
                
                // ❌ ARCHITECTURE VIOLATION: Y.js document should exist (temp document architecture)
                console.error('❌ CRITICAL: Y.js document missing - violates temp document architecture');
                console.warn('⚠️ Using local state fallback - this indicates an architecture issue');
                
                return true;
            }
        },

        getPublishOption(key, defaultValue = null) {
            // TIPTAP BEST PRACTICE: Fallback pattern for offline-first collaborative editing
            if (this.ydoc) {
                // Y.js document exists - use collaborative map
            const publishOptions = this.ydoc.getMap('publishOptions');
            return publishOptions.get(key) || defaultValue;
            } else {
                // Y.js document not ready yet - use local state
                const localOptions = this.content.publishOptions || {};
                return localOptions[key] || defaultValue;
            }
        },

        getPublishOptions() {
            // TIPTAP BEST PRACTICE: Fallback pattern for offline-first collaborative editing
            if (this.ydoc) {
                // Y.js document exists - use collaborative map
                const publishOptions = this.ydoc.getMap('publishOptions');
                return publishOptions.toJSON();
            } else {
                // Y.js document not ready yet - use local state
                return this.content.publishOptions || {};
            }
        },

        // Load publish options from Y.js into Vue data (bypasses permission checks)
        loadPublishOptionsFromYjs() {
            if (!this.ydoc) return;
            
            const publishOptions = this.ydoc.getMap('publishOptions');
            const yjsOptions = publishOptions.toJSON();
            
            // Update Vue commentOptions with Y.js data
            if (Object.keys(yjsOptions).length > 0) {
                console.log('📋 Loading publish options from Y.js:', yjsOptions);
                
                // Set flag to prevent change handlers from triggering during loading
                this.isLoadingPublishOptions = true;
                
                // Update Vue data with Y.js values (convert formats for checkboxes)
                this.commentOptions = {
                    allowVotes: yjsOptions.allowVotes !== undefined ? Boolean(yjsOptions.allowVotes) : this.commentOptions.allowVotes,
                    allowCurationRewards: yjsOptions.allowCurationRewards !== undefined ? Boolean(yjsOptions.allowCurationRewards) : this.commentOptions.allowCurationRewards,
                    maxAcceptedPayout: yjsOptions.maxAcceptedPayout !== undefined ? (yjsOptions.maxAcceptedPayout === '0.000 HBD' || yjsOptions.maxAcceptedPayout === false) : this.commentOptions.maxAcceptedPayout,
                    percentHbd: yjsOptions.percentHbd !== undefined ? (yjsOptions.percentHbd === 10000 || yjsOptions.percentHbd === true) : this.commentOptions.percentHbd
                };
                
                // Clear the loading flag after Vue has processed the changes
                this.$nextTick(() => {
                    this.isLoadingPublishOptions = false;
                    console.log('✅ Publish options loaded from Y.js into Vue data (loading flag cleared)');
                });
                
            } else {
                console.log('📋 No publish options in Y.js, using defaults');
            }
        },

        // Media Asset Management
        addImage(imageData) {
            if (!this.validatePermission('addImage')) return null;
            
            const images = this.ydoc.getArray('images');
            const imageAsset = {
                id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                hash: imageData.hash,
                filename: imageData.filename || imageData.name,
                type: imageData.type,
                size: imageData.size,
                url: `https://ipfs.dlux.io/ipfs/${imageData.hash}`,
                uploadedBy: this.username,
                uploadedAt: new Date().toISOString(),
                contract: imageData.contract || null,
                metadata: imageData.metadata || {}
            };
            
            images.push([imageAsset]);
            console.log('🖼️ Image added:', imageAsset.filename);
            return imageAsset.id;
        },

        addVideo(videoData) {
            if (!this.validatePermission('addVideo')) return null;
            
            const videos = this.ydoc.getArray('videos');
            const videoAsset = {
                id: `vid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                hash: videoData.hash,
                filename: videoData.filename || videoData.name,
                type: videoData.type,
                size: videoData.size,
                url: `https://ipfs.dlux.io/ipfs/${videoData.hash}`,
                uploadedBy: this.username,
                uploadedAt: new Date().toISOString(),
                contract: videoData.contract || null,
                metadata: videoData.metadata || {},
                transcoding: {
                    status: 'pending',
                    resolutions: [],
                    playlist: null
                }
            };
            
            videos.push([videoAsset]);
            console.log('🎥 Video added:', videoAsset.filename);
            return videoAsset.id;
        },

        add360Asset(assetData) {
            if (!this.validatePermission('add360Asset')) return null;
            
            const assets360 = this.ydoc.getArray('assets360');
            const asset = {
                id: `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                hash: assetData.hash,
                name: assetData.name,
                type: assetData.type,
                size: assetData.size,
                uploadedBy: this.username,
                uploadedAt: new Date().toISOString(),
                contract: assetData.contract || null,
                transform: assetData.transform || {
                    position: { x: 0, y: 0, z: 0 },
                    rotation: { x: 0, y: 0, z: 0 },
                    scale: { x: 1, y: 1, z: 1 }
                },
                properties: assetData.properties || {},
                lastModified: new Date().toISOString(),
                modifiedBy: this.username
            };
            
            assets360.push([asset]);
            console.log('🌐 360° asset added:', asset.name);
            return asset.id;
        },

        addAttachment(fileData) {
            if (!this.validatePermission('addAttachment')) return null;
            
            const attachments = this.ydoc.getArray('attachments');
            const attachment = {
                id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                hash: fileData.hash,
                filename: fileData.filename || fileData.name,
                type: fileData.type,
                size: fileData.size,
                url: `https://ipfs.dlux.io/ipfs/${fileData.hash}`,
                uploadedBy: this.username,
                uploadedAt: new Date().toISOString(),
                contract: fileData.contract || null,
                description: fileData.description || ''
            };
            
            attachments.push([attachment]);
            console.log('📎 Attachment added:', attachment.filename);
            return attachment.id;
        },

        // File Upload Integration
        handleFileUpload(fileData) {
            if (!fileData) return null;
            
            console.log('📎 Processing file upload:', fileData);
            
            // Route to appropriate handler based on file type
            if (fileData.type && fileData.type.startsWith('image/')) {
                return this.addImage(fileData);
            } else if (fileData.type && fileData.type.startsWith('video/')) {
                return this.addVideo(fileData);
                                } else {
                return this.addAttachment(fileData);
            }
        },

        // Video Transcoding Management
        updateVideoTranscoding(videoId, transcodeData) {
            if (!this.validatePermission('updateVideoTranscoding')) return false;
            
            const videos = this.ydoc.getArray('videos');
            const videoArray = videos.toArray();
            const videoIndex = videoArray.findIndex(v => v.id === videoId);
            
            if (videoIndex !== -1) {
                const video = videoArray[videoIndex];
                video.transcoding = {
                    ...video.transcoding,
                    ...transcodeData,
                    lastUpdated: new Date().toISOString()
                };
                
                // Update the video in the Y.Array
                videos.delete(videoIndex, 1);
                videos.insert(videoIndex, [video]);
                
                console.log('🎬 Video transcoding updated:', videoId);
                return true;
            }
            return false;
        },

        // Conflict-free asset transform management
        updateAssetTransform(assetId, transformType, value) {
            if (!this.validatePermission('updateAssetTransform')) return false;
            
            // Use individual transform maps for conflict-free updates
            const transformMap = this.ydoc.getMap(`transform_${assetId}`);
            transformMap.set(transformType, value);
            transformMap.set('lastModified', new Date().toISOString());
            transformMap.set('modifiedBy', this.username);
            
            console.log('🌐 Asset transform updated:', assetId, transformType, value);
            return true;
        },

        getAssetTransform(assetId) {
            const transformMap = this.ydoc.getMap(`transform_${assetId}`);
            return transformMap.toJSON();
        },

        // Legacy method for backward compatibility (now conflict-free)
        update360AssetTransform(assetId, transform) {
            if (!this.validatePermission('update360AssetTransform')) return false;
            
            // Update using conflict-free individual properties
            if (transform.position) {
                this.updateAssetTransform(assetId, 'position', transform.position);
            }
            if (transform.rotation) {
                this.updateAssetTransform(assetId, 'rotation', transform.rotation);
            }
            if (transform.scale) {
                this.updateAssetTransform(assetId, 'scale', transform.scale);
            }
            
            console.log('🎯 360° asset transform updated (legacy):', assetId);
            return true;
        },

        // Get all collaborative data for parent sync
        getCollaborativeData() {
            return {
                config: this.ydoc.getMap('config').toJSON(),
                publishOptions: this.ydoc.getMap('publishOptions').toJSON(),
                tags: this.ydoc.getArray('tags').toArray(),
                beneficiaries: this.ydoc.getArray('beneficiaries').toArray(),
                customJson: this.ydoc.getMap('customJson').toJSON(),
                images: this.ydoc.getArray('images').toArray(),
                videos: this.ydoc.getArray('videos').toArray(),
                assets360: this.ydoc.getArray('assets360').toArray(),
                attachments: this.ydoc.getArray('attachments').toArray(),
                videoData: this.ydoc.getMap('videoData').toJSON()
            };
        },

        // Sync collaborative data to parent component
        syncToParent() {
            // FIXED: Increment collaborativeDataVersion to trigger Vue reactivity for display methods
            this.collaborativeDataVersion++;
            const collaborativeData = this.getCollaborativeData();
            this.$emit('collaborative-data-changed', collaborativeData);
        },

        // Handle updates from parent component
        handlePostTypeChange(newPostType) {
            if (this.isCollaborativeMode && this.ydoc) {
                this.setPostType(newPostType);
            }
        },

        handleAssetUpdate(assets) {
            if (this.isCollaborativeMode && this.ydoc && Array.isArray(assets)) {
                // Clear existing assets
                const assets360 = this.ydoc.getArray('assets360');
                assets360.delete(0, assets360.length);
                
                // Add new assets
                assets.forEach(asset => {
                    this.add360Asset(asset);
                });
                
                console.log('🌐 Assets updated from parent:', assets.length);
            }
        },

        // Permission validation
        validatePermission(operation) {
            // Check read-only mode first
            if (this.isReadOnlyMode) {
                console.warn(`🚫 Blocked ${operation}: read-only permissions`);
                return false;
            }
            
            // Block operations if schema version mismatch detected
            if (this.schemaVersionMismatch) {
                console.warn(`🚫 Blocked ${operation}: schema version mismatch - please refresh to update`);
                return false;
            }
            
            // Enhanced permission validation for collaborative documents
            if (this.currentFile?.type === 'collaborative') {
                // CRITICAL FIX: Allow document owner to edit even if permissions aren't loaded yet
                // This prevents blocking during the conversion process
                if (this.currentFile.owner === this.username) {
                    console.log(`🔐 Allowing ${operation} for document owner (${this.username}) even if permissions not fully loaded`);
                    return true;
                }
                
                // Ensure we have valid permissions loaded for non-owners
                if (!Array.isArray(this.documentPermissions) || this.documentPermissions.length === 0) {
                    console.warn(`🚫 Blocked ${operation}: permissions not loaded`);
                    return false;
                }
                
                // Check specific operation permissions
                const userPermission = this.documentPermissions.find(p => p.account === this.username);
                if (!userPermission) {
                    console.warn(`🚫 Blocked ${operation}: no permission found for user`);
                    return false;
                }
                
                // Operation-specific permission checks
                if (operation === 'publish' && userPermission.permissionType !== 'postable') {
                    console.warn(`🚫 Blocked ${operation}: requires 'postable' permission, user has '${userPermission.permissionType}'`);
                    return false;
                }
                
                if (['edit', 'addTag', 'addBeneficiary', 'setCustomJson', 'setCustomJsonField', 'removeCustomJsonField'].includes(operation) && 
                    userPermission.permissionType === 'readonly') {
                    console.warn(`🚫 Blocked ${operation}: requires edit permissions, user has 'readonly'`);
                    return false;
                }
            }
            
            return true;
        },

        // User presence management
        updatePresenceUI() {
            if (!this.provider || !this.provider.awareness) {
                this.connectedUsers = [];
                return;
            }

            try {
                // Get all awareness states
                const awarenessStates = this.provider.awareness.getStates();
                const users = [];
                
                console.log('🔍 DEBUG: Raw awareness states:', awarenessStates);
                console.log('🔍 DEBUG: Awareness states size:', awarenessStates.size);
                
                // Convert awareness states to user objects
                awarenessStates.forEach((state, clientId) => {
                    console.log('🔍 DEBUG: Processing state for client', clientId, ':', state);
                    
                    if (state && state.user && state.user.name) {
                        // Only add if this client ID isn't already in the users array
                        const existingUser = users.find(u => u.id === clientId);
                        if (!existingUser) {
                            users.push({
                                id: clientId,
                                name: state.user.name,
                                color: state.user.color || this.generateUserColor(state.user.name)
                            });
                            console.log('✅ Added user:', state.user.name, 'with client ID:', clientId);
                        } else {
                            console.log('⚠️ Skipped duplicate client ID:', clientId, 'for user:', state.user.name);
                        }
                    } else {
                        console.log('❌ Skipped state - missing user data:', {
                            hasState: !!state,
                            hasUser: !!(state && state.user),
                            hasUserName: !!(state && state.user && state.user.name),
                            state: state
                        });
                    }
                });
                
                // Update connected users
                this.connectedUsers = users;
                console.log('👥 Connected users updated:', users.map(u => u.name));
                
            } catch (error) {
                console.error('❌ Error updating presence UI:', error);
                this.connectedUsers = [];
            }
        },

        // Update editor permissions based on current user's access level
        updateEditorPermissions() {
            console.log('🔐 Updating editor permissions, read-only mode:', this.isReadOnlyMode);
            
            // Set flag to prevent temp document creation during permission updates
            this.isUpdatingPermissions = true;
            
            // Update title editor permissions
            if (this.titleEditor) {
                this.titleEditor.setEditable(!this.isReadOnlyMode);
                console.log(`📝 Title editor set to ${this.isReadOnlyMode ? 'READ-ONLY' : 'EDITABLE'}`);
            }
            
            // Update body editor permissions
            if (this.bodyEditor) {
                this.bodyEditor.setEditable(!this.isReadOnlyMode);
                console.log(`📝 Body editor set to ${this.isReadOnlyMode ? 'READ-ONLY' : 'EDITABLE'}`);
            }
            
            // Clear permission update flag after a brief delay
            setTimeout(() => {
                this.isUpdatingPermissions = false;
            }, 100);
            
            // Update placeholders to reflect read-only state
            if (this.titleEditor) {
                // Note: TipTap doesn't have a direct way to update placeholder after creation
                // The placeholder will be correct on next editor recreation
            }
            
            // Force Vue to re-evaluate computed properties and update UI
            this.$forceUpdate();
        },

        // TipTap Best Practice: Add CollaborationCursor when provider becomes available
        // Following offline-first collaborative architecture pattern
        async addCollaborationCursor(provider) {
            console.log('🎯 addCollaborationCursor called with provider:', !!provider);
            console.log('🎯 titleEditor exists:', !!this.titleEditor);
            console.log('🎯 bodyEditor exists:', !!this.bodyEditor);
            
            if (!provider || !this.titleEditor || !this.bodyEditor) {
                console.log('⚠️ Cannot add CollaborationCursor: missing provider or editors');
                console.log('  - provider:', !!provider);
                console.log('  - titleEditor:', !!this.titleEditor);
                console.log('  - bodyEditor:', !!this.bodyEditor);
                return;
            }

            try {
                // Get CollaborationCursor from bundle
                const bundle = window.TiptapCollaboration?.default || window.TiptapCollaboration;
                console.log('🎯 TipTap bundle available:', !!bundle);
                console.log('🎯 Bundle keys:', bundle ? Object.keys(bundle) : 'none');
                
                const CollaborationCursor = bundle?.CollaborationCursor?.default || bundle?.CollaborationCursor;
                console.log('🎯 CollaborationCursor available:', !!CollaborationCursor);
                
                if (!CollaborationCursor) {
                    console.log('⚠️ CollaborationCursor extension not available in bundle');
                    console.log('Available extensions:', bundle ? Object.keys(bundle).filter(k => k.includes('Cursor') || k.includes('Collaboration')) : 'none');
                    return;
                }

                console.log('🎯 Adding CollaborationCursor extension to editors...');

                // Configure cursor extension with user info
                const userName = this.username || 'Anonymous' + Math.floor(Math.random() * 1000);
                // Simple random color generation - Math.random my dude!
                const userColor = '#' + Math.floor(Math.random()*16777215).toString(16);
                
                const cursorConfig = {
                    provider: provider,
                    user: {
                        name: userName,
                        color: userColor
                    }
                };

                console.log('👤 Cursor user config:', cursorConfig.user);

                // TipTap Best Practice: Recreate editors with CollaborationCursor
                // This is more reliable than trying to add extensions dynamically
                await this.recreateEditorsWithCursor(provider, cursorConfig);

                console.log('✅ CollaborationCursor added successfully');
                
                // Update user info in awareness for real-time presence
                if (provider.awareness) {
                    console.log('🔍 DEBUG: About to set awareness user data:', cursorConfig.user);
                    console.log('🔍 DEBUG: Provider awareness exists:', !!provider.awareness);
                    console.log('🔍 DEBUG: Provider awareness clientID:', provider.awareness.clientID);
                    
                    // Try both methods to set awareness state
                    provider.awareness.setLocalStateField('user', cursorConfig.user);
                    console.log('👥 User awareness updated via setLocalStateField:', cursorConfig.user);
                    
                    // Alternative method - set entire local state
                    provider.awareness.setLocalState({ user: cursorConfig.user });
                    console.log('👥 User awareness updated via setLocalState:', cursorConfig.user);
                    
                    const localState = provider.awareness.getLocalState();
                    console.log('🔍 DEBUG: Local awareness state after setting:', localState);
                    console.log('🔍 DEBUG: Local state user field:', localState?.user);
                    
                    // Initial presence UI update
                    setTimeout(() => {
                        console.log('🔍 DEBUG: All awareness states after timeout:', provider.awareness.getStates());
                        this.updatePresenceUI();
                    }, 500); // Small delay to let awareness propagate
                } else {
                    console.error('❌ Provider awareness not available!');
                }

            } catch (error) {
                console.error('❌ Error adding CollaborationCursor:', error);
            }
        },

        // Recreate editors with CollaborationCursor extension
        async recreateEditorsWithCursor(provider, cursorConfig) {
            if (!this.ydoc || !provider) {
                console.error('Cannot recreate editors: missing Y.js document or provider');
                return;
            }

            try {
                const bundle = window.TiptapCollaboration?.default || window.TiptapCollaboration;
                const Editor = bundle.Editor?.default || bundle.Editor;
                const StarterKit = bundle.StarterKit?.default || bundle.StarterKit;
                const Collaboration = bundle.Collaboration?.default || bundle.Collaboration;
                const CollaborationCursor = bundle.CollaborationCursor?.default || bundle.CollaborationCursor;
                const Placeholder = bundle.Placeholder?.default || bundle.Placeholder;

                if (!Editor || !StarterKit || !Collaboration || !CollaborationCursor || !Placeholder) {
                    console.error('Missing required TipTap components for cursor recreation');
                    return;
                }

                console.log('🔄 Recreating editors with CollaborationCursor...');

                // Store current content to preserve it
                const titleContent = this.titleEditor ? this.titleEditor.getText() : '';
                const bodyContent = this.bodyEditor ? this.bodyEditor.getHTML() : '';

                // Destroy existing editors
                if (this.titleEditor) {
                    this.titleEditor.destroy();
                    this.titleEditor = null;
                }
                if (this.bodyEditor) {
                    this.bodyEditor.destroy();
                    this.bodyEditor = null;
                }

                // Wait a tick for DOM cleanup
                await this.$nextTick();

                // Get enhanced extensions helper
                const getEnhancedExtensions = (field) => {
                    return this.getEnhancedExtensions(field, bundle, {
                        includeCursor: true,
                        includeEnhanced: true
                    });
                };

                // Recreate title editor with enhanced cursor extensions
                const titleExtensions = getEnhancedExtensions('title');

                this.titleEditor = new Editor({
                    element: this.$refs.titleEditor,
                    extensions: titleExtensions,
                    editable: !this.isReadOnlyMode,
                    onUpdate: ({ editor }) => {
                        if (this.validatePermission('edit')) {
                            this.hasUnsavedChanges = true;
                            this.updateContent(); // Update content for parent component
                            this.clearUnsavedAfterSync(); // Handle Y.js sync
                            this.debouncedAutoSave(); // Trigger autosave for local documents
                        }
                    },
                    // Add focus and blur handlers to debug cursor tracking
                    onFocus: ({ editor }) => {
                        console.log('🎯 Title editor focused - cursor should be updated');
                        // Force cursor update by getting selection
                        const selection = editor.state.selection;
                        console.log('🎯 Title editor selection:', { from: selection.from, to: selection.to });
                        
                        // Update awareness with cursor info manually if needed
                        if (this.provider && this.provider.awareness) {
                            setTimeout(() => {
                                const currentState = this.provider.awareness.getLocalState();
                                console.log('🎯 Local awareness state after title focus:', currentState);
                            }, 100);
                        }
                    },
                    onBlur: ({ editor }) => {
                        console.log('🎯 Title editor blurred');
                        // DIRECT: Clear cursor from awareness when editor loses focus
                        if (this.provider && this.provider.awareness) {
                            const currentState = this.provider.awareness.getLocalState();
                            const newState = { ...currentState, cursor: null };
                            console.log('🎯 DIRECT: Clearing cursor from awareness');
                            this.provider.awareness.setLocalState(newState);
                        }
                    },
                    onSelectionUpdate: ({ editor }) => {
                        const selection = editor.state.selection;
                        console.log('🎯 Title cursor moved:', { from: selection.from, to: selection.to });
                        
                        // DIRECT AWARENESS UPDATE - no method calls
                        if (this.provider && this.provider.awareness && selection) {
                            const currentState = this.provider.awareness.getLocalState();
                            const newState = {
                                ...currentState,
                                cursor: {
                                    anchor: selection.from,
                                    head: selection.to,
                                    field: 'title'
                                }
                            };
                            console.log('🎯 DIRECT: Setting title cursor in awareness:', newState.cursor);
                            this.provider.awareness.setLocalState(newState);
                        } else {
                            console.log('❌ DIRECT: Cannot update awareness - missing provider/awareness/selection');
                        }
                    }
                });

                // Recreate body editor with enhanced cursor extensions
                const bodyExtensions = getEnhancedExtensions('body');

                this.bodyEditor = new Editor({
                    element: this.$refs.bodyEditor,
                    extensions: bodyExtensions,
                    editable: !this.isReadOnlyMode,
                    onUpdate: ({ editor }) => {
                        if (this.validatePermission('edit')) {
                            this.hasUnsavedChanges = true;
                            this.updateContent(); // Update content for parent component
                            this.clearUnsavedAfterSync(); // Handle Y.js sync
                            this.debouncedAutoSave(); // Trigger autosave for local documents
                        }
                    },
                    // Add focus and blur handlers to debug cursor tracking
                    onFocus: ({ editor }) => {
                        console.log('🎯 Body editor focused - cursor should be updated');
                        // Force cursor update by getting selection
                        const selection = editor.state.selection;
                        console.log('🎯 Body editor selection:', { from: selection.from, to: selection.to });
                        
                        // Update awareness with cursor info manually if needed
                        if (this.provider && this.provider.awareness) {
                            setTimeout(() => {
                                const currentState = this.provider.awareness.getLocalState();
                                console.log('🎯 Local awareness state after body focus:', currentState);
                            }, 100);
                        }
                    },
                    onBlur: ({ editor }) => {
                        console.log('🎯 Body editor blurred');
                        // DIRECT: Clear cursor from awareness when editor loses focus
                        if (this.provider && this.provider.awareness) {
                            const currentState = this.provider.awareness.getLocalState();
                            const newState = { ...currentState, cursor: null };
                            console.log('🎯 DIRECT: Clearing cursor from awareness');
                            this.provider.awareness.setLocalState(newState);
                        }
                    },
                    onSelectionUpdate: ({ editor }) => {
                        const selection = editor.state.selection;
                        console.log('🎯 Body cursor moved:', { from: selection.from, to: selection.to });
                        
                        // DIRECT AWARENESS UPDATE - no method calls
                        if (this.provider && this.provider.awareness && selection) {
                            const currentState = this.provider.awareness.getLocalState();
                            const newState = {
                                ...currentState,
                                cursor: {
                                    anchor: selection.from,
                                    head: selection.to,
                                    field: 'body'
                                }
                            };
                            console.log('🎯 DIRECT: Setting body cursor in awareness:', newState.cursor);
                            this.provider.awareness.setLocalState(newState);
                        } else {
                            console.log('❌ DIRECT: Cannot update awareness - missing provider/awareness/selection');
                        }
                    }
                });

                console.log('✅ Editors recreated with CollaborationCursor support');

            } catch (error) {
                console.error('❌ Error recreating editors with cursor:', error);
            }
        },

        // TipTap Best Practice: Handle content validation errors gracefully
        handleContentValidationError(editorType, error, disableCollaboration) {
            console.error(`🚨 Content validation error in ${editorType} editor:`, error);
            
            // For collaborative documents: disable collaboration to prevent sync issues
            if (this.isCollaborativeMode && disableCollaboration) {
                console.warn('🔒 Disabling collaboration due to content validation error');
                disableCollaboration();
                this.connectionStatus = 'error';
                this.connectionMessage = `Content validation error in ${editorType} - collaboration disabled`;
                
                // Disable editor to prevent further issues
                if (editorType === 'title' && this.titleEditor) {
                    this.titleEditor.setEditable(false);
                } else if (editorType === 'body' && this.bodyEditor) {
                    this.bodyEditor.setEditable(false);
                }
                
                // Show user-friendly error message
                const message = `Content validation error detected in ${editorType}. ` +
                              `This may be due to incompatible content from a different app version. ` +
                              `Please refresh the page to continue editing.`;
                
                // Use a timeout to ensure the error doesn't block the UI
                setTimeout(() => {
                    if (confirm(message + '\n\nRefresh page now?')) {
                        window.location.reload();
                    }
                }, 100);
            } else {
                // For non-collaborative documents: log but continue
                console.warn(`Content validation failed in ${editorType}, but editor remains functional`);
            }
        },
        


        // Debug collaborative cursor states and force cursor updates
        debugCursors() {
            console.log('🎯 DEBUG: Manual cursor check triggered');
            
            if (!this.provider || !this.provider.awareness) {
                console.log('❌ No provider or awareness available');
                return;
            }
            
            // Log all awareness states
            const awarenessStates = this.provider.awareness.getStates();
            console.log('🎯 All awareness states:', awarenessStates);
            
            awarenessStates.forEach((state, clientId) => {
                console.log(`🎯 Client ${clientId}:`, {
                    user: state.user,
                    cursor: state.cursor,
                    hasCursor: !!state.cursor,
                    cursorType: typeof state.cursor
                });
            });
            
            // Check local state
            const localState = this.provider.awareness.getLocalState();
            console.log('🎯 Local awareness state:', localState);
            
            // Check editor states
            if (this.titleEditor) {
                const titleSelection = this.titleEditor.state.selection;
                console.log('🎯 Title editor selection:', {
                    from: titleSelection.from,
                    to: titleSelection.to,
                    empty: titleSelection.empty,
                    focused: this.titleEditor.isFocused
                });
            }
            
            if (this.bodyEditor) {
                const bodySelection = this.bodyEditor.state.selection;
                console.log('🎯 Body editor selection:', {
                    from: bodySelection.from,
                    to: bodySelection.to,
                    empty: bodySelection.empty,
                    focused: this.bodyEditor.isFocused
                });
            }
            
            // Try to manually trigger cursor update by briefly focusing and updating selection
            console.log('🎯 Attempting to force cursor update...');
            if (this.titleEditor && !this.titleEditor.isFocused) {
                this.titleEditor.commands.focus();
                setTimeout(() => {
                    console.log('🎯 After focus - local state:', this.provider.awareness.getLocalState());
                }, 200);
            }
            
            // Also check Y.js document structure
            if (this.ydoc) {
                // Use XmlFragment types to be compatible with TipTap Collaboration extension
                const titleFragment = this.ydoc.get('title', this.lazyYjsComponents?.Y?.XmlFragment);
                const bodyFragment = this.ydoc.get('body', this.lazyYjsComponents?.Y?.XmlFragment);
                
                console.log('🎯 Y.js document info:', {
                    clientID: this.ydoc.clientID,
                    hasTitle: titleFragment ? titleFragment.length : 0,
                    hasBody: bodyFragment ? bodyFragment.length : 0,
                    titleContent: titleFragment ? titleFragment.toString().substring(0, 50) : '',
                    bodyContent: bodyFragment ? bodyFragment.toString().substring(0, 50) : ''
                });
            }
            
            // Try to manually sync cursor to awareness
            this.forceCursorSync();
            
            return {
                awarenessStates: Array.from(awarenessStates.entries()),
                localState,
                editorsExist: {
                    title: !!this.titleEditor,
                    body: !!this.bodyEditor
                }
            };
        },

        // Manually update cursor position in awareness state
        updateCursorInAwareness(field, selection) {
            if (!this.provider || !this.provider.awareness) {
                console.log('❌ No provider/awareness for cursor update');
                return;
            }
            
            // Always update cursor position - don't be restrictive
            if (selection) {
                const currentState = this.provider.awareness.getLocalState();
                const cursorData = {
                    anchor: selection.from,
                    head: selection.to,
                    field: field,
                    timestamp: Date.now()
                };
                
                const newState = {
                    ...currentState,
                    cursor: cursorData
                };
                
                console.log(`🎯 Manually updating ${field} cursor:`, cursorData);
                this.provider.awareness.setLocalState(newState);
                
                // Verify it was set
                setTimeout(() => {
                    const verifyState = this.provider.awareness.getLocalState();
                    console.log(`🎯 Verified ${field} cursor state:`, verifyState.cursor);
                }, 50);
            } else {
                console.log(`❌ No selection provided for ${field} cursor update`);
            }
        },

        // Clear cursor from awareness when editor loses focus
        clearCursorFromAwareness() {
            if (!this.provider || !this.provider.awareness) {
                return;
            }
            
            const currentState = this.provider.awareness.getLocalState();
            if (currentState.cursor) {
                const newState = {
                    ...currentState,
                    cursor: null
                };
                
                console.log('🎯 Clearing cursor from awareness');
                this.provider.awareness.setLocalState(newState);
            }
        },

        // Force cursor synchronization to awareness
        forceCursorSync() {
            console.log('🎯 Force cursor sync started');
            
            if (!this.provider || !this.provider.awareness) {
                console.log('❌ No provider/awareness for cursor sync');
                return;
            }
            
            // Get current focused editor
            let focusedEditor = null;
            let fieldName = '';
            
            if (this.titleEditor && this.titleEditor.isFocused) {
                focusedEditor = this.titleEditor;
                fieldName = 'title';
            } else if (this.bodyEditor && this.bodyEditor.isFocused) {
                focusedEditor = this.bodyEditor;
                fieldName = 'body';
            }
            
            if (focusedEditor) {
                const selection = focusedEditor.state.selection;
                console.log(`🎯 Manually setting cursor for ${fieldName}:`, {
                    from: selection.from,
                    to: selection.to,
                    fieldName
                });
                
                // Try to manually set cursor in awareness
                const currentState = this.provider.awareness.getLocalState();
                const newState = {
                    ...currentState,
                    cursor: {
                        anchor: selection.from,
                        head: selection.to,
                        field: fieldName
                    }
                };
                
                console.log('🎯 Setting manual cursor state:', newState);
                this.provider.awareness.setLocalState(newState);
                
                // Verify it was set
                setTimeout(() => {
                    const verifyState = this.provider.awareness.getLocalState();
                    console.log('🎯 Cursor state after manual setting:', verifyState);
                }, 100);
            } else {
                console.log('🎯 No focused editor found for cursor sync');
            }
        },

        // ===== UNIFIED SYNC INDICATOR: Offline-First Architecture =====
        clearUnsavedAfterSync() {
            if (this.syncTimeout) {
                clearTimeout(this.syncTimeout);
            }
            
            // Single unified sync indicator for Y.js + IndexedDB persistence
            // Following TipTap offline-first best practices
            this.syncTimeout = setTimeout(async () => {
                if (this.indexeddbProvider) {
                    console.log('💾 Y.js + IndexedDB persistence complete (offline-first)');
                } else if (this.connectionStatus === 'connected') {
                    console.log('💾 Y.js + Cloud sync complete (online mode)');
                } else {
                    console.log('💾 Y.js persistence complete (memory only - will not persist after page refresh)');
                }
                
                // ===== TEMP DOCUMENT STRATEGY: Document creation handled in performAutoSave =====
                // For collaborative documents, just clear the unsaved indicator
                if (this.currentFile?.type === 'collaborative') {
                    console.log('💾 Collaborative document changes synced via Y.js');
                } else if (this.currentFile) {
                    // Local document already exists - just log the save completion
                    console.log('💾 Local document changes saved:', this.currentFile.name);
                } else {
                    console.log('💾 Changes synced to Y.js (document creation handled elsewhere)');
                }
                
                this.hasUnsavedChanges = false;
            }, 1000); // 1 second delay to show sync indicator
        },

        // ✅ TIPTAP BEST PRACTICE: Ensure local file entry exists for ALL documents (unified approach)
        async ensureLocalFileEntry() {
            try {
                // Skip during initialization to prevent race conditions
                if (this.isInitializing) {
                    console.log('📝 Skipping local file entry creation during initialization');
                    return;
                }
                
                // ✅ UNIFIED: Create local file entry for ALL documents if missing
                if (!this.currentFile) {
                    
                    // Generate file info if needed
                    const timestamp = Date.now();
                    const title = this.getPlainTextTitle();
                    let filename;
                    
                    if (title && title.trim()) {
                        // Use the actual title if it exists
                        filename = title.substring(0, 50).replace(/[^a-zA-Z0-9\s-]/g, '').trim();
                    } else {
                        // Create "untitled - date time" format to match UI display
                        const now = new Date();
                        const dateStr = now.toLocaleDateString();
                        const timeStr = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                        filename = `Untitled - ${dateStr} ${timeStr}`;
                    }
                    
                    // ✅ CRITICAL: Use IndexedDB provider name (clean ID) if available
                    const documentId = this.indexeddbProvider?.name || `local_${timestamp}`;
                    
                    this.currentFile = {
                        id: documentId,
                        name: filename,
                        type: 'local',
                        lastModified: new Date().toISOString(),
                        isOfflineFirst: true // Flag to indicate this uses Y.js + IndexedDB
                    };
                    this.fileType = 'local';
                    
                    // Update local file index (metadata only - content is in Y.js + IndexedDB)
                    await this.updateLocalFileIndex();
                    
                    // Refresh local files list to show the new entry
                    await this.loadLocalFiles();
                    
                    // ✅ CRITICAL: Mark as no longer temporary since we now have a proper file entry
                    if (this.isTemporaryDocument) {
                        this.isTemporaryDocument = false;
                        console.log('📝 Temp document converted to local document:', this.currentFile.name);
                    }
                    
                    console.log('📝 Local file entry ensured for UX:', this.currentFile.name);
                }
            } catch (error) {
                console.error('Error ensuring local file entry:', error);
            }
        },

        // Helper method to get plain text title
        getPlainTextTitle() {
            if (this.titleEditor) {
                // Get text and clean it thoroughly
                let text = this.titleEditor.getText().trim();
                
                // Remove any invisible characters or placeholder artifacts
                text = text
                    .replace(/\u00A0/g, ' ')      // Non-breaking spaces
                    .replace(/\u200B/g, '')       // Zero-width spaces
                    .replace(/\uFEFF/g, '')       // Byte order marks
                    .replace(/[\u2000-\u206F]/g, ' ') // General punctuation spaces
                    .replace(/\s+/g, ' ')         // Multiple spaces to single
                    .trim();
                
                return text;
            }
            return this.content.title?.replace(/<[^>]*>/g, '').trim() || '';
        },

        // ===== ENHANCED EXPORT CAPABILITIES =====
        
        /**
         * Generate markdown from editor content
         * TipTap doesn't have built-in markdown export, but we can create one
         */
        getMarkdownContent() {
            try {
                const titleText = this.titleEditor ? this.titleEditor.getText().trim() : '';
                const bodyHTML = this.bodyEditor ? this.bodyEditor.getHTML() : '';
                
                // Convert HTML to markdown-like format
                let markdown = this.htmlToMarkdown(bodyHTML);
                
                // Add title if it exists
                if (titleText) {
                    markdown = `# ${titleText}\n\n${markdown}`;
                }
                
                return markdown;
            } catch (error) {
                console.error('Error generating markdown:', error);
                return this.getPlainTextContent();
            }
        },

        /**
         * Basic HTML to Markdown converter
         * For more advanced conversion, consider using a library like turndown
         */
        htmlToMarkdown(html) {
            if (!html) return '';
            
            return html
                // Remove wrapper paragraphs for cleaner output
                .replace(/<p><\/p>/g, '\n')
                .replace(/<p>/g, '')
                .replace(/<\/p>/g, '\n\n')
                
                // Convert headings
                .replace(/<h1[^>]*>(.*?)<\/h1>/g, '# $1\n\n')
                .replace(/<h2[^>]*>(.*?)<\/h2>/g, '## $1\n\n')
                .replace(/<h3[^>]*>(.*?)<\/h3>/g, '### $1\n\n')
                .replace(/<h4[^>]*>(.*?)<\/h4>/g, '#### $1\n\n')
                .replace(/<h5[^>]*>(.*?)<\/h5>/g, '##### $1\n\n')
                .replace(/<h6[^>]*>(.*?)<\/h6>/g, '###### $1\n\n')
                
                // Convert formatting
                .replace(/<strong[^>]*>(.*?)<\/strong>/g, '**$1**')
                .replace(/<b[^>]*>(.*?)<\/b>/g, '**$1**')
                .replace(/<em[^>]*>(.*?)<\/em>/g, '*$1*')
                .replace(/<i[^>]*>(.*?)<\/i>/g, '*$1*')
                .replace(/<s[^>]*>(.*?)<\/s>/g, '~~$1~~')
                .replace(/<del[^>]*>(.*?)<\/del>/g, '~~$1~~')
                .replace(/<code[^>]*>(.*?)<\/code>/g, '`$1`')
                
                // Convert links
                .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/g, '[$2]($1)')
                
                // Convert images
                .replace(/<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*\/?>/g, '![$1]($2)')
                .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/g, '![$2]($1)')
                .replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/g, '![]($1)')
                
                // Convert lists
                .replace(/<ul[^>]*>/g, '')
                .replace(/<\/ul>/g, '\n')
                .replace(/<ol[^>]*>/g, '')
                .replace(/<\/ol>/g, '\n')
                .replace(/<li[^>]*>/g, '- ')
                .replace(/<\/li>/g, '\n')
                
                // Convert blockquotes
                .replace(/<blockquote[^>]*>/g, '> ')
                .replace(/<\/blockquote>/g, '\n\n')
                
                // Convert code blocks
                .replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gs, '```\n$1\n```\n\n')
                
                // Convert horizontal rules
                .replace(/<hr[^>]*\/?>/g, '\n---\n\n')
                
                // Clean up line breaks
                .replace(/\n\n\n+/g, '\n\n')
                .replace(/^\n+/, '')
                .replace(/\n+$/, '\n')
                
                // Decode HTML entities
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'");
        },

        /**
         * Get plain text content from all editors
         */
        getPlainTextContent() {
            const title = this.titleEditor ? this.titleEditor.getText().trim() : '';
            const body = this.bodyEditor ? this.bodyEditor.getText().trim() : '';
            
            return title ? `${title}\n\n${body}` : body;
        },

        /**
         * Debug method to inspect title content issues
         */
        debugTitleContent() {
            console.log('🔍 Title Debug Info:');
            console.log('titleEditor exists:', !!this.titleEditor);
            if (this.titleEditor) {
                const rawText = this.titleEditor.getText();
                const rawHtml = this.titleEditor.getHTML();
                console.log('Raw getText():', JSON.stringify(rawText));
                console.log('Raw getHTML():', rawHtml);
                console.log('Character codes:', [...rawText].map(c => ({ char: c, code: c.charCodeAt(0) })));
                console.log('Clean title:', this.getPlainTextTitle());
            }
            console.log('content.title:', JSON.stringify(this.content.title));
            console.log('Generated permlink:', this.generatedPermlink);
        },

        /**
         * Export content in various formats
         */
        exportContent(format = 'markdown') {
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const filename = this.currentFile?.title || this.getPlainTextTitle() || 'untitled';
            const safeFilename = filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            
            let content, mimeType, extension;
            
            switch (format) {
                case 'markdown':
                    content = this.getMarkdownContent();
                    mimeType = 'text/markdown';
                    extension = 'md';
                    break;
                    
                case 'html':
                    const titleHTML = this.titleEditor ? this.titleEditor.getText() : '';
                    const bodyHTML = this.bodyEditor ? this.bodyEditor.getHTML() : '';
                    content = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${this.getPlainTextTitle() || 'Untitled'}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; }
        h1, h2, h3, h4, h5, h6 { margin-top: 2rem; margin-bottom: 1rem; }
        code { background: #f4f4f4; padding: 0.2em 0.4em; border-radius: 3px; }
        pre { background: #f4f4f4; padding: 1rem; border-radius: 5px; overflow-x: auto; }
        blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 1rem; color: #666; }
        img { max-width: 100%; height: auto; }
    </style>
</head>
<body>
    ${titleHTML ? `<h1>${titleHTML}</h1>` : ''}
    ${bodyHTML}
</body>
</html>`;
                    mimeType = 'text/html';
                    extension = 'html';
                    break;
                    
                case 'text':
                    content = this.getPlainTextContent();
                    mimeType = 'text/plain';
                    extension = 'txt';
                    break;
                    
                case 'json':
                    content = JSON.stringify({
                        title: this.getPlainTextTitle(),
                        content: this.getEditorContent(),
                        metadata: {
                            created: this.currentFile?.created || new Date().toISOString(),
                            modified: new Date().toISOString(),
                            type: this.currentFile?.type || 'local',
                            tags: this.content.tags || [],
                            custom_json: this.content.custom_json || {}
                        }
                    }, null, 2);
                    mimeType = 'application/json';
                    extension = 'json';
                    break;
                    
                default:
                    throw new Error(`Unsupported export format: ${format}`);
            }
            
            // Create and trigger download
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${safeFilename}_${timestamp}.${extension}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            console.log(`✅ Content exported as ${format.toUpperCase()}: ${link.download}`);
            return content;
        },

        debugCollaborativeFeatures() {
            console.log('🤝 Collaborative Features Debug:');
            console.log('- isCollaborativeMode:', this.isCollaborativeMode);
            console.log('- connectionStatus:', this.connectionStatus);
            console.log('- provider exists:', !!this.provider);
            console.log('- provider.awareness exists:', !!(this.provider && this.provider.awareness));
            console.log('- titleEditor exists:', !!this.titleEditor);
            console.log('- bodyEditor exists:', !!this.bodyEditor);
            console.log('- connectedUsers:', this.connectedUsers);
            console.log('- username:', this.username);
            console.log('- userColor: (random generated)');
            
                        if (this.provider && this.provider.awareness) {
                console.log('- awareness states:', this.provider.awareness.getStates());
                console.log('- local awareness state:', this.provider.awareness.getLocalState());
            }
            
            if (this.titleEditor) {
                console.log('- titleEditor extensions:', this.titleEditor.extensionManager.extensions.map(e => e.name));
            }
            
            if (this.bodyEditor) {
                console.log('- bodyEditor extensions:', this.bodyEditor.extensionManager.extensions.map(e => e.name));
            }
        },

        // ===== AUTO-CONNECT FUNCTIONALITY =====
        
        async checkAutoConnectParams() {
            const urlParams = new URLSearchParams(window.location.search);
            
            // Check for collaborative document parameters
            const collabOwner = urlParams.get('collab_owner');
            const collabPermlink = urlParams.get('collab_permlink');
            
            // Check for local document parameters
            const localOwner = urlParams.get('local_owner');
            const localPermlink = urlParams.get('local_permlink');
            
            if (collabOwner && collabPermlink) {
                console.log('🔗 Collaborative auto-connect parameters detected:', { collabOwner, collabPermlink });
                
                // STEP 1: Fetch document metadata FIRST to preserve title
                try {
                    const response = await fetch(`https://data.dlux.io/api/collaboration/documents/${collabOwner}/${collabPermlink}`, {
                        headers: this.authHeaders
                    });
                    
                    if (response.ok) {
                        const documentData = await response.json();
                        console.log('✅ Pre-fetched document metadata for title preservation:', documentData.documentName);
                        
                        // Store document info for title preservation
                        this.currentDocumentInfo = {
                            owner: collabOwner,
                            permlink: collabPermlink,
                            title: documentData.documentName || documentData.title,
                            description: documentData.description
                        };
                        
                        // Preserve title immediately
                        this.preserveDocumentTitle();
                    }
                } catch (fetchError) {
                    console.warn('⚠️ Could not pre-fetch document metadata:', fetchError.message);
                }
                
                // STEP 2: Wait for authentication if needed
                if (!this.isAuthenticated || this.isAuthExpired) {
                    console.log('🔑 Authentication required for auto-connect, requesting...');
                    await this.requestAuthentication();
                    
                    try {
                        await this.waitForAuthentication(10000);
                    } catch (error) {
                        console.error('❌ Auto-connect failed: Authentication timeout');
                        return;
                    }
                }
                
                // STEP 3: Auto-connect with title preservation
                try {
                    await this.autoConnectToDocument(collabOwner, collabPermlink);
                } catch (error) {
                    console.error('❌ Auto-connect failed:', error);
                }
            } else if (localOwner && localPermlink) {
                console.log('🔗 Local auto-connect parameters detected:', { localOwner, localPermlink });
                
                try {
                    await this.autoConnectToLocalDocument(localOwner, localPermlink);
                } catch (error) {
                    console.error('❌ Local auto-connect failed:', error);
                }
            }
        },

        // ===== TIPTAP BEST PRACTICE: ENHANCED TITLE PRESERVATION =====
        preserveDocumentTitle() {
            console.log('🔒 DEBUG: preserveDocumentTitle called');
            console.log('🔒 DEBUG: currentDocumentInfo:', this.currentDocumentInfo);
            
            // CRITICAL: Prevent document title corruption during auto-connect
            if (this.currentDocumentInfo?.title) {
                console.log('🔒 Preserving document title:', this.currentDocumentInfo.title);
                
                // Store title in multiple places for recovery
                this.preservedTitle = this.currentDocumentInfo.title;
                this.content.title = this.currentDocumentInfo.title;
                
                console.log('🔒 DEBUG: Title stored in preservedTitle and content.title');
                
                // Set title in editor if it exists
                if (this.titleEditor && this.titleEditor.commands) {
                    const currentTitle = this.titleEditor.getText().trim();
                    console.log('🔒 DEBUG: Current title in editor:', currentTitle);
                    
                    // Only update if current title is empty, corrupted, or looks like a path
                    if (!currentTitle || 
                        currentTitle === '' ||
                        currentTitle.includes('/') ||
                        currentTitle.includes('tech') ||
                        currentTitle === this.currentFile?.owner + '/' + this.currentFile?.permlink) {
                        
                        console.log('🔄 Restoring proper document title in editor');
                        this.titleEditor.commands.setContent(this.preservedTitle);
                    }
                } else {
                    console.log('🔒 DEBUG: No title editor available yet');
                }
                
                return this.preservedTitle;
            } else {
                console.log('🔒 DEBUG: No title found in currentDocumentInfo');
            }
            
            return null;
        },
        
        async autoConnectToDocument(owner, permlink) {
            console.log('🚀 Auto-connecting to collaborative document:', { owner, permlink });
            
            try {
                // First, try to fetch the actual document metadata from the server
                let documentData = null;
                try {
                    const response = await fetch(`https://data.dlux.io/api/collaboration/documents/${owner}/${permlink}`, {
                        headers: this.authHeaders
                    });
                    
                    if (response.ok) {
                        documentData = await response.json();
                        console.log('✅ Fetched document metadata from server:', documentData.documentName);
                    }
                } catch (fetchError) {
                    console.warn('⚠️ Could not fetch document metadata, using fallback:', fetchError.message);
                }
                
                // Create document object with proper title
                const docToLoad = {
                    owner: owner,
                    permlink: permlink,
                    name: documentData?.documentName || `${owner}/${permlink}`, // Primary display name
                    documentName: documentData?.documentName || `${owner}/${permlink}`,
                    title: documentData?.documentName || `${owner}/${permlink}`,
                    type: 'collaborative',
                    created: documentData?.created || new Date().toISOString(),
                    modified: documentData?.modified || new Date().toISOString(),
                    isPublic: documentData?.isPublic || false
                };
                
                // Load the collaborative document
                await this.loadDocument(docToLoad);
                console.log('✅ Auto-connected to collaborative document successfully');
                
                // Update URL to include the parameters (for refresh persistence)
                this.updateURLWithCollabParams(owner, permlink);
                
            } catch (error) {
                console.error('❌ Failed to auto-connect to document:', error);
                throw error;
            }
        },
        
        async autoConnectToLocalDocument(owner, permlink) {
            console.log('🚀 Auto-connecting to local document:', { owner, permlink });
            
            try {
                // ✅ SECURITY: Check if current user has access to this local document
                if (!this.username) {
                    console.error('❌ No user logged in - cannot access local documents');
                    this.clearLocalURLParams();
                    alert('Please log in to access local documents.');
                    return;
                }
                
                if (owner !== this.username) {
                    console.error('❌ Access denied: Local document belongs to different user', {
                        documentOwner: owner,
                        currentUser: this.username
                    });
                    this.clearLocalURLParams();
                    alert(`Access denied: This local document belongs to ${owner}. You are logged in as ${this.username}.`);
                    return;
                }
                
                // ✅ CRITICAL FIX: Use correct method to get local files from localStorage
                const files = JSON.parse(localStorage.getItem('dlux_tiptap_files') || '[]');
                console.log('🔍 Searching for local document in', files.length, 'files');
                console.log('🔍 Looking for permlink:', permlink, 'for user:', owner);
                
                // Try multiple matching strategies to find the document
                const existingFile = files.find(file => {
                    console.log('🔍 Checking file:', file.id, file.name, 'creator:', file.creator, 'owner:', file.owner);
                    
                    // ✅ SECURITY: Additional user verification for found files
                    const fileOwner = file.isCollaborative ? file.owner : (file.creator || file.author);
                    if (fileOwner && fileOwner !== this.username) {
                        console.log('🔒 Skipping file - belongs to different user:', fileOwner);
                        return false;
                    }
                    
                    // Direct match
                    if (file.id === permlink) return true;
                    
                    // ✅ CRITICAL FIX: Handle hyphen/underscore mismatch in URL vs localStorage
                    // URL uses hyphens, localStorage uses underscores
                    const normalizedPermlink = permlink.replace(/-/g, '_');
                    const normalizedFileId = file.id.replace(/_/g, '-');
                    
                    return file.id === normalizedPermlink || 
                           normalizedFileId === permlink ||
                           (file.id && file.id.includes(permlink)) ||
                           (file.id && file.id.includes(normalizedPermlink)) ||
                           (file.name && file.name.includes(permlink));
                });
                
                if (existingFile) {
                    console.log('✅ Found existing local document:', existingFile.name, 'with ID:', existingFile.id);
                    
                    // Load the existing local document
                    await this.loadLocalFile(existingFile);
                    console.log('✅ Auto-connected to local document successfully');
                    
                } else {
                    console.warn('⚠️ Local document not found for permlink:', permlink);
                    console.log('📋 Available local files:', files.map(f => ({ id: f.id, name: f.name })));
                    
                    // ✅ CRITICAL FIX: Clear local URL parameters, not collaborative ones
                    this.clearLocalURLParams();
                    
                    // Show user-friendly message
                    console.log('📄 Local document not found, starting with new document');
                    
                    // Optionally show a notification to the user
                    if (files.length > 0) {
                        console.log('💡 Suggestion: Check if the document was renamed or deleted');
                    }
                }
                
            } catch (error) {
                console.error('❌ Failed to auto-connect to local document:', error);
                this.clearCollabURLParams();
                throw error;
            }
        },
        
        updateURLWithCollabParams(owner, permlink) {
            const url = new URL(window.location);
            
            // ✅ CRITICAL FIX: Clear any local parameters first to prevent stacking
            url.searchParams.delete('local_owner');
            url.searchParams.delete('local_permlink');
            
            // Set collaborative parameters
            url.searchParams.set('collab_owner', owner);
            url.searchParams.set('collab_permlink', permlink);
            
            // Update URL without triggering a page reload
            window.history.replaceState({}, '', url.toString());
            console.log('🔗 URL updated with collaboration parameters (local params cleared)');
        },
        
        // ✅ UNIFIED: Update URL with local document params (same pattern as collaborative)
        updateURLWithLocalParams(username, permlink) {
            const url = new URL(window.location);
            
            // Clear any collaborative parameters first
            url.searchParams.delete('collab_owner');
            url.searchParams.delete('collab_permlink');
            
            // Set local document parameters (same pattern as collaborative)
            url.searchParams.set('local_owner', username);
            url.searchParams.set('local_permlink', permlink);
            
            // Update URL without triggering a page reload
            window.history.replaceState({}, '', url.toString());
            console.log('🔗 URL updated with local document parameters for refresh persistence');
        },
        
        // Call this when connecting to a collaborative document
        setCollabURLParams() {
            if (this.currentFile && this.currentFile.type === 'collaborative') {
                this.updateURLWithCollabParams(this.currentFile.owner, this.currentFile.permlink);
            }
        },
        
        // Clear all document URL parameters (collaborative and local)
        clearCollabURLParams() {
            const url = new URL(window.location);
            
            // Remove all document parameters (collaborative and local)
            url.searchParams.delete('collab_owner');
            url.searchParams.delete('collab_permlink');
            url.searchParams.delete('local_owner');
            url.searchParams.delete('local_permlink');
            
            // Update URL without triggering a page reload
            window.history.replaceState({}, '', url.toString());
            console.log('🧹 URL cleared of all document parameters');
        },
        
        // Clear only local document URL parameters
        clearLocalURLParams() {
            const url = new URL(window.location);
            
            // Remove only local document parameters
            url.searchParams.delete('local_owner');
            url.searchParams.delete('local_permlink');
            
            // Update URL without triggering a page reload
            window.history.replaceState({}, '', url.toString());
            console.log('🧹 Cleared local URL parameters');
        },
        
        async connectToCollaborationServer(serverDoc) {
            // TipTap Best Practice: Connect existing Y.js document to WebSocket provider
            console.log('🔗 Connecting existing Y.js document to collaboration server...', serverDoc);
            
            if (!this.ydoc) {
                throw new Error('No Y.js document available - this should not happen with offline-first approach');
            }
            
            const bundle = window.TiptapCollaboration?.default || window.TiptapCollaboration;
            const HocuspocusProvider = bundle.HocuspocusProvider?.default || bundle.HocuspocusProvider;
            
            if (!HocuspocusProvider) {
                throw new Error('HocuspocusProvider not available');
            }
            
            // Clean up any existing provider with null safety
            if (this.provider) {
                try {
                    if (this.provider.disconnect) {
                this.provider.disconnect();
                    }
                    if (this.provider.destroy) {
                this.provider.destroy();
                    }
                } catch (error) {
                    console.warn('⚠️ Error during provider cleanup:', error.message);
                }
                this.provider = null;
                }
                
                        // Build auth token and URL - use token-in-config as primary approach (proven to work better)
            const authToken = JSON.stringify({
                    account: this.authHeaders['x-account'],
                    signature: this.authHeaders['x-signature'],
                    challenge: this.authHeaders['x-challenge'],
                    pubkey: this.authHeaders['x-pubkey']
                });
            
            const baseUrl = 'wss://data.dlux.io/collaboration';
            const docPath = `${serverDoc.owner}/${serverDoc.permlink}`;
            
            console.log('🔗 WebSocket connection details:', {
                baseUrl,
                docPath,
                owner: serverDoc.owner,
                permlink: serverDoc.permlink,
                authTokenLength: authToken.length,
                primaryMethod: 'token-in-config'
            });
                
            // Wait a moment for server to be ready for WebSocket connections
            console.log('⏳ Waiting for server to be ready for WebSocket connections...');
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
            
            // PRIMARY APPROACH: Use token in config (proven to work reliably)
                const providerConfig = {
                url: `${baseUrl}/${docPath}`, // Clean URL without token
                name: docPath,
                token: authToken, // Token in config - this is the reliable method
                document: this.ydoc, // Connect existing Y.js document
                    connect: true,
                    timeout: 30000,
                    forceSyncInterval: 30000,
                maxMessageSize: 1024 * 1024,
                    onConnect: () => {
                        console.log('✅ Connected to collaboration server');
                        this.connectionStatus = 'connected';
                        this.connectionMessage = 'Connected - Real-time collaboration active';
                        
                        // ✅ TIPTAP BEST PRACTICE: Force sync of any pending Y.js config changes
                        console.log('🔄 Connection restored - Y.js will auto-sync any pending config changes');
                        if (this.ydoc) {
                            const config = this.ydoc.getMap('config');
                            const documentName = config.get('documentName');
                            if (documentName) {
                                console.log('📄 Pending document name will sync to cloud:', documentName);
                            }
                        }
                        
                        // IMMEDIATE: Set user awareness state as soon as connected
                        if (this.provider && this.provider.awareness) {
                            const userName = this.username || 'Anonymous' + Math.floor(Math.random() * 1000);
                            // Simple random color - Math.random my dude!
                            const userColor = '#' + Math.floor(Math.random()*16777215).toString(16);
                            const userData = { name: userName, color: userColor };
                            
                            console.log('🔍 DEBUG onConnect: Setting immediate awareness:', userData);
                            this.provider.awareness.setLocalState({ user: userData });
                            
                            // Force presence UI update
                            setTimeout(() => {
                                this.updatePresenceUI();
                            }, 100);
                        }
                    },
                    onDisconnect: ({ event }) => {
                    console.log('❌ Disconnected from collaboration server', {
                        code: event?.code,
                        reason: event?.reason,
                        wasClean: event?.wasClean
                    });
                    
                    // OFFLINE-FIRST FIX: Don't override intentional offline status
                    if (this.connectionStatus !== 'offline') {
                this.connectionStatus = 'disconnected';
                        this.connectionMessage = 'Disconnected from server';
                    }
                    
                    // Update editor permissions for offline editing
                    this.updateEditorPermissions();
                    },
                    onSynced: ({ synced }) => {
                    console.log('🔄 onSynced called:', { synced, isCollaborativeMode: this.isCollaborativeMode, connectionStatus: this.connectionStatus, hasUnsavedChanges: this.hasUnsavedChanges });
                    
                        // Execute document name extraction regardless of synced value (it can be undefined)
                        if (synced !== false) {
                            console.log('📡 Document synchronized');
                            this.connectionMessage = 'Connected - Document synchronized';
                        
                        // Reset unsaved changes flag for collaborative documents
                        if (this.isCollaborativeMode && this.connectionStatus === 'connected') {
                            console.log('💾 Clearing hasUnsavedChanges flag due to Y.js sync');
                            this.hasUnsavedChanges = false;
                        }
                        
                        if (this.saveAsProcess.inProgress) {
                            this.saveAsProcess.step = 'synced';
                            this.saveAsProcess.message = 'Document synced with server!';
                        }
                        
                        // ✅ TIPTAP BEST PRACTICE: Update document name from Y.js config after sync
                        console.log('🔄 onSynced: Attempting to extract document name...');
                        
                        // Load publish options from Y.js after sync
                        this.loadPublishOptionsFromYjs();
                        
                        // Load custom JSON from Y.js after sync
                        this.loadCustomJsonFromYjs();
                        
                        // CRITICAL FIX: Ensure permissions are loaded after sync
                        // This handles cases where permissions weren't set during initial conversion
                        if (this.currentFile?.type === 'collaborative' && this.currentFile?.owner === this.username) {
                            if (!Array.isArray(this.documentPermissions) || this.documentPermissions.length === 0) {
                                this.documentPermissions = [{
                                    account: this.username,
                                    permissionType: 'postable' // Owner has full permissions
                                }];
                                console.log('🔐 Owner permissions set during onSynced:', this.documentPermissions);
                            }
                        }
                        
                        // DEBUG: Check Y.js config state
                                                console.log('🔍 DEBUG onSynced conditions:', {
                            hasYdoc: !!this.ydoc,
                            hasCurrentFile: !!this.currentFile,
                            currentFileType: this.currentFile?.type,
                            isCollaborativeMode: this.isCollaborativeMode
                        });
                        
                        if (this.ydoc && this.isCollaborativeMode) {
                            try {
                                const config = this.ydoc.getMap('config');
                                const configKeys = Array.from(config.keys());
                                const documentName = config.get('documentName');
                                
                                console.log('🔍 DEBUG onSynced: Y.js config state:', {
                                    configKeys,
                                    documentName,
                                    currentFileName: this.currentFile?.name || 'null',
                                    hasCurrentFile: !!this.currentFile
                                });
                                
                                                        // Only proceed if we have a document name and currentFile exists
                        if (documentName && this.currentFile) {
                            const currentName = this.currentFile.name || '';
                            const ownerPermlink = `${this.currentFile.owner}/${this.currentFile.permlink}`;
                            
                            if (documentName !== currentName && documentName !== ownerPermlink) {
                                console.log('🚀 FAST: Document name found in Y.js config:', documentName);
                                
                                // Update current file and UI immediately using Vue-reactive object replacement
                                this.currentFile = {
                                    ...this.currentFile,
                                    name: documentName,
                                    title: documentName,
                                    documentName: documentName
                                };
                                
                                // Update currentDocumentInfo for template display
                                if (this.currentDocumentInfo) {
                                    this.currentDocumentInfo.title = documentName;
                                }
                                
                                console.log('✅ FAST: UI updated immediately with document name from Y.js config');
                                console.log('🔍 DEBUG: Updated values:', {
                                    currentFileName: this.currentFile.name,
                                    currentDocumentInfoTitle: this.currentDocumentInfo?.title
                                });
                                
                                // Force Vue reactivity update with nextTick to ensure DOM update
                                this.$nextTick(() => {
                                    this.$forceUpdate();
                                    console.log('🔄 Vue reactivity forced after nextTick');
                                });
                            } else {
                                console.log('📋 onSynced: Document name unchanged or matches current name');
                            }
                                } else if (!this.currentFile) {
                                    console.log('📋 onSynced: currentFile not ready yet, will retry with delay...');
                                    // Fallback: Try again with a short delay when currentFile is ready
                                    setTimeout(() => {
                                        console.log('🔄 DELAYED: Attempting document name extraction after currentFile ready...');
                                        this.updateDocumentNameFromContent();
                                    }, 200);
                                } else {
                                    console.log('📋 onSynced: No document name found in Y.js config');
                                    console.log('🔍 DEBUG: Current config contents:', {
                                        allConfigKeys: configKeys,
                                        documentNameValue: documentName,
                                        configSize: config.size
                                    });
                                }
                            } catch (error) {
                                console.error('❌ Error accessing Y.js config in onSynced:', error);
                                // Fallback to the original method with delay
                                setTimeout(() => {
                                    console.log('🔄 FALLBACK: Attempting document name extraction after error...');
                                    this.updateDocumentNameFromContent();
                                }, 200);
                            }
                        } else {
                            console.log('📋 onSynced: Not collaborative mode or Y.js not ready');
                        }
                    }
                },
                onError: ({ event }) => {
                    console.error('❌ WebSocket error:', {
                        event,
                        error: event?.error,
                        message: event?.message,
                        type: event?.type
                    });
                    },
                    onAuthenticationFailed: ({ reason }) => {
                        console.error('🔐 Authentication failed:', reason);
                    this.serverAuthFailed = true;
                        this.connectionStatus = 'disconnected';
                        this.connectionMessage = `Authentication failed: ${reason}`;
                    
                    if (reason === 'permission-denied') {
                        setTimeout(() => {
                            this.handleAuthenticationFailure();
                        }, 1000);
                    }
                },
                // CRITICAL: Add awareness event handlers for real-time presence
                onAwarenessUpdate: ({ states }) => {
                    console.log('👥 Awareness update received:', states.length, 'users');
                    console.log('🔍 DEBUG: Awareness update states:', states);
                    this.updatePresenceUI();
                },
                onAwarenessChange: ({ states }) => {
                    console.log('👥 Awareness change received:', states.length, 'users');
                    console.log('🔍 DEBUG: Awareness change states:', states);
                    this.updatePresenceUI();
                }
            };
            
            console.log('🔌 Creating HocuspocusProvider with token-in-config (primary method)...');
                this.provider = new HocuspocusProvider(providerConfig);
                
            // Add Y.js document update listener for more reliable sync detection
            if (this.ydoc) {
                this.ydoc.on('update', (update, origin) => {
                    // Only clear unsaved changes for updates that come from remote (not local)
                    // But don't clear if we're currently updating publish options locally
                    if (origin !== this.ydoc.clientID && this.isCollaborativeMode && this.connectionStatus === 'connected' && !this.isUpdatingPublishOptions) {
                        console.log('📡 Y.js remote update detected, clearing unsaved flag');
                        this.hasUnsavedChanges = false;
                        
                        // OPTIMIZATION: Check for document name updates in remote changes
                        if (this.currentFile?.type === 'collaborative') {
                            setTimeout(() => {
                                console.log('📡 Checking for document name after remote Y.js update...');
                                const configDocumentName = this.extractDocumentNameFromConfig();
                                if (configDocumentName && configDocumentName !== this.currentFile.name && 
                                    configDocumentName !== `${this.currentFile.owner}/${this.currentFile.permlink}`) {
                                    
                                    console.log('🚀 REMOTE UPDATE: Document name found in Y.js config:', configDocumentName);
                                    
                                    // Update current file and UI immediately
                                    this.currentFile.name = configDocumentName;
                                    this.currentFile.title = configDocumentName;
                                    this.currentFile.documentName = configDocumentName;
                                    
                                    // Update currentDocumentInfo for template display
                                    if (this.currentDocumentInfo) {
                                        this.currentDocumentInfo.title = configDocumentName;
                                    }
                                    
                                    console.log('✅ REMOTE UPDATE: UI updated with document name from Y.js config');
                                    
                                    // Force Vue reactivity update with nextTick to ensure DOM update
                                    this.$nextTick(() => {
                                        this.$forceUpdate();
                                        console.log('🔄 Remote update: Vue reactivity forced after nextTick');
                                    });
                                }
                            }, 100); // Small delay to ensure config is fully updated
                        }
                    }
                });
            }
                    
            // Wait for connection with optimized retry logic
            let retries = 0;
            const maxRetries = 20; // Reduced since primary method should work faster
            let connectionSuccess = false;
            
            console.log('⏳ Waiting for WebSocket connection...');
            while (!connectionSuccess && retries < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 500));
                retries++;
                
                // Check multiple connection states with null safety
                const wsReady = this.provider?.ws?.readyState === WebSocket.OPEN;
                const statusConnected = this.connectionStatus === 'connected';
                
                if (wsReady || statusConnected) {
                    this.connectionStatus = 'connected';
                    connectionSuccess = true;
                    console.log('✅ WebSocket connected successfully');
                    
                    // CRITICAL: Set awareness state immediately upon connection detection
                    if (this.provider && this.provider.awareness) {
                        const userName = this.username || 'Anonymous' + Math.floor(Math.random() * 1000);
                        // Simple random color - Math.random my dude!
                        const userColor = '#' + Math.floor(Math.random()*16777215).toString(16);
                        const userData = { name: userName, color: userColor };
                        
                        console.log('🔍 DEBUG: Setting awareness immediately after connection:', userData);
                        console.log('🔍 DEBUG: this.username =', JSON.stringify(this.username));
                        console.log('🔍 DEBUG: userColor =', userColor);
                        
                        try {
                            this.provider.awareness.setLocalState({ user: userData });
                            console.log('✅ Awareness state set successfully');
                            
                            // Verify it was set
                            const localState = this.provider.awareness.getLocalState();
                            console.log('🔍 DEBUG: Local state after setting:', localState);

            } catch (error) {
                            console.error('❌ Error setting awareness state:', error);
                        }
                    } else {
                        console.error('❌ Provider or awareness not available for setting user state');
                    }
                    
                    break;
                                }
                                
                // Log progress every 2 seconds
                if (retries % 4 === 0) {
                    console.log(`⏳ Connection attempt ${retries}/${maxRetries} - WebSocket state: ${this.provider?.ws?.readyState}, Status: ${this.connectionStatus}`);
                    }
                
                // Try fallback authentication approach after half the retries
                if (retries === Math.floor(maxRetries / 2) && !connectionSuccess) {
                    console.log('🔄 Trying fallback authentication approach...');
                            
                    // Clean up current provider
                    if (this.provider) {
                        this.provider.disconnect();
                        this.provider.destroy();
                    }
                    
                    // FALLBACK: Try with token in URL instead of config
                    const wsUrlWithToken = `${baseUrl}/${docPath}?token=${encodeURIComponent(authToken)}`;
                    const fallbackConfig = {
                        ...providerConfig,
                        url: wsUrlWithToken, // Token in URL as fallback
                        // Remove token from config
                    };
                    delete fallbackConfig.token;
                
                    console.log('🔗 Trying fallback connection with token in URL...');
                    this.provider = new HocuspocusProvider(fallbackConfig);
                }
            }
            
            if (!connectionSuccess) {
                // More detailed error information
                const errorDetails = {
                    wsState: this.provider?.ws?.readyState,
                    wsUrl: this.provider?.ws?.url,
                    providerStatus: this.provider?.status,
                    connectionStatus: this.connectionStatus,
                    maxRetries,
                    totalWaitTime: (maxRetries * 0.5) + 's'
                };
                console.error('❌ Connection failed with details:', errorDetails);
                throw new Error(`Failed to connect to collaboration server after ${(maxRetries * 0.5)}s - WebSocket state: ${errorDetails.wsState}`);
                    }
                    
            console.log('✅ Existing Y.js document successfully connected to collaboration server');
            
            // Update URL with collaboration parameters for refresh persistence
            this.setCollabURLParams();
            
            // IMMEDIATE: Trigger collaborative features setup
            if (this.provider && this.connectionStatus === 'connected') {
                console.log('🎯 Setting up collaborative features...');
                
                // Force presence UI update
                setTimeout(() => {
                    this.updatePresenceUI();
                }, 200);
                
                // TIPTAP BEST PRACTICE: Don't add CollaborationCursor dynamically
                // This would require destroying and recreating editors, violating offline-first principle
                // CollaborationCursor should be included when editors are initially created with provider
                if (this.currentFile?.type === 'collaborative') {
                    console.log('🎯 Skipping dynamic CollaborationCursor addition to preserve editors');
                    console.log('💡 Cursor functionality available only for documents loaded with initial connection');
                }
            }
        },
        
        // TIPTAP BEST PRACTICE: WebSocket-only disconnect (preserves Y.js document and editors)
        disconnectWebSocketOnly() {
            console.log('🔌 Disconnecting WebSocket only (preserving Y.js document and editors)...');
            
            // Only disconnect WebSocket provider, keep everything else intact
            if (this.provider) {
                console.log('🔌 Disconnecting WebSocket provider...');
                this.provider.disconnect();
                this.provider.destroy();
                this.provider = null;
            }
            
            // Keep Y.js document intact for offline editing
            // Keep IndexedDB persistence active  
            // Keep editors running for continued editing
            
            // Update connection status
            this.connectionStatus = 'offline';
            this.connectionMessage = 'Working offline - changes saved locally';
            
            console.log('✅ WebSocket disconnected - Y.js document and editors preserved for offline editing');
        },
        
        disconnectCollaboration() {
            console.log('🔌 Disconnecting collaboration (offline-first approach)...');
            
            // OFFLINE-FIRST FIX: Only disconnect WebSocket, keep Y.js document and editors intact
            // This allows continued offline editing with IndexedDB persistence
            
            // Use the WebSocket-only disconnect method
            this.disconnectWebSocketOnly();
            
            // Update editor permissions for offline editing
            console.log('🔐 Updating editor permissions for offline mode');
            this.updateEditorPermissions();
            
            // IMPORTANT: Clear collaborative URL parameters to prevent auto-reconnect on refresh
            this.clearCollabURLParams();
            
            // Clear global instance tracking if this is the active instance
            if (window.dluxCollaborativeInstance === this.componentId) {
                window.dluxCollaborativeInstance = null;
                window.dluxCollaborativeCleanup = null;
                console.log('🧹 Cleared global collaborative instance tracking');
            }
            
            // Reset initialization flag
            this.isInitializing = false;
            
            console.log('✅ Collaboration disconnected - document remains editable offline');
        },
        
        // Full cleanup method for when actually switching/closing documents
        fullCleanupCollaboration() {
            console.log('🧹 Full collaboration cleanup (switching documents)...');
            
            // Use the unified cleanup method to prevent transaction mismatch errors
            this.cleanupCurrentDocument();
            
            // Clear global instance tracking if this is the active instance
            if (window.dluxCollaborativeInstance === this.componentId) {
                window.dluxCollaborativeInstance = null;
                window.dluxCollaborativeCleanup = null;
                console.log('🧹 Cleared global collaborative instance tracking');
            }
            
            // Reset initialization flag
            this.isInitializing = false;
            
            console.log('✅ Full collaboration cleanup completed');
        },
        
        // Clean up DOM elements completely to prevent conflicts
        cleanupDOMElements() {
            console.log('🧽 Cleaning up DOM elements...');
            
            const elementsToClean = [
                { ref: 'titleEditor', name: 'title', className: 'title-editor' },
                { ref: 'permlinkEditor', name: 'permlink', className: 'permlink-editor' }, 
                { ref: 'bodyEditor', name: 'body', className: 'body-editor' }
            ];
            
            elementsToClean.forEach(({ ref, name, className }) => {
                // Use both Vue ref and direct DOM selection as fallback
                let element = this.$refs[ref];
                if (!element) {
                    element = document.querySelector(`.${className}`);
                }
                
                if (element) {
                    try {
                        // Clear all content and attributes
                        element.innerHTML = '';
                        
                        // Reset to original classes
                        element.className = className;
                        
                        // Remove any TipTap-specific attributes
                        const proseMirrorAttrs = [
                            'contenteditable', 'data-testid', 'spellcheck', 'translate',
                            'data-gramm', 'data-gramm_editor', 'data-enable-grammarly'
                        ];
                        proseMirrorAttrs.forEach(attr => {
                            element.removeAttribute(attr);
                        });
                        
                        // Remove any ProseMirror-specific classes
                        element.classList.remove('ProseMirror', 'ProseMirror-focused');
                        
                        // Force a style reset
                        element.style.cssText = '';
                        
                        console.log(`✅ Cleaned up ${name} editor DOM element`);
                    } catch (error) {
                        console.warn(`Error cleaning up ${name} editor DOM:`, error);
                    }
                }
            });
            
            // Force Vue to update refs
            this.$forceUpdate();
        },
        
        // Reconnect to collaborative document (wrapper for connect button)
        async reconnectToCollaborativeDocument() {
            if (!this.currentFile || this.currentFile.type !== 'collaborative') {
                console.error('Cannot reconnect: no collaborative document loaded');
                return;
            }

            try {
                console.log('🔄 Reconnecting to collaborative document...');
                
                // TIPTAP BEST PRACTICE: Only recreate WebSocket connection, preserve Y.js document
                console.log('🔌 Recreating WebSocket connection (preserving Y.js document and editors)...');
                
                // Disconnect existing WebSocket provider only
                this.disconnectWebSocketOnly();
                
                // TIPTAP BEST PRACTICE: Never destroy editors on reconnection
                // Reconnection should ONLY recreate WebSocket provider, preserve everything else
                if (!this.ydoc) {
                    console.error('❌ CRITICAL: Y.js document missing during reconnection - this should not happen');
                    console.log('🚨 Reconnection failed: collaborative document state corrupted');
                    throw new Error('Cannot reconnect: Y.js document missing. Please reload the document.');
                } else {
                    console.log('✅ Y.js document exists - reusing for reconnection (editors preserved)');
                }
                
                // Set connecting status
                this.connectionStatus = 'connecting';
                this.connectionMessage = 'Reconnecting to server...';
                
                // Connect to the server (this will create a new WebSocket provider)
                await this.connectToCollaborationServer(this.currentFile);
                
                // TIPTAP BEST PRACTICE: Restore URL parameters after successful reconnection
                this.updateURLWithCollabParams(this.currentFile.owner, this.currentFile.permlink);
                console.log('🔗 URL parameters restored after successful reconnection');
                
                console.log('✅ Successfully reconnected to collaborative document');
                
            } catch (error) {
                console.error('❌ Failed to reconnect:', error);
                this.connectionStatus = 'offline';
                this.connectionMessage = 'Reconnection failed - working offline';
                alert(`Failed to connect to collaborative document:\n\n${error.message}`);
            }
        },
        
        // Connection handlers
        onConnect() {
            this.connectionStatus = 'connected';
            this.connectionMessage = 'Connected - Real-time collaboration active';
            
            // COMPREHENSIVE SOLUTION: Track user presence and add to collaborative authors
            if (this.authHeaders?.['x-account']) {
                const userInfo = {
                    username: this.authHeaders['x-account'],
                    color: this.getUserColor,
                    connectedAt: new Date().toISOString()
                };
                this.trackUserPresence(userInfo);
                console.log('👤 Tracked user presence on connect:', userInfo.username);
            }
            
            // 🔗 PERMISSION INFERENCE: If user can connect via WebSocket, they have access
            // This handles cases where REST API permissions fail but WebSocket works
            if (this.currentFile?.type === 'collaborative' && 
                (!this.documentPermissions || this.documentPermissions.length === 0)) {
                console.log('🔗 WebSocket connected successfully - inferring permissions from connection');
                
                const inferredPermissions = [{
                    account: this.currentFile.owner,
                    permissionType: 'postable', // Owner always has full access
                    grantedBy: this.currentFile.owner,
                    grantedAt: new Date().toISOString()
                }];
                
                // If user is not the owner but can connect, they have at least some access
                if (this.username !== this.currentFile.owner) {
                    inferredPermissions.push({
                        account: this.username,
                        permissionType: 'editable', // Conservative but reasonable assumption
                        grantedBy: this.currentFile.owner,
                        grantedAt: new Date().toISOString(),
                        source: 'inferred-from-websocket-success'
                    });
                    console.log('🔗 Non-owner connected successfully - assuming editable permissions');
                }
                
                this.documentPermissions = inferredPermissions;
                console.log('✅ Permissions inferred from successful WebSocket connection');
                
                // Update editor permissions immediately
                this.updateEditorPermissions();
            }

            // TIPTAP BEST PRACTICE: Update URL with collaboration parameters when connected
            if (this.currentFile?.type === 'collaborative' && this.currentFile.owner && this.currentFile.permlink) {
                this.updateURLWithCollabParams(this.currentFile.owner, this.currentFile.permlink);
                console.log('🔗 URL updated with collaboration parameters on connection');
            }

            // 🎯 TipTap Best Practice: Add CollaborationCursor when provider connects
            // This follows the offline-first collaborative architecture pattern
            console.log('🔍 DEBUG onConnect: provider exists:', !!this.provider);
            console.log('🔍 DEBUG onConnect: currentFile type:', this.currentFile?.type);
            console.log('🔍 DEBUG onConnect: isCollaborativeMode:', this.isCollaborativeMode);
            
            // TIPTAP BEST PRACTICE: Never destroy editors during reconnection
            // CollaborationCursor should be included when editors are initially created
            // Dynamic addition of cursor extension requires editor destruction which violates offline-first
            if (this.provider && this.currentFile?.type === 'collaborative') {
                console.log('🎯 WebSocket connected - CollaborationCursor should already be present in editors');
                console.log('⚠️ Skipping dynamic cursor addition to preserve editors during reconnection');
                
                // Instead, just update awareness state directly
                if (this.provider.awareness) {
                    const userName = this.username || 'Anonymous' + Math.floor(Math.random() * 1000);
                    const userColor = '#' + Math.floor(Math.random()*16777215).toString(16);
                    const userData = { name: userName, color: userColor };
                    
                    console.log('👥 Setting awareness state without destroying editors:', userData);
                    this.provider.awareness.setLocalState({ user: userData });
                    
                    // Update presence UI
                    setTimeout(() => {
                        this.updatePresenceUI();
                    }, 100);
                }
            } else {
                console.log('⚠️ Skipping CollaborationCursor - conditions not met');
            }
        },
        
        onDisconnect() {
            this.connectionStatus = 'disconnected';
            this.connectionMessage = 'Disconnected from server';
            
            // TIPTAP BEST PRACTICE: Clear URL parameters when disconnected (unless intentionally offline)
            // This prevents auto-reconnect attempts when user refreshes during disconnection
            if (this.connectionStatus !== 'offline') {
                this.clearCollabURLParams();
                console.log('🔗 URL parameters cleared due to disconnection');
            }
            
            // OFFLINE-FIRST FIX: Update editor permissions when going offline
            // This ensures editors become editable in offline mode
            console.log('🔐 Connection lost - updating editor permissions for offline editing');
            this.updateEditorPermissions();
        },
        
        onSynced() {
            console.log('📡 Document synced with server');
            this.connectionMessage = 'Connected - Document synchronized';
            
            // TIPTAP BEST PRACTICE: Initialize content only once using onSynced callback
            if (this.ydoc && !this.ydoc.getMap('config').get('initialContentLoaded')) {
                console.log('🔄 Setting initial content flag in Y.js document...');
                this.ydoc.getMap('config').set('initialContentLoaded', true);
                
                // PRESERVE DOCUMENT TITLE: Ensure title doesn't get overwritten by Y.js sync
                if (this.currentDocumentInfo && this.currentDocumentInfo.title && this.titleEditor) {
                    const currentTitleContent = this.titleEditor.getHTML();
                    // If title editor is empty or contains path-like content, restore proper title
                    if (!currentTitleContent || 
                        currentTitleContent === '<p></p>' || 
                        currentTitleContent.includes('/user/') ||
                        currentTitleContent.includes('tech')) {
                        console.log('🔄 Restoring proper document title after Y.js sync:', this.currentDocumentInfo.title);
                        this.titleEditor.commands.setContent(this.currentDocumentInfo.title);
                        this.content.title = this.currentDocumentInfo.title;
                    }
                }
                
                // If this is a new document and we have local content, set it
                if (this.titleEditor && this.bodyEditor) {
                    const titleContent = this.titleEditor.getHTML();
                    const bodyContent = this.bodyEditor.getHTML();
                    
                    // Only set content if editors are empty and we have preserved content
                    if ((!titleContent || titleContent === '<p></p>') && 
                        (!bodyContent || bodyContent === '<p></p>')) {
                        console.log('📝 Initializing empty collaborative document with default content');
                        // Let the document remain empty for collaborative editing
                    }
                }
            }
            
            // Reset unsaved changes flag for collaborative documents
            if (this.isCollaborativeMode && this.connectionStatus === 'connected') {
                this.hasUnsavedChanges = false;
                console.log('💾 Collaborative document auto-saved via Y.js sync');
            }
        },
        
        onAuthenticationFailed(reason) {
            this.connectionStatus = 'disconnected';
            this.connectionMessage = `Authentication failed: ${reason}`;
        },
        
        // Content management
        getEditorContent() {
            // ONLY read from editors when explicitly requested - like clean.html
            return {
                title: this.titleEditor ? this.titleEditor.getText() : this.content.title,
                titleHTML: this.titleEditor ? this.titleEditor.getHTML() : '',
                body: this.bodyEditor ? this.bodyEditor.getText() : this.content.body,
                bodyHTML: this.bodyEditor ? this.bodyEditor.getHTML() : this.content.body,
                permlink: this.permlinkEditor ? this.permlinkEditor.getText() : this.content.permlink,
                tags: this.content.tags,
                custom_json: this.content.custom_json,
                beneficiaries: this.publishForm.beneficiaries,
                commentOptions: this.commentOptions // Include comment options for local storage
            };
        },
        
        // FIXED: Add missing setEditorContent method
        setEditorContent(content) {
            try {
                console.log('📝 Setting editor content...');
                
                // TIPTAP BEST PRACTICE: Don't set content on collaborative editors that are already synced
                // This prevents "mismatched transaction" errors when Y.js is managing the content
                if (this.isCollaborativeMode && this.connectionStatus === 'connected') {
                    console.log('⚠️ Skipping setEditorContent for connected collaborative editors (Y.js manages content)');
                    
                    // Only update local content state for UI consistency
                    this.content = { ...this.content, ...content };
                    return;
                }
                
                // TIPTAP BEST PRACTICE: Check if editors exist and are ready before setting content
                if (this.titleEditor && content.title && this.titleEditor.commands) {
                    // PREVENT TITLE OVERWRITE: Don't set title if it looks like a path/tech ID
                    const isPathLikeTitle = content.title.includes('/user/') || 
                                          content.title.includes('tech') || 
                                          content.title.startsWith('/');
                    
                    if (!isPathLikeTitle) {
                    // Use insertContent for Y.js editors to avoid transaction conflicts
                    if (this.ydoc) {
                        this.titleEditor.commands.insertContent(content.title);
                    } else {
                        this.titleEditor.commands.setContent(content.title);
                        }
                    } else {
                        console.warn('⚠️ Prevented setting path-like title:', content.title);
                        // Use the preserved document title instead
                        if (this.currentDocumentInfo && this.currentDocumentInfo.title) {
                            const properTitle = this.currentDocumentInfo.title;
                            console.log('🔄 Using preserved document title instead:', properTitle);
                            if (this.ydoc) {
                                this.titleEditor.commands.insertContent(properTitle);
                            } else {
                                this.titleEditor.commands.setContent(properTitle);
                            }
                            content.title = properTitle; // Update the content object too
                        }
                    }
                }
                
                // Set body content
                if (this.bodyEditor && content.body && this.bodyEditor.commands) {
                    // Use insertContent for Y.js editors to avoid transaction conflicts
                    if (this.ydoc) {
                        this.bodyEditor.commands.insertContent(content.body);
                    } else {
                        this.bodyEditor.commands.setContent(content.body);
                    }
                }
                
                // Set permlink content (always basic editor, no Y.js)
                if (this.permlinkEditor && content.permlink && this.permlinkEditor.commands) {
                    this.permlinkEditor.commands.setContent(content.permlink);
                }
                        
                // Update local content state
                this.content = { ...this.content, ...content };
                
                console.log('✅ Editor content set successfully');
                
            } catch (error) {
                console.error('❌ Error setting editor content:', error);
                console.log('🔍 Debug info:', {
                    isCollaborativeMode: this.isCollaborativeMode,
                    connectionStatus: this.connectionStatus,
                    hasYdoc: !!this.ydoc,
                    titleEditorExists: !!this.titleEditor,
                    bodyEditorExists: !!this.bodyEditor
                });
            }
        },
        
        clearEditor() {
            try {
                console.log('🧹 Clearing editor content (Y.js safe method)...');
                
                // CRITICAL: Never manipulate Y.js fragments directly during editor lifecycle
                // This causes transaction mismatch errors - let TipTap handle content clearing
                
                if (this.titleEditor && this.titleEditor.commands) {
                    this.titleEditor.commands.clearContent();
                }
                if (this.bodyEditor && this.bodyEditor.commands) {
                    this.bodyEditor.commands.clearContent();
                }
                if (this.permlinkEditor && this.permlinkEditor.commands) {
                    this.permlinkEditor.commands.clearContent();
                }
                
                // Only clear local content state - Y.js will sync automatically
                this.content = {
                    title: '',
                    body: '',
                    tags: [],
                    custom_json: {},
                    permlink: '',
                    beneficiaries: []
                };
                
                console.log('✅ Editor content cleared successfully (TipTap best practice)');
                
            } catch (error) {
                console.error('❌ Error clearing editor content:', error);
                
                // Fallback: just clear the local content state
                this.content = {
                    title: '',
                    body: '',
                    tags: [],
                    custom_json: {},
                    permlink: '',
                    beneficiaries: []
                };
                
                console.log('🔄 Used fallback content clearing');
            }
        },
        
        updateContent() {
            // Update content from editors
            if (this.titleEditor) {
                this.content.title = this.titleEditor.getText();
            }
            if (this.permlinkEditor) {
                this.content.permlink = this.permlinkEditor.getText();
            }
            if (this.bodyEditor) {
                this.content.body = this.bodyEditor.getHTML();
            }
            
            // Emit content changes to parent
            this.$emit('content-changed', {
                ...this.content,
                beneficiaries: this.publishForm.beneficiaries,
                attachedFiles: this.attachedFiles
            });
        },
        
        // ✅ TIPTAP BEST PRACTICE: Unified auto-save for ALL documents (local + collaborative)
        async performAutoSave() {
            console.log('💾 Performing unified auto-save (TipTap best practice)...');
            
            try {
                // ✅ STEP 1: Y.js + IndexedDB automatically saves content - no manual intervention needed
                if (this.ydoc && this.indexeddbProvider) {
                    console.log('✅ Content automatically persisted to IndexedDB via Y.js');
                }
                
                // ✅ STEP 2: Update Y.js config metadata for ALL documents (unified approach)
                if (this.ydoc && this.currentFile) {
                    await this.updateYjsConfigMetadata();
                }
                
                // ✅ STEP 3: Update local file index for ALL documents (unified approach)
                if (this.currentFile) {
                    await this.updateLocalFileIndex();
                    
                    // Refresh file list to show updated metadata
                    await this.loadLocalFiles();
                }
                
                // ✅ STEP 4: For temp documents, convert to real documents
                if (this.ydoc && this.hasContentToSave()) {
                    // For temp documents, this will create the draft and change isTemporaryDocument to false
                    await this.ensureLocalFileEntry();
                    
                    // If this was a temp document, it's now a real document
                    if (this.isTemporaryDocument && this.currentFile) {
                        this.isTemporaryDocument = false;
                        console.log('📝 Temp document converted to draft:', this.currentFile.name);
                    }
                }
                
                // ✅ STEP 5: Emit content changes to parent
                this.updateContent();
                
                // ✅ STEP 6: Clear unsaved changes indicator with proper timing
                this.clearUnsavedAfterSync();
                
                console.log('✅ Unified auto-save completed for:', this.currentFile?.type || 'unknown');
                
            } catch (error) {
                console.error('❌ Auto-save failed:', error);
                // Still clear the unsaved flag even if save failed
                this.hasUnsavedChanges = false;
            }
        },
        
        // ✅ TIPTAP BEST PRACTICE: Extract document metadata from Y.js config (unified loading)
        extractDocumentMetadataFromConfig() {
            if (!this.ydoc) return null;
            
            try {
                const config = this.ydoc.getMap('config');
                
                const metadata = {
                    documentName: config.get('documentName'),
                    lastModified: config.get('lastModified'),
                    documentType: config.get('documentType'),
                    documentId: config.get('documentId'),
                    owner: config.get('owner'),
                    permlink: config.get('permlink')
                };
                
                // Only return if we have meaningful metadata
                if (metadata.documentName || metadata.documentId) {
                    console.log('📄 Extracted document metadata from Y.js config:', metadata);
                    return metadata;
                }
                
            } catch (error) {
                console.warn('⚠️ Could not extract document metadata from Y.js config:', error.message);
            }
            
            return null;
        },
        
        // ✅ TIPTAP BEST PRACTICE: Update Y.js config metadata for ALL documents
        async updateYjsConfigMetadata() {
            if (!this.ydoc || !this.currentFile) return;
            
            try {
                console.log('📄 Updating Y.js config metadata (unified approach)...');
                
                const config = this.ydoc.getMap('config');
                
                // ✅ UNIFIED: Store document name in Y.js config for ALL documents
                if (this.currentFile.name) {
                    config.set('documentName', this.currentFile.name);
                    
                    // ✅ TIPTAP DEBUG: Check cloud sync status for document name changes
                    const hasWebSocketProvider = !!this.provider;
                    const isConnected = this.connectionStatus === 'connected';
                    console.log('📄 Document name stored in Y.js config:', {
                        documentName: this.currentFile.name,
                        documentType: this.currentFile.type,
                        hasWebSocketProvider,
                        isConnected,
                        connectionStatus: this.connectionStatus,
                        willSyncToCloud: hasWebSocketProvider && isConnected
                    });
                    
                    if (hasWebSocketProvider && isConnected) {
                        console.log('☁️ Document name change will auto-sync to cloud via WebSocket provider');
                    } else if (hasWebSocketProvider && !isConnected) {
                        console.log('⏳ Document name change will sync to cloud when connection is restored');
                    } else {
                        console.log('💾 Document name change will remain local-only (no WebSocket provider)');
                    }
                }
                
                // ✅ UNIFIED: Store document metadata in Y.js config
                config.set('lastModified', new Date().toISOString());
                config.set('documentType', this.currentFile.type || 'local');
                config.set('documentId', this.currentFile.id);
                
                // ✅ UNIFIED: Store collaborative metadata if applicable
                if (this.currentFile.type === 'collaborative') {
                    if (this.currentFile.owner) config.set('owner', this.currentFile.owner);
                    if (this.currentFile.permlink) config.set('permlink', this.currentFile.permlink);
                }
                
                console.log('✅ Y.js config metadata updated:', {
                    documentName: this.currentFile.name,
                    documentType: this.currentFile.type,
                    documentId: this.currentFile.id
                });
                
            } catch (error) {
                console.error('❌ Failed to update Y.js config metadata:', error);
            }
        },
        
        // Helper method to check if there's content worth saving
        hasContentToSave() {
            const titleContent = this.titleEditor?.getText()?.trim() || '';
            const bodyContent = this.bodyEditor?.getText()?.trim() || '';
            
            // FIXED: Check metadata from the correct sources
            const tags = this.getTags() || [];
            const beneficiaries = this.getBeneficiaries() || [];
            const customJson = this.getCustomJson() || {};
            const publishOptions = this.getPublishOptions() || {};
            
            const hasMetadata = tags.length > 0 || 
                               beneficiaries.length > 0 ||
                               Object.keys(customJson).length > 0 ||
                               Object.keys(publishOptions).length > 0;
            
            return titleContent.length > 0 || bodyContent.length > 0 || hasMetadata;
        },
        


        // TIPTAP BEST PRACTICE: Restore preserved content after Y.js editor creation
        restorePreservedContent(field, editor) {
            try {
                if (!this.ydoc || !editor) return;
                
                const preservedContent = this.ydoc.getMap('config').get('preservedContent');
                if (!preservedContent) return;
                
                let contentToRestore = null;
                if (field === 'title' && preservedContent.title) {
                    contentToRestore = preservedContent.title;
                } else if (field === 'body' && preservedContent.body) {
                    contentToRestore = preservedContent.body;
                } else if (field === 'permlink' && preservedContent.permlink) {
                    contentToRestore = preservedContent.permlink;
                }
                
                if (contentToRestore && contentToRestore !== '<p></p>' && contentToRestore.trim() !== '') {
                    // Use a timeout to ensure the Y.js editor is fully ready
                    setTimeout(() => {
                        try {
                            // ✅ TIPTAP BEST PRACTICE: Use editor methods instead of direct Y.js fragment access
                            const currentContent = editor.getText().trim();
                            if (!currentContent || currentContent === '') {
                                // TIPTAP BEST PRACTICE: Use insertContent instead of setContent for Y.js
                                editor.commands.insertContent(contentToRestore);
                                console.log(`✅ Restored preserved ${field} content:`, contentToRestore.substring(0, 50) + '...');
                                
                                // Clear the preserved content after successful restoration
                                const config = this.ydoc.getMap('config');
                                const currentPreserved = config.get('preservedContent') || {};
                                delete currentPreserved[field];
                                config.set('preservedContent', currentPreserved);
                            }
                        } catch (error) {
                            console.error(`❌ Failed to restore ${field} content:`, error);
                        }
                    }, 200); // Give Y.js time to fully initialize
                }
            } catch (error) {
                console.error(`❌ Error in restorePreservedContent for ${field}:`, error);
            }
        },

        // Debounce utility function

        
        // Utility methods
        generateUserColor(username) {
            let hash = 0;
            for (let i = 0; i < username.length; i++) {
                hash = username.charCodeAt(i) + ((hash << 5) - hash);
            }
            const hue = Math.abs(hash) % 360;
            return `hsl(${hue}, 70%, 60%)`;
        },

        // Status indicator styling methods (matching autosave banner style)
        getStatusStyle(state) {
            const styles = {
                // Temp documents (not yet drafts) - grey background
                'temp-editing': 'background: rgba(108, 117, 125, 0.1); border-left: 3px solid #6c757d;', // Grey for temp editing
                'temp-ready': 'background: rgba(108, 117, 125, 0.1); border-left: 3px solid #6c757d;', // Grey for temp ready
                'initializing': 'background: rgba(108, 117, 125, 0.1); border-left: 3px solid #6c757d;', // Grey for initializing
                'cleaning-up': 'background: rgba(108, 117, 125, 0.1); border-left: 3px solid #6c757d;', // Grey for cleanup
                'no-document': 'background: rgba(108, 117, 125, 0.1); border-left: 3px solid #6c757d;', // Grey for no document
                
                // Local documents (dotted cloud) - proper color coding for save states
                'saving-local': 'background: rgba(255, 193, 7, 0.1); border-left: 3px solid #ffc107;', // Orange for changes
                'saved-local': 'background: rgba(13, 202, 240, 0.1); border-left: 3px solid #0dcaf0;', // Blue for locally saved
                
                // Collaborative documents offline mode
                'offline-saving': 'background: rgba(255, 193, 7, 0.1); border-left: 3px solid #ffc107;', // Orange for changes
                'offline-ready': 'background: rgba(13, 202, 240, 0.1); border-left: 3px solid #0dcaf0;', // Blue for offline ready
                'unsynced-changes': 'background: rgba(255, 193, 7, 0.1); border-left: 3px solid #ffc107;', // Orange for unsynced
                'offline': 'background: rgba(13, 202, 240, 0.1); border-left: 3px solid #0dcaf0;', // Blue for offline
                
                // Collaborative documents online mode
                'connecting': 'background: rgba(13, 110, 253, 0.1); border-left: 3px solid #0d6efd;', // Blue for connecting
                'syncing': 'background: rgba(255, 193, 7, 0.1); border-left: 3px solid #ffc107;', // Orange for syncing
                'collaborating': 'background: rgba(25, 135, 84, 0.1); border-left: 3px solid #198754;', // Green for collaborating
                'synced': 'background: rgba(25, 135, 84, 0.1); border-left: 3px solid #198754;', // Green for synced
                
                // Error states
                'error': 'background: rgba(220, 53, 69, 0.1); border-left: 3px solid #dc3545;', // Red for errors
                'unknown': 'background: rgba(108, 117, 125, 0.1); border-left: 3px solid #6c757d;' // Grey for unknown
            };
            return styles[state] || styles.unknown;
        },

        getStatusIconClass(state) {
            const icons = {
                // Temp documents (not yet drafts)
                'temp-editing': 'fas fa-edit text-muted', // Grey edit icon for temp editing
                'temp-ready': 'fas fa-file-alt text-muted', // Grey file icon for temp ready
                'initializing': 'fas fa-circle-notch fa-spin text-muted', // Grey spinner for initializing
                'cleaning-up': 'fas fa-broom text-muted', // Grey broom icon for cleanup
                'no-document': 'fas fa-file text-muted', // Grey file icon for no document
                
                // Local documents (dotted cloud)
                'saving-local': 'fas fa-circle-notch fa-spin text-warning', // Orange spinner for saving
                'saved-local': 'fas fa-check text-info', // Blue check for locally saved
                
                // Collaborative documents offline mode
                'offline-saving': 'fas fa-circle-notch fa-spin text-warning', // Orange spinner for saving
                'offline-ready': 'fas fa-hard-drive text-info', // Blue hard drive for offline ready
                'unsynced-changes': 'fas fa-exclamation-triangle text-warning', // Orange warning for unsynced
                'offline': 'fas fa-wifi-slash text-info', // Blue wifi slash for offline
                
                // Collaborative documents online mode
                'connecting': 'fas fa-circle-notch fa-spin text-primary', // Blue spinner for connecting
                'syncing': 'fas fa-sync fa-spin text-warning', // Orange sync for syncing
                'collaborating': 'fas fa-users text-success', // Green users for collaborating
                'synced': 'fas fa-cloud text-success', // Green cloud for synced
                
                // Error states
                'error': 'fas fa-exclamation-circle text-danger', // Red error icon
                'unknown': 'fas fa-question-circle text-muted' // Grey question for unknown
            };
            return icons[state] || icons.unknown;
        },

        getStatusTextClass(state) {
            const textClasses = {
                // Temp documents (not yet drafts)
                'temp-editing': 'text-muted', // Grey text for temp editing
                'temp-ready': 'text-muted', // Grey text for temp ready
                'initializing': 'text-muted', // Grey text for initializing
                'cleaning-up': 'text-muted', // Grey text for cleanup
                'no-document': 'text-muted', // Grey text for no document
                
                // Local documents (dotted cloud)
                'saving-local': 'text-warning', // Orange text for saving
                'saved-local': 'text-info', // Blue text for locally saved
                
                // Collaborative documents offline mode
                'offline-saving': 'text-warning', // Orange text for saving
                'offline-ready': 'text-info', // Blue text for offline ready
                'unsynced-changes': 'text-warning', // Orange text for unsynced
                'offline': 'text-info', // Blue text for offline
                
                // Collaborative documents online mode
                'connecting': 'text-primary', // Blue text for connecting
                'syncing': 'text-warning', // Orange text for syncing
                'collaborating': 'text-success', // Green text for collaborating
                'synced': 'text-success', // Green text for synced
                
                // Error states
                'error': 'text-danger', // Red text for errors
                'unknown': 'text-muted' // Grey text for unknown
            };
            return textClasses[state] || textClasses.unknown;
        },

        // Handle status actions safely
        handleStatusAction(action) {
            if (action.actionType === 'reconnect') {
                this.reconnectToCollaborativeDocument();
            }
        },


        
        async confirmUnsavedChanges() {
            return confirm('You have unsaved changes. Are you sure you want to continue?');
        },
        
        formatFileDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        },
        
        formatFileSize(bytes) {
            return methodsCommon.fancyBytes(bytes);
        },
        
        // Document history and diff functionality
        async loadDocumentHistory() {
            console.log('📚 Document history feature not yet implemented');
            // Future: Integrate with Y.js document history or server-side versioning
        },
        
        async showDiff() {
            console.log('🔍 Document diff feature not yet implemented');
            // Future: Show differences between document versions
        },
        
        toggleDropdown(name) {
            this.dropdownOpen = {
                ...this.dropdownOpen,
                [name]: !this.dropdownOpen[name]
            };
        },
        
        closeDropdowns() {
            this.dropdownOpen = {};
        },
        
        // File management methods with confirmation
        async deleteLocalFileWithConfirm(file) {
            // ✅ EDGE CASE FIX: Handle orphaned files with missing or malformed IDs
            if (!file.id && file.isCollaborative && file.owner && file.permlink) {
                console.warn('🚨 Attempting to delete orphaned file with collaborative metadata:', file.name);
                const confirmMsg = `Delete orphaned file "${file.name}"?\n\nThis file appears to have collaborative metadata but no proper ID.\nThis action will clean up the orphaned entry and cannot be undone.`;
                
                if (confirm(confirmMsg)) {
                    try {
                        // Use the cleanup method for orphaned files
                        await this.cleanupOrphanedFiles([file]);
                        console.log('✅ Orphaned file cleaned up successfully');
                    } catch (error) {
                        console.error('❌ Failed to clean up orphaned file:', error);
                        alert(`Failed to clean up orphaned file: ${error.message}\n\nTry running: await window.tiptapEditor.diagnoseOrphanedFiles()`);
                    }
                }
                return;
            }
            
            // Normal deletion for files with proper IDs
            const confirmMsg = `Delete local file "${file.name}"?\n\nThis action cannot be undone.`;
            if (confirm(confirmMsg)) {
                try {
                    await this.deleteLocalFile(file.id);
                    console.log('✅ Local file deleted successfully');
                } catch (error) {
                    console.error('❌ Failed to delete local file:', error);
                    
                    // ✅ ENHANCED ERROR HANDLING: Suggest diagnostic tools for deletion failures
                    if (error.message?.includes('No file ID') || !file.id) {
                        alert(`Failed to delete file: ${error.message}\n\nThis may be an orphaned file. Try running diagnostic tools:\n\n1. Open browser console\n2. Run: await window.tiptapEditor.diagnoseOrphanedFiles()\n3. Run: await window.tiptapEditor.cleanupOrphanedFiles()`);
                    } else {
                    alert(`Failed to delete file: ${error.message}`);
                    }
                }
            }
        },
        
        async deleteCollaborativeDocWithConfirm(doc) {
            if (doc.owner !== this.authHeaders['x-account']) {
                alert('You can only delete documents that you own.');
                return;
            }
            
            const confirmMsg = `Delete collaborative document "${doc.permlink}"?\n\nThis action cannot be undone and will affect all collaborators.`;
            if (confirm(confirmMsg)) {
                try {
                    await this.deleteCollaborativeDoc(doc);
                    console.log('✅ Collaborative document deleted successfully');
                } catch (error) {
                    console.error('❌ Failed to delete collaborative document:', error);
                    alert(`Failed to delete document: ${error.message}`);
                }
            }
        },
        
        async clearAllLocalFiles() {
            const confirmMsg = `Delete ALL local files (${this.localFiles.length} files)?\n\nThis action cannot be undone.`;
            if (confirm(confirmMsg)) {
                try {
                    // Clear all local file content
                    for (const file of this.localFiles) {
                        localStorage.removeItem(`dlux_tiptap_file_${file.id}`);
                    }
                    
                    // Clear the file index
                    localStorage.removeItem('dlux_tiptap_files');
                    
                    // Reload the file list
                    await this.loadLocalFiles();
                    
                    console.log('✅ All local files cleared successfully');
                    
                    // If current file was local, create a new document
                    if (this.currentFile && this.currentFile.type === 'local') {
                        await this.newDocument();
                    }
                } catch (error) {
                    console.error('❌ Failed to clear local files:', error);
                    alert(`Failed to clear files: ${error.message}`);
                }
            }
        },

        async clearAllCloudFiles() {
            if (!this.showCollaborativeFeatures) {
                alert('You need to authenticate to manage cloud files.');
                return;
            }

            // Filter documents that the user owns
            const ownedDocs = this.collaborativeDocs.filter(doc => doc.owner === this.authHeaders['x-account']);
            
            if (ownedDocs.length === 0) {
                alert('You don\'t own any cloud documents to delete.');
                return;
            }

            const confirmMsg = `Delete ALL your cloud documents (${ownedDocs.length} files)?\n\nThis action cannot be undone and will affect any collaborators on these documents.`;
            if (confirm(confirmMsg)) {
                try {
                    console.log(`🗑️ Deleting ${ownedDocs.length} owned cloud documents...`);
                    
                    // Delete each owned document
                    let successCount = 0;
                    let failureCount = 0;
                    
                    for (const doc of ownedDocs) {
                        try {
                            await this.deleteCollaborativeDoc(doc);
                            successCount++;
                            console.log(`✅ Deleted: ${doc.documentName || doc.permlink}`);
                        } catch (error) {
                            failureCount++;
                            console.error(`❌ Failed to delete ${doc.documentName || doc.permlink}:`, error);
                        }
                    }
                    
                    // Reload the collaborative documents list
                    await this.loadCollaborativeDocs();
                    
                    const resultMsg = `Cloud files cleanup completed.\n\n✅ Successfully deleted: ${successCount} files${failureCount > 0 ? `\n❌ Failed to delete: ${failureCount} files` : ''}`;
                    alert(resultMsg);
                    
                    console.log(`✅ Cloud files cleanup completed: ${successCount} success, ${failureCount} failures`);
                    
                    // If current file was one of the deleted collaborative files, create a new document
                    if (this.currentFile && 
                        this.currentFile.type === 'collaborative' && 
                        this.currentFile.owner === this.authHeaders['x-account']) {
                        await this.newDocument();
                    }
                } catch (error) {
                    console.error('❌ Failed to clear cloud files:', error);
                    alert(`Failed to clear cloud files: ${error.message}`);
                }
            }
        },
        
        // Authentication methods
        async requestAuthentication() {
            console.log('🔐 Requesting authentication for collaborative editing...');
            
            // Reset server auth failure state when requesting new auth
            this.serverAuthFailed = false;
            this.lastAuthCheck = Date.now();
            
            // Emit request to parent - this matches the pattern used in collaborative-docs.js
            this.$emit('request-auth-headers');
        },

        // Wait for authentication to complete with timeout
        async waitForAuthentication(timeoutMs = 30000) {
            console.log('⏳ Waiting for authentication to complete...');
            
            const startTime = Date.now();
            
            return new Promise((resolve, reject) => {
                const checkAuth = () => {
                    if (this.isAuthenticated && !this.isAuthExpired) {
                        console.log('✅ Authentication completed successfully');
                        resolve(true);
                        return;
                    }
                    
                    if (Date.now() - startTime > timeoutMs) {
                        console.error('❌ Authentication timeout');
                        reject(new Error('Authentication timeout. Please try again.'));
                        return;
                    }
                    
                    // Check again in 500ms
                    setTimeout(checkAuth, 500);
                };
                
                checkAuth();
            });
        },

        // Handle authentication failure by requesting fresh auth
        async handleAuthenticationFailure() {
            console.log('🔐 Handling authentication failure - requesting fresh authentication...');
            
            // Clear any cached auth headers
            if (window.sessionStorage) {
                const keys = Object.keys(sessionStorage).filter(key => 
                    key.includes('collaborationAuthHeaders') || key.includes('auth')
                );
                keys.forEach(key => sessionStorage.removeItem(key));
                console.log('🧹 Cleared cached auth headers:', keys);
            }

            // Request fresh authentication
            await this.requestAuthentication();
            
            // Show user guidance
            alert(
                'Authentication failed for collaborative editing.\n\n' +
                'Please sign the authentication challenge when prompted.\n\n' +
                'This may happen if:\n' +
                '• Your authentication has expired (>23 hours old)\n' +
                '• Your account lacks collaboration permissions\n' +
                '• There was a signature validation error'
            );
        },
        
        // Pending uploads management
        getPendingUploads() {
            return JSON.parse(localStorage.getItem('dlux_pending_uploads') || '[]');
        },
        
        async retryPendingUpload(uploadId) {
            const pendingUploads = this.getPendingUploads();
            const upload = pendingUploads.find(u => u.id === uploadId);
            
            if (!upload) {
                console.error('Pending upload not found:', uploadId);
                return;
            }
            
            try {
                // Load the backup content
                const backupContent = JSON.parse(localStorage.getItem(`dlux_tiptap_backup_${upload.id}`) || '{}');
                
                if (!backupContent.isBackup) {
                    throw new Error('Invalid backup content');
                }
                
                // Set up the save form with the backup data
                this.saveForm.filename = upload.filename;
                this.saveForm.storageType = 'cloud';
                this.saveForm.isNewDocument = true;
                
                // Set the content from backup
                this.content = {
                    title: backupContent.title || '',
                    body: backupContent.body || '',
                    tags: backupContent.tags || [],
                    custom_json: backupContent.custom_json || {},
                    permlink: backupContent.permlink || '',
                    beneficiaries: backupContent.beneficiaries || []
                };
                
                // Show save modal and attempt to retry
                this.showSaveModal = true;
                
                console.log('🔄 Retry setup for pending upload:', upload.filename);
            } catch (error) {
                console.error('Failed to setup retry for pending upload:', error);
                alert('Failed to retry upload: ' + error.message);
            }
        },
        
        removePendingUpload(uploadId) {
            const pendingUploads = this.getPendingUploads();
            const filteredUploads = pendingUploads.filter(u => u.id !== uploadId);
            localStorage.setItem('dlux_pending_uploads', JSON.stringify(filteredUploads));
            
            // Also remove the backup file
            localStorage.removeItem(`dlux_tiptap_backup_${uploadId}`);
            
            console.log('🗑️ Removed pending upload:', uploadId);
        },
        
        // Toolbar action methods
        insertLink() {
            const url = prompt('Enter URL:');
            if (url) {
                this.bodyEditor?.chain().focus().setLink({ href: url }).run();
            }
        },
        
        insertImage() {
            const url = prompt('Enter image URL:');
            if (url) {
                this.bodyEditor?.chain().focus().setImage({ src: url }).run();
            }
        },
        
        insertTable() {
            this.bodyEditor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
        },
        
        handleAvatarError(event, user) {
            // Hide the broken image and show a fallback avatar
            event.target.style.display = 'none';
            
            // Create a fallback avatar element
            const fallback = document.createElement('div');
            fallback.className = 'user-avatar-small rounded-circle d-flex align-items-center justify-content-center';
            fallback.style.cssText = `
                width: 24px; 
                height: 24px; 
                background-color: ${user.color}; 
                font-size: 0.75rem; 
                font-weight: bold; 
                color: white;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                border: 2px solid ${user.color};
                box-shadow: 0 0 0 1px rgba(255,255,255,0.2);
            `;
            fallback.textContent = user.name.charAt(0).toUpperCase();
            fallback.title = user.name;
            
            // Replace the broken image with the fallback
            event.target.parentNode.appendChild(fallback);
        },
        
        handleOwnerAvatarError(event) {
            // Hide the broken image and show the fallback
            event.target.style.display = 'none';
            const fallback = event.target.nextElementSibling;
            if (fallback && fallback.classList.contains('user-avatar-fallback')) {
                fallback.style.display = 'flex';
            }
        },
        
        handlePermissionAvatarError(event, username) {
            // Hide the broken image and show the fallback
            event.target.style.display = 'none';
            const fallback = event.target.nextElementSibling;
            if (fallback && fallback.classList.contains('user-avatar-fallback')) {
                fallback.style.display = 'flex';
            }
        },
        
        // Color picker methods
        toggleColorPicker() {
            this.showColorPicker = !this.showColorPicker;
        },
        
        updateUserColor(newColor) {
            this.userColor = newColor;
            localStorage.setItem(`dlux_user_color_${this.username}`, newColor);
        },

        // ✅ DIAGNOSTIC: Identify and fix orphaned local files with collaborative metadata
        async diagnoseOrphanedFiles() {
            console.log('🔍 DIAGNOSTIC: Scanning for orphaned local files with collaborative metadata...');
            
            const files = JSON.parse(localStorage.getItem('dlux_tiptap_files') || '[]');
            const orphanedFiles = [];
            
            for (const file of files) {
                // Check for files that have collaborative metadata but no matching cloud document
                if (file.isCollaborative && file.owner && file.permlink) {
                    const collaborativeId = `${file.owner}/${file.permlink}`;
                    
                    // Check if there's a matching cloud document
                    const hasMatchingCloudDoc = this.collaborativeDocs.some(cloudDoc => 
                        `${cloudDoc.owner}/${cloudDoc.permlink}` === collaborativeId
                    );
                    
                    if (!hasMatchingCloudDoc) {
                        orphanedFiles.push({
                            ...file,
                            reason: 'No matching cloud document found',
                            collaborativeId
                        });
                        console.warn('🚨 ORPHANED FILE DETECTED:', {
                            name: file.name,
                            id: file.id,
                            collaborativeId,
                            owner: file.owner,
                            permlink: file.permlink,
                            isCollaborative: file.isCollaborative
                        });
                    }
                }
                
                // Check for files with malformed collaborative IDs
                if (file.collaborativeId && (!file.owner || !file.permlink)) {
                    orphanedFiles.push({
                        ...file,
                        reason: 'Malformed collaborative metadata',
                        collaborativeId: file.collaborativeId
                    });
                    console.warn('🚨 MALFORMED COLLABORATIVE METADATA:', {
                        name: file.name,
                        id: file.id,
                        collaborativeId: file.collaborativeId,
                        hasOwner: !!file.owner,
                        hasPermlink: !!file.permlink
                    });
                }
            }
            
            console.log(`🔍 DIAGNOSTIC COMPLETE: Found ${orphanedFiles.length} orphaned files`);
            return orphanedFiles;
        },

        // ✅ FIX: Clean up orphaned local files with collaborative metadata
        async cleanupOrphanedFiles(orphanedFiles = null) {
            if (!orphanedFiles) {
                orphanedFiles = await this.diagnoseOrphanedFiles();
            }
            
            if (orphanedFiles.length === 0) {
                console.log('✅ No orphaned files found to clean up');
                return { cleaned: 0, errors: 0 };
            }
            
            const confirmMsg = `Found ${orphanedFiles.length} orphaned file(s) with collaborative metadata but no cloud document.\n\nThese files may be preventing normal deletion. Clean them up?\n\nFiles:\n${orphanedFiles.map(f => `- ${f.name} (${f.reason})`).join('\n')}`;
            
            if (!confirm(confirmMsg)) {
                return { cleaned: 0, errors: 0, cancelled: true };
            }
            
            let cleaned = 0;
            let errors = 0;
            
            const files = JSON.parse(localStorage.getItem('dlux_tiptap_files') || '[]');
            
            for (const orphanedFile of orphanedFiles) {
                try {
                    console.log('🧹 Cleaning up orphaned file:', orphanedFile.name);
                    
                    // Option 1: Convert back to pure local file (remove collaborative metadata)
                    const cleanedFile = {
                        id: orphanedFile.originalLocalId || `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        name: orphanedFile.name,
                        documentName: orphanedFile.documentName || orphanedFile.name,
                        lastModified: orphanedFile.lastModified || new Date().toISOString(),
                        createdAt: orphanedFile.createdAt || new Date().toISOString(),
                        // Remove all collaborative metadata
                        isCollaborative: false,
                        type: 'local',
                        // Remove collaborative properties
                        owner: undefined,
                        permlink: undefined,
                        collaborativeId: undefined,
                        originalLocalId: undefined
                    };
                    
                    // Remove orphaned file and add cleaned file
                    const fileIndex = files.findIndex(f => f.id === orphanedFile.id);
                    if (fileIndex !== -1) {
                        files.splice(fileIndex, 1);
                        files.push(cleanedFile);
                        
                        // Also clean up any legacy localStorage content
                        localStorage.removeItem(`dlux_tiptap_file_${orphanedFile.id}`);
                        
                        console.log('✅ Orphaned file cleaned up:', {
                            oldId: orphanedFile.id,
                            newId: cleanedFile.id,
                            name: cleanedFile.name,
                            removedCollaborativeMetadata: true
                        });
                        
                        cleaned++;
                    } else {
                        console.warn('⚠️ Could not find orphaned file in localStorage:', orphanedFile.id);
                    }
                    
                } catch (error) {
                    console.error('❌ Failed to clean up orphaned file:', orphanedFile.name, error);
                    errors++;
                }
            }
            
            // Save updated files list
            localStorage.setItem('dlux_tiptap_files', JSON.stringify(files));
            
            // Refresh local files list
            await this.loadLocalFiles();
            
            const result = { cleaned, errors };
            console.log('🧹 Orphaned files cleanup complete:', result);
            
            if (cleaned > 0) {
                alert(`Successfully cleaned up ${cleaned} orphaned file(s).${errors > 0 ? ` ${errors} error(s) occurred.` : ''}`);
            }
            
            return result;
        },

        // ✅ FIX: Repair files with missing or malformed IDs
        async fixFilesWithMalformedIds(problematicFiles) {
            console.log('🔧 Fixing files with malformed IDs:', problematicFiles);
            
            let fixed = 0;
            let errors = 0;
            
            const allFiles = JSON.parse(localStorage.getItem('dlux_tiptap_files') || '[]');
            
            for (const problematicFile of problematicFiles) {
                try {
                    // Generate a proper ID for the file
                    const newId = problematicFile.collaborativeId || 
                                 (problematicFile.owner && problematicFile.permlink ? `${problematicFile.owner}/${problematicFile.permlink}` : null) ||
                                 `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    
                    console.log('🔧 Fixing file:', {
                        name: problematicFile.name,
                        oldId: problematicFile.id,
                        newId: newId,
                        isCollaborative: problematicFile.isCollaborative
                    });
                    
                    // Find and update the file in the array
                    const fileIndex = allFiles.findIndex(f => 
                        f === problematicFile || 
                        (f.name === problematicFile.name && f.lastModified === problematicFile.lastModified)
                    );
                    
                    if (fileIndex !== -1) {
                        // Update the file with proper ID
                        allFiles[fileIndex] = {
                            ...problematicFile,
                            id: newId
                        };
                        
                        console.log('✅ File ID fixed:', {
                            name: problematicFile.name,
                            newId: newId
                        });
                        
                        fixed++;
                    } else {
                        console.warn('⚠️ Could not find problematic file in array:', problematicFile.name);
                    }
                    
                } catch (error) {
                    console.error('❌ Failed to fix file:', problematicFile.name, error);
                    errors++;
                }
            }
            
            // Save updated files list
            localStorage.setItem('dlux_tiptap_files', JSON.stringify(allFiles));
            
            // Refresh local files list
            await this.loadLocalFiles();
            
            const result = { fixed, errors };
            console.log('🔧 File ID repair complete:', result);
            
            if (fixed > 0) {
                alert(`Successfully fixed ${fixed} file(s) with malformed IDs.${errors > 0 ? ` ${errors} error(s) occurred.` : ''}\n\nYou should now be able to delete the files normally.`);
            }
            
            return result;
        },

        // ✅ ENHANCED: Force delete any local file (bypass normal deletion logic)
        async forceDeleteLocalFile(fileId) {
            if (!fileId) {
                console.error('No file ID provided for force deletion');
                return false;
            }
            
            const confirmMsg = `FORCE DELETE local file with ID: ${fileId}\n\nThis will remove all traces of the file from localStorage and IndexedDB.\nThis action cannot be undone.\n\nContinue?`;
            if (!confirm(confirmMsg)) {
                return false;
            }
            
            try {
                console.log('🗑️ FORCE DELETING local file:', fileId);
                
                // Remove from localStorage index
                const files = JSON.parse(localStorage.getItem('dlux_tiptap_files') || '[]');
                const updatedFiles = files.filter(f => f.id !== fileId);
                localStorage.setItem('dlux_tiptap_files', JSON.stringify(updatedFiles));
                
                // Remove legacy localStorage content
                localStorage.removeItem(`dlux_tiptap_file_${fileId}`);
                
                // Try to clean up IndexedDB if it exists
                try {
                    if (window.indexedDB && window.indexedDB.databases) {
                        const databases = await window.indexedDB.databases();
                        const targetDb = databases.find(db => db.name === fileId);
                        if (targetDb) {
                            const deleteRequest = window.indexedDB.deleteDatabase(fileId);
                            await new Promise((resolve, reject) => {
                                deleteRequest.onsuccess = () => resolve();
                                deleteRequest.onerror = () => reject(deleteRequest.error);
                            });
                            console.log('🗑️ IndexedDB database deleted:', fileId);
                        }
                    }
                } catch (dbError) {
                    console.warn('⚠️ Could not clean up IndexedDB for:', fileId, dbError);
                }
                
                // Refresh local files list
                await this.loadLocalFiles();
                
                console.log('✅ File force deleted successfully:', fileId);
                
                // If we deleted the currently loaded file, create a new document
                if (this.currentFile?.id === fileId) {
                    await this.newDocument();
                }
                
                return true;
                
            } catch (error) {
                console.error('❌ Force delete failed:', error);
                alert(`Force delete failed: ${error.message}`);
                return false;
            }
            
            // Update collaboration cursor color if connected
            if (this.provider && this.provider.awareness) {
                const currentState = this.provider.awareness.getLocalState();
                this.provider.awareness.setLocalStateField('user', {
                    name: this.username,
                    color: newColor
                });
            }
            
            this.showColorPicker = false;
            console.log('🎨 User color updated:', newColor);
        },
        
        getRandomColor() {
            return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
        },
        
        getPermissionAvatarUrl(account) {
            return `https://images.hive.blog/u/${account}/avatar/small`;
        },

        // Document Name Editing (Collaborative Feature)
        startEditingDocumentName() {
            // Check read-only permissions for collaborative docs
            if (this.isReadOnlyMode) {
                console.warn('🚫 Cannot edit document name: user has read-only permissions');
                return;
            }
            
            this.documentNameInput = this.currentFile?.name || this.currentFile?.documentName || this.currentFile?.permlink || '';
            this.isEditingDocumentName = true;
            
            // Focus the input on next tick
            this.$nextTick(() => {
                const input = this.$refs.documentNameInput;
                if (input) {
                    input.focus();
                    input.select();
                }
            });
        },

        async saveDocumentName() {
            const newName = this.documentNameInput.trim();
            
            if (!newName) {
                this.cancelEditingDocumentName();
                return;
            }

            // Check read-only permissions for collaborative docs
            if (this.isReadOnlyMode) {
                console.warn('🚫 Cannot save document name: user has read-only permissions');
                this.cancelEditingDocumentName();
                return;
            }

            try {
                // If no current file exists, create a new local ydoc (same as when user enters data)
                if (!this.currentFile) {
                    await this.createNewDocumentFromName(newName);
                } else {
                    await this.renameCurrentDocument(newName);
                }
                
                this.isEditingDocumentName = false;
                console.log('📝 Document name saved:', newName);
                
            } catch (error) {
                console.error('Failed to save document name:', error);
                alert('Failed to save document name: ' + error.message);
            }
        },

        cancelEditingDocumentName() {
            this.isEditingDocumentName = false;
            this.documentNameInput = '';
        },

        async createNewDocumentFromName(name) {
            // Create new local ydoc with the specified name (following offline-first architecture)
            const timestamp = Date.now();
            
            this.currentFile = {
                id: `local_${timestamp}`,
                name: name,
                type: 'local',
                lastModified: new Date().toISOString(),
                isOfflineFirst: true, // Flag to indicate this uses Y.js + IndexedDB
                // ✅ SECURITY: Add creator field for user filtering
                creator: this.username || 'anonymous',
                createdAt: new Date().toISOString()
            };
            this.fileType = 'local';
            
            // Create offline-first collaborative editors (same as data entry trigger)
            if (!this.ydoc) {
                await this.createStandardEditor();
            }
            
            // TIPTAP BEST PRACTICE: Auto-save after document creation
            await this.performAutoSave();
            
            // Update local file index and refresh UI (following unified sync pattern)
            await this.updateLocalFileIndex();
            await this.loadLocalFiles();
            
            // ✅ CRITICAL: Trigger autosave for new document
            this.hasUnsavedChanges = true;
            this.debouncedAutoSave();
            
            console.log('📄 New local ydoc created from document name (offline-first architecture):', name);
        },

        async renameCurrentDocument(newName) {
            if (this.currentFile.type === 'collaborative') {
                // ✅ TIPTAP BEST PRACTICE: Store document name in Y.js config for collaborative docs
                const success = this.setDocumentName(newName);
                if (success) {
                    // Update current file object
                    this.currentFile.name = newName;
                    this.currentFile.title = newName;
                    this.currentFile.documentName = newName;
                    this.currentFile.lastModified = new Date().toISOString();
                    
                    // Update currentDocumentInfo for template display
                    if (this.currentDocumentInfo) {
                        this.currentDocumentInfo.title = newName;
                    }
                    
                    // ✅ CRITICAL: Update server-side document name via API
                    try {
                        console.log('☁️ Updating server-side document name via API...');
                        const response = await fetch(`https://data.dlux.io/api/collaboration/documents/${this.currentFile.owner}/${this.currentFile.permlink}/name`, {
                            method: 'PATCH',
                            headers: {
                                'Content-Type': 'application/json',
                                ...this.authHeaders
                            },
                            body: JSON.stringify({
                                documentName: newName
                            })
                        });
                        
                        if (response.ok) {
                            console.log('✅ Server-side document name updated successfully:', newName);
                            
                            // Reload collaborative docs list to reflect the change
                            await this.loadCollaborativeDocs();
                        } else {
                            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                            console.warn('⚠️ Failed to update server-side document name:', errorData.error || response.statusText);
                            // Don't throw error - Y.js sync is more important than server-side name
                        }
                    } catch (error) {
                        console.warn('⚠️ Failed to update server-side document name:', error.message);
                        // Don't throw error - Y.js sync is more important than server-side name
                    }
                    
                    // ✅ CRITICAL: Trigger autosave for collaborative documents
                    this.hasUnsavedChanges = true;
                    this.debouncedAutoSave();
                    
                    console.log('✅ Collaborative document name updated in Y.js config:', newName);
                } else {
                    throw new Error('Failed to update document name in Y.js config');
                }
            } else {
                // For local documents, update the name directly
                this.currentFile.name = newName;
                this.currentFile.lastModified = new Date().toISOString();
                
                // Update local file index (following offline-first pattern)
                await this.updateLocalFileIndex();
                await this.loadLocalFiles();
                
                // ✅ CRITICAL: Trigger autosave for local documents
                this.hasUnsavedChanges = true;
                this.debouncedAutoSave();
            }
        },

        handleDocumentNameKeydown(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                this.saveDocumentName();
            } else if (event.key === 'Escape') {
                event.preventDefault();
                this.cancelEditingDocumentName();
            }
        },

        // Y.js Undo/Redo Commands (TipTap Best Practice)
        canUndo() {
            return this.titleEditor?.can().undo || this.bodyEditor?.can().undo || false;
        },

        canRedo() {
            return this.titleEditor?.can().redo || this.bodyEditor?.can().redo || false;
        },

        performUndo() {
            if (this.titleEditor?.isFocused) {
                this.titleEditor.commands.undo();
            } else if (this.bodyEditor?.isFocused) {
                this.bodyEditor.commands.undo();
            } else {
                // Default to body editor if no editor is focused
                this.bodyEditor?.commands.undo();
            }
        },

        performRedo() {
            if (this.titleEditor?.isFocused) {
                this.titleEditor.commands.redo();
            } else if (this.bodyEditor?.isFocused) {
                this.bodyEditor.commands.redo();
            } else {
                // Default to body editor if no editor is focused
                this.bodyEditor?.commands.redo();
            }
        },

        async convertToCollaborative() {
            // TipTap Best Practice: Handle both basic documents (no Y.js) and Y.js documents
            
            if (this.currentFile?.type === 'collaborative' && this.connectionStatus === 'connected') {
                console.log('Document is already connected to collaboration server');
                return;
            }

            // Check authentication
            if (!this.isAuthenticated || this.isAuthExpired) {
                console.log('🔐 Authentication required for collaborative conversion');
                    this.requestAuthentication();
                    try {
                        await this.waitForAuthentication();
                    console.log('✅ Authentication completed, continuing with conversion');
                    } catch (error) {
                    console.error('❌ Authentication failed:', error);
                        alert('Authentication failed. Please try again.');
                    return;
                }
                }

            // FIXED: Create Y.js document if it doesn't exist (for basic documents)
            if (!this.ydoc) {
                console.log('📄 Creating Y.js document for basic document before enabling collaboration...');
                try {
                    await this.createLazyYjsDocument();
                    console.log('✅ Y.js document created successfully');
                    
                    // Ensure we have a currentFile entry with default name if needed
                    if (!this.currentFile) {
                        const title = this.getPlainTextTitle()?.trim();
                        let defaultName;
                        if (title) {
                            defaultName = title;
                        } else {
                            const now = new Date();
                            const dateStr = now.toLocaleDateString();
                            const timeStr = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                            defaultName = `Untitled - ${dateStr} ${timeStr}`;
                        }
                        
                        this.currentFile = {
                            name: defaultName,
                            type: 'local',
                            id: Date.now().toString(),
                            lastModified: new Date().toISOString()
                        };
                        console.log('📝 Created currentFile entry with default name:', defaultName);
                    }
                } catch (error) {
                    console.error('❌ Failed to create Y.js document:', error);
                    alert('Failed to prepare document for collaboration: ' + error.message);
                    return;
                }
                }

            // Test basic connectivity first
            console.log('🧪 Testing WebSocket connectivity...');
            const connectivityTest = await this.testWebSocketConnectivity();
            if (!connectivityTest.success) {
                alert(`❌ Cannot connect to collaboration server.\n\nError: ${connectivityTest.error}\n\nPlease check your internet connection and try again later.`);
                return;
            }
            console.log('✅ Basic connectivity test passed');

            // Generate document name and publish directly (streamlined UX)
            let documentName = this.currentFile?.name;
            
            if (!documentName) {
                const title = this.getPlainTextTitle()?.trim();
                if (title) {
                    documentName = title;
                } else {
                    // Create "untitled - date time" format to match UI display
                    const now = new Date();
                    const dateStr = now.toLocaleDateString();
                    const timeStr = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    documentName = `Untitled - ${dateStr} ${timeStr}`;
                }
            }

            try {
                // TIPTAP BEST PRACTICE: Auto-save before enabling cloud collaboration
                await this.performAutoSave();
                
                // Create server document directly (skip modal for streamlined UX)
                const response = await fetch('https://data.dlux.io/api/collaboration/documents', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...this.authHeaders
                    },
                    body: JSON.stringify({
                        documentName: documentName,
                        isPublic: false, // Default to private, can be changed later
                        title: this.getPlainTextTitle() || documentName,
                        description: 'Published from offline document'
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                    throw new Error(`Failed to create server document: ${errorData.error || response.statusText}`);
                }

                const docData = await response.json();
                const serverDoc = docData.document || docData;

                // ✅ TIPTAP.DEV UNIFIED ARCHITECTURE: Link local and cloud documents BEFORE connecting
                const originalLocalFile = this.currentFile;
                if (originalLocalFile && originalLocalFile.id && originalLocalFile.type === 'local') {
                    await this.convertLocalToCollaborative(originalLocalFile, {
                        owner: serverDoc.owner,
                        permlink: serverDoc.permlink,
                        documentName: serverDoc.documentName || documentName
                    });
                }

                // Connect existing Y.js document to server
                await this.connectToCollaborationServer(serverDoc);

                // Update current file to collaborative
                this.currentFile = {
                    ...serverDoc,
                    name: serverDoc.documentName || serverDoc.name || documentName, // Ensure name field is set
                    type: 'collaborative'
                };
                this.fileType = 'collaborative';
                
                // CRITICAL: Set collaborative mode flag to enable cloud features
                this.isCollaborativeMode = true;
                
                // CRITICAL FIX: Set owner permissions immediately during conversion
                // This prevents the "permissions not loaded" blocking issue
                this.documentPermissions = [{
                    account: this.username,
                    permissionType: 'postable' // Owner has full permissions
                }];
                console.log('🔐 Owner permissions set immediately during conversion:', this.documentPermissions);
                
                // ✅ TIPTAP BEST PRACTICE: Store document name in Y.js config after cloud conversion
                const finalDocumentName = serverDoc.documentName || serverDoc.name || documentName;
                this.setDocumentName(finalDocumentName);
                console.log('📄 Document name stored in Y.js config after cloud conversion:', finalDocumentName);
                
                // UNIFIED APPROACH: Upgrade to Tier 2 (Cloud) editors with cursors
                await this.upgradeLocalToCloudWithCursors();

                // Reload collaborative documents list
                await this.loadCollaborativeDocs();

                // TIPTAP BEST PRACTICE: Update URL with collaboration parameters after successful cloud save
                this.updateURLWithCollabParams(serverDoc.owner, serverDoc.permlink);
                console.log('🔗 URL updated with collaboration parameters after cloud save');

                console.log('✅ Document published to cloud successfully:', documentName);
                
            } catch (error) {
                console.error('❌ Failed to publish to cloud:', error);
                alert('Failed to publish to cloud: ' + error.message);
            }
        },

        // TIPTAP UNIFIED ARCHITECTURE: Disable cloud collaboration (convert to local-only)
        async disableCloudCollaboration() {
            if (!this.isCollaborativeMode) {
                console.log('📍 Document is already local-only');
                return;
            }

            const confirmDisable = confirm('This will disconnect the document from cloud collaboration and make it local-only. You can re-enable cloud collaboration later. Continue?');
            if (!confirmDisable) return;

            try {
                console.log('📍 Converting cloud document to local-only...');

                // TIPTAP BEST PRACTICE: Keep Y.js document and IndexedDB, just disconnect WebSocket
                this.disconnectWebSocketOnly();

                // Update document metadata to local
                this.currentFile = {
                    ...this.currentFile,
                    type: 'local',
                    cloudEnabled: false,
                    cloudStatus: 'local'
                };
                this.fileType = 'local';
                this.isCollaborativeMode = false;

                // Create local file entry for the now-local document
                await this.ensureLocalFileEntry();

                // TIPTAP BEST PRACTICE: Clear URL parameters when disabling cloud collaboration
                this.clearCollabURLParams();
                console.log('🔗 URL parameters cleared after disabling cloud collaboration');

                console.log('✅ Document converted to local-only successfully');
                
            } catch (error) {
                console.error('❌ Failed to disable cloud collaboration:', error);
                alert('Failed to disable cloud collaboration: ' + error.message);
            }
        },

        // New method: Test WebSocket connectivity
        async testWebSocketConnectivity() {
            return new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    resolve({
                        success: false,
                        error: 'Connection timeout - collaboration server may be unavailable'
                    });
                }, 5000);

                try {
                    // Test simple WebSocket connection to collaboration server base URL
                    const testUrl = this.collaborationUrl.replace(/^wss?:\/\//, 'wss://');
                    console.log('🧪 Testing WebSocket connectivity to:', testUrl);
                    
                    const testWs = new WebSocket(testUrl + '/test');
                    
                    testWs.onopen = () => {
                        console.log('✅ Basic WebSocket connection successful');
                        clearTimeout(timeout);
                        testWs.close();
                        resolve({
                            success: true,
                            message: 'WebSocket connectivity confirmed'
                        });
                    };
                    
                    testWs.onerror = (error) => {
                        console.log('⚠️ Test WebSocket connection had issues (this may be normal):', error.type);
                        clearTimeout(timeout);
                        // Even if test connection fails, the real connection might work
                        // So we'll return success but with a warning
                        resolve({
                            success: true,
                            message: 'WebSocket base connectivity test completed',
                            warning: 'Test connection had issues but real connection may still work'
                        });
                    };
                    
                    testWs.onclose = (event) => {
                        console.log('🔌 Test WebSocket closed:', {
                            code: event.code,
                            reason: event.reason,
                            wasClean: event.wasClean
                        });
                        
                        // If it closes immediately, that's often normal for test connections
                        if (!timeout._destroyed) {
                            clearTimeout(timeout);
                            resolve({
                                success: true,
                                message: 'WebSocket connectivity test completed'
                            });
                        }
                    };
            } catch (error) {
                    clearTimeout(timeout);
                    console.log('⚠️ WebSocket test failed, but proceeding anyway:', error.message);
                    // Don't fail the whole operation just because test failed
                    resolve({
                        success: true,
                        message: 'WebSocket test had issues but proceeding with actual connection',
                        warning: error.message
                    });
            }
            });
        },

        // === COMPREHENSIVE COLLABORATIVE DOCUMENT SOLUTION ===
        
        // TIPTAP BEST PRACTICE: Pre-load Y.js document with IndexedDB sync
        async preloadYjsDocument(file) {
            console.log('🔄 Pre-loading Y.js document (TipTap best practice)...');
            
            try {
                const bundle = window.TiptapCollaboration?.default || window.TiptapCollaboration;
                if (!bundle) {
                    console.warn('⚠️ Collaboration bundle not available');
                    return;
                }
                
                const Y = bundle.Y?.default || bundle.Y;
                const IndexeddbPersistence = bundle.IndexeddbPersistence?.default || bundle.IndexeddbPersistence;
                
                if (!Y || !IndexeddbPersistence) {
                    console.warn('⚠️ Y.js or IndexedDB persistence not available');
                    return;
                }
                
                // STEP 1: Create Y.js document
                this.ydoc = new Y.Doc();
                
                // STEP 2: Initialize IndexedDB persistence and wait for sync
                this.indexeddbProvider = new IndexeddbPersistence(file.id, this.ydoc);
                
                // STEP 3: Wait for initial sync from IndexedDB
                await new Promise((resolve) => {
                    const timeout = setTimeout(resolve, 2000); // Fallback timeout
                    
                    this.indexeddbProvider.on('synced', () => {
                        clearTimeout(timeout);
                        console.log('💾 IndexedDB sync completed');
                        resolve();
                    });
                });
                
                // STEP 4: Initialize collaborative schema
                this.initializeCollaborativeSchema(Y);
                
                // STEP 5: Load collaborative authors from Y.js
                this.loadCollaborativeAuthors();
                
                console.log('✅ Y.js document pre-loaded successfully');
                
            } catch (error) {
                console.error('❌ Failed to pre-load Y.js document:', error);
            }
        },

        // TIPTAP BEST PRACTICE: Pre-load collaborative Y.js document with server sync
        async preloadCollaborativeDocument(doc) {
            console.log('🔄 Pre-loading collaborative Y.js document...');
            
            try {
                const bundle = window.TiptapCollaboration?.default || window.TiptapCollaboration;
                if (!bundle) {
                    console.warn('⚠️ Collaboration bundle not available');
                    return;
                }
                
                const Y = bundle.Y?.default || bundle.Y;
                const IndexeddbPersistence = bundle.IndexeddbPersistence?.default || bundle.IndexeddbPersistence;
                
                if (!Y || !IndexeddbPersistence) {
                    console.warn('⚠️ Y.js or IndexedDB persistence not available');
                    return;
                }
                
                // STEP 1: Create Y.js document with proper ID
                const documentId = `${doc.owner}/${doc.permlink}`;
                this.ydoc = new Y.Doc();
                
                // STEP 2: Initialize IndexedDB persistence and wait for sync
                this.indexeddbProvider = new IndexeddbPersistence(documentId, this.ydoc);
                
                // STEP 3: Wait for initial sync from IndexedDB
                await new Promise((resolve) => {
                    const timeout = setTimeout(resolve, 3000); // Longer timeout for collaborative docs
                    
                    this.indexeddbProvider.on('synced', () => {
                        clearTimeout(timeout);
                        console.log('💾 Collaborative IndexedDB sync completed');
                        resolve();
                    });
                });
                
                // STEP 4: Initialize collaborative schema
                this.initializeCollaborativeSchema(Y);
                
                console.log('✅ Collaborative Y.js document pre-loaded successfully');
                
            } catch (error) {
                console.error('❌ Failed to pre-load collaborative Y.js document:', error);
            }
        },

        // COMPREHENSIVE COLLABORATIVE AUTHOR MANAGEMENT
        
        loadCollaborativeAuthors() {
            try {
                // Ensure collaborativeAuthors is always an array
                if (!Array.isArray(this.collaborativeAuthors)) {
                    this.collaborativeAuthors = [];
                }
                
                if (!this.ydoc) {
                    console.log('📝 No Y.js document available, using fallback author tracking');
                    return;
                }
                
                // Get authors from simplified Y.js authors array (updated to match our new structure)
                const authorsArray = this.ydoc.getArray('authors');
                if (authorsArray && authorsArray.length > 0) {
                    const yjsAuthors = authorsArray.toArray();
                    
                    // CRITICAL FIX: Validate that yjsAuthors is actually an array
                    if (!Array.isArray(yjsAuthors)) {
                        console.warn('⚠️ Y.js authors array returned non-array:', typeof yjsAuthors, yjsAuthors);
                        return; // Exit early if not an array
                    }
                    
                    console.log('👥 Loading collaborative authors from Y.js:', yjsAuthors);
                    
                    // Safely merge with existing local authors (no direct overwrite)
                    yjsAuthors.forEach(author => {
                        if (author && (author.username || typeof author === 'string')) {
                            const username = typeof author === 'object' ? author.username : author;
                            const exists = this.collaborativeAuthors.some(a => 
                                (a.username === username) || (typeof a === 'string' && a === username)
                            );
                            
                            if (!exists) {
                                // Add to local array maintaining consistency
                                const authorData = typeof author === 'object' ? author : {
                                    username: author,
                                    addedAt: new Date().toISOString(),
                                    color: this.generateUserColor(author)
                                };
                                this.collaborativeAuthors.push(authorData);
                                console.log('👤 Loaded collaborative author:', username);
                            }
                        }
                    });
                }
                
                // Also track current user as author if authenticated
                if (this.authHeaders?.['x-account']) {
                    this.addAuthorToTracking(this.authHeaders['x-account']);
                }
                
            } catch (error) {
                console.error('❌ Error loading collaborative authors:', error);
                // Ensure we always have a valid array even on error
                if (!Array.isArray(this.collaborativeAuthors)) {
                    this.collaborativeAuthors = [];
                }
            }
        },

        // Add author to collaborative tracking (with fallback support)
        addAuthorToTracking(username) {
            // DEFENSIVE: Wrap entire method in try-catch to prevent Y.js content errors from breaking functionality
            try {
                if (!username) return;
                
                // CRITICAL FIX: Prevent author tracking during permission updates or cleanup
                if (this.isUpdatingPermissions || this.isCleaningUp || this.isInitializingEditors) {
                    console.log('⏸️ Skipping author tracking - system operation in progress');
                    return;
                }
                
                // Defensive programming - ensure collaborativeAuthors is always an array
                if (!Array.isArray(this.collaborativeAuthors)) {
                    console.warn('⚠️ collaborativeAuthors corrupted in addAuthorToTracking, reinitializing');
                    this.collaborativeAuthors = [];
                }
                
                // Fallback: Use local array if Y.js not available
                if (!this.ydoc) {
                    if (!this.collaborativeAuthors.some(author => author.username === username)) {
                        const authorData = {
                            username: username,
                            addedAt: new Date().toISOString(),
                            color: this.generateUserColor(username)
                        };
                        this.collaborativeAuthors.push(authorData);
                        console.log('👤 Added author to local tracking:', username);
                    }
                    return;
                }
                
                // TIPTAP BEST PRACTICE: Use Y.js transactions for safe operations
                try {
                    // Use Y.js transaction to ensure atomic operations
                    this.ydoc.transact(() => {
                        const authorsArray = this.ydoc.getArray('authors');
                        
                        // TIPTAP BEST PRACTICE: Use Y.js length instead of toArray() during transactions
                        let authorExists = false;
                        
                        // Check existing authors without converting to array (safer during transactions)
                        for (let i = 0; i < authorsArray.length; i++) {
                            const author = authorsArray.get(i);
                            if ((typeof author === 'object' && author.username === username) ||
                                (typeof author === 'string' && author === username)) {
                                authorExists = true;
                                break;
                            }
                        }
                        
                        if (!authorExists) {
                            const authorData = {
                                username: username,
                                addedAt: new Date().toISOString(),
                                color: this.generateUserColor(username)
                            };
                            
                            // TIPTAP BEST PRACTICE: Insert within transaction
                            authorsArray.push([authorData]);
                            console.log('👤 Added collaborative author:', username);
                        }
                    });
                    
                    // Sync to local array outside of Y.js transaction
                    if (!Array.isArray(this.collaborativeAuthors)) {
                        this.collaborativeAuthors = [];
                    }
                    if (!this.collaborativeAuthors.some(author => 
                        author && (author.username === username || author === username)
                    )) {
                        this.collaborativeAuthors.push({
                            username: username,
                            addedAt: new Date().toISOString(),
                            color: this.generateUserColor(username)
                        });
                    }
                } catch (yjsError) {
                    console.warn('⚠️ Y.js author tracking failed, using local fallback:', yjsError.message);
                    
                    // Fallback to local tracking only
                    if (!this.collaborativeAuthors.some(author => author.username === username)) {
                        this.collaborativeAuthors.push({
                            username: username,
                            addedAt: new Date().toISOString(),
                            color: this.generateUserColor(username)
                        });
                    }
                }
                
            } catch (error) {
                // ULTIMATE FALLBACK: Silently fail to prevent breaking editor functionality
                console.warn('⚠️ Author tracking completely failed, silently ignoring:', error.message);
                
                // Ensure collaborativeAuthors is at least an empty array
                if (!Array.isArray(this.collaborativeAuthors)) {
                    this.collaborativeAuthors = [];
                }
            }
        },

        // Get collaborative authors with fallback
        getCollaborativeAuthors() {
            try {
                // Ensure local array is valid first
                if (!Array.isArray(this.collaborativeAuthors)) {
                    console.warn('⚠️ collaborativeAuthors corrupted in getCollaborativeAuthors, reinitializing');
                    this.collaborativeAuthors = [];
                }
                
                if (!this.ydoc) {
                    return this.collaborativeAuthors;
                }
                
                // Use simplified Y.js authors array
                const authorsArray = this.ydoc.getArray('authors');
                if (authorsArray && authorsArray.length > 0) {
                    const yjsAuthors = authorsArray.toArray();
                    // Validate that we got a proper array
                    if (Array.isArray(yjsAuthors)) {
                        return yjsAuthors;
                    }
                }
                
                // Fallback to local authors
                return this.collaborativeAuthors;
                
            } catch (error) {
                console.error('❌ Error getting collaborative authors:', error);
                // Ensure we return a valid array even on error
                return Array.isArray(this.collaborativeAuthors) ? this.collaborativeAuthors : [];
            }
        },

        // Create clickable author links HTML
        generateAuthorLinksHTML() {
            const authors = this.getCollaborativeAuthors();
            if (!authors || authors.length === 0) {
                return '';
            }
            
            const uniqueAuthors = authors.filter((author, index, self) => 
                index === self.findIndex(a => a.username === author.username)
            );
            
            const authorLinks = uniqueAuthors.map(author => {
                const color = author.color || this.generateUserColor(author.username);
                return `<a href="https://peakd.com/@${author.username}" target="_blank" style="color: ${color}; text-decoration: none; font-weight: 500;">@${author.username}</a>`;
            }).join(', ');
            
            return `<p><strong>Collaborative Authors:</strong> ${authorLinks}</p>`;
        },

        // URL-BASED DOCUMENT ACCESS AND SHARING SYSTEM
        
        // Enhanced URL-based document loading with TipTap best practices
        async loadDocumentFromURL(owner, permlink) {
            console.log(`🔗 Loading collaborative document from URL: ${owner}/${permlink}`);
            
            // TIPTAP BEST PRACTICE: Prevent duplicate loading on page refresh
            const docKey = `${owner}/${permlink}`;
            if (this.lastDocumentLoaded === docKey && this.isInitializing) {
                console.log('📋 Document already being loaded, preventing duplicate');
                return true;
            }
            
            // Check if this exact document is already loaded and connected
            if (this.currentDocumentInfo && 
                this.currentDocumentInfo.owner === owner && 
                this.currentDocumentInfo.permlink === permlink &&
                this.connectionStatus === 'connected') {
                console.log('📋 Document already loaded and connected, skipping reload');
                return true;
            }
            
            try {
                // STEP 1: Find the document in collaborative docs
                const doc = this.collaborativeDocs.find(d => 
                    d.owner === owner && d.permlink === permlink
                );
                
                if (!doc) {
                    console.warn(`⚠️ Document not found: ${owner}/${permlink}`);
                    this.connectionMessage = `Document not found: ${owner}/${permlink}`;
                    return false;
                }
                
                // STEP 2: Set loading flag to prevent duplicates
                this.isInitializing = true;
                this.lastDocumentLoaded = docKey;
                
                // STEP 3: TipTap best practice - Pre-load Y.js document first
                await this.preloadCollaborativeDocument(doc);
                
                // STEP 4: Load the document content with proper title handling
                await this.loadCollaborativeFile(doc);
                
                // STEP 5: Update URL without triggering navigation
                this.updateURLWithCollabParams(owner, permlink);
                
                console.log(`✅ Successfully loaded document from URL: ${owner}/${permlink}`);
                return true;
                
            } catch (error) {
                console.error('❌ Error loading document from URL:', error);
                this.connectionMessage = `Failed to load document: ${error.message}`;
                return false;
            } finally {
                // Always clear the loading flag
                this.isInitializing = false;
            }
        },

        // Generate shareable URL for current document
        generateShareableURL() {
            if (!this.currentDocumentInfo || !this.isCollaborativeMode) {
                return null;
            }
            
            const baseUrl = window.location.origin + window.location.pathname;
            const params = new URLSearchParams();
            params.set('collab_owner', this.currentDocumentInfo.owner);
            params.set('collab_permlink', this.currentDocumentInfo.permlink);
            
            return `${baseUrl}?${params.toString()}`;
        },

        // Copy shareable link to clipboard
        async copyShareableLink() {
            const shareableURL = this.generateShareableURL();
            if (!shareableURL) {
                console.warn('⚠️ No shareable URL available');
                return false;
            }
            
            try {
                await navigator.clipboard.writeText(shareableURL);
                console.log('📋 Shareable link copied to clipboard:', shareableURL);
                
                // Show user feedback
                this.connectionMessage = 'Shareable link copied to clipboard!';
                setTimeout(() => {
                    this.connectionMessage = this.getConnectionStatusMessage();
                }, 3000);
                
                return true;
                
            } catch (error) {
                console.error('❌ Failed to copy shareable link:', error);
                
                // Fallback: Show link in alert
                prompt('Copy this shareable link:', shareableURL);
                return false;
            }
        },

        // Enhanced presence and author tracking
        trackUserPresence(userInfo) {
            if (!userInfo || !userInfo.username) return;
            
            try {
                // Add user to author tracking
                this.addAuthorToTracking(userInfo.username);
                
                // Update presence information
                if (this.provider && this.provider.awareness) {
                    const currentState = this.provider.awareness.getLocalState() || {};
                    this.provider.awareness.setLocalStateField('user', {
                        username: userInfo.username,
                        color: userInfo.color || this.generateUserColor(userInfo.username),
                        cursor: currentState.cursor || null,
                        lastActive: Date.now()
                    });
                }
                
                console.log('👤 Tracked user presence:', userInfo.username);
                
            } catch (error) {
                console.error('❌ Error tracking user presence:', error);
            }
        },

        // ===== TIPTAP BEST PRACTICE: RACE CONDITION PREVENTION METHODS =====
        
        /**
         * Initialize application state sequentially to prevent race conditions
         * TIPTAP BEST PRACTICE: Load data in proper sequence before editor creation
         */
        async initializeApplicationState() {
            console.log('📋 Initializing application state...');
            
            // Load local files first (fast, no race conditions)
            await this.loadLocalFiles();
            
            // Load collaborative documents only if authenticated
            if (this.authHeaders && this.authHeaders['x-account']) {
                await this.loadCollaborativeDocs();
            }
            
            console.log('✅ Application state initialized');
        },
        
        /**
         * Determine initialization path based on URL parameters and state
         * TIPTAP BEST PRACTICE: Single decision point prevents race conditions
         */
        async determineInitializationPath() {
            console.log('🛤️ Determining initialization path...');
            console.log('🔍 Current URL:', window.location.href);
            
            const urlParams = new URLSearchParams(window.location.search);
            const collabOwner = urlParams.get('collab_owner');
            const collabPermlink = urlParams.get('collab_permlink');
            const localOwner = urlParams.get('local_owner');
            const localPermlink = urlParams.get('local_permlink');
            
            console.log('🔍 URL Parameters:', {
                collabOwner: collabOwner,
                collabPermlink: collabPermlink,
                localOwner: localOwner,
                localPermlink: localPermlink,
                hasAuth: !!(this.authHeaders && this.authHeaders['x-account']),
                collaborativeDocsLength: this.collaborativeDocs.length,
                hasInitialContent: !!(this.initialContent && Object.keys(this.initialContent).length > 0)
            });
            
            // Check for collaborative auto-connect parameters
            if (collabOwner && collabPermlink) {
                console.log('🔗 Collaborative auto-connect parameters detected:', { collabOwner, collabPermlink });
                return 'collaborative-autoconnect';
            }
            
            // ✅ CRITICAL FIX: Check for local auto-connect parameters
            if (localOwner && localPermlink) {
                console.log('🔗 Local auto-connect parameters detected:', { localOwner, localPermlink });
                return 'local-autoconnect';
            }
            
            // Check for collaborative mode with authentication
            if (this.authHeaders && this.authHeaders['x-account'] && this.collaborativeDocs.length > 0) {
                console.log('☁️ Collaborative mode available');
                return 'collaborative-standard';
            }
            
            // Check for initial content
            if (this.initialContent && Object.keys(this.initialContent).length > 0) {
                console.log('📄 Initial content provided');
                return 'local-with-initial-content';
            }
            
            // Default to local standard
            console.log('💻 Local standard mode');
            return 'local-standard';
        },
        
        /**
         * Execute collaborative auto-connect path
         * TIPTAP BEST PRACTICE: Single path eliminates checkAutoConnectParams/loadCollaborativeDocs race condition
         */
        async executeCollaborativeAutoConnectPath() {
            console.log('🔗 Executing collaborative auto-connect path...');
            
            const urlParams = new URLSearchParams(window.location.search);
            const collabOwner = urlParams.get('collab_owner');
            const collabPermlink = urlParams.get('collab_permlink');
            
            console.log('🔗 Auto-connect with parameters:', { collabOwner, collabPermlink });
            console.log('🔐 Authentication status:', {
                isAuthenticated: this.isAuthenticated,
                isAuthExpired: this.isAuthExpired,
                hasAuthHeaders: !!(this.authHeaders && this.authHeaders['x-account'])
            });
            
            try {
                // ✅ TIPTAP BEST PRACTICE: Skip temporary document info, wait for Y.js to provide real name
                console.log('📋 Step 1: Preparing to load document and wait for Y.js document name...');
                
                // STEP 2: Ensure authentication
                if (!this.isAuthenticated || this.isAuthExpired) {
                    console.log('🔑 Authentication required for auto-connect');
                    console.log('🔑 Current auth state:', {
                        isAuthenticated: this.isAuthenticated,
                        isAuthExpired: this.isAuthExpired,
                        hasAuthHeaders: !!this.authHeaders,
                        authHeadersKeys: this.authHeaders ? Object.keys(this.authHeaders) : []
                    });
                    
                    await this.requestAuthentication();
                    
                    try {
                        await this.waitForAuthentication(10000);
                        console.log('🔑 Authentication successful for auto-connect');
                    } catch (authError) {
                        console.error('🔑 Authentication failed for auto-connect:', authError);
                        // Continue anyway - might work in read-only mode
                        console.log('🔑 Continuing with auto-connect in read-only mode');
                    }
                } else {
                    console.log('🔑 Already authenticated for auto-connect');
                }
                
                // STEP 3: Create collaborative document object, check if we have it in our list first
                console.log('🏗️ Step 3: Creating collaborative document object...');
                
                // Check if document exists in our collaborative documents list
                const existingDoc = this.collaborativeDocs.find(doc => 
                    doc.owner === collabOwner && doc.permlink === collabPermlink
                );
                
                let docToLoad;
                if (existingDoc) {
                    console.log('📄 Found existing document in collaborative list:', existingDoc.documentName || existingDoc.name);
                    docToLoad = {
                        ...existingDoc,
                        type: 'collaborative'
                    };
                } else {
                    console.log('📄 Document not in collaborative list, creating minimal object');
                    docToLoad = {
                        owner: collabOwner,
                        permlink: collabPermlink,
                        type: 'collaborative'
                    };
                }
                console.log('📄 Created document object:', docToLoad);
                
                // STEP 4: Load document and wait for Y.js to provide the real document name
                console.log('📥 Step 4: Loading document and waiting for Y.js document name...');
                await this.loadDocumentAndWaitForName(docToLoad);
                
                console.log('✅ Collaborative auto-connect completed successfully');
                
            } catch (error) {
                console.error('❌ Auto-connect failed:', error);
                throw error;
            }
        },
        
        /**
         * Execute local auto-connect path
         * TIPTAP BEST PRACTICE: Auto-load local documents from URL parameters
         */
        async executeLocalAutoConnectPath() {
            console.log('🔗 Executing local auto-connect path...');
            
            const urlParams = new URLSearchParams(window.location.search);
            const localOwner = urlParams.get('local_owner');
            const localPermlink = urlParams.get('local_permlink');
            
            console.log('🔗 Local auto-connect with parameters:', { localOwner, localPermlink });
            
            try {
                // Load local files and attempt auto-connect
                await this.loadLocalFiles();
                await this.autoConnectToLocalDocument(localOwner, localPermlink);
                
                console.log('✅ Local auto-connect completed successfully');
                
            } catch (error) {
                console.error('❌ Local auto-connect failed:', error);
                
                // Fall back to standard local initialization
                console.log('🔄 Falling back to standard local initialization...');
                await this.executeLocalStandardPath();
            }
        },
        
        /**
         * Load document and wait for Y.js document name to be available
         * TIPTAP BEST PRACTICE: Wait for real document name before setting UI state
         */
        async loadDocumentAndWaitForName(file) {
            console.log('📋 Loading document with immediate filename check...');
            
            // First, load the document without cloud connection
            await this.loadDocumentWithoutCloudConnection(file);
            
            // Check if document name is immediately available in Y.js config (loads with title/body)
            const documentName = this.extractDocumentNameFromConfig();
            
            if (documentName) {
                console.log('✅ Document name found immediately in Y.js config:', documentName);
                
                // Set the UI state with the real document name
                this.currentFile = {
                    ...file,
                    name: documentName,
                    title: documentName,
                    documentName: documentName
                };
                
                this.currentDocumentInfo = {
                    owner: file.owner,
                    permlink: file.permlink,
                    title: documentName
                };
                
                console.log('✅ UI state set with document name from Y.js config:', documentName);
                
            } else {
                console.log('📄 No document name in Y.js config yet, using fallback and will update when available');
                
                // Use fallback name initially, will be updated when document name arrives from server
                const fallbackName = `${file.owner}/${file.permlink}`;
                this.currentFile = {
                    ...file,
                    name: fallbackName,
                    title: fallbackName,
                    documentName: fallbackName
                };
                
                this.currentDocumentInfo = {
                    owner: file.owner,
                    permlink: file.permlink,
                    title: fallbackName
                };
                
                console.log('📄 UI state set with fallback name, will update from server:', fallbackName);
            }
            
            // Clear initializing state - document content is loaded
            this.isInitializing = false;
            
            // Connect to cloud independently (non-blocking) - this will update document name if needed
            if (file.type === 'collaborative') {
                console.log('🔗 Starting independent cloud connection...');
                this.connectToCloudInBackground(file).catch(error => {
                    console.error('❌ Background cloud connection failed:', error);
                });
            }
        },
        
        /**
         * Load document without cloud connection (internal method)
         * TIPTAP BEST PRACTICE: Load content first, connect to cloud later
         */
        async loadDocumentWithoutCloudConnection(file) {
            console.log('📋 Loading document without cloud connection...');
            
            try {
                // Clean up any existing resources
                await this.cleanupCurrentDocument();
                await this.$nextTick();
                
                // CRITICAL FIX: Set currentFile early so createOfflineFirstCollaborativeEditors can access it
                // Add the collaborative document ID for proper IndexedDB persistence
                this.currentFile = {
                    ...file,
                    id: file.type === 'collaborative' && file.owner && file.permlink ? 
                        `${file.owner}/${file.permlink}` : 
                        (file.id || file.permlink)
                };
                
                // Determine tier requirements
                const requiresCloudTier = this.shouldUseCloudTier(file);
                const bundle = window.TiptapCollaboration?.default || window.TiptapCollaboration;
                
                if (!bundle) {
                    throw new Error('TipTap collaboration bundle is required');
                }
                
                // Create Y.js document + IndexedDB immediately 
                this.ydoc = new Y.Doc();
                
                // CRITICAL FIX: Use correct document ID format for collaborative documents
                let documentId;
                if (file.type === 'collaborative' && file.owner && file.permlink) {
                    documentId = `${file.owner}/${file.permlink}`;
                    console.log('🔍 Using collaborative document ID format:', documentId);
                } else {
                    documentId = file.id || file.permlink || `temp_${Date.now()}`;
                    console.log('🔍 Using local document ID format:', documentId);
                }
                console.log('🔍 DEBUG: loadDocumentWithoutCloudConnection - Document ID for IndexedDB:', documentId, 'from file:', {id: file.id, permlink: file.permlink, owner: file.owner, type: file.type});
                const IndexeddbPersistence = bundle.IndexeddbPersistence?.default || bundle.IndexeddbPersistence;
                
                if (IndexeddbPersistence) {
                    console.log('🔍 DEBUG: Creating IndexedDB persistence for document:', documentId);
                    this.indexeddbProvider = new IndexeddbPersistence(documentId, this.ydoc);
                    
                    // ✅ TIPTAP BEST PRACTICE: Wait for IndexedDB sync with timeout (critical for content loading)
                    await new Promise((resolve, reject) => {
                        const timeout = setTimeout(() => reject(new Error('IndexedDB sync timeout')), 5000);
                        this.indexeddbProvider.once('synced', () => {
                            clearTimeout(timeout);
                            
                            // CRITICAL DEBUG: Check if content was loaded from IndexedDB
                            const titleContent = this.ydoc.getXmlFragment('title');
                            const bodyContent = this.ydoc.getXmlFragment('body');
                            console.log('🔍 DEBUG: Y.js content after IndexedDB sync:', {
                                titleLength: titleContent.length,
                                bodyLength: bodyContent.length,
                                titleText: titleContent.toString(),
                                bodyText: bodyContent.toString(),
                                documentId: documentId,
                                ydocGuid: this.ydoc.guid
                            });
                            
                            // CRITICAL DEBUG: Check if IndexedDB actually has content for this document
                            console.log('🔍 DEBUG: IndexedDB provider state:', {
                                name: this.indexeddbProvider.name,
                                synced: this.indexeddbProvider.synced,
                                doc: this.indexeddbProvider.doc === this.ydoc
                            });
                            
                            resolve();
                        });
                    });
                    
                    console.log('💾 IndexedDB persistence synced for document');
                    
                    // Update custom JSON display after sync
                    this.updateCustomJsonDisplay();
                }
                
                // Store document name in Y.js config if available (for first-time loading)
                if (file.documentName || file.name || file.title) {
                    const documentName = file.documentName || file.name || file.title || `${file.owner}/${file.permlink}`;
                    console.log('📄 Storing document name in Y.js config during load:', documentName);
                    this.setDocumentName(documentName);
                }
                
                // Initialize collaborative schema
                this.initializeCollaborativeSchema(bundle.Y?.default || bundle.Y);
                
                // Create appropriate tier editor (but don't connect to cloud yet)
                if (requiresCloudTier) {
                    // Create local editors first, will upgrade to cloud later
                    await this.createOfflineFirstCollaborativeEditors(bundle);
                    this.isCollaborativeMode = true;
                    this.fileType = 'collaborative';
                } else {
                    await this.createOfflineFirstCollaborativeEditors(bundle);
                    this.isCollaborativeMode = false;
                    this.fileType = 'local';
                }
                
                // ✅ TIPTAP BEST PRACTICE: Use nextTick instead of arbitrary delay for DOM updates
                await this.$nextTick();
                console.log('📄 Content should now be visible in editors from IndexedDB');
                
                // Load publish options from Y.js into Vue data
                this.loadPublishOptionsFromYjs();
                
                // Load custom JSON from Y.js into Vue data
                this.loadCustomJsonFromYjs();
                
                // Clear cleanup flag after document loading is complete
                this.isCleaningUp = false;
                
                this.showLoadModal = false;
                this.hasUnsavedChanges = false;
                
                console.log('✅ Document loaded without cloud connection');
                
            } catch (error) {
                console.error('Failed to load document without cloud connection:', error);
                throw error;
            }
        },
        
        /**
         * Connect to cloud in background (non-blocking)
         * TIPTAP BEST PRACTICE: Separate cloud connection from content loading
         */
        async connectToCloudInBackground(file) {
            console.log('🔗 Starting background cloud connection...');
            
            try {
                // Initialize permissions immediately to prevent read-only mode during loading
                console.log('🔐 Initializing permissions for collaborative document...');
                this.documentPermissions = [{
                    account: file.owner,
                    permissionType: 'postable', // Owner always has full access
                    grantedBy: file.owner,
                    grantedAt: new Date().toISOString()
                }];
                
                // If user is not the owner, give them editable permissions by default
                if (this.username !== file.owner) {
                    this.documentPermissions.push({
                        account: this.username,
                        permissionType: 'editable', // Default to editable, will be refined later
                        grantedBy: file.owner,
                        grantedAt: new Date().toISOString(),
                        source: 'initial-assumption'
                    });
                    console.log('🔐 Initial assumption: User has editable permissions (will be refined)');
                }
                
                // Update URL with collaborative parameters for shareability
                console.log('🔗 Updating URL with collaborative parameters...', { owner: file.owner, permlink: file.permlink });
                try {
                    this.updateURLWithCollabParams(file.owner, file.permlink);
                    console.log('✅ URL update completed successfully');
                } catch (urlError) {
                    console.error('❌ URL update failed:', urlError);
                }
                
                // Connect to collaboration server
                await this.connectToCollaborationServer(file);
                
                console.log('✅ Background cloud connection completed');
                
            } catch (error) {
                console.error('❌ Background cloud connection failed:', error);
                throw error;
            }
        },
        
        /**
         * Load document without updating UI state (internal method)
         * TIPTAP BEST PRACTICE: Separate document loading from UI updates
         */
        async loadDocumentWithoutUIUpdate(file) {
            console.log('📋 Loading document without UI update...');
            
            try {
                // Clean up any existing resources
                await this.cleanupCurrentDocument();
                await this.$nextTick();
                
                // Determine tier requirements
                const requiresCloudTier = this.shouldUseCloudTier(file);
                const bundle = window.TiptapCollaboration?.default || window.TiptapCollaboration;
                
                if (!bundle) {
                    throw new Error('TipTap collaboration bundle is required');
                }
                
                // Create Y.js document + IndexedDB immediately 
                this.ydoc = new Y.Doc();
                
                // CRITICAL FIX: Use correct document ID format for collaborative documents
                let documentId;
                if (file.type === 'collaborative' && file.owner && file.permlink) {
                    documentId = `${file.owner}/${file.permlink}`;
                    console.log('🔍 Using collaborative document ID format:', documentId);
                } else {
                    documentId = file.id || file.permlink || `temp_${Date.now()}`;
                    console.log('🔍 Using local document ID format:', documentId);
                }
                
                const IndexeddbPersistence = bundle.IndexeddbPersistence?.default || bundle.IndexeddbPersistence;
                
                if (IndexeddbPersistence) {
                    this.indexeddbProvider = new IndexeddbPersistence(documentId, this.ydoc);
                    
                    // ✅ TIPTAP BEST PRACTICE: Wait for IndexedDB sync with timeout (critical for content loading)
                    await new Promise((resolve, reject) => {
                        const timeout = setTimeout(() => reject(new Error('IndexedDB sync timeout')), 5000);
                        this.indexeddbProvider.once('synced', () => {
                            clearTimeout(timeout);
                            resolve();
                        });
                    });
                    
                    console.log('💾 IndexedDB persistence synced for document');
                }
                
                // Initialize collaborative schema
                this.initializeCollaborativeSchema(bundle.Y?.default || bundle.Y);
                
                // Create appropriate tier editor
                if (requiresCloudTier) {
                    await this.createCloudEditorsWithCursors(bundle); // Tier 2
                    this.isCollaborativeMode = true;
                    this.fileType = 'collaborative';
                } else {
                    await this.createOfflineFirstCollaborativeEditors(bundle); // Tier 1
                    this.isCollaborativeMode = false;
                    this.fileType = 'local';
                }
                
                // For cloud documents, initialize permissions and connect WebSocket
                if (requiresCloudTier && file.type === 'collaborative') {
                    // Initialize permissions immediately to prevent read-only mode during loading
                    console.log('🔐 Initializing permissions for collaborative document...');
                    this.documentPermissions = [{
                        account: file.owner,
                        permissionType: 'postable', // Owner always has full access
                        grantedBy: file.owner,
                        grantedAt: new Date().toISOString()
                    }];
                    
                    // If user is not the owner, give them editable permissions by default
                    if (this.username !== file.owner) {
                        this.documentPermissions.push({
                            account: this.username,
                            permissionType: 'editable', // Default to editable, will be refined later
                            grantedBy: file.owner,
                            grantedAt: new Date().toISOString(),
                            source: 'initial-assumption'
                        });
                        console.log('🔐 Initial assumption: User has editable permissions (will be refined)');
                    }
                    
                    // Update URL with collaborative parameters for shareability
                    console.log('🔗 Updating URL with collaborative parameters...', { owner: file.owner, permlink: file.permlink });
                    try {
                        this.updateURLWithCollabParams(file.owner, file.permlink);
                        console.log('✅ URL update completed successfully');
                    } catch (urlError) {
                        console.error('❌ URL update failed:', urlError);
                    }
                    
                    // ✅ BACKGROUND CLOUD CONNECTION: Don't block UI for cloud connection
                    this.connectToCollaborationServer(file).catch(error => {
                        console.error('❌ Background cloud connection failed:', error);
                        // Don't throw - let user continue with offline editing
                    });
                    
                    console.log('🔗 Cloud connection started in background');
                }
                
                // ✅ TIPTAP BEST PRACTICE: Use nextTick instead of arbitrary delay for DOM updates
                await this.$nextTick();
                console.log('📄 Content should now be visible in editors from IndexedDB');
                
                // Load publish options and custom JSON from Y.js after editors are ready
                this.loadPublishOptionsFromYjs();
                this.loadCustomJsonFromYjs();
                console.log('📄 Publish options and custom JSON loaded from Y.js');
                
                // Clear cleanup flag after document loading is complete
                this.isCleaningUp = false;
                
                // ✅ OFFLINE-FIRST: Dismiss modal immediately after local content is loaded
                this.showLoadModal = false;
                this.hasUnsavedChanges = false;
                
                console.log('✅ Modal dismissed - local content loaded from IndexedDB');
                
                console.log('✅ Document loaded without UI update');
                
            } catch (error) {
                console.error('Failed to load document without UI update:', error);
                throw error;
            }
        },
        
        /**
         * Wait for document name to be available in Y.js config
         * TIPTAP BEST PRACTICE: Promise-based waiting for Y.js data
         */
        async waitForDocumentName(file, timeoutMs = 5000) {
            console.log('⏳ Waiting for document name from Y.js config...');
            
            return new Promise((resolve) => {
                let resolved = false;
                let checkCount = 0;
                const maxChecks = timeoutMs / 100; // Check every 100ms
                
                // Set up timeout
                const timeout = setTimeout(() => {
                    if (!resolved) {
                        resolved = true;
                        console.warn('⚠️ Timeout waiting for document name');
                        resolve(null);
                    }
                }, timeoutMs);
                
                // Check if document name is already available
                const checkDocumentName = () => {
                    if (resolved) return;
                    checkCount++;
                    
                    if (this.ydoc) {
                        try {
                            const config = this.ydoc.getMap('config');
                            const documentName = config.get('documentName');
                            
                            // Accept any valid document name, even if it matches owner/permlink
                            // (for new documents that haven't been renamed yet)
                            if (documentName && documentName.trim() !== '') {
                                resolved = true;
                                clearTimeout(timeout);
                                console.log('✅ Document name found in Y.js config:', documentName);
                                resolve(documentName);
                                return;
                            }
                        } catch (error) {
                            console.warn('⚠️ Error checking Y.js config:', error);
                        }
                    }
                    
                    // For new documents, if we've checked many times and still no document name,
                    // it might be a new document that needs a default name
                    if (checkCount > maxChecks * 0.8) { // After 80% of timeout
                        console.log('🔍 Long wait for document name, checking if this is a new document...');
                        
                        // If this is a new document without a name, resolve with null to use fallback
                        if (this.ydoc) {
                            try {
                                const config = this.ydoc.getMap('config');
                                const hasAnyContent = config.size > 0;
                                
                                if (!hasAnyContent) {
                                    console.log('📄 New document detected, using fallback name');
                                    resolved = true;
                                    clearTimeout(timeout);
                                    resolve(null);
                                    return;
                                }
                            } catch (error) {
                                console.warn('⚠️ Error checking document content:', error);
                            }
                        }
                    }
                    
                    // Check again in 100ms
                    if (checkCount < maxChecks) {
                        setTimeout(checkDocumentName, 100);
                    }
                };
                
                // Start checking
                checkDocumentName();
            });
        },
        
        /**
         * Execute collaborative standard path
         * TIPTAP BEST PRACTICE: Standard collaborative initialization without auto-connect
         */
        async executeCollaborativeStandardPath() {
            console.log('☁️ Executing collaborative standard path...');
            
            // Create default collaborative editors (Tier 2 - Cloud)
            await this.createWorkingEditors();
            
            console.log('✅ Collaborative standard initialization completed');
        },
        
        /**
         * Execute local path with initial content
         * TIPTAP BEST PRACTICE: Set initial content only for new documents
         */
        async executeLocalWithInitialContentPath() {
            console.log('📄 Executing local with initial content path...');
            
            // Create local editors (Tier 1 - Local)
            await this.createWorkingEditors();
            
            // TIPTAP BEST PRACTICE: Set initial content only if no Y.js document exists
            if (!this.ydoc && !this.websocketProvider) {
                this.content = { ...this.content, ...this.initialContent };
                this.setEditorContent(this.content);
            }
            
            console.log('✅ Local with initial content initialization completed');
        },
        
        /**
         * Execute local standard path
         * TIPTAP BEST PRACTICE: Default local editor creation
         */
        async executeLocalStandardPath() {
            console.log('💻 Executing local standard path...');
            
            // Create local editors (Tier 1 - Local)
            await this.createWorkingEditors();
            
            console.log('✅ Local standard initialization completed');
        },
        
        /**
         * Complete initialization with common setup
         * TIPTAP BEST PRACTICE: Single completion point for all paths
         */
        async completeInitialization() {
            console.log('🏁 Completing initialization...');
            
            // Initialize custom JSON display
            this.updateCustomJsonDisplay();
            
            // Set up event listeners
            this.setupEventListeners();
            
            console.log('✅ Initialization completion finished');
        },
        
        /**
         * Set up event listeners
         * TIPTAP BEST PRACTICE: Centralized event listener setup
         */
        setupEventListeners() {
            // Close dropdowns when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.dropdown')) {
                    this.closeDropdowns();
                }
                
                // Close color picker when clicking outside
                if (!e.target.closest('.position-relative') && this.showColorPicker) {
                    this.showColorPicker = false;
                }
            });
        },
        
        /**
         * Handle initialization errors
         * TIPTAP BEST PRACTICE: Centralized error handling with fallback
         */
        async handleInitializationError(error) {
            console.error('❌ Initialization error:', error);
            
            try {
                // Attempt to create basic editors as fallback
                console.log('🔄 Creating fallback basic editors...');
                const bundle = window.TiptapCollaboration?.default || window.TiptapCollaboration;
                if (bundle) {
                    await this.createBasicEditorsAsFallback(bundle);
                    this.setupEventListeners();
                    console.log('✅ Fallback editors created successfully');
                } else {
                    console.error('❌ TipTap bundle not available for fallback');
                }
            } catch (fallbackError) {
                console.error('❌ Fallback editor creation failed:', fallbackError);
            }
        },

        /**
         * Get collaborative parameters from URL for template display
         * TIPTAP BEST PRACTICE: Centralized URL parameter access
         */
        getCollabParamsFromURL() {
            const urlParams = new URLSearchParams(window.location.search);
            return {
                collabOwner: urlParams.get('collab_owner'),
                collabPermlink: urlParams.get('collab_permlink')
            };
        },
        


        /**
         * Extract title from Y.js document after collaborative load
         * TIPTAP BEST PRACTICE: Fallback title extraction when API metadata fails
         */
        /**
         * Extract document name from Y.js config metadata
         * ✅ TIPTAP BEST PRACTICE: Document name stored as metadata, separate from title content
         */
        extractDocumentNameFromConfig() {
            if (!this.ydoc) return null;
            
            try {
                const config = this.ydoc.getMap('config');
                const documentName = config.get('documentName');
                
                if (documentName && documentName.trim() !== '') {
                    console.log('📄 Extracted document name from Y.js config:', documentName);
                    return documentName;
                }
            } catch (error) {
                console.warn('⚠️ Could not extract document name from Y.js config:', error.message);
            }
            
            return null;
        },

        extractTitleFromEditor() {
            if (!this.titleEditor) return null;
            
            try {
                // ✅ TIPTAP BEST PRACTICE: Use editor methods instead of direct Y.js access
                const titleText = this.titleEditor.getText().trim();
                if (titleText && titleText !== '') {
                    console.log('📄 Extracted title from TipTap editor:', titleText);
                    return titleText;
                }
            } catch (error) {
                console.warn('⚠️ Could not extract title from TipTap editor:', error.message);
            }
            
            return null;
        },

        /**
         * Update document name from Y.js content after collaborative load
         * TIPTAP BEST PRACTICE: Update UI with actual content after load
         */
        updateDocumentNameFromContent() {
            console.log('🔄 updateDocumentNameFromContent called:', {
                hasCurrentFile: !!this.currentFile,
                currentFileType: this.currentFile?.type,
                isCollaborativeMode: this.isCollaborativeMode
            });
            
            if (!this.currentFile || (!this.isCollaborativeMode && this.currentFile.type !== 'collaborative')) {
                console.log('📋 updateDocumentNameFromContent: Skipping - not collaborative or no currentFile');
                return;
            }
            
            // ✅ TIPTAP BEST PRACTICE: Extract document name from Y.js config metadata
            const configDocumentName = this.extractDocumentNameFromConfig();
            
            if (configDocumentName && configDocumentName !== this.currentFile.name && 
                configDocumentName !== `${this.currentFile.owner}/${this.currentFile.permlink}`) {
                
                console.log('🔄 Updating document name from Y.js config:', {
                    oldName: this.currentFile.name,
                    newDocumentName: configDocumentName
                });
                
                // Update current file with document name from Y.js config
                this.currentFile = {
                    ...this.currentFile,
                    name: configDocumentName,
                    title: configDocumentName,
                    documentName: configDocumentName
                };
                
                // Also update currentDocumentInfo for template display
                if (this.currentDocumentInfo) {
                    this.currentDocumentInfo.title = configDocumentName;
                }
                
                console.log('🔍 DEBUG updateDocumentNameFromContent: Updated values:', {
                    currentFileName: this.currentFile.name,
                    currentDocumentInfoTitle: this.currentDocumentInfo?.title
                });
                
                // Force Vue reactivity update with nextTick to ensure DOM update
                this.$nextTick(() => {
                    this.$forceUpdate();
                    console.log('🔄 updateDocumentNameFromContent: Vue reactivity forced after nextTick');
                });
                
                console.log('✅ Document name updated from Y.js config metadata');
            } else {
                console.log('📋 No document name found in Y.js config or name unchanged');
            }
        },
    },
    
    watch: {
        // ✅ AUTO-REFRESH: Automatically refresh document list when load modal opens
        showLoadModal: {
            handler(newValue, oldValue) {
                if (newValue && !oldValue) {
                    // Modal just opened - refresh document lists
                    console.log('📋 Load modal opened - auto-refreshing document lists...');
                    this.refreshDocumentLists();
                    
                    // Set up periodic refresh while modal is open
                    this.startAutoRefresh();
                } else if (!newValue && oldValue) {
                    // Modal just closed - stop auto-refresh
                    console.log('📋 Load modal closed - stopping auto-refresh');
                    this.stopAutoRefresh();
                }
            },
            immediate: false
        },
        
        authHeaders: {
            handler(newHeaders, oldHeaders) {
                // Reset server auth failure when new auth headers are received
                if (newHeaders && newHeaders['x-account']) {
                    // Check if this is actually new authentication (different from previous)
                    const isNewAuth = !oldHeaders || 
                        oldHeaders['x-challenge'] !== newHeaders['x-challenge'] ||
                        oldHeaders['x-signature'] !== newHeaders['x-signature'];
                    
                    if (isNewAuth) {
                        console.log('🔐 New authentication received, resetting auth failure state');
                        this.serverAuthFailed = false;
                        this.lastAuthCheck = Date.now();
                        
                        // Update connection message if we were in a failed state
                        if (this.connectionMessage.includes('Authentication failed')) {
                            this.connectionMessage = 'Authentication updated';
                        }
                    }
                    
                    if (!this.isAuthExpired) {
                    this.loadCollaborativeDocs();
                    } else {
                        this.collaborativeDocs = [];
                    }
                } else {
                    this.collaborativeDocs = [];
                }
            },
            immediate: true
        },
        
        fileToAdd: {
            handler(newFile) {
                if (newFile) {
                    this.addFileToPost(newFile);
                    // Clear the file to add after processing
                    this.$emit('update:fileToAdd', null);
                }
            }
        },
        
        // Watch for DLUX post type changes from parent
        dluxPostType: {
            handler(newPostType) {
                if (newPostType && this.isCollaborativeMode) {
                    this.handlePostTypeChange(newPostType);
                }
            }
        },
        
        // Watch for DLUX asset changes from parent
        dluxAssets: {
            handler(newAssets) {
                if (newAssets && this.isCollaborativeMode) {
                    this.handleAssetUpdate(newAssets);
                }
            },
            deep: true
        },
        
        // OFFLINE-FIRST FIX: Watch connection status changes to update editor permissions
        connectionStatus: {
            handler(newStatus, oldStatus) {
                if (oldStatus && newStatus !== oldStatus) {
                    console.log(`🔐 Connection status changed: ${oldStatus} → ${newStatus}`);
                    
                    // Update editor permissions when connection status changes
                    // This ensures editors become editable/read-only based on offline-first logic
                    if (this.isCollaborativeMode) {
                        console.log('🔐 Updating editor permissions due to connection status change');
                        this.updateEditorPermissions();
                    }
                }
            }
        },

        // FIXED: Watch for custom JSON changes from external sources (document loading, collaborative updates)
        displayCustomJson: {
            handler(newDisplayJson) {
                // Only update customJsonString if it's different and not currently being edited
                if (newDisplayJson !== this.customJsonString && document.activeElement?.tagName !== 'TEXTAREA') {
                    console.log('🔧 Syncing customJsonString with stored data');
                    this.customJsonString = newDisplayJson;
                }
            }
        },
    },
    
    async mounted() {
        try {
            console.log('🚀 Starting TipTap editor initialization with race condition prevention...');
            
            // ✅ DIAGNOSTIC TOOLS: Make diagnostic methods globally accessible for debugging
            if (typeof window !== 'undefined') {
                window.tiptapEditor = this;
                window.tiptapDiagnostic = {
                    diagnoseOrphanedFiles: () => this.diagnoseOrphanedFiles(),
                    cleanupOrphanedFiles: () => this.cleanupOrphanedFiles(),
                    forceDeleteLocalFile: (fileId) => this.forceDeleteLocalFile(fileId),
                    listAllLocalFiles: () => {
                        const files = JSON.parse(localStorage.getItem('dlux_tiptap_files') || '[]');
                        console.table(files);
                        return files;
                    },
                    listIndexedDBDatabases: async () => {
                        if (window.indexedDB && window.indexedDB.databases) {
                            const databases = await window.indexedDB.databases();
                            console.table(databases);
                            return databases;
                        }
                        return [];
                    }
                };
                console.log('🔧 Diagnostic tools available at window.tiptapDiagnostic');
            }
            
            // STEP 1: Initialize debounced functions
            this.debouncedAutoSave = methodsCommon.debounce(this.performAutoSave, 500);
            this.debouncedYjsCreation = methodsCommon.debounce(this.createLazyYjsDocument, 2000);
            this.debouncedPersistentYjsCreation = methodsCommon.debounce(this.createPersistentYjsDocument, 2000);
            this.debouncedValidateCustomJson = methodsCommon.debounce(this.validateCustomJson, 1000);
            
            // STEP 2: Set initialization flag to prevent race conditions
            this.isInitializing = true;
            
            // STEP 3: Initialize application state in proper sequence
            await this.initializeApplicationState();
            
            // STEP 4: Determine initialization path based on URL parameters
            const initializationPath = await this.determineInitializationPath();
            
            // STEP 5: Execute appropriate initialization path
            console.log(`🛤️ Selected initialization path: ${initializationPath}`);
            switch (initializationPath) {
                case 'collaborative-autoconnect':
                    console.log('🔗 Executing collaborative auto-connect path...');
                    await this.executeCollaborativeAutoConnectPath();
                    break;
                case 'local-autoconnect':
                    console.log('🔗 Executing local auto-connect path...');
                    await this.executeLocalAutoConnectPath();
                    break;
                case 'collaborative-standard':
                    console.log('☁️ Executing collaborative standard path...');
                    await this.executeCollaborativeStandardPath();
                    break;
                case 'local-with-initial-content':
                    console.log('📄 Executing local with initial content path...');
                    await this.executeLocalWithInitialContentPath();
                    break;
                case 'local-standard':
                default:
                    console.log('💻 Executing local standard path...');
                    await this.executeLocalStandardPath();
                    break;
            }
            
            // STEP 6: Complete initialization
            await this.completeInitialization();
            
        } catch (error) {
            console.error('❌ Error in mounted hook:', error);
            await this.handleInitializationError(error);
        } finally {
            // Always clear initialization flag
            this.isInitializing = false;
            console.log('✅ TipTap editor initialization completed');
        }
            },
        
        beforeUnmount() {
            // Clear temp document creation timer
            if (this.tempDocumentCreationTimer) {
                clearTimeout(this.tempDocumentCreationTimer);
                this.tempDocumentCreationTimer = null;
            }
            
            // Clear auto-refresh timer
            this.stopAutoRefresh();
            
            this.fullCleanupCollaboration();
            
            // Clean up all editors
            if (this.titleEditor) {
                this.titleEditor.destroy();
            }
            if (this.permlinkEditor) {
                this.permlinkEditor.destroy();
            }
            if (this.bodyEditor) {
                this.bodyEditor.destroy();
            }
        },
        
        template: `<div class="collaborative-post-editor">
    <!-- File Menu Bar -->
    <div class="file-menu-bar bg-dark border-bottom border-secondary mb-3 p-05 d-flex">

            <!-- File Menu -->
            <div class="btn-group">
                <button class="btn btn-dark no-caret dropdown-toggle" type="button" data-bs-toggle="dropdown"
                    aria-expanded="false">
                    <i class="fas fa-file me-sm-1 d-none"></i><span class="">File</span>
                </button>
                <ul class="dropdown-menu dropdown-menu-dark bg-dark has-submenu">
                    <!-- Consolidated Document Creation (Y.js Offline-First) -->
                    <li><a class="dropdown-item" href="#" @click.prevent="newDocument">
                            <i class="fas fa-file-circle-plus me-2"></i>New
                           
                        </a></li>
                    <li>

                    </li>
                    <li><a class="dropdown-item" href="#" @click.prevent="showLoadModal = true">
                            <i class="fas fa-folder-open me-2"></i>Open
                        </a>
                    </li>
               
                    
                    <li>
                        <hr class="dropdown-divider">
                    </li>
                         <!-- Save As (traditional naming for user familiarity) -->
                    <li><a class="dropdown-item" href="#" @click.prevent="saveAsDocument">
                            <i class="fas fa-copy me-2"></i>Save As...
                        </a></li>
                                         <li>
                         <hr class="dropdown-divider">
                     </li>
                     <!-- Sharing submenu -->
                     <li class="dropdown-submenu">
                         <a class="dropdown-item dropdown-toggle" href="#" data-bs-toggle="dropdown">
                             <i class="fas fa-share me-2"></i>Share
                         </a>
                         <ul class="dropdown-menu bg-dark">
                              <li v-if="currentFile?.type === 'collaborative'"><a class="dropdown-item" href="#" @click.prevent="shareDocument"
                             :class="{ disabled: !canShare }">
                             <i class="fas fa-user-plus me-2"></i>Share Document
                             <small v-if="!canShare && (!isAuthenticated || isAuthExpired)" class="d-block text-muted">Authentication required</small>
                            </a></li>
                            <li v-else><a class="dropdown-item d-flex align-items-center gap-2" href="#" @click="convertToCollaborative()"
                                >
                                <div class="position-relative">
                    <i class="fas fa-cloud fa-fw fs-2"></i>  
                    <div class="position-absolute top-50 start-50 translate-middle">
                        <i class="fas fa-sync fa-fw text-dark"></i>  
                    </div>
                </div>
                <div class="d-flex flex-column align-items-start">
                Enable Collaboration
                                <small v-if="!isAuthenticated || isAuthExpired" class="d-block text-muted">Authentication required</small>
                                </div>
                            </a>
                            </li>
                         </ul>
                     </li>
                     <li>

                     </li>
                     <!-- Export Options -->
                     <li class="dropdown-submenu">
                        <a class="dropdown-item dropdown-toggle" href="#" data-bs-toggle="dropdown">
                            <i class="fas fa-file-export me-2"></i>Export
                        </a>
                        <ul class="dropdown-menu bg-dark">
                            <li>
                                <a class="dropdown-item" href="#" @click.prevent="exportDocument('markdown')">
                                    <i class="fas fa-file-text me-2"></i>Export as Markdown
                                </a>
                            </li>
                            <li>
                                <a class="dropdown-item" href="#" @click.prevent="exportDocument('html')">
                                    <i class="fas fa-file-code me-2"></i>Export as HTML
                                </a>
                            </li>
                        </ul>
                    </li>
                    <li>
                        <hr class="dropdown-divider">
                    </li>
                    <li><a class="dropdown-item" href="#" @click.prevent="deleteDocument"
                            :class="{disabled: !canDelete }">
                            <i class="fas fa-trash me-2"></i>Delete
                        </a></li>
                    <li>
                        <hr class="dropdown-divider">
                    </li>
                    <li><a class="dropdown-item" href="#" @click.prevent="publishPost"
                            :class="{ disabled: !canPublish }">
                            <i class="fas fa-paper-plane me-2"></i>Publish to Hive
                        </a></li>
                </ul>
            </div>


        <!-- Edit Menu -->
        <div class="btn-group me-2">
            <button class="btn btn-dark no-caret dropdown-toggle" type="button" data-bs-toggle="dropdown"
                aria-expanded="false">
                <i class="fas fa-edit me-sm-1 d-none"></i><span class="">Edit</span>
            </button>
            <ul class="dropdown-menu dropdown-menu-dark bg-dark">
                <!-- Y.js Undo/Redo (TipTap Best Practice) -->
                <li><a class="dropdown-item" href="#" @click.prevent="performUndo" :class="{ disabled: !canUndo() }">
                        <i class="fas fa-undo me-2"></i>Undo
                        <small class="d-block text-muted">Cmd+Z</small>
                    </a></li>
                <li><a class="dropdown-item" href="#" @click.prevent="performRedo" :class="{ disabled: !canRedo() }">
                        <i class="fas fa-redo me-2"></i>Redo
                        <small class="d-block text-muted">Cmd+Y</small>
                    </a></li>
                <li>
                    <hr class="dropdown-divider">
                </li>
                <!-- Insert Operations -->
                <li class="dropdown-header">Insert</li>
                <li><a class="dropdown-item" href="#" @click.prevent="insertLink" :class="{ disabled: isReadOnlyMode }">
                        <i class="fas fa-link me-2"></i>Link
                    </a></li>
                <li><a class="dropdown-item" href="#" @click.prevent="insertImage" :class="{ disabled: isReadOnlyMode }">
                        <i class="fas fa-image me-2"></i>Image
                    </a></li>
                <li><a class="dropdown-item" href="#" @click.prevent="insertTable" :class="{ disabled: isReadOnlyMode }">
                        <i class="fas fa-table me-2"></i>Table
                    </a></li>
                <li>
                    <hr class="dropdown-divider">
                </li>
                <!-- View Options -->
                <li class="dropdown-header">View</li>
                <li><a class="dropdown-item" href="#" @click.prevent="showJsonPreview">
                        <i class="fas fa-code me-2"></i>JSON Preview
                    </a></li>

            </ul>
        </div>
                
        <div class=" mx-auto d-flex align-items-center">

        <!--File Status-->
        <div class="d-flex align-items-center gap-2">
            <a class="no-decoration text-muted" href="#" @click.prevent="showLoadModal = true">
                <i class="fas fa-folder-open fa-fw me-1"></i>Drafts
            </a>
            <i class="fa-solid fa-chevron-right fa-fw"></i>
            <div>
             <i class="fas fa-file fa-fw me-1"></i>
            <span v-if="currentFile" class="">
               
                <!-- Editable document name -->
                <span v-if="!isEditingDocumentName" 
                      @click="startEditingDocumentName"
                      :class="{ 'cursor-pointer text-decoration-underline': !isReadOnlyMode }"
                      :title="isReadOnlyMode ? 'Document name (read-only)' : 'Click to edit document name'"
                      class="user-select-none">
                    {{ currentFile.name || currentFile.documentName || currentFile.permlink }}
                </span>
                <!-- Document name input field -->
                <input v-else
                       ref="documentNameInput"
                       v-model="documentNameInput"
                       @keydown="handleDocumentNameKeydown"
                       @blur="saveDocumentName"
                       class="form-control form-control-sm d-inline-block bg-dark text-white border-secondary"
                       style="width: auto; min-width: 150px; max-width: 300px;"
                       placeholder="Enter document name">
                
                <!-- Permission indicator for collaborative docs -->
                <span v-if="currentFile.type === 'collaborative'" class="ms-2">
                    <span v-if="isReadOnlyMode" class="badge bg-warning text-dark">
                        <i class="fas fa-eye me-1"></i>Read-Only
                    </span>
                    <span v-else class="badge bg-success">
                        <i class="fas fa-edit me-1"></i>Editable
                    </span>
                </span>
            </span>
            <!-- Show loading state for collaborative docs during initialization -->
            <span v-else-if="isInitializing" class="">
                <span class="text-muted">
                    <i class="fas fa-spinner fa-spin me-1"></i>Loading...
                </span>
            </span>
            <span v-else class="">
                <!-- Clickable "Untitled" for new documents -->
               
                <span v-if="!isEditingDocumentName"
                      @click="startEditingDocumentName"
                      class="cursor-pointer text-decoration-underline user-select-none"
                      title="Click to name this document">Untitled - {{ new Date().toLocaleDateString() }} {{ new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }}</span>
                <!-- Document name input field for new documents -->
                <input v-else
                       ref="documentNameInput"
                       v-model="documentNameInput"
                       @keydown="handleDocumentNameKeydown"
                       @blur="saveDocumentName"
                       class="form-control form-control-sm d-inline-block bg-dark text-white border-secondary"
                       style="width: auto; min-width: 150px; max-width: 300px;"
                       placeholder="Enter document name">
            </span>
        </div>
            <div>
            </div>

            <!--Current User(in collaborative mode)-->
            <div v-if="currentFile?.type === 'collaborative'" class="d-flex align-items-center gap-1">
                <div class="position-relative">
                    <img :src="avatarUrl"
                        :alt="username"
                        class="user-avatar-small rounded-circle cursor-pointer"
                        :title="'You (' + username + ') - Click to change color'"
                        @click="toggleColorPicker"
                        @error="handleAvatarError($event, {name: username, color: getUserColor})"
                        :style="{
                            width: '24px',
                            height: '24px',
                            objectFit: 'cover',
                            border: '2px solid ' + getUserColor,
                            boxShadow: '0 0 0 1px rgba(255,255,255,0.2)'
                        }">

                        <!-- Color picker dropdown -->
                        <div v-if="showColorPicker"
                            class="box-shadow-1 position-absolute bg-dark border border-secondary rounded p-2 shadow-lg"
                            style="top: 30px; right: 0; z-index: 1000; width: 200px;">
                            <div class="mb-2">
                                <small class="text-white fw-bold">Choose your cursor color:</small>
                            </div>
                            <div class="d-flex flex-wrap gap-1 mb-2">
                                <div v-for="(color, index) in ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e']"
                                    :key="index" @click="updateUserColor(color)"
                                    class="color-swatch cursor-pointer rounded"
                                    :style="{backgroundColor: color, width: '20px', height: '20px', border: color === getUserColor ? '2px solid white' : '1px solid #ccc' }"
                                    :title="color">
                                </div>
                            </div>
                            <div class="d-flex gap-1 mb-2">
                                <input type="color" :value="getUserColor" @input="updateUserColor($event.target.value)"
                                    class="form-control form-control-sm flex-grow-1" style="height: 25px;">
                                <button @click="updateUserColor(getRandomColor())" class="btn btn-sm btn-outline-light"
                                    title="Random color">
                                    <i class="fas fa-random fa-xs"></i>
                                </button>
                            </div>
                            <button @click="showColorPicker = false" class="btn btn-sm btn-secondary w-100">
                                Done
                            </button>
                        </div>
                </div>

                <!--Other Connected Users-->
                <div v-for="user in connectedUsers.filter(u => u.id !== (provider && provider.awareness ? provider.awareness.clientID : null)).slice(0, 3)" :key="user.id"
                    class="position-relative">
                    <img :src="'https://images.hive.blog/u/' + user.name + '/avatar/small'" :alt="user.name"
                        class="user-avatar-small rounded-circle" :title="user.name + ' (ID: ' + user.id + ')'"
                        @error="handleAvatarError($event, user)" :style="{ 
                                     width: '24px', 
                                     height: '24px', 
                                     objectFit: 'cover',
                                     border: '2px solid ' + user.color,
                                     boxShadow: '0 0 0 1px rgba(255,255,255,0.2)'
                                 }">
                </div>
                <span v-if="connectedUsers.filter(u => u.id !== (provider && provider.awareness ? provider.awareness.clientID : null)).length > 3"
                    class="badge bg-light text-dark small">
                    +{{ connectedUsers.filter(u => u.id !== (provider && provider.awareness ? provider.awareness.clientID : null)).length - 3 }}
                </span>
            </div>
        </div>
    </div>

    

         <!-- Cloud Menu -->
            <div class="btn-group">
                <button class="btn btn-dark no-caret dropdown-toggle"  :style="getStatusStyle(unifiedStatusInfo.state)" type="button" data-bs-toggle="dropdown"
                    aria-expanded="false">
                        <span class="ms-1" v-html="documentTitleIndicator"></span>
                </button>
                <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end bg-dark">

                 
                    
                        <!-- Document Sharing & Collaboration -->
                     <li><a class="dropdown-item" href="#" @click.prevent="shareDocument"
                             :class="{ disabled: !canShare }">
                             <i class="fas fa-user-plus me-2"></i>Share Document
                             <small v-if="!isCollaborativeMode" class="d-block text-muted">Cloud Collaboration required</small>
                             <small v-else-if="!canShare && (!isAuthenticated || isAuthExpired)" class="d-block text-muted">Authentication required</small>
                         </a></li>
                    
                    <li><hr class="dropdown-divider"></li>

                    <!-- Document Publishing & Connection -->
                     <li v-if="currentFile?.type !== 'collaborative'">
                         <a class="dropdown-item" href="#" @click.prevent="convertToCollaborative()">
                             <i class="fas fa-cloud-upload-alt me-2"></i>Turn on Cloud Collaboration
                             <small v-if="!isAuthenticated" class="d-block text-muted">Authentication required</small>
                         </a>
                     </li>
                     <li v-else-if="connectionStatus === 'connected'">
                         <a class="dropdown-item" href="#" @click.prevent="disconnectCollaboration">
                             <i class="fas fa-unlink me-2"></i>Disconnect from Cloud
                         </a>
                     </li>
                     <li v-else-if="currentFile?.type === 'collaborative' && (connectionStatus === 'disconnected' || connectionStatus === 'offline')">
                         <a class="dropdown-item text-warning" href="#" @click.prevent="reconnectToCollaborativeDocument()">
                             <i class="fas fa-plug me-2"></i>Reconnect to Cloud
                             <small class="d-block text-muted">Working offline - changes saved locally</small>
                         </a>
                     </li>
                     
                     <li><hr class="dropdown-divider"></li>


                     <!-- Authentication Status -->
                     <li class="d-none dropdown-header d-flex align-items-center justify-content-between">
                        <span>Authentication Status</span>
                        <span v-if="!isAuthenticated || isAuthExpired" class="badge bg-warning text-dark">
                            <i class="fas fa-key me-1"></i>{{ isAuthExpired ? 'Expired' : 'Required' }}
                        </span>
                        <span v-else class="badge bg-success">
                            <i class="fas fa-check me-1"></i>Authenticated
                        </span>
                    </li>
                    
                    <!-- Authentication Actions -->
                    <li class="d-none" v-if="!isAuthenticated || isAuthExpired">
                        <a class="dropdown-item text-warning fw-bold" href="#" @click.prevent="requestAuthentication">
                            <i class="fas fa-key me-2"></i>{{ isAuthExpired ? 'Re-authenticate' : 'Authenticate Now' }}
                        </a>
                    </li>
                    <li v-else>
                        <a class="dropdown-item text-muted" href="#" @click.prevent="requestAuthentication">
                            <i class="fas fa-redo me-2"></i>Refresh Authentication
                        </a>
                    </li>
                    
                    <li><hr class="dropdown-divider"></li>
                    
                    <!-- Saving Status Indicator -->
                    <li class="px-3 pt-1">
                        <div class="d-flex align-items-center">
                            <i :class="getStatusIconClass(unifiedStatusInfo.state)" class="me-2 small"></i>
                            <span :class="getStatusTextClass(unifiedStatusInfo.state)" class="small fw-medium">
                                 {{ unifiedStatusInfo.message }}
                            </span>
                        </div>
                        <p class="small text-white-50 mb-2">{{ unifiedStatusInfo.details }}</p>
                        <div v-if="unifiedStatusInfo.actions.length" class="d-flex gap-1">
                            <button 
                              v-for="action in unifiedStatusInfo.actions" 
                              :key="action.label"
                              @click.stop="handleStatusAction(action)"
                              class="btn btn-sm btn-outline-light">
                              {{ action.label }}
                            </button>
                        </div>
                     </li>
                                                  
                </ul>
            </div>
        

</div>


    <!-- Read-Only Mode Warning Banner -->
    <div v-if="isReadOnlyMode" class="alert alert-info border-info bg-dark text-info d-flex align-items-center mx-2 mb-3">
        <i class="fas fa-eye me-2"></i>
        <div class="flex-grow-1">
            <strong>Read-Only Mode</strong> - You can view this document but cannot make changes. 
            Contact <strong>@{{ currentFile?.owner }}</strong> for edit permissions.
        </div>
    </div>

    <div class="d-flex flex-column gap-4 mx-2">
        <!-- Title Field -->
        <div class="">
            <label class="form-label text-white fw-bold d-none">
                <i class="fas fa-heading me-2"></i>Title
                <span class="badge bg-primary ms-2" v-if="isConnected">Collaborative</span>
            </label>
            <div class="editor-field bg-dark border border-secondary rounded">
                <div ref="titleEditor" class="title-editor"></div>
            </div>
            <!-- Auto-generated permlink display -->
            <div v-if="generatedPermlink" class="mt-2 text-start">
                <small class="text-muted font-monospace">/@{{ username }}/{{ generatedPermlink }}</small>
            </div>
        </div>

        <!--Body Field-->
        <div class="">
            <label class="form-label text-white fw-bold d-none">
                <i class="fas fa- me-2"></i>Body
                <span class="badge bg-primary ms-2" v-if="isConnected">Collaborative</span>
            </label>

            <!-- WYSIWYG Toolbar -->
            <div class="editor-toolbar bg-dark border border-secondary rounded-top" 
                 :class="{ 'opacity-50': isReadOnlyMode }"
                 :style="{ pointerEvents: isReadOnlyMode ? 'none' : 'auto' }">
                <div class="d-flex flex-wrap gap-1 align-items-center">
                    <div v-if="isReadOnlyMode" class="small text-muted me-2">
                        <i class="fas fa-eye me-1"></i>Read-only mode
                    </div>
                    <!-- Text Formatting -->
                    <div class="" role="group">
                        <button @click="bodyEditor?.chain().focus().toggleBold().run()"
                            :class="{active: bodyEditor?.isActive('bold') }" 
                            :disabled="isReadOnlyMode"
                            class="btn btn-sm btn-dark" type="button"
                            title="Bold">
                            <i class="fas fa-bold"></i>
                        </button>
                        <button @click="bodyEditor?.chain().focus().toggleItalic().run()"
                            :class="{active: bodyEditor?.isActive('italic') }" 
                            :disabled="isReadOnlyMode"
                            class="btn btn-sm btn-dark" type="button"
                            title="Italic">
                            <i class="fas fa-italic"></i>
                        </button>
                        <button @click="bodyEditor?.chain().focus().toggleStrike().run()"
                            :class="{active: bodyEditor?.isActive('strike') }" 
                            :disabled="isReadOnlyMode"
                            class="btn btn-sm btn-dark" type="button"
                            title="Strikethrough">
                            <i class="fas fa-strikethrough"></i>
                        </button>
                        <button @click="bodyEditor?.chain().focus().toggleCode().run()"
                            :class="{active: bodyEditor?.isActive('code') }" 
                            :disabled="isReadOnlyMode"
                            class="btn btn-sm btn-dark" type="button"
                            title="Inline Code">
                            <i class="fas fa-code"></i>
                        </button>
                    </div>

                    <div class="vr"></div>

                    <!--Headings -->
                    <div class="" role="group">
                        <button @click="bodyEditor?.chain().focus().toggleHeading({ level: 1 }).run()"
                            :class="{ active: bodyEditor?.isActive('heading', { level: 1 }), 'btn btn-sm btn-dark': true }"
                            type="button" title="Heading 1">
                            H1
                        </button>
                        <button @click="bodyEditor?.chain().focus().toggleHeading({ level: 2 }).run()"
                            :class="{ active: bodyEditor?.isActive('heading', { level: 2 }), 'btn btn-sm btn-dark': true }"
                            type="button" title="Heading 2">
                            H2
                        </button>
                        <button @click="bodyEditor?.chain().focus().toggleHeading({ level: 3 }).run()"
                            :class="{ active: bodyEditor?.isActive('heading', { level: 3 }), 'btn btn-sm btn-dark': true }"
                            type="button" title="Heading 3">
                            H3
                        </button>
                    </div>

                    <div class="vr"></div>

                    <!--Lists -->
                    <div class="" role="group">
                        <button @click="bodyEditor?.chain().focus().toggleBulletList().run()"
                            :class="{ active: bodyEditor?.isActive('bulletList') }" class="btn btn-sm btn-dark"
                            type="button" title="Bullet List">
                            <i class="fas fa-list-ul"></i>
                        </button>
                        <button @click="bodyEditor?.chain().focus().toggleOrderedList().run()"
                            :class="{ active: bodyEditor?.isActive('orderedList'), 'btn btn-sm btn-dark': true }"
                            type="button" title="Numbered List">
                            <i class="fas fa-list-ol"></i>
                        </button>
                    </div>

                    <div class="vr"></div>

                    <!--Block Elements-->
                    <div class="" role="group">
                        <button @click="bodyEditor?.chain().focus().toggleBlockquote().run()"
                            :class="{ active: bodyEditor?.isActive('blockquote') }" class="btn btn-sm btn-dark"
                            type="button" title="Quote">
                            <i class="fas fa-quote-left"></i>
                        </button>
                        <button @click="bodyEditor?.chain().focus().toggleCodeBlock().run()"
                            :class="{ active: bodyEditor?.isActive('codeBlock'), 'btn btn-sm btn-dark': true }"
                            type="button" title="Code Block">
                            <i class="fas fa-terminal"></i>
                        </button>
                        <button @click="bodyEditor?.chain().focus().setHorizontalRule().run()"
                            class="btn btn-sm btn-dark" type="button" title="Horizontal Rule">
                            <i class="fas fa-minus"></i>
                        </button>
                    </div>

                    <div class="vr d-none"></div>

                    <!--Actions -->
                    <div class="d-none" role="group">
                        <button @click="bodyEditor?.chain().focus().undo().run()" :disabled="!bodyEditor?.can().undo"
                            class="btn btn-sm btn-dark" type="button" title="Undo">
                            <i class="fas fa-undo"></i>
                        </button>
                        <button @click="bodyEditor?.chain().focus().redo().run()" :disabled="!bodyEditor?.can().redo"
                            class="btn btn-sm btn-dark" type="button" title="Redo">
                            <i class="fas fa-redo"></i>
                        </button>
                    </div>

                    <div class="vr"></div>

                    <!--Insert -->
                    <div class="" role="group">
                        <button @click="insertLink" class="btn btn-sm btn-dark" type="button" title="Insert Link">
                            <i class="fas fa-link"></i>
                        </button>
                        <button @click="insertImage" class="btn btn-sm btn-dark" type="button" title="Insert Image">
                            <i class="fas fa-image"></i>
                        </button>
                        <button @click="insertTable" class="btn btn-sm btn-dark" type="button" title="Insert Table">
                            <i class="fas fa-table"></i>
                        </button>
                    </div>
                </div>
            </div>

            <div class="editor-field bg-dark border border-secondary border-top-0 rounded-bottom">
                <div ref="bodyEditor" class="body-editor"></div>
            </div>
            <small class="text-muted">Full WYSIWYG editor with markdown export support. Supports &lt;center&gt;,
                &lt;video&gt;, and other HTML tags.</small>
        </div>

        <!--Tags Field-->
        <div class="">
            <label class="form-label text-white fw-bold d-none">
                <i class="fas fa-tags me-2"></i>Tags
            </label>
            <div class="d-flex flex-wrap align-items-center gap-2">
                <!-- Add tag input (floating left) -->
                <div class="input-group" style="width: 200px;">
                    <input v-model="tagInput" @keydown.enter="addTag"
                        class="form-control form-control-sm bg-dark text-white border-secondary"
                        placeholder="Add a tag..." maxlength="50" 
                        :disabled="displayTags.length >= 10 || isReadOnlyMode">
                    <button @click="addTag" class="btn btn-sm btn-outline-primary"
                        :disabled="displayTags.length >= 10 || !tagInput.trim() || isReadOnlyMode">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>

                <!-- Current tags -->
                <span v-for="(tag, index) in displayTags" :key="index"
                    class="badge bg-primary d-flex align-items-center">
                    {{ tag }}
                    <button @click="removeTag(index)" class="btn-close btn-close-white ms-2 small"
                        :disabled="isReadOnlyMode" :style="{ display: isReadOnlyMode ? 'none' : 'block' }"></button>
                </span>
            </div>
            <small v-if="displayTags.length >= 10" class="text-warning">
                Maximum 10 tags allowed
            </small>
            <small v-if="isReadOnlyMode" class="text-info d-block mt-1">
                <i class="fas fa-eye me-1"></i>Read-only mode: Tags are personal publishing settings and cannot be modified.
            </small>
            <small v-else-if="currentFile?.type === 'collaborative'" class="text-info d-block mt-1">
                <i class="fas fa-info-circle me-1"></i>Tags are personal to you and control how YOU would publish this content to Hive.
            </small>
        </div>

        <!--Advanced Options Collapsible-->
        <div class="mb-3">
            <button class="btn btn-lg p-2 btn-secondary bg-card d-flex align-items-center w-100 text-start"
                type="button" data-bs-toggle="collapse" data-bs-target="#advancedOptions" aria-expanded="false"
                aria-controls="advancedOptions">
                <i class="fas fa-cog me-2"></i>
                Advanced Options
                <span v-if="isReadOnlyMode" class="badge bg-info text-white ms-2">Personal Settings</span>
                <i class="fas fa-chevron-down ms-auto"></i>
            </button>

            <div class="collapse mt-3" id="advancedOptions">
                <!-- Personal settings notice for collaborative docs -->
                <div v-if="isReadOnlyMode" class="alert alert-info border-info bg-dark text-info mb-3">
                    <i class="fas fa-user-cog me-2"></i>
                    <strong>Personal Publishing Settings (Read-Only)</strong>
                    <div class="small mt-1">These settings are personal to you and don't affect the collaborative document content. You have read-only access to this document, so these settings cannot be modified.</div>
                </div>
                
                <!-- Permlink Field -->
                <div class="">
                    <label class="form-label text-white fw-bold d-none">
                        <i class="fas fa-link me-2"></i>URL Slug (Permlink)
                        <span class="badge bg-secondary ms-2">Local Only</span>
                    </label>
                    <div class="d-flex align-items-center gap-2 mb-2">
                        <code class="text-info">/@{{ username }}/</code>
                        <div class="flex-grow-1 position-relative">
                            <div v-if="!showPermlinkEditor || isReadOnlyMode" @click="!isReadOnlyMode && togglePermlinkEditor"
                                class="bg-dark border border-secondary rounded p-2 text-white font-monospace"
                                :class="{ 'cursor-pointer': !isReadOnlyMode, 'opacity-75': isReadOnlyMode }">
                                {{ content.permlink || generatedPermlink || 'Click to edit...' }}
                            </div>
                            <div v-else class="editor-field bg-dark border border-secondary rounded">
                                <div ref="permlinkEditor" class="permlink-editor"></div>
                            </div>
                        </div>
                        <button @click="useGeneratedPermlink" class="btn btn-sm btn-outline-secondary"
                            :disabled="!generatedPermlink || isReadOnlyMode">
                            Auto-generate
                        </button>
                    </div>
                    <small class="text-muted">
                        URL-safe characters only (a-z, 0-9, dashes). Not synchronized in collaborative mode.
                        <span v-if="isReadOnlyMode" class="text-warning"> (Read-only access)</span>
                    </small>
                </div>
                <!-- Beneficiaries Section -->
                <div class="mb-4">
                    <label class="form-label text-white fw-bold">
                        <i class="fas fa-users me-2"></i>Beneficiaries (Reward Sharing)
                        <span v-if="isReadOnlyMode" class="badge bg-warning text-dark ms-2">Read-Only</span>
                    </label>
                    <div class="bg-dark border border-secondary rounded p-3"
                        :class="{ 'opacity-75': isReadOnlyMode }">
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle me-2"></i>
                            <small>Configure reward sharing with other accounts. Total cannot exceed 100%.
                                <span v-if="isReadOnlyMode" class="text-warning d-block mt-1">
                                    <i class="fas fa-lock me-1"></i>Read-only mode: Cannot modify beneficiaries.
                                </span>
                            </small>
                        </div>
                        <div class="d-flex align-items-center gap-2 mb-2">
                            <input type="text" class="form-control bg-dark text-white border-secondary"
                                placeholder="@username" v-model="beneficiaryInput.account"
                                :disabled="isReadOnlyMode">
                            <input type="number" class="form-control bg-dark text-white border-secondary"
                                placeholder="%" min="0.01" max="100" step="0.01" v-model="beneficiaryInput.percent"
                                :disabled="isReadOnlyMode">
                            <button @click="addBeneficiary" class="btn btn-outline-success"
                                :disabled="isReadOnlyMode">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                        <div v-if="displayBeneficiaries.length > 0" class="mt-2">
                            <div v-for="(ben, index) in displayBeneficiaries" :key="index"
                                class="d-flex align-items-center justify-content-between bg-secondary rounded p-2 mb-1">
                                <span>@{{ ben.account }} - {{ (ben.weight / 100).toFixed(2) }}%</span>
                                <button @click="removeBeneficiary(index)" class="btn btn-sm btn-outline-danger"
                                    :disabled="isReadOnlyMode" v-show="!isReadOnlyMode">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!--Custom JSON Section-->
                <div class="mb-4">
                    <label class="form-label text-white fw-bold">
                        <i class="fas fa-code me-2"></i>Custom JSON Metadata
                        <span v-if="isReadOnlyMode" class="badge bg-warning text-dark ms-2">Read-Only</span>
                    </label>
                    <div class="bg-dark border border-secondary rounded p-3"
                        :class="{ 'opacity-75': isReadOnlyMode }">
                        <textarea v-model="customJsonString" @input="handleCustomJsonInput"
                            class="form-control bg-dark text-white border-secondary font-monospace" rows="6"
                            placeholder="Enter custom JSON metadata..."
                            :disabled="isReadOnlyMode"></textarea>
                        <div v-if="customJsonError" class="text-danger small mt-1">
                            <i class="fas fa-exclamation-triangle me-1"></i>{{ customJsonError }}
                        </div>
                        <div v-else-if="customJsonString" class="text-success small mt-1">
                            <i class="fas fa-check-circle me-1"></i>Valid JSON
                        </div>
                        <small class="text-muted">
                            Additional metadata for your post. Must be valid JSON.
                            <span v-if="isReadOnlyMode" class="text-warning d-block mt-1">
                                <i class="fas fa-lock me-1"></i>Read-only mode: Cannot modify custom JSON.
                            </span>
                        </small>
                    </div>
                </div>

                <!--Comment Options(Hive - specific)-->
                <div class="mb-4">
                    <label class="form-label text-white fw-bold">
                        <i class="fas fa-cog me-2"></i>Comment Options
                        <span v-if="isReadOnlyMode" class="badge bg-warning text-dark ms-2">Read-Only</span>
                    </label>
                    <div class="bg-dark border border-secondary rounded p-3"
                        :class="{ 'opacity-75': isReadOnlyMode }">
                        <div v-if="isReadOnlyMode" class="alert alert-warning mb-3">
                            <i class="fas fa-lock me-2"></i>
                            <small>Read-only mode: Comment options cannot be modified.</small>
                        </div>
                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" v-model="commentOptions.allowVotes"
                                        @change="handleCommentOptionChange" id="allowVotes"
                                        :disabled="isReadOnlyMode">
                                    <label class="form-check-label text-white" for="allowVotes">
                                        Allow votes
                                    </label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox"
                                        v-model="commentOptions.allowCurationRewards" @change="handleCommentOptionChange" id="allowCurationRewards"
                                        :disabled="isReadOnlyMode">
                                    <label class="form-check-label text-white" for="allowCurationRewards">
                                        Allow curation rewards
                                    </label>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox"
                                        v-model="commentOptions.maxAcceptedPayout" @change="handleCommentOptionChange" id="maxPayout"
                                        :disabled="isReadOnlyMode">
                                    <label class="form-check-label text-white" for="maxPayout">
                                        Decline payout
                                    </label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" v-model="commentOptions.percentHbd"
                                        @change="handleCommentOptionChange" id="powerUp"
                                        :disabled="isReadOnlyMode">
                                    <label class="form-check-label text-white" for="powerUp">
                                        100% Power Up
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- JSON Preview Section -->
                <div class="mb-4">
                    <label class="form-label text-white fw-bold">
                        <i class="fas fa-code me-2"></i>JSON Preview & Validation
                    </label>
                    <div class="bg-dark border border-secondary rounded p-3">
                        <div class="d-flex align-items-center justify-content-between mb-2">
                            <div class="text-muted small">
                                <i class="fas fa-info-circle me-1"></i>
                                Preview the complete Hive JSON structure that will be broadcast
            </div>
                            <button @click="showJsonPreview" class="btn btn-outline-info btn-sm">
                                <i class="fas fa-eye me-1"></i>Preview JSON
                            </button>
                        </div>
                        <div class="small text-muted">
                            View formatted comment operations, validate Hive compliance, and copy JSON for debugging.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<!-- teleport TipTap Modals to new index.html body -->
<teleport to="body">
<!--Publish Modal-->
<div v-if="showPublishModal" class="modal fade show d-block" style="background: rgba(0,0,0,0.5)">
    <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content bg-dark text-white">
            <div class="modal-header border-secondary">
                <h5 class="modal-title">
                    <i class="fas fa-paper-plane me-2"></i>Publish Post to Hive
                </h5>
                <button @click="showPublishModal = false" class="btn-close btn-close-white"></button>
            </div>
            <div class="modal-body">
                <div class="mb-4">
                    <h6 class="text-info">{{ content.title || 'Untitled Post' }}</h6>
                    <p class="text-muted">
                        <i class="fas fa-tags me-1"></i>{{ displayTags.join(', ') || 'No tags' }}
                    </p>
                    <p class="text-muted">
                        <i class="fas fa-link me-1"></i>/@{{ username }}/{{ content.permlink || generatedPermlink }}
                    </p>
                </div>

                <div class="row">
                    <div class="col-md-6">
                        <h6 class="text-white">Beneficiaries</h6>
                                            <div v-if="displayBeneficiaries.length === 0" class="text-muted small">
                            No beneficiaries set - 100% rewards to author
                        </div>
                        <div v-else>
                        <div v-for="ben in displayBeneficiaries" :key="ben.account"
                                class="d-flex justify-content-between small mb-1">
                                <span>@{{ ben.account }}</span>
                                <span>{{ (ben.weight / 100).toFixed(2)}}%</span>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <h6 class="text-white">Comment Options</h6>
                        <div class="small">
                            <div><i class="fas fa-vote-yea me-1"></i>Votes: {{ commentOptions.allowVotes ? 'Allowed' :
                                'Disabled' }}</div>
                            <div><i class="fas fa-coins me-1"></i>Curation: {{ commentOptions.allowCurationRewards ?
                                'Enabled' : 'Disabled' }}</div>
                            <div><i class="fas fa-money-bill me-1"></i>Payout: {{ commentOptions.maxAcceptedPayout ?
                                'Declined' : 'Enabled' }}</div>
                            <div><i class="fas fa-bolt me-1"></i>Power Up: {{ commentOptions.percentHbd ? '100%' :
                                '50/50 Split' }}</div>
                        </div>
                    </div>
                </div>

                <div class="mb-3">
                    <label class="form-label">Beneficiaries (Optional)</label>
                    <div class="form-text">Set accounts to receive a percentage of rewards</div>
                    <!-- Beneficiaries input would go here -->
                </div>

                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    This will publish your post to the Hive blockchain. Make sure all content is final.
                </div>
            </div>
            <div class="modal-footer border-secondary">
                <button @click="showPublishModal = false" class="btn btn-secondary">Cancel</button>
                <button @click="performPublish" class="btn btn-primary" :disabled="publishing || !canPublish">
                    <i v-if="publishing" class="fas fa-spinner fa-spin me-1"></i>
                    <i v-else class="fas fa-paper-plane me-1"></i>
                    {{ publishing? 'Publishing...': 'Publish to Hive' }}
                </button>
            </div>
        </div>
    </div>
</div>

<!--Load Modal-->
<div v-if="showLoadModal" class="modal fade show d-block" style="background: rgba(0,0,0,0.5)">
    <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content bg-dark text-white">
            <div class="modal-header border-secondary">
                <h5 class="modal-title">
                    <i class="fas fa-folder-open me-2"></i>Saved Drafts
                    <small v-if="autoRefreshTimer" class="text-muted ms-2">
                        <i class="fas fa-sync-alt fa-spin"></i> Auto-refreshing
                    </small>
                </h5>
                <button @click="showLoadModal = false" class="btn-close btn-close-white"></button>
            </div>
            <div class="modal-body p-1">
                <!-- Auth prompt if needed -->
                <div v-if="!isAuthenticated || isAuthExpired"
                    class="text-center py-4 border border-secondary rounded mb-3 p-1">
                    <div class="text-muted mb-2">
                        <i class="fas fa-lock fa-2x mb-2"></i>
                        <p>{{ isAuthExpired ? 'Authentication expired' : 'Authentication required' }}</p>
                    </div>
                    <button @click="requestAuthentication(); showLoadModal = false" class="btn btn-primary btn-sm">
                        <i class="fas fa-key me-1"></i>Authenticate for Collaboration
                    </button>
                </div>

                <!-- Table of documents -->
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <div class="d-flex align-items-center gap-3">
                        <h6 class="mb-0 ms-2"><i class="fas fa-list me-2 d-none"></i>All Drafts</h6>
                        <div class="d-flex align-items-center gap-3 small text-muted">
                            <span><span class="d-inline-block me-2"
                                    style="width: 8px; height: 0.75rem; background-color: #5C94FE; vertical-align: middle;"></span>
                                Collaborative</span>
                            <span><span class="d-inline-block me-2"
                                    style="width: 8px; height: 0.75rem; background-color: #6c757d; vertical-align: middle;"></span>
                                Local</span>


                        </div>
                    </div>
                    <div class="d-flex gap-2">
                        <button @click="refreshDocumentLists" class="btn btn-sm btn-outline-primary" 
                            :disabled="loadingDocs" title="Refresh document list">
                            <i class="fas" :class="loadingDocs ? 'fa-spinner fa-spin' : 'fa-sync-alt'"></i>
                            <span class="d-none d-sm-inline ms-1">{{ loadingDocs ? 'Refreshing...' : 'Refresh' }}</span>
                        </button>
                    <button v-if="localFiles.length > 0" @click="clearAllLocalFiles"
                        class="btn btn-sm btn-outline-danger">
                        <i class="fas fa-trash me-1"></i>Clear All Local Files
                    </button>
                        <button v-if="ownedCloudFiles.length > 0" @click="clearAllCloudFiles"
                            class="btn btn-sm btn-outline-warning">
                            <i class="fas fa-cloud me-1"></i>Clear My Cloud Files
                    </button>
                    </div>
                </div>

                <div v-if="loadingDocs && isAuthenticated" class="text-center py-4">
                    <i class="fas fa-spinner fa-spin fa-lg"></i><span class="ms-2">Loading documents...</span>
                </div>
                <div v-else-if="allDocuments.length === 0"
                    class="text-muted text-center py-4 border border-secondary rounded">
                    No documents found.
                </div>
                <div v-else class="table-responsive">
                    <table class="table table-hover table-dark align-middle mb-0 ">
                        <thead>
                            <tr>
                                <th scope="col" style="width: 30%;">Name</th>
                                <th scope="col" style="width: 15%;">Status</th>
                                <th scope="col">Details</th>
                                <th scope="col">Your Access</th>
                                <th scope="col">Last Modified</th>
                                <th scope="col" class="text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="file in allDocuments" :key="file.id || file.documentPath || (file.owner + '_' + file.permlink)"
                                class="unified-document-row">
                                <!-- Document Name -->
                                <td @click="file.preferredType === 'collaborative' ? loadDocument(file) : loadLocalDocument(file)" class="cursor-pointer">
                                    <strong class="d-block text-white">{{ file.name || file.documentName || file.permlink }}</strong>
                                    <small v-if="file.hasCloudVersion && file.documentName && file.documentName !== file.permlink" class="text-muted">{{ file.permlink }}</small>
                                </td>
                                
                                <!-- Unified Status Indicators -->
                                <td @click="file.preferredType === 'collaborative' ? loadDocument(file) : loadLocalDocument(file)" class="cursor-pointer">
                                    <div class="d-flex align-items-center gap-2">
                                        <!-- Local Status Indicator -->
                                        <div v-if="file.hasLocalVersion" class="status-indicator" :title="getLocalStatusTitle(file.localStatus)">
                                            <i class="fas fa-hdd" :class="getLocalStatusClass(file.localStatus)"></i>
                                        </div>
                                        <div v-else class="status-indicator text-muted" title="Not saved locally">
                                            <i class="fas fa-hdd opacity-25"></i>
                                        </div>
                                        
                                        <!-- Cloud Status Indicator -->
                                        <div v-if="file.hasCloudVersion" class="status-indicator" :title="getCloudStatusTitle(file.cloudStatus)">
                                            <i class="fas fa-cloud" :class="getCloudStatusClass(file.cloudStatus)"></i>
                                        </div>
                                        <div v-else class="status-indicator text-muted" title="Not in cloud">
                                            <i class="fas fa-cloud opacity-25"></i>
                                        </div>
                                        
                                        <!-- Unsaved Changes Indicator -->
                                        <div v-if="hasUnsavedChangesForDocument(file)" class="status-indicator text-warning" title="Has unsaved changes">
                                            <i class="fas fa-circle fa-xs"></i>
                                        </div>
                                    </div>
                                </td>
                                
                                <!-- Details -->
                                <td @click="file.preferredType === 'collaborative' ? loadDocument(file) : loadLocalDocument(file)" class="cursor-pointer">
                                    <small v-if="file.hasLocalVersion && !file.hasCloudVersion" class="text-muted">{{ formatFileSize(file.size) }}</small>
                                    <small v-else-if="file.hasCloudVersion" class="text-muted">by @{{ file.owner }}</small>
                                    <small v-else class="text-muted">Unknown</small>
                                </td>
                                
                                <!-- Access Level -->
                                <td @click="file.preferredType === 'collaborative' ? loadDocument(file) : loadLocalDocument(file)" class="cursor-pointer">
                                    <span class="badge" 
                                        :class="'bg-' + getPermissionDisplayInfo(getUserPermissionLevel(file)).color"
                                        :title="getPermissionDisplayInfo(getUserPermissionLevel(file)).description">
                                        <i :class="getPermissionDisplayInfo(getUserPermissionLevel(file)).icon" class="me-1"></i>
                                        {{ getPermissionDisplayInfo(getUserPermissionLevel(file)).label }}
                                    </span>
                                </td>
                                
                                <!-- Last Modified -->
                                <td @click="file.preferredType === 'collaborative' ? loadDocument(file) : loadLocalDocument(file)" class="cursor-pointer">
                                    <small>{{ formatFileDate(file.lastModified || file.updatedAt) }}</small>
                                </td>
                                
                                <!-- Actions -->
                                <td class="text-end">
                                    <!-- Load Button - Always uses preferred type -->
                                    <button @click.stop="file.preferredType === 'collaborative' ? loadDocument(file) : loadLocalDocument(file)" 
                                        class="btn btn-sm btn-outline-light me-1"
                                        :title="'Load document' + (file.preferredType === 'collaborative' ? ' (collaborative mode)' : ' (local mode)')">
                                        <i class="fas fa-folder-open"></i>
                                    </button>
                                    
                                    <!-- Delete Button - Show for local files or owned cloud files -->
                                    <button v-if="file.hasLocalVersion && !file.hasCloudVersion" 
                                        @click.stop="deleteLocalFileWithConfirm(file.localFile)"
                                        class="btn btn-sm btn-outline-danger" title="Delete local file">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                    <button v-else-if="file.hasCloudVersion && file.owner === authHeaders['x-account']"
                                        @click.stop="deleteCollaborativeDocWithConfirm(file.cloudFile)"
                                        class="btn btn-sm btn-outline-danger"
                                        title="Delete cloud document">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                    <button v-else-if="file.hasCloudVersion"
                                        class="btn btn-sm btn-outline-danger opacity-50"
                                        disabled
                                        title="Only document owner can delete">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="modal-footer border-secondary">
                <button @click="showLoadModal = false" class="btn btn-secondary">Close</button>
            </div>
        </div>
    </div>
</div>

<!--Save Modal-->
<div v-if="showSaveModal" class="modal fade show d-block" style="background: rgba(0,0,0,0.5)">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">
                    <i class="fas fa-save me-2"></i>{{ saveForm.isNewDocument ? 'Save As...' : 'Save Document'
                    }}
                </h5>
                <button @click="showSaveModal = false" class="btn-close" :disabled="saveAsProcess.inProgress"></button>
            </div>
            <div class="modal-body">
                <!-- Save As Progress Indicator -->
                <div v-if="saveAsProcess.inProgress" class="mb-4">
                    <div class="alert alert-primary d-flex align-items-center">
                        <div class="me-3">
                            <i class="fas fa-spinner fa-spin fa-lg"></i>
                        </div>
                        <div class="flex-grow-1">
                            <h6 class="mb-1">Saving Document to Collaboration Server</h6>
                            <div class="progress mb-2" style="height: 4px;">
                                <div class="progress-bar progress-bar-striped progress-bar-animated"
                                    :style="{width: saveAsProgress + '%' }"></div>
                            </div>
                            <small class="text-muted">{{ saveAsProcess.message }}</small>
                        </div>
                    </div>

                    <!-- Error Display -->
                    <div v-if="saveAsProcess.error" class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        <strong>Save failed:</strong> {{ saveAsProcess.error }}
                        <div class="mt-2">
                            <small>Local backup has been preserved and added to pending uploads.</small>
                        </div>
                    </div>
                </div>

                <!-- Regular Save Form (hidden during save as process) -->
                <div v-if="!saveAsProcess.inProgress">
                    <div class="mb-3">
                        <label class="form-label">
                            {{ saveForm.storageType === 'cloud' ? 'Document Name' : 'Filename' }}
                            <span v-if="saveForm.storageType === 'cloud'" class="small text-muted">(Display name for
                                collaborative document)</span>
                        </label>
                        <input v-model="saveForm.filename" class="form-control bg-dark"
                            :placeholder="saveForm.storageType === 'cloud' ? 'Enter document name...' : 'Enter filename...'"
                            @keyup.enter="performSave">
                        <div v-if="saveForm.storageType === 'cloud'" class="form-text">
                            <small class="text-muted">
                                <i class="fas fa-info-circle me-1"></i>
                                A unique technical ID will be auto-generated for this document
                            </small>
                        </div>
                    </div>

                    <div class="mb-3">
                        <div class="form-check">
                            <input v-model="saveForm.storageType" class="form-check-input" type="radio"
                                id="saveLocally" value="local">
                            <label class="form-check-label" for="saveLocally">
                                <i class="fas fa-file ms-1 me-1 fa-fw"></i>Save locally
                            </label>
                        </div>
                        <div class="form-check">
                            <input v-model="saveForm.storageType" class="form-check-input" type="radio"
                                id="saveToDlux" value="cloud">
                            <label class="form-check-label" for="saveToDlux">
                                <i class="fas fa-cloud ms-1 me-1 fa-fw"></i>Save to DLUX for collaboration
                            </label>
                        </div>
                        <div v-if="saveForm.storageType === 'cloud' && (!isAuthenticated || isAuthExpired)"
                            class="alert alert-warning mt-3">
                            <div class="d-flex align-items-center mb-2">
                                <i class="fas fa-exclamation-triangle me-2"></i>
                                <strong>Authentication Required</strong>
                            </div>
                            <p class="mb-2">You need to authenticate with Hive to save documents to the cloud.</p>
                            <button @click="requestAuthentication()" 
                                class="btn btn-primary btn-sm">
                                <i class="fas fa-key me-2"></i>Authenticate with Hive
                            </button>
                        </div>
                    </div>

                    <div v-if="saveForm.storageType === 'cloud'" class="mb-3">
                        <div class="form-check">
                            <input v-model="saveForm.isPublic" class="form-check-input" type="checkbox" id="isPublic">
                            <label class="form-check-label" for="isPublic">
                                Make publicly discoverable
                            </label>
                        </div>
                        <div class="mt-2">
                            <label class="form-label">Description</label>
                            <textarea v-model="saveForm.description" class="form-control" rows="2"
                                placeholder="Brief description of the document"></textarea>
                        </div>
                        <div v-if="!saveForm.isNewDocument && currentFile?.type === 'collaborative'"
                            class="alert alert-warning small mt-2">
                            <i class="fas fa-edit me-1"></i>
                            <strong>Rename Document:</strong>
                            This will change the display name of the current collaborative document. The
                            technical document ID will remain the same.
                        </div>
                        <div v-else-if="saveForm.isNewDocument && saveForm.storageType === 'cloud'"
                            class="alert alert-info small mt-2">
                            <i class="fas fa-info-circle me-1"></i>
                            <strong>{{ saveForm.filename ? 'Save As' : 'New Collaborative Document' }}:</strong>
                            This will create a new collaborative document with a unique auto-generated ID.
                            {{ documentCreationMessage }}
                        </div>
                        <div v-else class="alert alert-info small mt-2">
                            <i class="fas fa-info-circle me-1"></i>
                            Collaborative documents are automatically deleted after 30 days of inactivity.
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button @click="showSaveModal = false" class="btn btn-secondary" :disabled="saveAsProcess.inProgress">
                    {{ cancelButtonText }}
                </button>
                <button @click="performSave" class="btn btn-primary" :disabled="saveButtonDisabled">
                    <i v-if="saving || saveAsProcess.inProgress" class="fas fa-spinner fa-spin me-1"></i>
                    <i v-else class="fas fa-save me-1"></i>
                    {{ saveButtonText }}
                </button>
            </div>
        </div>
    </div>
</div>

<!--Share Modal-->
<div v-if="showShareModal" class="modal fade show d-block" style="background: rgba(0,0,0,0.5)">
    <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">
                    <i class="fas fa-share me-2"></i>Share Document
                </h5>
                <button @click="showShareModal = false" class="btn-close"></button>
            </div>
            <div class="modal-body">
                <!-- Current Permissions -->
                <div class="mb-4">
                    <h6 class="fw-bold mb-3">Current Access</h6>

                    <!-- Document Owner -->
                    <div class="d-flex align-items-center justify-content-between p-2 bg-darkg rounded mb-2">
                        <div class="d-flex align-items-center">
                            <img :src="ownerAvatarUrl"
                                :alt="currentFile?.owner"
                                class="user-avatar rounded-circle me-2"
                                style="width: 40px; height: 40px; object-fit: cover;"
                                @error="handleOwnerAvatarError">
                            <div class="user-avatar-fallback me-2"
                                :style="{backgroundColor: generateUserColor(currentFile?.owner || '') }"
                                style="display: none; width: 40px; height: 40px; border-radius: 50%; align-items: center; justify-content: center; font-size: 1rem; font-weight: bold; color: white;">
                                {{ currentFile?.owner?.charAt(0).toUpperCase()}}
                            </div>
                            <div>
                                <strong>@{{ currentFile?.owner}}</strong>
                                <div class="text-muted small">Owner</div>
                            </div>
                        </div>
                        <span class="badge bg-success">Full Access</span>
                    </div>

                    <!-- Loading State -->
                    <div v-if="loadingPermissions" class="text-center py-2">
                        <i class="fas fa-spinner fa-spin me-2"></i>Loading permissions...
                    </div>

                    <!-- Shared Users -->
                    <div v-else-if="documentPermissions.length === 0" class="text-muted text-center py-3">
                        <i class="fas fa-users me-2"></i>No additional users have access to this document
                    </div>
                    <div v-else>
                        <div v-for="permission in documentPermissions" :key="permission.account"
                            class="d-flex align-items-center justify-content-between p-2 bg-darkg rounded mb-2">
                            <div class="d-flex align-items-center">
                                <img :src="getPermissionAvatarUrl(permission.account)"
                                    :alt="permission.account"
                                    class="user-avatar rounded-circle me-2"
                                    style="width: 40px; height: 40px; object-fit: cover;"
                                    @error="handlePermissionAvatarError($event, permission.account)">
                                <div class="user-avatar-fallback me-2"
                                    :style="{backgroundColor: generateUserColor(permission.account) }"
                                    style="display: none; width: 40px; height: 40px; border-radius: 50%; align-items: center; justify-content: center; font-size: 1rem; font-weight: bold; color: white;">
                                    {{ permission.account.charAt(0).toUpperCase() }}
                                </div>
                                <div>
                                    <strong>@{{ permission.account }}</strong>
                                    <div class="text-muted small">
                                        Granted by @{{ permission.grantedBy }} • {{
                                        formatFileDate(permission.grantedAt) }}
                                    </div>
                                </div>
                            </div>
                            <div class="d-flex align-items-center gap-2">
                                <select @change="updatePermission(permission.account, $event.target.value)"
                                    :value="permission.permissionType" class="form-select form-select-sm"
                                    style="width: auto;">
                                    <option value="readonly">Read Only</option>
                                    <option value="editable">Editable</option>
                                    <option value="postable">Full Access</option>
                                </select>
                                <button @click="revokePermission(permission.account)"
                                    class="btn btn-sm btn-outline-danger" title="Revoke access">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <hr>

                <!-- Add New User -->
                <div>
                    <h6 class="fw-bold mb-3">Grant New Access</h6>
                    <div class="mb-3">
                        <label class="form-label">Share with user</label>
                        <div class="input-group">
                            <span class="input-group-text">@</span>
                            <input v-model="shareForm.username" class="form-control" placeholder="Enter HIVE username"
                                @keyup.enter="performShare">
                        </div>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Permission level</label>
                        <select v-model="shareForm.permission" class="form-select">
                            <option value="readonly">Read Only - Can view and connect</option>
                            <option value="editable">Editable - Can view and edit content</option>
                            <option value="postable">Full Access - Can edit and post to Hive</option>
                        </select>
                    </div>
                </div>

                <div class="alert alert-info small">
                    <i class="fas fa-info-circle me-1"></i>
                    Users need to authenticate with their HIVE account to access shared documents.
                </div>
            </div>
            <div class="modal-footer">
                <button @click="showShareModal = false" class="btn btn-secondary">Close</button>
                <button @click="performShare" class="btn btn-primary" :disabled="!shareForm.username.trim()">
                    <i class="fas fa-user-plus me-1"></i>Grant Access
                </button>
            </div>
        </div>
    </div>
</div>

<!-- JSON Preview Modal -->
<div v-if="showJsonPreviewModal" class="modal fade show d-block" style="background: rgba(0,0,0,0.8)">
    <div class="modal-dialog modal-xl modal-dialog-centered">
        <div class="modal-content bg-dark text-white">
            <div class="modal-header border-secondary">
                <h5 class="modal-title">
                    <i class="fas fa-code me-2"></i>Hive JSON Preview & Validation
                </h5>
                <button @click="closeJsonPreview" class="btn-close btn-close-white"></button>
            </div>
            <div class="modal-body">
                <!-- Validation Status -->
                <div class="mb-3">
                    <div v-if="validateJsonStructure().valid" class="alert alert-success border-success bg-dark text-success">
                        <i class="fas fa-check-circle me-2"></i>
                        <strong>Valid Hive Structure</strong> - Ready for broadcast
                    </div>
                    <div v-else class="alert alert-danger border-danger bg-dark text-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        <strong>Validation Issues Found</strong>
                        <ul class="mb-0 mt-2">
                            <li v-for="error in validateJsonStructure().errors" :key="error">{{ error }}</li>
                        </ul>
                    </div>
                    <div v-if="validateJsonStructure().warnings && validateJsonStructure().warnings.length > 0" 
                         class="alert alert-warning border-warning bg-dark text-warning mt-2">
                        <i class="fas fa-exclamation-circle me-2"></i>
                        <strong>Warnings</strong>
                        <ul class="mb-0 mt-2">
                            <li v-for="warning in validateJsonStructure().warnings" :key="warning">{{ warning }}</li>
                        </ul>
                    </div>
                </div>

                <!-- Tab Navigation -->
                <ul class="nav nav-tabs nav-dark mb-3">
                    <li class="nav-item">
                        <button @click="setJsonPreviewTab('complete')" 
                                :class="['nav-link', { active: jsonPreviewTab === 'complete' }]">
                            <i class="fas fa-list me-1"></i>Complete Operations
                        </button>
                    </li>
                    <li class="nav-item">
                        <button @click="setJsonPreviewTab('comment')" 
                                :class="['nav-link', { active: jsonPreviewTab === 'comment' }]">
                            <i class="fas fa-comment me-1"></i>Comment Operation
                        </button>
                    </li>
                    <li class="nav-item">
                        <button @click="setJsonPreviewTab('comment_options')" 
                                :class="['nav-link', { active: jsonPreviewTab === 'comment_options' }]">
                            <i class="fas fa-cog me-1"></i>Comment Options
                        </button>
                    </li>
                    <li class="nav-item">
                        <button @click="setJsonPreviewTab('metadata')" 
                                :class="['nav-link', { active: jsonPreviewTab === 'metadata' }]">
                            <i class="fas fa-info-circle me-1"></i>Metadata
                        </button>
                    </li>
                </ul>

                <!-- Tab Content -->
                <div class="tab-content">
                    <!-- Complete Operations Tab -->
                    <div v-if="jsonPreviewTab === 'complete'" class="tab-pane active">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h6 class="text-info mb-0">Complete Hive Operations Array</h6>
                            <button @click="copyJsonToClipboard(getCompleteJsonPreview())" 
                                    class="btn btn-sm btn-outline-success">
                                <i class="fas fa-copy me-1"></i>Copy All
                            </button>
                        </div>
                        <pre class="bg-secondary text-white p-3 rounded" style="max-height: 500px; overflow-y: auto; font-size: 0.85em;">{{ JSON.stringify(getCompleteJsonPreview(), null, 2) }}</pre>
                    </div>

                    <!-- Comment Operation Tab -->
                    <div v-if="jsonPreviewTab === 'comment'" class="tab-pane active">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h6 class="text-info mb-0">Comment Operation</h6>
                            <button @click="copyJsonToClipboard(getCommentOperationPreview())" 
                                    class="btn btn-sm btn-outline-success">
                                <i class="fas fa-copy me-1"></i>Copy
                            </button>
                        </div>
                        <div class="small text-muted mb-2">
                            The main comment operation containing title, body, and json_metadata
                        </div>
                        <pre class="bg-secondary text-white p-3 rounded" style="max-height: 500px; overflow-y: auto; font-size: 0.85em;">{{ JSON.stringify(getCommentOperationPreview(), null, 2) }}</pre>
                    </div>

                    <!-- Comment Options Tab -->
                    <div v-if="jsonPreviewTab === 'comment_options'" class="tab-pane active">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h6 class="text-info mb-0">Comment Options Operation</h6>
                            <button @click="copyJsonToClipboard(getCommentOptionsPreview())" 
                                    class="btn btn-sm btn-outline-success"
                                    :disabled="!getCommentOptionsPreview()">
                                <i class="fas fa-copy me-1"></i>Copy
                            </button>
                        </div>
                        <div class="small text-muted mb-2">
                            Advanced settings like beneficiaries, payout options, and voting preferences
                        </div>
                        <div v-if="!getCommentOptionsPreview()" class="alert alert-info border-info bg-dark text-info">
                            <i class="fas fa-info-circle me-2"></i>
                            No comment options configured - using Hive defaults
                        </div>
                        <pre v-else class="bg-secondary text-white p-3 rounded" style="max-height: 500px; overflow-y: auto; font-size: 0.85em;">{{ JSON.stringify(getCommentOptionsPreview(), null, 2) }}</pre>
                    </div>

                    <!-- Metadata Tab -->
                    <div v-if="jsonPreviewTab === 'metadata'" class="tab-pane active">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h6 class="text-info mb-0">Generation Metadata</h6>
                            <button @click="copyJsonToClipboard(getMetadataPreview())" 
                                    class="btn btn-sm btn-outline-success">
                                <i class="fas fa-copy me-1"></i>Copy
                            </button>
                        </div>
                        <div class="small text-muted mb-2">
                            Information about how this JSON was generated and collaborative data
                        </div>
                        <pre class="bg-secondary text-white p-3 rounded" style="max-height: 500px; overflow-y: auto; font-size: 0.85em;">{{ JSON.stringify(getMetadataPreview(), null, 2) }}</pre>
                    </div>
                </div>
            </div>
            <div class="modal-footer border-secondary">
                <div class="me-auto small text-muted">
                    <i class="fas fa-clock me-1"></i>
                    Generated: {{ new Date().toLocaleString() }}
                </div>
                <button @click="closeJsonPreview" class="btn btn-secondary">Close</button>
            </div>
        </div>
    </div>
</div>
</teleport>`,
}; 