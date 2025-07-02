// TipTap v3 Collaboration Bundle
// Based on official TipTap v3 documentation: https://next.tiptap.dev/docs/collaboration/getting-started/install

import { HocuspocusProvider } from '@hocuspocus/provider';
import { WebrtcProvider } from 'y-webrtc';
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';

// Import all TipTap modules we need
import { Editor } from '@tiptap/core';
import { EditorContent, useEditor, VueRenderer } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCaret from '@tiptap/extension-collaboration-caret';

// Import from consolidated extensions package
import { 
  Placeholder,
  CharacterCount,
  Dropcursor,
  Gapcursor
} from '@tiptap/extensions';

// Typography and Mention are separate packages in v3
import Typography from '@tiptap/extension-typography';
import Mention from '@tiptap/extension-mention';
import suggestion from '@tiptap/suggestion';

// BubbleMenu extension for floating formatting toolbar
import BubbleMenu from '@tiptap/extension-bubble-menu';

// Static renderer for markdown/HTML conversion
import { renderToMarkdown } from '@tiptap/static-renderer/pm/markdown';
import { renderToHTMLString } from '@tiptap/static-renderer/pm/html-string';

// Tippy.js for tooltips and dropdowns
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';

// These may still be individual packages
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
import HardBreak from '@tiptap/extension-hard-break';
// History extension removed - not compatible with Collaboration extension
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import CodeBlock from '@tiptap/extension-code-block';

// Additional formatting extensions
import Highlight from '@tiptap/extension-highlight';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { TextStyle } from '@tiptap/extension-text-style'; // Named export in v3
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Youtube from '@tiptap/extension-youtube';

// Create custom SpkVideo extension by extending Youtube
const SpkVideo = Youtube.extend({
  name: 'video',
  
  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: element => {
          // Check for original src first (for blob URL recovery)
          const originalSrc = element.getAttribute('data-original-src');
          if (originalSrc) {
            return originalSrc;
          }
          // Check if current src is a blob URL and we have type information
          const currentSrc = element.getAttribute('src');
          if (currentSrc && currentSrc.startsWith('blob:') && 
              (element.getAttribute('type') === 'application/x-mpegURL' || 
               element.getAttribute('data-type') === 'm3u8')) {
            // This is likely an HLS video with a blob URL, but we lost the original
            console.warn('Found HLS video with blob URL but no original src preserved');
          }
          return currentSrc;
        },
        renderHTML: attributes => {
          if (!attributes.src) return {};
          return { src: attributes.src };
        }
      },
      controls: {
        default: true,
        parseHTML: element => element.hasAttribute('controls'),
        renderHTML: attributes => {
          if (attributes.controls) {
            return { controls: 'controls' };
          }
          return {};
        }
      },
      width: {
        default: '100%',
        parseHTML: element => element.getAttribute('width') || '100%',
        renderHTML: attributes => {
          return { width: attributes.width || '100%' };
        }
      },
      height: {
        default: 'auto',
        parseHTML: element => element.getAttribute('height') || 'auto',
        renderHTML: attributes => {
          return { height: attributes.height || 'auto' };
        }
      },
      type: {
        default: null,
        parseHTML: element => element.getAttribute('type'),
        renderHTML: attributes => {
          if (!attributes.type) return {};
          return { type: attributes.type };
        }
      },
      crossorigin: {
        default: 'anonymous',
        parseHTML: element => element.getAttribute('crossorigin') || 'anonymous',
        renderHTML: attributes => {
          if (attributes.crossorigin) {
            return { crossorigin: attributes.crossorigin };
          }
          return {};
        }
      },
      'data-type': {
        default: null,
        parseHTML: element => element.getAttribute('data-type'),
        renderHTML: attributes => {
          if (!attributes['data-type']) return {};
          return { 'data-type': attributes['data-type'] };
        }
      },
      'data-mime-type': {
        default: null,
        parseHTML: element => element.getAttribute('data-mime-type'),
        renderHTML: attributes => {
          if (!attributes['data-mime-type']) return {};
          return { 'data-mime-type': attributes['data-mime-type'] };
        }
      },
      'data-original-src': {
        default: null,
        parseHTML: element => element.getAttribute('data-original-src'),
        renderHTML: attributes => {
          // Always preserve original src if we have it
          if (attributes.src && !attributes.src.startsWith('blob:')) {
            return { 'data-original-src': attributes.src };
          }
          // Keep existing data-original-src if present
          if (attributes['data-original-src']) {
            return { 'data-original-src': attributes['data-original-src'] };
          }
          return {};
        }
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'video[src]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    // Create a clean copy of attributes to avoid mutation issues
    const attrs = { ...HTMLAttributes };
    
    // Ensure controls attribute is properly formatted
    if (attrs.controls === true || attrs.controls === 'true') {
      attrs.controls = 'controls';
    } else if (attrs.controls === false || attrs.controls === 'false') {
      delete attrs.controls;
    }
    
    // Apply defaults if not explicitly set
    if (!attrs.width) attrs.width = '100%';
    if (!attrs.height) attrs.height = 'auto';
    if (!attrs.crossorigin && attrs.src && attrs.src.includes('ipfs')) {
      attrs.crossorigin = 'anonymous';
    }
    
    return ['video', attrs]
  },

  addCommands() {
    return {
      setVideo: (options) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        })
      },
    }
  },
});

// Create collaborative document helper
function createCollaborativeDocument() {
  return new Y.Doc();
}

// Export the collaboration bundle with all TipTap components
const TiptapCollaboration = {
  // Core Y.js and provider
  HocuspocusProvider,
  WebrtcProvider,
  Y,
  IndexeddbPersistence,
  createCollaborativeDocument,
  
  // TipTap core
  Editor,
  EditorContent,
  useEditor,
  VueRenderer,
  StarterKit,
  
  // Collaboration extensions
  Collaboration,
  CollaborationCaret,
  
  // UI extensions
  BubbleMenu,
  
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
  HorizontalRule,
  HardBreak,
  
  // Additional extensions
  // History, // Removed - not compatible with Collaboration extension
  Link,
  Image,
  CodeBlock,
  Dropcursor,
  Gapcursor,
  CharacterCount,
  Typography,
  Mention,
  
  // Formatting extensions
  Highlight,
  Subscript,
  Superscript,
  TextStyle,
  Underline,
  TextAlign,
  
  // Media extensions
  Youtube,
  SpkVideo,
  
  // Static renderer utilities
  renderToMarkdown,
  renderToHTMLString,
  
  // Tippy.js for tooltips/dropdowns
  tippy,
  
  // Suggestion utility for mentions
  suggestion
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
    hasCollaborationCaret: !!TiptapCollaboration.CollaborationCaret,
    hasBubbleMenu: !!TiptapCollaboration.BubbleMenu,
    extensionCount: Object.keys(TiptapCollaboration).length
  });
}

export default TiptapCollaboration; 