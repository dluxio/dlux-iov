this.version = "2025.06.03.1";
console.log("SW:" + version + " - online.");
const CACHE_NAME = "sw-cache-v" + version;

// PRIORITY 1: Critical resources for first paint and basic functionality
const criticalResources = [
    // Core HTML pages
    `/index.html`,
    `/about/index.html`,
    `/create/index.html`,
    `/nfts/index.html`,
    `/dex/index.html`,
    `/hub/index.html`,
    '/qr/index.html',

    // SPA route target pages (critical for routing)
    `/user/index.html`,
    `/nfts/set/index.html`,
    `/dlux/index.html`,
    `/blog/index.html`,
    `/vr/index.html`,

    // Essential CSS for layout and theming
    `/css/bootstrap/bootstrap.css`,
    `/css/custom.css`,
    `/css/v3.css`,
    `/css/smde.css`,
    `/css/simplemde-bs-dark.css`,

    // Core JavaScript for app functionality
    `/js/vue.esm-browser.js`,
    `/js/v3-app.js`,
    `/js/v3-index.js`,
    `/js/v3-nav.js`,
    `/js/bootstrap.bundle.min.js`,
    `/js/uploadvue.js`,
    `/js/filesvue.js`,
    `/js/sw-monitor.js`,
    `/js/mde.js`,
    `/js/tagify.min.js`,

    // Essential images and icons
    `/img/dlux-hive-logo-alpha.svg`,
    `/img/dlux-icon-192.png`,
    `/img/dlux-logo.png`,
    `/img/no-user.png`,

    // Core utilities
    `/reg-sw.js`,
    `/sw.js`,
];

