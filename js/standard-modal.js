import MCommon from '/js/methods-common.js'
import MModals from '/js/methods-modals.js'

export default {
    name: 'Standard',
    props: {
      account: String,
      func: { type: String, default: 'send' },
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
            <span class="position-absolute top-50 translate-middle-y ps-2">
              <i class="fa-solid fa-at fa-fw"></i>
            </span>
            <input class="ps-4 form-control bg-dark border-dark" type="text" :value="account" readonly placeholder="Please login">
          </div>

          <!-- Dynamic Fields -->
          <div v-for="(field, key) in feat.json" :key="key" class="mb-3">
            <label class="small mb-1 d-flex" :for="key">
              {{ field.string }}
              <span v-if="key === 'amount'" class="ms-auto">
                Balance: <a role="button" class="text-info" @click="form[key] = tokenuser[token] / pf(tokenprotocol.precision)">
                  {{ formatNumber(tokenuser[token] / pf(tokenprotocol.precision), tokenprotocol.precision, '.', ',') }}
                </a> {{ tokenprotocol.token }}
              </span>
            </label>
            <div class="position-relative">
              <span v-if="pfp[key]" class="position-absolute top-50 translate-middle-y mx-1 rounded-circle" :class="{'bg-warning': !validations[key],'bg-success': validations[key], 'bg-light': !form[key]}">
  <img :src="pfp[key]" alt="Recipient Profile Picture" onerror="this.src='/img/no-user.png'" style="width: 30px; height: 30px; border-radius: 50%;">
</span>
              <input
                :type="getInputType(field.type)"
                :class="['form-control', 'text-white', 'bg-dark', 'border-dark', getIcon(key) ? 'ps-4' : '', key === 'amount' ? 'pe-5' : '']"
                :placeholder="field.string === 'To' ? 'Enter username' : 'Enter ' + field.string.toLowerCase()"
                v-model="form[key]"
                @input="validateField(key)"
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
          <button :disabled="!isFormValid" type="submit" class="btn btn-primary" data-bs-dismiss="modal">Send</button>
        </div>
      </form>
    </div>
  </div>`,
    data() {
        return {
            api: "",
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
        // AC(key){
        //     this.accountCheck(this.to).then(r=>{
        //         this.ac = r
        //         if(this.amount)this.valid = true
        //     }).catch(e=>{this.ac = false})
        // },
        getIcon(key) {
          if (key === 'to') return 'fa-at';
          return '';
        },
        isValid(){
            if(this.ac)this.valid = true
        },
        moveTokens() {
          const op = {};
          if (this.tokenprotocol.token === 'HIVE' || this.tokenprotocol.token === 'HBD') {
            op.type = 'xfr';
            op.cj = {
              to: this.form.to,
              [this.tokenprotocol.token.toLowerCase()]: parseFloat(this.form.amount) * 1000,
              memo: this.form.memo || ''
            };
            op.txid = 'sendhive';
            op.msg = `Trying to send ${this.tokenprotocol.token}...`;
            op.ops = ['getHiveUser'];
          } else {
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
          }
            this.$emit('modalsign', op)

        },
        validateField(key) {
          this.validations[key] = false
          const field = this.feat.json[key];
          if (field.check === 'AC') {
            this.accountCheck(this.form[key]).then(result => {
              if (result) {
                this.validations[key] = true;
                if(result === true)this.pfp[key] = '/img/no-user.png'
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
    mounted() {
      const feature = this.tokenprotocol.features[this.func]
      if (feature) {
        this.feat = feature;
        for (const key in feature.json) {
          this.form[key]= ""
          if(feature.json[key]?.check == "AC"){
            this.pfp[key] = '/img/no-user.png'
            this.validations[key] = false;
          }
        }
      } else {
        this.error = "Feature not found";
      }
      console.log(this.feat)
    }
};