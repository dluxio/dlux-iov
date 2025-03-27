/**
 * Network.js - Networked A-Frame setup and synchronization
 */

import { getState, applyNetworkStateUpdate } from './state.js';
import { logAction } from './debug.js';
import { getUrlParams } from './utils.js';

// DOM elements
let networkStatusEl;
let serverUrlInput;
let connectBtn;

// Network status
let isConnected = false;

/**
 * Initialize the network module
 * @returns {Promise} A promise that resolves when initialization is complete
 */
export function initNetwork() {
    console.log('Initializing network module...');
    
    try {
        // Listen for state changes to broadcast
        document.addEventListener('state-changed', (event) => {
            if (isConnected && event.detail.source !== 'network') {
                broadcastStateUpdate(event.detail);
            }
        });

        setupNetworkedScene();
        console.log('Network module initialization complete');
        return Promise.resolve();
    } catch (error) {
        console.error('Error initializing network module:', error);
        return Promise.reject(error);
    }
}

/**
 * Register necessary components for networking
 */
function registerNetworkComponents() {
    console.log('Registering network components...');
    
    // Check if AFRAME is available
    if (typeof AFRAME === 'undefined') {
        console.error('A-Frame is not available. Make sure the script is loaded.');
        return;
    }
    
    // Register a component to handle NAF initialization
    if (!AFRAME.components['naf-connector']) {
        AFRAME.registerComponent('naf-connector', {
            init: function() {
                console.log('NAF connector component initialized');
                
                // Check if NAF is ready instead of using a timeout
                const checkNAFAvailability = () => {
                    if (NAF && NAF.connection) {
                        console.log('NAF connection available in connector');
                        
                        // Initialize Networked A-Frame properly
                        setupNAFSchemas();
                    } else {
                        console.log('NAF connection not yet available, waiting...');
                        // Check again in a short while
                        requestAnimationFrame(checkNAFAvailability);
                    }
                };
                
                // Start checking
                checkNAFAvailability();
            }
        });
        
        // Add the component to the scene
        const scene = document.querySelector('a-scene');
        if (scene) {
            scene.setAttribute('naf-connector', '');
        }
    }
    
    // Register the state-data component if it doesn't already exist
    registerStateDataComponent();
}

/**
 * Initialize Networked A-Frame
 */
export function setupNetworkedScene() {
    console.log('Setting up networked scene...');
    
    // Setup DOM elements when they're available
    const setupNetworkDOMElements = () => {
        // Check if DOM elements are available
        networkStatusEl = document.getElementById('network-status');
        serverUrlInput = document.getElementById('server-url');
        connectBtn = document.getElementById('connect-btn');
        
        if (!networkStatusEl || !serverUrlInput || !connectBtn) {
            console.log('Network DOM elements not yet available, retrying...');
            requestAnimationFrame(setupNetworkDOMElements);
            return;
        }
        
        console.log('Network DOM elements found, adding event listeners');
        
        // Add event listeners
        connectBtn.addEventListener('click', handleConnectClick);
        
        // Check for auto-connect from URL parameters
        const urlParams = getUrlParams();
        if (urlParams.server) {
            console.log('Auto-connecting to server from URL parameter:', urlParams.server);
            serverUrlInput.value = urlParams.server;
            connectToServer(urlParams.server);
        }
        
        // Initialize NAF if needed
        if (typeof NAF !== 'undefined' && NAF.connection) {
            initNetworkedAFrame();
        } else {
            console.log('NAF not yet available for setup, waiting...');
            // Use MutationObserver to detect when NAF scripts are loaded
            const observer = new MutationObserver((mutations) => {
                if (typeof NAF !== 'undefined' && NAF.connection) {
                    console.log('NAF detected via observer, initializing');
                    initNetworkedAFrame();
                    observer.disconnect();
                }
            });
            
            // Start observing body for script additions
            observer.observe(document.body, { childList: true, subtree: true });
        }
    };
    
    // Start setup process
    setupNetworkDOMElements();
}

/**
 * Register the state-data component
 */
function registerStateDataComponent() {
    // Check if AFRAME is available
    if (typeof AFRAME === 'undefined') {
        console.error('A-Frame is not available. Make sure the script is loaded.');
        return;
    }
    
    // Register the state-data component if it doesn't already exist
    if (!AFRAME.components['state-data']) {
        AFRAME.registerComponent('state-data', {
            schema: {
                value: { type: 'string', default: '{}' }
            },
            
            init: function() {
                // Initialize the component
                console.log('state-data component initialized');
            },
            
            update: function() {
                // Handle component updates
                if (this.data.value && this.data.value !== '{}') {
                    try {
                        const stateUpdate = JSON.parse(this.data.value);
                        applyNetworkStateUpdate(stateUpdate);
                    } catch (error) {
                        console.error('Error parsing state-data value:', error);
                    }
                }
            }
        });
    }
}

