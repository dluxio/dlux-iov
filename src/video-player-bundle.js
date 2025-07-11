// DLUX Video Player Bundle - Site-wide video player solution
// Provides Video.js with HLS quality selector for use across entire DLUX platform

// Video.js core
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

// Note: qualityLevels plugin is built into video.js core (no import needed)
// Only import the external hlsQualitySelector plugin
import 'videojs-hls-quality-selector';

// DLUX Video Player Service
class DluxVideoPlayer {
  static async initializePlayer(element, options = {}) {
    // Prevent double initialization
    if (element._dluxVideoPlayer || element.dataset.dluxEnhanced === 'true') {
      console.log('Video already enhanced, skipping duplicate initialization');
      return element._dluxVideoPlayer;
    }
    
    // Ensure Video.js CSS is loaded before creating player
    await ensureVideoJSStyles();
    
    // Ensure element has an ID for Video.js
    if (!element.id) {
      element.id = `dlux-video-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Add class for styling
    const wrapper = element.closest('.dlux-video-container') || element.parentElement;
    if (wrapper) {
      wrapper.classList.add('dlux-video-player');
    }
    
    // Default options with DLUX preferences
    const defaultOptions = {
      controls: true,
      fluid: true,
      responsive: true,
      preload: 'auto',
      playbackRates: [0.5, 1, 1.5, 2],
      html5: {
        vhs: {
          overrideNative: true,
          smoothQualityChange: true,
          fastQualityChange: true
        }
      }
    };
    
    // Merge options
    const playerOptions = { ...defaultOptions, ...options };
    
    // Initialize Video.js
    const player = videojs(element, playerOptions);
    
    // Set source if provided
    if (options.src) {
      const sourceType = options.type || this.detectSourceType(options.src);
      player.src({
        src: options.src,
        type: sourceType
      });
      
      // Add HLS quality selector if it's HLS content
      if (sourceType === 'application/x-mpegURL' || options.src.includes('.m3u8')) {
        player.ready(() => {
          // Initialize quality levels
          player.qualityLevels();
          
          // Add quality selector to control bar
          player.hlsQualitySelector({
            displayCurrentQuality: true,
            placementIndex: 2
          });
        });
      }
    }
    
    // Add error handling
    player.on('error', (error) => {
      console.error('DluxVideoPlayer error:', error);
    });
    
    // Store player reference on element for later access
    element._dluxVideoPlayer = player;
    
    return player;
  }
  
  static destroyPlayer(element) {
    const player = element._dluxVideoPlayer || (element.id && videojs.getPlayer(element.id));
    if (player && typeof player.dispose === 'function') {
      player.dispose();
      delete element._dluxVideoPlayer;
    }
  }
  
  static detectSourceType(src) {
    if (!src) return 'video/mp4';
    
    const srcLower = src.toLowerCase();
    if (srcLower.includes('.m3u8')) return 'application/x-mpegURL';
    if (srcLower.includes('.mp4')) return 'video/mp4';
    if (srcLower.includes('.webm')) return 'video/webm';
    if (srcLower.includes('.ogg') || srcLower.includes('.ogv')) return 'video/ogg';
    
    return 'video/mp4'; // Default
  }
  
  static async enhanceVideoElement(video, options = {}) {
    // Check if already enhanced
    if (video.dataset.dluxEnhanced === 'true') {
      return video._dluxVideoPlayer;
    }
    
    // Extract options from video element
    const elementOptions = {
      src: video.src || video.currentSrc,
      type: video.type || video.getAttribute('type'),
      poster: video.poster,
      autoplay: video.autoplay,
      loop: video.loop,
      muted: video.muted,
      ...options
    };
    
    // Initialize player (plugins are already loaded statically)
    const player = await this.initializePlayer(video, elementOptions);
    
    // Mark as enhanced
    video.dataset.dluxEnhanced = 'true';
    
    return player;
  }
  
  static async enhanceAllVideos(container = document) {
    const videos = container.querySelectorAll('video:not([data-dlux-enhanced])');
    const players = [];
    
    // Wait for all video enhancements to complete
    await Promise.all(Array.from(videos).map(async (video) => {
      try {
        const player = await this.enhanceVideoElement(video);
        players.push(player);
      } catch (error) {
        console.error('Failed to enhance video:', error);
      }
    }));
    
    return players;
  }
}

// Ensure Video.js CSS is loaded - Vue-aware timing for DOM manipulation
function ensureVideoJSStyles() {
  return new Promise((resolve) => {
    // Check if Video.js styles are already loaded by URL or inline
    const existingStyleLink = document.querySelector('link[href*="video-js"]');
    const existingVjsFallback = document.querySelector('link[data-vjs-fallback="true"]');
    
    if (existingStyleLink || existingVjsFallback) {
      resolve(); // Styles already loaded
      return;
    }
    
    // Use Vue nextTick if available for proper DOM timing
    const performCSSTest = () => {
      // Ensure document.body is available before creating test elements
      if (!document.body) {
        setTimeout(() => performCSSTest(), 10);
        return;
      }
      
      // More comprehensive test for Video.js CSS by checking multiple key properties
      const testElement = document.createElement('div');
      testElement.className = 'video-js';
      testElement.style.position = 'absolute';
      testElement.style.left = '-9999px';
      testElement.style.visibility = 'hidden';
      document.body.appendChild(testElement);
      
      const computedStyle = window.getComputedStyle(testElement);
      
      // Test multiple Video.js specific properties
      const hasVideoJSStyles = (
        computedStyle.position === 'relative' ||
        computedStyle.display === 'inline-block' ||
        computedStyle.fontSize === '10px' ||
        computedStyle.boxSizing === 'border-box'
      );
      
      document.body.removeChild(testElement);
      
      if (!hasVideoJSStyles) {
        console.warn('Video.js CSS not detected, adding fallback link');
        // Add Video.js CSS as fallback
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://vjs.zencdn.net/8.6.1/video-js.css';
        link.dataset.vjsFallback = 'true';
        document.head.appendChild(link);
        
        // Force styles to load before proceeding
        link.onload = resolve;
        link.onerror = resolve; // Continue even if CDN fails
        setTimeout(resolve, 2000); // Timeout after 2 seconds
      } else {
        resolve();
      }
    };
    
    // Use Vue nextTick pattern if Vue is available
    if (typeof window !== 'undefined' && window.Vue && window.Vue.nextTick) {
      window.Vue.nextTick(() => {
        performCSSTest();
      });
    } else {
      // Fallback for non-Vue contexts
      setTimeout(() => performCSSTest(), 0);
    }
  });
}

// Export everything
const VideoPlayerBundle = {
  videojs,
  DluxVideoPlayer
};

// Make globally available
if (typeof window !== 'undefined') {
  window.videojs = videojs;
  window.DluxVideoPlayer = DluxVideoPlayer;
  window.VideoPlayerBundle = VideoPlayerBundle;
  
  // Ensure styles are loaded immediately
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      ensureVideoJSStyles().catch(console.error);
    });
  } else {
    ensureVideoJSStyles().catch(console.error);
  }
  
  // Also ensure styles are loaded when bundle is first imported
  setTimeout(() => {
    ensureVideoJSStyles().catch(console.error);
  }, 100);
  
  // Auto-enhance videos on DOMContentLoaded if enabled
  if (!window.dluxVideoPlayerConfig || window.dluxVideoPlayerConfig.autoEnhance !== false) {
    document.addEventListener('DOMContentLoaded', async () => {
      try {
        await DluxVideoPlayer.enhanceAllVideos();
      } catch (error) {
        console.error('Failed to auto-enhance videos:', error);
      }
    });
  }
}

export default VideoPlayerBundle;