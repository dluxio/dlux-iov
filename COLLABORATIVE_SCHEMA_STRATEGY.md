# 🏗️ Y.js Collaborative Schema for DLUX Posts

## 📋 **Overview**

This document outlines the clean, optimal Y.js collaborative document schema designed specifically for DLUX post creation. Following TipTap.dev best practices, this implementation uses an **always-collaborative, offline-first architecture** with Y.js + IndexedDB persistence and comprehensive content validation.

## 🎯 **Core Design Principles**

### 1. **Always-Collaborative Architecture**
- **Offline-First**: Y.js + IndexedDB persistence for true offline editing
- **Single Source of Truth**: All content managed through Y.js collaborative structures
- **No Dual Modes**: Eliminated local/collaborative distinction for consistency
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
- **Document Fragments**: Separate `field: 'title'` and `field: 'body'` editors
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

## 🚨 **Permission System 403 Error Analysis & Fix Strategy**

### **Root Cause Identified**
During our investigation, we discovered a critical authentication inconsistency:

**Problem Pattern**:
```
🔍 POST /api/collaboration/permissions/{owner}/{permlink} → ✅ SUCCESS (200)
🔍 GET /api/collaboration/permissions/{owner}/{permlink} → ❌ HTTP 403 Forbidden
```

**Technical Issue**: Different authentication requirements between endpoints:
- **Permission Granting** (POST) works with current auth headers
- **Permission Loading** (GET) fails with same auth headers

### **Current Workaround Implementation**
We've implemented intelligent error handling in `js/tiptap-editor-with-file-menu.js`:

```javascript
// Enhanced 403 error handling with diagnostic logging
if (response.status === 403) {
    console.error('🔐 Permission loading failed with HTTP 403');
    console.error('🔍 This indicates server-side authentication inconsistency');
    console.error('📋 Troubleshooting steps:');
    console.error('   1. Verify auth headers are identical to successful POST requests');
    console.error('   2. Check if GET endpoint has different auth requirements');
    console.error('   3. Confirm user has permission to view this document');
    
    // Smart fallback: Assume postable for users who can access documents
    const fallbackPermission = isOwner ? 'owner' : 'postable';
    console.warn(`🔄 Using fallback permission: ${fallbackPermission}`);
    return fallbackPermission;
}
```

### **Comprehensive Fix Strategy**

#### **Phase 1: Server-Side Authentication Alignment** 🔧

**Immediate Action Required**: Align GET permissions endpoint authentication with POST endpoint.

**Investigation Steps**:
1. **Compare Authentication Logic**:
   ```bash
   # Check authentication middleware differences
   GET /api/collaboration/permissions/{owner}/{permlink}  # Current: 403
   POST /api/collaboration/permissions/{owner}/{permlink} # Current: Works
   ```

2. **Verify Auth Header Processing**:
   - Ensure both endpoints use identical authentication middleware
   - Check for case sensitivity in header processing
   - Validate signature verification logic consistency

3. **Database Permission Checks**:
   ```sql
   -- Verify user has permission to view document permissions
   SELECT * FROM collaboration_permissions 
   WHERE owner = ? AND permlink = ? AND account = ?;
   
   -- Check if user is document owner
   SELECT * FROM collaboration_documents 
   WHERE owner = ? AND permlink = ?;
   ```

**Expected Fix**: Modify GET endpoint to use same authentication logic as POST endpoint.

#### **Phase 2: Enhanced Client-Side Error Handling** ✅ **(COMPLETED)**

**Already Implemented**:
- ✅ Detailed 403 diagnostic logging
- ✅ Smart fallback permission logic
- ✅ Owner protection (owners get full permissions despite 403)
- ✅ User notification about server issues
- ✅ Graceful degradation without blocking document access

#### **Phase 3: Authentication Testing & Validation** 🧪

**Test Authentication Endpoint**:
```javascript
// Validate auth configuration
async function testCollaborationAuth() {
    const response = await fetch('/api/collaboration/test-auth', {
        headers: await generateAuthHeaders(username, privateKey),
        credentials: 'omit'
    });
    
    const result = await response.json();
    console.log('🔍 Auth test result:', result);
    return result.success;
}
```

