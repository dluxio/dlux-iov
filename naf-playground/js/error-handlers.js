/**
 * Error Handlers - Centralized error handling for the application
 */

import { logAction } from './debug.js';

/**
 * Show an initialization error to the user
 * @param {Error} error - The error that occurred
 */
export function showInitializationError(error) {
    console.error('Application initialization failed:', error);
    
    // Add an error message to the UI
    const appContainer = document.getElementById('app-container');
    if (appContainer) {
        const errorEl = document.createElement('div');
        errorEl.className = 'error-message';
        errorEl.innerHTML = `
            <h2>Application Error</h2>
            <p>The application failed to initialize properly. Please try refreshing the page.</p>
            <p>Error details: ${error.message || 'Unknown error'}</p>
            <button id="retry-button">Retry</button>
        `;
        appContainer.prepend(errorEl);
        
        // Add retry button functionality
        document.getElementById('retry-button').addEventListener('click', () => {
            errorEl.remove();
            // Import and call initApp again
            import('./app.js').then(app => {
                app.initApp();
            }).catch(err => {
                console.error('Error importing app module:', err);
            });
        });
    }
    
    // Also show in the console for debugging
    console.error('Full error details:', error);
    logAction('Application initialization failed', 'error');
}

/**
 * Show an editor-specific error message
 * @param {string} message - The error message to display
 */
export function showEditorError(message = 'Editor initialization failed. Some features may not work correctly.') {
    // Import the utils module for notifications
    import('./utils.js').then(utils => {
        utils.showNotification(message, 'error');
    }).catch(err => {
        console.error('Could not show notification:', err);
    });
}

/**
 * Add global error handler to catch any uncaught errors
 */
export function setupGlobalErrorHandler() {
    window.addEventListener('error', function(event) {
        console.error('Global error caught:', event.error);
        
        // Check if it's a worker loading error
        if (event.filename && event.filename.includes('worker')) {
            console.error('Worker loading error detected!', event);
            showEditorError('Monaco editor worker failed to load. Editor features may be limited.');
        }
        
        logAction('Global error caught: ' + event.message, 'error');
    });
} 