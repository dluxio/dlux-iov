export default {
  data() {
    return {
      text: '',
    };
  },
  template: `<div>
  <textarea v-show="!md" v-model="text" class="form-control" rows="3"></textarea>
  <div v-html="compiledMarkdown"></div>
</div>`,
  props: ["md", "author", "permlink" ],
  computed: {
    compiledMarkdown: function () {
      return marked.parse(this.md ? this.md.replace(`[View in VR @ dlux.io](https://dlux.io/dlux/@${this.author}/${this.permlink})`, '') : this.text, { sanitize: true });
    },
  },
  // methods: {
  //   update: _.debounce(function (e) {
  //     this.md = e.target.value;
  //   }, 300),
  // },
};
