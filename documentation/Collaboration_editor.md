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

Example: `alice/URiHERhq0qFjczMD`

**Note**: Documents now have separate display names and technical permlinks:
- **Permlink**: URL-safe random identifier (e.g., `URiHERhq0qFjczMD`) used for routing and references
- **Document Name**: User-friendly display name (e.g., `My Project Notes`) that can be changed by owners/editors

## Document Naming System

The collaboration system uses a dual-identifier approach:

### Technical Permlinks
- **Auto-generated**: 16-character URL-safe random strings (e.g., `URiHERhq0qFjczMD`)
- **Immutable**: Never change once created, ensuring stable URLs and references
- **Used for**: WebSocket connections, API endpoints, database relationships

### Display Names
- **User-friendly**: Human-readable names (e.g., `My Project Notes`, `2024-01-15 Meeting Minutes`)
- **Editable**: Can be changed by document owners or users with edit permissions
- **Default format**: `YYYY-MM-DD untitled` if not specified during creation
- **Used for**: UI display, document organization, user experience

This separation allows users to rename documents without breaking existing links or references.



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
      "permlink": "URiHERhq0qFjczMD",
      "documentName": "My Project Notes",
      "documentPath": "alice/URiHERhq0qFjczMD",
      "isPublic": false,
      "hasContent": true,
      "contentSize": 1024,
      "accessType": "owner",
      "createdAt": "2024-01-01T12:00:00Z",
      "updatedAt": "2024-01-01T15:30:00Z",
      "lastActivity": "2024-01-01T15:30:00Z"
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
  "documentName": "My New Document", 
  "isPublic": false,
  "title": "My New Document",
  "description": "A collaborative document"
}
```

**Notes:**
- `documentName` is optional. If not provided, defaults to `YYYY-MM-DD untitled` format
- `permlink` is automatically generated as a 16-character URL-safe random string
- `title` and `description` are optional metadata for activity logging

**Response:**
```json
{
  "success": true,
  "document": {
    "owner": "alice",
    "permlink": "URiHERhq0qFjczMD",
    "documentName": "My New Document",
    "documentPath": "alice/URiHERhq0qFjczMD",
    "isPublic": false,
    "websocketUrl": "ws://localhost:1234/alice/URiHERhq0qFjczMD",
    "createdAt": "2024-01-01T12:00:00Z"
  }
}
```

### 5. Update Document Name

```http
PATCH /api/collaboration/documents/{owner}/{permlink}/name
```

**Request Body:**
```json
{
  "documentName": "Updated Document Name"
}
```

**Notes:**
- Only document owners or users with edit permissions can rename documents
- Document name cannot be empty and has a maximum length of 500 characters
- Permlink remains unchanged when renaming

**Response:**
```json
{
  "success": true,
  "message": "Document name updated successfully",
  "document": {
    "owner": "alice",
    "permlink": "URiHERhq0qFjczMD",
    "documentName": "Updated Document Name",
    "documentPath": "alice/URiHERhq0qFjczMD",
    "updatedBy": "alice",
    "updatedAt": "2024-01-01T16:00:00Z"
  }
}
```

### 6. Get Document Info

```http
GET /collaboration/info/{owner}/{permlink}
```

**Notes:**
- Returns detailed information about a specific document
- Requires read access to the document (owner, granted permission, or public document)

**Response:**
```json
{
  "success": true,
  "document": {
    "owner": "alice",
    "permlink": "URiHERhq0qFjczMD",
    "documentName": "My Document",
    "documentPath": "alice/URiHERhq0qFjczMD",
    "isPublic": false,
    "hasContent": true,
    "contentSize": 1024,
    "accessType": "owner",
    "websocketUrl": "ws://localhost:1234/alice/URiHERhq0qFjczMD",
    "createdAt": "2024-01-01T12:00:00Z",
    "updatedAt": "2024-01-01T15:30:00Z",
    "lastActivity": "2024-01-01T15:30:00Z"
  }
}
```

### 7. Delete Document

```http
DELETE /collaboration/documents/{owner}/{permlink}
```

**Note:** Only document owners can delete documents.

**Response:**
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

### 8. Get Document Permissions

```http
GET /collaboration/permissions/{owner}/{permlink}
```

**Response:**
```json
{
  "success": true,
  "document": "alice/URiHERhq0qFjczMD",
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

### 9. Grant Permission

```http
POST /collaboration/permissions/{owner}/{permlink}
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

### 10. Revoke Permission

```http
DELETE /collaboration/permissions/{owner}/{permlink}/{targetAccount}
```

**Response:**
```json
{
  "success": true,
  "message": "Permission revoked from @bob"
}
```

### 11. Get Activity Log

```http
GET /collaboration/activity/{owner}/{permlink}
```

**Query Parameters:**
- `limit` (optional): Number of activities to return (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "document": "alice/URiHERhq0qFjczMD",
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

### 12. Get Document Statistics

```http
GET /collaboration/stats/{owner}/{permlink}
```

**Response:**
```json
{
  "success": true,
  "document": "alice/URiHERhq0qFjczMD",
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

### 13. Get Detailed Permissions

```http
GET /collaboration/permissions-detailed/{owner}/{permlink}
```

**Response:**
```json
{
  "success": true,
  "document": "alice/URiHERhq0qFjczMD",
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

### 14. Manual Document Cleanup

```http
POST /collaboration/cleanup/manual/{owner}/{permlink}
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

## API Usage Examples

### Creating Documents

```javascript
// Create document with custom name
const response = await fetch('/api/collaboration/documents', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-account': 'alice',
    'x-challenge': Math.floor(Date.now() / 1000).toString(),
    'x-pubkey': 'STM...',
    'x-signature': '...'
  },
  body: JSON.stringify({
    documentName: 'My Project Notes',
    isPublic: false
  })
})

// Returns: { permlink: "URiHERhq0qFjczMD", documentName: "My Project Notes" }
```

```javascript
// Create document with default name
const response = await fetch('/api/collaboration/documents', {
  method: 'POST',
  headers: { /* auth headers */ },
  body: JSON.stringify({
    isPublic: false
  })
})

// Returns: { permlink: "loWoeOsHjrz8UhRR", documentName: "2024-01-15 untitled" }
```

### Renaming Documents

```javascript
// Update document name
const response = await fetch('/api/collaboration/documents/alice/URiHERhq0qFjczMD/name', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'x-account': 'alice', // or user with edit permission
    // ... other auth headers
  },
  body: JSON.stringify({
    documentName: 'Updated Project Notes'
  })
})
```

## Frontend Integration


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
  document_name VARCHAR(500) DEFAULT '',
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

## System Endpoints

### System Versions

```http
GET /api/system/versions
```

**Description:**
Returns version information for system features and capabilities. Used by the client to determine available functionality and compatibility.

**Authentication:**
Requires standard Hive authentication headers.

**Response:**
```json
{
  "success": true,
  "versions": {
    "api": "2.1.0",
    "websocket": "1.3.0",
    "collaboration": "3.0.0",
    "features": {
      "permissions_broadcast": "1.0.0",
      "document_cleanup": "1.1.0",
      "activity_logging": "2.0.0"
    }
  }
}
```

**Usage:**
- Client uses this to check feature compatibility
- Enables progressive enhancement based on server capabilities
- Used during application initialization

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

