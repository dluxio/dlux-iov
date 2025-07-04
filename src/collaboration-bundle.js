// TipTap v3 Collaboration Bundle
// Based on official TipTap v3 documentation: https://next.tiptap.dev/docs/collaboration/getting-started/install

import { HocuspocusProvider } from '@hocuspocus/provider';
import { WebrtcProvider } from 'y-webrtc';
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';

// Import all TipTap modules we need
import { Editor, Extension } from '@tiptap/core';
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

// Table extensions for markdown-compatible tables
import { TableKit } from '@tiptap/extension-table/kit';
import TableCell from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table/header';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { DecorationSet } from '@tiptap/pm/view';

// UI extensions for floating toolbars
import BubbleMenu from '@tiptap/extension-bubble-menu';

// Drag handle extensions for node reordering
import DragHandle from '@tiptap/extension-drag-handle';
import DragHandleVue from '@tiptap/extension-drag-handle-vue-3';

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



// ✅ TIPTAP BEST PRACTICE: Extend existing TableCell following official pattern
// https://next.tiptap.dev/docs/editor/extensions/custom-extensions/extend-existing
const CustomTableCell = TableCell.extend({
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('preventNestedTables'),
        
        filterTransaction: (transaction, state) => {
          try {
            // ✅ SAFETY: Ensure we have valid state
            if (!transaction || !state || !state.doc) {
              return true;
            }
            
            const { doc } = state;
            
            // Log all steps to understand transaction structure
            console.log('🔄 Transaction with', transaction.steps.length, 'steps:', {
              steps: transaction.steps.map((step, i) => ({
                index: i,
                type: step.constructor.name,
                from: step.from,
                to: step.to,
                hasSlice: !!step.slice,
                sliceSize: step.slice?.size || 0,
                sliceContent: step.slice?.content?.firstChild?.type?.name
              }))
            });
            
            // Check each step in the transaction
            for (let i = 0; i < transaction.steps.length; i++) {
              const step = transaction.steps[i];
              // Check if this step contains a table
              let movingTable = false;
              let targetPos = null;
              
              if (step.slice && step.slice.content) {
                // Check if the slice contains a table
                step.slice.content.descendants((node) => {
                  if (node && node.type && node.type.name === 'table') {
                    movingTable = true;
                    return false;
                  }
                });
                
                // Get the target position
                if (movingTable) {
                  // For drag operations, we need to find the INSERT step
                  // The INSERT step has content (slice.size > 0)
                  // The DELETE step has no content in its slice
                  
                  if (step.slice.size === 0) {
                    // This is likely a delete step, skip it
                    console.log('📤 Skipping empty slice step (likely delete)');
                    continue;
                  }
                  
                  // This should be the insert step
                  targetPos = step.from;
                  console.log('📍 Table INSERT detected:', {
                    from: step.from,
                    to: step.to,
                    targetPos,
                    stepType: step.constructor.name,
                    sliceSize: step.slice.size,
                    stepIndex: i,
                    totalSteps: transaction.steps.length
                  });
                }
              }
              
              // If we're moving a table, check if target is inside a table cell
              if (movingTable && targetPos !== null) {
                const $target = doc.resolve(targetPos);
                
                console.log('🔍 Checking table drop position:', {
                  targetPos,
                  depth: $target.depth,
                  parentNode: $target.parent.type.name,
                  nodes: Array.from({ length: $target.depth + 1 }, (_, i) => ({
                    depth: i,
                    node: $target.node(i).type.name
                  }))
                });
                
                // Check if target position is inside a table cell or header
                for (let depth = $target.depth; depth > 0; depth--) {
                  const node = $target.node(depth);
                  if (node && node.type && (node.type.name === 'tableCell' || node.type.name === 'tableHeader')) {
                    console.log('🚫 Prevented dropping table into table cell/header at depth:', depth);
                    return false; // Block this transaction
                  }
                }
                
                console.log('✅ Table drop allowed - not inside a cell');
              }
            }
            
            return true; // Allow transaction
          } catch (error) {
            console.warn('⚠️ Error in nested table prevention plugin:', error);
            return true; // ✅ GRACEFUL DEGRADATION: Allow transaction on error to prevent editor breaking
          }
        },
        
        // Also prevent drop cursor and actual drop operation
        props: {
          handleDragOver(view, event) {
            // Check if we're dragging something that might contain a table
            const dataTransfer = event.dataTransfer;
            if (!dataTransfer) return false;
            
            // Check if the drag data contains table-related info
            // TipTap sets a custom mime type for prosemirror content
            const types = Array.from(dataTransfer.types);
            const hasProseMirrorData = types.some(type => 
              type.includes('application/x-pm') || 
              type.includes('text/html')
            );
            
            if (hasProseMirrorData) {
              // Check if cursor is over a table cell or header
              const pos = view.posAtCoords({ left: event.clientX, top: event.clientY });
              if (pos) {
                const $pos = view.state.doc.resolve(pos.pos);
                for (let d = $pos.depth; d > 0; d--) {
                  const node = $pos.node(d);
                  if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
                    // Check if we're dragging a table - first check hoveredNode, then fallback to selection
                    const hoveredNode = window.dluxEditor?.dragHandleHoveredNode;
                    let isDraggingTable = false;
                    
                    if (hoveredNode && hoveredNode.type.name === 'table') {
                      isDraggingTable = true;
                    } else {
                      // Fallback to selection-based detection
                      const draggedNode = view.state.doc.nodeAt(view.state.selection.from);
                      if (draggedNode && draggedNode.type.name === 'table') {
                        isDraggingTable = true;
                      }
                    }
                    
                    if (isDraggingTable) {
                      // Prevent drop cursor from showing
                      event.dataTransfer.dropEffect = 'none';
                      event.preventDefault();
                      return true;
                    }
                  }
                }
              }
            }
            
            return false;
          },
          
          handleDrop(view, event, slice, moved) {
            // Check if we're dropping a table
            let hasTable = false;
            if (slice && slice.content) {
              slice.content.descendants((node) => {
                if (node.type.name === 'table') {
                  hasTable = true;
                  return false;
                }
              });
            }
            
            if (hasTable) {
              // Check if drop position is in a table cell or header
              const pos = view.posAtCoords({ left: event.clientX, top: event.clientY });
              if (pos) {
                const $pos = view.state.doc.resolve(pos.pos);
                
                // Debug: log what position we got and full hierarchy
                const hierarchy = [];
                for (let d = 0; d <= $pos.depth; d++) {
                  hierarchy.push({
                    depth: d,
                    type: $pos.node(d).type.name
                  });
                }
                
                console.log('🎯 handleDrop checking position:', {
                  pos: pos.pos,
                  coords: { x: event.clientX, y: event.clientY },
                  parentType: $pos.parent.type.name,
                  depth: $pos.depth
                });
                console.log('📊 Document hierarchy at drop position:', hierarchy);
                
                for (let d = $pos.depth; d > 0; d--) {
                  const node = $pos.node(d);
                  if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
                    // Prevent the drop
                    console.log('🚫 Prevented table drop via handleDrop at depth:', d);
                    event.preventDefault();
                    return true; // Handled - prevents drop
                  }
                }
              }
            }
            
            return false; // Not handled, continue with default
          }
        }
      })
    ];
  }
});

