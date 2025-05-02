/**
 * Monaco.js - Monaco editor integration and synchronization
 */

import { getState, setState, subscribe } from './state.js';
import { generateEntitiesHTML } from './entities.js';
import { logAction } from './debug.js';
import { generateEntityId, handleError, AppError, ErrorTypes, EventManager, showNotification } from './utils.js';
// Import recreateAllEntities function from entity-api.js instead
import { recreateAllEntities } from './entity-api.js';
import {
  shouldSkipAttribute,
  parseVector,
  vectorToString,
  extractGeometryData,
  cleanEntityData
} from './entity-utils.js';

import {
  VECTOR_ATTRIBUTES,
  COMPONENT_BASED_TYPES,
  VECTOR_DEFAULTS,
  GEOMETRY_DEFAULTS,
  LIGHT_DEFAULTS,
  UI_CONFIG,
  EDITOR_CONFIG,
  EXCLUDED_ATTRIBUTES,
  SYSTEM_ENTITY_IDS,
  SYSTEM_COMPONENTS,
  SYSTEM_DATA_ATTRIBUTES
} from './config.js';

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
const MAX_LOAD_ATTEMPTS = EDITOR_CONFIG.MAX_LOAD_ATTEMPTS;

// Add debounce timer variable
let editorUpdateDebounceTimer = null;
const EDITOR_UPDATE_DEBOUNCE_TIME = 300; // ms

// Flag to indicate that we only show level file entities in the editor
// Engine entities are managed separately
const LEVEL_FILE_ONLY = true;

/**
 * Default scene template
 */
const DEFAULT_SCENE_TEMPLATE = `<!-- Scene Template -->
<a-scene>
  <!-- Assets -->
  <a-assets>
    <!-- Add your assets here -->
  </a-assets>

  <!-- Environment -->
  <a-entity id="environment">
    <!-- Lighting -->
    <a-entity id="${SYSTEM_ENTITY_IDS[0]}" light="type: ambient; intensity: 0.5"></a-entity>
    <a-entity id="${SYSTEM_ENTITY_IDS[1]}" light="type: directional; intensity: 1; position: 1 1 1"></a-entity>
  </a-entity>

  <!-- Networked Avatar Template -->
  <template id="avatar-template">
    <a-entity>
      <a-entity camera look-controls wasd-controls></a-entity>
    </a-entity>
  </template>

  <!-- Networked A-Frame -->
  <a-entity id="naf-template" networked="template: #avatar-template; attachTemplateToLocal: true;"></a-entity>
</a-scene>`;

/**
 * Initialize the Monaco editor
 * @param {Function} callback - Callback to be called when initialization is complete
 */
