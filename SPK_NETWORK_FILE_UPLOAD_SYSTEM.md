# SPK Network File Upload System - Technical Documentation

## Overview

The SPK Network file upload system is a sophisticated blockchain-integrated file storage solution that combines Vue.js components with IPFS decentralized storage. The system handles complex file operations including folder structures, encryption, thumbnails, and resumable uploads through a virtual file system architecture.

## Component Architecture

### Client-Side Components

#### 1. uploadvue-dd.js - Core Upload Component
**Location**: `/js/uploadvue-dd.js`
**Purpose**: Main upload interface with drag/drop, progress tracking, and file processing

**Key Features**:
- Drag and drop file upload with directory structure preservation
- Automatic thumbnail generation for images
- Optional AES encryption with multi-user key sharing
- Resumable chunked uploads with progress tracking
- Complex metadata generation for IPFS storage

**Critical Methods**:
- `processSingleFile()` - Hash generation and metadata preparation
- `upload()` - Orchestrates the complete upload workflow
- `makePaths()` - Converts folder structures to path indices
- `generateThumbnail()` - Creates 128x128 thumbnails for images

#### 2. spkdrive.js - Contract Management
**Location**: `/js/spkdrive.js`  
**Purpose**: SPK Network contract integration and file system management

**Key Features**:
- Storage contract selection and management
- File listing and virtual directory navigation
- Blockchain authentication with Hive/SPK keys
- Deep linking support for folder navigation

#### 3. upload-everywhere.js - Simplified Upload Interface
**Location**: `/js/upload-everywhere.js`
**Purpose**: Streamlined upload component with automatic contract selection

**Key Features**:
- Auto-detects optimal storage contracts
- Calculates BROCA requirements based on file size
- Modal-based upload workflow
- External file drop support with path preservation

### Server-Side API (TROLE)

#### Core Upload Endpoints

**Base URL**: Varies by storage provider (e.g., `https://spktest.dlux.io/api`)

##### 1. `/upload-authorize` - Upload Authorization
```http
POST /upload-authorize
Headers:
  X-Sig: [blockchain signature]
  X-Account: [account name]
  X-Contract: [contract ID]
  X-Cid: [IPFS content ID]
  X-Chain: HIVE
Body:
  {
    "files": "cid1,cid2,cid3",
    "meta": "[encoded metadata string]"
  }
```

**Response**:
```json
{
  "fileId": "unique_upload_id",
  "chunkSize": 1048576,
  "startingByte": 0
}
```

##### 2. `/upload` - Chunked File Upload
```http
POST /upload
Headers:
  Content-Range: bytes=0-1048575/5242880
  X-Cid: [IPFS content ID]
  X-Contract: [contract ID]
  X-Sig: [blockchain signature]
  X-Account: [account name]
FormData:
  chunk: [file chunk binary data]
  cids: "cid1,cid2,cid3"
  meta: "[encoded metadata string]"
```

##### 3. `/upload-check` - Upload Status
```http
GET /upload-check
Headers:
  sig: [blockchain signature]
  account: [account name]
  contract: [contract ID]
  cid: [IPFS content ID]
```

## Virtual File System Architecture

### Path Encoding System

The system uses a sophisticated path encoding mechanism to represent folder structures efficiently in blockchain metadata.

#### Path Index Mapping
```javascript
// Preset folder indices (built-in types)
const presetFolders = {
  "Documents": "2",
  "Images": "3", 
  "Videos": "4",
  "Music": "5",
  "Archives": "6",
  "Code": "7",
  "Trash": "8",
  "Misc": "9"
};

// Custom folders use: 1, A-Z, a-z (excluding confusing chars)
const customIndices = "1ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
```

#### Folder Structure Examples
```
Root (index: "0")
├── Documents (index: "2")
│   └── Projects (index: "A") → "2/Projects"
├── Custom Folder (index: "1") 
└── Images (index: "3")
    └── Vacation (index: "B") → "3/Vacation"
```

### Metadata String Format

The complete metadata is encoded as a single string stored on-chain:

