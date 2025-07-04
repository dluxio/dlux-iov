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

### Modular Drag & Drop System

The editor implements a modular block list system that controls what content can be dropped into specific nodes (e.g., preventing tables from being dropped into table cells).

#### How It Works

1. **Registry-Based Block Lists** (`src/collaboration-bundle.js`):
```javascript
const nodeBlockLists = {
  tableCell: ['table'],    // tableCell blocks tables only
  tableHeader: ['table']   // tableHeader blocks tables only
};
```

2. **Utility Function** checks if content is blocked at a position:
```javascript
function isContentBlockedAt(state, pos, contentType) {
  // Checks all ancestor nodes for block lists
  // Returns { blocked: true/false, byNode, atDepth }
}
```

3. **CustomDropcursor** hides the drop cursor for blocked content:
- Tracks what's being dragged
- Uses `isContentBlockedAt` to check if it's blocked
- Hides dropcursor and shows "not-allowed" cursor when over blocked areas

4. **CustomTableCell** enforces the block rules:
- Uses same `isContentBlockedAt` check
- Prevents drops of blocked content
- Handles position adjustment for downward drags

#### Adding Content to Block Lists

To block additional content types from being dropped into table cells:

```javascript
// In src/collaboration-bundle.js
const nodeBlockLists = {
  tableCell: ['table', 'image'],    // Example: Add 'image' to also block images
  tableHeader: ['table', 'image']   // Keep consistent
};
```

To add block lists for new node types:

```javascript
const nodeBlockLists = {
  tableCell: ['table'],
  tableHeader: ['table'],
  codeBlock: ['table', 'image']     // New node with its own block list
};
```

#### Architecture Benefits
- **Single Source of Truth**: Block lists defined in one registry
- **Automatic Coordination**: Dropcursor and drop handling stay in sync
- **Easy Extension**: Just update the registry, no code changes needed
- **Type-Safe**: Each node declares what it blocks

#### Implementation Details
- CustomTableCell replaces the default tableCell from TableKit
- TableHeader uses the default from TableKit (no custom version needed)
- Both Tier 1 and Tier 2 editors use the same extensions
- Markdown export includes all custom extensions

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
- **TipTap Static Renderer**: https://next.tiptap.dev/docs/editor/api/utilities/static-renderer
- **Y.js Documentation**: https://docs.yjs.dev/
- **Y.js Protocols**: https://github.com/yjs/y-protocols
- **Tippy.js**: https://atomiks.github.io/tippyjs/v6/all-props/
- **ProseMirror**: https://prosemirror.net/docs/ref/

### Extensions and Features
- **TipTap StarterKit Extension**: https://next.tiptap.dev/docs/editor/extensions/functionality/starterkit
- **TipTap Table Kit Extension**: https://next.tiptap.dev/docs/editor/extensions/functionality/table-kit
- **TipTap Collaboration Extension**: https://next.tiptap.dev/docs/editor/extensions/functionality/collaboration
- **TipTap CollaborationCaret**: https://next.tiptap.dev/docs/editor/extensions/functionality/collaboration-caret
- **TipTap Mention Extension**: https://next.tiptap.dev/docs/editor/extensions/nodes/mention
- **TipTap FloatingMenu Extension**: https://next.tiptap.dev/docs/editor/extensions/functionality/floatingmenu
- **TipTap Drag Handle Extension**: https://next.tiptap.dev/docs/editor/extensions/functionality/drag-handle
- **TipTap Drag Handle Vue Extension**: https://next.tiptap.dev/docs/editor/extensions/functionality/drag-handle-vue
- **TipTap Drag Bubble Menu Extension**: https://next.tiptap.dev/docs/editor/extensions/functionality/bubble-menu
- **TipTap Text Align**: https://next.tiptap.dev/docs/editor/extensions/functionality/textalign
- **TipTap Image Extension**: https://next.tiptap.dev/docs/editor/extensions/nodes/image

When extending always import standalone extension, do not import from kits like starter kit or table kit
- **TipTap Extend Extension**: https://next.tiptap.dev/docs/editor/extensions/custom-extensions/extend-existing
- **TipTap Table Cell Extension**: https://next.tiptap.dev/docs/editor/extensions/nodes/table-cell
- **TipTap Drop Cursor Extension**: https://next.tiptap.dev/docs/editor/extensions/functionality/dropcursor
- **TipTap YouTube Extension**: https://next.tiptap.dev/docs/editor/extensions/nodes/youtube

