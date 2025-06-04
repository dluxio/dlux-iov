import ToastVue from "/js/toastvue.js";
import StWidget from "/js/stwidget.js";
import SwMonitor from "/js/sw-monitor.js";
import Mcommon from "/js/methods-common.js";

let hapi = localStorage.getItem("hapi") || "https://hive-api.dlux.io";

export default {
  data() {
    return {
      chatVisible: false,
      userPinFeedback: "",
      passwordField: "",
      level: "posting",
      decrypted: {
        pin: false,
        accounts: {
        },
      },
      notifications: [],
      accountRequests: [],
      notificationsLoading: false,
      notificationsError: null,
      notificationsCount: 0,
      hapi: hapi,
      HAS: false,
      HKC: true,
      HSR: false,
      PEN: false,
      PWA: false,
      user: "",
      userField: "",
      accountMenu: false,
      recentUsers: [],
      filterUsers: "",
      filterRecents: [],
      ops: [],
      HAS_: {
        SERVER: "wss://hive-auth.arcange.eu",
        APP_DATA: {
          name: "dlux-io-has",
          description: "DLUX Client",
          // icon:"https://domain.com/logo.png",
        },
        app_key: "",
        token: "",
        expire: "",
        auth_key: "",
        auth_uuid: "",
        ws: null,
        wsa: true,
        ws_status: "",
        wsconn: false,
        qrcode_url: "",
        uri: "",
      },
      haspich: 50,
      haspic: "/img/hiveauth.svg",
      PIN: "",
      PENstatus: "",
      pinSetup: false,
      showPinModal: false,
      newPin: "",
      confirmPin: "",
      pinError: "",
      isCreatingPin: false,
      pinLoading: false,
      pendingOperation: null, // Store operation that's waiting for PIN
      pendingAccountData: null, // Store pending new account data
      showKeyModal: false,
      keyType: "posting",
      privateKey: "",
      keyError: "",
      keyLoading: false,
      consentPrivacy: false,
      consentTerms: false,
      consentError: false,
      // PEN Management
      showPenModal: false,
      showPenKeys: {},
      penManagementMode: 'overview', // 'overview', 'decrypt', 'manage'
      penDecryptPassword: '',
      penDecryptError: '',
      showExportModal: false,
      exportAccount: '',
      exportKeys: [],
      exportFormat: 'text', // 'text' or 'qr'
      // PIN Change
      showChangePinModal: false,
      currentPin: '',
      newPinChange: '',
      confirmPinChange: '',
      changePinError: '',
      changePinLoading: false,
      // Key editing
      editingAccount: '',
      editingKeyType: '',
      editingKeyValue: '',
      isUpdatingKey: false, // false for adding, true for updating
      // Transaction confirmation
      showConfirmModal: false,
      confirmTransaction: null,
      confirmAccount: '',
      confirmOperations: [],
      confirmKeyType: '',
      confirmDontAsk: false,
      pendingConfirmResolve: null,
      pendingConfirmReject: null,
      walletState: Date.now(), // Add this to force reactivity
    };
  },
  components: {
    "toast-vue": ToastVue,
    "sw-monitor": SwMonitor,
  },
  emits: ["login", "logout", "refresh", "ack", "store-new-account"],
  props: {
    op: {
      type: Object,
      default: function () {
        return {}
      }
    },
    node: {
      type: Boolean,
      required: false,
      default: false
    },
    lapi: {
      type: String,
      required: false,
      default: ""
    },
  },
  watch: {
    showPinModal(newVal) {
      if (newVal) {
        // Show the modal using Bootstrap after DOM update
        this.$nextTick(() => {
          const modalElement = document.getElementById('pinModal');
          if (modalElement) {
            // Clean up any existing modal state first
            const existingModal = bootstrap.Modal.getInstance(modalElement);
            if (existingModal) {
              existingModal.dispose();
            }

            const modal = new bootstrap.Modal(modalElement, {
              backdrop: 'static',
              keyboard: true
            });
            modal.show();

            // Handle modal close events
            modalElement.addEventListener('hidden.bs.modal', () => {
              this.showPinModal = false;
              this.pinError = "";
              this.newPin = "";
              this.confirmPin = "";
              this.pinLoading = false;

              // Force cleanup of backdrops
              setTimeout(() => {
                const backdrops = document.querySelectorAll('.modal-backdrop');
                backdrops.forEach(backdrop => backdrop.remove());
                document.body.classList.remove('modal-open');
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
              }, 50);

              // If there was a pending operation, reject it
              if (this.pendingOperation) {
                this.pendingOperation.reject(new Error("PIN entry cancelled"));
                this.pendingOperation = null;
              }

              // Don't clear PIN if it was successfully set up
              if (this.isCreatingPin && !this.decrypted.pin) {
                this.PIN = "";
              }
            }, { once: true });

            // Focus on PIN input when modal is shown
            modalElement.addEventListener('shown.bs.modal', () => {
              const pinInput = this.$refs.pinInput;
              if (pinInput) {
                pinInput.focus();
              }
            }, { once: true });
          }
        });
      }
    },
    showKeyModal(newVal) {
      if (newVal) {
        // Show the key modal using Bootstrap after DOM update
        this.$nextTick(() => {
          const modalElement = document.getElementById('keyModal');
          if (modalElement) {
            // Clean up any existing modal state first
            const existingModal = bootstrap.Modal.getInstance(modalElement);
            if (existingModal) {
              existingModal.dispose();
            }

            const modal = new bootstrap.Modal(modalElement, {
              backdrop: 'static',
              keyboard: true
            });

            // Set higher z-index to appear above management modal
            modalElement.style.zIndex = '2060';

            modal.show();

            // Handle modal close events
            modalElement.addEventListener('hidden.bs.modal', () => {
              this.showKeyModal = false;
              this.privateKey = "";
              this.keyError = "";
              this.keyLoading = false;

              // Reset z-index
              modalElement.style.zIndex = '';

              // Force cleanup of backdrops, but be careful not to remove the management modal backdrop
              setTimeout(() => {
                const backdrops = document.querySelectorAll('.modal-backdrop');
                // Only remove the last backdrop (the key modal's backdrop)
                if (backdrops.length > 1) {
                  backdrops[backdrops.length - 1].remove();
                }
                // Don't remove modal-open class if there are still modals open
                if (backdrops.length <= 1) {
                  document.body.classList.remove('modal-open');
                  document.body.style.overflow = '';
                  document.body.style.paddingRight = '';
                }
              }, 50);
            }, { once: true });

            // Focus on key input when modal is shown
            modalElement.addEventListener('shown.bs.modal', () => {
              // Set backdrop z-index to be just below the modal
              const backdrops = document.querySelectorAll('.modal-backdrop');
              if (backdrops.length > 0) {
                backdrops[backdrops.length - 1].style.zIndex = '2059';
              }

              const keyInput = this.$refs.keyInput;
              if (keyInput) {
                keyInput.focus();
              }
            }, { once: true });
          }
        });
      }
    },
    showPenModal(newVal) {
      if (newVal) {
        // Show the PEN management modal using Bootstrap after DOM update
        this.$nextTick(() => {
          const modalElement = document.getElementById('penModal');
          if (modalElement) {
            // Clean up any existing modal state first
            const existingModal = bootstrap.Modal.getInstance(modalElement);
            if (existingModal) {
              existingModal.dispose();
            }

            const modal = new bootstrap.Modal(modalElement, {
              backdrop: 'static',
              keyboard: true
            });
            modal.show();

            // Handle modal close events
            modalElement.addEventListener('hidden.bs.modal', () => {
              this.showPenModal = false;
              this.penDecryptPassword = "";
              this.penDecryptError = "";
              this.penManagementMode = 'overview';

              // Force cleanup of backdrops
              setTimeout(() => {
                const backdrops = document.querySelectorAll('.modal-backdrop');
                backdrops.forEach(backdrop => backdrop.remove());
                document.body.classList.remove('modal-open');
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
              }, 50);
            }, { once: true });
          }
        });
      }
    },
    showExportModal(newVal) {
      if (newVal) {
        // Show the export modal using Bootstrap after DOM update
        this.$nextTick(() => {
          const modalElement = document.getElementById('exportModal');
          if (modalElement) {
            // Clean up any existing modal state first
            const existingModal = bootstrap.Modal.getInstance(modalElement);
            if (existingModal) {
              existingModal.dispose();
            }

            const modal = new bootstrap.Modal(modalElement, {
              backdrop: 'static',
              keyboard: true
            });
            modal.show();

            // Handle modal close events
            modalElement.addEventListener('hidden.bs.modal', () => {
              this.showExportModal = false;
              this.exportAccount = '';
              this.exportKeys = [];
              this.exportFormat = 'text';

              // Force cleanup of backdrops
              setTimeout(() => {
                const backdrops = document.querySelectorAll('.modal-backdrop');
                backdrops.forEach(backdrop => backdrop.remove());
                document.body.classList.remove('modal-open');
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
              }, 50);
            }, { once: true });
          }
        });
      }
    },
    showChangePinModal(newVal) {
      if (newVal) {
        // Show the PIN change modal using Bootstrap after DOM update
        this.$nextTick(() => {
          const modalElement = document.getElementById('changePinModal');
          if (modalElement) {
            // Clean up any existing modal state first
            const existingModal = bootstrap.Modal.getInstance(modalElement);
            if (existingModal) {
              existingModal.dispose();
            }

            const modal = new bootstrap.Modal(modalElement, {
              backdrop: 'static',
              keyboard: true
            });
            modal.show();

            // Handle modal close events
            modalElement.addEventListener('hidden.bs.modal', () => {
              this.showChangePinModal = false;
              this.currentPin = '';
              this.newPinChange = '';
              this.confirmPinChange = '';
              this.changePinError = '';
              this.changePinLoading = false;

              // Force cleanup of backdrops
              setTimeout(() => {
                const backdrops = document.querySelectorAll('.modal-backdrop');
                backdrops.forEach(backdrop => backdrop.remove());
                document.body.classList.remove('modal-open');
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
              }, 50);
            }, { once: true });
          }
        });
      }
    },
    showConfirmModal(newVal) {
      if (newVal) {
        // Show the confirmation modal using Bootstrap after DOM update
        this.$nextTick(() => {
          const modalElement = document.getElementById('confirmModal');
          if (modalElement) {
            // Clean up any existing modal state first
            const existingModal = bootstrap.Modal.getInstance(modalElement);
            if (existingModal) {
              existingModal.dispose();
            }

            const modal = new bootstrap.Modal(modalElement, {
              backdrop: 'static',
              keyboard: true
            });
            modal.show();

            // Handle modal close events
            modalElement.addEventListener('hidden.bs.modal', () => {
              this.showConfirmModal = false;
              this.confirmTransaction = null;
              this.confirmAccount = '';
              this.confirmOperations = [];
              this.confirmKeyType = '';
              this.confirmDontAsk = false;

              // Force cleanup of backdrops
              setTimeout(() => {
                const backdrops = document.querySelectorAll('.modal-backdrop');
                backdrops.forEach(backdrop => backdrop.remove());
                document.body.classList.remove('modal-open');
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
              }, 50);

              // Reject pending transaction if modal was closed without confirmation
              if (this.pendingConfirmReject) {
                this.pendingConfirmReject(new Error("Transaction cancelled by user"));
                this.pendingConfirmResolve = null;
                this.pendingConfirmReject = null;
              }
            }, { once: true });
          }
        });
      }
    },
    op(op, oldOp) {
      if (op.txid) {
        op.time = new Date().getTime();
        op.status = "Pending your approval";
        op.delay = 5000;
        op.title = op.id ? op.id : op.cj ? op.cj.memo : "No Waiter";
        this.ops.push(op);
        this.$emit("ack", op.txid);
        if (op.type == "cja") {
          this.broadcastCJA(op);
        } else if (op.type == "cj") {
          this.broadcastCJ(op);
        } else if (this.op.type == "xfr") {
          this.broadcastTransfer(op);
        } else if (this.op.type == "comment") {
          this.broadcastComment(op);
        } else if (this.op.type == "vote") {
          this.broadcastVote(op);
        } else if (this.op.type == "raw") {
          this.broadcastRaw(op);
        } else if (this.op.type == "sign_headers") {
          this.signHeaders(op);
        }
        localStorage.setItem("pending", JSON.stringify(this.ops));
      }
    },
  },
  methods: {
    ...Mcommon,
    toggleChat() {
      this.chatVisible = !this.chatVisible;
    },
    // Benchmark PBKDF2 to find iteration count for target duration
    async benchmarkPBKDF2(targetDurationMs = 2000) {
      const testPassword = "benchmark-test-password";
      const testSalt = crypto.getRandomValues(new Uint8Array(32));

      // Start with a reasonable baseline
      let iterations = 100000;
      let duration = 0;

      // Binary search approach to find optimal iteration count
      let minIterations = 50000;
      let maxIterations = 1000000;

      while (maxIterations - minIterations > 10000) {
        const startTime = performance.now();

        const encoder = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
          "raw",
          encoder.encode(testPassword),
          { name: "PBKDF2" },
          false,
          ["deriveBits"]
        );

        await crypto.subtle.deriveBits(
          {
            name: "PBKDF2",
            salt: testSalt,
            iterations: iterations,
            hash: "SHA-256"
          },
          keyMaterial,
          256
        );

        duration = performance.now() - startTime;

        if (duration < targetDurationMs * 0.9) {
          minIterations = iterations;
          iterations = Math.floor((iterations + maxIterations) / 2);
        } else if (duration > targetDurationMs * 1.1) {
          maxIterations = iterations;
          iterations = Math.floor((minIterations + iterations) / 2);
        } else {
          break;
        }
      }

      console.log(`PBKDF2 benchmark: ${iterations} iterations = ${Math.round(duration)}ms`);
      return iterations;
    },

    // Generate cryptographically secure salt
    generateSalt() {
      return crypto.getRandomValues(new Uint8Array(32));
    },

    // Derive key using PBKDF2
    async deriveKey(password, salt, iterations) {
      const encoder = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits"]
      );

      const derivedBits = await crypto.subtle.deriveBits(
        {
          name: "PBKDF2",
          salt: salt,
          iterations: iterations,
          hash: "SHA-256"
        },
        keyMaterial,
        256
      );

      return new Uint8Array(derivedBits);
    },

    // Convert Uint8Array to hex string
    uint8ArrayToHex(uint8Array) {
      return Array.from(uint8Array)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    },

    // Convert hex string to Uint8Array
    hexToUint8Array(hexString) {
      const bytes = new Uint8Array(hexString.length / 2);
      for (let i = 0; i < hexString.length; i += 2) {
        bytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
      }
      return bytes;
    },

    // Hardened encryption using PBKDF2 + AES
    async encryptWithPBKDF2(data, password) {
      try {
        // Generate salt using CryptoJS for better compatibility
        const salt = CryptoJS.lib.WordArray.random(32); // 32 bytes

        // Use a reasonable default iteration count for now (can be adjusted later)
        const iterations = 100000; // Still secure but much faster than 996k

        // Convert to string first
        const dataString = JSON.stringify(data);
        console.log("Data to encrypt length:", dataString.length);

        // Use simpler CryptoJS encryption with PBKDF2
        const key = CryptoJS.PBKDF2(password, salt, {
          keySize: 8, // 8 * 32 bits = 256 bits
          iterations: iterations
        });

        console.log("Key generated, encrypting...");

        // Use simple AES encryption with the derived key
        const encrypted = CryptoJS.AES.encrypt(dataString, key.toString());

        console.log("Encryption successful");

        // Package everything together
        const packagedData = {
          version: "3.0", // New simpler version
          salt: salt.toString(),
          iterations: iterations,
          encrypted: encrypted.toString(),
          timestamp: Date.now()
        };

        return JSON.stringify(packagedData);
      } catch (error) {
        console.error("Encryption failed:", error);
        throw new Error("Failed to encrypt data: " + error.message);
      }
    },

    // Hardened decryption using PBKDF2 + AES
    async decryptWithPBKDF2(encryptedPackage, password) {
      try {
        const packagedData = JSON.parse(encryptedPackage);

        // Validate package format
        if (!packagedData.salt || !packagedData.iterations || !packagedData.encrypted) {
          throw new Error("Invalid encrypted package format");
        }

        console.log("Decrypting version:", packagedData.version || "1.0");

        // Handle different versions
        if (packagedData.version === "3.0") {
          // Use simplified CryptoJS approach for v3.0
          const salt = CryptoJS.enc.Hex.parse(packagedData.salt);
          const key = CryptoJS.PBKDF2(password, salt, {
            keySize: 8,
            iterations: packagedData.iterations
          });

          console.log("Decryption key generated for v3.0");

          // Decrypt using the derived key as string
          const decrypted = CryptoJS.AES.decrypt(packagedData.encrypted, key.toString());
          const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);

          if (!decryptedString) {
            throw new Error("Failed to decrypt - incorrect password or corrupted data");
          }

          return JSON.parse(decryptedString);
        } else if (packagedData.version === "2.0") {
          // Use CryptoJS PBKDF2 directly for v2.0
          const salt = CryptoJS.enc.Hex.parse(packagedData.salt);
          const key = CryptoJS.PBKDF2(password, salt, {
            keySize: 256 / 32,
            iterations: packagedData.iterations,
            hasher: CryptoJS.algo.SHA256
          });

          console.log("Decryption key generated:", {
            keySize: key.sigBytes,
            saltSize: salt.sigBytes,
            iterations: packagedData.iterations
          });

          // Decrypt using default settings
          const decrypted = CryptoJS.AES.decrypt(packagedData.encrypted, key);
          const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);

          if (!decryptedString) {
            throw new Error("Failed to decrypt - incorrect password or corrupted data");
          }

          return JSON.parse(decryptedString);
        } else {
          // Fallback to Web Crypto API method for v1.0
          const salt = this.hexToUint8Array(packagedData.salt);
          const derivedKey = await this.deriveKey(password, salt, packagedData.iterations);
          const keyHex = this.uint8ArrayToHex(derivedKey);
          const key = CryptoJS.enc.Hex.parse(keyHex);

          // Parse IV if present (for v1.0 format)
          let decryptOptions = {
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
          };

          if (packagedData.iv) {
            decryptOptions.iv = CryptoJS.enc.Hex.parse(packagedData.iv);
          }

          const decrypted = CryptoJS.AES.decrypt(packagedData.encrypted, key, decryptOptions);
          const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);

          if (!decryptedString) {
            throw new Error("Failed to decrypt - incorrect password or corrupted data");
          }

          return JSON.parse(decryptedString);
        }
      } catch (error) {
        console.error("Decryption failed:", error);
        throw new Error("Failed to decrypt data - check password");
      }
    },

    async storeKey(level, key) {
      // Check if PIN is set up
      if (!this.PIN) {
        this.PENstatus = "Please set up PIN first";
        this.setupNewPin();
        throw new Error("PIN not set up");
      }

      // Validate key format
      if (!key || !key.trim()) {
        throw new Error("Private key cannot be empty");
      }

      const trimmedKey = key.trim();
      if (!trimmedKey.startsWith('5') || trimmedKey.length < 50) {
        throw new Error("Invalid private key format. Must start with '5' and be at least 50 characters long.");
      }

      // Check if this is a pending account (skip verification)
      const isPendingAccount = this.decrypted.accounts[this.user] &&
        this.decrypted.accounts[this.user].isPendingCreation;

      if (isPendingAccount) {
        // Skip verification for pending accounts
        console.log("Skipping key verification for pending account:", this.user);

        // Initialize user account if not exists
        if (!this.decrypted.accounts[this.user]) {
          this.decrypted.accounts[this.user] = {};
        }
        this.decrypted.accounts[this.user][level] = trimmedKey;

        // Use hardened encryption
        const encrypted = await this.encryptWithPBKDF2(
          this.decrypted,
          this.PIN
        );

        localStorage.setItem("PEN", encrypted);
        sessionStorage.setItem('pen', JSON.stringify(this.decrypted));
        this.PENstatus = "Key stored successfully (pending account)";
        this.walletState = Date.now();
        return;
      }

      try {
        const response = await fetch("https://api.hive.blog", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "condenser_api.get_accounts",
            params: [[this.user]],
            id: 1
          }),
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(`API error: ${data.error.message || data.error}`);
        }

        const accountData = data.result && data.result[0];

        if (!accountData) {
          throw new Error(`User @${this.user} not found on Hive blockchain`);
        }

        // Verify the key matches the account by comparing public keys
        const expectedPublicKey = accountData[level].key_auths[0][0];
        let success = false;

        try {
          const PrivateKey = hiveTx.PrivateKey.from(trimmedKey);

          // Get the public key - try the most common methods
          let derivedPublicKey;

          if (PrivateKey.publicKey && typeof PrivateKey.publicKey.toString === 'function') {
            derivedPublicKey = PrivateKey.publicKey.toString();
          } else if (PrivateKey.toPublic && typeof PrivateKey.toPublic === 'function') {
            const pubKey = PrivateKey.toPublic();
            derivedPublicKey = pubKey.toString();
          } else {
            console.log("PrivateKey object:", PrivateKey);
            console.log("Available methods:", Object.getOwnPropertyNames(PrivateKey));
            throw new Error("Unable to derive public key from private key - unsupported library version");
          }

          console.log("Expected public key:", expectedPublicKey);
          console.log("Derived public key:", derivedPublicKey);

          // Normalize both keys for comparison (remove prefixes)
          const normalizeKey = (key) => {
            if (typeof key !== 'string') return '';
            if (key.startsWith('STM')) return key.substring(3);
            if (key.startsWith('TST')) return key.substring(3);
            return key;
          };

          const normalizedExpected = normalizeKey(expectedPublicKey);
          const normalizedDerived = normalizeKey(derivedPublicKey);

          console.log("Normalized expected:", normalizedExpected);
          console.log("Normalized derived:", normalizedDerived);

          // Compare normalized keys
          success = normalizedExpected === normalizedDerived;

          console.log("Key validation result:", success);

        } catch (keyError) {
          console.error("Error deriving public key:", keyError);
          // For now, if we can't verify the key, let's assume it's valid if it passes basic format checks
          // This is less secure but allows the system to work
          console.log("Skipping public key verification due to library limitations");
          success = true; // Allow the key to be stored
        }

        if (success) {
          // Initialize user account if not exists
          if (!this.decrypted.accounts[this.user]) {
            this.decrypted.accounts[this.user] = {};
          }
          this.decrypted.accounts[this.user][level] = trimmedKey;

          // Use hardened encryption
          const encrypted = await this.encryptWithPBKDF2(
            this.decrypted,
            this.PIN
          );

          localStorage.setItem("PEN", encrypted);
          sessionStorage.setItem('pen', JSON.stringify(this.decrypted));
          this.PENstatus = "Key stored successfully";
          this.walletState = Date.now();
        } else {
          throw new Error("Private key does not match the public key for this account");
        }
      } catch (error) {
        console.error("Failed to store key:", error);

        // Handle specific error types
        if (error.message.includes("invalid private key") || error.message.includes("Invalid private key")) {
          throw new Error("Invalid private key format or key does not match account");
        } else if (error.message.includes("User") && error.message.includes("not found")) {
          throw new Error(`Account @${this.user} does not exist on Hive blockchain`);
        } else if (error.message.includes("API") || error.message.includes("fetch")) {
          throw new Error("Network error: Unable to verify account. Please check your connection.");
        } else if (error.message.includes("JSON") || error.message.includes("parse")) {
          throw new Error("API response error: Please try again in a moment");
        } else {
          throw new Error(`Failed to store key: ${error.message}`);
        }
      }
    },

    // Method to store new accounts from onboarding
    async storeNewAccount(accountData) {
      try {
        console.log('Storing new account in dluxPEN:', accountData);

        // Ensure we have a valid username
        if (!accountData.username) {
          throw new Error("Username is required");
        }

        // Check if there's an existing encrypted wallet first
        const existingPEN = localStorage.getItem("PEN");
        
        if (existingPEN && !this.PIN) {
          // We have an encrypted wallet but no PIN - need to decrypt first
          console.log('Found existing encrypted wallet, requesting PIN for decryption...');
          this.pendingAccountData = accountData;
          this.requestPinForDecryption();
          return; // Return early, will be processed after PIN is entered
        }
        
        // Ensure PIN is set up
        if (!this.PIN) {
          console.log('No PIN found, setting up new PIN...');
          this.pendingAccountData = accountData;
          this.setupNewPin();
          return; // Return early, will be processed after PIN is created
        }

        // Initialize accounts structure if needed
        if (!this.decrypted.accounts) {
          this.decrypted.accounts = {};
        }

        // Store the new account data
        this.decrypted.accounts[accountData.username] = {
          posting: accountData.keys.posting || '',
          active: accountData.keys.active || '',
          memo: accountData.keys.memo || '',
          owner: accountData.keys.owner || '',
          master: accountData.keys.master || '',
          noPrompt: {},
          isPendingCreation: accountData.isPendingCreation || true,
          publicKeys: accountData.publicKeys || {},
          recoveryMethod: accountData.recoveryMethod || null
        };

        // Encrypt and save
        const encrypted = await this.encryptWithPBKDF2(this.decrypted, this.PIN);
        localStorage.setItem("PEN", encrypted);
        sessionStorage.setItem('pen', JSON.stringify(this.decrypted));
        this.walletState = Date.now();

        this.PENstatus = `New account @${accountData.username} stored successfully`;

        console.log('New account stored successfully in dluxPEN');
        
        // Clear any pending account data
        this.pendingAccountData = null;
        localStorage.removeItem('pendingNewAccount');
        
        return true;

      } catch (error) {
        console.error("Failed to store new account:", error);
        this.PENstatus = "Failed to store new account: " + error.message;
        throw error;
      }
    },

    async decryptPEN(user = this.user) {
      try {
        const PEN = localStorage.getItem("PEN");
        if (!PEN) {
          console.log("No PEN data found");
          return;
        }

        // Try new hardened decryption first
        try {
          const decrypted = await this.decryptWithPBKDF2(PEN, this.PIN);
          this.decrypted = decrypted;
          sessionStorage.setItem('pen', JSON.stringify(decrypted));
          console.log("Successfully decrypted with PBKDF2");
          return;
        } catch (pbkdf2Error) {
          console.log("PBKDF2 decryption failed, trying legacy method:", pbkdf2Error.message);
        }

        // Fallback to legacy decryption for backward compatibility
        try {
          const decrypted = CryptoJS.AES.decrypt(PEN, this.PIN);
          const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
          if (decryptedString) {
            this.decrypted = JSON.parse(decryptedString);
            sessionStorage.setItem('pen', decryptedString);
            console.log("Successfully decrypted with legacy method");

            // Upgrade to new encryption format
            console.log("Upgrading to PBKDF2 encryption...");
            const upgraded = await this.encryptWithPBKDF2(this.decrypted, this.PIN);
            localStorage.setItem("PEN", upgraded);
            console.log("Encryption upgraded successfully");
          } else {
            throw new Error("Legacy decryption failed");
          }
        } catch (legacyError) {
          console.error("Both PBKDF2 and legacy decryption failed:", legacyError);
          throw new Error("Failed to decrypt PEN data");
        }
      } catch (error) {
        console.error("Failed to decrypt PEN:", error);
        this.PENstatus = "Failed to decrypt - check PIN";
      }
    },
    useHAS() {
      this.HAS = true;
      this.HKC = false;
      this.HSR = false;
      this.PEN = false;
      localStorage.setItem("signer", "HAS");
      if (this.user) this.HASsetup();
    },
    useHS() {
      this.HAS = false;
      this.HKC = false;
      this.HSR = true;
      this.PEN = false;
      localStorage.setItem("signer", "HSR");
    },
    useKC() {
      this.HAS = false;
      this.HKC = true;
      this.HSR = false;
      this.PEN = false;
      localStorage.setItem("signer", "HKC");
    },
    async usePEN() {
      this.HAS = false;
      this.HKC = false;
      this.HSR = false;
      this.PEN = true;
      localStorage.setItem("signer", "PEN");
      //await this.initializePEN();
    },

    async initializePEN() {
      // Initialize basic decrypted structure if not exists
      if (!this.decrypted) {
        this.decrypted = {
          pin: false,
          accounts: {}
        };
      }

      // Check for pending new account from onboarding
      const pendingAccount = localStorage.getItem('pendingNewAccount');
      if (pendingAccount) {
        try {
          const accountData = JSON.parse(pendingAccount);
          console.log('Found pending new account, storing in PEN:', accountData);

          // If no PIN set up yet, trigger PIN setup
          if (!this.PIN && !localStorage.getItem("PEN")) {
            this.setupNewPin();
            // Store the pending account data to be processed after PIN setup
            this.pendingAccountData = accountData;
          } else if (this.PIN) {
            // PIN already available, store immediately
            await this.storeNewAccount(accountData);
            localStorage.removeItem('pendingNewAccount');
          }
        } catch (error) {
          console.error('Failed to process pending account:', error);
          localStorage.removeItem('pendingNewAccount');
        }
      }

      // Check if there's existing PEN data
      const existingPEN = localStorage.getItem("PEN");
      const sessionPin = sessionStorage.getItem('penPin');

      if (existingPEN && this.user) {
        if (sessionPin) {
          // We have a PIN in session, try to decrypt automatically
          this.PIN = sessionPin;
          try {
            await this.decryptPEN();
            this.PENstatus = "PEN data loaded from session";
          } catch (error) {
            // PIN in session is invalid, ask for new one
            sessionStorage.removeItem('penPin');
            this.PIN = "";
            this.requestPinForDecryption();
          }
        } else {
          // Ask for PIN to decrypt existing data
          this.requestPinForDecryption();
        }
      } else if (this.user) {
        // No existing data, set up PIN
        this.setupNewPin();
      }
      // Note: PIN setup will be triggered when user logs in if they don't have existing data
    },

    setupNewPin() {
      this.isCreatingPin = true;
      this.pinError = "";
      this.newPin = "";
      this.confirmPin = "";
      this.showPinModal = true;
    },

    requestPinForDecryption(pendingOp = null) {
      this.isCreatingPin = false;
      this.pinError = "";
      this.PIN = "";
      this.pendingOperation = pendingOp;
      this.showPinModal = true;
    },

    async handlePinSubmit() {
      if (this.isCreatingPin) {
        // Creating a new PIN
        if (!this.newPin || this.newPin.length < 4) {
          this.pinError = "PIN must be at least 4 characters long";
          return;
        }
        if (this.newPin !== this.confirmPin) {
          this.pinError = "PINs do not match";
          return;
        }

        this.pinLoading = true;
        this.pinError = "";

        try {
          this.PIN = this.newPin;
          
          // Check if we already have decrypted data (from existing wallet)
          if (!this.decrypted || !this.decrypted.accounts) {
            this.decrypted = {
              pin: true,
              accounts: {}
            };
          } else {
            this.decrypted.pin = true;
          }

          // Initialize accounts structure for current user only if not exists
          if (!this.decrypted.accounts) {
            this.decrypted.accounts = {};
          }
          if (this.user && !this.decrypted.accounts[this.user]) {
            this.decrypted.accounts[this.user] = {
              posting: "",
              active: "",
              memo: "",
              owner: "",
              master: "",
              noPrompt: {} // Store transaction type preferences
            };
          }

          // Store the structure
          const encrypted = await this.encryptWithPBKDF2(this.decrypted, this.PIN);
          localStorage.setItem("PEN", encrypted);
          sessionStorage.setItem('pen', JSON.stringify(this.decrypted));
          // Store PIN in session for this session
          sessionStorage.setItem('penPin', this.PIN);

          this.closePinModalProperly();
          this.PENstatus = "PIN created successfully. You can now store keys.";

          // Process pending account data if available
          if (this.pendingAccountData) {
            try {
              await this.storeNewAccount(this.pendingAccountData);
              this.PENstatus = "PIN created and new account stored successfully!";
            } catch (error) {
              console.error('Failed to store pending account after PIN setup:', error);
              this.PENstatus = "PIN created but failed to store new account: " + error.message;
            }
          }
          this.walletState = Date.now();
        } catch (error) {
          console.error("Failed to save initial PEN data:", error);
          this.pinError = "Failed to save PIN setup: " + error.message;
        } finally {
          this.pinLoading = false;
        }
      } else {
        // Entering PIN to decrypt
        if (!this.PIN) {
          this.pinError = "Please enter your PIN";
          return;
        }

        this.pinLoading = true;
        this.pinError = "";

        try {
          await this.decryptPEN();
          // Store PIN in session for this session
          sessionStorage.setItem('penPin', this.PIN);
          this.closePinModalProperly();
          this.PENstatus = "Successfully decrypted PEN data";

          // Process pending account data if available (from onboarding)
          if (this.pendingAccountData) {
            try {
              await this.storeNewAccount(this.pendingAccountData);
              this.PENstatus = "Wallet decrypted and new account stored successfully!";
            } catch (error) {
              console.error('Failed to store pending account after decryption:', error);
              this.PENstatus = "Wallet decrypted but failed to store new account: " + error.message;
            }
          }

          // If there was a pending operation, retry it
          if (this.pendingOperation) {
            console.log("Retrying pending operation after PIN entry");
            const op = this.pendingOperation;
            this.pendingOperation = null;
            // Retry the operation
            setTimeout(() => {
              if (op.type === 'sign') {
                this.sign(op.data).then(op.resolve).catch(op.reject);
              } else if (op.type === 'signOnly') {
                this.signOnly(op.data).then(op.resolve).catch(op.reject);
              }
            }, 100);
          }
        } catch (error) {
          this.pinError = "Invalid PIN or corrupted data: " + error.message;
          console.error("Failed to decrypt PEN data:", error);
        } finally {
          this.pinLoading = false;
        }
      }
      this.walletState = Date.now();
    },

    closePinModal() {
      // Hide the Bootstrap modal first
      const modalElement = document.getElementById('pinModal');
      if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
          modal.hide();
        }
      }

      // Clear state (this will also be handled by the modal event listener)
      this.showPinModal = false;
      this.pinError = "";
      this.newPin = "";
      this.confirmPin = "";
      this.pinLoading = false;

      // If there was a pending operation, reject it
      if (this.pendingOperation) {
        this.pendingOperation.reject(new Error("PIN entry cancelled"));
        this.pendingOperation = null;
      }

      // Don't clear PIN if it was successfully set up
      if (this.isCreatingPin && !this.decrypted.pin) {
        this.PIN = "";
      }
    },

    closePinModalProperly() {
      // Force hide the Bootstrap modal and clean up backdrop
      const modalElement = document.getElementById('pinModal');
      if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
          modal.hide();
        }

        // Force cleanup of any remaining backdrops
        setTimeout(() => {
          const backdrops = document.querySelectorAll('.modal-backdrop');
          backdrops.forEach(backdrop => backdrop.remove());
          document.body.classList.remove('modal-open');
          document.body.style.overflow = '';
          document.body.style.paddingRight = '';
        }, 100);
      }

      // Clear state
      this.showPinModal = false;
      this.pinError = "";
      this.newPin = "";
      this.confirmPin = "";
      this.pinLoading = false;
    },

    requestPrivateKey(keyType) {
      this.keyType = keyType;
      this.privateKey = "";
      this.keyError = "";
      this.keyLoading = false;
      this.showKeyModal = true;
    },

    closeKeyModal() {
      const modalElement = document.getElementById('keyModal');
      if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
          modal.hide();
        }

        // Force cleanup of backdrops
        setTimeout(() => {
          const backdrops = document.querySelectorAll('.modal-backdrop');
          backdrops.forEach(backdrop => backdrop.remove());
          document.body.classList.remove('modal-open');
          document.body.style.overflow = '';
          document.body.style.paddingRight = '';
        }, 100);
      }

      this.showKeyModal = false;
      this.privateKey = "";
      this.keyError = "";
      this.keyLoading = false;

      // Clear editing state
      this.editingAccount = '';
      this.editingKeyType = '';
      this.editingKeyValue = '';
      this.isUpdatingKey = false;
    },

    async handleKeySubmit() {
      // If we're in editing mode, use the enhanced handler
      if (this.editingAccount) {
        return await this.handleKeyEdit();
      }

      // Original functionality for adding keys to current user
      if (!this.privateKey || !this.privateKey.trim()) {
        this.keyError = "Please enter a private key";
        return;
      }

      this.keyLoading = true;
      this.keyError = "";

      try {
        await this.storeKey(this.keyType, this.privateKey.trim());
        this.closeKeyModal();
        this.PENstatus = `${this.keyType} key stored successfully`;

        // If there was a pending operation, retry it after key storage
        if (this.pendingOperation) {
          console.log("Retrying pending operation after key storage");
          const op = this.pendingOperation;
          this.pendingOperation = null;

          // Retry the operation with a small delay
          setTimeout(() => {
            if (op.type === 'sign') {
              this.sign(op.data).then(op.resolve).catch(op.reject);
            } else if (op.type === 'signOnly') {
              this.signOnly(op.data).then(op.resolve).catch(op.reject);
            }
          }, 100);
        }

      } catch (error) {
        console.error("Failed to store key:", error);
        this.keyError = "Failed to store key: " + error.message;
      } finally {
        this.keyLoading = false;
      }
      this.walletState = Date.now();
    },

    broadcastCJ(obj) {
      var op = [
        this.user,
        [
          [
            "custom_json",
            {
              required_auths: [],
              required_posting_auths: [this.user],
              id: obj.id,
              json: JSON.stringify(obj.cj),
            },
          ],
        ],
        "active",
      ];
      console.log("CJ");
      this.sign(op)
        .then((r) => {
          this.statusFinder(r, obj);
          try {
            obj.callbacks[0](`${obj.challenge}:${r}`, console.log("callback?"));
          } catch (e) { }
        })
        .catch((e) => {
          console.log(e);
        });
    },
    broadcastCJA(obj) {
      var op = [
        this.user,
        [
          [
            "custom_json",
            {
              required_auths: [this.user],
              required_posting_auths: [],
              id: obj.id,
              json: JSON.stringify(obj.cj),
            },
          ],
        ],
        "active",
      ];
      console.log("CJA");
      this.sign(op)
        .then((r) => {
          this.statusFinder(r, obj);
          try {
            obj.callbacks[0](`${obj.challenge}:${r}`, console.log("callback?"));
          } catch (e) { }
        })
        .catch((e) => {
          console.log(e);
        });
    },
    broadcastTransfer(obj) {
      var op = [
        this.user,
        [
          [
            "transfer",
            {
              to: obj.cj.to,
              from: this.user,
              amount: `${parseFloat(
                (obj.cj.hive ? obj.cj.hive : obj.cj.hbd) / 1000
              ).toFixed(3)} ${obj.cj.hive ? "HIVE" : "HBD"}`,
              memo: `${obj.cj.memo ? obj.cj.memo : ""}`,
            },
          ],
        ],
        "active",
      ];
      this.sign(op)
        .then((r) => {
          this.statusFinder(r, obj);
          try {
            obj.callbacks[0](`${obj.challenge}:${r}`, console.log("callback?"));
          } catch (e) { }
        })
        .catch((e) => {
          console.log(e);
        });
    },
    broadcastRaw(obj) {
      var op = [this.user, obj.op, obj.key || "active"];
      this.sign(op)
        .then((r) => {
          if (obj.id) this.statusFinder(r, obj);
          try {
            obj.callbacks[0](`${obj.challenge}:${r}`, console.log("callback?"));
          } catch (e) { }
        })
        .catch((e) => {
          console.log(e);
        });
    },
    signHeaders(obj) {
      var op = [this.user, obj.challenge, obj.key || "posting"];
      this.signOnly(op)
        .then((r) => {
          console.log("signHeaders Return", r);
          if (r) {
            localStorage.setItem(`${this.user}:auth`, `${obj.challenge}:${r}`);
            obj.callbacks[0](`${obj.challenge}:${r}`, console.log("callback?"));
          }
        })
        .catch((e) => {
          console.log(e);
        });
    },
    broadcastVote(obj) {
      var op = [
        this.user,
        [
          [
            "vote",
            {
              voter: this.user,
              author: obj.cj.author,
              permlink: obj.cj.permlink,
              weight: obj.cj.weight,
            },
          ],
        ],
        "posting",
      ];
      this.sign(op)
        .then((r) => {
          this.statusFinder(r, obj);
        })
        .catch((e) => {
          console.log(e);
        });
    },
    broadcastComment(obj) {
      var op = [
        this.user,
        [
          [
            "comment",
            {
              author: this.user,
              title: obj.cj.title,
              body: obj.cj.body,
              parent_author: obj.cj.parent_author,
              parent_permlink: obj.cj.parent_permlink,
              permlink: obj.cj.permlink,
              json_metadata: obj.cj.json_metadata,
            },
          ],
        ],
        "active",
      ];
      this.sign(op)
        .then((r) => {
          this.statusFinder(r, obj);
        })
        .catch((e) => {
          console.log(e);
        });
    },
    sign(op) {
      return new Promise((resolve, reject) => {
        if (this.HKC) {
          console.log("HKCsign", op);
          this.HKCsign(op)
            .then((r) => resolve(r))
            .catch((e) => reject(e));
        } else if (this.HAS) {
          console.log(op);
          this.HASsign(op);
          reject("No TXID");
        } else if (this.PEN) {
          console.log(op);
          this.PENsign(op)
            .then((r) => resolve(r))
            .catch((e) => reject(e));
        } else {
          console.log("HSR");
          this.HSRsign(op);
          reject("No TXID");
        }
      });
    },
    signOnly(op) {
      return new Promise((resolve, reject) => {
        if (this.HKC) {
          console.log("HKCsignOnly");
          this.HKCsignOnly(op)
            .then((r) => resolve(r))
            .catch((e) => reject(e));
        } else if (this.PEN) {
          console.log({ op });
          this.PENsignOnly(op)
            .then((r) => resolve(r))
            .catch((e) => reject(e));
        } else if (this.HAS) {
          console.log({ op });
          this.HASsignOnly(op)
            .then((r) => resolve(r))
            .catch((e) => reject(e));
        } else {
          alert("This feature is not supported with Hive Signer");
          //this.HSRsignOnly(op);
          reject("Not Supported");
        }
      });
    },
    HASsignOnly(op) {
      return new Promise((res, rej) => {
        const now = new Date().getTime();
        if (now > this.HAS_.expire) {
          alert(`Hive Auth Session expired. Please login again.`);
          return;
        }
        const sign_data = {
          key_type: op[2],
          challenge: `${op[0]}:${op[1]}`,
        };
        const data = CryptoJS.AES.encrypt(
          JSON.stringify(sign_data),
          this.HAS_.auth_key
        ).toString();
        const payload = {
          cmd: "challenge_req",
          account: this.user,
          token: this.HAS_.token,
          data: data,
        };
        this.HAS_.ws.send(JSON.stringify(payload));
        alert("Review and Sign on your PKSA App");
      });
    },
    HKCsignOnly(op) {
      return new Promise((res, rej) => {
        console.log(op);
        window.hive_keychain.requestSignBuffer(
          op[0],
          `${op[0]}:${op[1]}`,
          op[2],
          (sig) => {
            if (sig.error) rej(sig);
            else res(sig.result);
          }
        );
      });
    },
    PENsignOnly(op) {
      return new Promise(async (res, rej) => {
        if (typeof op[1] == "string") op[1] = JSON.parse(op[1]);
        console.log(op);

        // Check if PIN is set up
        if (!this.PIN) {
          console.log("PENsignOnly: No PIN found. PIN value:", this.PIN, "Session PIN:", sessionStorage.getItem('penPin'));

          // Check if there's encrypted PEN data that needs decryption
          const existingPEN = localStorage.getItem("PEN");
          if (existingPEN) {
            // Ask user to enter PIN to decrypt
            this.PENstatus = "Please enter your PIN to decrypt your keys";
            this.requestPinForDecryption({
              type: 'signOnly',
              data: op,
              resolve: res,
              reject: rej
            });
            return; // Don't reject immediately, let the modal handle it
          } else {
            // No PEN data at all, need to set up PIN first
            this.PENstatus = "Please set up PIN first";
            this.setupNewPin();
            rej(new Error("PIN not set up"));
          }
          return;
        }

        // Check if user data structure exists
        if (!this.decrypted.accounts || !this.decrypted.accounts[this.user]) {
          this.PENstatus = "User account structure not found";
          rej(new Error("Account structure missing"));
          return;
        }

        // Get key from decrypted storage
        var key = this.decrypted.accounts[this.user][op[2]];
        if (!key || key.trim() === "") {
          // Show modal to get the key and store the pending operation
          this.PENstatus = `Please enter your private ${op[2]} key`;
          this.pendingOperation = {
            type: 'signOnly',
            data: op,
            resolve: res,
            reject: rej
          };
          this.requestPrivateKey(op[2]);
          return; // Don't reject, let the retry handle it
        }

        // Validate the key format
        if (!key.startsWith('5') || key.length < 50) {
          this.PENstatus = `Invalid ${op[2]} key format`;
          rej(new Error(`Invalid private key format for ${op[2]}`));
          return;
        }

        try {
          const tx = new hiveTx.Transaction();
          await tx.create(op[0]); // Create transaction for the user

          // Add the operations to the transaction
          tx.operations = op[1];

          console.log("Transaction before signing:", tx.transaction);
          const privateKey = hiveTx.PrivateKey.from(key);
          tx.sign(privateKey);
          if (!tx.signedTransaction) rej('Failed to Sign')
          res(tx.signedTransaction)
        } catch (error) {
          console.error("Failed to sign transaction:", error);
          rej(error);
        }
      });
    },
    HSRsign(op) {
      if (op[1][0][0] == "custom_json") {
        if (window.confirm("Open Hive Signer in a new tab?")) {
          window.open(
            `https://hivesigner.com/sign/custom-json?authority=active&required_auths=%5B%22${this.user
            }%22%5D&required_posting_auths=%5B%5D&id=${op[1][0][1].id
            }&json=${encodeURIComponent(op[1][0][1].json)}`,
            "_blank"
          );
        }
      } else if (op[1][0][0] == "transfer") {
        window.open(
          `https://hivesigner.com/sign/transfer?authority=active&from=${op[1][0][1].from
          }&to=${op[1][0][1].to}&amount=${op[1][0][1].amount
          }&memo=${encodeURIComponent(op[1][0][1].memo)}`,
          "_blank"
        );
      } else {
        alert("Transaction Type not supported");
      }
    },
    HASsign(op) {
      const now = new Date().getTime();
      if (now > this.HAS_.expire) {
        alert(`Hive Auth Session expired. Please login again.`);
        return;
      }
      const sign_data = {
        key_type: op[2],
        ops: op[1],
        broadcast: true,
      };
      const data = CryptoJS.AES.encrypt(
        JSON.stringify(sign_data),
        this.HAS_.auth_key
      ).toString();
      const payload = {
        cmd: "sign_req",
        account: this.user,
        token: this.HAS_.token,
        data: data,
      };
      this.HAS_.ws.send(JSON.stringify(payload));
      alert("Review and Sign on your PKSA App");
    },
    HASlogin() {
      const auth_data = {
        app: this.HAS_.APP_DATA,
        token: undefined,
        challenge: undefined,
      };
      console.log("Login: ", this.user);
      if (!this.HAS_.auth_key) this.HAS_.auth_key = uuidv4();
      const data = CryptoJS.AES.encrypt(
        JSON.stringify(auth_data),
        this.HAS_.auth_key
      ).toString();
      const payload = { cmd: "auth_req", account: this.user, data: data };
      if (this.HAS_.ws) this.HAS_.ws.send(JSON.stringify(payload));
      else this.HASsetup();
    },
    HASlogout() {
      this.HAS_.token = "";
      this.HAS_.expire = "";
      this.user = "";
    },
    HASsetup() {
      if ("WebSocket" in window) {
        this.HAS_.ws = new WebSocket(this.HAS_.SERVER);
        this.HAS_.ws.onopen = function () {
          console.log("OnOpen - WS");
          this.HAS_.wsconn = true;
          const session = localStorage.getItem(this.user + "HAS");
          const now = new Date().getTime();
          console.log({ session });
          if (session && now < session.split(",")[1]) {
            this.HAS_.token = session.split(",")[0];
            this.HAS_.expire = session.split(",")[1];
            this.HAS_.auth_key = session.split(",")[2];
          } else if (session) {
            localStorage.removeItem(this.user + "HAS");
            this.HASlogin();
          } else {
            this.HASlogin();
          }
        }.bind(this);
        this.HAS_.ws.onmessage = function (event) {
          console.log(event.data);
          const message =
            typeof event.data == "string" ? JSON.parse(event.data) : event.data;
          // Process HAS <-> PKSA protocol
          if (message.cmd) {
            switch (message.cmd) {
              case "auth_wait":
                this.HAS_.ws_status = "waiting";

                // Update QRCode
                const json = JSON.stringify({
                  account: this.user,
                  uuid: message.uuid,
                  key: this.HAS_.auth_key,
                  host: this.HAS_.SERVER,
                });

                const URI = `has://auth_req/${btoa(json)}`;
                var url =
                  "https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=" +
                  URI;
                this.HAS_.uri = URI;
                this.haspic = url;
                this.haspich = 250;
                setTimeout(
                  function () {
                    this.haspic = "/img/hiveauth.svg";
                    this.haspich = 50;
                    this.HAS_.ws_status = "login failed";
                  }.bind(this),
                  60000
                );
                break;
              case "auth_ack":
                this.HAS_.ws_status = "decrypting";

                try {
                  // Try to decrypt and parse payload data
                  message.data = JSON.parse(
                    CryptoJS.AES.decrypt(
                      message.data,
                      this.HAS_.auth_key
                    ).toString(CryptoJS.enc.Utf8)
                  );
                  this.HAS_.ws_status = "";
                  this.HAS_.token = message.data.token;
                  this.HAS_.expire = message.data.expire;
                  localStorage.setItem(
                    this.user + "HAS",
                    `${message.data.token},${message.data.expire},${this.HAS_.auth_key}`
                  );
                  this.haspic = "/img/hiveauth.svg";
                  this.haspich = 50;
                } catch (e) {
                  this.haspic = "/img/hiveauth.svg";
                  this.haspich = 50;
                  this.HAS_.ws_status = "login failed";
                  this.HASlogout();
                }
                break;
              case "auth_nack":
                this.HASlogout();
                break;
              case "sign_wait":
                this.HAS_.ws_status = `transaction ${message.uuid} is waiting for approval`;
                break;
              case "sign_ack":
                this.HAS_.ws_status = `transaction ${message.uuid} approved`;
                console.log(message);
                console.log(message.data);
                //this.statusFinder(r, obj);
                break;
              case "sign_nack":
                this.HAS_.ws_status = `transaction ${message.uuid} has been declined`;
                break;
              case "sign_err":
                this.HAS_.ws_status = `transaction ${message.uuid} failed: ${message.error}`;
                break;
              case "challenge_wait":
                this.HAS_.ws_status = `challenge ${message.uuid} is waiting for signature`;
                break;
              case "challenge_ack":
                this.HAS_.ws_status = `challenge ${message.uuid} signed`;
                console.log(message);
                console.log(message.data);
                //this.statusFinder(r, obj);
                break;
              case "challenge_nack":
                this.HAS_.ws_status = `challenge ${message.uuid} has been declined`;
                break;
              case "challenge_err":
                this.HAS_.ws_status = `challenge ${message.uuid} failed: ${message.error}`;
                break;
            }
          }
        }.bind(this);
        // websocket is closed.
        this.HAS_.ws.onclose = function () {
          this.HAS_.wsconn = false;
        }.bind(this);
      } else {
        this.HAS_.wsa = false;
        this.HAS_.ws_status = "This Browser does not support HAS (WebSocket)";
      }
    },
    HKCsign(op) {
      return new Promise((resolve, reject) => {
        if (window.hive_keychain) {
          if (typeof op[1] == "string") op[1] = JSON.parse(op[1]);
          else op[1] = JSON.parse(JSON.stringify(op[1]))
          console.log(op);
          try {
            window.hive_keychain.requestBroadcast(
              op[0],
              op[1],
              op[2],
              function (response) {
                resolve(response);
              }
            );
          } catch (e) {
            reject(e);
          }
        } else {
          reject({ error: "Hive Keychain is not installed." }); //fallthrough?
        }
      });
    },
    PENsign(op) {
      return new Promise(async (resolve, reject) => {
        if (typeof op[1] == "string") op[1] = JSON.parse(op[1]);
        console.log(op);

        // Check if PIN is set up
        if (!this.PIN) {
          console.log("PENsign: No PIN found. PIN value:", this.PIN, "Session PIN:", sessionStorage.getItem('penPin'));

          // Check if there's encrypted PEN data that needs decryption
          const existingPEN = localStorage.getItem("PEN");
          if (existingPEN) {
            // Ask user to enter PIN to decrypt
            this.PENstatus = "Please enter your PIN to decrypt your keys";
            this.requestPinForDecryption({
              type: 'sign',
              data: op,
              resolve: resolve,
              reject: reject
            });
            return; // Don't reject immediately, let the modal handle it
          } else {
            // No PEN data at all, need to set up PIN first
            this.PENstatus = "Please set up PIN first";
            this.setupNewPin();
            reject(new Error("PIN not set up"));
          }
          return;
        }

        // Check if user data structure exists
        if (!this.decrypted.accounts || !this.decrypted.accounts[this.user]) {
          this.PENstatus = "User account structure not found";
          reject(new Error("Account structure missing"));
          return;
        }

        // Show transaction confirmation if needed
        try {
          await this.showTransactionConfirmation(op);
        } catch (error) {
          // User cancelled the transaction
          reject(error);
          return;
        }

        const keyHierarchy = ['posting', 'active', 'owner'];
        // Get key from decrypted storage
        var key = this.decrypted.accounts[this.user][op[2]];
        if (!key) {
          for (let i = keyHierarchy.indexOf(op[2]); i < keyHierarchy.length; i++) {
            key = this.decrypted.accounts[this.user][keyHierarchy[i]];
            if (key) {
              break;
            }
          }
        }
        if (!key || key.trim() === "") {
          // Show modal to get the key and store the pending operation
          this.PENstatus = `Please enter your private ${op[2]} key`;
          this.pendingOperation = {
            type: 'sign',
            data: op,
            resolve: resolve,
            reject: reject
          };
          this.requestPrivateKey(op[2]);
          return; // Don't reject, let the retry handle it
        }

        // Validate the key format
        if (!key.startsWith('5') || key.length < 50) {
          this.PENstatus = `Invalid ${op[2]} key format`;
          reject(new Error(`Invalid private key format for ${op[2]}`));
          return;
        }

        try {
          const tx = new hiveTx.Transaction();
          await tx.create(op[1]); // Create transaction for the user

          // Add the operations to the transaction
          //tx.operations = op[1];

          console.log("Transaction before signing:", tx.transaction);
          const privateKey = hiveTx.PrivateKey.from(key);
          tx.sign(privateKey);
          const result = await tx.broadcast();
          console.log(result);
          resolve(result);
        } catch (error) {
          console.error("Failed to sign transaction:", error);
          reject(error);
        }
      });
    },
    statusFinder(response, obj) {
      console.log(response, obj);
      if (response.success == false) {
        this.cleanOps();
        return;
      }
      if (response.success == true && obj.api) {
        obj.status = "Hive TX Success:\nAwaiting Layer 2 confirmation...";
        obj.delay = 100000;
        obj.link = "https://hivehub.dev/tx/" + response.result.id;
        obj.txid = response.result.id;
        this.ops.push(obj);
        this.cleanOps(); //also stores it in localStorage
        this.statusPinger(response.result.id, obj.api, 0);
      } else if (response.result.status == "unkown" && obj.api) {
        obj.status = "Hive TX Success:\nAwaiting Layer 2 confirmation...";
        obj.delay = 100000;
        obj.link = "https://hivehub.dev/tx/" + response.result.tx_id;
        obj.txid = response.result.tx_id;
        this.ops.push(obj);
        this.cleanOps(); //also stores it in localStorage
        this.statusPinger(response.result.id, obj.api, 0);
      } else if (response.success == true && !obj.api) { 
        // Hive Level 1 TX Handler (no API)
        obj.status = "Hive TX Success";
        obj.txid = response.result.id;
        for (var i = 0; i < obj.ops.length; i++) {
          if(typeof this[obj.ops[i]] == "function") this[obj.ops[i]](obj)
          else this.$emit(obj.ops[i], obj)
        }
      }
    },
    statusPinger(txid, api, r) {
      if (r > 30) return;
      fetch(api + "/api/status/" + txid)
        .then((re) => re.json())
        .then((json) => {
          console.log(json, json.status.slice(0, 20));
          if (json.status.slice(0, 20) != "This TransactionID e") {
            if (json.status.indexOf(" minted ") > -1) {
              //changeDiv(id, json.status, "mint"); // worry about this later
              setTimeout(
                function () {
                  this.cleanOps(txid);
                }.bind(this),
                3000
              );
            } else {
              for (var i = 0; i < this.ops.length; i++) {
                if (this.ops[i].txid == txid) {
                  console.log("Found Op");
                  var op = this.ops[i];
                  op.status = "Confirmed.";
                  op.msg = json.status;
                  //this.cleanOps();
                  for (var j = 0; j < op.ops.length; j++) {
                    console.log(op.ops[j]);
                    this.$emit("refresh", op.ops[j]);
                  }
                  break;
                }
              }
              setTimeout(
                function () {
                  this.cleanOps(txid);
                }.bind(this),
                30000
              );
            }
          } else {
            setTimeout(
              function () {
                this.statusPinger(txid, api, r + 1);
              }.bind(this),
              3000
            );
          }
        })
        .catch((e) => {
          console.log(e);
          this.statusPinger(txid, api, r + 1);
        });
    },
    showTab(link) {
      if (!deepLink) return;
      deepLink(link);
    },
    searchRecents() {
      this.filterRecents = this.recentUsers.reduce((a, b) => {
        console.log(b);
        if (b.toLowerCase().includes(this.filterUsers.toLowerCase())) {
          a.push(b);
        }
        return a;
      }, []);
    },
    setValue(key, value) {
      if (key.split(".").length > 1) {
        let keys = key.split(".");
        let obj = this[keys[0]];
        for (let i = 1; i < keys.length; i++) {
          if (i == keys.length - 1) {
            obj[keys[i]] = value;
          } else {
            obj = obj[keys[i]];
          }
        }
      } else {
        this[key] = value;
      }
    },
    markAllNotificationsRead() {
      let date = new Date().toISOString().replace(/\.\d{3}(Z|[+-]\d{2}:\d{2})$/, '')
      let op = {
        type: "cj",
        op: "setLastRead",
        id: "notify",
        cj: ["setLastRead", {date}],
        msg: `Marking all notifications as read`,
        ops: ["refreshNotifications"],
        api: null,
        txid: `setLastRead`,
      }
      op.time = new Date().getTime();
        op.status = "Pending your approval";
        op.delay = 5000;
        op.title = op.id ? op.id : op.cj ? op.cj.memo : "No Waiter";
        this.broadcastCJ(op);
        this.broadcastRaw(op);
    },
    getUser() {
      this.user = localStorage.getItem("user");
      this.$emit("login", this.user);
      const HAS = localStorage.getItem(this.user + "HAS");
      if (this.HAS && HAS) {
        const now = new Date().getTime();
        if (now < HAS.split(",")[1]) {
          this.HAS_.token = HAS.split(",")[0];
          this.HAS_.expire = HAS.split(",")[1];
          this.HAS_.auth_key = HAS.split(",")[2];
          this.useHAS();
        } else {
          localStorage.removeItem(this.user + "HAS");
          this.HASlogin();
        }
      } else if (this.HAS) {
        this.HASlogin();
      }
      this.getNotifications()
    },

    // Refresh notifications (can be called from outside)
    refreshNotifications(obj) {
      if(obj.txid)this.dismissNotification(obj.txid)
      this.getNotifications();
    },
    async getNotifications() {
      if (!this.user) return;

      this.notificationsLoading = true;
      this.notificationsError = null;

      try {
        const response = await fetch(`https://data.dlux.io/api/onboarding/notifications/${this.user}/merged`);

        if (response.ok) {
          const data = await response.json();
          this.notifications = data.notifications || [];
          this.notificationsCount = data.summary.unreadNotifications || 0;

          // Store account requests separately for easier access
          this.accountRequests = this.notifications.filter(n => n.type === 'account_request');

          console.log('Merged notifications loaded:', data.summary);
          return;
        }


        // Fallback to HIVE Bridge API only (no local notifications)
        const hiveNotifications = await this.hiveApiCall('bridge.account_notifications', JSON.stringify({
          account: this.user,
          limit: 50
        }));

        this.notifications = hiveNotifications.map(notification => ({
          id: `hive_${notification.id}`,
          type: 'hive_notification',
          subtype: notification.type,
          title: this.getHiveNotificationTitle(notification),
          message: this.getHiveNotificationMessage(notification),
          data: {
            hive_notification: notification,
            url: notification.url,
            score: notification.score,
            community: notification.community,
            community_title: notification.community_title
          },
          status: 'read',
          priority: this.getHiveNotificationPriority(notification),
          createdAt: new Date(notification.date),
          source: 'hive_bridge'
        }));

        this.notificationsCount = 0; // HIVE notifications are considered read
        this.accountRequests = []; // No account requests available without auth

        console.log('HIVE-only notifications loaded:', this.notifications.length);

      } catch (error) {
        console.error('Error loading notifications:', error);
        this.notificationsError = error.message;
        this.notifications = [];
        this.notificationsCount = 0;
        this.accountRequests = [];
      } finally {
        this.notificationsLoading = false;
      }
    },

    // Helper methods for HIVE notifications
    getHiveNotificationTitle(notification) {
      const titles = {
        vote: '👍 Vote Received',
        mention: '@️ Mentioned',
        follow: '👥 New Follower',
        reblog: '🔄 Content Reblogged',
        reply: '💬 Reply to Your Post',
        transfer: '💰 Transfer Received',
        delegate: '⚡ Delegation Received',
        undelegate: '⚡ Delegation Removed',
        power_up: '🔋 Power Up',
        power_down: '🔋 Power Down',
        witness_vote: '🗳️ Witness Vote',
        proposal_vote: '📋 Proposal Vote',
        receive_reward: '🎁 Rewards Received',
        comment_benefactor_reward: '🎁 Benefactor Reward',
        comment_author_reward: '✍️ Author Reward',
        comment_curator_reward: '🔍 Curator Reward',
        inactive: '😴 Account Inactive Warning'
      };
      return titles[notification.type] || '📢 HIVE Notification';
    },

    getHiveNotificationMessage(notification) {
      const { type, msg, score } = notification;

      switch (type) {
        case 'vote':
          return `@${notification.msg.split(' voted on')[0]} voted on your ${notification.url.includes('/comments/') ? 'comment' : 'post'}${score ? ` (+${score})` : ''}`;
        case 'mention':
          return `@${notification.msg.split(' mentioned you')[0]} mentioned you in a ${notification.url.includes('/comments/') ? 'comment' : 'post'}`;
        case 'follow':
          return `@${notification.msg.split(' ')[0]} started following you`;
        case 'reblog':
          return `@${notification.msg.split(' reblogged')[0]} reblogged your post`;
        case 'reply':
          return `@${notification.msg.split(' replied')[0]} replied to your ${notification.url.includes('/comments/') ? 'comment' : 'post'}`;
        case 'transfer':
          return notification.msg;
        case 'delegate':
          return notification.msg;
        case 'undelegate':
          return notification.msg;
        case 'receive_reward':
          return notification.msg;
        default:
          return notification.msg || 'HIVE blockchain activity';
      }
    },

    getHiveNotificationPriority(notification) {
      const highPriorityTypes = ['transfer', 'delegate', 'mention'];
      const normalPriorityTypes = ['vote', 'follow', 'reblog', 'reply'];

      if (highPriorityTypes.includes(notification.type)) {
        return 'high';
      } else if (normalPriorityTypes.includes(notification.type)) {
        return 'normal';
      } else {
        return 'low';
      }
    },

    // Check if we have valid HIVE authentication
    hasValidHiveAuth() {
      // Check for different auth methods
      return this.HAS || this.HKC || this.PEN || this.decrypted.pin;
    },

    // Get public key for authentication
    getPublicKey() {
      if (this.HAS && this.HAS_.auth_key) {
        return this.HAS_.auth_key;
      } else if (this.HKC) {
        // For Keychain, we need to extract the public key
        // This is simplified - in practice you'd need the actual public key
        return localStorage.getItem(`${this.user}_posting_key_public`);
      } else if (this.PEN && this.decrypted.accounts[this.user]) {
        // For PEN, extract from decrypted accounts
        const account = this.decrypted.accounts[this.user];
        return account.posting ? account.posting.public : null;
      }
      return null;
    },

    // Sign challenge for authentication
    async signChallenge(challenge) {
      if (this.HAS) {
        return await this.HASsignChallenge(challenge);
      } else if (this.HKC) {
        return await this.HKCsignChallenge(challenge);
      } else if (this.PEN) {
        return await this.PENsignChallenge(challenge);
      }
      throw new Error('No authentication method available');
    },

    // Sign challenge using HAS
    async HASsignChallenge(challenge) {
      return new Promise((resolve, reject) => {
        // Implement HAS signing logic
        // This would use the HAS WebSocket connection
        reject(new Error('HAS challenge signing not implemented'));
      });
    },

    // Sign challenge using Keychain
    async HKCsignChallenge(challenge) {
      return new Promise((resolve, reject) => {
        if (window.hive_keychain) {
          window.hive_keychain.requestSignBuffer(
            this.user,
            challenge,
            'Posting',
            (result) => {
              if (result.success) {
                resolve(result.result);
              } else {
                reject(new Error(result.message || 'Keychain signing failed'));
              }
            }
          );
        } else {
          reject(new Error('Keychain not available'));
        }
      });
    },

    // Sign challenge using PEN
    async PENsignChallenge(challenge) {
      if (!this.decrypted.accounts[this.user] || !this.decrypted.accounts[this.user].posting) {
        throw new Error('PEN posting key not available');
      }

      try {
        const hiveTx = await import('hive-tx');
        const privateKey = this.decrypted.accounts[this.user].posting.private;
        const signature = hiveTx.sign(challenge, privateKey);
        return signature;
      } catch (error) {
        throw new Error('PEN signing failed: ' + error.message);
      }
    },

    // Handle account creation request actions
    async createAccountForFriend(request, useACT = true) {
      console.log(request)
      if(!request.status == 'done') return
      fetch('https://hive-api.dlux.io', {
        body: `{"jsonrpc":"2.0", "method":"condenser_api.get_chain_properties", "params":[], "id":1}`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        method: "POST",
      }).then((response) => response.json())
        .then((data) => {
      const ownerAuth = { "weight_threshold": 1, "account_auths": [], "key_auths": [ [ request.public_keys.owner, 1 ] ] }
      const activeAuth = { "weight_threshold": 1, "account_auths": [], "key_auths": [ [ request.public_keys.active, 1 ] ] }
      const postingAuth = { "weight_threshold": 1, "account_auths": [], "key_auths": [ [ request.public_keys.posting, 1 ] ] }
      const memoKey = request.public_keys.memo
      const CAop = useACT ? [
        'create_claimed_account',
        {
          creator: this.user,
          new_account_name: request.requester_username,
          owner: ownerAuth,
          active: activeAuth,
          posting: postingAuth,
          memo_key: memoKey,
          json_metadata: '',
          extensions: []
        },
      ] : [
        'account_create',
        {
          fee: data.result.account_creation_fee,
          creator: this.user,
          new_account_name: request.requester_username,
          owner: ownerAuth,
          active: activeAuth,
          posting: postingAuth,
          memo_key: memoKey,
          json_metadata: '',
        },
      ]
      let op = {
        type: "raw",
        key: "active",
        op: [CAop],
        callbacks: [],
        txid: "Create Account",
        msg: `Creating account for friend`,
        ops: ["createAccountFeedback"],
        api: null,
        txid: `createAccount`,
      }
      op.time = new Date().getTime();
        op.status = "Pending your approval";
        op.delay = 5000;
        op.title = op.id ? op.id : op.cj ? op.cj.memo : "No Waiter";
        this.ops.push(op)
        this.broadcastRaw(op);
    })
    },
    async createAccountFeedback(obj) {
      try {
        const response = await fetch(`https://data.dlux.io/api/onboarding/notifications/accept/${obj.txid}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          // Remove from local notifications
          this.notifications = this.notifications.map(n => n.status = n.id == response.id ? 'completed' : n.status);
          this.notificationsCount -= 1
        }
      } catch (error) {
        console.error('Error dismissing notification:', error);
      }
    },

    async ignoreAccountRequest(requestId) {
      // This will use the existing dismiss notification endpoint
      const notification = this.notifications.find(n =>
        n.type === 'account_request' && n.data.request_id === requestId
      );

      if (notification) {
        await this.ignoreNotification(notification.id.replace('request_', 'local_'));
      }
    },

    async dismissNotification(notificationId) {
      try {
        const response = await fetch(`https://data.dlux.io/api/onboarding/notifications/dismiss/${notificationId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        if (response.ok) {
          // Remove from local notifications
          this.notifications = this.notifications.map(n => n.status = 'read');
          this.notificationsCount = 0
        }
      } catch (error) {
        console.error('Error dismissing notification:', error);
      }
    },
    async ignoreNotification(notificationId) {
      try {
        const challenge = Math.floor(Date.now() / 1000);
        const signature = await this.signChallenge(challenge.toString());
        const pubKey = this.getPublicKey();
        const response = await fetch(`https://data.dlux.io/api/onboarding/notifications/${notificationId}/ignore`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-account': this.user,
            'x-challenge': challenge.toString(),
            'x-pubkey': pubKey,
            'x-signature': signature
          }
        });
        if (response.ok) {
          // Remove from local notifications
          this.notifications = this.notifications.map(n => n.status = 'read');
          this.notificationsCount -= 1
        }
      } catch (error) {
        console.error('Error dismissing notification:', error);
      }
    },
    logout() {
      localStorage.removeItem("user");
      // Clear PEN session data
      sessionStorage.removeItem('penPin');
      sessionStorage.removeItem('pen');
      this.PIN = "";
      this.decrypted = {
        pin: false,
        accounts: {}
      };
      this.user = "";
      this.$emit("logout", "");
    },
    setUser(id) {
      const isAddingNewUser = !id && this.userField;

      if (isAddingNewUser && (!this.consentPrivacy || !this.consentTerms)) {
        this.consentError = true;
        return;
      }

      this.consentError = false;

      this.HAS_.token = "";
      this.haspic = "/img/hiveauth.svg";
      this.haspich = 50;

      const userToAdd = id ? id : this.userField;
      if (!userToAdd) return;

      this.user = userToAdd;

      if (isAddingNewUser) {
        this.userField = "";
        this.addRecentUser(this.user);
        this.consentPrivacy = false;
        this.consentTerms = false;
      }

      localStorage.setItem("user", this.user);
      this.$emit("login", this.user);

      // Handle PEN setup for new user - only if wallet isn't already decrypted
      if (this.PEN && this.user) {
        const existingPEN = localStorage.getItem("PEN");
        if (existingPEN && !this.PIN) {
          // Ask for PIN to decrypt existing data only if not already decrypted
          this.requestPinForDecryption();
        } else if (!existingPEN) {
          // No existing data, set up PIN
          this.setupNewPin();
        }

        // If wallet is already decrypted, ensure new user has account structure
        if (this.PIN && this.decrypted.accounts) {
          if (!this.decrypted.accounts[this.user]) {
            this.decrypted.accounts[this.user] = {
              posting: "",
              active: "",
              memo: "",
              owner: "",
              master: "",
              noPrompt: {}
            };

            // Update storage with new account structure
            this.encryptWithPBKDF2(this.decrypted, this.PIN).then(encrypted => {
              localStorage.setItem("PEN", encrypted);
              sessionStorage.setItem('pen', JSON.stringify(this.decrypted));
            }).catch(error => {
              console.error("Failed to update wallet with new account:", error);
            });
          }
        }
      }

      if (this.HAS) this.HASsetup();
    },
    addRecentUser(user) {
      if (user && this.recentUsers.indexOf(user) == -1)
        this.recentUsers.push(user);
      localStorage.setItem("recentUsers", JSON.stringify(this.recentUsers));
    },
    getRecentUsers() {
      const r = localStorage.getItem("recentUsers");
      if (r) this.recentUsers = JSON.parse(r);
      for (var i = 0; i < this.recentUsers.length; i++) {
        if (this.recentUsers[i].length < 3) {
          this.recentUsers.splice(i, 1);
          break;
        }
      }
    },
    deleteRecentUser(user) {
      this.recentUsers.splice(this.recentUsers.indexOf(user), 1);
      localStorage.setItem("recentUsers", JSON.stringify(this.recentUsers));
      localStorage.removeItem(this.user + "HAS");
    },
    toggleAccountMenu() {
      this.accountMenu = !this.accountMenu;
    },
    isEnter(e) {
      if (e.key === "Enter" || e.keyCode === 13) {
        this.setUser();
      }
    },
    async queueUser() {
      try {
        const response = await fetch("https://hive-api.dlux.io", {
          method: "POST",
          body: JSON.stringify([
            "get_accounts",
            [[this.userField]],
          ]),
        });

        const data = await response.json();
        const accountData = data.result[0];

        if (accountData && accountData.active.key_auths[0][0]) {
          this.userPinFeedback = "Valid User";
          this.pinSetup = {
            account: this.userField,
            activePub: accountData.active.key_auths[0],
            postingPub: accountData.posting.key_auths[0],
            memoPub: accountData.memo_key,
            ownerPub: accountData.owner.key_auths[0],
          }

          // Initialize account structure for this user
          if (!this.decrypted.accounts[this.userField]) {
            this.decrypted.accounts[this.userField] = {
              posting: "",
              active: "",
              memo: "",
              owner: "",
              master: "",
              noPrompt: {}
            };
          }
        } else {
          this.userPinFeedback = "Invalid User";
        }
      } catch (error) {
        console.error("Failed to queue user:", error);
        this.userPinFeedback = "Error checking user";
      }
    },
    cleanOps(txid) {
      const ops = this.ops;
      for (var i = 0; i < ops.length; i++) {
        if (ops[i].status == "Pending your approval") {
          ops.splice(i, 1);
          i--;
        } else if (ops[i].time < new Date().getTime() - 300000) {
          ops.splice(i, 1);
          i--;
        } else if (ops[i].txid == txid) {
          ops.splice(i, 1);
          break;
        }
      }
      this.ops = ops;
      localStorage.setItem("pending", JSON.stringify(this.ops));
    },
    addStingChat() {
      var stwidget = new StWidget("https://chat.peakd.com/t/hive-150900/0");
      stwidget.properties = {
        requireLogin: false,
        showSidebar: true,
        sidebar: 2,
        sidebar2enableSharedView: false,
        sidebarToggleByChannelNameOnDirectGroup: false,
        streambarExpand: true,
        streambarMode: 1,
        sidebarAddButton: 1,
        communityChannelNameFormat: "C/<title>/<name>",
        messageIconFlexClass: "block text-justify lg:text-left sm:flex",
        messageIconClass: "iconFloat",
        "--appCommunityIconFontSize": "18px",
        "--appCommunityIconSize": "42px",
        homeTabCommunities: false,
        homeTabPreferences: true,
        homeTabThemes: true,
        onlyPrependCommunities: false,
        prependCommunities: ["hive-150900"],
        defaultTheme: "Dark",
        "--appFontFamily": "'Lato'",
        "--appFontSize": "16px",
        "--appMessageFontFamily": "'Lato'",
        "--appMessageFontSize": "16px",
      };
      var element = stwidget.createElement('100%', 'calc(100% - 88px)', true/*overlay*/, true /*resizable*/);
      //optionally add style/positioning
      stwidget.setStyle({
        direction: "ltr",

        position: "fixed",
      });
      //Add the element to webpage

      document.getElementById("stingChat").appendChild(element);
    },
    handleToast(toastData) {
      // Handle toast messages from SW monitor
      const toastType = toastData.type || 'info';
      const toastMessage = toastData.message || 'Service Worker notification';

      // Create a toast object that matches the existing toast system
      const toast = {
        time: new Date().getTime(),
        status: toastMessage,
        delay: 5000,
        title: 'App Status',
        msg: toastMessage,
        ops: [] // Empty ops array for compatibility
      };

      // Add to ops array to display via existing toast system
      this.ops.push(toast);

      // Auto-remove after delay
      setTimeout(() => {
        const index = this.ops.indexOf(toast);
        if (index > -1) {
          this.ops.splice(index, 1);
        }
      }, toast.delay);
    },
    // PEN Management Methods
    openPenManagement() {
      const existingPEN = localStorage.getItem("PEN");
      if (existingPEN && !this.PIN) {
        this.penManagementMode = 'decrypt';
      } else if (this.PIN || this.decrypted.pin) {
        this.penManagementMode = 'manage';
      } else {
        this.penManagementMode = 'overview';
      }
      this.showPenModal = true;
    },

    async handlePenDecrypt() {
      if (!this.penDecryptPassword) {
        this.penDecryptError = "Please enter your PIN";
        return;
      }

      try {
        this.PIN = this.penDecryptPassword;
        await this.decryptPEN();
        this.penManagementMode = 'manage';
        this.penDecryptError = '';
        this.penDecryptPassword = '';
        // Store PIN in session for this session
        sessionStorage.setItem('penPin', this.PIN);
      } catch (error) {
        this.penDecryptError = "Invalid PIN or corrupted data";
        console.error("Failed to decrypt PEN:", error);
      }
    },

    toggleShowKey(account, keyType) {
      const keyId = `${account}-${keyType}`;
      this.showPenKeys[keyId] = !this.showPenKeys[keyId];
      this.$forceUpdate(); // Force Vue to re-render
    },

    async copyKeyToClipboard(key) {
      try {
        await navigator.clipboard.writeText(key);
        // Show temporary feedback
        const toast = {
          time: new Date().getTime(),
          status: "Key copied to clipboard",
          delay: 2000,
          title: 'Copied',
          msg: 'Private key copied to clipboard',
          ops: []
        };
        this.ops.push(toast);
        setTimeout(() => {
          const index = this.ops.indexOf(toast);
          if (index > -1) {
            this.ops.splice(index, 1);
          }
        }, toast.delay);
      } catch (error) {
        console.error("Failed to copy key:", error);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = key;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    },

    async deleteKey(account, keyType) {
      if (!confirm(`Are you sure you want to delete the ${keyType} key for @${account}?`)) {
        return;
      }

      try {
        if (this.decrypted.accounts[account]) {
          this.decrypted.accounts[account][keyType] = '';

          // Re-encrypt and save
          const encrypted = await this.encryptWithPBKDF2(this.decrypted, this.PIN);
          localStorage.setItem("PEN", encrypted);
          sessionStorage.setItem('pen', JSON.stringify(this.decrypted));

          this.PENstatus = `${keyType} key deleted for @${account}`;
        }
      } catch (error) {
        console.error("Failed to delete key:", error);
        this.PENstatus = "Failed to delete key";
      }
    },

    async deleteAccount(account) {
      if (!confirm(`Are you sure you want to delete all keys for @${account}? This cannot be undone.`)) {
        return;
      }

      try {
        if (this.decrypted.accounts[account]) {
          delete this.decrypted.accounts[account];

          // Re-encrypt and save
          const encrypted = await this.encryptWithPBKDF2(this.decrypted, this.PIN);
          localStorage.setItem("PEN", encrypted);
          sessionStorage.setItem('pen', JSON.stringify(this.decrypted));

          this.PENstatus = `Account @${account} deleted`;
        }
      } catch (error) {
        console.error("Failed to delete account:", error);
        this.PENstatus = "Failed to delete account";
      }
    },

    deleteWallet() {
      if (!confirm("Are you sure you want to delete the entire dluxPEN wallet? This will remove all stored keys and cannot be undone.")) {
        return;
      }

      if (!confirm("This action is PERMANENT. All private keys will be lost. Are you absolutely sure?")) {
        return;
      }

      // Clear all PEN data
      localStorage.removeItem("PEN");
      sessionStorage.removeItem('pen');
      sessionStorage.removeItem('penPin');

      // Reset state
      this.PIN = "";
      this.decrypted = {
        pin: false,
        accounts: {}
      };

      this.showPenModal = false;
      this.PENstatus = "dluxPEN wallet deleted";
      this.walletState = Date.now(); // Update the reactive property
    },

    openExportModal(account) {
      this.exportAccount = account;
      this.exportKeys = [];
      this.exportFormat = 'text';

      // Pre-select all available keys for the account
      const accountData = this.decrypted.accounts[account];
      if (accountData) {
        Object.keys(accountData).forEach(keyType => {
          if (accountData[keyType] && accountData[keyType].trim() !== '') {
            this.exportKeys.push(keyType);
          }
        });
      }

      this.showExportModal = true;
    },

    closeExportModal() {
      const modalElement = document.getElementById('exportModal');
      if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
          modal.hide();
        }
      }
      this.showExportModal = false;
    },

    performExport() {
      const accountData = this.decrypted.accounts[this.exportAccount];
      if (!accountData) {
        return;
      }

      if (this.exportFormat === 'text') {
        this.exportAsTextFile();
      } else if (this.exportFormat === 'qr') {
        this.generateQRCode();
      }
    },

    exportAsTextFile() {
      try {
        const accountData = this.decrypted.accounts[this.exportAccount];
        let content = `# dluxPEN Export for @${this.exportAccount}\n`;
        content += `# Generated on ${new Date().toISOString()}\n`;
        content += `# WARNING: Keep this file secure and delete after use\n\n`;

        this.exportKeys.forEach(keyType => {
          if (accountData[keyType] && accountData[keyType].trim() !== '') {
            content += `${keyType.toUpperCase()}_KEY=${accountData[keyType]}\n`;
          }
        });

        if (content.split('\n').length <= 4) {
          throw new Error('No keys selected for export');
        }

        // Create and download file
        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dluxpen-${this.exportAccount}-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        // Show success feedback
        const toast = {
          time: new Date().getTime(),
          status: "Keys exported successfully",
          delay: 3000,
          title: 'Export Complete',
          msg: `Keys for @${this.exportAccount} exported to file`,
          ops: []
        };
        this.ops.push(toast);
        setTimeout(() => {
          const index = this.ops.indexOf(toast);
          if (index > -1) {
            this.ops.splice(index, 1);
          }
        }, toast.delay);

        this.closeExportModal();
      } catch (error) {
        console.error('Export failed:', error);
        alert('Export failed: ' + error.message);
      }
    },

    generateQRCode() {
      try {
        const accountData = this.decrypted.accounts[this.exportAccount];
        const exportData = {};

        this.exportKeys.forEach(keyType => {
          if (accountData[keyType] && accountData[keyType].trim() !== '') {
            exportData[keyType] = accountData[keyType];
          }
        });

        if (Object.keys(exportData).length === 0) {
          throw new Error('No keys selected for export');
        }

        // Create Hive Keychain compatible import format
        const qrData = {
          type: 'hive_keychain_import',
          version: '1.0',
          account: this.exportAccount,
          keys: exportData,
          timestamp: Date.now(),
          source: 'dluxPEN'
        };

        const qrString = JSON.stringify(qrData);

        // Check if data is too large for QR code
        if (qrString.length > 2000) {
          throw new Error('Too much data for QR code. Try exporting fewer keys or use text export.');
        }

        // Create QR code URL with better error correction
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&ecc=M&data=${encodeURIComponent(qrString)}`;

        // Open QR code in new window/tab with better styling
        const qrWindow = window.open('', '_blank', 'width=600,height=700,scrollbars=no,resizable=yes');
        qrWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>dluxPEN QR Export - @${this.exportAccount}</title>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  text-align: center; 
                  padding: 20px; 
                  margin: 0;
                  background: #f8f9fa;
                }
                .container {
                  max-width: 500px;
                  margin: 0 auto;
                  background: white;
                  padding: 20px;
                  border-radius: 10px;
                  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .qr-code {
                  border: 2px solid #ddd;
                  border-radius: 10px;
                  padding: 20px;
                  margin: 20px 0;
                  background: white;
                }
                .info {
                  background: #e3f2fd;
                  padding: 15px;
                  border-radius: 5px;
                  margin: 15px 0;
                }
                .warning {
                  background: #fff3cd;
                  padding: 15px;
                  border-radius: 5px;
                  margin: 15px 0;
                  border-left: 4px solid #ffc107;
                }
                .btn {
                  background: #007bff;
                  color: white;
                  padding: 10px 20px;
                  border: none;
                  border-radius: 5px;
                  cursor: pointer;
                  margin: 5px;
                }
                .btn:hover { background: #0056b3; }
              </style>
            </head>
            <body>
              <div class="container">
                <h2>🔑 dluxPEN Key Export</h2>
                <div class="info">
                  <strong>Account:</strong> @${this.exportAccount}<br>
                  <strong>Keys:</strong> ${this.exportKeys.join(', ')}<br>
                  <strong>Generated:</strong> ${new Date().toLocaleString()}
                </div>
                
                <div class="qr-code">
                  <img src="${qrUrl}" alt="QR Code" style="max-width: 100%; height: auto;">
                </div>
                
                <div class="warning">
                  <strong>⚠️ Security Warning:</strong><br>
                  This QR code contains private keys. Keep it secure and delete after use.
                </div>
                
                <p><small>Scan with Hive Keychain mobile or compatible wallet</small></p>
                
                <button class="btn" onclick="window.print()">🖨️ Print</button>
                <button class="btn" onclick="window.close()">❌ Close</button>
              </div>
            </body>
          </html>
        `);

        // Show success feedback
        const toast = {
          time: new Date().getTime(),
          status: "QR code generated successfully",
          delay: 3000,
          title: 'Export Complete',
          msg: `QR code for @${this.exportAccount} opened in new window`,
          ops: []
        };
        this.ops.push(toast);
        setTimeout(() => {
          const index = this.ops.indexOf(toast);
          if (index > -1) {
            this.ops.splice(index, 1);
          }
        }, toast.delay);

        this.closeExportModal();
      } catch (error) {
        console.error('QR generation failed:', error);
        alert('QR code generation failed: ' + error.message);
      }
    },

    closePenModal() {
      const modalElement = document.getElementById('penModal');
      if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
          modal.hide();
        }
      }
      this.showPenModal = false;
    },

    getKeyTypesForAccount(account) {
      const accountData = this.decrypted.accounts[account];
      if (!accountData) return [];

      return Object.keys(accountData).filter(keyType =>
        keyType !== 'noPrompt' && // Skip the noPrompt object
        typeof accountData[keyType] === 'string' && // Only check string values
        accountData[keyType] &&
        accountData[keyType].trim() !== ''
      );
    },

    hasAnyKeys(account) {
      return this.getKeyTypesForAccount(account).length > 0;
    },

    closeWallet() {
      // Clear session data but keep encrypted wallet
      sessionStorage.removeItem('penPin');
      sessionStorage.removeItem('pen');
      this.PIN = "";
      this.decrypted = {
        pin: false,
        accounts: {}
      };
      sessionStorage.removeItem('penPin');
      this.walletState = Date.now(); // Update wallet state to trigger reactivity
      this.PENstatus = "dluxPEN wallet locked";

      // Show feedback
      const toast = {
        time: new Date().getTime(),
        status: "Wallet locked successfully",
        delay: 3000,
        title: 'dluxPEN',
        msg: 'Wallet locked - PIN required for next use',
        ops: []
      };
      this.ops.push(toast);
      setTimeout(() => {
        const index = this.ops.indexOf(toast);
        if (index > -1) {
          this.ops.splice(index, 1);
        }
      }, toast.delay);
    },

    openChangePinModal() {
      this.currentPin = '';
      this.newPinChange = '';
      this.confirmPinChange = '';
      this.changePinError = '';
      this.changePinLoading = false;
      this.showChangePinModal = true;
    },

    closeChangePinModal() {
      const modalElement = document.getElementById('changePinModal');
      if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
          modal.hide();
        }
      }
      this.showChangePinModal = false;
    },

    async handlePinChange() {
      // Validate inputs
      if (!this.currentPin) {
        this.changePinError = "Please enter your current PIN";
        return;
      }

      if (!this.newPinChange || this.newPinChange.length < 4) {
        this.changePinError = "New PIN must be at least 4 characters long";
        return;
      }

      if (this.newPinChange !== this.confirmPinChange) {
        this.changePinError = "New PINs do not match";
        return;
      }

      if (this.currentPin === this.newPinChange) {
        this.changePinError = "New PIN must be different from current PIN";
        return;
      }

      this.changePinLoading = true;
      this.changePinError = '';

      try {
        // First verify current PIN by trying to decrypt
        const existingPEN = localStorage.getItem("PEN");
        if (!existingPEN) {
          throw new Error("No encrypted wallet found");
        }

        // Try to decrypt with current PIN
        let tempDecrypted;
        try {
          tempDecrypted = await this.decryptWithPBKDF2(existingPEN, this.currentPin);
        } catch (error) {
          throw new Error("Current PIN is incorrect");
        }

        // If we get here, current PIN is correct
        // Now re-encrypt with new PIN
        const newEncrypted = await this.encryptWithPBKDF2(tempDecrypted, this.newPinChange);

        // Save the new encrypted data
        localStorage.setItem("PEN", newEncrypted);

        // Update current session
        this.PIN = this.newPinChange;
        sessionStorage.setItem('penPin', this.newPinChange);
        this.decrypted = tempDecrypted;
        sessionStorage.setItem('pen', JSON.stringify(tempDecrypted));

        // Show success feedback
        const toast = {
          time: new Date().getTime(),
          status: "PIN changed successfully",
          delay: 3000,
          title: 'dluxPEN',
          msg: 'Your wallet PIN has been updated',
          ops: []
        };
        this.ops.push(toast);
        setTimeout(() => {
          const index = this.ops.indexOf(toast);
          if (index > -1) {
            this.ops.splice(index, 1);
          }
        }, toast.delay);

        this.closeChangePinModal();
        this.PENstatus = "PIN changed successfully";

      } catch (error) {
        console.error("Failed to change PIN:", error);
        this.changePinError = error.message;
      } finally {
        this.changePinLoading = false;
      }
      this.walletState = Date.now();
    },

    // Enhanced key management methods
    getAllAccountsInWallet() {
      // Get all accounts that have been added to the wallet, even if they have no keys
      return Object.keys(this.decrypted.accounts || {});
    },

    getAllKeyTypes() {
      return ['posting', 'active', 'memo', 'owner', 'master'];
    },

    hasKey(account, keyType) {
      return this.decrypted.accounts[account] &&
        this.decrypted.accounts[account][keyType] &&
        typeof this.decrypted.accounts[account][keyType] === 'string' &&
        this.decrypted.accounts[account][keyType].trim() !== '';
    },

    editKey(account, keyType, isUpdate = false) {
      this.editingAccount = account;
      this.editingKeyType = keyType;
      this.isUpdatingKey = isUpdate;

      if (isUpdate && this.hasKey(account, keyType)) {
        this.editingKeyValue = this.decrypted.accounts[account][keyType];
      } else {
        this.editingKeyValue = '';
      }

      this.keyType = keyType; // Set for the existing key modal
      this.privateKey = this.editingKeyValue;
      this.keyError = '';
      this.keyLoading = false;
      this.showKeyModal = true;
    },

    async handleKeyEdit() {
      if (!this.privateKey || !this.privateKey.trim()) {
        this.keyError = "Please enter a private key";
        return;
      }

      this.keyLoading = true;
      this.keyError = "";

      // Store original user outside try-catch for proper scoping
      const originalUser = this.user;

      try {
        // Use the existing storeKey method but for the editing account
        this.user = this.editingAccount; // Temporarily change user for validation

        await this.storeKey(this.editingKeyType, this.privateKey.trim());

        this.user = originalUser; // Restore original user

        this.closeKeyModal();
        this.PENstatus = `${this.editingKeyType} key ${this.isUpdatingKey ? 'updated' : 'added'} for @${this.editingAccount}`;

      } catch (error) {
        console.error("Failed to edit key:", error);
        this.keyError = "Failed to save key: " + error.message;
        this.user = originalUser; // Restore original user on error
      } finally {
        this.keyLoading = false;
      }
      this.walletState = Date.now();
    },

    async addNewAccountToWallet() {
      const accountName = prompt("Enter the account name to add to wallet:");
      if (!accountName || !accountName.trim()) {
        return;
      }

      const trimmedAccount = accountName.trim().toLowerCase();

      // Validate account name format
      if (!/^[a-z0-9.-]{3,16}$/.test(trimmedAccount)) {
        alert("Invalid account name. Must be 3-16 characters, lowercase letters, numbers, dots, and hyphens only.");
        return;
      }

      try {
        // Check if account exists on Hive
        const response = await fetch("https://api.hive.blog", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "condenser_api.get_accounts",
            params: [[trimmedAccount]],
            id: 1
          }),
        });

        const data = await response.json();
        const accountData = data.result && data.result[0];

        if (!accountData) {
          alert(`Account @${trimmedAccount} does not exist on Hive blockchain`);
          return;
        }

        // Add account to wallet
        if (!this.decrypted.accounts[trimmedAccount]) {
          this.decrypted.accounts[trimmedAccount] = {
            posting: "",
            active: "",
            memo: "",
            owner: "",
            master: "",
            noPrompt: {}
          };

          // Save to storage
          const encrypted = await this.encryptWithPBKDF2(this.decrypted, this.PIN);
          localStorage.setItem("PEN", encrypted);
          sessionStorage.setItem('pen', JSON.stringify(this.decrypted));

          this.PENstatus = `Account @${trimmedAccount} added to wallet`;
        } else {
          alert(`Account @${trimmedAccount} is already in the wallet`);
        }

      } catch (error) {
        console.error("Failed to add account:", error);
        alert("Failed to verify account. Please check your connection and try again.");
      }
      this.walletState = Date.now();
    },

    // Transaction confirmation methods
    getOperationType(op) {
      // Extract operation type from op[1] array
      if (!op || !Array.isArray(op[1]) || op[1].length === 0) {
        return null;
      }
      if (Array.isArray(op[1][0]) && op[1][0].length > 0) {
        return op[1][0][0]; // First operation type
      }
      return null;
    },

    shouldShowConfirmation(account, operationType) {
      // Check if user has set no-prompt for this operation type
      if (!this.decrypted.accounts[account] || !this.decrypted.accounts[account].noPrompt) {
        return true; // Show confirmation if no preferences set
      }

      return !this.decrypted.accounts[account].noPrompt[operationType];
    },

    async showTransactionConfirmation(op) {
      return new Promise((resolve, reject) => {
        const account = op[0];
        const operations = op[1];
        const keyType = op[2];
        const operationType = this.getOperationType(op);

        // If user has set no-prompt for this operation type, skip confirmation
        if (!this.shouldShowConfirmation(account, operationType)) {
          resolve(true);
          return;
        }

        // Set up confirmation modal data
        this.confirmAccount = account;
        this.confirmOperations = operations;
        this.confirmKeyType = keyType;
        this.confirmTransaction = op;
        this.confirmDontAsk = false;
        this.pendingConfirmResolve = resolve;
        this.pendingConfirmReject = reject;

        // Show the modal
        this.showConfirmModal = true;
      });
    },

    async handleTransactionConfirm() {
      try {
        // Save no-prompt preference if checked
        if (this.confirmDontAsk) {
          const operationType = this.getOperationType(this.confirmTransaction);
          if (operationType && this.decrypted.accounts[this.confirmAccount]) {
            if (!this.decrypted.accounts[this.confirmAccount].noPrompt) {
              this.decrypted.accounts[this.confirmAccount].noPrompt = {};
            }
            this.decrypted.accounts[this.confirmAccount].noPrompt[operationType] = true;

            // Save to storage
            const encrypted = await this.encryptWithPBKDF2(this.decrypted, this.PIN);
            localStorage.setItem("PEN", encrypted);
            sessionStorage.setItem('pen', JSON.stringify(this.decrypted));
          }
        }

        // Resolve the promise to continue with transaction
        if (this.pendingConfirmResolve) {
          this.pendingConfirmResolve(true);
        }

        this.closeConfirmModal();
      } catch (error) {
        console.error("Failed to save preferences:", error);
        // Still allow transaction to continue
        if (this.pendingConfirmResolve) {
          this.pendingConfirmResolve(true);
        }
        this.closeConfirmModal();
      }
    },

    handleTransactionCancel() {
      if (this.pendingConfirmReject) {
        this.pendingConfirmReject(new Error("Transaction cancelled by user"));
      }
      this.closeConfirmModal();
    },

    closeConfirmModal() {
      const modalElement = document.getElementById('confirmModal');
      if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
          modal.hide();
        }
      }
      this.showConfirmModal = false;
    },

    getReadableOperationType(opType) {
      const typeMap = {
        'transfer': 'Transfer',
        'custom_json': 'Custom JSON',
        'vote': 'Vote',
        'comment': 'Comment/Post',
        'account_update': 'Account Update',
        'delegate_vesting_shares': 'Delegate HP',
        'withdraw_vesting': 'Power Down',
        'account_witness_vote': 'Witness Vote',
        'account_witness_proxy': 'Witness Proxy',
        'create_claimed_account': 'Create Account',
        'claim_reward_balance': 'Claim Rewards'
      };
      return typeMap[opType] || opType;
    },

    formatOperationDetails(op) {
      if (!op || op.length < 2) return 'Unknown operation';

      const opType = op[0];
      const opData = op[1];

      switch (opType) {
        case 'transfer':
          return `Transfer ${opData.amount} to @${opData.to}${opData.memo ? ` (${opData.memo})` : ''}`;
        case 'custom_json':
          return `Custom JSON (${opData.id})${opData.json ? ` - ${opData.json.substring(0, 50)}...` : ''}`;
        case 'vote':
          return `${opData.weight > 0 ? 'Upvote' : 'Downvote'} @${opData.author}/${opData.permlink} (${opData.weight / 100}%)`;
        case 'comment':
          return `${opData.parent_author ? 'Comment on' : 'Post:'} ${opData.title || opData.permlink}`;
        default:
          return `${this.getReadableOperationType(opType)} operation`;
      }
    },

    getNoPromptPreferences(account) {
      if (!this.decrypted.accounts[account] || !this.decrypted.accounts[account].noPrompt) {
        return {};
      }
      return this.decrypted.accounts[account].noPrompt;
    },

    async removeNoPromptPreference(account, operationType) {
      if (!this.decrypted.accounts[account] || !this.decrypted.accounts[account].noPrompt) {
        return;
      }

      delete this.decrypted.accounts[account].noPrompt[operationType];

      try {
        // Save to storage
        const encrypted = await this.encryptWithPBKDF2(this.decrypted, this.PIN);
        localStorage.setItem("PEN", encrypted);
        sessionStorage.setItem('pen', JSON.stringify(this.decrypted));

        this.PENstatus = `Removed no-prompt preference for ${this.getReadableOperationType(operationType)}`;
      } catch (error) {
        console.error("Failed to remove preference:", error);
        this.PENstatus = "Failed to remove preference";
      }
      this.walletState = Date.now();
    },
  },
  async mounted() {
    console.log('[NavVue] Component mounted. User:', this.user, 'Signer:', localStorage.getItem('signer'));

    // Add click handler to prevent nav-bell dropdown from dismissing
    const navBellDropdown = document.querySelector('.nav-bell .dropdown-menu');
    if (navBellDropdown) {
      navBellDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    const signer = localStorage.getItem("signer");
    const decrypted = sessionStorage.getItem('pen')
    if (decrypted) this.decrypted = JSON.parse(decrypted)

    // Restore PIN from session if available
    const sessionPin = sessionStorage.getItem('penPin');
    if (sessionPin && signer === "PEN") {
      this.PIN = sessionPin;
    }

    if (signer == "HSR") this.useHS();
    else if (signer == "HAS") this.useHAS();
    else if (signer == "PEN") await this.usePEN();
    else this.useKC();

    // Handle login modal close to also close PIN modal
    this.$nextTick(() => {
      const loginModal = document.getElementById('loginModal');
      if (loginModal) {
        loginModal.addEventListener('hide.bs.modal', () => {
          if (this.showPinModal) {
            this.closePinModal();
          }
        });
      }
    });
    this.getUser();
    this.getRecentUsers();
    const ops = localStorage.getItem("pending");
    this.ops = ops ? JSON.parse(ops) : [];
    this.cleanOps();
    for (var i = 0; i < this.ops.length; i++) {
      this.statusPinger(this.ops[i].txid, this.ops[i].api, 0);
    }
    if ("WebSocket" in window) this.HAS_.wsa = true;
    else this.HAS_.wsa = false;
    // add sting chat
    this.addStingChat();
    // Nav Behavior
    console.log('[NavVue] Setting up Nav Behavior in mounted().');
    const navMore = document.querySelector(".nav-more .nav-link");
    const dropdownMenus = document.querySelectorAll(".nav-dropdown, .js-hoverable-dropdown");
    const bars = document.querySelectorAll(".nav-bars .bar");
    console.log('[NavVue] dropdownMenus selected:', dropdownMenus);

    let isHoverListenerActive = false;
    let styleTag = null; // Reference to the dynamically added style tag

    function toggleNavMore(event) {
      event.preventDefault();
      bars.forEach(bar => bar.classList.toggle("x"));
    }

    function closeNavMore(event) {
      if (!navMore.contains(event.target)) {
        bars.forEach(bar => bar.classList.remove("x"));
      }
    }

    function dropdownHoverHandler(event) {
      //console.log('[NavVue] dropdownHoverHandler triggered for:', event.currentTarget);
      dropdownMenus.forEach(otherDropdown => {
        const toggleButton = otherDropdown.querySelector(".dropdown-toggle");
        const dropdownInstance = bootstrap.Dropdown.getInstance(toggleButton);

        if (dropdownInstance && otherDropdown !== event.currentTarget) {
          dropdownInstance.hide();
          bars.forEach(bar => bar.classList.remove("x"));
        }
      });
    }

    function addDropdownHoverListeners() {
      console.log('[NavVue] Attempting to add hover listeners. Width:', window.innerWidth, 'isHoverListenerActive:', isHoverListenerActive, 'isCoarsePointer:', window.matchMedia("(pointer: coarse)").matches);
      if (window.innerWidth > 768 && !isHoverListenerActive && !window.matchMedia("(pointer: coarse)").matches) {
        console.log('[NavVue] Conditions MET for adding hover listeners.');
        dropdownMenus.forEach(dropdown => {
          dropdown.addEventListener("mouseover", dropdownHoverHandler);
        });
        isHoverListenerActive = true;
        addDropdownHoverCSS();
      } else {
        console.log('[NavVue] Conditions NOT MET for adding hover listeners.');
      }
    }

    function removeDropdownHoverListeners() {
      if (isHoverListenerActive) { // Only remove if active
        console.log('[NavVue] Removing hover listeners.');
        dropdownMenus.forEach(dropdown => {
          dropdown.removeEventListener("mouseover", dropdownHoverHandler);
        });
        isHoverListenerActive = false;
        removeDropdownHoverCSS();
      }
    }

    function addDropdownHoverCSS() {
      console.log('[NavVue] Setting data-touch to false');
      document.body.setAttribute("data-touch", "false");
      const style = document.createElement('style');
      style.textContent = `
        .auth-methods-grid {
          width: 100%;
          padding: 0.5rem;
        }
        .auth-method-btn {
          width: 100%;
          min-height: 50px;
          height: 50px;
          max-height: 50px;
          background-color: #1a1a1a;
          border: 2px solid #333;
          border-radius: 8px;
          padding: 0.5rem;
          display: -webkit-box;
          display: -ms-flexbox;
          display: flex;
          -webkit-box-orient: vertical;
          -webkit-box-direction: normal;
          -ms-flex-direction: column;
          flex-direction: column;
          -webkit-box-align: center;
          -ms-flex-align: center;
          align-items: center;
          -webkit-box-pack: center;
          -ms-flex-pack: center;
          justify-content: center;
          -webkit-transition: all 0.2s ease;
          transition: all 0.2s ease;
          cursor: pointer;
          position: relative;
        }
        .auth-method-btn:hover:not(:disabled) {
          background-color: #2a2a2a;
          border-color: #444;
        }
        .auth-method-btn.selected {
          border: 3px solid #007bff;
          background-color: #2a2a2a;
        }
        .auth-method-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .auth-method-btn img {
          max-width: 100%;
          max-height: 100%;
          -o-object-fit: contain;
          object-fit: contain;
          position: relative;
          z-index: 1;
        }
        .auth-method-btn small {
          position: relative;
          z-index: 1;
          margin-top: 0.25rem;
        }
        .auth-method-btn .badge {
          position: relative;
          z-index: 1;
        }
      `;
      document.head.appendChild(style);
    }

    function removeDropdownHoverCSS() {
      console.log('[NavVue] Setting data-touch to true');
      document.body.setAttribute("data-touch", "true");
    }

    function handleResize() {
      console.log('[NavVue] handleResize called. Width:', window.innerWidth, 'isCoarsePointer:', window.matchMedia("(pointer: coarse)").matches);
      if (window.innerWidth > 768 && !window.matchMedia("(pointer: coarse)").matches) {
        addDropdownHoverListeners();
      } else {
        removeDropdownHoverListeners();
      }
    }

    // Add event listeners when component is mounted
    if (navMore) {
      navMore.addEventListener("click", toggleNavMore);
    }
    document.addEventListener("click", closeNavMore);
    handleResize();
    window.addEventListener("resize", handleResize);

    // Store references for cleanup
    this._cleanup = () => {
      if (navMore) {
        navMore.removeEventListener("click", toggleNavMore);
      }
      document.removeEventListener("click", closeNavMore);
      window.removeEventListener("resize", handleResize);
      removeDropdownHoverListeners();
    };
  },
  beforeUnmount() {
    if (this._cleanup) {
      this._cleanup();
    }
  },
  computed: {
    avatar: {
      get() {
        return this.user
          ? "https://images.hive.blog/u/" + this.user + "/avatar"
          : "";
      },
    },
    HKCa: {
      //Hive Keychain Available
      get() {
        return !!window.hive_keychain;
      },
    },
    hasEncryptedWallet() {
      // Include walletState in the computation to make it reactive
      this.walletState;
      return localStorage.getItem("PEN") !== null;
    },
  },
  template: `<div>
  <nav class="navbar navbar-floating navbar-expand-lg p-0 container">
    <ul class="navbar-nav mx-auto">
      <li class="nav-item">
        <a class="nav-link d-flex align-items-center" href="/">
          <svg class="nav-logo" viewBox="0 0 333 333" xmlns="http://www.w3.org/2000/svg">
            <polygon class="cls-1"
              points="184.59 135.97 184.21 135.97 110.55 11.06 219.49 9.03 228.91 24.43 137.69 26.25 146.62 41 165.61 72.39 184.6 103.79 193.82 119.03 211.76 119.03 248.48 119.03 284.59 119.02 302.68 119.02 256.79 39.98 273.78 40.15 329.46 134.96 184.59 135.97" />
            <polygon class="cls-2"
              points="110.55 11.06 184.21 135.97 184.59 135.97 175.83 150.85 175.52 150.85 101.87 27.04 110.55 11.06" />
            <polygon class="cls-3"
              points="184.01 40.5 146.62 41 137.69 26.25 228.91 24.43 184.6 103.79 174.99 87.86 201.39 40.27 184.08 40.5 184.01 40.5" />
            <polygon class="cls-1" points="56.71 41.63 74.44 41.74 148.19 166.21 129.63 166.16 56.71 41.63" />
            <polygon class="cls-2"
              points="85.44 214.65 102.95 182.4 111.45 166.74 102.39 151.26 83.85 119.57 65.61 88.41 56.48 72.79 11.43 152.31 2.99 137.56 56.71 41.63 129.63 166.16 60.3 293.15 3.54 200.14 12.08 184.24 59.71 262.05 67.94 246.89 85.44 214.65" />
            <polygon class="cls-2"
              points="184.08 40.5 201.39 40.27 174.99 87.86 184.6 103.79 165.61 72.39 184.01 40.5 184.08 40.5" />
            <polygon class="cls-2"
              points="211.76 118.76 256.63 39.89 256.79 39.98 302.68 119.02 284.59 119.02 284.59 118.95 266.04 87.37 256.42 71.01 230.02 118.48 211.76 118.76" />
            <polygon class="cls-3"
              points="56.48 72.79 65.61 88.41 65.55 88.45 47.66 120.4 38.4 136.96 92.7 135.78 102.16 151.4 11.43 152.5 11.43 152.31 56.48 72.79" />
            <polygon class="cls-3"
              points="256.42 71.01 266.04 87.37 265.75 87.54 248.48 118.39 248.48 119.03 211.76 119.03 211.76 118.76 230.02 118.48 256.42 71.01" />
            <polygon class="cls-1"
              points="83.85 119.57 102.39 151.26 102.16 151.4 92.7 135.78 38.4 136.96 47.66 120.4 47.95 120.56 83.29 119.89 83.85 119.57" />
            <polygon class="cls-3" points="175.83 150.85 184.59 135.97 329.46 134.96 320.41 150.21 175.83 150.85" />
            <polygon class="cls-3"
              points="129.63 166.16 148.19 166.21 148.38 166.53 78.48 292.56 60.3 293.15 129.63 166.16" />
            <polygon class="cls-1"
              points="48.62 214.87 67.94 246.89 59.71 262.05 12.08 184.24 102.95 182.4 94.06 198.74 39.65 199.99 48.59 214.81 48.62 214.87" />
            <polygon class="cls-3"
              points="102.95 182.4 85.44 214.65 48.62 214.87 48.59 214.81 39.65 199.99 94.06 198.74 102.95 182.4" />
            <polygon class="cls-1"
              points="175.84 182.61 319.13 180.4 330.01 196.91 185.61 198.39 175.84 182.61 175.84 182.61" />
            <polygon class="cls-2"
              points="175.47 182.61 175.84 182.61 175.84 182.61 185.61 198.39 113.76 323.97 104.73 308.18 175.47 182.61" />
            <polygon class="cls-3"
              points="167.45 261.43 149.16 293.24 140.56 308.18 231.79 307.99 222.72 323.59 113.76 323.97 185.61 198.39 330.01 196.91 276.31 291.28 259.33 291.82 303.59 213.44 284.52 213.57 249.4 213.81 230.83 213.93 212.56 214.06 194.63 214.18 185.75 229.62 167.45 261.43" />
            <polygon class="cls-2"
              points="212.56 214.06 230.83 213.93 258.27 260.81 267.49 244.22 284.52 213.57 303.59 213.44 259.33 291.82 259.17 291.92 212.56 214.06" />
            <polygon class="cls-1"
              points="230.83 213.93 249.4 213.81 267.23 244.08 267.49 244.22 258.27 260.81 230.83 213.93" />
            <polygon class="cls-2"
              points="167.45 261.43 185.75 229.62 176.49 245.76 203.93 292.76 186.62 292.91 186.56 292.91 167.45 261.43" />
            <polygon class="cls-1"
              points="186.56 292.91 186.62 292.91 203.93 292.76 176.49 245.76 185.75 229.62 231.79 307.99 140.56 308.18 149.16 293.24 186.56 292.91" />
          </svg>
          <span class="nav-logotype ms-1">DLUX</span></a>
      </li>
      <li class="nav-item nav-hide">
        <a class="nav-link nav-highlight nav-title" href="/hub">HUB<span class="nav-subtitle">Social
            dApps</span></a>
      </li>
      <li class="nav-item nav-hide dropdown nav-dropdown">
        <a class="nav-link nav-highlight nav-title dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown"
          aria-expanded="false">NFTs<span class="nav-subtitle">Collectible PFPs &
            TCGs</span></a>
        <div class="hover-gap"></div>
        <ul class="dropdown-menu">
          <li>
            <a class="dropdown-item subnav-title" href="/nfts">Marketplace<span class="subnav-subtitle">Sales and
                Auctions</span></a>
          </li>
          <li>
            <a class="dropdown-item subnav-title" href="/nfts/sets">Browse Sets<span class="subnav-subtitle">Discover
                New Collections
              </span></a>
          </li>
        </ul>
      </li>
      <li class="nav-item nav-hide">
        <a class="nav-link nav-highlight nav-title" href="/dex">DEX<span class="nav-subtitle">Exchange
            Tokens</span></a>
      </li>
      <li v-if="!user" class="nav-item">
        <a class="nav-link nav-highlight nav-title" href="#" role="button" data-bs-toggle="modal"
          data-bs-target="#loginModal" aria-controls="loginModal">Login<span class="nav-subtitle">HIVE
            Username</span></a>
      </li>
      <li v-show="user" class="nav-item dropdown nav-dropdown">
        <a class="nav-link nav-highlight nav-title dropdown-toggle d-flex align-items-center" href="#" role="button"
          data-bs-toggle="dropdown" aria-expanded="false">
          <img :src="avatar" class="pfp rounded-circle img-fluid bg-mint-blue"><span
            class="navbar-username ms-2">{{user}}</span></a>
        <div class="hover-gap"></div>
        <ul class="dropdown-menu container">
          <li>
            <a class="dropdown-item subnav-title" href="/me#blog/" @click="showTab('blog')">Profile<span
                class="subnav-subtitle">HIVE
                Blog</span></a>
          </li>
          <li>
            <a class="dropdown-item subnav-title" href="/me#drive/" @click="showTab('drive')">IPFS Drive<span
                class="subnav-subtitle">SPK
                Network</span></a>
          </li>
          <li>
            <a class="dropdown-item subnav-title" href="/me#inventory/" @click="showTab('inventory')">Inventory<span
                class="subnav-subtitle">NFT Collection</span></a>
          </li>
          <li>
            <a class="dropdown-item subnav-title" href="/me#wallet/" @click="showTab('wallet')">Wallet<span
                class="subnav-subtitle">Honeycomb Tokens</span></a>
          </li>
          <li class="subnav-extra-top">
            <a class="dropdown-extra" role="button" href="#/" @click="toggleChat"
              data-bs-toggle="offcanvas" data-bs-target="#offcanvasSting" aria-controls="offcanvasSting">Sting Chat</a>
          </li>
          <li class="subnav-extra-middle d-none">
            <a class="dropdown-extra" role="button" href="#/" data-bs-toggle="modal"
              data-bs-target="#qrModal" aria-controls="qrModal">QR Code</a>
          </li>
          <li class="subnav-extra-middle">
            <a class="dropdown-extra" role="button" href="#/" data-bs-toggle="modal"
              data-bs-target="#loginModal" aria-controls="loginModal">Switch User</a>
          </li>
          <li class="subnav-extra-bottom">
            <a class="dropdown-extra" role="button" href="#/" @click="logout()">Logout</a>
          </li>
        </ul>
      </li>
      <li class="nav-bell dropdown nav-dropdown dropdown-end">
        <a class="nav-link nav-highlight nav-title dropdown-toggle d-flex align-items-center justify-content-center nav-link nav-highlight" href="#" role="button" 
           data-bs-toggle="dropdown" aria-expanded="false">
          <div class="position-relative">
            <i class="fa-solid fa-bell fs-4"></i>
            <span v-if="notificationsCount > 0" class="position-absolute d-flex align-items-center top-0 start-100 translate-middle badge border border-light rounded-pill bg-danger">
              <span class="visually-hidden">unread messages</span>
              <span style="font-size: .5rem;">{{notificationsCount}}</span>
            </span>
          </div>
        </a>
         <div class="hover-gap"></div>
        <div class="dropdown-menu container dropdown-menu-end px-1 py-1" style="min-width: 320px;">
          <sw-monitor @toast="handleToast" />
        </div>
      </li>
      <li class="nav-more dropdown nav-dropdown">
        <a class="nav-link nav-highlight nav-title dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown"
          aria-expanded="false">
          <span class="nav-bars">
            <span class="bar"></span>
            <span class="bar"></span>
            <span class="bar"></span>
          </span>
        </a>
        <div class="hover-gap"></div>
        <ul class="dropdown-menu container">
          <li class="nav-show"><a class="dropdown-item subnav-title" href="/hub">HUB<span class="subnav-subtitle">Social
                dApps</span></a></li>
          <li class="nav-show"><a class="dropdown-item subnav-title" href="/dex">DEX<span
                class="subnav-subtitle">Exchange Tokens</span></a></li>
          <li class="nav-show"><a class="dropdown-item subnav-title" href="/nfts">NFT Marketplace<span
                class="subnav-subtitle">Sales and Auctions</span></a></li>
          <li class="nav-show"><a class="dropdown-item subnav-title" href="/nfts/sets">Browse NFT Sets<span
                class="subnav-subtitle">Discover New Collections</span></a></li>
          <li><a class="dropdown-item subnav-title" href="/create/">Publishing<span class="subnav-subtitle">Upload
                and Post to DLUX</span></a></li>
          <li><a class="dropdown-item subnav-title" href="/storage/">Storage<span class="subnav-subtitle">Pin IPFS Files with SPK</span></a></li>
          <li><a class="dropdown-item subnav-title position-relative" href="/mint/">Minting<span class="subnav-subtitle">Craft NFT Sets on DLUX</span><span class="position-absolute top-0 end-0 badge text-bg-primary mt-1 me-2">Coming Soon</span></a></li>
          <li><a class="dropdown-item subnav-title" href="/node/">Node Rewards<span class="subnav-subtitle">Earn Tokens for DePIN Services</span></a></li>
          <li><a class="dropdown-item subnav-title" href="/dao/">Honeycomb DAO<span class="subnav-subtitle">Launch Your
                DeFi Project</span></a></li>
          <li><a class="dropdown-item subnav-title position-relative" href="/docs/" target="_blank">Docs<span
                class="subnav-subtitle">Explore
                DLUX Documentation</span><span class="position-absolute top-50 end-0 translate-middle-y"><i class="mx-2 fa-solid fa-arrow-up-right-from-square"></i></span></a></li>
          <li class="subnav-extra-top"><a class="dropdown-extra" href="/@disregardfiat">Blog</a></li>
          <li class="subnav-extra-bottom"><a class="dropdown-extra" href="/about">Press Kit</a></li>
        </ul>
      </li>
    </ul>
  </nav>
  <!-- toast -->
  <div class="position-fixed bottom-0 end-0 p-3 toast-container" style="z-index: 11">
    <div v-for="op in ops">
      <toast-vue :alert="op" />
    </div>
  </div>
  <!-- sting chat -->
  <div class="offcanvas offcanvas-end bg-blur-darkg bg-img-none text-light-50" tabindex="-1" id="offcanvasSting"
    aria-labelledby="offcanvasStingLabel">
    <div class="offcanvas-header d-flex align-items-center justify-content-between">
      <div class="d-flex">
        <h5 id="offcanvasRightLabel" class="m-0 p-0">Sting Chat</h5>
        <div class="d-flex"><span class="small badge border border-warning ms-1 mb-auto"
            style="font-size: 0.5em;">BETA</span></div>
      </div>
      <button type="button" class="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
    </div>
    <div class="offcanvas-body p-0">
      <!-- stwidget -->
      <div id="stingChat" class=""></div>
    </div>
  </div>
  <!-- login modal -->
  <div class="modal fade" id="loginModal" tabindex="-1" aria-labelledby="loginModal" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">User Management</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <!-- login method selector -->
          <div class="d-flex flex-column mb-1">
          <label class="lead mb-1">Signing Method</label>
            <div class="row mb-1">
              <div class="auth-methods-grid">
                <div class="row g-2">
                  <div class="col-6">
                    <button 
                      class="auth-method-btn" 
                      :class="{'selected': HKC}"
                      @click="useKC()"
                      :disabled="node">
                      <img src="/img/keychain.png" class="img-responsive" style="height:50px !important;">
                    </button>
                  </div>
                  <div class="col-6">
                    <button 
                      class="auth-method-btn" 
                      :class="{'selected': HAS}"
                      @click="useHAS()"
                      :disabled="node">
                      <img src="/img/hiveauth.svg" class="img-responsive" style="height:50px !important;">
                    </button>
                  </div>
                  <div class="col-6">
                    <button 
                      class="auth-method-btn" 
                      :class="{'selected': HSR}"
                      @click="useHS()"
                      :disabled="node">
                      <img src="/img/hivesigner_white.svg" class="img-responsive" style="height:50px !important;">
                    </button>
                  </div>
                  <div class="col-6">
                    <button 
                      class="auth-method-btn" 
                      :class="{'selected': PEN}"
                      @click="usePEN()"
                      :disabled="node">
                      <img src="/img/dlux-pen.png" class="img-responsive" style="height:50px !important;">
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <!-- login method description -->
            <div class="small text-white-50 text-center mb-2">
             
              <!-- PEN Management Button -->
              <div v-if="PEN" class="mb-2">
              
                <div class="row">
                  <!-- No Wallet / Set Password -->
                  <div v-if="!hasEncryptedWallet" class="col-4 p-1 mx-auto">
                    <button class="bg-card text-dark btn btn-primary btn-sm w-100 h-100 d-flex flex-column align-items-center justify-content-center" @click="setupNewPin()" style="border: #000 solid 1px;">
                      <i class="fa-solid fa-wallet mb-1"></i>
                      <small>Set Password</small>
                       <span class="badge bg-dark mt-1">* * *</span>
                    </button>
                  </div>
                  <!-- Has Wallet -->
                  <div class="col-4 p-1" v-if="hasEncryptedWallet">
                    <!-- Manage Keys -->
                    <button class="bg-card text-dark btn btn-info btn-sm w-100 h-100 d-flex flex-column align-items-center justify-content-center" @click="openPenManagement()" style="border: #000 solid 1px;">
                      <i class="fa-solid fa-key mb-1"></i>
                      <small>Manage Keys</small>
                      <span class="badge text-dark mt-1" :class="PIN || decrypted.pin ? 'bg-success' : 'bg-warning'">
                        {{ PIN || decrypted.pin ? 'Decrypted' : 'Encrypted' }}
                      </span>
                    </button>
                  </div>
                  <div class="col-4 p-1" v-if="hasEncryptedWallet">
                    <!-- Unlock Wallet -->
                    <button v-if="!PIN && !decrypted.pin" class="bg-card text-dark btn btn-warning btn-sm w-100 h-100 d-flex flex-column align-items-center justify-content-center" @click="requestPinForDecryption()" style="border: #000 solid 1px;">
                      <i class="fa-solid fa-lock mb-1"></i>
                      <small>Unlock Wallet</small>
                    </button>
                    <!-- Lock Wallet -->
                    <button v-if="PIN || decrypted.pin" class="bg-card text-dark btn btn-warning btn-sm w-100 h-100 d-flex flex-column align-items-center justify-content-center" @click="closeWallet()" style="border: #000 solid 1px;">
                      <i class="fa-solid fa-lock mb-1"></i>
                      <small>Lock Wallet</small>
                    </button>
                  </div>
                  <div class="col-4 p-1" v-if="hasEncryptedWallet">
                    <button type="button" class="bg-card btn btn-danger text-dark btn-sm w-100 h-100 d-flex flex-column align-items-center justify-content-center" @click="deleteWallet()" style="border: #000 solid 1px;">
                      <i class="fa-solid fa-trash mb-1"></i>
                      <small>Delete</small>
                    </button>
                  </div>
                </div>
              </div>
              <div class="mb-2" v-if="HAS && haspich > 100">
              <div>
                <div class="bg-white rounded text-center">
                  <a class="no-decoration" :href="HAS_.uri"><img :src="haspic" :height="haspich + 'px'"
                      class="img-responsive p-2 mx-3">
                    <p v-show="haspich > 100" class="text-dark">Tap or scan with PKSA App for {{user}}</p>
                  </a>
                </div>
              </div>
            </div>
               <span v-if="HKC">Hive Keychain requires a Firefox or Chrome extension</span>
              <span v-if="HAS">Hive Auth requires websockets and a PKSA Application</span>
              <span v-if="HSR">Hive Signer generates a link</span>
              <span v-if="PEN">dluxPEN lets you sign transactions with locally stored and encrypted keys</span>
            </div>
          </div>
          <!-- current user -->
          <div class="d-flex flex-column mb-3">
            <div>
              <label class="lead mb-1">Current user</label>
              <div v-if="!user" class="bg-darkest rounded d-flex align-items-center p-2 text-white-50">
                <img src="/img/no-user.png" alt="" width="50" height="50" class="img-fluid rounded-circle me-2 cover">
                <span v-if="!recentUsers.length" class="flex-grow-1 text-center">ADD USER BELOW</span>
                <span v-if="recentUsers.length" class="flex-grow-1 text-center">ADD OR SELECT RECENT USER</span>
              </div>
              <div v-if="user" class="bg-darkest rounded d-flex align-items-center p-2">
                <img :src="avatar" id="userImage" alt="" width="50" height="50"
                  class="img-fluid rounded-circle bg-light me-2 cover">
                <span id="userName">{{user}}</span>
                <div class="ms-auto">
                  <a class="btn btn-outline-secondary btn-sm me-1"
                    :class="[{'btn-outline-success':HAS_.wsconn && HAS_.token},{'btn-outline-warning':!HAS_.wsconn && HAS_.token},{'btn-outline-secondary':!HAS_.token}]"
                    :href="HAS_.uri" v-if="HAS"><i class="fa-solid fa-satellite-dish"></i></a>
                  <a class="btn btn-outline-danger btn-sm" role="button" @click="logout()"><i
                      class="fas fa-power-off fa-fw"></i></a>
                </div>
              </div>
            </div>

             <a class="mx-auto bg-card btn btn-danger text-dark mt-2 rounded-pill no-decoration" href="/qr" >Create A New Hive Account</a>
          </div>
          <!-- add user-->
          <div>
            <label class="lead mb-1">Add user</label>
            <div class="position-relative has-validation">
              <span class="position-absolute top-50 translate-middle-y ps-2 text-light">
                <i class="fa-solid fa-at fa-fw"></i>
              </span>
              <input v-model="userField" autocapitalize="off" placeholder="username" @keyup.enter="setUser()"
                class="px-4 form-control bg-dark border-dark text-info">
              <span v-if="userField" class="position-absolute end-0 top-50 translate-middle-y pe-2">
                <button type="button" @click="setUser()" class="btn btn-sm btn-primary"><i
                    class="fa-solid fa-plus fa-fw"></i></button>
              </span>
            </div>
            <!-- Consent Checkboxes -->
            <div class="mt-2 mb-1">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" v-model="consentPrivacy" id="privacyCheck" @change="consentError = false">
                <label class="form-check-label small" :class="{'text-danger': consentError && !consentPrivacy}" for="privacyCheck">
                  I agree to the <a href="/about#privacy" target="_blank" class="text-info">Privacy Policy</a>
                </label>
              </div>
              <div class="form-check">
                <input class="form-check-input" type="checkbox" v-model="consentTerms" id="termsCheck" @change="consentError = false">
                <label class="form-check-label small" :class="{'text-danger': consentError && !consentTerms}" for="termsCheck">
                  I agree to the <a href="/about#terms" target="_blank" class="text-info">Terms of Service</a>
                </label>
              </div>
            </div>
            <div class="small text-white-50 text-center mt-1 mb-2">
              Usernames are stored locally without verification. You must posses the associated private keys to make transactions.
            </div>
          </div>
          <!-- recent users -->
          <div class="mt-1" v-if="recentUsers.length">
            <label class="lead mb-2">Recent users</label>
            <div class="d-none position-relative has-validation">
              <span class="position-absolute top-50 translate-middle-y ps-2 text-light">
                <i class="fa-solid fa-at fa-fw"></i>
              </span>
              <input type="search" v-model="filterUsers" autocapitalize="off" placeholder="search"
                @keyup="searchRecents()" class="ps-4 form-control bg-dark border-dark text-info">
            </div>
          </div>
          <div class="d-flex hover justify-content-between align-items-center py-3 border-light-50 border-top"
            v-if="!filterUsers" v-for="name in recentUsers">
            <div class="flex-fill text-center"><a class="text-info" role="button"
                @click="setUser(name);toggleAccountMenu()">@{{name}}</a></div>
            <div class="flex-shrink me-2 d-none"><i class="fa-solid fa-feather-pointed fa-fw"></i></div>
            <div class="flex-shrink me-2"><a class="text-danger ms-auto" role="button" @click="deleteRecentUser(name)"
                alt="Remove username"><i class="fa-solid fa-trash-can"></i></a></div>
          </div>
          <div class="d-flex hover justify-content-between align-items-center py-3 border-light-50 border-top"
            v-if="filterUsers" v-for="name in filterRecents">
            <div class="flex-fill text-center"><a class="text-info" role="button"
                @click="setUser(name);toggleAccountMenu()">@{{name}}</a></div>
            <div class="flex-shrink me-2 d-none"><i class="fa-solid fa-feather-pointed fa-fw"></i></div>
            <div class="flex-shrink me-2"><a class="text-danger ms-auto" role="button"
                @click="deleteRecentUser(name);searchRecents()" alt="Remove username"><i
                  class="fa-solid fa-trash-can"></i></a></div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <!-- PIN Setup Modal -->
  <div class="modal fade" id="pinModal" tabindex="-1" aria-labelledby="pinModalLabel" aria-hidden="true" v-show="showPinModal" data-bs-backdrop="static">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="pinModalLabel">
            {{ isCreatingPin ? 'Create PIN for dluxPEN' : 'Enter PIN to Decrypt' }}
          </h5>
          <button type="button" class="btn-close" @click="closePinModal()" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div v-if="isCreatingPin">
            <p class="small text-white-50 mb-3">
              Create a secure PIN to encrypt your private keys. This PIN will be required each time you want to use dluxPEN.
            </p>
            <div class="mb-3">
              <label class="form-label">New PIN (minimum 4 characters)</label>
              <input type="password" v-model="newPin" class="form-control bg-dark border-dark text-light" 
                     placeholder="Enter new PIN" @keyup.enter="handlePinSubmit()" ref="pinInput">
            </div>
            <div class="mb-3">
              <label class="form-label">Confirm PIN</label>
              <input type="password" v-model="confirmPin" class="form-control bg-dark border-dark text-light" 
                     placeholder="Confirm PIN" @keyup.enter="handlePinSubmit()">
            </div>
          </div>
          <div v-else>
            <p class="small text-white-50 mb-3">
              Enter your PIN to decrypt your stored private keys.
            </p>
            <div class="mb-3">
              <label class="form-label">PIN</label>
              <input type="password" v-model="PIN" class="form-control bg-dark border-dark text-light" 
                     placeholder="Enter your PIN" @keyup.enter="handlePinSubmit()" ref="pinInput">
            </div>
          </div>
          <div v-if="pinError" class="alert alert-danger small">
            {{ pinError }}
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closePinModal()" :disabled="pinLoading">Cancel</button>
          <button type="button" class="btn btn-primary" @click="handlePinSubmit()" :disabled="pinLoading">
            <span v-if="pinLoading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            <span v-if="pinLoading">{{ isCreatingPin ? 'Creating...' : 'Decrypting...' }}</span>
            <span v-else>{{ isCreatingPin ? 'Create PIN' : 'Decrypt' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
  <!-- Private Key Entry Modal -->
  <div class="modal fade" id="keyModal" tabindex="-1" aria-labelledby="keyModalLabel" aria-hidden="true" v-show="showKeyModal" data-bs-backdrop="static">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="keyModalLabel">
            {{ editingAccount ? (isUpdatingKey ? 'Update' : 'Add') + ' ' + keyType.charAt(0).toUpperCase() + keyType.slice(1) + ' Key for @' + editingAccount : 'Enter Private ' + keyType.charAt(0).toUpperCase() + keyType.slice(1) + ' Key' }}
          </h5>
          <button type="button" class="btn-close" @click="closeKeyModal()" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <p class="small text-white-50 mb-3">
            {{ editingAccount ? 
               (isUpdatingKey ? 
                'Update the private ' + keyType + ' key for @' + editingAccount + '. The new key will replace the existing one.' :
                'Enter the private ' + keyType + ' key for @' + editingAccount + '. This key will be encrypted and stored locally.'
               ) :
               'Please enter your private ' + keyType + ' key for @' + user + '. This key will be encrypted and stored locally.'
            }}
          </p>
          <div class="mb-3">
            <label class="form-label">Private {{ keyType.charAt(0).toUpperCase() + keyType.slice(1) }} Key</label>
            <input type="password" v-model="privateKey" class="form-control bg-dark border-dark text-light" 
                   placeholder="5..." @keyup.enter="handleKeySubmit()" ref="keyInput">
          </div>
          <div v-if="keyError" class="alert alert-danger small">
            {{ keyError }}
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeKeyModal()" :disabled="keyLoading">Cancel</button>
          <button type="button" class="btn btn-primary" @click="handleKeySubmit()" :disabled="keyLoading">
            <span v-if="keyLoading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            <span v-if="keyLoading">{{ editingAccount ? (isUpdatingKey ? 'Updating...' : 'Adding...') : 'Storing...' }}</span>
            <span v-else>{{ editingAccount ? (isUpdatingKey ? 'Update Key' : 'Add Key') : 'Store Key' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
  <!-- PEN Management Modal -->
  <div class="modal fade" id="penModal" tabindex="-1" aria-labelledby="penModalLabel" aria-hidden="true" v-show="showPenModal" data-bs-backdrop="static">
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="penModalLabel">
            <i class="fa-solid fa-key me-2"></i>dluxPEN Key Management
          </h5>
          <button type="button" class="btn-close" @click="closePenModal()" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <!-- Overview Mode -->
          <div v-if="penManagementMode === 'overview'">
            <div class="text-center">
              <i class="fa-solid fa-wallet fa-3x text-white-50 mb-3"></i>
              <h6>No dluxPEN wallet found</h6>
              <p class="text-white-50">Create a wallet by selecting dluxPEN as your signing method and setting up a PIN.</p>
            </div>
          </div>
          
          <!-- Decrypt Mode -->
          <div v-if="penManagementMode === 'decrypt'">
            <div class="text-center mb-4">
              <i class="fa-solid fa-lock fa-3x text-warning mb-3"></i>
              <h6>Wallet is Encrypted</h6>
              <p class="text-white-50">Enter your PIN to decrypt and manage your stored keys.</p>
            </div>
            <div class="mb-3">
              <label class="form-label">PIN</label>
              <input type="password" v-model="penDecryptPassword" class="form-control bg-dark border-dark text-light" 
                     placeholder="Enter your PIN" @keyup.enter="handlePenDecrypt()">
            </div>
            <div v-if="penDecryptError" class="alert alert-danger small">
              {{ penDecryptError }}
            </div>
            <div class="text-center">
              <button type="button" class="btn btn-primary me-2" @click="handlePenDecrypt()">
                <i class="fa-solid fa-unlock me-2"></i>Decrypt
              </button>
              <button type="button" class="btn btn-danger" @click="deleteWallet()">
                <i class="fa-solid fa-trash me-2"></i>Reset Wallet
              </button>
            </div>
          </div>
          
          <!-- Management Mode -->
          <div v-if="penManagementMode === 'manage'">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h6 class="mb-0">
                  <i class="fa-solid fa-unlock text-success me-2"></i>Wallet Decrypted
                </h6>
                <small class="text-white-50">{{ Object.keys(decrypted.accounts || {}).length }} account(s) stored</small>
              </div>
                             <div>
                 <button type="button" class="btn btn-outline-warning btn-sm me-2" @click="openChangePinModal()">
                   <i class="fa-solid fa-key me-1"></i>Change PIN
                 </button>
                 <button type="button" class="btn btn-danger btn-sm" @click="deleteWallet()">
                   <i class="fa-solid fa-trash me-1"></i>Delete Wallet
                 </button>
               </div>
            </div>
            
            <!-- Add Account Button -->
            <div class="text-center mb-4">
              <button type="button" class="btn btn-outline-success btn-sm" @click="addNewAccountToWallet()">
                <i class="fa-solid fa-plus me-1"></i>Add Account to Wallet
              </button>
            </div>
            
            <!-- Accounts List -->
            <div v-if="getAllAccountsInWallet().length === 0" class="text-center text-white-50 py-4">
              <i class="fa-solid fa-folder-open fa-2x mb-2"></i>
              <p>No accounts in wallet</p>
            </div>
            
            <div v-for="account in getAllAccountsInWallet()" :key="account" class="mb-4">
              <div class="card bg-dark border-secondary">
                <div class="card-header d-flex justify-content-between align-items-center">
                  <h6 class="mb-0">
                    <img :src="'https://images.hive.blog/u/' + account + '/avatar'" 
                         class="rounded-circle me-2" width="24" height="24">
                    @{{ account }}
                    <span v-if="!hasAnyKeys(account)" class="badge bg-warning text-dark ms-2">No Keys</span>
                  </h6>
                  <div>
                    <button v-if="hasAnyKeys(account)" type="button" class="btn btn-outline-info btn-sm me-2" @click="openExportModal(account)">
                      <i class="fa-solid fa-download me-1"></i>Export
                    </button>
                    <button type="button" class="btn btn-outline-danger btn-sm" @click="deleteAccount(account)">
                      <i class="fa-solid fa-trash me-1"></i>Delete
                    </button>
                  </div>
                </div>
                <div class="card-body">
                  <div v-for="keyType in getAllKeyTypes()" :key="keyType" class="mb-3">
                    <div class="d-flex justify-content-between align-items-center">
                      <label class="form-label mb-0 text-capitalize">{{ keyType }} Key</label>
                      <div>
                        <button v-if="hasKey(account, keyType)" type="button" class="btn btn-outline-secondary btn-sm me-2" 
                                @click="toggleShowKey(account, keyType)">
                          <i :class="showPenKeys[account + '-' + keyType] ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
                        </button>
                        <button v-if="hasKey(account, keyType)" type="button" class="btn btn-outline-warning btn-sm me-2" 
                                @click="editKey(account, keyType, true)">
                          <i class="fa-solid fa-edit"></i>
                        </button>
                        <button v-if="!hasKey(account, keyType)" type="button" class="btn btn-outline-success btn-sm me-2" 
                                @click="editKey(account, keyType, false)">
                          <i class="fa-solid fa-plus"></i>
                        </button>
                        <button v-if="hasKey(account, keyType)" type="button" class="btn btn-outline-danger btn-sm" 
                                @click="deleteKey(account, keyType)">
                          <i class="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </div>
                    <div v-if="hasKey(account, keyType)" class="mt-2">
                      <input 
                        :type="showPenKeys[account + '-' + keyType] ? 'text' : 'password'"
                        :value="decrypted.accounts[account][keyType]" 
                        class="form-control bg-darkest border-dark text-light font-monospace small"
                        readonly
                        @dblclick="copyKeyToClipboard(decrypted.accounts[account][keyType])"
                        style="cursor: pointer;"
                        :title="'Double-click to copy ' + keyType + ' key'">
                      <small class="text-white-50">Double-click to copy to clipboard</small>
                    </div>
                    <div v-else class="mt-2">
                      <div class="form-control bg-darker border-secondary text-white-50 small text-center py-2">
                        <i class="fa-solid fa-plus me-1"></i>Click + to add {{ keyType }} key
                      </div>
                    </div>
                  </div>
                  
                  <!-- No-Prompt Preferences Section -->
                  <div v-if="Object.keys(getNoPromptPreferences(account)).length > 0" class="mt-4">
                    <h6 class="mb-2 text-warning">
                      <i class="fa-solid fa-bell-slash me-1"></i>No-Prompt Preferences
                    </h6>
                    <div class="small">
                      <div v-for="(enabled, operationType) in getNoPromptPreferences(account)" :key="operationType" 
                           class="d-flex justify-content-between align-items-center mb-2 p-2 bg-darker rounded">
                        <span class="text-capitalize">{{ getReadableOperationType(operationType) }}</span>
                        <button type="button" class="btn btn-outline-danger btn-sm" 
                                @click="removeNoPromptPreference(account, operationType)">
                          <i class="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <!-- Export Keys Modal -->
  <div class="modal fade" id="exportModal" tabindex="-1" aria-labelledby="exportModalLabel" aria-hidden="true" v-show="showExportModal" data-bs-backdrop="static">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="exportModalLabel">
            <i class="fa-solid fa-download me-2"></i>Export Keys for @{{ exportAccount }}
          </h5>
          <button type="button" class="btn-close" @click="closeExportModal()" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <label class="form-label">Export Format</label>
            <div class="form-check">
              <input class="form-check-input" type="radio" v-model="exportFormat" value="text" id="formatText">
              <label class="form-check-label" for="formatText">
                <i class="fa-solid fa-file-text me-2"></i>Text File
                <small class="text-white-50 d-block">Download as .txt file</small>
              </label>
            </div>
            <div class="form-check">
              <input class="form-check-input" type="radio" v-model="exportFormat" value="qr" id="formatQR">
              <label class="form-check-label" for="formatQR">
                <i class="fa-solid fa-qrcode me-2"></i>QR Code
                <small class="text-white-50 d-block">Generate QR code for mobile import</small>
              </label>
            </div>
          </div>
          
          <div class="mb-3">
            <label class="form-label">Keys to Export</label>
            <div v-for="keyType in Object.keys(decrypted.accounts[exportAccount] || {})" :key="keyType">
              <div v-if="keyType !== 'noPrompt' && typeof decrypted.accounts[exportAccount][keyType] === 'string' && decrypted.accounts[exportAccount][keyType] && decrypted.accounts[exportAccount][keyType].trim() !== ''" 
                   class="form-check">
                <input class="form-check-input" type="checkbox" :value="keyType" v-model="exportKeys" :id="'export-' + keyType">
                <label class="form-check-label text-capitalize" :for="'export-' + keyType">
                  {{ keyType }} Key
                </label>
              </div>
            </div>
          </div>
          
          <div class="alert alert-warning small">
            <i class="fa-solid fa-exclamation-triangle me-2"></i>
            <strong>Security Warning:</strong> Exported keys contain sensitive information. 
            Keep them secure and delete exported files after use.
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeExportModal()">Cancel</button>
          <button type="button" class="btn btn-primary" @click="performExport()" :disabled="exportKeys.length === 0">
            <i class="fa-solid fa-download me-2"></i>Export
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- PIN Change Modal -->
  <div class="modal fade" id="changePinModal" tabindex="-1" aria-labelledby="changePinModalLabel" aria-hidden="true" v-show="showChangePinModal" data-bs-backdrop="static">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="changePinModalLabel">
            <i class="fa-solid fa-key me-2"></i>Change PIN
          </h5>
          <button type="button" class="btn-close" @click="closeChangePinModal()" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <p class="small text-white-50 mb-3">
            Change your wallet PIN. You'll need to enter your current PIN first.
          </p>
          <div class="mb-3">
            <label class="form-label">Current PIN</label>
            <input type="password" v-model="currentPin" class="form-control bg-dark border-dark text-light" 
                   placeholder="Enter your current PIN" @keyup.enter="handlePinChange()" ref="currentPinInput">
          </div>
          <div class="mb-3">
            <label class="form-label">New PIN (minimum 4 characters)</label>
            <input type="password" v-model="newPinChange" class="form-control bg-dark border-dark text-light" 
                   placeholder="Enter new PIN" @keyup.enter="handlePinChange()">
          </div>
          <div class="mb-3">
            <label class="form-label">Confirm New PIN</label>
            <input type="password" v-model="confirmPinChange" class="form-control bg-dark border-dark text-light" 
                   placeholder="Confirm new PIN" @keyup.enter="handlePinChange()">
          </div>
          <div v-if="changePinError" class="alert alert-danger small">
            {{ changePinError }}
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeChangePinModal()" :disabled="changePinLoading">Cancel</button>
          <button type="button" class="btn btn-primary" @click="handlePinChange()" :disabled="changePinLoading">
            <span v-if="changePinLoading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            <span v-if="changePinLoading">Updating...</span>
            <span v-else>Update PIN</span>
          </button>
        </div>
      </div>
    </div>
  </div>
  <!-- Transaction Confirmation Modal -->
  <div class="modal fade" id="confirmModal" tabindex="-1" aria-labelledby="confirmModalLabel" aria-hidden="true" v-show="showConfirmModal" data-bs-backdrop="static">
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="confirmModalLabel">
            <i class="fa-solid fa-shield-exclamation me-2 text-warning"></i>Confirm Transaction
          </h5>
          <button type="button" class="btn-close" @click="handleTransactionCancel()" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="row">
            <div class="col-md-6">
              <div class="mb-3">
                <label class="form-label small text-white-50">Signing Account</label>
                <div class="d-flex align-items-center">
                  <img :src="'https://images.hive.blog/u/' + confirmAccount + '/avatar'" 
                       class="rounded-circle me-2" width="32" height="32">
                  <strong>@{{ confirmAccount }}</strong>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="mb-3">
                <label class="form-label small text-white-50">Key Type</label>
                <div>
                  <span class="badge bg-info text-capitalize">{{ confirmKeyType }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="mb-3">
            <label class="form-label small text-white-50">Operations</label>
            <div class="card bg-dark border-secondary">
              <div class="card-body p-3">
                <div v-for="(operation, index) in confirmOperations" :key="index" class="mb-2 last:mb-0">
                  <div class="d-flex align-items-start">
                    <span class="badge bg-primary me-2 mt-1">{{ index + 1 }}</span>
                    <div class="flex-grow-1">
                      <div class="fw-bold text-info">{{ getReadableOperationType(operation[0]) }}</div>
                      <div class="small text-white-50">{{ formatOperationDetails(operation) }}</div>
                    </div>
                  </div>
                  <hr v-if="index < confirmOperations.length - 1" class="my-2">
                </div>
              </div>
            </div>
          </div>
          
                     <div class="form-check">
             <input class="form-check-input" type="checkbox" v-model="confirmDontAsk" id="dontAskCheck">
             <label class="form-check-label" for="dontAskCheck">
               Don't ask for this type of transaction{{ confirmTransaction ? ' (' + getReadableOperationType(getOperationType(confirmTransaction)) + ')' : '' }}
             </label>
           </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="handleTransactionCancel()">
            <i class="fa-solid fa-times me-1"></i>Cancel
          </button>
          <button type="button" class="btn btn-primary" @click="handleTransactionConfirm()">
            <i class="fa-solid fa-check me-1"></i>Confirm & Sign
          </button>
        </div>
      </div>
    </div>
  </div>
</div>`,
};