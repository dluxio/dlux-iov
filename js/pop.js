const { Popover } = bootstrap;

export default {
  template: `
    <div>
        <slot/>
    </div>
        `,
  props: {
    content: {
      required: false,
      default: "",
    },
    title: {
      default: "My Popover",
    },
    trigger: {
      default: "click",
    },
    delay: {
      default: 0,
    },
    html: {
      default: false,
    },
    template: {
      default:
        '<div class="popover" role="tooltip"><div class="popover-arrow"></div><h3 class="popover-header"></h3><div class="popover-body"></div></div>',
    },
    customClass: {
      default: "",
    },
    html: {
      default: true,
    }
  },
  mounted() {
    // pass bootstrap popover options from props
    var options = this.$props;
    if(!this.$slots.default[0])return
    var ele = this.$slots.default[0].elm;
    new Popover(ele, options);
  },
};

