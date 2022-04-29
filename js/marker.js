export default {
  data() {
    return {
    };
  },
  template: `<div>
  <div v-html="compiledMarkdown"></div>
</div>`,
  props: ["md", "author", "permlink" ],
  computed: {
    compiledMarkdown: function () {
      return marked.parse(this.md.replace(`[View in VR @ dlux.io](https://dlux.io/dlux/@${this.author}/${this.permlink})`, ''), { sanitize: true });
    },
  },
  // methods: {
  //   update: _.debounce(function (e) {
  //     this.md = e.target.value;
  //   }, 300),
  // },
};
