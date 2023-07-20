this.version = "23.7.20";

console.log(
  "SW:" + this.version + " - online."
);

var CACHE_NAME = "sw-cache-v" + this.version;

// The files we want to cache
var urlsToCache = [
  "/index.html",
  "/about/index.html",
  "/blog/index.html",
  "/dlux/index.html",
  "/chat/gpt.html",
  "/chat/index.html",
  "/css/custom.css",
  "/css/drag-sort.css",
  "/css/smde.css",
  "/css/smde-comment.css",
  "/css/scss/custom.scss",
  "/dex/index.html",
  "/docs/index.html",
  "/docs/_sidebar.md",
  "/docs/dex.md",
  "/docs/dlux.md",
  "/docs/new-node.md",
  "/docs/new-token.md",
  "/docs/node-voting.md",
  "/docs/README.md",
  "/docs/release.md",
  "/docs/spk.md",
  "/docs/token-actions.md",
  "/hub/index.html",
  "/img/aframe.png",
  "/img/ar-vr-icon.svg",
  "/img/dex-vr-comp.jpg",
  "/img/chatgpt-icon.png",
  "/img/dlux-icon-192.png",
  "/img/dlux-hive-logo-alpha.svg",
  "/img/dlux-logo-icon.png",
  "/img/dlux-logo.png",
  "/img/favicon.ico",
  "/img/gallery-vr-comp.jpg",
  "/img/hiveauth.svg",
  "/img/hextacular.svg",
  "/img/hivesigner.svg",
  "/img/hub-logo.png",
  "/img/ipfs-logo.svg",
  "/img/jtree-comp.jpg",
  "/img/keychain.png",
  "/img/metaverse-vr-comp.jpg",
  "/img/peakd_logo.svg",
  "/img/ragnarok.png",
  "/img/spknetwork.png",
  "/js/dexvue.js",
  "/js/footvue.js",
  "/js/indexvue.js",
  "/js/navue.js",
  "/js/nftsvue.js",
  "/js/toastvue.js",
  "/js/trading-vue.min.js",
  "/new/360-gallery/index.html",
  "/new/advanced/index.html",
  "/new/index.html",
  "/nfts/index.html",
  "/nfts/set/index.html",
  "/nfts/sets/index.html",
  "/nfts/create/index.html",
  "/user/index.html",
  "/vr/index.html",
  "/vr/vue.html",
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      console.log("Opened cache:" + CACHE_NAME);
      
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("fetch", function (event) {
  event.respondWith(
    caches.match(event.request).then(function (response) {
      if (response) {
        console.log(event.request);
        return response;
      }
      var fetchRequest = event.request.clone();
      return fetch(fetchRequest).then(function (response) {
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }
        var responseToCache = response.clone();

        if(!(event.request.url.startsWith('http'))){
        caches.open(CACHE_NAME).then(function (cache) {
          if (!/^https?:$/i.test(new URL(event.request.url).protocol)) return;
          cache.put(event.request, responseToCache);
        });
      }
        return response;
      });
    })
  );
});

self.addEventListener("activate", function (event) {
  console.log("SW: Activated. Cache name:" + CACHE_NAME);
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function (cacheName) {
            // Return true if you want to remove this cache,
            // but remember that caches are shared across
            // the whole origin
          })
          .map(function (cacheName) {
            console.log("Deleteing cache: " + cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
});

self.addEventListener("message", function (e) {
  var message = e.data; // We're going to have some fun here...
  
  console.log("SW msg:" + message);
});

function callScript (o){
  return new Promise((resolve, reject) => {
    if (this.nftscripts[o.script]) {
      const code = `(//${this.nftscripts[o.script]}\n)("${o.uid ? o.uid : 0}")`;
      var computed = eval(code);
      computed.uid = o.uid;
      computed.owner = o.owner;
      computed.script = o.script;
      computed.setname = o.set;
      resolve(computed);
    } else {
      this.pullScript(o.script).then((empty) => {
        this.callScript(o).then((r) => {
          resolve(r);
        });
      });
    }
  });
}

function pullScript(id) {
      return new Promise((resolve, reject) => {
        // check if cache includes id
        // add to cache if not...
        fetch(`https://ipfs.io/ipfs/${id}`)
          .then((response) => response.text())
          .then((data) => {
            this.nftscripts[id] = data;
            resolve("OK");
          });
      });
    }
