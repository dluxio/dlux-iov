# DLUX Video Player Documentation

## Overview

The DLUX Video Player is a site-wide video playback solution built on Video.js that provides:
- Automatic HLS quality selection for multi-bitrate streams
- IPFS-optimized playback
- Dark theme matching DLUX design
- Mobile-responsive controls
- Easy integration across all DLUX applications

## Architecture

### Bundle Structure
```
/js/videoPlayer.bundle.js      # Main video player bundle (763 KB)
/css/dlux-video-player.css     # Global styles and theme
/src/video-player-bundle.js    # Source code
```

### Global API
```javascript
window.DluxVideoPlayer         # Main service class
window.videojs                 # Video.js library
window.VideoPlayerBundle       # Full bundle export
```

## Architecture Overview

### Universal Video Enhancement System

The DLUX Video Player uses a **universal architecture** that automatically handles videos across all contexts:

- **🌍 Global Document Search**: Finds videos anywhere in the document (components, modals, teleported content)
- **⚡ Vue Integration**: Reactive lifecycle hooks trigger video enhancement
- **📝 TipTap Self-Contained**: Editor videos initialize independently  
- **📄 Static Page Support**: MutationObserver for progressive enhancement

### Framework Detection

The system automatically detects the page type and uses appropriate enhancement strategies:

```javascript
// Vue Apps: Global search triggered by component lifecycle
document.setAttribute('data-vue-app', 'true');

// Static Pages: MutationObserver for progressive enhancement  
// (No framework markers)
```

## Installation

### 1. Include in HTML Templates
The video player has been integrated into DLUX HTML templates:

**Editor Page** (`/new/index.html`):
```html
<!-- Video Player CSS -->
<link href="/css/dlux-video-player.css" rel="stylesheet" />

<!-- Video Player Bundle (loaded before collaboration bundle) -->
<script src="/js/videoPlayer.bundle.js"></script>
<script src="/js/collaboration.bundle.js?v=20250703-VideoPlayerSeparation"></script>
```

**Blog Viewer** (`/blog/index.html`):
```html
<!-- Video Player CSS -->
<link href="/css/dlux-video-player.css" rel="stylesheet" />

<!-- Video Player Bundle -->
<script src="/js/videoPlayer.bundle.js"></script>
```

### 2. Manual Installation for New Pages
```html
<!-- Add in <head> section -->
<link href="/css/dlux-video-player.css" rel="stylesheet">

<!-- Add before closing </body> tag -->
<script src="/js/videoPlayer.bundle.js"></script>
```

### 3. Verify Installation
```javascript
// Check if loaded
if (window.DluxVideoPlayer) {
  console.log('DLUX Video Player loaded successfully');
}
```

## Basic Usage

### Initialize a Video Player
```javascript
// Basic initialization
const video = document.getElementById('my-video');
const player = window.DluxVideoPlayer.initializePlayer(video, {
  src: 'https://example.com/video.mp4',
  type: 'video/mp4'
});

// HLS video with quality selector
const hlsPlayer = window.DluxVideoPlayer.initializePlayer(video, {
  src: 'https://ipfs.dlux.io/ipfs/QmHash/master.m3u8',
  type: 'application/x-mpegURL'
});
```

### Enhance Existing Video Elements
```javascript
// Enhance a single video that's already in the DOM
const video = document.querySelector('video');
const player = window.DluxVideoPlayer.enhanceVideoElement(video);

// Enhance all videos on the page
window.DluxVideoPlayer.enhanceAllVideos();

// Enhance videos in a specific container
const container = document.getElementById('blog-content');
window.DluxVideoPlayer.enhanceAllVideos(container);
```

### Destroy a Player
```javascript
// Method 1: Using the element
window.DluxVideoPlayer.destroyPlayer(videoElement);

// Method 2: Using the player instance
player.dispose();
```

## Vue Integration

### Vue Video Enhancement Mixin

