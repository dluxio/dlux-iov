# 📝 TipTap Markdown Export Architecture

## 📋 **Overview**

This document details DLUX IOV's markdown export system, which converts TipTap editor content to Hive-compatible markdown using TipTap v3's official static renderer with custom node and mark mappings.

## 🎯 **Core Architecture**

### **Static Renderer Pipeline**

```javascript
// Main export method in tiptap-editor-modular.js
getMarkdownContent(includeTitle = true) {
  // 1. Get title from input field
  const titleText = this.titleInput ? this.titleInput.trim() : '';
  
  // 2. Get editor JSON content
  const doc = this.bodyEditor.getJSON();
  
  // 3. Use static renderer with custom mappings
  const markdown = renderToMarkdown({
    extensions: this.getMarkdownExtensions(),
    content: doc,
    options: {
      nodeMapping: this.getNodeMappings(),
      markMapping: this.getMarkMappings()
    }
  });
  
  // 4. Combine title and body
  return includeTitle && titleText 
    ? `# ${titleText}\n\n${markdown}` 
    : markdown;
}
```

## 🔄 **Extension Synchronization**

### **Critical Requirement**

**ALL extensions used in the editor MUST be included in the markdown export**, even if they don't produce visible output. This prevents "Unknown node type" errors.

### **Extension List**

```javascript
const extensions = [
  // Core document structure
  Document, Text, Paragraph,
  
  // Text formatting
  Bold, Italic, Strike, Code, Underline,
  
  // Block elements
  Heading, Blockquote.extend({ name: 'customBlockquote' }),
  HorizontalRule.extend({ name: 'customHorizontalRule' }),
  CodeBlock,
  
  // Lists
  BulletList, OrderedList, ListItem,
  TaskList, TaskItem,
  
  // Tables
  TableKit.configure({
    table: { content: 'tableRow+' },
    tableRow: { content: 'tableCell+' },
    tableCell: { content: 'block+' },
    tableHeader: { content: 'block+' }
  }),
  CustomTableCell,
  
  // Media
  CustomImage, Link,
  SpkVideo.extend({ name: 'spkvideo' }),
  DluxVideo.extend({ name: 'dluxvideo' }),
  
  // Functional (required for schema)
  HardBreak, Dropcursor, Gapcursor,
  Mention,
  
  // Alignment
  TextAlign.configure({
    types: ['heading', 'paragraph']
  }),
  
  // Collaboration (configured with null)
  Collaboration.configure({ document: null }),
  CollaborationCaret.configure({ provider: null }),
  
  // UI extensions (included for completeness)
  BubbleMenu, FloatingMenu
];
```

## 📊 **Node Mappings**

### **Context Object**

The markdown export system uses a context object to track rendering state:

```javascript
const context = {
  inTableCell: false  // Tracks whether content is being rendered inside a table cell
};
```

This context is passed through the rendering pipeline and modified when entering table cells. It allows different rendering behavior for content inside tables (e.g., using `<br>` instead of newlines for paragraphs).

### **Text Nodes**

```javascript
text: (node) => {
  // Apply marks in specific order
  let text = node.text;
  
  node.marks?.forEach(mark => {
    switch (mark.type.name) {
      case 'bold':
        text = `**${text}**`;
        break;
      case 'italic':
        text = `*${text}*`;
        break;
      case 'strike':
        text = `~~${text}~~`;
        break;
      case 'code':
        text = `\`${text}\``;
        break;
      case 'link':
        text = `[${text}](${mark.attrs.href})`;
        break;
    }
  });
  
  return text;
}
```

### **Block Elements with Alignment**

```javascript
paragraph: ({ node, children }) => {
  const content = renderChildren(children);
  if (!content.trim()) return '\n';
  
  // Check for text alignment
  if (node.attrs?.textAlign && node.attrs.textAlign !== 'left') {
    const alignmentClasses = {
      center: 'text-center',
      right: 'text-right',
      justify: 'text-justify'
    };
    const className = alignmentClasses[node.attrs.textAlign];
    
    return `<div class="${className}">${content}</div>\n\n`;
  }
  
  return `${content}\n\n`;
}
```

### **Headings with Alignment**

```javascript
heading: ({ node, children }) => {
  const level = node.attrs.level;
  const prefix = '#'.repeat(level);
  const content = renderChildren(children);
  
  // Wrap aligned headings
  if (node.attrs?.textAlign && node.attrs.textAlign !== 'left') {
    const alignmentClasses = {
      center: 'text-center',
      right: 'text-right',
      justify: 'text-justify'
    };
    const className = alignmentClasses[node.attrs.textAlign];
    
    return `${prefix} <div class="${className}">${content}</div>\n\n`;
  }
  
  return `${prefix} ${content}\n\n`;
}
```

### **Tables**

```javascript
table: ({ children }) => {
  return renderChildren(children) + '\n';
},

