/**
 * Environment Manager - Manages environment components (sky, lights, etc.)
 */

import { getState, setState } from './state.js';
import { generateEntityId } from './utils.js';
import { skyManager } from './sky-manager.js';

// Environment presets
const ENVIRONMENT_PRESETS = {
    default: {
        name: 'Default',
        sky: {
            type: 'color',
            data: { color: '#87CEEB' }
        },
        lights: [
            {
                id: 'ambient-light',
                type: 'light',
                light: {
                    type: 'ambient',
                    intensity: 0.5,
                    color: '#BBB'
                }
            },
            {
                id: 'directional-light',
                type: 'light',
                light: {
                    type: 'directional',
                    intensity: 1,
                    color: '#FFF',
                    position: { x: 1, y: 1, z: 1 }
                }
            }
        ]
    },
    forest: {
        name: 'Forest',
        sky: {
            type: 'environment',
            data: { environment: 'forest' }
        },
        lights: [
            {
                id: 'ambient-light',
                type: 'light',
                light: {
                    type: 'ambient',
                    intensity: 0.3,
                    color: '#2C5530'
                }
            },
            {
                id: 'directional-light',
                type: 'light',
                light: {
                    type: 'directional',
                    intensity: 0.8,
                    color: '#FFF',
                    position: { x: 0.5, y: 1, z: 0.5 }
                }
            }
        ]
    }
    // Add more presets as needed
};

class EnvironmentManager {
    constructor() {
        this.environmentId = 'environment';
        this.initialized = false;
    }

    /**
     * Initialize the environment manager
     * Modified to be purely reactive - will not create any entities automatically
     */
    init() {
        if (this.initialized) return;

        console.log('[EnvironmentManager] Initializing in reactive mode - will only respond to state changes');
        
        // Set up state change listener
        document.addEventListener('state-changed', (event) => {
            const { changes, newState } = event.detail;
            // Only proceed if we have a valid state and environment changes
            if (newState && changes && changes.environment) {
                console.log('[EnvironmentManager] Environment state changed, updating environment...');
                this.ensureEnvironmentExists();
            }
        });

        this.initialized = true;
    }

    /**
     * Set the current environment preset
     * This is a main entry point for updating the environment state and should be used
     * when changing the overall environment. This method delegates to updateEnvironment
     * which will update the state and trigger DOM updates.
     * @param {string} preset - The preset name to apply
     */
    setEnvironmentPreset(preset) {
        const presetConfig = ENVIRONMENT_PRESETS[preset];
        
        if (!presetConfig) {
            console.error(`[EnvironmentManager] Invalid environment preset: ${preset}`);
            return;
        }
        
        console.log(`[EnvironmentManager] Setting environment preset: ${preset}`);
        
        // Generate a UUID for the environment if needed
        const environmentUuid = generateEntityId('environment');
        
        // Prepare the environment state
        const environmentState = {
            type: 'environment',
            preset,
            uuid: environmentUuid,
            ...presetConfig
        };
        
        // Use the updateEnvironment method to update the state
        this.updateEnvironment(environmentState);
    }

