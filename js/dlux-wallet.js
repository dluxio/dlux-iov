/**
 * DLUX Wallet - Subdomain Communication Script
 * Allows subdomains to communicate with main DLUX domains for user authentication and transaction signing
 */

class DluxWallet {
  constructor() {
    this.masterDomains = ['vue.dlux.io', 'dlux.io', 'www.dlux.io'];
    this.activeMaster = null;
    this.messageId = 0;
    this.pendingMessages = new Map();
    this.isReady = false;
    this.currentUser = null;
    
    // Device connection properties
    this.deviceConnection = {
      isConnected: false,
      sessionId: null,
      deviceRole: null, // 'signer' or 'requester'
      pairCode: null,
      pollInterval: null
    };
    
    this.init();
  }

  async init() {
    console.log('[DluxWallet] Initializing wallet communication...');
    
    // Listen for messages from parent domains
    window.addEventListener('message', this.handleMessage.bind(this));
    
    // Find available master domain
    await this.findMasterDomain();
    
    if (this.activeMaster) {
      console.log('[DluxWallet] Connected to master domain:', this.activeMaster);
      // Get current user on initialization
      await this.getCurrentUser();
      this.isReady = true;
      this.dispatchEvent('ready', { master: this.activeMaster, user: this.currentUser });
    } else {
      console.log('[DluxWallet] No master domain available, offering user option to open secure window');
      await this.offerSecureWindowOption();
    }
  }

  async findMasterDomain() {
    for (const domain of this.masterDomains) {
      try {
        console.log('[DluxWallet] Checking domain:', domain);
        
        // Try to open a connection to the domain
        const testFrame = document.createElement('iframe');
        testFrame.style.display = 'none';
        testFrame.src = `https://${domain}`;
        
        document.body.appendChild(testFrame);
        
        // Wait for frame to load and test communication
        const available = await new Promise((resolve) => {
          const timeout = setTimeout(() => {
            resolve(false);
          }, 3000);
          
          testFrame.onload = () => {
            clearTimeout(timeout);
            resolve(true);
          };
          
          testFrame.onerror = () => {
            clearTimeout(timeout);
            resolve(false);
          };
        });
        
        document.body.removeChild(testFrame);
        
        if (available) {
          this.activeMaster = domain;
          console.log('[DluxWallet] Found available master:', domain);
          break;
        }
      } catch (error) {
        console.log('[DluxWallet] Domain not available:', domain, error);
      }
    }
  }

  generateMessageId() {
    return `dlux-wallet-${++this.messageId}-${Date.now()}`;
  }

  sendMessage(type, data = {}) {
    return new Promise((resolve, reject) => {
      if (!this.activeMaster) {
        reject(new Error('No master domain available'));
        return;
      }

      const messageId = this.generateMessageId();
      const message = {
        id: messageId,
        type,
        data,
        source: 'dlux-wallet',
        origin: window.location.origin,
        timestamp: Date.now()
      };

      // Store pending message for response handling
      this.pendingMessages.set(messageId, { resolve, reject, timestamp: Date.now() });

      // Clean up old pending messages (timeout after 60 seconds)
      this.cleanupPendingMessages();

      try {
        // Send message to master domain
        const targetOrigin = `https://${this.activeMaster}`;
        console.log('[DluxWallet] Sending message to', targetOrigin, message);
        
        // Use parent window or open new window if needed
        if (window.parent !== window) {
          window.parent.postMessage(message, targetOrigin);
        } else {
          // If not in iframe, try to open connection
          const popup = window.open(`${targetOrigin}?wallet=true`, '_blank', 'width=1,height=1,left=-1000,top=-1000');
          if (popup) {
            setTimeout(() => {
              popup.postMessage(message, targetOrigin);
              popup.close();
            }, 1000);
          } else {
            reject(new Error('Unable to establish communication with master domain'));
          }
        }
      } catch (error) {
        this.pendingMessages.delete(messageId);
        reject(error);
      }
    });
  }

