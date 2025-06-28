# SPK Drive File Management Best Practices & Technical Documentation

## Overview

The SPK Network file upload system is a sophisticated blockchain-integrated file storage solution that combines Vue.js components with IPFS decentralized storage. The system handles complex file operations including folder structures, encryption, thumbnails, and resumable uploads through a virtual file system architecture.

**⚠️ CRITICAL**: This system is extremely fragile and requires exact data format matching for signature verification. Small changes can break the entire upload functionality.

## Critical Implementation Requirements

### Signature System Fragility
The SPK Network upload system uses cryptographic signatures that MUST match exactly between client and server. The following aspects are critical:

1. **CID Ordering and Two-Sort Pattern**: 
   - The signature is based on the comma-separated CID list (body string), NOT the metadata string
   - CIDs are collected in their natural order from FileInfo for the signature
   - **First Sort**: After signature, CIDs are sorted alphabetically for processing
   - **Second Sort**: Before building metadata string, CIDs are sorted again to ensure correct ordering
   - Both sorts are REQUIRED - the second sort is NOT redundant
   - **Breaking Change**: Removing either sort breaks the system
   - **Correct Pattern**: Collect CIDs → Sign body → Sort CIDs → Process → Sort again → Build metadata

2. **Body String Format**: The exact format of the body string is critical
   - Must include leading comma for contract.files: `,cid1,cid2,cid3`
   - The signature is based on this exact format
   - **Breaking Change**: Removing the leading comma with `.substring(1)`

3. **Path Index Format**: Files in root must use `.0` suffix
   - Root files: `filename.ext.0` (NOT just `filename.ext`)
   - Folder files: `filename.ext.A` (letter indicates folder)
   - **Breaking Change**: Using wrong pathIndex check (`!== '0'` vs `!== '1'`)

4. **Thumbnail Handling**: 
   - Thumbnails are regular files with `is_thumb: true` flag
   - Parent files have their `thumb` field set when thumbnail is generated
   - Thumbnail naming uses underscore prefix: `_filename.jpg`
   - Thumbnails are included in the same CID array as regular files
   - **Breaking Change**: Using wrong prefix breaks thumbnail detection

### Breaking Changes to Avoid

1. **DO NOT remove either CID sort in upload()**
   ```javascript
   // WRONG - removing either sort breaks the system
   upload(cids) {
     // cids = cids.sort(); // DON'T comment out - needed for processing
     // ... process files ...
     // cids = cids.sort(); // DON'T comment out - needed for metadata ordering
   }
   
   // CORRECT - both sorts are required
   upload(cids) {
     cids = cids.sort(); // First sort for processing
     // ... update thumbnail references ...
     cids = cids.sort(); // Second sort for metadata string ordering
     // ... build metadata string ...
   }
   ```

2. **DO NOT remove leading comma from contract.files**
   ```javascript
   // WRONG - breaks signature
   this.contract.files = body.substring(1);
   
   // CORRECT - keep the comma
   this.contract.files = body;
   ```

3. **DO NOT change thumbnail prefix**
   ```javascript
   // WRONG
   const thumbName = 'thumb_' + fileName;
   
   // CORRECT
   const thumbName = '_' + fileName;
   ```

4. **DO NOT use wrong path index check**
   ```javascript
   // WRONG - skips root files
   if (pathIndex !== '0') {
   
   // CORRECT - processes root files
   if (pathIndex !== '1') {
   ```

## Architecture Overview

### Core Components

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

#### 4. filesvue-dd.js - Main SPK Drive interface
   - Manages file contracts and metadata
   - Handles folder organization
   - Processes external file drops
   - Manages video transcoding workflow

#### 5. video-transcoder.js - Video processing
   - FFmpeg.wasm integration
   - HLS transcoding (m3u8 + segments)
   - Thumbnail generation
   - Progress tracking

#### 6. video-choice-modal.js - User choice interface
   - Transcode only option
   - Original file only
   - Both original and transcoded

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
Format: "1[encryptionKeys]|[folderList],file1Metadata,file2Metadata,..."

Example:
"1#key1@user1;key2@user2|2/Projects|A/Subfolder,myfile,jpg.B,Qmthumb123,0-CC0-2,otherfile,png.A,Qmthumb456,0-CC0-2"
```

**Important**: Files are separated by commas, not pipes. Pipes only separate the three major sections (encryption|folders|files).

#### Components Breakdown

**1. Encryption Section**: `1[encryptionKeys]`
- `1` = Version number
- Encrypted keys format: `#encKey1@user1;encKey2@user2`
- Empty if no encryption: `1`

