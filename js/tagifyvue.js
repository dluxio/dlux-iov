export default {
  name: "Tags",
  template: `
    <div v-once>
        <textarea v-if="mode === 'textarea'" v-model="value"/>
        <input v-show="false" :value="value" @keydown="onChange">
    </div>
  `,
  props: {
    mode: String,
    settings: Object,
    value: [String, Array],
    onChange: {
        default: () => {},
        type: Function,
    }
  },
  emits: ["data"],
  watch: {
    value(newVal, oldVal) {
      this.tagify.loadOriginalValues(newVal)
    }
  },
  methods: {
    transformTag(tagData){
        tagData.value = tagData.value.toLowerCase().replace(/[^a-z0-9\-]+/g, '')
    }
  },
  mounted() {
    this.tagify = new Tagify(this.$el, {
        pattern: /^[0-9a-z\-]{3,15}$/,
        maxTags: 10,
        keepInvalidTags: false,
        delimiters: ",| ",
        transformTag: this.transformTag,
    })
    this.tagify.on('add', function(e){
        var tags = this.tagify.value.map(tag => tag.value)
        
        this.$emit("data", tags)
    })
  }
};