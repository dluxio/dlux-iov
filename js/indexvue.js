import Vue from "https://cdn.jsdelivr.net/npm/vue@2.6.14/dist/vue.esm.browser.js";
import Navue from "/js/navue.js";
import FootVue from "/js/footvue.js";

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
    lapi = "https://spkgiles.hivehoneycomb.com/";
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
  lapi == "https://spkgiles.hivehoneycomb.com/" ||
  lapi == "https://duat.hivehoneycomb.com"
) {
  console.log("using defaults");
  //window.history.replaceState(null, null, "dex");
}
let user = localStorage.getItem("user") || "GUEST";
let hapi = localStorage.getItem("hapi") || "https://hive-api.dlux.io";
console.log({
  lapi,
});

// createApp({ // vue 3
var app = new Vue({
  // vue 2
  el: "#app", // vue 2
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
      accountapi: {},
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
    };
  },
  beforeDestroy() {
  },
  components: {
    "nav-vue": Navue,
    "foot-vue": FootVue,
  },
  methods: {
    checkAccount(name, key) {
      fetch("https://hive-api.dlux.io", {
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
      fetch("https://hive-api.dlux.io", {
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
        prompt("Please enter your API", "https://spkgiles.hivehoneycomb.com/");
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
    getQuotes() {
      fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=hive&amp;vs_currencies=usd"
      )
        .then((response) => response.json())
        .then((data) => {
          this.hiveprice = data;
        });
      fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=hive_dollar&amp;vs_currencies=usd"
      )
        .then((response) => response.json())
        .then((data) => {
          this.hbdprice = data;
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
    getHiveUser(user) { },
  },
  mounted() {
    this.getQuotes();
    this.getNodes();
    this.getProtocol();
    this.getTickers();
    this.getHiveStats();
    this.getDluxStats();
  },
  computed: {
    reward:{
      get(){
        return this.formatNumber(parseFloat(this.hivestats.pending_rewarded_vesting_hive) * this.hiveprice.hive.usd * 2,0, ".", ",")
      }
    }
  },
});