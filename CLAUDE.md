# DLUX IOV - Claude Development Guide

## Project Overview
DLUX IOV is a collaborative document editing platform built with TipTap editor, Y.js for real-time collaboration, and offline-first architecture. The project implements a sophisticated two-tier collaboration system supporting both local and cloud-based document editing.

## Architecture Overview

### Core Technologies
- **TipTap Editor v3**: Rich text editing with ProseMirror (using v3.0.0+)
- **Y.js**: Conflict-free replicated data types (CRDT) for collaboration
- **IndexedDB**: Local persistence and offline capabilities
- **WebSocket/WebRTC**: Real-time synchronization for cloud documents
- **DLUX/Hive Authentication**: Blockchain-based permissions with 24-hour expiration

### TipTap v3 Migration Notes
This project uses TipTap v3, which has several important changes from v2:

1. **Collaboration Parameter Change**: 
   - v2: `fragment: 'fieldName'`
   - v3: `field: 'fieldName'` ✅

2. **Undo/Redo Requires Pro Extension**:
   - v3 requires `@tiptap-pro/extension-collaboration-history` for undo/redo functionality
   - Without the Pro extension, undo/redo commands will not work with Collaboration

3. **Import Changes**:
   - All extensions now use `@tiptap/extension-*` naming convention
   - Core is imported from `@tiptap/core`

4. **Extension API**:
   - More modular approach with individual extension imports
   - StarterKit still available but requires explicit history: false when using Collaboration

### Two-Tier Collaboration Strategy
1. **Tier 1**: Local editing with Y.js + IndexedDB + Collaboration extension (no CollaborationCursor)
2. **Tier 2**: Cloud editing with Y.js + IndexedDB + WebSocket + Collaboration + CollaborationCursor

## Key Design Principles

### 1. Offline-First with Immediate Y.js Creation
- Create Y.js documents immediately on editor initialization
- Include Collaboration extension from start for all editors
- Use temp document strategy to avoid draft clutter
- Only persist to drafts when user shows intent (typing, saving)

### 2. Document Name vs Title Content Separation
- **Document Name**: Stored in Y.js config metadata (`config.documentName`)
- **Title Content**: Actual content in title editor XmlFragment
- These are distinct concepts that must be handled separately

### 3. Extension Lifecycle Management
- CollaborationCursor extension requires WebSocket provider (cannot be null)
- Use conditional inclusion of CollaborationCursor based on cloud connectivity
- Prevent race conditions with initialization flags

## File Structure

### Main Components
- `js/tiptap-editor-modular.js` - Core TipTap editor implementation
- `TIPTAP_OFFLINE_FIRST_BEST_PRACTICES.md` - Comprehensive architecture documentation

### Key Implementation Patterns

#### Document Creation
```javascript
// Create Y.js document immediately
this.ydoc = new Y.Doc();
this.indexeddbProvider = new IndexeddbPersistence(docId, this.ydoc);

// Store document name in config metadata
setDocumentName(documentName) {
    const config = this.ydoc.getMap('config');
    config.set('documentName', documentName);
    config.set('lastModified', new Date().toISOString());
}
```

#### Editor Configuration

##### ⚠️ TipTap v3 Configuration Changes
In TipTap v3, the Collaboration extension uses `field` instead of the v2 `fragment` parameter:
- **v2**: `fragment: 'content'` 
- **v3**: `field: 'content'` ✅

```javascript
// Tier 1: Local editing (no CollaborationCursor)
const extensions = [
    // CRITICAL: Do not include History extension with Collaboration
    Collaboration.configure({
        document: this.ydoc,
        field: 'content' // v3 uses 'field' instead of 'fragment'
    })
    // No CollaborationCursor - prevents null provider errors
    // Note: undo/redo requires @tiptap-pro/extension-collaboration-history in v3
];

// Tier 2: Cloud editing (with CollaborationCursor)
const extensions = [
    // CRITICAL: Do not include History extension with Collaboration
    Collaboration.configure({
        document: this.ydoc,
        field: 'content' // v3 uses 'field' instead of 'fragment'
    }),
    CollaborationCursor.configure({
        provider: this.websocketProvider // Valid WebSocket provider required
    })
    // Note: undo/redo requires @tiptap-pro/extension-collaboration-history in v3
];
```

