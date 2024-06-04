export default {
    name: "MDE",
    template: `<div><textarea ref="mde"/></div>`,
    emits: ["data"],
    props: {
      prop_value: {
        type: String,
        default: ""
      }
    },
    methods: {
      setValue(value) {
        this.mde.value(value);
      }
    },
    // watch: {
    //   'prop_value': {
    //     handler: function () {
    //     },
    //     deep: true
    //   },
    // },
    mounted() {

      this.mde = new SimpleMDE({ 
        element: this.$refs.mde,
        dragDrop: false });
      this.mde.codemirror.on("change", () => {
        this.$emit("data", this.mde.value())
      });
      this.mde.value(this.prop_value)
    }
  };