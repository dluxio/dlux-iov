this.version = "2025.07.15.1";
console.log("SW:" + version + " - online.");
const CACHE_NAME = "sw-cache-v" + version;

// Cache manifest with checksums - auto-generated
self.cacheManifest = 
{
  "version": "2025.07.15.1",
  "generated": "2025-07-15T20:13:48Z",
  "files": {
    "/js/v3-nav.js": {
      "checksum": "a0385f32f9414dc01f748d13c60fdec0",
      "size": 255675,
      "priority": "critical"
    },
    "/sw.js": {
      "checksum": "c70713338aaa31bfb147f1fc51280441",
      "size": 2423,
      "priority": "critical"
    },
    "/packages/ffmpeg/package/dist/umd/ffmpeg-core.wasm": {
      "checksum": "no-hash-symlink",
      "size": 0,
      "priority": "lazy"
    },
    "/packages/core/package/dist/umd/ffmpeg-core.js": {
      "checksum": "no-hash-symlink",
      "size": 0,
      "priority": "lazy"
    }
  }
}
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