**2. Folder List**: `|[folderList]`
- Format: `parentIndex/folderName|parentIndex/folderName`
- Example: `2/Projects|A/Subfolder` (Projects under Documents, Subfolder under Projects)

**3. File Metadata**: `,file1,file2,file3...`
- Files start after the last pipe, separated by commas
- Per file format: `name,ext.pathIndex,thumbnail,flags-license-labels`
- Example: `myfile,jpg.B,Qmthumb123,0-CC0-2`
  - `myfile` = filename (32 char max, commas replaced with dashes)
  - `jpg.B` = extension with path index B
  - `Qmthumb123` = IPFS CID of thumbnail (optional)
  - `0-CC0-2` = flags-license-labels encoding
- Multiple files: `file1,jpg.0,,0-CC0-2,file2,png.A,Qmthumb,0-CC0-2`

## File Flow Patterns

### Standard File Upload Flow
```
User Action → upload-everywhere → filesvue-dd → uploadvue-dd → IPFS
                     ↓                 ↓              ↓
              Contract Check    Video Detection   Hash Generation
                     ↓                 ↓              ↓
              Build/Select      Choice Modal    Upload to SPK
                                      ↓              ↓
                               Transcoding?     Return CID
```

### Video Processing Flow (Centralized)
```
Video Drop → filesvue-dd detects → Choice Modal → User Selection
                                        ↓
                          ┌─────────────┼─────────────┐
                     Original      Transcode        Both
                          ↓             ↓              ↓
                    Raw File →    Background      Raw File +
                 droppedFiles     Transcoding    Transcoding
                          ↓             ↓              ↓
                  upload-everywhere   Complete    Both to upload
                          ↓             ↓              ↓
                      Upload       Auto-move      Upload All
                                  to Ready
```

### Data Flow Between Components
```javascript
// 1. Files dropped in filesvue-dd
onDrop(files) → processFilesWithVideoCheck(files)

// 2. Video detected
if (isVideo) → showVideoChoiceModal = true

// 3. User chooses option
handleVideoChoice('original') → droppedExternalFiles.files.push(rawFile)

// 4. upload-everywhere receives files
watch: externalDrop → addFiles(rawFiles) → droppedFiles.push(...files)

// 5. Files appear in ready section
droppedFiles → UI displays → User clicks Continue → Upload
```

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
// 1. Receive CIDs from sign() function (unsorted order)
// 2. FIRST SORT: Sort CIDs alphabetically for processing
// 3. Update thumbnail references in parent file metadata
// 4. Build metadata entries for each file
// 5. SECOND SORT: Re-sort CIDs to ensure metadata string ordering
// 6. Build final metadata string with entries in alphabetical CID order
// 7. Request upload authorization for each file
// 8. Execute chunked uploads with progress tracking
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

## Data Structure Standards

### File Wrapper Object
```javascript
{
  file: File,              // Raw File object
  fullAppPath: string,     // Preserves folder structure
  isStreamable: boolean,   // True for m3u8 files
  targetPath: string       // Optional target directory
}
```

### Processing File Structure
```javascript
{
  id: string,              // Unique identifier
  file: File,              // Original file
  fileName: string,        // Display name
  fileSize: number,        // Size in bytes
  status: string,          // 'transcoding'|'complete'|'failed'
  progress: number,        // 0-100
  transcodedFiles: File[], // Result files
  thumbnailUrl: string,    // Blob URL for preview
  choice: string           // User's transcoding choice
}
```

### Upload Metadata
```javascript
{
  cid: string,             // IPFS content identifier
  name: string,            // File name
  type: string,            // MIME type
  size: number,            // File size
  path: string,            // Folder path
  contract: string,        // Contract ID
  encrypted: boolean       // Encryption status
}
```

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

### Thumbnail Integration in Metadata

Thumbnails are treated as regular files in the system:
- They have `is_thumb: true` flag to identify them
- They're included in the same CID array as regular files
- They appear in the metadata string alongside regular files
- The second sort ensures thumbnails don't cluster at the end but are interspersed alphabetically

**Example**: Without second sort, metadata might look like:
```
file1,jpg.0,,0--,file2,png.0,,0--,thumb1,,,2--,thumb2,,,2--
```

