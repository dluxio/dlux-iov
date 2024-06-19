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
      default: ""
    }
  },
  methods: {
    insertText(value) {
      console.log("insertText", value)
      var pos = this.mde.codemirror.getCursor();
      this.mde.codemirror.setSelection(pos, pos);
      this.mde.codemirror.replaceSelection(value);

    }
  },
  watch: {
    'insert': {
      handler: function (newValue) {
        if (newValue) {
          console.log(2, { newValue })
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
    this.mde.codemirror.on("change", () => {
      this.$emit("data", this.mde.value())
    });
  }
};