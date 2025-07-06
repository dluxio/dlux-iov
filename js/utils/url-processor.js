/**
 * Modular URL Processor for DLUX IOV
 * Handles protocol addition and IPFS filename parameters for all file types
 */

const URLProcessor = {
  /**
   * Detect file type from URL or metadata
   * @param {string} url - The URL to analyze
   * @param {Object} metadata - Optional metadata containing type information
   * @returns {string} - Detected file type
   */
  detectFileType(url, metadata = null) {
    // Check metadata first - SPK metadata or explicit type
    if (metadata?.type) {
      // Handle SPK metadata formats
      if (metadata.type === 'm3u8' || metadata.meta?.type === 'm3u8') {
        return 'm3u8';
      }
      return metadata.type;
    }
    
    // Check URL patterns for common file extensions
    const urlLower = url.toLowerCase();
    
    // Video formats
    if (urlLower.match(/\.(m3u8|m3u)$/i) || urlLower.includes('.m3u8?')) {
      return 'm3u8';
    }
    if (urlLower.match(/\.(mp4|webm|ogg|ogv|mov|avi|mkv)$/i)) {
      return 'video';
    }
    
    // Image formats
    if (urlLower.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i)) {
      return 'image';
    }
    
    // Audio formats
    if (urlLower.match(/\.(mp3|wav|ogg|oga|m4a|flac|aac)$/i)) {
      return 'audio';
    }
    
    // Document formats
    if (urlLower.match(/\.(pdf|doc|docx|txt|rtf|odt)$/i)) {
      return 'document';
    }
    
    // Application/code formats
    if (urlLower.match(/\.(js|json|html|htm|css|xml|zip|tar|gz)$/i)) {
      return 'application';
    }
    
    return 'unknown';
  },
  
  /**
   * Process IPFS URLs - returns them unchanged to preserve clean URLs
   * @param {string} url - The IPFS URL to process
   * @param {string} fileType - The detected or specified file type (unused but kept for API compatibility)
   * @returns {string} - Original URL unchanged
   */
  processIPFSUrl(url, fileType = 'unknown') {
    // Return IPFS URLs unchanged - no filename parameters should be added
    // Type information is conveyed through HTML attributes (data-type, type) not URL parameters
    return url;
  },
  
  /**
   * Main processing function - ensures protocol and processes IPFS URLs
   * @param {string} url - The URL to process
   * @param {Object} metadata - Optional metadata for type detection
   * @returns {Object} - Processed URL and detected file type
   */
  processUrl(url, metadata = null) {
    if (!url) {
      return { url: '', fileType: 'unknown' };
    }
    
    // Trim and ensure protocol
    let processedUrl = url.trim();
    if (!processedUrl.match(/^https?:\/\//i)) {
      // Add https:// if no protocol is specified
      processedUrl = 'https://' + processedUrl;
    }
    
    // Detect file type from URL or metadata
    const fileType = this.detectFileType(processedUrl, metadata);
    
    // Process IPFS URLs with appropriate filename parameter
    processedUrl = this.processIPFSUrl(processedUrl, fileType);
    
    return {
      url: processedUrl,
      fileType: fileType,
      isIPFS: processedUrl.includes('ipfs.dlux.io/ipfs/')
    };
  },
  
  /**
   * Extract clean IPFS CID from URL
   * @param {string} url - The IPFS URL
   * @returns {string|null} - The CID or null if not an IPFS URL
   */
  extractIPFSCid(url) {
    if (!url.includes('ipfs.dlux.io/ipfs/')) {
      return null;
    }
    
    const parts = url.split('/ipfs/');
    if (parts.length <= 1) {
      return null;
    }
    
    // Get CID without parameters
    const cid = parts[1].split('?')[0].split('#')[0];
    return cid;
  },
  
  /**
   * Check if URL is an IPFS URL
   * @param {string} url - The URL to check
   * @returns {boolean} - True if IPFS URL
   */
  isIPFSUrl(url) {
    return url && url.includes('ipfs.dlux.io/ipfs/');
  }
};

// Export for use in other modules
export default URLProcessor;