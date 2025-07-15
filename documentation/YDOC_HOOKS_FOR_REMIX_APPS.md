# Y.js Hooks for ReMix dApps

## Overview

DLUX ReMix dApps can now subscribe to Y.js document fields for real-time collaborative features. This enables true synchronization between the main editor and iframe applications without constant message passing.

## Field Subscription Protocol

### Available Fields

The Y.js metadata map contains these subscribable fields:

- `title` - Post title
- `body` - Post body content (markdown)
- `tags` - Array of tags
- `beneficiaries` - Array of beneficiary objects
- `customJson` - Custom JSON data
- `permlink` - Post permlink
- `commentOptions` - Hive comment options

### Message Protocol

#### Subscribe to a Field

```javascript
// Subscribe to receive updates when a Y.js field changes
window.parent.postMessage({
    type: 'SUBSCRIBE_YDOC_FIELD',
    field: 'title'  // Field name to subscribe to
}, '*');
```

#### Unsubscribe from a Field

```javascript
// Stop receiving updates for a field
window.parent.postMessage({
    type: 'UNSUBSCRIBE_YDOC_FIELD',
    field: 'title'
}, '*');
```

#### Receive Field Updates

```javascript
// Listen for Y.js field updates
window.addEventListener('message', function(event) {
    if (event.data.type === 'YDOC_FIELD_UPDATE') {
        console.log(`Field ${event.data.field} updated:`, event.data.value);
        // Update your UI with the new value
    }
});
```

## Implementation Example

### Basic Sync Checkbox Pattern

```javascript
// Track subscription state
let yjsFieldSubscriptions = {
    title: false,
    body: false
};

// Subscribe when checkbox is checked
document.getElementById('syncTitle').addEventListener('change', function(e) {
    if (e.target.checked) {
        yjsFieldSubscriptions.title = true;
        window.parent.postMessage({
            type: 'SUBSCRIBE_YDOC_FIELD',
            field: 'title'
        }, '*');
    } else {
        yjsFieldSubscriptions.title = false;
        window.parent.postMessage({
            type: 'UNSUBSCRIBE_YDOC_FIELD',
            field: 'title'
        }, '*');
    }
});

// Handle incoming updates
window.addEventListener('message', function(event) {
    if (event.data.type === 'YDOC_FIELD_UPDATE') {
        const { field, value } = event.data;
        
        if (field === 'title' && yjsFieldSubscriptions.title) {
            document.getElementById('myTitleInput').value = value || '';
        }
    }
});
```

### Advanced Pattern with Debouncing

```javascript
class YjsFieldSync {
    constructor() {
        this.subscriptions = new Map();
        this.debounceTimers = new Map();
        this.setupMessageHandler();
    }
    
    setupMessageHandler() {
        window.addEventListener('message', (event) => {
            if (event.data.type === 'YDOC_FIELD_UPDATE') {
                this.handleFieldUpdate(event.data.field, event.data.value);
            }
        });
    }
    
    subscribe(field, handler, debounceMs = 100) {
        // Subscribe to field
        window.parent.postMessage({
            type: 'SUBSCRIBE_YDOC_FIELD',
            field: field
        }, '*');
        
        // Store handler
        this.subscriptions.set(field, handler);
        
        console.log(`✅ Subscribed to Y.js field: ${field}`);
    }
    
    unsubscribe(field) {
        // Unsubscribe from field
        window.parent.postMessage({
            type: 'UNSUBSCRIBE_YDOC_FIELD',
            field: field
        }, '*');
        
        // Clean up
        this.subscriptions.delete(field);
        if (this.debounceTimers.has(field)) {
            clearTimeout(this.debounceTimers.get(field));
            this.debounceTimers.delete(field);
        }
    }
    
    handleFieldUpdate(field, value) {
        const handler = this.subscriptions.get(field);
        if (!handler) return;
        
        // Debounce rapid updates
        if (this.debounceTimers.has(field)) {
            clearTimeout(this.debounceTimers.get(field));
        }
        
        const timer = setTimeout(() => {
            handler(value);
            this.debounceTimers.delete(field);
        }, 50);
        
        this.debounceTimers.set(field, timer);
    }
}

// Usage
const yjsSync = new YjsFieldSync();

// Subscribe to title with custom handler
yjsSync.subscribe('title', (value) => {
    document.getElementById('videoTitle').value = value || '';
    console.log('Title updated:', value);
});

// Subscribe to tags
yjsSync.subscribe('tags', (value) => {
    const tagString = Array.isArray(value) ? value.join(', ') : '';
    document.getElementById('videoTags').value = tagString;
});
```

