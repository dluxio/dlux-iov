import Pop from "/js/pop.js"
import ExtensionVue from "/js/extensionvue.js"
import FilesVue from "/js/filesvue-dd.js"
import UploadVue from "/js/uploadvue.js"
import ModalVue from "/js/modal-manager.js"
import PostVue from "/js/postvue.js"
import ChoicesVue from '/js/choices-vue.js'
import UploadEverywhere from '/js/upload-everywhere.js'
import common from './methods-common.js';
import spk from './methods-spk.js';
import ContractsModal from "./contracts-vue.js";


export default {
    name: "ContractVue",
    components: {
        "pop-vue": Pop,
        "extension-vue": ExtensionVue,
        "files-vue": FilesVue,
        "upload-vue": UploadVue,
        "modal-vue": ModalVue,
        "post-vue": PostVue,
        "choices-vue": ChoicesVue,
        "upload-everywhere": UploadEverywhere,
        "contracts-vue": ContractsModal,
    },
    template: `
    <div class="d-flex flex-column vfs-scroll-pass">
    <!-- register account -->
    <div v-if="saccountapi.pubKey == 'NA'">
        <div class="mx-xl-5">
            <div class="card p-1 p-md-3 mx-lg-5">
                <div class="card-body text-center">
                <div class="hero-subtitle mb-2">Activate File Storage</div>
                    <div class="fs-4 lead mb-2">
                        Register your account on SPK Network for free<br>to start pinning your files on IPFS
                    </div>
                    <button type="button" class="btn btn-primary mt-2" @click="updatePubkey()">
                        <i class="fa-solid fa-user-plus fa-fw me-1"></i> Register Account
                    </button>
                </div>
            </div>
        </div>
    </div>
    <!-- tabs nav -->
    <div v-if="saccountapi.pubKey != 'NA'" class="vfs-scroll-pass d-flex flex-column square rounded-bottom p-0">
        <!-- top menu -->
        <div class="">
            <div class="d-flex flex-wrap align-items-center">
                <!--fake invisible button -->
                <div class="btn-group m-2 d-none d-lg-block invisible" role="group" aria-label="Storage Actions"
                    v-if="title == 'new'">
                    <button @click="storeAll()" role="button" class="btn btn-primary"><i
                            class="fa-solid fa-download fa-fw me-2"></i>Store Selected</button>
                    <button type="button" class="btn btn-dark ms-0 me-0 ps-0 pe-0" disabled></button>
                    <div class="btn-group" role="group">
                        <button class="btn btn-primary dropdown-toggle" type="button" data-bs-toggle="dropdown"
                            aria-expanded="false">
                            <i class="fa-solid fa-filter fa-fw"></i>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-dark bg-dark">
                            <div class="p-2" style="max-width: 200px">
                                <div class="d-flex flex-column">
                                    <div class="text-center mb-3">
                                        <label for="fileSize" class="lead form-label">File Size</label>
                                        <input required="required" type="range" @change="filterSize()"
                                            class="form-range" :min="filter.min" :max="filter.max" :step="filter.step"
                                            v-model="filter.size" id="fileSize">
                                        <span>{{fancyBytes(filter.size)}}</span>
                                    </div>
                                    <div class="form-check form-switch d-none">
                                        <input class="form-check-input" type="checkbox" role="switch"
                                            id="flexSwitchCheckChecked" checked>
                                        <label class="form-check-label" for="flexSwitchCheckChecked">NSFW</label>
                                    </div>
                                    <div class="form-check form-switch d-none">
                                        <input class="form-check-input" type="checkbox" role="switch"
                                            id="flexSwitchCheckChecked" checked>
                                        <label class="form-check-label" for="flexSwitchCheckChecked">Encrypted</label>
                                    </div>
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" @change="filterSlots()" type="checkbox"
                                            role="switch" id="flexSwitchCheckChecked" :checked="filter.slots"
                                            v-model="filter.slots">
                                        <label class="form-check-label" for="flexSwitchCheckChecked">Open Slots</label>
                                    </div>
                                </div>
                            </div>
                        </ul>
                    </div>
                </div>
                <div class="btn-group m-2" role="group" aria-label="Storage Actions" v-if="title == 'new'">
                    <!-- real visible button -->
                    <button @click="storeAll()" role="button" class="btn btn-danger" :disabled="!contracts.length"
                        :class="{'disabled': !contracts.length}"><i class="fa-solid fa-download fa-fw me-2"></i>Store
                        Selected</button>
                    <button type="button" class="btn btn-dark ms-0 me-0 ps-0 pe-0" disabled></button>
                    <div class="btn-group" role="group">
                        <button class="btn btn-danger dropdown-toggle" type="button" :disabled="!contracts.length"
                            :class="{'disabled': !contracts.length}" data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="fa-solid fa-filter fa-fw"></i>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-dark bg-dark">
                            <div class="p-2" style="max-width: 200px">
                                <div class="d-flex flex-column">
                                    <div class="text-center mb-3">
                                        <label for="fileSize" class="lead form-label">File Size</label>
                                        <input required="required" type="range" @change="filterSize()"
                                            class="form-range" :min="filter.min" :max="filter.max" :step="filter.step"
                                            v-model="filter.size" id="fileSize">
                                        <span>{{fancyBytes(filter.size)}}</span>
                                    </div>
                                    <div class="form-check form-switch d-none">
                                        <input class="form-check-input" type="checkbox" role="switch"
                                            id="flexSwitchCheckChecked" checked>
                                        <label class="form-check-label" for="flexSwitchCheckChecked">NSFW</label>
                                    </div>
                                    <div class="form-check form-switch d-none">
                                        <input class="form-check-input" type="checkbox" role="switch"
                                            id="flexSwitchCheckChecked" checked>
                                        <label class="form-check-label" for="flexSwitchCheckChecked">Encrypted</label>
                                    </div>
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" @change="filterSlots()" type="checkbox"
                                            role="switch" id="flexSwitchCheckChecked" :checked="filter.slots"
                                            v-model="filter.slots">
                                        <label class="form-check-label" for="flexSwitchCheckChecked">Open Slots</label>
                                    </div>
                                </div>
                            </div>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
        <!-- cc node view -->
        <div v-if="cc" role="tabpanel show active" class="tab-pane" id="ccTab" aria-labelledby="cctab">
            <div class="hero-subtitle d-flex align-items-top mb-3 me-auto">IPFS Drive<span class="ms-2 fs-5">(SPK
                    Network)</span></div>
            <!-- no files -->
            <div v-if="hasFiles" class="ms-auto me-auto text-center">
                <div class="ms-auto me-auto card px-3 py-2 mt-3 mb-4 bg-darker" style="max-width: 600px">
                    <h2 class="fw-light mt-1">No files found</h2>
                    <p class="lead mb-1" v-if="!nodeview">
                        Click <a class="btn btn-sm btn-primary no-decoration small" style="font-size: 0.6em;"
                            role="button" data-bs-toggle="tab" href="#contractsTab"><i
                                class="fa-solid fa-list fa-fw me-1"></i>Contracts Tab
                        </a> to upload files
                    </p>
                </div>
            </div>
            <!-- has files -->
            <div v-if="!hasFiles" class="d-flex flex-wrap justify-content-center vfs-scroll-pass">
                <contracts-vue :contracts="contracts" :account="account" :saccountapi="saccountapi" :protocol="protocol"
                    :stats="stats" :nodeview="nodeview" :title="title" :test="test" :new-meta="newMeta" :links="links"
                    :post-body-adder="postBodyAdder" :postpage="postpage" :spkapi="spkapi" :sstats="sstats"
                    :mypfp="mypfp" @tosign="sendIt($event)" @update-pubkey="updatePubkey"
                    @store="store($event.contracts, $event.remove)" @download-file="downloadFile($event.cid, $event.id)"
                    @decrypt-key="decryptKey($event)" @add-user="addUser($event)"
                    @del-user="delUser($event.id, $event.user)" @check-hive="checkHive($event)"
                    @update-meta="update_meta($event)" @handle-tag="handleTag($event.id, $event.cid, $event.m)"
                    @handle-license="handleLicense($event.id, $event.cid, $event.m)"
                    @handle-label="handleLabel($event.id, $event.cid, $event.m)"
                    @get-img-data="getImgData($event.id, $event.cid)" />
            </div>
        </div>
        <!-- file system view -->
        <div v-if="!cc" class="vfs-scroll-pass">
            

            <!-- no files -->
            <div v-show="!contracts.length">
                <div class="ms-auto me-auto d-flex justify-content-center">
                    <div class="card mx-1 px-3 py-2 mt-3 mb-4 bg-darker" style="max-width: 600px">
                        <h2 class="fw-light mt-1">No files found</h2>
                        <p class="lead mb-1" v-if="nodeview && title == 'stored'">The TROLE API service can take up to
                            10 minutes to update data</p>
                        <p class="lead mb-1" v-if="!nodeview || title == 'new'" v-show="saccountapi.pow_broca">
                            Click
                            <a class="btn btn-sm btn-dark border-info text-info no-decoration small"
                                style="font-size: 0.6em; width: 72px;" role="button" data-bs-toggle="modal"
                                data-bs-target="#contractModal">
                                <modal-vue v-if="protocol?.head_block && saccountapi?.head_block" type="contract"
                                    :api="sapi" :mypfp="mypfp" token="balance" :test="test" :tokenstats="stats"
                                    :tokenprotocol="protocol" :tokenuser="saccountapi" :account="account"
                                    @tosign="sendIt($event)" v-slot:trigger>
                                    <span slot="trigger" class="trigger"><i
                                            class="fa-solid fa-file-contract fa-fw me-1"></i>NEW</span>
                                </modal-vue>
                            </a>
                            to create a contract using SPK Power
                        </p>
                        <p class="lead mb-1" v-if="!nodeview">
                            Click <a class="btn btn-sm btn-dark border-success text-success no-decoration small"
                                style="font-size: 0.6em; width:72px;" role="button" data-bs-toggle="modal"
                                data-bs-target="#sponsoredModal"><i
                                    class="fa-solid fa-wand-magic-sparkles fa-fw me-1"></i>FREE</a>
                            to select a sponsored contract</p>
                    </div>
                </div>
            </div>
            <!-- has files -->
            <div v-if="contracts.length" class="d-flex flex-wrap justify-content-center vfs-scroll-pass">
                <files-vue ref="filesVue" :assets="assets" @addassets="addAssets($event)" :account="account" :saccountapi="saccountapi" :computed-data="{usedBytes: usedBytes, availableBytes: availableBytes}"
                    @refresh-contracts="refreshContracts" @refresh-drive="handleRefreshDrive"
                    @update-contract="handleUpdateContract($event)"
                    @tosign="sendIt($event)" :signedtx="signedtx" :post-component-available="postpage" :post-type="postType" @add-to-post="handleAddToPost($event)"
                    :file-slots="fileSlots"
                    @set-logo="handleFileSlot('logo', $event)"
                    @set-featured="handleFileSlot('featured', $event)"
                    @set-banner="handleFileSlot('banner', $event)"
                    @set-wrapped="handleFileSlot('wrapped', $event)"
                    :update-url="updateUrl"></files-vue>
            </div>
        </div>
    </div>
    <!-- contracts modal -->
    <teleport to="body">
        <div class="modal fade" id="contractsModal" tabindex="-1" role="dialog" aria-labelledby="contractsModalLabel"
            aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-xl" role="document">
                <div class="modal-content text-white bg-dark-90">
                    <div class="modal-header">
                        <h5 class="modal-title" id="contractsModalLabel">SPK Network</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body p-0">
                        <contracts-vue :contracts="contracts" :account="account" :saccountapi="saccountapi"
                            :protocol="protocol" :stats="stats" :nodeview="nodeview" :title="title" :test="test"
                            :new-meta="newMeta" :links="links" :post-body-adder="postBodyAdder" :postpage="postpage"
                            :spkapi="spkapi" :sstats="sstats" :mypfp="mypfp" @tosign="sendIt($event)"
                            @update-pubkey="updatePubkey" @store="store($event.contracts, $event.remove)"
                            @download-file="downloadFile($event.cid, $event.id)" @decrypt-key="decryptKey($event)"
                            @add-user="addUser($event)" @del-user="delUser($event.id, $event.user)"
                            @check-hive="checkHive($event)" @update-meta="update_meta($event)"
                            @handle-tag="handleTag($event.id, $event.cid, $event.m)"
                            @handle-license="handleLicense($event.id, $event.cid, $event.m)"
                            @handle-label="handleLabel($event.id, $event.cid, $event.m)"
                            @get-img-data="getImgData($event.id, $event.cid)" />
                    </div>
                </div>
            </div>
        </div>
    </teleport>
</div>
`,
    props: {
        signedtx: Array,
        account: {
            default: ''
        },
        sapi: {
            default: 'https://spktest.dlux.io'
        },
        nodeview: {
            default: false
        },
        cc: {
            default: false
        },
        prop_contracts: {
            default: function () {
                return []
            }
        },
        files: {
            type: Object,
            default: {},
        },
        assets: {
            default: false,
            required: false
        },
        title: {
            default: 'Storage Contracts',
            required: false
        },
        mypfp: String,
        postpage: {
            default: false,
            required: false
        },
        accountinfo: {
            default: function () {
                return {}
            },
            required: false
        },
        stats: {
            default: function () {
                return {}
            },
            required: false
        },
        spkapi: {
            default: function () {
                return {}
            },
            required: false
        },
        protocol: {
            default: function () {
                return {}
            },
            required: false
        },
        fileSlots: {
            type: Object,
            default: function () {
                return {}
            },
            required: false
        },
        postType: {
            type: String,
            default: 'blog',
            required: false
        },
        updateUrl: {
            type: Boolean,
            default: true,
            required: false
        }
    },
    data() {
        return {
            activeTab: '',
            contracts: [],
            filter: {
                slots: true,
                size: 0,
                max: 0,
                min: 999999999999,
                step: 1,
            },
            postBodyAdder: {},
            newMeta: {},
            state2contracts: [],
            test: true,
            tick: "1",
            toSign: {},
            larynxbehind: 999999,
            lbalance: 0,
            lbargov: 0,
            spkval: 0,
            usedBytes: 0,
            availableBytes: 0,
            sstats: {},
            loaded: false,
            links: {},
            contractIDs: {},
            saccountapi: {
                spk: 0,
                balance: 0,
                gov: 0,
                poweredUp: 0,
                claim: 0,
                granted: {
                    t: 0
                },
                granting: {
                    t: 0
                }
            },
            ipfsProviders: {},
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
            contract: {
                api: '',
                id: '',
                files: '',
                fosig: '', //file-owner
                spsig: '', //service-provider 
                s: 10485760,
                t: 0
            }
        };
    },
    emits: ['tosign', 'addasset', 'bens', 'done', 'add-to-post', 'set-logo', 'set-featured', 'set-banner', 'set-wrapped'],
    methods: {
        ...common,
        ...spk,
        isValidThumb(string) {
            if (string.indexOf(":") == -1) {
                return false
            } else return string
        },
        deepLink(link) {
            if (link) location.hash = link;

            let url = location.href.replace(/\/$/, '');
            if (location.hash) {
                let hash = url.split('#')[1];
                let parentTab = null;
                let childTab = null;

                if (hash.includes('/')) {
                    const parts = hash.split('/');

                    const parentGroup = parts[0] === 'wallet' ? '#usertabs' : parts[0] === 'drive' ? '#usertabs' : null;
                    const childGroup = parts[0] === 'wallet' ? '#wallettabs' : parts[0] === 'drive' ? '#drivetabs' : null;

                    parentTab = parentGroup ? document.querySelector(`${parentGroup} a[href="#${parts[0]}"]`) : null;

                    childTab = childGroup ? document.querySelector(`${childGroup} a[href="#${parts[1]}"]`) : null;

                    if (parentTab) {
                        const parentTabInstance = new bootstrap.Tab(parentTab);
                        parentTabInstance.show();

                        if (parentTab.classList.contains('active')) {
                            if (childTab) {
                                const childTabInstance = new bootstrap.Tab(childTab);
                                childTabInstance.show();
                            }
                        } else {
                            parentTab.addEventListener('shown.bs.tab', () => {
                                if (childTab) {
                                    const childTabInstance = new bootstrap.Tab(childTab);
                                    childTabInstance.show();
                                }
                            });
                        }
                    }
                    
                    // Handle folder navigation from URL hash if it's a drive path with more segments
                    if (parts[0] === 'drive' && parts.length > 1) {
                        // Use $nextTick to ensure components are initialized
                        this.$nextTick(() => {
                            if (this.$refs.filesVue) {
                                const folderPath = parts.slice(1).join('/');
                                console.log("Navigating to folder from hash:", folderPath);
                                this.$refs.filesVue.navigateTo(folderPath);
                            }
                        });
                    }
                }
            }

            const selectableTabList = [].slice.call(document.querySelectorAll('a[data-bs-toggle="tab"]'));
            selectableTabList.forEach((selectableTab) => {
                selectableTab.addEventListener('click', function () {
                    const hash = selectableTab.getAttribute('href');
                    const parentTab = selectableTab.closest('#usertabs') ? '#usertabs' : selectableTab.closest('#wallettabs') ? '#wallettabs' : selectableTab.closest('#drivetabs') ? '#drivetabs' : null;
                    let newUrl;

                    if (parentTab === '#usertabs') {
                        newUrl = url.split('#')[0] + hash;
                    } else if (parentTab === '#wallettabs' || parentTab === '#drivetabs') {
                        const parentActiveTab = document.querySelector('#usertabs .active').getAttribute('href');
                        newUrl = url.split('#')[0] + parentActiveTab + '/' + hash.substring(1);
                    }
                    history.replaceState(null, null, newUrl);
                });
            });
        },
        getdelimed(string, del = ',', index = 0) {
            return string.split(del)[index] ? string.split(del)[index] : ''
        },
        getImgData(id, cid) {
            var string = this.smartThumb(id, cid)
            fetch(string).then(response => response.text()).then(data => {
                if (data.indexOf('data:image/') >= 0) this.newMeta[id][cid].thumb_data = data
                else this.newMeta[id][cid].thumb_data = string
            }).catch(e => {
                this.newMeta[id][cid].thumb_data = string
            })
        },
        addToPost(cid, contract, loc = 'self') {
            const string = `${this.newMeta[contract][cid].thumb ? '!' : ''}[${this.newMeta[contract][cid].name}.${this.newMeta[contract][cid].type}](https://ipfs.dlux.io/ipfs/${cid})`
            this.postBodyAdder[`${loc == 'self' ? contract : loc}`] = {
                string,
                contract: this.contractIDs[contract],
                cid,
            }
        },
        split(string, index = 0, del = ',') {
            return string.split(del)[index] ? string.split(del)[index] : ''
        },
        addUser(id) {
            if (this.contractIDs[id].encryption) {
                this.contractIDs[id].encryption.accounts[this.contractIDs[id].encryption.input] = {
                    key: '',
                    enc_key: '',
                }
                this.contractIDs[id].encryption.input = ''
            }
        },
        delUser(id, user) {
            delete this.contractIDs[id].encryption.accounts[user]
        },
        checkHive(id) {
            return new Promise((resolve, reject) => {
                this.fetching = true
                var accounts = Object.keys(this.contractIDs[id].encryption.accounts)
                var newAccounts = []
                for (var i = 0; i < accounts.length; i++) {
                    if (!this.contractIDs[id].encryption.accounts[accounts[i]]?.key) {
                        newAccounts.push(accounts[i])
                    }
                }

                if (newAccounts.length) fetch('https://hive-api.dlux.io', {
                    method: 'POST',
                    body: JSON.stringify({
                        "jsonrpc": "2.0",
                        "method": "condenser_api.get_accounts",
                        "params": [newAccounts],
                        "id": 1
                    })
                }).then(response => response.json())
                    .then(data => {
                        this.fetching = false
                        if (data.result) {
                            for (var i = 0; i < data.result.length; i++) {
                                if (data.result[i].id) {
                                    this.contractIDs[id].encryption.accounts[data.result[i].name].key = data.result[i].memo_key
                                }
                            }
                            this.encryptKeyToUsers(id)
                            resolve(data.result)
                        } else {
                            reject(data.error)
                        }
                    })
                    .catch(e => {
                        this.fetching = false
                    })
            })
        },
        encryptKeyToUsers(id) {
            return new Promise((resolve, reject) => {
                const usernames = Object.keys(this.contractIDs[id].encryption.accounts)
                var keys = []
                var dict = {}
                for (var i = 0; i < usernames.length; i++) {
                    if (!this.contractIDs[id].encryption.accounts[usernames[i]].enc_key) keys.push(this.contractIDs[id].encryption.accounts[usernames[i]].key)
                    dict[this.contractIDs[id].encryption.accounts[usernames[i]].key] = usernames[i]
                }
                const key = "#" + this.contractIDs[id].encryption.key;
                if (keys.length) hive_keychain.requestEncodeWithKeys(this.account, keys, key, 'Memo', (response) => {
                    console.log(response)
                    if (response.success) {
                        for (var node in response.result) {
                            this.contractIDs[id].encryption.accounts[dict[node]].enc_key = response.result[node]
                        }
                        resolve("OK")
                    } else {
                        reject(response.message);
                    }
                });
                else resolve(null)
            })
        },
        decryptKey(id) {
            return new Promise((resolve, reject) => {
                const key = this.contractIDs[id].encryption.accounts[this.spkapi.name].enc_key;
                hive_keychain.requestVerifyKey(this.spkapi.name, key, 'Memo', (response) => {
                    if (response.success) {
                        this.contractIDs[id].encryption.key = response.result.split('#')[1]
                        resolve("OK")
                    } else {
                        reject(response.message);
                    }
                });
            })
        },
        AESDecrypt(encryptedMessage, key) {
            const bytes = CryptoJS.AES.decrypt(encryptedMessage, key);
            return bytes.toString(CryptoJS.enc.Utf8);
        },
        downloadFile(cid, id) {
            fetch(`https://ipfs.dlux.io/ipfs/${cid}`)
                .then((response) => response.text())
                .then((blob) => {

                    const name = this.newMeta[id][cid].name + '.' + this.newMeta[id][cid].type || 'file'
                    if (this.contractIDs[id].encryption.key) {
                        blob = this.AESDecrypt(blob, this.contractIDs[id].encryption.key);
                        var byteString = atob(blob.split(',')[1])
                        var mimeString = blob.split(',')[0].split(':')[1].split(';')[0];
                        var ab = new ArrayBuffer(byteString.length);
                        var ia = new Uint8Array(ab);
                        for (var i = 0; i < byteString.length; i++) {
                            ia[i] = byteString.charCodeAt(i);
                        }
                        blob = new Blob([ab], { type: mimeString });
                    }
                    try {
                        var url = window.URL.createObjectURL(blob);
                        var a = document.createElement('a');
                        a.href = url;
                        a.download = name;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                    } catch (e) {
                        var url = window.URL.createObjectURL(response);
                        var a = document.createElement('a');
                        a.href = url;
                        a.download = name;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                    }

                });
        },
        smartThumb(contract, cid) {
            if (this.newMeta[contract][cid].thumb.includes('https://')) {
                return this.newMeta[contract][cid].thumb
            } else if (this.newMeta[contract][cid].thumb.includes('Qm')) {
                return `https://ipfs.dlux.io/ipfs/${this.newMeta[contract][cid].thumb}`
            } else return false
        },
        flagDecode(flags = "", flag = 0, omit = 0) {
            if (flag) return this.Base64toNumber(flags[0]) & flag
            if (flags.indexOf(',') > -1) flags = flags.split(',')[4]
            var num = this.Base64toNumber(flags[0])
            if (omit) num = num & ~omit
            var out = {}
            if (num & 1) out.enc = true
            if (num & 2) out.autoRenew = true
            if (num & 4) out.nsfw = true
            if (num & 8) out.executable = true
            return out
        },
        metaMismatch(contract) {
            var enc_string = ''
            for (var acc in this.contractIDs[contract].encryption.accounts) {
                if (this.contractIDs[contract].encryption.accounts[acc].enc_key) enc_string += `${this.contractIDs[contract].encryption.accounts[acc].enc_key}@${acc};`
            }
            //remove last ;
            enc_string = `${this.newMeta[contract].contract.autoRenew ? '1' : ''}${enc_string.slice(0, -1)}`
            this.newMeta[contract].contract.enc_string = enc_string
            var cids = Object.keys(this.newMeta[contract])
            cids = cids.sort((a, b) => {
                if (a > b) return 1
                else if (a < b) return -1
                else return 0
            })
            for (var i = 0; i < cids.length; i++) {
                if (cids[i] != 'contract') {
                    enc_string += `,${this.newMeta[contract][cids[i]].name},${this.newMeta[contract][cids[i]].type},${this.newMeta[contract][cids[i]].thumb},${this.newMeta[contract][cids[i]].flags}-${this.newMeta[contract][cids[i]].license}-${this.newMeta[contract][cids[i]].labels}`
                }
            }
            if (this.newMeta[contract].contract.m != enc_string) return true
        },
        update_meta(payload) {
            return new Promise((resolve, reject) => {
                const contractId = payload.contractId;
                console.log(this.newMeta[contractId], contractId);
                var enc_string = '';
                if (this.contractIDs && this.contractIDs[contractId] && this.contractIDs[contractId].encryption && this.contractIDs[contractId].encryption.accounts) {
                    for (var acc in this.contractIDs[contractId].encryption.accounts) {
                        if (this.contractIDs[contractId].encryption.accounts[acc].enc_key) {
                            enc_string += `${this.contractIDs[contractId].encryption.accounts[acc].enc_key}@${acc};`;
                        }
                    }
                }
                
                const autoRenew = (this.newMeta && this.newMeta[contractId] && this.newMeta[contractId].contract) ? this.newMeta[contractId].contract.autoRenew : false;
                enc_string = `${autoRenew ? '1' : '0'}${enc_string ? '#' + enc_string.slice(0, -1) : ''}`;

                if (this.newMeta && this.newMeta[contractId] && this.newMeta[contractId].contract) {
                    this.newMeta[contractId].contract.enc_string = enc_string;
                }
                
                var cids = (this.newMeta && this.newMeta[contractId]) ? Object.keys(this.newMeta[contractId]) : [];
                cids = cids.sort((a, b) => {
                    if (a > b) return 1;
                    else if (a < b) return -1;
                    else return 0;
                });
                for (var i = 0; i < cids.length; i++) {
                    if (cids[i] !== 'contract' && this.newMeta[contractId][cids[i]]) {
                        enc_string += `,${this.newMeta[contractId][cids[i]].name || ''},${this.newMeta[contractId][cids[i]].type || ''},${this.newMeta[contractId][cids[i]].thumb || ''},${this.newMeta[contractId][cids[i]].flags || '0'}-${this.newMeta[contractId][cids[i]].license || ''}-${this.newMeta[contractId][cids[i]].labels || ''}`;
                    }
                }
        
                const existingMeta = (this.contractIDs && this.contractIDs[contractId]) ? (this.contractIDs[contractId].m || '') : '';
                const diff = jsdiff.createPatch(
                    contractId,
                    existingMeta,
                    enc_string,
                    'Current Metadata',
                    'Updated Metadata'
                );
        
                const diffBody = diff
                    .split('\n')
                    .slice(4)
                    .join('\n')
                    .trim();
        
                var cja = {
                    id: contractId
                };
        
                if (existingMeta && diffBody && diffBody !== enc_string) {
                    cja.diff = diffBody;
                } else {
                    cja.m = enc_string;
                }
        
                const removeSave = new Promise((res, rej) => {
                    this.toSign = {
                        type: "cj",
                        cj: cja,
                        id: `spkccT_update_metadata`,
                        msg: `Updating Metadata for Contract: ${contractId}`,
                        ops: [],
                        callbacks: [res, rej],
                        api: this.sapi,
                        txid: `spkccT_update_meta`,
                    };
                });
        
                removeSave.then(() => {
                    if (this.contractIDs && this.contractIDs[contractId]) {
                        this.contractIDs[contractId].m = enc_string;
                        console.log(this.contractIDs[contractId].m, cja.m || cja.diff);
                    }
                    resolve('OK');
                }).catch(e => {
                    reject(e);
                });
            });
        },
        done() {
            this.$emit('done')
        },
        modalSelect(url) {
            this.$emit('modalselect', url);
        },
        updatePubkey() {
            var cja = {
                pubKey: this.accountinfo.posting.key_auths[0][0]
            };
            this.toSign = {
                type: "cja",
                cj: cja,
                id: `spkccT_register_authority`,
                msg: `Registering: ${this.account}:${this.accountinfo.posting.key_auths[0][0]}`,
                ops: ["getSapi", "refreshComponents"],
                api: this.sapi,
                txid: `spkccT_register_authority`,
            };
        },
        addAssets(id, contract) {
            if (typeof id == 'object') this.$emit('addasset', id);
            else this.$emit('addasset', { id, contract });
        },
        sortContracts(on = 'c', dir = 'asc') {
            //filter duplicates
            this.contracts = this.contracts.filter((v, i, a) => a.findIndex(t => (t.i === v.i)) === i)
            this.contracts.sort((a, b) => {
                if (a[on] > b[on]) {
                    return dir == 'asc' ? 1 : -1
                } else if (a[on] < b[on]) {
                    return dir == 'asc' ? -1 : 1
                } else {
                    return 0
                }
            })
            for (var i = 0; i < this.contracts.length; i++) {
                this.contracts[i].index = i
                this.contractIDs[this.contracts[i].i].index = i
            }
        },
        exp_to_time(exp = '0:0') {
            return this.when([parseInt(exp.split(':')[0])])
        },
        replace(string = "", char = ':') {
            return string.replaceAll(char, '_')
        },
        split(string, del, index) {
            return string.split(del)[index]
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
        pluralFiles(id) {
            var count = 0
            for (var i in this.newMeta[id]) {
                if (i != 'contract' && !this.newMeta[id][i].is_thumb) count++
            }
            return count
        },
        getSapi(user = this.account) {
            if (user) fetch(this.sapi + "/@" + user)
                .then((response) => response.json())
                .then((data) => {
                    data.tick = data.tick || 0.01;
                    this.larynxbehind = data.behind;
                    this.lbalance = (data.balance / 1000).toFixed(3);
                    this.lbargov = (data.gov / 1000).toFixed(3);
                    data.powerDowns = Object.keys(data.power_downs);
                    for (var i = 0; i < data.powerDowns.length; i++) {
                        data.powerDowns[i] = data.powerDowns[i].split(":")[0];
                    }
                    // Storage nodes won't get contracts from here, we'll need some props from the contract
                    if (!this.nodeview) {
                        for (var node in data.file_contracts) {
                            data.file_contracts[node].encryption = {
                                input: "",
                                key: "",
                                accounts: {},
                            }
                            this.links[data.file_contracts[node].i] = ""
                            var links = ""
                            if (!data.file_contracts[node].m) {
                                data.file_contracts[node].autoRenew = false
                                data.file_contracts[node].m = ""
                                this.newMeta[data.file_contracts[node].i] = {
                                    contract: {
                                        autoRenew: false,
                                        encrypted: false,
                                        m: "",
                                    }
                                }
                                var filesNames = data.file_contracts[node]?.df ? Object.keys(data.file_contracts[node].df) : []
                                filesNames = filesNames.sort((a, b) => {
                                    if (a > b) return 1
                                    else if (a < b) return -1
                                    else return 0
                                })
                                for (var i = 0; i < filesNames.length; i++) {
                                    this.newMeta[data.file_contracts[node].i][filesNames[i]] = {
                                        name: '',
                                        type: '',
                                        thumb: '',
                                        flags: '',
                                        is_thumb: false,
                                        encrypted: false,
                                        license: '',
                                        labels: '',
                                        size: data.file_contracts[node].df[filesNames[i]]
                                    }
                                    this.usedBytes += data.file_contracts[node].df[filesNames[i]]
                                    links += `![File ${i + 1}](https://ipfs.dlux.io/ipfs/${filesNames[i]})\n`
                                }
                            } else {
                                if (data.file_contracts[node].m.indexOf('"') >= 0) data.file_contracts[node].m = JSON.parse(data.file_contracts[node].m)
                                var encData = data.file_contracts[node].m.split(',')[0] || ''
                                var renew = this.Base64toNumber(encData[0] || '0') & 1 ? true : false
                                var encAccounts = []
                                var encrypted = false
                                if (encData) {
                                    encData = encData.split('#')
                                    renew = this.Base64toNumber(encData.shift()) & 1 ? true : false
                                    if (encData.length) {
                                        encData = '#' + encData.join('#')
                                        encAccounts = encData.split(';')
                                        encrypted = true
                                    }
                                }
                                this.newMeta[data.file_contracts[node].i] = {
                                    contract: {
                                        autoRenew: renew,
                                        encrypted,
                                        m: data.file_contracts[node].m,
                                    }
                                }
                                for (var i = 0; i < encAccounts.length; i++) {
                                    const encA = encAccounts[i].split('@')[1]
                                    data.file_contracts[node].autoRenew = renew
                                    data.file_contracts[node].encryption.accounts[encA] = {
                                        enc_key: `#${encAccounts[i].split('@')[0].split('#')[1]}`,
                                        key: '',
                                        done: true,
                                    }
                                }

                                var filesNames = data.file_contracts[node]?.df ? Object.keys(data.file_contracts[node].df) : []
                                filesNames = filesNames.sort((a, b) => {
                                    if (a > b) return 1
                                    else if (a < b) return -1
                                    else return 0
                                })
                                const slots = data.file_contracts[node].m.split(",")
                                for (var i = 0; i < filesNames.length; i++) {
                                    this.usedBytes += data.file_contracts[node].df[filesNames[i]]
                                    const flags = slots[i * 4 + 4] || ''
                                    this.newMeta[data.file_contracts[node].i][filesNames[i]] = {
                                        name: slots[i * 4 + 1],
                                        type: slots[i * 4 + 2],
                                        thumb: slots[i * 4 + 3],
                                        thumb_data: slots[i * 4 + 3],
                                        flags: flags.indexOf('-') >= 0 ? flags.split('-')[0] : flags[0],
                                        license: flags.indexOf('-') >= 0 ? flags.split('-')[1] : '',
                                        labels: flags.indexOf('-') >= 0 ? flags.split('-')[2] : flags.slice(1),
                                    }
                                    if (this.newMeta[data.file_contracts[node].i][filesNames[i]].thumb) this.getImgData(data.file_contracts[node].i, filesNames[i])
                                    if (this.Base64toNumber(this.newMeta[data.file_contracts[node].i][filesNames[i]].flags) & 1) this.newMeta[data.file_contracts[node].i][filesNames[i]].encrypted = true
                                    else this.newMeta[data.file_contracts[node].i][filesNames[i]].encrypted = false
                                    if (this.Base64toNumber(this.newMeta[data.file_contracts[node].i][filesNames[i]].flags) & 2) this.newMeta[data.file_contracts[node].i][filesNames[i]].is_thumb = true
                                    else this.newMeta[data.file_contracts[node].i][filesNames[i]].is_thumb = false
                                    if (this.Base64toNumber(this.newMeta[data.file_contracts[node].i][filesNames[i]].flags) & 4) this.newMeta[data.file_contracts[node].i][filesNames[i]].nsfw = true
                                    else this.newMeta[data.file_contracts[node].i][filesNames[i]].nsfw = false
                                    links += `![${this.newMeta[data.file_contracts[node].i][filesNames[i]].name}](https://ipfs.dlux.io/ipfs/${filesNames[i]})\n`
                                }
                            }
                            this.links[data.file_contracts[node].i] = links
                            this.contractIDs[data.file_contracts[node].i] = data.file_contracts[node];

                            this.contracts.push(data.file_contracts[node]);
                            this.contractIDs[data.file_contracts[node].i].index = this.contracts.length - 1;
                            this.postBodyAdder[data.file_contracts[node].i] = {}

                        }
                        for (var user in data.channels) {
                            for (var node in data.channels[user]) {
                                if (this.contractIDs[data.channels[user][node].i]) continue
                                else {
                                    this.contractIDs[data.channels[user][node].i] = data.channels[user][node];
                                    this.contracts.push(data.channels[user][node]);
                                    this.contractIDs[data.channels[user][node].i].index = this.contracts.length - 1;
                                }
                            }
                        }
                        this.sortContracts()
                        
                        // After contracts are loaded, restore the folder path if needed
                        this.$nextTick(() => {
                            if (this.pathToRestore && this.$refs.filesVue) {
                                console.log("Restoring folder path:", this.pathToRestore);
                                this.$refs.filesVue.navigateTo(this.pathToRestore);
                                this.pathToRestore = null; // Clear the path after restoring
                            } else if (location.hash && location.hash.startsWith('#drive/')) {
                                // If no path to restore but we have a hash path, use that
                                const folderPath = location.hash.substring('#drive/'.length);
                                if (folderPath && this.$refs.filesVue) {
                                    console.log("Navigating to hash path:", folderPath);
                                    this.$refs.filesVue.navigateTo(folderPath);
                                }
                            }
                        });
                    }
                    this.saccountapi = data;
                    this.saccountapi.spk += this.reward_spk();
                    if (!this.saccountapi.granted.t) this.saccountapi.granted.t = 0;
                    if (!this.saccountapi.granting.t) this.saccountapi.granting.t = 0;
                    this.availableBytes = data.pow_broca * 1000 * 1024 * 6
                    this.spkval =
                        (data.balance +
                            data.gov +
                            data.poweredUp +
                            data.spk_power +
                            this.saccountapi.granting.t +
                            data.claim +
                            data.spk) /
                        1000;
                });
        },
        getSpkStats() {
            fetch(this.sapi + "/stats")
                .then((response) => response.json())
                .then((data) => {
                    //console.log(data);
                    this.loaded = true;
                    this.spkStats = data.result;
                    for (var i = 0; i < this.tokenGov.options.length; i++) {
                        this.tokenGov.options[i].val = data.result[this.tokenGov.options[i].id]
                        this.tokenGov.options[i].range_high = parseFloat(this.tokenGov.options[i].val * 1.01).toFixed(6)
                        this.tokenGov.options[i].range_low = parseFloat(this.tokenGov.options[i].val * 0.99).toFixed(6)
                        this.tokenGov.options[i].step = "0.000001"
                    }
                    this.getSapi()
                });
        },
        handleLabel(id, cid, m) {
            if (m.action == 'added') {
                if (this.newMeta[id][cid].labels.indexOf(m.item) == -1) this.newMeta[id][cid].labels += m.item
            } else {
                this.newMeta[id][cid].labels = this.newMeta[id][cid].labels.replace(m.item, '')
            }
        },
        handlePropContracts(contract) {
            if (this.larynxbehind == 999999) {
                setTimeout(() => {
                    this.handlePropContracts(contract)
                }, 1000)
            } else {
                const data = {
                    file_contracts: [contract]
                }
                file: for (var node in data.file_contracts) {
                    if (this.title == 'new') for (var i in data.file_contracts[node].n) {
                        if (data.file_contracts[node].n[i] == this.account) continue file
                    }
                    if (data.file_contracts[node].u > this.filter.size) {
                        this.filter.size = data.file_contracts[node].u
                        this.filter.max = data.file_contracts[node].u
                    }
                    if (data.file_contracts[node].u < this.filter.min) {
                        this.filter.min = data.file_contracts[node].u
                    }

                    data.file_contracts[node].sm = 1
                    data.file_contracts[node].encryption = {
                        input: "",
                        key: "",
                        accounts: {},
                    }
                    this.links[data.file_contracts[node].i] = ""
                    var links = ""
                    if (!data.file_contracts[node].m) {
                        data.file_contracts[node].autoRenew = false
                        data.file_contracts[node].m = ""
                        this.newMeta[data.file_contracts[node].i] = {
                            contract: {
                                autoRenew: false,
                                encrypted: false,
                                m: "",
                            }
                        }
                        var filesNames = data.file_contracts[node]?.df ? Object.keys(data.file_contracts[node].df) : []
                        filesNames = filesNames.sort((a, b) => {
                            if (a > b) return 1
                            else if (a < b) return -1
                            else return 0
                        })
                        for (var i = 0; i < filesNames.length; i++) {
                            this.newMeta[data.file_contracts[node].i][filesNames[i]] = {
                                name: '',
                                type: '',
                                thumb: '',
                                flags: '',
                                is_thumb: false,
                                encrypted: false,
                                license: '',
                                labels: '',
                                size: data.file_contracts[node].df[filesNames[i]]
                            }
                            this.usedBytes += data.file_contracts[node].df[filesNames[i]]
                            links += `![File ${i + 1}](https://ipfs.dlux.io/ipfs/${filesNames[i]})\n`
                        }
                    } else {
                        if (data.file_contracts[node].m.indexOf('"') >= 0) data.file_contracts[node].m = JSON.parse(data.file_contracts[node].m)
                        var encData = data.file_contracts[node].m.split(',')[0] || ''
                        var renew = this.Base64toNumber(encData[0] || '0') & 1 ? true : false
                        var encAccounts = []
                        var encrypted = false
                        if (encData) {
                            encData = encData.split('#')
                            renew = this.Base64toNumber(encData.shift()) & 1 ? true : false
                            if (encData.length) {
                                encData = '#' + encData.join('#')
                                encAccounts = encData.split(';')
                                encrypted = true
                            }
                        }
                        this.newMeta[data.file_contracts[node].i] = {
                            contract: {
                                autoRenew: renew,
                                encrypted,
                                m: data.file_contracts[node].m,
                            }
                        }
                        for (var i = 0; i < encAccounts.length; i++) {
                            const encA = encAccounts[i].split('@')[1]
                            data.file_contracts[node].autoRenew = renew
                            data.file_contracts[node].encryption.accounts[encA] = {
                                enc_key: `#${encAccounts[i].split('@')[0].split('#')[1]}`,
                                key: '',
                                done: true,
                            }
                        }

                        var filesNames = data.file_contracts[node]?.df ? Object.keys(data.file_contracts[node].df) : []
                        filesNames = filesNames.sort((a, b) => {
                            if (a > b) return 1
                            else if (a < b) return -1
                            else return 0
                        })
                        const slots = data.file_contracts[node].m.split(",")
                        for (var i = 0; i < filesNames.length; i++) {
                            this.usedBytes += data.file_contracts[node].df[filesNames[i]]
                            const flags = slots[i * 4 + 4]
                            this.newMeta[data.file_contracts[node].i][filesNames[i]] = {
                                name: slots[i * 4 + 1],
                                type: slots[i * 4 + 2],
                                thumb: slots[i * 4 + 3],
                                thumb_data: slots[i * 4 + 3],
                                flags: flags.indexOf('-') >= 0 ? flags.split('-')[0] : flags[0],
                                license: flags.indexOf('-') >= 0 ? flags.split('-')[1] : '',
                                labels: flags.indexOf('-') >= 0 ? flags.split('-')[2] : flags.slice(1),
                            }
                            if (this.newMeta[data.file_contracts[node].i][filesNames[i]].thumb) this.getImgData(data.file_contracts[node].i, filesNames[i])
                            if (this.Base64toNumber(this.newMeta[data.file_contracts[node].i][filesNames[i]].flags) & 1) this.newMeta[data.file_contracts[node].i][filesNames[i]].encrypted = true
                            else this.newMeta[data.file_contracts[node].i][filesNames[i]].encrypted = false
                            if (this.Base64toNumber(this.newMeta[data.file_contracts[node].i][filesNames[i]].flags) & 2) this.newMeta[data.file_contracts[node].i][filesNames[i]].is_thumb = true
                            else this.newMeta[data.file_contracts[node].i][filesNames[i]].is_thumb = false
                            if (this.Base64toNumber(this.newMeta[data.file_contracts[node].i][filesNames[i]].flags) & 4) this.newMeta[data.file_contracts[node].i][filesNames[i]].nsfw = true
                            else this.newMeta[data.file_contracts[node].i][filesNames[i]].nsfw = false
                            links += `![${this.newMeta[data.file_contracts[node].i][filesNames[i]].name}](https://ipfs.dlux.io/ipfs/${filesNames[i]})\n`
                        }
                    }
                    this.links[data.file_contracts[node].i] = links
                    this.contractIDs[data.file_contracts[node].i] = data.file_contracts[node];

                    this.contracts.push(data.file_contracts[node]);
                    this.contractIDs[data.file_contracts[node].i].index = this.contracts.length - 1;
                    this.postBodyAdder[data.file_contracts[node].i] = {}

                }
                this.filter.step = (this.filter.max - this.filter.min) / 100
                for (var user in data.channels) {
                    for (var node in data.channels[user]) {
                        if (this.contractIDs[data.channels[user][node].i]) continue
                        else {
                            this.contractIDs[data.channels[user][node].i] = data.channels[user][node];
                            this.contracts.push(data.channels[user][node]);
                            this.contractIDs[data.channels[user][node].i].index = this.contracts.length - 1;
                        }
                    }
                }
                this.sortContracts()
            }
        },
        handleLicense(id, cid, m) {
            if (m.action == 'added') {
                this.newMeta[id][cid].license = m.item
            } else {
                this.newMeta[id][cid].license = ''
            }
        },
        handleTag(id, cid, m) {
            var num = this.Base64toNumber(this.newMeta[id][cid].flags) || 0
            if (m.action == 'added') {
                if (num & m.item) { }
                else num += m.item
                this.newMeta[id][cid].flags = (this.NumberToBase64(num) || "0")
                switch (m.item) {
                    case 1:
                        this.newMeta[id][cid].encrypted = true
                        break
                    case 2:
                        this.newMeta[id][cid].is_thumb = true
                        break
                    case 4:
                        this.newMeta[id][cid].nsfw = true
                        break
                    default:
                }
            } else {
                if (num & m.item) num -= m.item
                this.newMeta[id][cid].flags = (this.NumberToBase64(num) || "0")
                switch (m.item) {
                    case 1:
                        this.newMeta[id][cid].encrypted = false
                        break
                    case 2:
                        this.newMeta[id][cid].is_thumb = false
                        break
                    case 4:
                        this.newMeta[id][cid].nsfw = false
                        break
                    default:
                }
            }
        },
        NumberToBase64(num) {
            const glyphs = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+=";
            var result = "";
            while (num > 0) {
                result = glyphs[num % 64] + result;
                num = Math.floor(num / 64);
            }
            return result;
        },
        when(arr) {
            if (!arr.length) return "";
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
        reward_spk() {
            var r = 0,
                a = 0,
                b = 0,
                c = 0,
                t = 0,
                diff = (this.saccountapi.head_block ? this.saccountapi.head_block : this.sstats.lastIBlock) - this.saccountapi.spk_block;
            //console.log(diff, this.saccountapi.head_block , this.sstats)
            if (!this.saccountapi.spk_block) {
                //console.log("No SPK seconds");
                return 0;
            } else if (diff < 28800) {
                //console.log("Wait for SPK");
                return 0;
            } else {
                t = parseInt(diff / 28800);
                a = this.saccountapi.gov
                    ? simpleInterest(this.saccountapi.gov, t, this.sstats.spk_rate_lgov)
                    : 0;
                b = this.saccountapi.pow
                    ? simpleInterest(this.saccountapi.pow, t, this.sstats.spk_rate_lpow)
                    : 0;
                c = simpleInterest(
                    parseInt(
                        this.saccountapi.granted?.t > 0 ? this.saccountapi.granted.t : 0
                    ) +
                    parseInt(
                        this.saccountapi.granting?.t > 0 ? this.saccountapi.granting.t : 0
                    ),
                    t,
                    this.sstats.spk_rate_ldel
                );
                const i = a + b + c;
                if (i) { return i } else { return 0 }
            }
            function simpleInterest(p, t, r) {
                const amount = p * (1 + parseFloat(r) / 365);
                const interest = amount - p;
                return parseInt(interest * t);
            }
        },
        selectContract(id, broker) {  //needs PeerID of broker
            this.contract.id = id
            fetch(`${this.sapi}/user_services/${broker}`)
                .then(r => r.json())
                .then(res => {
                    this.contract.api = res.services.IPFS[Object.keys(res.services.IPFS)[0]].a
                })
        },
        extend(contract, amount) {
            if (amount > this.broca_calc(this.broca)) return
            const toSign = {
                type: "cja",
                cj: {
                    broca: amount,
                    id: contract.i,
                    file_owner: contract.t,
                    power: this.spread ? 1 : 0,
                },
                id: `spkccT_extend`,
                msg: `Extending ${contract.i}...`,
                ops: ["getTokenUser", "refreshComponents"],
                api: "https://spktest.dlux.io",
                txid: "extend",
            }
            this.$emit('tosign', toSign)
        },
        store(contracts, remove = false) {
            // have a storage node?
            if (typeof contracts == "string") contracts = [contracts]
            const toSign = {
                type: "cja",
                cj: {
                    items: contracts
                },
                id: `spkccT_${!remove ? 'store' : 'remove'}`,
                msg: `Storing ${contract}...`,
                ops: ["getTokenUser", "refreshComponents"],
                api: "https://spktest.dlux.io",
                txid: `${contract}_${!remove ? 'store' : 'remove'}`,
            }
            console.log(toSign)
            this.$emit('tosign', toSign)
        },
        storeAll() {
            console.log("store all")
            var contracts = []
            for (var i = 0; i < this.contracts.length; i++) {
                if (this.contracts[i].sm == 1) contracts.push(this.contracts[i].i)
            }
            console.log(contracts)
            this.store(contracts)
        },
        filterSize() {
            for (var i = 0; i < this.contracts.length; i++) {
                if (this.isStored(this.contracts[i].i)) this.contracts[i].sm = 0
                if (this.contracts[i].u <= this.filter.size) this.contracts[i].sm = 1
                else this.contracts[i].sm = 0
            }
            this.filterSlots
        },
        filterSlots() {
            if (this.filterSize.slot) for (var i = 0; i < this.contracts.length; i++) {
                if (this.isStored(this.contracts[i].i)) this.contracts[i].sm = 0
                if (!Object.keys(this.contracts[i].n).length < this.contracts[i].p && this.contracts[i].sm == 1) this.contracts[i].sm = 1
                else this.contracts[i].sm = 0
            }
        },
        getContracts() {
            var contracts = [],
                getContract = (id) => {
                    fetch('https://spktest.dlux.io/api/fileContract/' + id)
                        .then((r) => r.json())
                        .then((res) => {
                            res.result.extend = "7"
                            if (res.result) {
                                this.contracts[id] = res.result
                                if (res.result.c == 2) {
                                    this.state2contracts.push(res.result.s)
                                }
                                //this.extendcost[id] = parseInt(res.result.extend / 30 * res.result.r)
                            }
                        });
                }
            for (var contract in this.post.contract) {
                contracts.push(contract)
            }
            contracts = [...new Set(contracts)]
            for (var i = 0; i < contracts.length; i++) {
                getContract(contracts[i])
            }
        },
        addBen(s) {
            console.log(s)
            this.$emit('bens', { account: s.split(',')[0], weight: s.split(',')[1] })
        },
        getIPFSproviders() {
            fetch("https://spktest.dlux.io/services/IPFS")
                .then((response) => response.json())
                .then((data) => {
                    this.ipfsProviders = data.providers
                });
        },
        imgUrlAlt(event) {
            event.target.src = "/img/dlux-logo-icon.png";
        },
        picFind(json) {
            var arr;
            try {
                arr = json.image[0];
            } catch (e) { }
            if (typeof json.image == "string") {
                return json.image;
            } else if (typeof arr == "string") {
                return arr;
            } else if (typeof json.Hash360 == "string") {
                return `https://ipfs.dlux.io/ipfs/${json.Hash360}`;
            } else {
                /*
                        var looker
                        try {
                            looker = body.split('![')[1]
                            looker = looker.split('(')[1]
                            looker = looker.split(')')[0]
                        } catch (e) {
                            */
                return "/img/dluxdefault.png";
            }
        },
        pending(event) {
            this.mde = event
        },
        vote(url) {
            this.$emit('vote', { url: `/@${this.post.author}/${this.post.permlink}`, slider: this.slider, flag: this.flag })
        },
        color_code(name) {
            return parseInt(this.contracts[name] ? this.contracts[name].e.split(':')[0] : 0) - this.head_block
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
        setReply(event) {
            this.mde = event
        },
        reply(deets) {
            if (!deets) deets = {
                "parent_author": this.post.author,
                "parent_permlink": this.post.permlink,
                "author": this.account,
                "permlink": 're-' + this.post.permlink,
                "title": '',
                "body": this.mde,
                "json_metadata": JSON.stringify(this.postCustom_json)
            }
            this.$emit('reply', deets)
        },
        Base64toNumber(chars = "") {
            if (typeof chars != 'string') {
                console.log({ chars })
                return 0
            }
            const glyphs =
                "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+=";
            var result = 0;
            chars = chars.split("");
            for (var e = 0; e < chars.length; e++) {
                result = result * 64 + glyphs.indexOf(chars[e]);
            }
            return result;
        },
        formatNumber(t = 1, n, r, e) { // number, decimals, decimal separator, thousands separator
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
            if (isNaN(t)) return "0";
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
        precision(num, precision) {
            return parseFloat(num / Math.pow(10, precision)).toFixed(precision);
        },
        toFixed(n, digits) {
            return parseFloat(n).toFixed(digits)
        },
        hideLowRep() {
            if (this.post.rep != '...') {
                if (parseFloat(this.post.rep) < 25) {
                    this.view = false;
                    this.warn = true;
                }
            } else {
                setTimeout(this.hideLowRep, 1000)
            }
        },
        unkeyed(obj) {
            if (!obj) return false
            if (!this.contracts[this.contractIDs[obj].index].encryption) return false
            for (var node in this.contracts[this.contractIDs[obj].index].encryption.accounts) {
                if (!this.contracts[this.contractIDs[obj].index].encryption.accounts[node].enc_key) return true
            }
            return false
        },
        setRating(rating) {
            this.post.rating = rating;
        },
        fancyBytes(bytes) {
            var counter = 0, p = ['', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y']
            while (bytes > 1024) {
                bytes = bytes / 1024
                counter++
            }
            return `${this.toFixed(bytes, 2)} ${p[counter]}B`
        },
        expIn(con) {
            return `Expires in ${parseInt((parseInt(con.e.split(':')[0]) - this.head_block) / 20 / 60) < 24 ? parseInt((parseInt(con.e.split(':')[0]) - this.head_block) / 20 / 60) + ' hours' : parseInt((parseInt(con.e.split(':')[0]) - this.head_block) / 20 / 60 / 24) + ' days'}`
        },
        cancel_contract(contract) {
            //if(this.account != contract.t)return
            const toSign = {
                type: "cja",
                cj: {
                    id: contract.i,
                },
                id: `spkccT_contract_close`,
                msg: `Canceling ${contract.i}...`,
                ops: ["getTokenUser", "getSapi", "refreshComponents"],
                api: "https://spktest.dlux.io",
                txid: "cancel_contract",
            }
            this.$emit('tosign', toSign)
        },
        isStored(cid) {
            var found = false
            for (var i in this.contractIDs[cid].n) {
                if (this.contractIDs[cid].n[i] == this.account) {
                    found = true
                    break
                }
            }
            return found
        },
        refreshContracts() {
            // Find the filesvue-dd component to get the current folder path
            const filesVueComponent = this.$refs.filesVue;
            let currentPath = '';
            
            // If we have the files component and it has a current folder path, save it
            if (filesVueComponent && filesVueComponent.currentFolderPath) {
                currentPath = filesVueComponent.currentFolderPath;
                console.log("Saving current folder path:", currentPath);
            }
            
            // Update URL hash to include the folder path
            if (currentPath) {
                // Format as #drive/FolderName
                const newHash = `#drive/${currentPath}`;
                history.replaceState(null, null, newHash);
                console.log("Updated URL hash to:", newHash);
            }
            
            // Don't clear data aggressively - let getSapi update incrementally
            console.log("Refreshing contracts data...");
            
            // Set a flag to restore path after refresh
            this.pathToRestore = currentPath;
            
            // Refresh contracts from API without clearing existing data
            this.getSapi();
        },
        handleRefreshDrive() {
            console.log('🔄 Refreshing SPK Drive data...');
            this.getSapi();
        },
        handleAddToPost(fileData) {
            // Emit the file data to the parent so it can be passed to the post component
            this.$emit('add-to-post', fileData);
        },
        
        handleFileSlot(slotType, fileData) {
            // Emit the file slot event with the slot type
            this.$emit(`set-${slotType}`, {
                hash: fileData.cid || fileData.hash,
                filename: fileData.filename || fileData.name || fileData.f,
                size: fileData.size || fileData.s,
                type: fileData.type || fileData.mime || 'application/octet-stream'
            });
        },
        handleUpdateContract(payload) {
            console.log('📥 Handling contract update:', payload);
            
            // Find the contract in our data
            const contractIndex = this.contracts.findIndex(c => c.i === payload.contractId);
            if (contractIndex !== -1) {
                // Update the contract's file count and size if available
                // The actual file data will be refreshed by filesvue-dd's init() call
                console.log('Contract found, data will be refreshed by child component');
            }
            
            // Don't trigger a full refresh here - the child component handles it
        },
    },
    watch: {
        'account'(newValue, o) {
            if (this.loaded == true) {
                if (!this.nodeview) {
                    this.contracts = []
                    this.contractIDs = {}
                }
                this.saccountapi = {
                    spk: 0,
                    balance: 0,
                    gov: 0,
                    poweredUp: 0,
                    claim: 0,
                    granted: {
                        t: 0
                    },
                    granting: {
                        t: 0
                    }
                },
                    this.getSpkStats()
            }
        },
        'toSign'(newValue) {
            if (newValue.type) {
                this.$emit('tosign', this.toSign)
                this.toSign = {}
            }
        },
        'prop_contracts'(newValue) {
            if (this.nodeview) {
                this.contracts = []
                this.contractIDs = {}
                const getContract = (id) => {
                    fetch('https://spktest.dlux.io/api/fileContract/' + id)
                        .then((r) => r.json())
                        .then((res) => {
                            if (res.result && typeof res.result === 'object') {
                                res.result.extend = "7"
                                this.handlePropContracts(res.result)
                            } else {
                                console.log('Contract not found or invalid:', id)
                            }
                        })
                        .catch(err => {
                            console.error('Error fetching contract:', err)
                        });
                }
                for (var node in this.prop_contracts) {
                    getContract(this.prop_contracts[node].i)
                }
            }
        }
    },
    computed: {
        hasFiles() {
            return Object.keys(this.files).length > 0;
        },
        red_light() {
            for(var i = 0; i < this.contracts.length; i++){
                if(this.contracts[i].c < 3)return true
            }
            return false
        },
    },
    mounted() {
        this.getSpkStats()
        this.getIPFSproviders()
        this.contracts = []
        this.contractIDs = {}
        const getContract = (id) => {
            fetch('https://spktest.dlux.io/api/fileContract/' + id)
                .then((r) => r.json())
                .then((res) => {
                    if (res.result && typeof res.result === 'object') {
                        res.result.extend = "7"
                        this.handlePropContracts(res.result)
                        //this.pcontracts.splice(this.contractIDs[id].index, 1, res.result)
                        //this.extendcost[id] = parseInt(res.result.extend / 30 * res.result.r)
                    } else {
                        console.log('Contract not found or invalid:', id)
                    }
                })
                .catch(err => {
                    console.error('Error fetching contract:', err)
                });
        }
        //var i = 0
        for (var node in this.prop_contracts) {
            // this.pcontracts.push(this.prop_contracts[node]);
            // this.pcontractIDs[this.prop_contracts[node].i] = this.prop_contracts[node];
            // this.pcontractIDs[this.prop_contracts[node].i].index = i
            // i++
            getContract(this.prop_contracts[node].i)
        }
        // Call deepLink when the component is mounted
        this.deepLink(location.hash);

        // Watch for hash changes and re-apply deep linking
        window.addEventListener('hashchange', () => {
            this.deepLink(location.hash);
        });
    },
};