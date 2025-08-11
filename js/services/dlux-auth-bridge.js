/**
 * DLUX Authentication Bridge Service
 *
 * Provides a modular authentication system that can be shared across
 * multiple DLUX applications for collaborative features and cloud saves.
 *
 * Features:
 * - Reactive authentication state management
 * - Event-driven communication between components
 * - Framework-agnostic design (works with Vue 2, Vue 3, vanilla JS)
 * - Consistent authentication UX across all DLUX applications
 *
 * Usage:
 * ```javascript
 * import DLUXAuthBridge from '/js/services/dlux-auth-bridge.js';
 *
 * const authBridge = new DLUXAuthBridge();
 * authBridge.showAuthPrompt('login', { name: 'My Document' });
 * ```
 */

import { reactive } from '/js/vue.esm-browser.js';

/**
 * ARCHITECTURE NOTES - Event Emission Rules:
 *
 * Following Single Responsibility Principle (Golden Rule #7):
 * - setAuthHeaders: ONLY sets auth headers and state
 * - handleAuthAction: ONLY handles user UI actions
 * - emit events: ONLY from explicit user actions
 *
 * authRetryReady Event:
 * - ONLY emitted from explicit user actions:
 *   1. handleAuthAction('retry_check') - user clicks retry button
 *   2. handleLoginModalClosed (via v3-user) - user completes login
 * - NEVER emitted automatically from setAuthHeaders
 *
 * This prevents duplicate events, race conditions, and modal warnings
 */

// Debug flag to control logging
const DEBUG = false;

