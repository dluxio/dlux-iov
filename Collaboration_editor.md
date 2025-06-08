# Hive Collaboration API Documentation

## Overview

The Hive Collaboration API provides real-time collaborative editing capabilities using Y.js CRDT (Conflict-free Replicated Data Type) technology with custom WebSocket integration and [Tiptap](https://github.com/ueberdosis/tiptap) support. Documents are authenticated using Hive blockchain keypairs and stored in PostgreSQL.

## Base URL

```
https://data.dlux.io/api/collaboration
```

## Authentication

All API endpoints (except public info endpoints) require Hive blockchain authentication using the following headers:

- `x-account`: Hive username
- `x-challenge`: Unix timestamp (must be within 24 hours for API, 1 hour for WebSocket)
- `x-pubkey`: Your Hive public key (posting key recommended)
- `x-signature`: Signature of the challenge using your private key

## Document Format

Documents are identified by the format: `owner-hive-account/permlink`

Example: `alice/my-document-2024`

## WebSocket Endpoint

The collaboration system uses a custom Y.js implementation with Hive authentication:

```
ws://data.dlux.io/ws/collaborate/{owner}/{permlink}
```

### WebSocket Authentication

WebSocket connections use the same Hive authentication headers as API endpoints:

```javascript
// Connect using native WebSocket with headers
const ws = new WebSocket('ws://data.dlux.io/ws/collaborate/alice/my-document', {
  headers: {
    'x-account': 'your-hive-username',
    'x-challenge': '1703980800', // Unix timestamp  
    'x-pubkey': 'STM7BWmXwvuKHr8FpSPmj8knJspFMPKt3vcetAKKjZ2W2HoRgdkEg',
    'x-signature': 'signature-here'
  }
});

// Or using a WebSocket library that supports headers
import WebSocket from 'isomorphic-ws';

const ws = new WebSocket('ws://data.dlux.io/ws/collaborate/alice/my-document', {
  headers: {
    'x-account': account,
    'x-challenge': challenge,
    'x-pubkey': pubKey,  
    'x-signature': signature
  }
});
```

## API Endpoints

### 1. Get Server Information

```http
GET /api/collaboration/info
```

**Response:**
```json
{
  "success": true,
  "server": "Hive Collaboration Server",
  "version": "1.0.0",
  "endpoints": {
    "websocket": "/ws/collaborate/{owner}/{permlink}",
    "documents": "/api/collaboration/documents",
    "permissions": "/api/collaboration/permissions",
    "activity": "/api/collaboration/activity"
  },
  "authentication": {
    "method": "Hive Signature",
    "headers": ["x-account", "x-challenge", "x-pubkey", "x-signature"],
    "websocket_headers": "Use same Hive auth headers for WebSocket connections"
  },
  "document_format": "owner-hive-account/permlink",
  "features": [
    "Real-time collaborative editing",
    "Hive blockchain authentication", 
    "Document permissions management",
    "Activity logging"
  ]
}
```

### 2. Get Authentication Challenge

```http
GET /api/collaboration/challenge
```

**Response:**
```json
{
  "success": true,
  "challenge": 1703980800,
  "expires": 1703984400,
  "message": "Sign this timestamp with your HIVE key for collaboration access",
  "instructions": {
    "websocket": "Connect with Hive auth headers: x-account, x-challenge, x-pubkey, x-signature",
    "api": "Use in x-challenge header along with other auth headers"
  }
}
```

### 3. List Documents

```http
GET /api/collaboration/documents
```

**Query Parameters:**
- `limit` (optional): Number of documents to return (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)
- `type` (optional): Filter by access type
  - `all`: All accessible documents (default)
  - `owned`: Documents owned by the user
  - `shared`: Documents shared with the user

**Response:**
```json
{
  "success": true,
  "documents": [
    {
      "owner": "alice",
      "permlink": "my-document-2024",
      "documentPath": "alice/my-document-2024",
      "isPublic": false,
      "hasContent": true,
      "contentSize": 1024,
      "accessType": "owner",
      "createdAt": "2024-01-01T12:00:00Z",
      "updatedAt": "2024-01-01T15:30:00Z"
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

### 4. Create Document

```http
POST /api/collaboration/documents
```

**Request Body:**
```json
{
  "permlink": "my-new-document",
  "isPublic": false,
  "title": "My New Document",
  "description": "A collaborative document"
}
```

**Response:**
```json
{
  "success": true,
  "document": {
    "owner": "alice",
    "permlink": "my-new-document",
    "documentPath": "alice/my-new-document",
    "isPublic": false,
    "websocketUrl": "/ws/collaborate/alice/my-new-document",
    "authHeaders": {
      "x-account": "alice",
      "x-challenge": "timestamp",
      "x-pubkey": "key",
      "x-signature": "signature"
    },
    "createdAt": "2024-01-01T12:00:00Z"
  }
}
```

### 5. Delete Document

```http
DELETE /api/collaboration/documents/{owner}/{permlink}
```

**Note:** Only document owners can delete documents.

**Response:**
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

### 6. Get Document Permissions

```http
GET /api/collaboration/permissions/{owner}/{permlink}
```

**Response:**
```json
{
  "success": true,
  "document": "alice/my-document",
  "permissions": [
    {
      "account": "bob",
      "permissionType": "editable",
      "capabilities": {
        "canRead": true,
        "canEdit": true,
        "canPostToHive": false
      },
      "grantedBy": "alice",
      "grantedAt": "2024-01-01T12:00:00Z"
    }
  ]
}
```

### 7. Grant Permission

```http
POST /api/collaboration/permissions/{owner}/{permlink}
```

**Request Body:**
```json
{
  "targetAccount": "bob",
  "permissionType": "editable"
}
```

**Permission Types:**
- `readonly`: Can view and connect to document (read-only access)
- `editable`: Can view and edit document content 
- `postable`: Can view, edit, and post document to Hive blockchain

**Permission Capabilities:**
- `canRead`: User can view the document and connect via WebSocket
- `canEdit`: User can make changes to the document content
- `canPostToHive`: User can publish the document to Hive blockchain

**Response:**
```json
{
  "success": true,
  "message": "editable permission granted to @bob",
  "permission": {
    "account": "bob",
    "permissionType": "editable",
    "grantedBy": "alice",
    "grantedAt": "2024-01-01T12:00:00Z"
  }
}
```

### 8. Revoke Permission

```http
DELETE /api/collaboration/permissions/{owner}/{permlink}/{targetAccount}
```

**Response:**
```json
{
  "success": true,
  "message": "Permission revoked from @bob"
}
```

### 9. Get Activity Log

```http
GET /api/collaboration/activity/{owner}/{permlink}
```

**Query Parameters:**
- `limit` (optional): Number of activities to return (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "document": "alice/my-document",
  "activity": [
    {
      "account": "bob",
      "activity_type": "connect",
      "activity_data": {
        "socketId": "abc123",
        "timestamp": "2024-01-01T12:00:00Z"
      },
      "created_at": "2024-01-01T12:00:00Z"
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

### 10. Get Document Statistics

```http
GET /api/collaboration/stats/{owner}/{permlink}
```

**Response:**
```json
{
  "success": true,
  "document": "alice/my-document",
  "stats": {
    "total_users": 3,
    "active_users": 1,
    "last_activity": "2024-01-01T15:30:00Z",
    "total_edits": 42,
    "document_size": 2048,
    "permissions_summary": {
      "total_users": "2",
      "readonly_users": "1",
      "editable_users": "1",
      "postable_users": "0"
    },
    "recent_activity": [
      {
        "activity_type": "connect",
        "count": "5",
        "last_occurrence": "2024-01-01T15:30:00Z"
      }
    ],
    "inactivity_days": 2
  }
}
```

### 11. Get Detailed Permissions

```http
GET /api/collaboration/permissions-detailed/{owner}/{permlink}
```

**Response:**
```json
{
  "success": true,
  "document": "alice/my-document",
  "permissions": [
    {
      "account": "bob",
      "permissionType": "editable",
      "capabilities": {
        "canRead": true,
        "canEdit": true,
        "canPostToHive": false
      },
      "grantedBy": "alice",
      "grantedAt": "2024-01-01T12:00:00Z"
    }
  ]
}
```

### 12. Manual Document Cleanup

```http
POST /api/collaboration/cleanup/manual/{owner}/{permlink}
```

**Note:** Only document owners can trigger manual cleanup.

**Response:**
```json
{
  "success": true,
  "message": "Document cleaned up successfully",
  "action": "Document data archived, metadata preserved"
}
```

### 13. Test Connection

```http
GET /api/collaboration/test-connection/{owner}/{permlink}
```

**Response:**
```json
{
  "success": true,
  "message": "Connection test endpoint for collaboration debugging",
  "document": "alice/my-document",
  "user": "alice",
  "websocketUrl": "ws://data.dlux.io/ws/collaborate/alice/my-document",
  "authHeaders": {
    "x-account": "alice",  
    "x-challenge": 1703980800,
    "x-pubkey": "STM...",
    "x-signature": "..."
  },
  "instructions": {
    "connect": "Connect WebSocket with authHeaders to establish collaboration connection",
    "verify": "Check server logs for authentication and connection events"
  }
}
```

## Collaboration Features

The Hive Collaboration API provides comprehensive real-time collaboration capabilities:

### Real-time Editing
- **Conflict-free**: Uses Y.js CRDT (Conflict-free Replicated Data Type)
- **Operational Transform**: Automatic conflict resolution for simultaneous edits
- **Persistence**: All changes automatically saved to PostgreSQL
- **History**: Complete edit history maintained by Y.js

### Cursor Sharing & User Awareness
- **Live Cursors**: See other users' cursor positions in real-time
- **User Presence**: Track who's currently editing the document
- **Selection Sharing**: View other users' text selections
- **User Colors**: Each user gets a unique color for identification

### Permission-based Access
- **Granular Control**: `readonly`, `editable`, and `postable` permissions
- **Real-time Enforcement**: Permissions checked on WebSocket connection
- **Hive Integration**: Post documents directly to Hive blockchain with `postable` permission

### Activity Tracking
- **Connection Logs**: Track user connections and disconnections
- **Edit Statistics**: Monitor document changes and user activity
- **Permission Auditing**: Log all permission grants and revocations

## Frontend Integration

### Tiptap + Y.js Setup

```javascript
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import * as Y from 'yjs'
import WebSocket from 'isomorphic-ws'

// Create Y.js document
const ydoc = new Y.Doc()

// Custom DLUX provider for Y.js collaboration
class DLUXProvider {
  constructor(url, documentName, authHeaders) {
    this.url = url
    this.documentName = documentName
    this.authHeaders = authHeaders
    this.ydoc = new Y.Doc()
    this.awareness = new Map()
    this.connected = false
    this.eventListeners = new Map()
    
    this.connect()
  }

  connect() {
    this.ws = new WebSocket(`${this.url}/ws/collaborate/${this.documentName}`, {
      headers: this.authHeaders
    })

    this.ws.onopen = () => {
      console.log('Connected to DLUX collaboration server')
      this.connected = true
      this.emit('status', { status: 'connected' })
    }

    this.ws.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer || event.data instanceof Uint8Array) {
        // Y.js binary message
        const message = new Uint8Array(event.data)
        const messageType = message[0]
        const messageData = message.slice(1)

        if (messageType === 0) { // Y_MESSAGE_SYNC
          Y.applyUpdate(this.ydoc, messageData, 'remote')
          this.emit('sync', true)
        } else if (messageType === 1) { // Y_MESSAGE_AWARENESS
          // Handle awareness update
          this.emit('awareness', messageData)
        }
      }
    }

    this.ws.onclose = () => {
      console.log('Disconnected from collaboration server')
      this.connected = false
      this.emit('status', { status: 'disconnected' })
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      this.emit('status', { status: 'disconnected' })
    }

    // Send local changes to server
    this.ydoc.on('update', (update, origin) => {
      if (origin !== 'remote' && this.connected) {
        const message = new Uint8Array(1 + update.length)
        message[0] = 0 // Y_MESSAGE_SYNC
        message.set(update, 1)
        this.ws.send(message)
      }
    })
  }

  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event).push(callback)
  }

  emit(event, data) {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(callback => callback(data))
    }
  }

  destroy() {
    this.ws?.close()
  }
}

