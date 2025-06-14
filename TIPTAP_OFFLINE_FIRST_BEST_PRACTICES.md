# TipTap Offline-First Collaborative Architecture: Definitive Best Practices

## Executive Summary

This document defines the **definitive architecture** for implementing TipTap's offline-first collaborative editing pattern based on official TipTap.dev documentation and best practices. Our implementation follows TipTap's recommended approach for maximum performance, reliability, and user experience.

## Core Design Principles

### 1. **Offline-First by Default**
- **Rule**: Always load basic editors first, without collaborative extensions
- **Rationale**: Better performance, faster initial load, no unnecessary Y.js overhead
- **Exception**: Only when explicitly loading collaborative documents or author links

### 2. **Lazy Y.js Creation**
- **Rule**: Create Y.js documents only after user interaction (typing, editing)
- **Rationale**: Avoids unnecessary resource allocation for read-only scenarios
- **Implementation**: Use typing pause detection to trigger Y.js creation

### 3. **Extension Lifecycle Management**
- **Rule**: Never dynamically add/remove extensions after editor creation
- **Rationale**: TipTap/ProseMirror schema constraints prevent safe dynamic extension changes
- **Solution**: Destroy and recreate editors when collaboration mode changes

### 4. **Collaborative Cursor Strategy**
- **Rule**: CollaborationCursor must be included at editor creation time
- **Rationale**: Cannot be added dynamically without destroying editors
- **Implementation**: Use two-tier cursor strategy: Local vs Cloud with upgrade path

## Collaborative Cursor Best Practices

### Two-Tier Cursor Strategy: Local vs Cloud

#### **Tier 1: Local Documents** 📝
*Offline-first editing with cursor upgrade capability*

**Use Cases:**
- New documents (default)
- Local file editing
- Offline-only scenarios
- Documents that may connect to cloud later

**Implementation:**
```javascript
// Start with basic editors (no CollaborationCursor)
async createBasicEditors() {
  const extensions = [
    StarterKit.configure({ history: true }),
    Placeholder.configure({ placeholder: 'Enter title...' })
    // No Collaboration, no CollaborationCursor initially
  ]
  
  this.titleEditor = new Editor({
    element: this.$refs.titleEditor,
    extensions: extensions
  })
}

// Lazy Y.js creation for IndexedDB persistence
async createLazyYjsDocument() {
  this.ydoc = new Y.Doc()
  this.indexeddbProvider = new IndexeddbPersistence(documentId, this.ydoc)
  this.setupOfflinePersistenceSync()
  // Keep basic editors, add lightweight sync
}
```

**Cursor Upgrade Strategy:**
```javascript
// When user wants to connect to cloud
async upgradeToCloudWithCursors() {
  // 1. Preserve content
  const preservedContent = {
    title: this.titleEditor?.getHTML() || '',
    body: this.bodyEditor?.getHTML() || ''
  }
  
  // 2. Destroy basic editors
  this.titleEditor?.destroy()
  this.bodyEditor?.destroy()
  
  // 3. Create WebSocket provider
  this.provider = new HocuspocusProvider({
    url: 'wss://data.dlux.io/collaboration',
    name: `${owner}/${permlink}`,
    document: this.ydoc, // Reuse existing Y.js document
    token: authToken
  })
  
  // 4. Create collaborative editors with CollaborationCursor
  const getEnhancedExtensions = (field) => {
    return this.getEnhancedExtensions(field, bundle, {
      includeCursor: true,  // ✅ Full cursor support
      includeEnhanced: true,
      cursorConfig: {
        name: this.username,
        color: this.generateUserColor(this.username)
      }
    })
  }
  
  this.titleEditor = new Editor({
    element: this.$refs.titleEditor,
    extensions: getEnhancedExtensions('title')
  })
  
  // 5. Restore content
  this.restorePreservedContent(preservedContent)
}
```

**Benefits:**
- ✅ Maximum performance for offline editing
- ✅ Lazy Y.js creation for persistence
- ✅ Can upgrade to full collaboration with cursors
- ✅ IndexedDB persistence preserved during upgrade

#### **Tier 2: Cloud Documents** ☁️
*Full collaborative editing with real-time cursors*