```
Format: "1[encryptionKeys]|[folderList]|[fileMetadata]"

Example:
"1#key1@user1;key2@user2|2/Projects|A/Subfolder|myfile,jpg.B,Qmthumb123,0-CC0-2"
```

#### Components Breakdown

**1. Encryption Section**: `1[encryptionKeys]`
- `1` = Version number
- Encrypted keys format: `#encKey1@user1;encKey2@user2`
- Empty if no encryption: `1`

**2. Folder List**: `|[folderList]`
- Format: `parentIndex/folderName|parentIndex/folderName`
- Example: `2/Projects|A/Subfolder` (Projects under Documents, Subfolder under Projects)

**3. File Metadata**: `|[fileMetadata]`
- Per file: `name,ext.pathIndex,thumbnail,flags-license-labels`
- Example: `myfile,jpg.B,Qmthumb123,0-CC0-2`
  - `myfile` = filename (32 char max, commas replaced with dashes)
  - `jpg.B` = extension with path index B
  - `Qmthumb123` = IPFS CID of thumbnail (optional)
  - `0-CC0-2` = flags-license-labels encoding

### File Processing Workflow

#### 1. File Ingestion (`processSingleFile`)
```javascript
// Input: File object + optional fullAppPath
// 1. Security check (skip hidden files starting with .)
// 2. Read file as ArrayBuffer
// 3. Generate IPFS hash using UnixFS
// 4. Check if file already exists on network
// 5. Create FileInfo metadata structure
// 6. Generate thumbnail for images
// 7. Handle encryption if enabled
```

#### 2. Path Processing (`makePaths`)
```javascript
// Input: Collection of files with fullAppPath properties
// 1. Extract all unique folder paths
// 2. Build hierarchical folder structure
// 3. Assign indices (preset folders get fixed indices, custom get sequential)
// 4. Generate folder list string for metadata
// 5. Create path-to-index mapping for file metadata
```

#### 3. Upload Orchestration (`upload`)
```javascript
// 1. Sort CIDs alphabetically for consistent ordering
// 2. Generate complete metadata string
// 3. Request upload authorization for each file
// 4. Execute chunked uploads with progress tracking
// 5. Handle completion and emit events
```

## Authentication & Security

### Blockchain Signature Verification

The system uses Hive blockchain signatures for authentication:

```javascript
// Client-side signature generation
async function signText(challenge) {
  return new Promise((resolve, reject) => {
    hive_keychain.requestSignBuffer(
      account,
      challenge,
      'Posting',
      (response) => {
        if (response.success) {
          resolve(`${challenge}:${response.result}`);
        } else {
          reject(response.message);
        }
      }
    );
  });
}
```

### Required Headers for Upload Requests

```javascript
const authHeaders = {
  'X-Account': contractOwner,     // Hive account name
  'X-Sig': blockchainSignature,  // Signed challenge
  'X-Contract': contractId,       // SPK contract identifier
  'X-Cid': fileContentId,        // IPFS content ID
  'X-Chain': 'HIVE'              // Blockchain network
};
```

### Server-Side Verification Process

1. **Extract signature components** from `X-Sig` header
2. **Verify account ownership** via SPK Network API
3. **Validate signature** against provided challenge
4. **Check contract permissions** for the authenticated account
5. **Authorize upload operations** based on verification results

## Core System Architecture

### CID/Hash Equivalency & Benefits

**Critical Understanding**: In the SPK Network system, `cid` and `hash` are completely equivalent terms referring to the same IPFS Content Identifier.

```javascript
// These assignments demonstrate the equivalency
this.File[fileInfo.index].cid = cids[i];           // Setting file.cid
const dict = { hash: ret.hash, ... };              // Storing as hash
if (fileInfo.hash == cids[i]) { ... }              // Comparing hash with cid
```

#### IPFS Hash Generation Process
```javascript
function hashOf(buffer, opts) {
  return new Promise((resolve, reject) => {
    // Uses IPFS UnixFS standard for deterministic content addressing
    Hash.of(buffer, { unixfs: 'UnixFS' }).then(hash => {
      resolve({ hash, opts });
    });
  });
}
```

