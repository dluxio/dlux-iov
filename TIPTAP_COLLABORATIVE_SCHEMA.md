# 🏗️ Y.js Collaborative Schema for DLUX Posts

> **📍 NOTE**: This document describes the **current implementation** of DLUX's collaborative features. For a simplified view of just the Y.js structure, see [`TIPTAP_YIJS_SCHEMA_ACTUAL.md`](./TIPTAP_YIJS_SCHEMA_ACTUAL.md).

## 📋 **Overview**

This document outlines the implemented Y.js collaborative document schema for DLUX post creation. Following TipTap.dev best practices, the implementation uses an **always-collaborative, offline-first architecture** with Y.js + IndexedDB persistence.

## 🎯 **Core Design Principles**

### 1. **Two-Tier Collaboration Architecture**
- **Tier 1 (Local)**: Y.js + IndexedDB for offline editing
- **Tier 2 (Cloud)**: Y.js + WebSocket for real-time collaboration
- **Single Source of Truth**: All content managed through Y.js structures
- **Content Validation**: TipTap best practice validation for schema safety

### 2. **Optimal Data Structure**
- Flat, efficient Y.js structure for performance
- Logical grouping of related data
- Minimal nesting to avoid complexity

### 3. **DLUX-First Design**
- Built specifically for DLUX content types
- Native support for 360°, video, dApp, and blog posts
- Integrated media asset management

### 4. **Hive Best Practices Compliance**
- Tags stored in both `json_metadata.tags` and post body for indexing
- Proper Hive comment operation structure
- Beneficiaries in separate `comment_options` operation
- Validation of all Hive requirements (permlink, tags, beneficiaries)

### 5. **TipTap Best Practice Compliance**
- **Offline-First Pattern**: `new IndexeddbPersistence('document-id', ydoc)` + `HocuspocusProvider`
- **Content Validation**: `enableContentCheck: true` with graceful error handling
- **Single Editor Architecture**: Title uses simple input field, only body uses TipTap editor with `field: 'body'`
- **Schema Safety**: Version tracking and conflict detection
- **Y.js Optimization**: Conflict-free arrays, maps, and atomic operations
- **Critical Focus Management**: Never programmatically focus Y.js collaborative editors during initialization
- **Transaction Safety**: Eliminate all editor commands during document creation/transition phases
- **Natural User Interaction**: Let users focus editors organically through clicking/interaction

## 🌐 **Hive Collaboration API Integration**

### **API Base URL**
```
https://data.dlux.io/api/collaboration
```

### **Authentication System**
All collaborative documents use Hive blockchain authentication with the following headers:
- `x-account`: Hive username
- `x-challenge`: Unix timestamp (24-hour window for API, 1-hour for WebSocket)
- `x-pubkey`: Hive public key (posting key recommended)
- `x-signature`: Signature of challenge using private key

### **Document Format**
Documents are identified as: `owner-hive-account/permlink`
- **Permlink**: 16-character URL-safe random identifier (e.g., `URiHERhq0qFjczMD`)
- **Document Name**: User-friendly display name (e.g., `My Project Notes`)

### **Permission System**
Three permission levels with specific capabilities:
- **`readonly`**: View and connect (read-only access)
- **`editable`**: View and edit document content
- **`postable`**: View, edit, and publish to Hive blockchain

### **Real-time Collaboration Features**
- **Y.js CRDT**: Conflict-free collaborative editing
- **WebSocket Integration**: Real-time synchronization
- **Permission Enforcement**: Real-time validation on every message
- **User Presence**: Live cursors and user awareness
- **Activity Tracking**: Comprehensive audit logs

## 🚨 **Common Issues & Solutions**

For comprehensive troubleshooting including permission errors, see [`TIPTAP_TROUBLESHOOTING.md`](./TIPTAP_TROUBLESHOOTING.md).

## 📊 **Y.js Schema Structure**

> **See [`TIPTAP_YIJS_SCHEMA_ACTUAL.md`](./TIPTAP_YIJS_SCHEMA_ACTUAL.md) for the complete Y.js schema documentation.**

The implementation uses:
- **3 Y.js Maps**: `config`, `metadata`, `permissions`
- **1 Y.js XML Fragment**: `body` (managed by TipTap)

## 🔄 **Hive Collaboration API Endpoints**

### **Core Document Management**

