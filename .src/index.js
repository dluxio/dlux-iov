import { HocuspocusProvider } from '@hocuspocus/provider';
import * as Y from 'yjs';
import { prosemirrorJSONToYDoc } from 'y-prosemirror';

// Create the bundle object with isolated Y.js
const CollaborationBundle = {
  HocuspocusProvider,
  Y,
  prosemirrorJSONToYDoc,
  createDocument: () => new Y.Doc() // Helper to create documents
};

// Export as default for UMD
export default CollaborationBundle;

// Expose globals for collaboration
window.HocuspocusProvider = HocuspocusProvider;
window.CollaborationBundle = CollaborationBundle;
window.Y = Y; // Expose Y.js globally for TipTap extensions