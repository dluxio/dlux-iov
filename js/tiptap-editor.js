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
      return this.collaborationProvider && this.collaborationProvider.isSynced;
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
      
      // In collaboration mode, check if Y.js observer is working
      if (this.showCollaboration) {
        console.log('🔍 Collaboration mode: checking if content needs update', {
          field: this.collaborationField,
          newValue: value ? value.substring(0, 50) + '...' : 'empty',
          currentContent: this.editor.getText().substring(0, 50) + '...',
          hasYText: !!this._yText,
          contentMatches: this.editor.getText() === value
        });
        
        // If content is different and we have a Y.js text instance, try to sync it
        if (value && this.editor.getText() !== value && this._yText) {
          const yTextContent = this._yText.toString();
          
          // If Y.js has the content but TipTap doesn't, force update TipTap
          if (yTextContent === value && this.editor.getText() !== value) {
            console.log('🔧 Forcing TipTap update from Y.js content for field:', this.collaborationField);
            this._updatingFromYjs = true;
            try {
              console.log(`🔧 About to force setContent for field ${this.collaborationField}:`, {
                value: value.substring(0, 100),
                valueLength: value.length,
                currentContent: this.editor.getText().substring(0, 100),
                currentLength: this.editor.getText().length,
                yTextContent: yTextContent.substring(0, 100),
                editorExists: !!this.editor,
                editorDestroyed: this.editor.isDestroyed
              });
              
              const success = this.editor.commands.setContent(value || '', false);
              console.log(`🔧 Force setContent result for field ${this.collaborationField}:`, success);
              
              if (success) {
                console.log(`✅ Successfully forced TipTap update for field ${this.collaborationField}`);
              } else {
                console.warn(`⚠️ Force setContent returned false for field ${this.collaborationField}`);
              }
              
              setTimeout(() => {
                this._updatingFromYjs = false;
                // Double-check if content was actually set
                const finalContent = this.editor.getText();
                console.log(`🔍 Final editor content check for field ${this.collaborationField}:`, {
                  expectedContent: value.substring(0, 50),
                  actualContent: finalContent.substring(0, 50),
                  contentMatches: finalContent === value
                });
              }, 100);
              return;
            } catch (error) {
              console.error('❌ Failed to force update TipTap from Y.js:', error);
              console.error('Error details:', {
                errorMessage: error.message,
                errorStack: error.stack,
                field: this.collaborationField,
                value: value ? value.substring(0, 50) : 'empty'
              });
              this._updatingFromYjs = false;
            }
          }
          
          // If neither Y.js nor TipTap has the content, update Y.js
          if (yTextContent !== value) {
            console.log('🔧 Updating Y.js from prop change for field:', this.collaborationField);
            this.collaborationYdoc.transact(() => {
              this._yText.delete(0, this._yText.length);
              this._yText.insert(0, value);
            }, 'prop-update');
            return;
          }
        }
        
        console.log('✅ Collaboration mode: no manual update needed');
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
      console.log('🔧 Creating TipTap editor with bundle Y.js (no external imports)');
      
      const { Editor } = await import('https://esm.sh/@tiptap/core@3.0.0');
      const StarterKit = await import('https://esm.sh/@tiptap/starter-kit@3.0.0');
      const Placeholder = await import('https://esm.sh/@tiptap/extension-placeholder@3.0.0');
      
      this.editor = new Editor({
        element: this.$refs.editor,
        extensions: [
          StarterKit.default.configure({
            history: false, // Disable history for collaboration
          }),
          Placeholder.default.configure({
            placeholder: this.placeholder,
          }),
        ],
        editable: true,
        content: initialContent || '',
        editorProps: {
          attributes: {
            class: 'tiptap-collaborative',
          },
        },
        onUpdate: ({ editor }) => {
          const content = this.getMarkdown();
          
          console.log(`🔄 TipTap onUpdate called for field ${this.collaborationField}:`, {
            contentLength: content.length,
            content: content.substring(0, 50) + '...',
            updatingFromYjs: this._updatingFromYjs,
            hasCollaborationYdoc: !!this.collaborationYdoc,
            willSyncToYjs: !!(this.collaborationYdoc && !this._updatingFromYjs)
          });
          
          this.$emit("data", content);
          
          // Sync to Y.js using bundle's Y.js instance (no imports!)
          if (this.collaborationYdoc && !this._updatingFromYjs) {
            const yText = this.collaborationYdoc.getText(this.collaborationField);
            const yTextContent = yText.toString();
            
            console.log(`🔍 Checking if Y.js needs update for field ${this.collaborationField}:`, {
              yTextContent: yTextContent.substring(0, 50) + '...',
              editorContent: content.substring(0, 50) + '...',
              contentsMatch: yTextContent === content
            });
            
            if (yTextContent !== content) {
              console.log(`📤 Syncing TipTap content to Y.js field ${this.collaborationField}:`, {
                content: content.substring(0, 50) + '...',
                yjsDocId: this.collaborationYdoc.clientID,
                yjsConnected: this.collaborationProvider ? (this.collaborationProvider.isSynced ? 'isSynced' : 'not synced') : 'no provider',
                providerKeys: this.collaborationProvider ? Object.keys(this.collaborationProvider) : 'no provider'
              });
              this.collaborationYdoc.transact(() => {
                yText.delete(0, yText.length);
                yText.insert(0, content);
              }, 'tiptap-update');
            } else {
              console.log(`✅ Y.js content already matches TipTap for field ${this.collaborationField}, no sync needed`);
            }
          } else {
            console.log(`⏭️ Skipping Y.js sync for field ${this.collaborationField}:`, {
              hasYdoc: !!this.collaborationYdoc,
              updatingFromYjs: this._updatingFromYjs,
              reason: !this.collaborationYdoc ? 'no Y.js doc' : 'updating from Y.js'
            });
          }
          
          this.updateCanUndoRedo();
        },
        onSelectionUpdate: () => {
          this.updateCanUndoRedo();
        },
        onCreate: () => {
          console.log(`✅ TipTap editor created with bundle Y.js for field: ${this.collaborationField}`);
          
          // Set up Y.js → TipTap sync using bundle's Y.js
          if (this.collaborationYdoc) {
            this.setupBundleYjsSync();
          }
        },
        onError: (error) => {
          console.error(`TipTap editor error for field ${this.collaborationField}:`, error);
        }
      });
      
      console.log('✅ TipTap editor ready with bundle Y.js!');
    },
    
    setupBundleYjsSync() {
      const yText = this.collaborationYdoc.getText(this.collaborationField);
      
      console.log(`🔧 Setting up Y.js sync for field ${this.collaborationField}:`, {
        yDocExists: !!this.collaborationYdoc,
        yTextExists: !!yText,
        yDocClientId: this.collaborationYdoc ? this.collaborationYdoc.clientID : 'none',
        yTextContent: yText ? yText.toString() : 'no yText',
        yTextLength: yText ? yText.length : 0,
        editorExists: !!this.editor,
        providerExists: !!this.collaborationProvider,
        providerSynced: this.collaborationProvider ? this.collaborationProvider.isSynced : 'no provider'
      });
      
      // Listen for Y.js changes and update TipTap
      const observer = (event, transaction) => {
        console.log(`🔍 Y.js observer called for field ${this.collaborationField}:`, {
          origin: transaction.origin,
          updatingFromYjs: this._updatingFromYjs,
          hasEditor: !!this.editor,
          yTextContent: yText.toString().substring(0, 50) + '...'
        });
        
        if (transaction.origin !== 'tiptap-update' && !this._updatingFromYjs) {
          const newContent = yText.toString();
          const currentContent = this.getMarkdown();
          
          if (newContent !== currentContent) {
            console.log(`📥 Syncing Y.js content to TipTap field ${this.collaborationField}:`, {
              newLength: newContent.length,
              currentLength: currentContent.length,
              origin: transaction.origin,
              newContent: newContent.substring(0, 100) + '...',
              currentContent: currentContent.substring(0, 100) + '...'
            });
            
            // Set flag BEFORE any setContent call to prevent loops
            this._updatingFromYjs = true;
            console.log(`🔒 Set _updatingFromYjs = true for field ${this.collaborationField}`);
            
            // Update TipTap content carefully
            if (this.editor && !this.editor.isDestroyed) {
              try {
                console.log(`🔧 About to call setContent for field ${this.collaborationField}:`, {
                  newContent: newContent.substring(0, 100),
                  contentLength: newContent.length,
                  editorIsDestroyed: this.editor.isDestroyed,
                  editorHasCommands: !!this.editor.commands,
                  editorHasSetContent: !!this.editor.commands.setContent
                });
                
                // Try setContent with error handling and timeout detection
                let setContentCompleted = false;
                let setContentResult = false;
                
                // Set a timeout to detect hanging
                const timeoutId = setTimeout(() => {
                  if (!setContentCompleted) {
                    console.warn(`⏰ setContent appears to be hanging for field ${this.collaborationField} - this indicates a deeper TipTap issue`);
                  }
                }, 1000);
                
                try {
                  setContentResult = this.editor.commands.setContent(newContent || '', false);
                  setContentCompleted = true;
                  clearTimeout(timeoutId);
                  console.log(`🔧 setContent result for field ${this.collaborationField}:`, setContentResult);
                } catch (error) {
                  setContentCompleted = true;
                  clearTimeout(timeoutId);
                  console.error(`❌ setContent threw error for field ${this.collaborationField}:`, error);
                }
                
                this.$emit("data", newContent);
                console.log(`✅ TipTap updated from Y.js for field ${this.collaborationField}`);
              } catch (error) {
                console.error(`❌ Failed to update TipTap from Y.js for field ${this.collaborationField}:`, error);
                console.error('Error details:', {
                  errorMessage: error.message,
                  errorStack: error.stack,
                  editorState: this.editor ? 'exists' : 'null',
                  editorDestroyed: this.editor ? this.editor.isDestroyed : 'no editor'
                });
              }
            } else {
              console.warn(`⚠️ Cannot update TipTap for field ${this.collaborationField} - editor not available:`, {
                hasEditor: !!this.editor,
                isDestroyed: this.editor ? this.editor.isDestroyed : 'no editor'
              });
            }
            
            setTimeout(() => {
              this._updatingFromYjs = false;
            }, 100);
          } else {
            console.log(`🔄 Y.js content same as TipTap for field ${this.collaborationField}, no update needed`);
          }
        } else {
          console.log(`⏭️ Y.js observer skipped for field ${this.collaborationField} (origin: ${transaction.origin}, updating: ${this._updatingFromYjs})`);
        }
      };
      
      yText.observe(observer);
      this._yTextObserver = observer;
      this._yText = yText;
      
      console.log(`👂 Set up bundle Y.js sync for field: ${this.collaborationField}`);
      
      // Load any existing content from Y.js
      const existingContent = yText.toString();
      if (existingContent && existingContent !== this.getMarkdown()) {
        console.log(`📥 Loading existing Y.js content for field ${this.collaborationField}:`, existingContent.substring(0, 50) + '...');
        this._updatingFromYjs = true;
        this.editor.commands.setContent(existingContent, false);
        this.$emit("data", existingContent);
        setTimeout(() => {
          this._updatingFromYjs = false;
        }, 100);
      }
    },
    
    markdownToHtml(markdown) {
      // Simple markdown to HTML conversion for basic formatting
      return markdown
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    },
    
    async recreateEditorWithNewContent(newContent) {
      if (!this.editor) return;
      
      console.log('🔄 Recreating TipTap editor with new content:', newContent.substring(0, 50) + '...');
      
      // Store current setup
      const editorElement = this.$refs.editor;
      const currentYText = this._yText;
      const currentObserver = this._yTextObserver;
      
      // Clean up current editor
      if (currentObserver && currentYText) {
        currentYText.unobserve(currentObserver);
      }
      this.editor.destroy();
      
      // Recreate editor with new content
      await this.createEditorWithSimpleCollaboration(newContent);
      
      console.log('✅ TipTap editor recreated with new content');
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
      handler: function (newValue, oldValue) {
        console.log(`🔍 TipTap insert prop watcher triggered for field ${this.collaborationField}:`, {
          newValue: newValue ? newValue.substring(0, 50) + '...' : 'empty/null',
          oldValue: oldValue ? oldValue.substring(0, 50) + '...' : 'empty/null',
          valueChanged: newValue !== oldValue,
          showCollaboration: this.showCollaboration,
          editorExists: !!this.editor
        });
        
        if (newValue) {
          this.insertText(newValue);
        } else {
          console.log(`⏭️ Skipping insertText for field ${this.collaborationField} - no value provided`);
        }
      },
      deep: true
    },
    
    'collaborationProvider': {
      handler: function (newProvider) {
                 console.log('📡 TipTap collaboration provider watcher triggered:', {
           hasProvider: !!newProvider,
           showCollaboration: this.showCollaboration,
           hasYdoc: !!this.collaborationYdoc,
           providerConnected: newProvider ? (newProvider.isSynced ? 'isSynced' : newProvider.isAuthenticated ? 'authenticated' : 'not synced') : 'none'
         });
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