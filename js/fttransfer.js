import Bennies from "/js/bennies.js";

export default {
    components: {
        "bennies": Bennies
    },
    template: `<div class="modal fade" id="transferModal" tabindex="-1" role="dialog" aria-hidden="true">
<div class="modal-dialog modal-lg modal-dialog-centered" role="document">
    <div class="modal-content bg-dark text-white">
        <div class="border border-info bg-darker mx-auto px-5 py-3 rounded col-12">
            <div class="">
                <div class="d-flex align-items-center justify-content-between pb-1 mb-3">
                <h3 class="mb-0">Transfer {{item.set}} FT</h3>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <ul class="nav nav-pills bg-darker justify-content-center">
                    <li class="nav-item"> <a class="nav-link active" id="giveFTlink" role="tab"
                            data-bs-toggle="tab" aria-controls="giveFT" aria-expanded="true"
                            href="#giveFTtab">Give</a></li>
                    <li class="nav-item"> <a class="nav-link" id="tradeFTlink" role="tab"
                            data-bs-toggle="tab" aria-controls="tradeFT" aria-expanded="true"
                            href="#tradeFTtab">Trade</a></li>
                    <li class="nav-item"> <a class="nav-link" id="sellFTlink" role="tab"
                            data-bs-toggle="tab" aria-controls="sellFT" aria-expanded="true"
                            href="#sellFTtab">Sell</a></li>
                    <li class="nav-item"> <a class="nav-link" id="auctionFTlink" role="tab"
                            data-bs-toggle="tab" aria-controls="auctionFT" aria-expanded="true"
                            href="#auctionFTtab">Auction</a></li>
                    <li class="nav-item"> <a class="nav-link" id="airdropFTlink" role="tab"
                            data-bs-toggle="tab" aria-controls="airdropFT" aria-expanded="true"
                            href="#airdropFTtab">Airdrop</a></li>
                </ul>
                <div class="tab-content">
                    <div role="tabpanel" class="tab-pane fade show active" id="giveFTtab"
                        aria-labelledby="giveFT">
                        <!-- GIVE FORM -->
                        <form id="ftGiveForm" class="needs-validation mt-4" @submit.prevent="validateForm('ftGiveForm', 'ftGiveFormValid');giveFT()" novalidate>
                            <!--:action="javascript:giveFT('{{item.data.set}}','{{giveFTusername.value}}','{{giveFTqty.value}}')"-->
                            <div class="row mb-3">
                                <label for="giveFTusername" class="form-label">Username</label>
                                <div class="input-group has-validation">
                                    <span class="input-group-text">@</span>
                                    <input type="text"
                                        class="form-control text-info"
                                        v-model="give.to" aria-describedby="giveFTuserprep"
                                        required>
                                    <div class="invalid-feedback"> Please enter the
                                        username
                                        you'd like to give to. </div>
                                </div>
                            </div>
                            <div class="row mb-3">
                                <label for="giveFTqty" class="form-label">Quantity</label>
                                <div class="input-group has-validation">
                                    <input type="number"
                                        class="form-control text-info"
                                        v-model="give.qty" aria-describedby="giveFTqtyappend"
                                        step="1" min="1" required>
                                    <span
                                        class="input-group-text"
                                        id="giveFTqtyappend">{{item.set}}
                                        FT</span>
                                    <div class="invalid-feedback"> Please enter the
                                        number of
                                        FTs to send. </div>
                                </div>
                            </div>
                            <div class="text-center">
                                <button id="giveFTbutton" class="btn btn-info" @click="giveFT()"
                                    type="submit">Give</button>
                            </div>
                        </form>
                    </div>
                    <div role="tabpanel" class="tab-pane fade show " id="tradeFTtab"
                        aria-labelledby="tradeFT">
                        <!-- TRADE FORM -->
                        <form id="ftTradeForm" class="needs-validation mt-4" @submit.prevent="validateForm('ftTradeForm', 'ftTradeFormValid');tradeFT()" novalidate>
                            <!--:action="javascript:tradeFT('{{item.data.set}}','{{tradeFTusername.value}}','{{tradeFTamount.value}}')"-->
                            <div class="row mb-3">
                                <label for="tradeFTusername" class="form-label">Username</label>
                                <div class="input-group has-validation">
                                    <span
                                        class="input-group-text"
                                        id="tradeFTuserprep">@</span>
                                    <input type="text"
                                        class="form-control text-info "
                                        id="tradeFTusername" aria-describedby="tradeFTuserprep"
                                        v-model="trade.to" required>
                                    <div class="invalid-feedback"> Please enter the
                                        username
                                        you'd like to trade with. </div>
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-6">
                                    <label for="tradeFTqty" class="form-label">Quantity</label>
                                    <div class="input-group has-validation">
                                        <input type="number"
                                            class="form-control text-info bg-transparent"
                                            id="tradeFTqty" aria-describedby="tradeFTqtyappend"
                                            placeholder="1" step="1" min="1" required readonly>
                                        <span
                                            class="input-group-text"
                                            id="tradeFTqtyappend">{{item.set}}
                                            FT</span>
                                        <div class="invalid-feedback"> Please enter the
                                            number
                                            of FTs to trade. </div>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <label for="tradeFTamount" class="form-label">Amount</label>
                                    <small v-if="trade.token == item.token" class="float-end mb-2 align-self-center text-white-50">
                                        0% FEE
                                    </small>
                                    <small v-else class="float-end mb-2 align-self-center text-white-50">
                                        1% FEE
                                    </small>
                                    <div class="input-group has-validation">
                                        <input type="number"
                                            class="form-control text-info "
                                            id="tradeFTamount" v-model="trade.amount"
                                            aria-describedby="tradeFTamountappend"
                                            placeholder="0.000" step="0.001" min="0.001" required>
                                        <span class="input-group-text e-radius-hotfix m-0 p-0" id="tradeFTamountappend">
                                                <select aria-label="Trade price type select" class="form-select border-0 text-white-50 w-100 h-100">
                                                    <option selected :value="item.token">{{toUpperCase(item.token)}}</option>
                                                </select>
                                            </span>
                                        <div class="invalid-feedback"> Please enter the
                                            amount
                                            of DLUX you'd like to receive. </div>
                                    </div>
                                </div>
                            </div>
                            <div class="text-center">
                                <button id="tradeFTbutton" class="btn btn-info my-2" type="submit"
                                    >Propose
                                    Trade</button>
                            </div>
                        </form>
                    </div>
                    <div role="tabpanel" class="tab-pane fade show " id="sellFTtab"
                        aria-labelledby="sellFT">
                        <!-- SELL FORM -->
                        <form class="needs-validation mt-4" novalidate>
                            <div class="row mb-3">
                                <div class="col-6">
                                    <label for="sellFTqty" class="form-label">Quantity</label>
                                    <div class="input-group has-validation">
                                        <input type="number" v-model="sell.qty"
                                            class="form-control text-info bg-transparent"
                                            id="sellFTqty" aria-describedby="sellFTqtyappend"
                                            placeholder="1" step="1" min="1" required :readonly="sell.token == item.token">
                                        <span
                                            class="input-group-text"
                                            id="sellFTqtyappend">{{item.set}}
                                            FT</span>
                                        <div class="invalid-feedback"> Please enter the
                                            number
                                            of FTs to sell. </div>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <label for="sellFTprice" class="form-label">Sale
                                        Price</label>
                                    <small v-if="sell.token == item.token" class="float-end mb-2 align-self-center text-white-50">
                                        0% FEE
                                    </small>
                                    <small v-else class="float-end mb-2 align-self-center text-white-50">
                                        1% FEE
                                    </small>
                                    <div class="input-group has-validation">
                                        <input type="number"
                                            class="form-control text-info"
                                            id="sellFTprice" aria-describedby="sellFTpriceappend"
                                            placeholder="0.000" step="0.001" min="0.001" required>
                                            <span class="input-group-text e-radius-hotfix m-0 p-0" id="sellFTamountappend">
                                            <select @change="sell.qty = 1" aria-label="Trade price type select" class="form-select border-0 text-white-50 w-100 h-100" v-model="sell.token">
                                                <option :value="item.token">{{toUpperCase(item.token)}}</option>
                                                <option value="hive">HIVE</option>
                                                <option value="hbd">HBD</option>
                                            </select>
                                        </span>
                                        <div class="invalid-feedback"> Please enter the
                                            amount
                                            of DLUX you'd like to receive. </div>
                                    </div>
                                </div>
                            </div>
                            <div v-if="sell.token != item.token">
                                You can choose to have sells distributed to multiple accounts. Must equal 100%.
                                <bennies eq100="true" :list="bens" @update-bennies="bens=$event"></bennies>
                            </div>
                            <div class="row mb-3">
                                <p class="text-white-50 small">Ownership will be
                                    transferred to
                                    the DAO listing service and sold publicly. Cancel
                                    anytime to
                                    return immediately.</p>
                            </div>
                            <div class="text-center">
                                <button id="sellFTbutton" class="btn btn-info my-2"
                                    @click="sellNFT()">List Item</button>
                            </div>
                        </form>
                    </div>
                    <div role="tabpanel" class="tab-pane fade show " id="auctionFTtab"
                        aria-labelledby="auctionFT">
                        <!-- AUCTION FORM -->
                        <form class="needs-validation mt-4" novalidate>
                            <!--:action="javascript:auctionFT('{{item.data.set}}','{{auctionFTprice.value}}','{{Date.now()}}','{{auctionFTdays.value}}'),'{{auctionFTpriceType.value}}'"-->
                            <div class="row mb-3">
                                <div class="col-6">
                                    <label for="auctionFTqty" class="form-label">Quantity</label>
                                    <div class="input-group has-validation">
                                        <input type="number"
                                            class="form-control text-info bg-transparent"
                                            id="auctionFTqty" aria-describedby="auctionFTqtyappend"
                                            placeholder="1" step="1" min="1" required readonly>
                                        <span
                                            class="input-group-text"
                                            id="auctionFTqtyappend">{{item.set}}
                                            FT</span>
                                        <div class="invalid-feedback"> Please enter the
                                            number
                                            of FTs to auction. </div>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <label for="auctionFTprice" class="form-label">Starting
                                        Bid</label>
                                    <small v-if="auction.token == item.token" class="float-end mb-2 align-self-center text-white-50">
                                        0% FEE
                                    </small>
                                    <small v-else class="float-end mb-2 align-self-center text-white-50">
                                        1% FEE
                                    </small>
                                    <div class="input-group has-validation">
                                        <input type="number"
                                            class="form-control text-info"
                                            id="auctionFTprice"
                                            aria-describedby="auctionFTpriceappend"
                                            placeholder="0.000" step="0.001" min="0.001" required>
                                        <span class="input-group-text e-radius-hotfix m-0 p-0" id="auctionFTamountappend">
                                        <select aria-label="Trade price type select" class="form-select border-0 text-white-50 w-100 h-100" v-model="auction.token">
                                            <option :value="item.token">{{toUpperCase(item.token)}}</option>
                                            <option selected value="hive">HIVE</option>
                                            <option value="hbd">HBD</option>
                                        </select>
                                        </span>
                                        <div class="invalid-feedback"> Please enter the
                                            amount
                                            of DLUX you'd like to start the bidding.
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="d-flex justify-content-around">
                                <div class="row mb-3 d-flex align-items-center">
                                    <label for="auctionFTdays" class="form-label">Duration</label>
                                    <select class="mx-2 btn btn-lg btn-secondary form-control"
                                        id="auctionFTdays" required>
                                        <option value="1">1 Day</option>
                                        <option value="2">2 Days</option>
                                        <option value="3">3 Days</option>
                                        <option value="4">4 Days</option>
                                        <option value="5">5 Days</option>
                                        <option value="6">6 Days</option>
                                        <option value="7" selected>7 Days</option>
                                        <option value="8">8 Days</option>
                                        <option value="9">9 Days</option>
                                        <option value="10">10 Days</option>
                                        <option value="11">11 Days</option>
                                        <option value="12">12 Days</option>
                                        <option value="13">13 Days</option>
                                        <option value="14">14 Days</option>
                                        <option value="15">15 Days</option>
                                        <option value="16">16 Days</option>
                                        <option value="17">17 Days</option>
                                        <option value="18">18 Days</option>
                                        <option value="19">19 Days</option>
                                        <option value="20">20 Days</option>
                                        <option value="21">21 Days</option>
                                        <option value="22">22 Days</option>
                                        <option value="23">23 Days</option>
                                        <option value="24">24 Days</option>
                                        <option value="25">25 Days</option>
                                        <option value="26">26 Days</option>
                                        <option value="27">27 Days</option>
                                        <option value="28">28 Days</option>
                                        <option value="29">29 Days</option>
                                        <option value="30">30 Days</option>
                                    </select>
                                </div>
                            </div>
                            <div class="row mb-3">
                                <p class="text-white-50 small">Ownership will be
                                    transferred to
                                    the DAO listing service and auctioned publicly. Once
                                    submitted this cannot be cancelled. If there are no
                                    bids at
                                    the end of the auction period, it will be returned
                                    to you
                                    immediately.</p>
                            </div>
                            <div class="text-center">
                                <button class="btn btn-info my-2" type="submit">List
                                    Item</button>
                            </div>
                        </form>
                    </div>
                    <div role="tabpanel" class="tab-pane fade show " id="airdropFTtab"
                        aria-labelledby="airdropFT">
                        <!-- AIRDROP FORM -->
                        <form id="airdropFT" class="needs-validation mt-4" novalidate @submit.prevent="checkForm('airdropFT', airdropFT)">
                            <div class="row mb-3">
                                <div class="col-12">
                                    <label for="airdropFTusers" class="form-label">Airdrop
                                        to</label>
                                    <div class="input-group has-validation">
                                        <textarea name="paragraph_text" cols="50" rows="2"
                                            class="form-control text-info"
                                            id="airdropFTusers" aria-describedby="airdropFT" v-model="airdrop.to_string" @blur="validateAirdrop()"
                                            required placeholder="name user-name"></textarea>
                                    </div>
                                    <div v-if="airdropFeedback">{{airdropFeedback}}</div>
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-12">
                                    <label for="airdropFTqty" class="form-label">Quantity
                                        sent
                                        to each</label>
                                    <div class="input-group has-validation">
                                        <input type="number"
                                            class="form-control text-info bg-transparent"
                                            id="airdropFTqty" aria-describedby="airdropFTqtyappend"
                                            placeholder="1" step="1" min="1" required readonly>
                                        <span
                                            class="input-group-text"
                                            id="airdropFTqtyappend">{{item.set}}
                                            FT</span>
                                        <div class="invalid-feedback"> Please enter the
                                            number
                                            of FTs to send to each account. </div>
                                    </div>
                                </div>
                            </div>
                            <div class="text-center">
                                <button class="btn btn-info my-2" type="submit">Airdrop
                                    Tokens</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
</div>`,
    // @click="modalIndex('itemModal', item.setname + ':' + item.uid );itemModal.hidden = false"
    // set PFP
    props: {
        item: {
            required: true,
            default: function () {
                return {
                    script: '',
                };
            },
        },
        transferMint: {
            default: function () {
            return {
                item: '',
                mint: '',
                tab: '',
                };
            }
        },
        icon: {
            default: ''
        },
        colors: {
            default: 'linear-gradient(chartreuse,lawngreen)'
        },
        wrapped: {
            default: ''
        },
        uid: {
            default: ''
        },
        mint: {
            default: false
        },
        account: {
            default: ''
        },
    },
    emits: ['tosign', 'detail'],
    data() {
        return {
            give: {
                to: '',
                qty: 1,
            },
            trade: {
                to: '',
                qty: 1,
                amount: "1.000",
                token: 'hive'
            },
            sell: {
                qty: 1,
                price: "1.000",
                token: 'hive',
                distro: [{name: this.account, percent: 100}]
            },
            auction: {
                qty: 1,
                price: "1.000",
                days: 1,
                token: 'hive'
            },
            airdrop: {
                to_string: '',
                to_array: [],
                qty_each: 1,
            },
            bens: [{account: this.account, weight: 10000}],
            airdropFeedback: 'Please enter at least one username to airdrop tokens to.',
            airdropAllowed: false,
            ftGiveFormValid: false,
            ftTradeFormValid: false,
            ftSellFormValid: false,
            ftAuctionFormValid: false,
            ftAirdropFormValid: false,
            ftAirdropUsers: [],

        };
    },
    methods: {
        addDistro(){
            this.sell.distro.push({name: '', percent: 0})
        },
        removeDistro(index){
            this.sell.distro.splice(index, 1)
        },
        validateDistro(){
            var total = 0
            for (var i = 0; i < this.sell.distro.length; i++) {
                total += parseInt(this.sell.distro[i].percent * 100)
                if(total > 10000) {
                    this.sell.distro[i].percent = 0
                    for(var j = i; j < this.sell.distro.length; j++){
                        this.sell.distro[j].percent = 0
                    }
                }
            }
            if(total < 10000) {
                this.sell.distro[this.sell.distro.length - 1].percent = ((10000 - total)/100).toFixed(2)
            }
        },
        validateDistroAcc(){
            var accs = []
            for (var i = 0; i < this.sell.distro.length; i++) {
                if(this.sell.distro[i].name != '') {
                    accs.push(this.sell.distro[i].name)
                }
            }
            var arrStr = '["' + this.accs.join('","') + '"]'
            var body = `{\"jsonrpc\":\"2.0\", \"method\":\"condenser_api.get_accounts\", \"params\":[${arrStr}], \"id\":1}`
            console.log(body)
            fetch("https://anyx.io", {
              body,
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              method: "POST",
            })
              .then((r) => {
                return r.json();
              })
              .then((re) => {
                console.log(re)
                var notFound = accs
                var to_array = []
                for(var i = 0; i < re.result.length; i++) {
                    to_array.push(re.result[i].name)
                    notFound.splice(notFound.indexOf(re.result[i].name), 1)
                }
                if (!notFound.length){

                } else if (notFound.length) {
                    var j = []
                    for(var i = 0; i < this.sell.distro.length; i++) {
                        if(notFound.includes(this.sell.distro[i].name)) {
                            j.push(i)
                        }
                    }
                    if (j.length){
                        for(var i = j.length - 1; i > j.length - 1; i--) {
                            this.sell.distro.splice(j[i], 1)
                        }
                    }
                } else {
                }
              });
        },
        validateForm(formKey, validKey) {
            var Container = document.getElementById(formKey);
            if (Container.querySelector('input:invalid'))
              this[validKey] = false;
            //querySelector('input:invalid[name="pwd"]')
            else this[validKey] = true;
          },
          checkForm(formKey, op) {
            var Container = document.getElementById(formKey);
            if (!Container.querySelector('input:invalid'))
              op()
          },
        validateAirdrop() {
            if (this.airdrop.to_string.length)this.airdrop.to_array = this.airdrop.to_string.split(' ')
            if(this.airdrop.to_array.length > 100) {
                this.airdropFeedback = 'Please enter no more than 100 usernames to airdrop tokens to.'
                return
            }
            var arrStr = '["' + this.airdrop.to_array.join('","') + '"]'
            var body = `{\"jsonrpc\":\"2.0\", \"method\":\"condenser_api.get_accounts\", \"params\":[${arrStr}], \"id\":1}`
            console.log(body)
            fetch("https://anyx.io", {
              body,
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              method: "POST",
            })
              .then((r) => {
                return r.json();
              })
              .then((re) => {
                console.log(re)
                var notFound = this.airdrop.to_array
                this.airdrop.to_array = []
                for(var i = 0; i < re.result.length; i++) {
                    this.airdrop.to_array.push(re.result[i].name)
                    notFound.splice(notFound.indexOf(re.result[i].name), 1)
                }
                this.airdrop.to_string = this.airdrop.to_array.join(' ')
                if (!notFound.length){
                    this.airdropFeedback = ''
                    this.airdropAllowed = true
                } else if (notFound.length) {
                    this.airdropFeedback = 'Following usernames not found: ' + notFound.join(', ') + '. Please check your list and try again.'
                    this.airdropAllowed = false
                } else {
                    this.airdropFeedback = 'No valid usernames found. Please check your list and try again.'
                    this.airdropAllowed = false
                }
              });
        },
        giveFT() {
            const toSign = {
                type: "cja",
                cj: {
                  set: this.item.set,
                    to: this.give.to,
                    qty: this.give.qty,
                },
                id: `${this.item.token}_ft_transfer`,
                msg: `Giving ${this.give.qty} ${this.item.set} mint token...`,
                ops: ["getTokenUser"],
                api: this.api,
                txid: `${this.item.token}_ft_transfer_${this.give.to}`,
              }
              this.$emit('tosign', toSign)
        },
        tradeFT() {
            const toSign = {
                type: "cja",
                cj: {
                    set: this.item.set,
                    to: this.trade.to,
                    price: parseInt(parseFloat(this.trade.amount) * 1000),
                },
                id: `${this.item.token}_ft_escrow`,
                msg: `Giving ${this.item.set} mint token...`,
                ops: ["getTokenUser"],
                api: this.api,
                txid: `${this.item.token}_ft_transfer_${this.trade.to}`,
              }
              this.$emit('tosign', toSign)
        },
        airdropFT() {
            const toSign = {
                type: "cja",
                cj: {
                    set: this.item.set,
                    to: this.airdrop.to_array
                },
                id: `${this.item.token}_ft_airdrop`,
                msg: `Airdropping ${this.item.set} mint tokens...`,
                ops: ["getTokenUser"],
                api: this.api,
                txid: `${this.item.token}_ft_airdrop_${this.trade.to_string}`,
              }
              this.$emit('tosign', toSign)
        },
        auctionFT() {
            const toSign = {
                type: "cja",
                cj: {
                    set: this.item.set,
                    to: this.trade.to,
                    price: parseInt(parseFloat(this.trade.amount) * 1000),
                },
                id: `${this.item.token}_ft_auction`,
                msg: `Giving ${this.item.set} mint token...`,
                ops: ["getTokenUser"],
                api: this.api,
                txid: `${this.item.token}_ft_transfer_${this.trade.to}`,
              }
              this.$emit('tosign', toSign)
        },
        sellFT() {
            var toSign = {}
            var distro = ''
            for (var i = 0; i < this.bens.length; i++) {
                distro += `${this.bens[i].name}_${this.bens[i].weight},`
            }
            //remove last comma
            distro = distro.slice(0, -1)
            if(this.sell.token == 'hive' || this.sell.token == 'hbd')toSign = {
                type: "cja",
                cj: {
                    set: this.item.set,
                    [this.sell.token]: parseInt(parseFloat(this.sell.amount) * 1000),
                    quantity: this.sell.qty,
                    distro: distro,
                },
                id: `${this.item.token}_fts_sell_h`,
                msg: `Selling ${this.item.set} mint token...`,
                ops: ["getTokenUser"],
                api: this.api,
                txid: `${this.item.token}_fts_sell_h`,
              }
              else toSign = {
                type: "cja",
                cj: {
                    set: this.item.set,
                    price: parseInt(parseFloat(this.sell.amount) * 1000),
                },
                id: `${this.item.token}_ft_sell`,
                msg: `Selling ${this.item.set} mint token...`,
                ops: ["getTokenUser"],
                api: this.api,
                txid: `${this.item.token}_ft_sell`,
              }

              this.$emit('tosign', toSign)
        },
        modalIndex() {
            this.$emit('detail', this.item.setname + ':' + this.item.uid);
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
        toUpperCase(str = "") {
            return str.toUpperCase();
        }
    },
    mounted() {
    },
}