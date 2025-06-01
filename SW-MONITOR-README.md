# Service Worker Cache Monitor & PWA Install Manager

This component provides a comprehensive monitoring system for service worker cache status and PWA installation capabilities that integrates into the DLUX navigation bar.

## Features

### 🔄 Service Worker Monitoring
- **Version Detection**: Automatically detects service worker version and compares with expected version
- **Update Notifications**: Shows alerts when cache updates are available
- **Cache Statistics**: Displays cached resource count and total cache size
- **Background Updates**: Periodic checks for service worker updates (every 30 minutes)
- **Error Handling**: Detects and displays service worker errors

### 📱 PWA Install Management
- **Install Detection**: Detects when PWA installation is available
- **Install Prompts**: Shows user-friendly install prompts with delay to avoid interruption
- **Standalone Mode Detection**: Recognizes when app is running in standalone/PWA mode
- **Cross-Platform Support**: Works on desktop and mobile browsers

### 🎨 User Interface
- **Navigation Integration**: Seamlessly integrates into existing nav bar
- **Visual Indicators**: Color-coded status indicators with animations
- **Dropdown Status Panel**: Detailed status information in expandable dropdown
- **Toast Notifications**: Non-intrusive notifications for important events
- **Mobile Responsive**: Adapts to different screen sizes

## Installation

1. **Add the component files**:
   - `js/sw-monitor.js` - Main component file
   - CSS styles added to `css/custom.css`

2. **Update navigation component** (`js/v3-nav.js`):
   ```javascript
   import SwMonitor from "/js/sw-monitor.js";
   
   components: {
     "sw-monitor": SwMonitor,
   }
   ```

3. **Add to navigation template**:
   ```html
   <li class="nav-item nav-hide">
     <sw-monitor @toast="handleToast" />
   </li>
   ```

4. **Update service worker cache** (`sw.js`):
   ```javascript
   `/js/sw-monitor.js`, // Add to importantResources array
   ```

## Configuration

### Version Synchronization
Update the version in both files when deploying:

```javascript
// sw.js
this.version = "2025.06.01.1";

// js/sw-monitor.js
desiredVersion: '2025.06.01.1'
```

### Customization Options

#### Install Prompt Timing
```javascript
// Delay before showing install prompt (milliseconds)
setTimeout(() => {
  this.showInstallPrompt = true;
}, 5000); // 5 seconds default
```

#### Update Check Frequency
```javascript
// Check for updates every 30 minutes (default)
setInterval(async () => {
  // Update check logic
}, 30 * 60 * 1000);
```

#### Cache Stats Update Frequency
```javascript
// Update cache stats every 5 minutes (default)
setInterval(() => {
  this.updateCacheStats();
}, 5 * 60 * 1000);
```

## API

### Events
- `@toast` - Emits toast notifications for integration with existing toast system

### Methods
- `installPWA()` - Triggers PWA installation prompt
- `updateServiceWorker()` - Forces service worker update
- `dismissInstallPrompt()` - Hides install prompt for current session
- `updateCacheStats()` - Refreshes cache size and resource count

### States

#### Service Worker Status
- `loading` - Initial state while checking
- `current` - Service worker is up to date
- `update-available` - New version available
- `installing` - Update in progress
- `updated` - Update complete, reload needed
- `error` - Service worker error

#### PWA Install Status
- `unknown` - Initial state
- `available` - Install prompt available
- `installed` - App is installed/running in standalone mode
- `not-supported` - Browser doesn't support PWA installation

## Usage Examples

### Basic Integration
```javascript
// In your Vue component
<sw-monitor @toast="handleToastMessage" />

methods: {
  handleToastMessage(toastData) {
    // Handle toast notifications
    console.log('SW Monitor:', toastData.message);
  }
}
```

### Manual Trigger Update Check
```javascript
// Force check for service worker updates
const registration = await navigator.serviceWorker.getRegistration('/');
if (registration) {
  await registration.update();
}
```

### Check Cache Statistics
```javascript
// Get current cache stats
const cacheNames = await caches.keys();
const stats = await this.updateCacheStats();
console.log('Cache stats:', stats);
```

## Browser Support

### Service Worker Support
- Chrome 45+
- Firefox 44+
- Safari 11.1+
- Edge 17+

### PWA Installation Support
- Chrome 67+ (Android), 73+ (Desktop)
- Edge 79+
- Samsung Internet 7.2+
- Firefox (via `manifest.json` only)

## Testing

Use the test page `sw-monitor-test.html` to verify functionality:

1. **Service Worker Tests**:
   - Check for updates
   - View cache statistics
   - Simulate version mismatches

2. **PWA Tests**:
   - Test install prompts
   - Check standalone mode detection
   - Verify cross-platform behavior

## Troubleshooting

### Service Worker Not Detected
1. Ensure service worker is properly registered
2. Check browser developer tools for service worker status
3. Verify service worker file is accessible

### Install Prompt Not Showing
1. Check if PWA criteria are met (HTTPS, manifest, service worker)
2. Verify manifest.json is properly configured
3. Test on supported browsers
4. Clear browser data and retry

### Version Mismatch Issues
1. Ensure versions match between `sw.js` and `sw-monitor.js`
2. Force refresh to clear old cache
3. Check service worker registration URL parameters

## Performance Considerations

- Cache stats calculation runs in background to avoid blocking UI
- Periodic checks use reasonable intervals to balance freshness with performance
- Service worker messages are handled efficiently with promise-based architecture
- Component only renders when indicators need to be shown

## Security

- No sensitive data is stored or transmitted
- All cache operations use standard Cache API
- Service worker communication uses secure message passing
- PWA installation follows browser security requirements 