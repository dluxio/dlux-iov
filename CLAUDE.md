# DLUX IOV - Claude Development Guide

## Project Overview
DLUX IOV is a collaborative document editing platform with TipTap v3, Y.js, and offline-first architecture implementing a two-tier collaboration system.

## Quick Reference
- **Main implementation**: `js/tiptap-editor-modular.js`
- **Architecture guide**: `documentation/TIPTAP_OFFLINE_FIRST_BEST_PRACTICES.md` (comprehensive implementation details)
- **Schema guide**: `documentation/TIPTAP_COLLABORATIVE_SCHEMA.md` (aspirational design) / `documentation/TIPTAP_YIJS_SCHEMA_ACTUAL.md` (actual implementation)
- **Schema enforcement**: `documentation/TIPTAP_SCHEMA_ENFORCEMENT.md` (content restriction system)
- **Markdown export**: `documentation/TIPTAP_MARKDOWN_EXPORT_ARCHITECTURE.md` (export pipeline)
- **API Documentation**: `documentation/Collaboration_editor.md`
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

> **Note**: For the complete Y.js schema implementation, see [`documentation/TIPTAP_YIJS_SCHEMA_ACTUAL.md`](./documentation/TIPTAP_YIJS_SCHEMA_ACTUAL.md).

The editor uses a simplified Y.js structure with:
- **3 Y.js Maps**: `config`, `metadata`, `permissions`
- **1 Y.js XML Fragment**: `body` (managed by TipTap)

## Observer Architecture

### Two-Observer System
The system uses two dedicated Y.js observers for clean separation of concerns:

- **CONFIG OBSERVER**: Document management metadata (documentName, owner, lastModified)
- **METADATA OBSERVER**: Publishing metadata (title, tags, beneficiaries, permlink, comment options, customJson)

For detailed implementation, see [`documentation/TIPTAP_YIJS_SCHEMA_ACTUAL.md`](./documentation/TIPTAP_YIJS_SCHEMA_ACTUAL.md).

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

> **See [`documentation/TIPTAP_SCHEMA_ENFORCEMENT.md`](./documentation/TIPTAP_SCHEMA_ENFORCEMENT.md) for complete documentation.**

The editor uses a registry-based system to control what content can be dropped into specific nodes:

```javascript
const nodeBlockLists = {
  tableCell: ['table', 'horizontalRule'],
  tableHeader: ['table', 'horizontalRule'],
  blockquote: ['table', 'horizontalRule', 'heading', 'codeBlock', 'bulletList', 'orderedList']
};
```

## Video Player System
- **Main Bundle**: `/js/videoPlayer.bundle.js` (763 KB) + `/css/dlux-video-player.css`
- **Vue Integration**: Use `VideoEnhancementMixin` for automatic video enhancement
- **TipTap Integration**: Self-contained DluxVideo extension with global service
- **Universal Architecture**: Global document search handles all contexts (modals, teleported content)
- **Documentation**: [`documentation/DLUX_VIDEO_PLAYER_DOCUMENTATION.md`](./documentation/DLUX_VIDEO_PLAYER_DOCUMENTATION.md)
- **HLS Implementation**: [`documentation/HLS_COMPREHENSIVE_GUIDE.md`](./documentation/HLS_COMPREHENSIVE_GUIDE.md)

## Documentation Index

### Core Documentation
- **Y.js Schema**: [`documentation/TIPTAP_YIJS_SCHEMA_ACTUAL.md`](./documentation/TIPTAP_YIJS_SCHEMA_ACTUAL.md) - Complete Y.js structure
- **Collaboration Architecture**: [`documentation/TIPTAP_COLLABORATIVE_SCHEMA.md`](./documentation/TIPTAP_COLLABORATIVE_SCHEMA.md) - High-level design
- **Best Practices**: [`documentation/TIPTAP_OFFLINE_FIRST_BEST_PRACTICES.md`](./documentation/TIPTAP_OFFLINE_FIRST_BEST_PRACTICES.md) - Implementation patterns
- **Schema Enforcement**: [`documentation/TIPTAP_SCHEMA_ENFORCEMENT.md`](./documentation/TIPTAP_SCHEMA_ENFORCEMENT.md) - Content restrictions
- **Markdown Export**: [`documentation/TIPTAP_MARKDOWN_EXPORT_ARCHITECTURE.md`](./documentation/TIPTAP_MARKDOWN_EXPORT_ARCHITECTURE.md) - Export system
- **API Documentation**: [`documentation/Collaboration_editor.md`](./documentation/Collaboration_editor.md) - Hive API reference

### Feature Documentation
- **SPK Drive Integration**: [`documentation/TIPTAP_SPK_DRIVE_INTEGRATION.md`](./documentation/TIPTAP_SPK_DRIVE_INTEGRATION.md) - Media insertion
- **UI Features**: [`documentation/TIPTAP_FEATURES.md`](./documentation/TIPTAP_FEATURES.md) - BubbleMenu, table toolbar, etc.
- **Troubleshooting**: [`documentation/TIPTAP_TROUBLESHOOTING.md`](./documentation/TIPTAP_TROUBLESHOOTING.md) - Common issues & fixes