**Permission Testing Matrix**:
```javascript
// Test all permission endpoints with same auth headers
const endpoints = [
    'GET /api/collaboration/permissions/{owner}/{permlink}',
    'POST /api/collaboration/permissions/{owner}/{permlink}',
    'DELETE /api/collaboration/permissions/{owner}/{permlink}/{account}'
];

for (const endpoint of endpoints) {
    await testEndpointAuth(endpoint, authHeaders);
}
```

#### **Phase 4: Production Monitoring & Alerting** 📊

**Error Tracking**:
```javascript
// Track 403 errors for monitoring
if (response.status === 403) {
    // Send to error tracking service
    trackError('collaboration_permission_403', {
        endpoint: '/api/collaboration/permissions',
        user: username,
        document: `${owner}/${permlink}`,
        authHeaders: Object.keys(authHeaders),
        timestamp: new Date().toISOString()
    });
}
```

**Health Check Endpoint**:
```http
GET /api/collaboration/health/permissions
```
Should validate that all permission endpoints work with identical auth.

### **Authentication Implementation Guide**

#### **Frontend Auth Helper** (Updated)
```javascript
import { PrivateKey } from 'hive-tx'

async function generateAuthHeaders(username, privateKey) {
    const challenge = Math.floor(Date.now() / 1000);
    const publicKey = PrivateKey.from(privateKey).createPublic().toString();
    
    const signature = PrivateKey.from(privateKey)
        .sign(Buffer.from(challenge.toString(), 'utf8'))
        .toString();
    
    return {
        'x-account': username,
        'x-challenge': challenge.toString(),
        'x-pubkey': publicKey,
        'x-signature': signature
    };
}

// Usage with proper error handling
async function fetchWithAuth(url, options = {}) {
    const authHeaders = await generateAuthHeaders(username, privateKey);
    
    const response = await fetch(url, {
        ...options,
        headers: {
            ...authHeaders,
            ...options.headers
        },
        credentials: 'omit' // Important for CORS
    });
    
    if (response.status === 403) {
        console.error('🔐 Authentication failed - check server-side auth logic');
        // Implement fallback or retry logic
    }
    
    return response;
}
```

#### **WebSocket Authentication**
```javascript
async function generateWebSocketToken(username, privateKey) {
    const challenge = Math.floor(Date.now() / 1000);
    const publicKey = PrivateKey.from(privateKey).createPublic().toString();
    const signature = PrivateKey.from(privateKey)
        .sign(Buffer.from(challenge.toString(), 'utf8'))
        .toString();
    
    return JSON.stringify({
        account: username,
        challenge: challenge.toString(),
        pubkey: publicKey,
        signature: signature
    });
}

// WebSocket connection with auth
const token = await generateWebSocketToken(username, privateKey);
const provider = new HocuspocusProvider({
    url: 'ws://localhost:1234',
    name: `${owner}/${permlink}`,
    token: token,
    onAuthenticationFailed: () => {
        console.error('🔐 WebSocket authentication failed');
        // Handle auth failure
    }
});
```

### **Server-Side Fix Recommendations**

#### **Authentication Middleware Consistency**
```javascript
// Ensure both endpoints use identical auth middleware
app.get('/api/collaboration/permissions/:owner/:permlink', 
    authenticateHiveUser,  // Same middleware
    validatePermissions,   // Same validation
    getPermissions
);

app.post('/api/collaboration/permissions/:owner/:permlink',
    authenticateHiveUser,  // Same middleware  
    validatePermissions,   // Same validation
    grantPermission
);
```