### Server Implementation
- **Hocuspocus Server**: https://github.com/ueberdosis/hocuspocus
- **TipTap Provider Integration**: https://next.tiptap.dev/docs/collaboration/provider/integration
- **TipTap Webhooks**: https://next.tiptap.dev/docs/collaboration/core-concepts/webhooks
- **TipTap REST API**: https://next.tiptap.dev/docs/collaboration/documents/rest-api

### TipTap API
https://next.tiptap.dev/docs/editor/api/editor
https://next.tiptap.dev/docs/editor/api/commands
https://next.tiptap.dev/docs/editor/api/commands/content
https://next.tiptap.dev/docs/editor/api/commands/nodes-and-marks
https://next.tiptap.dev/docs/editor/api/commands/lists
https://next.tiptap.dev/docs/editor/api/commands/selection
https://next.tiptap.dev/docs/editor/api/utilities
https://next.tiptap.dev/docs/editor/api/node-positions
https://next.tiptap.dev/docs/editor/api/events


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

## TipTap v3 Compliance Status (Audited 2025.06.25)

### ✅ Compliance Score: 95%

#### Fully Compliant Areas:
- **Editor Configuration**: Proper use of `field` parameter, `CollaborationCaret` naming, disabled UndoRedo
- **Vue 3 Integration**: Consistent `markRaw()` usage, proper reactive patterns, no Vue 2 legacy code
- **Y.js Best Practices**: All transactions use origin tags, no modifications in observers, proper cleanup
- **Memory Management**: Correct cleanup order (observers → editors → providers → Y.js)
- **Error Handling**: Comprehensive try-catch blocks, WebSocket error handling, detailed logging

#### Minor Deviations:
- **Import Pattern**: Uses bundled imports via `window.TiptapCollaboration` (architectural choice)
- **Event Cleanup**: WebSocket provider events could be more explicitly removed
- **Error Recovery**: No explicit recovery for "RangeError: Applying a mismatched transaction"

#### Key Strengths:
- Exceptional use of Y.js transaction origin tags for debugging
- Clean single-editor architecture with title as input field
- Well-architected two-tier collaboration system
- Comprehensive security implementation
- Extensive inline documentation

## WebSocket Permission Broadcast Implementation (v2025.01.25)

### ✅ Complete Real-Time Permission System
The WebSocket Permission Broadcast System provides instantaneous permission updates (1-2 seconds) for collaborative documents:

#### Server-Side Architecture
- **Collaboration Server**: Enhanced with `PermissionBroadcastManager` class
- **Broadcast API**: Dedicated Express server on port 1235 with internal authentication
- **Y.js Integration**: Permission changes update Y.js document's `permissions` map
- **Auto-Cleanup**: Old permission updates cleaned up (keeps last 10 per account)

#### Client-Side Integration  
- **Permission Observer**: Y.js observer listens to `permissions` map changes
- **Real-Time Handler**: `handlePermissionBroadcast()` processes incoming updates
- **UI Updates**: Instant editor enable/disable and permission level changes
- **WebSocket Reconnection**: Automatic reconnection for permission level upgrades

#### API Endpoints Enhanced
- **Grant Permission**: `POST /api/collaboration/permissions/{owner}/{permlink}` → triggers broadcast
- **Revoke Permission**: `DELETE /api/collaboration/permissions/{owner}/{permlink}/{account}` → triggers broadcast  
- **Delete Document**: `DELETE /api/collaboration/documents/{owner}/{permlink}` → triggers broadcast
- **Broadcast API**: `POST http://localhost:1235/broadcast/permission-change` (internal)

#### Computed Properties Added
- **Permission Detection**: `currentPermissionLevel`, `isOwner`, `isPostable`, `isEditable`, `isReadonly`, `hasNoAccess`
- **UI Controls**: `canEdit`, `canDelete`, `canPublish`, `canShare`, `canManagePermissions`
- **Real-Time Reactivity**: All computed properties update instantly with WebSocket broadcasts

#### Testing & Validation
- **Test Script**: `docker-data/test-permission-broadcast.js` with provided auth headers
- **Comprehensive Coverage**: Tests all permission types and broadcast scenarios
- **Production Ready**: Validated end-to-end permission broadcast pipeline

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

## Recent Updates (v2025.06.25)
### ✅ CRITICAL Security Fix - Local Document Permission Bypass
- **Issue Fixed**: Username watcher was not validating permissions for local documents when switching users
- **Root Cause**: Username watcher only checked collaborative documents, allowing cross-user access to local files
- **Solution**: Added local document ownership validation in username watcher
- **Result**: Users cannot access other users' local documents after switching accounts
- **Additional Fix**: Unauthenticated users (no username or expired auth) now immediately lose access to all documents

