/**
 * AuthStateManager - Centralized authentication and document access control
 *
 * This service manages all authentication state and document access permissions,
 * providing a single source of truth for auth-related decisions across the application.
 *
 * RECURSION PROTECTION:
 * This service uses protection flags to prevent infinite loops that can occur when:
 * - Vue's reactive state triggers computed property updates
 * - Event handlers trigger methods that emit more events
 * - State changes cascade through multiple watchers
 *
 * Each protected method follows this pattern:
 * ```javascript
 * if (this._protectionFlag) {
 *     if (this.DEBUG) console.log('Preventing recursive call');
 *     return;
 * }
 * this._protectionFlag = true;
 * try {
 *     // Method logic here
 * } finally {
 *     this._protectionFlag = false;
 * }
 * ```
 */

import {
    hasAllAuthFields,
    getAuthAccount,
    getAuthSignature,
    getAuthChallenge,
    getAuthPubkey,
    calculateChallengeAge,
    areAuthHeadersExpired,
    validateAuthHeaderStructure,
    authHeadersMatchAccount
} from '/js/utils/auth-helpers.js';

// Import Vue's reactive to make state changes trigger Vue reactivity
import { reactive } from '/js/vue.esm-browser.js';

// Import CacheService singleton
import { cacheService } from '/js/services/cache-service.js';

export class AuthStateManager {
    constructor() {
        // ✅ MAKE STATE REACTIVE: Use Vue's reactive() so state changes trigger computed property updates
        // Core authentication state
        this.state = reactive({
            user: null,
            isAuthenticated: false,
            isAuthExpired: false,
            authHeaders: null,
            authenticationState: 'not-authenticated', // DEPRECATED - use _authState

            // Document access state
            currentDocument: null,
            pendingDocument: null,
            accessDenialHandling: false,

            // Permission cache
            permissionCache: new Map(),
            collaborativeDocs: [],

            // Loading states for race condition fix
            collaborativeDocsLoaded: false,
            collaborativeDocsLoading: false
        });

        // ===== HYBRID STATE MACHINE =====
        // Internal state machine - single source of truth
        // ✅ MAKE AUTH STATE REACTIVE: Wrap in reactive object so Vue tracks changes
        this._stateWrapper = reactive({
            authState: 'unauthenticated' // States: 'unauthenticated', 'loading', 'authenticated', 'expired', 'error'
        });

        // Valid state transitions
        this._validTransitions = {
            'unauthenticated': ['loading', 'authenticated'],
            'loading': ['authenticated', 'error', 'unauthenticated'],
            'authenticated': ['authenticated', 'expired', 'unauthenticated', 'loading'], // Added self-transition
            'expired': ['loading', 'unauthenticated'],
            'error': ['loading', 'unauthenticated']
        };

        // Event emitter for state changes
        this.events = new EventTarget();

        // Document access rules cache
        this.documentAccessRules = new Map();

        // Track authentication retry attempts
        this.authRetryMap = new Map();

        // Debug flag
        this.DEBUG = window.DEBUG || false;

        // Initialize CacheService
        this.cacheService = cacheService;

        // ===== RECURSION PROTECTION FLAGS =====
        // These flags prevent infinite loops in reactive method calls.
        // Vue's reactivity can trigger cascading updates that could lead to recursion.

        // Prevents recursive calls in setUser() method
        // Used when: setUser triggers computed properties that might call setUser again
        this._settingUser = false;

        // Context-aware recursion protection for checkDocumentAccess()
        // Tracks active calls and their context to allow legitimate nested calls
        this._accessCheckContext = {
            active: false,
            context: null,
            depth: 0
        };

        // Prevents recursive calls in evaluateAccess() method
        // Used when: Permission evaluation triggers state changes that might cause re-evaluation
        this._evaluatingAccess = false;
    }

    // ===== STATE MANAGEMENT METHODS =====

    /**
     * Set state properties in a controlled manner
     * ✅ GOLDEN RULE #10: Immutable External State - All state mutations go through this method
     * @param {Object} updates - Object with state properties to update
     * @param {string} origin - Origin of the update for debugging
     */
    setState(updates, origin = 'unknown') {
        if (this.DEBUG) {
            console.log('🔐 AuthStateManager.setState:', {
                updates,
                origin,
                currentState: { ...this.state }
            });
        }

        // Apply updates to reactive state
        Object.assign(this.state, updates);

        // Emit state change event if significant properties changed
        if ('user' in updates || 'authHeaders' in updates || 'isAuthenticated' in updates) {
            this.emit('stateUpdated', {
                updates,
                origin,
                timestamp: Date.now()
            });
        }
    }

    // ===== HYBRID STATE MACHINE METHODS =====

    /**
     * Transition to a new auth state with validation
     * @param {string} newState - The target state
     * @param {string} reason - Optional reason for debugging
     * @returns {boolean} - True if transition was successful
     */
    transitionTo(newState, reason = '') {
        const currentState = this._stateWrapper.authState;

        // ✅ GUARD: Skip if already in target state to prevent spam
        if (currentState === newState) {
            if (this.DEBUG) {
                console.log(`🔐 Already in state: ${newState} (skipping transition)`);
            }
            return true; // Return true since we're already in the desired state
        }

        const validTransitions = this._validTransitions[currentState];

        if (!validTransitions || !validTransitions.includes(newState)) {
            console.error(`❌ Invalid auth state transition: ${currentState} → ${newState}${reason ? ` (${reason})` : ''}`);
            return false;
        }

        console.log(`🔐 Auth state transition: ${currentState} → ${newState}${reason ? ` (${reason})` : ''}`);

        const previousState = this._stateWrapper.authState;
        this._stateWrapper.authState = newState;

        // Update legacy state for backward compatibility
        this.setState({
            isAuthenticated: this.isAuthenticated(),
            isAuthExpired: this.isAuthExpired(),
            authenticationState: this._mapToLegacyState(newState)
        }, `state-transition-${newState}`);

        // Emit state change event
        this.emit('authStateChanged', {
            previousState,
            currentState: newState,
            reason,
            timestamp: Date.now()
        });

        return true;
    }

    /**
     * Map new state to legacy state for backward compatibility
     */
    _mapToLegacyState(state) {
        const mapping = {
            'unauthenticated': 'not-authenticated',
            'loading': 'authenticating',
            'authenticated': 'authenticated',
            'expired': 'expired',
            'error': 'error'
        };
        return mapping[state] || 'not-authenticated';
    }

    // ===== BOOLEAN STATE GETTERS (PUBLIC API) =====

    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    isAuthenticated() {
        return this._stateWrapper.authState === 'authenticated';
    }

    /**
     * Get current auth headers
     * @returns {Object|null} Auth headers object or null if not authenticated
     */
    getAuthHeaders() {
        return this.state.authHeaders;
    }

    /**
     * Check if auth is loading
     * @returns {boolean}
     */
    isAuthLoading() {
        return this._stateWrapper.authState === 'loading';
    }

    /**
     * Check if auth is expired
     * @returns {boolean}
     */
    isAuthExpired() {
        return this._stateWrapper.authState === 'expired';
    }

    /**
     * Check if there's an auth error
     * @returns {boolean}
     */
    hasAuthError() {
        return this._stateWrapper.authState === 'error';
    }

    /**
     * Get current auth state (for debugging)
     * @returns {string}
     */
    getCurrentAuthState() {
        return this._stateWrapper.authState;
    }

    /**
     * Getter for _authState to maintain compatibility
     * @returns {string}
     */
    get _authState() {
        return this._stateWrapper.authState;
    }

    // ===== STATE MUTATIONS =====