    /**
     * Update the environment DOM elements based on configuration
     * Updated to only modify DOM without changing state
     * @param {HTMLElement} environment - The environment entity element
     * @param {Object} config - The environment configuration
     */
    updateEnvironmentDOM(environment, config) {
        console.log('[EnvironmentManager] Updating environment DOM elements');
        
        // Update sky
        if (config.sky) {
            console.log('[EnvironmentManager] Updating sky via DOM');
            let sky = environment.querySelector('a-sky');
            if (!sky) {
                sky = document.createElement('a-sky');
                sky.id = 'sky';
                sky.setAttribute('data-entity-uuid', generateEntityId('sky'));
                environment.appendChild(sky);
            }
            
            // Update sky attributes
            Object.entries(config.sky).forEach(([key, value]) => {
                if (key === 'data' && value && typeof value === 'object') {
                    // Handle sky data property, which contains color or other attributes
                    Object.entries(value).forEach(([dataKey, dataValue]) => {
                        sky.setAttribute(dataKey, dataValue);
                    });
                } else if (key !== 'uuid' && key !== 'type') {
                    // Skip uuid and type, set other attributes directly
                    sky.setAttribute(key, value);
                }
            });
        }
        
        // Update lights
        if (config.lights && Array.isArray(config.lights)) {
            console.log('[EnvironmentManager] Updating lights via DOM');
            
            // Remove existing lights
            const lights = environment.querySelectorAll('[light]');
            lights.forEach(light => light.remove());
            
            // Create new lights
            config.lights.forEach(lightConfig => {
                if (!lightConfig || !lightConfig.light) return;
                
                const light = document.createElement('a-entity');
                light.id = lightConfig.id || `light-${Date.now()}`;
                light.setAttribute('data-entity-uuid', lightConfig.uuid || generateEntityId('light'));
                
                // Set light attributes
                if (lightConfig.light) {
                    // Create the light attribute string
                    const lightAttrs = Object.entries(lightConfig.light)
                        // Filter out the position as it should be set separately
                        .filter(([key]) => key !== 'position')
                        .map(([key, value]) => {
                            // If the value is an object with x,y,z, convert to string
                            if (value && typeof value === 'object' && 'x' in value) {
                                return `${key}: ${value.x} ${value.y} ${value.z}`;
                            }
                            return `${key}: ${value}`;
                        })
                        .join('; ');
                    
                    light.setAttribute('light', lightAttrs);
                }
                
                // Set position if available
                // First check if it's directly in the lightConfig
                if (lightConfig.position) {
                    const pos = lightConfig.position;
                    light.setAttribute('position', `${pos.x} ${pos.y} ${pos.z}`);
                }
                // Also check if it's in the light property
                else if (lightConfig.light && lightConfig.light.position) {
                    const pos = lightConfig.light.position;
                    light.setAttribute('position', `${pos.x} ${pos.y} ${pos.z}`);
                }
                
                environment.appendChild(light);
                console.log(`[EnvironmentManager] Created light: ${light.id} with position: ${light.getAttribute('position')}`);
            });
        }
    }

    /**
     * Ensure environment exists in scene based on current state
     * Updated to be purely reactive - creates/updates DOM elements based on state
     */
    ensureEnvironmentExists() {
        const state = getState();
        const environment = state.environment;
        
        // If there's no environment in state, don't create anything
        if (!environment) {
            console.log('[EnvironmentManager] No environment in state, skipping creation');
            return;
        }

        console.log('[EnvironmentManager] Ensuring environment exists in DOM based on state');

        // Get or create environment entity
        let envEntity = document.getElementById(this.environmentId);
        if (!envEntity) {
            console.log('[EnvironmentManager] Creating new environment entity in DOM');
            envEntity = document.createElement('a-entity');
            envEntity.id = this.environmentId;
            envEntity.setAttribute('data-entity-uuid', environment.uuid || generateEntityId('environment'));
            document.querySelector('a-scene').appendChild(envEntity);
        } else {
            console.log('[EnvironmentManager] Updating existing environment entity in DOM');
        }

        // Apply preset if specified
        if (environment.preset && ENVIRONMENT_PRESETS[environment.preset]) {
            console.log(`[EnvironmentManager] Applying preset: ${environment.preset}`);
            this.updateEnvironmentDOM(envEntity, ENVIRONMENT_PRESETS[environment.preset]);
        }

        // Update sky if specified in environment
        if (environment.sky) {
            skyManager.updateSky(environment.sky);
        }

        // Update lights from state
        if (environment.lights && Array.isArray(environment.lights)) {
            // Remove existing lights
            const existingLights = envEntity.querySelectorAll('[light]');
            existingLights.forEach(light => light.remove());
            
            // Create lights from state
            environment.lights.forEach(light => {
                if (!light || !light.id) return;
                
                let lightEntity = document.createElement('a-entity');
                lightEntity.id = light.id;
                lightEntity.setAttribute('data-entity-uuid', light.uuid || generateEntityId('light'));
                
                // Set light attributes
                if (light.light) {
                    // Filter out position from light attributes string 
                    const lightAttrs = Object.entries(light.light)
                        .filter(([key]) => key !== 'position')
                        .map(([key, value]) => {
                            // Handle vector values
                            if (value && typeof value === 'object' && 'x' in value) {
                                return `${key}: ${value.x} ${value.y} ${value.z}`;
                            }
                            return `${key}: ${value}`;
                        })
                        .join('; ');
                    
                    lightEntity.setAttribute('light', lightAttrs);
                }
                
                // Set position if available in multiple possible locations
                if (light.position) {
                    const pos = light.position;
                    lightEntity.setAttribute('position', `${pos.x} ${pos.y} ${pos.z}`);
                }
                else if (light.light && light.light.position) {
                    const pos = light.light.position;
                    lightEntity.setAttribute('position', `${pos.x} ${pos.y} ${pos.z}`);
                }
                
                envEntity.appendChild(lightEntity);
                console.log(`[EnvironmentManager] Created light from state: ${lightEntity.id} with position: ${lightEntity.getAttribute('position')}`);
            });
        }
    }

