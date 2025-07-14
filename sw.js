const version = "2025.07.14.1";
console.log("SW:" + version + " - online.");
const CACHE_NAME = "sw-cache-v" + version;

// Minimal cache manifest for testing
self.cacheManifest = {
  "version": "2025.07.12.21",
  "generated": "2025-07-12T21:58:00Z",
  "files": {
    "/index.html": {
      "checksum": "placeholder",
      "size": 1000,
      "priority": "critical"
    },
    "/css/custom.css": {
      "checksum": "placeholder",
      "size": 1000,
      "priority": "critical"
    },
    "/js/vue.esm-browser.js": {
      "checksum": "placeholder",
      "size": 1000,
      "priority": "critical"
    },
    "/js/v3-nav.js": {
      "checksum": "placeholder",
      "size": 1000,
      "priority": "critical"
    },
    "/sw.js": {
      "checksum": "placeholder",
      "size": 1000,
      "priority": "critical"
    }
  }
};

// Essential service worker functionality
self.addEventListener("install", function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('SW: Cache opened');
                return cache.addAll([
                    '/index.html',
                    '/css/custom.css',
                    '/js/vue.esm-browser.js',
                    '/js/v3-nav.js'
                ]);
            })
            .then(() => {
                return self.skipWaiting();
            })
    );
});

self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        console.log('SW: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', function (event) {
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                // Return cached version or fetch from network
                return response || fetch(event.request);
            })
    );
});