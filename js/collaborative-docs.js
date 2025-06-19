export default {
  name: "CollaborativeDocs",
  template: `
    <div class="collaborative-docs">
      <div class="row">
        <div class="col-md-6">
          <div class="card bg-dark border-primary">
            <div class="card-header bg-primary">
              <h5 class="mb-0 text-light">
                <i class="fas fa-users me-2"></i>My Collaborative Documents
              </h5>
            </div>
            <div class="card-body">
              <!-- Authentication Required State -->
              <div v-if="!authHeaders || !authHeaders['x-account']" class="text-center py-4">
                <div v-if="authenticating">
                  <i class="fas fa-spinner fa-spin fa-2x mb-3 text-primary"></i>
                  <h6>Authenticating...</h6>
                  <p class="text-muted small">Please confirm signing with your wallet</p>
                </div>
                <div v-else>
                  <i class="fas fa-shield-alt fa-2x mb-3 text-info"></i>
                  <h6>Authentication Required</h6>
                  <p class="text-muted small mb-3">Access your collaborative documents securely using your HIVE account</p>
                  <button @click="requestAuthentication" 
                          class="btn btn-primary"
                          :disabled="authenticating">
                    <i class="fas fa-key me-2"></i>Access Documents
                  </button>
                </div>
              </div>
              
              <!-- Loading Documents State -->
              <div v-else-if="loading" class="text-center">
                <i class="fas fa-spinner fa-spin me-2"></i>Loading documents...
              </div>
              
              <!-- No Documents State -->
              <div v-else-if="documents.length === 0" class="text-muted text-center py-3">
                <i class="fas fa-file-text fa-2x mb-3"></i>
                <p>No collaborative documents yet.</p>
                <p class="small">Create a new document to start collaborating!</p>
              </div>
              
              <div v-else>
                <div v-for="doc in sortedDocuments" :key="doc.documentPath" class="document-item mb-2"
                     :class="{ 'border border-warning': isDocumentExpiringSoon(doc) }">
                  <div class="d-flex justify-content-between align-items-center p-2 bg-secondary rounded"
                       :class="{ 'bg-warning bg-opacity-25': isDocumentExpiringSoon(doc) }">
                    <div class="flex-grow-1">
                      <div class="d-flex align-items-center">
                        <strong>{{ doc.permlink }}</strong>
                        <span v-if="isDocumentExpiringSoon(doc)" class="badge bg-warning text-dark ms-2">
                          <i class="fas fa-exclamation-triangle me-1"></i>
                          {{ getDaysUntilCleanup(doc) }} days left
                        </span>
                      </div>
                      <small class="d-block text-muted">
                        <i class="fas fa-user fa-fw"></i>Owner: @{{ doc.owner }} • 
                        <i class="fas fa-edit fa-fw"></i>Updated: {{ formatDate(doc.updatedAt) }}
                      </small>
                    </div>
                    <div class="btn-group">
                      <button @click="openDocument(doc)" class="btn btn-sm btn-primary">
                        <i class="fas fa-edit me-1"></i>Open
                      </button>
                      <button @click="openShareModal(doc)" class="btn btn-sm btn-info" data-bs-toggle="modal" data-bs-target="#shareModal">
                        <i class="fas fa-share me-1"></i>Share
                      </button>
                      <button @click="deleteDocument(doc)" class="btn btn-sm btn-danger">
                        <i class="fas fa-trash me-1"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <hr>
              
              <div class="create-document">
                <h6><i class="fas fa-plus me-2"></i>Create New Document</h6>
                <div class="mb-2">
                  <input v-model="newDocPermlink" 
                         @keyup.enter="createDocument"
                         class="form-control form-control-sm" 
                         placeholder="Document name (e.g., my-article-draft)"
                         :disabled="creating">
                </div>

                <button @click="createDocument" 
                        :disabled="!newDocPermlink || creating"
                        class="btn btn-sm btn-success">
                  <i class="fas fa-plus me-1"></i>
                  {{ creating ? 'Creating...' : 'Create Document' }}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-6">
          <div class="card bg-dark border-secondary" v-if="selectedDoc">
            <div class="card-header bg-secondary">
              <h5 class="mb-0 text-light">
                <i class="fas fa-file-alt me-2"></i>{{ selectedDoc.permlink }}
                <small class="text-muted ms-2">by @{{ selectedDoc.owner }}</small>
              </h5>
            </div>
            <div class="card-body">
              <!-- Document Settings (Owner Only) -->
              <div v-if="selectedDoc.owner === account" class="mb-3">
                <h6><i class="fas fa-users me-2"></i>Permissions</h6>
                <div v-if="permissions.length === 0" class="text-muted">
                  No shared permissions yet.
                </div>
                <div v-else>
                  <div v-for="perm in permissions" :key="perm.account" 
                       class="d-flex justify-content-between align-items-center mb-2 p-2 bg-dark rounded">
                    <div>
                      <strong>@{{ perm.account }}</strong>
                      <span class="badge ms-2" :class="perm.permission_type === 'postable' ? 'bg-success' : perm.permission_type === 'editable' ? 'bg-warning' : 'bg-info'">
                        {{ perm.permission_type }}
                      </span>
                    </div>
                    <button @click="revokePermission(perm.account)" class="btn btn-sm btn-outline-danger">
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                </div>
                
                <div class="mt-3">
                  <h6>Grant Access</h6>
                  <div class="input-group input-group-sm">
                    <span class="input-group-text">@</span>
                    <input v-model="newPermissionAccount" 
                           @keyup.enter="grantPermission"
                           class="form-control" 
                           placeholder="username">
                    <select v-model="newPermissionType" class="form-select">
                      <option value="readonly">Read Only</option>
                      <option value="editable">Editable</option>
                      <option value="postable">Full Access</option>
                    </select>
                    <button @click="grantPermission" 
                            :disabled="!newPermissionAccount"
                            class="btn btn-primary">
                      Grant
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- Recent Activity (Collapsible) -->
              <div class="mb-3">
                <h6>
                  <button class="btn btn-link p-0 text-light text-decoration-none" 
                          type="button" data-bs-toggle="collapse" 
                          data-bs-target="#activityCollapse" 
                          aria-expanded="false" 
                          aria-controls="activityCollapse">
                    <i class="fas fa-history me-2"></i>Recent Activity
                    <i class="fas fa-chevron-down ms-1"></i>
                  </button>
                </h6>
                <div class="collapse" id="activityCollapse">
                  <div v-if="activity.length === 0" class="text-muted small">
                    No recent activity.
                  </div>
                  <div v-else class="activity-log" style="max-height: 200px; overflow-y: auto;">
                    <div v-for="act in activity" :key="act.id" class="small mb-1 p-1 bg-dark rounded">
                      <strong>@{{ act.account }}</strong> {{ act.activity_type }}
                      <span class="text-muted">{{ formatDate(act.created_at) }}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="text-center">
                <button @click="openCollaborativeEditor" class="btn btn-primary">
                  <i class="fas fa-edit me-2"></i>Open Collaborative Editor
                </button>
              </div>
            </div>
          </div>
          
          <div v-else class="card bg-dark border-secondary">
            <div class="card-body text-center text-muted">
              <i class="fas fa-hand-pointer fa-2x mb-3"></i>
              <p>Select a document to view settings and manage permissions.</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Share Modal - Teleported to body -->
      <Teleport to="body">
        <div class="modal fade" id="shareModal" tabindex="-1" aria-labelledby="shareModalLabel" aria-hidden="true">
          <div class="modal-dialog">
            <div class="modal-content bg-dark text-light">
            <div class="modal-header border-secondary">
              <h5 class="modal-title" id="shareModalLabel">
                <i class="fas fa-share me-2"></i>Share Document: {{ shareDoc ? shareDoc.permlink : '' }}
              </h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <!-- ✅ PROPER SOLUTION: Use existing permissions data with correct document context -->
              <div class="mb-4" v-if="shareDoc && shareDoc.owner === account">
                <h6><i class="fas fa-users me-2"></i>Current Permissions</h6>
                <div v-if="getPermissionsForDocument(shareDoc).length === 0" class="text-muted small">
                  No users have been granted access yet.
                </div>
                <div v-else>
                  <div v-for="perm in getPermissionsForDocument(shareDoc)" :key="perm.account" 
                       class="d-flex justify-content-between align-items-center mb-2 p-2 bg-secondary rounded">
                    <div>
                      <strong>@{{ perm.account }}</strong>
                      <span class="badge ms-2" :class="perm.permission_type === 'postable' ? 'bg-success' : perm.permission_type === 'editable' ? 'bg-warning' : 'bg-info'">
                        {{ perm.permission_type }}
                      </span>
                    </div>
                    <button @click="revokePermission(perm.account)" class="btn btn-sm btn-outline-danger">
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                </div>
                <hr>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Share with user:</label>
                <div class="input-group">
                  <span class="input-group-text">@</span>
                  <input v-model="shareUsername" 
                         class="form-control" 
                         placeholder="Enter HIVE username"
                         @keyup.enter="shareWithUser">
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label">Permission level:</label>
                                 <select v-model="sharePermission" class="form-select">
                   <option value="readonly">Read Only - Can view and connect</option>
                   <option value="editable">Editable - Can view and edit content</option>
                   <option value="postable">Full Access - Can edit and post to Hive</option>
                 </select>
              </div>
              <div class="alert alert-info small">
                <i class="fas fa-info-circle me-2"></i>
                The user will need to authenticate with their HIVE account to access the document. 
                They can find it in their Collaborative Documents section after you grant access.
              </div>
            </div>
            <div class="modal-footer border-secondary">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" 
                      class="btn btn-primary" 
                      @click="shareWithUser"
                      :disabled="!shareUsername.trim()">
                <i class="fas fa-share me-1"></i>Grant Access
              </button>
            </div>
          </div>
        </div>
        </div>
      </Teleport>
    </div>

  `,
  props: {
    account: {
      type: String,
      required: true
    },
    authHeaders: {
      type: Object,
      required: false,
      default: () => ({})
    }
  },
  emits: ['open-collaborative-doc', 'request-auth-headers', 'permission-change', 'load-document-content'],
  data() {
    return {
      loading: false,
      creating: false,
      authenticating: false,
      documents: [],
      selectedDoc: null,
      permissions: [],
      activity: [],
      newDocPermlink: '',
      newPermissionAccount: '',
      newPermissionType: 'readonly',
      shareDoc: null,
      shareUsername: '',
      sharePermission: 'readonly'
    };
  },
  methods: {
    async loadDocuments() {
      if (!this.account) {
        this.loading = false;
        return;
      }
      
      // Only proceed if we have auth headers
      if (!this.authHeaders || !this.authHeaders['x-account']) {
        console.log('No auth headers available for loading documents');
        return;
      }
      
      this.loading = true;
      try {
        console.log('📋 FULL DEBUG: Making documents API call', {
          url: 'https://data.dlux.io/api/collaboration/documents',
          headers: this.authHeaders
        });
        
        const response = await fetch('https://data.dlux.io/api/collaboration/documents', {
          headers: this.authHeaders
        });
        
        console.log('📋 FULL DEBUG: Documents API response received', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries())
        });
        
        if (response.ok) {
          try {
            // Get the raw text first
            const responseText = await response.text();
            console.log('📋 FULL DEBUG: Raw response text (first 1000 chars):', responseText.substring(0, 1000));
            
            // Try to parse as JSON
            const data = JSON.parse(responseText);
            console.log('📋 Documents API response:', data);
            this.documents = data.documents || [];
            console.log('📋 Loaded documents:', this.documents);
          } catch (jsonError) {
            console.error('❌ JSON Parse Error - Documents API:', {
              status: response.status,
              statusText: response.statusText,
              jsonError: jsonError.message,
              rawResponse: 'Already consumed in debug above'
            });
            this.documents = [];
          }
        } else {
          console.error('Failed to load documents:', response.statusText);
          // If unauthorized, the headers might be expired
          if (response.status === 401) {
            console.warn('Authentication failed - headers may be expired');
            this.authenticating = false;
            return;
          }
        }
      } catch (error) {
        console.error('Error loading documents:', error);
      } finally {
        this.loading = false;
      }
    },
    
    async requestAuthentication() {
      console.log('Requesting authentication for collaborative documents...');
      this.authenticating = true;
      
      try {
        // Emit an event to parent to generate auth headers
        this.$emit('request-auth-headers');
        
        // Wait a bit and then check if headers were set
        // In a real scenario, this would be handled by watching authHeaders
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
    
    requestAuthHeaders() {
      // Emit an event to parent to generate auth headers
      this.$emit('request-auth-headers');
    },
    
    async createDocument() {
      if (!this.newDocPermlink || this.creating) return;
      
      this.creating = true;
      try {
        const response = await fetch('https://data.dlux.io/api/collaboration/documents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...this.authHeaders
          },
          body: JSON.stringify({
            permlink: this.newDocPermlink,
            isPublic: false,
            title: this.newDocPermlink.replace(/-/g, ' '),
            description: 'Collaborative document created from DLUX'
          })
        });
        
        if (response.ok) {
          this.newDocPermlink = '';
          await this.loadDocuments();
        } else {
          console.error('Failed to create document:', response.statusText);
        }
      } catch (error) {
        console.error('Error creating document:', error);
      } finally {
        this.creating = false;
      }
    },
    
    async deleteDocument(doc) {
      if (!confirm('Are you sure you want to delete "' + doc.permlink + '"?')) return;
      
      try {
        const response = await fetch('https://data.dlux.io/api/collaboration/documents/' + doc.owner + '/' + doc.permlink, {
          method: 'DELETE',
          headers: this.authHeaders
        });
        
        if (response.ok) {
          await this.loadDocuments();
          if (this.selectedDoc && this.selectedDoc.documentPath === doc.documentPath) {
            this.selectedDoc = null;
          }
        } else {
          console.error('Failed to delete document:', response.statusText);
        }
      } catch (error) {
        console.error('Error deleting document:', error);
      }
    },
    
    async openDocument(doc) {
      this.selectedDoc = doc;
      await this.loadPermissions();
      await this.loadActivity();
      
      // Emit permission info when document is opened
      this.$emit('permission-change', {
        canPost: this.canUserPost(),
        permission: this.getCurrentUserPermission(),
        documentPath: doc.documentPath
      });
    },
    
    async loadPermissions() {
      if (!this.selectedDoc) return;
      
      try {
        const response = await fetch('https://data.dlux.io/api/collaboration/permissions/' + this.selectedDoc.owner + '/' + this.selectedDoc.permlink, {
          headers: this.authHeaders
        });
        
        if (response.ok) {
          try {
            const data = await response.json();
            this.permissions = data.permissions || [];
            
            // Emit permission change to parent
            this.$emit('permission-change', {
              canPost: this.canUserPost(),
              permission: this.getCurrentUserPermission(),
              documentPath: this.selectedDoc.documentPath
            });
          } catch (jsonError) {
            const responseText = await response.text();
            console.error('❌ JSON Parse Error in loadPermissions - Server returned HTML:', {
              status: response.status,
              statusText: response.statusText,
              url: response.url,
              responseText: responseText.substring(0, 500) + '...'
            });
            this.permissions = [];
          }
        }
      } catch (error) {
        console.error('Error loading permissions:', error);
      }
    },
    
    async loadActivity() {
      if (!this.selectedDoc) return;
      
      try {
        const response = await fetch('https://data.dlux.io/api/collaboration/activity/' + this.selectedDoc.owner + '/' + this.selectedDoc.permlink + '?limit=10', {
          headers: this.authHeaders
        });
        
        if (response.ok) {
          try {
            const data = await response.json();
            this.activity = data.activity || [];
          } catch (jsonError) {
            const responseText = await response.text();
            console.error('❌ JSON Parse Error in loadActivity - Server returned HTML:', {
              status: response.status,
              statusText: response.statusText,
              responseText: responseText.substring(0, 500) + '...'
            });
            this.activity = [];
          }
        }
      } catch (error) {
        console.error('Error loading activity:', error);
      }
    },
    
    async grantPermission() {
      if (!this.newPermissionAccount || !this.selectedDoc) return;
      
      try {
        console.log('📋 FULL DEBUG: Making grant permission API call (main panel)', {
          url: `https://data.dlux.io/api/collaboration/permissions/${this.selectedDoc.owner}/${this.selectedDoc.permlink}`,
          targetAccount: this.newPermissionAccount,
          permissionType: this.newPermissionType,
          headers: this.authHeaders
        });
        
        const response = await fetch('https://data.dlux.io/api/collaboration/permissions/' + this.selectedDoc.owner + '/' + this.selectedDoc.permlink, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...this.authHeaders
          },
          body: JSON.stringify({
            targetAccount: this.newPermissionAccount,
            permissionType: this.newPermissionType
          })
        });
        
        if (response.ok) {
          this.newPermissionAccount = '';
          await this.loadPermissions();
          // ✅ REACTIVITY FIX: Refresh documents list to show newly accessible documents
          await this.loadDocuments();
        } else {
          try {
            const errorData = await response.json();
            console.error('Failed to grant permission:', response.statusText, errorData);
          } catch (jsonError) {
            const responseText = await response.text();
            console.error('❌ JSON Parse Error in grantPermission - Server returned HTML:', {
              status: response.status,
              statusText: response.statusText,
              responseText: responseText.substring(0, 500) + '...'
            });
          }
        }
      } catch (error) {
        console.error('Error granting permission:', error);
      }
    },
    
    async revokePermission(account) {
      if (!confirm('Revoke access for @' + account + '?')) return;
      
      try {
        const response = await fetch('https://data.dlux.io/api/collaboration/permissions/' + this.selectedDoc.owner + '/' + this.selectedDoc.permlink + '/' + account, {
          method: 'DELETE',
          headers: this.authHeaders
        });
        
        if (response.ok) {
          await this.loadPermissions();
          // ✅ REACTIVITY FIX: Refresh documents list to reflect permission changes
          await this.loadDocuments();
        } else {
          console.error('Failed to revoke permission:', response.statusText);
        }
      } catch (error) {
        console.error('Error revoking permission:', error);
      }
    },
    
    // ✅ PROPER SOLUTION: Get permissions for any document (not just selectedDoc)
    getPermissionsForDocument(doc) {
      if (!doc) {
        console.log('🔍 MODAL DEBUG: No doc provided');
        return [];
      }
      
      console.log('🔍 MODAL DEBUG: Getting permissions', {
        shareDoc: doc.permlink,
        shareDocPath: doc.documentPath,
        selectedDoc: this.selectedDoc?.permlink,
        selectedDocPath: this.selectedDoc?.documentPath,
        permissionsCount: this.permissions?.length || 0,
        permissions: this.permissions?.map(p => `${p.account}:${p.permission_type}`) || []
      });
      
      // If this is the currently selected document, return its permissions
      if (this.selectedDoc && doc.documentPath === this.selectedDoc.documentPath) {
        console.log('✅ MODAL DEBUG: Returning permissions for selected doc');
        return this.permissions || [];
      }
      
      // For other documents, we need to fetch permissions on demand
      console.log('❌ MODAL DEBUG: No permissions - document not selected');
      return [];
    },
    
    openShareModal(doc) {
      this.shareDoc = doc;
      this.shareUsername = '';
      this.sharePermission = 'readonly';
      
      // ✅ PROPER SOLUTION: Select the document to load its permissions
      // This ensures the modal shows current permissions via getPermissionsForDocument()
      if (doc) {
        this.selectedDoc = doc;
        this.loadPermissions();
      }
      
      // Clean up any existing modal backdrops before opening
      this.$nextTick(() => {
        const existingBackdrops = document.querySelectorAll('.modal-backdrop');
        existingBackdrops.forEach(backdrop => backdrop.remove());
      });
    },
    
    async shareWithUser() {
      if (!this.shareUsername.trim() || !this.shareDoc) return;
      
      try {
        const requestBody = {
          targetAccount: this.shareUsername.trim(),
          permissionType: this.sharePermission
        };
        
        console.log('📋 FULL DEBUG: Making share permission API call', {
          url: `https://data.dlux.io/api/collaboration/permissions/${this.shareDoc.owner}/${this.shareDoc.permlink}`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...this.authHeaders
          },
          body: requestBody
        });
        
        const response = await fetch('https://data.dlux.io/api/collaboration/permissions/' + this.shareDoc.owner + '/' + this.shareDoc.permlink, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...this.authHeaders
          },
          body: JSON.stringify(requestBody)
        });
        
        console.log('📋 FULL DEBUG: Share permission API response received', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries())
        });
        
        if (response.ok) {
          const username = this.shareUsername.trim();
          
          // Get the raw response text to see what we're actually getting
          const responseText = await response.text();
          console.log('📋 FULL DEBUG: Share permission success response text (first 1000 chars):', responseText.substring(0, 1000));
          
          // Try to parse as JSON if there's content
          let responseData = null;
          if (responseText.trim()) {
            try {
              responseData = JSON.parse(responseText);
              console.log('📋 FULL DEBUG: Share permission parsed JSON:', responseData);
            } catch (jsonError) {
              console.error('❌ FULL DEBUG: Share permission JSON parse error:', {
                error: jsonError.message,
                responseText: responseText.substring(0, 500)
              });
            }
          }
          
          // Close modal properly
          const modalElement = document.getElementById('shareModal');
          const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
          modal.hide();
          
          // Reset form and cleanup after modal closes
          modalElement.addEventListener('hidden.bs.modal', () => {
            this.shareUsername = '';
            this.sharePermission = 'readonly';
            this.shareDoc = null;
            
            // Clean up any lingering backdrops
            setTimeout(() => {
              const backdrops = document.querySelectorAll('.modal-backdrop');
              backdrops.forEach(backdrop => backdrop.remove());
              document.body.classList.remove('modal-open');
              document.body.style.overflow = '';
              document.body.style.paddingRight = '';
            }, 100);
          }, { once: true });
          
          // ✅ PROPER SOLUTION: Single source of truth - just refresh the selected document's permissions
          console.log('🔄 SHARE MODAL: Refreshing permissions after granting access', {
            username: username,
            permission: this.sharePermission,
            documentPath: this.selectedDoc?.documentPath,
            shareDocPath: this.shareDoc?.documentPath,
            documentsMatch: this.selectedDoc?.documentPath === this.shareDoc?.documentPath
          });
          
          // Since shareDoc === selectedDoc, this updates both modal and main panel
          await this.loadPermissions();
          
          console.log('✅ SHARE MODAL: Permissions loaded after grant', {
            count: this.permissions?.length || 0,
            permissions: this.permissions?.map(p => `${p.account}:${p.permission_type}`) || []
          });
          
          // ✅ REACTIVITY FIX: Always refresh documents list to show newly accessible documents
          await this.loadDocuments();
          
          alert('Access granted! @' + username + ' can now find this document in their Collaborative Documents section.');
        } else {
          try {
            const errorData = await response.json();
            console.error('Failed to share document:', response.statusText, errorData);
            alert('Failed to grant access. ' + (errorData?.error || 'Please try again.'));
          } catch (jsonError) {
            const responseText = await response.text();
            console.error('❌ JSON Parse Error in shareWithUser - Server returned HTML:', {
              status: response.status,
              statusText: response.statusText,
              responseText: responseText.substring(0, 500) + '...'
            });
            alert('Failed to grant access - server error. Please try again.');
          }
        }
      } catch (error) {
        console.error('Error sharing document:', error);
        alert('Error sharing document. Please try again.');
      }
    },
    
    async openCollaborativeEditor() {
      if (this.selectedDoc) {
        // Load document content first
        await this.loadDocumentContent();
        
        this.$emit('open-collaborative-doc', this.selectedDoc.documentPath);
        
        // Also emit current permission info
        this.$emit('permission-change', {
          canPost: this.canUserPost(),
          permission: this.getCurrentUserPermission(),
          documentPath: this.selectedDoc.documentPath
        });
      }
    },
    
    async loadDocumentContent() {
      if (!this.selectedDoc) return;
      
      try {
        console.log('📖 Loading document content for:', this.selectedDoc.documentPath);
        
        // ✅ TIPTAP BEST PRACTICE: Do NOT emit content for existing collaborative documents
        // The Y.js Collaboration extension will automatically load content from the shared document
        // Any initial content would interfere with the proper Y.js sync process
        
        console.log('📋 ✅ TipTap Best Practice: Skipping content emission for existing collaborative document');
        console.log('📋 Content will be loaded automatically from Y.js document via Collaboration extension');
        
        // ✅ METADATA ONLY: Only emit metadata, no content
        const metadataOnly = {
          // No title - will be loaded from Y.js document
          // No body - will be loaded from Y.js document  
          tags: ['dlux', 'collaboration'],
          custom_json: {
            app: 'dlux/0.1.0',
            dappCID: '',
            assets: [],
            contracts: [],
            images: [],
            authors: [this.selectedDoc.owner],
            tags: ['dlux', 'collaboration']
          }
        };
        
        // Emit metadata only - no content that would interfere with Y.js loading
        this.$emit('load-document-content', metadataOnly);
        
      } catch (error) {
        console.error('Failed to load document content:', error);
        
        // ✅ TIPTAP BEST PRACTICE: Even for errors, don't emit content for collaborative documents
        const metadataOnlyFallback = {
          // No title or body - Y.js will handle content loading
          tags: ['dlux', 'collaboration'],
          custom_json: {
            app: 'dlux/0.1.0',
            tags: ['dlux', 'collaboration']
          }
        };
        this.$emit('load-document-content', metadataOnlyFallback);
      }
    },
    
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    },
    
    getCurrentUserPermission() {
      if (!this.selectedDoc || !this.permissions || !this.account) {
        return null;
      }
      
      // If user is the owner, they have full permissions
      if (this.selectedDoc.owner === this.account) {
        return 'postable';
      }
      
      // Find user's permission in the permissions list
      const userPermission = this.permissions.find(perm => perm.account === this.account);
      return userPermission ? userPermission.permission_type : null;
    },
    
    canUserPost() {
      const permission = this.getCurrentUserPermission();
      return permission === 'postable';
    },
    
    isDocumentExpiringSoon(doc) {
      return this.getDaysUntilCleanup(doc) <= 7;
    },
    
    getDaysUntilCleanup(doc) {
      const lastActivity = new Date(doc.updatedAt);
      const now = new Date();
      const daysSinceActivity = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));
      const daysLeft = 30 - daysSinceActivity;
      return Math.max(0, daysLeft);
    }
  },
  
  computed: {
    sortedDocuments() {
      return [...this.documents].sort((a, b) => {
        const aDaysLeft = this.getDaysUntilCleanup(a);
        const bDaysLeft = this.getDaysUntilCleanup(b);
        
        // Documents expiring soon (≤7 days) come first
        const aExpiring = aDaysLeft <= 7;
        const bExpiring = bDaysLeft <= 7;
        
        if (aExpiring && !bExpiring) return -1;
        if (!aExpiring && bExpiring) return 1;
        
        // Among expiring documents, sort by days left (ascending)
        if (aExpiring && bExpiring) return aDaysLeft - bDaysLeft;
        
        // Among non-expiring documents, sort by last updated (descending)
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      });
    }
  },
  
  watch: {
    account() {
      // Reset state when account changes
      this.documents = [];
      this.selectedDoc = null;
      this.shareDoc = null;
      this.authenticating = false;
      this.loading = false;
    },
    authHeaders(newHeaders) {
      // When auth headers become available, load documents
      if (newHeaders && newHeaders['x-account']) {
        console.log('Auth headers received, loading documents...');
        this.authenticating = false;
        this.loadDocuments();
      }
    }
  },
  
  mounted() {
    // Don't automatically load documents - wait for user to click "Access Documents"
    console.log('Collaborative docs component mounted');
  }
}; 