// ✅ TIPTAP BEST PRACTICE: Also extend TableHeader to prevent dropcursor
const CustomTableHeader = TableHeader.extend({
  // Keep as minimal extension for now
});


// ✅ CUSTOM DROPCURSOR: Simple solution that hides dropcursor when dragging tables over cells
const CustomDropcursor = Dropcursor.extend({
  name: 'customDropcursor',
  
  addProseMirrorPlugins() {
    const dropcursorPlugin = this.parent?.()?.[0];
    if (!dropcursorPlugin) {
      console.warn('⚠️ CustomDropcursor: No parent dropcursor plugin found');
      return [];
    }
    console.log('🔧 CustomDropcursor: Initializing');
    
    // Simple plugin that tracks table dragging and hides dropcursor over cells
    const controlPlugin = new Plugin({
      key: new PluginKey('tableDragControl'),
      
      view(editorView) {
        let isDraggingTable = false;
        let styleElement = null;
        
        // Create a style element to control dropcursor visibility
        const createStyleElement = () => {
          styleElement = document.createElement('style');
          // More aggressive CSS to override inline styles and set cursor
          styleElement.textContent = `
            .ProseMirror-dropcursor,
            .prosemirror-dropcursor-block,
            .prosemirror-dropcursor-inline {
              display: none !important;
              visibility: hidden !important;
              opacity: 0 !important;
              width: 0 !important;
              height: 0 !important;
              background-color: transparent !important;
            }
            /* Change cursor to not-allowed when dragging table over cells */
            .ProseMirror.table-drag-over-cell,
            .ProseMirror.table-drag-over-cell * {
              cursor: not-allowed !important;
            }
          `;
          document.head.appendChild(styleElement);
          console.log('💉 Injected hide-dropcursor CSS');
          
          // Also use MutationObserver to catch dynamically created dropcursors
          const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
              mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1 && node.classList && 
                    (node.classList.contains('ProseMirror-dropcursor') ||
                     node.classList.contains('prosemirror-dropcursor-block') ||
                     node.classList.contains('prosemirror-dropcursor-inline'))) {
                  // Force hide it with inline styles
                  node.style.display = 'none';
                  node.style.visibility = 'hidden';
                  node.style.opacity = '0';
                  console.log('🎯 Force-hid dropcursor element via MutationObserver');
                }
              });
            });
          });
          
          // Start observing the editor DOM
          observer.observe(editorView.dom.offsetParent || document.body, {
            childList: true,
            subtree: true
          });
          
          // Store observer for cleanup
          styleElement._observer = observer;
        };
        
        const removeStyleElement = () => {
          if (styleElement) {
            // Stop the MutationObserver
            if (styleElement._observer) {
              styleElement._observer.disconnect();
            }
            styleElement.remove();
            styleElement = null;
            console.log('🗑️ Removed hide-dropcursor CSS and observer');
          }
        };
        
        // Listen for drag events at document level (drag handles are outside editor)
        const handleDragStart = (event) => {
          if (event.target.hasAttribute?.('data-drag-handle')) {
            // Check if we're dragging a table by looking at the component's tracked node
            const hoveredNode = window.dluxEditor?.dragHandleHoveredNode;
            
            if (hoveredNode && hoveredNode.type.name === 'table') {
              isDraggingTable = true;
              console.log('🎯 Started dragging table (detected via hoveredNode)');
            } else {
              // Fallback to selection-based detection for backward compatibility
              const { state } = editorView;
              const { from } = state.selection;
              const $from = state.doc.resolve(from);
              
              // Check if we're inside a table
              for (let depth = $from.depth; depth >= 0; depth--) {
                const parent = $from.node(depth);
                if (parent.type.name === 'table') {
                  isDraggingTable = true;
                  console.log('🎯 Started dragging table (detected via selection)');
                  break;
                }
              }
            }
          }
        };
        
        const handleDragOver = (event) => {
          if (!isDraggingTable) {
            return;
          }
          
          // Check if over a table cell using the actual position
          const pos = editorView.posAtCoords({ left: event.clientX, top: event.clientY });
          
          if (pos) {
            const $pos = editorView.state.doc.resolve(pos.pos);
            let isOverTableCell = false;
            
            for (let d = $pos.depth; d > 0; d--) {
              const node = $pos.node(d);
              if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
                isOverTableCell = true;
                break;
              }
            }
            
            if (isOverTableCell) {
              if (!styleElement) {
                console.log('🚫 Hiding dropcursor over table cell');
                createStyleElement();
              }
              // Add class to change cursor
              editorView.dom.classList.add('table-drag-over-cell');
            } else {
              if (styleElement) {
                console.log('✅ Showing dropcursor outside table cell');
                removeStyleElement();
              }
              // Remove class to restore normal cursor
              editorView.dom.classList.remove('table-drag-over-cell');
            }
          }
        };
        
        const handleDragEnd = () => {
          if (isDraggingTable) {
            console.log('🧹 Drag ended');
            isDraggingTable = false;
            removeStyleElement();
            // Clean up cursor class
            editorView.dom.classList.remove('table-drag-over-cell');
          }
        };
        
        document.addEventListener('dragstart', handleDragStart, true);
        document.addEventListener('dragover', handleDragOver, true);
        document.addEventListener('dragend', handleDragEnd, true);
        
        return {
          destroy() {
            document.removeEventListener('dragstart', handleDragStart, true);
            document.removeEventListener('dragover', handleDragOver, true);
            document.removeEventListener('dragend', handleDragEnd, true);
            removeStyleElement();
          }
        };
      }
    });
    
    return [controlPlugin, dropcursorPlugin];
  }
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
  Extension,
  EditorContent,
  useEditor,
  VueRenderer,
  StarterKit,
  
  // Collaboration extensions
  Collaboration,
  CollaborationCaret,
  
  // UI extensions
  BubbleMenu,
  
  // Drag handle extensions
  DragHandle,
  DragHandleVue,
  
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
  CustomDropcursor,
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
  
  // Table extensions
  TableKit,
  CustomTableCell,
  CustomTableHeader,
  
  // ProseMirror utilities
  Plugin,
  PluginKey,
  DecorationSet,
  
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