#### Benefits of CID/Hash Equivalency

**1. Content Addressability**
- Files are identified by their cryptographic content hash
- Identical files always produce identical CIDs regardless of filename
- Natural deduplication - same content = same storage reference

**2. Integrity Verification**
- CID serves as both identifier and integrity checksum
- Any content modification produces different CID
- Tamper-evident storage with mathematical guarantees

**3. Decentralized Reference**
- CIDs work across any IPFS node globally
- No central authority required for file identification
- Location-independent addressing scheme

**4. Efficient Metadata**
- Single identifier serves as both filename and content verification
- Reduced metadata overhead in blockchain storage
- Deterministic ordering for consistent contract states

### M3U8 Playlist & Blob Handling

#### M3U8 Preview Processing
M3U8 files require special blob-based handling for previews and manifest updates:

```javascript
// M3U8 files are processed as blobs for manipulation
function addDataURL(url, name, type = "video/mp2t") {
  // Create blob from video segment data  
  var newFile = new File(new Blob([url]), name, { type });
  
  // Process as standard file but mark as thumbnail segment
  const isThumbFile = name.endsWith('_thumb.ts') || name.endsWith('_thumb.m3u8');
  
  if (isThumbFile) {
    FileInfo[name].meta = {
      name: '',           // No metadata for segments
      ext: '',            
      flag: "2",          // Thumb flag
      // ...
    };
    FileInfo[name].is_thumb = true;
  }
}
```

#### Playlist Manifest Updates
**Critical Process**: Before uploading the main M3U8 playlist, all segment files must be uploaded first and their IPFS hashes recorded in the manifest:

```javascript
// 1. Upload all .ts segments first (parallel uploads)
const segmentUploads = segments.map(segment => uploadFile(segment));
await Promise.all(segmentUploads);

// 2. Update playlist manifest with IPFS CIDs
const updatedPlaylist = originalM3U8Content.replace(
  /segment_\d+\.ts/g, 
  (match) => `https://ipfs.dlux.io/ipfs/${segmentHashes[match]}`
);

// 3. Upload updated playlist as final step
await uploadFile(createManifestFile(updatedPlaylist));
```

**Why This Matters**:
- HLS players expect valid URLs in the manifest
- IPFS CIDs must replace original segment references
- Upload order ensures referential integrity

### Upload Execution Patterns

#### Multi-File Upload Strategy: Parallel Execution
```javascript
// All files upload simultaneously, NOT sequentially
[...this.File].forEach(file => {
  let options = defaultOptions;
  options.cid = file.cid;
  if (file.cid) {
    uploadFile(file, options, file.cid); // Starts immediately, no await
  }
});
```

**Benefits of Parallel Uploads**:
- **Maximum throughput** utilizing available bandwidth
- **Reduced total upload time** for multi-file batches  
- **Independent progress tracking** per file
- **Fault isolation** - one file failure doesn't block others

#### Deterministic Metadata Ordering
```javascript
// CIDs are always sorted alphabetically for consistent blockchain state
cids = cids.sort(function (a, b) {
  if (a < b) { return -1; }
  if (a > b) { return 1; }
  return 0;
});

// Metadata string reflects this deterministic order
for (var i = 0; i < cids.length; i++) {
  metaString += fileMetaEntries[cids[i]]; // Alphabetical CID order
}
```

**Why Deterministic Ordering Matters**:
- **Blockchain consensus** requires identical state representation
- **Reproducible contracts** regardless of upload timing
- **Simplified verification** with predictable metadata structure
- **Conflict prevention** in multi-user scenarios

### Unique System Characteristics

#### Content-First Architecture
Unlike traditional file systems that rely on filenames and paths, SPK Network prioritizes content identity:

```javascript
// Traditional: filename -> content lookup
// SPK Network: content -> metadata attachment

