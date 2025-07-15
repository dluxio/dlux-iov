# OLD HLS IMPLEMENTATION
*Technical Documentation for Working HLS System (Commit b594e22)*

## Overview

The old HLS implementation successfully handled HTTP Live Streaming video uploads by implementing a **two-phase upload process** with **manifest URL rewriting** to ensure IPFS CID compliance. This system worked by uploading video segments first, then processing M3U8 playlist files to replace relative references with proper IPFS URLs before uploading the manifests.

## Architecture Flow

```
1. Video Transcoding (FFmpeg) → Raw HLS Output
2. Segment Upload Phase → Individual .ts files get IPFS CIDs  
3. Manifest Processing Phase → Replace relative URLs with IPFS URLs
4. Manifest Upload Phase → Upload rewritten M3U8 files
5. Master Playlist Generation → Create master.m3u8 with IPFS references
```

## Detailed Technical Implementation

### 1. Transcoding Process (`v3-user.js:4580-4620`)

**Input**: Single video file  
**Output**: HLS package with segments and resolution playlists

```javascript
// FFmpeg transcoding generates:
// - Video segments: 720p_000.ts, 720p_001.ts, etc.
// - Resolution playlists: 720p_index.m3u8, 480p_index.m3u8, etc.
// - Each resolution playlist contains relative references to .ts segments
```

**Key Point**: Raw FFmpeg output contains **relative file references** in M3U8 files, which don't work with IPFS.

### 2. Segment Upload Phase (`v3-user.js:4582-4620`)

**Purpose**: Upload all .ts video segments first to get their IPFS CIDs

```javascript
// Process video segments (.ts files)
for (const file of files) {
  if (file.name.includes('.ts')) {
    const originalName = file.name;
    const data = await ffmpeg.readFile(file.name);
    
    // Rename with _thumb suffix for special handling
    const thumbName = file.name.replace('.ts', '_thumb.ts');
    const segmentFile = new File([data], thumbName, { type: 'video/mp2t' });
    
    // Upload segment and get IPFS hash
    videoFiles.push({
      file: segmentFile,
      targetPath: '/Videos',
      isThumb: true
    });
    
    // Critical: Build segment mapping for URL replacement
    segmentMapping.set(originalName, actualHash);
  }
}
```

**Result**: 
- `segmentMapping` contains: `"720p_000.ts" → "QmHash123..."`
- All segments uploaded with `_thumb.ts` suffix
- IPFS CIDs available for manifest processing

### 3. Manifest Processing Phase (`v3-user.js:4621-4650`)

**Purpose**: Replace relative segment references with full IPFS URLs

```javascript
const processPlaylists = async () => {
  // Wait for all segments to be processed first
  await Promise.all(videoSegmentPromises);
  
  for (const file of files) {
    if (file.name.includes('.m3u8') && file.name.includes('p_index')) {
      // Read original M3U8 content
      const data = await ffmpeg.readFile(file.name);
      let playlistContent = new TextDecoder().decode(data);
      
      // CRITICAL: Replace segment references with IPFS URLs
      segmentMapping.forEach((actualHash, originalName) => {
        const segmentPattern = new RegExp(originalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        playlistContent = playlistContent.replace(
          segmentPattern, 
          `https://ipfs.dlux.io/ipfs/${actualHash}?filename=${originalName}`
        );
      });
      
      // Create new file with rewritten content
      const resPlaylistFile = new File([new TextEncoder().encode(playlistContent)], 
        file.name.replace('.m3u8', '_thumb.m3u8'), 
        { type: 'application/x-mpegURL' }
      );
      
      videoFiles.push({
        file: resPlaylistFile,
        targetPath: '/Videos',
        isThumb: true,
        isResolutionPlaylist: true
      });
    }
  }
};
```

**Before Processing** (Raw FFmpeg output):
```m3u8
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXTINF:10.0,
720p_000.ts
#EXTINF:10.0,
720p_001.ts
#EXT-X-ENDLIST
```

**After Processing** (IPFS-compliant):
```m3u8
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXTINF:10.0,
https://ipfs.dlux.io/ipfs/QmHash123...?filename=720p_000.ts
#EXTINF:10.0,
https://ipfs.dlux.io/ipfs/QmHash456...?filename=720p_001.ts
#EXT-X-ENDLIST
```

### 4. Master Playlist Generation (`v3-user.js:4720-4739`)

**Purpose**: Create master M3U8 that references resolution playlists with IPFS URLs

```javascript
let masterPlaylistContent = '#EXTM3U\n#EXT-X-VERSION:3\n';

resolutionPlaylists.forEach(p => {
  const bandwidth = this.getBandwidthForResolution(p.resolution);
  const dimensions = this.getResolutionDimensions(p.resolution);
  
  masterPlaylistContent += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${dimensions.width}x${dimensions.height}\n`;
  masterPlaylistContent += `https://ipfs.dlux.io/ipfs/${p.hash}?filename=${p.fileName}\n`;
});

