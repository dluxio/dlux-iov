import Tagify from "/js/tagifyvue.js";
import Bennies from "/js/bennies.js";
import commonMethods from "/js/methods-common.js";

export default {
  template: `
    <!-- post builder -->
    <div class="accordion-body">
    <form onsubmit="return false;">
        <div class="d-none form-group mb-3">
            <label class="mb-1" for="username">Author</label>
            <div class="position-relative text-white-50">
                <span class="position-absolute top-50 translate-middle-y ps-2">
                  <i class="fa-solid fa-at fa-fw"></i>
                </span>
                <input type="text"
                    class="ps-4 form-control bg-dark border-dark text-white-50"
                    readonly v-model="account">
            </div>
        </div>
        <div class="form-group mb-3">
            <label class="mb-1" for="title">Post Title</label>
            <input type="text"
                class="form-control bg-dark border-dark text-white"
                placeholder="Enter an attention grabbing title" v-model="postTitle"
                @blur="permlink()">
            <small class="form-text text-muted d-flex"><span
                    class="ms-auto">Permlink:
                    https://dlux.io/{{postCustom_json.vrHash ? 'dlux' : postTags.length ? postTags[0] : 'blog'}}/@{{account}}/{{postPermlink}}</span>
                <!-- <a href="#" class="ml-auto"> Edit Permlink</a> -->
            </small>
        </div>
        <div class="form-group mb-3">
            <label class="mb-1" for="body">Post Body</label>
            <textarea 
                v-model="postBody"
                placeholder="Write your post content..."
                class="form-control"
                rows="8"></textarea>
        </div>
        <div class="form-group mb-3">
            <label class="mb-1" for="tags">Tags</label><br>
            <tagify class="rounded p-1 w-100" @data="postTags = $event" style="height: 50px" />
        </div>
        <div class="mb-2">
          <bennies :list="postBens" @updatebennies="postBens = $event" />
        </div>
        <button v-for="item in isntBenned" type="button"
            @click="addBen(item.account, item.weight)">Include Contract
            {{item.contract}}</button>
        <div class="d-flex align-items-center flex-wrap bg-dark rounded mt-3 p-3">
          <p class="mb-0 lead">
            Publish your blog post to the blockchain 
          </p>
            <button ref="publishButton" type="button" @keyUp="buildTags()"
                class="ms-auto btn btn-primary" data-toggle="tooltip" data-placement="top"
                title="Publish to HIVE" :disable="!validPost"
                @click="post()"><i class="fa-solid fa-fw fa-flag-checkered me-2"></i>Publish</button>
        </div>
    </form>
</div>
   `,
  props: {
    account: {
      type: String,
      required: true,
      default: ""
    },
    prop_bens: {
      type: Array,
      required: false,
      default: function () {
        return []
      },
    },
    prop_links: {
      type: String,
      required: false,
      default: ""
    },
    prop_contracts: {
      type: Array,
      required: false,
      default: function () {
        return []
      },
    },
    parent_author: {
      type: String,
      required: false,
      default: ""
    },
    parent_permlink: {
      type: String,
      required: false,
      default: ""
    },
    prop_json: {
      type: Object,
      required: false,
      default: function () {
        return {}
      },
    },
    prop_insert: {
      type: Object,
      required: false,
      default: function () {
        return {}
      },
    },
    prop_uid: {
      type: String,
      required: false,
      default: ""
    },
    file_to_add: {
      type: Object,
      required: false,
      default: null
    },
    // Collaborative editing props
    isCollaborativeMode: {
      type: Boolean,
      required: false,
      default: false
    },
    collaborativeDocument: {
      type: String,
      required: false,
      default: ""
    },
    collaborationAuthHeaders: {
      type: Object,
      required: false,
      default: () => ({})
    }
  },
  data() {
    return {
      postBens: [],
      postTitle: "",
      postPermlink: "",
      postBody: "",
      postTags: "",
      insert: "",
      postCustom_json: {
        "app": "dlux/0.1",
        "vrHash": "",
        "assets": [],
        tags: []
      }
    };
  },
  emits: ['tosign', 'passdata', 'requestCollaboration'],
  methods: {
    ...commonMethods, // Include common methods for auth handling

    buildTags() {
      this.postTags = this.postTags.replace(/#/g, "");
    },
    post() {
      for (var i = 0; i < this.postCustom_json.assets.length; i++) {
        delete this.postCustom_json.assets[i].config
        if (!this.postCustom_json.assets[i].f) delete this.postCustom_json.assets[i].f
      }
      if (this.postCustom_json.vrHash) {
        this.postCustom_json.tags = ['dlux']
        for (var i = 0; i < this.postTags.length; i++) {
          if (this.postTags[i] != 'dlux') {
            this.postCustom_json.tags.push(this.postTags[i]);
          }
        }
      } else {
        this.postCustom_json.tags = []
        for (var i = 0; i < this.postTags.length; i++) {
          this.postCustom_json.tags.push(this.postTags[i]);
        }
      }
      if (this.postCustom_json.tags.length == 0) {
        this.postCustom_json.tags = ['blog']
      }
      if (this.account && this.postPermlink && this.postTitle && this.postBody) {
        const operations = [["comment",
          {
            "parent_author": this.parent_author,
            "parent_permlink": this.parent_permlink || this.postCustom_json.tags[0],
            "author": this.account,
            "permlink": this.postPermlink,
            "title": this.postTitle,
            "body": this.postBody + (this.postCustom_json.vrHash ? `\n***\n#### [View in VR @ dlux.io](https://dlux.io/dlux/@${this.account}/${this.postPermlink})\n` : ""),
            "json_metadata": JSON.stringify(this.postCustom_json)
          }]]
        if (this.postBens.length > 0) {
          operations.push(["comment_options",
            {
              "author": this.account,
              "permlink": this.postPermlink,
              "max_accepted_payout": "1000000.000 HBD",
              "percent_hbd": 10000,
              "allow_votes": true,
              "allow_curation_rewards": true,
              "extensions":
                [[0,
                  {
                    "beneficiaries":
                      this.postBens
                  }]]
            }])
        }
        const toSign = {
          type: "raw",
          op: operations,
          key: `posting`,
          msg: `Posting...`,
          ops: ["checkAccount"],
          txid: `Posting @${this.account}/${this.postPermlink}`,
        }
        this.$emit('tosign', toSign)
      }
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
    addBen(acc, weight) {
      if (this.postBens.length >= 8) {
        alert('You can only have 8 benificiaries')
        return
      }
      weight = parseInt(weight)
      var found = -1
      var total = 0
      if (!acc) return false
      for (var i = 0; i < this.postBens.length; i++) {
        if (this.postBens[i].account == acc) {
          found = i
        } else {
          total += this.postBens[i].weight
        }
      }
      if (total + weight > 10000) return
      if (found >= 0) {
        this.postBens[found].weight = weight
      } else {
        // sort by account 
        for (var i = 0; i < this.postBens.length; i++) {
          if (this.postBens[i].account > acc) {
            this.postBens.splice(i, 0, {
              account: acc,
              weight: weight
            })
            return
          }
        }
        this.postBens.push({
          account: acc,
          weight: weight
        })
      }
    },
    delBen(acc) {
      var found = -1
      if (!acc) return false
      for (var i = 0; i < this.postBens.length; i++) {
        if (this.postBens[i].account == acc) {
          found = i
        }
      }
      if (found >= 0) {
        this.postBens.splice(found, 1)
      }
    },
    permlink(text) {
      if (text) {
        text.replace(/[\W_]+/g, '-').replace(' ', '-').toLowerCase()
        text = text.replace(' ', '-')
        text = text.replace(/[\W_]+/g, '')
        text = text.toLowerCase()
        this.postPermlink = text
      } else {
        text = this.postTitle
        text = text.replace(' ', '-')
        text = text.replace(/[\W_]+/g, '-')
        text = text.toLowerCase()
        this.postPermlink = text;
      }
    },
    save() {
      if (this.prop_uid) {
        const postData = {
          title: this.postTitle,
          body: this.postBody,
          //tags: this.postTags,
          bens: this.postBens,
          json: this.postCustom_json,
          permlink: this.postPermlink
        }
        localStorage.setItem(this.prop_uid, JSON.stringify(postData))
      }
    },
    loadPost() {
      const postData = localStorage.getItem(this.prop_uid)
      if (postData) {
        const data = JSON.parse(postData)
        this.postTitle = data.title
        //this.postBody = data.body
        //this.postTags = data.tags
        this.postBens = data.bens
        this.postCustom_json = data.json
        this.postPermlink = data.permlink
        this.insert = data.body
        setTimeout(() => {
        this.insert = data.body
        }, 100)
        return true
      }
      return false
    },
    requestCollaboration() {
      // Emit event to parent to handle collaboration setup
      this.$emit('requestCollaboration');
    },

    onCollaborationConnected() {
      console.log('✅ Collaboration connected');
    },

    onCollaborationDisconnected() {
      console.log('❌ Collaboration disconnected');
    },

    onCollaborationError(error) {
      console.error('❌ Collaboration error:', error);
      // Show user-friendly error message
      this.showCollaborationError(error.message);
    },

    showCollaborationError(message) {
      // Simple error display - can be enhanced with toast notifications
      const errorEl = document.createElement('div');
      errorEl.className = 'alert alert-danger alert-dismissible fade show position-fixed';
      errorEl.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
      errorEl.innerHTML = `
        <strong>Collaboration Error:</strong> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      `;
      document.body.appendChild(errorEl);
      
      // Auto-remove after 5 seconds
      setTimeout(() => {
        if (errorEl.parentNode) {
          errorEl.parentNode.removeChild(errorEl);
        }
      }, 5000);
    },
  },
  computed: {
    collaborationConfig() {
      if (!this.isCollaborativeMode || !this.collaborativeDocument) {
        return {};
      }

      // Build WebSocket URL with auth parameters
      const [owner, permlink] = this.collaborativeDocument.split('/');
      const baseUrl = `wss://data.dlux.io/collaboration/${owner}/${permlink}`;
      
      // Add auth parameters to URL
      const authParams = new URLSearchParams();
      if (this.collaborationAuthHeaders['x-signature']) {
        authParams.set('signature', this.collaborationAuthHeaders['x-signature']);
      }
      if (this.collaborationAuthHeaders['x-account']) {
        authParams.set('account', this.collaborationAuthHeaders['x-account']);
      }
      if (this.collaborationAuthHeaders['x-challenge']) {
        authParams.set('challenge', this.collaborationAuthHeaders['x-challenge']);
      }
      if (this.collaborationAuthHeaders['x-pubkey']) {
        authParams.set('pubkey', this.collaborationAuthHeaders['x-pubkey']);
      }

      const websocketUrl = `${baseUrl}?${authParams.toString()}`;

      const config = {
        documentName: permlink || 'untitled',
        websocketUrl: websocketUrl,
        authHeaders: this.collaborationAuthHeaders
      };
      
      console.log('🔧 Collaboration config computed:', {
        documentName: config.documentName,
        hasWebsocketUrl: !!config.websocketUrl,
        hasAuthHeaders: Object.keys(config.authHeaders || {}).length > 0
      });
      
      return config;
    },
    validPost() {
      if (!this.postPermlink) return false
      if (!this.postTitle) return false
      if (!this.postBody) return false
      else return true
    },
    isDlux() {
      var found = false
      for (var i = 0; i < this.postBens.length; i++) {
        if (this.postBens[i].account == 'dlux-io') {
          found = true
          break
        }
      }
      return found
    },
    isntBenned() {
      var isnt = []
      for (var i = 0; i < this.prop_contracts.length; i++) {
        var found = false
        for (var j = 0; j < this.postBens.length; j++) {
          if (this.prop_contracts[i].c != 2 || this.postBens[j].account == this.prop_contracts[i].s.split(',')[0]) {
            found = true
          }
        }
        if (!found && this.prop_contracts[i].t == this.account) {
          isnt.push({ account: this.prop_contracts[i].s.split(',')[0], weight: this.prop_contracts[i].s.split(',')[1], contract: this.prop_contracts[i].i })
        }
      }
      return isnt

    }
  },
  components: {
    "tagify": Tagify,
    "bennies": Bennies
  },
  watch: {
    'prop_bens': {
      handler: function () {
        for (var i = 0; i < this.prop_bens.length; i++) {
          if (typeof this.prop_bens[i] == "string") this.addBen(this.prop_bens[i].split(',')[0], this.prop_bens[i].split(',')[1])
          else this.addBen(this.prop_bens[i].account, this.prop_bens[i].weight)
        }
        this.save()
      },
      deep: true
    },
    'prop_contracts'(newValue) {
      if (newValue.length) {
        for (var i = 0; i < this.prop_contracts.length; i++) {
          this.addBen(this.prop_contracts[i].s.split(',')[0], this.prop_contracts[i].s.split(',')[1])
        }
        this.save()
      }
    },
    'prop_json'(newValue) {
      if (newValue) {
        for (var node in this.prop_json) {
          this.postCustom_json[node] = this.prop_json[node]
        }
        this.save()
      }
    },
    'prop_insert'(newValue) {
      if (newValue) {
        this.insert = newValue.string
        this.postCustom_json.assets.push({ contract: newValue.contract.i, hash: newValue.cid })
      }
      this.save()
    },
    'postBody'(newValue) {
      this.save()
    },
    'postTags'(newValue) {
      this.save()
    },
    'postTitle'(newValue) {
      this.save()
    },
    'postPermlink'(newValue) {
      this.save()
    },
    'postBens'(newValue) {
      this.save()
    },
    'file_to_add'(newValue) {
      if (newValue) {
        // Add the formatted content to the post body
        this.postBody += '\n' + newValue.content + '\n';
        
        // Update the markdown editor
        this.insert = newValue.content;
        
        // Add the contract ID and CID to the custom JSON assets
        if (newValue.contractId && newValue.cid) {
          const existingAsset = this.postCustom_json.assets.find(asset => 
            asset.contract === newValue.contractId && asset.hash === newValue.cid
          );
          
          if (!existingAsset) {
            this.postCustom_json.assets.push({
              contract: newValue.contractId,
              hash: newValue.cid
            });
          }
        }
        
        this.save();
      }
    },

  },
  mounted() {
    const loaded = this.loadPost()
    if (!loaded) {
      for (var i = 0; i < this.prop_bens.length; i++) {
        if (typeof this.prop_bens[i] == "string") this.addBen(this.prop_bens[i].split(',')[0], this.prop_bens[i].split(',')[1])
        else this.addBen(this.prop_bens[i].account, this.prop_bens[i].weight)
      }
      for (var node in this.prop_json) {
        this.postCustom_json[node] = this.prop_json[node]
      }
      for (var i = 0; i < this.prop_contracts.length; i++) {
        this.addBen(this.prop_contracts[i].s.split(',')[0], this.prop_contracts[i].s.split(',')[1])
        this.postCustom_json = this.prop_json[node]
      }
    }
  },
};