## Permissions & Authentication System

### Four-Tier Permission Model
1. **`readonly`**: View and connect permissions only (read-only access)
2. **`editable`**: View and edit document content  
3. **`postable`**: Full access including edit and publish to Hive blockchain
4. **`owner`**: Full access including edit, publish, and permissions management

### Authentication Architecture
- **Local Operations**: DLUX username only (permissionless for drafts)
- **Collaborative Operations**: Full Hive blockchain authentication required
- **24-Hour Expiration**: Authentication headers expire every 23 hours
- **Session Caching**: User-specific permission caching with automatic expiration

### Authentication Headers Structure
```javascript
{
  'x-account': 'dlux_username',        // DLUX/Hive username
  'x-challenge': '1640995200',         // Unix timestamp (23-hour validity)
  'x-pubkey': 'STM8...',              // Hive public key (posting key recommended)
  'x-signature': 'SIG_K1_...'         // Cryptographic signature of challenge
}
```

### API Endpoints
**Base URL**: `https://data.dlux.io/api`

#### System Endpoints
- `GET /system/versions` - Get system and package version information

#### Collaboration Endpoints
- `GET /collaboration/documents` - List user's collaborative documents
- `POST /collaboration/documents` - Create new collaborative document
- `DELETE /collaboration/documents/{owner}/{permlink}` - Delete document
- `GET /collaboration/info/{owner}/{permlink}` - Get document metadata
- `GET /collaboration/stats/{owner}/{permlink}` - Get document statistics
- `GET /collaboration/activity/{owner}/{permlink}` - Get document activity log
- `GET /collaboration/permissions/{owner}/{permlink}` - Get document permissions - owner only
- `POST /collaboration/permissions/{owner}/{permlink}` - Grant user permissions - owner only
- `DELETE /collaboration/permissions/{owner}/{permlink}/{account}` - Revoke permissions - owner only

permissions tiers include readonly editable postable and owner

#### WebSocket Endpoint
- `wss://data.dlux.io/collaboration/{owner}/{permlink}` - Real-time collaboration

### Permission Validation Patterns
```javascript
// Check current user's permission level
getCurrentUserPermission() {
  if (this.selectedDoc.owner === this.account) {
    return 'postable'; // Owners have full permissions
  }
  const userPermission = this.permissions.find(perm => perm.account === this.account);
  return userPermission ? userPermission.permission_type : null;
}

// Validate specific actions
canUserPost() {
  return this.getCurrentUserPermission() === 'postable';
}
```

### Caching Strategy
- **Session Storage**: `collaborationAuthHeaders_${account}` (23-hour expiration)
- **Permission Cache**: `collaborativePermission_${account}_${documentPath}`
- **Automatic Refresh**: Headers regenerated on expiration or force refresh
- **Graceful Degradation**: Falls back to read-only mode without authentication

## Development Guidelines

### Testing Commands
Run these commands to ensure code quality:
```bash
# No specific test commands identified - check package.json for available scripts
npm run lint       # If available
npm run typecheck  # If available
npm test          # If available
```

### Code Conventions
- Follow existing patterns in the codebase
- Use consistent naming for Y.js document management
- Implement proper error handling for collaboration features
- Maintain separation between document metadata and content

### Critical Implementation Points
1. **Never create CollaborationCursor with null provider** - causes runtime errors
2. **Always use immediate Y.js document creation** - prevents synchronization issues
3. **Store document names in Y.js config metadata** - ensures persistence across sessions
4. **Use initialization flags** - prevents race conditions during editor setup
5. **Implement temp document strategy** - avoids cluttering drafts with unused documents
6. **Disable History extension when using Collaboration** - TipTap requirement for conflict-free editing
7. **Use Collaboration extension's built-in undo/redo** - instead of separate History extension

