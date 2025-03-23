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
  //window.history.replaceState(null, null, "dex?api=" + lapi);
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
        DLUX: {
          change: "",
          tick: "",
        },
        DUAT: {
          change: "",
          tick: "",
        },
        LARYNX: {
          change: "",
          tick: "",
        },
      },
      lapi: lapi,
      hapi: hapi,
      accountapi: {},
      hivestats: {},
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
      rcCost: {
        time: 0,
        claim_account_operation: {"operation":"claim_account_operation","rc_needed":"11789110900859","hp_needed":6713.599180835442}
      },
    };
  },
  beforeDestroy() {},
  components: {
    "nav-vue": Navue,
    "foot-vue": FootVue,
  },
  methods: {
    makeQr(ref, link = "test", opts = {}){
      var qrcode = new QRCode(this.$refs[ref], opts);
      qrcode.makeCode(link);
    },
    rcCosts() {
      this.rcCost = JSON.parse(localStorage.getItem("rcCosts")) || {
        time: 0,
        claim_account_operation: {"operation":"claim_account_operation","rc_needed":"11789110900859","hp_needed":6713.599180835442}
      };
      if(this.rcCost.time < new Date().getTime() - 86400000)fetch("https://beacon.peakd.com/api/rc/costs")
        .then((r) => {
          return r.json();
        })
        .then((re) => {
          console.log(re.costs)
          for(var i = 0; i < re.costs.length; i++){
            this.rcCost[re.costs[i].operation] = re.costs[i].rc_needed
          }
          this.rcCost.time = new Date().getTime();
          localStorage.setItem("rcCost", JSON.stringify(this.rcCost));
        });
    },
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
    claimACT(){
        console.log("OK");
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
    removeOp(txid) {
      if (this.toSign.txid == txid) {
        this.toSign = {};
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
    getTickers() {
      fetch("https://data.dlux.io/hc/tickers")
        .then((response) => response.json())
        .then((data) => {
          var tickers = {};
          for (var i = 0; i < data.tickers.length; i++) {
            tickers[data.tickers[i].token] = data.tickers[i];
          }
          this.tickers = tickers;
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
          //   fetch(this.lapi + "/api/recent/HIVE_" + this.TOKEN + "?limit=1000")
          //     .then((response) => response.json())
          //     .then((data) => {
          //       this.volume.hive =
          //         data.recent_trades.reduce((a, b) => {
          //           if (b.trade_timestamp > this.agoTime)
          //             return a + parseInt(parseFloat(b.target_volume) * 1000);
          //           else return a;
          //         }, 0) / 1000;
          //       this.volume.token_hive =
          //         data.recent_trades.reduce((a, b) => {
          //           if (b.trade_timestamp > this.agoTime)
          //             return a + parseInt(parseFloat(b.base_volume) * 1000);
          //           else return a;
          //         }, 0) / 1000;
          //       this.recenthive = data.recent_trades.sort((a, b) => {
          //         return (
          //           parseInt(b.trade_timestamp) - parseInt(a.trade_timestamp)
          //         );
          //       });
          //     });
          //   fetch(this.lapi + "/api/recent/HBD_" + this.TOKEN + "?limit=1000")
          //     .then((response) => response.json())
          //     .then((data) => {
          //       this.volume.hbd =
          //         data.recent_trades.reduce((a, b) => {
          //           if (b.trade_timestamp > this.agoTime)
          //             return a + parseInt(parseFloat(b.target_volume) * 1000);
          //           else return a;
          //         }, 0) / 1000;
          //       this.volume.token_hbd =
          //         data.recent_trades.reduce((a, b) => {
          //           if (b.trade_timestamp > this.agoTime)
          //             return a + parseInt(parseFloat(b.base_volume) * 1000);
          //           else return a;
          //         }, 0) / 1000;
          //       this.recenthbd = data.recent_trades.sort((a, b) => {
          //         return (
          //           parseInt(b.trade_timestamp) - parseInt(a.trade_timestamp)
          //         );
          //       });
          //     });
        });
    },
    removeUser() {
      //   this.balance = 0;
      //   this.bartoken = "";
      //   this.barpow = "";
      //   this.bargov = "";
      this.accountapi = "";
      //   this.hasDrop = false;
      //   this.openorders = [];
      this.accountinfo = {};
      //   this.barhive = "";
      //   this.barhbd = "";
    },
    getTokenUser(user) {
      //   if (user)
      //     fetch(this.lapi + "/@" + user)
      //       .then((response) => response.json())
      //       .then((data) => {
      //         this.balance = (data.balance / 1000).toFixed(3);
      //         this.bartoken = this.balance;
      //         this.barpow = (
      //           (data.poweredUp + data.granted - data.granting) /
      //           1000
      //         ).toFixed(3);
      //         this.bargov = (data.gov / 1000).toFixed(3);
      //         this.accountapi = data;
      //         if (
      //           new Date().getMonth() + 1 !=
      //             parseInt(data.drop?.last_claim, 16) &&
      //           data.drop?.availible.amount > 0
      //         ) {
      //           this.hasDrop = true;
      //           this.dropnai = `${parseFloat(
      //             data.drop.availible.amount /
      //               Math.pow(10, data.drop.availible.precision)
      //           ).toFixed(data.drop.availible.precision)} ${
      //             data.drop.availible.token
      //           }`;
      //         }
      //         this.openorders = data.contracts.reduce((acc, cur) => {
      //           cur.nai = `${
      //             cur.type.split(":")[0] == "hive"
      //               ? parseFloat(cur.hive / 1000).toFixed(3)
      //               : parseFloat(cur.hbd / 1000).toFixed(3)
      //           } ${cur.type.split(":")[0] == "hive" ? "HIVE" : "HBD"}`;
      //           if (
      //             cur.partials &&
      //             cur.partials.length &&
      //             cur.type.split(":")[1] == "sell"
      //           ) {
      //             const filled = cur.partials.reduce(function (a, c) {
      //               return a + c.coin;
      //             }, 0);
      //             cur.percentFilled = parseFloat(
      //               (100 * filled) / (cur.hive ? cur.hive : cur.hbd + filled)
      //             ).toFixed(2);
      //             acc.push(cur);
      //           } else if (cur.partials && cur.partials.length) {
      //             const filled = cur.partials.reduce(function (a, c) {
      //               return a + c.token;
      //             }, 0);
      //             cur.percentFilled = parseFloat(
      //               (100 * filled) / (cur.amount + filled)
      //             ).toFixed(2);
      //             acc.push(cur);
      //           } else {
      //             cur.percentFilled = "0.00";
      //             acc.push(cur);
      //           }
      //           console.log({
      //             acc,
      //           });
      //           return acc;
      //         }, []);
      //       });
    },
    getHiveStats() {
      fetch(hapi, {
        body: `{"jsonrpc":"2.0", "method":"condenser_api.get_chain_properties", "params":[], "id":1}`,
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
    getHiveUser(user = this.account) {
      console.log("hive info", user);
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
        //   this.barhive = this.accountinfo.balance;
        //   this.denoms.HIVE.balance = `${this.formatNumber(
        //     parseFloat(this.accountinfo.balance).toFixed(3),
        //     3,
        //     ".",
        //     ","
        //   )} HIVE`;
        //   this.barhbd = this.accountinfo.hbd_balance;
        //   this.denoms.HBD.balance = `${this.formatNumber(
        //     parseFloat(this.accountinfo.hbd_balance).toFixed(3),
        //     3,
        //     ".",
        //     ","
        //   )} HBD`;
          var pfp = "";
          try {
            pfp = this.accountinfo.posting_json_metadata.profile.profile_image;
          } catch (e) {}
          const total_vests =
            parseInt(this.accountinfo.vesting_shares) +
            parseInt(this.accountinfo.received_vesting_shares) -
            parseInt(this.accountinfo.delegated_vesting_shares);
          const final_vest = total_vests * 1000000;
          const power =
            (parseInt(this.accountinfo.voting_power) * 10000) / 10000 / 50;
          this.accountinfo.rshares = (power * final_vest) / 10000;
        });
    },
  },
  mounted() {
    //this.getQuotes();
    //this.getNodes();
    //get query params
    var follow = this.account ? `https://dlux.io/@${this.account}?follow=true` : 'https://dlux.io'
    this.rcCosts()
    this.makeQr('qrcode', follow)
    this.getProtocol();
    this.getHiveStats();
    // if (user != "GUEST") this.getTokenUser(user);
    this.getHiveUser(user);
  },
  computed: {
    canClaim: {
      get() {
        return this.account?.rcs > this.rcCost["claim_account_operation"] ? true : false
      },
    }
  },
});
