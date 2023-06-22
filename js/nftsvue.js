import Vue from "https://cdn.jsdelivr.net/npm/vue@2.6.14/dist/vue.esm.browser.js";
import Navue from "/js/navue.js";
import FootVue from "/js/footvue.js";
import Cycler from "/js/cycler.js";
import NFTCard from "./nftcard.js";
import NFTTransfer from "./nfttransfer.js";
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
      ohlcv: [],
      toSign: {},
      chains: {
        dlux: {
          enabled: false,
          api: "https://token.dlux.io",
          sets: {},
        },
        duat: {
          enabled: false,
          api: "https://duat.hivehoneycomb.com",
          sets: {},
        }
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
        NATIVE: {
          checked: false},
      },
      selectors: {
        Listed: {
          checked: false},
        ["At Auction"]: {
          checked: false},
        ['Has Bids']: {
          checked: false},
        ['Your Bids']: {
          checked: false},
        Affordable: {
          checked: false},
        Mint: {
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
      mintData: {},
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
    "nfttransfer": NFTTransfer,
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
      console.log({term, keys: this.NFTselect.keys})
      for(var i = 0; i < this.NFTselect.keys.length; i++){
        if((!term || term ==  this.NFTselect.keys[i]) && this.NFTselect.keys[i].indexOf('Chain') == 0){
          this.chains[this.NFTselect.keys[i].split(':')[1]].enabled = false
          // splice
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
          this.selectors[this.NFTselect.keys[i].split(':')[1]].enabled = false
          this.NFTselect.keys.splice(i, 1)
          i--
          continue
        }
      }
      if(!term)this.NFTselect.keys = []
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
            if(this.NFTselect.keys.find(a => a.indexOf('Status') >= 0) && !this.selectors.Listed.checked)break salelabel;
            if(this.NFTselect.searchTerm){
              if(this.chains[chain].sets[set].sales[i].uid.indexOf(this.NFTselect.searchTerm) >= 0)this.displayNFTs.push(this.chains[chain].sets[set].sales[i])
              if(this.chains[chain].sets[set].sales[i].seller.indexOf(this.NFTselect.searchTerm) >= 0)this.displayNFTs.push(this.chains[chain].sets[set].sales[i])
              if(this.chains[chain].sets[set].sales[i].setname.indexOf(this.NFTselect.searchTerm) >= 0)this.displayNFTs.push(this.chains[chain].sets[set].sales[i])
            } else {
              this.displayNFTs.push(this.chains[chain].sets[set].sales[i])
            }
          }
          auctionlabel: for(var i = 0; i < this.chains[chain].sets[set].auctions.length; i++){
            if(this.NFTselect.keys.find(a => a.indexOf('Status') >= 0) && !this.selectors['At Auction'].checked)break auctionlabel;
            this.displayNFTs.push(this.chains[chain].sets[set].auctions[i])
          }
        }
      }
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
    /*
function tradeFT(setname, to, price, callback){
    price = parseInt(price * 1000)
    checkAccount(to)
    .then(r => {
        broadcastCJA({ set: setname, to, price}, "dlux_ft_escrow", `Trying to trade ${setname}: Mint Token`)
    })
    .catch(e=>alert(`${to} is not a valid hive account`))
 }
    */
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
    /*
function sellFT(setname, price, type, quantity = 1, distro,  callback){
    price = parseInt(price * 1000)
    if(type.toUpperCase() == 'HIVE')type = 'hive'
    else if (type.toUpperCase() == 'HBD') type = 'hbd'
    else type = 0
    if(!type)broadcastCJA({set: setname, price}, 'dlux_ft_sell', `Trying to sell ${setname} mint token`)
    else broadcastCJA({set: setname, [type]:price, quantity, distro}, 'dlux_fts_sell_h', `Trying to sell ${setname} mint token`)
 }
    */
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
    /*

 function auctionFT(setname, price, now, time, callback){
    time = parseInt(time)
    price = parseInt(price * 1000)
    broadcastCJA({set:setname, price, now, time}, 'dlux_ft_auction', `Trying to auction ${setname} mint tokens`)
 }

function airdropFT(setname, to_str,  callback){
    let to_array = to_str.split(' ')
    to_array = [... new Set(to_array)]
    var promises = []
    for (item in to_array){ promises.push(checkAccount(to_array[item]))}
    Promise.all(promises)
    .then(r=>{
        broadcastCJA({set:setname, to: to_array}, 'dlux_ft_airdrop', `Trying to airdrop ${setname} mint tokens`)
    })
    .catch(e=>alert(`At least one hive account doesn't exist: ${e}`))
 }

// FT Actions //

function openFT(setname, callback){
    broadcastCJA({set:setname}, 'dlux_nft_mint', `Minting ${setname} token...`)
 }

function sellFTcancel(setname, uid, token,  callback){
     broadcastCJA({set: setname, uid}, token == 'DLUX' ? 'dlux_ft_cancel_sell' : 'dlux_fts_sell_hcancel', `Trying to cancel ${setname} mint token sell`)
 }
function tradeFTaccept(setname, uid, callback){
     broadcastCJA({ set: setname, uid}, "dlux_ft_escrow_complete", `Trying to complete ${setname} mint tokentrade`)
 }

function tradeFTreject(setname, uid, callback){
    broadcastCJA({ set: setname, uid }, "dlux_ft_escrow_cancel", `Trying to cancel ${setname} mint token trade`)
 }

function tradeFTcancel(setname, uid, callback){
    broadcastCJA({ set: setname, uid }, "dlux_ft_escrow_cancel", `Trying to cancel ${setname} mint token trade`)
 }

// NFT Actions //

 function defineNFT(setname, type, script, permlink, start, end, total, royalty, handling, max_fee, bond, callback){
    max_fee = parseInt(max_fee * 1000)
    royalty = parseInt(royalty * 100)
    type = parseInt(type)
    bond = parseInt(bond * 1000)
    //more validation
    broadcastCJA({ name: setname, type, script, permlink, start, end, total, royalty, handling, max_fee, bond}, "dlux_nft_define", `Trying to define ${setname}`)
 }

function tradeNFTaccept(setname, uid, price, type, callback){
    if(type.toUpperCase() == 'HIVE'){
        broadcastTransfer({ to: 'dlux-cc', hive: price, memo:`NFTtrade ${setname}:${uid}`}, `Completing Trade ${setname}:${uid}`)
    } else if (type.toUpperCase() == 'HBD'){
        broadcastTransfer({ to: 'dlux-cc', hbd: price, memo:`NFTtrade ${setname}:${uid}`}, `Completing Trade ${setname}:${uid}`)
    } else {
        broadcastCJA({ set: setname, uid, price}, "dlux_nft_reserve_complete", `Trying to complete ${setname}:${uid} trade`)
    }
 }
function tradeNFTreject(setname, uid, callback){
    broadcastCJA({ set: setname, uid }, "dlux_nft_transfer_cancel", `Trying to cancel ${setname}:${uid} trade`)
 }
function tradeNFTcancel(setname, uid, callback){
    broadcastCJA({ set: setname, uid }, "dlux_nft_transfer_cancel", `Trying to cancel ${setname}:${uid} trade`)
 }
 */
    /*
function setPFP(setname, uid, callback){
    fetch("https://api.hive.blog", {
        body: `{"jsonrpc":"2.0", "method":"condenser_api.get_accounts", "params":[["${user}"]], "id":1}`,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        method: "POST"
        })
        .then(r=>r.json())
        .then(json=>{
            if(JSON.parse(json.result[0].posting_json_metadata).profile.profile_image !== `https://data.dlux.io/pfp/${user}?${setname}-${uid}`){
                var pjm = JSON.parse(json.result[0].posting_json_metadata)
                pjm.profile.profile_image = `https://data.dlux.io/pfp/${user}?${setname}-${uid}`
                const op = 
                    [
                        ['custom_json', {
                            "required_auths": [],
                            "required_posting_auths": [user],
                            "id": "dlux_nft_pfp",
                            "json": JSON.stringify({
                                set: setname,
                                uid
                            })
                        }],
                        ["account_update2",{
                            "account": user,
                            "json_metadata": "",
                            "posting_json_metadata": JSON.stringify(pjm)}
                        ]
                    ]
                Dluxsession.hive_sign([user, op, 'posting'])
                     .then(r => {
                         statusWaiter (r, `Trying to set ${setname}:${uid} as PFP`)
                     })
                     .catch(e => { console.log(e) })
            } else {
                Dluxsession.hive_sign([user, [
                    ['custom_json', {
                        "required_auths": [],
                        "required_posting_auths": [user],
                        "id": "dlux_nft_pfp",
                        "json": JSON.stringify({
                            set: setname,
                            uid
                            })
                        }]
                     ], 'posting'])
                .then(r => {
                    statusWaiter (r, `Trying to set ${setname}:${uid} as PFP`)
                })
                .catch(e => { console.log(e) })
            }
        })
        .catch(e=>{
            console.log(e)
            Dluxsession.hive_sign([user, [
                ['custom_json', {
                    "required_auths": [user],
                    "required_posting_auths": [],
                    "id": "dlux_nft_pfp",
                    "json": JSON.stringify({
                        set: setname,
                        uid
                        })
                    }]
                ], 'posting'])
            .then(r => {
                statusWaiter (r, `Trying to set ${setname}:${uid} as PFP`)
            })
            .catch(e => { console.log(e) })
        })
 }
*/
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
      if (
        document.documentElement.clientHeight + window.scrollY >
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight * 2
      ) {
        this.NFTselect.amount += 30;
        this.selectNFTs();
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
      for (i; i < this.selectedNFTs.length; i++) {
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
    getProtocol() {
      fetch(this.lapi + "/api/protocol")
        .then((response) => response.json())
        .then((data) => {
          this.prefix = data.prefix;
          this.multisig = data.multisig;
          this.jsontoken = data.jsontoken;
          this.TOKEN = data.jsontoken.toUpperCase();
          if (this.TOKEN == "DLUX") this.dataAPI = "https://data.dlux.io";
          else if (data.dataAPI) this.dataAPI = data.dataAPI;
          else this.dataAPI = "";
          this.nftSellTabToken = this.TOKEN;
          this.nftAuctionTabToken = this.TOKEN;
          this.nftTradeTabToken = this.TOKEN;
          location.hash = data.jsontoken;
          this.node = data.node;
          this.features = data.features ? data.features : this.features;
          this.behind = data.behind;
          this.behindTitle = data.behind + " Blocks Behind Hive";
          fetch(this.lapi + "/api/recent/HIVE_" + this.TOKEN + "?limit=1000")
            .then((response) => response.json())
            .then((data) => {
              this.volume.hive =
                data.recent_trades.reduce((a, b) => {
                  if (b.trade_timestamp > this.agoTime)
                    return a + parseInt(parseFloat(b.target_volume) * 1000);
                  else return a;
                }, 0) / 1000;
              this.volume.token_hive =
                data.recent_trades.reduce((a, b) => {
                  if (b.trade_timestamp > this.agoTime)
                    return a + parseInt(parseFloat(b.base_volume) * 1000);
                  else return a;
                }, 0) / 1000;
              this.recenthive = data.recent_trades.sort((a, b) => {
                return (
                  parseInt(b.trade_timestamp) - parseInt(a.trade_timestamp)
                );
              });
            });
          fetch(this.lapi + "/api/recent/HBD_" + this.TOKEN + "?limit=1000")
            .then((response) => response.json())
            .then((data) => {
              this.volume.hbd =
                data.recent_trades.reduce((a, b) => {
                  if (b.trade_timestamp > this.agoTime)
                    return a + parseInt(parseFloat(b.target_volume) * 1000);
                  else return a;
                }, 0) / 1000;
              this.volume.token_hbd =
                data.recent_trades.reduce((a, b) => {
                  if (b.trade_timestamp > this.agoTime)
                    return a + parseInt(parseFloat(b.base_volume) * 1000);
                  else return a;
                }, 0) / 1000;
              this.recenthbd = data.recent_trades.sort((a, b) => {
                return (
                  parseInt(b.trade_timestamp) - parseInt(a.trade_timestamp)
                );
              });
            });
        });
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
                  this.getNFTset(data.result[i].set, chain)
                }
              );
            }
          });
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
                enabled: false,
                sales: [],
                auctions: [],
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
                      this.auctions.push(this.chains[chain].sets[set].auctions[index])
                      this.displayNFTs.push(this.chains[chain].sets[set].auctions[index])
                    })
                  }
                });
              fetch(api + "/api/sales/" + set)
                .then((response) => response.json())
                .then((data) => {
                  const presales = data.result
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
                      presales[index] = {
                        ...presales[index],
                        ...d
                      }
                      presales[index].sale = true
                      presales[index].token = chain
                      this.chains[chain].sets[set].sales.push(presales[index])
                      this.displayNFTs.push(presales[index])
                    })
                  }
                });
              fetch(api + "/api/mintsupply")
                .then((response) => response.json())
                .then((data) => {
                  this.mintData = data.result.filter((a) => a.set == set) || [];
                  if (this.mintData.length) this.mintData = this.mintData[0];
                  else this.mintSales = {};
                  this.mintSales = data.result.filter((a) => a.set == set) || [];
                  if (this.mintSales.length) this.mintSales = this.mintSales[0].sales;
                  this.mintAuctions = data.result.filter((a) => a.set == set) || [];
                  if (this.mintAuctions.length)
                    this.mintAuctions = this.mintAuctions[0].auctions;
                  for (var i = 0; i < this.mintSales.length; i++) {
                    const token =
                      this.mintSales[i].pricenai.token == "HIVE"
                        ? "HIVE"
                        : this.mintSales[i].pricenai.token == "HBD"
                          ? "HBD"
                          : "TOKEN";
                    this.mintSales[i].buyQty = 1;
                    if (
                      this.mintSales[i].price < this.chains[chain].sets[set].smf[token] ||
                      !this.chains[chain].sets[set].smf[token]
                    ) {
                      this.chains[chain].sets[set].smf[token] = this.mintSales[i].price;
                    }
                    this.chains[chain].sets[set].forSaleMint += this.mintSales[i].qty;
                  }
                  for (var i = 0; i < this.mintAuctions.length; i++) {
                    const token =
                      this.mintAuctions[i].pricenai.token == "HIVE"
                        ? "HIVE"
                        : this.mintAuctions[i].pricenai.token == "HBD"
                          ? "HBD"
                          : "TOKEN";
                    this.mintAuctions[i].bidAmount =
                      this.mintAuctions[i].price + 1000;
                    if (
                      this.mintAuctions[i].price < this.chains[chain].sets[set].amf[token] ||
                      !this.chains[chain].sets[set].amf[token]
                    ) {
                      this.chains[chain].sets[set].amf[token] = this.mintAuctions[i].price;
                    }
                    this.chains[chain].sets[set].forAuctionMint++;
                  }
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
      fetch(this.lapi + "/api/nfts/" + this.account)
        .then((r) => r.json())
        .then((res) => {
          this.accountNFTs = res.result;
          this.accountRNFTs = res.mint_tokens;
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
    getTokenUser(user) {
      if (user)
        fetch(this.lapi + "/@" + user)
          .then((response) => response.json())
          .then((data) => {
            this.balance = (data.balance / 1000).toFixed(3);
            this.bartoken = this.balance;
            this.barpow = (
              (data.poweredUp + data.granted - data.granting) /
              1000
            ).toFixed(3);
            this.bargov = (data.gov / 1000).toFixed(3);
            this.accountapi = data;
            if (
              new Date().getMonth() + 1 !=
              parseInt(data.drop?.last_claim, 16) &&
              data.drop?.availible.amount > 0
            ) {
              this.hasDrop = true;
              this.dropnai = `${parseFloat(
                data.drop.availible.amount /
                Math.pow(10, data.drop.availible.precision)
              ).toFixed(data.drop.availible.precision)} ${data.drop.availible.token
                }`;
            }
            this.openorders = data.contracts.reduce((acc, cur) => {
              cur.nai = `${cur.type.split(":")[0] == "hive"
                  ? parseFloat(cur.hive / 1000).toFixed(3)
                  : parseFloat(cur.hbd / 1000).toFixed(3)
                } ${cur.type.split(":")[0] == "hive" ? "HIVE" : "HBD"}`;
              if (
                cur.partials &&
                cur.partials.length &&
                cur.type.split(":")[1] == "sell"
              ) {
                const filled = cur.partials.reduce(function (a, c) {
                  return a + c.coin;
                }, 0);
                cur.percentFilled = parseFloat(
                  (100 * filled) / (cur.hive ? cur.hive : cur.hbd + filled)
                ).toFixed(2);
                acc.push(cur);
              } else if (cur.partials && cur.partials.length) {
                const filled = cur.partials.reduce(function (a, c) {
                  return a + c.token;
                }, 0);
                cur.percentFilled = parseFloat(
                  (100 * filled) / (cur.amount + filled)
                ).toFixed(2);
                acc.push(cur);
              } else {
                cur.percentFilled = "0.00";
                acc.push(cur);
              }
              console.log({
                acc,
              });
              return acc;
            }, []);
          });
    },
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
  },
  mounted() {
    //get hash and set it
    var setName = location.pathname.split("set/")[1];
    this.setname = setName;
    if (setName) {
      this.jsontoken = location.hash.replace('#', '') || 'dlux'
      for (var chain in this.chains) {
        this.chains[chain].enabled = false;
      }
      this.chains[this.jsontoken].enabled = true;
      this.getNFTset(setName, this.jsontoken);
    } else if (location.pathname.indexOf('nfts/sets') > 0) {
      this.getNFTsets();
    }
    else { //assume index
      this.getNFTsets()
    }
    this.getUserNFTs();
    //this.getQuotes();
    //this.getNodes();
    this.getProtocol();
    if (user != "GUEST") this.getTokenUser(user);
    if (user != "GUEST") this.getHiveUser(user);
  },
  computed: {
    location: {
      get() {
        return location;
      },
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
