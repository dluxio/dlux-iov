import common from './methods-common.js';
import spk from './methods-spk.js';
import ModalVue from '/js/modal-manager.js';
import ExtensionVue from '/js/extensionvue.js';
import PostVue from '/js/postvue.js';
import ChoicesVue from '/js/choices-vue.js';
import UploadVue from '/js/uploadvue.js';

export default {
  name: "ContractsModal",
  components: {
    'modal-vue': ModalVue,
    'extension-vue': ExtensionVue,
    'post-vue': PostVue,
    'choices-vue': ChoicesVue,
    'upload-vue': UploadVue
  },
  mixins: [common, spk],
  props: {
    contracts: {
      type: Array,
      default: () => []
    },
    account: {
      type: String,
      default: ''
    },
    saccountapi: {
      type: Object,
      default: () => ({})
    },
    protocol: {
      type: Object,
      default: () => ({})
    },
    stats: {
      type: Object,
      default: () => ({})
    },
    nodeview: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: ''
    },
    test: {
      type: Boolean,
      default: false
    },
    newMeta: {
      type: Object,
      default: () => ({})
    },
    links: {
      type: Object,
      default: () => ({})
    },
    postBodyAdder: {
      type: Object,
      default: () => ({})
    },
    postpage: {
      type: Boolean,
      default: false
    },
    spkapi: {
      type: Object,
      default: () => ({})
    },
    sstats: {
      type: Object,
      default: () => ({})
    },
    mypfp: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      sapi: 'https://spktest.dlux.io',
      contract: {
        api: '',
        id: '',
        files: '',
        fosig: '', //file-owner
        spsig: '', //service-provider 
        s: 10485760,
        t: 0
      },
      filter: {
        slots: true,
        size: 0,
        max: 0,
        min: 999999999999,
        step: 1,
      },
      localNewMeta: {},
      localLinks: {},
      localPostBodyAdder: {},
      state2contracts: [],
      test: true,
      tick: "1",
      toSign: {},
      larynxbehind: 999999,
      lbalance: 0,
      lbargov: 0,
      spkval: 0,
      loaded: false,
      contractIDs: {},
      ipfsProviders: {},
      spread: false,
      extendcost: 0
    };
  },
  created() {
    this.localNewMeta = this.newMeta || {};
    this.localLinks = this.links || {};
    this.localPostBodyAdder = this.postBodyAdder || {};
  },
  watch: {
    newMeta: {
      handler(newVal) {
        this.localNewMeta = newVal || {};
      },
      immediate: true
    },
    links: {
      handler(newVal) {
        this.localLinks = newVal || {};
      },
      immediate: true
    },
    postBodyAdder: {
      handler(newVal) {
        this.localPostBodyAdder = newVal || {};
      },
      immediate: true
    }
  },
  mounted() {
    this.getIPFSproviders();
  },
  template: `
<div class="card-body p-0">
    <!-- registered -->
    <div v-if="saccountapi.pubKey != 'NA'">
        <div class="row row-cols-1 row-cols-lg-2 row-cols-xl-4">
            <!-- BROCA token widget -->
            <div class="order-lg-3 order-xl-0 mb-3 col spk-widg">
                <div class="card-header d-flex align-items-center border-bottom border-1 px-2 py-1 fs-4"><i
                        class="fa-solid fa-atom me-1"></i><span>BROCA Token</span></div>
                <div class="card-body px-2 py-1">
                    <div class="d-flex flex-column">
                        <div class="mb-1 fw-light d-flex justify-content-center" style="font-size: 1.1rem !important;">
                            {{formatNumber((saccountapi.spk/1000),'3','.',',')}} BROCA</div>
                        <div class="d-flex justify-content-center mt-1">
                            <!-- spk wallet button -->
                            <button v-if="!nodeview" type="button"
                                class="btn btn-sm btn-dark border-secondary text-secondary d-flex justify-content-center me-1"
                                data-bs-toggle="modal" data-bs-target="#spkWalletModal" style="width:110px;">
                                <i class="fa-solid fa-wallet fa-fw me-1 my-auto"></i>
                                <span class="my-auto">Wallet</span>
                                <span class="badge small text-bg-light text-black ms-1 mb-auto"
                                    style="font-size: 0.5em;">Test</span>
                            </button>
                            <modal-vue v-if="protocol?.head_block && saccountapi?.head_block" func="powup"
                                :mypfp="mypfp" token="liq_broca" :tokenuser="saccountapi" :account="account"
                                :tokenprotocol="protocol" @tosign="sendIt($event)">
                                <template v-slot:trigger>
                                    <button class="btn btn-sm btn-dark border-warning text-warning trigger ms-1"
                                        type="button" style="width:110px;"><i
                                            class="fa-solid fa-bolt fa-fw me-1"></i>Power Up</button>
                                </template>
                            </modal-vue>
                        </div>
                    </div>
                </div>
            </div>
            <!-- BROCA power widget -->
            <div class="order-lg-0 order-xl-1 mb-3 col spk-widg">
                <div class="card-header d-flex align-items-center border-bottom border-1 px-2 py-1 fs-4"><i
                        class="fa-solid fa-bolt me-1"></i>
                    <span class="d-flex align-items-center">BROCA Power</span>
                </div>
                <div class="d-flex flex-column card-body px-2 py-1">
                    <div class="mb-1 fw-light text-center " style="font-size: 1.1rem !important;">
                        {{formatNumber(saccountapi.spk_power/1000,'3','.',',')}} BROCA Power</div>
                    <div class="progress mb-1 is-danger" role="progressbar" aria-label="Basic example"
                        aria-valuenow="75" aria-valuemin="0" aria-valuemax="100">
                        <div class="progress-bar"
                            :style="{'width':  saccountapi.spk_power ? (broca_calc(saccountapi.broca)/(saccountapi.spk_power*1000))*100 + '%' : '0%' }">
                            {{
                            formatNumber((broca_calc(saccountapi.broca)/(saccountapi.spk_power*1000))*100,'2','.',',')
                            }}%</div>
                    </div>
                    <a href="#" data-bs-toggle="modal" data-bs-target="#buyTokenModal"
                        class="d-none text-center text-primary">Get more power</a>
                </div>
            </div>
            <!-- storage widget -->
            <div class="order-lg-1 order-xl-3 mb-3 col spk-widg">
                <div class="card-header d-flex align-items-center border-bottom border-1 px-2 py-1 fs-4"><i
                        class="fa-solid fa-chart-pie me-1"></i><span>Storage</span></div>
                <div class="d-flex flex-column card-body px-2 py-1">
                    <div class="mb-1 fw-light text-center" style="font-size: 1.1rem !important;" v-if="saccountapi">
                        {{fancyBytes(usedBytes)}} of {{fancyBytes(availableBytes)}} used</div>
                    <div class="progress mb-1" role="progressbar" aria-label="Basic example" aria-valuenow="75"
                        aria-valuemin="0" aria-valuemax="100">
                        <div class="progress-bar"
                            :style="'width:' + (usedBytes && availableBytes ? (usedBytes/availableBytes)*100 : 0) + '%;'">
                            {{formatNumber((usedBytes && availableBytes ? (usedBytes/availableBytes)*100 :
                            0),'2','.',',')}}%</div>
                    </div>
                    <a href="#" data-bs-toggle="modal" data-bs-target="#buyTokenModal"
                        class="d-none text-center text-primary">Get more storage</a>
                </div>
            </div>
            <!-- contract widget -->
            <div class="order-lg-3 order-xl-4 mb-3 col spk-widg">
                <div class="card-header d-flex align-items-center border-bottom border-1 px-2 py-1 fs-4"><i
                        class="fa-solid fa-cloud-arrow-up me-1"></i><span>Contract</span></div>
                <div class="card-body px-2 py-1">
                    <div class="d-flex flex-column">
                        <div class="mb-1 fw-light text-center" style="font-size: 1.1rem !important;">Pin your files on
                            IPFS</div>
                        <div class="d-flex justify-content-center mt-1">
                            <!-- new contract button -->
                            <button v-if="saccountapi.pubKey != 'NA' && saccountapi.spk_power" type="button"
                                class="btn btn-sm btn-dark border-info text-info me-1" style="width:110px;">
                                <modal-vue v-if="protocol?.head_block && saccountapi?.head_block" type="contract"
                                    :api="sapi" :mypfp="mypfp" token="broca" :test="test" :tokenstats="stats"
                                    :tokenprotocol="protocol" :tokenuser="saccountapi" :account="account"
                                    @tosign="sendIt($event)">
                                    <template v-slot:trigger>
                                        <span class="trigger"><i
                                                class="fa-solid fa-file-contract fa-fw me-1"></i>NEW</span>
                                    </template>
                                </modal-vue>
                            </button>
                            <!-- free button -->
                            <button v-if="saccountapi.pubKey != 'NA'" type="button"
                                class="btn btn-sm btn-dark border-success text-success ms-1" data-bs-toggle="modal"
                                data-bs-target="#sponsoredModal" style="width:110px;">
                                <span class=""></span><i class="fa-solid fa-wand-magic-sparkles fa-fw me-1"></i>FREE
                            </button>
                            <!-- register -->
                            <button v-if="saccountapi.pubKey == 'NA'" type="button"
                                class="btn btn-sm btn-dark border-info text-info" @click="updatePubkey()"
                                style="width:110px;">
                                <span class=""></span><i class="fa-solid fa-user-plus fa-fw me-1"></i>Register
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="mx-1">
                        <!-- Broca Features -->
                        <div class="card-group mb-3 rounded">
                            <div class="card bg-img-none text-center">
                                <div class="card-header bg-info-50 text-dark">
                                    <h3 class="card-title mb-0">Storage Rate</h3>
                                </div>
                                <div class="card-body">
                                    <div class="d-flex align-items-center mb-2 justify-content-center">
                                        <h5 class="mb-0 card-title text-info">
                                            {{fancyBytes((1000000 *
                            1024) * (864000/144000))}}
                                        </h5>
                                        <h5 class="mb-0 mx-1 card-title text-info">/</h5>
                                        <p class="mb-0 me-1 lead text-warning">1 BROCA</p>
                                        <div class="d-flex align-items-center text-warning">
                                            <span
                                                class="badge badge-type-append bg-warning text-dark d-flex align-items-center justify-content-center rounded-circle">
                                                <i class="fa-solid fa-bolt-lightning"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <p class="card-text text-white-50">Current SPK Network IPFS Pinning Service size per
                                        one BROCA Power
                                    </p>
                                </div>
                                <div class="card-footer bg-card">
                                    <small class="text-body-secondary">Pinned for 30 Days</small>
                                </div>
                            </div>
                            <div class="card bg-img-none text-center">
                                <div class="card-header bg-info-50 text-dark">
                                    <h3 class="card-title mb-0">Upload Limit</h3>
                                </div>
                                <div class="card-body">
                                    <h5 class="card-title text-info">
                                        {{fancyBytes((Number(broca_calc(saccountapi.broca)) || 0) *
                        1024)}}
                                    </h5>
                                    <p class="card-text text-white-50">Your available storage based on your current
                                        BROCA Power
                                        resources</p>
                                </div>
                                <div class="card-footer bg-card">
                                    <small class="text-body-secondary">Regenerates Every 5 Days</small>
                                </div>
                            </div>
                            <div class="card bg-img-none text-center">
                                <div class="card-header bg-info-50 text-dark">
                                    <h3 class="card-title mb-0">Drive Size</h3>
                                </div>
                                <div class="card-body">
                                    <h5 class="card-title text-info">
                                        ~{{(fancyBytes((Number(broca_calc(saccountapi.broca)) || 0) *
                        6000))}}
                                    </h5>
                                    <p class="card-text text-white-50">Your perpetual storage when files are set to
                                        autorenew at current
                                        network rates</p>
                                </div>
                                <div class="card-footer bg-card">
                                    <small class="text-body-secondary">Rolling Storage Over 30 Days</small>
                                </div>
                            </div>
                        </div>
                    </div>
        <!-- no contracts -->
        <div v-show="!contracts.length">
            <div class="ms-auto me-auto d-flex justify-content-center">
                <div class="card mx-1 px-3 py-2 mt-3 mb-4 bg-darker" style="max-width: 600px">
                    <h2 class="fw-light mt-1">No contracts found</h2>
                    <p class="lead mb-1" v-if="nodeview && title == 'stored'">The TROLE API service can take up to 10
                        minutes to update data</p>
                    <p class="lead mb-1" v-show="saccountapi.spk_power" v-if="!nodeview || title == 'new'">Click <a
                            class="btn btn-sm btn-dark border-info text-info no-decoration small"
                            style="font-size: 0.6em; width: 72px;" role="button" data-bs-toggle="modal"
                            data-bs-target="#contractModal">
                            <modal-vue v-if="protocol?.head_block && saccountapi?.head_block" type="contract"
                                :api="sapi" :mypfp="mypfp" token="balance" :test="test" :tokenstats="stats"
                                :tokenprotocol="protocol" :tokenuser="saccountapi" :account="account"
                                @tosign="sendIt($event)">
                                <template v-slot:trigger>
                                    <span class="trigger"><i class="fa-solid fa-file-contract fa-fw me-1"></i>NEW</span>
                                </template>
                            </modal-vue></a>
                        to create a contract using SPK Power
                    </p>
                    <p class="lead mb-1" v-if="!nodeview">
                        Click <a class="btn btn-sm btn-dark border-success text-success no-decoration small"
                            style="font-size: 0.6em; width:72px;" role="button" data-bs-toggle="modal"
                            data-bs-target="#sponsoredModal"><i
                                class="fa-solid fa-wand-magic-sparkles fa-fw me-1"></i>FREE</a>
                        to select a sponsored contract
                    </p>
                </div>
            </div>
        </div>
        <!-- contracts -->
        <div v-show="contracts.length" class="table-responsive">
            <!-- no contracts -->
            <div v-show="!contracts.length">
                <div class="ms-auto me-auto d-flex justify-content-center">
                    <div class="card mx-1 px-3 py-2 mt-3 mb-4 bg-darker" style="max-width: 600px">
                        <h2 class="fw-light mt-1">No contracts found</h2>
                        <p class="lead mb-1" v-if="nodeview && title == 'stored'">The TROLE API service can take up to
                            10 minutes to update data</p>
                        <p class="lead mb-1" v-show="saccountapi.spk_power" v-if="!nodeview || title == 'new'">Click <a
                                class="btn btn-sm btn-dark border-info text-info no-decoration small"
                                style="font-size: 0.6em; width: 72px;" role="button" data-bs-toggle="modal"
                                data-bs-target="#contractModal">
                                <modal-vue v-if="protocol?.head_block && saccountapi?.head_block" type="contract"
                                    :api="sapi" :mypfp="mypfp" token="balance" :test="test" :tokenstats="stats"
                                    :tokenprotocol="protocol" :tokenuser="saccountapi" :account="account"
                                    @tosign="sendIt($event)">
                                    <template v-slot:trigger>
                                        <span class="trigger"><i
                                                class="fa-solid fa-file-contract fa-fw me-1"></i>NEW</span>
                                    </template>
                                </modal-vue></a>
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
            <div class="d-none">
                <div class="d-flex justify-content-center mt-1">
                    <!-- new contract button -->
                    <button v-if="saccountapi.pubKey != 'NA' && saccountapi.spk_power" type="button"
                        class="btn btn-sm btn-dark border-info text-info me-1" style="width:110px;">
                        <modal-vue v-if="protocol?.head_block && saccountapi?.head_block" type="contract" :api="sapi"
                            :mypfp="mypfp" token="balance" :test="test" :tokenstats="stats" :tokenprotocol="protocol"
                            :tokenuser="spkapi" :account="account" @tosign="sendIt($event)">
                            <template v-slot:trigger>
                                <span class="trigger"><i class="fa-solid fa-file-contract fa-fw me-1"></i>NEW</span>
                            </template>
                        </modal-vue>
                    </button>
                    <!-- free button -->
                    <button v-if="saccountapi.pubKey != 'NA'" type="button"
                        class="btn btn-sm btn-dark border-success text-success ms-1" data-bs-toggle="modal"
                        data-bs-target="#sponsoredModal" style="width:110px;">
                        <span class=""></span><i class="fa-solid fa-wand-magic-sparkles fa-fw me-1"></i>FREE
                    </button>
                    <!-- register -->
                    <button v-if="saccountapi.pubKey == 'NA'" type="button"
                        class="btn btn-sm btn-dark border-info text-info" @click="updatePubkey()" style="width:110px;">
                        <span class=""></span><i class="fa-solid fa-user-plus fa-fw me-1"></i>Register
                    </button>
                </div>
            </div>
            <!-- contracts -->
            <div v-show="contracts.length" class="table-responsive">
                <table class="table table-hover text-center align-middle mb-0" id="files-table">
                    <thead>
                        <tr>
                            <!-- storage -->
                            <th scope="col">
                                <div class="d-flex flex-wrap align-items-center justify-content-center">
                                    <div class="d-flex flex-wrap align-items-center justify-content-center">
                                        <i class="fa-solid fa-database fa-fw"></i>
                                        <span class="m-1">Storage</span>
                                    </div>
                                    <div class="d-flex align-items-center">
                                        <button class="btn btn-sm btn-secondary" @click="sortContracts('a','asc')"><i
                                                class="fa-solid fa-caret-up"></i></button>
                                        <button class="btn btn-sm btn-secondary ms-1"
                                            @click="sortContracts('a','dec')"><i
                                                class="fa-solid fa-caret-down"></i></button>
                                    </div>
                                </div>
                            </th>


                            <!-- status -->
                            <th scope="col">
                                <div class="d-flex flex-wrap align-items-center justify-content-center">
                                    <div class="d-flex flex-wrap align-items-center justify-content-center">
                                        <i class="fa-solid fa-signal fa-fw"></i>
                                        <span class="m-1">Status</span>
                                    </div>
                                    <div class="d-flex align-items-center">
                                        <button class="btn btn-sm btn-secondary ms-1"
                                            @click="sortContracts('c','asc')"><i
                                                class="fa-solid fa-caret-up"></i></button>
                                        <button class="btn btn-sm btn-secondary ms-1"
                                            @click="sortContracts('c','dec')"><i
                                                class="fa-solid fa-caret-down"></i></button>
                                    </div>
                                </div>
                            </th>

                            <!-- expires -->
                            <th scope="col">
                                <div class="d-flex flex-wrap align-items-center justify-content-center">
                                    <div class="d-flex flex-wrap align-items-center justify-content-center">
                                        <i class="fa-solid fa-clock fa-fw"></i>
                                        <span class="m-1">Expires</span>
                                    </div>
                                    <div class="d-flex align-items-center">
                                        <button class="btn btn-sm btn-secondary" @click="sortContracts('e','dec')"><i
                                                class="fa-solid fa-caret-up"></i></button>
                                        <button class="btn btn-sm btn-secondary ms-1"
                                            @click="sortContracts('e','asc')"><i
                                                class="fa-solid fa-caret-down"></i></button>
                                    </div>
                                </div>
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr v-for="contract in contracts" class="text-start">
                            <td colspan="4" class="p-0">
                                <div class="table-responsive">
                                    <table class="table text-white align-middle mb-0">
                                        <tbody class="border-0">

                                            <tr class="border-0">

                                                <!-- storage -->
                                                <th class="border-0 p-0">

                                                    <div class="d-flex align-items-center">

                                                        <!-- new available contracts -->
                                                        <div v-if="nodeview && title == 'new'">
                                                            <button type="button" @click="contract.sm = !contract.sm"
                                                                class="btn btn-sm d-flex align-items-center ms-2 fs-6 fw-bold py-2"
                                                                :class="{'btn-outline-light': !contract.sm, 'btn-primary': contract.sm}">
                                                                <i class="fa-solid fa-file fa-fw"></i>
                                                                <span v-if="!contract.sm"
                                                                    class="ms-1 d-none d-lg-block">Available</span>
                                                                <span v-if="contract.sm"
                                                                    class="ms-1 d-none d-lg-block">Selected</span>
                                                            </button>
                                                        </div>

                                                        <div class="d-flex align-items-center flex-grow-1 click-me p-2"
                                                            data-bs-toggle="collapse" :href="'#' + replace(contract.i)"
                                                            aria-expanded="false" aria-controls="collapseExample">

                                                            <!-- stored contracts -->
                                                            <div v-if="nodeview && title == 'stored'"
                                                                class="d-flex align-items-center border border-1 border-success text-success rounded p-05 me-2">
                                                                <i class="fa-solid fa-file fa-fw"></i><span
                                                                    class="mx-1 d-none d-lg-block">Stored</span>
                                                            </div>

                                                            <!-- my contracts -->
                                                            <div v-if="!nodeview"
                                                                class="border border-1 border-light text-light rounded p-05 me-2">
                                                                <i class="fa-solid fa-file fa-fw"></i>
                                                            </div>

                                                            {{contract.c > 1 ? fancyBytes(contract.u) :
                                                            fancyBytes(contract.a)}}

                                                        </div>
                                                    </div>

                                                </th>

                                                <!-- status -->
                                                <td class="border-0 click-me" data-bs-toggle="collapse"
                                                    :href="'#' + replace(contract.i)" aria-expanded="false"
                                                    aria-controls="collapseExample">
                                                    <div class="d-flex align-items-center">

                                                        <!-- upload btn -->
                                                        <div v-if="contract.c == 1"
                                                            class="border border-1 border-success text-success rounded p-05 me-2">
                                                            <i class="fa-solid fa-file-upload fa-fw"></i>
                                                        </div>

                                                        <!-- post btn -->
                                                        <div v-if="contract.c == 2"
                                                            class="border border-1 border-warning text-warning rounded p-05 me-2">
                                                            <i class="fa-solid fa-hand-holding-dollar fa-fw"></i>
                                                        </div>

                                                        <!-- extend btn -->
                                                        <div v-if="contract.c == 3"
                                                            class="border border-1 border-primary text-primary rounded p-05 me-2">
                                                            <i class="fa-solid fa-clock-rotate-left fa-fw"></i>
                                                        </div>



                                                        <!-- message -->
                                                        <div v-if="contract.c == 1">
                                                            <span class="d-lg-none">Upload</span>
                                                            <span class="d-none d-lg-flex">Ready for
                                                                upload</span>
                                                        </div>
                                                        <div v-if="contract.c == 2 && !nodeview">
                                                            <span class="d-lg-none">Post</span>
                                                            <span class="d-none d-lg-flex">Post
                                                                {{split(contract.s, ',', 1)/100}}% to
                                                                @{{split(contract.s, ',', 0)}}</span>
                                                        </div>
                                                        <div v-if="contract.c == 2 && nodeview">
                                                            <span class="d-lg-none">Extend</span>
                                                            <span class="d-none d-lg-flex align-items-center">
                                                                {{contract.nt}} /
                                                                {{contract.p}} <i
                                                                    class="fa-solid fa-tower-broadcast mx-1 fa-fw"></i>
                                                                nodes </span>
                                                        </div>
                                                        <div v-if="contract.c == 3">
                                                            <span class="d-lg-none">Extend</span>
                                                            <span class="d-none d-lg-flex align-items-center">
                                                                {{contract.nt}} /
                                                                {{contract.p}} <i
                                                                    class="fa-solid fa-tower-broadcast mx-1 fa-fw"></i>
                                                                nodes </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                <!-- expires -->
                                                <td class="border-0 click-me" data-bs-toggle="collapse"
                                                    :href="'#' + replace(contract.i)" aria-expanded="false"
                                                    aria-controls="collapseExample">
                                                    <div class="d-flex align-items-center">
                                                        <div
                                                            class="border border-1 border-light text-light rounded p-05 me-2">
                                                            <i class="fa-solid fa-circle-info fa-fw"></i>
                                                        </div>

                                                        <span v-if="contract.c">
                                                            {{exp_to_time(contract.e)}}
                                                        </span>

                                                    </div>
                                                </td>
                                            </tr>

                                            <!-- collapse region -->

                                            <!-- detail view -->
                                            <tr class="collapse" :id="replace(contract.i)">
                                                <td class="border-0 px-0 px-md-1" colspan="4">
                                                    <div class="d-flex flex-column border border-white rounded text-start py-2"
                                                        style="background-color:rgba(0,0,0,0.3);">
                                                        <div class="mx-1 mx-xl-5 p-sm-1 p-lg-2">

                                                            <!-- contract ID -->
                                                            <div
                                                                class="d-flex justify-content-center small text-white-50 mb-3">
                                                                <div class="text-center"> Contract ID <i
                                                                        class="fa-solid fa-file-contract fa-fw mx-1"
                                                                        aria-hidden="true"></i><span
                                                                        class="text-break">{{contract.i}}</span>
                                                                </div>
                                                            </div>

                                                            <!-- node storage -->
                                                            <div class="mb-3" v-if="contract.c == 2">
                                                                <div
                                                                    class="alert alert-warning d-flex align-items-center">
                                                                    <div
                                                                        class="d-flex flex-grow-1 flex-wrap me-1 align-items-center mx-1">
                                                                        <div class="fs-3 fw-lighter">
                                                                            <i
                                                                                class="d-none fa-solid fa-triangle-exclamation fa-fw"></i>
                                                                            <span class="mx-1">Pending contract</span>
                                                                            <span v-if="contract.i.isStored">is being
                                                                                stored</span>
                                                                            <span v-if="!contract.i.isStored">is
                                                                                available to store</span>
                                                                        </div>
                                                                        <div
                                                                            class="ms-auto d-flex flex-wrap align-items-center justify-content-center mb-1">
                                                                            <button type="button"
                                                                                class="flex-grow-1 btn btn-warning ms-1 mt-1"
                                                                                @click="">
                                                                                <i
                                                                                    class="fa-solid fa-flag fa-fw me-1"></i>Flag
                                                                            </button>
                                                                            <button type="button"
                                                                                @click="store(contract.i, isStored, hasStorage)"
                                                                                class="flex-grow-1 ms-1 mt-1 btn text-nowrap"
                                                                                :class="{'btn-success': !contract.i.isStored, 'btn-danger': contract.i.isStored}">
                                                                                <span v-if="!contract.i.isStored"><i
                                                                                        class="fa-solid fa-square-plus fa-fw me-1"></i>Add</span>
                                                                                <span v-if="contract.i.isStored"><i
                                                                                        class="fa-solid fa-trash-can fa-fw me-1"></i>Remove</span>
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>



                                                            <!-- upload time banner -->
                                                            <div v-if="contract.c == 1" class="mb-3">
                                                                <div
                                                                    class="alert alert-warning d-flex align-items-center">
                                                                    <div
                                                                        class="d-flex flex-grow-1 flex-wrap me-1 align-items-center">
                                                                        <div class="mx-1">
                                                                            <div class="fs-3 fw-lighter">You have
                                                                                {{exp_to_time(contract.e)}} to start
                                                                                this contract</div>
                                                                        </div>
                                                                    </div>
                                                                    <div
                                                                        class="ms-auto d-flex flex-wrap align-items-center fs-1 text-warning justify-content-center me-2 mx-1">
                                                                        <i class="fa-solid fa-bell fa-fw ms-2"></i>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <!-- post time banner -->
                                                            <div v-if="contract.c == 2" class="mb-3">
                                                                <div v-if="!nodeview"
                                                                    class="alert alert-warning d-flex align-items-center">
                                                                    <div
                                                                        class="d-flex flex-grow-1 flex-wrap me-1 align-items-center mx-1">
                                                                        <div class="fs-3 fw-lighter">You have
                                                                            {{exp_to_time(contract.e)}} to publish this
                                                                            contract</div>
                                                                        <div
                                                                            class="ms-auto d-flex flex-wrap align-items-center fs-1 text-warning justify-content-center me-2 mx-1">
                                                                            <i class="fa-solid fa-bell fa-fw ms-2"></i>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>



                                                            <!-- post -->
                                                            <div v-if="spkapi.name == contract.t && !postpage && contract.c == 2"
                                                                class="mb-3 rounded"
                                                                style="background-color:rgba(0,0,0,0.3)">
                                                                <div class="d-flex flex-column">
                                                                    <div>
                                                                        <div class="mx-auto ms-md-1 mt-2 lead fs-2">Post
                                                                            Details</div>
                                                                    </div>
                                                                    <div class="bg-dark px-1 py-2 p-lg-3 mt-2 rounded">
                                                                        <post-vue :account="account"
                                                                            :prop_bens="[contract.s]"
                                                                            :prop_uid="contract.i"
                                                                            :prop_links="localLinks[contract.i]"
                                                                            :prop_insert="localPostBodyAdder[contract.i]"
                                                                            @tosign="sendIt($event)" />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <!-- upload -->
                                                            <div v-if="contract.c == 1" class="mx-1">
                                                                <upload-vue :user="saccountapi" :propcontract="contract"
                                                                    @tosign="sendIt($event)" @done="done()" />
                                                            </div>





                                                            <!-- files list -->
                                                            <div v-if="contract.c > 1">

                                                                <div class="mx-1" v-if="contract.c > 2">
                                                                    <div
                                                                        class="gradient-border bg-dark mb-3 p-sm-1 p-lg-2">
                                                                        <div
                                                                            class="d-flex flex-wrap justify-content-around justify-content-md-between mx-1 mx-md-2 pt-1 pt-md-2">
                                                                            <div class="fs-1 fw-bold align-items-start">
                                                                                SPK Network</div>
                                                                            <div class="input-group-text">
                                                                                <div class="form-check form-switch fs-5"
                                                                                    :class="{'is-danger': !saccountapi.spk}">
                                                                                    <input class="form-check-input"
                                                                                        type="checkbox" checked=""
                                                                                        role="switch"
                                                                                        :id="contract.i + 'autoRenew'"
                                                                                        v-model="localNewMeta[contract.i].contract.autoRenew"
                                                                                        :class="{'disabled': contract.t != account}"
                                                                                        :disabled="contract.t != account">
                                                                                    <label
                                                                                        class="form-check-label ms-auto"
                                                                                        :class="{'text-danger': !saccountapi.spk}"
                                                                                        :for="contract.i + 'autoRenew'">Auto-Renew</label>
                                                                                </div>
                                                                            </div>

                                                                        </div>

                                                                        <!-- extension -->
                                                                        <div v-if="contract.c == 3">
                                                                            <extension-vue :node-view="nodeview"
                                                                                :contract="contract" :sstats="sstats"
                                                                                :account="account"
                                                                                :saccountapi="saccountapi"
                                                                                :spkapi="spkapi"
                                                                                @tosign="sendIt($event)">
                                                                            </extension-vue>
                                                                        </div>

                                                                        <!-- save button -->
                                                                        <div class="d-flex text-center">
                                                                            <button
                                                                                v-if="contract.c > 1 && metaMismatch(contract.i) && !localNewMeta[contract.i].contract.encrypted"
                                                                                class="btn btn-lg btn-outline-warning mx-auto my-2"
                                                                                type="button"
                                                                                @click="update_meta(contract.i)">
                                                                                <i
                                                                                    class="fa-solid fa-floppy-disk fa-fw me-2"></i>Save
                                                                                Metadata
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div class="mb-3 p-sm-1 p-lg-2 rounded"
                                                                    style="background-color:rgba(0,0,0,0.3)">
                                                                    <div class="d-flex flex-column">
                                                                        <div>
                                                                            <div class="mx-auto ms-md-1 mt-2 lead fs-2">
                                                                                {{pluralFiles(contract.i)}}
                                                                                File{{pluralFiles(contract.i) > 1 ? 's'
                                                                                : ''}}</div>
                                                                        </div>


                                                                        <div v-for="(size, cid, index) in contract.df">
                                                                            <div v-if="!localNewMeta[contract.i][cid].is_thumb"
                                                                                class="mt-2 rounded card p-2">

                                                                                <div class="row align-items-center">

                                                                                    <div class="col-md-4">
                                                                                        <div
                                                                                            class="d-flex flex-column justify-content-center">


                                                                                            <img v-if="localNewMeta[contract.i][cid].thumb && isValidThumb(localNewMeta[contract.i][cid].thumb_data)"
                                                                                                class="mx-auto img-fluid rounded bg-light"
                                                                                                :src="localNewMeta[contract.i][cid].thumb_data"
                                                                                                width="314px">
                                                                                            <div v-else
                                                                                                class="bg-light rounded">
                                                                                                <svg version="1.1"
                                                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                                                    xmlns:xlink="http://www.w3.org/1999/xlink"
                                                                                                    x="0px" y="0px"
                                                                                                    viewBox="0 0 800 800"
                                                                                                    style="enable-background:new 0 0 800 800;"
                                                                                                    xml:space="preserve">

                                                                                                    <g>
                                                                                                        <path
                                                                                                            class="st0"
                                                                                                            d="M650,210H500c-5.5,0-10-4.5-10-10V50c0-5.5,4.5-10,10-10s10,4.5,10,10v140h140c5.5,0,10,4.5,10,10
                                                                                                      S655.5,210,650,210z" />
                                                                                                        <path
                                                                                                            class="st0"
                                                                                                            d="M650,309.7c-5.5,0-10-4.5-10-10v-95.5L495.9,60H200c-22.1,0-40,17.9-40,40v196.3c0,5.5-4.5,10-10,10
                                                                                                      s-10-4.5-10-10V100c0-33.1,26.9-60,60-60h300c2.7,0,5.2,1,7.1,2.9l150,150c1.9,1.9,2.9,4.4,2.9,7.1v99.7
                                                                                                      C660,305.2,655.5,309.7,650,309.7z" />
                                                                                                        <path
                                                                                                            class="st0"
                                                                                                            d="M600,760H200c-33.1,0-60-26.9-60-60V550c0-5.5,4.5-10,10-10s10,4.5,10,10v150c0,22.1,17.9,40,40,40h400
                                                                                                      c22.1,0,40-17.9,40-40V550c0-5.5,4.5-10,10-10s10,4.5,10,10v150C660,733.1,633.1,760,600,760z" />
                                                                                                        <path
                                                                                                            class="st0"
                                                                                                            d="M550,560H250c-5.5,0-10-4.5-10-10s4.5-10,10-10h300c5.5,0,10,4.5,10,10S555.5,560,550,560z" />
                                                                                                        <path
                                                                                                            class="st0"
                                                                                                            d="M400,660H250c-5.5,0-10-4.5-10-10s4.5-10,10-10h150c5.5,0,10,4.5,10,10S405.5,660,400,660z" />
                                                                                                        <path
                                                                                                            class="st0"
                                                                                                            d="M650,560H150c-33.1,0-60-26.9-60-60l0,0V346.3c0-33.1,26.9-60,60-60l0,0h0.4l500,3.3
                                                                                                      c32.9,0.3,59.5,27.1,59.6,60V500C710,533.1,683.2,560,650,560C650,560,650,560,650,560z M150,306.3c-22.1,0-40,17.9-40,40V500
                                                                                                      c0,22.1,17.9,40,40,40h500c22.1,0,40-17.9,40-40V349.7c-0.1-22-17.8-39.8-39.8-40l-500-3.3H150z" />
                                                                                                        <text
                                                                                                            transform="matrix(1 0 0 1 233.3494 471.9725)"
                                                                                                            class="st1 st2"
                                                                                                            style="text-transform: uppercase; font-size: 149px;">{{localNewMeta[contract.i][cid].type}}</text>
                                                                                                    </g>
                                                                                                </svg>
                                                                                            </div>

                                                                                            <span
                                                                                                class="small text-center mb-2">{{fancyBytes(size)}}</span>

                                                                                            <!-- link -->
                                                                                            <div
                                                                                                v-if="!localNewMeta[contract.i][cid].encrypted">
                                                                                                <a :href="'https://ipfs.dlux.io/ipfs/' + cid"
                                                                                                    target="_blank"
                                                                                                    class="w-100 btn btn-sm btn-primary mb-1 mx-auto"><span
                                                                                                        class="d-flex align-items-center">URL<i
                                                                                                            class="ms-auto fa-solid fa-fw fa-up-right-from-square"></i></span></a>
                                                                                            </div>
                                                                                            <!-- download  -->
                                                                                            <div class="d-none"
                                                                                                v-if="!localNewMeta[contract.i][cid].encrypted">
                                                                                                <button type="button"
                                                                                                    class="w-100 btn btn-sm btn-primary mb-1 mx-auto"
                                                                                                    @click="downloadFile(cid, contract.i, index)"><span
                                                                                                        class="d-flex align-items-center w-100">Download<i
                                                                                                            class="fa-solid fa-download fa-fw ms-auto"></i></span></button>
                                                                                            </div>
                                                                                            <!-- decrypt  -->
                                                                                            <div
                                                                                                v-if="localNewMeta[contract.i][cid].encrypted && !contract.encryption.key">
                                                                                                <button type="button"
                                                                                                    class="w-100 btn btn-sm btn-primary mb-1 mx-auto"
                                                                                                    @click="decryptKey(contract.i)"><span
                                                                                                        class="d-flex align-items-center w-100">Decrypt<i
                                                                                                            class="fa-solid fa-fw ms-auto fa-lock-open"></i></span></button>
                                                                                            </div>
                                                                                            <!-- download enc -->
                                                                                            <div
                                                                                                v-if="localNewMeta[contract.i][cid].encrypted && contract.encryption.key">
                                                                                                <button type="button"
                                                                                                    class="w-100 btn btn-sm btn-primary mb-1 mx-auto"
                                                                                                    @click="downloadFile(cid, contract.i, index)"><span
                                                                                                        class="d-flex align-items-center w-100">Download<i
                                                                                                            class="fa-solid fa-download fa-fw ms-auto"></i></span></button>
                                                                                            </div>
                                                                                            <!-- add to post -->
                                                                                            <div
                                                                                                v-if="contract.c == 2 && !nodeview">
                                                                                                <button type="button"
                                                                                                    class="w-100 btn btn-sm btn-purp mb-1 mx-auto"
                                                                                                    @click="addToPost(cid, contract.i)"><span
                                                                                                        class="d-flex align-items-center w-100">Add
                                                                                                        to Post<i
                                                                                                            class="fa-solid fa-plus fa-fw ms-auto"></i></span></button>
                                                                                            </div>




                                                                                        </div>
                                                                                    </div>

                                                                                    <div class="col-md-8">

                                                                                        <div class="mb-1">
                                                                                            <label class="mb-1">File
                                                                                                Name</label>
                                                                                            <div class="input-group">
                                                                                                <input
                                                                                                    autocapitalize="off"
                                                                                                    v-model="localNewMeta[contract.i][cid].name"
                                                                                                    placeholder="File Name"
                                                                                                    pattern="[a-zA-Z0-9]{3,25}"
                                                                                                    class="form-control bg-dark border-0"
                                                                                                    :class="{'text-info': contract.t == account, 'text-white': contract.t != account}"
                                                                                                    :disabled="contract.t != account">
                                                                                                <span
                                                                                                    class="input-group-text bg-dark border-0">.</span>
                                                                                                <input
                                                                                                    autocapitalize="off"
                                                                                                    v-model="localNewMeta[contract.i][cid].type"
                                                                                                    placeholder="File Type"
                                                                                                    pattern="[a-zA-Z0-9]{1,4}"
                                                                                                    class="form-control bg-dark border-0"
                                                                                                    :class="{'text-info': contract.t == account, 'text-white': contract.t != account}"
                                                                                                    :disabled="contract.t != account">
                                                                                            </div>
                                                                                        </div>
                                                                                        <div class="mb-1">
                                                                                            <label
                                                                                                class="mb-1">Thumbnail</label>
                                                                                            <div
                                                                                                class="position-relative has-validation">
                                                                                                <input
                                                                                                    autocapitalize="off"
                                                                                                    v-model="localNewMeta[contract.i][cid].thumb"
                                                                                                    @change="getImgData(contract.i, cid)"
                                                                                                    placeholder="https://your-thumbnail-image.png"
                                                                                                    pattern="(https:\/\/[a-z0-9.-\/]+)|(Qm[a-zA-Z0-9]+)"
                                                                                                    class="form-control bg-dark border-0"
                                                                                                    :class="{'text-info': contract.t == account, 'text-white': contract.t != account}"
                                                                                                    :disabled="contract.t != account">
                                                                                            </div>
                                                                                        </div>

                                                                                        <!-- choices-js-->
                                                                                        <div class="mb-1">
                                                                                            <label
                                                                                                class="mb-1">Tags</label>
                                                                                            <choices-vue
                                                                                                ref="select-tag"
                                                                                                :prop_selections="localNewMeta[contract.i][cid].flags"
                                                                                                prop_type="tags"
                                                                                                @data="handleTag(contract.i, cid, $event)"
                                                                                                :class="{'text-info': contract.t == account, 'text-white disabled': contract.t != account}"
                                                                                                :disabled="contract.t != account"></choices-vue>
                                                                                        </div>
                                                                                        <div class="mb-1">
                                                                                            <label
                                                                                                class="mb-1">License</label>
                                                                                            <choices-vue
                                                                                                ref="select-tag"
                                                                                                :prop_selections="localNewMeta[contract.i][cid].license"
                                                                                                prop_type="license"
                                                                                                @data="handleLicense(contract.i, cid, $event)"
                                                                                                :class="{'text-info': contract.t == account, 'text-white': contract.t != account}"
                                                                                                :disabled="contract.t != account"></choices-vue>
                                                                                        </div>
                                                                                        <div class="mb-1">
                                                                                            <label
                                                                                                class="mb-1">Labels</label>
                                                                                            <choices-vue
                                                                                                ref="select-label"
                                                                                                :prop_selections="localNewMeta[contract.i][cid].labels"
                                                                                                prop_type="labels"
                                                                                                @data="handleLabel(contract.i, cid, $event)"
                                                                                                :class="{'text-info': contract.t == account, 'text-white': contract.t != account}"
                                                                                                :disabled="contract.t != account"></choices-vue>
                                                                                        </div>

                                                                                    </div>

                                                                                </div>

                                                                                <!-- save button -->
                                                                                <div class="d-flex text-center">
                                                                                    <button
                                                                                        v-if="contract.c > 1 && metaMismatch(contract.i) && !localNewMeta[contract.i].contract.encrypted"
                                                                                        class="btn btn-lg btn-outline-warning mx-auto my-2"
                                                                                        type="button"
                                                                                        @click="update_meta(contract.i)"><i
                                                                                            class="fa-solid fa-floppy-disk fa-fw me-2"></i>Save
                                                                                        Metadata</button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div v-for="(size, cid, index) in contract.df">
                                                                            <div v-if="localNewMeta[contract.i][cid].is_thumb"
                                                                                class="mt-2 rounded bg-dark p-2">
                                                                                Thumb:
                                                                                {{getdelimed(localNewMeta[contract.i][cid].name,
                                                                                'thumb',
                                                                                1)}}.{{localNewMeta[contract.i][cid].type}}
                                                                                - {{cid}} - {{fancyBytes(size)}}
                                                                            </div>
                                                                        </div>
                                                                        <!-- encrypted sharing  -->
                                                                        <div v-if="contract.c > 1 && localNewMeta[contract.i].contract.encrypted"
                                                                            class="mt-3">

                                                                            <div class="d-flex flex-column flex-grow-1">
                                                                                <div class="fs-3 fw-lighter">Sharing
                                                                                </div>
                                                                                <p v-if="contract.t == spkapi.name">
                                                                                    {{pluralFiles(contract.i) > 1 ?
                                                                                    'These files are' : 'This file is'}}
                                                                                    encrypted. You can add and remove
                                                                                    accounts that can decrypt
                                                                                    {{pluralFiles(contract.i) > 1 ?
                                                                                    'them' : 'it'}}.</p>
                                                                                <p v-if="contract.t != spkapi.name">
                                                                                    {{pluralFiles(contract.i) > 1 ?
                                                                                    'These files are' : 'This file is'}}
                                                                                    encrypted and shared with the
                                                                                    following:</p>

                                                                                <!-- decrypt button -->
                                                                                <div class="mb-2"
                                                                                    v-if="contract.t == spkapi.name && !contract.encryption.key">
                                                                                    <div class="w-100 btn btn-lg btn-dark"
                                                                                        @click="decryptKey(contract.i)">
                                                                                        Decrypt to Modify<i
                                                                                            class="fa-solid fa-fw ms-2 fa-lock-open"></i>
                                                                                    </div>
                                                                                </div>

                                                                                <!-- username input add -->
                                                                                <div class="d-flex mb-2"
                                                                                    v-if="contract.t == spkapi.name && contract.encryption.key">
                                                                                    <div class="me-1 flex-grow-1">
                                                                                        <div
                                                                                            class="position-relative has-validation">
                                                                                            <input autocapitalize="off"
                                                                                                placeholder="username"
                                                                                                class="form-control border-light bg-darkg text-info"
                                                                                                v-model="contract.encryption.input"
                                                                                                @keyup.enter="addUser(contract.i)">
                                                                                        </div>
                                                                                    </div>
                                                                                    <div class="ms-1">
                                                                                        <div class="btn btn-lg btn-light"
                                                                                            @click="addUser(contract.i)">
                                                                                            <i
                                                                                                class="fa-solid fa-fw fa-plus"></i>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>

                                                                                <!-- shared accounts -->
                                                                                <div
                                                                                    class="d-flex flex-row flex-wrap mb-2">
                                                                                    <div
                                                                                        v-for="(a,b,c) in contract.encryption.accounts">
                                                                                        <div :class="{'bg-white' : contract.encryption.key && b != contract.t, 'bg-white-50' : !contract.encryption.key || b == contract.t}"
                                                                                            class="rounded text-black filter-bubble me-1 mb-1 d-flex align-items-center">
                                                                                            <div
                                                                                                class="d-flex align-items-center">
                                                                                                <i class="fa-solid fa-key fa-fw me-1"
                                                                                                    :class="{'text-primary': contract.encryption.accounts[b].enc_key, 'text-warning': !contract.encryption.accounts[b].enc_key}"></i>
                                                                                                <span>{{b}}</span>
                                                                                                <div
                                                                                                    v-if="contract.t == spkapi.name && contract.encryption.key && b != contract.t">
                                                                                                    <button
                                                                                                        type="button"
                                                                                                        class="ms-2 btn-close small btn-close-white"
                                                                                                        @click="delUser(contract.i, b)"></button>
                                                                                                </div>
                                                                                                <div
                                                                                                    v-if="b == spkapi.name && !contract.encryption.key">
                                                                                                    <button
                                                                                                        type="button"
                                                                                                        class="d-none ms-2 small btn-white"
                                                                                                        @click="decryptKey(contract.i)"><i
                                                                                                            class="fa-solid fa-fw mx-1 fa-lock-open"
                                                                                                            aria-hidden="true"></i></button>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>

                                                                                <!-- encrypt / save button -->
                                                                                <div class="d-flex text-center">
                                                                                    <button v-if="unkeyed(contract.i)"
                                                                                        class="mx-auto mb-2 btn btn-lg btn-outline-warning"
                                                                                        type="button"
                                                                                        @click="checkHive(contract.i)"><i
                                                                                            class="fa-solid fa-fw fa-user-lock me-2"></i>Encrypt
                                                                                        Keys</button>
                                                                                    <button
                                                                                        v-if="metaMismatch(contract.i) && !unkeyed(contract.i)"
                                                                                        class="btn btn-lg btn-outline-warning mx-auto mb-2"
                                                                                        type="button"
                                                                                        @click="update_meta(contract.i)"><i
                                                                                            class="fa-solid fa-floppy-disk fa-fw me-2"></i>Save
                                                                                        Metadata</button>
                                                                                </div>



                                                                            </div>

                                                                        </div>

                                                                        <!-- save button 
                                                                  <div class="d-flex text-center">
                                                                      <button v-if="contract.c > 1 && metaMismatch(contract.i) && !localNewMeta[contract.i].contract.encrypted" class="btn btn-lg btn-outline-warning mx-auto my-2" type="button" @click="update_meta(contract.i)"><i class="fa-solid fa-floppy-disk fa-fw me-2"></i>Save Metadata</button>
                                                                  </div>
                                                                  -->
                                                                    </div>
                                                                </div>
                                                            </div>









                                                            <!-- contract details -->
                                                            <div
                                                                class="d-flex flex-wrap justify-content-center my-3 small">


                                                                <div
                                                                    class="d-flex align-items-center px-3 py-1 m-1 rounded-pill border border-white">
                                                                    <div> Owner </div>
                                                                    <i class="fa-solid fa-user fa-fw mx-1"
                                                                        aria-hidden="true"></i>
                                                                    <div><a :href="'/@' + contract.t"
                                                                            class="no-decoration text-primary">@{{contract.t}}</a>
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    class="d-flex align-items-center px-3 py-1 m-1 rounded-pill border border-white">
                                                                    <div> Sponsor </div>
                                                                    <i class="fa-solid fa-user-shield fa-fw mx-1"
                                                                        aria-hidden="true"></i>
                                                                    <div><a :href="'/@' + contract.f"
                                                                            class="no-decoration text-primary">@{{contract.f}}</a>
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    class="d-flex align-items-center px-3 py-1 m-1 rounded-pill border border-white">
                                                                    <div> Service Provider </div>
                                                                    <i class="fa-solid fa-user-gear fa-fw mx-1"
                                                                        aria-hidden="true"></i>
                                                                    <div><a :href="'/@' + contract.b"
                                                                            class="no-decoration text-primary">@{{contract.b}}</a>
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    class="d-flex align-items-center px-3 py-1 m-1 rounded-pill border border-white">
                                                                    <div> Size </div>
                                                                    <i class="fa-solid fa-warehouse fa-fw mx-1"
                                                                        aria-hidden="true"></i>
                                                                    <div>{{contract.c > 1 ? fancyBytes(contract.u) :
                                                                        fancyBytes(contract.a)}}</div>
                                                                </div>
                                                                <div
                                                                    class="d-flex align-items-center px-3 py-1 m-1 rounded-pill border border-white">
                                                                    <div> Redundancy </div>
                                                                    <i class="fa-solid fa-tower-broadcast fa-fw mx-1"
                                                                        aria-hidden="true"></i>
                                                                    <div>{{contract.p}} nodes</div>
                                                                </div>
                                                                <div
                                                                    class="d-flex align-items-center px-3 py-1 m-1 rounded-pill border border-white">
                                                                    <div> Expiration </div>
                                                                    <i class="fa-solid fa-clock fa-fw mx-1"
                                                                        aria-hidden="true"></i>
                                                                    <div>{{exp_to_time(contract.e)}}</div>
                                                                </div>
                                                                <div
                                                                    class="d-flex align-items-center px-3 py-1 m-1 rounded-pill border border-white">
                                                                    <div> Price </div>
                                                                    <i class="fa-solid fa-atom fa-fw mx-1"
                                                                        aria-hidden="true"></i>
                                                                    <div>{{formatNumber(contract.r,'3','.',',')}}
                                                                        Broca</div>
                                                                </div>
                                                                <div v-if="contract.s"
                                                                    class="d-flex align-items-center px-3 py-1 m-1 rounded-pill border border-white">
                                                                    <div> Terms </div>
                                                                    <i class="fa-solid fa-hand-holding-dollar fa-fw mx-1"
                                                                        aria-hidden="true"></i>
                                                                    <div>{{slotDecode(contract.s, 1)}}%
                                                                        Beneficiary to <a
                                                                            :href="'/@' + slotDecode(contract.s, 0)"
                                                                            class="no-decoration text-primary">@{{slotDecode(contract.s,
                                                                            0)}}</a></div>
                                                                </div>
                                                                <div
                                                                    class="d-flex align-items-center px-3 py-1 m-1 rounded-pill border border-white">
                                                                    <div> Status </div>
                                                                    <i class="fa-solid fa-signal fa-fw mx-1"
                                                                        aria-hidden="true"></i>
                                                                    <div> {{contract.c == 1 ? 'Waiting For Upload' :
                                                                        'Uploaded'}}</div>
                                                                </div>
                                                                <div class="d-flex align-items-center px-3 py-1 m-1 rounded-pill border border-white"
                                                                    v-if="localNewMeta[contract.i]">
                                                                    <div> Privacy </div>
                                                                    <i class="fa-solid fa-fw mx-1"
                                                                        :class="{'fa-lock-open': !localNewMeta[contract.i].contract.encrypted, 'fa-lock': localNewMeta[contract.i].contract.encrypted}"
                                                                        aria-hidden="true"></i>
                                                                    <div>{{localNewMeta[contract.i].contract.encrypted ?
                                                                        'Private' : 'Public'}}</div>
                                                                </div>
                                                                <div
                                                                    class="d-flex align-items-center px-3 py-1 m-1 rounded-pill border border-white">
                                                                    <div> Nodes </div>
                                                                    <i
                                                                        class="fa-solid fa-tower-broadcast mx-1 fa-fw"></i>
                                                                    <div>{{contract.nt ?? 0}} /
                                                                        {{contract.p}} </div>
                                                                </div>
                                                            </div>
                                                            <div class="d-flex">
                                                                <button type="button"
                                                                    class="btn btn-sm btn-danger my-2 mx-auto"
                                                                    :class="{'invisible': contract.t != account}"
                                                                    :disabled="contract.t != account"
                                                                    @click="cancel_contract(contract)">
                                                                    <i
                                                                        class="fa-solid fa-file-circle-xmark fa-fw me-1"></i>End
                                                                    Contract</button>
                                                            </div>
                                                        </div>

                                                    </div>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
  `,
  methods: {
    ...common,
    ...spk,
    getIPFSproviders() {
      fetch("https://spktest.dlux.io/services/IPFS")
        .then((response) => response.json())
        .then((data) => {
          this.ipfsProviders = data.providers;
        });
    },
    getSapi(user = this.account) {
      if (user) fetch(this.sapi + "/@" + user)
        .then((response) => response.json())
        .then((data) => {
          data.tick = data.tick || 0.01;
          this.larynxbehind = data.behind;
          this.lbalance = (data.balance / 1000).toFixed(3);
          this.lbargov = (data.gov / 1000).toFixed(3);
          this.saccountapi = data;
          this.saccountapi.spk += this.reward_spk();
          if (!this.saccountapi.granted.t) this.saccountapi.granted.t = 0;
          if (!this.saccountapi.granting.t) this.saccountapi.granting.t = 0;
          this.spkval = (data.balance + data.gov + data.poweredUp + data.spk_power + this.saccountapi.granting.t + data.claim + data.spk) / 1000;
        });
    },
    selectContract(id, broker) {  //needs PeerID of broker
      this.contract.id = id;
      fetch(`${this.sapi}/user_services/${broker}`)
        .then(r => r.json())
        .then(res => {
          this.contract.api = res.services.IPFS[Object.keys(res.services.IPFS)[0]].a;
        });
    },
    reward_spk() {
      var r = 0,
        a = 0,
        b = 0,
        c = 0,
        t = 0,
        diff = (this.saccountapi.head_block ? this.saccountapi.head_block : this.sstats.lastIBlock) - this.saccountapi.spk_block;
      if (!this.saccountapi.spk_block) {
        return 0;
      } else if (diff < 28800) {
        return 0;
      } else {
        t = parseInt(diff / 28800);
        a = this.saccountapi.gov ? simpleInterest(this.saccountapi.gov, t, this.sstats.spk_rate_lgov) : 0;
        b = this.saccountapi.pow ? simpleInterest(this.saccountapi.pow, t, this.sstats.spk_rate_lpow) : 0;
        c = simpleInterest(
          parseInt(this.saccountapi.granted?.t > 0 ? this.saccountapi.granted.t : 0) +
          parseInt(this.saccountapi.granting?.t > 0 ? this.saccountapi.granting.t : 0),
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
    formatNumber(t, n, r, e) {
      if (isNaN(t)) return "0";
      if (t == 0) return "0";
      if (!n) n = 0;
      if (!r) r = ".";
      if (!e) e = ",";
      var num = Math.abs(t);
      var i = parseInt(num.toFixed(n)) + "";
      var j = i.length;
      j = j > 3 ? j % 3 : 0;
      var formatted =
        (j ? i.substr(0, j) + e : "") +
        i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + e) +
        (n
          ? r +
            Math.abs(num - i)
              .toFixed(n)
              .slice(2)
          : "");
      return t < 0 ? "-" + formatted : formatted;
    },
    getdelimed(string, del = ',', index = 0) {
      if (!string) return '';
      const parts = string.split(del);
      return parts[index] || '';
    },
    sendIt(event) {
      this.$emit('tosign', event);
    },
    broca_calc(last = '0,0') {
      var lasts = last.split(',');
      if (!lasts[1]) lasts[1] = 0;
      if (!lasts[0]) lasts[0] = 0;
      return parseInt(lasts[0]) + parseInt(lasts[1]);
    },
    fancyBytes(bytes) {
      if (!bytes) return '0 Bytes';
      const k = 1024;
      const dm = 2;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    },
    updatePubkey() {
      this.$emit('update-pubkey');
    },
    replace(string = "", char = ':') {
      return string.replace(/[^a-zA-Z0-9]/g, char);
    },
    split(string, del, index) {
      if (!string) return '';
      const parts = string.split(del);
      return parts[index] || '';
    },
    slotDecode(slot, index) {
      if (!slot) return '';
      const parts = slot.split(',');
      return parts[index] || '';
    },
    pluralFiles(id) {
      if (!id || !this.localNewMeta[id]) return 0;
      let count = 0;
      for (let cid in this.localNewMeta[id]) {
        if (cid !== 'contract' && !this.localNewMeta[id][cid]?.is_thumb) count++;
      }
      return count;
    },
    metaMismatch(contract) {
      if (!contract || !this.localNewMeta[contract]) return false;
      return true;
    },
    exp_to_time(exp = '0:0') {
      if (!exp) return '0:0';
      const seconds = (parseInt(exp.split(':')[0]) - parseInt(this.saccountapi.head_block)) * 3;
      
      const interval = Math.floor(seconds / 86400);
      if (interval >= 1) {
        return interval + ` day${interval > 1 ? "s" : ""}`;
      }
      
      const hours = Math.floor(seconds / 3600);
      if (hours >= 1) {
        return hours + ` hour${hours > 1 ? "s" : ""}`;
      }
      
      const minutes = Math.floor(seconds / 60);
      if (minutes >= 1) {
        return `${minutes} minute${minutes > 1 ? "s" : ""}`;
      }
      
      return Math.floor(seconds) + " seconds";
    },
    store(contracts, remove = false) {
      this.$emit('store', { contracts, remove });
    },
    downloadFile(cid, id) {
      this.$emit('download-file', { cid, id });
    },
    decryptKey(id) {
      this.$emit('decrypt-key', id);
    },
    addUser(id) {
      this.$emit('add-user', id);
    },
    delUser(id, user) {
      this.$emit('del-user', { id, user });
    },
    checkHive(id) {
      this.$emit('check-hive', id);
    },
    update_meta(contract) {
      this.$emit('update-meta', contract);
    },
    handleTag(id, cid, m) {
      this.$emit('handle-tag', { id, cid, m });
    },
    handleLicense(id, cid, m) {
      this.$emit('handle-license', { id, cid, m });
    },
    handleLabel(id, cid, m) {
      this.$emit('handle-label', { id, cid, m });
    },
    getImgData(id, cid) {
      this.$emit('get-img-data', { id, cid });
    },
    isValidThumb(string) {
      if (!string || string.indexOf(":") === -1) {
        return false;
      }
      return string;
    },
    unkeyed(obj) {
      if (!obj || !this.localNewMeta[obj]) return false;
      return false;
    },
    cancel_contract(contract) {
      const toSign = {
        type: "cja",
        cj: {
          id: contract.i,
        },
        id: `spkccT_contract_close`,
        msg: `Canceling ${contract.i}...`,
        ops: ["getTokenUser", "getSapi"],
        api: "https://spktest.dlux.io",
        txid: "cancel_contract",
      };
      this.$emit('tosign', toSign);
    },
    extend(contract, amount = this.extendcost) {
      if(amount > this.broca_calc(this.saccountapi.broca)) return;
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
        ops: ["getTokenUser"],
        api: "https://spktest.dlux.io",
        txid: "extend",
      };
      this.$emit('tosign', toSign);
    },
    updateCost(contractId) {
      const contract = this.contracts.find(c => c.i === contractId);
      if (contract) {
        this.extendcost = parseInt(contract.extend / 30 * contract.r);
      }
    }
  },
  computed: {
    usedBytes() {
      let total = 0;
      for (let contract of this.contracts) {
        if (contract.u) total += contract.u;
      }
      return total;
    },
    availableBytes() {
      return this.saccountapi?.spk_power ? this.saccountapi.spk_power * 1000 * 1024 * 6 : 0;
    }
  }
} 