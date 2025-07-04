// FFmpeg Manager Service
// Singleton service for managing FFmpeg instance across the application

class FFmpegManager {
    constructor() {
        this.ffmpeg = null;
        this.loaded = false;
        this.loading = false;
        this.progressCallbacks = new Set();
        this.logCallbacks = new Set();
        this.loadPromise = null;
        this.isMultiThreaded = false;
        this.supportsSharedArrayBuffer = this.checkSharedArrayBufferSupport();
    }
    
    // Check SharedArrayBuffer support for multithreading
    checkSharedArrayBufferSupport() {
        try {
            return typeof SharedArrayBuffer !== 'undefined' && 
                   typeof Atomics !== 'undefined' &&
                   self.crossOriginIsolated !== false;
        } catch (e) {
            return false;
        }
    }

    // Get singleton instance
    static getInstance() {
        if (!FFmpegManager.instance) {
            FFmpegManager.instance = new FFmpegManager();
        }
        return FFmpegManager.instance;
    }
    
    // Load FFmpeg (idempotent - safe to call multiple times)
    async load(useMultiThreaded = null) {
        // If already loaded with different threading mode, warn but return existing
        if (this.loaded) {
            const requestedMT = useMultiThreaded !== null ? useMultiThreaded : this.supportsSharedArrayBuffer;
            if (requestedMT !== this.isMultiThreaded) {
                console.warn(`FFmpeg Manager: Already loaded with ${this.isMultiThreaded ? 'multi-threaded' : 'single-threaded'} mode, cannot change to ${requestedMT ? 'multi-threaded' : 'single-threaded'} mode without page reload`);
            }
            return this.ffmpeg;
        }
        
        // If currently loading, return the existing promise
        if (this.loading && this.loadPromise) {
            return this.loadPromise;
        }
        
        // Always use multi-threaded version if supported
        this.isMultiThreaded = this.supportsSharedArrayBuffer;
        
        // Start loading
        this.loading = true;
        this.loadPromise = this._performLoad();
        
        try {
            await this.loadPromise;
            return this.ffmpeg;
        } catch (error) {
            this.loading = false;
            this.loadPromise = null;
            throw error;
        }
    }
    
    // Private method to actually load FFmpeg
    async _performLoad() {
        try {
            // Check if FFmpeg is already available globally
            if (!window.FFmpegWASM || !window.FFmpegUtil) {
                // Load the required scripts
                await this._loadScripts();
            }
            
            // Create FFmpeg instance
            const { FFmpeg } = window.FFmpegWASM;
            this.ffmpeg = new FFmpeg();
            
            // Load FFmpeg core with multithreading support
            let coreURL, loadOptions;
            
            if (this.isMultiThreaded) {
                coreURL = '/packages/core-mt/package/dist/umd';
                loadOptions = {
                    coreURL: `${coreURL}/ffmpeg-core.js`,
                    wasmURL: `${coreURL}/ffmpeg-core.wasm`,
                    workerURL: `${coreURL}/ffmpeg-core.worker.js`,
                };
                console.log('FFmpeg Manager: Loading with multithreading support');
            } else {
                coreURL = '/packages/core/package/dist/umd';
                loadOptions = {
                    coreURL: `${coreURL}/ffmpeg-core.js`,
                    wasmURL: `${coreURL}/ffmpeg-core.wasm`,
                };
                console.log('FFmpeg Manager: Loading in single-threaded mode');
            }
            
            await this.ffmpeg.load(loadOptions);
            
            // Try to set up event handlers
            this._setupEventHandlers();
            
            this.loaded = true;
            this.loading = false;
            
            console.log('FFmpeg Manager: FFmpeg loaded successfully');
            return this.ffmpeg;
            
        } catch (error) {
            console.error('FFmpeg Manager: Failed to load FFmpeg', error);
            throw error;
        }
    }
    
    // Load required scripts with multithreading support
    async _loadScripts() {
        let scripts;
        
        if (this.supportsSharedArrayBuffer) {
            console.log('FFmpeg Manager: SharedArrayBuffer supported, loading multithreaded core');
            scripts = [
                '/packages/ffmpeg/package/dist/umd/ffmpeg.js',
                '/packages/util/package/dist/umd/index.js',
                '/packages/core-mt/package/dist/umd/ffmpeg-core.js'
            ];
            this.isMultiThreaded = true;
        } else {
            console.log('FFmpeg Manager: SharedArrayBuffer not supported, loading single-threaded core');
            scripts = [
                '/packages/ffmpeg/package/dist/umd/ffmpeg.js',
                '/packages/util/package/dist/umd/index.js',
                '/packages/core/package/dist/umd/ffmpeg-core.js'
            ];
            this.isMultiThreaded = false;
        }
        
        for (const src of scripts) {
            await this._loadScript(src);
        }
    }
    
