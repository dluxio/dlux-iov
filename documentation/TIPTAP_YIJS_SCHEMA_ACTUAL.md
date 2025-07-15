# Y.js Schema - Actual Implementation

This document describes the **actual implemented Y.js structure** in the DLUX IOV editor as of v2025.07.07.

## Overview

The DLUX IOV editor uses a simplified Y.js document structure with:
- **3 Y.js Maps**: `config`, `metadata`, `permissions`
- **1 Y.js XML Fragment**: `body` (managed by TipTap)

## Complete Y.js Structure

```javascript
// Y.js Document Structure
ydoc = new Y.Doc()

// 1. CONFIG MAP - Document metadata
ydoc.getMap('config')
  .set('documentName', 'My Document')         // Display name
  .set('lastModified', '2024-01-01T12:00:00Z') // ISO timestamp
  .set('owner', 'username')                    // Document owner

// 2. METADATA MAP - Publishing data  
ydoc.getMap('metadata')
  .set('title', 'Document Title')              // Post title
  .set('tags', ['tag1', 'tag2'])              // Hive tags array
  .set('beneficiaries', [                      // Beneficiaries array
    {account: 'alice', weight: 500}
  ])
  .set('customJson', { app: 'dlux/1.0' })     // Custom JSON metadata
  .set('permlink', 'my-post-url')             // Hive permlink
  .set('allowVotes', true)                     // Comment option
  .set('allowCurationRewards', true)           // Comment option
  .set('maxAcceptedPayout', '1000000.000 SBD') // Comment option
  .set('percentHbd', 10000)                    // Comment option (100%)

// 3. PERMISSIONS MAP - Server-managed (READ-ONLY)
ydoc.getMap('permissions')
  .get('alice')  // Returns: {level: 'editable', timestamp: '...', grantedBy: '...'}
  .get('bob')    // Returns: {level: 'readonly', timestamp: '...', grantedBy: '...'}

// 4. BODY FRAGMENT - Managed by TipTap Editor
// Created automatically via Collaboration extension
// Never access directly - use editor.getHTML(), editor.getText(), etc.
const bodyFragment = ydoc.getXmlFragment('body')
```

## Observer Implementation

The system uses two dedicated Y.js observers:

### Config Observer
Handles document management metadata:
```javascript
this.configObserver = (event) => {
  event.keysChanged.forEach(key => {
    const value = this.ydoc.getMap('config').get(key);
    
    switch(key) {
      case 'documentName':
        // Updates currentFile.name/documentName
        break;
      case 'lastModified':
        // Updates currentFile.lastModified
        break;
      case 'owner':
        // Updates currentFile.owner
        break;
    }
  });
};
```

### Metadata Observer
Handles all publishing-related fields with recursion protection:
```javascript
this.metadataObserver = (event) => {
  event.keysChanged.forEach(key => {
    const value = this.ydoc.getMap('metadata').get(key);
    
    switch(key) {
      case 'title':
        // Updates titleInput (with recursion protection)
        break;
      case 'permlink':
        // Updates permlinkInput (bidirectional with recursion protection)
        break;
      case 'tags':
        // Updates reactiveTags + content.tags
        break;
      case 'beneficiaries':
        // Updates reactiveBeneficiaries + content.beneficiaries
        break;
      case 'customJson':
        // Updates reactiveCustomJson + customJsonString
        break;
      case 'allowVotes':
      case 'allowCurationRewards':
      case 'maxAcceptedPayout':
      case 'percentHbd':
        // Updates reactiveCommentOptions + commentOptions
        break;
    }
  });
};
```

### Permissions Observer (Read-Only)
Monitors server-side permission updates:
```javascript
this.permissionsObserver = (event) => {
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
```

## Key Implementation Details

### 1. Title Field Location
- Title is stored in the `metadata` map (not `config`)
- This groups it with other Hive post attributes
- Title uses a simple `<input>` field, not a TipTap editor

### 2. Recursion Protection
Critical fields use flags to prevent circular updates:
- `title`: Uses `_isUpdatingTitle` flag
- `permlink`: Uses `_isUpdatingPermlink` flag

### 3. User Intent Detection
Any change to any field indicates user intent:
- Metadata changes trigger persistence
- Content changes trigger persistence
- No content validation blocking saves

### 4. File > New Behavior
Complete reset of all fields:
- All Y.js maps cleared
- All Vue reactive properties reset
- New Y.js document created
- Observers reattached

## Permission Levels

The `permissions` map stores user permissions set by the server:

```javascript
// Permission levels (from lowest to highest)
'no-access'   // Cannot view or edit
'readonly'    // View only
'editable'    // View and edit
'postable'    // Edit and publish to Hive  
'owner'       // Full control including permissions
```

## Two-Tier Collaboration

### Tier 1 (Local)
- Y.js + IndexedDB persistence
- Collaboration extension (no CollaborationCaret)
- Offline-first editing

### Tier 2 (Cloud)
- Y.js + IndexedDB + WebSocket provider
- Collaboration + CollaborationCaret extensions
- Real-time multi-user editing

## Important Notes

1. **Never modify the permissions map** - it's server-managed only
2. **Always use transactions with origin tags** for debugging
3. **The body fragment is created automatically** by TipTap's Collaboration extension
4. **Use editor methods to access body content**, never access the fragment directly
5. **All fields in metadata map sync to Hive post operations**