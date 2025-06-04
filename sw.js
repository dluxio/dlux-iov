this.version = "2025.06.04.17";
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
  `/img/hivesigner_white.svg`,
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
  `/css/bootstrap-grid.css`,
  `/css/bootstrap-reboot.css`,
  `/css/bootstrap-utilities.css`,
  `/css/bootstrap.css`,
];

// Cache management flags
let priorityTwoCached = false;
let backgroundCacheInProgress = false;

self.nftscripts = {};
const scriptPromises = {}; // Store ongoing fetch promises

self.addEventListener("install", function (event) {
    console.log("SW: Installing with checksum-based smart caching...");

    event.waitUntil(
        smartCacheInstall()
            .then(() => {
                console.log("SW: Smart cache installation completed");
                // Skip waiting to activate immediately for faster updates
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('SW: Smart cache installation failed:', error);
                throw error;
            })
    );
});

// Smart cache installation with checksum comparison
async function smartCacheInstall() {
    const newCache = await caches.open(CACHE_NAME);
    
    // Check if we have a cache manifest with checksums
    if (!self.cacheManifest || !self.cacheManifest.files) {
        console.log("SW: No cache manifest found, falling back to traditional caching");
        await newCache.addAll(criticalResources);
        return;
    }
    
    console.log(`SW: Smart caching v${self.cacheManifest.version} with ${Object.keys(self.cacheManifest.files).length} files`);
    
    // Get previous cache if it exists
    const oldCacheNames = await caches.keys();
    const oldCacheName = oldCacheNames.find(name => name.startsWith('sw-cache-v') && name !== CACHE_NAME);
    const oldCache = oldCacheName ? await caches.open(oldCacheName) : null;
    
    let transferredFiles = 0;
    let downloadedFiles = 0;
    let totalSize = 0;
    
    // Process files by priority: critical first, then important, then page-specific
    const criticalFiles = Object.entries(self.cacheManifest.files)
        .filter(([url, info]) => info.priority === 'critical');
    const importantFiles = Object.entries(self.cacheManifest.files)
        .filter(([url, info]) => info.priority === 'important');
    const pageSpecificFiles = Object.entries(self.cacheManifest.files)
        .filter(([url, info]) => info.priority === 'page-specific');
    
    // Process critical files first
    console.log("SW: Processing critical files for fast first paint...");
    const criticalStats = await processCacheFiles(criticalFiles, newCache, oldCache, 'critical');
    
    // Schedule important and page-specific files for background processing
    setTimeout(() => {
        Promise.all([
            processCacheFiles(importantFiles, newCache, oldCache, 'important'),
            processCacheFiles(pageSpecificFiles, newCache, oldCache, 'page-specific')
        ]).then(([importantStats, pageStats]) => {
            console.log("SW: Background smart caching completed");
            
            // Calculate total stats
            const totalStats = {
                transferred: (criticalStats.transferred || 0) + (importantStats.transferred || 0) + (pageStats.transferred || 0),
                downloaded: (criticalStats.downloaded || 0) + (importantStats.downloaded || 0) + (pageStats.downloaded || 0)
            };
            
            notifyClients({ 
                type: 'SMART_CACHE_COMPLETE',
                data: { stats: totalStats }
            });
        }).catch(error => {
            console.error("SW: Background smart caching failed:", error);
            notifyClients({ type: 'ERROR', data: { message: 'Smart cache failed' } });
        });
    }, 1000);
}

// Process cache files with smart checksum comparison
async function processCacheFiles(fileEntries, newCache, oldCache, priority) {
    let transferredCount = 0;
    let downloadedCount = 0;
    
    for (const [url, fileInfo] of fileEntries) {
        try {
            let needsDownload = true;
            
            // Check if file exists in old cache with same checksum
            if (oldCache) {
                const oldResponse = await oldCache.match(url);
                if (oldResponse) {
                    const oldChecksum = oldResponse.headers.get('x-cache-checksum');
                    if (oldChecksum === fileInfo.checksum) {
                        // Checksums match, transfer from old cache
                        const responseToTransfer = oldResponse.clone();
                        await newCache.put(url, responseToTransfer);
                        transferredCount++;
                        needsDownload = false;
                        console.log(`SW: ✓ Transferred ${url} (checksum: ${fileInfo.checksum.substring(0, 8)}...)`);
                    }
                }
            }
            
            if (needsDownload) {
                // Download new/changed file
                try {
                    const response = await fetch(url);
                    if (response && response.ok) {
                        // Add checksum header for future comparisons
                        const responseToCache = new Response(response.body, {
                            status: response.status,
                            statusText: response.statusText,
                            headers: {
                                ...Object.fromEntries(response.headers.entries()),
                                'x-cache-checksum': fileInfo.checksum,
                                'x-cache-size': fileInfo.size.toString()
                            }
                        });
                        await newCache.put(url, responseToCache);
                        downloadedCount++;
                        console.log(`SW: ⬇ Downloaded ${url} (${formatBytes(fileInfo.size)})`);
                    }
                } catch (fetchError) {
                    console.warn(`SW: Failed to cache ${url}:`, fetchError);
                }
            }
        } catch (error) {
            console.warn(`SW: Error processing ${url}:`, error);
        }
    }
    
    console.log(`SW: ${priority} files - transferred: ${transferredCount}, downloaded: ${downloadedCount}`);
    return { transferred: transferredCount, downloaded: downloadedCount };
}

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

// Helper function to notify all clients
function notifyClients(message) {
    self.clients.matchAll({ includeUncontrolled: true, type: 'window' })
        .then(clients => {
            clients.forEach(client => {
                client.postMessage(message);
            });
        })
        .catch(error => console.error('Failed to notify clients:', error));
}