// PRIORITY 2: Important resources for common interactions
const importantResources = [
    // Common HTML pages
    `/dao/index.html`,

    // Additional CSS
    `/css/bootstrap/bootstrap-grid.css`,
    `/css/bootstrap/bootstrap-utilities.css`,
    `/css/tagify.css`,
    `/css/drag-sort.css`,

    // Important JavaScript modules
    `/js/v3-user.js`,
    `/js/v3-dex.js`,
    `/js/v3-hub.js`,
    `/js/v3-nfts.js`,
    `/js/methods-common.js`,
    `/js/navue.js`,
    `/js/session.js`,
    `/js/dataCommon.js`,

    // Common images
    `/img/tokens/dlux_icon.png`,
    `/img/tokens/hive_icon.svg`,
    `/img/tokens/hbd_icon.svg`,
    `/img/spknetwork.png`,
    `/build/index.html`,
    `/css/bootstrap/bootstrap-reboot.css`,
    `/css/codemirror-monokai.min.css`,
    `/css/codemirror.min.css`,
    `/css/customaf.css`,
    `/css/smde-comment.css`,
    `/dApps/turnkey-360-1-5-0.html`,
    `/download.js`,
    `/honeyblocks/list/index.html`,
    `/img/FFmpeg_logo.svg`,
    `/img/US-UK_Add_to_Apple_Wallet_RGB_101421.svg`,
    `/img/abcd-file-type.svg`,
    `/img/ae-file-type-svgrepo-com.svg`,
    `/img/ai-file-type-svgrepo-com.svg`,
    `/img/ar-vr-icon.png`,
    `/img/ar-vr-icon.svg`,
    `/img/avi-file-type-svgrepo-com.svg`,
    `/img/css-file-type-svgrepo-com.svg`,
    `/img/csv-file-type-svgrepo-com.svg`,
    `/img/cube.png`,
    `/img/dex-vr-comp.jpg`,
    `/img/dlux-hive-logo-alpha-font_color.svg`,
    `/img/dlux-hive-logo.svg`,
    `/img/dlux-logo-icon.png`,
    `/img/dlux-pen.png`,
    `/img/dlux-qr.png`,
    `/img/dluxdefault.png`,
    `/img/eps-file-type-svgrepo-com.svg`,
    `/img/excel-file-type-svgrepo-com.svg`,
    `/img/favicon.ico`,
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
    `/img/sting_white.svg`,
    `/img/tokens/broca_icon.png`,
    `/img/tokens/broca_logomark.png`,
    `/img/tokens/duat_icon.png`,
    `/img/tokens/larynx_icon.png`,
    `/img/tokens/larynx_logomark.png`,
    `/img/tokens/spk_icon.png`,
    `/img/tokens/spk_logomark.png`,
    `/img/txt-file-type-svgrepo-com.svg`,
    `/img/wav-file-type-svgrepo-com.svg`,
    `/img/word-file-type-svgrepo-com.svg`,
    `/img/zip-file-type-svgrepo-com.svg`,
    `/js/aframe-inspector.min.js`,
    `/js/appvue.js`,
    `/js/assets-min.js`,
    `/js/assets.js`,
    `/js/bennies.js`,
    `/js/blockvue.js`,
    `/js/buffer.js`,
    `/js/cardvue.js`,
    `/js/chartjs-adapter-date-fns.local.js`,
    `/js/choices-vue.js`,
    `/js/chrtjscf.js`,
    `/js/codemirror-xml.min.js`,
    `/js/codemirror.min.js`,
    `/js/contract-modal.js`,
    `/js/contracts-vue.js`,
    `/js/cryptojs.min.js`,
    `/js/cycler.js`,
    `/js/dd.js`,
    `/js/detailvue.js`,
    `/js/dexvue.js`,
    `/js/diff.js`,
    `/js/drag-drop.js`,
    `/js/drag-sort.js`,
    `/js/election-modal.js`,
    `/js/extend-modal.js`,
    `/js/extensionvue-old.js`,
    `/js/extensionvue.js`,
    `/js/filesvue-dd.js`,
    `/js/footvue.js`,
    `/js/fttransfer.js`,
    `/js/hive-modal.js`,
    `/js/img-ipfs.js`,
    `/js/indexvue.js`,
    `/js/marker.js`,
    `/js/methods-modals.js`,
    `/js/methods-spk.js`,
    `/js/mfi-vue.js`,
    `/js/modal-manager.js`,
    `/js/modalvue.js`,
    `/js/model-viewer.min.js`,
    `/js/nav.js`,
    `/js/nftdetail.js`,
    `/js/nftsvue.js`,
    `/js/onlyhash-old.js`,
    `/js/onlyhash.js`,
    `/js/pop-frame.js`,
    `/js/pop.js`,
    `/js/postvue.js`,
    `/js/purify.min.js`,
    `/js/ratings.js`,
    `/js/replies.js`,
    `/js/scene.js`,
    `/js/setcard.js`,
    `/js/showdown.js`,
    `/js/spk-js.js`,
    `/js/spk-wallet.js`,
    `/js/spkdrive.js`,
    `/js/spkvue.js`,
    `/js/standard-modal.js`,
    `/js/stwidget.js`,
    `/js/tagifyvue.js`,
    `/js/toastvue.js`,
    `/js/trading-vue.min.js`,
    `/js/upload-everywhere.js`,
    `/js/uploadvue-dd.js`,
    `/js/uuidv.js`,
    `/js/vote.js`,
    `/js/voting-modal.js`,
    `/js/vrvue.js`,
    `/js/vueme.js`,
    `/js/vueqr.js`,
    `/js/watchers-common.js`,
    `/lang/en.js`,
    `/new/360-gallery/index.html`,
    `/new/advanced/index.html`,
    `/nfts/create/index.html`,
    `/nfts/set/index.html`,
    `/nfts/sets/index.html`,
    `/node/index.html`,
    `/open.html`,
    `/open/index.html`,
    `/storage/index.html`,
    `/update.html`,
    `/update/index.html`,
    `/user/detailmodal.html`,
    `/vid/stills/blue_dust.jpg`,
    `/vid/stills/connected_dots.jpg`,
    `/vid/stills/data_lake.jpg`,
    `/vid/stills/floating_abstract.jpg`,
    `/vid/stills/glowing_hexagon.jpg`,
    `/vid/stills/gold_wave.jpg`,
    `/vid/stills/orange_cube.jpg`,
    `/vr/vue.html`,
    `/ipfs/current.html`,
    `/ipfs/index.html`,
  `/img/crypto/bnb.svg`,
  `/img/crypto/ethereum.svg`,
  `/img/crypto/polygon.svg`,
  `/img/crypto/solana.svg`,
  `/img/wallets/coinbase.svg`,
  `/img/wallets/metamask.svg`,
  `/img/wallets/phantom.svg`,
  `/img/wallets/trust.svg`,
  `/img/wallets/walletconnect.svg`,
];

