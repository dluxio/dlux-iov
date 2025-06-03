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
      
      const markdownToParse = this.md
        ? this.md.replace(
            `[View in VR @ dlux.io](https://dlux.io/dlux/@${this.author}/${this.permlink})`,
            ""
          )
        : this.text;
      
      const rawHtml = marked.parse(markdownToParse);

      // Comprehensive sanitization to prevent XSS attacks
      return DOMPurify.sanitize(rawHtml, { 
          // Forbid dangerous tags that can execute scripts or take over layout
          FORBID_TAGS: [
            'script', 'style', 'object', 'embed', 'applet', 'meta', 
            'link', 'base', 'dialog', 'iframe', 'frame', 'frameset'
          ],
          // Forbid dangerous attributes
          FORBID_ATTR: [
            'onload', 'onerror', 'onclick', 'onmouseover', 'onfocus', 'onblur',
            'onchange', 'onsubmit', 'onreset', 'onselect', 'onunload', 'onbeforeunload',
            'onabort', 'onafterprint', 'onbeforeprint', 'oncanplay', 'oncanplaythrough',
            'oncontextmenu', 'ondblclick', 'ondrag', 'ondragend', 'ondragenter',
            'ondragleave', 'ondragover', 'ondragstart', 'ondrop', 'ondurationchange',
            'onemptied', 'onended', 'oninput', 'oninvalid', 'onkeydown', 'onkeypress',
            'onkeyup', 'onloadeddata', 'onloadedmetadata', 'onloadstart', 'onmousedown',
            'onmousemove', 'onmouseout', 'onmouseup', 'onmousewheel', 'onoffline',
            'ononline', 'onpagehide', 'onpageshow', 'onpause', 'onplay', 'onplaying',
            'onpopstate', 'onprogress', 'onratechange', 'onresize', 'onscroll',
            'onseeked', 'onseeking', 'onstalled', 'onstorage', 'onsuspend',
            'ontimeupdate', 'onvolumechange', 'onwaiting', 'onwheel',
            'style', 'srcdoc', 'sandbox', 'allowfullscreen', 'open'
          ],
          // Only allow safe protocols
          ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|ipfs):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
          // Allow classes for syntax highlighting
          ADD_ATTR: ['class'],
          // Keep only safe HTML elements
          ALLOWED_TAGS: [
            'a', 'b', 'blockquote', 'br', 'code', 'div', 'em', 'h1', 'h2', 'h3', 
            'h4', 'h5', 'h6', 'hr', 'i', 'img', 'li', 'ol', 'p', 'pre', 'span', 
            'strong', 'sub', 'sup', 'table', 'tbody', 'td', 'th', 'thead', 'tr', 
            'u', 'ul', 'del', 'ins', 'small', 'mark', 'q', 'cite', 'abbr', 'dfn', 
            'time', 'address', 'figure', 'figcaption', 'kbd', 'samp', 'var'
          ],
          // Keep only safe attributes
          ALLOWED_ATTR: [
            'href', 'title', 'alt', 'src', 'width', 'height', 'class', 'id',
            'target', 'rel', 'type', 'datetime', 'cite', 'start', 'reversed'
          ]
      });
    },
  },
};