With second sort, entries are properly ordered by CID:
```
file1,jpg.0,QmThumb1,0--,thumb1,,,2--,file2,png.0,QmThumb2,0--,thumb2,,,2--
```

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

#### Deterministic Metadata Ordering - The Two-Sort Pattern
```javascript
// In sign() - CIDs collected in natural order
for (var name in FileInfo) {
  if (shouldIncludeFile(FileInfo[name])) {
    body += ',' + FileInfo[name].hash;
    cids.push(FileInfo[name].hash);
  }
}
const signature = await signText(username + ':' + header + body);

// In upload() - FIRST SORT
cids = cids.sort(function (a, b) {
  if (a < b) { return -1; }
  if (a > b) { return 1; }
  return 0;
});

// Parent files already have thumb field set during thumbnail generation
// FileInfo[parentFile].thumb = thumbnailHash; // Set when thumbnail created
// FileInfo[parentFile].meta.thumb = thumbnailHash; // Also set at creation

// Build metadata entries
for (var name in FileInfo) {
  fileMetaEntries[FileInfo[name].hash] = buildMetadataString(FileInfo[name]);
}

// SECOND SORT - Critical for metadata string ordering
cids = cids.sort();
for (var i = 0; i < cids.length; i++) {
  metaString += ',' + fileMetaEntries[cids[i]];
}
```

**Why Deterministic Ordering Matters**:
- **Blockchain efficiency**: Saves 53 bytes per file by using ordered array indices
- **Signature integrity**: Body string and metadata must use identical CID order
- **Reproducible contracts**: Identical metadata regardless of upload timing
- **Verification simplicity**: Predictable structure for validation

**Critical Understanding**: 
- The signature only signs the CID list, not the metadata
- Two sorts are required: one for processing, one for metadata ordering
- Thumbnails are mixed with regular files in the CID array
- The second sort ensures ALL entries (files and thumbnails) are in alphabetical order
- This saves 53 bytes per file and ensures reproducible metadata

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

## Component Integration Best Practices

### 1. Integrating SPK Drive in dApps

```javascript
// In your dApp component
<upload-everywhere 
  :account="account"
  :saccountapi="saccountapi"
  :external-drop="droppedFiles"
  @update:externalDrop="droppedFiles = $event"
  @tosign="handleTransaction"
  @done="handleUploadComplete"
  teleportref="#uploadTarget"
  :video-handling-mode="'external'"  // For centralized video handling
/>
```

### 2. Video Handling Modes

The upload-everywhere component supports two video handling modes:

- **'internal'** (default): Component handles its own video detection and transcoding
- **'external'**: Parent component handles all video processing

When integrating with filesvue-dd.js, always use 'external' mode to prevent duplicate video modals.

### 3. Handling File Drops from External Sources

```javascript
// Parent component - IMPORTANT: Pass raw File objects, not wrappers
methods: {
  handleExternalDrop(files) {
    // For external video handling, pass raw File objects
    this.droppedExternalFiles = { 
      files: files  // Array of File objects
    };
  }
}
```

**Important**: The upload-everywhere component expects raw File objects in the externalDrop.files array. Do not wrap them in additional objects.

### 4. Processing Upload Results

```javascript
handleUploadComplete(result) {
  // Extract IPFS hashes
  const uploadedFiles = result.files.map(file => ({
    cid: file.cid,
    url: `https://ipfs.dlux.io/ipfs/${file.cid}`,
    name: file.name,
    type: file.type
  }));
  
  // Use in your dApp
  this.processUploadedFiles(uploadedFiles);
}
```

## Video Handling Best Practices

### 1. Centralized Video Handling Architecture

To prevent duplicate modals and ensure consistent behavior, video handling should be centralized:

```javascript
// filesvue-dd.js controls all video processing
<upload-everywhere 
  :video-handling-mode="'external'"
  :external-drop="droppedExternalFiles"
  @update:externalDrop="droppedExternalFiles = $event"
/>

// Video flow in filesvue-dd.js
processFilesWithVideoCheck(files) {
  // Separate videos from other files
  videoFiles.forEach(video => pendingVideoFiles.push(video));
  
  // Show choice modal for first video
  showVideoChoiceModal = true;
}

