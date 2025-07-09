# ✨ TipTap Features Documentation

## UI Features

### BubbleMenu

**Purpose**: Floating formatting toolbar that appears on text selection

**Features**:
- Bold, Italic, Strike, Code, Link buttons
- Dark-themed styling
- Smart positioning with Floating UI
- Maintains selection on button clicks

**Implementation**:
```javascript
BubbleMenu.configure({
  element: document.querySelector('.bubble-menu'),
  updateDelay: 250,
  shouldShow: ({ editor, from, to }) => {
    return from !== to && !editor.isDestroyed;
  }
})
```

### Table Toolbar

**Purpose**: Floating toolbar above tables for table manipulation

**Features**:
- Add/delete rows and columns
- Merge/split cells
- Toggle header row
- CSS-based positioning

**Implementation**:
- Tracks cursor position with `editor.isActive('table')`
- Updates position on selection changes
- Uses `.table-toolbar-visible` class for visibility

### Document Duplicate

**Purpose**: Create exact copies of documents

**Features**:
- Works for both local and collaborative documents
- Preserves all metadata and content
- Appends " - Copy" to document name
- Smart persistence detection

**Availability**:
- Collaborative documents: Always available
- Local documents: Available after first save
- Temporary documents: Disabled with helpful tooltip

### Cloud Status Button

**Purpose**: Visual indicator of collaboration status

**States**:
- 🟢 Green: Connected
- 🟠 Orange: Connecting
- 🔵 Blue: Offline
- ⚪ Grey: Local document

**Features**:
- Real-time status updates
- Click for detailed information
- Permission level display

### Permlink Editor

**Purpose**: Edit document permalinks with preview

**Features**:
- Three-state pattern (view/edit/save)
- Real-time validation
- Auto-generate from title
- Preview URL generation

### Advanced Options

**Purpose**: Manage document metadata

**Sections**:
- Tags management
- Beneficiaries configuration
- Comment options
- Custom JSON editor

**Features**:
- Collapsible sections
- Real-time Y.js sync
- Validation feedback
- Percentage calculations

## Extension Features

### CustomImage

**Purpose**: Enhanced image handling

**Features**:
- Automatic figure/figcaption wrapping
- Alt text as captions
- Drag & drop support
- SPK Drive integration

### DluxVideo

**Purpose**: Advanced video embedding

**Features**:
- Multiple format support
- Responsive sizing
- Custom attributes
- Markdown export compatibility

### CustomTableCell

**Purpose**: Content restrictions in tables

**Features**:
- Prevents nested tables
- Blocks horizontal rules
- Smart drop handling
- Coordinated with dropcursor

## Keyboard Shortcuts

### Editor Commands
- **Ctrl/Cmd + B**: Bold
- **Ctrl/Cmd + I**: Italic
- **Ctrl/Cmd + U**: Underline
- **Ctrl/Cmd + E**: Code
- **Ctrl/Cmd + Shift + X**: Strike

### Table Navigation
- **Tab**: Next cell
- **Shift + Tab**: Previous cell
- **Arrow keys**: Navigate cells

## Drag & Drop Features

### Supported Operations
- Reorder blocks with drag handle
- Drop images from desktop
- Drop files from SPK Drive
- Rearrange table rows

### Content Restrictions
- Tables can't be dropped in tables
- Certain content blocked in blockquotes
- Smart position adjustment

## Auto-Save System

### Save Triggers
- Content changes (debounced)
- Metadata updates
- Tag modifications
- Beneficiary changes

### Save Indicators
- "Saving locally..." 
- "Saved" with timestamp
- "Syncing..." for cloud
- Error states with retry

## Permission-Based UI

### Owner Features
- Delete document
- Manage permissions
- Share document
- All editing features

### Editor Features
- Edit content
- Modify metadata
- Cannot delete
- Cannot manage permissions

### Read-Only Features
- View content
- Copy text
- Cannot edit
- UI elements disabled