const { Modal } = bootstrap;

export default {
  data() {
    return {
      spkprefix: "TESTspkcc",
    };
  },
  template: `
    <div>
        <div class="modal fade" id="send" :tabindex="i" role="dialog" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content bg-darker text-white">
                    <div class="modal-header">
                        <h5 class="modal-title">Send {{token}}</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <form name="sendhive">
                        <div class="modal-body">
                                <label class="small" for="sendhivefrom">From:</label>
                                <div class="input-group mb-3">
                                        <span class="input-group-text bg-dark border-dark text-secondary">@</span>
                                    <input class="form-control text-white bg-dark border-dark" type="text" placeholder="Please login" :value="account"
                                        readonly>
                                </div>
                                <label class="small" for="sendhiveto">To:</label>
                                <div class="input-group mb-3">
                                        <span class="input-group-text bg-dark border-dark text-secondary">@</span>
                                    <input @blur="accountCheck" class="form-control text-white bg-dark border-dark" type="text" placeholder="Payment recipient" v-model="to">
                                </div>
                                <label class="small" for="sendAmount">Amount (Balance: <a href="#/"
                                        @click="amount = balance / 1000">{{formatNumber((balance)/1000, 3, '.', ',')}}</a> {{token}}):</label>
                                <div class="input-group mb-3">
                                    <input class="form-control text-white bg-dark border-dark" id="sendAmount" type="number" step="0.001"
                                        min="0.001" placeholder="Enter amount" v-model="amount">
                                        <span class="input-group-text bg-dark border-dark text-secondary">{{token}}</span>
                                </div>
                                <label class="small" for="sendhivememo">Memo:</label>
                                <div class="input-group mb-3">
                                    <input class="form-control text-white bg-dark border-dark" type="text"
                                        placeholder="Include a memo (optional)" v-model="memo">
                                </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button :disabled="!valid" type="submit" class="btn btn-primary" @click="send">Send</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        <div class="modal fade" id="delegate" :tabindex="i" role="dialog" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content bg-darker text-white">
                    <div class="modal-header">
                        <h5 class="modal-title">Delegate {{token}}</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <form name="sendhive">
                        <div class="modal-body">
                                <label for="sendhivefrom" class="small">From:</label>
                                <div class="input-group mb-3">
                                        <div class="input-group-text bg-dark border-secondary text-secondary">@</div>
                                    <input class="form-control bg-dark border-secondary text-white" type="text" placeholder="Please login" :value="account"
                                        readonly>
                                </div>
                                <label for="sendhiveto" class="small">To:</label>
                                <div class="input-group mb-3" v-if="token == 'LARYNX'">
                                  <span class="input-group-text bg-dark border-secondary text-secondary">@</span>
                                  <select class="form-select text-white bg-dark border-secondary" id="datalistOptions" v-model="to">
                                    <option value="" disabled selected>Select node operator</option>
                                     <option v-for="node in smarkets" :value="node.self">{{node.self}}</option>
                                  </select>
                                </div>
                                <div class="input-group mb-3" v-if="token == 'DLUX'">
                                        <span class="input-group-text bg-dark border-secondary text-secondary">@</span>
                                    <input @blur="accountCheck" class="form-control bg-dark border-secondary text-white" type="text" placeholder="Recipient" v-model="to">
                                </div>
                                <label for="delAmount" class="small">Amount (Balance: <a href="#/"
                                        @click="amount = balance / 1000">{{formatNumber((balance)/1000, 3, '.', ',')}}</a> {{token}}):</label>
                                <div class="input-group mb-3">
                                    <input class="form-control bg-dark border-secondary text-white" type="number" step="0.001" id="delAmount" 
                                        min="0.001" placeholder="Enter amount" v-model="amount">
                                        <span class="input-group-text bg-dark border-secondary text-secondary">{{token}}</span>
                                </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button :disabled="!to" type="submit" class="btn btn-primary" @click="delegate">Confirm</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        <div class="modal fade" id="power" tabindex="-1" role="dialog" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content bg-darker text-white">
                    <div class="modal-header">
                        <h5 class="modal-title">{{func}} {{token}}</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <form name="power">
                        <div class="modal-body">
                                <label for="poweramount" class="small">Amount (Balance: <a href="#/"
                                        @click="amount = balance / 1000">{{formatNumber((balance)/1000, 3, '.', ',')}}</a> {{token}}):</label>
                                <div class="input-group mb-3" id="poweramount">
                                    <input class="form-control text-white border-dark bg-dark" type="number" step="0.001"
                                        min="0.001" placeholder="1.000" v-model="amount">
                                        <span class="input-group-text text-secondary border-dark bg-dark">{{token}}</span>
                                </div>
                            </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" @click="power">Continue</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        <div class="modal fade" id="confirm" tabindex="-1" role="dialog" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content bg-darker text-white">
                    <div class="modal-header">
                        <h5 class="modal-title">{{func}} {{token}}</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <form name="power">
                        <div class="modal-body">
                                <label for="poweramount" class="small">Amount (Balance: <a href="#/"
                                        @click="amount = balance / 1000">{{formatNumber((balance)/1000, 3, '.', ',')}}</a> {{token}}):</label>
                                <div class="input-group mb-3" id="poweramount">
                                    <input class="form-control text-white border-dark bg-dark" type="number" step="0.001"
                                        min="0.001" placeholder="1.000" v-model="amount">
                                        <span class="input-group-text text-secondary border-dark bg-dark">{{token}}</span>
                                </div>
                            </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" @click="power">Continue</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        <slot name="trigger"></slot>
    </div>`,
  methods: {
    accountCheck() {
      fetch("https://anyx.io", {
        body: `{\"jsonrpc\":\"2.0\", \"method\":\"condenser_api.get_accounts\", \"params\":[[\"${this.to}\"]], \"id\":1}`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        method: "POST",
      })
        .then((r) => {
          return r.json();
        })
        .then((re) => {
          if (re.result.length) this.valid = true;
          else this.valid = false;
        });
    },
    formatNumber(t, n, r, e) {
      if (typeof t != "number") t = parseFloat(t);
      if (isNaN(t)) return "Invalid Number";
      if (!isFinite(t)) return (t < 0 ? "-" : "") + "infinite";
      (r = r || "."), (e = e || "");
      var u = t < 0;
      t = Math.abs(t);
      var a = (null != n && 0 <= n ? t.toFixed(n) : t.toString()).split("."),
        i = a[0],
        o = 1 < a.length ? r + a[1] : "";
      if (e)
        for (var c = /(\d+)(\d{3})/; c.test(i); )
          i = i.replace(c, "$1" + e + "$2");
      return (u ? "-" : "") + i + o;
    },
    send() {
      var op;
      if (this.token == "DLUX")
        op = {
          type: "cja",
          cj: {
            to: this.to,
            amount: parseInt(this.amount * 1000),
            memo: this.memo,
          },
          id: `${this.token.toLowerCase()}_send`,
          msg: `Trying to send ${this.token}...`,
          ops: ["getTokenUser"],
          txid: "send",
        };
      else if (this.token == "SPK")
        op = {
          type: "cja",
          cj: {
            to: this.to,
            amount: parseInt(this.amount * 1000),
            memo: this.memo,
          },
          id: `${this.spkprefix}_spk_send`,
          msg: `Trying to send ${this.token}...`,
          ops: ["getSapi"],
          txid: "send",
        };
      else if (this.token == "LARYNX")
        op = {
          type: "cja",
          cj: {
            to: this.to,
            amount: parseInt(this.amount * 1000),
            memo: this.memo,
          },
          id: `${this.spkprefix}_send`,
          msg: `Trying to send ${this.token}...`,
          ops: ["getSapi"],
          txid: "send",
        };
      else if (this.token == "HIVE")
        op = {
          type: "xfr",
          cj: {
            to: this.to,
            hive: this.amount * 1000,
            memo: this.memo,
          },
          txid: "sendhive",
          msg: `Trying to send ${this.token}...`,
          ops: ["getHiveUser"],
        };
      else if (this.token == "HBD")
        op = {
          type: "xfr",
          cj: {
            to: this.to,
            hbd: this.amount * 1000,
            memo: this.memo,
          },
          txid: "sendhbd",
          msg: `Trying to send ${this.token}...`,
          ops: ["getHiveUser"],
        };
      if (op) {
        this.$emit("modalsign", op);
      }
    },
    delegate() {
      var op;
      if (this.token == "DLUX")
        op = {
          type: "cja",
          cj: {
            to: this.to,
            amount: parseInt(this.amount * 1000),
          },
          id: `${this.token.toLowerCase()}_power_grant`,
          msg: `Trying to send ${this.token}...`,
          ops: ["getTokenUser"],
          txid: "delegate",
        };
      // else if (this.token == "SPK")
      //   op = {
      //     type: "cja",
      //     cj: {
      //       to: this.to,
      //       amount: parseInt(this.amount * 1000),
      //       memo: this.memo,
      //     },
      //     id: `${this.spkprefix}_spk_send`,
      //     msg: `Trying to send ${this.token}...`,
      //     ops: ["getSapi"],
      //     txid: "delegate",
      //   };
      else if (this.token == "LARYNX")
        op = {
          type: "cja",
          cj: {
            to: this.to,
            amount: parseInt(this.amount * 1000),
          },
          id: `${this.spkprefix}_power_grant`,
          msg: `Trying to delegate ${this.token}...`,
          ops: ["getSapi"],
          txid: "delegate",
        };
      // else if (this.token == "HIVE")
      //   op = {
      //     type: "xfr",
      //     cj: {
      //       to: this.to,
      //       hive: this.amount * 1000,
      //       memo: this.memo,
      //     },
      //     txid: "delegate",
      //     msg: `Trying to send ${this.token}...`,
      //     ops: ["getHiveUser"],
      //   };
      // else if (this.token == "HBD")
      //   op = {
      //     type: "xfr",
      //     cj: {
      //       to: this.to,
      //       hbd: this.amount * 1000,
      //       memo: this.memo,
      //     },
      //     txid: "delegate",
      //     msg: `Trying to send ${this.token}...`,
      //     ops: ["getHiveUser"],
      //   };
      if (op) {
        this.$emit("modalsign", op);
      }
    },
    power() {
      var op;
      if (this.token == "DLUX" && this.func == "Power Up")
        op = {
          type: "cja",
          cj: {
            amount: parseInt(this.amount * 1000),
          },
          id: `${this.token.toLowerCase()}_power_up`,
          msg: `Trying to power up ${this.token}...`,
          ops: ["getTokenUser"],
          txid: "send",
        };
      else if (this.token == "DLUX" && this.func == "Power Down")
        op = {
          type: "cja",
          cj: {
            amount: parseInt(this.amount * 1000),
          },
          id: `${this.token.toLowerCase()}_power_down`,
          msg: `Trying to power down ${this.token}...`,
          ops: ["getTokenUser"],
          txid: "send",
        };
      else if (this.token == "DLUX" && this.func == "Unlock")
        op = {
          type: "cja",
          cj: {
            amount: parseInt(this.amount * 1000),
          },
          id: `${this.token.toLowerCase()}_gov_down`,
          msg: `Trying to unlock ${this.token}...`,
          ops: ["getTokenUser"],
          txid: "send",
        };
      else if (this.token == "DLUX" && this.func == "Lock")
        op = {
          type: "cja",
          cj: {
            amount: parseInt(this.amount * 1000),
          },
          id: `${this.token.toLowerCase()}_gov_down`,
          msg: `Trying to lock ${this.token}...`,
          ops: ["getTokenUser"],
          txid: "send",
        };
      // else if (this.token == "SPK")
      //   op = {
      //     type: "cja",
      //     cj: {
      //       to: this.to,
      //       amount: parseInt(this.amount * 1000),
      //       memo: this.memo,
      //     },
      //     id: `${this.spkprefix}_spk_send`,
      //     msg: `Trying to send ${this.token}...`,
      //     ops: ["getSapi"],
      //     txid: "send",
      //   };
      else if (this.token == "LARYNX" && this.func == "Power Up")
        op = {
          type: "cja",
          cj: {
            amount: parseInt(this.amount * 1000),
          },
          id: `${this.spkprefix}_power_up`,
          msg: `Trying to power up ${this.token}...`,
          ops: ["getSapi"],
          txid: "send",
        };
      else if (this.token == "LARYNX" && this.func == "Unlock")
        op = {
          type: "cja",
          cj: {
            amount: parseInt(this.amount * 1000),
          },
          id: `${this.spkprefix}_gov_down`,
          msg: `Trying to unlock ${this.token}...`,
          ops: ["getSapi"],
          txid: "send",
        };
      else if (this.token == "LARYNX" && this.func == "Lock")
        op = {
          type: "cja",
          cj: {
            amount: parseInt(this.amount * 1000),
          },
          id: `${this.spkprefix}_gov_up`,
          msg: `Trying to lock ${this.token}...`,
          ops: ["getSapi"],
          txid: "send",
        };
      // else if (this.token == "HIVE")
      //   op = {
      //     type: "xfr",
      //     cj: {
      //       to: this.to,
      //       hive: this.amount * 1000,
      //       memo: this.memo,
      //     },
      //     txid: "sendhive",
      //     msg: `Trying to send ${this.token}...`,
      //     ops: ["getHiveUser"],
      //   };
      // else if (this.token == "HBD")
      //   op = {
      //     type: "xfr",
      //     cj: {
      //       to: this.to,
      //       hbd: this.amount * 1000,
      //       memo: this.memo,
      //     },
      //     txid: "sendhbd",
      //     msg: `Trying to send ${this.token}...`,
      //     ops: ["getHiveUser"],
      //   };
      if (op) {
        this.$emit("modalsign", op);
      }
    },
  },
  emits: ["modalsign"],
  props: {
    content: {
      required: false,
      default: "",
    },
    trigger: {
      default: "click",
    },
    i: {
      default: -1,
    },
    dis: {
      default: false,
    },
    smarkets: {
      default: function () {
        return {
          na: {
            self: "",
          },
        };
      },
    },
    delay: {
      default: 0,
    },
    html: {
      default: false,
    },
    type: {
      default: "send",
    },
    func: {
      default: "Power Up",
    },
    account: {
      default: "Not Logged In",
    },
    token: {
      default: "Dlux",
    },
    to: {
      default: "",
    },
    memo: {
      default: "",
    },
    balance: {
      default: 0,
    },
    amount: {
      default: 0.001,
    },
    valid: {
      default: false,
    },
    customClass: {
      default: "",
    },
    html: {
      default: true,
    },
  },
  mounted() {
    var options = this.$props;
    var trigger = this.$slots["trigger"][0].elm;
    var target = this.$el.children[options.type];
    document.getElementById("app").appendChild(target);
    console.log(options.type, target);
    trigger.addEventListener("click", () => {
      var theModal = new Modal(target, () => {});
      theModal.show();
    });
  },
};