## History and Undo/Redo Implementation

### ⚠️ IMPORTANT: TipTap v3 Undo/Redo Limitation
**Undo/Redo functionality requires the Pro extension `@tiptap-pro/extension-collaboration-history` in TipTap v3**. Without this paid extension, undo/redo commands will not work properly with the Collaboration extension.

### Core Principles
1. **NEVER use History extension with Collaboration** - Must disable in StarterKit
2. **Y.js manages undo/redo** - Through the Collaboration extension (requires Pro extension in v3)
3. **Undo/redo disabled** - Not available without Pro extension

### Current Implementation (TipTap v3)

```javascript
// Editor Configuration (BOTH Tier 1 and Tier 2)
StarterKit.configure({ 
    history: false // CRITICAL: Must be false when using Collaboration
}),
Collaboration.configure({
    document: yjsDoc,
    field: 'title' // v3 uses 'field' instead of v2's 'fragment'
})

// Undo/Redo NOT IMPLEMENTED
// Requires @tiptap-pro/extension-collaboration-history
```

### To Enable Undo/Redo (Requires Pro License)

```javascript
// Install Pro extension
npm install @tiptap-pro/extension-collaboration-history @hocuspocus/transformer

// Configure with Pro extension
import { CollaborationHistory } from '@tiptap-pro/extension-collaboration-history'

const editor = new Editor({
  extensions: [
    StarterKit.configure({ history: false }),
    Collaboration.configure({
        document: yjsDoc,
        field: 'title'
    }),
    CollaborationHistory.configure({
        provider, // Your WebSocket provider
    }),
  ],
})

// Then you can use:
editor.commands.undo()
editor.commands.redo()
editor.commands.saveVersion('Version Name')
editor.commands.revertToVersion(versionNumber)
```

**Redo not available**
- Cause: State tracking issues
- Solution: Properly check with `can().undo()` and `can().redo()`

### Best Practices
- ✅ Always disable History extension with Collaboration
- ✅ Use simple command execution (no chaining)
- ✅ Let Y.js manage the undo stack automatically
- ✅ Handle destroyed editor checks before commands
- ✅ Update UI state with requestAnimationFrame

## Common Issues and Solutions

### Race Conditions
- Use `isInitializingEditors` flag during editor creation
- Clear flag after 500ms delay to allow TipTap initialization events
- Prevent premature temp document creation during initialization

### Provider Management
- Check provider status before using CollaborationCursor
- Implement fallback strategies for offline scenarios
- Handle provider connection/disconnection gracefully

### Document Persistence
- Only persist to IndexedDB when user shows intent
- Use Y.js config for metadata storage
- Implement proper cleanup for temporary documents

## Y.js Document Lifecycle Patterns

> **Note**: All code examples use TipTap v3 syntax with `field` parameter instead of v2's `fragment`.

### 1. Temp Document Strategy
```javascript
// Create Y.js document immediately but mark as temporary
async createDocument(file, tier) {
    const ydoc = new Y.Doc();
    this.initializeSchema(ydoc);
    
    if (tier === TierDecisionManager.TierType.LOCAL && (!file || !file.id)) {
        // Create temp document without IndexedDB until user shows intent
        this.component.isTemporaryDocument = true;
        this.component.tempDocumentId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    return ydoc;
}
```

### 2. Intent-Based Persistence
```javascript
onUpdate: ({ editor }) => {
    // Only create IndexedDB persistence when user shows REAL intent
    if (this.component.isTemporaryDocument && !this.component.indexeddbProvider) {
        const hasRealContent = this.component.hasContentToSave();
        if (hasRealContent) {
            this.component.debouncedCreateIndexedDBForTempDocument();
        }
    }
}
```