    // Load a single script
    async _loadScript(src) {
        return new Promise((resolve, reject) => {
            // Check if script already exists
            const existing = document.querySelector(`script[src="${src}"]`);
            if (existing) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    // Set up event handlers (with error handling)
    _setupEventHandlers() {
        try {
            // Set up progress handler
            this.ffmpeg.on('progress', (event) => {
                this.progressCallbacks.forEach(callback => {
                    try {
                        callback(event);
                    } catch (error) {
                        console.error('FFmpeg Manager: Error in progress callback', error);
                    }
                });
            });
            
            // Set up log handler
            this.ffmpeg.on('log', (event) => {
                this.logCallbacks.forEach(callback => {
                    try {
                        callback(event);
                    } catch (error) {
                        console.error('FFmpeg Manager: Error in log callback', error);
                    }
                });
            });
            
            console.log('FFmpeg Manager: Event handlers set up successfully');
        } catch (error) {
            console.warn('FFmpeg Manager: Could not set up event handlers, progress tracking may not work', error);
        }
    }
    
    // Register a progress callback
    onProgress(callback) {
        this.progressCallbacks.add(callback);
        
        // Return unsubscribe function
        return () => {
            this.progressCallbacks.delete(callback);
        };
    }
    
    // Register a log callback
    onLog(callback) {
        this.logCallbacks.add(callback);
        
        // Return unsubscribe function
        return () => {
            this.logCallbacks.delete(callback);
        };
    }
    
    // Execute FFmpeg command
    async exec(args, timeout = -1) {
        if (!this.loaded) {
            throw new Error('FFmpeg not loaded. Call load() first.');
        }
        
        try {
            return await this.ffmpeg.exec(args, timeout);
        } catch (error) {
            // Enhanced error reporting for FFmpeg execution
            console.error('FFmpeg Manager: Command failed:', args, error);
            throw error;
        }
    }
    
    // Write file to FFmpeg file system
    async writeFile(path, data) {
        if (!this.loaded) {
            throw new Error('FFmpeg not loaded. Call load() first.');
        }
        
        return this.ffmpeg.writeFile(path, data);
    }
    
    // Read file from FFmpeg file system
    async readFile(path) {
        if (!this.loaded) {
            throw new Error('FFmpeg not loaded. Call load() first.');
        }
        
        return this.ffmpeg.readFile(path);
    }
    
    // Delete file from FFmpeg file system
    async deleteFile(path) {
        if (!this.loaded) {
            throw new Error('FFmpeg not loaded. Call load() first.');
        }
        
        try {
            return await this.ffmpeg.deleteFile(path);
        } catch (error) {
            // Enhanced error handling for file operations
            if (error.message && error.message.includes('no such file')) {
                // File doesn't exist, this is often expected
                console.debug(`FFmpeg Manager: File ${path} doesn't exist, skipping deletion`);
                return;
            }
            throw error;
        }
    }
    
    // List directory contents
    async listDir(path) {
        if (!this.loaded) {
            throw new Error('FFmpeg not loaded. Call load() first.');
        }
        
        return this.ffmpeg.listDir(path);
    }
    
    // Check if FFmpeg is loaded
    isLoaded() {
        return this.loaded;
    }
    
    // Check if multithreading is enabled
    isMultiThreadingEnabled() {
        return this.isMultiThreaded && this.loaded;
    }
    
    // Get performance info
    getPerformanceInfo() {
        return {
            isLoaded: this.loaded,
            isMultiThreaded: this.isMultiThreaded,
            supportsSharedArrayBuffer: this.supportsSharedArrayBuffer,
            estimatedSpeedMultiplier: this.isMultiThreaded ? 2.0 : 1.0
        };
    }
    
    // Get FFmpeg instance (for advanced use)
    getInstance() {
        if (!this.loaded) {
            throw new Error('FFmpeg not loaded. Call load() first.');
        }
        
        return this.ffmpeg;
    }
    
    // Terminate FFmpeg (use with caution - affects all users of the singleton)
    terminate() {
        if (this.ffmpeg) {
            this.ffmpeg.terminate();
        }
        
        this.ffmpeg = null;
        this.loaded = false;
        this.loading = false;
        this.loadPromise = null;
        this.progressCallbacks.clear();
        this.logCallbacks.clear();
        
        // Clear the singleton instance
        FFmpegManager.instance = null;
    }
}

// Create and export the singleton instance
const ffmpegManager = FFmpegManager.getInstance();

export { ffmpegManager, FFmpegManager };