// Global z-index tracker and window management
const WindowManager = {
    // Base z-index values for different layers
    Z_LAYERS: {
        BACKGROUND: 1000,    // Base layer for all windows
        NORMAL: 2000,        // Normal windows
        FOCUSED: 3000,       // Currently focused window
        MODAL: 4000,         // Modal dialogs/popups
        OVERLAY: 5000        // Overlay elements (dropdowns, tooltips)
    },
    
    // Window priorities within each layer
    WINDOW_PRIORITIES: {
        'ui-container': 1,
        'editor-window': 2,
        'state-debug-panel': 3,
        'watcher-panel': 4,
        'engine-panel': 5
    },
    
    // Default window positions and sizes
    DEFAULT_POSITIONS: {
        'ui-container': {
            top: '20px',
            left: '20px',
            width: '300px',
            height: '500px'
        },
        'editor-window': {
            top: '20px',
            left: '340px',
            width: '1000px',
            height: '400px'
        },
        'state-debug-panel': {
            top: 'calc(50vh - 300px)',
            right: '20px',
            width: '300px',
            height: '600px'
        },
        'watcher-panel': {
            top: 'calc(100vh - 220px)',
            left: '20px',
            width: '300px',
            height: '200px'
        },
        'engine-panel': {
            bottom: '100px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '420px',
            height: '370px'
        }
    },
    
    windows: new Set(),
    closedWindows: new Map(),
    windowStates: new Map(),
    windowIds: ['ui-container', 'editor-window', 'state-debug-panel', 'watcher-panel', 'engine-panel', 'asset-manager-panel'],
    activeWindow: null,
    
    /**
     * Calculate z-index for a window based on its layer and priority
     * @param {HTMLElement} element - The window element
     * @param {boolean} isFocused - Whether the window is focused
     * @returns {number} The calculated z-index
     */
    calculateZIndex(element, isFocused = false) {
        const baseLayer = isFocused ? this.Z_LAYERS.FOCUSED : this.Z_LAYERS.NORMAL;
        const priority = this.WINDOW_PRIORITIES[element.id] || 0;
        return baseLayer + priority;
    },
    
    /**
     * Update z-index for all windows
     */
    updateAllZIndices() {
        this.windows.forEach(win => {
            const isFocused = win === this.activeWindow;
            win.style.zIndex = this.calculateZIndex(win, isFocused);
        });
    },
    
    bringToFront(element) {
        // Update active window
        this.activeWindow = element;
        
        // Remove active class from all windows
        this.windows.forEach(win => {
            win.classList.remove('active');
        });
        
        // Add active class to current window
        element.classList.add('active');
        
        // Update all z-indices
        this.updateAllZIndices();
    },
    
    registerWindow(element) {
        this.windows.add(element);
        this.updateAllZIndices();
    },
    
    unregisterWindow(element) {
        this.windows.delete(element);
        if (this.activeWindow === element) {
            this.activeWindow = null;
        }
        this.updateAllZIndices();
    },

    closeWindow(element) {
        // Store window state before hiding
        const state = {
            minimized: element.classList.contains('minimized'),
            maximized: element.classList.contains('maximized'),
            position: {
                top: element.style.top,
                left: element.style.left,
                width: element.style.width,
                height: element.style.height
            }
        };
        
        // Hide the window
        element.style.display = 'none';
        
        // Store the state
        this.closedWindows.set(element.id, state);
        
        // Update dock icon
        this.updateDockIcon(element.id, false);
    },
    
    showWindow(element) {
        // Restore window state if available
        const state = this.closedWindows.get(element.id);
        if (state) {
            element.style.display = 'block';
            element.style.top = state.position.top;
            element.style.left = state.position.left;
            element.style.width = state.position.width;
            element.style.height = state.position.height;
            
            if (state.minimized) element.classList.add('minimized');
            if (state.maximized) element.classList.add('maximized');

            // Special handling for editor window
            if (element.id === 'editor-window') {
                // Force Monaco editor to resize after a short delay
                setTimeout(() => {
                    const editor = element.querySelector('#monaco-editor');
                    if (editor) {
                        // Trigger Monaco's resize
                        window.dispatchEvent(new Event('resize'));
                    }
                }, 100);
            }
        }
        
        // Update dock icon
        this.updateDockIcon(element.id, true);
    },
    
    updateDockIcon(windowId, isVisible) {
        const dockIcon = document.querySelector(`.dock-icon[data-window="${windowId}"]`);
        if (dockIcon) {
            dockIcon.classList.toggle('active', isVisible);
        }
    },

    hideAllWindows() {
        this.windowIds.forEach(windowId => {
            const element = document.getElementById(windowId);
            if (element && element.style.display !== 'none') {
                this.closeWindow(element);
            }
        });
    },

    showAllWindows() {
        this.windowIds.forEach(windowId => {
            const element = document.getElementById(windowId);
            if (element && element.style.display === 'none') {
                this.showWindow(element);
            }
        });
    },

    gatherWindows() {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const windowWidth = 400;  // Standard width for gathered windows
        const windowHeight = 300; // Standard height for gathered windows
        const offsetX = 40;       // Horizontal offset between windows
        const offsetY = 40;       // Vertical offset between windows

        // Calculate center position for the first window
        const centerX = (screenWidth - windowWidth) / 2;
        const centerY = (screenHeight - windowHeight) / 2;

        // Position windows in a stack with offset
        this.windowIds.forEach((windowId, index) => {
            const element = document.getElementById(windowId);
            if (element) {
                // Show window if it's hidden
                if (element.style.display === 'none') {
                    this.showWindow(element);
                }

                // Reset transform and any maximized state
                element.style.transform = 'none';
                element.classList.remove('maximized');

                // Calculate stacked position with offset
                const x = centerX + (index * offsetX);
                const y = centerY + (index * offsetY);

                // Apply position using transform
                element.style.left = `${x}px`;
                element.style.top = `${y}px`;
                element.style.width = `${windowWidth}px`;
                element.style.height = `${windowHeight}px`;

                // Reset the original position variables and transform offset
                element.style.setProperty('--original-top', `${y}px`);
                element.style.setProperty('--original-left', `${x}px`);
                element.style.setProperty('--original-width', `${windowWidth}px`);
                element.style.setProperty('--original-height', `${windowHeight}px`);
                
                // Reset transform offset variables
                element.style.setProperty('--transform-x', '0px');
                element.style.setProperty('--transform-y', '0px');
            }
        });
    },

    resetLayout() {
        this.windowIds.forEach(windowId => {
            const element = document.getElementById(windowId);
            if (element) {
                // Show window if it's hidden
                if (element.style.display === 'none') {
                    this.showWindow(element);
                }

                // Reset transform and states
                element.style.transform = 'none';
                element.classList.remove('maximized');
                element.classList.remove('minimized');

                // Get default position
                const defaults = this.DEFAULT_POSITIONS[windowId];
                if (defaults) {
                    // Apply default position and size
                    element.style.top = defaults.top;
                    element.style.width = defaults.width;
                    element.style.height = defaults.height;

                    // Handle left/right positioning
                    if (defaults.left !== undefined) {
                        element.style.left = defaults.left;
                        element.style.right = 'auto';
                        element.style.setProperty('--original-left', defaults.left);
                    }
                    if (defaults.right !== undefined) {
                        element.style.right = defaults.right;
                        element.style.left = 'auto';
                        element.style.setProperty('--original-right', defaults.right);
                    }

                    // Reset the original position variables
                    element.style.setProperty('--original-top', defaults.top);
                    element.style.setProperty('--original-width', defaults.width);
                    element.style.setProperty('--original-height', defaults.height);
                    
                    // Reset transform offset variables
                    element.style.setProperty('--transform-x', '0px');
                    element.style.setProperty('--transform-y', '0px');
                }
            }
        });
    }
};

