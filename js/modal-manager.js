import Contract from "/js/contract-modal.js"
import Election from "/js/election-modal.js"
import Standard from "/js/standard-modal.js"
import HiveWallet from "/js/hive-modal.js"

export default {
    name: "ModalVue",
    components: {
        "Contract": Contract,
        "Election": Election,
        "Standard": Standard,
        "Hive": HiveWallet
    },
    props: {
        account: { default: "Please login" },
        api: String,
        func: { default: "send" },
        token: { default: "balance" },
        tokenprotocol: {
            default: () => ({ head_block: 0 }),
        },
        tokenstats: Object,
        tokenuser: {
            default: () => ({ head_block: 0 }),
        },
        to_account: { default: "" },
        smarkets: Object,
        type: { default: "move" },
        reqid: String,
        mypfp: String,
    },
    data() {
        return {
            modalId: `modal-${Math.random().toString(36).substr(2, 9)}`,
            showModalListener: null,
            modalInstance: null,
            mutablefunc: "",
        };
    },
    template: `<div>
    <slot name="trigger"></slot>
    <teleport to="body" v-if="canShowModal">
        <div :id="modalId" class="modal fade" role="dialog" aria-hidden="true">
            <Standard v-if="type === 'move' && tokenprotocol.head_block && tokenuser.head_block" 
                :func="func" 
                :account="account"
                :api="api"
                :mypfp="mypfp"
                :token="token"
                :to_account="to_account"
                :tokenprotocol="tokenprotocol" 
                :tokenuser="tokenuser" 
                @tosign="$emit('tosign', $event)" />
            <Hive v-if="(token === 'HIVE' || token === 'HBD' || token === 'HP' || token === 'RC') && tokenstats?.content_reward_percent" 
                :func="mutablefunc || func" 
                :account="account"
                :mypfp="mypfp"
                :token="token" 
                :tokenuser="tokenuser"
                :to_account="to_account"
                :reqid="reqid"
                :type="type"
                :tokenstats="tokenstats"
                @open-modal="openModal($event)"
                @tosign="$emit('tosign', $event)" />
            <Contract v-if="type === 'contract' && tokenuser.head_block" 
                :account="account"
                :api="api"
                :mypfp="mypfp"
                :tokenuser="tokenuser"
                :to_amount="to_account?.amount"
                :to_broker="to_account?.broker"
                :tokenstats="tokenstats"
                @tosign="sendIt" />
            <Election v-if="type === 'election' && tokenprotocol.head_block && tokenuser.head_block" 
                :account="account"
                :api="api"
                :tokenprotocol="tokenprotocol" 
                :tokenuser="tokenuser" 
                :smarkets="smarkets"
                @tosign="$emit('tosign', $event)" />
        </div>
    </teleport>
  </div>`,
    methods: {
        sendIt(op) {
            console.log('mm')
            this.$emit("tosign", op)
        },
        openModal(data){
            console.log(data, 1234)
            if(data){
                this.mutablefunc = data
            } else {
                this.mutablefunc = this.func
            }
          },
    },
    emits: ["tosign"],
    computed: {
        canShowModal() {
            if (this.type === 'move') {
                return this.tokenprotocol.head_block && this.tokenuser.head_block;
            } else if (this.type === 'contract') {
                return !!this.tokenuser.head_block
            } else if (this.type === 'election') {
                return this.tokenprotocol.head_block && this.tokenuser.head_block;
            } else {
                return !!(this.tokenuser.id && this.tokenstats.content_reward_percent)
            }
        },
    },
    mounted() {
        if (this.$slots.trigger) {
            const trigger = this.$el.querySelector(".trigger")
            const modalEl = document.getElementById(this.modalId)
            if (trigger && modalEl) {
                const modal = new bootstrap.Modal(modalEl)
                const showModal = () => modal.show()
                trigger.addEventListener("click", showModal)
                this.showModalListener = showModal;
                this.modalInstance = modal
            }
        }

    },
    beforeUnmount() {
        if (this.showModalListener && this.modalInstance) {
            const trigger = this.$el.querySelector(".trigger")
            if (trigger) {
                trigger.removeEventListener("click", this.showModalListener)
            }
            this.modalInstance.dispose()
        }
    },
}
