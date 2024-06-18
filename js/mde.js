export default {
    name: "MDE",
    template: `<div><textarea ref="mde"/></div>`,
    emits: ["data"],
    props: {
      prop_insert: {
        type: String,
        default: ""
      }
    },
    methods: {
      insertText(value) {
        this.mde.value(value);
        var pos = this.mde.codemirror.getCursor();
        this.mde.codemirror.setSelection(pos, pos);
        this.mde.codemirror.replaceSelection(value);
      }
    },
    watch: {
      'prop_insert': {
        handler: function () {
          this.mde.insertText(this.prop_value);
        }
      },
    },
    mounted() {

      this.mde = new SimpleMDE({ 
        element: this.$refs.mde,
        dragDrop: false });
      this.mde.codemirror.on("change", () => {
        this.$emit("data", this.mde.value())
      });
    }
  };