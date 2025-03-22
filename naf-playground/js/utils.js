/**
 * Utils.js - Utility functions
 */

/**
 * Generate a unique ID
 * @param {string} prefix - Optional prefix for the ID
 * @returns {string} - Unique ID
 */
export function generateUniqueId(prefix = 'entity') {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    return `${prefix}-${timestamp}-${random}`;
}

/**
 * Convert a position object to a string
 * @param {Object} position - Position object with x, y, z properties
 * @returns {string} - Position string in the format "x y z"
 */
export function positionToString(position) {
    if (!position) return '0 0 0';
    const x = position.x || 0;
    const y = position.y || 0;
    const z = position.z || 0;
    return `${x} ${y} ${z}`;
}

/**
 * Convert a position string to an object
 * @param {string} positionString - Position string in the format "x y z"
 * @returns {Object} - Position object with x, y, z properties
 */
export function stringToPosition(positionString) {
    if (!positionString) return { x: 0, y: 0, z: 0 };
    
    const [x, y, z] = positionString.split(' ').map(parseFloat);
    return {
        x: isNaN(x) ? 0 : x,
        y: isNaN(y) ? 0 : y,
        z: isNaN(z) ? 0 : z
    };
}

/**
 * Show a notification to the user
 * @param {string} message - Message to display
 * @param {string} type - Notification type (success, error, warning)
 * @param {number} duration - Duration in milliseconds to show the notification
 */
export function showNotification(message, type = 'success', duration = 3000) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Append to body
    document.body.appendChild(notification);
    
    // Show with animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Hide after duration
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, duration);
}

/**
 * Show a warning notification to the user
 * @param {string} message - Warning message to display
 * @param {number} [duration=5000] - How long to show the warning in ms
 */
export function showWarning(message, duration = 5000) {
    console.warn('WARNING:', message);
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification warning';
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-icon">⚠️</div>
            <div class="notification-message">${message}</div>
        </div>
        <div class="notification-close">&times;</div>
    `;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Add close button handler
    const closeBtn = notification.querySelector('.notification-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(notification);
        });
    }
    
    // Show notification with animation
    setTimeout(() => {
        notification.classList.add('visible');
    }, 10);
    
    // Auto-hide after duration
    setTimeout(() => {
        notification.classList.remove('visible');
        
        // Remove from DOM after animation completes
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 500);
    }, duration);
}

/**
 * Get URL parameters as an object
 * @returns {Object} - URL parameters
 */
export function getUrlParams() {
    const params = {};
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    
    for (const [key, value] of urlParams.entries()) {
        params[key] = value;
    }
    
    return params;
}

/**
 * Log an action for debugging
 * @param {string} action - Action description
 * @param {string} level - Log level (log, warn, error)
 */
export function logAction(action, level = 'log') {
    const timestamp = new Date().toISOString();
    const message = `[${timestamp}] ${action}`;
    
    switch(level) {
        case 'warn':
            console.warn(message);
            break;
        case 'error':
            console.error(message);
            break;
        default:
            console.log(message);
    }
    
    // Could also send to a server logging endpoint if needed
}

/**
 * Wait for dependencies to be ready
 * @param {Function[]} checks - Array of functions that return true when dependency is ready
 * @param {string} dependencyName - Name of the dependency for logging
 * @param {number} timeout - Maximum time to wait in milliseconds
 * @param {number} interval - Check interval in milliseconds
 * @returns {Promise} - Resolves when all dependencies are ready
 */
export function waitForDependencies(checks, dependencyName = 'dependencies', timeout = 10000, interval = 100) {
    console.log(`Waiting for ${dependencyName} to be ready...`);
    
    return new Promise((resolve, reject) => {
        // Track start time
        const startTime = Date.now();
        
        // Function to check all dependencies
        const checkDependencies = () => {
            // Check if we've exceeded the timeout
            if (Date.now() - startTime > timeout) {
                console.error(`Timed out waiting for ${dependencyName} after ${timeout}ms`);
                reject(new Error(`Timed out waiting for ${dependencyName}`));
                return;
            }
            
            // Check all dependency functions
            const allReady = checks.every(check => {
                try {
                    return check();
                } catch (error) {
                    console.warn(`Error checking dependency: ${error.message}`);
                    return false;
                }
            });
            
            if (allReady) {
                console.log(`${dependencyName} ready after ${Date.now() - startTime}ms`);
                resolve();
            } else {
                // Check again after interval
                setTimeout(checkDependencies, interval);
            }
        };
        
        // Start checking
        checkDependencies();
    });
}

/**
 * Debounce a function to limit how often it can be called
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait between calls
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait = 300) {
    let timeout;
    
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle a function
 * @param {Function} func - Function to throttle
 * @param {number} limit - Limit in milliseconds
 * @returns {Function} - Throttled function
 */
export function throttle(func, limit) {
    let inThrottle;
    
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            
            setTimeout(() => {
                inThrottle = false;
            }, limit);
        }
    };
}

/**
 * Deep clone an object
 * @param {Object} obj - Object to clone
 * @returns {Object} - Cloned object
 */
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Format a vector object as a string
 * @param {Object} vector - Vector object with x, y, z properties
 * @returns {string} - Formatted string
 */
export function formatVector(vector) {
    return `${vector.x.toFixed(2)} ${vector.y.toFixed(2)} ${vector.z.toFixed(2)}`;
}

/**
 * Parse a vector string into an object
 * @param {string} vectorStr - Vector string like "1 2 3"
 * @returns {Object} - Vector object with x, y, z properties
 */
export function parseVector(vectorStr) {
    const [x, y, z] = vectorStr.split(' ').map(parseFloat);
    return { x, y, z };
}

/**
 * Check if an object is empty
 * @param {Object} obj - Object to check
 * @returns {boolean} - True if empty
 */
export function isEmptyObject(obj) {
    return Object.keys(obj).length === 0;
} 