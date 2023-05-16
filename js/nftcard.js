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
<div class="card-body d-flex flex-column px-1 rounded" style="background: rgba(0,0,0,.75)">
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
            <span v-if="mint">sealed NFT</h3>
    </div>
    <div class="text-center lead"><small><span
                class="badge bg-dark text-muted">{{item.token}}<i
                    class="fa-solid fa-link mx-2 text-info"></i>network</span></small>
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
            @click="acceptNFT(item)"><i class="fa-solid fa-check fa-fw"></i></button>
            <button type="button" class="btn ps-05 pe-05 border-0"
                   disabled></button>
              <button type="button" class="btn btn-danger" title="Decline Trade"
              @click="rejectMFT(item)"><i class="fa-solid fa-xmark fa-fw"></i></button>
           </div>
             <!-- CANCEL -->
             <div class="btn-group" v-if="item.from == account">
             <button type="button" class="btn btn-warning" title="Cancel Trade"
              @click="cancelNFT(item)">
              <i class="fa-solid fa-xmark fa-fw"></i></button>
             </div>
        </div>
      </div>

<!-- FOOT -->
<div class="card-footer border-0" v-if="!trade">
    <div class="d-flex text-center rounded-pill py-1"
        style="background-color: rgba(0,0,0,.5)">
        <div class="ms-auto me-auto">
      <!-- MINT ACTIONS -->
      <div class="btn-group" role="group" v-if="mint">
              <button type="button" class="btn btn-dark" title="Open Mint" 
              @click="openFT(item)"><i class="fas fa-box-open fa-fw"></i></button>
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
</div>`,
  // @click="modalIndex('itemModal', item.setname + ':' + item.uid );itemModal.hidden = false"
  // set PFP
  props: {
    item: {
      required: true,
      default: function () {
        return {
          script: '',
        };
      },
    },
    icon: {
      default: ''
    },
    index: {
      default: 0
    },
    colors: {
      default: 'linear-gradient(chartreuse,lawngreen)'
    },
    wrapped: {
      default: ''
    },
    uid: {
      default: ''
    },
    trade: {
      default: false
    },
    mint: {
      default: false
    },
    account: {
      default: ''
    },
  },
  emits: ['detail', 'modal'],
  data() {
    return {
      
    };
  },
  methods: {
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