/**
 * IPFS HLS Player
 * A Video.js-based HLS player optimized for IPFS content-addressed storage
 * 
 * @author Mark Giles
 * @license MIT
 * @version 1.0.0
 * 
 * This player solves the fundamental incompatibility between standard HLS 
 * (which uses relative paths) and IPFS (which requires absolute CID-based URLs).
 * It provides pre-configured Video.js settings optimized for IPFS-hosted HLS streams.
 */

// Video.js core
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

// HLS Quality Selector plugin for Video.js
import 'videojs-hls-quality-selector';

/**
 * IPFS HLS Player Service
 * Provides automatic video enhancement with IPFS-optimized settings
 */
class IPFSHLSPlayer {
  /**
   * Check if URL is an IPFS URL
   * @param {string} url - URL to check
   * @returns {boolean} True if IPFS URL
   */
  static isIPFSURL(url) {
    if (!url) return false;
    return url.includes('/ipfs/') || 
           url.includes('ipfs.io') || 
           url.includes('ipfs.dlux.io') || 
           url.includes('gateway.pinata.cloud') ||
           url.includes('dweb.link') || 
           url.includes('cf-ipfs.com') ||
           url.includes('cloudflare-ipfs.com');
  }

  /**
   * MIME type normalization map
   * Maps various MIME type variants to Video.js-compatible types
   */
  static MIME_NORMALIZATION = {
    // QuickTime/MOV → MP4 (same container)
    'video/quicktime': 'video/mp4',
    'video/x-quicktime': 'video/mp4',
    
    // MP4 variants
    'video/x-m4v': 'video/mp4',
    'video/3gpp': 'video/mp4',
    'video/3gpp2': 'video/mp4',
    'video/mp4v-es': 'video/mp4',
    
    // WebM variants
    'video/x-webm': 'video/webm',
    
    // HLS variants
    'application/vnd.apple.mpegurl': 'application/x-mpegURL',
    'audio/mpegurl': 'application/x-mpegURL',
    'audio/x-mpegurl': 'application/x-mpegURL',
    
    // AVI variants
    'video/avi': 'video/x-msvideo',
    'video/msvideo': 'video/x-msvideo',
    'video/x-avi': 'video/x-msvideo',
    
    // MPEG variants
    'video/mpeg': 'video/mp2t',
    'video/x-mpeg': 'video/mp2t',
    
    // Keep standard types as-is
    'video/mp4': 'video/mp4',
    'video/webm': 'video/webm',
    'video/ogg': 'video/ogg',
    'video/x-msvideo': 'video/x-msvideo',
    'video/mp2t': 'video/mp2t',
    'application/x-mpegURL': 'application/x-mpegURL'
  };

  /**
   * Detect MIME type from file content (magic bytes and text signatures)
   * @param {string} url - URL to check
   * @returns {Promise<string|null>} MIME type or null
   */
  static async detectFromContent(url) {
    const config = window.ipfsHLSPlayerConfig || {};
    
    try {
      // Fetch first 200 bytes (enough for all formats including MPEG-TS)
      const response = await fetch(url, {
        headers: { 'Range': 'bytes=0-200' },
        mode: 'cors'
      });
      
      const buffer = await response.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      
      // Check for HLS (text-based, starts with #EXTM3U)
      if (bytes[0] === 0x23) { // '#' character
        const text = new TextDecoder().decode(bytes);
        if (text.startsWith('#EXTM3U')) {
          if (config.debug) {
            console.log('IPFSHLSPlayer: Detected HLS playlist');
          }
          return 'application/x-mpegURL';
        }
      }
      
      // Check for MP4/MOV/QuickTime (all use ftyp box)
      if (bytes.length > 7 &&
          bytes[4] === 0x66 && bytes[5] === 0x74 && 
          bytes[6] === 0x79 && bytes[7] === 0x70) {
        // Extract brand for debugging
        if (config.debug && bytes.length > 11) {
          const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]).replace(/\0/g, ' ').trim();
          console.log(`IPFSHLSPlayer: Detected MP4-compatible with brand: ${brand}`);
        }
        return 'video/mp4';
      }
      
      // Check for WebM/MKV (EBML header)
      if (bytes.length > 3 &&
          bytes[0] === 0x1A && bytes[1] === 0x45 && 
          bytes[2] === 0xDF && bytes[3] === 0xA3) {
        if (config.debug) {
          console.log('IPFSHLSPlayer: Detected WebM/Matroska');
        }
        return 'video/webm';
      }
      
