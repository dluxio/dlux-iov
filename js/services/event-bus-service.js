/**
 * Global Event Bus Service
 *
 * Provides a centralized event bus for cross-component communication
 * without violating Rule #10 (Immutable External State).
 *
 * This replaces direct window.editorEventBus manipulation.
 *
 * @follows Rule #3: Single Source of Truth - One event bus for global events
 * @follows Rule #10: Immutable External State - No window object modification
 */

class EventBusService {
    constructor() {
        this.eventBus = new EventTarget();
        this.DEBUG = false;
    }

    /**
     * Dispatch a custom event
     * @param {string} eventName - Name of the event
     * @param {any} detail - Event detail data
     */
    dispatch(eventName, detail = {}) {
        if (this.DEBUG) {
            console.log(`📢 EventBus: Dispatching ${eventName}`, detail);
        }

        this.eventBus.dispatchEvent(new CustomEvent(eventName, { detail }));
    }

    /**
     * Add event listener
     * @param {string} eventName - Name of the event
     * @param {Function} handler - Event handler
     */
    addEventListener(eventName, handler) {
        this.eventBus.addEventListener(eventName, handler);
    }

    /**
     * Remove event listener
     * @param {string} eventName - Name of the event
     * @param {Function} handler - Event handler
     */
    removeEventListener(eventName, handler) {
        this.eventBus.removeEventListener(eventName, handler);
    }

    /**
     * Get the raw EventTarget (for compatibility)
     * @returns {EventTarget}
     */
    getEventTarget() {
        return this.eventBus;
    }
}

// Create singleton instance
export const eventBusService = new EventBusService();

// For backward compatibility, expose on window but log deprecation warning
if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'editorEventBus', {
        get() {
            console.warn('⚠️ Direct access to window.editorEventBus is deprecated. Use eventBusService instead.');
            return eventBusService.getEventTarget();
        },
        configurable: true
    });
}

export default EventBusService;
