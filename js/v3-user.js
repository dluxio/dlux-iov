//import Vue from "https://cdn.jsdelivr.net/npm/vue@2.6.14/dist/vue.esm.browser.js";
import { createApp, toRaw } from '/js/vue.esm-browser.js'
import Navue from "/js/v3-nav.js";
import FootVue from "/js/footvue.js";
import Cycler from "/js/cycler.js";
import Popover from "/js/popover.js";
import ModalVue from "/js/modal-manager.js";
import Marker from "/js/marker.js";
import Ratings from "/js/ratings.js";
import MDE from "/js/mde.js";
import CollaborativeDocs from "/js/collaborative-docs.js";
import CollaborativePostEditor from "/js/collaborative-post-editor.js";
import SimpleFieldEditor from "/js/simple-field-editor.js";
import JsonEditor from "/js/json-editor.js";
import ChoicesVue from '/js/choices-vue.js';
import Replies from "/js/replies.js";
import CardVue from "/js/cardvue.js";
import Tagify from "/js/tagifyvue.js";
import ContractVue from "/js/spkdrive.js";
import FilesVue from "/js/filesvue.js";
import ExtensionVue from "/js/extensionvue.js";
import UploadVue from "/js/uploadvue.js";
import PostVue from "/js/postvue.js";
import DetailVue from "/js/detailvue.js";
import NFTCard from "/js/nftcard.js";
import FTTransfer from "/js/fttransfer.js";
import NFTDetail from "/js/nftdetail.js";
import SPKVue from "/js/spk-wallet.js";
import Assets from "/js/assets.js"
import MFI from "/js/mfi-vue.js";
import UploadEverywhere from "/js/upload-everywhere.js";
import TiptapEditorModular from "/js/tiptap-editor-modular.js";
import Asset360Manager from "/js/components/360-asset-manager.js";
import DappManager from "/js/components/dapp-manager.js";
import RemixDappManager from "/js/components/remix-dapp-manager.js";
import MCommon from '/js/methods-common.js'

// API Constants
const HIVE_API = localStorage.getItem("hapi") || "https://hive-api.dlux.io";
const LARYNX_API = "https://spkinstant.hivehoneycomb.com";
const DUAT_API = "https://duat.hivehoneycomb.com";
const DLUX_TOKEN_API = "https://token.dlux.io";
const SPK_TEST_API = "https://spktest.dlux.io";
const DLUX_DATA_API = "https://data.dlux.io";
const COINGECKO_API = "https://api.coingecko.com/api/v3/simple/price";

let url = location.href.replace(/\/$/, "");
let lapi = "",
  sapi = "https://spkinstant.hivehoneycomb.com";
if (location.search) {
  const string = location.search.replace("?", "");
  let params = string.split("&");
  for (let i = 0; i < params.length; i++) {
    let param = params[i].split("=");
    if (param[0] == "sapi") {
      sapi = param[1];
    }
  }
  //window.history.replaceState(null, null, "?api=" + lapi);
}
if (location.search) {
  const string = location.search.replace("?", "");
  let params = string.split("&");
  for (let i = 0; i < params.length; i++) {
    let param = params[i].split("=");
    if (param[0] == "lapi") {
      lapi = param[1];
    }
  }
  //window.history.replaceState(null, null, "?api=" + lapi);
}
// if (location.hash && !lapi) {
//     const hash = url.split("#");
//     if (hash[1].includes("dlux")) {
//         lapi = "https://token.dlux.io";
//     } else if (hash[1].includes("larynx")) {
//         lapi = "https://spkinstant.hivehoneycomb.com";
//     } else if (hash[1].includes("duat")) {
//         lapi = "https://duat.hivehoneycomb.com";
//     }
// }
if (!lapi) {
  lapi = "https://token.dlux.io";
}
// if (
//   lapi == "https://token.dlux.io" ||
//   lapi == "https://spkinstant.hivehoneycomb.com" ||
//   lapi == "https://inconceivable.hivehoneycomb.com"
// ) {
//   //window.history.replaceState(null, null, "dex");
// }
let user = localStorage.getItem("user") || "GUEST";
let hapi = HIVE_API; // Use constant instead of hardcoded fallback

