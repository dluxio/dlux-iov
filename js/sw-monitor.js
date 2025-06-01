export default {
  data() {
    return {
      // Service Worker states
      swStatus: 'loading', // loading, current, update-available, installing, updated, error
      swVersion: null,
      desiredVersion: '2025.06.01.7', // Should match sw.js version
      
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
      errors: []
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
        }, 5000);
      });
      
      // Listen for app installed event
      window.addEventListener('appinstalled', () => {
        console.log('[SW Monitor] PWA was installed');
        this.installStatus = 'installed';
        this.showInstallPrompt = false;
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
  
  mounted() {
    // Don't show install prompt if dismissed this session
    if (sessionStorage.getItem('installPromptDismissed')) {
      this.showInstallPrompt = false;
    }
    
    this.initializeMonitor();
  },
  
  template: `
    <div class="sw-monitor">
      <!-- Indicator in nav bar -->
      <div v-if="showIndicator" class="nav-item dropdown">
        <a class="nav-link position-relative" href="#" role="button" 
           data-bs-toggle="dropdown" aria-expanded="false"
           :class="indicatorClass">
          <i class="fa-solid fa-download" v-if="swStatus === 'update-available'"></i>
          <i class="fa-solid fa-sync fa-spin" v-else-if="swStatus === 'installing'"></i>
          <i class="fa-solid fa-exclamation-triangle" v-else-if="swStatus === 'error'"></i>
          <i class="fa-solid fa-mobile-screen" v-else-if="installStatus === 'available'"></i>
          
          <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-primary"
                v-if="showUpdateNotification || installStatus === 'available'">
            !
          </span>
        </a>
        
        <!-- Dropdown menu -->
        <div class="dropdown-menu dropdown-menu-end p-3" style="min-width: 320px;">
          <h6 class="dropdown-header">App Status</h6>
          
          <!-- Service Worker Status -->
          <div class="mb-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="fw-bold">Cache Status:</span>
              <span class="badge" :class="{
                'bg-success': swStatus === 'current',
                'bg-warning': swStatus === 'update-available',
                'bg-info': swStatus === 'installing',
                'bg-danger': swStatus === 'error'
              }">{{ indicatorText }}</span>
            </div>
            
            <div v-if="swVersion" class="small text-muted">
              Version: {{ swVersion }}
            </div>
            
            <div v-if="cacheStats.resourceCount > 0" class="small text-muted">
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
            <p class="small text-muted mb-2">
              Install DLUX as an app for better performance and offline access.
            </p>
            <button @click="installPWA" class="btn btn-outline-primary btn-sm w-100">
              <i class="fa-solid fa-mobile-screen me-1"></i>
              {{ installButtonText }}
            </button>
          </div>
          
          <!-- Error Display -->
          <div v-if="errors.length > 0" class="mt-3">
            <hr>
            <h6 class="text-danger">Issues:</h6>
            <div v-for="error in errors" class="small text-danger mb-1">
              {{ error }}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Update notification toast -->
      <div v-if="showUpdateNotification" 
           class="position-fixed top-0 start-50 translate-middle-x mt-3 alert alert-info alert-dismissible fade show"
           style="z-index: 1060; max-width: 400px;" role="alert">
        <i class="fa-solid fa-download me-2"></i>
        <strong>App Update Available!</strong><br>
        <small>New features and improvements are ready.</small>
        <div class="mt-2">
          <button @click="updateServiceWorker" class="btn btn-primary btn-sm me-2">
            Update Now
          </button>
          <button @click="dismissUpdateNotification" class="btn btn-outline-secondary btn-sm">
            Later
          </button>
        </div>
        <button @click="dismissUpdateNotification" type="button" class="btn-close" aria-label="Close"></button>
      </div>
      
      <!-- Install prompt -->
      <div v-if="showInstallPrompt && installStatus === 'available'" 
           class="position-fixed bottom-0 start-50 translate-middle-x mb-3 alert alert-primary alert-dismissible fade show"
           style="z-index: 1060; max-width: 400px;" role="alert">
        <i class="fa-solid fa-mobile-screen me-2"></i>
        <strong>Install DLUX App</strong><br>
        <small>Get faster loading and offline access.</small>
        <div class="mt-2">
          <button @click="installPWA" class="btn btn-primary btn-sm me-2">
            Install
          </button>
          <button @click="dismissInstallPrompt" class="btn btn-outline-secondary btn-sm">
            Not Now
          </button>
        </div>
        <button @click="dismissInstallPrompt" type="button" class="btn-close" aria-label="Close"></button>
      </div>
    </div>
  `
}; 