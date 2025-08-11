/**
 * DLUX Permission Service
 *
 * Centralized service for all permission-related logic in the DLUX collaborative editor.
 * This service provides a unified API for checking user permissions across different
 * document types and contexts.
 *
 * ARCHITECTURAL NOTES:
 * - This is a Layer 2 service - NO component dependencies allowed
 * - All data must be passed as parameters
 * - Service provides pure functions for permission logic
 *
 * Features:
 * - Single source of truth for permission decisions
 * - Support for 5-tier permission model (no-access, readonly, editable, postable, owner)
 * - Unified helpers for permission checking
 * - Cache-aware permission resolution
 * - Authentication state validation
 *
 * @class PermissionService
 */
export default class PermissionService {
    constructor() {
        // No component dependency - this is a pure service
        this.DEBUG = false;
    }

    // ===== CORE PERMISSION DETERMINATION =====

    /**
     * Determine user's permission level for a given file/document
     * This is the core logic for permission resolution
     * @param {Object} file - The file/document to check permissions for
     * @param {string} currentUser - Current username
     * @param {boolean} isAuthenticated - Whether user is authenticated
     * @param {Array} documentPermissions - Array of document permissions
     * @param {Array} collaborativeDocs - Array of collaborative documents
     * @returns {string} Permission level: 'owner' | 'postable' | 'editable' | 'readonly' | 'no-access' | 'unknown'
     */
    determinePermissionLevel(file, currentUser, isAuthenticated, documentPermissions = [], collaborativeDocs = []) {
        if (!file) {
            return 'unknown';
        }

        // Handle different file types
        if (file.type === 'temp') {
            // Temp files are always editable
            return 'editable';
        }

        if (file.type === 'local') {
            // Local files - check ownership
            if (!currentUser) {
                return 'no-access';
            }
            return file.owner === currentUser ? 'owner' : 'no-access';
        }

        if (file.type === 'collaborative') {
            // Guest users get no access to collaborative documents
            if (!currentUser || currentUser === 'GUEST') {
                return 'no-access';
            }

            // Not authenticated
            if (!isAuthenticated) {
                return 'no-access';
            }

            // Check if user is owner
            if (file.owner === currentUser) {
                return 'owner';
            }

            // Check explicit permissions
            if (file.permissionLevel && this.getValidPermissionLevels().includes(file.permissionLevel)) {
                return file.permissionLevel;
            }

            // Check document permissions array
            if (documentPermissions && documentPermissions.length > 0) {
                const userPermission = documentPermissions.find(p => p.account === currentUser);
                if (userPermission && userPermission.access_type) {
                    return this.normalizeAccessType(userPermission.access_type);
                }
            }

            // Check collaborative docs list
            const collabDoc = collaborativeDocs.find(doc =>
                doc.owner === file.owner && doc.permlink === file.permlink
            );

            if (collabDoc) {
                // Found in collaborative docs - check access level
                if (collabDoc.permission || collabDoc.access_type) {
                    return this.normalizeAccessType(collabDoc.permission || collabDoc.access_type);
                }
                // Default to editable if in list but no explicit permission
                return 'editable';
            }

            // No permission found
            return 'no-access';
        }

        // Unknown file type
        return 'unknown';
    }

    // ===== PERMISSION LEVEL CHECKS =====

    /**
     * Check if permission level denies access
     * @param {string} permissionLevel - Permission level to check
     * @returns {boolean} true if access is denied
     */
    hasNoAccess(permissionLevel) {
        return permissionLevel === 'no-access';
    }

    /**
     * Check if permission level allows access
     * @param {string} permissionLevel - Permission level to check
     * @returns {boolean} true if access is allowed
     */
    hasAccess(permissionLevel) {
        return permissionLevel !== 'no-access';
    }

    /**
     * Check if permission level is owner
     * @param {string} permissionLevel - Permission level to check
     * @returns {boolean} true if owner permission
     */
    isOwnerPermission(permissionLevel) {
        return permissionLevel === 'owner';
    }

    /**
     * Check if permission level is readonly
     * @param {string} permissionLevel - Permission level to check
     * @returns {boolean} true if readonly
     */
    isReadonlyPermission(permissionLevel) {
        return permissionLevel === 'readonly';
    }

    /**
     * Check if permission level is read-only or worse
     * @param {string} permissionLevel - Permission level to check
     * @returns {boolean} true if readonly, no-access, or unknown
     */
    isReadOnlyOrWorse(permissionLevel) {
        return ['readonly', 'no-access', 'unknown'].includes(permissionLevel);
    }

    /**
     * Check if permission level is view-only (readonly or no-access)
     * @param {string} permissionLevel - Permission level to check
     * @returns {boolean} true if readonly or no-access
     */
    isViewOnlyPermission(permissionLevel) {
        return permissionLevel === 'readonly' || permissionLevel === 'no-access';
    }

    // ===== CAPABILITY CHECKS =====

