// Thumbnail Service
// Modular service for generating thumbnails for various file types

import { ffmpegManager } from './ffmpeg-manager.js';
import debugLogger from '../utils/debug-logger.js';

class ThumbnailService {
    constructor() {
        this.generators = new Map();
        this.defaultOptions = {
            width: 128,
            height: 128,
            quality: 0.7,
            format: 'jpeg'
        };
        this.registerDefaultGenerators();
    }

    // Register a thumbnail generator for a specific file type
    registerGenerator(type, generator) {
        this.generators.set(type.toLowerCase(), generator);
    }

    // Check if a generator exists for a file type
    hasGenerator(type) {
        return this.generators.has(type.toLowerCase());
    }

    // Get file type from file object or name
    getFileType(file) {
        const fileName = file.name || file;
        const mimeType = file.type || '';

        // Check mime type first
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType.startsWith('video/')) return 'video';
        if (mimeType === 'application/pdf') return 'pdf';

        // Fallback to extension
        const ext = fileName.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) return 'image';
        if (['mp4', 'webm', 'mov', 'avi', 'mkv', 'm4v'].includes(ext)) return 'video';
        if (ext === 'pdf') return 'pdf';
        if (['glb', 'gltf', 'obj', 'fbx', 'stl'].includes(ext)) return '3d';

        return 'unknown';
    }

    // Main method to generate thumbnail
    async generateThumbnail(file, options = {}) {
        const type = this.getFileType(file);
        debugLogger.debug(`Thumbnail service: File ${file.name}, detected type: ${type}, mime: ${file.type}`);
        const generator = this.generators.get(type);

        if (!generator) {
            debugLogger.debug(`No thumbnail generator for type: ${type}`);
            debugLogger.debug(`Available generators:`, Array.from(this.generators.keys()));
            return null;
        }

        const mergedOptions = { ...this.defaultOptions, ...options };

        try {
            return await generator.call(this, file, mergedOptions);
        } catch (error) {
            debugLogger.error(`Error generating thumbnail for ${type}:`, error);
            return null;
        }
    }

    // Register default generators
    registerDefaultGenerators() {
        // Image thumbnail generator
        this.registerGenerator('image', this.generateImageThumbnail);

        // Video thumbnail generator
        this.registerGenerator('video', this.generateVideoThumbnail);
    }

    // Generate thumbnail for images
    async generateImageThumbnail(file, options) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const img = new Image();

                img.onload = () => {
                    try {
                        // Create canvas for thumbnail
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');

                        // Set dimensions
                        canvas.width = options.width;
                        canvas.height = options.height;

                        // Calculate scaling to maintain aspect ratio
                        const scale = Math.min(
                            options.width / img.width,
                            options.height / img.height
                        );

                        const scaledWidth = img.width * scale;
                        const scaledHeight = img.height * scale;

                        // Center the image
                        const x = (options.width - scaledWidth) / 2;
                        const y = (options.height - scaledHeight) / 2;

                        // Fill background (white)
                        ctx.fillStyle = '#FFFFFF';
                        ctx.fillRect(0, 0, options.width, options.height);

                        // Draw scaled image
                        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

                        // Convert to blob
                        canvas.toBlob((blob) => {
                            if (blob) {
                                // Read blob as ArrayBuffer for consistency
                                const reader = new FileReader();
                                reader.onload = () => {
                                    resolve({
                                        data: reader.result,
                                        dataURL: canvas.toDataURL(`image/${options.format}`, options.quality),
                                        width: options.width,
                                        height: options.height,
                                        format: options.format
                                    });
                                };
                                reader.readAsArrayBuffer(blob);
                            } else {
                                reject(new Error('Failed to create thumbnail blob'));
                            }
                        }, `image/${options.format}`, options.quality);

                    } catch (error) {
                        reject(error);
                    }
                };

                img.onerror = () => {
                    reject(new Error('Failed to load image'));
                };

                img.src = e.target.result;
            };

            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };

            reader.readAsDataURL(file);
        });
    }

    // Generate thumbnail for videos using FFmpeg
    async generateVideoThumbnail(file, options) {
        debugLogger.debug(`Starting video thumbnail generation for: ${file.name} (${file.size} bytes, type: ${file.type})`);

        // Check for very large files that might cause WASM issues
        const maxFileSize = 100 * 1024 * 1024; // 100MB limit
        if (file.size > maxFileSize) {
            debugLogger.warn(`File ${file.name} is too large (${file.size} bytes) for thumbnail generation`);
            throw new Error(`Video file too large for thumbnail generation (max ${maxFileSize} bytes)`);
        }

        // Ensure FFmpeg is loaded
        if (!ffmpegManager.isLoaded()) {
            debugLogger.debug('Loading FFmpeg...');
            await ffmpegManager.load();
        }

        const inputName = file.name;
        const outputName = `thumb_${Date.now()}.jpg`;

        try {
            debugLogger.debug(`Writing video file to FFmpeg: ${inputName} (${file.size} bytes)`);
            // Write video file to FFmpeg filesystem
            const arrayBuffer = await file.arrayBuffer();
            await ffmpegManager.writeFile(inputName, new Uint8Array(arrayBuffer));

            // Test if FFmpeg can read the file info first
            debugLogger.debug('Testing file readability with FFmpeg...');
            try {
                await ffmpegManager.exec(['-i', inputName, '-f', 'null', '-']);
                debugLogger.debug('FFmpeg can read the file successfully');
            } catch (infoError) {
                debugLogger.debug('FFmpeg file info result:', infoError.message); // This is often normal - FFmpeg reports info as "error"
            }

            // Create reactive execution controller
            const executionController = this.createReactiveExecutionController();

            debugLogger.debug('Executing FFmpeg command to generate thumbnail...');

            // Execute with reactive monitoring
            await executionController.execute(async (controller) => {
                // Set up reactive progress monitoring
                const progressHandler = controller.createProgressHandler();
                const logHandler = controller.createLogHandler();

                const unsubscribeProgress = ffmpegManager.onProgress(progressHandler);
                const unsubscribeLog = ffmpegManager.onLog(logHandler);

                controller.onCleanup(() => {
                    unsubscribeProgress();
                    unsubscribeLog();
                });

                // Try primary command with seeking
                try {
                    await controller.withProgressTracking(
                        ffmpegManager.exec([
                            '-i', inputName,
                            '-ss', '00:00:01',  // Capture at 1 second
                            '-vframes', '1',     // Extract 1 frame
                            '-vf', `scale=${options.width}:${options.height}:force_original_aspect_ratio=decrease,pad=${options.width}:${options.height}:(ow-iw)/2:(oh-ih)/2`,
                            '-f', 'mjpeg',       // Force MJPEG output format
                            '-y',                // Overwrite output file
                            outputName
                        ])
                    );
                } catch (seekError) {
                    debugLogger.debug('Seek failed, trying from start of video...');
                    // Fallback without seeking
                    await controller.withProgressTracking(
                        ffmpegManager.exec([
                            '-i', inputName,
                            '-vframes', '1',     // Extract 1 frame
                            '-vf', `scale=${options.width}:${options.height}:force_original_aspect_ratio=decrease,pad=${options.width}:${options.height}:(ow-iw)/2:(oh-ih)/2`,
                            '-f', 'mjpeg',       // Force MJPEG output format
                            '-y',                // Overwrite output file
                            outputName
                        ])
                    );
                }
            });

            debugLogger.debug('Reading generated thumbnail...');
            // Read the generated thumbnail
            const thumbnailData = await ffmpegManager.readFile(outputName);
            debugLogger.debug(`Generated thumbnail size: ${thumbnailData.length} bytes`);

            debugLogger.debug('Cleaning up FFmpeg files...');
            // Clean up temporary files
            await ffmpegManager.deleteFile(inputName);
            await ffmpegManager.deleteFile(outputName);

            // Create data URL for preview
            const blob = new Blob([thumbnailData], { type: 'image/jpeg' });
            const dataURL = await this.blobToDataURL(blob);

            debugLogger.debug('Video thumbnail generated successfully');
            return {
                data: thumbnailData.buffer,
                dataURL: dataURL,
                width: options.width,
                height: options.height,
                format: 'jpeg'
            };

        } catch (error) {
            debugLogger.error('Error generating video thumbnail:', error);
            // Clean up on error
            try {
                await ffmpegManager.deleteFile(inputName);
                await ffmpegManager.deleteFile(outputName);
            } catch (e) {
                debugLogger.debug('Cleanup error (ignoring):', e);
            }
            throw error;
        }
    }

    // Helper method to convert blob to data URL
    blobToDataURL(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    // Create reactive execution controller for FFmpeg operations
    createReactiveExecutionController() {
        return {
            cleanupTasks: [],
            abortController: new AbortController(),
            progressState: {
                started: false,
                progress: 0,
                lastActivity: Date.now(),
                stalled: false
            },

            // Execute with reactive monitoring and automatic cleanup
            async execute(executorFn) {
                const controller = this.createController();

                // Set up abort signal handling
                const abortPromise = new Promise((_, reject) => {
                    this.abortController.signal.addEventListener('abort', () => {
                        reject(new Error('FFmpeg operation was aborted'));
                    });
                });

                try {
                    // Race between execution and abort signal
                    await Promise.race([
                        executorFn(controller),
                        abortPromise
                    ]);
                } finally {
                    // Always cleanup, even on error
                    controller.cleanup();
                }
            },

            // Abort the execution
            abort() {
                this.abortController.abort();
            },

            createController() {
                const self = this;
                return {
                    // Register cleanup tasks
                    onCleanup(task) {
                        self.cleanupTasks.push(task);
                    },

                    // Create progress handler with stall detection
                    createProgressHandler() {
                        return (progress) => {
                            self.progressState.started = true;
                            self.progressState.progress = progress.progress || 0;
                            self.progressState.lastActivity = Date.now();
                            self.progressState.stalled = false;

                            debugLogger.debug(`FFmpeg progress: ${progress.progress}% - ${progress.time || 'unknown time'}`);
                        };
                    },

                    // Create log handler with error detection
                    createLogHandler() {
                        return (log) => {
                            self.progressState.lastActivity = Date.now();

                            // Log important messages
                            if (log.type === 'fferr' || log.message.includes('error')) {
                                debugLogger.error('FFmpeg error:', log.message);
                            } else if (log.message.includes('frame=') || log.message.includes('fps=')) {
                                debugLogger.debug('FFmpeg processing:', log.message);
                            }
                        };
                    },

                    // Execute with progress tracking and stall detection
                    async withProgressTracking(promise) {
                        // Reset progress state
                        self.progressState.started = false;
                        self.progressState.progress = 0;
                        self.progressState.lastActivity = Date.now();
                        self.progressState.stalled = false;

                        // Create activity monitor using requestIdleCallback for better performance
                        const activityMonitor = this.createActivityMonitor();

                        try {
                            const result = await promise;
                            activityMonitor.stop();
                            return result;
                        } catch (error) {
                            activityMonitor.stop();
                            throw error;
                        }
                    },

                    // Create activity monitor using modern browser APIs and reactive patterns
                    createActivityMonitor() {
                        let monitoring = true;
                        let stallCheckCount = 0;
                        const maxStallChecks = 30; // 30 seconds with 1s intervals

                        // Use a more reactive approach with IntersectionObserver pattern
                        const createReactiveChecker = () => {
                            let lastCheck = Date.now();

                            const reactiveCheck = () => {
                                if (!monitoring || self.abortController.signal.aborted) return;

                                const now = Date.now();
                                const timeSinceActivity = now - self.progressState.lastActivity;
                                const timeSinceLastCheck = now - lastCheck;
                                lastCheck = now;

                                // More sophisticated stall detection
                                if (self.progressState.started) {
                                    if (timeSinceActivity > 5000) {
                                        stallCheckCount++;
                                        debugLogger.warn(`FFmpeg stall detected (${stallCheckCount}/${maxStallChecks}) - ${Math.round(timeSinceActivity/1000)}s since activity`);

                                        if (stallCheckCount >= maxStallChecks) {
                                            self.progressState.stalled = true;
                                            debugLogger.error('FFmpeg execution stalled - aborting');
                                            monitoring = false;
                                            self.abortController.abort(); // Use abort signal instead of throw
                                            return;
                                        }
                                    } else {
                                        stallCheckCount = Math.max(0, stallCheckCount - 1); // Gradual recovery
                                    }
                                }

                                // Schedule next check using best available method
                                if (window.requestIdleCallback && timeSinceLastCheck < 2000) {
                                    // Use idle callback for frequent checks
                                    requestIdleCallback(() => {
                                        if (monitoring) setTimeout(reactiveCheck, 1000);
                                    }, { timeout: 2000 });
                                } else {
                                    // Fallback to setTimeout
                                    setTimeout(reactiveCheck, 1000);
                                }
                            };

                            return reactiveCheck;
                        };

                        // Start reactive monitoring
                        const reactiveChecker = createReactiveChecker();

                        // Initial check using microtask for immediate reactivity
                        if (window.queueMicrotask) {
                            queueMicrotask(reactiveChecker);
                        } else {
                            Promise.resolve().then(reactiveChecker);
                        }

                        return {
                            stop() {
                                monitoring = false;
                            }
                        };
                    },

                    // Cleanup all registered tasks
                    cleanup() {
                        self.cleanupTasks.forEach(task => {
                            try {
                                task();
                            } catch (error) {
                                debugLogger.warn('Cleanup task failed:', error);
                            }
                        });
                        self.cleanupTasks = [];
                    }
                };
            }
        };
    }

    // Placeholder: Generate thumbnail for PDFs
    // TODO: Implement using PDF.js or similar library
    // Expected implementation:
    // 1. Load PDF using PDF.js
    // 2. Render first page to canvas
    // 3. Resize to thumbnail dimensions
    // 4. Return as blob
    async generatePDFThumbnail(file, options) {
        throw new Error('PDF thumbnail generation not yet implemented');
    }

    // Placeholder: Generate thumbnail for 3D models
    // TODO: Implement using Three.js or similar library
    // Expected implementation:
    // 1. Load 3D model (GLTF, OBJ, FBX, etc.)
    // 2. Create Three.js scene with default lighting
    // 3. Position camera for optimal view
    // 4. Render to canvas and export
    async generate3DThumbnail(file, options) {
        throw new Error('3D model thumbnail generation not yet implemented');
    }
}

// Export singleton instance
export const thumbnailService = new ThumbnailService();

// Also export class for testing or custom instances
export default ThumbnailService;
