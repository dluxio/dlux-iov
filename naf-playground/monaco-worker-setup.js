/**
 * Monaco Editor Worker Setup
 * 
 * This file handles the setup of Monaco editor workers 
 * using a cross-browser compatible approach with iframe proxies.
 */

// Set up the Monaco worker environment immediately when loaded
(function() {
  // Helper to get the base URL relative to the current script
  function getBaseUrl() {
    // This assumes the script is loaded with a normal script tag
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
      const script = scripts[i];
      if (script.src && script.src.includes('monaco-worker-setup.js')) {
        const src = script.src;
        return src.substring(0, src.lastIndexOf('/') + 1);
      }
    }
    // Fallback: use the current page's path
    const path = window.location.pathname;
    return window.location.origin + path.substring(0, path.lastIndexOf('/') + 1);
  }

  // Configure Monaco environment 
  window.MonacoEnvironment = {
    // Use our proxy for all worker types
    getWorkerUrl: function(moduleId, label) {
      return './monaco-proxy.js';
    },
    // Add a global baseUrl for other modules
    baseUrl: getBaseUrl() + 'monaco-editor/vs'
  };
  
  console.log('Monaco environment configured with baseUrl:', window.MonacoEnvironment.baseUrl);
})(); 