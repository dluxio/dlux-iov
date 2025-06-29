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
    
    this.vrSession = null;
    
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

      // Auto-initialize VR room if on a post page
      this.autoInitializeVRRoom();
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

  /**
   * Request VR room authentication signature
   * @param {string} challenge - VR room challenge string
   * @param {string} spaceType - Type of VR space
   * @param {string} spaceId - ID of VR space
   * @returns {Promise<string>} Signed challenge
   */
  async requestVRAuth(challenge, spaceType, spaceId) {
    return new Promise((resolve, reject) => {
      const messageId = this.generateMessageId();
      
      this.pendingMessages.set(messageId, {
        resolve,
        reject,
        timestamp: Date.now(),
        type: 'vr_auth'
      });

      this.sendMessage('requestVRAuth', {
        messageId,
        challenge,
        spaceType,
        spaceId,
        timestamp: Date.now()
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingMessages.has(messageId)) {
          this.pendingMessages.delete(messageId);
          reject(new Error('VR authentication request timeout'));
        }
      }, 30000);
    });
  }

  /**
   * Join VR space with authentication
   * @param {string} spaceType - Type of VR space (post, document, global)
   * @param {string} spaceId - ID of VR space
   * @param {Object} options - Join options
   * @returns {Promise<Object>} Join response with credentials
   */
  async joinVRSpace(spaceType, spaceId, options = {}) {
    try {
      // Get current user
      const user = await this.getCurrentUser();
      if (!user?.account) {
        throw new Error('User authentication required for VR spaces');
      }

      // Generate challenge for signature
      const challenge = `dlux_vr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Request signature for authentication
      let signature = null;
      if (spaceType !== 'global') {
        signature = await this.requestVRAuth(challenge, spaceType, spaceId);
      }

      // Call presence.dlux.io to join space
      const response = await fetch(`https://presence.dlux.io/api/spaces/${spaceType}/${spaceId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': signature ? `Bearer ${signature}:${user.account}` : ''
        },
        body: JSON.stringify({
          subspace: options.subspace || 'main',
          user_account: user.account,
          challenge: signature ? challenge : null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to join VR space');
      }

      const joinData = await response.json();
      
      // Store VR session
      this.vrSession = {
        space: { spaceType, spaceId },
        credentials: joinData.turn_credentials,
        websocket_url: joinData.websocket_url,
        joined_at: Date.now()
      };

      // Dispatch VR join event
      this.dispatchEvent('vr:joined', {
        space: this.vrSession.space,
        credentials: this.vrSession.credentials,
        websocket_url: this.vrSession.websocket_url
      });

      return joinData;

    } catch (error) {
      console.error('Error joining VR space:', error);
      this.dispatchEvent('vr:error', { error: error.message });
      throw error;
    }
  }

  /**
   * Leave current VR space
   */
  async leaveVRSpace() {
    if (this.vrSession) {
      try {
        // Notify presence server (optional - handled by socket disconnect)
        this.dispatchEvent('vr:leaving', { space: this.vrSession.space });
        
        this.vrSession = null;
        
        this.dispatchEvent('vr:left', {});
      } catch (error) {
        console.error('Error leaving VR space:', error);
      }
    }
  }

  /**
   * Get popular VR spaces
   * @param {Object} options - Filter options
   * @returns {Promise<Array>} List of VR spaces
   */
  async getVRSpaces(options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.limit) params.append('limit', options.limit);
      if (options.offset) params.append('offset', options.offset);
      if (options.type) params.append('type', options.type);

      const user = await this.getCurrentUser();
      const headers = {
        'Content-Type': 'application/json'
      };

      // Add auth header if user is logged in
      if (user?.account) {
        headers['Authorization'] = `Bearer :${user.account}`;
      }

      const response = await fetch(`https://presence.dlux.io/api/spaces?${params.toString()}`, {
        headers
      });

      if (!response.ok) {
        throw new Error('Failed to fetch VR spaces');
      }

      const data = await response.json();
      return data.spaces || [];

    } catch (error) {
      console.error('Error fetching VR spaces:', error);
      throw error;
    }
  }

  /**
   * Get VR space details
   * @param {string} spaceType - Type of VR space
   * @param {string} spaceId - ID of VR space
   * @returns {Promise<Object>} Space details
   */
  async getVRSpaceDetails(spaceType, spaceId) {
    try {
      const user = await this.getCurrentUser();
      const headers = {
        'Content-Type': 'application/json'
      };

      if (user?.account) {
        headers['Authorization'] = `Bearer :${user.account}`;
      }

      const response = await fetch(`https://presence.dlux.io/api/spaces/${spaceType}/${spaceId}`, {
        headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get space details');
      }

      return await response.json();

    } catch (error) {
      console.error('Error fetching VR space details:', error);
      throw error;
    }
  }

  /**
   * Check if currently in a VR space
   * @returns {boolean} True if in VR space
   */
  isInVRSpace() {
    return !!this.vrSession;
  }

  /**
   * Get current VR session info
   * @returns {Object|null} VR session or null
   */
  getVRSession() {
    return this.vrSession;
  }

  /**
   * Detect if current page has A-Frame networked scene
   * @returns {Object|null} A-Frame scene info or null
   */
  detectAFrameScene() {
    const aScene = document.querySelector('a-scene');
    if (!aScene) return null;

    // Check for NAF (Networked A-Frame) components
    const nafClient = aScene.getAttribute('networked-scene');
    const nafAdapter = aScene.querySelector('[networked-scene]');
    const hasNAF = nafClient || nafAdapter || aScene.hasAttribute('networked-scene');

    return {
      element: aScene,
      hasNetworking: hasNAF,
      nafConfig: nafClient || {},
      roomName: aScene.getAttribute('room-name'),
      appName: aScene.getAttribute('app-name') || 'dlux-vr'
    };
  }

  /**
   * Initialize VR room for current post
   * Automatically detects A-Frame scenes and provides appropriate integration
   * @param {Object} options - Room initialization options
   * @returns {Promise<Object>} Room session info
   */
  async initializePostVRRoom(options = {}) {
    try {
      // Get current post context
      const currentUrl = window.location.pathname;
      const postMatch = currentUrl.match(/\/@([^\/]+)\/([^\/\?]+)/);
      
      if (!postMatch) {
        throw new Error('Not on a valid post page');
      }

      const [, author, permlink] = postMatch;
      const spaceId = `${author}/${permlink}`;
      const subspace = options.subspace || 'main';

      console.log('[DluxWallet] Initializing VR room for post:', spaceId);

      // Detect A-Frame scene
      const aframeScene = this.detectAFrameScene();
      
      if (aframeScene && aframeScene.hasNetworking) {
        // A-Frame with networking detected - use NAF integration
        return await this.initializeNAFRoom(author, permlink, subspace, aframeScene, options);
      } else if (aframeScene) {
        // A-Frame without networking - add networking capability
        return await this.enhanceAFrameWithNetworking(author, permlink, subspace, aframeScene, options);
      } else {
        // No A-Frame - provide generic room API
        return await this.initializeGenericRoom(author, permlink, subspace, options);
      }

    } catch (error) {
      console.error('[DluxWallet] Error initializing post VR room:', error);
      throw error;
    }
  }

  /**
   * Initialize NAF (Networked A-Frame) room
   * @param {string} author - Post author
   * @param {string} permlink - Post permlink
   * @param {string} subspace - Room subspace
   * @param {Object} aframeScene - A-Frame scene info
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} NAF room session
   */
  async initializeNAFRoom(author, permlink, subspace, aframeScene, options) {
    console.log('[DluxWallet] Initializing NAF room for', `${author}/${permlink}:${subspace}`);

    // Join VR space to get credentials
    const joinData = await this.joinVRSpace('post', `${author}/${permlink}`, { subspace, ...options });

    // Configure NAF with DLUX presence server
    const nafConfig = {
      app: options.appName || aframeScene.appName || 'dlux-vr',
      room: `${author}-${permlink}-${subspace}`,
      websocketUrl: joinData.websocket_url,
      iceServers: joinData.turn_credentials ? [
        { urls: 'stun:presence.dlux.io:3478' },
        {
          urls: 'turn:presence.dlux.io:3478',
          username: joinData.turn_credentials.username,
          credential: joinData.turn_credentials.credential
        }
      ] : [{ urls: 'stun:presence.dlux.io:3478' }]
    };

    // Update A-Frame scene with DLUX networking
    this.configureNAFScene(aframeScene.element, nafConfig);

    // Set up DLUX-specific NAF event handlers
    this.setupNAFEventHandlers(aframeScene.element, author, permlink, subspace);

    // Store room session
    this.vrSession = {
      ...this.vrSession,
      type: 'naf',
      author,
      permlink,
      subspace,
      nafConfig,
      aframeScene: aframeScene.element
    };

    // Dispatch ready event
    this.dispatchEvent('vr:naf_ready', {
      author,
      permlink,
      subspace,
      nafConfig,
      scene: aframeScene.element
    });

    return {
      type: 'naf',
      author,
      permlink,
      subspace,
      nafConfig,
      websocketUrl: joinData.websocket_url,
      credentials: joinData.turn_credentials
    };
  }

  /**
   * Enhance existing A-Frame scene with networking
   * @param {string} author - Post author
   * @param {string} permlink - Post permlink  
   * @param {string} subspace - Room subspace
   * @param {Object} aframeScene - A-Frame scene info
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Enhanced scene session
   */
  async enhanceAFrameWithNetworking(author, permlink, subspace, aframeScene, options) {
    console.log('[DluxWallet] Enhancing A-Frame scene with networking for', `${author}/${permlink}:${subspace}`);

    // Join VR space
    const joinData = await this.joinVRSpace('post', `${author}/${permlink}`, { subspace, ...options });

    // Dynamically add NAF to existing scene
    const nafConfig = {
      app: options.appName || 'dlux-vr',
      room: `${author}-${permlink}-${subspace}`,
      websocketUrl: joinData.websocket_url,
      iceServers: joinData.turn_credentials ? [
        { urls: 'stun:presence.dlux.io:3478' },
        {
          urls: 'turn:presence.dlux.io:3478',
          username: joinData.turn_credentials.username,
          credential: joinData.turn_credentials.credential
        }
      ] : [{ urls: 'stun:presence.dlux.io:3478' }]
    };

    // Add NAF components to scene
    await this.addNAFToScene(aframeScene.element, nafConfig);

    // Set up event handlers
    this.setupNAFEventHandlers(aframeScene.element, author, permlink, subspace);

    this.vrSession = {
      ...this.vrSession,
      type: 'enhanced_aframe',
      author,
      permlink,
      subspace,
      nafConfig,
      aframeScene: aframeScene.element
    };

    this.dispatchEvent('vr:aframe_enhanced', {
      author,
      permlink,
      subspace,
      nafConfig,
      scene: aframeScene.element
    });

    return {
      type: 'enhanced_aframe',
      author,
      permlink,
      subspace,
      nafConfig,
      websocketUrl: joinData.websocket_url,
      credentials: joinData.turn_credentials
    };
  }

  /**
   * Initialize generic room for non-A-Frame applications
   * @param {string} author - Post author
   * @param {string} permlink - Post permlink
   * @param {string} subspace - Room subspace
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Generic room session
   */
  async initializeGenericRoom(author, permlink, subspace, options) {
    console.log('[DluxWallet] Initializing generic room for', `${author}/${permlink}:${subspace}`);

    // Join VR space
    const joinData = await this.joinVRSpace('post', `${author}/${permlink}`, { subspace, ...options });

    // Create generic room API
    const roomAPI = this.createGenericRoomAPI(author, permlink, subspace, joinData);

    // Expose room API globally for user applications
    window.dluxRoom = roomAPI;

    this.vrSession = {
      ...this.vrSession,
      type: 'generic',
      author,
      permlink,
      subspace,
      roomAPI
    };

    this.dispatchEvent('vr:generic_room_ready', {
      author,
      permlink,
      subspace,
      roomAPI,
      websocketUrl: joinData.websocket_url,
      credentials: joinData.turn_credentials
    });

    return {
      type: 'generic',
      author,
      permlink,
      subspace,
      roomAPI,
      websocketUrl: joinData.websocket_url,
      credentials: joinData.turn_credentials
    };
  }

  /**
   * Configure NAF scene with DLUX settings
   * @param {Element} scene - A-Frame scene element
   * @param {Object} nafConfig - NAF configuration
   */
  configureNAFScene(scene, nafConfig) {
    // Set or update networked-scene component
    scene.setAttribute('networked-scene', {
      app: nafConfig.app,
      room: nafConfig.room,
      connectOnLoad: true,
      onConnect: 'onConnect',
      adapter: 'wseasyrtc',
      serverURL: nafConfig.websocketUrl,
      iceServers: JSON.stringify(nafConfig.iceServers)
    });

    // Add default networked assets if not present
    if (!scene.querySelector('a-assets #avatar-template')) {
      this.addDefaultNAFAssets(scene);
    }

    // Set up default player spawn point if not configured
    if (!scene.querySelector('#player')) {
      this.addDefaultPlayer(scene);
    }
  }

  /**
   * Add NAF components to existing A-Frame scene
   * @param {Element} scene - A-Frame scene element
   * @param {Object} nafConfig - NAF configuration
   */
  async addNAFToScene(scene, nafConfig) {
    // Load NAF if not already loaded
    if (!window.NAF) {
      await this.loadNAFScript();
    }

    // Configure the scene
    this.configureNAFScene(scene, nafConfig);

    // Initialize NAF
    scene.addEventListener('loaded', () => {
      if (window.NAF && !window.NAF.connection.isConnected()) {
        window.NAF.schemas.add({
          template: '#avatar-template',
          components: [
            'position',
            'rotation',
            'color'
          ]
        });
      }
    });
  }

  /**
   * Load NAF script dynamically
   * @returns {Promise} Promise that resolves when NAF is loaded
   */
  loadNAFScript() {
    return new Promise((resolve, reject) => {
      if (window.NAF) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/networked-aframe@^0.11.0/dist/networked-aframe.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Add default NAF assets to scene
   * @param {Element} scene - A-Frame scene element
   */
  addDefaultNAFAssets(scene) {
    let assets = scene.querySelector('a-assets');
    if (!assets) {
      assets = document.createElement('a-assets');
      scene.insertBefore(assets, scene.firstChild);
    }

    // Add avatar template
    const avatarTemplate = document.createElement('template');
    avatarTemplate.id = 'avatar-template';
    avatarTemplate.innerHTML = `
      <a-entity class="avatar">
        <a-sphere class="head" color="#5985ff" scale="0.45 0.5 0.38" position="0 1.6 0"></a-sphere>
        <a-cylinder class="body" color="#5985ff" scale="0.25 0.7 0.25" position="0 1 0"></a-cylinder>
        <a-text class="nametag" value="" position="0 2.2 0" align="center" scale="0.8 0.8 0.8"></a-text>
      </a-entity>
    `;
    assets.appendChild(avatarTemplate);
  }

  /**
   * Add default player to scene
   * @param {Element} scene - A-Frame scene element
   */
  addDefaultPlayer(scene) {
    const player = document.createElement('a-entity');
    player.id = 'player';
    player.setAttribute('camera', '');
    player.setAttribute('look-controls', '');
    player.setAttribute('wasd-controls', '');
    player.setAttribute('position', '0 1.6 3');
    player.setAttribute('networked', 'template:#avatar-template;attachTemplateToLocal:false;');
    scene.appendChild(player);
  }

  /**
   * Set up NAF event handlers for DLUX integration
   * @param {Element} scene - A-Frame scene element
   * @param {string} author - Post author
   * @param {string} permlink - Post permlink
   * @param {string} subspace - Room subspace
   */
  setupNAFEventHandlers(scene, author, permlink, subspace) {
    scene.addEventListener('connected', (event) => {
      console.log('[DluxWallet] NAF connected to room:', `${author}/${permlink}:${subspace}`);
      this.dispatchEvent('vr:naf_connected', { author, permlink, subspace });
    });

    scene.addEventListener('disconnected', (event) => {
      console.log('[DluxWallet] NAF disconnected from room:', `${author}/${permlink}:${subspace}`);
      this.dispatchEvent('vr:naf_disconnected', { author, permlink, subspace });
    });

    scene.addEventListener('clientConnected', (event) => {
      console.log('[DluxWallet] Client joined NAF room:', event.detail.clientId);
      this.dispatchEvent('vr:client_joined', { 
        clientId: event.detail.clientId, 
        author, 
        permlink, 
        subspace 
      });
    });

    scene.addEventListener('clientDisconnected', (event) => {
      console.log('[DluxWallet] Client left NAF room:', event.detail.clientId);
      this.dispatchEvent('vr:client_left', { 
        clientId: event.detail.clientId, 
        author, 
        permlink, 
        subspace 
      });
    });
  }

  /**
   * Create generic room API for non-A-Frame applications
   * @param {string} author - Post author
   * @param {string} permlink - Post permlink
   * @param {string} subspace - Room subspace
   * @param {Object} joinData - Join response data
   * @returns {Object} Room API object
   */
  createGenericRoomAPI(author, permlink, subspace, joinData) {
    const socket = new WebSocket(joinData.websocket_url);
    const eventEmitter = new EventTarget();

    const roomAPI = {
      // Room info
      author,
      permlink,
      subspace,
      roomId: `${author}/${permlink}:${subspace}`,

      // Connection
      socket,
      connected: false,
      
      // Event system
      on: (event, callback) => eventEmitter.addEventListener(event, callback),
      off: (event, callback) => eventEmitter.removeEventListener(event, callback),
      emit: (event, data) => eventEmitter.dispatchEvent(new CustomEvent(event, { detail: data })),

      // Messaging
      send: (message) => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ ...message, room: `${author}/${permlink}:${subspace}` }));
        }
      },

      // Sub-room management
      joinSubRoom: async (subRoomName) => {
        return await this.initializePostVRRoom({ 
          subspace: `${subspace}-${subRoomName}`,
          parentRoom: `${author}/${permlink}:${subspace}`
        });
      },

      // WebRTC credentials for peer connections
      getWebRTCCredentials: () => joinData.turn_credentials,

      // Disconnect
      disconnect: () => {
        socket.close();
        this.leaveVRSpace();
      }
    };

    // Set up socket handlers
    socket.onopen = () => {
      roomAPI.connected = true;
      roomAPI.emit('connected', { author, permlink, subspace });
      
      // Join room message
      roomAPI.send({
        type: 'join-space',
        spaceType: 'post',
        spaceId: `${author}/${permlink}`,
        subspace
      });
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        roomAPI.emit('message', message);
        
        // Handle specific message types
        if (message.type) {
          roomAPI.emit(message.type, message);
        }
      } catch (error) {
        console.error('[DluxWallet] Error parsing socket message:', error);
      }
    };

    socket.onclose = () => {
      roomAPI.connected = false;
      roomAPI.emit('disconnected', { author, permlink, subspace });
    };

    socket.onerror = (error) => {
      roomAPI.emit('error', error);
    };

    return roomAPI;
  }

  /**
   * Join a sub-room within current post
   * @param {string} subRoomName - Name of the sub-room
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Sub-room session
   */
  async joinSubRoom(subRoomName, options = {}) {
    if (!this.vrSession || !this.vrSession.author || !this.vrSession.permlink) {
      throw new Error('Must be in a VR room to join sub-room');
    }

    const { author, permlink } = this.vrSession;
    const subspace = `${this.vrSession.subspace || 'main'}-${subRoomName}`;

    return await this.initializePostVRRoom({
      subspace,
      parentRoom: `${author}/${permlink}:${this.vrSession.subspace || 'main'}`,
      ...options
    });
  }

  /**
   * Get available sub-rooms for current post
   * @returns {Promise<Array>} List of sub-rooms
   */
  async getAvailableSubRooms() {
    if (!this.vrSession || !this.vrSession.author || !this.vrSession.permlink) {
      return [];
    }

    const { author, permlink } = this.vrSession;
    
    try {
      const response = await fetch(
        `https://presence.dlux.io/api/spaces/post/${author}/${permlink}/subrooms`
      );
      
      if (response.ok) {
        const data = await response.json();
        return data.subrooms || [];
      }
    } catch (error) {
      console.error('[DluxWallet] Error fetching sub-rooms:', error);
    }
    
    return [];
  }

  /**
   * Request VR presence to be shown in navigation
   * @param {string} source - Identifier for the requesting app
   * @returns {Promise<boolean>} Success status
   */
  async requestVRPresence(source = 'app') {
    try {
      console.log('[DluxWallet] Requesting VR presence display');
      
      const result = await this.sendMessage('vr-show-presence', { source });
      
      // Also dispatch local event
      window.dispatchEvent(new CustomEvent('dlux-wallet-vr-show', {
        detail: { source }
      }));
      
      return result.success;
    } catch (error) {
      console.error('[DluxWallet] Failed to request VR presence:', error);
      return false;
    }
  }

  /**
   * Request VR presence to be hidden in navigation
   * @param {string} source - Identifier for the requesting app
   * @returns {Promise<boolean>} Success status
   */
  async hideVRPresence(source = 'app') {
    try {
      console.log('[DluxWallet] Requesting VR presence hide');
      
      const result = await this.sendMessage('vr-hide-presence', { source });
      
      // Also dispatch local event
      window.dispatchEvent(new CustomEvent('dlux-wallet-vr-hide', {
        detail: { source }
      }));
      
      return result.success;
    } catch (error) {
      console.error('[DluxWallet] Failed to hide VR presence:', error);
      return false;
    }
  }

  /**
   * Check if user has access to a ticketed event
   * @param {string} eventId - Event identifier
   * @param {string} walletAddress - Wallet address that purchased ticket
   * @returns {Promise<Object>} Access verification result
   */
  async verifyEventAccess(eventId, walletAddress) {
    try {
      const response = await fetch(`https://presence.dlux.io/api/events/${eventId}/verify-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          wallet_address: walletAddress,
          timestamp: Date.now()
        })
      });

      if (!response.ok) {
        throw new Error('Access verification failed');
      }

      const result = await response.json();
      return result;

    } catch (error) {
      console.error('[DluxWallet] Event access verification failed:', error);
      throw error;
    }
  }

  /**
   * Purchase event ticket with crypto payment
   * @param {string} eventId - Event identifier  
   * @param {string} paymentMethod - Crypto currency (hive, btc, eth, etc)
   * @param {string} walletAddress - Buyer's wallet address
   * @returns {Promise<Object>} Payment instructions
   */
  async purchaseEventTicket(eventId, paymentMethod, walletAddress) {
    try {
      const user = await this.getCurrentUser();
      
      const response = await fetch('https://presence.dlux.io/api/events/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': user ? `Bearer :${user.account}` : ''
        },
        body: JSON.stringify({
          event_id: eventId,
          payment_method: paymentMethod,
          wallet_address: walletAddress,
          user_account: user?.account
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate payment');
      }

      const paymentData = await response.json();
      
      // Dispatch event for payment instructions
      this.dispatchEvent('event-payment-generated', {
        eventId,
        paymentMethod,
        paymentData
      });

      return paymentData;

    } catch (error) {
      console.error('[DluxWallet] Event ticket purchase failed:', error);
      throw error;
    }
  }

  /**
   * Join event space with ticket verification
   * @param {string} eventId - Event identifier
   * @param {string} walletAddress - Wallet address that purchased ticket  
   * @param {string} signature - Wallet signature for verification
   * @returns {Promise<Object>} Event join data
   */
  async joinEvent(eventId, walletAddress, signature) {
    try {
      // First verify access
      const accessResult = await this.verifyEventAccess(eventId, walletAddress);
      
      if (!accessResult.hasAccess) {
        throw new Error('No valid ticket found for this event');
      }

      // Join the event space
      const joinResponse = await fetch(`https://presence.dlux.io/api/events/${eventId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          wallet_address: walletAddress,
          signature: signature,
          timestamp: Date.now()
        })
      });

      if (!joinResponse.ok) {
        const errorData = await joinResponse.json();
        throw new Error(errorData.error || 'Failed to join event');
      }

      const joinData = await joinResponse.json();
      
      // Store event session
      this.vrSession = {
        ...this.vrSession,
        type: 'event',
        eventId,
        walletAddress,
        credentials: joinData.turn_credentials,
        websocket_url: joinData.websocket_url,
        joined_at: Date.now()
      };

      // Dispatch event join success
      this.dispatchEvent('event-joined', {
        eventId,
        joinData,
        walletAddress
      });

      return joinData;

    } catch (error) {
      console.error('[DluxWallet] Event join failed:', error);
      this.dispatchEvent('event-join-error', { 
        eventId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Get available events from presence server
   * @param {Object} options - Filter options
   * @returns {Promise<Array>} List of events
   */
  async getAvailableEvents(options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.limit) params.append('limit', options.limit);
      if (options.offset) params.append('offset', options.offset);
      if (options.upcoming) params.append('upcoming', 'true');

      const response = await fetch(`https://presence.dlux.io/api/events?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      return data.events || [];

    } catch (error) {
      console.error('[DluxWallet] Error fetching events:', error);
      throw error;
    }
  }

  /**
   * Sign message with non-Hive wallet (for event access)
   * @param {string} message - Message to sign
   * @param {string} walletType - Wallet type (eth, btc, sol, etc)
   * @returns {Promise<string>} Signature
   */
  async signWithWallet(message, walletType = 'eth') {
    try {
      switch (walletType.toLowerCase()) {
        case 'eth':
        case 'ethereum':
          return await this.signWithEthereum(message);
        case 'btc':
        case 'bitcoin':
          return await this.signWithBitcoin(message);
        case 'sol':
        case 'solana':
          return await this.signWithSolana(message);
        default:
          throw new Error(`Unsupported wallet type: ${walletType}`);
      }
    } catch (error) {
      console.error(`[DluxWallet] ${walletType} signing failed:`, error);
      throw error;
    }
  }

  /**
   * Sign message with Ethereum wallet (MetaMask, etc)
   */
  async signWithEthereum(message) {
    if (!window.ethereum) {
      throw new Error('Ethereum wallet not available');
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = accounts[0];
      
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, account],
      });

      return { signature, address: account, type: 'ethereum' };
    } catch (error) {
      throw new Error('Ethereum signing failed: ' + error.message);
    }
  }

  /**
   * Sign message with Bitcoin wallet (to be implemented based on available libraries)
   */
  async signWithBitcoin(message) {
    // TODO: Implement Bitcoin signing based on available Bitcoin wallet libraries
    throw new Error('Bitcoin signing not yet implemented');
  }

  /**
   * Sign message with Solana wallet (Phantom, etc)
   */
  async signWithSolana(message) {
    if (!window.solana || !window.solana.isPhantom) {
      throw new Error('Solana wallet not available');
    }

    try {
      await window.solana.connect();
      const publicKey = window.solana.publicKey.toString();
      
      const encodedMessage = new TextEncoder().encode(message);
      const signedMessage = await window.solana.signMessage(encodedMessage);
      
      return { 
        signature: Array.from(signedMessage.signature), 
        address: publicKey, 
        type: 'solana' 
      };
    } catch (error) {
      throw new Error('Solana signing failed: ' + error.message);
    }
  }

  /**
   * Auto-initialize VR room if on a post page
   * Called automatically when wallet is injected
   */
  async autoInitializeVRRoom() {
    try {
      // Check if we're on a post page
      const currentUrl = window.location.pathname;
      const postMatch = currentUrl.match(/\/@([^\/]+)\/([^\/\?]+)/);
      
      if (!postMatch) return;

      // Show VR presence since this page might have VR content
      await this.requestVRPresence('auto-post-detection');

      // Wait a bit for page content to load
      setTimeout(async () => {
        try {
          const roomSession = await this.initializePostVRRoom();
          console.log('[DluxWallet] Auto-initialized VR room:', roomSession);
        } catch (error) {
          // Silently fail auto-initialization
          console.debug('[DluxWallet] Auto VR room initialization skipped:', error.message);
        }
      }, 2000);

    } catch (error) {
      console.debug('[DluxWallet] Auto VR room initialization failed:', error);
    }
  }

  /**
   * Enhanced VR Presence Functions with Viral Capacity System
   */

  /**
   * Check space capacity with premium multipliers
   */
  async checkSpaceCapacity(spaceType, spaceId, creatorAccount = null) {
    try {
      const response = await fetch(`https://data.dlux.io/api/presence/spaces/${spaceType}/${spaceId}/capacity?creator_account=${creatorAccount || ''}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Capacity check failed: ${response.status}`);
      }

      const data = await response.json();
      return data.space;
    } catch (error) {
      console.error('[DluxWallet] Error checking space capacity:', error);
      return {
        capacity: { total: 5, used: 0, available: 5, premiumBonus: 0 },
        users: { total: 0, premium: 0, regular: 0, guests: 0 },
        viral_metrics: { premium_users_hosting: 0, additional_guest_slots: 0 }
      };
    }
  }

  /**
   * Enhanced VR space joining with waitlist support
   * Handles queuing when spaces are full with priority system
   */
  async joinVRSpaceEnhanced(spaceType, spaceId, options = {}) {
    try {
      const {
        subspace = 'main',
        position = null,
        avatar_data = null,
        voice_enabled = false,
        creator_account = null
      } = options;

      // First check if we can join this space (for guests)
      if (!this.currentUser) {
        const currentSpaces = await this.getCurrentSpaces();
        if (currentSpaces.spaces && currentSpaces.spaces.length > 0) {
          const existingSpace = currentSpaces.spaces[0];
          if (existingSpace.space_type !== spaceType || existingSpace.space_id !== spaceId) {
            throw new Error(`Guests can only be in one space at a time. Please leave ${existingSpace.space_type}/${existingSpace.space_id} first.`);
          }
        }
      }

      // Check current capacity
      const capacityInfo = await this.checkSpaceCapacity(spaceType, spaceId, creator_account);
      
      const response = await fetch('https://data.dlux.io/api/presence/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          socket_id: this.socketId || `web-${Date.now()}-${Math.random()}`,
          user_account: this.currentUser?.name || null,
          space_type: spaceType,
          space_id: spaceId,
          subspace,
          position,
          avatar_data,
          voice_enabled,
          creator_account
        })
      });

      // Handle successful join (200)
      if (response.ok && response.status === 200) {
        const joinData = await response.json();

        // Track successful join for analytics
        await this.trackViralEvent('user_joined_space', spaceType, spaceId, {
          is_premium: joinData.is_premium,
          capacity_info: joinData.capacity,
          viral_impact: joinData.viral_impact
        });

        return {
          success: true,
          joined: true,
          session: joinData.session,
          capacity: joinData.capacity,
          is_premium: joinData.is_premium,
          viral_impact: joinData.viral_impact,
          viral_metrics: capacityInfo.viral_metrics
        };
      }

      // Handle waitlist/queue (202)
      if (response.status === 202) {
        const queueData = await response.json();
        
        // Track queue join for analytics
        await this.trackViralEvent('user_joined_queue', spaceType, spaceId, {
          queue_position: queueData.queue_info.position,
          user_type: queueData.queue_info.user_type,
          estimated_wait: queueData.queue_info.estimated_wait
        });

        return {
          success: false,
          queued: true,
          queue_info: queueData.queue_info,
          capacity: queueData.capacity,
          upgrade_options: queueData.upgrade_options,
          viral_info: queueData.viral_info,
          message: queueData.message
        };
      }

      // Handle space full with upgrade prompts (429)
      if (response.status === 429) {
        const errorData = await response.json();
        
        // Track viral event for subscription growth
        await this.trackViralEvent('space_full_upgrade_prompt', spaceType, spaceId, {
          capacity: errorData.capacity,
          user_is_premium: errorData.is_premium || false,
          upgrade_message: errorData.upgrade_message
        });

        throw new Error(errorData.message || errorData.viral_message || 'Space is full');
      }

      // Handle other errors
      if (!response.ok) {
        throw new Error(`Failed to join space: ${response.status}`);
      }

    } catch (error) {
      console.error('[DluxWallet] Error joining VR space:', error);
      throw error;
    }
  }

  /**
   * Get current spaces for guest limitation enforcement
   */
  async getCurrentSpaces() {
    try {
      const socketId = this.socketId || 'unknown';
      const response = await fetch(`https://data.dlux.io/api/presence/users/${socketId}/spaces`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Failed to get current spaces: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[DluxWallet] Error getting current spaces:', error);
      return { spaces: [], is_guest: false };
    }
  }

  /**
   * Track viral events for subscription growth analytics
   */
  async trackViralEvent(eventType, spaceType = null, spaceId = null, eventData = {}) {
    try {
      const response = await fetch('https://data.dlux.io/api/presence/viral/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: eventType,
          space_type: spaceType,
          space_id: spaceId,
          user_account: this.currentUser?.name || null,
          event_data: eventData
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('[DluxWallet] Viral event tracked:', eventType, result);
        return result;
      }
    } catch (error) {
      console.warn('[DluxWallet] Failed to track viral event:', error);
    }
  }

  /**
   * Get subscription status to determine premium benefits
   */
  async getSubscriptionStatus() {
    try {
      if (!this.currentUser?.name) {
        return { has_active_subscription: false, current_tier: 'free' };
      }

      const response = await fetch(`https://data.dlux.io/api/subscriptions/user/${this.currentUser.name}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        return { has_active_subscription: false, current_tier: 'free' };
      }

      return await response.json();
    } catch (error) {
      console.error('[DluxWallet] Error getting subscription status:', error);
      return { has_active_subscription: false, current_tier: 'free' };
    }
  }

  /**
   * Enhanced space discovery with queue information
   */
  async discoverVRSpaces(options = {}) {
    try {
      const { limit = 20, spaceType = null, includeEvents = true } = options;
      
      let url = `https://presence.dlux.io/api/spaces?limit=${limit}&include_events=${includeEvents}`;
      if (spaceType) {
        url += `&space_type=${spaceType}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Failed to discover spaces: ${response.status}`);
      }

      const data = await response.json();
      
      // Get queue information for each space
      const enhancedSpaces = await Promise.all(
        data.spaces.map(async space => {
          try {
            const queueInfo = await this.getSpaceQueueInfo(space.space_type, space.space_id);
            return {
              ...space,
              viral_score: this.calculateViralScore(space),
              upgrade_opportunity: this.getUpgradeOpportunity(space),
              queue_info: queueInfo.success ? queueInfo.queue_info : null
            };
          } catch (error) {
            return {
              ...space,
              viral_score: this.calculateViralScore(space),
              upgrade_opportunity: this.getUpgradeOpportunity(space),
              queue_info: null
            };
          }
        })
      );

      // Sort by viral score and queue activity
      enhancedSpaces.sort((a, b) => {
        const scoreA = a.viral_score + (a.queue_info?.current_queue?.total_waiting || 0) * 2;
        const scoreB = b.viral_score + (b.queue_info?.current_queue?.total_waiting || 0) * 2;
        return scoreB - scoreA;
      });

      return {
        spaces: enhancedSpaces,
        viral_discovery: data.viral_discovery,
        upgrade_message: this.getUpgradeMessage(data.viral_discovery),
        queue_summary: {
          total_queued_users: enhancedSpaces.reduce((sum, space) => 
            sum + (space.queue_info?.current_queue?.total_waiting || 0), 0),
          spaces_with_queues: enhancedSpaces.filter(space => 
            space.queue_info?.current_queue?.total_waiting > 0).length
        }
      };

    } catch (error) {
      console.error('[DluxWallet] Error discovering VR spaces:', error);
      return { spaces: [], viral_discovery: null, queue_summary: null };
    }
  }

  /**
   * Get upgrade message with queue context
   */
  getUpgradeMessage(viralDiscovery) {
    if (!viralDiscovery) return null;
    
    if (viralDiscovery.premium_boosted_spaces > 0) {
      return `🚀 ${viralDiscovery.premium_boosted_spaces} spaces have Premium users hosting extra guests! Upgrade to Premium to skip all queues and unlock unlimited access.`;
    }
    
    return 'Upgrade to Premium to skip all queues, host more users in your spaces, and unlock unlimited VR access!';
  }

  /**
   * Get queue-aware upgrade opportunity message for space
   */
  getUpgradeOpportunity(space) {
    const hasQueue = space.queue_info?.current_queue?.total_waiting > 0;
    
    if (hasQueue) {
      const queueInfo = space.queue_info.current_queue;
      return `${queueInfo.total_waiting} users waiting! Skip the queue with Premium access.`;
    }
    
    if (space.viral_metrics?.has_premium_users) {
      return `${space.viral_metrics.additional_slots_from_premium} bonus guest slots from Premium users!`;
    }
    
    if (space.capacity?.available < 3) {
      return 'Nearly full! Upgrade to Premium to always join full spaces.';
    }
    
    return null;
  }

  /**
   * Enhanced user type detection for queue priority
   */
  getUserType() {
    if (this.currentUser?.name) {
      return 'hive'; // Authenticated Hive user
    }
    return 'guest'; // Anonymous guest
  }

  /**
   * Get queue priority message based on user type
   */
  getQueuePriorityMessage() {
    const userType = this.getUserType();
    
    if (userType === 'hive') {
      return 'Hive users get 2x priority in queues! You\'ll be processed faster than guests.';
    } else {
      return 'Create a Hive account for 2x faster queue processing! Guests have lower priority.';
    }
  }

  /**
   * Check waitlist status for current user
   */
  async getWaitlistStatus() {
    try {
      const socketId = this.socketId || 'unknown';
      const response = await fetch(`https://data.dlux.io/api/presence/waitlist/${socketId}/status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Failed to get waitlist status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[DluxWallet] Error getting waitlist status:', error);
      return { success: false, waitlist_entries: [] };
    }
  }

  /**
   * Leave waitlist for a specific space or all spaces
   */
  async leaveWaitlist(spaceType = null, spaceId = null) {
    try {
      const socketId = this.socketId || 'unknown';
      const response = await fetch(`https://data.dlux.io/api/presence/waitlist/${socketId}/leave`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          space_type: spaceType,
          space_id: spaceId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to leave waitlist: ${response.status}`);
      }

      const result = await response.json();
      
      // Track leave event
      await this.trackViralEvent('user_left_queue', spaceType, spaceId, {
        removed_entries: result.removed_entries
      });

      return result;
    } catch (error) {
      console.error('[DluxWallet] Error leaving waitlist:', error);
      return { success: false };
    }
  }

  /**
   * Get queue information for a specific space
   */
  async getSpaceQueueInfo(spaceType, spaceId) {
    try {
      const response = await fetch(`https://data.dlux.io/api/presence/spaces/${spaceType}/${spaceId}/queue`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Failed to get queue info: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[DluxWallet] Error getting queue info:', error);
      return { success: false, queue_info: null };
    }
  }

  /**
   * Start polling for queue updates
   */
  startQueuePolling(spaceType, spaceId, callback, intervalMs = 30000) {
    const pollId = `${spaceType}/${spaceId}`;
    
    // Clear existing polling for this space
    if (this.queuePollers && this.queuePollers[pollId]) {
      clearInterval(this.queuePollers[pollId]);
    }

    // Initialize queue pollers storage
    if (!this.queuePollers) {
      this.queuePollers = {};
    }

    // Start polling
    this.queuePollers[pollId] = setInterval(async () => {
      try {
        const waitlistStatus = await this.getWaitlistStatus();
        const queueInfo = await this.getSpaceQueueInfo(spaceType, spaceId);
        
        // Find this space in waitlist
        const myQueueEntry = waitlistStatus.waitlist_entries?.find(
          entry => entry.space_type === spaceType && entry.space_id === spaceId && entry.status === 'waiting'
        );

        if (myQueueEntry) {
          callback({
            type: 'queue_update',
            queue_position: myQueueEntry.queue_position,
            users_ahead: myQueueEntry.users_ahead,
            estimated_wait: myQueueEntry.estimated_wait,
            queue_stats: queueInfo.queue_info
          });
        } else {
          // Not in queue anymore - might have been admitted or expired
          callback({
            type: 'queue_removed',
            reason: 'No longer in queue - check if you can join the space'
          });
          
          // Stop polling
          this.stopQueuePolling(spaceType, spaceId);
        }
        
      } catch (error) {
        console.error('[DluxWallet] Queue polling error:', error);
        callback({
          type: 'queue_error',
          error: error.message
        });
      }
    }, intervalMs);

    console.log(`[DluxWallet] Started queue polling for ${pollId}`);
    return pollId;
  }

  /**
   * Stop polling for queue updates
   */
  stopQueuePolling(spaceType = null, spaceId = null) {
    if (!this.queuePollers) return;

    if (spaceType && spaceId) {
      const pollId = `${spaceType}/${spaceId}`;
      if (this.queuePollers[pollId]) {
        clearInterval(this.queuePollers[pollId]);
        delete this.queuePollers[pollId];
        console.log(`[DluxWallet] Stopped queue polling for ${pollId}`);
      }
    } else {
      // Stop all polling
      Object.keys(this.queuePollers).forEach(pollId => {
        clearInterval(this.queuePollers[pollId]);
      });
      this.queuePollers = {};
      console.log('[DluxWallet] Stopped all queue polling');
    }
  }
}

// Create global instance
window.dluxWallet = new DluxWallet();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DluxWallet;
}

console.log('[DluxWallet] Script loaded. Wallet available at window.dluxWallet');