      // Check for Ogg
      if (bytes.length > 3 &&
          bytes[0] === 0x4F && bytes[1] === 0x67 && 
          bytes[2] === 0x67 && bytes[3] === 0x53) {
        if (config.debug) {
          console.log('IPFSHLSPlayer: Detected Ogg');
        }
        return 'video/ogg';
      }
      
      // Check for AVI
      if (bytes.length > 11 &&
          bytes[0] === 0x52 && bytes[1] === 0x49 && 
          bytes[2] === 0x46 && bytes[3] === 0x46 &&
          bytes[8] === 0x41 && bytes[9] === 0x56 && 
          bytes[10] === 0x49 && bytes[11] === 0x20) {
        if (config.debug) {
          console.log('IPFSHLSPlayer: Detected AVI');
        }
        return 'video/x-msvideo';
      }
      
      // Check for MPEG-TS (sync byte 0x47)
      if (bytes[0] === 0x47) {
        // MPEG-TS has sync bytes every 188 bytes
        if (bytes.length > 188 && bytes[188] === 0x47) {
          if (config.debug) {
            console.log('IPFSHLSPlayer: Detected MPEG-TS (confirmed by sync pattern)');
          }
          return 'video/mp2t';
        }
        // Single sync byte might still be TS
        if (config.debug) {
          console.log('IPFSHLSPlayer: Possible MPEG-TS (single sync byte)');
        }
        return 'video/mp2t';
      }
      
