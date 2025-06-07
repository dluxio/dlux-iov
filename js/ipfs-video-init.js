// Standalone IPFS Video Support Initialization
// This script can be included in any HTML page to enable IPFS video loading with HLS.js

import MCommon from '/js/methods-common.js';

// Initialize IPFS video support when the DOM is ready
function initIpfsVideoSupport() {
  if (typeof Hls === 'undefined') {
    console.warn('HLS.js library not loaded. Please include: <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>');
    return null;
  }

  // Start observing for video elements
  return MCommon.observeVideoElements();
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initIpfsVideoSupport);
} else {
  // DOM is already ready
  initIpfsVideoSupport();
}

// Export for manual initialization if needed
export { initIpfsVideoSupport, MCommon }; 