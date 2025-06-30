import ModalVue from '/js/modal-manager.js';
import UploadVue from '/js/uploadvue-dd.js';
import VideoTranscoder from '/js/video-transcoder.js';
import MCommon from '/js/methods-common.js';
import Watchers from '/js/watchers-common.js';
import debugLogger from '/js/utils/debug-logger.js';

export default {
    name: 'UploadEverywhere',
    components: {
        'modal-vue': ModalVue,
        'upload-vue': UploadVue,
        'video-transcoder': VideoTranscoder,
    },
    template: `
  <div class="d-flex flex-column">
    <!-- Drag and Drop Area / Click Trigger -->
    <div
      @drop="handleDrop"
      @dragover.prevent
      @click="triggerFileInput"
      class="drop-area btn btn-sm btn-dark me-2 border border-light border-2 border-dashed"
      style="border-style: dashed !important;"
    >
      <i class="fa-solid fa-cloud-arrow-up fa-fw me-1"></i>Upload Files
    </div>
    <input type="file" multiple ref="fileInput" @change="handleFileSelect" style="display: none;">

    <!-- Teleported UI Elements -->
    <teleport :to="teleportref" v-if="droppedFiles.length > 0">
        <div class="d-flex flex-column rounded p-2 border border-primary bg-blur-darkg mb-3">
            <!-- File List -->
            <div v-if="droppedFiles.length > 0" class="mb-3">
                <h5>Ready to Upload: {{ totalFileCount }} files (Total Size: {{ fancyBytes(totalSize) }})</h5>
                <ul class="m-0 p-0">
                    <li v-for="(file, index) in droppedFiles" :key="index" class="my-1 p-2 bg-card rounded d-flex justify-content-between align-items-center">
                        <div class="d-flex align-items-center">
                            <!-- File type icon -->
                            <i :class="getFileIcon(file)" class="me-2"></i>
                            <div>
                                <div>{{ getFileName(file) }}</div>
                                <small class="text-muted">{{ fancyBytes(getFileSize(file)) }}</small>
                                <!-- Streaming badge for m3u8 files -->
                                <span v-if="isStreamableVideo(file)" class="badge bg-success ms-2">
                                    <i class="fa-solid fa-play fa-xs"></i> Streamable
                                </span>
                            </div>
                        </div>
                        <div class="d-flex gap-1">
                            <!-- Play button for streamable videos -->
                            <button v-if="isStreamableVideo(file)" 
                                    class="btn btn-sm btn-primary" 
                                    @click="previewVideo(file, index)"
                                    title="Preview Video">
                                <i class="fa-solid fa-play"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" 
                                    @click="removeFile(index)" 
                                    :disabled="!canDeleteFile(file, index)"
                                    :title="getDeleteTooltip(file, index)">
                                <i class="fa-solid fa-times"></i>
                            </button>
                        </div>
                    </li>
                </ul>
            </div>

            <!-- Contract Progress Bar -->
            <div v-if="contractSize > 0 && droppedFiles.length > 0" class="mb-3">
                <label class="form-label small mb-0">Contract Usage: {{ fancyBytes(totalSize) }} / {{ fancyBytes(contractSize) }}</label>
                <progress class="progress w-100" :value="totalSize" :max="contractSize" style="height: 5px;"></progress>
            </div>


            <!-- Contract Modal Trigger -->
            <modal-vue
                v-if="showContractButton"
                type="contract"
                :to_account="{'amount':displayRequiredBroca,'broker':'dlux-io'}"
                :account="account"
                :api="sapi"
                :mypfp="mypfp"
                :tokenuser="saccountapi"
                :tokenstats="stats"
                :tokenprotocol="protocol"
                @tosign="sendIt($event, 'contractBuilt')"
                v-slot:trigger
            >
                <!-- Button to Build/Upgrade Contract -->
                <button
                    v-if="!contractSize || requiredBroca > contractSize"
                    :class="['btn', 'mb-3', 'trigger', !contractSize ? 'btn-primary' : 'btn-secondary']">
                {{ !contractSize ? 'Build Contract' : 'Upgrade Contract' }} for {{ displayRequiredBroca.toFixed(0) }} BROCA
                </button>
            </modal-vue>

            <!-- Continue Button -->
            <button v-if="contractBuilt && requiredBroca <= contractSize && droppedFiles.length > 0" @click="startUpload" class="ms-auto btn btn-sm btn-primary">
                Continue<i class="fa-solid fa-angles-right ms-1 fa-fw"></i>
            </button>

            <!-- Loading State (for contract build) -->
            <div v-if="loading" class="text-center mt-3">
                <p>Building contract... Please wait.</p>
            </div>
        </div>
    </teleport>

    <!-- Video Preview Modal -->
    <teleport to="body">
        <div v-if="showVideoPreview" 
             class="modal-overlay d-flex justify-content-center align-items-center"
             @click.self="closeVideoPreview"
             style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.9); z-index: 1056;">
            
            <div class="modal-content bg-dark text-white rounded shadow-lg p-4" 
                 style="max-width: 900px; width: 95%;">
                
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h4 class="mb-0">
                        <i class="fa-solid fa-video me-2"></i>
                        Video Preview: {{ previewFile?.name }}
                    </h4>
                    <button type="button" class="btn-close btn-close-white" @click="closeVideoPreview"></button>
                </div>
                
                <!-- Video Player -->
                <div class="video-container mb-3 position-relative" style="background: #000; border-radius: 8px; overflow: hidden;">
                    <video ref="videoPlayer" 
                           controls 
                           style="width: 100%; max-height: 500px;"
                           @loadedmetadata="onVideoLoaded">
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
                </div>
            </div>
        </div>
    </teleport>

    <!-- Upload Modal (Teleported to body using div overlay pattern) -->
    <teleport to="body">
      <div v-if="showUploadModal"
           class="details-viewer-overlay d-flex justify-content-center align-items-center"
           @click.self="closeUploadModal" 
           style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.8); z-index: 1055; overflow-y: auto; padding: 20px;">
        
        <!-- Inner Content Box -->
        <div class="bg-blur-darkg text-white p-4 rounded shadow-lg" style="min-width: 500px; max-width: 800px; max-height: 90vh; overflow-y: auto;"> 
          <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
              <h5 class="mb-0">Upload Files</h5>
              <button type="button" class="btn-close btn-close" aria-label="Close" @click="closeUploadModal"></button>
          </div>
          
          <upload-vue
            :user="saccountapi"
            :propcontract="selectedContract"
            :prop-structured-files="structuredFilesForUpload"
            @tosign="sendIt($event)"
            @done="handleUploadDone"
          />
        </div>
      </div>
    </teleport>
    
    <!-- Video Transcoding Modal -->
    <teleport to="body">
      <div v-if="showVideoTranscoder" 
           class="modal-overlay d-flex justify-content-center align-items-center"
           @click.self="closeVideoTranscoder"
           style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.8); z-index: 1056;">
        
        <div class="modal-content bg-dark text-white rounded shadow-lg p-4" 
             style="max-width: 600px; width: 90%;">
          
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h4 class="mb-0">
              <i class="fa-solid fa-video me-2"></i>
              Video File Detected
            </h4>
            <button type="button" class="btn-close btn-close-white" @click="closeVideoTranscoder"></button>
          </div>
          
          <video-transcoder
            v-if="videoToTranscode"
            :file="videoToTranscode.file"
            :file-name="videoToTranscode.fileName"
            :file-size="videoToTranscode.fileSize"
            @complete="handleTranscodeComplete"
            @skip="skipVideoTranscoding"
            @cancel="closeVideoTranscoder"
            @error="handleTranscodeError"
          />
        </div>
      </div>
    </teleport>

  </div>
  `,
    props: {
        account: {
            type: String,
            default: '',
            required: true,
        },
        signedtx: Array,
        sapi: {
            type: String,
            default: 'https://spktest.dlux.io',
        },
        mypfp: {
            type: String,
            default: '',
        },
        protocol: {
            type: Object,
            default: () => ({}),
        },
        stats: {
            type: Object,
            default: () => ({}),
        },
        spkapi: {
            type: Object,
            default: () => ({}),
        },
        saccountapi: {
            type: Object,
            default: () => ({
                spk: 0,
                balance: 0,
                gov: 0,
                poweredUp: 0,
                claim: 0,
                granted: { t: 0 },
                granting: { t: 0 },
                head_block: 0,
                channels: {} // Ensure channels is initialized
            }),
        },
        teleportref: {
            type: String,
            default: null // Default to null, teleport is disabled if null
        },
        externalDrop: { // Added: New prop for external file drops with path
            type: Object,
            default: () => ({ files: [], targetPath: null })
        },
        nodeview: {
            type: Boolean,
            default: false,
        },
        cc: {
            type: Boolean,
            default: false,
        },
        videoHandlingMode: {
            type: String,
            default: 'internal',
            validator: value => ['internal', 'external'].includes(value)
        },
    },
    data() {
        return {
            droppedFiles: [],
            totalSize: 0,
            requiredBroca: 0,
            contractSize: 0,
            showContractButton: false,
            contractBuilt: false, // True if *any* contract is selected from channels
            selectedContract: null,
            loading: false, // Specifically for contract building transaction
            structuredFilesForUpload: [],
            showUploadModal: false, // Controls the upload modal visibility
            // Video transcoding
            showVideoTranscoder: false,
            videoToTranscode: null,
            pendingVideoFiles: [],
            pendingNonVideoFiles: [],
            // Video preview
            showVideoPreview: false,
            previewFile: null,
            previewFileIndex: null,
            videoLoading: false,
            hlsInstance: null,
            blobUrls: {}, // Store blob URLs for transcoded files
            fileMetadata: {}, // Store metadata for auxiliary file filtering
        };
    },
    computed: {
        displayRequiredBroca() {
            // Calculate the BROCA needed, with a minimum of 100 for the button display/contract build amount
            return Math.max(100, this.requiredBroca);
        },
        totalFileCount() {
            // Count main files + auxiliary files
            const mainFileCount = this.droppedFiles.length;
            const auxiliaryFileCount = this.structuredFilesForUpload.filter(item => 
                item.metadata?.isAuxiliary
            ).length;
            return mainFileCount + auxiliaryFileCount;
        }
    },
    watch: {
        ...Watchers,
        saccountapi: {
            immediate: true,
            deep: true, // Watch nested properties like channels
            handler(thenew) {
                if (thenew && thenew.channels) { // Ensure channels exist
                    this.pickContract('watcher')
                }
            }
        },
        externalDrop: { // Added: Watcher for the new externalDrop prop
            handler(newDrop) {
                if (newDrop && newDrop.files && newDrop.files.length > 0) {
                    debugLogger.debug('externalDrop watcher triggered, accumulating files:', newDrop);
                    
                    // Store metadata if provided
                    if (newDrop.metadata) {
                        if (!this.fileMetadata) {
                            this.fileMetadata = {};
                        }
                        Object.assign(this.fileMetadata, newDrop.metadata);
                        debugLogger.debug('upload-everywhere: Received metadata from external drop:', newDrop.metadata);
                        debugLogger.debug('upload-everywhere: File names in drop:', newDrop.files.map(f => f.name || 'unknown'));
                        debugLogger.debug('upload-everywhere: Metadata keys:', Object.keys(newDrop.metadata));
                    } else {
                        debugLogger.debug('upload-everywhere: No metadata in external drop');
                    }
                    
                    // Process HLS files to recreate blob URLs
                    const allFiles = newDrop.files.map(item => {
                        if (item instanceof File) {
                            return item;
                        } else if (item && typeof item === 'object' && item.file) {
                            return item.file;
                        }
                        return null;
                    }).filter(Boolean);
                    
                    // Debug: Check if any m3u8 files already contain IPFS URLs
                    for (const file of allFiles) {
                        if (file.name.endsWith('.m3u8')) {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                                const content = e.target.result;
                                // Note: IPFS URLs in HLS files are expected and required for IPFS compatibility
                                // These are added during transcoding to ensure playback works on IPFS
                                // if (content.includes('ipfs.dlux.io') || content.includes('ipfs://')) {
                                //     debugLogger.error(`ERROR: ${file.name} contains IPFS URLs in externalDrop!`);
                                //     debugLogger.error(`File content preview:`, content.substring(0, 200));
                                // }
                            };
                            reader.readAsText(file);
                        }
                    }
                    
                    // Check if this is an HLS file set
                    const hasM3u8 = allFiles.some(f => f.name.endsWith('.m3u8'));
                    const hasSegments = allFiles.some(f => f.name.endsWith('.ts'));
                    
                    if (hasM3u8 && hasSegments) {
                        debugLogger.debug('Detected HLS file set in external drop');
                        
                        // Check if blob URLs already exist (from video-transcoder)
                        const hasBlobUrls = newDrop.blobUrls && Object.keys(newDrop.blobUrls).length > 0;
                        
                        if (hasBlobUrls) {
                            debugLogger.debug('Using existing blob URLs from transcoder');
                            // Store the blob URLs from transcoder
                            this.blobUrls = { ...this.blobUrls, ...newDrop.blobUrls };
                            
                            // Attach blob URLs to files for preview
                            allFiles.forEach(file => {
                                if (this.blobUrls[file.name]) {
                                    file._blobUrl = this.blobUrls[file.name];
                                }
                            });
                        } else {
                            debugLogger.debug('No blob URLs found, creating them');
                            // Process in next tick to ensure proper file handling
                            this.$nextTick(async () => {
                                await this.createBlobUrls(allFiles);
                                
                                // Attach blob URLs and related URLs to files
                                allFiles.forEach(file => {
                                    if (this.blobUrls[file.name]) {
                                        file._blobUrl = this.blobUrls[file.name];
                                        
                                        // For master playlists, attach all related blob URLs
                                        if (file.name.endsWith('_master.m3u8') || file.name.endsWith('.m3u8')) {
                                            file._relatedBlobUrls = { ...this.blobUrls };
                                            debugLogger.debug(`Attached ${Object.keys(this.blobUrls).length} blob URLs to master playlist`);
                                        }
                                    }
                                });
                            });
                        }
                    }
                    
                    // Filter files based on metadata
                    const filesToShow = newDrop.files.filter(file => {
                        const metadata = newDrop.metadata?.[file.name];
                        return !metadata?.isAuxiliary; // Show only non-auxiliary files
                    });
                    
                    // Extract just the File objects for addFiles UI update
                    // Handle both raw File objects and wrapper objects with .file property
                    const fileObjects = filesToShow.map(item => {
                        return item instanceof File ? item : (item.file || item);
                    }); 
                    this.addFiles(fileObjects); // Add only main files to the UI list

                    // Ensure all files are properly structured before adding (including auxiliary)
                    const structuredDropFiles = newDrop.files.map(item => {
                        // Get the file name correctly
                        let fileName;
                        let fileObj;
                        
                        if (item instanceof File) {
                            fileName = item.name;
                            fileObj = item;
                        } else if (item && typeof item === 'object' && item.file) {
                            fileName = item.file.name;
                            fileObj = item.file;
                        } else {
                            debugLogger.error('Unknown file structure:', item);
                            return null;
                        }
                        
                        const metadata = newDrop.metadata?.[fileName] || {};
                        
                        debugLogger.debug(`upload-everywhere: Structuring file ${fileName} with metadata:`, metadata);
                        
                        // If it's already a structured object, merge with metadata
                        if (item && typeof item === 'object' && item.file) {
                            return {
                                ...item,
                                metadata: metadata
                            };
                        }
                        // If it's a raw File, wrap it with metadata
                        return {
                            file: fileObj,
                            targetPath: null,
                            fullAppPath: null,
                            metadata: metadata
                        };
                    }).filter(Boolean); // Remove any null entries
                    
                    // Append ALL files (including auxiliary) to the upload list
                    this.structuredFilesForUpload = [...this.structuredFilesForUpload, ...structuredDropFiles]; 
                    debugLogger.debug('Accumulated structuredFilesForUpload:', this.structuredFilesForUpload);

                    // Recalculate sizes after adding files (including auxiliary)
                    this.calculateFileSizes();

                    // Clear the prop in the parent immediately after processing
                    this.$emit('update:externalDrop', { files: [], targetPath: null });
                }
            },
            deep: true
        }
    },
    methods: {
        ...MCommon,
        
        // File property getters - handle both raw File objects and wrapper objects
        getFileName(file) {
            if (!file) return 'Unknown';
            return file.name || file.fileName || file.file?.name || 'Unknown';
        },
        
        getFileSize(file) {
            if (!file) return 0;
            return file.size || file.fileSize || file.file?.size || 0;
        },
        
        getFileObject(file) {
            return file.file || file; // Return inner file object or the file itself
        },
        
        // Video preview methods
        isStreamableVideo(file) {
            const fileName = this.getFileName(file);
            // Only m3u8 files are actually streamable (HLS format)
            return fileName.toLowerCase().endsWith('.m3u8');
        },
        
        getFileIcon(file) {
            const fileName = this.getFileName(file);
            if (this.isStreamableVideo(file)) {
                return 'fa-solid fa-video text-primary';
            } else if (fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|svg)$/)) {
                return 'fa-solid fa-image text-info';
            } else if (fileName.toLowerCase().match(/\.(mp3|wav|ogg|m4a)$/)) {
                return 'fa-solid fa-music text-warning';
            } else if (fileName.toLowerCase().match(/\.(pdf|doc|docx|txt)$/)) {
                return 'fa-solid fa-file-text text-secondary';
            } else {
                return 'fa-solid fa-file text-muted';
            }
        },
        
        previewVideo(file, index) {
            // Store the actual File object for preview
            this.previewFile = this.getFileObject(file);
            this.previewFileIndex = index;
            this.showVideoPreview = true;
            this.videoLoading = true;
            
            this.$nextTick(() => {
                this.initializeVideoPlayer();
            });
        },
        
        closeVideoPreview() {
            this.showVideoPreview = false;
            this.cleanupVideoPlayer();
            
            // Clean up preview blob URL if it was created just for preview
            if (this.previewFile && this.previewFile.src && this.previewFile.src.startsWith('blob:')) {
                // Only revoke if it's not in our main blobUrls storage
                const fileName = this.getFileName(this.previewFile);
                if (!this.blobUrls[fileName] || this.blobUrls[fileName] !== this.previewFile.src) {
                    URL.revokeObjectURL(this.previewFile.src);
                    debugLogger.debug(`Cleaned up preview blob URL for ${fileName}`);
                }
            }
            
            this.previewFile = null;
            this.previewFileIndex = null;
        },
        
        initializeVideoPlayer() {
            const video = this.$refs.videoPlayer;
            if (!video || !this.previewFile) return;
            
            this.videoLoading = true;
            
            // For m3u8 files, use processed blob URL if available
            let fileUrl;
            if (this.previewFile.name.endsWith('.m3u8')) {
                // Check for attached blob URL first (from transcoding)
                if (this.previewFile._blobUrl) {
                    fileUrl = this.previewFile._blobUrl;
                    debugLogger.debug('Using attached blob URL from transcoding for preview');
                } else if (this.blobUrls[this.previewFile.name]) {
                    // Fallback to component's blob URLs
                    fileUrl = this.blobUrls[this.previewFile.name];
                    debugLogger.debug('Using component blob URL for preview');
                } else {
                    // Create object URL for the file
                    fileUrl = URL.createObjectURL(this.previewFile);
                    debugLogger.debug('Creating new blob URL for preview');
                }
            } else {
                // Create object URL for non-m3u8 files
                fileUrl = URL.createObjectURL(this.previewFile);
            }
            
            // For m3u8 files, check if HLS.js is available
            if (this.previewFile.name.endsWith('.m3u8') && typeof Hls !== 'undefined' && Hls.isSupported()) {
                // Use HLS.js for m3u8 files
                if (this.hlsInstance) {
                    this.hlsInstance.destroy();
                }
                
                // If we have related blob URLs, we need a custom loader
                const hasRelatedBlobUrls = this.previewFile._relatedBlobUrls && Object.keys(this.previewFile._relatedBlobUrls).length > 0;
                
                let hlsConfig = {
                    debug: false,
                    enableWorker: true,
                    startPosition: 0.1,    // Skip first 0.1s to avoid buffer hole
                    backBufferLength: 0,   // Don't retain old buffer
                    maxBufferHole: 0.5     // Tolerate small gaps
                };
                
                // Add custom loader if we have related blob URLs
                if (hasRelatedBlobUrls) {
                    hlsConfig.loader = this.createCustomHlsLoader(this.previewFile._relatedBlobUrls);
                }
                
                this.hlsInstance = new Hls(hlsConfig);
                
                this.hlsInstance.loadSource(fileUrl);
                this.hlsInstance.attachMedia(video);
                
                this.hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
                    this.videoLoading = false;
                    video.play().catch(e => debugLogger.debug('Autoplay prevented:', e));
                });
                
                this.hlsInstance.on(Hls.Events.ERROR, (event, data) => {
                    if (data.fatal) {
                        debugLogger.error('HLS error:', data);
                        this.videoLoading = false;
                    } else if (data.details !== 'bufferSeekOverHole' && data.details !== 'bufferNudgeOnHole') {
                        // Log other non-fatal errors except common buffer holes
                        debugLogger.debug('HLS warning:', data.details);
                    }
                });
            } else {
                // Use native video for other formats
                video.src = fileUrl;
                video.load();
                video.addEventListener('canplay', () => {
                    this.videoLoading = false;
                    video.play().catch(e => debugLogger.debug('Autoplay prevented:', e));
                }, { once: true });
            }
        },
        
        onVideoLoaded() {
            this.videoLoading = false;
        },
        
        cleanupVideoPlayer() {
            if (this.hlsInstance) {
                this.hlsInstance.destroy();
                this.hlsInstance = null;
            }
            
            const video = this.$refs.videoPlayer;
            if (video && video.pause) {  // Add check for pause method
                video.pause();
                if (video.src && video.src.startsWith('blob:')) {
                    URL.revokeObjectURL(video.src);
                }
                video.src = '';
                video.load();
            }
        },
        
        createCustomHlsLoader(relatedBlobUrls) {
            // Create a custom loader that can handle blob URLs for related files
            const self = this;
            
            return class CustomLoader extends Hls.DefaultConfig.loader {
                load(context, config, callbacks) {
                    const url = context.url;
                    
                    // If this is a blob URL, use default loader
                    if (url.startsWith('blob:')) {
                        super.load(context, config, callbacks);
                        return;
                    }
                    
                    // Check if this is a relative reference that we have a blob URL for
                    const fileName = url.split('/').pop(); // Get just the filename
                    if (relatedBlobUrls[fileName]) {
                        // Replace the URL with our blob URL
                        context.url = relatedBlobUrls[fileName];
                        debugLogger.debug(`CustomLoader: Redirecting ${fileName} to blob URL`);
                        super.load(context, config, callbacks);
                    } else {
                        // Try default behavior
                        super.load(context, config, callbacks);
                    }
                }
            };
        },
        
        // Blob URL processing for transcoded files (copied from video-transcoder.js)
        async createBlobUrls(files) {
            debugLogger.info('⚠️ Creating blob URLs for preview only - original files will not be modified');
            
            // First, create blob URLs for all segment files
            const m3u8Files = [];
            const masterPlaylist = files.find(f => f.name.endsWith('_master.m3u8') || f.name === 'master.m3u8');
            
            for (const file of files) {
                if (file.name.endsWith('.ts')) {
                    // Create blob URL for segment
                    const url = URL.createObjectURL(file);
                    this.blobUrls[file.name] = url;
                    debugLogger.debug(`📎 Created blob URL for segment: ${file.name}`);
                } else if (file.name.endsWith('.m3u8')) {
                    // Store m3u8 files for processing later
                    m3u8Files.push(file);
                }
            }
            
            // Sort m3u8 files to process resolution playlists before master
            // Master playlist is the one without resolution indicators (480p, 720p, 1080p)
            m3u8Files.sort((a, b) => {
                const aHasResolution = /\d{3,4}p/.test(a.name);
                const bHasResolution = /\d{3,4}p/.test(b.name);
                // Process files with resolution first
                if (!aHasResolution && bHasResolution) return 1;
                if (aHasResolution && !bHasResolution) return -1;
                return 0;
            });
            
            // Process resolution playlists first (they reference segments)
            for (const m3u8File of m3u8Files) {
                if (/\d{3,4}p/.test(m3u8File.name)) { // Has resolution indicator
                    try {
                        // Update the m3u8 content with segment blob URLs
                        const updatedBlob = await this.updateM3u8WithBlobUrls(m3u8File);
                        const updatedUrl = URL.createObjectURL(updatedBlob);
                        
                        // Store the updated blob URL
                        this.blobUrls[m3u8File.name] = updatedUrl;
                        
                        // IMPORTANT: We do NOT replace the original file
                        // The blob URL is only for preview, not for upload
                        debugLogger.debug(`📎 Created preview blob URL for playlist: ${m3u8File.name}`);
                        debugLogger.debug(`✅ Original file remains unchanged for upload`);
                    } catch (error) {
                        debugLogger.error(`Error processing m3u8 file ${m3u8File.name}:`, error);
                    }
                }
            }
            
            // Now process master playlist (it references resolution playlists)
            const master = m3u8Files.find(f => !/\d{3,4}p/.test(f.name)); // Master is the one without resolution
            if (master) {
                try {
                    // Update the master playlist with resolution playlist blob URLs
                    const updatedBlob = await this.updateM3u8WithBlobUrls(master);
                    const updatedUrl = URL.createObjectURL(updatedBlob);
                    
                    // Store the updated blob URL
                    this.blobUrls[master.name] = updatedUrl;
                    
                    // IMPORTANT: We do NOT replace the original file
                    // The blob URL is only for preview, not for upload
                    debugLogger.debug(`📎 Created preview blob URL for master playlist: ${master.name}`);
                    debugLogger.debug(`✅ Original file remains unchanged for upload`);
                } catch (error) {
                    debugLogger.error(`Error processing master m3u8 file ${master.name}:`, error);
                }
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
                let referenceName = line.trim();
                
                // Skip if this is already a blob URL or IPFS URL
                if (referenceName.startsWith('blob:') || 
                    referenceName.includes('ipfs.dlux.io') || 
                    referenceName.startsWith('ipfs://') ||
                    referenceName.includes('/ipfs/')) {
                    debugLogger.debug(`Skipping already processed URL in m3u8: ${referenceName}`);
                    return line;
                }
                
                // Remove session prefix if present (e.g., "SESSION_ID__" or "../")
                if (referenceName.includes('__')) {
                    referenceName = referenceName.split('__').pop();
                }
                if (referenceName.startsWith('../')) {
                    referenceName = referenceName.replace('../', '');
                }
                
                const blobUrl = this.blobUrls[referenceName];
                
                if (blobUrl) {
                    debugLogger.debug(`Replaced reference ${referenceName} with blob URL`);
                    return blobUrl;
                }
                
                debugLogger.debug('No blob URL found for reference:', referenceName);
                return line;
            });
            
            const updatedContent = updatedLines.join('\n');
            
            // Create a new blob for the updated m3u8
            const blob = new Blob([updatedContent], { type: 'application/x-mpegURL' });
            return blob;
        },
        
        async processTranscodedFiles(files) {
            // Check if we have transcoded files (m3u8 + segments)
            const hasM3u8 = files.some(file => this.getFileName(file).endsWith('.m3u8'));
            const hasSegments = files.some(file => this.getFileName(file).endsWith('.ts'));
            
            if (hasM3u8 && hasSegments) {
                debugLogger.debug('Processing transcoded files for blob URLs');
                try {
                    // Extract actual File objects for blob URL processing
                    const fileObjects = files.map(file => this.getFileObject(file));
                    await this.createBlobUrls(fileObjects);
                    debugLogger.debug('Blob URLs created for transcoded files');
                } catch (error) {
                    debugLogger.error('Error processing transcoded files:', error);
                }
            }
        },
        
        // Deletion protection for segment files
        canDeleteFile(file, index) {
            // If this is a .ts segment file, check if its m3u8 playlist exists
            const fileName = this.getFileName(file);
            if (fileName.endsWith('.ts')) {
                const m3u8Exists = this.droppedFiles.some(f => this.getFileName(f).endsWith('.m3u8'));
                if (m3u8Exists) {
                    return false; // Cannot delete segment if playlist exists
                }
            }
            return true; // Can delete all other files
        },
        
        getDeleteTooltip(file, index) {
            if (!this.canDeleteFile(file, index)) {
                return 'Cannot delete segment file - required by video playlist';
            }
            return 'Remove file';
        },
        
        addFiles(files) {
            // Filter out potential duplicates if necessary, based on name and size
            const newFilesToAdd = files.filter(newFile => {
                const newFileName = this.getFileName(newFile);
                const newFileSize = this.getFileSize(newFile);
                return !this.droppedFiles.some(existingFile => 
                    this.getFileName(existingFile) === newFileName && 
                    this.getFileSize(existingFile) === newFileSize
                );
            }
            );
            
            if (newFilesToAdd.length === 0) return;
            
            // If video handling is external, skip video separation
            if (this.videoHandlingMode === 'external') {
                // Add all files without video separation
                this.droppedFiles = [...this.droppedFiles, ...newFilesToAdd];
                
                // Structure the files for upload
                const structuredFiles = newFilesToAdd.map(file => ({
                    file: file,
                    targetPath: null // or set a default path if needed
                }));
                
                // Add to structured files array
                this.structuredFilesForUpload = [...this.structuredFilesForUpload, ...structuredFiles];
                
                this.calculateFileSizes();
                this.showContractButton = true; // Show button whenever files are added
                this.pickContract('addFiles'); // Re-evaluate contract after adding files
                
                // Process transcoded files for blob URL creation only if they don't already have blob URLs
                const needsBlobUrls = newFilesToAdd.some(file => 
                    file.name.endsWith('.m3u8') && !file._blobUrl
                );
                if (needsBlobUrls) {
                    this.processTranscodedFiles(newFilesToAdd);
                }
                return;
            }
            
            // Internal video handling - separate video files from other files
            const videoFiles = [];
            const otherFiles = [];
            
            newFilesToAdd.forEach(file => {
                const fileName = this.getFileName(file);
                if (this.isVideoFile(fileName)) {
                    videoFiles.push(file);
                } else {
                    otherFiles.push(file);
                }
            });
            
            // Handle non-video files immediately
            if (otherFiles.length > 0) {
                this.droppedFiles = [...this.droppedFiles, ...otherFiles];
                
                // Structure the files for upload
                const structuredFiles = otherFiles.map(file => ({
                    file: file,
                    targetPath: null // or set a default path if needed
                }));
                
                // Add to structured files array
                this.structuredFilesForUpload = [...this.structuredFilesForUpload, ...structuredFiles];
                
                this.calculateFileSizes();
                this.showContractButton = true; // Show button whenever files are added
                this.pickContract('addFiles'); // Re-evaluate contract after adding files
                
                // Process transcoded files for blob URL creation only if they don't already have blob URLs
                const needsBlobUrls = otherFiles.some(file => 
                    file.name.endsWith('.m3u8') && !file._blobUrl
                );
                if (needsBlobUrls) {
                    this.processTranscodedFiles(otherFiles);
                }
            }
            
            // Queue video files for transcoding (only in internal mode)
            if (videoFiles.length > 0) {
                this.pendingVideoFiles = [...this.pendingVideoFiles, ...videoFiles];
                this.processNextVideoFile();
            }
        },
        
        isVideoFile(fileName) {
            if (!fileName) return false;
            const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv', '.mpg', '.mpeg', '.3gp', '.ogv'];
            return videoExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
        },
        
        processNextVideoFile() {
            if (this.pendingVideoFiles.length === 0) {
                // All video files processed
                return;
            }
            
            const videoFile = this.pendingVideoFiles[0];
            this.videoToTranscode = {
                file: videoFile,
                fileName: videoFile.name,
                fileSize: videoFile.size
            };
            this.showVideoTranscoder = true;
        },
        
        handleTranscodeComplete(result) {
            // Remove the processed video from queue
            this.pendingVideoFiles.shift();
            
            // Store blob URLs if provided
            if (result.blobUrls) {
                this.blobUrls = { ...this.blobUrls, ...result.blobUrls };
                debugLogger.debug('📹 Stored blob URLs from transcoder:', Object.keys(result.blobUrls));
            }
            
            // Add the transcoded files to upload queue
            const filesToAdd = result.files || [];
            
            if (filesToAdd.length > 0) {
                debugLogger.debug(`📥 Received ${filesToAdd.length} files from transcoder:`);
                filesToAdd.forEach((f, index) => {
                    const fileName = f.name || (f.getFile && f.getFile().name);
                    const metadata = f.getMetadata ? f.getMetadata() : null;
                    debugLogger.debug(`  ${index + 1}. ${fileName} - Role: ${metadata?.role || 'none'}, Auxiliary: ${metadata?.isAuxiliary || false}, Size: ${(f.getFile ? f.getFile().size : f.size) || 'unknown'} bytes`);
                });
                
                // Extract raw files from ProcessedFile wrappers while preserving metadata
                const rawFiles = filesToAdd.map(f => {
                    const rawFile = f.getFile ? f.getFile() : f;
                    
                    // Preserve ProcessedFile metadata as custom properties on raw File
                    if (f.getFile && f.getMetadata) {
                        const metadata = f.getMetadata();
                        rawFile._isAuxiliary = metadata.isAuxiliary;
                        rawFile._role = metadata.role;
                        rawFile._parentFile = metadata.parentFile;
                        rawFile._processorId = metadata.processorId;
                        
                        debugLogger.debug(`Preserved metadata for ${rawFile.name}:`, {
                            isAuxiliary: rawFile._isAuxiliary,
                            role: rawFile._role,
                            parentFile: rawFile._parentFile
                        });
                    }
                    
                    // Attach blob URL if available
                    if (result.blobUrls && result.blobUrls[rawFile.name]) {
                        rawFile._blobUrl = result.blobUrls[rawFile.name];
                        debugLogger.debug(`Attached blob URL to ${rawFile.name}`);
                    }
                    
                    return rawFile;
                });
                
                // Only add non-auxiliary files to droppedFiles (for UI display)
                const mainFiles = rawFiles.filter(file => !file._isAuxiliary);
                const auxiliaryFiles = rawFiles.filter(file => file._isAuxiliary);
                
                debugLogger.debug(`📂 Separating files: ${mainFiles.length} main files, ${auxiliaryFiles.length} auxiliary files`);
                this.droppedFiles = [...this.droppedFiles, ...mainFiles];
                
                // Store all blob URLs for related files (including auxiliary)
                if (result.blobUrls) {
                    // For each main file, store blob URLs for it and its related auxiliary files
                    mainFiles.forEach(mainFile => {
                        const relatedBlobUrls = {};
                        
                        // Add the main file's blob URL
                        if (result.blobUrls[mainFile.name]) {
                            relatedBlobUrls[mainFile.name] = result.blobUrls[mainFile.name];
                        }
                        
                        // Add blob URLs for auxiliary files related to this main file
                        auxiliaryFiles.forEach(auxFile => {
                            if (auxFile._parentFile === mainFile.name && result.blobUrls[auxFile.name]) {
                                relatedBlobUrls[auxFile.name] = result.blobUrls[auxFile.name];
                            }
                        });
                        
                        // Store the related blob URLs on the main file
                        mainFile._relatedBlobUrls = relatedBlobUrls;
                        debugLogger.debug(`Stored ${Object.keys(relatedBlobUrls).length} related blob URLs for ${mainFile.name}`);
                    });
                }
                
                // Structure the files for upload using the rawFiles that have metadata attached
                const structuredFiles = rawFiles.map(rawFile => {
                    // Extract metadata that was attached to the raw file
                    const metadata = {
                        isAuxiliary: rawFile._isAuxiliary || false,
                        role: rawFile._role || '',
                        parentFile: rawFile._parentFile || null,
                        processorId: rawFile._processorId || null
                    };
                    
                    debugLogger.debug(`Creating structured file for ${rawFile.name} with metadata:`, metadata);
                    
                    return {
                        file: rawFile,
                        targetPath: null,
                        isStreamable: rawFile.name.endsWith('.m3u8'), // Mark m3u8 files
                        metadata: metadata
                    };
                });
                
                // Add to structured files array
                this.structuredFilesForUpload = [...this.structuredFilesForUpload, ...structuredFiles];
                debugLogger.debug('Structured files created with metadata:', structuredFiles.map(sf => ({
                    name: sf.file.name,
                    metadata: sf.metadata
                })));
                
                this.calculateFileSizes();
                this.showContractButton = true;
                this.pickContract('video transcoding complete');
            }
            
            // Close transcoder and process next video
            this.closeVideoTranscoder();
            this.processNextVideoFile();
        },
        
        skipVideoTranscoding() {
            // User chose to skip transcoding, add original file
            const videoFile = this.pendingVideoFiles.shift();
            
            this.droppedFiles = [...this.droppedFiles, videoFile];
            
            // Structure the file for upload - ensure it's not a raw File
            const structuredFile = videoFile instanceof File ? {
                file: videoFile,
                targetPath: null,
                fullAppPath: null
            } : videoFile;
            
            this.structuredFilesForUpload = [...this.structuredFilesForUpload, structuredFile];
            
            this.calculateFileSizes();
            this.showContractButton = true;
            this.pickContract('video skip');
            
            // Close transcoder and process next video
            this.closeVideoTranscoder();
            this.processNextVideoFile();
        },
        
        closeVideoTranscoder() {
            this.showVideoTranscoder = false;
            this.videoToTranscode = null;
        },
        
        handleTranscodeError(error) {
            console.error('Video transcoding error:', error);
            alert('Video transcoding failed: ' + (error.message || 'Unknown error'));
            this.skipVideoTranscoding();
        },
        handleDrop(event) {
            event.preventDefault();
            const files = Array.from(event.dataTransfer.files);
            this.addFiles(files);
        },
        triggerFileInput() {
            this.$refs.fileInput.click();
        },
        handleFileSelect(event) {
            const files = Array.from(event.target.files);
            this.addFiles(files);
            // Reset file input value to allow selecting the same file again
            event.target.value = null;
        },
        pickContract(info) {
            // Reset contract state before picking
            this.selectedContract = null;
            this.contractSize = 0;
            this.contractBuilt = false; // Reset contract built status

            if (!this.saccountapi || !this.saccountapi.channels || this.requiredBroca <= 0) {
                debugLogger.debug(`pickContract(${info}): Skipping, no channels or no required Broca (${this.requiredBroca})`);
                this.loading = false; // Ensure loading is off if we skip early
                return;
            }
            debugLogger.debug(`pickContract(${info}): Looking for contract >= ${this.requiredBroca} BROCA`);

            // We use requiredBroca (actual need) for finding the contract,
            // displayRequiredBroca (min 100) is for the build button amount.
            const actualNeed = this.requiredBroca;
            let foundContract = null;
            let foundContractSize = 0;

            // Find the smallest contract that fits the requirement
            for (const node in this.saccountapi.channels) {
                for (const type in this.saccountapi.channels[node]) {
                    const channel = this.saccountapi.channels[node][type];
                    if (channel.r >= actualNeed) {
                        if (!foundContract || channel.r < foundContractSize) {
                            foundContract = channel;
                            foundContractSize = channel.a;
                        }
                    }
                }
            }

            if (foundContract) {
                debugLogger.debug(`pickContract(${info}): Found suitable contract`, foundContract);
                this.selectedContract = foundContract;
                this.contractSize = foundContractSize;
                // Set contractBuilt to true meaning a contract is *selected*,
                // the Continue button logic checks if it's sufficient (requiredBroca <= contractSize)
                this.contractBuilt = true;
                this.loading = false; // Contract found (or determined no suitable one exists), stop loading
            } else {
                debugLogger.debug(`pickContract(${info}): No suitable contract found.`);
                 this.contractBuilt = false; // Explicitly ensure it's false if no contract found
                 this.loading = false; // Stop loading
            }
        },
        removeFile(index) {
            // ... (keep existing logic for removing from droppedFiles and structuredFilesForUpload) ...
            const fileToRemove = this.droppedFiles[index];
            if (!fileToRemove) return;
            
            // Clean up blob URLs for the removed file
            const fileName = this.getFileName(fileToRemove);
            if (this.blobUrls[fileName]) {
                URL.revokeObjectURL(this.blobUrls[fileName]);
                delete this.blobUrls[fileName];
                debugLogger.debug(`Cleaned up blob URL for ${fileName}`);
            }
            
            // Clean up related blob URLs if this is a file with related URLs
            if (fileToRemove._relatedBlobUrls) {
                Object.entries(fileToRemove._relatedBlobUrls).forEach(([name, url]) => {
                    URL.revokeObjectURL(url);
                    delete this.blobUrls[name];
                    debugLogger.debug(`Cleaned up related blob URL for ${name}`);
                });
            }

            this.droppedFiles.splice(index, 1);

            const structuredIndex = this.structuredFilesForUpload.findIndex(sf => {
                // Handle both raw File objects and wrapper objects
                const file = sf instanceof File ? sf : (sf.file || sf);
                return file && file.name === fileToRemove.name && file.size === fileToRemove.size;
            });
            if (structuredIndex > -1) {
                this.structuredFilesForUpload.splice(structuredIndex, 1);
                debugLogger.debug('Removed corresponding structured file:', fileToRemove.name);
            } else {
                 debugLogger.debug('Could not find corresponding structured file to remove:', fileToRemove.name);
            }

            if (this.droppedFiles.length === 0) {
                this.resetComponent(); // Reset everything if no files left
            } else {
                this.calculateFileSizes(); // Recalculate sizes first
                this.pickContract('removeFile'); // Then re-evaluate contract
            }
        },
        calculateFileSizes() {
            // Calculate total size including ALL files (main + auxiliary)
            let totalSize = 0;
            
            // Include files shown in UI (main files)
            totalSize += this.droppedFiles.reduce((acc, file) => acc + this.getFileSize(file), 0);
            
            // Include auxiliary files from structured upload list
            this.structuredFilesForUpload.forEach(item => {
                const metadata = item.metadata || {};
                if (metadata.isAuxiliary) {
                    const fileSize = this.getFileSize(item.file || item);
                    totalSize += fileSize;
                    debugLogger.debug(`Including auxiliary file ${this.getFileName(item.file || item)} (${fileSize} bytes) in total size`);
                }
            });
            
            this.totalSize = totalSize;
            debugLogger.debug(`Total size calculation: Main files: ${this.droppedFiles.reduce((acc, file) => acc + this.getFileSize(file), 0)} bytes, Auxiliary files: ${totalSize - this.droppedFiles.reduce((acc, file) => acc + this.getFileSize(file), 0)} bytes, Total: ${totalSize} bytes`);
            
            const channelBytes = this.stats.channel_bytes || 1024;
            // Calculate actual required Broca (minimum 0)
            this.requiredBroca = Math.max(0, parseInt((this.totalSize / channelBytes) * 1.5));

            // Show button if files exist, contract logic is handled by v-if and pickContract
            this.showContractButton = this.droppedFiles.length > 0;

            // Reset contract status as requirements changed, let pickContract determine the new status
            this.contractBuilt = false;
            this.selectedContract = null;
            this.contractSize = 0;
            this.showUploadModal = false; // Hide upload modal if file list changes

            // If files exist, attempt to pick a contract immediately after calculation
            if(this.droppedFiles.length > 0) {
                this.pickContract('calculateFileSizes');
            }
        },
        sendIt(event) {
            // Check if the event signifies starting the contract build process
            if (event?.op === 'custom_json' && event?.id === this.protocol?.prefix + 'channel_open') {
                 this.loading = true; // Show loading specifically when initiating contract build
                 // contractBuilt status will be updated by the watcher when the channel appears
            }
            this.$emit('tosign', event);
        },
        startUpload() {
            debugLogger.debug('startUpload called. Current showUploadModal:', this.showUploadModal);
            this.showUploadModal = true;
            this.$nextTick(() => {
              debugLogger.debug('startUpload finished. New showUploadModal:', this.showUploadModal, 'DOM updated.');
            });
        },
        closeUploadModal() {
            debugLogger.debug('closeUploadModal called.');
            this.showUploadModal = false;
        },
        handleUploadDone(payload) {
            this.$emit('done', payload); // Pass the payload from uploadvue-dd.js to the parent
            this.closeUploadModal(); // Use the new close method
            this.resetComponent(); 
        },
        resetComponent() {
            // Clean up all blob URLs before resetting
            Object.values(this.blobUrls).forEach(url => {
                URL.revokeObjectURL(url);
            });
            this.blobUrls = {};
            debugLogger.debug('Cleaned up all blob URLs in resetComponent');
            
            // Clean up video preview if active
            if (this.showVideoPreview) {
                this.cleanupVideoPlayer();
                this.showVideoPreview = false;
            }
            
            this.droppedFiles = [];
            this.totalSize = 0;
            this.requiredBroca = 0;
            this.showContractButton = false;
            this.contractBuilt = false;
            this.selectedContract = null;
            this.contractSize = 0; 
            this.loading = false;
            this.structuredFilesForUpload = []; 
            this.showUploadModal = false; // Ensure upload modal is hidden on reset
            this.pendingVideoFiles = []; // Clear pending video queue
            this.showVideoTranscoder = false;
            this.videoToTranscode = null;
            this.previewFile = null;
            this.previewFileIndex = null;
            
            if (this.$refs.fileInput) {
                this.$refs.fileInput.value = null;
            }
        },
    },
    mounted(){
        // Initial check for contracts based on potentially pre-existing state or props
        if (this.droppedFiles.length > 0) {
            this.calculateFileSizes(); // This now also calls pickContract if files exist
        } else {
            this.pickContract('mounted'); // Check for existing contracts even if no files initially
        }
    },
    beforeUnmount() {
        // Clean up video player resources
        this.cleanupVideoPlayer();
        
        // Clean up all blob URLs
        Object.values(this.blobUrls).forEach(url => {
            URL.revokeObjectURL(url);
        });
        this.blobUrls = {};
    },
    emits: ['tosign', 'done', 'update:externalDrop'], // Removed targetPath from done payload
};