// Helper function to format bytes (duplicate of existing formatBytes for consistency)
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
}
// Cache manifest with checksums - auto-generated
self.cacheManifest = 
{
  "version": "2025.06.04.15",
  "generated": "2025-06-04T18:59:30Z",
  "files": {
    "/index.html": {
      "checksum": "34182fdc1ab540a6efb068ab2fc668e4",
      "size": 27470,
      "priority": "critical"
    },
    "/about/index.html": {
      "checksum": "e7ffd187fda973511537820e461fdbb4",
      "size": 46683,
      "priority": "critical"
    },
    "/create/index.html": {
      "checksum": "5a3d0842df9543804d26ccfdeafdb495",
      "size": 11922,
      "priority": "critical"
    },
    "/nfts/index.html": {
      "checksum": "b30cfe79674b3b7e91f5392fe9635294",
      "size": 59063,
      "priority": "critical"
    },
    "/dex/index.html": {
      "checksum": "b53fd571440258cb4fe782c26c399019",
      "size": 112057,
      "priority": "critical"
    },
    "/hub/index.html": {
      "checksum": "472240862672e2cd11179c84c53a45b0",
      "size": 16428,
      "priority": "critical"
    },
    "/user/index.html": {
      "checksum": "2d49a7060c9f4f4b3534b8f4eadb7933",
      "size": 300946,
      "priority": "critical"
    },
    "/nfts/set/index.html": {
      "checksum": "54f1eb73c26f7480edb19e21fa64a57d",
      "size": 43225,
      "priority": "critical"
    },
    "/dlux/index.html": {
      "checksum": "f43512fc91f2d48c9680e05b76168c1e",
      "size": 7505,
      "priority": "critical"
    },
    "/blog/index.html": {
      "checksum": "5a27ff6ef04f193814808f3cd9b1f4b8",
      "size": 6602,
      "priority": "critical"
    },
    "/vr/index.html": {
      "checksum": "af23926e6aa73e55a7d853f014dde3d3",
      "size": 89688,
      "priority": "critical"
    },
    "/css/bootstrap/bootstrap.css": {
      "checksum": "b81428268a775fbf425040349ab96a20",
      "size": 276580,
      "priority": "critical"
    },
    "/css/custom.css": {
      "checksum": "0935e3634304accec4568858a75c6b92",
      "size": 329461,
      "priority": "critical"
    },
    "/css/v3.css": {
      "checksum": "7056941e006936405769b10c0162a6f6",
      "size": 16143,
      "priority": "critical"
    },
    "/css/smde.css": {
      "checksum": "80e8346c6b7648cc3b82c94f279de4d4",
      "size": 13090,
      "priority": "critical"
    },
    "/css/simplemde-bs-dark.css": {
      "checksum": "96865c7891f63beeae48ad1b318b38b3",
      "size": 16247,
      "priority": "critical"
    },
    "/js/vue.esm-browser.js": {
      "checksum": "232af68f6551a87a4732981749dd5265",
      "size": 531704,
      "priority": "critical"
    },
    "/js/v3-app.js": {
      "checksum": "e74c1e04de6d528c4e3f354a472bedd5",
      "size": 46788,
      "priority": "critical"
    },
    "/js/v3-index.js": {
      "checksum": "6db5a77aba0ee262f320bee19631126c",
      "size": 28739,
      "priority": "critical"
    },
    "/js/v3-nav.js": {
      "checksum": "3151f3edd2aadf7a281760b85fa265d5",
      "size": 172155,
      "priority": "critical"
    },
    "/js/bootstrap.bundle.min.js": {
      "checksum": "2e477967e482f32e65d4ea9b2fd8e106",
      "size": 80721,
      "priority": "critical"
    },
    "/js/uploadvue.js": {
      "checksum": "782c2046067b740080e90050db6d60a6",
      "size": 62462,
      "priority": "critical"
    },
    "/js/filesvue.js": {
      "checksum": "ad5f3e0cdcf7e68466df43ee9019324d",
      "size": 91094,
      "priority": "critical"
    },
    "/js/sw-monitor.js": {
      "checksum": "3adb336ef15b7f22bd48ca1466a5923e",
      "size": 36317,
      "priority": "critical"
    },
    "/js/mde.js": {
      "checksum": "53b8c9f226da2c3a3a3b3b2ffa21abac",
      "size": 999,
      "priority": "critical"
    },
    "/js/tagify.min.js": {
      "checksum": "245e4e1b9c956dbebd6b52a595eabd79",
      "size": 59697,
      "priority": "critical"
    },
    "/img/dlux-hive-logo-alpha.svg": {
      "checksum": "93b0396ce748e2d51e978260bc3267d2",
      "size": 3416,
      "priority": "critical"
    },
    "/img/dlux-icon-192.png": {
      "checksum": "16426fe9577a406f9363aaccfdd97a83",
      "size": 11936,
      "priority": "critical"
    },
    "/img/dlux-logo.png": {
      "checksum": "5892181763fe2e7f3bf5c59b81191f75",
      "size": 33287,
      "priority": "critical"
    },
    "/img/no-user.png": {
      "checksum": "83327a11fc84f8c65194617bc80b88cf",
      "size": 12395,
      "priority": "critical"
    },
    "/reg-sw.js": {
      "checksum": "1b9f56e3076eddd6e1cad2f8e7077b01",
      "size": 7300,
      "priority": "critical"
    },
    "/sw.js": {
      "checksum": "bc0e8111259ab15c8022c643a97cf88f",
      "size": 82616,
      "priority": "critical"
    },
    "/dao/index.html": {
      "checksum": "5c7f3167731d0c5d73f7d758e0690894",
      "size": 11286,
      "priority": "important"
    },
    "/css/bootstrap/bootstrap-grid.css": {
      "checksum": "ff62c56c7f9eaa68592857aee5a7c93e",
      "size": 70327,
      "priority": "important"
    },
    "/css/bootstrap/bootstrap-utilities.css": {
      "checksum": "3302f743a95e6cbeace85ca6c02638d4",
      "size": 104721,
      "priority": "important"
    },
    "/css/tagify.css": {
      "checksum": "17293e2a18aea950ca3ac847b1c1f565",
      "size": 14455,
      "priority": "important"
    },
    "/css/drag-sort.css": {
      "checksum": "693eee9d441c6e004ed4a7b413962c36",
      "size": 1077,
      "priority": "important"
    },
    "/js/v3-user.js": {
      "checksum": "15c5c3f93e85818a54ffed13c5e3894b",
      "size": 165016,
      "priority": "important"
    },
    "/js/v3-dex.js": {
      "checksum": "e4615048077bf0346e5be62a65600d20",
      "size": 49482,
      "priority": "important"
    },
    "/js/v3-hub.js": {
      "checksum": "1a95fd6efb6d81d5beecb403664fc7e5",
      "size": 49164,
      "priority": "important"
    },
    "/js/v3-nfts.js": {
      "checksum": "2742bf4ebcdf031fd3d557ed0c7213ac",
      "size": 98024,
      "priority": "important"
    },
    "/js/methods-common.js": {
      "checksum": "d312c940254e37f94c3f58bcd817da44",
      "size": 18966,
      "priority": "important"
    },
    "/js/navue.js": {
      "checksum": "cc57a50722e2c1b2c3c5a19383b79e16",
      "size": 47919,
      "priority": "important"
    },
    "/js/session.js": {
      "checksum": "19fe354a509a25a48a47ae622f4c998e",
      "size": 48412,
      "priority": "important"
    },
    "/js/dataCommon.js": {
      "checksum": "f38ec95a53d917b4e2d7fe983646d5ea",
      "size": 229,
      "priority": "important"
    },
    "/img/tokens/dlux_icon.png": {
      "checksum": "5892181763fe2e7f3bf5c59b81191f75",
      "size": 33287,
      "priority": "important"
    },
    "/img/tokens/hive_icon.svg": {
      "checksum": "f11afc9005714fcb560171a788ee11bd",
      "size": 1636,
      "priority": "important"
    },
    "/img/tokens/hbd_icon.svg": {
      "checksum": "4cdd7402ddcbd06d7145d437da14c670",
      "size": 999,
      "priority": "important"
    },
    "/img/spknetwork.png": {
      "checksum": "4d91f7a0ed50ac7b0d27cbd52794078a",
      "size": 51410,
      "priority": "important"
    },
    "/build/index.html": {
      "checksum": "3e16dfd5fdbf5257fa8ea29a884030c9",
      "size": 7761,
      "priority": "important"
    },
    "/css/bootstrap/bootstrap-reboot.css": {
      "checksum": "a2c742a5d35fafe705ffc2f23f05b9be",
      "size": 11998,
      "priority": "important"
    },
    "/css/codemirror-monokai.min.css": {
      "checksum": "6cb64c5347235494cdc346527fc0e35d",
      "size": 1902,
      "priority": "important"
    },
    "/css/codemirror.min.css": {
      "checksum": "c1da630111dc87f804761ecc75f89eac",
      "size": 6037,
      "priority": "important"
    },
    "/css/customaf.css": {
      "checksum": "77f6758aadb843a30c49b08f154a042b",
      "size": 300474,
      "priority": "important"
    },
    "/css/smde-comment.css": {
      "checksum": "a2a7d007f4c51ffdba6937b4c79e29f7",
      "size": 13071,
      "priority": "important"
    },
    "/dApps/turnkey-360-1-5-0.html": {
      "checksum": "0834f17707c4f2de376b75f5993f2e72",
      "size": 6884,
      "priority": "important"
    },
    "/download.js": {
      "checksum": "b2c3f631bf06a2d865396d699fc3f2cf",
      "size": 1499,
      "priority": "important"
    },
    "/honeyblocks/list/index.html": {
      "checksum": "716045bd95e766d7ccede8c088089dde",
      "size": 4206,
      "priority": "important"
    },
    "/img/FFmpeg_logo.svg": {
      "checksum": "d9bd07ebe503cd4927e7d84644793a54",
      "size": 22917,
      "priority": "important"
    },
    "/img/US-UK_Add_to_Apple_Wallet_RGB_101421.svg": {
      "checksum": "0b5b9bd4b565aca151bf1a4f8341e371",
      "size": 20339,
      "priority": "important"
    },
    "/img/abcd-file-type.svg": {
      "checksum": "07676d4d9bd2a58d122df4061d55ca18",
      "size": 1654,
      "priority": "important"
    },
    "/img/ae-file-type-svgrepo-com.svg": {
      "checksum": "36d853bb4dd286a875cec233a98fa9af",
      "size": 1408,
      "priority": "important"
    },
    "/img/ai-file-type-svgrepo-com.svg": {
      "checksum": "bd270679de84f66de9406099159cd59a",
      "size": 1364,
      "priority": "important"
    },
    "/img/ar-vr-icon.png": {
      "checksum": "8779f6ca39128aedffc8884a9b9f121c",
      "size": 49521,
      "priority": "important"
    },
    "/img/ar-vr-icon.svg": {
      "checksum": "250b54554e360185204104ff1295c810",
      "size": 10355,
      "priority": "important"
    },
    "/img/avi-file-type-svgrepo-com.svg": {
      "checksum": "35d1d30fbe77b4fcadfcfd049d03682f",
      "size": 1452,
      "priority": "important"
    },
    "/img/css-file-type-svgrepo-com.svg": {
      "checksum": "8d8f50aad42119c8f297e2acdb2cbf8b",
      "size": 2737,
      "priority": "important"
    },
    "/img/csv-file-type-svgrepo-com.svg": {
      "checksum": "eaf65c0be6b22858c041c8de3277046d",
      "size": 2238,
      "priority": "important"
    },
    "/img/cube.png": {
      "checksum": "447344b02ceb4a0cbadc4c4f4046e2ff",
      "size": 12536735,
      "priority": "important"
    },
    "/img/dex-vr-comp.jpg": {
      "checksum": "e763f32eddfb928e99597355486c7654",
      "size": 101824,
      "priority": "important"
    },
    "/img/dlux-hive-logo-alpha-font_color.svg": {
      "checksum": "d5cba5e8acda2fd786ec0b8af4580666",
      "size": 3441,
      "priority": "important"
    },
    "/img/dlux-hive-logo.svg": {
      "checksum": "96518aec91dcdc4cf306b488344f2281",
      "size": 3535,
      "priority": "important"
    },
    "/img/dlux-logo-icon.png": {
      "checksum": "71830c29ed9e2c169bc69df28a20c568",
      "size": 31122,
      "priority": "important"
    },
    "/img/dlux-pen.png": {
      "checksum": "11cd13126cc43ed9d7766e2f678a75d2",
      "size": 11701,
      "priority": "important"
    },
    "/img/dlux-qr.png": {
      "checksum": "3b4c09f50cb7f2314a3e5effce05ea58",
      "size": 33251,
      "priority": "important"
    },
    "/img/dluxdefault.png": {
      "checksum": "362c4095d2752a5d25e5448326f99088",
      "size": 159810,
      "priority": "important"
    },
    "/img/eps-file-type-svgrepo-com.svg": {
      "checksum": "54e62783e56be35d720e9be50c7732b6",
      "size": 2114,
      "priority": "important"
    },
    "/img/excel-file-type-svgrepo-com.svg": {
      "checksum": "9cae63f953dab1bdbe1f1bd2e78504e2",
      "size": 2197,
      "priority": "important"
    },
    "/img/favicon.ico": {
      "checksum": "04f7baccd67b245727b07e7b30543234",
      "size": 3418,
      "priority": "important"
    },
    "/img/gallery-vr-comp.jpg": {
      "checksum": "df3fae44de67c8af269891561242f6d5",
      "size": 178796,
      "priority": "important"
    },
    "/img/hbd_green.svg": {
      "checksum": "4cdd7402ddcbd06d7145d437da14c670",
      "size": 999,
      "priority": "important"
    },
    "/img/hextacular.svg": {
      "checksum": "f11afc9005714fcb560171a788ee11bd",
      "size": 1636,
      "priority": "important"
    },
    "/img/hiveauth.svg": {
      "checksum": "ac85800f2a11ca62345537f3b2f70e04",
      "size": 44094,
      "priority": "important"
    },
    "/img/hivesigner.svg": {
      "checksum": "6958efa0d0564cbf5d2209361551a9d4",
      "size": 11798,
      "priority": "important"
    },
    "/img/html-file-type-svgrepo-com.svg": {
      "checksum": "5ab38fd87ea73dbf6ffed1d024b7d35c",
      "size": 1555,
      "priority": "important"
    },
    "/img/hub-logo.png": {
      "checksum": "7db4716b5e131ddfffc1827968f195fa",
      "size": 79254,
      "priority": "important"
    },
    "/img/hypercube.png": {
      "checksum": "ba9f6e78fa421c4b4731d96da36c9f1e",
      "size": 11451658,
      "priority": "important"
    },
    "/img/ipfs-logo.svg": {
      "checksum": "817a79ff9a3eba2725d46a44df0dcd93",
      "size": 2708,
      "priority": "important"
    },
    "/img/jpg-file-type-svgrepo-com.svg": {
      "checksum": "9e92500a821234c40cf49f081daa4b44",
      "size": 1927,
      "priority": "important"
    },
    "/img/jtree-comp.jpg": {
      "checksum": "bcb9277b1867e82d7415341e9d6a21bf",
      "size": 311146,
      "priority": "important"
    },
    "/img/keychain.png": {
      "checksum": "6846c271b72fee4584494eee2383339f",
      "size": 17563,
      "priority": "important"
    },
    "/img/logo_hiveprojects.png": {
      "checksum": "c05534ff50e1bd4e17ebcb23322386cc",
      "size": 79573,
      "priority": "important"
    },
    "/img/meta/about.png": {
      "checksum": "0e0c6bc95c6e5039795b73e0b7409294",
      "size": 485764,
      "priority": "important"
    },
    "/img/meta/create.png": {
      "checksum": "a744ac5d0b197c99c7ce329f63cd990b",
      "size": 506236,
      "priority": "important"
    },
    "/img/meta/dao.png": {
      "checksum": "392f062627adf5c61eb191ffa6a8e0c3",
      "size": 369057,
      "priority": "important"
    },
    "/img/meta/index.png": {
      "checksum": "cdfd8f211499d38909f21de002319d0b",
      "size": 584134,
      "priority": "important"
    },
    "/img/meta/mint.png": {
      "checksum": "b307d0794d165eb0f52f5c642c56c647",
      "size": 642272,
      "priority": "important"
    },
    "/img/meta/node.png": {
      "checksum": "10b441a2c9e9e728e7055fae9065769d",
      "size": 750851,
      "priority": "important"
    },
    "/img/meta/storage1.png": {
      "checksum": "cb96e8a07b06496384d31e9a30015f9a",
      "size": 434519,
      "priority": "important"
    },
    "/img/metaverse-vr-comp.jpg": {
      "checksum": "82c7278828d85ace9036d87c72801e20",
      "size": 124780,
      "priority": "important"
    },
    "/img/mov-file-type-svgrepo-com.svg": {
      "checksum": "0af98e452f25a7739bb978a7ed02051b",
      "size": 1745,
      "priority": "important"
    },
    "/img/mp3-file-type-svgrepo-com.svg": {
      "checksum": "1004873c11cc066741da417bfe78b80f",
      "size": 2165,
      "priority": "important"
    },
    "/img/other-file-type-svgrepo-com.svg": {
      "checksum": "93ff030887252d38b07c16d97ff6cb2a",
      "size": 1627,
      "priority": "important"
    },
    "/img/pdf-file-type-svgrepo-com.svg": {
      "checksum": "acfd5b697e36e229a5eb3c8dca745eb4",
      "size": 1732,
      "priority": "important"
    },
    "/img/peakd_logo.svg": {
      "checksum": "50081d3c4169086a323b14127ecd344f",
      "size": 552,
      "priority": "important"
    },
    "/img/png-file-type-svgrepo-com.svg": {
      "checksum": "ba847b53eba1f7e7be13000fc4c5ea27",
      "size": 1921,
      "priority": "important"
    },
    "/img/ppt-file-type-svgrepo-com.svg": {
      "checksum": "8487976bee6f78adc7caee5b71479743",
      "size": 2103,
      "priority": "important"
    },
    "/img/psd-file-type-svgrepo-com.svg": {
      "checksum": "752cee1bb240f2679af2f068930fa2cf",
      "size": 2242,
      "priority": "important"
    },
    "/img/ragnarok.png": {
      "checksum": "5934b1a258fdf602cd78b1c35f276b8d",
      "size": 133078,
      "priority": "important"
    },
    "/img/ragnarok_sealed.png": {
      "checksum": "a7558e86491320184e56d6a8f909d695",
      "size": 74886,
      "priority": "important"
    },
    "/img/rar-file-type-svgrepo-com.svg": {
      "checksum": "f02c8bfdfde0a153430b1f22ba611b5f",
      "size": 1835,
      "priority": "important"
    },
    "/img/spk192.png": {
      "checksum": "411500d1b3e3b31bf0b90c5b8126c634",
      "size": 10149,
      "priority": "important"
    },
    "/img/spk512.png": {
      "checksum": "98a452727661d34f119ddf6a3fd920a8",
      "size": 21939,
      "priority": "important"
    },
    "/img/sting_white.svg": {
      "checksum": "b3fb2506f7d51b38fe814243567109cc",
      "size": 2374,
      "priority": "important"
    },
    "/img/tokens/broca_icon.png": {
      "checksum": "87aac077c4cfdf4bd02cbbbef8a4c3ba",
      "size": 33591,
      "priority": "important"
    },
    "/img/tokens/broca_logomark.png": {
      "checksum": "fcd5ae3ad20ec9cfcee5764ad4f26e9f",
      "size": 28971,
      "priority": "important"
    },
    "/img/tokens/duat_icon.png": {
      "checksum": "eed179af8a36b2d8be72a721dada0f84",
      "size": 114195,
      "priority": "important"
    },
    "/img/tokens/larynx_icon.png": {
      "checksum": "27fa9b4e1dc4f0205913529a03a2aced",
      "size": 29625,
      "priority": "important"
    },
    "/img/tokens/larynx_logomark.png": {
      "checksum": "c053db05ca715d5494af1e8cf0b9759b",
      "size": 28604,
      "priority": "important"
    },
    "/img/tokens/spk_icon.png": {
      "checksum": "ec1db8b25b57776a93d8efd59bcdfd7a",
      "size": 33772,
      "priority": "important"
    },
    "/img/tokens/spk_logomark.png": {
      "checksum": "e7488b692154b55e2e2e390b21a7f8bb",
      "size": 25219,
      "priority": "important"
    },
    "/img/txt-file-type-svgrepo-com.svg": {
      "checksum": "90a1ea59895f59235680505a41e17d10",
      "size": 1476,
      "priority": "important"
    },
    "/img/wav-file-type-svgrepo-com.svg": {
      "checksum": "6941433f291e8d4263bad8f5c8571100",
      "size": 1552,
      "priority": "important"
    },
    "/img/word-file-type-svgrepo-com.svg": {
      "checksum": "442055744681d382526a20c60be69cdd",
      "size": 2240,
      "priority": "important"
    },
    "/img/zip-file-type-svgrepo-com.svg": {
      "checksum": "e79c3c0ded94605b92bc4bf522615b9b",
      "size": 1581,
      "priority": "important"
    },
    "/js/aframe-inspector.min.js": {
      "checksum": "90eb74ef16d61ee0ab934e8412e99bf6",
      "size": 437913,
      "priority": "important"
    },
    "/js/appvue.js": {
      "checksum": "c33f02e418090fbc7f112bca7589e163",
      "size": 46787,
      "priority": "important"
    },
    "/js/assets-min.js": {
      "checksum": "3daf5f9673debad301f5233205bd9dbe",
      "size": 11250,
      "priority": "important"
    },
    "/js/assets.js": {
      "checksum": "a3a16504774a19c7381c88f97917e2fc",
      "size": 22039,
      "priority": "important"
    },
    "/js/bennies.js": {
      "checksum": "67ba4fe44747b4c2aac6b80ccf227de4",
      "size": 8208,
      "priority": "important"
    },
    "/js/blockvue.js": {
      "checksum": "30d1b55966ab14956f7c6486887ca857",
      "size": 47346,
      "priority": "important"
    },
    "/js/buffer.js": {
      "checksum": "e225d02cdfe4a776207cebd5e36052b0",
      "size": 50387,
      "priority": "important"
    },
    "/js/cardvue.js": {
      "checksum": "093a0c748275791b4d55b51baccabaef",
      "size": 28265,
      "priority": "important"
    },
    "/js/chartjs-adapter-date-fns.local.js": {
      "checksum": "cf877b480725fbeb84e0933dc9d1e969",
      "size": 104968,
      "priority": "important"
    },
    "/js/choices-vue.js": {
      "checksum": "78be8b37388c4e7fe3905d813e1f75eb",
      "size": 17670,
      "priority": "important"
    },
    "/js/chrtjscf.js": {
      "checksum": "fc12ff5661845deb93892ad728434bbd",
      "size": 27624,
      "priority": "important"
    },
    "/js/codemirror-xml.min.js": {
      "checksum": "8d67b4230709b35c843970bd30695ab2",
      "size": 6042,
      "priority": "important"
    },
    "/js/codemirror.min.js": {
      "checksum": "2263911552d33d0cf4e43b1ea01413bb",
      "size": 170531,
      "priority": "important"
    },
    "/js/contract-modal.js": {
      "checksum": "dbda483d9c74348cb2603cebdae6b3aa",
      "size": 16489,
      "priority": "important"
    },
    "/js/contracts-vue.js": {
      "checksum": "e79ed2acef7647ceff28855e823ff962",
      "size": 109102,
      "priority": "important"
    },
    "/js/cryptojs.min.js": {
      "checksum": "d9c6de0df2bf028d93924aff92487904",
      "size": 60819,
      "priority": "important"
    },
    "/js/cycler.js": {
      "checksum": "f664b76697d2f4b76bf776284f491c4e",
      "size": 1118,
      "priority": "important"
    },
    "/js/dd.js": {
      "checksum": "359b73a60da7efe421181249ece6f7d2",
      "size": 9257,
      "priority": "important"
    },
    "/js/detailvue.js": {
      "checksum": "3348abd69cbcb94b95dd72e3b3e46bb9",
      "size": 28369,
      "priority": "important"
    },
    "/js/dexvue.js": {
      "checksum": "0a2809aeee5eb1af609bf1bbc84a48bc",
      "size": 50115,
      "priority": "important"
    },
    "/js/diff.js": {
      "checksum": "e771e221748d27a961486d5df12b2471",
      "size": 81155,
      "priority": "important"
    },
    "/js/drag-drop.js": {
      "checksum": "0ec92c44489e6ffbf6ec1234caf84942",
      "size": 13295,
      "priority": "important"
    },
    "/js/drag-sort.js": {
      "checksum": "836d807e5e29d1b90376b008e55ceaa5",
      "size": 2360,
      "priority": "important"
    },
    "/js/election-modal.js": {
      "checksum": "0c3689e8d2efdfd9c11d836bada0d1c8",
      "size": 7480,
      "priority": "important"
    },
    "/js/extend-modal.js": {
      "checksum": "ba61609ef1242c095935a6d60bec203d",
      "size": 6111,
      "priority": "important"
    },
    "/js/extensionvue-old.js": {
      "checksum": "3d09236bed876fd8b322bf03d6177758",
      "size": 18405,
      "priority": "important"
    },
    "/js/extensionvue.js": {
      "checksum": "cde30ba037aeae53a61b4f099dc1c870",
      "size": 18670,
      "priority": "important"
    },
    "/js/filesvue-dd.js": {
      "checksum": "92deee10fbcdaedd724ad7d4068330ac",
      "size": 256814,
      "priority": "important"
    },
    "/js/footvue.js": {
      "checksum": "bfbf2e784a2d1ca7f149a08398bc474c",
      "size": 1333,
      "priority": "important"
    },
    "/js/fttransfer.js": {
      "checksum": "ff5ac6045a4c04aafa46864a8edd4ab2",
      "size": 73613,
      "priority": "important"
    },
    "/js/hive-modal.js": {
      "checksum": "ea94f917f11b19610b6f01efd2935717",
      "size": 32362,
      "priority": "important"
    },
    "/js/img-ipfs.js": {
      "checksum": "c29daa440ebbab74b34d47cbbdcd59f1",
      "size": 2340,
      "priority": "important"
    },
    "/js/indexvue.js": {
      "checksum": "361f81aaa9cf5523af1a4e8a03e53267",
      "size": 28461,
      "priority": "important"
    },
    "/js/marker.js": {
      "checksum": "80e8cd54b6023f1542277eb0e20d0824",
      "size": 4142,
      "priority": "important"
    },
    "/js/methods-modals.js": {
      "checksum": "f08a459f5f5c673932b1c1cd51540e0b",
      "size": 1066,
      "priority": "important"
    },
    "/js/methods-spk.js": {
      "checksum": "e434298a33d0318e41336bcdf551e567",
      "size": 7542,
      "priority": "important"
    },
    "/js/mfi-vue.js": {
      "checksum": "7fbd69d4f3b44ab70507017b7cb61e94",
      "size": 15064,
      "priority": "important"
    },
    "/js/modal-manager.js": {
      "checksum": "051b4cf0394772b91ff1ff0a8a507de0",
      "size": 5286,
      "priority": "important"
    },
    "/js/modalvue.js": {
      "checksum": "a4bcca7b454c2bd1307fb0f70578f6c1",
      "size": 42673,
      "priority": "important"
    },
    "/js/model-viewer.min.js": {
      "checksum": "dd677b435b16f44e4ca08a9f354bac24",
      "size": 955555,
      "priority": "important"
    },
    "/js/nav.js": {
      "checksum": "7ec38d3ee084cc52ed87ba82bad4d563",
      "size": 27637,
      "priority": "important"
    },
    "/js/nftdetail.js": {
      "checksum": "470766883c33ae998ec14ed2b92a4b4e",
      "size": 75619,
      "priority": "important"
    },
    "/js/nftsvue.js": {
      "checksum": "5d644469cc5fd72a991fc3b934768f73",
      "size": 98228,
      "priority": "important"
    },
    "/js/onlyhash-old.js": {
      "checksum": "5fbe0450d3cf05ca50a32db1388d35b7",
      "size": 209217,
      "priority": "important"
    },
    "/js/onlyhash.js": {
      "checksum": "ce57237fd9402179b8dfd8ef7aa1e1be",
      "size": 707437,
      "priority": "important"
    },
    "/js/pop-frame.js": {
      "checksum": "679aed3281bcee07fb3942a985e7dbbe",
      "size": 904,
      "priority": "important"
    },
    "/js/pop.js": {
      "checksum": "679aed3281bcee07fb3942a985e7dbbe",
      "size": 904,
      "priority": "important"
    },
    "/js/postvue.js": {
      "checksum": "23b5ec30b0ff7ce18499942e47789220",
      "size": 12968,
      "priority": "important"
    },
    "/js/purify.min.js": {
      "checksum": "6d6eab0b233005b7be97072e5b9e1011",
      "size": 21490,
      "priority": "important"
    },
    "/js/ratings.js": {
      "checksum": "4f26b88271c105408b4864bf8a2f41fc",
      "size": 1651,
      "priority": "important"
    },
    "/js/replies.js": {
      "checksum": "11bf9ccbe0d13113a5922cca8ae2f5a0",
      "size": 5916,
      "priority": "important"
    },
    "/js/scene.js": {
      "checksum": "bca438e6266fb5ef7641777666c95e80",
      "size": 54630,
      "priority": "important"
    },
    "/js/setcard.js": {
      "checksum": "a2f10e9bed812046f0d49a8a6a339d6f",
      "size": 2890,
      "priority": "important"
    },
    "/js/showdown.js": {
      "checksum": "c619f8b780850eff22845d1091cfa776",
      "size": 3760,
      "priority": "important"
    },
    "/js/spk-js.js": {
      "checksum": "f5907a46fadd42a17504c9aa6a4978b8",
      "size": 564485,
      "priority": "important"
    },
    "/js/spk-wallet.js": {
      "checksum": "cf351a48a612547603168581852e5f91",
      "size": 70890,
      "priority": "important"
    },
    "/js/spkdrive.js": {
      "checksum": "02c21acc7dfbb2c707cf4294b3d8b4f5",
      "size": 81999,
      "priority": "important"
    },
    "/js/spkvue.js": {
      "checksum": "cd8d7cde16ee3bf4d91fd003a47870c9",
      "size": 93022,
      "priority": "important"
    },
    "/js/standard-modal.js": {
      "checksum": "5293322d7f75e2e2f70eb203c644230d",
      "size": 7356,
      "priority": "important"
    },
    "/js/stwidget.js": {
      "checksum": "0b8f564f8fc83e2587d7cdd557330753",
      "size": 25863,
      "priority": "important"
    },
    "/js/tagifyvue.js": {
      "checksum": "8c083377956e9a936f47a35f45afc951",
      "size": 1127,
      "priority": "important"
    },
    "/js/toastvue.js": {
      "checksum": "15a042f49546393a84afe492cbe516d3",
      "size": 2374,
      "priority": "important"
    },
    "/js/trading-vue.min.js": {
      "checksum": "6e6bb2f8dd6f94e2c8656759eafc1a26",
      "size": 264037,
      "priority": "important"
    },
    "/js/upload-everywhere.js": {
      "checksum": "a0455b92bdad32d2e0679d651f05a48d",
      "size": 16936,
      "priority": "important"
    },
    "/js/uploadvue-dd.js": {
      "checksum": "978a6e897afe24018e764752d8431b09",
      "size": 83367,
      "priority": "important"
    },
    "/js/uuidv.js": {
      "checksum": "e64fbbb49c9b48c9fb15e778de8d86ad",
      "size": 1105,
      "priority": "important"
    },
    "/js/vote.js": {
      "checksum": "1a7b77e81743317a96abae74a0ed4985",
      "size": 6049,
      "priority": "important"
    },
    "/js/voting-modal.js": {
      "checksum": "10fae48422e8e57ca87422eeeae572e2",
      "size": 7220,
      "priority": "important"
    },
    "/js/vrvue.js": {
      "checksum": "6bbc49bfb951d36970d055bb8821d7d7",
      "size": 45078,
      "priority": "important"
    },
    "/js/vueme.js": {
      "checksum": "6b8aad97a23415fedecc051f98630761",
      "size": 150757,
      "priority": "important"
    },
    "/js/vueqr.js": {
      "checksum": "e5e2b75ee9fdc510a95b5d6de0c3e415",
      "size": 18813,
      "priority": "important"
    },
    "/js/watchers-common.js": {
      "checksum": "44cc578056cb32138f1a99d613a12633",
      "size": 407,
      "priority": "important"
    },
    "/lang/en.js": {
      "checksum": "a613800bae0e1b2e73add8f719340272",
      "size": 5689,
      "priority": "important"
    },
    "/new/360-gallery/index.html": {
      "checksum": "4c2f4cfbf14726961db685c19b2c0471",
      "size": 10256,
      "priority": "important"
    },
    "/new/advanced/index.html": {
      "checksum": "241247f62af0f07334fcf9b4f6602a0a",
      "size": 34013,
      "priority": "important"
    },
    "/nfts/create/index.html": {
      "checksum": "03778f5c95e40e680dd6c1b6d6309a7b",
      "size": 50768,
      "priority": "important"
    },
    "/nfts/set/index.html": {
      "checksum": "54f1eb73c26f7480edb19e21fa64a57d",
      "size": 43225,
      "priority": "important"
    },
    "/nfts/sets/index.html": {
      "checksum": "f8522bbadcf9ac6f4d8112b8bca63b9b",
      "size": 9939,
      "priority": "important"
    },
    "/node/index.html": {
      "checksum": "b700ce842921bc856a27bb24eab5d321",
      "size": 12981,
      "priority": "important"
    },
    "/open.html": {
      "checksum": "902b0c3c4b34e27f0df076329353b481",
      "size": 5699,
      "priority": "important"
    },
    "/open/index.html": {
      "checksum": "14f053cf793e6b6d9a08ab1ccc8b41d4",
      "size": 5426,
      "priority": "important"
    },
    "/storage/index.html": {
      "checksum": "7495d5308f64220f83cc23e0137d97c5",
      "size": 12417,
      "priority": "important"
    },
    "/update.html": {
      "checksum": "31d6f64d57f21cd9492f2bfc62657e3c",
      "size": 11378,
      "priority": "important"
    },
    "/update/index.html": {
      "checksum": "8ab59538a55dcb50a2787af75975ff12",
      "size": 30809,
      "priority": "important"
    },
    "/user/detailmodal.html": {
      "checksum": "262ab96e38f539f099642c426038e677",
      "size": 88809,
      "priority": "important"
    },
    "/vid/stills/blue_dust.jpg": {
      "checksum": "9048079c05ff24442ab88599d7e8920f",
      "size": 63175,
      "priority": "important"
    },
    "/vid/stills/connected_dots.jpg": {
      "checksum": "48953804461101ec1d484b86193d9463",
      "size": 627998,
      "priority": "important"
    },
    "/vid/stills/data_lake.jpg": {
      "checksum": "9330f312da73d45ae0c6d503ebaa35aa",
      "size": 452432,
      "priority": "important"
    },
    "/vid/stills/floating_abstract.jpg": {
      "checksum": "b57ba5c015102610c3f1844c79d432e3",
      "size": 274779,
      "priority": "important"
    },
    "/vid/stills/glowing_hexagon.jpg": {
      "checksum": "c4c67dd6fe719ebd2b56cc2d6a66157e",
      "size": 260964,
      "priority": "important"
    },
    "/vid/stills/gold_wave.jpg": {
      "checksum": "1b610f7ec6798a0c2ef1215791f49f88",
      "size": 521372,
      "priority": "important"
    },
    "/vid/stills/orange_cube.jpg": {
      "checksum": "3917fc5c39d416fc084c46d06c480a4b",
      "size": 631596,
      "priority": "important"
    },
    "/vr/vue.html": {
      "checksum": "6a79a38b2ea49ca30ff547563f9f1efd",
      "size": 1218,
      "priority": "important"
    },
    "/ipfs/current.html": {
      "checksum": "6fdaac0d71563adc33a1d97ae1880d34",
      "size": 9187,
      "priority": "important"
    },
    "/ipfs/index.html": {
      "checksum": "bf2eee011da21b0a7f58dc6bf1463861",
      "size": 8923,
      "priority": "important"
    },
    "/img/crypto/bnb.svg": {
      "checksum": "60ca7a9d786038944537c250266c63dc",
      "size": 399,
      "priority": "important"
    },
    "/img/crypto/ethereum.svg": {
      "checksum": "54b6a875127d0b7c67a45fdd96e2cedc",
      "size": 306,
      "priority": "important"
    },
    "/img/crypto/polygon.svg": {
      "checksum": "fa36cccf8cf4f5a620caeade8f7cf8a5",
      "size": 321,
      "priority": "important"
    },
    "/img/crypto/solana.svg": {
      "checksum": "e7689ba617436aa6551ec68b4cb1f612",
      "size": 289,
      "priority": "important"
    },
    "/img/wallets/coinbase.svg": {
      "checksum": "4b387163f5f61e77d5dc26015370b7ff",
      "size": 344,
      "priority": "important"
    },
    "/img/wallets/metamask.svg": {
      "checksum": "7cfd65ef1830c13da772be92917819d7",
      "size": 397,
      "priority": "important"
    },
    "/img/wallets/phantom.svg": {
      "checksum": "c93ce1216ab2e6ea877e2e55d4a2274a",
      "size": 383,
      "priority": "important"
    },
    "/img/wallets/trust.svg": {
      "checksum": "cd66e6fa039cdc560fe0b11a7921383e",
      "size": 363,
      "priority": "important"
    },
    "/img/wallets/walletconnect.svg": {
      "checksum": "5740d34ff67b77f017d12a78e945c656",
      "size": 441,
      "priority": "important"
    },
    "/img/hivesigner_white.svg": {
      "checksum": "504a9fab6111a49d6cdbb73804c4aa15",
      "size": 6318,
      "priority": "important"
    },
    "/create/index.html": {
      "checksum": "5a3d0842df9543804d26ccfdeafdb495",
      "size": 11922,
      "priority": "page-specific"
    },
    "/js/v3-qr.js": {
      "checksum": "5db5beb32c7405db97d75ba76f8997ef",
      "size": 120367,
      "priority": "page-specific"
    },
    "/aframe-builder/index.html": {
      "checksum": "03e5a74732c20329e874a40f36526064",
      "size": 388601,
      "priority": "page-specific"
    },
    "/aframe-builder/aframe.min.js": {
      "checksum": "9cc0b1c7c368abf433695fb93d4e4f9c",
      "size": 1277800,
      "priority": "page-specific"
    },
    "/js/aframe.min.js": {
      "checksum": "cf139ab9b75ee8fea3661385b5c50d45",
      "size": 1277902,
      "priority": "page-specific"
    },
    "/js/aframe-extras.min.js": {
      "checksum": "0a0818f80d22eea6b402187404738a23",
      "size": 170829,
      "priority": "page-specific"
    },
    "/js/aframe-environment-component.min.js": {
      "checksum": "b24c9108753f2af21987ba83c9674ff1",
      "size": 49209,
      "priority": "page-specific"
    },
    "/img/aframe.png": {
      "checksum": "8361db7f31590be699b6ca82a3ba2edd",
      "size": 38148,
      "priority": "page-specific"
    },
    "/naf-playground/aframe/aframe.min.js": {
      "checksum": "9cc0b1c7c368abf433695fb93d4e4f9c",
      "size": 1277800,
      "priority": "page-specific"
    },
    "/naf-playground/aframe/networked-aframe.min.js": {
      "checksum": "4b25bad9a7b40896916bcb097db405ba",
      "size": 98119,
      "priority": "page-specific"
    },
    "/naf-playground/assets/textures/sky/milkyway.jpg": {
      "checksum": "82c7278828d85ace9036d87c72801e20",
      "size": 124780,
      "priority": "page-specific"
    },
    "/naf-playground/css/styles.css": {
      "checksum": "d19be71b5d2619d7bd403bc6f4e5fa39",
      "size": 15467,
      "priority": "page-specific"
    },
    "/naf-playground/monaco-editor/vs/loader.js": {
      "checksum": "bb6e6a026f04f24eab30a3924c8ccd30",
      "size": 30051,
      "priority": "page-specific"
    },
    "/naf-playground/monaco-editor/vs/editor/editor.main.js": {
      "checksum": "8216718a32af36c4cb9484476d428d08",
      "size": 3766654,
      "priority": "page-specific"
    },
    "/naf-playground/monaco-editor/vs/editor/editor.main.css": {
      "checksum": "77292b9ceb0cf21d9c34fdcf95b9b356",
      "size": 131858,
      "priority": "page-specific"
    },
    "/naf-playground/monaco-editor/vs/language/html/htmlMode.js": {
      "checksum": "c8d05bfbd0ee3e74b9377afc77413d14",
      "size": 33634,
      "priority": "page-specific"
    },
    "/naf-playground/monaco-editor/vs/language/css/cssMode.js": {
      "checksum": "c116d50b0b63ce239bac1f764f38c7f8",
      "size": 33094,
      "priority": "page-specific"
    },
    "/playground/index.html": {
      "checksum": "a40b4d9eb168858b68b1f39cae6dbc25",
      "size": 48385,
      "priority": "page-specific"
    },
    "/naf-playground/index.html": {
      "checksum": "223912dc42e4110cf8928ba9ce48dc8b",
      "size": 30659,
      "priority": "page-specific"
    },
    "/naf-playground/js/main.js": {
      "checksum": "47fcbdb23a77e0b134f985c967662009",
      "size": 645,
      "priority": "page-specific"
    },
    "/naf-playground/css/style.css": {
      "checksum": "7597b95ad89083ebdd726b24009e0c5c",
      "size": 4283,
      "priority": "page-specific"
    },
    "/js/aframe.min.js": {
      "checksum": "cf139ab9b75ee8fea3661385b5c50d45",
      "size": 1277902,
      "priority": "page-specific"
    },
    "/js/aframe-extras.min.js": {
      "checksum": "0a0818f80d22eea6b402187404738a23",
      "size": 170829,
      "priority": "page-specific"
    },
    "/chat/index.html": {
      "checksum": "319e465189cdb6ccfda4fe045fa68cca",
      "size": 3707,
      "priority": "page-specific"
    },
    "/chat/gpt.html": {
      "checksum": "f1a43900d7a03cb4b9780f24fbff9999",
      "size": 12892,
      "priority": "page-specific"
    },
    "/js/chatvue.js": {
      "checksum": "42c56d94e0753ac58265d3af75a59f55",
      "size": 6802,
      "priority": "page-specific"
    },
    "/img/chatgpt-icon.png": {
      "checksum": "3d4f973524b864115f67d06857692785",
      "size": 6221,
      "priority": "page-specific"
    },
    "/mint/index.html": {
      "checksum": "73c43be41af75559fe6f62d37c708e3f",
      "size": 4258,
      "priority": "page-specific"
    },
    "/new/index.html": {
      "checksum": "59f4c2d70897a27129b027de25399fa9",
      "size": 37840,
      "priority": "page-specific"
    },
    "/new/token/index.html": {
      "checksum": "708cc079c59c737b57994a060249d4e6",
      "size": 45175,
      "priority": "page-specific"
    },
    "/js/uploadvue.js": {
      "checksum": "782c2046067b740080e90050db6d60a6",
      "size": 62462,
      "priority": "page-specific"
    },
    "/js/nftcard.js": {
      "checksum": "eab916cf74635206cdd5cd2d9f7382ca",
      "size": 18323,
      "priority": "page-specific"
    }
  }
}
;