**Use Cases:**
- Loading collaborative documents from cloud
- Following author links (`?owner=user&permlink=doc`)
- Documents created as collaborative from start
- Local documents upgraded to cloud

**Implementation:**
```javascript
// Create collaborative editors with CollaborationCursor from start
async createCloudEditorsWithCursors(bundle) {
  // 1. Create or reuse Y.js document
  if (!this.ydoc) {
    this.ydoc = new Y.Doc()
  }
  
  // 2. Create WebSocket provider
  this.provider = new HocuspocusProvider({
    url: 'wss://data.dlux.io/collaboration',
    name: `${owner}/${permlink}`,
    document: this.ydoc,
    token: authToken
  })
  
  // 3. Create editors with full collaborative extensions
  const getEnhancedExtensions = (field) => {
    return this.getEnhancedExtensions(field, bundle, {
      includeCursor: true,  // ✅ Include CollaborationCursor
      includeEnhanced: true,
      cursorConfig: {
        name: this.username,
        color: this.generateUserColor(this.username)
      }
    })
  }
  
  this.titleEditor = new Editor({
    element: this.$refs.titleEditor,
    extensions: getEnhancedExtensions('title'),
    editable: !this.isReadOnlyMode
  })
}
```

**Benefits:**
- ✅ Real-time cursor tracking
- ✅ User presence indicators
- ✅ Smooth collaborative experience
- ✅ Full WebSocket synchronization
- ✅ No editor destruction during reconnection

### Decision Matrix: Local vs Cloud

| Document Type | Loading Context | Tier | Method Used | Cursor Support |
|---------------|----------------|------|-------------|----------------|
| New Document | Default creation | **Local** | `createBasicEditors()` | None → Upgradeable |
| Local File | File browser load | **Local** | `createBasicEditors()` | None → Upgradeable |
| Collaborative Doc | Cloud file load | **Cloud** | `createCloudEditorsWithCursors()` | Full cursors |
| Author Link | `?owner=user&permlink=doc` | **Cloud** | `createCloudEditorsWithCursors()` | Full cursors |
| Local → Cloud | "Connect to Cloud" | **Local → Cloud** | `upgradeLocalToCloudWithCursors()` | Upgrade to full |
| Cloud Reconnect | Connection lost/restored | **Cloud** | Preserve editors, reconnect provider | Keep cursors |

### Cursor Upgrade Strategy for Local Documents

When a local document (Tier 1) needs to connect to cloud, we use a single, clean upgrade path:

#### **Full Upgrade Strategy** ⭐
*Destroy and recreate editors with CollaborationCursor*

```javascript
async upgradeLocalToCloudWithCursors() {
  console.log('🔄 Upgrading local document to cloud with full cursor support')
  
  // Preserve content and state
  const preservedContent = this.getEditorContent()
  
  // Clean up basic editors
  await this.cleanupCurrentDocument()
  
  // Create cloud editors with cursors
  await this.createCloudEditorsWithCursors(bundle)
  
  // Restore content
  this.setEditorContent(preservedContent)
  
  console.log('✅ Upgraded to cloud with full collaborative cursors')
}
```

**Benefits:**
- ✅ Full cursor functionality
- ✅ Best collaborative experience
- ✅ Clean architecture
- ✅ No feature fragmentation
- ✅ Consistent user experience
- ❌ Brief editor recreation (acceptable for explicit upgrade)

### Implementation Guidelines

#### ✅ **DO: Clear Tier Separation**

```javascript
// Tier 1: Local documents
if (documentType === 'local') {
  await this.createBasicEditors()
  // Optional: Add lazy Y.js for persistence
  if (userStartsTyping) {
    await this.createLazyYjsDocument()
  }
}

// Tier 2: Cloud documents  
if (documentType === 'collaborative') {
  await this.createCloudEditorsWithCursors(bundle)
}
```

#### ✅ **DO: Explicit Upgrade Path**

```javascript
// User clicks "Connect to Cloud" button
async connectToCloud() {
  if (this.currentFile?.type === 'local') {
    // Single, clean upgrade path - no fragmentation
    await this.upgradeLocalToCloudWithCursors()
  }
}
```

#### ❌ **DON'T: Dynamic Cursor Addition**