#### **Permission Validation Logic**
```javascript
async function validatePermissions(req, res, next) {
    const { owner, permlink } = req.params;
    const { account } = req.auth; // From authentication middleware
    
    // Check if user is document owner
    const isOwner = (account === owner);
    
    // Check if user has explicit permission
    const permission = await getDocumentPermission(owner, permlink, account);
    
    // Check if document is public
    const isPublic = await isDocumentPublic(owner, permlink);
    
    if (!isOwner && !permission && !isPublic) {
        return res.status(403).json({
            success: false,
            error: 'Insufficient permissions to access this document'
        });
    }
    
    req.userPermission = {
        isOwner,
        permissionType: isOwner ? 'owner' : (permission?.permission_type || 'readonly'),
        canRead: true,
        canEdit: isOwner || ['editable', 'postable'].includes(permission?.permission_type),
        canPostToHive: isOwner || permission?.permission_type === 'postable'
    };
    
    next();
}
```

### **Testing & Validation Checklist**

#### **Authentication Tests** ✅
- [ ] Test auth headers work identically across all endpoints
- [ ] Verify signature generation and validation
- [ ] Check challenge timestamp validation (24h API, 1h WebSocket)
- [ ] Validate public key verification logic

#### **Permission Tests** ✅
- [ ] Document owners can access all permission endpoints
- [ ] Users with `editable` permission can view permissions
- [ ] Users with `readonly` permission have appropriate access
- [ ] Unauthorized users receive proper 403 responses

#### **Error Handling Tests** ✅
- [ ] 403 errors trigger appropriate fallback logic
- [ ] Users receive helpful error messages
- [ ] Document access isn't blocked by permission loading failures
- [ ] Diagnostic logging provides actionable information

### **Expected Outcomes**

#### **Short-term** (Current Workaround)
- ✅ Users receive correct permissions despite 403 errors
- ✅ Document editing works normally
- ✅ Comprehensive error logging for debugging
- ✅ Graceful degradation maintains user experience

#### **Long-term** (After Server Fix)
- 🎯 All permission endpoints work consistently
- 🎯 No more 403 errors for legitimate users
- 🎯 Clean error logs without workaround messages
- 🎯 Optimal performance without fallback logic

## 📊 **Schema Structure**

### **Core Collaborative Content**
```javascript
// Primary content (Y.XmlFragment for rich text editing)
ydoc.get('title', Y.XmlFragment)        // Post title
ydoc.get('body', Y.XmlFragment)         // Post body content

// Post configuration (Y.Map for structured data)
ydoc.getMap('config')                   // Post configuration
├── postType: String                        // 'blog', 'video', '360', 'dapp', 'remix'
├── version: String                         // '1.0.0'
├── appVersion: String                      // 'dlux/1.0.0'
├── lastModified: String                    // ISO timestamp
└── createdBy: String                       // Original creator

// Advanced publishing options (Y.Map for atomic values only)
ydoc.getMap('publishOptions')           // Atomic publishing settings
├── maxAcceptedPayout: String               // '1000000.000 HBD'
├── percentHbd: Number                      // 10000 = 100% HBD
├── allowVotes: Boolean                     // true
└── allowCurationRewards: Boolean           // true

// Conflict-free collaborative arrays and maps
ydoc.getArray('tags')                   // Conflict-free tag management
ydoc.getArray('beneficiaries')          // Conflict-free beneficiary management  
ydoc.getMap('customJson')               // Granular custom field updates

// Operation coordination and schema versioning
ydoc.getMap('_locks')                   // Operation locks (publishing, etc.)
ydoc.getMap('_metadata')                // Schema versioning and metadata

// Individual asset transform maps (created dynamically)
ydoc.getMap('transform_${assetId}')     // Per-asset conflict-free positioning

// Media assets (Y.Array for ordered collections)
ydoc.getArray('images')                 // Image assets
ydoc.getArray('videos')                 // Video assets  
ydoc.getArray('assets360')              // 360° scene assets
ydoc.getArray('attachments')            // General file attachments

// Video-specific data (Y.Map for video posts)
ydoc.getMap('videoData')                // Video transcoding & streaming
├── transcodeStatus: String                 // 'pending', 'processing', 'completed', 'failed'
├── resolutions: Array                      // Available video resolutions
├── playlist: String                        // M3U8 playlist URL/content
├── duration: Number                        // Video duration in seconds
└── thumbnails: Array                       // Video thumbnail URLs

// Real-time collaboration (Y.Map for user presence)
ydoc.getMap('presence')                 // User presence data
└── [username]: Object                      // Per-user presence info
```

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

