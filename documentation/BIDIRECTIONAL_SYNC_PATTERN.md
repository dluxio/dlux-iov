# Bidirectional Y.js Field Sync Pattern

## Overview

This document explains how to implement bidirectional sync between iframe apps and Y.js document fields.

## Current State (One-Way Sync)

```
Y.js Document → Iframe App (via YDOC_FIELD_UPDATE messages)
```

## Bidirectional Sync Pattern

```
Y.js Document ↔ Iframe App
```

## Implementation Guide

### 1. Add Field Update Message Type

In the parent (v3-user.js), add a handler for field updates from iframes:

```javascript
// In setupYjsFieldSubscriptions() message handler
if (event.data.type === 'UPDATE_YDOC_FIELD') {
    this.handleFieldUpdateFromIframe(event.data.field, event.data.value, event.source);
}

// New method
handleFieldUpdateFromIframe(field, value, source) {
    // Verify the iframe is subscribed to this field
    if (!this.yjsFieldSubscriptions.has(field) || 
        !this.yjsFieldSubscriptions.get(field).has(source)) {
        console.warn(`Iframe not subscribed to field: ${field}`);
        return;
    }
    
    const editorComponent = this.$refs.tiptapEditor;
    if (!editorComponent || !editorComponent.ydoc) return;
    
    const metadata = editorComponent.ydoc.getMap('metadata');
    
    // Update Y.js with origin tag to track source
    editorComponent.ydoc.transact(() => {
        metadata.set(field, value);
    }, `iframe-${field}-update`);
    
    console.log(`✅ Updated Y.js field '${field}' from iframe`);
}
```

### 2. Update Iframe to Send Field Updates

In 3Speak (or any iframe app):

```javascript
// Send updates when user edits synced fields
function sendFieldUpdate(field, value) {
    // Only send if we're subscribed and not updating from parent
    if (yjsFieldSubscriptions[field] && !isUpdatingFromParent) {
        window.parent.postMessage({
            type: 'UPDATE_YDOC_FIELD',
            field: field,
            value: value
        }, '*');
    }
}

// Modified form handlers
document.getElementById('videoTitle').addEventListener('input', function(e) {
    if (!isUpdatingFromParent) {
        // Send to custom JSON as before
        sendReactiveUpdate();
        
        // Also update Y.js if synced
        if (document.getElementById('syncTitle').checked) {
            sendFieldUpdate('title', e.target.value);
        }
    }
});
```

### 3. Prevent Feedback Loops

The Y.js observer will fire when the iframe updates the field, so we need to prevent broadcasting back to the same source:

```javascript
// In broadcastFieldUpdate() method
broadcastFieldUpdate(field, value, excludeSource = null) {
    if (this.yjsFieldSubscriptions.has(field)) {
        const subscribers = this.yjsFieldSubscriptions.get(field);
        const message = {
            type: 'YDOC_FIELD_UPDATE',
            field: field,
            value: value ? JSON.parse(JSON.stringify(value)) : null
        };
        
        subscribers.forEach(source => {
            // Skip the source that triggered the update
            if (source !== excludeSource) {
                try {
                    source.postMessage(message, '*');
                } catch (err) {
                    console.error(`Failed to send field update to iframe:`, err);
                }
            }
        });
    }
}
```

## Design Considerations

### 1. Semantic Clarity

Consider if the fields truly represent the same data:
- **Post Title** vs **Video Title**: May be different
- **Post Body** vs **Video Description**: Often different formatting/length

### 2. User Control

Give users explicit control over sync direction:
```html
<select id="titleSyncMode">
    <option value="none">No Sync</option>
    <option value="from-post">From Post → Video</option>
    <option value="to-post">From Video → Post</option>
    <option value="bidirectional">Bidirectional ↔</option>
</select>
```

### 3. Conflict Resolution

For bidirectional sync, consider:
- Last-write-wins (current Y.js default)
- Merge strategies for concurrent edits
- Visual indicators when fields are synced

### 4. Performance

- Debounce updates in both directions
- Consider field size limits
- Monitor for excessive update cycles

## Example: 3Speak Bidirectional Implementation

```javascript
// Enhanced sync checkbox handler
document.getElementById('syncTitle').addEventListener('change', function(e) {
    const mode = document.getElementById('titleSyncMode').value;
    
    if (mode !== 'none') {
        subscribeToYjsField('title');
        
        // Set up bidirectional handler if needed
        if (mode === 'to-post' || mode === 'bidirectional') {
            enableFieldUpdateToParent('title');
        }
    } else {
        unsubscribeFromYjsField('title');
        disableFieldUpdateToParent('title');
    }
});

// Track which fields update the parent
let fieldsUpdatingParent = new Set();

function enableFieldUpdateToParent(field) {
    fieldsUpdatingParent.add(field);
}

function disableFieldUpdateToParent(field) {
    fieldsUpdatingParent.delete(field);
}

// Modified input handler
document.getElementById('videoTitle').addEventListener('input', function(e) {
    if (!isUpdatingFromParent) {
        sendReactiveUpdate(); // Always update custom JSON
        
        // Update Y.js if configured for bidirectional sync
        if (fieldsUpdatingParent.has('title')) {
            sendFieldUpdate('title', e.target.value);
        }
    }
});
```

## Best Practices

1. **Clear UI Indicators**: Show when fields are synced and in which direction
2. **Debouncing**: Prevent rapid fire updates (recommend 200-500ms)
3. **Validation**: Ensure data types match between systems
4. **Error Handling**: Gracefully handle sync failures
5. **User Preference**: Remember sync preferences per document type

## Security Considerations

1. **Validate Sources**: Only accept updates from trusted iframes
2. **Sanitize Input**: Clean data before syncing to Y.js
3. **Rate Limiting**: Prevent abuse through excessive updates
4. **Permission Checks**: Verify user has edit rights before accepting updates