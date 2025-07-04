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
        
        // Removed filterTransaction - handleDrop handles everything now
        
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
            // Enhanced: Get precise drop position
            const dropPos = view.posAtCoords({
              left: event.clientX,
              top: event.clientY
            });
            
            if (!dropPos) return false;
            
            // Check if we're dropping a table
            let droppingTable = false;
            let tableNode = null;
            
            if (slice && slice.content) {
              slice.content.descendants((node) => {
                if (node.type.name === 'table') {
                  droppingTable = true;
                  tableNode = node;
                  return false;
                }
              });
            }
            
            if (!droppingTable) return false; // Let default handle non-tables
            
            // Enhanced: More accurate position resolution
            const $pos = view.state.doc.resolve(dropPos.pos);
            
            // Check if dropping into a table cell
            for (let d = $pos.depth; d > 0; d--) {
              const node = $pos.node(d);
              if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
                console.log('🚫 Prevented table drop into cell at depth:', d);
                event.preventDefault();
                return true; // Block the drop
              }
            }
            
            // Enhanced: Handle the drop ourselves for better control when moving tables
            if (moved && tableNode) {
              console.log('🎯 Enhanced handleDrop for moved table');
              
              // Get the current selection (where the table is being moved from)
              const { from, to } = view.state.selection;
              
              // Create a new transaction
              const tr = view.state.tr;
              
              // Calculate the target position
              let targetPos = dropPos.pos;
              
              // If dragging downward (target is after source), we need to adjust
              if (targetPos > from) {
                // Adjust target position by the size of content being removed
                targetPos = targetPos - (to - from);
                console.log('📍 Adjusted target position for downward drag:', {
                  original: dropPos.pos,
                  adjusted: targetPos,
                  contentSize: to - from
                });
              }
              
              // Delete from old position
              tr.delete(from, to);
              
              // Insert at new position (already adjusted if needed)
              tr.insert(targetPos, tableNode);
              
              // Dispatch the transaction
              view.dispatch(tr);
              
              console.log('✅ Table moved successfully');
              return true; // We handled it
            }
            
            // For non-moved content (copy/paste), let ProseMirror handle it
            return false;
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


// ✅ CUSTOM DROPCURSOR: Modular solution that hides dropcursor when dragging blocked content over cells
const CustomDropcursor = Dropcursor.extend({
  name: 'customDropcursor',
  
  addProseMirrorPlugins() {
    const dropcursorPlugin = this.parent?.()?.[0];
    if (!dropcursorPlugin) {
      console.warn('⚠️ CustomDropcursor: No parent dropcursor plugin found');
      return [];
    }
    console.log('🔧 CustomDropcursor: Initializing');
    
    // Modular block list - easily expandable in the future
    const BLOCKED_NODE_TYPES = ['table']; // Add more types here as needed
    
    // Plugin that tracks dragging and hides dropcursor for blocked content over cells
    const controlPlugin = new Plugin({
      key: new PluginKey('tableDragControl'),
      
      view(editorView) {
        let draggingNodeType = null; // Track what type of node is being dragged
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
            // Check what type of node we're dragging
            const hoveredNode = window.dluxEditor?.dragHandleHoveredNode;
            
            if (hoveredNode) {
              draggingNodeType = hoveredNode.type.name;
              console.log('🎯 Started dragging:', draggingNodeType);
            } else {
              // Fallback to selection-based detection
              const { state } = editorView;
              const { from } = state.selection;
              const node = state.doc.nodeAt(from);
              
              if (node) {
                draggingNodeType = node.type.name;
              } else {
                // Try to get parent node type
                const $from = state.doc.resolve(from);
                if ($from.parent) {
                  draggingNodeType = $from.parent.type.name;
                }
              }
              
              if (draggingNodeType) {
                console.log('🎯 Started dragging (via selection):', draggingNodeType);
              }
            }
          }
        };
        
        const handleDragOver = (event) => {
          // Only hide dropcursor if dragging a blocked node type
          if (!draggingNodeType || !BLOCKED_NODE_TYPES.includes(draggingNodeType)) {
            // Not dragging a blocked type - ensure dropcursor is visible
            if (styleElement) {
              removeStyleElement();
              editorView.dom.classList.remove('table-drag-over-cell');
            }
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
                console.log(`🚫 Hiding dropcursor - dragging ${draggingNodeType} over table cell`);
                createStyleElement();
              }
              // Add class to change cursor
              editorView.dom.classList.add('table-drag-over-cell');
            } else {
              if (styleElement) {
                console.log(`✅ Showing dropcursor - dragging ${draggingNodeType} outside table cell`);
                removeStyleElement();
              }
              // Remove class to restore normal cursor
              editorView.dom.classList.remove('table-drag-over-cell');
            }
          }
        };
        
        const handleDragEnd = () => {
          if (draggingNodeType) {
            console.log('🧹 Drag ended for:', draggingNodeType);
            draggingNodeType = null;
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