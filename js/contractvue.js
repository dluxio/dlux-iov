import Pop from "/js/pop.js";
import ExtensionVue from "/js/extensionvue.js";
import FileVue from "/js/filevue.js";

export default {
    components: {
        "pop-vue": Pop,
        "extension-vue": ExtensionVue,
        "file-vue": FileVue
    },
    template: `
    <table class="table table-dark table-striped table-hover text-center align-middle mb-0">
        <thead>
            <tr>

                <th scope="col"><i
                        class="fa-solid fa-database fa-fw me-2"></i>Storage</th>
                <th scope="col"><i
                        class="fa-solid fa-clock fa-fw me-2"></i>Expiration</th>
                <th scope="col"><i
                        class="fa-solid fa-hand-holding-dollar fa-fw me-2"></i>Benificiary
                </th>
                <th scope="col"></th>
            </tr>
        </thead>
        <tbody>
            <Transition>
                <tr v-for="(sponsor, key, index) in saccountapi.channels">
                    <td colspan="4" class="p-0">
                        <div class="table-responsive">
                            <table class="table text-white align-middle mb-0">
                                <tbody>
                                    <tr>
                                        <th class="border-0"
                                            v-for="channel in sponsor"
                                            v-if="channel.c == 1">
                                            {{channel.a/1000000}}
                                            MB</th>
                                        <td class="border-0"
                                            v-for="channel in sponsor"
                                            v-if="channel.c == 1">
                                            {{exp_to_time(channel.e)}}
                                        </td>
                                        <td class="border-0" scope="row"
                                            v-for="channel in sponsor"
                                            v-if="channel.c == 1 && channel.s">
                                            @{{slotDecode(channel.s, 0)}}
                                            ({{slotDecode(channel.s, 1)}}%)</td>
                                        <td class="border-0" scope="row"
                                            v-for="channel in sponsor"
                                            v-if="channel.c == 1 && !channel.s">
                                        </td>
                                        <td class="border-0 text-end"
                                            v-for="channel in sponsor"
                                            v-if="channel.c == 1">

                                            <button type="button"
                                                class="btn btn-outline-success m-1"
                                                v-bind:class="{'invisible': contract.id}"
                                                @click="selectContract(channel.i, channel.b)"><i
                                                    class="fa-solid fa-file-import fa-fw"></i></button>

                                            <button type="button"
                                                class="btn btn-success m-1"
                                                v-bind:class="{'d-none': !contract.id || contract.id != channel.i}"
                                                @click="contract.id = ''; contract.api = ''"><i
                                                    class="fa-solid fa-file-import fa-fw"></i></button>



                                            <a class="collapsed"
                                                data-bs-toggle="collapse"
                                                :href="'#' + replace(channel.i)">
                                                <span
                                                    class="if-collapsed"><button
                                                        class="btn btn-outline-primary"><i
                                                            class="fa-solid fa-magnifying-glass fa-fw"></i></button></span>
                                                <span
                                                    class="if-not-collapsed"><button
                                                        class="btn btn-primary"><i
                                                            class="fa-solid fa-magnifying-glass fa-fw"></i></button></span>
                                            </a>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="collapse border-0"
                                            colspan="4" :id="replace(channel.i)"
                                            v-for="channel in sponsor"
                                            v-if="channel.c == 1">
                                            <ul class="text-start">
                                                <li>Contract ID: {{channel.i}}
                                                </li>
                                                <li v-if="channel.c == 1">Size
                                                    Allowed:
                                                    {{channel.a}} bytes</li>
                                                <li v-if="channel.c == 2">Size:
                                                    {{channel.u}} bytes
                                                </li>
                                                <li>File Owner: @{{channel.t}}
                                                </li>
                                                <li>Service Provider:
                                                    @{{channel.b}}
                                                </li>
                                                <li>Sponsor: @{{channel.f}}</li>
                                                <li>Expiration:
                                                    {{exp_to_time(channel.e)}}
                                                </li>
                                                <li>Price: {{channel.r}} Broca
                                                </li>
                                                <li>Redundancy: {{channel.p}}
                                                </li>
                                                <li v-if="channel.s">Terms:
                                                    {{slotDecode(channel.s,
                                                    1)}}%
                                                    Bennificiary to
                                                    @{{slotDecode(channel.s,
                                                    0)}}</li>
                                                <li>Status: {{channel.c == 1 ?
                                                    'Waiting For Upload' :
                                                    'Uploaded'}}
                                                </li>
                                                <li v-if="channel.df">Files:<p
                                                        v-for="file in channel.df">
                                                        {{file}}
                                                    </p>
                                                </li>
                                                <li v-if="channel.n">Stored by:
                                                    <p v-for="acc in channel.n">
                                                        @{{acc}}
                                                    </p>
                                                </li>
                                            </ul>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </td>
                </tr>
            </Transition>
        </tbody>
    </table>`,
    props: {
        account: {
            default: ''
        },
        sapi: {
            default: 'https://spktest.dlux.io'
        },
    },
    data() {
        return {
            tick: "1",
            larynxbehind: 999999,
            lbalance: 0,
            lbargov: 0,
            spkval: 0,
            saccountapi: {
                spk: 0,
                balance: 0,
                gov: 0,
                poweredUp: 0,
                claim: 0,
                granted: {
                    t: 0
                },
                granting: {
                    t: 0
                }
            }
        };
    },
    emits: ['tosign'],
    methods: {
        modalSelect(url) {
            this.$emit('modalselect', url);
        },
        getSapi(user = this.account) {
            fetch(this.sapi + "/@" + user)
              .then((response) => response.json())
              .then((data) => {
                data.tick = data.tick || 0.01;
                this.larynxbehind = data.behind;
                  this.lbalance = (data.balance / 1000).toFixed(3);
                  this.lbargov = (data.gov / 1000).toFixed(3);
                  data.powerDowns = Object.keys(data.power_downs);
                  for (var i = 0; i < data.powerDowns.length; i++) {
                    data.powerDowns[i] = data.powerDowns[i].split(":")[0];
                  }
                  this.saccountapi = data;
                  this.saccountapi.spk += this.reward_spk();
                  if (!this.saccountapi.granted.t) this.saccountapi.granted.t = 0;
                  if (!this.saccountapi.granting.t) this.saccountapi.granting.t = 0;
                  this.spkval =
                    (data.balance +
                      data.gov +
                      data.poweredUp +
                      this.saccountapi.granting.t +
                      data.claim +
                      data.spk) /
                    1000;
              });
          },
        getSpkStats() {
            fetch(this.sapi + "/stats")
              .then((response) => response.json())
              .then((data) => {
                console.log(data);
                this.spkStats = data.result;
                for (var i = 0; i < this.tokenGov.options.length; i++) {
                  this.tokenGov.options[i].val = data.result[this.tokenGov.options[i].id]
                  this.tokenGov.options[i].range_high = parseFloat(this.tokenGov.options[i].val * 1.01).toFixed(6)
                  this.tokenGov.options[i].range_low = parseFloat(this.tokenGov.options[i].val * 0.99).toFixed(6)
                  this.tokenGov.options[i].step = "0.000001"
                }
              });
        },
        selectContract(id, broker) {  //needs PeerID of broker
            this.contract.id = id
            fetch(`${sapi}/user_services/${broker}`)
              .then(r => r.json())
              .then(res => {
                console.log(res)
                this.contract.api = res.services.IPFS[Object.keys(res.services.IPFS)[0]].a
              })
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
            this.extendcost[id] = parseInt(this.contracts[id].extend * (this.contracts[id].p + (this.spread ? 1 : 0)) / (30 * 3) * this.contracts[id].r)
            this.$forceUpdate()
        },
        getContracts() {
            var contracts = [],
                getContract = (id) => {
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
        this.getSapi()
    },
};