For Vue components, use the **Video Enhancement Mixin** for automatic video enhancement:

#### Installation
```javascript
import VideoEnhancementMixin from '/js/video-enhancement-mixin.js';

export default {
  mixins: [VideoEnhancementMixin],
  // ... rest of component
}
```

#### What the Mixin Provides

**Automatic Enhancement:**
- Runs on `mounted()` and `updated()` lifecycle hooks
- Uses global document search to find all unenhanced videos
- Handles teleported modals and dynamic content automatically

**Manual Enhancement:**
```javascript
// Trigger enhancement manually (e.g., when modal opens)
this.enhanceVideosManually();
```

**Automatic Cleanup:**
- Cleans up video players on `beforeUnmount()`
- Conservative approach to avoid interfering with other components

#### Example Usage

**Basic Component:**
```javascript
import VideoEnhancementMixin from '/js/video-enhancement-mixin.js';

export default {
  mixins: [VideoEnhancementMixin],
  template: `
    <div>
      <video src="video.mp4" controls></video>
      <!-- Automatically enhanced on mount/update -->
    </div>
  `
}
```

**With Modal Watcher:**
```javascript
export default {
  mixins: [VideoEnhancementMixin],
  watch: {
    'modal.show': {
      handler(newValue) {
        if (newValue) {
          this.$nextTick(() => {
            this.enhanceVideosManually(); // Enhance modal videos
          });
        }
      }
    }
  }
}
```

### Vue Best Practices

1. **Import the Mixin**: Add to any component that might contain videos
2. **Modal Support**: Use watchers to trigger manual enhancement when modals open  
3. **Teleported Content**: Mixin automatically handles `<teleport to="body">`
4. **No Conflicts**: TipTap videos are automatically skipped to prevent double processing

## Advanced Usage

### Custom Options
```javascript
const player = window.DluxVideoPlayer.initializePlayer(video, {
  src: 'video.mp4',
  type: 'video/mp4',
  autoplay: true,
  muted: true,      // Required for autoplay in most browsers
  loop: true,
  poster: 'thumbnail.jpg',
  controls: true,
  fluid: true,      // Responsive sizing
  playbackRates: [0.5, 1, 1.5, 2],  // Speed options
  
  // Custom Video.js options
  html5: {
    vhs: {
      overrideNative: true,
      bandwidth: 4194304  // 4MB/s starting bandwidth
    }
  }
});
```

### Event Handling
```javascript
const player = window.DluxVideoPlayer.initializePlayer(video, options);

// Video.js events
player.on('play', () => console.log('Video started'));
player.on('pause', () => console.log('Video paused'));
player.on('ended', () => console.log('Video finished'));
player.on('error', (error) => console.error('Playback error:', error));

// Quality change events (HLS only)
player.on('loadedmetadata', () => {
  if (player.qualityLevels) {
    const qualityLevels = player.qualityLevels();
    qualityLevels.on('change', () => {
      const currentLevel = qualityLevels[qualityLevels.selectedIndex];
      console.log('Quality changed to:', currentLevel.height + 'p');
    });
  }
});
```

### Manual Quality Selection
```javascript
// Get available quality levels
const qualityLevels = player.qualityLevels();

// List all levels
for (let i = 0; i < qualityLevels.length; i++) {
  const level = qualityLevels[i];
  console.log(`${i}: ${level.height}p @ ${level.bitrate} bps`);
}

// Set specific quality (by index)
qualityLevels.selectedIndex = 2;  // Select third quality level

// Enable auto quality selection
qualityLevels.selectedIndex = -1;
```

## Integration Examples

### TipTap Editor (DluxVideo Extension)
Already integrated in the DluxVideo nodeView:
```javascript
// Automatically uses DluxVideoPlayer when available
const player = window.DluxVideoPlayer.initializePlayer(video, {
  src: node.attrs.src,
  type: node.attrs.type
});
```

