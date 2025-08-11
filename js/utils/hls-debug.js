// HLS-specific Debug Logger
// Focused debugging for HLS playback issues without the noise

class HLSDebugger {
    constructor() {
        this.enabled = this.checkEnabled();
        this.prefix = '[HLS-DEBUG]';
        this.seenMessages = new Set(); // Prevent duplicate messages
        this.rateLimitMap = new Map(); // Rate limit error messages
        this.RATE_LIMIT_MS = 5000; // 5 seconds between same errors
    }

    checkEnabled() {
        return localStorage.getItem('dlux_hls_debug') === 'true' ||
               new URLSearchParams(window.location.search).get('hls_debug') === 'true';
    }

    enable() {
        localStorage.setItem('dlux_hls_debug', 'true');
        this.enabled = true;
        console.log(this.prefix, 'HLS debugging enabled');
    }

    disable() {
        localStorage.removeItem('dlux_hls_debug');
        this.enabled = false;
        console.log(this.prefix, 'HLS debugging disabled');
    }

    // Log only unique messages to reduce noise
    log(category, message, data = null) {
        if (!this.enabled) return;

        // Maintain cache size
        this.maintainCache();

        // Skip most LOADER messages - only show failures and important resolutions
        if (category === 'LOADER') {
            // Only log URL resolution failures or when fixing malformed URLs
            if (!message.includes('Resolved relative/malformed URL') && !message.includes('ERROR')) {
                return;
            }
        }

        // Skip repetitive PLAYER messages
        if (category === 'PLAYER' && message.includes('Playback ready')) {
            // Only log once per session to reduce noise
            const key = `${category}:playback_ready`;
            if (this.seenMessages.has(key)) return;
            this.seenMessages.add(key);
        }

        // Rate limit ERROR messages
        if (category === 'ERROR') {
            const now = Date.now();
            const key = `${category}:${message}`;
            const lastLogged = this.rateLimitMap.get(key);

            if (lastLogged && (now - lastLogged) < this.RATE_LIMIT_MS) {
                return; // Skip - too soon
            }

            this.rateLimitMap.set(key, now);
        }

        // Log only once for non-error messages (except already handled above)
        const key = `${category}:${message}`;
        if (category !== 'ERROR' && category !== 'PLAYER' && this.seenMessages.has(key)) return;

        this.seenMessages.add(key);

        if (data) {
            console.log(`${this.prefix} [${category}]`, message, data);
        } else {
            console.log(`${this.prefix} [${category}]`, message);
        }
    }

    // Log file detection attempts (simplified)
    fileDetection(file) {
        if (!this.enabled) return;

        // Only log if it's actually an HLS file
        if (file.meta?.type === 'm3u8' || file.type === 'm3u8') {
            console.log(this.prefix, `HLS file detected: ${file.name}.m3u8`);
        }
    }

    // Log video element setup (simplified)
    videoSetup(videoElement, src, type) {
        if (!this.enabled) return;

        // Only log if it's HLS content
        if (type === 'application/x-mpegURL' || src.includes('.m3u8')) {
            console.log(this.prefix, `Setting up HLS: ${src.split('/').pop()}`);
        }
    }

    // Log HLS.js initialization
    hlsInit(src, success, error = null) {
        if (!this.enabled) return;

        if (success) {
            console.log(this.prefix, 'HLS.js initialized successfully for:', src);
        } else {
            console.error(this.prefix, 'HLS.js initialization failed:', src, error);
        }
    }

    // Clear seen messages (useful for testing)
    clearCache() {
        this.seenMessages.clear();
        this.rateLimitMap.clear();
        console.log(this.prefix, 'Message cache cleared');
    }

    // Auto-clear cache when it gets too large to prevent memory issues
    maintainCache() {
        if (this.seenMessages.size > 100) {
            this.seenMessages.clear();
        }
        if (this.rateLimitMap.size > 50) {
            const now = Date.now();
            // Remove entries older than 30 seconds
            for (const [key, timestamp] of this.rateLimitMap.entries()) {
                if (now - timestamp > 30000) {
                    this.rateLimitMap.delete(key);
                }
            }
        }
    }
}

// Create singleton instance
const hlsDebug = new HLSDebugger();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = hlsDebug;
}

// Export for ES6 modules
export default hlsDebug;
export { hlsDebug };

// Make available globally for console debugging
window.hlsDebug = hlsDebug;
