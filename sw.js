this.version = "2025.04.11.43";
console.log("SW:" + version + " - online.");
const CACHE_NAME = "sw-cache-v" + version;

// Files to cache (same as your original list, omitted for brevity)
var urlsToCache = [
  `/about/index.html`,
  `/aframe-builder/aframe.min.js`,
  `/aframe-builder/index.html`,
  `/aframe-builder/index2.html`,
  `/blog/index.html`,
  `/build/index.html`,
  `/chat/gpt.html`,
  `/chat/index.html`,
  `/create/index.html`,
  `/css/bootstrap/tests/jasmine.js`,
  `/css/bootstrap/tests/sass-true/register.js`,
  `/css/bootstrap/tests/sass-true/runner.js`,
  `/css/codemirror-monokai.min.css`,
  `/css/codemirror.min.css`,
  `/css/custom-old.css`,
  `/css/custom.css`,
  `/css/customaf.css`,
  `/css/drag-sort.css`,
  `/css/simplemde-bs-dark.css`,
  `/css/smde-comment.css`,
  `/css/smde.css`,
  `/css/tagify.css`,
  `/css/v3.css`,
  `/dApps/turnkey-360-1-5-0.html`,
  `/dao/index.html`,
  `/dex/index.html`,
  `/dlux/index.html`,
  `/download.js`,
  `/honeyblocks/block/index.html`,
  `/honeyblocks/detail/index.html`,
  `/honeyblocks/index.html`,
  `/honeyblocks/list/index.html`,
  `/hub/index.html`,
  `/img/FFmpeg_logo.svg`,
  `/img/US-UK_Add_to_Apple_Wallet_RGB_101421.svg`,
  `/img/abcd-file-type.svg`,
  `/img/ae-file-type-svgrepo-com.svg`,
  `/img/aframe.png`,
  `/img/ai-file-type-svgrepo-com.svg`,
  `/img/ar-vr-icon.png`,
  `/img/ar-vr-icon.svg`,
  `/img/avi-file-type-svgrepo-com.svg`,
  `/img/chatgpt-icon.png`,
  `/img/css-file-type-svgrepo-com.svg`,
  `/img/csv-file-type-svgrepo-com.svg`,
  `/img/cube.png`,
  `/img/dex-vr-comp.jpg`,
  `/img/dlux-hive-logo-alpha-font_color.svg`,
  `/img/dlux-hive-logo-alpha.svg`,
  `/img/dlux-hive-logo.svg`,
  `/img/dlux-icon-192.png`,
  `/img/dlux-logo-icon.png`,
  `/img/dlux-logo.png`,
  `/img/dlux-pen.png`,
  `/img/dlux-qr.png`,
  `/img/dluxdefault.png`,
  `/img/eps-file-type-svgrepo-com.svg`,
  `/img/excel-file-type-svgrepo-com.svg`,
  `/img/gallery-vr-comp.jpg`,
  `/img/hbd_green.svg`,
  `/img/hextacular.svg`,
  `/img/hiveauth.svg`,
  `/img/hivesigner.svg`,
  `/img/html-file-type-svgrepo-com.svg`,
  `/img/hub-logo.png`,
  `/img/hypercube.png`,
  `/img/ipfs-logo.svg`,
  `/img/jpg-file-type-svgrepo-com.svg`,
  `/img/jtree-comp.jpg`,
  `/img/keychain.png`,
  `/img/logo_hiveprojects.png`,
  `/img/meta/about.png`,
  `/img/meta/create.png`,
  `/img/meta/dao.png`,
  `/img/meta/index.png`,
  `/img/meta/mint.png`,
  `/img/meta/node.png`,
  `/img/meta/storage1.png`,
  `/img/metaverse-vr-comp.jpg`,
  `/img/mov-file-type-svgrepo-com.svg`,
  `/img/mp3-file-type-svgrepo-com.svg`,
  `/img/no-user.png`,
  `/img/other-file-type-svgrepo-com.svg`,
  `/img/pdf-file-type-svgrepo-com.svg`,
  `/img/peakd_logo.svg`,
  `/img/png-file-type-svgrepo-com.svg`,
  `/img/ppt-file-type-svgrepo-com.svg`,
  `/img/psd-file-type-svgrepo-com.svg`,
  `/img/ragnarok.png`,
  `/img/ragnarok_sealed.png`,
  `/img/rar-file-type-svgrepo-com.svg`,
  `/img/spk192.png`,
  `/img/spk512.png`,
  `/img/spknetwork.png`,
  `/img/spknetwork/broca_icon.png`,
  `/img/spknetwork/broca_logomark.png`,
  `/img/spknetwork/larynx_icon.png`,
  `/img/spknetwork/larynx_logomark.png`,
  `/img/spknetwork/spk_icon.png`,
  `/img/spknetwork/spk_logomark.png`,
  `/img/sting_white.svg`,
  `/img/txt-file-type-svgrepo-com.svg`,
  `/img/wav-file-type-svgrepo-com.svg`,
  `/img/word-file-type-svgrepo-com.svg`,
  `/img/zip-file-type-svgrepo-com.svg`,
  `/index-v2.html`,
  `/index.html`,
  `/ipfs/current.html`,
  `/ipfs/index.html`,
  `/js/aframe-environment-component.min.js`,
  `/js/aframe-extras.min.js`,
  `/js/aframe-inspector.min.js`,
  `/js/aframe.min.js`,
  `/js/appvue.js`,
  `/js/assets-min.js`,
  `/js/assets.js`,
  `/js/bennies-old.js`,
  `/js/bennies.js`,
  `/js/blockvue.js`,
  `/js/bootstrap.bundle.min.js`,
  `/js/buffer.js`,
  `/js/cardvue.js`,
  `/js/chatvue.js`,
  `/js/choices-vue.js`,
  `/js/codemirror-xml.min.js`,
  `/js/codemirror.min.js`,
  `/js/contract-modal.js`,
  `/js/contractvue-old.js`,
  `/js/contractvue.js`,
  `/js/cryptojs.min.js`,
  `/js/cycler.js`,
  `/js/dd.js`,
  `/js/detailvue.js`,
  `/js/dexvue.js`,
  `/js/drag-drop.js`,
  `/js/drag-sort.js`,
  `/js/election-modal.js`,
  `/js/extend-modal.js`,
  `/js/extensionvue-old.js`,
  `/js/extensionvue.js`,
  `/js/filesvue-old.js`,
  `/js/filesvue.js`,
  `/js/footvue.js`,
  `/js/fttransfer.js`,
  `/js/hive-modal.js`,
  `/js/img-ipfs.js`,
  `/js/indexvue.js`,
  `/js/marker.js`,
  `/js/mde-old.js`,
  `/js/mde.js`,
  `/js/methods-common.js`,
  `/js/methods-modals.js`,
  `/js/methods-spk.js`,
  `/js/mfi-vue.js`,
  `/js/modal-manager.js`,
  `/js/modalvue-old.js`,
  `/js/modalvue.js`,
  `/js/model-viewer.min.js`,
  `/js/nav.js`,
  `/js/navue-old.js`,
  `/js/navue.js`,
  `/js/nftcard.js`,
  `/js/nftdetail.js`,
  `/js/nftsvue.js`,
  `/js/onlyhash-old.js`,
  `/js/onlyhash.js`,
  `/js/pop-frame.js`,
  `/js/pop.js`,
  `/js/postvue-old.js`,
  `/js/postvue.js`,
  `/js/purify.min.js`,
  `/js/ratings.js`,
  `/js/replies.js`,
  `/js/scene.js`,
  `/js/session.js`,
  `/js/setcard.js`,
  `/js/showdown.js`,
  `/js/spk-js.js`,
  `/js/spk-wallet.js`,
  `/js/spkvue.js`,
  `/js/standard-modal.js`,
  `/js/stwidget.js`,
  `/js/tagify.min.js`,
  `/js/tagifyvue.js`,
  `/js/toastvue.js`,
  `/js/trading-vue.min.js`,
  `/js/uploadvue-old.js`,
  `/js/uploadvue.js`,
  `/js/uuidv.js`,
  `/js/v3-app.js`,
  `/js/v3-dex.js`,
  `/js/v3-hub.js`,
  `/js/v3-index.js`,
  `/js/v3-nav.js`,
  `/js/v3-nfts.js`,
  `/js/v3-qr.js`,
  `/js/v3-user.js`,
  `/js/vote.js`,
  `/js/voting-modal.js`,
  `/js/vrvue.js`,
  `/js/vue.esm-browser.js`,
  `/js/vueme.js`,
  `/js/vueqr.js`,
  `/lang/en.js`,
  `/mint/index.html`,
  `/naf-playground/aframe/aframe-inspector.min.js`,
  `/naf-playground/aframe/aframe.min.js`,
  `/naf-playground/aframe/networked-aframe.min.js`,
  `/naf-playground/css/styles.css`,
  `/naf-playground/css/window-system.css`,
  `/naf-playground/entity-api-test.html`,
  `/naf-playground/index.html`,
  `/naf-playground/js/autosave.js`,
  `/naf-playground/js/avatar-system.js`,
  `/naf-playground/js/config.js`,
  `/naf-playground/js/core.js`,
  `/naf-playground/js/debug.js`,
  `/naf-playground/js/draggable.js`,
  `/naf-playground/js/entities.js`,
  `/naf-playground/js/entity-api.js`,
  `/naf-playground/js/entity-utils.js`,
  `/naf-playground/js/environment-manager.js`,
  `/naf-playground/js/error-handlers.js`,
  `/naf-playground/js/event-handlers.js`,
  `/naf-playground/js/initialization-manager.js`,
  `/naf-playground/js/main.js`,
  `/naf-playground/js/monaco.js`,
  `/naf-playground/js/network-manager.js`,
  `/naf-playground/js/network.js`,
  `/naf-playground/js/sky-manager.js`,
  `/naf-playground/js/state.js`,
  `/naf-playground/js/ui.js`,
  `/naf-playground/js/utils.js`,
  `/naf-playground/js/watcher.js`,
  `/naf-playground/monaco-editor/vs/base/worker/workerMain.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/abap/abap.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/apex/apex.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/azcli/azcli.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/bat/bat.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/bicep/bicep.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/cameligo/cameligo.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/clojure/clojure.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/coffee/coffee.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/cpp/cpp.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/csharp/csharp.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/csp/csp.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/css/css.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/cypher/cypher.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/dart/dart.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/dockerfile/dockerfile.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/ecl/ecl.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/elixir/elixir.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/flow9/flow9.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/freemarker2/freemarker2.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/fsharp/fsharp.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/go/go.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/graphql/graphql.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/handlebars/handlebars.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/hcl/hcl.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/html/html.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/ini/ini.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/java/java.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/javascript/javascript.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/julia/julia.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/kotlin/kotlin.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/less/less.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/lexon/lexon.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/liquid/liquid.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/lua/lua.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/m3/m3.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/markdown/markdown.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/mdx/mdx.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/mips/mips.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/msdax/msdax.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/mysql/mysql.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/objective-c/objective-c.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/pascal/pascal.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/pascaligo/pascaligo.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/perl/perl.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/pgsql/pgsql.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/php/php.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/pla/pla.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/postiats/postiats.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/powerquery/powerquery.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/powershell/powershell.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/protobuf/protobuf.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/pug/pug.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/python/python.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/qsharp/qsharp.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/r/r.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/razor/razor.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/redis/redis.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/redshift/redshift.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/restructuredtext/restructuredtext.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/ruby/ruby.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/rust/rust.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/sb/sb.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/scala/scala.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/scheme/scheme.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/scss/scss.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/shell/shell.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/solidity/solidity.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/sophia/sophia.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/sparql/sparql.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/sql/sql.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/st/st.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/swift/swift.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/systemverilog/systemverilog.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/tcl/tcl.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/twig/twig.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/typescript/typescript.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/typespec/typespec.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/vb/vb.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/wgsl/wgsl.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/xml/xml.js`,
  `/naf-playground/monaco-editor/vs/basic-languages/yaml/yaml.js`,
  `/naf-playground/monaco-editor/vs/editor/editor.main.css`,
  `/naf-playground/monaco-editor/vs/editor/editor.main.js`,
  `/naf-playground/monaco-editor/vs/language/css/cssMode.js`,
  `/naf-playground/monaco-editor/vs/language/css/cssWorker.js`,
  `/naf-playground/monaco-editor/vs/language/html/htmlMode.js`,
  `/naf-playground/monaco-editor/vs/language/html/htmlWorker.js`,
  `/naf-playground/monaco-editor/vs/language/json/jsonMode.js`,
  `/naf-playground/monaco-editor/vs/language/json/jsonWorker.js`,
  `/naf-playground/monaco-editor/vs/language/typescript/tsMode.js`,
  `/naf-playground/monaco-editor/vs/language/typescript/tsWorker.js`,
  `/naf-playground/monaco-editor/vs/loader.js`,
  `/naf-playground/monaco-editor/vs/nls.messages.de.js`,
  `/naf-playground/monaco-editor/vs/nls.messages.es.js`,
  `/naf-playground/monaco-editor/vs/nls.messages.fr.js`,
  `/naf-playground/monaco-editor/vs/nls.messages.it.js`,
  `/naf-playground/monaco-editor/vs/nls.messages.ja.js`,
  `/naf-playground/monaco-editor/vs/nls.messages.ko.js`,
  `/naf-playground/monaco-editor/vs/nls.messages.ru.js`,
  `/naf-playground/monaco-editor/vs/nls.messages.zh-cn.js`,
  `/naf-playground/monaco-editor/vs/nls.messages.zh-tw.js`,
  `/new/360-gallery/index-expanded.html`,
  `/new/360-gallery/index.html`,
  `/new/advanced/index.html`,
  `/new/index.html`,
  `/new/token/index.html`,
  `/nfts/create/index.html`,
  `/nfts/index.html`,
  `/nfts/old.html`,
  `/nfts/set/index.html`,
  `/nfts/sets/index.html`,
  `/node/index.html`,
  `/open.html`,
  `/open/index.html`,
  `/playground/copy.html`,
  `/playground/env_thumbs/arches.png`,
  `/playground/env_thumbs/checkerboard.png`,
  `/playground/env_thumbs/contact.png`,
  `/playground/env_thumbs/default.png`,
  `/playground/env_thumbs/dream.png`,
  `/playground/env_thumbs/egypt.png`,
  `/playground/env_thumbs/forest.png`,
  `/playground/env_thumbs/goaland.png`,
  `/playground/env_thumbs/goldmine.png`,
  `/playground/env_thumbs/japan.png`,
  `/playground/env_thumbs/moon.png`,
  `/playground/env_thumbs/none.png`,
  `/playground/env_thumbs/osiris.png`,
  `/playground/env_thumbs/poison.png`,
  `/playground/env_thumbs/starry.png`,
  `/playground/env_thumbs/threetowers.png`,
  `/playground/env_thumbs/tron.png`,
  `/playground/env_thumbs/volcano.png`,
  `/playground/env_thumbs/yavapai.png`,
  `/playground/fogworking.html`,
  `/playground/index copy 2.html`,
  `/playground/index copy.html`,
  `/playground/index-monaco-fixed.html`,
  `/playground/index-monaco.html`,
  `/playground/index.html`,
  `/playground/last-try.html`,
  `/playground/new.html`,
  `/qr/index.html`,
  `/reg-sw.js`,
  `/storage/index.html`,
  `/sw.js`,
  `/update.html`,
  `/update/index.html`,
  `/user/detailmodal.html`,
  `/user/index.html`,
  `/vid/blue_dust.m4v`,
  `/vid/connected_dots.m4v`,
  `/vid/data_lake.m4v`,
  `/vid/floating_abstract.m4v`,
  `/vid/glowing_hexagon.m4v`,
  `/vid/gold_wave.m4v`,
  `/vid/orange_cube.m4v`,
  `/vid/stills/blue_dust.jpg`,
  `/vid/stills/connected_dots.jpg`,
  `/vid/stills/data_lake.jpg`,
  `/vid/stills/floating_abstract.jpg`,
  `/vid/stills/glowing_hexagon.jpg`,
  `/vid/stills/gold_wave.jpg`,
  `/vid/stills/orange_cube.jpg`,
  `/vr/index.html`,
  `/vr/vue.html`,
];

