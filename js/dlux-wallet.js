/**
 * DLUX Wallet - Subdomain Communication Script
 * Allows subdomains to communicate with main DLUX domains for user authentication and transaction signing
 */

class DluxWallet {
  constructor() {
    this.masterDomains = [
      'www.dlux.io',
      'dlux.io',
      'vue.dlux.io',
      'localhost:5508'
    ];
    this.activeMaster = null;
    this.pendingMessages = new Map();
    this.currentUser = null;
    this.currentPost = null;
    this.ipfsAssets = [];
    this.isLocalhost = window.location.hostname === 'localhost';
    
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
    try {
      console.log('[DluxWallet] Starting initialization');
      
      // Find available master domain
      this.activeMaster = await this.findMasterDomain();
      
      if (!this.activeMaster) {
        throw new Error('No master domain available');
      }
      
      console.log('[DluxWallet] Connected to master domain:', this.activeMaster);

      // Set up message listener
      window.addEventListener('message', this.handleMessage.bind(this));

      // Get current user
      try {
        this.currentUser = await this.getCurrentUser();
        console.log('[DluxWallet] Current user:', this.currentUser);
      } catch (error) {
        console.error('[DluxWallet] Failed to get current user:', error);
        // Don't throw here, allow initialization to continue
      }

      // Dispatch ready event
      this.dispatchEvent('ready', { 
        master: this.activeMaster,
        user: this.currentUser
      });
    } catch (error) {
      console.error('[DluxWallet] Initialization error:', error);
      throw error;
    }
  }

  async findMasterDomain() {
    for (const domain of this.masterDomains) {
      try {
        console.log('[DluxWallet] Checking domain:', domain);
        
        // Use appropriate protocol based on environment
        const protocol = this.isLocalhost ? 'http' : 'https';
        const walletUrl = `${protocol}://${domain}`;
        
        // Try to find existing wallet window
        const existingWindow = window.opener || window.parent;
        if (existingWindow && existingWindow !== window) {
          try {
            // Test communication with existing window
            const testMessage = {
              id: this.generateMessageId(),
              type: 'test-connection',
              source: 'dlux-wallet',
              origin: window.location.origin,
              timestamp: Date.now()
            };
            
            existingWindow.postMessage(testMessage, walletUrl);
            
            // If we get here, the window exists and accepts our origin
            console.log('[DluxWallet] Found existing wallet window');
            return domain;
          } catch (error) {
            console.log('[DluxWallet] Existing window not available:', error);
          }
        }

        // Try to find any window with the target origin
        const windows = window.opener ? [window.opener] : [];
        if (window.parent !== window) {
          windows.push(window.parent);
        }
        
        for (const win of windows) {
          try {
            if (win.location.origin === walletUrl) {
              console.log('[DluxWallet] Found window with matching origin:', walletUrl);
              return domain;
            }
          } catch (error) {
            // Ignore cross-origin errors
            console.log('[DluxWallet] Could not access window origin:', error);
          }
        }
      } catch (error) {
        console.log('[DluxWallet] Domain not available:', domain, error);
      }
    }

    // If we get here, no domain was available
    console.error('[DluxWallet] No available master domains found');
    return null;
  }

  generateMessageId() {
    return `dlux-wallet-${++this.messageId}-${Date.now()}`;
  }

  sendMessage(type, data = {}) {
    return new Promise((resolve, reject) => {
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

      // Clean up old pending messages
      this.cleanupPendingMessages();

      try {
        // Get the parent window that opened this one
        const parentWindow = window.opener;
        if (!parentWindow) {
          console.error('[DluxWallet] No parent window found');
          reject(new Error('No parent window available'));
          return;
        }

        console.log('[DluxWallet] Sending message to parent window:', message);
        parentWindow.postMessage(message, '*');  // Use '*' to allow any origin in development
      } catch (error) {
        console.error('[DluxWallet] Error sending message:', error);
        this.pendingMessages.delete(messageId);
        reject(error);
      }
    });
  }

  handleMessage(event) {
    // Ignore extension bridge messages
    if (event.data && event.data.cmd === '__crx_bridge_verify_listening') {
      return;
    }

    // Validate message structure
    if (!event.data || typeof event.data !== 'object') {
      console.log('[DluxWallet] Ignoring invalid message format:', event.data);
      return;
    }

    // Check if this is a wallet message
    if (!event.data.source || event.data.source !== 'dlux-wallet') {
      console.log('[DluxWallet] Ignoring non-wallet message:', event.data);
      return;
    }

    // Validate required fields
    if (!event.data.id || !event.data.type) {
      console.log('[DluxWallet] Ignoring message with missing required fields:', event.data);
      return;
    }

    console.log('[DluxWallet] Processing wallet message:', event.data);

    // Handle response messages
    if (event.data.type === 'response') {
      const pendingMessage = this.pendingMessages.get(event.data.id);
      if (pendingMessage) {
        this.pendingMessages.delete(event.data.id);
        if (event.data.error) {
          pendingMessage.reject(new Error(event.data.error));
        } else {
          pendingMessage.resolve(event.data.data);
        }
      }
      return;
    }

    // Handle other message types
    switch (event.data.type) {
      case 'get-user':
        this.handleGetUserRequest(event.data, event.source, event.origin);
        break;
      default:
        console.log('[DluxWallet] Unhandled message type:', event.data.type);
    }
  }