// Draggable window functionality
export function initDraggable(target) {
    if (!target) return;
    
    // Store original dimensions and position
    const rect = target.getBoundingClientRect();
    target.style.setProperty('--original-height', `${rect.height}px`);
    target.style.setProperty('--original-width', `${rect.width}px`);
    target.style.setProperty('--original-top', `${rect.top}px`);
    target.style.setProperty('--original-left', `${rect.left}px`);
    
    // Add draggable class
    target.classList.add('draggable');
    
    // Get header and controls
    const header = target.querySelector('.window-header');
    const minimizeBtn = target.querySelector('.minimize-btn');
    const maximizeBtn = target.querySelector('.maximize-btn');
    const closeBtn = target.querySelector('.close-btn');
    
    if (!header || !minimizeBtn || !maximizeBtn || !closeBtn) {
        console.warn('Missing required elements for draggable window:', target.id);
        return;
    }

    let isDragging = false;
    let isResizing = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;
    let startWidth;
    let startHeight;
    let resizeHandle = null;

    // Register this window with the window manager
    WindowManager.registerWindow(target);

    // Handle drag start
    header.addEventListener('mousedown', (e) => {
        // Don't start drag if clicking on control buttons
        if (e.target === minimizeBtn || e.target === maximizeBtn || e.target === closeBtn) {
            return;
        }
        
        // Check if the click is within the header or its children
        if (header.contains(e.target)) {
            isDragging = true;
            // Get current transform offset or default to 0
            xOffset = parseInt(target.style.getPropertyValue('--transform-x') || '0');
            yOffset = parseInt(target.style.getPropertyValue('--transform-y') || '0');
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
            WindowManager.bringToFront(target);
        }
    });

    // Handle window controls
    minimizeBtn.addEventListener('click', () => {
        const isCollapsed = target.classList.contains('minimized');
        target.classList.toggle('minimized');
        WindowManager.bringToFront(target);
        console.log('Minimize clicked, minimized:', !isCollapsed);
    });

    maximizeBtn.addEventListener('click', () => {
        // If window is minimized, expand it first
        if (target.classList.contains('minimized')) {
            target.classList.remove('minimized');
        }

        // Toggle maximize state
        const isMaximized = target.classList.contains('maximized');
        target.classList.toggle('maximized');
        
        if (!isMaximized) {
            // Just maximize without saving current state
            target.style.width = '100%';
            target.style.height = '100%';
            target.style.top = '0';
            target.style.left = '0';
            // Reset transform to origin
            setTranslate(0, 0, target);
            xOffset = 0;
            yOffset = 0;
        } else {
            // Restore previous size and position
            const originalWidth = target.style.getPropertyValue('--original-width');
            const originalHeight = target.style.getPropertyValue('--original-height');
            const originalTop = target.style.getPropertyValue('--original-top');
            const originalLeft = target.style.getPropertyValue('--original-left');

            // If we have saved dimensions, use them, otherwise use the initial CSS values
            target.style.width = originalWidth || getComputedStyle(target).width;
            target.style.height = originalHeight || getComputedStyle(target).height;
            target.style.top = originalTop || getComputedStyle(target).top;
            target.style.left = originalLeft || getComputedStyle(target).left;

            // Restore previous transform
            setTranslate(xOffset, yOffset, target);
        }
        WindowManager.bringToFront(target);
        console.log('Maximize clicked, maximized:', !isMaximized);
    });

    // Handle close button
    closeBtn.addEventListener('click', () => {
        WindowManager.closeWindow(target);
        console.log('Close clicked for window:', target.id);
    });

    // Handle resize start
    const resizeHandles = target.querySelectorAll('.resize-handle');
    resizeHandles.forEach(handle => {
        handle.addEventListener('mousedown', (e) => {
            isResizing = true;
            resizeHandle = handle;
            startWidth = target.offsetWidth;
            startHeight = target.offsetHeight;
            initialX = e.clientX;
            initialY = e.clientY;
            WindowManager.bringToFront(target);
            e.preventDefault();
        });
    });

    // Handle drag and resize
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            xOffset = currentX;
            yOffset = currentY;
            
            // Update transform offset variables
            target.style.setProperty('--transform-x', `${currentX}px`);
            target.style.setProperty('--transform-y', `${currentY}px`);
            
            setTranslate(currentX, currentY, target);
            
            // Save the new position
            const rect = target.getBoundingClientRect();
            target.style.setProperty('--original-top', `${rect.top}px`);
            
            // Handle left/right positioning
            if (target.style.left !== 'auto') {
                target.style.setProperty('--original-left', `${rect.left}px`);
            }
            if (target.style.right !== 'auto') {
                target.style.setProperty('--original-right', `${window.innerWidth - rect.right}px`);
            }
        } else if (isResizing && resizeHandle) {
            e.preventDefault();
            const deltaX = e.clientX - initialX;
            const deltaY = e.clientY - initialY;

            if (resizeHandle.classList.contains('right') || resizeHandle.classList.contains('corner')) {
                const newWidth = Math.max(200, startWidth + deltaX);
                target.style.width = `${newWidth}px`;
                target.style.setProperty('--original-width', `${newWidth}px`);
            }
            if (resizeHandle.classList.contains('bottom') || resizeHandle.classList.contains('corner')) {
                const newHeight = Math.max(100, startHeight + deltaY);
                target.style.height = `${newHeight}px`;
                target.style.setProperty('--original-height', `${newHeight}px`);
            }
        }
    });

    // Handle drag and resize end
    document.addEventListener('mouseup', () => {
        isDragging = false;
        isResizing = false;
        resizeHandle = null;
        if (isDragging) {
            initialX = currentX;
            initialY = currentY;
        }
    });

    // Add click handler to window content to bring to front
    target.addEventListener('mousedown', () => {
        WindowManager.bringToFront(target);
    });

    // Add click handler to window header to bring to front
    header.addEventListener('click', () => {
        WindowManager.bringToFront(target);
    });

    // Clean up when the window is removed
    target.addEventListener('remove', () => {
        WindowManager.unregisterWindow(target);
    });

    function setTranslate(xPos, yPos, el) {
        el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
    }

    return true;
}

