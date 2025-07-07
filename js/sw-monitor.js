export default {
  data() {
    return {
      // Service Worker states
      swStatus: 'loading', // loading, current, update-available, installing, updated, error
      swVersion: null,
      desiredVersion: '2025.07.07.4',


      // PWA Install states
      installStatus: 'unknown', // unknown, available, installed, not-supported
      deferredPrompt: null,
      isStandalone: false,

      // UI states
      showUpdateNotification: false,
      showInstallPrompt: false,
      updateProgress: 0,
      cacheProgress: 0,

      // Cache statistics
      cacheStats: {
        totalSize: 0,
        resourceCount: 0,
        lastUpdated: null,
        smartCache: {
          version: null,
          transferred: 0,
          downloaded: 0,
          efficiency: 0,
          lastUpdate: null
        }
      },

      // Error states
      errors: [],

      // Banner DOM element
      bannerElement: null
    };
  },

  computed: {
    showIndicator() {
      return this.swStatus !== 'current' || this.installStatus === 'available';
    },

    indicatorClass() {
      const baseClass = 'sw-monitor-indicator';
      switch (this.swStatus) {
        case 'update-available':
          return `${baseClass} update-available`;
        case 'installing':
          return `${baseClass} installing`;
        case 'error':
          return `${baseClass} error`;
        default:
          return baseClass;
      }
    },

    indicatorText() {
      switch (this.swStatus) {
        case 'loading':
          return 'Loading...';
        case 'update-available':
          return 'Update Available';
        case 'installing':
          return 'Installing...';
        case 'updated':
          return 'Ready to Reload';
        case 'error':
          return 'Cache Error';
        default:
          return 'Up to Date';
      }
    },

    installButtonText() {
      switch (this.installStatus) {
        case 'available':
          return 'Install App';
        case 'installed':
          return 'App Installed';
        default:
          return 'Install Not Available';
      }
    }
  },

  methods: {
    async initializeMonitor() {
      console.log('[SW Monitor] Initializing service worker monitor');

      // Check if PWA is already installed
      this.checkStandaloneMode();

      // Check service worker support
      if (!('serviceWorker' in navigator)) {
        this.swStatus = 'error';
        this.errors.push('Service Workers not supported');
        return;
      }

      // Set up service worker monitoring
      await this.setupServiceWorkerMonitoring();

      // Set up PWA install monitoring
      this.setupPWAInstallMonitoring();

      // Get cache statistics
      await this.updateCacheStats();

      // Set up periodic checks
      this.setupPeriodicChecks();

      // Add CSS for banner positioning
      this.addBannerStyles();
    },

    addBannerStyles() {
      // Check if styles already exist
      if (document.getElementById('sw-banner-styles')) return;

      const style = document.createElement('style');
      style.id = 'sw-banner-styles';
      style.textContent = `
        :root {
          --pwa-banner-height: 65px;
          --pwa-banner-height-mobile: 65px;
          --navbar-default-top: 8px;
        }
        
        .pwa-install-banner {
          position: fixed;
          display: flex;
          align-items: center;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1049;
          background: #0d6efd;
          color: white;
          border: none;
          border-radius: 0;
          margin: 0;
          padding: 0.75rem 1rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          animation: slideDownBanner 0.3s ease-out;
          height: var(--pwa-banner-height);
        }
        
        @keyframes slideDownBanner {
          from {
            transform: translateY(-100%);
          }
          to {
            transform: translateY(0);
          }
        }
        
        .pwa-install-banner .btn-light {
          background: rgba(255,255,255,0.9);
          border: none;
          color: #0d6efd;
          font-weight: 600;
        }
        
        .pwa-install-banner .btn-outline-light {
          border-color: rgba(255,255,255,0.5);
          color: white;
        }
        
        .pwa-install-banner .btn-outline-light:hover {
          background: rgba(255,255,255,0.1);
          border-color: white;
        }
        
        /* Clean single approach: adjust navbar top position and app padding */
        body.pwa-banner-active .navbar-floating {
          top: calc(var(--navbar-default-top) + var(--pwa-banner-height)) !important;
          transition: top 0.3s ease-out;
        }
        
        /* Handle all fixed-top elements */
        body.pwa-banner-active .fixed-top {
          top: var(--pwa-banner-height) !important;
          transition: top 0.3s ease-out;
        }
        
        body.pwa-banner-active #app {
          padding-top: var(--pwa-banner-height);
          box-sizing: border-box;
          transition: padding-top 0.3s ease-out;
        }
        
        body.pwa-banner-active #app.vh-100,
        body.pwa-banner-active #app .vh-100 {
          height: calc(100vh - var(--pwa-banner-height));
        }
        
        /* Mobile adjustments - single media query */
        @media (max-width: 768px) {
          .pwa-install-banner {
            height: var(--pwa-banner-height-mobile);
          }
          
          body.pwa-banner-active .navbar-floating {
            top: calc(var(--navbar-default-top) + var(--pwa-banner-height-mobile)) !important;
          }
          
          body.pwa-banner-active .fixed-top {
            top: var(--pwa-banner-height-mobile) !important;
          }
          
          body.pwa-banner-active #app {
            padding-top: var(--pwa-banner-height-mobile);
          }
          
          body.pwa-banner-active #app.vh-100,
          body.pwa-banner-active #app .vh-100 {
            height: calc(100vh - var(--pwa-banner-height-mobile));
          }
        }
      `;
      document.head.appendChild(style);
    },

    toggleBodyPadding(show) {
      if (show) {
        document.body.classList.add('pwa-banner-active');
      } else {
        document.body.classList.remove('pwa-banner-active');
      }
    },

    createBannerElement() {
      if (this.bannerElement) return;

      this.bannerElement = document.createElement('div');
      this.bannerElement.className = 'pwa-install-banner alert alert-primary alert-dismissible m-0';
      this.bannerElement.innerHTML = `
          <div class="d-flex flex-grow-1 align-items-center gap-2">
            <div class="d-flex flex-column align-items-center">
              <i class="ms-1 fa-solid fa-mobile-screen fs-5"></i>
            </div>
            <div class="d-flex flex-grow-1 flex-column align-items-center">
              <div class="w-100 fw-bold mb-0 d-flex"><span class="d-none d-sm-flex me-1">Install</span>DLUX App</div>
              <div class="w-100 text-start small opacity-75 d-none d-sm-flex">Get faster loading and offline access</div>
            </div>
            <div class="d-flex flex-column align-items-center">
              <div class="d-flex gap-2">
                <button class="btn btn-light rounded-pill px-2 btn-sm install-btn">
                 <i class="fa-solid fa-download fa-fw me-1"></i> Install
                </button>
                <button class="btn btn-outline-light rounded-pill px-2 btn-sm not-now-btn">
                  <span class="d-none d-sm-flex">Not Now</span>
                  <i class="fa-solid fa-xmark d-sm-none"></i>
                </button>
              </div>
            </div>
          </div>
      `;

      // Add event listeners
      const installBtn = this.bannerElement.querySelector('.install-btn');
      const notNowBtn = this.bannerElement.querySelector('.not-now-btn');

      installBtn.addEventListener('click', () => this.installPWA());
      notNowBtn.addEventListener('click', () => this.dismissInstallPrompt());
    },

    showBanner() {
      if (!this.bannerElement) {
        this.createBannerElement();
      }

      if (!document.body.contains(this.bannerElement)) {
        document.body.insertBefore(this.bannerElement, document.body.firstChild);
      }

      this.toggleBodyPadding(true);
    },

    hideBanner() {
      if (this.bannerElement && document.body.contains(this.bannerElement)) {
        document.body.removeChild(this.bannerElement);
      }
      this.toggleBodyPadding(false);
    },

    async setupServiceWorkerMonitoring() {
      try {
        // Get current registration
        const registration = await navigator.serviceWorker.getRegistration('/');

        if (registration) {
          this.checkServiceWorkerVersion(registration);

          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              this.swStatus = 'installing';
              this.showUpdateNotification = true;

              newWorker.addEventListener('statechange', () => {
                switch (newWorker.state) {
                  case 'installed':
                    if (navigator.serviceWorker.controller) {
                      this.swStatus = 'updated';
                      this.showUpdateNotification = true;
                    } else {
                      this.swStatus = 'current';
                    }
                    break;
                  case 'activated':
                    this.swStatus = 'current';
                    this.showUpdateNotification = false;
                    this.updateCacheStats();
                    break;
                }
              });
            }
          });
        } else {
          this.swStatus = 'error';
          this.errors.push('No service worker registration found');
        }

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          this.handleServiceWorkerMessage(event);
        });

      } catch (error) {
        console.error('[SW Monitor] Error setting up service worker monitoring:', error);
        this.swStatus = 'error';
        this.errors.push(`SW setup error: ${error.message}`);
      }
    },

    checkServiceWorkerVersion(registration) {
      if (registration.active) {
        const activeSWURL = registration.active.scriptURL;
        const urlParams = new URLSearchParams(activeSWURL.split('?')[1]);
        const activeVersion = urlParams.get('v');

        this.swVersion = activeVersion;

        if (activeVersion === this.desiredVersion) {
          this.swStatus = 'current';
        } else {
          this.swStatus = 'update-available';
          this.showUpdateNotification = true;
        }
      } else if (registration.waiting) {
        this.swStatus = 'updated';
        this.showUpdateNotification = true;
      } else if (registration.installing) {
        this.swStatus = 'installing';
      } else {
        this.swStatus = 'error';
      }
    },

    setupPWAInstallMonitoring() {
      // Check if already installed
      if (this.isStandalone) {
        this.installStatus = 'installed';
        return;
      }

      // Listen for beforeinstallprompt event
      window.addEventListener('beforeinstallprompt', (e) => {
        console.log('[SW Monitor] beforeinstallprompt event fired');
        e.preventDefault();
        this.deferredPrompt = e;
        this.installStatus = 'available';

        // Only show install prompt if user hasn't dismissed it this session
        if (!sessionStorage.getItem('installPromptDismissed')) {
          // Show install prompt after a delay to avoid interrupting user flow
          setTimeout(() => {
            this.showInstallPrompt = true;
            this.showBanner();
          }, 5000);
        }
      });

      // Listen for app installed event
      window.addEventListener('appinstalled', () => {
        console.log('[SW Monitor] PWA was installed');
        this.installStatus = 'installed';
        this.showInstallPrompt = false;
        this.hideBanner();
        this.deferredPrompt = null;
        this.showToast('App installed successfully!', 'success');
      });
    },

    checkStandaloneMode() {
      // Check if running in standalone mode (PWA)
      this.isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone ||
        document.referrer.includes('android-app://');

      if (this.isStandalone) {
        this.installStatus = 'installed';
      }
    },

    handleServiceWorkerMessage(event) {
      const { type, data } = event.data;

      switch (type) {
        case 'SW_UPDATED':
          this.swStatus = 'updated';
          this.showUpdateNotification = true;
          break;
        case 'CACHE_STARTED':
          this.swStatus = 'installing';
          break;
        case 'CACHE_PROGRESS':
          this.cacheProgress = data.progress;
          break;
        case 'CACHE_COMPLETE':
          // Reset status to current when caching is complete
          this.swStatus = 'current';
          this.showUpdateNotification = false;
          this.updateCacheStats();
          this.showToast('App updated successfully!', 'success');
          break;
        case 'SMART_CACHE_COMPLETE':
          this.swStatus = 'current';
          this.showUpdateNotification = false;
          this.updateCacheStats();
          
          // Update smart cache statistics
          if (data && data.stats) {
            this.cacheStats.smartCache.transferred = data.stats.transferred || 0;
            this.cacheStats.smartCache.downloaded = data.stats.downloaded || 0;
            this.cacheStats.smartCache.lastUpdate = new Date().toISOString();
            
            const total = this.cacheStats.smartCache.transferred + this.cacheStats.smartCache.downloaded;
            if (total > 0) {
              this.cacheStats.smartCache.efficiency = Math.round((this.cacheStats.smartCache.transferred / total) * 100);
            }
            
            console.log('[SW Monitor] Smart cache stats updated:', this.cacheStats.smartCache);
            this.showToast(
              `Smart update: ${this.cacheStats.smartCache.transferred} transferred, ${this.cacheStats.smartCache.downloaded} downloaded (${this.cacheStats.smartCache.efficiency}% efficient)`, 
              'success'
            );
          } else {
            this.showToast('Smart cache update completed!', 'success');
          }
          break;
        case 'ERROR':
          this.errors.push(data.message);
          this.swStatus = 'error';
          break;
      }
    },

    async updateCacheStats() {
      try {
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          let totalSize = 0;
          let resourceCount = 0;
          let smartCacheVersion = null;

          for (const name of cacheNames) {
            const cache = await caches.open(name);
            const keys = await cache.keys();
            resourceCount += keys.length;

            // Estimate cache size and check for smart cache info
            for (const request of keys) {
              const response = await cache.match(request);
              if (response) {
                const blob = await response.blob();
                totalSize += blob.size;
                
                // Check for smart cache metadata
                const cacheSize = response.headers.get('x-cache-size');
                if (cacheSize) {
                  // This is a smart cached file, extract version if available
                  if (!smartCacheVersion) {
                    // Try to determine version from service worker
                    try {
                      const registration = await navigator.serviceWorker.getRegistration('/');
                      if (registration && registration.active) {
                        // Version should be available in the service worker
                        smartCacheVersion = 'Active';
                      }
                    } catch (e) {
                      console.warn('Could not determine SW version:', e);
                    }
                  }
                }
              }
            }
          }

          // Preserve existing smart cache stats while updating general stats
          this.cacheStats = {
            ...this.cacheStats,
            totalSize,
            resourceCount,
            lastUpdated: new Date().toISOString()
          };
          
          if (smartCacheVersion) {
            this.cacheStats.smartCache.version = smartCacheVersion;
          }
        }
      } catch (error) {
        console.error('[SW Monitor] Error updating cache stats:', error);
      }
    },

    async installPWA() {
      if (!this.deferredPrompt) {
        this.showToast('Install prompt not available', 'warning');
        return;
      }

      try {
        const { outcome } = await this.deferredPrompt.prompt();
        console.log('[SW Monitor] User response to install prompt:', outcome);

        if (outcome === 'accepted') {
          this.installStatus = 'installing';
        }

        this.deferredPrompt = null;
        this.showInstallPrompt = false;
        this.hideBanner();
      } catch (error) {
        console.error('[SW Monitor] Error installing PWA:', error);
        this.showToast('Install failed', 'error');
      }
    },

    async updateServiceWorker() {
      try {
        const registration = await navigator.serviceWorker.getRegistration('/');

        if (registration) {
          this.swStatus = 'installing';
          this.showUpdateNotification = false;

          if (registration.waiting) {
            // Tell the waiting service worker to skip waiting
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            // Note: SW_UPDATED message will be received, which sets status to 'updated'
            // Then user needs to reload. CACHE_COMPLETE will come after activation.
          } else {
            // Force update check - this will trigger background caching
            await registration.update();
            // Background caching will send CACHE_COMPLETE when done
          }
        }
      } catch (error) {
        console.error('[SW Monitor] Error updating service worker:', error);
        this.swStatus = 'error';
        this.showToast('Update failed', 'error');
      }
    },

    reloadPage() {
      window.location.reload();
    },
    blogLink(url){
        // Fix double question marks that break query parameters
        const cleanUrl = url.replace(/\?\?/g, '?');
        
        if (cleanUrl.includes('@')) {
            return `${location.origin}/blog/${cleanUrl}`
        }
        return cleanUrl
    },
    // Notification helper methods
    getNotificationAvatar(notification) {
      if (notification.type === 'account_request') {
        const username = notification.data.direction === 'received' 
          ? notification.data.requester_username 
          : notification.data.requested_by;
        return `https://images.hive.blog/u/${username}/avatar/small`;
      } else if (notification.type === 'hive_notification' && notification.data.hive_notification) {
        // Extract username from HIVE notification message
        const msg = notification.data.hive_notification.msg;
        const usernameMatch = msg.match(/@([a-z0-9\-\.]+)/);
        if (usernameMatch) {
          return `https://images.hive.blog/u/${usernameMatch[1]}/avatar/small`;
        }
      }
      return '/img/no-user.png';
    },
    
    getNotificationUser(notification) {
      if (notification.type === 'account_request') {
        return notification.data.direction === 'received' 
          ? notification.data.requester_username 
          : notification.data.requested_by;
      } else if (notification.type === 'hive_notification' && notification.data.hive_notification) {
        const msg = notification.data.hive_notification.msg;
        const usernameMatch = msg.match(/@([a-z0-9\-\.]+)/);
        return usernameMatch ? usernameMatch[1] : 'HIVE';
      }
      return 'System';
    },
    
    formatNotificationTime(dateString) {
      const now = new Date();
      const date = new Date(dateString);
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffMins < 1) {
        return 'Just now';
      } else if (diffMins < 60) {
        return `${diffMins}m ago`;
      } else if (diffHours < 24) {
        return `${diffHours}h ago`;
      } else if (diffDays < 7) {
        return `${diffDays}d ago`;
      } else {
        return date.toLocaleDateString();
      }
    },

    dismissInstallPrompt() {
      this.showInstallPrompt = false;
      this.hideBanner();
      this.deferredPrompt = null;

      // Don't show again for this session
      sessionStorage.setItem('installPromptDismissed', 'true');
    },

    dismissUpdateNotification() {
      this.showUpdateNotification = false;
    },

    setupPeriodicChecks() {
      // Check for updates every 30 minutes
      setInterval(async () => {
        try {
          const registration = await navigator.serviceWorker.getRegistration('/');
          if (registration) {
            await registration.update();
          }
        } catch (error) {
          console.error('[SW Monitor] Periodic update check failed:', error);
        }
      }, 30 * 60 * 1000);

      // Update cache stats every 5 minutes
      setInterval(() => {
        this.updateCacheStats();
      }, 5 * 60 * 1000);
    },

    formatBytes(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    showToast(message, type = 'info') {
      // Emit event for toast system
      this.$emit('toast', { message, type });
    }
  },

  watch: {
    showInstallPrompt(newVal) {
      // Update banner visibility when install prompt changes
      if (newVal && this.installStatus === 'available') {
        this.showBanner();
      } else {
        this.hideBanner();
      }
    }
  },

  mounted() {
    // Don't show install prompt if dismissed this session
    if (sessionStorage.getItem('installPromptDismissed')) {
      this.showInstallPrompt = false;
    }

    this.initializeMonitor();
  },

  beforeUnmount() {
    // Clean up banner and body padding when component is destroyed
    this.hideBanner();
    if (this.bannerElement) {
      this.bannerElement = null;
    }
  },
  template: `<!-- Dropdown menu -->
      <div class="">
          <nav>
            <div class="nav nav-tabs nav-bell-nav mb-3" id="nav-tab" role="tablist">
              <button class="nav-link border-0 active" id="nav-activity-tab" data-bs-toggle="tab" data-bs-target="#nav-activity" type="button" role="tab" aria-controls="nav-activity" aria-selected="true">
                Activities
              </button>
              <button class="nav-link border-0" id="nav-transactions-tab" data-bs-toggle="tab" data-bs-target="#nav-transactions" type="button" role="tab" aria-controls="nav-transactions" aria-selected="false">
                Transactions
              </button>
              <button class=" border-0 nav-link " id="nav-app-tab" data-bs-toggle="tab" data-bs-target="#nav-app" type="button" role="tab" aria-controls="nav-app" aria-selected="false">
                <div class="d-flex align-items-center">
                  <i class="fa-solid fa-download fa-fw me-1" v-if="swStatus === 'update-available'"></i> 
                  <i class="fa-solid fa-sync fa-spin fa-fw me-1" v-else-if="swStatus === 'installing'"></i> 
                  <i class="fa-solid fa-exclamation-triangle fa-fw me-1" v-else-if="swStatus === 'error'"></i> 
                  <i class="fa-solid fa-download fa-fw me-1" v-else-if="installStatus === 'available'"></i>
                  <span>System</span>
                  <span class="d-none" v-if="showUpdateNotification || installStatus === 'available'">!</span> 
                </div>
              </button>
               </div>
          </nav>
          <div class="tab-content" id="nav-tabContent">
            <div class="tab-pane fade show active" id="nav-activity" role="tabpanel" aria-labelledby="nav-activity-tab" tabindex="0">
              <div class="d-flex flex-column w-100">
                
                <!-- Loading state -->
                <div v-if="$parent.notificationsLoading" class="text-center py-3">
                  <i class="fa-solid fa-spinner fa-spin"></i>
                  <div class="small text-dark">Loading notifications...</div>
                </div>
                
                <!-- Error state -->
                <div v-else-if="$parent.notificationsError" class="text-center py-3 text-danger">
                  <i class="fa-solid fa-exclamation-triangle"></i>
                  <div class="small">{{ $parent.notificationsError }}</div>
                  <button @click="$parent.getNotifications()" class="btn btn-sm btn-outline-primary mt-2">
                    Retry
                  </button>
                </div>
                
                <!-- No notifications -->
                <div v-else-if="$parent.notifications.length === 0" class="text-center py-3">
                  <i class="fa-solid fa-bell-slash"></i>
                  <div class="small">No notifications</div>
                </div>
                
                <!-- Notifications list -->
                <div v-else>
                  <!-- Action buttons -->
                  <div class="d-flex justify-content-between align-items-center mb-2 px-2">
                    <button @click="$parent.getNotifications()" 
                            class="btn btn-sm btn-dark rounded-pill d-flex align-items-center gap-1"
                            :disabled="$parent.notificationsLoading" >
                      <i class="fa-solid fa-rotate" :class="{'fa-spin': $parent.notificationsLoading}"></i>
                      <span class="d-none d-sm-inline">Refresh</span>
                    </button>
                    <button @click="$parent.markAllNotificationsRead()" 
                            class="btn btn-sm btn-light border-dark border-1 rounded-pill d-flex align-items-center gap-1">
                      <i class="fa-solid fa-check-double"></i>
                      <span class="d-none d-sm-inline">Mark All Read</span>
                    </button>
                  </div>
                  
                  <!-- Notification item -->
                  <component :is="notification.data.url ? 'a' : 'div'" :href="notification.data.url ? blogLink(notification.data.url) : null" :target="notification.data.url ? '_blank' : null"  v-for="notification in $parent.notifications" :key="notification.id" 
                       class="d-flex gap-2 mb-1 p-2 rounded text-decoration-none text-dark position-relative"
                       :class="{
                         'bg-light-2 border-start border-warning border-3': notification.type === 'account_request' && notification.data.direction === 'received',
                         'bg-light-2 border-start border-danger border-3': (notification.type === 'account_request' && notification.data.direction === 'sent') || notification.status === 'unread',
                         'bg-light-2 border-start border-info border-1': notification.priority === 'high' && notification.type !== 'account_request',
                         'bg-light-2 opacity-75': notification.status === 'read'
                       }"
                       :style="notification.data.url ? 'cursor: pointer;' : ''"
                       @mouseenter="notification.data.url ? $event.target.classList.add('bg-primary-subtle') : null"
                       @mouseleave="notification.data.url ? $event.target.classList.remove('bg-primary-subtle') : null" >
                    
                    <!-- User thumbnail -->
                    <div class="d-flex">
                      <div class="ratio ratio-1x1" style="min-width: 40px; min-height: 40px;">
                        <img class="rounded-circle img-fluid" 
                            :src="getNotificationAvatar(notification)" 
                            :alt="getNotificationUser(notification)"
                            @error="$event.target.src='/img/no-user.png'"
                            style="width: 40px; height: 40px;">
                      </div>
                    </div>
                    
                    <!-- Notification content -->
                    <div class="flex-grow-1">
                      <div class="d-flex justify-content-between align-items-start mb-1">
                        <div class="fw-semibold small text-dark">{{ notification.title }}</div>
                        <div class="small text-dark">{{ formatNotificationTime(notification.createdAt) }}</div>
                      </div>
                      
                      <div class="small mb-1 text-dark">{{ notification.message }}</div>
                      
                      <!-- Account Creation Request Actions -->
                      <div v-if="notification.type === 'account_request' && notification.data.direction === 'received'" 
                           class="d-flex gap-1 mt-1">
                        
                        <!-- Create with ACT button -->
                        <button @click="$parent.createAccountForFriend(notification.data, true)"
                                class="btn btn-xs btn-primary d-flex align-items-center gap-1"
                                title="Use Account Creation Token (free with RCs)"
                                style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">
                          <i class="fa-solid fa-circle-dot"></i>
                          <span class="d-none d-sm-inline">Use ACT</span>
                        </button>
                        
                        <!-- Create with HIVE button -->
                        <button @click="$parent.createAccountForFriend(notification, false)"
                                class="btn btn-xs btn-hive d-flex align-items-center gap-1"
                                title="Create account with 3 HIVE delegation"
                                style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">
                          <i class="fa-brands fa-hive"></i>
                          <span class="d-none d-sm-inline">3 HIVE</span>
                        </button>
                        
                        <!-- Ignore button -->
                        <button @click="$parent.ignoreAccountRequest(notification.data.request_id)"
                                class="btn btn-xs btn-secondary d-flex align-items-center gap-1"
                                title="Ignore this request"
                                style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">
                          <i class="fa-solid fa-eye-slash"></i>
                          <span class="d-none d-sm-inline">Ignore</span>
                        </button>
                      </div>
                      
                      <!-- Sent request status -->
                      <div v-else-if="notification.type === 'account_request' && notification.data.direction === 'sent'"
                           class="small text-info">
                        <i class="fa-solid fa-clock"></i>
                        Waiting for response...
                      </div>
                      
                      <!-- Priority indicator -->
                      <div v-if="notification.priority === 'urgent'" 
                           class="position-absolute top-0 end-0 mt-1 me-1">
                        <span class="badge bg-danger">
                          <i class="fa-solid fa-exclamation"></i>
                        </span>
                      </div>
                      
                      <!-- Unread indicator -->
                      <div v-if="notification.status === 'unread'" 
                           class="position-absolute top-50 start-0 translate-middle">
                        <span class="badge bg-primary rounded-pill" style="width: 8px; height: 8px;"></span>
                      </div>
                    </div>
                  </component>
                </div>
              </div>
            </div>
            <div class="tab-pane fade" id="nav-transactions" role="tabpanel" aria-labelledby="nav-transactions-tab" tabindex="0">
              <div class="d-flex flex-column w-100">
                <!-- for each transaction -->
                <div class="d-flex flex-grow-1 gap-2 mb-2">
                  <!-- user thumbnail -->
                  <div class="d-flex">
                    <img class="img-fluid" src="/img/no-user.png" alt="">
                  </div>
                  <!-- message -->
                  <div class="d-flex flex-column">
                    <div class="">The message about the notification or transaction goes here</div>
                    <div class="small">Timestamp</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="tab-pane fade px-3 pt-1" id="nav-app" role="tabpanel" aria-labelledby="nav-app-tab" tabindex="0">
              <!-- Service Worker Status -->
              <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span class="fw-bold">Cache Status:</span>
                  <span class="badge" :class="{
                    'bg-success': swStatus === 'current',
                    'bg-warning': swStatus === 'update-available',
                    'bg-info': swStatus === 'installing',
                    'bg-danger': swStatus === 'error'
                    }">{{ indicatorText }}
                  </span>
                </div>
              
                <div v-if="swVersion" class="small">
                  Version: {{ swVersion }}
                </div>
                
                <div v-if="cacheStats.resourceCount > 0" class="small">
                  {{ cacheStats.resourceCount }} resources cached ({{ formatBytes(cacheStats.totalSize) }})
                </div>
                
                <!-- Update Actions -->
                <div v-if="swStatus === 'update-available'" class="mt-2">
                  <button @click="updateServiceWorker" class="btn btn-primary btn-sm w-100">
                    <i class="fa-solid fa-rotate-right me-1"></i>
                    Update Cache
                  </button>
                </div>
                
                <div v-if="swStatus === 'updated'" class="mt-2">
                  <button @click="reloadPage" class="btn btn-success btn-sm w-100">
                    <i class="fa-solid fa-rotate me-1"></i>
                    Reload to Apply
                  </button>
                </div>
              </div>
          
              <!-- PWA Install -->
              <div v-if="installStatus === 'available'" class="mb-3">
                <hr>
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span class="fw-bold">Install App:</span>
                  <span class="badge bg-info">Available</span>
                </div>
                <p class="small mb-2">
                  Install DLUX as an app for better performance and offline access.
                </p>
                <button @click="installPWA" class="btn btn-primary btn-sm w-100">
                  <i class="fa-solid fa-download me-1"></i>
                  {{ installButtonText }}
                </button>
              </div>
          
              <!-- Error Display -->
              <div v-if="errors.length > 0" class="mb-3">
                <hr>
                <h6 class="text-danger">Issues:</h6>
                <div v-for="error in errors" class="small text-danger mb-1">
                  {{ error }}
                </div>
              </div>
            </div>
          </div>
    </div>
  `
};