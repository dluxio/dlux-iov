# DLUX IOV - Claude Development Guide

## Project Overview
DLUX IOV is a collaborative document editing platform with TipTap v3, Y.js, and offline-first architecture implementing a two-tier collaboration system.

## Quick Reference
- **Main implementation**: `js/tiptap-editor-modular.js`
- **Architecture guide**: `TIPTAP_OFFLINE_FIRST_BEST_PRACTICES.md` (comprehensive implementation details)
- **Shema guide**; `TIPTAP_COLLABORATIVE_SCHEMA.MD`
- **API Documentation**; `Collaboration_editor.md`
- **Testing commands**: `npm run lint && npm run typecheck`

## Core Technologies
- **TipTap Editor v3**: Rich text editing (3.0.0+) - Single editor for body content
- **Y.js**: CRDT for real-time collaboration and offline sync
- **IndexedDB**: Local persistence layer
- **Hocuspocus**: WebSocket collaboration server (self-hosted at data.dlux.io)
- **DLUX/Hive Auth**: Blockchain-based permissions (24hr expiration)
- **Vue 3**: Frontend framework with specific integration requirements

## Two-Tier Collaboration System
1. **Tier 1 (Local)**: Y.js + IndexedDB + Collaboration extension (no cursors)
   - New documents, local editing, offline-first
   - Can upgrade to Tier 2 with full collaboration
   
2. **Tier 2 (Cloud)**: Y.js + IndexedDB + WebSocket + Collaboration + CollaborationCaret
   - Real-time collaboration with cursor tracking
   - Requires authentication and WebSocket connection

## Y.js Document Structure

```javascript
// 1. CONFIG MAP - Document metadata
ydoc.getMap('config')
  .set('documentName', 'My Document')      // Display name
  .set('lastModified', '2024-01-01T12:00:00Z')
  .set('owner', 'username')                // Document owner

// 2. METADATA MAP - Publishing data (consolidated)
ydoc.getMap('metadata')
  .set('tags', ['tag1', 'tag2'])          // Post tags
  .set('beneficiaries', [{account: 'alice', weight: 500}])  // 5%
  .set('customJson', { app: 'dlux/1.0' })  // Custom metadata
  .set('permlink', 'my-post-url')         // URL slug
  .set('allowVotes', true)                // Comment options
  .set('allowCurationRewards', true)
  .set('maxAcceptedPayout', '1000000.000 SBD')
  .set('percentHbd', true)

// 3. PERMISSIONS MAP - Server-managed
ydoc.getMap('permissions')  // DO NOT modify directly

// 4. BODY FRAGMENT - Managed by TipTap
// Created automatically via Collaboration extension
// Never access directly - use editor.getText() etc.
```

## API Endpoints

**Base URL**: `https://data.dlux.io/api`  
**WebSocket**: `wss://data.dlux.io/collaboration/{owner}/{permlink}`

### Key Endpoints
- `GET/POST /collaboration/documents` - List/create documents
- `GET/POST/DELETE /collaboration/permissions/{owner}/{permlink}` - Manage permissions
- `GET /collaboration/info/{owner}/{permlink}` - Document metadata
- `GET /collaboration/activity/{owner}/{permlink}` - Activity log

### Authentication Headers
```javascript
{
  'x-account': 'dlux_username',
  'x-challenge': '1640995200',    // Unix timestamp (23hr validity)
  'x-pubkey': 'STM8...',         // Hive public key
  'x-signature': 'SIG_K1_...'    // Signed challenge
}
```

## Permission Levels
- `no-access`: Cannot view or edit
- `readonly`: View only
- `editable`: View and edit
- `postable`: Edit and publish to Hive
- `owner`: Full control including permissions

## Critical Implementation Notes

### Single Editor Architecture
- **Title**: Simple `<input>` field with `v-model="titleInput"`
- **Body**: Single TipTap editor wrapped with `markRaw()`
- **Metadata**: Stored in Y.js maps, not separate editors

### Vue 3 Requirements
- **Editor instances**: MUST use `markRaw()` to prevent reactivity issues
- **Computed properties**: Access as properties, not functions
- **Y.js documents**: Don't need `markRaw()` - they manage their own state

### TipTap v3 Specifics
- Use `field` parameter, not `fragment`
- Disable UndoRedo in StarterKit when using Collaboration
- CollaborationCursor renamed to CollaborationCaret
- Import from `@tiptap/vue-3`, not `@tiptap/vue-2`