const contentHash = await hashOf(fileBuffer);  // Content determines identity
FileInfo[originalName] = {
  hash: contentHash,                           // Primary identifier
  name: originalName,                          // Secondary metadata
  size: fileBuffer.length,
  // ...additional metadata
};
```

#### Dual-State File Tracking
The system maintains files in two simultaneous states during processing:

```javascript
// State 1: File objects for upload mechanics
File[index] = {
  // Raw File object with progress tracking
  progress: 0,
  actions: { pause: false, resume: false, cancel: false },
  cid: 'QmHashValue'  // Assigned after content hashing
};

// State 2: FileInfo for metadata and UI
FileInfo[filename] = {
  hash: 'QmHashValue',  // Same as File.cid
  index: index,         // Links back to File array
  meta: { /* rich metadata */ }
};
```

#### Blockchain-Native Metadata
Metadata is designed specifically for blockchain storage constraints:

```javascript
// Compact encoding optimized for transaction size
const metadataString = `1${encryptionKeys}|${folderPaths}|${fileData}`;

// Example: "1key@user|Projects|myfile,jpg.A,QmThumb,0-CC0-2"
// Packs: version, encryption, folders, and file metadata into single string
```

#### Progressive Enhancement Pattern
The system supports both simple and complex use cases through progressive feature adoption:

1. **Basic**: Single file upload with automatic CID generation
2. **Intermediate**: Multi-file with folder structure preservation  
3. **Advanced**: Encryption, custom thumbnails, M3U8 processing
4. **Expert**: Custom metadata flags, licensing, collaborative permissions

### Advanced Features

### Encryption System

#### Multi-User Encryption Setup
```javascript
// 1. Generate random AES key
const encryptionKey = CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex);

// 2. Fetch user public keys from Hive blockchain
const publicKeys = await fetchHivePublicKeys(usernames);

// 3. Encrypt the AES key for each user
const encryptedKeys = await encryptKeyForUsers(encryptionKey, publicKeys);

// 4. Store encrypted keys in metadata
const keyString = encryptedKeys.map(k => `${k.encKey}@${k.username}`).join(';');
```

#### File Encryption Process
```javascript
function encryptFile(fileContent, aesKey) {
  // Convert file to data URL, then encrypt the entire data URL
  const encrypted = CryptoJS.AES.encrypt(fileContent, aesKey).toString();
  return new File([encrypted], fileName, { type: 'application/octet-stream' });
}
```

### Thumbnail Generation

#### Automatic Image Processing
```javascript
function generateThumbnail(imageFile) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Create 128x128 square thumbnail with aspect ratio preservation
      canvas.width = canvas.height = 128;
      
      // Calculate crop area for square aspect ratio
      const size = Math.min(img.width, img.height);
      const offsetX = (img.width - size) / 2;
      const offsetY = (img.height - size) / 2;
      
      ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, 128, 128);
      
      const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.7);
      resolve(dataURLtoFile(thumbnailDataUrl, `thumb_${imageFile.name}`));
    };
    
    img.src = URL.createObjectURL(imageFile);
  });
}
```

### Progress Tracking

#### Combined Upload Progress
```javascript
// Track progress across multiple files
const fileProgress = {}; // CID -> {loaded, total, percentage}

function updateCombinedProgress() {
  let totalBytes = 0;
  let loadedBytes = 0;
  
  Object.values(fileProgress).forEach(progress => {
    totalBytes += progress.total;
    loadedBytes += progress.loaded;
  });
  
  const combinedProgress = totalBytes > 0 ? (loadedBytes / totalBytes) * 100 : 0;
  updateProgressUI(combinedProgress);
}
```

## Integration Examples

### Basic File Upload
```javascript
// Initialize upload component
const uploadComponent = new UploadVue({
  props: {
    user: userAccount,
    propcontract: selectedContract,
    type: 'files'
  }
});

