// TipTap v3 Collaboration Bundle
// Based on official TipTap v3 documentation: https://next.tiptap.dev/docs/collaboration/getting-started/install

import { HocuspocusProvider } from '@hocuspocus/provider';
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';

// Import all TipTap modules we need
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import Placeholder from '@tiptap/extension-placeholder';

// Additional useful extensions
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Strike from '@tiptap/extension-strike';
import Code from '@tiptap/extension-code';
import Heading from '@tiptap/extension-heading';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Blockquote from '@tiptap/extension-blockquote';
import HorizontalRule from '@tiptap/extension-horizontal-rule';

// Create collaborative document helper
function createCollaborativeDocument() {
  return new Y.Doc();
}

// Export the collaboration bundle with all TipTap components
const TiptapCollaboration = {
  // Core Y.js and provider
  HocuspocusProvider,
  Y,
  IndexeddbPersistence,
  createCollaborativeDocument,
  
  // TipTap core
  Editor,
  StarterKit,
  
  // Collaboration extensions
  Collaboration,
  CollaborationCursor,
  
  // Basic extensions
  Document,
  Paragraph,
  Text,
  Placeholder,
  
  // Formatting extensions
  Bold,
  Italic,
  Strike,
  Code,
  Heading,
  BulletList,
  OrderedList,
  ListItem,
  TaskList,
  TaskItem,
  Blockquote,
  HorizontalRule
};

// Make globally available
if (typeof window !== 'undefined') {
  window.TiptapCollaboration = TiptapCollaboration;
  window.HocuspocusProvider = HocuspocusProvider;
  window.Y = Y;
  
  // Debug logging
  console.log('📦 TiptapCollaboration bundle loaded with extensions:', {
    hasHocuspocusProvider: !!TiptapCollaboration.HocuspocusProvider,
    hasY: !!TiptapCollaboration.Y,
    hasIndexeddbPersistence: !!TiptapCollaboration.IndexeddbPersistence,
    hasEditor: !!TiptapCollaboration.Editor,
    hasStarterKit: !!TiptapCollaboration.StarterKit,
    hasCollaboration: !!TiptapCollaboration.Collaboration,
    hasCollaborationCursor: !!TiptapCollaboration.CollaborationCursor,
    extensionCount: Object.keys(TiptapCollaboration).length
  });
}

export default TiptapCollaboration; 