// var app = new Vue({
// vue 2
// el: "#app", // vue 2
createApp({
  directives: {
    //scroll
  },
  data() {
    return {
      rcAccount: null,
      signedtx: [],
      hpDelegationsOut: [],
      hpDelegationsIn: [],
      rcDelegationsOut: [],
      rcDelegationsIn: [],
      delegationsFetched: false,
      rcAccounts: {},
      isLoading: false,
      error: null,
      fileRequests: {},
      protocol: {},
      sapi: 'https://spktest.dlux.io',
      videosrc: null,
      videoMsg: "Drop a video file to transcode",
      ffmpeg: "Loading...",
      showLine: true,
      videoUploadContract: false,
      showvideoupload: false,
      dataURLS: [],
      debounceScroll: 0,
      rcCost: {
        time: 0,
        claim_account_operation: { "operation": "claim_account_operation", "rc_needed": "11789110900859", "hp_needed": 6713.599180835442 }
      },
      csvError: "", // Added for CSV upload error messages
      lastScroll: 0,
      contractsLoaded: false, // Track if drive content has been loaded
      activeTab: "blog",
      accountDistributionChart: null, // Added for account distribution chart
      typeDistributionChart: null, // Added for type distribution chart
      relations: { "follows": false, "ignores": false, "blacklists": false, "follows_blacklists": false, "follows_muted": false },
      sets: {},
      chains: {
        dlux: {
          enabled: false,
          api: "https://token.dlux.io",
          sets: {},
          multisig: "dlux-cc",
          dataAPI: "https://data.dlux.io"
        },
        duat: {
          enabled: false,
          api: "https://duat.hivehoneycomb.com",
          sets: {},
          multisig: "ragnarok-cc",
        }
      },
      nameIP: "",
      pendingTokens: [],
      newAccountDeets: true,
      newAccount: {
        name: "",
        password: "",
        auths: {},
        msg: "Checking Account...",
        fee: 0,
        ACTcost: 0,
      },
      dotEnv: "",
      dotEnvTemplate: `domain=$DOMAIN
account=$ACCOUNT
active=
msowner=$OWNER
mspublic=$PUBOWNER
PORT=3000
`,
      newToken: {
        token: "",
        longname: "",
        icon: "",
        des: "",
        wp: "",
        precision: 3,
        tag: "",
        jsontoken: "",
        leader: "",
        ben: "",
        mainapi: "",
        decent: true,
        mainrender: "",
        mainfe: "",
        startingblock: 0,
        prefix: "",
        del: "",
        delw: 0,
        ms: "",
        mspubmemo: "",
        msprimemo: "",
        adverts: [],
        footer: "",
        mainico: "",
        mainipfs: "",
        preHiveServiceFee: "0.5",
        hiveServiceFee: 50,
        featpob: true,
        featdel: false,
        featdaily: false,
        featliq: false,
        featico: false,
        featinf: true,
        featdex: true,
        featnft: false,
        featstate: false,
        featdrop: false,
        ipfsrate: 0,
        budgetrate: 0,
        curationrate: 0,
        delegationrate: 0,
        marketingrate: 0,
        maxbudget: 0,
        noderate: 0,
        savingsrate: 0,
        tokensupply: 0,
        apyint: 39563,
        apy: "5.0",
        dist: {},
        configJSON: {
          LEADER: "",
          PREFIX: "",
          TOKEN: "",
          PRECISION: 3,
          TAG: "",
          JSONTOKEN: "",
          MS: "",
          MSPUBMEMO: "",
          MSPRIMEMO: "",
          MAINAPI: "",
          MAINRENDER: "",
          MAINFE: "",
          MAINIPFS: "",
          MAINICO: "",
          FOOTER: "",
          HIVESERVICEFEE: 0,
          FEATPOB: false,
          FEATDEL: false,
          FEATDAILY: false,
          FEATLIQ: false,
          FEATICO: false,
          FEATINF: false,
          FEATDEX: false,
          FEATNFT: false,
          FEATSTATE: false,
          FEATDROP: false,
          IPFSRATE: 0,
          BUDGETRATE: 0,
          CURRATIONRATE: 0,
          DELEGATIONRATE: 0,
          MARKETINGRATE: 0,
          MAXBUDGET: 0,
          NODERATE: 0,
          SAVINGSRATE: 0,
          TOKENSUPPLY: 0,
          APYINT: 0,
          DIST: {},
          POWDIST: {},
          GOVDIST: {},
          BEN: "",
          DEL: "",
          DELW: 0,
          STARTINGBLOCK: 0,
          ADVERTS: [],
          HIVEBAL: 0,
          HBDBAL: 0,
          LONGNAME: "",
          ICON: "",
          DES: "",
          WP: "",

        },
        configText: ``,
      },
      disablePost: true,
      inventory: true,
      mypfp: '/img/no-user.png',
      File: [],
      FileInfo: {},
      postTitle: "",
      postBody: "",
      postTags: "",
      postPermlink: "",
      postCustom_json: {
        "app": "dlux/0.1.0",
        "xr": true,
        "Hash360": "",
        "format": "markdown",
        "assets": [
        ],
        "tags": [
          "dlux"
        ],
        "vrHash": "blog"
      },
      nftTradeTabTo: "",
      reloaded: true,
      nftTradeTabToken: "",
      nftTradeTabPrice: 0,
      nftSellTabToken: "",
      nftSellTabPrice: 0,
      nftAuctionTabToken: "",
      nftAuctionTabPrice: 0,
      nftAuctionTabTime: 0,
      transferMint: false,
      transferModal: {},
      transferTabTo: "",
      toSign: {},
      account: user,
      focusItem: {
        token: "dlux",
      },
      FTtrades: [],
      NFTtrades: [],
      FTmenu: {
        to: "",
        amount: 0,
      },
      NFTmenu: {
        to: "",
        amount: 0,
      },
      providers: [
        { api: "https://token.dlux.io", token: "dlux" },
        { api: "https://inconceivable.hivehoneycomb.com", token: "duat" },
      ],
      scripts: {},
      nftscripts: {},
      types: 'ts,img',
      baseScript: {},
      NFTs: [],
      rNFTs: [],
      allNFTs: [],
      saleNFTs: [],
      auctionNFTs: [],
      itemModal: {
        hidden: true,
        item: {
          setname: "",
          set: {},
          uid: "",
          owner: "",
        },
        items: [],
        index: 0,
        auction: {
          bidder: "",
          bids: 0,
          buy: "",
          by: "",
          days: 30,
          initial_price: {
            amount: "",
            token: "",
            precision: 2,
          },
          name_long: "",
          price: {
            amount: "",
            token: "",
            precision: 2,
          },
          script: "",
          set: "",
          setname: "",
          time: "",
        },
        sale: {
          by: "",
          name_long: "",
          price: {
            amount: "",
            token: "",
            precision: 2,
          },
          script: "",
          set: "",
          setname: "",
          uid: "",
        },
      },
      selectedNFTs: [],
      contractIDs: {},
      NFTselect: {
        start: 0,
        amount: 30,
        searchTerm: "",
        searchDefault: "Search UIDs and ",
        searchDeep: false,
        searchDeepKey: "",
        searchDeepK: false,
        saleOnly: false,
        auctionOnly: false,
        dir: "asc",
        sort: "uid",
        showDeleted: false,
        searching: false,
      },
      focusSetCalc: {
        owners: 0,
        deleted: 0,
        af: {
          HIVE: 0,
          HBD: 0,
          TOKEN: 0,
        },
        sf: {
          HIVE: 0,
          HBD: 0,
          TOKEN: 0,
        },
        forSale: 0,
        forAuction: 0,
        forSaleMint: 0,
        forAuctionMint: 0,
        attributeKeys: [],
        attributes: {},
        attributesC: {},
        amf: {
          HIVE: 0,
          HBD: 0,
          TOKEN: 0,
        },
        smf: {
          HIVE: 0,
          HBD: 0,
          TOKEN: 0,
        },
      },
      iOwn: [],
      iOwnCheckbox: false,
      highBidder: [],
      highBidderCheckbox: false,
      auctions: [],
      sales: [],
      price: {},
      mintAuctions: [],
      mintSales: [],
      mintData: [],
      activeIndex: 0,
      giveFTusername: "",
      giveFTqty: 1,
      services: {},
      NFTselect: {
        start: 0,
        amount: 30,
        searchTerm: "",
        searchDefault: "Search Inventory",
        searchDeep: false,
        searchDeepKey: "",
        searchDeepK: false,
        saleOnly: false,
        auctionOnly: false,
        dir: "asc",
        sort: "uid",
        showDeleted: false,
        searching: false,
      },
      ipfsProviders: {},
      accountRNFTs: [],
      accountNFTs: [],
      displayNFTs: [],
      mint_detail: {
        set: "",
        setname: "",
        token: "",
      },
      focusSet: {
        computed: {},
        link: "",
        fee: {
          amount: "",
          token: "",
          precision: 2,
        },
        bond: {
          amount: "",
          token: "",
          precision: 2,
        },
        setname: "dlux",
        set: {},
        permlink: "",
        author: "",
        script: "",
        encoding: "",
        royalty: 1,
        type: 1,
        name: "",
        minted: 0,
        max: 0,
      },
      pageAccount: "",
      pagePermlink: "",
      pfp: {
        setname: "",
        uid: "",
      },
      hasDrop: false,
      focus: {
        account: "",
        posting_json_metadata: {
          profile: {
            about: "",
          },
        },
        hbd: {
          pendingInterestHbd: 0,
          canClaimInterest: 0,
          nextClaimDate: 0
        }
      },
      hbdclaim: {},
      focusdata: {
        balance: 0,
        gov: 0,
        claim: 0,
        poweredUp: 0,
      },
      spkStats: {
        spk_rate_ldel: "0.00015",
        spk_rate_lgov: "0.001",
        spk_rate_lpow: "0.0001",
      },
      saccountapi: {
        balance: 0,
        spk: 0,
        gov: 0,
        tick: 0.01,
        claim: 0,
        granted: {
          t: 0,
        },
        granting: {
          t: 0,
        },
        poweredUp: 0,
        powerDowns: [],
        power_downs: {},
        drop: {
          last_claim: 0,
          availible: {
            amount: 0,
          },
        },
      },
      dluxval: 0,
      spkval: 0,
      focusval: 0,
      me: false,
      sendModal: {
        amount: 0,
        to: "",
        TOKEN: "DLUX",
      },
      dropnai: "",
      balance: "0.000",
      bartoken: "",
      barhive: "",
      barhbd: "",
      bargov: "",
      barpow: "",
      buyFormValid: false,
      sellFormValid: false,
      govFormValid: false,
      powFormValid: false,
      sendFormValid: false,
      hiveFormValid: false,
      hbdFormValid: false,
      lapi: lapi,
      larynxbehind: -1,
      hapi: hapi,
      accountapi: {
        balance: 0,
        gov: 0,
        tick: 0.01,
        claim: 0,
        poweredUp: 0,
        power_downs: {},
        gov_downs: {},
        head_block: 0,
        drop: {
          last_claim: 0,
          availible: {
            amount: 0,
          },
        },
      },
      hiveprice: {
        hive: {
          usd: 1,
        },
      },
      hbdprice: {
        hive_dollar: {
          usd: 1,
        },
      },
      nodes: {},
      runners: [],
      runnersSearch: [],
      marketnodes: {},
      smarkets: {
        node: {
          na: {
            self: "",
          },
        },
      },
      sstats: {
        spk_rate_lgov: "0.001",
        spk_rate_lpow: "0.0001",
        spk_rate_ldel: "0.00015",
      },
      dexapi: {
        markets: {
          hive: {
            tick: 0.001,
          },
          hbd: {
            tick: 0.001,
          },
        },
      },
      prefix: "",
      multisig: "",
      jsontoken: "",
      node: "",
      spk2gov: false,
      dlux2gov: false,
      showTokens: {},
      behind: "",
      stats: {},
      hivestats: {
        total_vesting_fund_hive: 0,
        total_vesting_shares: 0,
      },
      denoms: {
        HIVE: {
          checked: false,
          balance: 0
        },
        HBD: {
          checked: false,
          balance: 0
        },
      },
      behindTitle: "",
      builder: false,
      petitionStatus: "Choose One",
      TOKEN: "DLUX",
      sendTo: "",
      sendAmount: 0,
      sendMemo: "",
      sendAllowed: false,
      sendHiveTo: "",
      sendHiveAllowed: false,
      sendHiveAmount: 0,
      sendHiveMemo: "",
      sendHBDTo: "",
      sendHBDAllowed: false,
      sendHBDAmount: 0,
      sendHBDMemo: "",
      rewardFund: {},
      feedPrice: {},
      recenthive: {},
      recenthbd: {},
      openorders: [],
      toasts: [],
      tokenGov: {
        title: "SPK VOTE",
        options: [
          {
            id: "spk_cycle_length",
            range_low: 28800,
            range_high: 2592000,
            info: "Time in blocks to complete a power down cycle. 4 cycles to completely divest. 28800 blocks per day.",
            val: 200000,
            step: 1,
            unit: "Blocks",
            title: "Down Power Period"
          },
          {
            id: "dex_fee",
            range_low: 0,
            range_high: 0.01,
            info: "Share of DEX completed DEX trades to allocate over the collateral group.",
            val: 0.00505,
            step: 0.000001,
            unit: "",
            title: "DEX Fee"
          },
          {
            id: "dex_max",
            range_low: 28800,
            range_high: 2592000,
            info: "Largest open trade size in relation to held collateral.",
            val: 97.38,
            step: 1,
            unit: "%",
            title: "Max Trade Size"
          },
          {
            id: "dex_slope",
            range_low: 0,
            range_high: 100,
            info: "0 Allows any size buy orders to be placed. 1 will disallow large buy orders at low prices.",
            val: 48.02,
            step: 0.01,
            unit: "%",
            title: "Max Lowball Trade Size"
          },
          {
            id: "spk_rate_ldel",
            range_low: 0.00001, //current lpow
            range_high: 0.0001, //current lgov
            info: "SPK generation rate for delegated LARYNX Power",
            val: 0.00015,
            step: 1,
            unit: "",
            title: "SPK Gen Rate: Delegated"
          },
          {
            id: "spk_rate_lgov",
            range_low: 0.00015, //current ldel
            range_high: 0.01,
            info: "SPK generation rate for Larynx Locked",
            val: 0.001,
            step: 0.000001,
            unit: "",
            title: "SPK Gen Rate: Locked"
          },
          {
            id: "spk_rate_lpow",
            range_low: 0.000001,
            range_high: 0.00015, //current ldel
            info: "SPK generation rate for undelegated Larynx Power",
            val: 0.0001,
            step: 0.000001,
            unit: "",
            title: "Min SPK Gen Rate: Min"
          },
          {
            id: "max_coll_members",
            range_low: 25,
            range_high: 79,
            info: "The Max number of accounts that can share DEX fees. The richer half of this group controls outflows from the multisig wallet.",
            val: 25,
            step: 1,
            unit: "Accounts",
            title: "Size of collateral group"
          }
        ]
      },
      features: {
        claim_id: "claim",
        claim_S: "Airdrop",
        claim_B: true,
        claim_json: "drop",
        rewards_id: "shares_claim",
        rewards_S: "Rewards",
        rewards_B: true,
        rewards_json: "claim",
        rewardSel: false,
        reward2Gov: false,
        send_id: "send",
        send_S: "Send",
        send_B: true,
        send_json: "send",
        powup_id: "power_up",
        powup_B: false,
        pow_val: "",
        powdn_id: "power_down",
        powdn_B: false,
        powsel_up: true,
        govup_id: "gov_up",
        govup_B: true,
        gov_val: "",
        govsel_up: true,
        govdn_id: "gov_down",
        govdn_B: true,
        node: {
          id: "node_add",
          opts: [
            {
              S: "Domain",
              type: "text",
              info: "https://no-trailing-slash.com",
              json: "domain",
              val: "",
            },
            {
              S: "DEX Fee Vote",
              type: "number",
              info: "500 = .5%",
              max: 1000,
              min: 0,
              json: "bidRate",
              val: "",
            },
            {
              S: "DEX Max Vote",
              type: "number",
              info: "10000 = 100%",
              max: 10000,
              min: 0,
              json: "dm",
              val: "",
            },
            {
              S: "DEX Slope Vote",
              type: "number",
              info: "10000 = 100%",
              max: 10000,
              min: 0,
              json: "ds",
              val: "",
            },
            {
              S: "DAO Claim Vote",
              type: "number",
              info: "1500 = 15%",
              max: 10000,
              min: 0,
              json: "dv",
              val: "",
            },
          ],
        },
      },
      accountinfo: {},
      rcinfo: {
        current: 0,
        max: 0
      },
      serviceWorker: false,
      filterusers: {
        checked: true,
        value: "",
      },
      filteraccount: {
        checked: false,
        value: "",
        usera: false,
        userd: false,
        gova: false,
        govd: true,
        apia: false,
        apid: false,
      },
      lockgov: {
        checked: true,
      },
      unlockgov: {
        checked: false,
      },
      buyhive: {
        checked: true,
      },
      buyhbd: {
        checked: false,
      },
      buylimit: {
        checked: true,
      },
      buymarket: {
        checked: false,
      },
      selllimit: {
        checked: true,
      },
      sellmarket: {
        checked: false,
      },
      pwrup: {
        checked: true,
      },
      pwrdown: {
        checked: false,
      },
      govlock: {
        checked: true,
      },
      govunlock: {
        checked: false,
      },
      posturls: {},
      new: [],
      theirs: [],
      trending: [],
      promoted: [],
      search: [],
      postSelect: {
        sort: "time",
        searchTerm: "",
        bitMask: 0,
        entry: "theirs",
        search: {
          a: 10,
          o: 0,
          e: false,
          p: false,
        },
        new: {
          a: 10, //amount
          o: 0, //offset
          e: false, //end
          p: false, //pending - One pending request
        },
        trending: {
          a: 10,
          o: 0,
          e: false,
          p: false,
        },
        promoted: {
          a: 10,
          o: 0,
          e: false,
          p: false,
        },
        theirs: {
          a: 10,
          o: 0,
          e: false,
          p: false,
        },
        sortDir: "desc",
        types: {
          VR: {
            checked: true,
            icon: "fa-solid fa-vr-cardboard me-2",
            launch: "3D / VR Experience",
            location: "/dlux/@",
            hint: "",
            bitFlag: 1,
          },
          AR: {
            checked: true,
            icon: "fa-solid fa-glasses me-2",
            launch: "AR Experience",
            location: "/dlux/@",
            hint: "",
            bitFlag: 2,
          },
          XR: {
            checked: true,
            icon: "fa-brands fa-unity me-2",
            launch: "Extended Reality Experience",
            location: "/dlux/@",
            hint: "",
            bitFlag: 4,
          },
          APP: {
            checked: true,
            icon: "fa-solid fa-mobile-screen-button me-2",
            launch: "Unstoppable App",
            location: "/dlux/@",
            hint: "",
            bitFlag: 8,
          },
          ["360"]: {
            checked: true,
            icon: "fa-solid fa-globe me-2",
            launch: "360 Photo Gallery",
            location: "/dlux/@",
            hint: "",
            bitFlag: 16,
          },
          ["3D"]: {
            checked: true,
            icon: "fa-solid fa-shapes me-2",
            launch: "3D / VR Experience",
            location: "/dlux/@",
            hint: "",
            bitFlag: 32,
          },
          Audio: {
            checked: true,
            icon: "fa-solid fa-music me-2",
            launch: "Unstoppable Audio",
            location: "/dlux/@",
            hint: "",
            bitFlag: 64,
          },
          Video: {
            checked: true,
            icon: "fa-solid fa-film me-2",
            launch: "Unstoppable Video",
            location: "/dlux/@",
            hint: "",
            bitFlag: 128,
          },
          Blog: {
            checked: false,
            icon: "fa-solid fa-book me-2",
            launch: "Visit Full Blog",
            location: "/blog/@",
            hint: "",
            bitFlag: 256,
          },
        },
      },
      displayPosts: [],
      displayPost: {
        index: 0,
        item: {
          author: "",
          permlink: "",
          ago: "",
          pic: "",
          preview: "",
          appurl: "",
          id: "",
          slider: 10000,
          flag: false,
          title: "",
          type: "360",
          url: "",
          children: [],
          total_payout_value: 0,
          active_votes: [],
          upVotes: 0,
          downVotes: 0,
          body: "",
          json_metadata: {},
          created: "",
        },
        items: [],
      },
      authors: {},
      spkapi: {
        balance: 0,
        broca: '0,0',
        spk: 0,
        channels: [],
        file_contracts: [],
        spk_power: 0,
        gov: 0,
        tick: 0.01,
        claim: 0,
        granted: {
          t: 0,
        },
        granting: {
          t: 0,
        },
        poweredUp: 0,
        powerDowns: [],
        power_downs: {},
        drop: {
          last_claim: 0,
          availible: {
            amount: 0,
          },
        },
      },
      extendcost: {},
      contracts: [],
      numitems: 0,
      postBens: [],
      postOptions: {},
      serviceWorkerPromises: {},
      fileToAddToPost: null,
      spkFileForAssets: null,
      playlistUpdates: {},
      videoFilesToUpload: [],
      ffmpegReady: false,
      ffmpegSkipped: false,
      ffmpeg: null,
              ffmpegDownloadProgress: 0,
        hashingProgress: {
          current: 0,
          total: 0,
          percentage: 0,
          currentFile: ''
        },
        transcodePreview: {
          available: false,
          resolutions: [],
          selectedResolution: null,
          videoSrc: null,
          segmentBlobs: []
        },
        videoObserver: null,
        // Collaborative editing
        collaborativeDocument: null,
        collaborativeDocumentData: {},
        collaborationAuthHeaders: {},
        isCollaborativeMode: false,
        collaborativePermission: null,
        canPostFromCollaboration: false,
    };
  },
  components: {
    "spk-vue": SPKVue,
    "assets-vue": Assets,
    "nav-vue": Navue,
    "foot-vue": FootVue,
    "cycle-text": Cycler,
    "pop-vue": Popover,
    "modal-vue": ModalVue,
    "vue-markdown": Marker,
    "vue-ratings": Ratings,
    "mde": MDE,
    "collaborative-docs": CollaborativeDocs,
    "collaborative-post-editor": CollaborativePostEditor,
    "simple-field-editor": SimpleFieldEditor,
    "json-editor": JsonEditor,
    "replies": Replies,
    "card-vue": CardVue,
    "contract-vue": ContractVue,
    "files-vue": FilesVue,
    "extension-vue": ExtensionVue,
    "upload-vue": UploadVue,
    "post-vue": PostVue,
    "detail-vue": DetailVue,
    "nftcard": NFTCard,
    "fttransfer": FTTransfer,
    "nftdetail": NFTDetail,
    "tagify": Tagify,
    "choices-vue": ChoicesVue,
    "mfi-vue": MFI,
    "upload-everywhere": UploadEverywhere,
    "tiptap-editor-modular": TiptapEditorModular,
    "asset-360-manager": Asset360Manager,
    "dapp-manager": DappManager,
    "remix-dapp-manager": RemixDappManager,
  },
  methods: {
    ...MCommon,
    handleDistFileUpload(event) {
      this.csvError = "";
      const file = event.target.files[0];
      if (!file) {
        return;
      }
      if (file.type !== "text/csv" && !file.name.endsWith('.csv')) {
        this.csvError = "Error: Please select a CSV file.";
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {

        const text = e.target.result;
        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
        if (lines.length === 0) {
          this.csvError = "Error: CSV file is empty.";
          return;
        }
        const newDist = {};
        // Check header or assume order: account,l,p,g
        const header = lines[0].toLowerCase().split(',').map(h => h.trim());
        const accountIndex = header.indexOf('account');
        const lIndex = header.indexOf('l');
        const pIndex = header.indexOf('p');
        const gIndex = header.indexOf('g');

        let startIndex = 0;
        if (accountIndex !== -1 && lIndex !== -1) { // Header detected
            startIndex = 1;
        } else if (header.length >= 2) { // Assume order if no header
             // No specific error, proceed with assumed order if at least 2 columns
        } else {
            this.csvError = "Error: CSV must have at least 'account' and 'l' columns, or be in the order: account, l, p, g.";
            return;
        }

        for (let i = startIndex; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          let account, l, p = 0, g = 0;

          if (startIndex === 1) { // Header was present
            if (values.length <= Math.max(accountIndex, lIndex)) {
              this.csvError = `Error: Line ${i + 1} is missing required account or liquid (l) values.`
              return;
            }
            account = values[accountIndex];
            l = parseFloat(values[lIndex]);
            if (pIndex !== -1 && values[pIndex]) p = parseFloat(values[pIndex]);
            if (gIndex !== -1 && values[gIndex]) g = parseFloat(values[gIndex]);
          } else { // No header, assume order
            if (values.length < 2) {
              this.csvError = `Error: Line ${i + 1} must have at least account and liquid (l) values. Format: account,l,p,g`;
              return;
            }
            account = values[0];
            l = parseFloat(values[1]);
            if (values.length > 2 && values[2]) p = parseFloat(values[2]);
            if (values.length > 3 && values[3]) g = parseFloat(values[3]);
          }

          if (!account) {
            this.csvError = `Error: Account name is missing in line ${i + 1}.`;
            return;
          }
          if (isNaN(l)) {
            this.csvError = `Error: Invalid liquid value for account ${account} in line ${i + 1}. Must be a number.`;
            return;
          }
          if (isNaN(p)) {
            this.csvError = `Error: Invalid power value for account ${account} in line ${i + 1}. Must be a number.`;
            p = 0;
          }
          if (isNaN(g)) {
            this.csvError = `Error: Invalid governance value for account ${account} in line ${i + 1}. Must be a number.`;
            g = 0;
          }
          newDist[account] = { l, p, g };
        }
        this.newToken.dist = { ...this.newToken.dist, ...newDist };
        event.target.value = null; // Reset file input
      };
      reader.onerror = () => {
        this.csvError = "Error: Could not read the file.";
      };
      reader.readAsText(file);
    },
    getSetPhotos(s, c) {
      return s.setname ? `https://ipfs.dlux.io/ipfs/${s.set[c]}` : "";
    },
    callSWfunction(id, o, cb) {
      return new Promise((resolve, reject) => {
        if (activeWorker) {
          if (!o.uid) o.uid = ""
          this.serviceWorkerPromises[`${o.script}:${o.uid}`] = { resolve, reject }
          activeWorker.postMessage({
            id: id,
            o: o
          });
        } else {
          reject(`${id} no controller`);
        }
      })
    },
    getSPKUser() {
      if (this.account) fetch("https://spktest.dlux.io/@" + this.account)
        .then((response) => response.json())
        .then((data) => {
          this.spkapi = data
          for (var node in data.file_contracts) {
            this.contractIDs[data.file_contracts[node].i] = data.file_contracts[node];
            this.contracts.push(data.file_contracts[node]);
            this.contractIDs[data.file_contracts[node].i].index = this.contracts.length - 1;
          }
          var videoUploadContract = false, contractOpen = false
          for (var user in data.channels) {
            for (var node in data.channels[user]) {
              contractOpen = true
              if (this.services[user]) {
                this.services[user].channel = 1
                this.services[user].memo = "Contract Open"
              } else setTimeout(() => {
                if (!this.services[user]) this.services[user] = {}
                this.services[user].channel = 1
                this.services[user].memo = "Contract Open"
              }, 3000)
              if (data.channels[user][node].i.includes('spker')) this.videoUploadContract = this.contractIDs[data.channels[user][node].i]
              if (this.contractIDs[data.channels[user][node].i]) continue
              else {
                this.contractIDs[data.channels[user][node].i] = data.channels[user][node];
                this.contracts.push(data.channels[user][node]);
                this.contractIDs[data.channels[user][node].i].index = this.contracts.length - 1;
              }
            }
          }
          // Check if Hive posting key and SPK key are different and SPK key isn't 'NA'
          if (this.accountinfo.posting && this.spkapi.pubKey !== 'NA' && 
              this.accountinfo.posting.key_auths && 
              this.accountinfo.posting.key_auths[0] && 
              this.accountinfo.posting.key_auths[0][0] !== this.spkapi.pubKey) {
            
            // Create a confirmation dialog with Continue and Cancel buttons
            if (confirm("Your Hive posting public key is different from your SPK public key. Would you like to update your SPK key to match your Hive posting key?")) {
              // User clicked Continue - update the key
              this.updatePubkey();
            } else {
              // User clicked Cancel - do nothing or handle as needed
            }
          }
          
          if (!contractOpen && this.spkapi.pubKey != 'NA'){
            fetch("https://ipfs.dlux.io/upload-promo-contract?user=" + this.account)
              .then((response) => response.json())
              .then((data) => {
                if(data.message == "Contract Sent")setTimeout(() => {
                  this.getSPKUser()
                }, 10000)
              })
          }
        });
    },
    uploadFile(e) {
      for (var i = 0; i < e.target.files.length; i++) {
        var reader = new FileReader();
        reader.File = e.target.files[i]
        reader.onload = (event) => {
          const fileContent = event.target.result;
          for (var i = 0; i < this.File.length; i++) {
            if (
              this.File[i].name == event.currentTarget.File.name
              && this.File[i].size == event.currentTarget.File.size
            ) {
              Hash.of(fileContent).then(async (hash) => {
                var current_contract = "Not found"
                current_contract = { result } = await fetch(`https://spktest.dlux.io/api/file/${hash}`)
                if (current_contract == "Not found") {
                  const dict = { hash, index: i, size: event.currentTarget.File.size, name: event.currentTarget.File.name }
                  this.FileInfo[dict.name] = dict
                } else {
                  alert("File already uploaded")
                }
              })
              break
            }
          }
        };
        reader.readAsBinaryString(e.target.files[i]);
        var File = e.target.files[i];
        File.progress = '..........';
        this.File.push(File);
      }
    },
    hiveApiCall(method, params) {
      const body = JSON.stringify({
        jsonrpc: '2.0',
        method: method,
        params: params,
        id: 1
      });
      return fetch(this.hapi, {
        body: body,
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'POST'
      })
        .then(response => {
          if (!response.ok) {
            // If response is not OK, throw an error with status text
            // This prevents trying to parse non-JSON error pages
            throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
          }
          return response.json(); // Only parse if response is OK
        })
        .then(data => {
          if (data.error) {
            console.error(`Error in ${method}:`, data.error);
            throw new Error(data.error.message);
          }
          return data.result; // Resolve with the result
        })
        .catch(error => {
          console.error(`Error in ${method}:`, error);
          throw error; // Propagate the error
        });
    },
    dragFile(e) {
      for (var i = 0; i < e.dataTransfer.files.length; i++) {
        var reader = new FileReader();
        reader.File = e.dataTransfer.files[i]
        reader.onload = (event) => {
          const fileContent = event.target.result;
          for (var i = 0; i < this.File.length; i++) {
            if (
              this.File[i].name == event.currentTarget.File.name
              && this.File[i].size == event.currentTarget.File.size
            ) {
              Hash.of(fileContent).then(async (hash) => {
                var current_contract = "Not found"
                current_contract = { result } = await fetch(`https://spktest.dlux.io/api/file/${hash}`)
                if (current_contract == "Not found") {
                  const dict = { hash, index: i, size: event.currentTarget.File.size, name: event.currentTarget.File.name }
                  this.FileInfo[dict.name] = dict
                }
              })
              break
            }
          }
        };
        reader.readAsBinaryString(e.dataTransfer.files[i]);
        var File = e.dataTransfer.files[i];
        this.File.push(File);
      }
    },
    togglePin(index) {
      this.File[index].pin = !this.File[index].pin;
    },
    updateMemo(provider, times) {
      if (times < 21) {
        setTimeout(() => {
          this.services[provider].memo = `Sending${times % 3 == 0 ? '.' : times % 3 == 1 ? '..' : '...'}`
          this.updateMemo(provider, times + 1)
        }, 333)
      } else {
        this.services[provider].memo = `Validating`
        this.getSapi()
      }
    },
    updatePubkey() {
      var cja = {
        pubKey: this.accountinfo.posting.key_auths[0][0]
      };
      this.toSign = {
        type: "cja",
        cj: cja,
        id: `spkccT_register_authority`,
        msg: `Registering: ${this.account}:${this.accountinfo.posting.key_auths[0][0]}`,
        ops: ["getSapi"],
        api: sapi,
        txid: `spkccT_register_authority`,
      };
      setTimeout(() => { this.getSPKUser() }, 7000);
    },
    petitionForContract(provider = 'dlux-io',) {
      this.services[provider].memo = 'Preparing'
      this.services[provider].channel = 1
      const address = this.services[provider].address.replace('$ACCOUNT', this.account)
      fetch(address)
        .then(r => r.json())
        .then(json => {
          this.services[provider].memo = "Sending"
          this.updateMemo(provider, 0)
        })
    },
    deleteImg(index) {
      this.File.splice(index, 1)
    },
    validPost() {
      var valid = true
      if (!this.postPermlink) valid = false
      if (!this.postTitle) valid = false;
      if (!this.postBody) valid = false;
      if (!this.postCustom_json.assets.length) valid = false;
      this.disablePost = !valid
    },
    permlink(text) {
      if (text) {
        text.replace(/[\W_]+/g, '-').replace(' ', '-').toLowerCase()
        text = text.replace(' ', '-')
        text = text.replace(/[\W_]+/g, '')
        text = text.toLowerCase()
        this.postPermlink = text
      } else {
        text = this.postTitle
        text = text.replace(' ', '-')
        text = text.replace(/[\W_]+/g, '-')
        text = text.toLowerCase()
        this.postPermlink = text;
      }
    },
    follow(acc, what = 'blog') {
      this.toSign = {
        type: "raw",
        key: "posting",
        op: [["follow", { follower: this.account, following: acc, what: [what] }]],
        callbacks: [res],
        txid: "Sign Auth Headers",
      }
    },
    unfollow(acc) {
      this.toSign = {
        type: "raw",
        key: "posting",
        op: [["follow", { follower: this.account, following: acc, what: [] }]],
        callbacks: [],
        txid: "unfollow:" + acc,
      }
    },
    post() {
      var tags = this.postTags.toLowerCase().split(',')
      this.postCustom_json.tags = ['dlux']
      for (i = 0; i < tags.length; i++) {
        if (tags[i] != 'dlux') {
          this.postCustom_json.tags.push(tags[i].replace(/[\W_]+/g, "-"));
        }
      }
      if (this.account) {
        const operations = [["comment",
          {
            "parent_author": "",
            "parent_permlink": "dlux",
            "author": this.account,
            "permlink": this.postPermlink,
            "title": this.postTitle,
            "body": simplemde.value() + `\n***\n#### [View in VR @ dlux.io](https://dlux.io/dlux/@${this.account}/${this.postPermlink})\n`,
            "json_metadata": JSON.stringify(this.postCustom_json)
          }],
        ["comment_options",
          {
            "author": this.account,
            "permlink": this.postPermlink,
            "max_accepted_payout": "1000000.000 HBD",
            "percent_hbd": 10000,
            "allow_votes": true,
            "allow_curation_rewards": true,
            "extensions":
              [[0,
                {
                  "beneficiaries":
                    [{
                      "account": "dlux-io",
                      "weight": 1000
                    }]
                }]]
          }]]
        hive_keychain.requestBroadcast(localStorage.getItem('user'), operations, 'active', function (response) {
        });
      }
    },
    appFile(data) {
      this.frameData = data
      this.postCustom_json.vrHash = ''
      this.frameURL = ''
      this.dluxMock()
    },
    rcCosts() {
      this.rcCost = JSON.parse(localStorage.getItem("rcCosts")) || {
        time: 0,
        claim_account_operation: { "operation": "claim_account_operation", "rc_needed": "11789110900859", "hp_needed": 6713.599180835442 }
      };
      if (this.rcCost.time < new Date().getTime() - 86400000) fetch("https://beacon.peakd.com/api/rc/costs")
        .then((r) => {
          return r.json();
        })
        .then((re) => {
          for (var i = 0; i < re.costs.length; i++) {
            this.rcCost[re.costs[i].operation] = re.costs[i].rc_needed
          }
          this.rcCost.time = new Date().getTime();
          localStorage.setItem("rcCost", JSON.stringify(this.rcCost));
        });
    },
    addApp(cid, contract) {
      var found = -1
      if (!cid) return false
      for (var i = 0; i < this.postCustom_json.assets.length; i++) {
        if (this.postCustom_json.assets[i].hash == cid) {
          found = i
        }
      }
      if (found == -1) {
        this.postCustom_json.assets.push({
          hash: cid,
          type: 'dApp',
          contract: contract,
        })
      }
      this.postCustom_json.vrHash = cid
      this.frameURL = cid
      this.frameData = ''
      this.dluxMock()
    },
    addAsset(cid, contract, name = '', thumbHash = '', type = 'ts') {
      var found = -1
      if (!cid) return false
      if (typeof cid == 'object') {
        contract = cid.contract
        cid = cid.id
      }
      for (var i = 0; i < this.postCustom_json.assets.length; i++) {
        this.postCustom_json.assets[i].f = 0
        if (this.postCustom_json.assets[i].hash == cid) {
          found = i
        }
      }
      if (found >= 0) {
        this.postCustom_json.assets[found].name = name || this.postCustom_json.assets[found].name
        this.postCustom_json.assets[found].thumbHash = thumbHash || cid
      } else {
        this.postCustom_json.assets.push({
          hash: cid,
          name: name,
          type: type,
          contract: contract,
          thumbHash,
        })
      }
      this.dluxMock()
    },
    splitValues(value, i, delimter = ' ') {
      var values = value.split(delimter)
      return values[i]
    },
    focusAsset(cid, contract, name = '', thumbHash, type = 'ts') {
      var found = -1
      if (!cid) return false
      for (var i = 0; i < this.postCustom_json.assets.length; i++) {
        this.postCustom_json.assets[i].f = 0
        if (this.postCustom_json.assets[i].hash == cid) {
          found = i
        }
      }
      if (found >= 0) {
        this.postCustom_json.assets[found].name = name || this.postCustom_json.assets[found].name
        this.postCustom_json.assets[found].thumbHash = thumbHash || cid
        this.postCustom_json.assets[found].r = `${this.postCustom_json.assets[found].rx || 0} ${this.postCustom_json.assets[found].ry || 0} ${this.postCustom_json.assets[found].rz || 0}`
        this.postCustom_json.assets[found].f = 1
      } else {
        this.postCustom_json.assets.push({
          hash: cid,
          name: name,
          type: type,
          contract: contract,
          thumbHash,
          r: `${this.postCustom_json.assets[found].rx || 0} ${this.postCustom_json.assets[found].ry || 0} ${this.postCustom_json.assets[found].rz || 0}`,
          f: 1
        })
      }
      this.dluxMock()
    },
    changeAppType(type = 'Blog') {
      this.appType = type
      if (type == 'Blog') {
        delete this.postCustom_json.vrHash
      }
      this.postCustom_json.subApp = type
      this.dluxMock()
    },
    delAsset(cid) {
      var found = -1
      if (!cid) return false
      for (var i = 0; i < this.postCustom_json.assets.length; i++) {
        if (this.postCustom_json.assets[i].hash == cid) {
          found = i
        }
      }
      if (found >= 0) {
        this.postCustom_json.assets.splice(found, 1)
      }
      this.dluxMock()
    },
    moveAsset(cid, dir = 'up') {
      var found = -1
      if (!cid) return false
      for (var i = 0; i < this.postCustom_json.assets.length; i++) {
        if (this.postCustom_json.assets[i].hash == cid) {
          found = i
        }
      }
      if ((found >= 1 && dir == 'up') || (found < this.postCustom_json.assets.length - 1 && dir == 'down')) {
        const asset = this.postCustom_json.assets[found]
        this.postCustom_json.assets.splice(found, 1)
        this.postCustom_json.assets.splice(dir == 'up' ? found - 1 : found + 1, 0, asset)
      }
      this.dluxMock()
    },
    resetCamera() {
      // Skip if aframePreview reference doesn't exist (when using new 360° component)
      if (!this.$refs.aframePreview) {
        return;
      }
      
      var target = this.$refs.aframePreview.contentWindow
      target.postMessage({
        'func': 'resetCamera',
        'message': null,
      }, "*");
    },
    dluxMock() {
      // Skip if aframePreview reference doesn't exist (when using new 360° component)
      if (!this.$refs.aframePreview) {
        return;
      }
      
      var result = {
        author: this.account,
        permlink: this.postPermlink,
        title: this.postTitle,
        body: this.postBody,
        json_metadata: JSON.stringify(this.postCustom_json),
        parent_author: '',
        parent_permlink: 'dlux',
      }
      var target = this.$refs.aframePreview.contentWindow
      var un = 'Guest'
      if (this.account) { un = this.account }
      target.postMessage({
        'func': 'iAm',
        'message': un,
      }, "*");
      target.postMessage({
        'func': 'key',
        'message': `markegiles/dlux-vr-tutorial-sm-test`,
      }, "*");
      target.postMessage({
        'func': 'hiveState',
        'message': result,
      }, "*");
    },
    getSetDetailsColors(script) {
      let r = "chartreuse,lawngreen";
      const s = this.baseScript[script];
      if (s && s.set) {
        try {
          r = `${s.set.Color1},${s.set.Color2 ? s.set.Color2 : s.set.Color1}`;
        } catch (e) {
          r = "chartreuse,lawngreen";
        }
      }
      return `linear-gradient(${r})`;
    },
    breakIt(it, reset) {
      if (reset) {
        this.SL = [];
        this.SLN = [];
      }
      var svgStart = it.indexOf("<svg");
      var svgEnd = it.indexOf("</svg>");
      var gStart = it.indexOf("<g");
      var el = document.createElement("svg");
      el.innerHTML = it.substring(gStart, svgEnd);
      var layers = el.childNodes;
      for (var i = 0; i < layers.length; i++) {
        var offset = this.SL.length;
        this.SL.push([]);
        this.SLN.push([layers[i].id || `layer${i + offset}`, []]);
        var items = layers[i].childNodes;
        for (var j = 0; j < items.length; j++) {
          this.SL[i + offset].push(items[j].innerHTML);
          this.SLN[i + offset][1].push(items[j].id || `item${j}`);
        }
      }
      this.svgTag = it.substring(svgStart, gStart);
      if (
        this.svgTag.search("style") > -1 &&
        this.svgTag.search("scoped") == -1
      )
        this.svgTag.replace("<style", "<style scoped");
      this.svgTagClose = it.substring(svgEnd);
    },
    compileScript() {
      return this.baseScript
        .replace("$L", this.scriptify(this.SL))
        .replace("$Y", this.scriptify(this.SLN))
        .replace("$go", this.SA.logo)
        .replace("$b", this.SA.banner)
        .replace("$f", this.SA.featured)
        .replace("$w", this.SA.wrapped)
        .replace("$c1", this.SA.color1)
        .replace("$c2", this.SA.color2)
        .replace("$i", this.SA.faicon)
        .replace("$D", this.SA.description)
        .replace("$l", this.scriptify(this.SA.links))
        .replace("$c", this.scriptify(this.SA.categories));
    },
    scriptify(obj) {
      var s = "";
      if (obj.length) {
        s = "[";
        for (var i = 0; i < obj.length; i++) {
          if (typeof obj[i] == "string") s += `"${obj[i]}"`;
          else if (typeof obj[i] == "number") s += `${obj[i]}`;
          else s += this.scriptify(obj[i]);
          if (i != obj.length - 1) s += ",";
        }
        s += "]";
      } else if (Object.keys(obj).length) {
        var keys = Object.keys(obj);
        s = "{";
        for (var i = 0; i < keys.length; i++) {
          s += `"${keys[i]}":`;
          if (typeof obj[keys[i]] == "string") s += `"${obj[keys[i]]}"`;
          else if (typeof obj[keys[i]] == "number") s += `${obj[keys[i]]}`;
          else s += this.scriptify(obj[keys[i]]);
          if (i != keys.length - 1) s += ",";
        }
        s += "}";
      }
      return s;
    },
    validateHeaders(CID) {
      return new Promise((res, rej) => {
        if (CID) {
          this.toSign = {
            type: "sign_headers",
            challenge: CID,
            key: "posting",
            ops: [],
            callbacks: [res],
            txid: "Sign Auth Headers",
          };
        }
      });
    },
    makePassword() {
      this.validateHeaders(this.account + this.newAccount.name).then(res => {
        this.newAccount.password = res
        this.newAccount.msg = 'Password Generated'
        fetch(this.hapi, {
          body: `{"jsonrpc":"2.0", "method":"condenser_api.get_chain_properties", "params":[], "id":1}`,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          method: "POST",
        }).then((response) => response.json())
          .then((data) => {
            this.newAccount.fee = data.result.account_creation_fee
          })
        const ownerKey = dhive.PrivateKey.fromLogin(this.newAccount.name, res, 'owner');
        this.newAccount.memoKey = dhive.PrivateKey.fromLogin(this.newAccount.name, res, 'memo').createPublic('STM');
        this.newAccount.auths = {
          ownerPub: ownerKey.createPublic('STM'),
          owner: ownerKey.toString(),
          memo: dhive.PrivateKey.fromLogin(this.newAccount.name, res, 'memo').toString(),
          memoPub: this.newAccount.memoKey
        }
        this.newAccount.ownerAuth = {
          weight_threshold: 1,
          account_auths: [],
          key_auths: [[ownerKey.createPublic('STM'), 1]],
        };
        this.newAccount.activeAuth = {
          weight_threshold: 1,
          account_auths: [[this.account, 1]],
          key_auths: [],
        };
        this.newAccount.postingAuth = {
          weight_threshold: 1,
          account_auths: [[this.account, 1]],
          key_auths: [],
        };
      })
    },
    createAccount(claimed = false) {
      const op = claimed ? [
        'create_claimed_account',
        {
          creator: this.account,
          new_account_name: this.newAccount.name,
          owner: this.newAccount.ownerAuth,
          active: this.newAccount.activeAuth,
          posting: this.newAccount.postingAuth,
          memo_key: this.newAccount.memoKey,
          json_metadata: '',
          extensions: []
        },
      ] : [
        'account_create',
        {
          fee: this.newAccount.fee,
          creator: this.account,
          new_account_name: this.newAccount.name,
          owner: this.newAccount.ownerAuth,
          active: this.newAccount.activeAuth,
          posting: this.newAccount.postingAuth,
          memo_key: this.newAccount.memoKey,
          json_metadata: '',
        },
      ]
      this.toSign = {
        type: "raw",
        key: "active",
        op: [op],
        callbacks: [],
        txid: "Create Account",
      }
    },
    claimACT() {
      this.toSign = {
        type: "raw",
        key: "active",
        op: [[
          "claim_account",
          {
            creator: this.account,
            fee: "0.000 HIVE",
            extensions: [],
          },
        ]],
        txid: "claimACT",
        msg: ``,
        ops: ["getHiveUser"],
      }
    },
    broca_calc(last = '0,0') {
      const last_calc = this.Base64toNumber(last.split(',')[1])
      const accured = parseInt((144000 * (this.sstats.head_block - last_calc)) / (this.spkapi.spk_power * 1000)) //broca refill
      var total = parseInt(last.split(',')[0]) + accured
      if (total > (this.spkapi.spk_power * 1000)) total = (this.spkapi.spk_power * 1000)
      return total
    },
    getIPFSproviders() {
      fetch("https://spktest.dlux.io/services/IPFS")
        .then((response) => response.json())
        .then((data) => {
          this.ipfsProviders = data.providers
        });
    },
    calculateHbdSavingsInterest(focus) {
      if (!focus.name) return
      if (!focus.savings_hbd_seconds_last_update || !this.hivestats.time || !this.hivestats.hbd_interest_rate) {
        setTimeout(() => { this.calculateHbdSavingsInterest(focus) }, 1000)
        return
      }
      const currentTime = this.isoToUnix(this.hivestats.time)
      const savingsHbdSecondsLastUpdate = this.isoToUnix(focus.savings_hbd_seconds_last_update)
      const savingsHbdLastInterestPayment = this.isoToUnix(focus.savings_hbd_last_interest_payment)
      const hbdInterestRate = BigInt(this.hivestats.hbd_interest_rate)
      const savingsHbdBalanceStr = focus.savings_hbd_balance.split(' ')[0]
      const savingsHbdBalance = parseFloat(savingsHbdBalanceStr)
      const savingsHbdBalanceInt = BigInt(Math.floor(savingsHbdBalance * 1000))
      const savingsHbdSeconds = BigInt(focus.savings_hbd_seconds)
      const timeSinceLastUpdate = BigInt(currentTime - savingsHbdSecondsLastUpdate)
      const additionalHbdSeconds = savingsHbdBalanceInt * timeSinceLastUpdate
      const currentHbdSeconds = savingsHbdSeconds + additionalHbdSeconds
      const SECONDS_PER_YEAR = 31536000n
      const HIVE_100_PERCENT = 10000n
      let interest = currentHbdSeconds / SECONDS_PER_YEAR
      interest *= hbdInterestRate
      interest /= HIVE_100_PERCENT
      const interestStr = interest.toString()
      const len = interestStr.length
      let pendingInterestHbd
      if (len <= 3) {
        pendingInterestHbd = '0.' + interestStr.padStart(3, '0')
      } else {
        const integerPart = interestStr.slice(0, len - 3)
        const decimalPart = interestStr.slice(len - 3).padStart(3, '0')
        pendingInterestHbd = integerPart + '.' + decimalPart
      }
      const timeSinceLastPayment = currentTime - savingsHbdLastInterestPayment
      const canClaimInterest = timeSinceLastPayment > 30 * 24 * 3600
      let nextClaimDate = null
      const nextClaimTime = savingsHbdLastInterestPayment + 30 * 24 * 3600
      nextClaimDate = new Date(nextClaimTime * 1000).toISOString()
      if (nextClaimDate.split('-')[0] == '1970') nextClaimDate = null
      this.hbdclaim[focus.name] = {
        pendingInterestHbd: parseFloat(pendingInterestHbd),
        canClaimInterest: canClaimInterest,
        nextClaimDate: nextClaimDate
      }
    },
    getMARKETS() {
      fetch("https://spktest.dlux.io/services/MARKET")
        .then((response) => response.json())
        .then((data) => {
          for (var listing = 0; listing < data.services.length; listing++) {
            var ids = Object.keys(data.services[listing])

            this.services[`${data.services[listing][ids[0]].b}`] = {
              address: data.services[listing][ids[0]].a,
              memo: JSON.parse(data.services[listing][ids[0]].m),
              channel: 0,
              provider: data.services[listing][ids[0]].b
            }

          }
          this.getSPKUser()
        });
    },
    upload(cid = 'QmYJ2QP58rXFLGDUnBzfPSybDy3BnKNsDXh6swQyH7qim3', contract = { api: 'https://127.0.0.1:5050', id: '1668913215284', sigs: { QmYJ2QP58rXFLGDUnBzfPSybDy3BnKNsDXh6swQyH7qim3: '20548a0032e0cf51ba75721743d2ec6fac180f7bc773ce3d77b769d9c4c9fa9dbb7d59503f05be8edcaac00d5d66709b0bce977f3207785913f7fbad2773ae4ac2' } }) {

      const ENDPOINTS = {
        UPLOAD: `${contract.api}/upload`,
        UPLOAD_STATUS: `${contract.api}/upload-check`,
        UPLOAD_REQUEST: `${contract.api}/upload-authorize`
      };
      const defaultOptions = {
        url: ENDPOINTS.UPLOAD,
        startingByte: 0,
        cid,
        onAbort() { },
        onProgress() { },
        onError() { },
        onComplete() { }
      };
      const uploadFileChunks = (file, options) => {
        const formData = new FormData();
        const req = new XMLHttpRequest();
        const chunk = file.slice(options.startingByte);

        formData.append('chunk', chunk, file.name);
        formData.append('cid', options.cid);

        req.open('POST', options.url, true);
        req.setRequestHeader(
          'Content-Range', `bytes=${options.startingByte}-${options.startingByte + chunk.size}/${file.size}`
        );
        req.setRequestHeader('X-Cid', options.cid);

        req.onload = (e) => {
          if (req.status === 200) {
            options.onComplete(e, file);
          } else {
            options.onError(e, file);
          }
        };

        req.upload.onprogress = (e) => {
          const loaded = options.startingByte + e.loaded;
          options.onProgress({
            ...e,
            loaded,
            total: file.size,
            percentage: loaded * 100 / file.size
          }, file);
        };

        req.ontimeout = (e) => options.onError(e, file);

        req.onabort = (e) => options.onAbort(e, file);

        req.onerror = (e) => options.onError(e, file);

        this.fileRequests[cid].request = req;

        req.send(formData);
      };
      const uploadFile = (file, options) => {
        return fetch(ENDPOINTS.UPLOAD_REQUEST, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'sig': contract.sigs[cid],
            'account': this.account,
            'contract': contract.id,
            'cid': cid
          }
        })
          .then(res => res.json())
          .then(res => {
            options = { ...options, ...res };
            this.fileRequests[cid] = { request: null, options }
            uploadFileChunks(file, options);
          })
          .catch(e => {
            options.onError({ ...e, file })
          })
      };
      const abortFileUpload = (file) => { };
      const retryFileUpload = (file) => { };
      const clearFileUpload = (file) => { };
      const resumeFileUpload = (file) => {
        const fileReq = this.fileRequests[cid];

        if (fileReq) {
          return fetch(
            `${ENDPOINTS.UPLOAD_STATUS}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'sig': contract.sigs[cid],
              'account': this.account,
              'contract': contract.id,
              'cid': cid
            }
          })
            .then(res => res.json())
            .then(res => {
              uploadFileChunks(
                file,
                {
                  ...fileReq.options,
                  startingByte: Number(res.totalChunkUploaded)
                }
              );
            })
            .catch(e => {
              fileReq.options.onError({ ...e, file })
            })
        }
      };
      return (files, options = defaultOptions) => {
        [...files]
          .forEach(file => {
            uploadFile(file, { ...defaultOptions, ...options })
          });

        return {
          abortFileUpload,
          retryFileUpload,
          clearFileUpload,
          resumeFileUpload
        };
      }
    },
    uploadAndTrack(name, contract) {
      this.validateHeaders(this.FileInfo[name].hash).then((headers) => {
        let uploader = null;
        const setFileElement = (file) => {
          // create file element here
        }
        const onProgress = (e, file) => { };
        const onError = (e, file) => { };
        const onAbort = (e, file) => { };
        const onComplete = (e, file) => { };
        return (uploadedFiles) => {
          [...uploadedFiles].forEach(setFileElement);

          //append progress box
          uploader = uploadFiles(uploadedFiles, {
            onProgress,
            onError,
            onAbort,
            onComplete
          });
        }
      });
    },
    buyFT(uid, set) {
      var cja = {
        set: set || this.focusSetname,
        uid: uid,
      };
      this.toSign = {
        type: "cja",
        cj: cja,
        id: `${this.prefix}ft_buy`,
        msg: `Purchasing: ${set}:${uid}`,
        ops: ["getTokenUser", "getUserNFTs"],
        api: this.apiFor(this.prefix),
        txid: `${set}:${uid}_ft_buy`,
      };
    },
    bidFT(uid, set, price, type) {
      bid_amount = parseInt(price * 1000);
      var cja = {
        set: set || this.focusSet.setname,
        uid: uid,
        bid_amount,
      };
      this.toSign = {
        type: "cja",
        cj: cja,
        id: `${this.prefix}ft_buy`,
        msg: `Purchasing: ${set}:${uid}`,
        ops: ["getTokenUser", "getUserNFTs"],
        api: this.apiFor(this.prefix),
        txid: `${set}:${uid}_ft_buy`,
      };
    },
    giveFT() {
      var cja = {
        set: this.mint_detail.setname,
        to: this.giveFTusername,
        qty: parseInt(this.giveFTqty),
      };
      this.toSign = {
        type: "cja",
        cj: cja,
        id: `${this.prefix}ft_transfer`,
        msg: `Trying to give ${parseInt(this.giveFTqty)} ${this.mint_detail.setname
          } mint token${parseInt(this.giveFTqty) > 1 ? "s" : ""} to ${this.giveFTusername
          }`,
        ops: ["getTokenUser", "getUserNFTs"],
        api: this.apiFor(this.prefix),
        txid: `${this.prefix} _ft_transfer`,
      };
    },
    tradeFT(item) {
      const price = parseInt(this.FTmenu.amount * 1000);
      var cja = { set: item.setname, to: this.FTmenu.to, price };
      this.toSign = {
        type: "cja",
        cj: cja,
        id: `${item.token}_ft_escrow`,
        msg: `Trying to trade ${item.setname}: Mint Token`,
        ops: ["getTokenUser", "getUserNFTs"],
        api: this.apiFor(item.token),
        txid: `${item.token}_ft_escrow`,
      };
    },
    sellFT(setname, price, type, quantity = 1, distro) {
      price = parseInt(price * 1000);
      var cja = { set: setname, price },
        id = `${this.prefix}ft_sell`;
      if (type.toUpperCase() == "HIVE") {
        cja.hive = price;
        cja.quantity = quantity;
        cja.distro = distro;
        id = `${this.prefix}fts_sell_h`;
      } else if (type.toUpperCase() == "HBD") {
        cja.hbd = price;
        cja.quantity = quantity;
        cja.distro = distro;
        id = `${this.prefix}fts_sell_h`;
      } else type = "cja";
      this.toSign = {
        type: "cja",
        cj: cja,
        id,
        msg: `Trying to sell ${setname} mint token`,
        ops: ["getTokenUser", "getUserNFTs"],
        api: this.apiFor(this.prefix),
        txid: `${this.prefix} _ft sell`,
      };
    },
    openFT(item) {
      var cja = {
        set: item.setname,
      },
        type = "cja";
      this.toSign = {
        type,
        cj: cja,
        id: `${item.token}_nft_mint`,
        msg: `Minting: ${item.setname} NFT`,
        ops: ["getUserNFTs"],
        api: this.apiFor(item.token),
        txid: `${item.setname}_nft_mint`,
      };
    },
    modal(event) {
      this.transferModal = event.item
      this.transferMint = event.mint
      this.transferModal.show = true
      this.transferTabTo = event.tab
    },
    acceptFT(item) {
      var cja = {
        set: item.setname,
        uid: item.uid,
      },
        type = "cja";
      this.toSign = {
        type,
        cj: cja,
        id: `${item.token}_ft_escrow_complete`,
        msg: `Proposing Trade: ${item.setname}:${item.uid}`,
        ops: ["getUserNFTs"],
        api: this.apiFor(item.token),
        txid: `${item.setname}:${item.uid}_ft_escrow_complete`,
      };
    },

    rejectFT(item) {
      var cja = {
        set: item.setname,
        uid: item.uid,
      },
        type = "cja";
      this.toSign = {
        type,
        cj: cja,
        id: `${item.token}_ft_escrow_cancel`,
        msg: `Proposing Trade: ${item.setname}:${item.uid}`,
        ops: ["getUserNFTs"],
        api: this.apiFor(item.token),
        txid: `${item.setname}:${item.uid}_ft_escrow_cancel`,
      };
    },
    setPFP(item) {
      var pjm = JSON.parse(this.accountinfo.posting_json_metadata);
      if (pjm.profile)
        pjm.profile.profile_image = `${this.chains[item.token].dataAPI}/pfp/${this.account}?${item.setname}-${item.uid}`;
      else
        pjm.profile = {
          profile_image: `${this.chains[item.token].dataAPI}/pfp/${this.account}?${item.setname}-${item.uid}`,
        };
      var cja = [
        [
          "custom_json",
          {
            required_auths: [],
            required_posting_auths: [this.account],
            id: `${this.prefix}nft_pfp`,
            json: JSON.stringify({
              set: item.setname,
              uid: item.uid,
            }),
          },
        ],
        [
          "account_update2",
          {
            account: this.account,
            json_metadata: "",
            posting_json_metadata: JSON.stringify(pjm),
          },
        ],
      ],
        type = "raw";
      this.toSign = {
        type,
        op: cja,
        key: "posting",
        id: `${this.prefix}nft_pfp`,
        msg: `Setting PFP: ${item.setname}:${item.uid}`,
        ops: ["getUserNFTs"],
        api: this.apiFor(this.prefix),
        txid: `${item.setname}:${item.uid}_nft_pfp`,
      };
    },
    apiFor(prefix) {
      if (prefix == "dlux_") return "https://token.dlux.io";
      if (prefix == "spkcc_") return "https://spkinstant.hivehoneycomb.com";
      if (prefix == "duat_") return "https://inconceivable.hivehoneycomb.com";
      else return "";
    },
    log(d) {
    },
    meltNFT(item) {
      var cja = {
        set: item.setname,
        uid: item.uid,
      },
        type = "cja";
      this.toSign = {
        type,
        cj: cja,
        id: `${this.prefix}nft_delete`,
        msg: `Melting: ${item.setname}:${item.uid}`,
        ops: ["getUserNFTs"],
        api: this.apiFor(this.prefix),
        txid: `${item.setname}:${item.uid}_nft_delete`,
      };
    },
    giveNFT(item) {
      if (this.nftTradeAllowed) {
        var cja = {
          set: item.setname,
          uid: item.uid,
          to: this.nftTradeTabTo,
        },
          type = "cja";
        this.toSign = {
          type,
          cj: cja,
          id: `${this.prefix}nft_transfer`,
          msg: `Giving: ${item.setname}:${item.uid}`,
          ops: ["getUserNFTs"],
          api: this.apiFor(this.prefix),
          txid: `${item.setname}:${item.uid}_nft_transfer`,
        };
      }
    },
    tradeNFT(item) {
      if (this.nftTradeAllowed) {
        var cja = {
          set: item.setname,
          uid: item.uid,
          price: parseInt(this.nftTradeTabPrice * 1000),
          type: this.nftTradeTabToken,
          to: this.nftTradeTabTo,
        },
          type = "cja";
        this.toSign = {
          type,
          cj: cja,
          id: `${this.prefix}nft_reserve_transfer`,
          msg: `Proposing Trade: ${item.setname}:${item.uid}`,
          ops: ["getUserNFTs"],
          api: this.apiFor(this.prefix),
          txid: `${item.setname}:${item.uid}_nft_reserve_transfer`,
        };
      }
    },
    sellNFT(item) {
      var cja = {
        set: item.setname,
        uid: item.uid,
        price: parseInt(this.nftSellTabPrice * 1000),
        type: this.nftSellTabToken,
      },
        type = "cja";
      this.toSign = {
        type,
        cj: cja,
        id: `${this.prefix}nft_sell`,
        msg: `Selling: ${item.setname}:${item.uid}`,
        ops: ["getUserNFTs"],
        api: this.apiFor(this.prefix),
        txid: `${item.setname}:${item.uid}_nft_sell`,
      };
    },
    /*
function sellNFTcancel(setname, uid, callback){
     broadcastCJA({ set: setname, uid}, "dlux_nft_sell_cancel", `Trying to cancel ${setname}:${uid} sell`)
 }
*/
    cancelNFT(item) {
      var cja = {
        set: item.setname,
        uid: item.uid,
      },
        type = "cja";
      this.toSign = {
        type,
        cj: cja,
        id: `${item.token}_nft_sell_cancel`,
        msg: `Canceling: ${item.setname}:${item.uid}`,
        ops: ["getUserNFTs"],
        api: this.apiFor(item.token),
        txid: `${item.setname}:${item.uid}_nft_sell_cancel`,
      };
    },
    cancelFT(item) {
      var cja = {
        set: item.setname,
        uid: item.uid,
      },
        type = "cja";
      this.toSign = {
        type,
        cj: cja,
        id: `${item.token}_ft_sell_cancel`,
        msg: `Canceling: ${itemname}:${item.uid}`,
        ops: ["getUserNFTs"],
        api: this.apiFor(item.token),
        txid: `${itemname}:${item.uid}_ft_sell_cancel`,
      };
    },
    /*
function buyNFT(setname, uid, price, type, callback){
    if (type.toUpperCase() == 'HIVE') broadcastTransfer({ to: 'dlux-cc', hive: price, memo:`NFTbuy ${setname}:${uid}`}, `Buying ${setname}:${uid}`)
    else if (type.toUpperCase() == 'HBD') broadcastTransfer({ to: 'dlux-cc', hbd: price, memo:`NFTbuy ${setname}:${uid}`}, `Buying ${setname}:${uid}`)
    else broadcastCJA({ set: setname, uid, price}, "dlux_nft_buy", `Trying to buy ${setname}:${uid}`)
 }
*/
    buyNFT(item) {
      var cja = {
        set: item.setname,
        uid: item.uid,
        price: item.price.amount,
      },
        type = "cja";
      if (item.price.token == "HIVE" || item.price.token == "HBD") {
        type = "xfr";
        cja.memo = `NFTbuy ${item.setname}:${item.uid}`;
        cja[`${item.price.token.toLowerCase()}`] = item.price.amount;
        cja.to = this.multisig;
      }
      this.toSign = {
        type,
        cj: cja,
        id: `${this.prefix}nft_buy`,
        msg: `Purchasing: ${item.setname}:${item.uid}`,
        ops: ["getTokenUser", "getUserNFTs", "getHiveUser"],
        api: this.apiFor(this.prefix),
        txid: `${item.setname}:${item.uid}_nft_buy`,
      };
    },
    auctionNFT(item) {
      var cja = {
        set: item.setname,
        uid: item.uid,
        price: parseInt(this.nftAuctionTabPrice * 1000),
        type:
          this.nftAuctionTabToken != this.TOKEN ? this.nftAuctionTabToken : 0,
        now: false,
        time: this.nftAuctionTabTime,
      },
        type = "cja";
      this.toSign = {
        type,
        cj: cja,
        id: `${this.prefix}nft_${cja.type ? "h" : ""}auction`,
        msg: `Auctioning: ${item.setname}:${item.uid}`,
        ops: ["getUserNFTs"],
        api: this.apiFor(this.prefix),
        txid: `${item.setname}:${item.uid}_nft_${cja.type ? "h" : ""}auction`,
      };
    },
    bidNFT(item) {
      var cja = {
        set: item.setname,
        uid: item.uid,
        bid_amount: parseInt(this.nftAuctionTabPrice * 1000),
      },
        type = "cja";
      if (this.itemModal.auction.price.token == "HIVE") {
        type = "xfr";
        cja.memo = `NFTbid ${item.setname}:${item.uid}`;
        cja.hive = cja.bid_amount;
        cja.to = this.multisig;
      } else if (this.itemModal.auction.price.token == "HBD") {
        type = "xfr";
        cja.memo = `NFTbid ${item.setname}:${item.uid}`;
        cja.hive = cja.bid_amount;
        cja.to = this.multisig;
      }
      this.toSign = {
        type,
        cj: cja,
        id: `${this.prefix}nft_bid`,
        msg: `Bidding on: ${item.setname}:${item.uid}`,
        ops: ["getUserNFTs"],
        api: this.apiFor(this.prefix),
        txid: `${item.setname}:${item.uid}_nft_bid`,
      };
    },
    precision(num, precision) {
      return parseFloat(num / Math.pow(10, precision)).toFixed(precision);
    },
    sigFig(num, sig) {
      // return a number in K or M or B format
      var post = typeof num.split == "function" ? num.split(" ")[1] : "";
      num = parseFloat(num);
      var out;
      if (num < 1) {
        out = (num * 1000).toFixed(sig);
        post = "m" + post;
      } else if (num < 1000) {
        out = num.toFixed(sig);
      } else if (num < 1000000) {
        out = (num / 1000).toFixed(sig);
        post = "K" + post;
      } else if (num < 1000000000) {
        out = (num / 1000000).toFixed(sig);
        post = "M" + post;
      } else if (num < 1000000000000) {
        out = (num / 1000000000).toFixed(sig);
        post = "B" + post;
      } else if (num < 1000000000000000) {
        out = (num / 1000000000000).toFixed(sig);
        post = "T" + post;
      } else if (num < 1000000000000000000) {
        out = (num / 1000000000000000).toFixed(sig);
        post = "Q" + post;
      }
      //remove trailing zeros
      out = out.replace(/\.?0+$/, "");
      return out + post;
    },
    reply(deets) {
      if (!deets.json_metadata) deets.json_metadata = JSON.stringify({})
      var operations = []
      if (deets.bens) {
        operations.push(["comment_options",
          {
            "author": this.account,
            "permlink": deets.permlink,
            "max_accepted_payout": "1000000.000 HBD",
            "percent_hbd": 10000,
            "allow_votes": true,
            "allow_curation_rewards": true,
            "extensions":
              [[0,
                {
                  "beneficiaries":
                    deets.bens
                }]]
          }])
        delete deets.bens
      }
      operations.unshift(["comment", deets])
      this.toSign = {
        type: "raw",
        key: "posting",
        op: JSON.stringify(operations),
        callbacks: [], //get new replies for a/p
        txid: `reply:${deets.parent_author}/${deets.permlink}`,
      }
    },
    vote(url) {
      var key, slider, flag
      if (typeof url == 'object') {
        slider = url.slider
        flag = url.flag
        url = url.url
      } else {
        key = `/@${url.split("/@")[1].split("/")[0]}/${url.split("/@")[1].split("/")[1]}`
        slider = this.posturls[key].slider
        flag = this.posturls[key].flag
      }
      this.toSign = {
        type: "vote",
        cj: {
          author: url.split("/@")[1].split("/")[0],
          permlink: url.split("/@")[1].split("/")[1],
          weight:
            slider * (flag ? -1 : 1),
        },
        msg: `Voting ...`,
        ops: [""],
        txid: "vote",
      };
    },
    pending(url, text) {
      this.posturls[url].comment = text;
      this.comment(url);
    },
    setRating(url, rating) {
      this.posturls[url].rating = rating;
    },
    comment(url) {
      var meta = this.posturls[url].edit
        ? this.posturls[url].json_metadata
        : {
          tags: this.posturls[url].json_metadata.tags,
        };
      if (this.posturls[url].rating)
        meta.review = { rating: this.posturls[url].rating };
      this.toSign = {
        type: "comment",
        cj: {
          author: this.account,
          title: this.posturls[url].edit ? this.posturls[url].title : "",
          body: this.posturls[url].comment,
          parent_author: this.posturls[url].edit
            ? this.posturls[url].parent_author
            : this.posturls[url].author,
          parent_permlink: this.posturls[url].edit
            ? this.posturls[url].parent_permlink
            : this.posturls[url].permlink,
          permlink: this.posturls[url].edit
            ? this.posturls[url].permlink
            : "re-" + this.posturls[url].permlink + this.posturls[url].children,
          json_metadata: JSON.stringify(meta),
        },
        msg: `Commenting ...`,
        ops: [""],
        txid: "comment",
      };
    },
    hasVoted(url) {
      const vote = this.posturls[url].active_votes.filter(
        (vote) => vote.voter === this.account
      );
      return vote.length ? vote[0].percent : 0;
    },
    precision(num, precision) {
      return parseFloat(num / Math.pow(10, precision)).toFixed(precision);
    },
    toFixed(num, dig) {
      return parseFloat(num).toFixed(dig);
    },
    handleScroll() {
      if (this.activeTab == 'blog' || this.activeTab == 'inventory') {
        const now = Date.now();
        if (now - this.lastScroll > 500) { 
          this.lastScroll = now;
          
          // Try multiple methods to get scroll position
          const scrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
          const windowHeight = window.innerHeight || document.documentElement.clientHeight;
          const documentHeight = Math.max(
            document.body.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.clientHeight,
            document.documentElement.scrollHeight,
            document.documentElement.offsetHeight
          );
          
          const threshold = documentHeight - 500;
          const shouldTrigger = scrollPosition + windowHeight >= threshold;
          
          // Trigger when within 500px of the bottom
          if (shouldTrigger) { 
            if (this.activeTab == 'blog') {
              this.getPosts();
            } else if (this.activeTab == 'inventory') {
              this.getNFTs();
            }
          }
        }
      }
    },
    modalNext(modal, kind) {
      if (
        kind == "item" ||
        this.postSelect.VR.checked ||
        this.postSelect.AR.checked ||
        this.postSelect.XR.checked ||
        this.postSelect.Blog.checked ||
        this.postSelect.sort == "payout" ||
        this.postSelect.searchTerm
      ) {
        this[modal].index = (this[modal].index + 1) % this[modal].items.length;
        this[modal].item = this[modal].items[this[modal].index];
      } else if (this[modal].index < this[modal].items.length - 1) {
        this[modal].index++;
        this[modal].item = this[modal].items[this[modal].index];
      } else if (this[modal].index < this.allPosts.length - 1) {
        this.selectPosts([modal, this[modal].index + 1]);
      } else {
        this[modal].index = 0;
        this[modal].item = this[modal].items[this[modal].index];
      }
    },
    modalPrev(modal) {
      if (this[modal].index) this[modal].index--;
      else this[modal].index = this[modal].items.length - 1;
      this[modal].item = this[modal].items[this[modal].index];
    },
    modalSelect(key) {
      if (key.indexOf('/@') > 0)
        key = '/@' + key.split('/@')[1];
      this.displayPost.index = key;
      this.displayPost.item = this.posturls[key];
      window.history.pushState("Blog Modal", this.displayPost.item.title, "/blog/@" + key.split('/@')[1]);
      if (
        this.displayPost.item?.children &&
        !this.displayPost.item.replies.length
      ) this.getReplies(
        this.displayPost.item.author,
        this.displayPost.item.permlink,
        true
      )
    },
    calHSF() {
      this.newToken.hiveServiceFee = parseInt(this.newToken.preHiveServiceFee * 100)
    },
    getRewardFund() {
      fetch(this.hapi, {
        body: `{"jsonrpc":"2.0", "method":"condenser_api.get_reward_fund", "params":["post"], "id":1}`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        method: "POST",
      })
        .then((r) => r.json())
        .then((r) => {
          this.rewardFund = r.result;
        });
    },
    getFeedPrice() {
      fetch(this.hapi, {
        body: `{"jsonrpc":"2.0", "method":"condenser_api.get_current_median_history_price", "params":[], "id":1}`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        method: "POST",
      })
        .then((r) => r.json())
        .then((r) => {
          this.feedPrice = r.result;
        });
    },
    modalIndex(modal, index, source = "displayNFTs") {
      // if (source != "displayNFTs") {
      //   source.HTML = source.comp.HTML;
      //   source.setname = source.setname;
      //   this[modal].index = 0;
      //   this[modal].items = [source];
      //   this[modal].item = source;
      //   return;
      // }
      var i = 0;
      for (i; i < this[source].length; i++) {
        if (`${this[source][i].setname}:${this[source][i].uid}` == index) break;
      }
      this[modal].index = i;
      this[modal].items = [...this[source]];
      this[modal].item = this[modal].items[i];
    },
    printProps(obj) {
      return Object.keys(obj)
        .map((key) => key + ": " + obj[key])
        .join(", ");
    },
    sigFig(num, sig) {
      // return a number in K or M or B format
      if (num) {
        var post = typeof num.split == "function" ? num.split(" ")[1] : "";
        num = parseFloat(num);
        var out;
        if (num < 1) {
          out = (num * 1000).toFixed(sig);
          post = "m" + post;
        } else if (num < 1000) {
          out = num.toFixed(sig);
        } else if (num < 1000000) {
          out = (num / 1000).toFixed(sig);
          post = "K" + post;
        } else if (num < 1000000000) {
          out = (num / 1000000).toFixed(sig);
          post = "M" + post;
        } else if (num < 1000000000000) {
          out = (num / 1000000000).toFixed(sig);
          post = "B" + post;
        } else if (num < 1000000000000000) {
          out = (num / 1000000000000).toFixed(sig);
          post = "T" + post;
        } else if (num < 1000000000000000000) {
          out = (num / 1000000000000000).toFixed(sig);
          post = "Q" + post;
        }
        //remove trailing zeros
        out = out.replace(/\.?0+$/, "");
        return out + post;
      }
    },
    removeOp(txid) {
      if (this.toSign.txid == txid) {
        this.toSign = {};
      }
    },
    log(event) {
    },
    getReplies(a, p, c) {
      return new Promise((resolve, reject) => {
        fetch('https://api.hive.blog', {
          body: `{"jsonrpc":"2.0", "method":"condenser_api.get_content_replies", "params":["${a}","${p}"], "id":1}`,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          method: "POST",
        })
          .then((res) => res.json())
          .then((r) => {
            const key = `/@${a}/${p}`
            var authors = []
            for (let i = 0; i < r.result.length; i++) {
              authors.push(r.result[i].author)
              r.result[i].edit = false;
              if (r.result[i].children) this.getReplies(r.result[i].author, r.result[i].permlink)
              if (r.result[i].json_metadata) {
                try {
                  r.result[i].json_metadata = JSON.parse(
                    r.result[i].json_metadata
                  );
                } catch (e) { }
              }
              const repKey = `/@${r.result[i].author}/${r.result[i].permlink}`
              if (c) {
                const rating = r.result[i].json_metadata?.review?.rating || 0
                if (rating > 0) {
                  this.posturls[key].ratings += 1
                  this.posturls[key].rating = parseFloat(((rating + this.posturls[key].rating) / this.posturls[key].ratings)).toFixed(2)
                }
              }
              this.posturls[repKey] =
                r.result[i];
              if (r.result[i].slider < 0) {
                r.result[i].flag = true;
                r.result[i].slider =
                  r.result[i].slider * -1;

              }
              this.posturls[repKey].rep = "...";
              this.posturls[repKey].rating = this.posturls[repKey].json_metadata?.review?.rating || 0
              this.rep(repKey)
            }
            this.posturls[key].replies = r.result;
            this.getHiveAuthors(authors)
          })
          .catch((err) => {
            reject(err);
          });
      });
    },
    accountRelations(name) {
      fetch(this.hapi, {
        body: `{\"jsonrpc\":\"2.0\", \"method\":\"bridge.get_relationship_between_accounts\", \"params\":[\"${this.account}\",\"${name}\"], \"id\":5}`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        method: "POST",
      })
        .then((r) => {
          return r.json();
        })
        .then((re) => {
          var rez = re.result
          this.relations = rez
        });
    },
    async getRecurrentTransfers(username, key) {
      if(!username) return
      try {
        const transfers = await this.hiveApiCall('database_api.find_recurrent_transfers', { from: username });
        if (!transfers.recurrent_transfers.length) return
        var hbd_transfers = []
        var hive_transfers = []
        for (var i = 0; i < transfers.recurrent_transfers.length; i++) {
          if (transfers.recurrent_transfers[i].amount.nai == "@@000000021") hive_transfers.push(transfers.recurrent_transfers[i])
          else hbd_transfers.push(transfers.recurrent_transfers[i])
        }
        this[key].hbd_transfers = hbd_transfers
        this[key].hive_transfers = hive_transfers
      } catch (error) {
        console.error('Error fetching recurrent transfers:', error);
        throw error;
      }
    },
    async getPendingSavingsWithdrawals(username, key) {
      try {
        const pendingWithdrawals = await this.hiveApiCall('condenser_api.get_savings_withdraw_from', [username])
        var hbds = []
        var hives = []
        for (var i = 0; i < pendingWithdrawals.length; i++) {
          if (pendingWithdrawals[i].amount.split(' ')[1] == "HIVE") hives.push(pendingWithdrawals[i])
          else hbds.push(pendingWithdrawals[i])
        }
        this[key].hive_pendingWithdrawals = hives
        this[key].hbd_pendingWithdrawals = hbds
        var totalDs = 0
        var totalHs = 0
        for (var i = 0; i < hives.length; i++) {
          totalHs += parseFloat(hives[i].amount)
        }
        for (var i = 0; i < hbds.length; i++) {
          totalDs += parseFloat(hbds[i].amount)
        }
        this[key].hbd_pendingWithdrawal_tot = totalDs
        this[key].hive_pendingWithdrawal_tot = totalHs
      } catch (error) {
        console.error('Error fetching pending savings withdrawals:', error);
        throw error;
      }
    },
    checkAccount(name, key) {
      fetch(this.hapi, {
        body: `{\"jsonrpc\":\"2.0\", \"method\":\"condenser_api.get_accounts\", \"params\":[[\"${key == 'newAccountDeets' ? name : this[name]}\"]], \"id\":1}`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        method: "POST",
      })
        .then((r) => {
          return r.json();
        })
        .then((re) => {
          var rez = re.result[0] || {}
          try {
            rez.posting_json_metadata = JSON.parse(rez.posting_json_metadata);
          } catch (e) {
            try {
              rez.posting_json_metadata = JSON.parse(rez.json_metadata);
            } catch (e) {
              rez.posting_json_metadata = { profile: { about: "" } };
            }
          }
          if (!rez.posting_json_metadata.profile) {
            rez.posting_json_metadata.profile = { about: "" };
          }
          if (re.result.length) {
            this[key] = rez;
            this[key].hbd_transfers = []
            this[key].hive_transfers = []
            this.getRecurrentTransfers(key == 'newAccountDeets' ? name : this[name], key)
            this[key].hive_pendingWithdrawals = []
            this[key].hbd_pendingWithdrawals = []
            this[key].hbd_pendingWithdrawal_tot = 0
            this[key].hive_pendingWithdrawal_tot = 0
            if (rez.savings_withdraw_requests) this.getPendingSavingsWithdrawals(key == 'newAccountDeets' ? name : this[name], key)
            const totalVestingShares = parseFloat(rez.vesting_shares)
            const toWithdraw = parseFloat(rez.to_withdraw) / 1e6
            const withdrawn = parseFloat(rez.withdrawn)
            this[key].remainingToWithdraw = toWithdraw - withdrawn
            this[key].weeklyWithdrawal = toWithdraw / 13
            this[key].nextWithdrawalDate = rez.next_vesting_withdrawal
            const calcWithStats = (key, rez) => {
              if (!this.hivestats?.content_reward_percent) {
                setTimeout(() => calcWithStats(key, rez), 500)
              } else {
                const totalVestingFundHive = parseFloat(this.hivestats.total_vesting_fund_hive)
                const totalVestingSharesGlobal = parseFloat(this.hivestats.total_vesting_shares)
                const hivePerVest = totalVestingFundHive / totalVestingSharesGlobal
                this[key].weeklyHiveWithdrawal = this[key].weeklyWithdrawal * hivePerVest
                this[key].remainingHiveToWithdraw = this[key].remainingToWithdraw * hivePerVest
              }
            }
            calcWithStats(key, rez)
            this.calculateHbdSavingsInterest(this[key])
            if (key == "newAccountDeets") this.newAccount.msg = "Account Found"
          } else {
            this[key] = false;
            if (key == "newAccountDeets") {
              this.newAccount.msg = "Account Claimable"
            }
          }

        })

    },
    tokenSend() {
      if (!this.sendFormValid) return;
      if (this.sendAllowed) {
        this.toSign = {
          type: "cja",
          cj: {
            to: this.sendTo,
            amount: parseInt(this.sendAmount * 1000),
            memo: this.sendMemo,
          },
          id: `${this.prefix}send`,
          msg: `Trying to send ${this.TOKEN}...`,
          ops: ["getTokenUser"],
          txid: "send",
        };
      } else alert("Username not found");
    },
    sendIt(op) {
      this.toSign = op;
    },
    frmDate() {
      return new Date().getMonth() + 1;
    },
    sendhive() {
      if (!this.hiveFormValid) return;
      if (this.sendHiveAllowed)
        this.toSign = {
          type: "xfr",
          cj: {
            to: this.sendHiveTo,
            hive: this.sendHiveAmount * 1000,
            memo: this.sendHiveMemo,
          },
          txid: "sendhive",
          msg: ``,
          ops: ["getHiveUser"],
        };
      else alert("Account Not Found");
    },
    sendhbd() {
      if (!this.hbdFormValid) return;
      if (this.sendHBDAllowed)
        this.toSign = {
          type: "xfr",
          cj: {
            to: this.sendHBDTo,
            hbd: this.sendHBDAmount * 1000,
            memo: this.sendHBDMemo,
          },
          txid: "sendhbd",
          msg: ``,
          ops: ["getHiveUser"],
        };
      else alert("Account Not Found");
    },
    localStoreSet(k, v) {
      localStorage.setItem(k, v);
    },
    toFixed(value, decimals) {
      return Number(value).toFixed(decimals);
    },
    pFloat(value) {
      return parseFloat(value);
    },
    toUpperCase(value) {
      return value.toUpperCase();
    },
    gt(a, b) {
      return parseFloat(a) > parseFloat(b);
    },
    formatNumber(t, n, r, e) { // number, decimals, decimal separator, thousands separator
      if (typeof t != "number") {
        const parts = t ? t.split(" ") : []
        var maybe = 0
        for (i = 0; i < parts.length; i++) {
          if (parseFloat(parts[i]) > 0) {
            maybe += parseFloat(parts[i])
          }
        }
        if (maybe > parseFloat(t)) {
          t = maybe
        } else {
          t = parseFloat(t)
        }
      }
      if (isNaN(t)) return "Invalid Number";
      if (!isFinite(t)) return (t < 0 ? "-" : "") + "infinite";
      (r = r || "."), (e = e || "");
      var u = t < 0;
      t = Math.abs(t);
      var a = (null != n && 0 <= n ? t.toFixed(n) : t.toString()).split("."),
        i = a[0],
        o = 1 < a.length ? r + a[1] : "";
      if (e)
        for (var c = /(\d+)(\d{3})/; c.test(i);)
          i = i.replace(c, "$1" + e + "$2");
      return (u ? "-" : "") + i + o;
    },
    setApi(url) {
      // remove trailing slash
      if (url.substr(-1) == "/") {
        url = url.substr(0, url.length - 1);
      }
      let api =
        url ||
        prompt("Please enter your API", "https://spkinstant.hivehoneycomb.com");
      if (url.indexOf("https://") == -1) {
        alert("https is required");
        return;
      }
      if (api != null) {
        if (location.hash && api) {
          location.hash = "";
        }
        localStorage.setItem("lapi", api);
        location.search = "?api=" + api;
      }
    },
    toLowerCase(v) {
      return typeof v == "string" ? v.toLowerCase() : v;
    },
    toUpperCase(v) {
      return typeof v == "string" ? v.toUpperCase() : v;
    },
    suggestValue(key, value) {
      if (key.split(".").length > 1) {
        let keys = key.split(".");
        let obj = this[keys[0]];
        for (let i = 1; i < keys.length; i++) {
          if (i == keys.length - 1) {
            if (!obj[keys[i]]) obj[keys[i]] = value;
          } else {
            obj = obj[keys[i]];
          }
        }
      } else {
        if (!this[key]) this[key] = value;
      }
    },
    addToken(token) {
      return "#" + token;
    },
    setMem(key, value, reload) {
      if (value.indexOf("https://") == -1) {
        alert("https:// is required for security reasons");
        return;
      } else if (value[value.length - 1] == "/") {
        value = value.substring(0, value.length - 1);
      }
      localStorage.setItem(key, value);
      if (reload) {
        location.reload();
      }
    },
    sort(item, key, method) {
      switch (method) {
        case "asc":
          this[item].sort((a, b) => {
            return a[key] < b[key] ? -1 : 1;
          });
          break;
        case "desc":
        default:
          this[item].sort((a, b) => {
            return a[key] > b[key] ? -1 : 1;
          });
      }
    },
    validateForm(formKey, validKey) {
      var Container = document.getElementById(formKey);
      if (Container.querySelector("input:invalid")) this[validKey] = false;
      else this[validKey] = true;
    },
    getPosts(reset) {
      var bitMask = 0;
      for (var type in this.postSelect.types) {
        if (this.postSelect.types[type].checked)
          bitMask += this.postSelect.types[type].bitFlag;
      }
      if (reset) {
        this.posturls = {};
      }
      if (this.postSelect.bitMask != bitMask || reset) {
        this.postSelect.bitMask = bitMask;
        this.displayPosts = [];
        this[this.postSelect.entry] = [];
        this.postSelect[this.postSelect.entry].o = 0;
        this.postSelect[this.postSelect.entry].e = false;
        this.postSelect[this.postSelect.entry].start_author = '';
        this.postSelect[this.postSelect.entry].start_permlink = '';
      }
      if (
        !this.postSelect[this.postSelect.entry].e &&
        !this.postSelect[this.postSelect.entry].p
      ) {
        this.postSelect[this.postSelect.entry].p = true;

        // Use modern bridge API for better performance
        const method = 'bridge.get_account_posts';
        const params = [{
          sort: 'blog',
          account: this.pageAccount,
          observer: this.account || '',
          limit: this.postSelect[this.postSelect.entry].a,
          start_author: this.postSelect[this.postSelect.entry].start_author || '',
          start_permlink: this.postSelect[this.postSelect.entry].start_permlink || ''
        }];

        fetch(HIVE_API, {
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: method,
            params: params,
            id: 1
          }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        })
          .then((r) => r.json())
          .then((res) => {
            this.postSelect[this.postSelect.entry].p = false;

            if (!res.result || res.result.length === 0) {
              this.postSelect[this.postSelect.entry].e = true;
              return;
            }

            var authors = [];

            if (res.result.length < this.postSelect[this.postSelect.entry].a) {
              this.postSelect[this.postSelect.entry].e = true;
            }

            // Set pagination parameters for next call
            if (res.result.length > 0) {
              const lastPost = res.result[res.result.length - 1];
              this.postSelect[this.postSelect.entry].start_author = lastPost.author;
              this.postSelect[this.postSelect.entry].start_permlink = lastPost.permlink;
            }

            for (var i = 0; i < res.result.length; i++) {
              const post = res.result[i];
              const key = `/@${post.author}/${post.permlink}`;

              if (!this.posturls[key]) {
                this.posturls[key] = {
                  ...post,
                  slider: 10000,
                  flag: false,
                  upVotes: 0,
                  downVotes: 0,
                  edit: false,
                  hasVoted: false,
                  hasMoreVotes: false,
                  contract: {},
                  type: 'Blog',
                  url: `/blog${key}`,
                  ago: this.timeSince(post.created),
                  preview: this.removeMD(post.body).substr(0, 250),
                  rep: "..."
                };

                // Process vote data
                if (post.active_votes && post.active_votes.length > 0) {
                  for (var j = 0; j < post.active_votes.length; j++) {
                    if (post.active_votes[j].rshares > 0) {
                      this.posturls[key].upVotes++;
                    } else if (post.active_votes[j].rshares < 0) {
                      this.posturls[key].downVotes++;
                    }
                    // Skip rshares === 0 (neutral/no vote)

                    if (post.active_votes[j].voter === this.account) {
                      this.posturls[key].slider = post.active_votes[j].percent;
                      this.posturls[key].hasVoted = true;
                    }
                  }
                  
                  // Add "+" indicator if we hit the API limit of 1000 votes
                  if (post.active_votes.length >= 1000) {
                    this.posturls[key].hasMoreVotes = true;
                  } else {
                    this.posturls[key].hasMoreVotes = false;
                  }
                  
                }

                if (this.posturls[key].slider < 0) {
                  this.posturls[key].slider = this.posturls[key].slider * -1;
                  this.posturls[key].flag = true;
                }

                // Process JSON metadata
                try {
                  if (typeof post.json_metadata === 'string') {
                    this.posturls[key].json_metadata = JSON.parse(post.json_metadata);
                  }
                  
                  // Calculate total payout correctly
                  let totalPayout = 0;
                  const pendingPayout = parseFloat(post.pending_payout_value?.split(' ')[0] || '0');
                  const authorPayout = parseFloat(post.author_payout_value?.split(' ')[0] || '0');
                  const curatorPayout = parseFloat(post.curator_payout_value?.split(' ')[0] || '0');
                  
                  if (pendingPayout > 0) {
                    totalPayout = pendingPayout;
                  } else {
                    totalPayout = authorPayout + curatorPayout;
                  }
                  
                  // Set calculated total payout
                  this.posturls[key].total_payout_value = totalPayout.toFixed(3) + " HBD";

                  // Check for DLUX content types
                  var type = "Blog";
                  var contracts = false;
                  
                  if (this.posturls[key].json_metadata.assets) {
                    for (var k = 0; k < this.posturls[key].json_metadata.assets.length; k++) {
                      if (this.posturls[key].json_metadata.assets[k].contract) {
                        this.posturls[key].contract[this.posturls[key].json_metadata.assets[k].contract] = {}
                        contracts = true
                      }
                    }
                  }
                  if (contracts) {
                    this.getContracts(key)
                  }

                  if (
                    "QmcAkxXzczkzUJWrkWNhkJP9FF1L9Lu5sVCrUFtAZvem3k" == this.posturls[key].json_metadata.vrHash ||
                    "QmNby3SMAAa9hBVHvdkKvvTqs7ssK4nYa2jBdZkxqmRc16" ==
                    this.posturls[key].json_metadata.vrHash ||
                    "QmZF2ZEZK8WBVUT7dnQyzA6eApLGnMXgNaJtWHFc3PCpqV" ==
                    this.posturls[key].json_metadata.vrHash ||
                    "Qma4dk3mWP325HrHYBDz3UdL9h1A6q8CSvZdc8JhqfgiMp" == this.posturls[key].json_metadata.vrHash
                  )
                    type = "360";
                  else if (this.posturls[key].json_metadata.vrHash)
                    type = "VR";
                  else if (this.posturls[key].json_metadata.arHash)
                    type = "AR";
                  else if (this.posturls[key].json_metadata.appHash)
                    type = "APP";
                  else if (this.posturls[key].json_metadata.audHash)
                    type = "Audio";
                  else if (this.posturls[key].json_metadata.vidHash)
                    type = "Video";

                  this.posturls[key].type = type;
                  if (type != "Blog")
                    this.posturls[key].url = "/dlux" + this.posturls[key].url;
                  else
                    this.posturls[key].url = "/blog" + this.posturls[key].url;

                  this.posturls[key].pic = this.picFind(this.posturls[key].json_metadata);
                } catch (e) {
                  this.posturls[key].json_metadata = {};
                }

                // Set reputation from post data first (more efficient)
                if (post.author_reputation) {
                  this.posturls[key].rep = post.author_reputation
                } else if (this.authors[post.author] && this.authors[post.author].reputation) {
                  this.posturls[key].rep = this.authors[post.author].reputation
                }
              }

              this[this.postSelect.entry].push(key);
              authors.push(post.author);
            }

            this.selectPosts();
            authors = [...new Set(authors)];
            if (authors.length > 0) {
              this.getHiveAuthors(authors);
            }
          })
          .catch(error => console.error(`Error fetching posts for @${this.pageAccount}:`, error));
      }
    },
    selectPosts(modal, reset) {
      var arr = [];
      for (var i = 0; i < this[this.postSelect.entry].length; i++) {
        if (this.posturls[this[this.postSelect.entry][i]])
          arr.push(this.posturls[this[this.postSelect.entry][i]]);
      }
      this.displayPosts = arr;
      if (modal) {
        this[modal[0]].items = this.displayPosts;
        this[modal[0]].item = this[modal[0]].items[modal[1]];
        this[modal[0]].index = modal[1];
      }
    },
    getContent(a, p, modal) {
      if (a && p) {
        fetch('https://api.hive.blog', {
          body: `{"jsonrpc":"2.0", "method":"condenser_api.get_content", "params":["${a}", "${p}"], "id":1}`,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          method: "POST",
        })
          .then((r) => r.json())
          .then((res) => {
            if (res.result) {
              const key = `/@${res.result.author}/${res.result.permlink}`
              res.result.url = key;
              this.posturls[key] = {
                ...this.posturls[key],
                ...res.result,
                slider: 10000,
                flag: false,
                upVotes: 0,
                downVotes: 0,
                edit: false,
                hasVoted: false,
                contract: {}
              };
              if (!this.posturls[key].ratings) {
                this.posturls[key].ratings = 0
                this.posturls[key].rating = 0
              }
              for (
                var i = 0;
                i < this.posturls[key].active_votes.length;
                i++
              ) {
                if (this.posturls[key].active_votes[i].percent > 0)
                  this.posturls[key].upVotes++;
                else this.posturls[key].downVotes++;
                if (
                  this.posturls[key].active_votes[i].voter ==
                  this.account
                ) {
                  this.posturls[key].slider =
                    this.posturls[key].active_votes[i].percent;
                  this.posturls[key].hasVoted = true;
                }
              }
              var contracts = false
              var type = "Blog";
              try {
                this.posturls[key].json_metadata = JSON.parse(
                  this.posturls[key].json_metadata
                );
                this.posturls[key].pic = this.picFind(
                  this.posturls[key].json_metadata
                );
                if (this.posturls[key].json_metadata.assets) {
                  for (var i = 0; i < this.posturls[key].json_metadata.assets.length; i++) {
                    if (this.posturls[key].json_metadata.assets[i].contract) {
                      this.posturls[key].contract[this.posturls[key].json_metadata.assets[i].contract] = {}
                      contracts = true
                    }
                  }
                }
                if (contracts) {
                  this.getContracts(key)
                }
                if (
                  "QmcAkxXzczkzUJWrkWNhkJP9FF1L9Lu5sVCrUFtAZvem3k" == this.posturls[key].json_metadata.vrHash ||
                  "QmNby3SMAAa9hBVHvdkKvvTqs7ssK4nYa2jBdZkxqmRc16" ==
                  this.posturls[key].json_metadata.vrHash ||
                  "QmZF2ZEZK8WBVUT7dnQyzA6eApLGnMXgNaJtWHFc3PCpqV" ==
                  this.posturls[key].json_metadata.vrHash ||
                  "Qma4dk3mWP325HrHYBDz3UdL9h1A6q8CSvZdc8JhqfgiMp" == this.posturls[key].json_metadata.vrHash
                )
                  type = "360";
                else if (this.posturls[key].json_metadata.vrHash)
                  type = "VR";
                else if (this.posturls[key].json_metadata.arHash)
                  type = "AR";
                else if (this.posturls[key].json_metadata.appHash)
                  type = "APP";
                else if (this.posturls[key].json_metadata.audHash)
                  type = "Audio";
                else if (this.posturls[key].json_metadata.vidHash)
                  type = "Video";
              } catch (e) {
              }
              this.posturls[key].type = type;
              if (type != "Blog")
                this.posturls[key].url =
                  "/dlux" + this.posturls[key].url;
              else
                this.posturls[key].url =
                  "/blog" + this.posturls[key].url;
              this.posturls[key].rep = "...";
              this.rep(key);
              if (this.posturls[key].slider < 0) {
                this.posturls[key].slider =
                  this.posturls[key].slider * -1;
                this.posturls[key].flag = true;
              }
              this.posturls[key].preview = this.removeMD(
                this.posturls[key].body
              ).substr(0, 250);
              this.posturls[key].ago = this.timeSince(
                this.posturls[key].created
              );
              this.selectPosts();
              if (modal) this.modalSelect(key)
            }
          });
      } else {
      }
    },
    getContracts(url) {
      var contracts = [],
        getContract = (u, id) => {
          fetch('https://spktest.dlux.io/api/fileContract/' + id)
            .then((r) => r.json())
            .then((res) => {
              if (typeof res.result != "string") {
                res.result.extend = "7"
                this.contracts[id] = res.result
                this.extendcost[id] = parseInt(res.result.extend / 30 * res.result.r)
              } else {
                delete this.contracts[id]
              }
            });
        }
      for (var contract in this.posturls[url].contract) {
        contracts.push(contract)
      }
      contracts = [...new Set(contracts)]
      for (var i = 0; i < contracts.length; i++) {
        getContract(url, contracts[i])
      }
    },
    imgUrlAlt(event) {
      event.target.src = "/img/dlux-logo-icon.png";
    },
    timeSince(date) {
      var seconds = Math.floor((new Date() - new Date(date + ".000Z")) / 1000);
      var interval = Math.floor(seconds / 86400);
      if (interval > 7) {
        return new Date(date).toLocaleDateString();
      }
      if (interval >= 1) {
        return interval + ` day${interval > 1 ? "s" : ""} ago`;
      }
      interval = Math.floor(seconds / 3600);
      if (interval >= 1) {
        return interval + ` hour${interval > 1 ? "s" : ""} ago`;
      }
      interval = Math.floor(seconds / 60);
      if (interval >= 1) {
        return `${interval} minute${interval > 1 ? "s" : ""} ago`;
      }
      return Math.floor(seconds) + " seconds ago";
    },
    removeMD(md, options) {
      options = options || {};
      options.listUnicodeChar = options.hasOwnProperty("listUnicodeChar")
        ? options.listUnicodeChar
        : false;
      options.stripListLeaders = options.hasOwnProperty("stripListLeaders")
        ? options.stripListLeaders
        : true;
      options.gfm = options.hasOwnProperty("gfm") ? options.gfm : true;
      options.useImgAltText = options.hasOwnProperty("useImgAltText")
        ? options.useImgAltText
        : false;
      var output = md || "";
      output = output.replace(/^(-\s*?|\*\s*?|_\s*?){3,}\s*$/gm, "");
      try {
        if (options.stripListLeaders) {
          if (options.listUnicodeChar)
            output = output.replace(
              /^([\s\t]*)([\*\-\+]|\d+\.)\s+/gm,
              options.listUnicodeChar + " $1"
            );
          else output = output.replace(/^([\s\t]*)([\*\-\+]|\d+\.)\s+/gm, "$1");
        }
        if (options.gfm) {
          output = output
            .replace(/\n={2,}/g, "\n")
            .replace(/~{3}.*\n/g, "")
            .replace(/~~/g, "")
            .replace(/`{3}.*\n/g, "");
        }
        output = output
          .replace(/<[^>]*>/g, "")
          .replace(/^[=\-]{2,}\s*$/g, "")
          .replace(/\[\^.+?\](\: .*?$)?/g, "")
          .replace(/\s{0,2}\[.*?\]: .*?$/g, "")
          .replace(
            /\!\[(.*?)\][\[\(].*?[\]\)]/g,
            options.useImgAltText ? "$1" : ""
          )
          .replace(/\[(.*?)\][\[\(].*?[\]\)]/g, "$1")
          .replace(/^\s{0,3}>\s?/g, "")
          .replace(/^\s{1,2}\[(.*?)\]: (\S+)( ".*?")?\s*$/g, "")
          .replace(
            /^(\n)?\s{0,}#{1,6}\s+| {0,}(\n)?\s{0,}#{0,} {0,}(\n)?\s{0,}$/gm,
            "$1$2$3"
          )
          .replace(/([\*_]{1,3})(\S.*?\S{0,1})\1/g, "$2")
          .replace(/([\*_]{1,3})(\S.*?\S{0,1})\1/g, "$2")
          .replace(/(`{3,})(.*?)\1/gm, "$2")
          .replace(/`(.+?)`/g, "$1")
          .replace(/\n{2,}/g, "\n\n");
      } catch (e) {
        console.error(e);
        return md;
      }
      return output;
    },
    picFind(json) {
      var arr;
      try {
        arr = json.image[0];
      } catch (e) { }
      if (typeof json.image == "string") {
        return json.image;
      } else if (typeof arr == "string") {
        return arr;
      } else if (typeof json.Hash360 == "string") {
        return `https://ipfs.dlux.io/ipfs/${json.Hash360}`;
      } else {
        /*
                var looker
                try {
                    looker = body.split('![')[1]
                    looker = looker.split('(')[1]
                    looker = looker.split(')')[0]
                } catch (e) {
                    */
        return "/img/dluxdefault.png";
      }
    },
    getMint(set, item) {
      for (let i = 0; i < this.rNFTs.length; i++) {
        if (this.rNFTs[i].setname == set) {
          if (item) return this.rNFTs[i][item];
          return this.rNFTs[i];
        }
      }
      return 0;
    },
    getQuotes() {
      fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=hive&amp;vs_currencies=usd"
      )
        .then((response) => response.json())
        .then((data) => {
          if (data?.status?.error_code == 429) {
            const data = localStorage.getItem("hiveprice") || '{"hive": {"usd": 0}}';
            this.hiveprice = JSON.parse(data);
          } else try {
            this.hiveprice = data;
            localStorage.setItem("hiveprice", JSON.stringify(data));
          } catch (e) {
            const data = localStorage.getItem("hiveprice") || '{"hive": {"usd": 0}}';
            this.hiveprice = JSON.parse(data);
          }
        })
        .catch((error) => {
          const data = localStorage.getItem("hiveprice") || '{"hive": {"usd": 0}}';
          this.hiveprice = JSON.parse(data);
        })
      fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=hive_dollar&amp;vs_currencies=usd"
      )
        .then((response) => response.json())
        .then((data) => {
          if (data?.status?.error_code == 429) {
            const data = localStorage.getItem("hbdprice") || '{"hive_dollar": {"usd": 0}}';
            this.hbdprice = JSON.parse(data);
          } else try {
            this.hbdprice = data;
            localStorage.setItem("hbdprice", JSON.stringify(data));
          } catch (e) {
            const data = localStorage.getItem("hbdprice") || '{"hive_dollar": {"usd": 0}}';
            this.hbdprice = JSON.parse(data);
          }
        })
        .catch((error) => {
          const data = localStorage.getItem("hbdprice") || '{"hive_dollar": {"usd": 0}}';
          this.hbdprice = JSON.parse(data);
        })
    },
    getSNodes() {
      // fetch(this.sapi + "/runners")
      //   .then((response) => response.json())
      //   .then((data) => {
      //     this.runners = data.result.sort((a, b) => {
      //       return b.g - a.g;
      //     });
      //   });
      fetch(this.sapi + "/markets")
        .then((response) => response.json())
        .then((data) => {
          this.smarkets = data.markets;
          this.sstats = data.stats;
          this.sstats.head_block = data.head_block;
        });
    },
    reward_spk() {
      var r = 0,
        a = 0,
        b = 0,
        c = 0,
        t = 0,
        diff = this.saccountapi.head_block - this.saccountapi.spk_block;
      if (!this.saccountapi.spk_block) {
        return 0;
      } else if (diff < 28800) {
        return 0;
      } else {
        t = parseInt(diff / 28800);
        a = this.saccountapi.gov
          ? simpleInterest(this.saccountapi.gov, t, this.sstats.spk_rate_lgov)
          : 0;
        b = this.saccountapi.pow
          ? simpleInterest(this.saccountapi.pow, t, this.sstats.spk_rate_lpow)
          : 0;
        c = simpleInterest(
          parseInt(
            this.saccountapi.granted?.t > 0 ? this.saccountapi.granted.t : 0
          ) +
          parseInt(
            this.saccountapi.granting?.t > 0 ? this.saccountapi.granting.t : 0
          ),
          t,
          this.sstats.spk_rate_ldel
        );
        const i = a + b + c;
        if (i) {
          return i;
        } else {
          return 0;
        }
      }
      function simpleInterest(p, t, r) {
        const amount = p * (1 + parseFloat(r) / 365);
        const interest = amount - p;
        return parseInt(interest * t);
      }
    },
    getProtocol() {
      fetch(this.lapi + "/api/protocol")
        .then((response) => response.json())
        .then((data) => {
          this.protocol[data.jsontoken] = data
          this.prefix = data.prefix;
          this.multisig = data.multisig;
          this.jsontoken = data.jsontoken;
          this.TOKEN = data.jsontoken.toUpperCase();
          //location.hash = data.jsontoken;
          this.node = data.node;
          this.features = data.features ? data.features : this.features;
          this.behind = data.behind;
          this.behindTitle = data.behind + " Blocks Behind Hive";
        });
      fetch(`https://spkinstant.hivehoneycomb.com` + "/api/protocol")
        .then((response) => response.json())
        .then((data) => {
          this.protocol[data.jsontoken] = data
        });
      fetch(`https://spkinstant.hivehoneycomb.com` + "/spk/api/protocol")
        .then((response) => response.json())
        .then((data) => {
          this.protocol[data.jsontoken] = data
        });
        fetch("https://spktest.dlux.io/broca/api/protocol")
        .then((response) => response.json())
        .then((data) => {
          this.protocol[data.jsontoken] = data
        });
    },
    removeUser() {
      this.balance = 0;
      this.bartoken = "";
      this.barpow = "";
      this.bargov = "";
      this.accountapi = "";
      this.saccountapi = "";
      this.hasDrop = false;
      this.openorders = [];
      this.accountinfo = {};
      this.barhive = "";
      this.barhbd = "";
    },
    getPFP() {
      if (this.account) {
        fetch("https://token.dlux.io/api/pfp/" + this.account)
          .then((r) => r.json())
          .then((json) => {
            if (json.result == "No Profile Picture Set or Owned") return;
            this.pfp.setname = json.result[0].pfp.split(":")[0];
            this.pfp.uid = json.result[0].pfp.split(":")[1];
          });
      }
    },
    pm(a, b) {
      return a.some((item) => b.includes(item));
    },
    naiString(nai) {
      return `${parseFloat(nai.amount / Math.pow(10, nai.precision)).toFixed(
        nai.precision
      )} ${nai.token}`;
    },
    getSetDetailsInfo(s) {
      let r = "";
      s = this.baseScript[s]
      if (s && s.set) {
        try {
          r = `${s.set.Description}`;
        } catch (e) {
          r = "";
        }
      }
      return `${r}`;
    },
    rep(a) {
      if (!this.authors[this.posturls[a].author]) {
        setTimeout(
          function () {
            this.rep(a);
          }.bind(this),
          500
        );
      } else {
        this.posturls[a].rep = this.authors[this.posturls[a].author].reputation
      }
    },
    addBens(obj) {
      this.postBens.push(obj)
    },
    getNFTs(account) {
      this.accountNFTs = [];
      this.accountRNFTs = [];
      for (var i = 0; i < this.providers.length; i++) {
        this.NFTsLookUp(account, this.providers, i);
        this.trades(i);
        this.getSetDetails(i);
      }
    },
    getSetDetails(i) {
      fetch(`${this.providers[i].api}/api/sets`)
        .then((r) => r.json())
        .then((res) => {
          this.chains[this.providers[i].token].sets = {};
          for (var j = 0; j < res.result.length; j++) {
            this.chains[this.providers[i].token].sets[res.result[j].set] =
              res.result[j];
          }
        });
    },
    finishPFT(s) {
      if (this.baseScript[s.script] && (s.to == this.pageAccount || s.from == this.pageAccount)) {
        s.source = 'FTtrades'
        this.FTtrades.push(s);
      } else
        setTimeout(() => {
          this.finishPFT(s);
        }, 250);
    },
    finishPNFT(s) {
      if (this.baseScript[s.script] && (s.to == this.pageAccount || s.from == this.pageAccount)) {
        s.setname = s.set
        s.trade = true
        s.HTML = this.sanitizeHTML(s.comp.HTML)
        s.set = s.comp.set
        s.attributes = s.comp.attributes
        this.NFTtrades.push(s);
      } else
        setTimeout(() => {
          this.finishPNFT(s);
        }, 250);
    },
    trades(i) {
      this.FTtrades = []; // Clear existing FT trades
      this.NFTtrades = []; // Clear existing NFT trades
      fetch(this.providers[i].api + "/api/trades/fts/" + this.account)
        .then((r) => r.json())
        .then((json) => {
          const arr = json.result;
          const token = this.providers[i].token;
          for (var j = 0; j < arr.length; j++) {
            var trade = arr[j];
            trade.token = token;
            trade.priceString = `${parseFloat(
              trade.nai.amount / Math.pow(10, trade.nai.precision)
            ).toFixed(trade.nai.precision)} ${token.toUpperCase()}`;
            trade.qty = 1;
            this.finishPFT(trade);
          }
        })
      fetch(this.providers[i].api + "/api/trades/nfts/" + this.account)
        .then((r) => r.json())
        .then((json) => {
          const arr = json.result;
          const token = this.providers[i].token;
          for (var j = 0; j < arr.length; j++) {
            var trade = arr[j];
            trade.token = token;
            trade.priceString = `${parseFloat(
              trade.nai.amount / Math.pow(10, trade.nai.precision)
            ).toFixed(trade.nai.precision)} ${token.toUpperCase()}`;
            trade.qty = 1;
            this.callScript(trade).then((comp) => {
              trade.comp = comp;
              this.finishPNFT(trade);
            });
          }
        })
    },
    displayNFT(code, payload) {
      if (code === 0) {
        this.displayNFTs = this.accountNFTs;
        return;
      }
      if (code === 1) {
        this.displayNFTs = [...this.accountNFTs];
        for (var i = 0; i < this.displayNFTs.length; i++) {
          if (
            this.NFTselect.searchTerm &&
            this.NFTselect.searchTerm.indexOf(
              this.displayNFTs[i][this.NFTselect.sort]
            ) == -1
          ) {
            this.displayNFTs.splice(i, 1);
            i--;
          }
        }
        if (this.NFTselect.dir == "desc") {
          this.displayNFTs.reverse();
        }
      }
    },
    NFTsLookUp(un, p, i) {
      fetch(p[i].api + "/api/nfts/" + un)
        .then((r) => r.json())
        .then((json) => {
          var NFTs = json.result;
          var rNFTs = json.mint_tokens;
          var scripts = {};
          for (var j = 0; j < NFTs.length; j++) {
            NFTs[j].token = p[i].token;
            NFTs[j].owner = un;
            // this.itemModal.items.push(NFTs[j]);
            // this.itemModal.item = this.itemModal[0];
            scripts[NFTs[j].script] = { token: p[i].token, set: NFTs[j].setname };
            this.callScript(NFTs[j]).then((comp) => {
              // Sanitize HTML content for NFTs
              if (comp.HTML) {
                comp.HTML = this.sanitizeHTML(comp.HTML);
              }
              this.accountNFTs.push(comp);
              this.displayNFT(0);
            });
          }
          for (var j = 0; j < rNFTs.length; j++) {
            rNFTs[j].token = p[i].token;
            scripts[rNFTs[j].script] = 1;
            rNFTs[j].source = 'accountRNFTs'
            this.accountRNFTs.push(rNFTs[j]);
          }
          for (var script in scripts) {
            this.callScript({
              script,
              token: scripts[script].token,
              set: scripts[script].setname,
            }).then((comp) => {
              // Sanitize HTML content for base scripts
              if (comp.HTML) {
                comp.HTML = this.sanitizeHTML(comp.HTML);
              }
              this.baseScript[comp.script] = comp;
              this.baseScript[comp.script].token = p[i].token;
              this.baseScript[comp.script].setname = scripts[script].setname;
            });
          }
        });
    },
    getAttr(script, att) {
      if (this.baseScript[script]) return this.baseScript[script].set[att];
    },
    getTokenUser(user = this.account, fu) {
      this.getPFP();
      fetch(this.lapi + "/@" + user)
        .then((response) => response.json())
        .then((data) => {
          data.tick = data.tick || 0.01;
          this.behind = data.behind;
          if (!fu) {
            // If viewing another user's profile, store their data in accountapi
            // If viewing own profile, also store in accountapi (current behavior)
            this.balance = (data.balance / 1000).toFixed(3);
            this.bargov = (data.gov / 1000).toFixed(3);
            this.accountapi = data;
            this.denoms.DLUX = {
              balance: `${this.formatNumber((data.balance / 1000).toFixed(3), 3, '.', ',')} DLUX`
            }
            this.dluxval =
              (data.balance + data.gov + data.poweredUp + data.claim) / 1000;
          } else {
            this.focusaccountapi = data;
          }
        });
    },
    getSpkStats() {
      fetch(this.sapi + "/stats")
        .then((response) => response.json())
        .then((data) => {
          this.spkStats = data.result;
        });
    },
    async getSapi(user = this.account, fu) {
      this.reloaded = false
      if (user) fetch(this.sapi + "/@" + user)
        .then((response) => response.json())
        .then((data) => {
          this.reloaded = true
          this.getMARKETS()
          data.tick = data.tick || 0.01;
          this.larynxbehind = data.behind;
          if (!fu) {
            this.lbalance = (data.balance / 1000).toFixed(3);
            this.lbargov = (data.gov / 1000).toFixed(3);
            data.powerDowns = Object.keys(data.power_downs);
            for (var i = 0; i < data.powerDowns.length; i++) {
              data.powerDowns[i] = data.powerDowns[i].split(":")[0];
            }
            this.saccountapi = data;
            this.saccountapi.spk += this.reward_spk();
            if (!this.saccountapi.granted.t) this.saccountapi.granted.t = 0;
            if (!this.saccountapi.granting.t) this.saccountapi.granting.t = 0;
            this.spkval =
              (data.balance +
                data.gov +
                data.poweredUp +
                this.saccountapi.granting.t +
                data.claim +
                data.spk) /
              1000;
          } else {
            this.focussaccountapi = data;
          }
        });
    },
    defaults() {
      this.newToken.token = this.newToken.token.toUpperCase()
      this.newToken.tag = this.newToken.token.toLowerCase()
      this.newToken.jsontoken = this.newToken.tag
      this.newToken.prefix = this.newToken.tag + '_'
      this.newToken.leader = this.account
      this.newToken.ms = this.newToken.tag + "-cc"
      this.newAccount.name = this.newToken.ms
      this.newAccountDeets = true
      this.checkAccount(this.newToken.ms, "newAccountDeets")
      if (!this.newToken.dist[this.newToken.leader]) this.newToken.dist = {
        [this.newToken.leader]: {
          l: 0,
          p: 0,
          g: 1
        }
      }
    },
    siteDefaults() {
      if (this.newToken.fe.indexOf('https://') > -1) this.newToken.fe = 'https://' + this.newToken.fe
      this.newToken.mainfe = 'https://' + this.newToken.fe
      this.newToken.mainapi = 'https://api.' + this.newToken.fe
      this.newToken.mainipfs = 'https://ipfs.' + this.newToken.fe
      this.newToken.mainrender = 'https://data.' + this.newToken.fe
    },
    saveNewToken() {
      var pendingTokens = JSON.parse(localStorage.getItem(`pendingTokens`)) || []
      if (pendingTokens.indexOf(this.newToken.token) == -1) pendingTokens.push(this.newToken.token)
      localStorage.setItem(`newToken${this.newToken.token}`, JSON.stringify(this.newToken))
      localStorage.setItem(`pendingTokens`, JSON.stringify(pendingTokens))
      this.pendingTokens = pendingTokens
    },
    loadNewToken(token) {
      this.newToken = JSON.parse(localStorage.getItem(`newToken${token}`))
    },
    deleteNewToken(token) {
      localStorage.removeItem(`newToken${token}`)
      var pendingTokens = JSON.parse(localStorage.getItem(`pendingTokens`)) || []
      pendingTokens = pendingTokens.filter(t => t != token)
      localStorage.setItem(`pendingTokens`, JSON.stringify(pendingTokens))
      this.pendingTokens = pendingTokens
    },
    when(arr) {
      if (!arr.length) return "";
      var seconds =
        (parseInt(arr[0]) - parseInt(this.saccountapi.head_block)) * 3;
      var interval = Math.floor(seconds / 86400);
      if (interval >= 1) {
        return interval + ` day${interval > 1 ? "s" : ""}`;
      }
      interval = Math.floor(seconds / 3600);
      if (interval >= 1) {
        return interval + ` hour${interval > 1 ? "s" : ""}`;
      }
      interval = Math.floor(seconds / 60);
      if (interval >= 1) {
        return `${interval} minute${interval > 1 ? "s" : ""}`;
      }
      return Math.floor(seconds) + " seconds";
    },
    getHiveUser(user = this.account) {
      fetch(hapi, {
        body: `{"jsonrpc":"2.0", "method":"condenser_api.get_accounts", "params":[["${user}"]], "id":1}`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        method: "POST",
      })
        .then((response) => response.json())
        .then((data) => {
          this.accountinfo = data.result[0];
          this.barhive = this.accountinfo.balance;
          this.denoms.HIVE.balance = `${this.formatNumber((parseFloat(this.accountinfo.balance)).toFixed(3), 3, '.', ',')} HIVE`
          this.barhbd = this.accountinfo.hbd_balance;
          this.denoms.HBD.balance = `${this.formatNumber((parseFloat(this.accountinfo.hbd_balance)).toFixed(3), 3, '.', ',')} HBD`
          var pfp = "";
          if (user == this.account) {
            try {
              var profilePicUrl = '/img/no-user.png'
              const metadata = JSON.parse(this.accountinfo.posting_json_metadata || this.accountinfo.json_metadata || '{}');
              if (metadata.profile && metadata.profile.profile_image) {
                profilePicUrl = metadata.profile.profile_image;
              }
              this.mypfp = profilePicUrl
            } catch (e) {
              this.mypfp = '/img/no-user.png'
            }
          }
          const total_vests =
            parseInt(this.accountinfo.vesting_shares) +
            parseInt(this.accountinfo.received_vesting_shares) -
            parseInt(this.accountinfo.delegated_vesting_shares);
          const final_vest = total_vests * 1000000;
          const power =
            (parseInt(this.accountinfo.voting_power) * 10000) / 10000 / 50;
          this.accountinfo.rshares = (power * final_vest) / 10000;
        });
      fetch(hapi, {
        body: `{"jsonrpc":"2.0", "method":"condenser_api.find_rc_accounts", "params":[["${user}"]], "id":1}`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        method: "POST",
      })
        .then((response) => response.json())
        .then((data) => {
          this.rcinfo = {
            current: data.result[0].rc_manabar.current_mana,
            max: data.result[0].max_rc
          }
          this.calculateHbdSavingsInterest(this.focus)
        });
    },
    getHiveStats() {
      this.hiveApiCall('condenser_api.get_dynamic_global_properties', [])
        .then(result => {
          this.hivestats = result;
        })
        .catch(error => { console.error('Failed to fetch Hive stats:', error); });
    },
    getHiveAuthors(users) {
      var q = "";
      for (var i = 0; i < users.length; i++) {
        if (!this.authors[users[i]]) q += `"${users[i]}",`;
      }
      if (q.length > 0) {
        q = q.substring(0, q.length - 1);
        fetch(hapi, {
          body: `{"jsonrpc":"2.0", "method":"condenser_api.get_accounts", "params":[[${q}]], "id":1}`,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          method: "POST",
        })
          .then((response) => response.json())
          .then((data) => {
            for (var i = 0; i < data.result.length; i++) {
              this.authors[data.result[i].name] = data.result[i];
            }
            // Update reputation for posts using the new author data
            this.updateReputationForPosts(data.result);
          });
      }
    },
    updateReputationForPosts(authors) {
      for (const author of authors) {
        if (author && author.name && author.reputation) {
          let updatedCount = 0;
          for (const postKey in this.posturls) {
            if (this.posturls[postKey].author === author.name && this.posturls[postKey].rep === "...") {
              // Try to use author_reputation from post first, then fall back to author reputation
              const post = this.posturls[postKey];
              if (post.author_reputation) {
                post.rep = post.author_reputation;
              } else {
                post.rep = author.reputation;
              }
              updatedCount++;
            }
          }
          if (updatedCount > 0) {
          }
        }
      }
    },
    getRcAccount(account) {
      this.hiveApiCall('rc_api.find_rc_accounts', { accounts: [account] })
        .then(result => {
          this.rcAccount = result.rc_accounts[0];
        });
    },
    getHpDelegationsOut(account) {
      this.hiveApiCall('condenser_api.get_vesting_delegations', [account, '', 100])
        .then(result => {
          this.hpDelegationsOut = result;
        });
    },
    getHpDelegationsIn(account) {
      this.hiveApiCall('database_api.list_vesting_delegations', {
        start: [account, ''],
        limit: 100,
        order: 'by_delegationing'
      })
        .then(result => {
          this.hpDelegationsIn = result.delegations.filter(delegation => delegation.delegatee === account);
        });
    },
    fetchDelegationsData() {
      if (this.delegationsFetched) return;
      this.isLoading = true;
      Promise.all([
        this.hiveApiCall('condenser_api.get_vesting_delegations', [this.focus.name, '', 100]),
        this.hiveApiCall('rc_api.list_rc_direct_delegations', {
          start: [this.focus.name, ''],
          limit: 100
        })
      ])
        .then(([hpOutRes, rcOutRes]) => {
          this.hpDelegationsOut = hpOutRes;
          this.rcDelegationsOut = rcOutRes.rc_direct_delegations.filter(d => d.from === this.focus.name);
          const uniqueToAccounts = [...new Set(this.rcDelegationsOut.map(d => d.to))];
          this.delegationsFetched = true;
          return this.hiveApiCall('rc_api.find_rc_accounts', { accounts: uniqueToAccounts });
        })
        .then(result => {
          this.rcAccounts = {};
          result.rc_accounts.forEach(acc => {
            this.rcAccounts[acc.account] = acc;
          });
          this.delegationsFetched = true;
        })
        .catch(error => {
          console.error('Failed to fetch delegations:', error);
          this.error = 'Failed to load delegations';
        })
        .finally(() => {
          this.isLoading = false;
        });
    },
    calculateRcPercentage(accountRCinfo) {
      if (!accountRCinfo) return 0
      const currentMana = parseInt(accountRCinfo.rc_manabar.current_mana)
      const maxRc = parseInt(accountRCinfo.max_rc)
      return ((currentMana / maxRc) * 100).toFixed(2)
    },
    calculateDelegatedRcPercentage(accountRCinfo, delegatedRc) {
      if (!accountRCinfo) return 0
      const delegatedMana = parseInt(delegatedRc)
      const maxRc = parseInt(accountRCinfo.max_rc)
      return ((delegatedMana / maxRc) * 100).toFixed(2)
    },
    calculateOwnRcPercentage(accountRCinfo, delegatedRc) {
      if (!accountRCinfo) return 0
      const currentMana = parseInt(accountRCinfo.rc_manabar.current_mana)
      const delegatedMana = parseInt(delegatedRc)
      const ownMana = Math.max(0, currentMana - delegatedMana)
      const maxRc = parseInt(accountRCinfo.max_rc)
      return ((ownMana / maxRc) * 100).toFixed(2)
    },
    pullScript(id) {
      return new Promise((resolve, reject) => {
        fetch(`https://ipfs.dlux.io/ipfs/${id}`)
          .then((response) => response.text())
          .then((data) => {
            this.nftscripts[id] = data;
            resolve("OK");
          });
      });
    },
    Base64toNumber(chars) {
      const glyphs =
        "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+=";
      var result = 0;
      chars = chars.split("");
      for (var e = 0; e < chars.length; e++) {
        result = result * 64 + glyphs.indexOf(chars[e]);
      }
      return result;
    },
         async callScript(o) {
       // Use secure NFT script executor only
       if (!window.NFTScriptExecutor || typeof window.NFTScriptExecutor.callScript !== 'function') {
         throw new Error('Secure NFT Script Executor not available - NFT scripts cannot be executed safely');
       }
       
       try {
         return await window.NFTScriptExecutor.callScript(o);
       } catch (error) {
         console.error('Secure NFT script execution failed:', error);
         throw error;
       }
     },
    keyOf(obj = "smarkets", key = "node") {
      if (this[obj]) {
        if (this[obj][key]) {
          return 1;
        }
      }
      return 0;
    },
    newme(user) {
      this.delegationsFetched = false
      this.rcAccount = null
      this.getRcAccount(this.account)
      this.hpDelegationsOut = []
      this.hpDelegationsIn = []
      this.rcDelegationsOut = []
      this.rcDelegationsIn = []
      this.contracts = []
      this.posturls = {}
      this.FTtrades = []
      this.NFTtrades = []
      this.accountNFTs = []
      this.accountRNFTs = []
      this.displayNFTs = []
      this.postSelect = {
        sort: "time",
        searchTerm: "",
        bitMask: 0,
        entry: "new",
        search: {
          a: 10,
          o: 0,
          e: false,
          p: false,
        },
        new: {
          a: 10, //amount
          o: 0, //offset
          e: false, //end
          p: false, //pending - One pending request
        },
        trending: {
          a: 10,
          o: 0,
          e: false,
          p: false,
        },
        promoted: {
          a: 10,
          o: 0,
          e: false,
          p: false,
        },
        sortDir: "desc",
        types: {
          VR: {
            checked: true,
            icon: "fa-solid fa-vr-cardboard me-2",
            launch: "3D / VR Experience",
            location: "/dlux/@",
            hint: "",
            bitFlag: 1,
          },
          AR: {
            checked: true,
            icon: "fa-solid fa-glasses me-2",
            launch: "AR Experience",
            location: "/dlux/@",
            hint: "",
            bitFlag: 2,
          },
          XR: {
            checked: true,
            icon: "fa-brands fa-unity me-2",
            launch: "Extended Reality Experience",
            location: "/dlux/@",
            hint: "",
            bitFlag: 4,
          },
          APP: {
            checked: true,
            icon: "fa-solid fa-mobile-screen-button me-2",
            launch: "Unstoppable App",
            location: "/dlux/@",
            hint: "",
            bitFlag: 8,
          },
          ["360"]: {
            checked: true,
            icon: "fa-solid fa-globe me-2",
            launch: "360 Photo Gallery",
            location: "/dlux/@",
            hint: "",
            bitFlag: 16,
          },
          ["3D"]: {
            checked: true,
            icon: "fa-solid fa-shapes me-2",
            launch: "3D / VR Experience",
            location: "/dlux/@",
            hint: "",
            bitFlag: 32,
          },
          Audio: {
            checked: true,
            icon: "fa-solid fa-music me-2",
            launch: "Unstoppable Audio",
            location: "/dlux/@",
            hint: "",
            bitFlag: 64,
          },
          Video: {
            checked: true,
            icon: "fa-solid fa-film me-2",
            launch: "Unstoppable Video",
            location: "/dlux/@",
            hint: "",
            bitFlag: 128,
          },
          Blog: {
            checked: false,
            icon: "fa-solid fa-book me-2",
            launch: "Visit Full Blog",
            location: "/blog/@",
            hint: "",
            bitFlag: 256,
          },
        },
      };
      if (location.pathname.split("/@")[1]) {
        this.pageAccount = location.pathname.split("/@")[1];
      } else {
        this.pageAccount = this.account;
        this.me = true;
      }
      if (this.pageAccount == this.account) this.me = true;
      this.focus.account = this.pageAccount;
      this.sapi = sapi;
      this.checkAccount("pageAccount", "focus");
      this.getHiveStats();
      this.getHiveUser()
      this.getQuotes();
      this.getSNodes();
      this.getPosts();
      this.getProtocol();
      this.getSpkStats();
      this.getRewardFund();
      this.getFeedPrice();
      this.getSapi(this.pageAccount, false);
      this.getTokenUser(this.pageAccount, false);
      if (!this.me) this.accountRelations(this.pageAccount);
      this.getNFTs(this.pageAccount);
    },
    goBack() {
      window.history.back();
    },
    getIcon(s) {
      return this.baseScript[s] ? this.baseScript[s].set.faicon : "";
    },
    mintsQty(item) {
      return this.getMint(this.chains[item.token]?.sets[item.set]?.set, 'qty')
    },
    injectIndex(dir) {
      switch (dir) {
        case 'up':
          this.activeIndexUp()
          break;
        case 'dn':
          this.activeIndexDn()
          break;
        default:
          this.activeIndex = parseInt(dir)
      }
      this.focusItem = this[this.focusItem.source][this.activeIndex]
    },
    calculateAPR() {
      var binSearch = 105120
      var lastFit = 0
      var lastDown = 0
      var lastUp = 0
      const INT = 1000000
      const SAT = INT * (1 + this.newToken.apy / 100) // Target after one year: principal + APY%
      var oneOff = false
      var j = 0
      while (binSearch != lastFit) {
        j++
        lastFit = binSearch
        var int = INT
        for (var i = 0; i < 2016; i++) {
          int += parseInt(int / binSearch)
          // Smart break: if we've already exceeded the target, no need to continue
          if (int >= SAT) break
        }
        if (int > SAT) {
          lastDown = binSearch
          binSearch = lastUp ? parseInt((lastUp + binSearch) / 2) : parseInt(binSearch * 2)
          if (binSearch == lastFit) {
            if (oneOff) break
            binSearch = binSearch - 1
            oneOff = true
          }
        } else {
          lastUp = binSearch
          binSearch = lastDown ? parseInt((lastDown + binSearch) / 2) : parseInt(binSearch / 2)
          if (binSearch == lastFit) {
            if (oneOff) break
            binSearch = binSearch + 1
            oneOff = true
          }
        }
        if (isNaN(binSearch) || j > 100) break
      }
      this.newToken.apyint = binSearch
    },
    getPossibleBitrates(height) {
      if (!height) {
        return null
      }

      if (height < 144) {
        // very small bitrate, use the original format.
        return ['?x' + height]
      } else if (height < 240) {
        return ['?x144']
      } else if (height < 360) {
        return ['?x240', '?x144']
      } else if (height < 480) {
        return ['?x360', '?x240', '?x144']
      } else if (height < 720) {
        return ['?x480', '?x360', '?x240', '?x144']
      } else if (height < 1080) {
        return ['?x720', '?x480', '?x360', '?x240', '?x144']
      } else if (height < 1440) {
        return ['?x1080', '?x720', '?x480', '?x360', '?x240', '?x144']
      } else if (height < 2160) {
        return ['?x1440', '?x1080', '?x720', '?x480', '?x360', '?x240', '?x144']
      } else {
        return ['?x2160', '?x1440', '?x1080', '?x720', '?x480', '?x360', '?x240', '?x144']
      }
    },
    async transcode(event) {
      if (!this.ffmpegReady && !this.ffmpegSkipped) {
        this.videoMsg = 'Please load FFmpeg first or skip to upload pre-transcoded files.';
        return;
      }
      
      if (this.ffmpegSkipped) {
        // Handle direct file upload without transcoding
        const file = event.target.files[0];
        if (file) {
          this.videoFilesToUpload = [{
            file: file,
            targetPath: '/videos/'
          }];
          this.videoMsg = 'Video file ready for upload (no transcoding).';
          this.videosrc = URL.createObjectURL(file);
        }
        return;
      }
      
      if (!this.ffmpeg) {
        this.videoMsg = 'FFmpeg not properly initialized. Please try reloading FFmpeg.';
        return;
      }

      this.ffmpeg_page = true
      const { fetchFile } = FFmpegUtil;
      let ffmpeg = this.ffmpeg;
      var qsv = false
      var height = 0
      var width = 0
      var run = 0
      var bitrates = []
      const patt = /\d{3,5}x\d{3,5}/
      
      if (!ffmpeg) {
        this.videoMsg = 'FFmpeg not loaded. Please load FFmpeg first.';
        return;
      }
      
      const { name } = event.target.files[0];
      await ffmpeg.writeFile(name, await fetchFile(event.target.files[0]));
      var codec = "libx264";
      
      await ffmpeg.exec(["-encoders"]);
      
      // Get video dimensions to properly handle mobile/portrait videos
      this.videoMsg = 'Analyzing video dimensions...';
      try {
        await ffmpeg.exec(["-i", name]);
      } catch (e) {
        // FFmpeg outputs info to stderr, so we expect an "error" here
        // The dimensions info is still captured
      }
      
      // Try to extract dimensions from FFmpeg output or use video element
      let videoWidth = width || 1280;
      let videoHeight = height || 720;
      
      // Create a temporary video element to get actual dimensions
      const tempVideo = document.createElement('video');
      tempVideo.src = URL.createObjectURL(event.target.files[0]);
      
      await new Promise((resolve) => {
        tempVideo.onloadedmetadata = () => {
          videoWidth = tempVideo.videoWidth;
          videoHeight = tempVideo.videoHeight;
          URL.revokeObjectURL(tempVideo.src);
          resolve();
        };
        tempVideo.onerror = () => {
          console.warn('Could not detect video dimensions, using defaults');
          URL.revokeObjectURL(tempVideo.src);
          resolve();
        };
      });
      
      // For resolution ladder, use the SMALLER dimension to avoid upscaling
      // Portrait videos should not be upscaled to landscape resolutions
      const referenceDimension = Math.min(videoWidth, videoHeight);
      
      bitrates = this.getPossibleBitrates(referenceDimension);
      
      // For portrait videos, we need to adjust the scale filter
      const isPortrait = videoHeight > videoWidth;
      
      // Filter out resolutions that would upscale the video
      const originalMaxDimension = Math.max(videoWidth, videoHeight);
      bitrates = bitrates.filter(b => {
        const targetRes = parseInt(b.split('x')[1]);
        return targetRes <= originalMaxDimension;
      });
      
      // Limit resolutions to reduce memory pressure in FFmpeg.wasm
      if (bitrates.length > 3) {
        bitrates = bitrates.slice(0, 3); // Keep only top 3 resolutions
      }
      
      if (bitrates.length === 0) {
        this.videoMsg = 'Video resolution too small for transcoding. Use direct upload instead.';
        return;
      }
      

      // Reset hashing progress and start progress monitoring
      this.resetHashingProgress();
      const progressInterval = this.startTranscodeProgressMonitoring(ffmpeg, bitrates.length);
      
      // Use separate FFmpeg commands for each resolution to ensure all files are created
      this.videoMsg = 'Starting multi-resolution transcoding...';
      console.time('exec');
      
      const successfulResolutions = [];
      
      try {
        // Store extracted files for all resolutions
        const extractedFiles = new Map(); // Map<filename, Uint8Array>
        
        // Process each resolution sequentially - extract files after each completion
        for (let i = 0; i < bitrates.length; i++) {
          const resHeight = parseInt(bitrates[i].split('x')[1]);
          
          // Calculate proper scale filter with explicit dimensions
          let scaleFilter;
          let targetWidth, targetHeight;
          
          if (isPortrait) {
            // For portrait: calculate width based on aspect ratio
            targetHeight = resHeight;
            targetWidth = Math.round((videoWidth / videoHeight) * targetHeight);
            // Ensure even numbers for h264
            if (targetWidth % 2 !== 0) targetWidth += 1;
            if (targetHeight % 2 !== 0) targetHeight += 1;
            scaleFilter = `scale=${targetWidth}:${targetHeight}`;
          } else {
            // For landscape: calculate height based on aspect ratio  
            targetWidth = Math.round((resHeight * videoWidth) / videoHeight);
            targetHeight = resHeight;
            // Ensure even numbers for h264
            if (targetWidth % 2 !== 0) targetWidth += 1;
            if (targetHeight % 2 !== 0) targetHeight += 1;
            scaleFilter = `scale=${targetWidth}:${targetHeight}`;
          }
          
          // Build command for this resolution with shorter segments for short videos
          const commands = [
            "-i", name,
            "-c:v", codec,
            "-crf", "26", 
            "-preset", "fast",
            "-c:a", "aac", 
            "-b:a", "256k",
            "-vf", scaleFilter,
            "-pix_fmt", "yuv420p",
            "-profile:v", "main",
            "-max_muxing_queue_size", "1024",
            "-f", "segment",
            "-segment_time", "5",  // Shorter segments for better compatibility with short videos
            "-segment_format", "mpegts",
            "-segment_list_type", "m3u8",
            "-segment_list", `${resHeight}p_index.m3u8`,
            "-hls_time", "3",      // Shorter HLS time
            "-hls_list_size", "0",
            "-force_key_frames", "expr:gte(t,n_forced*3)", // Force keyframes every 3 seconds
            `${resHeight}p_%03d.ts`
          ];
          
          this.videoMsg = `Transcoding ${resHeight}p (${i + 1}/${bitrates.length})...`;
          
          try {
            
            // Log filesystem state before transcode
            const filesBefore = await ffmpeg.listDir("/");
            
            
            try {
              await ffmpeg.exec(commands);
              
              // Wait a moment for FFmpeg to fully write files
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Test if input file is still accessible
              try {
                await ffmpeg.exec(["-i", name, "-t", "0.1", "-f", "null", "-"]);
              } catch (testError) {
                console.error(`⚠️ ${resHeight}p: Input file test failed:`, testError);
              }
              
            } catch (execError) {
              console.error(`❌ ${resHeight}p FFmpeg exec error:`, execError);
              throw execError;
            }
            
            // Check filesystem immediately after FFmpeg claims completion
            const filesAfter = await ffmpeg.listDir("/");
            const allFiles = filesAfter.map(f => f.name).filter(name => !name.startsWith('.') && !['dev', 'home', 'proc', 'tmp'].includes(name));
            
            const segmentFiles = filesAfter.filter(f => f.name.startsWith(`${resHeight}p_`) && f.name.endsWith('.ts'));
            const playlistFile = filesAfter.find(f => f.name === `${resHeight}p_index.m3u8`);
            
            
            if (playlistFile && segmentFiles.length > 0) {
              successfulResolutions.push(resHeight);
              
              // Extract files to memory for processing and cleanup filesystem
              
              // Read segment files
              for (const segFile of segmentFiles) {
                const segData = await ffmpeg.readFile(segFile.name);
                // Create proper copy - slice() creates a new buffer
                const segDataCopy = segData.slice();
                extractedFiles.set(segFile.name, segDataCopy);
              }
              
              // Read playlist file
              const playlistData = await ffmpeg.readFile(playlistFile.name);
              // Create proper copy - slice() creates a new buffer
              const playlistDataCopy = playlistData.slice();
              extractedFiles.set(playlistFile.name, playlistDataCopy);
              
              // Clean up FFmpeg filesystem (keep input file for next resolution)
              try {
                for (const segFile of segmentFiles) {
                  await ffmpeg.deleteFile(segFile.name);
                }
                await ffmpeg.deleteFile(playlistFile.name);
              } catch (cleanupError) {
                console.warn(`⚠️ Cleanup warning for ${resHeight}p:`, cleanupError);
              }
              
            } else {
              // Log what's missing
              console.error(`❌ ${resHeight}p missing files - Segments: ${segmentFiles.length}, Playlist: ${playlistFile ? 'found' : 'missing'}`);
              throw new Error(`${resHeight}p files not found after FFmpeg completion`);
            }
          } catch (error) {
            console.error(`❌ ${resHeight}p transcoding failed:`, error);
            
            // Log filesystem state on failure
            try {
              const filesOnError = await ffmpeg.listDir("/");
            } catch (e) {
              console.error(`Can't list files on error:`, e);
            }
            
            // Continue with other resolutions
          }
        }
        
        // Skip restoration - we have the files in memory and they exist in filesystem
        
        // Verify filesystem still has our files
        const verifyFiles = await ffmpeg.listDir("/");
        const existingFiles = verifyFiles.map(f => f.name).filter(name => 
          !name.startsWith('.') && !['dev', 'home', 'proc', 'tmp'].includes(name)
        );
        
        console.timeEnd('exec');
        
        if (successfulResolutions.length === 0) {
          throw new Error('All resolution transcoding failed');
        }
        
        this.videoMsg = `🎉 Successfully transcoded ${successfulResolutions.length} resolutions! Preparing upload...`;
        
        // Wait a bit more for all files to be fully written
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      // Enhanced file validation and processing - MOVED TO TOP OF FUNCTION
      const validateAndProcessFiles = async (extractedFiles) => {
        
        // Work directly with extracted files instead of filesystem
        const extractedFilenames = Array.from(extractedFiles.keys());
        const tsFiles = extractedFilenames.filter(name => name.endsWith('.ts'));
        const m3u8Files = extractedFilenames.filter(name => name.endsWith('.m3u8'));
        const expectedPlaylists = successfulResolutions.map(r => `${r}p_index.m3u8`);
        const actualPlaylists = m3u8Files;
        
        
        // Check which playlists actually exist in extracted data
        const existingPlaylists = expectedPlaylists.filter(playlist => 
          actualPlaylists.includes(playlist)
        );
        
        if (existingPlaylists.length === 0) {
          console.error(`❌ Critical: No playlists found in extracted data`);
          this.videoMsg = '❌ No valid playlists found in extracted data. Please try transcoding again.';
          return;
        }
        
        if (existingPlaylists.length < expectedPlaylists.length) {
          const missing = expectedPlaylists.filter(p => !existingPlaylists.includes(p));
          console.warn(`⚠️ Missing playlists: ${missing.join(', ')} - continuing with available ones`);
        }
        
        this.videoMsg = `Processing ${existingPlaylists.length} valid resolution(s) from extracted data...`;
        
        // Process files directly from extracted data
        const videoFiles = [];
        const segmentMapping = new Map();
        const resolutionPlaylists = [];
        
        // Initialize progress tracking for existing files only
        const actualSegmentFiles = tsFiles.filter(filename => {
          // Check if this segment belongs to a valid resolution
          return existingPlaylists.some(playlist => {
            const resolution = playlist.match(/(\d+)p_index\.m3u8/)?.[1];
            return resolution && filename.startsWith(`${resolution}p_`);
          });
        });
        
        this.hashingProgress.total = (actualSegmentFiles.length + existingPlaylists.length) * 2;
        this.hashingProgress.current = 0;
        this.hashingProgress.percentage = 0;
        
        
        // Process segments first from extracted data
        const segmentPromises = actualSegmentFiles.map(async (filename) => {
          const data = extractedFiles.get(filename);
          if (!data) {
            console.error(`❌ Missing extracted data for ${filename}`);
            return null;
          }
          
          this.hashingProgress.current++;
          this.hashingProgress.currentFile = filename;
          this.hashingProgress.percentage = Math.round((this.hashingProgress.current / this.hashingProgress.total) * 100);
          this.videoMsg = `Reading segments: ${Math.ceil(this.hashingProgress.current / 2)}/${Math.ceil(this.hashingProgress.total / 2)} - ${filename}`;
          
          const newFileName = filename.endsWith('_thumb.ts') ? filename : filename.replace('.ts', '_thumb.ts');
          const contentBuffer = buffer.Buffer(data.buffer);
          const hashResult = await this.hashOf(contentBuffer, {});
          const segmentHash = hashResult.hash;
          
          this.hashingProgress.current++;
          this.hashingProgress.percentage = Math.round((this.hashingProgress.current / this.hashingProgress.total) * 100);
          this.videoMsg = `Hashing segments: ${Math.ceil(this.hashingProgress.current / 2)}/${Math.ceil(this.hashingProgress.total / 2)} (${this.hashingProgress.percentage}%)`;
          
          videoFiles.push({
            file: new File([data.buffer], newFileName, { type: 'video/mp2t' }),
            targetPath: '/Videos',
            isThumb: true
          });
          
          this.dataURLS.push([newFileName, data.buffer, 'video/mp2t']);
          segmentMapping.set(filename, segmentHash);
          
          return { originalName: filename, newFileName, segmentHash };
        });
        
        await Promise.all(segmentPromises.filter(p => p !== null));
        
        // Process playlists from extracted data
        for (const playlistName of existingPlaylists) {
          const data = extractedFiles.get(playlistName);
          if (!data) {
            console.error(`❌ Missing extracted data for ${playlistName}`);
            continue;
          }
          
          let playlistContent = new TextDecoder().decode(data);
          
          this.hashingProgress.current++;
          this.hashingProgress.currentFile = playlistName;
          this.hashingProgress.percentage = Math.round((this.hashingProgress.current / this.hashingProgress.total) * 100);
          this.videoMsg = `Processing playlists: ${Math.ceil(this.hashingProgress.current / 2)}/${Math.ceil(this.hashingProgress.total / 2)} - ${playlistName}`;
          
          // Replace segment references with IPFS hashes
          segmentMapping.forEach((actualHash, originalName) => {
            const segmentPattern = new RegExp(originalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            playlistContent = playlistContent.replace(segmentPattern, `https://ipfs.dlux.io/ipfs/${actualHash}?filename=${originalName}`);
          });
          
          const resPlaylistFile = new File([new TextEncoder().encode(playlistContent)], playlistName.replace('.m3u8', '_thumb.m3u8'), { 
            type: 'application/x-mpegURL' 
          });
          
          videoFiles.push({
            file: resPlaylistFile,
            targetPath: '/Videos',
            isThumb: true,
            isResolutionPlaylist: true
          });
          
          this.dataURLS.push([resPlaylistFile.name, new TextEncoder().encode(playlistContent), 'application/x-mpegURL']);
          
          const resolution = playlistName.match(/(\d+)p_index/)?.[1] || 'unknown';
          resolutionPlaylists.push({
            fileName: resPlaylistFile.name,
            resolution: resolution,
            originalName: playlistName,
            content: playlistContent,
            originalContent: new TextDecoder().decode(data)
          });
          
          this.hashingProgress.current++;
          this.hashingProgress.percentage = Math.round((this.hashingProgress.current / this.hashingProgress.total) * 100);
          this.videoMsg = `Hashing playlists: ${Math.ceil(this.hashingProgress.current / 2)}/${Math.ceil(this.hashingProgress.total / 2)} (${this.hashingProgress.percentage}%)`;
        }
        
        // Set up preview with available resolutions
        if (resolutionPlaylists.length > 0) {
          this.transcodePreview.available = true;
          this.transcodePreview.resolutions = resolutionPlaylists.map(playlist => ({
            resolution: playlist.resolution,
            fileName: playlist.fileName,
            originalContent: playlist.originalContent
          })).sort((a, b) => parseInt(b.resolution) - parseInt(a.resolution));
          
          this.transcodePreview.selectedResolution = this.transcodePreview.resolutions[0];
          this.setPreviewVideoSrc();
          
        }
        
        // Create master playlist from available resolutions
        if (resolutionPlaylists.length > 0) {
          this.videoMsg = 'Creating master playlist...';
          
          const hashPromises = resolutionPlaylists.map(async (playlist) => {
            const contentBuffer = buffer.Buffer(new TextEncoder().encode(playlist.content));
            const hashResult = await this.hashOf(contentBuffer, {});
            playlist.hash = hashResult.hash;
            return playlist;
          });
          
          const hashedPlaylists = await Promise.all(hashPromises);
          
          // Create master playlist content
          let masterPlaylistContent = '#EXTM3U\n#EXT-X-VERSION:3\n';
          hashedPlaylists.sort((a, b) => parseInt(b.resolution) - parseInt(a.resolution)).forEach(p => {
            const bandwidth = this.calculateBandwidth(p.resolution);
            const dimensions = this.getResolutionDimensions(p.resolution, isPortrait, videoWidth, videoHeight);
            masterPlaylistContent += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${dimensions.width}x${dimensions.height}\n`;
            masterPlaylistContent += `https://ipfs.dlux.io/ipfs/${p.hash}?filename=${p.fileName}\n`;
          });
          
          
          // Create master playlist filename based on original video file
          const originalName = name.substring(0, name.lastIndexOf('.')) || name;
          const masterPlaylistFilename = `${originalName}.m3u8`;
          
          const masterPlaylistFile = new File([new TextEncoder().encode(masterPlaylistContent)], masterPlaylistFilename, {
            type: 'application/x-mpegURL'
          });
          
          videoFiles.push({
            file: masterPlaylistFile,
            targetPath: '/Videos',
            isThumb: false,
            isMasterPlaylist: true
          });
          
          this.dataURLS.push([masterPlaylistFilename, new TextEncoder().encode(masterPlaylistContent), 'application/x-mpegURL']);
          
          this.videoFilesToUpload = videoFiles;
          
          // Debug the upload files structure
          videoFiles.forEach((vf, idx) => {
          });
          
          this.videoMsg = `✅ ${resolutionPlaylists.length} resolution(s) ready for upload! (${videoFiles.length} files total)`;
        } else {
          this.videoMsg = '❌ No valid resolution playlists were generated. Please try again.';
        }
      };

        // Now process directly from extracted data while still in scope
        await validateAndProcessFiles(extractedFiles);
        
      } catch (err) {
        console.timeEnd('exec');
        console.error('❌ Transcoding failed:', err);
        this.videoMsg = 'Transcoding failed. Please try again with a smaller video file.';
        if (progressInterval) {
          clearInterval(progressInterval);
        }
        return;
      }
      
      // Clean up progress monitoring
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      
      this.videoMsg = 'Transcoding complete! Checking generated files...';
      
      // Non-blocking contract fetch
      fetch(`https://spk-ipfs.3speak.tv/upload-contract?user=${this.account}`)
        .then(r => r.json())
        .then((data) => {
          setTimeout(() => {
            this.showUpload = true
            this.getSPKUser()
          }, 1000)
        })
        .catch(err => {
          console.warn('Contract fetch failed, but continuing with transcoding:', err);
          this.showUpload = true;
        });
    },

    async waitForAllResolutionFiles(ffmpeg, expectedResolutions, timeoutMs = 180000) {
      return new Promise((resolve, reject) => {
        const startTime = Date.now();
        let lastTotalFileCount = 0;
        let stableCount = 0;
        const requiredStableChecks = 5; // Files must be stable for 5 consecutive checks
        
        // Track individual resolution status
        const resolutionStatus = {};
        expectedResolutions.forEach(res => {
          resolutionStatus[res] = { playlist: false, segments: 0, stable: false };
        });
        
        const checkAllFiles = async () => {
          try {
            // Check if we've exceeded timeout
            if (Date.now() - startTime > timeoutMs) {
              console.warn(`⏰ Timeout waiting for all resolutions after ${Math.round(timeoutMs/1000)}s`);
              reject(new Error(`Timeout waiting for all resolution files`));
              return;
            }
            
            const files = await ffmpeg.listDir("/");
            const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
            let totalCurrentFiles = 0;
            let completedResolutions = 0;
            
            // Check each resolution
            for (const resHeight of expectedResolutions) {
              const expectedPlaylist = `${resHeight}p_index.m3u8`;
              const resolutionFiles = files.filter(f => 
                f.name.startsWith(`${resHeight}p_`) && 
                (f.name.endsWith('.ts') || f.name.endsWith('.m3u8'))
              );
              
              const playlistExists = files.some(f => f.name === expectedPlaylist);
              const segmentCount = resolutionFiles.length - (playlistExists ? 1 : 0);
              
              // Update resolution status
              resolutionStatus[resHeight].playlist = playlistExists;
              resolutionStatus[resHeight].segments = segmentCount;
              
              totalCurrentFiles += resolutionFiles.length;
              
              // Check if this resolution is complete (playlist + at least 1 segment)
              if (playlistExists && segmentCount >= 1) {
                resolutionStatus[resHeight].stable = true;
                completedResolutions++;
              } else {
                resolutionStatus[resHeight].stable = false;
              }
            }
            
            // Log progress
            const statusSummary = expectedResolutions.map(r => {
              const status = resolutionStatus[r];
              const icon = status.stable ? '✅' : status.playlist ? '🔄' : '❌';
              return `${r}p${icon}(${status.segments})`;
            }).join(' ');
            
            
            // Check if all resolutions are complete
            if (completedResolutions === expectedResolutions.length) {
              // All resolutions have at least playlist + 1 segment, check stability
              if (totalCurrentFiles === lastTotalFileCount) {
                stableCount++;
                
                if (stableCount >= requiredStableChecks) {
                  resolve();
                  return;
                }
              } else {
                // File count changed, reset stability counter
                stableCount = 0;
                lastTotalFileCount = totalCurrentFiles;
              }
            } else {
              // Not all resolutions ready yet, reset counters
              stableCount = 0;
              lastTotalFileCount = totalCurrentFiles;
            }
            
            // Continue checking every 3 seconds
            setTimeout(checkAllFiles, 3000);
            
          } catch (error) {
            console.warn(`Error checking all resolution files:`, error);
            // Continue checking despite errors
            setTimeout(checkAllFiles, 3000);
          }
        };
        
        // Start checking after longer delay to avoid race condition with filesystem access
        // Wait 10 seconds to give FFmpeg more time to start writing files
        setTimeout(checkAllFiles, 10000);
      });
    },

    async waitForResolutionFiles(ffmpeg, resHeight, timeoutMs = 60000) {
      return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const expectedPlaylist = `${resHeight}p_index.m3u8`;
        let lastFileCount = 0;
        let stableCount = 0;
        const requiredStableChecks = 5; // Files must be stable for 5 consecutive checks
        
        const checkFiles = async () => {
          try {
            // Check if we've exceeded timeout
            if (Date.now() - startTime > timeoutMs) {
              console.warn(`⏰ Timeout waiting for ${resHeight}p files after ${Math.round(timeoutMs/1000)}s`);
              reject(new Error(`Timeout waiting for ${resHeight}p files`));
              return;
            }
            
            const files = await ffmpeg.listDir("/");
            const resolutionFiles = files.filter(f => 
              f.name.startsWith(`${resHeight}p_`) && 
              (f.name.endsWith('.ts') || f.name.endsWith('.m3u8'))
            );
            
            const playlistExists = files.some(f => f.name === expectedPlaylist);
            const currentFileCount = resolutionFiles.length;
            const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
            
            
            // Need both playlist and at least one segment file
            if (playlistExists && currentFileCount >= 2) { // playlist + at least 1 segment
              if (currentFileCount === lastFileCount) {
                stableCount++;
                
                if (stableCount >= requiredStableChecks) {
                  resolve();
                  return;
                }
              } else {
                // File count changed, reset stability counter
                stableCount = 0;
                lastFileCount = currentFileCount;
              }
            } else {
              // Not ready yet, reset counters
              stableCount = 0;
              lastFileCount = currentFileCount;
            }
            
            // Continue checking every 2 seconds
            setTimeout(checkFiles, 2000);
            
          } catch (error) {
            console.warn(`Error checking files for ${resHeight}p:`, error);
            // Continue checking despite errors
            setTimeout(checkFiles, 2000);
          }
        };
        
        // Start checking after 3 seconds to give FFmpeg time to start
        setTimeout(checkFiles, 3000);
      });
    },

    downloadBlob(name, buf, mimeString) {

      const blob = new Blob([buf], { type: mimeString });
      try {
        var url = window.URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } catch (e) {
        var url = window.URL.createObjectURL(response);
        var a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    },
    
    startInternalProgressMonitor(numResolutions) {
      const startTime = Date.now();
      let currentProgress = 0;
      const estimatedDuration = numResolutions * 30000; // Estimate 30 seconds per resolution
      
      const updateProgress = () => {
        const elapsed = Date.now() - startTime;
        const progressPercent = Math.min(Math.round((elapsed / estimatedDuration) * 100), 95);
        
        if (progressPercent > currentProgress) {
          currentProgress = progressPercent;
          const elapsedSeconds = Math.round(elapsed / 1000);
          const remainingSeconds = Math.round((estimatedDuration - elapsed) / 1000);
          
          let timeText = '';
          if (remainingSeconds > 0) {
            if (remainingSeconds > 60) {
              timeText = ` - ~${Math.round(remainingSeconds / 60)}m remaining`;
            } else {
              timeText = ` - ~${remainingSeconds}s remaining`;
            }
          }
          
          this.videoMsg = `Transcoding: ${currentProgress}% (${elapsedSeconds}s elapsed)${timeText}`;
        }
      };
      
      // Update every 2 seconds
      const progressInterval = setInterval(updateProgress, 2000);
      
      // Stop monitoring after estimated duration + buffer
      setTimeout(() => {
        clearInterval(progressInterval);
        this.videoMsg = 'Transcoding complete! Processing files...';
      }, estimatedDuration + 10000);
      
      return progressInterval;
    },
    
    // NOTE: This function is currently not used due to race condition issues with filesystem checking
    // We're using startInternalProgressMonitor + delayed waitForAllResolutionFiles instead
    startTranscodeProgressMonitoring(ffmpeg, numResolutions) {
      const startTime = Date.now();
      let lastFileCount = 0;
      let lastUpdateTime = startTime;
      let estimatedTotalFiles = numResolutions * 12; // Estimate: ~10 segments per resolution + 2 playlists
      let progressHistory = [];
      let isTranscodingComplete = false;
      
      const updateProgress = async () => {
        try {
          if (isTranscodingComplete) return; // Stop monitoring if complete
          
          const files = await ffmpeg.listDir("/");
          const outputFiles = files.filter(f => 
            f.name.includes('.ts') || f.name.includes('.m3u8')
          );
          
          const currentFileCount = outputFiles.length;
          const currentTime = Date.now();
          
          // Calculate progress percentage
          let progressPercent = Math.min(Math.round((currentFileCount / estimatedTotalFiles) * 100), 95);
          
          // Track progress rate for better time estimation
          if (currentFileCount > lastFileCount) {
            const timeDelta = (currentTime - lastUpdateTime) / 1000;
            const filesDelta = currentFileCount - lastFileCount;
            progressHistory.push({ time: currentTime, files: currentFileCount });
            
            // Keep only last 5 measurements for rolling average
            if (progressHistory.length > 5) {
              progressHistory.shift();
            }
            
            lastFileCount = currentFileCount;
            lastUpdateTime = currentTime;
          }
          
          // Calculate estimated time remaining using recent progress rate
          let estimatedSecondsRemaining = 0;
          if (progressHistory.length >= 2) {
            const oldest = progressHistory[0];
            const newest = progressHistory[progressHistory.length - 1];
            const timeSpan = (newest.time - oldest.time) / 1000;
            const filesSpan = newest.files - oldest.files;
            
            if (filesSpan > 0 && timeSpan > 0) {
              const filesPerSecond = filesSpan / timeSpan;
              const remainingFiles = estimatedTotalFiles - currentFileCount;
              estimatedSecondsRemaining = remainingFiles / filesPerSecond;
              
              // Refine total estimate if we have good data
              if (currentFileCount > 5 && progressPercent > 20) {
                const newEstimate = Math.round(currentFileCount / (progressPercent / 100));
                if (newEstimate > estimatedTotalFiles) {
                  estimatedTotalFiles = Math.min(newEstimate, estimatedTotalFiles * 1.5); // Don't grow too aggressively
                  progressPercent = Math.min(Math.round((currentFileCount / estimatedTotalFiles) * 100), 95);
                }
              }
            }
          }
          
          // Format time remaining
          let timeRemainingText = '';
          if (estimatedSecondsRemaining > 0) {
            if (estimatedSecondsRemaining > 60) {
              const minutes = Math.round(estimatedSecondsRemaining / 60);
              timeRemainingText = ` - ~${minutes}m remaining`;
            } else {
              timeRemainingText = ` - ~${Math.round(estimatedSecondsRemaining)}s remaining`;
            }
          }
          
          // Update message with enhanced progress info
          const elapsedMinutes = Math.round((currentTime - startTime) / 60000);
          const elapsedText = elapsedMinutes > 0 ? ` (${elapsedMinutes}m elapsed)` : '';
          
          this.videoMsg = `Transcoding: ${progressPercent}% (${currentFileCount}/${estimatedTotalFiles} files)${timeRemainingText}${elapsedText}`;
          
          
          // Check if transcoding seems complete (no new files for a while and reasonable count)
          if (currentFileCount >= numResolutions * 2 && (currentTime - lastUpdateTime) > 5000) {
            progressPercent = 100;
            this.videoMsg = `Transcoding complete: ${currentFileCount} files generated`;
            isTranscodingComplete = true;
          }
          
        } catch (error) {
          console.warn('Error monitoring transcode progress:', error);
        }
      };
      
      // Initial update
      updateProgress();
      
      // Create the monitoring interval with completion detection
      const monitoringInterval = setInterval(() => {
        updateProgress();
        // Stop monitoring if complete
        if (isTranscodingComplete) {
          clearInterval(monitoringInterval);
        }
      }, 1500);
      
      // Return the interval for manual cleanup if needed
      return monitoringInterval;
    },

    handleVideoUploadComplete(uploadedFiles) {
      this.videoMsg = 'Video upload completed successfully!';
      
      // Handle any post-upload processing here
      if (this.playlistUpdates && Object.keys(this.playlistUpdates).length > 0) {
        // Update playlists with actual CIDs if needed
        // This would be implemented based on how CIDs are returned from upload
      }
      
      // Start polling for contract bundling
      if (uploadedFiles && uploadedFiles.contractID) {
        this.pollBundleStatus(uploadedFiles.contractID);
      }
      
      // Clear the video files array
      this.videoFilesToUpload = [];
      
      // Clear preview and reset progress after upload completion
      this.clearTranscodePreview();
      this.resetHashingProgress();
    },

    pollBundleStatus(contractID, since = 0) {
      const contractInstanceId = contractID; 

      if (!contractInstanceId) {
          console.error("Cannot poll bundle status: contract instance ID is missing.", 
                        { contractInstanceId });
          return;
      }

      var lastSince = since
      fetch('https://spktest.dlux.io/feed' + (since ? `/${since}` : ''))
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          const feed = data.feed;
          let foundAndBundled = false;
          if (feed && typeof feed === 'object') {
            for (const feedEntryKey in feed) {
              lastSince = feedEntryKey.split(':')[0];
              const feedEntryValue = feed[feedEntryKey];
              if (feedEntryValue === contractID + ' bundled') {
                foundAndBundled = true;
                break;
              }
            }
          }

          if (foundAndBundled) {
            // Refresh SPK data to show updated files
            this.getSapi();
          } else {
            setTimeout(() => this.pollBundleStatus(contractID, lastSince), 5000);
          }
        })
        .catch(error => {
          console.error('Error polling bundle status:', error);
          setTimeout(() => this.pollBundleStatus(contractID, lastSince), 5000); 
        });
    },
    
    async downloadFFmpeg() {
      this.videoMsg = 'Loading FFmpeg...';
      this.ffmpegDownloadProgress = 0;
      
      try {
        // Check if FFmpeg is already available globally
        if (typeof FFmpegWASM === 'undefined' || typeof FFmpegUtil === 'undefined') {
          throw new Error('FFmpeg WASM library not available - please refresh the page and ensure all scripts are loaded');
        }
        
        // Reset any previous instance
        if (this.ffmpeg) {
          this.ffmpeg = null;
        }
        
        // Try different initialization strategies with progress monitoring
        await this.initializeFFmpegWithProgress();
        
      } catch (error) {
        console.error('FFmpeg loading failed:', error);
        this.handleFFmpegLoadError(error);
      }
    },
    
    async initializeFFmpegWithProgress() {
      const { FFmpeg } = FFmpegWASM;
      
      // Strategy 1: Try basic initialization first (most reliable)
      try {
        this.videoMsg = 'Initializing FFmpeg...';
        this.ffmpegDownloadProgress = 20;
        
        this.ffmpeg = new FFmpeg();
        
        // Update progress while loading (simulated for user feedback)
        const progressInterval = setInterval(() => {
          if (this.ffmpegDownloadProgress < 80) {
            this.ffmpegDownloadProgress += 3;
            this.videoMsg = `Loading FFmpeg: ${this.ffmpegDownloadProgress}%`;
          }
        }, 300);
        
        try {
          // Load without specifying URLs - let FFmpeg handle defaults
          await this.ffmpeg.load();
          clearInterval(progressInterval);
        } catch (loadError) {
          clearInterval(progressInterval);
          throw loadError;
        }
        this.ffmpegDownloadProgress = 100;
        this.ffmpegReady = true;
        this.videoMsg = 'FFmpeg loaded successfully! Ready to transcode videos.';
        return;
        
      } catch (basicError) {
        console.warn('Basic FFmpeg initialization failed:', basicError);
        this.ffmpegDownloadProgress = 0;
      }
      
      // Strategy 2: Try with local core files if available
      try {
        this.videoMsg = 'Trying local FFmpeg files...';
        this.ffmpegDownloadProgress = 30;
        
        this.ffmpeg = new FFmpeg();
        
        const progressInterval = setInterval(() => {
          if (this.ffmpegDownloadProgress < 90) {
            this.ffmpegDownloadProgress += 4;
            this.videoMsg = `Loading FFmpeg core: ${this.ffmpegDownloadProgress}%`;
          }
        }, 400);
        
        try {
          await this.ffmpeg.load({
            coreURL: "/packages/core/package/dist/umd/ffmpeg-core.js"
          });
          clearInterval(progressInterval);
        } catch (loadError) {
          clearInterval(progressInterval);
          throw loadError;
        }
        this.ffmpegDownloadProgress = 100;
        this.ffmpegReady = true;
        this.videoMsg = 'FFmpeg loaded successfully with local files!';
        return;
        
      } catch (localError) {
        console.warn('Local file FFmpeg initialization failed:', localError);
        this.ffmpegDownloadProgress = 0;
      }
      
      // Strategy 3: Skip FFmpeg and allow direct video uploads
      this.videoMsg = 'FFmpeg initialization failed. You can still upload pre-processed video files.';
      this.ffmpegSkipped = true;
      this.ffmpegDownloadProgress = 0;
    },
    

    
    handleFFmpegLoadError(error) {
      console.error('FFmpeg loading failed:', error);
      this.videoMsg = 'Failed to load FFmpeg. You can still upload pre-transcoded videos.';
      this.ffmpegSkipped = true;
      this.ffmpeg = null;
    },
    
    skipFFmpeg() {
      this.ffmpegSkipped = true;
      this.videoMsg = 'FFmpeg skipped. You can upload pre-transcoded video files directly.';
    },
    
    extractProgressPercent(message) {
      const match = message.match(/(\d+)%/);
      return match ? parseInt(match[1]) : 0;
    },
    
    async bypassServiceWorkerForFFmpeg() {
      // Temporarily unregister service worker for FFmpeg loading
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          const swPromises = registrations.map(registration => {
            return registration.unregister();
          });
          await Promise.all(swPromises);
          return true;
        } catch (error) {
          console.warn('Could not unregister service worker:', error);
          return false;
        }
      }
      return false;
    },
    
    async reregisterServiceWorker() {
      // Re-register service worker after FFmpeg loading
      if ('serviceWorker' in navigator) {
        try {
          await navigator.serviceWorker.register('/sw.js?v=2025.06.05.9');
        } catch (error) {
          console.warn('Could not re-register service worker:', error);
        }
      }
    },
    activeIndexUp() {
      if (this.activeIndex < this[this.focusItem.source].length - 1) this.activeIndex++
      else this.activeIndex = 0
    },
    activeIndexDn() {
      if (this.activeIndex > 0) this.activeIndex--
      else this.activeIndex = this[this.focusItem.source].length - 1
    },
    onClassChange(classAttrValue) {
      const classList = classAttrValue.split(' ');
      if (classList.includes('active')) {
      }
    },
    init(reset = false) {
      if (reset) {
        this.pageAccount = null
        this.delegationsFetched = false
        this.rcAccount = null
        this.hpDelegationsOut = []
        this.hpDelegationsIn = []
        this.rcDelegationsOut = []
        this.rcDelegationsIn = []
        if (location.pathname.split("/@")[1]) {
          this.pageAccount = location.pathname.split("/@")[1]
          if (this.pageAccount.indexOf('/') > -1) {
            this.pagePermlink = this.pageAccount.split('/')[1]
            this.pageAccount = this.pageAccount.split('/')[0]
          }
          this.me = false; // Make sure me is false when viewing another user
        } else if (location.pathname.indexOf("new") > -1) {
          this.builder = true
        } else {
          this.pageAccount = this.account;
          this.me = true;
        }
      }
      this.getIPFSproviders()
      this.getMARKETS()
      if (!this.me) {
        this.focus.account = this.pageAccount;
        this.sapi = sapi;
        this.checkAccount("pageAccount", "focus");
        this.getHiveUser(this.pageAccount); // Load Hive data for the page account
        this.getSPKUser()
        this.accountRelations(this.pageAccount);
        this.getHiveStats();
        this.getQuotes();
        this.getSNodes();
        this.getPosts();
        this.getProtocol();
        this.getSpkStats();
        this.getRewardFund();
        this.getFeedPrice();
        this.getSapi(this.pageAccount, false); // Load SPK data for the page account
        this.getTokenUser(this.pageAccount, false); // Load DLUX token data for the page account
        //this.getNFTs(this.pageAccount);
      }
      this.getRcAccount(this.pageAccount)
      if (!this.builder) {
        deepLink();
        this.activeTab = hash?.[1] || 'blog'
        this.observer = new MutationObserver(mutations => {
          for (const m of mutations) {
            const newValue = m.target.getAttribute(m.attributeName);
            this.$nextTick(() => {
              this.onClassChange(newValue, m.oldValue);
            });
          }
        });

        this.observer.observe(this.$refs.driveTab, {
          attributes: true,
          attributeOldValue: true,
          attributeFilter: ['class'],
        });
      }

    },
    initializeCharts() {
      this.initAccountDistributionChart();
      this.initTypeDistributionChart();
    },
    initAccountDistributionChart() {
      try {
        const ctx = document.getElementById('accountDistributionChart');
        if (!ctx) {
          console.warn('❌ Account distribution chart canvas not found');
          return;
        }

        // Destroy existing chart if it exists
        if (this.accountDistributionChart) {
          this.accountDistributionChart.destroy();
          this.accountDistributionChart = null;
        }

        this.accountDistributionChart = new Chart(ctx, {
          type: 'pie',
          data: {
            labels: [],
            datasets: [{
              label: 'Account Distribution',
              data: [],
              backgroundColor: [
                'rgba(255, 99, 132, 0.7)',
                'rgba(54, 162, 235, 0.7)',
                'rgba(255, 206, 86, 0.7)',
                'rgba(75, 192, 192, 0.7)',
                'rgba(153, 102, 255, 0.7)',
                'rgba(255, 159, 64, 0.7)'
              ],
              borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)'
              ],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false, // Disable animations to prevent issues
            plugins: {
              legend: {
                position: 'top',
                labels: {
                  color: 'white'
                }
              },
              title: {
                display: false,
                text: 'Distribution by Account'
              }
            }
          }
        });
      } catch (error) {
        console.error('❌ Error initializing account distribution chart:', error);
        this.accountDistributionChart = null;
      }
    },
    initTypeDistributionChart() {
      try {
        const ctx = document.getElementById('typeDistributionChart');
        if (!ctx) {
          console.warn('❌ Type distribution chart canvas not found');
          return;
        }

        // Destroy existing chart if it exists
        if (this.typeDistributionChart) {
          this.typeDistributionChart.destroy();
          this.typeDistributionChart = null;
        }

        this.typeDistributionChart = new Chart(ctx, {
          type: 'pie',
          data: {
            labels: ['Liquid', 'Power', 'Governance'],
            datasets: [{
              label: 'Type Distribution',
              data: [0, 0, 0], // Initialize with zeros instead of empty array
              backgroundColor: [
                'rgba(255, 99, 132, 0.7)',
                'rgba(54, 162, 235, 0.7)',
                'rgba(255, 206, 86, 0.7)'
              ],
              borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)'
              ],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false, // Disable animations to prevent issues
            plugins: {
              legend: {
                position: 'top',
                labels: {
                  color: 'white'
                }
              },
              title: {
                display: false,
                text: 'Distribution by Type'
              }
            }
          }
        });
      } catch (error) {
        console.error('❌ Error initializing type distribution chart:', error);
        this.typeDistributionChart = null;
      }
    },
    updateAccountDistributionChart() {
      try {
        // Check if canvas exists in DOM
        const canvas = document.getElementById('accountDistributionChart');
        if (!canvas) {
          console.warn('❌ Canvas not found in DOM, skipping update');
          return; // Canvas not in DOM, skip update
        }

        // Always destroy and recreate the chart to avoid Chart.js state issues
        if (this.accountDistributionChart) {
          try {
            this.accountDistributionChart.destroy();
          } catch (destroyError) {
            console.warn('⚠️ Error destroying chart:', destroyError);
          }
          this.accountDistributionChart = null;
        }

        const distData = this.newToken.dist || {};
        const labels = Object.keys(distData);
        const data = labels.map(acc => {
          const accountData = distData[acc] || {};
          return (parseFloat(accountData.l) || 0) + (parseFloat(accountData.p) || 0) + (parseFloat(accountData.g) || 0);
        });

        // Generate colors for all accounts
        const colors = [];
        const borderColors = [];
        for (let i = 0; i < labels.length; i++) {
          const r = Math.floor(Math.random() * 255);
          const g = Math.floor(Math.random() * 255);
          const b = Math.floor(Math.random() * 255);
          colors.push(`rgba(${r}, ${g}, ${b}, 0.7)`);
          borderColors.push(`rgba(${r}, ${g}, ${b}, 1)`);
        }

        // Create new chart with the data
        this.accountDistributionChart = new Chart(canvas, {
          type: 'pie',
          data: {
            labels: labels,
            datasets: [{
              label: 'Account Distribution',
              data: data,
              backgroundColor: colors,
              borderColor: borderColors,
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false, // Disable animations to prevent issues
            plugins: {
              legend: {
                position: 'top',
                labels: {
                  color: 'white'
                }
              },
              title: {
                display: false,
                text: 'Distribution by Account'
              }
            }
          }
        });
      } catch (error) {
        console.error('❌ Error updating account distribution chart:', error);
        console.error('❌ Error stack:', error.stack);
        // Reset chart on error
        this.accountDistributionChart = null;
      }
    },
    updateTypeDistributionChart() {
      try {
        // Check if canvas exists in DOM
        const canvas = document.getElementById('typeDistributionChart');
        if (!canvas) {
          console.warn('❌ Canvas not found in DOM, skipping update');
          return; // Canvas not in DOM, skip update
        }

        // Always destroy and recreate the chart to avoid Chart.js state issues
        if (this.typeDistributionChart) {
          try {
            this.typeDistributionChart.destroy();
          } catch (destroyError) {
            console.warn('⚠️ Error destroying chart:', destroyError);
          }
          this.typeDistributionChart = null;
        }

        const distData = this.newToken.dist || {};
        let liquidTotal = 0;
        let powerTotal = 0;
        let governanceTotal = 0;

        for (const acc in distData) {
          const accountData = distData[acc] || {};
          liquidTotal += parseFloat(accountData.l) || 0;
          powerTotal += parseFloat(accountData.p) || 0;
          governanceTotal += parseFloat(accountData.g) || 0;
        }


        // Create new chart with the data
        this.typeDistributionChart = new Chart(canvas, {
          type: 'pie',
          data: {
            labels: ['Liquid', 'Power', 'Governance'],
            datasets: [{
              label: 'Type Distribution',
              data: [liquidTotal, powerTotal, governanceTotal],
              backgroundColor: [
                'rgba(255, 99, 132, 0.7)',
                'rgba(54, 162, 235, 0.7)',
                'rgba(255, 206, 86, 0.7)'
              ],
              borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)'
              ],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false, // Disable animations to prevent issues
            plugins: {
              legend: {
                position: 'top',
                labels: {
                  color: 'white'
                }
              },
              title: {
                display: false,
                text: 'Distribution by Type'
              }
            }
          }
        });
      } catch (error) {
        console.error('❌ Error updating type distribution chart:', error);
        console.error('❌ Error stack:', error.stack);
        // Reset chart on error
        this.typeDistributionChart = null;
      }
    },
    sanitizeHTML(html) {
      if (!html || typeof html !== 'string') return '';
      
      // Less restrictive sanitization for NFTs - allow rich content while preventing XSS
      return DOMPurify.sanitize(html, {
        // Only forbid the most dangerous tags
        FORBID_TAGS: [
          'script', 'object', 'embed', 'applet', 'meta', 
          'link', 'base', 'dialog', 'iframe', 'frame', 'frameset'
        ],
        // Only forbid the most dangerous attributes - allow styling and some interactivity
        FORBID_ATTR: [
          'onload', 'onerror', 'onclick', 'onmouseover', 'onfocus', 'onblur',
          'onchange', 'onsubmit', 'onreset', 'onselect', 'onunload', 'onbeforeunload',
          'onabort', 'onafterprint', 'onbeforeprint', 'oncontextmenu', 'ondblclick',
          'ondrag', 'ondragend', 'ondragenter', 'ondragleave', 'ondragover', 
          'ondragstart', 'ondrop', 'oninput', 'oninvalid', 'onkeydown', 'onkeypress',
          'onkeyup', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseup', 
          'onmousewheel', 'onoffline', 'ononline', 'onpagehide', 'onpageshow',
          'onpopstate', 'onresize', 'onscroll', 'onstorage', 'onwheel',
          'srcdoc', 'sandbox', 'open'
        ],
        // Allow broader range of protocols for NFT content
        ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|ipfs|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
        // Allow more HTML elements for rich NFT content
        ADD_TAGS: ['style'],
        ADD_ATTR: ['style', 'allowfullscreen', 'controls', 'autoplay', 'loop', 'muted'],
        // Additional safety measures
        SANITIZE_DOM: true,
        KEEP_CONTENT: true,
        RETURN_DOM: false,
        RETURN_TRUSTED_TYPE: false
      });
    },
    getFFmpegDownloadProgress() {
      return this.ffmpegDownloadProgress || 0;
    },
    
    calculateBandwidth(resolution) {
      // Estimate bandwidth based on resolution (in bits per second)
      const bandwidthMap = {
        '144': 200000,   // 200 Kbps
        '240': 400000,   // 400 Kbps  
        '360': 800000,   // 800 Kbps
        '480': 1500000,  // 1.5 Mbps
        '720': 3000000,  // 3 Mbps
        '1080': 6000000, // 6 Mbps
        '1440': 12000000, // 12 Mbps
        '2160': 25000000  // 25 Mbps (4K)
      };
      return bandwidthMap[resolution] || 1000000; // Default 1 Mbps
    },
    
    getResolutionDimensions(resolution, isPortrait = false, originalWidth = 1280, originalHeight = 720) {
      const resHeight = parseInt(resolution);
      
      if (isPortrait && originalWidth && originalHeight) {
        // For portrait videos, calculate width based on original aspect ratio
        const aspectRatio = originalWidth / originalHeight;
        const targetWidth = Math.round(resHeight * aspectRatio);
        return { width: targetWidth, height: resHeight };
      } else {
        // Standard 16:9 landscape dimensions
        const dimensionMap = {
          '144': { width: 256, height: 144 },
          '240': { width: 426, height: 240 }, 
          '360': { width: 640, height: 360 },
          '480': { width: 854, height: 480 },
          '720': { width: 1280, height: 720 },
          '1080': { width: 1920, height: 1080 },
          '1440': { width: 2560, height: 1440 },
          '2160': { width: 3840, height: 2160 }
        };
        return dimensionMap[resolution] || { width: 1280, height: 720 };
      }
    },
    
    hashOf(buf, opts = {}) {
      return new Promise((resolve, reject) => {
        try {
          Hash.of(buf, { unixfs: 'UnixFS' }).then(hash => {
            resolve({ hash, opts })
          })
        } catch (e) {
          reject(e)
        }
      })
    },
    
    setPreviewVideoSrc() {
      if (this.transcodePreview.selectedResolution) {
        const content = this.transcodePreview.selectedResolution.originalContent;
        
        // Create playlist content with blob URLs for segments if in preview mode
        let playlistContent = content;
        if (this.dataURLS && this.dataURLS.length > 0) {
          // Replace segment references with blob URLs from dataURLS for preview
          const resolution = this.transcodePreview.selectedResolution.resolution;
          const segmentPattern = new RegExp(`${resolution}p_(\\d{3})\\.ts`, 'g');
          
          playlistContent = content.replace(segmentPattern, (match, segmentNum) => {
            // Find the corresponding segment in dataURLS
            const segmentName = `${resolution}p_${segmentNum}_thumb.ts`;
            const segmentData = this.dataURLS.find(([name, data, type]) => name === segmentName);
            
            if (segmentData) {
              const [name, data, type] = segmentData;
              const blob = new Blob([data], { type: 'video/mp2t' });
              const blobUrl = URL.createObjectURL(blob);
              // Store blob URL for cleanup later
              if (!this.transcodePreview.segmentBlobs) {
                this.transcodePreview.segmentBlobs = [];
              }
              this.transcodePreview.segmentBlobs.push(blobUrl);
              return blobUrl;
            }
            return match; // Keep original if not found
          });
        }
        
        const blob = new Blob([playlistContent], { type: 'application/x-mpegURL' });
        
        // Revoke previous URL to prevent memory leaks
        if (this.transcodePreview.videoSrc) {
          URL.revokeObjectURL(this.transcodePreview.videoSrc);
        }
        
        this.transcodePreview.videoSrc = URL.createObjectURL(blob);
      }
    },
    
    onPreviewResolutionChange() {
      this.setPreviewVideoSrc();
    },
    
            clearTranscodePreview() {
      if (this.transcodePreview.videoSrc) {
        URL.revokeObjectURL(this.transcodePreview.videoSrc);
        this.transcodePreview.videoSrc = null;
      }
      
      // Clean up segment blob URLs
      if (this.transcodePreview.segmentBlobs) {
        this.transcodePreview.segmentBlobs.forEach(url => URL.revokeObjectURL(url));
        this.transcodePreview.segmentBlobs = [];
      }
      
      this.transcodePreview.available = false;
      this.transcodePreview.resolutions = [];
      this.transcodePreview.selectedResolution = null;
    },
    
    resetHashingProgress() {
      this.hashingProgress.current = 0;
      this.hashingProgress.total = 0;
      this.hashingProgress.percentage = 0;
      this.hashingProgress.currentFile = '';
    },
    
          // Collaborative editing methods
      async generateCollaborationAuthHeaders(forceRefresh = false) {
        
        if (!this.account) {
          console.warn('No account available for collaboration auth');
          return {};
        }

        // Check session storage first (user-specific key)
        if (!forceRefresh) {
          const cachedHeaders = sessionStorage.getItem(`collaborationAuthHeaders_${this.account}`);
          if (cachedHeaders) {
            const headers = JSON.parse(cachedHeaders);
            const cachedChallenge = parseInt(headers['x-challenge']);
            const now = Math.floor(Date.now() / 1000);
            
            // If headers are valid (less than 23 hours old), reuse them
            if (cachedChallenge && (now - cachedChallenge) < (23 * 60 * 60)) {
              this.collaborationAuthHeaders = headers;
              return headers;
            } else {
            }
          } else {
          }
        }


        return new Promise((resolve, reject) => {
          // Use the v3-nav op system for consistency
          const op = {
            type: "collaboration_auth",
            txid: `collaboration_auth_${Date.now()}`,
            msg: "Generating collaboration authentication headers",
            status: "Initializing authentication...",
            time: new Date().getTime(),
            delay: 250,
            title: "Collaboration Authentication",
            // Add callbacks for success and error
            onSuccess: (headers) => {
              this.collaborationAuthHeaders = headers;
              resolve(headers);
            },
            onError: (error) => {
              reject(error);
            }
          };

          // Trigger the operation by setting toSign (this will be picked up by v3-nav)
          this.toSign = op;
        });
      },
    
    async openCollaborativeDocument(documentPath) {
      this.collaborativeDocument = documentPath;
      this.isCollaborativeMode = true;
      
      // Generate auth headers if not available
      if (!this.collaborationAuthHeaders || !this.collaborationAuthHeaders['x-account']) {
        await this.generateCollaborationAuthHeaders();
      }
      

      
      // Scroll to post section or expand it
      const postAccordion = document.querySelector('#postDetails');
      if (postAccordion && postAccordion.classList.contains('collapse')) {
        const bsCollapse = new bootstrap.Collapse(postAccordion, { show: true });
      }
    },
    
    async ensureCollaborationAuth() {
      // This method ensures auth headers are available for collaborative features
      
      if (!this.account) {
        console.warn('No account available for collaboration');
        return {};
      }
      
      try {
        const headers = await this.generateCollaborationAuthHeaders();
        
        // Update the reactive data property
        this.collaborationAuthHeaders = headers;
        
        return headers;
      } catch (error) {
        console.error('Failed to ensure collaboration auth:', error);
        // Clear any invalid headers
        this.collaborationAuthHeaders = {};
        return {};
      }
    },
    
    loadCollaborationAuthHeaders() {
      // Load headers from session storage for current user
      if (!this.account) {
        this.collaborationAuthHeaders = {};
        return;
      }
      
      const cachedHeaders = sessionStorage.getItem(`collaborationAuthHeaders_${this.account}`);
      if (cachedHeaders) {
        try {
          const headers = JSON.parse(cachedHeaders);
          const cachedChallenge = parseInt(headers['x-challenge']);
          const now = Math.floor(Date.now() / 1000);
          
          // If headers are valid (less than 23 hours old), load them
          if (cachedChallenge && (now - cachedChallenge) < (23 * 60 * 60)) {
            this.collaborationAuthHeaders = headers;
            return;
          }
        } catch (e) {
          console.warn('Invalid cached collaboration headers:', e);
        }
      }
      
      // Clear invalid/expired headers
      this.collaborationAuthHeaders = {};
    },
    
    exitCollaborativeMode() {
      this.isCollaborativeMode = false;
      this.collaborativeDocument = null;
    },
    
    requestCollaboration() {
      // This method can be called from the post-vue component
      // For now, we'll just show an alert to guide users to the collaborative docs section
      alert('To start collaborative editing, please create or select a document from the Collaborative Documents section above.');
    },
    
    handleCollaborativePermissionChange(permissionData) {
      this.collaborativePermission = permissionData.permission;
      this.canPostFromCollaboration = permissionData.canPost;
      
      // Store for cross-component access
      if (permissionData.documentPath) {
        sessionStorage.setItem(`collaborativePermission_${this.account}_${permissionData.documentPath}`, 
          JSON.stringify(permissionData));
      }
    },
    
    loadDocumentIntoPost(documentContent) {
      
      // Store collaborative document data for multi-field editor
      this.collaborativeDocumentData = documentContent;
      
      // Also load into regular post form for backwards compatibility
      this.postTitle = documentContent.title || '';
      this.postBody = documentContent.body || '';
      
      // Handle tags
      if (documentContent.tags && Array.isArray(documentContent.tags)) {
        this.postTags = documentContent.tags.join(' ');
        this.postCustom_json.tags = documentContent.tags;
      }
      
      // Handle custom JSON
      if (documentContent.custom_json) {
        this.postCustom_json = {
          ...this.postCustom_json,
          ...documentContent.custom_json
        };
      }
      
      // Generate permlink from title if not collaborative mode
      if (documentContent.title && !this.isCollaborativeMode) {
        this.postPermlink = this.permlink(documentContent.title);
      }
      
      // Focus on the post section
      this.$nextTick(() => {
        const postSection = document.querySelector('.card-body');
        if (postSection) {
          postSection.scrollIntoView({ behavior: 'smooth' });
        }
      });
    },
    
    handleCollaborativePostData(postData) {
      // Handle data changes from collaborative post editor
      this.postTitle = postData.title;
      this.postBody = postData.body;
      this.postTags = postData.tags;
      this.postPermlink = postData.permlink;
      this.postBens = postData.beneficiaries;
      this.postCustom_json = { ...this.postCustom_json, ...postData.custom_json };
    },
    
    handleCollaborativePublish(postData) {
      // Handle publish request from collaborative editor
      
      // Set the data and trigger normal post flow
      this.postTitle = postData.title;
      this.postBody = postData.body;
      this.postTags = postData.tags.join ? postData.tags.join(' ') : postData.tags;
      this.postPermlink = postData.permlink;
      this.postBens = postData.beneficiaries;
      this.postCustom_json = { ...this.postCustom_json, ...postData.custom_json };
      
      // Trigger post
      this.post();
    },
    
    handleEnhancedPostData(postData) {
      // Handle data changes from enhanced collaborative post editor
      this.postTitle = postData.title;
      this.postBody = postData.body;
      this.postTags = postData.tags;
      this.postPermlink = postData.permlink;
      this.postBens = postData.beneficiaries || [];
      this.postCustom_json = { ...this.postCustom_json, ...postData.custom_json };
    },
    
    handleEnhancedPublish(postData) {
      // Handle publish request from enhanced collaborative editor
      
      // Set the data and trigger normal post flow
      this.postTitle = postData.title;
      this.postBody = postData.body;
      this.postTags = postData.tags.join ? postData.tags.join(' ') : postData.tags;
      this.postPermlink = postData.permlink;
      this.postBens = postData.beneficiaries || [];
      this.postCustom_json = { ...this.postCustom_json, ...postData.custom_json };
      
      // Trigger post
      this.post();
    },
    
    // TipTap Editor Event Handlers
    handlePostContentChanged(postData) {
      // Update the main Vue instance data with content changes
      this.postTitle = postData.title || '';
      this.postBody = postData.body || '';
      this.postTags = postData.tags || [];
      this.postPermlink = postData.permlink || '';
      this.postBens = postData.beneficiaries || [];
      
      // Merge custom_json data
      this.postCustom_json = {
        ...this.postCustom_json,
        ...postData.custom_json
      };
      

    },
    
    handlePostPublish(postData) {
      
      // Update all post data
      this.postTitle = postData.title;
      this.postBody = postData.body;
      this.postTags = postData.tags;
      this.postPermlink = postData.permlink;
      this.postBens = postData.beneficiaries || [];
      
      // Merge custom_json with existing data
      this.postCustom_json = {
        ...this.postCustom_json,
        ...postData.custom_json
      };
      
      // Call the existing post method to handle the actual publishing
      this.post();
    },

    // 360° Asset Manager Integration Methods
    handle360AssetsUpdated(data) {
      // Integration Point: 360° Asset Manager Data Handler
      // This method receives the complete 360° gallery data from the Asset Manager including:
      // - assets: array with index, url, thumb, rotation, title, description, contractId
      // - navigation: array with fromIndex, toIndex, position (phi, theta, radius), label, description
      
      
      // Update the post's custom JSON with the new 360° gallery data
      this.postCustom_json.assets = data.assets || [];
      this.postCustom_json.navigation = data.navigation || [];
      
      // Trigger mock update for preview
      this.dluxMock();
      
      // Log the structure for debugging
    },

    // Handle file selection from SPK Drive for 360° assets
    handleSPKFileForAssets(fileData) {
      // This method receives file data when users drag/select files from SPK Drive
      // and passes it to the 360° asset manager component
      
      // If this is from drag/drop, we need to look up the actual file metadata
      if (fileData.fromDragDrop && fileData.cid && fileData.contractId) {
        
        // For now, just pass the data as-is and let the component handle the metadata lookup
        // The context menu approach should provide better metadata
      }
      
              this.spkFileForAssets = fileData;
    },

    // dApp Manager Integration Methods
    handleDappUpdated(data) {
      // Integration Point: dApp Manager Data Handler
      // This method receives the complete dApp data from the dApp Manager including:
      // - dappStructure: file organization (entry, assets, scripts, styles, data, other)
      // - customJson: custom JSON structure for the dApp
      // - license: selected license information
      // - licenseTree: tracking of derivative work licensing
      
      
      // Update the post's custom JSON with the new dApp data
      this.postCustom_json.dappStructure = data.dappStructure || {};
      this.postCustom_json.customJson = data.customJson || {};
      this.postCustom_json.license = data.license || '1';
      this.postCustom_json.licenseTree = data.licenseTree || [];
      
      // Trigger mock update for preview
      this.dluxMock();
      
      // Log the structure for debugging
    },

    // ReMix dApp Manager Integration Methods
    handleRemixUpdated(data) {
      // Integration Point: ReMix dApp Manager Data Handler
      // This method receives the complete remix data from the ReMix Manager including:
      // - remixStructure: base dApp info, modifications, attribution, license
      // - modificationFiles: files added/modified in the remix
      // - customJson: custom JSON structure for the remix
      // - license: selected license for the remix (must be compatible with base)
      
      
      // Update the post's custom JSON with the new remix data
      this.postCustom_json.remixStructure = data.remixStructure || {};
      this.postCustom_json.modificationFiles = data.modificationFiles || {};
      this.postCustom_json.customJson = data.customJson || {};
      this.postCustom_json.license = data.license || '1';
      
      // Trigger mock update for preview
      this.dluxMock();
      
      // Log the structure for debugging
    }
  },
  mounted() {
    // Check for active service worker
    if ('serviceWorker' in navigator) {
      if (navigator.onLine) {
        this.serviceWorker = true;
        // recieve messages
        navigator.serviceWorker.addEventListener('message', event => {
          try {
            const promiseKey = `${event.data.script}:${event.data.uid}`;
            if (this.serviceWorkerPromises[promiseKey] && this.serviceWorkerPromises[promiseKey].resolve) {
              this.serviceWorkerPromises[promiseKey].resolve(event.data);
              delete this.serviceWorkerPromises[promiseKey];
            } else {
              console.warn('No promise found for service worker message:', promiseKey);
            }
          } catch (e) { 
            console.error('Service worker message handling error:', e);
          }
        });
        navigator.serviceWorker.startMessages();
      } else {
        this.serviceWorker = false;
      }
    }
    this.pendingTokens = JSON.parse(localStorage.getItem(`pendingTokens`)) || []
    this.boundScrollHandler = this.handleScroll.bind(this); // Create a bound reference
    
    // Add scroll listeners - body is often the actual scroll container in SPAs
    document.body.addEventListener('scroll', this.boundScrollHandler);
    window.addEventListener('scroll', this.boundScrollHandler);
    document.addEventListener('scroll', this.boundScrollHandler);
    document.documentElement.addEventListener('scroll', this.boundScrollHandler);
    
    // Test if scroll listener is working

    //check hash
    if (location.hash) {
      if (location.hash == "#blog") {
        this.activeTab = "blog";
      } else if (location.hash == "#wallet") {
        this.activeTab = "wallet";
      } else if (location.hash == "#inventory") {
        this.activeTab = "inventory";
      } else if (location.hash == "#files") {
        this.activeTab = "files";
      }

    }
    if (location.pathname.split("/@")[1]) {
      this.pageAccount = location.pathname.split("/@")[1]
      if (this.pageAccount.indexOf('/') > -1) {
        this.pagePermlink = this.pageAccount.split('/')[1]
        this.pageAccount = this.pageAccount.split('/')[0]
      }
    } else if (location.pathname.split("/new/")[1]) {
      this.builder = true
      this.pageAccount = this.account;
    } else {
      this.pageAccount = this.account;
      this.me = true;
    }
    if (this.pageAccount == this.account) this.me = true;
    if (this.pagePermlink) {
      this.getContent(this.pageAccount, this.pagePermlink, true)
    } else {
      this.init(true)
    }
    this.rcCosts()
    if (document.getElementById('accountDistributionChart') || document.getElementById('typeDistributionChart')) {
      this.initializeCharts(); // Make sure charts are initialized on mount
    }
    //this.init();
    //this.getSNodes();
    if (localStorage.getItem("user")) {
      this.account = localStorage.getItem("user");
      this.getTokenUser(this.account);
      this.getHiveUser(this.account);
      this.getSapi(this.account);
      this.getRcAccount(this.account);
    }
    if (localStorage.getItem("pendingTokens")) {
      this.pendingTokens = JSON.parse(localStorage.getItem("pendingTokens"));
    }
    this.getHiveStats();
    this.getRewardFund();
    this.getFeedPrice();
    this.getProtocol();
    this.rcCosts();
    
    // Start observing for video elements to setup HLS
    this.videoObserver = this.initIpfsVideoSupport();
    
    // Load collaboration headers for current user
    this.loadCollaborationAuthHeaders();
  },
  beforeDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    // Remove all scroll handlers
    document.body.removeEventListener("scroll", this.boundScrollHandler);
    window.removeEventListener("scroll", this.boundScrollHandler);
    document.removeEventListener("scroll", this.boundScrollHandler);
    document.documentElement.removeEventListener("scroll", this.boundScrollHandler);
    
    // Clean up video observer and HLS instances
    if (this.videoObserver) {
      this.videoObserver.disconnect();
      window._dluxVideoObserver = null;
    }
    
    // Clean up any HLS instances
    document.querySelectorAll('video').forEach((video) => {
      if (video.hlsInstance) {
        video.hlsInstance.destroy();
      }
    });
  },
  unmounted() {
    // Remove all scroll handlers
    document.body.removeEventListener('scroll', this.boundScrollHandler);
    window.removeEventListener('scroll', this.boundScrollHandler);
    document.removeEventListener('scroll', this.boundScrollHandler);
    document.documentElement.removeEventListener('scroll', this.boundScrollHandler);
    
    // Clean up video observer and HLS instances
    if (this.videoObserver) {
      this.videoObserver.disconnect();
      window._dluxVideoObserver = null;
    }
    
    // Clean up any HLS instances
    document.querySelectorAll('video').forEach((video) => {
      if (video.hlsInstance) {
        video.hlsInstance.destroy();
      }
    });
  },
  watch: {
    activeTab: {
      handler(newTab, oldTab) {
        
        // Smart loading based on active tab - only load if content is truly empty
        if (newTab === 'blog') {
          if (this.displayPosts.length === 0) {
            this.getPosts(true); // Reset and load posts
          } else {
          }
        } else if (newTab === 'inventory') {
          if (this.accountNFTs.length === 0 && this.accountRNFTs.length === 0) {
            this.getNFTs();
          } else {
          }
        } else if (newTab === 'drive' && !this.contractsLoaded) {
          this.contractsLoaded = true;
          // Trigger drive content loading if needed
        } else if (newTab === 'wallet') {
          // Wallet data should already be loaded, but could refresh if needed
        }
      },
      immediate: false
    },
    postSelect(a, b) {
      if (a.searchTerm != b.searchTerm || a.bitMask != b.bitMask) {
        this.displayPosts = [];
        this[this.postSelect.entry] = [];
        this.postSelect[this.postSelect.entry].o = 0;
        this.postSelect[this.postSelect.entry].e = false;
      }
    },
    "newToken.dist": {
      handler() {
        // Use setTimeout to ensure this runs after the current execution stack
        setTimeout(() => {
          try {
            this.updateAccountDistributionChart();
            this.updateTypeDistributionChart();
          } catch (error) {
            console.error('❌ Error in chart update watcher:', error);
            console.error('❌ Error stack:', error.stack);
          }
        }, 0);
      },
      deep: true,
    },
    "account": {
      handler(newValue) {
        this.getHiveUser(newValue);
        //this.getSpkStats();
        this.getSapi(newValue);
        this.getRcAccount(newValue); // Fetch RC account data
        //this.fetchDelegationsData(); // Fetch delegations data
        if (document.getElementById('accountDistributionChart') || document.getElementById('typeDistributionChart')) {
          this.initializeCharts(); // Initialize charts
        }
        this.loadCollaborationAuthHeaders(); // Load collaboration headers for new user
      },
    },
    "pageAccount": {
      handler(newValue, oldValue) {
        if (newValue && newValue !== oldValue) {
          // Clear previous posts when navigating to a different user
          this.displayPosts = [];
          this[this.postSelect.entry] = [];
          this.postSelect[this.postSelect.entry].o = 0;
          this.postSelect[this.postSelect.entry].e = false;
          this.postSelect[this.postSelect.entry].start_author = '';
          this.postSelect[this.postSelect.entry].start_permlink = '';
          
          // Load posts for the new user if on blog tab
          if (this.activeTab === 'blog') {
            this.getPosts(true);
          }
          
          // Load other user-specific data
          this.getHiveUser(newValue);
          this.getSapi(newValue, false);
          this.getTokenUser(newValue, false);
          this.getNFTs(newValue);
          
          // Update focus account
          this.focus.account = newValue;
          this.checkAccount("pageAccount", "focus");
          
          // Check if this is the current user
          this.me = (newValue === this.account);
          
          // Load account relations if not current user
          if (!this.me) {
            this.accountRelations(newValue);
          }
        }
      },
      immediate: false
    },
  },
  computed: {
    canClaim: {
      get() {
        return this.rcinfo.current > this.rcCost["claim_account_operation"] ? true : false
      },
    },
    hasHiveRewards: {
      get() {
        return parseInt((parseFloat(this.accountinfo.reward_hive_balance) +
          parseFloat(this.accountinfo.reward_hbd_balance) +
          parseFloat(this.accountinfo.reward_vesting_balance)) * 1000)
      }
    },
    location: {
      get() {
        return location;
      },
    },
    isNode: {
      get() {
        return this.smarkets.node[this.account] ? true : false;
      },
    },
    isntDlux: {
      get() {
        for (var i = 0; i < this.postBens.length; i++) {
          if (this.postBens[i].account == "dlux-io") {
            return true
          }
        }
        return false
      }
    },
    isntBenned: {
      get() {
        var unbenned = [], benned = {}
        for (var i = 0; i < this.postBens.length; i++) {
          benned[this.postBens[i].account] = this.postBens[i].weight
        }
        for (var i = 0; i < this.spkapi.file_contracts.length; i++) {
          if (!benned[this.spkapi.file_contracts[i].s.split(',')[0]] || benned[this.spkapi.file_contracts[i].s.split(',')[0]] < this.spkapi.file_contracts[i].s.split(',')[1]) {
            unbenned.push({
              contract: this.spkapi.file_contracts[i].i,
              account: this.spkapi.file_contracts[i].s.split(',')[0],
              weight: this.spkapi.file_contracts[i].s.split(',')[1]
            })
          }
        }
        return unbenned
      }
    },
    compiledMarkdown: function () {
      return DOMPurify.sanitize(marked.parse(this.postBody, { sanitize: true }))
    },
    voteVal() {
      return (
        (this.accountinfo.rshares / parseInt(this.rewardFund.recent_claims)) *
        parseFloat(this.rewardFund.reward_balance) *
        (parseFloat(this.feedPrice.base))
      );
    },
    

  },
}).mount('#app')
