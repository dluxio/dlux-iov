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
  template: `<div :id="'comment-' + post.permlink" class="reply-container" :style="getReplyStyles()">
<a role="button" v-if="warn" @click="warn = false" class="text-warning">
  <i class="fa-solid fa-eye-slash me-1"></i>Hidden due to low reputation. Click to show.
</a>
<div v-if="!warn" class="position-relative">
<div class="d-flex align-items-start">
<a :href="'/@' + post.author" class="no-decoration flex-shrink-0">
<img :src="'https://images.hive.blog/u/' + post.author + '/avatar'" 
     class="rounded-circle border-2 border-light bg-light img-fluid me-2 cover author-img" 
     :style="getAvatarSize()"></a>
<div class="d-flex flex-column w-100">
<div class="d-flex align-items-center flex-wrap">
<a :href="'/@' + post.author" class="no-decoration">
<span class="d-flex align-items-center">
<h6 class="m-0 text-white-50 me-1">{{ post.author }}</h6>
<span class="badge small text-white-50" :class="getReputationClass()">{{ replyRep }}</span></span></a>
<span class="mx-1 text-muted">•</span>
<vue-ratings v-if="post.rating" class="d-flex me-1" :stars="post.rating"/>
<span class="small text-muted" style="font-weight: 400">{{ post.ago || timeSince(post.created) }}</span>
<div class="ms-auto d-flex align-items-center">
  <small v-if="post.depth && post.depth > 6" class="badge bg-warning me-2" title="Very deep reply thread">
    <i class="fa-solid fa-layer-group me-1"></i>{{ post.depth }}
  </small>
  <small v-else-if="post.depth > 1" class="text-muted me-2">{{ post.depth }}</small>
  <a role="button" class="no-decoration text-white-50" @click="view = !view">
    <i v-show="view" class="fa-solid fa-circle-minus fa-fw"></i>
    <i v-show="!view" class="fa-solid fa-circle-plus fa-fw"></i>
  </a>
</div>
</div>
<div class="my-2" v-if="view" v-show="!edit">
<vue-markdown :md="post.body"/>
</div>
<div v-show="edit" class="my-2">
<vue-markdown :toedit="post.body" @settext="pending($event)"/>
</div>
<div class="card-footer p-0 mb-2" v-if="view">
<vote :post="post" :account="account" :voteval="voteval" @vote="vote($event)" @reply="reply($event)" @tosign="sendIt($event)"></vote>
</div>
<div v-if="!view" class="collapsed-info">
<span class="text-muted">{{ getCollapsedText() }}</span>
<a role="button" class="text-info no-decoration ms-1" @click="view = !view">Click to expand</a>
</div>
</div>                 
</div>
<div v-if="post.replies && post.replies.length > 0 && view" class="nested-replies" :style="getNestedRepliesStyles()">
<replies v-for="childReply in post.replies" 
        :key="childReply.author + '-' + childReply.permlink"
        :post="childReply" 
        :account="account" 
        :voteval="voteval" 
        @vote="vote($event)" 
        @reply="reply($event)"
        @tosign="sendIt($event)"/>
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
  emits: ['vote', 'reply', 'tosign'],
  methods: {
    ...MCommon,
    async getReplyAuthorReputation() {
      if (this.post.author && !this.replyAuthorInfo) {
        try {
          const response = await fetch("https://api.hive.blog", {
            body: JSON.stringify({
              "jsonrpc": "2.0", 
              "method": "bridge.get_profile", 
              "params": {"account": this.post.author, "observer": this.account}, 
              "id": 1
            }),
            headers: {
              "Content-Type": "application/json",
            },
            method: "POST",
          });
          const data = await response.json();
          if (data.result) {
            this.replyAuthorInfo = data.result;
            this.updateReplyReputation();
          }
        } catch (error) {
          console.error('Error fetching reply author reputation:', error);
          if (this.post.author_reputation) {
            // Only calculate if it's a raw reputation value (very large number from condenser API)
            this.replyRep = this.post.author_reputation > 1000000 ? 
              this.calculateReputation(this.post.author_reputation) : this.post.author_reputation;
          }
        }
      }
    },
    updateReplyReputation() {
      if (this.post.author_reputation) {
        // Only calculate if it's a raw reputation value (very large number from condenser API)
        this.replyRep = this.post.author_reputation > 1000000 ? 
          this.calculateReputation(this.post.author_reputation) : this.post.author_reputation;
      } else if (this.replyAuthorInfo && this.replyAuthorInfo.reputation) {
        // Bridge API returns already calculated reputation, use directly
        this.replyRep = this.replyAuthorInfo.reputation;
      } else if (this.post.rep && this.post.rep !== "...") {
        this.replyRep = this.post.rep;
      }
    },
    pending(event) {
      this.mde = event
    },
    vote(event) {
      // Create vote signing operation using the same logic as v3-user.js
      const voteOp = {
        type: "vote",
        cj: {
          author: event.url.split("/@")[1].split("/")[0],
          permlink: event.url.split("/@")[1].split("/")[1],
          weight: event.slider * (event.flag ? -1 : 1),
        },
        msg: `Voting ...`,
        ops: [""],
        txid: "vote",
      };
      
      console.log('Vote operation created:', voteOp);
      console.log('Original vote event:', event);
      
      // Send through signing system
      this.sendIt(voteOp);
      
      // Also emit the original vote event for any other handlers
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
    sendIt(op) {
      this.$emit('tosign', op);
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
    },
    getReplyStyles() {
      const depth = this.post.depth || 1;
      
      // Rainbow colors from violet to red (6 steps)
      const rainbowColors = [
        '#21FFB5',
        '#033EFD',
        '#FB00FF',
        '#FF216B',
        '#FDC203',
        '#04FF00' 
      ];
      
      if (depth <= 1) {
        return {
          'margin-bottom': '1rem',
          'padding-left': '0px'
        };
      }
      
      // Get the color for this specific depth
      const colorIndex = (depth - 2) % rainbowColors.length;
      const color = rainbowColors[colorIndex];
      
      return {
        'margin-bottom': '1rem',
        'padding-left': '8px', // Small padding for content from the border
        'border-left': `2px solid ${color}`,
        'margin-left': '0px'
      };
    },
    getNestedRepliesStyles() {
      // Position nested replies to align with the parent's vertical line
      return {
        'margin-left': '-6px', // Negative margin to pull replies back to align with parent's border
        'margin-top': '0.5rem'
      };
    },
    getAvatarSize() {
      const depth = this.post.depth || 1;
      const baseSize = depth > 3 ? 28 : depth > 1 ? 36 : 44;
      
      return {
        'width': `${baseSize}px`,
        'height': `${baseSize}px`,
        'min-width': `${baseSize}px`
      };
    },
    getReputationClass() {
      const rep = parseFloat(this.replyRep);
      if (isNaN(rep)) return 'bg-secondary';
      
      if (rep < 25) return 'rep-danger bg-danger';
      if (rep >= 25 && rep < 50) return 'rep-warning bg-warning text-dark';
      return 'rep-success bg-success';
    },
    getCollapsedText() {
      const childCount = this.post.replies ? this.post.replies.length : this.post.children || 0;
      const totalComments = childCount + 1;
      
      if (totalComments === 1) {
        return 'Comment collapsed.';
      } else {
        return `${totalComments} comment${totalComments > 1 ? 's' : ''} collapsed.`;
      }
    },
    calculateReputation(raw_reputation) {
      if (!raw_reputation) return 25;
      
      const reputation = parseInt(raw_reputation);
      if (reputation === 0) return 25;
      
      let score = Math.log10(Math.abs(reputation));
      score = Math.max(score - 9, 0);
      score = (reputation > 0 ? 1 : -1) * score;
      score = (score * 9) + 25;
      
      return Math.floor(score);
    },
  },
  watch: {
    post: {
      handler() {
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
    // Initialize reputation display
    if (this.post.rep && this.post.rep !== "...") {
      this.replyRep = this.post.rep;
    } else if (this.post.author_reputation) {
      // Only calculate if it's a raw reputation value (very large number from condenser API)
      this.replyRep = this.post.author_reputation > 1000000 ? 
        this.calculateReputation(this.post.author_reputation) : this.post.author_reputation;
    } else {
      this.getReplyAuthorReputation();
    }
    
    // Hide low reputation comments
    this.hideLowRep();
    
    // Set initial view state based on depth (auto-collapse deep replies)
    if (this.post.depth && this.post.depth > 3) {
      this.view = false;
    }
    
    console.log('Reply mounted:', {
      author: this.post.author,
      permlink: this.post.permlink,
      depth: this.post.depth,
      children: this.post.children,
      replies: this.post.replies ? this.post.replies.length : 0,
      reputation: this.replyRep
    });
  },
};

