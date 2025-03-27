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
     * Initialize the environment
     */
    init() {
        if (this.initialized) return;

        // Get current state
        const state = getState();
        
        // Initialize environment if not exists
        if (!state.environment) {
            this.setEnvironmentPreset('default');
        } else {
            // Ensure environment exists in scene
            this.ensureEnvironmentExists();
        }

        this.initialized = true;
    }

    /**
     * Set the current environment preset
     * @param {string} preset - The preset name to apply
     */
    setEnvironmentPreset(preset) {
        const state = getState();
        const presetConfig = ENVIRONMENT_PRESETS[preset];
        
        if (!presetConfig) {
            console.error(`Invalid environment preset: ${preset}`);
            return;
        }
        
        // Create environment entity if it doesn't exist
        let environment = document.querySelector('#environment');
        if (!environment) {
            environment = document.createElement('a-entity');
            environment.id = 'environment';
            environment.setAttribute('data-entity-uuid', generateEntityId('environment'));
            document.querySelector('a-scene').appendChild(environment);
        }
        
        // Update environment entity with preset configuration
        const environmentUuid = environment.getAttribute('data-entity-uuid');
        const environmentState = {
            type: 'environment',
            preset,
            uuid: environmentUuid,
            ...presetConfig
        };
        
        // Update state
        setState({
            entities: {
                ...state.entities,
                [environmentUuid]: environmentState
            }
        });
        
        // Update DOM
        this.updateEnvironmentDOM(environment, presetConfig);
    }

    /**
     * Update the environment DOM elements
     * @param {HTMLElement} environment - The environment entity element
     * @param {Object} config - The environment configuration
     */
    updateEnvironmentDOM(environment, config) {
        // Update sky
        let sky = environment.querySelector('a-sky');
        if (!sky) {
            sky = document.createElement('a-sky');
            sky.id = 'sky';
            sky.setAttribute('data-entity-uuid', generateEntityId('sky'));
            environment.appendChild(sky);
        }
        
        // Update sky attributes
        if (config.sky) {
            Object.entries(config.sky).forEach(([key, value]) => {
                sky.setAttribute(key, value);
            });
        }
        
        // Update lights
        const lights = environment.querySelectorAll('[light]');
        lights.forEach(light => light.remove());
        
        if (config.lights) {
            config.lights.forEach(lightConfig => {
                const light = document.createElement('a-entity');
                light.id = lightConfig.id;
                light.setAttribute('data-entity-uuid', generateEntityId('light'));
                light.setAttribute('light', Object.entries(lightConfig.light)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join('; '));
                environment.appendChild(light);
            });
        }
    }

    /**
     * Ensure environment exists in scene
     */
    ensureEnvironmentExists() {
        const state = getState();
        const environment = state.environment;
        if (!environment) return;

        // Get or create environment entity
        let envEntity = document.getElementById(this.environmentId);
        if (!envEntity) {
            envEntity = document.createElement('a-entity');
            envEntity.id = this.environmentId;
            document.querySelector('a-scene').appendChild(envEntity);
        }

        // Update sky
        skyManager.updateSky(environment.sky);

        // Update lights
        environment.lights.forEach(light => {
            let lightEntity = document.getElementById(light.id);
            if (!lightEntity) {
                lightEntity = document.createElement('a-entity');
                lightEntity.id = light.id;
                envEntity.appendChild(lightEntity);
            }

            // Update light attributes
            Object.entries(light.light).forEach(([key, value]) => {
                if (typeof value === 'object') {
                    lightEntity.setAttribute(key, Object.entries(value)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join('; '));
                } else {
                    lightEntity.setAttribute(key, value);
                }
            });
        });
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
     * @param {string} lightId - ID of the light to update
     * @param {Object} properties - New light properties
     */
    updateLight(lightId, properties) {
        const state = getState();
        const environment = state.environment;
        if (!environment) return;

        const lightIndex = environment.lights.findIndex(l => l.id === lightId);
        if (lightIndex === -1) return;

        // Update light in state
        environment.lights[lightIndex] = {
            ...environment.lights[lightIndex],
            light: {
                ...environment.lights[lightIndex].light,
                ...properties
            }
        };

        setState({ environment });
        this.ensureEnvironmentExists();
    }
}

// Create and export singleton instance
export const environmentManager = new EnvironmentManager(); 