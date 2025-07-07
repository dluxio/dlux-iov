// TipTap v3 Collaboration Bundle
// Based on official TipTap v3 documentation: https://next.tiptap.dev/docs/collaboration/getting-started/install

// Debug flag - set to true for development debugging
const DEBUG = false;

import { HocuspocusProvider } from '@hocuspocus/provider';
import { WebrtcProvider } from 'y-webrtc';
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';

// Import all TipTap modules we need
import { Editor, Extension, Node } from '@tiptap/core';
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
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { DecorationSet } from '@tiptap/pm/view';

// UI extensions for floating toolbars
import BubbleMenu from '@tiptap/extension-bubble-menu';
import FloatingMenu from '@tiptap/extension-floating-menu';

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

// ✅ CUSTOM IMAGE EXTENSION: Handle drag behavior to prevent duplication
const CustomImage = Image.extend({
  name: 'image', // Keep the same name to replace default Image
  
  addOptions() {
    return {
      ...this.parent?.(),
      onImageClick: null, // Callback passed from Vue component
    }
  },
  
  addCommands() {
    return {
      ...this.parent?.(),
      editImage: (pos, attrs) => ({ editor }) => {
        // Call the configured callback if available
        if (this.options.onImageClick) {
          this.options.onImageClick(pos, attrs);
        }
        return true;
      },
    }
  },
  
  addNodeView() {
    const extension = this;
    
    return ({ node, getPos, editor }) => {
      // Use a mutable reference to track the current node
      let currentNode = node;
      
      // Create wrapper div
      const dom = document.createElement('div');
      dom.style.display = 'inline-block';
      dom.style.position = 'relative';
      dom.style.maxWidth = '100%';
      
      // Create the image element
      const img = document.createElement('img');
      img.src = node.attrs.src;
      img.alt = node.attrs.alt || '';
      img.title = node.attrs.title || '';
      img.className = node.attrs.class || 'content-image';
      img.style.cursor = 'pointer'; // Show it's clickable
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      
      // Define click handler for proper cleanup
      const handleClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Get the position
        if (typeof getPos === 'function') {
          const pos = getPos();
          // Use TipTap command system with current node's attributes
          editor.commands.editImage(pos, currentNode.attrs);
        }
      };
      
      // Add click handler
      img.addEventListener('click', handleClick);
      
      dom.appendChild(img);
      
      return {
        dom,
        update(updatedNode) {
          // Update image when node changes
          if (updatedNode.type !== node.type) {
            return false;
          }
          // Update the current node reference
          currentNode = updatedNode;
          // Update DOM
          img.src = updatedNode.attrs.src;
          img.alt = updatedNode.attrs.alt || '';
          img.title = updatedNode.attrs.title || '';
          return true;
        },
        destroy() {
          // Clean up event listener to prevent memory leaks
          img.removeEventListener('click', handleClick);
        }
      };
    };
  },
  
  addProseMirrorPlugins() {
    const plugins = this.parent?.() || [];
    
    return [
      ...plugins,
      new Plugin({
        key: new PluginKey('customImageDrag'),
        props: {
          handleDOMEvents: {
            dragstart(view, event) {
              // Only handle image drag events
              if (event.target.tagName !== 'IMG') return false;
              
              // Force move operation instead of copy
              event.dataTransfer.effectAllowed = 'move';
              
              // Create thumbnail for drag preview
              const img = event.target;
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              
              // Set thumbnail size
              const maxSize = 100;
              const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
              canvas.width = img.width * scale;
              canvas.height = img.height * scale;
              
              // Draw scaled image
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              
              // Add border
              ctx.strokeStyle = '#5C94FE';
              ctx.lineWidth = 2;
              ctx.strokeRect(0, 0, canvas.width, canvas.height);
              
              // Set the drag image
              event.dataTransfer.setDragImage(canvas, canvas.width / 2, canvas.height / 2);
              
              // Find the position of the image being dragged
              const pos = view.posAtDOM(event.target, 0);
              if (pos >= 0) {
                // Store position data for later
                window.dluxEditor = window.dluxEditor || {};
                window.dluxEditor.draggingImagePos = pos;
                
                // Add visual feedback
                event.target.style.opacity = '0.5';
              }
              
              return false; // Let ProseMirror continue handling
            },
            
            dragover(view, event) {
              // Force move cursor feedback
              if (event.dataTransfer && event.dataTransfer.types.includes('text/html')) {
                event.dataTransfer.dropEffect = 'move';
              }
              return false;
            },
            
            dragend(view, event) {
              // Reset opacity
              if (event.target.tagName === 'IMG') {
                event.target.style.opacity = '';
              }
              
              // Clean up stored position
              if (window.dluxEditor) {
                delete window.dluxEditor.draggingImagePos;
              }
              
              return false;
            },
            
            drop(view, event) {
              // Check if we're dropping an image that was dragged from within the editor
              if (window.dluxEditor?.draggingImagePos !== undefined) {
                const pos = window.dluxEditor.draggingImagePos;
                
                // Get drop position
                const dropPos = view.posAtCoords({
                  left: event.clientX,
                  top: event.clientY
                });
                
                if (dropPos && dropPos.pos !== pos) {
                  // We're moving an image within the editor
                  event.preventDefault();
                  
                  // Get the image node
                  const $pos = view.state.doc.resolve(pos);
                  const node = view.state.doc.nodeAt(pos);
                  
                  if (node && node.type.name === 'image') {
                    // Create transaction to move the image
                    const tr = view.state.tr;
                    
                    // Calculate adjusted positions
                    let targetPos = dropPos.pos;
                    if (targetPos > pos) {
                      // Adjust for the node being removed
                      targetPos = targetPos - node.nodeSize;
                    }
                    
                    // Delete from old position
                    tr.delete(pos, pos + node.nodeSize);
                    
                    // Insert at new position
                    tr.insert(targetPos, node);
                    
                    // Dispatch the transaction
                    view.dispatch(tr);
                    
                    // Clean up
                    delete window.dluxEditor.draggingImagePos;
                    
                    return true; // We handled it
                  }
                }
              }
              
              return false; // Let default handling continue
            }
          }
        }
      })
    ];
  }
});