## Official Documentation

### Core Collaboration Framework
- **TipTap Editor Overview**: https://next.tiptap.dev/docs/editor/getting-started/overview
- **TipTap Collaboration Overview**: https://next.tiptap.dev/docs/collaboration/getting-started/overview
- **TipTap Awareness Concepts**: https://next.tiptap.dev/docs/collaboration/core-concepts/awareness
- **TipTap Performance Guide**: https://next.tiptap.dev/docs/guides/performance
- **TipTap Invalid Schema Handling**: https://next.tiptap.dev/docs/guides/invalid-schema
- **TipTap Authentication**: https://next.tiptap.dev/docs/collaboration/getting-started/authenticate
- **TipTap Offline Support**: https://next.tiptap.dev/docs/guides/offline-support
- **TipTap Vue.js Integration**: https://next.tiptap.dev/docs/editor/getting-started/install/vue3
- **Y.js Documentation**: https://docs.yjs.dev/
- **Y.js Protocols**: https://github.com/yjs/y-protocols

### Extensions and Features
- **TipTap StarterKit Extension**: https://next.tiptap.dev/docs/editor/extensions/functionality/starterkit
- **TipTap Collaboration Extension**: https://next.tiptap.dev/docs/editor/extensions/functionality/collaboration
- **TipTap CollaborationCaret**: https://next.tiptap.dev/docs/editor/extensions/functionality/collaboration-caret
- **TipTap Extend Extension**: https://next.tiptap.dev/docs/editor/extensions/custom-extensions/extend-existing

### Server Implementation
- **Hocuspocus Server**: https://github.com/ueberdosis/hocuspocus
- **TipTap Provider Integration**: https://next.tiptap.dev/docs/collaboration/provider/integration
- **TipTap Webhooks**: https://next.tiptap.dev/docs/collaboration/core-concepts/webhooks
- **TipTap REST API**: https://next.tiptap.dev/docs/collaboration/documents/rest-api

## Common Issues & Solutions

For detailed troubleshooting, patterns, and implementation guidelines, see:
**`TIPTAP_OFFLINE_FIRST_BEST_PRACTICES.md`**

Key issues covered:
- "RangeError: Applying a mismatched transaction"
- "function () { [native code] }" display
- Permlink editing reverting/not saving
- State synchronization problems
- Memory management and cleanup

**Note**: Always refer to the Official Documentation above for the latest best practices and implementation patterns.

## Recent Updates (v2025.01.24)
### Readonly User Collaboration Fix
- **Server-Side**: Added onAwarenessUpdate handler to accept cursor/presence updates from readonly users
- **Server-Side**: Modified beforeHandleMessage to delegate awareness messages to Hocuspocus
- **Client-Side**: Implemented Y.js-compliant awareness heartbeat (15s interval for 30s timeout)
- **Client-Side**: Removed all artificial keepalive mechanisms in favor of standard awareness protocol

### Y.js Awareness Compliance
- **Heartbeat**: Sends awareness updates every 15 seconds to maintain Y.js 30-second timeout
- **Cleanup**: Proper interval cleanup on provider destroy and component unmount
- **Standard Protocol**: Uses `setLocalStateField('lastActivity', Date.now())` for heartbeat
- **Message Handling**: Readonly users can now send all protocol messages (0-4, 8) including Awareness
- **Connection Monitoring**: Server logs keepalive every 30 seconds
- **Enhanced Logging**: Detailed connection/disconnection tracking

### Client-Side Changes
- **Removed Custom Extensions**: All users now use standard CollaborationCaret
- **No More Workarounds**: Removed ReadOnlyCollaborationCaret custom extension
- **Simplified Code**: Unified cursor handling for all permission levels

## Recent Updates (v2025.01.23)
- Migrated to single editor architecture
- Consolidated all metadata into single Y.js map
- Fixed Vue 3 computed property access patterns
- Implemented three-state edit pattern for inline fields
- Updated permlink handling with proper state management

## Development Workflow
1. Check `TIPTAP_OFFLINE_FIRST_BEST_PRACTICES.md` for patterns
2. Follow Y.js transaction patterns with origin tags
3. Test with `npm run lint && npm run typecheck`
4. Use proper cleanup order: observers → editors → providers → Y.js
5. Always handle both Tier 1 and Tier 2 scenarios

---
For comprehensive implementation details, patterns, and best practices, refer to:
**`TIPTAP_OFFLINE_FIRST_BEST_PRACTICES.md`**