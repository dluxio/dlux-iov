export default {
  components: {
  },
  template: `<div class="card h-100 text-white border-start border-end" :style="{'background': colors}">
  <!-- HEAD -->
  <div class="card-header border-0 p-1">

    <!-- NFT HEAD -->
    <div class="d-flex justify-content-between align-items-stretch" v-if="!mint">
      <div class="d-flex rounded align-items-stretch" style="background: rgba(0,0,0,1)">
        <a :href="'/nfts/set/' + item.setname + '#' + item.token" class="d-flex py-1 align-items-center px-2 no-decoration"
          style="font-size: 1.3em;">
          <span class="rainbow-text d-flex align-items-center" style="background-image: linear-gradient(rgb(194, 255, 182), rgb(255, 163, 182), rgb(221, 169, 255), rgb(162, 209, 255));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent; 
            -moz-background-clip: text;
            -moz-text-fill-color: transparent;;">
              <i class="me-1" :class="[icon]"></i>
              <b><span class="d-none d-sm-flex">{{item.setname}}</span></b>
            <span class="d-sm-none small">{{item.setname}}</span>
          </span>
        </a>
      </div>
      <div class="rounded-pill d-flex align-items-center p-1" style="background: black">
        <h2 class="m-0 px-1 d-none d-sm-block">{{item.uid}}</h2>
        <h5 class="m-0 px-1 d-sm-none small">{{item.uid}}</h5>
      </div>
    </div>

    <!-- MINT HEAD -->
    <div class="d-flex justify-content-between align-items-stretch" v-if="mint">
      <div class="d-flex rounded align-items-stretch shimmer border border-dark align-items-center">
        <a :href="'/nfts/set/' + item.set + '#' + item.token" class="d-flex align-items-center px-2 no-decoration text-black"
          style="font-size: 1.3em;">
          <i class="me-1" :class="[icon]"></i><b>{{item.set}}</b></a>
      </div>
      <div class="rounded-pill d-flex align-items-center py-1 px-2" style="background-color: black">
        <div>
          <small>QTY: </small>
        </div>
        <div class="ms-1">
          <h2 class="m-0">{{formatNumber(item.qty,'0','.',',')}}</h2>
        </div>
      </div>
    </div>

  </div>

  <!-- BODY -->
  <div class="card-body mx-1 d-flex flex-column p-0 rounded" style="background: rgba(0,0,0,.75)">

    <!-- NFT BODY -->
    <div class="flex-grow-1" v-if="!mint">
      <a href="#itemModal" class="a-1" data-bs-toggle="modal" @click="modalIndex('details')">
        <div class="card-img-top nft-img rounded" :alt="'image-' +  item.setname + '-' + item.uid" v-html="sanitizeHTML(item.HTML)">
        </div>
      </a>
    </div>

    <!-- MINT BODY -->
    <div class="p-2 flex-grow-1 d-flex" v-if="mint">
      <a role="button" title="Mint Details" data-bs-toggle="modal" data-bs-target="#transferModal"
        @click="modal('transfer')">
        <img v-if="wrapped" class="w-100 border border-dark border-2 rounded mt-auto mb-auto"
          :src="'https://ipfs.dlux.io/ipfs/' + wrapped"></a>
    </div>

    <div class="d-flex d-none flex-column flex-shrink-1">
      <div class="text-center">
        <h3 class="my-1" :style="{'background-image': colors}" style="-webkit-background-clip: text;
                   -webkit-text-fill-color: transparent; 
                   -moz-background-clip: text;
                   -moz-text-fill-color: transparent;">
          <span v-if="!mint">#{{Base64toNumber(uid)}}</span>
          <span v-if="mint">sealed NFT</span>
        </h3>
      </div>
    </div>

  </div>


  <!-- FOOTER -->
  <div class="card-footer px-1 pb-1 pt-0 border-0">

    <!-- TRADE Mints-->
    <a href="#transferModal" class="no-decoration" data-bs-toggle="modal" @click="modalIndex('details'); $emit('focusitem', item)" v-if="trade && mint">
      <div class="text-white text-center">
        <div class="bg-dark rounded">
          <div class="mt-1 text-center rounded-top bg-info-50">
            <h5 id="timer-set-uid" class="mb-0 lead">
              <p class="no-decoration text-white" v-if="item.to != account">To @{{item.to}}</p>
              <p class="no-decoration text-white" v-if="item.to == account">From @{{item.from}}</p>
            </h5>
          </div>
          <div class="d-flex rounded-bottom p-2">
            <div class="fs-6">
              {{formatNumber(item.price/1000,3,'.',',')}}
            </div>
            <div class="fs-6 text-uppercase ms-auto">
              {{item.token}}
            </div>
          </div>
        </div>
      </div>
    </a>

    <!-- TRADE NFTs-->
    <a href="#itemModal" class="no-decoration" data-bs-toggle="modal" @click="modalIndex('details'); $emit('focusitem', item)" v-if="trade && !mint">
      <div class="text-white text-center">
        <div class="bg-dark rounded">
          <div class="mt-1 text-center rounded-top bg-info-50">
            <h5 id="timer-set-uid" class="mb-0 lead">
              <p class="no-decoration text-white" v-if="item.to != account">To @{{item.to}}</p>
              <p class="no-decoration text-white" v-if="item.to == account">From @{{item.from}}</p>
            </h5>
          </div>
          <div class="d-flex rounded-bottom p-2">
            <div class="fs-6">
              {{formatNumber(item.price/1000,3,'.',',')}}
            </div>
            <div class="fs-6 text-uppercase ms-auto">
              {{item.token}}
            </div>
          </div>
        </div>
      </div>
    </a>

    <!-- INVENTORY -->
    <div class="text-white" v-if="inventory">
      <div class="bg-dark rounded mt-1">
            <a href="#itemModal" data-bs-toggle="modal" @click="modalIndex('details')" class="btn w-100" v-if="!mint" :style="{'background-image': colors}" style="-webkit-background-clip: text;
                   -webkit-text-fill-color: transparent; 
                   -moz-background-clip: text;
                   -moz-text-fill-color: transparent;">
              <span>#{{uid}}</span>
            </a>
            <button class="btn w-100" v-if="mint" @click="openNFT()" :style="{'background-image': colors}" style="-webkit-background-clip: text;
                   -webkit-text-fill-color: transparent; 
                   -moz-background-clip: text;
                   -moz-text-fill-color: transparent;">
              <span>Open sealed NFT</span>
            </button>
      </div>
    </div>

    <!-- SALE -->
    <a href="#itemModal" class="no-decoration" data-bs-toggle="modal" @click="modalIndex('details')">
      <div class="text-white text-center" v-if="sale">
        <div class="bg-dark rounded">
          <div class="mt-1 text-center rounded-top"
            v-bind:class="{'bg-warning-50': item.by == account, 'bg-success-50': item.by != account}">
            <h5 id="timer-set-uid" class="mb-0 lead">Buy Now</h5>
          </div>
          <div class="d-flex rounded-bottom p-2">
            <div class="fs-6 text-break">
              {{formatNumber(item.price.amount/1000,item.price.precision,'.',',')}}
            </div>
            <div class="fs-6 ms-auto">
              {{item.price.token}}
            </div>
          </div>
        </div>
      </div>
    </a>

    <!-- AUCTION -->
    <a href="#itemModal" class="no-decoration" data-bs-toggle="modal" @click="modalIndex('details')">
      <div class="text-white text-center" v-if="auction">
        <div class="bg-dark rounded">
          <div class="mt-1 text-center rounded-top bg-danger-50"
            v-bind:class="{'bg-warning-50': item.by == account, 'bg-danger-50': item.by != account}">
            <h5 id="timer-set-uid" class="mb-0 lead">Ends in {{animateTime}}</h5>
          </div>
          <div class="d-flex rounded-bottom p-2">
            <div class="fs3">
              {{formatNumber(item.price.amount/1000,item.price.precision,'.',',')}}
            </div>
            <div class="fs3 ms-auto">
              {{item.price.token}}
            </div>
          </div>
        </div>
      </div>
    </a>

    <!-- OWNER -->
    <div class="text-white text-center" v-if="!trade && !auction && !sale && !inventory">
      <div class="bg-dark rounded">
        <div class="mt-1 text-center rounded-top"
          v-bind:class="{'bg-warning-50': item.owner == account, 'bg-primary-50': item.owner != account}">
          <h5 id="timer-set-uid" class="mb-0 lead d-flex align-items-center justify-content-center"><i
              class="fs-6 fa-solid fa-hashtag fa-fw"></i>{{uid}}</h5>
        </div>
        <div class="d-flex rounded-bottom p-2">
          <div class="fs3">
            <a class="no-decoration" :href="'/@' + item.owner"><i
                class="fa-solid fa-user-astronaut fa-fw me-1"></i>{{item.owner}}</a>
          </div>
          <div class="fs3 ms-auto">

          </div>
        </div>
      </div>
    </div>

  </div>
  
</div>
`,
  // @click="modalIndex('itemModal', item.setname + ':' + item.uid );itemModal.hidden = false"
  // set PFP
  props: {
    item: {
      required: true,
      default: function () {
        return {
          script: '',
          set: {
            Color1: '#000000',
            Color2: '#000000',
          },
        };
      },
    },
    index: {
      default: 0
    },
    wrapped: {
      default: ''
    },
    uid: {
      default: ''
    },
    oicon: {
      default: ''
    },
    ocolors: {
      default: ''
    },
    multisig: {
      default: ''
    },
    trade: {
      default: false
    },
    sale: {
      default: false
    },
    auction: {
      default: false
    },
    mint: {
      default: false
    },
    inventory: {
      default: false
    },
    account: {
      default: ''
    },
  },
  emits: ['detail', 'modal', 'focusitem', 'tosign'],
  data() {
    return {
    };
  },
  computed: {
    colors(){return this.ocolors ? this.ocolors : `linear-gradient(${this.item.set.Color1},${this.item.set.Color2})`},
    icon(){return this.oicon ? this.oicon : `${this.item.set.faicon}`},
    animateTime(){
      // display time until expiration
      const now = new Date();
      const end = new Date(this.item.time);
      const diff = end - now;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor(diff / (1000));
      if (days > 0) {
        return `${days} day${days == 1 ? '' : 's'}`;
      } else if (hours > 0) {
        return `${hours} hour${hours == 1 ? '' : 's'}`;
      } else if (minutes > 0) {
        return `${minutes} minute${minutes == 1 ? '' : 's'}`;
      } else if (seconds > 0) {
        return `${seconds} second${seconds == 1 ? '' : 's'}`;
      } else {
        return `0s`;
      }
    },
  },
  methods: {
    Base64toNumber(chars = "aa") {
      const glyphs =
        "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+=";
      var result = 0;
      if(typeof chars == 'string')chars = chars.split("")
      else chars = []
      for (var e = 0; e < chars.length; e++) {
        result = result * 64 + glyphs.indexOf(chars[e]);
      }
      return result;
    },
    buyNFT(){
      if(this.item.price.token == 'HIVE' || this.item.price.token == "HBD") this.$emit('tosign', {
        type: "xfr",
        cj: {
          to: this.multisig,
          [this.item.price.token.toLowerCase()]: this.item.price.amount,
          memo: `NFTbuy ${this.item.setname}:${this.item.uid}`,
        },
        txid: "sendhive",
        msg: `Buying ${this.item.setname}:${this.item.uid}`,
        api: "https://spktest.dlux.io",
        ops: ["getTokenUser"],
      });
      else this.$emit('tosign', {
        type: 'cja',
        cj: {
            set: this.item.setname,
            uid: this.item.uid,
            price: this.item.price.amount,
          },
        id: `${this.item.token}_nft_buy`,
        msg: `Buying ${this.item.setname}:${this.item.uid}`,
        ops: ["getTokenUser"],
        api: "https://spktest.dlux.io",
        txid: `${this.item.setname}:${this.item.uid}_nft_buy`
      });
    },
    cancelNFT(){
      this.$emit('tosign', {
        type: 'cja',
        cj: {
            set: this.item.setname,
            uid: this.item.uid,
          },
        id: `${this.item.token}_nft_sell_${(this.item.price.token == 'HIVE' || this.item.price.token == "HBD") ? 'h' : ''}cancel`,
        msg: `Canceling ${this.item.setname}:${this.item.uid}`,
        ops: ["getTokenUser"],
        api: "https://spktest.dlux.io",
        txid: `${this.item.setname}:${this.item.uid}_nft_cancel`
      });
    },
    acceptXfr(){
      if(this.item.price.token == 'HIVE' || this.item.price.token == "HBD") this.$emit('tosign', { //not sure if hive trades exist
        type: "xfr",
        // cj: {
        //   to: this.multisig,
        //   [this.item.price.token.toLowerCase()]: this.item.price.amount,
        //   memo: `NFTbuy ${this.item.setname}:${this.item.uid}`,
        // },
        txid: "sendhive",
        msg: `Buying ${this.item.setname}:${this.item.uid}`,
        api: "https://spktest.dlux.io",
        ops: ["getTokenUser"],
      });
      else this.$emit('tosign', {
        type: 'cja',
        cj: {
            set: this.item.setname || this.item.set,
            uid: this.item.uid,
            price: this.item.price.amount,
          },
        id: `${this.item.token}_${this.item.setname ? 'nft_reserve_complete' : 'ft_escrow_complete'}`,
        msg: `Buying ${this.item.setname}:${this.item.uid}`,
        ops: ["getTokenUser"],
        api: "https://spktest.dlux.io",
        txid: `${this.item.setname}:${this.item.uid}_nft_reserve_complete`
      });
    },
    cancelXfr(){
      this.$emit('tosign', {
        type: 'cja',
        cj: {
            set: this.item.setname || this.item.set,
            uid: this.item.uid,
          },
        id: `${this.item.token}_${this.item.setname ? 'nft_transfer_cancel' : 'ft_escrow_cancel'}`,
        msg: `Canceling ${this.item.setname}:${this.item.uid} Transfer`,
        ops: ["getTokenUser"],
        api: "https://spktest.dlux.io",
        txid: `${this.item.setname}:${this.item.uid}_nft_transfer_cancel`
      });
    },
    openNFT(){
      this.$emit('tosign', {
        type: 'cja',
        cj: {
            set: this.item.set,
          },
        id: `${this.item.token}_nft_mint`,
        msg: `Minting ${this.item.set} token`,
        ops: ["getTokenUser"],
        api: "https://spktest.dlux.io",
        txid: `${this.item.set}_nft_mint`
      });
    },
    modalIndex(name) {
      const object = {
        item: this.item,
        tab: name,
      }
      this.$emit('detail', `${this.item.setname}:${this.item.uid}`);
    },
    modal(name) {
      const object = {
        item: this.item,
        mint: this.mint,
        tab: name,
      }
      this.$emit('modal', name);
      this.$emit('focusitem', this.item);
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
    formatNumber(t, n, r, e) { // number, decimals, decimal separator, thousands separator
      if (typeof t != "number") {
        const parts = t ? t.split(" ") : []
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
    gt(a, b) {
      return parseFloat(a) > parseFloat(b);
    },
    sanitizeHTML(html) {
      if (!html || typeof html !== 'string') return '';
      
      // Less restrictive sanitization for NFTs - allow rich content while preventing XSS
      return DOMPurify.sanitize(html, {
        // Only forbid the most dangerous tags
        FORBID_TAGS: [
          'script', 'object', 'embed', 'applet', 'meta', 
          'link', 'base', 'dialog', 'iframe', 'frame', 'frameset'
        ],
        // Only forbid the most dangerous attributes - allow styling and some interactivity
        FORBID_ATTR: [
          'onload', 'onerror', 'onclick', 'onmouseover', 'onfocus', 'onblur',
          'onchange', 'onsubmit', 'onreset', 'onselect', 'onunload', 'onbeforeunload',
          'onabort', 'onafterprint', 'onbeforeprint', 'oncontextmenu', 'ondblclick',
          'ondrag', 'ondragend', 'ondragenter', 'ondragleave', 'ondragover', 
          'ondragstart', 'ondrop', 'oninput', 'oninvalid', 'onkeydown', 'onkeypress',
          'onkeyup', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseup', 
          'onmousewheel', 'onoffline', 'ononline', 'onpagehide', 'onpageshow',
          'onpopstate', 'onresize', 'onscroll', 'onstorage', 'onwheel',
          'srcdoc', 'sandbox', 'open'
        ],
        // Allow broader range of protocols for NFT content
        ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|ipfs|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
        // Allow more HTML elements for rich NFT content
        ADD_TAGS: ['style'],
        ADD_ATTR: ['style', 'allowfullscreen', 'controls', 'autoplay', 'loop', 'muted'],
        // Additional safety measures
        SANITIZE_DOM: true,
        KEEP_CONTENT: true,
        RETURN_DOM: false,
        RETURN_TRUSTED_TYPE: false
      });
    },
  },
  mounted() {
    
  },
};