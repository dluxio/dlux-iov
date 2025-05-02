/**
 * Monaco Editor Web Worker Loader Proxy
 * 
 * This file serves as a proxy to load the Monaco editor web workers.
 * It ensures that the AMD modules used by Monaco editor web workers 
 * are correctly loaded and configured.
 */

self.MonacoEnvironment = {
  baseUrl: self.location.protocol + '//' + self.location.host + '/monaco-editor/vs'
};

// Define the 'require' used by Monaco workers
self.importScripts('/monaco-editor/vs/base/worker/workerMain.js'); 