const masterPlaylistFile = new File([new TextEncoder().encode(masterPlaylistContent)], 
  'master_playlist.m3u8', 
  { type: 'application/x-mpegURL' }
);
```

**Master Playlist Output**:
```m3u8
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=1280x720
https://ipfs.dlux.io/ipfs/QmResolution720Hash?filename=720p_index_thumb.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=400000,RESOLUTION=854x480
https://ipfs.dlux.io/ipfs/QmResolution480Hash?filename=480p_index_thumb.m3u8
```

### 5. Upload Workflow Integration (`uploadvue-dd.js:655-673`)

**Purpose**: Handle thumb files with special processing flags

```javascript
// Check if this is a thumb file (ends with _thumb.ts or _thumb.m3u8)
const isThumbFile = dict.name.endsWith('_thumb.ts') || dict.name.endsWith('_thumb.m3u8');

if (isThumbFile) {
    this.FileInfo[dict.name].is_thumb = true;
    this.FileInfo[dict.name].use_thumb = true;
    console.log(`Processed thumb file: ${dict.name} with flag 2`);
}
```

## Why This System Worked

### 1. **Sequential Processing**
- Segments uploaded first to get CIDs
- Manifests processed only after all segments have CIDs
- Master playlist generated last with all references resolved

### 2. **Proper URL Structure**
- Full IPFS URLs: `https://ipfs.dlux.io/ipfs/QmCID?filename=original.ts`
- Filename hints for gateway compatibility
- No relative paths that HLS.js can't resolve

### 3. **IPFS CID Compliance** 
- Every file reference uses actual IPFS Content Identifier
- HLS.js receives fully qualified URLs it can load directly
- No URL resolution required by the player

### 4. **File Organization**
- Segments: `720p_000_thumb.ts` (marked as thumb files)
- Resolution playlists: `720p_index_thumb.m3u8` (marked as thumb files)  
- Master playlist: `master_playlist.m3u8` (main entry point)

## Critical Success Factors

### 1. **segmentMapping Object**
```javascript
// Maps original filenames to IPFS hashes
segmentMapping.set('720p_000.ts', 'QmActualIPFSHash...');
```

### 2. **Regex Pattern Replacement**
```javascript
// Escapes special characters and replaces exact matches
const segmentPattern = new RegExp(originalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
playlistContent = playlistContent.replace(segmentPattern, ipfsUrl);
```

### 3. **Filename Parameter**
```javascript
// Adds filename hint for IPFS gateway compatibility
`https://ipfs.dlux.io/ipfs/${hash}?filename=${originalName}`
```

### 4. **Two-Phase Upload**
```javascript
// Phase 1: Upload segments, build hash mapping
await Promise.all(videoSegmentPromises);

// Phase 2: Process manifests with hash mapping, upload manifests
await processPlaylists();
```

## Integration Points

### File Detection (`uploadvue-dd.js`)
- Recognizes `_thumb.ts` and `_thumb.m3u8` files
- Sets special processing flags
- Handles upload workflow differently for thumb files

### HLS Player (`methods-common.js`)
- IPFS loader transforms URLs properly
- Receives fully qualified IPFS URLs
- No complex relative path resolution needed

## Failure Points if Missing

1. **No segment mapping** → Manifests keep relative references
2. **No URL replacement** → HLS.js gets malformed URLs like `https://ipfs.dlux.io/ipfs/720p_000.ts`
3. **Wrong upload order** → Manifests processed before segments have CIDs
4. **Missing filename parameter** → IPFS gateway compatibility issues

## Result

This system produced HLS packages where:
- **Master playlist** contains IPFS URLs to resolution playlists
- **Resolution playlists** contain IPFS URLs to video segments  
- **All references** are fully qualified IPFS URLs
- **HLS.js player** receives proper URLs it can load directly

**Example working URL structure:**
```
Master: https://ipfs.dlux.io/ipfs/QmMaster?filename=master_playlist.m3u8
├── Resolution: https://ipfs.dlux.io/ipfs/QmRes720?filename=720p_index_thumb.m3u8
│   ├── Segment: https://ipfs.dlux.io/ipfs/QmSeg1?filename=720p_000.ts
│   └── Segment: https://ipfs.dlux.io/ipfs/QmSeg2?filename=720p_001.ts
└── Resolution: https://ipfs.dlux.io/ipfs/QmRes480?filename=480p_index_thumb.m3u8
    ├── Segment: https://ipfs.dlux.io/ipfs/QmSeg3?filename=480p_000.ts
    └── Segment: https://ipfs.dlux.io/ipfs/QmSeg4?filename=480p_001.ts
```

This is why the old files (like `master_playlist.m3u8`) work perfectly while new files (like `dr1.m3u8`, `dr2.m3u8`) fail - the new system skips the critical manifest URL rewriting phase.