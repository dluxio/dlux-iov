export default {
  data() {
    return {
      // Service Worker states
      swStatus: 'loading', // loading, current, update-available, installing, updated, error
      swVersion: null,
      desiredVersion: '2025.06.01.24', // Should match sw.js version

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
        lastUpdated: null
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
          z-index: 9999;
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
      const closeBtn = this.bannerElement.querySelector('.close-btn');

      installBtn.addEventListener('click', () => this.installPWA());
      notNowBtn.addEventListener('click', () => this.dismissInstallPrompt());
      closeBtn.addEventListener('click', () => this.dismissInstallPrompt());
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

        // Show install prompt after a delay to avoid interrupting user flow
        setTimeout(() => {
          this.showInstallPrompt = true;
          this.showBanner();
        }, 5000);
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

          for (const name of cacheNames) {
            const cache = await caches.open(name);
            const keys = await cache.keys();
            resourceCount += keys.length;

            // Estimate cache size (rough calculation)
            for (const request of keys) {
              const response = await cache.match(request);
              if (response) {
                const blob = await response.blob();
                totalSize += blob.size;
              }
            }
          }

          this.cacheStats = {
            totalSize,
            resourceCount,
            lastUpdated: new Date().toISOString()
          };
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
              <button class="nav-link border-0 active" id="nav-home-tab" data-bs-toggle="tab" data-bs-target="#nav-home" type="button" role="tab" aria-controls="nav-home" aria-selected="true">Notifications</button>
              <button class="nav-link border-0" id="nav-profile-tab" data-bs-toggle="tab" data-bs-target="#nav-profile" type="button" role="tab" aria-controls="nav-profile" aria-selected="false">Tx Details</button>
              <button class=" border-0 nav-link " id="nav-contact-tab" data-bs-toggle="tab" data-bs-target="#nav-contact" type="button" role="tab" aria-controls="nav-contact" aria-selected="false">
                <div class="d-flex align-items-center">
                  <i class="fa-solid fa-download fa-fw me-1" v-if="swStatus === 'update-available'"></i> 
                  <i class="fa-solid fa-sync fa-spin fa-fw me-1" v-else-if="swStatus === 'installing'"></i> 
                  <i class="fa-solid fa-exclamation-triangle fa-fw me-1" v-else-if="swStatus === 'error'"></i> 
                  <i class="fa-solid fa-download fa-fw me-1" v-else-if="installStatus === 'available'"></i>
                  <span>App</span>
                  <span class="d-none" v-if="showUpdateNotification || installStatus === 'available'">!</span> 
              </button>
               </div>
          </nav>
          <div class="tab-content" id="nav-tabContent">
            <div class="tab-pane fade show active" id="nav-home" role="tabpanel" aria-labelledby="nav-home-tab" tabindex="0">notifications</div>
            <div class="tab-pane fade" id="nav-profile" role="tabpanel" aria-labelledby="nav-profile-tab" tabindex="0">tx details</div>
            <div class="tab-pane fade" id="nav-contact" role="tabpanel" aria-labelledby="nav-contact-tab" tabindex="0">
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
                    <i class="fa-solid fa-download me-1"></i>
                    Update Cache
                  </button>
                </div>
                
                <div v-if="swStatus === 'updated'" class="mt-2">
                  <button @click="reloadPage" class="btn btn-success btn-sm w-100">
                    <i class="fa-solid fa-refresh me-1"></i>
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