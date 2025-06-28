// Video Choice Modal Component
// Simple modal for capturing user's transcoding choice

export default {
    name: 'VideoChoiceModal',
    template: `
    <teleport to="body">
        <div v-if="show" 
             class="modal-overlay d-flex justify-content-center align-items-center"
             @click.self="cancel"
             style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.8); z-index: 1056;">
            
            <div class="modal-content bg-dark text-white rounded shadow-lg p-4" 
                 style="max-width: 500px; width: 90%;">
                
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h4 class="mb-0">
                        <i class="fa-solid fa-video me-2"></i>
                        Video File Detected
                    </h4>
                    <button type="button" class="btn-close btn-close-white" @click="cancel"></button>
                </div>
                
                <p class="text-muted mb-3">
                    {{ fileName }} ({{ formatFileSize(fileSize) }})
                </p>
                
                <div class="mb-4">
                    <label class="form-label">What would you like to upload?</label>
                    <div class="form-check">
                        <input class="form-check-input" type="radio" v-model="uploadChoice" 
                               value="transcode" id="transcodeChoice">
                        <label class="form-check-label" for="transcodeChoice">
                            <i class="fa-solid fa-video me-1"></i>Transcoded streaming version (Recommended)
                            <small class="d-block text-muted">Convert to HLS format for better streaming</small>
                        </label>
                    </div>
                    <div class="form-check mt-2">
                        <input class="form-check-input" type="radio" v-model="uploadChoice" 
                               value="original" id="originalChoice">
                        <label class="form-check-label" for="originalChoice">
                            <i class="fa-solid fa-file-video me-1"></i>Original file only
                            <small class="d-block text-muted">Upload as-is without processing</small>
                        </label>
                    </div>
                    <div class="form-check mt-2">
                        <input class="form-check-input" type="radio" v-model="uploadChoice" 
                               value="both" id="bothChoice">
                        <label class="form-check-label" for="bothChoice">
                            <i class="fa-solid fa-folder-open me-1"></i>Both original and transcoded
                            <small class="d-block text-muted">Upload original and streaming version</small>
                        </label>
                    </div>
                </div>
                
                <div class="d-flex gap-2 justify-content-end">
                    <button class="btn btn-secondary" @click="cancel">
                        Cancel
                    </button>
                    <button class="btn btn-primary" @click="confirm" :disabled="!uploadChoice">
                        <i class="fa-solid fa-check me-1"></i>Continue
                    </button>
                </div>
            </div>
        </div>
    </teleport>
    `,
    props: {
        show: {
            type: Boolean,
            default: false
        },
        fileName: {
            type: String,
            default: ''
        },
        fileSize: {
            type: Number,
            default: 0
        }
    },
    emits: ['choice', 'cancel'],
    data() {
        return {
            uploadChoice: 'transcode' // Default choice
        }
    },
    methods: {
        confirm() {
            this.$emit('choice', this.uploadChoice);
            this.uploadChoice = 'transcode'; // Reset for next use
        },
        
        cancel() {
            this.$emit('cancel');
            this.uploadChoice = 'transcode'; // Reset
        },
        
        formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }
    }
};