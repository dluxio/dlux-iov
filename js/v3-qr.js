import Vue from "https://cdn.jsdelivr.net/npm/vue@2.6.14/dist/vue.esm.browser.js";
import Navue from "/js/v3-nav.js";
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
      // New Onboarding System Data
      onboardingStep: 1,
      newAccount: {
        username: '',
        keys: {},
        publicKeys: {},
        recoveryMethod: null
      },
      usernameStatus: '', // 'checking', 'available', 'taken', 'invalid'
      usernameError: '',
      usernameCheckTimeout: null,
      detectedWallets: [],
      selectedWallet: null,
      keyGenMethod: 'random', // 'wallet' or 'random'
      keyGenLoading: false,
      showKeys: false,
      
      // Privacy and Terms
      agreedToPrivacy: false,
      agreedToTerms: false,
      paymentMethod: 'manual', // 'crypto', 'request', 'manual'
      requestUsername: '',
      requestMessage: '',
      accountCreated: false,
      cryptoPricing: [],
      cryptoPricingLoading: false,
      cryptoPricingError: null,
      hivePriceUSD: 0,
      accountCreationCostUSD: 0,
      baseCostUSD: 0,
      lastPricingUpdate: null,
      pricingLoading: false,
      pricingError: null,
      paymentLoading: false,
      paymentError: null,
      paymentDetails: null,
      
      // WebSocket Payment Monitoring
      ws: null,
      wsConnectionStatus: 'disconnected', // 'connected', 'connecting', 'disconnected'
      wsReconnectAttempts: 0,
      wsMaxReconnectAttempts: 5,
      paymentChannelId: null,
      paymentStatus: {
        code: 'initializing',
        message: '⚡ Initializing...',
        details: 'Setting up payment channel...',
        progress: 0
      },
      paymentLogs: [],
      paymentCountdown: null,
      userTxHash: '',
      paymentSentMarked: false,
      
      // Payment UI state  
      showPaymentQR: false,
      walletPaymentLoading: false,
      
      // Key Recovery state
      recoveryMode: false,
      recoveryStep: 1,
      recoveryLoading: false,
      recoveryError: null,
      recoveryData: {
        username: '',
        selectedWallet: null,
        message: ''
      },
      recoveredKeys: {},
      showRecoveredKeys: false,
    };
  },
  beforeDestroy() {
    // Clean up WebSocket connection
    if (this.ws) {
      this.ws.close();
    }
    this.stopWebSocketPing();
    this.stopCountdown();
  },
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
      fetch("https://api.hive.blog", {
        method: "POST",
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "condenser_api.get_accounts",
          params: [[user]],
          id: 1,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("ddata");
          console.log(data);
          if (data.result[0]) {
            this.accountinfo = data.result[0];
          }
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    },
    
    // ===========================================
    // NEW ONBOARDING METHODS
    // ===========================================
    
    // Wallet Detection Methods
    detectWallets() {
      this.detectedWallets = [];
      
      // Check for MetaMask
      if (typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask) {
        this.detectedWallets.push({
          name: 'MetaMask',
          network: 'Ethereum',
          icon: '/img/wallets/metamask.svg',
          provider: window.ethereum
        });
      }
      
      // Check for Phantom (Solana)
      if (window.solana && window.solana.isPhantom) {
        this.detectedWallets.push({
          name: 'Phantom',
          network: 'Solana',
          icon: '/img/wallets/phantom.svg',
          provider: window.solana
        });
      }
      
      // Check for Coinbase Wallet
      if (window.ethereum && window.ethereum.isCoinbaseWallet) {
        this.detectedWallets.push({
          name: 'Coinbase Wallet',
          network: 'Ethereum',
          icon: '/img/wallets/coinbase.svg',
          provider: window.ethereum
        });
      }
      
      // Check for Trust Wallet
      if (window.ethereum && window.ethereum.isTrust) {
        this.detectedWallets.push({
          name: 'Trust Wallet',
          network: 'Multi-chain',
          icon: '/img/wallets/trust.svg',
          provider: window.ethereum
        });
      }
      
      // Check for WalletConnect
      if (window.WalletConnect) {
        this.detectedWallets.push({
          name: 'WalletConnect',
          network: 'Multi-chain',
          icon: '/img/wallets/walletconnect.svg',
          provider: null
        });
      }
      
      console.log('Detected wallets:', this.detectedWallets);
    },
    
    selectWallet(walletName) {
      this.selectedWallet = walletName;
      // Auto-select wallet method if wallet is selected
      if (this.detectedWallets.length > 0) {
        this.keyGenMethod = 'wallet';
      }
    },
    
    // Username Validation Methods
    async checkUsernameAvailability() {
      const username = this.newAccount.username.toLowerCase().trim();
      
      // Clear previous timeout
      if (this.usernameCheckTimeout) {
        clearTimeout(this.usernameCheckTimeout);
      }
      
      // Reset status
      this.usernameStatus = '';
      this.usernameError = '';
      
      // Basic validation
      if (!username) {
        return;
      }
      
      if (username.length < 3 || username.length > 16) {
        this.usernameStatus = 'invalid';
        this.usernameError = 'Username must be 3-16 characters long';
        return;
      }
      
      if (!/^[a-z0-9.-]+$/.test(username)) {
        this.usernameStatus = 'invalid';
        this.usernameError = 'Only lowercase letters, numbers, dots, and hyphens allowed';
        return;
      }
      
      if (username.startsWith('.') || username.endsWith('.') || 
          username.startsWith('-') || username.endsWith('-')) {
        this.usernameStatus = 'invalid';
        this.usernameError = 'Username cannot start or end with dots or hyphens';
        return;
      }
      
      // Set checking status
      this.usernameStatus = 'checking';
      
      // Debounce the API call
      this.usernameCheckTimeout = setTimeout(async () => {
        try {
          const response = await fetch("https://api.hive.blog", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              jsonrpc: "2.0",
              method: "condenser_api.get_accounts",
              params: [[username]],
              id: 1
            }),
          });
          
          const data = await response.json();
          
          if (data.result && data.result.length > 0) {
            this.usernameStatus = 'taken';
          } else {
            this.usernameStatus = 'available';
            this.newAccount.username = username; // Store the validated username
          }
        } catch (error) {
          console.error('Username check failed:', error);
          this.usernameStatus = 'invalid';
          this.usernameError = 'Failed to check username availability';
        }
      }, 500);
    },
    
    // Key Generation Methods
    async generateKeys() {
      // Check privacy and terms agreement
      if (!this.agreedToPrivacy || !this.agreedToTerms) {
        alert('Please agree to the Privacy Policy and Terms of Service before generating keys.');
        return;
      }

      this.keyGenLoading = true;
      
      try {
        if (this.keyGenMethod === 'wallet' && this.selectedWallet) {
          await this.generateKeysFromWallet();
        } else {
          await this.generateRandomKeys();
        }
        
        // Store in dluxPEN immediately after generation
        await this.storeNewAccountInPEN();
        
        // Don't automatically move to step 3 - user must review keys first
        this.showKeys = false; // Keys hidden by default
        
      } catch (error) {
        console.error('Key generation failed:', error);
        alert('Failed to generate keys: ' + error.message);
      } finally {
        this.keyGenLoading = false;
      }
    },
    
    cancelKeyGeneration() {
      this.keyGenLoading = false;
      this.selectedWallet = null;
      // Clear any generated keys
      this.newAccount.keys = {};
      this.newAccount.publicKeys = {};
      this.newAccount.recoveryMethod = null;
      this.showKeys = false;
      // Go back to wallet selection
      this.keyGenMethod = 'random';
    },
    
    async generateKeysFromWallet() {
      const wallet = this.detectedWallets.find(w => w.name === this.selectedWallet);
      if (!wallet) {
        throw new Error('Selected wallet not found');
      }
      
      try {
        let signature;
        const message = `Generate HIVE keys for account: ${this.newAccount.username}`;
        
        if (wallet.name === 'Phantom' && window.solana) {
          // Solana wallet signature
          await window.solana.connect();
          const encodedMessage = new TextEncoder().encode(message);
          const signResult = await window.solana.signMessage(encodedMessage, "utf8");
          signature = Array.from(signResult.signature);
        } else if (window.ethereum) {
          // Ethereum-based wallet signature
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          signature = await window.ethereum.request({
            method: 'personal_sign',
            params: [message, accounts[0]],
          });
        } else {
          throw new Error('Wallet not supported for key generation');
        }
        
        // Generate HIVE keys from signature
        const keys = this.deriveHiveKeysFromSignature(signature, this.newAccount.username);
        this.newAccount.keys = keys.private;
        this.newAccount.keys.master = keys.seed; // Add master/seed to keys
        this.newAccount.publicKeys = keys.public;
        this.newAccount.recoveryMethod = {
          type: 'wallet',
          wallet: this.selectedWallet,
          message: message
        };
        
        console.log('Keys generated from wallet signature');
        
      } catch (error) {
        console.error('Wallet key generation failed:', error);
        throw new Error('Failed to generate keys from wallet: ' + error.message);
      }
    },
    
    async generateRandomKeys() {
      try {
        // Generate random master password
        const masterPassword = this.generateSecureRandom(32);
        
        // Generate HIVE keys using dhive
        const keys = this.deriveHiveKeysFromSeed(masterPassword, this.newAccount.username);
        this.newAccount.keys = keys.private;
        this.newAccount.keys.master = masterPassword; // Add master password to keys
        this.newAccount.publicKeys = keys.public;
        this.newAccount.recoveryMethod = {
          type: 'random',
          masterPassword: masterPassword // Store for recovery (will be encrypted)
        };
        
        console.log('Random keys generated');
        
      } catch (error) {
        console.error('Random key generation failed:', error);
        throw new Error('Failed to generate random keys: ' + error.message);
      }
    },
    
    deriveHiveKeysFromSignature(signature, username) {
      // Convert signature to hex string if it's an array
      let sigHex = Array.isArray(signature) ? 
        signature.map(b => b.toString(16).padStart(2, '0')).join('') : 
        signature.replace('0x', '');
      
      // Create a deterministic seed from signature and username
      const seed = CryptoJS.SHA256(sigHex + username).toString();
      
      const keys = this.deriveHiveKeysFromSeed(seed, username);
      keys.seed = seed; // Include the seed for master password
      return keys;
    },
    
    deriveHiveKeysFromSeed(seed, username) {
      const roles = ['posting', 'active', 'owner', 'memo'];
      const privateKeys = {};
      const publicKeys = {};
      
      roles.forEach(role => {
        // Create role-specific seed
        const roleSeed = CryptoJS.SHA256(seed + role + username).toString();
        
        // Generate private key using dhive
        const privateKey = dhive.PrivateKey.fromSeed(roleSeed);
        const publicKey = privateKey.createPublic();
        
        privateKeys[role] = privateKey.toString();
        publicKeys[role] = publicKey.toString();
      });
      
      return { private: privateKeys, public: publicKeys };
    },
    
    generateSecureRandom(length) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
      const array = new Uint8Array(length);
      crypto.getRandomValues(array);
      
      return Array.from(array, byte => chars[byte % chars.length]).join('');
    },
    
         // dluxPEN Integration Methods
     async storeNewAccountInPEN() {
       try {
         // Get reference to nav component and call its method directly
         const navComponent = this.$refs.navComponent || this.$children.find(child => child.$options.name === 'nav-vue');
         
         if (navComponent && navComponent.storeNewAccount) {
           await navComponent.storeNewAccount({
             username: this.newAccount.username,
             keys: this.newAccount.keys,
             publicKeys: this.newAccount.publicKeys,
             recoveryMethod: this.newAccount.recoveryMethod,
             isPendingCreation: true
           });
         } else {
           // Fallback: trigger PEN setup if nav component not found
           console.warn('Nav component not found, triggering PEN setup');
           // Store data temporarily in localStorage for nav component to pick up
           localStorage.setItem('pendingNewAccount', JSON.stringify({
             username: this.newAccount.username,
             keys: this.newAccount.keys,
             publicKeys: this.newAccount.publicKeys,
             recoveryMethod: this.newAccount.recoveryMethod,
             isPendingCreation: true
           }));
         }
         
         console.log('New account stored in dluxPEN');
       } catch (error) {
         console.error('Failed to store account in PEN:', error);
         throw error;
       }
     },
    
    // Payment and Account Creation Methods
    async initiateCryptoPayment(crypto) {
      this.paymentLoading = true;
      this.paymentError = null;
      this.addPaymentLog('Initiating payment channel...', 'info');
      
      try {
        console.log('Initiating crypto payment for:', crypto.symbol);
        
        // Use correct API URL based on environment
        const apiHost = 'data.dlux.io';
        const apiProtocol = 'https:'
        const apiUrl = `${apiProtocol}//${apiHost}/api/onboarding/payment/initiate`;
        console.log('API URL:', apiUrl);
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: this.newAccount.username,
            cryptoType: crypto.symbol,
            publicKeys: this.newAccount.publicKeys
          })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Payment initiation response:', data);
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to initiate payment');
        }
        
        // Store channel ID for WebSocket monitoring
        this.paymentChannelId = data.payment.channelId;
        
        this.paymentDetails = {
          channelId: data.payment.channelId,
          cryptoType: crypto.symbol,
          amountFormatted: data.payment.amountFormatted,
          address: data.payment.address,
          memo: data.payment.memo,
          expiresAt: new Date(data.payment.expiresAt),
          instructions: data.payment.instructions || []
        };
        
        this.addPaymentLog(`Payment channel created: ${data.payment.channelId}`, 'success');
        this.addPaymentLog(`Amount required: ${data.payment.amountFormatted}`, 'info');
        
        // Initialize WebSocket connection for real-time monitoring
        this.initializeWebSocket();
        
        console.log('Payment details set:', this.paymentDetails);
        
      } catch (error) {
        console.error('Error initiating crypto payment:', error);
        this.paymentError = error.message;
        this.addPaymentLog(`Error: ${error.message}`, 'error');
      } finally {
        this.paymentLoading = false;
      }
    },
    
    // WebSocket Payment Monitoring Methods
    initializeWebSocket() {
      if (this.ws) {
        this.ws.close();
      }
      
      this.wsConnectionStatus = 'connecting';
      this.addPaymentLog('Connecting to payment monitor...', 'info');
      
      try {
        // Use correct WebSocket URL based on environment
        const wsProtocol = 'wss:'
        const wsHost = 'data.dlux.io';
        const wsUrl = `${wsProtocol}//${wsHost}/ws/payment-monitor`;
        console.log('Connecting to WebSocket:', wsUrl);
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
          this.wsConnectionStatus = 'connected';
          this.wsReconnectAttempts = 0;
          this.addPaymentLog('Connected to real-time payment monitor', 'success');
          
          // Subscribe to our payment channel
          if (this.paymentChannelId) {
            this.ws.send(JSON.stringify({
              type: 'subscribe',
              channelId: this.paymentChannelId
            }));
            this.addPaymentLog(`Subscribed to channel: ${this.paymentChannelId}`, 'info');
          }
          
          // Start ping to keep connection alive
          this.startWebSocketPing();
        };
        
        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleWebSocketMessage(data);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
            this.addPaymentLog('Failed to parse WebSocket message', 'error');
          }
        };
        
        this.ws.onclose = () => {
          this.wsConnectionStatus = 'disconnected';
          this.addPaymentLog('Disconnected from payment monitor', 'warning');
          this.stopWebSocketPing();
          this.attemptWebSocketReconnect();
        };
        
        this.ws.onerror = (error) => {
          this.addPaymentLog('WebSocket connection error', 'error');
          console.error('WebSocket error:', error);
        };
        
      } catch (error) {
        this.wsConnectionStatus = 'disconnected';
        this.addPaymentLog(`Failed to connect: ${error.message}`, 'error');
        console.error('WebSocket connection failed:', error);
      }
    },
    
    handleWebSocketMessage(data) {
      console.log('WebSocket message received:', data);
      
      switch (data.type) {
        case 'connected':
          this.addPaymentLog('WebSocket handshake completed', 'success');
          break;
          
        case 'status_update':
          this.updatePaymentStatus(data);
          break;
          
        case 'payment_sent_confirmed':
          this.addPaymentLog(`Payment transaction recorded: ${data.txHash.substring(0, 10)}...`, 'success');
          break;
          
        case 'error':
          this.addPaymentLog(`Server error: ${data.message}`, 'error');
          break;
          
        case 'pong':
          // Keep-alive response
          break;
          
        default:
          this.addPaymentLog(`Unknown message type: ${data.type}`, 'warning');
      }
    },
    
    updatePaymentStatus(data) {
      const { status, message, details, progress, channel } = data;
      
      // Update status
      this.paymentStatus = {
        code: status,
        message: message,
        details: details,
        progress: progress
      };
      
      // Update countdown if payment is waiting
      if (channel && channel.expiresAt) {
        this.updateCountdown(channel.expiresAt);
      }
      
      // Handle specific status changes
      switch (status) {
        case 'waiting_payment':
          this.addPaymentLog('Waiting for payment...', 'info');
          break;
          
        case 'payment_detected':
          this.addPaymentLog('Payment detected! Waiting for confirmations...', 'success');
          break;
          
        case 'confirming':
          const confirmations = channel.confirmations || 0;
          this.addPaymentLog(`Transaction confirming... (${confirmations} confirmations)`, 'info');
          break;
          
        case 'confirmed':
          this.addPaymentLog('Payment confirmed! Creating HIVE account...', 'success');
          break;
          
        case 'creating_account':
          this.addPaymentLog('Creating your HIVE account...', 'info');
          break;
          
        case 'completed':
          this.addPaymentLog(`🎉 Account @${this.newAccount.username} created successfully!`, 'success');
          this.accountCreated = true;
          this.onboardingStep = 4;
          this.stopCountdown();
          break;
          
        case 'failed':
          this.addPaymentLog('Account creation failed', 'error');
          this.stopCountdown();
          break;
          
        case 'expired':
          this.addPaymentLog('Payment window expired', 'error');
          this.stopCountdown();
          break;
      }
    },
    
    markPaymentSent() {
      if (this.ws && this.ws.readyState === WebSocket.OPEN && this.paymentChannelId) {
        this.ws.send(JSON.stringify({
          type: 'payment_sent',
          channelId: this.paymentChannelId,
          txHash: this.userTxHash || null
        }));
        
        const logMessage = this.userTxHash 
          ? `Marked payment as sent with TX: ${this.userTxHash.substring(0, 10)}...`
          : 'Marked payment as sent';
        this.addPaymentLog(logMessage, 'info');
        this.paymentSentMarked = true;
      }
    },
    
    attemptWebSocketReconnect() {
      if (this.wsReconnectAttempts >= this.wsMaxReconnectAttempts) {
        this.addPaymentLog('Maximum reconnection attempts reached', 'error');
        return;
      }
      
      this.wsReconnectAttempts++;
      const delay = 2000 * Math.pow(2, this.wsReconnectAttempts - 1);
      
      this.addPaymentLog(`Attempting to reconnect in ${delay/1000}s... (${this.wsReconnectAttempts}/${this.wsMaxReconnectAttempts})`, 'warning');
      
      setTimeout(() => {
        this.initializeWebSocket();
      }, delay);
    },
    
    startWebSocketPing() {
      this.pingInterval = setInterval(() => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);
    },
    
    stopWebSocketPing() {
      if (this.pingInterval) {
        clearInterval(this.pingInterval);
        this.pingInterval = null;
      }
    },
    
    updateCountdown(expiresAt) {
      this.stopCountdown();
      
      const updateTimer = () => {
        const now = new Date();
        const expiry = new Date(expiresAt);
        const timeLeft = expiry - now;
        
        if (timeLeft <= 0) {
          this.paymentCountdown = null;
          this.stopCountdown();
          return;
        }
        
        this.paymentCountdown = {
          timeLeft: timeLeft,
          hours: Math.floor(timeLeft / (1000 * 60 * 60)),
          minutes: Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((timeLeft % (1000 * 60)) / 1000)
        };
      };
      
      updateTimer();
      this.countdownInterval = setInterval(updateTimer, 1000);
    },
    
    stopCountdown() {
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
      }
    },
    
    addPaymentLog(message, type = 'info') {
      this.paymentLogs.push({
        timestamp: new Date().toISOString(),
        message: message,
        type: type
      });
      
      // Keep only last 50 log entries
      if (this.paymentLogs.length > 50) {
        this.paymentLogs = this.paymentLogs.slice(-50);
      }
      
      console.log(`[Payment Log ${type.toUpperCase()}] ${message}`);
    },
    
    formatLogTime(timestamp) {
      return new Date(timestamp).toLocaleTimeString();
    },
    
    formatCountdown(timeLeft) {
      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
      return `${hours}h ${minutes}m ${seconds}s`;
    },
    
    async sendAccountRequest() {
      try {
        // Use correct API URL based on environment
        const apiHost = 'data.dlux.io';
        const apiProtocol = 'https:'
        const apiUrl = `${apiProtocol}//${apiHost}/api/onboarding/request/send`;
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requesterUsername: this.newAccount.username,
            requestedFrom: this.requestUsername,
            message: this.requestMessage,
            publicKeys: this.newAccount.publicKeys
          })
        });
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error);
        }
        
        alert(`Account creation request sent to @${this.requestUsername}!\n\nRequest ID: ${data.requestId}\n\nThey will receive a notification to create your account. The request expires in 7 days.`);
        
        // Don't mark as created yet - wait for friend to actually create it
        // You could add polling here to check if the request was accepted
        
      } catch (error) {
        console.error('Failed to send account request:', error);
        alert('Failed to send request: ' + error.message);
      }
    },
    
    showPublicKeys() {
      const publicKeysText = Object.entries(this.newAccount.publicKeys)
        .map(([role, key]) => `${role.toUpperCase()}: ${key}`)
        .join('\n');
      
      const blob = new Blob([
        `Public Keys for @${this.newAccount.username}\n\n${publicKeysText}\n\n` +
        `Use these public keys when creating your account manually.\n` +
        `Keep your private keys safe in dluxPEN!`
      ], { type: 'text/plain' });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.newAccount.username}-public-keys.txt`;
      a.click();
      URL.revokeObjectURL(url);
    },
    
    generateFriendQR() {
      try {
        // Create account creation data for Hive Keychain
        const accountCreationData = {
          type: 'account_creation',
          username: this.newAccount.username,
          publicKeys: this.newAccount.publicKeys,
          creator: 'friend', // Will be filled by friend's keychain
          fee: '3.000 HIVE', // Standard account creation fee
          source: 'dlux.io'
        };
        
        const qrData = JSON.stringify(accountCreationData);
        
        // Clear previous QR code
        const qrContainer = document.getElementById('friendQrCode');
        qrContainer.innerHTML = '';
        
        // Generate new QR code
        const qrCode = new QRCode(qrContainer, {
          text: qrData,
          width: 200,
          height: 200,
          colorDark: '#000000',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.M
        });
        
        console.log('Friend QR code generated');
        
        // Show feedback
        const originalButton = event.target;
        const originalText = originalButton.innerHTML;
        originalButton.innerHTML = '<i class="fa-solid fa-check"></i> QR Generated!';
        originalButton.disabled = true;
        setTimeout(() => {
          originalButton.innerHTML = originalText;
          originalButton.disabled = false;
        }, 2000);
        
      } catch (error) {
        console.error('Failed to generate friend QR code:', error);
        alert('Failed to generate QR code: ' + error.message);
      }
    },
    
    // UI Helper Methods
    toggleKeysVisibility() {
      this.showKeys = !this.showKeys;
    },
    
    async copyToClipboard(text) {
      try {
        await navigator.clipboard.writeText(text);
        // Show feedback
        const originalText = event.target.innerHTML;
        event.target.innerHTML = '<i class="fa-solid fa-check"></i>';
        setTimeout(() => {
          event.target.innerHTML = originalText;
        }, 1000);
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    },
    
    downloadBackup() {
      try {
        const backupData = {
          account: this.newAccount.username,
          generated: new Date().toISOString(),
          warning: '⚠️  SECURITY WARNING: This file contains your private keys. Keep it secure and delete after importing to a secure wallet!',
          keys: {
            posting: this.newAccount.keys.posting,
            active: this.newAccount.keys.active,
            memo: this.newAccount.keys.memo,
            owner: this.newAccount.keys.owner,
            master: this.newAccount.keys.master
          },
          publicKeys: this.newAccount.publicKeys,
          recoveryMethod: this.newAccount.recoveryMethod,
          instructions: {
            'What is this?': 'This file contains your HIVE account private keys',
            'Keep it safe': 'Anyone with these keys can control your account',
            'Recovery': this.newAccount.recoveryMethod.type === 'wallet' 
              ? `You can regenerate these keys by signing the message "${this.newAccount.recoveryMethod.message}" with your ${this.newAccount.recoveryMethod.wallet} wallet`
              : 'Use the master password to regenerate your keys if needed',
            'Next steps': 'Import these keys into a secure wallet like Hive Keychain or store them in dluxPEN'
          }
        };
        
        const dataStr = JSON.stringify(backupData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `hive-backup-${this.newAccount.username}-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        
        // Show feedback
        const originalButton = event.target;
        const originalText = originalButton.innerHTML;
        originalButton.innerHTML = '<i class="fa-solid fa-check"></i> Downloaded!';
        originalButton.disabled = true;
        setTimeout(() => {
          originalButton.innerHTML = originalText;
          originalButton.disabled = false;
        }, 2000);
        
        console.log('Backup file downloaded');
        
      } catch (error) {
        console.error('Failed to download backup:', error);
        alert('Failed to download backup file: ' + error.message);
      }
    },
    
    completeOnboarding() {
      this.onboardingStep = 4;
    },
    
    async loginNewAccount() {
      try {
        // Emit login event with new account
        this.$emit('login', this.newAccount.username);
        
        // Reset onboarding state
        this.resetOnboardingState();
        
      } catch (error) {
        console.error('Failed to login to new account:', error);
        alert('Failed to login: ' + error.message);
      }
    },
    
    resetOnboardingState() {
      this.onboardingStep = 1;
      this.newAccount = {
        username: '',
        keys: {},
        publicKeys: {},
        recoveryMethod: null
      };
      this.usernameStatus = '';
      this.usernameError = '';
      this.selectedWallet = null;
      this.keyGenMethod = 'random';
      this.showKeys = false;
      this.paymentMethod = 'manual';
      this.requestUsername = '';
      this.requestMessage = '';
      this.accountCreated = false;
      this.showPaymentQR = false;
      this.walletPaymentLoading = false;
      this.paymentDetails = null;
      this.paymentChannelId = null;
      
      // Close WebSocket if open
      if (this.ws) {
        this.ws.close();
      }
    },
    
    // ===========================================
    // KEY RECOVERY METHODS
    // ===========================================
    
    startKeyRecovery() {
      this.recoveryMode = true;
      this.recoveryStep = 1;
      this.recoveryError = null;
      this.recoveredKeys = {};
      this.recoveryData = {
        username: '',
        selectedWallet: null,
        message: ''
      };
      
             // Auto-populate message template when username changes  
       this.$nextTick(() => {
         this.$watch('recoveryData.username', (newUsername) => {
           if (newUsername) {
             this.recoveryData.message = `Generate HIVE keys for account: ${newUsername}`;
           }
         });
       });
    },
    
    cancelKeyRecovery() {
      this.recoveryMode = false;
      this.recoveryStep = 1;
      this.recoveryError = null;
      this.recoveredKeys = {};
      this.showRecoveredKeys = false;
      this.recoveryData = {
        username: '',
        selectedWallet: null,
        message: ''
      };
    },
    
    async recoverKeys() {
      this.recoveryLoading = true;
      this.recoveryError = null;
      
      try {
        const wallet = this.detectedWallets.find(w => w.name === this.recoveryData.selectedWallet);
        if (!wallet) {
          throw new Error('Selected wallet not found');
        }
        
        const message = this.recoveryData.message;
        const username = this.recoveryData.username;
        
        console.log('Recovering keys with message:', message);
        
        let signature;
        
        if (wallet.name === 'Phantom' && window.solana) {
          // Solana wallet signature
          await window.solana.connect();
          const encodedMessage = new TextEncoder().encode(message);
          const signResult = await window.solana.signMessage(encodedMessage, "utf8");
          signature = Array.from(signResult.signature);
        } else if (window.ethereum) {
          // Ethereum-based wallet signature
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          signature = await window.ethereum.request({
            method: 'personal_sign',
            params: [message, accounts[0]],
          });
        } else {
          throw new Error('Wallet not supported for key recovery');
        }
        
        // Generate HIVE keys from signature (same process as original generation)
        const keys = this.deriveHiveKeysFromSignature(signature, username);
        
        // Store the recovered keys
        this.recoveredKeys = keys.private;
        
        // Store in dluxPEN
        const accountData = {
          username: username,
          keys: keys.private,
          publicKeys: keys.public,
          recoveryMethod: {
            type: 'wallet',
            wallet: this.recoveryData.selectedWallet,
            message: message
          }
        };
        
        await this.storeRecoveredAccountInPEN(accountData);
        
        console.log('Keys recovered successfully');
        
      } catch (error) {
        console.error('Key recovery failed:', error);
        this.recoveryError = error.message;
      } finally {
        this.recoveryLoading = false;
      }
    },
    
    async storeRecoveredAccountInPEN(accountData) {
      try {
        // Get reference to nav component and call its method directly
        const navComponent = this.$refs.navComponent || this.$children.find(child => child.$options.name === 'nav-vue');
        
        if (navComponent && navComponent.storeNewAccount) {
          await navComponent.storeNewAccount(accountData);
        } else {
          // Fallback: store in localStorage for nav component to pick up
          console.warn('Nav component not found, storing in localStorage for recovery');
          localStorage.setItem('recoveredAccount', JSON.stringify(accountData));
        }
        
        console.log('Recovered account stored in dluxPEN');
      } catch (error) {
        console.error('Failed to store recovered account in PEN:', error);
        throw error;
      }
    },
    
    completeKeyRecovery() {
      // Show success message
      alert(`Keys for @${this.recoveryData.username} have been successfully recovered and stored in dluxPEN!`);
      
      // Reset recovery state
      this.cancelKeyRecovery();
      
      // Optionally trigger login if the account exists
      this.$emit('login', this.recoveryData.username);
    },
    
    // Event handler for nav component
    handleStoreNewAccount(accountData) {
      console.log('Received store new account event:', accountData);
      // The nav component will handle the actual storage in dluxPEN
      // This confirms the storage was successful
    },
    
    async loadCryptoPricing() {
      this.pricingLoading = true;
      this.pricingError = null;
      
      try {
        console.log('Loading crypto pricing from backend...');
        // Use correct API URL based on environment
        const apiHost = 'data.dlux.io';
        const apiProtocol = 'https:';
        const apiUrl = `${apiProtocol}//${apiHost}/api/onboarding/pricing`;
        console.log('Pricing API URL:', apiUrl);
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Pricing API response:', data);
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to load pricing');
        }

        // Update pricing with new format
        if (data.pricing) {
          this.hivePriceUSD = data.pricing.hive_price_usd;
          this.accountCreationCostUSD = data.pricing.account_creation_cost_usd;
          this.baseCostUSD = data.pricing.base_cost_usd;
          this.lastPricingUpdate = new Date(data.pricing.timestamp);
          
          // Convert crypto_rates to the format expected by the UI
          this.cryptoPricing = [];
          for (const [symbol, rate] of Object.entries(data.pricing.crypto_rates || {})) {
            this.cryptoPricing.push({
              symbol: symbol,
              name: this.getCryptoName(symbol),
              network: this.getCryptoNetwork(symbol),
              currentPrice: rate.price_usd.toFixed(2),
              requiredAmount: rate.amount_needed.toFixed(this.getCryptoDecimals(symbol)),
              totalAmount: rate.total_amount.toFixed(this.getCryptoDecimals(symbol)),
              transferFee: rate.transfer_fee,
              icon: `/img/crypto/${symbol.toLowerCase()}.svg`,
              amountUSD: this.accountCreationCostUSD
            });
          }
          
          console.log('Processed pricing data:', {
            hivePriceUSD: this.hivePriceUSD,
            accountCostUSD: this.accountCreationCostUSD,
            baseCostUSD: this.baseCostUSD,
            cryptoOptions: this.cryptoPricing.length
          });
        }
        
      } catch (error) {
        console.error('Error loading pricing:', error);
        this.pricingError = error.message;
        
        // Use fallback data from API response or defaults
        if (data && data.fallback) {
          console.log('Using fallback pricing data');
          this.hivePriceUSD = data.fallback.hive_price_usd;
          this.accountCreationCostUSD = data.fallback.account_creation_cost_usd;
          
          this.cryptoPricing = [];
          for (const [symbol, rate] of Object.entries(data.fallback.crypto_rates || {})) {
            this.cryptoPricing.push({
              symbol: symbol,
              name: this.getCryptoName(symbol),
              network: this.getCryptoNetwork(symbol),
              currentPrice: rate.price_usd.toFixed(2),
              requiredAmount: rate.amount_needed.toFixed(this.getCryptoDecimals(symbol)),
              totalAmount: rate.total_amount.toFixed(this.getCryptoDecimals(symbol)),
              icon: `/img/crypto/${symbol.toLowerCase()}.svg`,
              fallback: true,
              amountUSD: this.accountCreationCostUSD
            });
          }
        } else {
          // Ultimate fallback
          this.hivePriceUSD = 0.30;
          this.accountCreationCostUSD = 3.00;
          this.cryptoPricing = [
            {
              symbol: 'SOL',
              name: 'Solana', 
              network: 'Solana',
              currentPrice: '100.00',
              requiredAmount: '0.030000',
              totalAmount: '0.030005',
              icon: '/img/crypto/sol.svg',
              fallback: true,
              amountUSD: 3.00
            },
            {
              symbol: 'ETH',
              name: 'Ethereum',
              network: 'Ethereum',
              currentPrice: '2500.00',
              requiredAmount: '0.001200',
              totalAmount: '0.003200',
              icon: '/img/crypto/eth.svg',
              fallback: true,
              amountUSD: 3.00
            },
            {
              symbol: 'MATIC',
              name: 'Polygon',
              network: 'Polygon',
              currentPrice: '0.80',
              requiredAmount: '3.750000',
              totalAmount: '3.760000',
              icon: '/img/crypto/matic.svg',
              fallback: true,
              amountUSD: 3.00
            },
            {
              symbol: 'BNB',
              name: 'BNB',
              network: 'BSC',
              currentPrice: '300.00',
              requiredAmount: '0.010000',
              totalAmount: '0.010500',
              icon: '/img/crypto/bnb.svg',
              fallback: true,
              amountUSD: 3.00
            }
          ];
        }
      } finally {
        this.pricingLoading = false;
      }
    },
    
    // Helper methods for crypto configuration
    getCryptoName(symbol) {
      const names = {
        'SOL': 'Solana',
        'ETH': 'Ethereum', 
        'MATIC': 'Polygon',
        'BNB': 'BNB'
      };
      return names[symbol] || symbol;
    },
    
    getCryptoNetwork(symbol) {
      const networks = {
        'SOL': 'Solana',
        'ETH': 'Ethereum',
        'MATIC': 'Polygon', 
        'BNB': 'BSC'
      };
      return networks[symbol] || symbol;
    },
    
    getCryptoDecimals(symbol) {
      const decimals = {
        'SOL': 6,
        'ETH': 6,
        'MATIC': 6,
        'BNB': 6
      };
      return decimals[symbol] || 6;
    },
    
    // New payment UI methods
    getWalletIcon(walletName) {
      const icons = {
        'MetaMask': 'https://docs.metamask.io/img/metamask-fox.svg',
        'Phantom': 'https://phantom.app/img/logo.png',
        'Coinbase Wallet': 'https://avatars.githubusercontent.com/u/18060234?s=280&v=4',
        'Trust Wallet': 'https://trustwallet.com/assets/images/media/assets/trust_platform.svg',
        'WalletConnect': 'https://walletconnect.org/walletconnect-logo.svg'
      };
      return icons[walletName] || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M21 18v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v13z"></path></svg>';
    },
    
    async payWithWallet() {
      if (!this.selectedWallet || !this.paymentDetails) {
        alert('Please select a wallet and ensure payment details are available');
        return;
      }
      
      this.walletPaymentLoading = true;
      
      try {
        const wallet = this.detectedWallets.find(w => w.name === this.selectedWallet);
        if (!wallet) {
          throw new Error('Selected wallet not found');
        }
        
        // Parse amount from formatted string
        const amount = parseFloat(this.paymentDetails.amountFormatted.split(' ')[0]);
        const cryptoType = this.paymentDetails.cryptoType;
        const address = this.paymentDetails.address;
        const memo = this.paymentDetails.memo;
        
        this.addPaymentLog(`Initiating ${cryptoType} payment via ${this.selectedWallet}...`, 'info');
        
        if (cryptoType === 'SOL' && this.selectedWallet === 'Phantom' && window.solana) {
          // Solana transaction via Phantom
          await this.sendSolanaTransaction(amount, address, memo);
        } else if (['ETH', 'MATIC', 'BNB'].includes(cryptoType) && window.ethereum) {
          // Ethereum-based transaction
          await this.sendEthereumTransaction(amount, address, cryptoType);
        } else {
          throw new Error(`Payment with ${this.selectedWallet} for ${cryptoType} not yet implemented`);
        }
        
      } catch (error) {
        console.error('Wallet payment failed:', error);
        this.addPaymentLog(`Payment failed: ${error.message}`, 'error');
        alert(`Payment failed: ${error.message}`);
      } finally {
        this.walletPaymentLoading = false;
      }
    },
    
    async sendSolanaTransaction(amount, address, memo) {
      try {
        // Connect to wallet
        const response = await window.solana.connect();
        console.log('Connected to Phantom:', response.publicKey.toString());
        
        // Use global solanaWeb3 from CDN
        const { Connection, Transaction, SystemProgram, PublicKey, TransactionInstruction, LAMPORTS_PER_SOL } = window.solanaWeb3;
        
        // Create transaction
        const connection = new Connection('https://api.mainnet-beta.solana.com');
        const transaction = new Transaction();
        
        // Add transfer instruction
        const lamports = Math.floor(amount * LAMPORTS_PER_SOL);
        const transferInstruction = SystemProgram.transfer({
          fromPubkey: response.publicKey,
          toPubkey: new PublicKey(address),
          lamports: lamports
        });
        
        transaction.add(transferInstruction);
        
        // Add memo if provided
        if (memo) {
          const memoInstruction = new TransactionInstruction({
            keys: [],
            programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
            data: new TextEncoder().encode(memo)
          });
          transaction.add(memoInstruction);
        }
        
        // Get recent blockhash
        const { blockhash } = await connection.getRecentBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = response.publicKey;
        
        // Sign and send transaction
        const signedTransaction = await window.solana.signTransaction(transaction);
        const txHash = await connection.sendRawTransaction(signedTransaction.serialize());
        
        this.userTxHash = txHash;
        this.addPaymentLog(`Solana transaction sent: ${txHash}`, 'success');
        this.markPaymentSent();
        
      } catch (error) {
        throw new Error(`Solana transaction failed: ${error.message}`);
      }
    },
    
    async sendEthereumTransaction(amount, address, cryptoType) {
      try {
        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        
        if (accounts.length === 0) {
          throw new Error('No accounts found in wallet');
        }
        
        const fromAddress = accounts[0];
        
        // Convert amount to wei (for ETH) or appropriate units
        const decimals = 18; // ETH, MATIC, BNB all use 18 decimals
        const value = '0x' + (amount * Math.pow(10, decimals)).toString(16);
        
        // Get network info for proper chain
        const networkIds = {
          'ETH': '0x1',     // Ethereum Mainnet
          'MATIC': '0x89',  // Polygon Mainnet  
          'BNB': '0x38'     // BSC Mainnet
        };
        
        const targetNetwork = networkIds[cryptoType];
        
        // Check/switch network if needed
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: targetNetwork }]
          });
        } catch (switchError) {
          // Network switch failed, continue anyway
          console.warn('Network switch failed:', switchError);
        }
        
        // Send transaction
        const txHash = await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [{
            from: fromAddress,
            to: address,
            value: value,
            gas: '0x5208' // 21000 in hex (standard transfer)
          }]
        });
        
        this.userTxHash = txHash;
        this.addPaymentLog(`${cryptoType} transaction sent: ${txHash}`, 'success');
        this.markPaymentSent();
        
      } catch (error) {
        throw new Error(`${cryptoType} transaction failed: ${error.message}`);
      }
    },
    
    togglePaymentQR() {
      this.showPaymentQR = !this.showPaymentQR;
      
      if (this.showPaymentQR) {
        // Generate QR code when showing
        this.$nextTick(() => {
          this.generatePaymentQR();
        });
      }
    },
    
    generatePaymentQR() {
      if (!this.paymentDetails) {
        console.error('No payment details available for QR generation');
        return;
      }
      
      try {
        const amount = parseFloat(this.paymentDetails.amountFormatted.split(' ')[0]);
        const cryptoType = this.paymentDetails.cryptoType;
        const address = this.paymentDetails.address;
        const memo = this.paymentDetails.memo;
        
        let qrData = '';
        
        // Generate QR data based on crypto type
        switch (cryptoType) {
          case 'SOL':
            // Use simple JSON format that most Solana wallets can parse
            qrData = `solana:${address}?amount=${amount}&memo=${memo}`;
            break;
            
          case 'ETH':
            // EIP-681 Ethereum payment request format
            qrData = `ethereum:${address}@1?value=${(amount * 1e18).toString()}`;
            break;
            
          case 'MATIC':
            // Polygon payment request (using Ethereum format with chain ID)
            qrData = `ethereum:${address}@137?value=${(amount * 1e18).toString()}`;
            break;
            
          case 'BNB':
            // BSC payment request (using Ethereum format with chain ID)
            qrData = `ethereum:${address}@56?value=${(amount * 1e18).toString()}`;
            break;
            
          default:
            // Fallback to simple address
            qrData = address;
        }
        
        // Clear previous QR code
        const qrContainer = document.getElementById('paymentQrCode');
        if (qrContainer) {
          qrContainer.innerHTML = '';
          
          // Generate new QR code
          const qrCode = new QRCode(qrContainer, {
            text: qrData,
            width: 200,
            height: 200,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M
          });
          
          this.addPaymentLog(`Payment QR code generated for ${cryptoType}`, 'info');
          console.log('Payment QR data:', qrData);
        }
        
      } catch (error) {
        console.error('Failed to generate payment QR code:', error);
        this.addPaymentLog(`QR generation failed: ${error.message}`, 'error');
      }
    },
  },
  mounted() {
    this.getHiveStats();
    this.rcCosts();
    if (this.account) {
      this.getHiveUser();
      this.makeQr("qrcode", `https://dlux.io/@${this.account}`, {
        width: 256,
        height: 256,
      });
    }
    this.getTickers();
    
    // Initialize onboarding system
    this.detectWallets();
    
    // Set default key generation method based on wallet availability
    if (this.detectedWallets.length === 0) {
      this.keyGenMethod = 'random';
    }
    
    // Parse URL parameters for friend referrals
    const urlParams = new URLSearchParams(window.location.search);
    const followParam = urlParams.get('follow');
    if (followParam) {
      this.requestUsername = followParam;
    }
    
    // Check for recovery parameter
    const recoveryParam = urlParams.get('recovery');
    if (recoveryParam === 'true') {
      this.startKeyRecovery();
    }
    
    // Load crypto pricing
    this.loadCryptoPricing();
  },
  computed: {
    canClaim: {
      get() {
        return this.account?.rcs > this.rcCost["claim_account_operation"] ? true : false
      },
    }
  },
});
