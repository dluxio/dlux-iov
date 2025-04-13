import ModalVue from '/js/modal-manager.js';
import UploadVue from '/js/uploadvue.js';

export default {
    name: 'UploadEverywhere',
    components: {
        'modal-vue': ModalVue,
        'upload-vue': UploadVue,
    },
    template: `
  <div class="d-flex flex-column">
    <!-- Drag and Drop Area -->
    <div
      @drop="handleDrop"
      @dragover.prevent
      class="drop-area text-center py-5 lead rounded"
      style="border-width: 2px; border-style: dashed; background-color: rgba(0,0,0,0.3);"
    >
      Drop files here to start the upload process
    </div>

    <!-- File List (Optional Preview Before Contract Creation) -->
    <div v-if="droppedFiles.length > 0 && !contractBuilt" class="mt-3">
      <h5>Dropped Files: {{ droppedFiles.length }} (Total Size: {{ fancyBytes(totalSize) }})</h5>
      <ul class="list-group">
        <li v-for="(file, index) in droppedFiles" :key="index" class="list-group-item d-flex justify-content-between align-items-center">
          {{ file.name }} ({{ fancyBytes(file.size) }})
          <button class="btn btn-sm btn-danger" @click="removeFile(index)">Remove</button>
        </li>
      </ul>
    </div>

    <!-- Contract Modal Trigger -->
    <modal-vue
      v-if="(showContractButton && ! contractSize) ||  (showContractButton && requiredBroca <= contractSize)"
      type="contract"
      :to_account="{'amount':requiredBroca,'broker':'dlux-io'}"
      :account="account"
      :api="sapi"
      :mypfp="mypfp"
      :tokenuser="saccountapi"
      :tokenstats="stats"
      :tokenprotocol="protocol"
      @modalsign="sendIt($event, 'contractBuilt')"
      v-slot:trigger
    >
      <button class="btn btn-primary mt-3 trigger">
        Build Contract for {{ requiredBroca.toFixed(0) }} BROCA
      </button>
    </modal-vue>

    <!-- Upload Interface -->
    <div v-if="droppedFiles.length && contractBuilt && totalSize && requiredBroca <= contractSize" class="mt-3">
      <upload-vue
        :user="saccountapi"
        :propcontract="selectedContract"
        :propfiles="{'target':{id, 'files': droppedFiles}}"
        @tosign="sendIt($event)"
        @done="handleUploadDone"
      />
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center mt-3">
      <p>Loading contract details... Please wait.</p>
    </div>
  </div>
  `,
    props: {
        account: {
            type: String,
            default: '',
            required: true,
        },
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
            }),
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
            contractBuilt: false,
            selectedContract: null,
            loading: false,
            id: ""
        };
    },
    watch: {
        saccountapi: {
            immediate: true,
            handler(thenew) {
                this.pickContract('watcher')
            }
        }
    },
    methods: {
        handleDrop(event) {
            event.preventDefault();
            const files = Array.from(event.dataTransfer.files);
            this.id = event.target.id
            this.droppedFiles = [...this.droppedFiles, ...files];
            this.calculateFileSizes();
            this.showContractButton = true;
        },
        pickContract(info) {
            console.log(this.saccountapi)
            const bestFit = this.requiredBroca < 100 ? 100 : this.requiredBroca
            for (var node in this.saccountapi.channels) {
                for (var type in this.saccountapi.channels[node]) {
                    if (this.saccountapi.channels[node][type].r >= bestFit) {
                        this.selectedContract = this.saccountapi.channels[node][type]
                        this.contractSize = this.saccountapi.channels[node][type].r
                        this.contractBuilt = true
                    }
                }
            }
        },
        removeFile(index) {
            this.droppedFiles.splice(index, 1);
            this.calculateFileSizes();
            if (this.droppedFiles.length === 0) {
                this.showContractButton = false;
            }
        },
        calculateFileSizes() {
            this.totalSize = this.droppedFiles.reduce((acc, file) => acc + file.size, 0);
            // Assuming spkStats.channel_bytes is available via stats prop
            const channelBytes = this.stats.channel_bytes || 1024; // Fallback to 1024 if not provided
            this.requiredBroca = parseInt((this.totalSize / channelBytes) * 1.5);
        },
        handleModalSign(op) {
            this.loading = true;
            this.$emit('tosign', op);
        },
        sendIt(event) {
            this.$emit('modalsign', event)
        },
        handleUploadDone() {

            this.$emit('done');
            this.resetComponent();
        },
        resetComponent() {
            this.droppedFiles = [];
            this.totalSize = 0;
            this.requiredBroca = 0;
            this.showContractButton = false;
            this.contractBuilt = false;
            this.selectedContract = null;
            this.loading = false;
        },
        fancyBytes(bytes) {
            let counter = 0;
            const units = ['', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];
            while (bytes > 1024) {
                bytes /= 1024;
                counter++;
            }
            return `${bytes.toFixed(2)} ${units[counter]}B`;
        },
    },
    mounted(){
        this.pickContract()
    },
    emits: ['tosign', 'done'],
};