// ✅ CUSTOM HORIZONTAL RULE: Make horizontal rules draggable with wrapper div
const CustomHorizontalRule = HorizontalRule.extend({
  name: 'horizontalRule', // Keep same name to replace default
  atom: true,        // Mark as atomic node (no content inside)
  draggable: true,   // Make draggable
  selectable: true,  // Ensure it can be selected
  
  // Render with wrapper div for better positioning
  renderHTML({ HTMLAttributes }) {
    return ['div', { class: 'hr-wrapper' }, 
      ['hr', HTMLAttributes]
    ]
  },
  
  // Handle both wrapped and unwrapped HR elements
  parseDOM() {
    return [
      {
        tag: 'div.hr-wrapper',
        getContent: (node, schema) => {
          // Return empty fragment since HR is an atom node
          return schema.nodeFromJSON({ type: 'horizontalRule' }).content;
        }
      },
      {
        tag: 'hr'
      }
    ]
  }
});

// ✅ MODULAR BLOCK LIST SYSTEM: Registry for node block lists
const nodeBlockLists = {
  tableCell: ['table'],
  tableHeader: ['table']
};

// ✅ MODULAR BLOCK LIST SYSTEM: Utility function to check if content is blocked
// This allows any node to declare what content it blocks
function isContentBlockedAt(state, pos, contentType) {
  const $pos = state.doc.resolve(pos);
  
  // Check each ancestor node for block lists
  for (let d = $pos.depth; d > 0; d--) {
    const node = $pos.node(d);
    const nodeType = node.type;
    
    // Get blocked content from the registry
    const blockedContent = nodeBlockLists[nodeType.name] || [];
    
    if (blockedContent.includes(contentType)) {
      return {
        blocked: true,
        byNode: nodeType.name,
        atDepth: d,
        blockedContent: blockedContent
      };
    }
  }
  
  return { blocked: false };
}

