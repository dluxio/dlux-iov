export default {
    name: "MDE",
    template: `
      <div>
            <textarea ref="mde"/>
      </div>
    `,
    props: {
      
    },
    emits: ["data"],
    watch: {
      value(newVal, oldVal) {
        this.tagify.loadOriginalValues(newVal)
      }
    },
    methods: {
      
    },
    mounted() {
      this.mde = new SimpleMDE({ element: this.$refs.mde });
      console.log(this.mde)
      this.mde.codemirror.on("change", () => {
        this.$emit("data", this.mde.value())
    });
    }
  };