handleVideoChoice(choice) {
  if (choice === 'original' || choice === 'both') {
    // Add raw File object to droppedExternalFiles
    droppedExternalFiles.files.push(video.file);
  }
  if (choice === 'transcode' || choice === 'both') {
    // Queue for background transcoding
    processingFiles.push(video);
  }
}
```

### 2. Video Detection
- Check file extensions: .mp4, .mov, .avi, .mkv, .webm, etc.
- Validate MIME types when available
- Consider file size for transcoding decisions

### 3. Transcoding Decisions
- **Transcode**: Best for streaming, creates HLS format
- **Original**: Preserves quality, larger file size
- **Both**: Maximum flexibility, uses more storage

### 4. HLS Streaming Format
- Main playlist: video.m3u8
- Segments: video_0.ts, video_1.ts, etc.
- Thumbnail: video_thumb.jpg
- Always keep segments with playlist

### 5. Playlist Processing
```javascript
// After segment upload, update playlist
async function updatePlaylist(m3u8File, segmentMap) {
  const content = await readFileAsText(m3u8File);
  const updated = content.replace(/video_(\d+)\.ts/g, (match, num) => {
    const cid = segmentMap[match];
    return `https://ipfs.dlux.io/ipfs/${cid}`;
  });
  return new File([updated], m3u8File.name, { type: m3u8File.type });
}
```

## Advanced Features

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
      resolve(dataURLtoFile(thumbnailDataUrl, `_${imageFile.name}`));
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
FileInfo['_originalfile.jpg'] = {
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
         :checked="FileInfo['_' + fileName].use_thumb"
         @click="resetThumb(fileName)">
  <label>Use Automatic Thumbnail</label>
</div>

// Toggle function
function resetThumb(fileName) {
  FileInfo['_' + fileName].use_thumb = !FileInfo['_' + fileName].use_thumb;
  FileInfo[fileName].meta.thumb = FileInfo['_' + fileName].use_thumb 
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
  FileInfo['_' + file.name] && FileInfo['_' + file.name].use_thumb
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

## Error Handling

### 1. Upload Failures
- Implement retry logic with exponential backoff
- Cache progress to resume failed uploads
- Provide clear error messages to users

### 2. Video Transcoding Errors
- Catch FFmpeg initialization failures
- Handle unsupported codecs gracefully
- Provide fallback to original file upload

### 3. Contract Issues
- Check BROCA balance before operations
- Handle insufficient storage gracefully
- Provide contract upgrade options

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

## Performance Optimization

### 1. File Chunking
- Use 5MB chunks for large files
- Implement parallel chunk uploads
- Track individual chunk progress

### 2. Video Transcoding
- Use Web Workers when available
- Implement quality presets
- Cache transcoded segments

### 3. Preview Generation
- Create blob URLs for local preview
- Generate thumbnails on-demand
- Clean up blob URLs after use

## Security Considerations

### 1. File Validation
- Check file types against whitelist
- Validate file sizes
- Scan for malicious content markers

### 2. Encryption
- Offer optional client-side encryption
- Use strong encryption keys
- Store keys securely

### 3. Authentication
- Sign all upload requests
- Validate signatures server-side
- Use time-limited tokens

## Common Pitfalls and Solutions

### Problem: Signature Mismatch Errors
**Cause**: Multiple issues can cause signature mismatches:
1. CIDs sorted after signature generation
2. Leading comma removed from contract.files
3. Wrong thumbnail prefix used
4. Incorrect path index format

**Solution**: 
1. Never sort CIDs after generating signature
2. Keep the leading comma in contract.files
3. Use underscore prefix for thumbnails: `_filename.jpg`
4. Use correct path index check: `pathIndex !== '1'`

### Problem: Files Not Visible After Upload
**Cause**: Path index incorrectly filtering out root files
**Solution**: 
```javascript
// Wrong - filters out root files
if (pathIndex !== '0') {

// Correct - processes root files
if (pathIndex !== '1') {
```

### Problem: Upload Hanging on "Saving contract update"
**Cause**: Signature verification fails on server due to data format mismatch
**Solution**: Ensure all data formats match exactly:
1. CID order must match signature
2. Body string must include leading comma
3. Thumbnail names must use correct prefix
4. Path indices must be correctly formatted

### Problem: Duplicate Video Modals
**Cause**: Both upload-everywhere and filesvue-dd handling video detection
**Solution**: 
1. Set `:video-handling-mode="'external'"` on upload-everywhere
2. Let filesvue-dd.js control all video processing
3. Ensure only one component shows video choice modal

### Problem: Files Not Appearing in Ready Section
**Cause**: Data structure mismatch - wrapped objects vs raw Files
**Solution**: 
1. Always pass raw File objects to droppedExternalFiles
2. Remove wrapper objects like `{ file: File, fileName: string }`
3. upload-everywhere's watcher extracts files with `item.file`

### Problem: Original Video Files Not Uploading
**Cause**: Files being passed as wrapped objects instead of raw Files
**Solution**:
```javascript
// Wrong
droppedExternalFiles = { files: [{ file: videoFile, fullAppPath: path }] }

// Correct
droppedExternalFiles = { files: [videoFile] }  // Raw File object
```

### Problem: Transcoding Never Completes
**Cause**: Missing progress events in headless mode
**Solution**: Implement auto-complete detection with fallback emit

### Problem: Playlist References Break
**Cause**: Segment URLs not updated after upload
**Solution**: Process playlists after all segments uploaded

## Troubleshooting

### Common Issues

**1. Files Not Uploading**
- Verify blockchain signature is valid and not expired
- Check contract has sufficient storage space
- Ensure IPFS network connectivity
- **Check signature format matches exactly**

**2. Folder Structure Not Preserved**
- Verify `fullAppPath` is set correctly on file objects
- Check path encoding logic in `makePaths()` function
- Ensure folder indices don't exceed available character set
- **Verify path index check is `!== '1'` not `!== '0'`**

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
- **Ensure thumbnail prefix is `_` not `thumb_`**

**6. M3U8 Segment Display Problems**
- Confirm `_thumb.ts` and `_thumb.m3u8` files have `flag: "2"`
- Verify filtering logic excludes thumb segments from main listings
- Check M3U8 playlist references are maintained after upload

**7. Signature Mismatch Errors**
- **Never remove the first CID sort in upload()** - needed for processing
- **Never remove the second CID sort in upload()** - needed for metadata ordering
- **Keep leading comma in contract.files**
- **Use correct thumbnail prefix (`_` not `thumb_`)**
- **Use correct path index check (`!== '1'` not `!== '0'`)**
- **Ensure metadata format uses commas between files, not pipes**
- **Remember: signature signs the CID list, not the metadata string**

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
- **Signature generation and verification steps**
- **CID ordering and metadata formatting**

## Integration Examples

### 1. Blog Post Editor
```javascript
// Add image from SPK Drive
onFileSelected(file) {
  const markdown = `![${file.name}](https://ipfs.dlux.io/ipfs/${file.cid})`;
  this.insertAtCursor(markdown);
}
```

### 2. Video dApp
```javascript
// Handle streaming video
onVideoUploaded(files) {
  const m3u8 = files.find(f => f.name.endsWith('.m3u8'));
  if (m3u8) {
    this.videoUrl = `https://ipfs.dlux.io/ipfs/${m3u8.cid}`;
    this.initializeHlsPlayer();
  }
}
```

### 3. Gallery dApp
```javascript
// Batch process images
async processGalleryUpload(files) {
  const images = files.filter(f => f.type.startsWith('image/'));
  const gallery = await Promise.all(images.map(async img => ({
    thumb: await this.generateThumbnail(img),
    full: `https://ipfs.dlux.io/ipfs/${img.cid}`,
    caption: img.name
  })));
  this.updateGallery(gallery);
}
```

## Future Considerations

1. **IPFS Pinning Services**: Integration with multiple pinning services
2. **Streaming Optimization**: Adaptive bitrate streaming
3. **Collaborative Uploads**: Multi-user upload sessions
4. **Smart Contracts**: On-chain file registry
5. **CDN Integration**: Geographic content distribution

## Conclusion

The SPK Network file upload system provides a robust decentralized file management solution, but requires careful attention to data format consistency. The system's reliance on exact signature matching makes it fragile to seemingly minor changes. Following these best practices and understanding the critical implementation requirements ensures consistent behavior, optimal performance, and seamless integration across DLUX dApps.

**Key Takeaways**:
1. **Never modify data after signature generation**
2. **Maintain exact format consistency** (leading commas, path indices, thumbnail prefixes)
3. **Test thoroughly** - small changes can break the entire system
4. **Enable debug logging** when troubleshooting upload issues
5. **Document all format requirements** to prevent future breaking changes

---

*This documentation reflects the SPK Network file upload system as implemented in the DLUX IOV project. For the latest updates and API changes, refer to the official SPK Network documentation and the project's GitHub repository.*