// Handle file selection
async function uploadFiles(files) {
  const structuredFiles = files.map(file => ({
    file: file,
    fullAppPath: file.webkitRelativePath || file.name
  }));
  
  // Process files through the upload component
  uploadComponent.propStructuredFiles = structuredFiles;
  
  // Monitor upload progress
  uploadComponent.$on('done', (result) => {
    console.log('Upload completed:', result);
  });
}
```

### Folder Upload with Structure Preservation
```javascript
// Handle directory drag and drop
async function handleDirectoryDrop(event) {
  const items = Array.from(event.dataTransfer.items);
  const files = [];
  
  for (const item of items) {
    if (item.kind === 'file') {
      const entry = item.webkitGetAsEntry();
      if (entry) {
        await processDirectoryEntry(entry, files);
      }
    }
  }
  
  return files;
}

async function processDirectoryEntry(entry, files, path = '') {
  if (entry.isFile) {
    const file = await new Promise(resolve => entry.file(resolve));
    file.fullPath = path + entry.name;
    files.push(file);
  } else if (entry.isDirectory) {
    const reader = entry.createReader();
    const entries = await new Promise(resolve => reader.readEntries(resolve));
    
    for (const childEntry of entries) {
      await processDirectoryEntry(childEntry, files, path + entry.name + '/');
    }
  }
}
```

### Contract Auto-Selection
```javascript
// Calculate storage requirements and find suitable contract
function selectOptimalContract(files, userContracts) {
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const channelBytes = 1024; // bytes per BROCA unit
  const requiredBroca = Math.ceil((totalSize / channelBytes) * 1.5); // 50% buffer
  
  // Find smallest contract that can accommodate the files
  return userContracts
    .filter(contract => contract.availableSpace >= requiredBroca)
    .sort((a, b) => a.availableSpace - b.availableSpace)[0];
}
```

## Error Handling & Recovery

### Upload Retry Logic
```javascript
async function retryFileUpload(file, contract) {
  try {
    // Check current upload status
    const status = await checkUploadStatus(file.cid, contract);
    
    // Resume from last successful chunk
    const resumeOptions = {
      ...defaultUploadOptions,
      startingByte: status.totalChunkUploaded || 0
    };
    
    return uploadFileChunks(file, resumeOptions);
  } catch (error) {
    // Fall back to complete re-upload
    return uploadFileChunks(file, defaultUploadOptions);
  }
}
```

### Network Failure Recovery
```javascript
// Implement exponential backoff for network requests
async function uploadWithRetry(uploadFunction, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await uploadFunction();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

## Performance Considerations

### Chunked Upload Optimization
- **Chunk Size**: Default 1MB chunks balance memory usage and network efficiency
- **Parallel Limits**: Maximum 3 concurrent uploads to prevent browser limitations
- **Progress Throttling**: Update UI progress max once per 100ms to avoid excessive redraws

### Memory Management
- **File Processing**: Process files sequentially to avoid memory exhaustion
- **Thumbnail Generation**: Limit concurrent thumbnail generation to 2 operations
- **Buffer Cleanup**: Explicitly revoke object URLs and clear large buffers

### Blockchain Integration
- **Signature Caching**: Cache blockchain signatures for repeated operations
- **Batch Operations**: Group multiple file operations into single blockchain transactions
- **Gas Optimization**: Use diff-based metadata updates to minimize on-chain storage

## Media Display & Thumbnail System

### File Type Classification

The system implements sophisticated file type detection for proper display and handling:

```javascript
// Image file detection
function isImageFile(type) {
  return type && (type.includes('image') ||
    type.includes('jpg') ||
    type.includes('jpeg') ||
    type.includes('png') ||
    type.includes('gif') ||
    type.includes('webp') ||
    type.includes('svg'));
}

// Video file detection
function isVideoFile(type) {
  return type && (type.includes('video') ||
    type.includes('mp4') ||
    type.includes('webm') ||
    type.includes('ogg') ||
    type.includes('m3u8') ||  // HLS playlists
    type.includes('avi') ||
    type.includes('mov') ||
    type.includes('mkv'));
}

// Audio file detection
function isAudioFile(type) {
  return type && (type.includes('audio') ||
    type.includes('mp3') ||
    type.includes('wav') ||
    type.includes('ogg') ||
    type.includes('flac'));
}
```

### Thumbnail System Architecture

#### Automatic Thumbnail Generation
The system automatically generates thumbnails for image files during upload:

```javascript
function generateThumbnail(imageFile) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Create 128x128 square thumbnail with aspect ratio preservation
      canvas.width = canvas.height = 128;
      
      // Calculate crop area for square aspect ratio
      const size = Math.min(img.width, img.height);
      const offsetX = (img.width - size) / 2;
      const offsetY = (img.height - size) / 2;
      
      ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, 128, 128);
      
      const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.7);
      resolve(dataURLtoFile(thumbnailDataUrl, `thumb_${imageFile.name}`));
    };
    
    img.src = URL.createObjectURL(imageFile);
  });
}
```

#### Thumbnail Metadata Structure
```javascript
// FileInfo structure for images with thumbnails
FileInfo['originalfile.jpg'] = {
  hash: 'QmOriginalImageHash',
  thumb: 'QmThumbnailHash',        // References the thumbnail CID
  thumb_index: 15,                 // Index in File array
  meta: {
    thumb: 'QmThumbnailHash'       // Also stored in metadata
  }
};

// Corresponding thumbnail entry
FileInfo['thumb_originalfile.jpg'] = {
  hash: 'QmThumbnailHash',
  is_thumb: true,                  // Marks as thumbnail file
  use_thumb: true,                 // Controls visibility in UI
  fileContent: 'data:image/jpeg;base64,...', // Data URL for preview
  meta: {
    flag: "2",                     // Flag 2 indicates thumbnail
    name: '',                      // No name for thumbnails
    ext: ''                        // No extension for thumbnails
  }
};
```

#### Smart Thumbnail Display
```javascript
function smartThumb(contractId, cid) {
  const fileInfo = newMeta[contractId][cid];
  
  if (fileInfo.thumb.includes('https://')) {
    // External thumbnail URL
    return fileInfo.thumb;
  } else if (fileInfo.thumb.includes('Qm')) {
    // IPFS thumbnail CID
    return `https://ipfs.dlux.io/ipfs/${fileInfo.thumb}`;
  } else {
    return false; // No thumbnail available
  }
}
```

### M3U8 Playlist & Segment Handling

#### Special M3U8 Processing
The system has special handling for HLS (HTTP Live Streaming) files:

```javascript
// Detect M3U8 thumb/segment files during processing
const isThumbFile = fileName.endsWith('_thumb.ts') || fileName.endsWith('_thumb.m3u8');

