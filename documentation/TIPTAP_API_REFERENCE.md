# TipTap Collaboration API Reference

## Base URL
```
https://data.dlux.io/api/collaboration
```

## Authentication

All API requests require Hive blockchain authentication headers:

```javascript
{
  'x-account': 'dlux_username',      // Hive username
  'x-challenge': '1640995200',       // Unix timestamp (24hr validity)
  'x-pubkey': 'STM8...',            // Hive public key
  'x-signature': 'SIG_K1_...'       // Signed challenge
}
```

### Generating Authentication Headers

```javascript
async function generateAuthHeaders() {
  const account = this.username;
  const challenge = Math.floor(Date.now() / 1000).toString();
  const memo = hive.memo.encode(this.privateKey, this.publicKey, `#${challenge}`);
  
  return {
    'x-account': account,
    'x-challenge': challenge,
    'x-pubkey': this.publicKey,
    'x-signature': memo.substring(1) // Remove # prefix
  };
}
```

## REST API Endpoints

### 1. List Documents
**GET** `/collaboration/documents`

Lists all documents accessible to the authenticated user.

**Response:**
```json
{
  "status": "success",
  "documents": [
    {
      "owner": "username",
      "permlink": "document-permlink",
      "title": "Document Title",
      "lastModified": "2024-01-01T12:00:00Z",
      "permissions": "editable",
      "collaborators": 3
    }
  ]
}
```

### 2. Create Document
**POST** `/collaboration/documents`

Creates a new collaborative document.

**Request Body:**
```json
{
  "permlink": "my-new-document",
  "title": "My New Document",
  "body": "Initial content",
  "metadata": {
    "tags": ["tag1", "tag2"],
    "beneficiaries": [
      {"account": "alice", "weight": 500}
    ]
  }
}
```

**Response:**
```json
{
  "status": "success",
  "document": {
    "owner": "username",
    "permlink": "my-new-document",
    "created": "2024-01-01T12:00:00Z"
  }
}
```

### 3. Get Document Info
**GET** `/collaboration/info/{owner}/{permlink}`

Retrieves document metadata and permission level.

**Response:**
```json
{
  "status": "success",
  "document": {
    "owner": "username",
    "permlink": "document-permlink",
    "title": "Document Title",
    "created": "2024-01-01T10:00:00Z",
    "lastModified": "2024-01-01T12:00:00Z",
    "permission": "editable",
    "collaborators": ["alice", "bob"],
    "metadata": {
      "tags": ["tag1", "tag2"],
      "beneficiaries": []
    }
  }
}
```

### 4. Delete Document
**DELETE** `/collaboration/documents/{owner}/{permlink}`

Deletes a document (owner only).

**Response:**
```json
{
  "status": "success",
  "message": "Document deleted successfully"
}
```

### 5. Manage Permissions

#### Grant Permission
**POST** `/collaboration/permissions/{owner}/{permlink}`

**Request Body:**
```json
{
  "account": "alice",
  "level": "editable"  // no-access, readonly, editable, postable
}
```

**Response:**
```json
{
  "status": "success",
  "permission": {
    "account": "alice",
    "level": "editable",
    "granted": "2024-01-01T12:00:00Z"
  }
}
```

#### Get Permissions
**GET** `/collaboration/permissions/{owner}/{permlink}`

Lists all permissions for a document (owner only).

**Response:**
```json
{
  "status": "success",
  "permissions": [
    {
      "account": "alice",
      "level": "editable",
      "granted": "2024-01-01T12:00:00Z"
    },
    {
      "account": "bob",
      "level": "readonly",
      "granted": "2024-01-01T11:00:00Z"
    }
  ]
}
```

#### Revoke Permission
**DELETE** `/collaboration/permissions/{owner}/{permlink}/{account}`

**Response:**
```json
{
  "status": "success",
  "message": "Permission revoked"
}
```

### 6. Get Activity Log
**GET** `/collaboration/activity/{owner}/{permlink}`

Retrieves document activity history.

**Query Parameters:**
- `limit` (optional): Number of entries (default: 50)
- `offset` (optional): Pagination offset

**Response:**
```json
{
  "status": "success",
  "activity": [
    {
      "timestamp": "2024-01-01T12:00:00Z",
      "account": "alice",
      "action": "edit",
      "details": "Modified document content"
    },
    {
      "timestamp": "2024-01-01T11:30:00Z",
      "account": "bob",
      "action": "permission_granted",
      "details": "Granted readonly access"
    }
  ]
}
```

## WebSocket Connection

### Connection URL
```
wss://data.dlux.io/collaboration/{owner}/{permlink}
```

### Connection with Authentication
```javascript
const HocuspocusProvider = window.TiptapCollaboration.HocuspocusProvider;

