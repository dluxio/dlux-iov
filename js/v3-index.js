import { createApp } from "https://cdn.jsdelivr.net/npm/vue@3.3.4/dist/vue.esm-browser.js";
import Navue from "/js/v3-nav.js";
import FootVue from "/js/footvue.js";
import DetailVue from "/js/detailvue.js";
import MCommon from '/js/methods-common.js';
// DetailVue dependencies
import Marker from "/js/marker.js";
import Ratings from "/js/ratings.js";
import MDE from "/js/mde.js";
import Vote from "/js/vote.js";
import Pop from "/js/pop.js";
import Replies from "/js/replies.js";
import Bennies from "/js/bennies.js";

let url = location.href.replace(/\/$/, "");
let lapi = "";
if (location.search) {
  const string = location.search.replace("?", "");
  let params = string.split("&");
  for (let i = 0; i < params.length; i++) {
    let param = params[i].split("=");
    if (param[0] == "api") {
      lapi = param[1];
    }
  }
}
if (location.hash && !lapi) {
  const hash = url.split("#");
  if (hash[1].includes("dlux")) {
    lapi = "https://token.dlux.io";
  } else if (hash[1].includes("larynx")) {
    lapi = "https://spkinstant.hivehoneycomb.com";
  } else if (hash[1].includes("duat")) {
    lapi = "https://duat.hivehoneycomb.com";
  }
}
if (!lapi) {
  lapi = localStorage.getItem("lapi") || "https://token.dlux.io";
}
console.log(lapi);
if (
  lapi == "https://token.dlux.io" ||
  lapi == "https://spkinstant.hivehoneycomb.com" ||
  lapi == "https://duat.hivehoneycomb.com"
) {
  console.log("using defaults");
  //window.history.replaceState(null, null, "dex");
}
let user = localStorage.getItem("user") || "GUEST";
let hapi = localStorage.getItem("hapi") || "https://api.hive.blog";
console.log({
  lapi,
});

