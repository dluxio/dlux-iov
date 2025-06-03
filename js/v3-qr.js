import { createApp, toRaw } from '/js/vue.esm-browser.js'
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

createApp({ // vue 3
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
      onboardingStep: 0, // 0 = not started, 1-4 = steps
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
      fallbackPollingInterval: null,
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
      console.log('Cleaning up WebSocket connection on destroy');
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close(1000, 'Component destroyed');
      }
      this.ws = null;
    }
    this.stopWebSocketPing();
    this.stopCountdown();
    this.stopFallbackPolling();
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
      if(this.rcCost.time < new Date().getTime() - 86400000)fetch("https://data.dlux.io/api/rc/costs")
        .then((r) => {
          return r.json();
        })
        .then((re) => {
          console.log(re.costs)
          for(var i = 0; i < re.costs.length; i++){
            this.rcCost[re.costs[i].operation] = re.costs[i]
          }
          this.rcCost.time = new Date().getTime();
          localStorage.setItem("rcCosts", JSON.stringify(this.rcCost));
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
      const username = this.newAccount.username ? this.newAccount.username.toLowerCase().trim() : '';
      
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
            // Clear any generated keys if username is taken or changed
            if (this.newAccount.username !== username) {
              this.clearGeneratedKeys();
            }
          } else {
            this.usernameStatus = 'available';
            // Clear keys if username changed from previous successful generation
            if (this.newAccount.username && this.newAccount.username !== username && 
                Object.keys(this.newAccount.keys || {}).length > 0) {
              console.log('Username changed, clearing generated keys');
              this.clearGeneratedKeys();
            }
            this.newAccount.username = username; // Store the validated username
          }
        } catch (error) {
          console.error('Username check failed:', error);
          this.usernameStatus = 'invalid';
          this.usernameError = 'Failed to check username availability';
        }
      }, 500);
    },
    
    clearGeneratedKeys() {
      console.log('Clearing generated keys due to username change');
      this.newAccount.keys = {};
      this.newAccount.publicKeys = {};
      this.newAccount.recoveryMethod = null;
      this.showKeys = false;
      
      // Clear payment related data if keys are cleared
      this.paymentDetails = null;
      this.paymentChannelId = null;
      this.paymentSentMarked = false;
      this.userTxHash = '';
      
      // Close WebSocket if open
      if (this.ws) {
        this.ws.close();
      }
      
      // Stop monitoring
      this.stopFallbackPolling();
      this.stopCountdown();
      
      // Clear URL channel ID
      this.clearUrlChannelId();
    },
    
    // Key Generation Methods
    async generateKeys() {
      // Check privacy and terms agreement
      if (!this.agreedToPrivacy || !this.agreedToTerms) {
        alert('Please agree to the Privacy Policy and Terms of Service before generating keys.');
        return;
      }

      this.keyGenLoading = true;
      
      // Auto-select crypto payment if using wallet method and no follow parameter
      const urlParams = new URLSearchParams(window.location.search);
      const followParam = urlParams.get('follow');
      if (this.keyGenMethod === 'wallet' && !followParam) {
        this.paymentMethod = 'crypto';
      }
      
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
         // Validate username before storing
         if (!this.newAccount.username || this.newAccount.username.trim() === '') {
           throw new Error('Username is required and cannot be empty');
         }
         
         // Get reference to nav component and call its method directly
         const navComponent = this.$refs.navComponent || this.$children.find(child => child.$options.name === 'nav-vue');
         
         const accountData = {
           username: this.newAccount.username.trim(),
           keys: this.newAccount.keys,
           publicKeys: this.newAccount.publicKeys,
           recoveryMethod: this.newAccount.recoveryMethod,
           isPendingCreation: true
         };
         
         if (navComponent && navComponent.storeNewAccount) {
           await navComponent.storeNewAccount(accountData);
         } else {
           // Fallback: trigger PEN setup if nav component not found
           console.warn('Nav component not found, triggering PEN setup');
           // Store data temporarily in localStorage for nav component to pick up
           localStorage.setItem('pendingNewAccount', JSON.stringify(accountData));
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
        
        const data = await response.json();
        console.log('Payment initiation response:', data);
        
        if (!response.ok) {
          if (response.status === 409) {
            // Handle channel already exists
            if (data.existingChannel.existingChannel) {
              this.addPaymentLog(`Found existing payment channel: ${data.existingChannel.channelId}`, 'warning');
              this.addPaymentLog('Resuming existing payment channel...', 'info');
              
              // Use the existing channel
              this.paymentChannelId = data.existingChannel.channelId;
              
              // Try to restore the payment details
              try {
                await this.restorePaymentChannel(data.channelId);
                return; // Successfully restored
              } catch (restoreError) {
                console.error('Failed to restore existing channel:', restoreError);
                this.addPaymentLog('Failed to restore existing channel, will create new one', 'warning');
                // Continue to create new channel after error
              }
            } else {
              // 409 without channel ID - generic conflict
              throw new Error('Payment channel conflict - please try again in a moment');
            }
          } else {
            throw new Error(`HTTP error! status: ${response.status} - ${data.error || 'Unknown error'}`);
          }
        }
        
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
        
        // Add channel ID to URL for page refresh persistence
        this.updateUrlWithChannelId(data.payment.channelId);
        
        this.addPaymentLog(`Payment channel created: ${data.payment.channelId}`, 'success');
        this.addPaymentLog(`Amount required: ${data.payment.amountFormatted}`, 'info');
        
        // Start robust monitoring (polling first, then try WebSocket)
        this.startPaymentMonitoring();
        
        console.log('Payment details set:', this.paymentDetails);
        
      } catch (error) {
        console.error('Error initiating crypto payment:', error);
        this.paymentError = error.message;
        this.addPaymentLog(`Error: ${error.message}`, 'error');
      } finally {
        this.paymentLoading = false;
      }
    },
    
    async restorePaymentChannel(channelId) {
      try {
        // Use correct API URL based on environment
        const apiHost = 'data.dlux.io';
        const apiProtocol = 'https:';
        const apiUrl = `${apiProtocol}//${apiHost}/api/onboarding/payment/status/${channelId}`;
        
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to restore payment channel');
        }
        
        // Restore payment state
        this.paymentDetails = {
          channelId: channelId,
          cryptoType: data.channel.cryptoType,
          amountFormatted: data.channel.amountFormatted,
          address: data.channel.address,
          memo: data.channel.memo,
          expiresAt: new Date(data.channel.expiresAt),
          instructions: data.channel.instructions || []
        };
        
        // Update payment status
        this.updatePaymentStatus({
          status: data.channel.status,
          message: data.channel.statusMessage,
          details: data.channel.statusDetails,
          progress: data.channel.progress,
          channel: data.channel
        });
        
        // Add channel ID to URL for persistence
        this.updateUrlWithChannelId(channelId);
        
        this.addPaymentLog('Payment channel restored successfully', 'success');
        
        // Start robust monitoring (polling first, then try WebSocket)
        this.startPaymentMonitoring();
        
        console.log('Payment channel restored:', this.paymentDetails);
        
      } catch (error) {
        console.error('Failed to restore payment channel:', error);
        throw error;
      }
    },
    
    // WebSocket Payment Monitoring Methods
    initializeWebSocket() {
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
      
      this.wsConnectionStatus = 'connecting';
      this.addPaymentLog('Connecting to payment monitor...', 'info');
      
      try {
        const wsUrl = '/ws/payment-monitor'
        console.log('Connecting to WebSocket:', wsUrl);
        console.log('Current location:', location.href);
        console.log('Detected environment:', { 
          protocol: location.protocol, 
          hostname: location.hostname,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        });
        
        // Test if WebSocket is supported
        if (!window.WebSocket) {
          throw new Error('WebSocket not supported by this browser');
        }
        
        this.ws = new WebSocket(wsUrl);
        
        // Log initial state
        console.log('WebSocket created, initial readyState:', this.ws.readyState);
        console.log('WebSocket URL:', this.ws.url);
        
        // Increase connection timeout for slower networks and add progressive fallback
        const connectionTimeout = setTimeout(() => {
          if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
            console.log('WebSocket connection timeout after 10 seconds');
            this.addPaymentLog('Connection timeout - network may be slow, using polling', 'warning');
            this.ws.close();
            // Start fallback polling immediately on timeout
            this.startFallbackPolling();
          }
        }, 10000); // Increased from 5 to 10 seconds
        
        this.ws.onopen = () => {
          clearTimeout(connectionTimeout);
          this.wsConnectionStatus = 'connected';
          this.wsReconnectAttempts = 0;
          this.addPaymentLog('Connected to real-time payment monitor', 'success');
          console.log('WebSocket connection opened successfully');
          console.log('WebSocket ready state:', this.ws.readyState);
          
          // Wait a brief moment before subscribing to ensure connection is stable
          setTimeout(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN && this.paymentChannelId) {
              try {
                console.log('Subscribing to payment channel:', this.paymentChannelId);
                this.ws.send(JSON.stringify({
                  type: 'subscribe',
                  channelId: this.paymentChannelId
                }));
                this.addPaymentLog(`Subscribed to channel: ${this.paymentChannelId}`, 'info');
              } catch (sendError) {
                console.error('Failed to send subscription:', sendError);
                this.addPaymentLog('Failed to subscribe to channel', 'error');
                // Fall back to polling if subscription fails
                this.startFallbackPolling();
              }
            }
            
            // Start ping to keep connection alive
            this.startWebSocketPing();
          }, 250); // Increased delay for stability
        };

        this.ws.onmessage = (event) => {
          try {
            console.log('WebSocket message received:', event.data);
            const data = JSON.parse(event.data);
            this.handleWebSocketMessage(data);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error, 'Raw data:', event.data);
            this.addPaymentLog('Failed to parse WebSocket message', 'error');
          }
        };

        this.ws.onclose = (event) => {
          clearTimeout(connectionTimeout);
          this.wsConnectionStatus = 'disconnected';
          console.log('WebSocket connection closed:', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
            readyState: this.ws ? this.ws.readyState : 'null'
          });
          
          // More detailed logging for close codes
          const closeReasons = {
            1000: 'Normal Closure',
            1001: 'Going Away',
            1002: 'Protocol Error', 
            1003: 'Unsupported Data',
            1006: 'Abnormal Closure (network/proxy/origin issue)',
            1011: 'Internal Server Error',
            1012: 'Service Restart',
            1013: 'Try Again Later'
          };
          
          const closeReason = closeReasons[event.code] || `Unknown (${event.code})`;
          console.log(`Close reason: ${closeReason}`);
          
          this.stopWebSocketPing();
          
          // Handle different close scenarios with better logic
          if (event.code === 1000) {
            // Normal closure - don't reconnect
            this.addPaymentLog(`Connection closed normally`, 'info');
          } else if (event.code === 1006) {
            // Abnormal closure - likely network/proxy/origin issue - use polling
            this.addPaymentLog(`${closeReason} - switching to reliable polling`, 'warning');
            console.log('Starting fallback polling due to abnormal closure (1006) - likely network/origin issue');
            this.startFallbackPolling();
          } else if (event.code === 1002 || event.code === 1003) {
            // Protocol or data errors - use polling
            this.addPaymentLog(`${closeReason} - switching to polling`, 'warning');
            this.startFallbackPolling();
          } else if (this.paymentChannelId && this.wsReconnectAttempts < this.wsMaxReconnectAttempts) {
            // Other errors - try to reconnect with backoff
            this.addPaymentLog(`${closeReason} - attempting reconnect (${this.wsReconnectAttempts + 1}/${this.wsMaxReconnectAttempts})`, 'warning');
            this.attemptWebSocketReconnect();
          } else if (this.paymentChannelId) {
            // Max reconnects reached
            this.addPaymentLog(`Max reconnection attempts reached - switching to polling`, 'warning');
            this.startFallbackPolling();
          } else {
            this.addPaymentLog(`${closeReason}`, 'info');
          }
        };

        this.ws.onerror = (error) => {
          clearTimeout(connectionTimeout);
          console.error('WebSocket error occurred');
          console.error('Error event:', error);
          console.error('WebSocket state:', {
            readyState: this.ws ? this.ws.readyState : 'null',
            url: this.ws ? this.ws.url : 'null',
            protocol: this.ws ? this.ws.protocol : 'null'
          });
          
          // Log the error state
          const stateNames = {
            0: 'CONNECTING',
            1: 'OPEN', 
            2: 'CLOSING',
            3: 'CLOSED'
          };
          
          const currentState = this.ws ? stateNames[this.ws.readyState] || this.ws.readyState : 'null';
          this.addPaymentLog(`WebSocket error (state: ${currentState}) - using polling`, 'warning');
          
          // Start fallback polling immediately on any error during connection
          if (this.paymentChannelId) {
            console.log('WebSocket error occurred, starting fallback polling immediately');
            this.startFallbackPolling();
          }
        };

      } catch (error) {
        this.wsConnectionStatus = 'disconnected';
        this.addPaymentLog(`Failed to connect: ${error.message} - using polling`, 'warning');
        console.error('WebSocket connection failed:', error);
        
        // Start polling if WebSocket creation fails
        if (this.paymentChannelId) {
          this.startFallbackPolling();
        }
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
          // Clear channel ID from URL since account creation is complete
          this.clearUrlChannelId();
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
        this.addPaymentLog('Maximum reconnection attempts reached, switching to reliable polling', 'warning');
        this.startFallbackPolling();
        return;
      }
      
      this.wsReconnectAttempts++;
      // Use longer delays with exponential backoff for better stability
      const baseDelay = 5000; // Start with 5 seconds
      const delay = Math.min(baseDelay * Math.pow(2, this.wsReconnectAttempts - 1), 30000); // Cap at 30 seconds
      
      this.addPaymentLog(`Reconnecting in ${Math.round(delay/1000)}s... (${this.wsReconnectAttempts}/${this.wsMaxReconnectAttempts})`, 'warning');
      
      setTimeout(() => {
        if (this.paymentChannelId && this.wsReconnectAttempts < this.wsMaxReconnectAttempts) { 
          console.log(`WebSocket reconnect attempt ${this.wsReconnectAttempts}/${this.wsMaxReconnectAttempts}`);
          this.initializeWebSocket();
        } else if (this.wsReconnectAttempts >= this.wsMaxReconnectAttempts) {
          console.log('Max reconnect attempts reached, starting polling');
          this.startFallbackPolling();
        } else {
          console.log('Skipping WebSocket reconnect - no payment channel');
        }
      }, delay);
    },
    
    retryWebSocketConnection() {
      this.wsReconnectAttempts = 0; // Reset retry count
      this.addPaymentLog('Manual retry initiated...', 'info');
      this.initializeWebSocket();
    },
    
    // Fallback polling when WebSocket fails
    startFallbackPolling() {
      if (this.fallbackPollingInterval) {
        clearInterval(this.fallbackPollingInterval);
      }
      
      if (!this.paymentChannelId) {
        console.log('Cannot start fallback polling - no payment channel ID');
        return;
      }
      
      this.addPaymentLog('Starting payment monitoring via polling (real-time monitoring unavailable)', 'info');
      console.log('Starting fallback polling for channel:', this.paymentChannelId);
      
      // Do an immediate poll first to ensure we have payment details
      this.performPollCheck();
      
      this.fallbackPollingInterval = setInterval(() => {
        this.performPollCheck();
      }, 5000); // Poll every 5 seconds
    },
    
    async performPollCheck() {
      if (!this.paymentChannelId) {
        this.stopFallbackPolling();
        return;
      }
      
      try {
        const apiUrl = `https://data.dlux.io/api/onboarding/payment/status/${this.paymentChannelId}`;
        console.log('Polling payment status:', apiUrl);
        
        const response = await fetch(apiUrl);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            console.log('Poll response:', data.channel.status, data.channel.statusMessage);
            
            // CRITICAL: Ensure payment details are always populated for wallet functionality
            if (!this.paymentDetails || !this.paymentDetails.address) {
              this.paymentDetails = {
                channelId: data.channel.channelId,
                cryptoType: data.channel.cryptoType,
                amountFormatted: data.channel.amountFormatted,
                address: data.channel.address,
                memo: data.channel.memo,
                expiresAt: new Date(data.channel.expiresAt),
                instructions: data.channel.instructions || []
              };
              
              console.log('Payment details restored from polling:', this.paymentDetails);
              this.addPaymentLog('Payment details restored - wallet functionality available', 'success');
              
              // Generate QR code if not already shown and ensure UI is ready
              this.$nextTick(() => {
                if (this.showPaymentQR) {
                  this.generatePaymentQR();
                }
              });
            }
            
            // Restore public keys if they exist and we don't have them
            if (data.channel.publicKeys && !this.newAccount.publicKeys) {
              this.newAccount.publicKeys = data.channel.publicKeys;
              console.log('Public keys restored from polling');
            }
            
            // Update payment status
            this.updatePaymentStatus({
              status: data.channel.status,
              message: data.channel.statusMessage,
              details: data.channel.statusDetails,
              progress: data.channel.progress,
              channel: data.channel
            });
            
            // Update countdown if payment is waiting
            if (data.channel.expiresAt) {
              this.updateCountdown(data.channel.expiresAt);
            }
            
            // Stop polling if account is completed or failed
            if (data.channel.status === 'completed' || data.channel.status === 'failed' || data.channel.status === 'expired') {
              console.log('Payment completed/failed, stopping polling');
              this.stopFallbackPolling();
            }
          } else {
            console.error('Poll response error:', data.error);
            this.addPaymentLog(`Status check error: ${data.error}`, 'warning');
          }
        } else {
          console.error('Poll HTTP error:', response.status, response.statusText);
          this.addPaymentLog(`Status check failed (HTTP ${response.status})`, 'warning');
        }
      } catch (error) {
        console.error('Fallback polling error:', error);
        this.addPaymentLog(`Status check failed: ${error.message}`, 'warning');
      }
    },
    
    stopFallbackPolling() {
      if (this.fallbackPollingInterval) {
        clearInterval(this.fallbackPollingInterval);
        this.fallbackPollingInterval = null;
        this.addPaymentLog('Stopped fallback polling', 'info');
      }
    },
    
    startWebSocketPing() {
      // Clear any existing ping interval
      this.stopWebSocketPing();
      
      this.pingInterval = setInterval(() => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          try {
            this.ws.send(JSON.stringify({ type: 'ping' }));
            console.log('WebSocket ping sent');
          } catch (error) {
            console.error('Failed to send WebSocket ping:', error);
            this.addPaymentLog('WebSocket ping failed', 'warning');
          }
        } else {
          console.log('WebSocket ping skipped - connection not open');
          this.stopWebSocketPing();
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
    
    startAccountCreation() {
      this.onboardingStep = 1;
      this.recoveryMode = false;
      
      // If we have a follow parameter, skip to step 3 (payment) and set request method
      if (this.requestUsername) {
        // Pre-populate a username suggestion based on follow parameter
        if (!this.newAccount.username) {
          this.newAccount.username = this.requestUsername + '-friend';
        }
        // Will be set to request method when reaching step 3
      }
    },
    
    goBackToUsernameStep() {
      // If we have generated keys, warn user
      if (Object.keys(this.newAccount.keys || {}).length > 0) {
        if (!confirm('Going back will clear your generated keys. Are you sure?')) {
          return;
        }
        this.clearGeneratedKeys();
      }
      this.onboardingStep = 1;
    },
    
    goBackToKeyGenStep() {
      // Clear any payment channel data when going back
      if (this.paymentChannelId || this.paymentDetails) {
        this.paymentDetails = null;
        this.paymentChannelId = null;
        this.paymentSentMarked = false;
        this.userTxHash = '';
        
        // Close WebSocket if open
        if (this.ws) {
          this.ws.close();
        }
        
        // Stop monitoring
        this.stopFallbackPolling();
        this.stopCountdown();
        
        // Clear URL channel ID
        this.clearUrlChannelId();
      }
      this.onboardingStep = 2;
    },
    
    resetOnboardingState() {
      this.onboardingStep = 0;
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
      this.paymentSentMarked = false;
      this.userTxHash = '';
      
      // Clear username check timeout
      if (this.usernameCheckTimeout) {
        clearTimeout(this.usernameCheckTimeout);
        this.usernameCheckTimeout = null;
      }
      
      // Close WebSocket if open
      if (this.ws) {
        this.ws.close();
      }
      
      // Stop fallback polling and countdowns
      this.stopFallbackPolling();
      this.stopCountdown();
      
      // Clear channel ID from URL
      this.clearUrlChannelId();
      
      // Clear any pending account data
      localStorage.removeItem('pendingNewAccount');
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
    
    // Create Account Yourself functionality
    async createAccountYourself() {
      if (!this.newAccount.username || !this.newAccount.publicKeys) {
        alert('Please complete username selection and key generation first');
        return;
      }
      
      // Get reference to nav component
      const navComponent = this.$refs.navComponent;
      if (!navComponent) {
        alert('Navigation component not available');
        return;
      }
      
      // Check if user is logged in
      if (!this.account) {
        alert('You must be logged in to create an account for someone else');
        return;
      }
      
      try {
        // Create a request object that matches the format expected by createAccountForFriend
        const request = {
          status: 'done',
          requester_username: this.newAccount.username,
          public_keys: this.newAccount.publicKeys
        };
        
        // Get chain properties to determine if we can use ACT
        const response = await fetch('https://hive-api.dlux.io', {
          body: `{"jsonrpc":"2.0", "method":"condenser_api.get_accounts", "params":[["${this.account}"]], "id":1}`,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          method: "POST",
        });
        
        const data = await response.json();
        const userAccount = data.result[0];
        
        if (!userAccount) {
          alert('Unable to verify your account status');
          return;
        }
        
        // Check if user has ACTs or sufficient HIVE
        const hasACT = userAccount.pending_claimed_accounts > 0;
        const hiveBalance = parseFloat(userAccount.balance.split(' ')[0]);
        
        // Get account creation fee
        const propsResponse = await fetch('https://hive-api.dlux.io', {
          body: `{"jsonrpc":"2.0", "method":"condenser_api.get_chain_properties", "params":[], "id":1}`,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          method: "POST",
        });
        
        const propsData = await propsResponse.json();
        const accountCreationFee = parseFloat(propsData.result.account_creation_fee.split(' ')[0]);
        
        // Confirm the action with the user
        let confirmMessage;
        if (hasACT) {
          confirmMessage = `Create account @${this.newAccount.username} using 1 Account Creation Token?\n\nThis will use one of your ${userAccount.pending_claimed_accounts} ACTs.`;
        } else if (hiveBalance >= accountCreationFee) {
          confirmMessage = `Create account @${this.newAccount.username} for ${accountCreationFee} HIVE?\n\nYour balance: ${hiveBalance} HIVE`;
        } else {
          alert(`Insufficient funds. You need either:\n• 1 Account Creation Token, or\n• ${accountCreationFee} HIVE (you have ${hiveBalance} HIVE)`);
          return;
        }
        
        if (!confirm(confirmMessage)) {
          return;
        }
        
        // Call the nav component's createAccountForFriend method
        await navComponent.createAccountForFriend(request, hasACT);
        
        // Mark account as created and move to success step
        this.accountCreated = true;
        this.onboardingStep = 4;
        
        alert(`Account creation transaction submitted!\n\nUsername: @${this.newAccount.username}\nMethod: ${hasACT ? 'Account Creation Token' : accountCreationFee + ' HIVE'}`);
        
      } catch (error) {
        console.error('Failed to create account:', error);
        alert('Failed to create account: ' + error.message);
      }
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
    
    // URL Management Methods
    updateUrlWithChannelId(channelId) {
      const url = new URL(window.location);
      url.searchParams.set('channelId', channelId);
      window.history.replaceState({}, '', url);
    },
    
    clearUrlChannelId() {
      const url = new URL(window.location);
      url.searchParams.delete('channelId');
      window.history.replaceState({}, '', url);
    },
    
    async restorePaymentFromUrl() {
      const urlParams = new URLSearchParams(window.location.search);
      const channelId = urlParams.get('channelId');
      
      if (!channelId) {
        return false;
      }
      
      this.addPaymentLog(`Restoring payment channel: ${channelId}`, 'info');
      
      try {
        // Fetch channel status from backend
        const apiHost = 'data.dlux.io';
        const apiProtocol = 'https:';
        const apiUrl = `${apiProtocol}//${apiHost}/api/onboarding/payment/status/${channelId}`;
        
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to restore payment channel');
        }
        
        // Restore payment state
        this.paymentChannelId = channelId;
        this.paymentDetails = {
          channelId: channelId,
          cryptoType: data.channel.cryptoType,
          amountFormatted: data.channel.amountFormatted,
          address: data.channel.address,
          memo: data.channel.memo,
          expiresAt: new Date(data.channel.expiresAt),
          instructions: data.channel.instructions || []
        };
        
        // Restore account details if available
        if (data.channel.username) {
          this.newAccount.username = data.channel.username;
        }
        if (data.channel.publicKeys) {
          this.newAccount.publicKeys = data.channel.publicKeys;
        }
        
        // Update payment status
        this.updatePaymentStatus({
          status: data.channel.status,
          message: data.channel.statusMessage,
          details: data.channel.statusDetails,
          progress: data.channel.progress,
          channel: data.channel
        });
        
        // Set appropriate onboarding step
        if (data.channel.status === 'completed') {
          this.accountCreated = true;
          this.onboardingStep = 4;
        } else {
          this.onboardingStep = 3;
          this.paymentMethod = 'crypto';
        }
        
        this.addPaymentLog('Payment channel restored from URL', 'success');
        
        // Start robust monitoring (polling first, then try WebSocket)
        this.startPaymentMonitoring();
        
        return true;
        
      } catch (error) {
        console.error('Failed to restore payment channel:', error);
        this.addPaymentLog(`Failed to restore channel: ${error.message}`, 'error');
        // Clear invalid channel ID from URL
        this.clearUrlChannelId();
        return false;
      }
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
      if (!this.selectedWallet) {
        alert('Please select a wallet');
        return;
      }

      // Ensure payment details are available before attempting payment
      if (!this.paymentDetails || !this.paymentDetails.address) {
        this.addPaymentLog('Payment details not available, fetching...', 'warning');
        const detailsAvailable = await this.ensurePaymentDetailsAvailable();
        if (!detailsAvailable) {
          alert('Payment details not available. Please refresh the page and try again.');
          return;
        }
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
    
    async generatePaymentQR() {
      // Ensure payment details are available before generating QR
      if (!this.paymentDetails || !this.paymentDetails.address) {
        console.log('Payment details not available for QR generation, fetching...');
        const detailsAvailable = await this.ensurePaymentDetailsAvailable();
        if (!detailsAvailable) {
          console.error('Cannot generate QR - payment details not available');
          this.addPaymentLog('Cannot generate QR code - payment details not available', 'error');
          return;
        }
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
        
        console.log('Generating QR for:', qrData);
        
        // Clear any existing QR code
        const qrContainer = this.$refs.paymentQR;
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
          
          console.log('QR code generated successfully');
        } else {
          console.error('QR container not found');
        }
        
      } catch (error) {
        console.error('Error generating QR code:', error);
        this.addPaymentLog(`QR generation failed: ${error.message}`, 'error');
      }
    },

    // Ensure payment details are available for wallet functionality
    async ensurePaymentDetailsAvailable() {
      if (this.paymentDetails && this.paymentDetails.address) {
        return true; // Already have details
      }

      if (!this.paymentChannelId) {
        console.log('Cannot ensure payment details - no channel ID');
        return false;
      }

      try {
        this.addPaymentLog('Fetching payment details for wallet functionality...', 'info');
        const apiUrl = `https://data.dlux.io/api/onboarding/payment/status/${this.paymentChannelId}`;
        
        const response = await fetch(apiUrl);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            this.paymentDetails = {
              channelId: data.channel.channelId,
              cryptoType: data.channel.cryptoType,
              amountFormatted: data.channel.amountFormatted,
              address: data.channel.address,
              memo: data.channel.memo,
              expiresAt: new Date(data.channel.expiresAt),
              instructions: data.channel.instructions || []
            };
            
            // Also restore other state if needed
            if (data.channel.publicKeys && !this.newAccount.publicKeys) {
              this.newAccount.publicKeys = data.channel.publicKeys;
            }
            
            console.log('Payment details ensured:', this.paymentDetails);
            this.addPaymentLog('Payment details retrieved - wallet functionality ready', 'success');
            return true;
          }
        }
        
        console.error('Failed to fetch payment details');
        this.addPaymentLog('Failed to retrieve payment details', 'error');
        return false;
        
      } catch (error) {
        console.error('Error ensuring payment details:', error);
        this.addPaymentLog(`Error retrieving payment details: ${error.message}`, 'error');
        return false;
      }
    },

    // Robust monitoring startup that prioritizes reliability
    startPaymentMonitoring() {
      if (!this.paymentChannelId) {
        console.log('Cannot start payment monitoring - no channel ID');
        return;
      }

      console.log('Starting payment monitoring for channel:', this.paymentChannelId);
      this.addPaymentLog('Initializing payment monitoring...', 'info');

      // Always start with polling for reliability
      this.startFallbackPolling();

      // Try WebSocket as an enhancement, but don't rely on it
      try {
        this.initializeWebSocket();
        
        // If WebSocket connects successfully, we can stop polling after a delay
        setTimeout(() => {
          if (this.wsConnectionStatus === 'connected' && this.fallbackPollingInterval) {
            console.log('WebSocket connected successfully, stopping polling');
            this.addPaymentLog('WebSocket connected - switching to real-time monitoring', 'success');
            this.stopFallbackPolling();
          } else {
            console.log('WebSocket not connected, continuing with polling');
            this.addPaymentLog('WebSocket not connected - continuing with polling', 'info');
          }
        }, 5000);
        
      } catch (error) {
        console.error('Failed to initialize WebSocket:', error);
        this.addPaymentLog('WebSocket initialization failed - using polling', 'warning');
      }
    },
  },
      mounted() {
    // Ensure newAccount is properly initialized
    if (!this.newAccount.username) {
      this.newAccount.username = '';
    }
    
    this.getHiveStats();
    this.rcCosts();
    if (this.account && this.account != 'GUEST') {
      this.getHiveUser();
      this.makeQr("qrcode", `https://dlux.io/qr?follow=${this.account}`, {
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
      // Set payment method to request when follow parameter is provided
      this.paymentMethod = 'request';
      // Only redirect if user is logged in AND not in onboarding mode
      if(this.account && this.account != 'GUEST' && this.onboardingStep === 0){
        console.log("followParam", followParam, this.account);
        // Don't redirect immediately - let user choose to help create account or view profile
        // window.location.href = `/@${followParam}`
      }
    }
    
    // Check for recovery parameter
    const recoveryParam = urlParams.get('recovery');
    if (recoveryParam === 'true') {
      this.startKeyRecovery();
    }
    
    // Load crypto pricing
    this.loadCryptoPricing();
    
    // Check for existing payment channel in URL and restore if needed
    this.restorePaymentFromUrl();
  },
  watch: {
    // Auto-select request method when reaching step 3 with a follow parameter
    onboardingStep(newStep) {
      if (newStep === 3 && this.requestUsername && !this.paymentMethod) {
        this.paymentMethod = 'request';
      }
    }
  },
  computed: {
    canClaim: {
      get() {
        return this.account?.rcs > this.rcCost["claim_account_operation"] ? true : false
      },
    },
    
    claimActHpNeeded: {
      get() {
        const claimActCost = this.rcCost.claim_account_operation || this.rcCost["claim_account_operation"];
        if (claimActCost && claimActCost.hp_needed) {
          return Math.ceil(claimActCost.hp_needed).toLocaleString();
        } else if (claimActCost && claimActCost.rc_needed) {
          // Calculate HP needed from RC needed (approximation: 1 HP ≈ 1.67 billion RC)
          const hpNeeded = parseFloat(claimActCost.rc_needed) / 1670000000;
          return Math.ceil(hpNeeded).toLocaleString();
        }
        return "15,000"; // fallback
      }
    }
  },
}).mount('#app')