### ✅ Authentication Bypass Security Fix  
- **Issue Fixed**: Unauthenticated users could maintain access via cached permissions
- **Root Cause**: `validateCurrentDocumentPermissions()` fell back to cached permissions when not authenticated
- **Solution**: Force `no-access` for unauthenticated users without cache fallback
- **Result**: Expired/logged out users immediately lose document access

### ✅ Editor Lock-Down Fix for Permission Changes
- **Issue Fixed**: Editor remained editable when switching to readonly user in collaborative mode
- **Root Cause**: 
  1. `handlePermissionBroadcast` tried to directly set `isReadOnlyMode` (a computed property)
  2. `validateCurrentDocumentPermissions` didn't update editor state when permissions changed
  3. Vue reactivity wasn't detecting deep cache object changes
- **Solution**: 
  1. Remove invalid computed property assignments
  2. Update cached permissions properly to trigger computed property
  3. Add `$forceUpdate()` to ensure Vue recalculates `isReadOnlyMode`
  4. Explicitly call `setEditable()` based on new permission level
- **Result**: Editor properly locks/unlocks when user permissions change

### ✅ BubbleMenu Extension Integration - NEW FEATURE
- **Feature Added**: TipTap BubbleMenu extension for floating formatting toolbar on text selection
- **UI Enhancement**: Bubble menu with Bold, Italic, Strike, Code, and Link buttons
- **Vue 3 Compliant**: Fixed DOM timing issues with permanent element and safe event handling
- **Button Fix**: Used `@mousedown.prevent` pattern to maintain text selection
- **Smart Visibility**: CSS-based hiding with TipTap Floating UI control
- **Package**: Added `@tiptap/extension-bubble-menu@3.0.0-beta.15` to dependencies
- **Bundle Update**: Included in collaboration bundle and exported via `window.TiptapCollaboration.BubbleMenu`
- **Styling**: Added dark-themed bubble menu styles to `css/tiptap-editor.css` with `display: none` initial state
- **Fixed**: Corrected visibility logic - let TipTap extension handle show/hide rather than Vue template conditions

### ✅ BubbleMenu "domFromPos" Error Fix
- **Issue Fixed**: "Cannot read properties of null (reading 'domFromPos')" error when unmounting component
- **Root Cause**: Floating UI async positioning calculations continuing after editor destruction
- **Solution 1**: Added `editor.isDestroyed` and `isUnmounting` checks in shouldShow callback
- **Solution 2**: Force hide bubble menu element in beforeUnmount to cancel pending calculations
- **Solution 3**: Increased updateDelay from 100ms to 250ms to reduce positioning frequency
- **Solution 4**: Added tippyOptions with onHide/onDestroy handlers for cleanup
- **Result**: No more errors during rapid document switching or component unmounting

### ✅ Document Duplicate Functionality - NEW FEATURE  
- **Feature Added**: Duplicate button in File menu dropdown creates exact copy of current document
- **Implementation**: Complete duplicate system for both local and collaborative documents
- **Data Copying**: All document data preserved (title, body, metadata, tags, beneficiaries, custom JSON, comment options)
- **Naming Convention**: Appends " - Copy" to original document name
- **Type Support**: Works for both local documents (creates IndexedDB copy) and collaborative documents (creates new cloud document)
- **TipTap v3 Compliant**: Uses proper Y.js transactions with origin tags, follows all best practices
- **Location**: `js/tiptap-editor-modular.js:14043` - `duplicateDocument()` method with helper functions
- **Persistence Logic**: `canDuplicate` computed property controls button state with helpful UX:
  - **Collaborative documents**: Always enabled (server-persisted)
  - **Local documents**: Enabled only after IndexedDB persistence created (user intent + autosave)
  - **Temporary documents**: Shown as disabled with tooltip "Document must be saved before it can be duplicated"
  - **No current file**: Button hidden completely
- **Fix Applied**: Corrected collaborative document loading to use proper `loadDocument(file)` method with correct file structure

### ✅ Security Fix - Authentication State Change Vulnerability
- **Issue Fixed**: Switching users didn't immediately revoke collaborative document access
- **Root Cause**: Permission caches not invalidated on auth state changes
- **Solution**: Added username watcher that clears all permission caches and re-validates current document
- **Security Impact**: Prevents unauthorized access after logout or account switching
- **Implementation**: 
  - Username watcher detects auth changes
  - `clearAllPermissionCaches()` invalidates all cached permissions
  - `validateCurrentDocumentPermissions()` fetches fresh permissions from server
  - Document closed if user has no-access, WebSocket reconnected if permissions changed

