# TipTap Collaboration Error Handling Guide

## Common Errors and Solutions

### 1. RangeError: Applying a mismatched transaction

**Error Message:**
```
RangeError: Applying a mismatched transaction
```

**Causes:**
- Y.js document state mismatch between client and server
- Multiple editors modifying the same Y.js document
- Improper cleanup leading to stale references
- Race conditions during initialization

**Solutions:**

#### Prevention
```javascript
// 1. Always use transaction origin tags
ydoc.transact(() => {
  metadata.set('title', newTitle);
}, 'metadata-update');

// 2. Proper cleanup order
beforeUnmount() {
  // Clean up observers first
  if (this.configObserver) {
    this.ydoc.getMap('config').unobserve(this.configObserver);
  }
  if (this.metadataObserver) {
    this.ydoc.getMap('metadata').unobserve(this.metadataObserver);
  }
  
  // Then destroy editors
  if (this.bodyEditor) {
    this.bodyEditor.destroy();
  }
  
  // Then disconnect providers
  if (this.provider) {
    this.provider.disconnect();
    this.provider.destroy();
  }
  
  // Finally destroy Y.js document
  if (this.ydoc) {
    this.ydoc.destroy();
  }
}

// 3. Check editor state before operations
if (!this.bodyEditor.isDestroyed) {
  this.bodyEditor.commands.insertContent(content);
}
```

#### Recovery
```javascript
// Force resync with server
async recoverFromMismatchError() {
  console.error('Mismatched transaction detected, attempting recovery');
  
  // 1. Disconnect current provider
  if (this.provider) {
    this.provider.disconnect();
  }
  
  // 2. Create new Y.js document
  const newYdoc = new Y.Doc();
  
  // 3. Reconnect with fresh document
  this.provider = new HocuspocusProvider({
    url: this.websocketUrl,
    name: this.documentName,
    document: newYdoc,
    token: this.authToken,
    onSynced: () => {
      // 4. Update editor with new document
      this.bodyEditor.commands.setContent(
        newYdoc.getXmlFragment('body').toString()
      );
      this.ydoc = newYdoc;
    }
  });
}
```

### 2. Permission System 403 Errors

**Error Types:**

#### 403 on Permission Check
```json
{
  "status": "error",
  "error": "Permission denied",
  "message": "Only document owner can view permissions"
}
```

**Solution:**
```javascript
// Check if user is owner before requesting permissions
async checkPermissions() {
  // First get document info
  const infoResponse = await fetch(
    `${API_BASE}/collaboration/info/${owner}/${permlink}`,
    { headers: this.authHeaders }
  );
  
  const { document } = await infoResponse.json();
  
  // Only request permissions list if owner
  if (document.owner === this.username) {
    const permResponse = await fetch(
      `${API_BASE}/collaboration/permissions/${owner}/${permlink}`,
      { headers: this.authHeaders }
    );
    // Process permissions...
  } else {
    // Use permission level from document info
    this.currentPermissionLevel = document.permission;
  }
}
```

#### 403 on Document Access
```json
{
  "status": "error", 
  "error": "Access denied",
  "message": "You don't have permission to access this document"
}
```

**Solution:**
```javascript
// Implement permission caching with fallback
const permissionCache = new Map();

async getDocumentWithFallback(owner, permlink) {
  try {
    // Try to access document
    const response = await fetch(
      `${API_BASE}/collaboration/info/${owner}/${permlink}`,
      { headers: this.authHeaders }
    );
    
    if (response.status === 403) {
      // Check cache
      const cacheKey = `${owner}/${permlink}`;
      const cached = permissionCache.get(cacheKey);
      
      if (cached && cached.expires > Date.now()) {
        return { permission: cached.level, fromCache: true };
      }
      
      // No valid cache, user has no access
      return { permission: 'no-access' };
    }
    
    const data = await response.json();
    
    // Cache the permission
    permissionCache.set(`${owner}/${permlink}`, {
      level: data.document.permission,
      expires: Date.now() + 5 * 60 * 1000 // 5 minutes
    });
    
    return data.document;
  } catch (error) {
    console.error('Document access error:', error);
    return { permission: 'no-access' };
  }
}
```

### 3. WebSocket Connection Errors

#### Connection Refused
```
WebSocket connection to 'wss://data.dlux.io/collaboration/...' failed
```

**Solutions:**

