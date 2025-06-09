export default {
  name: 'Popover',
  props: {
    popoverId: {
      type: String,
      required: true
    },
    title: {
      type: String,
      default: ''
    },
  },
  data() {
    return {
      hideTimeout: null
    }
  },
  methods: {
    showPopover() {
      clearTimeout(this.hideTimeout);
      const popover = document.getElementById(this.popoverId);
      if(popover?.matches(':popover-open')) return;

      if (popover) {
        popover.showPopover();
        this.$nextTick(() => {
          this.positionPopover();
        });
      }
    },
    hidePopover() {
      this.hideTimeout = setTimeout(() => {
        document.getElementById(this.popoverId)?.hidePopover();
      }, 200);
    },
    positionPopover() {
      const trigger = this.$refs.trigger;
      const popover = document.getElementById(this.popoverId);

      if (trigger && popover) {
        const triggerRect = trigger.getBoundingClientRect();
        const popoverRect = popover.getBoundingClientRect();
        
        const top = triggerRect.bottom + window.scrollY + 5;
        let left = triggerRect.left + window.scrollX + (triggerRect.width / 2) - (popoverRect.width / 2);

        if (left < 5) {
          left = 5;
        } else if (left + popoverRect.width > document.documentElement.clientWidth - 5) {
          left = document.documentElement.clientWidth - popoverRect.width - 5;
        }

        popover.style.left = `${left}px`;
        popover.style.top = `${top}px`;
      }
    }
  },
  template: `
    <span ref="trigger" @mouseenter="showPopover" @mouseleave="hidePopover" style="cursor: pointer;">
      <slot name="trigger"></slot>
    </span>
    <div :id="popoverId" popover @mouseenter="showPopover" @mouseleave="hidePopover">
      <h4 v-if="title">{{ title }}</h4>
      <slot name="content"></slot>
    </div>
  `
} 