### ✅ Cloud Button Background Color Fix
- **Issue Fixed**: Cloud button background colors not displaying
- **Root Cause**: Template incorrectly calling `getStatusStyle(cloudButtonStyle.state)` 
- **Solution**: Changed to directly use `:style="cloudButtonStyle"`
- **Result**: Proper background colors - grey (local), green (connected), orange (connecting), blue (offline)

### ✅ Permlink Auto-Generate UX Enhancement
- **Issue Fixed**: Auto-generate button didn't update edit preview when clicked during editing
- **Solution**: Added `permlinkInputTemp` update in `useGeneratedPermlink()`
- **Result**: Users can click auto-generate while editing to reset to generated value and continue editing

### ✅ Fix Persistent Document Creation on Page Refresh - COMPLETE
- **Issue Fixed**: Persistent documents were created immediately on page refresh without user interaction
- **Root Cause**: 
  1. Y.js observers were setting `hasUserIntent = true` during initial document load from IndexedDB/WebSocket sync
  2. TipTap editor fires `onUpdate` events during initialization, triggering `debouncedUpdateContent`
  3. Multiple code paths were triggering persistence creation before editor was ready
  4. Metadata changes from Y.js sync were triggering `autoSave()` during initialization
- **Solution**: Added comprehensive multi-layer protection to prevent false user intent detection:
  1. **isLoadingDocument flag**: Prevents intent detection during document loading
  2. **editorInitialized flag**: Prevents auto-save triggers during editor initialization
- **Implementation Details**:
  - Added `editorInitialized = false` to data properties
  - Set `editorInitialized = true` after 1.5s delay in editor's `onCreate` callback
  - Added protection checks in ALL critical methods:
    - `autoSave()` - early return if editor not initialized
    - Both `debouncedUpdateContent()` methods - early return if editor not initialized
    - `debouncedCheckUserIntentAndCreatePersistence()` - checks both flags
    - `onUpdate` callback - checks both flags before calling methods
    - Metadata observer - checks both flags before setting user intent
    - Title change handler - checks both flags before setting user intent
  - Reset both flags in `resetComponentState` and `newDocument`
  - Set `isLoadingDocument = true` at start of document loading methods
  - Reset `isLoadingDocument = false` after successful load
- **Result**: Documents are only persisted when user actually interacts with editor after full initialization, preventing false persistence on page load

### ✅ Document Name Display Consistency Fix
- **Issue Fixed**: Drafts modal showed old document names (e.g., "fresh test 1") instead of updated names
- **Root Cause**: `getDocumentDisplayName()` method used fallback chains (`file.name || file.documentName`) that could show stale data
- **Solution**: Removed fallback chains - collaborative documents now only use `file.documentName`, local files only use `file.name`
- **Pattern Applied**: 
  - `getDocumentDisplayName()` method - single source of truth for document names
  - `displayDocumentName` computed property - consistent logic for current document
  - Delete confirmation dialogs - use `getDocumentDisplayName()` for consistency
  - Debug logging - use `getDocumentDisplayName()` for accurate display
- **Result**: Document names update correctly in all UI locations when changed

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

### ✅ WebSocket Permission Broadcast System - PRODUCTION READY
- **Client-Side**: ✅ Complete - Y.js permission observer processes real-time broadcasts
- **Server-Side**: ✅ Complete - REST API triggers Y.js WebSocket broadcasts via internal API
- **Broadcast API**: ✅ Complete - Dedicated server on port 1235 for permission broadcasts
- **Performance**: ✅ Achieved - 1-2 second real-time permission updates via Y.js sync
- **Integration**: ✅ Complete - All permission endpoints trigger WebSocket broadcasts

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

## Recent Updates (v2025.07.03)
### ✅ BubbleMenu "domFromPos" Error Fix
- **Issue Fixed**: "Cannot read properties of null (reading 'domFromPos')" error in tiptap-collaboration.bundle.js
- **Error Context**: Occurred during coordsAtPos → posToDOMRect → getBoundingClientRect → Floating UI positioning
- **Root Cause**: BubbleMenu's Floating UI tried to calculate positions after editor view was destroyed
- **Timing Issue**: Async computePosition calls continued after component unmount/editor destruction
- **Solutions Implemented**:
  1. Added safety checks in shouldShow: `editor.isDestroyed` and `component.isUnmounting`
  2. Force hide bubble menu DOM element in beforeUnmount lifecycle hook
  3. Increased updateDelay from 100ms to 250ms (TipTap default) to reduce positioning frequency
  4. Added tippyOptions with cleanup handlers for better lifecycle management