  async handleGetUserRequest(message, sourceWindow, sourceOrigin) {
    try {
      const user = await this.getCurrentUser();
      this.sendWalletResponse(message.id, user, null, sourceWindow, sourceOrigin);
    } catch (error) {
      console.error('[DluxWallet] Error handling get-user request:', error);
      this.sendWalletResponse(message.id, null, error.message, sourceWindow, sourceOrigin);
    }
  }

  async handleGetPostRequest(message, sourceWindow, sourceOrigin) {
    try {
      const postData = await this.getPostData(message.data.author, message.data.permlink);
      this.sendWalletResponse(message.id, postData, null, sourceWindow, sourceOrigin);
    } catch (error) {
      console.error('[DluxWallet] Error handling get-post request:', error);
      this.sendWalletResponse(message.id, null, error.message, sourceWindow, sourceOrigin);
    }
  }

  sendWalletResponse(messageId, data, error, targetWindow, targetOrigin) {
    const response = {
      id: messageId,
      type: 'response',
      source: 'dlux-wallet',
      origin: window.location.origin,
      timestamp: Date.now(),
      data,
      error
    };

    console.log('[DluxWallet] Sending response to parent window:', response);
    targetWindow.postMessage(response, '*');  // Use '*' to allow any origin in development
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
      this.createIframe();
      return true;
    }
    return false;
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
    console.log('[DluxWallet] Getting current user');
    try {
      const userData = await this.sendMessage('get-user');
      console.log('[DluxWallet] Received user data:', userData);
      
      if (!userData) {
        console.log('[DluxWallet] No user data received');
        return null;
      }

      this.currentUser = userData.user;
      this.isLoggedIn = userData.isLoggedIn;
      this.signerType = userData.signerType;

      console.log('[DluxWallet] Updated user state:', {
        user: this.currentUser,
        isLoggedIn: this.isLoggedIn,
        signerType: this.signerType
      });

      return userData;
    } catch (error) {
      console.error('[DluxWallet] Error getting current user:', error);
      this.currentUser = null;
      this.isLoggedIn = false;
      this.signerType = null;
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

  /**
   * Get post data from URL and fetch content
   */
  async getPostData(author, permlink) {
    try {
      console.log('[DluxWallet] Fetching post data for', author, permlink);
      const response = await fetch(`https://api.hive.blog`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'condenser_api.get_content',
          params: [author, permlink]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch post data');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message || 'Failed to fetch post data');
      }

      console.log('[DluxWallet] Post data received:', data.result);
      return data.result;
    } catch (error) {
      console.error('[DluxWallet] Error fetching post data:', error);
      throw error;
    }
  }

  /**
   * Process post assets from JSON metadata
   */
  processPostAssets(post) {
    if (!post || !post.json_metadata) {
      this.ipfsAssets = [];
      return;
    }

    try {
      const metadata = typeof post.json_metadata === 'string' 
        ? JSON.parse(post.json_metadata)
        : post.json_metadata;

      if (metadata.assets && Array.isArray(metadata.assets)) {
        this.ipfsAssets = metadata.assets.map(asset => ({
          ...asset,
          fullUrl: `/ipfs/${asset.hash}`,
          thumbUrl: `/ipfs/${asset.thumbHash || asset.hash}`,
          rotation: {
            x: parseFloat(asset.rx || 0),
            y: parseFloat(asset.ry || 0),
            z: parseFloat(asset.rz || 0)
          }
        }));
      } else {
        this.ipfsAssets = [];
      }
    } catch (error) {
      console.error('[DluxWallet] Failed to process post assets:', error);
      this.ipfsAssets = [];
    }
  }

  /**
   * Get current post data
   */
  getCurrentPost() {
    return this.currentPost;
  }

  /**
   * Get processed IPFS assets
   */
  getIpfsAssets() {
    return this.ipfsAssets;
  }
}

// Create global instance
window.dluxWallet = new DluxWallet();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DluxWallet;
}

console.log('[DluxWallet] Script loaded. Wallet available at window.dluxWallet');
