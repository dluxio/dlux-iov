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
      <a href="#!" v-if="warn" @click="warn = false">Hidden due to low reputation.</a>
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
                 <small class="text-muted"
                    id="modal_created">{{timeSince(post.created)}}</small>
              </span>
           </div>
        </div>
        <div class="card-body" v-show="!edit">
           <vue-markdown :md="post.body"/>
        </div>
        <div v-show="edit">
           <vue-markdown :toedit="post.body" @settext="pending($event)"/>
        </div>
        <div v-show="makeReply">
        <mde @data="mde = $event" />
        <button @click="makeReply = !makeReply">Cancel</button>
        <button @click="reply()">Reply</button>
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
                                                        <button @click="makeReply = !makeReply">{{makeReply ? 'Cancel' : 'Reply'}}</button>
                                                    </pop-vue>
        </div>
        <div v-for="reps in post.replies">
            <replies :post="reps" :account="account" :voteval="voteval" @vote="vote($event)" @reply="reply($event)"/>
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
        mde: '',
        makeReply: false,
        warn: false,
    };
    },
    emits: ['vote', 'reply'],
    methods:{
        pending(event){
            this.mde = event
        },
        vote(event){
            this.$emit('vote', event);
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
        setReply(event){
            this.mde = event
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
        hideLowRep(){
            if(this.post.rep != '...'){
                if(parseFloat(this.post.rep) < 25){
                    this.view = false;
                    this.warn = true;
                }
            } else {
                setTimeout(this.hideLowRep, 1000)
            }
        },
        setRating(rating){
            this.post.rating = rating;
          }
    },
  mounted() {
    this.hideLowRep()
  },
};

