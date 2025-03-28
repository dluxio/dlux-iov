import Contract from "/js/contract-modal.js";
import Election from "/js/election-modal.js";
import Standard from "/js/standard-modal.js";

export default {
    name: "ModalVue",
    components: {
        "Contract": Contract,
        "Election": Election,
        "Standard": Standard,
    },
    props: {
        account: { default: "Please login" },
        func: { default: "send" },
        tokenprotocol: {
            default: () => ({ head_block: 0 }),
        },
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
                :mypfp="mypfp"
                :tokenprotocol="tokenprotocol" 
                :tokenuser="tokenuser" 
                @modalsign="$emit('modalsign', $event)" />
            <Contract v-if="type === 'contract' && tokenprotocol.head_block && tokenuser.head_block" 
                :account="account" 
                :tokenprotocol="tokenprotocol" 
                :tokenuser="tokenuser" 
                @modalsign="$emit('modalsign', $event)" />
            <Election v-if="type === 'election' && tokenprotocol.head_block && tokenuser.head_block" 
                :account="account" 
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
                return this.tokenprotocol.head_block && this.tokenuser.head_block;
            } else if (this.type === 'election') {
                return this.tokenprotocol.head_block && this.tokenuser.head_block;
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
