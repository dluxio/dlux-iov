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
      const config = window.dluxVideoPlayerConfig || {};
      if (config.debug) {
        console.log('DluxVideoPlayer: Video already enhanced, skipping duplicate initialization for:', element.id || 'no-id');
      }
      return element._dluxVideoPlayer;
    }
    
    // Ensure Video.js CSS is loaded before creating player
    await ensureVideoJSStyles();
    
    // Ensure element has an ID for Video.js
    if (!element.id) {
      element.id = `dlux-video-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Apply Video.js classes for consistent styling
    this.applyVideoJSClasses(element);
    
    // Ensure video has proper wrapper structure
    this.ensureVideoWrapper(element);
    
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
    // Comprehensive DOM validation
    if (!this.isVideoReady(video)) {
      const state = this.getVideoState(video);
      throw new Error(`Video not ready for enhancement: ${JSON.stringify(state)}`);
    }
    
    // Check if already enhanced
    if (video.dataset.dluxEnhanced === 'true') {
      const config = window.dluxVideoPlayerConfig || {};
      if (config.debug) {
        console.log('DluxVideoPlayer: Video already enhanced, returning existing player:', video.id || 'no-id');
      }
      return video._dluxVideoPlayer;
    }
    
    // Context validation - TipTap videos should not be externally enhanced
    if (video.hasAttribute('data-tiptap-video')) {
      throw new Error('TipTap videos should not be externally enhanced');
    }
    
    try {
      // Apply Video.js classes and ensure wrapper
      this.applyVideoJSClasses(video);
      this.ensureVideoWrapper(video);
      
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
      const player = await this.initializePlayer(video, elementOptions);
      
      // Mark as enhanced
      video.dataset.dluxEnhanced = 'true';
      
      return player;
      
    } catch (error) {
      console.error('DluxVideoPlayer: Enhancement failed for video:', video.id || 'no-id', error);
      throw error;
    }
  }

  static isVideoReady(video) {
    return video && 
           video.nodeType === Node.ELEMENT_NODE &&
           video.tagName === 'VIDEO' &&
           document.contains(video) && 
           video.parentNode && 
           !video.hasAttribute('data-dlux-enhanced');
  }
  
  static getVideoState(video) {
    return {
      exists: !!video,
      isElement: video && video.nodeType === Node.ELEMENT_NODE,
      isVideo: video && video.tagName === 'VIDEO',
      inDocument: video && document.contains(video),
      hasParent: video && !!video.parentNode,
      isEnhanced: video && video.hasAttribute('data-dlux-enhanced'),
      isTipTap: video && video.hasAttribute('data-tiptap-video'),
      id: video && (video.id || 'no-id')
    };
  }

  static applyVideoJSClasses(video) {
    // Ensure video element has the essential Video.js classes
    const requiredClasses = ['video-js', 'vjs-default-skin'];
    const optionalClasses = ['vjs-big-play-centered', 'vjs-fluid'];
    
    // Add required classes
    requiredClasses.forEach(className => {
      if (!video.classList.contains(className)) {
        video.classList.add(className);
      }
    });
    
    // Add optional classes if not explicitly configured otherwise
    optionalClasses.forEach(className => {
      if (!video.classList.contains(className) && !video.hasAttribute('data-no-' + className.replace('vjs-', ''))) {
        video.classList.add(className);
      }
    });
    
    // Ensure video is properly styled for Video.js
    if (!video.style.width && !video.hasAttribute('width')) {
      video.style.width = '100%';
    }
    
    if (!video.style.height && !video.hasAttribute('height')) {
      video.style.height = 'auto';
    }
  }

  static ensureVideoWrapper(video) {
    // Validate video has parent node before attempting wrapper creation
    if (!video.parentNode) {
      throw new Error('Video element must have a parent node for wrapper creation');
    }
    
    // Check if video already has a proper wrapper
    const existingWrapper = video.closest('.dlux-video-container');
    
    if (existingWrapper) {
      // Existing wrapper found, just add player class
      existingWrapper.classList.add('dlux-video-player');
      return existingWrapper;
    }
    
    // Check if video is already inside a TipTap-managed container
    if (video.hasAttribute('data-tiptap-video') || video.closest('[data-tiptap-video]')) {
      // TipTap handles its own wrappers, just add player class to parent
      const parent = video.parentElement;
      if (parent) {
        parent.classList.add('dlux-video-player');
      }
      return parent;
    }
    
    try {
      // Create universal wrapper for standalone videos
      const wrapper = document.createElement('div');
      wrapper.className = 'dlux-video-container dlux-video-player';
      wrapper.style.position = 'relative';
      wrapper.style.marginBottom = '1rem';
      wrapper.style.width = '100%';
      
      // Safely insert wrapper before video and move video inside
      const parent = video.parentNode;
      parent.insertBefore(wrapper, video);
      wrapper.appendChild(video);
      
      const config = window.dluxVideoPlayerConfig || {};
      if (config.debug) {
        console.log('DluxVideoPlayer: Created universal wrapper for standalone video:', video.id || 'no-id');
      }
      
      return wrapper;
      
    } catch (error) {
      console.error('DluxVideoPlayer: Failed to create wrapper for video:', video.id || 'no-id', error);
      throw error;
    }
  }
  
  static async enhanceStaticVideos(container = document) {
    const config = window.dluxVideoPlayerConfig || {};
    const videos = container.querySelectorAll('video:not([data-dlux-enhanced]):not([data-tiptap-video])');
    const players = [];
    
    if (config.debug) {
      console.log(`DluxVideoPlayer: Found ${videos.length} static videos to enhance`);
    }
    
    for (const video of videos) {
      try {
        const player = await this.enhanceVideoElement(video);
        players.push(player);
        
        if (config.debug) {
          console.log('DluxVideoPlayer: Successfully enhanced static video:', video.id || 'no-id');
        }
      } catch (error) {
        console.error('Failed to enhance static video:', error);
      }
    }
    
    return players;
  }

  static async ensureVideoJSStyles() {
    return ensureVideoJSStyles();
  }

}

// Ensure Video.js CSS is loaded - enhanced fallback system for universal support
function ensureVideoJSStyles() {
  const config = window.dluxVideoPlayerConfig || {};
  
  return new Promise((resolve) => {
    // Check if Video.js styles are already loaded by URL or inline
    const existingStyleLink = document.querySelector('link[href*="video-js"]');
    const existingVjsFallback = document.querySelector('link[data-vjs-fallback="true"]');
    
    if (existingStyleLink || existingVjsFallback) {
      if (config.debug) {
        console.log('DluxVideoPlayer: Video.js CSS already loaded via link tag');
      }
      return resolve();
    }
    
    // More comprehensive test for Video.js CSS
    const testElement = document.createElement('div');
    testElement.className = 'video-js';
    testElement.style.position = 'absolute';
    testElement.style.left = '-9999px';
    testElement.style.visibility = 'hidden';
    document.body.appendChild(testElement);
    
    const computedStyle = window.getComputedStyle(testElement);
    
    // Enhanced Video.js CSS detection
    const hasVideoJSStyles = (
      computedStyle.position === 'relative' ||
      computedStyle.display === 'inline-block' ||
      computedStyle.fontSize === '10px' ||
      computedStyle.boxSizing === 'border-box' ||
      computedStyle.backgroundColor === 'rgb(0, 0, 0)' ||
      computedStyle.color === 'rgb(255, 255, 255)'
    );
    
    document.body.removeChild(testElement);
    
    if (hasVideoJSStyles) {
      if (config.debug) {
        console.log('DluxVideoPlayer: Video.js CSS detected via computed styles');
      }
      return resolve();
    }
    
    // CSS not detected - load fallback
    console.warn('DluxVideoPlayer: Video.js CSS not detected, loading fallback');
    
    // Try multiple fallback sources
    const fallbackSources = [
      'https://vjs.zencdn.net/8.6.1/video-js.css',
      'https://cdnjs.cloudflare.com/ajax/libs/video.js/8.6.1/video-js.min.css'
    ];
    
    let loadAttempts = 0;
    
    function tryLoadCSS(sourceIndex = 0) {
      if (sourceIndex >= fallbackSources.length) {
        console.error('DluxVideoPlayer: All CSS fallback sources failed, proceeding without external CSS');
        return resolve();
      }
      
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = fallbackSources[sourceIndex];
      link.dataset.vjsFallback = 'true';
      link.dataset.attempt = loadAttempts++;
      
      link.onload = () => {
        if (config.debug) {
          console.log('DluxVideoPlayer: Successfully loaded fallback CSS from:', link.href);
        }
        resolve();
      };
      
      link.onerror = () => {
        console.warn('DluxVideoPlayer: Failed to load CSS from:', link.href);
        // Remove failed link and try next source
        document.head.removeChild(link);
        tryLoadCSS(sourceIndex + 1);
      };
      
      document.head.appendChild(link);
      
      // Timeout fallback
      setTimeout(() => {
        if (!link.sheet) {
          console.warn('DluxVideoPlayer: CSS load timeout for:', link.href);
          if (document.head.contains(link)) {
            document.head.removeChild(link);
          }
          tryLoadCSS(sourceIndex + 1);
        }
      }, 3000);
    }
    
    tryLoadCSS();
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
  
  // Static enhancement for documentation and non-Vue contexts
  const config = window.dluxVideoPlayerConfig || {};
  
  if (config.enableStaticEnhancement !== false) {
    document.addEventListener('DOMContentLoaded', async () => {
      try {
        if (config.debug) {
          console.log('DluxVideoPlayer: Starting static page enhancement');
        }
        
        // Only enhance if not in a Vue/React app context
        const isFrameworkApp = document.querySelector('[data-vue-app], [data-react-app], .react-app');
        
        if (!isFrameworkApp) {
          await DluxVideoPlayer.enhanceStaticVideos();
        } else if (config.debug) {
          console.log('DluxVideoPlayer: Framework app detected, skipping static enhancement');
        }
      } catch (error) {
        console.error('Static video enhancement failed:', error);
      }
    });
  }
}

export default VideoPlayerBundle;