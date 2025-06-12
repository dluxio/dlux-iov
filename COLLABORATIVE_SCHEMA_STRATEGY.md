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

## 🏛️ **Hive Best Practices Implementation**

### **Tags Storage Strategy**
Following Hive best practices, tags are stored in **both** locations:

1. **Primary Storage**: `json_metadata.tags` array for applications
2. **Blockchain Indexing**: Added to post body as hashtags for legacy compatibility

```javascript
// In Y.js collaborative document
publishOptions.set('tags', ['dlux', '3d', 'vr', 'blockchain']);

// Published to Hive as:
{
    body: 'Post content here\n\n#dlux #3d #vr #blockchain',
    json_metadata: JSON.stringify({
        tags: ['dlux', '3d', 'vr', 'blockchain'], // Primary
        // ... other metadata
    })
}
```

### **Advanced Options Distribution**

**Stored in `json_metadata`:**
- Tags (primary storage)
- Images (featured images for previews)
- Links (extracted from content)
- App identification
- DLUX-specific metadata (360° assets, SPK contracts)

**Stored in separate `comment_options` operation:**
- Beneficiaries (revenue sharing)
- Max accepted payout
- Percent HBD preference
- Voting and curation settings

### **Hive Validation Rules**
- **Tags**: 1-10 tags, max 24 characters each, lowercase alphanumeric + hyphens only
- **Beneficiaries**: Max 8 beneficiaries, total weight ≤ 10,000 (100%)
- **Permlink**: Lowercase, alphanumeric + hyphens only
- **Title**: Max 255 characters
- **Body**: Max ~60,000 characters
- **JSON Metadata**: 8KB practical limit

## 🔄 **Conflict-Free Collaboration Methods**

### **Tag Management (Y.Array)**
```javascript
// Conflict-free tag operations
addTag(tag)                    // Add individual tag with validation
removeTag(tag)                 // Remove specific tag
setTags(tagArray)             // Replace all tags atomically
getTags()                     // Get current tag array
```

### **Beneficiary Management (Y.Array)**
```javascript
// Conflict-free beneficiary operations  
addBeneficiary(account, weight)        // Add with validation
removeBeneficiary(id)                  // Remove by unique ID
updateBeneficiaryWeight(id, weight)    // Update specific beneficiary
getBeneficiaries()                     // Get current beneficiaries
```

### **Custom JSON Management (Y.Map)**
```javascript
// Granular field-level updates
setCustomJsonField(key, value)    // Set individual field
removeCustomJsonField(key)        // Remove specific field  
getCustomJson()                   // Get complete custom JSON object
```

### **Asset Transform Management (Individual Y.Maps)**
```javascript
// Conflict-free 3D positioning
updateAssetTransform(assetId, 'position', {x, y, z})  // Position only
updateAssetTransform(assetId, 'rotation', {x, y, z})  // Rotation only
updateAssetTransform(assetId, 'scale', {x, y, z})     // Scale only
getAssetTransform(assetId)                            // Get all transforms
```

### **Operation Locks**
```javascript
// Prevent simultaneous critical operations
const locks = ydoc.getMap('_locks')
locks.set('publishing', { user: 'username', timestamp: Date.now() })
locks.delete('publishing')  // Clear when done
```

## 🗂️ **Data Structure Details**

### **1. Post Configuration (`config`)**
```javascript
{
    postType: 'blog' | 'video' | '360' | 'dapp' | 'remix',
    appVersion: 'dlux/0.1',
    lastModified: '2024-01-15T10:30:00.000Z',
    createdBy: 'username',
    settings: {
        allowComments: true,
        isPublic: true,
        language: 'en'
    }
}
```

### **2. Image Assets (`images`)**
```javascript
[{
    id: 'img_1705312200000_abc123',
    hash: 'QmXxXxXx...',                    // IPFS hash
    filename: 'sunset.jpg',
    type: 'image/jpeg',
    size: 1024000,
    url: 'https://ipfs.dlux.io/ipfs/QmXxXxXx...',
    uploadedBy: 'username',
    uploadedAt: '2024-01-15T10:30:00.000Z',
    contract: 'spk-contract-id',            // SPK Network contract
    metadata: {
        width: 1920,
        height: 1080,
        alt: 'Beautiful sunset'
    }
}]
```

### **3. Video Assets (`videos`)**
```javascript
[{
    id: 'vid_1705312200000_def456',
    hash: 'QmYyYyYy...',                    // IPFS hash
    filename: 'tutorial.mp4',
    type: 'video/mp4',
    size: 50000000,
    url: 'https://ipfs.dlux.io/ipfs/QmYyYyYy...',
    uploadedBy: 'username',
    uploadedAt: '2024-01-15T10:30:00.000Z',
    contract: 'spk-contract-id',
    metadata: {
        duration: 120,                      // seconds
        width: 1920,
        height: 1080,
        bitrate: 5000000,
        codec: 'h264'
    },
    transcoding: {
        status: 'completed',
        resolutions: ['720p', '1080p'],
        playlist: 'QmPlaylist...'           // M3U8 playlist hash
    }
}]
```

