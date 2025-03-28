// Global z-index tracker and window management
const WindowManager = {
    highestZIndex: 1000,
    windows: new Set(),
    closedWindows: new Map(),
    
    bringToFront(element) {
        // Remove active class from all windows
        this.windows.forEach(win => {
            win.classList.remove('active');
        });
        
        // Add active class to current window
        element.classList.add('active');
        
        // Update global z-index
        this.highestZIndex++;
        element.style.zIndex = this.highestZIndex;
        
        // Force a reflow to ensure z-index is applied
        element.offsetHeight;
    },
    
    registerWindow(element) {
        this.windows.add(element);
        element.style.zIndex = this.highestZIndex++;
    },
    
    unregisterWindow(element) {
        this.windows.delete(element);
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
            setTranslate(currentX, currentY, target);
            
            // Save the new position
            const rect = target.getBoundingClientRect();
            target.style.setProperty('--original-top', `${rect.top}px`);
            target.style.setProperty('--original-left', `${rect.left}px`);
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

// Initialize dock functionality
export function initDock() {
    const dock = document.getElementById('window-dock');
    if (!dock) return;

    // Add click handlers to dock icons
    dock.querySelectorAll('.dock-icon').forEach(icon => {
        icon.addEventListener('click', () => {
            const windowId = icon.getAttribute('data-window');
            const window = document.getElementById(windowId);
            if (window) {
                if (window.style.display === 'none') {
                    WindowManager.showWindow(window);
                } else {
                    WindowManager.closeWindow(window);
                }
            }
        });
    });
} 