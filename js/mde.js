export default {
  name: "MDE",
  template: `<div><textarea ref="mde"/></div>`,
  emits: ["data"],
  data() {
    return {
      mde: null
    }
  },
  props: {
    insert: {
      type: String,
      required: false,
      default: ""
    }
  },
  methods: {
    insertText(value) {
      var pos = this.mde.codemirror.getCursor();
      this.mde.codemirror.setSelection(pos, pos);
      this.mde.codemirror.replaceSelection(value);

    }
  },
  watch: {
    'insert': {
      handler: function (newValue) {
        if (newValue) {
          this.insertText(newValue)
        }
      },
      deep: true
    }
  },
  mounted() {

    this.mde = new SimpleMDE({
      element: this.$refs.mde,
      dragDrop: false
    });
    this.mde.value(this.insert)
    this.mde.codemirror.on("change", () => {
      this.$emit("data", this.mde.value())
    });
  }
};