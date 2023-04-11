import Vue from "https://cdn.jsdelivr.net/npm/vue@2.6.14/dist/vue.esm.browser.js";
import Navue from "/js/navue.js";
import FootVue from "/js/footvue.js";
import Cycler from "/js/cycler.js";
import Popper from "/js/pop.js";
import Modals from "/js/modalvue.js";
import Marker from "/js/marker.js";
import Ratings from "/js/ratings.js";

let url = location.href.replace(/\/$/, "");
let lapi = "",
  sapi = "https://spktest.dlux.io";
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
  lapi = "https://spktest.dlux.io";
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
      fileRequests: {},
      register:{
        amount: 0,
        api: '',
      },
      files: {},
      sets: {},
      contract: {
        api: '',
        id: '',
        files: '',
        fosig: '', //file-owner
        spsig: '', //service-provider 
        s: 10485760,
        t: 0
      },
      simple: {
        checked: false,
      },
      sponsored: {
        checked: true,
      },
      disablePost: true,
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
        "vrHash": "QmNby3SMAAa9hBVHvdkKvvTqs7ssK4nYa2jBdZkxqmRc16"
      },
      nftTradeTabTo: "",
      nftTradeTabToken: "",
      nftTradeTabPrice: 0,
      nftSellTabToken: "",
      nftSellTabPrice: 0,
      nftAuctionTabToken: "",
      nftAuctionTabPrice: 0,
      nftAuctionTabTime: 0,
      toSign: {},
      account: user,
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
        { api: "https://duat.hivehoneycomb.com", token: "duat" },
      ],
      scripts: {},
      nftscripts: {},
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
      selectedNFTs: [],
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
      mintData: {},
      giveFTusername: "",
      giveFTqty: 1,
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
        set: "dlux",
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
      pfp: {
        set: "",
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
        broca: '0,0',
        spk: 0,
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
      validators: {},
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
      behindTitle: "",
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
      trending: [],
      promoted: [],
      search: [],
      postSelect: {
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
      showWallet: false,
    };
  },
  components: {
    "nav-vue": Navue,
    "foot-vue": FootVue,
    "cycle-text": Cycler,
    "pop-vue": Popper,
    "modal-vue": Modals,
    "vue-markdown": Marker,
    "vue-ratings": Ratings,
  },
  methods: {
    buildTags(){
      this.postTags = this.postTags.replace(/#/g, "");
    },
    saveNodeSettings(){
      var cja = {};
      for (var i = 0; i < this.tokenGov.options.length; i++){
        console.log(this.tokenGov.options[i].id, this.tokenGov.options[i].val)
        cja[this.tokenGov.options[i].id] = this.tokenGov.options[i].val
      }
      this.toSign = {
        type: "cja",
        cj: cja,
        id: `spkcc_spk_vote`,
        msg: `Voting...`,
        ops: ["getSapi"],
        api: sapi,
        txid: `spkcc_spk_vote`,
      };
    },
    updatePubkey() {
      var cja = {
        pubKey: this.accountinfo.posting.key_auths[0][0]
      };
      this.toSign = {
        type: "cja",
        cj: cja,
        id: `spkcc_register_authority`,
        msg: `Registering: ${this.account}:${this.accountinfo.posting.key_auths[0][0]}`,
        ops: ["getSapi"],
        api: sapi,
        txid: `spkcc_register_authority`,
      };
    },
    getSetPhotos(s, c) {
      return s.set ? `https://ipfs.io/ipfs/${s.set[c]}` : "";
    },
    uploadFile(e) {
      console.log(e)
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
              Hash.of(buffer.Buffer(fileContent), {unixfs: 'UnixFS'}).then((hash) => {
                const dict = { hash, index: i, size: event.currentTarget.File.size, name: event.currentTarget.File.name, path: e.target.id, progress: 0 }
                this.FileInfo[dict.name] = dict
                // this.File[i].md5 = hash;
                // this.File[i].blob = new Blob([fileContent], event.currentTarget.File.name)
                const file = this.File[i];
                this.File.splice(i, 1, file);
              });
              break
            }
          }
        };
        
        reader.readAsArrayBuffer(e.target.files[i])
        var File = e.target.files[i];
        File.progress = 0;
        File.actions = {
          cancel: true,
          pause: false,
          resume: false,
        }
        // File.md5 = ""
        this.File.push(File);
      }
    },
    dragFile(e) {
      console.log(e)
      e.preventDefault();
      for (var i = 0; i < e.dataTransfer.files.length; i++) {
        var reader = new FileReader();
        reader.File = e.dataTransfer.files[i]
        reader.onload = (event) => {
          const fileContent = event.target.result;
          // for (var i = 0; i < this.File.length; i++) {
          //   if (
          //     this.File[i].name == event.currentTarget.File.name
          //     && this.File[i].size == event.currentTarget.File.size
          //   ) {
          Hash.of(buffer.Buffer(fileContent)).then(hash => {
            console.log('hereasdasd')
            const dict = { hash, index: this.File.length, size: event.currentTarget.File.size, name: event.currentTarget.File.name }
            this.FileInfo[dict.name] = dict
            // var File = e.dataTransfer.files[i];
            var File = event.currentTarget.File
            File.progress = 0;
            File.actions = {
              cancel: true,
              pause: false,
              resume: false,
            }
            this.File.push(File);
          })
          //   }
          // }
          
        };
        reader.readAsArrayBuffer(e.dataTransfer.files[i]);
        // var File = e.dataTransfer.files[i];
        // File.progress = 0;
        // File.actions = {
        //   cancel: true,
        //   pause: false,
        //   resume: false,
        // }
        // this.File.push(File);
      }
    },
    togglePin(index) {
      this.File[index].pin = !this.File[index].pin;
    },
    petitionForContract(){
      fetch(`https://ipfs.dlux.io/upload-contract?user=${this.account}`)
      .then(r=>r.json())
      .then(json =>{
        console.log(json)
      })
    },
    deleteImg(index) {
      this.File.splice(index, 1)
    },
    getContractMarket() {
      //fetch contract market
      fetch(this.sapi)
        .then(res => res.json())
        .then(res => {
          this.contractMarket = res.upload_providers ? res.upload_providers : [{ n: 'regardspk', u: 'https://regardspk.com', }]
        })
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
    slotDecode(slot, index) {
      var item = slot.split(',')
      switch (index) {
        case 1:
          return parseFloat(item[1]/100).toFixed(2)
          break;
        default:
          return item[0]
          break;
      } index
    },
    broca_calc(last = '0,0'){
      console.log(last)
      const last_calc = this.Base64toNumber(last.split(',')[1])
    const accured = parseInt((parseFloat(this.sstats.broca_refill) * (this.sstats.head_block - last_calc))/(this.saccountapi.spk_power * 1000))
    var total = parseInt(last.split(',')[0]) + accured
    if(total > (this.saccountapi.spk_power * 1000))total = (this.saccountapi.spk_power * 1000)
    return total
    },
    post() {
      var tags = this.postTags.toLowerCase().split(',')
      this.postCustom_json.tags = ['dlux']
      for (i = 0; i < tags.length; i++) {
        if (tags[i] != 'dlux') {
          this.postCustom_json.tags.push(tags[i].replace(/[\W_]+/g, "-"));
        }
      }
      console.log(custom_json.tags)
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
    signText(challenge) {
      return new Promise((res, rej) => {
        this.toSign = {
          type: "sign_headers",
          challenge,
          key: "posting",
          ops: [],
          callbacks: [res, rej],
          txid: "Sign Auth Headers",
        };
      });
    },
    selectContract(id, broker){  //needs PeerID of broker
      this.contract.id = id
      fetch(`${sapi}/user_services/${broker}`)
      .then(r=> r.json())
      .then(res=>{
        console.log(res)
        this.contract.api = res.services.IPFS[Object.keys(res.services.IPFS)[0]].a
      })
    },
    signNUpload() {
      console.log(this.contract.id)
      var header = `${this.contract.id}`
      var body = ""
      var names = Object.keys(this.FileInfo)
      var cids = []
      for (var i = 0; i < names.length; i++) {
        body += `,${this.FileInfo[names[i]].hash}`
        cids.push(this.FileInfo[names[i]].hash)
      }
      this.contract.files = body
      this.signText(header + body).then(res => {
        console.log({ res })
        this.contract.fosig = res.split(":")[3]
        this.upload(cids, this.contract)
      })
    },
    upload(cids = ['QmYJ2QP58rXFLGDUnBzfPSybDy3BnKNsDXh6swQyH7qim3'], contract = { api: 'https://ipfs.dlux.io', id: '1668913215284', sigs: {}, s: 10485760, t: 0 }) {
      var files = []
      for (var name in this.FileInfo) {
        for (var i = 0; i < cids.length; i++) {
          if (this.FileInfo[name].hash == cids[i]) {
            this.File[this.FileInfo[name].index].cid = cids[i]
            files.push(this.File[this.FileInfo[name].index])
            break;
          }
        }
      }
      const ENDPOINTS = {
        UPLOAD: `${this.contract.api}/upload`,
        UPLOAD_STATUS: `${this.contract.api}/upload-check`,
        UPLOAD_REQUEST: `${this.contract.api}/upload-authorize`
      };
      const defaultOptions = {
        url: ENDPOINTS.UPLOAD,
        startingByte: 0,
        contract: contract,
        cid: null,
        cids: `,${cids.join(',')}`,
        onAbort: (e,f) => {
          console.log('options.onAbort')
          // const fileObj = files.get(file);
          this.File = []
          this.FileInfo = {}
          this.fileRequests = {}
          // updateFileElement(fileObj);
        },
        onProgress: (e,f) => {
          console.log(e, f, this.FileInfo, this.File)
          this.File[this.FileInfo[f.name].index].actions.pause = true
          this.File[this.FileInfo[f.name].index].actions.resume = false
          this.File[this.FileInfo[f.name].index].actions.cancel = true
          this.File[this.FileInfo[f.name].index].progress = e.percentage
          // const fileObj = files.get(file);
          this.FileInfo[f.name].status = 'uploading'
          // fileObj.status = FILE_STATUS.UPLOADING;
          // fileObj.percentage = e.percentage;
          // fileObj.uploadedChunkSize = e.loaded;

          // updateFileElement(fileObj);
        },
        onError: (e,f) => {
          console.log('options.onError', e, f)
          // const fileObj = files.get(file);
          this.FileInfo[f.name].status = '!!ERROR!!'
          // fileObj.status = FILE_STATUS.FAILED;
          // fileObj.percentage = 100;
          this.File[this.FileInfo[f.name].index].actions.pause = false
          this.File[this.FileInfo[f.name].index].actions.resume = true
          this.File[this.FileInfo[f.name].index].actions.cancel = true
          // updateFileElement(fileObj);
        },
        onComplete: (e,f) => {
          console.log('options.onComplete', e, f)
          this.File[this.FileInfo[f.name].index].actions.pause = false
          this.File[this.FileInfo[f.name].index].actions.resume = false
          this.File[this.FileInfo[f.name].index].actions.cancel = false
          this.FileInfo[f.name].progress = 1
          this.FileInfo[f.name].status = 'done'
          
        }
      };
      const uploadFileChunks = (file, options) => {
        const formData = new FormData();
        const req = new XMLHttpRequest();
        const chunk = file.slice(options.startingByte);

        formData.append('chunk', chunk);
        console.log(options)
        req.open('POST', options.url, true);
        req.setRequestHeader(
          'Content-Range', `bytes=${options.startingByte}-${options.startingByte + chunk.size}/${file.size}`
        );
        req.setRequestHeader('X-Cid', options.cid);
        req.setRequestHeader('X-Contract', options.contract.id);
        req.setRequestHeader('X-Sig', options.contract.fosig);
        req.setRequestHeader('X-Account', this.account);
        req.setRequestHeader('X-Files', options.cids);


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

        this.fileRequests[options.cid].request = req;

        req.send(formData);
      };
      const uploadFile = (file, options) => {
        console.log('Uploading', options.contract)
        return fetch(ENDPOINTS.UPLOAD_REQUEST, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Sig': options.contract.fosig,
            'X-Account': this.account,
            'X-Contract': options.contract.id,
            'X-Cid': options.cid,
            'X-Files': options.contract.files,
            'X-Chain': 'HIVE'
          }
        })
          .then(res => res.json())
          .then(res => {
            options = { ...options, ...res };
            this.fileRequests[options.cid] = { request: null, options }
            uploadFileChunks(file, options);
          })
          .catch(e => {
            console.log(e)
            options.onError({ ...e, file })
          })
      };
      const abortFileUpload = (file) => {
        const fileReq = fileRequests.get(file);

        if (fileReq && fileReq.request) {
          fileReq.request.abort();
          return true;
        }

        return false;
      };
      const retryFileUpload = (file) => {
        const fileReq = fileRequests.get(file);

        if (fileReq) {
          // try to get the status just in case it failed mid upload
          return fetch(
            `${ENDPOINTS.UPLOAD_STATUS}?fileName=${file.name}&fileId=${fileReq.options.fileId}`)
            .then(res => res.json())
            .then(res => {
              // if uploaded we continue
              uploadFileChunks(
                file,
                {
                  ...fileReq.options,
                  startingByte: Number(res.totalChunkUploaded)
                }
              );
            })
            .catch(() => {
              // if never uploaded we start
              uploadFileChunks(file, fileReq.options)
            })
        }
      };
      const clearFileUpload = (file) => {
        const fileReq = fileRequests.get(file);

        if (fileReq) {
          abortFileUpload(file)
          fileRequests.delete(file);

          return true;
        }

        return false;
      };
      const resumeFileUpload = (file) => {
        const fileReq = this.fileRequests[cid];

        if (fileReq) {
          return fetch(
            `${ENDPOINTS.UPLOAD_STATUS}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'sig': contract.fosig,
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
      [...files]
          .forEach(file => {
            console.log(file)
            let options = defaultOptions
            options.cid = file.cid
            uploadFile(file, options)
          });
      return (files, options = defaultOptions) => {
        [...files]
          .forEach(file => {
            console.log(file)
            options.cid = file.cid
            uploadFile(file, options)
          });

        return {
          abortFileUpload,
          retryFileUpload,
          clearFileUpload,
          resumeFileUpload
        };
      }
    },
    replace(string, char = ':'){
      return string.replaceAll(char, '_')
    },
    appendFile(file, id){
      if(this.files[file])delete this.files[file]
      else this.files[file] = id
    },
    uploadAndTrack(name, contract) {
      this.signText().then((headers) => {
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
        msg: `Trying to give ${parseInt(this.giveFTqty)} ${this.mint_detail.set
          } mint token${parseInt(this.giveFTqty) > 1 ? "s" : ""} to ${this.giveFTusername
          }`,
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
    tradeFT(item) {
      const price = parseInt(this.FTmenu.amount * 1000);
      var cja = { set: item.set, to: this.FTmenu.to, price };
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
*/

    openFT(item) {
      var cja = {
        set: item.set,
      },
        type = "cja";
      this.toSign = {
        type,
        cj: cja,
        id: `${item.token}_nft_mint`,
        msg: `Minting: ${item.set} NFT`,
        ops: ["getUserNFTs"],
        api: this.apiFor(item.token),
        txid: `${item.set}_nft_mint`,
      };
    },

    acceptFT(item) {
      var cja = {
        set: item.set,
        uid: item.uid,
      },
        type = "cja";
      this.toSign = {
        type,
        cj: cja,
        id: `${item.token}_ft_escrow_complete`,
        msg: `Proposing Trade: ${item.set}:${item.uid}`,
        ops: ["getUserNFTs"],
        api: this.apiFor(item.token),
        txid: `${item.set}:${item.uid}_ft_escrow_complete`,
      };
    },

    rejectFT(item) {
      console.log({ item });
      var cja = {
        set: item.set,
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
      if (
        document.documentElement.clientHeight + window.scrollY >
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight * 2
      ) {
        this.getPosts();
      }
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
    run(op) {
      if (typeof this[op] == "function" && this.account != "GUEST") {
        this[op](this.account);
      }
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
          var rez = re.result[0];
          console.log(name, rez, rez.posting_json_metadata);
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
          if (re.result.length) this[key] = rez;
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
          txid: "send",
        };
      } else alert("Username not found");
    },
    sendIt(op) {
      console.log(op);
      this.toSign = op;
    },
    parseInt(a, b = 10) {
      return parseInt(a, b);
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
    setApi(url) {
      // remove trailing slash
      if (url.substr(-1) == "/") {
        url = url.substr(0, url.length - 1);
      }
      let api =
        url ||
        prompt("Please enter your API", "https://spktest.dlux.io");
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
        return `https://ipfs.io/ipfs/${json.Hash360}`;
      } else {
        /*
                var looker
                try {
                    looker = body.split('![')[1]
                    looker = looker.split('(')[1]
                    looker = looker.split(')')[0]
                } catch (e) {
                    */
        return "/img/dluxdefault.svg";
      }
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
          this.validator_totals = data.validators;
          this.sstats = data.stats;
          this.sstats.head_block = data.head_block;
          let validators = {}
          for (var node in this.sstats.nodes) {
            if(this.sstats.nodes[node].val_code) {
              validators[node] = this.sstats.nodes[node]
              validators[node].votes = this.sstats.nodes[node].val_code
            }
          }
          this.validators = validators
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
        console.log({
          t,
          a,
          b,
          c,
          d: this.saccountapi.granted?.t > 0 ? this.saccountapi.granted.t : 0,
          g: this.saccountapi.granting?.t > 0 ? this.saccountapi.granting.t : 0,
        });
        const i = a + b + c;
        if (i) {
          console.log(i, "Phantom SPK");
          return i;
        } else {
          console.log("0 SPK");
          return 0;
        }
      }
      function simpleInterest(p, t, r) {
        console.log({ p, t, r });
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
          if(data.votable)this.votable = data.votable;
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
        fetch(this.lapi + "/api/pfp/" + this.account)
          .then((r) => r.json())
          .then((json) => {
            if (json.result == "No Profile Picture Set or Owned") return;
            this.pfp.set = json.result[0].pfp.split(":")[0];
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
    getNFTs() {
      this.accountNFTs = [];
      this.accountRNFTs = [];
      for (var i = 0; i < this.providers.length; i++) {
        this.NFTsLookUp(this.account, this.providers, i);
        this.trades(i);
        this.getSetDetails(i);
      }
    },
    getSetDetails(i) {
      fetch(`${this.providers[i].api}/api/sets`)
        .then((r) => r.json())
        .then((res) => {
          this.sets[this.providers[i].token] = {};
          for (var j = 0; j < res.result.length; j++) {
            this.sets[this.providers[i].token][res.result[j].set] =
              res.result[j];
          }
        });
    },
    finishPFT(s) {
      if (this.baseScript[s.script]) {
        this.FTtrades.push(s);
      } else
        setTimeout(() => {
          this.finishPFT(s);
        }, 250);
    },
    finishPNFT(s) {
      if (this.baseScript[s.script]) {
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
          console.log("FT trades", { json, fts: this.providers[i].api });
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
          console.log("NFT trades", { json, nfts: this.providers[i].api });
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
            scripts[NFTs[j].script] = { token: p[i].token, set: NFTs[j].set };
            this.callScript(NFTs[j]).then((comp) => {
              this.accountNFTs.push(comp);
              this.displayNFT(0);
            });
          }
          console.log(rNFTs);
          for (var j = 0; j < rNFTs.length; j++) {
            rNFTs[j].token = p[i].token;
            scripts[rNFTs[j].script] = 1;
            this.accountRNFTs.push(rNFTs[j]);
            console.log(j, rNFTs[j], this.accountRNFTs);
          }
          for (var script in scripts) {
            console.log({ script });
            this.callScript({
              script,
              token: scripts[script].token,
              set: scripts[script].set,
            }).then((comp) => {
              this.baseScript[comp.script] = comp;
              this.baseScript[comp.script].token = p[i].token;
              this.baseScript[comp.script].setname = scripts[script].set;
            });
          }
        });
    },
    getAttr(script, att) {
      if (this.baseScript[script]) return this.baseScript[script].set[att];
    },
    getTokenUser(user = this.account, fu) {
      fetch(this.lapi + "/@" + user)
        .then((response) => response.json())
        .then((data) => {
          data.tick = data.tick || 0.01;
          this.behind = data.behind;
          if (!fu) {
            this.balance = (data.balance / 1000).toFixed(3);
            this.bargov = (data.gov / 1000).toFixed(3);
            this.accountapi = data;
            this.dluxval =
              (data.balance + data.gov + data.poweredUp + data.claim) / 1000;
          } else {
            this.focusaccountapi = data;
          }
        });
    },
    exp_to_time(exp){
      return this.when([parseInt(exp.split(':')[0])])
    },
    getSpkStats() {
      fetch(this.sapi + "/stats")
        .then((response) => response.json())
        .then((data) => {
          console.log(data);
          this.spkStats = data.result;
          for (var i = 0; i < this.tokenGov.options.length; i++) {
            this.tokenGov.options[i].val = data.result[this.tokenGov.options[i].id]
            this.tokenGov.options[i].range_high = parseFloat(this.tokenGov.options[i].val * 1.01).toFixed(6)
            this.tokenGov.options[i].range_low = parseFloat(this.tokenGov.options[i].val * 0.99).toFixed(6)
            this.tokenGov.options[i].step = "0.000001"
          }
        });
    },
    checkAccountKey(location){
      var val = ''
      var drill = this[location[0]]
      for (var i = 1; i < location.length; i++){
        if (typeof drill == 'string'){
          val = drill
          if (i != location.length - 1){
            location = location.slice(0, i)
          }
          break
        } else val = drill[location[i]]
      }
      fetch(this.sapi + "/@" + val)
        .then((response) => response.json())
        .then((data) => {
          if(data.pubKey == 'NA'){
            const accessor = `this.${location.join('.')}`
            eval(accessor + ' = "Account has not registered a public key yet."')
          }
        })
    },
    getSapi(user = this.account, fu) {
      fetch(this.sapi + "/@" + user)
        .then((response) => response.json())
        .then((data) => {
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
    getIPFSproviders() {
      fetch(this.sapi + "/services/IPFS")
        .then((response) => response.json())
        .then((data) => {
          this.ipfsProviders = data.providers
        });
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
          this.barhbd = this.accountinfo.hbd_balance;
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
    callScript(o) {
      return new Promise((resolve, reject) => {
        if (this.nftscripts[o.script]) {
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
      this.getQuotes();
      this.getSNodes();
      this.getProtocol();
      this.getSpkStats();
      this.getRewardFund();
      this.getFeedPrice();
      this.getSapi(this.pageAccount, false);
      this.getTokenUser(this.pageAccount, false);
      //this.getNFTs();
    },
    getIcon(s) {
      return this.baseScript[s] ? this.baseScript[s].set.faicon : "";
    },
  },
  mounted() {
    console.log(location.pathname.split("/@")[1]);
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
    this.getQuotes();
    this.getSNodes();
    this.getProtocol();
    this.getSpkStats();
    this.getRewardFund();
    this.getFeedPrice();
    this.getIPFSproviders();
    this.getSapi(this.pageAccount, false);
    this.getTokenUser(this.pageAccount, false);
    //this.getNFTs();
    //deepLink();
  },
  watch: {
    postSelect(a, b) {
      if (a.searchTerm != b.searchTerm || a.bitMask != b.bitMask) {
        console.log("Watched");
        this.displayPosts = [];
        this[this.postSelect.entry] = [];
        this.postSelect[this.postSelect.entry].o = 0;
        this.postSelect[this.postSelect.entry].e = false;
      }
    },
  },
  computed: {
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
    isValidator: {
      get() {
        return this.smarkets.node?.[this.account]?.val_code ? true : false;
      },
    },
    // hasService: {
    //   get() {
    //     return this.smarkets.node?.[this.account]?.val_code ? true : false;
    //   },
    // },
    hasFiles: {
      get() {
        return Object.keys(this.saccountapi.file_contracts).length
      }
    },
    fileInfoLength: {
      get() {
        return Object.keys(this.FileInfo).length
      }
    },
    compiledMarkdown: function () {
      return marked(this.postBody, { sanitize: true });
    },
    voteVal() {
      return (
        (this.accountinfo.rshares / parseInt(this.rewardFund.recent_claims)) *
        parseFloat(this.rewardFund.reward_balance) *
        (1 / parseFloat(this.feedPrice.base))
      );
    },
  },
});
