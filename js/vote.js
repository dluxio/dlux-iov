import Marker from "/js/marker.js";
import Ratings from "/js/ratings.js";
import MDE from "/js/mde.js";
import Pop from "/js/pop.js";

export default {
    components: {
        "vue-markdown": Marker,
        "vue-ratings": Ratings,
        "mde": MDE,
        "pop-vue": Pop,
      },
  template: `
  <!-- vote  -->
              <div v-show="makeVote">
                  <form id="voteForm">
                      <div class="d-flex mt-1 align-items-center text-white-50">

                          <button type="button" class="btn btn-sm me-1"
                              :class="{'btn-success': !flag, ' btn-danger': flag}"
                              @click="vote(post.url)" style="min-width: 85px;"><span v-if="!flag"><i class="fas fa-heart fa-fw me-1"></i></span><span v-if="flag"><i class="fa-solid fa-flag me-1"></i></span>{{flag ? '-' :
                              ''}}{{formatNumber(slider / 100, 0,'.',',')}}%</button>

                          <button type="button" class="btn btn-sm btn-secondary px-1 me-1" @click="makeVote = !makeVote">
                            <i class="fa-solid fa-xmark fa-fw"></i></button>

                              <input type="range" class="form-range mx-2" step="1"
                                  max="10000" v-model="slider">

                              <span style="min-width: 100px" class="text-end text-nowrap" id="commentVal"
                                  :class="{'text-success': !flag, 'text-danger': flag}">
                                  {{toFixed(voteval *
                                  slider/10000,3)}}
                                  <i class="fab fa-fw fa-hive"></i>
                              </span>
                      </div>
                  </form>
              </div>
              <div class="mb-3">
  <!-- reply  -->
  <div v-show="makeReply">
            <mde @data="mde = $event" />
            <div class="d-flex">
              <button class="btn btn-sm px-2 btn-secondary ms-auto" @click="makeReply = !makeReply"><i class="fa-solid fa-xmark fa-fw me-1"></i>Cancel</button>
              <button class="btn btn-sm px-2 btn-primary ms-1" @click="reply()"><i class="fa-solid fa-comment fa-fw me-1"></i>Reply</button>
            </div>
          </div>
<!-- footer buttons -->
    <div v-if="!makeReply && !makeVote" class="d-flex mt-1">
            <div class="d-flex align-items-center">
            <a @click="makeVote = !makeVote" role="button" class="no-decoration" @click="flag = false"
            :class="{'text-primary': post.hasVoted, 'text-white-50': !post.hasVoted, 'text-danger': slider < 0 }">
            <i class="fas fa-heart fa-fw me-1"></i><span
            class="text-white-50">{{post.upVotes}}</span>
            </a>
            <a @click="makeVote = !makeVote" role="button" class="ms-2 no-decoration text-white-50"
         :class="{'text-primary': flag > 0}"
         @click="flag = true" >
          <i class="fa-solid fa-flag me-1"></i><span
         class="text-white-50">{{post.downVotes ? post.downVotes : ''}}</span>
          </a>
      <button class="btn px-2 btn-sm btn-light ms-2" @click="makeReply = !makeReply">Reply</button>
  
            <pop-vue class="ms-1" :id="'pop-' + post.author + '-' + post.permlink"
                        title="Post Earnings"
                        :content="(gt(post.total_payout_value, post.pending_payout_value) ? formatNumber(post.total_payout_value + ' ' + post.curator_payout_value, 3, '.',',') + ' HBD' : post.pending_payout_value ? post.pending_payout_value : '')"
                        trigger="hover">
              <button class="btn px-2 btn-sm btn-secondary">
                  {{gt(post.total_payout_value, post.pending_payout_value) ?
                  formatNumber(post.total_payout_value + ' ' +
                  post.curator_payout_value, 3, '.',',') :
                  formatNumber(post.pending_payout_value, 3, '.',',')}} HBD
              </button>
              </pop-vue>
          </div>
        </div>
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
        warn: false,
        makeReply: false,
        makeVote: false,
        mde: '',
    };
    },
    emits: ['vote', 'reply'],
    methods:{
      pending(event){
        this.mde = event
        },
        setReply(event){
          this.mde = event
      },
      toFixed(num, fixed) {
        return parseFloat(num).toFixed(fixed)
      },
      reply(deets){
        if(!deets)deets = {
            "parent_author": this.post.author,
            "parent_permlink": this.post.permlink,
            "author": this.account,
            "permlink": 're-' + this.post.permlink,
            "title": '',
            "body": this.mde,
            "json_metadata": JSON.stringify(this.postCustom_json)
        }
        this.$emit('reply', deets)
    },
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
          },
          gt(a,b){
            return parseFloat(a)>parseFloat(b);
          },
    },
  mounted() {
  },
};