this.provider = new HocuspocusProvider({
  url: `wss://data.dlux.io/collaboration/${owner}/${permlink}`,
  name: `${owner}/${permlink}`,
  document: this.ydoc,
  token: await this.generateWebSocketToken(),
  onAuthenticated: () => {
    console.log('WebSocket authenticated');
  },
  onStatus: ({ status }) => {
    console.log('Connection status:', status);
  },
  onSynced: ({ state }) => {
    console.log('Document synced:', state);
  }
});
```

### WebSocket Token Generation
```javascript
async generateWebSocketToken() {
  const authHeaders = await this.generateAuthHeaders();
  return btoa(JSON.stringify(authHeaders));
}
```

## Error Responses

### 400 Bad Request
```json
{
  "status": "error",
  "error": "Invalid request",
  "message": "Missing required field: permlink"
}
```

### 401 Unauthorized
```json
{
  "status": "error",
  "error": "Authentication failed",
  "message": "Invalid signature or expired challenge"
}
```

### 403 Forbidden
```json
{
  "status": "error",
  "error": "Permission denied",
  "message": "You don't have permission to perform this action"
}
```

### 404 Not Found
```json
{
  "status": "error",
  "error": "Document not found",
  "message": "The requested document does not exist"
}
```

### 500 Internal Server Error
```json
{
  "status": "error",
  "error": "Server error",
  "message": "An unexpected error occurred"
}
```

## Rate Limiting

- **REST API**: 100 requests per minute per IP
- **WebSocket**: 1000 messages per minute per connection
- **Document Creation**: 10 documents per hour per account

## Permission Levels

1. **`no-access`**: Cannot view or edit (blocked)
2. **`readonly`**: View only (editor disabled)
3. **`editable`**: View and edit (editor enabled)
4. **`postable`**: Edit and publish to Hive
5. **`owner`**: Full control including permissions

## Real-time Permission Updates

### WebSocket Broadcast Format
```json
{
  "type": "permission-update",
  "data": {
    "account": "alice",
    "oldLevel": "readonly",
    "newLevel": "editable",
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

### Handling Permission Broadcasts
```javascript
this.provider.on('message', ({ message }) => {
  if (message.type === 'permission-update') {
    const { account, newLevel } = message.data;
    if (account === this.username) {
      this.handlePermissionChange(newLevel);
    }
  }
});
```

## Best Practices

1. **Cache Authentication Headers**: Generate once per session (24hr validity)
2. **Handle Token Expiration**: Regenerate auth headers when receiving 401
3. **Implement Exponential Backoff**: For connection retries
4. **Use Permission Caching**: Reduce API calls with 5-minute cache
5. **Monitor Rate Limits**: Implement client-side rate limiting

## Example: Complete Document Creation Flow

```javascript
// 1. Generate auth headers
const authHeaders = await this.generateAuthHeaders();

// 2. Create document via REST API
const response = await fetch('https://data.dlux.io/api/collaboration/documents', {
  method: 'POST',
  headers: {
    ...authHeaders,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    permlink: 'my-document',
    title: 'My Document',
    body: 'Initial content'
  })
});

const { document } = await response.json();

// 3. Connect via WebSocket
const provider = new HocuspocusProvider({
  url: `wss://data.dlux.io/collaboration/${document.owner}/${document.permlink}`,
  name: `${document.owner}/${document.permlink}`,
  document: ydoc,
  token: btoa(JSON.stringify(authHeaders))
});

// 4. Grant permissions to collaborators
await fetch(`https://data.dlux.io/api/collaboration/permissions/${document.owner}/${document.permlink}`, {
  method: 'POST',
  headers: {
    ...authHeaders,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    account: 'alice',
    level: 'editable'
  })
});
```