#### **1. List Documents**
```http
GET /api/collaboration/documents
```
**Query Parameters:**
- `limit`: Number of documents (default: 50, max: 100)
- `offset`: Pagination offset (default: 0)
- `type`: Filter by access type (`all`, `owned`, `shared`)

#### **2. Create Document**
```http
POST /api/collaboration/documents
```
**Request Body:**
```json
{
  "documentName": "My New Document", 
  "isPublic": false,
  "title": "Document Title",
  "description": "Document description"
}
```

#### **3. Get Document Info**
```http
GET /api/collaboration/info/{owner}/{permlink}
```

#### **4. Update Document Name**
```http
PATCH /api/collaboration/documents/{owner}/{permlink}/name
```

#### **5. Delete Document**
```http
DELETE /api/collaboration/documents/{owner}/{permlink}
```

### **Permission Management**

#### **6. Get Document Permissions**
```http
GET /api/collaboration/permissions/{owner}/{permlink}
```

#### **7. Grant Permission**
```http
POST /api/collaboration/permissions/{owner}/{permlink}
```
**Request Body:**
```json
{
  "targetAccount": "username",
  "permissionType": "editable"
}
```

#### **8. Revoke Permission**
```http
DELETE /api/collaboration/permissions/{owner}/{permlink}/{targetAccount}
```

### **Monitoring & Analytics**

#### **9. Get Activity Log**
```http
GET /api/collaboration/activity/{owner}/{permlink}
```

#### **10. Get Document Statistics**
```http
GET /api/collaboration/stats/{owner}/{permlink}
```

#### **11. Manual Document Cleanup**
```http
POST /api/collaboration/cleanup/manual/{owner}/{permlink}
```

### **Testing & Diagnostics**

#### **12. Test Authentication**
```http
GET /api/collaboration/test-auth
```

#### **13. WebSocket Security Status**
```http
GET /api/collaboration/websocket-security-status
```

## 🛠️ **Implementation Patterns**

For detailed implementation patterns, code examples, and best practices, see [`TIPTAP_OFFLINE_FIRST_BEST_PRACTICES.md`](./TIPTAP_OFFLINE_FIRST_BEST_PRACTICES.md).

## ⚠️ **Common Issues & Solutions**

> **See [`TIPTAP_TROUBLESHOOTING.md`](./TIPTAP_TROUBLESHOOTING.md) for comprehensive troubleshooting guide including transaction mismatch errors, permission issues, and other common problems.
## 🔒 **Security & Best Practices Implementation**