if (isThumbFile) {
  FileInfo[fileName].meta = {
    name: '',           // No name for thumb segments
    ext: '',            // No extension for thumb segments  
    flag: "2",          // Flag 2 for thumb files
    labels: "",
    thumb: "",
    license: "",
    fullAppPath: filePath
  };
  
  // Mark as thumb file for special handling
  FileInfo[fileName].is_thumb = true;
  FileInfo[fileName].use_thumb = true;
}
```

#### M3U8 Segment Filtering
M3U8 segment files with `_thumb.ts` or `_thumb.m3u8` extensions are:

1. **Automatically flagged** with `flag: "2"` and `is_thumb: true`
2. **Hidden from main file listings** via filtering: 
   ```javascript
   Object.values(FileInfo).filter(file => !file.is_thumb)
   ```
3. **Processed without metadata** (empty name/ext to prevent UI clutter)
4. **Uploaded normally** but treated as auxiliary files

### Content Display Patterns

#### Image Display
```javascript
// Grid view image preview
<div v-if="isImageFile(file.type)" class="file-preview">
  <img :src="smartThumb(file.contractId, file.cid) || `https://ipfs.dlux.io/ipfs/${file.cid}`" 
       class="img-thumbnail" 
       :alt="file.name"
       @error="showPlaceholderIcon">
</div>
```

#### Video Display with M3U8 Support
```javascript
// Video rendering in posts/previews
if (isVideoFile(fileType) || fileName.endsWith('.m3u8')) {
  const typeAttr = fileName.endsWith('.m3u8') 
    ? ' type="application/x-mpegURL"' 
    : '';
  
  formattedContent = `<video src="https://ipfs.dlux.io/ipfs/${cid}"${typeAttr} controls></video>`;
}
```

#### Thumbnail Toggle System
For images with auto-generated thumbnails:

```javascript
// Template for thumbnail toggle
<div class="form-check form-switch">
  <input type="checkbox" 
         :checked="FileInfo['thumb' + fileName].use_thumb"
         @click="resetThumb(fileName)">
  <label>Use Automatic Thumbnail</label>
