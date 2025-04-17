import MCommon from '/js/methods-common.js'
import MModals from '/js/methods-modals.js'

export default {
    name: 'Extend',
    props: {
        account: String,
        func: "extend",
        token: "balance",
        tokenprotocol: {
            default: function () {
                return {
                    precision: 3,
                    token: "HIVE",
                };
            },
        },
        tokenstats: Object,
        tokenuser: Object,
        test: false
    },
    template: `<div class="modal fade" role="dialog" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered" role="document">
          <div class="modal-content bg-darker text-white">
              <div class="modal-header">
                  <h5 class="modal-title">Send {{tokenprotocol.token}}</h5> <button type="button" class="btn-close " data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <form name="sendhive">
                    <div class="modal-body text-start">
                      <label class="small mb-1" for="sendhivefrom">From</label>
                      <div class="position-relative mb-3">
                        <span class="position-absolute top-50 translate-middle-y ps-2">
                          <i class="fa-solid fa-at fa-fw"></i>
                        </span>
                        <input class="ps-4 form-control bg-dark border-dark" type="text" placeholder="Please login" :value="account" readonly>
                      </div>
                      <label class="small mb-1" for="sendhiveto">To</label>
                      <div class="position-relative mb-3">
                        <span class="position-absolute top-50 translate-middle-y ps-2">
                          <i class="fa-solid fa-at fa-fw"></i>
                        </span>
                        <input @blur="AC()" @input="valid = false; ac = false" class="ps-4 form-control text-white bg-dark border-dark" type="text" placeholder="Payment recipient" v-model="to">
                      </div>
                      <label class="small mb-1 d-flex" for="sendAmount">Amount 
                        <span class="ms-auto">
                          Balance: <a role="button" class="text-info" @click="amount = tokenuser[token] / pf(tokenprotocol.precision)">{{formatNumber((tokenuser[token])/pf(tokenprotocol.precision), tokenprotocol.precision, '.', ',')}}</a> {{tokenprotocol.token}}
                        </span>
                      </label>
                      <div class="position-relative mb-3">
                        <input @input="isValid()" class="pe-5 form-control text-white bg-dark border-dark" type="number" :step="pd(tokenprotocol.precision)" :min="pd(tokenprotocol.precision)" :max="tokenuser[token] / pf(tokenprotocol.precision)" placeholder="Enter amount" v-model="amount">
                        <span class="position-absolute end-0 top-50 translate-middle-y px-2">
                          {{tokenprotocol.token}}
                        </span>
                      </div>
                      <label class="small mb-1" for="sendhivememo">Memo</label>
                      <div class="input-group">
                        <input class="form-control text-white bg-dark border-dark" type="text" placeholder="Include a memo (optional)" v-model="memo">
                      </div>
                  </div>
                  <div class="modal-footer"> 
                    <div class="me-auto btn-group border border-info rounded px-2 py-1" role="group" aria-label="Transaction on Test Network Only" v-if="test">
                      <input type="checkbox" v-model="testTx" class="me-2">
                      <label for="sendmirror">Test Network Only</label>
                    </div>
                  <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button> 
                  <button :disabled="!valid" type="submit" class="btn btn-primary" @click="send" >Send</button> 
                  </div>
              </form>
          </div>
      </div>
  </div>`,
    data() {
        return {
            ac: false,
            amount: 0,
            api: "",
            memo: "",
            testTx: false,
            to: '',
            valid: false,
        };
    },
    methods: {
        ...MCommon,
        ...MModals,
        AC(){
            this.apiSelector(0)
            this.accountCheck(this.to).then(r=>{
                this.ac = r
                if(this.amount)this.valid = true
            }).catch(e=>{this.ac = false})
        },
        isValid(){
            if(this.ac)this.valid = true
        },
        sendTokens() {
            var op
            if (this.tokenprotocol.token == "HIVE" || this.tokenprotocol.token == "HBD") {
                op = {
                    type: "xfr",
                    cj: {
                      to: this.to,
                      [this.tokenprotocol.token.toLowerCase()]: this.amount * 1000,
                      memo: this.memo,
                    },
                    txid: "sendhive",
                    msg: `Trying to send ${this.tokenprotocol.token}...`,
                    ops: ["getHiveUser"],
                  };
            } else {
                const jsonID = this.tokenprotocol.features[`${this.func}_json`]
                op = {
                    type: "cja",
                    cj: {
                        to: this.to,
                        amount: parseInt(this.amount * this.pf(this.tokenprotocol.precision)),
                        memo: this.memo,
                    },
                    id: `${this.tokenprotocol.prefix}${jsonID}`,
                    msg: `Sending ${this.token == "balance" ? this.tokenprotocol.token : this.token.toUpperCase()}`,
                    ops: ["getTokenUser"],
                    api: this.api,
                    txid: this.func,
                }
            }
            this.$emit('tosign', op)

        }
    },
    mounted() {
        //this.apiSelector(0) //use user interaction like blur to drive this to prevent network floods
    }
};