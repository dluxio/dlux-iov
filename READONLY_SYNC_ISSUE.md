# Read-Only Sync Issue Analysis

## Current Problem
Read-only users can connect to the WebSocket but the `onSynced` callback never fires, preventing content from being displayed.

## Observations from Logs
1. WebSocket connects successfully (`onOpen` fires)
2. Messages are received (2 messages with `dataSize: 0`)
3. `provider.isConnected` shows as `undefined` (not `true`)
4. `provider.synced` remains `false`
5. Awareness state exists (`awarenessStates: 1`) even though we try to prevent it

## Root Causes
1. **HocuspocusProvider automatically sets awareness state on creation** - Even before we can prevent it
2. **Server rejects ANY Y.js updates from read-only users** - Including awareness and config updates
3. **Sync protocol may not complete without certain messages** - The provider might be waiting for acknowledgments

## Potential Solutions

### Solution 1: Force Sync Completion
If Y.js receives content but provider doesn't mark as synced, manually trigger the onSynced callback.

### Solution 2: Custom Read-Only Provider
Create a wrapper around HocuspocusProvider that prevents ALL outgoing messages for read-only users.

### Solution 3: Server-Side Fix
Modify the server to handle read-only users differently:
- Allow sync protocol messages but block content modifications
- Send sync completion even without awareness updates

### Solution 4: Alternative Sync Method
For read-only users, use a different method to get content:
- HTTP GET request to fetch initial content
- WebSocket only for receiving updates

## Current Approach
We're preventing awareness updates and Y.js config updates, but the sync still doesn't complete. This suggests the server's sync protocol requires bidirectional communication that we're blocking.