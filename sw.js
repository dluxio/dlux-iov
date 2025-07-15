this.version = "2025.07.15.1";
console.log("SW:" + version + " - online.");
const CACHE_NAME = "sw-cache-v" + version;

// Cache manifest with checksums - auto-generated
self.cacheManifest = 
{
  "version": "2025.07.15.14",
  "generated": "2025-07-15T21:49:53Z",
  "files": {
    "/sw.js": {
      "checksum": "7ea2060995b660cfe476e9cf8ccd58d3",
      "size": 2260,
      "priority": "critical"
    },
    "/packages/core/package/dist/umd/ffmpeg-core.js": {
      "checksum": "5f37ed7047b961772448e656b091ffdd",
      "size": 114673,
      "priority": "lazy"
    },
    "/packages/ffmpeg/package/dist/umd/ffmpeg-core.wasm": {
      "checksum": "no-hash-symlink",
      "size": 0,
      "priority": "lazy"
    }
  }
}
;


;


;


;


// Minimal cache manifest for testing

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