    /**
     * Set the current user and trigger state updates
     *
     * RECURSION PROTECTION: This method uses _settingUser flag to prevent infinite loops
     * that can occur when setting the user triggers Vue computed properties or watchers
     * that might attempt to set the user again.
     *
     * @param {string|null} user - Username or null for logout
     * @param {Object|null} documentToCheck - Optional document to check access for after user switch
     */
    setUser(user, documentToCheck = null) {
        console.log('🔍 DEBUG setUser called:', {
            user,
            hasCurrentDocument: !!this.state.currentDocument,
            currentDocument: this.state.currentDocument,
            timestamp: new Date().toISOString()
        });

        // ✅ DIAGNOSTIC LOGGING
        console.log('🔍 AUTH STATE DIAGNOSTIC:', {
            method: 'setUser',
            user,
            currentDocument: this.state.currentDocument,
            documentToCheck: documentToCheck,
            willCheckAccess: !!(documentToCheck || this.state.currentDocument),
            recursionFlag: this._settingUser
        });

        // RECURSION GUARD: Prevent infinite loops from reactive updates
        if (this._settingUser) {
            if (this.DEBUG) console.log('🔐 AuthStateManager: Preventing recursive setUser call');
            return;
        }


        this._settingUser = true;
        this._userChanging = true; // Set flag for API call guards
        try {
            const oldUser = this.state.user;

            // ✅ SECURITY + OFFLINE-FIRST: Validate auth headers match user
            // Headers are preserved in storage but cleared from active state if mismatched
            if (oldUser !== user && this.state.authHeaders) {
                const accountFromHeaders = getAuthAccount(this.state.authHeaders);

                if (accountFromHeaders !== user) {
                    console.log('🔐 SECURITY: Clearing mismatched auth headers from active state', {
                        oldUser,
                        newUser: user,
                        headersAccount: accountFromHeaders,
                        action: 'Headers remain in storage for offline access when user returns'
                    });

                    // Clear from active state for security
                    this.setState({ authHeaders: null }, 'security-user-mismatch');

                    // Emit event to notify components
                    this.emit('authHeadersCleared', { oldUser, newUser: user });
                } else {
                    console.log('✅ SECURITY: Auth headers match new user - keeping active', {
                        user,
                        headersAccount: accountFromHeaders
                    });
                }
            }

            // Now update the user
            this.setState({ user }, 'set-user');

            // Update authentication state using state machine
            if (user) {
                // Check if we have valid, non-expired headers for this user
                if (this.state.authHeaders && hasAllAuthFields(this.state.authHeaders)) {
                    // Validate headers are not expired and match the user
                    const isExpired = areAuthHeadersExpired(this.state.authHeaders);
                    const matchesUser = this.state.authHeaders['x-account'] === user;

                    if (!isExpired && matchesUser) {
                        this.transitionTo('authenticated', 'user set with valid headers');
                    } else {
                        // Headers exist but are invalid
                        console.log('🔐 Auth headers invalid for user', {
                            user,
                            isExpired,
                            matchesUser,
                            headerAccount: this.state.authHeaders['x-account']
                        });
                        this.transitionTo('loading', 'user set, headers invalid or expired');
                    }
                } else if (this._stateWrapper.authState === 'loading') {
                    // Keep loading state if we're in the middle of auth
                } else {
                    // Have user but no headers yet
                    this.transitionTo('loading', 'user set, awaiting headers');
                }
            } else {
                // No user means unauthenticated
                this.transitionTo('unauthenticated', 'user cleared');
            }

            // Clear permission cache on user change
            if (oldUser !== user) {
                console.log('🔄 SECURITY: User changed - clearing permission caches', {
                    oldUser,
                    newUser: user
                });

                // Always clear permission cache on user change
                this.state.permissionCache.clear();
                this.documentAccessRules.clear();

                // ✅ FIX: Only emit userChanged when user actually changes
                // This prevents redundant events when setUser is called with the same user
                console.log('🔄 AUTH STATE: User changing', {
                    oldUser,
                    newUser: user,
                    willEmitTo: 'internal EventTarget only (BUG!)'
                });
                this.emit('userChanged', { oldUser, newUser: user });
            } else {
                console.log('🔐 AUTH STATE: User unchanged, skipping userChanged event', {
                    user,
                    reason: 'Preventing redundant event emission'
                });
            }

            // ✅ FIX: Check document access with the new user
            // Priority: explicit documentToCheck > currentDocument
            const docToCheck = documentToCheck || this.state.currentDocument;

            if (docToCheck) {
                console.log('🔍 DEBUG: Checking document access after user switch', {
                    document: docToCheck,
                    newUser: user,
                    oldUser: oldUser,
                    wasProvided: !!documentToCheck
                });

                // Handle logout scenario - need to show auth modal for collaborative documents
                if (!user && oldUser) {
                    // For collaborative documents, we need to show the auth modal after clearing
                    if (docToCheck.type === 'collaborative') {
                        // Check access will emit clearDocument first, then accessDenied
                        this.checkDocumentAccess(docToCheck, 'logout');
                    } else {
                        // For other document types, just check access normally
                        this.checkDocumentAccess(docToCheck, 'user-switch');
                    }
                } else if (user && oldUser && user !== oldUser) {
                    // Normal user switch - check document access with new user
                    this.checkDocumentAccess(docToCheck, 'user-switch');
                } else if (user && !oldUser) {
                    // Login - check if new user has access
                    this.checkDocumentAccess(docToCheck, 'login');
                }
            }
        } finally {
            this._settingUser = false;
            this._userChanging = false; // Clear flag for API call guards
        }
    }

    /**
     * Set authentication headers
     */
    setAuthHeaders(headers) {
        const oldHeaders = this.state.authHeaders;

        console.log('🔴 AUTH-FLOW: setAuthHeaders called', {
            hasHeaders: !!headers,
            currentUser: this.state.user,
            headersAccount: headers?.['x-account'],
            currentAuthState: this._stateWrapper.authState,
            callStack: new Error().stack.split('\n').slice(2, 5).join(' -> ')
        });

        // Get current user for sessionStorage key
        const currentUser = this.state.user || (headers && headers['x-account']);
        const storageKey = currentUser ? `collaborationAuthHeaders_${currentUser}` : null;

        console.log('🔴 AUTH-RESTORE: setAuthHeaders detailed check', {
            hasHeaders: !!headers,
            source: new Error().stack.split('\n')[2], // Track where call originated
            currentUser: currentUser,
            storageKey: storageKey,
            sessionStorageHeaders: (typeof sessionStorage !== 'undefined' && storageKey) ?
                sessionStorage.getItem(storageKey) : 'N/A',
            timestamp: Date.now()
        });

        // 🔵 CACHE-PERSIST: Log databases when auth headers are set (login)
        if (headers && window.indexedDB && window.indexedDB.databases) {
            const accountFromHeaders = getAuthAccount(headers);
            window.indexedDB.databases().then(dbs => {
                console.log('🔵 CACHE-PERSIST: Databases when user authenticates', {
                    username: accountFromHeaders,
                    databaseCount: dbs.length,
                    databases: dbs.map(db => db.name),
                    timestamp: new Date().toISOString()
                });
            });
        }

        // CRITICAL: Validate headers belong to current user before setting
        if (headers && this.state.user) {
            const accountFromHeaders = getAuthAccount(headers);
            if (accountFromHeaders && accountFromHeaders !== this.state.user) {
                console.log('🚨 SECURITY: Auth headers do not match current user!', {
                    currentUser: this.state.user,
                    headersUser: accountFromHeaders,
                    action: 'rejecting mismatched headers'
                });
                // Clear the mismatched headers and stay unauthenticated
                this.setState({ authHeaders: null }, 'auth-headers-mismatch');
                this.transitionTo('unauthenticated', 'auth headers mismatch current user');
                this.emit('authHeadersMismatch', {
                    currentUser: this.state.user,
                    headersUser: accountFromHeaders
                });
                return;
            }
        }

        this.setState({ authHeaders: headers }, 'set-auth-headers');

        // Persist to sessionStorage when headers are set
        if (headers) {
            const username = this.state.user || getAuthAccount(headers);
            if (username) {
                this.cacheAuthHeaders(username, headers);
            }
        }

        // Update user from headers if not already set
        if (headers && !this.state.user) {
            const accountFromHeaders = getAuthAccount(headers);
            if (accountFromHeaders) {
                this.setState({ user: accountFromHeaders }, 'set-user-from-headers');
            }
        }

        // Update state machine based on headers
        if (headers && hasAllAuthFields(headers)) {
            // Check if headers are expired
            const expired = areAuthHeadersExpired(headers);

            if (expired) {
                console.log('🔴 AUTH-FLOW: Headers expired, transitioning to expired', {
                    user: this.state.user,
                    challengeAge: calculateChallengeAge(headers)
                });
                this.transitionTo('expired', 'auth headers expired');
            } else {
                console.log('🔴 AUTH-FLOW: Valid headers, transitioning to authenticated', {
                    user: this.state.user,
                    hasAllFields: true,
                    headersAccount: headers['x-account'],
                    challenge: headers['x-challenge'],
                    challengeAge: calculateChallengeAge(headers),
                    challengeAgeHours: calculateChallengeAge(headers) ? (calculateChallengeAge(headers) / 3600).toFixed(1) : null
                });
                this.transitionTo('authenticated', 'valid auth headers set');
            }
        } else if (headers && !hasAllAuthFields(headers)) {
            // Partial headers indicate error
            console.log('🔴 AUTH-FLOW: Incomplete headers, transitioning to error', {
                user: this.state.user,
                hasAccount: !!headers['x-account'],
                hasChallenge: !!headers['x-challenge'],
                hasSignature: !!headers['x-signature'],
                hasPubkey: !!headers['x-pubkey']
            });
            this.transitionTo('error', 'incomplete auth headers');
        } else {
            // No headers
            console.log('🔴 AUTH-FLOW: No headers, transitioning to unauthenticated', {
                user: this.state.user
            });
            this.transitionTo('unauthenticated', 'auth headers cleared');
        }

        // Check expiration using Layer 1 utility
        if (headers) {
            this.setState({ isAuthExpired: areAuthHeadersExpired(headers) }, 'check-auth-expiration');

            // Clear stale permission cache when new auth headers are set
            // This ensures fresh permission checks after authentication
            const newAccount = getAuthAccount(headers);

            // ✅ FIX: Validate account before calling setUser to prevent undefined/null user changes
            // Only call setUser if:
            // 1. We have a valid account (not null/undefined/empty)
            // 2. The account is different from current user
            if (newAccount && newAccount.trim() && newAccount !== this.state.user) {
                console.log('🔐 AUTH HEADERS: Valid account found, updating user', {
                    currentUser: this.state.user,
                    newAccount: newAccount
                });
                this.setUser(newAccount);
                this.clearStalePermissionCache(newAccount);
            } else if (newAccount && newAccount.trim()) {
                // Same user - just clear cache
                console.log('🔐 AUTH HEADERS: Same user, clearing cache only', {
                    account: newAccount
                });
                this.clearStalePermissionCache(newAccount);
            } else {
                // ✅ FIX: No valid account in headers - DO NOT call setUser
                // This prevents emitting userChanged with undefined/null
                console.log('🔐 AUTH HEADERS: No valid account in headers, not changing user', {
                    currentUser: this.state.user,
                    extractedAccount: newAccount,
                    headersProvided: true
                });
            }
        } else {
            // ✅ FIX: Headers cleared - DO NOT change user
            // Authentication state change doesn't mean user logged out
            console.log('🔐 AUTH HEADERS: Headers cleared, maintaining current user', {
                currentUser: this.state.user
            });
        }

        this.emit('authHeadersChanged', { headers });
    }