- **Prevention**: All format methods already check `bodyEditor.isDestroyed` before execution
- **Result**: Eliminated errors during rapid document switching, permission changes, and component unmounting

### ✅ Table Toolbar Implementation - CSS-Based Positioning
- **Feature Added**: Floating toolbar above tables for table manipulation
- **Initial Approach**: Tried FloatingMenu extension but it positions at cursor, not above table blocks
- **Solution**: CSS-based positioning with DOM selection tracking
- **Implementation Details**:
  1. **State Tracking**: `isInTable` reactive property tracks when cursor is in a table via `editor.isActive('table')`
  2. **onSelectionUpdate Handler**: Updates `isInTable` and always calls `updateTableToolbarPosition()` when in a table
  3. **CSS Visibility**: `.table-toolbar-visible` class controls show/hide with opacity transitions
  4. **Position Calculation**: Uses standard DOM APIs to find the active table element
- **Best Practices Applied**:
  - No ProseMirror internals - avoided `domAtPos` and position calculations
  - Uses TipTap's `.selectedCell` class when cells are selected
  - Falls back to browser's `window.getSelection()` API for cursor position
  - Simple DOM traversal with `element.closest('.ProseMirror table')`
  - Fixed positioning with calculated `left` and `top` values
- **Table-to-Table Navigation Fix**: 
  - Original issue: Toolbar stayed on first table when moving between tables
  - Root cause: Only updated position on state change, but `isActive('table')` stays true
  - Solution: Always update position when in any table, not just on state changes
- **Clean Architecture**:
  - Removed FloatingMenu extension and all related code
  - Single `isInTable` boolean for state tracking
  - Standard DOM methods for element finding
  - CSS handles all animations and transitions
- **Result**: Performant table toolbar that appears above tables and correctly repositions when navigating between tables

### ✅ Table Markdown Export Fix
- **Issue Fixed**: Table content not exporting to markdown, then pipe structure broken
- **Root Cause**: TipTap static renderer passes `children` as either a function getter, array, or string depending on the node type
- **Solution**: Handle all possible types of children parameter:
  ```javascript
  tableRow({ node, children }) {
      // Convert children to array regardless of type
      let cellsArray = [];
      if (Array.isArray(children)) {
          cellsArray = children;
      } else if (typeof children === 'function') {
          // If children is a getter function, call it
          const result = children();
          cellsArray = Array.isArray(result) ? result : [result];
      } else if (children) {
          cellsArray = [children];
      }
      
      // Format cells as markdown table row
      const cells = cellsArray.map(cell => String(cell).trim());
      let rowOutput = '| ' + cells.join(' | ') + ' |\n';
      
      if (isHeaderRow) {
          const separator = Array(cells.length).fill('---').join(' | ');
          rowOutput += '| ' + separator + ' |\n';
      }
      return rowOutput;
  }
  ```
- **Key Insight**: The static renderer uses lazy evaluation with getter functions for performance, so we must check the type and handle accordingly
- **Result**: Tables now export correctly to markdown with proper pipe structure and content

## Recent Updates (v2025.07.02)
### ✅ Markdown Export Extension Synchronization
- **Issue Fixed**: "Unknown node type" errors when exporting markdown (hardBreak, dropcursor, gapcursor)
- **Root Cause**: Extensions used in editor but not included in markdown export
- **Critical Principle**: **ALL extensions used in the editor MUST be included in markdown export**
- **Solution**: 
  - Added HardBreak, Dropcursor, Gapcursor to collaboration bundle
  - Included all StarterKit extensions in markdown export
  - Even extensions without markdown output (cursors) must be included for schema
- **Prevention**: Always synchronize editor and markdown export extensions
- **Documentation**: Added explicit guidance in MARKDOWN_EXPORT_DOCUMENTATION.md

## Development Workflow
1. Check `TIPTAP_OFFLINE_FIRST_BEST_PRACTICES.md` for patterns
2. Follow Y.js transaction patterns with origin tags
3. Test with `npm run lint && npm run typecheck`
4. Use proper cleanup order: observers → editors → providers → Y.js
5. Always handle both Tier 1 and Tier 2 scenarios

---
For comprehensive implementation details, patterns, and best practices, refer to:
**`TIPTAP_OFFLINE_FIRST_BEST_PRACTICES.md`**