```javascript
// NEVER add CollaborationCursor to existing editors
this.addCollaborationCursor(provider)  // ❌ Destroys editors
editor.addExtension(CollaborationCursor)  // ❌ Not supported
```

#### ✅ **DO: Graceful Reconnection**

```javascript
// Cloud documents preserve cursors during reconnection
async reconnectToCloud() {
  // Only recreate WebSocket provider, preserve editors
  this.disconnectWebSocketOnly()
  await this.connectToCollaborationServer(this.currentFile)
  // Cursors remain functional
}
```

## Decision Tree: Local vs Cloud

```
Document Load/Creation Request
├── Is Collaborative Document? ──YES──> Tier 2: Cloud (Full Cursors)
├── Is Author Link? ──YES──> Tier 2: Cloud (Full Cursors)
├── Is "Create Collaborative"? ──YES──> Tier 2: Cloud (Full Cursors)
└── Default Case ──> Tier 1: Local (No Cursors)
                     │
                     └── User Types/Edits? ──YES──> Add Y.js Document (IndexedDB)
                         │                          Keep Basic Editors
                         │
                         └── User Clicks "Connect to Cloud"? ──YES──> Full Upgrade ──> Tier 2 (Full Cursors)
```

### **Summary of 2-Tier Strategy**

1. **Tier 1 (Local)**: Offline-first editing with upgrade capability
   - Basic editors without CollaborationCursor
   - Optional Y.js for IndexedDB persistence
   - Can upgrade to Tier 2 when connecting to cloud

2. **Tier 2 (Cloud)**: Full collaborative editing with cursors
   - Collaborative editors with CollaborationCursor from start
   - Real-time cursor tracking and presence
   - WebSocket synchronization

3. **Upgrade Path**: Single, clean strategy to move from Local to Cloud
   - Full upgrade with editor recreation for complete collaborative experience
   - No feature fragmentation or confusing options

This 2-tier system is much cleaner, easier to understand, and provides a clear upgrade path for cursor functionality!

## Official TipTap Best Practices

### Editor Creation and Destruction

#### ✅ **WHEN TO CREATE EDITORS**

1. **Initial Load (Offline-First)**
   ```javascript
   // Basic editor without collaboration
   const editor = new Editor({
     extensions: [StarterKit, Placeholder],
     content: initialContent
   })
   ```

2. **Collaborative Mode Activation**
   ```javascript
   // Destroy basic editor, create collaborative editor
   basicEditor.destroy()
   
   const collaborativeEditor = new Editor({
     extensions: [
       StarterKit.configure({ history: false }), // Y.js handles history
       Collaboration.configure({ document: ydoc }),
       CollaborationCursor.configure({ provider })
     ]
   })
   ```

#### ✅ **WHEN TO DESTROY EDITORS**

1. **Mode Switching**: Basic ↔ Collaborative
2. **Document Switching**: Different Y.js documents
3. **Component Unmounting**: Cleanup resources
4. **Schema Changes**: Extension modifications

#### ❌ **NEVER DESTROY EDITORS FOR**

1. **Content Updates**: Use `setContent()` instead
2. **Temporary State Changes**: Use editor state management
3. **UI Updates**: Use reactive state, not editor recreation

### Y.js Document Lifecycle

#### ✅ **Y.js CREATION PATTERN**

```javascript
// 1. Create Y.js document first
const ydoc = new Y.Doc()

// 2. Add persistence (optional)
const indexeddbProvider = new IndexeddbPersistence('doc-id', ydoc)

// 3. Initialize schema
ydoc.get('title', Y.XmlFragment)
ydoc.get('body', Y.XmlFragment)

// 4. Create editor with Y.js
const editor = new Editor({
  extensions: [
    Collaboration.configure({ document: ydoc })
  ]
})
```

#### ✅ **LAZY Y.JS PATTERN**

```javascript
// Store Y.js components for lazy creation
this.lazyYjsComponents = { Y, bundle }

// Create Y.js only when needed (after user interaction)
setTimeout(() => {
  if (userHasTyped) {
    this.createYjsDocument()
  }
}, 2000) // Typing pause detection
```

### Extension Management

#### ✅ **STATIC EXTENSION CONFIGURATION**

