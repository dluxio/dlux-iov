export default {
    components: {
    },
    template: `
<div class="modal fade " id="itemModal" tabindex="-1" role="dialog"
        aria-hidden="true" v-if="itemmodal.item.uid">
    <div class="modal-dialog modal-full modal-xl modal-dialog-centered" role="document">
       <div class="modal-content bg-dark text-white">
          <div class="card text-white bg-dark ">
             <div class="card-header border-0 d-flex align-items-center justify-content-between"
                :style="{'background': getSetDetailsColors(itemmodal.item.script)}">
                <div class="rounded-pill d-flex align-items-center p-2"
                   style="background-color: black">
                   <h2 class="m-0 px-2">{{itemmodal.item.uid}}</h2>
                </div>
                <h3 class="card-title lead border border-dark rounded p-2 mb-0"><a
                   class="no-decoration" :href="'/nfts/set/'+ itemmodal.item.setname"
                   style="color:black;">{{itemmodal.item.setname}}
                   NFT</a>
                </h3>
                <button type="button" class="btn-close" data-bs-dismiss="modal"
                   aria-label="Close"></button>
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
                               @click="modalPrev('itemmodal')"
                               :class="{'invisible':!itemmodal.index}"><i
                               class="fas fa-caret-square-left"></i></a>
                            </h2>
                            <small class="ms-auto text-muted"><i>Item
                            {{itemmodal.index + 1}} of
                            {{NFTselect.auctionOnly || NFTselect.saleOnly ||
                            NFTselect.sort == 'price' ||
                            itemmodal.items.length}}</i></small>
                            <h2 class="ms-auto"><a class="text-muted p-3" href="#/"
                               @click="modalNext('itemmodal', 'item')"><i
                               class="fas fa-caret-square-right"></i></a>
                            </h2>
                         </div>
                      </div>
                   </div>
                </div>
                <!-- NFT detail col 2 -->
                <div class="col-lg-6 px-0 px-sm-2">
                   <!--pfp-->
                   <div class="text-center my-3" v-if="itemmodal.item.owner == account">
                      <button @click="setPFP(itemmodal.item)"
                         class="btn btn-lg btn-outline-primary"
                         v-if="itemmodal.item.uid != pfp.uid"><i
                         class="far fa-user-circle me-2"></i>Set as
                      PFP
                      </button>
                      <button class="btn btn-lg btn-secondary"
                         v-if="itemmodal.item.uid == pfp.uid && itemmodal.item.setname == pfp.set"><i
                         class="far fa-user-circle me-2"></i>Currently set as
                      your
                      PFP
                      </button>
                   </div>
                   <!-- NFT Accordion -->
                   <div id="accordion" class="col-12 px-0 px-sm-2">
                      <!-- NFT DESCRIPTION -->
                      <div class="card bg-dark text-white">
                         <div class="card-header" id="headingDescription">
                            <h5 class="mb-0">
                               <button class="btn btn-link text-primary no-decoration"
                                  data-bs-toggle="collapse"
                                  data-bs-target="#collapseDescription" aria-expanded="true"
                                  aria-controls="collapseDescription"><i
                                  class="fas fa-list me-3"></i>DESCRIPTION</button>
                            </h5>
                         </div>
                         <div id="collapseDescription" class="collapse"
                            aria-labelledby="headingDescription" data-parent="#accordion">
                            <div class="card-body">
                               <p>{{itemmodal.item.set.Description}}</p>
                               </p>
                            </div>
                         </div>
                      </div>
                      <!-- NFT ATTRIBUTES -->
                      <div class="card bg-dark text-white">
                         <div class="card-header" id="headingAttributes">
                            <h5 class="mb-0">
                               <button
                                  class="btn btn-link collapsed text-success no-decoration"
                                  data-bs-toggle="collapse"
                                  data-bs-target="#collapseAttributes" aria-expanded="false"
                                  aria-controls="collapseAttributes"><i
                                  class="fas fa-star me-3"></i>ATTRIBUTES
                               </button>
                            </h5>
                         </div>
                         <div id="collapseAttributes" class="collapse"
                            aria-labelledby="headingAttributes" data-parent="#accordion">
                            <div class="card-body">
                               <div class="d-flex flex-wrap">
                                  <div v-for="thing in itemmodal.item.attributes"
                                     class="border border-white rounded d-flex mx-2 my-2">
                                     <div v-for="(value, key, index) in thing" class="p-2">
                                        <div class="">{{key}}:</div>
                                        <div class="">{{value}}</div>
                                     </div>
                                  </div>
                                  <!-- <div v-for="thing in itemmodal.item.comp.attributes"
                                     class="border border-white rounded d-flex mx-2 my-2">
                                     <div v-for="(value, key, index) in thing"
                                         class="p-2">
                                         <div class="">{{key}}:</div>
                                         <div class="">{{value}}</div>
                                     </div>
                                     </div> -->
                               </div>
                            </div>
                         </div>
                      </div>
                      <!-- TRANSFER NFT -->
                      <div class="card bg-dark text-white" style="width: 100"
                         v-if="itemmodal.item.owner == account">
                         <div class="card-header" id="headingMarket">
                            <h5 class="mb-0">
                               <button class="btn btn-link collapsed text-info no-decoration"
                                  data-bs-toggle="collapse" data-bs-target="#collapseMarket"
                                  aria-expanded="false" aria-controls="collapseMarket"><i
                                  class="fas fa-exchange-alt me-3"></i>TRANSFER</button>
                            </h5>
                         </div>
                         <div id="collapseMarket" class="collapse"
                            aria-labelledby="headingMarket" data-parent="#accordion">
                            <!-- <div class="card-body bg-dark text-white-50 text-center"
                               v-if="itemmodal.item.owner != account">
                               <p>You don't own this NFT</p>
                               </div> -->
                            <div class="card-body p-0 bg-dark text-white">
                               <div class="border-warning border rounded p-3 my-3"
                                  v-if="itemmodal.item.uid == pfp.uid  && itemmodal.item.setname == pfp.set">
                                  <p class="text-warning m-0">Transferring this
                                     NFT will remove it from your PFP
                                  </p>
                               </div>
                               <div
                                  class="border border-info bg-darker mx-auto px-5 py-3 rounded col-12">
                                  <div class="container-fluid">
                                     <ul class="nav nav-pills bg-darker justify-content-center"
                                        role="tablist">
                                        <li class="nav-item"> <a class="nav-link active"
                                           id="giveNFTlink" role="tab"
                                           data-bs-toggle="tab" aria-controls="giveNFT"
                                           aria-expanded="true"
                                           href="#giveNFTtab">Give</a></li>
                                        <li class="nav-item"> <a class="nav-link"
                                           id="tradeNFTlink" role="tab"
                                           data-bs-toggle="tab"
                                           aria-controls="tradeNFT"
                                           aria-expanded="true"
                                           href="#tradeNFTtab">Trade</a>
                                        </li>
                                        <li class="nav-item"> <a class="nav-link"
                                           id="sellNFTlink" role="tab"
                                           data-bs-toggle="tab" aria-controls="sellNFT"
                                           aria-expanded="true"
                                           href="#sellNFTtab">Sell</a></li>
                                        <li class="nav-item"> <a class="nav-link"
                                           id="auctionNFTlink" role="tab"
                                           data-bs-toggle="tab"
                                           aria-controls="auctionNFT"
                                           aria-expanded="true"
                                           href="#auctionNFTtab">Auction</a>
                                        </li>
                                     </ul>
                                     <div class="tab-content">
                                        <div role="tabpanel"
                                           class="tab-pane fade show active"
                                           id="giveNFTtab" aria-labelledby="giveNFT">
                                           <form class="needs-validation mt-4" validate>
                                              <div class="form-row my-2">
                                                 <div class="col-12">
                                                    <label
                                                       for="giveNFTusername">Username</label>
                                                    <div class="input-group">
                                                       <div
                                                          class="input-group-prepend">
                                                          <span
                                                             class="input-group-text bg-dark border-dark text-white-50"
                                                             id="giveNFTuserprep">@</span>
                                                       </div>
                                                       <input v-model="nftTradeTabTo"
                                                          @blur="checkAccount(nftTradeTabTo, 'nftTradeAllowed')"
                                                          type="text"
                                                          class="form-control bg-dark border-dark text-info r-radius-hotfix"
                                                          id="giveNFTusername"
                                                          aria-describedby="giveNFTuserprep"
                                                          required>
                                                       <div class="invalid-feedback">
                                                          Please enter the
                                                          username you'd
                                                          like to give
                                                          to.
                                                       </div>
                                                    </div>
                                                 </div>
                                              </div>
                                              <div class="text-center">
                                                 <button @click="giveNFT(itemmodal.item)"
                                                    id="giveNFTbutton"
                                                    class="btn btn-info my-2"
                                                    type="submit">Give</button>
                                              </div>
                                           </form>
                                        </div>
                                        <div role="tabpanel" class="tab-pane fade show"
                                           id="tradeNFTtab" aria-labelledby="tradeNFT">
                                           <form class="needs-validation mt-4" validate>
                                              <div class="form-row my-2">
                                                 <div class="col-12">
                                                    <label
                                                       for="tradeNFTusername">Username</label>
                                                    <div class="input-group">
                                                       <div
                                                          class="input-group-prepend">
                                                          <span
                                                             class="input-group-text bg-dark border-dark text-white-50"
                                                             id="tradeNFTuserprep">@</span>
                                                       </div>
                                                       <input type="text"
                                                          v-model="nftTradeTabTo"
                                                          @blur="checkAccount(nftTradeTabTo, 'nftTradeAllowed')"
                                                          class="form-control bg-dark border-dark text-info r-radius-hotfix"
                                                          id="tradeNFTusername"
                                                          aria-describedby="tradeNFTuserprep"
                                                          required>
                                                       <div class="invalid-feedback">
                                                          Please enter the
                                                          username you'd
                                                          like to trade
                                                          with.
                                                       </div>
                                                    </div>
                                                 </div>
                                              </div>
                                              <div class="form-group form-row my-2">
                                                 <label
                                                    for="tradeNFTamount">Amount</label>
                                                 <small v-if="nftTradeTabToken == TOKEN"
                                                    class="ms-auto mb-2 align-self-center text-white-50">0%
                                                 FEE</small>
                                                 <small v-else
                                                    class="ms-auto mb-2 align-self-center text-white-50">1%
                                                 FEE</small>
                                                 <div class="input-group">
                                                    <input v-model="nftTradeTabPrice"
                                                       type="number"
                                                       class="form-control bg-dark border-dark text-info"
                                                       id="tradeNFTamount"
                                                       aria-describedby="tradeNFTamountappend"
                                                       placeholder="0.000" step="0.001"
                                                       min="0.001" required>
                                                    <div class="input-group-append">
                                                       <span
                                                          class="input-group-text bg-dark border-dark r-radius-hotfix m-0"
                                                          id="tradeNFTamountappend">
                                                          <select
                                                             v-model="nftTradeTabToken"
                                                             class="form-select border-0 text-white-50 bg-dark w-100 h-100"
                                                             id="tradeNFTpriceType"
                                                             aria-label="Trade price type select">
                                                             <option :value="TOKEN"
                                                                selected>
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
                                                    </div>
                                                    <div class="invalid-feedback">
                                                       Please enter the
                                                       amount of
                                                       VALUE you'd like to
                                                       receive. 
                                                    </div>
                                                 </div>
                                              </div>
                                              <div class="text-center">
                                                 <button
                                                    @click="tradeNFT(itemmodal.item)"
                                                    id="tradeNFTbutton"
                                                    class="btn btn-info my-2"
                                                    type="submit">Propose
                                                 Trade</button>
                                              </div>
                                           </form>
                                        </div>
                                        <div role="tabpanel" class="tab-pane fade show "
                                           id="sellNFTtab" aria-labelledby="sellNFT">
                                           <form class="needs-validation mt-4" validate>
                                              <div class="form-group form-row my-2">
                                                 <label for="sellNFTprice">Sale
                                                 Price</label>
                                                 <small v-if="nftSellTabToken == TOKEN"
                                                    class="ms-auto mb-2 align-self-center text-white-50">0%
                                                 FEE</small>
                                                 <small v-else
                                                    class="ms-auto mb-2 align-self-center text-white-50">1%
                                                 FEE</small>
                                                 <div class="input-group">
                                                    <input v-model="nftSellTabPrice"
                                                       type="number"
                                                       class="form-control bg-dark border-dark text-info"
                                                       id="sellNFTprice"
                                                       aria-describedby="sellNFTpriceappend"
                                                       placeholder="0.000" step="0.001"
                                                       min="0.001" required>
                                                    <div class="input-group-append">
                                                       <span
                                                          class="input-group-text bg-dark border-dark r-radius-hotfix m-0"
                                                          id="sellNFTpriceappend">
                                                          <select
                                                             v-model="nftSellTabToken"
                                                             class="form-select border-0 text-white-50 bg-dark w-100 h-100"
                                                             id="sellNFTpriceType"
                                                             aria-label="Sell price type select">
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
                                                    </div>
                                                    <div class="invalid-feedback">
                                                       Please enter the
                                                       amount of VALUE
                                                       you'd like to
                                                       receive. 
                                                    </div>
                                                 </div>
                                              </div>
                                              <div class="form-row my-2">
                                                 <p class="text-white-50 small">
                                                    Ownership will be
                                                    transferred to the DAO
                                                    listing
                                                    service and sold
                                                    publicly. Cancel anytime
                                                    to return immediately.
                                                 </p>
                                              </div>
                                              <div class="text-center">
                                                 <button @click="sellNFT(itemmodal.item)"
                                                    id="sellNFTbutton"
                                                    class="btn btn-info my-2"
                                                    type="submit">List
                                                 Item</button>
                                              </div>
                                           </form>
                                        </div>
                                        <div role="tabpanel" class="tab-pane fade show "
                                           id="auctionNFTtab" aria-labelledby="auctionNFT">
                                           <form class="needs-validation mt-4" novalidate>
                                              <div class="form-group form-row my-2">
                                                 <label for="auctionNFTprice">Starting
                                                 Bid</label>
                                                 <small
                                                    v-if="nftAuctionTabToken == TOKEN"
                                                    class="ms-auto mb-2 align-self-center text-white-50">0%
                                                 FEE</small>
                                                 <small v-else
                                                    class="ms-auto mb-2 align-self-center text-white-50">1%
                                                 FEE</small>
                                                 <div class="input-group">
                                                    <input v-model="nftAuctionTabPrice"
                                                       type="number"
                                                       class="form-control bg-dark border-dark text-info"
                                                       id="auctionNFTprice"
                                                       aria-describedby="auctionNFTpriceappend"
                                                       placeholder="0.000" step="0.001"
                                                       min="0.001" required>
                                                    <div class="input-group-append">
                                                       <span
                                                          class="input-group-text bg-dark border-dark r-radius-hotfix m-0"
                                                          id="auctionNFTpriceappend">
                                                          <select
                                                             v-model="nftAuctionTabToken"
                                                             class="form-select border-0 text-white-50 bg-dark w-100 h-100"
                                                             id="auctionNFTpriceType"
                                                             aria-label="Auction price type select">
                                                             <option :value="TOKEN"
                                                                selected>
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
                                                    </div>
                                                    <div class="invalid-feedback">
                                                       Please enter the
                                                       amount of
                                                       VALUE you'd like to
                                                       start the bidding.
                                                    </div>
                                                 </div>
                                              </div>
                                              <div class="d-flex justify-content-around">
                                                 <div
                                                    class="form-row my-2 d-flex align-items-center">
                                                    <label for="auctionNFTdays"
                                                       class="m-0">Duration:
                                                    </label>
                                                    <select v-model="nftAuctionTabTime"
                                                       class="mx-2 btn btn-lg btn-secondary"
                                                       id="auctionNFTdays" required>
                                                       <option value="1">1
                                                          Day
                                                       </option>
                                                       <option value="2">2
                                                          Days
                                                       </option>
                                                       <option value="3">3
                                                          Days
                                                       </option>
                                                       <option value="4">4
                                                          Days
                                                       </option>
                                                       <option value="5">5
                                                          Days
                                                       </option>
                                                       <option value="6">6
                                                          Days
                                                       </option>
                                                       <option value="7" selected>7
                                                          Days
                                                       </option>
                                                    </select>
                                                 </div>
                                              </div>
                                              <div class="form-row my-2">
                                                 <p class="text-white-50 small">
                                                    Ownership will be
                                                    transferred to the DAO
                                                    listing
                                                    service and auctioned
                                                    publicly. Once submitted
                                                    this cannot be
                                                    cancelled. If
                                                    there
                                                    are no bids at the end
                                                    of the auction period,
                                                    it will be returned to
                                                    you
                                                    immediately.
                                                 </p>
                                              </div>
                                              <div class="text-center">
                                                 <button
                                                    @click="auctionNFT(itemmodal.item)"
                                                    class="btn btn-info my-2"
                                                    type="submit">List
                                                 Item</button>
                                              </div>
                                           </form>
                                        </div>
                                     </div>
                                  </div>
                               </div>
                            </div>
                         </div>
                      </div>
                      <!-- MELT NFT -->
                      <div class="card bg-dark text-white" v-if="itemmodal.item.owner == account">
                         <div class="card-header" id="headingRedeem">
                            <h5 class="mb-0">
                               <button
                                  class="btn btn-link collapsed text-warning no-decoration"
                                  data-bs-toggle="collapse" data-bs-target="#collapseRedeem"
                                  aria-expanded="false" aria-controls="collapseRedeem"><i
                                  class="fa-solid fa-fire me-3"></i>MELT<span
                                  class="ms-2 small">({{sets[itemmodal.item.token]
                               ?
                               precision(sets[itemmodal.item.token][itemmodal.item.setname].bond.amount,
                               sets[itemmodal.item.token][itemmodal.item.setname].bond.precision)
                               : 0 }}
                               {{sets[itemmodal.item.token]?
                               sets[itemmodal.item.token][itemmodal.item.setname].bond.token
                               :
                               ''}})</span></button>
                            </h5>
                         </div>
                         <div id="collapseRedeem" class="collapse"
                            aria-labelledby="headingRedeem" data-parent="#accordion">
                            <div class="card-body bg-dark text-white-50 text-center"
                               v-if="itemmodal.item.owner != account">
                               <p>You don't own this NFT</p>
                            </div>
                            <div class="card-body p-0" v-if="itemmodal.item.owner == account">
                               <div class="d-flex align-self-end">
                                  <div
                                     class="border border-warning rounded bg-darker col-12 p-4">
                                     <div
                                        class="d-flex align-items-center justify-content-between">
                                        <div class="d-flex me-1">
                                           <h4>Melt Value:</h4>
                                        </div>
                                        <div class="d-flex no-wrap ms-1">
                                           <u>
                                              <h1>
                                                 {{sets[itemmodal.item.token]
                                                 ?
                                                 precision(sets[itemmodal.item.token][itemmodal.item.setname].bond.amount,
                                                 sets[itemmodal.item.token][itemmodal.item.setname].bond.precision)
                                                 : 0 }}
                                                 {{sets[itemmodal.item.token]?
                                                 sets[itemmodal.item.token][itemmodal.item.setname].bond.token
                                                 :
                                                 ''}}
                                              </h1>
                                           </u>
                                        </div>
                                     </div>
                                     <div class="pt-2">
                                        <p class="text-uppercase text-muted">
                                           This NFT can be traded, sold, or
                                           auctioned until
                                           melted. Once melted it will
                                           disappear forever.
                                        </p>
                                        <div class="d-flex justify-content-around">
                                           <div class="d-flex align-items-center my-4">
                                              <div class="text-center p-4">
                                                 <h1 class="text-warning"
                                                    style="font-size: 4em">
                                                    <i
                                                       class="fas fa-exclamation-triangle"></i>
                                                 </h1>
                                              </div>
                                              <ul>
                                                 <li>This action cannot be
                                                    undone
                                                 </li>
                                                 <li>Your NFT will be deleted
                                                 </li>
                                                 <li>You will receive the
                                                    melt value
                                                 </li>
                                              </ul>
                                           </div>
                                        </div>
                                        <div class="text-center pb-4">
                                           <button type="button" class="btn btn-warning"
                                              data-bs-toggle="collapse"
                                              href="#melt-confirmation">Melt
                                           </button>
                                        </div>
                                        <div class="collapse bg-danger rounded"
                                           id="melt-confirmation">
                                           <div class="text-center pt-4">
                                              <h2><b>/////// IRREVERSIBLE
                                                 \\\\\\\</b>
                                              </h2>
                                              <p>Are you sure you want to
                                                 proceed?
                                              </p>
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
                      <!-- Bid NFT -->
                      <div class="card bg-dark text-white"
                         v-if="itemmodal.item.owner == 'ah' || itemmodal.item.owner == 'hh'">
                         <div class="card-header" id="headingAuction">
                            <h5 class="mb-0">
                               <button
                                  class="btn btn-link collapsed text-warning no-decoration d-flex align-items-center"
                                  data-bs-toggle="collapse" @click="auctionData('itemmodal')"
                                  data-bs-target="#collapseAuction" aria-expanded="false"
                                  aria-controls="collapseAuction"><i
                                  class="fas fa-comment-dollar me-3"></i><span>BID
                               NOW</span><span
                                  class="small ms-2">({{naiString(itemmodal.auction.price)}})</span></button>
                            </h5>
                         </div>
                         <div id="collapseAuction" class="collapse show"
                            aria-labelledby="headingAuction" data-parent="#accordion">
                            <div class="card-body p-0">
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
                                        <div class="d-flex no-wrap ms-1">
                                           <u>
                                              <h4>
                                                 Number of
                                                 Bids:{{itemmodal.auction.bids}}
                                              </h4>
                                           </u>
                                        </div>
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
                                                 <input v-model="nftAuctionTabPrice"
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
                                                          bidding. 
                                                       </div>
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
                      <!-- Buy NFT -->
                      <div class="card bg-dark text-white" v-if="itemmodal.item.owner == 'ls'">
                         <div class="card-header" id="headingsale">
                            <h5 class="mb-0">
                               <button
                                  class="btn btn-link collapsed text-warning no-decoration d-flex align-items-center"
                                  data-bs-toggle="collapse" @click="saleData('itemmodal')"
                                  data-bs-target="#collapsesale" aria-expanded="false"
                                  aria-controls="collapsesale"><i
                                  class="fas fa-money-bill-wave me-3"></i><span>BUY
                               NOW</span><span
                                  class="small ms-2">({{naiString(itemmodal.sale.price)}})</span></button>
                            </h5>
                         </div>
                         <div id="collapsesale" class="collapse show"
                            aria-labelledby="headingsale" data-parent="#accordion">
                            <div class="card-body p-0">
                               <div class="d-flex align-self-end">
                                  <div
                                     class="border border-warning rounded bg-darker col-12 p-4">
                                     <div
                                        class="d-flex align-items-center justify-content-between">
                                        <div class="d-flex me-1">
                                           <h4>Price:
                                              {{naiString(itemmodal.sale.price)}}
                                           </h4>
                                        </div>
                                        <div class="d-flex no-wrap ms-1">
                                           <h4>
                                              Seller: @{{itemmodal.sale.by}}
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
                                           <button v-if="itemmodal.sale.by != account"
                                              type="button" class="btn btn-warning"
                                              @click="buyNFT(itemmodal.sale)"
                                              href="#/">Buy </button>
                                           <button v-else type="button"
                                              class="btn btn-warning"
                                              @click="cancelNFT(itemmodal.sale)"
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
        itemmodal: {
            required: true,
            default: function () {
                return {
                    script: '',
                };
            },
        },
        sets: {
            required: true,
            default: function () {
                return {
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
            },
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
              }
        };
    },
    methods: {
        giveFT() { },
        tradeFT() { },
        mintFT() { },
        airdropFT() { },
        sellFT() { },
        modalIndex(name) {
            this.$emit('detail', name);
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