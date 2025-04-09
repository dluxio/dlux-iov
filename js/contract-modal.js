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
          token: "BROCA",
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
        <form name="contract" @submit.prevent="createContract">
          <div class="modal-body text-start pb-1" v-if="!isLoading">
            <div v-for="(field, key) in feat.json">
              <div class="mb-3" v-if="shouldShowField(key)">
                <!-- form field label -->
                <label class="small mb-1 d-flex" :for="key">
                  {{ field.string }}
                  <span v-if="key === 'amount'" class="ms-auto">
                    Balance: <a role="button" class="text-info" @click="form[key] = broca_calc(tokenuser[token], tokenstats.broca_refill, tokenuser.spk_power, tokenuser.head_block)">
                      {{ formatNumber(broca_calc(tokenuser[token], tokenstats.broca_refill, tokenuser.spk_power, tokenuser.head_block), 0, '.', ',') }}
                    </a> {{ tokenprotocol.token }}
                  </span>
                </label>
                <!-- form field input -->
                <div class="position-relative">
                  <template v-if="field.type === 'O'">
                    <!-- provider select -->
                    <select v-if="key === 'broker'" class="form-select text-white bg-dark border-dark" :id="key" v-model="form[key]">
                      <option value="" disabled selected>Select {{ field.string.toLowerCase() }}</option>
                      <option v-for="(name, id) in filteredBrokerOptions" :value="id" :disabled="isProviderDisabled(id)">
                        {{getProviderIconUnicode(id)}} | @{{ id }}
                      </option>
                    </select>
                    <!-- beneficiary toggle button -->
                    <div v-else-if="key === 'contract'" class="text-center">
                      <button 
                         
                        type="button" 
                        class="btn text-white"
                        :class="form.contract === '1' ? 'btn-danger' : 'btn-success'"
                        @click="toggleBeneficiary"
                      >
                        {{ form.contract === '1' ? 'Remove Beneficiary' : 'Add Beneficiary' }}
                      </button>
                    </div>
                  </template>
                  <!-- input -->
                  <template v-else>
                    <!-- input field pfp -->
                    <span v-if="pfp[key]" class="position-absolute top-50 translate-middle-y mx-1 rounded-circle bg-light" :style="{
                          'border-color': !form[key] ? 'rgb(255, 255, 255)' : validations[key] ? 'rgb(0, 255, 0)' : 'rgb(255, 0, 0)',
                          'border-width': '2px',
                          'border-style': 'solid'
                        }"><img :src="pfp[key]" alt="Recipient Profile Picture" @error="fallBackIMG($event, form[key])" style="width: 30px; height: 30px; border-radius: 50%;">
                    </span>
                    <!-- input field -->
                    <input
                      :type="getInputType(field.type)"
                      :class="['form-control', 'text-white', 'bg-dark', 'border-dark',  field.icon ? 'pe-4' : '', pfp[key] ? 'ps-4' : '',  key === 'amount' ? 'pe-5' : '']"
                      :placeholder="'Enter ' + field.string.toLowerCase()"
                      v-model="form[key]"
                      @input="debouncedValidateField(key)"
                      :step="field.step || null"
                      :min="field.min || null"
                      :max="field.max === 'balance' ? tokenuser[token] : field.max"
                    >
                    <!-- input field units -->
                    <span v-if="key === 'amount'" class="position-absolute end-0 top-50 translate-middle-y px-2">
                      {{ tokenprotocol.token }}
                    </span>
                    <!-- input field icon -->
                    <span v-if="field.icon" class="position-absolute end-0 top-50 translate-middle-y px-2">
                      <i :class="field.icon"></i>
                    </span>
                  </template>
                </div>
                <!-- form field info message -->
                <div class="text-center mb-3 small text-muted">
                  <span v-if="key === 'amount'">
                    ~{{ fancyBytes(form[key] * 1024) }}
                  </span>
                  <span v-if="key === 'broker'">
                    ({{ availableProvidersCount }} storage providers available)
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="!isFormValid" data-bs-dismiss="modal">Propose</button>
          </div>
        </form>
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
  created() {
    this.debouncedValidateField = this.debounce((key) => {
      this.validateField(key);
    }, 300);
  },
  methods: {
    ...MCommon,
    ...MModals,
    ...MSpk,
    createContract() {
      const op = {
        type: "cj",
        cj: {
          to: this.form.to,
          broca: parseInt(this.form.amount),
          broker: this.form.broker,
          contract: this.form.contract
        },
        id: `${this.tokenprotocol.prefix}${this.feat.id}`,
        msg: `Preparing a file store for ${this.form.to}`,
        ops: ["getSapi", "refreshComponents"],
        api: this.api,
        txid: `${this.func}_${Date.now()}`
      };
      if (op.cj.contract === "1") {
        op.cj.slots = `${this.form.ben_to},${parseInt(this.form.ben_amount * 100)}`;
      }
      this.$emit("modalsign", op);
    },
    fetchProviderStats() {
      for (var i = 0; i < this.ipfsServices.length; i++) {
        for (var node in this.ipfsServices[i]) {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 1000)
          fetch(`${this.ipfsServices[i][node].a}/upload-stats`, { signal: controller.signal })
            .then(response => response.json())
            .then(data => {
              console.log('ipfs Stats', data)
              if (data?.node) {
                this.providerStats[data.node] = data
              }
              this.filteredBrokerOptions = Object.entries(this.ipfsProviders)
                .filter(([id]) => {
                  const stats = this.providerStats[id];
                  if (!stats) return false;
                  const max = BigInt(stats.StorageMax)
                  const freeSpace = max - BigInt(stats.RepoSize);
                  return freeSpace >= BigInt(2);
                })
                .reduce((acc, [id, name]) => {
                  acc[id] = name;
                  return acc;
                }, {});
              this.availableProvidersCount = Object.keys(this.filteredBrokerOptions).length;
            })
            .catch(error => { })
        }
      }
    },
    getIPFSproviders() {
      return new Promise((res, rej) => {
        fetch(this.api + "/services/IPFS")
          .then(response => response.json())
          .then(data => {
            for (var node in data.providers) {
              const id_array = data.providers[node].split(',')
              for (var i = 0; i < id_array.length; i++) {
                this.ipfsProviders[node] = id_array
              }
            }
            this.ipfsServices = data.services;
            res(true)
          })
          .catch(error => {
            console.warn('Error fetching IPFS providers:', error)
            rej(error)
          })
      })
    },
    getProviderIconUnicode(providerId) {
      if (!this.form.amount) return '';
      const amount = parseFloat(this.form.amount);
      if (isNaN(amount)) return;
      const requiredSize = amount * 1024;
      const stats = this.providerStats[providerId];
      if (!stats) return '';
      const max = BigInt(stats.StorageMax)
      const freeSpace = max - BigInt(stats.RepoSize);
      const ratio = Number(freeSpace) / requiredSize;

      if (ratio >= 100) return '✅';
      if (ratio >= 2) return '⚠️';
      return '❌';
    },
    handleAmountInput() {
      if (this.form.amount) {
        const requiredSize = this.form.amount * 1024;
        this.filteredBrokerOptions = Object.entries(this.ipfsProviders)
          .filter(([id]) => {
            const stats = this.providerStats[id];
            if (!stats) return false;
            const max = BigInt(stats.StorageMax)
            const freeSpace = max - BigInt(stats.RepoSize);
            return freeSpace >= BigInt(requiredSize * 2);
          })
          .reduce((acc, [id, name]) => {
            acc[id] = name;
            return acc;
          }, {});
        this.availableProvidersCount = Object.keys(this.filteredBrokerOptions).length;
      } else {
        this.filteredBrokerOptions = this.ipfsProviders;
        this.availableProvidersCount = Object.keys(this.ipfsProviders).length;
      }
      if (!this.ipfsProviders[this.form.broker])this.form.broker = ""
    },
    handleCheck(key) {
      const field = this.feat.json[key];
      if (field.check === "AC" && this.form[key]) {
        this.accountCheck(this.form[key])
          .then((r) => {
            this.validations[key] = r;
          })
          .catch(() => {
            this.validations[key] = false;
          });
      }
    },
    isProviderDisabled(providerId) {
      if (!this.form.amount) return false;
      const requiredSize = this.form.amount * 1024;
      const stats = this.providerStats[providerId];
      if (!stats) return true;
      const max = BigInt(stats.StorageMax)
      const freeSpace = max - BigInt(stats.RepoSize);
      return freeSpace < BigInt(requiredSize * 2);
    },
    shouldShowField(key) {
      if (key === 'ben_to' || key === 'ben_amount') {
        return this.form.contract === "1";
      }
      return true;
    },
    toggleBeneficiary() {
      this.form.contract = this.form.contract === "1" ? "0" : "1";
      if (this.form.contract === "0") {
        this.form.ben_to = "";
        this.pfp.ben_to = '/img/no-user.png'
        this.form.ben_amount = "";
        this.validations.ben_to = false;
      }
    },
    validateField(key) {
      this.validations[key] = false
      const field = this.feat.json[key];
      if (field.check === 'AC') {
        if (this.account === this.form[key]) {
          this.validations[key] = true;
          this.pfp[key] = this.mypfp
        } else this.accountCheck(this.form[key]).then(result => {
          if (result) {
            this.validations[key] = true;
            if (result === true) this.pfp[key] = '/img/no-user.png'
            else this.pfp[key] = result
          } else {
            this.pfp[key] = '/img/no-user.png'
          }
        }).catch(() => {
          this.validations[key] = false;
          this.pfp[key] = '/img/no-user.png'
        });
      }
    }
  },
  computed: {
    isFormValid() {
      if (!this.feat || !this.feat.json) return false;
      for (const key in this.feat.json) {
        const field = this.feat.json[key];
        if (field.req && !this.form[key]) return false;
        if (field.check === "AC" && this.form[key] && !this.validations[key]) return false;
      }
      if (this.form.contract === "1") {
        if (!this.form.ben_to || !this.form.ben_amount) return false;
        if (!this.validations.ben_to) return false;
        if (this.form.ben_amount < 0.01 || this.form.ben_amount > 100) return false;
      }
      return true;
    },
  },
  watch: {
    'form.contract'(newVal) {
      if (newVal === "1") {
        this.form.ben_to = '';
        this.form.ben_amount = '';
        this.validations.ben_to = false;
        this.feat.json.ben_to.req = true;
        this.feat.json.ben_amount.req = true;
      } else {
        this.feat.json.ben_to.req = false;
        this.feat.json.ben_amount.req = false;
      }
    }
  },
  mounted() {
    const feature = this.tokenprotocol.features[this.func];
    if (feature) {
      this.feat = feature;
      for (const key in feature.json) {
        if (this.form[key] === undefined) {
          this.form[key] = "";
        }
        if (feature.json[key]?.check === "AC") {
          this.pfp[key] = '/img/no-user.png';
          this.validations[key] = false;
        } else if (feature.json[key]?.check) {
          this.validations[key] = false;
        }
      }
    } else {
      this.error = "Feature not found";
    }
    this.getIPFSproviders().then(() => {
      this.fetchProviderStats();
      this.filteredBrokerOptions = { ...this.ipfsProviders };
      this.availableProvidersCount = Object.keys(this.ipfsProviders).length;
      this.isLoading = false;
    });
  }
};