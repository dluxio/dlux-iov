export default {
  components: {
  },
  template: `<div class="card h-100 text-white border-0"
:style="{'background': colors}">
<div class="card-header border-0 d-flex align-items-center">

    <div class="rounded px-2 py-1" style="background: rgba(0,0,0,1)">
        <a :href="'/nfts/set/' + item.setname + '#' + item.token"
            class="no-decoration" style="font-size: 1.3em;"><span
                class="rainbow-text" style="background-image: linear-gradient(rgb(194, 255, 182), rgb(255, 163, 182), rgb(221, 169, 255), rgb(162, 209, 255));
            -webkit-background-clip: text;
        -webkit-text-fill-color: transparent; 
        -moz-background-clip: text;
        -moz-text-fill-color: transparent;;"><i class="me-1"
                    :class="[icon]"></i><b>{{item.setname}}</b></span></a>
    </div>
    <div class="rounded-pill d-flex align-items-center p-1 ms-auto"
        style="background: black">
        <h2 class="m-0 px-1">{{item.uid}}</h2>
    </div>

</div>
<div class="card-body p-0" style="background: rgba(0,0,0,.75)">

    <div class="">
        <a href="#itemModal" class="a-1" data-bs-toggle="modal"
            @click="modalIndex()">
            <div class="card-img-top"
                :alt="'image-' +  item.setname + '-' + item.uid"
                v-html="item.HTML">
            </div>
        </a>
    </div>
    <div class="text-center">
        <h3 class="my-1"
            :style="{'background-image': colors}"
            style="-webkit-background-clip: text;
                   -webkit-text-fill-color: transparent; 
                   -moz-background-clip: text;
                   -moz-text-fill-color: transparent;">
            #{{uid}}</h3>
    </div>
    <div class="text-center lead mb-1"><small><span
                class="badge bg-dark text-muted">{{item.token}}<i
                    class="fa-solid fa-link mx-2 text-info"></i>network</span></small>
    </div>
</div>
<div class="card-footer border-0">

    <div class="d-flex text-center rounded-pill py-1"
        style="background-color: rgba(0,0,0,.5)">
        <div class="ms-auto me-auto">
            <div class="btn-group" role="group">
                <button type="button" class="btn btn-dark" title="Set pfp"><i
                        class="fa-regular fa-circle-user"></i></button>
                <button type="button" class="btn ps-05 pe-05 border-0"
                    disabled></button>
                <button type="button" class="btn btn-dark" data-bs-toggle="modal"
                @click="modalIndex()" data-bs-target="#itemModal" title="Actions">
                <i class="fas fa-exchange-alt"></i></button>
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
    colors: {
      default: 'linear-gradient(chartreuse,lawngreen)'
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
  emits: ['detail'],
  data() {
    return {
      
    };
  },
  methods: {
    modalIndex() {
      this.$emit('detail', this.item.setname + ':' + this.item.uid);
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