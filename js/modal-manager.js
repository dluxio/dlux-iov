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
        type: { default: "move" },
    },
    data() {
        return {
            modalId: `modal-${Math.random().toString(36).substr(2, 9)}`, // e.g., "modal-abc123def"
        };
    },
    template: `<div>
    <slot name="trigger"></slot>
    <teleport to="body">
        <div :id="modalId">
            <Standard v-if="type === 'move' && tokenprotocol.head_block && tokenuser.head_block" 
                :func="func" 
                :account="account" 
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
    mounted() {
        if (this.$slots.trigger) {
            const trigger = this.$el.querySelector(".trigger");
            const modalEl = document.getElementById(this.modalId);
            if (trigger && modalEl) {
              const modal = new bootstrap.Modal(modalEl);
              trigger.addEventListener("click", () => modal.show());
              this.$once("hook:beforeDestroy", () => {
                trigger.removeEventListener("click", () => modal.show());
                modal.dispose();
              });
            }
          }

    }
}