    /**
     * Set the current document
     */
    setCurrentDocument(doc) {
        this.setState({ currentDocument: doc }, 'set-current-document');
        this.emit('currentDocumentChanged', { document: doc });
    }

    /**
     * Set collaborative documents list
     */
    setCollaborativeDocs(docs) {
        this.setState({
            collaborativeDocs: docs || [],
            collaborativeDocsLoaded: true,
            collaborativeDocsLoading: false
        }, 'set-collaborative-docs');
        console.log('📚 Collaborative docs loaded:', {
            count: this.state.collaborativeDocs.length,
            loaded: this.state.collaborativeDocsLoaded
        });
        this.emit('collaborativeDocsUpdated', { docs: this.state.collaborativeDocs });
        this.emit('collaborativeDocsLoaded', { docs: this.state.collaborativeDocs });
    }

    /**
     * Start loading collaborative documents
     */
    startLoadingCollaborativeDocs() {
        this.setState({ collaborativeDocsLoading: true }, 'start-loading-collaborative-docs');
        console.log('📚 Started loading collaborative docs');
    }

    /**
     * Start auth loading process
     */
    startAuthLoading(reason = '') {
        this.transitionTo('loading', reason || 'auth process started');
    }

    /**
     * Handle auth error
     */
    setAuthError(error, reason = '') {
        this.transitionTo('error', reason || error.message || 'auth error');
        this.emit('authError', { error, reason });
    }

    /**
     * Clear auth (logout)
     */
    clearAuth(reason = '') {
        this.setState({
            authHeaders: null,
            user: null
        }, 'clear-auth');
        this.state.permissionCache.clear();
        this.documentAccessRules.clear();
        this.transitionTo('unauthenticated', reason || 'auth cleared');
    }

    /**
     * Invalidate all permission caches for a specific document
     * ✅ GOLDEN RULE #3: Single Source of Truth
     * AuthStateManager is the sole authority on permissions
     * @param {string} documentKey - Document key in format "owner/permlink"
     */
    invalidateAllPermissionCaches(documentKey) {
        console.log('🗑️ Invalidating all permission caches for:', documentKey);

        // Clear from our cache
        if (this.state.permissionCache) {
            // Clear all entries for this document (different users might have cached it)
            for (const [key, value] of this.state.permissionCache.entries()) {
                if (key.includes(documentKey)) {
                    this.state.permissionCache.delete(key);
                    console.log('🗑️ Cleared cache entry:', key);
                }
            }
        }

        // Clear document from collaborative docs list
        if (this.state.collaborativeDocs) {
            this.setState({
                collaborativeDocs: this.state.collaborativeDocs.filter(doc =>
                    `${doc.owner}/${doc.permlink}` !== documentKey
                )
            }, 'remove-deleted-document');
        }

        // Emit event for other components to clear their caches
        this.emit('permissionCacheInvalidated', { documentKey });
    }

    /**
     * Handle external username change (e.g., from v3-user.js)
     * This is called when the site-wide username changes (login vs authentication)
     *
     * ✅ GOLDEN RULE #5: Login ≠ Authentication
     * ✅ GOLDEN RULE #7: Single Responsibility - Only handles auth header cleanup
     *
     * @param {string|null} newUsername - The new username (null for logout)
     * @param {string} source - Where the change originated from
     */
    handleExternalUsernameChange(newUsername, source = 'external') {
        console.log('🔄 AUTH: Handling external username change', {
            currentUser: this.state.user,
            newUsername,
            source,
            hasAuthHeaders: !!this.state.authHeaders,
            headersAccount: this.state.authHeaders ? getAuthAccount(this.state.authHeaders) : null
        });

        // ✅ OFFLINE-FIRST: Handle username change without clearing auth headers
        if (this.state.user !== newUsername) {
            const oldUser = this.state.user;

            // ✅ GOLDEN RULE #1: Emit pre-change event for preparation
            this.emit('pre-username-change', {
                oldUsername: oldUser,
                newUsername,
                source
            });

            // ✅ SECURITY + OFFLINE-FIRST: Validate auth headers match new user
            // Headers remain in storage but cleared from active state if mismatched
            if (this.state.authHeaders) {
                const headersAccount = getAuthAccount(this.state.authHeaders);

                if (headersAccount !== newUsername) {
                    console.log('🔐 SECURITY: Clearing mismatched auth headers on username change', {
                        oldUser: oldUser,
                        newUser: newUsername,
                        headersAccount,
                        action: 'Headers remain in storage, cleared from active state'
                    });

                    // Clear from active state for security
                    this.setState({ authHeaders: null }, 'security-username-change');

                    // Emit event to notify components
                    this.emit('authHeadersCleared', {
                        reason: 'username-change',
                        oldUser: oldUser,
                        newUser: newUsername
                    });
                } else {
                    console.log('✅ SECURITY: Auth headers match new username - keeping active', {
                        newUsername,
                        headersAccount
                    });
                }
            }

            // Now update the user through setUser (which handles all the state transitions)
            this.setUser(newUsername);

            // ✅ GOLDEN RULE #1: Emit completion event
            this.emit('username-change-complete', {
                username: newUsername,
                oldUsername: oldUser,
                source
            });
        }
    }

    // ===== DOCUMENT ACCESS CONTROL =====

