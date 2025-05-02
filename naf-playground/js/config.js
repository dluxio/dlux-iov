/**
 * Configuration constants for entity handling
 */

// Import required utilities
import { generateEntityId } from './utils.js';

// Entity Types
export const SYSTEM_ENTITY_TYPES = {
  CAMERA: 'camera',
  CURSOR: 'cursor',
  TEMPLATE: 'template'
};

// System Entity IDs that should be filtered out
export const SYSTEM_ENTITY_IDS = [
  'local-avatar',
  'naf-template'
];

// Components that indicate a system entity
export const SYSTEM_COMPONENTS = [
  'raycaster',
  'cursor',
  'look-controls'
];

// Data attributes that indicate a system entity
export const SYSTEM_DATA_ATTRIBUTES = [
  'data-system'
];

// Entity types that should be filtered out
export const FILTERED_ENTITY_TYPES = [
  'cursor',
  'camera',
  'template'
];

// Entity IDs that should be filtered out
export const FILTERED_ENTITY_IDS = [
  'local-avatar',
  'naf-template'
];

// Components that should be filtered out
export const FILTERED_COMPONENTS = [
  'raycaster',
  'cursor',
  'look-controls'
];

// Data attributes that should be filtered out
export const FILTERED_DATA_ATTRIBUTES = [
  'data-system'
];

// Attributes that should always be skipped when processing entities
export const INTERNAL_ATTRIBUTES = [
  'id',                    // Handled separately
  'class',                // Internal A-Frame
  'aframe-injected',      // Internal A-Frame
  'entity-watcher',       // Internal system
  'raycaster',           // Internal system
  'cursor',              // Internal system
  'DOM'                  // Internal tracking
];

// Data attributes that should be preserved
export const PRESERVED_DATA_ATTRIBUTES = [
  'data-entity-uuid'     // Entity tracking
];

// Standard vector attributes that need special handling
export const VECTOR_ATTRIBUTES = [
  'position',
  'rotation',
  'scale'
];

// Entity types that use component-based geometry
export const COMPONENT_BASED_TYPES = [
  'torus',
  'torusKnot',
  'dodecahedron',
  'octahedron',
  'tetrahedron',
  'icosahedron',
  'circle',
  'triangle'
];

// Standard primitive types
export const STANDARD_PRIMITIVES = [
  'box',
  'sphere',
  'cylinder',
  'plane',
  'cone',
  'ring'
];

// Geometry attributes that can appear at both component and entity level
export const GEOMETRY_ATTRIBUTES = [
  'radius',
  'radiusTubular',
  'width',
  'height',
  'depth',
  'segments-radial',
  'segments-height'
];

// Default values for vector attributes
export const VECTOR_DEFAULTS = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 }
};

// Default values for geometry attributes by type
export const GEOMETRY_DEFAULTS = {
  box: {
    width: 1,
    height: 1,
    depth: 1
  },
  sphere: {
    radius: 0.5
  },
  cylinder: {
    radius: 0.5,
    height: 1.5
  },
  plane: {
    width: 4,
    height: 4
  },
  torus: {
    radius: 0.5,
    radiusTubular: 0.1
  }
};

// Sky configuration
export const SKY_TYPES = {
  COLOR: 'color',
  ENVIRONMENT: 'environment',
  IMAGE: 'image',
  VIDEO: 'video',
  GRADIENT: 'gradient',
  NONE: 'none'
};

// Default sky color
export const DEFAULT_SKY_COLOR = '#87CEEB';  // Light blue

// Default sky configuration - will be updated with proper UUID when sky manager initializes
export const DEFAULT_SKY_CONFIG = {
  type: SKY_TYPES.COLOR,
  data: {
    color: DEFAULT_SKY_COLOR
  },
  uuid: 'sky-temp-' + Date.now() // Temporary UUID that will be replaced
};

// Default entity color (A-Frame blue)
export const DEFAULT_ENTITY_COLOR = '#4CC3D9';

// System constants
export const SYSTEM_CONFIG = {
  DEFAULT_ENTITY_COLOR: '#4CC3D9',
  DEFAULT_LIGHT_COLOR: '#FFFFFF',
  DEFAULT_LIGHT_INTENSITY: 1,
  DEFAULT_LIGHT_DISTANCE: 10
};

// Editor constants
export const EDITOR_CONFIG = {
  // Loading and initialization
  READY_TIMEOUT: 5000,
  WAIT_SECONDS: 30,
  MAX_LOAD_ATTEMPTS: 5,
  INITIALIZATION_DELAY: 100,
  
  // Editor appearance
  DEFAULT_THEME: 'vs-dark',
  DEFAULT_LANGUAGE: 'html',
  DEFAULT_FONT_SIZE: 14,
  DEFAULT_TAB_SIZE: 2,
  DEFAULT_WORD_WRAP: 'on',
  
  // Editor behavior
  APPLY_DELAY: 300,
  REFRESH_DELAY: 500
};