self.nftscripts = {};
const scriptPromises = {}; // Store ongoing fetch promises

self.addEventListener("install", function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log("Opened cache:" + CACHE_NAME);
                return cache.addAll(urlsToCache);
            })
            .catch(error => console.error('Cache installation failed:', error))
    );
});

self.addEventListener('fetch', function(event) {
    if (event.request.url.endsWith('.m4v') || event.request.url.startsWith('https://api.coingecko.com/')) {
        event.respondWith(fetch(event.request));
    } else {
        event.respondWith(
            caches.match(event.request)
                .then(cachedResponse => {
                    const fetchPromise = fetch(event.request)
                        .then(networkResponse => {
                            if (!networkResponse || !networkResponse.ok) {
                                console.error('Failed to fetch:', event.request.url);
                                return cachedResponse || networkResponse; // Fallback to cache if available
                            }
                            if (networkResponse.status === 200 && networkResponse.type === 'basic') { // Ensure cacheable
                                const responseToCache = networkResponse.clone();
                                caches.open(CACHE_NAME)
                                    .then(cache => {
                                        cache.put(event.request, responseToCache)
                                            .catch(error => console.error('Cache put failed:', event.request.url, error));
                                    });
                            }
                            return networkResponse;
                        })
                        .catch(error => {
                            console.error('Network error for:', event.request.url, error);
                            return cachedResponse; // Fallback to cache on network failure
                        });
                    return cachedResponse || fetchPromise; // Serve cache first, then update
                })
        );
    }
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('SKIP_WAITING received, activating now...');
        self.skipWaiting()
            .then(() => {
                console.log('Skip waiting completed, claiming clients...');
                return self.clients.claim();
            })
            .then(() => {
                console.log('Clients claimed, notifying all clients...');
                return self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
            })
            .then(clients => {
                clients.forEach(client => {
                    client.postMessage({ type: 'SW_UPDATED' });
                    console.log('Notified client:', client.id);
                });
            })
            .catch(err => console.error('Skip waiting or claim failed:', err));
    }
});