    /**
     * Check if user has access to a document
     * This is the main entry point for all document access checks
     *
     * RECURSION PROTECTION: This method uses _checkingAccess flag to prevent infinite loops
     * that can occur when access checks trigger events (like clearDocument or accessDenied)
     * that might cause listeners to check access again.
     *
     * @param {Object} doc - Document to check access for
     * @param {string} context - Context for the access check (for debugging)
     * @returns {Promise<{hasAccess: boolean, reason: string, canAuthenticate?: Object}>}
     */
    async checkDocumentAccess(doc, context = 'unknown') {
        console.log('🔴 AUTH-FLOW: checkDocumentAccess called', {
            doc,
            context,
            user: this.state.user,
            isAuthenticated: this.isAuthenticated(),
            recursionGuardActive: this._accessCheckContext.active,
            activeContext: this._accessCheckContext.context,
            depth: this._accessCheckContext.depth,
            timestamp: new Date().toISOString()
        });

        // ✅ DIAGNOSTIC LOGGING
        console.log('🔍 ACCESS CHECK DIAGNOSTIC:', {
            doc,
            context,
            currentUser: this.state.user,
            isAuthenticated: this.isAuthenticated(),
            willCheckAccess: !!doc
        });

        if (!doc) {
            return { hasAccess: false, reason: 'no-document' };
        }

        // CONTEXT-AWARE RECURSION GUARD
        const allowedNestedContexts = ['user-switch', 'permission-refresh'];
        const maxDepth = 3; // Prevent runaway recursion

        if (this._accessCheckContext.active) {
            // Allow certain contexts to proceed even when guard is active
            if (!allowedNestedContexts.includes(context)) {
                if (this.DEBUG) console.log('🔐 AuthStateManager: Preventing recursive checkDocumentAccess call', {
                    currentContext: this._accessCheckContext.context,
                    attemptedContext: context
                });
                return { hasAccess: false, reason: 'recursive-call' };
            }

            // For allowed contexts, increment depth
            this._accessCheckContext.depth++;

            // Check if we've exceeded max depth
            if (this._accessCheckContext.depth > maxDepth) {
                console.error('🔐 AuthStateManager: Max recursion depth exceeded', {
                    depth: this._accessCheckContext.depth,
                    context: context,
                    activeContext: this._accessCheckContext.context
                });
                return { hasAccess: false, reason: 'max-recursion-depth' };
            }
        }

        // Reset accessDenialHandling if we're not in the middle of handling one
        // This prevents the flag from getting stuck
        if (this.state.accessDenialHandling && context === 'user-switch') {
            if (this.DEBUG) console.log('🔐 Resetting accessDenialHandling for user switch');
            this.setState({ accessDenialHandling: false }, 'reset-access-denial-user-switch');
        }

        // For logout context, we need special handling to ensure auth modal shows
        if (context === 'logout' && !this.state.user) {
            // Document needs to be cleared for security
            this.emit('clearDocument', { document: doc, reason: 'logout' });

            // But we still need to show auth modal for collaborative documents
            if (doc.type === 'collaborative') {
                this.setState({ accessDenialHandling: true }, 'set-access-denial-logout');

                // Emit both events in sequence - listeners will handle them in order
                this.emit('accessDenied', {
                    document: doc,
                    reason: 'no-user',
                    canAuthenticate: { canAuth: true, reason: 'login-required' }
                });

                // ✅ EVENT-DRIVEN: Set up event listeners for modal close
                this.scheduleAccessDenialReset();
            }

            return { hasAccess: false, reason: 'logout' };
        }

        // Set up context tracking
        const wasActive = this._accessCheckContext.active;
        const previousContext = this._accessCheckContext.context;
        const previousDepth = this._accessCheckContext.depth;

        this._accessCheckContext.active = true;
        this._accessCheckContext.context = context;
        if (!wasActive) {
            this._accessCheckContext.depth = 0;
        }

        try {
            // Check if document should be cleared first
            const shouldClear = await this.shouldClearDocument(doc);
            if (shouldClear.shouldClear) {
                this.emit('clearDocument', { document: doc, reason: shouldClear.reason });
            }

            // Evaluate access
            const access = await this.evaluateAccess(doc);

            // Handle access denial
            if (!access.hasAccess) {
                // ✅ DIAGNOSTIC LOGGING
                console.log('🔍 ACCESS CHECK DIAGNOSTIC:', {
                    step: 'access-denied',
                    willEmitAccessDenied: true,
                    document: doc,
                    reason: access.reason,
                    canAuthenticate: access.canAuthenticate,
                    context
                });

                this.setState({ accessDenialHandling: true }, 'set-access-denial-check');
                this.emit('accessDenied', {
                    document: doc,
                    reason: access.reason,
                    permissionLevel: access.permissionLevel,
                    canAuthenticate: access.canAuthenticate
                });

                // ✅ EVENT-DRIVEN: Set up event listeners for modal close
                this.scheduleAccessDenialReset();
            } else {
                // Reset accessDenialHandling on successful access
                if (this.state.accessDenialHandling) {
                    if (this.DEBUG) console.log('🔐 Resetting accessDenialHandling after successful access');
                    this.setState({ accessDenialHandling: false }, 'reset-access-denial-success');
                }
            }

            return access;
        } finally {
            // Restore previous context state
            if (!wasActive) {
                this._accessCheckContext.active = false;
                this._accessCheckContext.context = null;
                this._accessCheckContext.depth = 0;
            } else {
                this._accessCheckContext.context = previousContext;
                this._accessCheckContext.depth = previousDepth;
            }
        }
    }

    /**
     * Determine if a document should be cleared from view
     */
    async shouldClearDocument(doc) {
        // Always clear on user switch if document is loaded
        if (this.state.currentDocument && this.state.currentDocument !== doc) {
            const currentAccess = await this.evaluateAccess(this.state.currentDocument);
            if (!currentAccess.hasAccess) {
                return { shouldClear: true, reason: 'user-lost-access' };
            }
        }

        // Clear if user logged out
        if (!this.state.user && this.state.currentDocument) {
            return { shouldClear: true, reason: 'user-logged-out' };
        }

        // Clear if switching between users and no access
        const access = await this.evaluateAccess(doc);
        if (!access.hasAccess && this.state.currentDocument) {
            return { shouldClear: true, reason: 'no-access' };
        }

        return { shouldClear: false };
    }

    /**
     * Evaluate if user has access to a document
     *
     * RECURSION PROTECTION: This method uses _evaluatingAccess flag to prevent infinite loops
     * that can occur when permission checks trigger state changes (like cache updates)
     * that might cause Vue watchers to re-evaluate access.
     *
     * @param {Object} doc - Document to evaluate access for
     * @returns {Promise<{hasAccess: boolean, reason: string, canAuthenticate?: Object}>}
     */
    async evaluateAccess(doc) {
        console.log('🔴 CACHE-TEST: evaluateAccess called', {
            doc,
            user: this.state.user,
            isAuthenticated: this.isAuthenticated()
        });
        console.log('🔐 OFFLINE-LOAD: evaluateAccess called', {
            doc,
            user: this.state.user,
            isAuthenticated: this.isAuthenticated(),
            authState: this._stateWrapper.authState
        });

        // RECURSION GUARD: Prevent loops from state-change-triggered evaluations
        if (this._evaluatingAccess) {
            console.log('🔐 AuthStateManager: Recursive evaluateAccess detected, allowing readonly access for safety');
            // For recursive calls during offline cache check, allow readonly access
            // This prevents the second call from overriding the first successful result
            return {
                hasAccess: true,
                reason: 'recursive-call-allowed',
                permissionLevel: 'readonly',
                isOfflineMode: true
            };
        }

        this._evaluatingAccess = true;
        try {
            // Temp documents don't need authentication
            if (doc.type === 'temp') {
                return { hasAccess: true, reason: 'temp-document' };
            }

            // No user = no access
            if (!this.state.user) {
                return {
                    hasAccess: false,
                    reason: 'no-user',
                    canAuthenticate: { canAuth: true, reason: 'login-required' }
                };
            }

            // Local documents require ownership
            if (doc.type === 'local') {
                const hasAccess = this.state.user === doc.owner;
                return {
                    hasAccess,
                    reason: hasAccess ? 'is-owner' : 'not-owner',
                    canAuthenticate: hasAccess ? null : { canAuth: true, reason: 'switch-user' }
                };
            }

            // Collaborative documents require permission check
            if (doc.type === 'collaborative') {
                console.log('🔴 AUTH-FLOW: Checking collaborative document access', {
                    isAuthenticated: this.isAuthenticated(),
                    user: this.state.user,
                    doc: `${doc.owner}/${doc.permlink}`
                });

                // ✅ OFFLINE-FIRST: Check for IndexedDB cached version before requiring auth
                if (!this.isAuthenticated()) {
                    console.log('🔴 AUTH-FLOW: Not authenticated, checking offline cache', {
                        user: this.state.user,
                        doc: `${doc.owner}/${doc.permlink}`
                    });

                    // Check if we have a cached version in IndexedDB for this user
                    const hasOfflineCache = await this.checkOfflineCache(doc);

                    console.log('🔴 AUTH-FLOW: Offline cache check result', {
                        hasOfflineCache,
                        user: this.state.user,
                        doc: `${doc.owner}/${doc.permlink}`
                    });

                    if (hasOfflineCache) {
                        // 🔵 OFFLINE-CACHE-DEBUG: Directly check localStorage for offline scenario
                        // We do this here instead of in getCachedPermission to avoid auth flow issues
                        let permissionLevel = 'readonly'; // Default

                        try {
                            const documentId = `${doc.owner}/${doc.permlink}`;
                            const storedCache = this.cacheService ?
                                this.cacheService.getCachedUserPermissionLevel(documentId, this.state.user) : null;

                            if (storedCache && storedCache.level) {
                                permissionLevel = storedCache.level;
                                console.log('🔵 OFFLINE-CACHE-DEBUG: Found cached permission in localStorage', {
                                    documentId,
                                    user: this.state.user,
                                    cachedLevel: permissionLevel
                                });
                            } else {
                                console.log('🔵 OFFLINE-CACHE-DEBUG: No cached permission, using default readonly');
                            }
                        } catch (error) {
                            console.error('Error checking cached permission:', error);
                        }

                        console.log('🔐 OFFLINE-LOAD: Allowing cached access to document', {
                            document: `${doc.owner}/${doc.permlink}`,
                            user: this.state.user,
                            isAuthenticated: false,
                            permissionLevel
                        });

                        // Allow access with cached or default permission level
                        return {
                            hasAccess: true,
                            reason: 'offline-cache-available',
                            permissionLevel,
                            isOfflineMode: true,
                            canAuthenticate: { canAuth: true, reason: 'auth-for-sync' }
                        };
                    }

                    // No cache available - require authentication
                    return {
                        hasAccess: false,
                        reason: 'not-authenticated',
                        canAuthenticate: { canAuth: true, reason: 'auth-required' }
                    };
                }

                // Auth expired
                if (this.state.isAuthExpired) {
                    return {
                        hasAccess: false,
                        reason: 'auth-expired',
                        canAuthenticate: { canAuth: true, reason: 'auth-expired' }
                    };
                }

                // Check permissions
                const permissionResult = await this.checkCollaborativePermission(doc);
                if (!permissionResult.hasPermission) {
                    return {
                        hasAccess: false,
                        reason: 'no-permission',
                        permissionLevel: permissionResult.level,
                        canAuthenticate: { canAuth: true, reason: 'switch-user' }
                    };
                }

                return {
                    hasAccess: true,
                    reason: 'has-permission',
                    permissionLevel: permissionResult.level
                };
            }

            return { hasAccess: false, reason: 'unknown-document-type' };
        } finally {
            this._evaluatingAccess = false;
        }
    }

