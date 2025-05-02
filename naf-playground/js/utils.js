/**
 * Utils.js - Utility functions
 */

import { parseVector, vectorToString } from './entity-utils.js';
import { 
    VECTOR_ATTRIBUTES,
    COMPONENT_BASED_TYPES,
    VECTOR_DEFAULTS,
    GEOMETRY_DEFAULTS,
    LIGHT_DEFAULTS,
    UI_CONFIG
} from './config.js';

/**
 * Generate a unique ID
 * @deprecated Use generateEntityId instead for entity IDs
 * @param {string} prefix - Optional prefix for the ID
 * @returns {string} - Unique ID
 */
export function generateUniqueId(prefix = 'entity') {
    console.warn('generateUniqueId is deprecated. Use generateEntityId instead');
    return generateEntityId(prefix);
}

/**
 * Convert a position object to a string
 * @deprecated Use vectorToString from entity-utils.js instead
 * @param {Object} position - Position object with x, y, z properties
 * @returns {string} - Position string in the format "x y z"
 */
export function positionToString(position) {
    console.warn('positionToString is deprecated. Use vectorToString from entity-utils.js instead');
    return vectorToString(position);
}

/**
 * Convert a position string to an object
 * @deprecated Use parseVector from entity-utils.js instead
 * @param {string|Object} positionString - Position string in the format "x y z" or position object
 * @returns {Object} - Position object with x, y, z properties
 */
export function stringToPosition(positionString) {
    console.warn('stringToPosition is deprecated. Use parseVector from entity-utils.js instead');
    return parseVector(positionString);
}

/**
 * Show a notification to the user
 * @param {string} message - Message to display
 * @param {Object} options - Notification options
 * @param {string} [options.type='success'] - Notification type (success, error, warning)
 * @param {number} [options.duration=3000] - Duration in milliseconds to show the notification
 * @param {boolean} [options.showCloseButton=false] - Whether to show a close button
 * @param {string} [options.icon] - Optional icon to display (emoji or icon class)
 */
export function showNotification(message, options = {}) {
    const {
        type = 'success',
        duration = UI_CONFIG.NOTIFICATION_DURATION,
        showCloseButton = false,
        icon = null
    } = options;

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Build notification content
    let content = '';
    if (icon) {
        content += `<div class="notification-icon">${icon}</div>`;
    }
    content += `<div class="notification-message">${message}</div>`;
    if (showCloseButton) {
        content += '<div class="notification-close">&times;</div>';
    }
    
    notification.innerHTML = `
        <div class="notification-content">
            ${content}
        </div>
    `;
    
    // Append to body
    document.body.appendChild(notification);
    
    // Add close button handler if enabled
    if (showCloseButton) {
        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                notification.classList.remove('visible');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            });
        }
    }
    
    // Show with animation
    setTimeout(() => {
        notification.classList.add('visible');
    }, 10);
    
    // Hide after duration
    setTimeout(() => {
        notification.classList.remove('visible');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, duration);
}

/**
 * @deprecated Use showNotification with options instead
 */
export function showWarning(message, duration = 5000) {
    logDeprecationWarning('showWarning', 'showNotification', 'utils.js');
    showNotification(message, {
        type: 'warning',
        duration,
        icon: '⚠️',
        showCloseButton: true
    });
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
 * Check if an object is empty
 * @param {Object} obj - Object to check
 * @returns {boolean} - True if empty
 */
export function isEmptyObject(obj) {
    return Object.keys(obj).length === 0;
}

// Reset entity type counters when the page loads
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        window.entityTypeCounters = {};
    });
}

/**
 * Generate a consistent entity ID/UUID based on type
 * @param {string} [type] - Entity type (box, sphere, etc.)
 * @param {Object} [options] - Additional options
 * @param {boolean} [options.preserveUserIds=true] - Whether to preserve user-provided IDs
 * @param {string} [options.userId] - User-provided ID to preserve
 * @returns {string} Generated entity ID in format 'type-entity-N'
 */
