export default {
    components: {
    },
    template: `<div class="card h-100 text-white border-0"
:style="{'background': getSetDetailsColors(item.script)}">
<div class="card-header border-0 d-flex align-items-center">

    <div class="rounded mb-0 px-3 py-1" style="background: rgba(0,0,0,1)">
        <a :href="'/nfts/set/' + item.setname + addToken(item.token)"
            class="no-decoration" style="font-size: 1.3em;"><span
                class="rainbow-text" style="background-image: linear-gradient(rgb(194, 255, 182), rgb(255, 163, 182), rgb(221, 169, 255), rgb(162, 209, 255));
            -webkit-background-clip: text;
        -webkit-text-fill-color: transparent; 
        -moz-background-clip: text;
        -moz-text-fill-color: transparent;;"><i class="me-2"
                    :class="[getIcon(item.script)]"></i><b>{{item.setname}}</b></span></a>
    </div>
    <div class="rounded-pill d-flex align-items-center p-2 ms-auto"
        style="background: black">
        <h2 class="m-0 px-2">{{item.uid}}</h2>
    </div>

</div>
<div class="card-body mx-1 p-0 rounded" style="background: rgba(0,0,0,.75)">

    <div class="my-3 mx-2">
        <a href="#itemModal" class="a-1" data-bs-toggle="modal"
            @click="modalIndex()">
            <div class="card-img-top"
                :alt="'image-' +  item.setname + '-' + item.uid"
                v-html="item.HTML">
            </div>
        </a>
    </div>
    <div class="text-center my-2 me-2">
        <h3 class="my-0 mx-2 p-0 p-2 ms-auto"
            :style="{'background-image': getSetDetailsColors(item.script)}"
            style="-webkit-background-clip: text;
                   -webkit-text-fill-color: transparent; 
                   -moz-background-clip: text;
                   -moz-text-fill-color: transparent;">
            #{{Base64toNumber(item.uid)}}</h3>
    </div>
    <div class="mt-1 mb-2 text-center lead"><small><span
                class="badge bg-dark text-muted">{{item.token}}<i
                    class="fa-solid fa-link mx-2 text-info"></i>network</span></small>
    </div>
</div>
<div class="card-footer border-0">

    <div class="d-flex flex-wrap text-center rounded-pill p-3"
        style="background-color: rgba(0,0,0,.5)">
        <div class="ms-auto me-auto">
            <div class="btn-group">
                <button type="button" class="btn btn-dark" @click=""><i
                        class="fa-regular fa-circle-user me-2"></i>Set
                    pfp</button>
                <button type="button" class="btn ps-1 pe-1 border-0"
                    disabled></button>
                <a href="#itemModal" class="a-1" data-bs-toggle="modal"
                    @click="modalIndex()"><button
                        type="button" class="btn btn-dark"><i
                            class="fas fa-exchange-alt me-2"></i>Actions</button></a>
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
    account: {
        default: ''
    },
},
emits: ['detail'],
data() {
return {
    collapse: false,
    edit: false,
    view: true,
    mde: '',
    makeReply: false,
    makeVote: false,
    warn: false,
};
},
methods:{
    modalIndex(){
        this.$emit('detail', this.item.setname + ':' + this.item.uid);
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
      getIcon(s) {
        return this.baseScript[s] ? this.baseScript[s].set.faicon : "";
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
            if (parseFloat(parts[i])>0){
              maybe += parseFloat(parts[i])
            }
          }
          if (maybe>parseFloat(t)){
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
          for (var c = /(\d+)(\d{3})/; c.test(i); )
            i = i.replace(c, "$1" + e + "$2");
        return (u ? "-" : "") + i + o;
      },
      gt(a,b){
      return parseFloat(a)>parseFloat(b);
    },
},
mounted() {
},
};