  handleMessage(event) {
    // Validate origin
    const allowedOrigins = this.masterDomains.map(domain => `https://${domain}`);
    if (!allowedOrigins.includes(event.origin)) {
      console.log('[DluxWallet] Ignoring message from unauthorized origin:', event.origin);
      return;
    }

    const message = event.data;
    if (!message || message.source !== 'dlux-nav') {
      return;
    }

    console.log('[DluxWallet] Received message:', message);

    // Handle response to pending message
    if (message.id && this.pendingMessages.has(message.id)) {
      const { resolve, reject } = this.pendingMessages.get(message.id);
      this.pendingMessages.delete(message.id);

      if (message.error) {
        reject(new Error(message.error));
      } else {
        resolve(message.data);
      }
      return;
    }

    // Handle events from master
    if (message.type === 'user-changed') {
      this.currentUser = message.data.user;
      this.dispatchEvent('userChanged', { user: this.currentUser });
    } else if (message.type === 'logout') {
      this.currentUser = null;
      this.dispatchEvent('logout');
    }
  }

  cleanupPendingMessages() {
    const now = Date.now();
    for (const [id, message] of this.pendingMessages.entries()) {
      if (now - message.timestamp > 60000) { // 60 second timeout
        message.reject(new Error('Message timeout'));
        this.pendingMessages.delete(id);
      }
    }
  }

  async offerSecureWindowOption() {
    const userWantsSecureWindow = confirm(
      "Unable to establish secure communication with DLUX wallet.\n\n" +
      "Would you like to open dlux.io in a new window to securely manage your Hive data?\n\n" +
      "This will allow you to:\n" +
      "• Log in to your Hive account\n" +
      "• Sign transactions securely\n" +
      "• Return to this page when ready"
    );

    if (userWantsSecureWindow) {
      const secureWindow = window.open(
        'https://dlux.io?wallet=true&return=' + encodeURIComponent(window.location.href),
        'dlux-secure-wallet',
        'width=1200,height=800,scrollbars=yes,resizable=yes,status=yes,location=yes'
      );

      if (secureWindow) {
        console.log('[DluxWallet] Opened secure wallet window');
        this.dispatchEvent('secure-window-opened', { window: secureWindow });
        
        // Listen for the secure window to close and retry connection
        const checkClosed = setInterval(() => {
          if (secureWindow.closed) {
            clearInterval(checkClosed);
            console.log('[DluxWallet] Secure window closed, retrying connection...');
            this.retryConnection();
          }
        }, 1000);
      } else {
        this.dispatchEvent('error', { 
          message: 'Unable to open secure wallet window. Please check popup blockers and try again.' 
        });
      }
    } else {
      this.dispatchEvent('error', { 
        message: 'User declined to open secure wallet window. Wallet functionality unavailable.' 
      });
    }
  }

  async retryConnection() {
    console.log('[DluxWallet] Retrying master domain connection...');
    this.activeMaster = null;
    await this.findMasterDomain();
    
    if (this.activeMaster) {
      console.log('[DluxWallet] Reconnected to master domain:', this.activeMaster);
      await this.getCurrentUser();
      this.isReady = true;
      this.dispatchEvent('ready', { master: this.activeMaster, user: this.currentUser });
    } else {
      this.dispatchEvent('error', { 
        message: 'Still unable to connect to DLUX master domain after retry.' 
      });
    }
  }

  dispatchEvent(type, data) {
    const event = new CustomEvent(`dlux-wallet-${type}`, { detail: data });
    window.dispatchEvent(event);
  }

  // Public API Methods

  /**
   * Get current logged in user (unrestricted)
   */
  async getCurrentUser() {
    try {
      const result = await this.sendMessage('get-user');
      this.currentUser = result.user;
      return this.currentUser;
    } catch (error) {
      console.error('[DluxWallet] Failed to get current user:', error);
      return null;
    }
  }

  /**
   * Request navigation to a user profile or post (requires user confirmation)
   */
  async requestNavigation(path) {
    if (!path) {
      throw new Error('Navigation path is required');
    }

    // Validate path format (should be /@username or /@username/permlink)
    if (!path.match(/^\/@[a-zA-Z0-9.-]{3,16}(\/[\w-]+)?$/)) {
      throw new Error('Invalid navigation path. Must be /@username or /@username/permlink');
    }

    try {
      const result = await this.sendMessage('request-navigation', { path });
      return result.success;
    } catch (error) {
      console.error('[DluxWallet] Navigation request failed:', error);
      throw error;
    }
  }

