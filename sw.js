this.version = "2024.06.09.12";

console.log( "SW:" + this.version + " - online.");

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
  "/js/aframe.min.js",
  "/js/appvue.js",
  "/js/assets-min.js",
  "/js/bennies-min.js",
  "/js/bootstrap.bundle.min.js",
  "/js/buffer.js",
  "/js/cardvue.js",
  "/js/contractvue.js",
  "/js/cryptojs.min.js",
  "/js/cycler.js",
  "/js/dd.js",
  "/js/detailvue-min.js",
  "/js/dexvue.js",
  "/js/drag-drop.js",
  "/js/drag-sort.js",
  "/js/extensionvue.js",
  "/js/filesvue.js",
  "/js/footvue.js",
  "/js/fttransfer.js",
  "/js/img-ipfs.js",
  "/js/indexvue.js",
  "/js/marker-min.js",
  "/js/mde-min.js",
  "/js/modalvue.js",
  "/js/nav.js",
  "/js/navue.js",
  "/js/nftcard.js",
  "/js/nftdetail.js",
  "/js/nftsvue.js",
  "/js/onlyhash.js",
  "/js/pop-min.js",
  "/js/postvue.js",
  "/js/purify.min.js",
  "/js/ratings-min.js",
  "/js/replies-min.js",
  "/js/scene.js",
  "/js/session.js",
  "/js/showdown.js",
  "/js/spk-wallet-comp.js",
  "/js/tagify.min.js",
  "/js/tagifyvue.js",
  "/js/toastvue.js",
  "/js/trading-vue.min.js",
  "/js/uploadvue.js",
  "/js/uuidv.js",
  "/js/vote-min.js",
  "/js/vrvue.js",
  "/js/vueme-min.js",
  "/js/vueqr.js",
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

this.nftscripts = {}

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
    /* Check if the cache has the file */
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(resp => {
          // Request found in current cache, or fetch the file
          return resp || fetch(event.request).then(response => {
              /* Check if the cache has the file */
              if(response.status == 429)throw new Error('Rate Limit@', event.request.url);
              if (!response || response.status !== 200 || response.type !== "basic") {
                return response;
              }
              // Cache the newly fetched file for next time
              if (
                (!response.headers.get("content-type").includes("json") && !response.headers.get("retry-after")) &&
                event.request.method === "GET" && 
                event.request.url.startsWith('http'))cache.put(event.request, response.clone());
              return response;
          // Fetch failed, user is offline
          }).catch(() => {
              // Look in the whole cache to load a fallback version of the file
              return caches.match(event.request).then(fallback => {
                  return fallback;
              });
          });
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
            return cacheName != CACHE_NAME
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
  const message = e.data, p = e.source;
  switch (message.id) {
    case "callScript":

      callScript(message.o, p)
      break;
    default:
      console.log("SW msg:", message);
  }
});



function tryLocal(m) {
  return new Promise((resolve, reject) => {
    localStorage.getItem(m.o).then((data) => {
      if (data) {
        resolve(data);
      } else {
        reject("no data");
      }
    })
  });
}

function callScript (o,p){
    if (this.nftscripts[o.script] && this.nftscripts[o.script] != "Loading...") {
      const code = `(//${this.nftscripts[o.script]}\n)("${ o.uid ? o.uid : 0}")`;
      var computed = eval(code);
      computed.uid = o.uid || "";
      computed.owner = o.owner || "";
      computed.script = o.script;
      (computed.setname = o.set), (computed.token = o.token);
      p.postMessage(computed);
    } else {
      this.pullScript(o.script).then((empty) => {
        this.callScript(o,p)
      });
    }
}

function pullScript(id) {
      return new Promise((resolve, reject) => {
        if (this.nftscripts[id] == "Loading...") {
          setTimeout(() => {
              pullScript(id).then((r) => {
              resolve(r);
            });
          }, 2000);
        } else if (this.nftscripts[id]) {
          resolve("OK");
        } else {
          this.nftscripts[id] = "Loading...";
          fetch(`https://ipfs.dlux.io/ipfs/${id}`)
          .then((response) => response.text())
          .then((data) => {
            this.nftscripts[id] = data;
            resolve("OK");
          });
        }
      });
    }
