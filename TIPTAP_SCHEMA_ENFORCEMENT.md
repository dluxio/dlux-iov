# 🛡️ TipTap Schema Enforcement Architecture

## 📋 **Overview**

This document details DLUX IOV's modular schema enforcement system that controls what content can be inserted into specific nodes, how content is transformed when restrictions apply, and how the UI adapts to enforce these rules.

## 🎯 **Core Architecture: Registry-Based Block Lists**

### **The Central Registry**

```javascript
// src/collaboration-bundle.js
const nodeBlockLists = {
  tableCell: ['table', 'horizontalRule'],    // Table cells block tables and HRs
  tableHeader: ['table', 'horizontalRule'],  // Table headers have same restrictions
  blockquote: ['table', 'horizontalRule', 'heading', 'codeBlock', 'bulletList', 'orderedList']
};
```

This single registry serves as the source of truth for all content restrictions throughout the system.

### **Key Design Principles**

1. **Single Source of Truth**: One registry controls all restrictions
2. **Automatic Coordination**: Dropcursor and drop handlers read from same source
3. **Easy Extension**: Add new restrictions by updating the registry
4. **Type-Safe**: Each node declares what it blocks explicitly

## 🔧 **Implementation Components**

### **1. Utility Function: `isContentBlockedAt`**

```javascript
function isContentBlockedAt(state, pos, contentType) {
  try {
    const $pos = state.doc.resolve(pos);
    
    // Check all ancestor nodes for block lists
    for (let depth = $pos.depth; depth > 0; depth--) {
      const node = $pos.node(depth);
      const nodeType = node.type.name;
      
      // Check if this node type has a block list
      if (nodeBlockLists[nodeType]) {
        const blockedTypes = nodeBlockLists[nodeType];
        
        // Check if the content type is blocked
        if (blockedTypes.includes(contentType)) {
          return {
            blocked: true,
            byNode: nodeType,
            atDepth: depth
          };
        }
      }
    }
    
    return { blocked: false };
  } catch (error) {
    console.error('Error checking content block:', error);
    return { blocked: false };
  }
}
```

This function traverses the document tree to determine if content is blocked at a given position.

### **2. CustomDropcursor Extension**

Provides visual feedback when dragging blocked content:

```javascript
const CustomDropcursor = Dropcursor.extend({
  name: 'customDropcursor',
  
  addProseMirrorPlugins() {
    // Plugin tracks what's being dragged
    // Checks against nodeBlockLists
    // Hides dropcursor over blocked areas
    // Shows "not-allowed" cursor
  }
});
```

**Key Features:**
- Tracks dragged node type via drag events
- Uses `isContentBlockedAt` to check restrictions
- Hides dropcursor with aggressive CSS overrides
- Uses MutationObserver to catch dynamic dropcursors

**Visual Feedback Implementation:**

```javascript
// 1. Track what's being dragged
handleDragStart(event) {
  if (event.target.hasAttribute?.('data-drag-handle')) {
    const hoveredNode = window.dluxEditor?.dragHandleHoveredNode;
    if (hoveredNode) {
      draggingNodeType = hoveredNode.type.name;
    }
  }
}

// 2. Check drop position on drag over
handleDragOver(event) {
  const dropPos = editorView.posAtCoords({
    left: event.clientX,
    top: event.clientY
  });
  
  if (dropPos) {
    const blockInfo = isContentBlockedAt(
      editorView.state,
      dropPos.pos,
      draggingNodeType
    );
    
    if (blockInfo.blocked) {
      // Add not-allowed cursor class
      editorView.dom.classList.add('table-drag-over-cell');
      createStyleElement(); // Inject CSS to hide dropcursor
    }
  }
}

// 3. CSS injection for visual feedback
styleElement.textContent = `
  /* Hide all dropcursor variations */
  .ProseMirror-dropcursor,
  .prosemirror-dropcursor-block,
  .prosemirror-dropcursor-inline {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
  }
  
  /* Change cursor to not-allowed */
  .ProseMirror.table-drag-over-cell,
  .ProseMirror.table-drag-over-cell * {
    cursor: not-allowed !important;
  }
`;

// 4. MutationObserver for dynamic dropcursors
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.classList?.contains('ProseMirror-dropcursor')) {
        // Force hide with inline styles
        node.style.display = 'none';
        node.style.visibility = 'hidden';
      }
    });
  });
});
```

This multi-layered approach ensures the dropcursor is completely hidden and the cursor changes to "not-allowed" when dragging blocked content over restricted areas.

