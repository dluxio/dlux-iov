/**
 * Permission Check Mixin for DLUX
 *
 * Provides reusable permission checking methods and computed properties
 * that can be mixed into any Vue component that needs permission checks.
 *
 * Usage:
 * ```javascript
 * import PermissionCheckMixin from '/js/mixins/permission-check-mixin.js';
 *
 * export default {
 *     mixins: [PermissionCheckMixin],
 *     // Component can now use all permission methods and computed properties
 * }
 * ```
 */

export default {
    computed: {
        /**
         * Quick access to permission state from uiState
         */
        permissionState() {
            return this.uiState || {};
        },

        /**
         * Check if user can perform any modifications
         */
        canModify() {
            return this.permissionState.canEdit || false;
        },

        /**
         * Check if document is in view-only mode
         */
        isViewOnly() {
            return this.permissionState.isReadonly || this.permissionState.hasNoAccess || false;
        },

        /**
         * Check if user has full control
         */
        hasFullControl() {
            return this.permissionState.isOwner || false;
        },

        /**
         * Get human-readable permission level
         */
        permissionLabel() {
            const level = this.permissionState.permissionLevel;
            const labels = {
                'owner': 'Owner',
                'postable': 'Publisher',
                'editable': 'Editor',
                'readonly': 'Viewer',
                'no-access': 'No Access'
            };
            return labels[level] || 'Unknown';
        },

        /**
         * Get permission level color/class
         */
        permissionClass() {
            const level = this.permissionState.permissionLevel;
            const classes = {
                'owner': 'text-success',
                'postable': 'text-primary',
                'editable': 'text-info',
                'readonly': 'text-warning',
                'no-access': 'text-danger'
            };
            return classes[level] || 'text-muted';
        }
    },

    methods: {
        /**
         * Check if an action is allowed based on permission
         * @param {string} action - Action to check
         * @returns {boolean} True if allowed
         */
        isActionAllowed(action) {
            const actionPermissions = {
                'edit': () => this.permissionState.canEdit,
                'delete': () => this.permissionState.canDelete,
                'publish': () => this.permissionState.canPublish,
                'share': () => this.permissionState.canShare,
                'manage': () => this.permissionState.canManagePermissions,
                'view': () => this.permissionState.hasAccess
            };

            const checker = actionPermissions[action];
            return checker ? checker() : false;
        },

        /**
         * Perform action with permission check
         * @param {string} action - Action name
         * @param {Function} callback - Function to execute if permitted
         * @param {Object} options - Options for handling denial
         */
        withPermission(action, callback, options = {}) {
            if (!this.isActionAllowed(action)) {
                // Handle permission denied
                if (options.onDenied) {
                    return options.onDenied();
                }

                // Show error message
                if (options.showError !== false) {
                    const message = options.errorMessage || `You don't have permission to ${action} this document.`;
                    this.showAlert?.({
                        type: 'error',
                        title: 'Permission Denied',
                        message
                    });
                }

                return options.returnValue !== undefined ? options.returnValue : null;
            }

            // Execute callback
            return callback();
        },

        /**
         * Check if user needs to authenticate for an action
         * @param {string} action - Action to check
         * @returns {boolean} True if authentication needed
         */
        needsAuthForAction(action) {
            // If user is guest, they need auth for any action except view
            if (this.permissionState.isGuest && action !== 'view') {
                return true;
            }

            // If user has no access, they might need to switch accounts
            if (this.permissionState.hasNoAccess) {
                return true;
            }

            return false;
        },

        /**
         * Request authentication for an action
         * @param {string} action - Action that needs auth
         * @param {Object} options - Additional options
         */
        requestAuthForAction(action, options = {}) {
            if (!this.authBridge) return;

            const isGuest = this.permissionState.isGuest;
            const promptType = isGuest ? 'login' : 'switch_account';

            this.authBridge.showAuthPrompt(promptType, {
                name: this.currentFile?.name || 'document',
                reason: `To ${action} this document`,
                ...options
            });
        },

        /**
         * Execute action with automatic auth check
         * @param {string} action - Action name
         * @param {Function} callback - Function to execute
         * @param {Object} options - Options
         */
        async executeWithAuth(action, callback, options = {}) {
            // Check if auth needed
            if (this.needsAuthForAction(action)) {
                this.requestAuthForAction(action, options);
                return options.authReturnValue !== undefined ? options.authReturnValue : null;
            }

            // Use withPermission for the actual check
            return this.withPermission(action, callback, options);
        }
    }
};
