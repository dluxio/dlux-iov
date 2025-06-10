import methodsCommon from './methods-common.js';

export default {
    name: 'CollaborativeTipTapEditor',
    
    props: {
        documentName: {
            type: String,
            required: true
        },
        username: {
            type: String,
            required: true
        },
        authHeaders: {
            type: Object,
            default: () => ({})
        },
        collaborationUrl: {
            type: String,
            default: 'wss://data.dlux.io/collaboration'
        },
        autoConnect: {
            type: Boolean,
            default: true
        }
    },
    
    data() {
        return {
            // TipTap instances
            editors: {},
            
            // Collaboration state
            ydoc: null,
            provider: null,
            connectionStatus: 'disconnected',
            connectionMessage: 'Not connected',
            
            // Field configurations
            fieldConfigs: {},
            
            // Content management
            content: {},
            
            // Bundle reference
            TiptapBundle: null
        };
    },
    
    mixins: [methodsCommon],
    
    computed: {
        isConnected() {
            return this.connectionStatus === 'connected';
        },
        
        isConnecting() {
            return this.connectionStatus === 'connecting';
        },
        
        wsUrl() {
            const baseUrl = `${this.collaborationUrl}/${this.username}/${this.documentName}`;
            const authParams = new URLSearchParams();
            
            Object.entries(this.authHeaders).forEach(([key, value]) => {
                const paramName = key.replace('x-', '');
                authParams.set(paramName, value);
            });
            
            return `${baseUrl}?${authParams.toString()}`;
        }
    },
    
    methods: {
        // Initialize the collaborative editor system
        async initializeCollaboration() {
            try {
                this.connectionStatus = 'connecting';
                this.connectionMessage = 'Loading collaboration bundle...';
                
                // Load TipTap bundle
                this.TiptapBundle = window.TiptapCollaboration?.default || window.TiptapCollaboration;
                
                if (!this.TiptapBundle) {
                    throw new Error('TipTap collaboration bundle not loaded');
                }
                
                const { Y, HocuspocusProvider } = this.TiptapBundle;
                
                // Create Y.js document
                this.ydoc = new Y.Doc();
                
                // Setup WebSocket provider with authentication
                this.connectionMessage = 'Connecting to collaboration server...';
                
                const authToken = JSON.stringify({
                    account: this.authHeaders['x-account'] || this.username,
                    signature: this.authHeaders['x-signature'],
                    challenge: this.authHeaders['x-challenge'],
                    pubkey: this.authHeaders['x-pubkey']
                });
                
                this.provider = new HocuspocusProvider({
                    url: this.wsUrl,
                    name: `${this.username}/${this.documentName}`,
                    document: this.ydoc,
                    token: authToken,
                    onConnect: this.onConnect,
                    onDisconnect: this.onDisconnect,
                    onSynced: this.onSynced,
                    onAuthenticationFailed: this.onAuthenticationFailed
                });
                
                console.log('🎉 Collaborative editor system initialized');
                
            } catch (error) {
                console.error('❌ Failed to initialize collaboration:', error);
                this.connectionStatus = 'disconnected';
                this.connectionMessage = `Error: ${error.message}`;
                throw error;
            }
        },
        
        // Connection event handlers
        onConnect() {
            console.log('✅ Connected to collaboration server');
            this.connectionStatus = 'connected';
            this.connectionMessage = 'Connected - Real-time collaboration active';
            this.$emit('connection-changed', { status: 'connected', message: this.connectionMessage });
        },
        
        onDisconnect({ event }) {
            console.log('❌ Disconnected from collaboration server');
            this.connectionStatus = 'disconnected';
            this.connectionMessage = 'Disconnected from server';
            this.$emit('connection-changed', { status: 'disconnected', message: this.connectionMessage });
        },
        
        onSynced({ synced }) {
            if (synced) {
                console.log('📡 Document synchronized');
                this.connectionMessage = 'Connected - Document synchronized';
                this.$emit('synced', { synced: true });
            }
        },
        
        onAuthenticationFailed({ reason }) {
            console.error('🔐 Authentication failed:', reason);
            this.connectionStatus = 'disconnected';
            this.connectionMessage = `Authentication failed: ${reason}`;
            this.$emit('connection-changed', { status: 'error', message: this.connectionMessage });
        },
        
        // Create a new field editor
        createFieldEditor(fieldName, element, config = {}) {
            if (!this.TiptapBundle || !this.ydoc) {
                throw new Error('Collaboration not initialized');
            }
            
            const { Editor, StarterKit, Collaboration, CollaborationCursor } = this.TiptapBundle;
            
            // Default configuration for different field types
            const defaultConfigs = {
                title: {
                    extensions: [
                        StarterKit.configure({
                            heading: false,
                            bulletList: false,
                            orderedList: false,
                            blockquote: false,
                            codeBlock: false,
                            horizontalRule: false
                        })
                    ],
                    singleLine: true,
                    placeholder: 'Enter title...'
                },
                body: {
                    extensions: [StarterKit],
                    singleLine: false,
                    placeholder: 'Start writing...'
                },
                json: {
                    extensions: [StarterKit.configure({ codeBlock: true })],
                    singleLine: false,
                    placeholder: 'Enter JSON...',
                    jsonMode: true
                }
            };
            
            // Merge configurations
            const fieldConfig = {
                ...defaultConfigs[config.type] || defaultConfigs.body,
                ...config
            };
            
            // Create editor extensions
            const extensions = [
                ...fieldConfig.extensions,
                Collaboration.configure({
                    document: this.ydoc,
                    field: fieldName
                }),
                CollaborationCursor.configure({
                    provider: this.provider,
                    user: {
                        name: this.username,
                        color: this.generateUserColor(this.username)
                    }
                })
            ];
            
            // Create editor
            const editor = new Editor({
                element: element,
                extensions: extensions,
                content: fieldConfig.initialContent || '',
                editorProps: {
                    attributes: {
                        class: 'tiptap-editor border-0',
                        placeholder: fieldConfig.placeholder
                    },
                    handleKeyDown: fieldConfig.singleLine ? (view, event) => {
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            this.$emit('enter-pressed', { fieldName, editor });
                            return true;
                        }
                        return false;
                    } : undefined
                },
                onCreate: () => {
                    console.log(`📝 ${fieldName} editor created`);
                    this.$emit('field-created', { fieldName, editor });
                },
                onUpdate: ({ editor }) => {
                    this.content[fieldName] = {
                        text: editor.getText(),
                        html: editor.getHTML(),
                        json: editor.getJSON()
                    };
                    this.$emit('content-changed', { fieldName, content: this.content[fieldName] });
                }
            });
            
            // Store editor and config
            this.editors[fieldName] = editor;
            this.fieldConfigs[fieldName] = fieldConfig;
            
            console.log(`✅ Field editor '${fieldName}' created`);
            return editor;
        },
        
        // Remove a field editor
        removeFieldEditor(fieldName) {
            if (this.editors[fieldName]) {
                this.editors[fieldName].destroy();
                delete this.editors[fieldName];
                delete this.fieldConfigs[fieldName];
                delete this.content[fieldName];
                console.log(`🗑️ Field editor '${fieldName}' removed`);
            }
        },
        
        // Get editor for a specific field
        getEditor(fieldName) {
            return this.editors[fieldName];
        },
        
        // Get content from all fields
        getAllContent() {
            const allContent = {};
            Object.keys(this.editors).forEach(fieldName => {
                const editor = this.editors[fieldName];
                allContent[fieldName] = {
                    text: editor.getText(),
                    html: editor.getHTML(),
                    json: editor.getJSON()
                };
            });
            return allContent;
        },
        
        // Set content for a specific field
        setFieldContent(fieldName, content) {
            const editor = this.editors[fieldName];
            if (editor) {
                if (typeof content === 'string') {
                    editor.commands.setContent(content);
                } else {
                    editor.commands.setContent(content);
                }
            }
        },
        
        // Clear content from a specific field
        clearFieldContent(fieldName) {
            const editor = this.editors[fieldName];
            if (editor) {
                editor.commands.clearContent();
            }
        },
        
        // Clear all field content
        clearAllContent() {
            Object.keys(this.editors).forEach(fieldName => {
                this.clearFieldContent(fieldName);
            });
            console.log('🗑️ All content cleared');
        },
        
        // Insert content with context awareness
        insertContent(contentData) {
            const { type, content, target } = contentData;
            
            switch (type) {
                case 'image':
                    this.insertImage(content, target);
                    break;
                case 'link':
                    this.insertLink(content, target);
                    break;
                case 'text':
                    this.insertText(content, target);
                    break;
                case 'json':
                    this.insertJSON(content, target);
                    break;
                default:
                    console.warn('Unknown content type:', type);
            }
        },
        
        // Insert image with smart field targeting
        insertImage(imageData, targetField = 'body') {
            const { url, alt, link } = imageData;
            
            // Insert image link in body editor
            const bodyEditor = this.editors[targetField] || this.editors.body;
            if (bodyEditor) {
                const imageMarkdown = `![${alt || 'Image'}](${url})`;
                bodyEditor.commands.insertContent(imageMarkdown);
            }
            
            // Add URL to images array in JSON field if exists
            if (this.editors.json) {
                try {
                    const currentJSON = this.editors.json.getJSON();
                    let jsonContent = {};
                    
                    if (currentJSON.content && currentJSON.content[0] && currentJSON.content[0].content) {
                        jsonContent = JSON.parse(currentJSON.content[0].content[0].text);
                    }
                    
                    if (!jsonContent.images) {
                        jsonContent.images = [];
                    }
                    
                    jsonContent.images.push({ url, alt, link });
                    
                    this.editors.json.commands.setContent(`<pre><code>${JSON.stringify(jsonContent, null, 2)}</code></pre>`);
                } catch (error) {
                    console.error('Error updating JSON field:', error);
                }
            }
            
            this.$emit('content-inserted', { type: 'image', data: imageData, target: targetField });
        },
        
        // Insert link
        insertLink(linkData, targetField = 'body') {
            const { url, text } = linkData;
            const editor = this.editors[targetField] || this.editors.body;
            
            if (editor) {
                const linkMarkdown = `[${text || url}](${url})`;
                editor.commands.insertContent(linkMarkdown);
            }
            
            this.$emit('content-inserted', { type: 'link', data: linkData, target: targetField });
        },
        
        // Insert text
        insertText(textData, targetField = 'body') {
            const { text } = textData;
            const editor = this.editors[targetField] || this.editors.body;
            
            if (editor) {
                editor.commands.insertContent(text);
            }
            
            this.$emit('content-inserted', { type: 'text', data: textData, target: targetField });
        },
        
        // Insert JSON
        insertJSON(jsonData, targetField = 'json') {
            const editor = this.editors[targetField] || this.editors.json;
            
            if (editor) {
                const jsonString = typeof jsonData === 'string' ? jsonData : JSON.stringify(jsonData, null, 2);
                editor.commands.setContent(`<pre><code>${jsonString}</code></pre>`);
            }
            
            this.$emit('content-inserted', { type: 'json', data: jsonData, target: targetField });
        },
        
        // Generate user color based on username
        generateUserColor(username) {
            let hash = 0;
            for (let i = 0; i < username.length; i++) {
                hash = username.charCodeAt(i) + ((hash << 5) - hash);
            }
            
            const hue = Math.abs(hash) % 360;
            return `hsl(${hue}, 70%, 60%)`;
        },
        
        // Focus a specific field
        focusField(fieldName) {
            const editor = this.editors[fieldName];
            if (editor) {
                editor.commands.focus();
            }
        },
        
        // Request authentication for collaboration
        requestAuth() {
            const op = {
                type: "collaboration_auth",
                txid: `collab_auth_${Date.now()}`,
                msg: "Authenticate for collaborative editing",
                status: "Requesting authentication...",
                time: new Date().getTime(),
                delay: 250,
                title: "Collaboration Authentication",
                document: this.documentName,
                username: this.username,
                challenge: Date.now().toString(),
                message: `Authenticate collaborative editing for ${this.documentName}`,
                ops: ["refreshCollaborationAuth"]
            };
            
            this.$emit('tosign', op);
        },
        
        // Handle successful authentication
        refreshCollaborationAuth(authResult) {
            if (authResult && authResult.headers) {
                this.authHeaders = { ...authResult.headers };
                this.$emit('auth-updated', this.authHeaders);
                
                // Reconnect with new auth
                if (this.provider) {
                    this.provider.disconnect();
                    this.initializeCollaboration();
                }
            }
        },
        
        // Cleanup
        destroy() {
            // Destroy all editors
            Object.keys(this.editors).forEach(fieldName => {
                this.editors[fieldName].destroy();
            });
            
            // Disconnect provider
            if (this.provider) {
                this.provider.disconnect();
            }
            
            // Destroy Y.js document
            if (this.ydoc) {
                this.ydoc.destroy();
            }
            
            // Clear state
            this.editors = {};
            this.fieldConfigs = {};
            this.content = {};
            this.ydoc = null;
            this.provider = null;
            this.connectionStatus = 'disconnected';
            
            console.log('🗑️ Collaborative editor destroyed');
        }
    },
    
    async mounted() {
        if (this.autoConnect) {
            try {
                await this.initializeCollaboration();
            } catch (error) {
                console.error('Failed to auto-initialize collaboration:', error);
                // Could request auth here if needed
                this.requestAuth();
            }
        }
    },
    
    beforeUnmount() {
        this.destroy();
    },
    
    // Template for the component
    template: `
    <div class="collaborative-editor">
        <div class="collaboration-status" :class="'status-' + connectionStatus">
            <i :class="{
                'fas fa-check-circle': isConnected,
                'fas fa-spinner fa-spin': isConnecting,
                'fas fa-exclamation-circle': connectionStatus === 'disconnected'
            }"></i>
            {{ connectionMessage }}
        </div>
        
        <slot 
            :editors="editors"
            :content="content"
            :connectionStatus="connectionStatus"
            :isConnected="isConnected"
            :createEditor="createFieldEditor"
            :removeEditor="removeFieldEditor"
            :insertContent="insertContent"
            :getAllContent="getAllContent"
            :clearAllContent="clearAllContent"
            :focusField="focusField"
            :requestAuth="requestAuth"
        />
    </div>
    `
};
