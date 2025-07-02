# TipTap v3 Markdown Export Implementation

## Overview

This document describes the markdown export implementation for the DLUX IOV editor, which uses TipTap v3's static renderer with custom node mappings to generate Hive blockchain-compatible markdown.

## Critical Design Principle: Extension Synchronization

**The markdown exporter MUST include every extension that the editor uses.** This is a fundamental requirement of TipTap's static renderer architecture.

### Why This Matters
1. The static renderer uses extensions to build the ProseMirror schema
2. The schema defines what node types are valid in the document
3. If an extension is missing, its nodes become "unknown" and cause errors
4. This applies even to extensions that don't produce visible markdown output

### Synchronization Checklist
- [ ] Every extension in your editor configuration must be in the markdown export
- [ ] Check StarterKit default extensions (it includes many by default)
- [ ] Include cursor/UI extensions even though they don't affect output
- [ ] When adding new extensions to the editor, also add them to markdown export
- [ ] Test markdown export after any editor configuration changes

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

**ALL extensions used in the editor MUST be included in the markdown export**, regardless of whether they produce visible markdown output.

### Required Extensions (from StarterKit):
- **Core**: Document, Text
- **Block Nodes**: Paragraph, Heading, Blockquote, HorizontalRule
- **List Nodes**: BulletList, OrderedList, ListItem
- **Inline Nodes**: HardBreak, Image
- **Marks**: Bold, Italic, Strike, Code, Link
- **Code**: CodeBlock
- **Cursor Helpers**: Dropcursor, Gapcursor (no markdown output but required for schema)

### Additional Extensions:
- **TextAlign**: Functionality extension for text alignment
- **SpkVideo**: Custom video node for Hive compatibility

### Extensions NOT included:
- **History**: Intentionally disabled when using Collaboration extension
- **Collaboration/CollaborationCaret**: Only needed for live editing, not export

## Best Practices

1. **Always Use Static Renderer**: Never manually construct markdown
2. **Include ALL Extensions**: EVERY extension used in the editor MUST be included in the markdown export
3. **Complete Node Mappings**: Provide mappings for all nodes to avoid HTML fallback
4. **Recursive Processing**: Use `renderChildren` helper for nested content
5. **Preserve Hive Elements**: Keep `<center>` and `<video>` tags intact
6. **Extension Array**: Filter undefined extensions before passing to renderer

### Critical Extension Requirement

**⚠️ IMPORTANT**: The static renderer uses the extensions array to build the document schema. Any extension that's active in your editor but missing from the markdown export will cause an "Unknown node type" error.

This includes:
- All extensions from StarterKit (even if they don't produce visible markdown output)
- Cursor extensions (Dropcursor, Gapcursor, HardBreak)
- Custom extensions (TextAlign, SpkVideo)
- Any extension that might create nodes or marks in the document

Even extensions that don't have visual representation in markdown (like Dropcursor) must be included for the parser to understand the document structure.

## Troubleshooting

### Common Issues

1. **"Cannot read properties of undefined"**
   - Cause: Missing extension in array
   - Fix: Filter undefined values from extensions array

2. **"Unknown node type: [nodetype]"** (e.g., hardBreak, dropcursor, gapcursor)
   - Cause: Extension used in editor but not included in markdown export extensions array
   - Fix: 
     1. Check if extension is in StarterKit (most are included by default)
     2. Ensure it's exported from collaboration bundle
     3. Import it in getMarkdownContent()
     4. Add to extensions array
   - Prevention: Keep editor and markdown export extensions synchronized

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