import MCommon from '/js/methods-common.js'
import MModals from '/js/methods-modals.js'

export default {
  name: 'Standard',
  props: {
    account: String,
    api: String,
    mypfp: String,
    func: { type: String, default: 'send' },
    to_account: { default: "" },
    token: { type: String, default: 'balance' },
    tokenprotocol: {
      type: Object,
      default: () => ({
        precision: 3,
        token: 'HIVE',
        features: {}
      })
    },
    // tokenstats: Object,
    tokenuser: Object,
    test: { type: Boolean, default: false },
  },
  template: `
  <div class="modal-dialog modal-dialog-centered" role="document">
    <div class="modal-content bg-darker text-white">
      <div class="modal-header">
        <h5 class="modal-title">{{ feat ? feat.string : "Loading" }} {{ tokenprotocol.token }}</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <form name="sendtokens" @submit.prevent="moveTokens">
        <div class="modal-body text-start">
          <!-- From Field (Static) -->
          <label class="small mb-1" for="from">From</label>
          <div class="position-relative mb-3">
          <span class="position-absolute top-50 translate-middle-y mx-1 rounded-circle bg-light " style="border-style: solid; border-width: 2px; border-color:rgb(255, 255, 255)">
  <img :src="mypfp" alt="My pfp" @error="fallBackIMG($event, account)" style="width: 30px; height: 30px; border-radius: 50%;">
</span>

            <input class="ps-4 form-control bg-dark border-dark" type="text" :value="account" readonly placeholder="Please login">
          </div>

          <!-- Dynamic Fields -->
          <div v-for="(field, key) in feat.json" :key="key" class="mb-3">
            <label class="small mb-1 d-flex" :for="key">
              {{ field.string }}
              <span v-if="key === 'amount'" class="ms-auto">
                Balance: <a role="button" class="text-info" @click="form[key] = tokenuser[feat.addr || 'balance'] / pf(tokenprotocol.precision)">
                  {{ formatNumber(tokenuser[feat.addr || 'balance'] / pf(tokenprotocol.precision), tokenprotocol.precision, '.', ',') }}
                </a> {{ tokenprotocol.token }}
              </span>
            </label>
            <div class="position-relative">
              <span v-if="pfp[key]" class="position-absolute top-50 translate-middle-y mx-1 rounded-circle bg-light" :style="{
      'border-color': !form[key] ? 'rgb(255, 255, 255)' : validations[key] ? 'rgb(0, 255, 0)' : 'rgb(255, 0, 0)',
      'border-width': '2px',
      'border-style': 'solid'
    }"><img :src="pfp[key]" alt="Recipient Profile Picture" @error="fallBackIMG($event, form[key])" style="width: 30px; height: 30px; border-radius: 50%;">
</span>
              <input
                :type="getInputType(field.type)"
                :class="['form-control', 'text-white', 'bg-dark', 'border-dark', getIcon(key) ? 'ps-4' : '', key === 'amount' ? 'pe-5' : '']"
                :placeholder="field.string === 'To' ? 'Enter username' : 'Enter ' + field.string.toLowerCase()"
                v-model="form[key]"
                @input="debouncedValidateField(key)"
                @blur="field.check ? field.check : null"
                :step="key === 'amount' ? pd(tokenprotocol.precision) : null"
                :min="key === 'amount' ? pd(tokenprotocol.precision) : null"
                :max="key === 'amount' ? tokenuser[token] / pf(tokenprotocol.precision) : null"
              >
              <span v-if="key === 'amount'" class="position-absolute end-0 top-50 translate-middle-y px-2">
                {{ tokenprotocol.token }}
              </span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <div class="me-auto btn-group border border-info rounded px-2 py-1" v-if="test">
            <input type="checkbox" v-model="testTx" class="me-2">
            <label>Test Network Only</label>
          </div>
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button :disabled="!isFormValid" type="submit" class="btn btn-primary">{{feat.string}}</button>
        </div>
      </form>
    </div>
  </div>`,
  data() {
    return {
      debouncedValidateField: null,
      error: "",
      feat: {},
      form: {},
      pfp: {},
      testTx: false,
      valid: false,
      validations: {}
    };
  },
  methods: {
    ...MCommon,
    ...MModals,
    getIcon(key) {
      if (key === 'to') return 'fa-at';
      return '';
    },
    isValid() {
      if (this.ac) this.valid = true
    },
    moveTokens() {
      const op = {};
      op.type = this.feat.auth === "posting" ? 'cj' : 'cja';
      op.cj = {}
      for (const key in this.form) {
        if (key === 'amount') {
          op.cj[key] = parseInt(parseFloat(this.form[key]) * this.pf(this.tokenprotocol.precision));
        } else {
          op.cj[key] = this.form[key];
        }
      }
      op.id = `${this.tokenprotocol.prefix}${this.feat.id}`;
      op.msg = this.feat.msg
      op.ops = ['getTokenUser'];
      op.api = this.api;
      op.txid = this.func + '_' + Date.now();
      this.$emit('tosign', op)
      const modalElement = this.$el.closest('.modal');
      const modalInstance = bootstrap.Modal.getInstance(modalElement);
      modalInstance.hide();

    },
    prefillToField() {
      if (typeof this.to_account == "object" && (this.func === 'powdel' || this.func === 'powdn' || this.func === 'govdn' || this.func === 'send')) {
        for (var key in this.to_account) {
          this.form[key] = this.to_account[key]
          this.validateField(key)
        }
      }
    },
    validateField(key) {
      this.validations[key] = false
      const field = this.feat.json[key];
      if (field.check === 'AC') {
        if (this.account == this.form[key]) {
          this.validations[key] = false;
          this.pfp[key] = this.mypfp
        }
        else this.accountCheck(this.form[key]).then(result => {
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
        if (field.check === 'AC' && !this.validations[key]) return false;
      }
      return true;
    }
  },
  created() {
    this.debouncedValidateField = this.debounce((key) => {
      this.validateField(key);
    }, 300);
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
      this.prefillToField()
    } else {
      this.error = "Feature not found";
    }
  }
};