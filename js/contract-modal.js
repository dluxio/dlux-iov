import MCommon from '/js/methods-common.js'
import MModals from '/js/methods-modals.js'

export default {
  name: 'contract-modal',
  props: {
    account: String,
    api: String,
    mypfp: String,
    token: "BROCA",
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
                "contract": {
                  "string": "Contract Type",
                  "type": "O",
                  "req": true,
                  "options": {
                    "0": "Pay for a contract for you or another",
                    "1": "Pay for a contract for another and require a post beneficiary"
                  },
                  "icon": "fa-solid fa-file-contract"
                },
                "amount": {
                  "string": "Amount",
                  "type": "I",
                  "req": true,
                  "min": 100,
                  "step": 1,
                  "max": "balance",
                  "icon": "fa-solid fa-coins"
                },
                "to": {
                  "string": "Account to Upload File",
                  "type": "S",
                  "req": true,
                  "check": "AC",
                  "icon": "fa-solid fa-at"
                },
                "broker": {
                  "string": "IPFS Service Provider",
                  "type": "O",
                  "req": true,
                  "options": "ipfsproviders",
                  "icon": "fa-solid fa-server"
                },
                "ben_to": {
                  "string": "Beneficiary Account",
                  "type": "S",
                  "req": false,
                  "check": "AC",
                  "icon": "fa-solid fa-at"
                },
                "ben_amount": {
                  "string": "Requested Beneficiary Amount",
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
          <div class="modal-body text-start" v-if="!isLoading">
          <div v-for="(field, key) in feat.json">
            <div class="mb-3" v-if="shouldShowField(key)">
              <label class="small mb-1 d-flex" :for="key">
                {{ field.string }}
                <span v-if="key === 'amount'" class="ms-auto">
                  Balance: <a role="button" class="text-info" @click="form[key] = tokenuser[token]">
                    {{ formatNumber(tokenuser[token], 0, '.', ',') }}
                  </a> {{ token }}
                </span>
              </label>
              <div class="position-relative">
                <template v-if="field.type === 'O'">
                  <select v-if="key === 'broker'" class="form-select text-white bg-dark border-dark ps-4" :id="key" v-model="form[key]">
                    <option value="" disabled selected>Select {{ field.string.toLowerCase() }}</option>
                    <option v-for="(name, id) in filteredBrokerOptions" :value="id" :disabled="isProviderDisabled(id)">
{{getProviderIconUnicode(id)}} | @{{ id }}
                    </option>
                  </select>
                  <select v-else class="form-select text-white bg-dark border-dark ps-4" :id="key" v-model="form[key]">
                    <option value="" disabled selected>Select {{ field.string.toLowerCase() }}</option>
                    <option v-for="(name, id) in field.options" :value="id">
{{name}}
                    </option>
                  </select>
                </template>
                <template v-else>
                  <input
                    :type="getInputType(field.type)"
                    :class="['form-control', 'text-white', 'bg-dark', 'border-dark', field.icon ? 'ps-4' : '']"
                    :placeholder="'Enter ' + field.string.toLowerCase()"
                    v-model="form[key]"
                    @input="key === 'amount' ? handleAmountInput() : handleCheck(key)"
                    :step="field.step || null"
                    :min="field.min || null"
                    :max="field.max === 'balance' ? tokenuser[token] : field.max"
                  >
                  <span v-if="field.icon" class="position-absolute top-50 translate-middle-y ps-2">
                    <i :class="field.icon"></i>
                  </span>
                  <span v-if="key === 'amount'" class="position-absolute end-0 top-50 translate-middle-y px-2">
                    {{ token }}
                  </span>
                </template>
              </div>
              <!-- Display storage size and available providers -->
              <div v-if="key === 'amount'" class="text-center mb-3 small text-muted">
                ~{{ fancyBytes(form[key] * 1024) }} ({{ availableProvidersCount }} storage providers available)
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
      filteredBrokerOptions: {},
      feat: {
        string: 'loading',
        json: {},
      },
      form: {
        contract_type: "0",
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
    createContract() {
      const op = {
        type: "cj",
        cj: {
          to: this.form.to,
          broca: parseInt(this.form.amount), // Precision is 0
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
          console.log(`${this.ipfsServices[i][node].a}/upload-stats`)
          fetch(`${this.ipfsServices[i][node].a}/upload-stats`, { signal: controller.signal })
            .then(response => response.json())
            .then(data => {
              console.log('ipfs Stats', data)
              if (data?.node) {
                this.providerStats[data.node] = data
              }
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
      if (isNaN(amount)) return; // Early return if invalid
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
        const requiredSize = this.form.amount * 1024; // Convert to bytes (1 unit = 1024 bytes)
        this.filteredBrokerOptions = Object.entries(this.ipfsProviders)
          .filter(([id]) => {
            const stats = this.providerStats[id];
            if (!stats) return false;
            const max = BigInt(stats.StorageMax)
            const freeSpace = max - BigInt(stats.RepoSize);
            return freeSpace >= BigInt(requiredSize * 2); // Minimum 2x requirement
          })
          .reduce((acc, [id, name]) => {
            acc[id] = name;
            return acc;
          }, {});
        this.availableProvidersCount = Object.keys(this.filteredBrokerOptions).length;
      } else {
        this.filteredBrokerOptions = this.ipfsProviders; // Show all providers if no amount
        this.availableProvidersCount = Object.keys(this.ipfsProviders).length;
      }
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
      return freeSpace < BigInt(requiredSize * 2); // Disable if <2x
    },
    shouldShowField(key) {
      if (key === 'ben_to' || key === 'ben_amount') {
        return this.form.contract == 1;
      }
      return true;
    },
  },
  computed: {
    isFormValid() {
      if (!this.feat || !this.feat.json) return false;
      for (const key in this.feat.json) {
        const field = this.feat.json[key];
        if (field.req && !this.form[key]) return false;
        if (field.check === "AC" && this.form[key] && !this.validations[key]) return false;
      }
      if (this.form.contract_type === "1") {
        if (!this.form.ben_to || !this.form.ben_amount) return false;
        if (!this.validations.ben_to) return false;
        if (this.form.ben_amount < 0.01 || this.form.ben_amount > 100) return false;
      }
      return true;
    },
  },
  watch: {
    'form.contract'(newVal) {
      if (newVal == 1) {
        this.form.ben_to = '';
        this.form.ben_amount = '';
        this.validations.ben_to = false;
        this.feat.json.ben_to.req = true
        this.feat.json.ben_amount.req = true
      } else {
        this.feat.json.ben_to.req = false
        this.feat.json.ben_amount.req = false
      }
    }
  },
  mounted() {
    const feature = this.tokenprotocol.features[this.func]
    if (feature) {
      this.feat = feature;
      for (const key in feature.json) {
        this.form[key] = ""
        if (feature.json[key]?.check == "AC") {
          this.pfp[key] = '/img/no-user.png'
          this.validations[key] = false;
        }
      }
    } else {
      this.error = "Feature not found";
    }
    this.getIPFSproviders().then(() => {
      this.fetchProviderStats()
      this.filteredBrokerOptions = { ...this.ipfsProviders }
      this.availableProvidersCount = Object.keys(this.ipfsProviders).length
      this.isLoading = false;
    });
  }
};