export default {
  data() {
    return {
      text: "",
    };
  },
  template: `
  <div>
    <div v-show="!md">
      <textarea ref="editor" v-model="text" class="form-control" rows="3"></textarea>
      <button @click="insertAtCursor('[Alt Text](https://goto.link)')">Insert Link</button>
      <button @click="edit()">Comment</button>
    </div>
    <div class="behavemark" v-html="compiledMarkdown"></div>
  </div>`,
  props: ["md", "author", "permlink", "toEdit"],
  emits: ["settext"],
  mounted() {
    if (this.toEdit) {
      this.text = this.toEdit;
    }
  },
  methods: {
    edit(){
      this.$emit("settext", this.text);
    },
    insertAtCursor(toInsert) {
      if (document.selection) {
        this.$refs.editor.focus();
        sel = document.selection.createRange();
        sel.text = toInsert;
      } else if (
        this.$refs.editor.selectionStart ||
        this.$refs.editor.selectionStart == "0"
      ) {
        var startPos = this.$refs.editor.selectionStart;
        var endPos = this.$refs.editor.selectionEnd;
        this.$refs.editor.value =
          this.$refs.editor.value.substring(0, startPos) +
          toInsert +
          this.$refs.editor.value.substring(
            endPos,
            this.$refs.editor.value.length
          );
      } else {
        this.$refs.editor.value += toInsert;
      }
    },
  },
  computed: {
    compiledMarkdown: function () {
      return marked.parse(
        this.md
          ? this.md.replace(
              `[View in VR @ dlux.io](https://dlux.io/dlux/@${this.author}/${this.permlink})`,
              ""
            )
          : this.text
      );
    },
  },
};
