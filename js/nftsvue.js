import Vue from "https://cdn.jsdelivr.net/npm/vue@2.6.14/dist/vue.esm.browser.js";
import Navue from "/js/navue.js";
import FootVue from "/js/footvue.js";
import Cycler from "/js/cycler.js";
import NFTCard from "./nftcard.js";
import FTTransfer from "./fttransfer.js";
import NFTDetail from "./nftdetail.js";

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

Vue.directive("scroll", {
  inserted: function (el, binding) {
    const onScrollCallback = binding.value;
    window.addEventListener("scroll", () => onScrollCallback());
  },
});

// createApp({ // vue 3
var app = new Vue({
  // vue 2
  el: "#app", // vue 2
  data() {
    return {
      ready: false,
      lastLoad: 0,
      ohlcv: [],
      toSign: {},
      chains: {
        dlux: {
          enabled: false,
          api: "https://token.dlux.io",
          sets: {
            dlux: {
              mintAuctions: [],
              mintSales: [],
              computed:{
                set: {}
              }
            }
          },
          slot: 1,
          account:{
            balance: 0,
          }
        },
        duat: {
          enabled: false,
          api: "https://duat.hivehoneycomb.com",
          sets: {
            rct: {
              mintAuctions: [],
              mintSales: [],
            }
          },
          slot: 0,
          account:{
            balance: 0,
          }
        }
      },
      marketorder: {
        hive: 1,
        name: 'dlux',
        value: 1,
        dex: []
      },
      presales: [],
      displayNFTs: [],
      nowtime: new Date().getTime(),
      agoTime: new Date().getTime() - 86400000,
      account: user,
      pfp: {
        set: "",
        uid: "",
      },
      accountNFTs: [],
      accountRNFTs: [],
      iOwn: [],
      setname: '',
      iOwnCheckbox: false,
      highBidder: [],
      highBidderCheckbox: false,
      allSearchNFTs: [],
      uids: [],
      hasDrop: false,
      dropnai: "",
      balance: "0.000",
      bartoken: "",
      barhive: "",
      barhbd: "",
      bargov: "",
      barpow: "",
      toSign: {},
      giveFTusername: '',
      giveFTqty: 1,
      buyFormValid: false,
      sellFormValid: false,
      govFormValid: false,
      powFormValid: false,
      sendFormValid: false,
      hiveFormValid: false,
      hbdFormValid: false,
      lapi: lapi,
      hapi: hapi,
      transferMint: false,
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
      setPage: false,
      nodes: {},
      runners: [],
      runnersSearch: [],
      marketnodes: {},
      hivebuys: [],
      hivesells: [],
      hbdbuys: [],
      hbdsells: [],
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
      jsontoken: "dlux",
      node: "",
      showTokens: {},
      denoms: {
        HIVE: {
          checked: false},
        HBD: {
          checked: false},
      },
      selectors: {
        ['For Sale']: {
          checked: false},
        ["At Auction"]: {
          checked: false},
        ['Has Bids']: {
          checked: false},
        ['Your Bids']: {
          checked: false},
        Affordable: {
          checked: false},
        Yours: {
          checked: false},
      },
      behind: "",
      stats: {},
      behindTitle: "",
      TOKEN: "LARYNX",
      dataAPI: "https://data.dlux.io",
      bform: {
        cl: false,
        tl: false,
        pl: true,
      },
      sform: {
        cl: false,
        tl: false,
        pl: true,
      },
      buyHiveTotal: 0,
      buyPrice: 0,
      sellPrice: 0,
      buyHbdTotal: 0,
      sellHiveTotal: 0,
      sellHbdTotal: 0,
      buyQuantity: 0,
      sellQuantity: 0,
      buyHours: 720,
      sellHours: 720,
      volume: {
        hive: 0,
        hbd: 0,
        token_hive: 0,
        token_hbd: 0,
        hive_usd: 0,
        hbd_usd: 0,
      },
      wantedNum: 30,
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
      tradeTo: "",
      tradePrice: 0,
      tradeQty: 1,
      recenthive: {},
      recenthbd: {},
      openorders: [],
      toasts: [],
      orders: {
        filleda: false,
        filledd: false,
        blocka: false,
        blockd: true,
        coina: false,
        coind: false,
        tokena: false,
        tokend: false,
        ratea: false,
        rated: false,
        typea: false,
        typed: false,
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
      nftsets: [],
      nftsetsf: [],
      nftscripts: {},
      focusItem: {
        token: "dlux",
        set: "dlux",
        script: "QmYSRLiGaEmucSXoNiq9RqazmDuEZmCELRDg4wyE7Fo8kX",
      },
      getAttr(script, att) {
        if (this.baseScript[script]) return this.baseScript[script].set[att];
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
      mint_detail: {
        set: "",
      },
      hiveprice: 1,
      selectedNFTs: [],
      NFTselect: {
        start: 0,
        amount: 30,
        searchTerm: "",
        searchDefault: "Search UIDs and Owners",
        searchDeep: false,
        searchDeepKey: "",
        searchDeepK: false,
        keys: [],
        saleOnly: false,
        auctionOnly: false,
        dir: "asc",
        sort: "uid",
        showDeleted: false,
        searching: false,
      },
      allNFTs: [],
      saleNFTs: [],
      auctionNFTs: [],
      itemModal: {
        source: "sales",
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
          uid: "",
        },
      },
      initialLoad: false,
      activeIndex: 0,
      nftTradeTabToken: "",
      nftTradeAllowed: false,
      nftTradeTabTo: "",
      nftTradeTabPrice: 100,
      nftSellTabToken: "",
      nftSellTabPrice: 100,
      nftAuctionTabToken: "",
      nftAuctionTabPrice: 100,
      nftAuctionTabTime: 7,
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
      auctions: [],
      sales: [],
      price: {},
      mintAuctions: [],
      mintSales: [],
      mintData: [],
      compiledScript: "",
      baseScript: `<!DOCTYPE html>
//<html><head><script>
function compile(m,y){const L=$L,Y=$Y,Base64={R:"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+=",toFlags:function(r){var t=[];r=r.split('');for(var j=0;j<r.length;j++){for(var i=32;i>=1;i=i/2){if(this.R.indexOf(r[j])>=i){t.unshift(1);r[j]=this.R[this.R.indexOf(r[j])-i]}else{t.unshift(0)}}}return t}};if(y){document.getElementById('body').innerHTML = S}else{return{ HTML:S,attributes:Y,set:{Color1:$c2,Color2:$c1,Description:$D,faicon:$i,banner:$b,featured:$f,logo:$go,wrapped:$w,category:$c,links:$l}}}}
//</script>
/*
//<script>
if(window.addEventListener){window.addEventListener("message",onMessage,false);}else if(window.attachEvent){window.attachEvent("onmessage",onMessage,false)};function onMessage(event){var data=event.data;if(typeof(window[data.func])=="function"){const got=window[data.func].call(null,data.message);window.parent.postMessage({'func':'compiled','message':got},"*");}};function onLoad(id){window.parent.postMessage({'func': 'loaded','message': id},"*");}
//</script>
*/
//</head><body id="body">Append ?NFT_UID to the address bar to see that NFT. "...html?A6"<script>const u=location.href.split('?')[1];if(u){compile(u,1)}else{onLoad(u)}</script></body></html>`,
      SL: [],
      svgTag: "",
      svgTagClose: "",
      SA: {
        logo: "Qma1aE2ntCwMw5pAZo3cCYCmMZ4byVvyGDbK22HiH92WN7",
        banner: "QmdSXLw1qwQ51MtkS3SjUd8qryLWadAYvMWngFfDPCsb9Y",
        featured: "QmVndpFfjDXtSt2v26G7tiM6mZJGcj3Ya4KzepM8c6Pu7u",
        wrapped: "QmV4WZ7sKzvaPG85C2rYNhDS3nVhk3Bv5U9o5Gr9KWx7ir",
        color1: "#ffffff",
        color2: "#000000",
        links: [],
        categories: [],
        faicon: "fa fa-gem",
        description: "Provide a detailed description of your collection.",
      },
      SLN: [],
    };
  },
  components: {
    "nav-vue": Navue,
    "foot-vue": FootVue,
    "cycle-text": Cycler,
    "nftcard": NFTCard,
    "fttransfer": FTTransfer,
    "nftdetail": NFTDetail,
  },
  methods: {
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
    validateHeaders(rawHeaders) {
      return new Promise((res, rej) => {
        if (!rawHeaders || rawHeaders.split(":")[0] < Date.now() - 600000000) {
          this.toSign = {
            type: "sign_headers",
            challenge: Date.now(),
            key: "posting",
            ops: [],
            callbacks: [res],
            txid: 'Sign Auth Headers'
          };
        } else {
          console.log(2)
          res(rawHeaders)
        }
      })
    },
    addFilters(){
      var term = ''
      for(var i = 0; i < arguments.length; i++){
        term += arguments[i] + ':'
      }
      term = term.substring(0, term.length - 1) 
      if(this.NFTselect.keys.indexOf(term) == -1)
      this.NFTselect.keys.push(term)
      else this.NFTselect.keys.splice(this.NFTselect.keys.indexOf(term), 1)
    },
    clearFilters(){
      var term = ''
      for(var i = 0; i < arguments.length; i++){
        term += arguments[i] + ':'
      }
      if(term)term = term.substring(0, term.length - 1)
      const start = this.setPage ? 2 : 0
      for(var i = start; i < this.NFTselect.keys.length; i++){
        if((!term || term ==  this.NFTselect.keys[i]) && this.NFTselect.keys[i].indexOf('Chain') == 0){
          this.chains[this.NFTselect.keys[i].split(':')[1]].enabled = false
          this.NFTselect.keys.splice(i, 1)
          i--
          continue
        }
        if((!term || term ==  this.NFTselect.keys[i]) && this.NFTselect.keys[i].indexOf('Set') == 0){
          this.chains[this.NFTselect.keys[i].split(':')[2]].sets[this.NFTselect.keys[i].split(':')[1]].enabled = false
          this.NFTselect.keys.splice(i, 1)
          i--
          continue
        }
        if((!term || term ==  this.NFTselect.keys[i]) && this.NFTselect.keys[i].indexOf('Status') == 0){
          this.selectors[this.NFTselect.keys[i].split(':')[1]].checked = false
          this.NFTselect.keys.splice(i, 1)
          i--
          continue
        }
        if((!term || term ==  this.NFTselect.keys[i]) && this.NFTselect.keys[i].indexOf('Currency') == 0){
          this.denoms[this.NFTselect.keys[i].split(':')[1]].checked = false
          this.NFTselect.keys.splice(i, 1)
          i--
          continue
        }
      }
      if(!term && !start)this.NFTselect.keys = []
      else if (!term)this.NFTselect.keys = this.NFTselect.keys.slice(0, 2)
      this.displaynfts()
    },
    smart(name, del = ':', i = 0){
      return name.split(del)[i]
    },
    displaynfts(){
      this.displayNFTs = []
      chainlabel: for(var chain in this.chains){
        if(this.NFTselect.keys.find(a => a.indexOf('Chain') >= 0) && !this.chains[chain].enabled)continue chainlabel;
        setlabel: for(var set in this.chains[chain].sets){
          if(this.NFTselect.keys.find(a => a.indexOf('Set') >= 0) && !this.chains[chain].sets[set].enabled)continue setlabel;
          salelabel: for(var i = 0; i < this.chains[chain].sets[set].sales.length; i++){
            if(this.NFTselect.keys.find(a => a.indexOf('Status') >= 0) && !(this.selectors['For Sale'].checked || this.selectors['Affordable'].checked || this.selectors['Yours'].checked))break salelabel;
            if(this.NFTselect.keys.find(a => a.indexOf('Status') >= 0) && this.selectors['Yours'].checked && this.chains[chain].sets[set].sales[i].by != this.account)continue salelabel;
            if(this.NFTselect.keys.find(a => a.indexOf('Currency') >= 0) && !this.denoms[this.chains[chain].sets[set].sales[i].price.token].checked)continue salelabel;
            if(this.NFTselect.keys.find(a => a.indexOf('Status') >= 0) && this.selectors['Affordable'].checked && this.chains[chain].sets[set].sales[i].price.amount > (this.chains[chain].sets[set].sales[i].price.token == chain.toUpperCase() ? this.chains[chain].account.balance : this.chains[chain].sets[set].sales[i].price.token == 'HIVE' ? parseFloat(this.barhive) * 1000 : parseFloat(this.barhbd) * 1000))continue salelabel;
            if(this.NFTselect.searchTerm){
              if(this.chains[chain].sets[set].sales[i].uid.toLowerCase().indexOf(this.NFTselect.searchTerm.toLowerCase()) >= 0){
                this.displayNFTs.push(this.chains[chain].sets[set].sales[i])
                continue
              }
              if(this.chains[chain].sets[set].sales[i].name_long.toLowerCase().indexOf(this.NFTselect.searchTerm.toLowerCase()) >= 0){
                this.displayNFTs.push(this.chains[chain].sets[set].sales[i])
                continue
              }
              if(this.chains[chain].sets[set].sales[i].by.toLowerCase().indexOf(this.NFTselect.searchTerm.toLowerCase()) >= 0){
                this.displayNFTs.push(this.chains[chain].sets[set].sales[i])
                continue
              }
              if(this.chains[chain].sets[set].sales[i].setname.toLowerCase().indexOf(this.NFTselect.searchTerm.toLowerCase()) >= 0){
                this.displayNFTs.push(this.chains[chain].sets[set].sales[i])
                continue
              }
            } else {
              this.displayNFTs.push(this.chains[chain].sets[set].sales[i])
            }
          }
          auctionlabel: for(var i = 0; i < this.chains[chain].sets[set].auctions.length; i++){
            if(this.NFTselect.keys.find(a => a.indexOf('Status') >= 0) && !( this.selectors['At Auction'].checked || this.selectors['Has Bids'].checked || this.selectors['Your Bids'].checked || this.selectors['Affordable'].checked || this.selectors['Mint'].checked || this.selectors['Yours'].checked))break auctionlabel;
            if(this.NFTselect.keys.find(a => a.indexOf('Status') >= 0) && this.selectors['Yours'].checked && this.chains[chain].sets[set].auctions[i].by != this.account)continue auctionlabel;
            if(this.NFTselect.keys.find(a => a.indexOf('Status') >= 0) && this.selectors['Has Bids'].checked && !this.chains[chain].sets[set].auctions[i].bids)continue auctionlabel;
            if(this.NFTselect.keys.find(a => a.indexOf('Status') >= 0) && this.selectors['Your Bids'].checked && this.chains[chain].sets[set].auctions[i].bidder != this.account)continue auctionlabel; //track historic bids
            if(this.NFTselect.keys.find(a => a.indexOf('Status') >= 0) && this.selectors['Affordable'].checked && this.chains[chain].sets[set].auctions[i].price.amount > (this.chains[chain].sets[set].auctions[i].price.token == chain.toUpperCase() ? this.chains[chain].account.balance : this.chains[chain].sets[set].auctions[i].price.token == 'HIVE' ? parseFloat(this.barhive) * 1000 : parseFloat(this.barhbd) * 1000))continue auctionlabel;
            if(this.NFTselect.keys.find(a => a.indexOf('Currency') >= 0) && !this.denoms[this.chains[chain].sets[set].auctions[i].price.token].checked)continue auctionlabel;
            if(this.NFTselect.searchTerm){
              if(this.chains[chain].sets[set].auctions[i].uid.toLowerCase().indexOf(this.NFTselect.searchTerm.toLowerCase()) >= 0){
                this.displayNFTs.push(this.chains[chain].sets[set].auctions[i])
                continue
              }
              if(this.chains[chain].sets[set].auctions[i].name_long.toLowerCase().indexOf(this.NFTselect.searchTerm.toLowerCase()) >= 0){
                this.displayNFTs.push(this.chains[chain].sets[set].auctions[i])
                continue
              }
              if(this.chains[chain].sets[set].auctions[i].by.toLowerCase().indexOf(this.NFTselect.searchTerm.toLowerCase()) >= 0){
                this.displayNFTs.push(this.chains[chain].sets[set].auctions[i])
                continue
              }
              if(this.chains[chain].sets[set].auctions[i].setname.toLowerCase().indexOf(this.NFTselect.searchTerm.toLowerCase()) >= 0){
                this.displayNFTs.push(this.chains[chain].sets[set].auctions[i])
                continue
              }
            } else {
              this.displayNFTs.push(this.chains[chain].sets[set].auctions[i])
            }
          }
        }
      }
      if(this.selectors['Yours'].checked || (this.setPage && !(this.NFTselect.keys.find(a => a.indexOf('Currency') >= 0) || this.selectors['Affordable'].checked || this.selectors['Your Bids'].checked || this.selectors['Has Bids'].checked))){
        if(!( this.selectors['At Auction'].checked || this.selectors['For Sale'].checked)){
          for(var i = 0; (i < this.allNFTs.length && i < this.wantedNum); i++){
            if(this.selectors['Yours'].checked && this.allNFTs[i].owner != this.account)continue
            if(!this.chains[this.jsontoken].sets[set].loaded[this.allNFTs[i].uid]){
              this.chains[this.jsontoken].sets[set].loaded[this.allNFTs[i].uid] = true
              this.callScript(this.allNFTs[i], i).then(d => {
                // this.baseScript[d.script] = comp
                // this.baseScript[d.script].token = this.jsontoken;
                // this.baseScript[d.script].setname = set
                const index = d.i
                delete d.i
                this.chains[this.jsontoken].sets[set].loaded[this.allNFTs[index].uid] = {
                  ...this.allNFTs[index],
                  ...d
                }
                this.chains[this.jsontoken].sets[set].loaded[this.allNFTs[index].uid].token = this.jsontoken
                this.displayNFTs.push(this.chains[this.jsontoken].sets[set].loaded[this.allNFTs[index].uid])
              
              })
            } else {
              this.displayNFTs.push(this.chains[this.jsontoken].sets[set].loaded[this.allNFTs[i].uid])
            }
          }
          if(this.setPage && !this.initialLoad){
            this.handleScroll()
            this.initialLoad = true
          }
        }
      }
      if(this.NFTselect.dir == 'asc'){
        this.displayNFTs.sort((a, b) => {
          if(a.hbd_price < b.hbd_price) return -1
          if(a.hbd_price > b.hbd_price) return 1
          return 0
        })
      } else if(this.NFTselect.dir == 'dec'){
        this.displayNFTs.sort((a, b) => {
          if(a.hbd_price > b.hbd_price) return -1
          if(a.hbd_price < b.hbd_price) return 1
          return 0
        })
      }
      if(this.NFTselect.sort == 'time'){
        this.displayNFTs.sort((a, b) => {
          if(Date.parse(a.time) || 0 > Date.parse(b.time) || 0) return -1
          if(Date.parse(a.time) || 0 < Date.parse(b.time) || 0) return 1
          return 0
        })
        if(this.NFTselect.dir == 'dec'){
          var j = 0
          for (i = 0; i < this.displayNFTs.length; i++) {
            if (this.displayNFTs[i].time == null) {
              j = i - 1
              break
            }
          }
          var temp = []
          for(var i = 0; i < j; i++){
            temp.push(this.displayNFTs[i])
          }
          temp.reverse()
          for(var i = 0; i < j; i++){
            this.displayNFTs[i] = temp[i]
          }
        }
      }
    },
    mintsQty(item){
      return this.getMint(this.chains[item.token]?.sets[item.set]?.set, 'qty')
    },
    ipfsUpload(event) {
      console.log("1", event);
      var rawHeaders = localStorage.getItem(`${this.account}:auth`)
      console.log({ rawHeaders })
      this.validateHeaders(rawHeaders)
        .then(headers => {
          if (window.IpfsHttpClient) {
            const ipfs = window.IpfsHttpClient({
              host: "ipfs.dlux.io",
              port: "443",
              protocol: "https",
              headers: {
                account: this.account,
                nonce: headers.split(":")[0],
                sig: headers.split(":")[1],
              },
            });
            const buf = buffer.Buffer.from("Success");
            ipfs.add(buf, (err, ipfsReturn) => {
              if (!err) {
                console.log(ipfsReturn)
              } else {
                console.log("IPFS Upload Failed", err);
              }
            });
          }
        })
    },
    buyFT(uid, set) {
      var cja = {
        set: set || this.focusSet.set,
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
        set: set || this.focusSet.set,
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
        set: this.mint_detail.set,
        to: this.giveFTusername,
        qty: parseInt(this.giveFTqty),
      };
      this.toSign = {
        type: "cja",
        cj: cja,
        id: `${this.prefix}ft_transfer`,
        msg: `Trying to give ${parseInt(this.giveFTqty)} ${this.mint_detail.set} mint token${parseInt(this.giveFTqty) > 1 ? "s" : ""
          } to ${this.giveFTusername}`,
        ops: ["getTokenUser", "getUserNFTs"],
        api: this.apiFor(this.prefix),
        txid: `${this.prefix} _ft_transfer`,
      };
    },
    tradeFT(setname) {
      const qty = this.tradeQty,
        price = parseInt(this.tradePrice * 1000);
      var cja = { set: setname, to: this.tradeTo, price };
      this.toSign = {
        type: "cja",
        cj: cja,
        id: `${this.prefix}ft_escrow`,
        msg: `Trying to trade ${setname}: Mint Token`,
        ops: ["getTokenUser", "getUserNFTs"],
        api: this.apiFor(this.prefix),
        txid: `${this.prefix} _ft_escrow`,
      };
    },
    sellFT(setname, price, type, quantity = 1, distro) {
      price = parseInt(price * 1000);
      var cja = { set: setname, price },
        id = `${this.prefix}ft_sell`;
      if (type.toUpperCase() == "HIVE") {
        cja.hive = price
        cja.quantity = quantity
        cja.distro = distro
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
    setPFP(item) {
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
      if (prefix == "duat_") return "https://duat.hivehoneycomb.com";
      else return "";
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
    /*
function tradeNFT(setname, uid, to, price, type, callback){
    price = parseInt(price * 1000)
    checkAccount(to)
    .then(r => {
        broadcastCJA({ set: setname, uid, to, price, type}, "dlux_nft_reserve_transfer", `Trying to trade ${setname}:${uid}`)
    })
    .catch(e=>alert(`${to} is not a valid hive account`))
 }
*/
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
    /*
function sellNFT(setname, uid, price, type, callback){
    price = parseInt(price * 1000)
    broadcastCJA({ set: setname, uid, price, type}, "dlux_nft_sell", `Trying to list ${setname}:${uid} for sell`)
 }
*/
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
        set: item.set,
        uid: item.uid,
      },
        type = "cja";
      this.toSign = {
        type,
        cj: cja,
        id: `${this.prefix}nft_sell_cancel`,
        msg: `Canceling: ${item.set}:${item.uid}`,
        ops: ["getUserNFTs"],
        api: this.apiFor(this.prefix),
        txid: `${item.set}:${item.uid}_nft_sell_cancel`,
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
        set: item.set,
        uid: item.uid,
        price: item.price.amount,
      },
        type = "cja";
      if (item.price.token == "HIVE" || item.price.token == "HBD") {
        type = "xfr";
        cja.memo = `NFTbuy ${item.set}:${item.uid}`;
        cja[`${item.price.token.toLowerCase()}`] = item.price.amount;
        cja.to = this.multisig;
      }
      this.toSign = {
        type,
        cj: cja,
        id: `${this.prefix}nft_buy`,
        msg: `Purchasing: ${item.set}:${item.uid}`,
        ops: ["getTokenUser", "getUserNFTs", "getHiveUser"],
        api: this.apiFor(this.prefix),
        txid: `${item.set}:${item.uid}_nft_buy`,
      };
    },
    /*
function auctionNFT(setname, uid, price, now, time, type, callback){
     time = parseInt(time)
    price = parseInt(price * 1000)
    if(type.toUpperCase() == 'HIVE'){
        type = 'HIVE'
    } else if(type.toUpperCase() == 'HBD'){
        type = 'HBD'
    } else {
        type = 0
    }
    if(!type)broadcastCJA({ set: setname, uid, price, now, time}, "dlux_nft_auction", `Trying to auction ${setname}:${uid} for DLUX`)
    else broadcastCJA({ set: setname, uid, price, type, now, time}, "dlux_nft_hauction", `Trying to auction ${setname}:${uid} for ${type}`)
 }

*/
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
    /*
function bidNFT(setname, uid, bid_amount, type, callback){
    console.log({bid_amount, type})
    bid_amount = parseInt(bid_amount * 1000)
    if(type == 'HIVE') broadcastTransfer({ to: 'dlux-cc', hive: bid_amount, memo:`NFTbid ${setname}:${uid}`}, `Bidding on ${setname}:${uid}`)
    else if (type == 'HBD') broadcastTransfer({ to: 'dlux-cc', hbd: bid_amount, memo:`NFTbid ${setname}:${uid}`}, `Bidding on ${setname}:${uid}`)
    else broadcastCJA({ set: setname, uid, bid_amount}, "dlux_nft_bid", `Bidding on ${setname}:${uid} for ${parseFloat(bid_amount/1000).toFixed(3)} DLUX`)
 }

*/
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
    handleScroll: function () {
      if ( this.setPage &&
        Date.now() - this.lastLoad > 2000 &&
        document.documentElement.clientHeight + window.scrollY >
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight * 2
      ) {
        this.lastLoad = Date.now();
        this.NFTselect.amount += 30;
        this.wantedNum += 30;
        this.selectNFTs();
        this.displaynfts()
      }
    },
    modalNext(modal) {
      if (
        this.NFTselect.auctionOnly ||
        this.NFTselect.saleOnly ||
        this.NFTselect.sort == "price" ||
        this.NFTselect.searchTerm
      ) {
        this[modal].index = (this[modal].index + 1) % this[modal].items.length;
        this[modal].item = this[modal].items[this[modal].index];
      } else if (this[modal].index < this[modal].items.length - 1) {
        this[modal].index++;
        this[modal].item = this[modal].items[this[modal].index];
      } else if (this[modal].index < this.allNFTs.length - 1) {
        this.NFTselect.amount += 6;
        this.selectNFTs("", "", [modal, this[modal].index + 1]);
      } else {
        this[modal].index = 0;
        this[modal].item = this[modal].items[this[modal].index];
      }
      if (this[modal].item.owner == "ls") this.saleData(modal);
      else if (this[modal].item.owner == "ah" || this[modal].item.owner == "hh")
        this.auctionData(modal);
    },
    modalPrev(modal) {
      if (this[modal].index) this[modal].index--;
      else this[modal].index = this[modal].items.length - 1;
      this[modal].item = this[modal].items[this[modal].index];
      if (this[modal].item.owner == "ls") this.saleData(modal);
      else if (this[modal].item.owner == "ah" || this[modal].item.owner == "hh")
        this.auctionData(modal);
    },
    modalIndex(modal, index, source = "displayNFTs") {
      if (typeof index != "string") {
        source = index.source
        index = index.index
      }
      var i = 0;
      for (i; i < this[source].length; i++) {
        if (this[source][i].uid == index.split(':')[1] && this[source][i].setname == index.split(':')[0]) break;
      }
      this[modal].index = i;
      this[modal].source = source;
      this[modal].items = this[source]
      this[modal].item = this[modal].items[this[modal].index];
      if (this[modal].item.owner == "ls") this.saleData(modal);
      else if (this[modal].item.owner == "ah" || this[modal].item.owner == "hh")
        this.auctionData(modal);
    },
    pageCtrl(controller) { },
    removeOp(txid) {
      if (this.toSign.txid == txid) {
        this.toSign = {};
      }
    },
    run(op) {
      if (typeof this[op] == "function" && this.account != "GUEST") {
        this[op](this.account);
      }
    },
    auctionData(modal) {
      const uid = this[modal].item.uid;
      this[modal].auction = this.auctions.filter((a) => a.uid == uid)[0];
      this.nftAuctionTabPrice =
        (this[modal].auction.price.amount +
          (this[modal].auction.bids ? 1 : 0)) /
        1000;
    },
    saleData(modal) {
      const uid = this[modal].item.uid;
      this[modal].sale = this.sales.filter((a) => a.uid == uid)[0];
    },
    showToken(k) {
      this.showTokens[k] = !this.showTokens[k];
      this.nftsetsf = this.nftsets.reduce((a, b) => {
        if (this.showTokens[b.token]) {
          a.push(b);
        }
        return a;
      }, []);
    },
    dexBuy(){
      this.toSign = {
        type: "xfr",
        cj: {
          to: this.chains[this.marketorder.name].multisig,
          hive: parseInt(this.marketorder.hive) * 1000,
          memo: ``,
        },
        txid: "sendhive",
        msg: `Market Order`,
        api: this.chains[this.marketorder.name].api,
        ops: ["getTokenUser"],
      }
    },
    popDex(name){
      this.marketorder.name = name
      fetch(this.chains[name].api + "/dex")
      .then(r => r.json())
      .then(r => {
        console.log(r.markets.hive.sells.sort((a,b) => this.parseFloat(a.rate) - this.parseFloat(b.rate)))
        this.marketorder.dex = r.markets.hive.sells.sort((a,b) => this.parseFloat(a.rate) - this.parseFloat(b.rate))
        this.marketorder.value = parseInt(1 / this.marketorder.dex[0].rate) * 1000
      })
    },
    marketValue(){
      var hive = parseInt(this.marketorder.hive * 1000)
      var value = 0
      for(var i = 0; i < this.marketorder.dex.length; i++){
        if(hive < this.marketorder.dex[i].hive){
          value += parseInt(hive / this.marketorder.dex[i].rate)
          break
        } else {
          value += parseInt(this.marketorder.dex[i].amount)
          hive -= this.marketorder.dex[i].hive
        }
      }
      console.log(value, hive)
      this.marketorder.value = value
    },
    popOrder(){
      this.marketorder.hive = parseFloat(this.barhive)
      this.marketValue()
    },
    checkAccount(name, key) {
      fetch("https://anyx.io", {
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
          api: this.apiFor(this.prefix),
          txid: "send",
        };
      } else alert("Username not found");
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
        for (var c = /(\d+)(\d{3})/; c.test(i);)
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
    toLowerCase(v) {
      return typeof v == "string" ? v.toLowerCase() : v;
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
    getPrice(uid, set = this.focusSet.set) {
      if (!this.price[set]) return;
      if (!this.price[set][uid]) return;
      return this.naiString(this.price[set][uid]);
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
    getMint(set, item) {
      for (let i = 0; i < this.accountRNFTs.length; i++) {
        if (this.accountRNFTs[i].set == set) {
          if (item) return this.accountRNFTs[i][item];
          return this.accountRNFTs[i];
        }
      }
      return 0;
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
    getProtocol(token) {
      return new Promise((resolve, reject) => {
        fetch(this.chains[token].api + "/api/protocol")
        .then((response) => response.json())
        .then((data) => {
          this.chains[token].prefix = data.prefix;
          this.chains[token].multisig = data.multisig;
          this.chains[token].jsontoken = data.jsontoken;
          this.chains[token].TOKEN = data.jsontoken.toUpperCase();
          this.chains[token].node = data.node;
          this.chains[token].features = data.features ? data.features : this.features;
          this.chains[token].behind = data.behind;
          this.chains[token].behindTitle = data.behind + " Blocks Behind Hive";
          this.chains[token].volume = {}
          fetch(this.chains[token].api + "/@" + this.account)
          .then((response) => response.json())
          .then((data) => {
            this.chains[token].account = data;
            resolve(data.tick)
          })
          fetch(this.chains[token].api + "/api/recent/HIVE_" + this.TOKEN + "?limit=1000")
            .then((response) => response.json())
            .then((data) => {
              this.chains[token].volume.hive =
                data.recent_trades?.reduce((a, b) => {
                  if (b.trade_timestamp > this.agoTime)
                    return a + parseInt(parseFloat(b.target_volume) * 1000);
                  else return a;
                }, 0) / 1000;
              const tokenvol = data.recent_trades?.reduce((a, b) => {
                if (b.trade_timestamp > this.agoTime)
                  return a + parseInt(parseFloat(b.base_volume) * 1000);
                else return a;
              }, 0) / 1000 || 0
              this.chains[token].volume.token_hive = tokenvol
              const recenthive = data.recent_trades?.sort((a, b) => {
                return (
                  parseInt(b.trade_timestamp) - parseInt(a.trade_timestamp)
                );
              });
              this.chains[token].recenthive = recenthive
            });
          fetch(this.chains[token].api + "/api/recent/HBD_" + this.TOKEN + "?limit=1000")
            .then((response) => response.json())
            .then((data) => {
              const hbdvol = data.recent_trades?.reduce((a, b) => {
                if (b.trade_timestamp > this.agoTime)
                  return a + parseInt(parseFloat(b.target_volume) * 1000);
                else return a;
              }, 0) / 1000 || 0
              this.chains[token].volume.hbd = hbdvol
              this.chains[token].volume.token_hbd =
                data.recent_trades?.reduce((a, b) => {
                  if (b.trade_timestamp > this.agoTime)
                    return a + parseInt(parseFloat(b.base_volume) * 1000);
                  else return a;
                }, 0) / 1000 || 0
              this.chains[token].recenthbd = data.recent_trades?.sort((a, b) => {
                return (
                  parseInt(b.trade_timestamp) - parseInt(a.trade_timestamp)
                );
              }) || 0
            });
        });
      })
    },
    injectIndex(dir){
      this.pairMints()
      switch(dir){
        case 'up':
          this.activeIndexUp()
          break;
        case 'dn':
          this.activeIndexDn()
          break;
        default:
          this.activeIndex = parseInt(dir)
      }
      this.focusItem.set = this.mintData[this.activeIndex].set 
      this.focusItem.token = this.mintData[this.activeIndex].chain
    },
    activeIndexUp(){
      if(this.activeIndex < this.mintData.length - 1) this.activeIndex++
      else this.activeIndex = 0
    },
    activeIndexDn(){
      if(this.activeIndex > 0) this.activeIndex--
      else this.activeIndex = this.mintData.length - 1
    },
    removeUser() {
      this.balance = 0;
      this.bartoken = "";
      this.barpow = "";
      this.bargov = "";
      this.accountapi = "";
      this.hasDrop = false;
      this.openorders = [];
      this.accountinfo = {};
      this.barhive = "";
      this.barhbd = "";
      for(var chain in this.chains){
        console.log('bye', chain)
        this.chains[chain].account = {
          balance: 0
        }
      }
    },
    getPFP() {
      if (this.account) {
        fetch("https://token.dlux.io/api/pfp/" + this.account)
          .then((r) => r.json())
          .then((json) => {
            if (json.result == "No Profile Picture Set or Owned") return;
            this.pfp.set = json.result[0].pfp.split(":")[0];
            this.pfp.uid = json.result[0].pfp.split(":")[1];
          });
      }
    },
    getNFTsets() {
      const getSets = (chain) => {
        this.getProtocol(chain).then((tick) => {
          fetch(this.chains[chain].api + "/api/sets")
          .then((response) => response.json())
          .then((data) => {
            for (let i = 0; i < data.result.length; i++) {
              this.callScript({ script: data.result[i].script, uid: "0" }).then(
                (d) => {
                  const init = {
                    owners: 0,
                    deleted: 0,
                    enabled: false,
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
                  }
                  // spread init over data.result[i]
                  data.result[i] = { ...init, ...data.result[i] }
                  data.result[i].computed = d;
                  data.result[i].token = data.result[i].fee.token;
                  this.showTokens[data.result[i].fee.token] = true;
                  this.nftsets.push(data.result[i]);
                  this.nftsetsf.push(data.result[i]);
                  this.chains[chain].sets[data.result[i].set] = data.result[i]
                  this.denoms[chain.toUpperCase()] = {
                    checked: false
                  }
                  this.getNFTset(data.result[i].set, chain)
                }
              );
            }
          });
        })
      }
      for (var chain in this.chains) {
        getSets(chain);
      }
    },
    getRNFTsales(set, chain = 'dlux') {
      if (set != "index.html") {
        fetch(this.chains[chain].api + "/api/mintsupply/" + set)
          .then((response) => response.json())
          .then((data) => {
            this.chains[chain].sets[set].mintSales = data.result[0].sales
            this.chains[chain].sets[set].mintAuctions = data.result[0].auctions
            this.mintSales = [...this.mintSales, ...data.result[0].sales]
            this.mintAuctions = [...this.mintAuctions, ...data.result[0].auctions]
          })
          .catch((e) => {
            console.log(e);
          });
      }
    },
    getNFTset(set, chain = 'dlux') {
      const api = this.chains[chain].api
      if (set != "index.html") {
        fetch(api + "/api/set/" + set)
          .then((response) => response.json())
          .then((data) => {
            this.callScript({
              script: data.set.script,
              uid: "0",
              set: set,
              owner: null,
            }).then((d) => {
              data.set.computed = d;
              data.setname = set;
              const init = {
                owners: 0,
                deleted: 0,
                enabled: this.setname == set ? true : false,
                mintSales: [],
                sales: [],
                mintAuctions: [],
                auctions: [],
                loaded: {},
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
              }
              // spread init over data.result[i]
              data.set = { ...init, ...data.set }
              this.ready = true;
              this.chains[chain].sets[set] = data.set;
              this.allNFTs = [...this.allNFTs, ...data.result];
              this.allSearchNFTs = [...this.allSearchNFTs, ...data.result]
              this.selectNFTs();
              var owners = [];
              for (var i = 0; i < this.allNFTs.length; i++) {
                if (this.allNFTs[i].owner == this.account)
                  this.iOwn.push(this.allNFTs[i].uid);
                if (
                  !owners.includes(this.allNFTs[i].owner) &&
                  this.allNFTs[i].owner != "D" &&
                  this.allNFTs[i].owner != "ah" &&
                  this.allNFTs[i].owner != "hh" &&
                  this.allNFTs[i].owner != "ls"
                ) {
                  owners.push(this.allNFTs[i].owner);
                } else if (this.allNFTs[i].owner == "D") {
                  this.chains[chain].sets[set].deleted++;
                }
              }
              this.chains[chain].sets[set].owners = owners.length;
              fetch(api + "/api/auctions/" + set)
                .then((response) => response.json())
                .then((data) => {
                  this.chains[chain].sets[set].auctions = data.result.filter((a) => a.set == set);
                  if (!this.price[set]) this.price[set] = {};
                  for (var i = 0; i < this.chains[chain].sets[set].auctions.length; i++) {
                    const token =
                      this.chains[chain].sets[set].auctions[i].price.token == "HIVE"
                        ? "HIVE"
                        : this.chains[chain].sets[set].auctions[i].price.token == "HBD"
                          ? "HBD"
                          : "TOKEN"
                    var hbdPrice = 0
                    switch (token) {
                      case "HIVE":
                        hbdPrice = parseInt(this.chains[chain].sets[set].auctions[i].price.amount * this.hiveprice)
                        break;
                      case "HBD": 
                        hbdPrice = this.chains[chain].sets[set].auctions[i].price.amount
                        break;
                      default:
                        hbdPrice = parseInt(this.chains[chain].sets[set].auctions[i].price.amount * this.hiveprice * this.parseFloat(this.chains[chain].account.tick))
                    }
                    if (
                      this.chains[chain].sets[set].auctions[i].price.amount < this.chains[chain].sets[set].af[token] ||
                      !this.chains[chain].sets[set].af[token]
                    ) {
                      this.chains[chain].sets[set].af[token] = this.chains[chain].sets[set].auctions[i].price.amount;
                    }
                    this.chains[chain].sets[set].forAuction++;
                    this.price[set][this.chains[chain].sets[set].auctions[i].uid] = this.chains[chain].sets[set].auctions[i].price;
                    if (this.chains[chain].sets[set].auctions[i].bidder == this.account)
                      this.highBidder.push(this.chains[chain].sets[set].auctions[i].uid);
                    this.callScript(this.chains[chain].sets[set].auctions[i], i).then(d => {
                      console.log(d.i)
                      const index = d.i
                      delete d.i
                      this.chains[chain].sets[set].auctions[index] = {
                        ...this.chains[chain].sets[set].auctions[index],
                        ...this.price[set][this.chains[chain].sets[set].auctions[index].uid],
                        ...d
                      }
                      this.chains[chain].sets[set].auctions[index].auction = true
                      this.chains[chain].sets[set].auctions[index].token = chain
                      this.chains[chain].sets[set].auctions[index].hbd_price = hbdPrice
                      this.auctions.push(this.chains[chain].sets[set].auctions[index])
                      this.displayNFTs.push(this.chains[chain].sets[set].auctions[index])
                    })
                  }
                });
              fetch(api + "/api/sales/" + set)
                .then((response) => response.json())
                .then((data) => {
                  var presales = data.result
                  if (!this.price[set]) this.price[set] = {};
                  for (var i = 0; i < presales.length; i++) {
                    const token =
                      presales[i].price.token == "HIVE"
                        ? "HIVE"
                        : presales[i].price.token == "HBD"
                          ? "HBD"
                          : "TOKEN";
                    if (
                      presales[i].price.amount < this.chains[chain].sets[set].sf[token] ||
                      !this.chains[chain].sets[set].sf[token]
                    ) {
                      this.chains[chain].sets[set].sf[token] = presales[i].price.amount;
                    }
                    this.chains[chain].sets[set].forSale++;
                    this.price[set][presales[i].uid] = presales[i].price;

                    this.callScript(presales[i], i).then(d => {
                      const index = d.i
                      delete d.i
                      var hbdPrice = 0
                      switch (presales[index].price.token) {
                        case "HIVE":
                          hbdPrice = parseInt(presales[index].price.amount * this.hiveprice)
                          break;
                        case "HBD": 
                          hbdPrice = presales[index].price.amount
                          break;
                        default:
                          hbdPrice = parseInt(presales[index].price.amount * this.hiveprice * this.parseFloat(this.chains[chain].account.tick))
                      }
                      presales[index] = {
                        ...presales[index],
                        ...d
                      }
                      presales[index].sale = true
                      presales[index].hbd_price = hbdPrice
                      presales[index].token = chain
                      this.chains[chain].sets[set].sales.push(presales[index])
                      this.displayNFTs.push(presales[index])
                    })
                  }
                });
              fetch(api + "/api/mintsupply")
                .then((response) => response.json())
                .then((data) => {
                  var mintSales = []
                  var mintAuctions = []
                  this.chains[chain].sets[set].mintData = data.result.filter((a) => a.set == set) || [];
                  this.mintData.push({set, chain})
                  mintSales = data.result.filter((a) => a.set == set) || [];
                  if (mintSales.length) mintSales = mintSales[0].sales;
                  mintAuctions = data.result.filter((a) => a.set == set) || [];
                  if (mintAuctions.length) mintAuctions = mintAuctions[0].auctions;
                  for (var i = 0; i < mintSales.length; i++) {
                    const token =
                      mintSales[i].pricenai.token == "HIVE"
                        ? "HIVE"
                        : mintSales[i].pricenai.token == "HBD"
                          ? "HBD"
                          : "TOKEN";
                    mintSales[i].buyQty = 1;
                    mintSales[i].token = chain
                    mintSales[i].api = this.chains[chain].api
                    mintSales[i].multisig = this.chains[chain].multisig
                    if (
                      mintSales[i].price < this.chains[chain].sets[set].smf[token] ||
                      !this.chains[chain].sets[set].smf[token]
                    ) {
                      this.chains[chain].sets[set].smf[token] = mintSales[i].price;
                    }
                    this.chains[chain].sets[set].forSaleMint += mintSales[i].qty;
                  }
                  for (var i = 0; i < mintAuctions.length; i++) {
                    const token =
                      mintAuctions[i].pricenai.token == "HIVE"
                        ? "HIVE"
                        : mintAuctions[i].pricenai.token == "HBD"
                          ? "HBD"
                          : "TOKEN";
                    mintAuctions[i].bidAmount =
                      (mintAuctions[i].price + 1000)/Math.pow(10, mintAuctions[i].pricenai.precision);
                    if (
                      mintAuctions[i].price < this.chains[chain].sets[set].amf[token] ||
                      !this.chains[chain].sets[set].amf[token]
                    ) {
                      this.chains[chain].sets[set].amf[token] = mintAuctions[i].price;
                    }
                    this.chains[chain].sets[set].forAuctionMint++;
                  }
                  this.chains[chain].sets[set].mintSales = mintSales;
                  this.chains[chain].sets[set].mintAuctions = mintAuctions;
                });
            });
          })
          .catch((e) => {
            location.hash = 'dlux';
            location.reload();
          });
      }
    },
    getIcon(s) {
      return this.baseScript[s] ? this.baseScript[s].set.faicon : "";
    },
    getUserNFTs() {
      fetch("https://token.dlux.io/api/nfts/" + this.account)
        .then((r) => r.json())
        .then((res) => {
          this.accountNFTs = [...res.result, ...this.accountNFTs];
          this.accountRNFTs = [...res.mint_tokens, ...this.accountRNFTs];
        });
      this.getPFP();
    },
    printProps(obj) {
      return Object.keys(obj)
        .map((key) => key + ": " + obj[key])
        .join(", ");
    },
    iOwnView() {
      this.iOwnCheckbox = !this.iOwnCheckbox;
      this.selectNFTs();
    },
    highBidderView() {
      this.highBidderCheckbox = !this.highBidderCheckbox;
      this.selectNFTs();
    },
    selectNFTs(reset, index, modal) {
      if (reset) {
        this.NFTselect.amount = 30;
      }
      var lc =
        typeof this.NFTselect.searchTerm == "string"
          ? this.NFTselect.searchTerm.toLowerCase()
          : "";
      if (index) {
        this.NFTselect.searchDeep = true;
      }
      this.allSearchNFTs = [...this.allNFTs];
      this.uids = [];
      if (this.NFTselect.saleOnly || this.NFTselect.auctionOnly) {
        for (var i = 0; i < this.allSearchNFTs.length; i++) {
          if (this.NFTselect.saleOnly && this.allSearchNFTs[i].owner == "ls") {
            this.uids.push(this.allSearchNFTs[i].uid);
          }
          if (
            this.NFTselect.auctionOnly &&
            (this.allSearchNFTs[i].owner == "ah" ||
              this.allSearchNFTs[i].owner == "hh")
          ) {
            this.uids.push(this.allSearchNFTs[i].uid);
          }
        }
      }
      // add search
      if (this.highBidderCheckbox)
        this.uids = [...this.highBidder, ...this.uids];
      if (this.iOwnCheckbox) this.uids = [...this.iOwn, ...this.uids];
      if (this.uids.length) {
        for (var i = 0; i < this.allSearchNFTs.length; i++) {
          var keep = false;
          for (var j = 0; j < this.uids.length; j++) {
            if (this.allSearchNFTs[i].uid == this.uids[j]) {
              keep = true;
              break;
            }
          }
          if (!keep) {
            this.allSearchNFTs.splice(i, 1);
            i--;
          }
        }
      }
      if (this.NFTselect.searchDeep)
        this.NFTselect.amount = this.allSearchNFTs.length;
      this.NFTselect.searching = true;
      this.selectedNFTs = [];
      if (this.NFTselect.sort == "price") {
        if (
          (this.NFTselect.saleOnly && this.NFTselect.auctionOnly) ||
          (!this.NFTselect.saleOnly && !this.NFTselect.auctionOnly)
        ) {
          this.allSearchNFTs = [
            ...this.auctions.map((a) => {
              a.owner = "ah";
              return a;
            }),
            ...this.sales.map((a) => {
              a.owner = "ls";
              return a;
            }),
          ];
        } else if (this.NFTselect.saleOnly) {
          this.allSearchNFTs = [
            ...this.sales.map((a) => {
              a.owner = "ls";
              return a;
            }),
          ];
        } else {
          this.allSearchNFTs = [
            ...this.auctions.map((a) => {
              a.owner = "ah";
              return a;
            }),
          ];
        }
        this.allSearchNFTs.sort((a, b) => {
          if (a.price.amount > b.price.amount) return 1;
          if (a.price.amount < b.price.amount) return -1;
          return 0;
        });
        if (this.NFTselect.dir == "desc") {
          this.allSearchNFTs.reverse();
        }
      } else {
        this.allSearchNFTs.sort((a, b) => {
          if (this.NFTselect.sort == "uid") {
            if (this.NFTselect.dir == "asc")
              return (
                this.Base64toNumber(a[this.NFTselect.sort]) -
                this.Base64toNumber(b[this.NFTselect.sort])
              );
            else
              return (
                this.Base64toNumber(b[this.NFTselect.sort]) -
                this.Base64toNumber(a[this.NFTselect.sort])
              );
          } else {
            if (a[this.NFTselect.sort] < b[this.NFTselect.sort])
              return this.NFTselect.dir == "asc" ? -1 : 1;
            else return this.NFTselect.dir == "asc" ? 1 : -1;
          }
        });
      }
      var k = 0;
      for (
        var i = this.NFTselect.start;
        i < this.NFTselect.amount && i < this.allSearchNFTs.length;
        i++
      ) {
        if (!this.NFTselect.showDeleted && this.allSearchNFTs[i].owner == "D") {
          //remove entry
          this.allSearchNFTs.splice(i, 1);
          i--;
        } else if (
          !index &&
          !this.NFTselect.searchDeep &&
          this.NFTselect.searchTerm &&
          !(
            this.allSearchNFTs[i].uid.includes(this.NFTselect.searchTerm) ||
            this.allSearchNFTs[i].owner.includes(
              this.NFTselect.searchTerm.toLowerCase()
            )
          )
        ) {
          //remove entry
          this.allSearchNFTs.splice(i, 1);
          i--;
        } else {
          this.callScript(this.allSearchNFTs[i]).then((r) => {
            k++;
            if (
              index ||
              (this.NFTselect.searchDeep && this.NFTselect.searchTerm)
            ) {
              for (var j = 0; j < r.attributes.length; j++) {
                var keys = Object.keys(r.attributes[j]);
                if (
                  this.NFTselect.searchDeepK &&
                  r.attributes[j][this.NFTselect.searchDeepKey] ==
                  this.NFTselect.searchTerm
                ) {
                  this.selectedNFTs.push(r);
                  break;
                } else if (
                  index ||
                  (this.NFTselect.searchDeepKey &&
                    keys[0].includes(this.NFTselect.searchDeepKey) &&
                    r.attributes[j][keys[0]].toLowerCase().includes(lc))
                ) {
                  if (!index) {
                    this.selectedNFTs.push(r);
                  } else {
                    if (!this.focusSetCalc.attributeKeys.includes(keys[0])) {
                      this.focusSetCalc.attributeKeys.push(keys[0]);
                      this.focusSetCalc.attributes[keys[0]] = [];
                      this.focusSetCalc.attributesC[keys[0]] = {};
                    }
                    if (
                      !this.focusSetCalc.attributes[keys[0]].includes(
                        r.attributes[j][keys[0]]
                      )
                    ) {
                      this.focusSetCalc.attributes[keys[0]].push(
                        r.attributes[j][keys[0]]
                      );
                      this.focusSetCalc.attributesC[keys[0]][
                        r.attributes[j][keys[0]]
                      ] = 1;
                    } else {
                      this.focusSetCalc.attributesC[keys[0]][
                        r.attributes[j][keys[0]]
                      ]++;
                    }
                  }
                  if (!index) break;
                } else if (
                  !this.NFTselect.searchDeepKey &&
                  r.attributes[j][keys[0]].toLowerCase().includes(lc)
                ) {
                  this.selectedNFTs.push(r);
                  break;
                }
              }
            } else {
              this.selectedNFTs.push(r);
            }
            if (modal) {
              this[modal[0]].index = modal[1];
              this[modal[0]].item = this[modal[0]].items[this[modal[0]].index];
            }
            if (k == i) {
              this.NFTselect.searching = false;
              if (this.selectedNFTs.length) {
                this.itemModal.items = this.selectedNFTs;
                this.itemModal.item = this.selectedNFTs[0];
              }
            }
          });
        }
      }
    },
    pm(a, b) {
      return a.some((item) => b.includes(item));
    },
    pullScript(id) {
      return new Promise((resolve, reject) => {
        fetch(`https://ipfs.io/ipfs/${id}`)
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
    callScript(o, i = 0) {
      return new Promise((resolve, reject) => {
        if (this.nftscripts[o.script]) {
          const code = `(//${this.nftscripts[o.script]}\n)("${o.uid ? o.uid : 0
            }")`;
          var computed = eval(code);
          computed.uid = o.uid || "";
          computed.owner = o.owner || "";
          computed.script = o.script;
          (computed.setname = o.set), (computed.token = o.token);
          computed.i = i;
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
    makeLink(a, b, c) {
      if (c) return a + b + c.join("");
      return a + b;
    },
    naiString(nai) {
      if(!nai) return ''
      return `${parseFloat(nai.amount / Math.pow(10, nai.precision)).toFixed(
        nai.precision
      )} ${nai.token}`;
    },
    getSetPhotos(s, c) {
      return s.set ? `https://ipfs.io/ipfs/${s.set[c]}` : "";
    },
    getSetDetailsColors(s) {
      let r = "chartreuse,lawngreen";
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
    getSetDetailsInfo(s) {
      let r = "";
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
    getTokenUser(user = this.account) {
      const getUserData = (url, chain, account) => {
        fetch(this.chains[chain].api + "/@" + account)
          .then((response) => response.json())
          .then((data) => {
            this.chains[chain].account = data;
          })
      }
      for(var token in this.chains){
        getUserData(this.chains[token].api + "/@" + user, token, user)
      }
        // fetch(this.lapi + "/@" + user)
        //   .then((response) => response.json())
        //   .then((data) => {
        //     this.balance = (data.balance / 1000).toFixed(3);
        //     this.bartoken = this.balance;
        //     this.barpow = (
        //       (data.poweredUp + data.granted - data.granting) /
        //       1000
        //     ).toFixed(3);
        //     this.bargov = (data.gov / 1000).toFixed(3);
        //     this.accountapi = data;
        //     if (
        //       new Date().getMonth() + 1 !=
        //       parseInt(data.drop?.last_claim, 16) &&
        //       data.drop?.availible.amount > 0
        //     ) {
        //       this.hasDrop = true;
        //       this.dropnai = `${parseFloat(
        //         data.drop.availible.amount /
        //         Math.pow(10, data.drop.availible.precision)
        //       ).toFixed(data.drop.availible.precision)} ${data.drop.availible.token
        //         }`;
        //     }
        //     this.openorders = data.contracts.reduce((acc, cur) => {
        //       cur.nai = `${cur.type.split(":")[0] == "hive"
        //           ? parseFloat(cur.hive / 1000).toFixed(3)
        //           : parseFloat(cur.hbd / 1000).toFixed(3)
        //         } ${cur.type.split(":")[0] == "hive" ? "HIVE" : "HBD"}`;
        //       if (
        //         cur.partials &&
        //         cur.partials.length &&
        //         cur.type.split(":")[1] == "sell"
        //       ) {
        //         const filled = cur.partials.reduce(function (a, c) {
        //           return a + c.coin;
        //         }, 0);
        //         cur.percentFilled = parseFloat(
        //           (100 * filled) / (cur.hive ? cur.hive : cur.hbd + filled)
        //         ).toFixed(2);
        //         acc.push(cur);
        //       } else if (cur.partials && cur.partials.length) {
        //         const filled = cur.partials.reduce(function (a, c) {
        //           return a + c.token;
        //         }, 0);
        //         cur.percentFilled = parseFloat(
        //           (100 * filled) / (cur.amount + filled)
        //         ).toFixed(2);
        //         acc.push(cur);
        //       } else {
        //         cur.percentFilled = "0.00";
        //         acc.push(cur);
        //       }
        //       console.log({
        //         acc,
        //       });
        //       return acc;
        //     }, []);
        //   });
    },
    // calc(){
    //   const names = ['hive', 'hbd', 'dlux', 'duat']
    //     for(var i = 0; i < names.length; i++){
    //       console.log(names[i], this.$refs[`show${names[i]}`].classList, this.$refs[`show${names[i]}`].classList.contains('show'))
    //     }
    // },
    getHiveUser(user) {
      if (user)
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
            this.barhbd = this.accountinfo.hbd_balance;
          });
    },
    getHiveInfo() {
      fetch(hapi, {
        body: `{"jsonrpc":"2.0", "method":"condenser_api.get_current_median_history_price", "params":[], "id":1}`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        method: "POST",
      })
        .then((response) => response.json())
        .then((data) => {
          this.hiveprice = parseFloat(data.result.base)
        });
    },
    pairMints(){
        for(var i = 0; i < this.mintData.length; i++){
          if(this.chains[this.mintData[i].chain].sets[this.mintData[i].set].forAuctionMint || this.chains[this.mintData[i].chain].sets[this.mintData[i].set].mintSales?.length)continue
          else {
            this.mintData.splice(i, 1)
            i--
          }
        }
    },
    animateCountdown(timeString){
      // get current time
      const now = new Date().getTime();
      // get time to countdown to
      const countDownDate = new Date(timeString).getTime();
      // get the difference
      const distance = countDownDate - now;
      // calculate time
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor(
        (distance % (1000 * 60 * 60)) / (1000 * 60)
      );
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }
  },
  mounted() {
    //get hash and set it
    this.getHiveInfo()
    var setName = location.pathname.split("set/")[1] || location.hash.split(':')[1]
    this.setname = setName;
    if (setName) {
      this.setPage = true;
      this.jsontoken = location.hash.replace('#', '').split(':')[0] || 'dlux'
      this.denoms[this.jsontoken.toUpperCase()] = {
        checked: false
      }
      this.NFTselect.keys = [`Chain:${this.jsontoken}`, `Set:${setName}:${this.jsontoken}`]
      for (var chain in this.chains) {
        this.chains[chain].enabled = false;
      }
      this.chains[this.jsontoken].enabled = true;
      this.getNFTset(setName, this.jsontoken);
      this.getProtocol(this.jsontoken);
    } else if (location.pathname.indexOf('nfts/sets') > 0) {
      this.getNFTsets();
    }
    else { //assume index
      this.getNFTsets()
    }
    this.getUserNFTs();
    //this.getQuotes();
    //this.getNodes();
    //if (user != "GUEST") this.getTokenUser();
    if (user != "GUEST") this.getHiveUser();
  },
  computed: {
    location: {
      get() {
        return location;
      },
    },
    // shown: {
    //   get() {
    //     const names = ['hive', 'hbd', 'dlux', 'duat']
    //     for(var i = 0; i < names.length; i++){
    //       if(this.$refs[`show${names[i]}`].classList.value.find('show'))return names[i]
    //     }
    //   }
    // },
    chainSorted:{
      get() {
      return Object.keys(this.chains).sort((a, b) => {
        if(this.chains[a].slot > this.chains[b].slot)return 1
        else if (this.chains[a].slot < this.chains[b].slot)return -1
        else return 0
       })
      }
    },
    includes: {
      get() {
        return this.focusSetCalc.attributes[this.NFTselect.searchDeepKey]
          ? this.focusSetCalc.attributes[this.NFTselect.searchDeepKey].includes(
            this.NFTselect.searchTerm
          )
          : false;
      },
    },
  },
});
