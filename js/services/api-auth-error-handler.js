/**
 * API Authentication Error Handler Service
 * Centralizes handling of 401/403 responses across the application
 * Layer 2 Service - Can use Layer 1 utilities and other Layer 2 services
 */

import { authStateManager } from './auth-state-manager.js';

class ApiAuthErrorHandler {
    constructor() {
        this.retryAttempts = new Map(); // Track retry attempts per endpoint
        this.maxRetries = 1;
        this.isHandlingError = false;
    }

    /**
     * Handle API authentication errors (401/403)
     * @param {number} status - HTTP status code
     * @param {string} endpoint - API endpoint that failed
     * @param {Function} retryCallback - Function to retry the request
     * @param {Object} options - Additional options
     * @returns {Promise} - Result of retry or error handling
     */
    async handleAuthError(status, endpoint, retryCallback = null, options = {}) {
        // Prevent recursive error handling
        if (this.isHandlingError) {
            console.warn('[ApiAuthErrorHandler] Preventing recursive error handling');
            return { success: false, error: 'Recursive error handling prevented' };
        }

        this.isHandlingError = true;
        try {
            if (status === 401) {
                return await this.handle401(endpoint, retryCallback, options);
            } else if (status === 403) {
                return await this.handle403(endpoint, options);
            } else {
                return { success: false, error: `Unexpected status: ${status}` };
            }
        } finally {
            this.isHandlingError = false;
        }
    }

    /**
     * Handle 401 Unauthorized errors
     */
    async handle401(endpoint, retryCallback, options) {
        console.warn(`[ApiAuthErrorHandler] 401 Unauthorized for ${endpoint}`);

        // Check if auth is expired
        if (authStateManager.isAuthExpired()) {
            console.log('[ApiAuthErrorHandler] Auth headers expired, clearing auth state');
            authStateManager.clearAuthState();

            // Emit event for UI to handle (show login modal, etc)
            authStateManager.emit('authRequired', {
                reason: 'expired',
                endpoint,
                message: 'Your session has expired. Please log in again.'
            });

            return {
                success: false,
                error: 'Authentication expired',
                requiresAuth: true
            };
        }

        // Check retry attempts
        const attempts = this.retryAttempts.get(endpoint) || 0;
        if (attempts >= this.maxRetries || !retryCallback) {
            this.retryAttempts.delete(endpoint);

            // Emit event for UI handling
            authStateManager.emit('authRequired', {
                reason: 'unauthorized',
                endpoint,
                message: 'Authentication required. Please log in.'
            });

            return {
                success: false,
                error: 'Authentication required',
                requiresAuth: true
            };
        }

        // Attempt retry with fresh auth headers
        console.log(`[ApiAuthErrorHandler] Retrying ${endpoint} (attempt ${attempts + 1}/${this.maxRetries})`);
        this.retryAttempts.set(endpoint, attempts + 1);

        try {
            // Request fresh auth headers
            authStateManager.emit('requestAuthHeaders');

            // Small delay to allow auth header refresh
            await new Promise(resolve => setTimeout(resolve, 100));

            // Retry the request
            const result = await retryCallback();

            // Success - clear retry counter
            this.retryAttempts.delete(endpoint);
            return { success: true, data: result };

        } catch (retryError) {
            this.retryAttempts.delete(endpoint);
            return {
                success: false,
                error: 'Retry failed',
                originalError: retryError
            };
        }
    }

    /**
     * Handle 403 Forbidden errors
     */
    async handle403(endpoint, options) {
        console.warn(`[ApiAuthErrorHandler] 403 Forbidden for ${endpoint}`);

        const context = options.context || {};
        const isOwnerAction = options.isOwnerAction || false;

        // Emit event for UI handling
        authStateManager.emit('permissionDenied', {
            endpoint,
            context,
            message: isOwnerAction
                ? 'This action requires owner permissions.'
                : 'You do not have permission to perform this action.'
        });

        return {
            success: false,
            error: 'Permission denied',
            isPermissionError: true,
            requiresOwner: isOwnerAction
        };
    }

    /**
     * Check if an error response is an auth error
     */
    isAuthError(status) {
        return status === 401 || status === 403;
    }

    /**
     * Clear retry attempts for an endpoint
     */
    clearRetries(endpoint) {
        this.retryAttempts.delete(endpoint);
    }

    /**
     * Clear all retry attempts
     */
    clearAllRetries() {
        this.retryAttempts.clear();
    }

    /**
     * Get standardized error message
     */
    getErrorMessage(status, context = {}) {
        switch (status) {
            case 401:
                if (authStateManager.isAuthExpired()) {
                    return 'Your session has expired. Please log in again.';
                }
                return 'Authentication required. Please log in.';
            case 403:
                if (context.isOwnerAction) {
                    return 'Only the document owner can perform this action.';
                }
                return 'You do not have permission to perform this action.';
            default:
                return `Unexpected error (status: ${status})`;
        }
    }
}

// Export singleton instance
export const apiAuthErrorHandler = new ApiAuthErrorHandler();

// Also export class for testing
export { ApiAuthErrorHandler };
