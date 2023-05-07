import Marker from "/js/marker.js";
import Ratings from "/js/ratings.js";
import MDE from "/js/mde.js";
import Vote from "/js/vote.js";
import Pop from "/js/pop.js";
import Replies from "/js/replies.js";

export default {
    components: {
        "vue-markdown": Marker,
        "vue-ratings": Ratings,
        "mde": MDE,
        "vote": Vote,
        "pop-vue": Pop,
        "replies": Replies,
    },
    template: `<div :class="{'fade': hide}" id="detailModal" tabindex="-1" role="dialog" aria-hidden="true" @blur="goBack()">
    <div class="modal-dialog modal-full modal-xl modal-dialog-centered" style="max-width: 1000px;"
        role="document">
        <div class="modal-content bg-img-none text-white">
            <div class="card text-white bg-img-none bg-blur-none">
                <div class="ms-auto">
                    <button type="button" class="btn-close mt-3 me-3"
                        data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="ms-auto me-auto px-2" style="max-width: 750px">
                    <div class="">
                        <div class="d-flex">
                            <div><a class="text-white no-decoration"
                                    :href="'/blog/@' + post.author + '/' + post.permlink">
                                    <h3 class="card-title" id="modal_title">
                                        {{post.title}}</h3>
                                </a>
                                <div class="d-flex flex-wrap text-info">
                                    <div>
                                        <p><i
                                                :class="post_select.types[post.type].icon"></i>{{post_select.types[post.type].launch}}
                                        </p>

                                    </div>
                                    <p class="mx-2">•</p>
                                    <vue-ratings class="d-flex" :stars="post.stars"
                                        :ratings="post.ratings">
                                    </vue-ratings>
                                </div>
                            </div>

                        </div>
                        <div class="d-flex align-items-center justify-content-between">
                            <a :href="'/@' + post.author" class="no-decoration">
                                <div class="d-flex align-items-center">
                                    <img v-if="post.author" :src="'https://images.hive.blog/u/' + post.author + '/avatar'"
                                        alt=""
                                        class="rounded-circle bg-light img-fluid me-3 cover author-img"
                                        style="width: 50px;">
                                    <div>
                                        <div class="d-flex align-items-center">
                                            <h3 class="m-0 text-white-50">{{post.author}}</h3>
                                            <div>
                                                <span style="font-size: .5em;"
                                                    class="ms-2 badge small rounded-pill text-white"
                                                    :class="{'bg-danger': post.rep < 25, 'bg-warning': post.rep >= 25 && post.rep < 50, 'bg-success': post.rep >= 50}">
                                                    {{post.rep}}
                                                </span>
                                            </div>
                                        </div>
                                        <span class="small text-muted">{{post.ago}}</span>
                                    </div>
                                </div>
                            </a>

                            <a :href="post.url" target="_blank"
                                class="ms-auto no-decoration"><button
                                    class="btn btn-lg btn-primary px-4 d-flex align-items-center"
                                    style="border-radius: 5rem;"><span
                                        class="d-none d-md-flex me-2">Launch</span><i
                                        class="ms-2 fas fa-external-link-alt"></i></button></a>

                            <span class="badge bg-primary d-none"><i
                                    :class="post_select.types[post.type].icon"></i>{{post.type}}</span>
                        </div>

                    </div>
                    <div>
                        <hr>
                    </div>
                    <div class="">
                        <vue-markdown :md="post.body" :author="post.author"
                            :permlink="post.permlink"></vue-markdown>
                    </div>
                    <div class="m-auto py-3 text-center">
                        <p><i
                                :class="post_select.types[post.type].icon"></i>{{post_select.types[post.type].launch}}
                        </p>
                        <a :href="post.url"><button class="btn btn-lg btn-primary px-4"
                                style="border-radius: 5rem;">Launch<i
                                    class="ms-2 fas fa-external-link-alt"></i></button></a>
                    </div>
                    <div class="">
                        <!--leave comment-->
                        <div
                            :data-bs-target="'#comment-modal-' + post.author + '-' + post.permlink">
                            <form id="commentForm">
                                <!--input with buttons and preview-->
                                <mde id="body" @settext="pending(post.url, $event)" />
                            </form>
                        </div>
                        <div class="d-flex align-items-center">
                            <vue-ratings vote="true" @rating="setRating(post.url, $event)">
                            </vue-ratings>
                            <button class="ms-auto btn btn-outline-primary" @click="comment(post.url)">Post Comment</button>
                        </div>
                        <!--modal vote collapse-->
                        <div class="collapse"
                            :id="'vote-modal-' + post.author + '-' + post.permlink">
                            <form id="voteForm">
                                <div class="p-2 d-flex align-items-center text-white-50">

                                    <button type="button" class="btn me-2"
                                        :class="{'btn-success': !flag, ' btn-danger': flag}"
                                        @click="vote(post.url)"
                                        style="width: 100px;">{{flag ? '-' :
                                        ''}}{{slider / 100}}%</button>

                                    <button type="button" class="btn btn-secondary me-2"
                                        :data-bs-target="'#vote-modal-' + post.author + '-' + post.permlink"
                                        data-bs-toggle="collapse"><span
                                            class="close text-white">×</span></button>

                                    <div class="d-flex align-items-center px-3 border rounded"
                                        style="height: 38px;"
                                        :class="{'border-success': !flag, 'border-danger': flag}">
                                        <input type="range" class="form-range mx-auto p-0" step="1"
                                         max="10000" v-model="slider">
                                    </div>

                                    <div class="ms-auto">
                                        <p class="me-1 my-0" id="commentVal"
                                            :class="{'text-success': !flag, 'text-danger': flag}">
                                            {{toFixed(voteval *
                                            slider/10000,3)}}
                                            <i class="me-1 fab fa-fw fa-hive"></i>
                                        </p>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <!--modal contract collapse-->
                        <div class="collapse"
                            :id="'contract-modal-' + post.author + '-' + post.permlink">
                            <form id="contractForm">
                                <div class="d-flex align-items-center text-white-50">
                                    <div>
                                        <button type="button" class="btn btn-primary"
                                            @click="">Extend</button>
                                        <button type="button" class="btn btn-secondary"
                                            data-bs-toggle="collapse"
                                            :data-bs-target="'#contract-modal-' + post.author + '-' + post.permlink"><span
                                                class="close text-white">×</span></button>
                                    </div>
                                    <p class="my-0"><span class="me-1" id="commentVal">More Time?</span><i
                                            class="ml-1 fab fa-fw fa-hive"></i></p>
                                </div>
                            </form>
                        </div>
                        <!--footer buttons-->
                        <div class="d-flex align-items-center my-2">
                            <div><a role="button" class="no-decoration" data-bs-toggle="collapse"
                                    :data-bs-target="'#vote-modal-' + post.author + '-' + post.permlink"><i
                                        class="fas fa-heart me-1"></i><span
                                        class="text-white-50">{{post.upVotes}}</span></a>
                                <a role="button" class="no-decoration" data-bs-toggle="collapse"
                                    :data-bs-target="'#comment-modal-' + post.author + '-' + post.permlink">

                                    <i class="fas fa-comment ms-2 me-1"></i><span
                                        class="text-white-50">{{post.children}}</span></a>

                                <a role="button" class="no-decoration text-white-50" data-bs-toggle="collapse"
                                    :class="{'text-primary': flag > 0}"
                                    :data-bs-target="'#vote-modal-' + post.author + '-' + post.permlink"
                                    @click="flag = true">
                                    <i class="fa-solid fa-flag ms-2 me-1"></i><span
                                        class="text-white-50">{{post.downVotes ?
                                        post.downVotes : ''}}</span>
                                </a>
                                <a role="button" v-for="contract in post.contract"
                                    class="no-decoration text-white-50" data-bs-toggle="collapse"
                                    :data-bs-target="'#contract-modal-' + 'contract.i' ">
                                    <i class="fa-solid fa-file-contract ms-2 me-1"></i>
                                </a>
                            </div>
                            <div class="ms-auto" id="modal_total_payout"><i
                                    class="ms-1 fab fa-fw fa-hive text-white-50"></i>
                            </div>
                        </div>
                    </div>
                    <div class="replies">
                        <div v-for="post in post.replies" :key="post.url">
                            <replies :post="post" :account="account" :voteval="voteval" @vote="vote($event)" @reply="reply($event)"/>
                        </div>
                    </div>
                </div>
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
    hide: {
        default: true
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
    };
},
emits: ['vote', 'reply', 'modalselect', 'tosign'],
methods: {
    modalSelect(url) {
        this.$emit('modalselect', url);
    },
    extend(contract, amount, up = false){
        if(amount > this.broca_calc(this.broca))return
        const toSign = {
            type: "cja",
            cj: {
              broca: amount,
              id: contract.i,
              file_owner: contract.t,
              power: up ? 1 : 0,
            },
            id: `spkcc_extend`,
            msg: `Extending ${contract}...`,
            ops: ["getTokenUser"],
            api: "https://spktest.dlux.io",
            txid: "extend",
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