// PRIORITY 3: Page-specific resource groups (cached on-demand)
const pageSpecificResources = {
    '/create': [
        `/create/index.html`,
        `/js/v3-qr.js`,
    ],

    '/aframe': [
        `/aframe-builder/index.html`,
        `/aframe-builder/aframe.min.js`,
        `/js/aframe.min.js`,
        `/js/aframe-extras.min.js`,
        `/js/aframe-environment-component.min.js`,
        `/img/aframe.png`,
        `/naf-playground/aframe/aframe.min.js`,
        `/naf-playground/aframe/networked-aframe.min.js`,
        `/naf-playground/assets/textures/sky/milkyway.jpg`,
        `/naf-playground/css/styles.css`,
    ],

    '/monaco': [
        `/naf-playground/monaco-editor/vs/loader.js`,
        `/naf-playground/monaco-editor/vs/editor/editor.main.js`,
        `/naf-playground/monaco-editor/vs/editor/editor.main.css`,
        `/naf-playground/monaco-editor/vs/language/javascript/javascript.js`,
        `/naf-playground/monaco-editor/vs/language/html/htmlMode.js`,
        `/naf-playground/monaco-editor/vs/language/css/cssMode.js`
    ],

    '/playground': [
        `/playground/index.html`,
        `/naf-playground/index.html`,
        `/naf-playground/js/main.js`,
        `/naf-playground/css/style.css`,
        `/js/aframe.min.js`,
        `/js/aframe-extras.min.js`
    ],

    '/chat': [
        `/chat/index.html`,
        `/chat/gpt.html`,
        `/js/chatvue.js`,
        `/img/chatgpt-icon.png`
    ],

    '/mint': [
        `/mint/index.html`,
        `/new/index.html`,
        `/new/token/index.html`,
        `/js/uploadvue.js`,
        `/js/nftcard.js`
    ]
};

