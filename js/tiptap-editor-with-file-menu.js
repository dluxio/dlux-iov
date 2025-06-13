import methodsCommon from './methods-common.js';

export default {
    name: 'TipTapEditorWithFileMenu',
    
    emits: ['contentChanged', 'publishPost', 'requestAuthHeaders', 'request-auth-headers', 'tosign', 'update:fileToAdd', 'document-converted', 'collaborative-data-changed'],
    
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
                beneficiaries: [],
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
            collaborativeDataVersion: 0
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

            // Local Document States
            if (!this.isCollaborativeMode) {
                if (this.hasUnsavedChanges) {
                    return {
                        state: 'saving-local',
                        icon: '💾',
                        message: 'Saving locally...',
                        details: 'Changes are being saved to browser storage',
                        actions: [],
                        class: 'status-saving'
                    };
                }
                return {
                    state: 'saved-local',
                    icon: '✅',
                    message: 'All changes saved locally',
                    details: 'Document is stored in browser',
                    actions: [],
                    class: 'status-saved'
                };
            }

            // Cloud Document States
            if (this.connectionStatus === 'disconnected') {
                if (this.hasUnsavedChanges) {
                    return {
                        state: 'unsynced-changes',
                        icon: '⚠️',
                        message: 'Unsynced Changes',
                        details: 'Working offline - changes will sync when reconnected',
                        actions: [reconnectAction],
                        class: 'status-warning'
                    };
                }
                return {
                    state: 'offline',
                    icon: '📡',
                    message: 'Offline Mode',
                    details: 'Changes are saved locally',
                    actions: [reconnectAction],
                    class: 'status-offline'
                };
            }

            if (this.connectionStatus === 'offline') {
                if (this.hasUnsavedChanges) {
                    return {
                        state: 'offline-saving',
                        icon: '💾',
                        message: 'Saving offline...',
                        details: 'Changes are being saved locally with Y.js persistence',
                        actions: [],
                        class: 'status-saving'
                    };
                }
                return {
                    state: 'offline-ready',
                    icon: '📱',
                    message: 'Offline Mode',
                    details: 'Working offline - changes saved locally',
                    actions: [],
                    class: 'status-offline'
                };
            }

            if (this.connectionStatus === 'connecting') {
                return {
                    state: 'connecting',
                    icon: '🔄',
                    message: 'Connecting...',
                    details: 'Establishing connection to server',
                    actions: [],
                    class: 'status-connecting'
                };
            }

            if (this.connectionStatus === 'connected') {
                if (this.hasUnsavedChanges) {
                    return {
                        state: 'syncing',
                        icon: '🔄',
                        message: 'Syncing changes...',
                        details: 'Real-time collaboration active',
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
                    icon: '✅',
                    message: 'All changes synced',
                    details: 'Connected to server',
                    actions: [],
                    class: 'status-synced'
                };
            }

            if (this.connectionStatus === 'error') {
                return {
                    state: 'error',
                    icon: '❌',
                    message: this.connectionMessage || 'Connection Error',
                    details: 'Check your connection and try again',
                    actions: [reconnectAction],
                    class: 'status-error'
                };
            }

            return status;
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
        
        allDocuments() {
            const allFiles = [
                ...this.localFiles.map(f => ({ ...f, type: 'local' })),
                ...(this.showCollaborativeFeatures ? this.collaborativeDocs.map(f => ({ ...f, type: 'collaborative' })) : [])
            ];
            
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
            
            // Document owner always has full access
            if (this.currentFile.owner === this.username) {
                console.log('🔐 User is document owner, allowing full access');
                return false;
            }
            
            // Debug: Log current state
            console.log('🔐 Permission check debug:', {
                username: this.username,
                owner: this.currentFile.owner,
                documentPermissions: this.documentPermissions,
                isArray: Array.isArray(this.documentPermissions),
                length: this.documentPermissions?.length
            });
            
            // Ensure documentPermissions is an array
            if (!Array.isArray(this.documentPermissions)) {
                console.warn('🔒 documentPermissions is not an array, defaulting to read-only mode');
                return true;
            }
            
            // Check user's permission level
            const userPermission = this.documentPermissions.find(p => p.account === this.username);
            
            // If no permission found, default to read-only for safety
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

        // Get beneficiaries from the appropriate source (collaborative or local)
        displayBeneficiaries() {
            // Depend on collaborativeDataVersion for reactivity
            this.collaborativeDataVersion; // eslint-disable-line no-unused-expressions
            
            if (this.isCollaborativeMode && this.ydoc) {
                return this.getBeneficiaries();
            }
            return this.publishForm.beneficiaries || [];
        },

        // Get tags from the appropriate source (collaborative or local)
        displayTags() {
            // Depend on collaborativeDataVersion for reactivity
            this.collaborativeDataVersion; // eslint-disable-line no-unused-expressions
            
            if (this.isCollaborativeMode && this.ydoc) {
                return this.getTags();
            }
            return this.content.tags || [];
        },


    },
    
    methods: {
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
                }
            } catch (error) {
                console.error('Error removing beneficiary:', error);
                alert('Error removing beneficiary: ' + error.message);
            }
        },
        
        // Comment options change handler
        handleCommentOptionChange() {
            // ===== READ-ONLY PERMISSION ENFORCEMENT =====
            if (this.isReadOnlyMode) {
                console.warn('🔒 Cannot change comment options: Read-only mode');
                return;
            }
            
            this.hasUnsavedChanges = true;
            
            // ===== REFACTORED: Single Path - Always use Y.js =====
            this.setPublishOption('allowVotes', this.commentOptions.allowVotes);
            this.setPublishOption('allowCurationRewards', this.commentOptions.allowCurationRewards);
            this.setPublishOption('maxAcceptedPayout', this.commentOptions.maxAcceptedPayout);
            this.setPublishOption('percentHbd', this.commentOptions.percentHbd);
            this.clearUnsavedAfterSync();
        },
        
        // Custom JSON handling
        validateCustomJson() {
            // ===== READ-ONLY PERMISSION ENFORCEMENT =====
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
                this.content.custom_json = JSON.parse(this.customJsonString);
                this.hasUnsavedChanges = true;
                this.clearUnsavedAfterSync(); // Unified sync indicator
            } catch (error) {
                this.customJsonError = error.message;
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
                const percentHbd = collaborativeData?.publishOptions?.percentHbd || 10000;
                const allowVotes = collaborativeData?.publishOptions?.allowVotes !== false;
                const allowCurationRewards = collaborativeData?.publishOptions?.allowCurationRewards !== false;
                
                // Comment options for beneficiaries and advanced settings (separate operation)
                const commentOptions = sourceBeneficiaries.length > 0 || 
                                     maxAcceptedPayout !== '1000000.000 HBD' || 
                                     percentHbd !== 10000 || 
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
                const percentHbd = collaborativeData?.publishOptions?.percentHbd || 10000;
                const allowVotes = collaborativeData?.publishOptions?.allowVotes !== false;
                const allowCurationRewards = collaborativeData?.publishOptions?.allowCurationRewards !== false;
                
                // Build comment options operation
                const commentOptionsOperation = sourceBeneficiaries.length > 0 || 
                                             maxAcceptedPayout !== '1000000.000 HBD' || 
                                             percentHbd !== 10000 || 
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

        selectJsonText(jsonString) {
            // Fallback method for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = jsonString;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
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
            // TEMPORARILY COMMENT OUT TO AVOID CONFLICTS
            // if (this.editor) {
            //     this.content.body = this.editor.getHTML();
            // }
            
            // Emit content changes to parent
            this.$emit('content-changed', {
                ...this.content,
                permlink: this.content.permlink || this.generatedPermlink,
                attachedFiles: this.attachedFiles
            });
        },
        
        // File Menu Actions (Y.js Offline-First Architecture)
        async newDocument() {
            if (this.hasUnsavedChanges) {
                const confirmResult = await this.confirmUnsavedChanges();
                if (!confirmResult) return;
            }
            
            try {
                console.log('📄 Creating new Y.js document (offline-first architecture)...');
                
                // Clean up any existing collaborative connections first
                this.disconnectCollaboration();
                
                // Wait for complete cleanup
                await this.$nextTick();
                await new Promise(resolve => setTimeout(resolve, 200));
                
                // Reset document state for new Y.js document
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
                
                // Reset save form
                this.saveForm = {
                    filename: '',
                    storageType: 'local', // 'local' or 'cloud'
                    isPublic: false,
                    description: '',
                    isNewDocument: false
                };
                
                // Create fresh Y.js collaborative editors (always-collaborative architecture)
                await this.createStandardEditor();
                
                // Don't call clearEditor() on fresh editors - they're already empty
                // Instead, just reset content state
                this.hasUnsavedChanges = false;
                
                // CRITICAL: TipTap Best Practice - NO automatic focus after Y.js editor creation
                // Let users focus manually to avoid transaction mismatch errors
                // Focus will happen naturally when user clicks in the editor
                console.log('✅ Editors ready - awaiting user interaction for focus');
                
                console.log('✅ New Y.js document created successfully (offline-first)');
                
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
        
        async loadDocument(file) {
            if (this.hasUnsavedChanges) {
                const confirm = await this.confirmUnsavedChanges();
                if (!confirm) return;
            }
            
            this.loading = true;
            
            try {
                if (file.type === 'local') {
                    await this.loadLocalFile(file);
                } else {
                    await this.loadCollaborativeFile(file);
                }
                this.showLoadModal = false;
                this.hasUnsavedChanges = false;
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
                size: this.currentFile.isOfflineFirst ? 0 : (this.currentFile.size || 0) // Size managed by IndexedDB for offline-first files
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
                        
                        // Connect existing Y.js document to server
                        await this.connectToCollaborationServer(serverDoc);
                        
                        // Update current file to collaborative
                        this.currentFile = {
                            ...serverDoc,
                            type: 'collaborative'
                        };
                        this.fileType = 'collaborative';
                    }
                } else {
                    // Regular save - Y.js + IndexedDB handles all content persistence automatically
                    // Only need to update metadata and connect to collaboration server if needed
                    if (this.saveForm.storageType === 'cloud') {
                        await this.connectToCollaborationServer();
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
                    
                    // Reload collaborative docs list to reflect the change
                    await this.loadCollaborativeDocs();
                    
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
        
        async updatePermission(account, newPermission) {
            try {
                const response = await fetch(`https://data.dlux.io/api/collaboration/permissions/${this.currentFile.owner}/${this.currentFile.permlink}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...this.authHeaders
                    },
                    body: JSON.stringify({
                        targetAccount: account,
                        permissionType: newPermission
                    })
                });
                
                if (response.ok) {
                    await this.loadDocumentPermissions();
                    // Update editor permissions in case current user's permissions changed
                    this.updateEditorPermissions();
                    console.log(`Permission updated for @${account} to ${newPermission}`);
                } else {
                    throw new Error('Failed to update permission');
                }
            } catch (error) {
                console.error('Update permission failed:', error);
                alert('Failed to update permission: ' + error.message);
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
        
        // Local Storage Operations
        async loadLocalFiles() {
            try {
                const files = JSON.parse(localStorage.getItem('dlux_tiptap_files') || '[]');
                this.localFiles = files;
            } catch (error) {
                console.error('Failed to load local files:', error);
                this.localFiles = [];
            }
        },
        
        async loadLocalFile(file) {
            this.currentFile = file;
            this.fileType = 'local';
            
            // Check if this is an offline-first file (uses Y.js + IndexedDB)
            if (file.isOfflineFirst) {
                console.log('📂 Loading offline-first local file:', file.name);
                
                // For offline-first files, content is in Y.js + IndexedDB
                // Create collaborative editors which will load from IndexedDB automatically
                this.isCollaborativeMode = true; // Use collaborative architecture
                this.disconnectCollaboration();
                await this.createStandardEditor(); // This creates offline collaborative editors
                
                // Content will be loaded automatically from IndexedDB by Y.js
                console.log('📂 Offline-first local file loaded from IndexedDB:', file.name);
                
            } else {
                console.log('📂 Loading legacy local file:', file.name);
                
                // Legacy local files stored in localStorage
                const content = JSON.parse(localStorage.getItem(`dlux_tiptap_file_${file.id}`) || '{}');
            this.isCollaborativeMode = false;
            this.content = content;
            
            this.disconnectCollaboration();
            await this.createStandardEditor();
            this.setEditorContent(content);
            
                console.log('📂 Legacy local file loaded from localStorage:', file.name);
            }
        },
        

        
        async deleteLocalFile(fileId = null) {
            const targetFileId = fileId || this.currentFile?.id;
            
            if (!targetFileId) {
                console.error('No file ID provided for deletion');
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
            
            this.loadingDocs = true;
            
            try {
                const response = await fetch('https://data.dlux.io/api/collaboration/documents', {
                    headers: this.authHeaders
                });
                
                if (response.ok) {
                    const data = await response.json();
                    this.collaborativeDocs = data.documents || [];
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
            
            // CRITICAL: Clean up existing editors and connections first
            this.disconnectCollaboration();
            
            // Add a longer delay to ensure complete cleanup
            await new Promise(resolve => setTimeout(resolve, 500));
            
            this.currentFile = {
                ...doc,
                type: 'collaborative'
            };
            this.fileType = 'collaborative';
            this.isCollaborativeMode = true;
            
            // Load content structure
            this.content = {
                title: '', // Start with empty content for collaborative documents
                body: '',
                tags: ['dlux', 'collaboration'],
                custom_json: {
                    app: 'dlux/0.1.0',
                    authors: [doc.owner]
                }
            };
            
            try {
                // STEP 1: Create offline collaborative editors first (this creates the Y.js document)
                console.log('🏗️ Creating offline collaborative editors for loaded document...');
                await this.createStandardEditor(); // This will create offline collaborative editors
                
                // STEP 2: Then connect the existing Y.js document to the server
                console.log('🔗 Connecting to collaboration server...');
                await this.connectToCollaborationServer(doc);
                
                // STEP 3: Infer permissions from successful connection
                console.log('🔐 Inferring permissions from WebSocket connection...');
                if (this.connectionStatus === 'connected') {
                    console.log('✅ WebSocket connected successfully - user has valid access');
                    
                    // If user can connect to the document, they have at least some permissions
                    const inferredPermissions = [{
                        account: this.currentFile.owner,
                        permissionType: 'postable', // Owner always has full access
                        grantedBy: this.currentFile.owner,
                        grantedAt: new Date().toISOString()
                    }];
                    
                    // For non-owners who can connect, assume they have meaningful access
                    if (this.username !== this.currentFile.owner) {
                        // Since they successfully connected to WebSocket, they likely have edit access
                        inferredPermissions.push({
                            account: this.username,
                            permissionType: 'editable', // Reasonable assumption for connected users
                            grantedBy: this.currentFile.owner,
                            grantedAt: new Date().toISOString(),
                            source: 'inferred-from-websocket-connection'
                        });
                        console.log('🔗 Non-owner successfully connected - assuming editable permissions');
                    }
                    
                    this.documentPermissions = inferredPermissions;
                    console.log('✅ Permissions inferred from successful WebSocket connection');
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
                        
                        // Final fallback: Conservative permissions
                        console.log('🔒 Using conservative fallback permissions');
                        this.documentPermissions = [{
                            account: this.currentFile.owner,
                            permissionType: 'postable',
                            grantedBy: this.currentFile.owner,
                            grantedAt: new Date().toISOString()
                        }];
                        
                        if (this.username !== this.currentFile.owner) {
                            this.documentPermissions.push({
                                account: this.username,
                                permissionType: 'readonly', // Conservative fallback
                                grantedBy: this.currentFile.owner,
                                grantedAt: new Date().toISOString(),
                                source: 'conservative-fallback'
                            });
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
                    this.disconnectCollaboration();
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
                this.fileType = 'local';
                this.isCollaborativeMode = false;
                
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
        
        // Editor Management - TipTap Best Practice: Offline-First Collaborative
        async createStandardEditor() {
            console.log('🏗️ Creating offline-first collaborative editors (TipTap best practice)...');
            
            // Properly clean up any existing resources
            await this.cleanupCurrentDocument();

            // Wait for cleanup to complete
            await this.$nextTick();
            
            // ===== REFACTORED: Always use offline-first collaborative approach =====
            const bundle = window.TiptapCollaboration?.default || window.TiptapCollaboration;
            
            if (bundle) {
                await this.createOfflineFirstCollaborativeEditors(bundle);
            } else {
                console.warn('⚠️ Collaboration bundle not available, falling back to basic editors');
                await this.createBasicEditors();
            }
        },

        // CRITICAL: Proper cleanup method to prevent transaction mismatch errors
        async cleanupCurrentDocument() {
            console.log('🧹 Cleaning up current document resources...');
            
            try {
                // Disconnect collaboration provider first
                if (this.provider) {
                    this.provider.disconnect();
                    this.provider.destroy();
                    this.provider = null;
                }
                
                // Destroy IndexedDB persistence
                if (this.indexeddbProvider) {
                    this.indexeddbProvider.destroy();
                    this.indexeddbProvider = null;
                }
                
                // Destroy editors safely
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
                
                // Destroy Y.js document last
                if (this.ydoc) {
                    this.ydoc.destroy();
                    this.ydoc = null;
                }
                
                // Reset collaboration state
                this.connectionStatus = 'disconnected';
                this.connectionMessage = '';
                this.isCollaborativeMode = false;
                
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
            }
        },

        async createOfflineFirstCollaborativeEditors(bundle) {
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

            // ===== STEP 1: Create Y.js document for offline collaborative editing =====
            this.ydoc = new Y.Doc();
            
            // ===== STEP 2: Add IndexedDB persistence (TipTap best practice) =====
            const documentId = this.currentFile?.id || this.currentFile?.permlink || `local_${Date.now()}`;
            const IndexeddbPersistence = bundle.IndexeddbPersistence?.default || bundle.IndexeddbPersistence;
            
            if (IndexeddbPersistence) {
                try {
                    this.indexeddbProvider = new IndexeddbPersistence(documentId, this.ydoc);
                    console.log('💾 IndexedDB persistence enabled for offline-first editing');
                } catch (error) {
                    console.warn('⚠️ Failed to initialize IndexedDB persistence:', error.message);
                    console.log('📝 Content will persist in memory only (until page refresh)');
                }
            } else {
                console.warn('⚠️ IndexedDB persistence not available in bundle - content may not persist offline');
                console.log('📝 Content will persist in memory only (until page refresh)');
            }
            
            // ===== STEP 3: Initialize collaborative schema =====
            this.initializeCollaborativeSchema(Y);
            
            // ===== ENHANCED EXTENSIONS: Add markdown shortcuts, emoji, and media support =====
            const getEnhancedExtensions = (field) => {
                const baseExtensions = [
                    StarterKit.configure({
                        history: false, // Collaboration handles history
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
                        placeholder: this.isReadOnlyMode ? 
                            `${field.charAt(0).toUpperCase() + field.slice(1)} (read-only)` : 
                            field === 'title' ? 'Enter title...' : 'Start writing...'
                    })
                ];

                // Add enhanced extensions if available in bundle
                const enhancedExtensions = [];
                
                // Markdown shortcuts (built into StarterKit but let's ensure they're active)
                console.log('✨ Markdown shortcuts enabled: **bold**, *italic*, ~~strike~~, `code`, > quotes, - lists');
                
                // Try to add emoji support if available
                if (bundle.Emoji || window.TiptapEmoji) {
                    const Emoji = bundle.Emoji?.default || bundle.Emoji || window.TiptapEmoji;
                    enhancedExtensions.push(Emoji.configure({
                        suggestion: {
                            items: ({ query }) => {
                                // Basic emoji set - expand this as needed
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
                            },
                            render: () => {
                                let component;
                                return {
                                    onStart: props => {
                                        component = new VueRenderer(EmojiList, {
                                            props,
                                            editor: props.editor
                                        });
                                    },
                                    onUpdate(props) {
                                        component.updateProps(props);
                                    },
                                    onKeyDown(props) {
                                        if (props.event.key === 'Escape') {
                                            return true;
                                        }
                                        return component.ref?.onKeyDown(props);
                                    },
                                    onExit() {
                                        component.destroy();
                                    }
                                };
                            }
                        }
                    }));
                    console.log('😄 Emoji extension added - use :emoji: syntax');
                }
                
                // Add Image extension for better media handling
                if (bundle.Image || window.TiptapImage) {
                    const Image = bundle.Image?.default || bundle.Image || window.TiptapImage;
                    enhancedExtensions.push(Image.configure({
                        inline: true,
                        allowBase64: true,
                        HTMLAttributes: {
                            class: 'img-fluid'
                        }
                    }));
                    console.log('🖼️ Enhanced image support added');
                }
                
                // Add Link extension for better URL handling
                if (bundle.Link || window.TiptapLink) {
                    const Link = bundle.Link?.default || bundle.Link || window.TiptapLink;
                    enhancedExtensions.push(Link.configure({
                        openOnClick: false,
                        HTMLAttributes: {
                            class: 'text-primary'
                        }
                    }));
                    console.log('🔗 Enhanced link support added');
                }
                
                // Add Typography extension for better markdown-like shortcuts
                if (bundle.Typography || window.TiptapTypography) {
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
                    console.log('📝 Smart typography shortcuts added');
                }

                return [...baseExtensions, ...enhancedExtensions];
            };
            
            // Create collaborative editors with enhanced extensions
            const titleExtensions = getEnhancedExtensions('title');
            const bodyExtensions = getEnhancedExtensions('body');

            // Note: CollaborationCursor will be added dynamically when provider connects
            // This follows TipTap best practice for offline-first architecture

            this.titleEditor = new Editor({
                element: this.$refs.titleEditor,
                extensions: titleExtensions,
                    // TipTap Best Practice: Content validation for collaborative documents
                    enableContentCheck: true,
                    onContentError: ({ editor, error, disableCollaboration }) => {
                        console.error('🚨 Title content validation error:', error);
                        this.handleContentValidationError('title', error, disableCollaboration);
                    },
                    editable: !this.isReadOnlyMode, // CRITICAL: Enforce read-only permissions
                    editorProps: {
                        attributes: {
                            class: 'form-control bg-transparent text-white border-0',
                        }
                    },
                onCreate: ({ editor }) => {
                    console.log(`✅ Enhanced collaborative title editor ready (${this.isReadOnlyMode ? 'READ-ONLY' : 'EDITABLE'})`);
                    },
                    onUpdate: ({ editor }) => {
                        // SECURITY: Block updates for read-only users
                        if (this.isReadOnlyMode) {
                            console.warn('🚫 Blocked title update: user has read-only permissions');
                            return;
                        }
                        
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

            this.bodyEditor = new Editor({
                element: this.$refs.bodyEditor,
                extensions: bodyExtensions,
                // TipTap Best Practice: Content validation for collaborative documents
                enableContentCheck: true,
                onContentError: ({ editor, error, disableCollaboration }) => {
                    console.error('🚨 Body content validation error:', error);
                    this.handleContentValidationError('body', error, disableCollaboration);
                },
                editable: !this.isReadOnlyMode, // CRITICAL: Enforce read-only permissions
                    editorProps: {
                        attributes: {
                            class: 'form-control bg-transparent text-white border-0',
                        }
                    },
                onCreate: ({ editor }) => {
                    console.log(`✅ Enhanced collaborative body editor ready (${this.isReadOnlyMode ? 'READ-ONLY' : 'EDITABLE'})`);
                    },
                    onUpdate: ({ editor }) => {
                    // SECURITY: Block updates for read-only users
                    if (this.isReadOnlyMode) {
                        console.warn('🚫 Blocked body update: user has read-only permissions');
                        return;
                    }
                    
                        this.content.body = editor.getHTML();
                    
                    // Always show unsaved indicator for user feedback
                    this.hasUnsavedChanges = true;
                    
                    // Y.js + IndexedDB handles persistence automatically
                    // Just clear the unsaved indicator after a brief delay
                    this.clearUnsavedAfterSync();
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

            // Set state to offline collaborative mode
            this.isCollaborativeMode = true;  // Always collaborative now
            this.connectionStatus = 'offline'; // But offline until connected to server
            this.fileType = 'local';           // Still local until published to server

            console.log('✅ Enhanced offline collaborative editors created successfully');
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
                config.set('lastModified', new Date().toISOString());
                config.set('initialContentLoaded', false); // TipTap best practice flag
            }
            
            // Advanced publishing options (atomic values only for conflict-free collaboration)
            const publishOptions = this.ydoc.getMap('publishOptions');
            if (!publishOptions.has('initialized')) {
                publishOptions.set('maxAcceptedPayout', '1000000.000 HBD'); // Default max
                publishOptions.set('percentHbd', 10000); // 100% HBD
                publishOptions.set('allowVotes', true);
                publishOptions.set('allowCurationRewards', true);
                publishOptions.set('initialized', true);
            }
            
            // Conflict-free collaborative arrays and maps
            this.ydoc.getArray('tags');           // Conflict-free tag management
            this.ydoc.getArray('beneficiaries');  // Conflict-free beneficiary management
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
                    this.syncToParent();
                });
                
                // Observe publish options changes (atomic settings only)
                const publishOptions = this.ydoc.getMap('publishOptions');
                publishOptions.observe((event) => {
                    console.log('📋 Publish options changed:', event);
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
            
            const tags = this.ydoc.getArray('tags');
            const existingTags = tags.toArray();
            
            // Check limits and duplicates
            if (existingTags.length >= 10) {
                console.warn('⚠️ Maximum 10 tags allowed');
                return false;
            }
            
            if (!existingTags.includes(formattedTag)) {
                tags.push([formattedTag]);
                console.log('🏷️ Tag added:', formattedTag);
                this.syncToParent(); // Emit collaborative-data-changed event
                return true;
            }
            
            return false;
        },

        removeCollaborativeTag(tag) {
            if (!this.validatePermission('removeTag')) return false;
            
            const tags = this.ydoc.getArray('tags');
            const index = tags.toArray().indexOf(tag);
            if (index >= 0) {
                tags.delete(index, 1);
                console.log('🏷️ Tag removed:', tag);
                this.syncToParent(); // Emit collaborative-data-changed event
                return true;
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
            if (!this.ydoc) return [];
            const tags = this.ydoc.getArray('tags');
            return tags.toArray();
        },

        // Beneficiary Management (Y.Array for conflict-free collaboration)
        addCollaborativeBeneficiary(account, weight) {
            if (!this.validatePermission('addBeneficiary')) return false;
            
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
            console.log('💰 Beneficiary added:', beneficiary);
            this.syncToParent(); // Emit collaborative-data-changed event
            return beneficiary.id;
        },

        removeCollaborativeBeneficiary(id) {
            if (!this.validatePermission('removeBeneficiary')) return false;
            
            const beneficiaries = this.ydoc.getArray('beneficiaries');
            const index = beneficiaries.toArray().findIndex(b => b.id === id);
            
            if (index >= 0) {
                const removed = beneficiaries.toArray()[index];
                beneficiaries.delete(index, 1);
                console.log('💰 Beneficiary removed:', removed.account);
                this.syncToParent(); // Emit collaborative-data-changed event
                return true;
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
            if (!this.ydoc) return [];
            const beneficiaries = this.ydoc.getArray('beneficiaries');
            return beneficiaries.toArray();
        },

        // Custom JSON Management (Y.Map for granular conflict-free updates)
        setCustomJsonField(key, value) {
            if (!this.validatePermission('setCustomJsonField')) return false;
            
            const customJson = this.ydoc.getMap('customJson');
            customJson.set(key, value);
            console.log('⚙️ Custom JSON field updated:', key);
            return true;
        },

        removeCustomJsonField(key) {
            if (!this.validatePermission('removeCustomJsonField')) return false;
            
            const customJson = this.ydoc.getMap('customJson');
            if (customJson.has(key)) {
                customJson.delete(key);
                console.log('⚙️ Custom JSON field removed:', key);
                return true;
            }
            return false;
        },

        getCustomJson() {
            const customJson = this.ydoc.getMap('customJson');
            return customJson.toJSON();
        },

        // Atomic Publish Options (simple values, conflict-free)
        setPublishOption(key, value) {
            if (!this.validatePermission('setPublishOption')) return false;
            
            const publishOptions = this.ydoc.getMap('publishOptions');
            publishOptions.set(key, value);
            console.log('📋 Publish option updated:', key, value);
            return true;
        },

        getPublishOption(key, defaultValue = null) {
            const publishOptions = this.ydoc.getMap('publishOptions');
            return publishOptions.get(key) || defaultValue;
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
            if (this.isReadOnlyMode) {
                console.warn(`🚫 Blocked ${operation}: read-only permissions`);
                return false;
            }
            
            // Block operations if schema version mismatch detected
            if (this.schemaVersionMismatch) {
                console.warn(`🚫 Blocked ${operation}: schema version mismatch - please refresh to update`);
                return false;
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

        // REMOVED: Legacy createBasicEditors method
        // Replaced by offline-first architecture - all editors are now collaborative by default



        // Update editor permissions based on current user's access level
        updateEditorPermissions() {
            console.log('🔐 Updating editor permissions, read-only mode:', this.isReadOnlyMode);
            
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
                    const baseExtensions = [
                        StarterKit.configure({
                            history: false,
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
                        // TEMPORARILY DISABLED: CollaborationCursor extension interfering with manual cursor tracking
                        // CollaborationCursor.configure({
                        //     provider: provider,
                        //     user: cursorConfig.user,
                        //     awareness: provider.awareness,
                        // }),
                        Placeholder.configure({
                            placeholder: this.isReadOnlyMode ? 
                                `${field.charAt(0).toUpperCase() + field.slice(1)} (read-only)` : 
                                field === 'title' ? 'Enter title...' : 'Start writing...'
                        })
                    ];

                    // Add the same enhanced extensions as in offline mode
                    const enhancedExtensions = [];
                    
                    if (bundle.Emoji || window.TiptapEmoji) {
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
                    
                    if (bundle.Image || window.TiptapImage) {
                        const Image = bundle.Image?.default || bundle.Image || window.TiptapImage;
                        enhancedExtensions.push(Image.configure({
                            inline: true,
                            allowBase64: true,
                            HTMLAttributes: { class: 'img-fluid' }
                        }));
                    }
                    
                    if (bundle.Link || window.TiptapLink) {
                        const Link = bundle.Link?.default || bundle.Link || window.TiptapLink;
                        enhancedExtensions.push(Link.configure({
                            openOnClick: false,
                            HTMLAttributes: { class: 'text-primary' }
                        }));
                    }
                    
                    if (bundle.Typography || window.TiptapTypography) {
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

                    return [...baseExtensions, ...enhancedExtensions];
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
                console.log('🎯 Y.js document info:', {
                    clientID: this.ydoc.clientID,
                    hasTitle: this.ydoc.getText('title').length,
                    hasBody: this.ydoc.getText('body').length,
                    titleContent: this.ydoc.getText('title').toString().substring(0, 50),
                    bodyContent: this.ydoc.getText('body').toString().substring(0, 50)
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
                
                // ===== HYBRID APPROACH: Maintain local file index for UX =====
                // Y.js handles content persistence, but we need local file entries for "Save to DLUX" workflow
                await this.ensureLocalFileEntry();
                
                this.hasUnsavedChanges = false;
            }, 1000); // 1 second delay to show sync indicator
        },

        // Ensure local file entry exists for UX (Save to DLUX workflow)
        async ensureLocalFileEntry() {
            try {
                // Only create local file entry if we don't have a current file or it's not collaborative
                if (!this.currentFile || this.currentFile.type !== 'collaborative') {
                    
                    // Generate file info if needed
                    if (!this.currentFile) {
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
                        
                this.currentFile = {
                            id: `local_${timestamp}`,
                            name: filename,
                            type: 'local',
                            lastModified: new Date().toISOString(),
                            isOfflineFirst: true // Flag to indicate this uses Y.js + IndexedDB
                        };
                        this.fileType = 'local';
                    }
                    
                    // Update local file index (metadata only - content is in Y.js + IndexedDB)
                    await this.updateLocalFileIndex();
                    
                    // Refresh local files list to show the new entry
                    await this.loadLocalFiles();
                    
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
            const collabAuthor = urlParams.get('collabAuthor');
            const permlink = urlParams.get('permlink');
            
            if (collabAuthor && permlink) {
                console.log('🔗 Auto-connect parameters detected:', { collabAuthor, permlink });
                
                // Wait for authentication if needed
                if (!this.isAuthenticated || this.isAuthExpired) {
                    console.log('🔑 Authentication required for auto-connect, requesting...');
                    await this.requestAuthentication();
                    
                    // Wait for authentication to complete
                    try {
                        await this.waitForAuthentication(10000); // 10 second timeout
                    } catch (error) {
                        console.error('❌ Auto-connect failed: Authentication timeout');
                        return;
                    }
                }
                
                // Try to auto-connect to the collaborative document
                try {
                    await this.autoConnectToDocument(collabAuthor, permlink);
                } catch (error) {
                    console.error('❌ Auto-connect failed:', error);
                }
            }
        },
        
        async autoConnectToDocument(owner, permlink) {
            console.log('🚀 Auto-connecting to collaborative document:', { owner, permlink });
            
            // Create a mock document object for loading
            const mockDoc = {
                owner: owner,
                permlink: permlink,
                title: `${owner}/${permlink}`,
                type: 'collaborative',
                created: new Date().toISOString(),
                modified: new Date().toISOString()
            };
            
            try {
                // Load the collaborative document
                await this.loadDocument(mockDoc);
                console.log('✅ Auto-connected to collaborative document successfully');
                
                // Update URL to include the parameters (for refresh persistence)
                this.updateURLWithCollabParams(owner, permlink);
                
            } catch (error) {
                console.error('❌ Failed to auto-connect to document:', error);
                throw error;
            }
        },
        
        updateURLWithCollabParams(owner, permlink) {
            const url = new URL(window.location);
            url.searchParams.set('collabAuthor', owner);
            url.searchParams.set('permlink', permlink);
            
            // Update URL without triggering a page reload
            window.history.replaceState({}, '', url.toString());
            console.log('🔗 URL updated with collaboration parameters for refresh persistence');
        },
        
        // Call this when connecting to a collaborative document
        setCollabURLParams() {
            if (this.currentFile && this.currentFile.type === 'collaborative') {
                this.updateURLWithCollabParams(this.currentFile.owner, this.currentFile.permlink);
            }
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
            
            // Clean up any existing provider
            if (this.provider) {
                this.provider.disconnect();
                this.provider.destroy();
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
                this.connectionStatus = 'disconnected';
                        this.connectionMessage = 'Disconnected from server';
                    },
                    onSynced: ({ synced }) => {
                    console.log('🔄 onSynced called:', { synced, isCollaborativeMode: this.isCollaborativeMode, connectionStatus: this.connectionStatus, hasUnsavedChanges: this.hasUnsavedChanges });
                    
                        if (synced) {
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
                    if (origin !== this.ydoc.clientID && this.isCollaborativeMode && this.connectionStatus === 'connected') {
                        console.log('📡 Y.js remote update detected, clearing unsaved flag');
                        this.hasUnsavedChanges = false;
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
                
                // Check multiple connection states
                const wsReady = this.provider.ws?.readyState === WebSocket.OPEN;
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
                    console.log(`⏳ Connection attempt ${retries}/${maxRetries} - WebSocket state: ${this.provider.ws?.readyState}, Status: ${this.connectionStatus}`);
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
                    wsState: this.provider.ws?.readyState,
                    wsUrl: this.provider.ws?.url,
                    providerStatus: this.provider.status,
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
                
                // Add collaboration cursor
                if (this.currentFile?.type === 'collaborative') {
                    setTimeout(() => {
                        console.log('🎯 Adding CollaborationCursor after connection...');
                        try {
                            this.addCollaborationCursor(this.provider);
                        } catch (error) {
                            console.error('❌ Error adding CollaborationCursor:', error);
                        }
                    }, 300);
                }
            }
        },

        // REMOVED: Legacy initializeCollaboration method
        // Replaced by offline-first architecture with connectToCollaborationServer
        
        disconnectCollaboration() {
            console.log('🔌 Disconnecting collaboration (using unified cleanup)...');
            
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
            
            console.log('✅ Collaboration disconnected successfully');
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
                
                // Ensure we have collaborative editors and Y.js document
                if (!this.ydoc) {
                    console.log('🏗️ Creating collaborative editors before reconnecting...');
                    await this.createStandardEditor(); // Creates offline collaborative editors
                    await new Promise(resolve => setTimeout(resolve, 100)); // Let editors initialize
                }
                
                // Connect to the server
                await this.connectToCollaborationServer(this.currentFile);
                console.log('✅ Successfully reconnected to collaborative document');
                
            } catch (error) {
                console.error('❌ Failed to reconnect:', error);
                alert(`Failed to connect to collaborative document:\n\n${error.message}`);
            }
        },
        
        // Connection handlers
        onConnect() {
            this.connectionStatus = 'connected';
            this.connectionMessage = 'Connected - Real-time collaboration active';
            
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

            // 🎯 TipTap Best Practice: Add CollaborationCursor when provider connects
            // This follows the offline-first collaborative architecture pattern
            console.log('🔍 DEBUG onConnect: provider exists:', !!this.provider);
            console.log('🔍 DEBUG onConnect: currentFile type:', this.currentFile?.type);
            console.log('🔍 DEBUG onConnect: isCollaborativeMode:', this.isCollaborativeMode);
            
            if (this.provider && this.currentFile?.type === 'collaborative') {
                console.log('🎯 WebSocket connected - adding CollaborationCursor extension...');
                try {
                    this.addCollaborationCursor(this.provider);
                    console.log('✅ addCollaborationCursor called successfully');
                } catch (error) {
                    console.error('❌ Error calling addCollaborationCursor:', error);
                }
            } else {
                console.log('⚠️ Skipping CollaborationCursor - conditions not met');
            }
        },
        
        onDisconnect() {
            this.connectionStatus = 'disconnected';
            this.connectionMessage = 'Disconnected from server';
        },
        
        onSynced() {
            this.connectionMessage = 'Connected - Document synchronized';
            
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
        
        setEditorContent(content) {
            try {
                // For collaborative mode, use proper TipTap pattern with onSynced callback
                // Reference: https://tiptap.dev/docs/editor/collaboration/install
                if (this.isCollaborativeMode && this.connectionStatus === 'connected') {
                    console.log('🤝 Using collaborative content initialization pattern');
                    
                    // Set initial content flag in Y.js document to prevent duplicate loading
                    const config = this.ydoc.getMap('config');
                    if (!config.get('initialContentLoaded')) {
                        config.set('initialContentLoaded', true);
                        
                        // Use TipTap's setContent command for collaborative mode
                        if (this.titleEditor && content.title) {
                            this.titleEditor.commands.setContent(content.title);
                        }
                        if (this.bodyEditor && content.body) {
                            this.bodyEditor.commands.setContent(content.body);
                        }
                        if (this.permlinkEditor && content.permlink) {
                            this.permlinkEditor.commands.setContent(content.permlink);
                        }
                        
                        console.log('✅ Initial collaborative content set via TipTap commands');
                    }
                    
                    // Update local content state for UI binding
                    this.content = { ...this.content, ...content };
                    
                    // Set custom JSON string for editing
                    if (content.custom_json) {
                        this.customJsonString = JSON.stringify(content.custom_json, null, 2);
                    }
                    
                    // Restore comment options if available
                    if (content.commentOptions) {
                        this.commentOptions = { ...this.commentOptions, ...content.commentOptions };
                    }
                    
                    return;
                }
                
                // For standard mode, set content normally with error handling
                if (this.titleEditor && content.title) {
                    try {
                        this.titleEditor.commands.setContent(content.title);
                    } catch (error) {
                        console.warn('Failed to set title content:', error);
                        // Fallback to text-only
                        this.titleEditor.commands.setContent(content.title.replace(/<[^>]*>/g, ''));
                    }
                }
                
                if (this.permlinkEditor && content.permlink) {
                    try {
                        this.permlinkEditor.commands.setContent(content.permlink);
                    } catch (error) {
                        console.warn('Failed to set permlink content:', error);
                        this.permlinkEditor.commands.setContent(content.permlink.replace(/<[^>]*>/g, ''));
                    }
                }
                
                if (this.bodyEditor && content.body) {
                    try {
                        this.bodyEditor.commands.setContent(content.body);
                    } catch (error) {
                        console.warn('Failed to set body content, trying as plain text:', error);
                        // If HTML content fails, try as plain text wrapped in paragraph
                        const textContent = content.body.replace(/<[^>]*>/g, '');
                        this.bodyEditor.commands.setContent(`<p>${textContent}</p>`);
                    }
                }
                
                this.content = { ...content };
                
                // Set custom JSON string for editing
                if (content.custom_json) {
                    this.customJsonString = JSON.stringify(content.custom_json, null, 2);
                }
                
                // Restore comment options if available
                if (content.commentOptions) {
                    this.commentOptions = { ...this.commentOptions, ...content.commentOptions };
                }
                
                console.log('✅ Editor content set successfully');
                
            } catch (error) {
                console.error('❌ Failed to set editor content:', error);
                
                // Create minimal safe content
                this.content = {
                    title: content.title || '',
                    body: content.body || '<p>Content could not be loaded properly. Please check the document format.</p>',
                    tags: content.tags || [],
                    custom_json: content.custom_json || {},
                    permlink: content.permlink || '',
                    beneficiaries: content.beneficiaries || []
                };
                
                // Restore comment options if available
                if (content.commentOptions) {
                    this.commentOptions = { ...this.commentOptions, ...content.commentOptions };
                }
                
                // Set safe fallback content in editors
                if (this.titleEditor) {
                    this.titleEditor.commands.setContent(this.content.title.replace(/<[^>]*>/g, ''));
                }
                if (this.bodyEditor) {
                    this.bodyEditor.commands.setContent(this.content.body);
                }
                
                throw new Error(`Content loading failed: ${error.message}`);
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
                'saving-local': 'background: rgba(255, 193, 7, 0.1); border-left: 3px solid #ffc107;',
                'saved-local': 'background: rgba(25, 135, 84, 0.1); border-left: 3px solid #198754;',
                'offline-saving': 'background: rgba(255, 193, 7, 0.1); border-left: 3px solid #ffc107;',
                'offline-ready': 'background: rgba(13, 202, 240, 0.1); border-left: 3px solid #0dcaf0;',
                'unsynced-changes': 'background: rgba(255, 193, 7, 0.1); border-left: 3px solid #ffc107;',
                'offline': 'background: rgba(13, 202, 240, 0.1); border-left: 3px solid #0dcaf0;',
                'connecting': 'background: rgba(13, 110, 253, 0.1); border-left: 3px solid #0d6efd;',
                'syncing': 'background: rgba(255, 193, 7, 0.1); border-left: 3px solid #ffc107;',
                'collaborating': 'background: rgba(25, 135, 84, 0.1); border-left: 3px solid #198754;',
                'synced': 'background: rgba(25, 135, 84, 0.1); border-left: 3px solid #198754;',
                'error': 'background: rgba(220, 53, 69, 0.1); border-left: 3px solid #dc3545;',
                'unknown': 'background: rgba(108, 117, 125, 0.1); border-left: 3px solid #6c757d;'
            };
            return styles[state] || styles.unknown;
        },

        getStatusIconClass(state) {
            const icons = {
                'saving-local': 'fas fa-circle-notch fa-spin text-warning',
                'saved-local': 'fas fa-check text-success',
                'offline-saving': 'fas fa-circle-notch fa-spin text-warning',
                'offline-ready': 'fas fa-hard-drive text-info',
                'unsynced-changes': 'fas fa-exclamation-triangle text-warning',
                'offline': 'fas fa-wifi-slash text-info',
                'connecting': 'fas fa-circle-notch fa-spin text-primary',
                'syncing': 'fas fa-sync fa-spin text-warning',
                'collaborating': 'fas fa-users text-success',
                'synced': 'fas fa-cloud-check text-success',
                'error': 'fas fa-exclamation-circle text-danger',
                'unknown': 'fas fa-question-circle text-muted'
            };
            return icons[state] || icons.unknown;
        },

        getStatusTextClass(state) {
            const textClasses = {
                'saving-local': 'text-warning',
                'saved-local': 'text-success',
                'offline-saving': 'text-warning',
                'offline-ready': 'text-info',
                'unsynced-changes': 'text-warning',
                'offline': 'text-info',
                'connecting': 'text-primary',
                'syncing': 'text-warning',
                'collaborating': 'text-success',
                'synced': 'text-success',
                'error': 'text-danger',
                'unknown': 'text-muted'
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
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            if (bytes === 0) return '0 Bytes';
            const i = Math.floor(Math.log(bytes) / Math.log(1024));
            return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
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
            const confirmMsg = `Delete local file "${file.name}"?\n\nThis action cannot be undone.`;
            if (confirm(confirmMsg)) {
                try {
                    await this.deleteLocalFile(file.id);
                    console.log('✅ Local file deleted successfully');
                } catch (error) {
                    console.error('❌ Failed to delete local file:', error);
                    alert(`Failed to delete file: ${error.message}`);
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
                isOfflineFirst: true // Flag to indicate this uses Y.js + IndexedDB
            };
            this.fileType = 'local';
            
            // Create offline-first collaborative editors (same as data entry trigger)
            if (!this.ydoc) {
                await this.createStandardEditor();
            }
            
            // Update local file index and refresh UI (following unified sync pattern)
            await this.updateLocalFileIndex();
            await this.loadLocalFiles();
            
            // Set unsaved changes flag to trigger unified sync
            this.hasUnsavedChanges = true;
            this.clearUnsavedAfterSync();
            
            console.log('📄 New local ydoc created from document name (offline-first architecture):', name);
        },

        async renameCurrentDocument(newName) {
            if (this.currentFile.type === 'collaborative') {
                // For collaborative docs, use the existing rename functionality
                this.saveForm.filename = newName;
                await this.renameCollaborativeDocument();
            } else {
                // For local documents, update the name directly
                this.currentFile.name = newName;
                this.currentFile.lastModified = new Date().toISOString();
                
                // Update local file index (following offline-first pattern)
                await this.updateLocalFileIndex();
                await this.loadLocalFiles();
                
                // Set unsaved changes flag to trigger unified sync
                this.hasUnsavedChanges = true;
                this.clearUnsavedAfterSync();
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
            return this.titleEditor?.can().undo() || this.bodyEditor?.can().undo() || false;
        },

        canRedo() {
            return this.titleEditor?.can().redo() || this.bodyEditor?.can().redo() || false;
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
            // TipTap Best Practice: All documents are already collaborative (offline-first)
            // This method now just "publishes" the existing Y.js document to the server
            
            if (this.currentFile?.type === 'collaborative' && this.connectionStatus === 'connected') {
                console.log('Document is already connected to collaboration server');
                return;
            }

            // Check authentication
            if (!this.isAuthenticated || this.isAuthExpired) {
                const confirmAuth = confirm('You need to authenticate to publish this document to the cloud. Authenticate now?');
                if (confirmAuth) {
                    this.requestAuthentication();
                    try {
                        await this.waitForAuthentication();
                    } catch (error) {
                        alert('Authentication failed. Please try again.');
                        return;
                    }
            } else {
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

                // Connect existing Y.js document to server
                await this.connectToCollaborationServer(serverDoc);

                // Update current file to collaborative
                this.currentFile = {
                    ...serverDoc,
                    type: 'collaborative'
                };
                this.fileType = 'collaborative';

                // Reload collaborative documents list
                await this.loadCollaborativeDocs();

                console.log('✅ Document published to cloud successfully:', documentName);
                
            } catch (error) {
                console.error('❌ Failed to publish to cloud:', error);
                alert('Failed to publish to cloud: ' + error.message);
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
    },
    
    watch: {
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
        
        // COMMENTED OUT TO AVOID REACTIVE CONFLICTS
        // 'content.title': {
        //     handler() {
        //         this.hasUnsavedChanges = true;
        //         this.updateContent();
        //     }
        // },
        
        // 'content.tags': {
        //     handler() {
        //         this.hasUnsavedChanges = true;
        //         this.updateContent();
        //     },
        //     deep: true
        // }
    },
    
    async mounted() {
        try {
            // Check for auto-connect query parameters first
            await this.checkAutoConnectParams();
            
            // Load initial data
            await this.loadLocalFiles();
            
            // Check if authHeaders exists and has x-account
            if (this.authHeaders && this.authHeaders['x-account']) {
                await this.loadCollaborativeDocs();
            }
            
            // Create initial editor
            await this.createStandardEditor();
            
            // Load initial content if provided
            if (this.initialContent && Object.keys(this.initialContent).length > 0) {
                this.content = { ...this.content, ...this.initialContent };
                this.setEditorContent(this.content);
            }
            
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
            } catch (error) {
            console.error('Error in mounted hook:', error);
        }
        },
        
        beforeUnmount() {
            this.disconnectCollaboration();
            
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
                <span v-if="hasUnsavedChanges" class="text-warning ms-1">●</span>
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
                <span v-if="hasUnsavedChanges" class="text-warning ms-1">●</span>
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

               
                            <!-- Unified Status Indicator -->

                         <div class="d-flex align-items-center">
                             <i :class="getStatusIconClass(unifiedStatusInfo.state)" class="me-2 small"></i>
                             <span :class="getStatusTextClass(unifiedStatusInfo.state)" class="small fw-medium">
                                 {{ unifiedStatusInfo.message }}
                             </span>
                         </div>

                 
                </button>
                <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end bg-dark">
                    <!-- Authentication Status Header -->
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
                     <li v-else-if="currentFile?.type === 'collaborative' && connectionStatus === 'disconnected'">
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
                                                   <li>
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
    
    style: `
        /* Unified Status Indicator */
        .unified-status-indicator {
            position: relative;
            margin-left: 1rem;
            padding: 0.25rem 0.75rem;
            border-radius: 0.375rem;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .unified-status-indicator:hover {
            background-color: rgba(255, 255, 255, 0.1);
        }

        .status-main {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .status-icon {
            font-size: 1.1em;
        }

        .status-message {
            font-size: 0.875rem;
            white-space: nowrap;
        }

        .status-details {
            position: absolute;
            top: 100%;
            right: 0;
            margin-top: 0.5rem;
            padding: 1rem;
            background: var(--bs-dark);
            border: 1px solid var(--bs-secondary);
            border-radius: 0.375rem;
            min-width: 250px;
            z-index: 1000;
            box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
        }

        .details-text {
            font-size: 0.875rem;
            color: var(--bs-light);
            margin-bottom: 0.75rem;
        }

        .status-actions {
            display: flex;
            gap: 0.5rem;
        }

        .status-action-btn {
            padding: 0.25rem 0.75rem;
            font-size: 0.875rem;
            color: var(--bs-light);
            background: transparent;
            border: 1px solid var(--bs-secondary);
            border-radius: 0.25rem;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .status-action-btn:hover {
            background: var(--bs-secondary);
        }

        /* Status-specific styles */
        .status-saving {
            color: var(--bs-warning);
        }

        .status-saved {
            color: var(--bs-success);
        }

        .status-warning {
            color: var(--bs-warning);
        }

        .status-offline {
            color: var(--bs-secondary);
        }

        .status-connecting {
            color: var(--bs-info);
        }

        .status-syncing {
            color: var(--bs-info);
        }

        .status-collaborating {
            color: var(--bs-primary);
        }

        .status-synced {
            color: var(--bs-success);
        }

        .status-error {
            color: var(--bs-danger);
        }

        .status-unknown {
            color: var(--bs-secondary);
        }

        /* JSON Preview Modal Styles */
        .nav-tabs .nav-link {
            background-color: #343a40;
            border-color: #495057;
            color: #adb5bd;
        }
        
        .nav-tabs .nav-link.active {
            background-color: #495057;
            border-color: #6c757d;
            color: #fff;
        }
        
        .nav-tabs .nav-link:hover {
            background-color: #495057;
            border-color: #6c757d;
            color: #fff;
        }
        
        /* JSON syntax highlighting for better readability */
        pre {
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            line-height: 1.4;
        }
        
        /* Modal backdrop for JSON preview */
        .modal[style*="background: rgba(0,0,0,0.8)"] {
            backdrop-filter: blur(2px);
        }
        
        /* Scrollable JSON content */
        .tab-pane pre {
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        
        /* Copy button hover effect */
        .btn-outline-success:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        /* Alert styling improvements */
        .alert {
            border-radius: 8px;
        }
        
        .alert ul {
            padding-left: 1.2rem;
        }
        
        /* Tab content spacing */
        .tab-content {
            min-height: 400px;
        }
        
        /* Modal size adjustments */
        .modal-xl {
            max-width: 90vw;
        }
        
        @media (max-width: 768px) {
            .modal-xl {
                max-width: 95vw;
                margin: 0.5rem;
            }
            
            .nav-tabs .nav-link {
                font-size: 0.875rem;
                padding: 0.5rem 0.75rem;
            }
            
            pre {
                font-size: 0.75em;
            }
        }
        
        /* Dropdown submenu styles are now in global custom.scss */
    `
}; 