// Create provider with Hive authentication
const provider = new DLUXProvider(
  'ws://data.dlux.io',
  'alice/my-document', // document path
  {
    'x-account': 'alice',
    'x-challenge': Math.floor(Date.now() / 1000).toString(),
    'x-pubkey': 'STM7BWmXwvuKHr8FpSPmj8knJspFMPKt3vcetAKKjZ2W2HoRgdkEg',
    'x-signature': 'your-signature-here'
  }
)

// Create Tiptap editor with collaboration features
const editor = new Editor({
  extensions: [
    StarterKit.configure({
      history: false, // Disable default history - Y.js handles this
    }),
    Collaboration.configure({
      document: provider.ydoc, // Use provider's Y.Doc
    }),
    CollaborationCursor.configure({
      provider: provider,
      user: {
        name: 'Alice',
        color: '#f783ac',
      },
    }),
  ],
})

// Listen for collaboration events
provider.on('status', event => {
  console.log('Connection status:', event.status) // connected, disconnected
})

provider.on('sync', isSynced => {
  console.log('Document synced:', isSynced)
})

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  provider.destroy()
})
```

### Authentication Helper

```javascript
import { PrivateKey } from 'hive-tx'

async function generateAuthHeaders(username, privateKey) {
  const challenge = Math.floor(Date.now() / 1000)
  const publicKey = PrivateKey.from(privateKey).createPublic().toString()
  
  // Sign the challenge
  const signature = PrivateKey.from(privateKey)
    .sign(Buffer.from(challenge.toString(), 'utf8'))
    .toString()
  
  return {
    'x-account': username,
    'x-challenge': challenge.toString(),
    'x-pubkey': publicKey,
    'x-signature': signature
  }
}

