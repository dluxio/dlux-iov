import methodsCommon from './methods-common.js';

export default {
    name: 'TipTapFileManager',
    
    props: {
        username: String,
        authHeaders: Object
    },
    
    emits: ['request-auth-headers', 'file-loaded', 'file-saved', 'collaboration-started'],
    
    mixins: [methodsCommon],
    
    data() {
        return {
            // Editor
            editor: null,
            
            // File management
            currentFile: null,
            hasUnsavedChanges: false,
            isCollaborativeMode: false,
            
            // Content
            content: {
                title: '',
                body: '',
                tags: [],
                custom_json: {}
            },
            
            // UI State
            showLoadModal: false,
            showSaveModal: false,
            showShareModal: false,
            showMoreMenu: false,
            
            // Files
            localFiles: [],
            collaborativeDocs: [],
            loadingDocs: false,
            
            // Forms
            saveForm: {
                filename: '',
                saveLocally: true,
                saveToDlux: false,
                isPublic: false,
                description: ''
            },
            
            shareForm: {
                username: '',
                permission: 'readonly'
            },
            
            // Operations
            saving: false,
            loading: false,
            deleting: false,
            authenticating: false
        };
    },
    
    computed: {
        isAuthenticated() {
            return this.authHeaders && this.authHeaders['x-account'];
        },
        
        canSave() {
            return this.hasUnsavedChanges && !this.saving;
        },
        
        canShare() {
            return this.isAuthenticated && this.currentFile && this.currentFile.type === 'collaborative';
        },
        
        canDelete() {
            return this.currentFile && !this.deleting;
        },
        
        canSaveToCollaborative() {
            return this.isAuthenticated;
        },
        
        hasCollaborativeFiles() {
            return this.isAuthenticated && this.collaborativeDocs.length > 0;
        },
        
        recentFiles() {
            const allFiles = [
                ...this.localFiles.map(f => ({ ...f, type: 'local' })),
                ...(this.isAuthenticated ? this.collaborativeDocs.map(f => ({ ...f, type: 'collaborative' })) : [])
            ];
            
            return allFiles.sort((a, b) => {
                const aDate = new Date(a.updatedAt || a.lastModified || 0);
                const bDate = new Date(b.updatedAt || b.lastModified || 0);
                return bDate - aDate;
            }).slice(0, 5);
        }
    },
    
    methods: {
        // Editor Management
        async createEditor() {
            const { Editor } = await import('https://esm.sh/@tiptap/core@3.0.0');
            const StarterKit = await import('https://esm.sh/@tiptap/starter-kit@3.0.0');
            const Placeholder = await import('https://esm.sh/@tiptap/extension-placeholder@3.0.0');
            
            if (this.editor) {
                this.editor.destroy();
            }
            
            this.editor = new Editor({
                element: this.$refs.editor,
                extensions: [
                    StarterKit.default.configure({ history: true }),
                    Placeholder.default.configure({ placeholder: 'Start writing your document...' })
                ],
                onUpdate: () => {
                    this.hasUnsavedChanges = true;
                    this.updateContent();
                }
            });
        },
        
        // File Operations
        async newDocument() {
            if (this.hasUnsavedChanges && !confirm('You have unsaved changes. Continue?')) {
                return;
            }
            
            this.currentFile = null;
            this.isCollaborativeMode = false;
            this.content = { title: '', body: '', tags: [], custom_json: {} };
            
            await this.createEditor();
            this.clearEditor();
            this.hasUnsavedChanges = false;
        },
        
        async loadDocument(file) {
            if (this.hasUnsavedChanges && !confirm('You have unsaved changes. Continue?')) {
                return;
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
                alert('Failed to load document: ' + error.message);
            } finally {
                this.loading = false;
            }
        },
        
        async saveDocument() {
            if (!this.hasUnsavedChanges && this.currentFile) {
                // Quick save
                if (this.currentFile.type === 'local') {
                    await this.saveToLocalStorage();
                }
            } else {
                this.showSaveModal = true;
                if (this.currentFile) {
                    this.saveForm.filename = this.currentFile.name || this.currentFile.permlink || '';
                }
            }
        },
        
        async performSave() {
            if (!this.saveForm.filename.trim()) return;
            
            this.saving = true;
            try {
                if (this.saveForm.saveLocally) {
                    await this.saveToLocalStorage();
                }
                if (this.saveForm.saveToDlux) {
                    await this.saveToCollaborativeDoc();
                }
                this.showSaveModal = false;
                this.hasUnsavedChanges = false;
                this.saveForm.filename = '';
            } catch (error) {
                alert('Save failed: ' + error.message);
            } finally {
                this.saving = false;
            }
        },
        
        async shareDocument() {
            if (!this.isAuthenticated) {
                this.requestAuthentication();
                return;
            }
            
            if (!this.canShare) {
                if (this.currentFile && this.currentFile.type === 'local') {
                    this.saveForm.saveToDlux = true;
                    this.saveForm.saveLocally = false;
                    this.showSaveModal = true;
                    return;
                }
                alert('Please save to DLUX collaborative documents first to enable sharing.');
                return;
            }
            this.showShareModal = true;
        },
        
        async requestAuthentication() {
            console.log('🔐 Requesting authentication for collaborative features...');
            this.authenticating = true;
            
            try {
                // Emit an event to parent to generate auth headers (same as collaborative-docs.js)
                this.$emit('request-auth-headers');
                
                // Wait a bit and then check if headers were set
                setTimeout(() => {
                    if (!this.authHeaders || !this.authHeaders['x-account']) {
                        // If still no headers after timeout, reset authenticating state
                        console.warn('Authentication timeout or failed');
                        this.authenticating = false;
                    }
                }, 30000); // 30 second timeout
                
            } catch (error) {
                console.error('Authentication request failed:', error);
                this.authenticating = false;
            }
        },
        
        async performShare() {
            if (!this.shareForm.username.trim()) return;
            
            try {
                const response = await fetch(`https://data.dlux.io/api/collaboration/permissions/${this.currentFile.owner}/${this.currentFile.permlink}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...this.authHeaders
                    },
                    body: JSON.stringify({
                        targetAccount: this.shareForm.username.trim(),
                        permissionType: this.shareForm.permission
                    })
                });
                
                if (response.ok) {
                    this.showShareModal = false;
                    this.shareForm.username = '';
                    alert(`Document shared with @${this.shareForm.username}!`);
                } else {
                    throw new Error('Failed to share document');
                }
            } catch (error) {
                alert('Share failed: ' + error.message);
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
                await this.newDocument();
            } catch (error) {
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
                this.localFiles = [];
            }
        },
        
        async loadLocalFile(file) {
            const content = JSON.parse(localStorage.getItem(`dlux_tiptap_file_${file.id}`) || '{}');
            this.currentFile = file;
            this.content = content;
            this.isCollaborativeMode = false;
            
            await this.createEditor();
            this.setEditorContent(content);
        },
        
        async saveToLocalStorage() {
            const content = this.getEditorContent();
            const filename = this.saveForm.filename || `document_${Date.now()}`;
            const fileId = this.currentFile?.id || `local_${Date.now()}`;
            
            localStorage.setItem(`dlux_tiptap_file_${fileId}`, JSON.stringify(content));
            
            const files = JSON.parse(localStorage.getItem('dlux_tiptap_files') || '[]');
            const fileInfo = {
                id: fileId,
                name: filename,
                type: 'local',
                lastModified: new Date().toISOString(),
                size: JSON.stringify(content).length
            };
            
            const existingIndex = files.findIndex(f => f.id === fileId);
            if (existingIndex >= 0) {
                files[existingIndex] = fileInfo;
            } else {
                files.push(fileInfo);
            }
            
            localStorage.setItem('dlux_tiptap_files', JSON.stringify(files));
            this.currentFile = fileInfo;
            await this.loadLocalFiles();
        },
        
        async deleteLocalFile() {
            const fileId = this.currentFile.id;
            localStorage.removeItem(`dlux_tiptap_file_${fileId}`);
            
            const files = JSON.parse(localStorage.getItem('dlux_tiptap_files') || '[]');
            const updatedFiles = files.filter(f => f.id !== fileId);
            localStorage.setItem('dlux_tiptap_files', JSON.stringify(updatedFiles));
            
            await this.loadLocalFiles();
        },
        
        // Collaborative Operations
        async loadCollaborativeDocs() {
            if (!this.authHeaders || !this.authHeaders['x-account']) return;
            
            this.loadingDocs = true;
            try {
                const response = await fetch('https://data.dlux.io/api/collaboration/documents', {
                    headers: this.authHeaders
                });
                
                if (response.ok) {
                    const data = await response.json();
                    this.collaborativeDocs = data.documents || [];
                }
            } catch (error) {
                console.error('Error loading collaborative documents:', error);
            } finally {
                this.loadingDocs = false;
            }
        },
        
        async loadCollaborativeFile(doc) {
            this.currentFile = { ...doc, type: 'collaborative' };
            this.isCollaborativeMode = true;
            this.content = {
                title: doc.permlink.replace(/-/g, ' '),
                body: '',
                tags: ['dlux', 'collaboration'],
                custom_json: { app: 'dlux/0.1.0', authors: [doc.owner] }
            };
            
            // For now, use standard editor - collaboration can be added later
            await this.createEditor();
            this.setEditorContent(this.content);
        },
        
        async saveToCollaborativeDoc() {
            const content = this.getEditorContent();
            const filename = this.saveForm.filename || `document_${Date.now()}`;
            
            const response = await fetch('https://data.dlux.io/api/collaboration/documents', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.authHeaders
                },
                body: JSON.stringify({
                    permlink: filename,
                    isPublic: this.saveForm.isPublic,
                    title: content.title || filename,
                    description: this.saveForm.description || 'Document created with DLUX TipTap Editor'
                })
            });
            
            if (response.ok) {
                const docData = await response.json();
                this.currentFile = { ...docData, type: 'collaborative' };
                this.isCollaborativeMode = true;
                await this.loadCollaborativeDocs();
            } else {
                throw new Error('Failed to create collaborative document');
            }
        },
        
        async deleteCollaborativeDoc() {
            const response = await fetch(`https://data.dlux.io/api/collaboration/documents/${this.currentFile.owner}/${this.currentFile.permlink}`, {
                method: 'DELETE',
                headers: this.authHeaders
            });
            
            if (response.ok) {
                await this.loadCollaborativeDocs();
            } else {
                throw new Error('Failed to delete collaborative document');
            }
        },
        
        // Content Management
        getEditorContent() {
            return {
                title: this.content.title,
                body: this.editor ? this.editor.getHTML() : '',
                tags: this.content.tags,
                custom_json: this.content.custom_json
            };
        },
        
        setEditorContent(content) {
            if (this.editor && content.body) {
                this.editor.commands.setContent(content.body);
            }
            this.content = { ...content };
        },
        
        clearEditor() {
            if (this.editor) {
                this.editor.commands.clearContent();
            }
        },
        
        updateContent() {
            if (this.editor) {
                this.content.body = this.editor.getHTML();
            }
        },
        
        // Utility
        formatFileDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        },
        
        formatFileSize(bytes) {
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            if (bytes === 0) return '0 Bytes';
            const i = Math.floor(Math.log(bytes) / Math.log(1024));
            return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
        }
    },
    
    watch: {
        authHeaders: {
            handler(newHeaders, oldHeaders) {
                const wasAuthenticated = oldHeaders && oldHeaders['x-account'];
                const isNowAuthenticated = newHeaders && newHeaders['x-account'];
                
                if (isNowAuthenticated && !wasAuthenticated) {
                    // Just became authenticated
                    console.log('✅ Authentication successful, loading collaborative documents...');
                    this.authenticating = false;
                    this.loadCollaborativeDocs();
                } else if (!isNowAuthenticated && wasAuthenticated) {
                    // Lost authentication
                    console.log('❌ Authentication lost, clearing collaborative data...');
                    this.collaborativeDocs = [];
                    this.saveForm.saveToDlux = false; // Disable collaborative save option
                    this.authenticating = false;
                } else if (isNowAuthenticated) {
                    // Already authenticated, just refresh
                    this.authenticating = false;
                    this.loadCollaborativeDocs();
                }
            },
            immediate: true
        }
    },
    
    async mounted() {
        await this.loadLocalFiles();
        if (this.authHeaders && this.authHeaders['x-account']) {
            await this.loadCollaborativeDocs();
        }
        await this.createEditor();
    },
    
    beforeUnmount() {
        if (this.editor) {
            this.editor.destroy();
        }
    },
    
    template: `
    <div class="tiptap-file-manager">
        <!-- File Menu Bar -->
        <div class="file-menu-bar bg-light border-bottom p-2 d-flex align-items-center gap-2">
            <!-- New -->
            <button @click="newDocument" class="btn btn-sm btn-outline-primary">
                <i class="fas fa-file me-1"></i>New
            </button>
            
            <!-- Load with Recent Files Dropdown -->
            <div class="dropdown">
                <button class="btn btn-sm btn-outline-primary dropdown-toggle" 
                        type="button" data-bs-toggle="dropdown">
                    <i class="fas fa-folder-open me-1"></i>Load
                </button>
                <div class="dropdown-menu">
                    <h6 class="dropdown-header">Recent Files</h6>
                    <div v-if="recentFiles.length === 0" class="dropdown-item-text text-muted small">
                        No recent files
                    </div>
                    <button v-for="file in recentFiles" :key="file.id || file.documentPath" 
                            @click="loadDocument(file)" 
                            class="dropdown-item d-flex justify-content-between align-items-center">
                        <div>
                            <i :class="file.type === 'local' ? 'fas fa-file' : 'fas fa-users'" class="me-2"></i>
                            <span>{{ file.name || file.permlink }}</span>
                        </div>
                        <small class="text-muted">{{ formatFileDate(file.lastModified || file.updatedAt) }}</small>
                    </button>
                    
                    <!-- Authentication prompt for collaborative files -->
                    <div v-if="!isAuthenticated && localFiles.length > 0" class="dropdown-divider"></div>
                    <button v-if="!isAuthenticated" 
                            @click="requestAuthentication" 
                            class="dropdown-item text-primary"
                            :disabled="authenticating">
                        <i :class="authenticating ? 'fas fa-spinner fa-spin me-2' : 'fas fa-key me-2'"></i>
                        {{ authenticating ? 'Authenticating...' : 'Authenticate to Access Collaborative Documents' }}
                    </button>
                    
                    <div class="dropdown-divider"></div>
                    <button @click="showLoadModal = true" class="dropdown-item">
                        <i class="fas fa-list me-2"></i>Show All Files
                    </button>
                </div>
            </div>
            
            <!-- Save -->
            <button @click="saveDocument" class="btn btn-sm btn-outline-success" :disabled="!canSave">
                <i class="fas fa-save me-1"></i>Save
            </button>
            
            <!-- Share -->
            <button @click="shareDocument" 
                    class="btn btn-sm btn-outline-info" 
                    :disabled="!isAuthenticated && (!currentFile || currentFile.type !== 'collaborative')"
                    :title="!isAuthenticated ? 'Authentication required for sharing' : ''">
                <i class="fas fa-share me-1"></i>Share
            </button>
            
            <!-- Delete -->
            <button @click="deleteDocument" class="btn btn-sm btn-outline-danger" :disabled="!canDelete">
                <i class="fas fa-trash me-1"></i>Delete
            </button>
            
            <!-- More Options -->
            <div class="dropdown">
                <button class="btn btn-sm btn-outline-secondary dropdown-toggle" 
                        type="button" data-bs-toggle="dropdown">
                    <i class="fas fa-ellipsis-h me-1"></i>More
                </button>
                <div class="dropdown-menu">
                    <!-- Authentication Option -->
                    <button v-if="!isAuthenticated" 
                            @click="requestAuthentication" 
                            class="dropdown-item text-primary"
                            :disabled="authenticating">
                        <i :class="authenticating ? 'fas fa-spinner fa-spin me-2' : 'fas fa-key me-2'"></i>
                        {{ authenticating ? 'Authenticating...' : 'Authenticate for Collaboration' }}
                    </button>
                    <div v-if="!isAuthenticated" class="dropdown-divider"></div>
                    
                    <!-- Coming Soon Features -->
                    <button class="dropdown-item" disabled>
                        <i class="fas fa-history me-2"></i>History (Coming Soon)
                    </button>
                    <button class="dropdown-item" disabled>
                        <i class="fas fa-code-branch me-2"></i>Compare Versions (Coming Soon)
                    </button>
                    <div class="dropdown-divider"></div>
                    <button class="dropdown-item" disabled>
                        <i class="fas fa-download me-2"></i>Export (Coming Soon)
                    </button>
                    <button class="dropdown-item" disabled>
                        <i class="fas fa-upload me-2"></i>Import (Coming Soon)
                    </button>
                </div>
            </div>
            
            <!-- File Status -->
            <div class="ms-auto d-flex align-items-center gap-2">
                <span v-if="currentFile" class="badge bg-secondary">
                    <i :class="currentFile.type === 'local' ? 'fas fa-file' : 'fas fa-users'" class="me-1"></i>
                    {{ currentFile.name || currentFile.permlink }}
                </span>
                <span v-if="hasUnsavedChanges" class="badge bg-warning">
                    <i class="fas fa-exclamation-circle me-1"></i>Unsaved
                </span>
                <span v-if="isCollaborativeMode" class="badge bg-info">
                    <i class="fas fa-users me-1"></i>Collaborative
                </span>
                <span v-if="!isAuthenticated" 
                      class="badge bg-warning" 
                      @click="requestAuthentication" 
                      style="cursor: pointer;" 
                      title="Click to authenticate for collaborative features">
                    <i class="fas fa-key me-1"></i>Not Authenticated
                </span>
                <span v-else class="badge bg-success">
                    <i class="fas fa-user me-1"></i>@{{ authHeaders['x-account'] }}
                </span>
            </div>
        </div>
        
        <!-- Document Title -->
        <div class="document-title p-3 border-bottom">
            <input v-model="content.title" 
                   class="form-control form-control-lg border-0" 
                   placeholder="Document Title"
                   @input="hasUnsavedChanges = true">
        </div>
        
        <!-- Editor -->
        <div class="editor-container p-3">
            <div ref="editor" class="tiptap-editor"></div>
        </div>
        
        <!-- Load Modal -->
        <div v-if="showLoadModal" class="modal fade show d-block" style="background: rgba(0,0,0,0.5)">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-folder-open me-2"></i>Load Document
                        </h5>
                        <button @click="showLoadModal = false" class="btn-close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <!-- Local Files -->
                            <div class="col-md-6">
                                <h6><i class="fas fa-file me-2"></i>Local Files</h6>
                                <div v-if="localFiles.length === 0" class="text-muted">No local files found</div>
                                <div v-else class="list-group">
                                    <button v-for="file in localFiles" :key="file.id"
                                            @click="loadDocument(file)"
                                            class="list-group-item list-group-item-action">
                                        <div class="d-flex justify-content-between align-items-start">
                                            <div>
                                                <h6 class="mb-1">{{ file.name }}</h6>
                                                <p class="mb-1 small text-muted">{{ formatFileSize(file.size) }}</p>
                                            </div>
                                            <small>{{ formatFileDate(file.lastModified) }}</small>
                                        </div>
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Collaborative Documents -->
                            <div class="col-md-6">
                                <h6><i class="fas fa-users me-2"></i>Collaborative Documents</h6>
                                
                                <!-- Not Authenticated State -->
                                <div v-if="!isAuthenticated" class="text-center py-4">
                                    <div v-if="authenticating">
                                        <i class="fas fa-spinner fa-spin fa-2x mb-3 text-primary"></i>
                                        <h6>Authenticating...</h6>
                                        <p class="text-muted small">Please confirm signing with your wallet</p>
                                    </div>
                                    <div v-else>
                                        <i class="fas fa-key fa-2x text-muted mb-3"></i>
                                        <p class="text-muted mb-3">Authentication required to access collaborative documents</p>
                                        <button @click="requestAuthentication" class="btn btn-primary btn-sm" :disabled="authenticating">
                                            <i class="fas fa-key me-1"></i>Authenticate with HIVE
                                        </button>
                                    </div>
                                </div>
                                
                                <!-- Authenticated State -->
                                <div v-else>
                                    <div v-if="loadingDocs" class="text-center">
                                        <i class="fas fa-spinner fa-spin"></i> Loading...
                                    </div>
                                    <div v-else-if="collaborativeDocs.length === 0" class="text-muted">No collaborative documents found</div>
                                    <div v-else class="list-group">
                                        <button v-for="doc in collaborativeDocs" :key="doc.documentPath"
                                                @click="loadDocument(doc)"
                                                class="list-group-item list-group-item-action">
                                            <div class="d-flex justify-content-between align-items-start">
                                                <div>
                                                    <h6 class="mb-1">{{ doc.permlink }}</h6>
                                                    <p class="mb-1 small text-muted">by @{{ doc.owner }}</p>
                                                </div>
                                                <small>{{ formatFileDate(doc.updatedAt) }}</small>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Save Modal -->
        <div v-if="showSaveModal" class="modal fade show d-block" style="background: rgba(0,0,0,0.5)">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-save me-2"></i>Save Document
                        </h5>
                        <button @click="showSaveModal = false" class="btn-close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">Filename</label>
                            <input v-model="saveForm.filename" 
                                   class="form-control" 
                                   placeholder="Enter filename"
                                   @keyup.enter="performSave">
                        </div>
                        
                        <div class="mb-3">
                            <div class="form-check">
                                <input v-model="saveForm.saveLocally" 
                                       class="form-check-input" 
                                       type="checkbox" 
                                       id="saveLocally">
                                <label class="form-check-label" for="saveLocally">
                                    <i class="fas fa-file me-1"></i>Save locally
                                </label>
                            </div>
                            <div class="form-check">
                                <input v-model="saveForm.saveToDlux" 
                                       class="form-check-input" 
                                       type="checkbox" 
                                       id="saveToDlux"
                                       :disabled="!isAuthenticated">
                                <label class="form-check-label" for="saveToDlux" :class="{ 'text-muted': !isAuthenticated }">
                                    <i class="fas fa-users me-1"></i>Save to DLUX collaborative documents
                                    <span v-if="!isAuthenticated" class="small text-muted"> (Authentication required)</span>
                                </label>
                            </div>
                            
                            <!-- Authentication prompt in save modal -->
                            <div v-if="!isAuthenticated" class="mt-2">
                                <button @click="requestAuthentication" 
                                        class="btn btn-sm btn-outline-primary"
                                        :disabled="authenticating">
                                    <i :class="authenticating ? 'fas fa-spinner fa-spin me-1' : 'fas fa-key me-1'"></i>
                                    {{ authenticating ? 'Authenticating...' : 'Authenticate to Enable Collaborative Save' }}
                                </button>
                            </div>
                        </div>
                        
                        <div v-if="saveForm.saveToDlux" class="mb-3">
                            <div class="form-check">
                                <input v-model="saveForm.isPublic" 
                                       class="form-check-input" 
                                       type="checkbox" 
                                       id="isPublic">
                                <label class="form-check-label" for="isPublic">
                                    Make publicly discoverable
                                </label>
                            </div>
                            <div class="mt-2">
                                <label class="form-label">Description</label>
                                <textarea v-model="saveForm.description" 
                                          class="form-control" 
                                          rows="2" 
                                          placeholder="Brief description of the document"></textarea>
                            </div>
                            <div class="alert alert-info small mt-2">
                                <i class="fas fa-info-circle me-1"></i>
                                Collaborative documents are automatically deleted after 30 days of inactivity.
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button @click="showSaveModal = false" class="btn btn-secondary">Cancel</button>
                        <button @click="performSave" 
                                class="btn btn-primary" 
                                :disabled="!saveForm.filename.trim() || saving">
                            <i v-if="saving" class="fas fa-spinner fa-spin me-1"></i>
                            <i v-else class="fas fa-save me-1"></i>
                            {{ saving ? 'Saving...' : 'Save' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Share Modal -->
        <div v-if="showShareModal" class="modal fade show d-block" style="background: rgba(0,0,0,0.5)">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-share me-2"></i>Share Document
                        </h5>
                        <button @click="showShareModal = false" class="btn-close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">Share with user</label>
                            <div class="input-group">
                                <span class="input-group-text">@</span>
                                <input v-model="shareForm.username" 
                                       class="form-control" 
                                       placeholder="Enter HIVE username"
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
                        
                        <div class="alert alert-info small">
                            <i class="fas fa-info-circle me-1"></i>
                            The user will need to authenticate with their HIVE account to access the document.
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button @click="showShareModal = false" class="btn btn-secondary">Cancel</button>
                        <button @click="performShare" 
                                class="btn btn-primary" 
                                :disabled="!shareForm.username.trim()">
                            <i class="fas fa-share me-1"></i>Share
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `
}; 