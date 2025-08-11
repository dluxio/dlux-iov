/**
 * v3-login-modal.js
 * Modular login component extracted from v3-nav.js
 * Provides Hive blockchain authentication via multiple methods:
 * - Hive Keychain
 * - HiveAuth
 * - HiveSigner
 * - dluxPEN (encrypted local storage)
 */

export default {
  name: 'LoginModal',
  emits: ['login', 'logout', 'error'],
  
  props: {
    account: {
      type: String,
      default: ''
    },
    lapi: {
      type: String,
      default: ''
    }
  },
  
  data() {
    return {
      // User management
      user: '',
      userField: '',
      recentUsers: [],
      filterUsers: '',
      filterRecents: [],
      avatar: '/img/user-icon.svg',
      
      // Auth methods
      HKC: false, // Hive Keychain
      HAS: false, // HiveAuth
      HSR: false, // HiveSigner
      PEN: false, // dluxPEN
      
      // HiveAuth specific
      HAS_: {
        token: '',
        expire: 0,
        ws: null,
        wsconn: false,
        uri: '',
        auth_key: '',
        ws_status: '',
        SERVER: 'wss://hive-auth.arcange.eu/'
      },
      haspic: '/img/hiveauth.svg',
      haspich: 50,
      
      // dluxPEN specific
      PIN: '',
      showPinModal: false,
      showKeyModal: false,
      showPenModal: false,
      isCreatingPin: false,
      newPin: '',
      confirmPin: '',
      pinError: '',
      pinLoading: false,
      keyError: '',
      keyLoading: false,
      keyType: '',
      privateKey: '',
      editingAccount: null,
      isUpdatingKey: false,
      penManagementMode: 'overview',
      penDecryptPassword: '',
      penDecryptError: '',
      hasEncryptedWallet: false,
      decrypted: {
        pin: false,
        accounts: {}
      },
      
      // Consent
      consentPrivacy: false,
      consentTerms: false,
      consentError: false,
      
      // Device connection
      deviceConnection: {
        isConnected: false,
        role: null,
        pairCode: null,
        connectedDevice: null
      },
      deviceConnectionTimeout: 30,
      devicePairingLoading: false,
      devicePairingError: '',
      deviceConnectCode: '',
      deviceConnectLoading: false,
      deviceConnectError: ''
    }
  },
  
  computed: {
    signer() {
      if (this.HKC) return 'HKC';
      if (this.HAS) return 'HAS';
      if (this.HSR) return 'HSR';
      if (this.PEN) return 'PEN';
      return '';
    }
  },
  
  mounted() {
    // Check for existing user
    const savedUser = localStorage.getItem('user');
    if (savedUser && savedUser !== 'GUEST') {
      this.user = savedUser;
      this.getAvatar();
    }
    
    // Load recent users
    this.getRecentUsers();
    
    // Check for saved auth method
    const savedSigner = localStorage.getItem('signer');
    if (savedSigner) {
      this[savedSigner] = true;
    } else {
      // Default to Keychain if available
      this.useKC();
    }
    
    // Check for encrypted wallet
    this.checkForEncryptedWallet();
    
    // Setup HiveAuth if selected
    if (this.HAS && this.user) {
      this.HASsetup();
    }
  },
  
  methods: {
    // Auth method selection
    useKC() {
      this.HAS = false;
      this.HKC = true;
      this.HSR = false;
      this.PEN = false;
      localStorage.setItem('signer', 'HKC');
    },
    
    useHAS() {
      this.HAS = true;
      this.HKC = false;
      this.HSR = false;
      this.PEN = false;
      localStorage.setItem('signer', 'HAS');
      if (this.user) this.HASsetup();
    },
    
    useHS() {
      this.HAS = false;
      this.HKC = false;
      this.HSR = true;
      this.PEN = false;
      localStorage.setItem('signer', 'HSR');
    },
    
    async usePEN() {
      this.HAS = false;
      this.HKC = false;
      this.HSR = false;
      this.PEN = true;
      localStorage.setItem('signer', 'PEN');
      
      // Check if we have an encrypted wallet
      const encryptedData = localStorage.getItem('encryptedPEN');
      if (encryptedData) {
        this.hasEncryptedWallet = true;
      }
    },
    
    // User management
    setUser(id) {
      const isAddingNewUser = !id && this.userField;
      
      if (isAddingNewUser && (!this.consentPrivacy || !this.consentTerms)) {
        this.consentError = true;
        return;
      }
      
      this.consentError = false;
      
      // Reset HiveAuth
      this.HAS_.token = '';
      this.haspic = '/img/hiveauth.svg';
      this.haspich = 50;
      
      const oldUser = this.user;
      this.user = id || this.userField || '';
      this.userField = '';
      
      if (!this.user) return;
      
      // Add to recent users
      this.addRecentUser(this.user);
      
      // Save to localStorage
      localStorage.setItem('user', this.user);
      
      // Get avatar
      this.getAvatar();
      
      // Setup auth method
      if (this.HAS) this.HASsetup();
      
      // Emit login event
      this.$emit('login', this.user);
      
      // Close modal
      this.closeModal();
    },
    
    logout() {
      localStorage.removeItem('user');
      sessionStorage.removeItem('penPin');
      sessionStorage.removeItem('pen');
      
      this.PIN = '';
      this.decrypted = {
        pin: false,
        accounts: {}
      };
      
      const oldUser = this.user;
      this.user = '';
      
      // Reset device connection
      this.disconnectDevice();
      
      // Emit logout event
      this.$emit('logout', '');
    },
    
    // Recent users
    addRecentUser(user) {
      if (user && this.recentUsers.indexOf(user) === -1) {
        this.recentUsers.push(user);
        localStorage.setItem('recentUsers', JSON.stringify(this.recentUsers));
      }
    },
    
    getRecentUsers() {
      const stored = localStorage.getItem('recentUsers');
      if (stored) {
        this.recentUsers = JSON.parse(stored);
      }
    },
    
    deleteRecentUser(user) {
      const index = this.recentUsers.indexOf(user);
      if (index > -1) {
        this.recentUsers.splice(index, 1);
        localStorage.setItem('recentUsers', JSON.stringify(this.recentUsers));
      }
    },
    
    searchRecents() {
      if (this.filterUsers) {
        this.filterRecents = this.recentUsers.filter(user => 
          user.toLowerCase().includes(this.filterUsers.toLowerCase())
        );
      } else {
        this.filterRecents = [];
      }
    },
    
    // Avatar
    getAvatar() {
      if (this.user) {
        this.avatar = `https://images.hive.blog/u/${this.user}/avatar`;
      }
    },
    
    // Modal management
    closeModal() {
      const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
      if (modal) {
        modal.hide();
      }
    },
    
    // HiveAuth methods
    HASsetup() {
      if (!('WebSocket' in window)) {
        this.$emit('error', 'WebSocket not supported');
        return;
      }
      
      this.HAS_.ws = new WebSocket(this.HAS_.SERVER);
      
      this.HAS_.ws.onopen = () => {
        this.HAS_.wsconn = true;
        const session = localStorage.getItem(this.user + 'HAS');
        const now = new Date().getTime();
        
        if (session && now < session.split(',')[1]) {
          this.HAS_.token = session.split(',')[0];
          this.HAS_.expire = session.split(',')[1];
          this.HAS_.auth_key = session.split(',')[2];
        } else if (session) {
          localStorage.removeItem(this.user + 'HAS');
          this.HASlogin();
        } else {
          this.HASlogin();
        }
      };
      
      this.HAS_.ws.onmessage = (event) => {
        const message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        console.log('HAS message:', message);
        
        switch (message.cmd) {
          case 'auth_wait':
            this.haspic = `https://hive-auth.arcange.eu/qr/${message.uuid}.png`;
            this.haspich = 200;
            this.HAS_.uri = `has://auth_req/${message.uuid}`;
            this.HAS_.ws_status = 'waiting for app';
            break;
            
          case 'auth_ack':
            this.HAS_.ws_status = 'authenticated';
            this.HAS_.token = message.uuid;
            this.HAS_.expire = message.expire;
            const saveStr = `${message.uuid},${message.expire},${message.secret}`;
            localStorage.setItem(this.user + 'HAS', saveStr);
            this.HAS_.auth_key = message.secret;
            break;
            
          case 'auth_nack':
            this.HAS_.ws_status = 'login failed';
            this.HASlogout();
            break;
        }
      };
      
      this.HAS_.ws.onerror = (error) => {
        console.error('HAS WebSocket error:', error);
        this.HAS_.wsconn = false;
      };
      
      this.HAS_.ws.onclose = () => {
        this.HAS_.wsconn = false;
      };
    },
    
    HASlogin() {
      const loginData = {
        cmd: 'auth_req',
        account: this.user,
        app: {
          name: 'dlux.io',
          description: 'DLUX Network',
          icon: 'https://dlux.io/img/dlux-icon.svg'
        }
      };
      
      if (this.HAS_.ws && this.HAS_.ws.readyState === WebSocket.OPEN) {
        this.HAS_.ws.send(JSON.stringify(loginData));
      }
    },
    
    HASlogout() {
      this.HAS_.token = '';
      this.HAS_.expire = '';
      this.user = '';
    },
    
    // dluxPEN methods
    checkForEncryptedWallet() {
      const encryptedData = localStorage.getItem('encryptedPEN');
      this.hasEncryptedWallet = !!encryptedData;
    },
    
    setupNewPin() {
      this.isCreatingPin = true;
      this.showPinModal = true;
      this.$nextTick(() => {
        const modal = new bootstrap.Modal(document.getElementById('pinModal'));
        modal.show();
      });
    },
    
    requestPinForDecryption() {
      this.isCreatingPin = false;
      this.showPinModal = true;
      this.$nextTick(() => {
        const modal = new bootstrap.Modal(document.getElementById('pinModal'));
        modal.show();
      });
    },
    
    handlePinSubmit() {
      if (this.isCreatingPin) {
        if (this.newPin.length < 4) {
          this.pinError = 'PIN must be at least 4 characters';
          return;
        }
        
        if (this.newPin !== this.confirmPin) {
          this.pinError = 'PINs do not match';
          return;
        }
        
        // Create encrypted wallet
        this.createEncryptedWallet(this.newPin);
      } else {
        // Decrypt wallet
        this.decryptWallet(this.PIN);
      }
    },
    
    createEncryptedWallet(pin) {
      this.pinLoading = true;
      
      try {
        // Create empty wallet structure
        const walletData = {
          accounts: {},
          created: new Date().toISOString()
        };
        
        // Encrypt with PIN
        const encrypted = CryptoJS.AES.encrypt(JSON.stringify(walletData), pin).toString();
        localStorage.setItem('encryptedPEN', encrypted);
        
        // Store PIN in session
        sessionStorage.setItem('penPin', pin);
        this.PIN = pin;
        this.hasEncryptedWallet = true;
        
        this.closePinModal();
      } catch (error) {
        this.pinError = 'Failed to create wallet: ' + error.message;
      } finally {
        this.pinLoading = false;
      }
    },
    
    decryptWallet(pin) {
      this.pinLoading = true;
      
      try {
        const encrypted = localStorage.getItem('encryptedPEN');
        if (!encrypted) {
          throw new Error('No wallet found');
        }
        
        const decrypted = CryptoJS.AES.decrypt(encrypted, pin);
        const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);
        
        if (!decryptedStr) {
          throw new Error('Invalid PIN');
        }
        
        const walletData = JSON.parse(decryptedStr);
        this.decrypted = {
          pin: true,
          accounts: walletData.accounts || {}
        };
        
        // Store PIN in session
        sessionStorage.setItem('penPin', pin);
        this.PIN = pin;
        
        this.closePinModal();
      } catch (error) {
        this.pinError = 'Invalid PIN or corrupted wallet';
      } finally {
        this.pinLoading = false;
      }
    },
    
    closePinModal() {
      this.showPinModal = false;
      this.newPin = '';
      this.confirmPin = '';
      this.PIN = '';
      this.pinError = '';
      this.isCreatingPin = false;
      
      const modal = bootstrap.Modal.getInstance(document.getElementById('pinModal'));
      if (modal) {
        modal.hide();
      }
    },
    
    deleteWallet() {
      if (confirm('Are you sure you want to delete your encrypted wallet? This cannot be undone.')) {
        localStorage.removeItem('encryptedPEN');
        sessionStorage.removeItem('penPin');
        this.PIN = '';
        this.decrypted = {
          pin: false,
          accounts: {}
        };
        this.hasEncryptedWallet = false;
        this.closePenModal();
      }
    },
    
    closeWallet() {
      sessionStorage.removeItem('penPin');
      this.PIN = '';
      this.decrypted = {
        pin: false,
        accounts: {}
      };
    },
    
    openPenManagement() {
      if (!this.PIN && !this.decrypted.pin) {
        this.penManagementMode = 'decrypt';
      } else {
        this.penManagementMode = 'manage';
      }
      
      this.showPenModal = true;
      this.$nextTick(() => {
        const modal = new bootstrap.Modal(document.getElementById('penModal'));
        modal.show();
      });
    },
    
    closePenModal() {
      this.showPenModal = false;
      this.penManagementMode = 'overview';
      this.penDecryptPassword = '';
      this.penDecryptError = '';
      
      const modal = bootstrap.Modal.getInstance(document.getElementById('penModal'));
      if (modal) {
        modal.hide();
      }
    },
    
    handlePenDecrypt() {
      this.decryptWallet(this.penDecryptPassword);
      if (this.decrypted.pin) {
        this.penManagementMode = 'manage';
        this.penDecryptPassword = '';
        this.penDecryptError = '';
      } else {
        this.penDecryptError = 'Invalid PIN';
      }
    },
    
    // Device connection methods
    createDevicePairing() {
      this.devicePairingLoading = true;
      this.devicePairingError = '';
      
      // Simulate device pairing - in production this would connect to a pairing service
      setTimeout(() => {
        this.deviceConnection.pairCode = this.generatePairCode();
        this.deviceConnection.role = 'signer';
        this.devicePairingLoading = false;
        
        // Auto-expire after timeout
        setTimeout(() => {
          if (this.deviceConnection.pairCode && !this.deviceConnection.isConnected) {
            this.deviceConnection.pairCode = null;
            this.devicePairingError = 'Pairing code expired';
          }
        }, this.deviceConnectionTimeout * 60 * 1000);
      }, 1000);
    },
    
    connectToDevice() {
      this.deviceConnectLoading = true;
      this.deviceConnectError = '';
      
      // Simulate device connection - in production this would verify the code
      setTimeout(() => {
        if (this.deviceConnectCode.length === 6) {
          this.deviceConnection.isConnected = true;
          this.deviceConnection.role = 'user';
          this.deviceConnection.connectedDevice = {
            username: 'Remote Device'
          };
          this.deviceConnectCode = '';
        } else {
          this.deviceConnectError = 'Invalid code';
        }
        this.deviceConnectLoading = false;
      }, 1000);
    },
    
    disconnectDevice() {
      this.deviceConnection = {
        isConnected: false,
        role: null,
        pairCode: null,
        connectedDevice: null
      };
      this.devicePairingError = '';
      this.deviceConnectError = '';
    },
    
    generatePairCode() {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    }
  },
  
  template: `
  <!-- Login Modal -->
  <div class="modal fade" id="loginModal" tabindex="-1" aria-labelledby="loginModal" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content text-white">
        <div class="modal-header py-2 bg-window-header">
          <h5 class="modal-title hero-subtitle fs-4 text-white-50">User Management</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <!-- Login method selector -->
          <div class="d-flex flex-column mb-1">
            <label class="lead mb-1">Signing Method</label>
            <div class="row mb-1">
              <div class="auth-methods-grid">
                <div class="row g-2">
                  <div class="col-6">
                    <button 
                      class="auth-method-btn" 
                      :class="{'selected': HKC}"
                      @click="useKC()">
                      <img src="/img/keychain.png" class="img-responsive" style="height:50px !important;">
                    </button>
                  </div>
                  <div class="col-6">
                    <button 
                      class="auth-method-btn" 
                      :class="{'selected': HAS}"
                      @click="useHAS()">
                      <img src="/img/hiveauth.svg" class="img-responsive" style="height:50px !important;">
                    </button>
                  </div>
                  <div class="col-6">
                    <button 
                      class="auth-method-btn" 
                      :class="{'selected': HSR}"
                      @click="useHS()">
                      <img src="/img/hivesigner_white.svg" class="img-responsive" style="height:50px !important;">
                    </button>
                  </div>
                  <div class="col-6">
                    <button 
                      class="auth-method-btn" 
                      :class="{'selected': PEN}"
                      @click="usePEN()">
                      <img src="/img/dlux-pen.png" class="img-responsive" style="height:50px !important;">
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Login method description -->
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
              
              <!-- HiveAuth QR Code -->
              <div class="mb-2" v-if="HAS && haspich > 100">
                <div class="bg-white rounded text-center">
                  <a class="no-decoration" :href="HAS_.uri">
                    <img :src="haspic" :height="haspich + 'px'" class="img-responsive p-2 mx-3">
                    <p v-show="haspich > 100" class="text-dark">Tap or scan with PKSA App for {{user}}</p>
                  </a>
                </div>
              </div>
              
              <span v-if="HKC">Hive Keychain requires a Firefox or Chrome extension</span>
              <span v-if="HAS">Hive Auth requires websockets and a PKSA Application</span>
              <span v-if="HSR">Hive Signer generates a link</span>
              <span v-if="PEN">dluxPEN lets you sign transactions with locally stored and encrypted keys</span>
            </div>
          </div>
          
          <!-- Current user -->
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
            
            <!-- Device Connection Section -->
            <div class="bg-darker rounded p-3 mt-3" v-if="user">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <label class="lead mb-0">
                  <i class="fa-solid fa-mobile-screen me-2"></i>Connect a Device
                </label>
                <span v-if="deviceConnection.isConnected" class="badge bg-success">Connected</span>
              </div>
              
              <!-- Connected Status -->
              <div v-if="deviceConnection.isConnected" class="text-center">
                <div class="text-success mb-2">
                  <i class="fa-solid fa-circle-check me-2"></i>{{ deviceConnection.role === 'signer' ? 'Sharing wallet' : 'Using remote wallet' }}
                </div>
                <div v-if="deviceConnection.pairCode" class="mb-2">
                  <div class="display-6 fw-bold text-primary">{{ deviceConnection.pairCode }}</div>
                  <small class="text-white-50">Share this code with other devices</small>
                </div>
                <div v-if="deviceConnection.connectedDevice" class="mb-2">
                  <small class="text-white-50">Connected to: {{ deviceConnection.connectedDevice.username || 'Remote device' }}</small>
                </div>
                <button type="button" class="btn btn-outline-danger btn-sm" @click="disconnectDevice()">
                  <i class="fa-solid fa-unlink me-1"></i>Disconnect
                </button>
              </div>
              
              <!-- Not Connected -->
              <div v-if="!deviceConnection.isConnected">
                <!-- Share Wallet with Timeout Options -->
                <div class="text-center mb-3">
                  <div class="d-flex align-items-center justify-content-center mb-2">
                    <select v-model="deviceConnectionTimeout" class="form-select form-select-sm bg-dark border-dark text-light me-2" style="width: auto;">
                      <option value="5">5 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="360">6 hours</option>
                      <option value="1440">24 hours</option>
                    </select>
                    <button type="button" class="btn btn-primary btn-sm" @click="createDevicePairing()" :disabled="devicePairingLoading">
                      <span v-if="devicePairingLoading" class="spinner-border spinner-border-sm me-2" role="status"></span>
                      <i v-else class="fa-solid fa-share me-1"></i>Share Wallet
                    </button>
                  </div>
                  <small class="text-white-50 d-block">Generate code for other devices</small>
                </div>
                
                <div class="text-center border-top border-secondary pt-3">
                  <div class="row g-2">
                    <div class="col">
                      <input type="text" 
                             v-model="deviceConnectCode" 
                             class="form-control form-control-sm bg-dark border-dark text-light text-center" 
                             placeholder="Enter 6-digit code" 
                             maxlength="6" 
                             style="letter-spacing: 0.2em; font-weight: bold;"
                             @input="deviceConnectCode = deviceConnectCode.replace(/[^A-Z0-9]/gi, '').toUpperCase()">
                    </div>
                    <div class="col-auto">
                      <button type="button" class="btn btn-info btn-sm" @click="connectToDevice()" :disabled="deviceConnectLoading || !deviceConnectCode">
                        <span v-if="deviceConnectLoading" class="spinner-border spinner-border-sm me-1" role="status"></span>
                        <i v-else class="fa-solid fa-link me-1"></i>Connect
                      </button>
                    </div>
                  </div>
                  <small class="text-white-50 d-block mt-1">Connect to remote wallet</small>
                </div>
                
                <!-- Error Messages -->
                <div v-if="devicePairingError" class="alert alert-danger alert-sm mt-2 mb-0 small">
                  {{ devicePairingError }}
                </div>
                <div v-if="deviceConnectError" class="alert alert-danger alert-sm mt-2 mb-0 small">
                  {{ deviceConnectError }}
                </div>
              </div>
            </div>
            
            <a class="mx-auto bg-card btn btn-danger text-dark mt-2 rounded-pill no-decoration" href="/qr">Create A New Hive Account</a>
          </div>
          
          <!-- Add user -->
          <div>
            <label class="lead mb-1">Add user</label>
            <div class="position-relative has-validation">
              <span class="position-absolute top-50 translate-middle-y ps-2 text-light">
                <i class="fa-solid fa-at fa-fw"></i>
              </span>
              <input v-model="userField" autocapitalize="off" placeholder="username" @keyup.enter="setUser()"
                class="px-4 form-control bg-dark border-dark text-info">
              <span v-if="userField" class="position-absolute end-0 top-50 translate-middle-y pe-2">
                <button type="button" @click="setUser()" class="btn btn-sm btn-primary">
                  <i class="fa-solid fa-plus fa-fw"></i>
                </button>
              </span>
            </div>
            
            <!-- Consent Checkboxes -->
            <div class="mt-2 mb-1">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" v-model="consentPrivacy" id="privacyCheck" @change="consentError = false">
                <label class="form-check-label small" :class="{'text-danger': consentError && !consentPrivacy}" for="privacyCheck">
                  I agree to the <a href="/about#privacy" target="_blank" class="text-info no-decoration">Privacy Policy</a>
                </label>
              </div>
              <div class="form-check">
                <input class="form-check-input" type="checkbox" v-model="consentTerms" id="termsCheck" @change="consentError = false">
                <label class="form-check-label small" :class="{'text-danger': consentError && !consentTerms}" for="termsCheck">
                  I agree to the <a href="/about#terms" target="_blank" class="text-info no-decoration">Terms of Service</a>
                </label>
              </div>
            </div>
            <div class="small text-white-50 text-center mt-1 mb-2">
              Usernames are stored locally without verification. You must possess the associated private keys to make transactions.
            </div>
          </div>
          
          <!-- Recent users -->
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
          <div @click="setUser(name)" class="d-flex hover justify-content-between align-items-center py-3 border-light-50 border-top"
            v-if="!filterUsers" v-for="name in recentUsers">
            <div class="flex-fill text-center"><a class="text-info" role="button">@{{name}}</a></div>
            <div class="flex-shrink me-2"><a class="text-danger ms-auto" role="button" @click.stop="deleteRecentUser(name)"
                alt="Remove username"><i class="fa-solid fa-trash-can"></i></a></div>
          </div>
          <div class="d-flex hover justify-content-between align-items-center py-3 border-light-50 border-top"
            v-if="filterUsers" v-for="name in filterRecents">
            <div class="flex-fill text-center"><a class="text-info" role="button"
                @click="setUser(name)">@{{name}}</a></div>
            <div class="flex-shrink me-2"><a class="text-danger ms-auto" role="button"
                @click.stop="deleteRecentUser(name);searchRecents()" alt="Remove username">
                <i class="fa-solid fa-trash-can"></i></a></div>
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
            <div class="border border-dark rounded bg-light-3 py-2 text-dark mb-3">
              <div class="text-center p-2 bg-dark rounded mx-3 mb-3">
                <img src="/img/dlux-pen.png" class="img-fluid">
              </div>
              <ul>
                <li>Create a secure PIN to encrypt your private keys (any password at least 4 characters)</li>
                <li>This PIN will be required each time you want to use dluxPEN to sign transactions</li>
                <li>New accounts you create will have their keys added to dluxPEN automatically</li>
                <li>Keys can be exported from dluxPEN at any time for backup or use with other wallets</li>
              </ul>
            </div>
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
                <button type="button" class="btn btn-danger btn-sm" @click="deleteWallet()">
                  <i class="fa-solid fa-trash me-1"></i>Delete Wallet
                </button>
              </div>
            </div>
            
            <!-- Account list would go here -->
            <div class="text-muted text-center py-3">
              <p>Account management features coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  `
};