function initMonacoEditor(callback) {
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
        const error = new AppError(ErrorTypes.SYSTEM, 'Monaco editor container element not found');
        handleError(error, 'Monaco Editor Initialization');
        isInitializing = false;
        if (callback) callback(false, error);
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
    
    // Configure Monaco environment for web workers before loading
    // Only if not already set up externally
    if (!window.MonacoEnvironment) {
        console.log('Setting up Monaco environment (not externally configured)');
        // Set up Monaco to work without workers
        window.MonacoEnvironment = {
            getWorkerUrl: function() {
                // Return empty worker - disables worker functionality
                return 'data:text/javascript;charset=utf-8,';
            }
        };
    } else {
        console.log('Using externally configured Monaco environment');
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
    
    // Wait for monaco-ready event with timeout
    const readyEventTimeout = setTimeout(() => {
        console.log('monaco-ready event timeout, proceeding with standard loading');
        window.removeEventListener('monaco-ready', monacoReadyHandler);
        attemptStandardLoading();
    }, EDITOR_CONFIG.READY_TIMEOUT);
    
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
                        waitSeconds: EDITOR_CONFIG.WAIT_SECONDS
                    });
                    
                    // Track this load attempt
                    loadAttempts++;
                    
                    // Try to load Monaco
                    require(['vs/editor/editor.main'], () => {
                        console.log('Monaco editor loaded successfully');
                        createEditor((success, error) => {
                            isInitializing = false;
                            if (callback) callback(success, error);
                        });
                    });
                } catch (error) {
                    console.error('Error loading Monaco:', error);
                    if (loadAttempts < EDITOR_CONFIG.MAX_LOAD_ATTEMPTS) {
                        console.log(`Retrying Monaco load (attempt ${loadAttempts + 1}/${EDITOR_CONFIG.MAX_LOAD_ATTEMPTS})...`);
                        setTimeout(attemptStandardLoading, EDITOR_CONFIG.INITIALIZATION_DELAY);
                    } else {
                        console.error('Failed to load Monaco editor after multiple attempts');
                        isInitializing = false;
                        if (callback) callback(false, new Error('Failed to load Monaco editor'));
                    }
                }
            } else {
                console.error('No module loader available for Monaco');
                isInitializing = false;
                if (callback) callback(false, new Error('No module loader available'));
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
            const error = new AppError(ErrorTypes.SYSTEM, 'Monaco editor container not found');
            handleError(error, 'Monaco Editor Creation');
            if (callback) callback(false, error);
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
        editor = monaco.editor.create(editorContainer, {
            value: sceneHTML,
            language: 'html',
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollbar: {
                vertical: 'visible',
                horizontal: 'visible'
            },
            fixedOverflowWidgets: true,
            height: '100%',
            width: '100%',
            // Disable features that rely on workers
            quickSuggestions: false,
            formatOnType: false,
            formatOnPaste: false,
            parameterHints: { enabled: false },
            folding: false,
            suggestOnTriggerCharacters: false,
            hover: { enabled: false },
            wordBasedSuggestions: false
        });
        
        // Force a resize after a short delay
        setTimeout(() => {
            editor.layout();
        }, 100);
        
        // Setup editor events
        setupEditorEvents();
        
        console.log('Monaco editor created successfully');
        
        // Call success callback
        if (callback) callback(true);
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
function getEditorContent() {
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
async function applyEditorContent(content) {
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
 * Updates the Monaco editor with current state
 * @param {Object|boolean} stateOrForce - Either the current state object or a boolean to force update
 */
function updateMonacoEditor(stateOrForce) {
    if (!editor) return;

    // Clear any existing debounce timer
    if (editorUpdateDebounceTimer) {
        console.log('[EDITOR UPDATE] Clearing previous update timer');
        clearTimeout(editorUpdateDebounceTimer);
    }

    // Set a new debounce timer
    editorUpdateDebounceTimer = setTimeout(() => {
        console.log('[EDITOR UPDATE] Executing debounced editor update');
        _performMonacoUpdate(stateOrForce);
        editorUpdateDebounceTimer = null;
    }, EDITOR_UPDATE_DEBOUNCE_TIME);
}

/**
 * Actually performs the Monaco editor update
 * @private
 */
function _performMonacoUpdate(stateOrForce) {
    // Check if editor is still available
    if (!editor) return;

    // Handle the case where a boolean is passed to force update
    const forceUpdate = typeof stateOrForce === 'boolean' ? stateOrForce : false;
    const state = typeof stateOrForce === 'object' ? stateOrForce : getState();

    // Get current HTML
    const currentHTML = editor.getValue();
    
    // Generate new HTML (now filtered to only include level file entities)
    const newHTML = generateHTMLFromState(state);
    
    // Only update if HTML has changed or force update is true
    if (currentHTML !== newHTML || forceUpdate) {
        console.log('[EDITOR UPDATE] Updating editor content');
        
        // Set flag to prevent circular updates
        isUpdating = true;
        
        // Store cursor position
        const position = editor.getPosition();
        
        // Update editor content
        editor.setValue(newHTML);
        
        // Restore cursor position if possible
        if (position) {
            editor.setPosition(position);
        }
        
        // Update status
        updateEditorStatus('synced with level file');
        
        // Reset flag after a short delay
        setTimeout(() => {
            isUpdating = false;
        }, 50);
    }

    // Update validation markers if there are errors
    if (state?.validation?.errors?.length > 0) {
        updateValidationMarkers(state.validation.errors);
    } else {
        clearValidationMarkers();
    }
}

/**
 * Updates validation markers in the editor
 * @param {string[]} errors - Array of error messages
 */
function updateValidationMarkers(errors) {
    if (!editor) return;

    // Clear existing markers
    clearValidationMarkers();

    // Add new markers
    const markers = errors.map(error => ({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 1,
        message: error,
        severity: monaco.MarkerSeverity.Error,
        source: 'Scene Validator'
    }));

    monaco.editor.setModelMarkers(editor.getModel(), 'scene-validator', markers);
}

/**
 * Clears validation markers from the editor
 */
function clearValidationMarkers() {
    if (!editor) return;
    monaco.editor.setModelMarkers(editor.getModel(), 'scene-validator', []);
}

/**
 * Generates HTML from state with validation
 * @param {Object} state - The current state
 * @returns {string} Generated HTML
 */
function generateHTMLFromState(state) {
    // Generate scene HTML focused on level file entities
    return generateSceneHTML();
}

/**
 * Check if the editor is initialized
 * @returns {boolean} True if editor is initialized
 */
function isEditorInitialized() {
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
function getEditorInstance() {
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
    const excludeAttrs = EXCLUDED_ATTRIBUTES;
    
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
    // Use generateSceneHTML for consistency
    return generateSceneHTML();
}

/**
 * Convert element attributes to string representation
 * @param {Element} element - DOM element
 * @param {Array<string>} [skipAttrs=[]] - Additional attributes to skip
 * @param {boolean} [compactOutput=true] - Whether to produce compact output
 * @returns {string} - Attribute string
 */
function attributesToString(element, skipAttrs = [], compactOutput = true) {
  let attrString = '';
  const tagName = element.tagName.toLowerCase();
  
  // Get all attributes
  Array.from(element.attributes).forEach(attr => {
    const name = attr.name;
    
    // Skip id and specified attributes
    if (name === 'id' || skipAttrs.includes(name)) return;
    
    // Skip internal attributes
    if (shouldSkipAttribute(name)) return;
    
    // Get attribute value
    let value = element.getAttribute(name);
    
    // Skip empty values
    if (value === null || value === undefined || value === '') return;
    
    // Skip default values if compact output is requested
    if (compactOutput) {
      if (name === 'scale' && value === vectorToString(VECTOR_DEFAULTS.scale)) return;
      if (name === 'rotation' && value === vectorToString(VECTOR_DEFAULTS.rotation)) return;
      if (name === 'position' && value === vectorToString(VECTOR_DEFAULTS.position)) return;
      if (tagName === 'a-sky' && name === 'color' && value === '#ECECEC') return;
    }
    
    // Format value based on type
    let formattedValue;
    if (VECTOR_ATTRIBUTES.includes(name)) {
      formattedValue = vectorToString(parseVector(value, name));
    } else if (typeof value === 'object') {
      formattedValue = JSON.stringify(value);
    } else {
      formattedValue = value.toString();
    }
    
    // Add attribute with proper quote handling
    const quoteChar = formattedValue.includes('"') ? "'" : '"';
    attrString += ` ${name}=${quoteChar}${formattedValue}${quoteChar}`;
  });
  
  return attrString;
}

/**
 * Generate default scene HTML when the state isn't available
 * @returns {string} Default scene HTML
 */
function generateDefaultSceneHTML() {
    // Use generateSceneHTML for consistency
    return generateSceneHTML();
}

/**
 * Generate HTML string for the full scene
 * @returns {string} HTML for the scene
 */
function generateSceneHTML() {
    // Get current state
    const state = getState();
    let entitiesHTML = '';
    let skyHTML = ''; // Separate variable for sky HTML
    let assetsHTML = ''; // Variable for all assets HTML
    let assetIds = new Set(); // Track asset IDs to avoid duplicates
    
    // Check if we have a level file loaded with entities
    if (state && state.entities) {
        // Only include entities that are explicitly in the level file
        // We can determine this by checking if they're not system entities
        const validEntities = {};
        
        // ONLY use state.sky, not entities[skyUuid]
        if (state && state.sky) {
            // Generate sky HTML directly from state.sky
            const skyConfig = state.sky;
            const skyProps = {
                'data-entity-uuid': skyConfig.uuid,
                'data-sky-type': skyConfig.type,
                id: 'sky'
            };
            
            // Generate asset HTML for image and video skies
            if (skyConfig.type === 'image' && skyConfig.data?.image) {
                // Create an asset ID
                const assetId = `sky-image-asset`;
                // Add the asset to the assets HTML
                assetsHTML += `    <img id="${assetId}" src="${skyConfig.data.image}" crossorigin="anonymous">\n`;
                // Set the src to reference the asset
                skyProps.src = `#${assetId}`;
                // Track this asset ID
                assetIds.add(assetId);
            } else if (skyConfig.type === 'video' && skyConfig.data?.video) {
                // Create an asset ID
                const assetId = `sky-video-asset`;
                // Add the asset to the assets HTML
                assetsHTML += `    <video id="${assetId}" src="${skyConfig.data.video}" crossorigin="anonymous" loop autoplay muted playsinline></video>\n`;
                // Set the src to reference the asset
                skyProps.src = `#${assetId}`;
                // Track this asset ID
                assetIds.add(assetId);
            } else if (skyConfig.type === 'color' && skyConfig.data?.color) {
                skyProps.color = skyConfig.data.color;
            }
            
            // Generate sky HTML with the collected properties
            skyHTML = generateSkyHTML(skyProps);
        } else {
            // If no sky in state, check if there's one in the scene as a fallback
            const skyElement = document.querySelector('a-sky, a-videosphere');
            if (skyElement) {
                // Create a representation of the sky for the editor
                const skyType = skyElement.getAttribute('data-sky-type') || 'color';
                const skyColor = skyElement.getAttribute('color') || '#87CEEB';
                
                const skyProps = {
                    type: 'sky',
                    color: skyColor,
                    'data-sky-type': skyType,
                    'data-entity-uuid': skyElement.dataset.entityUuid || generateEntityId('sky')
                };
                
                // Check if sky references an asset via src attribute
                const src = skyElement.getAttribute('src');
                if (src && src.startsWith('#')) {
                    // This references an asset, find the asset in the DOM
                    const assetId = src.substring(1);
                    const asset = document.querySelector(`#${assetId}`);
                    if (asset) {
                        if (asset.tagName.toLowerCase() === 'img') {
                            // It's an image asset
                            assetsHTML += `    <img id="${assetId}" src="${asset.getAttribute('src')}" crossorigin="anonymous">\n`;
                            skyProps.src = src;
                            // Track this asset ID
                            assetIds.add(assetId);
                        } else if (asset.tagName.toLowerCase() === 'video') {
                            // It's a video asset
                            assetsHTML += `    <video id="${assetId}" src="${asset.getAttribute('src')}" crossorigin="anonymous" loop autoplay muted playsinline></video>\n`;
                            skyProps.src = src;
                            // Track this asset ID
                            assetIds.add(assetId);
                        }
                    }
                }
                
                // Generate sky HTML directly
                skyHTML = generateSkyHTML(skyProps);
            }
        }
        
        // Process all entities and collect any assets they may reference
        Object.entries(state.entities).forEach(([uuid, entity]) => {
            // Skip system entities and sky entity (handled separately)
            if (!isSystemEntity(entity) && !isEngineEntity(entity, uuid) && entity.type !== 'sky') {
                validEntities[uuid] = entity;
                
                // Check for assets in the entity
                const entityAssets = findEntityAssets(entity);
                if (entityAssets.length > 0) {
                    entityAssets.forEach(assetInfo => {
                        // Only add if we haven't already added this asset
                        if (!assetIds.has(assetInfo.id)) {
                            assetsHTML += `    ${assetInfo.html}\n`;
                            assetIds.add(assetInfo.id);
                        }
                    });
                }
            }
        });
        
        // Generate HTML only for level file entities (excluding sky)
        if (Object.keys(validEntities).length > 0) {
            // Create a temporary state with only level file entities
            const tempState = {
                ...state,
                entities: validEntities
            };
            
            // Store the original state
            const originalState = getState();
            
            // Temporarily set state to our filtered version
            setState(tempState, false); // false to prevent triggering subscribers
            
            try {
                // Generate HTML from the filtered entities
                entitiesHTML = generateEntitiesHTML() || '\n';
            } finally {
                // Restore original state
                setState(originalState, false);
            }
        }
    }
    
    // Create the full scene HTML - now including all assets
    const sceneHTML = `<a-scene>
  <!-- Assets -->
  <a-assets>
    <!-- System templates are maintained internally but not shown in editor -->
${assetsHTML}  </a-assets>

  <!-- Level File Entities -->
${skyHTML}${entitiesHTML}

</a-scene>`;

    return sceneHTML;
}

/**
 * Generate the assets section HTML
 * @param {Object} assets - The assets object from state
 * @returns {string} HTML string for assets
 */
function generateAssetsHTML(assets) {
  if (!assets || Object.keys(assets).length === 0) {
    return '';
  }

  const assetElements = [];
  
  // Generate HTML for each asset
  Object.values(assets).forEach(asset => {
    if (!asset || !asset.id || !asset.src) return;
    
    // Create the appropriate asset element based on type
    switch (asset.type) {
      case 'image':
        assetElements.push(`    <img id="${asset.id}" src="${asset.src}" crossorigin="anonymous">`);
        break;
      case 'video':
        assetElements.push(`    <video id="${asset.id}" src="${asset.src}" crossorigin="anonymous" preload="auto" loop="true"></video>`);
        break;
      case 'audio':
        assetElements.push(`    <audio id="${asset.id}" src="${asset.src}" crossorigin="anonymous" preload="auto"></audio>`);
        break;
      case 'model':
        // For 3D models, we need to specify the format
        const format = asset.format || (asset.src.endsWith('.glb') ? 'glb' : 'gltf');
        assetElements.push(`    <a-asset-item id="${asset.id}" src="${asset.src}" response-type="${format}"></a-asset-item>`);
        break;
      default:
        console.warn(`Unknown asset type: ${asset.type} for asset ${asset.id}`);
    }
  });
  
  if (assetElements.length === 0) {
    return '';
  }
  
  return `  <a-assets>
${assetElements.join('\n')}
  </a-assets>`;
}

/**
 * Generate sky HTML based on sky configuration
 * @param {Object} skyConfig - Sky configuration from state
 * @returns {string} HTML string
 */
function generateSkyHTML(skyConfig) {
  if (!skyConfig) {
    return '';
  }

  const { type, data } = skyConfig;
  
  switch (type) {
    case 'color':
      return `  <a-sky color="${data.color || '#FFFFFF'}" data-sky-type="color"></a-sky>`;
    case 'image':
      if (data.assetId) {
        return `  <a-sky src="#${data.assetId}" data-sky-type="image"></a-sky>`;
      } else if (data.image) {
        return `  <a-sky src="${data.image}" data-sky-type="image"></a-sky>`;
      }
      return '';
    case 'video':
      if (data.assetId) {
        return `  <a-videosphere src="#${data.assetId}" data-sky-type="video"></a-videosphere>`;
      } else if (data.video) {
        return `  <a-videosphere src="${data.video}" data-sky-type="video"></a-videosphere>`;
      }
      return '';
    case 'environment':
      return `  <a-sky src="${data.environment}" data-sky-type="environment"></a-sky>`;
    case 'gradient':
      return `  <a-sky data-sky-type="gradient" material="shader: gradient; topColor: ${data.topColor || '#449bf2'}; bottomColor: ${data.bottomColor || '#8C4B3F'};"></a-sky>`;
    case 'none':
      return ''; // No sky
    default:
      return ''; // Default is no sky
  }
}

/**
 * Check if an entity is an engine entity (not part of the level file)
 * @param {Object} entity - Entity data
 * @param {string} uuid - Entity UUID
 * @returns {boolean} - True if this is an engine entity
 */
function isEngineEntity(entity, uuid) {
    if (!entity) return false;
    
    // Explicitly don't consider sky entities as engine entities
    if (entity.type === 'sky') {
        return false;
    }
    
    // Check if this entity has engine-specific components
    const engineComponents = [
        'networked',
        'avatar-rig',
        'player',
        'physics-system',
        'virtual-gamepad-controls',
        'device-orientation-permission-ui',
        'renderer-settings',
        'css-system'
    ];
    
    // Check for engine components
    for (const component of engineComponents) {
        if (entity[component] !== undefined) {
            return true;
        }
    }
    
    // Check for engine entity types
    const engineTypes = [
        'system',
        'avatar',
        'camera-rig',
        'networked-avatar'
    ];
    
    if (engineTypes.includes(entity.type)) {
        return true;
    }
    
    // Check for engine specific IDs
    if (entity.id && (
        entity.id.includes('camera') ||
        entity.id.includes('avatar') ||
        entity.id.includes('system') ||
        entity.id.includes('networked') ||
        entity.id.includes('physics-system')
    )) {
        return true;
    }
    
    // Check UUID patterns associated with engine entities
    if (uuid && (
        uuid.includes('camera') ||
        uuid.includes('avatar') ||
        uuid.includes('system') ||
        uuid.includes('networked')
    )) {
        return true;
    }
    
    return false;
}

/**
 * Get the UUID for the sky element
 * @returns {string} UUID for the sky element
 */
function getSkyUUID() {
    // First try to get it from the DOM
    const skyElement = document.querySelector('a-sky, a-videosphere');
    if (skyElement && skyElement.dataset.entityUuid) {
        return skyElement.dataset.entityUuid;
    }
    
    // If not found in DOM, try to find it in state
    const state = getState();
    if (state && state.entities) {
        for (const uuid in state.entities) {
            const entity = state.entities[uuid];
            if (entity.type === 'sky' || entity.type === 'videosphere') {
                return uuid;
            }
        }
    }
    
    // If state.sky exists and has a UUID, use that
    if (state && state.sky && state.sky.uuid) {
        return state.sky.uuid;
    }
    
    // As a fallback, generate a new one
    return generateEntityId('sky');
}

/**
 * Parse scene HTML and extract entities
 * @param {string} html - Scene HTML
 * @returns {Object} Parsed entities
 */
function parseSceneHTML(html) {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const scene = doc.querySelector('a-scene');
        
        if (!scene) {
            throw new AppError('No scene element found in HTML', ErrorTypes.PARSE_ERROR);
        }

        // Parse all entities
        const entities = {};
        
        // Get regular entities with data-entity-uuid
        const sceneEntities = scene.querySelectorAll('[data-entity-uuid]');
        
        sceneEntities.forEach(entity => {
            const uuid = entity.dataset.entityUuid;
            if (!uuid) return;
            
            const type = entity.tagName.toLowerCase().replace('a-', '');
            const properties = extractEntityAttributes(entity, type);
            
            // Clean up the properties
            const cleanedProperties = {};
            for (const [key, value] of Object.entries(properties)) {
                if (!EXCLUDED_ATTRIBUTES.includes(key)) {
                    cleanedProperties[key] = value;
                }
            }
            
            entities[uuid] = {
                type,
                ...cleanedProperties,
                uuid
            };
        });
        
        // Special handling for sky entities (both a-sky and a-videosphere)
        // This ensures sky entities are always included even if they don't have data-entity-uuid
        const skyEntities = scene.querySelectorAll('a-sky, a-videosphere');
        skyEntities.forEach(skyEntity => {
            // Skip if this entity was already processed (has data-entity-uuid and was included)
            const existingUuid = skyEntity.dataset.entityUuid;
            if (existingUuid && entities[existingUuid]) return;
            
            // Generate a new UUID if needed
            const skyUuid = existingUuid || generateEntityId('sky');
            
            // Extract the sky type
            let skyType = 'color'; // Default
            if (skyEntity.hasAttribute('data-sky-type')) {
                skyType = skyEntity.getAttribute('data-sky-type');
            } else if (skyEntity.tagName.toLowerCase() === 'a-videosphere') {
                skyType = 'video';
            } else if (skyEntity.hasAttribute('src')) {
                // Check if it's a texture/image
                const src = skyEntity.getAttribute('src');
                if (src && src.startsWith('#')) {
                    skyType = 'image'; // Assuming it's an image reference if it starts with #
                }
            }
            
            // Get properties
            const properties = extractEntityAttributes(skyEntity, skyEntity.tagName.toLowerCase().replace('a-', ''));
            
            // Clean properties
            const cleanedProperties = {};
            for (const [key, value] of Object.entries(properties)) {
                if (!EXCLUDED_ATTRIBUTES.includes(key)) {
                    cleanedProperties[key] = value;
                }
            }
            
            // Add to entities
            entities[skyUuid] = {
                type: skyEntity.tagName.toLowerCase().replace('a-', ''),
                ...cleanedProperties,
                uuid: skyUuid,
                'data-sky-type': skyType
            };
            
            // Add uuid attribute to the element if it doesn't have one
            if (!existingUuid) {
                skyEntity.dataset.entityUuid = skyUuid;
            }
        });
        
        return entities;
    } catch (error) {
        console.error('Error parsing scene HTML:', error);
        return {};
    }
}

// Helper function to check if an entity is a system entity
function isSystemEntity(entity) {
    if (!entity) return false;
    
    // Use engine manager if it's initialized
    const engineManagerModule = window.engineManager;
    if (engineManagerModule && engineManagerModule.initialized) {
        return engineManagerModule.isSystemEntity(entity);
    }
    
    // Legacy fallback behavior if engineManager is not available
    // This will eventually be removed
    
    // Check entity ID for avatar and camera related items
    const systemIds = ['local-avatar', 'avatar-rig', 'avatar-camera', 'camera'];
    if (entity.id && systemIds.some(id => entity.id.includes(id))) {
        console.log(`[Monaco] Found system entity with ID: ${entity.id}`);
        return true;
    }
    
    // Check if it's a sky entity - we don't consider sky or videosphere as system entities in Monaco
    // because we want them to be editable in the code panel
    if (window.skyManager && window.skyManager.isSkyEntity(entity)) return false;
    
    // Explicitly check for a-sky or a-videosphere and don't treat them as system entities
    const entityTagName = entity.tagName ? entity.tagName.toLowerCase() : '';
    if (entityTagName === 'a-sky' || entityTagName === 'a-videosphere') {
        return false;
    }
    
    // Check system entity IDs
    if (SYSTEM_ENTITY_IDS.includes(entity.id)) return true;
    
    // Check if entity has camera component
    if (entity.hasAttribute('camera')) {
        console.log(`[Monaco] Found system entity with camera component: ${entity.id}`);
        return true;
    }
    
    // Check for networked entities
    if (entity.hasAttribute('networked')) {
        console.log(`[Monaco] Found networked entity: ${entity.id}`);
        return true;
    }
    
    // Check entity UUID for avatar or camera patterns
    const uuid = entity.getAttribute('data-entity-uuid');
    if (uuid && (uuid.includes('avatar') || uuid.includes('camera') || uuid.includes('rig'))) {
        console.log(`[Monaco] Found system entity with system UUID: ${uuid}`);
        return true;
    }
    
    // Check system components
    const hasSystemComponent = SYSTEM_COMPONENTS.some(comp => entity.hasAttribute(comp));
    if (hasSystemComponent) return true;
    
    // Check system data attributes
    const hasSystemDataAttr = SYSTEM_DATA_ATTRIBUTES.some(attr => entity.hasAttribute(attr));
    if (hasSystemDataAttr) return true;
    
    return false;
}

/**
 * Ensure scene has default camera and lights
 * Helper function to make sure basic scene elements always exist
 * NOTE: Modified to be a no-op to prevent automatically adding entities
 * @param {Element} sceneEl - Scene element
 */
function ensureSceneDefaults(sceneEl) {
    // No-op - don't add default entities
    return;
}

/**
 * Set up editor event listeners
 */
function setupEditorEvents() {
    if (!editor) return;
    
    // Add change event listener
    editor.onDidChangeModelContent(handleEditorChange);
    
    // Note: We removed the toggle for engine components since we're
    // now only showing level file entities in the editor
    
    console.log('Editor events initialized');
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
 * Set up synchronization from inspector to editor
 * This ensures that inspector changes are properly reflected in the editor
 */
function setupStateToEditorSync() {
    console.log('[DEBUG] Setting up improved state-to-editor synchronization');
    
    // Create event manager instance
    const eventManager = new EventManager();
    
    // Store pre-inspector state to detect real changes
    let preInspectorState = null;
    
    // Listen for inspector events at the document level
    eventManager.addEventListener('inspector-opened', () => {
        console.log('[DEBUG] Inspector opened event captured in monaco sync');
        // Save current state
        preInspectorState = getState();
        console.log('[DEBUG] Saved pre-inspector state for comparison:', preInspectorState);
    });
    
    eventManager.addEventListener('inspector-closed', () => {
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
    eventManager.addEventListener('inspector-changes-applied', (event) => {
        console.log('[DEBUG] Inspector changes applied event received:', event.detail);
        
        // Immediately force an update to the Monaco editor
        setTimeout(() => {
            updateMonacoEditor(true);
            console.log('[DEBUG] Monaco editor updated from inspector-changes-applied event');
        }, 300);
    });
    
    // Listen for watcher updates
    eventManager.addEventListener('watcher-changes-saved', (event) => {
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
    
    // Return cleanup function
    return () => eventManager.removeAllListeners();
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
                // Short delay to allow entities to be fully processed by A-Frame
                setTimeout(() => {
                    // Flush all entity components to the DOM before saving state
                    const scene = document.querySelector('a-scene');
                    if (scene) {
                        const entities = scene.querySelectorAll('[data-entity-uuid]');
                        entities.forEach(entity => {
                            if (entity.components) {
                                Object.values(entity.components).forEach(component => {
                                    if (component.flushToDOM) {
                                        component.flushToDOM();
                                    }
                                });
                            }
                        });
                    }

                    window.watcher.saveEntitiesToState('monaco-editor');
                    
                    // Update the editor status to show success
                    if (warnings.length > 0) {
                        console.warn('Applied changes with warnings:', warnings);
                        updateEditorStatus('ready', 'Changes applied with warnings');
                        showNotification('Changes applied with warnings', {
                            type: 'warning',
                            duration: 5000,
                            showCloseButton: true
                        });
                    } else if (preservedIds.length > 0) {
                        // Provide feedback about preserved IDs
                        const idStr = preservedIds.length > 3 
                            ? `${preservedIds.slice(0, 3).join(', ')}... (${preservedIds.length} total)`
                            : preservedIds.join(', ');
                        updateEditorStatus('ready', `Changes applied, IDs preserved: ${idStr}`);
                        
                        showNotification(`Custom IDs preserved: ${idStr}`, {
                            type: 'success',
                            duration: 5000,
                            showCloseButton: true
                        });
                    } else {
                        updateEditorStatus('ready', 'Changes applied successfully');
                        showNotification('Changes applied successfully', {
                            type: 'success',
                            duration: 3000
                        });
                    }
                    
                    // Force editor content to refresh with updated UUIDs after a delay
                    setTimeout(() => updateMonacoEditor(true), 500);
                }, 300);
            } else {
                // Watcher is required - no fallback
                const error = new AppError(ErrorTypes.SYSTEM, 'Watcher is required but not available for Monaco editor updates');
                handleError(error, 'Monaco Editor Updates');
                updateEditorStatus('error', 'Error: Watcher not available');
                throw error;
            }
        } else {
            console.error('Failed to recreate entities from state');
            const error = new AppError(ErrorTypes.ENTITY, 'Entity recreation failed');
            handleError(error, 'Entity Recreation');
            updateEditorStatus('error', 'Error: Recreation failed');
            return { success: false, error: error.message };
        }
        
        return { success: true };
    } catch (error) {
        console.error('Error processing parsed entities:', error);
        handleError(error, 'Entity Processing');
        updateEditorStatus('error', 'Error: ' + error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Reset Monaco editor to minimal blank state
 * @param {boolean} [withDefaults=true] - Whether to include default elements like camera rig
 */
export function resetEditorToBlank(withDefaults = true) {
    console.log('[Monaco] Resetting editor to minimal blank state');
    
    // Basic template for a blank scene - no environment, sky, or lights
    // We also don't include the avatar rig in the editor as it's a system entity 
    // that should be filtered out from Monaco display
    const blankContent = `<a-scene>
  <a-assets>
    <!-- Assets go here -->
  </a-assets>

  <!-- Empty scene - create entities as needed -->
</a-scene>`;

    // Update the editor content
    if (editor) {
        // Flag to prevent event handler from updating state
        isUpdating = true;
        
        try {
            editor.setValue(blankContent);
            editor.getAction('editor.action.formatDocument')?.run();
            
            // Update editor status to show it's been reset
            updateEditorStatus('ready', 'Blank scene loaded');
        } catch (err) {
            console.error('[Monaco] Error resetting editor:', err);
        } finally {
            // Remove the flag after a short delay
            setTimeout(() => {
                isUpdating = false;
            }, 100);
        }
    } else {
        console.warn('[Monaco] Cannot reset editor - editor instance not available');
        
        // Create editor instance if missing - this prevents repeated warnings
        createEditor((createdEditor) => {
            if (createdEditor) {
                console.log('[Monaco] Created editor instance on demand');
                editor = createdEditor;
                
                // Set content in the newly created editor
                editor.setValue(blankContent);
                editor.getAction('editor.action.formatDocument')?.run();
                updateEditorStatus('ready', 'Editor created and blank scene loaded');
            } else {
                console.error('[Monaco] Failed to create editor instance on demand');
            }
        });
    }
    
    // Notify listeners that the editor has been reset
    document.dispatchEvent(new CustomEvent('monaco-reset', {
        detail: { withDefaults }
    }));
}

// Export all necessary functions
export { 
    updateEditorStatus,
    getEditorContent,
    applyEditorContent,
    isEditorInitialized,
    getEditorInstance,
    initMonacoEditor,
    setupStateToEditorSync,
    updateMonacoEditor,
    generateHTMLFromState,
    getSceneHTML,
    generateSceneHTML,
    getSkyUUID,
    parseSceneHTML,
    processParsedEntities,
    cleanEntityHTML,
    attributesToString,
    generateDefaultSceneHTML,
    handleEditorChange,
    setEditorStatus
}; 

/**
 * Find any assets referenced by an entity
 * @param {Object} entity - Entity to check for assets
 * @returns {Array} Array of asset objects with id and html properties
 */
function findEntityAssets(entity) {
    const assets = [];
    
    // Check common attributes that might reference assets
    const assetAttributes = ['src', 'material.src', 'map', 'environment', 'texture'];
    
    assetAttributes.forEach(attrPath => {
        // Handle nested attributes like material.src
        const parts = attrPath.split('.');
        let value = entity;
        
        // Navigate to the nested property if needed
        for (const part of parts) {
            if (value && typeof value === 'object') {
                value = value[part];
            } else {
                value = null;
                break;
            }
        }
        
        // If we have a value and it starts with # (asset reference)
        if (value && typeof value === 'string' && value.startsWith('#')) {
            const assetId = value.substring(1);
            
            // Try to find the actual asset in the DOM
            const assetEl = document.querySelector(`#${assetId}`);
            if (assetEl) {
                const tagName = assetEl.tagName.toLowerCase();
                
                // Generate appropriate HTML based on tag name
                if (tagName === 'img') {
                    assets.push({
                        id: assetId,
                        html: `<img id="${assetId}" src="${assetEl.getAttribute('src')}" crossorigin="anonymous">`
                    });
                } else if (tagName === 'video') {
                    assets.push({
                        id: assetId,
                        html: `<video id="${assetId}" src="${assetEl.getAttribute('src')}" crossorigin="anonymous" loop autoplay muted playsinline></video>`
                    });
                } else if (tagName === 'audio') {
                    assets.push({
                        id: assetId,
                        html: `<audio id="${assetId}" src="${assetEl.getAttribute('src')}" crossorigin="anonymous"></audio>`
                    });
                } else {
                    // Generic asset-item for other types
                    const src = assetEl.getAttribute('src');
                    if (src) {
                        assets.push({
                            id: assetId,
                            html: `<a-asset-item id="${assetId}" src="${src}"></a-asset-item>`
                        });
                    }
                }
            }
        }
    });
    
    return assets;
}

/**
 * Find assets referenced by entities in the scene
 * @param {Object} entities - Entities object from state
 * @returns {Array} Array of asset IDs referenced by entities
 */
function findReferencedAssets(entities) {
  const referencedAssets = new Set();
  
  // Look through all entities for src attributes that reference assets
  Object.values(entities).forEach(entity => {
    if (!entity) return;
    
    // Check for src attribute with # prefix (asset reference)
    if (entity.src && typeof entity.src === 'string' && entity.src.startsWith('#')) {
      const assetId = entity.src.substring(1); // Remove the # prefix
      referencedAssets.add(assetId);
    }
    
    // Check for material.src that might reference assets
    if (entity.material && entity.material.src && typeof entity.material.src === 'string' && entity.material.src.startsWith('#')) {
      const assetId = entity.material.src.substring(1);
      referencedAssets.add(assetId);
    }
    
    // Check for assetId property that directly references an asset
    if (entity.assetId) {
      referencedAssets.add(entity.assetId);
    }
  });
  
  return Array.from(referencedAssets);
}

/**
 * Generate A-Frame HTML from state
 * @param {Object} state - Application state object
 * @returns {string} A-Frame HTML
 */
export function generateHTML(state) {
  // Start with document structure
  const lines = [
    '<!DOCTYPE html>',
    '<html>',
    '<head>',
    '  <meta charset="utf-8">',
    '  <title>A-Frame Scene</title>',
    '  <meta name="description" content="Generated A-Frame Scene">',
    '  <script src="https://aframe.io/releases/1.4.0/aframe.min.js"></script>',
    '</head>',
    '<body>',
    '  <a-scene>'
  ];
  
  // Add assets section if we have assets
  const assetsHTML = generateAssetsHTML(state.assets);
  if (assetsHTML) {
    lines.push(assetsHTML);
  }

  // Add sky
  const skyHTML = generateSkyHTML(state.sky);
  if (skyHTML) {
    lines.push(skyHTML);
  }
  
  // Generate environment
  const environmentHTML = generateEnvironmentHTML(state.environment);
  if (environmentHTML) {
    lines.push(environmentHTML);
  }
  
  // Generate each entity
  Object.values(state.entities).forEach(entity => {
    const entityHTML = generateEntityHTML(entity);
    if (entityHTML) {
      lines.push(`  ${entityHTML}`);
    }
  });
  
  // Close document
  lines.push('  </a-scene>',
    '</body>',
    '</html>'
  );
  
  return lines.join('\n');
}