// Usage
const authHeaders = await generateAuthHeaders('alice', 'your-private-posting-key')
```

## Database Schema

The collaboration system uses three main tables:

### collaboration_documents
```sql
CREATE TABLE collaboration_documents (
  id SERIAL PRIMARY KEY,
  owner VARCHAR(50) NOT NULL,
  permlink VARCHAR(255) NOT NULL,
  document_data TEXT,
  is_public BOOLEAN DEFAULT false,
  last_activity TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(owner, permlink)
);
```

### collaboration_permissions
```sql
CREATE TABLE collaboration_permissions (
  id SERIAL PRIMARY KEY,
  owner VARCHAR(50) NOT NULL,
  permlink VARCHAR(255) NOT NULL,
  account VARCHAR(50) NOT NULL,
  permission_type VARCHAR(20) DEFAULT 'readonly',
  can_read BOOLEAN DEFAULT true,
  can_edit BOOLEAN DEFAULT false,
  can_post_to_hive BOOLEAN DEFAULT false,
  granted_by VARCHAR(50) NOT NULL,
  granted_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(owner, permlink, account)
);
```

### collaboration_activity
```sql
CREATE TABLE collaboration_activity (
  id SERIAL PRIMARY KEY,
  owner VARCHAR(50) NOT NULL,
  permlink VARCHAR(255) NOT NULL,
  account VARCHAR(50) NOT NULL,
  activity_type VARCHAR(50) NOT NULL,
  activity_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### collaboration_stats
```sql
CREATE TABLE collaboration_stats (
  id SERIAL PRIMARY KEY,
  owner VARCHAR(50) NOT NULL,
  permlink VARCHAR(255) NOT NULL,
  total_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  last_activity TIMESTAMP DEFAULT NOW(),
  total_edits INTEGER DEFAULT 0,
  document_size INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(owner, permlink)
);
```

## Error Handling

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

Common error codes:
- `400`: Bad Request (invalid parameters)
- `401`: Unauthorized (invalid authentication)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (document/resource doesn't exist)
- `500`: Internal Server Error

## Document Cleanup Strategy

The collaboration system includes automatic cleanup to manage inactive documents:

### Automatic Cleanup
- **Trigger**: Documents inactive for 30+ days
- **Schedule**: Runs every 24 hours
- **Action**: Archives document data (removes Y.js content, preserves metadata)
- **Logging**: All cleanup actions are logged in the activity table

### Manual Cleanup
- **Access**: Document owners only
- **Endpoint**: `POST /api/collaboration/cleanup/manual/{owner}/{permlink}`
- **Action**: Immediately archives the document data
- **Use Case**: Clean up documents before the 30-day threshold

### Cleanup Process
1. Document data (`document_data`) is set to NULL
2. Metadata (permissions, activity, stats) is preserved
3. Activity log entry is created with cleanup details
4. Document can still be accessed but will start with empty content

## Rate Limiting

Currently no rate limiting is implemented, but it's recommended to:
- Limit API requests to 100 per minute per user
- Limit WebSocket connections to 10 concurrent per user
- Monitor for abuse patterns

## Security Considerations

1. **Authentication**: Always verify Hive signatures server-side
2. **Challenge Expiry**: WebSocket challenges expire after 1 hour
3. **Permissions**: Document owners have full control over access
4. **Public Documents**: Use `is_public` flag carefully
5. **Data Persistence**: Y.js documents are automatically saved to PostgreSQL

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check authentication headers format
   - Verify challenge timestamp is recent (must be within 1 hour)
   - Ensure proper URL encoding

2. **Permission Denied**
   - Document owner must grant explicit permission
   - Check if document exists
   - Verify user has valid Hive account

3. **Signature Invalid**
   - Ensure correct private key is used
   - Check challenge timestamp accuracy
   - Verify public key matches account

### Debug Endpoints

Use the test connection endpoint to debug WebSocket issues:

```bash
curl -X GET "https://data.dlux.io/api/collaboration/test-connection/alice/my-document" \
  -H "x-account: alice" \
  -H "x-challenge: 1703980800" \
  -H "x-pubkey: STM7BWmXwvuKHr8FpSPmj8knJspFMPKt3vcetAKKjZ2W2HoRgdkEg" \
  -H "x-signature: signature-here"
```

## Support

For issues and questions:
- Check server logs for detailed error messages
- Verify authentication using `/api/collaboration/challenge`
- Test basic connectivity with `/api/collaboration/info`
- Use the test endpoints for debugging

## Version History

- **v1.2.0**: Custom Y.js WebSocket Implementation
  - **BREAKING CHANGE**: Switched from separate port to path-based routing
  - **BREAKING CHANGE**: Removed token authentication in favor of Hive auth headers
  - Custom Y.js WebSocket handler with binary protocol support
  - Path-based WebSocket endpoint: `/ws/collaborate/{owner}/{permlink}`
  - Unified Hive authentication for both REST and WebSocket
  - Single-port operation (no more separate collaboration port)
  - Binary Y.js message handling (Y_MESSAGE_SYNC, Y_MESSAGE_AWARENESS)
  - Improved frontend integration with DLUXProvider class

- **v1.1.0**: Enhanced permissions and cleanup system
  - Enhanced permission types: `readonly`, `editable`, `postable`
  - Granular permission capabilities (`canRead`, `canEdit`, `canPostToHive`)
  - Automatic document cleanup after 30 days of inactivity
  - Manual cleanup functionality for document owners
  - Document statistics and analytics
  - Improved activity tracking with user permissions
  - Cursor sharing and user awareness support

- **v1.0.0**: Initial release with basic collaboration features
  - Hive authentication integration
  - Real-time collaborative editing
  - Basic document permissions system
  - Activity logging
  - PostgreSQL persistence 