</div>

// Toggle function
function resetThumb(fileName) {
  FileInfo['thumb' + fileName].use_thumb = !FileInfo['thumb' + fileName].use_thumb;
  FileInfo[fileName].meta.thumb = FileInfo['thumb' + fileName].use_thumb 
    ? FileInfo[fileName].thumb 
    : '';
}
```

### File Filtering & Organization

#### UI Filtering Patterns
```javascript
// Main file list (excludes thumbnails and thumb segments)
const mainFiles = Object.values(FileInfo).filter(file => !file.is_thumb);

// Thumbnail files only
const thumbnailFiles = Object.values(FileInfo).filter(file => file.is_thumb);

// Files with thumbnails
const filesWithThumbs = mainFiles.filter(file => 
  FileInfo['thumb' + file.name] && FileInfo['thumb' + file.name].use_thumb
);
```

#### File Count Calculation
```javascript
function getFileCount() {
  let thumbs = 0;
  let files = 0;
  
  for (const item in FileInfo) {
    if (FileInfo[item].use_thumb) {
      thumbs++;
    } else if (FileInfo[item].is_thumb) {
      // Skip counting - these are auxiliary files
    } else {
      files++;
    }
  }
  
  return `${files} file${files > 1 ? 's' : ''} ${thumbs ? `with ${thumbs} thumbnail${thumbs > 1 ? 's' : ''}` : ''}`;
}
```

### Upload Size Calculation

#### Total Size with Thumbnail Handling
```javascript
function calculateTotalSize() {
  let size = 0;
  const cids = [];
  
  // Collect CIDs based on encryption status
  Object.keys(FileInfo).forEach(fileName => {
    const fileInfo = FileInfo[fileName];
    
    if (!encryption.encrypted) {
      // Include main files and used thumbnails
      if ((fileInfo.is_thumb && fileInfo.use_thumb) || !fileInfo.is_thumb) {
        cids.push(fileInfo.hash);
      }
    } else {
      // For encrypted files, use encrypted hash
      if (fileInfo.enc_hash) {
        cids.push(fileInfo.enc_hash);
      }
    }
  });
  
  // Calculate total size from included CIDs
  cids.forEach(cid => {
    const matchingFile = Object.values(FileInfo).find(file => 
      file.hash === cid || file.enc_hash === cid
    );
    if (matchingFile) {
      size += File[matchingFile.index].size;
    }
  });
  
  return size;
}
```

## Upload Specifications & Configuration

### Chunk Size & Transfer Limits

#### Default Chunk Processing
```javascript
// Client-side chunked upload with resumable capability
function uploadFile(file, options) {
  const chunk = file.slice(options.startingByte); // Dynamic chunk size
  
  // Content-Range header for server chunk tracking
  xhr.setRequestHeader(
    'Content-Range', 
    `bytes=${options.startingByte}-${options.startingByte + chunk.size}/${file.size}`
  );
}
```

#### Server-Side Configuration
- **Chunk Size Limit**: Controlled by `config.chunkSize` (server configuration)
- **Maximum JSON Length**: Defined by `config.maxJsonLength` for metadata
- **Default Starting Position**: `startingByte: 0` for new uploads
- **Resume Capability**: Uses `totalChunkUploaded` from server response

#### Upload Constraints & Limits

**1. File Size Limits**
- No explicit client-side file size limits
- Constrained by available BROCA in storage contracts
- Server validates chunk continuity and total file size

**2. Concurrent Upload Limits**
- **Parallel Execution**: All files upload simultaneously
- **No Throttling**: Client doesn't impose concurrent upload limits
- **Browser Limitations**: Subject to browser's HTTP/2 connection limits

**3. Timeout Settings**
```javascript
// XMLHttpRequest timeout handling
req.ontimeout = (e) => options.onError(e, file);
// Note: No explicit timeout value set, uses browser defaults
```

#### Resumable Upload Specifications

**Resume Logic**:
```javascript
// Server response indicates last successful byte position
const resumeOptions = {
  ...defaultOptions,
  startingByte: Number(res.totalChunkUploaded) // Resume from this byte
};
```

**Content-Range Headers**:
```
Content-Range: bytes=0-1048575/5242880        // First chunk
Content-Range: bytes=1048576-2097151/5242880  // Second chunk  
Content-Range: bytes=2097152-5242879/5242880  // Final chunk
```

#### Storage Contract Requirements

**BROCA Calculation**:
```javascript
// File size determines required BROCA
const channelBytes = stats.channel_bytes || 1024; // Default 1024 bytes per BROCA
const requiredBroca = Math.ceil((totalSize / channelBytes) * 1.5); // 50% overhead
```

**Contract Selection Criteria**:
- Finds smallest contract with sufficient capacity (`channel.r >= requiredBroca`)
- Auto-upgrade suggests larger contracts when needed
- Minimum 100 BROCA for contract creation interface

### Error Handling & Recovery

#### Upload Error Types
```javascript
// Network and server errors
req.onerror = (e) => options.onError(e, file);
req.ontimeout = (e) => options.onError(e, file);
req.onabort = (e) => options.onAbort(e, file);

