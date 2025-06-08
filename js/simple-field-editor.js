import commonMethods from "/js/methods-common.js";

export default {
  name: "SimpleFieldEditor",
  template: `
    <div class="simple-field-editor">
      <div ref="editor" 
           class="form-control bg-dark border-dark text-white"
           :style="fieldStyle"></div>
    </div>
  `,
  emits: ["data"],
  data() {
    return {
      editor: null,
      isUpdatingFromProps: false,
      _updatingFromYjs: false
    }
  },
  props: {
    insert: {
      type: String,
      required: false,
      default: ""
    },
    placeholder: {
      type: String,
      required: false,
      default: "Enter text..."
    },
    showCollaboration: {
      type: Boolean,
      required: false,
      default: false
    },
    collaborationProvider: {
      type: Object,
      required: false,
      default: null
    },
    collaborationYdoc: {
      type: Object,
      required: false,
      default: null
    },
    collaborationConfig: {
      type: Object,
      required: false,
      default: () => ({})
    },
    collaborationField: {
      type: String,
      required: false,
      default: "field"
    },
    multiline: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  computed: {
    fieldStyle() {
      return {
        minHeight: this.multiline ? '100px' : '38px',
        maxHeight: this.multiline ? '200px' : '38px',
        overflow: this.multiline ? 'auto' : 'hidden'
      };
    }
  },
  methods: {
    ...commonMethods, // Include common methods for collaboration utilities
    
    insertText(value) {
      if (!this.editor || this.isUpdatingFromProps) return;
      
      // Prevent updates when collaboration is setting up
      if (this.showCollaboration && !this.collaborationProvider) {
        console.log('Waiting for collaboration provider before inserting text in field:', this.collaborationField);
        return;
      }
      
      // Prevent circular updates
      this.isUpdatingFromProps = true;
      
      try {
        // Only update if content is different and editor is ready
        const currentText = this.editor.getText();
        if (currentText !== value) {
          // Use a more reliable method to set content
          this.editor.commands.clearContent();
          if (value) {
            this.editor.commands.setContent(value);
          }
        }
      } catch (error) {
        console.warn('Failed to insert text in simple field editor:', error);
      } finally {
        // Reset the flag after a short delay
        setTimeout(() => {
          this.isUpdatingFromProps = false;
        }, 100);
      }
    },
    
    async setupCollaboration() {
      if (!this.showCollaboration || !this.collaborationProvider || !this.collaborationYdoc) {
        console.log('Simple field collaboration setup skipped - missing provider or ydoc for field:', this.collaborationField);
        return;
      }

      console.log('Setting up simplified collaboration for field:', this.collaborationField);

      try {
        // Instead of using TipTap collaboration extensions, create a simple sync system
        // This avoids Y.js conflicts by not importing TipTap's collaboration extensions
        
        // Destroy and recreate editor with simple collaboration
        if (this.editor) {
          const currentContent = this.editor.getText();
          this.editor.destroy();
          await this.createEditorWithSimpleCollaboration(currentContent);
        }

      } catch (error) {
        console.error(`Failed to setup collaboration for field ${this.collaborationField}:`, error);
      }
    },
    
    async createEditorWithSimpleCollaboration(initialContent = '') {
      const { Editor } = await import('https://esm.sh/@tiptap/core@3.0.0');
      const StarterKit = await import('https://esm.sh/@tiptap/starter-kit@3.0.0');
      const Placeholder = await import('https://esm.sh/@tiptap/extension-placeholder@3.0.0');

      // Get or create Y.js text for this field
      const yText = this.collaborationYdoc.getText(this.collaborationField);

      this.editor = new Editor({
        element: this.$refs.editor,
        extensions: [
          StarterKit.default.configure({
            // Disable all formatting for simple fields
            bold: false,
            italic: false,
            strike: false,
            code: false,
            heading: false,
            bulletList: false,
            orderedList: false,
            blockquote: false,
            horizontalRule: false,
            hardBreak: this.multiline,
            history: false, // Disable history completely for collaboration
          }),
          Placeholder.default.configure({
            placeholder: this.placeholder,
          }),
        ],
        editable: true,
        content: initialContent || '', // Use initial content
        editorProps: {
          attributes: {
            class: 'simple-field-content simple-field-collaborative',
            style: 'outline: none; padding: 6px 12px;'
          },
          handleKeyDown: (view, event) => {
            // For single-line fields, prevent Enter key
            if (!this.multiline && event.key === 'Enter') {
              event.preventDefault();
              return true;
            }
            return false;
          }
        },
        onUpdate: ({ editor }) => {
          if (!this.isUpdatingFromProps && !this._updatingFromYjs) {
            const content = editor.getText();
            
            // Only update Y.js if content is different to avoid loops
            if (yText.toString() !== content) {
              // Use Y.js transaction to avoid conflicts
              this.collaborationYdoc.transact(() => {
                yText.delete(0, yText.length);
                yText.insert(0, content);
              }, 'local-update');
            }
            
            this.$emit("data", content);
          }
        },
        onCreate: () => {
          console.log(`✅ Simple field editor created with simple collaboration for field: ${this.collaborationField}`);
          
          // Set up Y.js text change observer
          this.setupYTextObserver(yText);
        },
        onError: (error) => {
          console.error(`Simple field editor error for field ${this.collaborationField}:`, error);
        }
      });
    },
    
    setupYTextObserver(yText) {
      // Listen for remote changes to Y.js text
      const observer = (event, transaction) => {
        // Only handle remote transactions, not our own local updates
        if (this.editor && !this._updatingFromYjs && !this.isUpdatingFromProps && transaction.origin !== 'local-update') {
          const newContent = yText.toString();
          const currentContent = this.editor.getText();
          
          if (newContent !== currentContent) {
            this._updatingFromYjs = true;
            this.isUpdatingFromProps = true;
            
            console.log(`🔄 Syncing remote changes to simple field editor for field: ${this.collaborationField}`);
            
            try {
              // Use requestAnimationFrame to avoid transaction conflicts
              requestAnimationFrame(() => {
                if (this.editor && this._updatingFromYjs) {
                  this.editor.commands.setContent(newContent, false);
                }
                
                setTimeout(() => {
                  this._updatingFromYjs = false;
                  this.isUpdatingFromProps = false;
                }, 50);
              });
              
            } catch (error) {
              console.error(`Error updating simple field editor for field ${this.collaborationField}:`, error);
              this._updatingFromYjs = false;
              this.isUpdatingFromProps = false;
            }
          }
        }
      };
      
      yText.observe(observer);
      
      // Store observer for cleanup
      this._yTextObserver = observer;
      this._yText = yText;
    },
    
    disconnectCollaboration() {
      // Clean up Y.js observers
      if (this._yTextObserver && this._yText) {
        this._yText.unobserve(this._yTextObserver);
        this._yTextObserver = null;
        this._yText = null;
      }
      
      // Collaboration is managed by parent component now
      console.log('Simple field collaboration disconnect handled by parent for field:', this.collaborationField);
    },
    
    async recreateEditorWithoutCollaboration() {
      if (!this.editor) return;
      
      const currentContent = this.editor.getText();
      this.editor.destroy();
      
      const { Editor } = await import('https://esm.sh/@tiptap/core@3.0.0');
      const StarterKit = await import('https://esm.sh/@tiptap/starter-kit@3.0.0');
      const Placeholder = await import('https://esm.sh/@tiptap/extension-placeholder@3.0.0');

      this.editor = new Editor({
        element: this.$refs.editor,
        extensions: [
          StarterKit.default.configure({
            // Disable all formatting for simple fields
            bold: false,
            italic: false,
            strike: false,
            code: false,
            heading: false,
            bulletList: false,
            orderedList: false,
            blockquote: false,
            horizontalRule: false,
            hardBreak: this.multiline,
            history: true, // Enable history when not collaborating
          }),
          Placeholder.default.configure({
            placeholder: this.placeholder,
          }),
        ],
        content: currentContent,
        editorProps: {
          attributes: {
            class: 'simple-field-content',
            style: 'outline: none; padding: 6px 12px;'
          },
          handleKeyDown: (view, event) => {
            // For single-line fields, prevent Enter key
            if (!this.multiline && event.key === 'Enter') {
              event.preventDefault();
              return true;
            }
            return false;
          }
        },
        onUpdate: ({ editor }) => {
          if (!this.isUpdatingFromProps) {
            const text = editor.getText();
            this.$emit("data", text);
          }
        }
      });
    }
  },
  watch: {
    'insert': {
      handler: function (newValue, oldValue) {
        if (newValue && newValue !== oldValue && !this.isUpdatingFromProps) {
          this.insertText(newValue);
        }
      },
      deep: true
    },
    
    'collaborationProvider': {
      handler: function (newProvider) {
        if (newProvider && this.showCollaboration && this.collaborationYdoc) {
          console.log(`📡 Simple field collaboration provider received for field ${this.collaborationField}, setting up...`);
          setTimeout(() => {
            this.setupCollaboration();
          }, 100);
        }
      },
      immediate: true
    },
    
    'showCollaboration': {
      handler: function (newValue) {
        console.log(`🤝 Simple field show collaboration changed for field ${this.collaborationField}:`, newValue);
        if (newValue && this.collaborationProvider && this.collaborationYdoc) {
          setTimeout(() => {
            this.setupCollaboration();
          }, 100);
        } else if (!newValue && this.editor) {
          // Recreate editor without collaboration
          this.recreateEditorWithoutCollaboration();
        }
      }
    }
  },
  async mounted() {
    // Import Tiptap modules
    const { Editor } = await import('https://esm.sh/@tiptap/core@3.0.0');
    const StarterKit = await import('https://esm.sh/@tiptap/starter-kit@3.0.0');
    const Placeholder = await import('https://esm.sh/@tiptap/extension-placeholder@3.0.0');

    this.editor = new Editor({
      element: this.$refs.editor,
      extensions: [
        StarterKit.default.configure({
          // Disable all formatting for simple fields
          bold: false,
          italic: false,
          strike: false,
          code: false,
          heading: false,
          bulletList: false,
          orderedList: false,
          blockquote: false,
          horizontalRule: false,
          hardBreak: this.multiline,
          history: !this.showCollaboration, // Only enable history if not collaborating
        }),
        Placeholder.default.configure({
          placeholder: this.placeholder,
        }),
      ],
      content: '',
      editorProps: {
        attributes: {
          class: 'simple-field-content',
          style: 'outline: none; padding: 6px 12px;'
        },
        handleKeyDown: (view, event) => {
          // For single-line fields, prevent Enter key
          if (!this.multiline && event.key === 'Enter') {
            event.preventDefault();
            return true;
          }
          return false;
        }
      },
      onUpdate: ({ editor }) => {
        if (!this.isUpdatingFromProps) {
          const text = editor.getText();
          this.$emit("data", text);
        }
      }
    });

    // Insert initial content if provided and not in collaboration mode
    if (this.insert && !this.showCollaboration) {
      setTimeout(() => {
        this.insertText(this.insert);
      }, 100);
    }

    // Setup collaboration if provider is already available
    if (this.showCollaboration && this.collaborationProvider && this.collaborationYdoc) {
      setTimeout(() => {
        this.setupCollaboration();
      }, 200);
    }
  },
  beforeUnmount() {
    this.disconnectCollaboration();
    if (this.editor) {
      this.editor.destroy();
    }
  }
}; 