// ✅ CUSTOM VIDEO EXTENSION: DluxVideo for native video elements with Video.js support
const DluxVideo = Node.create({
  name: 'dluxvideo',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: element => element.getAttribute('src'),
        renderHTML: attributes => {
          if (!attributes.src) return {};
          return { src: attributes.src };
        }
      },
      poster: {
        default: null,
        parseHTML: element => element.getAttribute('poster'),
        renderHTML: attributes => {
          if (!attributes.poster) return {};
          return { poster: attributes.poster };
        }
      },
      width: {
        default: '100%',
        parseHTML: element => element.getAttribute('width') || '100%',
        renderHTML: attributes => ({ width: attributes.width || '100%' })
      },
      height: {
        default: 'auto',
        parseHTML: element => element.getAttribute('height') || 'auto',
        renderHTML: attributes => ({ height: attributes.height || 'auto' })
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
      autoplay: {
        default: false,
        parseHTML: element => element.hasAttribute('autoplay'),
        renderHTML: attributes => {
          if (attributes.autoplay) {
            return { autoplay: 'autoplay' };
          }
          return {};
        }
      },
      loop: {
        default: false,
        parseHTML: element => element.hasAttribute('loop'),
        renderHTML: attributes => {
          if (attributes.loop) {
            return { loop: 'loop' };
          }
          return {};
        }
      },
      muted: {
        default: false,
        parseHTML: element => element.hasAttribute('muted'),
        renderHTML: attributes => {
          if (attributes.muted) {
            return { muted: 'muted' };
          }
          return {};
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
      crossorigin: {
        default: 'anonymous',
        parseHTML: element => element.getAttribute('crossorigin') || 'anonymous',
        renderHTML: attributes => {
          if (attributes.crossorigin) {
            return { crossorigin: attributes.crossorigin };
          }
          return {};
        }
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'video[src]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    // Clean up attributes
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
    
    return ['video', attrs];
  },

  addCommands() {
    return {
      setDluxVideo: (options) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        });
      },
    };
  },

  addNodeView() {
    return ({ node, editor }) => {
      // Create wrapper container
      const wrapper = document.createElement('div');
      wrapper.className = 'dlux-video-container';
      wrapper.style.position = 'relative';
      wrapper.style.marginBottom = '1rem';
      wrapper.style.width = '100%';
      
      // Create video element for Video.js
      const video = document.createElement('video');
      video.className = 'video-js vjs-default-skin vjs-big-play-centered vjs-fluid';
      
      wrapper.appendChild(video);
      
      // Initialize player after a short delay to ensure DOM is ready
      let player = null;
      
      const initializePlayer = () => {
        // Check if DluxVideoPlayer is available
        if (!window.DluxVideoPlayer) {
          console.error('DluxVideoPlayer not available. Make sure video-player-bundle.js is loaded.');
          return;
        }
        
        // Initialize using the global DluxVideoPlayer service
        player = window.DluxVideoPlayer.initializePlayer(video, {
          src: node.attrs.src,
          type: node.attrs.type || (node.attrs.src.includes('.m3u8') ? 'application/x-mpegURL' : 'video/mp4'),
          poster: node.attrs.poster,
          autoplay: node.attrs.autoplay,
          loop: node.attrs.loop,
          muted: node.attrs.muted
        });
        
        // Store player reference on wrapper for cleanup
        wrapper._dluxVideoPlayer = player;
      };
      
      // Use setTimeout to ensure DOM is ready and DluxVideoPlayer is loaded
      setTimeout(initializePlayer, 100);
      
      return {
        dom: wrapper,
        contentDOM: null,
        
        update(updatedNode) {
          // Check if it's still a video node
          if (updatedNode.type !== node.type) {
            return false;
          }
          
          // Update source if changed
          if (player && updatedNode.attrs.src !== node.attrs.src) {
            const sourceType = updatedNode.attrs.type || (updatedNode.attrs.src.includes('.m3u8') ? 'application/x-mpegURL' : 'video/mp4');
            player.src({
              src: updatedNode.attrs.src,
              type: sourceType
            });
          }
          
          node = updatedNode;
          return true;
        },
        
        destroy() {
          // Clean up using DluxVideoPlayer service
          if (wrapper._dluxVideoPlayer && window.DluxVideoPlayer) {
            window.DluxVideoPlayer.destroyPlayer(video);
            wrapper._dluxVideoPlayer = null;
          }
        }
      };
    };
  },

  addProseMirrorPlugins() {
    const plugins = this.parent?.() || [];
    
    return [
      ...plugins,
      new Plugin({
        key: new PluginKey('dluxVideoDrag'),
        props: {
          handleDOMEvents: {
            dragstart(view, event) {
              // Handle video drag events - check both VIDEO tag and wrapper div
              let targetElement = event.target;
              let videoElement = null;
              
              if (targetElement.tagName === 'VIDEO') {
                videoElement = targetElement;
              } else if (targetElement.classList.contains('dlux-video-container')) {
                // Find video element inside wrapper
                videoElement = targetElement.querySelector('video');
              } else {
                return false; // Not a video drag
              }
              
              // Force move operation instead of copy
              event.dataTransfer.effectAllowed = 'move';
              
              // Find the position and node
              const pos = view.posAtDOM(targetElement, 0);
              if (pos >= 0) {
                // Get the node to access poster attribute
                const node = view.state.doc.nodeAt(pos);
                
                // Create thumbnail for drag preview
                let dragImage;
                
                if (node && node.attrs.poster) {
                  // Use poster image
                  dragImage = document.createElement('img');
                  dragImage.src = node.attrs.poster;
                  dragImage.style.width = '100px';
                  dragImage.style.height = 'auto';
                  dragImage.style.maxHeight = '100px';
                  dragImage.style.objectFit = 'cover';
                  dragImage.style.border = '2px solid #5C94FE';
                  dragImage.style.borderRadius = '4px';
                  dragImage.style.position = 'absolute';
                  dragImage.style.top = '-1000px'; // Hide off-screen
                  document.body.appendChild(dragImage);
                  
                  // Clean up after drag
                  const cleanup = () => {
                    dragImage.remove();
                    document.removeEventListener('dragend', cleanup);
                  };
                  document.addEventListener('dragend', cleanup);
                  
                } else {
                  // Fallback to simple video thumbnail
                  dragImage = document.createElement('div');
                  dragImage.style.width = '100px';
                  dragImage.style.height = '75px';
                  dragImage.style.backgroundColor = '#2a2a2a';
                  dragImage.style.border = '2px solid #5C94FE';
                  dragImage.style.borderRadius = '4px';
                  dragImage.style.display = 'flex';
                  dragImage.style.alignItems = 'center';
                  dragImage.style.justifyContent = 'center';
                  dragImage.style.position = 'absolute';
                  dragImage.style.top = '-1000px'; // Hide off-screen
                  dragImage.innerHTML = '<span style="color: #fff; font-size: 30px;">▶</span>';
                  document.body.appendChild(dragImage);
                  
                  // Clean up after drag
                  const cleanup = () => {
                    dragImage.remove();
                    document.removeEventListener('dragend', cleanup);
                  };
                  document.addEventListener('dragend', cleanup);
                }
                
                // Set the drag image
                event.dataTransfer.setDragImage(dragImage, 50, 37);
                
                // Store position data for later
                window.dluxEditor = window.dluxEditor || {};
                window.dluxEditor.draggingVideoPos = pos;
                
                // Add visual feedback to original element
                if (targetElement.classList.contains('dlux-video-container')) {
                  targetElement.style.opacity = '0.5';
                } else if (videoElement) {
                  videoElement.style.opacity = '0.5';
                }
              }
              
              return false; // Let ProseMirror continue handling
            },
            
            dragover(view, event) {
              // Force move cursor feedback
              if (event.dataTransfer && event.dataTransfer.types.includes('text/html')) {
                event.dataTransfer.dropEffect = 'move';
              }
              return false;
            },
            
            dragend(view, event) {
              // Reset opacity - handle both video and wrapper
              if (event.target.tagName === 'VIDEO') {
                event.target.style.opacity = '';
              } else if (event.target.classList.contains('dlux-video-container')) {
                event.target.style.opacity = '';
                const video = event.target.querySelector('video');
                if (video) {
                  video.style.opacity = '';
                }
              }
              
              // Clean up stored position
              if (window.dluxEditor) {
                delete window.dluxEditor.draggingVideoPos;
              }
              
              return false;
            },
            
            drop(view, event) {
              // Check if we're dropping a video that was dragged from within the editor
              if (window.dluxEditor?.draggingVideoPos !== undefined) {
                const pos = window.dluxEditor.draggingVideoPos;
                
                // Get drop position
                const dropPos = view.posAtCoords({
                  left: event.clientX,
                  top: event.clientY
                });
                
                if (dropPos && dropPos.pos !== pos) {
                  // We're moving a video within the editor
                  event.preventDefault();
                  
                  // Get the video node
                  const $pos = view.state.doc.resolve(pos);
                  const node = view.state.doc.nodeAt(pos);
                  
                  if (node && node.type.name === 'dluxvideo') {
                    // Create transaction to move the video
                    const tr = view.state.tr;
                    
                    // Calculate adjusted positions
                    let targetPos = dropPos.pos;
                    if (targetPos > pos) {
                      // Adjust for the node being removed
                      targetPos = targetPos - node.nodeSize;
                    }
                    
                    // Delete from old position
                    tr.delete(pos, pos + node.nodeSize);
                    
                    // Insert at new position
                    tr.insert(targetPos, node);
                    
                    // Dispatch the transaction
                    view.dispatch(tr);
                    
                    // Clean up
                    delete window.dluxEditor.draggingVideoPos;
                    
                    return true; // We handled it
                  }
                }
              }
              
              return false; // Let default handling continue
            }
          }
        }
      })
    ];
  }
});

