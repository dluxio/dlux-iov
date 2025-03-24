/**
 * Monaco.js - Monaco editor integration and synchronization
 */

import { getState, setState, subscribe } from './state.js';
import { generateEntitiesHTML } from './entities.js';
import { logAction } from './debug.js';
import { generateEntityId, positionToString } from './utils.js';
// Import recreateAllEntities function from entity-api.js instead
import { recreateAllEntities } from './entity-api.js';

// Monaco editor instance
let editor = null;

// Editor container element
let editorContainer;

// Flag to prevent circular updates
let isUpdating = false;

// Flag to prevent multiple simultaneous init attempts
let isInitializing = false;

// Counter for tracking Monaco load attempts
let loadAttempts = 0;
const MAX_LOAD_ATTEMPTS = 5;

/**
 * Initialize the Monaco editor
 * @param {Function} callback - Callback to be called when initialization is complete
 */
export function initMonacoEditor(callback) {
    console.log('Initializing Monaco editor...');
    
    // If already initializing, prevent duplicate init
    if (isInitializing) {
        console.log('Editor initialization already in progress, waiting...');
        // Wait and then check if editor was created
        setTimeout(() => {
            if (editor) {
                console.log('Editor was created by another initialization process');
                if (callback) callback(true);
            } else {
                console.log('Still no editor after waiting, proceeding with initialization');
                // Try again, forcing the initialization
                isInitializing = false;
                initMonacoEditor(callback);
            }
        }, 500);
        return;
    }
    
    // Set the initializing flag
    isInitializing = true;
    
    // Get the editor container
    editorContainer = document.getElementById('monaco-editor');
    if (!editorContainer) {
        console.error('Monaco editor container element not found');
        isInitializing = false;
        if (callback) callback(false, new Error('Editor container not found'));
        return;
    }
    
    // If editor is already initialized, just return it
    if (editor) {
        console.log('Monaco editor already initialized');
        isInitializing = false;
        if (callback) callback(true);
        return;
    }
    
    // If the fallback editor is available, use it
    if (window._fallbackMonacoEditor) {
        console.log('Using fallback Monaco editor instance');
        editor = window._fallbackMonacoEditor;
        setupEditorEvents();
        isInitializing = false;
        if (callback) callback(true);
        return;
    }
    
    // Fast path: If monaco is already defined globally, create the editor immediately
    if (typeof monaco !== 'undefined' && monaco.editor) {
        console.log('Monaco global already available, creating editor immediately');
        createEditor((success, error) => {
            isInitializing = false;
            if (callback) callback(success, error);
        });
        return;
    }
    
    // Check if we're waiting for a 'monaco-ready' event
    // This event is dispatched by the Monaco loader in index.html
    const monacoReadyHandler = () => {
        console.log('Monaco ready event received');
        window.removeEventListener('monaco-ready', monacoReadyHandler);
        
        // Check if Monaco is actually available
        if (typeof monaco !== 'undefined' && monaco.editor) {
            console.log('monaco-ready event provided valid Monaco namespace');
            createEditor((success, error) => {
                isInitializing = false;
                if (callback) callback(success, error);
            });
        } else {
            console.warn('monaco-ready event received but Monaco namespace not available');
            // Continue with standard loading
            attemptStandardLoading();
        }
    };
    
    // Listen for the monaco-ready event with a timeout
    window.addEventListener('monaco-ready', monacoReadyHandler);
    
    // Set a timeout in case the event doesn't fire
    const readyEventTimeout = setTimeout(() => {
        console.log('monaco-ready event timeout, proceeding with standard loading');
        window.removeEventListener('monaco-ready', monacoReadyHandler);
        attemptStandardLoading();
    }, 1000);
    
    // Standard AMD loading procedure
    function attemptStandardLoading() {
        // If Monaco isn't loaded yet, we need to load it
        if (typeof monaco === 'undefined') {
            console.warn('Monaco editor not loaded yet. Trying to load...');
            
            // Check if we have a loader
            if (typeof require !== 'undefined') {
                console.log('Using require for Monaco...');
                try {
                    // First, ensure the monaco path is correctly configured
                    require.config({ 
                        paths: { 'vs': '/monaco-editor/vs' },
                        // Add a waitTimeout to ensure the loader doesn't time out too quickly
                        waitSeconds: 30
                    });
                    
                    // Track this load attempt
                    loadAttempts++;
                    
                    // Try to load Monaco using AMD
                    require(['vs/editor/editor.main'], function() {
                        console.log('Monaco loaded via require');
                        loadAttempts = 0; // Reset attempts counter on success
                        
                        // Clear the timeout if it's still active
                        clearTimeout(readyEventTimeout);
                        
                        // Create editor now that Monaco is loaded
                        createEditor((success, error) => {
                            isInitializing = false;
                            if (callback) callback(success, error);
                        });
                    }, function(error) {
                        console.error('Failed to load Monaco via require:', error);
                        
                        // Clear the timeout if it's still active
                        clearTimeout(readyEventTimeout);
                        
                        // Try again a few times with increasing delays if the editor is crucial
                        if (loadAttempts < MAX_LOAD_ATTEMPTS) {
                            console.log(`Retrying Monaco load (attempt ${loadAttempts}/${MAX_LOAD_ATTEMPTS})...`);
                            isInitializing = false;
                            setTimeout(() => {
                                initMonacoEditor(callback);
                            }, loadAttempts * 1000); // Increasing backoff
                            return;
                        }
                        
                        // If we've reached maximum attempts, try the fallback approach
                        createFallbackTextarea(getSceneHTML());
                        isInitializing = false;
                        if (callback) callback(false, error);
                    });
                } catch (error) {
                    console.error('Error configuring Monaco require:', error);
                    // Clear the timeout if it's still active
                    clearTimeout(readyEventTimeout);
                    // Try the fallback
                    createFallbackTextarea(getSceneHTML());
                    isInitializing = false;
                    if (callback) callback(false, error);
                }
            } else {
                console.warn('Monaco editor loader not found');
                
                // Clear the timeout if it's still active
                clearTimeout(readyEventTimeout);
                
                // Try to load the script manually as a last resort
                try {
                    const script = document.createElement('script');
                    script.src = '/monaco-editor/vs/loader.js';
                    script.onload = () => {
                        console.log('Monaco loader script loaded manually');
                        setTimeout(() => {
                            isInitializing = false;
                            initMonacoEditor(callback); // Try again after loader is loaded
                        }, 500);
                    };
                    script.onerror = (err) => {
                        console.error('Failed to load Monaco loader script manually:', err);
                        createFallbackTextarea(getSceneHTML());
                        isInitializing = false;
                        if (callback) callback(false, new Error('Monaco loader not found and manual load failed'));
                    };
                    document.head.appendChild(script);
                } catch (loadError) {
                    console.error('Error attempting to load Monaco loader manually:', loadError);
                    createFallbackTextarea(getSceneHTML());
                    isInitializing = false;
                    if (callback) callback(false, new Error('Monaco loader not found'));
                }
            }
        } else {
            console.log('Monaco editor already loaded, creating editor instance');
            clearTimeout(readyEventTimeout);
            createEditor((success, error) => {
                isInitializing = false;
                if (callback) callback(success, error);
            });
        }
    }
}

