export default {
    name: "vote",
  template: `
  <div>
  <button v-if="!show" type="button" class="btn me-2"
              :class="{'btn-success': true}"
              @click="show = true; flag = false" style="width: 100px;">Vote</button>
    <button v-if="!show" type="button" class="btn me-2"
              :class="{'btn-danger': true}"
              @click="show = true; flag = true" style="width: 100px;">Flag</button>
  <form v-if="show">
      <div class="p-2 d-flex align-items-center text-white-50">

          <button type="button" class="btn me-2"
              :class="{'btn-success': !flag, ' btn-danger': flag}"
              @click="vote(post.url)" style="width: 100px;">{{flag ? '-'
              :
              ''}}{{slider / 100}}%</button>

          <button type="button" class="btn btn-secondary me-2"
              @click="show = false"><span
                  class="close text-white">×</span></button>

          <div class="d-flex align-items-center px-3 border rounded"
              style="height: 38px;"
              :class="{'border-success': !flag, 'border-danger': flag}">
              <input type="range" class="form-range mx-auto p-0" step="1"
                  max="10000" v-model="slider">
          </div>

          <div class="ms-auto">
              <p class="me-1 my-0"
                  :class="{'text-success': !flag, 'text-danger': flag}">
                  {{formatNumber(voteval *
                  slider/10000,3, '.', ',')}}
                  <i class="me-1 fab fa-fw fa-hive"></i>
              </p>
          </div>
      </div>
  </form>
</div>
        `,
    props: {
        post: {
        required: true,
        default: function () {
            return {
            
            };
        },
        },
        account: {
            default: ''
        },
        voteval: 0,
    },
    data() {
    return {
        slider: 10000,
        flag: false,
        show: false,
    };
    },
    emits: ['vote'],
    methods:{
        vote(url){
            this.$emit('vote', {url:`/@${this.post.author}/${this.post.permlink}`, slider: this.slider, flag:this.flag})
            console.log(this.post)
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
          }
    },
  mounted() {
  },
};

