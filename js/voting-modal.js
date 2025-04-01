import MCommon from '/js/methods-common.js'
import MModals from '/js/methods-modals.js'
import MSpk from '/js//methods-spk.js'

export default {
  name: 'contract-modal',
  props: {
    account: String,
    api: String,
    mypfp: String,
    token: "broca",
    tokenprotocol: {
      default: function () {
        return {
          precision: 0,
          prefix: "spkccT_",
          token: "SPK",
          features: {
            channel_open: {
              "string": "Create Contract",
              "json": {
                "to": {
                  "string": "Account to Upload File",
                  "type": "S",
                  "req": true,
                  "check": "AC",
                },
                "amount": {
                  "string": "Amount",
                  "type": "I",
                  "req": true,
                  "min": 100,
                  "step": 1,
                  "max": "balance",
                },
                "broker": {
                  "string": "Service Provider",
                  "type": "O",
                  "req": true,
                  "options": "ipfsproviders",
                  "icon": "fa-solid fa-server"
                },
                "contract": {
                  "string": "",
                  "type": "O",
                  "req": true,
                  "options": {
                    "0": "Standard",
                    "1": "Beneficiary"
                  },
                  "icon": "fa-solid fa-file-contract"
                },
                "ben_to": {
                  "string": "Beneficiary Account",
                  "type": "S",
                  "req": false,
                  "check": "AC",
                },
                "ben_amount": {
                  "string": "Beneficiary Percentage",
                  "type": "I",
                  "req": false,
                  "min": 0,
                  "max": 100,
                  "step": 0.01,
                  "icon": "fa-solid fa-percent"
                }
              },
              "auth": "active",
              "id": "channel_open",
              "msg": "Creating a new contract..."
            },
          },
        };
      },
    },
    tokenstats: Object,
    tokenuser: Object,
    test: false
  },
  template: `
    <div class="modal-dialog modal-dialog-centered" role="document">
      <div class="modal-content bg-darker text-white">
        <div class="modal-header">
          <h5 class="modal-title">{{ feat.string }}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
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
            </div>`,
  data() {
    return {
      availableProvidersCount: 0,
      debouncedValidateField: null,
      filteredBrokerOptions: {},
      feat: {
        string: 'loading',
        json: {},
      },
      form: {
        contract: "0",
        to: "",
        amount: "",
        broker: "",
        ben_to: "",
        ben_amount: ""
      },
      func: "channel_open",
      ipfsProviders: {},
      isLoading: true,
      pfp: {},
      providerStats: {},
      validations: {},
    };
  },
  methods: {
    ...MCommon,
    ...MModals,
    ...MSpk,
  
  },
  mounted() {
    const feature = this.tokenprotocol.features[this.func];
    if (feature) {
      this.feat = feature;
      for (const key in feature.json) {
        if (this.form[key] === undefined) {
          this.form[key] = "";
        }
      }
    } else {
      this.error = "Feature not found";
    }
  }
};