    /**
     * Get current environment configuration
     * @returns {Object} Current environment configuration
     */
    getCurrentEnvironment() {
        return getState().environment;
    }

    /**
     * Get available environment presets
     * @returns {Object} Available environment presets
     */
    getAvailablePresets() {
        return ENVIRONMENT_PRESETS;
    }

    /**
     * Update a specific light in the environment
     * This modifies a specific light in the environment and delegates to updateEnvironment
     * to update the state and trigger DOM updates.
     * @param {string} lightId - ID of the light to update
     * @param {Object} properties - New light properties
     */
    updateLight(lightId, properties) {
        console.log(`[EnvironmentManager] Updating light: ${lightId}`);

        const state = getState();
        const environment = state.environment;
        if (!environment) {
            console.warn('[EnvironmentManager] Cannot update light - no environment in state');
            return;
        }

        if (!environment.lights || !Array.isArray(environment.lights)) {
            console.warn('[EnvironmentManager] Cannot update light - no lights array in environment');
            return;
        }

        const lightIndex = environment.lights.findIndex(l => l.id === lightId);
        if (lightIndex === -1) {
            console.warn(`[EnvironmentManager] Light not found in state: ${lightId}`);
            return;
        }

        // Create updated environment with modified light
        const updatedEnvironment = {
            ...environment,
            lights: [...environment.lights]
        };

        // Update specific light properties
        updatedEnvironment.lights[lightIndex] = {
            ...updatedEnvironment.lights[lightIndex],
            light: {
                ...updatedEnvironment.lights[lightIndex].light,
                ...properties
            }
        };

        // Use the updateEnvironment method to update the state
        this.updateEnvironment(updatedEnvironment);
    }

    /**
     * Update environment configuration
     * This is the main entry point for updating the entire environment and is the primary method
     * that should update the state. All other methods should just respond to state changes
     * or delegate to this method.
     * When this method is called, it updates the state, which triggers the state-changed event,
     * which calls ensureEnvironmentExists to update the DOM.
     * @param {Object} config - New environment configuration
     */
    updateEnvironment(config) {
        if (!config) return;

        console.log('[EnvironmentManager] Updating environment configuration via state');
        
        // Prepare environment state
        const environmentState = {
            ...config,
            uuid: config.uuid || generateEntityId('environment')
        };
        
        // Update state - this will trigger the state-changed event
        // which will then call ensureEnvironmentExists() via the event listener
        setState({ 
            environment: environmentState 
        }, 'environment-manager-update');
    }
}

// Create and export singleton instance
export const environmentManager = new EnvironmentManager(); 