#### **6. Get Document Permissions** ⚠️ **(403 Issue)**
```http
GET /api/collaboration/permissions/{owner}/{permlink}
```
**Known Issue**: Returns 403 despite valid authentication
**Workaround**: Client-side fallback logic implemented

#### **7. Grant Permission** ✅ **(Working)**
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

## 🛠️ **Implementation Methods**

### **Offline-First Collaborative Editor Creation**
```javascript
async createOfflineFirstCollaborativeEditors(bundle) {
    // TipTap Best Practice: Always create Y.js document first
    const Y = bundle.Y?.default || bundle.Y;
    this.ydoc = new Y.Doc();
    
    // STEP 1: IndexedDB persistence for offline-first editing
    const IndexeddbPersistence = bundle.IndexeddbPersistence?.default || bundle.IndexeddbPersistence;
    if (IndexeddbPersistence) {
        const docId = this.currentFile?.id || `local_${Date.now()}`;
        this.indexeddbProvider = new IndexeddbPersistence(docId, this.ydoc);
        console.log('💾 IndexedDB persistence enabled for offline editing');
    }
    
    // STEP 2: Initialize collaborative schema
    this.initializeCollaborativeSchema(Y);
    
    // STEP 3: Create TipTap editors with content validation
    this.titleEditor = new Editor({
        element: this.$refs.titleEditor,
        extensions: [
            StarterKit.configure({ history: false }),
            Collaboration.configure({
                document: this.ydoc,
                field: 'title'
            }),
            Placeholder.configure({
                placeholder: this.isReadOnlyMode ? 'Title (read-only)' : 'Enter title...'
            })
        ],
        // TipTap Best Practice: Content validation
        enableContentCheck: true,
        onContentError: ({ editor, error, disableCollaboration }) => {
            this.handleContentValidationError('title', error, disableCollaboration);
        },
        editable: !this.isReadOnlyMode,
        onUpdate: ({ editor }) => {
            if (!this.isReadOnlyMode) {
                this.content.title = editor.getHTML();
                this.hasUnsavedChanges = true;
                this.clearUnsavedAfterSync(); // Unified sync indicator
            }
        }
    });
    
    // Always collaborative mode now
    this.isCollaborativeMode = true;
    this.connectionStatus = 'offline';
}

initializeCollaborativeSchema(Y) {
    console.log('🏗️ Initializing clean DLUX collaborative schema...');
    
    // Schema version tracking for conflict prevention
    const metadata = this.ydoc.getMap('_metadata');
    const currentSchemaVersion = '1.0.0';
    metadata.set('schemaVersion', currentSchemaVersion);
    metadata.set('lastUpdated', new Date().toISOString());
    
    // Core content (TipTap editors with fragments)
    this.ydoc.get('title', Y.XmlFragment);
    this.ydoc.get('body', Y.XmlFragment);
    
    // Conflict-free collaborative structures
    this.ydoc.getArray('tags');
    this.ydoc.getArray('beneficiaries');
    this.ydoc.getMap('customJson');
    this.ydoc.getMap('config');
    this.ydoc.getMap('publishOptions');
    
    // Media arrays
    this.ydoc.getArray('images');
    this.ydoc.getArray('videos');
    this.ydoc.getArray('assets360');
    this.ydoc.getArray('attachments');
    
    console.log('✅ Clean DLUX schema initialized');
}
```

### **Post Type Management**
```javascript
setPostType(postType) {
    const config = this.ydoc.getMap('config');
    config.set('postType', postType);
    config.set('lastModified', new Date().toISOString());
    console.log(`📝 Post type set to: ${postType}`);
}

getPostType() {
    const config = this.ydoc.getMap('config');
    return config.get('postType') || 'blog';
}
```

