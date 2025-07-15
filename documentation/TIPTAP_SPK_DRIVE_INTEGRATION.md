# 🎯 SPK Drive Integration Documentation

## Overview

The TipTap editor seamlessly integrates with SPK Drive, enabling users to insert media files directly from their decentralized storage into their posts through drag-and-drop or button actions.

## Integration Architecture

### Component Communication
- **SPK Drive**: Registers globally as `window.spkDriveComponent`
- **TipTap Editor**: Listens for SPK Drive events and drag operations
- **Vue 3 Reactivity**: Event-driven state management for component availability

### Event System
```javascript
// Editor lifecycle events
window.dispatchEvent(new CustomEvent('tiptap-editor-ready'));
window.dispatchEvent(new CustomEvent('tiptap-editor-destroyed'));

// SPK Drive responds to editor availability
editorAvailable: computed(() => this.editorAvailable)
dappAvailable: computed(() => this.iframeAvailable)
```

## Drag and Drop Implementation

### ProseMirror Plugin
The editor uses a custom ProseMirror plugin to handle SPK Drive drops:

```javascript
new Plugin({
  key: new PluginKey('spkDriveDrop'),
  props: {
    handleDrop: (view, event) => {
      const contractId = event.dataTransfer.getData("contractid");
      const fileId = event.dataTransfer.getData("fileid");
      const itemIds = event.dataTransfer.getData("itemids");
      
      if (contractId && (fileId || itemIds)) {
        // Handle SPK Drive file drop
        event.preventDefault();
        // Insert media at drop position
      }
    }
  }
});
```

### Multi-file Support
- Single files: Transferred via `fileid` property
- Multiple files: Transferred as JSON array in `itemids`
- Automatic position calculation for sequential inserts

## Button Integration

### Context Menu Actions
SPK Drive's right-click context menu provides:
- **Add to dApp**: For iframe-based applications
- **Add to Post**: For TipTap editor insertion

### Reactive Button Visibility
```javascript
// Button visibility based on reactive state
v-if="postComponentAvailable && editorAvailable"
```

## Media Format Support

### Comprehensive Format Detection
The integration supports extensive media formats with intelligent detection:

#### Video Formats
```javascript
const videoFormats = ['mp4', 'webm', 'ogg', 'm3u8', 'mov', 'avi', 'mkv', 'm4v', '3gp', '3g2'];
const isVideo = fileName.match(/\.(mp4|webm|ogg|m3u8|mov|avi|mkv|m4v|3gp|3g2)$/i) || 
                fileType.match(/^video\//i);
```

#### Image Formats
```javascript
const imageFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 
                     'tiff', 'tif', 'avif', 'jfif', 'heic', 'heif'];
const isImage = fileName.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico|tiff|tif|avif|jfif|heic|heif)$/i) || 
                fileType.match(/^image\//i);
```

### Browser Compatibility Strategy
- **m3u8 (HLS)**: Requires explicit MIME type `application/x-mpegURL`
- **All other formats**: Use browser auto-detection for maximum compatibility
- **No forced MIME types**: Prevents playback issues with formats like MOV

## Image Caption Support

### CustomImage Extension
The collaboration bundle includes a CustomImage extension that:
- Wraps images in `<figure>` elements
- Displays `alt` text as `<figcaption>`
- Updates captions when alt text changes

```javascript
// Caption display logic
const figcaption = document.createElement('figcaption');
figcaption.className = 'image-caption';
figcaption.textContent = node.attrs.alt || '';
figcaption.style.display = node.attrs.alt ? 'block' : 'none';
```

## File Processing

### SPK Drive Metadata
Files from SPK Drive include:
- **CID**: Content identifier for IPFS
- **Type**: File type with folder depth suffix (e.g., 'mp4.0')
- **Name**: Original filename
- **Contract ID**: Storage contract identifier

### URL Construction
```javascript
const url = `https://ipfs.dlux.io/ipfs/${fileId}`;
```

### Type Processing
```javascript
// Strip folder depth suffix (.0 for root, .1 for subfolder, etc.)
const cleanFileType = fileType.split('.')[0];
```

## Best Practices

### 1. Event-Driven Architecture
- Use CustomEvents for editor lifecycle
- Implement reactive state for availability detection
- Avoid direct $refs checking in computed properties

### 2. File Type Handling
- Support comprehensive format lists
- Use multiple detection methods (extension, MIME type, array check)
- Let browser handle format detection except for special cases

### 3. User Experience
- Provide immediate visual feedback on drop
- Show appropriate buttons based on context
- Include captions for images automatically

### 4. Error Handling
- Validate file metadata before insertion
- Provide fallback for unsupported formats
- Log warnings for debugging without breaking functionality

## Integration Example

```javascript
// Handle SPK file for editor insertion
handleSpkAddToEditor(fileData) {
  const { cid, fileName, fileType, cleanFileType, url } = fileData;
  
  // Determine media type
  const isVideo = this.isVideoFile(fileName, fileType, cleanFileType);
  const isImage = this.isImageFile(fileName, fileType, cleanFileType);
  
  if (isVideo) {
    this.insertVideoEmbed(url, { type: cleanFileType });
  } else if (isImage) {
    this.insertImageEmbed(url, fileName); // fileName becomes caption
  } else {
    // Insert as link for other file types
    this.insertLink(url, fileName);
  }
}
```

## Implementation Location

The SPK Drive integration is implemented in:
- **Main file**: `js/tiptap-editor-modular.js`
- **Drop handler**: Lines 1500-1600 (approx)
- **Button handlers**: Lines 2000-2100 (approx)
- **Format detection**: Lines 2200-2300 (approx)

## Testing SPK Drive Integration

To test the integration:

1. **Enable SPK Drive**: Ensure SPK Drive component is loaded
2. **Check Global Registration**: Verify `window.spkDriveComponent` exists
3. **Test Drag & Drop**: Drag files from SPK Drive to editor
4. **Test Button Integration**: Use right-click context menu
5. **Verify Format Support**: Test various media formats
6. **Check Caption Display**: Ensure image captions work

## Troubleshooting

### Common Issues

1. **SPK Drive Not Detected**
   - Check if `window.spkDriveComponent` is defined
   - Ensure SPK Drive loads before editor initialization
   - Verify event listeners are properly attached

2. **Drag & Drop Not Working**
   - Check browser console for errors
   - Verify drag event has required data fields
   - Ensure editor is not in read-only mode

3. **Media Not Displaying**
   - Check IPFS gateway availability
   - Verify file permissions in SPK Drive
   - Test direct URL access to media file

### Debug Mode

Enable debug logging for SPK Drive integration:
```javascript
// In developer console
localStorage.setItem('spkDriveDebug', 'true');
```

This will log:
- Component registration events
- Drag & drop data
- File processing steps
- Error details