```javascript
// Define extensions at editor creation
const extensions = [
  StarterKit,
  Collaboration, // If collaborative
  Placeholder,
  // ... other extensions
]

const editor = new Editor({ extensions })
```

#### ❌ **DYNAMIC EXTENSION CHANGES**

```javascript
// NEVER DO THIS - Not supported by TipTap/ProseMirror
editor.addExtension(newExtension) // ❌ Doesn't exist
editor.removeExtension(extension) // ❌ Doesn't exist
```

#### ✅ **EXTENSION RECONFIGURATION**

```javascript
// For configuration changes, recreate editor
const newEditor = new Editor({
  extensions: [
    Placeholder.configure({
      placeholder: newPlaceholderText // Updated config
    })
  ]
})
```

## Our Implementation Architecture

### Phase 1: Offline-First Loading

```javascript
// Always start with basic editors
async createBasicEditors() {
  this.titleEditor = new Editor({
    extensions: [
      StarterKit.configure({
        history: true, // Basic history for offline mode
        heading: false,
        bulletList: false,
        // ... minimal config
      }),
      Placeholder.configure({
        placeholder: 'Enter title...'
      })
    ],
    editable: !this.isReadOnlyMode
  })
  
  // Store Y.js components for lazy creation
  this.lazyYjsComponents = await this.loadYjsComponents()
}
```

### Phase 2: Lazy Y.js Creation

```javascript
// Create Y.js after user interaction
async createLazyYjsDocument() {
  // 1. Extract components
  const { Y, bundle } = this.lazyYjsComponents
  
  // 2. Create Y.js document
  this.ydoc = new Y.Doc()
  
  // 3. Add IndexedDB persistence
  this.indexeddbProvider = new IndexeddbPersistence(documentId, this.ydoc)
  
  // 4. Initialize schema
  this.initializeCollaborativeSchema(Y)
  
  // 5. Keep basic editors, add lightweight sync
  this.setupOfflinePersistenceSync()
}
```

### Phase 3: Collaborative Mode Upgrade

```javascript
// Upgrade to full collaboration when connecting to cloud
async upgradeToCollaborativeMode() {
  // 1. Preserve content
  const preservedContent = {
    title: this.titleEditor?.getHTML() || '',
    body: this.bodyEditor?.getHTML() || ''
  }
  
  // 2. Destroy basic editors
  this.titleEditor?.destroy()
  this.bodyEditor?.destroy()
  
  // 3. Create collaborative editors
  this.titleEditor = new Editor({
    extensions: [
      StarterKit.configure({ history: false }), // Y.js handles history
      Collaboration.configure({
        document: this.ydoc,
        field: 'title'
      })
    ]
  })
  
  // 4. Restore content
  this.restorePreservedContent(preservedContent)
}
```

## Performance Optimization

### React Integration

```javascript
// ✅ Isolate editor in separate component
const TiptapEditor = () => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent
  })
  
  return <EditorContent editor={editor} />
}

// ❌ Don't render editor with unrelated state
const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const editor = useEditor({ /* config */ }) // Will re-render on sidebar changes
  
  return (
    <>
      <Sidebar onChange={setSidebarOpen} />
      <EditorContent editor={editor} />
    </>
  )
}
```

### Memory Management

```javascript
// ✅ Proper cleanup
beforeUnmount() {
  // Destroy editors
  this.titleEditor?.destroy()
  this.bodyEditor?.destroy()
  
  // Cleanup Y.js
  this.indexeddbProvider?.destroy()
  this.ydoc?.destroy()
  
  // Clear references
  this.titleEditor = null
  this.bodyEditor = null
  this.ydoc = null
}
```

## Error Handling and Fallbacks

### Schema Conflicts

```javascript
// Handle schema version mismatches
initializeCollaborativeSchema(Y) {
  const metadata = this.ydoc.getMap('_metadata')
  const currentSchemaVersion = '1.0.0'
  const existingVersion = metadata.get('schemaVersion')
  
  if (existingVersion && existingVersion !== currentSchemaVersion) {
    console.warn('Schema version mismatch')
    this.schemaVersionMismatch = true
    // Disable editing or show warning
  }
}
```

### Y.js Type Conflicts