### **Media Asset Management**
```javascript
addImage(imageData) {
    const images = this.ydoc.getArray('images');
    const imageAsset = {
        id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        hash: imageData.hash,
        filename: imageData.filename,
        type: imageData.type,
        size: imageData.size,
        url: `https://ipfs.dlux.io/ipfs/${imageData.hash}`,
        uploadedBy: this.username,
        uploadedAt: new Date().toISOString(),
        contract: imageData.contract,
        metadata: imageData.metadata || {}
    };
    
    images.push([imageAsset]);
    console.log('🖼️ Image added:', imageAsset.filename);
    return imageAsset.id;
}

addVideo(videoData) {
    const videos = this.ydoc.getArray('videos');
    const videoAsset = {
        id: `vid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        hash: videoData.hash,
        filename: videoData.filename,
        type: videoData.type,
        size: videoData.size,
        url: `https://ipfs.dlux.io/ipfs/${videoData.hash}`,
        uploadedBy: this.username,
        uploadedAt: new Date().toISOString(),
        contract: videoData.contract,
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
}

add360Asset(assetData) {
    const assets360 = this.ydoc.getArray('assets360');
    const asset = {
        id: `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        hash: assetData.hash,
        name: assetData.name,
        type: assetData.type,
        size: assetData.size,
        uploadedBy: this.username,
        uploadedAt: new Date().toISOString(),
        contract: assetData.contract,
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
}
```

### **File Upload Integration**
```javascript
handleFileUpload(fileData) {
    if (!fileData) return null;
    
    console.log('📎 Processing file upload:', fileData);
    
    // Route to appropriate handler based on file type
    if (fileData.type.startsWith('image/')) {
        return this.addImage(fileData);
    } else if (fileData.type.startsWith('video/')) {
        return this.addVideo(fileData);
    } else {
        return this.addAttachment(fileData);
    }
}
```

### **Real-time Observers**
```javascript
setupObservers() {
    // Observe post configuration changes
    const config = this.ydoc.getMap('config');
    config.observe((event) => {
        console.log('⚙️ Post config changed:', event);
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
    
    // Observe user presence
    const presence = this.ydoc.getMap('presence');
    presence.observe((event) => {
        console.log('👥 User presence changed:', event);
        this.updatePresenceUI();
    });
}
```

## 🔄 **Data Synchronization**

### **Parent Component Integration**
```javascript
// Sync collaborative data to parent component
syncToParent() {
    const postData = {
        postType: this.getPostType(),
        images: this.ydoc.getArray('images').toArray(),
        videos: this.ydoc.getArray('videos').toArray(),
        assets360: this.ydoc.getArray('assets360').toArray(),
        attachments: this.ydoc.getArray('attachments').toArray(),
        videoData: this.ydoc.getMap('videoData').toJSON()
    };
    
    this.$emit('collaborative-data-changed', postData);
}

// Handle updates from parent component
updateFromParent(data) {
    if (data.postType) {
        this.setPostType(data.postType);
    }
    
    if (data.assets360) {
        this.sync360Assets(data.assets360);
    }
}
```

## 🎮 **Usage Examples**

### **Creating a Blog Post**
```javascript
// Initialize as blog post
this.setPostType('blog');

// Add images
this.addImage({
    hash: 'QmImage123...',
    filename: 'hero-image.jpg',
    type: 'image/jpeg',
    size: 1024000,
    contract: 'spk-contract-123'
});
```

### **Creating a Video Post**
```javascript
// Initialize as video post
this.setPostType('video');

// Add video
const videoId = this.addVideo({
    hash: 'QmVideo456...',
    filename: 'tutorial.mp4',
    type: 'video/mp4',
    size: 50000000,
    contract: 'spk-contract-456',
    metadata: {
        duration: 120,
        width: 1920,
        height: 1080
    }
});

// Update transcoding status
this.updateVideoTranscoding(videoId, {
    status: 'completed',
    resolutions: ['720p', '1080p'],
    playlist: 'QmPlaylist789...'
});
```

### **Creating a 360° Post**
```javascript
// Initialize as 360° post
this.setPostType('360');

// Add 360° assets
this.add360Asset({
    hash: 'QmAsset789...',
    name: 'floating_cube.obj',
    type: 'model/obj',
    size: 2048000,
    contract: 'spk-contract-789',
    transform: {
        position: { x: 0, y: 1.6, z: -3 },
        rotation: { x: 0, y: 45, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
    },
    properties: {
        interactive: true,
        physics: false
    }
});
```

## 🚀 **Performance Optimizations**

### **1. Efficient Data Access**
- Direct Y.js array/map access without deep nesting
- Minimal observer overhead
- Lazy loading of large assets

### **2. Memory Management**
- Automatic cleanup of unused assets
- Efficient Y.js structure updates
- Debounced parent synchronization

### **3. Network Efficiency**
- Only sync actual changes via Y.js
- Compress large media metadata
- Batch multiple operations

## 🔒 **Security & Permissions**

### **Read-Only Mode**
```javascript
// Disable editing for read-only users
if (this.isReadOnly) {
    // Block all modification methods
    this.setPostType = () => console.warn('Read-only mode');
    this.addImage = () => console.warn('Read-only mode');
    this.addVideo = () => console.warn('Read-only mode');
    this.add360Asset = () => console.warn('Read-only mode');
}
```

### **Permission Validation**
```javascript
// Validate user permissions before operations
validatePermission(operation) {
    if (this.isReadOnly) {
        console.warn(`🚫 Blocked ${operation}: read-only permissions`);
        return false;
    }
    return true;
}
```

## 📈 **Scalability Considerations**

- **Asset Limits**: Reasonable limits on number of assets per post
- **File Size Limits**: Enforce maximum file sizes
- **Concurrent Users**: Optimized for 10-50 concurrent collaborators
- **Real-time Updates**: Efficient Y.js synchronization

---

This clean, optimized schema provides the best foundation for DLUX collaborative post creation without the complexity of migrations or backward compatibility concerns.

## ⚠️ **Critical TipTap Y.js Collaboration Pitfalls & Solutions**

### **🚨 Transaction Mismatch Errors - Root Cause Analysis**

During implementation, we discovered a critical class of errors that violate TipTap's Y.js collaboration best practices:

```
RangeError: Applying a mismatched transaction
    at EditorState.applyInner (tiptap-collaboration.bundle.js:25764:19)
    at EditorState.applyTransaction (tiptap-collaboration.bundle.js:25728:45)
    at EditorState.apply (tiptap-collaboration.bundle.js:25704:21)
    at Editor.dispatchTransaction (tiptap-collaboration.bundle.js:37362:34)
    at EditorView.dispatch (tiptap-collaboration.bundle.js:31687:29)
```

### **❌ Anti-Patterns That Cause Transaction Mismatch**

#### **1. Programmatic Focus During Y.js Initialization**
```javascript
// WRONG: Causes transaction mismatch errors
async newDocument() {
    await this.createOfflineFirstCollaborativeEditors(bundle);
    this.titleEditor.commands.focus(); // ❌ NEVER DO THIS
}

// WRONG: Even with delays/promises
this.titleEditor.commands.focus();
this.$nextTick(() => this.titleEditor.commands.focus()); // ❌ STILL WRONG
setTimeout(() => this.titleEditor.commands.focus(), 500); // ❌ TIMING DOESN'T FIX IT
```

#### **2. Editor Commands During Document Transitions**
```javascript
// WRONG: Any editor commands during Y.js document lifecycle
this.titleEditor.commands.clearContent();     // ❌ During cleanup
this.bodyEditor.commands.setContent(content); // ❌ During initialization  
this.editor.commands.insertContent(html);     // ❌ During document switching
```

#### **3. Direct Y.js Fragment Manipulation During Editor Lifecycle**
```javascript
// WRONG: Direct Y.js operations during editor creation/destruction
const titleFragment = this.ydoc.get('title');
titleFragment.delete(0, titleFragment.length); // ❌ Causes schema conflicts
```

### **✅ Correct TipTap Y.js Collaboration Patterns**

#### **1. Natural Focus Through User Interaction**
```javascript
// CORRECT: Let users focus naturally
async newDocument() {
    await this.createOfflineFirstCollaborativeEditors(bundle);
    // ✅ NO programmatic focus - users click to focus
    console.log('✅ Editors ready - awaiting user interaction for focus');
}

// CORRECT: Focus only through user-initiated events
onEditorClick() {
    // ✅ Users naturally focus by clicking
    // No programmatic focus needed
}
```

#### **2. Proper Document Cleanup Sequence**
```javascript
// CORRECT: Clean Y.js document lifecycle management
async cleanupCurrentDocument() {
    console.log('🧹 Starting safe Y.js document cleanup...');
    
    // STEP 1: Destroy editors first (prevents accessing destroyed Y.js types)
    if (this.titleEditor) {
        this.titleEditor.destroy();
        this.titleEditor = null;
    }
    if (this.bodyEditor) {
        this.bodyEditor.destroy(); 
        this.bodyEditor = null;
    }
    
    // STEP 2: Close providers before destroying document
    if (this.provider) {
        this.provider.destroy();
        this.provider = null;
    }
    if (this.indexeddbProvider) {
        this.indexeddbProvider.destroy();
        this.indexeddbProvider = null;
    }
    
    // STEP 3: Finally destroy Y.js document
    if (this.ydoc) {
        this.ydoc.destroy();
        this.ydoc = null;
    }
    
    // STEP 4: Reset state
    this.isCollaborativeMode = false;
    this.connectionStatus = 'disconnected';
    
    console.log('✅ Y.js document cleanup complete');
}
```

#### **3. Safe Content Clearing**
```javascript
// CORRECT: Safe content clearing without editor commands
clearEditor() {
    console.log('🧹 Clearing editor content safely...');
    
    // ✅ DON'T manipulate editors during Y.js operations
    // Y.js will handle content clearing through proper document lifecycle
    
    // Just reset component state - Y.js manages actual content
    this.content = {
        title: '',
        body: '',
        tags: [],
        custom_json: {},
        permlink: '',
        beneficiaries: []
    };
    
    this.hasUnsavedChanges = false;
    console.log('✅ Component state cleared (Y.js handles document content)');
}
```

### **🛡️ Error Prevention Strategies**

#### **1. Editor Command Safety Checks**
```javascript
// CORRECT: Always validate editor state before commands
safelyFocusEditor(editor) {
    if (editor && 
        !editor.isDestroyed && 
        editor.view &&
        editor.view.dom &&
        !this.isInitializing &&
        this.connectionStatus !== 'connecting') {
        
        // ✅ Only focus in stable states
        editor.commands.focus();
    } else {
        console.log('⚠️ Skipping unsafe editor focus');
    }
}
```

#### **2. Y.js Document State Validation**
```javascript
// CORRECT: Validate Y.js document state before operations
validateDocumentState() {
    if (!this.ydoc) {
        console.warn('⚠️ No Y.js document available');
        return false;
    }
    
    if (this.ydoc.isDestroyed) {
        console.warn('⚠️ Y.js document is destroyed');
        return false;
    }
    
    if (this.isInitializing) {
        console.warn('⚠️ Document still initializing');
        return false;
    }
    
    return true;
}
```

#### **3. onCreate Callback Best Practices**
```javascript
// CORRECT: Minimal onCreate callbacks
onCreate: ({ editor }) => {
    // ✅ Only logging and state setting - NO COMMANDS
    console.log('✅ Enhanced collaborative editor ready');
    
    // ✅ Safe state updates only
    this.editorReady = true;
    
    // ❌ NEVER DO: editor.commands.focus()
    // ❌ NEVER DO: editor.commands.setContent()
    // ❌ NEVER DO: Any programmatic operations
}
```

### **📋 TipTap Y.js Collaboration Checklist**

Before implementing any collaborative feature, verify:

- [ ] **No Programmatic Focus**: Zero `editor.commands.focus()` calls during initialization
- [ ] **No Editor Commands During Lifecycle**: No commands during creation/destruction
- [ ] **No Direct Y.js Manipulation**: No direct fragment operations during editor lifecycle
- [ ] **Proper Cleanup Sequence**: Editors → Providers → Y.js Document → State
- [ ] **Content Validation Enabled**: `enableContentCheck: true` on all collaborative editors
- [ ] **Error Handling**: Graceful handling of validation errors with `onContentError`
- [ ] **State Validation**: Check editor/document state before any operations
- [ ] **Natural Interaction**: Users initiate all focus/editing through clicking

### **🔍 Debugging Transaction Mismatch Errors**

When transaction mismatch errors occur:

1. **Check Call Stack**: Look for focus/command calls during initialization
2. **Verify Lifecycle**: Ensure proper cleanup sequence
3. **Schema Validation**: Check for Y.js structure conflicts
4. **Timing Issues**: Remove all programmatic operations during creation
5. **Content Validation**: Enable and handle validation errors properly

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

## 📊 Document States & Indicators

### Document States Overview

1. **Local Document States**
   - `local`: Document exists only in browser storage
   - `local_unsaved`: Document has unsaved changes in browser storage
   - `local_saved`: Document is up to date in browser storage

2. **Cloud Document States**
   - `cloud_disconnected`: Document exists in cloud but not currently connected
   - `cloud_connecting`: Attempting to establish connection to cloud
   - `cloud_connected`: Successfully connected to cloud server
   - `cloud_syncing`: Changes being synchronized with cloud
   - `cloud_synced`: All changes synchronized with cloud
   - `cloud_error`: Error in cloud connection or synchronization

3. **Authentication States**
   - `auth_required`: Authentication needed for cloud operations
   - `auth_expired`: Authentication token has expired
   - `auth_error`: Authentication failed or rejected

4. **Permission States**
   - `read_only`: User has read-only access to document
   - `can_edit`: User has edit permissions
   - `owner`: User is the document owner

### Status Indicator System

The unified status indicator provides real-time feedback about document state through:

1. **Visual Elements**
   - Icon: Represents current state (✅ synced, 🔄 syncing, ⚠️ warning, etc.)
   - Color: Indicates severity/status (success, warning, error, etc.)
   - Badge: Shows additional context (read-only, owner, etc.)

2. **Interactive Features**
   - Click to view detailed status
   - Action buttons for relevant operations
   - Real-time updates as state changes

3. **Status Messages**
   - Primary: Short, clear status ("Synced", "Offline", etc.)
   - Details: Extended information about current state
   - Actions: Available operations for current state

### State Transitions

1. **Local Document Flow**
   ```mermaid
   graph TD
      A[New Document] -->|Save| B[Local Document]
      B -->|Edit| C[Local Unsaved]
      C -->|Auto-save| B
      B -->|Convert| D[Cloud Document]
   ```

2. **Cloud Document Flow**
   ```mermaid
   graph TD
      A[Cloud Document] -->|Connect| B[Connected]
      B -->|Edit| C[Syncing]
      C -->|Success| B
      C -->|Error| D[Error]
      D -->|Retry| B
      B -->|Disconnect| E[Offline]
      E -->|Auto-reconnect| B
   ```

### Implementation Notes

1. **State Management**
   - Use Y.js awareness feature for real-time state sharing
   - Maintain local state for offline functionality
   - Handle state transitions gracefully

2. **Error Handling**
   - Provide clear error messages
   - Offer appropriate recovery actions
   - Auto-retry for transient failures

3. **User Experience**
   - Immediate feedback for user actions
   - Clear indication of document status
   - Intuitive recovery options

4. **Performance Considerations**
   - Minimize UI updates for frequent state changes
   - Batch status updates when possible
   - Efficient state diffing for updates
``` 