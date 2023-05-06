import Marker from "/js/marker.js";
import Ratings from "/js/ratings.js";
import MDE from "/js/mde.js";
import Vote from "/js/vote.js";
import Pop from "/js/pop.js";

export default {
    name: "replies",
    components: {
        "vue-markdown": Marker,
        "vue-ratings": Ratings,
        "mde": MDE,
        "vote": Vote,
        "pop-vue": Pop,
      },
  template: `
  <div>
      <button role="button" @click="view = !view">{{view ? 'Hide' : 'Show'}}</button>
     <div v-if="view" class="rounded p-3 border border-info">
        <div>
           <div>
              <div>
                 <a :href="'/@' + post.author"><img
                    :src="'https://images.hive.blog/u/' + post.author + '/avatar'"
                    class="rounded-circle bg-light img-fluid mr-2 cover author-img"></a><h5>@{{post.author}}</h5>
              </div>
              <div>
                 <p class="mt-0 mb-0 text-muted text-semibold"><a class="a-1"
                    id="modal_author"><span
                    class="ml-2 badge badge-pill badge-light">{{post.rep}}</span></a>
                 </p>
              </div>
              <span>
                 
                 <a href="#/"
                    v-show="post.author == account"
                    @click="edit = !edit">Edit Post</a>
                 <div v-show="!edit">
                    <vue-ratings class="d-flex"
                       :stars="post?.json_metadata?.review?.rating">
                    </vue-ratings>
                 </div>
                 <div v-show="edit">
                    <vue-ratings class="d-flex" vote="true"
                       @rating="setRating(post.url, $event)">
                    </vue-ratings>
                 </div>
                 <small class="text-muted"
                    id="modal_created">{{post.ago}}</small>
              </span>
           </div>
        </div>
        <div class="card-body" v-show="!edit">
           <vue-markdown :md="post.body">
           </vue-markdown>
        </div>
        <div class="card-body" v-show="edit">
           <vue-markdown :toedit="post.body" @settext="pending(post.url, $event)">
           </vue-markdown>
        </div>
        <div class="card-footer">
              <vote :post="post" :account="account" :voteval="voteval" @vote="vote($event)"></vote>
              <pop-vue :id="'pop-' + post.author + '-' + post.permlink"
                                                        title="Post Earnings"
                                                        :content="(gt(post.total_payout_value, post.pending_payout_value) ? formatNumber(post.total_payout_value + ' ' + post.curator_payout_value, 3, '.',',') + ' HBD' : post.pending_payout_value ? post.pending_payout_value : '')"
                                                        trigger="hover">
                                                        <button class="btn btn-secondary">
                                                            {{gt(post.total_payout_value, post.pending_payout_value) ?
                                                            formatNumber(post.total_payout_value + ' ' +
                                                            post.curator_payout_value, 3, '.',',') :
                                                            formatNumber(post.pending_payout_value, 3, '.',',')}} HBD
                                                        </button>
                                                    </pop-vue>
        </div>
        <div v-for="reply in post.replies">
            <replies :post="reply" :account="account" :voteval="voteval" @vote="vote($event)"></replies>
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
        collapse: false,
        edit: false,
        view: true,
    };
    },
    emits: ['vote'],
    methods:{
        vote(event){
            this.$emit('vote', event);
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
        setRating(rating){
            this.post.rating = rating;
          }
    },
  mounted() {
  },
};