### **3. CustomTableCell Extension**

Enforces restrictions and transforms content:

```javascript
const CustomTableCell = TableCell.extend({
  name: 'tableCell',
  
  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handleDrop(view, event, slice, moved) {
            // Check if drop position is in a table cell
            // Use isContentBlockedAt to check restrictions
            // Transform content if needed
            // Handle the drop with transformations
          }
        }
      })
    ];
  }
});
```

## 📦 **Content Transformation System**

When restricted content is dropped into table cells, it's transformed to allowed content:

### **Transformation Rules**

```javascript
function transformContentForTableCell(slice, schema) {
  const transformedContent = [];
  
  slice.content.forEach(node => {
    switch (node.type.name) {
      case 'heading':
        // Heading → Paragraph (preserves text content)
        const paragraph = schema.nodes.paragraph.create(
          null,
          node.content
        );
        transformedContent.push(paragraph);
        break;
        
      case 'codeBlock':
        // Code block → Paragraph with code marks
        node.content.forEach(textNode => {
          const codeMarked = schema.marks.code.create();
          const markedText = textNode.mark([codeMarked]);
          const para = schema.nodes.paragraph.create(null, markedText);
          transformedContent.push(para);
        });
        break;
        
      case 'bulletList':
      case 'orderedList':
        // Lists → Individual paragraphs
        node.descendants(child => {
          if (child.type.name === 'listItem') {
            child.content.forEach(itemContent => {
              if (itemContent.type.name === 'paragraph') {
                transformedContent.push(itemContent);
              }
            });
          }
        });
        break;
        
      case 'blockquote':
        // Blockquote → Extract paragraphs
        node.content.forEach(child => {
          if (child.type.name === 'paragraph') {
            transformedContent.push(child);
          }
        });
        break;
        
      default:
        // Keep allowed content as-is
        transformedContent.push(node);
    }
  });
  
  return transformedContent;
}
```

### **Transformation Examples**

1. **Heading → Paragraph**
   - Input: `<h2>Important Title</h2>`
   - Output: `<p>Important Title</p>`

2. **Code Block → Paragraph with Code**
   - Input: `<pre><code>const x = 42;</code></pre>`
   - Output: `<p><code>const x = 42;</code></p>`

3. **List → Multiple Paragraphs**
   - Input: `<ul><li>Item 1</li><li>Item 2</li></ul>`
   - Output: `<p>Item 1</p><p>Item 2</p>`

## 🎨 **UI Enforcement**

### **Toolbar Button Disabling**

The toolbar adapts based on cursor position:

```javascript
// Computed property in tiptap-editor-modular.js
isInTable() {
  return this.bodyEditor?.isActive('table');
}

// Toolbar button template
<button :disabled="isReadOnlyMode || isInTable" 
        @click="insertTable">
  Table
</button>
```

**Disabled in Tables:**
- Text format dropdown (Heading, Paragraph)
- Lists (Bullet, Ordered)
- Block elements (Blockquote, Code block, HR)
- Table insertion (no nesting)
- Text alignment buttons

### **Floating Menu Visibility**

The floating menu checks ancestor nodes:

```javascript
shouldShow: ({ state, from }) => {
  const $from = state.doc.resolve(from);
  
  // Check if inside restricted context
  for (let d = $from.depth; d > 0; d--) {
    const parentNode = $from.node(d);
    if (['bulletList', 'orderedList', 'blockquote'].includes(parentNode.type.name)) {
      return false;
    }
  }
  
  return true;
}
```

### **Floating Menu Table Behavior**

When inside a table, the floating menu adapts its interface:

```html
<!-- Blocks submenu is hidden when in table -->
<li v-if="!isInTable">
  <a class="dropdown-item" href="#">
    <i class="fas fa-th-large me-2"></i>Blocks &raquo;
  </a>
  <!-- Contains: Blockquote, Code Block, HR, Table buttons -->
</li>

<!-- Media submenu remains visible in tables -->
<li>
  <a class="dropdown-item" href="#">
    <i class="fas fa-photo-video me-2"></i>Media &raquo;
  </a>
  <!-- Contains: Image, Video, Link buttons -->
</li>
```

This ensures users can only insert allowed content (images, videos, links) when inside table cells.

### **Table Toolbar**

When the cursor is inside a table, a dedicated table toolbar appears:

```html
<!-- Table toolbar with conditional visibility -->
<div class="table-toolbar" :class="{ 'table-toolbar-visible': isInTable }">
```

**Table Toolbar Features:**
- **Row Operations**: Add row above/below, delete row
- **Column Operations**: Add column left/right, delete column
- **Table Operations**: Delete entire table
- **Positioning**: Dynamically positioned above the active table using `updateTableToolbarPosition()`

```javascript
// Reactive property tracking
isInTable: false,  // Updated in onSelectionUpdate

// Position update in onSelectionUpdate
onSelectionUpdate({ editor }) {
  // Update isInTable state
  const wasInTable = this.isInTable;
  this.isInTable = editor.isActive('table');
  
  // Always update position when in table
  if (this.isInTable) {
    this.updateTableToolbarPosition();
  }
}

// Dynamic positioning
updateTableToolbarPosition() {
  const selection = window.getSelection();
  if (!selection.rangeCount) return;
  
  const range = selection.getRangeAt(0);
  let element = range.commonAncestorContainer;
  
  // Find the table element
  const table = element.closest('.ProseMirror table');
  if (table) {
    const rect = table.getBoundingClientRect();
    const toolbar = document.querySelector('.table-toolbar');
    
    // Position above table
    toolbar.style.left = `${rect.left}px`;
    toolbar.style.top = `${rect.top - 45}px`;
  }
}
```

## 🔄 **Blockquote-Specific Restrictions**

### **CustomBlockquote Extension**

Enforces paragraph-only content:

```javascript
const CustomBlockquote = Blockquote.extend({
  name: 'blockquote',
  content: 'paragraph+',  // Only paragraphs allowed
  draggable: true,        // Enable drag handle
  
  addProseMirrorPlugins() {
    // Prevents nesting via handleDrop
    // Prevents heading input rules (##)
    // Smart Enter key handling
  }
});
```

### **Input Rule Prevention**

CustomHeading prevents markdown shortcuts in blockquotes:

```javascript
const CustomHeading = Heading.extend({
  addInputRules() {
    const rules = this.parent?.() || [];
    
    return rules.map(rule => ({
      ...rule,
      handler: (props) => {
        // Check if inside blockquote
        const { $from } = props.state.selection;
        for (let d = $from.depth; d > 0; d--) {
          if ($from.node(d).type.name === 'blockquote') {
            return null; // Block the rule
          }
        }
        return originalHandler(props);
      }
    }));
  }
});
```

## 🚀 **Extension Guide**

### **Adding New Restrictions**

1. **Update the Registry**
   ```javascript
   const nodeBlockLists = {
     tableCell: ['table', 'horizontalRule', 'image'], // Add 'image'
     tableHeader: ['table', 'horizontalRule', 'image'],
     myCustomNode: ['video', 'iframe']  // New node type
   };
   ```

2. **That's It!** The system automatically:
   - Updates dropcursor behavior
   - Enforces drop restrictions
   - Applies to all relevant nodes

### **Adding New Transformations**

1. **Update `transformContentForTableCell`**
   ```javascript
   case 'myCustomNode':
     // Define transformation logic
     const transformed = schema.nodes.paragraph.create(
       null,
       schema.text(node.textContent)
     );
     transformedContent.push(transformed);
     break;
   ```

2. **Test the transformation** with drag/drop operations

## 📊 **Architecture Benefits**

### **1. Modularity**
- Single registry controls all restrictions
- Easy to add/remove restrictions
- No code duplication

### **2. Consistency**
- Dropcursor and drop handling always match
- UI and editor behavior synchronized
- Single source of truth

### **3. User Experience**
- Clear visual feedback (cursor changes)
- Graceful content transformation
- No data loss on restricted drops

### **4. Maintainability**
- Clear separation of concerns
- Well-documented transformation rules
- Easy to debug with console logging

## 🔍 **Debugging**

Enable debug mode to see enforcement in action:

```javascript
const DEBUG = true; // At top of collaboration-bundle.js
```

This will log:
- What's being dragged
- Where it's being dropped
- Whether content is blocked
- How content is transformed

## 🎯 **Summary**

The schema enforcement system provides:

1. **Registry-based restrictions** - Single source of truth
2. **Visual feedback** - Dropcursor hiding and cursor changes
3. **Content transformation** - Graceful handling of restricted content
4. **UI adaptation** - Toolbar buttons disable in context
5. **Easy extension** - Just update the registry

This architecture ensures consistent, predictable behavior while maintaining flexibility for future requirements.