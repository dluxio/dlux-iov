/**
 * Permission Decorators for DLUX
 *
 * Provides method decorators that automatically check permissions before
 * executing methods. This reduces boilerplate permission checking code.
 *
 * Usage:
 * ```javascript
 * @requiresPermission('editable')
 * async saveDocument() {
 *     // Method only executes if user has editable permission
 * }
 *
 * @requiresOwner
 * async deleteDocument() {
 *     // Method only executes if user is owner
 * }
 * ```
 */

/**
 * Creates a permission decorator that checks if user has required permission level
 * @param {string} requiredLevel - Required permission level
 * @param {Object} options - Decorator options
 * @returns {Function} Decorator function
 */
export function requiresPermission(requiredLevel, options = {}) {
    return function(target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = async function(...args) {
            // Get current permission level
            const currentLevel = this.getUserPermissionLevel(this.currentFile);

            // Check if user has required permission
            let hasPermission = false;
            switch(requiredLevel) {
                case 'owner':
                    hasPermission = this.isOwnerPermission(currentLevel);
                    break;
                case 'postable':
                    hasPermission = this.canPublishWithPermission(currentLevel);
                    break;
                case 'editable':
                    hasPermission = this.canEditWithPermission(currentLevel);
                    break;
                case 'readonly':
                    hasPermission = this.hasAccess(currentLevel);
                    break;
                default:
                    hasPermission = false;
            }

            if (!hasPermission) {
                // Handle permission denied
                if (options.onDenied) {
                    return options.onDenied.call(this, currentLevel, requiredLevel);
                }

                // Default handling
                console.warn(`🚫 Permission denied: ${requiredLevel} required, but user has ${currentLevel}`);

                // Show error message if specified
                if (options.showError !== false) {
                    this.showAlert?.({
                        type: 'error',
                        title: 'Permission Denied',
                        message: options.errorMessage || `You need ${requiredLevel} permission to perform this action.`
                    });
                }

                // Return early or throw error based on options
                if (options.throwError) {
                    throw new Error(`Permission denied: ${requiredLevel} required`);
                }

                return options.returnValue !== undefined ? options.returnValue : null;
            }

            // Execute original method
            return originalMethod.apply(this, args);
        };

        return descriptor;
    };
}

/**
 * Decorator that requires owner permission
 */
export function requiresOwner(options = {}) {
    return requiresPermission('owner', {
        errorMessage: 'Only the document owner can perform this action.',
        ...options
    });
}

/**
 * Decorator that requires edit permission
 */
export function requiresEdit(options = {}) {
    return requiresPermission('editable', {
        errorMessage: 'You need edit permission to perform this action.',
        ...options
    });
}

/**
 * Decorator that requires publish permission
 */
export function requiresPublish(options = {}) {
    return requiresPermission('postable', {
        errorMessage: 'You need publish permission to perform this action.',
        ...options
    });
}

/**
 * Decorator that requires any access (not no-access)
 */
export function requiresAccess(options = {}) {
    return requiresPermission('readonly', {
        errorMessage: 'You do not have access to this document.',
        ...options
    });
}

/**
 * Creates a decorator that checks multiple permission conditions
 * @param {Function} condition - Function that returns true if permission granted
 * @param {Object} options - Decorator options
 */
export function requiresCondition(condition, options = {}) {
    return function(target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = async function(...args) {
            // Evaluate condition
            const hasPermission = condition.call(this);

            if (!hasPermission) {
                // Handle permission denied
                if (options.onDenied) {
                    return options.onDenied.call(this);
                }

                console.warn(`🚫 Permission condition not met for ${propertyKey}`);

                if (options.showError !== false) {
                    this.showAlert?.({
                        type: 'error',
                        title: 'Permission Denied',
                        message: options.errorMessage || 'You do not have permission to perform this action.'
                    });
                }

                if (options.throwError) {
                    throw new Error('Permission condition not met');
                }

                return options.returnValue !== undefined ? options.returnValue : null;
            }

            return originalMethod.apply(this, args);
        };

        return descriptor;
    };
}

/**
 * Decorator that requires user to be authenticated (not guest)
 */
export function requiresAuth(options = {}) {
    return requiresCondition(
        function() { return this.isAuthenticated && !this.isGuestUser(); },
        {
            errorMessage: 'You must be logged in to perform this action.',
            onDenied() {
                // Trigger login flow
                if (this.authBridge) {
                    this.authBridge.showAuthPrompt('login', {
                        name: this.currentFile?.name || 'document'
                    });
                }
            },
            ...options
        }
    );
}

/**
 * Decorator that logs permission checks (for debugging)
 */
export function logPermission(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args) {
        const permission = this.getUserPermissionLevel(this.currentFile);
        console.log(`🔐 Permission check for ${propertyKey}: ${permission}`);

        const result = await originalMethod.apply(this, args);

        console.log(`✅ ${propertyKey} completed with permission: ${permission}`);
        return result;
    };

    return descriptor;
}
