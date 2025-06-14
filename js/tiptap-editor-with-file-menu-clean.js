import methodsCommon from './methods-common.js';

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
        fileToAdd: {
            type: Object,
            default: null
        },
        postCustomJson: {
            type: Object,
            default: () => ({})
        },
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
            // =============================================================================
            // CORE EDITOR STATE
            // =============================================================================
            titleEditor: null,
            bodyEditor: null,
            permlinkEditor: null,
            
            // Y.js and collaboration
            ydoc: null,
            provider: null,
            ytitle: null,
            ybody: null,
            ymap: null,
            
            // Component tracking
            componentId: Date.now() + Math.random().toString(36).substr(2, 9),
            
            // File and editing mode
            fileType: 'local',
            isCollaborativeMode: false,
            
            // =============================================================================
            // DOCUMENT AND FILE MANAGEMENT
            // =============================================================================
            currentFile: null,
            localFiles: [],
            collaborativeDocuments: [],
            collaborativeAuthors: [],
            hasUnsavedChanges: false,
            isLoading: false,
            
            // Document content structure
            content: {
                title: '',
                body: '',
                tags: [],
                permlink: '',
                postType: 'post',
                customJson: {},
                assets: [],
                beneficiaries: []
            },
            
            // =============================================================================
            // UI STATE MANAGEMENT
            // =============================================================================
            
            // Document name editing
            isEditingDocumentName: false,
            documentNameInput: '',
            
            // Color picker
            showColorPicker: false,
            userColor: '#3498db',
            
            // Modals and dropdowns
            showJsonPreviewModal: false,
            showPermlinkEditor: false,
            
            // Form inputs
            tagInput: '',
            
            // =============================================================================
            // COLLABORATION STATUS
            // =============================================================================
            connectionStatus: 'disconnected',
            authHeaders: null,
            lastSyncTime: null,
            
            // Awareness and presence
            connectedUsers: [],
            
            // Auto-save
            debouncedAutoSave: null,
            lastAutoSaveTime: null,
            
            // =============================================================================
            // ERROR HANDLING
            // =============================================================================
            errors: [],
            warnings: [],

            // =============================================================================
            // TEMPLATE-REFERENCED STATE
            // =============================================================================
            dropdownOpen: {},
            jsonPreviewTab: 'complete',
            saveForm: {
                storageType: 'cloud',
                filename: '',
                description: '',
                isNewDocument: true,
                isPublic: false
            },
            saveAsProcess: {
                inProgress: false,
                message: '',
                error: null
            },
            saveButtonDisabled: false,
            cancelButtonText: 'Cancel',
            saveButtonText: 'Save',
            saveAsProgress: 0,
            commentOptions: {
                allowVotes: true,
                allowCurationRewards: true,
                maxAcceptedPayout: 100,
                percentHbd: 100
            },
            beneficiaryInput: {
                account: '',
                percent: 100
            },
            shareForm: {
                username: '',
                permission: 'editable'
            },
            
            // Document permissions and users
            documentPermissions: [],
            connectedUsers: [],
            loadingPermissions: false,
            permissionType: 'editable',
            permissionAvatarUrl: '',
            permissionGrantedBy: '',
            
            // Modal states
            showLoadModal: false,
            showSaveModal: false,
            showShareModal: false,
            showPublishModal: false,
            
            // Loading states
            loadingDocs: false,
            saving: false,
            loading: false,
            deleting: false,
            publishing: false,
            
            // Custom JSON
            customJsonString: '',
            customJsonError: '',
            
            // File attachments and uploads
            attachedFiles: [],
            pendingUploads: [],
            
            // Collaborative documents
            collaborativeDocs: []
        };
    },
    
    computed: {
        // Authentication state
        isConnected() {
            return this.connectionStatus === 'connected' || this.connectionStatus === 'synced';
        },
        
        isAuthenticated() {
            return this.authHeaders && Object.keys(this.authHeaders).length > 0;
        },
        
        isAuthExpired() {
            if (!this.authHeaders || !this.authHeaders['x-timestamp']) {
                return true;
            }
            
            const authTimestamp = parseInt(this.authHeaders['x-timestamp']);
            const now = Date.now();
            const authAge = now - authTimestamp;
            const maxAge = 30 * 60 * 1000; // 30 minutes
            
            return authAge > maxAge;
        },
        
        // Document state
        showCollaborativeFeatures() {
            return this.isAuthenticated && !this.isAuthExpired;
        },
        
        canShare() {
            return this.currentFile && this.currentFile.type === 'collaborative' && 
                   this.currentFile.owner === this.authHeaders['x-account'];
        },
        
        canDelete() {
            return this.currentFile && (
                (this.currentFile.type === 'local') ||
                (this.currentFile.type === 'collaborative' && this.currentFile.owner === this.authHeaders['x-account'])
            );
        },
        
        canPublish() {
            return this.hasValidFilename() && this.content.body.trim().length > 0;
        },
        
        hasValidFilename() {
            return this.currentFile && this.currentFile.documentName && this.currentFile.documentName.trim().length > 0;
        },
        
        // File lists
        recentFiles() {
            const allFiles = [...this.localFiles, ...this.collaborativeDocs];
            return allFiles
                .sort((a, b) => new Date(b.lastModified || b.updatedAt) - new Date(a.lastModified || a.updatedAt))
                .slice(0, 10);
        },
        
        allDocuments() {
            return [...this.localFiles, ...this.collaborativeDocs];
        },
        
        ownedCloudFiles() {
            return this.collaborativeDocs.filter(doc => 
                doc.owner === this.authHeaders['x-account']
            );
        },
        
        // Status and UI
        unifiedStatusInfo() {
            if (this.currentFile?.type === 'collaborative') {
                return {
                    status: this.connectionStatus,
                    message: this.getConnectionStatusMessage(),
                    canReconnect: this.connectionStatus === 'disconnected' || this.connectionStatus === 'offline'
                };
            } else {
                return {
                    status: 'local',
                    message: 'Working locally',
                    canReconnect: false
                };
            }
        },
        
        isReadOnlyMode() {
            if (!this.currentFile || this.currentFile.type === 'local') return false;
            if (this.currentFile.type === 'collaborative') {
                const permission = this.getUserPermissionLevel(this.currentFile);
                return permission === 'readonly';
            }
            return false;
        },
        
        // Generated content
        generatedPermlink() {
            if (!this.content.title) return '';
            
            return this.content.title
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '')
                .substring(0, 50);
        },
        
        // Display helpers
        displayTags() {
            return this.content.tags.map(tag => 
                typeof tag === 'string' ? tag : tag.name || tag.tag || String(tag)
            ).filter(tag => tag && tag.trim());
        },
        
        displayBeneficiaries() {
            return this.content.beneficiaries.filter(ben => 
                ben.account && ben.account.trim() && ben.weight > 0
            );
        },
        
        documentTitleIndicator() {
            if (!this.currentFile) return 'New Document';
            
            let title = this.currentFile.documentName || this.currentFile.name || 'Untitled';
            
            if (this.hasUnsavedChanges) {
                title += ' •';
            }
            
            if (this.currentFile.type === 'collaborative') {
                if (this.connectionStatus === 'connected' || this.connectionStatus === 'synced') {
                    title += ' 🌐';
                } else if (this.connectionStatus === 'offline' || this.connectionStatus === 'disconnected') {
                    title += ' 📴';
                }
            } else {
                title += ' 💾';
            }
            
            return title;
        },
        
        avatarUrl() {
            return `https://images.hive.blog/u/${this.username}/avatar`;
        },
        
        ownerAvatarUrl() {
            if (!this.currentFile?.owner) return null;
            return `https://images.hive.blog/u/${this.currentFile.owner}/avatar`;
        },

        // Additional computed properties needed by template

        saveFormTitle() {
            return this.saveForm.isNewDocument ? 'Save New Document' : 'Save Document';
        },

        documentCreationMessage() {
            if (this.saveAsProcess.inProgress) {
                return this.saveAsProcess.message || 'Creating document...';
            }
            return 'Ready to create document';
        },

        shareableDocumentURL() {
            if (!this.currentFile || this.currentFile.type !== 'collaborative') {
                return '';
            }
            return `${window.location.origin}${window.location.pathname}?collab=${this.currentFile.owner}/${this.currentFile.permlink}`;
        },

        // Cache validation results to prevent infinite re-computation
        validationResults() {
            // Inline validation logic to avoid circular calls
            const errors = [];
            const warnings = [];
            
            // Basic validation
            if (!this.content.title || this.content.title.trim().length === 0) {
                errors.push('Title is required');
            }
            
            if (!this.content.body || this.content.body.trim().length === 0) {
                errors.push('Body content is required');
            }
            
            if (this.content.title && this.content.title.length > 255) {
                warnings.push('Title is very long (over 255 characters)');
            }
            
            return {
                valid: errors.length === 0,
                errors,
                warnings
            };
        },

        // Cache JSON preview to prevent multiple computations
        completeJsonPreview() {
            try {
                const formattedTags = this.content.tags
                    .map(tag => tag.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                    .filter(tag => tag.length > 0 && tag.length <= 24)
                    .slice(0, 10);
                
                const bodyWithTags = this.content.body + 
                    (formattedTags.length > 0 ? '\n\n' + formattedTags.map(tag => `#${tag}`).join(' ') : '');
                
                const commentOperation = {
                    parent_author: '',
                    parent_permlink: formattedTags[0] || 'dlux',
                    author: this.username || 'username',
                    permlink: this.content.permlink || this.generatedPermlink,
                    title: this.content.title,
                    body: bodyWithTags,
                    json_metadata: JSON.stringify({
                        app: 'dlux/1.0.0',
                        format: 'markdown+html',
                        tags: formattedTags,
                        dlux: {
                            type: this.content.postType || 'blog',
                            version: '1.0.0'
                        }
                    })
                };
                
                const operations = [['comment', commentOperation]];
                
                return {
                    operations: operations,
                    metadata: {
                        isCollaborative: this.currentFile?.type === 'collaborative',
                        generatedAt: new Date().toISOString()
                    }
                };
                
            } catch (error) {
                console.error('Error generating JSON preview:', error);
                return {
                    error: error.message
                };
            }
        },

        // Cache comment operation preview
        commentOperationPreview() {
            const complete = this.completeJsonPreview;
            if (complete.error) return complete;
            
            return complete.operations.find(op => op[0] === 'comment')?.[1] || {};
        },

        // Cache comment options preview
        commentOptionsPreview() {
            const complete = this.completeJsonPreview;
            if (complete.error) return complete;
            
            return complete.operations.find(op => op[0] === 'comment_options')?.[1] || null;
        },

        // Cache metadata preview
        metadataPreview() {
            const complete = this.completeJsonPreview;
            if (complete.error) return complete;
            
            return complete.metadata || {};
        },

        // Cache permission display info to prevent repeated calculations
        currentFilePermissionInfo() {
            if (!this.currentFile) return { label: 'No Access', color: 'danger', icon: 'fas fa-ban' };
            const level = this.getUserPermissionLevel(this.currentFile);
            return this.getPermissionDisplayInfo(level);
        },

        // Cache formatted file dates to prevent repeated calculations
        formattedFileDates() {
            const dates = {};
            [...this.localFiles, ...this.collaborativeDocs].forEach(file => {
                const dateString = file.lastModified || file.updatedAt;
                if (dateString) {
                    dates[file.id || file.permlink] = this.formatFileDate(dateString);
                }
            });
            return dates;
        },

        // Cache file sizes to prevent repeated calculations
        formattedFileSizes() {
            const sizes = {};
            [...this.localFiles, ...this.collaborativeDocs].forEach(file => {
                if (file.size) {
                    sizes[file.id || file.permlink] = this.formatFileSize(file.size);
                }
            });
            return sizes;
        },

        // Missing computed properties referenced in template
        canUndo() {
            return this.bodyEditor?.can().undo() || false;
        },

        canRedo() {
            return this.bodyEditor?.can().redo() || false;
        },

        username() {
            return this.authHeaders?.['x-account'] || 'anonymous';
        }
    },
    
    methods: {
        // =============================================================================
        // EDITOR INITIALIZATION - SINGLE, CLEAN APPROACH
        // =============================================================================
        
        // TIPTAP BEST PRACTICE: Single entry point for editor creation
        async createEditors() {
            // RECURSION GUARD: Prevent infinite loops
            if (this._creatingEditors) {
                console.warn('⚠️ createEditors already in progress, skipping to prevent recursion');
                return;
            }
            
            this._creatingEditors = true;
            console.log('🏗️ Creating editors following TipTap.dev best practices...');
            
            try {
                const bundle = window.TiptapCollaboration?.default || window.TiptapCollaboration;
                
                if (!bundle) {
                    console.warn('⚠️ Collaboration bundle not available, creating basic editors');
                    await this.createBasicEditors();
                    return;
                }
                
                // Always use offline-first collaborative approach
                await this.createOfflineFirstCollaborativeEditors(bundle);
                
                console.log('✅ Editors created successfully following TipTap.dev best practices');
                
            } catch (error) {
                console.error('❌ Failed to create editors:', error);
                // Fallback to basic editors
                await this.createBasicEditors();
            } finally {
                this._creatingEditors = false;
            }
        },

        // Fallback method for basic editors when collaboration bundle is not available
        async createBasicEditors() {
            console.log('🏗️ Creating basic fallback editors...');
            
            try {
                await this.$nextTick();
                
                // Simple fallback editors using Vue refs
                if (this.$refs.titleEditor) {
                    this.$refs.titleEditor.innerHTML = '<div contenteditable="true" style="min-height: 40px; padding: 8px; border: 1px solid #ccc; border-radius: 4px;" placeholder="Enter title..."></div>';
                }
                
                if (this.$refs.bodyEditor) {
                    this.$refs.bodyEditor.innerHTML = '<div contenteditable="true" style="min-height: 200px; padding: 8px; border: 1px solid #ccc; border-radius: 4px;" placeholder="Start writing your content..."></div>';
                }
                
                if (this.$refs.permlinkEditor) {
                    this.$refs.permlinkEditor.innerHTML = '<div style="min-height: 30px; padding: 8px; border: 1px solid #ccc; border-radius: 4px; background: #f5f5f5; color: #666;" placeholder="Auto-generated from title">Auto-generated from title</div>';
                }
                
                console.log('✅ Basic fallback editors created');
                
            } catch (error) {
                console.error('❌ Failed to create basic editors:', error);
            }
        },

        // TIPTAP BEST PRACTICE: Offline-first collaborative editors
        async createOfflineFirstCollaborativeEditors(bundle) {
            console.log('🏗️ Creating offline-first collaborative editors...');
            
            try {
                // Clean up any existing resources
                await this.cleanupCurrentDocument();
                await this.$nextTick();

                // Get components from the bundle
                const Editor = bundle.Editor?.default || bundle.Editor;
                const StarterKit = bundle.StarterKit?.default || bundle.StarterKit;
                const Collaboration = bundle.Collaboration?.default || bundle.Collaboration;
                const CollaborationCursor = bundle.CollaborationCursor?.default || bundle.CollaborationCursor;
                const Placeholder = bundle.Placeholder?.default || bundle.Placeholder;
                const Y = bundle.Y?.default || bundle.Y;
                const IndexeddbPersistence = bundle.IndexeddbPersistence?.default || bundle.IndexeddbPersistence;

                if (!Editor || !StarterKit || !Collaboration || !Placeholder || !Y) {
                    throw new Error('Required TipTap components missing from bundle');
                }

                // OFFLINE-FIRST: Create Y.js document
                this.ydoc = new Y.Doc();
                this.initializeCollaborativeSchema(Y);
                
                // OFFLINE-FIRST: Create IndexedDB persistence for offline storage
                if (this.currentFile) {
                    const docName = this.currentFile.type === 'collaborative' 
                        ? `${this.currentFile.owner}-${this.currentFile.permlink}`
                        : `local-${this.currentFile.id}`;
                    this.indexeddbProvider = new IndexeddbPersistence(docName, this.ydoc);
                    console.log('✅ IndexedDB persistence created for offline storage');
                }

                // OFFLINE-FIRST: Connect to server only if collaborative
                if (this.currentFile?.type === 'collaborative') {
                    await this.connectToCollaborationServer(this.currentFile);
                }

                // Global instance management
                if (window.dluxCollaborativeInstance && window.dluxCollaborativeInstance !== this.componentId) {
                    console.log('🔄 Cleaning up previous collaborative instance...');
                    if (window.dluxCollaborativeCleanup) {
                        await window.dluxCollaborativeCleanup();
                    }
                }
                
                window.dluxCollaborativeInstance = this.componentId;
                window.dluxCollaborativeCleanup = () => this.cleanupCurrentDocument();

                // Create enhanced extensions
                const getEnhancedExtensions = (field) => {
                    const extensions = [
                        StarterKit.configure({
                            history: false, // CRITICAL: Disable history for collaboration
                        }),
                        Collaboration.configure({
                            document: this.ydoc,
                            field: field,
                        }),
                        Placeholder.configure({
                            placeholder: field === 'title' ? 'Enter your title...' : 
                                       field === 'permlink' ? 'Auto-generated from title' : 
                                       'Start writing your content...'
                        })
                    ];

                    // Add cursor collaboration if provider exists
                    if (this.provider && CollaborationCursor) {
                        extensions.push(
                            CollaborationCursor.configure({
                                provider: this.provider,
                                user: {
                                    name: this.username,
                                    color: this.getUserColor()
                                }
                            })
                        );
                    }

                    return extensions;
                };

                // Create editors
                await this.$nextTick();

                // Title editor
                if (this.$refs.titleEditor) {
                    this.titleEditor = new Editor({
                        element: this.$refs.titleEditor,
                        extensions: getEnhancedExtensions('title'),
                        content: this.content.title,
                        onUpdate: ({ editor }) => {
                            this.content.title = editor.getHTML();
                            this.hasUnsavedChanges = true;
                            this.debouncedAutoSave();
                        }
                    });
                }

                // Body editor
                if (this.$refs.bodyEditor) {
                    this.bodyEditor = new Editor({
                        element: this.$refs.bodyEditor,
                        extensions: getEnhancedExtensions('body'),
                        content: this.content.body,
                        onUpdate: ({ editor }) => {
                            this.content.body = editor.getHTML();
                            this.hasUnsavedChanges = true;
                            this.debouncedAutoSave();
                        }
                    });
                }

                // Permlink editor (read-only)
                if (this.$refs.permlinkEditor && this.showPermlinkEditor) {
                    this.permlinkEditor = new Editor({
                        element: this.$refs.permlinkEditor,
                        extensions: getEnhancedExtensions('permlink'),
                        content: this.content.permlink,
                        editable: false
                    });
                }

                // Sync local state to Y.js
                this.syncLocalStateToYjs();
                
                console.log('✅ Offline-first collaborative editors created successfully');

            } catch (error) {
                console.error('❌ Failed to create offline-first collaborative editors:', error);
                throw error;
            }
        },

        // =============================================================================
        // CLEANUP - SINGLE, PROPER METHOD
        // =============================================================================
        
        async cleanupCurrentDocument() {
            console.log('🧹 Cleaning up current document resources...');
            
            try {
                // Disconnect WebSocket provider first
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
                
                // Destroy editors safely
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
                
                // Reset state
                this.connectionStatus = 'disconnected';
                this.connectionMessage = '';
                this.isCollaborativeMode = false;
                this.isCreatingYjsDocument = false;
                
                // Ensure collaborativeAuthors is always an array
                if (!Array.isArray(this.collaborativeAuthors)) {
                    this.collaborativeAuthors = [];
                }
                
                // Clear global instance tracking
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
                this.collaborativeAuthors = [];
                
                if (window.dluxCollaborativeInstance === this.componentId) {
                    window.dluxCollaborativeInstance = null;
                    window.dluxCollaborativeCleanup = null;
                }
            }
        },

        // =============================================================================
        // COLLABORATIVE ARCHITECTURE SUPPORT
        // =============================================================================
        
        initializeCollaborativeSchema(Y) {
            console.log('🏗️ Initializing collaborative schema in Y.js document...');
            
            // Create Y.js maps for structured collaborative data
            const yTitle = this.ydoc.getText('title');
            const yBody = this.ydoc.getText('body');
            const yPermlink = this.ydoc.getText('permlink');
            const yTags = this.ydoc.getArray('tags');
            const yBeneficiaries = this.ydoc.getArray('beneficiaries');
            const yCustomJson = this.ydoc.getMap('customJson');
            const yPostType = this.ydoc.getMap('postType');
            const yAssets = this.ydoc.getArray('assets');
            
            console.log('✅ Collaborative schema initialized');
        },

        syncLocalStateToYjs() {
            if (!this.ydoc) return;
            
            console.log('🔄 Syncing local state to Y.js document...');
            
            try {
                // Sync content to Y.js arrays/maps
                const yTags = this.ydoc.getArray('tags');
                const yBeneficiaries = this.ydoc.getArray('beneficiaries');
                const yCustomJson = this.ydoc.getMap('customJson');
                const yPostType = this.ydoc.getMap('postType');
                const yAssets = this.ydoc.getArray('assets');
                
                // Clear and populate tags
                yTags.delete(0, yTags.length);
                this.content.tags.forEach(tag => yTags.push([tag]));
                
                // Clear and populate beneficiaries
                yBeneficiaries.delete(0, yBeneficiaries.length);
                this.content.beneficiaries.forEach(ben => yBeneficiaries.push([ben]));
                
                // Sync custom JSON
                yCustomJson.clear();
                Object.entries(this.content.custom_json).forEach(([key, value]) => {
                    yCustomJson.set(key, value);
                });
                
                // Sync post type
                yPostType.set('type', this.dluxPostType);
                
                // Sync assets
                yAssets.delete(0, yAssets.length);
                this.dluxAssets.forEach(asset => yAssets.push([asset]));
                
                console.log('✅ Local state synced to Y.js document');
            } catch (error) {
                console.warn('⚠️ Error syncing local state to Y.js:', error);
            }
        },

        async connectToCollaborationServer(serverDoc) {
            console.log('🌐 Connecting to collaboration server...');
            
            try {
                if (!this.ydoc) {
                    throw new Error('Y.js document must exist before connecting to server');
                }

                const bundle = window.TiptapCollaboration?.default || window.TiptapCollaboration;
                const WebSocketProvider = bundle.WebSocketProvider?.default || bundle.WebSocketProvider;
                
                if (!WebSocketProvider) {
                    throw new Error('WebSocketProvider not available');
                }

                const docId = `${serverDoc.owner}-${serverDoc.permlink}`;
                
                this.provider = new WebSocketProvider(this.collaborationUrl, docId, this.ydoc, {
                    params: {
                        account: this.authHeaders['x-account'],
                        timestamp: this.authHeaders['x-timestamp'],
                        signature: this.authHeaders['x-signature']
                    }
                });

                // Connection event handlers
                this.provider.on('status', ({ status }) => {
                    console.log('📡 WebSocket status:', status);
                    this.connectionStatus = status;
                    this.connectionMessage = this.getConnectionStatusMessage();
                });

                this.provider.on('connection-close', ({ event }) => {
                    console.log('❌ WebSocket connection closed');
                    this.connectionStatus = 'disconnected';
                    this.connectionMessage = 'Disconnected from server';
                });

                this.provider.on('synced', ({ synced }) => {
                    if (synced) {
                        console.log('✅ Document synced with server');
                        this.connectionStatus = 'synced';
                        this.connectionMessage = 'Synced with server';
                    }
                });

                console.log('✅ Connected to collaboration server');

            } catch (error) {
                console.error('❌ Failed to connect to collaboration server:', error);
                this.connectionStatus = 'disconnected';
                this.connectionMessage = 'Failed to connect to server';
                throw error;
            }
        },

        getConnectionStatusMessage() {
            switch (this.connectionStatus) {
                case 'connected':
                    return 'Connected to server';
                case 'synced':
                    return 'Synced with collaborators';
                case 'connecting':
                    return 'Connecting to server...';
                case 'disconnected':
                    return 'Disconnected - Working offline';
                case 'offline':
                    return 'Offline - Changes saved locally';
                default:
                    return 'Status unknown';
            }
        },

        getUserPermissionLevel(file) {
            if (!file || !this.authHeaders['x-account']) return 'none';
            
            if (file.owner === this.authHeaders['x-account']) {
                return 'owner';
            }
            
            const permission = this.documentPermissions.find(p => 
                p.account === this.authHeaders['x-account']
            );
            
            return permission ? permission.level : 'none';
        },

        getUserColor() {
            if (!this.userColor) {
                this.userColor = this.generateUserColor(this.username);
            }
            return this.userColor;
        },

        generateUserColor(username) {
            // Generate a consistent color based on username
            let hash = 0;
            for (let i = 0; i < username.length; i++) {
                hash = username.charCodeAt(i) + ((hash << 5) - hash);
            }
            
            const hue = Math.abs(hash) % 360;
            return `hsl(${hue}, 70%, 50%)`;
        },

        // =============================================================================
        // AUTO-SAVE AND CONTENT MANAGEMENT
        // =============================================================================
        
        async performAutoSave() {
            if (!this.hasContentToSave() || this.saving) return;
            
            console.log('💾 Performing auto-save...');
            
            try {
                if (this.currentFile && this.currentFile.type === 'local') {
                    await this.saveLocalDocument();
                }
                // Collaborative documents auto-save through Y.js and IndexedDB
                
                this.hasUnsavedChanges = false;
                console.log('✅ Auto-save completed');
            } catch (error) {
                console.warn('⚠️ Auto-save failed:', error);
            }
        },

        hasContentToSave() {
            return this.content.title.trim().length > 0 || this.content.body.trim().length > 0;
        },

        async saveLocalDocument() {
            if (!this.currentFile || this.currentFile.type !== 'local') return;
            
            const fileData = {
                id: this.currentFile.id,
                name: this.currentFile.documentName || 'Untitled',
                documentName: this.currentFile.documentName || 'Untitled',
                content: this.content,
                lastModified: new Date().toISOString(),
                type: 'local'
            };
            
            localStorage.setItem(`dlux_tiptap_file_${this.currentFile.id}`, JSON.stringify(fileData));
            await this.updateLocalFileIndex();
        },

        async updateLocalFileIndex() {
            try {
                const existingFiles = JSON.parse(localStorage.getItem('dlux_tiptap_files') || '[]');
                const fileIndex = existingFiles.findIndex(f => f.id === this.currentFile.id);
                
                const fileInfo = {
                    id: this.currentFile.id,
                    name: this.currentFile.documentName || 'Untitled',
                    documentName: this.currentFile.documentName || 'Untitled',
                    lastModified: new Date().toISOString(),
                    type: 'local'
                };
                
                if (fileIndex >= 0) {
                    existingFiles[fileIndex] = fileInfo;
                } else {
                    existingFiles.push(fileInfo);
                }
                
                localStorage.setItem('dlux_tiptap_files', JSON.stringify(existingFiles));
                await this.loadLocalFiles();
            } catch (error) {
                console.error('❌ Failed to update local file index:', error);
            }
        },

        async loadLocalFiles() {
            try {
                const files = JSON.parse(localStorage.getItem('dlux_tiptap_files') || '[]');
                this.localFiles = files.map(file => ({
                    ...file,
                    type: 'local',
                    size: 0 // Calculate if needed
                }));
            } catch (error) {
                console.error('❌ Failed to load local files:', error);
                this.localFiles = [];
            }
        },

        // =============================================================================
        // DOCUMENT LIFECYCLE
        // =============================================================================
        
        async newDocument() {
            // RECURSION GUARD: Prevent infinite loops
            if (this._creatingNewDocument) {
                console.warn('⚠️ newDocument already in progress, skipping to prevent recursion');
                return;
            }
            
            this._creatingNewDocument = true;
            console.log('📄 Creating new document...');
            
            try {
                await this.cleanupCurrentDocument();
                
                // Reset content
                this.content = {
                    title: '',
                    body: '',
                    tags: [],
                    custom_json: {},
                    permlink: '',
                    beneficiaries: []
                };
                
                // Create new local file
                this.currentFile = {
                    id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    documentName: 'Untitled Document',
                    type: 'local',
                    lastModified: new Date().toISOString()
                };
                
                this.hasUnsavedChanges = false;
                this.isCollaborativeMode = false;
                
                // Create editors
                await this.createEditors();
                
                console.log('✅ New document created');
            } catch (error) {
                console.error('❌ Failed to create new document:', error);
            } finally {
                this._creatingNewDocument = false;
            }
        },

        async loadDocument(file) {
            console.log(`📖 Loading document: ${file.documentName || file.name}`);
            
            try {
                this.loading = true;
                
                if (file.type === 'local') {
                    await this.loadLocalFile(file);
                } else if (file.type === 'collaborative') {
                    await this.loadCollaborativeFile(file);
                }
                
                this.hasUnsavedChanges = false;
                console.log('✅ Document loaded successfully');
                
            } catch (error) {
                console.error('❌ Failed to load document:', error);
                // Fallback to new document
                await this.newDocument();
            } finally {
                this.loading = false;
            }
        },

        // =============================================================================
        // LIFECYCLE METHODS
        // =============================================================================
        
        async mounted() {
            console.log('🚀 TipTap Editor mounting...');
            
            try {
                // Initialize debounced methods - check if debounce method exists (from mixins)
                if (this.debounce) {
                    this.debouncedAutoSave = this.debounce(this.performAutoSave, 500);
                } else {
                    // Fallback debounce implementation
                    this.debouncedAutoSave = this.createDebounce(this.performAutoSave, 500);
                }
                
                // Load initial data
                await this.loadLocalFiles();
                
                // Check for authentication
                if (this.showCollaborativeFeatures) {
                    // Load collaborative docs would go here
                }
                
                // Create initial document
                if (this.initialContent && Object.keys(this.initialContent).length > 0) {
                    this.content = { ...this.content, ...this.initialContent };
                }
                
                await this.newDocument();
                
                console.log('✅ TipTap Editor mounted successfully');
                
            } catch (error) {
                console.error('❌ Failed to mount TipTap Editor:', error);
            }
        },

        // Fallback debounce implementation if not available from mixins
        createDebounce(func, wait) {
            let timeout;
            const self = this; // Capture the Vue component context
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func.apply(self, args); // Use the captured Vue component context
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        beforeUnmount() {
            console.log('🧹 TipTap Editor unmounting...');
            this.cleanupCurrentDocument();
        },

        // =============================================================================
        // MISSING UI AND INTERACTION METHODS
        // =============================================================================

        // Document name editing
        startEditingDocumentName() {
            if (this.isReadOnlyMode) return;
            this.isEditingDocumentName = true;
            this.documentNameInput = this.currentFile?.documentName || this.currentFile?.name || '';
            this.$nextTick(() => {
                if (this.$refs.documentNameInput) {
                    this.$refs.documentNameInput.focus();
                    this.$refs.documentNameInput.select();
                }
            });
        },

        async saveDocumentName() {
            if (!this.documentNameInput.trim()) {
                this.cancelEditingDocumentName();
                return;
            }

            if (this.currentFile) {
                this.currentFile.documentName = this.documentNameInput.trim();
                this.currentFile.name = this.documentNameInput.trim();
                
                if (this.currentFile.type === 'local') {
                    await this.saveLocalDocument();
                }
                // For collaborative docs, the name would be synced through Y.js
            }

            this.isEditingDocumentName = false;
        },

        cancelEditingDocumentName() {
            this.isEditingDocumentName = false;
            this.documentNameInput = '';
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

        // Avatar and color management
        handleAvatarError(event, user) {
            if (event.target.src.includes('images.hive.blog')) {
                // Try fallback
                event.target.src = `https://images.hive.blog/u/${user.name || this.username}/avatar`;
            } else {
                // Use default avatar
                event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiM2NjY2NjYiLz4KPHN2ZyB4PSIxMCIgeT0iMTAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNMTIgMTJDMTQuNzYxNCAxMiAxNyA5Ljc2MTQgMTcgN0MxNyA0LjIzODYgMTQuNzYxNCAyIDEyIDJDOS4yMzg2IDIgNyA0LjIzODYgNyA3QzcgOS43NjE0IDkuMjM4NiAxMiAxMiAxMloiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xMiAxNEM3LjU4MTcyIDEzLjk5OTYgNCAxNy41ODEzIDQgMjJIMjBDMjAgMTcuNTgxMyAxNi40MTgzIDEzLjk5OTYgMTIgMTRaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4KPC9zdmc+';
            }
        },

        handleOwnerAvatarError(event) {
            this.handleAvatarError(event, { name: this.currentFile?.owner });
        },

        toggleColorPicker() {
            this.showColorPicker = !this.showColorPicker;
        },

        updateUserColor(newColor) {
            this.userColor = newColor;
            // Update cursor color in collaborative editing
            if (this.provider && this.provider.awareness) {
                this.provider.awareness.setLocalStateField('user', {
                    name: this.username,
                    color: newColor
                });
            }
        },

        getRandomColor() {
            const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];
            return colors[Math.floor(Math.random() * colors.length)];
        },

        // Status and connection management
        handleStatusAction(action) {
            switch (action) {
                case 'reconnect':
                    if (this.currentFile?.type === 'collaborative') {
                        this.connectToCollaborationServer(this.currentFile);
                    }
                    break;
                default:
                    console.log('Unknown status action:', action);
            }
        },

        // Editor commands

        performUndo() {
            if (this.bodyEditor?.can().undo()) {
                this.bodyEditor.commands.undo();
            }
        },

        performRedo() {
            if (this.bodyEditor?.can().redo()) {
                this.bodyEditor.commands.redo();
            }
        },

        // Insert operations (placeholders)
        insertLink() {
            console.log('🔗 Insert link feature - to be implemented');
        },

        insertImage() {
            console.log('🖼️ Insert image feature - to be implemented');
        },

        insertTable() {
            console.log('📊 Insert table feature - to be implemented');
        },

        // Preview and export (placeholders)
        showJsonPreview() {
            this.showJsonPreviewModal = true;
        },

        exportDocument(format) {
            try {
                let content = '';
                let filename = '';
                let mimeType = '';
                
                const documentName = this.currentFile?.documentName || this.currentFile?.name || 'document';
                
                if (format === 'markdown') {
                    content = this.getMarkdownContent();
                    filename = `${documentName}.md`;
                    mimeType = 'text/markdown';
                } else if (format === 'html') {
                    const title = this.content.title || documentName;
                    const body = this.bodyEditor?.getHTML() || '';
                    content = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1, h2, h3 { color: #333; }
        blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 20px; }
        code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
        pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>${title}</h1>
    ${body}
</body>
</html>`;
                    filename = `${documentName}.html`;
                    mimeType = 'text/html';
                } else {
                    alert('Unsupported export format');
                    return;
                }
                
                // Create and download file
                const blob = new Blob([content], { type: mimeType });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                console.log(`✅ Exported document as ${format.toUpperCase()}: ${filename}`);
            } catch (error) {
                console.error('Export failed:', error);
                alert('Failed to export document: ' + error.message);
            }
        },

        // Document operations
        async saveAsDocument() {
            this.saveForm.isNewDocument = true;
            this.saveForm.filename = '';
            this.showSaveModal = true;
        },

        async shareDocument() {
            if (!this.canShare) {
                if (!this.isAuthenticated || this.isAuthExpired) {
                    alert('Please authenticate first to share documents.');
                    this.requestAuthentication();
                } else {
                    alert('You can only share documents that you own.');
                }
                return;
            }
            
            // Load current permissions
            await this.loadDocumentPermissions();
            this.showShareModal = true;
        },

        async convertToCollaborative() {
            if (!this.isAuthenticated || this.isAuthExpired) {
                alert('Please authenticate first to enable collaboration.');
                this.requestAuthentication();
                return;
            }
            
            if (this.currentFile?.type === 'collaborative') {
                alert('This document is already collaborative.');
                return;
            }
            
            const confirmMessage = 'Convert this document to collaborative mode? This will upload it to the DLUX collaboration server.';
            if (!confirm(confirmMessage)) {
                return;
            }
            
            try {
                // Set up the save form for collaborative conversion
                this.saveForm.storageType = 'cloud';
                this.saveForm.isNewDocument = true;
                this.saveForm.filename = this.currentFile?.name || `Document ${new Date().toLocaleDateString()}`;
                this.saveForm.description = 'Converted from local document';
                this.saveForm.isPublic = false;
                
                // Open save modal for collaborative conversion
                this.showSaveModal = true;
            } catch (error) {
                console.error('Failed to convert to collaborative:', error);
                alert('Failed to convert document: ' + error.message);
            }
        },

        async deleteDocument() {
            if (!this.canDelete) {
                alert('You can only delete documents that you own.');
                return;
            }
            
            if (!this.currentFile) {
                alert('No document selected to delete.');
                return;
            }
            
            const documentName = this.currentFile.documentName || this.currentFile.name || 'this document';
            const confirmMessage = `Are you sure you want to delete "${documentName}"? This action cannot be undone.`;
            
            if (!confirm(confirmMessage)) {
                return;
            }
            
            try {
                if (this.currentFile.type === 'local') {
                    await this.deleteLocalFileWithConfirm(this.currentFile);
                } else if (this.currentFile.type === 'collaborative') {
                    await this.deleteCollaborativeDocWithConfirm(this.currentFile);
                }
                
                // After deletion, create a new document
                await this.newDocument();
            } catch (error) {
                console.error('Failed to delete document:', error);
                alert('Failed to delete document: ' + error.message);
            }
        },

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
            
            if (errors.length > 0) {
                alert('Cannot publish post:\n\n' + errors.join('\n'));
                return false;
            }
            
            return true;
        },

        async requestAuthentication() {
            console.log('🔐 Request authentication feature - to be implemented');
            this.$emit('request-auth-headers');
        },

        async loadCollaborativeDocs() {
            if (!this.isAuthenticated) {
                this.collaborativeDocs = [];
                return;
            }
            
            try {
                const response = await fetch('https://data.dlux.io/api/collaboration/documents', {
                    headers: this.authHeaders
                });
                
                if (response.ok) {
                    const data = await response.json();
                    this.collaborativeDocs = data.documents || [];
                } else {
                    console.warn('Failed to load collaborative documents');
                    this.collaborativeDocs = [];
                }
            } catch (error) {
                console.error('Error loading collaborative documents:', error);
                this.collaborativeDocs = [];
            }
        },

        // Tag management
        addTag() {
            const tag = this.tagInput.trim().toLowerCase();
            if (tag && !this.content.tags.includes(tag)) {
                this.content.tags.push(tag);
                this.tagInput = '';
                this.hasUnsavedChanges = true;
                this.debouncedAutoSave();
            }
        },

        removeTag(index) {
            this.content.tags.splice(index, 1);
            this.hasUnsavedChanges = true;
            this.debouncedAutoSave();
        },

        // Collaborative features
        showCollaborativeAuthorsDisplay() {
            return this.currentFile?.type === 'collaborative' && this.collaborativeAuthors.length > 1;
        },

        getCollaborativeAuthors() {
            return this.collaborativeAuthors.filter(author => author.name !== this.username);
        },

        // Permlink management
        togglePermlinkEditor() {
            this.showPermlinkEditor = !this.showPermlinkEditor;
        },

        useGeneratedPermlink() {
            this.content.permlink = this.generatedPermlink;
            if (this.permlinkEditor) {
                this.permlinkEditor.commands.setContent(this.generatedPermlink);
            }
        },

        // =============================================================================
        // CRITICAL TEMPLATE-REFERENCED METHODS
        // =============================================================================

        // Beneficiary management - referenced in template
        addBeneficiary() {
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
            
            // Add to local content for now (Y.js integration would go here)
            this.content.beneficiaries.push({
                id: Date.now().toString(),
                account: account,
                weight: weight,
                percent: percent
            });
            
            // Reset input
            this.beneficiaryInput.account = '';
            this.beneficiaryInput.percent = 1.0;
            
            this.hasUnsavedChanges = true;
            if (this.debouncedAutoSave) this.debouncedAutoSave();
        },

        removeBeneficiary(index) {
            if (this.isReadOnlyMode) {
                console.warn('🔒 Cannot remove beneficiary: Read-only mode');
                return;
            }
            
            if (index >= 0 && index < this.content.beneficiaries.length) {
                this.content.beneficiaries.splice(index, 1);
                this.hasUnsavedChanges = true;
                if (this.debouncedAutoSave) this.debouncedAutoSave();
            }
        },

        // Sharing functionality - referenced in template
        async performShare() {
            console.log('🔗 Perform share - to be implemented');
            
            if (!this.shareForm.username.trim()) {
                alert('Please enter a username to share with');
                return;
            }
            
            // Placeholder implementation
            alert(`Share with ${this.shareForm.username} (${this.shareForm.permission}) - Feature to be implemented`);
        },

        async revokePermission(account) {
            console.log(`🚫 Revoke permission for ${account} - to be implemented`);
            
            // Remove from local permissions array for now
            this.documentPermissions = this.documentPermissions.filter(p => p.account !== account);
        },

        async updatePermission(account, newPermission) {
            try {
                console.log(`🔄 Updating permission for ${account} to: ${newPermission}`);
                
                // Find and update the permission
                const permission = this.documentPermissions.find(p => p.account === account);
                if (permission) {
                    permission.permission = newPermission;
                    permission.updatedAt = new Date().toISOString();
                    
                    // API call would go here to update on server
                    console.log('✅ Permission updated successfully');
                } else {
                    console.warn('⚠️ Permission not found for account:', account);
                }
            } catch (error) {
                console.error('❌ Failed to update permission:', error);
                alert('Failed to update permission: ' + error.message);
            }
        },

        // JSON Preview functionality - referenced in template
        setJsonPreviewTab(tab) {
            this.jsonPreviewTab = tab;
        },

        closeJsonPreview() {
            this.showJsonPreviewModal = false;
        },

        getCompleteJsonPreview() {
            try {
                const formattedTags = this.content.tags
                    .map(tag => tag.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                    .filter(tag => tag.length > 0 && tag.length <= 24)
                    .slice(0, 10);
                
                const bodyWithTags = this.content.body + 
                    (formattedTags.length > 0 ? '\n\n' + formattedTags.map(tag => `#${tag}`).join(' ') : '');
                
                const commentOperation = {
                    parent_author: '',
                    parent_permlink: formattedTags[0] || 'dlux',
                    author: this.username || 'username',
                    permlink: this.content.permlink || this.generatedPermlink,
                    title: this.content.title,
                    body: bodyWithTags,
                    json_metadata: JSON.stringify({
                        app: 'dlux/1.0.0',
                        format: 'markdown+html',
                        tags: formattedTags,
                        dlux: {
                            type: this.content.postType || 'blog',
                            version: '1.0.0'
                        }
                    })
                };
                
                const operations = [['comment', commentOperation]];
                
                return {
                    operations: operations,
                    metadata: {
                        isCollaborative: this.currentFile?.type === 'collaborative',
                        generatedAt: new Date().toISOString()
                    }
                };
                
            } catch (error) {
                console.error('Error generating JSON preview:', error);
                return {
                    error: error.message
                };
            }
        },

        getCommentOperationPreview() {
            const complete = this.completeJsonPreview;
            if (complete.error) return complete;
            
            return complete.operations.find(op => op[0] === 'comment')?.[1] || {};
        },

        getCommentOptionsPreview() {
            const complete = this.completeJsonPreview;
            if (complete.error) return complete;
            
            return complete.operations.find(op => op[0] === 'comment_options')?.[1] || null;
        },

        getMetadataPreview() {
            const complete = this.completeJsonPreview;
            if (complete.error) return complete;
            
            return complete.metadata || {};
        },

        copyJsonToClipboard(jsonData) {
            try {
                const jsonString = JSON.stringify(jsonData, null, 2);
                navigator.clipboard.writeText(jsonString).then(() => {
                    console.log('✅ JSON copied to clipboard');
                }).catch(err => {
                    console.error('Failed to copy JSON:', err);
                });
            } catch (error) {
                console.error('Error copying JSON:', error);
            }
        },

        validateJsonStructure() {
            const complete = this.completeJsonPreview;
            if (complete.error) {
                return {
                    valid: false,
                    errors: [complete.error]
                };
            }
            
            const errors = [];
            const warnings = [];
            
            const comment = this.commentOperationPreview;
            
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
            
            // Add warnings for best practices
            if (comment.title && comment.title.length > 255) {
                warnings.push('Title is longer than recommended (255 characters)');
            }
            
            return {
                valid: errors.length === 0,
                errors: errors,
                warnings: warnings
            };
        },

        // Dropdown management - referenced in template
        toggleDropdown(name) {
            this.closeDropdowns(); // Close all others first
            this.dropdownOpen[name] = !this.dropdownOpen[name];
        },

        closeDropdowns() {
            this.dropdownOpen = {};
        },

        // Utility methods referenced in template
        extractLinksFromContent(content) {
            // Simple link extraction - could be enhanced
            const linkRegex = /(https?:\/\/[^\s]+)/g;
            return (content.match(linkRegex) || []).slice(0, 10);
        },

        // Permission helpers
        getPermissionAvatarUrl(account) {
            return `https://images.hive.blog/u/${account}/avatar`;
        },

        handlePermissionAvatarError(event, username) {
            event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiM2NjY2NjYiLz4KPHN2ZyB4PSIxMCIgeT0iMTAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNMTIgMTJDMTQuNzYxNCAxMiAxNyA5Ljc2MTQgMTcgN0MxNyA0LjIzODYgMTQuNzYxNCAyIDEyIDJDOS4yMzg2IDIgNyA0LjIzODYgNyA3QzcgOS43NjE0IDkuMjM4NiAxMiAxMiAxMloiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xMiAxNEM3LjU4MTcyIDEzLjk5OTYgNCAxNy41ODEzIDQgMjJIMjBDMjAgMTcuNTgxMyAxNi40MTgzIDEzLjk5OTYgMTIgMTRaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4KPC9zdmc+';
        },

        // Permission display information
        getPermissionDisplayInfo(permissionLevel) {
            const permissionMap = {
                'owner': {
                    label: 'Owner',
                    color: 'success',
                    icon: 'fas fa-crown',
                    description: 'Document owner with full permissions'
                },
                'editable': {
                    label: 'Editor',
                    color: 'primary',
                    icon: 'fas fa-edit',
                    description: 'Can edit document content'
                },
                'readonly': {
                    label: 'Viewer',
                    color: 'secondary',
                    icon: 'fas fa-eye',
                    description: 'Can view document only'
                },
                'none': {
                    label: 'No Access',
                    color: 'danger',
                    icon: 'fas fa-ban',
                    description: 'No access to document'
                }
            };
            
            return permissionMap[permissionLevel] || permissionMap['none'];
        },

        // Custom JSON validation
        validateCustomJson() {
            if (this.isReadOnlyMode) {
                console.warn('🔒 Cannot modify custom JSON: Read-only mode');
                return;
            }
            
            if (!this.customJsonString.trim()) {
                this.customJsonError = '';
                return;
            }
            
            try {
                JSON.parse(this.customJsonString);
                this.customJsonError = '';
                this.content.customJson = JSON.parse(this.customJsonString);
                this.hasUnsavedChanges = true;
                if (this.debouncedAutoSave) this.debouncedAutoSave();
            } catch (error) {
                this.customJsonError = error.message;
            }
        },

        // Comment options change handler
        handleCommentOptionChange() {
            if (this.isReadOnlyMode) {
                console.warn('🔒 Cannot change comment options: Read-only mode');
                return;
            }
            
            this.hasUnsavedChanges = true;
            if (this.debouncedAutoSave) this.debouncedAutoSave();
        },

        // Publishing functionality
        async performPublish() {
            console.log('📤 Perform publish - to be implemented');
            
            if (!this.canPublish) {
                alert('Please fill in title, content, and at least one tag before publishing.');
                return;
            }
            
            this.publishing = true;
            
            try {
                // Placeholder implementation
                await new Promise(resolve => setTimeout(resolve, 2000));
                alert('Publish feature - to be implemented');
                this.showPublishModal = false;
            } catch (error) {
                console.error('Error publishing:', error);
                alert('Error publishing: ' + error.message);
            } finally {
                this.publishing = false;
            }
        },

        // File attachment methods (placeholders)
        addFileToPost(file) {
            console.log('📁 Add file to post - to be implemented:', file);
        },

        removeAttachedFile(index) {
            console.log('🗑️ Remove attached file - to be implemented:', index);
        },

        getCloudStatus(doc) {
            return 'synced'; // Placeholder
        },

        addTagDirect(tag) {
            if (this.isReadOnlyMode) return;
            
            if (tag && !this.content.tags.includes(tag)) {
                this.content.tags.push(tag);
                this.hasUnsavedChanges = true;
                if (this.debouncedAutoSave) this.debouncedAutoSave();
            }
        },

        // =============================================================================
        // MISSING METHODS TO FIX INFINITE RECURSION
        // =============================================================================

        async loadLocalFile(file) {
            this.currentFile = file;
            this.fileType = 'local';
            
            console.log('📂 Loading local file:', file.name);
            
            // Load content from localStorage
            const content = JSON.parse(localStorage.getItem(`dlux_tiptap_file_${file.id}`) || '{}');
            this.content = content;
            
            await this.cleanupCurrentDocument();
            await this.createEditors();
            
            console.log('📂 Local file loaded:', file.name);
        },

        async loadCollaborativeFile(file) {
            this.currentFile = {
                ...file,
                type: 'collaborative'
            };
            this.fileType = 'collaborative';
            
            console.log('📂 Loading collaborative file:', file.permlink);
            
            this.content = {
                title: '',
                body: '',
                tags: ['dlux', 'collaboration'],
                custom_json: {
                    app: 'dlux/0.1.0',
                    authors: [file.owner]
                }
            };
            
            try {
                await this.createEditors();
                await this.connectToCollaborationServer(file);
                console.log('📂 Collaborative file loaded:', file.permlink);
            } catch (error) {
                console.error('❌ Failed to load collaborative file:', error);
                await this.createEditors(); // Fallback to local mode
            }
        },

        disconnectCollaboration() {
            console.log('🔌 Disconnecting collaboration...');
            this.connectionStatus = 'disconnected';
            if (this.provider) {
                this.provider.destroy();
                this.provider = null;
            }
        },

        async reconnectToCollaborativeDocument() {
            if (!this.currentFile || this.currentFile.type !== 'collaborative') {
                console.error('Cannot reconnect: no collaborative document loaded');
                return;
            }

            console.log('🔄 Reconnecting to collaborative document...');
            this.connectionStatus = 'connecting';
            
            try {
                await this.connectToCollaborationServer(this.currentFile);
                console.log('✅ Successfully reconnected');
            } catch (error) {
                console.error('❌ Failed to reconnect:', error);
                this.connectionStatus = 'offline';
            }
        },

        async deleteLocalFileWithConfirm(file) {
            const confirmMsg = `Delete local file "${file.name}"?\n\nThis action cannot be undone.`;
            if (confirm(confirmMsg)) {
                try {
                    // Remove from localStorage
                    localStorage.removeItem(`dlux_tiptap_file_${file.id}`);
                    
                    // Remove from index
                    const files = JSON.parse(localStorage.getItem('dlux_tiptap_files') || '[]');
                    const updatedFiles = files.filter(f => f.id !== file.id);
                    localStorage.setItem('dlux_tiptap_files', JSON.stringify(updatedFiles));
                    
                    await this.loadLocalFiles();
                    console.log('✅ Local file deleted successfully');
                    
                    // If we deleted the currently loaded file, create a new document
                    if (this.currentFile?.id === file.id) {
                        await this.newDocument();
                    }
                } catch (error) {
                    console.error('❌ Failed to delete local file:', error);
                    alert(`Failed to delete file: ${error.message}`);
                }
            }
        },

        async deleteCollaborativeDocWithConfirm(doc) {
            if (doc.owner !== this.username) {
                alert('You can only delete documents that you own.');
                return;
            }
            
            const confirmMsg = `Delete collaborative document "${doc.permlink}"?\n\nThis action cannot be undone and will affect all collaborators.`;
            if (confirm(confirmMsg)) {
                try {
                    // Call API to delete document
                    const response = await fetch(`https://data.dlux.io/api/collaboration/documents/${doc.owner}/${doc.permlink}`, {
                        method: 'DELETE',
                        headers: this.authHeaders
                    });
                    
                    if (response.ok) {
                        // Reload collaborative docs list
                        this.collaborativeDocs = this.collaborativeDocs.filter(d => d.permlink !== doc.permlink);
                        console.log('✅ Collaborative document deleted successfully');
                        
                        // If we deleted the currently loaded file, create a new document
                        if (this.currentFile?.permlink === doc.permlink) {
                            await this.newDocument();
                        }
                    } else {
                        throw new Error('Failed to delete document');
                    }
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
            if (!this.isAuthenticated) {
                alert('You need to authenticate to manage cloud files.');
                return;
            }

            const ownedDocs = this.collaborativeDocs.filter(doc => doc.owner === this.username);
            
            if (ownedDocs.length === 0) {
                alert('You don\'t own any cloud documents to delete.');
                return;
            }

            const confirmMsg = `Delete ALL your cloud documents (${ownedDocs.length} files)?\n\nThis action cannot be undone and will affect any collaborators on these documents.`;
            if (confirm(confirmMsg)) {
                try {
                    let successCount = 0;
                    let failureCount = 0;
                    
                    for (const doc of ownedDocs) {
                        try {
                            const response = await fetch(`https://data.dlux.io/api/collaboration/documents/${doc.owner}/${doc.permlink}`, {
                                method: 'DELETE',
                                headers: this.authHeaders
                            });
                            
                            if (response.ok) {
                                successCount++;
                                console.log(`✅ Deleted: ${doc.documentName || doc.permlink}`);
                            } else {
                                failureCount++;
                                console.error(`❌ Failed to delete ${doc.documentName || doc.permlink}`);
                            }
                        } catch (error) {
                            failureCount++;
                            console.error(`❌ Failed to delete ${doc.documentName || doc.permlink}:`, error);
                        }
                    }
                    
                    // Reload collaborative documents
                    this.collaborativeDocs = this.collaborativeDocs.filter(doc => doc.owner !== this.username);
                    
                    const resultMsg = `Cloud files cleanup completed.\n\n✅ Successfully deleted: ${successCount} files${failureCount > 0 ? `\n❌ Failed to delete: ${failureCount} files` : ''}`;
                    alert(resultMsg);
                    
                    // If current file was one of the deleted collaborative files, create a new document
                    if (this.currentFile && 
                        this.currentFile.type === 'collaborative' && 
                        this.currentFile.owner === this.username) {
                        await this.newDocument();
                    }
                } catch (error) {
                    console.error('❌ Failed to clear cloud files:', error);
                    alert(`Failed to clear cloud files: ${error.message}`);
                }
            }
        },

        async performSave() {
            if (!this.hasValidFilename) return;
            
            this.saving = true;
            
            try {
                if (this.saveForm.storageType === 'cloud' && this.isAuthenticated) {
                    // Create collaborative document
                    const response = await fetch('https://data.dlux.io/api/collaboration/documents', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...this.authHeaders
                        },
                        body: JSON.stringify({
                            documentName: this.saveForm.filename,
                            isPublic: this.saveForm.isPublic,
                            title: this.content.title || this.saveForm.filename,
                            description: this.saveForm.description || 'Document created with DLUX TipTap Editor'
                        })
                    });
                    
                    if (response.ok) {
                        const docData = await response.json();
                        const serverDoc = docData.document || docData;
                        
                        this.currentFile = {
                            ...serverDoc,
                            type: 'collaborative'
                        };
                        this.fileType = 'collaborative';
                        
                        await this.connectToCollaborationServer(serverDoc);
                    } else {
                        throw new Error('Failed to create collaborative document');
                    }
                } else {
                    // Save as local file
                    const fileId = Date.now().toString();
                    const fileData = {
                        id: fileId,
                        name: this.saveForm.filename,
                        type: 'local',
                        lastModified: new Date().toISOString(),
                        ...this.content
                    };
                    
                    // Save content
                    localStorage.setItem(`dlux_tiptap_file_${fileId}`, JSON.stringify(this.content));
                    
                    // Update file index
                    await this.updateLocalFileIndex();
                    
                    this.currentFile = fileData;
                    this.fileType = 'local';
                }
                
                this.showSaveModal = false;
                this.hasUnsavedChanges = false;
                this.saveForm.filename = '';
                this.saveForm.isNewDocument = false;
                
                                 console.log('✅ Document saved successfully');
             } catch (error) {
                 console.error('Save failed:', error);
                 alert('Save failed: ' + error.message);
             } finally {
                 this.saving = false;
             }
         },

         // =============================================================================
         // ADDITIONAL MISSING METHODS FOR TEMPLATE FUNCTIONALITY
         // =============================================================================

         async confirmUnsavedChanges() {
             if (!this.hasUnsavedChanges) return true;
             return confirm('You have unsaved changes. Do you want to continue without saving?');
         },

         updateEditorPermissions() {
             console.log('🔐 Updating editor permissions...');
             // Set read-only mode based on permissions
             if (this.titleEditor) {
                 this.titleEditor.setEditable(!this.isReadOnlyMode);
             }
             if (this.bodyEditor) {
                 this.bodyEditor.setEditable(!this.isReadOnlyMode);
             }
             if (this.permlinkEditor) {
                 this.permlinkEditor.setEditable(!this.isReadOnlyMode);
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
                 const response = await fetch(`https://data.dlux.io/api/collaboration/permissions/${this.currentFile.owner}/${this.currentFile.permlink}`, {
                     headers: this.authHeaders
                 });
                 
                 if (response.ok) {
                     const data = await response.json();
                     this.documentPermissions = data.permissions || [];
                     console.log('✅ Document permissions loaded:', this.documentPermissions.length);
                 } else {
                     console.warn('Failed to load permissions:', response.statusText);
                     this.documentPermissions = [];
                 }
             } catch (error) {
                 console.error('Error loading permissions:', error);
                 this.documentPermissions = [];
             } finally {
                 this.loadingPermissions = false;
             }
         },

         setEditorContent(content) {
             if (this.titleEditor && content.title) {
                 this.titleEditor.commands.setContent(content.title);
             }
             if (this.bodyEditor && content.body) {
                 this.bodyEditor.commands.setContent(content.body);
             }
             if (this.permlinkEditor && content.permlink) {
                 this.permlinkEditor.commands.setContent(content.permlink);
             }
         },

         getPlainTextTitle() {
             if (this.titleEditor) {
                 return this.titleEditor.getText();
             }
             return this.content.title || '';
         },

         async createNewDocumentFromName(name) {
             console.log('📝 Creating new document:', name);
             
             // Create new local file
             const fileId = Date.now().toString();
             const fileData = {
                 id: fileId,
                 name: name,
                 type: 'local',
                 lastModified: new Date().toISOString()
             };
             
             this.currentFile = fileData;
             this.fileType = 'local';
             
             // Initialize content
             this.content = {
                 title: name,
                 body: '',
                 tags: [],
                 custom_json: {},
                 permlink: '',
                 beneficiaries: []
             };
             
             // Create editors
             await this.createEditors();
             
             // Update file index
             await this.updateLocalFileIndex();
             
             console.log('✅ New document created:', name);
         },

         async renameCurrentDocument(newName) {
             if (!this.currentFile) return;
             
             this.currentFile.name = newName;
             this.currentFile.documentName = newName;
             
             if (this.currentFile.type === 'local') {
                 await this.saveLocalDocument();
                 await this.updateLocalFileIndex();
             }
             
             console.log('📝 Document renamed to:', newName);
         },

         validateHiveRequirements() {
             const errors = [];
             
             if (!this.content.title || this.content.title.trim().length === 0) {
                 errors.push('Title is required');
             }
             
             if (!this.content.body || this.content.body.trim().length === 0) {
                 errors.push('Content body is required');
             }
             
             if (this.content.tags.length === 0) {
                 errors.push('At least one tag is required');
             }
             
             return {
                 isValid: errors.length === 0,
                 errors: errors
             };
         },

         trackUserPresence(userInfo) {
             console.log('👤 Tracking user presence:', userInfo.username);
             
             // Add to collaborative authors if not already present
             const existingAuthor = this.collaborativeAuthors.find(author => author.username === userInfo.username);
             if (!existingAuthor) {
                 this.collaborativeAuthors.push({
                     username: userInfo.username,
                     color: userInfo.color,
                     connectedAt: userInfo.connectedAt || new Date().toISOString(),
                     lastSeen: new Date().toISOString()
                 });
             } else {
                 existingAuthor.lastSeen = new Date().toISOString();
             }
         },

         addCollaborationCursor(provider) {
             console.log('🎯 Adding collaboration cursor support...');
             
             if (!provider || !provider.awareness) {
                 console.warn('Provider or awareness not available for cursor collaboration');
                 return;
             }
             
             // Set user info in awareness
             provider.awareness.setLocalStateField('user', {
                 name: this.username,
                 color: this.userColor
             });
             
                           console.log('✅ Collaboration cursor added');
          },

          // =============================================================================
          // UTILITY AND FORMATTING METHODS
          // =============================================================================

          formatFileDate(dateString) {
              if (!dateString) return 'Unknown';
              const date = new Date(dateString);
              if (isNaN(date.getTime())) return 'Invalid Date';
              return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
          },

          formatFileSize(bytes) {
              if (!bytes || bytes === 0) return '0 B';
              const k = 1024;
              const sizes = ['B', 'KB', 'MB', 'GB'];
              const i = Math.floor(Math.log(bytes) / Math.log(k));
              return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
          },

          getStatusStyle(state) {
              const styles = {
                  'connected': { backgroundColor: '#2ecc71', color: 'white' },
                  'connecting': { backgroundColor: '#f39c12', color: 'white' },
                  'synced': { backgroundColor: '#27ae60', color: 'white' },
                  'disconnected': { backgroundColor: '#e74c3c', color: 'white' },
                  'offline': { backgroundColor: '#95a5a6', color: 'white' },
                  'error': { backgroundColor: '#c0392b', color: 'white' }
              };
              return styles[state] || { backgroundColor: '#95a5a6', color: 'white' };
          },

          getStatusIconClass(state) {
              const icons = {
                  'connected': 'fas fa-check-circle',
                  'connecting': 'fas fa-spinner fa-spin',
                  'synced': 'fas fa-cloud-upload-alt',
                  'disconnected': 'fas fa-exclamation-triangle',
                  'offline': 'fas fa-wifi-slash',
                  'error': 'fas fa-times-circle'
              };
              return icons[state] || 'fas fa-question-circle';
          },

          getStatusTextClass(state) {
              const classes = {
                  'connected': 'text-success',
                  'connecting': 'text-warning',
                  'synced': 'text-success',
                  'disconnected': 'text-danger',
                  'offline': 'text-muted',
                  'error': 'text-danger'
              };
              return classes[state] || 'text-muted';
          },

          // =============================================================================
          // CONNECTION LIFECYCLE METHODS
          // =============================================================================

          disconnectWebSocketOnly() {
              console.log('🔌 Disconnecting WebSocket only (preserving Y.js document)...');
              if (this.provider) {
                  this.provider.disconnect();
                  this.provider = null;
              }
              this.connectionStatus = 'disconnected';
          },

          fullCleanupCollaboration() {
              console.log('🧹 Full collaboration cleanup...');
              this.disconnectWebSocketOnly();
              
              if (this.ydoc) {
                  this.ydoc.destroy();
                  this.ydoc = null;
              }
              
              this.ytitle = null;
              this.ybody = null;
              this.ymap = null;
              this.collaborativeAuthors = [];
              this.documentPermissions = [];
              this.connectionStatus = 'disconnected';
          },

          onConnect() {
              console.log('✅ WebSocket connected');
              this.connectionStatus = 'connected';
              
              // Track user presence
              if (this.authHeaders?.['x-account']) {
                  const userInfo = {
                      username: this.authHeaders['x-account'],
                      color: this.userColor,
                      connectedAt: new Date().toISOString()
                  };
                  this.trackUserPresence(userInfo);
              }
              
              // Add collaboration cursor if provider is available
              if (this.provider && this.currentFile?.type === 'collaborative') {
                  this.addCollaborationCursor(this.provider);
              }
          },

          onDisconnect() {
              console.log('❌ WebSocket disconnected');
              this.connectionStatus = 'disconnected';
          },

          onSynced() {
              console.log('🔄 Document synced with server');
              this.connectionStatus = 'synced';
              this.lastSyncTime = new Date().toISOString();
          },

          onAuthenticationFailed(reason) {
              console.error('🔐 Authentication failed:', reason);
              this.connectionStatus = 'error';
              alert(`Authentication failed: ${reason}`);
          },

          // =============================================================================
          // EDITOR CONTENT MANAGEMENT
          // =============================================================================

          getEditorContent() {
              return {
                  title: this.titleEditor ? this.titleEditor.getHTML() : this.content.title,
                  body: this.bodyEditor ? this.bodyEditor.getHTML() : this.content.body,
                  permlink: this.permlinkEditor ? this.permlinkEditor.getHTML() : this.content.permlink
              };
          },

          clearEditor() {
              if (this.titleEditor) {
                  this.titleEditor.commands.clearContent();
              }
              if (this.bodyEditor) {
                  this.bodyEditor.commands.clearContent();
              }
              if (this.permlinkEditor) {
                  this.permlinkEditor.commands.clearContent();
              }
              
              this.content = {
                  title: '',
                  body: '',
                  tags: [],
                  custom_json: {},
                  permlink: '',
                  beneficiaries: []
              };
          },

          restorePreservedContent(field, editor) {
              if (!editor || !this.content[field]) return;
              
              try {
                  editor.commands.setContent(this.content[field]);
                  console.log(`✅ Restored ${field} content`);
              } catch (error) {
                  console.warn(`Failed to restore ${field} content:`, error);
              }
          },

          // =============================================================================
          // CONTENT PROCESSING METHODS
          // =============================================================================

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

          getPlainTextContent() {
              const title = this.titleEditor ? this.titleEditor.getText().trim() : '';
              const body = this.bodyEditor ? this.bodyEditor.getText().trim() : '';
              
              return title ? `${title}\n\n${body}` : body;
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
                            <li v-else><a class="dropdown-item d-flex align-items-center gap-2" href="#" @click="!isAuthenticated ? requestAuthentication() : convertToCollaborative()"
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
             <i class="fas fa-file fa-fw"></i>
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
            <span v-else class="">
                <!-- Clickable "Untitled" for new documents -->
                <i class="fas fa-file-plus me-1"></i>
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
                    <!-- Authentication Status Header -->
                     <!-- Unified Status Indicator -->
                        <li>
                         <div class="d-flex align-items-center">
                             <i :class="getStatusIconClass(unifiedStatusInfo.state)" class="me-2 small"></i>
                             <span :class="getStatusTextClass(unifiedStatusInfo.state)" class="small fw-medium">
                                 {{ unifiedStatusInfo.message }}
                             </span>
                         </div>
                       
                          <div class="mt-2 pt-2 border-top border-light border-opacity-25">
                      <p class="small text-white-50 mb-2">{{ unifiedStatusInfo.details }}</p>
                      <div v-if="unifiedStatusInfo.actions.length" class="d-flex gap-1">
                          <button 
                              v-for="action in unifiedStatusInfo.actions" 
                              :key="action.label"
                              @click.stop="handleStatusAction(action)"
                              class="btn btn-sm btn-outline-light"
                          >
                              {{ action.label }}
                          </button>
                      </div>
                  </div></li>

                    <li class="dropdown-header d-flex align-items-center justify-content-between">
                        <span>Authentication Status</span>
                        <span v-if="!isAuthenticated || isAuthExpired" class="badge bg-warning text-dark">
                            <i class="fas fa-key me-1"></i>{{ isAuthExpired ? 'Expired' : 'Required' }}
                        </span>
                        <span v-else class="badge bg-success">
                            <i class="fas fa-check me-1"></i>Authenticated
                        </span>
                    </li>
                    
                    <!-- Authentication Actions -->
                    <li v-if="!isAuthenticated || isAuthExpired">
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
                    

                                         <!-- Document Publishing & Connection -->
                     <li v-if="currentFile && currentFile.type !== 'collaborative'">
                         <a class="dropdown-item" href="#" @click.prevent="!isAuthenticated ? requestAuthentication() : convertToCollaborative()">
                             <i class="fas fa-cloud-upload-alt me-2"></i>Save to Cloud
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
                     
                     <!-- Document Sharing & Collaboration -->
                     <li class="dropdown-header">Collaboration</li>
                     <li><a class="dropdown-item" href="#" @click.prevent="shareDocument"
                             :class="{ disabled: !canShare }">
                             <i class="fas fa-user-plus me-2"></i>Share Document
                                                           <small v-if="!isCollaborativeMode" class="d-block text-muted">Cloud collaboration required</small>
                             <small v-if="!canShare && (!isAuthenticated || isAuthExpired)" class="d-block text-muted">Authentication required</small>
                         </a></li>
                                                  
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
                        <button @click="bodyEditor?.chain().focus().undo().run()" :disabled="!bodyEditor?.can().undo()"
                            class="btn btn-sm btn-dark" type="button" title="Undo">
                            <i class="fas fa-undo"></i>
                        </button>
                        <button @click="bodyEditor?.chain().focus().redo().run()" :disabled="!bodyEditor?.can().redo()"
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
                        <textarea v-model="customJsonString" @input="validateCustomJson"
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
                                <th scope="col" style="width: 35%;">Name</th>
                                <th scope="col">Details</th>
                                <th scope="col">Your Access</th>
                                <th scope="col">Last Modified</th>
                                <th scope="col" class="text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="file in allDocuments" :key="file.id || file.documentPath"
                                :class="file.type === 'collaborative' ? 'row-collaborative' : 'row-local'">
                                <td @click="loadDocument(file)" class="cursor-pointer">
                                    <strong class="d-block text-white">{{ file.name || file.documentName ||
                                        file.permlink }}</strong>
                                    <small
                                        v-if="file.type === 'collaborative' && file.documentName && file.documentName !== file.permlink"
                                        class="text-muted">{{ file.permlink }}</small>
                                </td>
                                <td @click="loadDocument(file)" class="cursor-pointer">
                                    <small v-if="file.type === 'local'" class="text-muted">{{
                                        formatFileSize(file.size) }}</small>
                                    <small v-if="file.type === 'collaborative'" class="text-muted">by @{{ file.owner
                                        }}</small>
                                </td>
                                <td @click="loadDocument(file)" class="cursor-pointer">
                                    <span class="badge" 
                                        :class="'bg-' + getPermissionDisplayInfo(getUserPermissionLevel(file)).color"
                                        :title="getPermissionDisplayInfo(getUserPermissionLevel(file)).description">
                                        <i :class="getPermissionDisplayInfo(getUserPermissionLevel(file)).icon" class="me-1"></i>
                                        {{ getPermissionDisplayInfo(getUserPermissionLevel(file)).label }}
                                    </span>
                                </td>
                                <td @click="loadDocument(file)" class="cursor-pointer">
                                    <small>{{ formatFileDate(file.lastModified || file.updatedAt) }}</small>
                                </td>
                                <td class="text-end">
                                    <button @click.stop="loadDocument(file)" class="btn btn-sm btn-outline-light me-1"
                                        title="Load document">
                                        <i class="fas fa-folder-open"></i>
                                    </button>
                                    <button v-if="file.type === 'local'" @click.stop="deleteLocalFileWithConfirm(file)"
                                        class="btn btn-sm btn-outline-danger" title="Delete file">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                    <button v-if="file.type === 'collaborative'"
                                        @click.stop="deleteCollaborativeDocWithConfirm(file)"
                                        class="btn btn-sm btn-outline-danger"
                                        :disabled="file.owner !== authHeaders['x-account']"
                                        :title="file.owner === authHeaders['x-account'] ? 'Delete document' : 'Only document owner can delete'">
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
                    <div class="d-flex align-items-center justify-content-between p-2 bg-light rounded mb-2">
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
                            class="d-flex align-items-center justify-content-between p-2 bg-light rounded mb-2">
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
                    <div v-if="validationResults.valid" class="alert alert-success border-success bg-dark text-success">
                        <i class="fas fa-check-circle me-2"></i>
                        <strong>Valid Hive Structure</strong> - Ready for broadcast
                    </div>
                    <div v-else class="alert alert-danger border-danger bg-dark text-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        <strong>Validation Issues Found</strong>
                        <ul class="mb-0 mt-2">
                            <li v-for="error in validationResults.errors" :key="error">{{ error }}</li>
                        </ul>
                    </div>
                    <div v-if="validationResults.warnings && validationResults.warnings.length > 0" 
                         class="alert alert-warning border-warning bg-dark text-warning mt-2">
                        <i class="fas fa-exclamation-circle me-2"></i>
                        <strong>Warnings</strong>
                        <ul class="mb-0 mt-2">
                            <li v-for="warning in validationResults.warnings" :key="warning">{{ warning }}</li>
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
                            <button @click="copyJsonToClipboard(completeJsonPreview)" 
                                    class="btn btn-sm btn-outline-success">
                                <i class="fas fa-copy me-1"></i>Copy All
                            </button>
                        </div>
                        <pre class="bg-secondary text-white p-3 rounded" style="max-height: 500px; overflow-y: auto; font-size: 0.85em;">{{ JSON.stringify(completeJsonPreview, null, 2) }}</pre>
                    </div>

                    <!-- Comment Operation Tab -->
                    <div v-if="jsonPreviewTab === 'comment'" class="tab-pane active">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h6 class="text-info mb-0">Comment Operation</h6>
                            <button @click="copyJsonToClipboard(commentOperationPreview)" 
                                    class="btn btn-sm btn-outline-success">
                                <i class="fas fa-copy me-1"></i>Copy
                            </button>
                        </div>
                        <div class="small text-muted mb-2">
                            The main comment operation containing title, body, and json_metadata
                        </div>
                        <pre class="bg-secondary text-white p-3 rounded" style="max-height: 500px; overflow-y: auto; font-size: 0.85em;">{{ JSON.stringify(commentOperationPreview, null, 2) }}</pre>
                    </div>

                    <!-- Comment Options Tab -->
                    <div v-if="jsonPreviewTab === 'comment_options'" class="tab-pane active">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h6 class="text-info mb-0">Comment Options Operation</h6>
                            <button @click="copyJsonToClipboard(commentOptionsPreview)" 
                                    class="btn btn-sm btn-outline-success"
                                    :disabled="!commentOptionsPreview">
                                <i class="fas fa-copy me-1"></i>Copy
                            </button>
                        </div>
                        <div class="small text-muted mb-2">
                            Advanced settings like beneficiaries, payout options, and voting preferences
                        </div>
                        <div v-if="!commentOptionsPreview" class="alert alert-info border-info bg-dark text-info">
                            <i class="fas fa-info-circle me-2"></i>
                            No comment options configured - using Hive defaults
                        </div>
                        <pre v-else class="bg-secondary text-white p-3 rounded" style="max-height: 500px; overflow-y: auto; font-size: 0.85em;">{{ JSON.stringify(commentOptionsPreview, null, 2) }}</pre>
                    </div>

                    <!-- Metadata Tab -->
                    <div v-if="jsonPreviewTab === 'metadata'" class="tab-pane active">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h6 class="text-info mb-0">Generation Metadata</h6>
                            <button @click="copyJsonToClipboard(metadataPreview)" 
                                    class="btn btn-sm btn-outline-success">
                                <i class="fas fa-copy me-1"></i>Copy
                            </button>
                        </div>
                        <div class="small text-muted mb-2">
                            Information about how this JSON was generated and collaborative data
                        </div>
                        <pre class="bg-secondary text-white p-3 rounded" style="max-height: 500px; overflow-y: auto; font-size: 0.85em;">{{ JSON.stringify(metadataPreview, null, 2) }}</pre>
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
  </teleport>
    `,

    watch: {
        authHeaders: {
            handler(newHeaders, oldHeaders) {
                // Reset auth failure when new auth headers are received
                if (newHeaders && newHeaders['x-account']) {
                    const isNewAuth = !oldHeaders || 
                        oldHeaders['x-challenge'] !== newHeaders['x-challenge'] ||
                        oldHeaders['x-signature'] !== newHeaders['x-signature'];
                    
                    if (isNewAuth) {
                        console.log('🔐 New authentication received');
                        
                        // Load collaborative docs if authenticated
                        if (!this.isAuthExpired) {
                            // Load collaborative docs would go here
                            this.loadingDocs = true;
                            setTimeout(() => {
                                this.collaborativeDocs = []; // Placeholder
                                this.loadingDocs = false;
                            }, 1000);
                        } else {
                            this.collaborativeDocs = [];
                        }
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
                if (newPostType && this.currentFile?.type === 'collaborative') {
                    console.log('📝 Post type changed:', newPostType);
                    // Handle post type change would go here
                }
            }
        },
        
        // Watch for DLUX asset changes from parent
        dluxAssets: {
            handler(newAssets) {
                if (newAssets && this.currentFile?.type === 'collaborative') {
                    console.log('🎨 Assets changed:', newAssets.length);
                    // Handle asset update would go here
                }
            },
            deep: true
        },
        
        // Watch connection status changes
        connectionStatus: {
            handler(newStatus, oldStatus) {
                if (oldStatus && newStatus !== oldStatus) {
                    console.log(`🔐 Connection status changed: ${oldStatus} → ${newStatus}`);
                    
                    // Update editor permissions when connection status changes
                    if (this.currentFile?.type === 'collaborative') {
                        console.log('🔐 Updating editor permissions due to connection status change');
                        // Update editor permissions would go here
                    }
                }
            }
        }
    }
};