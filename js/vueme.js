//import Vue from "https://cdn.jsdelivr.net/npm/vue@2.6.14/dist/vue.esm.browser.js";
import { createApp, toRaw } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'
import Navue from "/js/navue.js";
import FootVue from "/js/footvue.js";
import Cycler from "/js/cycler.js";
import Popper from "/js/pop.js";
import ModalVue from "/js/modalvue.js";
import Marker from "/js/marker.js";
import Ratings from "/js/ratings.js";
import MDE from "/js/mde.js";
import ChoicesVue from '/js/choices-vue.js';
import Replies from "/js/replies.js";
import CardVue from "/js/cardvue.js";
import Tagify from "/js/tagifyvue.js";
import ContractVue from "/js/contractvue.js";
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
import MCommon from '/js/methods-common.js'


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
if (
  lapi == "https://token.dlux.io" ||
  lapi == "https://spkinstant.hivehoneycomb.com" ||
  lapi == "https://inconceivable.hivehoneycomb.com"
) {
  console.log("using defaults");
  //window.history.replaceState(null, null, "dex");
}
let user = localStorage.getItem("user") || "GUEST";
let hapi = localStorage.getItem("hapi") || "https://hive-api.dlux.io";

// var app = new Vue({
// vue 2
// el: "#app", // vue 2
createApp({
  directives: {
    //scroll
  },
  data() {
    return {
      fileRequests: {},
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
      lastScroll: 0,
      activeTab: "blog",
      relations: { "follows": false, "ignores": false, "blacklists": false, "follows_blacklists": false, "follows_muted": false },
      sets: {},
      chains: {
        dlux: {
          enabled: false,
          api: "https://token.dlux.io",
          sets: {},
          multisig: "dlux-cc",
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
        configText: `require("dotenv").config()
        const { getPathObj, getPathNum } = require("./getPathObj")
        const { store } = require("./index");
        const { chronAssign } = require("./lil_ops")
        const ENV = process.env;
        const username = ENV.account || "$LEADER";
        const active = ENV.active || "";
        const follow = ENV.follow || "$LEADER";
        const msowner = ENV.msowner || "";
        const mspublic = ENV.mspublic || "";
        const memoKey = ENV.memo || "";
        const hookurl = ENV.discordwebhook || "";
        const NODEDOMAIN = ENV.domain || "$MAINAPI"
        const acm = ENV.account_creator || false 
        const mirror = ENV.mirror || false
        const port = ENV.PORT || 3001
        const pintoken = ENV.pintoken || ""
        const pinurl = ENV.pinurl || ""
        const status = ENV.status || true
        const dbcs = ENV.DATABASE_URL || ""
        const dbmods = ENV.DATABASE_MODS || []
        const typeDefs = ENV.APPTYPES || {}
        const history = ENV.history || 3600
        const stream = ENV.stream || "irreversible"
        const mode = ENV.mode || "normal"
        const timeoutStart = ENV.timeoutStart || 180000;
        const timeoutContinuous = ENV.timeoutContinuous || 30000;
        
        // testing configs for replays
        const override = ENV.override || 0 //69116600 //will use standard restarts after this blocknumber
        const engineCrank = ENV.startingHash || "QmconUD3faVGbgC2jAXRiueEuLarjfaUiDz5SA74kptuvu" //but this state will be inserted before
        
        const ipfshost = ENV.ipfshost || "127.0.0.1" //IPFS upload/download provider provider
        const ipfsport = ENV.ipfsport || "5001" //IPFS upload/download provider provider
        const ipfsprotocol = ENV.ipfsprotocol || "http" //IPFS upload/download protocol
        var ipfsLinks = ENV.ipfsLinks
          ? ENV.ipfsLinks.split(" ")
          : [
              \`\${ipfsprotocol}://\${ipfshost}:\${ipfsport}/ipfs/\`,
              "https://ipfs.dlux.io/ipfs/",
              "https://ipfs.3speak.tv/ipfs/",
              "https://infura-ipfs.io/ipfs/",
              "https://ipfs.alloyxuast.co.uk/ipfs/",
            ];
        
        const bidRate = ENV.BIDRATE || 2500 //
        
        //HIVE CONFIGS
        var startURL = ENV.STARTURL || "https://hive-api.dlux.io/";
        var clientURL = ENV.APIURL || "https://hive-api.dlux.io/";
        const clients = ENV.clients
          ? ENV.clients.split(" ")
          : [
              "https://api.deathwing.me/",
              "https://hive-api.dlux.io/",
              "https://rpc.ecency.com/",
              "https://hived.emre.sh/",
              "https://rpc.ausbit.dev/",
              "https://hive-api.dlux.io/",
            ];
        
        //!!!!!!! -- THESE ARE COMMUNITY CONSTANTS -- !!!!!!!!!//
        //TOKEN CONFIGS -- ALL COMMUNITY RUNNERS NEED THESE SAME VALUES
        const starting_block = $STARTINGBLOCK
        const prefix = "$PREFIX"
        const TOKEN = "$TOKEN"
        const precision = $PRECISION
        const tag = "$TAG"
        const jsonTokenName = "$JSONTOKEN"
        const leader = "$LEADER" 
        const ben = "$BEN"
        const delegation = "$DEL"
        const delegationWeight = $DELW
        const msaccount = "$MS"
        const msPubMemo = "$MSPUBMEMO"
        const msPriMemo = "$MSPRIMEMO"
        const msmeta = ""
        const mainAPI = "$MAINAPI"
        const mainRender = "$MAINRENDER"
        const mainFE = "$MAINFE"
        const mainIPFS = "$MAINIPFS"
        const mainICO = "$MAINICO"
        const footer = "\n$FOOTER";
        const hive_service_fee = $HIVESERVICEFEE
        const features = {
            pob: $FEATPOB,
            delegate: $FEATDEL,
            daily: $FEATDAILY,
            liquidity: $FEATLIQ,
            ico: $FEATICO,
            inflation: $FEATINF,
            dex: $FEATDEX,
            nft: $FEATNFT,
            state: $FEATSTATE,
            claimdrop: $FEATDROP
        }
        
        const CustomJsonProcessing = []
        const CustomOperationsProcessing = []
        const CustomAPI = []
        const CustomChron = []
        const stateStart = {
          "balances": {
              "ra": 0,
              "rb": 0,
              "rc": 0,
              "rd": 0,
              "re": 0,
              "ri": 0,
              "rm": 0,
              "rn": 0,
              "rr": 0
          },
          "delegations": {},
          "dex": {
              "hbd": {
                  "tick": "0.012500",
                  "buyBook": ""
              },
              "hive": {
                  "tick": "0.100000",
                  "buyBook": ""
              }
          },
          "gov": {
              ["$LEADER"]: 1,
              "t": 1 
          },
          "markets": {
              "node": {
                  ["$LEADER"]: {
                      "attempts": 0,
                      "bidRate": 2000,
                      "contracts": 0,
                      "domain": $"MAINAPI",
                      "escrow": true,
                      "escrows": 0,
                      "lastGood": $STARTINGBLOCK,
                      "marketingRate": 0,
                      "self": ["$LEADER"],
                      "wins": 0,
                      "yays": 0
                  }
              }
          },
          "pow": {
              ["$LEADER"]: 0,
              "t": 0
          },
          "queue": {
              "0": ["$LEADER"]
          },
          "runners": {
              ["$LEADER"]: {
                  "g": 1,
              }
          },
          "stats": {
              "IPFSRate": $IPFSRATE,
              "budgetRate": $BUDGETRATE,
              "currationRate": $CURRATIONRATE,
              "delegationRate": $DELEGATIONRATE,
              "hashLastIBlock": "Genesis",
              "icoPrice": 0, 
              "interestRate": $APYINT,
              "lastBlock": "",
              "marketingRate": $MARKETINGRATE,
              "maxBudget": $MAXBUDGET,
              "MSHeld":{
                  "HIVE": $HIVEBAL,
                  "HBD": $HBDBAL
              }, 
              "nodeRate": $NODERATE,
              "outOnBlock": 0,
              "savingsRate": $SAVINGSRATE,
              "tokenSupply": $TOKENSUPPLY
          }
        }
        
        const featuresModel = {
          claim_id: "drop_claim",
          claim_S: "Airdrop",
          claim_B: false,
          claim_json: "drop_claim",
          rewards_id: "claim",
          rewards_S: "Rewards",
          rewards_B: true,
          rewards_json: "claim",
          rewardSel: false,
          reward2Gov: true,
          send_id: "send",
          send_S: "Send",
          send_B: true,
          send_json: "send",
          powup_id: "power_up",
          powup_B: false,
          pow_val: "",
          powdn_id: "power_down",
          powdn_B: false,
          powsel_up: false,
          govup_id: "gov_up",
          govup_B: true,
          gov_val: "",
          govsel_up: true,
          govdn_id: "gov_down",
          govdn_B: true,
          node: {
            id: "node_add",
            enabled: true,
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
            ],
          },
          nft: [
            {
              id: "ft_sell",
              enabled: true,
              props: [
                {
                  name: "set",
                  type: "string",
                  help: "Set the FT to buy",
                },
                {
                  name: "uid",
                  type: "string",
                  help: "UID of the FT to buy",
                },
                {
                  name: "bid_amount",
                  type: "number",
                  help: \`milli$TOKEN\`,
                },
              ],
            },
            {
              id: "ft_buy",
              enabled: true,
              props: [
                {
                  name: "set",
                  type: "string",
                  help: "Set the FT to buy",
                },
                {
                  name: "uid",
                  type: "string",
                  help: "UID of the FT to buy",
                },
              ],
            },
            {
              id: "nft_sell_cancel",
              enabled: true,
              props: [
                {
                  name: "set",
                  type: "string",
                  help: "Set the FT to cancel sell",
                },
                {
                  name: "uid",
                  type: "string",
                  help: "UID of the FT to cancel sell",
                },
              ],
            },
            {
              id: "ft_sell_cancel",
              enabled: true,
              props: [
                {
                  name: "set",
                  type: "string",
                  help: "Set the FT to cancel sell",
                },
                {
                  name: "uid",
                  type: "string",
                  help: "UID of the FT to cancel sell",
                },
              ],
            },
            {
              id: "ft_auction",
              enabled: true,
              props: [
                {
                  name: "set",
                  type: "string",
                  help: "Set the NFT to be auctioned",
                },
                {
                  name: "uid",
                  type: "string",
                  help: "UID of the NFT to be auctioned",
                },
                {
                  name: "price",
                  type: "number",
                  help: "milliTYPE",
                },
                {
                  name: "type",
                  type: "string",
                  help: "HIVE or HBD",
                },
                {
                  name: "time",
                  type: "number",
                  help: "Number of Days, 7 Max.",
                },
              ],
            },
            {
              id: "ft_bid",
              enabled: true,
              props: [
                {
                  name: "set",
                  type: "string",
                  help: "Set the NFT to be bid on",
                },
                {
                  name: "uid",
                  type: "string",
                  help: "UID of the NFT to be bid on",
                },
                {
                  name: "bid_amount",
                  type: "number",
                  help: \`milli$TOKEN\`,
                },
              ],
            },
            {
              id: "nft_hauction",
              enabled: false,
              props: [
                {
                  name: "set",
                  type: "string",
                  help: "Set the NFT to be auctioned",
                },
                {
                  name: "uid",
                  type: "string",
                  help: "UID of the NFT to be auctioned",
                },
                {
                  name: "price",
                  type: "number",
                  help: "milliTYPE",
                },
                {
                  name: "type",
                  type: "string",
                  help: "HIVE or HBD",
                },
                {
                  name: "time",
                  type: "number",
                  help: "Number of Days, 7 Max.",
                },
              ],
            },
            {
              id: "fth_buy",
              enabled: true,
              props: [
                {
                  name: "amount",
                  type: "number",
                  help: \`milli$TOKEN\`,
                },
                {
                  name: "qty",
                  type: "number",
                  help: "Purchase Quantity",
                },
                {
                  name: "set",
                  type: "string",
                  help: "Set Name",
                },
                {
                  name: "item",
                  type: "string",
                  help: "contract name",
                },
              ],
            },
          ]
        }
        const adverts = [
            $ADVERTS
        ]     
        const detail = {
                        name: "$LONGNAME",
                        symbol: $TOKEN,
                        icon: "$ICON",
                        supply:"$TOKENSUPPLY",
                        wp:"$WP",
                        ws:"$MAINFE",
                        be:"https://hiveblockexplorer.com/",
                        text: "$DES"
                    }
        
        let config = {
          username,
            active,
            msowner,
            mspublic,
            memoKey,
            timeoutContinuous,
            timeoutStart,
            follow,
            NODEDOMAIN,
            hookurl,
            status,
            history,
            dbcs,
            dbmods,
            typeDefs,
            mirror,
            bidRate,
            engineCrank,
            port,
            pintoken,
            pinurl,
            clientURL,
            startURL,
            clients,
            acm,
            override,
            ipfshost,
            ipfsprotocol,
            ipfsport,
            ipfsLinks,
            starting_block,
            prefix,
            leader,
            msaccount,
            msPubMemo,
            msPriMemo,
            msmeta,
            ben,
            adverts,
            delegation,
            delegationWeight,
            TOKEN,
            precision,
            tag,
            mainAPI,
            jsonTokenName,
            mainFE,
            mainRender,
            mainIPFS,
            mainICO,
            detail,
            footer,
            hive_service_fee,
            features,
            stream,
            mode,
            featuresModel,
            CustomJsonProcessing,
            CustomOperationsProcessing,
            CustomAPI,
            CustomChron,
            stateStart
        };
        
        module.exports = config;
        `,
      },
      disablePost: true,
      inventory: true,
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
        "vrHash": "video"
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
        searchDefault: "Search UIDs and Owners",
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
        searchDefault: "Search UIDs and Owners",
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
      },
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
      serviceWorkerPromises: {}
    };
  },
  components: {
    "spk-vue": SPKVue,
    "assets-vue": Assets,
    "nav-vue": Navue,
    "foot-vue": FootVue,
    "cycle-text": Cycler,
    "pop-vue": Popper,
    "modal-vue": ModalVue,
    "vue-markdown": Marker,
    "vue-ratings": Ratings,
    "mde": MDE,
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
  },
  methods: {
    ...MCommon,
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
      console.log('SPK User Update')
      if (this.account) fetch("https://spktest.dlux.io/@" + this.account)
        .then((response) => response.json())
        .then((data) => {
          this.spkapi = data
          for (var node in data.file_contracts) {
            this.contractIDs[data.file_contracts[node].i] = data.file_contracts[node];
            this.contracts.push(data.file_contracts[node]);
            this.contractIDs[data.file_contracts[node].i].index = this.contracts.length - 1;
          }
          var videoUploadContract = false
          for (var user in data.channels) {
            for (var node in data.channels[user]) {
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
              // Hash.of(fileContent).then((hash) => {

              //   const dict = {hash, index:i, size: event.currentTarget.File.size, name: event.currentTarget.File.name, path:e.target.id, progress: '..........'}
              //   this.FileInfo[dict.name] = dict
              //   const file = this.File[i];
              //   this.File.splice(i, 1, file);
              // });
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
            }
          };
          reader.readAsBinaryString(e.target.files[i]);
          var File = e.target.files[i];
          File.progress = '..........';
          // File.hash = "";
          // File.md5 = ""
          this.File.push(File);
        }
      }
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
        // File.pin = true;
        // File.hash = "";
        // File.md5 = ""
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
          console.log(response);
        });
      }
    },
    appFile(data) {
      console.log(data)
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
          console.log(re.costs)
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
      var target = this.$refs.aframePreview.contentWindow
      target.postMessage({
        'func': 'resetCamera',
        'message': null,
      }, "*");
    },
    dluxMock() {
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
          console.log(e);
          r = "chartreuse,lawngreen";
        }
      }
      return `linear-gradient(${r})`;
    },
    // update: _.debounce(function(e) {
    //         this.postBody = e.target.value;
    //       }, 300),
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
        fetch("https://hive-api.dlux.io", {
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
      console.log('OK')
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
    getMARKETS() {
      console.log('Getting Markets')
      fetch("https://spktest.dlux.io/services/MARKET")
        .then((response) => response.json())
        .then((data) => {
          console.log(data)
          for (var listing = 0; listing < data.services.length; listing++) {
            console.log(data.services[listing])
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
        // var formdata = new FormData();
        // console.log(this.FileInfo[name].path)
        // console.log(document.getElementById(this.FileInfo[name].path))
        // formdata.append('file', document.getElementById(this.FileInfo[name].path).files[0]);
        // formdata.append(
        //   "path",
        //   `/${headers.split(":")[0]}/${headers.split(":")[1]}.${this.account}`
        // );
        // for (const value of formdata.values()) {
        //   console.log(value);
        // }
        // var myHeaders = new Headers()
        // myHeaders.append("Content-Type", "multipart/form-data")
        // var requestOptions = {
        //   method: "POST",
        //   body: formdata,
        //   headers: myHeaders,
        //   connection: 'keep-alive', 
        //   mode: 'cors',
        //   redirect: "follow",
        //   //credentials: 'include',
        // };
        // fetch(
        //   `https://ipfs.dlux.io/api/v0/add?stream-channels=true&pin=false&wrap-with-directory=false&progress=true&account=${this.account}&cid=${headers.split(":")[0]}&sig=${headers.split(":")[1]}`,
        //   //`https://ipfs.dlux.io/api/v0/add?stream-channels=true&pin=false&wrap-with-directory=false&progress=true&account=${this.account}&cid=${headers.split(":")[0]}&sig=${headers.split(":")[1]}`,
        //   requestOptions
        // )
        //   .then((response) => {
        //     response.text()
        //     console.log(response)
        //   })
        //   .then((result) => console.log(result))
        //   .catch((error) => console.log("error", error));
      });
    },
    /*
function buyFT(setname, uid, price, type,  callback){
     price = parseInt(price * 1000)
     if(type == 'HIVE')broadcastTransfer({ to: 'dlux-cc', hive: bid_amount, memo:`NFTbuy ${setname}:${uid}`}, `Buying on ${setname}:${uid}`)
     else if(type == 'HBD')broadcastTransfer({ to: 'dlux-cc', hbd: bid_amount, memo:`NFTbuy ${setname}:${uid}`}, `Buying ${setname}:${uid}`)
     else broadcastCJA({set: setname, uid, price}, 'dlux_ft_buy', `Trying to buy ${setname} mint token`)
 }

    */
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
    /*
function bidFT(setname, uid, callback){
    var bid_amount = document.getElementById(`${setname}-${uid}-bid`).value
    bid_amount = parseInt(bid_amount * 1000)
    broadcastCJA({set: setname, uid, bid_amount}, 'dlux_ft_bid', `Trying to bid on ${setname} mint token.`) 
 }
    */
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
    /*
function giveFT(setname, to, qty, callback){
    checkAccount(to)
    .then(r => {
        broadcastCJA({set: setname, to, qty}, "dlux_ft_transfer", `Trying to give ${setname} mint token to ${to}`) 
    })
    .catch(e=>alert(`${to} is not a valid hive account`))
 }
    */
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
      console.log('trigger', item)
      var pjm = JSON.parse(this.accountinfo.posting_json_metadata);
      if (pjm.profile)
        pjm.profile.profile_image = `${this.dataAPI}/pfp/${this.account}?${item.setname}-${item.uid}`;
      else
        pjm.profile = {
          profile_image: `${this.dataAPI}/pfp/${this.account}?${item.setname}-${item.uid}`,
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
      console.log(d)
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
    /*
function giveNFT(setname, uid, to, callback){
    checkAccount(to)
    .then(r => {
        broadcastCJA({set: setname, uid, to}, "dlux_nft_transfer", `Trying to give ${setname}:${uid} to ${to}`) 
    })
    .catch(e=>alert(`${to} is not a valid hive account`))
 }
*/
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
      console.log('getReply:', deets)
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
      console.log(this.toSign)
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
    dropClaim(prefix, claim_id) {
      this.toSign = {
        type: "cja",
        cj: {
          claim: true,
        },
        id: `${prefix}_${claim_id}`,
        msg: `Claiming...`,
        ops: ["getTokenUser"],
        txid: "claim",
      };
    },
    rewardClaim(prefix, rewards_id, gov = false) {
      this.toSign = {
        type: "cja",
        cj: {
          gov,
        },
        id: `${prefix}_${rewards_id}`,
        msg: `Claiming...`,
        ops: ["getTokenUser"],
        txid: "reward_claim",
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
        if (now - this.lastScroll > 2000) {
          this.lastScroll = now;
          if (
            document.documentElement.clientHeight + window.scrollY >
            document.documentElement.scrollHeight -
            document.documentElement.clientHeight * 2
          ) {
            if (this.activeTab == 'blog') this.getPosts();
            else if (this.activeTab == 'inventory') this.getNFTs()
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
      newToken.hiveServiceFee = parseInt(newToken.preHiveServiceFee * 100)
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
      console.log(txid)
      if (this.toSign.txid == txid) {
        this.toSign = {};
      }
    },
    log(event) {
      console.log(event)
    },
    getReplies(a, p, c) {
      return new Promise((resolve, reject) => {
        fetch('https://hive-api.dlux.io', {
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
    run(op) {
      console.log('Refreshing:', op)
      if (typeof this[op] == "function" && this.account != "GUEST") {
        this[op](this.account);
      }
    },
    accountRelations(name) {
      fetch("https://hive-api.dlux.io", {
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
          console.log(rez)
          this.relations = rez
        });
    },
    checkAccount(name, key) {
      console.log('Checking:', name)
      fetch("https://hive-api.dlux.io", {
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
        console.log("resetting")
        this.postSelect.bitMask = bitMask;
        this.displayPosts = [];
        this[this.postSelect.entry] = [];
        this.postSelect[this.postSelect.entry].o = 0;
        this.postSelect[this.postSelect.entry].e = false;
      }
      if (
        !this.postSelect[this.postSelect.entry].e &&
        !this.postSelect[this.postSelect.entry].p
      ) {
        this.postSelect[this.postSelect.entry].p = true;
        fetch("https://hive-api.dlux.io", {
          body: `{"jsonrpc":"2.0", "method":"condenser_api.get_blog_entries", "params":["${this.pageAccount
            }",${this.postSelect[this.postSelect.entry].o},${this.postSelect[this.postSelect.entry].a
            }], "id":1}`,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          method: "POST",
        })
          .then((r) => r.json())
          .then((res) => {
            this.postSelect[this.postSelect.entry].p = false;
            var authors = [];
            this.postSelect[this.postSelect.entry].o +=
              this.postSelect[this.postSelect.entry].a;
            if (res.result.length < this.postSelect[this.postSelect.entry].a)
              this.postSelect[this.postSelect.entry].e = true;
            for (var i = 0; i < res.result.length; i++) {
              res.result[i].type = "Blog";
              if (this.postSelect[this.postSelect.entry].o != res.result[i].entry_id - 1) {
                this.postSelect[this.postSelect.entry].o = res.result[i].entry_id - 1;
              }
              if (
                !this.posturls[
                `/@${res.result[i].author}/${res.result[i].permlink}`
                ]
              ) {
                this.posturls[
                  `/@${res.result[i].author}/${res.result[i].permlink}`
                ] = res.result[i];
              }
              this[this.postSelect.entry].push(
                `/@${res.result[i].author}/${res.result[i].permlink}`
              );
            }
            var called = false;
            for (var post in this.posturls) {
              if (!this.posturls[post].created) {
                this.getContent(
                  this.posturls[post].author,
                  this.posturls[post].permlink
                );
                called = true;
              }
              authors.push(this.posturls[post].author);
            }
            if (!called) this.selectPosts();
            authors = [...new Set(authors)];
            this.getHiveAuthors(authors);
          });
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
        fetch('https://hive-api.dlux.io', {
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
                console.log(key, e, "no JSON?");
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
        console.log("no author or permlink", a, p);
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
    readRep(rep2) {
      function log10(str) {
        const leadingDigits = parseInt(str.substring(0, 4));
        const log = Math.log(leadingDigits) / Math.LN10 + 0.00000001;
        const n = str.length - 1;
        return n + (log - parseInt(log));
      }
      if (rep2 == null) return rep2;
      let rep = String(rep2);
      const neg = rep.charAt(0) === "-";
      rep = neg ? rep.substring(1) : rep;

      let out = log10(rep);
      if (isNaN(out)) out = 0;
      out = Math.max(out - 9, 0); // @ -9, $0.50 earned is approx magnitude 1
      out = (neg ? -1 : 1) * out;
      out = out * 9 + 25; // 9 points per magnitude. center at 25
      // base-line 0 to darken and < 0 to auto hide (grep rephide)
      out = parseInt(out);
      return out;
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
            console.log(JSON.stringify(data))
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
        console.log("No SPK seconds");
        return 0;
      } else if (diff < 28800) {
        console.log("Wait for SPK");
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
          console.log(e);
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
        this.posturls[a].rep = this.readRep(
          this.authors[this.posturls[a].author].reputation
        );
      }
    },
    addBens(obj) {
      console.log(obj)
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
        s.HTML = s.comp.HTML
        s.set = s.comp.set
        s.attributes = s.comp.attributes
        this.NFTtrades.push(s);
      } else
        setTimeout(() => {
          this.finishPNFT(s);
        }, 250);
    },
    trades(i) {
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
        .catch((e) => console.log(e));
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
        .catch((e) => console.log(e));
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
      console.log("Saving...")
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
      console.log('hive info', user)
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
          try {
            pfp = this.accountinfo.posting_json_metadata.profile.profile_image;
          } catch (e) { }
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
        });
    },
    getHiveStats() {
      fetch(this.hapi, {
        body: `{"jsonrpc":"2.0", "method":"condenser_api.get_dynamic_global_properties", "params":[], "id":1}`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        method: "POST",
      })
        .then((r) => r.json())
        .then((r) => {
          this.hivestats = r.result;
        });
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
          });
      }
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
    callScript(o) {
      return new Promise((resolve, reject) => {
        if (this.serviceWorker) {
          this.callSWfunction('callScript', o).then((r) => {
            resolve(r)
          }).catch((e) => { console.log('Service Worker not found', e); this.serviceWorker = false; this.callScript(o).then((r) => { resolve(r) }) })
        } else if (this.nftscripts[o.script]) {
          const code = `(//${this.nftscripts[o.script]}\n)("${o.uid ? o.uid : 0
            }")`;
          var computed = eval(code);
          computed.uid = o.uid || "";
          computed.owner = o.owner || "";
          computed.script = o.script;
          (computed.setname = o.set), (computed.token = o.token);
          resolve(computed);
        } else {
          this.pullScript(o.script).then((empty) => {
            this.callScript(o).then((r) => {
              resolve(r);
            });
          });
        }
      });
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
      this.posturls = {};
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
      this.getSPKUser()
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
      const WPY = ((1 + (this.newToken.apy / 201600)) ** (2016 * 52) - 1) / 52 //how to normalize APY to WPY
      const SAT = INT + parseInt(INT * WPY)
      var oneOff = false
      var j = 0
      while (binSearch != lastFit) {
        j++
        console.log(binSearch, lastFit, WPY, SAT)
        lastFit = binSearch
        var int = INT
        for (var i = 0; i < 2016; i++) {
          int += parseInt(int / binSearch)
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
      console.log('Iterations', j)
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
      this.ffmpeg_page = true
      const { fetchFile } = FFmpegUtil;
      const { FFmpeg } = FFmpegWASM;
      let ffmpeg = null;
      var qsv = false
      var height = 0
      var width = 0
      var run = 0
      var bitrates = []
      const patt = /\d{3,5}x\d{3,5}/
      if (ffmpeg === null) {
        ffmpeg = new FFmpeg();
        ffmpeg.on("log", ({ message }) => {
          this.videoMsg = message;
          if (message.indexOf('h264_qsv') > -1) qsv = true
          if (!height && patt.test(message)) {
            const parts = patt.exec(message);
            console.log(parts)
            height = parts[0].split('x')[1]
            width = parts[0].split('x')[0]
            bitrates = this.getPossibleBitrates(height)
          }
          console.log(message);
        })
        ffmpeg.on("progress", ({ progress, time }) => {
          this.videoMsg = `${progress * 100} %, time: ${time / 1000000} s`;
        });
        await ffmpeg.load({
          coreURL: "/packages/core/package/dist/umd/ffmpeg-core.js",
        });
      }
      const { name } = event.target.files[0];
      await ffmpeg.writeFile(name, await fetchFile(event.target.files[0]));
      var codec = "libx264"
      var commands = [
        // input filename
        "-i", name,
        // 10 second segments
        "-segment_time", "10",
        // max muxing queue size
        '-max_muxing_queue_size', '1024',
        // hls settings
        '-hls_time', "5",
        '-hls_list_size', "0",
        // profile
        '-profile:v', 'main',
        // audio codec and bitrate
        "-acodec", "aac", "-b:a", "256k",
        // write to files by index
        //"-f", "segment", "output%03d.mp4", 
        //`-segment_format`, 'mpegts',
        // m3u8 playlist
        //"-segment_list_type", "m3u8", "-segment_list", "index.m3u8"
      ]
      await ffmpeg.exec([
        "-encoders"]
      )
      await ffmpeg.exec([
        "-i", name]
      )
      // add options based on availible encoders
      if (qsv) {
        codec = "h264_qsv"
        commands.push('-preset', 'slow', '-look_ahead', '1', '-global_quality', '36', "-c", codec)
      } else {
        commands.push('-crf', '26', '-preset', 'fast', "-c", codec)
      }
      for (var i = 0; i < bitrates.length; i++) {
        commands.push("-f", "segment", `${bitrates[i].split('x')[1]}p_%03d.ts`, `-segment_format`, 'mpegts',
          // m3u8 playlist
          "-segment_list_type", "m3u8", "-segment_list", `${bitrates[i].split('x')[1]}p_index.m3u8`)
        commands.push('-vf', `scale=-1:${parseInt(bitrates[i].split('x')[1])}`)
      }
      this.videoMsg = 'Start transcoding';
      console.time('exec');
      console.log({ commands })
      await ffmpeg.exec(commands)
      fetch(`https://spk-ipfs.3speak.tv/upload-contract?user=${this.account}`).then(r => r.json()).then((data) => {
        setTimeout(() => {
          this.showUpload = true
          this.getSPKUser()
        }, 1000)
      })
      console.timeEnd('exec');
      this.videoMsg = 'Complete transcoding';
      ffmpeg.listDir("/").then((files) => {
        for (const file of files) {
          console.log(file);
          if (file.name.includes('.m3u8')) {
            ffmpeg.readFile(file.name).then((data) => {
              this.dataURLS.push([file.name, data.buffer, 'application/x-mpegURL'])
            })
          } else if (file.name.includes('.ts')) {
            ffmpeg.readFile(file.name).then((data) => {
              this.dataURLS.push([file.name, data.buffer, 'video/mp2t'])
            })
          }
        }
      })
      //const data = await ffmpeg.readFile("144p_000.ts")
      //console.log(data)
      //this.videosrc = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp2t' }));
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
    activeIndexUp() {
      console.log(this.activeIndex, this[this.focusItem.source].length, this.focusItem)
      if (this.activeIndex < this[this.focusItem.source].length - 1) this.activeIndex++
      else this.activeIndex = 0
    },
    activeIndexDn() {
      if (this.activeIndex > 0) this.activeIndex--
      else this.activeIndex = this[this.focusItem.source].length - 1
    },
    onClassChange(classAttrValue) {
      console.log(classAttrValue)
      const classList = classAttrValue.split(' ');
      if (classList.includes('active')) {
        console.log('active');
      }
    },
    init(reset = false) {
      if (reset) {
        if (location.pathname.split("/@")[1]) {
          this.pageAccount = location.pathname.split("/@")[1]
          if (this.pageAccount.indexOf('/') > -1) {
            this.pagePermlink = this.pageAccount.split('/')[1]
            this.pageAccount = this.pageAccount.split('/')[0]
          }
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
        this.getHiveUser();
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
        this.getSapi(this.pageAccount, false);
        //this.getTokenUser(this.pageAccount, false);
        //this.getNFTs(this.pageAccount);
      }
      if (!this.builder) {
        deepLink();
        this.activeTab = hash?.[1] || 'blog'
        this.observer = new MutationObserver(mutations => {
          for (const m of mutations) {
            const newValue = m.target.getAttribute(m.attributeName);
            this.$nextTick(() => {
              console.log('tick')
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
  },
  mounted() {
    // Check for active service worker
    if ('serviceWorker' in navigator) {
      if (navigator.onLine) {
        this.serviceWorker = true;
        // recieve messages
        navigator.serviceWorker.addEventListener('message', event => {
          try {
            this.serviceWorkerPromises[`${event.data.script}:${event.data.uid}`].resolve(event.data);
            delete this.serviceWorkerPromises[`${event.data.script}:${event.data.uid}`]
          } catch (e) { console.log(e) }
        });
        navigator.serviceWorker.startMessages();
      } else {
        this.serviceWorker = false;
      }
    }
    this.pendingTokens = JSON.parse(localStorage.getItem(`pendingTokens`)) || []
    //window.addEventListener('scroll', this.handleScroll);
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
  },
  beforeDestroy() {
    this.observer.disconnect();
  },
  unmounted() {
    //window.removeEventListener('scroll', this.handleScroll);
  },
  watch: {
    postSelect(a, b) {
      if (a.searchTerm != b.searchTerm || a.bitMask != b.bitMask) {
        this.displayPosts = [];
        this[this.postSelect.entry] = [];
        this.postSelect[this.postSelect.entry].o = 0;
        this.postSelect[this.postSelect.entry].e = false;
      }
    },

  },
  computed: {
    canClaim: {
      get() {
        return this.rcinfo.current > this.rcCost["claim_account_operation"] ? true : false
      },
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