// Custom retry logic
if (res.totalChunkUploaded > 0) {
  // Resume from last successful position
  resumeUpload(file, { startingByte: res.totalChunkUploaded });
}
```

#### Network Failure Recovery
- **Automatic Resume**: Checks server for `totalChunkUploaded` position
- **No Retry Limits**: Client doesn't impose automatic retry limits
- **Manual Recovery**: Users can resume failed uploads manually

### Performance Optimization

#### Upload Strategy
- **Dynamic Chunking**: Chunks created via `file.slice(startingByte)` 
- **Progress Tracking**: Real-time progress updates per file and combined
- **Memory Efficiency**: Single chunk processed at a time per file

#### Network Efficiency
- **Parallel Uploads**: Multiple files upload concurrently
- **Minimal Overhead**: Efficient metadata encoding reduces transaction costs
- **Resumable**: Avoids re-uploading completed portions

## Troubleshooting

### Common Issues

**1. Files Not Uploading**
- Verify blockchain signature is valid and not expired
- Check contract has sufficient storage space
- Ensure IPFS network connectivity

**2. Folder Structure Not Preserved**
- Verify `fullAppPath` is set correctly on file objects
- Check path encoding logic in `makePaths()` function
- Ensure folder indices don't exceed available character set

**3. Encryption Failures**
- Validate all user public keys are fetched correctly
- Verify Keychain integration is working
- Check encryption key distribution to all intended users

**4. Progress Tracking Issues**
- Ensure file CIDs are properly assigned before upload
- Verify progress event handlers are attached correctly
- Check for JavaScript errors preventing UI updates

**5. Thumbnail Issues**
- Verify thumbnail generation completes before upload
- Check thumbnail file creation in FileInfo structure
- Ensure `is_thumb` flag is properly set for segments
- Validate M3U8 `_thumb.ts` files are filtered correctly

**6. M3U8 Segment Display Problems**
- Confirm `_thumb.ts` and `_thumb.m3u8` files have `flag: "2"`
- Verify filtering logic excludes thumb segments from main listings
- Check M3U8 playlist references are maintained after upload

### Debug Information

Enable detailed logging by setting:
```javascript
window.SPK_DEBUG = true;
```

This will output detailed information about:
- File processing stages
- Path encoding decisions
- Upload progress events
- Blockchain signature generation
- IPFS operations
- Thumbnail generation progress
- M3U8 segment classification
- File type detection results

---

*This documentation reflects the SPK Network file upload system as implemented in the DLUX IOV project. For the latest updates and API changes, refer to the official SPK Network documentation and the project's GitHub repository.*