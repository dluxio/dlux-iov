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
            collaborativeDataVersion: 0
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
                
                // Check if user has postable permission
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
            this.attachedFiles.splice(index, 1);
            this.hasUnsavedChanges = true;
        },
        
        // Tag management
        addTag() {
            try {
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
                this.autoSaveContent(); // Trigger auto-save for local documents
            }
        },
        
        // Beneficiaries management
        addBeneficiary() {
            try {
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
            if (!this.customJsonString.trim()) {
                this.customJsonError = '';
                return;
            }
            
            try {
                JSON.parse(this.customJsonString);
                this.customJsonError = '';
                this.content.custom_json = JSON.parse(this.customJsonString);
                this.hasUnsavedChanges = true;
                this.autoSaveContent(); // Trigger auto-save for local documents
            } catch (error) {
                this.customJsonError = error.message;
            }
        },
        
        // Permlink management  
        togglePermlinkEditor() {
            this.showPermlinkEditor = !this.showPermlinkEditor;
            if (this.showPermlinkEditor && this.permlinkEditor) {
                this.$nextTick(() => {
                    this.permlinkEditor.commands.focus();
                });
            }
        },
        
        useGeneratedPermlink() {
            this.content.permlink = this.generatedPermlink;
            if (this.permlinkEditor) {
                this.permlinkEditor.commands.setContent(this.generatedPermlink);
            }
            this.hasUnsavedChanges = true;
            this.autoSaveContent(); // Trigger auto-save for local documents
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
                size: 0 // Size managed by IndexedDB
            };
            
            if (existingIndex >= 0) {
                files[existingIndex] = fileInfo;
            } else {
                files.push(fileInfo);
            }
            
            localStorage.setItem('dlux_tiptap_files', JSON.stringify(files));
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
                    if (this.saveForm.saveLocally) {
                        await this.saveToLocalStorage();
                    }
                    
                    if (this.saveForm.saveToDlux) {
                        await this.saveToCollaborativeDoc();
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
            
            try {
                const response = await fetch(`https://data.dlux.io/api/collaboration/permissions/${this.currentFile.owner}/${this.currentFile.permlink}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...this.authHeaders
                    },
                    body: JSON.stringify({
                        targetAccount: username,
                        permissionType: this.shareForm.permission
                    })
                });
                
                if (response.ok) {
                    // Clear form
                    this.shareForm.username = '';
                    this.shareForm.permission = 'readonly';
                    
                    // Reload permissions to update the list
                    await this.loadDocumentPermissions();
                    // Update editor permissions in case they changed
                    this.updateEditorPermissions();
                    
                    alert(`Document shared with @${username}!`);
                } else {
                    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
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
                            defaultPermissions.push({
                                account: this.username,
                                permissionType: 'readonly', // Default to read-only for safety
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
            const content = JSON.parse(localStorage.getItem(`dlux_tiptap_file_${file.id}`) || '{}');
            
            this.currentFile = file;
            this.fileType = 'local';
            this.isCollaborativeMode = false;
            this.content = content;
            
            this.disconnectCollaboration();
            await this.createStandardEditor();
            this.setEditorContent(content);
            
            console.log('📂 Local file loaded:', file.name);
        },
        
        async saveToLocalStorage() {
            const content = this.getEditorContent();
            const filename = this.saveForm.filename || `document_${Date.now()}`;
            
            // Generate ID if new file
            const fileId = this.currentFile?.id || `local_${Date.now()}`;
            
            // Save content
            localStorage.setItem(`dlux_tiptap_file_${fileId}`, JSON.stringify(content));
            
            // Update file index
            const files = JSON.parse(localStorage.getItem('dlux_tiptap_files') || '[]');
            const existingIndex = files.findIndex(f => f.id === fileId);
            
            const fileInfo = {
                id: fileId,
                name: filename,
                type: 'local',
                lastModified: new Date().toISOString(),
                size: JSON.stringify(content).length
            };
            
            if (existingIndex >= 0) {
                files[existingIndex] = fileInfo;
            } else {
                files.push(fileInfo);
            }
            
            localStorage.setItem('dlux_tiptap_files', JSON.stringify(files));
            
            this.currentFile = fileInfo;
            this.fileType = 'local';
            await this.loadLocalFiles();
            
            console.log('💾 Saved to local storage:', filename);
        },
        
        async deleteLocalFile(fileId = null) {
            const targetFileId = fileId || this.currentFile?.id;
            
            if (!targetFileId) {
                console.error('No file ID provided for deletion');
                return;
            }
            
            // Remove file content
            localStorage.removeItem(`dlux_tiptap_file_${targetFileId}`);
            
            // Remove from index
            const files = JSON.parse(localStorage.getItem('dlux_tiptap_files') || '[]');
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
                
                // CRITICAL: Always try to load permissions for collaborative documents
                try {
                    console.log('🔐 Loading permissions for collaborative document...');
                    await this.loadDocumentPermissions();
                    console.log('✅ Permissions loaded, updating editor permissions...');
                    this.updateEditorPermissions();
                } catch (error) {
                    console.warn('⚠️ Failed to load permissions:', error);
                    // Ensure we have some default permissions structure
                    if (!Array.isArray(this.documentPermissions)) {
                        console.log('🔒 Setting fallback permissions for safety');
                        this.documentPermissions = [{
                            account: this.username,
                            permissionType: 'readonly', // Default to read-only for safety
                            grantedBy: this.currentFile.owner,
                            grantedAt: new Date().toISOString()
                        }];
                    }
                    // Update editor permissions with fallback
                    this.updateEditorPermissions();
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
        
        async saveToCollaborativeDoc() {
            if (!this.showCollaborativeFeatures) {
                const confirmAuth = confirm('You need to authenticate to save collaborative documents. Authenticate now?');
                if (confirmAuth) {
                    this.requestAuthentication();
                }
                return;
            }
            
            const content = this.getEditorContent();
            const documentName = this.saveForm.filename || `document_${Date.now()}`;
            
            // Try saving with retry logic and better error handling
            const maxRetries = 3;
            let lastError = null;
            
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    console.log(`💾 Attempting to save to collaborative documents (attempt ${attempt}/${maxRetries})`);
                    
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
                    
                    const response = await fetch('https://data.dlux.io/api/collaboration/documents', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...this.authHeaders
                        },
                        body: JSON.stringify({
                            documentName: documentName, // Changed from permlink to documentName
                            isPublic: this.saveForm.isPublic,
                            title: content.title || documentName,
                            description: this.saveForm.description || 'Document created with DLUX TipTap Editor'
                        }),
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);
                    
                    if (response.ok) {
                        const docData = await response.json();
                        // The API now returns the document in docData.document
                        const serverDoc = docData.document || docData;
                        this.currentFile = {
                            ...serverDoc,
                            type: 'collaborative'
                        };
                        this.fileType = 'collaborative';
                        this.isCollaborativeMode = true;
                        
                        await this.loadCollaborativeDocs();
                        await this.connectToCollaborationServer(this.currentFile);
                        
                        console.log('☁️ Saved to collaborative documents:', documentName);
                        return; // Success - exit retry loop
                        
                    } else {
                        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                        
                        if (response.status === 401) {
                            throw new Error('Authentication expired. Please authenticate again.');
                        } else if (response.status === 503 || response.status === 502) {
                            throw new Error('Server temporarily unavailable. Please try again.');
                        } else if (response.status >= 500) {
                            throw new Error(`Server error (${response.status}). Please try again.`);
                        } else {
                            throw new Error(`Failed to create collaborative document: ${errorData.error || response.statusText}`);
                        }
                    }
                    
                } catch (error) {
                    lastError = error;
                    console.error(`❌ Save attempt ${attempt} failed:`, error);
                    
                    // Don't retry authentication errors
                    if (error.message.includes('Authentication')) {
                        const confirmAuth = confirm('Authentication required. Authenticate now?');
                        if (confirmAuth) {
                            this.requestAuthentication();
                        }
                        throw error;
                    }
                    
                    // Don't retry client errors (400-499 except 401)
                    if (error.name === 'TypeError' && error.message.includes('NetworkError')) {
                        // Network error - could be temporary, continue retrying
                    } else if (error.message.includes('Server temporarily unavailable') || 
                              error.message.includes('Server error') ||
                              error.name === 'AbortError') {
                        // Server errors or timeouts - continue retrying
                    } else {
                        // Other errors - don't retry
                        throw error;
                    }
                    
                    // Wait before retry (exponential backoff)
                    if (attempt < maxRetries) {
                        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // 1s, 2s, 4s max
                        console.log(`⏳ Waiting ${delay}ms before retry...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            }
            
            // If we get here, all retries failed
            console.error('❌ All save attempts failed');
            
            // Offer fallback to local storage
            const fallbackToLocal = confirm(
                `Failed to save to collaborative documents after ${maxRetries} attempts.\n\n` +
                `Error: ${lastError.message}\n\n` +
                `Would you like to save locally instead?`
            );
            
            if (fallbackToLocal) {
                console.log('💾 Falling back to local storage save');
                this.saveForm.saveLocally = true;
                this.saveForm.saveToDlux = false;
                await this.saveToLocalStorage();
                
                // Show success message with warning
                alert(`Document saved locally as "${documentName}".\n\nNote: This is not a collaborative document. You can try saving to DLUX later when the service is available.`);
            } else {
                throw lastError;
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
            
            // Clean up any existing editor
            if (this.titleEditor) {
                this.titleEditor.destroy();
                this.titleEditor = null;
            }
            if (this.bodyEditor) {
                this.bodyEditor.destroy();
                this.bodyEditor = null;
            }

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

        async createOfflineFirstCollaborativeEditors(bundle) {
            // Get components from the bundle
            const Editor = bundle.Editor?.default || bundle.Editor;
            const StarterKit = bundle.StarterKit?.default || bundle.StarterKit;
            const Y = bundle.Y?.default || bundle.Y;
            const Collaboration = bundle.Collaboration?.default || bundle.Collaboration;
            const Placeholder = bundle.Placeholder?.default || bundle.Placeholder;

            if (!Y || !Collaboration || !Editor || !StarterKit || !Placeholder) {
                console.warn('⚠️ Required collaboration components missing, falling back to basic editors');
                await this.createBasicEditors();
                return;
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
            
            // Create collaborative editors (offline mode - no WebSocket connection)
                this.titleEditor = new Editor({
                    element: this.$refs.titleEditor,
                    extensions: [
                        StarterKit.configure({
                        history: false, // Collaboration handles history
                            heading: false,
                            bulletList: false,
                            orderedList: false,
                            blockquote: false,
                            codeBlock: false,
                        horizontalRule: false
                    }),
                    Collaboration.configure({
                        document: this.ydoc,
                        field: 'title' // Keep existing field names for backward compatibility
                        }),
                        Placeholder.configure({
                        placeholder: this.isReadOnlyMode ? 'Title (read-only)' : 'Enter title...'
                        })
                    ],
                    editable: !this.isReadOnlyMode, // CRITICAL: Enforce read-only permissions
                    editorProps: {
                        attributes: {
                            class: 'form-control bg-transparent text-white border-0',
                        }
                    },
                onCreate: ({ editor }) => {
                    console.log(`✅ Offline collaborative title editor ready (${this.isReadOnlyMode ? 'READ-ONLY' : 'EDITABLE'})`);
                    },
                    onUpdate: ({ editor }) => {
                        // SECURITY: Block updates for read-only users
                        if (this.isReadOnlyMode) {
                            console.warn('🚫 Blocked title update: user has read-only permissions');
                            return;
                        }
                        
                        this.content.title = editor.getHTML();
                    
                    // Always show unsaved indicator for user feedback
                    this.hasUnsavedChanges = true;
                    
                    // For collaborative docs, clear unsaved flag quickly (they auto-sync)
                    // For local docs, use autosave
                    if (this.isCollaborativeMode && this.connectionStatus === 'connected') {
                        this.clearUnsavedAfterSync();
                    } else {
                        this.autoSaveContent();
                    }
                }
            });

            this.bodyEditor = new Editor({
                element: this.$refs.bodyEditor,
                extensions: [
                    StarterKit.configure({
                        history: false // Collaboration handles history
                    }),
                    Collaboration.configure({
                        document: this.ydoc,
                        field: 'body' // Keep existing field names for backward compatibility
                    }),
                    Placeholder.configure({
                        placeholder: this.isReadOnlyMode ? 'Content (read-only)' : 'Start writing...'
                    })
                ],
                editable: !this.isReadOnlyMode, // CRITICAL: Enforce read-only permissions
                editorProps: {
                    attributes: {
                        class: 'form-control bg-transparent text-white border-0',
                    }
                },
                onCreate: ({ editor }) => {
                    console.log(`✅ Offline collaborative body editor ready (${this.isReadOnlyMode ? 'READ-ONLY' : 'EDITABLE'})`);
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
                    
                    // For collaborative docs, clear unsaved flag quickly (they auto-sync)
                    // For local docs, use autosave
                    if (this.isCollaborativeMode && this.connectionStatus === 'connected') {
                        this.clearUnsavedAfterSync();
                    } else {
                        this.autoSaveContent();
                    }
                }
            });

            // Set state to offline collaborative mode
            this.isCollaborativeMode = true;  // Always collaborative now
            this.connectionStatus = 'offline'; // But offline until connected to server
            this.fileType = 'local';           // Still local until published to server

            console.log('✅ Offline collaborative editors created successfully');
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
            // Update UI based on presence changes
            // This method can be implemented based on UI requirements
        },

        async createBasicEditors() {
            // Fallback to basic editors if collaboration not available
            console.log('🏗️ Creating basic fallback editors...');
            
            // Import core TipTap modules
            const { Editor } = await import('https://esm.sh/@tiptap/core@3.0.0');
            const { default: StarterKit } = await import('https://esm.sh/@tiptap/starter-kit@3.0.0');
            const { default: Placeholder } = await import('https://esm.sh/@tiptap/extension-placeholder@3.0.0');
            
            this.titleEditor = new Editor({
                element: this.$refs.titleEditor,
                    extensions: [
                        StarterKit.configure({
                            heading: false,
                            bulletList: false,
                            orderedList: false,
                            blockquote: false,
                            codeBlock: false,
                        horizontalRule: false
                        }),
                        Placeholder.configure({
                        placeholder: this.isReadOnlyMode ? 'Title (read-only)' : 'Enter title...'
                        })
                    ],
                    editable: !this.isReadOnlyMode, // CRITICAL: Enforce read-only permissions
                    editorProps: {
                        attributes: {
                        class: 'form-control bg-transparent text-white border-0',
                    }
                },
                onCreate: ({ editor }) => {
                    console.log(`✅ Basic title editor ready (${this.isReadOnlyMode ? 'READ-ONLY' : 'EDITABLE'})`);
                    },
                    onUpdate: ({ editor }) => {
                    // SECURITY: Block updates for read-only users
                    if (this.isReadOnlyMode) {
                        console.warn('🚫 Blocked title update: user has read-only permissions');
                        return;
                    }
                    
                    this.content.title = editor.getHTML();
                    this.hasUnsavedChanges = true;
                    this.autoSaveContent();
            }
                });
            
                this.bodyEditor = new Editor({
                    element: this.$refs.bodyEditor,
                    extensions: [
                    StarterKit,
                        Placeholder.configure({
                        placeholder: this.isReadOnlyMode ? 'Content (read-only)' : 'Start writing...'
                    })
                    ],
                    editable: !this.isReadOnlyMode, // CRITICAL: Enforce read-only permissions
                    editorProps: {
                        attributes: {
                            class: 'form-control bg-transparent text-white border-0',
                        }
                    },
                onCreate: ({ editor }) => {
                    console.log(`✅ Basic body editor ready (${this.isReadOnlyMode ? 'READ-ONLY' : 'EDITABLE'})`);
                    },
                    onUpdate: ({ editor }) => {
                        // SECURITY: Block updates for read-only users
                        if (this.isReadOnlyMode) {
                            console.warn('🚫 Blocked body update: user has read-only permissions');
                            return;
                        }
                        
                        this.content.body = editor.getHTML();
                    this.hasUnsavedChanges = true;
                    this.autoSaveContent();
                }
            });

            // Set to basic mode  
            this.isCollaborativeMode = false;
            this.fileType = 'local';
        },

        // Autosave functionality
        autoSaveContent() {
            if (this.autoSaveTimeout) {
                clearTimeout(this.autoSaveTimeout);
            }
            
            this.autoSaveTimeout = setTimeout(async () => {
                if (!this.currentFile) {
                    // Create a new local file if none exists
                    const timestamp = Date.now();
                    const fileId = `local_${timestamp}`;
                    this.currentFile = {
                        id: fileId,
                        name: `Untitled ${new Date().toLocaleDateString()}`,
                        type: 'local',
                        lastModified: new Date().toISOString()
                    };
                    this.fileType = 'local';
                }
                
                if (this.currentFile.type === 'local') {
                    await this.saveToLocalStorage();
                    this.hasUnsavedChanges = false;
                }
            }, 2000); // Autosave 2 seconds after last edit
        },

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
        
        // Debug method to manually check and update permissions
        debugPermissions() {
            console.log('🔍 DEBUG: Manual permission check triggered');
            console.log('Current state:', {
                username: this.username,
                currentFile: this.currentFile,
                documentPermissions: this.documentPermissions,
                isReadOnlyMode: this.isReadOnlyMode,
                connectionStatus: this.connectionStatus
            });
            
            // Force update editor permissions
            this.updateEditorPermissions();
        },

        // ===== UNIFIED SYNC INDICATOR: Offline-First Architecture =====
        clearUnsavedAfterSync() {
            if (this.syncTimeout) {
                clearTimeout(this.syncTimeout);
            }
            
            // Single unified sync indicator for Y.js + IndexedDB persistence
            // Following TipTap offline-first best practices
            this.syncTimeout = setTimeout(() => {
                if (this.indexeddbProvider) {
                    console.log('💾 Y.js + IndexedDB persistence complete (offline-first)');
                } else if (this.connectionStatus === 'connected') {
                    console.log('💾 Y.js + Cloud sync complete (online mode)');
                } else {
                    console.log('💾 Y.js persistence complete (memory only - will not persist after page refresh)');
                }
                this.hasUnsavedChanges = false;
            }, 1000); // 1 second delay to show sync indicator
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
        },

        // Legacy method - replaced by connectToCollaborationServer for offline-first approach
        // This method was used when we created editors on-demand, but now editors are always collaborative
        async initializeCollaboration(doc) {
            console.warn('⚠️ initializeCollaboration is deprecated - using connectToCollaborationServer instead');
            return this.connectToCollaborationServer(doc);
        },
        
        disconnectCollaboration() {
            console.log('🧹 Cleaning up collaborative editor connections...');
            
            // Set flag to prevent new operations during cleanup
            this.isInitializing = false;
            
            // Destroy all editors first to prevent them from trying to access destroyed Y.js types
            if (this.titleEditor) {
                try {
                    console.log('🗑️ Destroying title editor');
                    this.titleEditor.destroy();
                } catch (error) {
                    console.warn('Error destroying title editor:', error);
                }
                this.titleEditor = null;
            }
            if (this.permlinkEditor) {
                try {
                    console.log('🗑️ Destroying permlink editor');
                    this.permlinkEditor.destroy();
                } catch (error) {
                    console.warn('Error destroying permlink editor:', error);
                }
                this.permlinkEditor = null;
            }
            if (this.bodyEditor) {
                try {
                    console.log('🗑️ Destroying body editor');
                    this.bodyEditor.destroy();
                } catch (error) {
                    console.warn('Error destroying body editor:', error);
                }
                this.bodyEditor = null;
            }
            
            // CRITICAL: Clean up DOM elements completely
            this.cleanupDOMElements();
            
            // Disconnect provider after editors are destroyed
            if (this.provider) {
                try {
                    console.log('🔌 Disconnecting collaboration provider');
                    // Remove all event listeners first
                    ['synced', 'connect', 'disconnect', 'status', 'message'].forEach(event => {
                        if (this.provider && typeof this.provider.off === 'function') {
                            this.provider.off(event);
                        }
                    });
                    this.provider.disconnect();
                } catch (error) {
                    console.warn('Error disconnecting provider:', error);
                }
                this.provider = null;
            }
            
            // Destroy Y.js document last with complete cleanup
            if (this.ydoc) {
                try {
                    console.log('📄 Destroying Y.js document with complete cleanup');
                    
                    // Clear all shared types first to prevent conflicts
                    const shareKeys = Array.from(this.ydoc.share.keys());
                    console.log('🧹 Clearing Y.js shared types:', shareKeys);
                    shareKeys.forEach(key => {
                        try {
                            const type = this.ydoc.share.get(key);
                            if (type && typeof type.clear === 'function') {
                                type.clear(); // Clear content instead of destroy
                            }
                            if (type && typeof type.destroy === 'function') {
                                type.destroy();
                            }
                            this.ydoc.share.delete(key);
                        } catch (error) {
                            console.warn(`Error deleting Y.js type ${key}:`, error);
                        }
                    });
                    
                    // Clear subdocs if any
                    if (this.ydoc.subdocs) {
                        this.ydoc.subdocs.forEach(subdoc => {
                            try {
                                subdoc.destroy();
                            } catch (error) {
                                console.warn('Error destroying Y.js subdoc:', error);
                            }
                        });
                    }
                    
                    // Now destroy the document
                    this.ydoc.destroy();
                } catch (error) {
                    console.warn('Error destroying Y.js document:', error);
                }
                this.ydoc = null;
            }
            
            this.connectionStatus = 'disconnected';
            this.connectionMessage = 'Not connected';
            
            // Clear global instance tracking if this is the active instance
            if (window.dluxCollaborativeInstance === this.componentId) {
                window.dluxCollaborativeInstance = null;
                window.dluxCollaborativeCleanup = null;
                console.log('🧹 Cleared global collaborative instance tracking');
            }
            
            // Reset initialization flag
            this.isInitializing = false;
            
            console.log('✅ Collaborative editor cleanup completed');
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
            // Avoid clearing collaborative editors directly - this causes transaction conflicts
            if (this.isCollaborativeMode && this.connectionStatus === 'connected') {
                console.log('🤝 Skipping editor clearing in collaborative mode - let Y.js handle state');
                // Just clear the local content state
                this.content = {
                    title: '',
                    body: '',
                    tags: [],
                    custom_json: {},
                    permlink: '',
                    beneficiaries: []
                };
                return;
            }
            
            // Clear non-collaborative editors normally
            if (this.titleEditor) {
                this.titleEditor.commands.clearContent();
            }
            if (this.permlinkEditor) {
                this.permlinkEditor.commands.clearContent();
            }
            if (this.bodyEditor) {
                this.bodyEditor.commands.clearContent();
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
        
        // History and diff (placeholder methods)
        async loadDocumentHistory() {
            // TODO: Implement document history loading
            console.log('Loading document history...');
        },
        
        async showDiff() {
            // TODO: Implement diff functionality
            console.log('Showing document diff...');
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
                this.saveForm.saveToDlux = true;
                this.saveForm.saveLocally = false;
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
        
        async initializeEditor() {
            // Clean up any existing editor
            if (this.editor) {
                this.editor.destroy();
                this.editor = null;
            }

            // Import core TipTap modules
            const { Editor } = await import('https://esm.sh/@tiptap/core@3.0.0');
            const { default: StarterKit } = await import('https://esm.sh/@tiptap/starter-kit@3.0.0');
            const { default: Placeholder } = await import('https://esm.sh/@tiptap/extension-placeholder@3.0.0');
            
            // Base extensions that are always included
            const extensions = [
                StarterKit.configure({
                    history: !this.isCollaborative, // Only enable history for non-collaborative mode
                }),
                Placeholder.configure({
                    placeholder: 'Start writing...'
                })
            ];

            // If collaborative mode is enabled, add collaboration extensions
            if (this.isCollaborative) {
                try {
                    // Initialize Y.js document and provider if not already done
                    if (!this.ydoc || !this.provider) {
                        await this.initializeCollaboration();
                    }

                    // Get collaboration extensions
                    const bundle = window.TiptapCollaboration;
                    const Collaboration = bundle.Collaboration;
                    const CollaborationCursor = bundle.CollaborationCursor;

                    if (!Collaboration || !CollaborationCursor) {
                        throw new Error('Required collaboration extensions not found');
                    }

                    // Add collaboration extensions
                    extensions.push(
                        Collaboration.configure({
                            document: this.ydoc,
                            field: 'content',
                            fragmentContent: true,
                        }),
                        CollaborationCursor.configure({
                            provider: this.provider,
                            user: {
                                name: this.username,
                                color: this.getUserColor
                            }
                        })
                    );
                } catch (error) {
                    console.error('Failed to initialize collaborative mode:', error);
                    // Fall back to non-collaborative mode
                    this.isCollaborative = false;
                    extensions[0] = StarterKit.configure({ history: true });
                }
            }

            // Create the editor
            this.editor = new Editor({
                element: this.$refs.editor,
                extensions,
                content: this.content,
                editorProps: {
                    attributes: {
                        class: 'form-control bg-transparent text-white border-0',
                    }
                },
                onCreate: ({ editor }) => {
                    console.log(`✅ Editor ready (${this.isCollaborative ? 'collaborative' : 'standard'} mode)`);
                },
                onUpdate: ({ editor }) => {
                    this.content = editor.getHTML();
                    if (!this.isCollaborative) {
                        this.handleLocalUpdate();
                    }
                }
            });
        },



        // Method to toggle collaborative mode
        async toggleCollaborativeMode() {
            const wasCollaborative = this.isCollaborative;
            this.isCollaborative = !wasCollaborative;
            
            // Store current content before switching
            const currentContent = this.editor.getHTML();
            
            // Reinitialize editor with new mode
            await this.initializeEditor();
            
            if (!wasCollaborative && this.isCollaborative) {
                // If switching to collaborative mode, initialize the shared content
                const yxml = this.ydoc.get('content', Y.XmlFragment);
                yxml.delete(0, yxml.length);
                yxml.insert(0, currentContent);
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

            // Show the save modal for publishing to cloud
            const documentName = this.currentFile?.name || `document-${Date.now()}`;
            
            this.saveForm = {
                filename: documentName,
                saveLocally: false,
                saveToDlux: true,
                isPublic: false,
                description: 'Published from offline document',
                isNewDocument: true
            };
            
            this.showSaveModal = true;
            console.log('🔄 Ready to publish offline collaborative document to server');
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
                        :disabled="displayTags.length >= 10">
                    <button @click="addTag" class="btn btn-sm btn-outline-primary"
                        :disabled="displayTags.length >= 10 || !tagInput.trim()">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>

                <!-- Current tags -->
                <span v-for="(tag, index) in displayTags" :key="index"
                    class="badge bg-primary d-flex align-items-center">
                    {{ tag }}
                    <button @click="removeTag(index)" class="btn-close btn-close-white ms-2 small"></button>
                </span>
            </div>
            <small v-if="displayTags.length >= 10" class="text-warning">
                Maximum 10 tags allowed
            </small>
            <small v-if="currentFile?.type === 'collaborative'" class="text-info d-block mt-1">
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
                    <strong>Personal Publishing Settings</strong>
                    <div class="small mt-1">These settings are personal to you and don't affect the collaborative document content. They control how YOU would publish this content to Hive.</div>
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
                            <div v-if="!showPermlinkEditor" @click="togglePermlinkEditor"
                                class="bg-dark border border-secondary rounded p-2 cursor-pointer text-white font-monospace">
                                {{ content.permlink || generatedPermlink || 'Click to edit...' }}
                            </div>
                            <div v-else class="editor-field bg-dark border border-secondary rounded">
                                <div ref="permlinkEditor" class="permlink-editor"></div>
                            </div>
                        </div>
                        <button @click="useGeneratedPermlink" class="btn btn-sm btn-outline-secondary"
                            :disabled="!generatedPermlink">
                            Auto-generate
                        </button>
                    </div>
                    <small class="text-muted">URL-safe characters only (a-z, 0-9, dashes). Not synchronized in collaborative
                        mode.</small>
                </div>
                <!-- Beneficiaries Section -->
                <div class="mb-4">
                    <label class="form-label text-white fw-bold">
                        <i class="fas fa-users me-2"></i>Beneficiaries (Reward Sharing)
                    </label>
                    <div class="bg-dark border border-secondary rounded p-3">
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle me-2"></i>
                            <small>Configure reward sharing with other accounts. Total cannot exceed
                                100%.</small>
                        </div>
                        <div class="d-flex align-items-center gap-2 mb-2">
                            <input type="text" class="form-control bg-dark text-white border-secondary"
                                placeholder="@username" v-model="beneficiaryInput.account">
                            <input type="number" class="form-control bg-dark text-white border-secondary"
                                placeholder="%" min="0.01" max="100" step="0.01" v-model="beneficiaryInput.percent">
                            <button @click="addBeneficiary" class="btn btn-outline-success">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                        <div v-if="displayBeneficiaries.length > 0" class="mt-2">
                            <div v-for="(ben, index) in displayBeneficiaries" :key="index"
                                class="d-flex align-items-center justify-content-between bg-secondary rounded p-2 mb-1">
                                <span>@{{ ben.account }} - {{ (ben.weight / 100).toFixed(2) }}%</span>
                                <button @click="removeBeneficiary(index)" class="btn btn-sm btn-outline-danger">
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
                    </label>
                    <div class="bg-dark border border-secondary rounded p-3">
                        <textarea v-model="customJsonString" @input="validateCustomJson"
                            class="form-control bg-dark text-white border-secondary font-monospace" rows="6"
                            placeholder="Enter custom JSON metadata..."></textarea>
                        <div v-if="customJsonError" class="text-danger small mt-1">
                            <i class="fas fa-exclamation-triangle me-1"></i>{{ customJsonError }}
                        </div>
                        <div v-else-if="customJsonString" class="text-success small mt-1">
                            <i class="fas fa-check-circle me-1"></i>Valid JSON
                        </div>
                        <small class="text-muted">Additional metadata for your post. Must be valid JSON.</small>
                    </div>
                </div>

                <!--Comment Options(Hive - specific)-->
                <div class="mb-4">
                    <label class="form-label text-white fw-bold">
                        <i class="fas fa-cog me-2"></i>Comment Options
                    </label>
                    <div class="bg-dark border border-secondary rounded p-3">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" v-model="commentOptions.allowVotes"
                                        @change="handleCommentOptionChange" id="allowVotes">
                                    <label class="form-check-label text-white" for="allowVotes">
                                        Allow votes
                                    </label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox"
                                        v-model="commentOptions.allowCurationRewards" @change="handleCommentOptionChange" id="allowCurationRewards">
                                    <label class="form-check-label text-white" for="allowCurationRewards">
                                        Allow curation rewards
                                    </label>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox"
                                        v-model="commentOptions.maxAcceptedPayout" @change="handleCommentOptionChange" id="maxPayout">
                                    <label class="form-check-label text-white" for="maxPayout">
                                        Decline payout
                                    </label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" v-model="commentOptions.percentHbd"
                                        @change="handleCommentOptionChange" id="powerUp">
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
                                <th scope="col" style="width: 40%;">Name</th>
                                <th scope="col">Details</th>
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