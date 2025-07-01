# Video Transcoding Queue Management

## Overview

The DLUX IOV video transcoding system implements a queue management pattern to handle the FFmpeg.wasm singleton limitation. Since FFmpeg can only process one video at a time, proper queue management and progress routing is essential for a good user experience when multiple videos are selected for transcoding.

## The FFmpeg Singleton Problem

### Core Issue
- FFmpeg.wasm operates as a singleton instance
- Only one video can be transcoded at a time
- All video transcoder component instances receive the same progress events
- Without proper routing, all progress bars update with the same values

### Technical Details
```javascript
// FFmpeg Manager broadcasts to ALL subscribers
this.ffmpeg.on('progress', (event) => {
    this.progressCallbacks.forEach(callback => {
        callback(event);  // Every instance gets this
    });
});
```

## Solution: Session-Based Progress Routing

### Implementation Pattern

1. **Global Session Tracking**
```javascript
// Track which video is currently transcoding
let activeTranscodingSession = null;
```

2. **Session ID Generation**
```javascript
// Each transcoder instance gets unique session ID
this.sessionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
```

3. **Progress Subscription Timing**
```javascript
// Subscribe AFTER session ID is created, not during init
startProcess() {
    // Create session ID first
    this.sessionId = generateSessionId();
    
    // Set as active session
    activeTranscodingSession = this.sessionId;
    
    // Subscribe with filtering
    this.unsubscribeProgress = ffmpegManager.onProgress(({ progress, time }) => {
        const isActiveSession = this.sessionId === activeTranscodingSession;
        if (!isActiveSession) {
            return;  // Ignore if not our turn
        }
        // Process progress for this session only
        this.updateProgress(progress, time);
    });
}
```

4. **Cleanup on Completion**
```javascript
// Clear active session when done
handleTranscodingComplete() {
    if (activeTranscodingSession === this.sessionId) {
        activeTranscodingSession = null;
    }
    // Allow next video to start
    this.$emit('transcoding-complete');
}
```

## Queue Management in filesvue-dd.js

### Processing Queue Implementation
```javascript
// Check if another video is already transcoding
async tryStartNextTranscode() {
    // If something is already transcoding, wait
    if (activeTranscodingSession) {
        return;
    }
    
    // Find next video in queue
    const nextVideo = this.processingFiles.find(
        f => f.status === 'queued' && f.type === 'video'
    );
    
    if (nextVideo) {
        // Start transcoding this video
        this.startVideoTranscoding(nextVideo);
    }
}
```

### Vue 3 Reactivity Considerations
```javascript
// Vue 3 - Direct property updates work
handleProcessingProgress(processingId, progressData) {
    const processingFile = this.processingFiles.find(f => f.id === processingId);
    if (processingFile) {
        processingFile.progress = progressData;
        // No need for this.$set in Vue 3
    }
}
```

## Common Pitfalls to Avoid

### 1. Early Progress Subscription
```javascript
// WRONG - Subscribing before session ID exists
async initFFmpeg() {
    await ffmpegManager.load();
    this.unsubscribeProgress = ffmpegManager.onProgress(...);  // Too early!
}

// CORRECT - Subscribe after session ID creation
async startProcess() {
    this.sessionId = generateSessionId();
    this.unsubscribeProgress = ffmpegManager.onProgress(...);
}
```

### 2. Not Filtering Progress Events
```javascript
// WRONG - Processing all progress events
ffmpegManager.onProgress(({ progress, time }) => {
    this.updateProgress(progress, time);  // Updates all instances!
});

// CORRECT - Filter by session
ffmpegManager.onProgress(({ progress, time }) => {
    if (this.sessionId !== activeTranscodingSession) return;
    this.updateProgress(progress, time);
});
```

### 3. Vue 2 Patterns in Vue 3
```javascript
// WRONG - Vue 2 pattern
this.$set(this.processingFiles, index, updatedFile);

// CORRECT - Vue 3 pattern
this.processingFiles[index] = updatedFile;
// Or just update properties directly
processingFile.progress = newProgress;
```

## Visual Queue Feedback

### Progress Bar States
- **Active**: Shows animated progress for currently transcoding video
- **Queued**: Shows "Waiting..." or similar indicator
- **Complete**: Shows 100% with success styling
- **Error**: Shows error state with retry option

### Example UI Pattern
```html
<div v-for="file in processingFiles" :key="file.id">
    <div v-if="file.status === 'transcoding'" class="progress">
        <div class="progress-bar progress-bar-striped progress-bar-animated" 
             :style="`width: ${file.progress}%`">
            {{ file.progress }}%
        </div>
    </div>
    <div v-else-if="file.status === 'queued'" class="text-muted">
        <i class="fa fa-clock"></i> Waiting in queue...
    </div>
</div>
```

## Testing the Implementation

### Test Scenario
1. Select multiple video files (3+)
2. Start transcoding all at once
3. Verify only one progress bar animates at a time
4. Verify videos process sequentially
5. Verify each video's progress bar updates correctly

### Debug Helpers
```javascript
// Enable debug logging
localStorage.setItem('dlux_debug', 'true');

// Log session changes
console.log(`Active session changed: ${activeTranscodingSession}`);
console.log(`Session ${this.sessionId} progress: ${progress}%`);
```

## Performance Considerations

1. **Memory Management**: Clean up progress subscriptions
2. **Queue Limits**: Consider limiting concurrent queued videos
3. **User Feedback**: Show queue position and estimated time
4. **Error Recovery**: Allow retry without losing queue position

## Summary

The queue management system ensures:
- Only one video transcodes at a time (FFmpeg limitation)
- Each video's progress bar updates correctly
- Videos process in order without conflicts
- Vue 3 reactivity patterns are properly used
- Memory leaks are prevented through proper cleanup

This implementation provides a smooth user experience even when processing multiple videos sequentially.