### SPK Drive File Preview
```javascript
// In file preview modal
function showVideoPreview(fileUrl, fileType) {
  const modal = document.getElementById('preview-modal');
  const video = document.createElement('video');
  video.className = 'preview-video';
  
  modal.appendChild(video);
  
  const player = window.DluxVideoPlayer.initializePlayer(video, {
    src: fileUrl,
    type: fileType || 'video/mp4',
    controls: true,
    fluid: true
  });
  
  // Clean up when modal closes
  modal.addEventListener('hidden', () => {
    window.DluxVideoPlayer.destroyPlayer(video);
  });
}
```

### Blog Post Enhancement (Already Integrated)
The DLUX blog viewer automatically enhances videos through the Marker component:

**File**: `/js/marker.js`
```javascript
// Automatically enhances videos in mounted() and updated() lifecycle hooks
enhanceVideos() {
  this.$nextTick(() => {
    if (!this.$refs.markdownContent || !window.DluxVideoPlayer) {
      return;
    }
    
    const videos = this.$refs.markdownContent.querySelectorAll('video:not([data-dlux-enhanced])');
    
    videos.forEach(video => {
      try {
        window.DluxVideoPlayer.enhanceVideoElement(video);
      } catch (error) {
        console.error('Failed to enhance video:', error);
      }
    });
  });
}
```

**Manual Enhancement for Other Pages**:
```javascript
// After content loads
function enhanceBlogVideos() {
  const blogContent = document.getElementById('blog-content');
  const players = window.DluxVideoPlayer.enhanceAllVideos(blogContent);
  
  console.log(`Enhanced ${players.length} videos in blog post`);
}

// Or use MutationObserver for dynamic content
const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      if (node.nodeName === 'VIDEO') {
        window.DluxVideoPlayer.enhanceVideoElement(node);
      }
    });
  });
});

observer.observe(document.body, { childList: true, subtree: true });
```

### IPFS Video Handling
```javascript
// IPFS videos with HLS
const ipfsPlayer = window.DluxVideoPlayer.initializePlayer(video, {
  src: 'https://ipfs.dlux.io/ipfs/QmXYZ/master.m3u8',
  type: 'application/x-mpegURL',
  
  // IPFS-specific optimizations
  html5: {
    vhs: {
      overrideNative: true,
      smoothQualityChange: true,
      // Lower initial bandwidth for IPFS
      bandwidth: 2097152  // 2MB/s
    }
  }
});
```

## Customization

### Modifying Styles
The player uses these CSS classes:
```css
.dlux-video-player              /* Main wrapper */
.dlux-video-player .video-js    /* Video.js container */
.dlux-video-player .vjs-tech    /* Video element */
.dlux-video-player .vjs-control-bar  /* Control bar */
.dlux-video-player .vjs-big-play-button  /* Play button */
```

To override styles:
```css
/* Custom control bar color */
.dlux-video-player .vjs-control-bar {
  background: linear-gradient(to top, #1a1b2e, #16213e);
}

/* Custom play button */
.dlux-video-player .vjs-big-play-button {
  border-color: #00ff00;
  background-color: rgba(0, 255, 0, 0.2);
}
```

### Adding Custom Controls
```javascript
// Add custom button to control bar
player.ready(() => {
  const Button = videojs.getComponent('Button');
  
  class CustomButton extends Button {
    constructor(player, options) {
      super(player, options);
      this.addClass('vjs-custom-button');
    }
    
    handleClick() {
      console.log('Custom button clicked');
      // Your custom logic here
    }
  }
  
  videojs.registerComponent('CustomButton', CustomButton);
  player.controlBar.addChild('CustomButton', {});
});
```