// PRIORITY 4: Skipped resources (files explicitly excluded from caching)
const skippedResources = [
    // Add files here that should not be cached
    // This prevents them from being prompted again in future runs
    `/css/custom-old.css`,
    `/index-v2.html`,
    `/ipfs/current.html`,
    `/ipfs/index.html`,
    `/js/bennies-old.js`,
    `/js/contractvue-old.js`,
    `/js/filesvue-dd.spec.js`,
    `/js/filesvue-old.js`,
    `/js/mde-old.js`,
    `/js/modalvue-old.js`,
    `/js/navue-old.js`,
    `/js/postvue-old.js`,
    `/js/uploadvue-old.js`,
    `/naf-playground/css/window-system.css`,
    `/naf-playground/debug.js`,
    `/naf-playground/entity-api-test.html`,
    `/naf-playground/js/asset-manager.js`,
    `/naf-playground/js/autosave.js`,
    `/naf-playground/js/avatar-system.js`,
    `/naf-playground/js/config.js`,
    `/naf-playground/js/convertStateToSceneData.js`,
    `/naf-playground/js/core.js`,
    `/naf-playground/js/debug.js`,
    `/naf-playground/js/draggable.js`,
    `/naf-playground/js/engine-manager.js`,
    `/naf-playground/js/engine-ui.js`,
    `/naf-playground/js/entities.js`,
    `/naf-playground/js/entity-api.js`,
    `/naf-playground/js/entity-utils.js`,
    `/naf-playground/js/environment-manager.js`,
    `/naf-playground/js/error-handlers.js`,
    `/naf-playground/js/event-handlers.js`,
    `/naf-playground/js/initialization-manager.js`,
    `/naf-playground/js/inspector.js`,
    `/naf-playground/js/monaco.js`,
    `/naf-playground/js/network-manager.js`,
    `/naf-playground/js/network.js`,
    `/naf-playground/js/scene-loader.js`,
    `/naf-playground/js/sky-manager.js`,
    `/naf-playground/js/state.js`,
    `/naf-playground/js/systems/avatar-system.js`,
    `/naf-playground/js/ui.js`,
    `/naf-playground/js/utils.js`,
    `/naf-playground/js/watcher.js`,
    `/naf-playground/monaco-editor-worker-loader-proxy.js`,
    `/naf-playground/monaco-editor/vs/base/browser/ui/codicons/codicon/codicon.ttf`,
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
    `/naf-playground/monaco-editor/vs/language/css/cssWorker.js`,
    `/naf-playground/monaco-editor/vs/language/html/htmlWorker.js`,
    `/naf-playground/monaco-editor/vs/language/json/jsonMode.js`,
    `/naf-playground/monaco-editor/vs/language/json/jsonWorker.js`,
    `/naf-playground/monaco-editor/vs/language/typescript/tsMode.js`,
    `/naf-playground/monaco-editor/vs/language/typescript/tsWorker.js`,
    `/naf-playground/monaco-editor/vs/nls.messages.de.js`,
    `/naf-playground/monaco-editor/vs/nls.messages.es.js`,
    `/naf-playground/monaco-editor/vs/nls.messages.fr.js`,
    `/naf-playground/monaco-editor/vs/nls.messages.it.js`,
    `/naf-playground/monaco-editor/vs/nls.messages.ja.js`,
    `/naf-playground/monaco-editor/vs/nls.messages.ko.js`,
    `/naf-playground/monaco-editor/vs/nls.messages.ru.js`,
    `/naf-playground/monaco-editor/vs/nls.messages.zh-cn.js`,
    `/naf-playground/monaco-editor/vs/nls.messages.zh-tw.js`,
    `/naf-playground/monaco-proxy.js`,
    `/naf-playground/monaco-test-simple.html`,
    `/naf-playground/monaco-test.html`,
    `/naf-playground/monaco-worker-setup.js`,
    `/naf-playground/scene-test.html`,
    `/naf-playground/test-video.html`,
    `/new/360-gallery/index-expanded.html`,
    `/nfts/old.html`,
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
    `/playground/last-try.html`,
    `/playground/new.html`,
    `/playwright.config.js`,
    `/qr/index.html`,
    `/tests-examples/demo-todo-app.spec.js`,
    `/tests/example.spec.js`,
    `/aframe-builder/index2.html`,
    `/honeyblocks/block/index.html`,
    `/honeyblocks/detail/index.html`,
    `/honeyblocks/index.html`,
    `/naf-playground/aframe/aframe-inspector.min.js`,
    `/sw-monitor-test.html`,
  `/test-pbkdf2.html`,
  `/test-server-routines/onboarding.js`,
  `/test-server-routines/websocket_monitor.js`,
];

// Cache management flags
let priorityTwoCached = false;
let backgroundCacheInProgress = false;

self.nftscripts = {};
const scriptPromises = {}; // Store ongoing fetch promises

self.addEventListener("install", function (event) {
    console.log("SW: Installing with tiered caching strategy...");

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log("SW: Caching critical resources for fast first paint...");
                return cache.addAll(criticalResources);
            })
            .then(() => {
                console.log("SW: Critical resources cached successfully");
                // Skip waiting to activate immediately for faster updates
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('SW: Critical cache installation failed:', error);
                throw error;
            })
    );
});