      // Fallback: Check Content-Type header
      const contentType = response.headers.get('content-type');
      if (contentType) {
        const mimeType = contentType.split(';')[0].trim();
        const normalized = this.MIME_NORMALIZATION[mimeType];
        if (config.debug) {
          if (normalized && normalized !== mimeType) {
            console.log(`IPFSHLSPlayer: Normalized ${mimeType} to ${normalized}`);
          }
        }
        return normalized || mimeType;
      }
      
    } catch (error) {
      if (config.debug) {
        console.warn('IPFSHLSPlayer: Content detection failed:', error);
      }
    }
    
    return null;
  }

  /**
   * Register Video.js middleware for IPFS MIME type detection
   * Must be called before creating any players
   */
  static registerIPFSMiddleware() {
    // Check if middleware already registered
    if (this._middlewareRegistered) return;
    
    const self = this;
    const config = window.ipfsHLSPlayerConfig || {};
    
    // Register middleware for all sources
    videojs.use('*', () => {
      return {
        async setSource(srcObj, next) {
          // Only process IPFS URLs without explicit type
          if (self.isIPFSURL(srcObj.src) && !srcObj.type) {
            if (config.debug) {
              console.log('IPFSHLSPlayer: Detecting MIME type for IPFS URL:', srcObj.src);
            }
            
            try {
              // Use comprehensive content detection
              const type = await self.detectFromContent(srcObj.src);
              
              if (config.debug) {
                console.log('IPFSHLSPlayer: Final MIME type:', type || 'unknown (using fallback)');
              }
              
              // Pass modified source with detected type
              return next(null, {
                src: srcObj.src,
                type: type || 'video/mp4' // Last resort fallback
              });
              
            } catch (error) {
              console.warn('IPFSHLSPlayer: MIME detection failed:', error);
              // On error, proceed with fallback type
              return next(null, {
                src: srcObj.src,
                type: 'video/mp4'
              });
            }
          }
          
          // Pass through non-IPFS or already-typed sources
          return next(null, srcObj);
        }
      };
    });
    
    this._middlewareRegistered = true;
    
    if (config.debug) {
      console.log('IPFSHLSPlayer: Middleware registered for IPFS MIME type detection');
    }
  }
  /**
   * Initialize a Video.js player with IPFS-optimized settings
   * @param {HTMLVideoElement} element - Video element to enhance
   * @param {Object} options - Player configuration options
   * @returns {Promise<Player>} Video.js player instance
   */
  static async initializePlayer(element, options = {}) {
    // Register middleware on first initialization
    this.registerIPFSMiddleware();
    
    // Prevent double initialization
    if (element._ipfsHLSPlayer || element.dataset.ipfsEnhanced === 'true') {
      const config = window.ipfsHLSPlayerConfig || {};
      if (config.debug) {
        console.log('IPFSHLSPlayer: Video already enhanced, skipping duplicate initialization for:', element.id || 'no-id');
      }
      return element._ipfsHLSPlayer;
    }
    
    // Ensure Video.js CSS is loaded before creating player
    await ensureVideoJSStyles();
    
    // Ensure element has an ID for Video.js
    if (!element.id) {
      element.id = `ipfs-video-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Apply Video.js classes for consistent styling
    this.applyVideoJSClasses(element, options);
    
    // Ensure video has proper wrapper structure
    this.ensureVideoWrapper(element);
    
    // Default options optimized for IPFS HLS content
    const defaultOptions = {
      controls: true,
      fluid: true,
      responsive: true,
      preload: 'auto',
      playbackRates: [0.5, 1, 1.5, 2],
      html5: {
        vhs: {
          // Critical for IPFS: Force Video.js's JavaScript HLS implementation
          // instead of native browser HLS to handle CID-based URLs properly
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
    
    // Always initialize quality levels so it can track them as they load
    player.qualityLevels();
    
    // Set source if provided
    if (options.src) {
      const sourceType = options.type || this.detectSourceType(options.src);
      
      // Build source config
      const sourceConfig = { src: options.src };
      
      // Add type if we have one (middleware will handle IPFS URLs without type)
      if (sourceType) {
        sourceConfig.type = sourceType;
      }
      
      // Pass to Video.js - middleware will intercept if needed
      player.src(sourceConfig);
      
      // Add HLS quality selector if it's HLS content
      if (sourceType === 'application/x-mpegURL' || options.src.includes('.m3u8')) {
        // We know it's HLS from the start
        player.hlsQualitySelector({
          displayCurrentQuality: true,
          placementIndex: 2
        });
        
        const config = window.ipfsHLSPlayerConfig || {};
        if (config.debug) {
          console.log('IPFSHLSPlayer: Added HLS quality selector for known HLS content');
        }
      } else {
        // For unknown types (like IPFS URLs), check as soon as the source type is determined
        // Use loadstart which fires earlier than loadedmetadata
        player.one('loadstart', () => {
          const actualType = player.currentType();
          
          // Check if it's HLS content detected by middleware
          if (actualType === 'application/x-mpegURL' || 
              actualType === 'application/vnd.apple.mpegurl') {
            
            // Add quality selector immediately - quality levels haven't loaded yet
            player.hlsQualitySelector({
              displayCurrentQuality: true,
              placementIndex: 2
            });
            
            const config = window.ipfsHLSPlayerConfig || {};
            if (config.debug) {
              console.log('IPFSHLSPlayer: Added HLS quality selector after type detection:', actualType);
            }
          }
        });
      }
    }
    
    // Add error handling
    player.on('error', (error) => {
      console.error('IPFSHLSPlayer error:', error);
    });
    
    // Store player reference on element for later access
    element._ipfsHLSPlayer = player;
    
    // Mark as enhanced to prevent double initialization
    element.dataset.ipfsEnhanced = 'true';
    
    return player;
  }
  
  /**
   * Destroy a player instance and clean up
   * @param {HTMLVideoElement} element - Video element with player
   */
  static destroyPlayer(element) {
    const player = element._ipfsHLSPlayer || (element.id && videojs.getPlayer(element.id));
    if (player && typeof player.dispose === 'function') {
      player.dispose();
      delete element._ipfsHLSPlayer;
      // Clear the enhanced flag when destroying
      delete element.dataset.ipfsEnhanced;
    }
  }
  
  /**
   * Detect video source type from URL
   * @param {string} src - Video source URL
   * @returns {string|null} MIME type or null if unknown
   */
  static detectSourceType(src) {
    if (!src) return null;
    
    const srcLower = src.toLowerCase();
    if (srcLower.includes('.m3u8')) return 'application/x-mpegURL';
    if (srcLower.includes('.mp4')) return 'video/mp4';
    if (srcLower.includes('.webm')) return 'video/webm';
    if (srcLower.includes('.ogg') || srcLower.includes('.ogv')) return 'video/ogg';
    
    return null; // Let browser detect type
  }
  
  /**
   * Enhance an existing video element with IPFS HLS Player
   * @param {HTMLVideoElement} video - Video element to enhance
   * @param {Object} options - Enhancement options
   * @returns {Promise<Player>} Video.js player instance
   */
  static async enhanceVideoElement(video, options = {}) {
    // Comprehensive DOM validation
    if (!this.isVideoReady(video)) {
      const state = this.getVideoState(video);
      throw new Error(`Video not ready for enhancement: ${JSON.stringify(state)}`);
    }
    
    // Check if already enhanced
    if (video.dataset.ipfsEnhanced === 'true') {
      const config = window.ipfsHLSPlayerConfig || {};
      if (config.debug) {
        console.log('IPFSHLSPlayer: Video already enhanced, returning existing player:', video.id || 'no-id');
      }
      return video._ipfsHLSPlayer;
    }
    
    try {
      // Apply Video.js classes and ensure wrapper
      this.applyVideoJSClasses(video, options);
      this.ensureVideoWrapper(video);
      
      // Extract options from video element
      const elementOptions = {
        src: video.src || video.currentSrc,
        type: video.getAttribute('type') || null,
        poster: video.poster,
        autoplay: video.autoplay,
        loop: video.loop,
        muted: video.muted,
        ...options
      };
      
      // Initialize player
      const player = await this.initializePlayer(video, elementOptions);
      
      // Mark as enhanced
      video.dataset.ipfsEnhanced = 'true';
      
      return player;
      
    } catch (error) {
      console.error('IPFSHLSPlayer: Enhancement failed for video:', video.id || 'no-id', error);
      throw error;
    }
  }

  /**
   * Check if video element is ready for enhancement
   * @param {HTMLVideoElement} video - Video element to check
   * @returns {boolean} True if ready
   */
  static isVideoReady(video) {
    return video && 
           video.nodeType === Node.ELEMENT_NODE &&
           video.tagName === 'VIDEO' &&
           document.contains(video) && 
           video.parentNode && 
           !video.hasAttribute('data-ipfs-enhanced');
  }
  
  /**
   * Get diagnostic state of video element
   * @param {HTMLVideoElement} video - Video element to analyze
   * @returns {Object} State information
   */
  static getVideoState(video) {
    return {
      exists: !!video,
      isElement: video && video.nodeType === Node.ELEMENT_NODE,
      isVideo: video && video.tagName === 'VIDEO',
      inDocument: video && document.contains(video),
      hasParent: video && !!video.parentNode,
      isEnhanced: video && video.hasAttribute('data-ipfs-enhanced'),
      id: video && (video.id || 'no-id')
    };
  }

  /**
   * Apply required Video.js CSS classes to video element
   * @param {HTMLVideoElement} video - Video element
   * @param {Object} options - Configuration options
   */
  static applyVideoJSClasses(video, options = {}) {
    // Merge with defaults
    const config = {
      required: ['video-js', 'vjs-default-skin'],
      optional: ['vjs-big-play-centered', 'vjs-fluid'],
      custom: [],
      ...(options.cssClasses || {})
    };
    
    // Add required classes
    config.required.forEach(className => {
      if (!video.classList.contains(className)) {
        video.classList.add(className);
      }
    });
    
    // Add optional classes
    config.optional.forEach(className => {
      if (!video.classList.contains(className)) {
        video.classList.add(className);
      }
    });
    
    // Add custom classes
    if (config.custom && config.custom.length > 0) {
      config.custom.forEach(className => {
        if (!video.classList.contains(className)) {
          video.classList.add(className);
        }
      });
    }
    
    // No forced inline styles - let CSS handle sizing
  }

  /**
   * Ensure video has proper wrapper structure for Video.js
   * @param {HTMLVideoElement} video - Video element
   * @returns {HTMLElement} Wrapper element
   */
  static ensureVideoWrapper(video) {
    // Validate video has parent node before attempting wrapper creation
    if (!video.parentNode) {
      throw new Error('Video element must have a parent node for wrapper creation');
    }
    
    // Check if video already has a proper wrapper
    const existingWrapper = video.closest('.ipfs-video-container');
    
    if (existingWrapper) {
      // Existing wrapper found, just add player class
      existingWrapper.classList.add('ipfs-hls-player');
      return existingWrapper;
    }
    
    try {
      // Create universal wrapper for standalone videos
      const wrapper = document.createElement('div');
      wrapper.className = 'ipfs-video-container ipfs-hls-player';
      
      // Safely insert wrapper before video and move video inside
      const parent = video.parentNode;
      parent.insertBefore(wrapper, video);
      wrapper.appendChild(video);
      
      const config = window.ipfsHLSPlayerConfig || {};
      if (config.debug) {
        console.log('IPFSHLSPlayer: Created universal wrapper for standalone video:', video.id || 'no-id');
      }
      
      return wrapper;
      
    } catch (error) {
      console.error('IPFSHLSPlayer: Failed to create wrapper for video:', video.id || 'no-id', error);
      throw error;
    }
  }
  
  /**
   * Enhance all unenhanced videos in a container
   * @param {HTMLElement} container - Container to search within
   * @returns {Promise<Array>} Array of player instances
   */
  static async enhanceStaticVideos(container = document) {
    const config = window.ipfsHLSPlayerConfig || {};
    const videos = container.querySelectorAll('video:not([data-ipfs-enhanced])');
    const players = [];
    
    if (config.debug) {
      console.log(`IPFSHLSPlayer: Found ${videos.length} static videos to enhance`);
    }
    
    for (const video of videos) {
      try {
        const player = await this.enhanceVideoElement(video);
        players.push(player);
        
        if (config.debug) {
          console.log('IPFSHLSPlayer: Successfully enhanced static video:', video.id || 'no-id');
        }
      } catch (error) {
        console.error('Failed to enhance static video:', error);
      }
    }
    
    return players;
  }

  /**
   * Ensure Video.js styles are loaded
   * @returns {Promise} Resolves when styles are ready
   */
  static async ensureVideoJSStyles() {
    return ensureVideoJSStyles();
  }

}

/**
 * Ensure Video.js CSS is loaded - enhanced fallback system for universal support
 * @returns {Promise} Resolves when CSS is ready
 */
function ensureVideoJSStyles() {
  const config = window.ipfsHLSPlayerConfig || {};
  
  return new Promise((resolve) => {
    // Check if Video.js styles are already loaded by URL or inline
    const existingStyleLink = document.querySelector('link[href*="video-js"]');
    const existingVjsFallback = document.querySelector('link[data-vjs-fallback="true"]');
    
    if (existingStyleLink || existingVjsFallback) {
      if (config.debug) {
        console.log('IPFSHLSPlayer: Video.js CSS already loaded via link tag');
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
        console.log('IPFSHLSPlayer: Video.js CSS detected via computed styles');
      }
      return resolve();
    }
    
    // CSS not detected - load fallback
    console.warn('IPFSHLSPlayer: Video.js CSS not detected, loading fallback');
    
    // Try multiple fallback sources
    const fallbackSources = [
      'https://vjs.zencdn.net/8.6.1/video-js.css',
      'https://cdnjs.cloudflare.com/ajax/libs/video.js/8.6.1/video-js.min.css'
    ];
    
    let loadAttempts = 0;
    
    function tryLoadCSS(sourceIndex = 0) {
      if (sourceIndex >= fallbackSources.length) {
        console.error('IPFSHLSPlayer: All CSS fallback sources failed, proceeding without external CSS');
        return resolve();
      }
      
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = fallbackSources[sourceIndex];
      link.dataset.vjsFallback = 'true';
      link.dataset.attempt = loadAttempts++;
      
      link.onload = () => {
        if (config.debug) {
          console.log('IPFSHLSPlayer: Successfully loaded fallback CSS from:', link.href);
        }
        resolve();
      };
      
      link.onerror = () => {
        console.warn('IPFSHLSPlayer: Failed to load CSS from:', link.href);
        // Remove failed link and try next source
        document.head.removeChild(link);
        tryLoadCSS(sourceIndex + 1);
      };
      
      document.head.appendChild(link);
      
      // Timeout fallback
      setTimeout(() => {
        if (!link.sheet) {
          console.warn('IPFSHLSPlayer: CSS load timeout for:', link.href);
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
const IPFSHLSPlayerBundle = {
  videojs,
  IPFSHLSPlayer
};

// Make globally available
if (typeof window !== 'undefined') {
  window.videojs = videojs;
  window.IPFSHLSPlayer = IPFSHLSPlayer;
  window.IPFSHLSPlayerBundle = IPFSHLSPlayerBundle;
  
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
  
  // Static enhancement for documentation and non-framework contexts
  const config = window.ipfsHLSPlayerConfig || {};
  
  if (config.enableStaticEnhancement !== false) {
    document.addEventListener('DOMContentLoaded', async () => {
      try {
        if (config.debug) {
          console.log('IPFSHLSPlayer: Starting static page enhancement');
        }
        
        // Only enhance if not in a Vue/React app context
        const isFrameworkApp = document.querySelector('[data-vue-app], [data-react-app], .react-app');
        
        if (!isFrameworkApp) {
          await IPFSHLSPlayer.enhanceStaticVideos();
        } else if (config.debug) {
          console.log('IPFSHLSPlayer: Framework app detected, skipping static enhancement');
        }
      } catch (error) {
        console.error('Static video enhancement failed:', error);
      }
    });
  }
}

export default IPFSHLSPlayerBundle;