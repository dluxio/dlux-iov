import commonMethods from "/js/methods-common.js";

export default {
  name: "TiptapEditor",
  template: `
    <div class="tiptap-editor-container">
      <div v-if="showCollaboration" class="tiptap-collab-header">
        <div class="d-flex justify-content-between align-items-center p-2 bg-primary">
          <div class="d-flex align-items-center">
            <i class="fas fa-users me-2"></i>
            <span class="fw-bold">{{ collaborationConfig.documentName || 'Collaborative Document' }}</span>
            <span v-if="connectionStatus" class="badge ms-2" :class="connectionStatusClass">
              {{ connectionStatus }}
            </span>
          </div>
          <div class="d-flex align-items-center">
            <span v-if="connectedUsers.length > 0" class="me-2 small">
              {{ connectedUsers.length }} user{{ connectedUsers.length !== 1 ? 's' : '' }} online
            </span>
            <div v-if="connectedUsers.length > 0" class="d-flex">
              <div v-for="user in connectedUsers.slice(0, 5)" :key="user.name" 
                   class="collab-cursor me-1" 
                   :style="'background-color: ' + user.color"
                   :title="user.name">
                {{ user.name.charAt(0).toUpperCase() }}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="tiptap-toolbar">
        <button type="button" @click="toggleBold" :class="{ active: isActive('bold') }" class="btn btn-sm btn-outline-secondary me-1">
          <i class="fas fa-bold"></i>
        </button>
        <button type="button" @click="toggleItalic" :class="{ active: isActive('italic') }" class="btn btn-sm btn-outline-secondary me-1">
          <i class="fas fa-italic"></i>
        </button>
        <button type="button" @click="toggleStrike" :class="{ active: isActive('strike') }" class="btn btn-sm btn-outline-secondary me-1">
          <i class="fas fa-strikethrough"></i>
        </button>
        <button type="button" @click="toggleCode" :class="{ active: isActive('code') }" class="btn btn-sm btn-outline-secondary me-1">
          <i class="fas fa-code"></i>
        </button>
        <div class="btn-group me-1" role="group">
          <button type="button" @click="setHeading(1)" :class="{ active: isActive('heading', { level: 1 }) }" class="btn btn-sm btn-outline-secondary">
            H1
          </button>
          <button type="button" @click="setHeading(2)" :class="{ active: isActive('heading', { level: 2 }) }" class="btn btn-sm btn-outline-secondary">
            H2
          </button>
          <button type="button" @click="setHeading(3)" :class="{ active: isActive('heading', { level: 3 }) }" class="btn btn-sm btn-outline-secondary">
            H3
          </button>
        </div>
        <button type="button" @click="toggleBulletList" :class="{ active: isActive('bulletList') }" class="btn btn-sm btn-outline-secondary me-1">
          <i class="fas fa-list-ul"></i>
        </button>
        <button type="button" @click="toggleOrderedList" :class="{ active: isActive('orderedList') }" class="btn btn-sm btn-outline-secondary me-1">
          <i class="fas fa-list-ol"></i>
        </button>
        <button type="button" @click="toggleBlockquote" :class="{ active: isActive('blockquote') }" class="btn btn-sm btn-outline-secondary me-1">
          <i class="fas fa-quote-left"></i>
        </button>
        <button type="button" @click="insertHorizontalRule" class="btn btn-sm btn-outline-secondary me-1">
          <i class="fas fa-minus"></i>
        </button>
        
        <!-- Content Addition Dropdown -->
        <div class="dropdown me-1">
          <button class="btn btn-sm btn-outline-primary dropdown-toggle" type="button" data-bs-toggle="dropdown">
            <i class="fas fa-plus me-1"></i>Add Content
          </button>
          <ul class="dropdown-menu bg-dark">
            <li><a class="dropdown-item text-light" href="#" @click.prevent="showContractModal">
              <i class="fas fa-file-contract me-2"></i>Contract
            </a></li>
            <li><a class="dropdown-item text-light" href="#" @click.prevent="showImageModal">
              <i class="fas fa-image me-2"></i>Image
            </a></li>
            <li><a class="dropdown-item text-light" href="#" @click.prevent="showAssetModal">
              <i class="fas fa-cube me-2"></i>Asset
            </a></li>
          </ul>
        </div>
        
        <button type="button" @click="undo" :disabled="!canUndo" class="btn btn-sm btn-outline-secondary me-1">
          <i class="fas fa-undo"></i>
        </button>
        <button type="button" @click="redo" :disabled="!canRedo" class="btn btn-sm btn-outline-secondary me-1">
          <i class="fas fa-redo"></i>
        </button>
        
        <div v-if="showCollaboration" class="ms-auto">
          <button v-if="!isCollaborating" type="button" @click="$emit('requestCollaboration')" class="btn btn-sm btn-primary">
            <i class="fas fa-share-alt me-1"></i>Share
          </button>
          <button v-else type="button" @click="disconnectCollaboration" class="btn btn-sm btn-secondary">
            <i class="fas fa-sign-out-alt me-1"></i>Disconnect
          </button>
        </div>
      </div>
      <div ref="editor" class="tiptap-editor-content"></div>
      
      <!-- Content Addition Modals -->
      <div class="modal fade" id="contractModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content bg-dark text-light">
            <div class="modal-header border-secondary">
              <h5 class="modal-title">Add Contract</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Contract ID</label>
                <input v-model="modalContractId" class="form-control bg-secondary text-white border-dark" placeholder="Enter contract ID">
              </div>
              <div class="mb-3">
                <label class="form-label">Display Text (optional)</label>
                <input v-model="modalContractText" class="form-control bg-secondary text-white border-dark" placeholder="Contract display text">
              </div>
            </div>
            <div class="modal-footer border-secondary">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-primary" @click="insertContract">Add Contract</button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="modal fade" id="imageModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content bg-dark text-light">
            <div class="modal-header border-secondary">
              <h5 class="modal-title">Add Image</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Image CID (IPFS Hash)</label>
                <input v-model="modalImageCid" class="form-control bg-secondary text-white border-dark" placeholder="Enter IPFS CID">
              </div>
              <div class="mb-3">
                <label class="form-label">Alt Text</label>
                <input v-model="modalImageAlt" class="form-control bg-secondary text-white border-dark" placeholder="Image description">
              </div>
            </div>
            <div class="modal-footer border-secondary">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-primary" @click="insertImage">Add Image</button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="modal fade" id="assetModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content bg-dark text-light">
            <div class="modal-header border-secondary">
              <h5 class="modal-title">Add Asset</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Asset ID</label>
                <input v-model="modalAssetId" class="form-control bg-secondary text-white border-dark" placeholder="Enter asset ID">
              </div>
              <div class="mb-3">
                <label class="form-label">Display Text (optional)</label>
                <input v-model="modalAssetText" class="form-control bg-secondary text-white border-dark" placeholder="Asset display text">
              </div>
            </div>
            <div class="modal-footer border-secondary">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-primary" @click="insertAsset">Add Asset</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  emits: ["data", "requestCollaboration", "addContract", "addImage", "addAsset"],
  data() {
    return {
      editor: null,
      canUndo: false,
      canRedo: false,
      connectionStatus: null,
      connectedUsers: [],
      provider: null,
      ydoc: null,
      modalContractId: '',
      modalContractText: '',
      modalImageCid: '',
      modalImageAlt: '',
      modalAssetId: '',
      modalAssetText: '',
      _updatingFromYjs: false,
      _yTextObserver: null,
      _yText: null
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
      default: "Enter a description"
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
      default: "body"
    }
  },
  computed: {
    isCollaborating() {
      return this.provider && this.provider.wsconnected;
    },
    connectionStatusClass() {
      switch (this.connectionStatus) {
        case 'Connected': return 'bg-success';
        case 'Connecting': return 'bg-warning';
        case 'Disconnected': return 'bg-danger';
        default: return 'bg-secondary';
      }
    }
  },
  methods: {
    ...commonMethods, // Include common methods for collaboration utilities
    
    insertText(value) {
      if (!this.editor) return;
      
      // Prevent updates when collaboration is setting up
      if (this.showCollaboration && !this.collaborationProvider) {
        console.log('Waiting for collaboration provider before inserting text');
        return;
      }
      
      try {
        if (!this.editor.getText() || this.editor.getText() !== value) {
          // Use a more reliable method to set content
          this.editor.commands.clearContent();
          if (value) {
            this.editor.commands.setContent(value);
          }
        }
      } catch (error) {
        console.warn('Failed to insert text in tiptap editor:', error);
      }
    },
    
    getMarkdown() {
      if (!this.editor) return '';
      return this.editor.storage.markdown?.getMarkdown() || this.htmlToMarkdown(this.editor.getHTML());
    },
    
    htmlToMarkdown(html) {
      // Simple HTML to Markdown conversion for basic tags
      return html
        .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
        .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
        .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
        .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
        .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
        .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
        .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
        .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
        .replace(/<s[^>]*>(.*?)<\/s>/gi, '~~$1~~')
        .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
        .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n\n')
        .replace(/<ul[^>]*>(.*?)<\/ul>/gi, (match, content) => {
          return content.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n') + '\n';
        })
        .replace(/<ol[^>]*>(.*?)<\/ol>/gi, (match, content) => {
          let counter = 1;
          return content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => `${counter++}. $1\n`) + '\n';
        })
        .replace(/<hr[^>]*>/gi, '---\n\n')
        .replace(/<br[^>]*>/gi, '\n')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/\n\n\n+/g, '\n\n')
        .trim();
    },
    
    toggleBold() {
      this.editor.chain().focus().toggleBold().run();
    },
    
    toggleItalic() {
      this.editor.chain().focus().toggleItalic().run();
    },
    
    toggleStrike() {
      this.editor.chain().focus().toggleStrike().run();
    },
    
    toggleCode() {
      this.editor.chain().focus().toggleCode().run();
    },
    
    setHeading(level) {
      this.editor.chain().focus().toggleHeading({ level }).run();
    },
    
    toggleBulletList() {
      this.editor.chain().focus().toggleBulletList().run();
    },
    
    toggleOrderedList() {
      this.editor.chain().focus().toggleOrderedList().run();
    },
    
    toggleBlockquote() {
      this.editor.chain().focus().toggleBlockquote().run();
    },
    
    insertHorizontalRule() {
      this.editor.chain().focus().setHorizontalRule().run();
    },
    
    undo() {
      this.editor.chain().focus().undo().run();
    },
    
    redo() {
      this.editor.chain().focus().redo().run();
    },
    
    isActive(name, attrs = {}) {
      return this.editor?.isActive(name, attrs) || false;
    },
    
    updateCanUndoRedo() {
      // Check if editor exists and has the history extension
      if (this.editor && this.editor.can) {
        try {
          this.canUndo = this.editor.can().undo() || false;
          this.canRedo = this.editor.can().redo() || false;
        } catch (error) {
          // History might not be available in collaborative mode
          this.canUndo = false;
          this.canRedo = false;
        }
      } else {
        this.canUndo = false;
        this.canRedo = false;
      }
    },
    
    async setupCollaboration() {
      if (!this.showCollaboration || !this.collaborationProvider || !this.collaborationYdoc) {
        console.log('TipTap collaboration setup skipped - missing provider or ydoc');
        return;
      }

      console.log('Setting up simplified TipTap collaboration for field:', this.collaborationField);

      try {
        // Instead of using TipTap collaboration extensions, create a simple sync system
        // This avoids Y.js conflicts by not importing TipTap's collaboration extensions
        
        // Destroy existing editor and recreate without collaboration extensions
        if (this.editor) {
          const currentContent = this.editor.getHTML();
          this.editor.destroy();
          
          // Create editor without collaboration extensions
          await this.createEditorWithSimpleCollaboration(currentContent);
        }

      } catch (error) {
        console.error('Failed to setup TipTap collaboration:', error);
        this.connectionStatus = 'Error';
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
            class: 'tiptap-collaborative',
          },
        },
        onUpdate: ({ editor }) => {
          // Sync changes to Y.js text only if not updating from Y.js
          if (!this._updatingFromYjs) {
            const content = this.getMarkdown();
            
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
          this.updateCanUndoRedo();
        },
        onSelectionUpdate: () => {
          this.updateCanUndoRedo();
        },
        onCreate: () => {
          console.log(`✅ TipTap editor created with simple collaboration for field: ${this.collaborationField}`);
          
          // Set up Y.js text change observer
          this.setupYTextObserver(yText);
        },
        onError: (error) => {
          console.error(`TipTap editor error for field ${this.collaborationField}:`, error);
        }
      });
      
      console.log('✅ TipTap editor recreated with simple collaboration for field:', this.collaborationField);
    },
    
    setupYTextObserver(yText) {
      // Listen for remote changes to Y.js text
      const observer = (event, transaction) => {
        // Only handle remote transactions, not our own local updates
        if (this.editor && !this._updatingFromYjs && transaction.origin !== 'local-update') {
          const newContent = yText.toString();
          const currentContent = this.getMarkdown();
          
          if (newContent !== currentContent) {
            this._updatingFromYjs = true;
            
            console.log(`🔄 Syncing remote changes to TipTap editor for field: ${this.collaborationField}`);
            
            try {
              // Convert markdown to HTML if needed
              const htmlContent = this.markdownToHtml(newContent);
              
              // Use requestAnimationFrame to avoid transaction conflicts
              requestAnimationFrame(() => {
                if (this.editor && this._updatingFromYjs) {
                  this.editor.commands.setContent(htmlContent, false, {
                    preserveWhitespace: 'full'
                  });
                }
                
                setTimeout(() => {
                  this._updatingFromYjs = false;
                }, 50);
              });
              
            } catch (error) {
              console.error(`Error updating TipTap editor for field ${this.collaborationField}:`, error);
              this._updatingFromYjs = false;
            }
          }
        }
      };
      
      yText.observe(observer);
      
      // Store observer for cleanup
      this._yTextObserver = observer;
      this._yText = yText;
    },
    
    markdownToHtml(markdown) {
      // Simple markdown to HTML conversion for basic formatting
      return markdown
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    },
    
    disconnectCollaboration() {
      // Clean up Y.js observers
      if (this._yTextObserver && this._yText) {
        this._yText.unobserve(this._yTextObserver);
        this._yTextObserver = null;
        this._yText = null;
      }
      
      // Collaboration is managed by parent component now
      console.log('TipTap collaboration disconnect handled by parent');
    },
    
    async recreateEditorWithoutCollaboration() {
      if (!this.editor) return;
      
      const currentContent = this.editor.getHTML();
      this.editor.destroy();
      
      const { Editor } = await import('https://esm.sh/@tiptap/core@3.0.0');
      const StarterKit = await import('https://esm.sh/@tiptap/starter-kit@3.0.0');
      const Placeholder = await import('https://esm.sh/@tiptap/extension-placeholder@3.0.0');

      this.editor = new Editor({
        element: this.$refs.editor,
        extensions: [
          StarterKit.default.configure({
            history: true, // Enable history when not collaborating
          }),
          Placeholder.default.configure({
            placeholder: this.placeholder,
          }),
        ],
        content: currentContent,
        onUpdate: ({ editor }) => {
          const markdown = this.getMarkdown();
          this.$emit("data", markdown);
          this.updateCanUndoRedo();
        },
        onSelectionUpdate: () => {
          this.updateCanUndoRedo();
        }
      });
    },
    
    showContractModal() {
      this.modalContractId = '';
      this.modalContractText = '';
      const modal = new bootstrap.Modal(document.getElementById('contractModal'));
      modal.show();
    },
    
    showImageModal() {
      this.modalImageCid = '';
      this.modalImageAlt = '';
      const modal = new bootstrap.Modal(document.getElementById('imageModal'));
      modal.show();
    },
    
    showAssetModal() {
      this.modalAssetId = '';
      this.modalAssetText = '';
      const modal = new bootstrap.Modal(document.getElementById('assetModal'));
      modal.show();
    },
    
    insertContract() {
      if (!this.modalContractId.trim()) return;
      
      const contractText = this.modalContractText.trim() || this.modalContractId;
      const contractLink = `[${contractText}](dlux://contract/${this.modalContractId})`;
      
      this.editor.chain().focus().insertContent(contractLink).run();
      
      // Emit to parent to add to contracts array
      this.$emit('addContract', this.modalContractId.trim());
      
      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('contractModal'));
      modal.hide();
    },
    
    insertImage() {
      if (!this.modalImageCid.trim()) return;
      
      const altText = this.modalImageAlt.trim() || 'Image';
      const imageUrl = `https://ipfs.dlux.io/ipfs/${this.modalImageCid}`;
      const imageMarkdown = `![${altText}](${imageUrl})`;
      
      this.editor.chain().focus().insertContent(imageMarkdown).run();
      
      // Emit to parent to add to images array
      this.$emit('addImage', {
        cid: this.modalImageCid.trim(),
        alt: altText,
        url: imageUrl
      });
      
      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('imageModal'));
      modal.hide();
    },
    
    insertAsset() {
      if (!this.modalAssetId.trim()) return;
      
      const assetText = this.modalAssetText.trim() || this.modalAssetId;
      const assetLink = `[${assetText}](dlux://asset/${this.modalAssetId})`;
      
      this.editor.chain().focus().insertContent(assetLink).run();
      
      // Emit to parent to add to assets array
      this.$emit('addAsset', this.modalAssetId.trim());
      
      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('assetModal'));
      modal.hide();
    }
  },
  watch: {
    'insert': {
      handler: function (newValue) {
        if (newValue) {
          this.insertText(newValue);
        }
      },
      deep: true
    },
    
    'collaborationProvider': {
      handler: function (newProvider) {
        if (newProvider && this.showCollaboration && this.collaborationYdoc) {
          console.log('📡 TipTap collaboration provider received, setting up...');
          setTimeout(() => {
            this.setupCollaboration();
          }, 100);
        }
      },
      immediate: true
    },
    
    'showCollaboration': {
      handler: function (newValue) {
        console.log('🤝 TipTap show collaboration changed:', newValue);
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
          history: !this.showCollaboration, // Only enable history if not collaborating
        }),
        Placeholder.default.configure({
          placeholder: this.placeholder,
        }),
      ],
      content: '',
      onUpdate: ({ editor }) => {
        // Always emit markdown content
        const markdown = this.getMarkdown();
        this.$emit("data", markdown);
        this.updateCanUndoRedo();
      },
      onSelectionUpdate: () => {
        this.updateCanUndoRedo();
      }
    });

    // Insert initial content if provided and not in collaboration mode
    if (this.insert && !this.showCollaboration) {
      this.insertText(this.insert);
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