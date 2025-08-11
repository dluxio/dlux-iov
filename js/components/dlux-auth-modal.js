/**
 * DLUX Authentication Modal Component
 *
 * A reusable Vue component that provides a consistent authentication modal
 * across all DLUX applications. Works with the DLUXAuthBridge service to
 * provide collaborative features and cloud saves.
 *
 * Features:
 * - Responsive Bootstrap modal design
 * - Context-aware messaging (login vs switch account)
 * - Professional UI with DLUX branding
 * - Teleportable to any DOM location
 * - Framework-agnostic (Vue 2/3 compatible)
 *
 * Usage:
 * ```html
 * <dlux-auth-modal :auth-bridge="authBridge" :account="account"></dlux-auth-modal>
 * ```
 */

export default {
    name: 'DluxAuthModal',

    props: {
        /**
         * DLUXAuthBridge instance for state management
         */
        authBridge: {
            type: Object,
            required: true,
            validator(value) {
                return value && typeof value.authState === 'object';
            }
        },

        /**
         * Current authenticated user account
         */
        account: {
            type: [String, null],
            default: null
        }
    },

    computed: {
        /**
         * Whether the modal should be shown
         */
        showModal() {
            const show = this.authBridge?.authState?.showModal || false;
            console.log('🔑 DEBUG: Modal showModal computed:', {
                show,
                authBridge: !!this.authBridge,
                authState: this.authBridge?.authState
            });
            return show;
        },

        /**
         * Whether the backdrop should be shown (independent of modal)
         */
        showBackdrop() {
            return this.authBridge?.authState?.showBackdrop || false;
        },

        /**
         * Current authentication action: 'login' | 'switch_account' | null
         */
        authPromptAction() {
            return this.authBridge?.authState?.authPromptAction;
        },

        /**
         * Whether authentication is being processed
         */
        isProcessing() {
            return this.authBridge?.authState?.isProcessing || false;
        },

        /**
         * Pending document access information
         */
        pendingDocumentAccess() {
            return this.authBridge?.authState?.pendingDocumentAccess;
        },

        /**
         * Document name for display purposes
         */
        documentName() {
            return this.pendingDocumentAccess?.name || 'document';
        }
    },

    methods: {
        /**
         * Handle authentication action (login/switch account)
         */
        handleAuthAction(action) {
            // 🔐 AUTH TIMING: Log auth modal action
            console.log('🔐 AUTH TIMING: Auth modal handleAuthAction called', {
                action: action,
                hasAuthBridge: !!this.authBridge,
                timestamp: new Date().toISOString()
            });

            if (this.authBridge) {
                this.authBridge.handleAuthAction(action);
            }
        },

        /**
         * Cancel authentication flow
         */
        cancelAuthentication() {
            if (this.authBridge) {
                this.authBridge.cancelAuthentication();
            }
        },

    },

    watch: {
        authBridge: {
            handler(newBridge, oldBridge) {
                console.log('🔑 DEBUG: Modal authBridge watcher triggered:', {
                    newBridge: !!newBridge,
                    oldBridge: !!oldBridge,
                    newState: newBridge?.authState
                });
            },
            immediate: true
        },

        'authBridge.authState.showModal': {
            handler(newShow, oldShow) {
                console.log('🔑 DEBUG: Modal showModal watcher triggered:', {
                    newShow,
                    oldShow,
                    authBridgeInstanceId: this.authBridge?.instanceId,
                    currentShowModal: this.showModal,
                    currentShowBackdrop: this.showBackdrop,
                    authPromptAction: this.authPromptAction,
                    autoTrigger: this.authBridge?.authState?.autoTrigger
                });

                // Auto-trigger authentication when modal opens with autoTrigger flag
                if (newShow && !oldShow && this.authBridge?.authState?.autoTrigger) {
                    console.log('🚀 AUTO-TRIGGER: Automatically starting authentication');
                    // Use nextTick to ensure modal is rendered before triggering
                    this.$nextTick(() => {
                        // Check which action to trigger based on authPromptAction
                        if (this.authPromptAction === 'authenticate') {
                            this.handleAuthAction('authenticate');
                        } else if (this.authPromptAction === 'login') {
                            // For login, we might need different handling
                            // but for now, try authentication
                            this.handleAuthAction('authenticate');
                        }
                    });
                }
            },
            immediate: true
        },

        'authBridge.authState': {
            handler(newState, oldState) {
                console.log('🔑 DEBUG: Modal authState deep watcher triggered:', {
                    newState,
                    oldState,
                    showModal: newState?.showModal,
                    showBackdrop: newState?.showBackdrop,
                    authPromptAction: newState?.authPromptAction
                });
            },
            deep: true,
            immediate: true
        }
    },

    mounted() {
        console.log('🔑 DEBUG: Modal component mounted with authBridge:', {
            authBridge: !!this.authBridge,
            authBridgeInstanceId: this.authBridge?.instanceId,
            authState: this.authBridge?.authState,
            showModal: this.authBridge?.authState?.showModal,
            showBackdrop: this.authBridge?.authState?.showBackdrop
        });
    },

    template: `
        <!-- Authentication Modal & Backdrop -->
        <teleport to="body" v-if="showBackdrop">
            
            <!-- Modal Content (when showModal is true) -->
            <div v-if="showModal" class="modal fade show" 
                 style="display: block; z-index: 1060;" 
                 role="dialog" 
                 aria-labelledby="authenticationModalLabel" 
                 aria-hidden="false"
                 data-bs-backdrop="static"
                 data-bs-keyboard="false">
                
                <div class="modal-dialog modal-dialog-centered" @click.stop>
                    <div class="modal-content bg-dark text-white">
                        
                        <!-- Modal Header -->
                        <div class="modal-header border-secondary">
                            <h5 class="modal-title" id="authenticationModalLabel">
                                <i class="fa-solid fa-key fa-fw me-2 text-warning"></i>
                                Authentication Required
                            </h5>
                        </div>
                        
                        <!-- Modal Body -->
                        <div class="modal-body">
                            
                            <!-- Login Required (No Username) -->
                            <div v-if="authPromptAction === 'login' && !isProcessing">
                                <div class="alert alert-info mb-3">
                                    <i class="fa-solid fa-info-circle fa-fw me-2"></i>
                                    <strong>Please Login:</strong> You need to create an account or login.
                                </div>
                                <p class="mb-3">
                                    The document <strong>"{{ documentName }}"</strong> requires a Hive account. 
                                    Please login or create an account to continue.
                                </p>
                                <div class="d-flex gap-2">
                                    <button type="button" 
                                            class="btn btn-primary flex-fill" 
                                            @click="handleAuthAction('login')">
                                        <i class="fa-solid fa-sign-in-alt fa-fw me-2"></i>
                                        Login
                                    </button>
                                    <button type="button" 
                                            class="btn btn-outline-light" 
                                            @click="cancelAuthentication()">
                                        <i class="fa-solid fa-times fa-fw me-2"></i>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Authentication Required (Has Username) -->
                            <div v-else-if="authPromptAction === 'authenticate' && !isProcessing">
                                <div class="alert alert-info mb-3">
                                    <i class="fa-solid fa-shield-alt fa-fw me-2"></i>
                                    <strong>Please Authenticate:</strong> Your account needs authentication.
                                </div>
                                <p class="mb-3">
                                    You are logged in as <strong>@{{ account }}</strong>, but your authentication 
                                    has expired or is invalid. Please authenticate to access <strong>"{{ documentName }}"</strong>.
                                </p>
                                <div class="d-flex gap-2">
                                    <button type="button" 
                                            class="btn btn-primary flex-fill" 
                                            @click="handleAuthAction('authenticate')">
                                        <i class="fa-solid fa-key fa-fw me-2"></i>
                                        Authenticate
                                    </button>
                                    <button type="button" 
                                            class="btn btn-outline-warning" 
                                            @click="handleAuthAction('switch_account')">
                                        <i class="fa-solid fa-arrows-rotate fa-fw me-2"></i>
                                        Switch User
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Switch Account Required -->
                            <div v-else-if="authPromptAction === 'switch_account' && !isProcessing">
                                <div class="alert alert-warning mb-3">
                                    <i class="fa-solid fa-exclamation-triangle fa-fw me-2"></i>
                                    <strong>Switch User Required:</strong> Current account lacks permissions.
                                </div>
                                <p class="mb-3">
                                    You are authenticated as <strong>@{{ account }}</strong>, but this account 
                                    doesn't have permission to access <strong>"{{ documentName }}"</strong>. 
                                    Please switch to an account with the required permissions.
                                </p>
                                <div class="d-flex gap-2">
                                    <button type="button" 
                                            class="btn btn-warning flex-fill" 
                                            @click="handleAuthAction('switch_account')">
                                        <i class="fa-solid fa-arrows-rotate fa-fw me-2"></i>
                                        Switch Account
                                    </button>
                                    <button type="button" 
                                            class="btn btn-outline-light" 
                                            @click="cancelAuthentication()">
                                        <i class="fa-solid fa-times fa-fw me-2"></i>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Checking Permissions State -->
                            <div v-else-if="authPromptAction === 'checking_permissions'">
                                <div class="alert alert-info mb-3">
                                    <i class="fa-solid fa-shield-check fa-fw me-2"></i>
                                    <strong>Checking Access...</strong> Verifying your permissions
                                </div>
                                <p class="mb-3">
                                    Authentication successful! Now checking if <strong>@{{ account }}</strong> 
                                    has access to <strong>"{{ documentName }}"</strong>.
                                </p>
                                <div class="text-center">
                                    <div class="spinner-border text-info mb-3" role="status" style="width: 2rem; height: 2rem;">
                                        <span class="visually-hidden">Loading...</span>
                                    </div>
                                    <p class="text-muted small">This may take a moment...</p>
                                </div>
                            </div>
                            
                            <!-- Permission Check Failed State -->
                            <div v-else-if="authPromptAction === 'permission_check_failed'">
                                <div class="alert alert-danger mb-3">
                                    <i class="fa-solid fa-exclamation-circle fa-fw me-2"></i>
                                    <strong>Connection Error:</strong> Unable to verify permissions
                                </div>
                                <p class="mb-3">
                                    We couldn't connect to the server to check your access to 
                                    <strong>"{{ documentName }}"</strong>. This might be a temporary network issue.
                                </p>
                                <div class="d-flex gap-2">
                                    <button type="button" 
                                            class="btn btn-primary flex-fill" 
                                            @click="handleAuthAction('retry_check')">
                                        <i class="fa-solid fa-redo fa-fw me-2"></i>
                                        Retry
                                    </button>
                                    <button type="button" 
                                            class="btn btn-outline-light" 
                                            @click="cancelAuthentication()">
                                        <i class="fa-solid fa-times fa-fw me-2"></i>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Local Document Not Found State -->
                            <div v-else-if="authPromptAction === 'local_not_found' && !isProcessing">
                                <div class="alert alert-warning mb-3">
                                    <i class="fa-solid fa-file-circle-exclamation fa-fw me-2"></i>
                                    <strong>Document Not Found:</strong> Local document doesn't exist
                                </div>
                                <p class="mb-3">
                                    The local document <strong>"{{ documentName }}"</strong> was not found in your browser storage. 
                                    Would you like to create a new document?
                                </p>
                                <div class="d-flex gap-2">
                                    <button type="button" 
                                            class="btn btn-primary flex-fill" 
                                            @click="handleAuthAction('create_new_document')">
                                        <i class="fa-solid fa-file-plus fa-fw me-2"></i>
                                        Create New Document
                                    </button>
                                    <button type="button" 
                                            class="btn btn-outline-light" 
                                            @click="cancelAuthentication()">
                                        <i class="fa-solid fa-times fa-fw me-2"></i>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Offline Cache Miss State -->
                            <div v-else-if="authPromptAction === 'offline_cache_miss' && !isProcessing">
                                <div class="alert alert-danger mb-3">
                                    <i class="fa-solid fa-wifi-slash fa-fw me-2"></i>
                                    <strong>Offline:</strong> Cannot access cloud document
                                </div>
                                <p class="mb-3">
                                    The collaborative document <strong>"{{ documentName }}"</strong> is not available offline 
                                    and requires an internet connection to load. You can either connect to the internet 
                                    or create a new local document.
                                </p>
                                <div class="d-flex gap-2">
                                    <button type="button" 
                                            class="btn btn-success flex-fill" 
                                            @click="handleAuthAction('go_online')">
                                        <i class="fa-solid fa-wifi fa-fw me-2"></i>
                                        Go Online
                                    </button>
                                    <button type="button" 
                                            class="btn btn-outline-primary" 
                                            @click="handleAuthAction('create_new_document')">
                                        <i class="fa-solid fa-file-plus fa-fw me-2"></i>
                                        Create New
                                    </button>
                                    <button type="button" 
                                            class="btn btn-outline-light" 
                                            @click="cancelAuthentication()">
                                        <i class="fa-solid fa-times fa-fw me-2"></i>
                                        Cancel
                                    </button>
                                </div>
                                <p class="text-muted small mt-3">
                                    <i class="fa-solid fa-info-circle fa-fw me-1"></i>
                                    Note: Creating a new document will not sync with the cloud version.
                                </p>
                            </div>
                            
                            <!-- Document Not Found State (404) -->
                            <div v-else-if="authPromptAction === 'document_not_found'">
                                <div class="alert alert-danger mb-3">
                                    <i class="fa-solid fa-file-circle-xmark fa-fw me-2"></i>
                                    <strong>Document Not Found:</strong> Server returned 404
                                </div>
                                <p class="mb-3">
                                    The collaborative document <strong>"{{ pendingDocumentAccess?.owner }}/{{ pendingDocumentAccess?.permlink }}"</strong> 
                                    was not found on the server. This could mean it was deleted or the URL contains a typo.
                                </p>
                                <p class="text-warning mb-3">
                                    <i class="fa-solid fa-exclamation-triangle fa-fw me-1"></i>
                                    Please check the URL for typos and try again.
                                </p>
                                <div class="d-flex gap-2">
                                    <button type="button" 
                                            class="btn btn-primary flex-fill" 
                                            @click="handleAuthAction('create_new_document')">
                                        <i class="fa-solid fa-file-plus fa-fw me-2"></i>
                                        Create New Document
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Waiting for Connection State -->
                            <div v-else-if="authPromptAction === 'waiting_for_connection'">
                                <div class="alert alert-info mb-3">
                                    <i class="fa-solid fa-wifi fa-fw me-2"></i>
                                    <strong>Waiting for Connection...</strong> Please connect to the internet
                                </div>
                                <p class="mb-3">
                                    The document will load automatically once an internet connection is detected. 
                                    Please enable your WiFi or mobile data connection.
                                </p>
                                <div class="text-center">
                                    <div class="spinner-border text-info mb-3" role="status" style="width: 2rem; height: 2rem;">
                                        <span class="visually-hidden">Loading...</span>
                                    </div>
                                    <p class="text-muted small">Checking connection status...</p>
                                </div>
                                <div class="d-flex gap-2 mt-3">
                                    <button type="button" 
                                            class="btn btn-outline-light flex-fill" 
                                            @click="cancelAuthentication()">
                                        <i class="fa-solid fa-times fa-fw me-2"></i>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Processing State -->
                            <div v-else-if="isProcessing">
                                <div class="alert alert-info mb-3">
                                    <i class="fa-solid fa-shield-alt fa-fw me-2"></i>
                                    <strong>Authenticating...</strong> Please complete wallet signing
                                </div>
                                <p class="mb-3">Please complete authentication in your Hive wallet extension or app.</p>
                                <div class="text-center">
                                    <div class="spinner-border text-warning mb-3" role="status" style="width: 3rem; height: 3rem;">
                                        <span class="visually-hidden">Loading...</span>
                                    </div>
                                    <p class="text-muted small">This modal will update once authentication is complete.</p>
                                </div>
                            </div>
                            
                            <!-- Fallback State -->
                            <div v-else>
                                <div class="alert alert-secondary mb-3">
                                    <i class="fa-solid fa-shield-alt fa-fw me-2"></i>
                                    <strong>Authentication Status:</strong> Initializing...
                                </div>
                                <p class="mb-3">Preparing authentication interface...</p>
                                <div class="d-flex gap-2">
                                    <button type="button" 
                                            class="btn btn-outline-light flex-fill" 
                                            @click="cancelAuthentication()">
                                        <i class="fa-solid fa-times fa-fw me-2"></i>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                            
                        </div>
                        
                    </div>
                </div>
            </div>
            
            <!-- Modal Backdrop -->
            <div class="modal-backdrop fade show" style=" background-color: rgb(27, 27, 28); opacity: .5;"></div>
        </teleport>
    `
};
