export default {
    components: {
    },
    template: `
    <div class="modal fade" id="itemModal" tabindex="-1" aria-labelledby="itemModalLabel" :aria-hidden="true">
    <div class="modal-dialog modal-full modal-xl modal-dialog-centered" role="document">
       <div class="modal-content rounded bg-img-none">
          <div class="card bg-img-none bg-blur-none">
             <div class="card-header border-0 d-flex align-items-center" :style="{'background': color}">
                <div class="nft-header">
                   <div class="me-auto rounded px-2 py-1" style="background: rgba(0,0,0,1)">
                      <a :href="'/nfts/set/' + itemmodal.item.setname + '#' + itemmodal.item.token" class="no-decoration"
                         style="font-size: 1.3em;">
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
                   <div class="rounded-pill d-flex align-items-center p-2" style="background-color: black">
                      <h2 class="m-0 px-2">{{itemmodal.item.uid}}</h2>
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
                      <div :alt="itemmodal.item.setname + '-' + itemmodal.item.uid">
                         <div class="mb-2" v-html="sanitizeHTML(itemmodal.item.HTML)"></div>
                         <div class="d-flex mb-3 align-items-center"
                            :alt="itemmodal.item.setname + '-' + itemmodal.item.uid">
                            <h3 class="m-0" :style="{'background-image': color}" style="-webkit-background-clip: text;
                                        -webkit-text-fill-color: transparent; 
                                        -moz-background-clip: text;
                                        -moz-text-fill-color: transparent;">
                               <span>#{{Base64toNumber(itemmodal.item.uid)}}</span>
                            </h3>
                            <!-- owner info -->
                            <div class="ms-auto" v-if="itemmodal.item.owner != account">
                               <a title="Item Seller" :href="'/@' + itemmodal.item.by" role="button"
                                  class="btn btn-sm btn-outline-light" v-if="itemmodal.item.by">
                                  <i class="fa-solid fa-user-astronaut fa-fw me-1"></i>
                                  {{itemmodal.item.by}}
                               </a>
                               <a title="Item Owner" :href="'/@' + itemmodal.item.owner" role="button"
                                  class="btn btn-sm btn-outline-light" v-if="itemmodal.item.owner">
                                  <i class="fa-solid fa-user-astronaut fa-fw me-1"></i>
                                  {{itemmodal.item.owner}}
                               </a>
                            </div>
                            <div class="ms-auto" v-if="itemmodal.item.from">
                               <a title="Item From" :href="'/@' + itemmodal.item.from" role="button"
                                  class="btn btn-sm btn-outline-light" v-if="itemmodal.item.from">
                                  <i class="fa-solid fa-truck-arrow-right fa-flip-horizontal fa-fw me-1"></i>
                                  {{itemmodal.item.from}}
                               </a>
                               <a title="Item To" :href="'/@' + itemmodal.item.to" role="button"
                                  class="btn btn-sm btn-outline-light" v-if="!itemmodal.item.from">
                                  <i class="fa-solid fa-truck-arrow-right fa-fw me-1"></i>
                                  {{itemmodal.item.to}}
                               </a>
                            </div>
                            <!--inventory pfp-->
                            <div class="ms-auto" v-if="itemmodal.item.owner == account">
                               <button @click="setPFP(itemmodal.item)" class="btn btn-lg btn-outline-primary"
                                  v-if="itemmodal.item.uid != pfp.uid">
                                  <i class="far fa-user-circle me-2"></i>Set as pfp
                               </button>
                               <button disabled class="btn btn-lg btn-secondary disabled"
                                  v-if="itemmodal.item.uid == pfp.uid && itemmodal.item.setname == pfp.setname">
                                  <i class="far fa-user-circle me-2"></i>Set as pfp
                               </button>
                            </div>
 
                         </div>
                         <!--back forward btns-->
                         <div class="d-flex align-items-center" v-if="itemmodal.items.length > 1">
                            <h2><a class="text-muted p-3" role="button" @click="modalPrev()"><i
                                     class="fas fa-caret-square-left"></i></a>
                            </h2>
                            <small class="ms-auto text-muted"><i>Item
                                  {{itemmodal.index + 1}} of
                                  {{NFTselect.auctionOnly || NFTselect.saleOnly ||
                                  NFTselect.sort == 'price' ||
                                  itemmodal.items.length}}</i></small>
                            <h2 class="ms-auto"><a class="text-muted p-3" role="button" @click="modalNext()"><i
                                     class="fas fa-caret-square-right"></i></a>
                            </h2>
                         </div>
                      </div>
 
                   </div>
                </div>
                <!-- NFT detail col 2 -->
                <div class="col-lg-6 px-0 px-sm-2">
                   <div class="accordion" id="nftAccordion">
 
                      <!-- NFT Description -->
                      <div class="accordion-item">
                         <h2 class="accordion-header">
                            <button onclick="this.blur();" class="accordion-button collapsed" type="button"
                               data-bs-toggle="collapse" data-bs-target="#collapseDescription" aria-expanded="true"
                               aria-controls="collapseDescription">
                               <i class="fas fa-list me-3"></i>DESCRIPTION
                            </button>
                         </h2>
                         <div id="collapseDescription" class="accordion-collapse collapse"
                            data-bs-parent="#nftAccordion">
                            <div class="accordion-body">
                               <h3>{{longname}}</h3>
                               <p>{{itemmodal.item.set.Description}}</p>
                               <div class="d-flex align-items-center" v-if="itemmodal.item.setname">
                                  <div
                                     class="text-start small border border-secondary rounded text-white px-2 py-1 w-100">
                                     <div class="d-flex align-items-center justify-content-start flex-wrap">
                                        <span class="mb-0" title="Royalties" v-if="chains[itemmodal.item.token]"><i
                                              class="fa-solid fa-crown fa-fw"></i>
                                           {{chains[itemmodal.item.token].sets[itemmodal.item.setname]?.royalty/100}}%</span>
                                        <span class="mb-0 ms-2" title="Total Number of Owners"
                                           v-if="!inventory && chains[itemmodal.item.token]"><i
                                              class="fa-solid fa-user-astronaut fa-fw"></i>
                                           {{chains[itemmodal.item.token].sets[itemmodal.item.setname].owners}}</span>
                                        <span class="mb-0 ms-2" title="Total Number of Items"
                                           v-if="!inventory && chains[itemmodal.item.token]"><i
                                              class="fa-solid fa-star fa-fw"></i>
                                           {{chains[itemmodal.item.token].sets[itemmodal.item.setname].minted -
                                           chains[itemmodal.item.token].sets[itemmodal.item.setname].deleted}}</span>
                                        <span class="mb-0 ms-2" title="Layer 2 Honeycomb Sidechain"><i
                                              class="fa-solid fa-link fa-fw"></i> {{itemmodal.item.token}}</span>
                                     </div>
                                     <div class="d-flex align-items-center justify-content-start flex-wrap"
                                        v-if="chains[itemmodal.item.token]">
                                        <span class="mb-0 me-2" title="Melt Value if Item is Burned"><i
                                              class="fa-solid fa-fire fa-fw"></i> {{chains[itemmodal.item.token]
                                           ?
                                           precision(chains[itemmodal.item.token].sets[itemmodal.item.setname].bond.amount,
                                           chains[itemmodal.item.token].sets[itemmodal.item.setname].bond.precision)
                                           : 0 }}
                                           {{chains[itemmodal.item.token]?
                                           chains[itemmodal.item.token].sets[itemmodal.item.setname].bond.token
                                           :
                                           ''}}</span>
 
                                        <span class="mb-0 me-2" title="Last Market Dividends Paid Out to Owners"><i
                                              class="fa-solid fa-money-bill-transfer fa-fw"></i>
                                           {{naiString(chains[itemmodal.item.token].sets[itemmodal.item.setname].last_div)}}
                                        </span>
                                        <span class="mb-0 me-2" title="Total Market Dividends Paid Out to Owners"><i
                                              class="fa-solid fa-money-bill-trend-up fa-fw"></i>
                                           {{naiString(chains[itemmodal.item.token].sets[itemmodal.item.setname].total_div)}}
                                        </span>
                                     </div>
                                  </div>
                               </div>
                            </div>
                         </div>
                      </div>
 
                      <!-- NFT Attributes -->
                      <div class="accordion-item">
                         <h2 class="accordion-header">
                            <button onclick="this.blur();" class="accordion-button"
                               v-bind:class="{'collapsed' : itemmodal.item.trade || itemmodal.item.sale || itemmodal.item.auction || itemmodal.item.owner == account }"
                               type="button" data-bs-toggle="collapse" data-bs-target="#collapseAttributes"
                               aria-expanded="false" aria-controls="collapseAttributes">
                               <i class="fas fa-star me-3"></i>ATTRIBUTES
                            </button>
                         </h2>
                         <div id="collapseAttributes" class="accordion-collapse collapse"
                            v-bind:class="{'show' : !itemmodal.item.trade && !itemmodal.item.sale && !itemmodal.item.auction && itemmodal.item.owner != account }"
                            data-bs-parent="#nftAccordion">
                            <div class="accordion-body">
                               <div class="d-flex flex-wrap">
                                  <div v-for="thing in itemmodal.item.attributes"
                                     class="border border-white rounded d-flex m-1">
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
                            <button onclick="this.blur();" class="accordion-button" type="button"
                               data-bs-toggle="collapse" data-bs-target="#collapseTransfer" aria-expanded="false"
                               aria-controls="collapseTransfer">
                               <i class="fas fa-exchange-alt me-3"></i>TRANSFER
                            </button>
                         </h2>
                         <div id="collapseTransfer" class="accordion-collapse collapse show"
                            data-bs-parent="#nftAccordion">
                            <div class="accordion-body">
                               <div class="border-warning border rounded p-3"
                                  v-if="itemmodal.item.uid == pfp.uid  && itemmodal.item.setname == pfp.setname">
                                  <p class="text-warning m-0">Transferring this NFT will remove it from your pfp</p>
                               </div>
                               <div class="p-3 col-12">
                                  <div class="container-fluid">
                                     <ul class="nav nav-pills justify-content-center" role="tablist">
                                        <li class="nav-item"> <a class="nav-link active" id="giveNFTlink" role="tab"
                                              data-bs-toggle="tab" aria-controls="giveNFT" aria-expanded="true"
                                              href="#giveNFTtab">Give</a></li>
                                        <li class="nav-item"> <a class="nav-link" id="tradeNFTlink" role="tab"
                                              data-bs-toggle="tab" aria-controls="tradeNFT" aria-expanded="true"
                                              href="#tradeNFTtab">Trade</a></li>
                                        <li class="nav-item"> <a class="nav-link" id="sellNFTlink" role="tab"
                                              data-bs-toggle="tab" aria-controls="sellNFT" aria-expanded="true"
                                              href="#sellNFTtab">Sell</a></li>
                                        <li class="nav-item"> <a class="nav-link" id="auctionNFTlink" role="tab"
                                              data-bs-toggle="tab" aria-controls="auctionNFT" aria-expanded="true"
                                              href="#auctionNFTtab">Auction</a></li>
                                     </ul>
                                     <div class="tab-content">
                                        <!-- NFT Give -->
                                        <div role="tabpanel" class="tab-pane fade show active" id="giveNFTtab"
                                           aria-labelledby="giveNFT">
                                           <form class="needs-validation mt-4" id="nftGiveForm"
                                              @submit.prevent="validateForm('nftGiveForm', giveNFT)" novalidate>
                                              <div class="form-row my-2">
                                                 <div class="col-12">
                                                    <label for="giveNFTusername" class=" mb-1">Username</label>
                                                    <div class="position-relative mb-3">
                                                       <span class="position-absolute top-50 translate-middle-y ps-2">
                                                          <i class="fa-solid fa-at fa-fw"></i>
                                                       </span>
                                                       <input ref="giveTo" pattern="[1-9a-z\-\.]{3,}" v-model="give.to"
                                                          @keyup="giveEnabled = false;validateForm('nftGiveForm')"
                                                          @blur="checkAccount(give.to, 'giveTo', 'giveEnabled')"
                                                          type="text"
                                                          class="ps-4 form-control bg-dark border-dark text-info"
                                                          aria-describedby="giveNFTuserprep" required>
                                                       <div class="invalid-feedback">
                                                          Please enter the username you'd like to give to.
                                                       </div>
                                                    </div>
                                                    <button v-if="give.to && !giveEnabled" :disabled="giveEnabled"
                                                       type="button" class="btn my-2"
                                                       :class="{'btn-warning': !giveEnabled, 'btn-danger': badAccount}">Validate
                                                       Account</button>
                                                 </div>
                                              </div>
                                              <div class="text-center">
                                                 <button class="btn btn-info mt-2" type="submit"
                                                    :disabled="!giveEnabled">Give</button>
                                              </div>
                                           </form>
                                        </div>
                                        <!-- NFT Trade -->
                                        <div role="tabpanel" class="tab-pane fade show" id="tradeNFTtab"
                                           aria-labelledby="tradeNFT">
                                           <form class="needs-validation mt-4" novalidate>
                                              <div class="form-row my-2">
                                                 <div class="col-12">
                                                    <label for="tradeNFTusername" class="mb-1">Username</label>
                                                    <div class="position-relative mb-3">
                                                       <span class="position-absolute top-50 translate-middle-y ps-2">
                                                          <i class="fa-solid fa-at fa-fw"></i>
                                                       </span>
                                                       <input refs="tradeTo" type="text" v-model="trade.to"
                                                          @blur="checkAccount(trade.to, 'tradeTo')"
                                                          class="ps-4 form-control bg-dark border-dark text-info"
                                                          id="tradeNFTusername" aria-describedby="tradeNFTuserprep"
                                                          required>
                                                       <div class="invalid-feedback">
                                                          Please enter the username you'd like to trade with.
                                                       </div>
                                                    </div>
                                                 </div>
                                              </div>
                                              <div class="form-group form-row my-2">
                                                 <label for="tradeNFTamount" class="mb-1 d-flex">Amount
                                                    <small v-if="trade.token == itemmodal.item.token"
                                                       class="ms-auto text-white-50">
                                                       0% FEE
                                                    </small>
                                                    <small v-else class="ms-auto text-white-50">
                                                       1% FEE
                                                    </small>
                                                 </label>
                                                 <div class="position-relative mb-3">
                                                    <input v-model="trade.amount" type="number"
                                                       class="pe-5 form-control bg-dark border-dark text-info"
                                                       id="tradeNFTamount" placeholder="0.000" step="0.001" min="0.001"
                                                       required>
                                                    <span class="position-absolute top-50 end-0 translate-middle-y ps-2">
                                                       <select v-model="trade.token" class="form-select border-0 pe-4"
                                                          id="tradeNFTpriceType" aria-label="Trade price type select">
                                                          <option :value="itemmodal.item.token">
                                                             {{toUpperCase(itemmodal.item.token)}}
                                                          </option>
                                                          <option value="hive" selected>
                                                             HIVE
                                                          </option>
                                                          <option value="hbd">
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
                                                 <button @click="tradeNFT(itemmodal.item)" id="tradeNFTbutton"
                                                    class="btn btn-info mt-2" type="button">
                                                    Propose Trade
                                                 </button>
                                              </div>
                                           </form>
                                        </div>
                                        <!-- NFT Sell -->
                                        <div role="tabpanel" class="tab-pane fade show " id="sellNFTtab"
                                           aria-labelledby="sellNFT">
                                           <form class="needs-validation mt-4" novalidate>
                                              <div class="form-group form-row my-2">
                                                 <label for="sellNFTprice" class="mb-1 d-flex">Sale Price
                                                    <small v-if="sell.token == itemmodal.item.token"
                                                       class="ms-auto text-white-50">
                                                       0% FEE</small>
                                                    <small v-else class="ms-auto text-white-50">
                                                       1% FEE</small>
                                                 </label>
                                                 <div class="position-relative mb-3">
                                                    <input v-model="sell.price" type="number"
                                                       class="pe-5 form-control bg-dark border-dark text-info"
                                                       id="sellNFTprice" aria-describedby="sellNFTpriceappend"
                                                       placeholder="0.000" step="0.001" min="0.001" required>
                                                    <span class="position-absolute top-50 end-0 translate-middle-y ps-2">
                                                       <select v-model="sell.token" class="form-select border-0 pe-4"
                                                          id="sellNFTpriceType" aria-label="Sell price type select">
                                                          <option :value="itemmodal.item.token" selected>
                                                             {{toUpperCase(itemmodal.item.token)}}
                                                          </option>
                                                          <option value="hive">
                                                             HIVE
                                                          </option>
                                                          <option value="hbd">
                                                             HBD
                                                          </option>
                                                       </select>
                                                    </span>
                                                    <div class="invalid-feedback">
                                                       Please enter the amount of VALUE you'd like to receive.
                                                    </div>
                                                 </div>
                                              </div>
                                              <div class="form-row mb-2">
                                                 <p class="text-white-50 small">
                                                    Ownership will be transferred to the DAO listing service and sold
                                                    publicly. Cancel anytime to return immediately.
                                                 </p>
                                              </div>
                                              <div class="text-center">
                                                 <button @click="sellNFT(itemmodal.item)" id="sellNFTbutton"
                                                    class="btn btn-info mt-2" type="button">
                                                    List Item
                                                 </button>
                                              </div>
                                           </form>
                                        </div>
                                        <!-- NFT Auction -->
                                        <div role="tabpanel" class="tab-pane fade show " id="auctionNFTtab"
                                           aria-labelledby="auctionNFT">
                                           <form class="needs-validation mt-4" novalidate>
                                              <div class="form-group form-row my-2">
                                                 <label for="auctionNFTprice"
                                                    class="d-flex align-items-center mb-1">Starting Bid
                                                    <small v-if="auction.token == itemmodal.item.token"
                                                       class="ms-auto text-white-50">
                                                       0% FEE</small>
                                                    <small v-else class="ms-auto text-white-50">
                                                       1% FEE</small>
                                                 </label>
                                                 <div class="position-relative mb-3">
                                                    <input v-model="auction.amount" type="number"
                                                       class="pe-5 form-control bg-dark border-dark text-info"
                                                       id="auctionNFTprice" aria-describedby="auctionNFTpriceappend"
                                                       placeholder="0.000" step="0.001" min="0.001" required>
                                                    <span class="position-absolute top-50 end-0 translate-middle-y ps-2">
                                                       <select v-model="auction.token" class="form-select border-0 pe-4"
                                                          id="auctionNFTpriceType"
                                                          aria-label="Auction price type select">
                                                          <option :value="itemmodal.item.token" selected>
                                                             {{toUpperCase(itemmodal.item.token)}}
                                                          </option>
                                                          <option value="hive">
                                                             HIVE
                                                          </option>
                                                          <option value="hbd">
                                                             HBD
                                                          </option>
                                                       </select>
                                                    </span>
                                                    <div class="invalid-feedback">
                                                       Please enter the amount of VALUE you'd like to start the
                                                       bidding.
                                                    </div>
                                                 </div>
                                              </div>
                                              <div class="d-flex">
                                                 <div class="w-100 mb-3">
 
                                                    <label for="auctionNFTdays" class="mb-1 form-label">Duration</label>
                                                    <select v-model="auction.days"
                                                       class="btn btn-lg btn-dark form-select" id="auctionNFTdays"
                                                       required>
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
 
                                              <div class="form-row mb-2">
                                                 <p class="text-white-50 small">
                                                    Ownership will be transferred to the DAO listing service and
                                                    auctioned publicly. Once submitted this cannot
                                                    be cancelled. If there are no bids at the end of the auction
                                                    period,
                                                    it will be returned to you immediately.
                                                 </p>
                                              </div>
                                              <div class="text-center">
                                                 <button @click="auctionNFT(itemmodal.item)" class="btn btn-info mt-2"
                                                    type="button">
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

                      <!-- NFT Advanced Content Management (Types 2-4) -->
                      <div class="accordion-item" v-if="showAdvancedContent">
                         <h2 class="accordion-header">
                            <button onclick="this.blur();" class="accordion-button collapsed" type="button"
                               data-bs-toggle="collapse" data-bs-target="#collapseAdvanced" aria-expanded="false"
                               aria-controls="collapseAdvanced">
                               <i class="fa-solid fa-code me-3"></i>ADVANCED CONTENT
                               <span class="ms-auto small">{{ getContentTypeInfo(nftType) }}</span>
                            </button>
                         </h2>
                         <div id="collapseAdvanced" class="accordion-collapse collapse" data-bs-parent="#nftAccordion">
                            <div class="accordion-body">
                               <div class="alert alert-info mb-3">
                                  <i class="fa-solid fa-info-circle me-2"></i>
                                  <strong>NFT Type {{ nftType }}:</strong> {{ getContentTypeInfo(nftType) }}
                               </div>

                               <!-- Executable Code Section (Types 2 & 4) -->
                               <div v-if="supportsExecutableCode" class="mb-4">
                                  <div class="d-flex align-items-center justify-content-between mb-2">
                                     <h5 class="mb-0">
                                        <i class="fa-solid fa-terminal me-2"></i>Executable Code
                                     </h5>
                                     <div v-if="nftContent.updateMode !== 'exe'">
                                        <button type="button" 
                                           class="btn btn-outline-primary btn-sm"
                                           @click="startContentUpdate('exe')">
                                           <i class="fa-solid fa-edit me-1"></i>
                                           {{ itemmodal.item.exe ? 'Update' : 'Set' }} Code
                                        </button>
                                     </div>
                                  </div>
                                  
                                  <!-- Current code display -->
                                  <div v-if="itemmodal.item.exe && nftContent.updateMode !== 'exe'" 
                                       class="bg-dark p-3 rounded mb-2" style="max-height: 200px; overflow-y: auto;">
                                     <pre class="text-info mb-0 small">{{ itemmodal.item.exe }}</pre>
                                  </div>
                                  <div v-else-if="!itemmodal.item.exe && nftContent.updateMode !== 'exe'"
                                       class="text-muted p-3 bg-darker rounded mb-2">
                                     <i class="fa-solid fa-code-slash me-2"></i>No executable code set
                                  </div>

                                  <!-- Code editor -->
                                  <div v-if="nftContent.updateMode === 'exe'" class="border rounded p-3 bg-darker">
                                     <div class="form-group mb-3">
                                        <label class="form-label">
                                           <i class="fa-solid fa-terminal me-1"></i>Executable Code
                                        </label>
                                        <div class="form-text mb-2">
                                           Enter JavaScript code that will be executed when this NFT is displayed
                                        </div>
                                        <textarea class="form-control bg-dark border-dark text-info font-monospace" 
                                                 rows="8"
                                                 v-model="nftContent.exe"
                                                 placeholder="// Your executable code here
function execute() {
    // NFT execution logic
    console.log('NFT executed!');
}
execute();"
                                                 :disabled="nftContent.isUpdating"></textarea>
                                     </div>
                                     <div class="d-flex justify-content-end gap-2">
                                        <button type="button" 
                                           class="btn btn-outline-secondary"
                                           @click="cancelContentUpdate"
                                           :disabled="nftContent.isUpdating">
                                           Cancel
                                        </button>
                                        <button type="button" 
                                           class="btn btn-primary"
                                           @click="updateExecutableCode"
                                           :disabled="!nftContent.exe.trim() || nftContent.isUpdating">
                                           <i class="fa-solid fa-spinner fa-spin me-2" v-if="nftContent.isUpdating"></i>
                                           <i class="fa-solid fa-save me-2" v-else></i>
                                           {{ nftContent.isUpdating ? 'Updating...' : 'Update Code' }}
                                        </button>
                                     </div>
                                  </div>
                               </div>

                               <!-- Optional Content Section (Types 3 & 4) -->
                               <div v-if="supportsOptionalContent" class="mb-4">
                                  <div class="d-flex align-items-center justify-content-between mb-2">
                                     <h5 class="mb-0">
                                        <i class="fa-solid fa-file-text me-2"></i>Optional Content
                                     </h5>
                                     <div v-if="nftContent.updateMode !== 'opt'">
                                        <button type="button" 
                                           class="btn btn-outline-primary btn-sm"
                                           @click="startContentUpdate('opt')">
                                           <i class="fa-solid fa-edit me-1"></i>
                                           {{ itemmodal.item.opt ? 'Update' : 'Set' }} Content
                                        </button>
                                     </div>
                                  </div>
                                  
                                  <!-- Current content display -->
                                  <div v-if="itemmodal.item.opt && nftContent.updateMode !== 'opt'" 
                                       class="bg-dark p-3 rounded mb-2" style="max-height: 200px; overflow-y: auto;">
                                     <div v-html="sanitizeHTML(itemmodal.item.opt)"></div>
                                  </div>
                                  <div v-else-if="!itemmodal.item.opt && nftContent.updateMode !== 'opt'"
                                       class="text-muted p-3 bg-darker rounded mb-2">
                                     <i class="fa-solid fa-file-slash me-2"></i>No optional content set
                                  </div>

                                  <!-- Content editor -->
                                  <div v-if="nftContent.updateMode === 'opt'" class="border rounded p-3 bg-darker">
                                     <div class="form-group mb-3">
                                        <label class="form-label">
                                           <i class="fa-solid fa-file-text me-1"></i>Optional Content
                                        </label>
                                        <div class="form-text mb-2">
                                           Enter additional content (HTML/Markdown) for this NFT
                                        </div>
                                        <textarea class="form-control bg-dark border-dark text-info" 
                                                 rows="6"
                                                 v-model="nftContent.opt"
                                                 placeholder="<p>Additional content for this NFT...</p>
<!-- or markdown -->
# Title
Some **bold** text"
                                                 :disabled="nftContent.isUpdating"></textarea>
                                     </div>
                                     <div class="d-flex justify-content-end gap-2">
                                        <button type="button" 
                                           class="btn btn-outline-secondary"
                                           @click="cancelContentUpdate"
                                           :disabled="nftContent.isUpdating">
                                           Cancel
                                        </button>
                                        <button type="button" 
                                           class="btn btn-primary"
                                           @click="updateOptionalContent"
                                           :disabled="!nftContent.opt.trim() || nftContent.isUpdating">
                                           <i class="fa-solid fa-spinner fa-spin me-2" v-if="nftContent.isUpdating"></i>
                                           <i class="fa-solid fa-save me-2" v-else></i>
                                           {{ nftContent.isUpdating ? 'Updating...' : 'Update Content' }}
                                        </button>
                                     </div>
                                  </div>
                               </div>

                               <!-- Info about size limits -->
                               <div class="alert alert-warning">
                                  <i class="fa-solid fa-exclamation-triangle me-2"></i>
                                  <small>
                                     <strong>Size Limits:</strong>
                                     <span v-if="supportsExecutableCode">
                                        Executable code is limited by the set's exe_size parameter.
                                     </span>
                                     <span v-if="supportsOptionalContent">
                                        Optional content is limited by the set's opt_size parameter.
                                     </span>
                                     Updates may incur network fees.
                                  </small>
                               </div>
                            </div>
                         </div>
                      </div>
 
                      <!-- NFT Melt -->
                      <div class="accordion-item" v-if="itemmodal.item.owner == account">
                         <h2 class="accordion-header">
                            <button onclick="this.blur();" class="accordion-button collapsed" type="button"
                               data-bs-toggle="collapse" data-bs-target="#collapseMelt" aria-expanded="false"
                               aria-controls="collapseMelt">
                               <i class="fa-solid fa-fire me-3"></i>MELT<span
                                  class="ms-auto small">{{chains[itemmodal.item.token]
                                  ?
                                  precision(chains[itemmodal.item.token].sets[itemmodal.item.setname].bond.amount,
                                  chains[itemmodal.item.token].sets[itemmodal.item.setname].bond.precision)
                                  : 0 }}
                                  {{chains[itemmodal.item.token]?
                                  chains[itemmodal.item.token].sets[itemmodal.item.setname].bond.token
                                  :
                                  ''}}</span>
                            </button>
                         </h2>
                         <div id="collapseMelt" class="accordion-collapse collapse" data-bs-parent="#nftAccordion">
                            <div class="accordion-body">
                               <div class="">
                                  <div class="d-flex align-self-end">
                                     <div class="">
                                        <div class="d-flex align-items-center justify-content-between">
                                           <div class="d-flex me-1">
                                              <h4>Melt Value</h4>
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
                                                 ''}}
                                              </h1>
                                           </div>
                                        </div>
                                        <div class="pt-2">
                                           <p class="text-uppercase text-muted">This NFT can be traded, sold, or
                                              auctioned until melted. Once melted it will disappear forever.</p>
                                           <div class="d-flex justify-content-around">
                                              <div class="d-flex align-items-center my-2">
                                                 <div class="text-center">
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
                                           <div class="text-center mb-1">
                                              <button type="button" class="btn btn-warning" data-bs-toggle="collapse"
                                                 href="#melt-confirmation">
                                                 Melt
                                              </button>
                                           </div>
                                           <div class="collapse bg-danger rounded mt-1" id="melt-confirmation">
                                              <div class="text-center pt-4">
                                                 <h2><b>IRREVERSIBLE</b>
                                                 </h2>
                                                 <p>Are you sure you want to
                                                    proceed?
                                                 </p>
                                              </div>
                                              <div class="d-flex justify-content-around p-3">
                                                 <button class="btn btn-secondary" data-bs-toggle="collapse"
                                                    href="#melt-confirmation">CANCEL
                                                    <i class="fas fa-running"></i></button>
                                                 <button @click="meltNFT()" class="btn btn-danger border-white">DESTROY
                                                    <i class="fas fa-bomb"></i>
                                                    <span class="spinner-border spinner-border-sm d-none" role="status"
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
 
                      <!-- NFT Trade -->
                      <div class="accordion-item" v-if="itemmodal.item.trade">
                         <h2 class="accordion-header">
                            <button onclick="this.blur();" class="accordion-button" type="button"
                               data-bs-toggle="collapse" data-bs-target="#collapseTrade" aria-expanded="false"
                               aria-controls="collapseTrade">
                               <i class="fa-solid fa-paper-plane fa-fw me-3"></i>TRADE
                            </button>
                         </h2>
                         <div id="collapseTrade" class="accordion-collapse collapse show" data-bs-parent="#nftAccordion">
                            <div class="accordion-body">
                               <div class="p-2 text-white text-center rounded">
                                  <div class=" d-flex align-items-center">
                                     <div class="text-end mt-auto mb-auto me-1" style="flex: 1">
                                        <h5 class="small m-0">
                                           <span v-if="itemmodal.item.to != account">TO:</span>
                                           <span v-if="itemmodal.item.to == account">FROM:</span>
                                        </h5>
                                     </div>
                                     <div class="text-start mt-auto mb-auto" style="flex: 2">
                                        <h5 class="lead m-0">
                                           <a class="no-decoration text-info" v-if="itemmodal.item.to != account"
                                              :href="'/@' + itemmodal.item.to">{{itemmodal.item.to}}</a>
                                           <a class="no-decoration text-info" v-if="itemmodal.item.to == account"
                                              :href="'/@' + itemmodal.item.from">{{itemmodal.item.from}}</a>
                                        </h5>
                                     </div>
                                  </div>
                                  <div class="d-flex align-items-center my-2">
                                     <div class="text-end mt-auto mb-auto me-1" style="flex: 1">
                                        <h5 class="small m-0">PRICE:</h5>
                                     </div>
                                     <div class="text-start mt-auto mb-auto" style="flex: 2">
                                        <h5 class="lead m-0">{{itemmodal.item.priceString}}</h5>
                                     </div>
                                  </div>
                                  <div class="d-flex align-items-center my-2">
                                     <div class="text-end mt-auto mb-auto me-1" style="flex: 1">
                                        <h5 class="small m-0">BALANCE:</h5>
                                     </div>
                                     <div class="text-start mt-auto mb-auto" style="flex: 2">
                                        <h5 class="lead m-0">{{denoms[toUpperCase(itemmodal.item.token)].balance}}</h5>
                                     </div>
                                  </div>
                                 
                                  <div class="mb-1">
                                     <!-- ACCEPT / REJECT  -->
                                     <div role="group" v-if="itemmodal.item.to == account">
                                        <button type="button" class="btn btn-sm btn-danger mx-1" title="Decline Trade"
                                           @click="cancelXfr()"><i
                                              class="fa-solid fa-xmark fa-fw me-2"></i>Decline</button>
                                       
                                        <button type="button" class="mx-1 btn btn-sm btn-success" title="Accept Trade"
                                           @click="acceptXfr()"><i class="fa-solid fa-check fa-fw me-2"></i>
                                           Accept</button>
                                     </div>
                                     <!-- CANCEL  -->
                                     <div role="group" v-if="itemmodal.item.from == account">
                                        <button type="button" class="btn btn-sm btn-warning" title="Cancel Trade"
                                           @click="cancelXfr()">
                                           <i class="fa-solid fa-xmark fa-fw me-2"></i> Cancel</button>
                                     </div>
                                  </div>
                               </div>
                            </div>
                         </div>
                      </div>
 
 
                      <!-- NFT Buy -->
                      <div class="accordion-item" v-if="itemmodal.item.sale">
                         <h2 class="accordion-header">
                            <button onclick="this.blur();" @click="saleData('itemmodal')" class="accordion-button"
                               type="button" data-bs-toggle="collapse" data-bs-target="#collapseBuy" aria-expanded="true"
                               aria-controls="collapseBuy">
                               <i class="fas fa-money-bill-wave me-3"></i>
                               BUY NOW
                               <span class="small ms-auto">
                                  {{formatNumber(itemmodal.item.price.amount/1000,itemmodal.item.price.precision,'.',',')}}
                                  <span class="text-uppercase">{{itemmodal.item.price.token}}</span></span>
                            </button>
                         </h2>
                         <div id="collapseBuy" class="accordion-collapse collapse show" data-bs-parent="#nftAccordion">
                            <div class="accordion-body">
                               <div class="d-flex align-self-end">
                                  <div class="d-flex flex-column w-100">
 
                                     <div class="d-flex bg-dark border-dark rounded p-2 mb-1">
                                        {{formatNumber(itemmodal.item.price.amount/1000,itemmodal.item.price.precision,'.',',')}}
                                        <span class="ms-auto text-uppercase">{{itemmodal.item.price.token}}</span>
                                     </div>
                                    <div class="d-flex mb-3">
                                       <small class="ms-auto text-white-50 me-1">You have {{denoms[itemmodal.item.price.token].balance}}</small>
                                    </div>
                                     <div class="mb-2">
                                        <div class="text-center">
                                           <button v-if="itemmodal.item.by != account" type="button"
                                              class="btn btn-primary" @click="buyNFT()">Buy </button>
                                           <button v-else type="button" class="btn btn-warning"
                                              @click="cancelNFT()">Cancel </button>
                                        </div>
                                     </div>
                                  </div>
                               </div>
                            </div>
                         </div>
                      </div>
 
                      <!-- NFT Bid -->
                      <div class="accordion-item" v-if="itemmodal.item.auction">
                         <h2 class="accordion-header">
                            <button onclick="this.blur();" class="accordion-button" type="button"
                               data-bs-toggle="collapse" data-bs-target="#collapseBid" aria-expanded="true"
                               aria-controls="collapseBid">
                               <i class="fas fa-comment-dollar me-3"></i><span>BID
                                  NOW</span><span
                                  class="small ms-auto">{{formatNumber(itemmodal.item.price.amount/1000,itemmodal.item.price.precision,'.',',')}}
                                  {{itemmodal.item.price.token}}</span>
                            </button>
                         </h2>
                         <div id="collapseBid" class="accordion-collapse collapse show" data-bs-parent="#nftAccordion">
                            <div class="accordion-body px-0 pt-0">
                               <div class="d-flex align-items-baseline justify-content-center bg-danger-50">
                                  <h4 class="m-0">Ends in {{animateCountdown(itemmodal.item.time)}}</h4>
                               </div>
                               <div class="p-2">
                                  <div class="d-flex align-items-center mt-1">
 
                                     <h2 class="mb-0 text-info">
                                        {{formatNumber(itemmodal.item.price.amount/1000,itemmodal.item.price.precision,'.',',')}}
                                        {{itemmodal.item.price.token}}</h2>
 
                                     <h4 class="mb-0 ms-auto"><u>
                                           {{itemmodal.item.bids}} Bids
                                        </u></h4>
                                  </div>
                                  <div class="d-flex align-items-start mt-3 mb-2">
                                     <ul>
                                        <li>
                                           {{itemmodal.item.days}} day auction
                                        </li>
                                        <li>
                                           <span v-if="itemmodal.item.bidder">{{itemmodal.item.bidder}} is high
                                              bidder</span>
                                           <span v-if="!itemmodal.item.bidder">No bidders</span>
                                        </li>
                                        <li>Starting price:
                                           {{naiString(itemmodal.item.initial_price)}}
                                        </li>
                                     </ul>
                                  </div>
                                  <div class="d-flex flex-column w-100">
                                     <form class="needs-validation" novalidate>
                                        <label for="bidNFTprice" class="mb-1">Bid</label>
                                        <div class="position-relative mb-1">
                                           <input v-model="auction.bid" type="number"
                                              class="pe-5 form-control bg-dark border-dark text-info"
                                              id="auctionNFTprice"
                                              :placeholder="formatNumber(((itemmodal.item.price.amount/1000)+1),3,'.',',')"
                                              step="0.001"
                                              :min="(itemmodal.item.price.amount + (itemmodal.item.bids ? 1 : 0))/ 1000"
                                              required>
                                           <span class="position-absolute top-50 end-0 translate-middle-y pe-3">
                                              {{toUpperCase(itemmodal.item.price.token)}}
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

                                        <div class="d-flex mb-3">
                                       <small class="ms-auto text-white-50 me-1">You have {{denoms[itemmodal.item.price.token].balance}}</small>
                                    </div>

                                        <div class="text-center mb-2">
                                           <button @click="bidNFT(itemmodal.item)" type="button"
                                              class="btn btn-primary">Bid
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
                    dlux: {
                        sets: {
                            dlux: {
                                name_long: "DLUX",
                            }
                        }
                    }
                };
            },
        },
        denoms: {
            required: false,
            default: function () {
                return {
                    HIVE: {
                     balance: 0,
                    },
                     HBD: {
                        balance: 0,
                     },
                     DLUX: {
                        balance: 0,
                     },
                };
            },
        },
        itemmodal: {
            required: true,
            default: function () {
                return {
                    script: '',
                    item: {
                        setname: 'dlux',
                        token: 'dlux',
                    }
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
        inventory: {
         default: false
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
    emits: ['tosign', 'detail', 'setpfp'],
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
                bid: "1.000",
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
            giveEnabled: false,
            badAccount : false,
            NFTselect: {
                start: 0,
                amount: 30,
                searchTerm: "",
                searchDefault: "Search UIDs and ",
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
            // NFT Type 2-4 content management
            nftContent: {
                exe: '', // Executable code for types 2 & 4
                opt: '', // Optional content for types 3 & 4
                updateMode: null, // 'exe' or 'opt'
                isUpdating: false
            },
        };
    },
    computed: {
        color(){
            return `linear-gradient(${this.itemmodal.item.set.Color1},${this.itemmodal.item.set.Color2 ? this.itemmodal.item.set.Color2 : this.itemmodal.item.set.Color1})`;
        },
        icon() {
            return this.itemmodal.item.set.faicon;
        },
        longname() {
            if(this.chains[this.itemmodal.item.token]?.sets[this.itemmodal.item.setname]?.name_long)return this.chains[this.itemmodal.item.token]?.sets[this.itemmodal.item.setname]?.name_long
            return ''
        },
        // NFT Type support checks
        nftType() {
            return this.chains[this.itemmodal.item.token]?.sets[this.itemmodal.item.setname]?.type || 1;
        },
        supportsExecutableCode() {
            return this.nftType === 2 || this.nftType === 4;
        },
        supportsOptionalContent() {
            return this.nftType === 3 || this.nftType === 4;
        },
        showAdvancedContent() {
            return this.itemmodal.item.owner === this.account && (this.supportsExecutableCode || this.supportsOptionalContent);
        }
    },
    methods: {
      animateCountdown(timeString){
         // get current time
         const now = new Date().getTime();
         // get time to countdown to
         const countDownDate = new Date(timeString).getTime();
         // get the difference
         const distance = countDownDate - now;
         // calculate time
         const days = Math.floor(distance / (1000 * 60 * 60 * 24));
         const hours = Math.floor(
           (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
         );
         const minutes = Math.floor(
           (distance % (1000 * 60 * 60)) / (1000 * 60)
         );
         const seconds = Math.floor((distance % (1000 * 60)) / 1000);
         return `${days}d ${hours}h ${minutes}m ${seconds}s`;
       },
        validateForm(formKey,  op) {
            var Container = document.getElementById(formKey);
            if (Container.querySelector('input:invalid'))
                Container.classList.add('was-validated');
            else {
                if(op)op();
            }
          },
        checkAccount(name, key, enable) {
            return new Promise((resolve, reject) => {
            fetch("https://api.hive.blog", {
              body: `{\"jsonrpc\":\"2.0\", \"method\":\"condenser_api.get_accounts\", \"params\":[[\"${name}\"]], \"id\":1}`,
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
                if (re.result.length) {
                    this.$refs[key].setCustomValidity("");
                    this[enable] = true
                    this.badAccount = false
                    resolve(true);
                } else {
                    this.$refs[key].setCustomValidity("Account does not exist");
                    this[enable] = false
                    this.badAccount = true
                    resolve(false);
                }
              });
            })
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
                api: this.chains[this.itemmodal.item.token].api,
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
                api: this.chains[this.itemmodal.item.token].api,
                txid: `${this.itemmodal.item.setname}:${this.itemmodal.item.uid}_nft_buy`
            });
        },
        bidNFT() {
            if(this.itemmodal.item.price.token == 'HIVE' || this.itemmodal.item.price.token == "HBD") this.$emit('tosign', {
                type: "xfr",
                cj: {
                  to: this.chains[this.itemmodal.item.token].multisig,
                  [this.itemmodal.item.price.token.toLowerCase()]: parseInt(this.auction.bid * 1000),
                  memo: `NFTbid ${this.itemmodal.item.setname}:${this.itemmodal.item.uid}`,
                },
                txid: "sendhive",
                msg: `Biding ${this.itemmodal.item.setname}:${this.itemmodal.item.uid}`,
                api: this.chains[this.itemmodal.item.token].api,
                ops: ["getTokenUser"],
              });
            else this.$emit('tosign', {
                type: 'cja',
                cj: {
                    set: this.itemmodal.item.setname,
                    uid: this.itemmodal.item.uid,
                    bid_amount: parseInt(this.auction.bid * 1000),
                  },
                id: `${this.itemmodal.item.token}_nft_bid`,
                msg: `Buying ${this.itemmodal.item.setname}:${this.itemmodal.item.uid}`,
                ops: ["getTokenUser"],
                api: this.chains[this.itemmodal.item.token].api,
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
                api: this.chains[this.itemmodal.item.token].api,
                txid: `${this.itemmodal.item.setname}:${this.itemmodal.item.uid}_nft_cancel`
            });
        },
        acceptXfr(){
         const toSign = {
            type: "cja",
            cj: {
                set: this.itemmodal.item.setname,
                uid: this.itemmodal.item.uid,
            },
            id: `${this.itemmodal.item.token}_nft_reserve_complete`,
            msg: `Finishing ${this.itemmodal.item.setname}:${this.itemmodal.item.uid} trade...`,
            ops: ["getTokenUser"],
            api: this.chains[this.itemmodal.item.token].api,
            txid: `${this.itemmodal.item.token}_nft_reserve_complete`,
          }
          console.log(toSign);
          this.$emit('tosign', toSign)
        },
        cancelXfr(){
         const toSign = {
            type: "cja",
            cj: {
                set: this.itemmodal.item.setname,
                uid: this.itemmodal.item.uid,
            },
            id: `${this.itemmodal.item.token}_nft_transfer_cancel`,
            msg: `Canceling ${this.itemmodal.item.setname}:${this.itemmodal.item.uid} trade...`,
            ops: ["getTokenUser"],
            api: this.chains[this.itemmodal.item.token].api,
            txid: `${this.itemmodal.item.token}_nft_transfer_cancel`,
          }
          console.log(toSign);
          this.$emit('tosign', toSign)
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
                api: this.chains[this.itemmodal.item.token].api,
                txid: `${this.itemmodal.item.token}_nft_transfer_${this.give.to}`,
              }
              console.log(toSign);
              this.$emit('tosign', toSign)
        },
        tradeNFT() { 
            this.$emit('tosign', {
                type: "cja",
                cj: {
                  set: this.itemmodal.item.setname,
                  uid: this.itemmodal.item.uid,
                  type: this.trade.token,
                  price: parseInt(this.trade.amount * 1000),
                  to: this.trade.to,

                },
                id: `${this.itemmodal.item.token}_nft_reserve_transfer`,
                txid: `trade_propose_${this.itemmodal.item.setname}:${this.itemmodal.item.uid}`,
                msg: `Proposing Transfer ${this.itemmodal.item.setname}:${this.itemmodal.item.uid}`,
                api: this.chains[this.itemmodal.item.token].api,
                ops: ["getTokenUser"],
              });
        },
        Base64toNumber(chars = "aa") {
         const glyphs =
           "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+=";
         var result = 0;
         if(typeof chars == 'string')chars = chars.split("")
         else chars = []
         for (var e = 0; e < chars.length; e++) {
           result = result * 64 + glyphs.indexOf(chars[e]);
         }
         return result;
       },
        sellNFT() { 
            this.$emit('tosign', {
                type: "cja",
                cj: {
                  set: this.itemmodal.item.setname,
                  uid: this.itemmodal.item.uid,
                  type: this.sell.token,
                  price: parseInt(this.sell.amount * 1000)

                },
                id: `${this.itemmodal.item.token}_nft_sell`,
                txid: `sell_${this.itemmodal.item.setname}:${this.itemmodal.item.uid}`,
                msg: `Listing ${this.itemmodal.item.setname}:${this.itemmodal.item.uid}`,
                api: this.chains[this.itemmodal.item.token].api,
                ops: ["getTokenUser"],
              });
        },
        auctionNFT(){
            if(this.auction.token == 'hive' || this.auction.token == "hbd") this.$emit('tosign', {
                type: "cja",
                cj: {
                  set: this.itemmodal.item.setname,
                  uid: this.itemmodal.item.uid,
                  type: this.auction.token,
                  price: parseInt(this.auction.amount * 1000),
                  time: this.auction.days,

                },
                id: `${this.itemmodal.item.token}_nft_hauction`,
                txid: `hauction_${this.itemmodal.item.setname}:${this.itemmodal.item.uid}`,
                msg: `Auctioning ${this.itemmodal.item.setname}:${this.itemmodal.item.uid}`,
                api: this.chains[this.itemmodal.item.token].api,
                ops: ["getTokenUser"],
              });
            else this.$emit('tosign', {
                type: "cja",
                cj: {
                  set: this.itemmodal.item.setname,
                  uid: this.itemmodal.item.uid,
                  price: parseInt(this.auction.amount * 1000),
                  time: this.auction.days,

                },
                id: `${this.itemmodal.item.token}_nft_auction`,
                txid: `hauction_${this.itemmodal.item.setname}:${this.itemmodal.item.uid}`,
                msg: `Auctioning ${this.itemmodal.item.setname}:${this.itemmodal.item.uid}`,
                api: this.chains[this.itemmodal.item.token].api,
                ops: ["getTokenUser"],
            });
        },
        meltNFT(){
            this.$emit('tosign', {
                type: "cja",
                cj: {
                  set: this.itemmodal.item.setname,
                  uid: this.itemmodal.item.uid,

                },
                id: `${this.itemmodal.item.token}_nft_delete`,
                txid: `melt_${this.itemmodal.item.setname}:${this.itemmodal.item.uid}`,
                msg: `Melting ${this.itemmodal.item.setname}:${this.itemmodal.item.uid}`,
                api: this.chains[this.itemmodal.item.token].api,
                ops: ["getTokenUser"],
            });
        },
        // NFT Type 2-4 content management methods
        startContentUpdate(type) {
            this.nftContent.updateMode = type;
            if (type === 'exe') {
                this.nftContent.exe = this.itemmodal.item.exe || '';
            } else if (type === 'opt') {
                this.nftContent.opt = this.itemmodal.item.opt || '';
            }
        },
        cancelContentUpdate() {
            this.nftContent.updateMode = null;
            this.nftContent.exe = '';
            this.nftContent.opt = '';
        },
        updateExecutableCode() {
            if (!this.supportsExecutableCode || !this.nftContent.exe.trim()) return;
            
            this.nftContent.isUpdating = true;
            this.$emit('tosign', {
                type: 'cja',
                cj: {
                    set: this.itemmodal.item.setname,
                    uid: this.itemmodal.item.uid,
                    exe: this.nftContent.exe.trim()
                },
                id: `${this.itemmodal.item.token}_nft_update_exe`,
                msg: `Updating executable code for ${this.itemmodal.item.setname}:${this.itemmodal.item.uid}`,
                ops: ["getTokenUser"],
                api: this.chains[this.itemmodal.item.token].api,
                txid: `${this.itemmodal.item.setname}:${this.itemmodal.item.uid}_update_exe`,
                onSuccess: () => {
                    this.nftContent.isUpdating = false;
                    this.cancelContentUpdate();
                },
                onError: () => {
                    this.nftContent.isUpdating = false;
                }
            });
        },
        updateOptionalContent() {
            if (!this.supportsOptionalContent || !this.nftContent.opt.trim()) return;
            
            this.nftContent.isUpdating = true;
            this.$emit('tosign', {
                type: 'cja',
                cj: {
                    set: this.itemmodal.item.setname,
                    uid: this.itemmodal.item.uid,
                    opt: this.nftContent.opt.trim()
                },
                id: `${this.itemmodal.item.token}_nft_update_opt`,
                msg: `Updating optional content for ${this.itemmodal.item.setname}:${this.itemmodal.item.uid}`,
                ops: ["getTokenUser"],
                api: this.chains[this.itemmodal.item.token].api,
                txid: `${this.itemmodal.item.setname}:${this.itemmodal.item.uid}_update_opt`,
                onSuccess: () => {
                    this.nftContent.isUpdating = false;
                    this.cancelContentUpdate();
                },
                onError: () => {
                    this.nftContent.isUpdating = false;
                }
            });
        },
        getContentTypeInfo(type) {
            const types = {
                1: 'Basic NFT (Static Content)',
                2: 'Executable NFT (With Code)',
                3: 'Extended NFT (With Optional Content)',
                4: 'Dynamic NFT (Code + Optional Content)'
            };
            return types[type] || 'Unknown Type';
        },
        setPFP(item){
         console.log('setpfp', item)
         this.$emit('setpfp', item);
        },
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
        },
        toUpperCase(str = "") {
            return str.toUpperCase();
        },
        sanitizeHTML(html) {
            if (!html || typeof html !== 'string') return '';
            
            // Less restrictive sanitization for NFTs - allow rich content while preventing XSS
            return DOMPurify.sanitize(html, {
              // Only forbid the most dangerous tags
              FORBID_TAGS: [
                'script', 'object', 'embed', 'applet', 'meta', 
                'link', 'base', 'dialog', 'iframe', 'frame', 'frameset'
              ],
              // Only forbid the most dangerous attributes - allow styling and some interactivity
              FORBID_ATTR: [
                'onload', 'onerror', 'onclick', 'onmouseover', 'onfocus', 'onblur',
                'onchange', 'onsubmit', 'onreset', 'onselect', 'onunload', 'onbeforeunload',
                'onabort', 'onafterprint', 'onbeforeprint', 'oncontextmenu', 'ondblclick',
                'ondrag', 'ondragend', 'ondragenter', 'ondragleave', 'ondragover', 
                'ondragstart', 'ondrop', 'oninput', 'oninvalid', 'onkeydown', 'onkeypress',
                'onkeyup', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseup', 
                'onmousewheel', 'onoffline', 'ononline', 'onpagehide', 'onpageshow',
                'onpopstate', 'onresize', 'onscroll', 'onstorage', 'onwheel',
                'srcdoc', 'sandbox', 'open'
              ],
              // Allow broader range of protocols for NFT content
              ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|ipfs|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
              // Allow more HTML elements for rich NFT content
              ADD_TAGS: ['style'],
              ADD_ATTR: ['style', 'allowfullscreen', 'controls', 'autoplay', 'loop', 'muted'],
              // Additional safety measures
              SANITIZE_DOM: true,
              KEEP_CONTENT: true,
              RETURN_DOM: false,
              RETURN_TRUSTED_TYPE: false
            });
        }
    },
    mounted() {
        this.isMountedComponent = true;
    },
};