### 3. onSynced Callback Patterns
```javascript
// IndexedDB synchronization
async setupIndexedDBWithOnSynced(ydoc, documentId) {
    const persistence = new IndexeddbPersistence(documentId, ydoc);
    
    return new Promise((resolve) => {
        persistence.once('synced', () => {
            // Extract document name from Y.js config (not content)
            const yjsDocumentName = ydoc.getMap('config').get('documentName');
            if (yjsDocumentName && this.component.currentFile) {
                this.component.currentFile.name = yjsDocumentName;
            }
            resolve(persistence);
        });
    });
}

// WebSocket synchronization
onSynced() {
    this.component.connectionStatus = 'connected';
    this.component.lastSyncTime = new Date();
    
    // Update Y.js config with sync status
    yjsDoc.getMap('config').set('lastWebSocketSync', new Date().toISOString());
    yjsDoc.getMap('config').set('cloudSyncActive', true);
}
```

### 4. Editor Lifecycle Management
```javascript
// CRITICAL: Create new editors BEFORE destroying old ones
async upgradeEditors(yjsDoc, webSocketProvider) {
    // Create new editors first
    const newEditors = await this.editorFactory.createTier2Editors(yjsDoc, webSocketProvider);
    
    // Wait for new editors to initialize with Y.js content
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Destroy old editors AFTER new ones are ready
    if (this.component.titleEditor) {
        this.component.titleEditor.destroy();
    }
    
    // Replace editor references
    this.component.titleEditor = newEditors.titleEditor;
}
```

### 5. Collaborative Upgrade Patterns
```javascript
// Offline-first: IndexedDB loads immediately, WebSocket upgrades in background
async setupCloudPersistence(yjsDoc, file) {
    // Load IndexedDB content immediately for instant editing
    const indexedDB = await this.setupIndexedDBWithOnSynced(yjsDoc, file.id);
    
    // Connect WebSocket in background
    const webSocketPromise = this.setupWebSocketWithOnSynced(yjsDoc, file);
    
    webSocketPromise.then(webSocket => {
        if (webSocket) {
            // Upgrade to Tier 2 editors when cloud connection is ready
            this.upgradeToCloudEditors(yjsDoc, webSocket);
        }
    });
    
    return { indexedDB, webSocket: null };
}
```

### 6. Timing Coordination Patterns
```javascript
// nextTick for Vue reactivity
this.$nextTick(() => {
    // Force Vue reactivity update after Y.js changes
    console.log('Vue reactivity updated:', this.postTitle);
});

// Delayed updates to prevent race conditions
setTimeout(() => {
    this.loadContentFromYDoc();
}, 500);

// Initialization flags to prevent premature operations
if (this.component.isInitializingEditors) {
    return; // Skip operations during initialization
}
```

## Best Practices Summary
1. Create Y.js documents immediately, not lazily
2. Use two-tier system for collaboration features  
3. Store document metadata in Y.js config
4. Implement proper provider management
5. Handle initialization timing carefully
6. Follow TipTap recommended patterns for maximum compatibility
7. **Always validate permissions before collaborative operations**
8. **Cache authentication headers with 23-hour expiration**
9. **Implement graceful degradation for unauthenticated users**
10. **Use session storage for user-specific permission caching**
11. **Use temp document strategy with intent-based persistence**
12. **Always use onSynced callbacks for Y.js provider initialization**
13. **Create new editors before destroying old ones during upgrades**
14. **Coordinate timing with nextTick, setTimeout, and initialization flags**
15. **Let TipTap Collaboration extension handle all content synchronization**

## Security Considerations
- **Never store private keys in browser storage**
- **Always validate authentication headers server-side**
- **Implement 30-second timeout for authentication requests**
- **Use Hive posting key (not active key) for document operations**
- **Automatically refresh expired authentication tokens**
- **Fall back to read-only mode when authentication fails**

## Critical Knowledge Gaps & Missing Patterns

