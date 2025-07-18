import Marker from "/js/marker.js";
import Ratings from "/js/ratings.js";
import MDE from "/js/mde.js";
import Vote from "/js/vote.js";
import Pop from "/js/pop.js";
import Mcommon from "/js/methods-common.js";

export default {
    components: {
        "vue-markdown": Marker,
        "vue-ratings": Ratings,
        "mde": MDE,
        "vote": Vote,
        "pop-vue": Pop
    },
    template: `<div class="card text-white border-0">
  <div class="card-header px-2 pt-1 pb-0">
    <div class="d-flex align-items-center position-relative">
      <div class="d-flex align-items-center mt-1 mb-2">
        <a :href="'/@' + post.author" class="no-decoration">
          <img v-if="post.author" :src="'https://images.hive.blog/u/' + post.author + '/avatar'"
            :alt="'https://images.hive.blog/u/' + post.author"
            class="rounded-circle bg-light img-fluid me-1 border"
            style="width: 50px;">
        </a>
        <div>
          <!-- author & rep -->
          <a :href="'/@' + post.author" class="no-decoration">
            <div class="d-flex align-items-center">
              <h5 class="m-0 text-white-50">{{ post.author }}</h5>
              <span class="ms-1 badge small text-white-50"
                :class="{'rep-danger': authorRep < 25, 'rep-warning': authorRep >= 25 && authorRep < 50, 'rep-success': authorRep >= 50}">
                {{ authorRep }}
              </span>
            </div>
          </a>
          <!-- Community info display -->
          <div v-if="postCommunity && postCommunityTitle" class="d-flex align-items-center mt-1">
            <a :href="'#community/' + postCommunity" @click.prevent="navigateToCommunity(postCommunity)" class="d-flex align-items-center no-decoration">
            <img :src="'https://images.hive.blog/u/' + postCommunity + '/avatar'" 
                 :alt="postCommunity" 
                 class="rounded-circle bg-light img-fluid me-1 border border-light" 
                 style="width: 20px;">
            <span class="small text-info">{{postCommunityTitle}}</span>
            </a>
          </div>
          <!-- time ago -->
          <span class="small text-muted" style="font-weight: 400">{{ timeSince(post.created) }}</span>
        </div>
      </div>
      <!-- post type label -->
      <div class="position-absolute bottom-0 end-0">
        <span class="badge square rounded-top border border-bottom-0 bg-info border-light-50">
          <i :class="post_select.types[post.type].icon"></i>{{ post.type }}
        </span>
      </div>
    </div>
  </div>

  <div class="card-body px-2">
    <a href="#detailModal" class="no-decoration" data-bs-toggle="modal"
      @click="modalSelect(post.url)">
      <h3 class="lead text-white truncate1">{{ post.title }}</h3>
      <p class="text-white-50 mb-1 truncate2">{{ post.preview }}</p>
    </a>
  </div>

  <!-- Featured image for non-Blog posts -->
  <div v-if="post.type !== 'Blog'" class="position-relative overflow-hidden">
    <a target="_blank" :href="'/dlux/@' + post.author + '/' + post.permlink" class="d-block">
      <div class="imagebox bg-none position-relative">
        <img :alt="displayImage || 'DLUX Content'" 
          class="img-fluid w-100"
          :src="displayImage || '/img/dlux-logo-icon.png'"
          style="height: 360px; object-fit: cover;" />
        <div class="caption text-white d-flex">
          <div class="m-auto p-3 text-center">
            <p class="mb-3">
              <i :class="post_select.types[post.type].icon"></i>
              {{ post_select.types[post.type].launch }}
            </p>
            <button class="btn btn-lg btn-danger px-4 rounded-pill">
              Launch<i class="ms-2 fas fa-external-link-alt"></i>
            </button>
          </div>
        </div>
      </div>
    </a>
  </div>

  <!-- Blog posts: image carousel or single image (no overlay) -->
  <div v-if="post.type === 'Blog' && (displayImages.length > 0 || displayImage)" 
    class="position-relative overflow-hidden" 
    :id="'imageSection-' + post.author + '-' + post.permlink">
    <a href="#detailModal" class="d-block" data-bs-toggle="modal" 
      @click="modalSelect(post.url)" type="button">
      <div class="imagebox bg-none position-relative">
        <img :alt="currentImageUrl" 
          class="img-fluid w-100"
          :src="currentImageUrl"
          @error="hideBlogImage($event, post.author, post.permlink)"
          style="height: 360px; object-fit: cover;" />
      </div>
    </a>

    <!-- Carousel controls for multiple images -->
    <div v-if="displayImages.length > 1" 
      class="position-absolute w-100 h-100 top-0 start-0" 
      style="z-index: 20; pointer-events: none;">
      
      <!-- Previous button -->
      <button @click.stop="previousImage" 
        class="btn btn-sm btn-dark position-absolute top-50 start-0 translate-middle-y ms-2" 
        style="z-index: 25; opacity: 0.9; border: 1px solid rgba(255,255,255,0.3); pointer-events: auto;">
        <i class="fas fa-chevron-left text-white"></i>
      </button>
      
      <!-- Next button -->
      <button @click.stop="nextImage" 
        class="btn btn-sm btn-dark position-absolute top-50 end-0 translate-middle-y me-2" 
        style="z-index: 25; opacity: 0.9; border: 1px solid rgba(255,255,255,0.3); pointer-events: auto;">
        <i class="fas fa-chevron-right text-white"></i>
      </button>
      
      <!-- Image indicator dots -->
      <div class="position-absolute bottom-0 start-50 translate-middle-x mb-3" 
        style="z-index: 25; pointer-events: auto;">
        <div class="d-flex gap-1 justify-content-center mb-1">
          <button v-for="(img, index) in displayImages" 
            :key="index"
            @click.stop="currentImageIndex = index"
            class="btn btn-sm rounded-circle border"
            :class="{'btn-light': index === currentImageIndex, 'btn-outline-light': index !== currentImageIndex}"
            style="width: 12px; height: 12px; min-width: 12px; padding: 0;">
          </button>
        </div>
        <small class="text-white d-block text-center px-2 py-1 rounded" 
          style="background-color: rgba(0,0,0,0.7); font-weight: bold;">
          {{ currentImageIndex + 1 }} / {{ displayImages.length }}
        </small>
      </div>
    </div>
  </div>

  <!-- Contract collapse section -->
  <div class="collapse" :id="'contract-' + post.author + '-' + post.permlink">
    <div class="border-top">
      <form v-for="(cid, name, index) in post.contract" id="contractForm">
        <div v-if="inView == name" class="p-2">
          <!-- Detail banner -->
          <div class="mb-3">
            <div class="bg-dark py-2 px-3 rounded">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="text-break">{{fancyBytes(contracts[name].u)}} | {{expIn(contracts[name])}}</span>
                <button type="button" class="btn btn-sm btn-outline-success" 
                  data-bs-toggle="collapse" :data-bs-target="'#nodes-' + post.permlink">
                  <i class="fa-solid fa-tower-broadcast fa-fw me-1"></i>{{contracts[name].nt}}/{{contracts[name].p}}
                </button>
              </div>
              
              <div class="collapse" :id="'nodes-' + post.permlink">
                <div class="text-lead text-uppercase text-white-50 pb-2 mt-2 border-bottom">
                  Nodes Storing This Contract
                </div>
                <ol type="1" class="my-2">
                  <div v-for="(acc, prop, index) in contracts[name].n">
                    <li><a :href="'/@' + acc" class="no-decoration text-info">@{{acc}}</a></li>
                    <div v-if="index == Object.keys(contracts[name].n).length - 1 && index + 1 < contracts[name].p" 
                      v-for="i in (contracts[name].p - (index + 1))">
                      <li>Open</li>
                    </div>
                  </div>
                </ol>
                <p class="d-none" v-if="index == Object.keys(contracts[name].n).length - 1 && index + 1 < contracts[name].p">
                  {{contracts[name].p - (index + 1)}} slots are open!
                </p>
              </div>
            </div>
          </div>

          <!-- Node banner -->
          <div v-if="has_ipfs" class="alert alert-secondary d-flex align-items-center py-2 px-3 mb-3">
            <div class="me-2">
              {{isStored(contracts[name].i) ? 'Your node is storing this contract' : 'Your node is not storing this contract'}}
            </div>
            <div class="ms-auto d-flex gap-2">
              <button @click="store(contracts[name].i, isStored(contracts[name].i))" 
                class="btn btn-sm text-nowrap"
                :class="{'btn-success': !isStored(contracts[name].i), 'btn-danger': isStored(contracts[name].i)}">
                <span v-if="!isStored(contracts[name].i)">
                  <i class="fa-solid fa-square-plus fa-fw me-1"></i>Add
                </span>
                <span v-if="isStored(contracts[name].i)">
                  <i class="fa-solid fa-trash-can fa-fw me-1"></i>Remove
                </span>
              </button>
              <button type="button" class="btn btn-sm btn-warning">
                <i class="fa-solid fa-flag fa-fw me-1"></i>Flag
              </button>
            </div>
          </div>

          <!-- Extend time input -->
          <div class="d-flex flex-wrap gap-2 mb-3">
            <div class="btn-group">
              <input name="time" @change="updateCost(name);customTime = false" 
                title="1 Day" class="btn-check" :id="'option1-' + name" type="radio"
                value="1" v-model="contracts[name].extend" checked>
              <label class="btn btn-sm btn-outline-info" :for="'option1-' + name">1D</label>
              
              <input name="time" @change="updateCost(name);customTime = false" 
                title="1 Week" class="btn-check" :id="'option2-' + name"
                type="radio" value="7" v-model="contracts[name].extend">
              <label class="btn btn-sm btn-outline-info" :for="'option2-' + name">1W</label>
              
              <input name="time" @change="updateCost(name);customTime = false" 
                title="1 Month" class="btn-check" :id="'option3-' + name"
                type="radio" value="30" v-model="contracts[name].extend">
              <label class="btn btn-sm btn-outline-info" :for="'option3-' + name">1M</label>
              
              <input name="time" @change="updateCost(name);customTime = false" 
                title="1 Year" class="btn-check" :id="'option4-' + name"
                type="radio" value="365" v-model="contracts[name].extend">
              <label class="btn btn-sm btn-outline-info" :for="'option4-' + name">1Y</label>
            </div>
            
            <div class="input-group flex-fill" style="max-width: 150px;">
              <input type="number" step="1" 
                class="form-control btn-sm text-end border-info text-info"
                v-model="contracts[name].extend" @change="updateCost(name)" 
                style="min-width: 60px;">
              <span class="input-group-text btn-sm">Days</span>
            </div>
          </div>

          <!-- Action buttons -->
          <div class="d-flex flex-wrap align-items-center gap-2 text-white-50">
            <button type="button" class="btn btn-sm btn-primary" 
              :disabled="extendcost[name] > broca_calc(broca)" 
              @click="extend(contracts[name], extendcost[name])">
              <i class="fa-solid fa-clock-rotate-left fa-fw me-1"></i>Extend
            </button>
            
            <button type="button" class="btn btn-sm btn-warning" 
              v-if="contracts[name].t == account" @click="cancel_contract(contracts[name])">
              <i class="fa-solid fa-file-circle-xmark fa-fw me-1"></i>Sever
            </button>
            
            <button type="button" class="btn btn-sm btn-secondary" data-bs-toggle="collapse"
              :data-bs-target="'#contract-' + post.author + '-' + post.permlink" @click="inView = false">
              <i class="fa-solid fa-xmark fa-fw"></i>
            </button>
            
            <div class="d-flex align-items-center btn btn-sm btn-outline-secondary p-0">
              <label :for="'spread-' + name" role="button" class="ps-2">&nbsp;</label>
              <input class="form-control" :id="'spread-' + name" type="checkbox" 
                role="button" v-model="spread" @change="updateCost(name)">
              <label :for="'spread-' + name" role="button" class="px-2 py-1">
                Add<i class="fa-solid fa-tower-broadcast fa-fw ms-1"></i>
              </label>
            </div>
            
            <div class="ms-auto text-primary fw-bold">
              {{formatNumber(extendcost[name], 0, '.',',')}} Broca
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>

  <!-- Vote collapse section -->
  <div class="collapse border-top" :id="'vote-' + post.author + '-' + post.permlink">
    <div class="p-3">
      <form id="voteForm">
        <div class="d-flex align-items-center gap-2 text-white-50">
          <button type="button" class="btn btn-sm"
            :class="{'btn-success': !flag, 'btn-danger': flag}"
            @click="vote(post.url)" style="min-width: 85px;">
            <span v-if="!flag"><i class="fas fa-heart fa-fw me-1"></i></span>
            <span v-if="flag"><i class="fa-solid fa-flag me-1"></i></span>
            {{flag ? '-' : ''}}{{formatNumber(slider / 100, 0,'.',',')}}%
          </button>
          
          <button type="button" class="btn btn-sm btn-secondary px-2"
            :data-bs-target="'#vote-' + post.author + '-' + post.permlink"
            data-bs-toggle="collapse">
            <i class="fa-solid fa-xmark fa-fw"></i>
          </button>
          
          <input type="range" class="form-range flex-fill mx-2" step="1"
            max="10000" v-model="slider">
          
          <span class="text-end text-nowrap" id="commentVal"
            :class="{'text-success': !flag, 'text-danger': flag}"
            style="min-width: 100px;">
            {{toFixed(voteval * slider/10000, 3)}}
            <i class="me-1 fab fa-fw fa-hive"></i>
          </span>
        </div>
      </form>
    </div>
  </div>

  <!-- Card footer -->
  <div class="card-footer text-white-50 px-2 pb-1">
    <div class="d-flex flex-wrap align-items-center">
      <div class="text-nowrap my-2"> 
        <a role="button" class="no-decoration" @click="flag = false"
          :data-bs-toggle="account ? 'collapse' : ''"
          :class="{'text-primary': post.hasVoted, 'text-white-50': !post.hasVoted, 'text-danger': slider < 0, 'disabled': !account}"
          :data-bs-target="account ? '#vote-' + post.author + '-' + post.permlink : ''">
          <i class="fas fa-heart fa-fw me-1"></i>
          <span class="text-white-50">{{post.upVotes}}</span>
        </a>
        
        <a href="#detailModal" class="ms-2 no-decoration text-white-50" data-bs-toggle="modal"
          @click="modalSelect(post.url, first_replier_permlink)">
          <i class="fas fa-comment fa-fw me-1"></i>
          <span class="text-white-50">{{post.children}}</span>
        </a>
        
        <a v-show="post.rating" href="#detailModal" class="ms-2 no-decoration text-white-50"
          data-bs-toggle="modal" @click="modalSelect(post.url)">
          <i class="fa-solid fa-star me-1"></i>
          <span class="text-white-50">{{formatNumber(post.rating, 1, '.',',')}}</span>
        </a>
        
        <a role="button" class="ms-2 no-decoration text-white-50" 
          :data-bs-toggle="account ? 'collapse' : ''"
          :class="{'text-primary': flag > 0, 'disabled': !account}"
          :data-bs-target="account ? '#vote-' + post.author + '-' + post.permlink : ''"
          @click="flag = true">
          <i class="fa-solid fa-flag me-1"></i>
          <span class="text-white-50">{{post.downVotes ? post.downVotes : ''}}</span>
        </a>
        
        <a role="button" v-for="(contract, name, index) in post.contract" 
          @click="inView = name" class="ms-2 no-decoration text-white-50" 
          :class="{'disabled': !account}"
          data-bs-toggle="collapse"
          :data-bs-target="'#contract-' + post.author + '-' + post.permlink">
          <i class="fa-solid fa-file-contract me-1" 
            :class="{'text-success': color_code(name) > 28800 * 7,'text-warning': color_code(name) < 28800 * 7 && color_code(name) > 28800, 'text-warning': color_code(name) < 28800}"></i>
        </a>
      </div>
      
      <div class="ms-auto my-2">
        <pop-vue v-if="post.total_payout_value || post.pending_payout_value" 
          title="Post Earnings"
          :id="'popper-' + post.author + '-' + post.permlink" 
          :content="(gt(post.total_payout_value, post.pending_payout_value) ? formatNumber(post.total_payout_value + ' ' + post.curator_payout_value, 3, '.',',') + ' HBD' : post.pending_payout_value ? post.pending_payout_value : '') + '<br>' + (post.paid ? precision(post.payout, 3) : 0) + ' ' + TOKEN"
          trigger="hover">
          <button class="btn btn-sm btn-secondary">
            {{ gt(post.total_payout_value, post.pending_payout_value) ? formatNumber(post.total_payout_value + ' ' + post.curator_payout_value, 3, '.',',') :
            formatNumber(post.pending_payout_value, 3, '.',',')}}
            <i class="ms-1 fab fa-fw fa-hive"></i>
          </button>
        </pop-vue>
      </div>
    </div>
  </div>
</div>`,
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
            spread: false,
            showNodes: false,
            bens: [],
            inView: false,
            first_replier_permlink: "huh",
            // Local reputation management
            authorRep: "...",
            authorInfo: null,
            // Image carousel data
            displayImages: [],
            displayImage: null,
            currentImageIndex: 0,
        };
    },
    emits: ['vote', 'reply', 'modalselect', 'tosign'],
    computed: {
        currentImageUrl() {
            if (this.displayImages.length > 1) {
                return this.displayImages[this.currentImageIndex] || this.displayImage || '/img/dlux-logo-icon.png';
            }
            return this.displayImage || '/img/dlux-logo-icon.png';
        },
        postCommunity() {
            return this.post.community || (this.post.json_metadata && this.post.json_metadata.community);
        },
        postCommunityTitle() {
            return this.post.community_title || (this.post.json_metadata && this.post.json_metadata.community_title);
        }
    },
    methods: {
        ...Mcommon,
        modalSelect(url, firstReplyPermlink) {
            this.$emit('modalselect', url);
        },
        // Image carousel methods
        nextImage() {
            if (this.displayImages.length > 1) {
                this.currentImageIndex = (this.currentImageIndex + 1) % this.displayImages.length;
                this.preloadAdjacentImages();
            }
        },
        previousImage() {
            if (this.displayImages.length > 1) {
                this.currentImageIndex = this.currentImageIndex === 0 ? this.displayImages.length - 1 : this.currentImageIndex - 1;
                this.preloadAdjacentImages();
            }
        },
        preloadAdjacentImages() {
            // Preload next and previous images for smooth carousel
            const nextIndex = (this.currentImageIndex + 1) % this.displayImages.length;
            const prevIndex = this.currentImageIndex === 0 ? this.displayImages.length - 1 : this.currentImageIndex - 1;
            
            [nextIndex, prevIndex].forEach(index => {
                if (this.displayImages[index]) {
                    const img = new Image();
                    img.src = this.displayImages[index];
                }
            });
        },
        // Self-contained reputation management
        // async getAuthorReputation() {
        //     if (this.post.author && !this.authorInfo) {
        //         try {
        //             const response = await fetch("https://api.hive.blog", {
        //                 body: JSON.stringify({
        //                     "jsonrpc": "2.0", 
        //                     "method": "condenser_api.get_accounts", 
        //                     "params": [[this.post.author]], 
        //                     "id": 1
        //                 }),
        //                 headers: {
        //                     "Content-Type": "application/json",
        //                 },
        //                 method: "POST",
        //             });
        //             const data = await response.json();
        //             if (data.result && data.result.length > 0) {
        //                 this.authorInfo = data.result[0];
        //                 this.updateAuthorReputation();
        //             }
        //         } catch (error) {
        //             console.error('Error fetching author reputation:', error);
        //             // Fallback to post reputation if available
        //             if (this.post.author_reputation) {
        //                 this.authorRep = this.post.author_reputation;
        //             }
        //         }
        //     }
        // },
        updateAuthorReputation() {
            // Use the same reputation source as other posts in v3-hub.js
            if (this.post.author_reputation) {
                this.authorRep = this.post.author_reputation;
            } else if (this.authorInfo && this.authorInfo.reputation) {
                this.authorRep = this.authorInfo.reputation;
            } else if (this.post.rep && this.post.rep !== "...") {
                this.authorRep = this.post.rep;
            } else {
                // Fallback: try to get reputation from author if available
                this.authorRep = "...";
                // if (this.post.author) {
                //     // Trigger reputation fetch if we don't have data yet
                //     this.getAuthorReputation();
                // }
            }
        },
        // Advanced image finding with carousel support
        findPostImages() {
            if (!this.post.json_metadata) return;
            
            let foundImages = [];
            
            // Check for image array in JSON metadata (PeakD format)
            if (this.post.json_metadata.image && Array.isArray(this.post.json_metadata.image)) {
                foundImages = this.post.json_metadata.image.filter(img => 
                    typeof img === 'string' && img.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i)
                );
            }
            // Check for single image string
            else if (this.post.json_metadata.image && typeof this.post.json_metadata.image === 'string') {
                foundImages = [this.post.json_metadata.image];
            }
            // Check for DLUX-specific images
            else if (this.post.json_metadata.Hash360) {
                foundImages = [`https://ipfs.dlux.io/ipfs/${this.post.json_metadata.Hash360}`];
            }
            
            // Fallback: search post body for markdown images
            if (foundImages.length === 0 && this.post.body) {
                const imageMatches = this.post.body.match(/!\[.*?\]\((.*?)\)/g);
                if (imageMatches) {
                    foundImages = imageMatches.map(match => {
                        const url = match.match(/!\[.*?\]\((.*?)\)/)[1];
                        return url.trim();
                    }).filter(url => 
                        url.startsWith('http') && url.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i)
                    );
                }
                
                // Additional fallback: any HTTP image URLs in the body
                if (foundImages.length === 0) {
                    const urlMatches = this.post.body.match(/https?:\/\/[^\s)]+\.(jpg|jpeg|png|gif|webp|svg)/gi);
                    if (urlMatches) {
                        foundImages = urlMatches;
                    }
                }
            }
            
            // Set up image display
            if (foundImages.length > 1) {
                this.displayImages = foundImages;
                this.displayImage = foundImages[0];
                this.currentImageIndex = 0;
                // Preload first few images
                this.preloadAdjacentImages();
            } else if (foundImages.length === 1) {
                this.displayImage = foundImages[0];
                this.displayImages = [];
            } else {
                this.displayImage = null;
                this.displayImages = [];
            }
        },
        isStored(contract){
            var found = false
            for (var i in this.contracts[contract].n) {
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
                id: `spkccT_extend`,
                msg: `Extending ${contract.i}...`,
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
                id: `spkccT_${!remove ? 'store' : 'remove'}`,
                msg: `Storing ${contract}...`,
                ops: ["getTokenUser"],
                api: "https://spktest.dlux.io",
                txid: `${contract}_${!remove ? 'store' : 'remove'}`,
              }
              this.$emit('tosign', toSign)
        },
        updateCost(id) {
            this.extendcost[id] = parseInt(this.contracts[id].extend * (this.contracts[id].p + (this.spread ? 1 : 0)) / (30 * 3) * this.contracts[id].r)
            this.$forceUpdate()
        },
        getContracts() {
            var contracts = [],
                getContract = (id) => {
                    fetch('https://spktest.dlux.io/api/fileContract/' + id)
                        .then((r) => r.json())
                        .then((res) => {
                            if(typeof res.result != "string"){
                                res.result.extend = "7"
                                this.contracts[id] = res.result
                                this.extendcost[id] = parseInt(res.result.extend / 30 * res.result.r)
                            } else {
                                delete this.contracts[id]
                                delete this.post.contract
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
                return `https://ipfs.dlux.io/ipfs/${json.Hash360}`;
            } else {
                /*
                        var looker
                        try {
                            looker = body.split('![')[1]
                            looker = looker.split('(')[1]
                            looker = looker.split(')')[0]
                        } catch (e) {
                            */
                return "/img/dluxdefault.png";
            }
        },
        pending(event) {
            this.mde = event
        },
        vote(url) {
            this.$emit('vote', { url: `/@${this.post.author}/${this.post.permlink}`, slider: this.slider, flag: this.flag })
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
            if (isNaN(t)) return "0";
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
            if (this.authorRep !== '...') {
                if (parseFloat(this.authorRep) < 25) {
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
        },
        hideBlogImage(event, author, permlink) {
            // Hide the entire image section when image fails to load
            const imageSection = document.getElementById(`imageSection-${author}-${permlink}`);
            if (imageSection) {
                imageSection.style.display = 'none';
            }
        },
        navigateToCommunity(community) {
            // Navigate to the community feed
            window.location.href = `/hub/#community/${community}`;
        }
    },
    watch: {
        post: {
            handler() {
                // Initialize reputation and images when post data changes
                this.updateAuthorReputation();
                this.findPostImages();
                this.hideLowRep();
                try{
                    if(this.post?.replies?.length != 0)this.first_replier_permlink = this.post.replies[0].permlink
                } catch (e) {}
            },
            deep: true,
            immediate: true
        }
    },
            mounted() {
            // Initialize component
            this.updateAuthorReputation();
            //this.getAuthorReputation();
            this.findPostImages();
            this.hideLowRep();
            this.getContracts();
        },
};

