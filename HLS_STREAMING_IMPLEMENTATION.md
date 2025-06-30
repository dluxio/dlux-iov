# HLS Streaming Implementation Guide for DLUX IOV

## Overview

DLUX IOV implements HTTP Live Streaming (HLS) support through a modular video transcoding system that converts video files to HLS format for efficient streaming over IPFS. The implementation uses FFmpeg.wasm for client-side transcoding and includes IPFS URL hashing for distributed playback.

## Architecture

### Core Components

#### 1. Video Transcoder (`video-transcoder.js`)
**Purpose**: Client-side video transcoding using FFmpeg.wasm
**Key Features**:
- Multi-resolution HLS transcoding (480p, 720p, 1080p)
- Automatic thumbnail generation
- Progress tracking with UI feedback
- IPFS URL integration for distributed playback
- Memory-efficient cleanup system

#### 2. Playlist Processor (`playlist-processor.js`)
**Purpose**: Process HLS playlists to replace local references with IPFS URLs
**Key Features**:
- Segment file hashing during transcoding
- Playlist URL replacement
- Master playlist generation
- Preserves original files while creating IPFS-compatible versions

#### 3. FFmpeg Manager (`ffmpeg-manager.js`)
**Purpose**: Singleton service managing FFmpeg.wasm lifecycle
**Key Features**:
- Lazy loading of FFmpeg binaries
- Shared instance across components
- File system management
- Progress event handling

#### 4. Thumbnail Service (`thumbnail-service.js`)
**Purpose**: Centralized thumbnail generation for all file types
**Key Features**:
- Extensible generator architecture
- Video thumbnail extraction at 2-second mark
- Canvas-based image resizing
- Consistent 400x300 output format

## HLS Transcoding Workflow

### 1. User Selection
```javascript
// video-choice-modal.js presents options:
- Transcode streaming version only (Recommended)
- Original file only  
- Both original and transcoded
```

### 2. Transcoding Process
```javascript
// video-transcoder.js workflow:
1. Load FFmpeg.wasm
2. Determine available resolutions based on source
3. Transcode each resolution:
   - Generate segments (.ts files)
   - Create resolution playlists (480p_index.m3u8)
   - Hash segments for IPFS
4. Create master playlist with IPFS URLs
5. Generate thumbnail
6. Wrap files with ProcessedFile metadata
```

### 3. IPFS URL Integration
```javascript
// During transcoding, segments are hashed and playlists updated:
// Original: 480p_000.ts
// Becomes: https://ipfs.dlux.io/ipfs/QmHash?filename=480p_000.ts

// Master playlist references:
#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=854x480
https://ipfs.dlux.io/ipfs/QmHash1?filename=480p_index.m3u8
```

### 4. File Upload Integration
```javascript
// Files are wrapped with metadata:
new ProcessedFile(file, {
    originalName: 'video.mp4',
    type: 'video/mp4',
    folderPath: 'videos/2024',
    thumb: thumbnailCID,
    isTranscoded: true
});
```

## HLS Playback

### 1. Detection
```javascript
// methods-common.js - observeVideoElements()
- Monitors DOM for video elements
- Detects HLS content by:
  - File extension (.m3u8)
  - MIME type (application/x-mpegURL)
  - URL patterns (filename parameter)
  - Data attributes
```

### 2. Player Initialization
```javascript
// setupHLSPlayer() handles two cases:

// HLS.js (Chrome, Firefox, Edge)
const hls = new Hls({
    loader: IpfsLoader,  // Custom loader for IPFS
    debug: false,
    enableWorker: true
});
hls.loadSource(videoSrc);
hls.attachMedia(videoElement);

// Native HLS (Safari)
if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
    videoElement.src = videoSrc;
}
```

### 3. IPFS Custom Loader
```javascript
// Handles IPFS gateway URL construction
- Converts IPFS URLs to gateway URLs
- Manages filename parameters
- Handles progress events
- Supports abort operations
```

## Critical Implementation Details