    /**
     * Check if document exists in IndexedDB cache for current user
     * @param {Object} doc - Document to check cache for
     * @returns {Promise<boolean>} True if cached version exists
     */
    async checkOfflineCache(doc) {
        console.log('🔴 CACHE-TEST: checkOfflineCache called', {
            doc,
            user: this.state.user,
            documentPath: `${doc?.owner}/${doc?.permlink}`
        });
        console.log('🔐 OFFLINE-LOAD: checkOfflineCache called', {
            doc,
            user: this.state.user,
            hasDoc: !!doc,
            hasOwner: doc?.owner,
            hasPermlink: doc?.permlink,
            hasUser: !!this.state.user
        });

        if (!doc || !doc.owner || !doc.permlink || !this.state.user) {
            console.log('🔐 OFFLINE-LOAD: checkOfflineCache returning false - missing required data');
            return false;
        }

        try {
            // Check if IndexedDB is available
            if (!window.indexedDB) {
                console.log('🔐 OFFLINE-LOAD: IndexedDB not available');
                return false;
            }

            // Build the expected database name for this user and document
            const dbName = `${this.state.user}__${doc.owner}/${doc.permlink}`;

            console.log('🔴 CACHE-TEST: Looking for IndexedDB cache', {
                expectedDbName: dbName,
                user: this.state.user,
                documentPath: `${doc.owner}/${doc.permlink}`
            });
            console.log('🔐 OFFLINE-LOAD: Looking for IndexedDB cache', {
                expectedDbName: dbName,
                user: this.state.user,
                documentPath: `${doc.owner}/${doc.permlink}`,
                urlBeingAccessed: window.location.search
            });

            // 🔵 CACHE-PERSIST: Enhanced cache check logging
            console.log('🔵 CACHE-PERSIST: Starting cache check', {
                expectedDbName: dbName,
                user: this.state.user,
                document: `${doc.owner}/${doc.permlink}`,
                timestamp: new Date().toISOString()
            });

            // ✅ RULE 9 FIX: Check if indexedDB.databases is available (consistent with tiptap-editor-modular.js)
            let hasCache = false;

            if (indexedDB.databases) {
                // Modern browsers that support databases() API
                try {
                    const databases = await indexedDB.databases();

                    console.log('🔐 OFFLINE-LOAD: Available IndexedDB databases', {
                        databases: databases.map(db => db.name),
                        totalCount: databases.length,
                        lookingFor: dbName,
                        matchFound: databases.some(db => db.name === dbName)
                    });

                    hasCache = databases.some(db => db.name === dbName);

                    if (!hasCache) {
                        // Log the actual database names for debugging
                        console.log('🔴 CACHE-TEST: Available databases:', databases.map(db => db.name));
                        console.log('🔴 CACHE-TEST: ❌ No matching cache found via databases() API', {
                            expectedDbName: dbName,
                            availableDbs: databases.map(db => db.name)
                        });
                    }
                } catch (error) {
                    console.warn('⚠️ OFFLINE-FIRST: Error using databases() API, falling back to direct open', error);
                }
            } else {
                console.log('🔴 CACHE-TEST: indexedDB.databases() not available, using fallback');
            }

            // ✅ FALLBACK: Try to open the database directly (works in all browsers)
            if (!hasCache) {
                console.log('🔴 CACHE-TEST: Attempting direct database open as fallback', { dbName });

                try {
                    // Try to open the database - if it exists, this will succeed
                    const openRequest = indexedDB.open(dbName);

                    await new Promise((resolve, reject) => {
                        openRequest.onsuccess = () => {
                            // Database exists and opened successfully
                            hasCache = true;
                            // Close the database immediately
                            openRequest.result.close();
                            console.log('🔴 CACHE-TEST: ✅ Database opened successfully via fallback');
                            resolve();
                        };

                        openRequest.onerror = () => {
                            // Database doesn't exist or can't be opened
                            console.log('🔴 CACHE-TEST: Database open failed - cache does not exist');
                            resolve(); // Still resolve, just with hasCache = false
                        };

                        openRequest.onupgradeneeded = () => {
                            // This means the database doesn't exist (version 0 -> 1)
                            console.log('🔴 CACHE-TEST: Database upgrade needed - cache does not exist');
                            hasCache = false;
                            // Abort the transaction to avoid creating the database
                            openRequest.transaction.abort();
                            resolve();
                        };

                        // ✅ GOLDEN RULE 6: Use requestAnimationFrame-based timeout
                        const frames = Math.ceil(1000 / 16); // ~63 frames for 1 second at 60fps
                        let frameCount = 0;
                        const checkTimeout = () => {
                            if (++frameCount >= frames) {
                                console.log('🔴 CACHE-TEST: Database open timed out');
                                resolve();
                            } else {
                                requestAnimationFrame(checkTimeout);
                            }
                        };
                        requestAnimationFrame(checkTimeout);
                    });

                    console.log('🔴 CACHE-TEST: Direct database open result', {
                        dbName,
                        exists: hasCache
                    });
                } catch (error) {
                    console.warn('⚠️ OFFLINE-FIRST: Error trying to open database directly', error);
                }
            }

            if (hasCache) {
                console.log('🔴 CACHE-TEST: ✅ Found matching IndexedDB cache', {
                    dbName,
                    user: this.state.user
                });
                console.log('🔵 CACHE-PERSIST: ✅ Cache FOUND', {
                    dbName,
                    user: this.state.user,
                    document: `${doc.owner}/${doc.permlink}`
                });
                console.log('🔐 OFFLINE-LOAD: ✅ Found matching IndexedDB cache', {
                    dbName,
                    user: this.state.user,
                    document: `${doc.owner}/${doc.permlink}`
                });
            } else {
                console.log('🔴 CACHE-TEST: ❌ No matching cache found after all checks', {
                    expectedDbName: dbName,
                    user: this.state.user,
                    document: `${doc.owner}/${doc.permlink}`
                });
                console.log('🔵 CACHE-PERSIST: ❌ Cache NOT FOUND', {
                    expectedDbName: dbName,
                    user: this.state.user,
                    document: `${doc.owner}/${doc.permlink}`
                });
                console.log('🔐 OFFLINE-LOAD: ❌ No matching cache found', {
                    expectedDbName: dbName,
                    user: this.state.user,
                    document: `${doc.owner}/${doc.permlink}`
                });
            }

            console.log('🔵 CACHE-PERSIST: Cache check complete', {
                dbName,
                result: hasCache ? 'FOUND' : 'NOT FOUND'
            });

            return hasCache;
        } catch (error) {
            console.warn('⚠️ OFFLINE-FIRST: Error checking IndexedDB cache', error);
            return false;
        }
    }

