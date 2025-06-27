# DLUX Remix App Developer Guide

## Overview
This guide explains how to create remix apps that integrate with the DLUX IOV collaborative editor's Y.js metadata synchronization system.

## Y.js Metadata Fields

The main editor exposes the following Y.js metadata fields that remix apps can read and/or update:

### Metadata Map Fields
- `title` - Document title (string)
- `tags` - Array of tags (string[])
- `beneficiaries` - Array of beneficiary objects: `{account: string, weight: number, required?: boolean}`
- `customJson` - Custom app metadata (object)
- `permlink` - URL slug (string)
- `allowVotes` - Allow votes on post (boolean)
- `allowCurationRewards` - Allow curation rewards (boolean)
- `maxAcceptedPayout` - Max accepted payout (string, e.g., "1000000.000 SBD")
- `percentHbd` - Percent HBD rewards (boolean)

## Message Protocol

### 1. Initialization
When your iframe loads, signal readiness:
```javascript
// Notify parent that iframe is ready
window.parent.postMessage({ type: 'iframe_ready' }, '*');
```

The parent will respond with initial data:
```javascript
window.addEventListener('message', function(event) {
    if (event.data.type === 'dapp_init') {
        // event.data.data contains current customJson if any
        const existingData = event.data.data;
    }
});
```

### 2. Subscribe to Y.js Fields
To receive real-time updates from specific fields:
```javascript
// Subscribe to a field
function subscribeToField(fieldName) {
    window.parent.postMessage({
        type: 'SUBSCRIBE_YDOC_FIELD',
        field: fieldName
    }, '*');
}

// Example: Subscribe to title, body, and tags
subscribeToField('title');
subscribeToField('body');
subscribeToField('tags');
```

You'll receive updates via:
```javascript
window.addEventListener('message', function(event) {
    if (event.data.type === 'YDOC_FIELD_UPDATE') {
        const field = event.data.field;
        const value = event.data.value;
        // Update your UI with the new value
    }
});
```

### 3. Update Fields

#### Update Custom JSON
```javascript
window.parent.postMessage({
    type: 'dapp_update',
    data: {
        app: 'myapp/1.0',
        type: 'custom',
        data: {
            // Your app-specific data
        }
    },
    triggerIntent: true  // Optional: trigger autosave
}, '*');
```

#### Update Beneficiaries
```javascript
window.parent.postMessage({
    type: 'beneficiaries_update',
    beneficiaries: [
        { account: 'myapp', weight: 500, required: true },
        { account: 'developer', weight: 100, required: true }
    ],
    triggerIntent: false  // Optional: trigger autosave
}, '*');
```

**Note**: Beneficiaries with `required: true` cannot be deleted by users and will be cleared when the app is closed/cancelled.

### 4. Close/Cancel
```javascript
// User cancels - clears custom JSON and required beneficiaries
window.parent.postMessage({ type: 'cancel' }, '*');

// User completes action
window.parent.postMessage({ type: 'done' }, '*');
```

## User Intent & Autosave

By default, updates from remix apps don't trigger document autosave to avoid creating documents without explicit user action. You can trigger autosave by:

1. Setting `triggerIntent: true` in your update messages
2. Only trigger intent for significant user actions (e.g., file selection, not just opening the app)

Example:
```javascript
// User selects a file - this should trigger autosave
function handleFileSelection(file) {
    window.parent.postMessage({
        type: 'dapp_update',
        data: generateCustomJson(file),
        triggerIntent: true  // This will trigger autosave
    }, '*');
}

// User changes a setting - this shouldn't trigger autosave
function handleSettingChange(setting) {
    window.parent.postMessage({
        type: 'dapp_update',
        data: generateCustomJson(),
        triggerIntent: false  // No autosave
    }, '*');
}
```

## Example Implementation

Here's a minimal remix app example:

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Remix App</title>
</head>
<body>
    <h1>My Remix App</h1>
    <input type="text" id="myInput" placeholder="Enter value">
    <button onclick="updateData()">Update</button>
    
    <script>
    // Signal ready
    window.parent.postMessage({ type: 'iframe_ready' }, '*');
    
    // Listen for messages
    window.addEventListener('message', function(event) {
        switch(event.data.type) {
            case 'dapp_init':
                // Load existing data if any
                if (event.data.data && event.data.data.app === 'myapp/1.0') {
                    document.getElementById('myInput').value = event.data.data.data.value || '';
                }
                break;
        }
    });
    
    // Update function
    function updateData() {
        const value = document.getElementById('myInput').value;
        window.parent.postMessage({
            type: 'dapp_update',
            data: {
                app: 'myapp/1.0',
                type: 'custom',
                data: { value: value }
            },
            triggerIntent: true  // Trigger autosave since user clicked update
        }, '*');
    }
    </script>
</body>
</html>
```

## Best Practices

1. **Always send `iframe_ready`** - This ensures proper initialization
2. **Use unique app identifiers** - e.g., `myapp/1.0` to avoid conflicts
3. **Handle `cancel` gracefully** - Clear any temporary state
4. **Be selective with `triggerIntent`** - Only use for significant user actions
5. **Support required beneficiaries** - Mark beneficiaries that must be included
6. **Subscribe only to needed fields** - Reduces unnecessary updates
7. **Debounce updates** - Avoid flooding with rapid changes

## Security Considerations

1. Always validate incoming messages
2. Check message origin in production
3. Sanitize user input before sending
4. Don't expose sensitive data in custom JSON

## Testing

Test your remix app by:
1. Loading it in the DLUX editor
2. Verifying field subscriptions work
3. Checking that updates appear in the main editor
4. Testing cancel/close behavior
5. Verifying autosave triggers appropriately