/**
 * Create a fallback textarea editor when Monaco fails to initialize
 * @param {string} initialContent - Initial content for the textarea
 * @returns {boolean} - Whether the fallback was created successfully
 */
function createFallbackTextarea(initialContent = '') {
    try {
        console.log('Creating fallback textarea editor');
        
        if (!editorContainer) {
            console.error('No editor container available for fallback');
            return false;
        }
        
        // Create a more styled fallback that mimics Monaco's appearance
        editorContainer.innerHTML = `
            <div class="fallback-editor-container">
                <div class="fallback-editor-header">
                    <span>Scene HTML Editor (Fallback Mode)</span>
                </div>
                <textarea id="fallback-editor" class="fallback-editor" spellcheck="false">${initialContent}</textarea>
            </div>
        `;
        
        // Create a simple editor interface that mimics the Monaco API
        const textarea = document.getElementById('fallback-editor');
        
        if (!textarea) {
            console.error('Failed to create fallback textarea');
            return false;
        }
        
        // Create a mock editor object that exposes similar API to Monaco
        editor = {
            getValue: function() {
                return textarea.value;
            },
            setValue: function(value) {
                textarea.value = value;
                return true;
            },
            onDidChangeModelContent: function(callback) {
                textarea.addEventListener('input', callback);
                // Return a mock disposable
                return {
                    dispose: function() {
                        textarea.removeEventListener('input', callback);
                    }
                };
            },
            dispose: function() {
                // Not needed for textarea
            }
        };
        
        // Setup change event to update status
        textarea.addEventListener('input', function() {
            // Only update if not in programmatic update
            if (!isUpdating) {
                updateEditorStatus('changed');
            }
        });
        
        console.log('Fallback textarea editor created successfully');
        return true;
    } catch (error) {
        console.error('Error creating fallback textarea:', error);
        return false;
    }
}

/**
 * Create the Monaco editor instance
 * @param {Function} callback - Callback to call when editor is created
 */
function createEditor(callback) {
    try {
        console.log('Creating Monaco editor instance...');
        
        // Make sure container exists
        editorContainer = document.getElementById('monaco-editor');
        if (!editorContainer) {
            console.error('Monaco editor container not found');
            if (callback) callback(false, new Error('Editor container not found'));
            return;
        }
        
        // Check if the container already has a Monaco editor instance
        const existingMonacoEditor = editorContainer.querySelector('.monaco-editor');
        if (existingMonacoEditor) {
            console.log('Existing Monaco editor found in container, clearing it');
            
            // Clear the container to avoid context attribute errors
            editorContainer.innerHTML = '';
            
            // If editor variable is set but createEditor is called again, 
            // there might be a stale reference that needs to be disposed
            if (editor) {
                try {
                    console.log('Disposing previous editor instance');
                    editor.dispose();
                } catch (disposeError) {
                    console.warn('Error disposing previous editor:', disposeError);
                }
                editor = null;
            }
        }
        
        // Get initial scene state
        const sceneHTML = getSceneHTML();
        
        // Make sure Monaco global exists
        if (!monaco || !monaco.editor) {
            console.error('Monaco editor namespace not available');
            
            // Create fallback textarea instead
            const fallbackCreated = createFallbackTextarea(sceneHTML);
            if (fallbackCreated) {
                if (callback) callback(true);
            } else {
                if (callback) callback(false, new Error('Failed to create editor or fallback'));
            }
            return;
        }
        
        // Create the editor
        try {
            editor = monaco.editor.create(editorContainer, {
                value: sceneHTML,
                language: 'html',
                theme: 'vs-dark',
                automaticLayout: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: 'on'
            });
            
            // Setup editor events
            setupEditorEvents();
            
            console.log('Monaco editor created successfully');
            
            // Call success callback
            if (callback) callback(true);
        } catch (editorError) {
            console.error('Error creating Monaco editor instance, falling back to textarea:', editorError);
            
            // Try the fallback
            const fallbackCreated = createFallbackTextarea(sceneHTML);
            if (fallbackCreated) {
                if (callback) callback(true);
            } else {
                if (callback) callback(false, editorError);
            }
        }
    } catch (error) {
        console.error('Error in createEditor:', error);
        
        // Create a fallback display to show errors
        if (editorContainer) {
            // Try to create fallback textarea as last resort
            const fallbackCreated = createFallbackTextarea(getSceneHTML());
            if (fallbackCreated) {
                if (callback) callback(true);
                return;
            }
            
            // If even the fallback fails, show error message
            editorContainer.innerHTML = `
                <div class="editor-error">
                    <h3>Error initializing editor</h3>
                    <p>${error.message || 'Unknown error'}</p>
                </div>
            `;
        }
        
        // Call error callback
        if (callback) callback(false, error);
    }
}