    /**
     * Check if user has permission for a collaborative document
     * @returns {Object} { hasPermission: boolean, level: string }
     */
    async checkCollaborativePermission(doc) {
        // Skip permission check during user change
        if (this._userChanging || !this.state.user) {
            console.log('🔄 Skipping permission check during user change');
            return { hasAccess: false, accessType: 'no-access' };
        }

        // Include username in cache key to prevent cross-user cache contamination
        const cacheKey = `${this.state.user}:${doc.owner}/${doc.permlink}`;

        // ✅ DIAGNOSTIC LOGGING
        console.log('🔍 ACCESS CHECK DIAGNOSTIC:', {
            method: 'checkCollaborativePermission',
            cacheKey,
            currentUser: this.state.user,
            hasCacheEntry: this.state.permissionCache.has(cacheKey)
        });

        // Check cache first
        if (this.state.permissionCache.has(cacheKey)) {
            const cached = this.state.permissionCache.get(cacheKey);
            if (Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minute cache
                console.log('🔍 ACCESS CHECK DIAGNOSTIC:', {
                    step: 'cache-hit',
                    cacheKey,
                    cachedValue: cached,
                    cacheAge: Math.round((Date.now() - cached.timestamp) / 1000) + 's'
                });
                // Support both old boolean format and new object format
                if (cached.level) {
                    // New format with level - return as is
                    return cached;
                } else if (typeof cached.hasPermission === 'boolean') {
                    // Legacy cache format - return with default level
                    return {
                        hasPermission: cached.hasPermission,
                        level: cached.hasPermission ? 'readonly' : 'no-access'
                    };
                }
                // Fallback - treat as legacy format
                return {
                    hasPermission: !!cached.hasPermission,
                    level: cached.hasPermission ? 'readonly' : 'no-access'
                };
            }
        }

        // Check if user is owner
        if (this.state.user === doc.owner) {
            const result = { hasPermission: true, level: 'owner', timestamp: Date.now() };
            this.state.permissionCache.set(cacheKey, result);

            // Persist to localStorage
            if (this.cacheService) {
                this.cacheService.cacheUserPermissionLevel(`${doc.owner}/${doc.permlink}`, this.state.user, result);
            }

            return result;
        }

        // Check collaborative docs list (may have permission data)
        // BUT FIRST - check if collaborative docs have been loaded yet
        if (!this.state.collaborativeDocsLoaded) {
            console.log('🔍 ACCESS CHECK DIAGNOSTIC:', {
                step: 'docs-not-loaded',
                cacheKey,
                isLoading: this.state.collaborativeDocsLoading,
                willCheckLocalStorage: true
            });

            // Check localStorage cache via CacheService FIRST (even during loading)
            try {
                // Try to get cached permission for this specific user and document
                const cachedPermission = this.cacheService.getCachedUserPermissionLevel(
                    `${doc.owner}/${doc.permlink}`,
                    this.state.user
                );

                if (cachedPermission) {
                    console.log('🔍 ACCESS CHECK DIAGNOSTIC:', {
                        step: 'localStorage-cache-hit',
                        cacheKey,
                        cachedPermission,
                        source: 'CacheService',
                        isLoading: this.state.collaborativeDocsLoading
                    });

                    // Update memory cache with localStorage data
                    this.state.permissionCache.set(cacheKey, cachedPermission);
                    return cachedPermission;
                }
            } catch (error) {
                console.warn('Failed to check localStorage cache:', error);
            }

            // If no cache found and docs are still loading, return loading state
            if (this.state.collaborativeDocsLoading) {
                return { loading: true, hasPermission: null, level: null };
            }

            // Don't return no-access yet - continue with API check below
        } else {
            // Collaborative docs are loaded, check them normally
            const collabDoc = this.state.collaborativeDocs.find(d =>
                d.owner === doc.owner && d.permlink === doc.permlink
            );

            if (collabDoc) {
                // Check if collabDoc has permission level data
                const level = collabDoc.permission_level || collabDoc.permissionLevel || 'readonly';
                const result = { hasPermission: true, level, timestamp: Date.now() };
                this.state.permissionCache.set(cacheKey, result);

                // Persist to localStorage
                if (this.cacheService) {
                    this.cacheService.cacheUserPermissionLevel(`${doc.owner}/${doc.permlink}`, this.state.user, result);
                }

                return result;
            }
        }

        // If we have auth headers but haven't found permission yet, make API call
        // This is critical for the auth retry flow where collaborativeDocs might be empty
        if (this.state.authHeaders) {
            try {
                // Check if we have valid auth headers
                const validation = this.validateAuthHeaders(this.state.authHeaders);
                if (validation.isValid) {
                    // Make direct API call to check document info
                    const response = await fetch(`https://data.dlux.io/api/collaboration/info/${doc.owner}/${doc.permlink}`, {
                        headers: this.state.authHeaders
                    });

                    if (response.ok) {
                        const data = await response.json();
                        // If we got data back, user has at least read access
                        if (data && data.document) {
                            // Enhanced logging to see exact fields returned by server
                            console.log('🔍 ACCESS CHECK: Info API Response Fields', {
                                documentPath: `${doc.owner}/${doc.permlink}`,
                                responseKeys: Object.keys(data),
                                documentKeys: data.document ? Object.keys(data.document) : [],
                                hasAccessType: !!data.document?.accessType,
                                hasPermissionLevel: !!data.document?.permissionLevel,
                                hasAccessLevel: !!data.document?.access_level,
                                hasPermission_level: !!data.document?.permission_level,
                                accessType: data.document?.accessType || 'NOT_PROVIDED',
                                permissionLevel: data.document?.permissionLevel || 'NOT_PROVIDED',
                                permission_level: data.document?.permission_level || 'NOT_PROVIDED',
                                access_level: data.document?.access_level || 'NOT_PROVIDED',
                                fullResponse: data
                            });

                            // Extract permission level from API response
                            const permissionLevel = data.document?.accessType ||
                                                  data.document?.permission_level ||
                                                  data.document?.permissionLevel ||
                                                  data.document?.access_level ||
                                                  data.permission_level ||
                                                  data.permissionLevel ||
                                                  data.access_level ||
                                                  'readonly'; // Default to readonly if not specified

                            console.log('🔍 ACCESS CHECK DIAGNOSTIC:', {
                                step: 'api-success',
                                cacheKey,
                                settingCache: true,
                                extractedPermissionLevel: permissionLevel,
                                apiResponse: data
                            });

                            const result = { hasPermission: true, level: permissionLevel, timestamp: Date.now() };
                            this.state.permissionCache.set(cacheKey, result);

                            // Persist to localStorage
                            if (this.cacheService) {
                                this.cacheService.cacheUserPermissionLevel(`${doc.owner}/${doc.permlink}`, this.state.user, result);
                            }

                            return result;
                        }
                    } else if (response.status === 401 || response.status === 403) {
                        // Explicit no access (401 = unauthorized, 403 = forbidden)
                        const result = { hasPermission: false, level: 'no-access', timestamp: Date.now() };
                        this.state.permissionCache.set(cacheKey, result);

                        // Persist no-access to localStorage too
                        if (this.cacheService) {
                            this.cacheService.cacheUserPermissionLevel(`${doc.owner}/${doc.permlink}`, this.state.user, result);
                        }

                        return result;
                    }
                }
            } catch (error) {
                console.warn('Failed to check individual document permission:', error);
            }
        }

        // No permission found
        const result = { hasPermission: false, level: 'no-access', timestamp: Date.now() };
        this.state.permissionCache.set(cacheKey, result);

        // Don't persist no-access when docs aren't loaded - it might be temporary
        if (this.state.collaborativeDocsLoaded && this.cacheService) {
            this.cacheService.cacheUserPermissionLevel(`${doc.owner}/${doc.permlink}`, this.state.user, result);
        }

        return result;
    }

    // ===== AUTH HEADER CACHING =====

    /**
     * Cache auth headers for a user directly in sessionStorage
     * @param {string} username - Username to cache headers for
     * @param {Object} headers - Auth headers to cache
     */
    cacheAuthHeaders(username, headers) {
        if (!username || !headers) return;

        try {
            // Handle sessionStorage directly to avoid circular dependency
            const storageKey = `collaborationAuthHeaders_${username}`;
            sessionStorage.setItem(storageKey, JSON.stringify(headers));

            if (this.DEBUG) {
                console.log('🔑 Cached auth headers for user:', username, { storageKey });
            }
        } catch (error) {
            console.warn('Failed to cache auth headers:', error);
        }
    }

    /**
     * Get cached auth headers for a user directly from sessionStorage
     * @param {string} username - Username to get headers for
     * @returns {Object|null} Cached headers or null
     */
    getCachedAuthHeaders(username) {
        if (!username) return null;

        try {
            // Handle sessionStorage directly to avoid circular dependency
            const storageKey = `collaborationAuthHeaders_${username}`;
            const stored = sessionStorage.getItem(storageKey);

            if (!stored) return null;

            const headers = JSON.parse(stored);

            if (headers && this.DEBUG) {
                console.log('🔑 Retrieved cached auth headers for user:', username);
            }

            return headers;
        } catch (error) {
            console.warn('Failed to retrieve cached auth headers:', error);
        }

        return null;
    }

    /**
     * Clear cached auth headers for a user directly from sessionStorage
     * @param {string} username - Username to clear headers for
     */
    clearCachedAuthHeaders(username) {
        if (!username) return;

        try {
            // Handle sessionStorage directly to avoid circular dependency
            const storageKey = `collaborationAuthHeaders_${username}`;
            sessionStorage.removeItem(storageKey);

            if (this.DEBUG) {
                console.log('🔑 Cleared cached auth headers for user:', username, { storageKey });
            }
        } catch (error) {
            console.warn('Failed to clear cached auth headers:', error);
        }
    }

    /**
     * Clear auth headers for a user (both memory and storage)
     * @param {string} username - Username to clear headers for
     */
    clearAuthHeaders(username) {
        // Clear from memory if it's the current user
        if (username === this.state.user) {
            this.setState({ authHeaders: null }, 'clear-auth-headers');
        }

        // Clear from sessionStorage
        this.clearCachedAuthHeaders(username);

        if (this.DEBUG) {
            console.log('🔑 Cleared auth headers for user:', username);
        }
    }

    // ===== AUTH FLOW MANAGEMENT =====

    /**
     * Get the permission level for a document
     * @param {Object} doc - Document to check
     * @returns {Promise<string>} Permission level (owner, postable, editable, readonly, no-access)
     */
    async getDocumentPermissionLevel(doc) {
        if (!doc) return 'no-access';

        // For non-collaborative documents, just check ownership
        if (doc.type !== 'collaborative') {
            if (doc.type === 'temp') return 'owner';
            if (doc.type === 'local') {
                return this.state.user === doc.owner ? 'owner' : 'no-access';
            }
            return 'no-access';
        }

        // For collaborative documents, check permissions
        const permissionResult = await this.checkCollaborativePermission(doc);
        return permissionResult.level || 'no-access';
    }

