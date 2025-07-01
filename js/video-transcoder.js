// Video Transcoder Component
// Modular FFmpeg.wasm integration for video transcoding across DLUX IOV

import { ffmpegManager } from './services/ffmpeg-manager.js';
import { ProcessedFile, FileRoles } from './utils/processed-file.js';
import debugLogger from './utils/debug-logger.js';

// Global variable to track the currently active transcoding session
let activeTranscodingSession = null;

export default {
    name: 'VideoTranscoder',
    
    template: `
    <div class="video-transcoder">
        <template v-if="!headless">
        <!-- FFmpeg Loading State -->
        <div v-if="state === 'loading'" class="text-center">
            <h5>Loading Video Transcoder</h5>
            <div class="progress mb-3">
                <div class="progress-bar progress-bar-striped progress-bar-animated" 
                     :style="'width: ' + loadProgress + '%'"
                     role="progressbar">
                    {{ loadProgress }}%
                </div>
            </div>
            <p class="text-muted">{{ loadMessage }}</p>
            <div v-if="performanceInfo" class="mb-3">
                <small class="text-info">
                    <i class="fa-solid fa-bolt me-1"></i>
                    Performance: {{ performanceInfo.isMultiThreaded ? 'Multi-threaded' : 'Single-threaded' }}
                    ({{ performanceInfo.estimatedSpeedMultiplier }}x speed)
                </small>
            </div>
            <button class="btn btn-secondary btn-sm" @click="skipTranscoding">
                Skip Transcoding
            </button>
        </div>

        <!-- Transcoding Options -->
        <div v-else-if="state === 'ready'" class="transcoding-options">
            <h5>Video Transcoding Options</h5>
            <p class="text-muted">{{ fileName }} ({{ formatFileSize(fileSize) }})</p>
            
            <div class="mb-3">
                <label class="form-label">What would you like to upload?</label>
                <div class="form-check">
                    <input class="form-check-input" type="radio" v-model="uploadChoice" 
                           value="transcode" id="transcodeOnly">
                    <label class="form-check-label" for="transcodeOnly">
                        <i class="fa-solid fa-video me-1"></i>Transcoded streaming version only (Recommended)
                    </label>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="radio" v-model="uploadChoice" 
                           value="original" id="originalOnly">
                    <label class="form-check-label" for="originalOnly">
                        <i class="fa-solid fa-file-video me-1"></i>Original file only
                    </label>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="radio" v-model="uploadChoice" 
                           value="both" id="uploadBoth">
                    <label class="form-check-label" for="uploadBoth">
                        <i class="fa-solid fa-folder-open me-1"></i>Both original and transcoded
                    </label>
                </div>
            </div>

            <div v-if="uploadChoice !== 'original'" class="mb-3">
                <label class="form-label">Transcoding Quality</label>
                <select class="form-select" v-model="selectedQuality">
                    <option value="auto">Auto (Based on source)</option>
                    <option value="1080p">1080p HD</option>
                    <option value="720p">720p HD</option>
                    <option value="480p">480p SD</option>
                </select>
            </div>

            <div v-if="uploadChoice !== 'original'" class="mb-3">
                <label class="form-label">Encoding Speed</label>
                <select class="form-select" v-model="encodingSpeed">
                    <option value="balanced">Balanced (Default)</option>
                    <option value="fast">Fast (20-30% faster)</option>
                    <option value="ultrafast">Ultra Fast (2x faster, larger files)</option>
                </select>
                <small class="form-text text-muted">
                    Faster encoding speeds reduce quality slightly but significantly improve processing time
                </small>
            </div>

            <div v-if="uploadChoice !== 'original'" class="mb-3">
                <label class="form-label">Quality Mode</label>
                <select class="form-select" v-model="qualityMode">
                    <option value="bitrate">Bitrate Targeting (Default)</option>
                    <option value="crf">Constant Quality (CRF)</option>
                </select>
                <small class="form-text text-muted">
                    CRF mode provides better quality consistency but variable file sizes
                </small>
            </div>


            <div class="d-flex gap-2">
                <button class="btn btn-primary" @click="startProcess" :disabled="!uploadChoice">
                    <i class="fa-solid fa-play me-1"></i>{{ getActionText }}
                </button>
                <button class="btn btn-secondary" @click="cancel">
                    Cancel
                </button>
            </div>
        </div>

        <!-- Transcoding Progress -->
        <!-- WARNING: This UI is NOT VISIBLE when component is used in headless mode! -->
        <!-- filesvue-dd.js uses this component with :headless="true" so these UI updates are NOT shown to users -->
        <!-- To update user-visible progress, you must modify the UI in filesvue-dd.js, NOT here! -->
        <div v-else-if="state === 'transcoding'" class="transcoding-progress">
            <h5>Transcoding Video</h5>
            
            <!-- Overall Status -->
            <div class="mb-3">
                <div class="d-flex justify-content-between mb-1">
                    <span>{{ transcodeMessage }}</span>
                    <span>{{ transcodeProgress }}%</span>
                </div>
                <!-- Additional info line when processing multiple resolutions -->
                <div v-if="availableResolutionsForUI.length > 1 && currentResolutionHeight" class="text-muted small">
                    Processing resolution {{ getCurrentResolutionIndex() }} of {{ availableResolutionsForUI.length }}
                </div>
                
                <!-- Always show single progress bar -->
                <div class="progress mb-2">
                    <div class="progress-bar progress-bar-striped progress-bar-animated bg-success" 
                         :style="'width: ' + transcodeProgress + '%'"
                         role="progressbar">
                    </div>
                </div>
                
                <!-- Individual resolution progress bars (disabled for now) -->
                <div v-if="false && showMultiProgress" class="resolution-progress-container">
                    <div v-for="resolution in availableResolutionsForUI" 
                         :key="resolution.height" 
                         class="resolution-progress-item mb-2"
                         :data-status="getResolutionStatus(resolution.height)">
                        
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <span class="fw-medium">
                                <i :class="getResolutionStatusIcon(resolution.height)" class="me-1"></i>
                                {{ resolution.height }}p ({{ resolution.width }}x{{ resolution.height }})
                            </span>
                            <small class="text-muted">
                                {{ getResolutionStatusText(resolution.height) }}
                            </small>
                        </div>
                        
                        <div class="progress" style="height: 8px;">
                            <div class="progress-bar progress-bar-striped progress-bar-animated" 
                                 :class="getProgressBarClass(resolution.height)"
                                 :style="'width: ' + getResolutionProgress(resolution.height) + '%'"
                                 role="progressbar">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <p class="text-muted small">
                <i class="fa-solid fa-info-circle me-1"></i>
                <span v-if="!showMultiProgress">This may take several minutes depending on video size and quality</span>
                <span v-else>Processing {{ availableResolutionsForUI.length }} resolutions sequentially{{ performanceInfo?.isMultiThreaded ? ' with multi-threading' : '' }}</span>
            </p>
            
            <!-- Debug info -->
            <div v-if="false" class="text-muted small">
                Debug: showMultiProgress={{ showMultiProgress }}, resolutions={{ availableResolutionsForUI.length }}
            </div>
        </div>

        <!-- Success State -->
        <div v-else-if="state === 'complete'" class="text-center">
            <div class="mb-3">
                <i class="fa-solid fa-check-circle fa-3x text-success"></i>
            </div>
            <h5>Transcoding Complete!</h5>
            <p class="mb-3">{{ fileName }} is ready</p>
            <div class="d-flex gap-2 justify-content-center">
                <button class="btn btn-primary" @click="showVideoPreview">
                    <i class="fa-solid fa-play me-1"></i>Preview Video
                </button>
                <button class="btn btn-success" @click="proceedWithUpload">
                    <i class="fa-solid fa-upload me-1"></i>Upload Now
                </button>
            </div>
        </div>

        <!-- Error State -->
        <div v-else-if="state === 'error'" class="text-center">
            <i class="fa-solid fa-exclamation-circle text-danger fa-3x mb-3"></i>
            <h5>Transcoding Error</h5>
            <p class="text-danger">{{ errorMessage }}</p>
            <button class="btn btn-secondary" @click="retry">Try Again</button>
        </div>
        
        <!-- Video Preview Modal -->
        <teleport to="body" v-if="showPreview">
            <div class="modal-overlay d-flex justify-content-center align-items-center"
                 @click.self="closeVideoPreview"
                 style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.9); z-index: 1056;">
                
                <div class="modal-content bg-dark text-white rounded shadow-lg p-4" 
                     style="max-width: 900px; width: 95%;">
                    
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h4 class="mb-0">
                            <i class="fa-solid fa-video me-2"></i>
                            Video Preview
                        </h4>
                        <button type="button" class="btn-close btn-close-white" @click="closeVideoPreview"></button>
                    </div>
                    
                    <!-- Quality Selector -->
                    <div class="mb-3" v-if="availableQualities.length > 1">
                        <label class="form-label">Quality:</label>
                        <select class="form-select form-select-sm d-inline-block w-auto ms-2" 
                                v-model="currentQuality" 
                                @change="switchQuality">
                            <option v-for="quality in availableQualities" 
                                    :key="quality" 
                                    :value="quality">
                                {{ quality }}
                            </option>
                        </select>
                        <small class="text-muted ms-2">
                            Available qualities: {{ availableQualities.join(', ') }}
                        </small>
                    </div>
                    
                    <!-- Video Player -->
                    <div class="video-container mb-3 position-relative" style="background: #000; border-radius: 8px; overflow: hidden;">
                        <video ref="videoPlayer" 
                               controls 
                               style="width: 100%; max-height: 500px;"
                               @loadedmetadata="onVideoLoaded"
                               @canplay="videoLoading = false">
                        </video>
                        <!-- Loading Overlay -->
                        <div v-if="videoLoading" 
                             class="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
                             style="background: rgba(0,0,0,0.5); z-index: 10;">
                            <div class="spinner-border text-white" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Action Buttons -->
                    <div class="d-flex gap-2 justify-content-end">
                        <button class="btn btn-secondary" @click="closeVideoPreview">
                            Close
                        </button>
                        <button class="btn btn-success" @click="proceedWithUpload">
                            <i class="fa-solid fa-upload me-1"></i>Upload Video
                        </button>
                    </div>
                </div>
            </div>
        </teleport>
        </template>
    </div>
    `,
    style: `
    <style scoped>
    .resolution-progress-container {
        max-height: 300px;
        overflow-y: auto;
        padding: 8px;
        background-color: rgba(0,0,0,0.02);
        border-radius: 6px;
    }
    
    .resolution-progress-item {
        padding: 8px;
        border-radius: 4px;
        background-color: white;
        border: 1px solid #e9ecef;
        transition: all 0.2s ease;
    }
    
    .resolution-progress-item:hover {
        background-color: #f8f9fa;
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .progress {
        transition: all 0.3s ease;
    }
    
    .progress-bar {
        transition: width 0.3s ease;
    }
    
    /* Specific styling for different status states */
    .resolution-progress-item[data-status="processing"] {
        border-left: 4px solid #007bff;
    }
    
    .resolution-progress-item[data-status="completed"] {
        border-left: 4px solid #28a745;
    }
    
    .resolution-progress-item[data-status="error"] {
        border-left: 4px solid #dc3545;
    }
    
    .resolution-progress-item[data-status="queued"] {
        border-left: 4px solid #6c757d;
    }
    </style>
    `,
    props: {
        file: {
            type: File,
            default: null
        },
        fileName: {
            type: String,
            default: ''
        },
        fileSize: {
            type: Number,
            default: 0
        },
        autoStart: {
            type: Boolean,
            default: false
        },
        headless: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            state: 'ready', // loading, ready, transcoding, complete, error
            loadProgress: 0,
            loadMessage: 'Initializing...',
            transcodeProgress: 0,
            transcodeMessage: 'Preparing...',
            uploadChoice: 'transcode',
            selectedQuality: 'auto',
            encodingSpeed: 'balanced',
            qualityMode: 'bitrate',
            errorMessage: '',
            outputFiles: {
                m3u8: null,
                segments: []
            },
            useProgressFallback: false,
            transcodeStartTime: null,
            unsubscribeProgress: null,
            showPreview: false,
            availableQualities: ['Auto'], // Default, will be updated from HLS manifest
            currentQuality: 'Auto',
            qualityLevels: [], // Store level data for quality switching
            blobUrls: {},
            hlsInstance: null,
            transcodedFiles: [],
            videoLoading: false,
            sessionId: null, // Unique ID for this transcoding session
            performanceInfo: null, // FFmpeg performance information
            resolutionProgress: new Map(), // Track individual resolution progress
            availableResolutionsForUI: [], // Resolutions being processed for UI display
            currentResolutionHeight: null, // Track which resolution is currently being processed
            showMultiProgress: false, // Whether to show multi-resolution progress UI
            isFFmpegBusy: false // Track if FFmpeg is currently processing
        }
    },
    computed: {
        getActionText() {
            if (this.uploadChoice === 'original') return 'Upload Original';
            if (this.uploadChoice === 'transcode') return 'Transcode & Upload';
            return 'Process & Upload Both';
        }
    },
    methods: {
        // Helper methods for multi-resolution progress tracking
        getOverallProgress() {
            if (this.availableResolutionsForUI.length === 0) return 0;
            
            let totalProgress = 0;
            for (const resolution of this.availableResolutionsForUI) {
                const progress = this.resolutionProgress.get(resolution.height);
                totalProgress += (progress?.progress || 0);
            }
            return Math.round(totalProgress / this.availableResolutionsForUI.length);
        },

        getCompletedResolutions() {
            return this.availableResolutionsForUI.filter(resolution => {
                const progress = this.resolutionProgress.get(resolution.height);
                return progress?.status === 'completed';
            }).length;
        },
        
        getCurrentResolutionIndex() {
            if (!this.currentResolutionHeight || this.availableResolutionsForUI.length === 0) {
                return 1;
            }
            
            const currentIndex = this.availableResolutionsForUI.findIndex(
                res => res.height === this.currentResolutionHeight
            );
            
            // Return 1-based index for display
            return currentIndex >= 0 ? currentIndex + 1 : 1;
        },

        getResolutionProgress(height) {
            const progress = this.resolutionProgress.get(height);
            return progress?.progress || 0;
        },

        getResolutionStatus(height) {
            const progress = this.resolutionProgress.get(height);
            return progress?.status || 'queued';
        },

        getResolutionStatusText(height) {
            const progress = this.resolutionProgress.get(height);
            if (!progress) return 'Queued';
            
            switch (progress.status) {
                case 'queued': return 'Queued';
                case 'initializing': return 'Initializing...';
                case 'processing': return `${progress.progress}%`;
                case 'completed': return 'Complete';
                case 'error': return 'Failed';
                default: return 'Unknown';
            }
        },

        getResolutionStatusIcon(height) {
            const progress = this.resolutionProgress.get(height);
            if (!progress) return 'fa-solid fa-clock text-muted';
            
            switch (progress.status) {
                case 'queued': return 'fa-solid fa-clock text-muted';
                case 'initializing': return 'fa-solid fa-cog fa-spin text-info';
                case 'processing': return 'fa-solid fa-gear fa-spin text-primary';
                case 'completed': return 'fa-solid fa-check text-success';
                case 'error': return 'fa-solid fa-times text-danger';
                default: return 'fa-solid fa-question text-muted';
            }
        },

        getProgressBarClass(height) {
            const progress = this.resolutionProgress.get(height);
            if (!progress) return 'bg-secondary';
            
            switch (progress.status) {
                case 'queued': return 'bg-secondary';
                case 'initializing': return 'bg-info';
                case 'processing': return 'bg-primary';
                case 'completed': return 'bg-success';
                case 'error': return 'bg-danger';
                default: return 'bg-secondary';
            }
        },

        initializeResolutionProgress(availableResolutions) {
            this.resolutionProgress.clear();
            this.availableResolutionsForUI = [...availableResolutions];
            
            for (const resolution of availableResolutions) {
                this.resolutionProgress.set(resolution.height, {
                    status: 'queued',
                    progress: 0,
                    message: 'Waiting to start...'
                });
            }
            
            debugLogger.debug('🎯 Initialized progress tracking for resolutions:', 
                availableResolutions.map(r => `${r.height}p`).join(', '));
        },

        updateResolutionProgress(height, status, progress = 0, message = '') {
            const current = this.resolutionProgress.get(height) || {};
            this.resolutionProgress.set(height, {
                ...current,
                status,
                progress: Math.round(progress),
                message,
                lastUpdate: Date.now()
            });
            
            debugLogger.debug(`📊 ${height}p: ${status} - ${progress}% - ${message}`);
            
            // Force Vue to re-render when Map changes
            this.$forceUpdate();
        },
        async initFFmpeg() {
            if (ffmpegManager.isLoaded()) {
                this.state = 'ready';
                return true;
            }
            
            this.state = 'loading';
            this.loadMessage = 'Loading FFmpeg...';
            
            try {
                // Simulate progress while loading
                this.loadProgress = 10;
                this.loadMessage = 'Loading FFmpeg library...';
                
                const progressInterval = setInterval(() => {
                    if (this.loadProgress < 90) {
                        this.loadProgress += 10;
                        this.loadMessage = `Loading FFmpeg... ${this.loadProgress}%`;
                    }
                }, 500);
                
                // Load FFmpeg using the manager (auto-detects best option)
                await ffmpegManager.load();
                
                clearInterval(progressInterval);
                this.loadProgress = 100;
                this.loadMessage = 'FFmpeg loaded successfully';
                
                // Get performance information
                this.performanceInfo = ffmpegManager.getPerformanceInfo();
                debugLogger.info('🚀 FFmpeg Performance Info:', this.performanceInfo);
                
                // Don't subscribe to progress here - we'll do it in startProcess when we have a session ID
                
                this.state = 'ready';
                return true;
                
            } catch (error) {
                debugLogger.error('Failed to load FFmpeg:', error);
                this.errorMessage = 'Failed to load video transcoder';
                this.state = 'error';
                // Set fallback flag on error
                this.useProgressFallback = true;
                return false;
            }
        },
        
        
        async startProcess() {
            if (this.uploadChoice === 'original') {
                // Skip transcoding, emit original file wrapped
                const wrappedFile = new ProcessedFile(this.file, {
                    isAuxiliary: false,
                    role: FileRoles.VIDEO,
                    processorId: 'video-transcoder'
                });
                
                this.$emit('complete', {
                    choice: 'original',
                    files: [wrappedFile]
                });
                return;
            }
            
            // Generate unique session ID for this transcoding operation
            this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            debugLogger.info(`🎬 Starting transcoding session: ${this.sessionId} for ${this.fileName}`);
            
            // Check if another session is active
            if (activeTranscodingSession && activeTranscodingSession !== this.sessionId) {
                debugLogger.warn(`⚠️ Another session ${activeTranscodingSession} is active, overriding with ${this.sessionId}`);
            }
            
            // Set this as the active transcoding session
            activeTranscodingSession = this.sessionId;
            debugLogger.info(`✅ Set active transcoding session to: ${this.sessionId}`);
            
            // Initialize FFmpeg if needed
            const loaded = await this.initFFmpeg();
            if (!loaded) return;
            
            // Subscribe to progress events now that we have a session ID
            debugLogger.info(`📡 Subscribing to progress events for session ${this.sessionId}`);
            this.unsubscribeProgress = ffmpegManager.onProgress(({ progress, time }) => {
                // Only process progress events if this is the active transcoding session
                const isActiveSession = this.sessionId === activeTranscodingSession;
                
                if (!isActiveSession) {
                    debugLogger.debug(`🚫 Progress event ignored for ${this.fileName} (session: ${this.sessionId}, active: ${activeTranscodingSession})`);
                    return;
                }
                
                if (this.state === 'transcoding' && this.sessionId && isActiveSession) {
                    const progressPercent = Math.round(progress * 100);
                    debugLogger.debug(`📊 Progress event for active session ${this.sessionId}: ${progressPercent}%`);
                    
                    // If we're showing multi-progress UI, update the current resolution
                    if (this.showMultiProgress && this.currentResolutionHeight) {
                        this.updateResolutionProgress(this.currentResolutionHeight, 'processing', progressPercent, `Processing... ${this.formatTime(time)}`);
                        // Update overall progress from all resolutions
                        this.transcodeProgress = this.getOverallProgress();
                    } else {
                        // Single progress bar mode
                        this.transcodeProgress = progressPercent;
                        // Preserve resolution info in the message if it exists
                        const resolutionMatch = this.transcodeMessage.match(/Transcoding (\d+p) \((\d+)\/(\d+)\)/);
                        if (resolutionMatch) {
                            // Keep resolution info, just update time
                            const [, resolution, current, total] = resolutionMatch;
                            this.transcodeMessage = `Transcoding ${resolution} (${current}/${total}) - ${this.formatTime(time)}`;
                        } else if (!this.transcodeMessage.includes('Transcoding')) {
                            // Only use generic message if no resolution info
                            this.transcodeMessage = `Processing... ${this.formatTime(time)}`;
                        }
                    }
                    
                    // Clear the fallback flag since real progress is working
                    this.useProgressFallback = false;
                    
                    // Emit progress event for external listeners
                    // Include resolution info when available
                    if (this.currentResolutionHeight && this.availableResolutionsForUI.length > 1) {
                        const currentIndex = this.getCurrentResolutionIndex();
                        const total = this.availableResolutionsForUI.length;
                        const progressData = {
                            progress: this.transcodeProgress,
                            message: `(${this.currentResolutionHeight}p - ${currentIndex}/${total})`
                        };
                        debugLogger.debug(`📤 Emitting progress with data:`, progressData);
                        this.$emit('progress', progressData);
                    } else {
                        debugLogger.debug(`📤 Emitting progress: ${this.transcodeProgress}%`);
                        this.$emit('progress', this.transcodeProgress);
                    }
                    
                    // Debug logging to help track progress routing
                    debugLogger.debug(`VideoTranscoder ${this.sessionId}: Progress ${this.transcodeProgress}% for ${this.fileName}`);
                }
            });
            
            // Start transcoding
            this.state = 'transcoding';
            this.transcodeProgress = 0;
            this.transcodeMessage = 'Preparing to transcode...';
            
            try {
                const result = await this.transcodeVideo();
                
                // Store transcoded files for preview
                this.transcodedFiles = result.files;
                
                // Create blob URLs for preview
                await this.createBlobUrls(result.files);
                
                this.state = 'complete';
                
                // Clear active session when complete
                if (activeTranscodingSession === this.sessionId) {
                    debugLogger.info(`🏁 Clearing active session ${this.sessionId} after successful completion`);
                    activeTranscodingSession = null;
                } else {
                    debugLogger.warn(`⚠️ Session ${this.sessionId} completed but active session is ${activeTranscodingSession}`);
                }
                
                // Auto-emit complete event in headless mode
                if (this.headless) {
                    this.$emit('complete', {
                        choice: this.uploadChoice,
                        files: this.transcodedFiles,
                        m3u8File: this.outputFiles.m3u8,
                        thumbnail: this.outputFiles.thumbnail
                    });
                }
                
            } catch (error) {
                debugLogger.error('Transcoding error:', error);
                
                // Enhanced error handling for different error types
                let errorMessage = 'Transcoding failed';
                if (error.message) {
                    if (error.message.includes('FS error')) {
                        errorMessage = 'File system error during transcoding. Please try again.';
                    } else if (error.message.includes('Cannot read properties')) {
                        errorMessage = 'File format not supported or corrupted.';
                    } else {
                        errorMessage = error.message;
                    }
                }
                
                this.errorMessage = errorMessage;
                this.state = 'error';
                
                // Clear active session if it's ours (only on actual error)
                if (activeTranscodingSession === this.sessionId) {
                    debugLogger.info(`❌ Clearing active session ${this.sessionId} after error`);
                    activeTranscodingSession = null;
                }
                
                this.$emit('error', error);
            } finally {
                // Always reset FFmpeg busy flag
                this.isFFmpegBusy = false;
                
                // Don't clear active session here - it's already handled in the success/error paths
                if (this.state === 'error' && activeTranscodingSession === this.sessionId) {
                    // Extra safety check - if we're still in error state and still active, clear it
                    debugLogger.info(`🧹 Finally block: Clearing lingering active session ${this.sessionId}`);
                    activeTranscodingSession = null;
                }
            }
        },
        
        
        async transcodeVideo() {
            // Check if FFmpeg is already busy
            if (this.isFFmpegBusy) {
                this.errorMessage = 'FFmpeg is already processing another video. Please wait.';
                this.state = 'error';
                return;
            }
            
            /**
             * CRITICAL: Two-Phase Upload System for HLS
             * 
             * This transcoding process MUST follow a specific order to ensure proper IPFS URL generation:
             * 
             * PHASE 1 - Transcoding & Hashing:
             * 1. Transcode video into HLS segments (.ts files) and playlists (.m3u8 files)
             * 2. Hash all segments to get their IPFS CIDs
             * 3. Rewrite resolution playlists to replace segment references with IPFS URLs
             * 4. Hash the rewritten playlists to get their CIDs
             * 5. Create master playlist with IPFS URLs pointing to resolution playlists
             * 
             * PHASE 2 - Upload (handled by upload system):
             * 1. Upload segments first (they already have CIDs)
             * 2. Upload resolution playlists (they reference segments by IPFS URL)
             * 3. Upload master playlist (it references playlists by IPFS URL)
             * 
             * WHY THIS ORDER MATTERS:
             * - Segments must be hashed BEFORE playlists are rewritten
             * - Playlists must be rewritten with IPFS URLs BEFORE being hashed
             * - Master playlist needs resolution playlist CIDs to create proper references
             * - All M3U8 files must contain full IPFS URLs, not relative paths
             * 
             * PREVIEW HANDLING:
             * - Original files maintain IPFS URLs for upload
             * - Separate blob URLs are created for preview playback
             * - Preview files are temporary and never uploaded
             */
            
            if (!window.FFmpegUtil) {
                throw new Error('FFmpegUtil not loaded');
            }
            const { fetchFile } = window.FFmpegUtil;
            
            // Set FFmpeg as busy
            this.isFFmpegBusy = true;
            
            try {
                this.transcodeMessage = 'Reading video file...';
                const inputData = await fetchFile(this.file);
                const inputName = `${this.sessionId}_input.${this.getFileExtension(this.fileName)}`;
                
                // Write input file with session-specific name
                await ffmpegManager.writeFile(inputName, inputData);
            
            // Determine video dimensions and available resolutions
            const availableResolutions = await this.determineAvailableResolutions(inputName);
            debugLogger.info(`🎬 Will transcode to ${availableResolutions.length} resolutions:`, availableResolutions);
            
            // Generate thumbnail with session-specific name
            const thumbnailName = `${this.sessionId}_thumbnail.jpg`;
            this.transcodeMessage = 'Generating thumbnail...';
            await ffmpegManager.exec([
                '-i', inputName,
                '-vf', 'thumbnail',
                '-frames:v', '1',
                thumbnailName
            ]);
            
            const thumbnailData = await ffmpegManager.readFile(thumbnailName);
            // Use proper naming convention for m3u8 thumbnail lookup
            const baseName = this.fileName.replace(/\.[^/.]+$/, ''); // Remove extension
            const now = Date.now();
            this.outputFiles.thumbnail = new File([thumbnailData], `_${baseName}_poster.jpg`, { 
                type: 'image/jpeg',
                lastModified: now
            });
            
            debugLogger.info('📹 Starting multi-resolution transcoding...');
            
            // Initialize resolution progress tracking
            this.initializeResolutionProgress(availableResolutions);
            
            // Enable multi-resolution UI if we have multiple resolutions
            this.showMultiProgress = availableResolutions.length > 1;
            debugLogger.info(`🎯 Multi-resolution UI ${this.showMultiProgress ? 'enabled' : 'disabled'} for ${availableResolutions.length} resolution(s)`);
            
            // Always use sequential processing, with auto-detected threading mode
            const threadingMode = this.performanceInfo?.isMultiThreaded ? 'multi-threaded' : 'single-threaded';
            debugLogger.info(`🔧 Using sequential processing with ${threadingMode} encoding`);
            
            const result = await this.transcodeSequential(inputName, availableResolutions);
            const extractedFiles = result.extractedFiles;
            const successfulResolutions = result.successfulResolutions;
            
            
            if (successfulResolutions.length === 0) {
                throw new Error('All resolution transcoding failed');
            }
            
            debugLogger.info(`🎉 Successfully transcoded ${successfulResolutions.length} resolutions:`, successfulResolutions);
            
            // Process all extracted files from multiple resolutions
            this.transcodeMessage = 'Creating files from transcoded data...';
            const files = [];
            
            // Process all resolution playlists and segments
            const extractedFilenames = Array.from(extractedFiles.keys());
            const m3u8Files = extractedFilenames.filter(name => name.endsWith('.m3u8'));
            const tsFiles = extractedFilenames.filter(name => name.endsWith('.ts'));
            
            debugLogger.debug(`📁 Processing ${m3u8Files.length} playlists and ${tsFiles.length} segments from extracted data`);
            
            // PHASE 1 STEP 2: Hash all segments to get their IPFS CIDs
            // This MUST happen before playlists are processed
            const segmentMapping = new Map();
            
            // Create File objects for all segments and hash them
            for (const segmentName of tsFiles) {
                const segmentData = extractedFiles.get(segmentName);
                
                // Hash the segment to get its CID - REQUIRED for playlist rewriting
                try {
                    const buf = buffer.Buffer(segmentData);
                    const hashResult = await Hash.of(buf, { unixfs: 'UnixFS' });
                    segmentMapping.set(segmentName, hashResult);
                    debugLogger.debug(`✅ Hashed segment ${segmentName}: ${hashResult}`);
                } catch (error) {
                    debugLogger.error(`Failed to hash segment ${segmentName}:`, error);
                    throw new Error(`Failed to hash video segment: ${error.message}`);
                }
                
                const segmentFile = new File([segmentData], segmentName, {
                    type: 'video/mp2t',
                    lastModified: now
                });
                
                debugLogger.debug(`✅ Created segment file: ${segmentName} (${segmentData.length} bytes)`);
                files.push(segmentFile);
                this.outputFiles.segments.push(segmentFile);
            }
            
            // PHASE 1 STEP 3 & 4: Process resolution playlists
            const resolutionPlaylists = [];
            const playlistMapping = new Map(); // Track playlist name -> CID
            
            for (const playlistName of m3u8Files) {
                const playlistData = extractedFiles.get(playlistName);
                let playlistContent = new TextDecoder().decode(playlistData);
                
                debugLogger.debug(`📋 Original playlist ${playlistName} content preview:`, playlistContent.substring(0, 200));
                
                // PHASE 1 STEP 3: Rewrite playlists with IPFS URLs
                // This MUST happen after segments are hashed but before playlists are hashed
                segmentMapping.forEach((segmentHash, originalName) => {
                    const segmentPattern = new RegExp(originalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                    playlistContent = playlistContent.replace(
                        segmentPattern, 
                        `https://ipfs.dlux.io/ipfs/${segmentHash}?filename=${originalName}`
                    );
                });
                
                debugLogger.debug(`📋 Updated playlist ${playlistName} with IPFS URLs:`, playlistContent.substring(0, 200));
                
                // Create file with updated content
                const updatedPlaylistData = new TextEncoder().encode(playlistContent);
                
                // PHASE 1 STEP 4: Hash the rewritten playlist
                // This gives us the CID needed for the master playlist
                try {
                    const buf = buffer.Buffer(updatedPlaylistData);
                    const playlistHash = await Hash.of(buf, { unixfs: 'UnixFS' });
                    debugLogger.debug(`✅ Hashed playlist ${playlistName}: ${playlistHash}`);
                    
                    const playlistFile = new File([updatedPlaylistData], playlistName, {
                        type: 'application/x-mpegURL',
                        lastModified: now
                    });
                    
                    debugLogger.debug(`✅ Created playlist file: ${playlistName} (${updatedPlaylistData.length} bytes)`);
                    files.push(playlistFile);
                    
                    // Store for master playlist creation
                    const resolution = playlistName.match(/(\d+)p_index\.m3u8/)?.[1];
                    if (resolution) {
                        resolutionPlaylists.push({
                            resolution: resolution,
                            fileName: playlistName,
                            content: playlistContent,
                            file: playlistFile,
                            cid: playlistHash // Store the actual hash for master playlist
                        });
                    }
                } catch (error) {
                    debugLogger.error(`Failed to hash playlist ${playlistName}:`, error);
                    throw new Error(`Failed to hash playlist: ${error.message}`);
                }
            }
            
            // PHASE 1 STEP 5: Create master playlist with IPFS URLs
            // This MUST happen after resolution playlists are hashed
            this.transcodeMessage = 'Creating master playlist...';
            const masterPlaylistContent = this.createMasterPlaylist(resolutionPlaylists, baseName);
            
            // Hash the master playlist (it doesn't need rewriting as it's created with IPFS URLs)
            try {
                const masterData = new TextEncoder().encode(masterPlaylistContent);
                const buf = buffer.Buffer(masterData);
                const masterHash = await Hash.of(buf, { unixfs: 'UnixFS' });
                
                const masterPlaylistFile = new File(
                    [masterData], 
                    `${baseName}.m3u8`, 
                    { 
                        type: 'application/x-mpegURL',
                        lastModified: now
                    }
                );
                
                // Assign the CID to the master playlist
                masterPlaylistFile.cid = masterHash;
                
                debugLogger.debug(`✅ Created master playlist: ${baseName}.m3u8`);
                files.push(masterPlaylistFile);
                
                // Store master playlist reference
                this.outputFiles.masterM3u8 = masterPlaylistFile;
                this.outputFiles.resolutionPlaylists = resolutionPlaylists;
            } catch (error) {
                debugLogger.error(`Failed to hash master playlist:`, error);
                throw new Error(`Failed to hash master playlist: ${error.message}`);
            }
            
            debugLogger.info(`🎬 Total files created: ${files.length} (1 master playlist + ${resolutionPlaylists.length} resolution playlists + ${this.outputFiles.segments.length} segments)`);
            
            // Add thumbnail to files array for upload
            if (this.outputFiles.thumbnail) {
                files.push(this.outputFiles.thumbnail);
            }
            
            // Clean up only session-specific files
            await this.cleanupSessionFiles();
            
            // Wrap files with metadata
            const wrappedFiles = [];
            
            // Master playlist file (main file)
            wrappedFiles.push(new ProcessedFile(this.outputFiles.masterM3u8, {
                isAuxiliary: false,
                role: FileRoles.PLAYLIST,
                processorId: 'video-transcoder'
            }));
            
            // Resolution playlists (auxiliary)
            this.outputFiles.resolutionPlaylists.forEach(playlist => {
                wrappedFiles.push(new ProcessedFile(playlist.file, {
                    isAuxiliary: true,
                    role: FileRoles.PLAYLIST,
                    parentFile: this.outputFiles.masterM3u8.name,
                    processorId: 'video-transcoder'
                }));
            });
            
            // Poster/thumbnail file
            if (this.outputFiles.thumbnail) {
                wrappedFiles.push(new ProcessedFile(this.outputFiles.thumbnail, {
                    isAuxiliary: true,
                    role: FileRoles.POSTER,
                    parentFile: this.outputFiles.masterM3u8.name,
                    processorId: 'video-transcoder'
                }));
            }
            
            // Segment files (all auxiliary)
            debugLogger.debug(`🎭 Wrapping ${this.outputFiles.segments.length} segment files for upload`);
            this.outputFiles.segments.forEach((segmentFile, index) => {
                debugLogger.debug(`🎭 Wrapping segment ${index + 1}: ${segmentFile.name} (${segmentFile.size} bytes)`);
                wrappedFiles.push(new ProcessedFile(segmentFile, {
                    isAuxiliary: true,
                    role: FileRoles.SEGMENT,
                    parentFile: this.outputFiles.masterM3u8.name,
                    processorId: 'video-transcoder'
                }));
            });
            
            debugLogger.info(`📋 Final wrapped files count: ${wrappedFiles.length} (should include: 1 master playlist + ${this.outputFiles.resolutionPlaylists.length} resolution playlists + ${this.outputFiles.segments.length} segments + ${this.outputFiles.thumbnail ? '1 thumbnail' : '0 thumbnails'})`);
            
            return {
                files: wrappedFiles,
                m3u8File: this.outputFiles.masterM3u8
            };
            } catch (error) {
                // Re-throw the error to be handled by processVideo
                throw error;
            } finally {
                // Reset busy flag is handled in processVideo
            }
        },
        
        async determineQuality(inputFile) {
            if (this.selectedQuality !== 'auto') {
                return this.selectedQuality;
            }
            
            // Get video info
            try {
                await ffmpegManager.exec([
                    '-i', inputFile,
                    '-f', 'null',
                    '-'
                ]);
            } catch (e) {
                // FFmpeg throws error on probe, but we can parse the output
                const output = e.message || '';
                
                // Parse resolution from output
                const resMatch = output.match(/(\d+)x(\d+)/);
                if (resMatch) {
                    const height = parseInt(resMatch[2]);
                    if (height >= 1080) return '1080p';
                    if (height >= 720) return '720p';
                    return '480p';
                }
            }
            
            return '720p'; // Default
        },
        
        getResolutionSettings(quality) {
            const settings = {
                '1080p': { width: 1920, height: 1080 },
                '720p': { width: 1280, height: 720 },
                '480p': { width: 854, height: 480 }
            };
            return settings[quality] || settings['720p'];
        },
        
        getFileExtension(filename) {
            return filename.split('.').pop().toLowerCase();
        },
        
        formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        },
        
        formatTime(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        },
        
        skipTranscoding() {
            this.$emit('skip');
            this.state = 'ready';
        },
        
        cancel() {
            this.$emit('cancel');
        },
        
        retry() {
            this.state = 'ready';
            this.errorMessage = '';
        },
        
        cleanup() {
            // Clean up transcoded files and reset state
            debugLogger.info(`🧹 Cleaning up video transcoder state for session: ${this.sessionId}`);
            
            // Unsubscribe from progress events first
            if (this.unsubscribeProgress) {
                this.unsubscribeProgress();
                this.unsubscribeProgress = null;
            }
            
            // Clear transcoded files
            this.transcodedFiles = [];
            this.outputFiles = {
                m3u8: null,
                segments: [],
                masterM3u8: null,
                resolutionPlaylists: [],
                thumbnail: null
            };
            
            // Clear blob URLs
            Object.values(this.blobUrls).forEach(url => {
                URL.revokeObjectURL(url);
            });
            this.blobUrls = {};
            
            // Reset state
            this.state = 'ready';
            this.transcodeProgress = 0;
            this.transcodeMessage = 'Preparing...';
            this.errorMessage = '';
            this.showPreview = false;
            this.videoLoading = false;
            
            // Clear active session if it's ours
            if (activeTranscodingSession === this.sessionId) {
                debugLogger.info(`🧹 Clearing active session ${this.sessionId} during cleanup`);
                activeTranscodingSession = null;
            }
            
            // Clear session ID last
            this.sessionId = null;
            
            // Clean up HLS player if exists
            this.cleanupPlayer();
        },
        
        async createBlobUrls(files) {
            /**
             * PREVIEW SYSTEM: Create blob URLs for local playback
             * 
             * IMPORTANT: This method creates blob URLs for preview only.
             * - Original files contain IPFS URLs and are ready for upload
             * - We create temporary blob URLs to enable local playback
             * - Resolution playlists already contain IPFS URLs from the rewriting step
             * - We need to replace those IPFS URLs with blob URLs for preview
             * 
             * The original files are NEVER modified - they maintain their IPFS URLs for upload
             */
            
            debugLogger.info('⚠️ IMPORTANT: Creating blob URLs for preview only - original files remain unchanged');
            debugLogger.debug(`🔗 Creating blob URLs for ${files.length} files`);
            
            // Sort files: segments first, then resolution playlists, then master playlist
            const segments = [];
            const resolutionPlaylists = [];
            let masterPlaylist = null;
            
            for (const wrappedFile of files) {
                // Extract the actual File object from ProcessedFile wrapper
                const file = wrappedFile.getFile ? wrappedFile.getFile() : wrappedFile;
                    
                if (file.name.endsWith('.ts')) {
                    segments.push(file);
                } else if (file.name.match(/\d+p_index\.m3u8$/)) {
                    resolutionPlaylists.push(file);
                } else if (file.name.endsWith('.m3u8')) {
                    masterPlaylist = file;
                }
            }
            
            // Step 1: Create blob URLs for all segments
            for (const segment of segments) {
                const url = URL.createObjectURL(segment);
                this.blobUrls[segment.name] = url;
                debugLogger.debug(`Created blob URL for segment: ${segment.name}`);
            }
            
            // Step 2: Process resolution playlists (they reference segments)
            for (const playlist of resolutionPlaylists) {
                try {
                    // Create a modified version for preview ONLY - don't modify the original
                    const updatedBlob = await this.updateM3u8WithBlobUrls(playlist);
                    const updatedUrl = URL.createObjectURL(updatedBlob);
                    this.blobUrls[playlist.name] = updatedUrl;
                    debugLogger.debug(`Created preview blob URL for resolution playlist: ${playlist.name}`);
                    debugLogger.debug(`✅ Original file ${playlist.name} remains unchanged with local references`);
                } catch (error) {
                    debugLogger.error(`Error processing resolution playlist ${playlist.name}:`, error);
                }
            }
            
            // Step 3: Process master playlist (it references resolution playlists)
            if (masterPlaylist) {
                try {
                    // Create a modified version for preview ONLY - don't modify the original
                    const updatedBlob = await this.updateM3u8WithBlobUrls(masterPlaylist);
                    const updatedUrl = URL.createObjectURL(updatedBlob);
                    this.blobUrls[masterPlaylist.name] = updatedUrl;
                    debugLogger.debug(`Created preview blob URL for master playlist: ${masterPlaylist.name}`);
                    debugLogger.debug(`✅ Original file ${masterPlaylist.name} remains unchanged with local references`);
                } catch (error) {
                    debugLogger.error(`Error processing master playlist ${masterPlaylist.name}:`, error);
                }
            }
            
            // Build quality mapping from available resolution playlists
            const qualityMapping = resolutionPlaylists.map(file => {
                const resMatch = file.name.match(/(\d+)p_index\.m3u8/);
                return resMatch ? resMatch[1] + 'p' : null;
            }).filter(Boolean);
            
            // Set available qualities (sorted highest first)
            this.availableQualities = qualityMapping.sort((a, b) => {
                return parseInt(b.replace('p', '')) - parseInt(a.replace('p', ''));
            });
            
            // Always include Auto as first option
            if (!this.availableQualities.includes('Auto')) {
                this.availableQualities.unshift('Auto');
            }
            
            // Set current quality to Auto (which will select highest available)
            this.currentQuality = 'Auto';
            
            debugLogger.debug(`🎚️ Available qualities: ${this.availableQualities.join(', ')}, current: ${this.currentQuality}`);
        },
        
        showVideoPreview() {
            this.showPreview = true;
            this.$nextTick(() => {
                this.initializeHlsPlayer();
            });
        },
        
        closeVideoPreview() {
            this.showPreview = false;
            this.cleanupPlayer();
        },
        
        proceedWithUpload() {
            this.closeVideoPreview();
            
            // Emit results based on choice
            const files = [];
            
            // If 'both', include the original file wrapped
            if (this.uploadChoice === 'both') {
                files.push(new ProcessedFile(this.file, {
                    isAuxiliary: false,
                    role: FileRoles.VIDEO,
                    processorId: 'video-transcoder'
                }));
            }
            
            // Add all transcoded files (already wrapped)
            files.push(...this.transcodedFiles);
            
            this.$emit('complete', {
                choice: this.uploadChoice,
                files: files,
                m3u8File: this.outputFiles.masterM3u8 || this.outputFiles.m3u8,
                thumbnail: this.outputFiles.thumbnail,
                blobUrls: this.blobUrls  // Pass blob URLs for preview
            });
        },
        
        initializeHlsPlayer() {
            const video = this.$refs.videoPlayer;
            if (!video) return;
            
            // Set loading state
            this.videoLoading = true;
            
            // Find the master m3u8 file (not resolution-specific)
            const m3u8Wrapper = this.transcodedFiles.find(f => {
                const fileName = f.name || (f.getFile && f.getFile().name);
                return fileName && fileName.endsWith('.m3u8') && !fileName.match(/\d+p_index\.m3u8$/);
            });
            
            if (!m3u8Wrapper) {
                debugLogger.error('❌ No master m3u8 file found for preview');
                debugLogger.debug('Available files:', this.transcodedFiles.map(f => f.name || (f.getFile && f.getFile().name)));
                this.videoLoading = false;
                return;
            }
            
            const m3u8FileName = m3u8Wrapper.name || m3u8Wrapper.getFile().name;
            const m3u8Url = this.blobUrls[m3u8FileName];
            
            debugLogger.debug(`🎬 Using master playlist: ${m3u8FileName}, blob URL: ${m3u8Url ? 'available' : 'missing'}`);
            
            // Check if HLS.js is supported
            if (typeof Hls !== 'undefined' && Hls.isSupported()) {
                // Create custom loader for blob URLs
                const BlobLoader = this.createBlobLoader();
                
                this.hlsInstance = new Hls({
                    debug: false,
                    enableWorker: true,
                    loader: BlobLoader,
                    startPosition: 0.1,    // Skip first 0.1s to avoid buffer hole
                    backBufferLength: 0,   // Don't retain old buffer
                    maxBufferHole: 0.5     // Tolerate small gaps
                });
                
                this.hlsInstance.loadSource(m3u8Url);
                this.hlsInstance.attachMedia(video);
                
                this.hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
                    debugLogger.debug('Video manifest loaded and parsed');
                    
                    // Populate quality options from HLS levels
                    const qualities = this.hlsInstance.levels.map((level, index) => ({
                        index: index,
                        height: level.height,
                        bitrate: level.bitrate,
                        label: `${level.height}p`
                    }));
                    
                    // Add auto option at the beginning
                    this.availableQualities = ['Auto', ...qualities.map(q => q.label)];
                    this.currentQuality = 'Auto'; // Start with auto
                    
                    // Store level data for switching
                    this.qualityLevels = [
                        { index: -1, label: 'Auto' },
                        ...qualities
                    ];
                    
                    // Video is ready to play, hide loading spinner
                    this.videoLoading = false;
                    // Autoplay the video
                    video.play().catch(e => {
                        debugLogger.debug('Autoplay prevented:', e);
                    });
                });
                
                // Listen for quality changes
                this.hlsInstance.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
                    debugLogger.debug('Quality level switched to:', data.level);
                });
                
                this.hlsInstance.on(Hls.Events.ERROR, (event, data) => {
                    if (data.fatal) {
                        debugLogger.error('Fatal HLS error:', data);
                        this.errorMessage = 'Video playback error. Please try again.';
                    } else if (data.details !== 'bufferSeekOverHole' && data.details !== 'bufferNudgeOnHole') {
                        // Log other non-fatal errors except common buffer holes
                        debugLogger.debug('HLS warning:', data.details);
                    }
                    // Silently ignore bufferSeekOverHole as it's harmless
                });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                // Native HLS support (Safari)
                video.src = m3u8Url;
                video.load();
                // Autoplay when ready
                video.addEventListener('canplay', () => {
                    video.play().catch(e => {
                        debugLogger.debug('Autoplay prevented:', e);
                    });
                }, { once: true });
            } else {
                debugLogger.error('HLS not supported in this browser');
                this.errorMessage = 'Video preview not supported in this browser';
                this.videoLoading = false;
            }
        },
        
        createBlobLoader() {
            // Since all URLs in the m3u8 are already blob URLs,
            // we can use a simpler loader that just passes through
            class BlobLoader extends Hls.DefaultConfig.loader {
                load(context, config, callbacks) {
                    // All URLs should be blob URLs at this point
                    if (context.url.startsWith('blob:')) {
                        super.load(context, config, callbacks);
                    } else {
                        debugLogger.error('Unexpected non-blob URL in playlist:', context.url);
                        callbacks.onError({ code: 404, text: 'Invalid URL in playlist' }, context);
                    }
                }
            }
            
            return BlobLoader;
        },
        
        switchQuality() {
            debugLogger.debug('Switching to quality:', this.currentQuality);
            
            if (!this.hlsInstance || !this.qualityLevels) {
                return;
            }
            
            // Find the selected quality level
            const selectedLevel = this.qualityLevels.find(q => q.label === this.currentQuality);
            if (selectedLevel !== undefined) {
                // Set the quality level (-1 for auto, 0+ for specific levels)
                this.hlsInstance.currentLevel = selectedLevel.index;
                
                if (selectedLevel.index === -1) {
                    debugLogger.debug('Switched to automatic quality selection');
                } else {
                    debugLogger.debug(`Switched to ${selectedLevel.label} (${selectedLevel.bitrate} bps)`);
                }
            }
        },
        
        onVideoLoaded() {
            debugLogger.debug('Video metadata loaded');
        },
        
        cleanupPlayer() {
            if (this.hlsInstance) {
                this.hlsInstance.destroy();
                this.hlsInstance = null;
            }
            
            const video = this.$refs.videoPlayer;
            if (video) {
                video.pause();
                video.src = '';
                video.load();
            }
        },
        
        readFileAsText(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsText(file);
            });
        },
        
        async updateM3u8WithBlobUrls(m3u8File) {
            // Read the m3u8 content
            const content = await this.readFileAsText(m3u8File);
            
            // Determine if this is a master playlist or resolution playlist
            const isMasterPlaylist = !m3u8File.name.match(/\d+p_index\.m3u8$/);
            
            // Replace references with blob URLs
            const lines = content.split('\n');
            const updatedLines = lines.map(line => {
                if (!line.trim() || line.startsWith('#')) {
                    return line;
                }
                
                // This is a reference to either a playlist or segment
                const referenceLine = line.trim();
                
                // Extract filename from IPFS URL if present
                let filename = referenceLine;
                if (referenceLine.startsWith('https://ipfs.dlux.io/ipfs/')) {
                    // Extract filename from IPFS URL like: https://ipfs.dlux.io/ipfs/QmHash?filename=720p_000.ts
                    const filenameMatch = referenceLine.match(/filename=([^&]+)/);
                    if (filenameMatch) {
                        filename = filenameMatch[1];
                    }
                }
                
                // Master playlists reference other playlists (.m3u8)
                // Resolution playlists reference segments (.ts)
                if (isMasterPlaylist) {
                    // For master playlist, look for resolution playlist blob URLs
                    if (filename.endsWith('.m3u8')) {
                        const blobUrl = this.blobUrls[filename];
                        if (blobUrl) {
                            return blobUrl;
                        }
                    }
                } else {
                    // For resolution playlists, look for segment blob URLs
                    if (filename.endsWith('.ts')) {
                        const blobUrl = this.blobUrls[filename];
                        if (blobUrl) {
                            return blobUrl;
                        }
                        debugLogger.debug('No blob URL found for segment:', filename);
                    }
                }
                
                // Keep original line if no blob URL found
                return referenceLine;
            });
            
            const updatedContent = updatedLines.join('\n');
            
            // Create a new blob for the updated m3u8
            const blob = new Blob([updatedContent], { type: 'application/x-mpegURL' });
            return blob;
        },
        
        async cleanupSessionFiles() {
            if (!this.sessionId) return;
            
            try {
                const fileList = await ffmpegManager.listDir('/');
                for (const file of fileList) {
                    if (file.name && file.name.startsWith(this.sessionId)) {
                        try {
                            await ffmpegManager.deleteFile(file.name);
                        } catch (e) {
                            debugLogger.debug(`Could not delete session file ${file.name}:`, e);
                        }
                    }
                }
            } catch (error) {
                debugLogger.debug('Error during session cleanup:', error);
            }
        },

        // Determine available resolutions based on input video dimensions
        async determineAvailableResolutions(inputFileName) {
            // Predefined resolution settings (matching old system)
            const allResolutions = [
                { height: 480, width: 854, bitrate: 800 },   // 480p
                { height: 720, width: 1280, bitrate: 2500 },  // 720p 
                { height: 1080, width: 1920, bitrate: 5000 }  // 1080p
            ];
            
            // Get video dimensions from FFmpeg probe
            let sourceHeight = 1080; // Default assumption
            let sourceWidth = 1920;
            
            try {
                await ffmpegManager.exec(['-i', inputFileName, '-f', 'null', '-']);
            } catch (probeError) {
                // FFmpeg reports video info as "error" - parse from message
                const output = probeError.message || '';
                
                // Look for resolution pattern like "1920x1080" or "Video: ... 1280x720"
                const resolutionMatch = output.match(/(\d{3,4})x(\d{3,4})/);
                if (resolutionMatch) {
                    sourceWidth = parseInt(resolutionMatch[1]);
                    sourceHeight = parseInt(resolutionMatch[2]);
                    debugLogger.debug(`📐 Detected source resolution: ${sourceWidth}x${sourceHeight}`);
                } else {
                    debugLogger.debug('📐 Could not detect source resolution, using defaults');
                }
            }
            
            // Filter resolutions to only include those smaller than or equal to source
            const availableResolutions = allResolutions.filter(res => {
                // Only include if target resolution is smaller than or equal to source
                return res.height <= sourceHeight;
            });
            
            // Always include at least 480p as minimum
            if (availableResolutions.length === 0) {
                availableResolutions.push(allResolutions[0]); // 480p
            }
            
            debugLogger.debug(`🎬 Selected ${availableResolutions.length} resolution(s) for transcoding:`, 
                availableResolutions.map(r => `${r.height}p`).join(', '));
            
            return availableResolutions;
        },

        /**
         * Create master playlist that references all resolution playlists
         * IMPORTANT: This method assumes resolution playlists have already been hashed
         * and have their CIDs available. It creates IPFS URLs for each resolution.
         */
        createMasterPlaylist(resolutionPlaylists, baseName) {
            // Sort playlists by resolution (highest first)
            const sortedPlaylists = resolutionPlaylists.sort((a, b) => {
                return parseInt(b.resolution) - parseInt(a.resolution);
            });
            
            // Build master playlist content (HLS format)
            let masterContent = '#EXTM3U\n#EXT-X-VERSION:3\n\n';
            
            // Add each resolution variant
            sortedPlaylists.forEach(playlist => {
                const resolution = parseInt(playlist.resolution);
                let bandwidth;
                
                // Match bitrates to old system
                switch (resolution) {
                    case 480:
                        bandwidth = 800000;  // 800k
                        break;
                    case 720:
                        bandwidth = 2500000; // 2.5M
                        break;
                    case 1080:
                        bandwidth = 5000000; // 5M
                        break;
                    default:
                        bandwidth = 1500000; // Default 1.5M
                }
                
                // Add stream info line
                masterContent += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${this.getResolutionDimensions(resolution)}\n`;
                // Add IPFS URL for playlist (using CID if available, otherwise filename)
                if (playlist.cid) {
                    masterContent += `https://ipfs.dlux.io/ipfs/${playlist.cid}?filename=${playlist.fileName}\n`;
                } else {
                    // Fallback to filename if no CID (shouldn't happen)
                    masterContent += `${playlist.fileName}\n`;
                }
            });
            
            debugLogger.debug(`📋 Generated master playlist with ${sortedPlaylists.length} resolution variants`);
            debugLogger.debug('Master playlist content:\n', masterContent);
            
            return masterContent;
        },

        // Get resolution dimensions string for master playlist
        getResolutionDimensions(height) {
            const dimensions = {
                480: '854x480',
                720: '1280x720', 
                1080: '1920x1080'
            };
            return dimensions[height] || '1280x720';
        },
        
        checkAndStartIfReady() {
            this.$nextTick(() => {
                // Check parent's processing status
                const parentProcessingFile = this.$parent?.processingFiles?.find(f => 
                    f.file === this.file
                );
                
                debugLogger.info(`📋 Parent processing file status: ${parentProcessingFile?.status || 'not found'} for ${this.fileName}`);
                
                // Only auto-start if status is 'transcoding', not 'queued'
                if (!parentProcessingFile || parentProcessingFile.status === 'transcoding') {
                    debugLogger.info(`✅ Auto-starting transcoder for ${this.fileName}`);
                    this.initFFmpeg().then(() => {
                        if (this.state === 'ready') {
                            // Auto-start the transcoding process
                            this.uploadChoice = 'transcode'; // Default choice for auto-start
                            this.startProcess();
                        }
                    });
                } else {
                    debugLogger.info(`⏸️ VideoTranscoder: Not auto-starting ${this.fileName} because status is ${parentProcessingFile.status}`);
                }
            });
        },

        // Build optimized FFmpeg command with performance presets
        buildOptimizedFFmpegCommand(inputName, resWidth, resHeight, bitrate, sessionId) {
            const commands = ['-i', inputName, '-c:v', 'libx264'];
            
            // Add encoding speed preset for performance optimization
            switch (this.encodingSpeed) {
                case 'fast':
                    commands.push('-preset', 'veryfast');
                    break;
                case 'ultrafast':
                    commands.push('-preset', 'ultrafast');
                    break;
                default: // balanced
                    commands.push('-preset', 'fast');
            }
            
            // Quality mode settings
            if (this.qualityMode === 'crf') {
                // Constant Rate Factor mode for better quality consistency
                const crfValue = this.getCRFForResolution(resHeight);
                commands.push('-crf', crfValue.toString());
                // Still set maxrate to prevent extremely large segments
                commands.push('-maxrate', `${Math.round(bitrate * 1.2)}k`);
                commands.push('-bufsize', `${Math.round(bitrate * 1.5)}k`);
            } else {
                // Traditional bitrate targeting
                commands.push('-b:v', `${Math.round(bitrate)}k`);
                commands.push('-maxrate', `${Math.round(bitrate * 1.5)}k`);
                commands.push('-bufsize', `${Math.round(bitrate * 2)}k`);
            }
            
            // Video filter and codec settings
            commands.push(
                '-vf', `scale=${resWidth}:${resHeight}`,
                '-c:a', 'aac',
                '-b:a', '128k',
                '-profile:v', 'main'
            );
            
            // Performance optimizations for WASM
            if (this.encodingSpeed === 'ultrafast') {
                // Reduce complexity for maximum speed
                commands.push(
                    '-x264-params', 'nal-hrd=cbr:force-cfr=1',
                    '-max_muxing_queue_size', '2048'
                );
            } else {
                commands.push('-max_muxing_queue_size', '1024');
            }
            
            // Multithreading optimization based on system capabilities
            if (this.performanceInfo && this.performanceInfo.isMultiThreaded) {
                // Enable multithreading when system supports it
                commands.push('-threads', '0'); // Auto-detect thread count
                debugLogger.debug('🚀 Using multithreaded encoding (system supported)');
            } else {
                // Single-threaded optimization for systems without MT support
                commands.push('-threads', '1');
                debugLogger.debug('🔧 Using single-threaded encoding (system not supported)');
            }
            
            // HLS segmentation settings
            commands.push(
                '-f', 'segment',
                '-segment_time', '5',
                '-segment_format', 'mpegts',
                '-segment_list_type', 'm3u8',
                '-segment_list', `${sessionId}_${resHeight}p_index.m3u8`,
                '-hls_time', '3',
                '-hls_list_size', '0',
                '-force_key_frames', 'expr:gte(t,n_forced*3)',
                `${sessionId}_${resHeight}p_%03d.ts`
            );
            
            debugLogger.debug(`🎬 Optimized FFmpeg command for ${resHeight}p:`, commands.join(' '));
            return commands;
        },

        // Get appropriate CRF value based on resolution
        getCRFForResolution(height) {
            // Lower CRF = higher quality, higher file size
            // Optimized for web streaming balance
            switch (height) {
                case 480:
                    return 28; // Slightly higher compression for mobile
                case 720:
                    return 25; // Balanced quality
                case 1080:
                    return 23; // Higher quality for HD
                default:
                    return 25;
            }
        },

        // Sequential transcoding (original approach)
        async transcodeSequential(inputName, availableResolutions) {
            const extractedFiles = new Map();
            const successfulResolutions = [];
            
            // Start fallback progress tracking if needed
            let progressInterval = null;
            if (this.useProgressFallback) {
                this.transcodeStartTime = Date.now();
                let simulatedProgress = 0;
                
                progressInterval = setInterval(() => {
                    if (simulatedProgress < 95) {
                        simulatedProgress += Math.random() * 5;
                        this.transcodeProgress = Math.min(Math.round(simulatedProgress), 95);
                        const elapsed = Math.round((Date.now() - this.transcodeStartTime) / 1000);
                        this.transcodeMessage = `Transcoding... ${this.transcodeProgress}% (${elapsed}s elapsed)`;
                        // Emit progress with message for fallback mode
                        if (this.currentResolutionHeight && availableResolutions.length > 1) {
                            const currentIdx = availableResolutions.findIndex(r => r.height === this.currentResolutionHeight) + 1;
                            this.$emit('progress', {
                                progress: this.transcodeProgress,
                                message: `(${this.currentResolutionHeight}p - ${currentIdx}/${availableResolutions.length})`
                            });
                        } else {
                            this.$emit('progress', this.transcodeProgress);
                        }
                    }
                }, 2000);
            }

            try {
                for (let i = 0; i < availableResolutions.length; i++) {
                    const resolution = availableResolutions[i];
                    const resHeight = resolution.height;
                    const resWidth = resolution.width;
                    const bitrate = resolution.bitrate;
                    
                    // Set current resolution for progress tracking
                    this.currentResolutionHeight = resHeight;
                    
                    // Update progress for current resolution
                    this.updateResolutionProgress(resHeight, 'processing', 0, 'Starting...');
                    this.transcodeMessage = `Transcoding ${resHeight}p (${i + 1}/${availableResolutions.length})...`;
                    // Force Vue to update the UI
                    this.$nextTick(() => {
                        this.$forceUpdate();
                    });
                    debugLogger.info(`📺 Setting message: "${this.transcodeMessage}"`);
                    debugLogger.debug(`🎬 Transcoding resolution ${resHeight}p (${resWidth}x${resHeight}) at ${bitrate}k bitrate`);
                    
                    const commands = this.buildOptimizedFFmpegCommand(
                        inputName, resWidth, resHeight, bitrate, this.sessionId
                    );
                    
                    // Small delay to ensure UI updates before FFmpeg starts
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                    try {
                        await ffmpegManager.exec(commands);
                        this.updateResolutionProgress(resHeight, 'processing', 90, 'Processing completed, reading files...');
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                        const fileList = await ffmpegManager.listDir('/');
                        const segmentFiles = fileList.filter(f => 
                            f.name.startsWith(`${this.sessionId}_${resHeight}p_`) && f.name.endsWith('.ts')
                        );
                        const playlistFile = fileList.find(f => 
                            f.name === `${this.sessionId}_${resHeight}p_index.m3u8`
                        );
                        
                        if (playlistFile && segmentFiles.length > 0) {
                            successfulResolutions.push(resHeight);
                            this.updateResolutionProgress(resHeight, 'processing', 95, 'Extracting files...');
                            
                            // Extract files
                            for (const segFile of segmentFiles) {
                                const segData = await ffmpegManager.readFile(segFile.name);
                                const finalSegmentName = segFile.name.replace(`${this.sessionId}_`, '');
                                extractedFiles.set(finalSegmentName, segData.slice());
                            }
                            
                            const playlistData = await ffmpegManager.readFile(playlistFile.name);
                            const playlistText = new TextDecoder().decode(playlistData);
                            const updatedPlaylistText = playlistText.replace(
                                new RegExp(`${this.sessionId}_`, 'g'), ''
                            );
                            const updatedPlaylistData = new TextEncoder().encode(updatedPlaylistText);
                            const finalPlaylistName = playlistFile.name.replace(`${this.sessionId}_`, '');
                            extractedFiles.set(finalPlaylistName, updatedPlaylistData);
                            
                            // Cleanup
                            for (const segFile of segmentFiles) {
                                await ffmpegManager.deleteFile(segFile.name);
                            }
                            await ffmpegManager.deleteFile(playlistFile.name);
                            
                            this.updateResolutionProgress(resHeight, 'completed', 100, 'Complete');
                            
                            // Clear current resolution when done
                            if (this.currentResolutionHeight === resHeight) {
                                this.currentResolutionHeight = null;
                            }
                        } else {
                            this.updateResolutionProgress(resHeight, 'error', 0, 'No output files generated');
                        }
                    } catch (resolutionError) {
                        debugLogger.error(`❌ ${resHeight}p transcoding failed:`, resolutionError);
                        this.updateResolutionProgress(resHeight, 'error', 0, resolutionError.message);
                    }
                }
            } finally {
                if (progressInterval) {
                    clearInterval(progressInterval);
                    this.transcodeProgress = 100;
                }
            }

            return { extractedFiles, successfulResolutions };
        },

    },
    
    mounted() {
        debugLogger.info(`🎬 VideoTranscoder mounted for ${this.fileName} (autoStart: ${this.autoStart}, headless: ${this.headless})`);
        
        if (this.autoStart) {
            // For headless mode, wait a bit to ensure parent component has set up properly
            if (this.headless) {
                // Check and start if appropriate
                this.checkAndStartIfReady();
                
                // Also watch for parent status changes if we're queued
                if (this.$parent?.processingFiles) {
                    const checkInterval = setInterval(() => {
                        const parentFile = this.$parent.processingFiles.find(f => f.file === this.file);
                        if (parentFile && parentFile.status === 'transcoding' && this.state === 'ready') {
                            debugLogger.info(`🔄 Parent status changed to transcoding, starting ${this.fileName}`);
                            clearInterval(checkInterval);
                            this.uploadChoice = 'transcode';
                            this.startProcess();
                        } else if (!parentFile) {
                            // File was removed from processing
                            clearInterval(checkInterval);
                        }
                    }, 500);
                    
                    // Stop checking after 30 seconds
                    setTimeout(() => clearInterval(checkInterval), 30000);
                }
            } else {
                // Non-headless mode, start normally
                this.initFFmpeg().then(() => {
                    if (this.state === 'ready') {
                        // Auto-start the transcoding process
                        this.uploadChoice = 'transcode'; // Default choice for auto-start
                        this.startProcess();
                    }
                });
            }
        }
    },
    
    beforeUnmount() {
        // Clean up progress subscription
        if (this.unsubscribeProgress) {
            this.unsubscribeProgress();
        }
        // Clean up player
        this.cleanupPlayer();
        
        // Clean up blob URLs
        Object.values(this.blobUrls).forEach(url => {
            URL.revokeObjectURL(url);
        });
    }
};