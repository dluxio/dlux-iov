# HLS Implementation & Playback Guide - DLUX IOV
*Last Updated: 2025-06-30*

## Table of Contents
1. [Critical IPFS Requirements](#critical-ipfs-requirements)
2. [Architecture Overview](#architecture-overview)
3. [Implementation Flow](#implementation-flow)
4. [Component Details](#component-details)
5. [File Processing Pipeline](#file-processing-pipeline)
6. [Playback System](#playback-system)
7. [Common Issues & Solutions](#common-issues--solutions)
8. [Best Practices](#best-practices)
9. [Debugging Guide](#debugging-guide)
10. [Technical Reference](#technical-reference)

## Critical IPFS Requirements

**⚠️ CRITICAL**: Standard HLS with relative paths **DOES NOT WORK** on IPFS. This is a fundamental limitation of content-addressed storage.

### Required Format
All HLS implementations must:
1. **Use absolute IPFS URLs** for ALL file references
2. **Include CIDs** in every URL
3. **Process playlists BEFORE upload** to replace relative paths
4. **Hash modified content** to get correct CIDs

### Example Formats

**❌ INCORRECT - Standard HLS (Does NOT work on IPFS):**
```m3u8
#EXTM3U
#EXTINF:10.0,
720p_000.ts
#EXTINF:10.0,
720p_001.ts
```

**✅ CORRECT - IPFS-Ready Format:**
```m3u8
#EXTM3U
#EXTINF:10.0,
https://ipfs.dlux.io/ipfs/QmHash123...?filename=720p_000.ts
#EXTINF:10.0,
https://ipfs.dlux.io/ipfs/QmHash456...?filename=720p_001.ts
```

## Architecture Overview

### System Components
```
┌─────────────────────────────────────────────────────┐
│                 Vue Component                        │
│           (new/index.html)                          │
│  - User selects video file                          │
│  - Initiates transcoding process                    │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│           Video Transcoder Component                 │
│         (js/video-transcoder.js)                    │
│  - FFmpeg.wasm transcodes to HLS                   │
│  - Manages session-based progress routing           │
│  - Hashes all files during transcoding             │
│  - Updates playlists with IPFS URLs                │
│  - Wraps files with ProcessedFile metadata         │
│  - Enforces singleton queue management              │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│              Upload System                           │
│           (js/uploadvue-dd.js)                      │
│  - Receives pre-hashed files                        │
│  - Recognizes .cid property                         │
│  - Uploads without modification                     │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│              Playback System                         │
│  (filesvue-dd.js / spkdrive.js)                    │
│  - Shows file preview modal                         │
│  - Creates video element                            │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│            MutationObserver                          │
│  (methods-common.js - observeVideoElements)         │
│  - Detects new video elements                       │
│  - Sets type attribute                              │
│  - Triggers HLS setup                               │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│           HLS.js Initialization                      │
│  (methods-common.js - setupHLSPlayer)               │
│  - Creates HLS instance with IPFS loader            │
│  - Handles manifest parsing                         │
│  - Manages playback                                 │
└─────────────────────────────────────────────────────┘
```

## Implementation Flow

### Complete Processing Pipeline
```
1. User selects video
   ↓
2. Video Transcoder Component
   - FFmpeg creates segments (.ts) and playlists (.m3u8)
   - Hash each segment → get CID
   - Replace playlist references with IPFS URLs
   - Hash modified playlists → get CIDs  
   - Create master playlist with IPFS URLs
   - Hash master playlist → get CID
   ↓
3. Send to Upload Queue
   - All files have pre-calculated CIDs
   - Files wrapped with ProcessedFile metadata
   - Ready for upload without modification
   ↓
4. Upload System
   - Detects pre-hashed files (file.cid exists)
   - Uses existing CIDs instead of recalculating
   - Uploads files as-is
   ↓
5. IPFS Storage
   - Files stored with their CIDs
   - Playlists contain absolute IPFS URLs
   - Ready for playback
```

## Component Details

### 1. Video Transcoder Component (`js/video-transcoder.js`)

The modular video transcoder handles all HLS processing:

#### Key Responsibilities:
- Transcode videos using FFmpeg.wasm
- Hash all files during transcoding
- Update playlists with IPFS URLs
- Wrap files with metadata
- Manage queue for sequential processing (FFmpeg singleton limitation)
- Route progress events to correct video instance

#### Critical Code Sections:

**Segment Hashing (lines 565-575):**
```javascript
// Hash segments during transcoding
const segmentMapping = new Map();

for (const segmentName of tsFiles) {
    const segmentData = extractedFiles.get(segmentName);
    
    // Hash the segment to get its CID
    const buf = buffer.Buffer(segmentData);
    const hashResult = await Hash.of(buf, { unixfs: 'UnixFS' });
    segmentMapping.set(segmentName, hashResult);
    
    // Create file and assign CID
    const segmentFile = new File([segmentData], segmentName, {
        type: 'video/mp2t',
        lastModified: now
    });
    segmentFile.cid = hashResult;
}
```

**Playlist URL Replacement (lines 599-605):**
```javascript
// Replace segment references with IPFS URLs
segmentMapping.forEach((segmentCID, segmentName) => {
    const segmentPattern = new RegExp(
        segmentName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 
        'g'
    );
    const ipfsUrl = `https://ipfs.dlux.io/ipfs/${segmentCID}?filename=${segmentName}`;
    playlistContent = playlistContent.replace(segmentPattern, ipfsUrl);
});

// Hash the updated playlist
const buf = buffer.Buffer(updatedPlaylistData);
const hashResult = await Hash.of(buf, { unixfs: 'UnixFS' });
playlistFile.cid = hashResult;
```

**Master Playlist Creation (lines 1187-1192):**
```javascript
// Master playlist references resolution playlists by CID
if (playlist.cid) {
    masterContent += `https://ipfs.dlux.io/ipfs/${playlist.cid}?filename=${playlist.fileName}\n`;
}
```

### 2. Upload System (`js/uploadvue-dd.js`)

The upload system recognizes pre-hashed files:

**Pre-calculated CID Detection (lines 826-837):**
```javascript
if (currentFile.cid) {
    debugLogger.debug(`Using pre-calculated CID for ${currentFile.name}: ${currentFile.cid}`);
    hashPromise = Promise.resolve({
        hash: currentFile.cid,
        opts: { 
            index: indexForFile, 
            path: pathForFile, 
            originalFile: currentFile 
        }
    });
} else {
    // Calculate CID normally
    hashPromise = this.hashOf(
        buffer.Buffer(fileContent), 
        { index: indexForFile, path: pathForFile, originalFile: currentFile }
    );
}
```

### 3. IPFS Loader (`js/methods-common.js`)

The IPFS loader handles playback:
- Works with absolute IPFS URLs only
- Does NOT handle relative path resolution
- Expects URLs in format: `https://ipfs.dlux.io/ipfs/{CID}?filename={name}`

## File Processing Pipeline

### Processing Order (Critical!)
1. **Create and hash segments** first
2. **Update playlists** with segment CIDs
3. **Hash updated playlists**
4. **Create master** with playlist CIDs
5. **Hash master playlist**

### File Structure Transformation

**FFmpeg Output (Raw - NOT IPFS compatible):**
```
├── 720p_index.m3u8  (contains: 720p_000.ts, 720p_001.ts)
├── 720p_000.ts
├── 720p_001.ts
└── ...
```

**After Video Transcoder Processing (IPFS-Ready):**
```
├── master.m3u8 (contains IPFS URLs to playlists)
├── 720p_index.m3u8 (contains IPFS URLs to segments)
├── 720p_000.ts
└── ...
```

### IPFS Storage Pattern
```
CID                  Filename              Content
Qm...ABC            master.m3u8           References playlists by CID
Qm...DEF            720p_index.m3u8       References segments by CID
Qm...GHI            720p_000.ts           Video segment
Qm...JKL            poster.jpg            Thumbnail
```

## Playback System

### HLS Detection Hierarchy

1. **Primary Detection (Most Reliable):**
```javascript
video.type === 'application/x-mpegURL'
video.type === 'application/vnd.apple.mpegurl'
```

2. **Secondary Detection (File Extension):**
```javascript
url.endsWith('.m3u8')
url.includes('.m3u8?')
url.includes('.m3u8#')
```

3. **Tertiary Detection (URL Patterns):**
```javascript
url.includes('/manifest.m3u8')
url.includes('/playlist.m3u8')
url.includes('/master.m3u8')
url.includes('/index.m3u8')
```

4. **Fallback Detection (Heuristics):**
```javascript
// Filename parameter without extension
url.includes('filename=') && url.includes('m3u')
// HLS-related keywords
url.includes('hls') && url.includes('playlist')
```

### IPFS-Aware HLS Configuration
```javascript
const hls = new Hls({
  debug: false,
  enableWorker: true,
  lowLatencyMode: false,
  loader: IpfsLoader,  // Custom loader for IPFS
  
  // IPFS-specific settings
  maxBufferLength: 30,
  maxMaxBufferLength: 600,
  maxBufferSize: 60 * 1000 * 1000,  // 60 MB
  
  // Error recovery
  fragLoadingTimeOut: 20000,
  fragLoadingMaxRetry: 3,
  levelLoadingTimeOut: 10000,
  levelLoadingMaxRetry: 4
});
```

## Common Issues & Solutions

### Issue 1: File CID Mismatch
**Problem:** Files modified after CID calculation
**Solution:** Hash files during transcoding, not during upload

### Issue 2: 400 Bad Request on Playback
**Problem:** Playlist contains relative references
**Solution:** Ensure IPFS URL replacement is working

### Issue 3: Missing File Extensions
**Problem:** Files without .m3u8 extension fail detection
**Solution:** Implement robust fallback detection

### Issue 4: No Hash Found for File
**Problem:** File wasn't hashed during transcoding
**Solution:** Check segmentMapping population

### Issue 5: IPFS Gateway Timeout
**Problem:** Large segments timeout when loading
**Solution:** Implement retry logic in IPFS loader

### Issue 6: Progress Bar Routing for Multiple Videos
**Problem:** Only first video's progress bar updates when multiple videos are queued
**Root Cause:** FFmpeg singleton broadcasts progress to all instances
**Solution:** Implement session-based progress filtering:
```javascript
// Global session tracking
let activeTranscodingSession = null;

// In startProcess() after session ID creation:
this.unsubscribeProgress = ffmpegManager.onProgress(({ progress, time }) => {
    const isActiveSession = this.sessionId === activeTranscodingSession;
    if (!isActiveSession) {
        return;
    }
    // Process progress events only for active session
});
```

### Issue 7: Vue 3 Reactivity Issues
**Problem:** `this.$set is not a function` error when updating progress
**Solution:** Remove Vue 2 API calls, rely on Vue 3's automatic reactivity:
```javascript
// WRONG - Vue 2 pattern
this.$set(this.processingFiles, index, processingFile);

// CORRECT - Vue 3 pattern
// Just update the object directly
processingFile.progress = progressData;
```

## Best Practices

### 1. Always Hash During Creation
```javascript
// Good: Hash immediately after creating file content
const data = new TextEncoder().encode(content);
const buf = buffer.Buffer(data);
const cid = await Hash.of(buf, { unixfs: 'UnixFS' });
file.cid = cid;
```

### 2. Process Files in Correct Order
- Segments first (hash as created)
- Playlists second (update with segment CIDs, then hash)
- Master last (update with playlist CIDs, then hash)

### 3. Use ProcessedFile Wrapper
```javascript
// Wrap files with metadata for upload system
const wrapped = new ProcessedFile(file, {
    isAuxiliary: true,
    role: FileRoles.PLAYLIST,
    parentFile: 'master.m3u8',
    processorId: 'video-transcoder'
});
```

### 4. Pre-assign CIDs
```javascript
// Upload system will skip hashing if CID exists
file.cid = calculatedCID;
```

### 5. Never Modify Files After Hashing
Once a file has been hashed and its CID calculated, never modify it. All modifications must happen before hashing.

### 6. Handle FFmpeg Singleton Limitations
```javascript
// FFmpeg can only process one video at a time
// Use global session tracking to ensure proper queue management
let activeTranscodingSession = null;

// When starting transcoding:
if (activeTranscodingSession && activeTranscodingSession !== this.sessionId) {
    // Another transcoding is active, wait or queue
    return;
}
activeTranscodingSession = this.sessionId;

// When transcoding completes or cancels:
if (activeTranscodingSession === this.sessionId) {
    activeTranscodingSession = null;
}
```

### 7. Implement Session-Based Progress Routing
```javascript
// Subscribe to progress AFTER creating session ID
startProcess() {
    this.sessionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Subscribe with session filtering
    this.unsubscribeProgress = ffmpegManager.onProgress(({ progress, time }) => {
        if (this.sessionId !== activeTranscodingSession) {
            return; // Ignore if not active session
        }
        // Handle progress for this session only
    });
}
```

## Debugging Guide

### Enable Debug Logging
```javascript
localStorage.setItem('dlux_debug', 'true');
localStorage.setItem('dlux_hls_debug', 'true');
```

### Key Log Messages to Watch For

**During Transcoding:**
- `🔑 Hashed segment {name}: {CID}`
- `🔑 Hashed playlist {name}: {CID}`
- `📝 Replaced {segment} with {IPFS URL}`

**During Upload:**
- `Using pre-calculated CID for {name}: {CID}`
- `File CID Mismatch` (indicates modification after hashing)

**During Playback:**
- `HLS detected via fallback: {url}`
- `Setting up HLS player for video element`

### Verification Checklist
1. ✅ Original playlists have local references
2. ✅ Processed playlists have IPFS URLs
3. ✅ Master playlist references playlists by CID
4. ✅ All files have .cid property before upload
5. ✅ No "File CID Mismatch" errors during upload

## Technical Reference

### ProcessedFile Metadata Structure
```javascript
{
    isAuxiliary: true,           // Not the main file
    role: FileRoles.SEGMENT,     // SEGMENT, PLAYLIST, or POSTER
    parentFile: 'master.m3u8',   // Parent file reference
    processorId: 'video-transcoder'
}
```

### File Roles Enum
```javascript
FileRoles = {
    SEGMENT: 'segment',      // .ts files
    PLAYLIST: 'playlist',    // .m3u8 files
    POSTER: 'poster'        // thumbnail images
}
```

### IPFS URL Format
```
https://ipfs.dlux.io/ipfs/{CID}?filename={originalFileName}
```

### Supported Video Formats for Transcoding
- MP4, WebM, AVI, MOV, MKV
- Output: HLS (H.264/AAC in MPEG-TS containers)

### Performance Considerations
- Start with lower quality variant for faster initial playback
- Allow HLS.js to adapt based on bandwidth
- Clean up HLS instances when not needed
- Use IntersectionObserver for lazy loading
- FFmpeg.wasm runs as singleton - process videos sequentially
- Properly clean up progress subscriptions to prevent memory leaks
- Session-based routing ensures correct progress display

### Security Considerations
- Verify M3U8 content before parsing
- Sanitize URLs in playlists
- Validate segment references
- Ensure IPFS gateway has proper CORS headers

## Summary

The DLUX IOV HLS implementation is specifically designed for IPFS compatibility:

1. **IPFS requires absolute URLs** - relative paths don't work
2. **Hash during transcoding** - not during upload
3. **Process files in order** - segments → playlists → master
4. **Use IPFS URL format** - `https://ipfs.dlux.io/ipfs/{CID}?filename={name}`
5. **Pre-assign CIDs** - upload system respects existing CIDs
6. **Wrap with metadata** - use ProcessedFile for proper handling
7. **Manage FFmpeg singleton** - queue videos for sequential processing
8. **Route progress correctly** - use session-based filtering for multiple videos
9. **Vue 3 reactivity** - avoid Vue 2 patterns like `$set`

This implementation ensures HLS content works correctly on IPFS by handling the unique requirements of content-addressed storage while properly managing concurrent video processing requests.

---
*For questions or issues, please refer to the debugging guide above or check the console logs with debug mode enabled.*