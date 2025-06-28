// Lightweight SPK Drop Component
// Minimal drop-anywhere component for remix apps with video transcoding support

import VideoChoiceModal from './video-choice-modal.js';

export default {
    name: 'SPKDropLite',
    components: {
        'video-choice-modal': VideoChoiceModal
    },
    template: `
    <div class="spk-drop-lite" 
         @drop="handleDrop" 
         @dragover.prevent="isDragging = true" 
         @dragleave="isDragging = false"
         :class="{ 'dragging': isDragging }">
         
        <!-- Drop indicator overlay -->
        <div v-if="isDragging" class="drop-overlay">
            <div class="drop-message">
                <i class="fa-solid fa-cloud-upload-alt fa-3x mb-3"></i>
                <p>Drop files here to upload to SPK Network</p>
            </div>
        </div>
        
        <!-- Processing indicator -->
        <div v-if="processing" class="processing-overlay">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Processing...</span>
            </div>
            <p class="mt-2">{{ processingMessage }}</p>
        </div>
        
        <!-- Default slot for child content -->
        <slot></slot>
        
        <!-- Video Choice Modal -->
        <video-choice-modal
            :show="showVideoTranscoder"
            :file-name="videoToTranscode?.fileName || ''"
            :file-size="videoToTranscode?.fileSize || 0"
            @choice="handleVideoChoice"
            @cancel="closeVideoTranscoder"
        />
    </div>
    `,
    props: {
        // Account info
        account: {
            type: String,
            required: true
        },
        // SPK account API object
        saccountapi: {
            type: Object,
            required: true
        },
        // Auto-transcode videos without prompting
        autoTranscode: {
            type: Boolean,
            default: false
        },
        // Custom file filter
        acceptedTypes: {
            type: Array,
            default: () => []
        },
        // Emit events to parent instead of handling internally
        eventOnly: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            isDragging: false,
            processing: false,
            processingMessage: '',
            videoQueue: [],
            showVideoTranscoder: false,
            videoToTranscode: null
        }
    },
    methods: {
        handleDrop(event) {
            event.preventDefault();
            event.stopPropagation();
            this.isDragging = false;
            
            const items = event.dataTransfer.items;
            if (!items || items.length === 0) return;
            
            this.processDroppedItems(items);
        },
        
        async processDroppedItems(items) {
            const files = [];
            
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.kind === 'file') {
                    const file = item.getAsFile();
                    if (file && this.isAcceptedFile(file)) {
                        files.push(file);
                    }
                }
            }
            
            if (files.length === 0) return;
            
            // Separate video files from others
            const videoFiles = [];
            const otherFiles = [];
            
            files.forEach(file => {
                if (this.isVideoFile(file.name)) {
                    videoFiles.push(file);
                } else {
                    otherFiles.push(file);
                }
            });
            
            // Process non-video files immediately
            if (otherFiles.length > 0) {
                if (this.eventOnly) {
                    this.$emit('filesDropped', { 
                        files: otherFiles,
                        type: 'regular'
                    });
                } else {
                    this.uploadFiles(otherFiles);
                }
            }
            
            // Handle video files
            if (videoFiles.length > 0) {
                if (this.autoTranscode) {
                    // Auto-transcode without prompting
                    this.videoQueue = [...videoFiles];
                    this.processNextVideo();
                } else {
                    // Show transcoding modal
                    this.videoQueue = [...videoFiles];
                    this.showTranscodingModal();
                }
            }
        },
        
        isAcceptedFile(file) {
            if (this.acceptedTypes.length === 0) return true;
            
            const ext = '.' + file.name.split('.').pop().toLowerCase();
            return this.acceptedTypes.some(type => {
                // Handle mime types
                if (type.includes('/')) {
                    return file.type === type;
                }
                // Handle extensions
                return type.toLowerCase() === ext;
            });
        },
        
        isVideoFile(fileName) {
            const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv', '.mpg', '.mpeg', '.3gp', '.ogv'];
            return videoExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
        },
        
        showTranscodingModal() {
            if (this.videoQueue.length === 0) return;
            
            const video = this.videoQueue[0];
            this.videoToTranscode = {
                file: video,
                fileName: video.name,
                fileSize: video.size
            };
            this.showVideoTranscoder = true;
        },
        
        processNextVideo() {
            if (this.videoQueue.length === 0) {
                this.processing = false;
                return;
            }
            
            this.showTranscodingModal();
        },
        
        handleVideoChoice(choice) {
            // Get current video
            const video = this.videoQueue.shift();
            
            // Emit choice event with video info
            this.$emit('videoChoice', {
                file: video.file,
                fileName: video.fileName,
                fileSize: video.fileSize,
                choice: choice
            });
            
            // Close modal and process next
            this.closeVideoTranscoder();
            this.processNextVideo();
        },
        
        
        closeVideoTranscoder() {
            this.showVideoTranscoder = false;
            this.videoToTranscode = null;
        },
        
        
        uploadFiles(files) {
            // Emit event for parent to handle upload
            // Parent should integrate with existing SPK upload logic
            this.$emit('upload', { files });
        },
        
        handleGlobalDragOver(e) {
            // Only prevent default if over our component
            if (this.$el.contains(e.target)) {
                e.preventDefault();
            }
        },
        
        handleGlobalDrop(e) {
            // Only handle if dropped on our component
            if (this.$el.contains(e.target)) {
                this.handleDrop(e);
            }
        }
    },
    
    mounted() {
        // Set up global drop handling to cover entire area
        document.addEventListener('dragover', this.handleGlobalDragOver);
        document.addEventListener('drop', this.handleGlobalDrop);
    },
    
    beforeUnmount() {
        // Clean up global listeners
        document.removeEventListener('dragover', this.handleGlobalDragOver);
        document.removeEventListener('drop', this.handleGlobalDrop);
    }
};

// CSS can be added inline or in a separate file
const styles = `
<style>
.spk-drop-lite {
    position: relative;
    min-height: 100px;
}

.spk-drop-lite.dragging {
    outline: 2px dashed #007bff;
    outline-offset: -10px;
}

.drop-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 123, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    pointer-events: none;
}

.drop-message {
    text-align: center;
    color: #007bff;
    font-weight: 500;
}

.processing-overlay {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 2rem;
    border-radius: 0.5rem;
    text-align: center;
    z-index: 9999;
}
</style>
`;