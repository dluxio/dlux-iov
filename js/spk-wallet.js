import ModalVue from './modal-manager.js'
import MCommon from '/js/methods-common.js'
import MSpk from '/js//methods-spk.js'

export default {
    components: {
        "modal-vue": ModalVue
    },
    template: `
    <div class="">
        <div class="">
            <div class="alert alert-danger text-start bg-dark d-none" role="alert">
                <h3 class="text-center"><i
                        class="fa-solid fa-triangle-exclamation me-2"></i>Mirror
                    Network
                    Disclaimer<i
                        class="fa-solid fa-triangle-exclamation ms-2"></i>
                </h3>
                <p>For testing we have a mirror network. This
                    means and real
                    transactions
                    you make can effect your test wallet. By
                    default actions
                    you make on
                    this page won't effect your real balances.
                </p>
                <p>Actions that don't have "Mirror Network Only"
                    will not
                    effect your real
                    account.</p>
            </div>
            <div class="d-flex align-items-center mb-1">
                <div class="d-flex align-items-start">
                    <h1 class="display-5 m-0 d-flex align-items-center">SPK<span v-if="sapi == 'https://spktest.dlux.io'" class="badge rounded-pill text-bg-info text-black ms-1"
                                style="font-size: .6ch;">TEST NET
                            </span><i class="fa-solid fa-link fa-fw ms-2"></i></h1>
                </div>
                <div class="text-center small p-2 ms-2" v-bind:class="{'text-success': larynxbehind < 30,
                            'text-warning': larynxbehind >= 30,
                            'text-danger': larynxbehind > 100}"> <span
                        v-show="larynxbehind < 30">ONLINE -
                    </span> <span
                        v-show="larynxbehind >= 30 && larynxbehind <=100">LAGGING
                        - </span> <span v-show="larynxbehind > 100">OFFLINE
                        -
                    </span> <span>{{larynxbehind}} Blocks behind
                        HIVE</span>
                </div>
                <div id="userNode" class="ms-auto" if="isnode">
                </div>
            </div>
            <div class="text-start">
                <p class="mb-0 lead">Decentralized and incentivized
                    network
                    infrastructure that rewards service operators</p>
            </div>
            <!--claim  rewards-->
            <div class="bg-special border border-4 border-dark rounded my-3"
                id="larynxclaimrewards" v-if="(saccountapi.claim_spk > 0 || saccountapi.claim > 0) && me">
            <div class="d-flex text-dark flex-wrap align-items-center p-3" style="background-color: #00000020">
                <div>
                    <div class="d-flex align-items-start">
                        <h4 class="m-0">Claim Rewards
                        </h4>
                    </div>
                    <p>Claimable rewards
                        for running or delegating to a
                         service
                        node</p>
                </div>
                <div id="claimlarynxrewardbtn" class="ms-auto text-end">
                <h5 v-if="saccountapi.claim_spk
 > 0">{{formatNumber((saccountapi.claim_spk
)/1000, 3, '.', ',')}} SPK
                    </h5>    
                <h5 v-if="saccountapi.claim > 0">{{formatNumber((saccountapi.claim)/1000, 3, '.', ',')}} LARYNX
                    </h5>
                    <div class="mb-2"> <span class="small">50%
                            Liquid |
                            50%
                            Power</span></div>
                    <div v-show="saccountapi.gov > 0" class="text-white">
                        <div class="input-group my-3">
                            <span
                                class="input-group-text bg-dark border-info text-info">
                                <div class="form-check form-switch ">
                                    <input class="form-check-input"
                                        type="checkbox" role="switch"
                                        id="flexSwitchCheckDefault"
                                        v-model="spk2gov">
                                    <label class="form-check-label"
                                        for="flexSwitchCheckDefault">Claim
                                        GOV not
                                        PWR</label>
                                </div>
                            </span>
                        </div>
                    </div>
                    <div class="btn-group" role="group"
                        aria-label="SPK Network Claim">
                        <button type="submit" class="btn btn-dark "
                            @click="rewardClaim('spkcc', 'shares_claim', spk2gov)"><i
                                class="fas fa-coin"></i><i
                                class="fas fa-money-bill-wave-alt me-2"></i>Claim</button>
                    </div>
                </div>
            </div>
            </div>
            <!-- spk banner -->
            <div class="d-flex justify-content-center align-items-center bg-dark my-3 p-2 rounded">
                <img src="/img/spknetwork/spk_logomark.png" class="img-fluid" alt="SPK Logomark" style="height: 70px;">
            </div>
            <!-- Liquid SPK -->
            <div
                class="d-flex flex-wrap align-items-center border-bottom border-white-50 py-3">
                <div class="ratio ratio-1x1 me-4" style="width: 70px;">
                    <div class="rounded-circle border border-light bg-dark d-flex justify-content-center align-items-center">
                        <img src="/img/spknetwork/spk_icon.png" class="rounded img-fluid p-1" alt="SPK Token Logo">
                    </div>
                </div>
                <div>
                    <div class="d-flex align-items-start fs-4 fw-bold">SPK
                            
                        </div>
                    <p class="text-white-50 m-0">The governance
                        token for
                        SPK Network
                    </p>
                </div>
                <div class="ms-auto text-end">
                    <h5 class="d-flex align-items-center justify-content-end">
                        {{formatNumber((saccountapi.spk)/1000,
                        3, '.',
                        ',')}}
                        <span class="ms-2">SPK</span><span class="ms-1 badge bg-light text-dark d-flex align-items-center justify-content-center rounded-circle" style="width: 1.25rem; height: 1.25rem;">
                                                                    <i class="fa-solid fa-atom" style="font-size: .5rem;"></i>
                                                                </span>
                    </h5>
                    <div class="btn-group" role="group"
                        aria-label="SPK Actions">
                        <button type="button" class="btn btn-light p-0">
                            <modal-vue 
                                v-if="protocolspk.head_block && saccountapi.head_block" func="send" 
                                :mypfp="mypfp" 
                                token="spk" 
                                :test="test"
                                :tokenuser="saccountapi" 
                                :account="account"
                                :tokenprotocol="protocolspk"
                                @modalsign="sendIt($event)" 
                                v-slot:trigger>
                                <span  class="p-2 trigger">
                                    <i class="fas fa-paper-plane me-2"></i>Send
                                </span>          
                            </modal-vue>
                        </button>
                        <button type="button"
                            class="btn btn-dark ms-0 me-0 ps-0 pe-0"
                            disabled></button>
                        <div class="btn-group" role="group" v-if="me">
                            <button type="button"
                                class="btn btn-light dropdown-toggle"
                                data-bs-toggle="dropdown" aria-haspopup="true"
                                aria-expanded="false"></button>
                            <ul class="dropdown-menu dropdown-menu-dark bg-black dropdown-menu-end text-white"
                                aria-labelledby="btnGroupDrop1">
                                <modal-vue
                                    class="dropdown-menu-item" 
                                    v-if="protocolspk.head_block && saccountapi.head_block" func="powup" 
                                    token="spk" 
                                    :test="test"
                                    :tokenuser="saccountapi" 
                                    :account="account"
                                    :tokenprotocol="protocolspk"
                                    :mypfp="mypfp" 
                                    @modalsign="sendIt($event)" 
                                    v-slot:trigger>
                                    <button class="dropdown-item trigger"
                                        type="button"><i class="fas fa-angle-double-up fa-fw me-2"></i>Power Up</button>
                                </modal-vue>
                                <div class="dropdown-divider">
                                </div>
                                <div class="dropdown-menu-item">
                                    <a class="dropdown-item" href="/dex/?api=https://spktest.dlux.io/spk"
                                    id="buylink" target="_blank"><i
                                        class="fas fa-coins fa-fw me-2"></i>Buy / Sell</a>
                                </div>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            <!-- SPK Power -->
            <div class="d-flex flex-column py-3">
                <div class="d-flex flex-wrap align-items-center justify-content-center">
                    <div class="me-4 position-relative" style="width: 70px;">
                        <div class="ratio ratio-1x1">
                            <div class="rounded-circle border border-warning d-flex justify-content-center align-items-center bg-dark">
                                <img src="/img/spknetwork/spk_icon.png" class="rounded img-fluid p-1" alt="SPK Token Logo">   
                            </div>
                        </div>
                        <div class="position-absolute top-0 start-0 translate-middle" style="margig-top: 10px; margin-left: 10px;">
                            <span class="badge bg-warning text-dark d-flex align-items-center justify-content-center rounded-circle" style="width: 1.5rem; height: 1.5rem;">
                                <i class="fa-solid fa-bolt-lightning" style="font-size: .65rem;"></i>
                            </span>
                        </div>
                        <div class="position-absolute top-100 start-100 translate-middle" style="margig-top: -3px; margin-left: -3px;">
                            <span class="badge bg-warning text-dark d-flex align-items-center justify-content-center rounded-circle" style="width: 2.5rem; height: 2.5rem;">
                                <i class="fa-solid fa-check-to-slot" style="font-size: 1.3rem;"></i>
                            </span>
                        </div>
                    </div>
               
                    <div class="text-start">
                        <div class="d-flex align-items-start fs-4 fw-bold">
                            SPK Power
                        </div>
                        <ul class="text-white-50">
                            <li>Enables voting</li>
                            <li>Instant Power Up | 4 Week Power Down
                            </li>
                            <li>Used as collateral to secure the DEX</li>
                        </ul>
                    </div>
                    <div class="ms-auto text-end">
                        <h5 class="d-flex align-items-center justify-content-end">
                            {{formatNumber((saccountapi.spk_power)/1000, 3, '.', ',')}}
                            <span class="ms-2 text-warning">SPK</span> <span class="ms-1 badge bg-warning text-dark d-flex align-items-center justify-content-center rounded-circle" style="width: 1.25rem; height: 1.25rem;">
                                <i class="fa-solid fa-bolt-lightning" style="font-size: .5rem;"></i>
                            </span>
                        </h5>
                        <div class="btn-group" role="group"
                            aria-label="Power Actions">
                            <!-- vote btn -->
                            <button class="dropdown btn btn-light" href="#" role="button" id="settingsDropdownBtn" data-bs-toggle="collapse" data-bs-target="#collapseVote" aria-expanded="false" aria-controls="collapseVote">
                                <i class="me-2 fa-solid fa-person-booth"></i>Vote</button>
                            <button type="button"
                                class="btn btn-dark ms-0 me-0 ps-0 pe-0"
                                disabled></button>
                            <div class="btn-group" role="group" v-if="me">
                                <button type="button"
                                    class="btn btn-light dropdown-toggle"
                                    data-bs-toggle="dropdown" aria-haspopup="true"
                                    aria-expanded="false"></button>
                                <ul class="dropdown-menu dropdown-menu-dark bg-black dropdown-menu-end text-white"
                                    aria-labelledby="btnGroupDrop1">
                                    <modal-vue 
                                        class="dropdown-menu-item"
                                        v-if="protocolspk.head_block && saccountapi.head_block" 
                                        func="powdn" 
                                        :mypfp="mypfp"
                                        token="spk_power" 
                                        :test="test"
                                        :tokenuser="saccountapi" 
                                        :account="account"
                                        :tokenprotocol="protocolspk"
                                        @modalsign="sendIt($event)" 
                                        v-slot:trigger>
                                        <button class="dropdown-item trigger"
                                            type="button"><i
                                                class="fas fa-angle-double-down fa-fw me-2"></i>Power
                                            Down</button>
                                    </modal-vue>
                                    <div class="dropdown-divider"></div>
                                    <modal-vue 
                                        class="dropdown-menu-item"
                                        v-if="protocollarynx.head_block && saccountapi.head_block" 
                                        type="election" 
                                        :mypfp="mypfp"
                                        token="spk" 
                                        :test="test"
                                        :tokenuser="saccountapi" 
                                        :account="account"
                                        :tokenprotocol="protocolspk"
                                        :smarkets="smarkets.node" 
                                        @modalsign="sendIt($event)" 
                                        v-slot:trigger>
                                        <button class="dropdown-item trigger"
                                            type="button"><i
                                                class="fa-solid fa-plug fa-fw me-2"></i>Elect
                                            Validators</button>
                                    </modal-vue>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="collapse mt-3 bg-dark rounded" id="collapseVote">
                    <div class="card card-body">
                        <div class="col col-lg-6 mx-auto">
                            <div class="fs-4 text-center">{{tokenGov.title}}</div>
                                <div class="lead text-center text-white-50 mb-3">  @{{account}}</div>
                                <form name="nodeSettings" class="needs-validation" novalidate>
                                    <div class="row mb-3" v-for="opt in tokenGov.options">
                                        <label :for="opt.json" class="form-label d-flex">
                                            {{opt.title}}: 
                                            {{opt.val}} 
                                            {{opt.unit}}
                                            <div class="dropdown show d-flex align-items-center p-0 m-0">
                                                <a class="text-white" href="#"
                                                    role="button"
                                                    data-bs-toggle="dropdown"
                                                    aria-haspopup="true"
                                                    aria-expanded="false">
                                                    <h5 class="m-0">
                                                        <i
                                                            class="fas fa-info-circle ms-2"></i>
                                                    </h5>
                                                </a>
                                                <div
                                                    class="dropdown-menu dropdown-menu-dark bg-black dropdown-menu-end text-white-50 text-left bg-black">
                                                    <p>{{opt.info}}
                                                    </p>
                                                </div>
                                            </div>
                                        </label>
                                        <div class="position-relative mb-3">
                                            <input type="range"
                                                v-model="opt.val"
                                                class="slider form-range"
                                                :id="opt.id"
                                                :max="opt.range_high"
                                                :min="opt.range_low"
                                                :step="opt.step" />
                                                <span v-if="opt.unit" class="d-none position-absolute end-0 top-50 translate-middle-y px-3 fw-bold">{{opt.unit}}</span>  
                                        </div>
                                    </div>
                                    <div class="text-center mt-3">
                                        <button id="saveSettingsBtn"
                                            type="button"
                                            class="btn btn-primary mb-2"
                                            @click="saveNodeSettings()">
                                            Vote<i
                                                class="ms-2 fa-solid fa-check-to-slot"></i>
                                        </button>
                                        <p class="small">Your
                                            vote cannot be
                                            changed or
                                            cancelled once
                                            submitted. Your vote power will recharge after 14 days</p>
                                    </div>
                                    <div class="text-start d-none">
                                        <p class="lead mb-1 text-center">
                                            VOTE POWER (VP)</p>
                                        <div class="progress mb-2"
                                            role="progressbar"
                                            aria-label="Vote Power"
                                            aria-valuenow="75" aria-valuemin="0"
                                            aria-valuemax="100">
                                            <div class="progress-bar"
                                                style="width: 75%">
                                                75%
                                            </div>
                                        </div>
                                        <ul class="small">
                                            <li>Recharge rate:
                                                14 days</li>
                                            <li>Voting will
                                                drain VP to 0%
                                            </li>
                                            <li>Full Recharge:
                                                {{formatNumber((spkStats.spk_cycle_length * 4)/28800, '.', ',', 2)}}
                                                days</li>
                                        </ul>
                                    </div>
                                </form>
                        </div>
                    </div>
                </div>
            </div>
            <!-- broca banner -->
            <div class="d-flex justify-content-center align-items-center bg-dark my-3 p-2 rounded">
                <img src="/img/spknetwork/broca_logomark.png" class="img-fluid" alt="BROCA Logomark" style="height: 70px;">
            </div>
            <!-- Liquid BROCA -->
            <div
                class="d-flex flex-wrap align-items-center border-bottom border-white-50 py-3">
                <div class="ratio ratio-1x1 me-4" style="width: 70px;">
                    <div class="rounded-circle border border-light bg-dark d-flex justify-content-center align-items-center">
                        <img src="/img/spknetwork/broca_icon.png" class="rounded img-fluid p-1" alt="BROCA Token Logo">
                    </div>
                </div>
                <div>
                    <div class="d-flex align-items-start fs-4 fw-bold">BROCA
                            
                        </div>
                    <p class="text-white-50 m-0">The storage
                        token for
                        SPK Network
                    </p>
                </div>
                <div class="ms-auto text-end">
                    <h5 class="d-flex align-items-center justify-content-end">
                        {{formatNumber((saccountapi.liq_broca)/1000,
                        3, '.',
                        ',')}}
                        <span class="ms-2">BROCA</span><span class="ms-1 badge bg-light text-dark d-flex align-items-center justify-content-center rounded-circle" style="width: 1.25rem; height: 1.25rem;">
                                                                    <i class="fa-solid fa-atom" style="font-size: .5rem;"></i>
                                                                </span>
                    </h5>
                    <div class="btn-group" role="group"
                        aria-label="SPK Actions">
                        <button type="button" class="btn btn-light p-0">
                            <modal-vue 
                                v-if="protocolspk.head_block && saccountapi.head_block" func="send" 
                                :mypfp="mypfp" 
                                token="liq_broca" 
                                :test="test"
                                :tokenuser="saccountapi" 
                                :account="account"
                                :tokenprotocol="protocolbroca"
                                @modalsign="sendIt($event)" 
                                v-slot:trigger>
                                <span  class="p-2 trigger">
                                    <i class="fas fa-paper-plane me-2"></i>Send
                                </span> 
                            </modal-vue>
                        </button>
                       <button type="button"
                            class="btn btn-dark ms-0 me-0 ps-0 pe-0"
                            disabled></button>
                        <div class="btn-group" role="group" v-if="me">
                            <button type="button"
                                class="btn btn-light dropdown-toggle"
                                data-bs-toggle="dropdown" aria-haspopup="true"
                                aria-expanded="false"></button>
                            <ul class="dropdown-menu dropdown-menu-dark bg-black dropdown-menu-end text-white"
                                aria-labelledby="btnGroupDrop1">
                                <modal-vue 
                                    class="dropdown-menu-item"
                                    v-if="protocolspk.head_block && saccountapi.head_block" func="powup" 
                                    token="liq_broca" 
                                    :test="test"
                                    :tokenuser="saccountapi" 
                                    :account="account" 
                                    :tokenprotocol="protocolbroca"
                                    :mypfp="mypfp" 
                                    @modalsign="sendIt($event)" 
                                    v-slot:trigger>
                                    <button class="dropdown-item trigger"
                                        type="button"><i class="fas fa-angle-double-up fa-fw me-2"></i>Power Up</button>
                                </modal-vue>
                                <div class="dropdown-divider">
                                </div>
                                <div class="dropdown-menu-item">
                                <a class="dropdown-item" href="/dex/?api=https://spktest.dlux.io/broca"
                                    id="buylink" target="_blank"><i
                                        class="fas fa-coins fa-fw me-2"></i>Buy / Sell</a>
                                </div>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            <!-- Broca Power-->
            <div class="d-flex flex-column justify-content-center">
            <div class="d-flex flex-wrap align-items-center py-3">
                    <div class="me-4 position-relative" style="width: 70px;">
                        <div class="ratio ratio-1x1">
                            <div class="rounded-circle border border-warning d-flex justify-content-center align-items-center bg-dark">
                                <img src="/img/spknetwork/broca_icon.png" class="rounded img-fluid p-1" alt="BROCA Token Logo">   
                            </div>
                        </div>
                        <div class="position-absolute top-0 start-0 translate-middle" style="margig-top: 10px; margin-left: 10px;">
                            <span class="badge bg-warning text-dark d-flex align-items-center justify-content-center rounded-circle" style="width: 1.5rem; height: 1.5rem;">
                                <i class="fa-solid fa-bolt-lightning" style="font-size: .65rem;"></i>
                            </span>
                        </div>
                        <div class="position-absolute top-100 start-100 translate-middle" style="margig-top: -3px; margin-left: -3px;">
                            <span class="badge bg-warning text-dark d-flex align-items-center justify-content-center rounded-circle" style="width: 2.5rem; height: 2.5rem;">
                                <i class="fa-solid fa-hard-drive" style="font-size: 1.3rem;"></i>
                            </span>
                        </div>
                    </div>
               
                <div class="text-start">
                    <div class="d-flex align-items-start fs-4 fw-bold">BROCA Power</div>
                    <ul class="text-white-50">
                        <li>Regenerative Resource Credits for IPFS Storage</li>
                        
                        <li>Recharges every 
                            {{formatNumber((spkStats.broca_refill / 28800), 2, '.', ',')}} Days, {{formatNumber((1 -
                            (broca_calc(saccountapi.broca))/(saccountapi.spk_power * 1000)) * (spkStats.broca_refill / 28800), 2, '.', ',')}}
                            Days until full
                        </li>
                        <li>Instant Power Up | 4 Week Power
                                Down</li>
                    </ul>
                </div>
                <div class="ms-auto text-end">
                <h5 class="d-flex align-items-center justify-content-end">
                        {{formatNumber((saccountapi.pow_broca)/1000,
                        3, '.',
                        ',')}}
                        <span class="ms-2 text-warning">BROCA</span>
                        <span class="ms-1 badge bg-warning text-dark d-flex align-items-center justify-content-center rounded-circle" style="width: 1.25rem; height: 1.25rem;">
                                <i class="fa-solid fa-bolt-lightning" style="font-size: .5rem;"></i>
                            </span>
                    </h5>
                   
                    <div class="btn-group" role="group"
                        aria-label="Power Actions">
                        <button type="button" class="btn btn-light p-0">
                            <!-- register -->
                            <div class="px-2" v-if="saccountapi.pubKey == 'NA'"
                            @click="updatePubkey">
                            <i class="fas fa-plus fa-fw me-2"></i>Register Account
                            </div>
                            <!-- new contract -->
                            <div v-if="saccountapi.pubKey != 'NA'">
                            <modal-vue 
                                v-if="protocolbroca.head_block && saccountapi.head_block" 
                                type="contract" 
                                :api="api"
                                :mypfp="mypfp" 
                                token="balance" 
                                :test="test"
                                :tokenstats="spkStats"
                                :tokenprotocol="protocolbroca"
                                :tokenuser="saccountapi" 
                                :account="account"
                                @modalsign="sendIt($event)" 
                                v-slot:trigger>
                                <span class="p-2 trigger"><i class="fa-solid fa-file-contract fa-fw me-2"></i>Storage Contract</span>
                            </modal-vue>
                            </div>
                        </button>
                      <button type="button"
                            class="btn btn-dark ms-0 me-0 ps-0 pe-0"
                            disabled></button>
                        <div class="btn-group" role="group" v-if="me">
                            <button type="button"
                                class="btn btn-light dropdown-toggle"
                                data-bs-toggle="dropdown" aria-haspopup="true"
                                aria-expanded="false"></button>
                            <ul class="dropdown-menu dropdown-menu-dark bg-black dropdown-menu-end text-white"
                                aria-labelledby="btnGroupDrop1">
                                <modal-vue 
                                    class="dropdown-menu-item"
                                    v-if="protocolspk.head_block && saccountapi.head_block" func="powdn" 
                                    token="pow_broca" 
                                    :test="test"
                                    :tokenuser="saccountapi" 
                                    :account="account" 
                                    :tokenprotocol="protocolbroca"
                                    :mypfp="mypfp" 
                                    @modalsign="sendIt($event)" 
                                    v-slot:trigger>
                                    <button class="dropdown-item trigger"
                                        type="button"><i class="fas fa-angle-double-down fa-fw me-2"></i>Power Down</button>
                                </modal-vue>
                            </ul>
                        </div>
                    </div>
                </div>
                
            </div>
            <div class="card-group mb-3 mt-2 rounded">
                <div class="card bg-img-none">
                    <div class="card-header bg-info-50 text-dark text-center">
                    <h3 class="card-title mb-0">Network Fee</h3>
                    </div>
                    <div class="card-body">
                    <div class="d-flex align-items-center mb-2 justify-content-center"><h5 class="mb-0 card-title text-info">
                            {{fancyBytes(1000 * ( spkStats.broca_daily_trend ? spkStats.broca_daily_trend : 1000 ) * spkStats.channel_bytes)}}/</h5><span class="small ms-1 d-flex align-items-center text-warning">1 BROCA <span class="ms-1 badge bg-warning text-dark d-flex align-items-center justify-content-center rounded-circle" style="width: 1.25rem; height: 1.25rem;">
                                <i class="fa-solid fa-bolt-lightning" style="font-size: .5rem;"></i>
                            </span></span></div>
                    <p class="card-text text-white-50">SPK Network IPFS Pinning Service for 30 days per BROCA Power.</p>
                    </div>
                    <div class="card-footer bg-card text-center">
                    <small class="text-body-secondary">30 Days of Storage</small>
                    </div>
                </div>
                <div class="card bg-img-none">
                    <div class="card-header bg-info-50 text-dark text-center">
                    <h3 class="card-title mb-0">Upload Limit</h3>
                    </div>
                    <div class="card-body">
                    <h5 class="card-title text-info text-center">{{fancyBytes((Number(broca_calc(saccountapi.broca)) || 0) * spkStats.channel_bytes)}}</h5>
                    <p class="card-text text-white-50">Your current available storage based on your current BROCA Power resources</p>
                    </div>
                    <div class="card-footer bg-card text-center">
                    <small class="text-body-secondary">Regenerates Every 5 Days</small>
                    </div>
                </div>
                <div class="card bg-img-none">
                <div class="card-header bg-info-50 text-dark text-center">
                    <h3 class="card-title mb-0">Drive Size</h3>
                    </div>
                    <div class="card-body">
                    <h5 class="card-title text-info text-center">~{{(fancyBytes((Number(broca_calc(saccountapi.broca)) || 0) * 6000))}}</h5>
                    <p class="card-text text-white-50">Maximum perpetual storage when files are set to autorenew at current network rates</p>
                    </div>
                    <div class="card-footer bg-card text-center">
                    <small class="text-body-secondary">Rolling Storage Over 30 Days</small>
                    </div>
                </div>
            </div>
            
             <!-- larynx banner -->
            <div class="d-flex justify-content-center align-items-center bg-dark my-3 p-2 rounded">
                <img src="/img/spknetwork/larynx_logomark.png" class="img-fluid" alt="LARYNX Logomark" style="height: 70px;">
            </div>
            <!--larynx token-->
            <div
                class="d-flex flex-wrap align-items-center border-bottom border-white-50 py-3">
                <div class="ratio ratio-1x1 me-4" style="width: 70px;">
                    <div class="rounded-circle border border-light bg-dark d-flex justify-content-center align-items-center">
                        <img src="/img/spknetwork/larynx_icon.png" class="rounded img-fluid p-1" alt="LARYNX Token Logo">
                    </div>
                </div>
                <div>
                    <div class="d-flex align-items-start fs-4 fw-bold">LARYNX
                            
                        </div>
                    <p class="text-white-50">The mining token
                        for SPK
                        Network.</p>
                </div>
                <div class="ms-auto text-end">
                    <h5 class="d-flex align-items-center justify-content-end">
                        {{formatNumber((saccountapi.balance)/1000, 3, '.', ',')}} 
                        <span class="ms-2">LARYNX</span><span class="ms-1 badge bg-light text-dark d-flex align-items-center justify-content-center rounded-circle" style="width: 1.25rem; height: 1.25rem;">
                                                                    <i class="fa-solid fa-atom" style="font-size: .5rem;"></i>
                                                                </span>
                    </h5>
                    <div class="btn-group" role="group"
                        aria-label="LARYNX Actions">
                        <button type="button" class="btn btn-light p-0">
                            <modal-vue 
                                v-if="protocollarynx.head_block && saccountapi.head_block" func="send" 
                                :mypfp="mypfp" 
                                :test="test"
                                :tokenuser="saccountapi" 
                                :account="account"
                                :tokenprotocol="protocollarynx"
                                @modalsign="sendIt($event)" 
                                v-slot:trigger>
                                <span class="p-2 trigger"><i
                                        class="fas fa-paper-plane me-2"></i>Send</span>
                            </modal-vue>
                        </button>
                        <button type="button"
                            class="btn btn-dark ms-0 me-0 ps-0 pe-0"
                            disabled></button>
                        <div class="btn-group" role="group" v-if="me">
                            <button type="button"
                                class="btn btn-light dropdown-toggle"
                                data-bs-toggle="dropdown" aria-haspopup="true"
                                aria-expanded="false"></button>
                            <ul class="dropdown-menu dropdown-menu-dark bg-black dropdown-menu-end text-white"
                                aria-labelledby="btnGroupDrop1">
                                <modal-vue 
                                    v-if="protocollarynx.head_block && saccountapi.head_block" func="powup" 
                                    :mypfp="mypfp" 
                                    :test="test"
                                    :tokenuser="saccountapi" 
                                    :account="account"
                                    :tokenprotocol="protocollarynx"
                                    @modalsign="sendIt($event)" 
                                    v-slot:trigger class="dropdown-menu-item">
                                    <button class="dropdown-item trigger" 
                                        type="button">
                                    <i class="fas fa-angle-double-up fa-fw me-2"></i>Power Up</button>
                                </modal-vue>
                                
                                <modal-vue 
                                    v-if="protocollarynx.head_block && saccountapi.head_block"
                                    type="register" 
                                    :test="test"
                                    func="service"
                                    :account="account" 
                                    class="dropdown-menu-item"
                                    @modalsign="sendIt($event)"
                                    v-slot:trigger>
                                    <button class="dropdown-item trigger" 
                                        type="button"><i :class="!saccountapi.balance ? 'disabled' : ''"
                                            class="fa fa-network-wired fa-fw me-2"></i>Register
                                        A Service
                                    </button>
                                </modal-vue>
                                <modal-vue 
                                    v-if="protocollarynx.head_block && saccountapi.head_block"
                                    type="register" 
                                    :test="test"
                                    func="type"
                                    :account="account" 
                                    class="dropdown-menu-item"
                                    @modalsign="sendIt($event)"
                                    v-slot:trigger>
                                    <button class="dropdown-item trigger" 
                                        type="button"><i :class="!saccountapi.balance ? 'disabled' : ''"
                                            class="fa fa-network-wired fa-fw me-2"></i>Register
                                        A Service Type
                                    </button>
                                </modal-vue>
                                <modal-vue 

                                    v-if="protocollarynx.head_block && saccountapi.head_block"
                                    type="register" 
                                    :test="test"
                                    func="val"
                                    :account="account" 
                                    class="dropdown-menu-item"
                                    @modalsign="sendIt($event)"
                                    v-slot:trigger>
                                    <button :class="!isNode || isValidator ? 'disabled' : ''"
                                        class="dropdown-item trigger" 
                                        type="button"><i
                                            class="fa fa-network-wired fa-fw me-2"></i>
                                        Register A Validator
                                    </button>
                                </modal-vue>
                                <div class="dropdown-divider">
                                </div>
                                <div class="dropdown-menu-item">
                                <a class="dropdown-item" href="/dex/?api=https://spktest.dlux.io/larynx"
                                    id="buylink" target="_blank"><i
                                        class="fas fa-coins fa-fw me-2"></i>Buy / Sell</a>
                                </div>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            <!--larynx power-->
            <div class="py-3">
                <div class="d-flex flex-wrap text-start align-items-center">
                    <div class="me-4 position-relative" style="width: 70px;">
                        <div class="ratio ratio-1x1">
                            <div class="rounded-circle border border-warning d-flex justify-content-center align-items-center bg-dark">
                                <img src="/img/spknetwork/larynx_icon.png" class="rounded img-fluid p-1" alt="LARYNX Token Logo">   
                            </div>
                        </div>
                        <div class="position-absolute top-0 start-0 translate-middle" style="margig-top: 10px; margin-left: 10px;">
                            <span class="badge bg-warning text-dark d-flex align-items-center justify-content-center rounded-circle" style="width: 1.5rem; height: 1.5rem;">
                                <i class="fa-solid fa-bolt-lightning" style="font-size: .65rem;"></i>
                            </span>
                        </div>
                        <div class="position-absolute top-100 start-100 translate-middle" style="margig-top: -3px; margin-left: -3px;">
                            <span class="badge bg-warning text-dark d-flex align-items-center justify-content-center rounded-circle" style="width: 2.5rem; height: 2.5rem;">
                                <i class="fa-solid fa-arrow-up-right-dots" style="font-size: 1.3rem;"></i>
                            </span>
                        </div>
                    </div>
                    <div>
                       <div class="d-flex align-items-start fs-4 fw-bold">LARYNX Power</div>
                        <ul class="text-white-50">
                            <li>Increases the effectiveness of your nodes
                            </li>
                            <li>Instant Power Up | 4 Week Power
                                Down</li>
                            <li>Can be delegated to other node operators
                            </li>
                        </ul>
                    </div>
                    <div id="larynxgactions" class="ms-auto">
                        <div class="d-flex flex-wrap align-items-center mb-2">
                           
                            <h5 class="ms-auto mb-0 d-flex align-items-center"> {{formatNumber((saccountapi.poweredUp)/1000, 3, '.', ',')}} 
                            <span class="ms-2 text-warning">LARYNX</span><span class="ms-1 badge bg-warning text-dark d-flex align-items-center justify-content-center rounded-circle" style="width: 1.25rem; height: 1.25rem;">
                                <i class="fa-solid fa-bolt-lightning" style="font-size: .5rem;"></i>
                            </span></h5>
                        </div>
                        

                        <div class="btn-group" role="group"
                            aria-label="LARYNX Actions">
                            <button class="btn btn-light p-0" type="button">
                                <modal-vue type="delegate" 
                                    :smarkets="smarkets.node" token="LARYNX"
                                    func="Lock Liquidity" :stats="spkStats"
                                    :balance="saccountapi.poweredUp"
                                    :account="account"
                                    @modalsign="sendIt($event)"
                                    :test="test" v-slot:trigger><span
                                        class="p-2 trigger">
                                        <i class="fas fa-user-friends fa-fw me-2"></i>Delegate</span>
                                </modal-vue>
                            </button>
                            <button type="button"
                                class="btn btn-dark ms-0 me-0 ps-0 pe-0"
                                disabled></button>
                            <div class="btn-group" role="group" v-if="me">
                                <button id="btnGroupDrop1" type="button"
                                    class="btn btn-light dropdown-toggle"
                                    data-bs-toggle="dropdown"
                                    aria-haspopup="true"
                                    aria-expanded="false"></button>

                                <ul class="dropdown-menu dropdown-menu-dark bg-black dropdown-menu-end text-white"
                                    aria-labelledby="btnGroupDrop1">
                                    <modal-vue 
                                        class="dropdown-menu-item"
                                        v-if="protocollarynx.head_block && saccountapi.head_block" func="powdn" 
                                        token="pow_broca" 
                                        :test="test"
                                        :tokenuser="saccountapi" 
                                        :account="account" 
                                        :tokenprotocol="protocollarynx"
                                        token="poweredUp"
                                        :mypfp="mypfp" 
                                        @modalsign="sendIt($event)" 
                                        v-slot:trigger>
                                        <button
                                            :disabled="!saccountapi.poweredUp"
                                            class="dropdown-item trigger" 
                                            type="button"><i class="fas fa-angle-double-down fa-fw me-2"></i>Power Down</button>
                                    </modal-vue>
                                    <modal-vue :test="test" class="dropdown-menu-item"
                                        v-if="when(saccountapi.powerDowns)"
                                        type="confirm" token="LARYNX"
                                        func="powercancel" :account="account"
                                        @modalsign="sendIt($event)"
                                        v-slot:trigger>
                                        <button class="dropdown-item trigger"
                                            type="button">
                                            <i class="fa-solid fa-xmark fa-fw me-2"></i>Cancel Power Down</button>
                                    </modal-vue>

                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            
                <div
                    :class="{'d-none': !when(saccountapi.powerDowns), 'd-flex': true, 'align-items-center': true}">
                    <b>A power down is scheduled to happen in {{when(saccountapi.powerDowns)}} ({{when(saccountapi.powerDowns, true)}} installments remaining)</b><small class="ms-2">
                        <modal-vue type="confirm" token="LARYNX" 
                            func="powercancel" :account="account"
                            @modalsign="sendIt($event)"
                            :test="test" v-slot:trigger>
                            <button class="btn btn-sm btn-outline-danger trigger"
                                type="button">
                                STOP</button>
                        </modal-vue>
                    </small>
                </div>
            </div>
                 <!-- Delegated LARYNX Power -->
            <div class="d-flex flex-column py-3 border-top border-white-50" v-if="saccountapi.granting.t || saccountapi.granted.t">
                <div class="d-flex flex-wrap align-items-center justify-content-center">
                    <div class="me-4 position-relative" style="width: 70px;">
                        <div class="ratio ratio-1x1">
                            <div class="rounded-circle border border-warning d-flex justify-content-center align-items-center bg-dark">
                                <img src="/img/spknetwork/larynx_icon.png" class="rounded img-fluid p-1" alt="LARYNX Token Logo">   
                            </div>
                        </div>
                        <div class="position-absolute top-0 start-0 translate-middle" style="margig-top: 10px; margin-left: 10px;">
                            <span class="badge bg-warning text-dark d-flex align-items-center justify-content-center rounded-circle" style="width: 1.5rem; height: 1.5rem;">
                                <i class="fa-solid fa-right-left" style="font-size: .65rem;"></i>
                            </span>
                        </div>
                        <div class="position-absolute top-100 start-100 translate-middle" style="margig-top: -3px; margin-left: -3px;">
                            <span class="badge bg-warning text-dark d-flex align-items-center justify-content-center rounded-circle" style="width: 2.5rem; height: 2.5rem;">
                                <i class="fa-solid fa-hand-holding-dollar" style="font-size: 1.3rem;"></i>
                            </span>
                        </div>
                    </div>
               
                    <div class="text-start">
                        <div class="d-flex align-items-start fs-4 fw-bold">
                            Delegated LARYNX Power
                        </div>
                        <ul class="text-white-50">
                            <li>Profit sharing with service providers</li>
                        </ul>
                    </div>
                    <div class="ms-auto text-end">
                    
                        <h5 class="d-flex align-items-center justify-content-end">
                             {{formatNumber((saccountapi.granting.t+saccountapi.granted.t)/1000, 3, '.', ',')}}
                            <span class="ms-2 text-warning">LARYNX</span> <span class="ms-1 badge bg-warning text-dark d-flex align-items-center justify-content-center rounded-circle" style="width: 1.25rem; height: 1.25rem;">
                                <i class="fa-solid fa-right-left" style="font-size: .5rem;"></i>
                            </span>
                        </h5>
                        <div class="btn-group" role="group"
                            aria-label="DLP Actions">
                            <!-- Details collapse button -->
                            <button class="dropdown btn btn-light" href="#" role="button" id="delegationsbtn" data-bs-toggle="collapse" data-bs-target="#delegationsspk" aria-expanded="false" aria-controls="Show Delegations">
                                <i class="me-2 fa-solid fa-search"></i>Details</button>
                           
                        </div>
                    </div>
                </div>
                <div class="collapse" id="delegationsspk">
                    <div class="d-flex flex-column text-start border border-secondary rounded px-2 py-1 p-lg-4 my-4" style="background-color: rgba(0, 0, 0, 0.5);">
                        <div class="mb-3">    
                            <h4 class="py-2 m-0">
                                Delegated: {{formatNumber((saccountapi.granting.t)/1000, 3, '.', ',')}} LP</h4>
                            <div v-for="(a,b,c) in saccountapi.granting">
                                <div class="d-flex align-items-center border-top border-secondary py-2"
                                    v-if="b != 't'">
                                    <p class="my-0"><a :href="'https://www.dlux.io/@' + b " target="_blank" class="text-info no-decoration">@{{b}}</a>: {{formatNumber((a)/1000, 3, '.', ',')}} LP</p>
                                    <div class="d-flex ms-auto ">
                                        <modal-vue type="delegate" 
                                            :smarkets="smarkets.node" token="LARYNX"
                                            :to="b" :amount="a" :stats="spkStats"
                                            :balance="saccountapi.poweredUp"
                                            :account="account"
                                            @modalsign="sendIt($event)"
                                            :test="test" v-slot:trigger>
                                            <button type="button"
                                                class="ms-1 btn btn-sm btn-secondary trigger"><i
                                                    class="fas fa-fw fa-user-edit"></i></button>
                                        </modal-vue>
                                        <modal-vue type="delegate" 
                                            :smarkets="smarkets.node" token="LARYNX"
                                            :to="b" amount="0" :stats="spkStats"
                                            :balance="saccountapi.poweredUp"
                                            :account="account"
                                            :test="test"
                                            @modalsign="sendIt($event)" v-slot:trigger>
                                            <button class="ms-1 btn btn-sm btn-danger ms-1 trigger"
                                                type="button"><i
                                                    class="fas fa-fw fa-trash-alt"></i></button>
                                        </modal-vue>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="mb-1">
                            <h4 class="py-2 m-0">
                                Received: {{formatNumber((saccountapi.granted.t)/1000, 3,'.', ',')}} LP</h4>
                            <div v-for="(a,b,c) in saccountapi.granted" >
                                <div class="d-flex align-items-center border-top border-secondary py-2"
                                    v-if="b != 't'">
                                    <p class="my-0"><a :href="'https://www.dlux.io/@' + b " target="_blank" class="text-info no-decoration">@{{b}}</a>: {{formatNumber((a)/1000, 3, '.', ',')}} LP</p>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!--account value-->
            <div
                class="d-flex flex-wrap text-start align-items-center mt-3 p-3 bg-dark rounded">
                <div class="">
                    <h4>Estimated Account Value</h4>
                    <p class="text-white-50">The approximate US Dollar value for all SPK assets in your account</p>
                </div>
                <div class="ms-auto text-end">
                    <h5 id="totallarynx">
                        <span>&#36;</span>{{EAV}}
                    </h5>
                </div>
            </div>
        </div>
    </div>
   `,
    props: {
        account: {
            type: String,
            default: '',
            required: true
        },
        me: {
            type: Boolean,
            default: true,
            required: false
        },
        node: {
            type: String,
            default: "dlux-io",
            required: true
        
        },
        sapi: {
            type: String,
            default: 'https://spktest.dlux.io',
            required: false
        },
        hiveprice: {
            type: Object,
            default: function () {
                return {
                    hive: {
                        usd: 0.235,
                        btc: 0.0,
                    }
                }
            },
            required: false
        },
        test: {
            type: Boolean,
            default: false,
        }
        // ipfsproviders: {
        //     default: function () {
        //       return {
        //         "na": "na",
        //       };
        //     },
        //   },
    },
    emits: ['tosign'],
    data() {
        return {
            api: "https://spktest.dlux.io",
            spk2gov: false,
            mypfp: "",
            ipfsProviders: {
                "na": "na",
            },
            contract: {
                id: "",
                api: "",
            },
            protocolspk: {},
            protocolbroca: {},
            protocollarynx: {},
            larynxbehind: 999,
            petitionStatus: 'Ask for Contract',
            saccountapi: {
                granting: {
                    t: 0
                },
                granted: {
                    t: 0
                },
                powerDowns: {},
                channels: {
                    na: [{
                        a: 0,
                        b: "na",
                        c: 0,
                        e:"0:0",
                        f: "na",
                        i: "::",
                        p: 0,
                        r: 0,
                        t: "na"
                    }]
                },
            },
            spkStats: {

            },
            spkval: 0,
            smarkets: {
                node: {}
            },
            validator_totals: {

            },
            validators: {

            },
            tokenGov: {
                title: "SPK VOTE",
                options: [
                    {
                        id: "spk_cycle_length",
                        range_low: 28800,
                        range_high: 2592000,
                        info: "Time in blocks to complete a power down cycle. 4 cycles to completely divest. 28800 blocks per day.",
                        val: 200000,
                        step: 1,
                        unit: "Blocks",
                        title: "Down Power Period"
                    },
                    {
                        id: "dex_fee",
                        range_low: 0,
                        range_high: 0.01,
                        info: "Share of DEX completed DEX trades to allocate over the collateral group.",
                        val: 0.00505,
                        step: 0.000001,
                        unit: "",
                        title: "DEX Fee"
                    },
                    {
                        id: "dex_max",
                        range_low: 28800,
                        range_high: 2592000,
                        info: "Largest open trade size in relation to held collateral.",
                        val: 97.38,
                        step: 1,
                        unit: "%",
                        title: "Max Trade Size"
                    },
                    {
                        id: "dex_slope",
                        range_low: 0,
                        range_high: 100,
                        info: "0 Allows any size buy orders to be placed. 1 will disallow large buy orders at low prices.",
                        val: 48.02,
                        step: 0.01,
                        unit: "%",
                        title: "Max Lowball Trade Size"
                    },
                    {
                        id: "spk_rate_ldel",
                        range_low: 0.00001, //current lpow
                        range_high: 0.0001, //current lgov
                        info: "SPK generation rate for delegated LARYNX Power",
                        val: 0.00015,
                        step: 1,
                        unit: "",
                        title: "SPK Gen Rate: Delegated"
                    },
                    {
                        id: "spk_rate_lgov",
                        range_low: 0.00015, //current ldel
                        range_high: 0.01,
                        info: "SPK generation rate for Larynx Locked",
                        val: 0.001,
                        step: 0.000001,
                        unit: "",
                        title: "SPK Gen Rate: Locked"
                    },
                    {
                        id: "spk_rate_lpow",
                        range_low: 0.000001,
                        range_high: 0.00015, //current ldel
                        info: "SPK generation rate for undelegated Larynx Power",
                        val: 0.0001,
                        step: 0.000001,
                        unit: "",
                        title: "Min SPK Gen Rate: Min"
                    },
                    {
                        id: "max_coll_members",
                        range_low: 25,
                        range_high: 79,
                        info: "The Max number of accounts that can share DEX fees. The richer half of this group controls outflows from the multisig wallet.",
                        val: 25,
                        step: 1,
                        unit: "Accounts",
                        title: "Size of collateral group"
                    }
                ]
            },
        };
    },
    emits: ["tosign"],
    methods: {
        ...MCommon,
        ...MSpk,
        sendIt(event){
            console.log(event)
            this.$emit('tosign', event)
        },
        getTokenUser(user = this.account) {
            if(user)fetch(this.sapi + "/@" + user)
                .then((response) => response.json())
                .then((data) => {
                    data.tick = data.tick || 0.01;
                    this.larynxbehind = data.behind;
                    this.saccountapi = data
                });
            else setTimeout(this.getTokenUser, 1000)
        },
        getProtocols(){
            fetch(this.sapi + "/spk/api/protocol").then(r => r.json())
            .then(data =>{
                this.protocolspk = data
            })
            .catch(e => {
                console.log(e)
            })
            fetch(this.sapi + "/api/protocol").then(r => r.json())
            .then(data =>{
                this.protocollarynx = data
            })
            .catch(e => {
                console.log(e)
            })
            fetch(this.sapi + "/broca/api/protocol").then(r => r.json())
            .then(data =>{
                this.protocolbroca = data
            })
            .catch(e => {
                console.log(e)
            })
        },
        getSNodes() {
            // fetch(this.sapi + "/runners")
            //   .then((response) => response.json())
            //   .then((data) => {
            //     this.runners = data.result.sort((a, b) => {
            //       return b.g - a.g;
            //     });
            //   });
            fetch(this.sapi + "/markets")
                .then((response) => response.json())
                .then((data) => {
                    this.smarkets = data.markets;
                    this.validator_totals = data.validators;
                    this.spkStats = data.stats;
                    this.spkStats.head_block = data.head_block;
                    let validators = {}
                    for (var node in this.spkStats.nodes) {
                        if (this.spkStats.nodes[node].val_code) {
                            validators[node] = this.spkStats.nodes[node]
                            validators[node].votes = this.spkStats.nodes[node].val_code
                        }
                    }
                    this.validators = validators
                });
        },
        petitionForContract(provider = this.node) {
            this.petitionStatus = 'Preparing'
            // fetch(`https://spktest.dlux.io/user_services/${provider}`)
            // .then(r=>r.json())
            // .then(json =>{
            //   console.log(json)
            // })
            fetch(`/upload-contract?user=${this.account}`)
              .then(r => r.json())
              .then(json => {
                this.petitionStatus = 'Sending'
                console.log(json)
                setTimeout(() => {
                  this.getSapi()
                  this.petitionStatus = 'Recieved'
                }, 7000)
              })
          },
        getIPFSproviders() {
            fetch(this.sapi + "/services/IPFS")
              .then((response) => response.json())
              .then((data) => {
                this.ipfsProviders = data.providers
              });
          },
        slotDecode(slot, index) {
            var item = slot.split(',')
            switch (index) {
              case 1:
                return parseFloat(item[1] / 100).toFixed(2)
                break;
              default:
                return item[0]
                break;
            } index
        },
        broca_calc(last = '0,0') {
            const last_calc = this.Base64toNumber(last.split(',')[1])
            const accured = parseInt((parseFloat(this.spkStats.broca_refill) * (this.spkStats.head_block - last_calc)) / (this.saccountapi.spk_power * 1000))
            var total = parseInt(last.split(',')[0]) + accured
            if (total > (this.saccountapi.spk_power * 1000)) total = (this.saccountapi.spk_power * 1000)
            return total
        },
        replace(string, char = ':') {
            return string.replaceAll(char, '_')
        },
        selectContract(id, broker) {  //needs PeerID of broker
            this.contract.id = id
            fetch(`${this.sapi}/user_services/${broker}`)
              .then(r => r.json())
              .then(res => {
                console.log(res)
                this.contract.api = res.services.IPFS[Object.keys(res.services.IPFS)[0]].a
              })
        },
        exp_to_time(exp = '0:0') {
            return this.when([parseInt(exp.split(':')[0])])
        },
        when(ip = {}, num = false) {
            const arr = Object.keys(ip)
            if (num) return arr.length
            if (!arr.length) return false
            var seconds =
                (parseInt(arr[0]) - parseInt(this.saccountapi.head_block)) * 3;
            var interval = Math.floor(seconds / 86400);
            if (interval >= 1) {
                return interval + ` day${interval > 1 ? "s" : ""}`;
            }
            interval = Math.floor(seconds / 3600);
            if (interval >= 1) {
                return interval + ` hour${interval > 1 ? "s" : ""}`;
            }
            interval = Math.floor(seconds / 60);
            if (interval >= 1) {
                return `${interval} minute${interval > 1 ? "s" : ""}`;
            }
            return Math.floor(seconds) + " seconds";
        },
        pFloat(value) {
            return parseFloat(value);
        }
    },
    computed: {
        isValidator: {
            get() {
                return this.smarkets.node?.[this.account]?.val_code ? true : false;
            },
        },
        isNode: {
            get() {
                return this.smarkets.node[this.account] ? true : false;
            },
        },
        numChannels: {
            get() {
              return Object.keys(this.saccountapi.channels).length
            }
          },
        EAV: {
            get() {
                const lt = (this.saccountapi.balance + this.saccountapi.claim + this.saccountapi.poweredUp)/1000
                const st = (this.saccountapi.spk + this.saccountapi.spk_power + this.saccountapi.claim_spk) / 1000
                const bt = (this.saccountapi.liq_broca + this.saccountapi.pow_broca ) / 1000
                var total = parseFloat(this.saccountapi.tick_spk * st)
                total += parseFloat(this.saccountapi.tick * lt)
                total += parseFloat(this.saccountapi.tick_broca * bt)
                console.log({total, st, bt, lt}, this.hiveprice.hive.usd)
                return (this.hiveprice.hive.usd * total).toFixed(2)
            }
        },
    },
    mounted() {
        this.getTokenUser();
        this.getSNodes();
        this.getIPFSproviders();
        this.getProtocols()
        this.accountCheck(this.account).then(result => {
            if (result) {
              if(result === true)this.mypfp = '/img/no-user.png'
              else this.mypfp = result
            } else this.mypfp = '/img/no-user.png'
          }).catch(() => {
            this.mypfp = '/img/no-user.png'
          })
    },
};