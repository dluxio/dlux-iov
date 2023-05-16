export default {
    components: {
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
                        <form class="needs-validation mt-4" @action="giveFT()" novalidate>
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
                        <form class="needs-validation mt-4" novalidate>
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
                                    <div class="input-group has-validation">
                                        <input type="number"
                                            class="form-control text-info "
                                            id="tradeFTamount" v-model="trade.amount"
                                            aria-describedby="tradeFTamountappend"
                                            placeholder="0.000" step="0.001" min="0.001" required>
                                        <span
                                            class="input-group-text"
                                            id="tradeFTamountappend">DLUX</span>
                                        <div class="invalid-feedback"> Please enter the
                                            amount
                                            of DLUX you'd like to receive. </div>
                                    </div>
                                </div>
                            </div>
                            <div class="text-center">
                                <button id="tradeFTbutton" class="btn btn-info my-2" type="submit"
                                    @click="tradeFT(item)">Propose
                                    Trade</button>
                            </div>
                        </form>
                    </div>
                    <div role="tabpanel" class="tab-pane fade show " id="sellFTtab"
                        aria-labelledby="sellFT">
                        <!-- SELL FORM -->
                        <form class="needs-validation mt-4" novalidate>
                            <!--:action="javascript:sellFT('{{item.data.set}}','{{sellFTprice.value}}')"-->
                            <div class="row mb-3">
                                <div class="col-6">
                                    <label for="sellFTqty" class="form-label">Quantity</label>
                                    <div class="input-group has-validation">
                                        <input type="number"
                                            class="form-control text-info bg-transparent"
                                            id="sellFTqty" aria-describedby="sellFTqtyappend"
                                            placeholder="1" step="1" min="1" required readonly>
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
                                    <div class="input-group has-validation">
                                        <input type="number"
                                            class="form-control text-info"
                                            id="sellFTprice" aria-describedby="sellFTpriceappend"
                                            placeholder="0.000" step="0.001" min="0.001" required>
                                        <span
                                            class="input-group-text"
                                            id="sellFTpriceappend">DLUX</span>
                                        <div class="invalid-feedback"> Please enter the
                                            amount
                                            of DLUX you'd like to receive. </div>
                                    </div>
                                </div>
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
                                    <div class="input-group has-validation">
                                        <input type="number"
                                            class="form-control text-info"
                                            id="auctionFTprice"
                                            aria-describedby="auctionFTpriceappend"
                                            placeholder="0.000" step="0.001" min="0.001" required>
                                        <span
                                            class="input-group-text"
                                            id="auctionFTqtyappend">DLUX</span>
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
                        <form class="needs-validation mt-4" novalidate>
                            <!--:action="javascript:airdropFT('{{item.data.set}}','{{airdropFTusers.value}}')"-->
                            <div class="row mb-3">
                                <div class="col-12">
                                    <label for="airdropFTusers" class="form-label">Airdrop
                                        to</label>
                                    <div class="input-group has-validation">
                                        <textarea name="paragraph_text" cols="50" rows="2"
                                            class="form-control text-info"
                                            id="airdropFTusers" aria-describedby="airdropFT"
                                            required placeholder="name user-name"></textarea>
                                        <div class="invalid-feedback"> Please enter at
                                            least one
                                            user name to airdrop tokens to. </div>
                                    </div>
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
    emits: ['give', 'trade', 'mint', 'airdrop', 'sell', 'detail', 'auction', 'melt'],
    data() {
        return {
            give: {
                to: '',
                qty: 1,
            },
            trade: {
                to: '',
                qty: 1,
                amount: "1.000"
            },
            sell: {
                qty: 1,
                price: "1.000"
            },
            auction: {
                qty: 1,
                price: "1.000",
                days: 1,
                token: 'HIVE'
            },
            airdrop: {
                to_string: '',
                to_array: [],
                qty_each: 1,
            }
        };
    },
    methods: {
        giveFT() {},
        tradeFT() {},
        mintFT() {},
        airdropFT() {},
        sellFT() {},
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
    },
    mounted() {
    },
};