tableRow: ({ node, children }) => {
  // Handle different children types (function, array, string)
  let cellsArray = [];
  
  if (Array.isArray(children)) {
    cellsArray = children;
  } else if (typeof children === 'function') {
    const result = children();
    cellsArray = Array.isArray(result) ? result : [result];
  } else if (children) {
    cellsArray = [children];
  }
  
  const cells = cellsArray.map(cell => String(cell).trim());
  let rowOutput = '| ' + cells.join(' | ') + ' |\n';
  
  // Add separator after header row
  const isHeaderRow = node.firstChild?.type.name === 'tableHeader';
  if (isHeaderRow) {
    const separator = cells.map(() => '---').join(' | ');
    rowOutput += '| ' + separator + ' |\n';
  }
  
  return rowOutput;
},

tableCell: ({ children }) => renderChildren(children).trim(),
tableHeader: ({ children }) => renderChildren(children).trim()
```

### **Custom Nodes**

```javascript
// Blockquote - prefix each line
customBlockquote: ({ children }) => {
  const content = renderChildren(children).trim();
  return content.split('\n')
    .map(line => `> ${line}`)
    .join('\n') + '\n\n';
},

// Horizontal Rule
customHorizontalRule: () => '---\n\n',

// Images
image: ({ node }) => {
  const { src, alt, title } = node.attrs;
  const altText = alt || '';
  const titleText = title ? ` "${title}"` : '';
  return `![${altText}](${src}${titleText})`;
},

// Videos (preserved as HTML for Hive)
spkvideo: ({ node }) => {
  const attrs = Object.entries(node.attrs)
    .filter(([key, value]) => value != null && key !== 'srcdisplay')
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');
  
  return `<video ${attrs} controls></video>\n\n`;
},

dluxvideo: ({ node }) => {
  const attrs = Object.entries(node.attrs)
    .filter(([key, value]) => value != null)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');
  
  return `<video ${attrs} controls></video>\n\n`;
}
```

## 🔧 **Helper Functions**

### **Context-Aware Rendering System**

The markdown export uses a context object to track rendering state and modify behavior based on the current context:

```javascript
// Initialize context for tracking rendering state
const context = {
  inTableCell: false  // Tracks if we're rendering inside a table cell
};

// Context is passed through the rendering pipeline
renderToMarkdown({
  extensions: extensions,
  content: doc,
  options: {
    nodeMapping,
    markMapping,
    context
  }
});
```

#### **Table Cell Context**

When rendering content inside table cells, special handling is required for line breaks since markdown tables require all content to be on a single line:

```javascript
// Hard breaks render differently in table cells
hardBreak({ context }) {
  return context?.inTableCell ? '<br>' : '\n';
},

// Paragraphs in table cells don't add double newlines
paragraph({ node, children, options, context, index }) {
  const content = renderChildren(children, { ...options, nodeMapping, context });
  
  if (context?.inTableCell) {
    // Add <br> between paragraphs, but not before the first one
    let result = index > 0 ? '<br>' : '';
    result += content;
    return result;
  }
  
  // Normal paragraph handling outside tables
  return `${content}\n\n`;
}

// Table cells use a shared processing function
tableCell({ node, children, options, context }) {
  return processTableCellContent(node, children, options, context);
},