### 1. Error Recovery & Resilience
```javascript
// Y.js Document Corruption Recovery (Missing Pattern)
async recoverCorruptedDocument(documentId) {
  try {
    // 1. Detect Y.js state corruption
    const isCorrupted = this.validateYjsDocumentIntegrity(this.ydoc);
    if (isCorrupted) {
      // 2. Attempt IndexedDB recovery
      await this.restoreFromIndexedDB(documentId);
      // 3. Fallback to server state
      await this.syncFromServer(documentId);
    }
  } catch (error) {
    // 4. Notify user and provide recovery options
    this.handleDocumentRecoveryError(error);
  }
}

// WebSocket Reconnection Strategy (Needs Documentation)
setupReconnectionStrategy(provider) {
  provider.on('connection-lost', () => {
    // Exponential backoff reconnection
    this.reconnectWithBackoff();
  });
}
```

### 2. Memory Management & Performance
```javascript
// Y.js Memory Cleanup (Critical Missing Pattern)
beforeUnmount() {
  // 1. Destroy Y.js documents properly
  if (this.ydoc) {
    this.ydoc.destroy();
    this.ydoc = null;
  }
  
  // 2. Clean up IndexedDB persistence
  if (this.indexeddbProvider) {
    this.indexeddbProvider.clearData();
    this.indexeddbProvider = null;
  }
  
  // 3. Remove WebSocket providers
  if (this.websocketProvider) {
    this.websocketProvider.disconnect();
    this.websocketProvider = null;
  }
  
  // 4. Clear TipTap editors
  [this.titleEditor, this.bodyEditor, this.permlinkEditor].forEach(editor => {
    if (editor) {
      editor.destroy();
    }
  });
}

// Large Document Handling (Missing Pattern)
handleLargeDocument(contentLength) {
  const LARGE_DOCUMENT_THRESHOLD = 100000; // 100KB
  if (contentLength > LARGE_DOCUMENT_THRESHOLD) {
    // Implement content virtualization or chunking
    this.enableVirtualizedEditing();
  }
}
```

### 3. Edge Cases & Boundary Conditions
```javascript
// Multiple Tab Synchronization (Needs Better Handling)
handleMultipleTabConflicts() {
  // Detect multiple tabs editing same document
  const isMultiTab = this.detectMultipleTabAccess();
  if (isMultiTab) {
    // Show warning and coordinate between tabs
    this.showMultiTabWarning();
    this.setupTabCoordination();
  }
}

// Network Quality Adaptation (Missing Pattern)
adaptToNetworkQuality(quality) {
  switch(quality) {
    case 'poor':
      // Reduce sync frequency
      this.websocketProvider.setSyncInterval(10000);
      // Disable real-time cursors
      this.disableCollaborationCursor();
      break;
    case 'excellent':
      // Enable all collaborative features
      this.enableAllCollaborativeFeatures();
      break;
  }
}
```

### 4. Development & Debugging
```javascript
// Collaborative Debug Tools (Missing Infrastructure)
const CollaborativeDebugger = {
  inspectYjsState(ydoc) {
    return {
      documentSize: ydoc.share.size,
      clients: ydoc.awareness.getStates(),
      updates: ydoc.store.pendingStructs,
      conflictResolution: this.analyzeConflicts(ydoc)
    };
  },
  
  monitorProviderHealth(provider) {
    return {
      connectionStatus: provider.connectionStatus,
      lastSync: provider.lastSyncTime,
      pendingOperations: provider.pendingOps,
      errorRate: this.calculateErrorRate(provider)
    };
  }
};

// Performance Monitoring (Missing Pattern)
trackCollaborativePerformance() {
  const metrics = {
    yjsDocumentSize: this.ydoc?.share?.size || 0,
    editorCount: this.getActiveEditorCount(),
    syncLatency: this.measureSyncLatency(),
    memoryUsage: this.estimateMemoryUsage()
  };
  
  // Send to monitoring service
  this.reportPerformanceMetrics(metrics);
}
```

### 5. Accessibility & UX
```javascript
// Collaborative Accessibility (Missing Framework)
const CollaborativeA11y = {
  announceUserJoined(username) {
    // Screen reader announcement
    this.announceToScreenReader(`${username} joined the document`);
  },
  
  manageFocusDuringUpdates() {
    // Preserve focus during collaborative updates
    const currentFocus = document.activeElement;
    // Restore focus after Y.js updates
    this.restoreFocusAfterUpdate(currentFocus);
  },
  
  provideKeyboardShortcuts() {
    // Keyboard navigation for collaborative features
    this.registerShortcut('Ctrl+Shift+U', this.showActiveUsers);
    this.registerShortcut('Ctrl+Shift+H', this.showEditHistory);
  }
};
```