/**
 * Handle changes to the editor content
 */
function handleEditorChange(e) {
    console.log('Editor content changed');
    
    // Avoid circular updates
    if (isUpdating) {
        console.log('Ignoring change event during programmatic update');
        return;
    }
    
    // Update status to show changes are pending
    updateEditorStatus('changed');
    
    // We don't automatically apply changes - the user needs to click the "Apply Changes" button
}

/**
 * Update the editor status indicator
 * @param {string} status - Status type: 'ready', 'changed', 'error'
 * @param {string} message - Optional message to display
 */
function updateEditorStatus(status, message) {
    const statusEl = document.getElementById('editor-status');
    if (!statusEl) return;
    
    statusEl.className = '';
    
    switch (status) {
        case 'ready':
            statusEl.textContent = message || 'Ready';
            statusEl.className = 'status-saved';
            break;
        case 'changed':
            statusEl.textContent = message || 'Unsaved changes';
            statusEl.className = 'status-changed';
            break;
        case 'error':
            statusEl.textContent = message || 'Error';
            statusEl.className = 'status-error';
            break;
        default:
            statusEl.textContent = message || status;
    }
}

/**
 * Get the current editor content
 * @returns {string|null} The HTML content from the editor, or null if not available
 */
export function getEditorContent() {
    if (!editor) {
        console.error('Cannot get content: editor not initialized');
        
        // Try to get content from the scene as a fallback
        try {
            const scene = document.querySelector('a-scene');
            if (scene) {
                console.log('Falling back to scene HTML since editor is not initialized');
                return scene.outerHTML;
            }
        } catch (error) {
            console.error('Error getting fallback content from scene:', error);
        }
        
        return null;
    }
    
    try {
        return editor.getValue();
    } catch (error) {
        console.error('Error getting editor content:', error);
        return null;
    }
}

/**
 * Apply the content from Monaco editor to the scene
 * @param {string} content - HTML content from the editor
 * @returns {Promise<Object>} Status object
 */
export async function applyEditorContent(content) {
    console.log('Applying editor content to scene...');
    
    try {
        // Use provided content or get from editor
        const htmlContent = content || getEditorContent();
        
        if (!htmlContent || !htmlContent.trim()) {
            console.error('Cannot apply empty content');
            updateEditorStatus('error', 'Empty content');
            return { success: false, error: 'Empty content' };
        }
        
        // Import state module to ensure we have the latest state
        const stateModule = await import('./state.js');
        
        // Initialize state if needed
        const currentState = stateModule.getState();
        if (!currentState.entities) {
            console.log('Initializing state before parsing editor content');
            stateModule.setState({
                entities: {},
                entityMapping: {}
            });
        }
        
        // Parse and apply the HTML content
        const result = await parseSceneHTML(htmlContent);
        
        // Ensure all entities have UUIDs after parsing
        try {
            const entityApi = await import('./entity-api.js');
            if (entityApi.ensureEntityUUIDs) {
                console.log('Ensuring all entities have UUIDs after applying editor content');
                await entityApi.ensureEntityUUIDs();
            }
        } catch (err) {
            console.error('Error importing entity-api module for UUID check:', err);
        }
        
        updateEditorStatus('ready', 'Changes applied');
        return { success: true };
    } catch (error) {
        console.error('Error applying editor content:', error);
        updateEditorStatus('error', error.message);
        return { 
            success: false, 
            error: error.message
        };
    }
}

/**
 * Update the Monaco editor with the current state
 * @param {boolean} [force=false] - Whether to force update even if no changes detected
 */
export function updateMonacoEditor(force = false) {
        if (!editor) {
        console.error('Cannot update editor: editor not initialized');
        return;
    }
    
    console.log('[DEBUG] Updating Monaco editor, force =', force);
    
    try {
        // Get current state
        const state = getState();
        console.log('[DEBUG] Current state for editor update:', state);
        
        // Generate HTML from state
        const html = generateHTMLFromState(state);
        
        // Update model only if content has changed or force is true
        const currentValue = editor.getValue();
        if (force || currentValue !== html) {
            console.log('[DEBUG] Editor content will be updated');
            
            // Save current cursor position
            const position = editor.getPosition();
            
            // Update content
            editor.setValue(html);
            
            // Restore cursor position if possible
            if (position) {
                editor.setPosition(position);
            }
            
            // Set editor status
            setEditorStatus('Synced with scene');
            
            console.log('[DEBUG] Editor updated successfully');
        } else {
            console.log('[DEBUG] No changes detected in editor content, skipping update');
            // Still update the status
            setEditorStatus('Synced with scene');
        }
        
        return html; // Return the generated HTML
    } catch (error) {
        console.error('Error updating Monaco editor:', error);
        setEditorStatus('Error: Failed to update editor');
    }
}

