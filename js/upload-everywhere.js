import ModalVue from '/js/modal-manager.js';
import UploadVue from '/js/uploadvue-dd.js';
import VideoTranscoder from '/js/video-transcoder.js';
import MCommon from '/js/methods-common.js';
import Watchers from '/js/watchers-common.js';

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
                <h5>Ready to Upload: {{ droppedFiles.length }} (Total Size: {{ fancyBytes(totalSize) }})</h5>
                <ul class="m-0">
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
        };
    },
    computed: {
        displayRequiredBroca() {
            // Calculate the BROCA needed, with a minimum of 100 for the button display/contract build amount
            return Math.max(100, this.requiredBroca);
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
                    console.log('externalDrop watcher triggered, accumulating files:', newDrop);
                     // Extract just the File objects for addFiles UI update
                    // Handle both raw File objects and wrapper objects with .file property
                    const fileObjects = newDrop.files.map(item => {
                        return item instanceof File ? item : (item.file || item);
                    }); 
                    this.addFiles(fileObjects); // Add the plain File objects to the UI list

                    // Ensure all files are properly structured before adding
                    const structuredDropFiles = newDrop.files.map(item => {
                        // If it's already a structured object, use it as-is
                        if (item && typeof item === 'object' && item.file) {
                            return item;
                        }
                        // If it's a raw File, wrap it
                        return {
                            file: item,
                            targetPath: item.targetPath || null,
                            fullAppPath: item.fullAppPath || null
                        };
                    });
                    
                    // Append the new structured files to the existing list for upload
                    this.structuredFilesForUpload = [...this.structuredFilesForUpload, ...structuredDropFiles]; 
                    console.log('Accumulated structuredFilesForUpload:', this.structuredFilesForUpload);

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
            this.previewFile = null;
            this.previewFileIndex = null;
        },
        
        initializeVideoPlayer() {
            const video = this.$refs.videoPlayer;
            if (!video || !this.previewFile) return;
            
            this.videoLoading = true;
            
            // For m3u8 files, use processed blob URL if available
            let fileUrl;
            if (this.previewFile.name.endsWith('.m3u8') && this.blobUrls[this.previewFile.name]) {
                // Use the processed blob URL with updated segment references
                fileUrl = this.blobUrls[this.previewFile.name];
                console.log('Using processed m3u8 blob URL for preview');
            } else {
                // Create object URL for the file
                fileUrl = URL.createObjectURL(this.previewFile);
            }
            
            // For m3u8 files, check if HLS.js is available
            if (this.previewFile.name.endsWith('.m3u8') && typeof Hls !== 'undefined' && Hls.isSupported()) {
                // Use HLS.js for m3u8 files
                if (this.hlsInstance) {
                    this.hlsInstance.destroy();
                }
                
                this.hlsInstance = new Hls({
                    debug: false,
                    enableWorker: true,
                    startPosition: 0.1,    // Skip first 0.1s to avoid buffer hole
                    backBufferLength: 0,   // Don't retain old buffer
                    maxBufferHole: 0.5     // Tolerate small gaps
                });
                
                this.hlsInstance.loadSource(fileUrl);
                this.hlsInstance.attachMedia(video);
                
                this.hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
                    this.videoLoading = false;
                    video.play().catch(e => console.log('Autoplay prevented:', e));
                });
                
                this.hlsInstance.on(Hls.Events.ERROR, (event, data) => {
                    if (data.fatal) {
                        console.error('HLS error:', data);
                        this.videoLoading = false;
                    } else if (data.details !== 'bufferSeekOverHole' && data.details !== 'bufferNudgeOnHole') {
                        // Log other non-fatal errors except common buffer holes
                        console.warn('HLS warning:', data.details);
                    }
                });
            } else {
                // Use native video for other formats
                video.src = fileUrl;
                video.load();
                video.addEventListener('canplay', () => {
                    this.videoLoading = false;
                    video.play().catch(e => console.log('Autoplay prevented:', e));
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
        
        // Blob URL processing for transcoded files (copied from video-transcoder.js)
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
                    
                    console.log(`Created updated m3u8 blob URL for ${m3u8File.name}`);
                } catch (error) {
                    console.error(`Error processing m3u8 file ${m3u8File.name}:`, error);
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
        
        async processTranscodedFiles(files) {
            // Check if we have transcoded files (m3u8 + segments)
            const hasM3u8 = files.some(file => this.getFileName(file).endsWith('.m3u8'));
            const hasSegments = files.some(file => this.getFileName(file).endsWith('.ts'));
            
            if (hasM3u8 && hasSegments) {
                console.log('Processing transcoded files for blob URLs');
                try {
                    // Extract actual File objects for blob URL processing
                    const fileObjects = files.map(file => this.getFileObject(file));
                    await this.createBlobUrls(fileObjects);
                    console.log('Blob URLs created for transcoded files');
                } catch (error) {
                    console.error('Error processing transcoded files:', error);
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
                
                // Process transcoded files for blob URL creation
                this.processTranscodedFiles(newFilesToAdd);
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
                
                // Process transcoded files for blob URL creation
                this.processTranscodedFiles(otherFiles);
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
            
            // Add the transcoded files to upload queue
            const filesToAdd = result.files || [];
            
            if (filesToAdd.length > 0) {
                this.droppedFiles = [...this.droppedFiles, ...filesToAdd];
                
                // Structure the files for upload
                const structuredFiles = filesToAdd.map(file => ({
                    file: file,
                    targetPath: null,
                    isStreamable: file.name.endsWith('.m3u8') // Mark m3u8 files
                }));
                
                // Add to structured files array
                this.structuredFilesForUpload = [...this.structuredFilesForUpload, ...structuredFiles];
                
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
                console.log(`pickContract(${info}): Skipping, no channels or no required Broca (${this.requiredBroca})`);
                this.loading = false; // Ensure loading is off if we skip early
                return;
            }
            console.log(`pickContract(${info}): Looking for contract >= ${this.requiredBroca} BROCA`);

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
                console.log(`pickContract(${info}): Found suitable contract`, foundContract);
                this.selectedContract = foundContract;
                this.contractSize = foundContractSize;
                // Set contractBuilt to true meaning a contract is *selected*,
                // the Continue button logic checks if it's sufficient (requiredBroca <= contractSize)
                this.contractBuilt = true;
                this.loading = false; // Contract found (or determined no suitable one exists), stop loading
            } else {
                console.log(`pickContract(${info}): No suitable contract found.`);
                 this.contractBuilt = false; // Explicitly ensure it's false if no contract found
                 this.loading = false; // Stop loading
            }
        },
        removeFile(index) {
            // ... (keep existing logic for removing from droppedFiles and structuredFilesForUpload) ...
            const fileToRemove = this.droppedFiles[index];
            if (!fileToRemove) return;

            this.droppedFiles.splice(index, 1);

            const structuredIndex = this.structuredFilesForUpload.findIndex(sf => {
                // Handle both raw File objects and wrapper objects
                const file = sf instanceof File ? sf : (sf.file || sf);
                return file && file.name === fileToRemove.name && file.size === fileToRemove.size;
            });
            if (structuredIndex > -1) {
                this.structuredFilesForUpload.splice(structuredIndex, 1);
                console.log('Removed corresponding structured file:', fileToRemove.name);
            } else {
                 console.warn('Could not find corresponding structured file to remove:', fileToRemove.name);
            }

            if (this.droppedFiles.length === 0) {
                this.resetComponent(); // Reset everything if no files left
            } else {
                this.calculateFileSizes(); // Recalculate sizes first
                this.pickContract('removeFile'); // Then re-evaluate contract
            }
        },
        calculateFileSizes() {
            this.totalSize = this.droppedFiles.reduce((acc, file) => acc + file.size, 0);
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
            console.log('startUpload called. Current showUploadModal:', this.showUploadModal);
            this.showUploadModal = true;
            this.$nextTick(() => {
              console.log('startUpload finished. New showUploadModal:', this.showUploadModal, 'DOM updated.');
            });
        },
        closeUploadModal() {
            console.log('closeUploadModal called.');
            this.showUploadModal = false;
        },
        handleUploadDone(payload) {
            this.$emit('done', payload); // Pass the payload from uploadvue-dd.js to the parent
            this.closeUploadModal(); // Use the new close method
            this.resetComponent(); 
        },
        resetComponent() {
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