    /**
     * Get cached permission level for a document
     * @param {string} owner - Document owner
     * @param {string} permlink - Document permlink
     * @returns {string|null} Permission level or null if not cached/expired
     */
    getCachedPermission(owner, permlink) {
        if (!this.state.user || !owner || !permlink) return null;

        const cacheKey = `${this.state.user}:${owner}/${permlink}`;

        console.log('🔵 OFFLINE-CACHE-DEBUG: getCachedPermission called', {
            owner,
            permlink,
            user: this.state.user,
            cacheKey,
            hasMemoryCache: this.state.permissionCache.has(cacheKey),
            memoryCacheSize: this.state.permissionCache.size
        });

        if (this.state.permissionCache.has(cacheKey)) {
            const cached = this.state.permissionCache.get(cacheKey);

            // Let CacheService handle expiration - just check if we have data
            if (cached) {
                // Support both new format (with level) and legacy format
                if (cached.level) {
                    return cached.level;
                } else if (typeof cached.hasPermission === 'boolean') {
                    return cached.hasPermission ? 'readonly' : 'no-access';
                }
                // Fallback
                return cached.hasPermission ? 'readonly' : 'no-access';
            }
        }

        // TEMPORARILY DISABLED: localStorage check causing auth hang
        // TODO: Fix circular dependency issue with CacheService
        // return null for now to fix auth flow
        return null;
    }

    /**
     * Cache permission level for a file
     * @param {Object} file - File object with owner and permlink
     * @param {string} permissionLevel - Permission level to cache
     */
    cacheFilePermission(file, permissionLevel) {
        if (!file || !file.owner || !file.permlink || !permissionLevel) return;

        const cacheKey = `${this.state.user}:${file.owner}/${file.permlink}`;
        const cacheData = {
            level: permissionLevel,
            timestamp: Date.now(),
            username: this.state.user
        };

        // Store in memory cache
        this.state.permissionCache.set(cacheKey, cacheData);

        // Also persist to localStorage via CacheService
        const documentId = `${file.owner}/${file.permlink}`;
        if (this.cacheService) {
            this.cacheService.cacheUserPermissionLevel(documentId, this.state.user, {
                level: permissionLevel,
                hasPermission: permissionLevel !== 'no-access',
                timestamp: Date.now()
            });
        }

        if (this.DEBUG) {
            console.log('🔐 AuthStateManager: Cached file permission', {
                file: `${file.owner}/${file.permlink}`,
                permissionLevel,
                user: this.state.user
            });
        }
    }

    /**
     * Get cached permission for a file
     * @param {Object} file - File object with owner and permlink
     * @returns {Object|null} Cached permission object with level and timestamp or null
     */
    getCachedFilePermission(file) {
        if (!file || !file.owner || !file.permlink) return null;

        const cacheKey = `${this.state.user}:${file.owner}/${file.permlink}`;
        const cached = this.state.permissionCache.get(cacheKey);

        console.log('🔵 OFFLINE-CACHE-DEBUG: getCachedFilePermission called', {
            file,
            user: this.state.user,
            cacheKey,
            hasMemoryCache: !!cached,
            memoryContent: cached
        });

        // Check memory cache first (no expiration check - trust CacheService)
        if (cached && cached.level) {
            return {
                level: cached.level,
                timestamp: cached.timestamp,
                username: cached.username
            };
        }

        // Check localStorage cache as fallback - CacheService handles expiration
        const documentId = `${file.owner}/${file.permlink}`;
        const storedCache = this.cacheService ? this.cacheService.getCachedUserPermissionLevel(documentId, this.state.user) : null;

        console.log('🔵 OFFLINE-CACHE-DEBUG: localStorage check', {
            documentId,
            user: this.state.user,
            hasStoredCache: !!storedCache,
            storedContent: storedCache
        });

        if (storedCache) {
            // Refresh memory cache from localStorage
            this.state.permissionCache.set(cacheKey, {
                level: storedCache.level,
                timestamp: storedCache.timestamp || Date.now(),
                username: this.state.user
            });
            return storedCache;
        }

        return null;
    }

    /**
     * Clear all file permission caches
     * @param {Object} options - Options for cache clearing
     * @param {boolean} options.forceOnline - Force clear even when offline
     */
    clearFilePermissionCache(options = {}) {
        const { forceOnline = false } = options;

        // Check if we should preserve caches when offline
        if (!navigator.onLine && !forceOnline) {
            if (this.DEBUG) {
                console.log('📱 AuthStateManager: Offline - preserving permission cache for work continuity');
            }
            return;
        }

        // Clear memory cache
        this.state.permissionCache.clear();

        // Clear localStorage caches for current user
        if (this.state.user && this.cacheService) {
            this.cacheService.invalidateUserCaches(this.state.user);
        }

        if (this.DEBUG) {
            console.log('🔐 AuthStateManager: Cleared all file permission caches');
        }
    }

    /**
     * Handle user logout
     * ✅ OFFLINE-FIRST: Only clear auth headers, preserve all other data
     */
    logout() {
        console.log('🚪 AuthStateManager: User logout initiated');

        const currentUser = this.state.user;

        // 🔵 CACHE-PERSIST: Log databases before logout
        if (window.indexedDB && window.indexedDB.databases) {
            window.indexedDB.databases().then(dbs => {
                console.log('🔵 CACHE-PERSIST: Databases BEFORE logout', {
                    username: currentUser,
                    databaseCount: dbs.length,
                    databases: dbs.map(db => db.name),
                    timestamp: new Date().toISOString()
                });
            });
        }

        // Clear document first
        if (this.state.currentDocument) {
            this.emit('clearDocument', { reason: 'logout' });
        }

        // ✅ OFFLINE-FIRST: Clear auth headers ONLY for the current user
        // This maintains security while preserving offline work capability
        if (currentUser && this.cacheService) {
            console.log('🔐 Clearing auth headers for logout user:', currentUser);
            this.cacheService.clearAuthHeaders(currentUser);
        }

        // Clear user state
        this.setUser(null);
        this.setAuthHeaders(null);

        // ✅ OFFLINE-FIRST: Don't clear these caches - preserve for when user returns
        // - Permission cache: User can see their permissions when they log back in
        // - Document metadata: User can access their documents offline
        // - Document access rules: Preserved for consistency
        console.log('📱 OFFLINE-FIRST: Preserving caches for future offline access:', {
            preserving: [
                'Permission cache (resume with correct access levels)',
                'Document metadata (instant document access)',
                'Document access rules (consistent behavior)'
            ]
        });

        // 🔵 CACHE-PERSIST: Log databases after logout
        if (window.indexedDB && window.indexedDB.databases) {
            // ✅ GOLDEN RULE 6: Use requestAnimationFrame instead of setTimeout
            // Wait ~6 frames (~100ms at 60fps) for logout to complete
            let frameCount = 0;
            const checkDatabases = () => {
                if (++frameCount >= 6) {
                    window.indexedDB.databases().then(dbs => {
                        console.log('🔵 CACHE-PERSIST: Databases AFTER logout', {
                            previousUser: currentUser,
                            databaseCount: dbs.length,
                            databases: dbs.map(db => db.name),
                            timestamp: new Date().toISOString()
                        });
                    });
                } else {
                    requestAnimationFrame(checkDatabases);
                }
            };
            requestAnimationFrame(checkDatabases); // Small delay to ensure logout operations complete
        }

        // Only clear auth retry map as it's session-specific
        this.authRetryMap.clear();

        // Emit logout event
        this.emit('logout');
    }

    /**
     * Handle authentication retry
     */
    async retryAuthentication(documentContext) {
        const retryKey = `${this.state.user}-${documentContext.owner}/${documentContext.permlink}`;

        // Check retry limit
        const previousRetry = this.authRetryMap.get(retryKey);
        if (previousRetry && previousRetry.count >= 3) {
            return { success: false, reason: 'max-retries-exceeded' };
        }

        // Update retry count
        this.authRetryMap.set(retryKey, {
            count: (previousRetry?.count || 0) + 1,
            timestamp: Date.now()
        });

        // Emit retry event
        this.emit('authRetry', { document: documentContext });

        return { success: true };
    }

    // ===== EVENT MANAGEMENT =====