// Create Vue 3 app
const app = createApp({
  data() {
    return {
      account: user,
      toSign: {},
      tickers: {
        DLUX:{
          change:"",
          tick:""
        },
        DUAT:{
          change:"",
          tick:""
        },
        LARYNX:{
          change:"",
          tick:""
        }
      },
      lapi: lapi,
      hapi: hapi,
      // Proposal tracker data
      proposals: [],
      userVotes: [],
      daoFund: {
        treasury: 0,
        available: 0,
        dailyInflow: 0,
        ninjaGrant: 0,
        hiveBalance: 0
      },
      loading: false,
      error: null,
      filterStatus: 'active',
      sortBy: 'votes',
      searchTerm: '',
      votingProposal: null,
      proposalThreshold: 0,
      selectedProposal: null,
      selectedProposalForAnalysis: null,
      showProposalModal: false,
      pendingProposalId: null, // For showing modal while proposals are loading
      // Custom analysis data
      customAnalysis: {
        active: false,
        dailyAmount: 0,
        isAddition: true,
        description: ''
      },
      customAnalysisForm: {
        amount: 0,
        period: 'daily',
        isAddition: true,
        description: ''
      },
      // Blog modal data
      blogPost: null,
      showBlogModal: false,
      
      // Health monitor
      viewMode: 'current', // 'current' or 'hf_proposal'
      priceGrowthRate: 0, // -50 to 500% APR
      chartInstance: null,
      chartUpdateTimeout: null,
      urlChecker: null,
      updatingChart: false,
      healthStats: {
        totalFundedOutflows: 0,
        totalFundedOutflowsNoZero: 0,
        totalFundedOutflowsNoStabilizer: 0,
        userVotedOutflows: 0,
        userVotedOutflowsNoZero: 0,
        userVotedOutflowsNoStabilizer: 0
      },
      
      // Witness monitoring data
      witnesses: [],
      witnessSchedule: null,
      userWitnessVotes: [],
      userProxy: null,
      currentBlock: 0,
      current_witness: '',
      signingOperation: false,
      
      // Live monitoring
      isMonitoring: false,
      monitoringInterval: 10000, // 10 seconds
      monitoringTimer: null,
      lastUpdate: null,
      
      // Witness management
      isUserWitness: false,
      currentUserWitnessInfo: null,
      witnessForm: {
        url: '',
        signingKey: '',
        accountCreationFee: 3,
        maxBlockSize: 65536,
        hbdInterestRate: 0
      },
      
      // Proxy modal
      showProxyModal: false,
      proxyForm: {
        account: ''
      },
      
      // Proposal management
      creatingProposal: false,
      updatingProposal: null,
      removingProposal: null,

      // State for supporters functionality
      showSupportersModal: false,
      selectedProposalForSupporters: null,
      proposalSupporters: [],
      loadingSupporters: false,
      createProposalForm: {
        subject: '',
        receiver: '',
        start_date: '',
        end_date: '',
        daily_pay: '',
        permlink: '',
        permlinkValid: null // null = not checked, true = valid, false = invalid
      },
      updateProposalForm: {
        id: null,
        subject: '',
        daily_pay: '',
        original_daily_pay: 0,
        permlink: '',
        permlinkValid: null // null = not checked, true = valid, false = invalid
      },
      
      accountapi: {},
      accountinfo: null,
      authors: {}, // Store author information for reputation calculations
      hiveprice: {
        hive: {
          usd: 0.25, // Initial fallback, will be updated from witness feeds
        },
      },
      hbdprice: {
        hive_dollar: {
          usd: 1,
        },
      },
      nodes: {},
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
        hiveServiceFee: 0,
        featpob: false,
        featdel: false,
        featdaily: false,
        featliq: false,
        featico: false,
        featinf: false,
        featdex: false,
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
        apyint: 0,
        dist: {},
        powDist: {},
        govDist: {},
        configJSON:{
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
        var startURL = ENV.STARTURL || "https://api.hive.blog/";
        var clientURL = ENV.APIURL || "https://api.hive.blog/";
        const clients = ENV.clients
          ? ENV.clients.split(" ")
          : [
              "https://api.deathwing.me/",
              "https://api.hive.blog/",
              "https://rpc.ecency.com/",
              "https://hived.emre.sh/",
              "https://rpc.ausbit.dev/",
              "https://api.hive.blog/",
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
      prefix: "",
      multisig: "",
      jsontoken: "",
      node: "",
      behind: "",
      stats: {},
      TOKEN: "LARYNX",
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
      hivestats: {
        pending_rewarded_vesting_hive: "0.000 HIVE",
      },
      dappstats: 159,
      // Post type selector for DetailVue component
      postSelect: {
        types: {
          "360": {
            checked: false,
            icon: "fa-solid fa-cubes me-2",
            launch: "Launch 360",
            location: "/dlux/@",
            hint: "",
            bitFlag: 1,
          },
          Meme: {
            checked: false,
            icon: "fa-solid fa-images me-2",
            launch: "View Images",
            location: "/dlux/@",
            hint: "",
            bitFlag: 2,
          },
          dCity: {
            checked: false,
            icon: "fa-solid fa-city me-2",
            launch: "View dCity",
            location: "/dlux/@",
            hint: "",
            bitFlag: 4,
          },
          Game: {
            checked: false,
            icon: "fa-solid fa-gamepad me-2",
            launch: "Play Game",
            location: "/dlux/@",
            hint: "",
            bitFlag: 8,
          },
          NFT: {
            checked: false,
            icon: "fa-solid fa-certificate me-2",
            launch: "View NFT",
            location: "/nfts/@",
            hint: "",
            bitFlag: 16,
          },
          Collection: {
            checked: false,
            icon: "fa-solid fa-layer-group me-2",
            launch: "View Collection",
            location: "/nfts/sets/@",
            hint: "",
            bitFlag: 32,
          },
          Livestream: {
            checked: false,
            icon: "fa-solid fa-video me-2",
            launch: "Watch Stream",
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
    };
  },
  watch: {
    account(newAccount) {
      // Refresh user votes when account changes
      if (window.location.pathname.includes('/proposals')) {
        if (newAccount) {
         this.fetchUserVotes().then(() => {
           this.calculateHealthStats();
         });
        } else {
          this.userVotes = [];
         this.calculateHealthStats();
        }
      }
      
      // Refresh witness votes when account changes - do this globally, not just on witnesses page
      if (newAccount) {
        this.fetchUserWitnessVotes();
        this.checkIfUserIsWitness();
      } else {
        this.userWitnessVotes = [];
        this.userProxy = null;
        this.isUserWitness = false;
        this.currentUserWitnessInfo = null;
      }
    },
      
      priceGrowthRate() {
        // Add a small debounce to prevent rapid updates
        if (this.chartUpdateTimeout) {
          clearTimeout(this.chartUpdateTimeout);
        }
        this.chartUpdateTimeout = setTimeout(() => {
          if (this.chartInstance && this.daoFund && this.hiveprice?.hive?.usd) {
            this.updateChartData();
          }
        }, 100);
      },
      
      showProxyModal(newVal) {
        if (newVal) {
          this.$nextTick(() => {
            const modalElement = document.getElementById('proxyModal');
            if (modalElement) {
              const modal = new bootstrap.Modal(modalElement);
              modal.show();
              
              modalElement.addEventListener('hidden.bs.modal', () => {
                this.showProxyModal = false;
              }, { once: true });
            }
          });
        }
      }
  },
  beforeUnmount() {
    // Clean up chart and timeouts
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
    if (this.chartUpdateTimeout) {
      clearTimeout(this.chartUpdateTimeout);
      this.chartUpdateTimeout = null;
    }
    
    // Clean up URL monitoring
    if (this.urlChecker) {
      clearInterval(this.urlChecker);
      this.urlChecker = null;
    }
    
    // Clean up witness monitoring
    this.stopMonitoring();
  },
  components: {
    "nav-vue": Navue,
    "foot-vue": FootVue,
    "detail-vue": DetailVue,
    // DetailVue sub-components
    "vue-markdown": Marker,
    "vue-ratings": Ratings,
    "mde": MDE,
    "vote": Vote,
    "pop-vue": Pop,
    "replies": Replies,
    "bennies": Bennies
  },
  methods: {
    ...MCommon,
    
    // Load proposals on mount
    async loadProposals() {
      this.loading = true;
      this.error = null;
      try {
        // Load proposals, user votes, and DAO fund info in parallel
        await Promise.all([
          this.fetchProposals(),
          this.account ? this.fetchUserVotes() : Promise.resolve(),
          this.fetchDaoFund()
        ]);
        
        // Calculate health statistics after loading data
        this.calculateHealthStats();
        
        // Initialize chart after data is loaded
        this.$nextTick(() => {
          this.createChart();
        });
      } catch (error) {
        console.error('Error loading proposals:', error);
        this.error = error.message || 'Failed to load proposals. Please try again.';
      } finally {
        this.loading = false;
      }
    },

    async fetchProposals() {
      try {
        // Try both methods - list_proposals and find_proposals
        const [listResponse, findResponse] = await Promise.all([
          fetch(this.hapi, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'database_api.list_proposals',
              params: {
                start: [],
                limit: 1000,
                order: 'by_total_votes',
                order_direction: 'descending',
                status: 'all'
              },
              id: 1
            })
          }),
          fetch(this.hapi, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'database_api.find_proposals',
              params: {
                proposal_ids: []
              },
              id: 2
            })
          })
        ]);
        
        if (!listResponse.ok && !findResponse.ok) {
          throw new Error('Both API methods failed');
        }
        
        const [listData, findData] = await Promise.all([
          listResponse.ok ? listResponse.json() : Promise.resolve({ error: 'list failed' }),
          findResponse.ok ? findResponse.json() : Promise.resolve({ error: 'find failed' })
        ]);
        
        console.log('List proposals response:', listData); // Debug log
        console.log('Find proposals response:', findData); // Debug log
        
        let proposals = [];
        
        // Use whichever method worked
        if (listData.result && listData.result.proposals && listData.result.proposals.length > 0) {
          proposals = listData.result.proposals;
          console.log('Using list_proposals, count:', proposals.length);
        } else if (findData.result && findData.result.proposals && findData.result.proposals.length > 0) {
          proposals = findData.result.proposals;
          console.log('Using find_proposals, count:', proposals.length);
        } else {
          console.warn('No proposals found from either method');
        }
        
        this.proposals = proposals;
        console.log('Final proposals count:', this.proposals.length); // Debug log
        if (this.proposals.length > 0) {
          console.log('Sample proposal:', this.proposals[0]); // Debug log
        }
        
        this.calculateProposalThreshold();
        
        // Handle pending proposal from URL routing
        if (this.pendingProposalId && this.proposals.length > 0) {
          const proposal = this.proposals.find(p => (p.proposal_id || p.id) === this.pendingProposalId);
          if (proposal) {
            this.selectedProposal = proposal;
            this.pendingProposalId = null;
          }
        }
      } catch (error) {
        console.error('Error fetching proposals:', error);
        throw new Error(`Failed to fetch proposals: ${error.message}`);
      }
    },

    async fetchUserVotes() {
      if (!this.account) return;
      
      try {
        const response = await fetch(this.hapi, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'database_api.list_proposal_votes',
            params: {
              start: [this.account],
              limit: 1000,
              order: 'by_voter_proposal',
              order_direction: 'ascending',
              status: 'all'
            },
            id: 1
          })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.error) throw new Error(data.error.message || 'API error fetching user votes');
        
        this.userVotes = data.result?.proposal_votes || [];
      } catch (error) {
        console.error('Error fetching user votes:', error);
        // Don't throw here, just log the error since user votes are not critical
        this.userVotes = [];
      }
    },

    async fetchDaoFund() {
      try {
        // Get both dynamic global properties and hive.fund account info
        const [propsResponse, accountResponse] = await Promise.all([
          fetch(this.hapi, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },  
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'database_api.get_dynamic_global_properties',
              params: {},
              id: 1
            })
          }),
          fetch(this.hapi, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },  
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'condenser_api.get_accounts',
              params: [['hive.fund']],
              id: 2
            })
          })
        ]);
        
        const [propsData, accountData] = await Promise.all([
          propsResponse.json(),
          accountResponse.json()
        ]);
        
        if (propsData.error) throw new Error(propsData.error.message);
        if (accountData.error) throw new Error(accountData.error.message);
        
        const props = propsData.result;
        const hiveFundAccount = accountData.result?.[0];
        
        console.log('DHF Props:', props); // Debug log
        console.log('Hive.fund account:', hiveFundAccount); // Debug log
        
                 // Calculate daily inflow from pending_rewarded_vesting_hive * hive_price * 0.325
         let dailyInflow = 0;
         if (props.pending_rewarded_vesting_hive && this.hiveprice?.hive?.usd) {
           const pendingRewards = props.pending_rewarded_vesting_hive.amount / Math.pow(10, props.pending_rewarded_vesting_hive.precision);
           dailyInflow = pendingRewards * this.hiveprice.hive.usd * 0.325 /24;
         }
         
         // Get actual fund balance from hive.fund account
         let fundBalance = 0;
         let dailyAvailable = 0;
         let hiveBalance = 0;
         let ninjaGrant = 0;
         let beneficiaryRewards = 0;
         
         if (hiveFundAccount) {
           if (hiveFundAccount.hbd_balance) {
             fundBalance = parseFloat(hiveFundAccount.hbd_balance.split(' ')[0]);
             dailyAvailable = fundBalance / 100;
           }
           if (hiveFundAccount.balance) {
             hiveBalance = parseFloat(hiveFundAccount.balance.split(' ')[0]);
             // Ninja grant: 0.05% per day of hive balance converted to HBD
             ninjaGrant = (hiveBalance * 0.0005) * this.hiveprice.hive.usd;
           }
         }
         
         // Beneficiary rewards: 200,000 Hive monthly from comment voting converted to HBD
         
         if (this.hiveprice?.hive?.usd) {
           beneficiaryRewards = (200000 / 30) * this.hiveprice.hive.usd;
         }
         
         this.daoFund = {
           treasury: fundBalance,
           available: dailyAvailable,
           dailyInflow: dailyInflow,
           ninjaGrant: ninjaGrant,
           beneficiaryRewards: beneficiaryRewards,
           hiveBalance: hiveBalance
         };
      } catch (error) {
        console.error('Error fetching DAO fund:', error);
        // Set defaults on error
        this.daoFund = {
          treasury: 0,
          available: 0,
          dailyInflow: 0,
          ninjaGrant: 0,
          beneficiaryRewards: 0,
          hiveBalance: 0
        };
      }
    },

    calculateProposalThreshold() {
      // The funding threshold is determined by the Return Proposal (proposal #0)
      // Any proposal with more votes than the Return Proposal gets funded
      const returnProposal = this.proposals.find(p => (p.proposal_id || p.id) === 0);
      
      if (returnProposal) {
        this.proposalThreshold = parseFloat(returnProposal.total_votes);
        console.log('Funding threshold set by Return Proposal:', {
          returnProposalVotes: this.proposalThreshold,
          dailyAvailable: this.daoFund.available
        });
      } else {
        // Fallback: if no return proposal found, calculate based on funding capacity
        if (this.proposals.length > 0 && this.daoFund.available > 0) {
          const activeProposals = this.proposals.filter(p => this.isProposalActive(p));
          const sortedProposals = [...activeProposals].sort((a, b) => 
            parseFloat(b.total_votes) - parseFloat(a.total_votes)
          );
          
          let cumulativeDailyPayout = 0;
          let thresholdVotes = 0;
          
          for (const proposal of sortedProposals) {
            const dailyPay = parseFloat(proposal.daily_pay?.amount || 0) / 1000;
            
            if (cumulativeDailyPayout + dailyPay <= this.daoFund.available) {
              cumulativeDailyPayout += dailyPay;
            } else {
              thresholdVotes = parseFloat(proposal.total_votes);
              break;
            }
          }
          
          this.proposalThreshold = thresholdVotes;
          console.log('Fallback threshold calculated:', {
            thresholdVotes: thresholdVotes,
            dailyAvailable: this.daoFund.available
          });
        } else {
          this.proposalThreshold = 0;
          console.log('No threshold calculated - no proposals or no available funds');
        }
      }
    },

    async voteForProposal(proposalId, approve) {
      if (!this.account) return;
      
      this.votingProposal = proposalId;
      
      const op = {
        type: "raw",
        op: [
          [
            "update_proposal_votes",
            {
              voter: this.account,
              proposal_ids: [proposalId.toString()],
              approve: approve
            }
          ]
        ],
        key: "active",
        msg: `${approve ? 'Supporting' : 'Removing support for'} Proposal #${proposalId}`,
        txid: `update_proposal_votes_${proposalId}_${Date.now()}`,
        api: "https://api.hive.blog",
        delay: 250,
        ops: ["fetchUserVotes", "resetVotingState"]
      };
      
      this.toSign = op;
    },

    // Callback method to reset voting state after operation completes
    resetVotingState() {
      this.votingProposal = null;
    },

    // Required method for v3-nav ack event - clears toSign when operation is acknowledged
    removeOp(txid) {
      if (this.toSign.txid === txid) {
        this.toSign = {};
      }
      // Reset management states if needed
      if (txid.includes('create_proposal')) {
        this.creatingProposal = false;
      }
      if (txid.includes('update_proposal')) {
        this.updatingProposal = null;
      }
      if (txid.includes('remove_proposal')) {
        this.removingProposal = null;
      }
    },

    getUserVote(proposalId) {
      return this.userVotes.find(vote => 
        vote.proposal.id === proposalId && vote.voter === this.account
      );
    },

    getVotePercentage(proposal) {
      // Calculate support level relative to funding threshold
      if (!this.proposalThreshold || this.proposalThreshold === 0) return 0;
      
      const proposalVotes = parseFloat(proposal.total_votes);
      const percentage = (proposalVotes / this.proposalThreshold) * 100;
      
      // Cap at 99.9% if below threshold, or return exact if at/above threshold
      if (percentage >= 100) {
        return percentage; // Can be above 100%
      } else {
        return Math.min(percentage, 99.9); // Max 99.9% if below threshold
      }
    },

    getSupportLabel(proposal) {
      if (!this.proposalThreshold || this.proposalThreshold === 0) {
        return "No threshold set";
      }
      
      const proposalVotes = parseFloat(proposal.total_votes);
      
      // If this proposal's votes equal the threshold, it IS the threshold
      if (Math.abs(proposalVotes - this.proposalThreshold) < 1000000) { // 1M vests tolerance
        return "Threshold for Funding";
      }
      
      // Check if this proposal is funded
      if (this.isProposalFunded(proposal)) {
        return "Above Threshold";
      } else {
        const percentage = this.getVotePercentage(proposal);
        return `${percentage.toFixed(1)}% of threshold`;
      }
    },

    isProposalFunded(proposal) {
      // Check if this specific proposal would be funded based on current vote order
      // Only consider active proposals for funding
      if (this.proposals.length === 0 || this.daoFund.available === 0) return false;
      
      // Filter to only active proposals and sort by votes
      const activeProposals = this.proposals.filter(p => this.isProposalActive(p));
      const sortedProposals = [...activeProposals].sort((a, b) => 
        parseFloat(b.total_votes) - parseFloat(a.total_votes)
      );
      
      let cumulativeDailyPayout = 0;
      
      for (const p of sortedProposals) {
        const dailyPay = parseFloat(p.daily_pay?.amount || 0) / 1000;
        
        if (p.id === proposal.id) {
          return cumulativeDailyPayout + dailyPay <= this.daoFund.available;
        }
        
        cumulativeDailyPayout += dailyPay;
        if (cumulativeDailyPayout > this.daoFund.available) {
          break;
        }
      }
      
      return false;
    },

    getProposalStatusClass(proposal) {
      const now = new Date();
      const endDate = new Date(proposal.end_date);
      const startDate = new Date(proposal.start_date);
      
      if (now > endDate) {
        return 'bg-secondary';
      } else if (now < startDate) {
        return 'bg-warning';
      } else {
        return 'bg-primary';
      }
    },

    isProposalActive(proposal) {
      const now = new Date();
      const endDate = new Date(proposal.end_date);
      const startDate = new Date(proposal.start_date);
      
      return now >= startDate && now <= endDate;
    },

    isStabilizerProposal(proposal) {
      const subject = proposal.subject.toLowerCase();
      return subject.includes('stabilizer') || 
             subject.includes('hbd stabilizer') || 
             subject.includes('hbd.funder') ||
             (proposal.proposal_id || proposal.id) === 0; // Return proposal is also a stabilizer
    },

    isShortTermProposal(proposal) {
      // Check if proposal duration is less than 31 days (one-off funding)
      const startDate = new Date(proposal.start_date);
      const endDate = new Date(proposal.end_date);
      const durationMs = endDate.getTime() - startDate.getTime();
      const durationDays = durationMs / (1000 * 60 * 60 * 24);
      return durationDays < 31;
    },

    getRemainingDays(proposal) {
      // Get remaining days for a proposal
      const now = new Date();
      const endDate = new Date(proposal.end_date);
      const remainingMs = endDate.getTime() - now.getTime();
      const remainingDays = Math.max(0, remainingMs / (1000 * 60 * 60 * 24));
      return remainingDays;
    },

    getTotalDurationDays(proposal) {
      // Get total duration of proposal in days
      const startDate = new Date(proposal.start_date);
      const endDate = new Date(proposal.end_date);
      const durationMs = endDate.getTime() - startDate.getTime();
      return durationMs / (1000 * 60 * 60 * 24);
    },

    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    },

    formatVotes(votes) {
      // Convert from vests to HP
      // Votes are stored as vests, need to convert to HP using global properties
      const vests = parseFloat(votes) / 1000000; // Convert from micro-vests to vests
      
      if (this.hivestats && this.hivestats.total_vesting_fund_hive && this.hivestats.total_vesting_shares) {
        const totalVestingFund = parseFloat(this.hivestats.total_vesting_fund_hive.split(' ')[0]);
        const totalVestingShares = parseFloat(this.hivestats.total_vesting_shares.split(' ')[0]);
        const hp = (vests * totalVestingFund) / totalVestingShares;
        return this.fancyRounding(hp);
      } else {
        // Fallback approximation if we don't have global properties
        return this.fancyRounding(vests / 1000);
      }
    },

    fancyRounding(num) {
      if (typeof num !== 'number') return '0';
      else if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
      } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
      } else {
        return num.toFixed(1);
      }
    },

    async openProposalModal(proposal) {
      this.selectedProposal = proposal;
      this.showProposalModal = true;
      
      // Update URL for proposal modal
      const newUrl = `/proposals/${proposal.proposal_id || proposal.id}`;
      window.history.pushState({type: 'proposal', id: proposal.proposal_id || proposal.id}, '', newUrl);
      
      // Show Bootstrap modal
      this.$nextTick(() => {
        const modalElement = document.getElementById('proposalModal');
        if (modalElement) {
          const modal = new bootstrap.Modal(modalElement);
          modal.show();
          
          // Handle modal close to restore URL
          modalElement.addEventListener('hidden.bs.modal', () => {
            if (window.history.state && window.history.state.type === 'proposal') {
              window.history.back();
            }
          }, { once: true });
        }
      });
    },

    closeProposalModal() {
      this.showProposalModal = false;
      this.selectedProposal = null;
      this.pendingProposalId = null;
      
      // Force cleanup of any Bootstrap modal remnants
      setTimeout(() => {
        // Remove any lingering backdrop elements
        document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
          backdrop.remove();
        });
        
        // Remove modal-open class from body
        document.body.classList.remove('modal-open');
        
        // Reset body styles that Bootstrap adds
        document.body.style.paddingRight = '';
        document.body.style.overflow = '';
      }, 100);
    },

    dismissModal(modalId) {
      // Properly dismiss Bootstrap modal and clear backdrop
      const modalElement = document.getElementById(modalId);
      if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
          modal.hide();
        }
        
        // Force remove any lingering backdrop and modal-open class
        setTimeout(() => {
          // Remove backdrop elements
          document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
            backdrop.remove();
          });
          
          // Remove modal-open class from body
          document.body.classList.remove('modal-open');
          
          // Reset body styles that Bootstrap adds
          document.body.style.paddingRight = '';
          document.body.style.overflow = '';
        }, 100);
      }
      
      // Also call the appropriate close method
      if (modalId === 'proposalModal') {
        this.closeProposalModal();
      }
    },

    async openBlogModal(author, permlink) {
      try {
        console.log('Opening blog modal for:', author, permlink);
        
        // Fetch the blog post using bridge API for better content
        const response = await fetch(this.hapi, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'bridge.get_post',
            params: {
              author: author,
              permlink: permlink,
              observer: this.account || ""
            },
            id: 1
          })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.error) throw new Error(data.error.message || data.error);
        
        const post = data.result;
        if (post) {
          console.log('Post data received:', post);
          
          // Parse payout values
          const totalPayout = parseFloat(post.pending_payout_value || 0) + 
                             parseFloat(post.total_payout_value || 0);
          
          // Calculate vote counts
          let upVotes = 0;
          let downVotes = 0;
          if (post.active_votes) {
            post.active_votes.forEach(vote => {
              if (parseFloat(vote.rshares) > 0) {
                upVotes++;
              } else if (parseFloat(vote.rshares) < 0) {
                downVotes++;
              }
            });
          }
          
          this.blogPost = {
            ...post,
            url: `${author}/${permlink}`,
            ago: this.timeSince(new Date(post.created)),
            type: 'Blog',
            slider: 10000,
            flag: false,
            upVotes: upVotes,
            downVotes: downVotes,
            edit: false,
            hasVoted: false,
            hasMoreVotes: false,
            contract: {},
            total_payout_value: totalPayout.toFixed(3) + " HBD",
            preview: this.removeMD(post.body || '').substr(0, 250),
            replies: [], // Initialize empty replies array
            // Ensure required fields for DetailVue
            title: post.title || post.root_title || 'Blog Post',
            permlink: post.permlink,
            author: post.author,
            created: post.created,
            body: post.body || '',
            category: post.category || 'blog',
            // Add missing fields that DetailVue might expect
            json_metadata: post.json_metadata || {},
            voter: [], // Initialize voter array
            hideBottom: false,
            hideTitle: false,
            // Critical DetailVue fields
            pending_payout_value: post.pending_payout_value || "0.000 HBD",
            curator_payout_value: post.curator_payout_value || "0.000 HBD",
            children: post.children || 0,
            net_rshares: post.net_rshares || 0,
            max_accepted_payout: post.max_accepted_payout || "1000000.000 HBD",
            percent_hbd: post.percent_hbd || 10000,
            allow_replies: post.allow_replies !== false,
            allow_votes: post.allow_votes !== false,
            allow_curation_rewards: post.allow_curation_rewards !== false,
            // Add calculated reputation for DetailVue  
            rep: post.author_reputation
          };
          
          console.log('Blog post prepared with all fields:', this.blogPost);
          console.log('DetailVue critical fields check:', {
            title: this.blogPost.title,
            author: this.blogPost.author,
            body: !!this.blogPost.body,
            post_select: !!this.postSelect,
            active_votes: !!this.blogPost.active_votes
          });
          
          // Load replies if the post has comments BEFORE showing modal
          if (post.children > 0) {
            console.log('Loading replies...');
            await this.getReplies(author, permlink);
          }
          
          console.log('Final blogPost with replies:', this.blogPost);
          
          // Update URL for blog modal
          const newUrl = `/blog/@${author}/${permlink}`;
          window.history.pushState({type: 'blog', author, permlink}, '', newUrl);
          
          // Use Bootstrap 5 modal for blog - wait for data to be ready
          await this.$nextTick();
          
          console.log('Setting up modal...');
          const modalElement = document.getElementById('blogModal');
          if (modalElement) {
            console.log('Modal element found, creating modal...');
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
            
            // Handle modal close to restore URL
            modalElement.addEventListener('hidden.bs.modal', () => {
              console.log('Modal hidden');
              if (window.history.state && window.history.state.type === 'blog') {
                window.history.back();
              }
              this.blogPost = null;
            }, { once: true });
          } else {
            console.error('Modal element not found!');
          }
        } else {
          console.error('Blog post not found');
        }
        
      } catch (error) {
        console.error('Error fetching blog post:', error);
      }
    },

    timeSince(date) {
      const seconds = Math.floor((new Date() - date) / 1000);
      let interval = seconds / 31536000;
      if (interval > 1) return Math.floor(interval) + " years ago";
      interval = seconds / 2592000;
      if (interval > 1) return Math.floor(interval) + " months ago";
      interval = seconds / 86400;
      if (interval > 1) return Math.floor(interval) + " days ago";
      interval = seconds / 3600;
      if (interval > 1) return Math.floor(interval) + " hours ago";
      interval = seconds / 60;
      if (interval > 1) return Math.floor(interval) + " minutes ago";
      return Math.floor(seconds) + " seconds ago";
    },

    handleUrlRouting() {
      // Handle initial URL routing for proposals and blog posts
      const path = window.location.pathname;
      
      if (path.startsWith('/proposals/')) {
        const proposalId = parseInt(path.split('/')[2]);
        if (proposalId && proposalId !== 0) { // Don't open modal for return proposal
          // Show modal immediately with pending state
          this.pendingProposalId = proposalId;
          this.showProposalModal = true;
          
          // If proposals are already loaded, try to find and show the proposal
          if (this.proposals.length > 0) {
            const proposal = this.proposals.find(p => (p.proposal_id || p.id) === proposalId);
            if (proposal) {
              this.selectedProposal = proposal;
              this.pendingProposalId = null;
            }
          }
          
          // Open the Bootstrap modal
          this.$nextTick(() => {
            const modalElement = document.getElementById('proposalModal');
            if (modalElement) {
              const modal = new bootstrap.Modal(modalElement);
              modal.show();
              
              // Add event listener for when the modal is hidden to clean up properly
              modalElement.addEventListener('hidden.bs.modal', () => {
                this.closeProposalModal();
              }, { once: true });
            }
          });
          
          // If proposals aren't loaded yet, the modal will show a spinner
          // and the proposal will be set when proposals finish loading
        }
      } else if (path.startsWith('/blog/@')) {
        const parts = path.split('/');
        if (parts.length >= 4) {
          const author = parts[2].substring(1); // Remove @
          const permlink = parts[3];
          setTimeout(() => this.openBlogModal(author, permlink), 100);
        }
      }
    },

    getBudgetImpact(proposal) {
      const dailyPay = parseFloat(proposal.daily_pay?.amount || 0) / 1000;
      const totalCost = dailyPay * 365; // Always show annual/total cost
      
      // Include ninja grant and beneficiary rewards in total inflow (matching main dashboard)
      const totalDailyInflow = this.daoFund.dailyInflow + this.daoFund.ninjaGrant + this.daoFund.beneficiaryRewards;
      const yearlyInflow = totalDailyInflow * 365;
      
      return {
        daily: dailyPay,
        yearly: totalCost,
        percentOfInflow: yearlyInflow > 0 ? (totalCost / yearlyInflow) * 100 : 0,
        yearlyInflow: yearlyInflow
      };
    },

    getProposalRankingImpact(proposal) {
      // Calculate what would happen if user votes/unvotes
      const currentVotes = parseFloat(proposal.total_votes);
      const userVoteWeight = this.getUserVoteWeight(); // Approximate user HP
      const currentlyVoting = this.getUserVote(proposal.id);
      
      // Simulate vote change
      const newVotes = currentlyVoting ? 
        currentVotes - userVoteWeight : 
        currentVotes + userVoteWeight;
      
      // Find current position (only consider active proposals)
      const activeProposals = this.proposals.filter(p => this.isProposalActive(p));
      const sortedProposals = [...activeProposals].sort((a, b) => 
        parseFloat(b.total_votes) - parseFloat(a.total_votes)
      );
      
      const currentPosition = sortedProposals.findIndex(p => (p.proposal_id || p.id) === (proposal.proposal_id || proposal.id)) + 1;
      
      // Simulate new position
      const simulatedProposals = sortedProposals.map(p => ({
        ...p,
        total_votes: (p.proposal_id || p.id) === (proposal.proposal_id || proposal.id) ? newVotes.toString() : p.total_votes
      })).sort((a, b) => parseFloat(b.total_votes) - parseFloat(a.total_votes));
      
      const newPosition = simulatedProposals.findIndex(p => (p.proposal_id || p.id) === (proposal.proposal_id || proposal.id)) + 1;
      const positionChange = currentPosition - newPosition;
      
      // Check funding status change
      const currentlyFunded = this.isProposalFunded(proposal);
      // Simulate funding with new vote counts
      let cumulativePayout = 0;
      let wouldBeFunded = false;
      
      for (const p of simulatedProposals) {
        const dailyPay = parseFloat(p.daily_pay?.amount || 0) / 1000;
        if ((p.proposal_id || p.id) === (proposal.proposal_id || proposal.id)) {
          wouldBeFunded = cumulativePayout + dailyPay <= this.daoFund.available;
          break;
        }
        cumulativePayout += dailyPay;
        if (cumulativePayout > this.daoFund.available) break;
      }
      
      return {
        positionChange,
        newPosition,
        currentPosition,
        fundingStatusChange: currentlyFunded !== wouldBeFunded,
        wouldBeFunded,
        currentlyFunded
      };
    },

    getUserVoteWeight() {
      // Rough estimate of user's vote weight in vests
      // This would ideally come from user's account data
      return 1000000000; // Placeholder - 1M vests = ~500 HP
    },

    getUserVotingPower() {
      // Get user's actual voting power from accountinfo if available
      if (this.accountinfo && this.hivestats) {
        try {
          const totalVests = 
            parseFloat(this.accountinfo.vesting_shares) +
            parseFloat(this.accountinfo.received_vesting_shares) -
            parseFloat(this.accountinfo.delegated_vesting_shares);
          
          // Convert vests to voting power (approximation for proposal voting)
          // For proposal voting, we use the full vest amount
          return totalVests * 1000000; // Convert to micro-vests
        } catch (error) {
          console.error('Error calculating user voting power:', error);
        }
      }
      
      // Fallback estimate if we don't have account info
      return 50000000000; // ~25k HP in micro-vests
    },

    getThresholdImpactRange() {
      const userVotingPower = this.getUserVotingPower();
      
      // Calculate the range of votes the user can impact
      // This is based on their voting power and the current threshold
      const currentThreshold = this.proposalThreshold || 0;
      
      return {
        min: Math.max(0, currentThreshold - userVotingPower),
        max: currentThreshold + userVotingPower
      };
    },

    getProposalsInRange() {
      // Find proposals that could be pushed over or under the threshold by user's vote
      if (!this.proposals.length || !this.account) return [];
      
      const userVotingPower = this.getUserVotingPower();
      const range = this.getThresholdImpactRange();
      
      return this.proposals.filter(proposal => {
        if (!this.isProposalActive(proposal)) return false;
        
        const proposalVotes = parseFloat(proposal.total_votes);
        const currentlyVoting = this.getUserVote(proposal.proposal_id || proposal.id);
        
        // Calculate what the proposal's votes would be with/without user's vote
        const votesWithUserSupport = currentlyVoting ? 
          proposalVotes : proposalVotes + userVotingPower;
        const votesWithoutUserSupport = currentlyVoting ? 
          proposalVotes - userVotingPower : proposalVotes;
        
        // Check if user's vote could change funding status
        const currentlyFunded = this.isProposalFunded(proposal);
        const wouldBeFundedWithSupport = votesWithUserSupport >= this.proposalThreshold;
        const wouldBeFundedWithoutSupport = votesWithoutUserSupport >= this.proposalThreshold;
        
        // Include proposals where user's vote could change funding status
        return currentlyFunded !== wouldBeFundedWithSupport || 
               currentlyFunded !== wouldBeFundedWithoutSupport ||
               // Or proposals within their voting power range
               (proposalVotes >= range.min && proposalVotes <= range.max);
      });
    },

    getVoteTooltip(proposal, supporting) {
      if (!this.account) return '';
      
      const impact = this.getProposalRankingImpact(proposal);
      const action = supporting ? 'Supporting' : 'Removing support from';
      let tooltip = `${action} this proposal would `;
      
      if (impact.positionChange === 0) {
        tooltip += 'not change its ranking';
      } else if (impact.positionChange > 0) {
        tooltip += `move it up ${impact.positionChange} place${impact.positionChange > 1 ? 's' : ''}`;
      } else {
        tooltip += `move it down ${Math.abs(impact.positionChange)} place${Math.abs(impact.positionChange) > 1 ? 's' : ''}`;
      }
      
      tooltip += ` (${impact.currentPosition} → ${impact.newPosition})`;
      
      if (impact.fundingStatusChange) {
        if (supporting && impact.wouldBeFunded) {
          tooltip += ' and WOULD make it funded';
        } else if (!supporting && !impact.wouldBeFunded) {
          tooltip += ' and would make it UNFUNDED';
        }
      } else {
        tooltip += ' with no funding status change';
      }
      
      return tooltip;
    },

    calculateHealthStats() {
      if (!this.proposals.length) return;
      
      // Get funded proposals (only active proposals can be funded)
      const activeProposals = this.proposals.filter(p => this.isProposalActive(p));
      const fundedProposals = activeProposals.filter(p => this.isProposalFunded(p));
      
      // Calculate total funded outflows
      const totalFunded = fundedProposals.reduce((sum, p) => 
        sum + (parseFloat(p.daily_pay?.amount || 0) / 1000), 0);
      
      // Exclude proposal 0
      const totalFundedNoZero = fundedProposals
        .filter(p => p.proposal_id !== 0)
        .reduce((sum, p) => sum + (parseFloat(p.daily_pay?.amount || 0) / 1000), 0);
      
              // Exclude stabilizer proposals
        const totalFundedNoStabilizer = fundedProposals
          .filter(p => !this.isStabilizerProposal(p))
          .reduce((sum, p) => sum + (parseFloat(p.daily_pay?.amount || 0) / 1000), 0);
        
        // User voted proposals - ONLY ACTIVE PROPOSALS
        const userVotedProposals = this.proposals.filter(p => 
          this.getUserVote(p.proposal_id || p.id) && this.isProposalActive(p));
        
        const userVotedTotal = userVotedProposals.reduce((sum, p) => 
          sum + (parseFloat(p.daily_pay?.amount || 0) / 1000), 0);
        
        const userVotedNoZero = userVotedProposals
          .filter(p => (p.proposal_id || p.id) !== 0)
          .reduce((sum, p) => sum + (parseFloat(p.daily_pay?.amount || 0) / 1000), 0);
        
        const userVotedNoStabilizer = userVotedProposals
          .filter(p => !this.isStabilizerProposal(p))
          .reduce((sum, p) => sum + (parseFloat(p.daily_pay?.amount || 0) / 1000), 0);
      
      this.healthStats = {
        totalFundedOutflows: totalFunded,
        totalFundedOutflowsNoZero: totalFundedNoZero,
        totalFundedOutflowsNoStabilizer: totalFundedNoStabilizer,
        userVotedOutflows: userVotedTotal,
        userVotedOutflowsNoZero: userVotedNoZero,
        userVotedOutflowsNoStabilizer: userVotedNoStabilizer
      };
    },

    // Proposal Management Methods
    openCreateProposalModal() {
      // Reset form
      this.createProposalForm = {
        subject: '',
        receiver: this.account,
        start_date: this.getMinStartDate(),
        end_date: '',
        daily_pay: '',
        permlink: ''
      };
      const modal = new bootstrap.Modal(document.getElementById('createProposalModal'));
      modal.show();
    },

    closeCreateProposalModal() {
      this.createProposalForm = {
        subject: '',
        receiver: '',
        start_date: '',
        end_date: '',
        daily_pay: '',
        permlink: '',
        permlinkValid: null
      };
    },

    openUpdateProposalModal(proposal) {
      // Populate form with current proposal data
      this.updateProposalForm = {
        id: proposal.id,
        subject: proposal.subject,
        daily_pay: proposal.daily_pay.amount / 1000, // Convert from satoshi to HBD
        original_daily_pay: proposal.daily_pay.amount / 1000, // Store original for validation
        permlink: proposal.permlink,
        permlinkValid: null // Reset validation state
      };
      const modal = new bootstrap.Modal(document.getElementById('updateProposalModal'));
      modal.show();
    },

    closeUpdateProposalModal() {
      this.updateProposalForm = {
        id: null,
        subject: '',
        daily_pay: '',
        original_daily_pay: 0,
        permlink: '',
        permlinkValid: null
      };
    },

    getMinStartDate() {
      // Start date must be tomorrow or later
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    },

    getTomorrowDate() {
      // For update modal - can only extend end date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    },

    calculateDuration() {
      if (!this.createProposalForm.start_date || !this.createProposalForm.end_date) {
        return 0;
      }
      const start = new Date(this.createProposalForm.start_date);
      const end = new Date(this.createProposalForm.end_date);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    },

    canCreateProposal() {
      return this.createProposalForm.subject.trim() &&
             this.createProposalForm.receiver.trim() &&
             this.createProposalForm.start_date &&
             this.createProposalForm.end_date &&
             this.createProposalForm.daily_pay > 0 &&
             this.createProposalForm.permlink.trim() &&
             this.account;
    },

    canUpdateProposal() {
      return this.updateProposalForm.subject.trim() &&
             this.updateProposalForm.daily_pay > 0 &&
             this.updateProposalForm.daily_pay <= this.updateProposalForm.original_daily_pay && // Can only lower or keep same
             this.updateProposalForm.permlink.trim() &&
             this.account;
    },

    async createProposal() {
      if (!this.canCreateProposal()) return;
      
      this.creatingProposal = true;

      const op = {
        type: "raw",
        op: [
          [
            "create_proposal",
            {
              creator: this.account,
              receiver: this.createProposalForm.receiver,
              start_date: this.createProposalForm.start_date + "T00:00:00",
              end_date: this.createProposalForm.end_date + "T23:59:59",
              daily_pay: {
                amount: Math.floor(this.createProposalForm.daily_pay * 1000).toString(),
                precision: 3,
                nai: "@@000000013" // HBD NAI
              },
              subject: this.createProposalForm.subject,
              permlink: this.createProposalForm.permlink,
              extensions: []
            }
          ]
        ],
        key: "active",
        msg: `Creating proposal: ${this.createProposalForm.subject}`,
        txid: `create_proposal_${Date.now()}`,
        api: "https://api.hive.blog",
        delay: 250,
        ops: ["loadProposals", "resetCreateProposalState"]
      };

      this.toSign = op;
      
      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('createProposalModal'));
      modal.hide();
    },

    async updateProposal() {
      if (!this.canUpdateProposal()) return;
      
      this.updatingProposal = this.updateProposalForm.id;

      const op = {
        type: "raw",
        op: [
          [
            "update_proposal",
            {
              proposal_id: this.updateProposalForm.id,
              creator: this.account,
              daily_pay: {
                amount: Math.floor(this.updateProposalForm.daily_pay * 1000).toString(),
                precision: 3,
                nai: "@@000000013" // HBD NAI
              },
              subject: this.updateProposalForm.subject,
              permlink: this.updateProposalForm.permlink
            }
          ]
        ],
        key: "active",
        msg: `Updating proposal #${this.updateProposalForm.id}: ${this.updateProposalForm.subject}`,
        txid: `update_proposal_${this.updateProposalForm.id}_${Date.now()}`,
        api: "https://api.hive.blog",
        delay: 250,
        ops: ["loadProposals", "resetUpdateProposalState"]
      };

      this.toSign = op;
      
      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('updateProposalModal'));
      modal.hide();
    },

    async removeProposal(proposalId) {
      if (!this.account || !proposalId) return;
      
      if (!confirm('Are you sure you want to cancel this proposal? This action cannot be undone.')) {
        return;
      }
      
      this.removingProposal = proposalId;

      const op = {
        type: "raw",
        op: [
          [
            "remove_proposal",
            {
              proposal_id: proposalId,
              proposal_owner: this.account,
              extensions: []
            }
          ]
        ],
        key: "active",
        msg: `Canceling proposal #${proposalId}`,
        txid: `remove_proposal_${proposalId}_${Date.now()}`,
        api: "https://api.hive.blog",
        delay: 250,
        ops: ["loadProposals", "resetRemoveProposalState"]
      };

      this.toSign = op;
    },

    resetCreateProposalState() {
      this.creatingProposal = false;
    },

    resetUpdateProposalState() {
      this.updatingProposal = null;
    },

    resetRemoveProposalState() {
      this.removingProposal = null;
    },

    async validatePermlink(permlink, creator) {
      if (!permlink || !creator) return false;
      
      try {
        const response = await fetch(`https://api.hive.blog`, {
          method: 'POST',
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'bridge.get_post',
            params: {
              author: creator,
              permlink: permlink
            },
            id: 1
          }),
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        const result = await response.json();
        return result.result && result.result.author; // Post exists if author is returned
      } catch (error) {
        console.error('Error validating permlink:', error);
        return false;
      }
    },

    getProposalCreationCost() {
      // 10 HBD for up to 30 days, then 1 HBD per additional day
      const duration = this.calculateDuration();
      if (duration <= 30) {
        return 10.000;
      } else {
        return 10.000 + (duration - 30);
      }
    },

    // Supporters functionality
    async openSupportersModal(proposal) {
      this.selectedProposalForSupporters = proposal;
      this.showSupportersModal = true;
      this.proposalSupporters = [];
      
      // Immediately show modal and then load supporters
      this.$nextTick(() => {
        const modalElement = document.getElementById('supportersModal');
        if (modalElement) {
          const modal = new bootstrap.Modal(modalElement);
          modal.show();
        }
      });
      
      // Load supporters data
      await this.fetchProposalSupporters(proposal.proposal_id || proposal.id);
    },

    closeSupportersModal() {
      this.showSupportersModal = false;
      this.selectedProposalForSupporters = null;
      this.proposalSupporters = [];
      this.loadingSupporters = false;
    },

    async fetchProposalSupporters(proposalId) {
      this.loadingSupporters = true;
      
      try {
        // Correct API call structure according to Hive documentation
        const response = await fetch(this.hapi, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'database_api.list_proposal_votes',
            params: {
              start: [proposalId, ""],
              limit: 1000,
              order: 'by_proposal_voter',
              order_direction: 'ascending',
              status: 'all'
            },
            id: 1
          })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.error) throw new Error(data.error.message || 'API error fetching supporters');
        
        console.log('Proposal votes response:', data); // Debug log
        
        const votes = data.result?.proposal_votes || [];
        
        // Filter to only supporters for this specific proposal and exclude the proposal creator
        const supporters = votes.filter(vote => {
          const proposalIdMatch = vote.proposal?.id === proposalId;
          const isNotCreator = vote.voter !== this.selectedProposalForSupporters?.creator;
          return proposalIdMatch && isNotCreator;
        });
        
        console.log('Filtered supporters:', supporters); // Debug log
        
        // Get voter governance HP for each supporter
        if (supporters.length > 0) {
          const voterNames = supporters.map(vote => vote.voter);
          const voterAccounts = await this.getVoterAccounts(voterNames);
          
          // Combine vote data with account data and calculate HP
          this.proposalSupporters = supporters.map(vote => {
            const account = voterAccounts[vote.voter];
            const votingPower = this.calculateVotingPower(account);
            
            return {
              voter: vote.voter,
              governanceHP: votingPower,
              account: account
            };
          }).sort((a, b) => b.governanceHP - a.governanceHP); // Sort by HP descending
        } else {
          this.proposalSupporters = [];
        }
        
      } catch (error) {
        console.error('Error fetching proposal supporters:', error);
        this.proposalSupporters = [];
      } finally {
        this.loadingSupporters = false;
      }
    },

    async getVoterAccounts(voterNames) {
      try {
        const accountsObj = {};
        
        // Process accounts in batches of 100 (API limit)
        for (let i = 0; i < voterNames.length; i += 100) {
          const batch = voterNames.slice(i, i + 100);
          
          const response = await fetch(this.hapi, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'condenser_api.get_accounts',
              params: [batch],
              id: 1
            })
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          if (data.error) throw new Error(data.error.message || 'API error fetching accounts');
          
          const accounts = data.result || [];
          
          // Convert array to object keyed by account name
          accounts.forEach(account => {
            accountsObj[account.name] = account;
          });
          
          // Small delay between batches to be API-friendly
          if (i + 100 < voterNames.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
        
        console.log(`Fetched ${Object.keys(accountsObj).length} accounts in ${Math.ceil(voterNames.length / 100)} batches`);
        
        return accountsObj;
      } catch (error) {
        console.error('Error fetching voter accounts:', error);
        return {};
      }
    },

    calculateVotingPower(account) {
      if (!account || !this.hivestats) return 0;
      
      try {
        // If account has a proxy set, their voting power is 0 (proxy votes for them)
        if (account.proxy && account.proxy !== '') {
          return 0;
        }
        
        // Get base vesting shares
        const vestingShares = parseFloat(account.vesting_shares.split(' ')[0]);
        
        // Add proxied votes if they exist
        let proxiedVotes = 0;
        if (account.proxied_vsf_votes && Array.isArray(account.proxied_vsf_votes)) {
          // Sum all proxied vote weights: proxied_vsf_votes[0] + [1] + [2] + [3]
          // Note: proxied_vsf_votes are in VSF format and need to be divided by 1,000,000 to convert to vests
          const totalProxiedVSF = account.proxied_vsf_votes.reduce((sum, votes) => {
            return sum + parseFloat(votes);
          }, 0);
          proxiedVotes = totalProxiedVSF / 1000000; // Convert VSF to vests
        }
        
        // Calculate total effective vesting shares
        // Formula: vesting_shares + proxied_vsf_votes (converted from VSF to vests)
        const totalVests = vestingShares + proxiedVotes;
        
        // Convert to HP using global properties
        if (this.hivestats.total_vesting_fund_hive && this.hivestats.total_vesting_shares) {
          const totalVestingFund = parseInt(this.hivestats.total_vesting_fund_hive.split(' ')[0]);
          const totalVestingShares = parseFloat(this.hivestats.total_vesting_shares.split(' ')[0]);
          const hp = (totalVests * totalVestingFund) / totalVestingShares;
          return Math.max(0, hp); // Ensure non-negative
        }
        
        // Fallback approximation
        return Math.max(0, totalVests / 1000);
      } catch (error) {
        console.error('Error calculating voting power for account:', account?.name, error);
        return 0;
      }
    },

    calculateGovernanceHP(account) {
      // Alias for backward compatibility
      return this.calculateVotingPower(account);
    },

    getSupporterCount(proposal) {
      // For display in the UI, we can estimate based on total votes
      // This is an approximation since we don't have the full supporter list loaded by default
      const totalVotes = parseFloat(proposal.total_votes);
      const avgVoteWeight = 50000; // Rough average HP per voter (will vary widely)
      return Math.round(totalVotes / (avgVoteWeight * 1000000)); // Convert HP to vests
    },

    openDirectMessage(username) {
      // Open a new window/tab to send a direct message to the supporter
      // This could be extended to integrate with Hive messaging systems
      const url = `/@${username}`;
      window.open(url, '_blank');
    },

    exportSupportersList() {
      if (!this.selectedProposalForSupporters || !this.proposalSupporters.length) return;
      
      // Create CSV content
      const headers = ['Rank', 'Account', 'Own Vests', 'Proxied Vests', 'Total HP', 'Percentage of Total'];
      const csvContent = [
        headers.join(','),
        ...this.proposalSupporters.map((supporter, index) => [
          index + 1,
          supporter.voter,
          this.formatVests(this.getOwnVests(supporter.account)),
          this.formatVests(this.getProxiedVests(supporter.account)),
          supporter.governanceHP.toFixed(2),
          this.getSupporterPercentage(supporter) + '%'
        ].join(','))
      ].join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `proposal_${this.selectedProposalForSupporters.proposal_id || this.selectedProposalForSupporters.id}_supporters.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    },

    // Support bar visualization methods
    getSupporterPercentage(supporter) {
      if (!supporter || !this.selectedProposalForSupporters || supporter.governanceHP <= 0) return '0.00';
      
      // Calculate total HP of all supporters
      const totalSupportersHP = this.proposalSupporters.reduce((sum, s) => sum + s.governanceHP, 0);
      
      if (totalSupportersHP <= 0) return '0.00';
      
      // Calculate percentage based on supporter's HP vs total supporters HP
      return ((supporter.governanceHP / totalSupportersHP) * 100).toFixed(2);
    },

    getSignificantSupporters() {
      return this.proposalSupporters.filter(supporter => {
        const percentage = parseFloat(this.getSupporterPercentage(supporter));
        return percentage >= 1.0; // 1% or more
      });
    },

    getSignificantSupportersPercentage() {
      const significantSupporters = this.getSignificantSupporters();
      return significantSupporters.reduce((total, supporter) => {
        return total + parseFloat(this.getSupporterPercentage(supporter));
      }, 0);
    },

    getRemainingPercentage() {
      return Math.max(0, 100 - this.getSignificantSupportersPercentage());
    },

    getRemainingHP() {
      const significantSupporters = this.getSignificantSupporters();
      const significantHP = significantSupporters.reduce((total, supporter) => {
        return total + supporter.governanceHP;
      }, 0);
      const totalHP = this.proposalSupporters.reduce((total, supporter) => {
        return total + supporter.governanceHP;
      }, 0);
      return Math.max(0, totalHP - significantHP);
    },

    getSupporterBarStyle(supporter, index) {
      const percentage = parseFloat(this.getSupporterPercentage(supporter));
      const significantSupporters = this.getSignificantSupporters();
      
      // Calculate left position based on previous supporters
      const leftPercentage = significantSupporters.slice(0, index).reduce((total, prevSupporter) => {
        return total + parseFloat(this.getSupporterPercentage(prevSupporter));
      }, 0);
      
      // Generate a distinct color for each supporter
      const colors = [
        'linear-gradient(45deg, #007bff, #0056b3)', // Blue
        'linear-gradient(45deg, #28a745, #1e7e34)', // Green
        'linear-gradient(45deg, #ffc107, #e0a800)', // Yellow
        'linear-gradient(45deg, #dc3545, #bd2130)', // Red
        'linear-gradient(45deg, #6f42c1, #563d7c)', // Purple
        'linear-gradient(45deg, #fd7e14, #e55100)', // Orange
        'linear-gradient(45deg, #20c997, #17a2b8)', // Teal
        'linear-gradient(45deg, #e83e8c, #d73975)', // Pink
        'linear-gradient(45deg, #6c757d, #545b62)', // Gray
        'linear-gradient(45deg, #17a2b8, #138496)'  // Info
      ];
      
      const colorIndex = index % colors.length;
      const background = colors[colorIndex];
      
      return `left: ${leftPercentage}%; width: ${percentage}%; background: ${background}; border-right: 1px solid rgba(255,255,255,0.2);`;
    },

    // Helper methods for vesting shares breakdown
    getOwnVests(account) {
      if (!account) return 0;
      try {
        return parseFloat(account.vesting_shares.split(' ')[0]);
      } catch (error) {
        return 0;
      }
    },

    getProxiedVests(account) {
      if (!account || !account.proxied_vsf_votes) return 0;
      try {
        // Sum all proxied VSF votes and convert to vests (divide by 1,000,000)
        const totalProxiedVSF = account.proxied_vsf_votes.reduce((sum, votes) => {
          return sum + parseFloat(votes);
        }, 0);
        return totalProxiedVSF / 1000000;
      } catch (error) {
        return 0;
      }
    },

    // Format vests with appropriate units (B, M, K, or just number)
    formatVests(vests) {
      if (vests >= 1000000000) {
        return this.fancyRounding(vests / 1000000000) + 'B';
      } else if (vests >= 1000000) {
        return this.fancyRounding(vests / 1000000) + 'M';
      } else if (vests >= 1000) {
        return this.fancyRounding(vests / 1000) + 'K';
      } else {
        return this.fancyRounding(vests);
      }
    },

    getProjectedValues(timeframe = 365) {
      const projected = this.calculateProjectedValues(timeframe);
      return projected;
    },

    // New method to get projected values with proposal impact
    getProjectedValuesWithProposalImpact(timeframe = 365) {
      const baseProjected = this.getProjectedValues(timeframe);
      
      // Check if we have any analysis active
      if (!this.selectedProposalForAnalysis && !this.customAnalysis.active) {
        return baseProjected;
      }
      
      let impactMultiplier = 0;
      let impactData = {};
      
      // Handle proposal analysis
      if (this.selectedProposalForAnalysis) {
        const proposal = this.selectedProposalForAnalysis;
        const proposalDailyPay = parseFloat(proposal.daily_pay?.amount || 0) / 1000;
        const isCurrentlyFunded = this.isProposalFunded(proposal);
        const isShortTerm = this.isShortTermProposal(proposal);
        
        let dailyChange, annualChange, analysisType;
        
        if (isShortTerm) {
          // For short-term proposals, calculate impact based on remaining duration only
          const remainingDays = this.getRemainingDays(proposal);
          const totalDuration = this.getTotalDurationDays(proposal);
          
          dailyChange = isCurrentlyFunded ? -proposalDailyPay : proposalDailyPay;
          
          // Annual change is based on remaining time, not full year
          const remainingImpact = dailyChange * remainingDays;
          annualChange = remainingImpact; // Total remaining impact, not annualized
          
          analysisType = isCurrentlyFunded ? 'removing' : 'adding';
          
          impactData.proposalImpact = {
            dailyChange: dailyChange,
            annualChange: annualChange,
            action: analysisType,
            proposalTitle: proposal.subject,
            isShortTerm: true,
            remainingDays: remainingDays,
            totalDuration: totalDuration,
            remainingImpact: remainingImpact
          };
          
          // For chart calculation, use daily rate only for remaining days
          impactMultiplier += dailyChange;
        } else {
          // For long-term proposals, treat as perpetual funding
          dailyChange = isCurrentlyFunded ? -proposalDailyPay : proposalDailyPay;
          annualChange = dailyChange * 365;
          
          impactMultiplier += dailyChange;
          
          impactData.proposalImpact = {
            dailyChange: dailyChange,
            annualChange: annualChange,
            action: isCurrentlyFunded ? 'removing' : 'adding',
            proposalTitle: proposal.subject,
            isShortTerm: false
          };
        }
      }
      
      // Handle custom analysis
      if (this.customAnalysis.active) {
        const customImpact = this.customAnalysis.isAddition ? 
          this.customAnalysis.dailyAmount : 
          -this.customAnalysis.dailyAmount;
        
        impactMultiplier += customImpact;
        
        impactData.customImpact = {
          dailyChange: customImpact,
          annualChange: customImpact * 365,
          action: this.customAnalysis.isAddition ? 'adding' : 'removing',
          description: this.customAnalysis.description
        };
      }
      
      // Calculate the actual annual impact (short-term proposals don't get full annual impact)
      let annualImpactMultiplier = impactMultiplier;
      
      // If we have a short-term proposal, calculate its actual annual impact
      if (this.selectedProposalForAnalysis && impactData.proposalImpact && impactData.proposalImpact.isShortTerm) {
        const proposalDailyPay = parseFloat(this.selectedProposalForAnalysis.daily_pay?.amount || 0) / 1000;
        const isCurrentlyFunded = this.isProposalFunded(this.selectedProposalForAnalysis);
        const remainingDays = this.getRemainingDays(this.selectedProposalForAnalysis);
        
        // Calculate what the annual impact actually is (remaining days / 365)
        const dailyChange = isCurrentlyFunded ? -proposalDailyPay : proposalDailyPay;
        const actualAnnualImpact = (dailyChange * remainingDays) / 365;
        
        // Adjust the impact multiplier for annual calculations
        annualImpactMultiplier = actualAnnualImpact;
      }
      
      return {
        ...baseProjected,
        // Daily outflow includes all impacts
        projectedTotalOutflow: this.healthStats.totalFundedOutflowsNoStabilizer + impactMultiplier,
        projectedTotalOutflowWithZero: this.healthStats.totalFundedOutflowsNoZero + impactMultiplier,
        projectedTotalOutflowAll: this.healthStats.totalFundedOutflows + impactMultiplier,
        // Annual-adjusted values for display
        projectedTotalOutflowAnnual: this.healthStats.totalFundedOutflowsNoStabilizer + annualImpactMultiplier,
        projectedTotalOutflowAllAnnual: this.healthStats.totalFundedOutflows + annualImpactMultiplier,
        ...impactData
      };
    },

    calculateProjectedValues(timeframe = 365) {
      const currentPrice = this.hiveprice.hive.usd;
      const growthMultiplier = 1 + (this.priceGrowthRate / 100);
      const projectedPrice = currentPrice * Math.pow(growthMultiplier, timeframe / 365);
      
      const projectedDailyInflow = this.daoFund.dailyInflow * (projectedPrice / currentPrice);
      const projectedNinjaGrant = this.daoFund.ninjaGrant * (projectedPrice / currentPrice);
      const projectedBeneficiaryRewards = this.daoFund.beneficiaryRewards * (projectedPrice / currentPrice);
      
      return {
        projectedPrice,
        projectedDailyInflow,
        projectedNinjaGrant,
        projectedBeneficiaryRewards,
        projectedTotalInflow: projectedDailyInflow + projectedNinjaGrant + projectedBeneficiaryRewards,
        timeframe
      };
    },

    calculateEquilibriumYears() {
      // Calculate how many years until Hive Fund treasury balance drops to 150x daily inflow
      // (equilibrium target band is 75x-150x, with 100x being ideal)
      // accounting for depleting Hive balance (ninja grant decreases over time)
      if (!this.daoFund || !this.hiveprice?.hive?.usd || !this.healthStats) {
        return null;
      }
      
      const currentPrice = this.hiveprice.hive.usd;
      const currentTreasury = this.daoFund.treasury;
      const currentHiveBalance = this.daoFund.hiveBalance;
      const dailyRewardsInflow = this.daoFund.dailyInflow;
      const dailyOutflow = this.healthStats.totalFundedOutflowsNoStabilizer;
      const priceGrowthRate = this.priceGrowthRate / 100;
      
      // Check current daily inflow
      const currentTotalDailyInflow = this.daoFund.dailyInflow + this.daoFund.ninjaGrant + this.daoFund.beneficiaryRewards;
      const currentRatio = currentTreasury / currentTotalDailyInflow;
      
      // If we're already at or below 150x, we're in the target band
      if (currentRatio <= 150) {
        return 0;
      }
      
      // Simulate year by year to find when treasury drops to 150x daily inflow
      let treasury = currentTreasury;
      let hiveBalance = currentHiveBalance;
      const priceGrowthDaily = Math.pow(1 + priceGrowthRate, 1/365);
      const rewardFundGrowthDaily = Math.pow(1.08, 1/365); // 8% yearly growth
      
      for (let years = 0; years < 100; years++) {
        // Simulate this year day by day
        for (let day = 0; day < 365; day++) {
          const totalDays = years * 365 + day;
          
          // Calculate projected values for this day
          const projectedPrice = currentPrice * Math.pow(priceGrowthDaily, totalDays);
          const projectedRewardInflow = dailyRewardsInflow * Math.pow(rewardFundGrowthDaily, totalDays) * (projectedPrice / currentPrice);
          
          // Ninja grant depletes the Hive balance at 0.05% per day
          const dailyNinjaGrant = (hiveBalance * 0.0005) * projectedPrice;
          hiveBalance -= hiveBalance * 0.0005; // Reduce Hive balance
          
          // Beneficiary rewards scale with price
          const dailyBeneficiaryRewards = (200000 / 30) * projectedPrice;
          
          const totalDailyInflow = projectedRewardInflow + dailyNinjaGrant + dailyBeneficiaryRewards;
          treasury += totalDailyInflow - dailyOutflow;
          
          // Check if treasury has dropped to 150x daily inflow (sustainable level)
          if (treasury <= totalDailyInflow * 150) {
            return years + (day / 365);
          }
          
          // Early exit if treasury goes negative
          if (treasury < 0) {
            return null;
          }
        }
      }
      
      return null; // Didn't drop to target in 100 years
    },
    
    calculateSpendingReductionNeeded() {
      // Calculate how much daily spending needs to be reduced to reach sustainability
      if (!this.daoFund || !this.hiveprice?.hive?.usd || !this.healthStats) {
        return null;
      }
      
      const currentPrice = this.hiveprice.hive.usd;
      const currentTreasury = this.daoFund.treasury;
      const currentHiveBalance = this.daoFund.hiveBalance;
      const dailyRewardsInflow = this.daoFund.dailyInflow;
      const currentDailyOutflow = this.healthStats.totalFundedOutflowsNoStabilizer;
      const priceGrowthRate = this.priceGrowthRate / 100;
      
      // Calculate average daily inflow over 10 years (accounting for depleting ninja grant)
      let totalInflow = 0;
      let hiveBalance = currentHiveBalance;
      const priceGrowthDaily = Math.pow(1 + priceGrowthRate, 1/365);
      const rewardFundGrowthDaily = Math.pow(1.08, 1/365);
      
      for (let day = 0; day < 365 * 10; day++) {
        const projectedPrice = currentPrice * Math.pow(priceGrowthDaily, day);
        const projectedRewardInflow = dailyRewardsInflow * Math.pow(rewardFundGrowthDaily, day) * (projectedPrice / currentPrice);
        const dailyNinjaGrant = (hiveBalance * 0.0005) * projectedPrice;
        hiveBalance -= hiveBalance * 0.0005;
        const dailyBeneficiaryRewards = (200000 / 30) * projectedPrice;
        
        totalInflow += projectedRewardInflow + dailyNinjaGrant + dailyBeneficiaryRewards;
      }
      
      const averageDailyInflow = totalInflow / (365 * 10);
      
      // For sustainability, we need: treasury + (inflow - outflow) * time >= 150 * inflow
      // Solving for outflow: outflow <= inflow - (150 * inflow - treasury) / time
      // Using 10 years as target time
      const targetTime = 365 * 10;
      const maxSustainableOutflow = averageDailyInflow - (150 * averageDailyInflow - currentTreasury) / targetTime;
      
      if (currentDailyOutflow <= maxSustainableOutflow) {
        return 0; // Already sustainable
      }
      
      return currentDailyOutflow - maxSustainableOutflow;
    },
    
    calculateFundProjectionAnalysis() {
      // Analyze fund trajectory and calculate spending cushion for exponential growth
      if (!this.daoFund || !this.hiveprice?.hive?.usd || !this.healthStats) {
        return null;
      }
      
      const currentPrice = this.hiveprice.hive.usd;
      const currentTreasury = this.daoFund.treasury;
      const currentHiveBalance = this.daoFund.hiveBalance;
      const dailyRewardsInflow = this.daoFund.dailyInflow;
      const currentDailyOutflow = this.healthStats.totalFundedOutflowsNoStabilizer;
      const priceGrowthRate = this.priceGrowthRate / 100;
      
      let treasury = currentTreasury;
      let hiveBalance = currentHiveBalance;
      let maxTreasury = currentTreasury;
      let maxTreasuryDay = 0;
      let hasFoundPeak = false;
      
      const priceGrowthDaily = Math.pow(1 + priceGrowthRate, 1/365);
      const rewardFundGrowthDaily = Math.pow(1.08, 1/365);
      
      // Simulate to find maximum treasury value and trajectory
      for (let days = 0; days < 365 * 20; days++) { // 20-year simulation
        const projectedPrice = currentPrice * Math.pow(priceGrowthDaily, days);
        const projectedRewardInflow = dailyRewardsInflow * Math.pow(rewardFundGrowthDaily, days) * (projectedPrice / currentPrice);
        
        const dailyNinjaGrant = (hiveBalance * 0.0005) * projectedPrice;
        hiveBalance -= hiveBalance * 0.0005;
        
        const dailyBeneficiaryRewards = (200000 / 30) * projectedPrice;
        
        const totalDailyInflow = projectedRewardInflow + dailyNinjaGrant + dailyBeneficiaryRewards;
        const netDailyChange = totalDailyInflow - currentDailyOutflow;
        treasury += netDailyChange;
        
        // Track maximum treasury value
        if (treasury > maxTreasury) {
          maxTreasury = treasury;
          maxTreasuryDay = days;
        }
        
        // Check if we've found the peak (treasury starts declining consistently)
        if (days > maxTreasuryDay + 365 && treasury < maxTreasury * 0.95) {
          hasFoundPeak = true;
          break;
        }
        
        // If treasury goes negative, break
        if (treasury <= 0) {
          break;
        }
      }
      
      // Calculate sustainable spending level that matches the price slope
      const equilibriumSpending = this.calculateEquilibriumSpending();
      
      return {
        hasMaxValue: hasFoundPeak,
        maxTreasury: maxTreasury,
        maxTreasuryDay: maxTreasuryDay,
        currentTreasury: currentTreasury,
        spendingCushion: equilibriumSpending ? equilibriumSpending - currentDailyOutflow : null,
        equilibriumSpending: equilibriumSpending
      };
    },
    
    calculateEquilibriumSpending() {
      // Calculate the spending level where fund size matches price growth slope
      if (!this.daoFund || !this.hiveprice?.hive?.usd) {
        return null;
      }
      
      const currentPrice = this.hiveprice.hive.usd;
      const currentHiveBalance = this.daoFund.hiveBalance;
      const dailyRewardsInflow = this.daoFund.dailyInflow;
      const priceGrowthRate = this.priceGrowthRate / 100;
      
      // For exponential growth scenarios, find the spending level where
      // the fund reaches a stable multiple of daily inflow
      const priceGrowthDaily = Math.pow(1 + priceGrowthRate, 1/365);
      const rewardFundGrowthDaily = Math.pow(1.08, 1/365);
      
      // Calculate average daily inflow over 5 years
      let totalInflow = 0;
      let hiveBalance = currentHiveBalance;
      
      for (let days = 0; days < 365 * 5; days++) {
        const projectedPrice = currentPrice * Math.pow(priceGrowthDaily, days);
        const projectedRewardInflow = dailyRewardsInflow * Math.pow(rewardFundGrowthDaily, days) * (projectedPrice / currentPrice);
        const dailyNinjaGrant = (hiveBalance * 0.0005) * projectedPrice;
        hiveBalance -= hiveBalance * 0.0005;
        
        const dailyBeneficiaryRewards = (200000 / 30) * projectedPrice;
        totalInflow += projectedRewardInflow + dailyNinjaGrant + dailyBeneficiaryRewards;
      }
      
      const avgDailyInflow = totalInflow / (365 * 5);
      
      // For sustainable growth, spending should be about 80% of average inflow
      // This allows the fund to grow but not exponentially
      return avgDailyInflow * 0.8;
    },

    calculateProjectedRunway() {
      // Calculate runway with realistic inflows and price growth projections (excluding stabilizer proposals)
      if (!this.daoFund || !this.hiveprice?.hive?.usd || !this.healthStats) {
        return null;
      }
      
      const currentPrice = this.hiveprice.hive.usd;
      const currentTreasury = this.daoFund.treasury;
      const currentHiveBalance = this.daoFund.hiveBalance;
      const dailyRewardsInflow = this.daoFund.dailyInflow;
      const dailyOutflow = this.healthStats.totalFundedOutflowsNoStabilizer;
      const priceGrowthRate = this.priceGrowthRate / 100;
      
      // Quick check: if current inflows exceed outflows and we have positive price growth, runway is infinite
      const currentTotalInflow = this.daoFund.dailyInflow + this.daoFund.ninjaGrant + this.daoFund.beneficiaryRewards;
      if (currentTotalInflow >= dailyOutflow && priceGrowthRate >= 0) {
        return null; // Effectively infinite runway
      }
      
      let treasury = currentTreasury;
      let hiveBalance = currentHiveBalance;
      const priceGrowthDaily = Math.pow(1 + priceGrowthRate, 1/365);
      const rewardFundGrowthDaily = Math.pow(1.08, 1/365);
      
      for (let days = 0; days < 365 * 50; days++) { // Max 50 years
        const projectedPrice = currentPrice * Math.pow(priceGrowthDaily, days);
        const projectedRewardInflow = dailyRewardsInflow * Math.pow(rewardFundGrowthDaily, days) * (projectedPrice / currentPrice);
        
        // Ninja grant depletes the Hive balance at 0.05% per day
        const dailyNinjaGrant = (hiveBalance * 0.0005) * projectedPrice;
        hiveBalance -= hiveBalance * 0.0005; // Reduce Hive balance
        
        // Beneficiary rewards: 200,000 Hive monthly from comment voting
        const dailyBeneficiaryRewards = (200000 / 30) * projectedPrice;
        
        const totalDailyInflow = projectedRewardInflow + dailyNinjaGrant + dailyBeneficiaryRewards;
        const netDailyChange = totalDailyInflow - dailyOutflow;
        treasury += netDailyChange;
        
        // If treasury hits zero, that's our runway
        if (treasury <= 0) {
          return days;
        }
        
        // If we're consistently gaining money (net positive for 365 days), runway is effectively infinite
        if (days > 365 && netDailyChange > 0) {
          return null;
        }
      }
      
      return null; // More than 50 years
    },
    
    calculateRunwayAtZeroGrowth() {
      // Calculate runway at 0% price growth but with realistic inflows
      if (!this.daoFund || !this.hiveprice?.hive?.usd || !this.healthStats) {
        return null;
      }
      
      const currentPrice = this.hiveprice.hive.usd;
      const currentTreasury = this.daoFund.treasury;
      const currentHiveBalance = this.daoFund.hiveBalance;
      const dailyRewardsInflow = this.daoFund.dailyInflow;
      const dailyOutflow = this.healthStats.totalFundedOutflowsNoStabilizer;
      
      // Quick check: if current inflows exceed outflows at 0% growth, runway is infinite
      const currentTotalInflow = this.daoFund.dailyInflow + this.daoFund.ninjaGrant + this.daoFund.beneficiaryRewards;
      if (currentTotalInflow >= dailyOutflow) {
        return null; // Effectively infinite runway
      }
      
      let treasury = currentTreasury;
      let hiveBalance = currentHiveBalance;
      const rewardFundGrowthDaily = Math.pow(1.08, 1/365); // Still 8% reward fund growth
      
      for (let days = 0; days < 365 * 50; days++) { // Max 50 years
        // At 0% price growth, but reward fund still grows
        const projectedRewardInflow = dailyRewardsInflow * Math.pow(rewardFundGrowthDaily, days);
        
        // Ninja grant at current price (no price growth)
        const dailyNinjaGrant = (hiveBalance * 0.0005) * currentPrice;
        hiveBalance -= hiveBalance * 0.0005; // Reduce Hive balance
        
        // Beneficiary rewards at current price (no price growth)
        const dailyBeneficiaryRewards = (200000 / 30) * currentPrice;
        
        const totalDailyInflow = projectedRewardInflow + dailyNinjaGrant + dailyBeneficiaryRewards;
        const netDailyChange = totalDailyInflow - dailyOutflow;
        treasury += netDailyChange;
        
        // If treasury hits zero, that's our runway
        if (treasury <= 0) {
          return days;
        }
        
        // If we're consistently gaining money (net positive for 365 days), runway is effectively infinite
        if (days > 365 && netDailyChange > 0) {
          return null;
        }
      }
      
      return null; // More than 50 years
    },

    calculateDailyProjections() {
      const days = 365 * 3; // 3 years
      const currentPrice = this.hiveprice.hive.usd;
      const currentRewardFund = this.daoFund.dailyInflow / (currentPrice * 0.325);
      const currentHiveBalance = this.daoFund.hiveBalance;
      const currentTreasury = this.daoFund.treasury;
      const dailyOutflow = this.healthStats.totalFundedOutflowsNoStabilizer;
      
      // Annual growth rates
      const priceGrowthDaily = Math.pow(1 + (this.priceGrowthRate / 100), 1/365);
      const rewardFundGrowthDaily = Math.pow(1.08, 1/365); // 8% yearly growth
      
             const projections = [];
       let cumulativeDays = 0;
       let currentTreasuryWithout = currentTreasury;
       let currentTreasuryWith = currentTreasury;
       
       // Calculate for each day
       while (cumulativeDays < days) {
         const daysSinceStart = cumulativeDays;
         
         // Calculate projected values for this day
         const projectedPrice = currentPrice * Math.pow(priceGrowthDaily, daysSinceStart);
         const projectedRewardFund = currentRewardFund * Math.pow(rewardFundGrowthDaily, daysSinceStart);
         const projectedHiveBalance = currentHiveBalance; // Assume hive balance stays relatively stable
         
         // Calculate daily inflows
         const dailyRewardInflow = projectedRewardFund * projectedPrice * 0.325;
         const dailyNinjaGrant = (projectedHiveBalance * 0.0005) * projectedPrice;
         const dailyBeneficiaryRewards = (200000 / 30) * projectedPrice;
         const totalDailyInflow = dailyRewardInflow + dailyNinjaGrant + dailyBeneficiaryRewards;
         
         // Calculate outflows (with or without selected proposal)
         let dailyOutflowWithoutProposal = dailyOutflow;
         let dailyOutflowWithProposal = dailyOutflow;
         
         if (this.selectedProposalForAnalysis) {
           const proposalDailyPay = parseFloat(this.selectedProposalForAnalysis.daily_pay?.amount || 0) / 1000;
           dailyOutflowWithProposal = dailyOutflow + proposalDailyPay;
         }
         
         // Update treasury balances
         const netChangeWithout = totalDailyInflow - dailyOutflowWithoutProposal;
         const netChangeWith = totalDailyInflow - dailyOutflowWithProposal;
         
         currentTreasuryWithout += netChangeWithout;
         currentTreasuryWith += netChangeWith;
         
         projections.push({
           day: daysSinceStart,
           date: new Date(Date.now() + daysSinceStart * 24 * 60 * 60 * 1000),
           hivePrice: projectedPrice,
           dailyInflow: totalDailyInflow,
           dailyRewardInflow: dailyRewardInflow,
           dailyNinjaGrant: dailyNinjaGrant,
           dailyOutflowWithout: dailyOutflowWithoutProposal,
           dailyOutflowWith: dailyOutflowWithProposal,
           treasuryWithout: currentTreasuryWithout,
           treasuryWith: currentTreasuryWith,
           netChangeWithout: netChangeWithout,
           netChangeWith: netChangeWith
         });
         
         cumulativeDays++;
       }
      
      return projections;
    },

    updateChart() {
      if (!this.chartInstance) return;
      
      try {
        // Destroy existing chart completely to avoid any Vue reactivity issues
        this.chartInstance.destroy();
        this.chartInstance = null;
        
        // Recreate chart with fresh data
        this.$nextTick(() => {
          this.createChart();
        });
      } catch (error) {
        console.error('Error updating chart:', error);
      }
    },

    generateChartData() {
      // This method generates completely plain, non-reactive data for Chart.js
      const currentPrice = this.hiveprice.hive.usd;
      const dailyRewardsInflow = this.daoFund?.dailyInflow || 0;
      const treasury = this.daoFund?.treasury || 0;
      const hiveBalance = this.daoFund?.hiveBalance || 0;
      const dailyOutflow = this.healthStats?.totalFundedOutflowsNoStabilizer || 0;
      const priceGrowthRate = this.priceGrowthRate || 0;
      
      // Get selected proposal data if any
      let selectedProposalPay = 0;
      let selectedProposalTitle = '';
      let isProposalCurrentlyFunded = false;
      let isSelectedProposalShortTerm = false;
      let selectedProposalRemainingDays = 0;
      if (this.selectedProposalForAnalysis && this.selectedProposalForAnalysis.daily_pay) {
        selectedProposalPay = parseFloat(this.selectedProposalForAnalysis.daily_pay.amount || 0) / 1000;
        selectedProposalTitle = String(this.selectedProposalForAnalysis.subject || '').substring(0, 30);
        isProposalCurrentlyFunded = this.isProposalFunded(this.selectedProposalForAnalysis);
        isSelectedProposalShortTerm = this.isShortTermProposal(this.selectedProposalForAnalysis);
        selectedProposalRemainingDays = this.getRemainingDays(this.selectedProposalForAnalysis);
      }
      
      // Get custom analysis data if any
      let customAnalysisPay = 0;
      let customAnalysisDescription = '';
      let isCustomAnalysisAddition = true;
      if (this.customAnalysis && this.customAnalysis.active) {
        customAnalysisPay = parseFloat(this.customAnalysis.dailyAmount || 0);
        customAnalysisDescription = String(this.customAnalysis.description || 'Custom Analysis');
        isCustomAnalysisAddition = Boolean(this.customAnalysis.isAddition);
      }
      
      // Calculate projections with plain JavaScript (no Vue reactivity)
      const days = 365 * 3;
      const priceGrowthDaily = Math.pow(1 + (priceGrowthRate / 100), 1/365);
      const rewardFundGrowthDaily = Math.pow(1.08, 1/365);
      
      const projections = [];
      let currentTreasuryWithout = treasury;
      let currentTreasuryWithProposal = treasury;
      let currentTreasuryWithCustom = treasury;
      let currentTreasuryWithBoth = treasury;
      let currentHiveBalance = hiveBalance;
      
      for (let day = 0; day < days; day++) {
        const projectedPrice = currentPrice * Math.pow(priceGrowthDaily, day);
        const projectedRewardsInflow = dailyRewardsInflow * Math.pow(rewardFundGrowthDaily, day) * (projectedPrice / currentPrice);
        
        // Ninja grant depletes the Hive balance at 0.05% per day
        const dailyNinjaGrant = (currentHiveBalance * 0.0005) * projectedPrice;
        currentHiveBalance -= currentHiveBalance * 0.0005; // Reduce Hive balance
        
        // Beneficiary rewards: 200,000 Hive monthly from comment voting
        const dailyBeneficiaryRewards = (200000 / 30) * projectedPrice;
        
        const totalDailyInflow = projectedRewardsInflow + dailyNinjaGrant + dailyBeneficiaryRewards;
        
        // Calculate different outflow scenarios
        const dailyOutflowWithout = dailyOutflow;
        
        // Proposal impact - only apply for remaining days if short-term
        let proposalImpact = 0;
        if (selectedProposalPay > 0) {
          if (isSelectedProposalShortTerm) {
            // For short-term proposals, only apply impact for remaining days
            if (day <= selectedProposalRemainingDays) {
              proposalImpact = isProposalCurrentlyFunded ? -selectedProposalPay : selectedProposalPay;
            }
            // After remaining days, impact becomes 0 (proposal expires)
          } else {
            // For long-term proposals, apply impact for the entire projection period
            proposalImpact = isProposalCurrentlyFunded ? -selectedProposalPay : selectedProposalPay;
          }
        }
        const dailyOutflowWithProposal = dailyOutflow + proposalImpact;
        
        // Custom analysis impact
        const customImpact = isCustomAnalysisAddition ? customAnalysisPay : -customAnalysisPay;
        const dailyOutflowWithCustom = dailyOutflow + customImpact;
        
        // Combined impact
        const dailyOutflowWithBoth = dailyOutflow + proposalImpact + customImpact;
        
        // Update treasury projections
        currentTreasuryWithout += totalDailyInflow - dailyOutflowWithout;
        currentTreasuryWithProposal += totalDailyInflow - dailyOutflowWithProposal;
        currentTreasuryWithCustom += totalDailyInflow - dailyOutflowWithCustom;
        currentTreasuryWithBoth += totalDailyInflow - dailyOutflowWithBoth;
        
        if (day % 30 === 0) { // Monthly data points
          projections.push({
            date: new Date(Date.now() + day * 24 * 60 * 60 * 1000),
            treasuryWithout: Number(currentTreasuryWithout),
            treasuryWithProposal: Number(currentTreasuryWithProposal),
            treasuryWithCustom: Number(currentTreasuryWithCustom),
            treasuryWithBoth: Number(currentTreasuryWithBoth),
            hiveBalance: Number(currentHiveBalance),
            dailyInflow: Number(totalDailyInflow),
            dailyRewardsInflow: Number(projectedRewardsInflow),
            dailyNinjaGrant: Number(dailyNinjaGrant),
            dailyBeneficiaryRewards: Number(dailyBeneficiaryRewards),
            dailyOutflowWithout: Number(dailyOutflowWithout),
            dailyOutflowWithProposal: Number(dailyOutflowWithProposal),
            dailyOutflowWithCustom: Number(dailyOutflowWithCustom),
            dailyOutflowWithBoth: Number(dailyOutflowWithBoth)
          });
        }
      }
      
      // Create chart labels and datasets as plain objects
      const labels = projections.map(p => 
        p.date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
      );
      
      const datasets = [
        {
          label: 'Treasury Balance (Current)',
          data: projections.map(p => p.treasuryWithout),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.1)',
          tension: 0.1,
          fill: false,
          hidden: false  // Always visible - most important
        },
        {
          label: 'Hive Balance (Ninja Fund)',
          data: projections.map(p => p.hiveBalance),
          borderColor: 'rgb(255, 159, 64)',
          backgroundColor: 'rgba(255, 159, 64, 0.1)',
          tension: 0.1,
          fill: false,
          hidden: true  // Hidden by default
        },
        {
          label: 'Daily Inflow (Total)',
          data: projections.map(p => p.dailyInflow),
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
          tension: 0.1,
          yAxisID: 'y1',
          fill: false,
          hidden: false  // Always visible - most important
        },
        {
          label: 'Daily Ninja Grant',
          data: projections.map(p => p.dailyNinjaGrant),
          borderColor: 'rgb(153, 102, 255)',
          backgroundColor: 'rgba(153, 102, 255, 0.1)',
          tension: 0.1,
          yAxisID: 'y1',
          fill: false,
          hidden: true  // Hidden by default
        },
        {
          label: 'Daily Beneficiary Rewards',
          data: projections.map(p => p.dailyBeneficiaryRewards),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.1,
          yAxisID: 'y1',
          fill: false,
          hidden: true  // Hidden by default
        },
        {
          label: 'Daily Outflow (Current)',
          data: projections.map(p => p.dailyOutflowWithout),
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          tension: 0.1,
          yAxisID: 'y1',
          fill: false,
          hidden: false  // Always visible - most important
        }
      ];
      
      // Add proposal analysis if selected
      if (selectedProposalPay > 0) {
        const actionLabel = isProposalCurrentlyFunded ? 'removing' : 'adding';
        datasets.push({
          label: `Treasury ${actionLabel} "${selectedProposalTitle}..."`,
          data: projections.map(p => p.treasuryWithProposal),
          borderColor: 'rgb(255, 205, 86)',
          backgroundColor: 'rgba(255, 205, 86, 0.1)',
          tension: 0.1,
          borderDash: [5, 5],
          fill: false
        });
        
        datasets.push({
          label: `Daily Outflow (${actionLabel.charAt(0).toUpperCase() + actionLabel.slice(1)} Proposal)`,
          data: projections.map(p => p.dailyOutflowWithProposal),
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.3)',
          tension: 0.1,
          yAxisID: 'y1',
          borderDash: [5, 5],
          fill: false
        });
      }
      
      // Add custom analysis if active
      if (customAnalysisPay > 0) {
        const actionLabel = isCustomAnalysisAddition ? 'adding' : 'removing';
        datasets.push({
          label: `Treasury ${actionLabel} "${customAnalysisDescription}"`,
          data: projections.map(p => p.treasuryWithCustom),
          borderColor: 'rgb(138, 43, 226)', // Blue-violet color
          backgroundColor: 'rgba(138, 43, 226, 0.1)',
          tension: 0.1,
          borderDash: [10, 5], // Different dash pattern from proposal
          fill: false
        });
        
        datasets.push({
          label: `Daily Outflow (${actionLabel.charAt(0).toUpperCase() + actionLabel.slice(1)} Custom)`,
          data: projections.map(p => p.dailyOutflowWithCustom),
          borderColor: 'rgb(138, 43, 226)',
          backgroundColor: 'rgba(138, 43, 226, 0.3)',
          tension: 0.1,
          yAxisID: 'y1',
          borderDash: [10, 5],
          fill: false
        });
      }
      
      // Add combined analysis if both are active
      if (selectedProposalPay > 0 && customAnalysisPay > 0) {
        datasets.push({
          label: `Treasury (Combined Impact)`,
          data: projections.map(p => p.treasuryWithBoth),
          borderColor: 'rgb(255, 20, 147)', // Deep pink
          backgroundColor: 'rgba(255, 20, 147, 0.1)',
          tension: 0.1,
          borderDash: [15, 5, 5, 5], // Dash-dot pattern
          fill: false
        });
        
        datasets.push({
          label: `Daily Outflow (Combined Impact)`,
          data: projections.map(p => p.dailyOutflowWithBoth),
          borderColor: 'rgb(255, 20, 147)',
          backgroundColor: 'rgba(255, 20, 147, 0.3)',
          tension: 0.1,
          yAxisID: 'y1',
          borderDash: [15, 5, 5, 5],
          fill: false
        });
      }
      
      return { labels, datasets };
    },

    createChart() {
      const ctx = document.getElementById('budgetChart');
      if (!ctx || !this.daoFund || !this.hiveprice?.hive?.usd) {
        return;
      }
      
      // Destroy existing chart if it exists
      if (this.chartInstance) {
        try {
          this.chartInstance.destroy();
        } catch (e) {
          console.warn('Error destroying existing chart:', e);
        }
        this.chartInstance = null;
      }
      
      try {
        // Generate chart data completely outside Vue reactivity
        const chartData = this.generateChartData();
        if (!chartData) return;
        
        this.chartInstance = new Chart(ctx, {
          type: 'line',
          data: chartData,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              mode: 'index',
              intersect: false,
            },
            plugins: {
              title: {
                display: true,
                text: '3-Year DAO Budget Projection',
                color: 'white'
              },
              legend: {
                labels: {
                  color: 'white',
                  usePointStyle: true,
                  boxWidth: 6
                }
              },
              tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: 'white',
                bodyColor: 'white',
                borderColor: 'rgba(255, 255, 255, 0.3)',
                borderWidth: 1
              }
            },
            scales: {
              x: {
                display: true,
                title: {
                  display: true,
                  text: 'Time',
                  color: 'white'
                },
                ticks: {
                  color: 'white',
                  maxTicksLimit: 12
                },
                grid: {
                  color: 'rgba(255, 255, 255, 0.1)'
                }
              },
              y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: {
                  display: true,
                  text: 'Treasury Balance (HBD)',
                  color: 'white'
                },
                ticks: {
                  color: 'white',
                  callback: function(value) {
                    if (value >= 1000000) {
                      return '$' + (value / 1000000).toFixed(1) + 'M';
                    } else if (value >= 1000) {
                      return '$' + (value / 1000).toFixed(0) + 'K';
                    }
                    return '$' + value.toFixed(0);
                  }
                },
                grid: {
                  color: 'rgba(255, 255, 255, 0.1)'
                }
              },
              y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: {
                  display: true,
                  text: 'Daily Flow (HBD)',
                  color: 'white'
                },
                ticks: {
                  color: 'white',
                  callback: function(value) {
                    if (value >= 1000) {
                      return '$' + (value / 1000).toFixed(1) + 'K';
                    }
                    return '$' + value.toFixed(0);
                  }
                },
                grid: {
                  drawOnChartArea: false,
                  color: 'rgba(255, 255, 255, 0.1)'
                }
              }
            },
            elements: {
              point: {
                radius: 0,
                hoverRadius: 4
              }
            }
          }
        });
        
      } catch (error) {
        console.error('Error creating chart:', error);
        this.chartInstance = null;
      }
    },

    selectProposalForAnalysis(proposal) {
      // Prevent rapid selections that could cause chart update issues
      if (this.updatingChart) return;
      
      // Don't allow analysis of return proposal (ID 0) or stabilizer proposals
      if (proposal.id === 0 || this.isStabilizerProposal(proposal)) {
        console.warn('Cannot analyze proposal:', proposal.id === 0 ? 'Return proposal' : 'Stabilizer proposal');
        return;
      }
      
      this.selectedProposalForAnalysis = proposal;
      
      // Update chart with debouncing
      if (this.chartUpdateTimeout) {
        clearTimeout(this.chartUpdateTimeout);
      }
      this.chartUpdateTimeout = setTimeout(() => {
        if (this.chartInstance) {
          this.updateChartData();
        }
      }, 50);
      
      // Auto-scroll to the chart section
      this.$nextTick(() => {
        const chartSection = document.getElementById('budgetChart');
        if (chartSection) {
          chartSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      });
    },

    clearProposalAnalysis() {
      // Store the proposal reference before clearing
      const proposalToScrollTo = this.selectedProposalForAnalysis;
      
      // Clear the selection - reset to initial state
      this.selectedProposalForAnalysis = null;
      
      // Clear any timeouts to prevent race conditions
      if (this.chartUpdateTimeout) {
        clearTimeout(this.chartUpdateTimeout);
        this.chartUpdateTimeout = null;
      }
      
      // Reset updatingChart flag
      this.updatingChart = false;
      
      // Recreate chart from scratch to ensure clean state
      this.$nextTick(() => {
        this.recreateChart(() => {
          // Scroll back to the proposal in the list
          if (proposalToScrollTo) {
            this.$nextTick(() => {
              const proposalElement = document.querySelector(`[data-proposal-id="${proposalToScrollTo.id}"]`);
              if (proposalElement) {
                proposalElement.scrollIntoView({ 
                  behavior: 'smooth', 
                  block: 'center' 
                });
              } else {
                // Fallback: scroll to proposals section
                const proposalsSection = document.getElementById('proposals');
                if (proposalsSection) {
                  proposalsSection.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                  });
                }
              }
            });
          }
        });
      });
    },

    // Custom Analysis Methods
    openCustomAnalysisModal() {
      // Reset form
      this.customAnalysisForm = {
        amount: 0,
        period: 'daily',
        isAddition: true,
        description: ''
      };
      
      // Show modal using Bootstrap 5
      const modal = new bootstrap.Modal(document.getElementById('customAnalysisModal'));
      modal.show();
    },

    closeCustomAnalysisModal() {
      // Hide modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('customAnalysisModal'));
      if (modal) {
        modal.hide();
      }
    },

    getCustomAnalysisDailyAmount() {
      if (!this.customAnalysisForm.amount) return 0;
      
      switch (this.customAnalysisForm.period) {
        case 'daily':
          return this.customAnalysisForm.amount;
        case 'monthly':
          return this.customAnalysisForm.amount / 30.44; // Average days per month
        case 'yearly':
          return this.customAnalysisForm.amount / 365;
        default:
          return this.customAnalysisForm.amount;
      }
    },

    calculateCustomAnalysisPreview() {
      // This is called when the user changes the amount input
      // It's just for reactive updates, no heavy calculations here
    },

    applyCustomAnalysis() {
      if (!this.customAnalysisForm.amount || this.customAnalysisForm.amount <= 0) {
        return;
      }

      // Set custom analysis data
      this.customAnalysis = {
        active: true,
        dailyAmount: this.getCustomAnalysisDailyAmount(),
        isAddition: this.customAnalysisForm.isAddition,
        description: this.customAnalysisForm.description || 'Custom Analysis'
      };

      // Update chart data
      this.updateChartData();

      // Close modal
      this.closeCustomAnalysisModal();

      // Scroll to chart
      this.$nextTick(() => {
        const chartSection = document.getElementById('budgetChart');
        if (chartSection) {
          chartSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      });
    },

    clearCustomAnalysis() {
      // Reset to initial state
      this.customAnalysis = {
        active: false,
        dailyAmount: 0,
        isAddition: true,
        description: ''
      };
      
      // Also reset the form
      this.customAnalysisForm = {
        amount: 0,
        period: 'daily',
        isAddition: true,
        description: ''
      };
      
      // Clear any timeouts to prevent race conditions
      if (this.chartUpdateTimeout) {
        clearTimeout(this.chartUpdateTimeout);
        this.chartUpdateTimeout = null;
      }
      
      // Reset updatingChart flag
      this.updatingChart = false;
      
      // Recreate chart from scratch to ensure clean state
      this.$nextTick(() => {
        this.recreateChart();
      });
    },

    clearAllAnalysis() {
      // Clear all analysis data at once
      this.selectedProposalForAnalysis = null;
      this.customAnalysis = {
        active: false,
        dailyAmount: 0,
        isAddition: true,
        description: ''
      };
      this.customAnalysisForm = {
        amount: 0,
        period: 'daily',
        isAddition: true,
        description: ''
      };
      
      // Clear any timeouts to prevent race conditions
      if (this.chartUpdateTimeout) {
        clearTimeout(this.chartUpdateTimeout);
        this.chartUpdateTimeout = null;
      }
      
      // Reset updatingChart flag
      this.updatingChart = false;
      
      // Recreate chart from scratch to ensure clean state
      this.$nextTick(() => {
        this.recreateChart();
      });
    },

    // Method to completely recreate the chart (for clean state after clearing analysis)
    recreateChart(callback = null) {
      try {
        // Destroy existing chart if it exists
        if (this.chartInstance) {
          this.chartInstance.destroy();
          this.chartInstance = null;
        }
        
        // Clear any update flags
        this.updatingChart = false;
        
        // Recreate the chart
        this.$nextTick(() => {
          this.createChart();
          if (callback) {
            callback();
          }
        });
      } catch (error) {
        console.error('Error recreating chart:', error);
        this.updatingChart = false;
        if (callback) {
          callback();
        }
      }
    },

    // New method to update chart data without destroying the chart
    updateChartData() {
      if (!this.chartInstance || this.updatingChart) return;
      
      this.updatingChart = true;
      
      try {
        // Generate new chart data
        const chartData = this.generateChartData();
        if (!chartData) {
          this.updatingChart = false;
          return;
        }
        
        // Update the chart data directly
        this.chartInstance.data.labels = chartData.labels;
        this.chartInstance.data.datasets = chartData.datasets;
        
        // Update the chart
        this.chartInstance.update('none'); // 'none' = no animation for faster update
        this.updatingChart = false;
      } catch (error) {
        console.error('Error updating chart data:', error);
        this.updatingChart = false;
        
        // Don't call updateChart() here as it can cause infinite loops
        // Instead, recreate chart cleanly
        this.$nextTick(() => {
          this.recreateChart();
        });
      }
    },

    // Hard Fork Impact Analysis Methods
    getProposalsAtRisk() {
      if (!this.proposals || !this.userVotes || !this.account) return [];
      
      // Proposals that are currently funded but might lose funding under HF weighting
      return this.proposals.filter(proposal => {
        if (!this.isProposalFunded(proposal) || !this.isProposalActive(proposal)) return false;
        
        // Estimate potential vote reduction (simplified)
        const currentVotes = proposal.total_votes;
        const threshold = this.calculateProposalThreshold();
        
        // Estimate 10-20% vote reduction for marginal proposals
        const estimatedNewVotes = currentVotes * 0.85;
        
        return estimatedNewVotes < threshold && currentVotes >= threshold;
      }).slice(0, 5); // Limit to top 5 for display
    },

    getProposalsBenefiting() {
      if (!this.proposals || !this.userVotes || !this.account) return [];
      
      // Proposals that are currently not funded but might gain funding
      return this.proposals.filter(proposal => {
        if (this.isProposalFunded(proposal) || !this.isProposalActive(proposal)) return false;
        
        const currentVotes = proposal.total_votes;
        const currentThreshold = this.calculateProposalThreshold();
        
        // Estimate new threshold might be higher, but some proposals might benefit from redistributed votes
        const estimatedNewThreshold = currentThreshold * 1.15;
        const estimatedNewVotes = currentVotes * 1.1; // Slight boost from redistributed votes
        
        return estimatedNewVotes >= estimatedNewThreshold && currentVotes < currentThreshold;
      }).slice(0, 5); // Limit to top 5 for display
    },

         calculateVoterCommitment(voter = null) {
       if (!this.proposals || !this.userVotes || !this.daoFund || !this.daoFund.fund_balance) return 0;
       
       const targetVoter = voter || this.account;
       if (!targetVoter) return 0;
       
       let totalCommitment = 0;
       let hasLargeProposal = false;
       
       const sustainableRate = this.daoFund.fund_balance / 100; // 1% of treasury per day
       
       for (const proposal of this.proposals) {
         if (!this.isProposalActive(proposal)) continue;
         
         const userVoted = this.getUserVote(proposal.id);
         if (!userVoted) continue;
         
         const dailyPay = proposal.daily_pay.amount / 1000; // Convert to HBD
         
         // Check if this is a large proposal (>sustainable rate)
         if (dailyPay > sustainableRate) {
           if (!hasLargeProposal) {
             // Only count one large proposal, capped at sustainable rate
             totalCommitment += sustainableRate;
             hasLargeProposal = true;
           }
           // Skip additional large proposals (per HF rules)
         } else {
           // Regular proposal - add full amount
           totalCommitment += dailyPay;
         }
       }
       
       return totalCommitment;
     },

    calculateVoteWeight(voter = null) {
      const targetVoter = voter || this.account;
      if (!targetVoter) return 1.0;
      
      const dailyInflow = this.daoFund.dailyInflow;
      const commitment = this.calculateVoterCommitment(targetVoter);
      
      if (commitment <= dailyInflow) return 1.0;
      
      // Calculate proportional weight
      const proportionalWeight = Math.min(1.0, dailyInflow / commitment);
      
      // Calculate minimum weight based on consensus (simplified)
      // In real implementation, this would be highest_raw_vote_total / total_vesting_shares
      const estimatedMinimumWeight = 0.3; // Assume 30% minimum for demo
      
      return Math.max(proportionalWeight, estimatedMinimumWeight);
        },

    updateHivePriceFromWitnesses() {
      // Calculate price from witness price feeds and update hiveprice
      if (!this.witnesses || !Array.isArray(this.witnesses)) {
        return; // Keep existing price if no witness data
      }
      
      const activeWitnesses = this.witnesses.filter(w => w.rank <= 20 && w.hbd_exchange_rate);
      if (activeWitnesses.length === 0) {
        return; // Keep existing price if no active witnesses with price feeds
      }
      
      const totalPrice = activeWitnesses.reduce((sum, witness) => {
        const price = parseFloat(this.getHivePrice(witness.hbd_exchange_rate));
        return sum + (isNaN(price) ? 0 : price);
      }, 0);
      
      const averagePrice = totalPrice / activeWitnesses.length;
      
      // Update hiveprice if calculation successful
      if (averagePrice > 0) {
        this.hiveprice = {
          hive: {
            usd: averagePrice
          }
        };
        console.log(`Updated Hive price from witness consensus: $${averagePrice.toFixed(3)}`);
      }
    },

    getWitnessFallbackPrice() {
      // Calculate fallback price from witness price feeds
      if (!this.witnesses || !Array.isArray(this.witnesses)) {
        return 0.25; // Ultimate fallback if no witness data
      }
      
      const activeWitnesses = this.witnesses.filter(w => w.rank <= 20 && w.hbd_exchange_rate);
      if (activeWitnesses.length === 0) {
        return 0.25; // Ultimate fallback if no active witnesses with price feeds
      }
      
      const totalPrice = activeWitnesses.reduce((sum, witness) => {
        const price = parseFloat(this.getHivePrice(witness.hbd_exchange_rate));
        return sum + (isNaN(price) ? 0 : price);
      }, 0);
      
      const averagePrice = totalPrice / activeWitnesses.length;
      
      // Return average or 0.25 if calculation failed
      return averagePrice > 0 ? averagePrice : 0.25;
    },

    getHFImpactForUser() {
       if (!this.account) return null;
       
       const currentCommitment = this.calculateVoterCommitment();
       const voteWeight = this.calculateVoteWeight();
       const dailyInflow = this.daoFund.dailyInflow;
       
       return {
         commitment: currentCommitment,
         dailyInflow: dailyInflow,
         voteWeight: voteWeight,
         isOverCommitted: currentCommitment > dailyInflow,
         weightReduction: 1 - voteWeight
       };
     },

     // Helper methods for HF Impact display with proper fallbacks
     getReturnProposalVotes() {
       if (!this.proposals || this.proposals.length === 0) return 'Loading...';
       
       const returnProposal = this.proposals.find(p => p.id === 0);
       if (!returnProposal) return 'N/A';
       
       return this.formatVotes(returnProposal.total_votes);
     },

     getProjectedNewThreshold() {
       if (!this.proposals || this.proposals.length === 0) return 'Loading...';
       
       const currentThreshold = this.calculateProposalThreshold();
       if (!currentThreshold || isNaN(currentThreshold)) return 'N/A';
       
       return this.formatVotes(currentThreshold * 1.15);
     },

     getSustainableRate() {
       if (!this.daoFund || typeof this.daoFund.fund_balance !== 'number') {
         return 'Loading...';
       }
       
       const sustainableRate = this.daoFund.fund_balance / 100;
       if (isNaN(sustainableRate) || sustainableRate <= 0) {
         return 'N/A';
       }
       
       return this.fancyRounding(sustainableRate);
     },

     getEstimatedAffectedVoters() {
       if (!this.userVotes) return 'Loading...';
       
       const totalVoters = Object.keys(this.userVotes).length;
       if (totalVoters === 0) return '0';
       
       // Estimate 25% of voters might be over-committed
       return Math.floor(totalVoters * 0.25);
     },

    makeQr(ref, link = "test", opts = {}){
      var qrcode = new QRCode(this.$refs[ref], opts);
      qrcode.makeCode(link);
    },
    checkAccount(name, key) {
      fetch("https://api.hive.blog", {
        body: `{\"jsonrpc\":\"2.0\", \"method\":\"condenser_api.get_accounts\", \"params\":[[\"${this[name]}\"]], \"id\":1}`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        method: "POST",
      })
        .then((r) => {
          return r.json();
        })
        .then((re) => {
          if (re.result.length) this[key] = true;
          else this[key] = false;
        });
    },
    startscroll(id = "dapps") {
      const el = this.$refs[id];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    },
    localStoreSet(k, v) {
      localStorage.setItem(k, v);
    },
    toFixed(value, decimals) {
      return Number(value).toFixed(decimals);
    },
    parseFloat(value) {
      return parseFloat(value);
    },
    toUpperCase(value) {
      return value.toUpperCase();
    },
    formatNumber(t, n, r, e) {
      if (typeof t != "number") t = parseFloat(t);
      if (isNaN(t)) return "Invalid Number";
      if (!isFinite(t)) return (t < 0 ? "-" : "") + "infinite";
      (r = r || "."), (e = e || "");
      var u = t < 0;
      t = Math.abs(t);
      var a = (null != n && 0 <= n ? t.toFixed(n) : t.toString()).split("."),
        i = a[0],
        o = 1 < a.length ? r + a[1] : "";
      if (e)
        for (var c = /(\d+)(\d{3})/; c.test(i); )
          i = i.replace(c, "$1" + e + "$2");
      return (u ? "-" : "") + i + o;
    },
    lc(a){
      return a.toLowerCase()
    },
    uc(a){
      return a.toUpperCase()
    },
    setValue(key, value) {
      if (key.split(".").length > 1) {
        let keys = key.split(".");
        let obj = this[keys[0]];
        for (let i = 1; i < keys.length; i++) {
          if (i == keys.length - 1) {
            obj[keys[i]] = value;
          } else {
            obj = obj[keys[i]];
          }
        }
      } else {
        this[key] = value;
      }
    },
    getHiveStats() {
      fetch("https://api.hive.blog", {
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
    setApi(url) {
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
    atref(key) {
      return `/@${key}`;
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
    focus(id) {
      document.getElementById(id).focus();
    },
    validateForm(formKey, validKey) {
      var Container = document.getElementById(formKey);
      if (Container.querySelector("input:invalid")) this[validKey] = false;
      else this[validKey] = true;
    },
    // Note: Hive price now comes from witness feeds instead of CoinGecko
    // HBD price could still be fetched from CoinGecko if needed
    getHbdPrice() {
      fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=hive_dollar&amp;vs_currencies=usd"
      )
        .then((response) => response.json())
        .then((data) => {
          this.hbdprice = data;
        })
        .catch(error => {
          console.warn('Failed to fetch HBD price from CoinGecko:', error);
        });
    },
    getTickers(){
      fetch("https://data.dlux.io/hc/tickers")
        .then((response) => response.json())
        .then((data) => {
          var tickers = {}
          for(var i = 0; i < data.tickers.length; i++){
            tickers[data.tickers[i].token] = data.tickers[i] 
          }
          this.tickers = tickers
        });
    },
    getNodes() {
      fetch(this.lapi + "/runners")
        .then((response) => response.json())
        .then((data) => {
          this.runners = data.result.sort((a, b) => {
            return b.g - a.g;
          });
        });
      fetch(this.lapi + "/markets")
        .then((response) => response.json())
        .then((data) => {
          this.nodes = data.markets.node;
          this.stats = data.stats;
        });
    },
    getDluxStats() {
      fetch("https://data.dlux.io/stats")
        .then((response) => response.json())
        .then((data) => {
          this.dappstats = data.number_of_dApps;
        });
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
      this.accountapi = "";
      this.accountinfo = {};
    },
    getTokenUser(user) { },
    
    async getHiveUser(user) {
      if (!user) return;
      
      try {
        const response = await fetch(this.hapi, {
          body: `{"jsonrpc":"2.0", "method":"condenser_api.get_accounts", "params":[["${user}"]], "id":1}`,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          method: "POST",
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.error) throw new Error(data.error.message || 'API error');
        
        this.accountinfo = data.result[0];
        console.log('Account info loaded for voting power calculation');
        
      } catch (error) {
        console.error('Error fetching Hive user account:', error);
        this.accountinfo = null;
      }
    },

    getReplies(a, p) {
      return new Promise((resolve, reject) => {
        console.log('Loading replies using bridge API for:', a, p);
        
        fetch(this.hapi, {
          body: JSON.stringify({
            "jsonrpc": "2.0",
            "method": "bridge.get_discussion",
            "params": {"author": a, "permlink": p},
            "id": 1
          }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        })
          .then((res) => res.json())
          .then((r) => {
            console.log('Bridge API discussion result:', r.result);
            
            if (r.result && this.blogPost) {
              // Bridge API returns an object where keys are reply identifiers
              // and values are the reply posts
              const replyObjects = r.result;
              const processedReplies = [];
              
              // Convert the object to an array of replies
              Object.keys(replyObjects).forEach(key => {
                const replyPost = replyObjects[key];
                
                // Skip the main post - only process actual replies
                if (replyPost.author !== a || replyPost.permlink !== p) {
                  // Check if this is a direct reply to the main post
                  if (replyPost.parent_author === a && replyPost.parent_permlink === p) {
                    const processedReply = {
                      ...replyPost,
                      depth: 1,
                      edit: false,
                      slider: 10000,
                      flag: false,
                      upVotes: 0,
                      downVotes: 0,
                      ago: this.timeSince(new Date(replyPost.created)),
                      url: `/@${replyPost.author}/${replyPost.permlink}`,
                      rep: replyPost.author_reputation,
                      replies: []
                    };

                    // Calculate vote counts
                    if (replyPost.active_votes) {
                      replyPost.active_votes.forEach(vote => {
                        if (parseFloat(vote.rshares) > 0) {
                          processedReply.upVotes++;
                        } else if (parseFloat(vote.rshares) < 0) {
                          processedReply.downVotes++;
                        }
                      });
                    }

                    // Parse JSON metadata safely
                    if (replyPost.json_metadata && typeof replyPost.json_metadata === 'string') {
                      try {
                        processedReply.json_metadata = JSON.parse(replyPost.json_metadata);
                      } catch (e) {
                        processedReply.json_metadata = {};
                      }
                    } else {
                      processedReply.json_metadata = replyPost.json_metadata || {};
                    }

                    processedReplies.push(processedReply);
                  }
                }
              });
              
              // Now process nested replies
              Object.keys(replyObjects).forEach(key => {
                const replyPost = replyObjects[key];
                
                // Skip the main post
                if (replyPost.author !== a || replyPost.permlink !== p) {
                  // Check if this is a nested reply (reply to a reply)
                  if (replyPost.parent_author !== a || replyPost.parent_permlink !== p) {
                    // Find the parent reply in our processed list
                    const parentReply = processedReplies.find(reply => 
                      reply.author === replyPost.parent_author && 
                      reply.permlink === replyPost.parent_permlink
                    );
                    
                    if (parentReply) {
                      const nestedReply = {
                        ...replyPost,
                        depth: 2,
                        edit: false,
                        slider: 10000,
                        flag: false,
                        upVotes: 0,
                        downVotes: 0,
                        ago: this.timeSince(new Date(replyPost.created)),
                        url: `/@${replyPost.author}/${replyPost.permlink}`,
                        rep: replyPost.author_reputation,
                        replies: []
                      };

                      // Calculate vote counts
                      if (replyPost.active_votes) {
                        replyPost.active_votes.forEach(vote => {
                          if (parseFloat(vote.rshares) > 0) {
                            nestedReply.upVotes++;
                          } else if (parseFloat(vote.rshares) < 0) {
                            nestedReply.downVotes++;
                          }
                        });
                      }

                      // Parse JSON metadata safely
                      if (replyPost.json_metadata && typeof replyPost.json_metadata === 'string') {
                        try {
                          nestedReply.json_metadata = JSON.parse(replyPost.json_metadata);
                        } catch (e) {
                          nestedReply.json_metadata = {};
                        }
                      } else {
                        nestedReply.json_metadata = replyPost.json_metadata || {};
                      }

                      parentReply.replies.push(nestedReply);
                    }
                  }
                }
              });
              
              console.log('Processed replies:', processedReplies);
              this.blogPost.replies = processedReplies;
            } else {
              // Fallback to condenser API
              console.log('No bridge result, falling back to condenser API');
              this.getRepliesCondenser(a, p);
            }
            
            resolve();
          })
          .catch((err) => {
            console.error('Error loading replies with bridge API:', err);
            // Fallback to condenser API
            this.getRepliesCondenser(a, p).then(resolve).catch(reject);
          });
      });
    },

    processBridgeDiscussion(post, replies, depth = 0, parentAuthor = null, parentPermlink = null) {
      // Skip the main post (depth 0) as we only want replies
      if (depth > 0) {
        const processedReply = {
          ...post,
          depth: depth,
          edit: false,
          slider: 10000,
          flag: false,
          upVotes: 0,
          downVotes: 0,
          ago: this.timeSince(new Date(post.created)),
          url: `/@${post.author}/${post.permlink}`,
          rep: post.author_reputation,
          replies: [] // Initialize replies array - will be populated later
        };

        // Calculate vote counts
        if (post.active_votes) {
          post.active_votes.forEach(vote => {
            if (parseFloat(vote.rshares) > 0) {
              processedReply.upVotes++;
            } else if (parseFloat(vote.rshares) < 0) {
              processedReply.downVotes++;
            }
          });
        }

        // Parse JSON metadata safely
        if (post.json_metadata && typeof post.json_metadata === 'string') {
          try {
            processedReply.json_metadata = JSON.parse(post.json_metadata);
          } catch (e) {
            processedReply.json_metadata = {};
          }
        } else if (post.json_metadata) {
          processedReply.json_metadata = post.json_metadata;
        } else {
          processedReply.json_metadata = {};
        }

        replies.push(processedReply);
      }

      // Process child replies recursively and add them to the current reply
      if (post.replies && Array.isArray(post.replies)) {
        const childReplies = [];
        post.replies.forEach(childPost => {
          this.processBridgeDiscussion(childPost, childReplies, depth + 1, post.author, post.permlink);
        });
        
        // If we're not at the root level, find the current reply and add its children
        if (depth > 0 && replies.length > 0) {
          const currentReply = replies[replies.length - 1];
          currentReply.replies = childReplies;
        } else if (depth === 0) {
          // For the root level, add child replies directly to the main replies array
          replies.push(...childReplies);
        }
      }
      
      // NEW: Also check if this is a direct reply to the main post 
      // Bridge API returns flat structure with parent info
      if (depth === 0 && post.parent_author === parentAuthor && post.parent_permlink === parentPermlink) {
        const processedReply = {
          ...post,
          depth: 1,
          edit: false,
          slider: 10000,
          flag: false,
          upVotes: 0,
          downVotes: 0,
          ago: this.timeSince(new Date(post.created)),
          url: `/@${post.author}/${post.permlink}`,
          rep: post.author_reputation,
          replies: []
        };

        // Calculate vote counts
        if (post.active_votes) {
          post.active_votes.forEach(vote => {
            if (parseFloat(vote.rshares) > 0) {
              processedReply.upVotes++;
            } else if (parseFloat(vote.rshares) < 0) {
              processedReply.downVotes++;
            }
          });
        }

        // Parse JSON metadata safely
        if (post.json_metadata && typeof post.json_metadata === 'string') {
          try {
            processedReply.json_metadata = JSON.parse(post.json_metadata);
          } catch (e) {
            processedReply.json_metadata = {};
          }
        } else {
          processedReply.json_metadata = post.json_metadata || {};
        }

        replies.push(processedReply);
      }
    },

    // Fallback method using condenser API
    getRepliesCondenser(a, p) {
      return new Promise((resolve, reject) => {
        console.log('Falling back to condenser API for replies:', a, p);
        
        fetch(this.hapi, {
          body: JSON.stringify({
            "jsonrpc": "2.0", 
            "method": "condenser_api.get_content_replies", 
            "params": [a, p], 
            "id": 1
          }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        })
          .then((res) => res.json())
          .then((r) => {
            if (r.result && this.blogPost) {
              console.log('Condenser API replies result:', r.result);
              
              var authors = []
              const processedReplies = [];
              
              for (let i = 0; i < r.result.length; i++) {
                const reply = r.result[i];
                authors.push(reply.author);
                
                const processedReply = {
                  ...reply,
                  depth: 1, // Condenser API doesn't provide depth info
                  edit: false,
                  slider: 10000,
                  flag: false,
                  upVotes: 0,
                  downVotes: 0,
                  ago: this.timeSince(new Date(reply.created)),
                  url: `/@${reply.author}/${reply.permlink}`,
                  rep: reply.author_reputation,
                  replies: [] // Initialize replies array
                };
                
                // Calculate vote counts for replies
                if (reply.active_votes) {
                  reply.active_votes.forEach(vote => {
                    if (parseFloat(vote.rshares) > 0) {
                      processedReply.upVotes++;
                    } else if (parseFloat(vote.rshares) < 0) {
                      processedReply.downVotes++;
                    }
                  });
                }
                
                // Parse JSON metadata
                if (reply.json_metadata && typeof reply.json_metadata === 'string') {
                  try {
                    processedReply.json_metadata = JSON.parse(reply.json_metadata);
                  } catch (e) {
                    processedReply.json_metadata = {};
                  }
                } else {
                  processedReply.json_metadata = reply.json_metadata || {};
                }
                
                processedReplies.push(processedReply);
                
                // Recursively load nested replies if they exist
                if (reply.children > 0) {
                  console.log('Loading nested replies for:', reply.author, reply.permlink);
                  this.getRepliesCondenser(reply.author, reply.permlink)
                    .then(() => {
                      // Find the reply in our processed list and add its children
                      const parentReply = processedReplies.find(r => 
                        r.author === reply.author && r.permlink === reply.permlink
                      );
                      if (parentReply && this.blogPost) {
                        // The nested replies would be in blogPost.replies, filter them
                        const nestedReplies = this.blogPost.replies.filter(r => 
                          r.parent_author === reply.author && r.parent_permlink === reply.permlink
                        );
                        parentReply.replies = nestedReplies;
                      }
                    })
                    .catch(err => console.error('Error loading nested replies:', err));
                }
              }
              
              this.blogPost.replies = processedReplies;
            }
            resolve();
          })
          .catch((err) => {
            console.error('Error loading replies with condenser API:', err);
            reject(err);
          });
      });
    },

    removeMD(md, options = {}) {
      // Basic markdown removal - strips common markdown syntax
      if (!md) return '';
      
      return md
        // Remove headers
        .replace(/^#{1,6}\s+/gm, '')
        // Remove emphasis
        .replace(/(\*\*|__)(.*?)\1/g, '$2')
        .replace(/(\*|_)(.*?)\1/g, '$2')
        // Remove links
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        // Remove images
        .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
        // Remove code blocks
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`([^`]*)`/g, '$1')
        // Remove horizontal rules
        .replace(/^---+$/gm, '')
        // Remove blockquotes
        .replace(/^>\s+/gm, '')
        // Remove list markers
        .replace(/^[\s]*[-*+]\s+/gm, '')
        .replace(/^[\s]*\d+\.\s+/gm, '')
        // Clean up extra whitespace
        .replace(/\n\s*\n/g, '\n')
        .trim();
    },

    async getHiveAuthors(authors) {
      if (!authors || authors.length === 0) return;
      
      try {
        const response = await fetch(this.hapi, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'condenser_api.get_accounts',
            params: [authors],
            id: 1
          })
        });
        
        const data = await response.json();
        if (data.result) {
          data.result.forEach(account => {
            // Store author information for reputation and other uses
            if (!this.authors) this.authors = {};
            this.authors[account.name] = {
              ...account,
              reputation: account.reputation
            };
          });
        }
      } catch (error) {
        console.error('Error fetching author information:', error);
      }
    },

    sendIt(op) {
      this.toSign = op;
    },
    
    // Handle reply events from DetailVue
    handleReply(replyData) {
      console.log('Reply event received:', replyData);
      // Refresh replies after a new reply is posted
      if (this.blogPost && replyData.success) {
        this.getReplies(this.blogPost.author, this.blogPost.permlink);
      }
    },
    
    // Handle vote events from DetailVue  
    handleVote(voteData) {
      console.log('Vote event received:', voteData);
      // Optionally refresh the post data after voting
      if (this.blogPost && voteData.success) {
        // Could refresh the post to get updated vote counts
        // this.openBlogModal(this.blogPost.author, this.blogPost.permlink);
      }
    },

    // Witness monitoring methods
    async loadWitnesses() {
      this.loading = true;
      this.error = null;
      try {
        // Fetch dynamic global properties first to get current witness and block
        const propsResponse = await fetch(this.hapi, {
            method: 'POST',
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'condenser_api.get_dynamic_global_properties',
                params: [],
                id: 1
            })
        });
        const propsData = await propsResponse.json();
        if(propsData.result) {
          this.currentBlock = propsData.result.head_block_number;
          this.hivestats = propsData.result;
          this.current_witness = propsData.result.current_witness;
        }
        
        await Promise.all([
          this.fetchWitnesses(),
          this.fetchWitnessSchedule(),
          this.account ? this.fetchUserWitnessVotes() : Promise.resolve(),
          this.account ? this.checkIfUserIsWitness() : Promise.resolve()
        ]);
      } catch (error) {
        console.error('Error loading witnesses:', error);
        this.error = error.message || 'Failed to load witness data. Please try again.';
      } finally {
        this.loading = false;
      }
    },

    async fetchWitnesses() {
      try {
        // Try the condenser API first as it's more reliable for this data
        const response = await fetch(this.hapi, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'condenser_api.get_witnesses_by_vote',
            params: ['', 1000],
            id: 1
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.error) throw new Error(data.error.message || 'API error');

        const witnesses = data.result || [];
        
        // Add ranking to witnesses (they should already be sorted by votes)
        this.witnesses = witnesses.map((witness, index) => ({
          ...witness,
          rank: index + 1
        }));

        // Update Hive price from witness consensus
        this.updateHivePriceFromWitnesses();

        // Get current block number
        const propsResponse = await fetch(this.hapi, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'condenser_api.get_dynamic_global_properties',
            params: [],
            id: 1
          })
        });

        if (propsResponse.ok) {
          const propsData = await propsResponse.json();
          if (propsData.result) {
            this.currentBlock = propsData.result.head_block_number;
            this.hivestats = propsData.result;
            this.current_witness = propsData.result.current_witness; // Store current witness
          }
        }

      } catch (error) {
        console.error('Error fetching witnesses:', error);
        throw new Error(`Failed to fetch witnesses: ${error.message}`);
      }
    },

    async fetchWitnessSchedule() {
      try {
        // Try condenser API first
        const response = await fetch(this.hapi, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'condenser_api.get_witness_schedule',
            params: [],
            id: 1
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.error) {
          console.warn('Condenser API failed, trying database API:', data.error);
          // Fallback to database API
          const dbResponse = await fetch(this.hapi, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'database_api.get_witness_schedule',
              params: {},
              id: 1
            })
          });
          
          if (dbResponse.ok) {
            const dbData = await dbResponse.json();
            this.witnessSchedule = dbData.result;
          }
        } else {
          this.witnessSchedule = data.result;
        }
      } catch (error) {
        console.error('Error fetching witness schedule:', error);
        // Don't throw here, schedule is not critical
      }
    },

    async fetchUserWitnessVotes() {
      if (!this.account) return;

      try {
        // Try condenser API first as it's more reliable
        const response = await fetch(this.hapi, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'condenser_api.get_accounts',
            params: [[this.account]],
            id: 1
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.error) throw new Error(data.error.message || 'API error');

        const accounts = data.result || [];
        if (accounts.length > 0) {
          const account = accounts[0];
          // Extract witness votes from account data
          this.userWitnessVotes = account.witness_votes || [];
          
          // Check for proxy
          this.userProxy = (account.proxy && account.proxy !== '') ? account.proxy : null;
        } else {
          this.userWitnessVotes = [];
          this.userProxy = null;
        }

      } catch (error) {
        console.error('Error fetching user witness votes:', error);
        this.userWitnessVotes = [];
        this.userProxy = null;
      }
    },

    async checkIfUserIsWitness() {
      if (!this.account) return;

      try {
        const response = await fetch(this.hapi, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'condenser_api.get_witness_by_account',
            params: [this.account],
            id: 1
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.error) throw new Error(data.error.message || 'API error');

        const witness = data.result;
        if (witness && witness.owner) {
          this.isUserWitness = true;
          this.currentUserWitnessInfo = witness;
          
          // Pre-fill witness form with current data
          // witness is already defined above
          
          // Handle different data formats for witness properties
          let accountCreationFee = 3;
          let maxBlockSize = 65536;
          let hbdInterestRate = 0;
          
          if (witness.props) {
            // Handle account creation fee - could be string with units or just number
            if (witness.props.account_creation_fee) {
              if (typeof witness.props.account_creation_fee === 'string') {
                accountCreationFee = parseFloat(witness.props.account_creation_fee.split(' ')[0]);
              } else if (typeof witness.props.account_creation_fee === 'object' && witness.props.account_creation_fee.amount) {
                accountCreationFee = parseFloat(witness.props.account_creation_fee.amount) / 1000; // Convert from milli units
              } else {
                accountCreationFee = parseFloat(witness.props.account_creation_fee) || 3;
              }
            }
            
            // Handle max block size
            maxBlockSize = witness.props.maximum_block_size || 65536;
            
            // Handle HBD interest rate - could be in basis points
            if (witness.props.hbd_interest_rate !== undefined) {
              hbdInterestRate = witness.props.hbd_interest_rate / 100 || 0;
            }
          }
          
          this.witnessForm = {
            url: witness.url || '',
            signingKey: witness.signing_key || '',
            accountCreationFee: accountCreationFee,
            maxBlockSize: maxBlockSize,
            hbdInterestRate: hbdInterestRate
          };
        } else {
          this.isUserWitness = false;
          this.currentUserWitnessInfo = null;
        }

      } catch (error) {
        console.error('Error checking if user is witness:', error);
        this.isUserWitness = false;
        this.currentUserWitnessInfo = null;
      }
    },

    async refreshWitnesses() {
      await this.loadWitnesses();
      this.lastUpdate = Date.now();
    },

    // Live monitoring methods
    startMonitoring() {
      if (this.isMonitoring) return;
      
      this.isMonitoring = true;
      this.lastUpdate = Date.now();
      
      this.monitoringTimer = setInterval(async () => {
        try {
          await this.refreshWitnesses();
        } catch (error) {
          console.error('Error during monitoring update:', error);
        }
      }, this.monitoringInterval);
      
      console.log('Started witness monitoring');
    },

    stopMonitoring() {
      if (!this.isMonitoring) return;
      
      this.isMonitoring = false;
      
      if (this.monitoringTimer) {
        clearInterval(this.monitoringTimer);
        this.monitoringTimer = null;
      }
      
      console.log('Stopped witness monitoring');
    },

    // Witness voting methods
    async voteForWitness(witnessName, approve) {
      if (!this.account || this.userProxy) return;

      this.signingOperation = true;

      const op = {
        type: "raw",
        op: [
          [
            "account_witness_vote",
            {
              account: this.account,
              witness: witnessName,
              approve: approve
            }
          ]
        ],
        key: "active",
        msg: `${approve ? 'Voting for' : 'Removing vote from'} witness @${witnessName}`,
        txid: `witness_vote_${witnessName}_${Date.now()}`,
        api: this.hapi,
        delay: 250,
        ops: ["fetchUserWitnessVotes", "resetSigningState"]
      };

      this.toSign = op;
    },

    async setProxy() {
      if (!this.account || !this.proxyForm.account) return;

      this.signingOperation = true;

      const op = {
        type: "raw",
        op: [
          [
            "account_witness_proxy",
            {
              account: this.account,
              proxy: this.proxyForm.account
            }
          ]
        ],
        key: "active",
        msg: `Setting witness voting proxy to @${this.proxyForm.account}`,
        txid: `set_proxy_${this.proxyForm.account}_${Date.now()}`,
        api: this.hapi,
        delay: 250,
        ops: ["fetchUserWitnessVotes", "resetSigningState", "closeProxyModal"]
      };

      this.toSign = op;
    },

    async clearProxy() {
      if (!this.account) return;

      this.signingOperation = true;

      const op = {
        type: "raw",
        op: [
          [
            "account_witness_proxy",
            {
              account: this.account,
              proxy: ""
            }
          ]
        ],
        key: "active",
        msg: "Clearing witness voting proxy",
        txid: `clear_proxy_${Date.now()}`,
        api: this.hapi,
        delay: 250,
        ops: ["fetchUserWitnessVotes", "resetSigningState"]
      };

      this.toSign = op;
    },

    // Witness management methods
    async updateWitness() {
      if (!this.account || !this.isUserWitness) return;

      this.signingOperation = true;

      const op = {
        type: "raw",
        op: [
          [
            "witness_update",
            {
              owner: this.account,
              url: this.witnessForm.url,
              block_signing_key: this.witnessForm.signingKey,
              props: {
                account_creation_fee: `${this.witnessForm.accountCreationFee.toFixed(3)} HIVE`,
                maximum_block_size: parseInt(this.witnessForm.maxBlockSize),
                hbd_interest_rate: Math.round(this.witnessForm.hbdInterestRate * 100)
              },
              fee: "0.000 HIVE"
            }
          ]
        ],
        key: "active",
        msg: "Updating witness properties",
        txid: `witness_update_${Date.now()}`,
        api: this.hapi,
        delay: 250,
        ops: ["checkIfUserIsWitness", "resetSigningState"]
      };

      this.toSign = op;
    },

    async setNullKey() {
      if (!this.account || !this.isUserWitness) return;

      const nullKey = "STM1111111111111111111111111111111114T1Anm";
      this.signingOperation = true;

      const op = {
        type: "raw",
        op: [
          [
            "witness_update",
            {
              owner: this.account,
              url: this.witnessForm.url,
              block_signing_key: nullKey,
              props: {
                account_creation_fee: `${this.witnessForm.accountCreationFee.toFixed(3)} HIVE`,
                maximum_block_size: parseInt(this.witnessForm.maxBlockSize),
                hbd_interest_rate: Math.round(this.witnessForm.hbdInterestRate * 100)
              },
              fee: "0.000 HIVE"
            }
          ]
        ],
        key: "active",
        msg: "Setting witness signing key to null (disabling block production)",
        txid: `witness_null_key_${Date.now()}`,
        api: this.hapi,
        delay: 250,
        ops: ["checkIfUserIsWitness", "resetSigningState"]
      };

      this.toSign = op;
    },

    // Helper methods
    resetSigningState() {
      this.signingOperation = false;
    },

    closeProxyModal() {
      this.showProxyModal = false;
      this.proxyForm.account = '';
    },

    isVotedForWitness(witnessName) {
      // userWitnessVotes is now an array of witness names from condenser API
      return this.userWitnessVotes.includes(witnessName);
    },

    formatVotes(votes) {
      const vests = parseFloat(votes) / 1000000; // Convert from micro-vests to vests
      
      if (this.hivestats && this.hivestats.total_vesting_fund_hive && this.hivestats.total_vesting_shares) {
        const totalVestingFund = parseFloat(this.hivestats.total_vesting_fund_hive.split(' ')[0]);
        const totalVestingShares = parseFloat(this.hivestats.total_vesting_shares.split(' ')[0]);
        const hp = (vests * totalVestingFund) / totalVestingShares;
        return this.fancyRounding(hp);
      } else {
        // Fallback approximation
        return this.fancyRounding(vests / 1000);
      }
    },

    formatHbdRate(exchangeRate) {
      if (!exchangeRate || !exchangeRate.base || !exchangeRate.quote) return 'N/A';
      
      // Parse the base (HBD amount) and quote (HIVE amount)
      const hbdAmount = parseFloat(exchangeRate.base.split(' ')[0]);
      const hiveAmount = parseFloat(exchangeRate.quote.split(' ')[0]);
      
      // Calculate HIVE price in USD terms (HBD/HIVE ratio)
      const hivePrice = hbdAmount / hiveAmount;
      return hivePrice.toFixed(3);
    },

    getHbdPrice(exchangeRate) {
      // HBD is always pegged to $1 USD
      return '1.000';
    },

    getHivePrice(exchangeRate) {
      if (!exchangeRate || !exchangeRate.base || !exchangeRate.quote) return 'N/A';
      
      const hbdAmount = parseFloat(exchangeRate.base.split(' ')[0]);
      const hiveAmount = parseFloat(exchangeRate.quote.split(' ')[0]);
      
      return (hbdAmount / hiveAmount).toFixed(3);
    },

    formatAccountCreationFee(fee) {
      if (!fee) return 'N/A';
      if (typeof fee === 'string') return fee;
      if (typeof fee === 'object' && fee.amount !== undefined) {
        return `${(fee.amount / Math.pow(10, fee.precision || 3)).toFixed(3)} HIVE`;
      }
      return fee.toString();
    },

    formatHbdInterestRate(rate) {
      if (rate === undefined || rate === null) return '0.00%';
      // Rate is in basis points (100 = 1%)
      return (rate / 100).toFixed(2) + '%';
    },

    getHbdRateClass(witness) {
      if (!witness.hbd_exchange_rate) return 'hbd-rate-normal';
      
      const witnessPrice = parseFloat(this.getHivePrice(witness.hbd_exchange_rate));
      const averagePrice = this.averageHivePrice;

      if(isNaN(witnessPrice) || averagePrice === 0) return 'hbd-rate-normal';

      const deviation = Math.abs(witnessPrice / averagePrice - 1);
      
      if (deviation <= 0.03) return 'hbd-rate-low'; // Green
      if (deviation <= 0.10) return 'hbd-rate-warning'; // Yellow
      return 'hbd-rate-high'; // Red
    },

    timeAgo(timestamp) {
      if (!timestamp) return '';
      
      const now = new Date();
      const past = new Date(timestamp);
      const diffMs = now - past;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      
      if (diffDays > 0) return `${diffDays}d ago`;
      if (diffHours > 0) return `${diffHours}h ago`;
      if (diffMinutes > 0) return `${diffMinutes}m ago`;
      return 'just now';
    },

    formatDate(dateString) {
      if (!dateString) return 'N/A';
      try {
        return new Date(dateString).toLocaleDateString();
      } catch (e) {
        return 'Invalid Date';
      }
    },
  },
  mounted() {
    this.getNodes();
    this.getProtocol();
    this.getTickers();
    this.getHiveStats();
    this.getDluxStats();
    
    // Always load witness price data for better fallback pricing (lightweight call)
    this.fetchWitnesses().catch(err => {
      console.warn('Failed to fetch witness price data for fallback:', err);
    });
    
    // Load proposals if we're on the proposals page
    if (window.location.pathname.includes('/proposals')) {
      // Handle URL routing immediately (before proposals load, for modal display)
      this.handleUrlRouting();
      
      this.loadProposals().then(() => {
        // Handle URL routing again after proposals are loaded (to fill in proposal data)
        this.handleUrlRouting();
      });
    }
    
    // Load witnesses if we're on the witnesses page
    if (window.location.pathname.includes('/witnesses')) {
      this.loadWitnesses().then(() => {
        // Start monitoring by default
        this.startMonitoring();
      });
    }
    
    // Initialize Bootstrap tooltips
    this.$nextTick(() => {
      if (typeof bootstrap !== 'undefined') {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
          return new bootstrap.Tooltip(tooltipTriggerEl);
        });
      }
    });
    
    // Handle browser back/forward buttons and URL changes
    window.addEventListener('popstate', (event) => {
      // Handle URL routing for proposal links
      this.handleUrlRouting();
      
      if (event.state) {
        if (event.state.type === 'proposal') {
          // Close any open modals
          const modals = document.querySelectorAll('.modal.show');
          modals.forEach(modal => {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) bsModal.hide();
          });
        } else if (event.state.type === 'blog') {
          // Close any open modals
          const modals = document.querySelectorAll('.modal.show');
          modals.forEach(modal => {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) bsModal.hide();
          });
        }
      }
    });
    
    // Monitor URL changes for proposal links (for direct navigation)
    let currentUrl = window.location.pathname;
    this.urlChecker = setInterval(() => {
      if (window.location.pathname !== currentUrl) {
        currentUrl = window.location.pathname;
        this.handleUrlRouting();
      }
    }, 100);
    
    //this.makeQr('qrcode', 'follow');
  },
  computed: {
    filteredProposals() {
      let filtered = [...this.proposals];
      
      // Always hide proposals 116 and 117
      filtered = filtered.filter(proposal => {
        const proposalId = proposal.proposal_id || proposal.id;
        return proposalId !== 116 && proposalId !== 117;
      });
      
      // Filter by status
      if (this.filterStatus !== 'all') {
        const now = new Date();
        filtered = filtered.filter(proposal => {
          const endDate = new Date(proposal.end_date);
          const startDate = new Date(proposal.start_date);
          
          switch (this.filterStatus) {
            case 'active':
              return now >= startDate && now <= endDate;
            case 'inactive':
              return now < startDate;
            case 'expired':
              return now > endDate;
            default:
              return true;
          }
        });
      }
      
      // Filter by search term
      if (this.searchTerm) {
        const search = this.searchTerm.toLowerCase();
        filtered = filtered.filter(proposal =>
          proposal.subject.toLowerCase().includes(search) ||
          proposal.creator.toLowerCase().includes(search)
        );
      }
      
      // Sort proposals
      filtered.sort((a, b) => {
        switch (this.sortBy) {
          case 'votes':
            return parseFloat(b.total_votes) - parseFloat(a.total_votes);
          case 'created':
            return new Date(b.start_date) - new Date(a.start_date);
          case 'funding':
            return parseFloat(b.daily_pay.amount) - parseFloat(a.daily_pay.amount);
          case 'end_date':
            return new Date(a.end_date) - new Date(b.end_date);
          default:
            return 0;
        }
      });
      
      return filtered;
    },
    
    reward:{
      get(){
        return this.formatNumber(parseFloat(this.hivestats.pending_rewarded_vesting_hive) * this.hiveprice.hive.usd * 2,0, ".", ",")
      }
    },
    
    // Witness computed properties
    filteredWitnesses() {
      if (!this.witnesses || !Array.isArray(this.witnesses)) return [];
      
      // Always filter to only show active and backup witnesses (rank 1-100)
      let filtered = this.witnesses.filter(witness => {
        return witness && witness.rank <= 100;
      });
      
      // Filter by status
      if (this.filterStatus !== 'all') {
        filtered = filtered.filter(witness => {
          if (!witness) return false;
          
          switch (this.filterStatus) {
            case 'active':
              return witness.rank <= 20;
            case 'backup':
              return witness.rank > 20 && witness.rank <= 100;
            case 'voted':
              return this.isVotedForWitness(witness.owner);
            default:
              return true;
          }
        });
      }
      
      // Filter by search term
      if (this.searchTerm) {
        const search = this.searchTerm.toLowerCase();
        filtered = filtered.filter(witness =>
          witness.owner.toLowerCase().includes(search)
        );
      }
      
      // Sort witnesses
      filtered.sort((a, b) => {
        switch (this.sortBy) {
          case 'rank':
            return a.rank - b.rank;
          case 'votes':
            return parseFloat(b.votes) - parseFloat(a.votes);
          case 'name':
            return a.owner.localeCompare(b.owner);
          case 'missed':
            return (b.total_missed || 0) - (a.total_missed || 0);
          case 'version':
            return (b.running_version || '').localeCompare(a.running_version || '');
          default:
            return a.rank - b.rank;
        }
      });
      
      return filtered;
    },
    
    activeWitnesses() {
      return (this.witnesses || []).filter(w => w.rank <= 20);
    },
    
    backupWitnesses() {
      return (this.witnesses || []).filter(w => w.rank > 20 && w.rank <= 100);
    },
    
    totalWitnessVotes() {
      return (this.witnesses || []).reduce((sum, w) => sum + parseFloat(w.votes || 0), 0);
    },
    
    nextWitnessTime() {
      // Estimate time until next witness produces a block (3 seconds per block)
      return "~3 seconds";
    },

    nextWitness() {
      if (!this.current_witness || !this.witnessSchedule) {
        return 'Loading...';
      }
      
      // Check different possible structures for witness schedule
      const shuffled = this.witnessSchedule.current_shuffled_witnesses || 
                      this.witnessSchedule.shuffled_witnesses ||
                      [];
      
      if (!shuffled.length) {
        return this.current_witness; // Just show current if no schedule available
      }
      
      const currentIndex = shuffled.indexOf(this.current_witness);
      if (currentIndex === -1) {
        return shuffled[0] || 'Unknown'; // Return first witness if current not found
      }
      const nextIndex = (currentIndex + 1) % shuffled.length;
      return shuffled[nextIndex];
    },

    averageHivePrice() {
      const activeWitnesses = this.witnesses.filter(w => w.rank <= 20 && w.hbd_exchange_rate);
      if (activeWitnesses.length === 0) return 0;
      
      const totalPrice = activeWitnesses.reduce((sum, witness) => {
        const price = parseFloat(this.getHivePrice(witness.hbd_exchange_rate));
        return sum + (isNaN(price) ? 0 : price);
      }, 0);
      
      return totalPrice / activeWitnesses.length;
    },

    medianHbdInterestRate() {
      const activeWitnesses = this.witnesses.filter(w => w.rank <= 20 && w.props && w.props.hbd_interest_rate !== undefined);
      if (activeWitnesses.length === 0) return 0;

      const rates = activeWitnesses.map(w => w.props.hbd_interest_rate).sort((a, b) => a - b);
      const mid = Math.floor(rates.length / 2);

      const medianRate = rates.length % 2 !== 0 ? rates[mid] : (rates[mid - 1] + rates[mid]) / 2;
      
      return medianRate / 100; // Convert from basis points to percentage
    }
  },
});

// Register components
app.component('nav-vue', Navue);
app.component('foot-vue', FootVue);
app.component('detail-vue', DetailVue);

// Mount the app
app.mount('#app');