/**
 * Initialize Networked A-Frame
 */
function initNetworkedAFrame() {
    console.log('Initializing Networked A-Frame...');
    
    // Check if NAF is available
    if (typeof NAF === 'undefined') {
        console.error('Networked A-Frame is not available. Make sure the script is loaded.');
        updateNetworkStatus('Error: NAF not loaded');
        return;
    }
    
    // Wait for NAF to be fully initialized
    if (NAF.connection && NAF.connection.adapter) {
        setupNAFSchemas();
    } else {
        // NAF might not be fully initialized yet, try again in a moment
        setTimeout(() => {
            if (NAF.connection && NAF.connection.adapter) {
                setupNAFSchemas();
            } else {
                console.warn('NAF connection or adapter not available. Will initialize on connection.');
                // Set up event listener for adapter connection
                document.body.addEventListener('adapter-ready', setupNAFSchemas);
            }
        }, 500);
    }
    
    // Update network status
    updateNetworkStatus('Initialized');
}

function setupNAFSchemas() {
    // Register avatar template
    NAF.schemas.add({
        template: '#avatar-template',
        components: [
            'position',
            'rotation',
            {
                selector: '.head',
                component: 'material',
                property: 'color'
            }
        ]
    });
    
    // Register state schema
    NAF.schemas.add({
        template: '#state-template',
        components: [
            {
                component: 'state-data',
                property: 'value'
            }
        ]
    });
    
    // Listen for client connected events
    document.body.addEventListener('clientConnected', handleClientConnected);
    
    // Listen for client disconnected events
    document.body.addEventListener('clientDisconnected', handleClientDisconnected);
    
    // Listen for data channel message events
    document.body.addEventListener('dataChannelMessage', handleDataChannelMessage);
    
    console.log('NAF schemas registered');
}

/**
 * Handle connect button click
 */
function handleConnectClick() {
    const serverUrl = serverUrlInput.value.trim();
    
    if (!serverUrl) {
        alert('Please enter a WebSocket server URL');
        return;
    }
    
    // Update network status
    updateNetworkStatus('Connecting...');
    
    try {
        // Connect to server
        connectToServer(serverUrl);
    } catch (error) {
        console.error('Error connecting to server:', error);
        updateNetworkStatus('Connection Error');
        
        logAction(`Connection error: ${error.message}`);
    }
}

/**
 * Connect to a Networked A-Frame server
 * @param {string} serverUrl - WebSocket server URL
 */
function connectToServer(serverUrl) {
    console.log(`Connecting to server: ${serverUrl}`);
    
    // Get the scene
    const scene = document.querySelector('a-scene');
    
    // Make sure the scene and NAF are available
    if (!scene || !NAF || !NAF.connection) {
        console.error('Scene or NAF not available for connection');
        updateNetworkStatus('Error: Components not loaded');
        return;
    }
    
    try {
        // Update the networked-scene component with server URL
        const currentData = scene.getAttribute('networked-scene') || {};
        scene.setAttribute('networked-scene', {
            ...currentData,
            serverURL: serverUrl
        });
        
        // Update state
        setState({
            network: {
                status: 'connecting',
                url: serverUrl
            }
        });
        
        // Give a little time for the attribute to be processed
        setTimeout(() => {
            try {
                // Connect using the NAF API rather than relying on the component
                NAF.connection.adapter.setServerUrl(serverUrl);
                NAF.connection.connect()
                    .then(() => {
                        console.log('Successfully connected to server');
                        
                        // Update connected status
                        isConnected = true;
                        
                        // Update network status
                        updateNetworkStatus('Connected');
                        
                        // Update state
                        setState({
                            network: {
                                status: 'connected'
                            }
                        });
                        
                        // Broadcast initial state
                        broadcastStateUpdate(getState());
                        
                        logAction(`Connected to server: ${serverUrl}`);
                    })
                    .catch(error => {
                        console.error('Connection failed:', error);
                        updateNetworkStatus('Connection Failed');
                        logAction(`Connection failed: ${error.message || 'Unknown error'}`);
                    });
            } catch (error) {
                console.error('Error during connection:', error);
                updateNetworkStatus('Connection Error');
                logAction(`Connection error: ${error.message || 'Unknown error'}`);
            }
        }, 500);
        
        // Listen for connection events
        scene.addEventListener('connected', () => {
            console.log('Connected event fired from scene');
            
            // Handle here if not caught by the promise above
            if (networkStatusEl.textContent !== 'Connected') {
                // Update connected status
                isConnected = true;
                
                // Update network status
                updateNetworkStatus('Connected');
                
                // Update state
                setState({
                    network: {
                        status: 'connected'
                    }
                });
                
                logAction(`Connected to server: ${serverUrl}`);
            }
        });
        
        // Listen for connection error events
        scene.addEventListener('connectError', (event) => {
            const error = event.detail || 'Unknown error';
            console.error('Connection error:', error);
            
            // Update status
            updateNetworkStatus('Connection Error');
            
            // Update state
            setState({
                network: {
                    status: 'error'
                }
            });
            
            logAction(`Connection error: ${error}`);
        });
    } catch (error) {
        console.error('Error setting up connection:', error);
        updateNetworkStatus('Setup Error');
        logAction(`Connection setup error: ${error.message || 'Unknown error'}`);
    }
}