// Initialize all draggable windows in the application
export function initializeDraggableWindows() {
    console.log('Initializing all draggable windows...');
    
    // Find all windows that should be draggable (using class 'window')
    const windows = document.querySelectorAll('.window');
    console.log(`Found ${windows.length} draggable windows`);
    
    if (windows.length === 0) {
        console.warn('No draggable windows found in the DOM');
    }
    
    // Initialize each window
    windows.forEach(windowElement => {
        console.log('Initializing draggable window:', windowElement.id || 'unnamed');
        initDraggable(windowElement);
    });
    
    // Initialize dock as well
    initDock();
    
    // Hide specific windows by default (all except Scene Controls)
    const windowsToHide = ['editor-window', 'state-debug-panel', 'watcher-panel', 'engine-panel', 'asset-manager-panel'];
    windowsToHide.forEach(windowId => {
        const windowElement = document.getElementById(windowId);
        if (windowElement) {
            console.log(`Setting ${windowId} to hidden by default`);
            WindowManager.closeWindow(windowElement);
        }
    });
    
    // Update all dock icons to reflect initial window visibility
    WindowManager.windowIds.forEach(windowId => {
        const windowElement = document.getElementById(windowId);
        if (windowElement) {
            const isVisible = windowElement.style.display !== 'none';
            WindowManager.updateDockIcon(windowId, isVisible);
        }
    });
    
    return true;
}

