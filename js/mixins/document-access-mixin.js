/**
 * Document Access Mixin for DLUX
 *
 * Provides document-specific permission checking methods for components
 * that work with documents. Includes checks for document types, ownership,
 * and access patterns.
 *
 * Usage:
 * ```javascript
 * import DocumentAccessMixin from '/js/mixins/document-access-mixin.js';
 *
 * export default {
 *     mixins: [DocumentAccessMixin],
 *     // Component now has document access checking methods
 * }
 * ```
 */

export default {
    computed: {
        /**
         * Check if current document is local
         */
        isLocalDocument() {
            return this.currentFile?.type === 'local';
        },

        /**
         * Check if current document is collaborative
         */
        isCollaborativeDocument() {
            return this.currentFile?.type === 'collaborative';
        },

        /**
         * Check if current document is temporary
         */
        isTemporaryDocument() {
            return this.currentFile?.type === 'temporary' || this.currentFile?.type === 'temp';
        },

        /**
         * Check if document can be converted to collaborative
         */
        canConvertToCollaborative() {
            return this.isLocalDocument && this.uiState?.isOwner && this.isAuthenticated;
        },

        /**
         * Check if document can be downloaded
         */
        canDownloadDocument() {
            return this.uiState?.hasAccess && this.currentFile?.content;
        },

        /**
         * Check if document can be forked/duplicated
         */
        canForkDocument() {
            return this.uiState?.hasAccess && this.isAuthenticated;
        },

        /**
         * Get document access summary
         */
        documentAccessSummary() {
            if (!this.currentFile) return null;

            return {
                type: this.currentFile.type,
                owner: this.currentFile.owner,
                isOwner: this.uiState?.isOwner,
                permissionLevel: this.uiState?.permissionLevel,
                canEdit: this.uiState?.canEdit,
                canPublish: this.uiState?.canPublish,
                canShare: this.uiState?.canShare,
                canDelete: this.uiState?.canDelete,
                isPublic: this.currentFile.isPublic || false,
                hasCollaborators: (this.documentPermissions?.length || 0) > 1
            };
        }
    },

    methods: {
        /**
         * Check if user has specific permission for a document
         * @param {Object} document - Document to check
         * @param {string} permissionType - Permission type to check
         * @returns {boolean} True if has permission
         */
        hasDocumentPermission(document, permissionType) {
            if (!document) return false;

            const level = this.getUserPermissionLevel(document);

            switch(permissionType) {
                case 'view':
                    return this.hasAccess(level);
                case 'edit':
                    return this.canEditWithPermission(level);
                case 'publish':
                    return this.canPublishWithPermission(level);
                case 'delete':
                case 'share':
                case 'manage':
                    return this.isOwnerPermission(level);
                default:
                    return false;
            }
        },

        /**
         * Check if document is accessible by current user
         * @param {Object} document - Document to check
         * @returns {Object} Access check result
         */
        checkDocumentAccess(document) {
            if (!document) {
                return {
                    hasAccess: false,
                    reason: 'no-document',
                    message: 'No document provided'
                };
            }

            // Local documents
            if (document.type === 'local') {
                const isOwner = this.isUserOwner(document);
                return {
                    hasAccess: isOwner,
                    reason: isOwner ? 'owner' : 'not-owner',
                    message: isOwner ? 'You own this local document' : 'You do not own this local document'
                };
            }

            // Collaborative documents
            const level = this.getUserPermissionLevel(document);
            const hasAccess = this.hasAccess(level);

            return {
                hasAccess,
                permissionLevel: level,
                reason: hasAccess ? 'has-permission' : 'no-permission',
                message: hasAccess
                    ? `You have ${level} access to this document`
                    : 'You do not have access to this document'
            };
        },

        /**
         * Get available actions for a document
         * @param {Object} document - Document to check
         * @returns {Array} Array of available actions
         */
        getAvailableDocumentActions(document) {
            if (!document) return [];

            const actions = [];
            const level = this.getUserPermissionLevel(document);

            // View action (always available if has access)
            if (this.hasAccess(level)) {
                actions.push({
                    name: 'view',
                    label: 'View',
                    icon: 'fas fa-eye',
                    enabled: true
                });
            }

            // Edit action
            if (this.canEditWithPermission(level)) {
                actions.push({
                    name: 'edit',
                    label: 'Edit',
                    icon: 'fas fa-edit',
                    enabled: !this.isReadOnlyMode
                });
            }

            // Publish action
            if (this.canPublishWithPermission(level)) {
                actions.push({
                    name: 'publish',
                    label: 'Publish',
                    icon: 'fas fa-paper-plane',
                    enabled: this.canPublish // Also check content validity
                });
            }

            // Share action
            if (this.isOwnerPermission(level)) {
                actions.push({
                    name: 'share',
                    label: 'Share',
                    icon: 'fas fa-user-plus',
                    enabled: document.type === 'collaborative'
                });
            }

            // Delete action
            if (this.isOwnerPermission(level)) {
                actions.push({
                    name: 'delete',
                    label: 'Delete',
                    icon: 'fas fa-trash',
                    enabled: true,
                    dangerous: true
                });
            }

            // Convert to collaborative (local only)
            if (document.type === 'local' && this.isOwnerPermission(level)) {
                actions.push({
                    name: 'convert',
                    label: 'Enable Collaboration',
                    icon: 'fas fa-cloud-upload',
                    enabled: this.isAuthenticated
                });
            }

            // Export actions (if has access)
            if (this.hasAccess(level)) {
                actions.push({
                    name: 'export',
                    label: 'Export',
                    icon: 'fas fa-download',
                    enabled: true,
                    submenu: [
                        { name: 'export-markdown', label: 'As Markdown', icon: 'fas fa-file-text' },
                        { name: 'export-html', label: 'As HTML', icon: 'fas fa-code' },
                        { name: 'export-json', label: 'As JSON', icon: 'fas fa-file-code' }
                    ]
                });
            }

            return actions;
        },

        /**
         * Check if document requires authentication
         * @param {Object} document - Document to check
         * @returns {boolean} True if auth required
         */
        documentRequiresAuth(document) {
            if (!document) return false;

            // Local documents don't require auth to view (if you own them)
            if (document.type === 'local') {
                return false;
            }

            // Collaborative documents require auth unless public
            return !document.isPublic && !this.isAuthenticated;
        },

        /**
         * Get permission request message for a document
         * @param {Object} document - Document to get message for
         * @param {string} action - Action being attempted
         * @returns {string} Permission request message
         */
        getPermissionMessage(document, action = 'access') {
            if (!document) return 'Document not found';

            const level = this.getUserPermissionLevel(document);
            const messages = {
                'no-access': {
                    'access': 'You do not have permission to access this document',
                    'edit': 'You do not have permission to edit this document',
                    'publish': 'You do not have permission to publish this document',
                    'delete': 'Only the owner can delete this document',
                    'share': 'Only the owner can share this document'
                },
                'readonly': {
                    'edit': 'This document is read-only',
                    'publish': 'You need publish permission to publish this document',
                    'delete': 'Only the owner can delete this document',
                    'share': 'Only the owner can share this document'
                },
                'editable': {
                    'publish': 'You need publish permission to publish this document',
                    'delete': 'Only the owner can delete this document',
                    'share': 'Only the owner can share this document'
                },
                'postable': {
                    'delete': 'Only the owner can delete this document',
                    'share': 'Only the owner can share this document'
                }
            };

            return messages[level]?.[action] || `You need ${action} permission for this document`;
        }
    }
};