/**
 * Handle client connected event
 * @param {Event} event - Client connected event
 */
function handleClientConnected(event) {
    const clientId = event.detail.clientId;
    console.log(`Client connected: ${clientId}`);
    
    // Add to connected clients
    logAction(`Client connected: ${clientId}`);
    
    // Send current state to new client
    broadcastStateUpdate(getState(), clientId);
}

/**
 * Handle client disconnected event
 * @param {Event} event - Client disconnected event
 */
function handleClientDisconnected(event) {
    const clientId = event.detail.clientId;
    console.log(`Client disconnected: ${clientId}`);
    
    logAction(`Client disconnected: ${clientId}`);
}

/**
 * Handle data channel message
 * @param {Event} event - Data channel message event
 */
function handleDataChannelMessage(event) {
    const { sender, dataType, data } = event.detail;
    
    // Only process state update messages
    if (dataType === 'state-update') {
        console.log(`Received state update from ${sender}:`, data);
        
        // Apply the state update
        applyNetworkStateUpdate(data);
        
        logAction(`Received state update from ${sender}`);
    }
}

/**
 * Update network status in UI
 * @param {string} status - Status text
 */
function updateNetworkStatus(status) {
    if (networkStatusEl) {
        networkStatusEl.textContent = status;
    }
}

/**
 * Broadcast state update to all clients
 * @param {Object} stateUpdate - State update to broadcast
 * @param {string} targetClientId - Optional target client ID (if null, broadcast to all)
 */
export function broadcastStateUpdate(stateUpdate, targetClientId = null) {
    if (!isConnected) {
        console.warn('Cannot broadcast update: not connected to network');
        return;
    }

    try {
        // Get the current state
        const state = getState();

        // Create the network message
        const message = {
            type: 'update',
            data: {
                uuid: state.uuid,
                data: stateUpdate
            },
            timestamp: Date.now()
        };

        // Broadcast using NAF
        if (NAF && NAF.connection.isConnected()) {
            if (targetClientId) {
                // Send to specific client
                NAF.connection.sendDataGuaranteed(targetClientId, 'state-update', message);
            } else {
                // Broadcast to all clients
                NAF.connection.broadcastDataGuaranteed('state-update', message);
            }
        }

        logAction('Broadcast state update to ' + (targetClientId ? targetClientId : 'all clients'));
    } catch (error) {
        console.error('Error broadcasting state update:', error);
    }
}

/**
 * Update room
 * @param {string} roomName - New room name
 */
export function updateRoom(roomName) {
    // Get the scene
    const scene = document.querySelector('a-scene');
    
    // Get current networked-scene component data
    const networkData = scene.getAttribute('networked-scene');
    
    // Update room
    scene.setAttribute('networked-scene', {
        ...networkData,
        room: roomName
    });
    
    // Update state
    setState({
        network: {
            room: roomName
        }
    });
    
    logAction(`Changed room to: ${roomName}`);
}

/**
 * Disconnect from the server
 */
export function disconnect() {
    if (!isConnected) {
        return;
    }
    
    // Disconnect
    NAF.connection.disconnect();
    
    // Update status
    isConnected = false;
    updateNetworkStatus('Disconnected');
    
    // Update state
    setState({
        network: {
            status: 'disconnected'
        }
    });
    
    logAction('Disconnected from server');
} 