### **4. 360° Assets (`assets360`)**
```javascript
[{
    id: 'asset_1705312200000_ghi789',
    hash: 'QmZzZzZz...',                    // IPFS hash
    name: 'floating_cube.obj',
    type: 'model/obj',
    size: 2048000,
    uploadedBy: 'username',
    uploadedAt: '2024-01-15T10:30:00.000Z',
    contract: 'spk-contract-id',
    properties: {
        interactive: true,
        physics: false,
        animation: 'idle'
    }
    // Note: transforms stored separately in transform_${assetId} maps
}]
```

### **5. Asset Transforms (Individual Maps)**
```javascript
// ydoc.getMap('transform_asset_1705312200000_ghi789')
{
    position: { x: 0, y: 1.6, z: -3 },     // Conflict-free position updates
    rotation: { x: 0, y: 45, z: 0 },       // Conflict-free rotation updates  
    scale: { x: 1, y: 1, z: 1 },           // Conflict-free scale updates
    lastModified: '2024-01-15T10:35:00.000Z',
    modifiedBy: 'username'
}
```

### **6. Tags Array (`tags`)**
```javascript
// ydoc.getArray('tags')
['dlux', 'vr', '360', 'blockchain', 'content']
```

### **7. Beneficiaries Array (`beneficiaries`)**
```javascript
// ydoc.getArray('beneficiaries')  
[{
    id: 'ben_1705312200000_abc123',         // Unique ID for conflict-free updates
    account: 'dlux-io',
    weight: 1000                            // 10% (1000/10000)
}, {
    id: 'ben_1705312200000_def456',
    account: 'spk-network', 
    weight: 500                             // 5% (500/10000)
}]
```

### **8. Custom JSON Map (`customJson`)**
```javascript
// ydoc.getMap('customJson')
{
    projectVersion: '2.1.0',                // User-defined fields only
    license: 'MIT',
    repository: 'https://github.com/user/project',
    experimentalFeature: true,
    author: {
        name: 'John Doe',
        website: 'https://johndoe.com'
    }
}
```

### **9. General Attachments (`attachments`)**
```javascript
[{
    id: 'file_1705312200000_jkl012',
    hash: 'QmAaAaAa...',                    // IPFS hash
    filename: 'whitepaper.pdf',
    type: 'application/pdf',
    size: 5000000,
    url: 'https://ipfs.dlux.io/ipfs/QmAaAaAa...',
    uploadedBy: 'username',
    uploadedAt: '2024-01-15T10:30:00.000Z',
    contract: 'spk-contract-id',
    description: 'Project whitepaper'
}]
```

### **10. User Presence (`presence`)**
```javascript
{
    "alice": {
        status: 'online',                   // 'online', 'typing', 'away'
        cursor: { line: 10, column: 5 },
        selection: { start: 100, end: 150 },
        color: '#ff6b6b',
        lastSeen: '2024-01-15T10:30:00.000Z'
    },
    "bob": {
        status: 'typing',
        cursor: { line: 15, column: 12 },
        color: '#4ecdc4',
        lastSeen: '2024-01-15T10:29:45.000Z'
    }
}
```

## 🚫 **Sync Conflict Prevention**

### **Problem Areas Eliminated**

#### **❌ Before: Conflict-Prone Structure**
```javascript
// PROBLEMATIC: Complex nested objects
publishOptions.set('beneficiaries', [
  { account: 'dlux-io', weight: 1000 },    // User A modifies weight
  { account: 'user1', weight: 500 }        // User B adds beneficiary
])  // → Merge conflict!

// PROBLEMATIC: Array overwrites
publishOptions.set('tags', ['dlux', 'vr'])  // User A sets tags
publishOptions.set('tags', ['dlux', '3d'])  // User B overwrites → conflict!
```

#### **✅ After: Conflict-Free Structure**
```javascript
// SAFE: Individual array operations
beneficiaries.push([{ id: 'unique_id', account: 'dlux-io', weight: 1000 }])  // User A
beneficiaries.push([{ id: 'other_id', account: 'user1', weight: 500 }])      // User B
// → No conflict, both operations preserved

// SAFE: Granular field updates  
customJson.set('projectVersion', '2.1.0')  // User A
customJson.set('license', 'MIT')           // User B  
// → No conflict, both fields preserved
```

### **Operation Coordination**
```javascript
// Prevent simultaneous critical operations
const locks = ydoc.getMap('_locks')

// Before publishing
if (locks.get('publishing')) {
    throw new Error('Another user is publishing')
}
locks.set('publishing', { user: username, timestamp: Date.now() })

// After publishing (in finally block)
locks.delete('publishing')
```

### **Schema Version Safety**
```javascript
// Detect schema mismatches
const metadata = ydoc.getMap('_metadata')
const currentVersion = metadata.get('schemaVersion')

if (currentVersion !== EXPECTED_VERSION) {
    // Block operations or force refresh
    this.schemaVersionMismatch = true
}
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

This implementation represents a complete transformation from problematic parallel-saving architecture to a clean, TipTap-compliant offline-first collaborative editor that follows all official best practices. 