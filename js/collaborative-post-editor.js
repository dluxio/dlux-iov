import TiptapEditor from "/js/tiptap-editor.js";
import SimpleFieldEditor from "/js/simple-field-editor.js";
import JsonEditor from "/js/json-editor.js";
import Tagify from "/js/tagifyvue.js";
import Bennies from "/js/bennies.js";
import commonMethods from "/js/methods-common.js";

export default {
  name: "CollaborativePostEditor",
  template: `
    <div class="collaborative-post-editor">
      <div v-if="showCollaboration" class="alert alert-info d-flex align-items-center mb-3">
        <i class="fas fa-users me-2"></i>
        <span>Collaborative editing enabled for: <strong>{{ collaborativeDoc }}</strong></span>
        <span v-if="connectionStatus" class="badge ms-auto" :class="connectionStatusClass">
          {{ connectionStatus }}
        </span>
      </div>

      <form onsubmit="return false;">
        <!-- Title Field -->
        <div class="form-group mb-3">
          <label class="mb-1">Post Title</label>
          <simple-field-editor 
            :insert="postTitle" 
            placeholder="Enter an attention grabbing title"
            :show-collaboration="showCollaboration"
            :collaboration-provider="collaborationProvider"
            :collaboration-ydoc="collaborationYdoc"
            :collaboration-config="collaborationConfigWithDoc"
            collaboration-field="title"
            @data="updateTitle"/>
          <small class="form-text text-muted d-flex">
            <span class="ms-auto">
              Permlink: https://dlux.io/{{postCustom_json.dappCID ? 'dlux' : postTags.length ? postTags[0] : 'blog'}}/@{{account}}/{{postPermlink}}
            </span>
          </small>
        </div>

        <!-- Body Field -->
        <div class="form-group mb-3">
          <label class="mb-1">Post Body</label>
          <tiptap-editor 
            :insert="postBody" 
            placeholder="Write your post content..."
            :show-collaboration="showCollaboration"
            :collaboration-provider="collaborationProvider"
            :collaboration-ydoc="collaborationYdoc"
            :collaboration-config="collaborationConfigWithDoc"
            collaboration-field="body"
            @data="updateBody"
            @addContract="addContract"
            @addImage="addImage"
            @addAsset="addAsset"/>
        </div>

        <!-- Tags Field -->
        <div class="form-group mb-3">
          <label class="mb-1">Tags</label>
          <tagify
            :tags="postCustom_json.tags || []"
            :duplicates="false"
            :readonly="false"
            max="10"
            placeholder="Add tags..."
            @data="updateTags"/>
        </div>

        <!-- Beneficiaries -->
        <div class="mb-2">
          <label class="mb-1">Beneficiaries</label>
          <bennies :list="postBens" @updatebennies="updateBeneficiaries" />
        </div>

        <!-- Custom JSON Editor -->
        <div class="form-group mb-3">
          <json-editor
            :insert="postCustom_json"
            label="Custom JSON"
            placeholder='{\n  "app": "dlux/0.1",\n  "vrHash": "",\n  "assets": [],\n  "tags": []\n}'
            min-height="120px"
            @data="updateCustomJson"/>
        </div>

        <!-- Publish Button -->
        <div class="d-flex align-items-center flex-wrap bg-dark rounded mt-3 p-3">
          <p class="mb-0 lead">Collaborative post ready to publish</p>
          <div class="ms-auto d-flex gap-2">
            <button v-if="showCollaboration" 
                    type="button" 
                    class="btn btn-secondary" 
                    @click="saveCollaborativeDocument">
              <i class="fa-solid fa-fw fa-save me-2"></i>
              Save Draft
            </button>
            <button 
              type="button" 
              class="btn btn-primary" 
              :disabled="!validPost || !canPost"
              @click="publishPost">
              <i class="fa-solid fa-fw fa-flag-checkered me-2"></i>
              {{ canPost ? 'Publish' : 'No Permission' }}
            </button>
          </div>
        </div>
      </form>
    </div>
  `,
  props: {
    account: {
      type: String,
      required: true
    },
    showCollaboration: {
      type: Boolean,
      default: false
    },
    collaborativeDoc: {
      type: String,
      default: ""
    },
    collaborationConfig: {
      type: Object,
      default: () => ({})
    },
    canPost: {
      type: Boolean,
      default: true
    },
    initialData: {
      type: Object,
      default: () => ({})
    },
    authHeaders: {
        type: Object,
        required: false,
        default: () => ({})
      }
  },
  emits: ['publishPost', 'dataChanged'],
  data() {
    return {
      postTitle: "",
      postBody: "",
      postTags: "",
      postPermlink: "",
      postBens: [],
      postCustom_json: {
        "app": "dlux/0.1",
        "dappCID": "",
        "assets": [],
        "contracts": [],
        "images": [],
        tags: []
      },
      connectionStatus: null,
      collaborationProvider: null,
      collaborationYdoc: null,
      recoveryInProgress: false,
      recoveryAttempts: 0
    };
  },
  computed: {
    validPost() {
      return !!(this.postTitle && this.postBody && this.postPermlink);
    },
    connectionStatusClass() {
      switch (this.connectionStatus) {
        case 'Connected': return 'bg-success';
        case 'Connecting': return 'bg-warning';
        case 'Disconnected': return 'bg-danger';
        default: return 'bg-secondary';
      }
    },
    collaborationConfigWithDoc() {
      return {
        ...this.collaborationConfig,
        documentName: this.collaborativeDoc ? this.collaborativeDoc.split('/')[1] : 'Document'
      };
    }
  },
  methods: {
    ...commonMethods, // Include common methods for collaboration utilities
    
    updateTitle(newTitle) {
      this.postTitle = newTitle;
      this.generatePermlink();
      this.trackCollaborativeEdit('title', newTitle);
      this.emitDataChange();
    },
    
    updateBody(newBody) {
      this.postBody = newBody;
      this.trackCollaborativeEdit('body', newBody);
      this.emitDataChange();
    },
    
    updateTags(newTags) {
      this.postTags = newTags.join(' ');
      // Update custom JSON tags array
      this.postCustom_json = {
        ...this.postCustom_json,
        tags: newTags
      };
      this.trackCollaborativeEdit('tags', newTags.join(' '));
      this.emitDataChange();
    },
    
    updateCustomJson(newJson) {
      this.postCustom_json = { ...this.postCustom_json, ...newJson };
      
      // Sync tags if they were updated in the JSON
      if (newJson.tags && Array.isArray(newJson.tags)) {
        this.postTags = newJson.tags.join(' ');
      }
      
      this.trackCollaborativeEdit('custom_json', JSON.stringify(newJson));
      this.emitDataChange();
    },
    
    updateBeneficiaries(newBens) {
      this.postBens = newBens;
      this.trackCollaborativeEdit('beneficiaries', JSON.stringify(newBens));
      this.emitDataChange();
    },
    
    generatePermlink() {
      if (this.postTitle) {
        let text = this.postTitle;
        text = text.replace(/\s+/g, '-');
        text = text.replace(/[^\w\-]/g, '');
        text = text.toLowerCase();
        this.postPermlink = text;
      }
    },
    
    addContract(contractId) {
      if (!this.postCustom_json.contracts.includes(contractId)) {
        this.postCustom_json.contracts.push(contractId);
        this.emitDataChange();
        console.log('Contract added:', contractId);
      }
    },
    
    addImage(imageData) {
      const existingImage = this.postCustom_json.images.find(img => img.cid === imageData.cid);
      if (!existingImage) {
        this.postCustom_json.images.push({
          cid: imageData.cid,
          alt: imageData.alt,
          url: imageData.url
        });
        this.emitDataChange();
        console.log('Image added:', imageData);
      }
    },
    
    addAsset(assetId) {
      if (!this.postCustom_json.assets.includes(assetId)) {
        this.postCustom_json.assets.push(assetId);
        this.emitDataChange();
        console.log('Asset added:', assetId);
      }
    },
    
    addAuthor(username) {
      if (!this.postCustom_json.authors) {
        this.postCustom_json.authors = [];
      }
      if (!this.postCustom_json.authors.includes(username)) {
        this.postCustom_json.authors.push(username);
        this.emitDataChange();
        console.log('Author added:', username);
      }
    },
    
    cleanCustomJson() {
      // Remove unwanted properties that shouldn't be in the final post
      const cleanedJson = { ...this.postCustom_json };
      delete cleanedJson.collaborative;
      delete cleanedJson.document_path;
      
      // Add type detection based on content
      cleanedJson.type = this.detectPostType();
      
      // Add format
      cleanedJson.format = "markdown+html";
      
      // Extract images from body and add to image array if they exist
      const bodyImages = this.extractImagesFromBody();
      if (bodyImages.length > 0) {
        cleanedJson.image = bodyImages;
        cleanedJson.thumbnails = [bodyImages[0]]; // First image as thumbnail
      }
      
      // Add description if not present (truncated body)
      if (!cleanedJson.description) {
        cleanedJson.description = this.generateDescription();
      }
      
      return cleanedJson;
    },
    
    detectPostType() {
      // Priority: dapp > video > blog
      if (this.postCustom_json.dappCID && this.postCustom_json.dappCID.trim()) {
        return "dapp";
      }
      
      if (this.postBody && this.postBody.includes('<video')) {
        return "video";
      }
      
      return "blog";
    },
    
    extractImagesFromBody() {
      if (!this.postBody) return [];
      
      const images = [];
      
      // Extract markdown images: ![alt](url)
      const markdownImageRegex = /!\[.*?\]\((https?:\/\/[^\s\)]+)\)/g;
      let match;
      while ((match = markdownImageRegex.exec(this.postBody)) !== null) {
        if (!images.includes(match[1])) {
          images.push(match[1]);
        }
      }
      
      // Extract HTML images: <img src="url">
      const htmlImageRegex = /<img[^>]+src="([^"]+)"/g;
      while ((match = htmlImageRegex.exec(this.postBody)) !== null) {
        if (!images.includes(match[1])) {
          images.push(match[1]);
        }
      }
      
      // Add images from custom JSON images array (IPFS images)
      if (this.postCustom_json.images) {
        this.postCustom_json.images.forEach(img => {
          if (img.url && !images.includes(img.url)) {
            images.push(img.url);
          }
        });
      }
      
      return images;
    },
    
    generateDescription() {
      if (!this.postBody) return this.postTitle || "A collaborative post";
      
      // Strip markdown and HTML, then truncate
      const plainText = this.postBody
        .replace(/!\[.*?\]\([^\)]+\)/g, '') // Remove images
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Keep link text only
        .replace(/<[^>]+>/g, '') // Remove HTML tags
        .replace(/[#*_~`]/g, '') // Remove markdown formatting
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim();
      
      return plainText.length > 160 ? plainText.substring(0, 157) + '...' : plainText;
    },
    
    // Enhanced collaboration tracking
    trackCollaborativeEdit(field, content) {
      if (this.collaborationProvider && this.showCollaboration) {
        // Only log edit activity locally since API endpoint doesn't exist yet
        console.log(`📝 Edit activity tracked for field ${field}:`, content ? content.length + ' chars' : 'empty');
      }
    },
    
    async sendEditActivity(field, content) {
      // Temporarily disabled - API endpoint not implemented yet
      console.log(`📝 Edit activity: ${field} (${content ? content.length + ' chars' : 'empty'})`);
      return;
      
      // This code will be re-enabled when the backend API is implemented
      /*
      if (!this.collaborativeDoc || !this.collaborationConfig.authToken) return;
      
      try {
        const response = await fetch('https://data.dlux.io/api/collaboration/activity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.collaborationConfig.authToken}`,
            'x-account': this.account,
            'x-timestamp': Date.now().toString(),
            'x-signature': this.collaborationConfig.signature || ''
          },
          body: JSON.stringify({
            documentPath: this.collaborativeDoc,
            field: field,
            activity_type: 'edited',
            content_length: content ? content.length : 0,
            timestamp: new Date().toISOString()
          })
        });
        
        if (response.ok) {
          console.log('📝 Edit activity tracked for field:', field);
        } else {
          console.warn('Failed to track edit activity:', response.statusText);
        }
      } catch (error) {
        console.error('Error tracking edit activity:', error);
      }
      */
    },
    
    emitDataChange() {
      const postData = {
        title: this.postTitle,
        body: this.postBody,
        tags: this.postTags,
        permlink: this.postPermlink,
        beneficiaries: this.postBens,
        custom_json: this.cleanCustomJson()
      };
      this.$emit('dataChanged', postData);
    },
    
    publishPost() {
      if (this.validPost && this.canPost) {
        const postData = {
          title: this.postTitle,
          body: this.postBody,
          tags: this.postCustom_json.tags,
          permlink: this.postPermlink,
          beneficiaries: this.postBens,
          custom_json: this.cleanCustomJson()
        };
        this.$emit('publishPost', postData);
      }
    },
    
    loadInitialData() {
      if (this.initialData.title) this.postTitle = this.initialData.title;
      if (this.initialData.body) this.postBody = this.initialData.body;
      if (this.initialData.tags) this.postTags = this.initialData.tags;
      if (this.initialData.beneficiaries) this.postBens = this.initialData.beneficiaries;
      if (this.initialData.custom_json) this.postCustom_json = { ...this.postCustom_json, ...this.initialData.custom_json };
      if (this.initialData.permlink) this.postPermlink = this.initialData.permlink;
      
      // Ensure tags are synced between string and array
      if (typeof this.postTags === 'string' && this.postTags) {
        const tagsArray = this.postTags.split(' ').filter(tag => tag.trim());
        this.postCustom_json.tags = tagsArray;
      } else if (this.postCustom_json.tags && Array.isArray(this.postCustom_json.tags)) {
        this.postTags = this.postCustom_json.tags.join(' ');
      }
    },
    
    async setupCollaboration() {
      
      
      if (!this.showCollaboration || !this.collaborativeDoc || !this.authHeaders['x-signature']) {
        console.log('Collaboration setup skipped:', {
          showCollaboration: this.showCollaboration,
          collaborativeDoc: this.collaborativeDoc,
          sec: this.authHeaders
        });
        return;
      }

      console.log('Setting up centralized collaboration for document:', this.collaborativeDoc);

      try {
        // Validate collaboration setup using common methods
        const validation = this.validateCollaborationSetup();
        console.log('🔍 Collaboration setup validation:', validation);
        
        if (!validation.isReady) {
          throw new Error(`Collaboration dependencies not ready: YJS=${validation.hasYjs}, Provider=${validation.hasProvider}, Bundle=${validation.hasBundle}`);
        }
        
        // Get provider constructor
        const HocuspocusProvider = this.getCollaborationProvider();
        console.log('🔍 HocuspocusProvider available:', !!HocuspocusProvider);
        if (!HocuspocusProvider) {
          throw new Error('HocuspocusProvider not available - check that collaboration bundle is loaded');
        }
        
        // Create a single Y.js document using common method
        // This document will be shared by all editor components
        this.collaborationYdoc = this.createCollaborationYDoc();
        
        if (!this.collaborationYdoc) {
          throw new Error('Failed to create Y.js document');
        }
        
        // Setup WebSocket URL with actual owner and permlink
        const [owner, permlink] = this.collaborativeDoc.split('/');
        const websocketUrl = `wss://data.dlux.io/collaboration/${owner}/${permlink}`;
        
        console.log('🔗 Connecting to WebSocket URL:', websocketUrl);
        console.log('📄 Document:', this.collaborativeDoc);
        console.log('🔑 Auth headers available:', this.authHeaders);
        console.log('🔍 Auth headers type and values:', {
          type: typeof this.authHeaders,
          keys: Object.keys(this.authHeaders || {}),
          values: Object.values(this.authHeaders || {}),
          rawObject: this.authHeaders
        });
        
        // Add global error handler for uncaught Y.js/HocuspocusProvider errors
        this.originalErrorHandler = window.onerror;
        this.recoveryInProgress = false;
        this.recoveryAttempts = 0;
        const maxRecoveryAttempts = 3;
        
        window.onerror = (message, source, lineno, colno, error) => {
          if (typeof message === 'string' && (
            message.includes('Unexpected end of array') || 
            message.includes('Applying a mismatched transaction')
          )) {
            console.warn('🔧 Caught collaboration error - suppressing:', message);
            
            // Prevent infinite recovery loops
            if (this.recoveryInProgress || this.recoveryAttempts >= maxRecoveryAttempts) {
              console.warn('⚠️ Recovery already in progress or max attempts reached, ignoring error');
              return true;
            }
            
            this.recoveryInProgress = true;
            this.recoveryAttempts++;
            
            console.log(`🔄 Attempting recovery ${this.recoveryAttempts}/${maxRecoveryAttempts}...`);
            
            // Schedule recovery with increasing delay
            setTimeout(() => {
              this.performCollaborationRecovery()
                .finally(() => {
                  this.recoveryInProgress = false;
                });
            }, 1000 * this.recoveryAttempts);
            
            return true; // Prevent default error handling
          }
          
          // Call original error handler for other errors
          if (this.originalErrorHandler) {
            return this.originalErrorHandler(message, source, lineno, colno, error);
          }
          
          return false;
        };

        // Prepare Hive authentication headers for the new API
        // const authHeaders = {
        //   'x-account': this.collaborationConfig.account || this.account,
        //   'x-challenge': this.collaborationConfig.challenge || Math.floor(Date.now() / 1000).toString(),
        //   'x-pubkey': this.collaborationConfig.pubkey || '',
        //   'x-signature': this.collaborationConfig.signature || ''
        // };

        // This Should work with the backend auth function
        const authParams = {
            'account': this.authHeaders['x-account'],
            'challenge': this.authHeaders['x-challenge'],
            'pubkey': this.authHeaders['x-pubkey'] ,
            'signature': this.authHeaders['x-signature']
          };
        
        console.log('🔐 Authentication headers prepared:', Object.keys(authParams));
        
        // IMPORTANT: The new DLUX Collaboration API requires custom authentication
        // The standard HocuspocusProvider may not support the Hive auth headers format
        // According to the API docs, we need a custom DLUXProvider implementation
        // For now, attempting connection with existing provider...
        
        console.log('🔨 Creating HocuspocusProvider with config...');
        try {
          this.collaborationProvider = new HocuspocusProvider({
          url: websocketUrl,
          name: this.collaborativeDoc,
          document: this.collaborationYdoc,
          // Try passing auth headers through different methods
          token: JSON.stringify(authParams), // Fallback: encode headers as token
          //parameters: authHeaders, // Primary: try as parameters
          // Add connection parameters to prevent binary data issues
          forceSyncInterval: 3000, // Increase sync interval to reduce errors
          maxAttempts: 3, // Reduce reconnection attempts to prevent error loops
          delay: 2000, // Increase delay between reconnection attempts
          onConnect: () => {
            this.connectionStatus = 'Connected';
            console.log('✅ Connected to collaboration server for:', this.collaborativeDoc);
            
            // Reset recovery state on successful connection
            this.recoveryAttempts = 0;
            this.recoveryInProgress = false;
            
            // Send initial activity when connected
            this.sendEditActivity('connection', 'connected');
          },
          onDisconnect: ({ event }) => {
            this.connectionStatus = 'Disconnected';
            console.log('❌ Disconnected from collaboration server:', event?.code, event?.reason);
            console.log('🔍 Disconnect event details:', event);
          },
          onAuthenticationFailed: ({ reason }) => {
            this.connectionStatus = 'Auth Failed';
            console.error('🔐 Authentication failed for collaboration:', reason);
          },
          onAwarenessUpdate: ({ states }) => {
            try {
              // Track users who are currently connected
              const connectedUsers = Array.from(states.values())
                .filter(state => state.user && state.user.name)
                .map(state => state.user.name);
              
              // Add any new users to authors array
              connectedUsers.forEach(username => {
                if (username !== this.account) {
                  this.addAuthor(username);
                }
              });
              
              console.log('👥 Connected users updated:', connectedUsers.length);
            } catch (error) {
              console.warn('Error processing awareness update:', error);
            }
          },
          onSynced: ({ synced }) => {
            console.log('📡 Document synced with server:', synced);
            if (synced) {
              this.connectionStatus = 'Synced';
            }
          },
          onMessage: (message) => {
            console.log('📨 Collaboration message received:', message);
          },
          onClose: (event) => {
            console.log('🔌 WebSocket closed:', event.code, event.reason);
            this.connectionStatus = 'Disconnected';
          },
          onError: (error) => {
            console.error('❌ WebSocket error:', error);
            this.connectionStatus = 'Error';
            
            // Don't attempt immediate recovery here - let the global error handler deal with it
            // This prevents multiple recovery attempts running simultaneously
          },
          // Add timeout settings
          timeout: 15000,
          // Handle connection failures gracefully
          onStatus: ({ status }) => {
            console.log('📊 Connection status changed:', status);
            this.connectionStatus = status;
          }
                  });

          console.log('✅ HocuspocusProvider created successfully');
        } catch (providerError) {
          console.error('❌ Failed to create HocuspocusProvider:', providerError);
          this.connectionStatus = 'Error';
          throw providerError;
        }

        this.connectionStatus = 'Connecting';
        console.log('🚀 Collaboration provider created and connecting...');
        console.log('📄 Y.Doc created and will be shared with all editors:', this.collaborationYdoc);
        console.log('🌐 Provider configuration:', {
          url: websocketUrl,
          name: this.collaborativeDoc,
          authHeadersLength: JSON.stringify(authParams).length
        });
        
        // Add current user as author when provider is ready
        setTimeout(() => {
          if (this.collaborationProvider && this.collaborationYdoc) {
            this.addAuthor(this.account);
          }
        }, 500); // Increased delay to ensure connection is stable

      } catch (error) {
        console.error('Failed to setup collaboration:', error);
        this.connectionStatus = 'Error';
      }
    },
    
    async saveCollaborativeDocument() {
      if (!this.collaborationProvider || !this.collaborationProvider.document) {
        console.warn('Cannot save: No collaboration provider or document');
        return;
      }

      try {
        // Force sync the Y.js document
        if (this.collaborationProvider && this.collaborationProvider.document) {
          // Get current document state
          const documentState = {
            title: this.postTitle,
            body: this.postBody,
            tags: this.postTags,
            permlink: this.postPermlink,
            beneficiaries: this.postBens,
            custom_json: this.postCustom_json,
            lastModified: new Date().toISOString(),
            modifiedBy: this.account
          };

          // Log save attempt locally - API endpoint not implemented yet
          console.log('💾 Document manually saved locally:', {
            documentPath: this.collaborativeDoc,
            documentState: documentState,
            activity_type: 'manual_save',
            timestamp: new Date().toISOString()
          });
          
          // Track the save activity
          this.sendEditActivity('manual_save', 'document saved');
          
          // TODO: Implement using new Hive Collaboration API when needed
          /*
          // Send save request to backend using new API format
          const [owner, permlink] = this.collaborativeDoc.split('/');
          const response = await fetch(`https://data.dlux.io/api/collaboration/documents/${owner}/${permlink}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'x-account': this.collaborationConfig.account || this.account,
              'x-challenge': this.collaborationConfig.challenge || Math.floor(Date.now() / 1000).toString(),
              'x-pubkey': this.collaborationConfig.pubkey || '',
              'x-signature': this.collaborationConfig.signature || ''
            },
            body: JSON.stringify({
              documentState: documentState,
              activity_type: 'manual_save',
              timestamp: new Date().toISOString()
            })
          });

          if (response.ok) {
            console.log('💾 Document manually saved to backend');
            this.sendEditActivity('manual_save', 'document saved');
          } else {
            console.warn('Failed to save document:', response.statusText);
          }
          */
        }
      } catch (error) {
        console.error('Error saving collaborative document:', error);
      }
    },
    
    async performCollaborationRecovery() {
      console.log('🔄 Starting collaboration recovery process...');
      
      try {
        // Store current content before recovery
        const currentTitle = this.postTitle;
        const currentBody = this.postBody;
        
        // Disconnect existing provider cleanly
        if (this.collaborationProvider) {
          console.log('🔌 Disconnecting existing provider...');
          this.collaborationProvider.disconnect();
          this.collaborationProvider = null;
        }
        
        // Clear the Y.js document
        this.collaborationYdoc = null;
        
        // Wait a moment for cleanup
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Reset connection status
        this.connectionStatus = 'Recovering';
        
        // Re-setup collaboration from scratch
        console.log('🔧 Re-initializing collaboration...');
        await this.setupCollaboration();
        
        // Restore content if it was lost during recovery
        setTimeout(() => {
          if (currentTitle && !this.postTitle) {
            console.log('📝 Restoring title after recovery');
            this.postTitle = currentTitle;
            this.generatePermlink();
          }
          if (currentBody && !this.postBody) {
            console.log('📝 Restoring body after recovery');
            this.postBody = currentBody;
          }
        }, 1000);
        
        console.log('✅ Collaboration recovery completed');
        
      } catch (error) {
        console.error('❌ Recovery failed:', error);
        this.connectionStatus = 'Recovery Failed';
        
        // If recovery fails completely, disable collaboration for this session
        if (this.recoveryAttempts >= 3) {
          console.warn('🚫 Max recovery attempts reached - disabling collaboration for this session');
          this.disconnectCollaboration();
        }
      }
    },
    
    disconnectCollaboration() {
      if (this.collaborationProvider) {
        this.collaborationProvider.disconnect();
        this.collaborationProvider = null;
        this.connectionStatus = 'Disconnected';
        console.log('🔌 Collaboration disconnected');
      }
      
      // Reset recovery state
      this.recoveryInProgress = false;
      this.recoveryAttempts = 0;
      
      // Restore original error handler if we set a custom one
      if (this.originalErrorHandler !== undefined) {
        window.onerror = this.originalErrorHandler;
        this.originalErrorHandler = undefined;
      }
    }
  },
  components: {
    "tiptap-editor": TiptapEditor,
    "simple-field-editor": SimpleFieldEditor,
    "json-editor": JsonEditor,
    "tagify": Tagify,
    "bennies": Bennies
  },
  watch: {
    showCollaboration: {
      handler(newValue) {
        console.log('👀 showCollaboration watcher triggered:', {
          newValue,
          collaborativeDoc: this.collaborativeDoc,
          willSetupCollaboration: newValue && this.collaborativeDoc
        });
        
        if (newValue && this.collaborativeDoc) {
          // Setup collaboration when enabled
          setTimeout(() => {
            this.setupCollaboration();
          }, 100);
        } else if (!newValue) {
          // Disconnect when disabled
          this.disconnectCollaboration();
        }
      },
      immediate: true
    },
    
    collaborativeDoc: {
      handler(newValue) {
        console.log('👀 collaborativeDoc watcher triggered:', {
          newValue,
          showCollaboration: this.showCollaboration,
          willReconnect: newValue && this.showCollaboration
        });
        
        if (newValue && this.showCollaboration) {
          // Reconnect to new document
          this.disconnectCollaboration();
          setTimeout(() => {
            this.setupCollaboration();
          }, 100);
        }
      }
    },
    
    initialData: {
      handler() {
        this.loadInitialData();
      },
      immediate: true,
      deep: true
    }
  },
  
  mounted() {
    this.loadInitialData();
    console.log('🔧 Component mounted with props:', {
      authHeaders: this.authHeaders,
      collaborationConfig: this.collaborationConfig,
      showCollaboration: this.showCollaboration,
      collaborativeDoc: this.collaborativeDoc
    });
  },
  
  beforeUnmount() {
    this.disconnectCollaboration();
  }
}; 