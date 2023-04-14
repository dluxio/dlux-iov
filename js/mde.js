export default {
    name: "MDE",
    template: `
      <div>
            <textarea/>
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
      this.mde = new SimpleMDE({ element: this.$el });
      simplemde.codemirror.on("change", function(){
        this.$emit("data", simplemde.value())
    });
    }
  };