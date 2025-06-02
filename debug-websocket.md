# WebSocket Connection Debugging Guide

## Current Issue
WebSocket connections fail in production (`vue.dlux.io`) but work on localhost with error code 1006 (Abnormal Closure).

## Error Details
- **Client Error**: WebSocket readyState 3 (CLOSED) 
- **Server Logs**: Connection established successfully, welcome message sent, then immediate close with code 1006
- **Duration**: Connection lasts ~233ms before closing
- **Environment**: Works on localhost, fails on production domain

## Code 1006 Meaning
"Abnormal Closure (no close frame received)" - typically indicates:
- Network/proxy issues between client and server
- Load balancer not configured for WebSocket upgrades
- Firewall blocking WebSocket connections
- Proxy buffer timeouts

## Infrastructure Checklist

### 1. Reverse Proxy Configuration
Check if your reverse proxy (nginx, Apache, etc.) is configured for WebSocket upgrades:

**Nginx Example:**
```nginx
location /ws/ {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 86400;  # 24 hours
    proxy_send_timeout 86400;  # 24 hours
}
```

### 2. Load Balancer Settings
- Ensure WebSocket upgrade headers are passed through
- Check session affinity/sticky sessions for WebSocket connections
- Verify timeout settings (should be longer for WebSocket connections)

### 3. SSL/TLS Configuration
- Verify SSL certificates are valid for WebSocket connections
- Check if SSL termination is happening at the right level
- Ensure WSS (WebSocket Secure) is properly configured

### 4. Firewall Rules
- Check if WebSocket connections are being blocked
- Verify ports are open for WebSocket traffic
- Check if connection tracking is interfering

## Docker/Container Issues
If using Docker, ensure:
- Container ports are properly exposed
- Health checks don't interfere with WebSocket connections
- Network configuration allows WebSocket upgrades

## Testing Commands

### 1. Test WebSocket from Command Line
```bash
# Test WebSocket connection directly
websocat wss://data.dlux.io/ws/payment-monitor

# Or using curl for upgrade test
curl -i -N -H "Connection: Upgrade" \
     -H "Upgrade: websocket" \
     -H "Sec-WebSocket-Key: SGVsbG8sIHdvcmxkIQ==" \
     -H "Sec-WebSocket-Version: 13" \
     https://data.dlux.io/ws/payment-monitor
```

### 2. Browser Developer Tools
1. Open Network tab
2. Filter by "WS" (WebSocket)
3. Look for:
   - Connection request status
   - Upgrade headers
   - Close frame details

### 3. Server-side Debugging
Add more detailed logging to the WebSocket server:
```javascript
// In websocket_monitor.js
this.wss.on('connection', (ws, req) => {
    console.log('Headers:', req.headers);
    console.log('URL:', req.url);
    console.log('Remote Address:', req.socket.remoteAddress);
    console.log('Connection State:', ws.readyState);
    
    // Log all events
    ws.on('close', (code, reason) => {
        console.log(`Close details: code=${code}, reason=${reason}, wasClean=${event.wasClean}`);
    });
});
```

## Fallback Solutions Implemented

The client now includes:
1. **Automatic Environment Detection**: Uses different URLs for localhost vs production
2. **Connection Timeout**: 10-second timeout with retry logic
3. **Fallback Polling**: Switches to HTTP polling when WebSocket fails
4. **Manual Retry Button**: Users can manually retry WebSocket connections
5. **Enhanced Error Logging**: Better debugging information in console

## Quick Fixes to Try

### 1. Server Configuration
```javascript
// In websocket_monitor.js - try reducing buffer sizes
this.wss = new WebSocket.Server({
    server,
    path: '/ws/payment-monitor',
    maxPayload: 1024 * 1024, // 1MB
    perMessageDeflate: false, // Disable compression
    // ... rest of config
});
```

### 2. Client-side Workarounds
```javascript
// Force polling mode for production
if (location.hostname === 'vue.dlux.io') {
    this.startFallbackPolling();
    return;
}
```

### 3. Infrastructure Check
1. Check reverse proxy logs for WebSocket upgrade failures
2. Verify DNS resolution for `data.dlux.io`
3. Test direct connection to backend server (bypass proxy)
4. Check if rate limiting is affecting WebSocket connections

## Next Steps
1. Check reverse proxy configuration for WebSocket support
2. Review load balancer settings
3. Test direct connection to backend server
4. Monitor server logs during connection attempts
5. Consider using a WebSocket debugging tool like `wscat`

The fallback polling mechanism ensures the payment monitoring continues to work even if WebSocket connections fail. 