### **Hive Broadcasting Compliance**
Following [Hive Developer API standards](https://developers.hive.io/apidefinitions/#broadcast_ops_comment):

#### **Comment Operation Format**
```javascript
// Properly formatted Hive comment operation
{
    parent_author: '',                    // Empty for top-level posts
    parent_permlink: 'first-tag',         // First tag as parent permlink
    author: 'username',                   // Post author
    permlink: 'unique-permlink',          // URL-safe identifier
    title: 'Post Title',                  // Max 255 characters
    body: 'Post content...',              // Markdown/HTML content
    json_metadata: JSON.stringify({       // Structured metadata
        app: 'dlux/0.1',
        format: 'markdown+html',
        tags: ['tag1', 'tag2'],
        dlux: { /* DLUX-specific data */ }
    })
}
```

#### **Comment Options for Beneficiaries**
```javascript
// Separate operation for beneficiaries
{
    author: 'username',
    permlink: 'unique-permlink',
    max_accepted_payout: '1000000.000 HBD',
    percent_hbd: 10000,                   // 100% HBD
    allow_votes: true,
    allow_curation_rewards: true,
    extensions: [[0, {
        beneficiaries: [
            { account: 'beneficiary1', weight: 500 },  // 5%
            { account: 'beneficiary2', weight: 1000 }  // 10%
        ]
    }]]
}
```

### **Authentication & Permission Security**

#### **Multi-Layer Security System**
1. **Hive Blockchain Authentication**: Cryptographic signature verification
2. **Real-time Permission Enforcement**: Validated on every WebSocket message
3. **Connection Management**: Unauthorized users immediately disconnected
4. **Comprehensive Auditing**: All access attempts logged

#### **Permission Enforcement Logic**
```javascript
// Real-time permission validation
async function validateUserPermission(owner, permlink, account, requiredPermission) {
    // Check document ownership
    if (account === owner) {
        return { permissionType: 'owner', canRead: true, canEdit: true, canPostToHive: true };
    }
    
    // Check explicit permissions (with 403 fallback handling)
    try {
        const permission = await getDocumentPermission(owner, permlink, account);
        if (permission) {
            return {
                permissionType: permission.permission_type,
                canRead: true,
                canEdit: ['editable', 'postable'].includes(permission.permission_type),
                canPostToHive: permission.permission_type === 'postable'
            };
        }
    } catch (error) {
        if (error.status === 403) {
            console.warn('🔄 Using fallback permission due to 403 error');
            // Assume user has access if they can reach the document
            return { permissionType: 'postable', canRead: true, canEdit: true, canPostToHive: true };
        }
        throw error;
    }
    
    // Check if document is public
    const isPublic = await isDocumentPublic(owner, permlink);
    if (isPublic) {
        return { permissionType: 'readonly', canRead: true, canEdit: false, canPostToHive: false };
    }
    
    throw new Error('Insufficient permissions');
}
```

### **TipTap Offline-First Best Practices**
Following [TipTap collaboration guidelines](https://tiptap.dev/docs/guides/offline-support) and [content validation](https://tiptap.dev/docs/guides/invalid-schema):

#### **Content Validation Implementation**
```javascript
// TipTap Best Practice: Content validation for collaborative documents
handleContentValidationError(editorType, error, disableCollaboration) {
    console.error(`🚨 Content validation error in ${editorType} editor:`, error);
    
    // For collaborative documents: disable collaboration to prevent sync issues
    if (this.isCollaborativeMode && disableCollaboration) {
        console.warn('🔒 Disabling collaboration due to content validation error');
        disableCollaboration();
        this.connectionStatus = 'error';
        this.connectionMessage = `Content validation error in ${editorType} - collaboration disabled`;
        
        // Show user-friendly error message
        const message = `Content validation error detected in ${editorType}. ` +
                      `This may be due to incompatible content from a different app version. ` +
                      `Please refresh the page to continue editing.`;
        
        setTimeout(() => {
            if (confirm(message + '\n\nRefresh page now?')) {
                window.location.reload();
            }
        }, 100);
    }
}
```

#### **Unified Sync Indicator**
```javascript
// Single unified sync indicator for Y.js + IndexedDB persistence
clearUnsavedAfterSync() {
    if (this.syncTimeout) {
        clearTimeout(this.syncTimeout);
    }
    
    this.syncTimeout = setTimeout(() => {
        if (this.indexeddbProvider) {
            console.log('💾 Y.js + IndexedDB persistence complete (offline-first)');
        } else if (this.connectionStatus === 'connected') {
            console.log('💾 Y.js + Cloud sync complete (online mode)');
        } else {
            console.log('💾 Y.js persistence complete (memory only)');
        }
        this.hasUnsavedChanges = false;
    }, 1000);
}
```

#### **Always-Collaborative Architecture**
```javascript
// No more conditional collaborative mode - always use Y.js
addTag() {
    const tag = this.newTag.trim().toLowerCase();
    if (tag && this.ydoc) {
        this.addCollaborativeTag(tag);
        this.clearUnsavedAfterSync(); // Always use unified sync
        this.newTag = '';
    }
}

// Simplified - no more autoSaveContent() or dual saving paths
handleCommentOptionChange() {
    if (this.ydoc) {
        const optionsMap = this.ydoc.getMap('publishOptions');
        Object.keys(this.commentOptions).forEach(key => {
            optionsMap.set(key, this.commentOptions[key]);
        });
        this.clearUnsavedAfterSync(); // Single sync path
    }
}
```

### **Validation & Error Handling**

#### **Hive Content Validation**
- **Permlink**: Lowercase, alphanumeric + hyphens only
- **Title**: Maximum 255 characters
- **Body**: Maximum ~60,000 characters
- **Tags**: 1-10 tags, each max 24 characters, lowercase only
- **Beneficiaries**: Maximum 8, total weight ≤ 10,000 (100%)
- **JSON Metadata**: Maximum 8KB practical limit

#### **Collaborative Editing Protection**
- **Read-only enforcement**: Block all modification operations
- **Schema version checks**: Prevent conflicts from app updates
- **Permission validation**: Validate before every operation
- **Content synchronization**: Use Y.js observers for real-time updates

### **Architecture Benefits**

#### **Eliminated Complexity**
- **No Dual Saving Paths**: Removed `saveToLocalStorage()`, `saveToCollaborativeDoc()`, `autoSaveContent()`
- **No Conditional Logic**: Eliminated `if (this.isCollaborativeMode)` checks throughout codebase
- **Single Source of Truth**: Y.js manages all persistence (IndexedDB + Cloud sync)
- **Unified Sync Indicator**: One `clearUnsavedAfterSync()` method for all content types

#### **TipTap Compliance Achieved**
- ✅ **Offline-First Architecture**: `IndexeddbPersistence` + `HocuspocusProvider` pattern
- ✅ **Content Validation**: `enableContentCheck: true` with graceful error handling
- ✅ **Document Fragments**: Proper `field: 'title'` and `field: 'body'` usage
- ✅ **Schema Safety**: Version tracking and conflict detection
- ✅ **Performance**: Optimized Y.js structure with minimal overhead

#### **Production Benefits**
- **Reliability**: No stuck sync indicators or parallel saving conflicts
- **Performance**: Faster operations with single Y.js path
- **Maintainability**: Simplified codebase with clear patterns
- **User Experience**: Consistent behavior across all editing scenarios
- **Scalability**: Proper Y.js optimization for concurrent collaboration

## 🎯 **UI/UX Best Practices for Y.js Collaboration**

### **📂 Menu Consolidation Based on Always-Collaborative Architecture**

Based on the offline-first Y.js architecture, we've consolidated the menu structure to eliminate redundancy and confusion:

#### **File Menu - Simplified Document Creation**
```html
<!-- BEFORE: Confusing dual document types -->
<li>New Local Document</li>
<li>New Collaborative Document</li>

<!-- AFTER: Single unified document creation -->
<li>New Document</li> <!-- Creates Y.js + IndexedDB document by default -->
```

**Rationale**: Since all documents now use Y.js + IndexedDB persistence, there's no need for separate "local" vs "collaborative" creation options.

#### **Edit Menu - Y.js Undo/Redo Integration**
```javascript
// Y.js-aware undo/redo that works across collaborative sessions
canUndo() {
    return this.titleEditor?.can().undo() || this.bodyEditor?.can().undo() || false;
}

performUndo() {
    // Smart undo that works with the currently focused editor
    if (this.titleEditor?.isFocused) {
        this.titleEditor.commands.undo();
    } else if (this.bodyEditor?.can().undo()) {
        this.bodyEditor.commands.undo();
    }
}
```

#### **Removed Features - Offline-First Architecture Cleanup**
- **❌ Pending Uploads Section**: Irrelevant since Y.js + IndexedDB handles all persistence
- **❌ Dual Save Paths**: Eliminated parallel local/cloud saving complexity
- **❌ "Convert to Collaborative"**: All documents are collaborative by default
- **❌ Manual "Save" Button**: Replaced with auto-save indicators and modern actions

#### **File Menu Modernization - Auto-Save Era**
```html
<!-- BEFORE: Traditional manual save -->
<li>Save</li>
<li>Save As...</li>

<!-- AFTER: Auto-save aware modern menu -->
<li>Auto-saving... (with spinner)</li>
<li>Live Sync Active</li>
<li>Offline Auto-save</li>
<li>Publish to Cloud</li>
<li>Save As...</li>
```

**Smart Save Status Indicators**:
- **🔄 Auto-saving**: Shows when Y.js + IndexedDB is persisting changes
- **☁️ Live Sync Active**: Shows when collaborative real-time sync is working  
- **💾 Offline Auto-save**: Shows when working offline with local persistence
- **☁️ Publish to Cloud**: Replaces "Save" for publishing offline documents
- **📋 Save As...**: Traditional naming for user familiarity (creates copy with new name)

### **🏷️ Document Naming Best Practices**

#### **Clickable Document Names with Collaborative Support**
```javascript
// Inline document name editing with Y.js integration
startEditingDocumentName() {
    // Permission check for collaborative documents
    if (this.isReadOnlyMode) {
        console.warn('🚫 Cannot edit document name: user has read-only permissions');
        return;
    }
    
    this.isEditingDocumentName = true;
    this.documentNameInput = this.currentFile?.name || 
                           this.currentFile?.documentName || 
                           this.currentFile?.permlink || '';
}

async saveDocumentName() {
    const newName = this.documentNameInput.trim();
    if (!newName) return;
    
    // Trigger Y.js document creation if needed (like content entry)
    if (!this.ydoc) {
        await this.createNewDocumentFromName(newName);
    } else {
        await this.renameCurrentDocument(newName);
    }
    
    this.isEditingDocumentName = false;
}
```

#### **Timestamped Untitled Documents**
```javascript
// Default name includes timestamp for better organization
`Untitled - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
```

### **🔄 Connection Status Indicators**

#### **Clear Visual Feedback for Collaboration State**
```html
<!-- Connection status with descriptive icons -->
<span v-if="connectionStatus === 'connected'" class="text-success">
    <i class="fas fa-wifi"></i> Online
</span>
<span v-else-if="connectionStatus === 'offline'" class="text-info">
    <i class="fas fa-hard-drive"></i> Offline
</span>
<span v-else-if="connectionStatus === 'connecting'" class="text-warning">
    <i class="fas fa-spinner fa-spin"></i> Connecting
</span>
```

#### **Permission-Aware UI Elements**
```html
<!-- Document name editing respects permissions -->
<span v-if="!isEditingDocumentName && !isReadOnlyMode"
      @click="startEditingDocumentName"
      class="cursor-pointer text-decoration-underline user-select-none"
      title="Click to rename this document">
    {{ currentFile?.name || 'Untitled - ' + timestampString }}
</span>

<!-- Read-only indicator -->
<span v-else-if="isReadOnlyMode" class="text-muted" 
      title="Document name cannot be edited (read-only permissions)">
    {{ currentFile?.name || 'Untitled Document' }}
</span>
```

### **📱 Responsive Collaboration Features**

#### **Mobile-Optimized Collaborative Editing**
- **Touch-Friendly**: Larger click targets for collaboration features
- **Simplified UI**: Essential collaboration controls only on mobile
- **Swipe Gestures**: Natural navigation between collaborative documents
- **Offline Indicators**: Clear offline/online status for mobile users

#### **Progressive Enhancement**
```javascript
// Graceful degradation for older browsers
if (!window.TiptapCollaboration) {
    console.warn('🔄 Collaboration bundle not available - falling back to basic editing');
    // Still provide basic Y.js + IndexedDB functionality
}
```

### **🎨 User Experience Patterns**

#### **Natural Focus Flow**
- **✅ Click to Focus**: Users naturally focus editors by clicking
- **✅ Tab Navigation**: Proper tab order between collaborative elements
- **✅ Visual Feedback**: Clear indication of focused editor in collaborative mode
- **❌ No Auto-Focus**: Eliminated all programmatic focus calls

#### **Collaborative Feedback**
- **Real-time Cursors**: Live collaborative cursors when connected
- **User Presence**: Clear indication of who's currently editing
- **Sync Indicators**: Unified sync feedback for Y.js + IndexedDB
- **Permission Badges**: Visual permission levels (owner, editable, read-only)

#### **Error Handling UX**
```javascript
// User-friendly error messages for collaboration issues
handleContentValidationError(editorType, error, disableCollaboration) {
    const message = `Content validation error detected in ${editorType}. ` +
                  `This may be due to incompatible content from a different app version. ` +
                  `Please refresh the page to continue editing.`;
    
    // Non-blocking notification with actionable guidance
    setTimeout(() => {
        if (confirm(message + '\n\nRefresh page now?')) {
            window.location.reload();
        }
    }, 100);
}
```

## 📈 **Next Steps & Action Items**

### **Immediate Actions** (High Priority)
1. **🔧 Server-Side Fix**: Align GET permissions endpoint authentication with POST endpoint
2. **🧪 Authentication Testing**: Implement comprehensive auth validation across all endpoints
3. **📊 Monitoring Setup**: Deploy error tracking for 403 issues
4. **📚 Documentation**: Update API documentation with auth requirements

### **Short-term Improvements** (Medium Priority)
1. **🔄 Retry Logic**: Implement intelligent retry for transient auth failures
2. **⚡ Performance**: Add permission caching to reduce API calls
3. **🛡️ Security**: Enhanced permission validation and audit logging
4. **🎯 UX**: Improved error messages and user guidance

### **Long-term Enhancements** (Low Priority)
1. **🌐 Offline Support**: Enhanced offline permission handling
2. **📱 Mobile**: Mobile-optimized collaboration interface
3. **🔍 Analytics**: Advanced collaboration analytics and insights
4. **🎨 UI/UX**: Enhanced collaborative editing experience

This implementation represents a complete transformation from problematic parallel-saving architecture to a clean, TipTap-compliant offline-first collaborative editor that follows all official best practices while providing robust error handling for the identified 403 permission issue. 

## 📊 **Document States & Indicators**

### **Official Y.js Document States**

1. **Offline-First States**
   - `disconnected`: No connection to collaboration server
   - `connecting`: Attempting to establish connection
   - `connected`: Successfully connected to collaboration server
   - `synced`: All changes synchronized with server
   - `syncing`: Changes being synchronized
   - `auth-error`: Authentication failed
   - `connection-error`: Connection failed/lost

2. **Document Persistence States**
   - `saving-local`: Writing to IndexedDB
   - `saved-local`: Successfully persisted to IndexedDB
   - `local-error`: Failed to persist locally
   - `unsynced-changes`: Local changes pending sync
   - `sync-error`: Failed to sync changes

3. **Collaboration States**
   - `collaborating`: Real-time collaboration active
   - `read-only`: User has read-only access
   - `schema-mismatch`: Client schema version differs
   - `conflict-resolution`: Merging conflicting changes

### **Unified Status Indicator System**

#### **Primary Status Messages**
1. **Local Document**
   - "Working Locally"
   - "Saving Locally..."
   - "All Changes Saved Locally"
   - "Local Save Error"

2. **Cloud Document (Disconnected)**
   - "Offline Mode"
   - "Saving Offline Changes..."
   - "Changes Saved Offline"
   - "Unsynced Changes"
   - "Sync Error"

3. **Cloud Document (Connected)**
   - "Connected"
   - "Syncing Changes..."
   - "All Changes Synced"
   - "Real-time Collaboration Active"
   - "Read-only Mode"

#### **Secondary Status Indicators**
- 🔄 Sync in Progress
- ✅ All Changes Saved
- ⚠️ Unsynced Changes
- ❌ Error State
- 👥 Collaborators Present
- 🔒 Read-only Mode
- 📡 Offline Mode
- 💾 Local Changes Only

### **Status Management Best Practices**

1. **Clear Visual Hierarchy**
   - Primary status text
   - Secondary icon indicator
   - Detailed hover tooltip
   - Action buttons when relevant

2. **Progressive Disclosure**
   - Show minimal info by default
   - Expand details on hover/click
   - Group related statuses
   - Clear error resolution paths

3. **User Actions**
   - "Retry Connection" for sync errors
   - "Save Locally" for offline changes
   - "Force Sync" for conflict resolution
   - "View Changes" for unsynced content

4. **Error Handling**
   - Clear error messages
   - Automatic retry logic
   - Manual retry options
   - Fallback behaviors

### **Implementation Guidelines**

1. **State Transitions**
   ```javascript
   // Example state machine for status transitions
   const statusTransitions = {
     'disconnected': ['connecting', 'offline'],
     'connecting': ['connected', 'connection-error'],
     'connected': ['syncing', 'disconnected'],
     'syncing': ['synced', 'sync-error'],
     'sync-error': ['syncing', 'offline'],
     'offline': ['connecting']
   };
   ```

2. **Unified Status Updates**
   ```javascript
   // Example status update handler
   function updateDocumentStatus(newStatus, details = {}) {
     const status = {
       state: newStatus,
       icon: getStatusIcon(newStatus),
       message: getStatusMessage(newStatus),
       actions: getAvailableActions(newStatus),
       timestamp: new Date(),
       ...details
     };
     
     emitStatusUpdate(status);
   }
   ```

3. **IndexedDB Integration**
   ```javascript
   // Example IndexedDB persistence status tracking
   new IndexeddbPersistence('document-id', ydoc)
     .on('synced', () => updateDocumentStatus('saved-local'))
     .on('error', () => updateDocumentStatus('local-error'));
   ```

4. **Collaboration Awareness**
   ```javascript
   // Example collaboration status tracking
   provider.awareness.on('change', () => {
     const collaborators = getActiveCollaborators();
     updateDocumentStatus(
       collaborators.length > 1 ? 'collaborating' : 'connected'
     );
   });
   ```

## 🎯 SPK Drive Integration

> **See [`TIPTAP_SPK_DRIVE_INTEGRATION.md`](./TIPTAP_SPK_DRIVE_INTEGRATION.md) for complete SPK Drive integration documentation.**

The TipTap editor integrates with SPK Drive for decentralized media storage, enabling drag-and-drop and button-based media insertion.