export default {
  components: {
  },
  template: `<div class="card h-100 text-white border-start border-end"
:style="{'background': colors}">
<!-- HEAD -->
<div class="card-header border-0 px-2">
  <!-- NFT HEAD --> 
  <div class="d-flex justify-content-between align-items-center" v-if="!mint">
    <div class="rounded-pill d-flex align-items-center p-1"
        style="background: black">
        <h2 class="m-0 px-1">{{item.uid}}</h2>
    </div>
    <div class="rounded px-2 py-1" style="background: rgba(0,0,0,1)">
        <a :href="'/nfts/set/' + item.setname + '#' + item.token"
            class="no-decoration" style="font-size: 1.3em;">
            <span class="rainbow-text" style="background-image: linear-gradient(rgb(194, 255, 182), rgb(255, 163, 182), rgb(221, 169, 255), rgb(162, 209, 255));
            -webkit-background-clip: text;
        -webkit-text-fill-color: transparent; 
        -moz-background-clip: text;
        -moz-text-fill-color: transparent;;"><i class="me-1"
                    :class="[icon]"></i><b>{{item.setname}}</b></span></a>
    </div>
    </div>
    <!-- MINT HEAD -->
    <div class="d-flex justify-content-between align-items-center" v-if="mint">
     <div class="rounded-pill d-flex align-items-center py-1 px-2"
       style="background-color: black">
        <div>
        <small>QTY: </small>
        </div>
        <div class="ms-1">
          <h2 class="m-0">{{item.qty}}</h2>
        </div>
      </div>
             <div class="rounded px-2 py-1 shimmer border border-dark">
             <a :href="'/nfts/set/' + item.setname + '#' + item.token"
                 class="no-decoration text-black" style="font-size: 1.3em;">
                 <i class="me-1" :class="[icon]"></i><b>{{item.set}}</b></a>
         </div>
        </div>
</div>

<!-- BODY -->
<div class="card-body d-flex flex-column p-0 rounded" style="background: rgba(0,0,0,.75)">
<div class="text-center rounded-top bg-hive" :class="{'invisible': !auction}">
    <h5 id="timer-set-uid" class="mb-0 lead">{{animateTime}}</h5>
</div>
<div class="px-1 pb-2">
  <!-- NFT BODY -->
  <div class="flex-grow-1" v-if="!mint">
    <a href="#itemModal" class="a-1" data-bs-toggle="modal" 
      @click="modalIndex('details')">
      <div class="card-img-top" :alt="'image-' +  item.setname + '-' + item.uid"
        v-html="item.HTML">
      </div>
    </a>
  </div>
  <!-- MINT BODY -->
  <div class="p-2 flex-grow-1 d-flex" v-if="mint">
    <img v-if="wrapped" class="w-100 border border-dark border-2 rounded mt-auto mb-auto"
    :src="'https://ipfs.io/ipfs/' + wrapped">
  </div>
  <div class="flex-shrink-1">
    <div class="text-center">
        <h3 class="my-1"
            :style="{'background-image': colors}"
            style="-webkit-background-clip: text;
                   -webkit-text-fill-color: transparent; 
                   -moz-background-clip: text;
                   -moz-text-fill-color: transparent;">
            <span v-if="!mint">#{{uid}}</span>
            <span v-if="mint">sealed NFT</span></h3>
    </div>
    <div class="text-center lead"><small><span
                class="badge bg-dark text-muted">{{item.token}}<i
                    class="fa-solid fa-link mx-2 text-info"></i>network</span></small>
    </div>
    </div>
  </div>
</div>
<!-- TRADE FOOT -->
<div class="card-footer border-0 px-1" v-if="trade">
        <div class="p-2 text-white text-center rounded" style="background-color: rgba(0,0,0,0.75)">
        <section>
          <div class="d-flex align-items-center">
            <div class="text-end mt-auto mb-auto me-1" style="flex: 1">
              <h5 class="small m-0">
                <span v-if="item.to != account">TO:</span>
                <span v-if="item.to == account">FROM:</span>
              </h5>
            </div>
            <div class="text-start mt-auto mb-auto" style="flex: 2">
              <h5 class="lead m-0">
                <a class="no-decoration text-info" v-if="item.to != account" :href="'/@' + item.to">{{item.to}}</a>
                <a class="no-decoration text-info" v-if="item.to == account" :href="'/@' + item.from">{{item.from}}</a>
              </h5>
            </div>
          </div>
          <div class="d-flex align-items-center my-2">
            <div class="text-end mt-auto mb-auto me-1" style="flex: 1">
              <h5 class="small m-0">PRICE:</h5>
            </div>
            <div class="text-start mt-auto mb-auto" style="flex: 2">
              <h5 class="lead m-0">{{item.priceString}}</h5>
            </div>
          </div>
        </section>
          <!-- ACCEPT / REJECT -->
          <div class="btn-group" role="group" v-if="item.to == account">
           <button type="button" class="btn btn-success" title="Accept Trade"
            @click="acceptXfr()"><i class="fa-solid fa-check fa-fw"></i></button>
            <button type="button" class="btn ps-05 pe-05 border-0"
                   disabled></button>
              <button type="button" class="btn btn-danger" title="Decline Trade"
              @click="cancelXfr()"><i class="fa-solid fa-xmark fa-fw"></i></button>
           </div>
             <!-- CANCEL -->
             <div class="btn-group" v-if="item.from == account">
             <button type="button" class="btn btn-warning" title="Cancel Trade"
              @click="cancelXfr()">
              <i class="fa-solid fa-xmark fa-fw"></i></button>
             </div>
        </div>
      </div>
<!-- AUCTION FOOT -->
<div class="card-footer border-0 px-1" v-if="auction">
  <div class="p-2 text-white text-center rounded" style="background-color: rgba(0,0,0,0.75)">
    <section>
          <div class="d-flex align-items-center">
            <div class="text-end mt-auto mb-auto me-1" style="flex: 1">
              <h5 class="small m-0">SELLER:</h5>
            </div>
            <div class="text-start mt-auto mb-auto" style="flex: 2">
              <h5 class="lead m-0">
              <a class="no-decoration text-info" :href="'/@' + item.by">{{item.by}}</a>
              </h5>
            </div>
          </div>
          <div class="d-flex align-items-center my-2">
            <div class="text-end mt-auto mb-auto me-1" style="flex: 1">
              <h5 class="small m-0">BID:</h5>
            </div>
            <div class="text-start mt-auto mb-auto" style="flex: 2">
              <h5 class="lead m-0 text-break">{{formatNumber(item.price.amount/1000,item.price.precision,'.',',')}}
              {{item.price.token}}</h5>
            </div>
          </div>
        </section>     

            <!-- BUY -->
             <div class="btn-group" v-if="item.by != account">
             <button type="button" class="btn btn-primary" title="Buy NFT"
              @click="buyNFT(item)">
              Bid NFT</button>
             </div>
            <!-- CANCEL -->
             <div class="btn-group" v-if="item.by == account">
             <button type="button" class="btn btn-warning" title="Cancel Sale"
              @click="cancelSaleNFT(item)">
             Cancel Sale</button>
             </div>
  </div>
</div>
<!-- SALE FOOT -->
<div class="card-footer border-0 px-1" v-if="sale">
  <div class="p-2 text-white text-center rounded" style="background-color: rgba(0,0,0,0.75)">
    <section>
          <div class="d-flex align-items-center">
            <div class="text-end mt-auto mb-auto me-1" style="flex: 1">
              <h5 class="small m-0">SELLER:</h5>
            </div>
            <div class="text-start mt-auto mb-auto" style="flex: 2">
              <h5 class="lead m-0">
              <a class="no-decoration text-info" :href="'/@' + item.by">{{item.by}}</a>
              </h5>
            </div>
          </div>
          <div class="d-flex align-items-center my-2">
            <div class="text-end mt-auto mb-auto me-1" style="flex: 1">
              <h5 class="small m-0">PRICE:</h5>
            </div>
            <div class="text-start mt-auto mb-auto" style="flex: 2">
              <h5 class="lead m-0 text-break">{{formatNumber(item.price.amount/1000,item.price.precision,'.',',')}}
              {{item.price.token}}</h5>
            </div>
          </div>
        </section>     

            <!-- BUY -->
             <div class="btn-group" v-if="item.by != account">
             <button type="button" class="btn btn-primary" title="Buy NFT"
              @click="buyNFT()">
              Buy NFT</button>
             </div>
            <!-- CANCEL -->
             <div class="btn-group" v-if="item.by == account">
             <button type="button" class="btn btn-warning" title="Cancel Sale"
              @click="cancelNFT()">
             Cancel Sale</button>
             </div>
  </div>
</div>
<!-- INVENTORY  FOOT -->
<div class="card-footer border-0" v-if="inventory">
    <div class="d-flex text-center rounded-pill py-1"
        style="background-color: rgba(0,0,0,.5)">
        <div class="ms-auto me-auto">
      <!-- MINT ACTIONS -->
      <div class="btn-group" role="group" v-if="mint">
              <button type="button" class="btn btn-dark" title="Open Mint" 
              @click="openFT()"><i class="fas fa-box-open fa-fw"></i></button>
              <button type="button" class="btn ps-05 pe-05 border-0"
              disabled></button>
              <button type="button" class="btn btn-dark" title="Transfer Mint"
              data-bs-toggle="modal" data-bs-target="#transferModal" 
              @click="modal('transfer')">
              <i class="fas fa-exchange-alt fa-fw"></i></button>
            </div>
            <!-- NFT ACTIONS -->
            <div class="btn-group" role="group" v-if="!mint">
                <button type="button" class="btn btn-dark" title="Set pfp"><i
                        class="fa-regular fa-circle-user fa-fw"></i></button>
                <button type="button" class="btn ps-05 pe-05 border-0"
                    disabled></button>
                <button type="button" class="btn btn-dark" data-bs-toggle="modal"
                @click="modalIndex('transfer')" data-bs-target="#itemModal" title="NFT Actions">
                <i class="fas fa-exchange-alt fa-fw"></i></button>
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
            set: this.item.setname,
            uid: this.item.uid,
            price: this.item.price.amount,
          },
        id: `${this.item.token}_nft_reserve_complete`,
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
            set: this.item.setname,
            uid: this.item.uid,
          },
        id: `${this.item.token}_nft_transfer_cancel`,
        msg: `Canceling ${this.item.setname}:${this.item.uid} Transfer`,
        ops: ["getTokenUser"],
        api: "https://spktest.dlux.io",
        txid: `${this.item.setname}:${this.item.uid}_nft_transfer_cancel`
      });
    },
    openFT(){
      this.$emit('tosign', {
        type: 'cja',
        cj: {
            set: this.item.setname,
          },
        id: `${this.item.token}_nft_mint`,
        msg: `Canceling ${this.item.setname}:${this.item.uid}`,
        ops: ["getTokenUser"],
        api: "https://spktest.dlux.io",
        txid: `${this.item.setname}:${this.item.uid}_nft_cancel`
      });
    },
    modalIndex(name) {
      const object = {
        item: this.item,
        tab: name,
      }
      console.log(this.item)
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
  },
  mounted() {
  },
};