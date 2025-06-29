/**
 * DLUX VR Presence Component
 * Manages VR room discovery, authentication, and entry
 * Integrates with dlux-wallet.js for secure signing
 * Now supports event ticketing and conditional display
 */

export default {
  name: 'VRPresence',
  template: `
    <div class="vr-presence" v-if="shouldShowVRPresence">
      <!-- VR Rooms Toggle Button -->
      <div class="nav-item dropdown">
        <button 
          class="btn btn-link nav-link" 
          @click="toggleVRModal"
          :class="{ 'vr-active': hasActiveSession }"
          :title="hasActiveSession ? 'VR Active' : 'Browse VR Spaces'"
        >
          <i class="fas fa-vr-cardboard"></i>
          <span class="d-none d-md-inline ms-1">VR</span>
          <span v-if="totalActiveUsers > 0" class="badge bg-primary ms-1">{{ totalActiveUsers }}</span>
          <span v-if="hasActiveSession" class="position-absolute top-0 start-100 translate-middle p-1 bg-success border border-light rounded-circle">
            <span class="visually-hidden">VR Active</span>
          </span>
        </button>
      </div>

      <!-- VR Space Browser Modal with Enhanced Capacity Info -->
      <div v-if="showVRModal" class="vr-modal-overlay" @click="closeVRModal">
        <div class="vr-modal" @click.stop>
          <div class="vr-modal-header">
            <h3>🥽 VR Spaces</h3>
            <div class="vr-status-indicators">
              <span v-if="userSubscription?.is_premium" class="premium-badge">
                ⭐ Premium - Unlimited Access
              </span>
              <span v-else class="upgrade-hint" @click="showUpgradePrompt">
                Upgrade for unlimited access
              </span>
            </div>
            <button @click="closeVRModal" class="close-btn">&times;</button>
          </div>
          
          <div class="vr-modal-content">
            <!-- Current Space Info -->
            <div v-if="currentVRSpace" class="current-space-info">
              <h4>📍 Current Space</h4>
              <div class="space-card current">
                <div class="space-header">
                  <strong>{{ currentVRSpace.space_type }}/{{ currentVRSpace.space_id }}</strong>
                  <div class="capacity-info">
                    <div class="capacity-bar">
                      <div class="capacity-used" 
                           :style="{width: (currentVRSpace.capacity?.used / currentVRSpace.capacity?.total * 100) + '%'}">
                      </div>
                    </div>
                    <span class="capacity-text">
                      {{ currentVRSpace.capacity?.used || 0 }}/{{ currentVRSpace.capacity?.total || 5 }}
                    </span>
                  </div>
                </div>
                
                <div v-if="currentVRSpace.viral_boost" class="viral-boost-info">
                  <div v-if="currentVRSpace.viral_boost.premium_users_present > 0" class="premium-boost">
                    🚀 {{ currentVRSpace.viral_boost.premium_users_present }} Premium users are hosting 
                    {{ currentVRSpace.viral_boost.bonus_guest_slots }} bonus guest slots!
                  </div>
                  <div v-if="!userSubscription?.is_premium" class="upgrade-opportunity">
                    <button @click="showUpgradePrompt" class="upgrade-btn-small">
                      Upgrade to Premium to unlock unlimited access
                    </button>
                  </div>
                </div>
                
                <button @click="leaveCurrentSpace" class="leave-space-btn">Leave Space</button>
              </div>
            </div>

            <!-- Space Discovery with Viral Information -->
            <div class="space-discovery">
              <h4>🌐 Discover Spaces</h4>
              
              <!-- Viral Discovery Message -->
              <div v-if="spaceDiscovery?.upgrade_message" class="viral-discovery-message">
                {{ spaceDiscovery.upgrade_message }}
              </div>
              
              <div v-if="availableSpaces.length === 0" class="no-spaces">
                <p>No active VR spaces found.</p>
                <button @click="refreshSpaces" class="refresh-btn">🔄 Refresh</button>
              </div>
              
              <div v-else class="spaces-list">
                <div v-for="space in availableSpaces" :key="space.space_type + '/' + space.space_id" 
                     class="space-card"
                     :class="{ 'nearly-full': space.capacity?.available < 3, 'has-premium-boost': space.viral_metrics?.has_premium_users }">
                  
                  <div class="space-header">
                    <div class="space-title">
                      <strong>{{ space.space_type }}/{{ space.space_id }}</strong>
                      <span class="active-users">{{ space.active_users || 0 }} active</span>
                    </div>
                    
                    <div class="capacity-info">
                      <div class="capacity-bar">
                        <div class="capacity-used" 
                             :style="{width: (space.capacity?.used / space.capacity?.total * 100) + '%'}">
                        </div>
                        <div v-if="space.capacity?.premiumBonus > 0" 
                             class="capacity-premium-bonus"
                             :style="{width: (space.capacity.premiumBonus / space.capacity.total * 100) + '%'}">
                        </div>
                      </div>
                      <span class="capacity-text">
                        {{ space.capacity?.used || 0 }}/{{ space.capacity?.total || 5 }}
                        <span v-if="space.capacity?.premiumBonus > 0" class="premium-bonus">
                          (+{{ space.capacity.premiumBonus }} from Premium users)
                        </span>
                      </span>
                    </div>
                  </div>
                  
                  <!-- Viral Features Display -->
                  <div v-if="space.viral_metrics?.has_premium_users" class="viral-features">
                    <div class="premium-hosting">
                      ⭐ {{ space.viral_metrics.additional_slots_from_premium }} bonus guest slots from Premium users!
                    </div>
                  </div>
                  
                  <!-- Upgrade Opportunity -->
                  <div v-if="space.upgrade_opportunity" class="upgrade-opportunity">
                    {{ space.upgrade_opportunity }}
                  </div>
                  
                  <div class="space-actions">
                    <button @click="joinSpace(space.space_type, space.space_id)" 
                            :disabled="!canJoinSpace(space)"
                            class="join-btn">
                      {{ getJoinButtonText(space) }}
                    </button>
                    
                    <button v-if="!userSubscription?.is_premium && space.capacity?.available < 3" 
                            @click="showUpgradePrompt" 
                            class="upgrade-btn-small">
                      Upgrade for guaranteed access
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Subscription Upgrade Modal -->
      <div v-if="showUpgradeModal" class="vr-modal-overlay" @click="closeUpgradeModal">
        <div class="vr-modal upgrade-modal" @click.stop>
          <div class="vr-modal-header">
            <h3>🚀 Upgrade to Premium</h3>
            <button @click="closeUpgradeModal" class="close-btn">&times;</button>
          </div>
          
          <div class="vr-modal-content">
            <div class="upgrade-benefits">
              <h4>Premium VR Benefits:</h4>
              <ul>
                <li>✅ <strong>Skip all queues</strong> - Instant access to any VR space</li>
                <li>✅ <strong>Unlimited VR space access</strong> - Never get blocked by capacity limits</li>
                <li>✅ <strong>Host bonus guest slots</strong> - Provide 5 additional guest slots in any space you join</li>
                <li>✅ <strong>Create premium events</strong> - Host up to 50 attendees in your events</li>
                <li>✅ <strong>Priority support</strong> - Get help when you need it</li>
                <li>✅ <strong>Advanced analytics</strong> - See detailed space and event metrics</li>
              </ul>
            </div>
            
            <div class="viral-impact">
              <h4>🌟 Viral Impact:</h4>
              <p>When you upgrade to Premium, you instantly become a space host - providing 5 additional guest slots to every space you join. This helps grow the community and makes spaces more accessible for everyone!</p>
            </div>
            
            <div class="upgrade-actions">
              <button @click="redirectToSubscription" class="upgrade-btn-primary">
                Upgrade to Premium - $15/month
              </button>
              <button @click="redirectToSubscription" class="upgrade-btn-secondary">
                View All Plans
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Queue Status Modal -->
      <div v-if="showQueueModal && currentQueueEntry" class="vr-modal-overlay" @click="closeQueueModal">
        <div class="vr-modal queue-modal" @click.stop>
          <div class="vr-modal-header">
            <h3>⏳ You're in the Queue</h3>
            <button @click="closeQueueModal" class="close-btn">&times;</button>
          </div>
          
          <div class="vr-modal-content">
            <!-- Queue Position Info -->
            <div class="queue-status-card">
              <div class="queue-position">
                <div class="position-number">
                  #{{ currentQueueEntry.queue_position }}
                </div>
                <div class="position-label">Position in Queue</div>
              </div>
              
              <div class="queue-details">
                <div class="queue-detail-item">
                  <span class="label">Space:</span>
                  <span class="value">{{ currentQueueEntry.space_type }}/{{ currentQueueEntry.space_id }}</span>
                </div>
                
                <div class="queue-detail-item">
                  <span class="label">Users ahead:</span>
                  <span class="value">{{ currentQueueEntry.users_ahead || 0 }}</span>
                </div>
                
                <div class="queue-detail-item">
                  <span class="label">Estimated wait:</span>
                  <span class="value">{{ currentQueueEntry.estimated_wait?.estimated_message || 'Unknown' }}</span>
                </div>
                
                <div class="queue-detail-item">
                  <span class="label">Your status:</span>
                  <span class="value user-type" :class="currentQueueEntry.user_type">
                    {{ currentQueueEntry.user_type === 'hive' ? '⭐ Hive User' : '👤 Guest' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Priority System Info -->
            <div class="priority-info">
              <h4>🎯 Queue Priority System</h4>
              <div class="priority-explanation">
                <div class="priority-tier premium">
                  <div class="tier-icon">🚀</div>
                  <div class="tier-info">
                    <strong>Premium Users</strong>
                    <span>Skip all queues entirely</span>
                  </div>
                </div>
                
                <div class="priority-tier hive" :class="{ active: currentQueueEntry.user_type === 'hive' }">
                  <div class="tier-icon">⭐</div>
                  <div class="tier-info">
                    <strong>Hive Users</strong>
                    <span>2x priority over guests</span>
                  </div>
                </div>
                
                <div class="priority-tier guest" :class="{ active: currentQueueEntry.user_type === 'guest' }">
                  <div class="tier-icon">👤</div>
                  <div class="tier-info">
                    <strong>Guests</strong>
                    <span>Standard queue processing</span>
                  </div>
                </div>
              </div>
              
              <div class="priority-message">
                {{ queuePriorityMessage }}
              </div>
            </div>

            <!-- Queue Actions -->
            <div class="queue-actions">
              <div class="action-group">
                <button @click="showUpgradePrompt" class="upgrade-btn-primary">
                  🚀 Skip Queue with Premium
                </button>
                
                <button v-if="currentQueueEntry.user_type === 'guest'" 
                        @click="redirectToHiveSignup" 
                        class="hive-signup-btn">
                  ⭐ Create Hive Account (2x Priority)
                </button>
              </div>
              
              <div class="secondary-actions">
                <button @click="leaveQueue" class="leave-queue-btn">
                  Leave Queue
                </button>
                
                <button @click="refreshQueueStatus" class="refresh-btn">
                  🔄 Refresh Status
                </button>
              </div>
            </div>

            <!-- Auto-refresh indicator -->
            <div class="auto-refresh-info">
              <span class="refresh-indicator">🔄</span>
              Queue position updates automatically
            </div>
          </div>
        </div>
      </div>

      <!-- Current Queue Status Badge (when in queue) -->
      <div v-if="isInQueue && !showQueueModal" class="queue-status-badge" @click="showQueueModal = true">
        <div class="badge-content">
          <span class="badge-icon">⏳</span>
          <div class="badge-text">
            <span class="badge-title">In Queue</span>
            <span class="badge-position">#{{ currentQueueEntry?.queue_position }}</span>
          </div>
        </div>
      </div>
    </div>
  `,

  props: {
    user: String,
    parentComponent: Object  // Reference to parent v3-nav component
  },

  data() {
    return {
      // Display control
      shouldShowVRPresence: false,
      vrRequestSource: null,
      
      // Modal states
      showVRModal: false,
      showAuthModal: false,
      showTicketModal: false,
      
      // Data
      spaces: [],
      loading: false,
      error: null,
      
      // Filtering
      activeFilter: 'all',
      
      // Authentication
      authSpace: null,
      requiresSignature: false,
      signingInProgress: false,
      authError: null,
      joiningSpace: null,
      
      // Session tracking
      activeSession: null,
      
      // Event ticketing
      selectedEvent: null,
      selectedPaymentMethod: 'hive',
      purchaseInProgress: false,
      purchaseError: null,
      userTickets: [], // Store user's purchased tickets
      
      // Refresh interval
      refreshInterval: null,

      currentVRSpace: null,
      availableSpaces: [],
      spaceDiscovery: null,
      userSubscription: null,
      showUpgradeModal: false,
      guestLimitInfo: null,
      viralAnalytics: null,
      
      // Queue/Waitlist state
      queueStatus: null,
      isInQueue: false,
      currentQueueEntry: null,
      queuePollingId: null,
      showQueueModal: false
    };
  },

  computed: {
    isAuthenticated() {
      return this.user && this.user !== '';
    },

    lobbySpace() {
      return this.spaces.find(space => 
        space.space_type === 'global' && space.space_id === 'lobby'
      );
    },

    eventSpaces() {
      return this.spaces.filter(space => 
        space.is_event || space.requires_ticket || space.event_time
      );
    },

    contentSpaces() {
      return this.spaces.filter(space => 
        space.space_type !== 'global' && !space.is_event && !space.requires_ticket
      );
    },

    displayedEventSpaces() {
      if (this.activeFilter === 'events') {
        return this.eventSpaces;
      } else if (this.activeFilter === 'all') {
        return this.eventSpaces.slice(0, 3); // Show first 3 events in "all" view
      }
      return [];
    },

    displayedContentSpaces() {
      if (this.activeFilter === 'events') {
        return [];
      }
      return this.filteredSpaces;
    },

    filteredSpaces() {
      if (this.activeFilter === 'all') {
        return this.contentSpaces;
      } else if (this.activeFilter === 'events') {
        return this.eventSpaces;
      }
      return this.contentSpaces.filter(space => 
        space.type === this.activeFilter || space.space_type === this.activeFilter
      );
    },

    totalActiveUsers() {
      return this.spaces.reduce((total, space) => total + (space.active_users || 0), 0);
    },

    hasActiveSession() {
      return !!this.currentVRSpace;
    },

    userType() {
      return this.user?.name ? 'hive' : 'guest';
    },

    queuePriorityMessage() {
      if (this.userType === 'hive') {
        return '⭐ Hive users get 2x priority in queues!';
      } else {
        return '🔑 Create a Hive account for 2x faster queue processing!';
      }
    }
  },

  methods: {
    /**
     * Show VR presence when requested by an app
     */
    showVRPresence(source = 'unknown') {
      console.log('[VRPresence] VR presence requested by:', source);
      this.shouldShowVRPresence = true;
      this.vrRequestSource = source;
      
      // Dispatch event to notify parent
      this.$emit('vr-presence-shown', { source });
    },

    /**
     * Hide VR presence when no longer needed
     */
    hideVRPresence(source = 'unknown') {
      console.log('[VRPresence] VR presence hide requested by:', source);
      this.shouldShowVRPresence = false;
      this.vrRequestSource = null;
      
      // Dispatch event to notify parent
      this.$emit('vr-presence-hidden', { source });
    },

    toggleVRModal() {
      if (this.showVRModal) {
        this.closeVRModal();
      } else {
        this.openVRModal();
      }
    },

    async openVRModal() {
      this.showVRModal = true;
      await this.refreshSpaces();
      this.startRefreshInterval();
    },

    closeVRModal() {
      this.showVRModal = false;
      this.stopRefreshInterval();
    },

    async refreshSpaces() {
      this.loading = true;
      this.error = null;

      try {
        const headers = {
          'Content-Type': 'application/json'
        };

        // Add auth header if user is logged in
        if (this.isAuthenticated) {
          headers['Authorization'] = this.getAuthHeader();
        }

        const response = await fetch('https://presence.dlux.io/api/spaces?limit=50&include_events=true', {
          headers
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch spaces: ${response.status}`);
        }

        const data = await response.json();
        this.spaces = data.spaces || [];
        
        // Also load user's tickets if authenticated
        if (this.isAuthenticated) {
          await this.loadUserTickets();
        }
        
      } catch (error) {
        console.error('Error fetching VR spaces:', error);
        this.error = 'Failed to load VR spaces. Please check your connection.';
      } finally {
        this.loading = false;
      }
    },

    async loadUserTickets() {
      try {
        const response = await fetch('https://presence.dlux.io/api/user/tickets', {
          headers: {
            'Authorization': this.getAuthHeader(),
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          this.userTickets = data.tickets || [];
        }
      } catch (error) {
        console.error('Error loading user tickets:', error);
      }
    },

    hasTicketForEvent(eventId) {
      return this.userTickets.some(ticket => 
        ticket.event_id === eventId && ticket.status === 'valid'
      );
    },

    setFilter(filter) {
      this.activeFilter = filter;
    },

    async joinSpace(space) {
      if (!this.isAuthenticated) {
        this.showToast({
          title: 'Authentication Required',
          message: 'Please log in to join VR spaces',
          type: 'warning'
        });
        return;
      }

      // Check if this is a ticketed event
      if (space.requires_ticket && !this.hasTicketForEvent(space.space_id)) {
        this.purchaseEventTicket(space);
        return;
      }

      this.joiningSpace = space.space_id;
      this.authSpace = space;
      this.requiresSignature = space.space_type !== 'global';
      
      if (this.requiresSignature) {
        this.showAuthModal = true;
      } else {
        await this.proceedWithAuth();
      }
    },

    purchaseEventTicket(event) {
      this.selectedEvent = event;
      this.showTicketModal = true;
      this.purchaseError = null;
    },

    closeTicketModal() {
      this.showTicketModal = false;
      this.selectedEvent = null;
      this.purchaseError = null;
      this.purchaseInProgress = false;
    },

    async confirmTicketPurchase() {
      this.purchaseInProgress = true;
      this.purchaseError = null;

      try {
        // Generate payment address and memo
        const paymentData = await this.generateEventPayment(this.selectedEvent, this.selectedPaymentMethod);
        
        // Show payment instructions or redirect to payment
        this.showPaymentInstructions(paymentData);
        
      } catch (error) {
        console.error('Error processing ticket purchase:', error);
        this.purchaseError = error.message;
      } finally {
        this.purchaseInProgress = false;
      }
    },

    async generateEventPayment(event, paymentMethod) {
      const response = await fetch('https://presence.dlux.io/api/events/purchase', {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event_id: event.space_id,
          payment_method: paymentMethod,
          user_account: this.user
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate payment');
      }

      return await response.json();
    },

    showPaymentInstructions(paymentData) {
      // Create payment instructions modal or redirect
      const instructions = `
        Send ${paymentData.amount} ${paymentData.currency} to:
        Address: ${paymentData.address}
        Memo: ${paymentData.memo}
        
        Your ticket will be automatically issued upon payment confirmation.
      `;

      alert(instructions); // TODO: Replace with proper modal
      this.closeTicketModal();
    },

    async proceedWithAuth() {
      this.signingInProgress = true;
      this.authError = null;

      try {
        // Generate challenge for signature
        const challenge = this.generateChallenge();
        let signature = null;
        
        if (this.requiresSignature) {
          // Request signature through parent wallet system
          signature = await this.requestSignature(challenge);
          if (!signature) {
            throw new Error('Signature required for space access');
          }
        }

        // Join the space
        const joinResponse = await fetch(
          `https://presence.dlux.io/api/spaces/${this.authSpace.space_type}/${this.authSpace.space_id}/join`,
          {
            method: 'POST',
            headers: {
              'Authorization': this.getAuthHeader(signature),
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              subspace: 'main',
              user_account: this.user,
              challenge: signature ? challenge : null
            })
          }
        );

        if (!joinResponse.ok) {
          const errorData = await joinResponse.json();
          throw new Error(errorData.error || 'Failed to join space');
        }

        const joinData = await joinResponse.json();
        
        // Store session info
        this.activeSession = {
          space: this.authSpace,
          websocket_url: joinData.websocket_url,
          turn_credentials: joinData.turn_credentials,
          joined_at: Date.now()
        };

        // Open VR interface in new window/tab
        this.openVRInterface(joinData);
        
        this.closeAuthModal();
        this.closeVRModal();
        
        this.showToast({
          title: 'VR Space Joined',
          message: `Successfully joined ${this.authSpace.display_name}`,
          type: 'success'
        });

      } catch (error) {
        console.error('Error joining VR space:', error);
        this.authError = error.message;
      } finally {
        this.signingInProgress = false;
        this.joiningSpace = null;
      }
    },

    async requestSignature(challenge) {
      try {
        // Use parent's signing mechanism
        if (this.parentComponent && this.parentComponent.signChallenge) {
          return await this.parentComponent.signChallenge(challenge, 'posting');
        }
        
        // Fallback to direct wallet communication
        const walletResponse = await this.sendWalletMessage('sign-challenge', {
          challenge,
          keyType: 'posting',
          account: this.user
        });
        
        return walletResponse?.signature;
        
      } catch (error) {
        console.error('Error requesting signature:', error);
        throw new Error('Failed to get signature');
      }
    },

    sendWalletMessage(type, data) {
      return new Promise((resolve, reject) => {
        const messageId = 'vr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Listen for response
        const handleResponse = (event) => {
          if (event.data?.id === messageId) {
            window.removeEventListener('message', handleResponse);
            if (event.data.error) {
              reject(new Error(event.data.error));
            } else {
              resolve(event.data.data);
            }
          }
        };
        
        window.addEventListener('message', handleResponse);
        
        // Send message to parent if available
        if (this.parentComponent && this.parentComponent.sendWalletMessage) {
          this.parentComponent.sendWalletMessage(type, { ...data, messageId });
        } else {
          reject(new Error('Wallet communication not available'));
        }
        
        // Timeout after 30 seconds
        setTimeout(() => {
          window.removeEventListener('message', handleResponse);
          reject(new Error('Signature request timeout'));
        }, 30000);
      });
    },

    generateChallenge() {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substr(2, 9);
      return `dlux_vr_${timestamp}_${random}`;
    },

    getAuthHeader(signature = null) {
      if (signature && this.user) {
        // Create signed authorization header
        return `Bearer ${signature}:${this.user}`;
      } else if (this.user) {
        return `Bearer :${this.user}`;
      }
      return '';
    },

    openVRInterface(joinData) {
      // Prepare VR interface URL with session data
      const vrParams = new URLSearchParams({
        space_type: this.authSpace.space_type,
        space_id: this.authSpace.space_id,
        websocket_url: joinData.websocket_url,
        user_account: this.user || '',
        session_token: btoa(JSON.stringify(joinData))
      });

      const vrUrl = `https://dlux.io/vr?${vrParams.toString()}`;
      
      // Open in new window
      window.open(vrUrl, 'dlux_vr', 'width=1200,height=800,menubar=no,toolbar=no');
    },

    closeAuthModal() {
      this.showAuthModal = false;
      this.authSpace = null;
      this.requiresSignature = false;
      this.signingInProgress = false;
      this.authError = null;
      this.joiningSpace = null;
    },

    getSpaceIcon(space) {
      const iconMap = {
        '360': 'fas fa-globe text-info',
        'aframe': 'fas fa-cube text-primary',
        'vrml': 'fas fa-vr-cardboard text-success',
        'blog': 'fas fa-blog text-warning',
        'art': 'fas fa-palette text-danger',
        'game': 'fas fa-gamepad text-purple',
        'document': 'fas fa-file-alt text-info',
        'event': 'fas fa-ticket-alt text-warning'
      };
      return iconMap[space.type] || 'fas fa-cube text-secondary';
    },

    getPostUrl(space) {
      if (space.space_type === 'post') {
        return `https://dlux.io/@${space.space_id}`;
      }
      return '#';
    },

    truncateText(text, maxLength) {
      if (!text || text.length <= maxLength) return text;
      return text.substring(0, maxLength) + '...';
    },

    formatEventTime(eventTime) {
      if (!eventTime) return '';
      const date = new Date(eventTime);
      return date.toLocaleString();
    },

    showToast(data) {
      // Emit to parent component to show toast
      if (this.parentComponent && this.parentComponent.showToast) {
        this.parentComponent.showToast(data);
      } else {
        // Fallback to console
        console.log(`[VRPresence] ${data.type}: ${data.title} - ${data.message}`);
      }
    },

    startRefreshInterval() {
      this.stopRefreshInterval();
      this.refreshInterval = setInterval(() => {
        this.refreshSpaces();
      }, 30000); // Refresh every 30 seconds
    },

    stopRefreshInterval() {
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval);
        this.refreshInterval = null;
      }
    },

    /**
     * Load user subscription status for premium benefits
     */
    async loadUserSubscription() {
      if (!this.user?.name) return;
      
      try {
        this.userSubscription = await dluxWallet.getSubscriptionStatus();
      } catch (error) {
        console.error('Error loading subscription status:', error);
      }
    },

    /**
     * Load current VR space with enhanced capacity info
     */
    async loadCurrentSpace() {
      try {
        const spacesData = await dluxWallet.getCurrentSpaces();
        if (spacesData.spaces && spacesData.spaces.length > 0) {
          const space = spacesData.spaces[0];
          const capacityInfo = await dluxWallet.checkSpaceCapacity(
            space.space_type, 
            space.space_id, 
            space.creator_account
          );
          
          this.currentVRSpace = {
            ...space,
            capacity: capacityInfo.capacity,
            viral_boost: capacityInfo.viral_metrics
          };
        }
        
        this.guestLimitInfo = spacesData.guest_limit_info;
      } catch (error) {
        console.error('Error loading current space:', error);
      }
    },

    /**
     * Load available spaces with viral capacity information
     */
    async loadAvailableSpaces() {
      try {
        this.spaceDiscovery = await dluxWallet.discoverVRSpaces({
          limit: 20,
          spaceType: null,
          includeEvents: true
        });
        
        this.availableSpaces = this.spaceDiscovery.spaces || [];
      } catch (error) {
        console.error('Error loading available spaces:', error);
        this.availableSpaces = [];
      }
    },

    /**
     * Join a VR space with enhanced capacity checking
     */
    async joinSpace(spaceType, spaceId) {
      try {
        const result = await dluxWallet.joinVRSpaceEnhanced(spaceType, spaceId, {
          creator_account: this.getSpaceCreator(spaceType, spaceId)
        });
        
        if (result.success && result.joined) {
          // Successfully joined
          this.currentVRSpace = {
            space_type: spaceType,
            space_id: spaceId,
            capacity: result.capacity,
            viral_boost: result.viral_metrics
          };
          
          if (result.viral_impact) {
            this.showToast({
              title: 'VR Space Joined',
              message: result.viral_impact,
              type: 'success'
            });
          }
          
          this.closeVRModal();
          await this.loadAvailableSpaces();
          
        } else if (result.queued) {
          // Added to queue
          this.isInQueue = true;
          this.currentQueueEntry = {
            space_type: spaceType,
            space_id: spaceId,
            ...result.queue_info
          };
          
          // Start polling for queue updates
          this.startQueuePolling();
          
          // Show queue modal
          this.showQueueModal = true;
          
          // Track queue join
          dluxWallet.trackViralEvent('user_shown_queue_modal', spaceType, spaceId, {
            queue_position: result.queue_info.position,
            user_type: result.queue_info.user_type
          });
        }
        
      } catch (error) {
        let errorMessage = error.message;
        
        // Handle space full errors with upgrade prompts
        if (error.message.includes('Space is full') || error.message.includes('capacity')) {
          errorMessage = error.message;
          if (!this.userSubscription?.is_premium) {
            setTimeout(() => this.showUpgradePrompt(), 1000);
          }
        }
        
        this.showToast({
          title: 'Failed to Join Space',
          message: errorMessage,
          type: 'error'
        });
      }
    },

    /**
     * Check if user can join a space
     */
    canJoinSpace(space) {
      // Premium users can always join
      if (this.userSubscription?.is_premium) {
        return true;
      }
      
      // Can join if space has capacity OR if there's a queue system
      return space.capacity?.available > 0 || space.queue_info;
    },

    /**
     * Get appropriate join button text
     */
    getJoinButtonText(space) {
      if (this.userSubscription?.is_premium) {
        return '🥽 Join (Premium Access)';
      }
      
      const hasQueue = space.queue_info?.current_queue?.total_waiting > 0;
      
      if (space.capacity?.available > 0) {
        return hasQueue ? '🥽 Join (Queue Active)' : '🥽 Join Space';
      }
      
      if (hasQueue) {
        return `⏳ Join Queue (${space.queue_info.current_queue.total_waiting} waiting)`;
      }
      
      return '❌ Space Full';
    },

    /**
     * Get space creator for capacity calculation
     */
    getSpaceCreator(spaceType, spaceId) {
      const space = this.availableSpaces.find(s => 
        s.space_type === spaceType && s.space_id === spaceId
      );
      return space?.creator || null;
    },

    /**
     * Show subscription upgrade prompt
     */
    showUpgradePrompt() {
      this.showUpgradeModal = true;
      this.showQueueModal = false; // Close queue modal when showing upgrade
      
      // Track conversion opportunity
      dluxWallet.trackViralEvent('upgrade_prompt_shown', null, null, {
        context: 'queue_skip',
        user_type: this.userType
      });
    },

    /**
     * Close upgrade modal
     */
    closeUpgradeModal() {
      this.showUpgradeModal = false;
    },

    /**
     * Redirect to subscription page
     */
    redirectToSubscription() {
      // Track conversion attempt
      dluxWallet.trackViralEvent('subscription_redirect', null, null, {
        source: 'vr_presence_upgrade_modal'
      });
      
      window.open('/dao', '_blank');
      this.closeUpgradeModal();
    },

    /**
     * Leave current VR space
     */
    async leaveCurrentSpace() {
      try {
        // Implementation would depend on how spaces are managed
        // For now, just clear the current space
        this.currentVRSpace = null;
        
        this.showToast({
          title: 'Left VR Space',
          message: 'You have left the VR space',
          type: 'info'
        });
        
        await this.loadAvailableSpaces();
      } catch (error) {
        console.error('Error leaving space:', error);
      }
    },

    /**
     * Refresh available spaces
     */
    async refreshSpaces() {
      await this.loadAvailableSpaces();
      
      this.showToast({
        title: 'Spaces Refreshed',
        message: 'VR spaces list updated',
        type: 'info'
      });
    },

    /**
     * Load current queue status
     */
    async loadQueueStatus() {
      try {
        this.queueStatus = await dluxWallet.getWaitlistStatus();
        this.isInQueue = this.queueStatus.waitlist_entries?.length > 0;
        
        if (this.isInQueue) {
          this.currentQueueEntry = this.queueStatus.waitlist_entries[0]; // Most recent queue entry
          
          // Start polling for queue updates
          this.startQueuePolling();
        }
      } catch (error) {
        console.error('Error loading queue status:', error);
      }
    },

    /**
     * Start polling for queue position updates
     */
    startQueuePolling() {
      if (!this.currentQueueEntry || this.queuePollingId) return;
      
      const { space_type, space_id } = this.currentQueueEntry;
      
      this.queuePollingId = dluxWallet.startQueuePolling(
        space_type, 
        space_id, 
        this.handleQueueUpdate, 
        15000 // Poll every 15 seconds
      );
    },

    /**
     * Handle queue position updates
     */
    handleQueueUpdate(update) {
      console.log('[VRPresence] Queue update:', update);
      
      switch (update.type) {
        case 'queue_update':
          if (this.currentQueueEntry) {
            this.currentQueueEntry.queue_position = update.queue_position;
            this.currentQueueEntry.users_ahead = update.users_ahead;
            this.currentQueueEntry.estimated_wait = update.estimated_wait;
            
            // Show notification if position improved significantly
            if (update.queue_position <= 3) {
              this.showToast({
                title: 'Queue Update',
                message: `You're now #${update.queue_position} in line! Space should be available soon.`,
                type: 'info'
              });
            }
          }
          break;
          
        case 'queue_removed':
          this.showToast({
            title: 'Queue Status',
            message: 'You may now be able to join the space! Try joining again.',
            type: 'success'
          });
          
          // Clear queue state
          this.isInQueue = false;
          this.currentQueueEntry = null;
          this.queuePollingId = null;
          
          // Refresh available spaces
          this.loadAvailableSpaces();
          break;
          
        case 'queue_error':
          console.error('Queue polling error:', update.error);
          break;
      }
    },

    /**
     * Leave waitlist for current queue entry
     */
    async leaveQueue() {
      try {
        if (!this.currentQueueEntry) return;
        
        const result = await dluxWallet.leaveWaitlist(
          this.currentQueueEntry.space_type,
          this.currentQueueEntry.space_id
        );
        
        if (result.success) {
          this.isInQueue = false;
          this.currentQueueEntry = null;
          this.showQueueModal = false;
          
          if (this.queuePollingId) {
            dluxWallet.stopQueuePolling();
            this.queuePollingId = null;
          }
          
          this.showToast({
            title: 'Left Queue',
            message: 'You have left the waitlist',
            type: 'info'
          });
        }
      } catch (error) {
        console.error('Error leaving queue:', error);
      }
    },

    /**
     * Close queue modal
     */
    closeQueueModal() {
      this.showQueueModal = false;
    },

    /**
     * Enhanced space discovery loading with queue info
     */
    async loadAvailableSpaces() {
      try {
        this.spaceDiscovery = await dluxWallet.discoverVRSpaces({
          limit: 20,
          spaceType: null,
          includeEvents: true
        });
        
        this.availableSpaces = this.spaceDiscovery.spaces || [];
      } catch (error) {
        console.error('Error loading available spaces:', error);
        this.availableSpaces = [];
      }
    },

    /**
     * Get join button text with queue awareness
     */
    getJoinButtonText(space) {
      if (this.userSubscription?.is_premium) {
        return '🥽 Join (Premium Access)';
      }
      
      const hasQueue = space.queue_info?.current_queue?.total_waiting > 0;
      
      if (space.capacity?.available > 0) {
        return hasQueue ? '🥽 Join (Queue Active)' : '🥽 Join Space';
      }
      
      if (hasQueue) {
        return `⏳ Join Queue (${space.queue_info.current_queue.total_waiting} waiting)`;
      }
      
      return '❌ Space Full';
    },

    /**
     * Check if user can join space (or queue)
     */
    canJoinSpace(space) {
      // Premium users can always join
      if (this.userSubscription?.is_premium) {
        return true;
      }
      
      // Can join if space has capacity OR if there's a queue system
      return space.capacity?.available > 0 || space.queue_info;
    },

    /**
     * Redirect to Hive account signup
     */
    redirectToHiveSignup() {
      // Track Hive signup interest
      dluxWallet.trackViralEvent('hive_signup_interest', null, null, {
        context: 'queue_priority',
        current_user_type: this.userType
      });
      
      // Open Hive signup in new tab
      window.open('https://signup.hive.io/', '_blank');
      
      this.showToast({
        title: 'Hive Account Creation',
        message: 'After creating your Hive account, log in to get 2x queue priority!',
        type: 'info'
      });
    },

    /**
     * Refresh queue status manually
     */
    async refreshQueueStatus() {
      try {
        this.showToast({
          title: 'Refreshing...',
          message: 'Updating queue status',
          type: 'info'
        });
        
        await this.loadQueueStatus();
        
        if (this.currentQueueEntry) {
          this.showToast({
            title: 'Queue Updated',
            message: `You're now #${this.currentQueueEntry.queue_position} in line`,
            type: 'success'
          });
        }
      } catch (error) {
        console.error('Error refreshing queue status:', error);
        this.showToast({
          title: 'Refresh Failed',
          message: 'Could not update queue status',
          type: 'error'
        });
      }
    },
  },

  async mounted() {
    // Listen for VR presence requests from injected apps
    window.addEventListener('dlux-wallet-vr-show', (event) => {
      this.showVRPresence(event.detail?.source || 'app');
    });

    window.addEventListener('dlux-wallet-vr-hide', (event) => {
      this.hideVRPresence(event.detail?.source || 'app');
    });

    // Check for active VR session
    const storedSession = localStorage.getItem('dlux_vr_session');
    if (storedSession) {
      try {
        this.activeSession = JSON.parse(storedSession);
        
        // Validate session (check if still valid)
        const maxAge = 2 * 60 * 60 * 1000; // 2 hours
        if (Date.now() - this.activeSession.joined_at > maxAge) {
          this.activeSession = null;
          localStorage.removeItem('dlux_vr_session');
        }
      } catch (error) {
        console.error('Error loading VR session:', error);
        localStorage.removeItem('dlux_vr_session');
      }
    }

    console.log('[VRPresence] Component mounted');

    if (this.user) {
      await this.loadUserSubscription();
      await this.loadCurrentSpace();
    }
    await this.loadAvailableSpaces();
    await this.loadQueueStatus();
  },

  beforeUnmount() {
    this.stopRefreshInterval();
    
    // Save active session
    if (this.activeSession) {
      localStorage.setItem('dlux_vr_session', JSON.stringify(this.activeSession));
    }

    // Remove event listeners
    window.removeEventListener('dlux-wallet-vr-show', this.showVRPresence);
    window.removeEventListener('dlux-wallet-vr-hide', this.hideVRPresence);
  },

  beforeDestroy() {
    // Clean up queue polling
    if (this.queuePollingId) {
      dluxWallet.stopQueuePolling();
    }
  }
}