/**
 * Force an update of the editor with current scene content
 * This is a convenience method to bypass update checks
 */
export function forceEditorUpdate() {
    return updateMonacoEditor(true);
}

/**
 * Check if the editor is initialized
 * @returns {boolean} True if editor is initialized
 */
export function isEditorInitialized() {
    // Check if we have a global monaco object
    if (typeof monaco === 'undefined') {
        return false;
    }
    
    // Check if we have an editor instance
    if (!editor) {
        return false;
    }
    
    // Check if the editor container has the monaco-editor element
    const editorContainer = document.getElementById('monaco-editor');
    if (!editorContainer || !editorContainer.querySelector('.monaco-editor')) {
        return window._fallbackMonacoEditor !== undefined;
    }
    
    return true;
}

/**
 * Get the Monaco editor instance
 * @returns {object|null} The Monaco editor instance or null if not initialized
 */
export function getEditorInstance() {
    return editor;
}

/**
 * Clean entity HTML for display in editor
 * @param {Element} entity - Entity element
 * @returns {string} - Clean HTML for the entity
 */
function cleanEntityHTML(entity) {
    if (!entity) return '';
    
    const tag = entity.tagName.toLowerCase();
    
    // Start with the opening tag
    let html = `<${tag}`;
    
    // Add all attributes except for those that are internal/redundant
    const excludeAttrs = ['aframe-injected', 'class', 'style', 'data-aframe-inspector', 'data-aframe-inspector-original-camera'];
    
    // Specifically *include* data-entity-uuid even if it would normally be excluded
    // as a data attribute, since we need it for entity tracking
    const includeDataAttrs = ['data-entity-uuid'];
    
    Array.from(entity.attributes).forEach(attr => {
        const name = attr.name;
        
        // Skip certain attributes
        if (excludeAttrs.includes(name)) return;
        
        // By default, skip data-* attributes unless specifically included
        if (name.startsWith('data-') && !includeDataAttrs.includes(name)) return;
        
        // Add the attribute to the HTML
        let value = attr.value;
        
        // Use single quotes if the value contains double quotes
        const quoteChar = value.includes('"') ? "'" : '"';
        
        html += ` ${name}=${quoteChar}${value}${quoteChar}`;
    });
    
    // Check if it's a self-closing tag
    const selfClosing = ['a-asset-item', 'a-image', 'a-mixin'].includes(tag);
    
    if (selfClosing) {
        html += ' />';
        return html;
    }
    
    // Close the opening tag
    html += '>';
    
    // Add any children
    if (entity.childElementCount > 0) {
        // Add newlines around children for readability
        html += '\n';
        
        Array.from(entity.children).forEach(child => {
            // Recursively clean children
            const childHtml = cleanEntityHTML(child);
            if (childHtml) {
                // Indent children
                html += childHtml.split('\n').map(line => `  ${line}`).join('\n');
                html += '\n';
            }
        });
        
        // Close tag on new line
        html += `</${tag}>`;
    } else {
        // Empty element, close tag immediately
        html += `</${tag}>`;
    }
    
    return html;
}

/**
 * Get the current HTML from the state model rather than the DOM
 * @returns {string} HTML representation of the scene
 */
function getSceneHTML() {
    try {
        console.log('Generating scene HTML directly from state...');
        
        // Get state
        const state = getState();
        if (!state || !state.entities) {
            console.warn('No state data available for HTML generation');
            return generateDefaultSceneHTML();
        }
        
        // Generate entities HTML from state
        const entitiesHTML = generateEntitiesHTML();
        
        // Start with the basic scene structure
        let sceneHTML = '<a-scene>\n';
        
        // Add assets section
        sceneHTML += '  <!-- Assets -->\n';
        sceneHTML += '  <a-assets>\n';
        sceneHTML += '    <!-- System templates are maintained internally but not shown in editor -->\n';
        sceneHTML += '  </a-assets>\n\n';
        
        // Add builder camera (static definition, not managed by entity system)
            sceneHTML += '  <!-- Builder Camera (persistent) -->\n';
            sceneHTML += '  <a-entity id="builder-camera" camera position="0 1.6 3" look-controls wasd-controls>\n';
            sceneHTML += '    <a-cursor></a-cursor>\n';
            sceneHTML += '  </a-entity>\n\n';
        
        // Add environment section
        sceneHTML += '  <!-- Environment -->\n';
        
        // Sky element - look it up in state by type
        let skyUUID = null;
        let skyProps = {};
        
        // Find the sky in the state
        for (const uuid in state.entities) {
            if (state.entities[uuid].type === 'sky') {
                skyUUID = uuid;
                skyProps = state.entities[uuid];
                break;
            }
        }
        
        // Add sky with UUID
        if (skyUUID) {
            sceneHTML += `  <a-sky id="sky" color="${skyProps.color || '#ECECEC'}" data-entity-uuid="${skyUUID}"></a-sky>\n`;
        } else {
            // Default sky with generated UUID
            sceneHTML += `  <a-sky id="sky" color="#ECECEC" data-entity-uuid="${generateEntityId('sky')}"></a-sky>\n`;
        }
        
        // Add standard lighting (not managed as entities in state)
        sceneHTML += '  <a-entity id="default-light" light="type: ambient; color: #BBB"></a-entity>\n';
            sceneHTML += '  <a-entity id="directional-light" light="type: directional; color: #FFF; intensity: 0.6" position="-0.5 1 1"></a-entity>\n';
        
        // Add user entities
        sceneHTML += '\n  <!-- User Entities -->\n';
        sceneHTML += entitiesHTML;
        
        sceneHTML += '</a-scene>';
        
        return sceneHTML;
    } catch (error) {
        console.error('Error generating scene HTML from state:', error);
        return generateDefaultSceneHTML();
    }
}