    /**
     * Check if permission level allows editing
     * @param {string} permissionLevel - Permission level to check
     * @returns {boolean} true if permission allows editing
     */
    canEditWithPermission(permissionLevel) {
        return ['owner', 'postable', 'editable'].includes(permissionLevel);
    }

    /**
     * Check if permission level allows publishing
     * @param {string} permissionLevel - Permission level to check
     * @returns {boolean} true if postable or owner
     */
    canPublishWithPermission(permissionLevel) {
        return permissionLevel === 'postable' || permissionLevel === 'owner';
    }

    // ===== USER & DOCUMENT HELPERS =====

    /**
     * Check if a user owns a file
     * @param {Object} file - File to check
     * @param {string} username - Username to check
     * @returns {boolean} true if user is owner
     */
    isUserOwner(file, username) {
        if (!file || !username) return false;
        return file.owner === username;
    }

    /**
     * Check if user is a guest
     * @param {string} username - Username to check
     * @returns {boolean} true if guest user
     */
    isGuestUser(username) {
        return !username || username === 'GUEST';
    }

    /**
     * Check if two documents match
     * @param {Object} doc1 - First document
     * @param {Object} doc2 - Second document
     * @returns {boolean} true if documents match
     */
    isDocumentMatch(doc1, doc2) {
        if (!doc1 || !doc2) return false;
        return doc1.owner === doc2.owner && doc1.permlink === doc2.permlink;
    }

    // ===== VALIDATION HELPERS =====

    /**
     * Check if cache is valid for a user
     * @param {Object} cacheData - Cache data to validate
     * @param {string} username - Username to check against
     * @returns {boolean} true if cache is valid
     */
    isCacheValidForUser(cacheData, username) {
        if (!cacheData || !username) return false;
        return cacheData.username === username;
    }

    /**
     * Get user permission from permissions array
     * @param {Array} documentPermissions - Array of permissions
     * @param {string} username - Username to find
     * @returns {Object|null} User permission object or null
     */
    getUserPermissionFromArray(documentPermissions, username) {
        if (!documentPermissions || !username) return null;
        return documentPermissions.find(p => p.account === username);
    }

    // ===== ACTION-BASED PERMISSION CHECKS =====

    /**
     * Check if a user can attempt WebSocket connection to a document
     * This is a pre-flight check before actual connection
     * @param {Object} documentInfo - Document information
     * @param {string} currentUser - Current username
     * @param {boolean} isAuthenticated - Whether user is authenticated
     * @param {boolean} isAuthExpired - Whether auth has expired
     * @param {Array} collaborativeDocs - List of collaborative documents
     * @param {boolean} isLoadingCollaborativeDocs - Whether docs are still loading
     * @param {Object} authStateManager - Optional AuthStateManager instance for cache checking
     * @returns {boolean} true if connection attempt should be allowed
     */
    canAttemptConnection(documentInfo, currentUser, isAuthenticated, isAuthExpired, collaborativeDocs = [], isLoadingCollaborativeDocs = false, authStateManager = null) {
        // Basic validation
        if (!documentInfo || this.isGuestUser(currentUser)) {
            if (this.DEBUG) console.log('🚀 PRE-FLIGHT: Missing basic requirements');
            return false;
        }

        // Authentication check
        if (!isAuthenticated || isAuthExpired) {
            if (this.DEBUG) console.log('🚀 PRE-FLIGHT: User not authenticated or auth expired');
            return false;
        }

        // Allow authenticated users to attempt connection
        // The server will handle the actual permission validation
        if (isAuthenticated && !isAuthExpired) {
            // Check if user is the owner - owners always have access
            if (documentInfo.owner === currentUser) {
                if (this.DEBUG) console.log('🚀 PRE-FLIGHT: User is document owner - allowing connection');
                return true;
            }

            // ✅ RULE #3 (Single Source of Truth): Check AuthStateManager cache
            // This establishes AuthStateManager as the authoritative source for permissions
            if (authStateManager) {
                const cachedPermission = authStateManager.getCachedPermission(documentInfo.owner, documentInfo.permlink);
                if (cachedPermission && cachedPermission !== 'no-access') {
                    if (this.DEBUG) console.log('🚀 PRE-FLIGHT: Found valid permission in AuthStateManager cache - allowing connection', {
                        documentPath: `${documentInfo.owner}/${documentInfo.permlink}`,
                        cachedPermission,
                        source: 'AuthStateManager cache'
                    });
                    return true;
                }
            }

            // No permission found
            if (this.DEBUG) console.log('🚀 PRE-FLIGHT: No permission found in cache - denying connection', {
                documentPath: `${documentInfo.owner}/${documentInfo.permlink}`,
                hasAuthStateManager: !!authStateManager
            });
            return false;
        }

        return false;
    }