```javascript
// ✅ Use consistent Y.js types
this.ydoc.get('title', Y.XmlFragment) // For TipTap Collaboration
this.ydoc.get('body', Y.XmlFragment)

// ❌ Don't mix types
this.ydoc.getText('title') // Conflicts with XmlFragment
```

### Graceful Degradation

```javascript
// Fallback when Y.js fails
try {
  await this.createYjsDocument()
} catch (error) {
  console.warn('Y.js creation failed, continuing with basic editors')
  // Continue with offline-only functionality
}
```

## Content Synchronization

### Initial Content Loading

```javascript
// ✅ Set initial content only once
provider.on('synced', () => {
  if (!ydoc.getMap('config').get('initialContentLoaded')) {
    ydoc.getMap('config').set('initialContentLoaded', true)
    editor.commands.setContent(initialContent)
  }
})
```

### Offline/Online Sync

```javascript
// Automatic sync when going online
provider.on('connect', () => {
  console.log('Connected to collaboration server')
  // Y.js automatically syncs offline changes
})

provider.on('disconnect', () => {
  console.log('Disconnected, continuing offline')
  // IndexedDB preserves changes
})
```

## Security Considerations

### Content Validation

```javascript
// Always validate content regardless of format
const sanitizedContent = validateAndSanitize(userContent)
editor.commands.setContent(sanitizedContent)
```

### Authentication

```javascript
// Secure collaboration connections
const provider = new HocuspocusProvider({
  url: 'wss://your-server.com',
  name: documentId,
  token: await getAuthToken(), // JWT token
  document: ydoc
})
```

## Testing Strategy

### Unit Tests

```javascript
// Test editor creation/destruction
describe('Editor Lifecycle', () => {
  test('creates basic editor without Y.js', () => {
    const editor = createBasicEditor()
    expect(editor.isEditable).toBe(true)
    expect(editor.extensionManager.extensions).not.toContain('collaboration')
  })
  
  test('upgrades to collaborative mode', async () => {
    const basicEditor = createBasicEditor()
    const collaborativeEditor = await upgradeToCollaborative(basicEditor)
    expect(collaborativeEditor.extensionManager.extensions).toContain('collaboration')
  })
})
```

### Integration Tests

```javascript
// Test offline-first flow
describe('Offline-First Flow', () => {
  test('loads basic editor first', async () => {
    const component = mount(EditorComponent)
    await nextTick()
    
    expect(component.vm.titleEditor).toBeDefined()
    expect(component.vm.ydoc).toBeNull() // Y.js not created yet
  })
  
  test('creates Y.js after typing', async () => {
    const component = mount(EditorComponent)
    await simulateTyping(component)
    await delay(2100) // Wait for typing pause
    
    expect(component.vm.ydoc).toBeDefined()
  })
})
```

## Monitoring and Debugging

### Performance Metrics

```javascript
// Track editor performance
const performanceObserver = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    if (entry.name.includes('editor')) {
      console.log(`${entry.name}: ${entry.duration}ms`)
    }
  })
})

performanceObserver.observe({ entryTypes: ['measure'] })
```

### Debug Helpers

```javascript
// Debug editor state
debugEditor() {
  console.log('Editor State:', {
    isEditable: this.editor.isEditable,
    isEmpty: this.editor.isEmpty,
    isFocused: this.editor.isFocused,
    extensions: this.editor.extensionManager.extensions.map(e => e.name)
  })
}

// Debug Y.js state
debugYjs() {
  if (this.ydoc) {
    console.log('Y.js State:', {
      clientId: this.ydoc.clientID,
      title: this.ydoc.get('title', Y.XmlFragment).toString(),
      body: this.ydoc.get('body', Y.XmlFragment).toString()
    })
  }
}
```

## Conclusion

This architecture provides:

1. **Optimal Performance**: Offline-first loading with lazy Y.js creation
2. **Reliable Collaboration**: Proper Y.js lifecycle management
3. **Excellent UX**: Minimal editor interruption during mode switches
4. **Maintainable Code**: Clear separation of concerns and error handling
5. **TipTap Compliance**: Follows all official best practices and recommendations

By following these patterns, we ensure our implementation is robust, performant, and aligned with TipTap's design philosophy while providing the best possible user experience for both offline and collaborative editing scenarios.