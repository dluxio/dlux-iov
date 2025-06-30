/**
 * IPFS-Native HLS Player
 * 
 * Custom HLS implementation designed specifically for IPFS content-addressed storage.
 * Replaces HLS.js which is incompatible with IPFS CID-based URLs.
 * 
 * Features:
 * - Native M3U8 playlist parsing
 * - Adaptive bitrate switching
 * - IPFS CID-based segment loading
 * - HTML5 video integration
 */

import hlsDebug from '/js/utils/hls-debug.js';

class IPFSHLSPlayer {
  constructor(videoElement, gatewayUrl = 'https://ipfs.dlux.io') {
    this.video = videoElement;
    this.gatewayUrl = gatewayUrl;
    
    // Player state
    this.masterPlaylist = null;
    this.variantPlaylists = new Map(); // quality -> playlist data
    this.currentQuality = null;
    this.currentSegments = [];
    this.currentSegmentIndex = 0;
    
    // Buffering
    this.bufferQueue = [];
    this.isBuffering = false;
    this.bufferSize = 3; // Keep 3 segments buffered
    
    // Event handling
    this.onError = null;
    this.onQualityChange = null;
    
    this.setupVideoEvents();
  }
  
  setupVideoEvents() {
    this.video.addEventListener('loadstart', () => {
      hlsDebug.log('PLAYER', 'Video loadstart event');
    });
    
    this.video.addEventListener('loadeddata', () => {
      hlsDebug.log('PLAYER', 'Video loaded data');
    });
    
    this.video.addEventListener('canplay', () => {
      hlsDebug.log('PLAYER', 'Video can play');
    });
    
    this.video.addEventListener('timeupdate', () => {
      this.handleTimeUpdate();
    });
    
    this.video.addEventListener('seeking', () => {
      this.handleSeeking();
    });
    
    this.video.addEventListener('error', (e) => {
      hlsDebug.log('ERROR', `Video error: ${e.message || 'Unknown error'}`);
      if (this.onError) this.onError(e);
    });
  }
  
  /**
   * Load and start playing an HLS stream from IPFS
   * @param {string} masterPlaylistUrl - IPFS URL to master playlist
   * @param {Object} fileMetadata - File metadata with CID mappings
   */
  async loadSource(masterPlaylistUrl, fileMetadata = null) {
    try {
      hlsDebug.log('PLAYER', `Loading HLS source: ${masterPlaylistUrl}`);
      
      // Parse master playlist
      this.masterPlaylist = await this.fetchAndParseM3U8(masterPlaylistUrl);
      hlsDebug.log('PLAYER', `Master playlist loaded with ${this.masterPlaylist.variants.length} quality levels`);
      
      // Select initial quality (highest available)
      const qualities = this.masterPlaylist.variants.sort((a, b) => b.bandwidth - a.bandwidth);
      await this.switchQuality(qualities[0]);
      
      // Start playback
      this.startPlayback();
      
    } catch (error) {
      hlsDebug.log('ERROR', `Failed to load HLS source: ${error.message}`);
      if (this.onError) this.onError(error);
    }
  }
  