### Extending the Service
```javascript
// Add custom methods to DluxVideoPlayer
class ExtendedVideoPlayer extends window.DluxVideoPlayer {
  static initializeWithAnalytics(element, options) {
    const player = this.initializePlayer(element, options);
    
    // Add analytics
    player.on('play', () => trackEvent('video_play', options.src));
    player.on('ended', () => trackEvent('video_complete', options.src));
    
    return player;
  }
  
  static createThumbnail(player, time = 5) {
    // Seek to time and capture frame
    player.currentTime(time);
    // ... thumbnail generation logic
  }
}

// Use extended version
window.DluxVideoPlayer = ExtendedVideoPlayer;
```

## Configuration

### Global Configuration
Set before loading videos:
```javascript
// Disable auto-enhancement
window.dluxVideoPlayerConfig = {
  autoEnhance: false,
  defaultOptions: {
    muted: true,
    playbackRates: [1, 1.5, 2, 3]
  }
};
```

### Per-Instance Configuration
```javascript
// Override global settings per video
const player = window.DluxVideoPlayer.initializePlayer(video, {
  ...window.dluxVideoPlayerConfig.defaultOptions,
  muted: false,  // Override global muted setting
  src: 'video.mp4'
});
```

## Troubleshooting

### Player Not Appearing
```javascript
// Check if bundle is loaded
if (!window.DluxVideoPlayer) {
  console.error('Video player bundle not loaded');
}

// Check if element exists
const video = document.getElementById('my-video');
if (!video) {
  console.error('Video element not found');
}

// Check for existing player
if (video._dluxVideoPlayer) {
  console.log('Player already initialized');
}
```

### HLS Quality Selector Missing
```javascript
// Verify HLS content
player.on('loadedmetadata', () => {
  console.log('Tech:', player.tech().name);
  console.log('Source type:', player.currentType());
  console.log('Quality levels:', player.qualityLevels?.().length);
});
```

### Black Bars or Sizing Issues
```css
/* Ensure container has dimensions */
.dlux-video-container {
  width: 100%;
  max-width: 100%;
  position: relative;
}

/* Force aspect ratio if needed */
.dlux-video-player {
  aspect-ratio: 16/9;
}
```

### CORS Issues with IPFS
```javascript
// Ensure crossorigin attribute
const player = window.DluxVideoPlayer.initializePlayer(video, {
  src: 'https://ipfs.dlux.io/ipfs/...',
  crossorigin: 'anonymous',  // Usually set automatically
  type: 'application/x-mpegURL'
});
```

## Future Modifications

### Adding New Video.js Plugins
1. Install plugin: `npm install videojs-plugin-name`
2. Import in `src/video-player-bundle.js`:
```javascript
import pluginName from 'videojs-plugin-name';
videojs.registerPlugin('pluginName', pluginName);
```
3. Use in initialization:
```javascript
player.pluginName(options);
```

### Updating Video.js Version
1. Update `package.json`:
```json
"video.js": "^8.11.0"
```
2. Run `npm install`
3. Rebuild: `npm run build`
4. Test thoroughly - Video.js major versions may have breaking changes

### Adding New Features
Common extension points:
- Custom quality selector UI
- Thumbnail previews
- Chapters/markers
- Ad integration
- Analytics
- Keyboard shortcuts
- Picture-in-picture
- Chromecast support

### Performance Optimizations
- Lazy load Video.js CSS
- Use Intersection Observer for viewport detection
- Preload metadata only until user interaction
- Implement adaptive bitrate algorithm tuning

## Browser Support

- Chrome/Edge: Full support including HLS
- Firefox: Full support including HLS
- Safari: Native HLS support (bypasses Video.js HLS)
- Mobile: Optimized controls, may use native player

## Related Documentation

- [Video.js Documentation](https://videojs.com/guides/)
- [HLS.js Documentation](https://github.com/video-dev/hls.js/)
- [DLUX Editor Documentation](../CLAUDE.md)
- [HLS Implementation Guide](./HLS_COMPREHENSIVE_GUIDE.md)

---

Last Updated: 2025-07-06
Version: 1.0.0