// Background caching of important resources
function scheduleBackgroundCache() {
    if (backgroundCacheInProgress) return;
    backgroundCacheInProgress = true;

    // Use setTimeout to avoid blocking the install event
    setTimeout(() => {
        cacheImportantResources();
    }, 1000);
}

async function cacheImportantResources() {
    if (priorityTwoCached) return;

    try {
        const cache = await caches.open(CACHE_NAME);
        console.log("SW: Background caching important resources...");

        // Notify clients that caching has started
        self.clients.matchAll({ includeUncontrolled: true, type: 'window' })
            .then(clients => {
                clients.forEach(client => {
                    client.postMessage({ type: 'CACHE_STARTED' });
                });
            })
            .catch(error => console.error('Failed to notify clients of cache start:', error));

        // Cache in smaller batches to avoid overwhelming the browser
        const batchSize = 10;
        for (let i = 0; i < importantResources.length; i += batchSize) {
            const batch = importantResources.slice(i, i + batchSize);
            try {
                await cache.addAll(batch);
                console.log(`SW: Cached batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(importantResources.length / batchSize)}`);
            } catch (error) {
                console.warn('SW: Some resources in batch failed to cache:', error);
                // Continue with next batch even if some fail
            }

            // Small delay between batches to avoid blocking
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        priorityTwoCached = true;
        console.log("SW: Important resources background caching completed");

        // Notify all clients that caching is complete
        self.clients.matchAll({ includeUncontrolled: true, type: 'window' })
            .then(clients => {
                clients.forEach(client => {
                    client.postMessage({ type: 'CACHE_COMPLETE' });
                });
            })
            .catch(error => console.error('Failed to notify clients of cache completion:', error));
    } catch (error) {
        console.error('SW: Background caching failed:', error);

        // Notify clients of caching error
        self.clients.matchAll({ includeUncontrolled: true, type: 'window' })
            .then(clients => {
                clients.forEach(client => {
                    client.postMessage({ type: 'ERROR', data: { message: 'Background caching failed' } });
                });
            })
            .catch(err => console.error('Failed to notify clients of cache error:', err));
    } finally {
        backgroundCacheInProgress = false;
    }
}

// Cache page-specific resources on navigation
async function cachePageResources(pathname) {
    const cache = await caches.open(CACHE_NAME);

    // Determine which page-specific resources to cache
    let resourcesToCache = [];

    if (pathname.startsWith('/create') || pathname.startsWith('/new')) {
        resourcesToCache = pageSpecificResources['/create'];
    } else if (pathname.startsWith('/aframe-builder') || pathname.includes('aframe')) {
        resourcesToCache = pageSpecificResources['/aframe'];
    } else if (pathname.startsWith('/playground') || pathname.startsWith('/naf-playground')) {
        resourcesToCache = [...pageSpecificResources['/playground'], ...pageSpecificResources['/monaco']];
    } else if (pathname.startsWith('/chat')) {
        resourcesToCache = pageSpecificResources['/chat'];
    } else if (pathname.startsWith('/mint') || pathname.startsWith('/new')) {
        resourcesToCache = pageSpecificResources['/mint'];
    }

    if (resourcesToCache.length > 0) {
        console.log(`SW: Proactively caching resources for ${pathname}`);
        try {
            // Check which resources aren't already cached
            const uncachedResources = [];
            for (const resource of resourcesToCache) {
                const cached = await cache.match(resource);
                if (!cached) {
                    uncachedResources.push(resource);
                }
            }

            if (uncachedResources.length > 0) {
                // Cache in smaller batches
                const batchSize = 5;
                for (let i = 0; i < uncachedResources.length; i += batchSize) {
                    const batch = uncachedResources.slice(i, i + batchSize);
                    try {
                        await cache.addAll(batch);
                    } catch (error) {
                        console.warn('SW: Some page-specific resources failed to cache:', error);
                    }
                }
                console.log(`SW: Cached ${uncachedResources.length} page-specific resources`);
            }
        } catch (error) {
            console.warn('SW: Page-specific caching failed:', error);
        }
    }
}

self.addEventListener('fetch', function (event) {
    const url = new URL(event.request.url);

    // Trigger page-specific caching for same-origin navigations
    if (url.origin === self.location.origin && event.request.mode === 'navigate') {
        // Don't await this - let it run in background
        cachePageResources(url.pathname).catch(error =>
            console.warn('SW: Page-specific caching failed:', error)
        );
    }

    if (url.hostname === 'api.coingecko.com') {
        event.respondWith(
            caches.open(CACHE_NAME).then(async cache => {
                const request = event.request;
                const CACHE_MAX_AGE_MS = 15 * 60 * 1000; // 15 minutes

                const cachedResponse = await cache.match(request);

                if (cachedResponse) {
                    const timestampHeader = cachedResponse.headers.get('sw-cache-timestamp');
                    if (timestampHeader) {
                        const cachedTime = parseInt(timestampHeader, 10);
                        if (Date.now() - cachedTime < CACHE_MAX_AGE_MS) {
                            return cachedResponse;
                        }
                    }
                }
                try {
                    const networkResponse = await fetch(request);
                    if (networkResponse && networkResponse.ok) {
                        const responseToCache = networkResponse.clone();
                        const newHeaders = new Headers(responseToCache.headers);
                        newHeaders.set('sw-cache-timestamp', Date.now().toString());
                        const body = await responseToCache.arrayBuffer();

                        const cacheableResponse = new Response(body, {
                            status: responseToCache.status,
                            statusText: responseToCache.statusText,
                            headers: newHeaders
                        });

                        cache.put(request, cacheableResponse)
                        return networkResponse
                    } else {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        return networkResponse || new Response(JSON.stringify({ error: 'CoinGecko API request failed to fetch and no cache available' }), {
                            status: 503,
                            statusText: 'Service Unavailable',
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                } catch (error) {
                    console.error(`SW: Fetch error for ${request.url}:`, error);
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    return new Response(JSON.stringify({ error: 'CoinGecko API request failed due to network error and no cache available' }), {
                        status: 503,
                        statusText: 'Service Unavailable',
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
            })
        );
        return
    }

    if (url.origin !== self.location.origin) {
        // For specific external resources we want to handle
        if (url.pathname.endsWith('.m4v')) { // MODIFIED: Removed "|| url.hostname === 'api.coingecko.com'"
            event.respondWith(
                fetch(event.request)
                    .catch(error => {
                        console.error('Network error for external resource:', event.request.url, error);
                        return new Response(null, { status: 503 }); // Service Unavailable
                    })
            );
        }
        return; // Let browser handle all other external requests
    }

    // Handle routing rules from Caddyfile for same-origin requests
    event.respondWith(handleRouting(event.request));
});

// Handle routing based on Caddyfile rules
async function handleRouting(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    console.log('SW: Handling route:', pathname, 'Full URL:', url.href);

    // Helper function to try serving a static file, fallback to rewrite
    async function tryStaticOrRewrite(rewriteTarget) {
        // First try to get the exact file from cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // Try to fetch the exact file from network
        try {
            const networkResponse = await fetch(request);
            if (networkResponse && networkResponse.ok) {
                // Cache the response
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME)
                    .then(cache => {
                        cache.put(request, responseToCache)
                            .catch(error => console.error('Cache put failed:', request.url, error));
                    });
                return networkResponse;
            }
        } catch (error) {
            console.log('File not found, falling back to rewrite:', request.url);
        }

        // File doesn't exist, rewrite to target
        const rewriteRequest = new Request(rewriteTarget, {
            method: request.method,
            headers: request.headers,
            body: request.method === 'GET' ? null : request.body,
            credentials: request.credentials,
            cache: request.cache,
            redirect: request.redirect,
            referrer: request.referrer
        });

        return cacheFirstStrategy(rewriteRequest);
    }

    // Handle /nfts/set/* -> rewrite to /nfts/set/index.html if file doesn't exist
    if (pathname.startsWith('/nfts/set/')) {
        return tryStaticOrRewrite('/nfts/set/index.html');
    }

    // Handle /@* -> rewrite to /user/index.html if file doesn't exist
    // Note: Bot handling with reverse proxy is not implemented in SW (can't proxy to 127.0.0.1:3000)
    if (pathname.startsWith('/@')) {
        return tryStaticOrRewrite('/user/index.html');
    }

    // Handle /me* -> rewrite to /user/index.html
    if (pathname.startsWith('/me')) {
        console.log('SW: Rewriting /me route to /user/index.html');
        const rewriteRequest = new Request('/user/index.html', {
            method: request.method,
            headers: request.headers,
            body: request.method === 'GET' ? null : request.body,
            credentials: request.credentials,
            cache: request.cache,
            redirect: request.redirect,
            referrer: request.referrer
        });
        return cacheFirstStrategy(rewriteRequest);
    }

    // Handle /vr/@* -> rewrite to /vr/index.html
    if (pathname.startsWith('/vr/@')) {
        console.log('SW: Rewriting /vr/@ route to /vr/index.html');
        const rewriteRequest = new Request('/vr/index.html', {
            method: request.method,
            headers: request.headers,
            body: request.method === 'GET' ? null : request.body,
            credentials: request.credentials,
            cache: request.cache,
            redirect: request.redirect,
            referrer: request.referrer
        });
        return cacheFirstStrategy(rewriteRequest);
    }



    // Handle /dlux/* -> rewrite to /dlux/index.html if file doesn't exist
    // Note: Bot handling with reverse proxy is not implemented in SW
    if (pathname.startsWith('/dlux/')) {
        return tryStaticOrRewrite('/dlux/index.html');
    }

    // Handle /blog/* -> rewrite to /blog/index.html if file doesn't exist
    // Note: Bot handling with reverse proxy is not implemented in SW
    if (pathname.startsWith('/blog/')) {
        return tryStaticOrRewrite('/blog/index.html');
    }

    // Default cache-first strategy for all other requests
    return cacheFirstStrategy(request);
}

// Cache-first strategy implementation
async function cacheFirstStrategy(request) {
    const url = new URL(request.url);
    console.log('SW: Cache-first strategy for:', url.pathname);

    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        console.log('SW: Serving from cache:', url.pathname);
        return cachedResponse;
    }

    try {
        console.log('SW: Fetching from network:', url.pathname);
        const networkResponse = await fetch(request);

        if (!networkResponse) {
            console.error('SW: No network response for:', url.pathname);
            return new Response('Service Unavailable', { status: 503 });
        }

        if (networkResponse.status !== 200) {
            console.warn('SW: Non-200 response for:', url.pathname, 'Status:', networkResponse.status);
            return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME)
            .then(cache => {
                cache.put(request, responseToCache)
                    .catch(error => console.error('SW: Cache put failed:', request.url, error));
            });

        console.log('SW: Serving from network and cached:', url.pathname);
        return networkResponse;
    } catch (error) {
        console.error('SW: Network error for:', request.url, error);
        // Try to return a more helpful error page
        return new Response(`
            <html>
                <body>
                    <h1>Service Unavailable</h1>
                    <p>Unable to load ${url.pathname}</p>
                    <p>Error: ${error.message}</p>
                    <p>Please check your connection and try again.</p>
                </body>
            </html>
        `, {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/html' }
        });
    }
}

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

                // Start background caching of important resources after activation
                scheduleBackgroundCache();
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