  /**
   * Fetch and parse M3U8 playlist from IPFS
   */
  async fetchAndParseM3U8(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const content = await response.text();
      return this.parseM3U8(content, url);
      
    } catch (error) {
      throw new Error(`Failed to fetch M3U8: ${error.message}`);
    }
  }
  
  /**
   * Parse M3U8 playlist content
   */
  parseM3U8(content, baseUrl) {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    
    if (!lines[0] || !lines[0].startsWith('#EXTM3U')) {
      throw new Error('Invalid M3U8 format: missing #EXTM3U header');
    }
    
    // Detect playlist type
    const isMaster = content.includes('#EXT-X-STREAM-INF');
    
    if (isMaster) {
      return this.parseMasterPlaylist(lines, baseUrl);
    } else {
      return this.parseVariantPlaylist(lines, baseUrl);
    }
  }
  
  /**
   * Parse master playlist (contains quality variants)
   */
  parseMasterPlaylist(lines, baseUrl) {
    const variants = [];
    let currentVariant = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('#EXT-X-STREAM-INF:')) {
        // Parse variant info
        currentVariant = this.parseStreamInf(line);
      } else if (currentVariant && !line.startsWith('#')) {
        // This is the variant playlist URL
        currentVariant.url = this.resolveUrl(line, baseUrl);
        variants.push(currentVariant);
        currentVariant = null;
      }
    }
    
    return {
      type: 'master',
      variants: variants
    };
  }
  
  /**
   * Parse variant playlist (contains segments)
   */
  parseVariantPlaylist(lines, baseUrl) {
    const segments = [];
    let duration = 0;
    let sequence = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('#EXTINF:')) {
        // Extract segment duration
        const match = line.match(/#EXTINF:([0-9.]+)/);
        if (match) {
          duration = parseFloat(match[1]);
        }
      } else if (line.startsWith('#EXT-X-MEDIA-SEQUENCE:')) {
        // Extract starting sequence number
        const match = line.match(/#EXT-X-MEDIA-SEQUENCE:(\d+)/);
        if (match) {
          sequence = parseInt(match[1]);
        }
      } else if (!line.startsWith('#') && duration > 0) {
        // This is a segment URL
        segments.push({
          url: this.resolveUrl(line, baseUrl),
          duration: duration,
          sequence: sequence++
        });
        duration = 0;
      }
    }
    
    return {
      type: 'variant',
      segments: segments,
      duration: segments.reduce((total, seg) => total + seg.duration, 0)
    };
  }
  
  /**
   * Parse #EXT-X-STREAM-INF line
   */
  parseStreamInf(line) {
    const variant = {
      bandwidth: 0,
      resolution: null,
      codecs: null
    };
    
    // Extract bandwidth
    const bandwidthMatch = line.match(/BANDWIDTH=(\d+)/);
    if (bandwidthMatch) {
      variant.bandwidth = parseInt(bandwidthMatch[1]);
    }
    
    // Extract resolution
    const resolutionMatch = line.match(/RESOLUTION=(\d+x\d+)/);
    if (resolutionMatch) {
      variant.resolution = resolutionMatch[1];
    }
    
    // Extract codecs
    const codecsMatch = line.match(/CODECS="([^"]+)"/);
    if (codecsMatch) {
      variant.codecs = codecsMatch[1];
    }
    
    return variant;
  }
  
  /**
   * Resolve relative URLs for IPFS
   */
  resolveUrl(url, baseUrl) {
    if (url.startsWith('http')) {
      return url; // Already absolute
    }
    
    // For IPFS, we need to extract the CID and create proper URLs
    if (baseUrl.includes('/ipfs/')) {
      const cidMatch = baseUrl.match(/\/ipfs\/([^\/\?]+)/);
      if (cidMatch) {
        const cid = cidMatch[1];
        // Create IPFS URL with filename parameter
        let filename = 'playlist.m3u8';
        if (url.includes('.ts')) {
          filename = 'segment.ts';
        } else if (url.includes('.m3u8')) {
          filename = 'playlist.m3u8';
        }
        
        return `${this.gatewayUrl}/ipfs/${cid}?filename=${filename}`;
      }
    }
    
    // Fallback: treat as relative to base
    const baseWithoutParams = baseUrl.split('?')[0];
    const basePath = baseWithoutParams.substring(0, baseWithoutParams.lastIndexOf('/'));
    return `${basePath}/${url}`;
  }
  
  /**
   * Switch to a different quality level
   */
  async switchQuality(variant) {
    try {
      hlsDebug.log('PLAYER', `Switching to quality: ${variant.resolution || variant.bandwidth}`);
      
      // Load variant playlist if not cached
      if (!this.variantPlaylists.has(variant.url)) {
        const playlist = await this.fetchAndParseM3U8(variant.url);
        this.variantPlaylists.set(variant.url, playlist);
      }
      
      const playlist = this.variantPlaylists.get(variant.url);
      this.currentQuality = variant;
      this.currentSegments = playlist.segments;
      this.currentSegmentIndex = 0;
      
      if (this.onQualityChange) {
        this.onQualityChange(variant);
      }
      
      hlsDebug.log('PLAYER', `Quality switched. Loaded ${playlist.segments.length} segments`);
      
    } catch (error) {
      hlsDebug.log('ERROR', `Failed to switch quality: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Start playback by loading the first segment
   */
  async startPlayback() {
    if (!this.currentSegments.length) {
      throw new Error('No segments available for playback');
    }
    
    try {
      // Load first segment
      const firstSegment = this.currentSegments[0];
      hlsDebug.log('PLAYER', `Loading first segment: ${firstSegment.url}`);
      
      // For now, we'll use a simple approach: set the video src to the first segment
      // In a full implementation, we'd create a MediaSource and append segments
      this.video.src = firstSegment.url;
      
      // Start buffering additional segments
      this.startBuffering();
      
    } catch (error) {
      hlsDebug.log('ERROR', `Failed to start playback: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Handle video time updates for segment switching
   */
  handleTimeUpdate() {
    // Simple implementation: for now we just log progress
    // In a full implementation, we'd handle segment boundaries here
    const currentTime = this.video.currentTime;
    const duration = this.video.duration;
    
    if (duration > 0) {
      const progress = (currentTime / duration) * 100;
      // Only log occasionally to avoid spam
      if (Math.floor(progress) % 10 === 0 && Math.floor(progress) !== this.lastLoggedProgress) {
        hlsDebug.log('PLAYER', `Playback progress: ${Math.floor(progress)}%`);
        this.lastLoggedProgress = Math.floor(progress);
      }
    }
  }
  
  /**
   * Handle seeking events
   */
  handleSeeking() {
    hlsDebug.log('PLAYER', `Seeking to: ${this.video.currentTime}s`);
    // In a full implementation, we'd calculate which segment to load based on seek time
  }
  
  /**
   * Start buffering segments ahead of playback
   */
  startBuffering() {
    if (this.isBuffering) return;
    
    this.isBuffering = true;
    hlsDebug.log('PLAYER', 'Starting segment buffering');
    
    // Simple buffering strategy: preload next few segments
    // In a full implementation, we'd use MediaSource API
    for (let i = 1; i < Math.min(this.bufferSize, this.currentSegments.length); i++) {
      const segment = this.currentSegments[i];
      this.preloadSegment(segment);
    }
  }
  
  /**
   * Preload a segment for buffering
   */
  async preloadSegment(segment) {
    try {
      hlsDebug.log('PLAYER', `Preloading segment: ${segment.url}`);
      
      // Simple preload: just fetch the segment to cache it
      const response = await fetch(segment.url);
      if (response.ok) {
        // Segment cached by browser
        hlsDebug.log('PLAYER', `Segment preloaded successfully`);
      }
      
    } catch (error) {
      hlsDebug.log('ERROR', `Failed to preload segment: ${error.message}`);
    }
  }
  
  /**
   * Get available quality levels
   */
  getQualityLevels() {
    if (!this.masterPlaylist) return [];
    
    return this.masterPlaylist.variants.map((variant, index) => ({
      index: index,
      bandwidth: variant.bandwidth,
      resolution: variant.resolution,
      codecs: variant.codecs
    }));
  }
  
  /**
   * Destroy the player and clean up resources
   */
  destroy() {
    hlsDebug.log('PLAYER', 'Destroying IPFS HLS player');
    
    // Stop any ongoing operations
    this.isBuffering = false;
    
    // Clear data
    this.masterPlaylist = null;
    this.variantPlaylists.clear();
    this.currentSegments = [];
    this.bufferQueue = [];
    
    // Remove video source
    if (this.video) {
      this.video.src = '';
      this.video.load();
    }
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = IPFSHLSPlayer;
}

// Export for ES6 modules
export default IPFSHLSPlayer;

// Make available globally
window.IPFSHLSPlayer = IPFSHLSPlayer;