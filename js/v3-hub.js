import { createApp, toRaw } from '/js/vue.esm-browser.js'
// import Vue from "https://cdn.jsdelivr.net/npm/vue@2.6.14/dist/vue.esm.browser.js";
import Navue from "/js/v3-nav.js";
import FootVue from "/js/footvue.js";
import Cycler from "/js/cycler.js";
import Popper from "/js/pop.js";
import Marker from "/js/marker.js";
import Ratings from "/js/ratings.js";
import MDE from "/js/mde.js";
import Replies from "/js/replies.js";
import CardVue from "/js/cardvue.js";
import ContractsVue from "/js/spkdrive.js";
import FilesVue from "/js/filesvue.js";
import ExtensionVue from "/js/extensionvue.js";
import UploadVue from "/js/uploadvue.js";
import PostVue from "/js/postvue.js";
import DetailVue from "/js/detailvue.js";

const HIVE_API = localStorage.getItem("hapi") || "https://hive-api.dlux.io";
const LARYNX_API = "https://spkinstant.hivehoneycomb.com";
const DUAT_API = "https://duat.hivehoneycomb.com";
const DLUX_TOKEN_API = "https://token.dlux.io";
const SPK_TEST_API = "https://spktest.dlux.io"; // Assuming this is the intended test API
const DLUX_DATA_API = "https://data.dlux.io"; // For post fetching
const COINGECKO_API = "https://api.coingecko.com/api/v3/simple/price";

let url = location.href.replace(/\/$/, "");
let lapi = "";
lapi = DLUX_TOKEN_API; // Use constant
if (
  lapi == DLUX_TOKEN_API ||
  lapi == LARYNX_API ||
  lapi == DUAT_API
) {
  console.log("using defaults");
  //window.history.replaceState(null, null, "dex");
}
let user = localStorage.getItem("user") || "GUEST";
// let hapi = localStorage.getItem("hapi") || "https://hive-api.dlux.io"; // Use constant HIVE_API