/**
 * Convert element attributes to string representation
 * @param {Element} element - DOM element
 * @param {Array<string>} [skipAttrs=[]] - Attributes to skip
 * @param {boolean} [compactOutput=true] - Whether to produce compact output by removing default values
 * @returns {string} - Attribute string
 */
function attributesToString(element, skipAttrs = [], compactOutput = true) {
    let attrString = '';
    const tagName = element.tagName.toLowerCase();
    
    // Get all attributes except id and specified ones to skip
    Array.from(element.attributes).forEach(attr => {
        if (attr.name === 'id') return;
        
        // Skip attributes in the skipAttrs list
        if (skipAttrs.includes(attr.name)) return;
        
        // Skip empty attributes
        if (attr.value === '') return;
        
        // Skip redundant camera attribute on camera entity
        if (attr.name === 'camera' && element.hasAttribute('camera') && attr.value === '') return;
        
        // Skip geometry/material attributes generated by A-Frame
        if (['geometry', 'material'].includes(attr.name) && attr.value === '') return;
        
        // Skip other A-Frame auto-generated attributes that pollute the output
        if (attr.name.startsWith('data-') || 
            attr.name === 'geometry' || 
            attr.name === 'material' ||
            attr.name === 'class' && attr.value === '') return;
            
        // Skip default attributes if compact output is requested
        if (compactOutput) {
            // Skip scale attribute when it's empty or default
            if (attr.name === 'scale' && (attr.value === '' || attr.value === '1 1 1')) return;
            
            // Skip rotation attribute when it's empty or default
            if (attr.name === 'rotation' && (attr.value === '' || attr.value === '0 0 0')) return;
            
            // Skip position attribute when it's default
            if (attr.name === 'position' && attr.value === '0 0 0') return;
            
            // Skip default color for sky
            if (tagName === 'a-sky' && attr.name === 'color' && attr.value === '#ECECEC') return;
        }
        
        // Special handling for color attribute
        if (attr.name === 'color') {
            attrString += ` color="${attr.value}"`;
            return;
        }
        
        // Special formatting for position, rotation, scale to ensure consistent formatting
        if (['position', 'rotation', 'scale'].includes(attr.name)) {
            try {
                const parsedValue = parseVectorAttribute(attr.value);
                // Format with consistent precision
                const formattedValue = positionToString(parsedValue);
                attrString += ` ${attr.name}="${formattedValue}"`;
                return;
            } catch (e) {
                console.warn(`Error formatting ${attr.name} attribute:`, e);
                // Fallback to original value
            }
        }
        
        // Add attribute with proper escaping for quotes
        attrString += ` ${attr.name}="${attr.value.replace(/"/g, '&quot;')}"`;
    });
    
    return attrString;
}

/**
 * Generate default scene HTML when the state isn't available
 * @returns {string} Default scene HTML
 */
function generateDefaultSceneHTML() {
    // Generate a default sky UUID
    const skyUuid = generateEntityId('sky');
    
    return `<a-scene>
  <!-- Assets -->
  <a-assets>
    <!-- System templates are maintained internally but not shown in editor -->
  </a-assets>

  <!-- Builder Camera (persistent) -->
  <a-entity id="builder-camera" camera position="0 1.6 3" look-controls wasd-controls>
    <a-cursor></a-cursor>
  </a-entity>

  <!-- Environment -->
  <a-entity id="default-light" light="type: ambient; color: #BBB"></a-entity>
  <a-entity id="directional-light" light="type: directional; color: #FFF; intensity: 0.6" position="-0.5 1 1"></a-entity>
  <a-sky id="sky" color="#ECECEC" data-entity-uuid="${skyUuid}"></a-sky>
</a-scene>`;
}

/**
 * Generate HTML string for the full scene
 * @returns {string} HTML for the scene
 */
function generateSceneHTML() {
    const state = getState();
    
    // Generate entities HTML
    const entitiesHTML = generateEntitiesHTML();
    
    // Create the full scene HTML
    const sceneHTML = `<a-scene>
  <!-- Assets -->
  <a-assets>
    <!-- System templates are maintained internally but not shown in editor -->
  </a-assets>

  <!-- Builder Camera (persistent) -->
  <a-entity id="builder-camera" camera position="0 1.6 3" look-controls wasd-controls>
    <a-cursor></a-cursor>
  </a-entity>

  <!-- Default Environment -->
  <a-sky id="sky" color="#ECECEC" data-entity-uuid="${generateEntityId('sky')}"></a-sky>
  <a-entity id="default-light" light="type: ambient; color: #BBB"></a-entity>
  <a-entity id="directional-light" light="type: directional; color: #FFF; intensity: 0.6" position="-0.5 1 1"></a-entity>

  <!-- User Entities -->
${entitiesHTML}</a-scene>`;

    return sceneHTML;
}

/**
 * Get the UUID for the sky element
 * @returns {string} UUID for the sky element
 */
function getSkyUUID() {
    // First try to get it from the DOM
    const skyElement = document.querySelector('a-sky');
    if (skyElement && skyElement.dataset.entityUuid) {
        return skyElement.dataset.entityUuid;
    }
    
    // If not found in DOM, try to find it in state
    const state = getState();
    if (state && state.entities) {
        for (const uuid in state.entities) {
            if (state.entities[uuid].type === 'sky') {
                return uuid;
            }
        }
    }
    
    // As a fallback, generate a new one
    return generateEntityId('sky');
}

