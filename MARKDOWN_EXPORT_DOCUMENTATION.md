# TipTap v3 Markdown Export Implementation

## Overview

This document describes the markdown export implementation for the DLUX IOV editor, which uses TipTap v3's static renderer with custom node mappings to generate Hive blockchain-compatible markdown.

## Architecture

### Core Components

1. **TipTap Static Renderer** (`@tiptap/static-renderer/pm/markdown`)
   - Official TipTap v3 library for converting ProseMirror documents to various formats
   - Uses the `pm` namespace which requires TipTap extensions for schema
   - Provides `renderToMarkdown()` function with customizable node/mark mappings

2. **Custom Node Mappings**
   - Complete mappings for all TipTap node types
   - Preserves HTML elements required by Hive blockchain (`<center>`, `<video>`)
   - Handles text alignment attributes from TextAlign extension

3. **Recursive Children Renderer**
   - Custom helper function to process nested content
   - Required because static renderer doesn't provide built-in children serialization
   - Handles both array and string children types

## Implementation Details

### Method: `getMarkdownContent()`

Located in `js/tiptap-editor-modular.js` (lines 13238-13476)

```javascript
getMarkdownContent() {
    // 1. Extract title from input field
    const titleText = this.titleInput ? this.titleInput.trim() : '';
    
    // 2. Get editor JSON content
    const doc = this.bodyEditor.getJSON();
    
    // 3. Build extensions array (required for pm namespace)
    const extensions = [Document, Text, TextAlign, Paragraph, ...];
    
    // 4. Define custom node mappings
    const nodeMapping = {
        text({ node }) { ... },
        paragraph({ node, children, options }) { ... },
        heading({ node, children, options }) { ... },
        // ... other nodes
    };
    
    // 5. Render to markdown
    const finalMarkdown = renderToMarkdown({
        extensions,
        content: doc,
        options: { nodeMapping }
    });
    
    // 6. Prepend title as H1
    return titleText ? `# ${titleText}\n\n${finalMarkdown}` : finalMarkdown;
}
```

### Helper Functions

#### `renderChildren(children, options)`
- Recursively processes child nodes
- Handles text nodes, arrays, and nested structures
- Calls appropriate node mappings for each child type

#### `applyMarks(text, marks)`
- Applies TipTap marks (bold, italic, etc.) to text
- Processes marks in order for proper nesting
- Returns formatted markdown string

### Node Mappings

| Node Type | Markdown Output | Special Features |
|-----------|----------------|------------------|
| `text` | Plain text with marks | Applies bold, italic, strike, code, link |
| `paragraph` | Text + double newline | Supports `<center>` for center alignment |
| `heading` | `#` + text | Levels 1-6, supports `<center>` |
| `bulletList` | Renders children | Container for list items |
| `orderedList` | Renders children | Container for list items |
| `listItem` | `- ` or `1. ` prefix | Auto-detects parent list type |
| `blockquote` | `> ` prefix per line | Handles multi-line content |
| `horizontalRule` | `---` | Standard markdown |
| `hardBreak` | Single newline | Line break (Shift+Enter) |
| `codeBlock` | `` ``` ``lang...`` ``` `` | Preserves language attribute |
| `image` | `![alt](src "title")` | Standard markdown image |
| `video` | `<video>` HTML | Preserves all attributes for Hive |
| `doc` | Renders children | Root container |

### Hive Blockchain Compatibility

The implementation preserves specific HTML tags required by Hive:

1. **Center Alignment**: `<center>` tags
   - Applied when `node.attrs.textAlign === 'center'`
   - Works on paragraphs and headings
   - Example: `<center># Centered Heading</center>`

2. **Video Elements**: `<video>` tags
   - Preserves all attributes (src, type, data-type, etc.)
   - Required for multimedia content on Hive
   - Example: `<video src="..." type="..." controls></video>`

## Usage

### Export to File
```javascript
async saveDocument() {
    const markdown = this.getMarkdownContent();
    const blob = new Blob([markdown], { type: 'text/markdown' });
    // Download file...
}
```

### Publish to Hive
```javascript
async publishToHive() {
    const markdownBody = this.getMarkdownContent()
        .replace(/^# .*\n\n/, ''); // Remove title (separate field)
    
    const postData = {
        title: this.titleInput,
        body: markdownBody,
        // ... other fields
    };
}
```

## Extension Requirements

The following TipTap extensions must be available:
- Document, Text (core)
- Paragraph, Heading (block nodes)
- Bold, Italic, Strike, Code (marks)
- BulletList, OrderedList, ListItem (lists)
- Blockquote, HorizontalRule, HardBreak (blocks)
- Link, Image (inline)
- CodeBlock (code)
- TextAlign (functionality)
- SpkVideo (custom video)

## Best Practices

1. **Always Use Static Renderer**: Never manually construct markdown
2. **Complete Node Mappings**: Provide mappings for all nodes to avoid HTML fallback
3. **Recursive Processing**: Use `renderChildren` helper for nested content
4. **Preserve Hive Elements**: Keep `<center>` and `<video>` tags intact
5. **Extension Array**: Filter undefined extensions before passing to renderer

## Troubleshooting

### Common Issues

1. **"Cannot read properties of undefined"**
   - Cause: Missing extension in array
   - Fix: Filter undefined values from extensions array

2. **"Unknown node type: [nodetype]"** (e.g., hardBreak)
   - Cause: Extension not included in extensions array for static renderer
   - Fix: Import and add the missing extension to both bundle and markdown export

3. **HTML in Output**
   - Cause: Missing node mapping
   - Fix: Add mapping for the node type

4. **Missing Formatting**
   - Cause: Marks not being applied
   - Fix: Ensure `applyMarks` is called for text nodes

### Debug Tips

1. Log the editor JSON to see structure: `console.log(this.bodyEditor.getJSON())`
2. Check available extensions: `console.log(Object.keys(window.TiptapCollaboration))`
3. Verify node mappings are complete for your content

## Migration Notes

### From HTML-based Export
- Previous: Post-processing HTML with regex
- Current: Direct markdown generation via static renderer
- Benefit: More reliable, follows TipTap best practices

### Deprecated Methods
- `htmlToMarkdown()`: No longer used, kept for compatibility
- Manual HTML string manipulation: Replaced by static renderer

## References

- [TipTap Static Renderer Docs](https://tiptap.dev/docs/editor/api/utilities/static-renderer)
- [ProseMirror Node Spec](https://prosemirror.net/docs/ref/#model.NodeSpec)
- [Hive Markdown Guide](https://developers.hive.io/tutorials/#tutorials-markdown)