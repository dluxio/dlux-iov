import Contract from "/js/contract-modal.js";
import Election from "/js/election-modal.js";
// import Extend from "/js/extend-modal.js";
import Standard from "/js/standard-modal.js";

export default {
    name: "ModalVue",
    components: {
        "Contract": Contract,
        "Election": Election,
        // "Extend": Extend,
        "Standard": Standard,
    },
    props: {
        account: { default: "Please login" },
        func: { default: "send" },
        tokenprotocol: {
            default: () => ({ head_block: 0 }),
        },
        tokenstats: {
            default: () => ({ head_block: 0 }),
        },
        tokenuser: {
            default: () => ({ head_block: 0 }),
        },
        type: { default: "move" },
    },
    template: `<div>
    <slot name="trigger"></slot>
    <teleport to="body">
      <Standard v-if="type === 'move'" 
                :func="func" 
                :account="account" 
                :tokenprotocol="tokenprotocol" 
                :tokenstats="tokenstats" 
                :tokenuser="tokenuser" 
                @modalsign="$emit('modalsign', $event)" />
      <Contract v-if="type === 'contract'" 
                :account="account" 
                :tokenprotocol="tokenprotocol" 
                :tokenstats="tokenstats" 
                :tokenuser="tokenuser" 
                @modalsign="$emit('modalsign', $event)" />
      <Election v-if="type === 'election'" 
                :account="account" 
                :tokenprotocol="tokenprotocol" 
                :tokenstats="tokenstats" 
                :tokenuser="tokenuser" 
                @modalsign="$emit('modalsign', $event)" />
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
            const trigger = this.$el.querySelector('.trigger');
            const modalEl = this.$el.querySelector('.modal'); // Assumes modals have .modal class
            if (trigger && modalEl) {
                const modal = new bootstrap.Modal(modalEl);
                trigger.addEventListener('click', () => modal.show());
                this.$once('hook:beforeDestroy', () => {
                    trigger.removeEventListener('click', () => modal.show());
                    modal.dispose();
                });
            }
        }
    }
}

/*
<ModalVue :type="type" :tokenprotocol="tokenprotocol" :func="func">
  <template #trigger="{ isDisabled }">
    <button :disabled="isDisabled" class="trigger btn btn-primary">
      Open Modal
    </button>
  </template>
</ModalVue>
*/