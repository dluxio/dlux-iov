// Draggable window functionality
const uiContainer = document.getElementById('ui-container');
const windowHeader = uiContainer.querySelector('.window-header');
const windowContent = uiContainer.querySelector('.window-content');
const minimizeBtn = uiContainer.querySelector('.minimize-btn');
const maximizeBtn = uiContainer.querySelector('.maximize-btn');

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

// Handle drag start
windowHeader.addEventListener('mousedown', dragStart);

// Handle window controls
minimizeBtn.addEventListener('click', () => {
    const isCollapsed = windowContent.classList.contains('collapsed');
    windowContent.classList.toggle('collapsed');
    uiContainer.classList.toggle('collapsed');
    minimizeBtn.textContent = isCollapsed ? '_' : '□';
    
    // If collapsing, save current height and set to minimum
    if (!isCollapsed) {
        uiContainer.dataset.prevHeight = uiContainer.style.height;
        uiContainer.style.height = '40px';
    } else {
        // If expanding, restore previous height
        uiContainer.style.height = uiContainer.dataset.prevHeight || '80vh';
    }
});

maximizeBtn.addEventListener('click', () => {
    // If window is collapsed, expand it first
    if (windowContent.classList.contains('collapsed')) {
        windowContent.classList.remove('collapsed');
        uiContainer.classList.remove('collapsed');
        minimizeBtn.textContent = '_';
        uiContainer.style.height = uiContainer.dataset.prevHeight || '80vh';
    }

    // Toggle maximize state
    if (uiContainer.classList.contains('maximized')) {
        // Restore previous size and position
        uiContainer.style.width = uiContainer.dataset.prevWidth || '300px';
        uiContainer.style.height = uiContainer.dataset.prevHeight || '80vh';
        uiContainer.style.top = uiContainer.dataset.prevTop || '20px';
        uiContainer.style.right = uiContainer.dataset.prevRight || '20px';
        uiContainer.classList.remove('maximized');
        maximizeBtn.textContent = '□';
        // Restore previous transform
        setTranslate(xOffset, yOffset, uiContainer);
    } else {
        // Save current state and maximize
        uiContainer.dataset.prevWidth = uiContainer.style.width;
        uiContainer.dataset.prevHeight = uiContainer.style.height;
        uiContainer.dataset.prevTop = uiContainer.style.top;
        uiContainer.dataset.prevRight = uiContainer.style.right;
        uiContainer.style.width = '100%';
        uiContainer.style.height = '100%';
        uiContainer.style.top = '0';
        uiContainer.style.right = '0';
        uiContainer.classList.add('maximized');
        maximizeBtn.textContent = '❐';
        // Reset transform to origin
        setTranslate(0, 0, uiContainer);
        xOffset = 0;
        yOffset = 0;
    }
});

// Handle resize start
const resizeHandles = uiContainer.querySelectorAll('.resize-handle');
resizeHandles.forEach(handle => {
    handle.addEventListener('mousedown', (e) => {
        isResizing = true;
        resizeHandle = handle;
        startWidth = uiContainer.offsetWidth;
        startHeight = uiContainer.offsetHeight;
        initialX = e.clientX;
        initialY = e.clientY;
        e.preventDefault();
    });
});

function dragStart(e) {
    if (e.target === windowHeader) {
        isDragging = true;
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
    }
}

// Handle drag and resize
document.addEventListener('mousemove', (e) => {
    if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        xOffset = currentX;
        yOffset = currentY;
        setTranslate(currentX, currentY, uiContainer);
    } else if (isResizing && resizeHandle) {
        e.preventDefault();
        const deltaX = e.clientX - initialX;
        const deltaY = e.clientY - initialY;

        if (resizeHandle.classList.contains('right') || resizeHandle.classList.contains('corner')) {
            const newWidth = Math.max(200, startWidth + deltaX);
            uiContainer.style.width = `${newWidth}px`;
        }
        if (resizeHandle.classList.contains('bottom') || resizeHandle.classList.contains('corner')) {
            const newHeight = Math.max(100, startHeight + deltaY);
            uiContainer.style.height = `${newHeight}px`;
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

function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
} 