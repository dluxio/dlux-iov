/**
 * Monaco.js - Monaco editor integration and synchronization
 */

import { getState, setState, subscribe } from './state.js';
import { recreateEntitiesFromState } from './entities.js';
import { generateEntitiesHTML } from './entities.js';
import { logAction } from './debug.js';

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
 * Apply editor content to the scene
 * @param {string} content - Optional content to use instead of current editor content
 * @returns {Object} Result object with success status, warning, and error messages
 */
export function applyEditorContent(content) {
    console.log('Applying editor content to scene...');
    
    try {
        // Use provided content or get from editor
        const htmlContent = content || getEditorContent();
        
        if (!htmlContent || !htmlContent.trim()) {
            console.error('Cannot apply empty content');
            updateEditorStatus('error', 'Empty content');
            return { success: false, error: 'Empty content' };
        }
        
        // Parse the HTML content
        const result = parseSceneHTML(htmlContent);
        
        if (result.success) {
            updateEditorStatus('ready', 'Changes applied');
            return { success: true };
        } else if (result.partialSuccess) {
            // If some updates worked but there were issues
            updateEditorStatus('ready', 'Changes applied with warnings');
            return { 
                success: true, 
                warning: result.warning || 'Some changes applied with warnings'
            };
        } else {
            updateEditorStatus('error', result.error || 'Failed to apply changes');
            return { 
                success: false, 
                error: result.error || 'Failed to apply changes'
            };
        }
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
 * Update the Monaco editor with the current scene
 * @param {boolean} [force=false] Force update even if isUpdating flag is set
 * @returns {boolean} Whether the update was successful
 */
export function updateMonacoEditor(force = false) {
    try {
        console.log('Updating Monaco editor with current scene...');
        
        if (!editor) {
            console.error('Monaco editor not initialized yet');
            return false;
        }
        
        // Skip update if already updating, unless forced
        if (isUpdating && !force) {
            console.log('Skipping editor update - already updating');
            return false;
        }
        
        // Set flag to prevent circular updates
        isUpdating = true;
        
        // Get HTML from the current scene
        const sceneHTML = getSceneHTML();
        console.log('Scene HTML for editor update:', sceneHTML);
        
        // Update the editor content
        editor.setValue(sceneHTML);
        
        // Clear the updating flag after a short delay
        setTimeout(() => {
            isUpdating = false;
            updateEditorStatus('ready');
        }, 100);
        
        return true;
    } catch (error) {
        console.error('Error updating Monaco editor:', error);
        isUpdating = false;
        updateEditorStatus('error', 'Failed to update editor');
        return false;
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
 * Get the current HTML from the A-Frame scene
 * @returns {string} HTML representation of the scene
 */
function getSceneHTML() {
    try {
        console.log('Generating clean scene HTML...');
        
        // Get the scene element
        const scene = document.querySelector('a-scene');
        if (!scene) {
            console.warn('No a-scene element found for HTML generation');
            return generateDefaultSceneHTML();
        }
        
        // Start with the basic scene structure
        let sceneHTML = '<a-scene>\n';
        
        // Add assets section
        sceneHTML += '  <!-- Assets -->\n';
        sceneHTML += '  <a-assets>\n';
        
        // System templates that should be in the assets section but hidden from user
        const systemTemplates = ['avatar-template', 'state-template'];
        
        const assets = scene.querySelector('a-assets');
        if (assets) {
            // Get all templates, but filter out system templates
            const templates = assets.querySelectorAll('template');
            templates.forEach(template => {
                // Skip system templates - they exist but are not shown to the user
                if (systemTemplates.includes(template.id)) {
                    return;
                }
                
                // Add user-defined templates
                sceneHTML += `    ${template.outerHTML}\n`;
            });
        }
        
        // Close assets section
        sceneHTML += '  </a-assets>\n\n';
        
        // Add builder camera - handle special case to avoid duplicate camera attributes
        const camera = scene.querySelector('#builder-camera');
        if (camera) {
            // We'll manually handle the camera attribute to prevent duplication
            const cameraAttrs = attributesToString(camera, ['camera']);
            
            sceneHTML += '  <!-- Builder Camera (persistent) -->\n';
            sceneHTML += `  <a-entity id="builder-camera" camera${cameraAttrs}>\n`;
            sceneHTML += '    <a-cursor></a-cursor>\n';
            sceneHTML += '  </a-entity>\n\n';
        } else {
            // Add default camera if none exists
            sceneHTML += '  <!-- Builder Camera (persistent) -->\n';
            sceneHTML += '  <a-entity id="builder-camera" camera position="0 1.6 3" look-controls wasd-controls>\n';
            sceneHTML += '    <a-cursor></a-cursor>\n';
            sceneHTML += '  </a-entity>\n\n';
        }
        
        // Add environment section
        sceneHTML += '  <!-- Environment -->\n';
        
        // Handle Sky - use cleanEntityHTML for consistency
        const sky = scene.querySelector('a-sky');
        if (sky) {
            // Ensure sky has an ID
            const skyId = sky.id || 'sky';
            
            // If sky doesn't have an ID in the DOM, add one to ensure consistency
            if (!sky.id) {
                sky.id = skyId;
            }
            
            // Use the same clean entity approach for the sky as for other entities
            sceneHTML += `  ${cleanEntityHTML(sky)}\n`;
        } else {
            sceneHTML += '  <a-sky id="sky" color="#ECECEC"></a-sky>\n';
        }
        
        // Add lighting
        const defaultLight = scene.querySelector('#default-light');
        if (defaultLight) {
            sceneHTML += `  ${cleanEntityHTML(defaultLight)}\n`;
        } else {
            sceneHTML += '  <a-entity id="default-light" light="type: ambient; color: #BBB"></a-entity>\n';
        }
        
        const directionalLight = scene.querySelector('#directional-light');
        if (directionalLight) {
            sceneHTML += `  ${cleanEntityHTML(directionalLight)}\n`;
        } else {
            sceneHTML += '  <a-entity id="directional-light" light="type: directional; color: #FFF; intensity: 0.6" position="-0.5 1 1"></a-entity>\n';
        }
        
        sceneHTML += '\n  <!-- User Entities -->\n';
        
        // Get all user-created entities (exclude system entities, sky, and templates)
        const systemEntityIds = ['builder-camera', 'default-light', 'directional-light', 'sky'];
        const entities = Array.from(scene.querySelectorAll('[id]')).filter(entity => {
            // Skip elements with null/undefined/empty ID (shouldn't happen but just in case)
            if (!entity.id) return false;
            
            // Skip system entities
            if (systemEntityIds.includes(entity.id)) return false;
            
            // Skip the sky if it was already handled
            if (entity.tagName.toLowerCase() === 'a-sky') return false;
            
            // Skip template elements
            if (entity.tagName.toLowerCase() === 'template') return false;
            
            // Skip A-Frame's injected elements
            if (entity.hasAttribute('aframe-injected')) return false;
            
            // Skip the canvas and assets section 
            if (entity.tagName.toLowerCase() === 'canvas' || 
                entity.tagName.toLowerCase() === 'a-assets') return false;
            
            return true;
        });
        
        // Add the remaining user entities
        entities.forEach(entity => {
            sceneHTML += `  ${cleanEntityHTML(entity)}\n`;
        });
        
        sceneHTML += '</a-scene>';
        
        return sceneHTML;
    } catch (error) {
        console.error('Error getting scene HTML:', error);
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
                const formattedValue = `${parsedValue.x.toFixed(3)} ${parsedValue.y.toFixed(3)} ${parsedValue.z.toFixed(3)}`;
                // Remove trailing zeros
                const cleanValue = formattedValue.replace(/\.?0+(\s|$)/g, '$1').trim();
                attrString += ` ${attr.name}="${cleanValue}"`;
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
 * Clean an entity's HTML by removing unnecessary attributes
 * @param {Element} entity - The entity element
 * @returns {string} - Clean HTML representation of the entity
 */
function cleanEntityHTML(entity) {
    const tagName = entity.tagName.toLowerCase();
    const id = entity.id;
    
    // Special handling for sky element to ensure color is included
    if (tagName === 'a-sky') {
        // Get color attribute or use default
        const color = entity.getAttribute('color') || '#ECECEC';
        return `<a-sky id="${id}" color="${color}"></a-sky>`;
    }
    
    // Standard handling for other entities
    const attrs = attributesToString(entity);
    return `<${tagName} id="${id}"${attrs}></${tagName}>`;
}

/**
 * Generate default scene HTML when the actual scene isn't available
 * @returns {string} Default scene HTML
 */
function generateDefaultSceneHTML() {
    return `<a-scene>
  <!-- Default scene content -->
  <a-entity id="default-light" light="type: ambient; color: #BBB"></a-entity>
  <a-entity id="directional-light" light="type: directional; color: #FFF; intensity: 0.6" position="-0.5 1 1"></a-entity>
  <a-sky id="sky" color="#ECECEC"></a-sky>
</a-scene>`;
}

/**
 * Generate the full scene HTML from the current state
 * @returns {string} - HTML representation of the scene
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
  <a-sky id="sky" color="#ECECEC"></a-sky>
  <a-entity id="default-light" light="type: ambient; color: #BBB"></a-entity>
  <a-entity id="directional-light" light="type: directional; color: #FFF; intensity: 0.6" position="-0.5 1 1"></a-entity>

  <!-- User Entities -->
${entitiesHTML}</a-scene>`;

    return sceneHTML;
}

/**
 * Parse scene HTML and update the state
 * @param {string} html - Scene HTML to parse
 * @returns {Object} - Success status and any error
 */
function parseSceneHTML(html) {
    console.log('Parsing scene HTML from editor...');
    
    try {
        // Import utils for warnings
        import('./utils.js').then(utils => {
            if (utils.showWarning) {
                window.showSceneWarning = utils.showWarning;
            }
        }).catch(err => {
            console.error('Error importing utils for warnings:', err);
        });
        
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
        
        // Check specifically for sky element
        const skyElement = sceneEl.querySelector('a-sky');
        if (skyElement) {
            console.log('Found sky element in editor HTML:', 
                        skyElement.outerHTML, 
                        'with color:', 
                        skyElement.getAttribute('color'));
            // Ensure sky has an ID
            if (!skyElement.id) {
                skyElement.id = 'sky';
                console.log('Added ID to sky element:', skyElement.outerHTML);
            }
        } else {
            console.warn('No sky element found in editor HTML, will need to create one');
        }
        
        // Track warnings for partial success
        const warnings = [];
        
        // Check for entities that might fall through the floor (y=0 or very low)
        const potentialFallingEntities = Array.from(sceneEl.querySelectorAll('[position]')).filter(el => {
            if (el.tagName.toLowerCase() === 'a-plane') return false; // Planes are usually at y=0
            if (el.tagName.toLowerCase() === 'a-sky') return false; // Sky doesn't need position
            
            const position = el.getAttribute('position');
            if (!position) return false;
            
            try {
                // Parse position
                const posStr = position.trim().split(/\s+/);
                const y = parseFloat(posStr[1]);
                
                // Check if y is very low (might fall through floor)
                return !isNaN(y) && y < 0.1;
            } catch (e) {
                return false;
            }
        });
        
        if (potentialFallingEntities.length > 0) {
            const warningMsg = `${potentialFallingEntities.length} entities have very low Y position values and might fall through the floor.`;
            warnings.push(warningMsg);
            
            // Show warning to user if helper is available
            if (window.showSceneWarning) {
                window.showSceneWarning(warningMsg);
            }
            
            console.warn(warningMsg, potentialFallingEntities);
        }
        
        // Ensure system templates are preserved in the assets section
        ensureSystemTemplates(sceneEl);
        
        // Extract user-defined entities (exclude system entities)
        const entities = {};
        const systemEntityIds = ['builder-camera', 'default-light', 'directional-light', 'sky'];
        
        // Process ALL a-* primitives (including a-sky, a-box, etc.)
        processAllPrimitives(sceneEl, entities, warnings, systemEntityIds);
        
        console.log('Parsed entities from editor:', entities);
        
        // Check if sky was processed
        if (entities['sky']) {
            console.log('Sky entity was successfully processed:', entities['sky']);
        } else {
            console.warn('Sky entity not found in processed entities!');
            if (skyElement) {
                console.warn('This is unexpected since a sky element was found in the HTML!');
            }
        }
        
        if (Object.keys(entities).length === 0) {
            console.warn('No entities found in editor HTML');
            warnings.push('No entities found in editor HTML');
        }
        
        // Update state with new entities
        setState({ entities });
        
        // Recreate entities in the scene
        try {
            import('./entities.js').then(entitiesModule => {
                console.log('Recreating entities in scene from editor changes');
                entitiesModule.recreateEntitiesFromState(entities);
                
                // Update the editor status to show success
                if (warnings.length > 0) {
                    console.warn('Applied changes with warnings:', warnings);
                    updateEditorStatus('ready', 'Changes applied with warnings');
                } else {
                    updateEditorStatus('ready', 'Changes applied successfully');
                }
                
                // Force editor content to refresh
                setTimeout(() => updateMonacoEditor(true), 500);
            }).catch(err => {
                console.error('Error importing entities module:', err);
                updateEditorStatus('error', 'Error recreating entities: ' + err.message);
                return {
                    success: false,
                    error: 'Failed to import entities module: ' + err.message
                };
            });
        } catch (error) {
            console.error('Error recreating entities from editor:', error);
            updateEditorStatus('error', 'Error recreating entities: ' + error.message);
            return {
                success: false,
                error: 'Failed to update scene with editor changes: ' + error.message
            };
        }
        
        return warnings.length > 0 
            ? {
                partialSuccess: true,
                success: false,
                warning: warnings.join('; ')
              }
            : {
                success: true
              };
    } catch (error) {
        console.error('Error parsing scene HTML:', error);
        return {
            success: false,
            error: 'Error parsing scene HTML: ' + error.message
        };
    }
}

/**
 * Ensure system templates are present in the scene
 * @param {Element} sceneEl - Scene element
 */
function ensureSystemTemplates(sceneEl) {
    // List of system templates that should always be present
    const requiredTemplates = {
        'avatar-template': `<template id="avatar-template">
      <a-entity class="avatar">
        <a-sphere class="head" color="#5985ff" scale="0.45 0.5 0.4"></a-sphere>
        <a-entity class="face" position="0 0.05 0.25">
          <a-sphere class="eye" color="#efefef" position="-0.16 0.1 0"></a-sphere>
          <a-sphere class="eye" color="#efefef" position="0.16 0.1 0"></a-sphere>
        </a-entity>
      </a-entity>
    </template>`,
        'state-template': `<template id="state-template">
      <a-entity class="state-container">
        <a-entity state-data=""></a-entity>
      </a-entity>
    </template>`
    };
    
    // Get or create assets section
    let assetsEl = sceneEl.querySelector('a-assets');
    if (!assetsEl) {
        assetsEl = document.createElement('a-assets');
        sceneEl.prepend(assetsEl);
    }
    
    // Ensure each required template exists
    Object.entries(requiredTemplates).forEach(([id, html]) => {
        if (!assetsEl.querySelector(`#${id}`)) {
            console.log(`Adding missing system template: ${id}`);
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html.trim();
            assetsEl.appendChild(tempDiv.firstChild);
        }
    });
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
 * Process all A-Frame primitives in the scene and add them to the entities object
 * @param {Element} sceneEl - Scene element
 * @param {Object} entities - Entities object to populate
 * @param {Array} warnings - Array to collect warnings
 * @param {Array} systemEntityIds - IDs of system entities to skip
 */
function processAllPrimitives(sceneEl, entities, warnings, systemEntityIds) {
    // Find all a-* elements (primitives) in the scene
    const primitives = sceneEl.querySelectorAll('[id]');
    const processedIds = new Set();
    
    // First, handle sky element specially to ensure it's included
    const skyElement = sceneEl.querySelector('a-sky');
    if (skyElement) {
        try {
            // If sky doesn't have an ID, give it one
            if (!skyElement.id) {
                skyElement.id = 'sky';
            }
            
            // Process the sky element, even though it's a system entity
            processPrimitive(skyElement, entities, processedIds);
            
            console.log(`Sky element processed with ID: ${skyElement.id}`);
        } catch (error) {
            console.warn('Error processing sky element:', error);
            warnings.push(`Error processing sky element: ${error.message}`);
        }
    } else {
        console.log('No sky element found in the scene');
    }
    
    // Process other primitives with IDs
    primitives.forEach(primitive => {
        const id = primitive.id;
        
        // Skip if already processed
        if (processedIds.has(id)) return;
        
        // Skip system entities (except sky which was handled above)
        if (systemEntityIds.includes(id) && id !== 'sky') return;
        
        // Skip template elements
        if (primitive.tagName.toLowerCase() === 'template') return;
        
        // Skip elements inside a-assets
        if (primitive.closest('a-assets')) return;
        
        // Skip A-Frame's injected elements
        if (primitive.hasAttribute('aframe-injected')) return;
        
        // Skip special elements like canvas
        if (primitive.tagName.toLowerCase() === 'canvas') return;
        
        // Only process A-Frame primitives (elements with a- prefix)
        if (!primitive.tagName.toLowerCase().startsWith('a-')) return;
        
        // Try to process this primitive
        try {
            processPrimitive(primitive, entities, processedIds);
        } catch (error) {
            console.warn(`Error processing primitive ${id}:`, error);
            warnings.push(`Error processing primitive ${id}: ${error.message}`);
        }
    });
    
    // Now look for primitives without IDs and generate IDs for them
    // This ensures any other primitives without IDs are still processed
    
    // Get all elements in the scene
    const allElements = sceneEl.querySelectorAll('*');
    const primitivesWithoutIds = Array.from(allElements).filter(el => {
        // Only include elements with a- prefix
        if (!el.tagName.toLowerCase().startsWith('a-')) return false;
        
        // Skip elements with IDs (already processed)
        if (el.id) return false;
        
        // Skip elements inside a-assets
        if (el.closest('a-assets')) return false;
        
        // Skip A-Frame's injected elements
        if (el.hasAttribute('aframe-injected')) return false;
        
        // Skip template elements and canvas and assets
        const tagName = el.tagName.toLowerCase();
        return tagName !== 'template' && tagName !== 'canvas' && tagName !== 'a-assets';
    });
    
    primitivesWithoutIds.forEach(primitive => {
        try {
            // Generate a stable ID based on the primitive type
            const tagName = primitive.tagName.toLowerCase();
            const type = tagName.replace('a-', '');
            const generatedId = `${type}-${Math.floor(Math.random() * 10000000)}`;
            
            // Set the ID on the element
            primitive.id = generatedId;
            
            // Process the primitive
            processPrimitive(primitive, entities, processedIds);
        } catch (error) {
            console.warn(`Error processing primitive without ID:`, error);
            warnings.push(`Error processing primitive without ID: ${error.message}`);
        }
    });
}

/**
 * Process a single primitive element and add it to the entities object
 * @param {Element} primitive - Primitive element to process
 * @param {Object} entities - Entities object to populate
 * @param {Set} processedIds - Set of already processed IDs
 */
function processPrimitive(primitive, entities, processedIds) {
    const id = primitive.id;
    const tagName = primitive.tagName.toLowerCase();
    
    // Extract type from tag name (remove a- prefix)
    const type = tagName.startsWith('a-') ? tagName.substring(2) : tagName;
    
    console.log(`Processing primitive: ${id} (${tagName})`);
    
    // Create attributes object with correct type
    const attributes = { type };
    
    // Special handling for sky element - always include color attribute
    if (tagName === 'a-sky') {
        // Get color from element or use default
        const color = primitive.getAttribute('color') || '#ECECEC';
        attributes.color = color;
    }
    
    // Get all attributes
    Array.from(primitive.attributes).forEach(attr => {
        // Skip id attribute (handled separately)
        if (attr.name === 'id') return;
        
        // Skip empty values
        if (attr.value === '') return;
        
        // Skip A-Frame's auto-generated attributes
        if (attr.name.startsWith('data-') || 
            attr.name === 'geometry' || 
            attr.name === 'material' ||
            (attr.name === 'class' && attr.value === '')) {
            return;
        }
        
        try {
            // Special handling for vector attributes
            if (['position', 'rotation', 'scale'].includes(attr.name)) {
                attributes[attr.name] = parseVectorAttribute(attr.value);
            } 
            // Skip default values (for compact output)
            else if (attr.name === 'scale' && attr.value === '1 1 1') {
                return;
            }
            else if (attr.name === 'rotation' && attr.value === '0 0 0') {
                return;
            }
            else if (attr.name === 'position' && attr.value === '0 0 0') {
                return;
            }
            // We already handled the color attribute for sky above, so skip it here
            else if (tagName === 'a-sky' && attr.name === 'color') {
                return;
            }
            // For all other attributes, just add them
            else {
                attributes[attr.name] = attr.value;
            }
        } catch (err) {
            console.warn(`Error parsing attribute ${attr.name} for entity ${id}:`, err);
        }
    });
    
    // Add to entities
    entities[id] = attributes;
    processedIds.add(id);
    return id;
}

// Export for use in other modules
export { 
    updateEditorStatus
}; 