// Network configuration
export const NETWORK_CONFIG = {
    room: 'naf-playground',
    connectOnLoad: false,
    debug: true,
    debugLevel: 'warn'
};

// UI constants
export const UI_CONFIG = {
  NOTIFICATION_DURATION: 5000,
  PANEL_WIDTH: 300,
  PANEL_PADDING: 15,
  BUTTON_HEIGHT: 40,
  ICON_SIZE: 24
};

// Avatar rig configuration
export const RIG_CONFIG = {
    spawn: { x: 0, y: 1.6, z: 0 },
    height: 1.6,
    radius: 0.3
};

// Helper function to convert vector to string
export function vectorToString(vector) {
    return `${vector.x} ${vector.y} ${vector.z}`;
}

// Helper function to convert string to vector
export function stringToVector(string) {
    const [x, y, z] = string.split(' ').map(Number);
    return { x, y, z };
}

// Light defaults
export const LIGHT_DEFAULTS = {
  ambient: {
    color: '#BBB',
    intensity: 1
  },
  directional: {
    color: '#FFF',
    intensity: 0.6,
    position: { x: -0.5, y: 1, z: 1 }
  },
  point: {
    color: '#FFFFFF',
    intensity: 0.75,
    distance: 50
  }
};

// Excluded attributes for HTML generation
export const EXCLUDED_ATTRIBUTES = [
  'aframe-injected',
  'class',
  'style',
  'data-aframe-inspector',
  'data-aframe-inspector-original-camera'
];

// Timing configuration
export const TIMING_CONFIG = {
  THROTTLE_TIME: 2000,      // ms between saves
  AUTO_SAVE_DELAY: 1000,    // ms to wait before auto-saving
  EDITOR_UPDATE_DELAY: 300, // ms to wait before updating editor
  STATE_SYNC_DELAY: 500     // ms to wait before syncing state
};

// Panel IDs
export const PANEL_IDS = {
  WATCHER: 'watcher-panel'
};

// Watcher configuration
export const WATCHER_CONFIG = {
  THROTTLE_TIME: 2000,      // ms between saves
  AUTO_SAVE_DELAY: 1000,    // ms to wait before auto-saving
  DEBUG_MODE: false         // enable debug logging
};

/**
 * Default scene configuration
 */
export const DEFAULT_SCENE = {
    environment: {
        type: 'environment',
        id: 'environment',
        preset: 'default',
        children: ['default-sky', 'default-ambient-light', 'default-directional-light']
    },
    sky: {
        type: 'sky',
        id: 'default-sky',
        color: '#87CEEB',
        parent: 'environment'
    },
    ambientLight: {
        type: 'light',
        id: 'default-ambient-light',
        light: {
            type: 'ambient',
            color: '#BBB',
            intensity: 0.5
        },
        parent: 'environment'
    },
    directionalLight: {
        type: 'light',
        id: 'default-directional-light',
        light: {
            type: 'directional',
            color: '#FFF',
            intensity: 0.6
        },
        position: { x: -0.5, y: 1, z: 1 },
        parent: 'environment'
    }
};

/**
 * Generate initial state with empty scene
 * @returns {Object} Initial state object
 */
export function generateInitialState() {
    return {
        entities: {},
        entityMapping: {},
        selectedEntity: null,
        assets: {}, // Initialize empty assets collection
        camera: {
            position: { ...VECTOR_DEFAULTS.position },
            rotation: { ...VECTOR_DEFAULTS.rotation },
            active: 'builder-camera',
            saved: true
        },
        metadata: {
            title: 'Untitled Scene',
            description: '',
            created: Date.now(),
            modified: Date.now()
        },
        network: {
            status: 'disconnected',
            room: 'defaultRoom',
            url: ''
        },
        userSettings: {
            darkMode: true
        }
    };
}

// Default scene path
export const DEFAULT_SCENE_PATH = 'scenes/default-scene.json';

// Default scene to load on startup (used as the initial scene)
export const STARTUP_SCENE_PATH = 'scenes/default-scene.json';

// Loading and initialization
export const INITIALIZATION_CONFIG = {
  READY_TIMEOUT: 5000,
  WAIT_SECONDS: 30,
  MAX_LOAD_ATTEMPTS: 5,
  INITIALIZATION_DELAY: 100,
  ALWAYS_LOAD_SCENE: true // Always load a scene on startup
}; 