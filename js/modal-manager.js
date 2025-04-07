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
        smarkets: Object,
        type: { default: "move" },
        mypfp: String,
    },
    data() {
        return {
            modalId: `modal-${Math.random().toString(36).substr(2, 9)}`,
            showModalListener: null,
            modalInstance: null,
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
                :tokenprotocol="tokenprotocol" 
                :tokenuser="tokenuser" 
                @modalsign="$emit('modalsign', $event)" />
            <Hive v-if="(token === 'HIVE' || token === 'HBD' || token === 'HP') && tokenstats?.content_reward_percent" 
                :func="func" 
                :account="account"
                :mypfp="mypfp"
                :token="token" 
                :tokenuser="tokenuser"
                :to_account="type"
                :reqid="type"
                :tokenstats="tokenstats"
                @modalsign="$emit('modalsign', $event)" />
            <Contract v-if="type === 'contract' && tokenuser.head_block" 
                :account="account"
                :api="api"
                :mypfp="mypfp"
                :tokenuser="tokenuser" 
                :tokenstats="tokenstats"
                @modalsign="$emit('modalsign', $event)" />
            <Election v-if="type === 'election' && tokenprotocol.head_block && tokenuser.head_block" 
                :account="account"
                :api="api"
                :tokenprotocol="tokenprotocol" 
                :tokenuser="tokenuser" 
                :smarkets="smarkets"
                @modalsign="$emit('modalsign', $event)" />
        </div>
    </teleport>
  </div>`,
    methods: {
        modalsign(op) {
            this.$emit("modalsign", op)
        },
    },
    emits: ["modalsign"],
    computed: {
        canShowModal() {
            if (this.type === 'move') {
                return this.tokenprotocol.head_block && this.tokenuser.head_block;
            } else if (this.type === 'contract') {
                return !!this.tokenuser.head_block
            } else if (this.type === 'election') {
                return this.tokenprotocol.head_block && this.tokenuser.head_block;
            } else {
                return true
            }
            return false; // Default case if type is unrecognized
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
