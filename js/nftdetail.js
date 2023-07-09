export default {
    components: {
    },
    template: `
<div class="modal fade" id="itemModal" tabindex="-1" aria-labelledby="itemModalLabel" :aria-hidden="true">
    <div class="modal-dialog modal-full modal-xl modal-dialog-centered" role="document">
        <div class="modal-content">
            <div class="card bg-dark">
                <div class="card-header border-0 d-flex align-items-center"
                    :style="{'background': color}">
                    <div class="nft-header d-flex">
                        <div class="rounded-pill d-flex align-items-center p-2 me-auto"
                            style="background-color: black">
                            <h2 class="m-0 px-2">{{itemmodal.item.uid}}</h2>
                        </div>
                    </div>
                    <div class="nft-header">
                        <div class="rounded px-2 py-1" style="background: rgba(0,0,0,1)">
                            <a :href="'/nfts/set/' + itemmodal.item.setname + '#' + itemmodal.item.token" class="no-decoration" style="font-size: 1.3em;">
                                <span class="rainbow-text" style="background-image: linear-gradient(rgb(194, 255, 182), rgb(255, 163, 182), rgb(221, 169, 255), rgb(162, 209, 255));
                                -webkit-background-clip: text;
                                -webkit-text-fill-color: transparent; 
                                -moz-background-clip: text;
                                -moz-text-fill-color: transparent;;">
                                    <i class="me-1" :class="[icon]"></i>
                                    <b>{{itemmodal.item.setname}}</b>
                                </span>
                            </a>
                        </div>
                    </div>
                    <div class="nft-header d-flex">
                        <button type="button" class="ms-auto btn-close btn-close-white" data-bs-dismiss="modal"
                        aria-label="Close"></button>
                    </div>
                </div>
                <div class="card-body row d-flex ">
                    <!-- NFT detail col 1 -->
                    <div class="col-lg-6 px-0 px-sm-2">
                        <div class="col-12 px-0 px-sm-2">
                            <!-- NFT img -->
                            <div class="card-img-top"
                                :alt="itemmodal.item.setname + '-' + itemmodal.item.uid">
                                <div v-html="itemmodal.item.HTML"></div>
                                <!--back forward btns-->
                                <div class="card-footer d-flex align-items-center">
                                    <h2><a class="text-muted p-3" href="#/"
                                            @click="modalPrev()"
                                            :class="{'invisible':!itemmodal.index}"><i
                                                class="fas fa-caret-square-left"></i></a>
                                    </h2>
                                    <small class="ms-auto text-muted"><i>Item
                                            {{itemmodal.index + 1}} of
                                            {{NFTselect.auctionOnly || NFTselect.saleOnly ||
                                            NFTselect.sort == 'price' ||
                                            itemmodal.items.length}}</i></small>
                                    <h2 class="ms-auto"><a class="text-muted p-3" href="#/"
                                            @click="modalNext()"><i
                                                class="fas fa-caret-square-right"></i></a>
                                    </h2>
                                </div>
                            </div>
                            <!--pfp-->
                            <div class="text-center my-3" v-if="itemmodal.item.owner == account">
                                <button @click="setPFP(itemmodal.item)" class="btn btn-lg btn-outline-primary" v-if="itemmodal.item.uid != pfp.uid">
                                    <i class="far fa-user-circle me-2"></i>Set as PFP
                                </button>
                                <button class="btn btn-lg btn-secondary" v-if="itemmodal.item.uid == pfp.uid && itemmodal.item.setname == pfp.set">
                                    <i class="far fa-user-circle me-2"></i>Currently set as your PFP
                                </button>
                            </div>
                        </div>
                    </div>
                    <!-- NFT detail col 2 -->
                    <div class="col-lg-6 px-0 px-sm-2">
                        <div class="accordion" id="nftAccordion">
                            <!-- NFT Description -->
                            <div class="accordion-item">
                                <h2 class="accordion-header">
                                    <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseDescription" aria-expanded="true" aria-controls="collapseDescription">
                                        <i class="fas fa-list me-3"></i>DESCRIPTION
                                    </button>
                                </h2>
                                <div id="collapseDescription" class="accordion-collapse collapse show" data-bs-parent="#nftAccordion">
                                    <div class="accordion-body">
                                        <p>{{itemmodal.item.set.Description}}</p>
                                    </div>
                                </div>
                            </div>
                            <!-- NFT Attributes -->
                            <div class="accordion-item">
                                <h2 class="accordion-header">
                                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseAttributes" aria-expanded="false" aria-controls="collapseAttributes">
                                        <i class="fas fa-star me-3"></i>ATTRIBUTES
                                    </button>
                                </h2>
                                <div id="collapseAttributes" class="accordion-collapse collapse" data-bs-parent="#nftAccordion">
                                    <div class="accordion-body">
                                        <div class="d-flex flex-wrap">
                                            <div v-for="thing in itemmodal.item.attributes" class="border border-white rounded d-flex m-1">
                                                <div v-for="(value, key, index) in thing" class="d-flex flex-column p-2">
                                                    <div>{{key}}:</div>
                                                    <div>{{value}}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <!-- NFT Transfer -->
                            <div class="accordion-item" v-if="itemmodal.item.owner == account">
                                <h2 class="accordion-header">
                                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTransfer" aria-expanded="false" aria-controls="collapseTransfer">
                                        <i class="fas fa-exchange-alt me-3"></i>TRANSFER
                                    </button>
                                </h2>
                                <div id="collapseTransfer" class="accordion-collapse collapse" data-bs-parent="#nftAccordion">
                                    <div class="accordion-body">
                                        <div class="border-warning border rounded p-3 my-3" v-if="itemmodal.item.uid == pfp.uid  && itemmodal.item.setname == pfp.set">
                                            <p class="text-warning m-0">Transferring this NFT will remove it from your PFP</p>
                                        </div>
                                        <div class="border border-info bg-darker p-3 rounded col-12">
                                            <div class="container-fluid">
                                                <ul class="nav nav-pills bg-darker justify-content-center" role="tablist">
                                                    <li class="nav-item"> <a class="nav-link active" id="giveNFTlink" role="tab" data-bs-toggle="tab"
                                                    aria-controls="giveNFT" aria-expanded="true" href="#giveNFTtab">Give</a></li>
                                                    <li class="nav-item"> <a class="nav-link" id="tradeNFTlink" role="tab" data-bs-toggle="tab"
                                                    aria-controls="tradeNFT" aria-expanded="true" href="#tradeNFTtab">Trade</a></li>
                                                    <li class="nav-item"> <a class="nav-link" id="sellNFTlink" role="tab" data-bs-toggle="tab"
                                                    aria-controls="sellNFT" aria-expanded="true" href="#sellNFTtab">Sell</a></li>
                                                    <li class="nav-item"> <a class="nav-link" id="auctionNFTlink" role="tab" data-bs-toggle="tab"
                                                    aria-controls="auctionNFT" aria-expanded="true" href="#auctionNFTtab">Auction</a></li>
                                                </ul>
                                                <div class="tab-content">
                                                    <!-- NFT Give -->
                                                    <div role="tabpanel" class="tab-pane fade show active" id="giveNFTtab" aria-labelledby="giveNFT">
                                                        <form class="needs-validation mt-4" id="nftGiveForm" @submit.prevent="validateForm('nftGiveForm', 'nftGiveFormValid');giveNFT()" novalidate>
                                                            <div class="form-row my-2">
                                                                <div class="col-12">
                                                                    <label for="giveNFTusername">Username</label>
                                                                    <div class="input-group has-validation">
                                                                        <span class="input-group-text text-white-50" id="giveNFTuserprep">@</span>
                                                                        <input v-model="give.to" @blur="checkAccount(trade.to, 'nftTradeAllowed')" type="text" class="form-control text-info"
                                                                        id="giveNFTusername" aria-describedby="giveNFTuserprep" required>
                                                                        <div class="invalid-feedback">
                                                                            Please enter the username you'd like to give to.
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div class="text-center">
                                                                <button class="btn btn-info my-2" type="submit">Give</button>
                                                            </div>
                                                        </form>
                                                    </div>
                                                    <!-- NFT Trade -->
                                                    <div role="tabpanel" class="tab-pane fade show" id="tradeNFTtab" aria-labelledby="tradeNFT">
                                                        <form class="needs-validation mt-4" novalidate>
                                                            <div class="form-row my-2">
                                                                <div class="col-12">
                                                                    <label for="tradeNFTusername">Username</label>
                                                                    <div class="input-group has-validation">
                                                                        <span class="input-group-text text-white-50" id="tradeNFTuserprep">@</span>
                                                                        <input type="text" v-model="trade.to" @blur="checkAccount(trade.to, 'nftTradeAllowed')" class="form-control text-info" id="tradeNFTusername" aria-describedby="tradeNFTuserprep" required>
                                                                        <div class="invalid-feedback">
                                                                            Please enter the username you'd like to trade with.
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div class="form-group form-row my-2">
                                                                <label for="tradeNFTamount">Amount</label>
                                                                <small v-if="trade.token == itemmodal.item.token" class="float-end mb-2 align-self-center text-white-50">
                                                                    0% FEE
                                                                </small>
                                                                <small v-else class="float-end mb-2 align-self-center text-white-50">
                                                                    1% FEE
                                                                </small>
                                                                <div class="input-group">
                                                                    <input v-model="trade.price" type="number" class="form-control text-info" id="tradeNFTamount"
                                                                    aria-describedby="tradeNFTamountappend" placeholder="0.000" step="0.001" min="0.001" required>
                                                                    <span class="input-group-text e-radius-hotfix m-0 p-0" id="tradeNFTamountappend">
                                                                        <select v-model="trade.token" class="form-select border-0 text-white-50 w-100 h-100"
                                                                        id="tradeNFTpriceType" aria-label="Trade price type select">
                                                                            <option :value="TOKEN" selected>
                                                                                {{TOKEN}}
                                                                            </option>
                                                                            <option value="HIVE">
                                                                                HIVE
                                                                            </option>
                                                                            <option value="HBD">
                                                                                HBD
                                                                            </option>
                                                                        </select>
                                                                    </span>
                                                                    <div class="invalid-feedback">
                                                                        Please enter the amount of VALUE you'd like to receive.
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div class="text-center">
                                                                <button @click="tradeNFT(itemmodal.item)" id="tradeNFTbutton" class="btn btn-info my-2" type="button">
                                                                    Propose Trade
                                                                </button>
                                                            </div>
                                                        </form>
                                                    </div>
                                                    <!-- NFT Sell -->
                                                    <div role="tabpanel" class="tab-pane fade show " id="sellNFTtab" aria-labelledby="sellNFT">
                                                        <form class="needs-validation mt-4" novalidate>
                                                            <div class="form-group form-row my-2">
                                                                <label for="sellNFTprice">Sale Price</label>
                                                                <small v-if="sell.token == itemmodal.item.token" class="float-end mb-2 align-self-center text-white-50">
                                                                0% FEE</small>
                                                                <small v-else class="float-end mb-2 align-self-center text-white-50">
                                                                1% FEE</small>
                                                                <div class="input-group">
                                                                    <input v-model="sell.price" type="number" class="form-control text-info" id="sellNFTprice"
                                                                    aria-describedby="sellNFTpriceappend" placeholder="0.000" step="0.001" min="0.001" required>
                                                                    <span class="input-group-text e-radius-hotfix m-0 p-0" id="sellNFTpriceappend">
                                                                        <select v-model="sell.token" class="form-select border-0 text-white-50 w-100 h-100"
                                                                        id="sellNFTpriceType" aria-label="Sell price type select">
                                                                        <option :value="TOKEN">
                                                                            {{TOKEN}}
                                                                        </option>
                                                                        <option value="HIVE">
                                                                            HIVE
                                                                        </option>
                                                                        <option value="HBD">
                                                                            HBD
                                                                        </option>
                                                                        </select>
                                                                    </span>
                                                                    <div class="invalid-feedback">
                                                                        Please enter the amount of VALUE you'd like to receive. 
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div class="form-row my-2">
                                                                <p class="text-white-50 small">
                                                                    Ownership will be transferred to the DAO listing service and sold publicly. Cancel anytime to return immediately.
                                                                </p>
                                                            </div>
                                                            <div class="text-center">
                                                                <button @click="sellNFT(itemmodal.item)" id="sellNFTbutton" class="btn btn-info my-2" type="button">
                                                                    List Item
                                                                </button>
                                                            </div>
                                                        </form>
                                                    </div>
                                                    <!-- NFT Auction -->
                                                    <div role="tabpanel" class="tab-pane fade show " id="auctionNFTtab" aria-labelledby="auctionNFT">
                                                        <form class="needs-validation mt-4" novalidate>
                                                            <div class="form-group form-row my-2">
                                                                <label for="auctionNFTprice">Starting Bid</label>
                                                                <small v-if="auction.token == itemmodal.item.token" class="float-end mb-2 align-self-center text-white-50">
                                                                0% FEE</small>
                                                                <small v-else class="float-end mb-2 align-self-center text-white-50">
                                                                1% FEE</small>
                                                                <div class="input-group">
                                                                    <input v-model="auction.amount" type="number" class="form-control text-info" id="auctionNFTprice"
                                                                    aria-describedby="auctionNFTpriceappend" placeholder="0.000" step="0.001" min="0.001" required>
                                                                    <span class="input-group-text e-radius-hotfix m-0 p-0" id="auctionNFTpriceappend">
                                                                        <select v-model="auction.token" class="form-select border-0 text-white-50 w-100 h-100"
                                                                        id="auctionNFTpriceType" aria-label="Auction price type select">
                                                                            <option :value="TOKEN" selected>
                                                                                {{TOKEN}}
                                                                            </option>
                                                                            <option value="HIVE">
                                                                                HIVE
                                                                            </option>
                                                                            <option value="HBD">
                                                                                HBD
                                                                            </option>
                                                                        </select>
                                                                    </span>
                                                                    <div class="invalid-feedback">
                                                                        Please enter the amount of VALUE you'd like to start the bidding.
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div class="d-flex justify-content-around">
                                                                <div class="form-row my-2 d-flex align-items-center">
                                                                    <label for="auctionNFTdays" class="m-0">Duration:</label>
                                                                    <select v-model="auction.time" class="mx-2 btn btn-lg btn-secondary" id="auctionNFTdays" required>
                                                                        <option value="1">
                                                                            1 Day
                                                                        </option>
                                                                        <option value="2">
                                                                            2 Days
                                                                        </option>
                                                                        <option value="3">
                                                                            3 Days
                                                                        </option>
                                                                        <option value="4">
                                                                            4 Days
                                                                        </option>
                                                                        <option value="5">
                                                                            5 Days
                                                                        </option>
                                                                        <option value="6">
                                                                            6 Days
                                                                        </option>
                                                                        <option value="7" selected>
                                                                            7 Days
                                                                        </option>
                                                                    </select>
                                                                </div>
                                                            </div>
                                                            <div class="form-row my-2">
                                                                <p class="text-white-50 small">
                                                                    Ownership will be transferred to the DAO listing service and auctioned publicly. Once submitted this cannot 
                                                                    be cancelled. If there are no bids at the end of the auction period, it will be returned to you immediately.
                                                                </p>
                                                            </div>
                                                            <div class="text-center">
                                                                <button @click="auctionNFT(itemmodal.item)" class="btn btn-info my-2" type="button">
                                                                    List Item
                                                                </button>
                                                            </div>
                                                        </form>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <!-- NFT Melt -->
                            <div class="accordion-item">
                                <h2 class="accordion-header">
                                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseMelt" aria-expanded="false" aria-controls="collapseMelt">
                                        <i class="fa-solid fa-fire me-3"></i>MELT<span
                                        class="ms-2 small">({{chains[itemmodal.item.token]
                                        ?
                                        precision(chains[itemmodal.item.token].sets[itemmodal.item.setname].bond.amount,
                                        chains[itemmodal.item.token].sets[itemmodal.item.setname].bond.precision)
                                        : 0 }}
                                        {{chains[itemmodal.item.token]?
                                        chains[itemmodal.item.token].sets[itemmodal.item.setname].bond.token
                                        :
                                        ''}})</span>
                                    </button>
                                </h2>
                                <div id="collapseMelt" class="accordion-collapse collapse" data-bs-parent="#nftAccordion">
                                    <div class="accordion-body">
                                        <div class="text-center" v-if="itemmodal.item.owner != account">
                                            <p>The onwer of this NFT can "melt" it and recieve it's melt value.</p>
                                        </div>
                                        <div class="p-0" v-if="itemmodal.item.owner == account">
                                            <div class="d-flex align-self-end">
                                                <div class="border border-warning rounded bg-darker col-12 p-4">
                                                    <div class="d-flex align-items-center justify-content-between">
                                                        <div class="d-flex me-1">
                                                            <h4>Melt Value:</h4>
                                                        </div>
                                                        <div class="d-flex no-wrap ms-1">
                                                            <h1>
                                                            {{chains[itemmodal.item.token]
                                                            ?
                                                            precision(chains[itemmodal.item.token].sets[itemmodal.item.setname].bond.amount,
                                                            chains[itemmodal.item.token].sets[itemmodal.item.setname].bond.precision)
                                                            : 0 }}
                                                            {{chains[itemmodal.item.token]?
                                                            chains[itemmodal.item.token].sets[itemmodal.item.setname].bond.token
                                                            :
                                                            ''}}</h1>
                                                        </div>
                                                    </div>
                                                    <div class="pt-2">
                                                    <p class="text-uppercase text-muted">This NFT can be traded, sold, or auctioned until melted. Once melted it will disappear forever.</p>
                                                    <div class="d-flex justify-content-around">
                                                        <div class="d-flex align-items-center my-4">
                                                            <div class="text-center p-4">
                                                                <h1 class="text-warning" style="font-size: 4em">
                                                                    <i class="fas fa-exclamation-triangle"></i>
                                                                </h1>
                                                            </div>
                                                            <ul>
                                                                <li>This action cannot be undone</li>
                                                                <li>Your NFT will be deleted
                                                                </li>
                                                                <li>You will receive the melt value</li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                    <div class="text-center pb-4">
                                                        <button type="button" class="btn btn-warning" data-bs-toggle="collapse" href="#melt-confirmation">
                                                            Melt
                                                        </button>
                                                    </div>
                                                    <div class="collapse bg-danger rounded"
                                                    id="melt-confirmation">
                                                    <div class="text-center pt-4">
                                                        <h2><b>/////// IRREVERSIBLE
                                                                \\\\\\\</b></h2>
                                                        <p>Are you sure you want to
                                                            proceed?</p>
                                                    </div>
                                                    <div class="d-flex justify-content-around p-3">
                                                        <button class="btn btn-secondary"
                                                            data-bs-toggle="collapse"
                                                            href="#melt-confirmation">CANCEL
                                                            <i class="fas fa-running"></i></button>
                                                        <button @click="meltNFT(itemmodal.item)"
                                                            class="btn btn-danger border-white">DESTROY
                                                            <i class="fas fa-bomb"></i>
                                                            <span
                                                                class="spinner-border spinner-border-sm d-none"
                                                                role="status"
                                                                aria-hidden="true"></span></button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                    </div>
                                </div>
                            </div>
                            <!-- NFT Bid -->
                            <div class="accordion-item" v-if="itemmodal.item.owner == 'ah' || itemmodal.item.owner == 'hh'">
                                <h2 class="accordion-header">
                                    <button @click="auctionData('itemmodal')" class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseBid" aria-expanded="true" aria-controls="collapseBid">
                                    <i class="fas fa-comment-dollar me-3"></i><span>BID
                                    NOW</span><span
                                    class="small ms-2">({{naiString(itemmodal.auction.price)}})</span>
                                    </button>
                                </h2>
                                <div id="collapseBid" class="accordion-collapse collapse show" data-bs-parent="#nftAccordion">
                                    <div class="accordion-body">
                                    <div class="d-flex align-self-end">
                                    <div
                                        class="border border-warning rounded bg-darker col-12 p-4">
                                        <div
                                            class="d-flex align-items-center justify-content-between">
                                            <div class="d-flex me-1">
                                                <h4>Current
                                                    Bid:{{naiString(itemmodal.auction.price)}}
                                                </h4>
                                            </div>
                                            <div class="d-flex no-wrap ms-1"> <u>
                                                    <h4>
                                                        Number of
                                                        Bids:{{itemmodal.auction.bids}}
                                                    </h4>
                                                </u></div>
                                        </div>
                                        <div class="pt-2">
                                            <p class="text-uppercase text-muted">
                                            </p>
                                            <div class="d-flex justify-content-around">
                                                <div class="d-flex align-items-center my-4">
                                                    <div class="text-center p-4">
                                                        <h1 class="text-warning"
                                                            style="font-size: 4em">
                                                            <i class="fa-solid fa-gavel"></i>
                                                        </h1>
                                                    </div>
                                                    <ul>
                                                        <li>Time Left:
                                                            {{itemmodal.auction.time}}
                                                        </li>
                                                        <li>Opening Price:
                                                            {{naiString(itemmodal.auction.initial_price)}}
                                                        </li>
                                                        <li>Seller:
                                                            {{itemmodal.auction.by}}
                                                        </li>
                                                        <li>Bidder:
                                                            {{itemmodal.auction.bidder}}
                                                        </li>
                                                        <li>Days:
                                                            {{itemmodal.auction.days}}
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                            <div class="text-center pb-4">
                                                <form class="needs-validation mt-4" novalidate>
                                                    <label for="bidNFTprice">Bid</label>
                                                    <div class="input-group">
                                                        <input v-model="auction.amount"
                                                            type="number"
                                                            class="form-control bg-dark border-dark text-info"
                                                            id="auctionNFTprice"
                                                            aria-describedby="bidNFTpriceappend"
                                                            placeholder="0.000" step="0.001"
                                                            :min="(itemmodal.auction.price.amount + (itemmodal.auction.bids ? 1 : 0))/ 1000"
                                                            required>
                                                        <div class="input-group-append">
                                                            <span
                                                                class="input-group-text bg-dark border-dark text-white-50 r-radius-hotfix m-0"
                                                                id="bidNFTpriceappend">
                                                                {{itemmodal.auction.price.token}}
                                                            </span>
                                                            <div>
                                                                <div class="invalid-feedback">
                                                                    Please enter the
                                                                    amount of
                                                                    VALUE you'd like
                                                                    to start the
                                                                    bidding. </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button @click="bidNFT(itemmodal.item)"
                                                        type="button" class="btn btn-warning"
                                                        data-bs-toggle="collapse" href="#/">Bid
                                                    </button>
                                                </form>
                                            </div>
                                        </div>
                                    </div>
                                </div> 
                                    </div>
                                </div>
                            </div>
                            <!-- NFT Buy -->
                            <div class="accordion-item" v-if="itemmodal.item.sale">
                                <h2 class="accordion-header">
                                    <button  @click="saleData('itemmodal')" class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseBuy" aria-expanded="true" aria-controls="collapseBuy">
                                    <i class="fas fa-money-bill-wave me-3"></i><span>BUY
                                    NOW</span><span
                                    class="small ms-2">({{naiString(itemmodal.item.price)}})</span>
                                    </button>
                                </h2>
                                <div id="collapseBuy" class="accordion-collapse collapse show" data-bs-parent="#nftAccordion">
                                    <div class="accordion-body">
                                    <div class="d-flex align-self-end">
                                    <div
                                        class="border border-warning rounded bg-darker col-12 p-4">
                                        <div
                                            class="d-flex align-items-center justify-content-between">
                                            <div class="d-flex me-1">
                                                <h4>Price:
                                                    {{naiString(itemmodal.item.price)}}
                                                </h4>
                                            </div>
                                            <div class="d-flex no-wrap ms-1">
                                                <h4>
                                                    Seller: @{{itemmodal.item.by}}
                                                </h4>
                                            </div>
                                        </div>
                                        <div class="pt-2">
                                            <p class="text-uppercase text-muted">
                                            </p>
                                            <div class="d-flex justify-content-around">
                                                <!-- long name, script, set, uid only other buy data -->
                                            </div>
                                            <div class="text-center pb-4">
                                                <button v-if="itemmodal.item.by != account"
                                                    type="button" class="btn btn-warning"
                                                    @click="buyNFT()"
                                                    href="#/">Buy </button>
                                                <button v-else type="button"
                                                    class="btn btn-warning"
                                                    @click="cancelNFT()"
                                                    href="#/">Cancel </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>`,
    props: {
        chains: {
            required: true,
            default: function () {
                return {
                };
            },
        },
        itemmodal: {
            required: true,
            default: function () {
                return {
                    script: '',
                };
            },
        },
        pfp: {
            default: function () {
                return {
                    uid: '',
                };
            },
        },
        wrapped: {
            default: ''
        },
        uid: {
            default: ''
        },
        pfp: {
            default: function () {
                return {
                };
            },
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
                token: 'hive'
            },
            auction: {
                qty: 1,
                price: "1.000",
                days: 7,
                token: 'hive'
            },
            airdrop: {
                to_string: '',
                to_array: [],
                qty_each: 1,
            },
            TOKEN: '',
            nftTradeAllowed: false,
            nftGiveFormValid: false,
            NFTselect: {
                start: 0,
                amount: 30,
                searchTerm: "",
                searchDefault: "Search UIDs and Owners",
                searchDeep: false,
                searchDeepKey: "",
                searchDeepK: false,
                saleOnly: false,
                auctionOnly: false,
                dir: "asc",
                sort: "uid",
                showDeleted: false,
                searching: false,
            },
            isMountedComponent: false,
        };
    },
    computed: {
        color(){
            return `linear-gradient(${this.itemmodal.item.set.Color1},${this.itemmodal.item.set.Color2 ? this.itemmodal.item.set.Color2 : this.itemmodal.item.set.Color1})`;
        },
        icon() {
            return this.itemmodal.item.set.faicon;
        }
    },
    methods: {
        validateForm(formKey, validKey) {
            var Container = document.getElementById(formKey);
            if (Container.querySelector('input:invalid'))
              this[validKey] = false;
            //querySelector('input:invalid[name="pwd"]')
            else this[validKey] = true;
          },
        checkAccount(name, key) {
            fetch("https://anyx.io", {
              body: `{\"jsonrpc\":\"2.0\", \"method\":\"condenser_api.get_accounts\", \"params\":[[\"${this[name]}\"]], \"id\":1}`,
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              method: "POST",
            })
              .then((r) => {
                return r.json();
              })
              .then((re) => {
                if (re.result.length) this[key] = true;
                else this[key] = false;
              });
        },
        buyNFT() {
            if(this.itemmodal.item.price.token == 'HIVE' || this.itemmodal.item.price.token == "HBD") this.$emit('tosign', {
                type: "xfr",
                cj: {
                  to: this.chains[this.itemmodal.item.token].multisig,
                  [this.itemmodal.item.price.token.toLowerCase()]: this.itemmodal.item.price.amount,
                  memo: `NFTbuy ${this.itemmodal.item.setname}:${this.itemmodal.item.uid}`,
                },
                txid: "sendhive",
                msg: `Buying ${this.itemmodal.item.setname}:${this.itemmodal.item.uid}`,
                api: "https://spktest.dlux.io",
                ops: ["getTokenUser"],
              });
            else this.$emit('tosign', {
                type: 'cja',
                cj: {
                    set: this.itemmodal.item.setname,
                    uid: this.itemmodal.item.uid,
                    price: this.itemmodal.item.price.amount,
                  },
                id: `${this.itemmodal.item.token}_nft_buy`,
                msg: `Buying ${this.itemmodal.item.setname}:${this.itemmodal.item.uid}`,
                ops: ["getTokenUser"],
                api: "https://spktest.dlux.io",
                txid: `${this.itemmodal.item.setname}:${this.itemmodal.item.uid}_nft_buy`
            });
        },
        cancelNFT() {
            this.$emit('tosign', {
                type: 'cja',
                cj: {
                    set: this.itemmodal.item.setname,
                    uid: this.itemmodal.item.uid,
                  },
                id: `${this.itemmodal.item.token}_nft_sell_${(this.itemmodal.item.price.token == 'HIVE' || this.itemmodal.item.price.token == "HBD") ? 'h' : ''}cancel`,
                msg: `Canceling ${this.itemmodal.item.setname}:${this.itemmodal.item.uid}`,
                ops: ["getTokenUser"],
                api: "https://spktest.dlux.io",
                txid: `${this.itemmodal.item.setname}:${this.itemmodal.item.uid}_nft_cancel`
            });
        },
        giveNFT(){
            const toSign = {
                type: "cja",
                cj: {
                    set: this.itemmodal.item.setname,
                    uid: this.itemmodal.item.uid,
                    to: this.give.to,
                },
                id: `${this.itemmodal.item.token}_nft_transfer`,
                msg: `Giving ${this.itemmodal.item.setname}:${this.itemmodal.item.uid} mint token...`,
                ops: ["getTokenUser"],
                api: "https://spktest.dlux.io",
                txid: `${this.itemmodal.item.token}_nft_transfer_${this.give.to}`,
              }
              this.$emit('tosign', toSign)
        },
        tradeFT() { },
        mintFT() { },
        airdropFT() { },
        sellFT() { },
        modalIndex(name) {
            this.$emit('detail', name);
        },
        precision(num, precision) {
            return parseFloat(num / Math.pow(10, precision)).toFixed(precision);
        },
        getSetDetailsColors(s) {
            let r = "chartreuse,lawngreen";
            if (s && s.set) {
                try {
                    r = `${s.set.Color1},${s.set.Color2 ? s.set.Color2 : s.set.Color1}`;
                } catch (e) {
                    console.log(e);
                    r = "chartreuse,lawngreen";
                }
            }
            return `linear-gradient(${r})`;
        },
        naiString(nai) {
            return `${parseFloat(nai.amount / Math.pow(10, nai.precision)).toFixed(
                nai.precision
              )} ${nai.token}`;
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
        modalPrev(){
            if(this.itemmodal.index > 0) this.itemmodal.index = this.itemmodal.index - 1
            else this.itemmodal.index = this.itemmodal.items.length - 1
            this.itemmodal.item = this.itemmodal.items[this.itemmodal.index]
        },
        modalNext(){
            if(this.itemmodal.index < this.itemmodal.items.length - 1) this.itemmodal.index = this.itemmodal.index + 1
            else this.itemmodal.index = 0
            this.itemmodal.item = this.itemmodal.items[this.itemmodal.index]
        }
    },
    mounted() {
        this.isMountedComponent = true;
    },
};