export function generateEntityId(type, options = {}) {
    const { preserveUserIds = true, userId = null } = options;
    
    // If user provided an ID and we should preserve it, use that
    if (preserveUserIds && userId) {
        return userId;
    }
    
    // If we have a type, use the type-entity-N pattern
    if (type) {
        // Use a static counter for each type to ensure sequential IDs
        if (!window.entityTypeCounters) {
            window.entityTypeCounters = {};
        }
        
        // Initialize counter for this type if it doesn't exist
        if (window.entityTypeCounters[type] === undefined) {
            window.entityTypeCounters[type] = 0;
        }
        
        // Increment counter and use it for the ID
        window.entityTypeCounters[type]++;
        return `${type}-entity-${window.entityTypeCounters[type]}`;
    }
    
    // If no type is provided, fall back to a short timestamp-based ID
    return `entity-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
}

/**
 * Log a deprecation warning for a function, suggesting the unified API equivalent
 * @param {string} oldFunction - The legacy function name that is deprecated
 * @param {string} newFunction - The new unified API function to use instead
 * @param {string} [module='entity-api.js'] - The module containing the new function
 */
export function logDeprecationWarning(oldFunction, newFunction, module = 'entity-api.js') {
  console.warn(
    `%c${oldFunction} is deprecated!%c\n` +
    `Please use %c${newFunction}%c from %c${module}%c instead.\n` +
    `This will ensure all entity operations go through the centralized watcher.`,
    'color: red; font-weight: bold;', 'color: inherit;',
    'color: green; font-weight: bold;', 'color: inherit;',
    'color: blue; font-style: italic;', 'color: inherit;'
  );
}

/**
 * Standard error types for the application
 */
export const ErrorTypes = {
  STATE: 'STATE_ERROR',
  NETWORK: 'NETWORK_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  ENTITY: 'ENTITY_ERROR',
  SYSTEM: 'SYSTEM_ERROR'
};

/**
 * Custom error class for application-specific errors
 */
export class AppError extends Error {
  constructor(type, message, details = {}) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Standardized error handling function
 * @param {Error|AppError} error - The error to handle
 * @param {string} context - Context where the error occurred
 */
export function handleError(error, context) {
  const errorMessage = error instanceof AppError 
    ? `[${error.type}] ${error.message}`
    : `[${ErrorTypes.SYSTEM}] ${error.message}`;
    
  logAction(`${context}: ${errorMessage}`, 'error');
  
  // Show user notification for non-system errors
  if (!(error instanceof AppError) || error.type !== ErrorTypes.SYSTEM) {
    showNotification(errorMessage, 'error');
  }
}

/**
 * Base class for event management
 * Provides standardized event handling and cleanup
 */
export class EventManager {
  constructor() {
    this.listeners = new Map();
    this.boundHandlers = new Map();
  }

  /**
   * Add an event listener with automatic cleanup
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   * @param {Object} [options] - Event options
   */
  addEventListener(event, handler, options = {}) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    // Bind the handler to this instance if it's a method
    const boundHandler = handler.bind(this);
    this.boundHandlers.set(handler, boundHandler);
    
    this.listeners.get(event).add(boundHandler);
    window.addEventListener(event, boundHandler, options);
  }

  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   */
  removeEventListener(event, handler) {
    const boundHandler = this.boundHandlers.get(handler);
    if (boundHandler) {
      window.removeEventListener(event, boundHandler);
      this.boundHandlers.delete(handler);
    }
    
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(boundHandler);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners() {
    for (const [event, handlers] of this.listeners.entries()) {
      for (const handler of handlers) {
        window.removeEventListener(event, handler);
      }
      this.listeners.delete(event);
    }
    this.boundHandlers.clear();
  }
  
  /**
   * Emit a custom event
   * @param {string} eventName - Name of the event to emit
   * @param {Object} [detail={}] - Event detail data
   * @param {boolean} [bubbles=true] - Whether the event bubbles
   * @param {boolean} [cancelable=true] - Whether the event is cancelable
   * @returns {boolean} - Whether the event was not canceled
   */
  emit(eventName, detail = {}, bubbles = true, cancelable = true) {
    console.log(`[EventManager] Emitting event: ${eventName}`, detail);
    
    const event = new CustomEvent(eventName, {
      detail,
      bubbles,
      cancelable
    });
    
    return document.dispatchEvent(event);
  }
} 