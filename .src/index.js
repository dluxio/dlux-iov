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

// Only expose minimal globals to avoid conflicts
window.HocuspocusProvider = HocuspocusProvider;
window.CollaborationBundle = CollaborationBundle;

// Don't expose Y.js globally to avoid conflicts with TipTap's Y.js imports