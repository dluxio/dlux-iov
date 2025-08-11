// Debug Logger Utility
// Provides conditional logging based on debug mode setting
// Enable via localStorage: localStorage.setItem('dlux_debug', 'true')
// Or via URL: ?debug=true

class DebugLogger {
    constructor() {
        this.debugEnabled = this.checkDebugMode();
        this.prefix = '[DLUX]';
    }

    checkDebugMode() {
        // Check localStorage
        if (typeof localStorage !== 'undefined' && localStorage.getItem('dlux_debug') === 'true') {
            return true;
        }

        // Check URL parameter
        if (typeof window !== 'undefined' && window.location) {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('debug') === 'true') {
                return true;
            }
        }

        return false;
    }

    setDebugMode(enabled) {
        this.debugEnabled = enabled;
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('dlux_debug', enabled ? 'true' : 'false');
        }
    }

    // Debug level - only shown when debug mode is enabled
    debug(...args) {
        if (this.debugEnabled) {
            console.log(this.prefix + ' [DEBUG]', ...args);
        }
    }

    // Info level - always shown in production
    info(...args) {
        console.log(this.prefix + ' [INFO]', ...args);
    }

    // Warning level - always shown
    warn(...args) {
        console.warn(this.prefix + ' [WARN]', ...args);
    }

    // Error level - always shown
    error(...args) {
        console.error(this.prefix + ' [ERROR]', ...args);
    }

    // Group logging for better organization
    group(label) {
        if (this.debugEnabled) {
            console.group(this.prefix + ' ' + label);
        }
    }

    groupEnd() {
        if (this.debugEnabled) {
            console.groupEnd();
        }
    }

    // Table logging for structured data
    table(data, columns) {
        if (this.debugEnabled) {
            console.table(data, columns);
        }
    }

    // Time tracking
    time(label) {
        if (this.debugEnabled) {
            console.time(this.prefix + ' ' + label);
        }
    }

    timeEnd(label) {
        if (this.debugEnabled) {
            console.timeEnd(this.prefix + ' ' + label);
        }
    }
}

// Create singleton instance
const debugLogger = new DebugLogger();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = debugLogger;
}

// Export for ES6 modules
export default debugLogger;
export { debugLogger };
