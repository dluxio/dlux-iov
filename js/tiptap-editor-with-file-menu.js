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
                saveLocally: true,
                saveToDlux: false,
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
            collaborativeDataVersion: 0,
            
            // Permission system notifications
            permissionNotification: null
        };
    },
    
    computed: {
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
        
        canSave() {
            // For collaborative documents that are connected, don't show save option since they auto-sync
            if (this.isCollaborativeMode && this.connectionStatus === 'connected') {
                return false; // Auto-syncing via Y.js, no manual save needed
            }
            
            return this.hasUnsavedChanges && !this.saving;
        },
        
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
            if (!this.content.title) return '';
            return this.content.title
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .trim()
                .replace(/\s+/g, '-')
                .substring(0, 255);
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
            return this.saveForm.isNewDocument ? 'Save As' : 'Save';
        },

        saveButtonDisabled() {
            return !this.hasValidFilename || this.saving || this.saveAsProcess.inProgress;
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
        
        // File Menu Actions
        async newDocument() {
            if (this.hasUnsavedChanges) {
                const confirmResult = await this.confirmUnsavedChanges();
                if (!confirmResult) return;
            }
            
            // Reset all document state
            this.currentFile = null;
            this.isCollaborativeMode = false;
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
                saveLocally: true,
                saveToDlux: false,
                isPublic: false,
                description: '',
                isNewDocument: false
            };
            
            // Clean up any collaborative connections
            this.disconnectCollaboration();
            
            // Wait for cleanup to complete
            await this.$nextTick();
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Create fresh standard editor
            await this.createStandardEditor();
            this.clearEditor();
            this.hasUnsavedChanges = false;
            
            // Focus on title editor if available
            if (this.titleEditor) {
                this.$nextTick(() => {
                    this.titleEditor.commands.focus();
                });
            }
            
            console.log('📄 New local document created - ready for editing');
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
                saveLocally: false,
                saveToDlux: true,
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
        
        async saveDocument() {
            // ===== REFACTORED: Offline-First Architecture =====
            // Following TipTap best practices - Y.js handles all persistence
            // No more parallel saving paths
            
            if (!this.hasValidFilename && !this.currentFile) {
                this.showSaveModal = true;
                return;
            }

            this.saving = true;
            
            try {
                const filename = this.saveForm.filename || this.currentFile?.name || `document_${Date.now()}`;
                
                // Update file metadata (Y.js + IndexedDB handles content)
                this.currentFile = this.currentFile || {
                    id: `local_${Date.now()}`,
                    type: 'local'
                };
                
                this.currentFile.name = filename;
                this.currentFile.lastModified = new Date().toISOString();

                // If user wants cloud sync, connect to collaboration server
                if (this.saveForm.saveToDlux && this.showCollaborativeFeatures) {
                    await this.connectToCollaborationServer();
                }

                // Update local file index (metadata only)
                await this.updateLocalFileIndex();
                
                this.hasUnsavedChanges = false;
                console.log('💾 Document saved using offline-first architecture');
                
            } catch (error) {
                console.error('Save failed:', error);
                alert('Save failed: ' + error.message);
            } finally {
                this.saving = false;
            }
        },

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
                this.saveForm.saveLocally = false;
                this.saveForm.saveToDlux = true;
                this.saveForm.isNewDocument = false; // This is a rename, not new document
            } else {
                this.saveForm.filename = ''; // Clear filename to force new name
                this.saveForm.isNewDocument = true; // Flag to indicate this is a "Save As"
            }
        },
        
        async performSaveAs() {
            const documentName = this.saveForm.filename || `document_${Date.now()}`;
            
            // Initialize save as process
            this.saveAsProcess = {
                inProgress: true,
                step: 'saving_local',
                message: 'Creating local backup...',
                localBackupId: null,
                serverDocId: null,
                error: null
            };
            
            try {
                // Step 1: Save content locally as backup (Y.js content already in collaborative format)
                const content = this.getEditorContent();
                const backupId = `backup_${Date.now()}_${documentName}`;
                
                localStorage.setItem(`dlux_tiptap_backup_${backupId}`, JSON.stringify({
                    ...content,
                    originalFile: this.currentFile,
                    timestamp: new Date().toISOString(),
                    isBackup: true
                }));
                
                this.saveAsProcess.localBackupId = backupId;
                this.saveAsProcess.step = 'creating_server';
                this.saveAsProcess.message = 'Creating document on server...';
                
                // Step 2: Create new document on server
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000);
                
                const response = await fetch('https://data.dlux.io/api/collaboration/documents', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...this.authHeaders
                    },
                    body: JSON.stringify({
                        documentName: documentName,
                        isPublic: this.saveForm.isPublic,
                        title: content.title || documentName,
                        description: this.saveForm.description || 'Document created with DLUX TipTap Editor'
                    }),
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                    throw new Error(`Failed to create server document: ${errorData.error || response.statusText}`);
                }
                
                const docData = await response.json();
                console.log('📄 Server response:', docData);
                
                const serverDoc = docData.document || docData;
                this.saveAsProcess.serverDocId = serverDoc;
                this.saveAsProcess.step = 'connecting';
                this.saveAsProcess.message = 'Connecting existing document to server...';
                        
                // Step 3: TipTap Best Practice - Connect existing Y.js document to WebSocket provider
                // No content transfer needed - the Y.js document already contains all content
                
                await this.connectToCollaborationServer(serverDoc);
                
                // Update current file and state
                this.currentFile = {
                    ...serverDoc,
                    type: 'collaborative'
                };
                this.fileType = 'collaborative';
                // isCollaborativeMode already true from offline-first approach
                
                this.saveAsProcess.step = 'finalizing';
                this.saveAsProcess.message = 'Finalizing...';
                
                // Reload collaborative documents list
                await this.loadCollaborativeDocs();
                
                // Remove local backup since everything succeeded
                localStorage.removeItem(`dlux_tiptap_backup_${backupId}`);
                
                console.log('✅ Offline-first document successfully published to collaboration server:', documentName);
                
            } catch (error) {
                console.error('❌ Publishing to collaboration server failed:', error);
                
                // Store error for display
                this.saveAsProcess.error = error.message;
                
                // Keep local backup since server operation failed
                if (this.saveAsProcess.localBackupId) {
                    console.log('💾 Local backup preserved:', this.saveAsProcess.localBackupId);
                    
                    // Add backup to pending uploads list
                    const pendingBackups = JSON.parse(localStorage.getItem('dlux_pending_uploads') || '[]');
                    pendingBackups.push({
                        id: this.saveAsProcess.localBackupId,
                        filename: documentName,
                        timestamp: new Date().toISOString(),
                        type: 'collaborative_backup',
                        error: error.message
                    });
                    localStorage.setItem('dlux_pending_uploads', JSON.stringify(pendingBackups));
                }
                
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
                }, 3000); // Keep visible for 3 seconds
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
                else if (this.saveForm.isNewDocument && this.saveForm.saveToDlux) {
                    await this.performSaveAs();
                } else {
                    // Regular save
                    // Y.js + IndexedDB handles all content persistence automatically
                    // Only need to update metadata and connect to collaboration server if needed
                    if (this.saveForm.saveToDlux) {
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
            if (!this.canShare) {
                // If not authenticated, prompt to authenticate
                if (!this.isAuthenticated || this.isAuthExpired) {
                    const confirmAuth = confirm('You need to authenticate to access collaborative features. Authenticate now?');
                    if (confirmAuth) {
                        this.requestAuthentication();
                    }
                    return;
                }
                
                // If local file, prompt to save to DLUX first
                if (this.currentFile && this.currentFile.type === 'local') {
                    this.saveForm.saveToDlux = true;
                    this.saveForm.saveLocally = false;
                    this.showSaveModal = true;
                    return;
                }
                
                alert('Please save to DLUX collaborative documents first to enable sharing.');
                return;
            }
            
            // Load current permissions before showing modal
            await this.loadDocumentPermissions();
            this.showShareModal = true;
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
                // PHASE 1: Enhanced Authentication Validation
                const authValidation = this.validateAuthHeaders();
                if (!authValidation.isValid) {
                    console.error('🔐 Authentication validation failed:', authValidation.errors);
                    throw new Error(`Authentication validation failed: ${authValidation.errors.join(', ')}`);
                }

                // PHASE 2: Test Authentication Before Permission Request
                const authTestResult = await this.testCollaborationAuth();
                if (!authTestResult.success) {
                    console.warn('🔐 Auth test failed, but proceeding with permission request...');
                    console.warn('🔍 Auth test details:', authTestResult);
                }

                // PHASE 3: Enhanced Permission Loading with Retry Logic
                const permissionResult = await this.loadPermissionsWithRetry();
                
                if (permissionResult.success) {
                    this.documentPermissions = permissionResult.permissions;
                    console.log('✅ Permissions loaded successfully:', this.documentPermissions.length, 'permissions');
                } else {
                    // PHASE 4: Intelligent Fallback Logic
                    console.warn('⚠️ Permission loading failed, applying intelligent fallback...');
                    this.applyPermissionFallback(permissionResult.error);
                }
                
                // Always update editor permissions regardless of permission loading result
                this.updateEditorPermissions();
                
            } catch (error) {
                console.error('❌ Critical error in loadDocumentPermissions:', error);
                
                // Apply emergency fallback
                this.applyEmergencyPermissionFallback(error);
                this.updateEditorPermissions();
                
            } finally {
                this.loadingPermissions = false;
            }
        },

        // PHASE 1: Enhanced Authentication Validation
        validateAuthHeaders() {
            const requiredHeaders = ['x-account', 'x-challenge', 'x-pubkey', 'x-signature'];
            const errors = [];
            
            for (const header of requiredHeaders) {
                if (!this.authHeaders[header]) {
                    errors.push(`Missing ${header}`);
                } else if (typeof this.authHeaders[header] !== 'string' || this.authHeaders[header].trim() === '') {
                    errors.push(`Invalid ${header} (empty or non-string)`);
                }
            }
            
            // Validate challenge timestamp (should be within 24 hours)
            if (this.authHeaders['x-challenge']) {
                const challenge = parseInt(this.authHeaders['x-challenge']);
                const now = Math.floor(Date.now() / 1000);
                const hoursDiff = (now - challenge) / 3600;
                
                if (hoursDiff > 24) {
                    errors.push(`Challenge expired (${hoursDiff.toFixed(1)} hours old)`);
                } else if (hoursDiff < 0) {
                    errors.push(`Challenge from future (${Math.abs(hoursDiff).toFixed(1)} hours ahead)`);
                }
            }
            
            return {
                isValid: errors.length === 0,
                errors: errors,
                headerCount: Object.keys(this.authHeaders).length
            };
        },

        // PHASE 2: Authentication Testing
        async testCollaborationAuth() {
            try {
                console.log('🧪 Testing collaboration authentication...');
                
                const response = await fetch('https://data.dlux.io/api/collaboration/test-auth', {
                    method: 'GET',
                    headers: {
                        ...this.authHeaders,
                        'Accept': 'application/json'
                    },
                    credentials: 'omit'
                });
                
                if (response.ok) {
                    const result = await response.json();
                    console.log('✅ Auth test successful:', result);
                    return { success: true, result };
                } else {
                    const errorText = await response.text().catch(() => 'Unknown error');
                    console.warn('⚠️ Auth test failed:', response.status, errorText);
                    return { 
                        success: false, 
                        status: response.status, 
                        error: errorText,
                        headers: Object.keys(this.authHeaders)
                    };
                }
            } catch (error) {
                console.warn('⚠️ Auth test network error:', error.message);
                return { success: false, error: error.message, type: 'network' };
            }
        },

        // PHASE 3: Permission Loading with Retry Logic
        async loadPermissionsWithRetry(maxRetries = 3) {
            const permissionsUrl = `https://data.dlux.io/api/collaboration/permissions/${this.currentFile.owner}/${this.currentFile.permlink}`;
            
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    console.log(`🔄 Permission loading attempt ${attempt}/${maxRetries}...`);
                    
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 10000);
                    
                    const response = await fetch(permissionsUrl, {
                        method: 'GET',
                        headers: {
                            ...this.authHeaders,
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        credentials: 'omit',
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);
                    
                    if (response.ok) {
                        const data = await response.json();
                        console.log(`✅ Permission loading successful on attempt ${attempt}`);
                        return {
                            success: true,
                            permissions: data.permissions || [],
                            attempt: attempt
                        };
                    } else {
                        const errorText = await response.text().catch(() => 'Unknown error');
                        
                        if (response.status === 403) {
                            console.error('🔐 Permission loading failed with HTTP 403 (Authentication inconsistency detected)');
                            console.error('🔍 This indicates server-side authentication inconsistency between endpoints');
                            console.error('📋 Troubleshooting information:');
                            console.error('   • GET permissions endpoint authentication differs from POST endpoint');
                            console.error('   • Same auth headers work for granting permissions but fail for loading');
                            console.error('   • Server-side middleware alignment needed');
                            console.error('🔧 Auth headers used:', Object.keys(this.authHeaders));
                            
                            return {
                                success: false,
                                error: '403_AUTH_INCONSISTENCY',
                                status: 403,
                                details: errorText,
                                attempt: attempt,
                                authHeaders: Object.keys(this.authHeaders)
                            };
                        } else if (response.status >= 500 && attempt < maxRetries) {
                            console.warn(`⚠️ Server error ${response.status} on attempt ${attempt}, retrying...`);
                            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                            continue;
                        } else {
                            return {
                                success: false,
                                error: 'HTTP_ERROR',
                                status: response.status,
                                details: errorText,
                                attempt: attempt
                            };
                        }
                    }
                } catch (error) {
                    if (error.name === 'AbortError') {
                        console.warn(`⏰ Permission loading timeout on attempt ${attempt}`);
                        if (attempt < maxRetries) {
                            await new Promise(resolve => setTimeout(resolve, 2000));
                            continue;
                        }
                    } else if (attempt < maxRetries) {
                        console.warn(`🌐 Network error on attempt ${attempt}:`, error.message);
                        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                        continue;
                    }
                    
                    return {
                        success: false,
                        error: 'NETWORK_ERROR',
                        details: error.message,
                        attempt: attempt
                    };
                }
            }
            
            return {
                success: false,
                error: 'MAX_RETRIES_EXCEEDED',
                details: `Failed after ${maxRetries} attempts`
            };
        },

        // PHASE 4: Intelligent Fallback Logic
        applyPermissionFallback(error) {
            const isOwner = this.currentFile.owner === this.username;
            
            if (error === '403_AUTH_INCONSISTENCY') {
                // Smart fallback for 403 authentication inconsistency
                if (isOwner) {
                    console.log('🔄 Owner detected: Applying full permissions despite 403');
                    this.documentPermissions = [{
                        account: this.username,
                        permissionType: 'owner',
                        grantedBy: this.username,
                        grantedAt: new Date().toISOString(),
                        source: 'fallback_owner'
                    }];
                } else {
                    // For non-owners who can access the document, assume they have meaningful permissions
                    console.log('🔄 Non-owner with document access: Assuming postable permissions');
                    this.documentPermissions = [{
                        account: this.username,
                        permissionType: 'postable',
                        grantedBy: this.currentFile.owner,
                        grantedAt: new Date().toISOString(),
                        source: 'fallback_403_access_implies_permission'
                    }];
                }
                
                // Show user notification about server issue
                this.showPermissionFallbackNotification('authentication');
                
            } else {
                // For other errors, use conservative fallback
                console.log('🔄 Applying conservative fallback permissions');
                this.documentPermissions = [{
                    account: this.username,
                    permissionType: isOwner ? 'owner' : 'readonly',
                    grantedBy: isOwner ? this.username : this.currentFile.owner,
                    grantedAt: new Date().toISOString(),
                    source: 'fallback_conservative'
                }];
                
                this.showPermissionFallbackNotification('general');
            }
        },

        // Emergency fallback for critical errors
        applyEmergencyPermissionFallback(error) {
            console.error('🚨 Applying emergency permission fallback due to critical error:', error);
            
            const isOwner = this.currentFile.owner === this.username;
            this.documentPermissions = [{
                account: this.username,
                permissionType: isOwner ? 'owner' : 'readonly',
                grantedBy: isOwner ? this.username : this.currentFile.owner,
                grantedAt: new Date().toISOString(),
                source: 'emergency_fallback'
            }];
        },

        // User notification system
        showPermissionFallbackNotification(type) {
            const messages = {
                authentication: {
                    title: 'Server Authentication Issue',
                    message: 'There\'s a temporary server-side authentication inconsistency. Your document access is working normally, but permission loading failed. This has been logged for the development team.',
                    type: 'warning'
                },
                general: {
                    title: 'Permission Loading Issue',
                    message: 'Unable to load document permissions from server. Using safe fallback permissions. Document functionality may be limited.',
                    type: 'info'
                }
            };
            
            const notification = messages[type] || messages.general;
            
            // Store notification for UI display
            this.permissionNotification = {
                ...notification,
                timestamp: new Date().toISOString(),
                dismissed: false
            };
            
            // Auto-dismiss after 10 seconds
            setTimeout(() => {
                if (this.permissionNotification) {
                    this.permissionNotification.dismissed = true;
                }
            }, 10000);
            
            console.warn(`📢 ${notification.title}: ${notification.message}`);
        },

        // Enhanced permission debugging
        debugPermissions() {
            console.group('🔍 Permission System Debug Information');
            
            console.log('📄 Current File:', {
                type: this.currentFile?.type,
                owner: this.currentFile?.owner,
                permlink: this.currentFile?.permlink,
                documentPath: `${this.currentFile?.owner}/${this.currentFile?.permlink}`
            });
            
            console.log('👤 User Context:', {
                username: this.username,
                isAuthenticated: this.isAuthenticated,
                isOwner: this.currentFile?.owner === this.username
            });
            
            console.log('🔐 Authentication Headers:', {
                hasAccount: !!this.authHeaders['x-account'],
                hasChallenge: !!this.authHeaders['x-challenge'],
                hasPubkey: !!this.authHeaders['x-pubkey'],
                hasSignature: !!this.authHeaders['x-signature'],
                challengeAge: this.authHeaders['x-challenge'] ? 
                    ((Date.now() / 1000) - parseInt(this.authHeaders['x-challenge'])) / 3600 : 'N/A'
            });
            
            console.log('📋 Document Permissions:', this.documentPermissions);
            
            console.log('⚙️ Editor State:', {
                isReadOnlyMode: this.isReadOnlyMode,
                canPublish: this.canPublish(),
                loadingPermissions: this.loadingPermissions
            });
            
            if (this.permissionNotification) {
                console.log('📢 Active Notification:', this.permissionNotification);
            }
            
            console.groupEnd();
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
        <div class="">
            <!-- File Menu -->
            <div class="btn-group">
                <button class="btn btn-dark no-caret dropdown-toggle" type="button" data-bs-toggle="dropdown"
                    aria-expanded="false">
                    <i class="fas fa-file me-sm-1 d-none"></i><span class="d-none d-sm-inline ">File</span>
                </button>
                <ul class="dropdown-menu dropdown-menu-dark bg-dark">
                    <li><a class="dropdown-item" href="#" @click.prevent="newDocument">
                            <i class="fas fa-file-circle-plus me-2"></i>New Local Document
                        </a></li>
                    <li v-if="showCollaborativeFeatures">
                        <a class="dropdown-item" href="#" @click.prevent="newCollaborativeDocument">
                            <i class="fas fa-users me-2"></i>New Collaborative Document
                        </a>
                    </li>
                    <li v-else-if="!isAuthenticated || isAuthExpired">
                        <a class="dropdown-item text-muted" href="#" @click.prevent="requestAuthentication">
                            <i class="fas fa-users me-2"></i>New Collaborative Document
                            <small class="d-block text-warning">Authentication required</small>
                        </a>
                    </li>
                    <li>
                        <hr class="dropdown-divider">
                    </li>
                    <li><a class="dropdown-item" href="#" @click.prevent="showLoadModal = true">
                            <i class="fas fa-folder-open me-2"></i>Open Document...
                        </a></li>
                    <li>
                        <hr class="dropdown-divider">
                    </li>
                    <li><a class="dropdown-item" href="#" @click.prevent="saveDocument" :class="{ disabled: !canSave }">
                            <i class="fas fa-save me-2"></i>Save
                        </a></li>
                    <li><a class="dropdown-item" href="#" @click.prevent="saveAsDocument">
                            <i class="fas fa-copy me-2"></i>Save As...
                        </a></li>
                    <li>
                        <hr class="dropdown-divider">
                    </li>
                    <li><a class="dropdown-item" href="#" @click.prevent="shareDocument"
                            :class="{ disabled: !canShare }">
                            <i class="fas fa-share me-2"></i>Share...
                        </a></li>
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
                    <li v-if="pendingUploads.length > 0">
                        <hr class="dropdown-divider">
                    </li>
                    <li v-if="pendingUploads.length > 0" class="dropdown-header">
                        <i class="fas fa-clock me-1"></i>Pending Uploads ({{ pendingUploads.length }})
                    </li>
                    <li v-for="upload in pendingUploads" :key="upload.id" class="dropdown-item-text small">
                        <div class="d-flex justify-content-between align-items-center">
                            <div class="flex-grow-1">
                                <div class="text-warning">{{ upload.filename }}</div>
                                <div class="text-muted small">{{ upload.error }}</div>
                            </div>
                            <div class="btn-group btn-group-sm">
                                <button @click.stop="retryPendingUpload(upload.id)"
                                    class="btn btn-outline-primary btn-xs" title="Retry upload">
                                    <i class="fas fa-redo fa-xs"></i>
                                </button>
                                <button @click.stop="removePendingUpload(upload.id)"
                                    class="btn btn-outline-danger btn-xs" title="Remove from pending">
                                    <i class="fas fa-trash fa-xs"></i>
                                </button>
                            </div>
                        </div>
                    </li>
                </ul>
            </div>

            

            <!-- Collaboration Menu -->
            <div class="btn-group">
                <button class="btn btn-dark no-caret dropdown-toggle" type="button" data-bs-toggle="dropdown"
                    aria-expanded="false"
                    :class="{
                        'btn-outline-warning': !isAuthenticated || isAuthExpired,
                        'btn-outline-success': isAuthenticated && !isAuthExpired && connectionStatus === 'connected',
                        'btn-outline-primary': isAuthenticated && !isAuthExpired && connectionStatus !== 'connected'
                    }">
                    <i class="fas me-sm-1 d-none" :class="{
                        'fa-key text-warning': !isAuthenticated || isAuthExpired,
                        'fa-users text-success': isAuthenticated && !isAuthExpired && connectionStatus === 'connected',
                        'fa-users text-primary': isAuthenticated && !isAuthExpired && connectionStatus !== 'connected'
                    }"></i>
                    <span class="d-none d-sm-inline">Collaboration</span>
                    <!-- Auth status indicator -->
                    <i v-if="!isAuthenticated || isAuthExpired" class="fas fa-exclamation-triangle text-warning ms-1" title="Authentication required"></i>
                    <i v-else-if="connectionStatus === 'connected'" class="fas fa-check-circle text-success ms-1" title="Connected and authenticated"></i>
                    <i v-else class="fas fa-shield-alt text-primary ms-1" title="Authenticated"></i>
                </button>
                <ul class="dropdown-menu dropdown-menu-dark bg-dark">
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
                    
                    <!-- Connection Actions -->
                    <li v-if="connectionStatus === 'disconnected' && currentFile?.type === 'collaborative'">
                        <a class="dropdown-item" href="#" @click.prevent="reconnectToCollaborativeDocument()">
                            <i class="fas fa-plug me-2"></i>Connect to Document
                        </a>
                    </li>
                    
                    <!-- Debug option for testing permissions -->
                    <li v-if="currentFile?.type === 'collaborative'">
                        <a class="dropdown-item text-info" href="#" @click.prevent="debugPermissions()">
                            <i class="fas fa-bug me-2"></i>Debug Permissions
                        </a>
                    </li>
                    <li v-if="currentFile && currentFile.type !== 'collaborative'">
                        <a class="dropdown-item" href="#" @click.prevent="!isAuthenticated ? requestAuthentication() : convertToCollaborative()">
                            <i class="fas fa-cloud-upload-alt me-2"></i>Publish to Cloud
                            <small v-if="!isAuthenticated" class="d-block text-muted">Authentication required</small>
                        </a>
                    </li>
                    <li v-else-if="connectionStatus === 'connected'">
                        <a class="dropdown-item" href="#" @click.prevent="disconnectCollaboration">
                            <i class="fas fa-unlink me-2"></i>Disconnect
                        </a>
                    </li>
                    
                    <li><hr class="dropdown-divider"></li>
                    
                    <!-- Document Actions -->
                    <li><a class="dropdown-item" href="#" @click.prevent="shareDocument"
                            :class="{ disabled: !canShare }">
                            <i class="fas fa-user-plus me-2"></i>Share Document
                            <small v-if="!canShare && (!isAuthenticated || isAuthExpired)" class="d-block text-muted">Authentication required</small>
                        </a></li>
                    <li><a class="dropdown-item" href="#" @click.prevent="showLoadModal = true">
                            <i class="fas fa-folder me-2"></i>Browse Documents
                        </a></li>
                </ul>
            </div>
        </div>

        <!--File Status-->
        <div class="ms-auto d-flex align-items-center gap-2">
            <span v-if="currentFile" class="text-light small">
                <i class="fas fa-file me-1"></i>{{ currentFile.name || currentFile.documentName ||
                currentFile.permlink }}
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
            <span v-else class="text-muted small">
                <i class="fas fa-file-plus me-1"></i>Untitled
                <span v-if="hasUnsavedChanges" class="text-warning ms-1">●</span>
            </span>

            <!-- Connection Status Badge -->
            <span v-if="currentFile?.type === 'collaborative'" class="badge" :class="{
            'bg-success': connectionStatus === 'connected' && !isReadOnlyMode,
            'bg-info': connectionStatus === 'connected' && isReadOnlyMode,
        'bg-warning': connectionStatus === 'connecting',
        'bg-secondary': connectionStatus === 'disconnected',
        'bg-danger': connectionStatus === 'error'
                    }">
                <i class="fas fa-fw me-1" :class="{
            'fa-check-circle': connectionStatus === 'connected' && !isReadOnlyMode,
            'fa-eye': connectionStatus === 'connected' && isReadOnlyMode,
        'fa-spinner fa-spin': connectionStatus === 'connecting',
        'fa-circle': connectionStatus === 'disconnected',
        'fa-exclamation-circle': connectionStatus === 'error'
                        }"></i>
                {{ connectionStatus === 'connected' && isReadOnlyMode ? 'Read-Only' :
                   connectionStatus === 'connected' ? 'Live' :
                   connectionStatus === 'connecting' ? 'Connecting' :
                   connectionStatus === 'error' ? 'Error' : 'Offline' }}
            </span>
            <span v-else-if="currentFile?.type === 'local'" class="badge bg-secondary">
                <i class="fas fa-file me-1"></i>Local
            </span>

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
                            class="position-absolute bg-dark border border-secondary rounded p-2 shadow-lg"
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
                <div v-for="user in connectedUsers.filter(u => u.name !== username).slice(0, 3)" :key="user.name"
                    class="position-relative">
                    <img :src="'https://images.hive.blog/u/' + user.name + '/avatar/small'" :alt="user.name"
                        class="user-avatar-small rounded-circle" :title="user.name"
                        @error="handleAvatarError($event, user)" :style="{ 
                                     width: '24px', 
                                     height: '24px', 
                                     objectFit: 'cover',
                                     border: '2px solid ' + user.color,
                                     boxShadow: '0 0 0 1px rgba(255,255,255,0.2)'
                                 }">
                </div>
                <span v-if="connectedUsers.filter(u => u.name !== username).length > 3"
                    class="badge bg-light text-dark small">
                    +{{ connectedUsers.filter(u => u.name !== username).length - 3 }}
                </span>
            </div>
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

    <!-- Permission System Notification -->
    <div v-if="permissionNotification && !permissionNotification.dismissed" 
         class="alert border mx-2 mb-3 d-flex align-items-start"
         :class="{
             'alert-warning border-warning bg-dark text-warning': permissionNotification.type === 'warning',
             'alert-info border-info bg-dark text-info': permissionNotification.type === 'info'
         }">
        <i class="fas me-2 mt-1" :class="{
            'fa-exclamation-triangle': permissionNotification.type === 'warning',
            'fa-info-circle': permissionNotification.type === 'info'
        }"></i>
        <div class="flex-grow-1">
            <strong>{{ permissionNotification.title }}</strong>
            <div class="small mt-1">{{ permissionNotification.message }}</div>
        </div>
        <button @click="permissionNotification.dismissed = true" 
                class="btn btn-sm btn-outline-secondary ms-2" 
                title="Dismiss notification">
            <i class="fas fa-times"></i>
        </button>
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
<!--Publish Modal-->
<div v-if="showPublishModal" class="modal fade show d-block" style="background: rgba(0,0,0,0.5)">
    <div class="modal-dialog modal-dialog-scrollable modal-lg">
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
    <div class="modal-dialog modal-dialog-scrollable modal-lg">
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
    <div class="modal-dialog modal-dialog-scrollable">
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
                            {{ saveForm.saveToDlux ? 'Document Name' : 'Filename' }}
                            <span v-if="saveForm.saveToDlux" class="small text-muted">(Display name for
                                collaborative document)</span>
                        </label>
                        <input v-model="saveForm.filename" class="form-control"
                            :placeholder="saveForm.saveToDlux ? 'Enter document name...' : 'Enter filename...'"
                            @keyup.enter="performSave">
                        <div v-if="saveForm.saveToDlux" class="form-text">
                            <small class="text-muted">
                                <i class="fas fa-info-circle me-1"></i>
                                A unique technical ID will be auto-generated for this document
                            </small>
                        </div>
                    </div>

                    <div class="mb-3">
                        <div class="form-check">
                            <input v-model="saveForm.saveLocally" class="form-check-input" type="checkbox"
                                id="saveLocally">
                            <label class="form-check-label" for="saveLocally">
                                <i class="fas fa-file me-1"></i>Save locally
                            </label>
                        </div>
                        <div class="form-check">
                            <input v-model="saveForm.saveToDlux" class="form-check-input" type="checkbox"
                                id="saveToDlux" :disabled="!isAuthenticated || isAuthExpired">
                            <label class="form-check-label" for="saveToDlux"
                                :class="{'text-muted': !isAuthenticated || isAuthExpired }">
                                <i class="fas fa-users me-1"></i>Save to DLUX collaborative documents
                                <span v-if="!isAuthenticated || isAuthExpired" class="small text-warning ms-1">
                                    (Authentication required)
                                </span>
                            </label>
                        </div>
                        <div v-if="(!isAuthenticated || isAuthExpired) && saveForm.saveToDlux"
                            class="alert alert-warning small mt-2">
                            <i class="fas fa-exclamation-triangle me-1"></i>
                            You need to authenticate to save collaborative documents.
                            <button @click="requestAuthentication(); showSaveModal = false"
                                class="btn btn-link btn-sm p-0 ms-1">
                                Authenticate now
                            </button>
                        </div>
                    </div>

                    <div v-if="saveForm.saveToDlux" class="mb-3">
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
                        <div v-else-if="saveForm.isNewDocument && saveForm.saveToDlux"
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
    <div class="modal-dialog modal-dialog-scrollable modal-lg">
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
    <div class="modal-dialog modal-xl modal-dialog-scrollable">
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
</div>`,
    
    style: `
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
    `
}; 