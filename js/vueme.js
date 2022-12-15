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
      sets: {},
      disablePost: true,
      File: [],
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
    getSetPhotos(s, c) {
      return s.set ? `https://ipfs.io/ipfs/${s.set[c]}` : "";
    },
    uploadFile(e) {
        for (var i = 0; i < e.target.files.length; i++) {
          var reader = new FileReader();
          reader.File = e.target.files[i]
          reader.onload = (event) => {
            const fileContent = event.target.result;
            for(var i = 0; i < this.File.length; i++){
              if (
                this.File[i].name == event.currentTarget.File.name
                && this.File[i].size == event.currentTarget.File.size
              ) {
                Hash.of(fileContent).then((hash) => {
                  this.File[i].md5 = hash;
                  this.File[i].blob = fileContent; 
                  const file = this.File[i];
                  this.File.splice(i, 1, file);
                });
                break
              }
            }
          };
          reader.readAsBinaryString(e.target.files[i]);
          var File = e.target.files[i];
          File.pin = true;
          File.hash = "";
          File.md5 = ""
          this.File.push(File);
        }
      },
    dragFile(e) {
      for (var i = 0; i < e.dataTransfer.files.length; i++) {
        var reader = new FileReader();
        reader.File = e.dataTransfer.files[i]
        reader.onload = (event) => {
          const fileContent = event.target.result;
          for(var i = 0; i < this.File.length; i++){
            if (
              this.File[i].name == event.currentTarget.File.name
              && this.File[i].size == event.currentTarget.File.size
            ) {
              Hash.of(fileContent).then(hash=>{
                this.File[i].md5 = hash 
                this.File[i].blob = fileContent; 
                const file = this.File[i];
                 this.File.splice(i, 1, file);
              })
              break
            }
          }
        };
        reader.readAsBinaryString(e.dataTransfer.files[i]);
        var File = e.dataTransfer.files[i];
        File.pin = true;
        File.hash = "";
        File.md5 = ""
        this.File.push(File);
      }
    },
    togglePin(index){
      this.File[index].pin = !this.File[index].pin;
    },
    deleteImg (index){
      this.File.splice(index, 1)
    },
    validPost(){
      var valid = true
      if(!this.postPermlink)valid = false
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
    update: _.debounce(function(e) {
            this.postBody = e.target.value;
          }, 300),
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
    ipfsUpload(index) {
      this.validateHeaders(this.File[index].md5).then((headers) => {
        var formdata = new FormData();
        formdata.append('file', this.File[index].blob, this.File[index].md5);
        // formdata.append(
        //   "path",
        //   `/${headers.split(":")[0]}/${headers.split(":")[1]}.${this.account}`
        // );
        var requestOptions = {
          method: "POST",
          body: formdata,
          redirect: "follow",
          mode: 'no-cors',
          credentials: 'include'
        };
        fetch(
          `https://7afa6c0f-fa9f-412c-b43c-cd0adea5c8d0.mock.pstmn.io/api/v0/add?stream-channels=true&pin=false&wrap-with-directory=false&progress${this.account}&cid=${headers.split(":")[0]}&sig=${headers.split(":")[1]}`,
          //`https://ipfs.dlux.io/api/v0/add?stream-channels=true&pin=false&wrap-with-directory=false&progress=true&account=${this.account}&cid=${headers.split(":")[0]}&sig=${headers.split(":")[1]}`,
          requestOptions
        )
          .then((response) => {
            response.text()
            console.log(response)
          })
          .then((result) => console.log(result))
          .catch((error) => console.log("error", error));
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
        msg: `Trying to give ${parseInt(this.giveFTqty)} ${
          this.mint_detail.set
        } mint token${parseInt(this.giveFTqty) > 1 ? "s" : ""} to ${
          this.giveFTusername
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

    /*


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
        id: `${item.token}_nft_sell_cancel`,
        msg: `Canceling: ${item.set}:${item.uid}`,
        ops: ["getUserNFTs"],
        api: this.apiFor(item.token),
        txid: `${item.set}:${item.uid}_nft_sell_cancel`,
      };
    },
    cancelFT(item) {
      var cja = {
          set: item.set,
          uid: item.uid,
        },
        type = "cja";
      this.toSign = {
        type,
        cj: cja,
        id: `${item.token}_ft_sell_cancel`,
        msg: `Canceling: ${item.set}:${item.uid}`,
        ops: ["getUserNFTs"],
        api: this.apiFor(item.token),
        txid: `${item.set}:${item.uid}_ft_sell_cancel`,
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
    vote(url) {
      this.toSign = {
        type: "vote",
        cj: {
          author: url.split("/@")[1].split("/")[0],
          permlink: url.split("/@")[1].split("/")[1],
          weight:
            this.posturls[url].slider * (this.posturls[url].flag ? -1 : 1),
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
      this.displayPost.index = key;
      this.displayPost.item = this.posturls[key];
      if (
        this.displayPost.item.children &&
        !this.displayPost.item.replies.length
      )
        this.getReplies(
          this.displayPost.item.author,
          this.displayPost.item.permlink
        ).then((r) => {
          this.posturls[key].replies = r.result;
          for (let i = 0; i < this.posturls[key].replies.length; i++) {
            if (this.posturls[key].replies[i].json_metadata) {
              try {
                this.posturls[key].replies[i].json_metadata = JSON.parse(
                  this.posturls[key].replies[i].json_metadata
                );
                this.posturls[key].replies[i].edit = false;
              } catch (e) {}
            }
            this.posturls[this.posturls[key].replies[i].url] =
              this.posturls[key].replies[i];
            if (this.posturls[key].replies[i].slider < 0) {
              this.posturls[key].replies[i].flag = true;
              this.posturls[key].replies[i].slider =
                this.posturls[key].replies[i].slider * -1;
            }
          }
        });
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
      if (source != "displayNFTs") {
        source.HTML = source.comp.HTML;
        source.setname = source.set;
        this[modal].index = 0;
        this[modal].items = [source];
        this[modal].item = source;
        return;
      }
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
    getReplies(a, p, k) {
      return new Promise((resolve, reject) => {
        fetch(this.hapi, {
          body: `{"jsonrpc":"2.0", "method":"condenser_api.get_content_replies", "params":["${a}","${p}"], "id":1}`,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          method: "POST",
        })
          .then((res) => res.json())
          .then((r) => {
            if (k) r.key = k;
            resolve(r);
          })
          .catch((err) => {
            reject(err);
          });
      });
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
        for (var c = /(\d+)(\d{3})/; c.test(i); )
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
      }
      if (
        !this.postSelect[this.postSelect.entry].e &&
        !this.postSelect[this.postSelect.entry].p
      ) {
        this.postSelect[this.postSelect.entry].p = true;
        fetch("https://api.hive.blog", {
          body: `{"jsonrpc":"2.0", "method":"condenser_api.get_blog_entries", "params":["${
            this.pageAccount
          }",${this.postSelect[this.postSelect.entry].o},${
            this.postSelect[this.postSelect.entry].a
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
    selectPosts(modal) {
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
    getContent(a, p) {
      if (a && p) {
        fetch(this.hapi, {
          body: `{"jsonrpc":"2.0", "method":"condenser_api.get_content", "params":["${a}", "${p}"], "id":1}`,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          method: "POST",
        })
          .then((r) => r.json())
          .then((res) => {
            if (res.result) {
              res.result.url = `/@${res.result.author}/${res.result.permlink}`;
              this.posturls[res.result.url] = {
                ...this.posturls[res.result.url],
                ...res.result,
                slider: 10000,
                flag: false,
                upVotes: 0,
                downVotes: 0,
                edit: false,
                hasVoted: false,
              };
              for (
                var i = 0;
                i < this.posturls[res.result.url].active_votes.length;
                i++
              ) {
                if (this.posturls[res.result.url].active_votes[i].percent > 0)
                  this.posturls[res.result.url].upVotes++;
                else this.posturls[res.result.url].downVotes++;
                if (
                  this.posturls[res.result.url].active_votes[i].voter ==
                  this.account
                ) {
                  this.posturls[res.result.url].slider =
                    this.posturls[res.result.url].active_votes[i].percent;
                  this.posturls[res.result.url].hasVoted = true;
                }
              }
              var type = "Blog";
              try {
                this.posturls[res.result.url].json_metadata = JSON.parse(
                  this.posturls[res.result.url].json_metadata
                );
                this.posturls[res.result.url].pic = this.picFind(
                  this.posturls[res.result.url].json_metadata
                );

                if (
                  "QmNby3SMAAa9hBVHvdkKvvTqs7ssK4nYa2jBdZkxqmRc16" ==
                  this.posturls[res.result.url].json_metadata.vrHash
                )
                  type = "360";
                else if (this.posturls[res.result.url].json_metadata.vrHash)
                  type = "VR";
                else if (this.posturls[res.result.url].json_metadata.arHash)
                  type = "AR";
                else if (this.posturls[res.result.url].json_metadata.appHash)
                  type = "APP";
                else if (this.posturls[res.result.url].json_metadata.audHash)
                  type = "Audio";
                else if (this.posturls[res.result.url].json_metadata.vidHash)
                  type = "Video";
              } catch (e) {
                console.log(res.result.url, e, "no JSON?");
              }
              this.posturls[res.result.url].type = type;
              if (type != "Blog")
                this.posturls[res.result.url].url =
                  "/dlux" + this.posturls[res.result.url].url;
              else
                this.posturls[res.result.url].url =
                  "/blog" + this.posturls[res.result.url].url;
              this.posturls[res.result.url].rep = "...";
              this.rep(res.result.url);
              if (this.posturls[res.result.url].slider < 0) {
                this.posturls[res.result.url].slider =
                  this.posturls[res.result.url].slider * -1;
                this.posturls[res.result.url].flag = true;
              }
              this.posturls[res.result.url].preview = this.removeMD(
                this.posturls[res.result.url].body
              ).substr(0, 250);
              this.posturls[res.result.url].ago = this.timeSince(
                this.posturls[res.result.url].created
              );
              this.selectPosts();
            }
          });
      } else {
        console.log("no author or permlink", a, p);
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
      } catch (e) {}
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
    getMint(set, item) {
      for (let i = 0; i < this.rNFTs.length; i++) {
        if (this.rNFTs[i].set == set) {
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
    getSpkStats() {
      fetch(this.sapi + "/stats")
        .then((response) => response.json())
        .then((data) => {
          console.log(data);
          this.spkStats = data.result;
        });
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
          const code = `(//${this.nftscripts[o.script]}\n)("${
            o.uid ? o.uid : 0
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
      this.getPosts();
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
    this.getPosts();
    this.getProtocol();
    this.getSpkStats();
    this.getRewardFund();
    this.getFeedPrice();
    this.getSapi(this.pageAccount, false);
    this.getTokenUser(this.pageAccount, false);
    this.getNFTs();
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
    compiledMarkdown: function() {
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
