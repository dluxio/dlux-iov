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
// 1. CONFIG MAP - Document metadata (handled by config observer)
ydoc.getMap('config')
  .set('documentName', 'My Document')     // → currentFile.name/documentName (auto-set from title if default)
  .set('lastModified', '2024-01-01T12:00:00Z')
  .set('owner', 'username')               // Document owner

// 2. METADATA MAP - Publishing data (handled by metadata observer)
ydoc.getMap('metadata')
  .set('title', 'Document Title')         // → titleInput (with recursion protection)
  .set('tags', ['tag1', 'tag2'])          // → reactiveTags + content.tags
  .set('beneficiaries', [{account: 'alice', weight: 500}])  // → reactiveBeneficiaries + content.beneficiaries
  .set('customJson', { app: 'dlux/1.0' }) // → reactiveCustomJson + customJsonString
  .set('permlink', 'my-post-url')         // ↔ permlinkInput (bidirectional with recursion protection)
  .set('allowVotes', true)                // → reactiveCommentOptions + commentOptions
  .set('allowCurationRewards', true)      // → reactiveCommentOptions + commentOptions
  .set('maxAcceptedPayout', '1000000.000 SBD')  // → reactiveCommentOptions + commentOptions
  .set('percentHbd', true)                // → reactiveCommentOptions + commentOptions

// 3. PERMISSIONS MAP - Server-managed
ydoc.getMap('permissions')  // DO NOT modify directly

// 4. BODY FRAGMENT - Managed by TipTap
// Created automatically via Collaboration extension
// Never access directly - use editor.getText() etc.
```

## Observer Architecture

### Two-Observer System
The system uses two dedicated Y.js observers for clean separation of concerns:

- **CONFIG OBSERVER**: Document management metadata (documentName, owner, lastModified)
- **METADATA OBSERVER**: Publishing metadata (title, tags, beneficiaries, permlink, comment options, customJson)

### Field Sync Patterns
```javascript
// CONFIG MAP → Vue reactive properties
documentName  → currentFile.name/documentName (auto-set from title if default)

// METADATA MAP → Vue reactive properties  
title         → titleInput (with recursion protection)
tags          → reactiveTags + content.tags
beneficiaries → reactiveBeneficiaries + content.beneficiaries
permlink      ↔ permlinkInput (bidirectional with recursion protection)
customJson    → reactiveCustomJson + customJsonString + content.custom_json
allowVotes    → reactiveCommentOptions + commentOptions.allowVotes
// ... other comment options follow same pattern
```

### Recursion Protection
Critical fields use recursion protection flags:
- **title**: Uses implicit Vue watcher debouncing
- **permlink**: Uses `_isUpdatingPermlink` flag to prevent circular updates
- **Remote vs Local**: Y.js observers only update Vue when not in local update cycle

### User Intent & Persistence
**Any user interaction shows intent to create a document**:
- **Metadata changes** (tags, beneficiaries, custom JSON, permlink) → immediate persistence
- **Content changes** (title, body) → immediate persistence  
- **Document settings** (document name, comment options) → immediate persistence
- **No content validation**: Metadata-only documents are valid user intent
- **Consistent behavior**: All fields trigger autosave and document creation equally

### File Operations
**File > New Behavior** (Complete Reset Pattern):
- **Input Fields**: All cleared to defaults (`titleInput = ''`, `permlinkInput = ''`, `tagInput = ''`, etc.)
- **Reactive Properties**: Reset to defaults (`reactiveTags = []`, `reactiveBeneficiaries = []`, `reactiveCommentOptions = {...}`)
- **UI State**: All modals/editors closed (`showPermlinkEditor = false`, `showAdvancedOptions = false`)
- **Y.js Documents**: Properly destroyed and recreated with fresh state
- **Observers**: Cleaned up and reattached to new Y.js document
- **Protection Flags**: All reset (`_isUpdatingPermlink = false`)
- **Timers**: All debounce timers cleared to prevent persistence issues
- **Result**: Complete clean slate - no field values persist from previous document

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

### 5-Tier Permission System
- `no-access`: Cannot view or edit (blocked access)
- `readonly`: View only (editor disabled)
- `editable`: View and edit (editor enabled)
- `postable`: Edit and publish to Hive (publish button enabled)
- `owner`: Full control including permissions (all features enabled)

### Computed Properties for UI Control
```javascript
// Permission level detection
this.currentPermissionLevel  // Returns current permission string
this.isOwner                 // Boolean: has owner privileges
this.isPostable             // Boolean: can publish to Hive
this.isEditable             // Boolean: can edit content
this.isReadonly             // Boolean: view-only access
this.hasNoAccess            // Boolean: blocked access

