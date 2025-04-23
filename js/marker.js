export default {
  data() {
    return {
      text: "",
    };
  },
  template: `<div>
<div v-show="!md">
<textarea ref="editor" v-model="text" class="form-control" rows="3"></textarea>
<button @click="insertAtCursor('[Alt Text](https://goto.link)')">Insert Link</button>
<button @click="edit()">Comment</button>
</div>
<div class="behavemark" v-html="compiledMarkdown"></div>
  </div>`,
  props: ["md", "author", "permlink", "toedit"],
  emits: ["settext"],
  mounted() {
    if (this.toedit) {
      this.text = this.toedit;
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
      console.log('DEBUG: compiledMarkdown is running');
      // Ensure hljs is available
      if (typeof hljs === 'undefined') {
        console.error('Highlight.js not loaded.');
        // Return unhighlighted markdown or handle error appropriately
      }

      const markdownToParse = this.md
        ? this.md.replace(
            `[View in VR @ dlux.io](https://dlux.io/dlux/@${this.author}/${this.permlink})`,
            ""
          )
        : this.text;

      const markedOptions = {
        highlight: function (code, lang) {
          console.log('DEBUG: highlight function called with:', { code, lang });
          const language = hljs.getLanguage(lang) ? lang : 'plaintext'; // Check if language is supported
          try {
            // Return highlighted code HTML
            const value = hljs.highlight(code, { language, ignoreIllegals: true }).value;
            console.log({value})
            return value
          } catch (e) {
            console.error(`Highlight.js error for lang '${lang}':`, e);
            // Fallback to plain code block
            return `<pre><code class="hljs">${code}</code></pre>`; 
          }
        },
        // You might want to add other marked options here if needed, e.g., gfm: true
      };

      console.log('DEBUG: Input to marked.parse:', markdownToParse);
      const rawHtml = marked.parse(markdownToParse, markedOptions);

      // Sanitize the final HTML which now includes hljs classes
      return DOMPurify.sanitize(rawHtml, { 
          FORBID_TAGS: ['style'],
          // Allow classes starting with 'hljs-' for highlighting themes
          ADD_ATTR: ['class'], 
      });
    },
  },
};
