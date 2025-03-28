import ModalVue from './modal-manager.js'
import MCommon from '/js/methods-common.js'

export default {
    components: {
        "modal-vue": ModalVue
    },
    template: `
    <div class="container">
        <div class="mt-3">
            <div class="alert alert-danger text-start bg-dark" role="alert">
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
            <div class="d-flex align-items-center mt-4 mb-2">
                <div class="d-flex align-items-start">
                    <h1 class="m-0">SPK</h1><div v-if="sapi == 'https://spktest.dlux.io'" class="badge rounded-pill text-bg-info text-black ms-1"
                                style="font-size: xx-small;">TEST NET
                            </div>
                </div>
                <div class="text-center small m-0 p-2 ms-2" v-bind:class="{'text-success': larynxbehind < 30,
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
            <div class="border-bottom border-white-50 text-start">
                <p class="lead">Decentralized and incentivized
                    network
                    infrastructure,
                    rewarding
                    providers with SPK governance and BROCA gas
                    tokens.</p>
            </div>
            <!--spk token-->
            <div
                class="d-flex flex-wrap align-items-center border-bottom border-white-50 py-3">
                <div>
                    <div class="d-flex align-items-start fs-4 fw-bold">SPK Token
                            
                        </div>
                    <p class="text-white-50 m-0">The governance
                        token for
                        the SPK network.
                    </p>
                </div>
                <div class="ms-auto text-end">
                    <h5>
                        {{formatNumber((saccountapi.spk)/1000,
                        3, '.',
                        ',')}}
                        SPK
                    </h5>
                    <div class="btn-group" role="group"
                        aria-label="SPK Actions">
                        <button type="button" class="btn btn-primary p-0">
                            <modal-vue v-if="protocolspk.head_block && saccountapi.head_block" func="send" :mypfp="mypfp" 
                            token="spk" 
                            :test="test"
                                :tokenuser="saccountapi" :account="account"
                                :tokenprotocol="protocolspk"
                                @modalsign="sendIt($event)" v-slot:trigger>
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
                                class="btn btn-primary dropdown-toggle"
                                data-bs-toggle="dropdown" aria-haspopup="true"
                                aria-expanded="false"></button>
                            <ul class="dropdown-menu dropdown-menu-dark bg-black dropdown-menu-end text-white"
                                aria-labelledby="btnGroupDrop1">
                                <modal-vue v-if="protocolspk.head_block && saccountapi.head_block" func="powup" token="spk" :test="test"
                                :tokenuser="saccountapi" :account="account"
                                :tokenprotocol="protocolspk"
                                :mypfp="mypfp" 
                                @modalsign="sendIt($event)" v-slot:trigger>
                                    <button class="dropdown-item trigger"
                                        type="button"><i class="fas fa-angle-double-up fa-fw me-2"></i>Power Up</button>
                                </modal-vue>
                                <div class="dropdown-divider">
                                </div>
                                <a class="dropdown-item" href="https://www.dlux.io/dex/?api=https://spktest.dlux.io/spk#spk"
                                    id="buylink" target="_blank"><i
                                        class="fas fa-coins fa-fw me-2"></i>Buy / Sell</a>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            <!-- SPK Power -->
            <div class="d-flex flex-column border-bottom border-white-50 py-3">
                <div class="d-flex flex-wrap align-items-center">
                    <div class="text-start">
                        <div class="d-flex align-items-start fs-4 fw-bold">SPK Power
                            
                        </div>
                       
                        <p class="text-white-50">Powered SPK for
                            Voting.</p>
                        <p class="text-white-50">Benefits of SPK
                            Power:</p>
                        <ul class="text-white-50">
                            <li>Enables voting</li>
                            <li>Instant Power Up | 4 Week Power Down
                            </li>
                            <li>Collateral to Secure the DEX</li>
                        </ul>
                    </div>
                    <div class="ms-auto text-end">
                        <h5>
                            {{formatNumber((saccountapi.spk_power)/1000, 3, '.', ',')}}
                            SPK
                        </h5>
                        <div class="btn-group" role="group"
                            aria-label="Power Actions">
                            <!-- vote btn -->
                            <button class="dropdown btn btn-primary p-2" href="#" role="button" id="settingsDropdownBtn" data-bs-toggle="collapse" data-bs-target="#collapseVote" aria-expanded="false" aria-controls="collapseVote">
                                <i class="me-2 fa-solid fa-person-booth"></i>Vote</button>
                            <button type="button"
                                class="btn btn-dark ms-0 me-0 ps-0 pe-0"
                                disabled></button>
                            <div class="btn-group" role="group" v-if="me">
                                <button type="button"
                                    class="btn btn-primary dropdown-toggle"
                                    data-bs-toggle="dropdown" aria-haspopup="true"
                                    aria-expanded="false"></button>
                                <ul class="dropdown-menu dropdown-menu-dark bg-black dropdown-menu-end text-white"
                                    aria-labelledby="btnGroupDrop1">
                                    <modal-vue v-if="protocolspk.head_block && saccountapi.head_block" func="powdn" :mypfp="mypfp" 
                            token="spk" 
                            :test="test"
                                :tokenuser="saccountapi" :account="account"
                                :tokenprotocol="protocolspk"
                                @modalsign="sendIt($event)" v-slot:trigger>
                                        <button class="dropdown-item trigger"
                                            type="button"><i
                                                class="fas fa-angle-double-down fa-fw me-2"></i>Power
                                            Down</button>
                                    </modal-vue>
                                    <div class="dropdown-divider"></div>
                                    <modal-vue v-if="protocollarynx.head_block && saccountapi.head_block" type="election" :mypfp="mypfp" 
                            token="spk" 
                            :test="test"
                                :tokenuser="saccountapi" :account="account"
                                :tokenprotocol="protocolspk"
                                :smarkets="smarkets.node" 
                                @modalsign="sendIt($event)" v-slot:trigger>
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
            <!-- Broca -->
            <div v-if="saccountapi.spk_power"
                class="d-flex flex-wrap align-items-center border-bottom border-white-50 py-3">
                <div class="text-start">
                    <div class="d-flex align-items-start fs-4 fw-bold">BROCA KBs
                            
                        </div>
                    <p class="text-white-50">Storage Credits
                        for the SPK
                        network.</p>
                    <p class="text-white-50">BROCA stats:</p>
                    <ul class="text-white-50">
                        <li>Current cost to store: 1 BROCA per
                            {{spkStats.channel_bytes}}
                            Bytes
                            for 30 days.</li>
                        <li>Recharge Rate:
                            {{formatNumber((spkStats.broca_refill / 28800), 2, '.', ',')}} Days to Recharge.</li>
                        <li>Time Until Full: {{formatNumber((1 -
                            (broca_calc(saccountapi.broca))/(saccountapi.spk_power * 1000)) * (spkStats.broca_refill / 28800), 2, '.', ',')}}
                            Days until full.
                        </li>
                    </ul>
                </div>
                <div class="ms-auto text-end">
                    <h5>
                        {{formatNumber(broca_calc(saccountapi.broca), 0, '', ',')}} BROCA
                    </h5>
                     <div class="mb-2"> <span class="small">{{(fancyBytes(broca_calc(saccountapi.broca) * 6000))}} per Month</span></div>

                    <div class="btn-group" role="group"
                        aria-label="Power Actions">
                        <button type="button" class="btn btn-primary p-0">
                            <!-- register -->
                            <div v-if="saccountapi.pubKey == 'NA'"
                            @click="updatePubkey">
                            <i class="fas fa-plus fa-fw me-2"></i>Register Account
                            </div>
                            <!-- new contract -->
                            <div v-if="saccountapi.pubKey != 'NA'">
                            <modal-vue v-if="protocollarynx.head_block && saccountapi.head_block" type="contract" :mypfp="mypfp" 
                            token="broca" 
                            :test="test"
                                :tokenuser="saccountapi" :account="account"
                                :tokenprotocol="protocollarynx"
                                @modalsign="sendIt($event)" v-slot:trigger>
                                <span class="p-2 trigger"><i class="fa-solid fa-file-contract fa-fw me-2"></i>Create A Contract</span>
                            </modal-vue>
                            </div>
                        </button>
                        <button type="button"
                            class="btn btn-dark ms-0 me-0 ps-0 pe-0"
                            disabled></button>
                        <div class="btn-group" role="group" v-if="me">
                            <button disabled type="button"
                                class="disabled btn btn-primary dropdown-toggle"
                                data-bs-toggle="dropdown" aria-haspopup="true"
                                aria-expanded="false"></button>
                            <ul class="dropdown-menu dropdown-menu-dark bg-black dropdown-menu-end text-white"
                                aria-labelledby="btnGroupDrop1">
                                <modal-vue type="power" token="SPK" :test="test"
                                    func="Power Down"
                                    :balance="saccountapi.spk_power"
                                    :account="account"
                                    @modalsign="sendIt($event)" v-slot:trigger>
                                    <button class="dropdown-item trigger"
                                        type="button"><i
                                            class="fas fa-coins fa-fw me-2"></i>Buy / Sell</button>
                                </modal-vue>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            <!--claim larynx rewards-->
            <div class="d-flex flex-wrap align-items-center border-bottom border-white-50 py-3"
                id="larynxclaimrewards" v-if="saccountapi.claim > 0 && me">
                <div>
                    <div class="d-flex align-items-start">
                        <h4 class="m-0">LARYNX Rewards Claim
                        </h4>
                    </div>
                    <p class="text-white-50">Claimable rewards
                        for running a
                        SPK service
                        node.</p>
                </div>
                <div id="claimlarynxrewardbtn" class="ms-auto text-end">
                    <h5>{{formatNumber((saccountapi.claim)/1000, 3, '.', ',')}} LARYNX
                    </h5>
                    <div class="mb-2"> <span class="small" v-show="!spk2gov">50%
                            Liquid |
                            50%
                            Power</span> <span class="small"
                            v-show="spk2gov">50%
                            Liquid | 50% Gov</span></div>
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
                        aria-label="LARYNX Claim">
                        <button type="submit" class="btn btn-primary "
                            @click="rewardClaim('spkcc', 'shares_claim', spk2gov)"><i
                                class="fas fa-coin"></i><i
                                class="fas fa-money-bill-wave-alt me-2"></i>Claim</button>
                    </div>
                </div>
            </div>
            <!--larynx token-->
            <div
                class="d-flex flex-wrap align-items-center border-bottom border-white-50 py-3">
                <div>
                    <div class="d-flex align-items-start fs-4 fw-bold">LARYNX Token
                            
                        </div>
                    <p class="text-white-50">The mining token
                        for the SPK
                        network.</p>
                </div>
                <div class="ms-auto text-end">
                    <h5>
                        {{formatNumber((saccountapi.balance)/1000, 3, '.', ',')}} LARYNX
                    </h5>
                    <div class="btn-group" role="group"
                        aria-label="LARYNX Actions">
                        <button type="button" class="btn btn-primary p-0">
                            <modal-vue v-if="protocollarynx.head_block && saccountapi.head_block" func="send" :mypfp="mypfp" 
                            :test="test"
                                :tokenuser="saccountapi" :account="account"
                                :tokenprotocol="protocollarynx"
                                @modalsign="sendIt($event)" v-slot:trigger>
                                <span class="p-2 trigger"><i
                                        class="fas fa-paper-plane me-2"></i>Send</span>
                            </modal-vue>
                        </button>
                        <button type="button"
                            class="btn btn-dark ms-0 me-0 ps-0 pe-0"
                            disabled></button>
                        <div class="btn-group" role="group" v-if="me">
                            <button type="button"
                                class="btn btn-primary dropdown-toggle"
                                data-bs-toggle="dropdown" aria-haspopup="true"
                                aria-expanded="false"></button>
                            <ul class="dropdown-menu dropdown-menu-dark bg-black dropdown-menu-end text-white"
                                aria-labelledby="btnGroupDrop1">
                                <modal-vue type="power" token="LARYNX"
                                    func="Power Up"
                                    :balance="saccountapi.balance"
                                    :account="account"
                                    @modalsign="sendIt($event)"
                                    :test="test" v-slot:trigger>
                                    <button class="dropdown-item trigger"
                                        type="button"><i
                                            class="fas fa-angle-double-up fa-fw me-2"></i>Power Up</button>
                                </modal-vue>
                                <modal-vue type="power" :dis="!isNode"
                                    token="LARYNX" func="Lock Liquidity"
                                    :balance="saccountapi.balance"
                                    :account="account"
                                    @modalsign="sendIt($event)"
                                    :test="test" v-slot:trigger>
                                    <button class="dropdown-item trigger"
                                        :disabled="!isNode" 
                                        type="button"><i
                                            class="fas fa-lock fa-fw me-2"></i>Lock Liquidity</button>
                                </modal-vue>
                                <modal-vue type="power" token="LARYNX"  :test="test"
                                    func="Register a Service"
                                    :balance="saccountapi.balance"
                                    :min="spkStats.IPFSRate/1000"
                                    :account="account"
                                    @modalsign="sendIt($event)" v-slot:trigger>
                                    <button class="dropdown-item trigger" 
                                        type="button"><i
                                            class="fa fa-network-wired fa-fw me-2"></i>Register
                                        A Service
                                    </button>
                                </modal-vue>
                                <modal-vue type="power" token="LARYNX" :test="test"
                                    func="Register a Service Type"
                                    :balance="saccountapi.balance"
                                    :min="spkStats.IPFSRate/1000"
                                    :account="account"
                                    @modalsign="sendIt($event)" v-slot:trigger>
                                    <button class="dropdown-item trigger" 
                                        type="button"><i
                                            class="fa fa-network-wired fa-fw me-2"></i>Register
                                        A Service Type
                                    </button>
                                </modal-vue>
                                <modal-vue v-if="isNode" type="power" :test="test"
                                    token="LARYNX" func="Register a Validator"
                                    :balance="saccountapi.balance"
                                    :min="isValidator ? '0.001' : spkStats.IPFSRate/1000"
                                    :account="account"
                                    @modalsign="sendIt($event)" v-slot:trigger>
                                    <button class="dropdown-item trigger" 
                                        type="button"><i
                                            class="fa fa-network-wired fa-fw me-2"></i>
                                        {{isValidator ? 'Burn LARYNX to your Validator' : 'Register a Validator'}}
                                    </button>
                                </modal-vue>
                                <div class="dropdown-divider">
                                </div>
                                <a class="dropdown-item" href="https://www.dlux.io/dex/#larynx"
                                    id="buylink" target="_blank"><i
                                        class="fas fa-coins fa-fw me-2"></i>Buy / Sell</a>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            <!--locked larynx-->
            <div class="d-flex text-start flex-wrap align-items-center border-bottom border-white-50 py-3"
                v-if="saccountapi.gov">
                <div>
                    <div class="d-flex align-items-start">
                        <h4 class="m-0">LARYNX Locked</h4>
                    </div>
                    <p class="text-white-50">Locked tokens
                        provide liquidity
                        to the
                        network, aid in determining consensus,
                        and earn rewards for node runners</p>
                    <p class="text-white-50">Benefits of LARYNX Locked:</p>
                    <ul class="text-white-50">
                        <li>Provides collateral for DEX transactions and proof-of-stake consensus</li>
                        <li>Instant Lock | 4 Week Unlock</li>
                        <li>Requires an operating LARYNX node
                        </li>
                        <li>LARYNX LOCKED (LL) earns SPK tokens at {{toFixed(pFloat(spkStats.spk_rate_lgov) * 100,3)}}%</li>
                    </ul>
                </div>
                <div id="larynxgactions" class="ms-auto text-end" v-show="me">
                    <div class="d-flex flex-wrap align-items-center mb-2">
                        <small class="ms-auto"><span
                                class="badge me-2 bg-success">{{toFixed(pFloat(spkStats.spk_rate_lgov) * 100,3)}}%</span></small>
                        <h5 id="govbalance" class="m-0">
                            {{formatNumber((saccountapi.gov)/1000, 3, '.', ',')}} LL
                        </h5>
                    </div>
                    <div class="btn-group" role="group"
                        aria-label="LARYNX Actions">
                        <button onclick="window.open('https://www.dlux.io/dex/#larynx', '_blank')"
                            type="button" class="btn btn-primary p-0">
                            <span class="p-2"><i
                                    class="fa-solid fa-gear fa-fw me-2"></i>Options</span>
                        </button>
                        <button type="button"
                            class="btn btn-dark ms-0 me-0 ps-0 pe-0"
                            disabled></button>
                        <div class="btn-group" role="group" v-if="me">
                            <button id="btnGroupDrop1" type="button"
                                class="btn btn-primary dropdown-toggle"
                                data-bs-toggle="dropdown" aria-haspopup="true"
                                aria-expanded="false"></button>

                            <ul class="dropdown-menu dropdown-menu-dark bg-black dropdown-menu-end text-white"
                                aria-labelledby="btnGroupDrop1">
                                <modal-vue type="power" token="LARYNX"
                                    func="Unlock Liquidity"
                                    :balance="saccountapi.gov"
                                    :test="test"
                                    :account="account"
                                    @modalsign="sendIt($event)" v-slot:trigger>
                                    <button class="dropdown-item trigger" 
                                        type="button"><i
                                            class="fas fa-lock-open fa-fw me-2"></i>Unlock Liquidity</button>
                                </modal-vue>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            <!--larynx power-->
            <div class="border-bottom border-white-50 py-3">
                <div class="d-flex flex-wrap text-start align-items-center">
                    <div>
                       <div class="d-flex align-items-start fs-4 fw-bold">LARYNX Power
                            
                        </div>
                        <p class="text-white-50">Powered tokens used to mine SPK</p>
                        <p class="text-white-50">Benefits of LARYNX Power:
                        </p>
                        <ul class="text-white-50">
                            <li>Delegate to node service accounts to build consensus (DPoS)
                            </li>
                            <li>Instant Power Up | 4 Week Power
                                Down</li>
                            <li>LARYNX POWER (LP) earns SPK
                                tokens at
                                {{toFixed(pFloat(spkStats.spk_rate_lpow) * 100,3)}}%
                            </li>
                            <li>Delegated LP (DLP) earns SPK
                                tokens for both
                                delegator and
                                delegatee at
                                {{toFixed(pFloat(spkStats.spk_rate_ldel) * 100,3)}}%
                            </li>
                        </ul>
                    </div>
                    <div id="larynxgactions" class="ms-auto text-end">
                        <div class="d-flex flex-wrap align-items-center mb-2">
                            <small class="ms-auto"><span
                                    class="badge me-2 bg-success">{{toFixed(pFloat(spkStats.spk_rate_lpow) * 100,3)}}%</span></small>
                            <h5 class="m-0"> {{formatNumber((saccountapi.poweredUp)/1000, 3, '.', ',')}} LP</h5>
                        </div>
                        <div class="mb-2">
                            <a v-if="saccountapi.granting.t || saccountapi.granted.t"
                                data-bs-toggle="collapse" id="delegationsbtn"
                                href="#delegationsspk" role="button"
                                aria-expanded="false"
                                aria-controls="Show delegations"
                                class="text-white d-flex align-items-center "
                                style="text-decoration: none">
                                <small class="ms-auto"><span
                                        class="badge me-2 bg-success">{{toFixed(pFloat(spkStats.spk_rate_ldel) * 100,3)}}%</span></small>
                                <h5 class="m-0">
                                    {{formatNumber((saccountapi.granting.t+saccountapi.granted.t)/1000, 3, '.', ',')}} DLP<i class="fas fa-search ms-2"></i>
                                </h5>
                            </a>
                        </div>
                        <a v-if="saccountapi.granting.t || saccountapi.granted.t"
                            data-bs-toggle="collapse" id="delegationsbtn"
                            href="#delegationsspk" role="button"
                            aria-expanded="false"
                            aria-controls="Show delegations"
                            class="text-white d-none"
                            style="text-decoration: none">
                            <h6 id="delegatebal">
                                <span
                                    v-if="saccountapi.granting.t">(-{{formatNumber((saccountapi.granting.t)/1000, 3, '.', ',')}} LP)</span>
                                <span
                                    v-if="saccountapi.granted.t">(+{{formatNumber((saccountapi.granted.t)/1000, 3,'.', ',')}} LP)</span>
                                <i class="fas fa-search ms-2"></i>
                            </h6>

                        </a>

                        <div class="btn-group" role="group"
                            aria-label="LARYNX Actions">
                            <button class="btn btn-primary p-0" type="button">
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
                                    class="btn btn-primary dropdown-toggle"
                                    data-bs-toggle="dropdown"
                                    aria-haspopup="true"
                                    aria-expanded="false"></button>

                                <ul class="dropdown-menu dropdown-menu-dark bg-black dropdown-menu-end text-white"
                                    aria-labelledby="btnGroupDrop1">
                                    <modal-vue type="power" token="LARYNX" :test="test"
                                        func="Power Down"
                                        :balance="saccountapi.poweredUp"
                                        :account="account"
                                        @modalsign="sendIt($event)"
                                         v-slot:trigger>
                                        <button
                                            :disabled="!saccountapi.poweredUp"
                                            class="dropdown-item trigger" 
                                            type="button"><i class="fas fa-angle-double-down fa-fw me-2"></i>Power Down</button>
                                    </modal-vue>
                                    <modal-vue :test="test"
                                        v-show="when(saccountapi.powerDowns)"
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
                class="d-flex flex-wrap text-start align-items-center py-3">
                <div class="">
                    <h4>Estimated Account Value</h4>
                    <p class="text-white-50">The approximate US Dollar value for all SPK assets in your account</p>
                </div>
                <div class="ms-auto text-end">
                    <h5 id="totallarynx">
                        {{toFixed(spkval * saccountapi.tick * hiveprice.hive.usd,2)}}
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
                        usd: 0.0,
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