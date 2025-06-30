// Video Transcoder Component
// Modular FFmpeg.wasm integration for video transcoding across DLUX IOV

import { ffmpegManager } from './services/ffmpeg-manager.js';
import { ProcessedFile, FileRoles } from './utils/processed-file.js';
import debugLogger from './utils/debug-logger.js';

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
                segments: []
            },
            useProgressFallback: false,
            transcodeStartTime: null,
            unsubscribeProgress: null,
            showPreview: false,
            availableQualities: ['720p'], // Default, will be updated based on transcoding
            currentQuality: '720p',
            blobUrls: {},
            hlsInstance: null,
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
            
            // Store all generated files for processing
            const extractedFiles = new Map(); // Map<filename, Uint8Array>
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
                        // Emit progress event
                        this.$emit('progress', this.transcodeProgress);
                    }
                }, 2000);
            }
            
            // Get video info first to understand duration
            debugLogger.debug('🎬 Getting video information...');
            try {
                await ffmpegManager.exec(['-i', inputName, '-f', 'null', '-']);
            } catch (infoError) {
                debugLogger.debug('📊 Video info (FFmpeg reports as error):', infoError.message);
            }
            
            // Transcode each resolution separately (like old system)
            try {
                for (let i = 0; i < availableResolutions.length; i++) {
                    const resolution = availableResolutions[i];
                    const resHeight = resolution.height;
                    const resWidth = resolution.width;
                    const bitrate = resolution.bitrate;
                    
                    this.transcodeMessage = `Transcoding ${resHeight}p (${i + 1}/${availableResolutions.length})...`;
                    debugLogger.debug(`🎬 Transcoding resolution ${resHeight}p (${resWidth}x${resHeight}) at ${bitrate}k bitrate`);
                    
                    // FFmpeg command for this specific resolution (based on old system)
                    const commands = [
                        '-i', inputName,
                        '-c:v', 'libx264',
                        '-b:v', `${Math.round(bitrate)}k`,
                        '-maxrate', `${Math.round(bitrate * 1.5)}k`,
                        '-bufsize', `${Math.round(bitrate * 2)}k`,
                        '-vf', `scale=${resWidth}:${resHeight}`,
                        '-c:a', 'aac',
                        '-b:a', '128k',
                        '-profile:v', 'main',
                        '-max_muxing_queue_size', '1024',
                        '-f', 'segment',
                        '-segment_time', '5',
                        '-segment_format', 'mpegts',
                        '-segment_list_type', 'm3u8',
                        '-segment_list', `${this.sessionId}_${resHeight}p_index.m3u8`,
                        '-hls_time', '3',
                        '-hls_list_size', '0',
                        '-force_key_frames', 'expr:gte(t,n_forced*3)',
                        `${this.sessionId}_${resHeight}p_%03d.ts`
                    ];
                    
                    try {
                        await ffmpegManager.exec(commands);
                        
                        // Wait for files to be written
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                        // Check what files were created
                        const fileList = await ffmpegManager.listDir('/');
                        const segmentFiles = fileList.filter(f => 
                            f.name.startsWith(`${this.sessionId}_${resHeight}p_`) && f.name.endsWith('.ts')
                        );
                        const playlistFile = fileList.find(f => 
                            f.name === `${this.sessionId}_${resHeight}p_index.m3u8`
                        );
                        
                        debugLogger.debug(`📋 ${resHeight}p files: ${segmentFiles.length} segments, playlist: ${playlistFile ? 'found' : 'missing'}`);
                        
                        if (playlistFile && segmentFiles.length > 0) {
                            successfulResolutions.push(resHeight);
                            
                            // Extract segment files to memory
                            for (const segFile of segmentFiles) {
                                const segData = await ffmpegManager.readFile(segFile.name);
                                const segDataCopy = segData.slice();
                                // Remove session prefix for final name
                                const finalSegmentName = segFile.name.replace(`${this.sessionId}_`, '');
                                extractedFiles.set(finalSegmentName, segDataCopy);
                                debugLogger.debug(`💾 Extracted segment: ${finalSegmentName} (${segDataCopy.length} bytes)`);
                            }
                            
                            // Extract playlist file to memory
                            const playlistData = await ffmpegManager.readFile(playlistFile.name);
                            // Update playlist content to remove session prefixes from segment references
                            const playlistText = new TextDecoder().decode(playlistData);
                            const updatedPlaylistText = playlistText.replace(
                                new RegExp(`${this.sessionId}_`, 'g'),
                                ''
                            );
                            const updatedPlaylistData = new TextEncoder().encode(updatedPlaylistText);
                            
                            // Remove session prefix for final name
                            const finalPlaylistName = playlistFile.name.replace(`${this.sessionId}_`, '');
                            extractedFiles.set(finalPlaylistName, updatedPlaylistData);
                            debugLogger.debug(`💾 Extracted playlist: ${finalPlaylistName} (${updatedPlaylistData.length} bytes)`);
                            
                            // Clean up FFmpeg filesystem for next resolution
                            for (const segFile of segmentFiles) {
                                await ffmpegManager.deleteFile(segFile.name);
                            }
                            await ffmpegManager.deleteFile(playlistFile.name);
                            
                        } else {
                            debugLogger.error(`❌ ${resHeight}p files missing after transcoding`);
                        }
                        
                    } catch (resolutionError) {
                        debugLogger.error(`❌ ${resHeight}p transcoding failed:`, resolutionError);
                        // Continue with other resolutions
                    }
                }
                
            } finally {
                if (progressInterval) {
                    clearInterval(progressInterval);
                    this.transcodeProgress = 100;
                }
            }
            
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
            
            // Create segment mapping for URL replacement (like old system)
            const segmentMapping = new Map();
            
            // Create File objects for all segments and hash them
            for (const segmentName of tsFiles) {
                const segmentData = extractedFiles.get(segmentName);
                
                // Hash the segment to get its CID (like old system)
                try {
                    const buf = buffer.Buffer(segmentData);
                    const hashResult = await Hash.of(buf, { unixfs: 'UnixFS' });
                    segmentMapping.set(segmentName, hashResult);
                    debugLogger.debug(`🔑 Hashed segment ${segmentName}: ${hashResult}`);
                } catch (error) {
                    debugLogger.error(`Failed to hash segment ${segmentName}:`, error);
                    throw new Error(`Failed to hash video segment: ${error.message}`);
                }
                
                const segmentFile = new File([segmentData], segmentName, {
                    type: 'video/mp2t',
                    lastModified: now
                });
                
                // Assign the CID to the file so upload system knows it's pre-hashed
                segmentFile.cid = segmentMapping.get(segmentName);
                
                debugLogger.debug(`✅ Created segment file: ${segmentName} (${segmentData.length} bytes) with CID: ${segmentFile.cid}`);
                files.push(segmentFile);
                this.outputFiles.segments.push(segmentFile);
            }
            
            // Create resolution playlists with updated segment URLs
            const resolutionPlaylists = [];
            const playlistMapping = new Map(); // Track playlist name -> CID
            
            for (const playlistName of m3u8Files) {
                const playlistData = extractedFiles.get(playlistName);
                let playlistContent = new TextDecoder().decode(playlistData);
                
                debugLogger.debug(`📋 Original playlist ${playlistName} content preview:`, playlistContent.substring(0, 200));
                
                // Replace segment references with IPFS URLs (like old system)
                segmentMapping.forEach((segmentCID, segmentName) => {
                    const segmentPattern = new RegExp(segmentName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                    const ipfsUrl = `https://ipfs.dlux.io/ipfs/${segmentCID}?filename=${segmentName}`;
                    playlistContent = playlistContent.replace(segmentPattern, ipfsUrl);
                    debugLogger.debug(`📝 Replaced ${segmentName} with ${ipfsUrl} in ${playlistName}`);
                });
                
                debugLogger.debug(`📋 Updated playlist ${playlistName} content preview:`, playlistContent.substring(0, 200));
                
                // Create file with updated content
                const updatedPlaylistData = new TextEncoder().encode(playlistContent);
                
                // Hash the updated playlist to get its CID
                try {
                    const buf = buffer.Buffer(updatedPlaylistData);
                    const hashResult = await Hash.of(buf, { unixfs: 'UnixFS' });
                    playlistMapping.set(playlistName, hashResult);
                    debugLogger.debug(`🔑 Hashed playlist ${playlistName}: ${hashResult}`);
                    
                    const playlistFile = new File([updatedPlaylistData], playlistName, {
                        type: 'application/x-mpegURL',
                        lastModified: now
                    });
                    
                    // Assign the CID to the file
                    playlistFile.cid = hashResult;
                    
                    debugLogger.debug(`✅ Created playlist file: ${playlistName} (${updatedPlaylistData.length} bytes) with CID: ${playlistFile.cid}`);
                    files.push(playlistFile);
                    
                    // Store for master playlist creation
                    const resolution = playlistName.match(/(\d+)p_index\.m3u8/)?.[1];
                    if (resolution) {
                        resolutionPlaylists.push({
                            resolution: resolution,
                            fileName: playlistName,
                            content: playlistContent,
                            file: playlistFile,
                            cid: hashResult // Store the CID for master playlist
                        });
                    }
                } catch (error) {
                    debugLogger.error(`Failed to hash playlist ${playlistName}:`, error);
                    throw new Error(`Failed to hash playlist: ${error.message}`);
                }
            }
            
            // Create master playlist (like old system)
            this.transcodeMessage = 'Creating master playlist...';
            const masterPlaylistContent = this.createMasterPlaylist(resolutionPlaylists, baseName);
            
            // Hash the master playlist
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
                
                debugLogger.debug(`✅ Created master playlist: ${baseName}.m3u8 with CID: ${masterHash}`);
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
            debugLogger.info('🧹 Cleaning up video transcoder state');
            
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
            this.sessionId = null;
            
            // Clean up HLS player if exists
            this.cleanupPlayer();
        },
        
        async createBlobUrls(files) {
            // IMPORTANT: This method creates blob URLs for preview only.
            // It does NOT modify the original files - those remain with local references for upload.
            
            debugLogger.info('⚠️ IMPORTANT: Creating blob URLs for preview only - original files remain unchanged');
            
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
            
            // Set current quality to highest available
            this.currentQuality = this.availableQualities[0] || '720p';
            
            debugLogger.debug(`Available qualities: ${this.availableQualities.join(', ')}, current: ${this.currentQuality}`);
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
            
            // Find the m3u8 file (handle ProcessedFile wrapper)
            const m3u8Wrapper = this.transcodedFiles.find(f => {
                const fileName = f.name || (f.getFile && f.getFile().name);
                return fileName && fileName.endsWith('.m3u8');
            });
            if (!m3u8Wrapper) {
                debugLogger.error('No m3u8 file found');
                this.videoLoading = false;
                return;
            }
            
            const m3u8FileName = m3u8Wrapper.name || m3u8Wrapper.getFile().name;
            const m3u8Url = this.blobUrls[m3u8FileName];
            
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
                    // Video is ready to play, hide loading spinner
                    this.videoLoading = false;
                    // Autoplay the video
                    video.play().catch(e => {
                        debugLogger.debug('Autoplay prevented:', e);
                    });
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
            // For future implementation when we have multiple qualities
            debugLogger.debug('Switching to quality:', this.currentQuality);
            // Re-initialize player with new quality
            this.cleanupPlayer();
            this.$nextTick(() => {
                this.initializeHlsPlayer();
            });
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
                const referenceName = line.trim();
                
                // Master playlists reference other playlists (.m3u8)
                // Resolution playlists reference segments (.ts)
                if (isMasterPlaylist && referenceName.endsWith('.m3u8')) {
                    // For master playlist, keep playlist references as-is
                    // They'll be loaded via blob URLs from the blobUrls map
                    const blobUrl = this.blobUrls[referenceName];
                    if (blobUrl) {
                        return blobUrl;
                    }
                    return referenceName; // Keep original if no blob URL yet
                } else if (!isMasterPlaylist && referenceName.endsWith('.ts')) {
                    // For resolution playlists, replace segment references
                    const blobUrl = this.blobUrls[referenceName];
                    if (blobUrl) {
                        return blobUrl;
                    }
                    debugLogger.debug('No blob URL found for segment:', referenceName);
                    return referenceName;
                }
                
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

        // Create master playlist that references all resolution playlists
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
    }
};