    /**
     * Check if a user can perform a specific action based on permission level
     * @param {string} action - Action to check (edit, publish, delete, share, etc.)
     * @param {string} permissionLevel - User's permission level
     * @returns {boolean} true if action is allowed
     */
    canPerformAction(action, permissionLevel) {
        if (!action || !permissionLevel) return false;

        const actions = {
            'view': ['readonly', 'editable', 'postable', 'owner'],
            'edit': ['editable', 'postable', 'owner'],
            'publish': ['postable', 'owner'],
            'delete': ['owner'],
            'share': ['owner'],
            'manage-permissions': ['owner']
        };

        const allowedLevels = actions[action] || [];
        return allowedLevels.includes(permissionLevel);
    }

    /**
     * Get permission hint from URL parameters
     * Note: This is only a hint and should not be used as authoritative
     * @param {URLSearchParams} urlParams - URL parameters
     * @returns {string|null} Permission hint or null
     */
    getPermissionHintFromURL(urlParams) {
        if (!urlParams) return null;

        // Check for explicit permission parameter
        const explicitPermission = urlParams.get('permission') ||
                                 urlParams.get('perm') ||
                                 urlParams.get('access_level');

        if (explicitPermission) {
            const normalized = this.normalizeAccessType(explicitPermission);
            if (this.getValidPermissionLevels().includes(normalized)) {
                return normalized;
            }
        }

        // Check for read-only hint
        const readOnlyParam = urlParams.get('readonly') ||
                            urlParams.get('read_only') ||
                            urlParams.get('viewer');

        if (readOnlyParam === 'true' || readOnlyParam === '1' || readOnlyParam === 'yes') {
            return 'readonly';
        }

        // Check for edit hint
        const editParam = urlParams.get('edit') || urlParams.get('editable');
        if (editParam === 'true' || editParam === '1' || editParam === 'yes') {
            return 'editable';
        }

        return null;
    }

    // ===== CONSTANTS & UTILITIES =====

    /**
     * Get default permission level for fallback scenarios
     * @returns {string} Default permission level
     */
    getDefaultPermissionLevel() {
        return 'readonly';
    }

    /**
     * Get no-access permission level
     * @returns {string} No-access permission level
     */
    getNoAccessPermissionLevel() {
        return 'no-access';
    }

    /**
     * Get array of valid permission levels
     * @returns {Array<string>} Array of valid permission levels
     */
    getValidPermissionLevels() {
        return ['owner', 'postable', 'editable', 'readonly', 'no-access'];
    }

    /**
     * Normalize access type strings to permission levels
     * @param {string} accessType - Access type string to normalize
     * @returns {string} Normalized permission level
     */
    normalizeAccessType(accessType) {
        if (!accessType) return 'unknown';

        const normalized = accessType.toLowerCase().trim();

        // Check for owner permission
        if (normalized === 'owner' || normalized === 'admin') {
            return 'owner';
        }

        // Check for postable permission variants
        if (normalized === 'postable' || normalized === 'publisher' || normalized === 'post' ||
            normalized.includes('publish')) {
            return 'postable';
        }

        // Check for editable permission variants
        if (normalized === 'editable' || normalized === 'editor' || normalized === 'edit' ||
            normalized.includes('edit') || normalized.includes('write')) {
            return 'editable';
        }

        // Check for readonly permission variants
        if (normalized === 'readonly' || normalized === 'read' || normalized === 'viewer' ||
            normalized.includes('read')) {
            return 'readonly';
        }

        // Check for no-access
        if (normalized === 'no-access' || normalized === 'none' || normalized === 'denied') {
            return 'no-access';
        }

        return 'unknown';
    }

    // ===== PRE-FLIGHT & AUTHENTICATION =====

    /**
     * Check if document permissions allow pre-flight connection
     * @param {Object} file - File to check
     * @param {string} currentUser - Current username
     * @param {boolean} isAuthenticated - Whether user is authenticated
     * @returns {boolean} true if pre-flight check passes
     */
    checkDocumentPermissionsPreFlight(file, currentUser, isAuthenticated) {
        if (!file) return false;

        // Temp files always pass
        if (file.type === 'temp') return true;

        // Local files require ownership
        if (file.type === 'local') {
            return this.isUserOwner(file, currentUser);
        }

        // Collaborative files require authentication
        if (file.type === 'collaborative') {
            return isAuthenticated && !this.isGuestUser(currentUser);
        }

        return false;
    }

    /**
     * Check if user can authenticate for document access
     * @param {Object} documentInfo - Document information
     * @param {string} currentUser - Current username
     * @returns {boolean} true if user can authenticate
     */
    canUserAuthenticateForAccess(documentInfo, currentUser) {
        if (!documentInfo) return false;

        // Already has access
        if (documentInfo.hasAccess) return false;

        // Guest users can authenticate
        if (this.isGuestUser(currentUser)) return true;

        // Different user can switch accounts
        if (documentInfo.owner && documentInfo.owner !== currentUser) return true;

        // Expired auth can re-authenticate
        if (documentInfo.authExpired) return true;

        return false;
    }
}

// Create singleton instance
export const permissionService = new PermissionService();