```javascript
// Implement exponential backoff retry
class WebSocketReconnect {
  constructor(provider, maxRetries = 5) {
    this.provider = provider;
    this.maxRetries = maxRetries;
    this.retryCount = 0;
    this.baseDelay = 1000; // 1 second
    
    this.setupEventHandlers();
  }
  
  setupEventHandlers() {
    this.provider.on('disconnect', () => {
      this.scheduleReconnect();
    });
    
    this.provider.on('connect', () => {
      this.retryCount = 0; // Reset on successful connection
    });
  }
  
  scheduleReconnect() {
    if (this.retryCount >= this.maxRetries) {
      console.error('Max reconnection attempts reached');
      this.handlePermanentDisconnect();
      return;
    }
    
    const delay = this.baseDelay * Math.pow(2, this.retryCount);
    this.retryCount++;
    
    console.log(`Reconnecting in ${delay}ms (attempt ${this.retryCount})`);
    
    setTimeout(() => {
      this.provider.connect();
    }, delay);
  }
  
  handlePermanentDisconnect() {
    // Switch to offline mode
    this.provider.disconnect();
    // Notify user
    alert('Connection lost. Working in offline mode.');
  }
}
```

#### Authentication Failures
```
WebSocket closed with code 4001: Authentication failed
```

**Solution:**
```javascript
// Handle token expiration
provider.on('authenticationFailed', async () => {
  console.log('Authentication failed, refreshing token');
  
  // Generate new auth headers
  const newAuthHeaders = await this.generateAuthHeaders();
  const newToken = btoa(JSON.stringify(newAuthHeaders));
  
  // Update provider configuration
  this.provider.configuration.token = newToken;
  
  // Reconnect
  this.provider.connect();
});
```

### 4. IndexedDB Errors

#### QuotaExceededError
```
DOMException: Quota exceeded
```

**Solution:**
```javascript
// Implement storage cleanup
async cleanupOldDocuments() {
  const db = await openDB('dlux-docs', 1);
  const tx = db.transaction('documents', 'readwrite');
  
  // Get all documents
  const docs = await tx.store.getAll();
  
  // Sort by last modified
  docs.sort((a, b) => 
    new Date(a.lastModified) - new Date(b.lastModified)
  );
  
  // Keep only recent 50 documents
  const toDelete = docs.slice(0, docs.length - 50);
  
  for (const doc of toDelete) {
    await tx.store.delete(doc.id);
  }
  
  await tx.done;
}

// Handle quota errors
async saveWithQuotaHandling(data) {
  try {
    await this.saveToIndexedDB(data);
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      console.log('Storage full, cleaning up old documents');
      await this.cleanupOldDocuments();
      
      // Retry save
      await this.saveToIndexedDB(data);
    } else {
      throw error;
    }
  }
}
```

### 5. Y.js Observer Errors

#### Infinite Loop in Observers
```
Maximum call stack size exceeded
```

**Solution:**
```javascript
// Use recursion protection flags
const metadataObserver = (event) => {
  event.keysChanged.forEach(key => {
    const value = this.ydoc.getMap('metadata').get(key);
    
    switch(key) {
      case 'title':
        // Prevent recursion with flag
        if (!this._isUpdatingTitle) {
          this._isUpdatingTitle = true;
          this.titleInput = value || '';
          this.$nextTick(() => {
            this._isUpdatingTitle = false;
          });
        }
        break;
        
      case 'permlink':
        // Bidirectional sync with protection
        if (!this._isUpdatingPermlink) {
          this._isUpdatingPermlink = true;
          this.permlinkInput = value || '';
          this.$nextTick(() => {
            this._isUpdatingPermlink = false;
          });
        }
        break;
    }
  });
};

// Update methods also check flags
updateTitleInYjs(newTitle) {
  if (this._isUpdatingTitle) return;
  
  this.ydoc.transact(() => {
    this.ydoc.getMap('metadata').set('title', newTitle);
  }, 'title-update');
}
```

### 6. Memory Leaks

#### Symptoms
- Browser tab becomes slow over time
- Memory usage continuously increases
- Console errors about detached nodes

