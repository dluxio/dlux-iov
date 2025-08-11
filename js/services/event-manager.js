/**
 * Centralized Event Manager Service
 *
 * Provides automatic event listener management with lifecycle-based cleanup
 * to prevent memory leaks and simplify event handling across the application.
 *
 * Features:
 * - Automatic registration and tracking of all event listeners
 * - Integration with Vue component lifecycle (beforeUnmount)
 * - Prevention of duplicate listeners
 * - Support for multiple event types (DOM, custom, auth bridge, etc.)
 * - Centralized debugging and logging
 *
 * Usage:
 * ```javascript
 * import EventManager from '/js/services/event-manager.js';
 *
 * // In Vue component
 * const eventManager = new EventManager(this);
 *
 * // Register listeners - they'll be automatically cleaned up
 * eventManager.addDOMListener(window, 'message', this.handleMessage);
 * eventManager.addCustomListener(authBridge, 'userChanged', this.handleUserChange);
 * ```
 */

const DEBUG = false;

class EventManager {
    constructor(component = null) {
        this.component = component;
        this.listeners = new Map(); // Track all registered listeners
        this.isDestroyed = false;

        // Auto-integrate with Vue lifecycle if component provided
        if (component && typeof component.$once === 'function') {
            component.$once('hook:beforeUnmount', () => {
                this.destroy();
            });
        }

        if (DEBUG) console.log('🎧 EventManager initialized', {
            hasComponent: !!component,
            autoCleanup: !!component
        });
    }

    /**
     * Add DOM event listener with automatic cleanup
     * @param {EventTarget} target - DOM element or window/document
     * @param {string} event - Event name
     * @param {Function} handler - Event handler function
     * @param {boolean|object} options - Event listener options
     * @returns {Function} Unsubscribe function
     */
    addDOMListener(target, event, handler, options = false) {
        if (this.isDestroyed) {
            console.warn('⚠️ EventManager: Cannot add listener - manager is destroyed');
            return () => {};
        }

        const listenerId = this.generateListenerId('dom', target, event);

        // Check for duplicate
        if (this.listeners.has(listenerId)) {
            console.warn('⚠️ EventManager: Duplicate DOM listener detected', {
                target: target.constructor.name,
                event,
                existing: this.listeners.get(listenerId)
            });
            return this.listeners.get(listenerId).unsubscribe;
        }

        // Add the listener
        target.addEventListener(event, handler, options);

        // Store cleanup info
        const listenerInfo = {
            type: 'dom',
            target,
            event,
            handler,
            options,
            timestamp: Date.now(),
            unsubscribe: () => {
                target.removeEventListener(event, handler, options);
                this.listeners.delete(listenerId);
                if (DEBUG) console.log('🎧 EventManager: DOM listener removed', { event, target: target.constructor.name });
            }
        };

        this.listeners.set(listenerId, listenerInfo);

        if (DEBUG) console.log('🎧 EventManager: DOM listener added', {
            event,
            target: target.constructor.name,
            total: this.listeners.size
        });

        return listenerInfo.unsubscribe;
    }

    /**
     * Add custom event listener (for auth bridge, Y.js, etc.)
     * @param {object} emitter - Event emitter object with .on() and .off() methods
     * @param {string} event - Event name
     * @param {Function} handler - Event handler function
     * @returns {Function} Unsubscribe function
     */
    addCustomListener(emitter, event, handler) {
        if (this.isDestroyed) {
            console.warn('⚠️ EventManager: Cannot add listener - manager is destroyed');
            return () => {};
        }

        const listenerId = this.generateListenerId('custom', emitter, event);

        // Check for duplicate
        if (this.listeners.has(listenerId)) {
            console.warn('⚠️ EventManager: Duplicate custom listener detected', {
                emitter: emitter.constructor?.name || 'unknown',
                event,
                existing: this.listeners.get(listenerId)
            });
            return this.listeners.get(listenerId).unsubscribe;
        }

        // Add the listener
        if (typeof emitter.on === 'function') {
            emitter.on(event, handler);
        } else if (typeof emitter.addEventListener === 'function') {
            emitter.addEventListener(event, handler);
        } else {
            console.error('❌ EventManager: Emitter does not support .on() or .addEventListener()', emitter);
            return () => {};
        }

        // Store cleanup info
        const listenerInfo = {
            type: 'custom',
            emitter,
            event,
            handler,
            timestamp: Date.now(),
            unsubscribe: () => {
                if (typeof emitter.off === 'function') {
                    emitter.off(event, handler);
                } else if (typeof emitter.removeEventListener === 'function') {
                    emitter.removeEventListener(event, handler);
                }
                this.listeners.delete(listenerId);
                if (DEBUG) console.log('🎧 EventManager: Custom listener removed', {
                    event,
                    emitter: emitter.constructor?.name || 'unknown'
                });
            }
        };

        this.listeners.set(listenerId, listenerInfo);

        if (DEBUG) console.log('🎧 EventManager: Custom listener added', {
            event,
            emitter: emitter.constructor?.name || 'unknown',
            total: this.listeners.size
        });

        return listenerInfo.unsubscribe;
    }

