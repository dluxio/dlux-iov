/**
 * Debug Service
 *
 * Provides debug commands and utilities for development
 * without violating Rule #10 (Immutable External State).
 *
 * This replaces direct window.dluxDebug assignment.
 *
 * @follows Rule #3: Single Source of Truth - One place for debug utilities
 * @follows Rule #10: Immutable External State - No window object modification
 */

class DebugService {
    constructor() {
        this.commands = {};
        this.enabled = false;
    }

    /**
     * Register debug commands
     * @param {Object} commands - Object with debug command functions
     */
    registerCommands(commands) {
        this.commands = { ...this.commands, ...commands };
    }

    /**
     * Execute a debug command
     * @param {string} command - Command name
     * @param {...any} args - Command arguments
     * @returns {any}
     */
    execute(command, ...args) {
        if (!this.commands[command]) {
            console.error(`Debug command '${command}' not found`);
            return;
        }
        return this.commands[command](...args);
    }

    /**
     * Get all available commands
     * @returns {string[]}
     */
    getCommands() {
        return Object.keys(this.commands);
    }

    /**
     * Enable/disable debug mode
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }
}

// Create singleton instance
export const debugService = new DebugService();

// For backward compatibility, expose on window.dluxDebug
if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'dluxDebug', {
        get() {
            // Return a proxy that forwards to registered commands
            return new Proxy({}, {
                get(target, prop) {
                    if (prop === 'commands') {
                        return debugService.getCommands();
                    }
                    if (debugService.commands[prop]) {
                        return debugService.commands[prop];
                    }
                    return undefined;
                }
            });
        },
        set(value) {
            console.warn('⚠️ Direct assignment to window.dluxDebug is deprecated. Use debugService.registerCommands() instead.');
            if (typeof value === 'object') {
                debugService.registerCommands(value);
            }
        },
        configurable: true
    });
}

export default DebugService;