class DLUXAuthBridge {
    constructor() {
        // Add unique ID for debugging
        this.instanceId = `auth-bridge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Reactive authentication state
        this.authState = reactive({
            // Modal control
            showModal: false,
            showBackdrop: false,           // Controls backdrop visibility independently

            // Authentication context
            authPromptAction: null,        // 'login' | 'switch_account' | null
            pendingDocumentAccess: null,   // { name, owner, permlink, id, type }

            // User context
            account: null,                 // Current authenticated user

            // UI state
            isProcessing: false,          // Show loading spinner

            // ✅ STATE TRACKING: Distinguish initialization vs user changes
            isInitialized: false,         // Has setAccount been called at least once
            isInitialLoad: true,          // Is this the initial page load

            // ✅ CENTRALIZED AUTH HEADERS: Single source of truth for auth headers
            authHeaders: null,            // { 'x-account': '', 'x-challenge': '', 'x-signature': '', 'x-pubkey': '' }
            challengeAge: null,           // Age of auth challenge in seconds
            isAuthenticated: false,       // Has valid auth headers
            isAuthExpired: false,         // Are auth headers expired (>23 hours)

            // ✅ DUPLICATE PREVENTION: Track context to prevent duplicate authRetryReady events
            authRetryContext: null,       // Last retry context to ensure idempotency

            // ✅ MODAL TRANSITION: Track modal transitions for seamless UX
            modalTransition: {
                inProgress: false,         // Whether a modal transition is happening
                fromModal: null,           // Source modal ('auth' or 'login')
                toModal: null,             // Target modal ('auth' or 'login')
                expectReturn: false        // Whether we expect to return to auth modal
            }
        });

        // Event system for communication
        this.eventBus = new EventTarget();

        // State change callbacks
        this.stateChangeCallbacks = new Set();

        // ✅ ERROR RECOVERY: Removed timeout mechanism - modal stays open until user action

        // ✅ MODAL DEDUPLICATION: Track document being processed for access denial
        this.processingAccessDenial = null; // Document key being processed

        if (DEBUG) {
            console.log('🔑 DLUXAuthBridge initialized');
        }

        // ✅ GOLDEN RULE #1: Setup cross-boundary event listeners
        this.setupAuthStateManagerListeners();
    }

    /**
     * Setup event listeners for AuthStateManager events
     * ✅ GOLDEN RULE #1: Hybrid Architecture - Listen for events from services
     * ✅ GOLDEN RULE #5: Login ≠ Authentication - React to username changes
     */
    setupAuthStateManagerListeners() {
        // Prevent multiple setups
        if (this._authStateManagerSetup) {
            return;
        }

        // Check if authStateManager is available
        if (typeof window !== 'undefined' && window.authStateManager) {
            this._authStateManagerSetup = true;
            console.log('🔌 Setting up AuthStateManager listeners in DLUXAuthBridge');

            // Listen for username changes from AuthStateManager
            window.authStateManager.on('userChanged', (event) => {
                // ✅ FIX: Access event data from detail property (CustomEvent structure)
                const data = event.detail || {};

                console.log('🔄 AUTH BRIDGE: Received userChanged event', {
                    oldUsername: data.oldUser,
                    newUsername: data.newUser,
                    source: data.source,
                    currentAccount: this.authState.account,
                    hasPendingAccess: !!this.authState.pendingDocumentAccess
                });

                // ✅ FIX: Validate new user before syncing to prevent undefined/null sync
                // This prevents the auth bridge from entering invalid states
                if (!data.newUser || data.newUser === 'undefined' || data.newUser === 'null') {
                    console.warn('⚠️ AUTH BRIDGE: Ignoring invalid userChanged event', {
                        invalidNewUser: data.newUser,
                        currentAccount: this.authState.account,
                        reason: 'New user is null/undefined - maintaining current state'
                    });
                    return; // Don't sync to invalid user
                }

                // ✅ RULE 5: Clear auth headers when user changes
                const currentHeaders = this.getAuthHeaders();
                if (this.authState.account !== data.newUser && currentHeaders) {
                    console.log('🔄 AUTH BRIDGE: User changed, clearing old auth headers', {
                        oldUser: this.authState.account,
                        newUser: data.newUser,
                        hadHeaders: !!currentHeaders
                    });
                    // AuthStateManager already handles clearing headers on user change
                    // Just sync local state
                    // Don't store auth headers locally - AuthStateManager is single source of truth
                    this.authState.isAuthenticated = false;
                    this.authState.isAuthExpired = false;
                    this.authState.challengeAge = null;
                }

                // ✅ GOLDEN RULE #3: Single Source of Truth
                // ✅ GOLDEN RULE #7: Single Responsibility
                // Sync our local account state from AuthStateManager (the authority)
                if (this.authState.account !== data.newUser) {
                    console.log('📝 DLUXAuthBridge: Syncing username from AuthStateManager', {
                        oldAccount: this.authState.account,
                        newAccount: data.newUser
                    });

                    // Update local account state to match AuthStateManager
                    this.authState.account = data.newUser;
                    console.log('✅ DLUXAuthBridge: Updated account to:', data.newUser);

                    // Reset permission denied state on user switch
                    if (this.authState.lastPermissionDenied &&
                        this.authState.lastPermissionDenied.attemptedUser !== data.newUser) {
                        console.log('🔄 Clearing permission denied state for new user');
                        this.authState.lastPermissionDenied = null;
                    }
                }
            });

            // Listen for auth header cleared events
            window.authStateManager.on('authHeadersCleared', (event) => {
                // ✅ FIX: Access event data from detail property (CustomEvent structure)
                const data = event.detail || {};

                console.log('🔒 AUTH BRIDGE: Auth headers cleared', {
                    reason: data.reason,
                    oldUser: data.oldUser,
                    newUser: data.newUser
                });

                // Clear our local auth state when headers are cleared
                if (data.reason === 'username-change') {
                    // AuthStateManager already cleared the headers, just sync local state
                    // Don't store auth headers locally - AuthStateManager is single source of truth
                    this.authState.isAuthenticated = false;
                    this.authState.isAuthExpired = false;
                    this.authState.challengeAge = null;
                }
            });
        } else {
            console.log('⚠️ AuthStateManager not available yet, will retry...');
            // Use MutationObserver to detect when authStateManager becomes available
            if (typeof window !== 'undefined' && !this._authStateManagerObserver) {
                this._authStateManagerObserver = new MutationObserver(() => {
                    if (window.authStateManager) {
                        this._authStateManagerObserver.disconnect();
                        this._authStateManagerObserver = null;
                        this.setupAuthStateManagerListeners();
                    }
                });

                // Observe changes to window properties
                this._authStateManagerObserver.observe(document.documentElement, {
                    childList: true,
                    subtree: true,
                    attributes: true
                });

                // Also check on DOMContentLoaded if not already loaded
                if (document.readyState !== 'complete') {
                    document.addEventListener('DOMContentLoaded', () => {
                        if (window.authStateManager && !this._authStateManagerSetup) {
                            this.setupAuthStateManagerListeners();
                        }
                    }, { once: true });
                }
            }
        }
    }

    /**
     * Show authentication prompt modal
     * @param {string} action - Authentication action: 'login' | 'authenticate' | 'switch_account' | 'checking_permissions' | 'permission_check_failed'
     * @param {Object} documentInfo - Document/resource context
     * @param {string} documentInfo.name - Display name for the resource
     * @param {string} documentInfo.owner - Resource owner (optional)
     * @param {string} documentInfo.permlink - Resource permlink (optional)
     * @param {string} documentInfo.id - Resource ID (optional)
     * @param {string} documentInfo.type - Resource type (optional)
     */
    async showAuthPrompt(action, documentInfo = {}) {
        console.log('🔑 DEBUG: DLUXAuthBridge.showAuthPrompt called', {
            instanceId: this.instanceId,
            action,
            documentInfo,
            headless: documentInfo.headless || false
        });
        console.log('🔑 DEBUG: Current bridge state before update:', this.getState());

        // ✅ HEADLESS AUTH: Check if this is a headless authentication request
        if (documentInfo.headless && action === 'authenticate') {
            console.log('🔑 HEADLESS: Processing authentication without modal');
            return this.processHeadlessAuth(documentInfo);
        }

        console.log('🔑 DEBUG: MODAL VISIBILITY: About to show auth modal for action:', action);

        // 🎭 MODAL: Enhanced decision logging for race condition debugging
        const modalDecisionData = {
            timestamp: Date.now(),
            action: action,
            currentState: {
                showModal: this.authState.showModal,
                showBackdrop: this.authState.showBackdrop,
                isProcessing: this.authState.isProcessing,
                authPromptAction: this.authState.authPromptAction,
                currentUser: this.authState.account,
                isInitialized: this.authState.isInitialized
            },
            documentContext: {
                hasPendingAccess: !!this.authState.pendingDocumentAccess,
                pendingDocumentType: this.authState.pendingDocumentAccess?.type,
                pendingDocumentOwner: this.authState.pendingDocumentAccess?.owner,
                newDocumentInfo: documentInfo
            },
            possibleIssues: {
                alreadyShowingModal: this.authState.showModal === true,
                processingAuth: this.authState.isProcessing === true,
                previousActionPending: !!this.authState.authPromptAction,
                userMismatch: documentInfo.owner && this.authState.account &&
                             documentInfo.owner !== this.authState.account
            },
            callStack: new Error().stack.split('\n').slice(1, 6).join('\n') // Top 5 stack frames
        };

        console.log('🎭 MODAL: Decision to show auth modal', modalDecisionData);

        // Validate action
        const validActions = [
            'login', 'authenticate', 'switch_account',
            'checking_permissions', 'permission_check_failed',
            'local_not_found', 'offline_cache_miss', 'document_not_found'
        ];
        if (!validActions.includes(action)) {
            console.error('❌ Invalid auth action:', action);
            return;
        }

        // ✅ MODAL DEDUPLICATION: Check if we're already processing this document
        if ((action === 'login' || action === 'authenticate' || action === 'switch_account') && documentInfo) {
            const documentKey = documentInfo.owner && documentInfo.permlink ?
                `${documentInfo.owner}/${documentInfo.permlink}` : null;

            if (documentKey && this.processingAccessDenial === documentKey) {
                console.log('🎭 MODAL DEDUPLICATION: Already processing access denial for this document', {
                    documentKey,
                    action,
                    skipped: true
                });
                return; // Skip duplicate
            }

            // Mark this document as being processed
            if (documentKey) {
                this.processingAccessDenial = documentKey;
                console.log('🎭 MODAL DEDUPLICATION: Now processing access denial for document', {
                    documentKey,
                    action
                });
            }
        }

        // ✅ GOLDEN RULE #7: Single Responsibility
        // Track permission denied state separately from showing modal
        if (action === 'switch_account' && documentInfo) {
            this.authState.lastPermissionDenied = {
                document: documentInfo,
                timestamp: Date.now(),
                attemptedUser: this.authState.account
            };
            console.log('📝 Tracking permission denied state', this.authState.lastPermissionDenied);
        }

        // ✅ MODAL STATE CLEANUP: Only clean up if we're not just transitioning states
        if (this.authState.showModal) {
            const previousAction = this.authState.authPromptAction;
            const isTransition = (
                (previousAction === 'checking_permissions' && action === 'switch_account') ||
                (previousAction === 'checking_permissions' && action === 'permission_check_failed') ||
                (previousAction === 'permission_check_failed' && action === 'checking_permissions')
            );

            if (isTransition) {
                // ✅ SMOOTH TRANSITION: Just update the action, no cleanup needed
                console.log('🔄 AUTH MODAL: Smooth transition between states', {
                    from: previousAction,
                    to: action,
                    transition: 'no-cleanup-needed'
                });
            } else {
                // Need to clean up previous modal
                const timeSincePrevious = this.authState.lastModalShowTime ?
                    Date.now() - this.authState.lastModalShowTime : 'N/A';

                console.log('🧹 AUTH MODAL: Cleaning up previous modal state before showing new one');
                this.hideAuthPrompt(false, true, false, false); // Don't clear processing flag during transition
                // Ensure DOM updates complete before proceeding
                await new Promise(resolve => {
                    // Use requestAnimationFrame for more reliable DOM update timing
                    requestAnimationFrame(() => {
                        requestAnimationFrame(resolve);
                    });
                });

                // Log warning AFTER cleanup is complete
                console.warn('🎭 MODAL WARNING: Had to clean up previous modal before showing new one', {
                    previousAction: previousAction,
                    cleanedUp: true,
                    newAction: action,
                    timeSincePreviousShow: timeSincePrevious
                });
            }
        }

        // ✅ FAILSAFE: Never show login modal for logged-in users
        // This catches any timing issues where the component thinks a logged-in user needs to login
        if (action === 'login' && this.authState.account && this.authState.account !== 'GUEST') {
            console.warn('⚠️ AUTH BRIDGE FAILSAFE: Preventing login modal for logged-in user', {
                requestedAction: action,
                currentAccount: this.authState.account,
                override: 'authenticate',
                reason: 'User is already logged in, they need to authenticate not login'
            });
            action = 'authenticate';
        }

        // Update reactive state
        this.authState.authPromptAction = action;
        this.authState.pendingDocumentAccess = documentInfo;
        this.authState.isProcessing = false;
        this.authState.showModal = true;
        this.authState.showBackdrop = true;
        this.authState.lastModalShowTime = Date.now(); // Track when modal was shown
        this.authState.autoTrigger = documentInfo.autoTrigger || false; // Pass autoTrigger flag to modal
        this.authState.forceRefresh = documentInfo.forceRefresh || false; // Pass forceRefresh flag for refresh authentication

        // If we have an authStateManager reference, transition to loading
        // EXCEPT for switch_account - user is already authenticated, just lacks permission
        if (window.authStateManager && typeof window.authStateManager.startAuthLoading === 'function' && action !== 'switch_account') {
            window.authStateManager.startAuthLoading(`auth prompt: ${action}`);
        }

        console.log('🔑 DEBUG: Bridge state updated:', this.getState());

        // ✅ USER CONTROL: Modal stays open until user completes or cancels

        // Emit event for non-Vue applications
        this.emit('authPromptShown', { action, documentInfo });

        // Notify state change listeners
        this.notifyStateChange();

        console.log('🔑 DEBUG: Events emitted and listeners notified');
    }

    /**
     * Hide authentication prompt modal
     * @param {boolean} preservePendingAccess - If true, don't clear pending document access
     * @param {boolean} hideBackdrop - If true, hide backdrop as well (default: true)
     * @param {boolean} preserveProcessingState - If true, don't clear isProcessing state
     */
    hideAuthPrompt(preservePendingAccess = false, hideBackdrop = true, preserveProcessingState = false, clearProcessingFlag = true) {
        // 🎭 MODAL DEBUG: Log why modal is being hidden
        const hideReason = preservePendingAccess ? 'authentication_flow' :
            preserveProcessingState ? 'processing_auth' :
                'user_action_or_success';

        console.log('🎭 MODAL DEBUG: Hiding auth modal', {
            timestamp: Date.now(),
            reason: hideReason,
            hadPendingAccess: !!this.authState.pendingDocumentAccess,
            preservePendingAccess: preservePendingAccess,
            hideBackdrop: hideBackdrop,
            callStack: new Error().stack.split('\n').slice(1, 6).join('\n') // Top 5 stack frames
        });

        console.log('🔑 DEBUG: hideAuthPrompt called', {
            preservePendingAccess,
            hideBackdrop,
            preserveProcessingState,
            currentShowModal: this.authState.showModal,
            currentShowBackdrop: this.authState.showBackdrop,
            currentAction: this.authState.authPromptAction,
            currentIsProcessing: this.authState.isProcessing
        });

        // ✅ USER CONTROL: Modal closed by user action

        // ✅ MODAL VISIBILITY: Hide modal content
        this.authState.showModal = false;
        this.authState.authPromptAction = null;
        this.authState.autoTrigger = false; // Clear autoTrigger flag
        this.authState.forceRefresh = false; // Clear forceRefresh flag

        // ✅ PROCESSING STATE: Only clear if not explicitly preserving it
        if (!preserveProcessingState) {
            this.authState.isProcessing = false;
        }

        // ✅ MODAL DEDUPLICATION: Clear document processing flag only if requested
        if (clearProcessingFlag) {
            this.processingAccessDenial = null;
        }

        // ✅ BACKDROP CONTROL: Only hide backdrop if explicitly requested
        if (hideBackdrop) {
            this.authState.showBackdrop = false;
        }

        console.log('🔑 DEBUG: Modal state after hiding', {
            showModal: this.authState.showModal,
            showBackdrop: this.authState.showBackdrop,
            authPromptAction: this.authState.authPromptAction,
            isProcessing: this.authState.isProcessing
        });

        // ✅ EVENT-DRIVEN: Emit modal closed event to AuthStateManager
        if (typeof window !== 'undefined' && window.authStateManager) {
            window.authStateManager.emit('authModalClosed', {
                preservePendingAccess,
                hideBackdrop,
                preserveProcessingState
            });
        }

        // ✅ REACTIVE CLEARING: Only clear pending access if explicitly requested (no timeouts)
        if (!preservePendingAccess) {
            this.authState.pendingDocumentAccess = null; // Immediate reactive clearing
            this.authState.authRetryContext = null; // Clear retry context
            console.log('🔄 DEBUG: Cleared pending document access immediately (reactive)');
        } else {
            console.log('🔍 DEBUG: Modal hidden but preserving pending document access for continuation:', this.authState.pendingDocumentAccess);
        }

        // Emit event
        this.emit('authPromptHidden');

        // Notify state change listeners
        this.notifyStateChange();
    }

    /**
     * Begin a modal transition (e.g., from auth to login modal)
     * Keeps backdrop visible while switching modals
     * @param {string} from - Source modal ('auth' or 'login')
     * @param {string} to - Target modal ('auth' or 'login')
     * @param {boolean} expectReturn - Whether we expect to return to auth modal
     */
    beginModalTransition(from, to, expectReturn = false) {
        this.authState.modalTransition = {
            inProgress: true,
            fromModal: from,
            toModal: to,
            expectReturn: expectReturn
        };

        // Hide modal but keep backdrop visible
        this.authState.showModal = false;
        // Backdrop remains: this.authState.showBackdrop = true

        console.log('🔄 MODAL TRANSITION: Started', {
            from,
            to,
            backdropVisible: this.authState.showBackdrop,
            expectReturn
        });

        this.notifyStateChange();
    }

    /**
     * Complete a modal transition
     * Shows the target modal if needed
     * @param {string|null} newAccount - Optional new account to use for auth check
     */
    completeModalTransition(newAccount = null) {
        if (!this.authState.modalTransition.inProgress) {
            console.log('🔄 MODAL TRANSITION: No transition in progress');
            return;
        }

        const { toModal, expectReturn } = this.authState.modalTransition;

        // Use provided account or fall back to current
        const accountToCheck = newAccount || this.authState.account;

        console.log('🔄 MODAL TRANSITION: Completing', {
            toModal,
            expectReturn,
            currentModalState: this.authState.showModal,
            accountToCheck,
            currentAccount: this.authState.account,
            providedAccount: newAccount
        });

        if (toModal === 'auth' && expectReturn) {
            // Update account if new one provided
            if (newAccount && newAccount !== this.authState.account) {
                console.log('🔄 MODAL TRANSITION: Updating account from', this.authState.account, 'to', newAccount);
                this.authState.account = newAccount;
            }

            // ✅ EVENT-DRIVEN: Don't check auth state immediately after user switch
            // Instead, emit event to trigger auth check after headers are loaded
            console.log('🔄 MODAL TRANSITION: Deferring auth check until after headers load', {
                accountToCheck,
                pendingDocument: this.authState.pendingDocumentAccess
            });

            // Emit event to trigger auth check after account switch completes
            this.emit('modalTransitionComplete', {
                account: accountToCheck,
                pendingDocumentAccess: this.authState.pendingDocumentAccess
            });

            // Don't show modal immediately - let the auth check handler decide
        } else {
            console.log('🔄 MODAL TRANSITION: Skipping auth modal show', {
                toModal,
                expectReturn,
                reason: toModal !== 'auth' ? 'not transitioning to auth' : 'not expecting return'
            });
        }

        // Reset transition state
        this.authState.modalTransition = {
            inProgress: false,
            fromModal: null,
            toModal: null,
            expectReturn: false
        };

        this.notifyStateChange();
    }

    /**
     * Process headless authentication without showing modal
     * @param {Object} documentInfo - Document information for context
     */
    async processHeadlessAuth(documentInfo) {
        console.log('🔑 HEADLESS: Starting headless authentication', { documentInfo });

        // Set processing state without showing modal
        this.authState.isProcessing = true;
        this.authState.error = null;
        this.authState.showModal = false; // Key difference: no modal
        this.authState.showBackdrop = false;
        this.authState.pendingDocumentAccess = documentInfo;

        // Notify state change for reactive UI updates
        this.notifyStateChange();

        try {
            // Trigger authentication through v3-user
            console.log('🔑 HEADLESS: Dispatching headless auth event');

            // Use same event mechanism as regular auth, but with headless flag
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('requestAuthentication', {
                    detail: {
                        action: 'authenticate',
                        headless: true,
                        forDocumentList: documentInfo.forDocumentList || false,
                        forceRefresh: documentInfo.forceRefresh || false
                    }
                }));
            }

            // ✅ GOLDEN RULE 6: Use requestAnimationFrame-based timeout instead of setTimeout
            const frames = Math.ceil(10000 / 16); // ~625 frames for 10 seconds at 60fps
            let frameCount = 0;
            let timeoutId = null;

            const checkTimeout = () => {
                if (++frameCount >= frames) {
                    if (this.authState.isProcessing) {
                        console.error('🔑 HEADLESS: Authentication timeout');
                        this.authState.error = 'Authentication timed out';
                        this.authState.isProcessing = false;
                        this.notifyStateChange();
                    }
                } else if (this.authState.isProcessing) {
                    timeoutId = requestAnimationFrame(checkTimeout);
                }
            };
            timeoutId = requestAnimationFrame(checkTimeout);

            // Store timeout ID for cleanup
            this.headlessAuthTimeout = timeoutId;

        } catch (error) {
            console.error('🔑 HEADLESS: Authentication error', error);
            this.authState.error = error.message || 'Authentication failed';
            this.authState.isProcessing = false;
            this.notifyStateChange();
        }
    }

    /**
     * Handle authentication action (login/authenticate/switch account)
     * @param {string} action - Authentication action to perform
     */
    handleAuthAction(action) {
        console.log('🔑 DEBUG: handleAuthAction called', {
            action,
            currentModalState: this.authState.showModal,
            pendingAccess: this.authState.pendingDocumentAccess
        });

        // ✅ RETRY CHECK: Handle retry of permission check
        if (action === 'retry_check') {
            console.log('🔄 RETRY CHECK: User requested retry of permission check');
            // Clear context to allow new retry
            this.authState.authRetryContext = null;

            // Transition back to checking_permissions state
            this.authState.authPromptAction = 'checking_permissions';
            this.notifyStateChange();

            // ✅ SINGLE RESPONSIBILITY: This is the ONLY place retry_check emits authRetryReady
            // Following Golden Rule #7 - explicit user action triggers explicit event
            if (this.authState.pendingDocumentAccess) {
                const eventData = {
                    account: this.authState.account,
                    pendingDocumentAccess: this.authState.pendingDocumentAccess
                };
                console.log('🔄 RETRY: Emitting authRetryReady from user retry action', {
                    source: 'retry_check_button',
                    eventData
                });
                this.emit('authRetryReady', eventData);
            }
            return;
        }

        // ✅ CACHE MISS ACTIONS: Handle cache miss user actions
        if (action === 'create_new_document') {
            console.log('📝 CREATE NEW: User chose to create new document');

            // Hide modal
            this.hideAuthPrompt(false, true, false);

            // Emit event to create new document
            this.emit('createNewDocument', {
                pendingDocumentAccess: this.authState.pendingDocumentAccess
            });

            // Also dispatch DOM event for compatibility
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('createNewDocument', {
                    detail: {
                        pendingDocumentAccess: this.authState.pendingDocumentAccess
                    }
                }));
            }
            return;
        }

        if (action === 'go_online') {
            console.log('🌐 GO ONLINE: User chose to go online');

            // Keep modal open but update message
            this.authState.authPromptAction = 'waiting_for_connection';
            this.notifyStateChange();

            // Monitor online status
            const checkOnline = () => {
                if (navigator.onLine) {
                    console.log('✅ Connection restored - retrying document load');
                    // Hide modal
                    this.hideAuthPrompt(false, true, false);

                    // Emit event to retry loading
                    if (this.authState.pendingDocumentAccess) {
                        this.emit('authRetryReady', {
                            account: this.authState.account,
                            pendingDocumentAccess: this.authState.pendingDocumentAccess
                        });
                    }

                    // Remove listener
                    window.removeEventListener('online', checkOnline);
                }
            };

            // Listen for online event
            window.addEventListener('online', checkOnline);

            // ✅ GOLDEN RULE 6: Use requestAnimationFrame instead of setTimeout
            // Check after ~6 frames (~100ms at 60fps)
            let frameCount = 0;
            const delayedCheck = () => {
                if (++frameCount >= 6) {
                    checkOnline();
                } else {
                    requestAnimationFrame(delayedCheck);
                }
            };
            requestAnimationFrame(delayedCheck);

            return;
        }

        // ✅ PRESERVE CONTEXT: For authentication actions, preserve pending access during auth flow
        const preservePendingAccess = action === 'switch_account' || action === 'authenticate';
        console.log('🔑 DEBUG: Will preserve pending access:', preservePendingAccess);

        // ✅ AUTHENTICATION FLOW: For authenticate action, trigger real authentication instead of immediate retry
        if (action === 'authenticate') {
            // Set processing state only for authenticate action (wallet signing)
            this.authState.isProcessing = true;
            this.notifyStateChange();

            console.log('🔴 POST-AUTH-HANG: User clicked authenticate - triggering actual authentication flow');
            console.log('🔴 POST-AUTH-HANG: Authentication flow starting', {
                timestamp: Date.now(),
                pendingDocument: this.authState.pendingDocumentAccess,
                currentAccount: this.authState.account,
                isProcessing: this.authState.isProcessing
            });

            // Don't emit authRetryReady here - that should only happen AFTER successful authentication
            // The requestAuthentication event (dispatched below) will trigger the actual wallet auth
            // Only after wallet auth succeeds should authRetryReady be emitted

            // ✅ MODAL VISIBILITY: Keep auth modal visible during authentication
            // The modal will show the processing state with spinner
            console.log('🔑 DEBUG: Keeping auth modal visible during authentication process');
        } else if (action === 'switch_account') {
            // ✅ MODAL TRANSITION: Use new transition system for switch_account
            console.log('🔑 DEBUG: User switching account - transitioning to login modal');

            // Start modal transition (keeps backdrop visible)
            this.beginModalTransition('auth', 'login', true);

            // Emit event with pending document info for retry after auth
            this.emit('authActionRequested', {
                action,
                pendingDocumentAccess: this.authState.pendingDocumentAccess
            });

            // Dispatch login request with expectReturn flag
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('requestLogin', {
                    detail: {
                        reason: action,
                        pendingDocumentAccess: this.authState.pendingDocumentAccess,
                        expectReturn: true
                    }
                }));

                console.log('🔑 DEBUG: Auth bridge dispatched event:', {
                    eventType: 'requestLogin',
                    action,
                    pendingDocumentAccess: this.authState.pendingDocumentAccess,
                    expectReturn: true
                });
            }
            return; // Don't hide backdrop or do further processing
        } else {
            // ✅ MODAL TRANSITION: Hide modal for login (regular login, not switch)
            console.log('🔑 DEBUG: Hiding auth modal for action:', action);
            // For 'login', the login modal will be shown instead
            this.hideAuthPrompt(preservePendingAccess, false, false); // Hide modal and backdrop
        }

        // For non-switch_account actions, emit events normally
        if (action !== 'switch_account') {
            // Emit event with pending document info for retry after auth
            this.emit('authActionRequested', {
                action,
                pendingDocumentAccess: this.authState.pendingDocumentAccess
            });

            // For Vue applications, also dispatch global event
            if (typeof window !== 'undefined') {
                // Use different events for different action types
                const eventType = action === 'authenticate' ? 'requestAuthentication' : 'requestLogin';
                const authEvent = new CustomEvent(eventType, {
                    detail: {
                        reason: action,
                        pendingDocumentAccess: this.authState.pendingDocumentAccess,
                        forceRefresh: this.authState.forceRefresh
                    }
                });
                window.dispatchEvent(authEvent);

                console.log('🔑 DEBUG: Auth bridge dispatched event:', {
                    eventType,
                    action,
                    pendingDocumentAccess: this.authState.pendingDocumentAccess
                });
            }
        }
    }

    /**
     * Cancel authentication flow
     * ✅ GOLDEN RULE #1: Hybrid Architecture
     * Events bubble up to notify of user actions
     */
    cancelAuthentication() {
        if (DEBUG) {
            console.log('❌ Authentication cancelled by user');
        }

        const pendingAccess = this.authState.pendingDocumentAccess;

        // ✅ GOLDEN RULE #5: Login ≠ Authentication
        // Special handling if user cancelled after being denied access
        if (this.authState.lastPermissionDenied) {
            console.log('🚫 User cancelled after permission denied', {
                deniedDocument: this.authState.lastPermissionDenied.document,
                attemptedUser: this.authState.lastPermissionDenied.attemptedUser
            });
            this.authState.lastPermissionDenied = null;
        }

        // Hide modal and clear state
        console.log('🔄 REACTIVE CLEARING: Cancel case - user explicitly cancelled, clearing pending access');
        this.hideAuthPrompt();

        // Clear pending access with proper reason
        this.clearPendingAccess('user-cancelled');

        // Emit cancellation event
        this.emit('authCancelled', { pendingDocumentAccess: pendingAccess });

        // ✅ EVENT-DRIVEN: Also emit to AuthStateManager
        if (typeof window !== 'undefined' && window.authStateManager) {
            window.authStateManager.emit('authCancelled', { pendingDocumentAccess: pendingAccess });
        }

        // For applications that need to handle cancellation (redirect, etc.)
        if (typeof window !== 'undefined') {
            const cancelEvent = new CustomEvent('authCancelled', {
                detail: { pendingDocumentAccess: pendingAccess }
            });
            window.dispatchEvent(cancelEvent);
        }
    }

    /**
     * Update user account context
     * @param {string} account - Username or null for logout
     */
    setAccount(account) {
        console.log('🔴 AUTH-FLOW: DLUXAuthBridge.setAccount called', {
            newAccount: account,
            oldAccount: this.authState.account,
            hasPendingAccess: !!this.authState.pendingDocumentAccess,
            pendingAccess: this.authState.pendingDocumentAccess,
            currentState: this.getState()
        });

        const oldAccount = this.authState.account;

        // ✅ MODAL DEDUPLICATION: Clear processing flag on user change
        if (account !== oldAccount) {
            this.processingAccessDenial = null;
        }

        // CRITICAL: Clear auth headers BEFORE account change for atomic operation
        const currentHeaders = this.getAuthHeaders();
        if (oldAccount !== account && currentHeaders) {
            const headerAccount = currentHeaders['x-account'];

            // Clear headers if they don't belong to the new user
            if (headerAccount !== account) {
                console.log('🔒 SECURITY: Atomic clear - removing auth headers before account change', {
                    oldUser: oldAccount,
                    newUser: account,
                    headerOwner: headerAccount,
                    action: 'clearing headers atomically'
                });
                if (window.authStateManager) {
                    window.authStateManager.setAuthHeaders(null);
                }
                // Don't store auth headers locally - AuthStateManager is single source of truth
                this.authState.isAuthenticated = false;
                this.authState.isAuthExpired = false;
                this.authState.challengeAge = null;
            }
        }

        // Now update the account
        this.authState.account = account;

        // ✅ STATE TRACKING: Mark as initialized after first setAccount call
        if (!this.authState.isInitialized) {
            this.authState.isInitialized = true;
            console.log('🔧 AUTH BRIDGE: Initial account set, marking as initialized');
        }

        this.notifyStateChange();

        // ✅ REMOVED: userChanged event emission - AuthStateManager is the single source of truth
        // DLUXAuthBridge listens to AuthStateManager's userChanged event instead of emitting its own
        if (oldAccount !== account) {
            console.log('🔄 MODULAR AUTH: Account changed (not emitting duplicate event)', {
                oldUser: oldAccount,
                newUser: account,
                changeType: !oldAccount ? 'login' : !account ? 'logout' : 'switch',
                note: 'AuthStateManager handles userChanged events - following Rule 3 (Single Source of Truth)'
            });
        }

        // ✅ AUTHENTICATION SUCCESS: Emit authRetryReady when account is set with pending access
        // This happens AFTER successful wallet authentication, not before
        // ✅ FIX: Accept 'GUEST' as valid account state, not triggering clear
        if (account && account !== 'GUEST' && this.authState.pendingDocumentAccess) {
            // 🔄 RETRY: Enhanced retry flow logging
            const retryFlowData = {
                timestamp: Date.now(),
                account: account,
                previousAccount: oldAccount,
                pendingDocument: {
                    name: this.authState.pendingDocumentAccess.name,
                    type: this.authState.pendingDocumentAccess.type,
                    owner: this.authState.pendingDocumentAccess.owner,
                    permlink: this.authState.pendingDocumentAccess.permlink
                },
                authState: {
                    showModal: this.authState.showModal,
                    showBackdrop: this.authState.showBackdrop,
                    isProcessing: this.authState.isProcessing
                },
                timeSinceModalShown: this.authState.lastModalShowTime ?
                    Date.now() - this.authState.lastModalShowTime : 'N/A'
            };

            console.log('🔄 RETRY: Authentication successful, preparing document retry', retryFlowData);

            // ✅ USER CONTROL: No timeouts to clear - user has authenticated

            // ✅ EMIT RETRY EVENT: Now that authentication succeeded, retry document access
            const eventData = {
                account: account,
                pendingDocumentAccess: this.authState.pendingDocumentAccess
            };

            // REMOVED: authRetryReady emission - only emit from handleLoginModalClosed()
            console.log('🔄 AUTH: Account set, NOT emitting authRetryReady here (prevented duplicate)', {
                eventData,
                willRetryDocument: false,
                note: 'authRetryReady only emitted from handleLoginModalClosed()'
            });

            // ✅ EVENT-DRIVEN: Also emit authCompleted to AuthStateManager
            if (typeof window !== 'undefined' && window.authStateManager) {
                window.authStateManager.emit('authCompleted', eventData);
            }

            // ✅ MODAL CLEANUP: Let the retry handler decide when to hide modal
            // The handler will check permissions and either:
            // 1. Hide modal if document loads successfully
            // 2. Show switch_account modal if permissions are insufficient
            // this.hideAuthPrompt(true, true); // REMOVED - handler controls modal state
        } else {
            console.log('🔑 DEBUG: No authRetryReady event emitted', {
                hasAccount: !!account,
                hasPendingAccess: !!this.authState.pendingDocumentAccess,
                reason: !account ? 'no-account' : 'no-pending-access'
            });
            if (!account || account === 'GUEST') {
                // ✅ FIX: Don't clear pending access for GUEST users - they need auth flow
                if (!account) {
                    console.log('🔄 REACTIVE CLEARING: Logout case - user logged out, pending access should be cleared');
                } else if (this.authState.isInitialized) {
                    console.log('🔄 GUEST STATE: Guest user detected - preserving pending access for auth flow');
                } else {
                    console.log('🔧 INITIAL STATE: Guest user on initial load - no pending access expected yet');
                }
            } else {
                console.log('🔄 DEBUG: Account set but no pending access - this might indicate pending access was cleared too early');
            }
        }
    }

    /**
     * Check if authentication prompt is currently shown
     * @returns {boolean}
     */
    isPromptVisible() {
        return this.authState.showModal;
    }

    /**
     * Get current authentication state (read-only)
     * @returns {Object} Current state snapshot
     */
    getState() {
        return {
            showModal: this.authState.showModal,
            showBackdrop: this.authState.showBackdrop,
            authPromptAction: this.authState.authPromptAction,
            pendingDocumentAccess: this.authState.pendingDocumentAccess,
            account: this.authState.account,
            isProcessing: this.authState.isProcessing,
            // Auth headers state
            hasAuthHeaders: !!this.getAuthHeaders(),
            isAuthenticated: this.authState.isAuthenticated,
            isAuthExpired: this.authState.isAuthExpired,
            challengeAge: this.authState.challengeAge
        };
    }

    /**
     * Register callback for state changes (for non-Vue applications)
     * @param {Function} callback - Function to call when state changes
     * @returns {Function} Unsubscribe function
     */
    onStateChange(callback) {
        this.stateChangeCallbacks.add(callback);

        // Return unsubscribe function
        return () => {
            this.stateChangeCallbacks.delete(callback);
        };
    }

    /**
     * Emit custom event
     * @private
     */
    emit(eventName, data = {}) {
        const event = new CustomEvent(eventName, { detail: data });
        this.eventBus.dispatchEvent(event);
    }

    /**
     * Listen for events from the bridge
     * @param {string} eventName - Event name to listen for
     * @param {Function} callback - Event handler
     * @returns {Function} Unsubscribe function
     */
    on(eventName, callback) {
        this.eventBus.addEventListener(eventName, callback);

        return () => {
            this.eventBus.removeEventListener(eventName, callback);
        };
    }

    /**
     * Notify all state change listeners
     * @private
     */
    notifyStateChange() {
        const currentState = this.getState();
        this.stateChangeCallbacks.forEach(callback => {
            try {
                callback(currentState);
            } catch (error) {
                console.error('❌ Error in auth bridge state change callback:', error);
            }
        });
    }

    // ✅ REMOVED: Authentication timeout mechanism
    // Modal now stays open until user completes or cancels the flow
    // This gives users full control over the authentication process

    /**
     * Clear pending document access
     * ✅ GOLDEN RULE #5: Login ≠ Authentication
     * Only clear pending access when access is actually granted or user cancels
     * @param {string} reason - Why we're clearing (success, cancelled, etc)
     */
    clearPendingAccess(reason = 'unknown') {
        console.log('🔴 POST-AUTH-HANG: clearPendingAccess called', {
            reason,
            pendingDocument: this.authState.pendingDocumentAccess,
            currentUser: this.authState.account,
            modalState: {
                showModal: this.authState.showModal,
                authPromptAction: this.authState.authPromptAction,
                isProcessing: this.authState.isProcessing
            },
            timestamp: Date.now()
        });

        // ✅ GOLDEN RULE #5: Login ≠ Authentication
        // Don't clear if user authenticated but was denied access
        if (reason === 'permission-denied' || reason === 'switch-account-needed') {
            console.log('🔴 POST-AUTH-HANG: KEEPING pending document access - user needs to switch accounts', {
                reason,
                pendingDocument: this.authState.pendingDocumentAccess,
                currentUser: this.authState.account
            });
            // Keep modal open for user to switch accounts
            return;
        }

        console.log('🔴 POST-AUTH-HANG: Clearing pending document access', {
            reason,
            wasSuccess: reason === 'success' || reason === 'document-loaded'
        });

        this.authState.pendingDocumentAccess = null;
        this.authState.retryCount = 0;
        this.authState.authRetryContext = null; // Clear retry context

        // ✅ CLEAR BACKDROP: Hide backdrop when authentication flow is complete
        this.authState.showBackdrop = false;
        this.authState.showModal = false;
        this.authState.isProcessing = false;

        this.notifyStateChange();
    }

    /**
     * ✅ CENTRALIZED AUTH: Set authentication headers and calculate auth state
     * @param {Object} headers - Auth headers object with x-account, x-challenge, x-signature, x-pubkey
     * @param {string} account - Optional account name (will use headers['x-account'] if not provided)
     */
    setAuthHeaders(headers, account = null) {
        console.log('🔴 AUTH-FLOW: DLUXAuthBridge.setAuthHeaders called', {
            hasHeaders: !!headers,
            account: account || headers?.['x-account'],
            timestamp: new Date().toISOString(),
            callStack: new Error().stack.split('\n').slice(2, 5).join(' -> ')
        });

        // ✅ RECURSION FIX: Check if headers actually changed before proceeding
        const oldHeaders = this.getAuthHeaders();
        const hasAccountChanged = (oldHeaders?.['x-account'] || null) !== (headers?.['x-account'] || null);
        const hasChallengeChanged = (oldHeaders?.['x-challenge'] || null) !== (headers?.['x-challenge'] || null);
        const hasSignatureChanged = (oldHeaders?.['x-signature'] || null) !== (headers?.['x-signature'] || null);
        const hasPubkeyChanged = (oldHeaders?.['x-pubkey'] || null) !== (headers?.['x-pubkey'] || null);

        const hasHeadersChanged = hasAccountChanged || hasChallengeChanged || hasSignatureChanged || hasPubkeyChanged;

        if (!hasHeadersChanged && oldHeaders === headers) {
            console.log('🔴 AUTH-FLOW: Headers unchanged, skipping update to prevent recursion');
            return;
        }

        // Update account - prioritize headers['x-account'] over the passed account parameter
        // This ensures we always use the authenticated account from headers
        const accountToUse = headers?.['x-account'] || account || null;

        // ✅ DEFENSIVE: Log account extraction for debugging
        console.log('🔑 AUTH BRIDGE: Account extraction', {
            headersProvided: !!headers,
            headersType: typeof headers,
            headersIsObject: headers && typeof headers === 'object',
            accountFromHeaders: headers?.['x-account'],
            accountParameter: account,
            accountToUse: accountToUse
        });

        if (accountToUse && accountToUse !== 'GUEST') {
            // ✅ FIX: Only call setAccount if the user actually changed
            // Don't trigger userChanged events for authentication of the same user
            if (this.authState.account !== accountToUse) {
                console.log('🔑 AUTH BRIDGE: Account changing from', this.authState.account, 'to', accountToUse);
                this.setAccount(accountToUse);
            } else {
                console.log('🔑 AUTH BRIDGE: Account unchanged, skipping setAccount to prevent false userChanged event');
            }
        }

        // Update auth headers through AuthStateManager
        if (window.authStateManager) {
            console.log('🔴 AUTH-FLOW: DLUXAuthBridge forwarding headers to authStateManager', {
                hasHeaders: !!headers,
                account: headers?.['x-account']
            });
            window.authStateManager.setAuthHeaders(headers);
        }
        // Don't store auth headers locally - AuthStateManager is single source of truth
        // Access via window.authStateManager.getAuthHeaders() when needed

        // Calculate authentication state
        if (headers && headers['x-account'] && headers['x-challenge'] &&
            headers['x-signature'] && headers['x-pubkey']) {

            this.authState.isAuthenticated = true;

            // Calculate challenge age
            const challenge = parseInt(headers['x-challenge']);
            if (!isNaN(challenge)) {
                const now = Math.floor(Date.now() / 1000);
                this.authState.challengeAge = now - challenge;
                this.authState.isAuthExpired = this.authState.challengeAge > (23 * 60 * 60); // 23 hours

                console.log('🔑 AUTH BRIDGE: Challenge age calculated', {
                    challengeAge: this.authState.challengeAge,
                    ageHours: (this.authState.challengeAge / 3600).toFixed(1),
                    isExpired: this.authState.isAuthExpired
                });
            }
        } else {
            // No valid headers
            this.authState.isAuthenticated = false;
            this.authState.challengeAge = null;
            this.authState.isAuthExpired = false;
        }

        // Emit event for all consumers (including AuthStateManager)
        // Always prioritize the account from headers for the event
        // ✅ FIX: Ensure eventAccount is never undefined if we have a valid account
        const eventAccount = headers?.['x-account'] || accountToUse || this.authState.account || account;
        const eventData = {
            headers: headers,
            account: eventAccount,  // Use account from headers first, then resolved account
            isAuthenticated: this.authState.isAuthenticated,
            isExpired: this.authState.isAuthExpired,
            challengeAge: this.authState.challengeAge
        };

        console.log('🔐 AUTH BRIDGE EVENT: About to emit authHeadersUpdated', {
            accountToUse: accountToUse,
            authStateAccount: this.authState.account,
            eventAccount: eventAccount,
            finalAccount: eventData.account,
            hasHeaders: !!headers,
            headersAccount: headers?.['x-account'],
            accountParameter: account,
            headersType: typeof headers,
            headersKeys: headers ? Object.keys(headers) : 'no headers',
            headersSample: headers ? JSON.stringify(headers).substring(0, 100) : 'no headers',
            // ✅ ENHANCED: Log the actual event data being emitted
            eventDataPreview: {
                account: eventData.account,
                hasHeaders: !!eventData.headers,
                isAuthenticated: eventData.isAuthenticated
            }
        });

        this.emit('authHeadersUpdated', eventData);

        // ✅ AUTHENTICATION SUCCESS: Handle state transitions when auth headers are set
        if (this.authState.isAuthenticated && !this.authState.isAuthExpired &&
            this.authState.account && this.authState.account !== 'GUEST') {

            // ✅ HEADLESS AUTH: Clear timeout if this was headless auth
            if (this.headlessAuthTimeout) {
                cancelAnimationFrame(this.headlessAuthTimeout);
                this.headlessAuthTimeout = null;
                console.log('🔑 HEADLESS: Authentication successful, cleared timeout');
            }

            // Check if we have pending document access
            if (this.authState.pendingDocumentAccess) {
                // ✅ HEADLESS AUTH: For headless auth, just clear processing and error
                if (!this.authState.showModal) {
                    console.log('🔑 HEADLESS: Authentication complete');
                    this.authState.isProcessing = false;
                    this.authState.error = null;
                    // Don't transition to checking_permissions for headless
                } else {
                    // ✅ TRANSITION STATE: Move to checking permissions for modal auth
                    console.log('🔴 POST-AUTH-HANG: Authentication complete, transitioning to permission check');
                    this.authState.authPromptAction = 'checking_permissions';
                    this.authState.isProcessing = false;
                }

                // ✅ MODAL DEDUPLICATION: Clear processing flag when transitioning to checking_permissions
                // This allows switch_account modal to show if permission check fails
                this.processingAccessDenial = null;

                console.log('🔑 AUTH BRIDGE: Auth headers set, ready for permission check', {
                    account: this.authState.account,
                    pendingDocument: `${this.authState.pendingDocumentAccess.owner}/${this.authState.pendingDocumentAccess.permlink}`,
                    modalState: this.authState.authPromptAction
                });
            } else {
                // No pending document, just clear processing state
                if (this.authState.isProcessing) {
                    console.log('🔑 AUTH BRIDGE: Authentication complete, clearing processing state');
                    this.authState.isProcessing = false;
                }
            }

            // Note: authRetryReady is NOT emitted here automatically
            // It should only be emitted from explicit user actions via emitAuthRetryIfNeeded()
            // This prevents duplicate events when v3-user.js calls both setAuthHeaders and emitAuthRetryIfNeeded
        }

        // Notify state change listeners
        this.notifyStateChange();

        // If auth failed/cancelled and we have authStateManager, update state
        if (!this.authState.showModal && !this.authState.isAuthenticated &&
            window.authStateManager && typeof window.authStateManager.transitionTo === 'function') {
            // Modal closed without successful auth
            if (this.authState.authPromptAction) {
                window.authStateManager.transitionTo('unauthenticated', 'auth modal closed');
            }
        }
    }

    /**
     * Get current authentication headers from AuthStateManager
     * @returns {Object|null} Current auth headers
     */
    getAuthHeaders() {
        // AuthStateManager is the single source of truth for auth headers
        return window.authStateManager ? window.authStateManager.getAuthHeaders() : null;
    }

    /**
     * Check if user is authenticated with valid (non-expired) headers
     * @returns {boolean} True if authenticated and not expired
     */
    isAuthenticated() {
        return this.authState.isAuthenticated && !this.authState.isAuthExpired;
    }

    /**
     * Clear authentication state on logout
     * ✅ SINGLE SOURCE OF TRUTH: Clear stale headers to prevent contamination
     */
    logout() {
        console.log('🔴 AUTH-FLOW: DLUXAuthBridge.logout() - clearing auth headers', {
            hadHeaders: !!this.getAuthHeaders(),
            hadAccount: this.authState.account,
            timestamp: new Date().toISOString()
        });

        // Clear ALL auth state from bridge including account
        // Don't store auth headers locally - AuthStateManager is single source of truth
        this.authState.account = null;  // CRITICAL: Clear account to prevent stale state
        this.authState.isAuthenticated = false;
        this.authState.isAuthExpired = false;
        this.authState.challengeAge = null;

        // Call authStateManager.logout() to clear both headers AND user
        if (window.authStateManager) {
            window.authStateManager.logout();
        }

        console.log('🔴 AUTH-FLOW: DLUXAuthBridge auth state cleared');
    }

    /**
     * Get the age of the authentication challenge in seconds
     * @returns {number|null} Challenge age in seconds, or null if no valid headers
     */
    getChallengeAge() {
        return this.authState.challengeAge;
    }

    /**
     * ✅ SINGLE RESPONSIBILITY: Emit retry event when appropriate
     * Separated from setAuthHeaders to follow Golden Rule #7
     * Called explicitly from user actions, not automatically
     *
     * @param {string} source - Where the retry is being triggered from
     * @param {string|null} account - Optional account to use for retry (e.g., new user after switch)
     */
    emitAuthRetryIfNeeded(source, account = null) {
        console.log('🔴 AUTH-DEBUG: emitAuthRetryIfNeeded called', {
            source,
            account,
            timestamp: Date.now(),
            pendingDocument: this.authState.pendingDocumentAccess,
            authState: {
                account: this.authState.account,
                isAuthenticated: this.authState.isAuthenticated,
                authHeaders: !!this.getAuthHeaders()
            }
        });

        // ✅ FIX: Use provided account (e.g., from user switch) or fall back to stored account
        const accountToUse = account || this.authState.account;

        if (this.authState.pendingDocumentAccess &&
            accountToUse &&
            accountToUse !== 'GUEST') {

            // ✅ MODAL TRANSITION: If we're in a modal transition, complete it first
            if (this.authState.modalTransition.inProgress) {
                console.log('🔴 POST-AUTH-HANG: Completing modal transition before retry with account:', accountToUse);
                this.completeModalTransition(accountToUse);
            }

            // ✅ RULE 5: Check if new user has auth headers
            // Use dlux-auth-bridge's own method that delegates to AuthStateManager
            const currentHeaders = this.getAuthHeaders();
            const hasValidHeaders = currentHeaders &&
                                   currentHeaders['x-account'] === accountToUse &&
                                   !this.authState.isAuthExpired;

            // Determine the correct action based on auth state
            const authAction = hasValidHeaders ? 'checking_permissions' : 'authenticate';

            console.log('🔴 AUTH-DEBUG: Determining auth action', {
                account: accountToUse,
                hasValidHeaders,
                authAction,
                currentHeaders: currentHeaders?.['x-account'],
                isExpired: this.authState.isAuthExpired
            });

            // ✅ MODAL VISIBILITY: Show auth modal with appropriate action
            if (!this.authState.showModal) {
                console.log('🔴 POST-AUTH-HANG: Showing auth modal with action:', authAction);
                this.authState.showModal = true;
                this.authState.authPromptAction = authAction;
                this.notifyStateChange();
            }

            // ✅ RULE 5: Only emit retry if user has valid auth headers
            if (hasValidHeaders) {
                const eventData = {
                    account: accountToUse,
                    pendingDocumentAccess: this.authState.pendingDocumentAccess
                };

                console.log('🔴 AUTH-DEBUG: User has valid headers, emitting authRetryReady', {
                    source,
                    account: eventData.account,
                    document: `${eventData.pendingDocumentAccess.owner}/${eventData.pendingDocumentAccess.permlink}`,
                    providedAccount: account,
                    storedAccount: this.authState.account,
                    usingProvidedAccount: !!account,
                    modalVisible: this.authState.showModal,
                    authPromptAction: this.authState.authPromptAction,
                    timestamp: Date.now()
                });

                this.emit('authRetryReady', eventData);
                console.log('🔴 AUTH-DEBUG: authRetryReady event emitted');
            } else {
                console.log('🔄 AUTH RETRY: User needs to authenticate first', {
                    source,
                    account: accountToUse,
                    reason: 'No valid auth headers for this user'
                });
                // The auth modal will handle authentication flow
            }
        } else {
            console.log('🔄 AUTH RETRY: Not processing retry', {
                source,
                hasPendingAccess: !!this.authState.pendingDocumentAccess,
                accountToUse,
                reason: !this.authState.pendingDocumentAccess ? 'no pending access' :
                    !accountToUse ? 'no account' :
                        accountToUse === 'GUEST' ? 'guest account' : 'unknown'
            });
        }
    }

    /**
     * Clean up resources
     */
    destroy() {
        if (DEBUG) {
            console.log('🔑 DLUXAuthBridge destroyed');
        }

        // Clean up MutationObserver if it exists
        if (this._authStateManagerObserver) {
            this._authStateManagerObserver.disconnect();
            this._authStateManagerObserver = null;
        }

        // ✅ CLEANUP: Reset state and clear callbacks
        this.stateChangeCallbacks.clear();
        this.hideAuthPrompt();
    }
}

export default DLUXAuthBridge;