  /**
   * Request signing of a Hive transaction (requires user confirmation)
   */
  async signTransaction(transaction) {
    if (!transaction) {
      throw new Error('Transaction data is required');
    }

    // Validate transaction structure
    if (!Array.isArray(transaction) || transaction.length < 2) {
      throw new Error('Invalid transaction format. Expected [username, operations, keyType]');
    }

    try {
      const result = await this.sendMessage('sign-transaction', { transaction });
      return result;
    } catch (error) {
      console.error('[DluxWallet] Transaction signing failed:', error);
      throw error;
    }
  }

  /**
   * Request signing of a challenge/buffer (requires user confirmation)
   */
  async signChallenge(challenge, keyType = 'posting') {
    if (!challenge) {
      throw new Error('Challenge is required');
    }

    if (!this.currentUser) {
      throw new Error('No user logged in');
    }

    try {
      const result = await this.sendMessage('sign-challenge', { 
        challenge, 
        keyType,
        username: this.currentUser 
      });
      return result.signature;
    } catch (error) {
      console.error('[DluxWallet] Challenge signing failed:', error);
      throw error;
    }
  }

  /**
   * Request signing of a transaction without broadcasting (requires user confirmation)
   */
  async signOnly(transaction) {
    if (!transaction) {
      throw new Error('Transaction data is required');
    }

    // Validate transaction structure
    if (!Array.isArray(transaction) || transaction.length < 2) {
      throw new Error('Invalid transaction format. Expected [username, operations, keyType]');
    }

    try {
      const result = await this.sendMessage('sign-only', { transaction });
      return result;
    } catch (error) {
      console.error('[DluxWallet] Sign-only failed:', error);
      throw error;
    }
  }

  /**
   * Request device pairing code (signing device only)
   */
  async requestDevicePairing() {
    if (!this.currentUser) {
      throw new Error('No user logged in');
    }

    try {
      const result = await this.sendMessage('request-device-pairing');
      if (result.pairCode) {
        this.deviceConnection.pairCode = result.pairCode;
        this.deviceConnection.sessionId = result.sessionId;
        this.deviceConnection.deviceRole = 'signer';
        this.deviceConnection.isConnected = true;
        
        // Start polling for requests
        this.startRequestPolling();
        
        this.dispatchEvent('device-pairing-created', { 
          pairCode: result.pairCode,
          expiresIn: result.expiresIn || 300 // 5 minutes default
        });
        
        return result.pairCode;
      }
      throw new Error('Failed to create pairing code');
    } catch (error) {
      console.error('[DluxWallet] Device pairing failed:', error);
      throw error;
    }
  }

  /**
   * Connect to device using pairing code (requesting device)
   */
  async connectToDevice(pairCode) {
    if (!pairCode || pairCode.length !== 6) {
      throw new Error('Invalid pairing code. Must be 6 characters.');
    }

    try {
      const result = await this.sendMessage('connect-to-device', { pairCode });
      if (result.success) {
        this.deviceConnection.sessionId = result.sessionId;
        this.deviceConnection.deviceRole = 'requester';
        this.deviceConnection.isConnected = true;
        
        this.dispatchEvent('device-connected', { 
          sessionId: result.sessionId,
          signerInfo: result.signerInfo
        });
        
        return true;
      }
      throw new Error(result.error || 'Failed to connect to device');
    } catch (error) {
      console.error('[DluxWallet] Device connection failed:', error);
      throw error;
    }
  }

  /**
   * Disconnect from paired device
   */
  async disconnectDevice() {
    if (!this.deviceConnection.isConnected) {
      return;
    }

    try {
      if (this.deviceConnection.sessionId) {
        await this.sendMessage('disconnect-device', { 
          sessionId: this.deviceConnection.sessionId 
        });
      }
    } catch (error) {
      console.log('[DluxWallet] Error during disconnect:', error);
    } finally {
      this.stopRequestPolling();
      this.resetDeviceConnection();
      this.dispatchEvent('device-disconnected');
    }
  }

