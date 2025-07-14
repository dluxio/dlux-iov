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
import MCommon from '/js/methods-common.js';

const HIVE_API = localStorage.getItem("hapi") || "https://api.hive.blog";
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
// let hapi = localStorage.getItem("hapi") || "https://api.hive.blog"; // Use constant HIVE_API

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
      following: [],
      communities: [],
      currentTab: 'hub',
      selectedCommunity: '',
      availableCommunities: [],
      loadingCommunities: false,
      skipHashUpdate: false,
      followedCommunities: [],
      loadingFollowedCommunities: false,
      postSelect: {
        sort: "time",
        searchTerm: "",
        lastSearchTerm: "",
        bitMask: 0,
        entry: "new",
        search: {
          a: 20,
          o: 0,
          e: false,
          p: false,
        },
        new: {
          a: 20, //amount
          o: 0, //offset
          e: false, //end
          p: false, //pending - One pending request
        },
        trending: {
          a: 20,
          o: 0,
          e: false,
          p: false,
          start_author: '',
          start_permlink: '',
        },
        promoted: {
          a: 20,
          o: 0,
          e: false,
          p: false,
          start_author: '',
          start_permlink: '',
        },
        following: {
          a: 20,
          o: 0,
          e: false,
          p: false,
          start_author: '',
          start_permlink: '',
        },
        communities: {
          a: 20,
          o: 0,
          e: false,
          p: false,
          start_author: '',
          start_permlink: '',
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
      masonryColumns: [],
      columnCount: 3,
      resizeTimeout: null,
      newPostsCount: 0,
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
      boundResizeHandler: null, // Initialize resize handler reference
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
    ...MCommon,
    calculateColumnCount() {
      const width = window.innerWidth;
      let columns;
      if (width < 576) columns = 1;
      else if (width < 992) columns = 2;
      else columns = 3;
      
      console.log('calculateColumnCount:', { width, columns });
      return columns;
    },
    initializeMasonryColumns() {
      this.columnCount = this.calculateColumnCount();
      this.masonryColumns = Array.from({ length: this.columnCount }, () => []);
      console.log('initializeMasonryColumns:', { columnCount: this.columnCount, columnsLength: this.masonryColumns.length });
    },
    getShortestColumnIndex() {
      if (!this.masonryColumns.length) return 0;
      
      let shortestIndex = 0;
      let shortestHeight = this.masonryColumns[0].length;
      
      for (let i = 1; i < this.masonryColumns.length; i++) {
        if (this.masonryColumns[i].length < shortestHeight) {
          shortestHeight = this.masonryColumns[i].length;
          shortestIndex = i;
        }
      }
      return shortestIndex;
    },
    addPostToMasonry(post, isNew = false) {
      if (!post || !this.masonryColumns.length) return;
      
      const postWithFlag = { ...post, isNew };
      const shortestColumn = this.getShortestColumnIndex();
      this.masonryColumns[shortestColumn].push(postWithFlag);
      
      console.log('addPostToMasonry:', { post: post.title || post.author, column: shortestColumn, isNew });
      
      if (isNew) {
        // Remove isNew flag after animation
        setTimeout(() => {
          postWithFlag.isNew = false;
        }, 600);
      }
    },
    rebuildMasonry() {
      // Store all posts
      const allPosts = [];
      this.masonryColumns.forEach(column => {
        column.forEach(post => {
          const cleanPost = { ...post };
          delete cleanPost.isNew;
          allPosts.push(cleanPost);
        });
      });
      
      // Recalculate columns
      this.initializeMasonryColumns();
      
      // Redistribute posts
      allPosts.forEach(post => {
        this.addPostToMasonry(post, false);
      });
    },
    handleResize() {
      // Debounce resize events
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => {
        const newColumnCount = this.calculateColumnCount();
        console.log('Resize detected:', { currentColumns: this.columnCount, newColumns: newColumnCount, width: window.innerWidth });
        if (newColumnCount !== this.columnCount) {
          console.log('Rebuilding masonry due to column count change');
          this.rebuildMasonry();
        }
      }, 100);
    },
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
          if (this.currentTab === 'hub') {
            this.getHubPosts();
          } else {
            this.getHivePosts();
          }
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
    switchTab(tab) {
      this.currentTab = tab;
      this.displayPosts = [];
      this.initializeMasonryColumns();
      this.newPostsCount = 0;

      // Update hash when switching tabs manually (unless already handled by hash router)
      if (!this.skipHashUpdate) {
        this.updateHashFromTab();
      }
      this.skipHashUpdate = false;

      if (tab === 'hub') {
        // Reset pagination for hub (new posts)
        this.postSelect.new.o = 0;
        this.postSelect.new.e = false;
        this.postSelect.new.p = false;
        this['new'] = [];
        this.postSelect.entry = 'new';
        this.getHubPosts();
      } else {
        // Reset pagination for the new tab
        if (this.postSelect[tab]) {
          this.postSelect[tab].o = 0;
          this.postSelect[tab].e = false;
          this.postSelect[tab].p = false;
          this.postSelect[tab].start_author = '';
          this.postSelect[tab].start_permlink = '';
        }

        this[tab] = [];
        this.postSelect.entry = tab;

        if (tab === 'communities') {
          // Load communities list when switching to communities tab
          this.getAvailableCommunities();
          // Also load followed communities if user is logged in
          if (this.account) {
            this.getFollowedCommunities();
          }
          if (!this.selectedCommunity) {
            // Don't fetch posts if no community is selected
            return;
          }
        }
        this.getHivePosts();
      }
    },
    getAvailableCommunities() {
      if (this.loadingCommunities) return;

      this.loadingCommunities = true;

      fetch(this.hapi, {
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "bridge.list_communities",
          params: {
            last: "",
            limit: 100,
            query: "",
            sort: "rank",
            observer: this.account || ""
          },
          id: 1
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      })
        .then((r) => r.json())
        .then((res) => {
          this.loadingCommunities = false;
          if (res.result && res.result.length > 0) {
            this.availableCommunities = res.result.map(community => ({
              id: community.name,
              name: community.title,
              description: community.about || 'Community',
              subscribers: community.subscribers || 0,
              rank: community.rank || 0
            }));
          } else {
            // Fallback to hardcoded communities if API fails
            this.availableCommunities = [
              { id: 'hive-153850', name: 'Splinterlands', description: 'Digital trading card game' },
              { id: 'hive-125125', name: 'Ecency', description: 'Decentralized social media community' },
              { id: 'hive-174578', name: 'Photography Lovers', description: 'Share your photography passion' },
              { id: 'hive-148441', name: 'GEMS', description: 'Generalist community for original content' },
              { id: 'hive-194913', name: 'Gaming', description: 'Gaming community' },
              { id: 'hive-167922', name: 'LeoFinance', description: 'Finance and crypto community' },
              { id: 'hive-196708', name: 'Hive Learners', description: 'Learning and education community' },
              { id: 'hive-120078', name: 'World of Xpilar', description: 'Art and digital creativity' }
            ];
          }
        })
        .catch(error => {
          console.error('Error fetching communities list:', error);
          this.loadingCommunities = false;
          // Fallback to hardcoded communities
          this.availableCommunities = [
            { id: 'hive-153850', name: 'Splinterlands', description: 'Digital trading card game' },
            { id: 'hive-125125', name: 'Ecency', description: 'Decentralized social media community' },
            { id: 'hive-174578', name: 'Photography Lovers', description: 'Share your photography passion' },
            { id: 'hive-148441', name: 'GEMS', description: 'Generalist community for original content' },
            { id: 'hive-194913', name: 'Gaming', description: 'Gaming community' },
            { id: 'hive-167922', name: 'LeoFinance', description: 'Finance and crypto community' },
            { id: 'hive-196708', name: 'Hive Learners', description: 'Learning and education community' },
            { id: 'hive-120078', name: 'World of Xpilar', description: 'Art and digital creativity' }
          ];
        });
    },
    getCommunityInfo(communityId) {
      // Optional: Get community information using bridge.get_community
      fetch(this.hapi, {
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "bridge.get_community",
          params: {
            name: communityId,
            observer: this.account || ""
          },
          id: 1
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      })
        .then((r) => r.json())
        .then((res) => {
          if (res.result) {
            console.log('Community info for', communityId, res.result);
            // You could store this info and display it in the UI
          }
        })
        .catch(error => {
          console.error('Error fetching community info:', error);
        });
    },
    sendIt(op) {
      this.toSign = op;
    },
    onCommunityChange() {
      if (this.currentTab === 'communities' && this.selectedCommunity) {
        // Reset pagination for communities
        this.postSelect.communities.start_author = '';
        this.postSelect.communities.start_permlink = '';
        this.postSelect.communities.e = false;
        this.postSelect.communities.p = false;
        this.communities = [];
        this.displayPosts = [];
        this.initializeMasonryColumns();
        this.newPostsCount = 0;

        // Optionally get community info (for future use)
        this.getCommunityInfo(this.selectedCommunity);

        this.getHivePosts();
      }
    },
    getHubPosts() {
      var bitMask = 0;
      for (var type in this.postSelect.types) {
        if (this.postSelect.types[type].checked)
          bitMask += this.postSelect.types[type].bitFlag;
      }
      
      // Check if filter or search term changed
      var searchChanged = this.postSelect.lastSearchTerm !== this.postSelect.searchTerm;
      
      if (this.postSelect.bitMask != bitMask || searchChanged) {
        this.postSelect.bitMask = bitMask;
        this.postSelect.lastSearchTerm = this.postSelect.searchTerm;
        this.displayPosts = [];
        this.initializeMasonryColumns();
        this.newPostsCount = 0;
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
            
            // Collect posts that need full details
            var postsNeedingDetails = [];
            
            for (var i = 0; i < res.result.length; i++) {
              const key = `/@${res.result[i].author}/${res.result[i].permlink}`;
              if (!this.posturls[key]) {
                this.posturls[key] = res.result[i];
              }
              this[this.postSelect.entry].push(key);
              
              // Check if this post needs full details from bridge API
              if (!this.posturls[key].created) {
                postsNeedingDetails.push({
                  author: res.result[i].author,
                  permlink: res.result[i].permlink,
                  key: key
                });
              }
              authors.push(res.result[i].author);
            }
            
            // Get full post details using bridge API in batches
            if (postsNeedingDetails.length > 0) {
              this.getHubPostDetails(postsNeedingDetails);
            } else {
              this.selectPosts();
            }
            
            authors = [...new Set(authors)];
            this.getHiveAuthors(authors);
          })
          .catch(error => {
            console.error('Error fetching posts:', error);
            this.postSelect[this.postSelect.entry].p = false;
          });
      }
    },
    getHubPostDetails(postsNeedingDetails) {
      // Process posts in batches to avoid overwhelming the API
      const batchSize = 5; // Process 5 posts at a time
      let currentBatch = 0;
      
      const processBatch = async () => {
        const startIndex = currentBatch * batchSize;
        const endIndex = Math.min(startIndex + batchSize, postsNeedingDetails.length);
        const batch = postsNeedingDetails.slice(startIndex, endIndex);
        
        if (batch.length === 0) {
          // All batches processed, update UI
          this.selectPosts();
          return;
        }
        
        // Create promises for all posts in this batch
        const promises = batch.map(post => this.getPostWithBridge(post.author, post.permlink, post.key));
        
        try {
          await Promise.all(promises);
        } catch (error) {
          console.error('Error in batch processing:', error);
        }
        
        // Process next batch after a short delay
        currentBatch++;
        if (currentBatch * batchSize < postsNeedingDetails.length) {
          setTimeout(() => processBatch(), 100); // Small delay between batches
        } else {
          // All done, update UI
          this.selectPosts();
        }
      };
      
      processBatch();
    },
    getPostWithBridge(author, permlink, key) {
      return new Promise((resolve, reject) => {
        fetch(this.hapi, {
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "bridge.get_post",
            params: {
              author: author,
              permlink: permlink,
              observer: this.account || ""
            },
            id: 1
          }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        })
          .then((r) => r.json())
          .then((res) => {
            if (res.result) {
              const post = res.result;
              
              // Calculate total payout correctly
              let totalPayout = 0;
              const pendingPayout = parseFloat(post.pending_payout_value?.split(' ')[0] || '0');
              const authorPayout = parseFloat(post.author_payout_value?.split(' ')[0] || '0');
              const curatorPayout = parseFloat(post.curator_payout_value?.split(' ')[0] || '0');
              
              if (pendingPayout > 0) {
                totalPayout = pendingPayout;
              } else {
                totalPayout = authorPayout + curatorPayout;
              }
              
              // Update the post with full details, keeping existing DLUX-specific data
              this.posturls[key] = {
                ...this.posturls[key], // Keep DLUX data from data.dlux.io
                ...post, // Add Hive post data
                slider: 10000,
                flag: false,
                upVotes: 0,
                downVotes: 0,
                edit: false,
                hasVoted: false,
                hasMoreVotes: false,
                contract: {},
                // Set calculated total payout
                total_payout_value: totalPayout.toFixed(3) + " HBD",
              };
              
              // Process vote data
              if (post.active_votes && post.active_votes.length > 0) {
                for (var j = 0; j < post.active_votes.length; j++) {
                  if (post.active_votes[j].rshares > 0) {
                    this.posturls[key].upVotes++;
                  } else if (post.active_votes[j].rshares < 0) {
                    this.posturls[key].downVotes++;
                  }
                  // Skip rshares === 0 (neutral/no vote)

                  if (post.active_votes[j].voter === this.account) {
                    this.posturls[key].slider = post.active_votes[j].percent;
                    this.posturls[key].hasVoted = true;
                  }
                }
                
                // Add "+" indicator if we hit the API limit of 1000 votes
                if (post.active_votes.length >= 1000) {
                  this.posturls[key].hasMoreVotes = true;
                } else {
                  this.posturls[key].hasMoreVotes = false;
                }
                
                console.log(`Vote count for ${key}: ${this.posturls[key].upVotes} up, ${this.posturls[key].downVotes} down, total: ${post.active_votes.length}, hasMore: ${this.posturls[key].hasMoreVotes}`);
              }

              if (this.posturls[key].slider < 0) {
                this.posturls[key].slider = this.posturls[key].slider * -1;
                this.posturls[key].flag = true;
              }

              // Process JSON metadata
              try {
                if (typeof post.json_metadata === 'string') {
                  this.posturls[key].json_metadata = JSON.parse(post.json_metadata);
                }
                this.posturls[key].pic = this.picFind(this.posturls[key].json_metadata);
              } catch (e) {
                console.log(key, "no JSON?");
                this.posturls[key].json_metadata = {};
              }

              // Determine post type based on DLUX metadata
              var contracts = false;
              var type = "Blog";
              if (this.posturls[key].json_metadata.assets) {
                for (var i = 0; i < this.posturls[key].json_metadata.assets.length; i++) {
                  if (this.posturls[key].json_metadata.assets[i].contract) {
                    this.posturls[key].contract[this.posturls[key].json_metadata.assets[i].contract] = {};
                    contracts = true;
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
                this.getContracts(key);
              }

              // Set reputation using post data
              if (post.author_reputation) {
                this.posturls[key].rep = post.author_reputation;
              } else if (this.authors[post.author] && this.authors[post.author].reputation) {
                this.posturls[key].rep = this.authors[post.author].reputation;
              } else {
                this.posturls[key].rep = "...";
                this.rep(key);
              }

              this.posturls[key].preview = this.removeMD(post.body).substr(0, 250);
              this.posturls[key].ago = this.timeSince(post.created);
              this.posturls[key].url = `/dlux${key}`;
              
              resolve();
            } else {
              console.error('No result from bridge.get_post for', author, permlink);
              reject(new Error('No result from bridge.get_post'));
            }
          })
          .catch(error => {
            console.error(`Error fetching post details @${author}/${permlink}:`, error);
            reject(error);
          });
      });
    },
    getHivePosts() {
      if (
        !this.postSelect[this.postSelect.entry].e &&
        !this.postSelect[this.postSelect.entry].p
      ) {
        this.postSelect[this.postSelect.entry].p = true;

        let method, params;

        switch (this.currentTab) {
          case 'trending':
            method = 'bridge.get_ranked_posts';
            params = [{
              sort: 'trending',
              tag: '',
              observer: this.account || '',
              limit: this.postSelect[this.postSelect.entry].a,
              start_author: this.postSelect[this.postSelect.entry].start_author || '',
              start_permlink: this.postSelect[this.postSelect.entry].start_permlink || ''
            }];
            break;
          case 'promoted':
            method = 'bridge.get_ranked_posts';
            params = [{
              sort: 'created',
              tag: '',
              observer: this.account || '',
              limit: this.postSelect[this.postSelect.entry].a,
              start_author: this.postSelect[this.postSelect.entry].start_author || '',
              start_permlink: this.postSelect[this.postSelect.entry].start_permlink || ''
            }];
            break;
          case 'following':
            if (!this.account) {
              this.postSelect[this.postSelect.entry].p = false;
              return;
            }
            method = 'bridge.get_account_posts';
            params = [{
              sort: 'feed',
              account: this.account,
              observer: this.account,
              limit: this.postSelect[this.postSelect.entry].a,
              start_author: this.postSelect[this.postSelect.entry].start_author || '',
              start_permlink: this.postSelect[this.postSelect.entry].start_permlink || ''
            }];
            break;
          case 'communities':
            if (!this.selectedCommunity) {
              this.postSelect[this.postSelect.entry].p = false;
              return;
            }
            method = 'bridge.get_ranked_posts';
            params = [{
              sort: 'created',
              tag: this.selectedCommunity,
              observer: this.account || '',
              limit: this.postSelect[this.postSelect.entry].a,
              start_author: this.postSelect[this.postSelect.entry].start_author || '',
              start_permlink: this.postSelect[this.postSelect.entry].start_permlink || ''
            }];
            break;
          default:
            this.postSelect[this.postSelect.entry].p = false;
            return;
        }

        fetch(this.hapi, {
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: method,
            params: params,
            id: 1
          }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        })
          .then((r) => r.json())
          .then((res) => {
            this.postSelect[this.postSelect.entry].p = false;

            if (!res.result || res.result.length === 0) {
              this.postSelect[this.postSelect.entry].e = true;
              return;
            }

            var authors = [];

            if (res.result.length < this.postSelect[this.postSelect.entry].a) {
              this.postSelect[this.postSelect.entry].e = true;
            }

            // Set pagination parameters for next call
            if (res.result.length > 0) {
              const lastPost = res.result[res.result.length - 1];
              this.postSelect[this.postSelect.entry].start_author = lastPost.author;
              this.postSelect[this.postSelect.entry].start_permlink = lastPost.permlink;
            }

            for (var i = 0; i < res.result.length; i++) {
              const post = res.result[i];
              const key = `/@${post.author}/${post.permlink}`;

              if (!this.posturls[key]) {
                this.posturls[key] = {
                  ...post,
                  slider: 10000,
                  flag: false,
                  upVotes: 0,
                  downVotes: 0,
                  edit: false,
                  hasVoted: false,
                  hasMoreVotes: false,
                  contract: {},
                  type: 'Blog',
                  url: `/blog${key}`,
                  ago: this.timeSince(post.created),
                  preview: this.removeMD(post.body).substr(0, 250),
                  rep: "..."
                };

                // Process vote data
                if (post.active_votes && post.active_votes.length > 0) {
                  for (var j = 0; j < post.active_votes.length; j++) {
                    if (post.active_votes[j].rshares > 0) {
                      this.posturls[key].upVotes++;
                    } else if (post.active_votes[j].rshares < 0) {
                      this.posturls[key].downVotes++;
                    }
                    // Skip rshares === 0 (neutral/no vote)

                    if (post.active_votes[j].voter === this.account) {
                      this.posturls[key].slider = post.active_votes[j].percent;
                      this.posturls[key].hasVoted = true;
                    }
                  }
                  
                  // Add "+" indicator if we hit the API limit of 1000 votes
                  if (post.active_votes.length >= 1000) {
                    this.posturls[key].hasMoreVotes = true;
                  } else {
                    this.posturls[key].hasMoreVotes = false;
                  }
                  
                  console.log(`Vote count for ${key}: ${this.posturls[key].upVotes} up, ${this.posturls[key].downVotes} down, total: ${post.active_votes.length}, hasMore: ${this.posturls[key].hasMoreVotes}`);
                }

                if (this.posturls[key].slider < 0) {
                  this.posturls[key].slider = this.posturls[key].slider * -1;
                  this.posturls[key].flag = true;
                }

                // Process JSON metadata
                try {
                  if (typeof post.json_metadata === 'string') {
                    this.posturls[key].json_metadata = JSON.parse(post.json_metadata);
                  }
                                  // Calculate total payout correctly
                let totalPayout = 0;
                const pendingPayout = parseFloat(post.pending_payout_value?.split(' ')[0] || '0');
                const authorPayout = parseFloat(post.author_payout_value?.split(' ')[0] || '0');
                const curatorPayout = parseFloat(post.curator_payout_value?.split(' ')[0] || '0');
                
                if (pendingPayout > 0) {
                  totalPayout = pendingPayout;
                } else {
                  totalPayout = authorPayout + curatorPayout;
                }
                
                // Set calculated total payout
                this.posturls[key].total_payout_value = totalPayout.toFixed(3) + " HBD";
                
                // Use different image finding logic for blog posts vs DLUX posts
                if (this.posturls[key].type === 'Blog') {
                  this.posturls[key].pic = this.blogPicFind(this.posturls[key].json_metadata, post.body);
                } else {
                  this.posturls[key].pic = this.picFind(this.posturls[key].json_metadata);
                }
                } catch (e) {
                  console.log(key, "no JSON?");
                  this.posturls[key].json_metadata = {};
                }

                // Set reputation from post data for all posts (DLUX and Blog)
                if (post.author_reputation) {
                  this.posturls[key].rep = post.author_reputation
                } else if (this.authors[post.author] && this.authors[post.author].reputation) {
                  this.posturls[key].rep = this.authors[post.author].reputation
                }
              }

              this[this.postSelect.entry].push(key);
              authors.push(post.author);
            }

            this.selectPosts();
            authors = [...new Set(authors)];
            if (authors.length > 0) {
              this.getHiveAuthors(authors);
            }
          })
          .catch(error => {
            console.error('Error fetching Hive posts:', error);
            this.postSelect[this.postSelect.entry].p = false;
          });
      }
    },
    selectPosts(modal) {
      // Track which posts are already displayed to avoid reorganization
      var existingKeys = new Set();
      this.masonryColumns.forEach(column => {
        column.forEach(post => {
          existingKeys.add(`/@${post.author}/${post.permlink}`);
        });
      });
      
      var newPosts = [];
      
      for (var i = 0; i < this[this.postSelect.entry].length; i++) {
        var postKey = this[this.postSelect.entry][i];
        if (this.posturls[postKey] && !existingKeys.has(postKey)) {
          newPosts.push(this.posturls[postKey]);
        }
      }
      
      // Add new posts to masonry columns
      if (newPosts.length > 0) {
        newPosts.forEach(post => {
          this.addPostToMasonry(post, true);
        });
        
        // Update displayPosts for compatibility
        this.displayPosts = [];
        this.masonryColumns.forEach(column => {
          this.displayPosts.push(...column);
        });
      }
      
      if (modal) {
        this[modal[0]].items = this.displayPosts;
        this[modal[0]].item = this[modal[0]].items[modal[1]];
        this[modal[0]].index = modal[1];
      }
    },
    getContent(a, p, modal) {
      if (a && p) {
        fetch(this.hapi, { // Use constant HIVE_API
          body: `{"jsonrpc":"2.0", "method":"condenser_api.get_content", "params":{"author": "${a}", "permlink": "${p}", "observer": "${this.account}"}, "id":1}`,
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
                  hasMoreVotes: false,
                  contract: {},
                  type: 'Blog',
                };
              for (
                var i = 0;
                i < this.posturls[key].active_votes.length;
                i++
              ) {
                if (this.posturls[key].active_votes[i].rshares > 0) {
                  this.posturls[key].upVotes++;
                } else if (this.posturls[key].active_votes[i].rshares < 0) {
                  this.posturls[key].downVotes++;
                }
                // Skip rshares === 0 (neutral/no vote)

                if (this.posturls[key].active_votes[i].voter == this.account) {
                  this.posturls[key].slider = this.posturls[key].active_votes[i].percent
                  this.posturls[key].hasVoted = true
                }
              }
              
              // Add "+" indicator if we hit the API limit of 1000 votes
              if (this.posturls[key].active_votes.length >= 1000) {
                this.posturls[key].hasMoreVotes = true;
              } else {
                this.posturls[key].hasMoreVotes = false;
              }
              
              console.log(`Vote count for ${key}: ${this.posturls[key].upVotes} up, ${this.posturls[key].downVotes} down, total: ${this.posturls[key].active_votes.length}, hasMore: ${this.posturls[key].hasMoreVotes}`);
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
              // Set reputation using same logic as blog posts
              if (this.posturls[key].author_reputation) {
                this.posturls[key].rep = this.posturls[key].author_reputation;
              } else if (this.authors[this.posturls[key].author] && this.authors[this.posturls[key].author].reputation) {
                this.posturls[key].rep = this.authors[this.posturls[key].author].reputation;
              } else {
                this.posturls[key].rep = "...";
                this.rep(key);
              }
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
    blogPicFind(json, body) {
      // For blog posts, search JSON metadata first, then post body
      console.log('DEBUG: blogPicFind called with json:', json);
      console.log('DEBUG: body length:', body?.length, 'body preview:', body?.substr(0, 100));

      var arr;
      try {
        arr = json.image[0];
      } catch (e) { }

      // Check JSON metadata first
      if (typeof json.image == "string") {
        console.log('DEBUG: Found string image in json.image:', json.image);
        return json.image;
      } else if (typeof arr == "string") {
        console.log('DEBUG: Found string image in json.image[0]:', arr);
        return arr;
      }

      // Search post body for markdown images ![alt](url)
      try {
        const imageMatches = body.match(/!\[.*?\]\((.*?)\)/);
        if (imageMatches && imageMatches[1]) {
          let imageUrl = imageMatches[1].trim();
          console.log('DEBUG: Found markdown image:', imageUrl);
          // Handle relative URLs
          if (imageUrl.startsWith('http')) {
            return imageUrl;
          }
        }
      } catch (e) {
        console.log('DEBUG: Error in markdown search:', e);
      }

      // Search for any http/https URLs in the body as fallback
      try {
        const urlMatches = body.match(/https?:\/\/[^\s)]+\.(jpg|jpeg|png|gif|webp|svg)/gi);
        if (urlMatches && urlMatches[0]) {
          console.log('DEBUG: Found fallback image URL:', urlMatches[0]);
          return urlMatches[0];
        }
      } catch (e) {
        console.log('DEBUG: Error in fallback search:', e);
      }

      // No image found
      console.log('DEBUG: No image found for blog post');
      return null;
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
        this.posturls[a].rep = this.authors[this.posturls[a].author].reputation
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
      var newUsers = [];
      for (var i = 0; i < users.length; i++) {
        if (!this.authors[users[i]]) {
          q += `"${users[i]}",`;
          newUsers.push(users[i]);
        }
      }
      if (q.length > 0) {
        q = q.substring(0, q.length - 1);
        console.log('Fetching author data for:', newUsers);
        fetch(HIVE_API, { // Use constant HIVE_API
          body: `{"jsonrpc":"2.0", "method":"condenser_api.get_accounts", "params":[${JSON.stringify(newUsers)}], "id":1}`,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          method: "POST",
        })
          .then((response) => response.json())
          .then((data) => {
            console.log('Received author data for accounts without post reputation:', data.result?.length || 0, 'authors');

            for (var i = 0; i < data.result.length; i++) {
              this.authors[data.result[i].name] = data.result[i];
              console.log('Added author:', data.result[i].name, 'reputation:', data.result[i].reputation);
            }

            // Update reputation for newly loaded authors
            this.updateReputationForPosts(data.result);
          })
          .catch(error => console.error('Error fetching Hive authors:', error)); // Add catch
      } else {
        console.log('All authors already cached, updating reputation for existing authors');
        // Even if all authors are cached, make sure reputation is updated
        const existingAuthors = users.map(username => this.authors[username]).filter(Boolean);
        this.updateReputationForPosts(existingAuthors);
      }
    },
    updateReputationForPosts(authors) {
      console.log('Updating reputation for', authors.length, 'authors');
      for (const author of authors) {
        if (author && author.name && author.reputation) {
          let updatedCount = 0;
          for (const postKey in this.posturls) {
            if (this.posturls[postKey].author === author.name && this.posturls[postKey].rep === "...") {
              // Try to use author_reputation from post first, then fall back to author reputation
              const post = this.posturls[postKey];
              if (post.author_reputation) {
                post.rep = post.author_reputation;
              } else {
                post.rep = author.reputation;
              }
              updatedCount++;
            }
          }
          if (updatedCount > 0) {
            console.log(`Updated ${updatedCount} posts for ${author.name}`);
          }
        }
      }
    },
    // Hash routing methods
    handleHashRoute() {
      const hash = window.location.hash.substring(1); // Remove the #
      console.log('Handling hash route:', hash);
      
      if (!hash) {
        // Default to hub tab
        this.switchTab('hub');
        return;
      }
      
      const parts = hash.split('/');
      const route = parts[0];
      
      switch (route) {
        case 'new':
        case 'hub':
          this.switchTab('hub');
          break;
        case 'trending':
          this.switchTab('trending');
          break;
        case 'promoted':
          this.switchTab('promoted');
          break;
        case 'following':
          if (this.account) {
            this.switchTab('following');
          }
          break;
                 case 'community':
           this.switchTab('communities');
           if (parts[1]) {
             // Set the selected community directly without URL update
             this.selectedCommunity = parts[1];
             this.onCommunityChange();
           }
           break;
        case 'communities':
          this.switchTab('communities');
          break;
        default:
          this.switchTab('hub');
      }
    },
    navigateToSpecificCommunity(communityId) {
      console.log('Navigating to community:', communityId);
      // Ensure communities are loaded
      if (this.availableCommunities.length === 0) {
        this.getAvailableCommunities();
      }
      
      // Set the selected community
      this.selectedCommunity = communityId;
      
      // Update the URL hash
      window.location.hash = `#community/${communityId}`;
      
      // Trigger community change
      this.onCommunityChange();
    },
    updateHashFromTab() {
      // Update hash when switching tabs manually
      let hash = '';
      switch (this.currentTab) {
        case 'hub':
          hash = '#hub';
          break;
        case 'trending':
          hash = '#trending';
          break;
        case 'promoted':
          hash = '#promoted';
          break;
        case 'following':
          hash = '#following';
          break;
        case 'communities':
          if (this.selectedCommunity) {
            hash = `#community/${this.selectedCommunity}`;
          } else {
            hash = '#communities';
          }
          break;
        default:
          hash = '#hub';
      }
      
      if (window.location.hash !== hash) {
        window.location.hash = hash;
      }
    },
    onCommunityChange() {
      if (this.currentTab === 'communities' && this.selectedCommunity) {
        // Reset pagination for communities
        this.postSelect.communities.start_author = '';
        this.postSelect.communities.start_permlink = '';
        this.postSelect.communities.e = false;
        this.postSelect.communities.p = false;
        this.communities = [];
        this.displayPosts = [];
        this.initializeMasonryColumns();
        this.newPostsCount = 0;

        // Optionally get community info (for future use)
        this.getCommunityInfo(this.selectedCommunity);

        this.getHivePosts();
      }
    },
    getFollowedCommunities() {
      if (!this.account || this.loadingFollowedCommunities) return;

      this.loadingFollowedCommunities = true;

      fetch(this.hapi, {
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "bridge.get_following",
          params: {
            account: this.account,
            type: "community",
            start: "",
            limit: 100
          },
          id: 1
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      })
        .then((r) => r.json())
        .then((res) => {
          this.loadingFollowedCommunities = false;
          if (res.result && res.result.length > 0) {
            this.followedCommunities = res.result.map(follow => ({
              id: follow.following,
              name: follow.title || follow.following,
              description: follow.about || 'Community',
              subscribers: follow.subscribers || 0
            }));
            console.log('Loaded followed communities:', this.followedCommunities.length);
          } else {
            this.followedCommunities = [];
            console.log('No followed communities found');
          }
        })
        .catch(error => {
          console.error('Error fetching followed communities:', error);
          this.loadingFollowedCommunities = false;
          this.followedCommunities = [];
        });
    },
  },
  mounted() {
    // Initialize masonry system
    this.initializeMasonryColumns();
    
    // Initialize with hub tab as default
    this.currentTab = 'hub';
    this.postSelect.entry = 'new';

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
      // Initialize hash routing
      this.skipHashUpdate = true; // Prevent initial hash update
      this.handleHashRoute(); // Handle initial hash
      
      // Add hash change listener
      window.addEventListener('hashchange', () => {
        this.skipHashUpdate = true; // Prevent loop
        this.handleHashRoute();
      });
      
      this.boundScrollHandler = this.handleScroll.bind(this); // Create bound handler
      this.boundResizeHandler = this.handleResize.bind(this); // Create bound resize handler
      document.body.addEventListener('scroll', this.boundScrollHandler); // Use bound handler
      window.addEventListener('resize', this.boundResizeHandler); // Add resize listener
    }
    this.getStats()
    this.getSPKStats()
    this.getProtocol();
    this.getRewardFund();
    this.getFeedPrice();

    // Pre-load communities list
    this.getAvailableCommunities();
    
    // Load followed communities if user is logged in
    if (this.account) {
      this.getFollowedCommunities();
    }

    // Start observing for video elements to setup HLS
    this.videoObserver = this.initIpfsVideoSupport();
  },
  unmounted() {
    if (this.boundScrollHandler) { // Check if handler exists before removing
      document.body.removeEventListener('scroll', this.boundScrollHandler); // Use bound handler
    }
    if (this.boundResizeHandler) { // Check if resize handler exists before removing
      window.removeEventListener('resize', this.boundResizeHandler); // Remove resize handler
    }
    if (this.resizeTimeout) { // Clear any pending resize timeout
      clearTimeout(this.resizeTimeout);
    }

    // Clean up hash change listener
    window.removeEventListener('hashchange', this.handleHashRoute);

    // Clean up video observer and HLS instances
    if (this.videoObserver) {
      this.videoObserver.disconnect();
      window._dluxVideoObserver = null;
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
        this.initializeMasonryColumns()
        this[this.postSelect.entry] = []
        this.postSelect[this.postSelect.entry].o = 0
        this.postSelect[this.postSelect.entry].e = false;
      }
    },
    authors: {
      handler(newAuthors, oldAuthors) {
        // Update reputation for posts when author data becomes available
        console.log('Authors watcher triggered, checking for reputation updates');
        for (const authorName in newAuthors) {
          if (newAuthors[authorName] && (!oldAuthors || !oldAuthors[authorName])) {
            // New author data available, update reputation for their posts
            console.log(`New author data available for ${authorName}, updating posts`);
            let updatedCount = 0;
            for (const postKey in this.posturls) {
              if (this.posturls[postKey].author === authorName && this.posturls[postKey].rep === "...") {
                // Try to use author_reputation from post first, then fall back to author reputation
                const post = this.posturls[postKey];
                if (post.author_reputation) {
                  post.rep = post.author_reputation
                } else {
                  post.rep = newAuthors[authorName].reputation
                }
                updatedCount++;
              }
            }
            console.log(`Watcher updated ${updatedCount} posts for ${authorName}`);
          }
        }
      },
      deep: true
    },
    account(newAccount, oldAccount) {
      // Load followed communities when user logs in
      if (newAccount && newAccount !== oldAccount) {
        this.getFollowedCommunities();
      } else if (!newAccount) {
        // Clear followed communities when user logs out
        this.followedCommunities = [];
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
