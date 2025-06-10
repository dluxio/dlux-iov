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
      recoveryAttempts: 0,
      autoSaveTimeout: null
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
        documentName: this.collaborativeDoc ? this.collaborativeDoc.split('/')[1] : 'Document',
        username: this.account // Pass the current user's account name
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
        console.log(`📝 Edit activity tracked for field ${field}:`, content ? content.length + ' chars' : 'empty');
        
        // Auto-save after each edit (debounced to prevent too many saves)
        if (this.autoSaveTimeout) {
          clearTimeout(this.autoSaveTimeout);
        }
        
        this.autoSaveTimeout = setTimeout(() => {
          this.autoSaveDocument();
        }, 3000); // Save 3 seconds after last edit
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
        const response = await fetch('https://data.dlux.io/collaboration/activity', {
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
        const baseWebsocketUrl = `wss://data.dlux.io/collaboration/${owner}/${permlink}`;
        const websocketUrl = `${baseWebsocketUrl}?signature=${this.authHeaders['x-signature']}&account=${this.authHeaders['x-account']}&challenge=${this.authHeaders['x-challenge']}&pubkey=${this.authHeaders['x-pubkey']}`;
        
        console.log('🔗 Connecting to WebSocket URL:', websocketUrl);
        console.log('🔗 Base URL:', baseWebsocketUrl);
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
        
        console.log('🔍 Auth parameters for WebSocket:', authParams);
        
        console.log('🔐 Authentication headers prepared:', Object.keys(authParams));
        
        // IMPORTANT: The new DLUX Collaboration API requires custom authentication
        // The standard HocuspocusProvider may not support the Hive auth headers format
        // According to the API docs, we need a custom DLUXProvider implementation
        // For now, attempting connection with existing provider...
        
        console.log('🔨 Creating HocuspocusProvider with config...');
        try {
          console.log('🔧 About to create HocuspocusProvider with URL:', websocketUrl);
          this.collaborationProvider = new HocuspocusProvider({
          url: websocketUrl,
          name: this.collaborativeDoc,
          document: this.collaborationYdoc,
          // Try passing auth headers through different methods
          token: JSON.stringify(authParams), // Fallback: encode headers as token
          // Add connection parameters to prevent binary data issues
          forceSyncInterval: 3000, // Increase sync interval to reduce errors
          maxAttempts: 3, // Reduce reconnection attempts to prevent error loops
          delay: 5000, // Increase delay between reconnection attempts
          onConnect: () => {
            this.connectionStatus = 'Connected';
            console.log('✅ Connected to collaboration server for:', this.collaborativeDoc);
            
            // Reset recovery state on successful connection
            this.recoveryAttempts = 0;
            this.recoveryInProgress = false;
            
            console.log('🎯 Using official TipTap Collaboration extension - no manual Y.js access needed!');
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
              
              // DEBUG: Check what's actually in the Y.js document after sync
              setTimeout(() => {
                const yTitle = this.collaborationYdoc.getText('title');
                const yBody = this.collaborationYdoc.getText('body');
                const yTags = this.collaborationYdoc.getText('tags');
                
                console.log('🔍 Y.js document content after server sync:', {
                  title: `"${yTitle.toString()}"`,
                  body: `"${yBody.toString()}"`,
                  tags: `"${yTags.toString()}"`,
                  docClientId: this.collaborationYdoc.clientID,
                  providerConnected: this.collaborationProvider ? this.collaborationProvider.isSynced : false
                });
                
                // CRITICAL: Check if we got any content from the server
                const hasServerContent = yTitle.toString() || yBody.toString() || yTags.toString();
                if (!hasServerContent) {
                  console.error('❌ Y.js document is EMPTY after sync - no server content loaded!');
                  console.log('🔍 This means either:');
                  console.log('  1. Document doesn\'t exist on server (first time)');
                  console.log('  2. WebSocket connection failed silently');
                  console.log('  3. Provider is in local-only mode');
                  console.log('  4. Server auth failed but provider still thinks it\'s connected');
                } else {
                  console.log('✅ Server content loaded successfully:', hasServerContent);
                  // Load the server content into Vue component
                  this.loadContentFromYDoc();
                }
              }, 1000);
            }
          },
          onMessage: (message) => {
            console.log('📨 Y.js message received - official TipTap extension handles sync automatically', {
              messageType: typeof message,
              messageLength: message ? message.length || message.byteLength || 'unknown' : 0,
              isArrayBuffer: message instanceof ArrayBuffer,
              isUint8Array: message instanceof Uint8Array
            });
          },
          onClose: (event) => {
            console.log('🔌 WebSocket closed:', event.code, event.reason);
            this.connectionStatus = 'Disconnected';
          },
          onError: (error) => {
            console.error('❌ WebSocket error:', error);
            console.error('🔍 Error details:', {
              errorType: typeof error,
              errorMessage: error.message || error.toString(),
              errorCode: error.code,
              errorReason: error.reason,
              providerUrl: this.collaborationProvider ? this.collaborationProvider.url : 'unknown'
            });
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
        
                 // Provider debugging
         setTimeout(() => {
           console.log('🔍 HocuspocusProvider status:', {
             isSynced: this.collaborationProvider.isSynced,
             isAuthenticated: this.collaborationProvider.isAuthenticated,
             authorizedScope: this.collaborationProvider.authorizedScope,
             hasDocument: !!this.collaborationProvider.document,
             url: this.collaborationProvider.url
           });
         }, 2000);
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
        
        // Check connection status using proper HocuspocusProvider methods
        setTimeout(() => {
          console.log('🔍 WebSocket connection check:', {
            isSynced: this.collaborationProvider.isSynced,
            isAuthenticated: this.collaborationProvider.isAuthenticated,
            hasDocument: !!this.collaborationProvider.document,
            hasWebSocketProvider: !!this.collaborationProvider.configuration?.websocketProvider,
            websocketProviderStatus: this.collaborationProvider.configuration?.websocketProvider?.status
          });
          
          if (!this.collaborationProvider.isSynced) {
            console.warn('⚠️ Provider not yet synced - may still be connecting');
          }
        }, 1000);
        
        // Set up Y.js document change listener to sync content
        this.setupYDocChangeListener();
        
        // Check for existing content after a short delay to allow connection to stabilize
        setTimeout(() => {
          this.loadContentFromYDoc();
        }, 2000);
        
        // Add current user as author when provider is ready
        setTimeout(() => {
          if (this.collaborationProvider && this.collaborationYdoc) {
            this.addAuthor(this.account);
          }
        }, 5000); // Increased delay to ensure connection is stable

      } catch (error) {
        console.error('Failed to setup collaboration:', error);
        this.connectionStatus = 'Error';
      }
    },
    
    async autoSaveDocument() {
      if (!this.collaborationProvider || !this.collaborativeDoc) {
        return;
      }

      try {
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

                 console.log('🔄 Auto-saving document changes...');
         
         // NOTE: Content is automatically saved via Y.js document sync
         // No need for manual API calls - Y.js handles persistence
         console.log('✅ Document auto-saved via Y.js sync');
      } catch (error) {
        console.warn('⚠️ Auto-save error:', error.message);
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

          // Save document content to backend
          console.log('💾 Saving document state:', {
            documentPath: this.collaborativeDoc,
            documentState: documentState,
            activity_type: 'manual_save',
            timestamp: new Date().toISOString()
          });
          
          // Force Y.js document sync to ensure content is persisted
          try {
            if (this.collaborationProvider && this.collaborationProvider.isSynced) {
              console.log('✅ Document content synced via Y.js');
              this.sendEditActivity('manual_save', 'document saved');
              
              // Show success feedback to user
              const saveButton = document.querySelector('button[title="Save Draft"]');
              if (saveButton) {
                const originalText = saveButton.innerHTML;
                saveButton.innerHTML = '<i class="fa-solid fa-fw fa-check me-2"></i>Saved!';
                saveButton.classList.add('btn-success');
                saveButton.classList.remove('btn-secondary');
                
                setTimeout(() => {
                  saveButton.innerHTML = originalText;
                  saveButton.classList.remove('btn-success');
                  saveButton.classList.add('btn-secondary');
                }, 2000);
              }
            } else {
              console.warn('⚠️ Y.js provider not synced - manual save may not persist');
              this.sendEditActivity('manual_save', 'local save (not synced)');
            }
          } catch (saveError) {
            console.error('❌ Error during manual save:', saveError);
            this.sendEditActivity('manual_save', 'local save (error)');
          }
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
    
    setupYDocChangeListener() {
      if (!this.collaborationYdoc) return;
      
      // Listen for future changes to the Y.js document
      this.collaborationYdoc.on('update', (update, origin) => {
        console.log('📡 Y.js document updated, checking for new content...', {
          origin: origin,
          updateLength: update ? update.length : 'unknown'
        });
        
        // Skip updates from TipTap editors to prevent interference
        // Handle both string origins and proxy-wrapped origins
        const originString = origin && typeof origin === 'object' && origin.toString ? origin.toString() : String(origin);
        if (originString === 'tiptap-update' || (origin && origin.constructor && origin.constructor.name === 'Proxy')) {
          console.log('⏭️ Skipping parent document listener - update from TipTap editor', {
            originType: typeof origin,
            originString: originString,
            isProxy: origin && origin.constructor && origin.constructor.name === 'Proxy'
          });
          return;
        }
        
        // Delay to allow the update to be fully processed
        setTimeout(() => {
          this.loadContentFromYDoc();
        }, 500);
      });
      
      console.log('👂 Set up Y.js document change listener');
    },
    
    loadContentFromYDoc() {
      if (!this.collaborationYdoc) {
        console.log('📄 No Y.js document available for loading FROM');
        return;
      }
      
      try {
        console.log('🔄 Loading content FROM Y.js document to Vue component...', {
          yDocClientId: this.collaborationYdoc.clientID,
          providerSynced: this.collaborationProvider ? this.collaborationProvider.isSynced : 'no provider'
        });
        
        // Get Y.js text instances
        const yTitle = this.collaborationYdoc.getText('title');
        const yBody = this.collaborationYdoc.getText('body');
        const yTags = this.collaborationYdoc.getText('tags');
        
        console.log('🔍 Y.js text instances:', {
          titleExists: !!yTitle,
          bodyExists: !!yBody,
          tagsExists: !!yTags,
          titleContent: yTitle ? yTitle.toString() : 'no title',
          bodyContent: yBody ? yBody.toString().substring(0, 50) + '...' : 'no body',
          tagsContent: yTags ? yTags.toString() : 'no tags'
        });
        
        // Get current content from Y.js
        const titleFromYjs = yTitle.toString();
        const bodyFromYjs = yBody.toString();
        const tagsFromYjs = yTags.toString();
        
        let contentUpdated = false;
        
        // Update title if different
        if (titleFromYjs && titleFromYjs !== this.postTitle) {
          console.log('📥 Loading title FROM Y.js:', titleFromYjs);
          this.postTitle = titleFromYjs;
          this.generatePermlink();
          contentUpdated = true;
        }
        
        // Update body if different  
        if (bodyFromYjs && bodyFromYjs !== this.postBody) {
          console.log('📥 Loading body FROM Y.js:', bodyFromYjs.substring(0, 50) + '...');
          this.postBody = bodyFromYjs;
          contentUpdated = true;
        }
        
        // Update tags if different
        if (tagsFromYjs && tagsFromYjs !== this.postTags) {
          console.log('📥 Loading tags FROM Y.js:', tagsFromYjs);
          this.postTags = tagsFromYjs;
          
          // Update custom JSON tags array
          const tagsArray = tagsFromYjs.split(' ').filter(tag => tag.trim());
          this.postCustom_json = {
            ...this.postCustom_json,
            tags: tagsArray
          };
          contentUpdated = true;
        }
        
        if (contentUpdated) {
          console.log('✅ Content loaded FROM Y.js document to Vue component');
          this.emitDataChange();
          
          // Force Vue reactivity update
          this.$nextTick(() => {
            console.log('🔄 Vue nextTick - reactive data should be updated now:', {
              postTitle: this.postTitle,
              postBodyLength: this.postBody ? this.postBody.length : 0,
              postTags: this.postTags
            });
          });
        } else {
          console.log('📋 No new content to load FROM Y.js document');
        }
        
      } catch (error) {
        console.error('❌ Error loading content FROM Y.js document:', error);
      }
    },
    
    applySavedJsonToYDoc(jsonData) {
      if (!this.collaborationYdoc) return;
      
      try {
        console.log('📄 Applying JSON data to Y.js document:', jsonData);
        
        // Apply each field if it exists in the saved data
        if (jsonData.title) {
          const yTitle = this.collaborationYdoc.getText('title');
          this.collaborationYdoc.transact(() => {
            yTitle.delete(0, yTitle.length);
            yTitle.insert(0, jsonData.title);
          });
          console.log('📝 Applied saved title:', jsonData.title);
        }
        
        if (jsonData.body) {
          const yBody = this.collaborationYdoc.getText('body');
          this.collaborationYdoc.transact(() => {
            yBody.delete(0, yBody.length);
            yBody.insert(0, jsonData.body);
          });
          console.log('📝 Applied saved body:', jsonData.body.substring(0, 50) + '...');
        }
        
        if (jsonData.tags) {
          const yTags = this.collaborationYdoc.getText('tags');
          const tagsText = Array.isArray(jsonData.tags) ? jsonData.tags.join(' ') : jsonData.tags;
          this.collaborationYdoc.transact(() => {
            yTags.delete(0, yTags.length);
            yTags.insert(0, tagsText);
          });
          console.log('📝 Applied saved tags:', tagsText);
        }
        
      } catch (error) {
        console.error('❌ Error applying JSON data to Y.js document:', error);
      }
    },
    
    syncCurrentContentToYDoc() {
      if (!this.collaborationYdoc) {
        console.log('📄 No Y.js document available for syncing TO');
        return;
      }
      
      try {
        console.log('🔄 Syncing current content TO Y.js document...');
        
        let contentSynced = false;
        
        // Sync title TO Y.js if we have one
        if (this.postTitle && this.postTitle.trim()) {
          const yTitle = this.collaborationYdoc.getText('title');
          if (yTitle.toString() !== this.postTitle) {
            console.log('📤 Syncing title TO Y.js:', this.postTitle);
            this.collaborationYdoc.transact(() => {
              yTitle.delete(0, yTitle.length);
              yTitle.insert(0, this.postTitle);
            }, 'initial-sync');
            contentSynced = true;
          }
        }
        
        // Sync body TO Y.js if we have one
        if (this.postBody && this.postBody.trim()) {
          const yBody = this.collaborationYdoc.getText('body');
          console.log('🔍 Checking if body needs sync TO Y.js:', {
            currentBody: `"${this.postBody.substring(0, 50)}..."`,
            yBodyContent: `"${yBody.toString().substring(0, 50)}..."`,
            bodiesMatch: yBody.toString() === this.postBody
          });
          if (yBody.toString() !== this.postBody) {
            console.log('📤 Syncing body TO Y.js:', this.postBody.substring(0, 50) + '...');
            this.collaborationYdoc.transact(() => {
              yBody.delete(0, yBody.length);
              yBody.insert(0, this.postBody);
            }, 'initial-sync');
            contentSynced = true;
            
            // Force the TipTap editor to update after syncing
            setTimeout(() => {
              console.log('🔄 Checking if TipTap editor received the synced content...');
              this.loadContentFromYDoc();
            }, 500);
          }
        } else {
          console.log('🔍 No body content to sync TO Y.js (empty or null)');
        }
        
        // Sync tags TO Y.js if we have them
        if (this.postTags && this.postTags.trim()) {
          const yTags = this.collaborationYdoc.getText('tags');
          if (yTags.toString() !== this.postTags) {
            console.log('📤 Syncing tags TO Y.js:', this.postTags);
            this.collaborationYdoc.transact(() => {
              yTags.delete(0, yTags.length);
              yTags.insert(0, this.postTags);
            }, 'initial-sync');
            contentSynced = true;
          }
        }
        
        if (contentSynced) {
          console.log('✅ Current content synced TO Y.js document');
        } else {
          console.log('📋 No content to sync TO Y.js document');
        }
        
      } catch (error) {
        console.error('❌ Error syncing content TO Y.js document:', error);
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
    // Clean up auto-save timeout
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }
    
    this.disconnectCollaboration();
  }
}; 