// The processTableCellContent helper:
// 1. Sets inTableCell context to true
// 2. Processes all children with the table context
// 3. Applies text alignment if specified
// 4. Processes line breaks using 3-step approach (see below)
```

#### **Table Cell Line Break Processing**

Table cells require special line break handling because:
- Markdown tables must have all content on a single line
- The static renderer automatically adds extra newlines
- User line breaks need to be preserved as `<br>` tags

**3-Step Processing:**

```javascript
// Step 1: Remove base trailing newlines added by static renderer
content = content.replace(/\n\n$/, '');

// Step 2: Convert pairs of newlines (user line breaks) to single <br>
// The static renderer doubles each user line break, so pairs = single breaks
content = content.replace(/\n\n/g, '<br>');

// Step 3: Convert any remaining single newlines to <br>
return content.replace(/\n/g, '<br>');
```

**Example Processing:**
- User adds 0 breaks: `"text\n\n"` → `"text"` → `"text"` → `"text"`
- User adds 1 break: `"text\n\n\n\n"` → `"text\n\n"` → `"text<br>"` → `"text<br>"`
- User adds 2 breaks: `"text\n\n\n\n\n\n"` → `"text\n\n\n\n"` → `"text<br><br>"` → `"text<br><br>"`
```

### **Recursive Children Renderer**

```javascript
function renderChildren(children, options) {
  if (!children) return '';
  if (typeof children === 'string') return children;
  
  // Handle both array of children and content object with content array
  let childArray = children;
  if (children.content && Array.isArray(children.content)) {
    childArray = children.content;
  } else if (!Array.isArray(children)) {
    return '';
  }
  
  return childArray.map((child, index) => {
    if (typeof child === 'string') return child;
    if (child.type === 'text') {
      return options.nodeMapping.text ? options.nodeMapping.text({ node: child, context: options.context }) : child.text || '';
    }
    const mapping = options.nodeMapping[child.type];
    if (mapping) {
      return mapping({ 
        node: child, 
        children: child.content || child,
        options,
        context: options.context,
        index 
      });
    }
    return '';
  }).join('');
}
```

## 🌐 **Hive Blockchain Compatibility**

### **Preserved HTML Elements**

Certain HTML elements must be preserved for Hive compatibility:

1. **`<center>` tags** - Deprecated but required by Hive
2. **`<video>` tags** - Full attribute preservation
3. **`<div>` with classes** - For text alignment

### **Alignment Classes**

```css
/* Hive-recognized alignment classes */
.text-center { text-align: center; }
.text-right { text-align: right; }
.text-justify { text-align: justify; }
```

### **Video Attributes**

All video attributes are preserved for Hive's video player:
- `src` - Video URL
- `type` - MIME type (for HLS)
- `data-type` - Custom type info
- `poster` - Thumbnail image

## 📦 **Export Examples**

### **Basic Text Formatting**

```markdown
# Document Title

This is a paragraph with **bold**, *italic*, ~~strike~~, and `code` text.

[This is a link](https://example.com)
```

### **Aligned Content**

```markdown
# <div class="text-center">Centered Title</div>

<div class="text-right">Right-aligned paragraph</div>

<div class="text-justify">Justified text content that spans multiple lines</div>
```

### **Tables**

```markdown
| Header 1 | Header 2 | Header 3 |
| --- | --- | --- |
| Cell 1 | Cell 2 | Cell 3 |
| Cell 4 | Cell 5 | Cell 6 |
```

### **Media**

```markdown
![Image caption](https://ipfs.dlux.io/ipfs/QmXXX "Image title")

<video src="https://ipfs.dlux.io/ipfs/QmYYY" type="video/mp4" controls></video>
```

## 🚀 **Best Practices**

### **1. Extension Synchronization**

Always keep editor and export extensions in sync:

```javascript
// When adding to editor
const editorExtensions = [StarterKit, MyCustomExtension];

// Must also add to export
const exportExtensions = [StarterKit, MyCustomExtension];
```

### **2. Node Mapping Completeness**

Every custom node needs a mapping:

```javascript
nodeMapping: {
  myCustomNode: ({ node, children }) => {
    // Handle the node appropriately
    return `Custom: ${renderChildren(children)}`;
  }
}
```

### **3. Children Type Handling**

Always handle all possible children types:

```javascript
// Children can be:
// 1. Function (lazy evaluation)
// 2. Array of nodes
// 3. String
// 4. Node object
// 5. null/undefined

const content = typeof children === 'function' 
  ? children() 
  : children;
```

### **4. Error Handling**

Wrap export in try-catch:

```javascript
try {
  const markdown = renderToMarkdown({...});
  return markdown;
} catch (error) {
  console.error('Markdown export error:', error);
  // Fallback to basic text
  return this.bodyEditor.getText();
}
```

## 🔍 **Debugging**

### **Common Issues**

1. **"Unknown node type" errors**
   - Solution: Add missing extension to export list
   - Even UI-only extensions must be included

2. **Children rendering incorrectly**
   - Check children type (function vs array)
   - Use `renderChildren` helper consistently

3. **Alignment not working**
   - Verify TextAlign extension is configured
   - Check node attributes for `textAlign`

### **Debug Logging**

```javascript
// Enable detailed logging
nodeMapping: {
  paragraph: ({ node, children }) => {
    console.log('Paragraph node:', {
      attrs: node.attrs,
      childrenType: typeof children,
      content: children
    });
    // ... rest of mapping
  }
}
```

## 📈 **Performance Considerations**

1. **Static Renderer Efficiency**
   - Pre-compiled extensions
   - No DOM manipulation
   - Direct string concatenation

2. **Memory Usage**
   - Process large documents in chunks
   - Clear intermediate strings
   - Reuse mapping functions

3. **Export Caching**
   - Cache rendered markdown for unchanged content
   - Invalidate on editor updates
   - Use content hash for cache keys

## 🔧 **Recent Fixes & Improvements**

### **1. List Content Rendering Fix**
**Problem**: Lists were showing numbers/bullets but no text content
**Cause**: Manually processing `node.content.content` instead of using the `children` parameter
**Solution**: Use the `children` parameter provided by static renderer

```javascript
// ❌ OLD - Manual processing
bulletList({ node }) {
  const items = node.content.content.map((listItem) => {
    const itemContent = renderChildren(listItem.content, options);
    return `- ${itemContent}\n`;
  });
}

// ✅ NEW - Use children parameter
bulletList({ children }) {
  let itemsArray = [];
  if (typeof children === 'function') {
    const result = children();
    itemsArray = Array.isArray(result) ? result : [result];
  } else if (Array.isArray(children)) {
    itemsArray = children;
  }
  return itemsArray.map(item => `- ${item.trim()}\n`).join('');
}
```

### **2. Table Header Separator Fix**
**Problem**: Tables weren't generating header separator (|---|---|)
**Cause**: Checking for `tableHeader` cells, but editor only uses `tableCell`
**Solution**: Always treat first row as header

```javascript
table({ children }) {
  let rowsArray = /* convert children to array */;
  
  let output = '';
  rowsArray.forEach((row, index) => {
    output += row;
    
    // Add separator after first row
    if (index === 0 && row.trim()) {
      const columnCount = (row.match(/\|/g) || []).length - 1;
      if (columnCount > 0) {
        const separator = Array(columnCount).fill('---').join(' | ');
        output += '| ' + separator + ' |\n';
      }
    }
  });
  
  return output + '\n';
}
```

### **3. Underline Extension Addition**
**Problem**: "Unknown node type: underline" error
**Solution**: Add Underline to both destructuring and extensions array

### **4. RenderChildren Options Fix**
**Problem**: TypeError - options.nodeMapping undefined
**Solution**: Pass nodeMapping in options when calling renderChildren

```javascript
// Ensure nodeMapping is included
const itemContent = renderChildren(listItem.content, { ...options, nodeMapping });
```

## 🎯 **Summary**

The markdown export system provides:

1. **Official TipTap static renderer** - Reliable and maintained
2. **Complete node/mark mappings** - All content types handled
3. **Hive blockchain compatibility** - Preserves required HTML
4. **Extensible architecture** - Easy to add new nodes
5. **Robust error handling** - Graceful fallbacks
6. **Recent fixes** - List rendering, table headers, underline support

This architecture ensures accurate, performant markdown generation while maintaining compatibility with both TipTap v3 and Hive blockchain requirements.