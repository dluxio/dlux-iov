export default {
    template: `<div :id="'contract-' +  contract.i">
    <form id="contractForm">
        <div>

            <!-- detail banner -->
            <div class="d-flex d-none flex-column mb-2">
                <div class="w-100 py-1">
                    <div class="d-flex justify-content-between align-items-center mx-2">
                        <span class="text-break">{{fancyBytes(contract.u)}} | {{expIn(contract)}}</span>
                        <button type="button" class="btn btn-sm btn-outline-success" data-bs-toggle="collapse"
                            :data-bs-target="'#nodes-' + contract.i">
                            <i
                                class="fa-solid fa-tower-broadcast fa-fw me-1"></i>{{contract.nt}}/{{contract.p}}</button>
                    </div>
                    <div class="collapse mx-2" :id="'nodes-' + contract.i">
                        <div class="text-lead text-uppercase text-white-50 pb-05 mt-1 border-bottom">Nodes Storing This
                            Contract</div>
                        <ol type="1" class="my-1">
                            <div v-for="(acc, prop, index) in contract.n">
                                <li><a :href="'/@' + acc " class="no-decoration text-info">@{{acc}}</a></li>
                                <div v-if="index == Object.keys(contract.n).length - 1 && index + 1 < contract.p"
                                    v-for="i in (contract.p - (index + 1))">
                                    <li>Open</li>
                                </div>
                                <p class="d-none"
                                    v-if="index == Object.keys(contract.n).length - 1 && index + 1 < contract.p">
                                    {{contract.p - (index + 1) }} slots are open!</p>
                            </div>
                        </ol>

                    </div>
                </div>
            </div>

            <!-- node banner -->
            <div v-if="has_ipfs" class="alert alert-secondary d-flex align-items-center py-1 ps-2 pe-1 mx-2 mb-2">
                <div class="me-1">{{isStored(contract.i) ? 'Your node is storing this contract' : 'Your node is not storing this contract'}}</div>
                <div class="ms-auto d-flex flex-wrap align-items-center justify-content-center mb-1">

                    <button style="max-width:100px;" @click="store(contract.i, isStored(contract.i))"
                        class="flex-grow-1 ms-1 mt-1 btn btn-sm text-nowrap"
                        :class="{'btn-success': !isStored(contract.i), 'btn-danger': isStored(contract.i)}">
                        <span v-if="!isStored(contract.i)"><i class="fa-solid fa-square-plus fa-fw me-1"></i>Add</span>
                        <span v-if="isStored(contract.i)"><i class="fa-solid fa-trash-can fa-fw me-1"></i>Remove</span>
                    </button>
                    <button style="max-width:100px;" type="button" class="flex-grow-1 btn btn-sm btn-warning ms-1 mt-1"
                        @click="">
                        <i class="fa-solid fa-flag fa-fw me-1"></i>Flag</button>
                </div>
            </div>



            <!-- extend time input -->
            <div class="d-flex flex-wrap justify-content-around px-2 mb-2" style="max-width: 300px">
            <!-- add node button-->
                <div class="d-flex align-items-center text-wrap me-auto mt-1 btn btn-sm btn-outline-light p-0">
                    <label :for="'spread-' + contract.i" role="button" class="ps-1">&nbsp;</label>
                    <input class="form control" :id="'spread-' + contract.i" type="checkbox" role="button"
                        v-model="spread" @change="updateCost(contract.i)">
                     <label :for="'spread-' + contract.i" role="button" class="px-1 py-05">Add<i
                        class="fa-solid fa-tower-broadcast fa-fw ms-1"></i></label>
                </div>
                <!-- selector -->
                <div class="btn-group ms-auto mt-1">
                    <input name="time" @change="updateCost(contract.i);customTime = false" title="1 Day"
                        class="btn-check" :id="'option1-' + contract.i" type="radio" value="1" v-model="contract.extend"
                        checked>
                    <label class="btn btn-sm btn-outline-info" :for="'option1-' + contract.i">1D</label>
                    <input name="time" @change="updateCost(contract.i);customTime = false" title="1 Week"
                        class="btn-check" :id="'option2-' + contract.i" type="radio" value="7"
                        v-model="contract.extend">
                    <label class="btn btn-sm btn-outline-info" :for="'option2-' + contract.i">1W</label>
                    <input name="time" @change="updateCost(contract.i);customTime = false" title="1 Month"
                        class="btn-check" :id="'option3-' + contract.i" type="radio" value="30"
                        v-model="contract.extend">
                    <label class="btn btn-sm btn-outline-info" :for="'option3-' + contract.i">1M</label>
                    <input name="time" @change="updateCost(contract.i);customTime = false" title="1 Year"
                        class="btn-check" :id="'option4-' + contract.i" type="radio" value="365"
                        v-model="contract.extend">
                    <label class="btn btn-sm btn-outline-info" :for="'option4-' + contract.i">1Y</label>
                </div>
                
                <!-- input -->
                <div class=" mt-1">
                    <div class="input-group flex-nowrap col">
                        <input type="number" step="1" class="form-control btn-sm text-end border-info text-info"
                            v-model="contract.extend" @change="updateCost(contract.i)" style="min-width: 60px;">
                        <span class="input-group-text btn-sm">Days</span>
                    </div>
                </div>
                

                <!-- cost -->
                <div class="ms-auto mt-1 text-primary fw-bold">{{formatNumber(extendcost, 0, '.',',')}}
                    Broca</div>
            </div>

            <!-- action buttons -->
            <div class="px-2 mb-2 d-flex flex-wrap text-wrap align-items-center text-white-50">
                <button type="button" class="d-none btn btn-sm btn-secondary mt-1 me-1" data-bs-toggle="collapse"
                    :data-bs-target="'#contract-' + contract.i">
                    <i class="fa-solid fa-xmark fa-fw me-1"></i>Cancel</button>
                <button type="button" class="btn btn-sm btn-danger mt-1" v-if="contract.t != account"
                    @click="cancel_contract(contract)">
                    <i class="fa-solid fa-file-circle-xmark fa-fw me-1"></i>End</button>
                <button type="button" class="btn btn-sm btn-primary ms-auto mt-1"
                    :disabled="extendcost > broca_calc(saccountapi.broca)" @click="extend(contract, extendcost[name])">
                    <i class="fa-solid fa-clock-rotate-left fa-fw me-1"></i>Extend</button>


            </div>

        </div>
    </form>
</div>`,
    props: {
        contract: {
            required: true,
            default: function () {
                return {

                };
            },
        },
        account: {
            default: ''
        },
        saccountapi: {
            required: true,
            default: function () {
                return {

                };
            },
        },
        sstats: {
            required: true,
            default: function () {
                return {

                };
            },
        },
        has_ipfs: {
            default: false,
        },
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
            extendcost: 0,
        };
    },
    emits: [],
    methods: {
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
        broca_calc(last = '0,0') {
            const last_calc = this.Base64toNumber(last.split(',')[1])
            const accured = parseInt((parseFloat(this.sstats.broca_refill) * (this.sstats.head_block - last_calc)) / (this.saccountapi.spk_power * 1000))
            var total = parseInt(last.split(',')[0]) + accured
            if (total > (this.saccountapi.spk_power * 1000)) total = (this.saccountapi.spk_power * 1000)
            return total
        },
        formatNumber(t, n, r, e) {
            if (typeof t != "number") {
                const parts = t.split(" ");
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
        updateCost(id){
            this.extendcost = parseInt(this.contract.extend / 30 * this.contract.r)
            this.$forceUpdate()
          },
        fancyBytes(bytes){
            var counter = 0, p = ['', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y']
            while (bytes > 1024){
              bytes = bytes / 1024
              counter ++
            }
            return `${this.toFixed(bytes, 2)} ${p[counter]}B`
          },
          toFixed(num, dig){
            return parseFloat(num).toFixed(dig);
          },
          expIn(con){
            if(con.e)return `Expires in ${parseInt((parseInt(con.e.split(':')[0]) - this.sstats.head_block) / 20 / 60) < 24 ? parseInt((parseInt(con.e.split(':')[0]) - this.spkapi.head_block) / 20 / 60) + ' hours' : parseInt((parseInt(con.e.split(':')[0]) - this.spkapi.head_block) / 20 / 60 / 24) + ' days'}`
          },
    },
    mounted() {},
};

