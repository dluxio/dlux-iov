this.version = "2024.06.27.28";

console.log( "SW:" + this.version + " - online.");

var CACHE_NAME = "sw-cache-v" + this.version;

// The files we want to cache
var urlsToCache = [
  `/index.html?${this.version}`,
  `/about/index.html?${this.version}`,
  `/blog/index.html?${this.version}`,
  `/dlux/index.html?${this.version}`,
  `/chat/gpt.html?${this.version}`,
  `/chat/index.html?${this.version}`,
  `/css/custom.css?${this.version}`,
  `/css/drag-sort.css?${this.version}`,
  `/css/smde.css?${this.version}`,
  `/css/smde-comment.css?${this.version}`,
  `/css/scss/custom.scss?${this.version}`,
  `/dex/index.html?${this.version}`,
  `/docs/index.html?${this.version}`,
  `/docs/_sidebar.md?${this.version}`,
  `/docs/dex.md?${this.version}`,
  `/docs/dlux.md?${this.version}`,
  `/docs/new-node.md?${this.version}`,
  `/docs/new-token.md?${this.version}`,
  `/docs/node-voting.md?${this.version}`,
  `/docs/README.md?${this.version}`,
  `/docs/release.md?${this.version}`,
  `/docs/spk.md?${this.version}`,
  `/docs/token-actions.md?${this.version}`,
  `/hub/index.html?${this.version}`,
  `/img/aframe.png?${this.version}`,
  `/img/ar-vr-icon.svg?${this.version}`,
  `/img/dex-vr-comp.jpg?${this.version}`,
  `/img/chatgpt-icon.png?${this.version}`,
  `/img/dlux-icon-192.png?${this.version}`,
  `/img/dlux-hive-logo-alpha.svg?${this.version}`,
  `/img/dlux-logo-icon.png?${this.version}`,
  `/img/dlux-logo.png?${this.version}`,
  `/img/favicon.ico?${this.version}`,
  `/img/gallery-vr-comp.jpg?${this.version}`,
  `/img/hiveauth.svg?${this.version}`,
  `/img/hextacular.svg?${this.version}`,
  `/img/hivesigner.svg?${this.version}`,
  `/img/hub-logo.png?${this.version}`,
  `/img/ipfs-logo.svg?${this.version}`,
  `/img/jtree-comp.jpg?${this.version}`,
  `/img/keychain.png?${this.version}`,
  `/img/metaverse-vr-comp.jpg?${this.version}`,
  `/img/peakd_logo.svg?${this.version}`,
  `/img/ragnarok.png?${this.version}`,
  `/img/spknetwork.png?${this.version}`,
  `/js/aframe.min.js?${this.version}`,
  `/js/appvue.js?${this.version}`,
  `/js/assets-min.js?${this.version}`,
  `/js/bennies-min.js?${this.version}`,
  `/js/bootstrap.bundle.min.js?${this.version}`,
  `/js/buffer.js?${this.version}`,
  `/js/cardvue.js?${this.version}`,
  `/js/contractvue.js?${this.version}`,
  `/js/cryptojs.min.js?${this.version}`,
  `/js/cycler.js?${this.version}`,
  `/js/dd.js?${this.version}`,
  `/js/detailvue-min.js?${this.version}`,
  `/js/dexvue.js?${this.version}`,
  `/js/drag-drop.js?${this.version}`,
  `/js/drag-sort.js?${this.version}`,
  `/js/extensionvue.js?${this.version}`,
  `/js/filesvue.js?${this.version}`,
  `/js/footvue.js?${this.version}`,
  `/js/fttransfer.js?${this.version}`,
  `/js/img-ipfs.js?${this.version}`,
  `/js/indexvue.js?${this.version}`,
  `/js/marker-min.js?${this.version}`,
  `/js/mde-min.js?${this.version}`,
  `/js/modalvue.js?${this.version}`,
  `/js/nav.js?${this.version}`,
  `/js/navue.js?${this.version}`,
  `/js/nftcard.js?${this.version}`,
  `/js/nftdetail.js?${this.version}`,
  `/js/nftsvue.js?${this.version}`,
  `/js/onlyhash.js?${this.version}`,
  `/js/pop-min.js?${this.version}`,
  `/js/postvue.js?${this.version}`,
  `/js/purify.min.js?${this.version}`,
  `/js/ratings-min.js?${this.version}`,
  `/js/replies-min.js?${this.version}`,
  `/js/scene.js?${this.version}`,
  `/js/session.js?${this.version}`,
  `/js/showdown.js?${this.version}`,
  `/js/spk-wallet-comp.js?${this.version}`,
  `/js/tagify.min.js?${this.version}`,
  `/js/tagifyvue.js?${this.version}`,
  `/js/toastvue.js?${this.version}`,
  `/js/trading-vue.min.js?${this.version}`,
  `/js/uploadvue.js?${this.version}`,
  `/js/uuidv.js?${this.version}`,
  `/js/vote-min.js?${this.version}`,
  `/js/vrvue.js?${this.version}`,
  `/js/vueme-min.js?${this.version}`,
  `/js/vueqr.js?${this.version}`,
  `/new/360-gallery/index.html?${this.version}`,
  `/new/advanced/index.html?${this.version}`,
  `/new/index.html?${this.version}`,
  `/nfts/index.html?${this.version}`,
  `/nfts/set/index.html?${this.version}`,
  `/nfts/sets/index.html?${this.version}`,
  `/nfts/create/index.html?${this.version}`,
  `/user/index.html?${this.version}`,
  `/vr/index.html?${this.version}`,
  `/vr/vue.html?${this.version}`,
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