  /**
   * Send transaction request to paired signer device
   */
  async requestRemoteSign(transaction, options = {}) {
    if (!this.deviceConnection.isConnected || this.deviceConnection.deviceRole !== 'requester') {
      throw new Error('Not connected as requesting device');
    }

    try {
      const result = await this.sendMessage('request-remote-sign', {
        sessionId: this.deviceConnection.sessionId,
        transaction,
        broadcast: options.broadcast !== false, // default true
        timeout: options.timeout || 60000
      });

      return result;
    } catch (error) {
      console.error('[DluxWallet] Remote sign request failed:', error);
      throw error;
    }
  }

  /**
   * Send challenge signing request to paired signer device
   */
  async requestRemoteSignChallenge(challenge, keyType = 'posting', options = {}) {
    if (!this.deviceConnection.isConnected || this.deviceConnection.deviceRole !== 'requester') {
      throw new Error('Not connected as requesting device');
    }

    try {
      const result = await this.sendMessage('request-remote-sign-challenge', {
        sessionId: this.deviceConnection.sessionId,
        challenge,
        keyType,
        timeout: options.timeout || 60000
      });

      return result.signature;
    } catch (error) {
      console.error('[DluxWallet] Remote challenge sign request failed:', error);
      throw error;
    }
  }

  /**
   * Start polling for incoming requests (signer device)
   */
  startRequestPolling() {
    if (this.deviceConnection.pollInterval) {
      return; // Already polling
    }

    this.deviceConnection.pollInterval = setInterval(async () => {
      try {
        await this.pollForRequests();
      } catch (error) {
        console.error('[DluxWallet] Polling error:', error);
      }
    }, 2000); // Poll every 2 seconds
  }

  /**
   * Stop polling for requests
   */
  stopRequestPolling() {
    if (this.deviceConnection.pollInterval) {
      clearInterval(this.deviceConnection.pollInterval);
      this.deviceConnection.pollInterval = null;
    }
  }

  /**
   * Poll for incoming device requests
   */
  async pollForRequests() {
    if (!this.deviceConnection.isConnected || this.deviceConnection.deviceRole !== 'signer') {
      return;
    }

    try {
      const result = await this.sendMessage('poll-device-requests', {
        sessionId: this.deviceConnection.sessionId
      });

      if (result.requests && result.requests.length > 0) {
        for (const request of result.requests) {
          this.handleDeviceRequest(request);
        }
      }
    } catch (error) {
      console.error('[DluxWallet] Polling failed:', error);
    }
  }

  /**
   * Handle incoming device request
   */
  async handleDeviceRequest(request) {
    console.log('[DluxWallet] Handling device request:', request);
    
    this.dispatchEvent('device-request-received', { request });

    // The parent domain (v3-nav) will handle the actual signing
    // and send the response back to the backend
  }

  /**
   * Send response to device request (called by parent domain)
   */
  async sendDeviceResponse(requestId, response, error = null) {
    try {
      await this.sendMessage('respond-to-device-request', {
        sessionId: this.deviceConnection.sessionId,
        requestId,
        response,
        error
      });
    } catch (err) {
      console.error('[DluxWallet] Failed to send device response:', err);
    }
  }

  /**
   * Reset device connection state
   */
  resetDeviceConnection() {
    this.deviceConnection = {
      isConnected: false,
      sessionId: null,
      deviceRole: null,
      pairCode: null,
      pollInterval: null
    };
  }

  /**
   * Get device connection status
   */
  getDeviceStatus() {
    return {
      ...this.deviceConnection,
      isConnected: this.deviceConnection.isConnected,
      role: this.deviceConnection.deviceRole
    };
  }

  /**
   * Check if wallet is ready for use
   */
  isWalletReady() {
    return this.isReady && this.activeMaster !== null;
  }

  /**
   * Get wallet status information
   */
  getStatus() {
    return {
      ready: this.isReady,
      master: this.activeMaster,
      user: this.currentUser,
      pendingMessages: this.pendingMessages.size
    };
  }

  /**
   * Add event listeners for wallet events
   */
  on(event, callback) {
    window.addEventListener(`dlux-wallet-${event}`, (e) => callback(e.detail));
  }

  /**
   * Remove event listeners
   */
  off(event, callback) {
    window.removeEventListener(`dlux-wallet-${event}`, callback);
  }
}

// Create global instance
window.dluxWallet = new DluxWallet();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DluxWallet;
}

console.log('[DluxWallet] Script loaded. Wallet available at window.dluxWallet');