### 1. File Processing Order
```javascript
// Correct upload order for HLS:
1. Segments (.ts files) - Must be uploaded first
2. Thumbnails - Can be uploaded in parallel
3. Resolution playlists - Reference segments
4. Master playlist - References resolution playlists
```

### 2. URL Hashing Requirements
- Segments MUST be hashed during transcoding
- Playlists MUST contain IPFS URLs, not local references
- Original files are preserved for re-upload if needed

### 3. Memory Management
```javascript
// Cleanup is critical to prevent memory leaks:
cleanup() {
    // Clean up transcoded files
    this.transcodedFiles = [];
    this.outputFiles = {};
    
    // Revoke blob URLs
    Object.values(this.blobUrls).forEach(URL.revokeObjectURL);
    
    // Clean up HLS player
    if (this.hlsInstance) {
        this.hlsInstance.destroy();
    }
    
    // Clean up FFmpeg session files
    this.cleanupSessionFiles();
}
```

### 4. Error Handling
- Blob URL detection prevents upload of preview files
- IPFS URL validation ensures proper format
- Fallback for browsers without HLS.js support
- Graceful degradation for transcoding failures

## Configuration

### Video Transcoding Settings
```javascript
const resolutions = [
    { height: 480, width: 854, bitrate: 800 },   // 480p
    { height: 720, width: 1280, bitrate: 2500 }, // 720p
    { height: 1080, width: 1920, bitrate: 5000 } // 1080p
];

const ffmpegParams = {
    '-c:v': 'libx264',
    '-profile:v': 'main',
    '-c:a': 'aac',
    '-b:a': '128k',
    '-f': 'segment',
    '-segment_time': '5',
    '-hls_time': '3',
    '-force_key_frames': 'expr:gte(t,n_forced*3)'
};
```

### Thumbnail Settings
```javascript
const thumbnailOptions = {
    maxWidth: 400,
    maxHeight: 300,
    quality: 0.8,
    format: 'jpeg',
    seekTime: 2  // Extract at 2 seconds
};
```

## Debugging

### Enable Debug Logging
```javascript
localStorage.setItem('dlux_debug', 'true');
localStorage.setItem('hlsDebug', 'true');
```

### Common Issues

1. **"RangeError: Offset is outside the bounds"**
   - Cause: Memory allocation issues in FFmpeg
   - Solution: Process smaller segments or reduce resolution

2. **Playlists contain blob URLs**
   - Cause: Preview URLs leaked into upload
   - Solution: File validation prevents upload

3. **Playback fails on IPFS**
   - Cause: Relative URLs in playlists
   - Solution: All URLs must be absolute IPFS URLs

4. **Memory leaks**
   - Cause: Blob URLs not revoked
   - Solution: Always call cleanup() after processing

## Best Practices

1. **Always validate HLS files before upload**
   - Check for blob URLs
   - Verify IPFS URL format
   - Ensure segments are hashed

2. **Use ProcessedFile wrapper**
   - Maintains metadata consistency
   - Preserves folder structure
   - Links thumbnails properly

3. **Handle user cancellation**
   - Clean up transcoding state
   - Revoke blob URLs
   - Remove temporary files

4. **Monitor memory usage**
   - Large videos can consume significant memory
   - Implement progress feedback
   - Allow users to skip transcoding

## Future Enhancements

1. **Adaptive Bitrate Streaming**
   - Dynamic quality switching
   - Bandwidth detection
   - Buffer management

2. **Additional Codecs**
   - VP9/WebM support
   - AV1 encoding
   - Hardware acceleration

3. **Streaming Optimizations**
   - Smaller segment sizes
   - Faster initial playback
   - Preload optimization

## Related Documentation

- [SPK Drive File Management](./SPK_DRIVE_FILE_MANAGEMENT_BEST_PRACTICES.md)
- [Video Transcoder API](./js/video-transcoder.js)
- [FFmpeg Manager Service](./js/services/ffmpeg-manager.js)
- [HLS Debug Utilities](./js/utils/hls-debug.js)