    /**
     * Emit an event
     */
    emit(event, detail) {
        if (this.DEBUG) {
            console.log(`🔔 AuthStateManager: Emitting ${event}`, detail);
        }

        // Dispatch to internal EventTarget
        this.events.dispatchEvent(new CustomEvent(event, { detail }));

        // ✅ FIX: Also dispatch to window for cross-boundary events
        // This enables CacheService and other services to receive these events
        const crossBoundaryEvents = ['userChanged', 'authHeadersCleared', 'logout', 'permissionCacheInvalidated'];
        if (crossBoundaryEvents.includes(event) && typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent(event, { detail }));
            if (this.DEBUG) {
                console.log(`🌐 AuthStateManager: Also dispatched ${event} to window for cross-boundary communication`);
            }
        }
    }

    /**
     * Add event listener
     */
    on(event, handler) {
        this.events.addEventListener(event, handler);
    }

    /**
     * Add one-time event listener
     */
    once(event, handler) {
        const wrappedHandler = (e) => {
            handler(e);
            this.off(event, wrappedHandler);
        };
        this.on(event, wrappedHandler);
    }

    /**
     * Remove event listener
     */
    off(event, handler) {
        this.events.removeEventListener(event, handler);
    }

    // ===== UTILITY METHODS =====

    /**
     * Clear all caches
     */
    clearCaches() {
        this.state.permissionCache.clear();
        this.documentAccessRules.clear();
        this.authRetryMap.clear();
    }

    /**
     * Clear stale permission cache entries for a user
     * This is called when new auth headers are set to ensure fresh permission checks
     */
    clearStalePermissionCache(username) {
        if (!username) return;

        // Clear cached "no-access" entries for this user
        // This ensures that after authentication, permissions are checked fresh
        const keysToDelete = [];

        this.state.permissionCache.forEach((value, key) => {
            // If this cache entry shows no permission, clear it
            // so it can be re-checked with new auth headers
            if (!value.hasPermission) {
                keysToDelete.push(key);
            }
        });

        keysToDelete.forEach(key => {
            this.state.permissionCache.delete(key);
        });
    }

    /**
     * Get current state snapshot
     */
    getState() {
        return {
            ...this.state,
            cacheSize: this.state.permissionCache.size,
            retryMapSize: this.authRetryMap.size
        };
    }

    /**
     * Get the current authenticated user
     * @returns {string|null} The current username or null if not authenticated
     */
    getUser() {
        return this.state.user;
    }

    /**
     * Check if a given username is the current user
     * @param {string} username - Username to check
     * @returns {boolean} True if the username matches the current user
     */
    isCurrentUser(username) {
        return this.state.user === username;
    }

    /**
     * Validate auth headers structure and content
     * @param {Object} authHeaders - Auth headers object to validate
     * @param {string} expectedUser - Expected username (optional)
     * @returns {Object} Validation result with isValid flag and errors array
     */
    validateAuthHeaders(authHeaders, expectedUser = null) {
        // Use Layer 1 utility for basic structure validation
        const structureValidation = validateAuthHeaderStructure(authHeaders);
        if (!structureValidation.valid) {
            return { isValid: false, errors: structureValidation.errors };
        }

        const errors = [];

        // Account validation if expectedUser provided
        if (expectedUser && !authHeadersMatchAccount(authHeaders, expectedUser)) {
            errors.push(`Account mismatch: expected ${expectedUser}, got ${getAuthAccount(authHeaders)}`);
        }

        // Challenge validation (timestamp format and age)
        const challengeStr = getAuthChallenge(authHeaders);
        const challengeNum = parseInt(challengeStr);
        if (isNaN(challengeNum) || challengeNum.toString() !== challengeStr) {
            errors.push(`Invalid challenge format: ${challengeStr}`);
        } else {
            const challengeAge = calculateChallengeAge(authHeaders);
            const maxAge = 23 * 60 * 60; // 23 hours
            if (challengeAge > maxAge) {
                errors.push(`Challenge too old: ${challengeAge}s (max ${maxAge}s)`);
                this.setState({ isAuthExpired: true }, 'set-auth-expired-validation');
            }
            if (challengeAge < -300) { // 5 minutes future tolerance
                errors.push(`Challenge from future: ${challengeAge}s`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors: [...structureValidation.errors, ...errors],
            challengeAge: calculateChallengeAge(authHeaders)
        };
    }

    /**
     * Get challenge age from auth headers
     * @param {Object} authHeaders - Auth headers object
     * @returns {number|null} Challenge age in seconds, or null if invalid
     */
    getChallengeAge(authHeaders) {
        return calculateChallengeAge(authHeaders);
    }

    /**
     * Check if auth headers are expired
     * @param {Object} authHeaders - Auth headers object
     * @returns {boolean} True if expired (> 23 hours old)
     */
    isAuthHeadersExpired(authHeaders) {
        return areAuthHeadersExpired(authHeaders);
    }

    /**
     * Get the authenticated account from headers
     * @param {Object} authHeaders - Auth headers object
     * @returns {string|null} Account name or null
     */
    getAuthAccount(authHeaders) {
        return getAuthAccount(authHeaders);
    }

    /**
     * Get the signature from headers
     * @param {Object} authHeaders - Auth headers object
     * @returns {string|null} Signature or null
     */
    getAuthSignature(authHeaders) {
        return getAuthSignature(authHeaders);
    }

    /**
     * Get the challenge from headers
     * @param {Object} authHeaders - Auth headers object
     * @returns {string|null} Challenge or null
     */
    getAuthChallenge(authHeaders) {
        return getAuthChallenge(authHeaders);
    }

    /**
     * Get the public key from headers
     * @param {Object} authHeaders - Auth headers object
     * @returns {string|null} Public key or null
     */
    getAuthPubkey(authHeaders) {
        return getAuthPubkey(authHeaders);
    }

    /**
     * Check if auth headers have all required fields
     * @param {Object} authHeaders - Auth headers object
     * @returns {boolean} True if all fields present
     */
    hasAllAuthFields(authHeaders) {
        return hasAllAuthFields(authHeaders);
    }

    /**
     * Schedule reset of access denial handling flag
     * ✅ EVENT-DRIVEN: Sets up listeners for modal close events
     */
    scheduleAccessDenialReset() {
        // ✅ EVENT-DRIVEN: Listen for auth modal close events
        // These events should be emitted by the modal components
        const resetHandler = () => {
            if (this.state.accessDenialHandling) {
                console.log('🔐 Access denial handling reset by modal close event');
                this.resetAccessDenialHandling();
            }
        };

        // Listen for various modal close events
        this.once('authModalClosed', resetHandler);
        this.once('authCancelled', resetHandler);
        this.once('authCompleted', resetHandler);

        // Also listen for login modal close from v3-user.js
        if (typeof window !== 'undefined') {
            const loginModalHandler = () => {
                if (this.state.accessDenialHandling) {
                    console.log('🔐 Access denial handling reset by login modal close');
                    this.resetAccessDenialHandling();
                }
            };
            window.addEventListener('loginModalClosed', loginModalHandler, { once: true });
        }
    }

    /**
     * Reset access denial handling flag
     * Should be called by the component that handles the accessDenied event
     */
    resetAccessDenialHandling() {
        this.setState({ accessDenialHandling: false }, 'reset-access-denial-handling');

        // ✅ EVENT-DRIVEN: Remove any remaining event listeners
        this.off('authModalClosed', null);
        this.off('authCancelled', null);
        this.off('authCompleted', null);
    }

    // ===== GETTER METHODS FOR ENCAPSULATION =====
    // These methods provide controlled access to internal state
    // preventing direct manipulation and maintaining encapsulation

    /**
     * Get collaborative documents
     * @returns {Array} Array of collaborative documents
     */
    getCollaborativeDocs() {
        return this.state.collaborativeDocs || [];
    }

    /**
     * Check if auth headers are present
     * @returns {boolean} True if auth headers exist
     */
    hasAuthHeaders() {
        return !!this.state.authHeaders;
    }

    /**
     * Get current document
     * @returns {Object|null} Current document or null
     */
    getCurrentDocument() {
        return this.state.currentDocument;
    }

    /**
     * Clear specific document permission from cache
     * @param {string} owner - Document owner
     * @param {string} permlink - Document permlink
     */
    clearDocumentPermission(owner, permlink) {
        if (!owner || !permlink) return;

        const key = `${owner}/${permlink}`;

        // Clear from permission cache
        if (this.state.permissionCache && this.state.permissionCache.has(key)) {
            this.state.permissionCache.delete(key);

            if (this.DEBUG) {
                console.log('🔄 Cleared document permission from cache:', key);
            }
        }

        // Also clear from CacheService
        const documentKey = `${owner}/${permlink}`;
        const keys = cacheService.findKeysByPattern(k =>
            k.includes('dlux_permissions_cache') && k.includes(documentKey)
        );

        keys.forEach(k => cacheService.remove(k));
    }

    /**
     * Clear collaborative docs array
     * Used when forcing a fresh API check
     */
    clearCollaborativeDocs() {
        console.log('🔄 Clearing collaborative docs for fresh API check');
        this.setState({ collaborativeDocs: [] }, 'clear-collaborative-docs');
    }
}

// Create singleton instance
export const authStateManager = new AuthStateManager();

// Make available globally for integration with other services
if (typeof window !== 'undefined') {
    window.authStateManager = authStateManager;
}
