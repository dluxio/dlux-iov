export default {
    name: 'SimpleFieldEditor',
    props: {
        // TipTap bundle passed from parent
        tiptapBundle: {
            type: Object,
            required: true
        },
        // Y.js document for collaboration
        ydoc: {
            type: Object,
            required: true
        },
        // Collaboration provider
        provider: {
            type: Object,
            required: true
        },
        // Field name in Y.js document
        fieldName: {
            type: String,
            required: true
        },
        // User configuration
        user: {
            type: Object,
            default: () => ({
                name: 'anonymous',
                color: '#f783ac'
            })
        },
        // Placeholder text
        placeholder: {
            type: String,
            default: 'Enter text...'
        },
        // Whether this is a single-line field (like title)
        singleLine: {
            type: Boolean,
            default: false
        },
        // Initial content
        content: {
            type: String,
            default: ''
        },
        // Editor configuration
        editorConfig: {
            type: Object,
            default: () => ({})
        }
    },
    data() {
        return {
            editor: null
        };
    },
    mounted() {
        this.initializeEditor();
    },
    beforeDestroy() {
        if (this.editor) {
            this.editor.destroy();
        }
    },
    methods: {
        initializeEditor() {
            const { Editor, StarterKit, Collaboration, CollaborationCursor } = this.tiptapBundle;
            
            if (!Editor || !StarterKit || !Collaboration) {
                console.error('❌ TipTap bundle missing required components');
                return;
            }
            
            try {
                // Configure StarterKit based on field type
                const starterKitConfig = this.singleLine ? {
                    // Single line - disable block elements
                    heading: false,
                    bulletList: false,
                    orderedList: false,
                    blockquote: false,
                    codeBlock: false,
                    horizontalRule: false
                } : {
                    // Multi-line - enable all features
                    ...this.editorConfig.starterKit
                };
                
                // Create editor extensions
                const extensions = [
                    StarterKit.configure(starterKitConfig),
                    Collaboration.configure({
                        document: this.ydoc,
                        field: this.fieldName
                    })
                ];
                
                // Add collaboration cursor if provider is available
                if (CollaborationCursor && this.provider) {
                    extensions.push(
                        CollaborationCursor.configure({
                            provider: this.provider,
                            user: this.user
                        })
                    );
                }
                
                // Editor properties
                const editorProps = {
                    attributes: {
                        class: 'simple-field-editor',
                        placeholder: this.placeholder,
                        ...this.editorConfig.attributes
                    }
                };
                
                // Handle single-line restriction
                if (this.singleLine) {
                    editorProps.handleKeyDown = (view, event) => {
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            this.$emit('enter-pressed');
                            return true;
                        }
                        return false;
                    };
                }
                
                // Create the editor
                this.editor = new Editor({
                    element: this.$refs.editorElement,
                    extensions,
                    content: this.content,
                    editorProps,
                    onCreate: () => {
                        console.log(`📝 Simple field editor created for field: ${this.fieldName}`);
                        this.$emit('editor-created', this.editor);
                    },
                    onUpdate: ({ editor }) => {
                        const html = editor.getHTML();
                        const text = editor.getText();
                        this.$emit('content-updated', { html, text, editor });
                    },
                    onFocus: () => {
                        this.$emit('editor-focus');
                    },
                    onBlur: () => {
                        this.$emit('editor-blur');
                    }
                });
                
            } catch (error) {
                console.error('❌ Failed to initialize simple field editor:', error);
                this.$emit('editor-error', error);
            }
        },
        
        // Public methods for parent component
        getContent() {
            if (!this.editor) return { html: '', text: '' };
            
            return {
                html: this.editor.getHTML(),
                text: this.editor.getText()
            };
        },
        
        setContent(content) {
            if (this.editor) {
                this.editor.commands.setContent(content);
            }
        },
        
        clearContent() {
            if (this.editor) {
                this.editor.commands.clearContent();
            }
        },
        
        focus() {
            if (this.editor) {
                this.editor.commands.focus();
            }
        },
        
        insertContent(content) {
            if (this.editor) {
                this.editor.commands.insertContent(content);
            }
        }
    },
    template: `
        <div class="simple-field-editor-wrapper">
            <div ref="editorElement" class="simple-field-editor-content"></div>
        </div>
    `
};
