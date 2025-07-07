// DLUX Video Player Bundle - Site-wide video player solution
// Provides Video.js with HLS quality selector for use across entire DLUX platform

// Video.js core
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

// Lazy load and register plugins only if not already registered
let qualityLevelsPlugin = null;
let hlsQualitySelectorPlugin = null;

// Function to ensure plugins are loaded and registered
async function ensurePluginsLoaded() {
  if (!videojs.getPlugin('qualityLevels')) {
    if (!qualityLevelsPlugin) {
      const module = await import('videojs-contrib-quality-levels');
      qualityLevelsPlugin = module.default || module;
    }
    // Only register if still not registered (in case of race conditions)
    if (!videojs.getPlugin('qualityLevels')) {
      videojs.registerPlugin('qualityLevels', qualityLevelsPlugin);
    }
  }
  
  if (!videojs.getPlugin('hlsQualitySelector')) {
    if (!hlsQualitySelectorPlugin) {
      const module = await import('videojs-hls-quality-selector');
      hlsQualitySelectorPlugin = module.default || module;
    }
    // Only register if still not registered (in case of race conditions)
    if (!videojs.getPlugin('hlsQualitySelector')) {
      videojs.registerPlugin('hlsQualitySelector', hlsQualitySelectorPlugin);
    }
  }
}

// DLUX Video Player Service
class DluxVideoPlayer {
  static async initializePlayer(element, options = {}) {
    // Ensure plugins are loaded
    await ensurePluginsLoaded();
    
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
  
  static enhanceVideoElement(video, options = {}) {
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
    
    // Initialize player
    const player = this.initializePlayer(video, elementOptions);
    
    // Mark as enhanced
    video.dataset.dluxEnhanced = 'true';
    
    return player;
  }
  
  static enhanceAllVideos(container = document) {
    const videos = container.querySelectorAll('video:not([data-dlux-enhanced])');
    const players = [];
    
    videos.forEach(video => {
      try {
        const player = this.enhanceVideoElement(video);
        players.push(player);
      } catch (error) {
        console.error('Failed to enhance video:', error);
      }
    });
    
    return players;
  }
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
  
  // Auto-enhance videos on DOMContentLoaded if enabled
  if (!window.dluxVideoPlayerConfig || window.dluxVideoPlayerConfig.autoEnhance !== false) {
    document.addEventListener('DOMContentLoaded', () => {
      DluxVideoPlayer.enhanceAllVideos();
    });
  }
}

export default VideoPlayerBundle;