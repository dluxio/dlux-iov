/**
 * Engine UI - Manages the engine configuration interface
 */

import engineManager from './engine-manager.js';

// Tab switching functionality
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked button
            btn.classList.add('active');
            
            // Get the tab to show
            const tabId = btn.dataset.tab + '-tab';
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Load the current engine configuration into the UI
function loadConfigToUI() {
    const config = engineManager.getConfig();
    if (!config) {
        console.warn('[EngineUI] No configuration available to load');
        return;
    }
    
    console.log('[EngineUI] Loading configuration to UI:', config);
    
    // Avatar settings
    document.getElementById('avatar-enabled').checked = config.avatar?.enabled !== false;
    document.getElementById('avatar-spawn-x').value = config.avatar?.spawn?.position?.x || 0;
    document.getElementById('avatar-spawn-y').value = config.avatar?.spawn?.position?.y || 0;
    document.getElementById('avatar-spawn-z').value = config.avatar?.spawn?.position?.z || 3;
    
    // Camera settings
    document.getElementById('camera-fov').value = config.camera?.options?.fov || 80;
    document.getElementById('camera-near').value = config.camera?.options?.near || 0.1;
    document.getElementById('camera-far').value = config.camera?.options?.far || 1000;
    
    // Network settings
    document.getElementById('network-enabled').checked = config.network?.enabled !== false;
    document.getElementById('network-room').value = config.network?.room || 'naf-playground';
    document.getElementById('network-connect-on-load').checked = config.network?.connectOnLoad === true;
    document.getElementById('network-debug').checked = config.network?.debug === true;
    
    // Physics settings
    document.getElementById('physics-enabled').checked = config.physics?.enabled === true;
    document.getElementById('physics-gravity-y').value = config.physics?.gravity?.y || -9.8;
    document.getElementById('physics-debug').checked = config.physics?.debug === true;
    
    // System settings
    if (config.system?.entityIds) {
        document.getElementById('system-entity-ids').value = config.system.entityIds.join('\n');
    }
    
    if (config.system?.components) {
        document.getElementById('system-components').value = config.system.components.join('\n');
    }
}

// Save the UI values to the engine configuration
function saveUIToConfig() {
    if (!engineManager.config) {
        engineManager.config = {};
    }
    
    const config = engineManager.config;
    
    // Avatar settings
    config.avatar = config.avatar || {};
    config.avatar.enabled = document.getElementById('avatar-enabled').checked;
    config.avatar.spawn = config.avatar.spawn || {};
    config.avatar.spawn.position = config.avatar.spawn.position || {};
    config.avatar.spawn.position.x = parseFloat(document.getElementById('avatar-spawn-x').value);
    config.avatar.spawn.position.y = parseFloat(document.getElementById('avatar-spawn-y').value);
    config.avatar.spawn.position.z = parseFloat(document.getElementById('avatar-spawn-z').value);
    
    // Camera settings
    config.camera = config.camera || {};
    config.camera.options = config.camera.options || {};
    config.camera.options.fov = parseFloat(document.getElementById('camera-fov').value);
    config.camera.options.near = parseFloat(document.getElementById('camera-near').value);
    config.camera.options.far = parseFloat(document.getElementById('camera-far').value);
    
    // Network settings
    config.network = config.network || {};
    config.network.enabled = document.getElementById('network-enabled').checked;
    config.network.room = document.getElementById('network-room').value;
    config.network.connectOnLoad = document.getElementById('network-connect-on-load').checked;
    config.network.debug = document.getElementById('network-debug').checked;
    
    // Physics settings
    config.physics = config.physics || {};
    config.physics.enabled = document.getElementById('physics-enabled').checked;
    config.physics.gravity = config.physics.gravity || {};
    config.physics.gravity.x = 0;
    config.physics.gravity.y = parseFloat(document.getElementById('physics-gravity-y').value);
    config.physics.gravity.z = 0;
    config.physics.debug = document.getElementById('physics-debug').checked;
    
    // System settings
    config.system = config.system || {};
    config.system.entityIds = document.getElementById('system-entity-ids').value
        .split('\n')
        .map(id => id.trim())
        .filter(id => id.length > 0);
        
    config.system.components = document.getElementById('system-components').value
        .split('\n')
        .map(comp => comp.trim())
        .filter(comp => comp.length > 0);
    
    console.log('[EngineUI] Saved configuration:', config);
    
    // Return the updated config
    return config;
}

// Initialize the engine UI
export function initEngineUI() {
    console.log('[EngineUI] Initializing engine UI');
    
    // Setup tabs
    setupTabs();
    
    // Ensure engine panel is properly registered with the window manager
    const enginePanel = document.getElementById('engine-panel');
    if (enginePanel) {
        // Import draggable module and initialize the panel if not already done
        import('./draggable.js').then(module => {
            if (!enginePanel.classList.contains('draggable')) {
                console.log('[EngineUI] Initializing engine panel as draggable window');
                module.initDraggable(enginePanel);
            }
        }).catch(error => {
            console.error('[EngineUI] Failed to initialize draggable for engine panel:', error);
        });
    }
    
    // Wait for engine manager initialization
    const checkEngineManager = setInterval(() => {
        if (engineManager.initialized) {
            clearInterval(checkEngineManager);
            console.log('[EngineUI] Engine manager initialized, loading config to UI');
            loadConfigToUI();
        }
    }, 500);
    
    // Setup save button
    const saveButton = document.getElementById('save-engine-config');
    if (saveButton) {
        saveButton.addEventListener('click', async () => {
            saveUIToConfig();
            await engineManager.saveConfig();
            alert('Engine configuration saved successfully!');
        });
    }
    
    // Setup reload button
    const reloadButton = document.getElementById('reload-engine-config');
    if (reloadButton) {
        reloadButton.addEventListener('click', async () => {
            try {
                await engineManager.loadEngineConfig();
                loadConfigToUI();
                alert('Engine configuration reloaded successfully!');
            } catch (error) {
                console.error('[EngineUI] Error reloading engine config:', error);
                alert('Error reloading engine configuration: ' + error.message);
            }
        });
    }
    
    console.log('[EngineUI] Engine UI initialized');
} 