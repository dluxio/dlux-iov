// Fresh TipTap Collaborative Editor
// Based on official TipTap v3 documentation: https://next.tiptap.dev/docs/collaboration/getting-started/install

export default {
  name: "CollaborativeTiptapEditor",
  template: `
    <div class="collaborative-tiptap-editor">
      <!-- Collaboration Status Bar -->
      <div v-if="showCollaboration" class="collab-status-bar bg-primary p-2 rounded-top d-flex align-items-center">
        <div class="d-flex align-items-center">
          <i class="fas fa-users me-2"></i>
          <span class="fw-bold">{{ collaborationConfig.documentName || 'Collaborative Document' }}</span>
          <span v-if="connectionStatus" class="badge ms-2" :class="connectionStatusClass">
            {{ connectionStatus }}
          </span>
        </div>
        <div class="ms-auto d-flex align-items-center">
          <span v-if="connectedUsers.length > 0" class="me-2 small">
            {{ connectedUsers.length }} user{{ connectedUsers.length !== 1 ? 's' : '' }} online
          </span>
          <div v-if="connectedUsers.length > 0" class="d-flex">
            <div v-for="user in connectedUsers.slice(0, 5)" 
                 :key="user.name" 
                 class="collab-user-avatar me-1" 
                 :style="{ backgroundColor: user.color }"
                 :title="user.name">
              {{ user.name.charAt(0).toUpperCase() }}
            </div>
          </div>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="tiptap-toolbar border p-2 bg-light d-flex flex-wrap gap-1">
        <button @click="toggleBold" :class="{ active: isActive('bold') }" class="btn btn-sm btn-outline-secondary">
          <i class="fas fa-bold"></i>
        </button>
        <button @click="toggleItalic" :class="{ active: isActive('italic') }" class="btn btn-sm btn-outline-secondary">
          <i class="fas fa-italic"></i>
        </button>
        <button @click="toggleStrike" :class="{ active: isActive('strike') }" class="btn btn-sm btn-outline-secondary">
          <i class="fas fa-strikethrough"></i>
        </button>
        <div class="vr"></div>
        <button @click="setHeading(1)" :class="{ active: isActive('heading', { level: 1 }) }" class="btn btn-sm btn-outline-secondary">
          H1
        </button>
        <button @click="setHeading(2)" :class="{ active: isActive('heading', { level: 2 }) }" class="btn btn-sm btn-outline-secondary">
          H2
        </button>
        <button @click="setHeading(3)" :class="{ active: isActive('heading', { level: 3 }) }" class="btn btn-sm btn-outline-secondary">
          H3
        </button>
        <div class="vr"></div>
        <button @click="toggleBulletList" :class="{ active: isActive('bulletList') }" class="btn btn-sm btn-outline-secondary">
          <i class="fas fa-list-ul"></i>
        </button>
        <button @click="toggleOrderedList" :class="{ active: isActive('orderedList') }" class="btn btn-sm btn-outline-secondary">
          <i class="fas fa-list-ol"></i>
        </button>
        <div class="vr"></div>
        <button @click="toggleBlockquote" :class="{ active: isActive('blockquote') }" class="btn btn-sm btn-outline-secondary">
          <i class="fas fa-quote-left"></i>
        </button>
        <button @click="insertHorizontalRule" class="btn btn-sm btn-outline-secondary">
          <i class="fas fa-minus"></i>
        </button>
        
        <!-- Collaboration Controls -->
        <div v-if="showCollaboration" class="ms-auto d-flex gap-2">
          <span v-if="lastSaved" class="small text-muted align-self-center">
            Saved {{ formatTime(lastSaved) }}
          </span>
          <button v-if="!isConnected" @click="reconnect" class="btn btn-sm btn-warning">
            <i class="fas fa-wifi me-1"></i>Reconnect
          </button>
        </div>
      </div>

      <!-- Editor Content -->
      <div ref="editorElement" class="tiptap-content border border-top-0 p-3" style="min-height: 300px;"></div>
    </div>
  `,
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: 'Start writing...'
    },
    showCollaboration: {
      type: Boolean,
      default: false
    },
    collaborationConfig: {
      type: Object,
      default: () => ({
        documentName: '',
        websocketUrl: '',
        authHeaders: {}
      })
    }
  },
  emits: ['update:modelValue', 'connected', 'disconnected', 'error'],
  data() {
    return {
      editor: null,
      provider: null,
      doc: null,
      connectionStatus: 'Disconnected',
      connectedUsers: [],
      lastSaved: null,
      reconnectAttempts: 0,
      maxReconnectAttempts: 5,
      _initializing: false
    }
  },
  computed: {
    connectionStatusClass() {
      switch (this.connectionStatus) {
        case 'Connected': return 'bg-success text-white';
        case 'Connecting': return 'bg-warning text-dark';
        case 'Disconnected': return 'bg-danger text-white';
        case 'Error': return 'bg-danger text-white';
        case 'Failed - Using Standard': return 'bg-warning text-dark';
        default: return 'bg-secondary text-white';
      }
    },
    isConnected() {
      return this.connectionStatus === 'Connected';
    }
  },
  methods: {
    async initializeEditor() {
      console.log('🚀 Initializing TipTap collaborative editor...');
      
      // Prevent multiple initializations
      if (this._initializing) {
        console.log('⏸️ Editor initialization already in progress');
        return;
      }
      this._initializing = true;
      
      try {
        // Check if TipTap collaboration bundle is loaded
        if (!window.TiptapCollaboration) {
          throw new Error('TipTap collaboration bundle not loaded. Make sure tiptap-collaboration.bundle.js is included.');
        }

        // Debug what's actually in the bundle
        console.log('🔍 TiptapCollaboration bundle contents:', window.TiptapCollaboration);
        console.log('🔍 Available keys:', Object.keys(window.TiptapCollaboration));
        console.log('🔍 Default export:', window.TiptapCollaboration.default);
        
        // Get the actual bundle - it's exported as .default
        const bundle = window.TiptapCollaboration.default || window.TiptapCollaboration;
        console.log('🔍 Bundle to use:', bundle);
        console.log('🔍 Bundle keys:', Object.keys(bundle));

        // Get all components from the bundle - with fallbacks
        const bundleY = bundle.Y;
        const globalY = window.Y;
        const Y = bundleY || globalY; // Try bundle first, fallback to global
        
        const {
          HocuspocusProvider,
          Editor,
          StarterKit,
          Collaboration,
          CollaborationCursor,
          Placeholder
        } = bundle;
        
        // Validate that all required components are available
        if (!Y || !Y.Doc) {
          throw new Error('Y.js not available in bundle');
        }
        if (!Editor) {
          throw new Error('TipTap Editor not available in bundle');
        }
        if (!HocuspocusProvider) {
          throw new Error('HocuspocusProvider not available in bundle');
        }

        console.log('✅ All TipTap components loaded from bundle');

        if (this.showCollaboration) {
          try {
            await this.setupCollaborativeEditor({ Editor, StarterKit, Collaboration, CollaborationCursor, Placeholder, HocuspocusProvider, Y });
          } catch (collabError) {
            console.warn('⚠️ Collaboration failed, falling back to standard editor:', collabError);
            this.connectionStatus = 'Failed - Using Standard';
            await this.setupStandardEditor({ Editor, StarterKit, Placeholder });
          }
        } else {
          await this.setupStandardEditor({ Editor, StarterKit, Placeholder });
        }

      } catch (error) {
        console.error('❌ Failed to initialize editor:', error);
        this.$emit('error', error);
        this.connectionStatus = 'Error';
      } finally {
        this._initializing = false;
      }
    },

    async setupCollaborativeEditor({ Editor, StarterKit, Collaboration, CollaborationCursor, Placeholder, HocuspocusProvider, Y }) {
      console.log('🤝 Setting up collaborative editor...');
      this.connectionStatus = 'Connecting';

      // Create Y.js document
      this.doc = new Y.Doc();

      // Setup provider with auth
      const { websocketUrl, authHeaders } = this.collaborationConfig;
      
      if (!websocketUrl) {
        throw new Error('WebSocket URL required for collaboration');
      }

      console.log('🔗 Connecting to:', websocketUrl);
      console.log('🔑 Auth headers:', Object.keys(authHeaders || {}));

      this.provider = new HocuspocusProvider({
        url: websocketUrl,
        name: this.collaborationConfig.documentName || 'document',
        document: this.doc,
        token: authHeaders['x-signature'] || '', // Use existing auth
        
        // Simplified connection handlers
        onConnect: () => {
          console.log('✅ Connected to collaboration server');
          this.connectionStatus = 'Connected';
          this.reconnectAttempts = 0;
          this.$emit('connected');
        },
        
        onDisconnect: ({ event }) => {
          console.log('❌ Disconnected from collaboration server');
          this.connectionStatus = 'Disconnected';
          this.$emit('disconnected');
        },
        
        onError: (error) => {
          console.error('❌ Provider error:', error);
          this.connectionStatus = 'Error';
          this.$emit('error', error);
        }
      });

      // Simple editor setup - let TipTap handle the complexity
      this.editor = new Editor({
        element: this.$refs.editorElement,
        extensions: [
          StarterKit.configure({
            history: false, // Disable history for collaboration
          }),
          Collaboration.configure({
            document: this.doc,
          }),
          CollaborationCursor.configure({
            provider: this.provider,
            user: {
              name: authHeaders['x-account'] || 'Anonymous',
              color: this.generateUserColor(authHeaders['x-account'] || 'Anonymous')
            }
          }),
          Placeholder.configure({
            placeholder: this.placeholder,
          }),
        ],
        content: this.modelValue || '', // Use provided content
        onUpdate: ({ editor }) => {
          const content = editor.getHTML();
          this.$emit('update:modelValue', content);
          this.lastSaved = new Date();
        },
        onCreate: ({ editor }) => {
          console.log('✅ Collaborative editor created successfully');
        },
        onError: ({ error }) => {
          console.error('❌ Editor error:', error);
          throw error; // Re-throw to trigger fallback
        }
      });
    },

    async setupStandardEditor({ Editor, StarterKit, Placeholder }) {
      console.log('📝 Setting up standard editor...');
      
      this.editor = new Editor({
        element: this.$refs.editorElement,
        extensions: [
          StarterKit,
          Placeholder.configure({
            placeholder: this.placeholder,
          }),
        ],
        content: this.modelValue,
        onUpdate: ({ editor }) => {
          const content = editor.getHTML();
          this.$emit('update:modelValue', content);
        },
        onCreate: ({ editor }) => {
          console.log('✅ Standard editor created');
        }
      });

      this.connectionStatus = 'Standard';
    },

    updateConnectedUsers(states) {
      try {
        const users = Array.from(states.values())
          .filter(state => state.user && state.user.name)
          .map(state => ({
            name: state.user.name,
            color: state.user.color || this.generateUserColor(state.user.name)
          }));
        
        this.connectedUsers = users;
      } catch (error) {
        console.warn('Error updating connected users:', error);
      }
    },

    generateUserColor(username) {
      let hash = 0;
      for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
      }
      const hue = Math.abs(hash) % 360;
      return `hsl(${hue}, 70%, 50%)`;
    },

    formatTime(date) {
      const now = new Date();
      const diff = now - date;
      
      if (diff < 60000) return 'just now';
      if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
      return date.toLocaleDateString();
    },

    async reconnect() {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.warn('⚠️ Max reconnection attempts reached');
        this.connectionStatus = 'Failed - Using Standard';
        // Fall back to standard editor
        if (window.TiptapCollaboration) {
          const bundle = window.TiptapCollaboration.default || window.TiptapCollaboration;
          const { Editor, StarterKit, Placeholder } = bundle;
          await this.setupStandardEditor({ Editor, StarterKit, Placeholder });
        }
        return;
      }

      this.reconnectAttempts++;
      console.log(`🔄 Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      this.disconnect();
      
      setTimeout(() => {
        if (!this._initializing) { // Only reconnect if not already initializing
          this.initializeEditor();
        }
      }, 1000 * this.reconnectAttempts); // Exponential backoff
    },

    disconnect() {
      console.log('🔌 Disconnecting editor and provider');
      
      if (this.provider) {
        this.provider.disconnect();
        this.provider = null;
      }
      
      if (this.editor) {
        this.editor.destroy();
        this.editor = null;
      }
      
      this.doc = null;
      this.connectionStatus = 'Disconnected';
    },

    // Toolbar methods
    toggleBold() {
      this.editor?.chain().focus().toggleBold().run();
    },

    toggleItalic() {
      this.editor?.chain().focus().toggleItalic().run();
    },

    toggleStrike() {
      this.editor?.chain().focus().toggleStrike().run();
    },

    setHeading(level) {
      this.editor?.chain().focus().toggleHeading({ level }).run();
    },

    toggleBulletList() {
      this.editor?.chain().focus().toggleBulletList().run();
    },

    toggleOrderedList() {
      this.editor?.chain().focus().toggleOrderedList().run();
    },

    toggleBlockquote() {
      this.editor?.chain().focus().toggleBlockquote().run();
    },

    insertHorizontalRule() {
      this.editor?.chain().focus().setHorizontalRule().run();
    },

    isActive(name, attrs = {}) {
      return this.editor?.isActive(name, attrs) || false;
    }
  },

  watch: {
    modelValue(newValue) {
      if (this.editor && !this.showCollaboration) {
        const currentContent = this.editor.getHTML();
        if (currentContent !== newValue) {
          this.editor.commands.setContent(newValue);
        }
      }
    },

    showCollaboration(newValue, oldValue) {
      // Only reinitialize if collaboration mode actually changed
      if (newValue !== oldValue && !this._initializing) {
        console.log(`🔄 Collaboration mode changed: ${oldValue} → ${newValue}`);
        this.disconnect();
        this.$nextTick(() => {
          this.initializeEditor();
        });
      }
    },

    'collaborationConfig.websocketUrl'(newValue, oldValue) {
      // Only reconnect if URL actually changed and we're in collaboration mode
      if (newValue !== oldValue && newValue && this.showCollaboration && !this._initializing) {
        console.log(`🔄 WebSocket URL changed, reconnecting...`);
        this.reconnect();
      }
    }
  },

  async mounted() {
    console.log('🔧 Collaborative editor mounting...', {
      showCollaboration: this.showCollaboration,
      hasWebsocketUrl: !!this.collaborationConfig.websocketUrl
    });
    await this.initializeEditor();
  },

  beforeUnmount() {
    console.log('🧹 Collaborative editor unmounting...');
    this.disconnect();
  }
}; 