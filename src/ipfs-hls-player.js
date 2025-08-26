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
      console.log('IPFSHLSPlayer: Starting type detection for:', url);
      
      // Try Range request first (most efficient)
      console.log('IPFSHLSPlayer: Attempting Range request...');
      let response = await fetch(url, {
        headers: { 'Range': 'bytes=0-200' },
        mode: 'cors'
      });
      console.log('IPFSHLSPlayer: Range request completed, status:', response.status);
      
      // If Range not supported (416) or other error, try without Range
      if (response.status === 416 || !response.ok) {
        if (config.debug) {
          console.log('IPFSHLSPlayer: Range request failed, trying regular fetch');
        }
        response = await fetch(url, { mode: 'cors' });
      }
      
      // Read only what we need (up to 200 bytes)
      let bytes;
      if (response.headers.get('content-range')) {
        // Range request succeeded
        const buffer = await response.arrayBuffer();
        bytes = new Uint8Array(buffer);
      } else {
        // Regular fetch - read only first 200 bytes
        const reader = response.body.getReader();
        const { value } = await reader.read();
        await reader.cancel(); // Stop reading more
        bytes = new Uint8Array(value).slice(0, 200);
      }
      
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
      console.error('IPFSHLSPlayer: Content detection failed:', error, 'for URL:', url);
      // Return null - don't guess!
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
          const config = window.ipfsHLSPlayerConfig || {};
          
          // Only process URLs without explicit type
          if (!srcObj.type && self.shouldDetectContent(srcObj.src, srcObj.type)) {
            if (config.debug) {
              console.log('IPFSHLSPlayer Middleware: No type for extensionless URL:', srcObj.src);
            }
            
            try {
              // Try query params first
              let type = self.extractTypeFromURL(srcObj.src);
              
              // If no query param hints, try content detection
              if (!type) {
                type = await self.detectFromContent(srcObj.src);
              }
              
              if (config.debug) {
                console.log('IPFSHLSPlayer Middleware: Detected type:', type || 'unknown');
              }
              
              // Pass modified source with detected type
              return next(null, {
                src: srcObj.src,
                type: type || 'video/mp4' // Last resort fallback
              });
              
            } catch (error) {
              console.warn('IPFSHLSPlayer Middleware: Type detection failed:', error);
              // On error, proceed with fallback type
              return next(null, {
                src: srcObj.src,
                type: 'video/mp4'
              });
            }
          }
          
          // Pass through sources with type or recognized extensions
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
   * Capability Detection System
   * Detect browser capabilities to determine the best playback strategy
   */
  
  // Cache capabilities to avoid repeated detection
  static capabilities = null;
  
  /**
   * Detect all relevant browser capabilities
   * @returns {Object} Browser capabilities
   */
  static detectCapabilities() {
    if (this.capabilities) return this.capabilities;
    
    this.capabilities = {
      hasNativeHLS: this.hasNativeHLSSupport(),
      hasMSE: this.hasMSESupport(), 
      canOverrideNativeHLS: this.canOverrideNativeHLS(),
      supportsAbsoluteURLsInHLS: this.supportsAbsoluteURLsInHLS()
    };
    
    const config = window.ipfsHLSPlayerConfig || {};
    if (config.debug) {
      console.log('IPFSHLSPlayer: Detected capabilities:', this.capabilities);
    }
    
    return this.capabilities;
  }
  
  /**
   * Check if browser has native HLS support
   * @returns {boolean} True if native HLS is supported
   */
  static hasNativeHLSSupport() {
    const video = document.createElement('video');
    const canPlayHLS = video.canPlayType('application/vnd.apple.mpegurl') !== '' ||
                       video.canPlayType('application/x-mpegURL') !== '';
    return canPlayHLS;
  }
  
  /**
   * Check if browser has MediaSource Extensions support
   * @returns {boolean} True if MSE is supported
   */
  static hasMSESupport() {
    return !!(window.MediaSource || window.WebKitMediaSource);
  }
  
  /**
   * Check if Video.js can successfully override native HLS
   * Safari's native HLS cannot be properly overridden by Video.js
   * @returns {boolean} True if override will work
   */
  static canOverrideNativeHLS() {
    // If no native HLS, override isn't needed
    if (!this.hasNativeHLSSupport()) return true;
    
    // If browser has both native HLS and MSE, it's likely Safari
    // Safari's native HLS cannot be properly overridden by Video.js
    // This is a known Video.js 8.x limitation
    if (this.hasNativeHLSSupport() && this.hasMSESupport()) {
      // Conservative approach: assume override won't work
      // This catches Safari without browser sniffing
      return false;
    }
    
    return true;
  }
  
  /**
   * Check if native HLS supports absolute URLs in playlists
   * Required for IPFS HLS content with CID-based URLs
   * @returns {boolean} True if absolute URLs are supported
   */
  static supportsAbsoluteURLsInHLS() {
    // All known native HLS implementations support absolute URLs
    // This could be tested more rigorously if edge cases are found
    return this.hasNativeHLSSupport();
  }
  
  /**
   * Determine which player strategy to use based on capabilities
   * @param {string} src - Source URL
   * @param {string} type - MIME type (optional)
   * @returns {string} 'native' or 'videojs'
   */
  static getPlayerStrategy(src, type) {
    const caps = this.detectCapabilities();
    const isHLS = this.isHLSContent(src, type);
    
    const config = window.ipfsHLSPlayerConfig || {};
    
    if (isHLS) {
      // For HLS content, choose based on capabilities
      if (caps.hasNativeHLS && !caps.canOverrideNativeHLS) {
        // Has native HLS but Video.js can't override (Safari scenario)
        if (config.debug) {
          console.log('IPFSHLSPlayer: Using native HLS (Video.js override not possible)');
        }
        return 'native';
      } else if (caps.hasMSE) {
        // Has MSE, use Video.js HLS
        if (config.debug) {
          console.log('IPFSHLSPlayer: Using Video.js HLS (MSE available)');
        }
        return 'videojs';
      } else if (caps.hasNativeHLS) {
        // Fallback to native if available
        if (config.debug) {
          console.log('IPFSHLSPlayer: Using native HLS (no MSE)');
        }
        return 'native';
      } else {
        // No HLS support at all
        console.warn('IPFSHLSPlayer: No HLS support detected');
        return 'videojs'; // Try Video.js anyway
      }
    }
    
    // For non-HLS content, prefer Video.js if available
    return caps.hasMSE ? 'videojs' : 'native';
  }
  
  /**
   * Check if content is HLS
   * @param {string} src - Source URL
   * @param {string} type - MIME type (optional)
   * @returns {boolean} True if HLS content
   */
  static isHLSContent(src, type) {
    if (!src) return false;
    
    // Check explicit type (including detected type)
    if (type === 'application/x-mpegURL' || 
        type === 'application/vnd.apple.mpegurl' ||
        type === 'application/x-mpegurl') {
      return true;
    }
    
    // Check URL patterns
    return src.includes('.m3u8') || src.includes('/hls/');
  }

  /**
   * Initialize a Video.js player with IPFS-optimized settings
   * @param {HTMLVideoElement} element - Video element to enhance
   * @param {Object} options - Player configuration options
   * @returns {Promise<Player>} Video.js player instance or native wrapper
   */
  static async initializePlayer(element, options = {}) {
    // Register middleware on first initialization (for Video.js path)
    this.registerIPFSMiddleware();
    
    const config = window.ipfsHLSPlayerConfig || {};
    
    // Prevent double initialization
    if (element._ipfsHLSPlayer || element.dataset.ipfsEnhanced === 'true') {
      if (config.debug) {
        console.log('IPFSHLSPlayer: Video already enhanced, skipping duplicate initialization for:', element.id || 'no-id');
      }
      return element._ipfsHLSPlayer;
    }
    
    // Detect source type if not provided
    let sourceType = options.type;
    
    // Try query parameter hints first (fastest)
    if (!sourceType && options.src) {
      sourceType = this.extractTypeFromURL(options.src);
      if (sourceType && config.debug) {
        console.log('IPFSHLSPlayer: Type detected from URL params:', sourceType);
      }
    }
    
    // Try extension-based detection (fast)
    if (!sourceType && options.src) {
      sourceType = this.detectSourceType(options.src);
      if (sourceType && config.debug) {
        console.log('IPFSHLSPlayer: Type detected from extension:', sourceType);
      }
    }
    
    // For ANY URL without extension and no type, try content detection (slower but universal)
    if (!sourceType && options.src && this.shouldDetectContent(options.src, sourceType)) {
      if (config.debug) {
        console.log('IPFSHLSPlayer: No extension found, attempting content detection for:', options.src);
      }
      
      try {
        sourceType = await this.detectFromContent(options.src);
        if (config.debug) {
          console.log('IPFSHLSPlayer: Content detection result:', sourceType || 'unknown');
        }
      } catch (error) {
        if (config.debug) {
          console.warn('IPFSHLSPlayer: Content detection failed:', error.message);
        }
        // Continue without type, let browser/player figure it out
      }
      
      // Update options with detected type for downstream use
      if (sourceType) {
        options.type = sourceType;
      }
    }
    
    // Determine which player to use based on capabilities
    // Use options.type which has the detected type
    const strategy = this.getPlayerStrategy(options.src, options.type || sourceType);
    
    if (config.debug) {
      console.log('IPFSHLSPlayer: Player strategy:', strategy, 'for', options.src);
      console.log('IPFSHLSPlayer: Final sourceType before player init:', sourceType);
      console.log('IPFSHLSPlayer: Final options.type before player init:', options.type);
    }
    
    // Route to appropriate player implementation
    if (strategy === 'native') {
      return this.initializeNativePlayer(element, options);
    } else {
      return this.initializeVideoJSPlayer(element, options);
    }
  }
  
  /**
   * Initialize a native HTML5 player (for Safari HLS)
   * @param {HTMLVideoElement} element - Video element to enhance
   * @param {Object} options - Player configuration options
   * @returns {Object} Native player wrapper with Video.js-compatible API
   */
  static initializeNativePlayer(element, options = {}) {
    const config = window.ipfsHLSPlayerConfig || {};
    
    // Validate element is actually a video element
    if (!element || element.tagName !== 'VIDEO') {
      const error = `Element is not a valid video element: tagName=${element?.tagName}`;
      if (config.debug) {
        console.error('IPFSHLSPlayer:', error);
      }
      throw new Error(error);
    }
    
    if (config.debug) {
      console.log('IPFSHLSPlayer: Initializing native player for:', options.src);
      console.log('IPFSHLSPlayer: Options passed to native player:', {
        src: options.src,
        type: options.type,
        preload: options.preload
      });
      console.log('IPFSHLSPlayer: Element state:', {
        tagName: element.tagName,
        id: element.id,
        readyState: element.readyState,
        networkState: element.networkState,
        currentSrc: element.currentSrc,
        canPlayType_HLS: (element.canPlayType ? element.canPlayType('application/vnd.apple.mpegurl') : 'canPlayType not available')
      });
    }
    
    // Ensure element has an ID
    if (!element.id) {
      element.id = `ipfs-video-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Configure native video element
    element.controls = true;
    
    // Set default preload if not specified (important for Safari HLS)
    element.preload = options.preload || 'metadata';
    
    if (config.debug) {
      console.log('IPFSHLSPlayer: Set preload to:', element.preload);
    }
    
    if (options.src) {
      element.src = options.src;
      
      if (config.debug) {
        console.log('IPFSHLSPlayer: Set src, element state now:', {
          src: element.src,
          readyState: element.readyState,
          networkState: element.networkState
        });
      }
      
      // For HLS content in Safari, we need to explicitly trigger load
      // This ensures Safari's HLS subsystem initializes properly
      const isHLS = this.isHLSContent(options.src, options.type);
      if (config.debug) {
        console.log('IPFSHLSPlayer: Is HLS content?', isHLS, 'Type:', options.type);
      }
      
      if (isHLS) {
        // Defensive check to ensure element is still a video element
        if (element && element.tagName === 'VIDEO' && typeof element.load === 'function') {
          if (config.debug) {
            console.log('IPFSHLSPlayer: Calling load() for HLS content');
          }
          element.load();
          if (config.debug) {
            console.log('IPFSHLSPlayer: After load(), element state:', {
              readyState: element.readyState,
              networkState: element.networkState,
              error: element.error
            });
          }
        } else {
          if (config.debug) {
            console.warn('IPFSHLSPlayer: Cannot call load() - element check failed');
          }
        }
      }
    }
    // Safari doesn't use type attribute for native playback - it figures it out from the URL/content
    
    // Apply options
    if (options.poster) element.poster = options.poster;
    if (options.autoplay) element.autoplay = true;
    if (options.muted) element.muted = true;
    if (options.loop) element.loop = true;
    
    // Apply CSS for consistent styling
    element.classList.add('video-js', 'vjs-default-skin');
    
    // Mark as enhanced
    element.dataset.ipfsEnhanced = 'true';
    
    // Add debug event listeners if in debug mode
    if (config.debug) {
      const events = ['loadstart', 'loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough', 'error', 'stalled', 'waiting'];
      events.forEach(eventName => {
        element.addEventListener(eventName, (e) => {
          console.log(`IPFSHLSPlayer: Native player event: ${eventName}`, {
            readyState: element.readyState,
            networkState: element.networkState,
            currentTime: element.currentTime,
            duration: element.duration,
            error: element.error
          });
        });
      });
    }
    
    // Create wrapper with Video.js-compatible API
    const wrapper = {
      // Core methods
      play: () => element.play(),
      pause: () => element.pause(),
      paused: () => element.paused,
      currentTime: (time) => {
        if (time !== undefined) element.currentTime = time;
        return element.currentTime;
      },
      duration: () => element.duration,
      volume: (vol) => {
        if (vol !== undefined) element.volume = vol;
        return element.volume;
      },
      muted: (mute) => {
        if (mute !== undefined) element.muted = mute;
        return element.muted;
      },
      
      // Source management
      src: (source) => {
        if (source) {
          element.src = typeof source === 'string' ? source : source.src;
        }
        return element.src;
      },
      currentSrc: () => element.currentSrc,
      currentType: () => options.type || 'application/x-mpegURL',
      
      // Event handling
      on: (event, handler) => element.addEventListener(event, handler),
      off: (event, handler) => element.removeEventListener(event, handler),
      one: (event, handler) => element.addEventListener(event, handler, { once: true }),
      
      // Lifecycle
      ready: (callback) => {
        if (element.readyState >= 1) {
          callback();
        } else {
          element.addEventListener('loadedmetadata', callback, { once: true });
        }
      },
      dispose: () => {
        // Get fresh element reference by ID to avoid stale closure issues
        const currentElement = element.id ? document.getElementById(element.id) : element;
        
        if (config.debug) {
          console.log('IPFSHLSPlayer: Disposing native player, element check:', {
            hasId: !!element.id,
            foundById: !!currentElement,
            tagName: currentElement?.tagName,
            isSameElement: currentElement === element
          });
        }
        
        // Check if element is still a valid video element
        if (currentElement && currentElement.tagName === 'VIDEO') {
          currentElement.src = '';
          if (typeof currentElement.load === 'function') {
            currentElement.load();
          }
          delete currentElement._ipfsHLSPlayer;
          currentElement.dataset.ipfsEnhanced = 'false';
        } else if (config.debug) {
          console.warn('IPFSHLSPlayer: Cannot dispose - element is not a valid VIDEO element');
        }
      },
      
      // Element access
      el: () => element,
      
      // Control bar (mock for compatibility)
      controlBar: {
        getChild: () => null,
        show: () => {},
        hide: () => {}
      },
      
      // Quality levels (mock for compatibility)
      qualityLevels: () => ({
        on: () => {},
        off: () => {},
        levels_: []
      }),
      
      // Type identification
      isNativePlayer: true,
      
      // Direct element access
      element: element
    };
    
    // Store reference
    element._ipfsHLSPlayer = wrapper;
    
    if (config.debug) {
      console.log('IPFSHLSPlayer: Native player initialized successfully');
    }
    
    return wrapper;
  }
  
  /**
   * Initialize a Video.js player with IPFS-optimized settings
   * @param {HTMLVideoElement} element - Video element to enhance
   * @param {Object} options - Player configuration options
   * @returns {Promise<Player>} Video.js player instance
   */
  static async initializeVideoJSPlayer(element, options = {}) {
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
   * Extract type hints from URL query parameters
   * @param {string} url - Video source URL
   * @returns {string|null} MIME type hint or null
   */
  static extractTypeFromURL(url) {
    if (!url) return null;
    
    try {
      const urlObj = new URL(url, window.location.href); // Handle relative URLs
      
      // Check for common type parameters
      const typeParam = urlObj.searchParams.get('type') || 
                       urlObj.searchParams.get('format') ||
                       urlObj.searchParams.get('mime') ||
                       urlObj.searchParams.get('content-type');
      
      if (!typeParam) return null;
      
      // Normalize common variations
      const paramLower = typeParam.toLowerCase();
      
      // HLS variations
      if (paramLower.includes('hls') || paramLower === 'm3u8' || paramLower === 'm3u') {
        return 'application/x-mpegURL';
      }
      
      // DASH variations
      if (paramLower.includes('dash') || paramLower === 'mpd') {
        return 'application/dash+xml';
      }
      
      // MP4 variations
      if (paramLower.includes('mp4') || paramLower === 'm4v') {
        return 'video/mp4';
      }
      
      // WebM
      if (paramLower.includes('webm')) {
        return 'video/webm';
      }
      
      // MOV/QuickTime
      if (paramLower.includes('mov') || paramLower.includes('quicktime')) {
        return 'video/quicktime';
      }
      
      // If it looks like a MIME type already, return it
      if (paramLower.includes('/')) {
        return typeParam;
      }
      
      return null;
    } catch (e) {
      // Invalid URL, ignore
      return null;
    }
  }
  
  /**
   * Check if content detection should be performed
   * @param {string} src - Video source URL
   * @param {string} type - Existing MIME type (if any)
   * @returns {boolean} True if content detection should be performed
   */
  static shouldDetectContent(src, type) {
    // Already have type? No need to detect
    if (type) return false;
    
    // No source? Can't detect
    if (!src) return false;
    
    // Check if URL has a recognized video extension
    const hasExtension = /\.(m3u8|m3u|mpd|mp4|m4v|webm|ogg|ogv|mov|avi|mkv|flv|ts|wmv|3gp)$/i.test(src);
    
    // If no recognized extension, we should detect content
    return !hasExtension;
  }
  
  /**
   * Detect video source type from URL
   * @param {string} src - Video source URL
   * @returns {string|null} MIME type or null if unknown
   */
  static detectSourceType(src) {
    if (!src) return null;
    
    const srcLower = src.toLowerCase();
    
    // HLS/Streaming formats
    if (srcLower.match(/\.(m3u8|m3u)$/)) return 'application/x-mpegURL';
    if (srcLower.match(/\.mpd$/)) return 'application/dash+xml';
    
    // Common video formats
    if (srcLower.match(/\.(mp4|m4v)$/)) return 'video/mp4';
    if (srcLower.match(/\.webm$/)) return 'video/webm';
    if (srcLower.match(/\.(ogg|ogv)$/)) return 'video/ogg';
    if (srcLower.match(/\.mov$/)) return 'video/quicktime';
    if (srcLower.match(/\.avi$/)) return 'video/x-msvideo';
    if (srcLower.match(/\.mkv$/)) return 'video/x-matroska';
    if (srcLower.match(/\.flv$/)) return 'video/x-flv';
    if (srcLower.match(/\.ts$/)) return 'video/mp2t';
    if (srcLower.match(/\.wmv$/)) return 'video/x-ms-wmv';
    if (srcLower.match(/\.3gp$/)) return 'video/3gpp';
    
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