## Best Practices

### 1. Initial State Handling

When subscribing to a field, you'll immediately receive the current value:

```javascript
// Subscribe and get initial value
window.parent.postMessage({
    type: 'SUBSCRIBE_YDOC_FIELD',
    field: 'title'
}, '*');

// First message will be the current value
// Subsequent messages will be updates
```

### 2. Avoiding Update Loops

When syncing bidirectionally, prevent update loops:

```javascript
let isUpdatingFromYjs = false;

// Handle Y.js updates
function handleYjsUpdate(field, value) {
    isUpdatingFromYjs = true;
    document.getElementById('myInput').value = value;
    setTimeout(() => { isUpdatingFromYjs = false; }, 100);
}

// Handle local input changes
document.getElementById('myInput').addEventListener('input', function(e) {
    if (isUpdatingFromYjs) return; // Prevent loop
    
    // Send update to parent
    sendToParent({
        type: 'dapp_update',
        data: { myField: e.target.value }
    });
});
```

### 3. Memory Management

Always unsubscribe when your component unmounts:

```javascript
// Clean up on page unload
window.addEventListener('beforeunload', function() {
    ['title', 'body', 'tags'].forEach(field => {
        if (yjsFieldSubscriptions[field]) {
            window.parent.postMessage({
                type: 'UNSUBSCRIBE_YDOC_FIELD',
                field: field
            }, '*');
        }
    });
});
```

### 4. Error Handling

Handle cases where Y.js might not be available:

```javascript
function handleFieldUpdate(field, value) {
    try {
        if (value === null || value === undefined) {
            console.warn(`Y.js field '${field}' is empty or not available`);
            return;
        }
        
        // Process update
        updateUI(field, value);
    } catch (error) {
        console.error(`Error handling Y.js update for field '${field}':`, error);
    }
}
```

## Security Considerations

1. **Origin Validation**: In production, always validate the message origin:
   ```javascript
   window.addEventListener('message', function(event) {
       // Validate origin
       if (event.origin !== 'https://dlux.io') return;
       
       // Process message
       if (event.data.type === 'YDOC_FIELD_UPDATE') {
           // Handle update
       }
   });
   ```

2. **Field Whitelisting**: Only subscribe to fields you need:
   ```javascript
   const ALLOWED_FIELDS = ['title', 'body', 'tags'];
   
   function subscribeToField(field) {
       if (!ALLOWED_FIELDS.includes(field)) {
           console.warn(`Field '${field}' not allowed`);
           return;
       }
       // Subscribe...
   }
   ```

3. **Data Validation**: Always validate incoming data:
   ```javascript
   function handleTitleUpdate(value) {
       if (typeof value !== 'string') {
           console.error('Invalid title type:', typeof value);
           return;
       }
       if (value.length > 255) {
           value = value.substring(0, 255);
       }
       // Update UI
   }
   ```

## Complete Example: 3Speak Publisher Integration

See the 3Speak Publisher app (`/3speak-publisher/app.js`) for a complete implementation that:

- Subscribes to title and body fields
- Provides sync checkboxes for user control
- Handles bidirectional updates without loops
- Validates all incoming data
- Cleans up subscriptions properly

## Performance Notes

- Field updates are broadcast only to subscribed iframes
- Y.js observers are created only for subscribed fields
- Observers are removed when no subscribers remain
- All data is cloned before sending to ensure serializability
- Consider debouncing rapid updates in your iframe

## Future Enhancements

The following features are planned for future releases:

1. **Batch Subscriptions**: Subscribe to multiple fields at once
2. **Wildcard Subscriptions**: Subscribe to all fields with `*`
3. **Deep Path Access**: Subscribe to nested properties like `customJson.gallery.assets`
4. **Transform Functions**: Apply transformations before receiving updates
5. **Direct Y.js Access**: For advanced use cases requiring full Y.js document access