**Prevention:**
```javascript
// 1. Proper cleanup in lifecycle hooks
beforeUnmount() {
  // Clear all timers
  if (this.autosaveTimer) {
    clearInterval(this.autosaveTimer);
  }
  if (this.permissionCheckTimer) {
    clearInterval(this.permissionCheckTimer);
  }
  
  // Remove event listeners
  window.removeEventListener('beforeunload', this.handleBeforeUnload);
  document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  
  // Clean up observers before destroying Y.js
  this.cleanupObservers();
  
  // Destroy editors
  if (this.bodyEditor && !this.bodyEditor.isDestroyed) {
    this.bodyEditor.destroy();
  }
  
  // Disconnect providers
  if (this.provider) {
    this.provider.disconnect();
    this.provider.destroy();
  }
  
  // Clear Y.js document
  if (this.ydoc) {
    this.ydoc.destroy();
  }
  
  // Clear references
  this.bodyEditor = null;
  this.provider = null;
  this.ydoc = null;
}

// 2. Use markRaw for non-reactive objects
created() {
  // Prevent Vue from making editor reactive
  this.bodyEditor = markRaw(new Editor({...}));
}

// 3. Clean up event handlers properly
this.provider.on('status', this.handleStatus);
// Later in cleanup:
this.provider.off('status', this.handleStatus);
```

## Error Recovery Strategies

### 1. Graceful Degradation
```javascript
// Fallback to local-only mode on connection failure
async initializeDocument() {
  try {
    // Try collaborative mode
    await this.connectCollaborative();
  } catch (error) {
    console.warn('Collaborative mode failed, falling back to local', error);
    
    // Initialize local-only mode
    this.initializeLocalMode();
    
    // Show user notification
    this.showNotification({
      type: 'warning',
      message: 'Working offline. Changes will sync when connection is restored.'
    });
  }
}
```

### 2. Auto-Recovery with User Notification
```javascript
// Implement recovery with status updates
class DocumentRecovery {
  constructor(component) {
    this.component = component;
    this.recoveryAttempts = 0;
    this.maxAttempts = 3;
  }
  
  async attemptRecovery(error) {
    this.recoveryAttempts++;
    
    this.component.showNotification({
      type: 'info',
      message: `Attempting recovery (${this.recoveryAttempts}/${this.maxAttempts})...`
    });
    
    try {
      // Save current content
      const backup = {
        title: this.component.titleInput,
        body: this.component.bodyEditor.getHTML(),
        metadata: this.component.extractMetadata()
      };
      
      // Reinitialize document
      await this.component.reinitializeDocument();
      
      // Restore content
      await this.component.restoreFromBackup(backup);
      
      this.component.showNotification({
        type: 'success',
        message: 'Document recovered successfully'
      });
      
      this.recoveryAttempts = 0;
    } catch (recoveryError) {
      if (this.recoveryAttempts >= this.maxAttempts) {
        this.handleRecoveryFailure(backup);
      } else {
        // Try again
        setTimeout(() => this.attemptRecovery(error), 2000);
      }
    }
  }
  
  handleRecoveryFailure(backup) {
    // Save to local storage as last resort
    localStorage.setItem('dlux-recovery-backup', JSON.stringify({
      timestamp: new Date().toISOString(),
      data: backup
    }));
    
    this.component.showNotification({
      type: 'error',
      message: 'Recovery failed. Your work has been saved locally.',
      action: {
        label: 'Download Backup',
        handler: () => this.downloadBackup(backup)
      }
    });
  }
}
```

### 3. Diagnostic Logging
```javascript
// Enhanced error logging for debugging
class ErrorLogger {
  static logError(error, context) {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      context: context,
      browser: navigator.userAgent,
      state: {
        authenticated: !!this.username,
        documentLoaded: !!this.currentFile,
        connectionStatus: this.provider?.status,
        permissionLevel: this.currentPermissionLevel
      }
    };
    
    console.error('DLUX Error:', errorInfo);
    
    // Send to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToErrorTracking(errorInfo);
    }
  }
  
  static sendToErrorTracking(errorInfo) {
    // Integration with Sentry, LogRocket, etc.
    if (window.Sentry) {
      window.Sentry.captureException(new Error(errorInfo.message), {
        contexts: {
          dlux: errorInfo
        }
      });
    }
  }
}
```

## Best Practices for Error Prevention

1. **Always validate before operations**
2. **Use try-catch blocks for async operations**
3. **Implement proper cleanup in lifecycle hooks**
4. **Add recursion protection to observers**
5. **Cache permissions to reduce API calls**
6. **Use transaction origin tags for debugging**
7. **Test error scenarios during development**
8. **Monitor errors in production**
9. **Provide clear user feedback**
10. **Implement automatic recovery where possible**