// UI feature controls
this.canEdit                // Editor functionality
this.canDelete              // Delete document (owner only)
this.canPublish             // Publish to Hive (postable/owner)
this.canShare               // Share document (owner only)
this.canManagePermissions   // Permission management (owner only)
```

### Real-time Permission Updates - PRODUCTION READY ✅
- **WebSocket Broadcasts**: Near-instant updates (1-2 seconds) via Y.js awareness - SERVER IMPLEMENTED
- **HTTP Polling Fallback**: 5-minute checks for missed broadcasts
- **WebSocket Reconnection**: Automatic reconnection when permission level changes
- **Dual-Layer Reliability**: Combines real-time broadcasts with polling backup
- **UI Reactivity**: All computed properties update instantly without page refresh
- **Performance Validated**: 95%+ improvement in permission update speed (1-2s vs 30-60s)

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

## Recent Updates (v2025.06.24)
### ✅ Title Field Migration to Metadata Map
- **Issue Fixed**: Title was inconsistently stored in config map while other Hive post attributes were in metadata
- **Solution**: Moved title from config map to metadata map for logical grouping with other publishable fields
- **Result**: Cleaner architecture - config map for document management, metadata map for all Hive post attributes

### ✅ Save Indicator Fix for All Input Fields
- **Issue Fixed**: Save indicator only showed for body editor, not for title/tags/beneficiaries changes
- **Root Cause**: Input handlers were missing the immediate `updateSaveStatus()` call after setting `hasUnsavedChanges`
- **Solution**: Applied consistent pattern to all field handlers:
  ```javascript
  this.hasUnsavedChanges = true;
  this.hasUserIntent = true;
  // Call updateSaveStatus directly to ensure message shows
  this.$nextTick(() => {
      this.updateSaveStatus();
  });
  ```
- **Fixed Handlers**:
  - Title input (for both temp and persistent documents)
  - Tag operations (addTagToYjs, removeTagFromYjs)
  - Beneficiary operations (addBeneficiary, removeBeneficiary)
  - Comment options (all checkbox watchers)
  - Custom JSON editor (handleCustomJsonInput)
  - Generic metadata handler (triggerUserIntentDetection)
- **Result**: "Saving locally..." message now appears immediately for all user inputs

## Recent Updates (v2025.06.24)
### ✅ File > New Reset Fix
- **Issue Fixed**: Custom permlink persisted after File > New, making document appear still loaded
- **Root Cause**: `permlinkInput` was intentionally not reset due to recursion concerns
- **Solution**: Reset `permlinkInput = ''` and `_isUpdatingPermlink = false` in resetComponentState
- **Result**: Complete clean slate - all fields properly reset for new documents

### ✅ User Intent & Persistence Fix
- **Issue Fixed**: Metadata changes (tags, beneficiaries, custom JSON) were hanging on save
- **Root Cause**: Content validation blocking metadata-only documents from creating persistence
- **Solution**: Removed `checkRealContentForIntent()` - any user interaction shows intent
- **Result**: All fields consistently trigger autosave and document creation

### ✅ Permlink Sync Resolution  
- **Issue Fixed**: Permlink changes now sync correctly between owner and editor users
- **Root Cause**: Missing permlink handler in metadata observer
- **Solution**: Added bidirectional permlink sync with recursion protection
- **Architecture**: Unified observer system handling all metadata fields consistently

### ⚠️ WebSocket Permission Broadcast System - CLIENT READY, SERVER PENDING
- **Client-Side**: ✅ Complete - Awareness listener detects and processes permission broadcasts
- **Server-Side**: ❌ Pending - REST API updates database but not Y.js document
- **Temporary Fallback**: HTTP polling increased to 30s/1min until server fix deployed
- **Expected Performance**: Will achieve 1-2 second updates once server integration complete
- **Current Performance**: 30 seconds (active collaboration) to 1 minute (normal) via polling

### Real-time Permission System Enhancement
- **Adaptive Permission Refresh**: Dynamic refresh rates (30s during collaboration, 1min normal)
- **Seamless Permission Transitions**: All permission level changes update UI without page refresh
- **WebSocket Reconnection**: Automatic reconnection when crossing readonly/editable boundary
- **Comprehensive UI Updates**: All computed properties react instantly to permission changes
- **Broadcast Handling**: Immediate permission refresh when server broadcasts changes

### Permission Level Management
- **Five-Tier System**: `no-access`, `readonly`, `editable`, `postable`, `owner`
- **Owner-Only Controls**: Delete and permission management restricted to owners
- **Computed Properties**: Reactive UI elements based on permission levels
- **Real-time Detection**: WebSocket broadcasts + 5-minute polling fallback

### Security Enhancements
- **Owner-Based API Strategy**: Non-owners skip permissions endpoint to prevent 403 errors
- **Permission Hierarchy**: Clear authority structure with proper access controls
- **Authentication Validation**: Robust auth header validation for all operations
- **Graceful Degradation**: Cached permissions ensure offline-first functionality

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