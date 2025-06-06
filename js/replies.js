import Marker from "/js/marker.js";
import Ratings from "/js/ratings.js";
import MDE from "/js/mde.js";
import Vote from "/js/vote.js";
import Pop from "/js/pop.js";
import MCommon from "/js/methods-common.js";

export default {
  name: "replies",
  components: {
    "vue-markdown": Marker,
    "vue-ratings": Ratings,
    "mde": MDE,
    "vote": Vote,
    "pop-vue": Pop
  },
  template: `<div :id="'comment-' + post.permlink">
<a role="button" v-if="warn" @click="warn = false">Hidden due to low reputation.</a>
<div class="d-flex align-items-start">
<a :href="'/@' + post.author" class="no-decoration">
<img :src="'https://images.hive.blog/u/' + post.author + '/avatar'" class="rounded-circle border-2 border-light bg-light img-fluid me-1 cover author-img" :class="{'w-32p': post.depth > 1, 'w-40p': post.depth = 1}"></a>
<div class="d-flex flex-column w-100">
<div class="d-flex align-items-center">
<a :href="'/@' + post.author" class="no-decoration">
<span class="d-flex align-items-center">
<h5 class="m-0 text-white-50">{{ post.author }}</h5>
<span class="ms-1 badge small text-white-50" :class="{'rep-danger': replyRep < 25, 'rep-warning': replyRep >= 25 && replyRep < 50, 'rep-success': replyRep >= 50}">{{ replyRep }}</span></span></a>
<span class="ms-1 text-muted">•</span>
<vue-ratings v-if="post.rating" class="d-flex" :stars="post.rating"/>
<span class="ms-1 small text-muted" style="font-weight: 400">{{ timeSince(post.created) }}</span>
<a role="button" class="ms-auto no-decoration text-white-50" @click="view = !view"><i v-show="view" class="fa-solid fa-circle-minus fa-fw"></i><i v-show="!view" class="fa-solid fa-circle-plus fa-fw"></i></a>
</div>
<div class="my-1" v-if="view" v-show="!edit">
<vue-markdown :md="post.body"/>
</div>
<div v-show="edit">
<vue-markdown :toedit="post.body" @settext="pending($event)"/>
</div>
<div class="card-footer p-0" v-if="view">
<vote :post="post" :account="account" :voteval="voteval" @vote="vote($event)" @reply="reply($event)"></vote>
</div>
<div v-if="!view">{{post.children + 1}} comment<span v-if="post.children > 0">s</span> collapsed. <a role="button" class="text-info no-decoration" @click="view = !view">Click to expand</a>
</div>
<div v-for="reps in post.replies">
<replies v-if="view" :post="reps" :account="account" :voteval="voteval" @vote="vote($event)" @reply="reply($event)"/>
</div>
</div>                 
</div>
</div>`,
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
      postCustom_json: {},
      makeReply: false,
      makeVote: false,
      warn: false,
      replyRep: "...",
      replyAuthorInfo: null,
    };
  },
  emits: ['vote', 'reply'],
  methods: {
    ...MCommon,
    async getReplyAuthorReputation() {
      if (this.post.author && !this.replyAuthorInfo) {
        try {
          const response = await fetch("https://hive-api.dlux.io", {
            body: JSON.stringify({
              "jsonrpc": "2.0", 
              "method": "condenser_api.get_accounts", 
              "params": [[this.post.author]], 
              "id": 1
            }),
            headers: {
              "Content-Type": "application/json",
            },
            method: "POST",
          });
          const data = await response.json();
          if (data.result && data.result.length > 0) {
            this.replyAuthorInfo = data.result[0];
            this.updateReplyReputation();
          }
        } catch (error) {
          console.error('Error fetching reply author reputation:', error);
          if (this.post.author_reputation) {
            this.replyRep = this.post.author_reputation
          }
        }
      }
    },
    updateReplyReputation() {
      if (this.post.author_reputation) {
        this.replyRep = this.post.author_reputation
      } else if (this.replyAuthorInfo && this.replyAuthorInfo.reputation) {
        this.replyRep = this.replyAuthorInfo.reputation
      } else if (this.post.rep && this.post.rep !== "...") {
        this.replyRep = this.post.rep;
      }
    },
    pending(event) {
      this.mde = event
    },
    vote(event) {
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
    setReply(event) {
      this.mde = event
    },
    reply(deets) {
      var json_metadata = JSON.stringify(this.postCustom_json)
      console.log(json_metadata)
      if (!json_metadata) json_metadata = JSON.stringify({})
      if (!deets) deets = {
        "parent_author": this.post.author,
        "parent_permlink": this.post.permlink,
        "author": this.account,
        "permlink": 're-' + this.post.permlink,
        "title": '',
        "body": this.mde,
        json_metadata
      }
      this.$emit('reply', deets)
    },
    formatNumber(t, n, r, e) {
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
    hideLowRep() {
      if (this.replyRep !== '...') {
        if (parseFloat(this.replyRep) < 25) {
          this.view = false;
          this.warn = true;
        }
      } else {
        setTimeout(this.hideLowRep, 1000)
      }
    },
    setRating(rating) {
      this.post.rating = rating;
    }
  },
  watch: {
    post: {
      handler() {
        this.updateReplyReputation();
        this.hideLowRep();
        try {
          if (this.post?.replies?.length != 0) this.first_replier_permlink = this.post.replies[0].permlink
        } catch (e) { }
      },
      deep: true,
      immediate: true
    }
  },
  mounted() {
    this.updateReplyReputation();
    this.getReplyAuthorReputation();
    this.hideLowRep();
  },
};