### 6. Data Migration & Versioning
```javascript
// Y.js Schema Migration (Critical Missing Pattern)
const YjsMigrationFramework = {
  async migrateDocument(ydoc, fromVersion, toVersion) {
    const migrationPath = this.getMigrationPath(fromVersion, toVersion);
    
    for (const migration of migrationPath) {
      await this.applyMigration(ydoc, migration);
    }
    
    // Update document version
    ydoc.getMap('config').set('schemaVersion', toVersion);
  },
  
  validateSchemaCompatibility(ydoc) {
    const currentVersion = ydoc.getMap('config').get('schemaVersion');
    const supportedVersion = this.getSupportedSchemaVersion();
    
    return this.isCompatible(currentVersion, supportedVersion);
  }
};
```

## Priority Actions Needed
1. **Implement Y.js error recovery patterns** for document corruption
2. **Add systematic memory cleanup** for all Y.js and TipTap resources  
3. **Create collaborative debugging infrastructure** for development
4. **Add performance monitoring** for collaborative sessions
5. **Implement accessibility framework** for collaborative features
6. **Design Y.js schema migration system** for future updates

## TipTap v3 Specific Best Practices

### 1. Collaboration Extension Configuration
```javascript
// ✅ CORRECT: TipTap v3 syntax
Collaboration.configure({
    document: yjsDoc,
    field: 'content' // v3 parameter name
})

// ❌ WRONG: TipTap v2 syntax
Collaboration.configure({
    document: yjsDoc,
    fragment: 'content' // v2 parameter name - will not work in v3
})
```

### 2. Extension Imports
```javascript
// ✅ CORRECT: TipTap v3 imports
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'

// All extensions follow @tiptap/extension-* pattern
```

### 3. History Extension Handling
```javascript
// When using Collaboration in v3, ALWAYS disable history
StarterKit.configure({
    history: false // Required in v3 when using Collaboration
})

// For undo/redo functionality, you need the Pro extension:
// import { CollaborationHistory } from '@tiptap-pro/extension-collaboration-history'
```

### 4. Type Definitions (TypeScript)
```typescript
// v3 has improved TypeScript support
import type { Editor } from '@tiptap/core'
import type { Doc } from 'yjs'

interface EditorConfig {
    yjsDoc: Doc
    field: string // Note: 'field' not 'fragment'
}
```

### 5. Editor Creation Pattern
```javascript
// v3 pattern for creating collaborative editor
const editor = new Editor({
    extensions: [
        StarterKit.configure({ history: false }),
        Collaboration.configure({
            document: yjsDoc,
            field: 'content' // v3 syntax
        }),
        // Only include if you have a valid WebSocket provider
        ...(websocketProvider ? [
            CollaborationCursor.configure({
                provider: websocketProvider
            })
        ] : [])
    ],
    content: '', // Let Y.js handle content
    onCreate: ({ editor }) => {
        // v3 lifecycle hook
    },
    onUpdate: ({ editor }) => {
        // v3 lifecycle hook
    }
})
```

### 6. Common v2 → v3 Migration Issues

1. **Parameter Naming**: Always use `field` instead of `fragment`
2. **Undo/Redo**: Built-in undo/redo with Collaboration requires Pro extension
3. **Import Paths**: All imports use `@tiptap/` prefix
4. **Extension Configuration**: More strict type checking in v3
5. **Lifecycle Hooks**: Some hooks have been renamed or restructured

### 7. v3-Specific Debugging
```javascript
// Check collaboration field configuration
console.log('Collaboration field:', editor.extensionManager.extensions
    .find(ext => ext.name === 'collaboration')
    ?.options.field) // Should show your field name, not undefined
```