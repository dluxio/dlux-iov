import Bennies from "/js/bennies.js";

export default {
    components: {
        "bennies": Bennies
    },
    template: `
    <div class="modal fade" id="transferModal" tabindex="-1" aria-labelledby="transferModalLabel" :aria-hidden="true">
    <div class="modal-dialog modal-full modal-xl modal-dialog-centered" role="document">
       <div class="modal-content rounded bg-img-none">
 
          <!-- START HEAD -->
          <div class="card bg-img-none bg-blur-none">
             <div class="card-header border-0 d-flex align-items-center" :style="{'background': colors}">
                <div class="nft-header">
                <div class="me-auto rounded px-2 py-1 shimmer border border-dark">
    <a :href="'/nfts/set/' + item.setname + '#' + item.token"
        class="no-decoration text-black" style="font-size: 1.3em;">
        <i class="me-1" :class="[icon]"></i><b>{{item.set}}</b></a>
    </div>

                </div>
                <div class="nft-header d-flex">
                   <div class="rounded-pill d-flex align-items-center p-2 " style="background-color: black">
                   <div>
                   <small>QTY: </small>
                   </div>
                   <div class="ms-1">
                     <h2 class="m-0">{{formatNumber(item.qty,'0','.',',')}}</h2>
                   </div>
                   </div>
                </div>
                <div class="nft-header d-flex">
                   <button type="button" class="ms-auto btn-close btn-close-white" data-bs-dismiss="modal"
                      aria-label="Close"></button>
                </div>
             </div>
 
             <!-- START BODY -->
             <div class="card-body row d-flex ">
 
                <!-- Mint detail col 1 -->
                <div class="col-lg-6 px-0 px-sm-2">
                   <div class="col-12 px-0 px-sm-2">
                      <!-- Mint img -->
                      <div class="p-2 flex-grow-1 d-flex">
                        <img v-if="wrapped" class="w-100 border border-dark border-2 rounded mt-auto mb-auto"
                        :src="'https://ipfs.io/ipfs/' + wrapped">
                      </div>
                      <div class="flex-shrink-1">
                        <div class="text-center">
                            
                        </div>
                       
                        </div>
                      <div class="d-flex px-2 pb-2 mb-2 align-items-center" :alt="item.setname + '-' + item.uid">
                      <h3 class="m-0"
                                :style="{'background-image': colors}"
                                style="-webkit-background-clip: text;
                                       -webkit-text-fill-color: transparent; 
                                       -moz-background-clip: text;
                                       -moz-text-fill-color: transparent;">
                                <span>sealed NFT</span></h3>
                                <!-- owner info -->
                                <div class="ms-auto" v-if="item.owner != account">
                                   <a title="Item From" :href="'/@' + item.from" role="button" class="btn btn-lg btn-outline-light" v-if="item.from != account">
                                   <i class="fa-solid fa-truck-arrow-right fa-flip-horizontal fa-fw me-1"></i>  
                                      {{item.from}}
                                   </a>
                                   <a title="Item To" :href="'/@' + item.to" role="button" class="btn btn-lg btn-outline-light" v-if="item.from == account">
                                   <i class="fa-solid fa-truck-arrow-right fa-fw me-1"></i>
                                      {{item.to}}
                                   </a>
                                </div>
                      <!--Open-->
                      <div class="ms-auto" v-if="item.qty > 0 && !item.from">
                      <button type="button" class="btn btn-outline-success" title="Open Mint" 
                      @click="openNFT()"><i class="fas fa-box-open fa-fw"></i> Open</button>
                     </div>
                     
                      </div>
                         <!--back forward btns-->
                         <div class="d-flex align-items-center">
                            <h2><a class="text-muted p-3" role="button" @click="modalPrev()"><i
                                     class="fas fa-caret-square-left"></i></a>
                            </h2>
                            <!--<small class="ms-auto text-muted"><i>Item
                        index + 1 of
                        {{NFTselect.auctionOnly || NFTselect.saleOnly ||
                        NFTselect.sort == 'price' ||
                        items.length}}</i></small>-->
                            <h2 class="ms-auto"><a class="text-muted p-3" role="button" @click="modalNext()"><i
                                     class="fas fa-caret-square-right"></i></a>
                            </h2>
                         </div>
                      </div>
 
                   </div>
                
 
                <!-- Mint detail col 2 -->
                <div class="col-lg-6 px-0 px-sm-2">
                   <div class="accordion" id="ftAccordion">
 
                      <!-- Mint Description -->
                      <div class="accordion-item">
                         <h2 class="accordion-header">
                            <button onclick="this.blur();" class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                            v-bind:class="{'collapsed' : item.sale || item.auction || item.qty != 0 }"
                               data-bs-target="#collapseftDescription" aria-expanded="true"
                               aria-controls="collapseftDescription">
                               <i class="fas fa-list me-3"></i>DESCRIPTION
                            </button>
                         </h2>
                         <div id="collapseftDescription" class="accordion-collapse collapse"  
                            v-bind:class="{'show' : !item.sale && !item.auction && item.qty == 0 }" 
                            data-bs-parent="#ftAccordion">
                            <div class="accordion-body">
                            
                               <h3>{{setdetail.name_long}}</h3>
                               <p>{{info}}</p>
                               <div class="d-flex align-items-center"> 
                                 <div class="text-start small border border-secondary rounded text-white px-2 py-1 w-100">
                                    <div class="d-flex align-items-center justify-content-start flex-wrap"  v-if="!inventory">
                                       <span class="mb-0" title="Total Number of Owners"><i class="fa-solid fa-user-astronaut fa-fw"></i> {{setdetail.owners}}</span>
                                       <span class="mb-0 ms-2" title="Total Number of Items"><i class="fa-solid fa-star fa-fw"></i> {{setdetail.minted - setdetail.deleted}}</span>     
                                       <span class="mb-0 ms-2" title="Layer 2 Honeycomb Sidechain"><i class="fa-solid fa-link fa-fw"></i> {{item.token}}</span>
                                    </div>
                                    <div class="d-flex align-items-center justify-content-start flex-wrapa">
                                       <span class="mb-0 me-2" title="Melt Value if Item is Burned"><i class="fa-solid fa-fire fa-fw"></i> {{naiString(setdetail.bond)}}</span>
                                       <span class="mb-0 me-2" title="Last Market Dividends Paid Out to Owners"><i class="fa-solid fa-money-bill-transfer fa-fw"></i> {{naiString(setdetail.last_div)}}</span>
                                       <span class="mb-0 me-2" title="Total Market Dividends Paid Out to Owners"><i class="fa-solid fa-money-bill-trend-up fa-fw"></i>{{naiString(setdetail.total_div)}}</span>
                                    </div>
                                    <p class="m-0" title="Royalties"><i class="fa-solid fa-crown fa-fw"></i> {{royaltySplit(setdetail.royalty_allocation)}}</p>
                                 </div>
                               </div>
                               
                          
                            </div>
                         </div>
                      </div>

                      <!-- Mint Transfer -->
                      <div class="accordion-item" v-if="item.qty > 0 && !item.from ">
                         <h2 class="accordion-header">
                            <button onclick="this.blur();" class="accordion-button" type="button" data-bs-toggle="collapse"
                               data-bs-target="#collapseftTransfer" aria-expanded="false" aria-controls="collapseftTransfer">
                               <i class="fas fa-exchange-alt me-3"></i>TRANSFER
                            </button>
                         </h2>
                         <div id="collapseftTransfer" class="accordion-collapse collapse show"
                            data-bs-parent="#ftAccordion">
                            <div class="accordion-body">
                               <div class="">
 
                                  <ul class="nav nav-pills justify-content-center">
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
                                        <form id="ftGiveForm" class="needs-validation mt-4"
                                           @submit.prevent="validateForm('ftGiveForm', 'ftGiveFormValid');giveFT()"
                                           novalidate>
                                           <div class="">
                                              <label for="giveFTqty" class="form-label">Quantity</label>
                                              <div class="position-relative has-validation mb-3">
                                                 <input type="number" class="pe-5 form-control bg-dark border-dark text-info" v-model="give.qty"
                                                    aria-describedby="giveFTqtyappend" step="1" min="1" required>
                                                 <span class="position-absolute top-50 end-0 translate-middle-y pe-2 text-white">
                                                       {{item.set}} FT
                                                 </span>
                                                 <div class="invalid-feedback"> Please enter the
                                                    number of
                                                    FTs to send. </div>
                                              </div>
                                           </div>
                                           <!--:action="javascript:giveFT('{{item.data.set}}','{{giveFTusername.value}}','{{giveFTqty.value}}')"-->
                                           <div class="">
                                              <label for="giveFTusername" class="form-label">Username</label>
                                              <div class="position-relative has-validation mb-3">
                                                       <span class="position-absolute top-50 translate-middle-y ps-2">
                                                          <i class="fa-solid fa-at fa-fw"></i>
                                                       </span>
                                                 <input type="text" class="ps-4 form-control text-info bg-dark border-dark" v-model="give.to"
                                                    aria-describedby="giveFTuserprep" required>
                                                 <div class="invalid-feedback"> Please enter the
                                                    username
                                                    you'd like to give to. </div>
                                              </div>
                                           </div>
                                           
                                           <div class="text-center">
                                              <button id="giveFTbutton" class="btn btn-info my-2" @click="giveFT()"
                                                 type="submit">Give</button>
                                           </div>
                                        </form>
                                     </div>
                                     <div role="tabpanel" class="tab-pane fade show " id="tradeFTtab"
                                        aria-labelledby="tradeFT">
                                        <!-- TRADE FORM -->
                                        <form id="ftTradeForm" class="needs-validation mt-4"
                                           @submit.prevent="validateForm('ftTradeForm', 'ftTradeFormValid');tradeFT()"
                                           novalidate>

                                           <div class="mb-3">
                                           <label for="tradeFTqty" class="form-label">Quantity</label>
                                           <div class="position-relative has-validation mb-3">
                                           
                                              <input type="number" class="pe-5 form-control bg-darkg border-0 text-info"
                                                 id="tradeFTqty" aria-describedby="tradeFTqtyappend"
                                                 placeholder="1" step="1" min="1" required readonly >
                                                 <span class="position-absolute top-50 end-0 translate-middle-y pe-2 text-white-50">
                                                 {{item.set}} FT
                                           </span>
                                              
                                              <div class="invalid-feedback"> Please enter the
                                                 number
                                                 of FTs to trade. </div>
                                           </div>
                                        </div>
                                           <!--:action="javascript:tradeFT('{{item.data.set}}','{{tradeFTusername.value}}','{{tradeFTamount.value}}')"-->

                                              <label for="tradeFTusername" class="form-label">Username</label>
                                              <div class="position-relative has-validation mb-3">
                                                       <span class="position-absolute top-50 translate-middle-y ps-2">
                                                          <i class="fa-solid fa-at fa-fw"></i>
                                                       </span>
                                                 <input type="text" class="ps-4 form-control bg-dark border-dark text-info " id="tradeFTusername"
                                                    aria-describedby="tradeFTuserprep" v-model="trade.to" required>
                                                 <div class="invalid-feedback"> Please enter the
                                                    username
                                                    you'd like to trade with. </div>
                                              </div>
                      
                                           
                                              
                                              <div>
                                                 <label for="tradeFTamount" class="form-label d-flex">Amount
                                                 <small v-if="trade.token == item.token"
                                                    class="ms-auto align-self-center text-white-50">
                                                    0% FEE
                                                 </small>
                                                 <small v-else class="ms-auto align-self-center text-white-50">
                                                    1% FEE
                                                 </small>
                                                 </label>
                                                 <div class="position-relative has-validation mb-3">
                                                    <input type="number" class="pe-5 form-control bg-dark border-dark text-info "
                                                       id="tradeFTamount" v-model="trade.amount"
                                                       aria-describedby="tradeFTamountappend" placeholder="0.000"
                                                       step="0.001" min="0.001" required>
                                                       <span class="position-absolute top-50 end-0 translate-middle-y ps-2">
                                                       <select aria-label="Trade price type select"
                                                          class="form-select border-0 text-white pe-4 w-100 h-100">
                                                          <option selected :value="item.token">
                                                             {{toUpperCase(item.token)}}</option>
                                                       </select>
                                                    </span>
                                                    <div class="invalid-feedback"> Please enter the
                                                       amount
                                                       of DLUX you'd like to receive. </div>
                                                 </div>
                                              </div>

                                             
                                           
                                           <div class="text-center">
                                              <button id="tradeFTbutton" class="btn btn-info my-2" type="submit">Propose
                                                 Trade</button>
                                           </div>
                                        </form>
                                     </div>
                                     <div role="tabpanel" class="tab-pane fade show " id="sellFTtab"
                                        aria-labelledby="sellFT">
                                        <!-- SELL FORM -->
                                        <form class="needs-validation mt-4" novalidate @submit.prevent="sellFT()">
                                           <div class="">
                                              <div class="">
                                                 <label for="sellFTqty" class="form-label">Quantity</label>
                                                 <div class="position-relative has-validation mb-3">
                                                    <input type="number" v-model="sell.qty"
                                                       class="pe-5 form-control bg-dark border-dark text-info" id="sellFTqty"
                                                       aria-describedby="sellFTqtyappend" placeholder="1" step="1"
                                                       min="1" required :readonly="sell.token == item.token">
                                                       <span class="position-absolute top-50 end-0 translate-middle-y pe-2 text-white">
                                                       {{item.set}} FT
                                                 </span>
                                                    <div class="invalid-feedback"> Please enter the
                                                       number
                                                       of FTs to sell. </div>
                                                 </div>
                                              </div>
                                              <div class="">
                                                 <label for="sellFTprice" class="form-label">Sale
                                                    Price</label>
                                                 <small v-if="sell.token == item.token"
                                                    class="float-end mb-2 align-self-center text-white-50">
                                                    0% FEE
                                                 </small>
                                                 <small v-else class="float-end mb-2 align-self-center text-white-50">
                                                    1% FEE
                                                 </small>
                                                 <div class="position-relative has-validation mb-3">
                                                    <input type="number" class="pe-5 form-control bg-dark border-dark text-info" id="sellFTprice"
                                                       aria-describedby="sellFTpriceappend" placeholder="0.000"
                                                       step="0.001" min="0.001" required>
                                                       <span class="position-absolute top-50 end-0 translate-middle-y ps-2">
                                                       <select @change="sell.qty = 1"
                                                          aria-label="Trade price type select"
                                                          class="pe-4 form-select border-0 text-white w-100 h-100"
                                                          v-model="sell.token">
                                                          <option :value="item.token">{{toUpperCase(item.token)}}
                                                          </option>
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
                                              You can choose to have sells distributed to multiple accounts. Must
                                              equal 100%.
                                              <bennies eq100="true" :list="bens" @update-bennies="bens=$event">
                                              </bennies>
                                           </div>
                                           <div class="row mb-3">
                                              <p class="text-white-50 small">Ownership will be
                                                 transferred to
                                                 the DAO listing service and sold publicly. Cancel
                                                 anytime to
                                                 return immediately.</p>
                                           </div>
                                           <div class="text-center">
                                              <button id="sellFTbutton" class="btn btn-info my-2" @click="sellFT()">List
                                                 Item</button>
                                           </div>
                                        </form>
                                     </div>
                                     <div role="tabpanel" class="tab-pane fade show " id="auctionFTtab"
                                        aria-labelledby="auctionFT">
                                        <!-- AUCTION FORM -->
                                        <form class="needs-validation mt-4" novalidate novalidate
                                           @submit.prevent="auctionFT()">
                                           <!--:action="javascript:auctionFT('{{item.data.set}}','{{auctionFTprice.value}}','{{Date.now()}}','{{auctionFTdays.value}}'),'{{auctionFTpriceType.value}}'"-->
                                           <div class="">
                                              <div class="">
                                                 <label for="auctionFTqty" class="form-label">Quantity</label>
                                                 <div class="position-relative has-validation mb-3">
                                                    <input type="number"
                                                       class="pe-5 form-control text-info bg-darkg border-0" id="auctionFTqty"
                                                       aria-describedby="auctionFTqtyappend" placeholder="1" step="1"
                                                       min="1" readonly>
                                                    <span class="position-absolute top-50 end-0 translate-middle-y pe-2 text-white-50">
                                                    {{item.set}} FT
                                              </span>
                                                    <div class="invalid-feedback"> Please enter the
                                                       number
                                                       of FTs to auction. </div>
                                                 </div>
                                              </div>
                                              <div class="">
                                                 <label for="auctionFTprice" class="form-label">Starting
                                                    Bid</label>
                                                 <small class="float-end mb-2 align-self-center text-white-50">
                                                    0% FEE
                                                 </small>
                                                 <!--<small v-if="auction.token == item.token"  v-else class="float-end mb-2 align-self-center text-white-50">
                                         1% FEE
                                     </small> -->
                                     <div class="position-relative has-validation mb-3">
                                                    <input type="number" v-model="auction.price"
                                                       class="pe-5 form-control bg-dark border-dark text-info" id="auctionFTprice"
                                                       aria-describedby="auctionFTpriceappend" placeholder="0.000"
                                                       step="0.001" min="0.001" required>
                                                       <span class="position-absolute top-50 end-0 translate-middle-y pe-2">
                                                       <!--<select aria-label="Trade price type select" class="pe-4 form-select border-0 text-white-50 w-100 h-100" v-model="auction.token">
                                             <option :value="item.token">{{toUpperCase(item.token)}}</option>
                                             <option selected value="hive">HIVE</option>
                                             <option value="hbd">HBD</option>
                                         </select>-->
                                                       {{toUpperCase(item.token)}}
                                                    </span>
                                                    <div class="invalid-feedback"> Please enter the
                                                       amount
                                                       of DLUX you'd like to start the bidding.
                                                    </div>
                                                 </div>
                                              </div>
                                           </div>
                                           <div class="d-flex">
                                              <div class="w-100 mb-3">
                                                 <label for="auctionFTdays" class="form-label">Duration</label>
                                                 <select v-model="auction.days"
                                                    class="btn btn-lg btn-dark form-select" id="auctionFTdays"
                                                    required>
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
                                           <div class="mb-3">
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
                                        <form id="airdropFT" class="needs-validation mt-4" novalidate
                                           @submit.prevent="checkForm('airdropFT', airdropFT)">
                                           <div class="mb-3">
                                              <div class="">
                                                 <label for="airdropFTqty" class="form-label">Quantity
                                                    sent
                                                    to each</label>
                                                    <div class="position-relative has-validation mb-3">
                                                    <input type="number" class="pe-5 form-control bg-darkg border-0 text-info"
                                                       id="airdropFTqty" aria-describedby="airdropFTqtyappend"
                                                       placeholder="1" step="1" min="1" required readonly>
                                                       <span class="position-absolute top-50 end-0 translate-middle-y pe-2 text-white-50">
                                                       {{item.set}} FT
                                                 </span>
                                                    <div class="invalid-feedback"> Please enter the
                                                       number
                                                       of FTs to send to each account. </div>
                                                 </div>
                                              </div>
                                           </div>
                                           <div class="mb-3">
                                              <div class="col-12">
                                                 <label for="airdropFTusers" class="form-label">Airdrop
                                                    to</label>
                                                 <div class="input-group has-validation">
                                                    <textarea name="paragraph_text" cols="50" rows="2"
                                                       class="form-control bg-dark border-dark text-info" id="airdropFTusers"
                                                       aria-describedby="airdropFT" v-model="airdrop.to_string"
                                                       @blur="validateAirdrop()" required
                                                       placeholder="name user-name"></textarea>
                                                 </div>
                                                 <div v-if="airdropFeedback">{{airdropFeedback}}</div>
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

                      <!-- Mint Trade -->
                      <div class="accordion-item" v-if="item.from">
                      <h2 class="accordion-header">
                            <button onclick="this.blur();" class="accordion-button" type="button" data-bs-toggle="collapse"
                               data-bs-target="#collapseftTrade" aria-expanded="false" aria-controls="collapseftTrade">
                               <i class="fa-solid fa-paper-plane fa-fw me-3"></i>TRADE
                            </button>
                         </h2>
                         <div id="collapseftTrade" class="accordion-collapse collapse show"
                         data-bs-parent="#ftAccordion">
                         <div class="accordion-body">
                           
                           
                           <div class="p-2 text-white text-center rounded"">
                           <section>
                             <div class="d-flex align-items-center">
                               <div class="text-end mt-auto mb-auto me-1" style="flex: 1">
                                 <h5 class="small m-0">
                                   <span v-if="item.to != account">TO:</span>
                                   <span v-if="item.to == account">FROM:</span>
                                 </h5>
                               </div>
                               <div class="text-start mt-auto mb-auto" style="flex: 2">
                                 <h5 class="lead m-0">
                                   <a class="no-decoration text-info" v-if="item.to != account" :href="'/@' + item.to">{{item.to}}</a>
                                   <a class="no-decoration text-info" v-if="item.to == account" :href="'/@' + item.from">{{item.from}}</a>
                                 </h5>
                               </div>
                             </div>
                             <div class="d-flex align-items-center my-2">
                               <div class="text-end mt-auto mb-auto me-1" style="flex: 1">
                                 <h5 class="small m-0">PRICE:</h5>
                               </div>
                               <div class="text-start mt-auto mb-auto" style="flex: 2">
                                 <h5 class="lead m-0">{{item.priceString}}</h5>
                               </div>
                             </div>
                           </section>
                             <!-- ACCEPT / REJECT -->
                             <div class="mt-2 mb-3" role="group" v-if="item.to == account">
                                 <button type="button" class="btn btn-danger" title="Decline Trade"
                                 @click="cancelXfr()"><i class="fa-solid fa-xmark fa-fw ms-2"></i>Decline</button>
                                 <button type="button" class="btn ps-05 pe-05 border-0"
                                 disabled></button>
                                 <button type="button" class="btn btn-success" title="Accept Trade"
                               @click="acceptXfr()"><i class="fa-solid fa-check fa-fw ms-2"></i> Accept</button>
                              </div>
                                <!-- CANCEL -->
                                <div class="mt-2 mb-3" v-if="item.from == account">
                                <button type="button" class="btn btn-warning" title="Cancel Trade"
                                 @click="cancelXfr()">
                                 <i class="fa-solid fa-xmark fa-fw ms-2"></i> Cancel</button>
                                </div>
                           </div>

                           </div>
                           </div>

                      <!-- Mint Auctions -->
                      <div class="accordion-item" v-if="mintauctions.length">
                         <h2 class="accordion-header">
                            <button onclick="this.blur();" class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                               data-bs-target="#collapseftBid" aria-expanded="true" aria-controls="collapseftBid">
                               <i class="fas fa-comment-dollar me-3"></i><span>BID
                                  NOW</span><span class="small ms-2">lowest bid</span>
                            </button>
                         </h2>
                         <div id="collapseftBid" class="accordion-collapse collapse" data-bs-parent="#ftAccordion">
                            <div class="accordion-body">
                                        <table class="table table-sm">
                                          <thead>
                                            <tr>
                                              <th scope="col" class="small">SUPPLY</th>
                                              <th scope="col" class="small">PRICE</th>
                                              <th scope="col" class="small">QTY</th>
                                              <th scope="col"></th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            <tr scope="row" v-for="ad in mintsales">
                                              <td style="vertical-align: middle">
                                                {{formatNumber(ad.qty,0,'.',',')}}</td>
                                              <td style="vertical-align: middle">
                                                {{naiString(ad.pricenai)}}</td>
                                              <td><span v-show="true" class="text-center">
                                                  <form class="needs-validation" novalidate>
                                                    <input value="1" required type="number" min="1" step="1" max="ad.qty"
                                                      class="form-control text-info" style="max-width: 100px" v-model="ad.buyQty">
                                                    <button type="submit" class="btn btn-info d-none" v-show="ad.by != account"
                                                      @click="buyMint(ad.uid)">Buy</button>{{toFixed(ad.buyQty *
                                                    ad.pricenai.amount,0)}}
                                                    {{ad.pricenai.tokrn}}
                                                  </form>
                                                </span>
                                                </span></td>
                                              <td>
                                                <div>
                                                  <button type="submit" class="btn btn-info" v-show="ad.by != account"
                                                    onclick="submit()">Buy</button>
                                                  <!-- <button class="btn btn-primary" v-show="ad.by != account">Buy</button> -->
                                                  <button class="btn btn-warning" v-show="ad.by == account">Cancel</button>
                                                </div>
                                              </td>
                                            </tr>
                                          </tbody>
                                        </table>
                                    </div>
                                  </div>
                              </div>
 
                      <!-- Mint Sales -->
                      <div class="accordion-item" v-if="mintauctions.length">
                         <h2 class="accordion-header">
                            <button @click="saleData('itemmodal')" onclick="this.blur();" class="accordion-button collapsed" type="button"
                               data-bs-toggle="collapse" data-bs-target="#collapseftBuy" aria-expanded="true"
                               aria-controls="collapseftBuy">
                               <i class="fas fa-money-bill-wave me-3"></i><span>BUY
                                  NOW</span><span class="small ms-2">lowest price</span>
                            </button>
                         </h2>
                         <div id="collapseftBuy" class="accordion-collapse collapse" data-bs-parent="#ftAccordion">
                            <div class="accordion-body">
                            <table class="table table-sm">
                            <thead>
                              <tr>
                                <th scope="col" class="small">QTY</th>
                                <th scope="col" class="small">BID</th>
                                <th scope="col" class="small">TOTAL</th>
                                <th scope="col" class="small">HIGH BIDDER</th>
                              </tr>
                          </thead>
                            <tbody>
                              <tr v-for="auc in mintauctions">
                                <th scope="row" colspan="4" style="background-color: crimson">
                                  <span>{{auc.time}}</span>
                                </th>
                              </tr>
                              <tr v-for="auc in mintauctions">
                                <th scope="row">1</th>
                                <td>{{naiString(auc.pricenai)}}</td>
                                <td>&asymp;
                                  {{auc.price}}
                                </td>
                                <td>{{auc.bidder}}</td>
                              </tr>
                              <tr v-for="auc in mintauctions">
                                <th scope="row" colspan="2"></th>
                                <td><input class="form-control " type="number">
                                </td>
                                <td><button class="btn btn-secondary" @click="bidNFT(auc)">Bid</button>
                                </td>
                              </tr>
                            </tbody>
                            <th scope="col" class="small"></th>
                            <th scope="col" class="small"></th>
                            </tr>
                          </table>
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
    // @click="modalIndex('itemModal', item.setname + ':' + item.uid );hidden = false"
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
        mintauctions: {
            required: false,
            default: function () {
                return [];
            },
        },
        mintsales: {
            required: false,
            default: function () {
                return [];
            },
        },
        auctions: {
            required: false,
            default: function () {
                return [];
            },
        },
        sales: {
            required: false,
            default: function () {
                return []
            },
        },
        api: {
            default: '',
            required: true
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
        setdetail: {
            default: function () {
                return {
                    author:"disregardfiat",
                    bond:{
                        amount:0,
                        precision:3,
                        token:"DLUX",
                    },
                    encoding:"svg",
                    fee:{
                        amount:0,
                        precision:3,
                        token:"DLUX",
                    },
                    last_div:{
                        amount:0,
                        precision:3,
                        token:"DLUX",
                    },
                    link:"disregardfiat/dlux-founders-set-nft",
                    max:4096,
                    max_exe_length:0,
                    max_opt_length:0,
                    minted:"1x",
                    name:"dlux",
                    name_long:"DLUX Founders",
                    permlink:"dlux-founders-set-nft",
                    royalty:"100",
                    royalty_allocation:"disregardfiat_5000,markegiles_5000",
                    script:"QmYSRLiGaEmucSXoNiq9RqazmDuEZmCELRDg4wyE7Fo8kX",
                    set:"dlux",
                    owners: 0,
                    total_div:{
                        amount:0,
                        precision:3,
                        token:"DLUX",
                    },
                    type:1,
                    };
                }
        },
        info: {
            default: ''
        },
        icon: {
            default: ''
        },
        inventory: {
            default: false
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
                days: 7,
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
                    price: parseInt(parseFloat(this.auction.price) * 1000),
                    time: parseInt(this.auction.days),
                },
                id: `${this.item.token}_ft_auction`,
                msg: `Giving ${this.item.set} mint token...`,
                ops: ["getTokenUser"],
                api: this.api,
                txid: `${this.item.token}_ft_auction`,
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
        royaltySplit(royalty) {
            var split = royalty?.split(',') || []
            var string = ''
            for (var i = 0; i < split.length; i++) {
                var s = split[i].split('_')
                string += `@${s[0]}: ${(s[1]/100).toFixed(2)}%\n`
            }
            return string
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
        },
        naiString(nai) {
          return `${parseFloat(nai.amount / Math.pow(10, nai.precision)).toFixed(
            nai.precision
          )} ${nai.token}`;
        }
    },
    mounted() {
    },
}