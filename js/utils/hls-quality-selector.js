// HLS Quality Selector Utility
// Creates a quality selector overlay for HLS video players

import debugLogger from './debug-logger.js';

export class HLSQualitySelector {
    constructor(hlsInstance, videoElement, options = {}) {
        this.hls = hlsInstance;
        this.video = videoElement;
        this.options = {
            position: 'top-right',  // Changed default to top-right
            showBitrate: true,
            persistQuality: true,
            storageKey: 'dlux_preferred_quality',
            ...options
        };
        
        this.container = null;
        this.button = null;
        this.menu = null;
        this.isMenuOpen = false;
        this.currentLevelIndex = -1;
        this.pendingQuality = undefined; // Store quality preference until HLS is ready
        
        this.init();
    }
    
    init() {
        // Load quality preference early (will be stored as pending if needed)
        this.loadQualityPreference();
        
        // Wait for manifest to be parsed
        if (this.hls.levels && this.hls.levels.length > 0) {
            this.createUI();
        } else {
            this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                this.createUI();
                this.applyPendingQuality(); // Apply any pending quality preference
            });
        }
        
        // Listen for level switches
        this.hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
            this.currentLevelIndex = data.level;
            this.updateButtonText();
            this.updateMenuItems();
        });
        
        // Clean up on video element removal
        const observer = new MutationObserver((mutations) => {
            if (!document.body.contains(this.video)) {
                this.destroy();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        this.observer = observer;
    }
    
    createUI() {
        // Only create if we have multiple quality levels
        if (this.hls.levels.length <= 1) {
            return;
        }
        
        // Create container
        this.container = document.createElement('div');
        this.container.className = 'hls-quality-selector position-absolute top-0 end-0';
        this.container.setAttribute('data-position', this.options.position);
        
        // Create button
        this.button = document.createElement('button');
        this.button.className = 'hls-quality-button';
        this.button.innerHTML = '<span class="quality-text">Auto</span>';
        this.button.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMenu();
        });
        
        // Create menu
        this.menu = document.createElement('div');
        this.menu.className = 'hls-quality-menu';
        this.menu.style.display = 'none';
        
        // Add Auto option
        const autoItem = this.createMenuItem(-1, 'Auto', null);
        this.menu.appendChild(autoItem);
        
        // Add separator
        const separator = document.createElement('div');
        separator.className = 'hls-quality-separator';
        this.menu.appendChild(separator);
        
        // Add quality levels (highest first)
        const levels = [...this.hls.levels].sort((a, b) => b.height - a.height);
        levels.forEach((level, sortedIndex) => {
            // Find original index
            const originalIndex = this.hls.levels.findIndex(l => l === level);
            const item = this.createMenuItem(
                originalIndex,
                `${level.height}p`,
                this.options.showBitrate ? level.bitrate : null
            );
            this.menu.appendChild(item);
        });
        
        // Assemble UI
        this.container.appendChild(this.button);
        this.container.appendChild(this.menu);
        
        // Find or create wrapper
        let wrapper = this.video.parentElement;
        if (!wrapper || wrapper === document.body) {
            wrapper = document.createElement('div');
            wrapper.className = 'hls-video-wrapper';
            this.video.parentNode.insertBefore(wrapper, this.video);
            wrapper.appendChild(this.video);
        }
        
        // Add to wrapper
        wrapper.style.position = 'relative';
        wrapper.appendChild(this.container);
        
        // Set initial state
        this.updateButtonText();
        this.updateMenuItems();
        
        // Load saved quality preference
        if (this.options.persistQuality) {
            this.loadQualityPreference();
        }
        
        // Close menu on outside click
        document.addEventListener('click', this.handleOutsideClick.bind(this));
        
        // Track play state for visibility control
        const updatePlayState = () => {
            if (this.video.paused || this.video.ended) {
                wrapper.classList.remove('video-playing');
            } else {
                wrapper.classList.add('video-playing');
            }
        };
        
        // Add event listeners
        this.video.addEventListener('play', updatePlayState);
        this.video.addEventListener('pause', updatePlayState);
        this.video.addEventListener('ended', updatePlayState);
        
        // Set initial state
        updatePlayState();
    }
    
    createMenuItem(levelIndex, label, bitrate) {
        const item = document.createElement('div');
        item.className = 'hls-quality-item';
        item.setAttribute('data-level', levelIndex);
        
        const text = document.createElement('span');
        text.className = 'quality-label';
        text.textContent = label;
        item.appendChild(text);
        
        if (bitrate) {
            const bitrateText = document.createElement('span');
            bitrateText.className = 'quality-bitrate';
            bitrateText.textContent = `${Math.round(bitrate / 1000)}kbps`;
            item.appendChild(bitrateText);
        }
        
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectQuality(levelIndex);
        });
        
        return item;
    }
    
    toggleMenu() {
        this.isMenuOpen = !this.isMenuOpen;
        this.menu.style.display = this.isMenuOpen ? 'block' : 'none';
        this.container.classList.toggle('menu-open', this.isMenuOpen);
    }
    
    closeMenu() {
        this.isMenuOpen = false;
        this.menu.style.display = 'none';
        this.container.classList.remove('menu-open');
    }
    
    handleOutsideClick(e) {
        if (this.container && !this.container.contains(e.target)) {
            this.closeMenu();
        }
    }
    
    selectQuality(levelIndex) {
        // Guard against destroyed HLS instance
        if (!this.hls) {
            debugLogger.debug('HLS instance is null, cannot select quality');
            return;
        }
        
        this.hls.currentLevel = levelIndex;
        this.closeMenu();
        
        // Save preference
        if (this.options.persistQuality) {
            this.saveQualityPreference(levelIndex);
        }
        
        debugLogger.debug(`Quality changed to level ${levelIndex}`);
    }
    
    applyPendingQuality() {
        if (this.pendingQuality !== undefined && this.hls && this.hls.levels && this.hls.levels.length > 0) {
            const levelIndex = this.pendingQuality;
            if (levelIndex === -1 || (levelIndex >= 0 && levelIndex < this.hls.levels.length)) {
                debugLogger.debug(`Applying pending quality preference: ${levelIndex}`);
                this.selectQuality(levelIndex);
            }
            this.pendingQuality = undefined;
        }
    }
    
    updateButtonText() {
        if (!this.button) return;
        
        const qualityText = this.button.querySelector('.quality-text');
        if (!qualityText) return;
        
        if (this.hls.autoLevelEnabled) {
            const currentLevel = this.hls.levels[this.hls.currentLevel];
            if (currentLevel) {
                qualityText.textContent = `Auto (${currentLevel.height}p)`;
            } else {
                qualityText.textContent = 'Auto';
            }
        } else {
            const level = this.hls.levels[this.hls.currentLevel];
            if (level) {
                qualityText.textContent = `${level.height}p`;
            }
        }
    }
    
    updateMenuItems() {
        if (!this.menu) return;
        
        const items = this.menu.querySelectorAll('.hls-quality-item');
        items.forEach(item => {
            const level = parseInt(item.getAttribute('data-level'));
            const isActive = level === this.hls.currentLevel || 
                           (level === -1 && this.hls.autoLevelEnabled);
            item.classList.toggle('active', isActive);
        });
    }
    
    saveQualityPreference(levelIndex) {
        try {
            localStorage.setItem(this.options.storageKey, levelIndex.toString());
        } catch (e) {
            debugLogger.debug('Could not save quality preference:', e);
        }
    }
    
    loadQualityPreference() {
        try {
            const saved = localStorage.getItem(this.options.storageKey);
            if (saved !== null) {
                const levelIndex = parseInt(saved);
                this.pendingQuality = levelIndex; // Store for reactive application
                
                // Apply immediately if levels are ready
                if (this.hls && this.hls.levels && this.hls.levels.length > 0) {
                    this.applyPendingQuality();
                }
                // Otherwise, it will be applied when MANIFEST_PARSED fires
            }
        } catch (e) {
            debugLogger.debug('Could not load quality preference:', e);
        }
    }
    
    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        
        if (this.observer) {
            this.observer.disconnect();
        }
        
        // Clean up event listeners
        document.removeEventListener('click', this.handleOutsideClick);
        
        this.hls = null;
        this.video = null;
        this.container = null;
        this.button = null;
        this.menu = null;
    }
}

// Factory function for easy creation
export function createQualitySelector(hlsInstance, videoElement, options) {
    return new HLSQualitySelector(hlsInstance, videoElement, options);
}

// Auto-inject for all HLS videos (optional)
export function enableAutoQualitySelectors() {
    // Listen for HLS player creation
    const originalHls = window.Hls;
    if (!originalHls) return;
    
    window.Hls = class extends originalHls {
        attachMedia(media) {
            super.attachMedia(media);
            // Auto-create quality selector
            if (!media.hlsQualitySelector) {
                media.hlsQualitySelector = new HLSQualitySelector(this, media);
            }
        }
    };
    
    // Copy static properties
    Object.setPrototypeOf(window.Hls, originalHls);
    Object.keys(originalHls).forEach(key => {
        window.Hls[key] = originalHls[key];
    });
}

export default HLSQualitySelector;