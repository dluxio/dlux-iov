# DLUX Custom JSON Iframe Integration Guide

## Overview

The DLUX collaborative editor now supports seamless integration with iframe-based enhanced post components (360° galleries, dApps, videos, etc.) through a performant message-passing protocol that synchronizes custom JSON data with Y.js collaborative documents.

## Architecture

### Core Components

1. **CustomJsonMessageHandler** (in `tiptap-editor-modular.js`)
   - Manages iframe registration and communication
   - Batches updates for performance (200ms debounce)
   - Broadcasts Y.js changes to all registered iframes
   - Monitors performance metrics

2. **IframeCustomJsonIntegration** (in `iframe-customjson-integration.js`)
   - Base class for iframe components
   - Handles message protocol
   - Provides debounced updates (100ms default)
   - Auto-registration with parent

3. **Y.js Metadata Map**
   - Stores custom JSON in `metadata.customJson`
   - Syncs collaboratively in real-time
   - Triggers broadcasts on changes

## Message Protocol

### Messages from Iframe to Parent

```javascript
// Register iframe
{
  type: 'CUSTOM_JSON_REGISTER',
  iframeId: 'unique_id',
  payload: {
    type: '360-gallery',
    version: '2.0'
  }
}

// Update custom JSON
{
  type: 'CUSTOM_JSON_UPDATE',
  iframeId: 'unique_id',
  payload: {
    // Your custom JSON data
  }
}

// Request current state
{
  type: 'CUSTOM_JSON_REQUEST',
  iframeId: 'unique_id'
}
```

### Messages from Parent to Iframe

```javascript
// Initial state or requested state
{
  type: 'CUSTOM_JSON_STATE',
  iframeId: 'unique_id',
  payload: {
    // Current custom JSON
  }
}

// Broadcast updates
{
  type: 'CUSTOM_JSON_UPDATE_BROADCAST',
  payload: {
    // Updated custom JSON
  }
}
```

## Quick Start

### For New Iframe Components

1. **Extend the base class:**

```javascript
import { IframeCustomJsonIntegration } from '/js/iframe-customjson-integration.js';

class MyComponentIntegration extends IframeCustomJsonIntegration {
    constructor() {
        super({
            componentType: 'my-component',
            version: '1.0',
            debounceDelay: 100 // ms
        });
    }
    
    // Handle incoming updates
    updateLocalState(customJson) {
        if (customJson['my-component']) {
            const data = customJson['my-component'];
            // Update your UI
            this.renderComponent(data);
        }
    }
    
    // Send updates
    updateData(newData) {
        this.sendUpdate({
            'my-component': newData
        });
    }
}

// Initialize on load
const integration = new MyComponentIntegration();
integration.connect();
```

### For Existing Vue Components

Use the provided adapter pattern:

```javascript
import { Asset360IframeMixin } from './360-asset-manager-iframe-adapter.js';

export default {
    name: 'MyComponent',
    mixins: [Asset360IframeMixin],
    // Your component code
}
```

## Performance Guidelines

### Debouncing
- **Iframe → Parent**: 100ms (component level)
- **Parent → Y.js**: 200ms (batch multiple updates)
- Adjust based on your component's update frequency

### Size Limits
- **Warning**: 50KB custom JSON
- **Critical**: 100KB custom JSON
- Consider compression for large data

### Monitoring
```javascript
// In parent editor console:
app.logCustomJsonPerformance()

// Returns:
{
  size: "12.5KB",
  keys: 3,
  warning: "OK",
  iframes: {
    active: 2,
    totalUpdates: 47,
    averageLatency: "15ms"
  }
}
```

## Best Practices

### 1. Data Structure
```javascript
// Good: Namespaced by component
{
  "360-gallery": {
    "assets": [...],
    "settings": {...}
  },
  "dapp": {
    "contracts": [...],
    "config": {...}
  }
}

// Avoid: Flat structure (conflicts)
{
  "assets": [...],
  "config": {...}
}
```

### 2. Update Patterns
```javascript
// Good: Update only changed fields
this.sendUpdate({
  "my-component": {
    "settings": { "speed": 2 }
  }
});

// Avoid: Sending entire state on every change
this.sendUpdate(this.entireComponentState);
```

### 3. Security
- Always validate incoming data
- Sanitize user inputs
- Use origin validation in production

## Example Implementations

### 360° Gallery
```javascript
class Gallery360Integration extends IframeCustomJsonIntegration {
    addAsset(imageUrl, title) {
        this.assets.push({ url: imageUrl, title });
        this.sendUpdate({
            '360-gallery': {
                assets: this.assets
            }
        });
    }
}
```

### dApp Builder
```javascript
class DappIntegration extends IframeCustomJsonIntegration {
    addContract(address, abi) {
        this.contracts.push({ address, abi });
        this.sendUpdate({
            'dapp': {
                contracts: this.contracts
            }
        });
    }
}
```

## Troubleshooting

### Iframe not receiving updates
1. Check iframe is registered: `app.customJsonMessageHandler.iframeRegistry`
2. Verify message handler is active
3. Check browser console for errors

### Updates not syncing
1. Check Y.js connection: `app.connectionStatus`
2. Verify custom JSON size: `app.getCustomJsonMetrics()`
3. Check for recursion in update handlers

### Performance issues
1. Increase debounce delays
2. Batch multiple updates
3. Consider data compression
4. Monitor with `app.logCustomJsonPerformance()`

## Migration Guide

### From Direct Y.js Access
```javascript
// Old: Direct Y.js manipulation
const metadata = ydoc.getMap('metadata');
metadata.set('customJson', data);

// New: Message protocol
this.sendUpdate(data);
```

### From Parent Component Props
```javascript
// Old: Props and events
this.$emit('update-custom-json', data);

// New: Iframe integration
this.iframeIntegration.sendUpdate(data);
```

## Future Enhancements

1. **Compression**: Automatic compression for large payloads
2. **Selective Sync**: Subscribe to specific data paths
3. **Conflict Resolution**: Custom merge strategies
4. **Offline Queue**: Buffer updates when disconnected

## Support

For questions or issues:
- Check browser console for detailed logs
- Use `app.logCustomJsonPerformance()` for metrics
- Review Y.js document state in DevTools
- File issues at: https://github.com/dluxio/dlux-iov/issues