/**
 * Parse scene HTML from editor and update the state model
 * @param {string} html - Scene HTML to parse
 * @returns {Promise<Object>} - Success status and any error
 */
async function parseSceneHTML(html) {
    console.log('Parsing scene HTML from editor...');
    
    try {
        // Create a temporary DOM element to parse the HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Find the a-scene element
        const sceneEl = doc.querySelector('a-scene');
        if (!sceneEl) {
            return {
                success: false,
                error: 'No a-scene element found in the HTML'
            };
        }
        
        // Ensure scene has default camera and lights
        ensureSceneDefaults(sceneEl);
        
        // Track warnings for partial success
        const warnings = [];
        
        // Track preserved IDs for feedback
        const preservedIds = [];
        
        // Dynamic imports to avoid circular dependencies
        const [stateModule, entitiesModule] = await Promise.all([
            import('./state.js'),
            import('./entities.js')
        ]);
            
        const generateEntityUUID = stateModule.generateEntityUUID;
        const setState = stateModule.setState;
        
        // Get current state to compare changes
        const currentState = stateModule.getState();
        const currentEntities = currentState.entities || {};
        const currentEntityMapping = currentState.entityMapping || {};
        
        // Extract user-defined entities (exclude system entities)
        const newEntities = {};
        const newEntityMapping = {};
        const systemEntityIds = ['builder-camera', 'default-light', 'directional-light'];
        
        // Track used entity IDs to avoid duplicates
        const usedIds = new Set(systemEntityIds);
        
        // Process all a-* primitives and a-entity elements
        const primitives = sceneEl.querySelectorAll('a-box, a-sphere, a-cylinder, a-plane, a-sky, a-entity, a-cone, a-ring, a-torus');
        primitives.forEach(el => {
            // Skip system entities
            if (systemEntityIds.includes(el.id)) return;
            
            // Skip entities inside assets
            if (el.closest('a-assets')) return;
            
            // First, handle the entity UUID (for state tracking)
            let uuid = el.getAttribute('data-entity-uuid');
            
            // Next, handle the ID attribute (user-visible identifier)
            let id = el.id;
            const hasUserDefinedId = !!id && id !== ""; // Check if user provided an ID
            
            // Look for UUID mappings in three ways:
            // 1. From data-entity-uuid attribute
            // 2. From existing ID to UUID mapping if the ID exists
            // 3. From UUID to ID reverse lookup if no data attribute but ID matches pattern
            
            if (!uuid && id && currentEntityMapping[id]) {
                // Case 2: Found UUID from ID mapping
                uuid = currentEntityMapping[id];
                console.log(`Found UUID ${uuid} for entity with ID ${id} via mapping`);
                
                // Track that this ID was preserved from user input
                if (hasUserDefinedId) {
                    preservedIds.push(id);
                }
            } else if (!uuid) {
                // Case 3: Look for existing entity with similar properties to reuse UUID
                const tagName = el.tagName.toLowerCase();
                const type = tagName.startsWith('a-') ? tagName.substring(2) : tagName;
                
                // If we have an existing entity with this ID, prefer keeping its UUID
                for (const existingId in currentEntityMapping) {
                    if (existingId === id) {
                        const existingUuid = currentEntityMapping[existingId];
                        const existingEntity = currentEntities[existingUuid];
                        if (existingEntity && existingEntity.type === type) {
                            uuid = existingUuid;
                            console.log(`Reusing UUID ${uuid} for entity with ID ${id} based on type match`);
                            
                            // Track that this ID was preserved from user input
                            if (hasUserDefinedId) {
                                preservedIds.push(id);
                            }
                            break;
                        }
                    }
                }
                
                // If still no UUID, generate a new one
                if (!uuid) {
                    uuid = generateEntityUUID();
                    console.log(`Generated new UUID ${uuid} for entity:`, el.outerHTML);
                }
            } else if (hasUserDefinedId) {
                // Track entities with user-defined IDs that were preserved
                for (const existingId in currentEntityMapping) {
                    if (existingId === id && currentEntityMapping[existingId] === uuid) {
                        preservedIds.push(id);
                        break;
                    }
                }
            }
            
            // Ensure the element has the UUID in its dataset
            el.setAttribute('data-entity-uuid', uuid);
            
            // If user provided an ID, make sure it's tracked and mark as used
            if (hasUserDefinedId) {
                usedIds.add(id);
                newEntityMapping[id] = uuid;
            }
            
            // Get the entity type from the tag name
            const tagName = el.tagName.toLowerCase();
            const type = tagName.startsWith('a-') ? tagName.substring(2) : tagName;
            
            // Create entity data object starting with type
            const entityData = { type };
            
            // Get all attributes except class and data-entity-uuid
            Array.from(el.attributes).forEach(attr => {
                const name = attr.name;
                // Keep id in entityData for potential reference, but don't process it specially
                if (['class', 'data-entity-uuid'].includes(name)) return;
                
                // Parse value appropriately based on attribute name
                let value = attr.value;
                
                // Convert position, rotation, scale to objects for consistent state storage
                if (['position', 'rotation', 'scale'].includes(name)) {
                    value = parseVectorAttribute(value);
                } 
                // Handle JSON attributes (geometry, material, etc)
                else if (value && typeof value === 'string') {
                    // First try to parse directly
                    try {
                        if (value.startsWith('{') || value.startsWith('[')) {
                            value = JSON.parse(value);
                        }
                    } catch (e) {
                        // If direct parsing fails, try to handle nested JSON strings
                        // This handles the case where JSON strings have become over-escaped
                        try {
                            // If it looks like an over-escaped JSON string, try to de-nest it
                            if (value.includes('\\"') || value.includes('\\\\"')) {
                                // Handle the deeply nested case by gradually unescaping and parsing
                                let attempts = 0;
                                let currentValue = value;
                                let lastParsed = null;
                                
                                // Try progressively parsing deeper
                                while (attempts < 5 && typeof currentValue === 'string') {
                                    try {
                                        currentValue = JSON.parse(currentValue);
                                        lastParsed = currentValue;
                                        attempts++;
                                    } catch (innerError) {
                                        break;
                                    }
                                }
                                
                                // Use the deepest successfully parsed value
                                if (lastParsed !== null) {
                                    value = lastParsed;
                                    console.log(`Successfully de-nested JSON for ${name}`);
                                }
                            }
                        } catch (nestedError) {
                            console.warn(`Failed to parse nested JSON for ${name}:`, nestedError);
                        }
                    }
                }
                
                // Store the attribute in entity data
                entityData[name] = value;
            });
            
            // Add entity to new state
            newEntities[uuid] = entityData;
        });
        
        console.log('Parsed entities from editor:', newEntities);
        console.log('Entity ID to UUID mapping:', newEntityMapping);
        console.log('Preserved user-defined IDs:', preservedIds);
        
        if (Object.keys(newEntities).length === 0) {
            console.warn('No entities found in editor HTML');
            warnings.push('No entities found in editor HTML');
        }
        
        // Update state with merged entity mappings (preserve mappings for entities not in editor)
        // but use the new entities data (editor is source of truth for entity data)
        const mergedMapping = { ...currentEntityMapping };
        
        // Add new mappings
        for (const id in newEntityMapping) {
            mergedMapping[id] = newEntityMapping[id];
        }
        
        // First, update the state directly with the parsed entities
        // This creates a temporary state that processParsedEntities can use
        setState({ 
            entities: newEntities,
            entityMapping: mergedMapping
        }, false); // Don't notify subscribers yet - we'll do that after DOM update
        
        // Use our centralized function to process and apply the parsed entities
        const parsedEntities = { entities: newEntities };
        return processParsedEntities(parsedEntities, warnings, preservedIds);
    } catch (error) {
        console.error('Error parsing scene HTML:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Ensure scene has a default camera and lights
 * Helper function to make sure basic scene elements always exist
 * @param {Element} sceneEl - Scene element
 */
function ensureSceneDefaults(sceneEl) {
    // Get or create a camera
    if (!sceneEl.querySelector('#builder-camera')) {
        const camera = document.createElement('a-entity');
        camera.id = 'builder-camera';
        camera.setAttribute('camera', '');
        camera.setAttribute('position', '0 1.6 3');
        camera.setAttribute('look-controls', '');
        camera.setAttribute('wasd-controls', '');
        
        // Add cursor as child
        const cursor = document.createElement('a-cursor');
        camera.appendChild(cursor);
        
        sceneEl.appendChild(camera);
    }
    
    // Ensure default lighting exists
    if (!sceneEl.querySelector('#default-light')) {
        const ambientLight = document.createElement('a-entity');
        ambientLight.id = 'default-light';
        ambientLight.setAttribute('light', 'type: ambient; color: #BBB');
        sceneEl.appendChild(ambientLight);
    }
    
    if (!sceneEl.querySelector('#directional-light')) {
        const dirLight = document.createElement('a-entity');
        dirLight.id = 'directional-light';
        dirLight.setAttribute('light', 'type: directional; color: #FFF; intensity: 0.6');
        dirLight.setAttribute('position', '-0.5 1 1');
        sceneEl.appendChild(dirLight);
    }
}

/**
 * Parse a vector attribute string into an object
 * @param {string} value - Vector string (e.g. "1 2 3")
 * @returns {Object} - Vector object (e.g. {x: 1, y: 2, z: 3})
 */
function parseVectorAttribute(value) {
    // Handle empty or undefined values
    if (!value || value === '') {
        return { x: 0, y: 0, z: 0 };
    }
    
    try {
        // Check if it's already an object
        if (typeof value === 'object' && value !== null) {
            // Make sure we have all coordinates
            return { 
                x: typeof value.x === 'number' ? value.x : 0, 
                y: typeof value.y === 'number' ? value.y : 0, 
                z: typeof value.z === 'number' ? value.z : 0 
            };
        }
        
        // Handle string format "x y z"
        if (typeof value === 'string') {
            // Split by whitespace and parse as numbers
            const parts = value.trim().split(/\s+/).map(v => {
                // Parse the value and handle NaN
                const parsed = parseFloat(v);
                return isNaN(parsed) ? 0 : parsed;
            });
            
            // Create vector object with defaults for missing components
            return { 
                x: parts[0] !== undefined ? parts[0] : 0, 
                y: parts[1] !== undefined ? parts[1] : 0, 
                z: parts[2] !== undefined ? parts[2] : 0 
            };
        }
        
        // Fallback for unknown formats
        console.warn('Unknown vector format:', value);
        return { x: 0, y: 0, z: 0 };
    } catch (error) {
        console.warn('Error parsing vector attribute:', error);
        return { x: 0, y: 0, z: 0 };
    }
}

/**
 * Set up editor event listeners
 */
function setupEditorEvents() {
    if (!editor) return;
    
    // Add change event listener
    editor.onDidChangeModelContent(handleEditorChange);
    
    console.log('Editor events configured');
}

/**
 * Set the editor status display
 * @param {string} status - The status text to display
 */
function setEditorStatus(status) {
    const statusEl = document.getElementById('editor-status');
    if (!statusEl) return;
    
    // Update the status text
    statusEl.textContent = status;
    
    // Set appropriate class based on content
    if (status.toLowerCase().includes('error')) {
        statusEl.className = 'status-error';
    } else if (status.toLowerCase().includes('synced')) {
        statusEl.className = 'status-saved';
    } else {
        statusEl.className = '';
    }
}

/**
 * Generate HTML representation of the current state
 * @param {Object} state - The application state
 * @returns {string} HTML representation of the scene
 */
function generateHTMLFromState(state) {
    // Use the existing function to get the HTML from the state
    return getSceneHTML();
}

/**
 * Set up synchronization from inspector to editor
 * This ensures that inspector changes are properly reflected in the editor
 */
export function setupStateToEditorSync() {
    console.log('[DEBUG] Setting up improved state-to-editor synchronization');
    
    // Store pre-inspector state to detect real changes
    let preInspectorState = null;
    
    // Listen for inspector events at the document level
    document.addEventListener('inspector-opened', () => {
        console.log('[DEBUG] Inspector opened event captured in monaco sync');
        // Save current state
        preInspectorState = getState();
        console.log('[DEBUG] Saved pre-inspector state for comparison:', preInspectorState);
    });
    
    document.addEventListener('inspector-closed', () => {
        console.log('[DEBUG] Inspector closed event captured in monaco sync');
        
        // Add a delay to ensure state has been updated by the time we check
        setTimeout(() => {
            const currentState = getState();
            console.log('[DEBUG] Current state after inspector closed:', currentState);
            
            // Force update the Monaco editor
            updateMonacoEditor(true);
            
            // Log the action for tracking
            import('./debug.js').then(debug => {
                debug.logAction('Monaco editor updated from inspector changes');
            });
        }, 500);
    });
    
    // Listen for the custom event that signals inspector changes have been applied
    document.addEventListener('inspector-changes-applied', (event) => {
        console.log('[DEBUG] Inspector changes applied event received:', event.detail);
        
        // Immediately force an update to the Monaco editor
        setTimeout(() => {
            updateMonacoEditor(true);
            console.log('[DEBUG] Monaco editor updated from inspector-changes-applied event');
        }, 300);
    });
    
    // Listen for watcher updates
    document.addEventListener('watcher-changes-saved', (event) => {
        console.log('[DEBUG] Watcher changes saved event received');
        
        // Force update the Monaco editor with the latest state
        setTimeout(() => {
            updateMonacoEditor(true);
            console.log('[DEBUG] Monaco editor updated from watcher-changes-saved event');
        }, 300);
    });
    
    // Also subscribe to state changes to update Monaco when entities change
    subscribe((newState, changes) => {
        if (changes.entities) {
            console.log('[DEBUG] Entity changes detected in state, updating Monaco editor');
            // Use slight delay to ensure all state updates are complete
            setTimeout(() => {
                updateMonacoEditor(true);
            }, 200);
        }
    });
}

/**
 * Process parsed entities from editor
 * @param {Object} parsedEntities - Parsed entities
 * @param {Array} warnings - Warnings array
 * @param {Array} preservedIds - Array of preserved IDs
 * @returns {Promise<Object>} Result object
 */
async function processParsedEntities(parsedEntities, warnings, preservedIds) {
    try {
        // Get the entity-api module for recreation
        const entityApi = await import('./entity-api.js');
        
        // Recreate entities from the new state
        const newEntities = parsedEntities.entities;
        console.log('Recreating entities from parsed state:', newEntities);
        
        // Use recreateAllEntities from entity-api.js
        const success = await entityApi.recreateAllEntities(newEntities);
        
        if (success) {
            // If we have a watcher, use it to get the final state from the updated DOM
            if (window.watcher) {
                // Load utils now so it's available in the timeout
                const utils = await import('./utils.js');
                
                // Short delay to allow entities to be fully processed by A-Frame
                setTimeout(() => {
                    window.watcher.saveEntitiesToState('monaco-editor');
                    
                    // Update the editor status to show success
                    if (warnings.length > 0) {
                        console.warn('Applied changes with warnings:', warnings);
                        updateEditorStatus('ready', 'Changes applied with warnings');
                    } else if (preservedIds.length > 0) {
                        // Provide feedback about preserved IDs
                        const idStr = preservedIds.length > 3 
                            ? `${preservedIds.slice(0, 3).join(', ')}... (${preservedIds.length} total)`
                            : preservedIds.join(', ');
                        updateEditorStatus('ready', `Changes applied, IDs preserved: ${idStr}`);
                        
                        // Show a notification - utils is already loaded
                        if (utils.showNotification) {
                            utils.showNotification(
                                `Custom IDs preserved: ${preservedIds.join(', ')}`,
                                'success'
                            );
                        }
                    } else {
                        updateEditorStatus('ready', 'Changes applied successfully');
                    }
                    
                    // Force editor content to refresh with updated UUIDs after a delay
                    setTimeout(() => updateMonacoEditor(true), 500);
                }, 300);
            } else {
                // Watcher is required - no fallback
                const error = new Error('Watcher is required but not available for Monaco editor updates');
                console.error(error);
                updateEditorStatus('error', 'Error: Watcher not available');
                throw error;
            }
        } else {
            console.error('Failed to recreate entities from state');
            updateEditorStatus('error', 'Error: Recreation failed');
            return { success: false, error: 'Entity recreation failed' };
        }
        
        return { success: true };
    } catch (error) {
        console.error('Error processing parsed entities:', error);
        updateEditorStatus('error', 'Error: ' + error.message);
        return { success: false, error: error.message };
    }
}

// Export for use in other modules
export { 
    updateEditorStatus
}; 