self.addEventListener("activate", function (event) {
    event.waitUntil(
        Promise.all([
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(cacheName => cacheName !== CACHE_NAME)
                        .map(cacheName => {
                            console.log("Deleting cache: " + cacheName);
                            return caches.delete(cacheName);
                        })
                );
            }),
            self.clients.claim()
        ])
        .then(() => {
            return self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
        })
        .then(clients => {
            clients.forEach(client => {
                client.postMessage({ type: 'SW_UPDATED' });
                console.log('Notified client:', client.id);
            });
        })
        .catch(error => console.error('Activation failed:', error))
    );
});

// NFT script handling
self.addEventListener("message", function (e) {
    const message = e.data, p = e.source;
    switch (message.id) {
        case "callScript":
            callScript(message.o, p);
            break;
        default:
            console.log("SW msg:", message);
    }
});

function callScript(o, p) {
    if (self.nftscripts[o.script] && self.nftscripts[o.script] !== "Loading...") {
        const code = `(//${self.nftscripts[o.script]}\n)("${o.uid ? o.uid : 0}")`;
        const computed = eval(code);
        computed.uid = o.uid || "";
        computed.owner = o.owner || "";
        computed.script = o.script;
        computed.setname = o.set;
        computed.token = o.token;
        p.postMessage(computed);
    } else {
        pullScript(o.script).then(() => callScript(o, p));
    }
}

function pullScript(id) {
    if (self.nftscripts[id] && self.nftscripts[id] !== "Loading...") {
        return Promise.resolve("OK");
    } else if (scriptPromises[id]) {
        return scriptPromises[id];
    } else {
        scriptPromises[id] = fetch(`https://ipfs.dlux.io/ipfs/${id}`)
            .then(response => response.text())
            .then(data => {
                self.nftscripts[id] = data;
                delete scriptPromises[id];
                return "OK";
            })
            .catch(error => {
                console.error('Failed to fetch script:', id, error);
                delete scriptPromises[id];
                throw error;
            });
        return scriptPromises[id];
    }
}