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
    template: `<div class="card text-white">
    <div class="card-header">
        <div class="d-flex align-items-center flex-wrap">
            <a :href="'/@' + post.author" class="no-decoration">
            <div class="d-flex align-items-center">
                <img v-if="post.author" :src="'https://images.hive.blog/u/' + post.author + '/avatar'" alt=""
                class="rounded-circle bg-light img-fluid me-3 cover author-img"
                                                style="width: 50px;">
                <div>
                    <div class="d-flex align-items-center mb-1">
                        <h3 class="card-title m-0">{{ post.author }}</h3>
                        <div>
                            <span style="font-size: .5em;"
                                class="ms-2 badge small rounded-pill text-white"
                                                            :class="{'bg-danger': post.rep < 25, 'bg-warning': post.rep >= 25 && post.rep < 50, 'bg-success': post.rep >= 50}">
                            {{ post.rep }}
                        </span>
                    </div>
                </div>
                <h6 class="card-subtitle text-muted m-0">{{ timeSince(post.created) }}</h6>
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

                            <!--featured image with mouseover launch btn-- >
    <div class="card">
        <div class="d-flex">
            <a target="_blank" :href="post.url" class="p-0 m-0" type="button">
            <div id="imagesMain">
                <div class="imagebox bg-none">
                    <img v-if="post.pic" alt="Card image cap" class="img-fluid image"
                                                    :src="post.pic" @error="imgUrlAlt"
                                                    style="width: 1500px; height: 360px; object-fit: cover;" />
                    <div class="caption text-white w-100 h-100 d-flex">
                        <div class="m-auto p-3 text-center">
                            <p><i
                                                                :class="post_select.types[post.type].icon"></i>{{ post_select.types[post.type].launch }}
                        </p>
                        <button class="btn btn-lg btn-primary px-4"
                            style="border-radius: 5rem;">Launch<i
                                class="ms-2 fas fa-external-link-alt"></i></button>
                    </div>
                </div>
            </div>
        </div>
    </a>
                                </div >
                            </div >

                            < !--vote collapse-- >
                            <div class="collapse" :id="'vote-' + post.author + '-' + post.permlink">
                                <form id="voteForm">
                                    <div class="p-2 d-flex align-items-center text-white-50">

                                        <button type="button" class="btn me-2"
                                            :class="{'btn-success': !post.flag, ' btn-danger': post.flag}"
                                            @click="vote(post.url)" style="width: 100px;">{{post.flag ? '-' :
                                            ''}}{{post.slider / 100}}%</button>

                                        <button type="button" class="btn btn-secondary me-2"
                                            :data-bs-target="'#vote-' + post.author + '-' + post.permlink"
                                            data-bs-toggle="collapse"><span class="close text-white">×</span></button>

                                        <div class="d-flex align-items-center px-3 border rounded" style="height: 38px;"
                                            :class="{'border-success': !post.flag, 'border-danger': post.flag}">
                                            <input type="range" class="form-range mx-auto p-0" step="1"
                                                max="10000" v-model="post.slider">
                                        </div>

                                        <div class="ms-auto">
                                            <p class="me-1 my-0" id="commentVal"
                                                :class="{'text-success': !post.flag, 'text-danger': post.flag}">
                                                {{toFixed(voteVal *
                                                post.slider/10000,3)}}
                                                <i class="me-1 fab fa-fw fa-hive"></i>
                                            </p>
                                        </div >
                                    </div >
                                </form >
                            </div >

                            < !--contract collapse
                            <div class="collapse" :id="'contract-' +  post.author + '-' + post.permlink">
                                <form v-for="(cid, name, index) in post.contract" id="contractForm">
                                    <div v-if="contracts[name]" class="d-flex flex-column">
                                        

                                    <div class="p-2 d-flex align-items-center text-white-50">
                                        <button type="button" class="btn btn-primary me-2" :disabled="extendcost[name] > broca_calc(spkapi.broca)" @click="extend(contracts[name], extendcost[name])"><i class="fa-solid fa-clock-rotate-left fa-fw me-2"></i>Extend</button>
                                        <button type="button" class="btn btn-secondary me-2" data-bs-toggle="collapse"
                                            :data-bs-target="'#contract-' + post.author + '-' + post.permlink"><span
                                                class="close text-white">×</span></button>
                                        
                                       
                                        <p class="text-center ms-auto me-auto my-1"><span
                                            class="me-1 text-break">{{fancyBytes(contracts[name].u)}} |
                                            {{expIn(contracts[name])}}</span></p>
                                        <div class="ms-auto text-primary">{{extendcost[name]}}
                                            Broca</div>
                                    </div>
                                    <div class="d-flex">
                                    <div class="input-group m-2 mb-3">
                                        
                                        <input name="time" @change="updateCost(name);customTime = false" title="1 Day" class="btn-check" id="option1" type="radio"
                                            value="1" v-model="contracts[name].extend" checked>
                                        <label class="btn btn-outline-info l-radius-hotfix" for="option1">1D</label>
                                        
                                        <input name="time" @change="updateCost(name);customTime = false" title="1 Week" class="btn-check" id="option2"
                                            type="radio" value="7" v-model="contracts[name].extend"><label
                                            class="btn btn-outline-info" for="option2">1W</label>
                                        <input name="time" @change="updateCost(name);customTime = false" title="1 Month" class="btn-check" id="option3"
                                            type="radio" value="30" v-model="contracts[name].extend"><label
                                            class="btn btn-outline-info" for="option3">1M</label>
                                        <input name="time" @change="updateCost(name);customTime = false" title="1 Year" class="btn-check" id="option4"
                                            type="radio" value="365" v-model="contracts[name].extend">
                                        <label class="btn btn-outline-info" for="option4">1Y</label>
                                   
                                        <input type="number" step="1" class="form-control text-center border-info text-info"
                                            v-model="contracts[name].extend" @change="updateCost(name)">
                                        <span
                                            class="input-group-text border-info text-info">Days</span>
                                    </div>
                                </div>
                                </div >
                                </form >
                            </div >-->
                            <div class="card-footer text-white-50">
                                <!--footer buttons-->
                                <div class="d-flex align-items-center my-2">
                                    <a href="#/" class="no-decoration" @click="post.flag = false"
                                        data-bs-toggle="collapse"
                                        :class="{'text-primary': post.hasVoted, 'text-white-50': !post.hasVoted, 'text-danger': post.slider < 0 }"
                                        :data-bs-target="'#vote-' + post.author + '-' + post.permlink">
                                        <i class="fas fa-heart fa-fw me-1"></i><span
                                            class="text-white-50">{{post.upVotes}}</span>
                                    </a>
                                    <a href="#detailModal" class="no-decoration text-white-50" data-bs-toggle="modal"
                                        @click="modalSelect(post.url)"><i
                                            class="fas fa-comment fa-fw ms-2 me-1"></i><span
                                            class="text-white-50">{{post.children}}</span>
                                    </a>
                                    <a v-show="post.rating" href="#detailModal" class="no-decoration text-white-50"
                                        data-bs-toggle="modal" @click="modalSelect(post.url)" >
                                        <i class="fa-solid fa-star ms-2 me-1"></i><span
                                            class="text-white-50">{{post.rating}}</span>
                                    </a >
    <a href="#/" class="no-decoration text-white-50" data-bs-toggle="collapse"
                                        :class="{'text-primary': post.flag > 0}"
                                        :data-bs-target="'#vote-' + post.author + '-' + post.permlink"
                                        @click="post.flag = true" >
                                        <i class="fa-solid fa-flag ms-2 me-1"></i><span
                                            class="text-white-50">{{post.downVotes ? post.downVotes : ''}}</span>
                                    </a >
    <a v-for="(contract, name, index) in post.contract" href="#/" class="no-decoration text-white-50"
        data-bs-toggle="collapse"
                                        :data-bs-target="'#contract-' + post.author + '-' + post.permlink">
        <i class="fa-solid fa-file-contract ms-2 me-1" :class="{'text-success': color_code(name) > 28800 * 7,'text-warning': color_code(name) < 28800 * 7 &&  color_code(name) > 28800, 'text-warning': color_code(name) < 28800}"></i>
                                    </a >
    <div class="ms-auto">
        <pop-vue v-if="post.total_payout_value || post.pending_payout_value" title="Post Earnings"
                                            :id="'popper-' + post.author + '-' + post.permlink" :content="(gt(post.total_payout_value, post.pending_payout_value) ? formatNumber(post.total_payout_value + ' ' + post.curator_payout_value, 3, '.',',') + ' HBD' : post.pending_payout_value ? post.pending_payout_value : '') + '<br>' + (post.paid ? precision(post.payout, 3) : 0) + ' ' + TOKEN"
                                            trigger="hover">
            <button class="btn btn-secondary">
                {{ gt(post.total_payout_value, post.pending_payout_value) ? formatNumber(post.total_payout_value + ' ' + post.curator_payout_value, 3, '.',',') :
                                                formatNumber(post.pending_payout_value, 3, '.',',')}} HBD
            </button>
        </pop-vue>
    </div>
                                </div >
                            </div >
                        </div >`,
    props: {
        contracts: {
            default: function () {
                return {}
            }
        },
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
        voteval: 0,
        post_select:{
            default: function () {
                return {}
            }
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
        };
    },
    emits: ['vote', 'reply', 'modalselect'],
    methods: {
        modalSelect(url) {
            this.$emit('modalselect', url);
        },
        pending(event) {
            this.mde = event
        },
        vote(event) {
            this.$emit('vote', event);
        },
        color_code(name){
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
        gt(a, b) {
            return parseFloat(a) > parseFloat(b);
        },
        precision(num, precision) {
            return parseFloat(num / Math.pow(10, precision)).toFixed(precision);
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
        }
    },
    mounted() {
        this.hideLowRep()
    },
};