// Initialize dock functionality
export function initDock() {
    console.log('Initializing dock...');
    
    const dock = document.getElementById('window-dock');
    if (!dock) {
        console.error('Dock element not found');
        return;
    }

    // Add click handlers for dock icons
    dock.querySelectorAll('.dock-icon').forEach(icon => {
        if (icon.classList.contains('windows-manager')) {
            // Handle windows manager button click
            icon.addEventListener('click', (e) => {
                e.stopPropagation();
                const dropdown = icon.querySelector('.windows-dropdown');
                if (dropdown) {
                    dropdown.classList.toggle('visible');
                }
            });

            // Handle windows manager dropdown items
            icon.querySelectorAll('.dropdown-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const action = item.dataset.action;
                    switch (action) {
                        case 'hide-all':
                            WindowManager.hideAllWindows();
                            break;
                        case 'show-all':
                            WindowManager.showAllWindows();
                            break;
                        case 'gather':
                            WindowManager.gatherWindows();
                            break;
                        case 'reset-layout':
                            WindowManager.resetLayout();
                            break;
                    }
                    // Hide dropdown after action
                    const dropdown = icon.querySelector('.windows-dropdown');
                    if (dropdown) {
                        dropdown.classList.remove('visible');
                    }
                });
            });
        } else if (icon.id === 'inspector-toggle') {
            // Handle inspector toggle
            icon.addEventListener('click', () => {
                const isInspectorOpen = document.body.classList.contains('aframe-inspector-opened');
                if (isInspectorOpen) {
                    // Close inspector
                    document.body.classList.remove('aframe-inspector-opened');
                    if (AFRAME.INSPECTOR && AFRAME.INSPECTOR.close) {
                        AFRAME.INSPECTOR.close();
                    }
                    icon.classList.remove('active');
                } else {
                    // Open inspector
                    document.body.classList.add('aframe-inspector-opened');
                    const scene = document.querySelector('a-scene');
                    if (scene) {
                        if (typeof window.loadAFrameInspector === 'function') {
                            window.loadAFrameInspector();
                        } else if (scene.components && scene.components.inspector) {
                            scene.components.inspector.openInspector();
                        } else if (typeof AFRAME !== 'undefined' && AFRAME.INSPECTOR) {
                            AFRAME.INSPECTOR.open();
                        }
                    }
                    icon.classList.add('active');
                }
            });

            // Set initial state
            if (document.body.classList.contains('aframe-inspector-opened')) {
                icon.classList.add('active');
            }
        } else {
            // Handle regular window icons
            const windowId = icon.dataset.window;
            if (windowId) {
                icon.addEventListener('click', () => {
                    const element = document.getElementById(windowId);
                    if (element) {
                        if (element.style.display === 'none') {
                            WindowManager.showWindow(element);
                        } else {
                            WindowManager.closeWindow(element);
                        }
                    }
                });
            }
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.windows-manager')) {
            const dropdown = dock.querySelector('.windows-dropdown');
            if (dropdown) {
                dropdown.classList.remove('visible');
            }
        }
    });
} 