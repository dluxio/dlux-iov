import ModalVue from '/js/modal-manager.js';
import UploadVue from '/js/uploadvue-dd.js';
import MCommon from '/js/methods-common.js';
import Watchers from '/js/watchers-common.js';

export default {
    name: 'UploadEverywhere',
    components: {
        'modal-vue': ModalVue,
        'upload-vue': UploadVue,
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
                    <li v-for="(file, index) in droppedFiles" :key="index" class="my-1 p-1 bg-card rounded d-flex justify-content-between align-items-center">
                        {{ file.name }} ({{ fancyBytes(file.size) }})
                        <button class="btn btn-sm btn-danger" @click="removeFile(index)">Remove</button>
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
                    const fileObjects = newDrop.files.map(item => item.file); 
                    this.addFiles(fileObjects); // Add the plain File objects to the UI list

                    // Append the new structured files to the existing list for upload
                    this.structuredFilesForUpload = [...this.structuredFilesForUpload, ...newDrop.files]; 
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
        addFiles(files) {
            // Filter out potential duplicates if necessary, based on name and size
            const newFilesToAdd = files.filter(newFile =>
                !this.droppedFiles.some(existingFile =>
                    existingFile.name === newFile.name && existingFile.size === newFile.size
                )
            );
            if (newFilesToAdd.length > 0) {
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
            }
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

            const structuredIndex = this.structuredFilesForUpload.findIndex(
                sf => sf.file.name === fileToRemove.name && sf.file.size === fileToRemove.size
            );
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
    emits: ['tosign', 'done', 'update:externalDrop'], // Removed targetPath from done payload
};