createApp({
  directives: {
    scroll
  },
  data() {
    return {
      lastScroll: 0,
      toSign: {},
      account: user,
      spkapi: {},
      pfp: {
        set: "",
        uid: "",
      },
      sstats: {},
      hasDrop: false,
      customTime: false,
      dropnai: "",
      balance: "0.000",
      bartoken: "",
      barhive: "",
      barhbd: "",
      bargov: "",
      barpow: "",
      toSign: {},
      contracts: {
      },
      buyFormValid: false,
      sellFormValid: false,
      govFormValid: false,
      powFormValid: false,
      sendFormValid: false,
      hiveFormValid: false,
      hbdFormValid: false,
      lapi: lapi,
      hapi: HIVE_API, // Use constant
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
      showTokens: {},
      behind: "",
      stats: {},
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
      extendcost: {},
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
      boundScrollHandler: null, // Initialize scroll handler reference
      videoObserver: null,
    };
  },
  components: {
    "nav-vue": Navue,
    "foot-vue": FootVue,
    "cycle-text": Cycler,
    "pop-vue": Popper,
    "vue-markdown": Marker,
    "vue-ratings": Ratings,
    "mde": MDE,
    "replies": Replies,
    "card-vue": CardVue,
    "contracts-vue": ContractsVue,
    "files-vue": FilesVue,
    "extension-vue": ExtensionVue,
    "upload-vue": UploadVue,
    "post-vue": PostVue,
    "detail-vue": DetailVue,
  },
  methods: {
    reply(deets) {
      console.log('getReply:', deets)
      if (!deets.json_metadata) deets.json_metadata = JSON.stringify({})
      var operations = []
      if (deets.bens) {
        operations.push(["comment_options",
          {
            "author": this.account,
            "permlink": deets.permlink,
            "max_accepted_payout": "1000000.000 HBD",
            "percent_hbd": 10000,
            "allow_votes": true,
            "allow_curation_rewards": true,
            "extensions":
              [[0,
                {
                  "beneficiaries":
                    deets.bens
                }]]
          }])
        delete deets.bens
      }
      operations.unshift(["comment", deets])
      this.toSign = {
        type: "raw",
        key: "posting",
        op: JSON.stringify(operations),
        callbacks: [], //get new replies for a/p
        txid: `reply:${deets.parent_author}/${deets.permlink}`,
      }
      console.log(this.toSign)
    },
    vote(url) {
      var key, slider, flag
      if (typeof url == 'object') {
        slider = url.slider
        flag = url.flag
        url = url.url
      } else {
        key = `/@${url.split("/@")[1].split("/")[0]}/${url.split("/@")[1].split("/")[1]}`
        slider = this.posturls[key].slider
        flag = this.posturls[key].flag
      }
      this.toSign = {
        type: "vote",
        cj: {
          author: url.split("/@")[1].split("/")[0],
          permlink: url.split("/@")[1].split("/")[1],
          weight:
            slider * (flag ? -1 : 1),
        },
        msg: `Voting ...`,
        ops: [""],
        txid: "vote",
      };
    },
    setRating(url, rating) {
      this.posturls[url].rating = rating;
    },
    pending(url, text) {
      this.posturls[url].comment = text;
      this.comment(url)
    },
    comment(url) {
      var meta = this.posturls[url].edit ? this.posturls[url].json_metadata : {
        tags: this.posturls[url].json_metadata.tags,
      }
      if (this.posturls[url].rating) meta.review = { rating: this.posturls[url].rating }
      this.toSign = {
        type: "comment",
        cj: {
          author: this.account,
          title: this.posturls[url].edit ? this.posturls[url].title : "",
          body: this.posturls[url].comment,
          parent_author: this.posturls[url].edit ? this.posturls[url].parent_author : this.posturls[url].author,
          parent_permlink: this.posturls[url].edit ? this.posturls[url].parent_permlink : this.posturls[url].permlink,
          permlink: this.posturls[url].edit ? this.posturls[url].permlink :
            "re-" + this.posturls[url].permlink + this.posturls[url].children,
          json_metadata: JSON.stringify(meta),
        },
        msg: `Commenting ...`,
        ops: [""],
        txid: "comment",
      };
    },
    hasVoted(url) {
      const vote = this.posturls[url].active_votes.filter(vote => vote.voter === this.account)
      return vote.length ? vote[0].percent : 0
    },
    precision(num, precision) {
      return parseFloat(num / Math.pow(10, precision)).toFixed(precision);
    },
    toFixed(num, dig) {
      return parseFloat(num).toFixed(dig);
    },
    handleScroll() {
      const now = Date.now();
      if (now - this.lastScroll > 500) {
        this.lastScroll = now;
        // Use document.body properties for scroll calculation
        const scrollPosition = window.innerHeight + document.body.scrollTop;
        const scrollHeight = document.body.scrollHeight;
        if (
          scrollPosition >= scrollHeight - window.innerHeight
        ) {
          this.getPosts();
        }
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
    color_code(name) {
      return parseInt(this.contracts[name] ? this.contracts[name].e.split(':')[0] : 0) - this.spkapi.head_block
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
    broca_calc(last = '0,0') {
      const last_calc = this.Base64toNumber(last.split(',')[1])
      const accured = parseInt((parseFloat(this.sstats.broca_refill) * (this.sstats.head_block - last_calc)) / (this.spkapi.spk_power * 1000))
      var total = parseInt(last.split(',')[0]) + accured
      if (total > (this.spkapi.spk_power * 1000)) total = (this.spkapi.spk_power * 1000)
      return total
    },
    extend(contract, amount, up = false) {
      if (amount > this.broca_calc(this.spkapi.broca)) return
      this.toSign = {
        type: "cja",
        cj: {
          broca: amount,
          id: contract.i,
          file_owner: contract.t,
          power: this.up ? 1 : 0,
        },
        id: `spkccT_extend`,
        msg: `Extending ${contract}...`,
        ops: ["getTokenUser"],
        api: SPK_TEST_API, // Use constant
        txid: "extend",
      }
    },
    modalPrev(modal) {
      if (this[modal].index) this[modal].index--;
      else this[modal].index = this[modal].items.length - 1;
      this[modal].item = this[modal].items[this[modal].index];
    },
    goBack() {
      window.history.back();
    },
    modalSelect(key) {
      if (key.indexOf('/@') > 0)
        key = '/@' + key.split('/@')[1];
      this.displayPost.index = key;
      this.displayPost.item = this.posturls[key];
      window.history.pushState("Blog Modal", this.displayPost.item.title, "/blog/@" + key.split('/@')[1]);
      if (this.displayPost.item.children && !this.displayPost.item.replies.length) {
        var recompile = false
        console.log(this.displayPost.item)
        if (!this.displayPost.item.ratings) {
          this.displayPost.item.ratings = 0
          this.displayPost.item.rating = 0
          recompile = true
        }
        this.getReplies(
          this.displayPost.item.author,
          this.displayPost.item.permlink,
          recompile
        )
      }
    },
    getRewardFund() {
      fetch(this.hapi, {
        body: `{"jsonrpc":"2.0", "method":"condenser_api.get_reward_fund", "params":["post"], "id":1}`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        method: "POST"
      })
        .then(r => r.json())
        .then(r => {
          this.rewardFund = r.result;
        })
        .catch(error => console.error('Error fetching reward fund:', error)); // Add catch
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
        })
        .catch(error => console.error('Error fetching feed price:', error)); // Add catch
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
    getReplies(a, p, c) {
      return new Promise((resolve, reject) => {
        fetch(this.hapi, { // Use constant HIVE_API
          body: `{"jsonrpc":"2.0", "method":"condenser_api.get_content_replies", "params":["${a}","${p}"], "id":1}`,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          method: "POST",
        })
          .then((res) => res.json())
          .then((r) => {
            const key = `/@${a}/${p}`
            var authors = []
            for (let i = 0; i < r.result.length; i++) {
              authors.push(r.result[i].author)
              r.result[i].edit = false;
              if (r.result[i].children) this.getReplies(r.result[i].author, r.result[i].permlink)
              if (r.result[i].json_metadata) {
                try {
                  r.result[i].json_metadata = JSON.parse(
                    r.result[i].json_metadata
                  );
                } catch (e) { }
              }
              const repKey = `/@${r.result[i].author}/${r.result[i].permlink}`
              if (c) {
                const rating = r.result[i].json_metadata?.review?.rating || 0
                if (rating > 0) {
                  this.posturls[key].ratings += 1
                  this.posturls[key].rating = parseFloat(((rating + this.posturls[key].rating) / this.posturls[key].ratings)).toFixed(2)
                }
              }
              this.posturls[repKey] =
                r.result[i];
              if (r.result[i].slider < 0) {
                r.result[i].flag = true;
                r.result[i].slider =
                  r.result[i].slider * -1;

              }
              this.posturls[repKey].rep = "...";
              // console.log(this.posturls[repKey].json_metadata)
              this.posturls[repKey].rating = this.posturls[repKey].json_metadata?.review?.rating || 0
              this.rep(repKey)
            }
            this.posturls[key].replies = r.result;
            this.getHiveAuthors(authors)
            resolve(r.result) // Resolve promise
          })
          .catch((err) => {
            console.error('Error fetching replies:', err); // Add console error
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
      fetch(this.hapi, { // Use constant HIVE_API
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
        })
        .catch(error => console.error(`Error checking account ${this[name]}:`, error)); // Add catch
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
    gt(a, b) {
      return parseFloat(a) > parseFloat(b);
    },
    formatNumber(t, n, r, e) {
      if (typeof t != "number") {
        const parts = t.split(" ");
        var maybe = 0
        for (i = 0; i < parts.length; i++) {
          if (parseFloat(parts[i]) > 0) {
            maybe += parseFloat(parts[i])
          }
        }
        if (maybe > parseFloat(t)) {
          t = maybe
        } else {
          t = parseFloat(t)
        }
      }
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
        prompt("Please enter your API", LARYNX_API); // Use constant
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
    fancyBytes(bytes) {
      var counter = 0, p = ['', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y']
      while (bytes > 1024) {
        bytes = bytes / 1024
        counter++
      }
      return `${this.toFixed(bytes, 2)} ${p[counter]}B`
    },
    getStats() {
      fetch(DLUX_TOKEN_API + '/') // Use constant
        .then(r => r.json())
        .then(r => {
          r.result.head_block = r.head_block
          this.stats = r.result
        })
        .catch(error => console.error('Error fetching DLUX stats:', error)); // Add catch
    },
    getSPKStats() {
      fetch(SPK_TEST_API + '/') // Use constant
        .then(r => r.json())
        .then(r => {
          r.result.head_block = r.head_block
          this.sstats = r.result
        })
        .catch(error => console.error('Error fetching SPK stats:', error)); // Add catch
    },
    expIn(con) {
      return `Expires in ${parseInt((parseInt(con.e.split(':')[0]) - this.spkapi.head_block) / 20 / 60) < 24 ? parseInt((parseInt(con.e.split(':')[0]) - this.spkapi.head_block) / 20 / 60) + ' hours' : parseInt((parseInt(con.e.split(':')[0]) - this.spkapi.head_block) / 20 / 60 / 24) + ' days'}`
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
    getPosts() {
      var bitMask = 0;
      for (var type in this.postSelect.types) {
        if (this.postSelect.types[type].checked)
          bitMask += this.postSelect.types[type].bitFlag;
      }
      if (this.postSelect.bitMask != bitMask) {
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
        var APIQ = this.postSelect.searchTerm
          ? `${DLUX_DATA_API}/search/${this.postSelect.searchTerm.toLowerCase()}?a=${this.postSelect[this.postSelect.entry].a
          }&o=${this.postSelect[this.postSelect.entry].o}&b=${bitMask}`
          : `${DLUX_DATA_API}/${this.postSelect.entry}?a=${this.postSelect[this.postSelect.entry].a
          }&o=${this.postSelect[this.postSelect.entry].o}&b=${bitMask}`;
        fetch(APIQ)
          .then((r) => r.json())
          .then((res) => {
            this.postSelect[this.postSelect.entry].p = false;
            var authors = [];
            this.postSelect[this.postSelect.entry].o +=
              this.postSelect[this.postSelect.entry].a;
            if (res.result.length < this.postSelect[this.postSelect.entry].a)
              this.postSelect[this.postSelect.entry].e = true;
            for (var i = 0; i < res.result.length; i++) {
              const key = `/@${res.result[i].author}/${res.result[i].permlink}`;
              if (!this.posturls[key]) {
                this.posturls[key] = res.result[i];
              }
              this[this.postSelect.entry].push(key);
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
          })
          .catch(error => { // Add catch
            console.error('Error fetching posts:', error);
            this.postSelect[this.postSelect.entry].p = false; // Reset pending flag on error
          });
      }
    },
    selectPosts(modal) {
      var arr = [];
      for (var i = 0; i < this[this.postSelect.entry].length; i++) {
        if (this.posturls[this[this.postSelect.entry][i]]) arr.push(this.posturls[this[this.postSelect.entry][i]]);
      }
      this.displayPosts = arr
      if (modal) {
        this[modal[0]].items = this.displayPosts;
        this[modal[0]].item = this[modal[0]].items[modal[1]];
        this[modal[0]].index = modal[1];
      }
    },
    getContent(a, p, modal) {
      if (a && p) {
        fetch(this.hapi, { // Use constant HIVE_API
          body: `{"jsonrpc":"2.0", "method":"condenser_api.get_content", "params":["${a}", "${p}"], "id":1}`,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          method: "POST",
        })
          .then((r) => r.json())
          .then((res) => {
            if (res.result) {
              const key = `/@${res.result.author}/${res.result.permlink}`
              this.posturls[key] = {
                ...this.posturls[key],
                ...res.result,
                slider: 10000,
                flag: false,
                upVotes: 0,
                downVotes: 0,
                edit: false,
                hasVoted: false,
                contract: {},
                type: 'Blog',
              };
              for (
                var i = 0;
                i < this.posturls[key].active_votes.length;
                i++
              ) {
                if (this.posturls[key].active_votes[i].percent > 0)
                  this.posturls[key].upVotes++;
                else this.posturls[key].downVotes++;
                if (this.posturls[key].active_votes[i].voter == this.account) {
                  this.posturls[key].slider = this.posturls[key].active_votes[i].percent
                  this.posturls[key].hasVoted = true
                }
              }
              try {
                this.posturls[key].json_metadata = JSON.parse(
                  this.posturls[key].json_metadata
                );
                this.posturls[key].pic = this.picFind(
                  this.posturls[key].json_metadata
                );
              } catch (e) {
                console.log(key, "no JSON?");
              }
              var contracts = false
              var type = "Blog";
              if (this.posturls[key].json_metadata.assets) {
                for (var i = 0; i < this.posturls[key].json_metadata.assets.length; i++) {
                  if (this.posturls[key].json_metadata.assets[i].contract) {
                    this.posturls[key].contract[this.posturls[key].json_metadata.assets[i].contract] = {}
                    contracts = true
                  }
                }
              }
              try {
                if (
                  "QmcAkxXzczkzUJWrkWNhkJP9FF1L9Lu5sVCrUFtAZvem3k" ==
                  this.posturls[key].json_metadata.vrHash ||
                  "QmNby3SMAAa9hBVHvdkKvvTqs7ssK4nYa2jBdZkxqmRc16" ==
                  this.posturls[key].json_metadata.vrHash ||
                  "QmZF2ZEZK8WBVUT7dnQyzA6eApLGnMXgNaJtWHFc3PCpqV" ==
                  this.posturls[key].json_metadata.vrHash ||
                  "Qma4dk3mWP325HrHYBDz3UdL9h1A6q8CSvZdc8JhqfgiMp" == this.posturls[key].json_metadata.vrHash
                )
                  type = "360";
                else if (this.posturls[key].json_metadata.vrHash)
                  type = "VR";
                else if (this.posturls[key].json_metadata.arHash)
                  type = "AR";
                else if (this.posturls[key].json_metadata.appHash)
                  type = "APP";
                else if (this.posturls[key].json_metadata.audHash)
                  type = "Audio";
                else if (this.posturls[key].json_metadata.vidHash)
                  type = "Video";
              } catch (e) {
                console.log(key, e, "no JSON?");
              }
              this.posturls[key].type = type;
              if (contracts) {
                this.getContracts(key)
              }
              this.posturls[key].rep = "...";
              this.rep(key);
              if (this.posturls[key].slider < 0) {
                this.posturls[key].slider =
                  this.posturls[key].slider * -1;
                this.posturls[key].flag = true
              }
              this.posturls[key].preview = this.removeMD(
                this.posturls[key].body
              ).substr(0, 250);
              this.posturls[key].ago = this.timeSince(
                this.posturls[key].created
              );
              this.selectPosts();
              if (modal) this.modalSelect(key)
            }
          })
          .catch(error => console.error(`Error fetching content @${a}/${p}:`, error)); // Add catch
      } else {
        console.log("no author or permlink", a, p);
      }
    },
    updateCost(id) {
      this.extendcost[id] = parseInt(this.contracts[id].extend / 30 * this.contracts[id].r)
    },
    getContracts(url) {
      var contracts = [],
        getContract = (u, id) => {
          fetch(SPK_TEST_API + '/api/fileContract/' + id) // Use constant
            .then((r) => r.json())
            .then((res) => {
              res.result.extend = "7"
              if (res.result) {
                this.contracts[id] = res.result
                this.extendcost[id] = parseInt(res.result.extend / 30 * res.result.r)
              }
            })
            .catch(error => console.error(`Error fetching contract ${id}:`, error)); // Add catch
        }
      for (var contract in this.posturls[url].contract) {
        contracts.push(contract)
      }
      contracts = [...new Set(contracts)]
      for (var i = 0; i < contracts.length; i++) {
        getContract(url, contracts[i])
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
        return interval + ` day${interval > 1 ? 's' : ''} ago`;
      }
      interval = Math.floor(seconds / 3600);
      if (interval >= 1) {
        return interval + ` hour${interval > 1 ? 's' : ''} ago`;
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
        return `https://ipfs.dlux.io/ipfs/${json.Hash360}`;
      } else {
        /*
                var looker
                try {
                    looker = body.split('![')[1]
                    looker = looker.split('(')[1]
                    looker = looker.split(')')[0]
                } catch (e) {
                    */
        return "/img/dlux-logo-icon.png";
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
      fetch( // Use constant COINGECKO_API
        `${COINGECKO_API}?ids=hive&amp;vs_currencies=usd`
      )
        .then((response) => response.json())
        .then((data) => {
          this.hiveprice = data;
        })
        .catch(error => console.error('Error fetching Hive price:', error)); // Add catch
      fetch( // Use constant COINGECKO_API
        `${COINGECKO_API}?ids=hive_dollar&amp;vs_currencies=usd`
      )
        .then((response) => response.json())
        .then((data) => {
          this.hbdprice = data;
        })
        .catch(error => console.error('Error fetching HBD price:', error)); // Add catch
    },
    getNodes() {
      fetch(this.lapi + "/runners")
        .then((response) => response.json())
        .then((data) => {
          this.runners = data.result.sort((a, b) => {
            return b.g - a.g;
          });
        })
        .catch(error => console.error('Error fetching runners:', error)); // Add catch
      fetch(this.lapi + "/markets")
        .then((response) => response.json())
        .then((data) => {
          this.nodes = data.markets.node;
          this.stats = data.stats;
        })
        .catch(error => console.error('Error fetching markets:', error)); // Add catch
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
        })
        .catch(error => console.error('Error fetching protocol:', error)); // Add catch
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
        fetch(this.lapi + "/api/pfp/" + this.account)
          .then((r) => r.json())
          .then((json) => {
            if (json.result == "No Profile Picture Set or Owned") return;
            this.pfp.set = json.result[0].pfp.split(":")[0];
            this.pfp.uid = json.result[0].pfp.split(":")[1];
          })
          .catch(error => console.error('Error fetching PFP:', error)); // Add catch
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
          })
          .catch(error => console.error(`Error fetching token user @${user}:`, error)); // Add catch
    },
    getSPKUser(user) {
      if (user)
        fetch(SPK_TEST_API + "/@" + user) // Use constant
          .then((response) => response.json())
          .then((data) => {
            this.spkapi = data
          })
          .catch(error => console.error(`Error fetching SPK user @${user}:`, error)); // Add catch
    },
    getHiveUser(user) {
      if (user)
        fetch(HIVE_API, { // Use constant HIVE_API
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
            const power = ((parseInt(this.accountinfo.voting_power) * 10000) / 10000) / 50;
            this.accountinfo.rshares = (power * final_vest) / 10000;
          })
          .catch(error => console.error(`Error fetching Hive user @${user}:`, error)); // Add catch
    },
    brocaCost(t, c) {
      return parseInt((t / 30) * c)
    },
    getHiveAuthors(users) {
      var q = "";
      for (var i = 0; i < users.length; i++) {
        if (!this.authors[users[i]]) q += `"${users[i]}",`;
      }
      if (q.length > 0) {
        q = q.substring(0, q.length - 1);
        fetch(HIVE_API, { // Use constant HIVE_API
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
          })
          .catch(error => console.error('Error fetching Hive authors:', error)); // Add catch
      }
    },
    
    createIpfsLoader() {
      // Custom IPFS loader for HLS.js to properly handle IPFS URLs
      class IpfsLoader {
        constructor(config) {
          this.config = config;
          this.stats = null;
          this.context = null;
          this.callbacks = null;
          this.requestController = null;
        }
        
        load(context, config, callbacks) {
          this.context = context;
          this.callbacks = callbacks;
          this.stats = {
            loading: {
              start: performance.now(),
              first: 0,
              end: 0
            },
            parsing: {
              start: 0,
              end: 0
            },
            buffering: {
              start: 0,
              first: 0,
              end: 0
            }
          };
          
          const url = context.url;
          console.log('IPFS Loader loading:', url);
          
          // Convert IPFS URLs to proper gateway URLs with filename hints
          let ipfsUrl = url;
          if (url.includes('ipfs.dlux.io/ipfs/')) {
            const cid = url.split('/ipfs/')[1].split('?')[0];
            
            // Determine file extension and filename based on URL or context
            let filename = 'file';
            if (url.includes('.m3u8') || context.type === 'manifest' || context.type === 'level') {
              filename = 'playlist.m3u8';
            } else if (url.includes('.ts') || context.type === 'segment') {
              filename = 'segment.ts';
            }
            
            // Construct proper IPFS gateway URL with filename for MIME type detection
            ipfsUrl = `https://ipfs.dlux.io/ipfs/${cid}?filename=${filename}`;
          }
          
          console.log('IPFS Loader fetching:', ipfsUrl);
          
          // Create AbortController for request cancellation
          this.requestController = new AbortController();
          
          fetch(ipfsUrl, { signal: this.requestController.signal })
            .then(response => {
              if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
              }
              
              this.stats.loading.first = Math.max(performance.now(), this.stats.loading.start);
              this.stats.parsing.start = this.stats.loading.first;
              
              // For manifests and level playlists, return text; for segments, return arrayBuffer
              if (url.includes('.m3u8') || context.type === 'manifest' || context.type === 'level' || context.responseType === 'text') {
                return response.text();
              } else {
                return response.arrayBuffer();
              }
            })
            .then(data => {
              this.stats.loading.end = Math.max(this.stats.loading.first, performance.now());
              this.stats.parsing.end = this.stats.loading.end;
              const dataSize = typeof data === 'string' ? data.length : data.byteLength;
              
              console.log('IPFS Loader success:', ipfsUrl, 'Size:', dataSize);
              
              // HLS.js expects exact response format matching XHR loader
              const response = {
                url: ipfsUrl,
                data: data
              };
              
              // Pass proper stats object that HLS.js expects
              callbacks.onSuccess(response, this.stats, context);
            })
            .catch(err => {
              if (err.name === 'AbortError') {
                console.log('IPFS Loader request was aborted');
                return;
              }
              console.error('IPFS Loader error:', err, 'URL:', ipfsUrl);
              callbacks.onError({ 
                code: err.code || 'NETWORK_ERROR', 
                text: err.message || 'Failed to load IPFS content'
              }, context);
            });
        }
        
        abort() {
          console.log('IPFS Loader: abort called');
          if (this.requestController) {
            this.requestController.abort();
            this.requestController = null;
          }
        }
        
        destroy() {
          console.log('IPFS Loader: destroy called');
          this.abort();
          this.stats = null;
          this.context = null;
          this.callbacks = null;
        }
      }
      
      return IpfsLoader;
    },

    async setupHLSPlayer(videoElement) {
      // Universal HLS.js setup for M3U8 video playback
      if (!videoElement || !videoElement.src) return;
      
      let videoSrc = videoElement.src;
      console.log('Setting up HLS for video:', videoSrc);
      
      // Smart IPFS video detection - check if it's an IPFS file without extension
      if (/\/ipfs\/Qm[a-zA-Z0-9]+$/.test(videoSrc) && !videoSrc.includes('.')) {
        console.log('Detected IPFS file without extension, checking size...');
        try {
          const response = await fetch(videoSrc, { method: 'HEAD' });
          const contentLength = response.headers.get('content-length');
          if (contentLength) {
            const sizeInKB = parseInt(contentLength) / 1024;
            console.log(`IPFS file size: ${sizeInKB} KB`);
            
            // If file is in kilobyte range (likely a playlist), treat as M3U8
            if (sizeInKB < 100) { // Playlists are typically small
              videoSrc = videoSrc + '?filename=master.m3u8';
              videoElement.src = videoSrc; // Update the video element src
              console.log('Treating as M3U8 playlist:', videoSrc);
            }
          }
        } catch (err) {
          console.log('Could not determine IPFS file size, proceeding with original URL');
        }
      }
      
      // Check if the source is an M3U8 file
      if (videoSrc.includes('.m3u8') || videoSrc.includes('application/x-mpegURL') || videoSrc.includes('filename=master.m3u8')) {
        // Check if HLS.js is available
        if (typeof Hls !== 'undefined') {
          if (Hls.isSupported()) {
            // Destroy existing HLS instance if attached to this video
            if (videoElement.hlsInstance) {
              videoElement.hlsInstance.destroy();
            }
            
            // Create custom IPFS loader for better IPFS URL handling
            const IpfsLoader = this.createIpfsLoader();
            
            // Create new HLS instance with custom IPFS loader
            const hls = new Hls({
              debug: false,
              enableWorker: true,
              lowLatencyMode: false,
              loader: IpfsLoader
            });
            
            // Store instance on video element for cleanup
            videoElement.hlsInstance = hls;
            
            // Load the M3U8 source
            hls.loadSource(videoSrc);
            hls.attachMedia(videoElement);
            
            // Handle events
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              console.log('HLS manifest parsed successfully');
            });
            
            hls.on(Hls.Events.ERROR, (event, data) => {
              console.warn('HLS error:', data);
              if (data.fatal) {
                switch (data.type) {
                  case Hls.ErrorTypes.NETWORK_ERROR:
                    console.log('Network error, trying to recover...');
                    hls.startLoad();
                    break;
                  case Hls.ErrorTypes.MEDIA_ERROR:
                    console.log('Media error, trying to recover...');
                    hls.recoverMediaError();
                    break;
                  default:
                    console.log('Fatal error, destroying HLS instance');
                    hls.destroy();
                    break;
                }
              }
            });
            
            console.log('HLS.js player with IPFS loader setup complete for:', videoSrc);
          } else {
            console.log('HLS.js not supported, using native playback');
          }
        } else {
          console.warn('HLS.js library not loaded');
        }
      } else {
        console.log('Not an M3U8 file, using native video playback');
      }
    },
    
    observeVideoElements() {
      // Set up MutationObserver to watch for new video elements
      if (this.videoObserver) {
        this.videoObserver.disconnect();
      }
      
      this.videoObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          // Check for added nodes
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check if the added node is a video element
              if (node.tagName === 'VIDEO') {
                this.setupHLSPlayer(node);
              }
              // Check for video elements within added nodes
              const videos = node.querySelectorAll ? node.querySelectorAll('video') : [];
              videos.forEach((video) => {
                this.setupHLSPlayer(video);
              });
            }
          });
          
          // Check for attribute changes on existing video elements
          if (mutation.type === 'attributes' && 
              mutation.target.tagName === 'VIDEO' && 
              mutation.attributeName === 'src') {
            this.setupHLSPlayer(mutation.target);
          }
        });
      });
      
      // Start observing
      this.videoObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['src']
      });
      
      // Setup existing video elements
      document.querySelectorAll('video').forEach((video) => {
        this.setupHLSPlayer(video);
      });
    },
  },
  mounted() {
    if (location.pathname.split("/@")[1]) {
      this.pageAccount = location.pathname.split("/@")[1]
      if (this.pageAccount.indexOf('/') > -1) {
        this.pagePermlink = this.pageAccount.split('/')[1]
        this.pageAccount = this.pageAccount.split('/')[0]
      }
    } else {
      this.pageAccount = this.account;
      this.me = true;
    }
    if (this.pageAccount == this.account) this.me = true;
    if (this.pagePermlink) {
      this.getContent(this.pageAccount, this.pagePermlink, true)
    } else {
      this.getPosts();
      this.boundScrollHandler = this.handleScroll.bind(this); // Create bound handler
      document.body.addEventListener('scroll', this.boundScrollHandler); // Use bound handler
    }
    this.getStats()
    this.getSPKStats()
    this.getProtocol();
    this.getRewardFund();
    this.getFeedPrice();
    
    // Start observing for video elements to setup HLS
    this.observeVideoElements();
  },
  unmounted() {
    if (this.boundScrollHandler) { // Check if handler exists before removing
      document.body.removeEventListener('scroll', this.boundScrollHandler); // Use bound handler
    }
    
    // Clean up video observer and HLS instances
    if (this.videoObserver) {
      this.videoObserver.disconnect();
    }
    
    // Clean up any HLS instances
    document.querySelectorAll('video').forEach((video) => {
      if (video.hlsInstance) {
        video.hlsInstance.destroy();
      }
    });
  },
  watch: {
    postSelect(a, b) {
      if (a.searchTerm != b.searchTerm || a.bitMask != b.bitMask) {
        console.log('Watched')
        this.displayPosts = []
        this[this.postSelect.entry] = []
        this.postSelect[this.postSelect.entry].o = 0
        this.postSelect[this.postSelect.entry].e = false;
      }
    }
  },
  computed: {
    location: {
      get() {
        return location;
      },
    },
    voteVal() {
      return ((this.accountinfo.rshares / parseInt(this.rewardFund.recent_claims)) *
        parseFloat(this.rewardFund.reward_balance) *
        (parseFloat(this.feedPrice.base)))
    }
  },
}).mount('#app')
