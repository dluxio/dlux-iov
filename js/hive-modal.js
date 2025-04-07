import MCommon from '/js/methods-common.js'
import MModals from '/js/methods-modals.js'

export default {
    name: 'Hive-Modal',
    props: {
        account: String,
        mypfp: String,
        func: { type: String, default: 'transfer' },
        reqid: String,
        to_account: { type: String, default: '' },
        token: { type: String, default: 'HIVE' },
        tokenstats: Object,
        tokenuser: Object,
    },
    template: `
  <div class="modal-dialog modal-dialog-centered" role="document">
      <div class="modal-content bg-darker text-white">
        <div class="modal-header">
          <h5 class="modal-title">{{ feat ? feat.string : "Loading" }} {{ token }}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <form name="sendtokens" @submit.prevent="moveTokens">
          <div class="modal-body text-start">
            <!-- From Field (Static) -->
            <label class="small mb-1" for="from">From</label>
            <div class="position-relative mb-3">
              <span class="position-absolute top-50 translate-middle-y mx-1 rounded-circle bg-light" style="border-style: solid; border-width: 2px; border-color: rgb(255, 255, 255)">
                <img :src="mypfp" alt="My pfp" @error="fallBackIMG($event, account)" style="width: 30px; height: 30px; border-radius: 50%;">
              </span>
              <input class="ps-4 form-control bg-dark border-dark" type="text" :value="account" readonly placeholder="Please login">
            </div>
            <!-- Dynamic Fields -->
            <div v-for="(field, key) in feat.json" :key="key">
                <div class="mb-3" v-if="field.type !== 'self'">
    <template v-if="field.type === 'B'">
        <div class="form-check">
        <input class="form-check-input" type="checkbox" v-model="form[key]" :id="key">
        <label class="form-check-label" :for="key">{{ field.string }}</label>
        </div>
    </template>
    <template v-else>
        <label class="small mb-1 d-flex" :for="key">
        {{ field.string }}
        <span v-if="field.type === 'amount'" class="ms-auto">
            Balance: <a role="button" class="text-info" @click="form[key] = getDisplayBalance(field)">
            {{ formatNumber(getDisplayBalance(field), getPrecision(field), '.', ',') }}
            </a> {{ getDisplayUnit(field) }}
        </span>
        </label>
        <div class="position-relative">
        <span v-if="field.check === 'AC'" class="position-absolute top-50 translate-middle-y mx-1 rounded-circle bg-light" :style="{
            'border-color': !form[key] ? 'rgb(255, 255, 255)' : validations[key] ? 'rgb(0, 255, 0)' : 'rgb(255, 0, 0)',
            'border-width': '2px',
            'border-style': 'solid'
        }">
            <img :src="pfp[key]" alt="Recipient Profile Picture" @error="fallBackIMG($event, form[key])" style="width: 30px; height: 30px; border-radius: 50%;">
        </span>
        <input
            :type="getInputType(field.type)"
            :class="['form-control', 'text-white', 'bg-dark', 'border-dark', field.check === 'AC' ? 'ps-4' : '', field.type === 'amount' ? 'pe-5' : '']"
            :placeholder="'Enter ' + field.string"
            v-model="form[key]"
            @input="debouncedValidateField(key)"
            @blur="field.check ? validateField(key) : null"
            :step="field.type === 'amount' ? pd(getPrecision(field)) : field.type === 'percent' ? '1' : null"
            :min="field.type === 'amount' ? pd(getPrecision(field)) : field.type === 'percent' ? '0' : null"
            :max="field.type === 'amount' ? getDisplayBalance(field) : field.type === 'percent' ? '10000' : null"
        >
        <span v-if="field.type === 'amount'" class="position-absolute end-0 top-50 translate-middle-y px-2">
            {{ getDisplayUnit(field) }}
        </span>
        </div>
  </template>
  </div>
</div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button :disabled="!isFormValid" type="submit" class="btn btn-primary" data-bs-dismiss="modal">{{ feat.string }}</button>
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
            key: "active",
            pfp: {},
            tokenprotocol: {
                precision: 3,
                token: 'HIVE',
                features: {
                    cancel_transfer_from_savings: {
                        id: "cancel_transfer_from_savings",
                        key: "active",
                        string: "Cancel Transfer From Savings",
                        info: "Any unexecuted withdrawl can be canceled to protect funds.",
                        json: {
                            from: {
                                type: "self",
                            },
                            request_id: {
                                type: "prop",
                                name: "reqid"
                            }
                        }
                    },
                    claim_account: {
                        id: "claim_account",
                        key: "active",
                        string: "Claim Account",
                        info: "Account Creation Tokens are claimed with excess resource credits",
                        json: {
                            creator: {
                                type: "self",
                            },
                            fee: {
                                static: "0.000 HIVE"
                            },
                            extensions: {
                                static: []
                            },
                        }
                    },
                    collateralized_convert: {
                        id: "collateralized_convert",
                        key: "active",
                        string: "Convert HIVE to HBD",
                        info: "The collateralized_convert operation instructs the blockchain to convert HIVE to HBD. The operation is performed after a 3.5 days delay, but the owner gets HBD immediately. The price risk is cushioned by extra HIVE. After actual conversion takes place the excess HIVE is returned to the owner.",
                        json: {
                            owner: {
                                type: "self",
                            },
                            amount: { type: "amount", asset: "HIVE" },
                            requestid: {
                                type: "func",
                                name: "buildID"
                            }
                        }
                    },
                    convert: {
                        id: "convert",
                        key: "active",
                        string: "Convert HBD to HIVE",
                        info: "This operation instructs the blockchain to start a conversion between HIVE and HBD, the funds are deposited after 3.5 days.",
                        json: {
                            owner: {
                                type: "self",
                            },
                            amount: { type: "amount", asset: "HBD" },
                            requestid: {
                                type: "func",
                                name: "buildID"
                            }
                        }
                    },
                    delegate_vesting_shares: {
                        id: "delegate_vesting_shares",
                        key: "active",
                        string: "Delegate HIVE Power",
                        info: "Delegate vesting shares from one account to the other. The vesting shares are still owned by the original account, but content voting rights and resource credit are transferred to the receiving account. This sets the delegation to vesting_shares, increasing it or decreasing it as needed (i.e. a delegation of 0 removes the delegation).When a delegation is removed the shares are placed in limbo for a week to prevent using them and voting on the same content twice.",
                        json: {
                            delegator: {
                                type: "self",
                            },
                            delegatee: {
                                type: "S",
                                string: "To",
                                req: true,
                                check: "AC"
                            },
                            vesting_shares: { type: "amount", asset: "VESTS" }
                        }
                    },
                    recurrent_transfer: {
                        id: "recurrent_transfer",
                        key: "active",
                        string: "Transfer Recurrently",
                        info: "",
                        json: {
                            from: {
                                type: "self",
                            },
                            to: {
                                type: "S",
                                string: "To",
                                req: true,
                                check: "AC"
                            },
                            amount: { type: "amount", asset: "token" },
                            memo: {
                                type: "S",
                                string: "Memo",
                                req: false
                            },
                        }
                    },
                    set_withdraw_vesting_route: {
                        id: "set_withdraw_vesting_route",
                        key: "active",
                        string: "Set Route",
                        info: "Allows an account to setup a vesting withdraw but with the additional request for the funds to be transferred directly to another account’s balance rather than the withdrawing account. In addition, those funds can be immediately vested again, circumventing the conversion from vests to hive and back, guaranteeing they maintain their value.",
                        json: {
                            from_account: {
                                type: "self",
                            },
                            to_account: {
                                type: "S",
                                string: "To",
                                req: true,
                                check: "AC"
                            },
                            percent: {
                                type: "percent",
                                string: "Percent",
                                req: true
                            },
                            auto_vest: {
                                type: "B",
                                string: "Direct to Hive Power",
                                req: true
                            }
                        }
                    },
                    transfer: {
                        id: "transfer",
                        key: "active",
                        string: "Send",
                        info: "Transfers asset from one account to another. The memo is plain-text, any encryption on the memo is up to a higher level protocol",
                        json: {
                            from: {
                                type: "self",
                            },
                            to: {
                                type: "S",
                                string: "To",
                                req: true,
                                check: "AC"
                            },
                            amount: { type: "amount", asset: "token" },
                            memo: {
                                type: "S",
                                string: "Memo",
                                req: false
                            },
                        }
                    },
                    transfer_from_savings: {
                        id: "transfer_from_savings",
                        key: "active",
                        string: "Transfer from Savings",
                        info: "Funds withdrawals from the savings to an account take three days",
                        json: {
                            from: {
                                type: "self",
                            },
                            to: {
                                type: "S",
                                string: "To",
                                req: true,
                                check: "AC"
                            },
                            amount: { type: "amount", asset: "token" },
                            memo: {
                                type: "S",
                                string: "Memo",
                                req: false
                            },
                            request_id: {
                                type: "func",
                            },
                        }
                    },
                    transfer_to_vesting: {
                        id: "transfer_to_vesting",
                        key: "active",
                        string: "Power Up",
                        info: "This operation converts HIVE into VFS (Vesting Fund Shares) at the current exchange rate. With this operation it is possible to give another account vesting shares so that faucets can pre-fund new accounts with vesting shares.",
                        json: {
                            from: {
                                type: "self",
                            },
                            to: {
                                type: "S",
                                string: "To",
                                req: true,
                                check: "AC"
                            },
                            amount: { type: "amount", asset: "HIVE" },
                        }
                    },
                    transfer_to_savings: {
                        id: "transfer_to_savings",
                        key: "active",
                        string: "Transfer to Savings",
                        info: "For time locked savings accounts. A user can place Hive and Hive Dollars into time locked savings balances. Funds can be withdrawn from these balances after a three day delay. The point of this addition is to mitigate loss from hacked and compromised account. The max a user can lose instantaneously is the sum of what the hold in liquid balances. Assuming an account can be recovered quickly, loss in such situations can be kept to a minimum.",
                        json: {
                            from: {
                                type: "self",
                            },
                            to: {
                                type: "S",
                                string: "To",
                                req: true,
                                check: "AC"
                            },
                            amount: { type: "amount", asset: "token" },
                            memo: {
                                type: "S",
                                string: "Memo",
                                req: false
                            },
                        }
                    },
                    withdraw_vesting: {
                        id: "withdraw_vesting",
                        key: "active",
                        string: "Power Down",
                        info: "At any given point in time an account can be withdrawing from their vesting shares. A user may change the number of shares they wish to cash out at any time between 0 and their total vesting stake. After applying this operation, vesting_shares will be withdrawn at a rate of vesting_shares/13 per week for 13 weeks starting one week after this operation is included in the blockchain. This operation is not valid if the user has no vesting shares.",
                        json: {
                            account: {
                                type: "self",
                            },
                            vesting_shares: { type: "amount", asset: "VESTS" }
                        }
                    },
                },
            },
            valid: false,
            validations: {}
        };
    },
    methods: {
        ...MCommon,
        ...MModals,
        buildID() {
            return Math.floor(Math.random() * 100000000);
        },
        getIcon(key) {
            return key === 'to' || key === 'delegatee' || key === 'to_account' ? 'fa-at' : '';
        },
        getAsset(field) {
            return field.asset === "token" ? this.token : field.asset;
        },
        getPrecision(field) {
            const asset = this.getAsset(field);
            return (asset === "HIVE" || asset === "HBD") ? 3 : asset === "VESTS" ? 6 : 0;
        },
        parseBalance(balanceStr) {
            return parseFloat(balanceStr.split(' ')[0]);
        },
        getRawBalance(field) {
            const asset = this.getAsset(field);
            if (asset === "HIVE") return this.tokenuser.balance;
            if (asset === "HBD") return this.tokenuser.hbd_balance;
            if (asset === "VESTS") return this.tokenuser.vesting_shares;
            return "0";
        },
        vestsToHP(vests) {
            if (!this.tokenstats || !this.tokenstats.total_vesting_fund_hive || !this.tokenstats.total_vesting_shares) {
                return vests;
            }
            const fund = this.parseBalance(this.tokenstats.total_vesting_fund_hive);
            const shares = this.parseBalance(this.tokenstats.total_vesting_shares);
            return vests * (fund / shares);
        },
        hpToVests(hp) {
            if (!this.tokenstats || !this.tokenstats.total_vesting_fund_hive || !this.tokenstats.total_vesting_shares) {
                return hp;
            }
            const fund = this.parseBalance(this.tokenstats.total_vesting_fund_hive);
            const shares = this.parseBalance(this.tokenstats.total_vesting_shares);
            return hp * (shares / fund);
        },
        getDisplayUnit(field) {
            const asset = this.getAsset(field);
            return asset === "VESTS" ? "HP" : asset;
        },
        getDisplayBalance(field) {
            const rawBalance = this.parseBalance(this.getRawBalance(field));
            const asset = this.getAsset(field);
            return asset === "VESTS" ? this.vestsToHP(rawBalance) : rawBalance;
        },
        moveTokens() {
            const opid = this.feat.id;
            const opParams = {};
            for (const param in this.feat.json) {
                const field = this.feat.json[param];
                if (field.type === "self") {
                    opParams[param] = this.account;
                } else if (field.type === "amount") {
                    const precision = this.getPrecision(field);
                    const asset = this.getAsset(field);
                    const inputValue = parseFloat(this.form[param]);
                    const rawValue = asset === "VESTS" ? this.hpToVests(inputValue) : inputValue;
                    opParams[param] = rawValue.toFixed(precision) + " " + asset;
                } else if (field.type === "percent") {
                    opParams[param] = parseInt(this.form[param], 10);
                } else if (field.type === "func") {
                    opParams[param] = this[field.name]();
                } else if (field.type === "prop") {
                    opParams[param] = this[field.name];
                } else if (field.type === "static") {
                    opParams[param] = field.value;
                } else {
                    opParams[param] = this.form[param];
                }
            }
            const op = {
                type: "raw",
                op: [[opid, opParams]],
                key: this.feat.key,
                id: `${opid} ${this.account}`,
                msg: this.feat.string,
                ops: ["getHiveUser"],
                txid: opid
            };
            this.$emit('modalsign', op)

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
                if (feature.json[key].type === "B") {
                    this.form[key] = false; // Boolean fields start as false
                } else if (feature.json[key].type === "percent") {
                    this.form[key] = ""; // Empty string for number input
                } else if (feature.json[key].type !== "self") {
                    this.form[key] = "";
                }
                if (feature.json[key]?.check == "AC") {
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