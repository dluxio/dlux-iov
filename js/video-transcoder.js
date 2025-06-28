// Video Transcoder Component
// Modular FFmpeg.wasm integration for video transcoding across DLUX IOV

import { ffmpegManager } from './services/ffmpeg-manager.js';

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
        <div v-else-if="state === 'transcoding'" class="transcoding-progress">
            <h5>Transcoding Video</h5>
            <div class="mb-3">
                <div class="d-flex justify-content-between mb-1">
                    <span>{{ transcodeMessage }}</span>
                    <span>{{ transcodeProgress }}%</span>
                </div>
                <div class="progress">
                    <div class="progress-bar progress-bar-striped progress-bar-animated bg-success" 
                         :style="'width: ' + transcodeProgress + '%'"
                         role="progressbar">
                    </div>
                </div>
            </div>
            <p class="text-muted small">
                <i class="fa-solid fa-info-circle me-1"></i>
                This may take several minutes depending on video size and quality
            </p>
        </div>

        <!-- Success State -->
        <div v-else-if="state === 'complete'" class="text-center">
            <div class="position-relative d-inline-block mb-3" style="cursor: pointer;" @click="showVideoPreview">
                <img v-if="outputFiles.thumbnail" 
                     :src="thumbnailUrl" 
                     class="img-thumbnail"
                     style="max-width: 300px; max-height: 200px;"
                     alt="Video thumbnail">
                <div class="position-absolute top-50 start-50 translate-middle">
                    <i class="fa-solid fa-play-circle fa-3x text-white" style="text-shadow: 0 0 10px rgba(0,0,0,0.8);"></i>
                </div>
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
            errorMessage: '',
            outputFiles: {
                m3u8: null,
                segments: [],
                thumbnail: null
            },
            useProgressFallback: false,
            transcodeStartTime: null,
            unsubscribeProgress: null,
            showPreview: false,
            availableQualities: ['720p'], // Default, will be updated based on transcoding
            currentQuality: '720p',
            blobUrls: {},
            hlsInstance: null,
            thumbnailUrl: null,
            transcodedFiles: [],
            videoLoading: false,
            sessionId: null // Unique ID for this transcoding session
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
                
                // Load FFmpeg using the manager
                await ffmpegManager.load();
                
                clearInterval(progressInterval);
                this.loadProgress = 100;
                this.loadMessage = 'FFmpeg loaded successfully';
                
                // Subscribe to progress events
                this.unsubscribeProgress = ffmpegManager.onProgress(({ progress, time }) => {
                    if (this.state === 'transcoding') {
                        this.transcodeProgress = Math.round(progress * 100);
                        this.transcodeMessage = `Processing... ${this.formatTime(time)}`;
                        // Clear the fallback flag since real progress is working
                        this.useProgressFallback = false;
                        // Emit progress event for external listeners
                        this.$emit('progress', this.transcodeProgress);
                    }
                });
                
                this.state = 'ready';
                return true;
                
            } catch (error) {
                console.error('Failed to load FFmpeg:', error);
                this.errorMessage = 'Failed to load video transcoder';
                this.state = 'error';
                // Set fallback flag on error
                this.useProgressFallback = true;
                return false;
            }
        },
        
        
        async startProcess() {
            if (this.uploadChoice === 'original') {
                // Skip transcoding, emit original file
                this.$emit('complete', {
                    choice: 'original',
                    files: [this.file]
                });
                return;
            }
            
            // Generate unique session ID for this transcoding operation
            this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Initialize FFmpeg if needed
            const loaded = await this.initFFmpeg();
            if (!loaded) return;
            
            // Start transcoding
            this.state = 'transcoding';
            this.transcodeProgress = 0;
            
            try {
                const result = await this.transcodeVideo();
                
                // Store transcoded files for preview
                this.transcodedFiles = result.files;
                
                // Create blob URLs for preview
                await this.createBlobUrls(result.files);
                
                // Create thumbnail URL
                if (result.thumbnail) {
                    this.thumbnailUrl = URL.createObjectURL(result.thumbnail);
                }
                
                this.state = 'complete';
                
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
                console.error('Transcoding error:', error);
                
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
                this.$emit('error', error);
            }
        },
        
        async transcodeVideo() {
            if (!window.FFmpegUtil) {
                throw new Error('FFmpegUtil not loaded');
            }
            const { fetchFile } = window.FFmpegUtil;
            
            this.transcodeMessage = 'Reading video file...';
            const inputData = await fetchFile(this.file);
            const inputName = `${this.sessionId}_input.${this.getFileExtension(this.fileName)}`;
            
            // Write input file with session-specific name
            await ffmpegManager.writeFile(inputName, inputData);
            
            // Determine output quality
            const quality = await this.determineQuality(inputName);
            
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
            this.outputFiles.thumbnail = new File([thumbnailData], 'thumbnail.jpg', { type: 'image/jpeg' });
            
            // Transcode to HLS with session-specific names
            const outputName = `${this.sessionId}_output.m3u8`;
            const segmentPattern = `${this.sessionId}_segment_%03d.ts`;
            
            this.transcodeMessage = 'Transcoding to streaming format...';
            const outputResolution = this.getResolutionSettings(quality);
            
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
                        // Emit progress event
                        this.$emit('progress', this.transcodeProgress);
                    }
                }, 2000);
            }
            
            try {
                await ffmpegManager.exec([
                    '-i', inputName,
                    '-c:v', 'libx264',
                    '-c:a', 'aac',
                    '-b:a', '128k',
                    '-vf', `scale=${outputResolution.width}:${outputResolution.height}`,
                    '-b:v', outputResolution.bitrate,
                    '-preset', 'fast',
                    '-hls_time', '10',
                    '-hls_list_size', '0',
                    '-hls_segment_filename', segmentPattern,
                    '-f', 'hls',
                    outputName
                ]);
            } finally {
                if (progressInterval) {
                    clearInterval(progressInterval);
                    this.transcodeProgress = 100;
                }
            }
            
            // Read output files
            this.transcodeMessage = 'Packaging files...';
            const m3u8Data = await ffmpegManager.readFile(outputName);
            
            // Update m3u8 content to use original segment names (remove session prefix)
            const m3u8Content = new TextDecoder().decode(m3u8Data);
            const updatedM3u8Content = m3u8Content.replace(
                new RegExp(`${this.sessionId}_segment_`, 'g'), 
                'segment_'
            );
            
            // Generate meaningful filename from original
            const baseName = this.fileName.replace(/\.[^/.]+$/, ''); // Remove extension
            const m3u8FileName = `${baseName}.m3u8`;
            const m3u8File = new File(
                [new TextEncoder().encode(updatedM3u8Content)], 
                m3u8FileName, 
                { type: 'application/x-mpegURL' }
            );
            
            // Store m3u8 file reference
            this.outputFiles.m3u8 = m3u8File;
            
            // Read segments with session prefix and rename them
            const files = [m3u8File];
            const fileList = await ffmpegManager.listDir('/');
            
            for (const file of fileList) {
                if (file.name.startsWith(`${this.sessionId}_segment_`) && file.name.endsWith('.ts')) {
                    const segmentData = await ffmpegManager.readFile(file.name);
                    // Remove session prefix from segment name
                    const originalSegmentName = file.name.replace(`${this.sessionId}_`, '');
                    const segmentFile = new File([segmentData], originalSegmentName, { type: 'video/mp2t' });
                    files.push(segmentFile);
                    this.outputFiles.segments.push(segmentFile);
                }
            }
            
            // Clean up only session-specific files
            await this.cleanupSessionFiles();
            
            return {
                files: files,
                m3u8File: m3u8File,
                thumbnail: this.outputFiles.thumbnail
            };
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
                '1080p': { width: 1920, height: 1080, bitrate: '5M' },
                '720p': { width: 1280, height: 720, bitrate: '3M' },
                '480p': { width: 854, height: 480, bitrate: '1.5M' }
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
        
        async createBlobUrls(files) {
            // First, create blob URLs for all segment files
            const m3u8Files = [];
            
            for (const file of files) {
                if (file.name.endsWith('.ts')) {
                    // Create blob URL for segment
                    const url = URL.createObjectURL(file);
                    this.blobUrls[file.name] = url;
                } else if (file.name.endsWith('.m3u8')) {
                    // Store m3u8 files for processing later
                    m3u8Files.push(file);
                }
            }
            
            // Now process m3u8 files with updated segment URLs
            for (const m3u8File of m3u8Files) {
                try {
                    // Update the m3u8 content with blob URLs
                    const updatedBlob = await this.updateM3u8WithBlobUrls(m3u8File);
                    const updatedUrl = URL.createObjectURL(updatedBlob);
                    
                    // Store the updated blob URL
                    this.blobUrls[m3u8File.name] = updatedUrl;
                    
                    // Store quality mapping
                    // For now, we're using single quality
                    this.availableQualities = ['720p'];
                    this.currentQuality = '720p';
                    
                    console.log(`Created updated m3u8 blob URL for ${m3u8File.name}`);
                } catch (error) {
                    console.error(`Error processing m3u8 file ${m3u8File.name}:`, error);
                }
            }
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
            if (this.uploadChoice === 'both') {
                files.push(this.file); // Original
            }
            files.push(...this.transcodedFiles); // Transcoded files
            
            this.$emit('complete', {
                choice: this.uploadChoice,
                files: files,
                m3u8File: this.outputFiles.m3u8,
                thumbnail: this.outputFiles.thumbnail
            });
        },
        
        initializeHlsPlayer() {
            const video = this.$refs.videoPlayer;
            if (!video) return;
            
            // Set loading state
            this.videoLoading = true;
            
            // Find the m3u8 file
            const m3u8File = this.transcodedFiles.find(f => f.name.endsWith('.m3u8'));
            if (!m3u8File) {
                console.error('No m3u8 file found');
                this.videoLoading = false;
                return;
            }
            
            const m3u8Url = this.blobUrls[m3u8File.name];
            
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
                    console.log('Video manifest loaded and parsed');
                    // Video is ready to play, hide loading spinner
                    this.videoLoading = false;
                    // Autoplay the video
                    video.play().catch(e => {
                        console.log('Autoplay prevented:', e);
                    });
                });
                
                this.hlsInstance.on(Hls.Events.ERROR, (event, data) => {
                    if (data.fatal) {
                        console.error('Fatal HLS error:', data);
                        this.errorMessage = 'Video playback error. Please try again.';
                    } else if (data.details !== 'bufferSeekOverHole' && data.details !== 'bufferNudgeOnHole') {
                        // Log other non-fatal errors except common buffer holes
                        console.warn('HLS warning:', data.details);
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
                        console.log('Autoplay prevented:', e);
                    });
                }, { once: true });
            } else {
                console.error('HLS not supported in this browser');
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
                        console.error('Unexpected non-blob URL in playlist:', context.url);
                        callbacks.onError({ code: 404, text: 'Invalid URL in playlist' }, context);
                    }
                }
            }
            
            return BlobLoader;
        },
        
        switchQuality() {
            // For future implementation when we have multiple qualities
            console.log('Switching to quality:', this.currentQuality);
            // Re-initialize player with new quality
            this.cleanupPlayer();
            this.$nextTick(() => {
                this.initializeHlsPlayer();
            });
        },
        
        onVideoLoaded() {
            console.log('Video metadata loaded');
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
            
            // Replace segment references with blob URLs
            const lines = content.split('\n');
            const updatedLines = lines.map(line => {
                if (!line.trim() || line.startsWith('#')) {
                    return line;
                }
                
                // This is a segment reference
                const segmentName = line.trim();
                const blobUrl = this.blobUrls[segmentName];
                
                if (blobUrl) {
                    console.log(`Replaced segment ${segmentName} with blob URL`);
                    return blobUrl;
                }
                
                console.warn('No blob URL found for segment:', segmentName);
                return line;
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
                            console.warn(`Could not delete session file ${file.name}:`, e);
                        }
                    }
                }
            } catch (error) {
                console.warn('Error during session cleanup:', error);
            }
        }
    },
    
    mounted() {
        if (this.autoStart) {
            this.initFFmpeg().then(() => {
                if (this.state === 'ready') {
                    // Auto-start the transcoding process
                    this.uploadChoice = 'transcode'; // Default choice for auto-start
                    this.startProcess();
                }
            });
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
        
        if (this.thumbnailUrl) {
            URL.revokeObjectURL(this.thumbnailUrl);
        }
    }
};