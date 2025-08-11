/**
 * Methods Common Service
 *
 * Provides access to common methods for video nodeViews
 * without violating Rule #10 (Immutable External State).
 *
 * This replaces direct window.methodsCommon assignment.
 *
 * @follows Rule #3: Single Source of Truth - One place for common methods
 * @follows Rule #10: Immutable External State - No window object modification
 */

let methodsCommonInstance = null;

class MethodsCommonService {
    constructor() {
        this.methods = null;
    }

    /**
     * Set the methods common instance
     * @param {Object} methods - The methodsCommon object
     */
    setMethods(methods) {
        this.methods = methods;
    }

    /**
     * Get the methods common instance
     * @returns {Object|null}
     */
    getMethods() {
        return this.methods;
    }

    /**
     * Check if methods are available
     * @returns {boolean}
     */
    isAvailable() {
        return this.methods !== null;
    }
}

// Create singleton instance
export const methodsCommonService = new MethodsCommonService();

// For backward compatibility with video nodeViews that expect window.methodsCommon
if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'methodsCommon', {
        get() {
            if (!methodsCommonService.getMethods()) {
                console.warn('⚠️ methodsCommon accessed before initialization');
            }
            return methodsCommonService.getMethods();
        },
        set(value) {
            console.warn('⚠️ Direct assignment to window.methodsCommon is deprecated. Use methodsCommonService.setMethods() instead.');
            methodsCommonService.setMethods(value);
        },
        configurable: true
    });
}

export default MethodsCommonService;
