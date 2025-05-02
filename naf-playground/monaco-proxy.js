/**
 * Monaco Editor Worker Proxy
 * 
 * This file serves as a proxy to load the appropriate worker script for Monaco editor.
 * It simplifies worker loading across different setups and environments.
 */

// Parse the URL to determine the worker path correctly
(function() {
  // Get base path from the current script URL
  const getBasePath = function() {
    // Get the base directory from the current script path (monaco-proxy.js)
    const scriptPath = self.location.pathname;
    const lastSlash = scriptPath.lastIndexOf('/');
    return scriptPath.substring(0, lastSlash + 1);
  };

  // Figure out the correct base path for Monaco
  const basePath = getBasePath();
  const monacoBase = basePath + 'monaco-editor/vs';
  
  // Log for debugging
  console.log('Monaco worker proxy initialized with base path:', monacoBase);
  
  // Set the Monaco environment for workers
  self.MonacoEnvironment = {
    baseUrl: monacoBase
  };
  
  // Load the worker main script from the correct path
  try {
    // Try with most likely path first (absolute path)
    importScripts(self.location.origin + monacoBase + '/base/worker/workerMain.js');
    console.log('Monaco worker loaded from:', self.location.origin + monacoBase + '/base/worker/workerMain.js');
  } catch (e) {
    // Fallback to relative path if absolute doesn't work
    try {
      importScripts(monacoBase + '/base/worker/workerMain.js');
      console.log('Monaco worker loaded from:', monacoBase + '/base/worker/workerMain.js');
    } catch (e2) {
      // Last resort - try with bare minimum path
      console.error('Failed to load workerMain.js with provided paths, trying direct import');
      importScripts('./monaco-editor/vs/base/worker/workerMain.js');
    }
  }
})(); 