### Official TipTap Documentation
- **TipTap v3 Docs**: https://next.tiptap.dev/docs
- **Y.js Docs**: https://docs.yjs.dev/
- **Hocuspocus Server**: https://github.com/ueberdosis/hocuspocus


## Official Documentation Links

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
- **TipTap Bubble Menu Extension**: https://next.tiptap.dev/docs/editor/extensions/functionality/bubble-menu
- **TipTap Text Align**: https://next.tiptap.dev/docs/editor/extensions/functionality/textalign
- **TipTap Subscript**: https://next.tiptap.dev/docs/editor/extensions/marks/subscript
- **TipTap Superscript**: https://next.tiptap.dev/docs/editor/extensions/marks/superscript

### Extension Guidelines
When extending always import standalone extension, do not import from kits like starter kit or table kit
- **TipTap Extend Extension**: https://next.tiptap.dev/docs/editor/extensions/custom-extensions/extend-existing
- **TipTap Table Cell Extension**: https://next.tiptap.dev/docs/editor/extensions/nodes/table-cell
- **TipTap Drop Cursor Extension**: https://next.tiptap.dev/docs/editor/extensions/functionality/dropcursor
- **TipTap Horizontal Rule Extension**: https://next.tiptap.dev/docs/editor/extensions/nodes/horizontal-rule
- **TipTap Image Extension**: https://next.tiptap.dev/docs/editor/extensions/nodes/image
- **TipTap Blockquote Extension**: https://next.tiptap.dev/docs/editor/extensions/nodes/blockquote

**DEPRECATED** - SpkVideo Extends YouTube and is superseded by DluxVideo
- **TipTap YouTube Extension**: https://next.tiptap.dev/docs/editor/extensions/nodes/youtube

### Server Implementation
- **Hocuspocus Server**: https://github.com/ueberdosis/hocuspocus
- **TipTap Provider Integration**: https://next.tiptap.dev/docs/collaboration/provider/integration
- **TipTap Webhooks**: https://next.tiptap.dev/docs/collaboration/core-concepts/webhooks
- **TipTap REST API**: https://next.tiptap.dev/docs/collaboration/documents/rest-api

### TipTap API
- https://next.tiptap.dev/docs/editor/api/editor
- https://next.tiptap.dev/docs/editor/api/commands
- https://next.tiptap.dev/docs/editor/api/commands/content
- https://next.tiptap.dev/docs/editor/api/commands/nodes-and-marks
- https://next.tiptap.dev/docs/editor/api/commands/lists
- https://next.tiptap.dev/docs/editor/api/commands/selection
- https://next.tiptap.dev/docs/editor/api/utilities
- https://next.tiptap.dev/docs/editor/api/node-positions
- https://next.tiptap.dev/docs/editor/api/events

## Common Issues & Solutions

For comprehensive troubleshooting, see [`documentation/TIPTAP_TROUBLESHOOTING.md`](./documentation/TIPTAP_TROUBLESHOOTING.md).

For implementation patterns and best practices, see [`documentation/TIPTAP_OFFLINE_FIRST_BEST_PRACTICES.md`](./documentation/TIPTAP_OFFLINE_FIRST_BEST_PRACTICES.md).

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

## Recent Implementation Highlights

### Critical Security Enhancements
- **Authentication State Management**: Username changes trigger permission re-validation and cache clearing
- **Local Document Security**: Cross-user access prevention for local documents
- **Permission Caching**: Force `no-access` for unauthenticated users without cache fallback

### Key Features
- **WebSocket Permission Broadcasts**: Real-time permission updates (1-2 seconds) via Y.js awareness
- **Two-Tier Collaboration**: Local (Tier 1) and Cloud (Tier 2) document support
- **Modular Drag & Drop**: Registry-based content restrictions for table cells and other nodes
- **Markdown Export**: Full extension synchronization between editor and export
- **BubbleMenu Integration**: Floating formatting toolbar with proper cleanup
- **Table Toolbar**: CSS-based positioning for table manipulation

### Y.js Awareness Compliance
- Standard 15-second heartbeat for 30-second timeout
- Readonly users can send all protocol messages (0-4, 8)
- Proper cleanup on provider destroy and component unmount

## Development Workflow
1. Check `documentation/TIPTAP_OFFLINE_FIRST_BEST_PRACTICES.md` for patterns
2. Follow Y.js transaction patterns with origin tags
3. Test with `npm run lint && npm run typecheck`
4. Use proper cleanup order: observers → editors → providers → Y.js
5. Always handle both Tier 1 and Tier 2 scenarios

---
**For the complete list of documentation files, see the [Documentation Index](#documentation-index) above.**