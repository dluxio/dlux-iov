# TipTap Collaboration Implementation Guide

## Complete Implementation Example

This guide provides detailed implementation code for the TipTap collaborative editor with Y.js, IndexedDB persistence, and WebSocket synchronization.

## Table of Contents
1. [Core Setup](#core-setup)
2. [Y.js Document Initialization](#yjs-document-initialization)
3. [Editor Configuration](#editor-configuration)
4. [Observer Implementation](#observer-implementation)
5. [WebSocket Provider Setup](#websocket-provider-setup)
6. [IndexedDB Persistence](#indexeddb-persistence)
7. [Permission Management](#permission-management)
8. [Error Recovery](#error-recovery)
9. [Two-Tier System Implementation](#two-tier-system-implementation)

## Core Setup

### Vue Component Structure
```javascript
export default {
  name: 'TiptapEditor',
  
  data() {
    return {
      // Y.js and Editor instances
      ydoc: null,
      bodyEditor: null,
      provider: null,
      
      // Document state
      currentFile: {
        name: '',
        owner: '',
        permlink: '',
        isLocal: true,
        hasCloudBackup: false
      },
      
      // UI state
      titleInput: '',
      permlinkInput: '',
      tagInput: '',
      reactiveTags: [],
      reactiveBeneficiaries: [],
      reactiveCustomJson: {},
      reactiveCommentOptions: {
        allowVotes: true,
        allowCurationRewards: true,
        maxAcceptedPayout: '1000000.000 SBD',
        percentHbd: 10000
      },
      
      // Flags
      isLoadingDocument: false,
      editorInitialized: false,
      hasUnsavedChanges: false,
      hasUserIntent: false,
      _isUpdatingTitle: false,
      _isUpdatingPermlink: false,
      
      // Observers
      configObserver: null,
      metadataObserver: null,
      permissionsObserver: null,
      
      // Timers
      autosaveTimer: null,
      permissionCheckTimer: null
    };
  },
  
  computed: {
    // Permission levels
    currentPermissionLevel() {
      if (!this.currentFile || !this.username) return 'no-access';
      
      // Check cache first
      const cacheKey = `${this.currentFile.owner}/${this.currentFile.permlink}`;
      const cached = this.permissionCache.get(cacheKey);
      
      if (cached && cached.expires > Date.now()) {
        return cached.level;
      }
      
      // Default based on ownership
      return this.currentFile.owner === this.username ? 'owner' : 'no-access';
    },
    
    isOwner() {
      return this.currentPermissionLevel === 'owner';
    },
    
    isPostable() {
      return ['owner', 'postable'].includes(this.currentPermissionLevel);
    },
    
    isEditable() {
      return ['owner', 'postable', 'editable'].includes(this.currentPermissionLevel);
    },
    
    isReadonly() {
      return this.currentPermissionLevel === 'readonly';
    },
    
    hasNoAccess() {
      return this.currentPermissionLevel === 'no-access';
    },
    
    // Editor state
    isReadOnlyMode() {
      return !this.isEditable || this.isReadonly;
    }
  }
};
```

## Y.js Document Initialization

### Create New Document
```javascript
async createNewDocument() {
  // Clean up existing document
  await this.cleanupCurrentDocument();
  
  // Create new Y.js document
  const Y = window.TiptapCollaboration.Y;
  this.ydoc = new Y.Doc();
  
  // Initialize config map
  const config = this.ydoc.getMap('config');
  this.ydoc.transact(() => {
    config.set('documentName', this.generateDocumentName());
    config.set('created', new Date().toISOString());
    config.set('lastModified', new Date().toISOString());
    config.set('version', '1.0');
    config.set('documentType', 'collaborative');
    config.set('owner', this.username || 'anonymous');
  }, 'config-init');
  
  // Initialize metadata map
  const metadata = this.ydoc.getMap('metadata');
  this.ydoc.transact(() => {
    metadata.set('title', '');
    metadata.set('tags', []);
    metadata.set('beneficiaries', []);
    metadata.set('customJson', {});
    metadata.set('permlink', '');
    metadata.set('commentOptions', {
      allowVotes: true,
      allowCurationRewards: true,
      maxAcceptedPayout: '1000000.000 SBD',
      percentHbd: 10000
    });
    metadata.set('initialized', true);
  }, 'metadata-init');
  
  // Set up observers
  this.setupObservers();
  
  // Initialize editor
  await this.initializeEditor();
  
  // Start autosave
  this.startAutosave();
}
```

### Load Existing Document
```javascript
async loadDocument(file) {
  this.isLoadingDocument = true;
  
  try {
    // Clean up current document
    await this.cleanupCurrentDocument();
    
    // Create new Y.js document
    const Y = window.TiptapCollaboration.Y;
    this.ydoc = new Y.Doc();
    
    if (file.isLocal) {
      // Load from IndexedDB
      await this.loadFromIndexedDB(file.id);
    } else {
      // Load from server
      await this.connectToCollaborativeDocument(file.owner, file.permlink);
    }
    
    // Update current file reference
    this.currentFile = { ...file };
    
    // Set up observers
    this.setupObservers();
    
    // Initialize editor
    await this.initializeEditor();
    
    // Start autosave
    this.startAutosave();
    
  } catch (error) {
    console.error('Error loading document:', error);
    this.handleLoadError(error);
  } finally {
    this.isLoadingDocument = false;
  }
}
```

## Editor Configuration

### Initialize TipTap Editor
```javascript
async initializeEditor() {
  // Import extensions
  const {
    Editor,
    StarterKit,
    Collaboration,
    CollaborationCaret,
    TableKit,
    Image,
    Link,
    Mention,
    BubbleMenu,
    DragHandle,
    TextAlign,
    markRaw
  } = window.TiptapCollaboration;
  
  // Configure extensions
  const extensions = [
    StarterKit.configure({
      history: false, // Required for collaboration
      dropcursor: false // We'll add custom dropcursor
    }),
    
    Collaboration.configure({
      document: this.ydoc,
      field: 'body' // Creates the body fragment
    }),
    
    // Only add CollaborationCaret for Tier 2
    ...(this.provider ? [
      CollaborationCaret.configure({
        provider: this.provider,
        user: {
          name: this.username,
          color: this.getUserColor()
        }
      })
    ] : []),
    
    TableKit.configure({
      resizable: true,
      cellSelection: true
    }),
    
    Image.configure({
      inline: true,
      allowBase64: true
    }),
    
    Link.configure({
      openOnClick: false,
      autolink: true
    }),
    
    Mention.configure({
      HTMLAttributes: {
        class: 'mention'
      },
      suggestion: this.getMentionSuggestion()
    }),
    
    BubbleMenu.configure({
      element: document.querySelector('.bubble-menu'),
      updateDelay: 250,
      shouldShow: ({ editor, view, state, from, to }) => {
        // Safety checks
        if (editor.isDestroyed || this.isUnmounting) {
          return false;
        }
        
        // Only show for text selection
        if (from === to) return false;
        
        // Don't show for certain node types
        const disabledNodes = ['codeBlock', 'image', 'video'];
        if (disabledNodes.some(node => editor.isActive(node))) {
          return false;
        }
        
        return true;
      }
    }),
    
    DragHandle.configure({
      dragHandleSelector: '.drag-handle',
      onDragStart: (data) => {
        console.log('Drag started:', data);
      },
      onDragEnd: (data) => {
        console.log('Drag ended:', data);
      }
    }),
    
    TextAlign.configure({
      types: ['heading', 'paragraph'],
      alignments: ['left', 'center', 'right', 'justify']
    })
  ];
  
  // Create editor
  this.bodyEditor = markRaw(new Editor({
    extensions,
    editable: this.isEditable,
    onCreate: ({ editor }) => {
      console.log('Editor created');
      
      // Set initialized flag after delay
      setTimeout(() => {
        this.editorInitialized = true;
      }, 1500);
    },
    onUpdate: ({ editor, transaction }) => {
      // Skip if initializing or loading
      if (!this.editorInitialized || this.isLoadingDocument) {
        return;
      }
      
      // Check for user interaction
      if (transaction.docChanged && !transaction.getMeta('remote')) {
        this.hasUserIntent = true;
        this.hasUnsavedChanges = true;
        this.updateSaveStatus();
      }
    },
    onSelectionUpdate: ({ editor }) => {
      // Update toolbar positions
      this.updateTableToolbarPosition();
    }
  }));
}
```

## Observer Implementation

### Setup Y.js Observers
```javascript
setupObservers() {
  // Config observer
  this.configObserver = (event) => {
    if (this.isLoadingDocument) return;
    
    event.keysChanged.forEach(key => {
      const value = this.ydoc.getMap('config').get(key);
      
      switch(key) {
        case 'documentName':
          if (this.currentFile) {
            this.currentFile.name = value;
            this.documentName = value;
          }
          break;
          
        case 'lastModified':
          if (this.currentFile) {
            this.currentFile.lastModified = value;
          }
          break;
          
        case 'owner':
          if (this.currentFile) {
            this.currentFile.owner = value;
          }
          break;
      }
    });
  };
  
  // Metadata observer with recursion protection
  this.metadataObserver = (event) => {
    if (this.isLoadingDocument) return;
    
    event.keysChanged.forEach(key => {
      const value = this.ydoc.getMap('metadata').get(key);
      
      switch(key) {
        case 'title':
          if (!this._isUpdatingTitle) {
            this._isUpdatingTitle = true;
            this.titleInput = value || '';
            this.$nextTick(() => {
              this._isUpdatingTitle = false;
            });
          }
          break;
          
        case 'permlink':
          if (!this._isUpdatingPermlink) {
            this._isUpdatingPermlink = true;
            this.permlinkInput = value || '';
            this.$nextTick(() => {
              this._isUpdatingPermlink = false;
            });
          }
          break;
          
        case 'tags':
          this.reactiveTags = [...(value || [])];
          this.content.tags = [...(value || [])];
          break;
          
        case 'beneficiaries':
          this.reactiveBeneficiaries = [...(value || [])];
          this.content.beneficiaries = [...(value || [])];
          break;
          
        case 'customJson':
          this.reactiveCustomJson = { ...(value || {}) };
          this.customJsonString = JSON.stringify(value || {}, null, 2);
          this.content.custom_json = { ...(value || {}) };
          break;
          
        case 'commentOptions':
          const options = value || {};
          this.reactiveCommentOptions = { ...options };
          Object.assign(this.commentOptions, options);
          break;
      }
    });
  };
  
  // Permissions observer (read-only)
  this.permissionsObserver = (event) => {
    console.log('Permissions updated:', event);
    
    // Check if our permission changed
    const permissions = this.ydoc.getMap('permissions');
    const myPermission = permissions.get(this.username);
    
    if (myPermission) {
      this.handlePermissionBroadcast({
        account: this.username,
        level: myPermission.level,
        timestamp: myPermission.timestamp
      });
    }
  };
  
  // Attach observers
  this.ydoc.getMap('config').observe(this.configObserver);
  this.ydoc.getMap('metadata').observe(this.metadataObserver);
  this.ydoc.getMap('permissions').observe(this.permissionsObserver);
}
```

### Update Methods with Recursion Protection
```javascript
// Update title in Y.js
updateTitleInYjs(newTitle) {
  if (this._isUpdatingTitle || !this.ydoc) return;
  
  this.ydoc.transact(() => {
    this.ydoc.getMap('metadata').set('title', newTitle);
  }, 'title-update');
  
  this.hasUserIntent = true;
  this.hasUnsavedChanges = true;
  this.$nextTick(() => {
    this.updateSaveStatus();
  });
}

// Update permlink in Y.js
updatePermlinkInYjs(newPermlink) {
  if (this._isUpdatingPermlink || !this.ydoc) return;
  
  this._isUpdatingPermlink = true;
  
  this.ydoc.transact(() => {
    this.ydoc.getMap('metadata').set('permlink', newPermlink);
  }, 'permlink-update');
  
  this.$nextTick(() => {
    this._isUpdatingPermlink = false;
  });
  
  this.hasUserIntent = true;
  this.hasUnsavedChanges = true;
  this.updateSaveStatus();
}

// Add tag
addTagToYjs(tag) {
  if (!tag || !this.ydoc) return;
  
  const currentTags = this.ydoc.getMap('metadata').get('tags') || [];
  
  if (!currentTags.includes(tag)) {
    this.ydoc.transact(() => {
      this.ydoc.getMap('metadata').set('tags', [...currentTags, tag]);
    }, 'tag-add');
    
    this.hasUserIntent = true;
    this.hasUnsavedChanges = true;
    this.$nextTick(() => {
      this.updateSaveStatus();
    });
  }
}

// Remove tag
removeTagFromYjs(index) {
  if (!this.ydoc) return;
  
  const currentTags = this.ydoc.getMap('metadata').get('tags') || [];
  const newTags = currentTags.filter((_, i) => i !== index);
  
  this.ydoc.transact(() => {
    this.ydoc.getMap('metadata').set('tags', newTags);
  }, 'tag-remove');
  
  this.hasUserIntent = true;
  this.hasUnsavedChanges = true;
  this.$nextTick(() => {
    this.updateSaveStatus();
  });
}
```

## WebSocket Provider Setup

### Connect to Collaborative Document
```javascript
async connectToCollaborativeDocument(owner, permlink) {
  try {
    // Generate authentication
    const authHeaders = await this.generateAuthHeaders();
    const token = btoa(JSON.stringify(authHeaders));
    
    // Create provider
    const HocuspocusProvider = window.TiptapCollaboration.HocuspocusProvider;
    
    this.provider = new HocuspocusProvider({
      url: `wss://data.dlux.io/collaboration/${owner}/${permlink}`,
      name: `${owner}/${permlink}`,
      document: this.ydoc,
      token: token,
      
      onAuthenticated: () => {
        console.log('WebSocket authenticated');
        this.connectionStatus = 'connected';
      },
      
      onAuthenticationFailed: ({ reason }) => {
        console.error('Authentication failed:', reason);
        this.handleAuthenticationFailure();
      },
      
      onStatus: ({ status }) => {
        console.log('Connection status:', status);
        this.connectionStatus = status;
        this.updateCloudButton();
      },
      
      onSynced: ({ state }) => {
        console.log('Document synced:', state);
        this.hasUnsavedChanges = false;
        this.updateSaveStatus();
      },
      
      onDisconnect: () => {
        console.log('WebSocket disconnected');
        this.handleDisconnect();
      },
      
      onMessage: ({ message }) => {
        // Handle custom messages
        if (message.type === 'permission-update') {
          this.handlePermissionBroadcast(message.data);
        }
      },
      
      awareness: {
        user: {
          name: this.username,
          color: this.getUserColor()
        }
      },
      
      // Retry configuration
      minDelay: 1000,
      maxDelay: 30000,
      factor: 1.5,
      retries: 5,
      timeout: 30000
    });
    
    // Set up awareness heartbeat for readonly users
    if (this.isReadonly) {
      this.setupAwarenessHeartbeat();
    }
    
  } catch (error) {
    console.error('Failed to connect to collaborative document:', error);
    throw error;
  }
}

// Awareness heartbeat for Y.js protocol compliance
setupAwarenessHeartbeat() {
  // Clear any existing interval
  if (this.awarenessInterval) {
    clearInterval(this.awarenessInterval);
  }
  
  // Y.js awareness protocol expects updates every 15 seconds
  // to maintain the 30-second timeout window
  this.awarenessInterval = setInterval(() => {
    if (this.provider && this.provider.awareness) {
      // Update last activity timestamp
      this.provider.awareness.setLocalStateField('lastActivity', Date.now());
    }
  }, 15000); // Every 15 seconds
}
```

## IndexedDB Persistence

### Initialize IndexedDB
```javascript
async initializeIndexedDB() {
  const { openDB } = await import('idb');
  
  this.db = await openDB('dlux-docs', 1, {
    upgrade(db) {
      // Documents store
      if (!db.objectStoreNames.contains('documents')) {
        const docStore = db.createObjectStore('documents', {
          keyPath: 'id',
          autoIncrement: true
        });
        docStore.createIndex('owner', 'owner');
        docStore.createIndex('permlink', 'permlink');
        docStore.createIndex('lastModified', 'lastModified');
      }
      
      // Y.js updates store
      if (!db.objectStoreNames.contains('updates')) {
        const updateStore = db.createObjectStore('updates', {
          keyPath: 'id',
          autoIncrement: true
        });
        updateStore.createIndex('docId', 'docId');
        updateStore.createIndex('timestamp', 'timestamp');
      }
    }
  });
}

// Save document to IndexedDB
async saveToIndexedDB() {
  if (!this.db || !this.ydoc || !this.currentFile) return;
  
  try {
    // Get Y.js state
    const Y = window.TiptapCollaboration.Y;
    const state = Y.encodeStateAsUpdate(this.ydoc);
    
    // Prepare document data
    const docData = {
      id: this.currentFile.id || undefined, // Let IDB auto-generate if new
      name: this.currentFile.name,
      owner: this.currentFile.owner || this.username,
      permlink: this.currentFile.permlink || this.generatePermlink(),
      title: this.titleInput,
      lastModified: new Date().toISOString(),
      yjsState: state,
      metadata: {
        tags: this.reactiveTags,
        beneficiaries: this.reactiveBeneficiaries,
        customJson: this.reactiveCustomJson,
        commentOptions: this.reactiveCommentOptions
      }
    };
    
    // Save to IndexedDB
    const tx = this.db.transaction('documents', 'readwrite');
    const id = await tx.store.put(docData);
    await tx.done;
    
    // Update current file reference
    if (!this.currentFile.id) {
      this.currentFile.id = id;
    }
    
    // Mark as saved
    this.hasUnsavedChanges = false;
    this.updateSaveStatus();
    
    console.log('Document saved to IndexedDB:', id);
    
  } catch (error) {
    console.error('Error saving to IndexedDB:', error);
    this.handleSaveError(error);
  }
}

// Load document from IndexedDB
async loadFromIndexedDB(docId) {
  if (!this.db || !docId) return;
  
  try {
    const tx = this.db.transaction('documents', 'readonly');
    const doc = await tx.store.get(docId);
    
    if (!doc) {
      throw new Error('Document not found');
    }
    
    // Apply Y.js state
    const Y = window.TiptapCollaboration.Y;
    Y.applyUpdate(this.ydoc, doc.yjsState);
    
    // Update UI state
    this.currentFile = {
      id: doc.id,
      name: doc.name,
      owner: doc.owner,
      permlink: doc.permlink,
      lastModified: doc.lastModified,
      isLocal: true,
      hasCloudBackup: false
    };
    
    console.log('Document loaded from IndexedDB:', docId);
    
  } catch (error) {
    console.error('Error loading from IndexedDB:', error);
    throw error;
  }
}
```

## Permission Management

### Check and Update Permissions
```javascript
async validateCurrentDocumentPermissions() {
  if (!this.currentFile || this.currentFile.isLocal) return;
  
  // Check authentication first
  if (!this.username || !this.isAuthenticated()) {
    console.log('Not authenticated, forcing no-access');
    this.updateCachedPermission('no-access');
    return;
  }
  
  const { owner, permlink } = this.currentFile;
  
  try {
    // Get document info (includes permission level)
    const response = await fetch(
      `https://data.dlux.io/api/collaboration/info/${owner}/${permlink}`,
      { headers: await this.generateAuthHeaders() }
    );
    
    if (response.status === 403) {
      this.updateCachedPermission('no-access');
      this.handleNoAccess();
      return;
    }
    
    const data = await response.json();
    const newLevel = data.document.permission;
    
    // Update cache
    this.updateCachedPermission(newLevel);
    
    // Handle permission change
    if (newLevel !== this.currentPermissionLevel) {
      this.handlePermissionChange(newLevel);
    }
    
  } catch (error) {
    console.error('Error checking permissions:', error);
    // Don't fall back to cache on error - force re-auth
    this.updateCachedPermission('no-access');
  }
}

// Update permission cache
updateCachedPermission(level) {
  const cacheKey = `${this.currentFile.owner}/${this.currentFile.permlink}`;
  
  this.permissionCache.set(cacheKey, {
    level: level,
    expires: Date.now() + 5 * 60 * 1000 // 5 minutes
  });
  
  // Force Vue to recalculate computed properties
  this.$forceUpdate();
}

// Handle permission changes
handlePermissionChange(newLevel) {
  console.log('Permission changed to:', newLevel);
  
  // Update editor state
  if (this.bodyEditor && !this.bodyEditor.isDestroyed) {
    this.bodyEditor.setEditable(this.isEditable);
  }
  
  // Handle WebSocket reconnection for permission upgrades
  if (this.shouldReconnectForPermission(newLevel)) {
    this.reconnectWithNewPermission();
  }
  
  // Show notification
  this.showNotification({
    type: 'info',
    message: `Your permission level changed to: ${newLevel}`
  });
}

// Check if reconnection needed
shouldReconnectForPermission(newLevel) {
  const oldLevel = this.currentPermissionLevel;
  
  // Reconnect if crossing readonly/editable boundary
  const wasReadonly = oldLevel === 'readonly';
  const isNowEditable = ['editable', 'postable', 'owner'].includes(newLevel);
  
  return wasReadonly && isNowEditable;
}
```

## Error Recovery

### Implement Recovery Mechanisms
```javascript
// Handle load errors
async handleLoadError(error) {
  console.error('Document load error:', error);
  
  // Check error type
  if (error.message.includes('permission')) {
    this.showNotification({
      type: 'error',
      message: 'You don\'t have permission to access this document'
    });
    
    // Clear current document
    await this.newDocument();
    
  } else if (error.message.includes('not found')) {
    this.showNotification({
      type: 'error',
      message: 'Document not found'
    });
    
    // Remove from recent files
    this.removeFromRecentFiles(this.currentFile);
    
    // Clear current document
    await this.newDocument();
    
  } else {
    // Generic error
    this.showNotification({
      type: 'error',
      message: 'Failed to load document. Please try again.'
    });
  }
}

// Handle save errors
async handleSaveError(error) {
  console.error('Save error:', error);
  
  if (error.name === 'QuotaExceededError') {
    // Storage full
    const cleaned = await this.cleanupOldDocuments();
    
    if (cleaned > 0) {
      // Retry save
      this.showNotification({
        type: 'info',
        message: `Cleaned up ${cleaned} old documents. Retrying save...`
      });
      
      await this.saveToIndexedDB();
    } else {
      // Can't clean up more
      this.showNotification({
        type: 'error',
        message: 'Storage full. Please delete some documents.',
        action: {
          label: 'Manage Storage',
          handler: () => this.openStorageManager()
        }
      });
    }
  } else {
    // Other error
    this.showNotification({
      type: 'error',
      message: 'Failed to save document. Your changes are at risk.'
    });
  }
}

// Handle authentication failures
async handleAuthenticationFailure() {
  console.error('Authentication failed');
  
  // Check if token expired
  const lastAuth = localStorage.getItem('dlux-last-auth');
  const isExpired = lastAuth && (Date.now() - parseInt(lastAuth) > 23 * 60 * 60 * 1000);
  
  if (isExpired) {
    this.showNotification({
      type: 'warning',
      message: 'Your session expired. Please log in again.',
      action: {
        label: 'Log In',
        handler: () => this.showLoginModal()
      }
    });
  } else {
    this.showNotification({
      type: 'error',
      message: 'Authentication failed. Please check your credentials.'
    });
  }
  
  // Switch to local mode
  this.switchToLocalMode();
}

// Recovery from connection loss
async handleDisconnect() {
  console.log('Handling disconnect');
  
  // Don't show notification if intentional disconnect
  if (this.isIntentionalDisconnect) {
    this.isIntentionalDisconnect = false;
    return;
  }
  
  this.showNotification({
    type: 'warning',
    message: 'Connection lost. Working in offline mode.',
    persistent: true,
    id: 'connection-lost'
  });
  
  // Continue with local persistence
  this.startOfflineMode();
}

// Offline mode
startOfflineMode() {
  // Ensure autosave is running
  if (!this.autosaveTimer) {
    this.startAutosave();
  }
  
  // Mark document as having local changes
  if (this.currentFile) {
    this.currentFile.hasLocalChanges = true;
  }
  
  // Set up offline queue for changes
  this.setupOfflineQueue();
}
```

## Two-Tier System Implementation

### Tier Detection and Management
```javascript
// Determine collaboration tier
getCollaborationTier() {
  if (!this.currentFile) return 'none';
  
  if (this.currentFile.isLocal) {
    return 'tier1'; // Local with IndexedDB
  } else if (this.provider && this.provider.status === 'connected') {
    return 'tier2'; // Full collaboration
  } else {
    return 'tier1'; // Fallback to local
  }
}

// Switch between tiers
async upgradeTier() {
  if (this.getCollaborationTier() !== 'tier1') return;
  
  try {
    // Create cloud document
    const response = await fetch(
      'https://data.dlux.io/api/collaboration/documents',
      {
        method: 'POST',
        headers: {
          ...await this.generateAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          permlink: this.currentFile.permlink || this.generatePermlink(),
          title: this.titleInput,
          metadata: {
            tags: this.reactiveTags,
            beneficiaries: this.reactiveBeneficiaries,
            customJson: this.reactiveCustomJson
          }
        })
      }
    );
    
    if (!response.ok) throw new Error('Failed to create cloud document');
    
    const { document } = await response.json();
    
    // Connect to cloud document
    await this.connectToCollaborativeDocument(document.owner, document.permlink);
    
    // Update current file
    this.currentFile.isLocal = false;
    this.currentFile.hasCloudBackup = true;
    this.currentFile.owner = document.owner;
    this.currentFile.permlink = document.permlink;
    
    this.showNotification({
      type: 'success',
      message: 'Document upgraded to collaborative mode'
    });
    
  } catch (error) {
    console.error('Failed to upgrade tier:', error);
    this.showNotification({
      type: 'error',
      message: 'Failed to enable collaboration. Document remains local.'
    });
  }
}

// Downgrade to local
async downgradeTier() {
  if (this.getCollaborationTier() !== 'tier2') return;
  
  // Disconnect provider
  if (this.provider) {
    this.isIntentionalDisconnect = true;
    this.provider.disconnect();
    this.provider.destroy();
    this.provider = null;
  }
  
  // Mark as local
  this.currentFile.isLocal = true;
  
  // Save to IndexedDB
  await this.saveToIndexedDB();
  
  this.showNotification({
    type: 'info',
    message: 'Switched to local mode'
  });
}
```

### Complete Cleanup Implementation
```javascript
async cleanupCurrentDocument() {
  console.log('Cleaning up current document');
  
  // Clear timers
  if (this.autosaveTimer) {
    clearInterval(this.autosaveTimer);
    this.autosaveTimer = null;
  }
  
  if (this.permissionCheckTimer) {
    clearInterval(this.permissionCheckTimer);
    this.permissionCheckTimer = null;
  }
  
  if (this.awarenessInterval) {
    clearInterval(this.awarenessInterval);
    this.awarenessInterval = null;
  }
  
  // Clean up observers
  if (this.ydoc) {
    if (this.configObserver) {
      this.ydoc.getMap('config').unobserve(this.configObserver);
      this.configObserver = null;
    }
    
    if (this.metadataObserver) {
      this.ydoc.getMap('metadata').unobserve(this.metadataObserver);
      this.metadataObserver = null;
    }
    
    if (this.permissionsObserver) {
      this.ydoc.getMap('permissions').unobserve(this.permissionsObserver);
      this.permissionsObserver = null;
    }
  }
  
  // Destroy editor
  if (this.bodyEditor && !this.bodyEditor.isDestroyed) {
    this.bodyEditor.destroy();
    this.bodyEditor = null;
  }
  
  // Disconnect provider
  if (this.provider) {
    this.provider.disconnect();
    this.provider.destroy();
    this.provider = null;
  }
  
  // Destroy Y.js document
  if (this.ydoc) {
    this.ydoc.destroy();
    this.ydoc = null;
  }
  
  // Reset state
  this.resetComponentState();
}

// Reset component state
resetComponentState() {
  // Reset document state
  this.currentFile = null;
  this.titleInput = '';
  this.permlinkInput = '';
  this.tagInput = '';
  this.reactiveTags = [];
  this.reactiveBeneficiaries = [];
  this.reactiveCustomJson = {};
  this.reactiveCommentOptions = {
    allowVotes: true,
    allowCurationRewards: true,
    maxAcceptedPayout: '1000000.000 SBD',
    percentHbd: 10000
  };
  
  // Reset flags
  this.isLoadingDocument = false;
  this.editorInitialized = false;
  this.hasUnsavedChanges = false;
  this.hasUserIntent = false;
  this._isUpdatingTitle = false;
  this._isUpdatingPermlink = false;
  
  // Clear UI state
  this.showPermlinkEditor = false;
  this.showAdvancedOptions = false;
  this.connectionStatus = 'disconnected';
}
```

## Best Practices Summary

1. **Always use transaction origin tags** for Y.js operations
2. **Implement proper cleanup** in the correct order
3. **Use recursion protection** in observers
4. **Handle errors gracefully** with user feedback
5. **Cache permissions** to reduce API calls
6. **Support offline mode** with IndexedDB
7. **Validate before operations** to prevent errors
8. **Monitor connection status** and adapt behavior
9. **Provide clear user feedback** for all actions
10. **Test edge cases** thoroughly

This implementation guide provides a complete, production-ready collaborative editor with offline support, real-time synchronization, and robust error handling.