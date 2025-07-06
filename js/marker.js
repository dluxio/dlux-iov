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
<div ref="markdownContent" class="behavemark" v-html="compiledMarkdown"></div>
  </div>`,
  props: ["md", "author", "permlink", "toedit"],
  emits: ["settext"],
  mounted() {
    if (this.toedit) {
      this.text = this.toedit;
    }
    this.enhanceVideos();
  },
  updated() {
    // Re-enhance videos when content changes
    this.enhanceVideos();
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
    enhanceVideos() {
      // Wait for DOM to update
      this.$nextTick(() => {
        if (!this.$refs.markdownContent || !window.DluxVideoPlayer) {
          return;
        }
        
        // Find all video elements in the rendered content
        const videos = this.$refs.markdownContent.querySelectorAll('video:not([data-dlux-enhanced])');
        
        videos.forEach(video => {
          try {
            // Enhance the video with DLUX Video Player
            window.DluxVideoPlayer.enhanceVideoElement(video);
          } catch (error) {
            console.error('Failed to enhance video:', error);
          }
        });
      });
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
      
      // Create marked instance with KaTeX support if available
      let markedInstance = marked;
      if (typeof markedKatex !== 'undefined') {
        // Create a new Marked instance with KaTeX support
        const { Marked } = globalThis.marked || { Marked: marked.constructor };
        markedInstance = new Marked();
        
        // Add KaTeX extension
        markedInstance.use(markedKatex({
          throwOnError: false,
          displayMode: false, // Use inline mode by default, block mode for $$
        }));
      }
      
      const rawHtml = markedInstance.parse(markdownToParse);

      // Comprehensive sanitization to prevent XSS attacks
      const sanitizedHtml = DOMPurify.sanitize(rawHtml, { 
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
          // Allow classes for syntax highlighting and math rendering
          ADD_ATTR: ['class', 'aria-hidden', 'role'],
          // Keep only safe HTML elements (including KaTeX math elements)
          ALLOWED_TAGS: [
            'a', 'b', 'blockquote', 'br', 'code', 'div', 'em', 'h1', 'h2', 'h3', 
            'h4', 'h5', 'h6', 'hr', 'i', 'img', 'li', 'ol', 'p', 'pre', 'span', 
            'strong', 'sub', 'sup', 'table', 'tbody', 'td', 'th', 'thead', 'tr', 
            'u', 'ul', 'del', 'ins', 'small', 'mark', 'q', 'cite', 'abbr', 'dfn', 
            'time', 'address', 'figure', 'figcaption', 'kbd', 'samp', 'var', 'video',
            // KaTeX math rendering elements
            'math', 'semantics', 'mrow', 'mi', 'mn', 'mo', 'mfrac', 'msup', 'msub', 
            'msubsup', 'munder', 'mover', 'munderover', 'msqrt', 'mroot', 'mtext', 
            'menclose', 'annotation', 'annotation-xml', 'mspace', 'mpadded', 'mphantom',
            'mfenced', 'mtable', 'mtr', 'mtd', 'mlabeledtr', 'maligngroup', 'malignmark',
            'mstyle', 'merror', 'maction'
          ],
          // Keep only safe attributes (including math-specific attributes)
          ALLOWED_ATTR: [
            'href', 'title', 'alt', 'src', 'width', 'height', 'class', 'id',
            'target', 'rel', 'type', 'datetime', 'cite', 'start', 'reversed',
            'controls', 'autoplay', 'loop', 'muted', 'poster', 'preload', 'crossorigin',
            'data-type', 'data-mime-type', 'data-original-src',
            // KaTeX and math-specific attributes
            'aria-hidden', 'role', 'data-lexical-text', 'mathvariant', 'mathcolor',
            'mathbackground', 'mathsize', 'dir', 'fontfamily', 'fontweight',
            'fontstyle', 'fontsize', 'color', 'background', 'display', 'displaystyle',
            'scriptlevel', 'scriptsizemultiplier', 'scriptminsize', 'infixlinebreakstyle',
            'decimalpoint', 'rspace', 'lspace', 'linethickness', 'munalign',
            'denomalign', 'numalign', 'align', 'rowalign', 'columnalign',
            'groupalign', 'alignmentscope', 'columnwidth', 'width', 'rowspacing',
            'columnspacing', 'rowlines', 'columnlines', 'frame', 'framespacing',
            'equalrows', 'equalcolumns', 'side', 'minlabelspacing', 'rowspan',
            'columnspan', 'accent', 'accentunder', 'bevelled', 'close', 'open',
            'separators', 'stretchy', 'symmetric', 'maxsize', 'minsize', 'largeop',
            'movablelimits', 'form', 'fence', 'separator', 'selection'
          ]
      });

      // Center video elements by wrapping them in a div with centering styles
      return sanitizedHtml.replace(
        /<video([^>]*)>/g, 
        '<div style="text-align: center; margin: 1em 0;"><video$1 style="max-width: 100%; height: auto;">'
      ).replace(/<\/video>/g, '</video></div>');
    },
  },
};