    /**
     * Add timeout with automatic cleanup
     * @param {Function} callback - Function to call after delay
     * @param {number} delay - Delay in milliseconds
     * @returns {Function} Clear function
     */
    addTimeout(callback, delay) {
        if (this.isDestroyed) {
            console.warn('⚠️ EventManager: Cannot add timeout - manager is destroyed');
            return () => {};
        }

        const timeoutId = setTimeout(callback, delay);
        const listenerId = `timeout_${timeoutId}_${Date.now()}`;

        const listenerInfo = {
            type: 'timeout',
            timeoutId,
            callback,
            delay,
            timestamp: Date.now(),
            unsubscribe: () => {
                clearTimeout(timeoutId);
                this.listeners.delete(listenerId);
                if (DEBUG) console.log('🎧 EventManager: Timeout cleared', { delay });
            }
        };

        this.listeners.set(listenerId, listenerInfo);

        if (DEBUG) console.log('🎧 EventManager: Timeout added', {
            delay,
            total: this.listeners.size
        });

        return listenerInfo.unsubscribe;
    }

    /**
     * Add interval with automatic cleanup
     * @param {Function} callback - Function to call repeatedly
     * @param {number} interval - Interval in milliseconds
     * @returns {Function} Clear function
     */
    addInterval(callback, interval) {
        if (this.isDestroyed) {
            console.warn('⚠️ EventManager: Cannot add interval - manager is destroyed');
            return () => {};
        }

        const intervalId = setInterval(callback, interval);
        const listenerId = `interval_${intervalId}_${Date.now()}`;

        const listenerInfo = {
            type: 'interval',
            intervalId,
            callback,
            interval,
            timestamp: Date.now(),
            unsubscribe: () => {
                clearInterval(intervalId);
                this.listeners.delete(listenerId);
                if (DEBUG) console.log('🎧 EventManager: Interval cleared', { interval });
            }
        };

        this.listeners.set(listenerId, listenerInfo);

        if (DEBUG) console.log('🎧 EventManager: Interval added', {
            interval,
            total: this.listeners.size
        });

        return listenerInfo.unsubscribe;
    }

    /**
     * Remove specific listener by ID
     * @param {string} listenerId - Listener ID to remove
     */
    removeListener(listenerId) {
        const listener = this.listeners.get(listenerId);
        if (listener) {
            listener.unsubscribe();
        }
    }

    /**
     * Get debug information about all active listeners
     * @returns {object} Debug information
     */
    getDebugInfo() {
        const stats = {
            total: this.listeners.size,
            byType: {},
            listeners: []
        };

        for (const [id, listener] of this.listeners) {
            const type = listener.type;
            stats.byType[type] = (stats.byType[type] || 0) + 1;

            stats.listeners.push({
                id,
                type,
                event: listener.event,
                target: listener.target?.constructor?.name || listener.emitter?.constructor?.name || 'unknown',
                age: Date.now() - listener.timestamp
            });
        }

        return stats;
    }

    /**
     * Generate unique listener ID
     * @private
     */
    generateListenerId(type, target, event) {
        const targetId = target.constructor?.name || target.toString().slice(0, 20) || 'unknown';
        return `${type}_${targetId}_${event}_${Date.now()}`;
    }

    /**
     * Clean up all listeners and destroy the manager
     */
    destroy() {
        if (this.isDestroyed) return;

        if (DEBUG) console.log('🎧 EventManager: Destroying - cleaning up all listeners', {
            total: this.listeners.size,
            byType: this.getDebugInfo().byType
        });

        // Clean up all listeners
        for (const listener of this.listeners.values()) {
            try {
                listener.unsubscribe();
            } catch (error) {
                console.error('❌ EventManager: Error cleaning up listener:', error, listener);
            }
        }

        this.listeners.clear();
        this.isDestroyed = true;
        this.component = null;

        if (DEBUG) console.log('🎧 EventManager: Destroyed successfully');
    }
}

export default EventManager;