// Create custom SpkVideo extension by extending Youtube
const SpkVideo = Youtube.extend({
  name: 'spkvideo',
  
  addOptions() {
    return {
      ...this.parent?.(),
      onVideoClick: null, // Callback passed from Vue component
    }
  },
  
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
      editVideo: (pos, attrs) => ({ editor }) => {
        // Call the configured callback if available
        if (this.options.onVideoClick) {
          this.options.onVideoClick(pos, attrs);
        }
        return true;
      },
    }
  }
});


// ✅ TIPTAP BEST PRACTICE: Extend existing TableCell following official pattern
// https://next.tiptap.dev/docs/editor/extensions/custom-extensions/extend-existing
const CustomTableCell = TableCell.extend({
  // Block list is now defined in nodeBlockLists registry above

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('customTableCell'),
        
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
            const dropPos = view.posAtCoords({
              left: event.clientX,
              top: event.clientY
            });
            
            if (!dropPos) return false;
            
            // Collect all content types being dropped
            const droppedTypes = new Set();
            
            if (slice && slice.content) {
              slice.content.descendants((node) => {
                droppedTypes.add(node.type.name);
              });
            }
            
            // Check each dropped type against block lists
            for (const nodeType of droppedTypes) {
              const blockInfo = isContentBlockedAt(view.state, dropPos.pos, nodeType);
              
              if (blockInfo.blocked) {
                event.preventDefault();
                return true; // Block the drop
              }
            }
            
            // Nothing is blocked, continue with special handling for moved content
            
            // Enhanced: Handle the drop ourselves for better control when moving content
            if (moved && slice) {
              // Get the current selection (where the content is being moved from)
              const { from, to } = view.state.selection;
              
              // Create a new transaction
              const tr = view.state.tr;
              
              // Calculate the target position
              let targetPos = dropPos.pos;
              
              // If dragging downward (target is after source), we need to adjust
              if (targetPos > from) {
                // Adjust target position by the size of content being removed
                targetPos = targetPos - (to - from);
              }
              
              // Delete from old position
              tr.delete(from, to);
              
              // Insert at new position (already adjusted if needed)
              tr.insert(targetPos, slice.content);
              
              // Dispatch the transaction
              view.dispatch(tr);
              
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

// Note: We don't need to extend TableHeader since the registry handles both tableCell and tableHeader


// ✅ CUSTOM DROPCURSOR: Modular solution that hides dropcursor when dragging blocked content over cells
const CustomDropcursor = Dropcursor.extend({
  name: 'customDropcursor',
  
  addProseMirrorPlugins() {
    const dropcursorPlugin = this.parent?.()?.[0];
    if (!dropcursorPlugin) {
      console.warn('⚠️ CustomDropcursor: No parent dropcursor plugin found');
      return [];
    }
    
    // Plugin reads block lists dynamically from registry
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
          }
        };
        
        // Listen for drag events at document level (drag handles are outside editor)
        const handleDragStart = (event) => {
          if (event.target.hasAttribute?.('data-drag-handle')) {
            // Check what type of node we're dragging
            const hoveredNode = window.dluxEditor?.dragHandleHoveredNode;
            
            if (hoveredNode) {
              draggingNodeType = hoveredNode.type.name;
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
              
            }
          }
        };
        
        const handleDragOver = (event) => {
          if (!draggingNodeType) {
            // Not dragging anything we track
            if (styleElement) {
              removeStyleElement();
              editorView.dom.classList.remove('table-drag-over-cell');
            }
            return;
          }
          
          // Check position using coordinates
          const pos = editorView.posAtCoords({ left: event.clientX, top: event.clientY });
          if (!pos) return;
          
          // Use the utility function to check if content is blocked
          const blockInfo = isContentBlockedAt(editorView.state, pos.pos, draggingNodeType);
          
          if (blockInfo.blocked) {
            if (!styleElement) {
              createStyleElement();
            }
            // Add class to change cursor
            editorView.dom.classList.add('table-drag-over-cell');
          } else {
            if (styleElement) {
              removeStyleElement();
            }
            // Remove class to restore normal cursor
            editorView.dom.classList.remove('table-drag-over-cell');
          }
        };
        
        const handleDragEnd = () => {
          if (draggingNodeType) {
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
  FloatingMenu,
  
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
  CustomHorizontalRule, // Use custom draggable version
  HardBreak,
  
  // Additional extensions
  // History, // Removed - not compatible with Collaboration extension
  Link,
  Image: CustomImage, // Use CustomImage instead of default Image
  CodeBlock,
  // Dropcursor, // Don't export default - we use CustomDropcursor
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
  DluxVideo,
  
  // Table extensions
  TableKit,
  CustomTableCell,
  
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
  
  // Bundle loaded successfully
}

export default TiptapCollaboration; 