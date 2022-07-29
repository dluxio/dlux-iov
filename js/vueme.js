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
  sapi = "https://testspk.hivehoneycomb.com"; 
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
      toSign: {},
      account: user,
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
        granted:{
          t:0
        },
        granting:{
          t:0
        },
        poweredUp: 0,
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
        node:{
          na:{
            self:""
          }
        }
      },
      sstats:"",
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
    keyOf(obj = "smarkets", key = "node"){
      console.log({obj,key})
      return Object.keys(this[obj]).indexOf(key) >= 0 ? true : false
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
    modalNext(modal) {
      if (
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
    modalIndex(modal, index) {
      var i = 0;
      for (i; i < this.selectedNFTs.length; i++) {
        if (this.selectedNFTs[i].uid == index) break;
      }
      this[modal].index = i;
      this[modal].item = this[modal].items[this[modal].index];
      if (this[modal].item.owner == "ls") this.saleData(modal);
      else if (this[modal].item.owner == "ah") this.auctionData(modal);
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
          if (!rez.posting_json_metadata.profile){rez.posting_json_metadata.profile = {about: ""}}
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
    sendIt(op){
      console.log(op)
      this.toSign = op
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
      if(reset){
        this.posturls = {}
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
    reward_spk(){
      var r = 0,
        a = 0,
        b = 0,
        c = 0,
        t = 0,
        diff = this.sstats.head_block - this.saccountapi.spkblock;
                if (!this.saccountapi.spkblock){
                    return 0
                } else if (diff < 28800) {
                    return 0
                } else {
                  t = parseInt(diff / 28800);
                  a = simpleInterest(
                    this.saccountapi.gov,
                    t,
                    this.sstats.spk_rate_lgov
                  );
                  b = simpleInterest(
                    this.saccountapi.pow,
                    t,
                    this.sstats.spk_rate_lpow
                  );
                  c = simpleInterest(
                    this.saccountapi.granted?.t > 0
                      ? this.saccountapi.granted.t
                      : 0 + this.saccountapi.granting?.t > 0
                      ? this.saccountapi.granting.t
                      : 0,
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
                function simpleInterest (p, t, r){
                  const amount = p * (1 + r / 365);
                  const interest = amount - p;
                  return parseInt(interest * t);
                };
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
    getSpkStats(){
      fetch(this.sapi + "/stats")
          .then((response) => response.json())
          .then((data) => {
            console.log(data)
            this.spkStats = data.result
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
              this.saccountapi = data;
              this.spkval =
                (data.balance +
                  data.gov +
                  data.poweredUp +
                  data.claim +
                  data.spk) /
                1000;
            } else {
              this.focussaccountapi = data;
            }
            // if (
            //   new Date().getMonth() + 1 !=
            //     parseInt(data.drop?.last_claim, 16) &&
            //   data.drop?.availible.amount > 0
            // ) {
            //   this.hasDrop = true;
            //   this.dropnai = `${parseFloat(
            //     data.drop.availible.amount /
            //       Math.pow(10, data.drop.availible.precision)
            //   ).toFixed(data.drop.availible.precision)} ${
            //     data.drop.availible.token
            //   }`;
            // }
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
    newme(user) {
      if (!location.pathname.split("/@")[1] && this.prefix) {
        this.pageAccount = location.pathname.split("/@")[1]
          ? location.pathname.split("/@")[1]
          : this.account;
        this.focus.account = this.pageAccount;
        if (this.pageAccount == this.account) this.me = true;
        this.checkAccount("pageAccount", "focus");
        this.getPosts(true);
        this.getSapi(this.pageAccount, false);
        this.getTokenUser(this.pageAccount, false);
      }
    },
  },
  mounted() {
    console.log(location.pathname.split("/@")[1]);
    if (location.pathname.split("/@")[1]){
      this.pageAccount = location.pathname.split("/@")[1]
    } else {
      this.pageAccount = this.account;
      this.me = true
    }
    if (this.pageAccount == this.account)this.me = true;
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
    voteVal() {
      return (
        (this.accountinfo.rshares / parseInt(this.rewardFund.recent_claims)) *
        parseFloat(this.rewardFund.reward_balance) *
        (1 / parseFloat(this.feedPrice.base))
      );
    },
  },
});
