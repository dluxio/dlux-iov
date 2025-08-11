/**
 * Error Handler Service
 *
 * Centralized error handling service that provides consistent error logging,
 * reporting, and recovery patterns throughout the application.
 *
 * @follows Rule #7: Single Responsibility - Only handles error management
 * @follows Rule #9: Consistent Patterns - Standardized error handling across codebase
 */

class ErrorHandlerService {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 100;
        this.errorCallbacks = new Map();
        this.errorStats = {
            total: 0,
            byType: {},
            bySource: {}
        };

        this.DEBUG = window.DEBUG || false;
    }

    /**
     * Log an error with consistent formatting
     * @param {Error|string} error - The error object or message
     * @param {string} context - Context where error occurred
     * @param {Object} metadata - Additional metadata
     * @returns {void}
     */
    logError(error, context = 'unknown', metadata = {}) {
        const errorEntry = {
            timestamp: new Date().toISOString(),
            context,
            message: error.message || error,
            stack: error.stack || null,
            metadata,
            type: this.categorizeError(error),
            id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };

        // Add to log (with size limit)
        this.errorLog.unshift(errorEntry);
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog.pop();
        }

        // Update stats
        this.errorStats.total++;
        this.errorStats.byType[errorEntry.type] = (this.errorStats.byType[errorEntry.type] || 0) + 1;
        this.errorStats.bySource[context] = (this.errorStats.bySource[context] || 0) + 1;

        // Console output with consistent format
        const prefix = this.getErrorPrefix(errorEntry.type);
        console.error(`${prefix} [${context}]:`, error.message || error);

        if (this.DEBUG && error.stack) {
            console.error('Stack trace:', error.stack);
        }

        if (this.DEBUG && Object.keys(metadata).length > 0) {
            console.error('Metadata:', metadata);
        }

        // Emit error event
        window.dispatchEvent(new CustomEvent('app-error', {
            detail: errorEntry
        }));

        // Call registered error callbacks
        this.errorCallbacks.forEach((callback, id) => {
            try {
                callback(errorEntry);
            } catch (cbError) {
                console.error('Error in error callback:', cbError);
            }
        });
    }

    /**
     * Log a warning with consistent formatting
     * @param {string} message - Warning message
     * @param {string} context - Context where warning occurred
     * @param {Object} metadata - Additional metadata
     */
    logWarning(message, context = 'unknown', metadata = {}) {
        const prefix = '⚠️';
        console.warn(`${prefix} [${context}]:`, message);

        if (this.DEBUG && Object.keys(metadata).length > 0) {
            console.warn('Metadata:', metadata);
        }

        window.dispatchEvent(new CustomEvent('app-warning', {
            detail: {
                timestamp: new Date().toISOString(),
                context,
                message,
                metadata
            }
        }));
    }

    /**
     * Log info message (only in debug mode)
     * @param {string} message - Info message
     * @param {string} context - Context
     * @param {Object} metadata - Additional metadata
     */
    logInfo(message, context = 'unknown', metadata = {}) {
        if (!this.DEBUG) return;

        console.log(`ℹ️ [${context}]:`, message);

        if (Object.keys(metadata).length > 0) {
            console.log('Metadata:', metadata);
        }
    }

    /**
     * Handle async operation with consistent error handling
     * @param {Function} operation - Async operation to execute
     * @param {string} context - Context for error reporting
     * @param {Object} options - Options for error handling
     * @returns {Promise<{success: boolean, data?: any, error?: Error}>}
     */
    async handleAsync(operation, context = 'async-operation', options = {}) {
        const {
            fallbackValue = null,
            retries = 0,
            retryDelay = 1000,
            onError = null,
            metadata = {}
        } = options;

        let lastError = null;

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const result = await operation();
                return { success: true, data: result };
            } catch (error) {
                lastError = error;

                if (attempt < retries) {
                    this.logWarning(`Operation failed, retrying (${attempt + 1}/${retries})...`, context, {
                        error: error.message,
                        attempt: attempt + 1,
                        ...metadata
                    });

                    // Wait before retry
                    await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
                }
            }
        }

        // All attempts failed
        this.logError(lastError, context, metadata);

        if (onError) {
            try {
                await onError(lastError);
            } catch (handlerError) {
                this.logError(handlerError, `${context}-error-handler`);
            }
        }

        return {
            success: false,
            error: lastError,
            data: fallbackValue
        };
    }

    /**
     * Wrap a function with error handling
     * @param {Function} fn - Function to wrap
     * @param {string} context - Context for error reporting
     * @returns {Function} Wrapped function
     */
    wrapWithErrorHandling(fn, context = 'wrapped-function') {
        return (...args) => {
            try {
                const result = fn(...args);

                // Handle async functions
                if (result && typeof result.then === 'function') {
                    return result.catch(error => {
                        this.logError(error, context);
                        throw error;
                    });
                }

                return result;
            } catch (error) {
                this.logError(error, context);
                throw error;
            }
        };
    }

    /**
     * Categorize error type
     * @param {Error} error - Error to categorize
     * @returns {string} Error category
     */
    categorizeError(error) {
        if (!error) return 'unknown';

        const message = (error.message || '').toLowerCase();
        const name = error.name || '';

        // Network errors
        if (message.includes('fetch') || message.includes('network') || name === 'NetworkError') {
            return 'network';
        }

        // Authentication errors
        if (message.includes('auth') || message.includes('permission') || message.includes('401') || message.includes('403')) {
            return 'auth';
        }

        // Y.js errors
        if (message.includes('y.js') || message.includes('ydoc') || message.includes('yjs')) {
            return 'yjs';
        }

        // WebSocket errors
        if (message.includes('websocket') || message.includes('socket')) {
            return 'websocket';
        }

        // State errors
        if (message.includes('state') || message.includes('transition')) {
            return 'state';
        }

        // Validation errors
        if (message.includes('invalid') || message.includes('validation') || name === 'ValidationError') {
            return 'validation';
        }

        return 'general';
    }

    /**
     * Get error prefix emoji based on type
     * @param {string} type - Error type
     * @returns {string} Emoji prefix
     */
    getErrorPrefix(type) {
        const prefixes = {
            network: '🌐❌',
            auth: '🔐❌',
            yjs: '📄❌',
            websocket: '🔌❌',
            state: '🔄❌',
            validation: '✅❌',
            general: '❌'
        };

        return prefixes[type] || prefixes.general;
    }

    /**
     * Register error callback
     * @param {Function} callback - Callback function
     * @returns {string} Callback ID for unregistering
     */
    onError(callback) {
        const id = `cb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.errorCallbacks.set(id, callback);

        return id;
    }

    /**
     * Unregister error callback
     * @param {string} id - Callback ID
     */
    offError(id) {
        this.errorCallbacks.delete(id);
    }

    /**
     * Get error statistics
     * @returns {Object} Error stats
     */
    getStats() {
        return {
            ...this.errorStats,
            recentErrors: this.errorLog.slice(0, 10)
        };
    }

    /**
     * Clear error log
     */
    clearLog() {
        this.errorLog = [];
        this.errorStats = {
            total: 0,
            byType: {},
            bySource: {}
        };
    }

    /**
     * Create standardized error response
     * @param {string} message - Error message
     * @param {string} code - Error code
     * @param {Object} details - Additional details
     * @returns {Error} Standardized error
     */
    createError(message, code = 'UNKNOWN_ERROR', details = {}) {
        const error = new Error(message);
        error.code = code;
        error.details = details;
        error.timestamp = new Date().toISOString();

        return error;
    }

    /**
     * Check if error is recoverable
     * @param {Error} error - Error to check
     * @returns {boolean} Whether error is recoverable
     */
    isRecoverable(error) {
        const type = this.categorizeError(error);

        // Network and auth errors are often recoverable
        if (type === 'network' || type === 'auth') {
            return true;
        }

        // Check specific error messages
        const message = error.message || '';
        const recoverablePatterns = [
            'timeout',
            'temporary',
            'retry',
            'disconnected',
            'offline'
        ];

        return recoverablePatterns.some(pattern =>
            message.toLowerCase().includes(pattern)
        );
    }
}

// Export singleton instance
export const errorHandler = new ErrorHandlerService();

// Also export class for testing
export default ErrorHandlerService;

// Make available globally for debugging
if (typeof window !== 'undefined') {
    window.errorHandler = errorHandler;
}
