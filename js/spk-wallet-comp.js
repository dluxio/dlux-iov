export default {
    template: `
    <div class="container">
        <div class="mt-3">
            <div class="alert alert-danger text-start" role="alert">
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
                    <h1 class="m-0">SPK</h1>
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
            <div class="border-bottom border-secondary text-start">
                <p class="lead">Decentralized and incentivized
                    network
                    infrastructure,
                    rewarding
                    providers with SPK governance and BROCA gas
                    tokens.</p>
            </div>
            <!--spk token-->
            <div
                class="d-flex align-items-center border-bottom border-secondary py-5">
                <div>
                    <div class="d-flex align-items-start">
                        <h4 class="m-0">SPK Token</h4><small
                            v-if="lapi == 'https://spktest.dlux.io'"><span
                                class="badge ms-1 me-2 bg-warning">TEST</span></small>
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
                        <button type="button" class="btn btn-info p-0">
                            <modal-vue type="send" token="SPK"
                                :balance="saccountapi.spk" :account="account"
                                @modalsign="sendIt($event)">
                                <span slot="trigger" class="p-2"
                                    :test="lapi == 'https://spktest.dlux.io' ? true : false"><i
                                        class="fas fa-paper-plane me-2"></i>Send</span>
                            </modal-vue>
                        </button>
                        <button type="button"
                            class="btn btn-dark ms-0 me-0 ps-0 pe-0"
                            disabled></button>
                        <div class="btn-group" role="group" v-if="me">
                            <button type="button"
                                class="btn btn-info dropdown-toggle"
                                data-bs-toggle="dropdown" aria-haspopup="true"
                                aria-expanded="false"></button>
                            <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end text-white"
                                aria-labelledby="btnGroupDrop1">
                                <modal-vue type="power" token="SPK"
                                    func="Power Up" :balance="saccountapi.spk"
                                    :account="account"
                                    @modalsign="sendIt($event)">
                                    <button class="dropdown-item" slot="trigger"
                                        type="button"><i
                                            class="fas fa-angle-double-up fa-fw me-2"></i>Power
                                        Up</button>
                                </modal-vue>
                                <div class="dropdown-divider">
                                </div>
                                <a class="dropdown-item" href="/dex/#larynx"
                                    id="buylink"><i
                                        class="fas fa-coins fa-fw me-2"></i>Buy
                                    / Sell</a>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            <!-- SPK Power -->
            <div
                class="d-flex align-items-center border-bottom border-secondary py-5">
                <div class="text-start">
                    <div class="d-flex align-items-start">
                        <h4 class="m-0">SPK Power</h4><small
                            v-if="lapi == 'https://spktest.dlux.io'"><span
                                class="badge ms-1 me-2 bg-warning">TEST</span></small>
                    </div>
                    <p class="text-white-50">Powered SPK for
                        Voting.</p>
                    <p class="text-white-50">Benefits of SPK
                        Power:</p>
                    <ul class="text-white-50">
                        <li>Enables voting</li>
                        <li>Instant Power Up | 4 Week Power Down
                        </li>
                        <li>Grants BROCA at 1:1,000,000</li>
                        <li>Your max BROCA:
                            {{formatNumber((saccountapi.spk_power
                            * 1000 ),
                            0, '', ',')}}</li>
                    </ul>
                    </p>
                </div>
                <div class="ms-auto text-end">
                    <h5>
                        {{formatNumber((saccountapi.spk_power)/1000,
                        3, '.',
                        ',')}}
                        SPK
                    </h5>
                    <div class="btn-group" role="group"
                        aria-label="Power Actions">
                        <button class="dropdown btn btn-info p-2"
                            data-bs-auto-close="outside" href="#" role="button"
                            id="settingsDropdownBtn" data-bs-toggle="dropdown"
                            aria-expanded="false">
                            <i
                                class="me-2 fa-solid fa-person-booth"></i>Vote</button>
                        <ul class="dropdown-menu dropdown-menu-dark p-4 text-white-50 text-left bg-black dropdown-menu-end"
                            aria-labelledby="settingsDropdownBtn"
                            style="width: 300px">
                            <li>
                                <h6 class="dropdown-header text-center">
                                    {{tokenGov.title}}
                                </h6>
                            </li>
                            <li>
                                <h4 class="text-center text-white-50">
                                    @{{account}}</h4>
                            </li>
                            <li>
                                <form name="nodeSettings"
                                    class="needs-validation" novalidate>
                                    <div class="row mb-3"
                                        v-for="opt in tokenGov.options">
                                        <label :for="opt.json"
                                            class="form-label d-flex">{{opt.title}}:
                                            {{opt.val}}
                                            {{opt.unit}}
                                            <div
                                                class="dropdown show d-flex align-items-center p-0 m-0">
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
                                                    class="dropdown-menu dropdown-menu-dark dropdown-menu-end p-4 text-white-50 text-left bg-black">
                                                    <p>{{opt.info}}
                                                    </p>
                                                </div>
                                            </div>
                                        </label>
                                        <div class="input-group">
                                            <input type="range"
                                                v-model="opt.val"
                                                class="slider form-control bg-darkg border-secondary text-info"
                                                :id="opt.id"
                                                :max="opt.range_high"
                                                :min="opt.range_low"
                                                :step="opt.step" />
                                            <span v-if="opt.unit"
                                                class="input-group-text bg-darkg border-secondary text-secondary">{{opt.unit}}</span>
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
                                            submitted.</p>
                                    </div>
                                    <div class="text-start">
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
                                                {{formatNumber((spkStats.spk_cycle_length
                                                *
                                                4)/28800, '.',
                                                ',', 2)}}
                                                days</li>
                                        </ul>
                                    </div>
                                </form>
                            </li>
                        </ul>
                        <button type="button"
                            class="btn btn-dark ms-0 me-0 ps-0 pe-0"
                            disabled></button>
                        <div class="btn-group" role="group" v-if="me">
                            <button type="button"
                                class="btn btn-info dropdown-toggle"
                                data-bs-toggle="dropdown" aria-haspopup="true"
                                aria-expanded="false"></button>
                            <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end text-white"
                                aria-labelledby="btnGroupDrop1">
                                <modal-vue type="power" token="SPK"
                                    func="Power Down"
                                    :balance="saccountapi.spk_power"
                                    :account="account"
                                    @modalsign="sendIt($event)">
                                    <button class="dropdown-item" slot="trigger"
                                        type="button"><i
                                            class="fas fa-angle-double-down fa-fw me-2"></i>Power
                                        Down</button>
                                </modal-vue>
                                <modal-vue type="power" token="SPK"
                                    func="Election"
                                    :balance="saccountapi.spk_power"
                                    :account="account" :smarkets="smarkets.node"
                                    :current="saccountapi.spk_vote"
                                    @modalsign="sendIt($event)">
                                    <button class="dropdown-item" slot="trigger"
                                        type="button"><i
                                            class="fa-solid fa-plug fa-fw me-2"></i>Elect
                                        Validators</button>
                                </modal-vue>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            <!-- Broca -->
            <div v-if="saccountapi.spk_power"
                class="d-flex align-items-center border-bottom border-secondary py-5">
                <div class="text-start">
                    <div class="d-flex align-items-start">
                        <h4 class="m-0">BROCA</h4><small
                            v-if="lapi == 'https://spktest.dlux.io'"><span
                                class="badge ms-1 me-2 bg-warning">TEST</span></small>
                    </div>
                    <p class="text-white-50">Resource Credits
                        for the SPK
                        network.</p>
                    <p class="text-white-50">BROCA stats:</p>
                    <ul class="text-white-50">
                        <li>Current cost to store: 1 BROCA per
                            {{sstats.channel_bytes}}
                            Bytes
                            for 30 days.</li>
                        <li>Recharge Rate:
                            {{formatNumber((sstats.broca_refill
                            / 28800), 2,
                            '.',
                            ',')}} Days to Recharge.</li>
                        <li>Time Until Full: {{formatNumber((1 -
                            (broca_calc(saccountapi.broca))/(saccountapi.spk_power
                            * 1000))
                            *
                            (sstats.broca_refill / 28800), 2,
                            '.', ',')}}
                            Days until full.
                        </li>
                    </ul>
                </div>
                <div class="ms-auto text-end">
                    <h5>
                        {{formatNumber(broca_calc(saccountapi.broca),
                        0, '',
                        ',')}} BROCA
                    </h5>

                    <div class="btn-group" role="group"
                        aria-label="Power Actions">
                        <button type="button" class="btn btn-info p-0">
                            <modal-vue type="build" token="BROCA"
                                :balance="broca_calc(saccountapi.broca)"
                                :account="account" @modalsign="sendIt($event)"
                                :ipfsproviders="ipfsProviders">
                                <span slot="trigger" class="p-2"><i
                                        class="fa-solid fa-file-contract fa-fw me-2"></i>Create
                                    A
                                    Contract</span>
                            </modal-vue>
                        </button>
                        <button type="button"
                            class="btn btn-dark ms-0 me-0 ps-0 pe-0"
                            disabled></button>
                        <div class="btn-group" role="group" v-if="me">
                            <button type="button"
                                class="btn btn-info dropdown-toggle"
                                data-bs-toggle="dropdown" aria-haspopup="true"
                                aria-expanded="false"></button>
                            <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end text-white"
                                aria-labelledby="btnGroupDrop1">
                                <modal-vue type="power" token="SPK"
                                    func="Power Down"
                                    :balance="saccountapi.spk_power"
                                    :account="account"
                                    @modalsign="sendIt($event)">
                                    <button class="dropdown-item" slot="trigger"
                                        type="button"><i
                                            class="fas fa-coins fa-fw me-2"></i>Buy
                                        /
                                        Sell</a></button>
                                </modal-vue>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            <!--claim larynx airdrop-->
            <div id="larynxclaimdiv"
                class="d-flex align-items-center border-bottom border-secondary py-5"
                v-if="parseInt(saccountapi.drop.last_claim, 16) != frmDate() && saccountapi.drop.availible.amount > 0 && me">
                <div>
                    <div class="d-flex align-items-start">
                        <h4 class="m-0">LARYNX Airdrop Claim
                        </h4>
                    </div>
                    <p class="text-white-50">This months
                        claimable tokens
                        based on a January
                        6th HIVE blockchain snapshot.</p>
                    <p>Tokens not claimed do not roll over to
                        next month.
                    </p>
                    <input type="text" name="frmDateReg" required id="frmDate"
                        value="" class="d-none">
                </div>
                <div id="claimlarynxbtn" class="ms-auto text-end">
                    <h5>{{formatNumber((saccountapi.drop.availible.amount)/1000,
                        3, '.',
                        ',')}}
                        LARYNX</h5>
                    <div class="btn-group" role="group"
                        aria-label="LARYNX Claim">
                        <button type="submit" class="btn btn-info "
                            @click="dropClaim('spkcc', 'claim')"><i
                                class="fas fa-coin"></i><i
                                class="fas fa-money-bill-wave-alt me-2"></i>Claim</button>
                    </div>
                </div>
            </div>
            <!--claim larynx rewards-->
            <div class="d-flex align-items-center border-bottom border-secondary py-5"
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
                    <h5>{{formatNumber((saccountapi.claim)/1000,
                        3, '.',
                        ',')}} LARYNX
                    </h5>
                    <div class="mb-2"> <span class="small" v-show="!spk2gov">50%
                            Liquid |
                            50%
                            Power</span> <span class="small"
                            v-show="spk2gov">50%
                            Liquid | 50% Gov</span></div>
                    <div v-show="accountapi.gov > 0" class="bg-dark text-white">
                        <div class="input-group my-3">
                            <span
                                class="input-group-text bg-darkg border-info text-info">
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
                        <button type="submit" class="btn btn-info "
                            @click="rewardClaim('spkcc', 'shares_claim', spk2gov)"><i
                                class="fas fa-coin"></i><i
                                class="fas fa-money-bill-wave-alt me-2"></i>Claim</button>
                    </div>
                </div>
            </div>
            <!--larynx token-->
            <div
                class="d-flex align-items-center border-bottom border-secondary py-5">
                <div>
                    <div class="d-flex align-items-start">
                        <h4 class="m-0">LARYNX Token</h4><small
                            v-if="lapi == 'https://spktest.dlux.io'"><span
                                class="badge ms-1 me-2 bg-warning">TEST</span></small>
                    </div>
                    <p class="text-white-50">The mining token
                        for the SPK
                        network.</p>
                </div>
                <div class="ms-auto text-end">
                    <h5>
                        {{formatNumber((saccountapi.balance)/1000,
                        3, '.',
                        ',')}} LARYNX
                    </h5>
                    <div class="btn-group" role="group"
                        aria-label="LARYNX Actions">
                        <button type="button" class="btn btn-info p-0">
                            <modal-vue type="send" token="LARYNX"
                                :balance="saccountapi.balance"
                                :account="account" @modalsign="sendIt($event)"
                                :test="lapi == 'https://spktest.dlux.io' ? true : false">
                                <span slot="trigger" class="p-2"><i
                                        class="fas fa-paper-plane me-2"></i>Send</span>
                            </modal-vue>
                        </button>
                        <button type="button"
                            class="btn btn-dark ms-0 me-0 ps-0 pe-0"
                            disabled></button>
                        <div class="btn-group" role="group" v-if="me">
                            <button type="button"
                                class="btn btn-info dropdown-toggle"
                                data-bs-toggle="dropdown" aria-haspopup="true"
                                aria-expanded="false"></button>
                            <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end text-white"
                                aria-labelledby="btnGroupDrop1">
                                <modal-vue type="power" token="LARYNX"
                                    func="Power Up"
                                    :balance="saccountapi.balance"
                                    :account="account"
                                    @modalsign="sendIt($event)"
                                    :test="lapi == 'https://spktest.dlux.io' ? true : false">
                                    <button class="dropdown-item" slot="trigger"
                                        type="button"><i
                                            class="fas fa-angle-double-up fa-fw me-2"></i>Power
                                        Up</button>
                                </modal-vue>
                                <modal-vue type="power" :dis="!isNode"
                                    token="LARYNX" func="Lock Liquidity"
                                    :balance="saccountapi.balance"
                                    :account="account"
                                    @modalsign="sendIt($event)"
                                    :test="lapi == 'https://spktest.dlux.io' ? true : false">
                                    <button class="dropdown-item"
                                        :disabled="!isNode" slot="trigger"
                                        type="button"><i
                                            class="fas fa-lock fa-fw me-2"></i>Lock
                                        Liquidity</button>
                                </modal-vue>
                                <modal-vue type="power" token="LARYNX"
                                    func="Register a Service"
                                    :balance="saccountapi.balance"
                                    :min="sstats.IPFSRate/1000"
                                    :account="account"
                                    @modalsign="sendIt($event)">
                                    <button class="dropdown-item" slot="trigger"
                                        type="button"><i
                                            class="fa fa-network-wired fa-fw me-2"></i>Register
                                        A Service
                                    </button>
                                </modal-vue>
                                <modal-vue type="power" token="LARYNX"
                                    func="Register a Service Type"
                                    :balance="saccountapi.balance"
                                    :min="sstats.IPFSRate/1000"
                                    :account="account"
                                    @modalsign="sendIt($event)">
                                    <button class="dropdown-item" slot="trigger"
                                        type="button"><i
                                            class="fa fa-network-wired fa-fw me-2"></i>Register
                                        A Service Type
                                    </button>
                                </modal-vue>
                                <modal-vue v-if="isNode" type="power"
                                    token="LARYNX" func="Register a Validator"
                                    :balance="saccountapi.balance"
                                    :min="isValidator ? '0.001' : sstats.IPFSRate/1000"
                                    :account="account"
                                    @modalsign="sendIt($event)">
                                    <button class="dropdown-item" slot="trigger"
                                        type="button"><i
                                            class="fa fa-network-wired fa-fw me-2"></i>
                                        {{isValidator ? 'Burn LARYNX to your Validator' : 'Register a Validator'}}
                                    </button>
                                </modal-vue>
                                <div class="dropdown-divider">
                                </div>
                                <a class="dropdown-item" href="/dex/larynx"
                                    id="buylink"><i
                                        class="fas fa-coins fa-fw me-2"></i>Buy
                                    / Sell</a>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            <!--locked larynx-->
            <div class="d-flex text-start align-items-center border-bottom border-secondary py-5"
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
                    <p class="text-white-50">Benefits of LARYNX
                        Locked:</p>
                    <ul class="text-white-50">
                        <li>Provides collateral for DEX
                            transactions and
                            proof-of-stake
                            consensus</li>
                        <li>Instant Lock | 4 Week Unlock</li>
                        <li>Requires an operating LARYNX node
                        </li>
                        <li>LARYNX LOCKED (LL) earns SPK tokens
                            at
                            {{toFixed(parseFloat(spkStats.spk_rate_lgov)
                            *
                            100,3)}}%</li>
                    </ul>
                </div>
                <div id="larynxgactions" class="ms-auto text-end" v-show="me">
                    <div class="d-flex align-items-center mb-2">
                        <small class="ms-auto"><span
                                class="badge me-2 bg-success">{{toFixed(parseFloat(spkStats.spk_rate_lgov)
                                *
                                100,3)}}%</span></small>
                        <h5 id="govbalance" class="m-0">
                            {{formatNumber((saccountapi.gov)/1000,
                            3, '.',
                            ',')}} LL
                        </h5>
                    </div>
                    <div class="btn-group" role="group"
                        aria-label="LARYNX Actions">
                        <button onclick="location.href='/dex/#larynx'"
                            type="button" class="btn btn-info p-0">
                            <span class="p-2"><i
                                    class="fa-solid fa-gear fa-fw me-2"></i>Options</span>
                        </button>
                        <button type="button"
                            class="btn btn-dark ms-0 me-0 ps-0 pe-0"
                            disabled></button>
                        <div class="btn-group" role="group" v-if="me">
                            <button id="btnGroupDrop1" type="button"
                                class="btn btn-info dropdown-toggle"
                                data-bs-toggle="dropdown" aria-haspopup="true"
                                aria-expanded="false"></button>

                            <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end text-white"
                                aria-labelledby="btnGroupDrop1">
                                <modal-vue type="power" token="LARYNX"
                                    func="Unlock Liquidity"
                                    :balance="saccountapi.gov"
                                    :test="lapi == 'https://spktest.dlux.io' ? true : false"
                                    :account="account"
                                    @modalsign="sendIt($event)">
                                    <button class="dropdown-item" slot="trigger"
                                        type="button"><i
                                            class="fas fa-lock-open fa-fw me-2"></i>Unlock
                                        Liquidity</button>
                                </modal-vue>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            <!--larynx power-->
            <div class="border-bottom border-secondary py-5">
                <div class="d-flex text-start align-items-center">
                    <div>
                        <div class="d-flex align-items-start">
                            <h4 class="m-0">LARYNX Power</h4>
                            <small
                                v-if="lapi == 'https://spktest.dlux.io'"><span
                                    class="badge ms-1 me-2 bg-warning">TEST</span></small>
                        </div>
                        <p class="text-white-50">Powered tokens
                            used to mine
                            SPK</p>
                        <p class="text-white-50">Benefits of
                            LARYNX Power:
                        </p>
                        <ul class="text-white-50">
                            <li>Delegate to node service
                                accounts to build
                                consensus (DPoS)
                            </li>
                            <li>Instant Power Up | 4 Week Power
                                Down</li>
                            <li>LARYNX POWER (LP) earns SPK
                                tokens at
                                {{toFixed(parseFloat(spkStats.spk_rate_lpow)
                                * 100,3)}}%
                            </li>
                            <li>Delegated LP (DLP) earns SPK
                                tokens for both
                                delegator and
                                delegatee at
                                {{toFixed(parseFloat(spkStats.spk_rate_ldel)
                                * 100,3)}}%
                            </li>
                        </ul>
                    </div>
                    <div id="larynxgactions" class="ms-auto text-end">
                        <div class="d-flex align-items-center mb-2">
                            <small class="ms-auto"><span
                                    class="badge me-2 bg-success">{{toFixed(parseFloat(spkStats.spk_rate_lpow)
                                    * 100,3)}}%</span></small>
                            <h5 class="m-0">
                                {{formatNumber((saccountapi.poweredUp)/1000,
                                3, '.', ',')}}
                                LP
                            </h5>
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
                                        class="badge me-2 bg-success">{{toFixed(parseFloat(spkStats.spk_rate_ldel)
                                        *
                                        100,3)}}%</span></small>
                                <h5 class="m-0">
                                    {{formatNumber((saccountapi.granting.t+saccountapi.granted.t)/1000,
                                    3, '.', ',')}}
                                    DLP<i class="fas fa-search ms-2"></i>
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
                                    v-if="saccountapi.granting.t">(-{{formatNumber((saccountapi.granting.t)/1000,
                                    3,
                                    '.', ',')}} LP)</span>
                                <span
                                    v-if="saccountapi.granted.t">(+{{formatNumber((saccountapi.granted.t)/1000,
                                    3,'.', ',')}} LP)</span>
                                <i class="fas fa-search ms-2"></i>
                            </h6>

                        </a>

                        <div class="btn-group" role="group"
                            aria-label="LARYNX Actions">
                            <button class="btn btn-info p-0" type="button">
                                <modal-vue type="delegate"
                                    :smarkets="smarkets.node" token="LARYNX"
                                    func="Lock Liquidity" :stats="sstats"
                                    :balance="saccountapi.poweredUp"
                                    :account="account"
                                    @modalsign="sendIt($event)"
                                    :test="lapi == 'https://spktest.dlux.io' ? true : false"><span
                                        slot="trigger" class="p-2">
                                        <i
                                            class="fas fa-user-friends fa-fw me-2"></i>Delegate</span>
                                </modal-vue>
                            </button>
                            <button type="button"
                                class="btn btn-dark ms-0 me-0 ps-0 pe-0"
                                disabled></button>
                            <div class="btn-group" role="group" v-if="me">
                                <button id="btnGroupDrop1" type="button"
                                    class="btn btn-info dropdown-toggle"
                                    data-bs-toggle="dropdown"
                                    aria-haspopup="true"
                                    aria-expanded="false"></button>

                                <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end text-white"
                                    aria-labelledby="btnGroupDrop1">
                                    <modal-vue type="power" token="LARYNX"
                                        func="Power Down"
                                        :balance="saccountapi.poweredUp"
                                        :account="account"
                                        @modalsign="sendIt($event)"
                                        :test="lapi == 'https://spktest.dlux.io' ? true : false">
                                        <button
                                            :disabled="!saccountapi.poweredUp"
                                            class="dropdown-item" slot="trigger"
                                            type="button"><i
                                                class="fas fa-angle-double-down fa-fw me-2"></i>Power
                                            Down</button>
                                    </modal-vue>
                                    <modal-vue
                                        v-show="when(saccountapi.powerDowns)"
                                        type="confirm" token="LARYNX"
                                        func="powercancel" :account="account"
                                        @modalsign="sendIt($event)"
                                        :test="lapi == 'https://spktest.dlux.io' ? true : false">
                                        <button class="dropdown-item"
                                            slot="trigger" type="button">
                                            <i
                                                class="fa-solid fa-xmark fa-fw me-2"></i>Cancel
                                            Power Down</button>
                                    </modal-vue>

                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                <div
                    :class="{'d-none': !when(saccountapi.powerDowns), 'd-flex': true, 'align-items-center': true}">
                    <b>A power down is scheduled
                        to happen in
                        {{when(saccountapi.powerDowns)}}
                        ({{saccountapi.powerDowns.length}}
                        installments
                        remaining)</b><small class="ms-2">
                        <modal-vue type="confirm" token="LARYNX"
                            func="powercancel" :account="account"
                            @modalsign="sendIt($event)"
                            :test="lapi == 'https://spktest.dlux.io' ? true : false">
                            <button class="btn btn-sm btn-outline-danger"
                                slot="trigger" type="button">
                                STOP</button>
                        </modal-vue>
                    </small>
                </div>
                <div class="collapse" id="delegationsspk">
                    <div
                        class="d-flex flex-column text-start border border-secondary rounded p-4 my-4">
                        <h4 class="border-bottom border-secondary py-2">
                            Delegated:
                            {{formatNumber((saccountapi.granting.t)/1000,
                            3,
                            '.', ',')}} LP</h4>
                        <div v-for="(a,b,c) in saccountapi.granting">
                            <div class="d-flex align-items-center border-bottom border-secondary pb-2 my-1"
                                v-if="b != 't'">
                                <p class="my-0">@{{b}}:
                                    {{formatNumber((a)/1000, 3,
                                    '.', ',')}}
                                    LP
                                </p>
                                <div class="d-flex ms-auto ">
                                    <modal-vue type="delegate"
                                        :smarkets="smarkets.node" token="LARYNX"
                                        :to="b" :amount="a" :stats="sstats"
                                        :balance="saccountapi.poweredUp"
                                        :account="account"
                                        @modalsign="sendIt($event)"
                                        :test="lapi == 'https://spktest.dlux.io' ? true : false">
                                        <button slot="trigger" type="button"
                                            class="ms-1 btn btn-secondary"><i
                                                class="fas fa-fw fa-user-edit"></i></button>
                                    </modal-vue>
                                    <modal-vue type="delegate"
                                        :smarkets="smarkets.node" token="LARYNX"
                                        :to="b" amount="0" :stats="sstats"
                                        :balance="saccountapi.poweredUp"
                                        :account="account"
                                        :test="lapi == 'https://spktest.dlux.io' ? true : false"
                                        @modalsign="sendIt($event)">
                                        <button class="ms-1 btn btn-danger ms-1"
                                            slot="trigger" type="button"><i
                                                class="fas fa-fw fa-trash-alt"></i></button>
                                    </modal-vue>
                                </div>
                            </div>
                        </div>
                        <h4 class="border-bottom border-secondary py-2 mt-5">
                            Received:
                            {{formatNumber((saccountapi.granted.t)/1000,
                            3,'.', ',')}} LP</h4>
                        <div v-for="(a,b,c) in saccountapi.granted">
                            <div class="d-flex align-items-center border-bottom border-secondary pb-2 my-1"
                                v-if="b != 't'">
                                <p class="my-0">@{{b}}:
                                    {{formatNumber((a)/1000, 3,
                                    '.', ',')}}
                                    LP
                                </p>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!--account value-->
            <div
                class="d-flex text-start align-items-center border-bottom border-secondary py-5">
                <div class="">
                    <h4>Estimated Account Value</h4>
                    <p class="text-white-50">The approximate US
                        Dollar value
                        for all SPK
                        assets
                        in your account</p>
                </div>
                <div class="ms-auto text-end">
                    <h5 id="totallarynx">
                        {{toFixed(spkval * saccountapi.tick *
                        hiveprice.hive.usd,2)}}
                    </h5>
                </div>
            </div>
        </div>
    </div>
    <div class="text-center">
        <button class="btn btn-info my-2" type="button"
            data-bs-toggle="collapse" data-bs-target="#spkwallet"><i
                class="fa-solid fa-angles-up fa-fw me-2"></i>Hide
            Wallet</button>
    </div>
   `,
props: {
},
data() {
    return {

    };
},
emits: [],
methods: {
},
computed: {
},
mounted() {
},
};