import Marker from "/js/marker.js";
import Ratings from "/js/ratings.js";
import MDE from "/js/mde.js";
import Vote from "/js/vote.js";
import Pop from "/js/pop.js";

export default {
    components: {
        "vue-markdown": Marker,
        "vue-ratings": Ratings,
        "mde": MDE,
        "vote": Vote,
        "pop-vue": Pop,
    },
    template: `
    <div class="card text-white">
   <div class="card-header">
      <div class="d-flex align-items-center flex-wrap">
         <a :href="'/@' + post.author" class="no-decoration">
            <div class="d-flex align-items-center">
               <img v-if="post.author" :src="'https://images.hive.blog/u/' + post.author + '/avatar'" alt=""
                  class="rounded-circle bg-light img-fluid me-1 cover author-img"
                  style="width: 50px;">
               <div>
                  <div class="d-flex align-items-center">
                     <h5 class="m-0 text-white-50">{{ post.author }}</h5>
                        <span class="ms-1 badge small text-bg-light">
                        {{ post.rep }}
                        </span>
                  </div>
                  <span class="small text-muted" style="font-weight: 400">{{ timeSince(post.created) }}</span>
               </div>
            </div>
         </a>
         <h5 class="m-0 ms-auto"><span class="badge bg-info"><i
            :class="post_select.types[post.type].icon"></i>{{ post.type }}</span></h5>
      </div >
   </div >
   <div class="card-body">
      <a href="#detailModal" class="no-decoration" data-bs-toggle="modal"
         @click="modalSelect(post.url)">
         <h3 class="lead text-white truncate1">{{ post.title }}</h3>
         <p class="text-white-50 mb-1 truncate2">{{ post.preview }}</p>
      </a>
   </div >
   <!-- featured image with mouseover launch btn -->
      <div class="card">
          <div class="d-flex">
              <a target="_blank" :href="(post.type != 'blog' ? '/dlux/@' : '/blog/@') + post.author + '/' + post.permlink" class="p-0 m-0" type="button">
              <div :id="'imagesMain-' + post.author + '-' + post.permlink">
                  <div class="imagebox bg-none">
                      <img v-show="post.pic" alt="Card image cap" class="img-fluid image"
                                                      :src="post.pic" @error="imgUrlAlt"
                                                      style="width: 1500px; height: 360px; object-fit: cover;" />
                      <div class="caption text-white w-100 h-100 d-flex">
                          <div class="m-auto p-3 text-center">
                              <p><i :class="post_select.types[post.type].icon"></i>{{ post_select.types[post.type].launch }}
                          </p>
                          <button class="btn btn-lg btn-primary px-4"
                              style="border-radius: 5rem;">Launch<i
                                  class="ms-2 fas fa-external-link-alt"></i></button>
                      </div>
                  </div>
              </div>
          </div>
      </a>
                                  </div>
                              </div>
      
                              <!-- contract collapse -->
                              <div class="collapse" :id="'contract-' +  post.author + '-' + post.permlink">
                                  <form v-for="(cid, name, index) in post.contract" id="contractForm">
                                      <div v-if="contracts[name]" class="d-flex flex-column">
                                          <div class="text-center w-100 mb-1 py-1 bg-dark">
                                      <span class="text-break">{{fancyBytes(contracts[name].u)}} |
                                      {{expIn(contracts[name])}}</span></div>
                                        <a role="button" @click="showNodes = !showNodes"><h6>Storage Detail ({{contracts[name].nt}}/{{contracts[name].p}})</h6></a> | <a v-if="has_ipfs" role="button" @click="store(contracts[name].i, isStored(contracts[name].i))"><h6>{{isStored(contracts[name].i) ? 'Remove from Storage' : 'Place in Storage'}}</h6></a>
                                      
                                      <div v-if="showNodes" v-for="acc in contract.n">
                                        <p>@{{acc}}</p>
                                        </div>
                                      <div class="d-flex flex-wrap mx-1">
                                      <div class="btn-group m-1">
                                          <input name="time" @change="updateCost(name);customTime = false" title="1 Day" class="btn-check" :id="'option1-' + name" type="radio"
                                              value="1" v-model="contracts[name].extend" checked>
                                          <label class="btn btn-sm btn-outline-info" :for="'option1-' + name">1D</label>
                                          <input name="time" @change="updateCost(name);customTime = false" title="1 Week" class="btn-check" :id="'option2-' + name"
                                              type="radio" value="7" v-model="contracts[name].extend">
                                          <label class="btn btn-sm btn-outline-info" :for="'option2-' + name">1W</label>
                                          <input name="time" @change="updateCost(name);customTime = false" title="1 Month" class="btn-check" :id="'option3-' + name"
                                              type="radio" value="30" v-model="contracts[name].extend">
                                          <label class="btn btn-sm btn-outline-info" :for="'option3-' + name">1M</label>
                                          <input name="time" @change="updateCost(name);customTime = false" title="1 Year" class="btn-check" :id="'option4-' + name"
                                              type="radio" value="365" v-model="contracts[name].extend">
                                          <label class="btn btn-sm btn-outline-info" :for="'option4-' + name">1Y</label>
                                        </div>

                                        <div class="input-group flex-nowrap col m-1">
                                          <input type="number" step="1" class="form-control px-1 btn-sm text-end border-info text-info"
                                              v-model="contracts[name].extend" @change="updateCost(name)" style="min-width: 60px;">
                                          <span class="input-group-text btn-sm">Days</span>
                                      </div>

                                    </div>
                                    
                                    <div class="p-2 d-flex align-items-center text-white-50">
                                    <button type="button" class="btn btn-sm btn-primary me-1" :disabled="extendcost[name] > broca_calc(broca)" @click="extend(contracts[name], extendcost[name])"><i class="fa-solid fa-clock-rotate-left fa-fw me-1"></i>Extend</button>
                                    <input :id="'spread-' + name" type="checkbox" v-model="spread">
                                          <label :for="'spread-' + name"><i class="fa-solid fa-tower-broadcast"></i></label>
                                    <button type="button" class="btn btn-sm btn-secondary me-1" data-bs-toggle="collapse"
                                        :data-bs-target="'#contract-' + post.author + '-' + post.permlink"><span><i class="fa-solid fa-xmark fa-fw"></i></span></button>
                                    <div class="ms-auto text-primary">{{formatNumber(extendcost[name], 0, '.',',')}}
                                        Broca</div>
                                    </div>

                                  </div >
                                  </form >
                              </div>

                              <!-- vote collapse -->
                              <div class="collapse border-top" :id="'vote-' + post.author + '-' + post.permlink">
                                  <form id="voteForm">
                                      <div class="p-2 d-flex align-items-center text-white-50">
      
                                          <button type="button" class="btn btn-sm me-1"
                                              :class="{'btn-success': !flag, ' btn-danger': flag}"
                                              @click="vote(post.url)" style="min-width: 85px;"><span v-if="!flag"><i class="fas fa-heart fa-fw me-1"></i></span><span v-if="flag"><i class="fa-solid fa-flag me-1"></i></span>{{flag ? '-' :
                                              ''}}{{formatNumber(slider / 100, 0,'.',',')}}%</button>
      
                                          <button type="button" class="btn btn-sm btn-secondary px-1 me-1"
                                              :data-bs-target="'#vote-' + post.author + '-' + post.permlink"
                                              data-bs-toggle="collapse"><span><i class="fa-solid fa-xmark fa-fw"></i></span></button>

                                              <input type="range" class="form-range mx-2" step="1"
                                                  max="10000" v-model="slider">

                                              <span style="min-width: 100px" class="text-end text-nowrap" id="commentVal"
                                                  :class="{'text-success': !flag, 'text-danger': flag}">
                                                  {{toFixed(voteval *
                                                  slider/10000,3)}}
                                                  <i class="me-1 fab fa-fw fa-hive"></i>
                                              </span>
                                      </div>
                                  </form>
                              </div>

   <div class="card-footer text-white-50">
      <!-- footer buttons -->
      <div class="d-flex flex-wrap align-items-center">
        <div class="text-nowrap my-2"> 
        <a role="button" class="no-decoration" @click="flag = false"
            data-bs-toggle="collapse"
            :class="{'text-primary': post.hasVoted, 'text-white-50': !post.hasVoted, 'text-danger': slider < 0 }"
            :data-bs-target="'#vote-' + post.author + '-' + post.permlink">
         <i class="fas fa-heart fa-fw me-1"></i><span
            class="text-white-50">{{post.upVotes}}</span>
         </a>
         <a href="#detailModal" class="ms-2 no-decoration text-white-50" data-bs-toggle="modal"
            @click="modalSelect(post.url)"><i
            class="fas fa-comment fa-fw me-1"></i><span
            class="text-white-50">{{post.children}}</span>
         </a>
         <a v-show="post.rating" href="#detailModal" class="ms-2 no-decoration text-white-50"
            data-bs-toggle="modal" @click="modalSelect(post.url)" >
         <i class="fa-solid fa-star me-1"></i><span
            class="text-white-50">{{post.rating}}</span>
         </a >
         <a role="button" class="ms-2 no-decoration text-white-50" data-bs-toggle="collapse"
            :class="{'text-primary': flag > 0}"
            :data-bs-target="'#vote-' + post.author + '-' + post.permlink"
            @click="flag = true" >
         <i class="fa-solid fa-flag me-1"></i><span
            class="text-white-50">{{post.downVotes ? post.downVotes : ''}}</span>
         </a>
         <a role="button" v-for="(contract, name, index) in post.contract" class="ms-2 no-decoration text-white-50"
            data-bs-toggle="collapse"
            :data-bs-target="'#contract-' + post.author + '-' + post.permlink">
         <i class="fa-solid fa-file-contract me-1" :class="{'text-success': color_code(name) > 28800 * 7,'text-warning': color_code(name) < 28800 * 7 &&  color_code(name) > 28800, 'text-warning': color_code(name) < 28800}"></i>
         </a>
         </div>
         <div class="ms-2 ms-auto my-2">
            <pop-vue v-if="post.total_payout_value || post.pending_payout_value" title="Post Earnings"
               :id="'popper-' + post.author + '-' + post.permlink" :content="(gt(post.total_payout_value, post.pending_payout_value) ? formatNumber(post.total_payout_value + ' ' + post.curator_payout_value, 3, '.',',') + ' HBD' : post.pending_payout_value ? post.pending_payout_value : '') + '<br>' + (post.paid ? precision(post.payout, 3) : 0) + ' ' + TOKEN"
               trigger="hover">
               <button class="btn btn-sm btn-secondary">
               {{ gt(post.total_payout_value, post.pending_payout_value) ? formatNumber(post.total_payout_value + ' ' + post.curator_payout_value, 3, '.',',') :
               formatNumber(post.pending_payout_value, 3, '.',',')}} HBD
               </button>
            </pop-vue>
         </div>
      </div >
   </div >
</div >`,
    props: {
        head_block: {
            default: 0
        },
        TOKEN: {
            default: 'DLUX'
        },
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
        has_ipfs: {
            default: false
        },
        voteval: 0,
        post_select: {
            default: function () {
                return {}
            }
        },
        contracts: {
            default: function () {
                return {}
            }
        },
        extendcost: {
            default: function () {
                return {}
            }
        },
        broca_refill:{
            default: 0
        },
        broca: {
            default: 0
        },
        spk_power: {
            default: 0
        }
    },
    data() {
        return {
            collapse: false,
            edit: false,
            view: true,
            mde: '',
            makeReply: false,
            warn: false,
            flag: false,
            slider: 10000,
            spread: false
        };
    },
    emits: ['vote', 'reply', 'modalselect', 'tosign'],
    methods: {
        modalSelect(url) {
            this.$emit('modalselect', url);
        },
        isStored(contract){
            var found = false
            for (var i = 0; i < this.contracts[contract].n.length; i++) {
                if (this.contracts[contract].n[i] == this.account) {
                    found = true
                    break
                }
            }
            return found
        },
        extend(contract, amount){
            if(amount > this.broca_calc(this.broca))return
            const toSign = {
                type: "cja",
                cj: {
                  broca: amount,
                  id: contract.i,
                  file_owner: contract.t,
                  power: this.spread ? 1 : 0,
                },
                id: `spkcc_extend`,
                msg: `Extending ${contract}...`,
                ops: ["getTokenUser"],
                api: "https://spktest.dlux.io",
                txid: "extend",
              }
              this.$emit('tosign', toSign)
        },
        store(contract, remove = false){
            // have a storage node?
            const toSign = {
                type: "cja",
                cj: {
                  items: [contract]
                },
                id: `spkcc_${!remove ? 'store' : 'remove'}`,
                msg: `Storing ${contract}...`,
                ops: ["getTokenUser"],
                api: "https://spktest.dlux.io",
                txid: `${contract}_${!remove ? 'store' : 'remove'}`,
              }
              this.$emit('tosign', toSign)
        },
        updateCost(id) {
            this.extendcost[id] = parseInt(this.contracts[id].extend / 30 * this.contracts[id].r)
            this.$forceUpdate()
        },
        getContracts() {
            var contracts = [],
                getContract = (id) => {
                    console.log({id})
                    fetch('https://spktest.dlux.io/api/fileContract/' + id)
                        .then((r) => r.json())
                        .then((res) => {
                            res.result.extend = "7"
                            if (res.result) {
                                this.contracts[id] = res.result
                                this.extendcost[id] = parseInt(res.result.extend / 30 * res.result.r)
                            }
                        });
                }
            for (var contract in this.post.contract) {
                contracts.push(contract)
            }
            contracts = [...new Set(contracts)]
            for (var i = 0; i < contracts.length; i++) {
                getContract(contracts[i])
            }
        },
        imgUrlAlt(event) {
            event.target.src = "/img/dlux-logo-icon.png";
        },
        picFind(json) {
            var arr;
            try {
                arr = json.image[0];
            } catch (e) { }
            if (typeof json.image == "string") {
                return json.image;
            } else if (typeof arr == "string") {
                return arr;
            } else if (typeof json.Hash360 == "string") {
                return `https://ipfs.io/ipfs/${json.Hash360}`;
            } else {
                /*
                        var looker
                        try {
                            looker = body.split('![')[1]
                            looker = looker.split('(')[1]
                            looker = looker.split(')')[0]
                        } catch (e) {
                            */
                return "/img/dluxdefault.svg";
            }
        },
        pending(event) {
            this.mde = event
        },
        vote(url) {
            this.$emit('vote', { url: `/@${this.post.author}/${this.post.permlink}`, slider: this.slider, flag: this.flag })
            console.log(this.post)
        },
        color_code(name) {
            return parseInt(this.contracts[name] ? this.contracts[name].e.split(':')[0] : 0) - this.head_block
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
            if (!deets) deets = {
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
        broca_calc(last = '0,0') {
            if(!last)last='0,0'
            const last_calc = this.Base64toNumber(last.split(',')[1])
            const accured = parseInt((parseFloat(this.broca_refill) * (this.head_block - last_calc)) / (this.spk_power * 1000))
            var total = parseInt(last.split(',')[0]) + accured
            if (total > (this.spk_power * 1000)) total = (this.spk_power * 1000)
            return total
        },
        Base64toNumber(chars) {
            const glyphs =
              "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+=";
            var result = 0;
            chars = chars.split("");
            for (var e = 0; e < chars.length; e++) {
              result = result * 64 + glyphs.indexOf(chars[e]);
            }
            return result;
        },
        formatNumber(t = 1, n, r, e) { // number, decimals, decimal separator, thousands separator
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
        precision(num, precision) {
            return parseFloat(num / Math.pow(10, precision)).toFixed(precision);
        },
        toFixed(n, digits) {
            return parseFloat(n).toFixed(digits)
        },
        hideLowRep() {
            if (this.post.rep != '...') {
                if (parseFloat(this.post.rep) < 25) {
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
        fancyBytes(bytes){
            var counter = 0, p = ['', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y']
            while (bytes > 1024){
              bytes = bytes / 1024
              counter ++
            }
            return `${this.toFixed(bytes, 2)} ${p[counter]}B`
        },
        expIn(con){
            return `Expires in ${parseInt((parseInt(con.e.split(':')[0]) - this.head_block) / 20 / 60) < 24 ? parseInt((parseInt(con.e.split(':')[0]) - this.head_block) / 20 / 60) + ' hours' : parseInt((parseInt(con.e.split(':')[0]) - this.head_block) / 20 / 60 / 24) + ' days'}`
        }
    },
    mounted() {
        this.hideLowRep()
        this.getContracts()
    },
};

