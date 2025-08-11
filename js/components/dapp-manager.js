// dApp Manager Component
// Provides drag-and-drop asset organization for building dApps,
// with custom JSON structure management and licensing support

const DappManager = {
    name: 'DappManager',
    props: {
        account: String,
        spkApi: Object,
        initialCustomJson: {
            type: Object,
            default: () => ({})
        },
        spkFileToAdd: {
            type: Object,
            default: null
        }
    },
    data() {
        return {
            // dApp structure based on standard dApp JSON format
            dappStructure: {
                entry: null, // Main entry file (must be HTML)
                assets: [], // Static assets (images, fonts, etc.)
                remixer: null // Base HTML file to remix from existing dApp
            },

            // dApp metadata
            selectedDAppType: 'APP', // Default to APP type
            dappCID: '', // Entry point CID
            attribution: [], // Attribution array for referenced works

            // PWA Configuration
            pwaConfig: {
                enabled: true, // Enable PWA features
                appTitle: '', // App title for manifest (defaults to post title)
                appDescription: '', // App description for manifest
                shortName: 'DLUX-dApp', // Short name for manifest
                themeColor: '#111222', // Theme color
                backgroundColor: '#111222', // Background color
                displayMode: 'standalone', // Display mode: standalone, fullscreen, minimal-ui, browser
                appIcons: [
                    { 'src': 'https://dlux.io/img/dlux-hive-logo-alpha.svg', 'sizes': '192x192', 'type': 'image/svg+xml' },
                    { 'src': 'https://dlux.io/img/dlux-logo-icon.png', 'sizes': '695x695', 'type': 'image/png', 'purpose': 'any' },
                    { 'src': 'https://dlux.io/img/dlux-icon-192.png', 'sizes': '192x192', 'type': 'image/png', 'purpose': 'any maskable' }
                ],
                morePrecacheUrls: [], // Additional URLs to precache in service worker
                customServiceWorker: '', // Optional: CID of custom service worker file
                enableServiceWorker: true // Enable automatic service worker generation
            },

            // Custom JSON editor
            customJsonString: '',
            customJsonError: '',
            isJsonEditorLocked: true,

            // Licensing
            selectedLicense: '1', // Default to CC BY

            // Upload progress
            uploadProgress: {},

            // File type mappings
            fileTypeMapping: {
                'html': 'entry', // HTML files for entry point
                'htm': 'entry',  // HTML files for entry point
                'png': 'assets',
                'jpg': 'assets',
                'jpeg': 'assets',
                'gif': 'assets',
                'svg': 'assets',
                'ico': 'assets',
                'woff': 'assets',
                'woff2': 'assets',
                'ttf': 'assets',
                'eot': 'assets',
                'mp3': 'assets',
                'wav': 'assets',
                'mp4': 'assets',
                'webm': 'assets',
                'js': 'assets',     // All other files go to assets
                'mjs': 'assets',
                'ts': 'assets',
                'css': 'assets',
                'scss': 'assets',
                'sass': 'assets',
                'less': 'assets',
                'json': 'assets',
                'xml': 'assets',
                'yaml': 'assets',
                'yml': 'assets'
            },

            // Available dApp types (from hub postSelect.types)
            dappTypes: {
                'VR': { name: 'VR Experience', icon: 'fa-solid fa-vr-cardboard' },
                'AR': { name: 'AR Experience', icon: 'fa-solid fa-glasses' },
                'XR': { name: 'Extended Reality', icon: 'fa-brands fa-unity' },
                'APP': { name: 'Unstoppable App', icon: 'fa-solid fa-mobile-screen-button' },
                '360': { name: '360° Photo Gallery', icon: 'fa-solid fa-globe' },
                '3D': { name: '3D Experience', icon: 'fa-solid fa-shapes' },
                'Audio': { name: 'Audio Experience', icon: 'fa-solid fa-music' },
                'Video': { name: 'Video Experience', icon: 'fa-solid fa-film' }
            },

            // Available licenses (from existing codebase)
            licenses: {
                '1': {
                    fa: [
                        { fa: 'fa-brands fa-creative-commons', l: 'Creative Commons License' },
                        { fa: 'fa-brands fa-creative-commons-by', l: 'Attribution Required' }
                    ],
                    name: 'CC BY',
                    allowsDerivatives: true,
                    commercial: true
                },
                '2': {
                    fa: [
                        { fa: 'fa-brands fa-creative-commons', l: 'Creative Commons License' },
                        { fa: 'fa-brands fa-creative-commons-by', l: 'Attribution Required' },
                        { fa: 'fa-brands fa-creative-commons-sa', l: 'Share Alike' }
                    ],
                    name: 'CC BY-SA',
                    allowsDerivatives: true,
                    commercial: true,
                    requiresSameShare: true
                },
                '3': {
                    fa: [
                        { fa: 'fa-brands fa-creative-commons', l: 'Creative Commons License' },
                        { fa: 'fa-brands fa-creative-commons-by', l: 'Attribution Required' },
                        { fa: 'fa-brands fa-creative-commons-nd', l: 'No Derivatives' }
                    ],
                    name: 'CC BY-ND',
                    allowsDerivatives: false,
                    commercial: true
                },
                '4': {
                    fa: [
                        { fa: 'fa-brands fa-creative-commons', l: 'Creative Commons License' },
                        { fa: 'fa-brands fa-creative-commons-by', l: 'Attribution Required' },
                        { fa: 'fa-brands fa-creative-commons-nc', l: 'Non-Commercial' },
                        { fa: 'fa-brands fa-creative-commons-nd', l: 'No Derivatives' }
                    ],
                    name: 'CC BY-NC-ND',
                    allowsDerivatives: false,
                    commercial: false
                },
                '5': {
                    fa: [
                        { fa: 'fa-brands fa-creative-commons', l: 'Creative Commons License' },
                        { fa: 'fa-brands fa-creative-commons-by', l: 'Attribution Required' },
                        { fa: 'fa-brands fa-creative-commons-nc', l: 'Non-Commercial' }
                    ],
                    name: 'CC BY-NC',
                    allowsDerivatives: true,
                    commercial: false
                },
                '6': {
                    fa: [
                        { fa: 'fa-brands fa-creative-commons', l: 'Creative Commons License' },
                        { fa: 'fa-brands fa-creative-commons-by', l: 'Attribution Required' },
                        { fa: 'fa-brands fa-creative-commons-nc', l: 'Non-Commercial' },
                        { fa: 'fa-brands fa-creative-commons-sa', l: 'Share Alike' }
                    ],
                    name: 'CC BY-NC-SA',
                    allowsDerivatives: true,
                    commercial: false,
                    requiresSameShare: true
                },
                '7': {
                    fa: [
                        { fa: 'fa-brands fa-creative-commons-zero', l: 'CC0: Public Domain' }
                    ],
                    name: 'CC0',
                    allowsDerivatives: true,
                    commercial: true,
                    public: true
                }
            }
        };
    },
    computed: {
        totalFiles() {
            let count = 0;
            if (this.dappStructure.entry !== null) count++;
            if (this.dappStructure.remixer !== null) count++;
            count += this.dappStructure.assets.length;
            return count;
        },

        hasEntryFile() {
            return this.dappStructure.entry !== null;
        },

        hasRemixerFile() {
            return this.dappStructure.remixer !== null;
        },

        customJsonData() {
            try {
                return this.customJsonString ? JSON.parse(this.customJsonString) : {};
            } catch {
                return {};
            }
        },

        isValidJson() {
            try {
                if (!this.customJsonString.trim()) return true;
                JSON.parse(this.customJsonString);
                return true;
            } catch {
                return false;
            }
        },

        // Generate contracts array from file structure
        contractsArray() {
            const contracts = [];

            // Add entry point contract
            if (this.dappStructure.entry && this.dappStructure.entry.contractId) {
                contracts.push(this.dappStructure.entry.contractId);
            }

            // Add all asset contracts
            Object.values(this.dappStructure).forEach(category => {
                if (Array.isArray(category)) {
                    category.forEach(file => {
                        if (file.contractId && !contracts.includes(file.contractId)) {
                            contracts.push(file.contractId);
                        }
                    });
                }
            });

            return contracts;
        },

        // Generate assets array for compatibility
        assetsArray() {
            const assets = [];
            this.dappStructure.assets.forEach(asset => {
                if (asset.cid) {
                    assets.push(asset.cid);
                }
            });
            return assets;
        },

        combinedDappData() {
            // Build the complete JSON structure as requested
            const customJsonStructure = {
                app: 'dlux/1.0.0b',
                dAppType: this.selectedDAppType,
                format: 'markdown',
                assets: this.assetsArray,
                contracts: this.contractsArray,
                tags: ['dlux'],
                dappCID: this.dappCID || (this.dappStructure.entry ? this.dappStructure.entry.cid : ''),
                license: this.licenses[this.selectedLicense]?.name || 'CC BY',
                attribution: this.attribution
            };

            // Add PWA configuration if enabled
            if (this.pwaConfig.enabled) {
                if (this.pwaConfig.appIcons.length > 0) {
                    customJsonStructure.appIcons = this.pwaConfig.appIcons;
                }
                if (this.pwaConfig.morePrecacheUrls.length > 0) {
                    customJsonStructure.morePrecacheUrls = this.pwaConfig.morePrecacheUrls;
                }
                if (this.pwaConfig.customServiceWorker) {
                    customJsonStructure.sw = this.pwaConfig.customServiceWorker;
                }
                if (this.pwaConfig.appTitle) {
                    customJsonStructure.appTitle = this.pwaConfig.appTitle;
                }
                if (this.pwaConfig.appDescription) {
                    customJsonStructure.appDescription = this.pwaConfig.appDescription;
                }
                customJsonStructure.shortName = this.pwaConfig.shortName;
                customJsonStructure.themeColor = this.pwaConfig.themeColor;
                customJsonStructure.backgroundColor = this.pwaConfig.backgroundColor;
                customJsonStructure.displayMode = this.pwaConfig.displayMode;
                customJsonStructure.enableServiceWorker = this.pwaConfig.enableServiceWorker;
            }

            // Merge with any additional custom JSON data, but prioritize our structure
            return { ...this.customJsonData, ...customJsonStructure };
        }
    },
    watch: {
        spkFileToAdd: {
            handler(newFile) {
                if (newFile) {
                    console.log('📁 SPK file received in dApp manager:', newFile);
                    this.addFileToStructure(newFile);
                }
            },
            immediate: false
        },

        dappStructure: {
            handler() {
                this.updateDappCID();
                this.emitDataUpdate();
            },
            deep: true
        },

        selectedLicense() {
            this.emitDataUpdate();
        },

        selectedDAppType() {
            this.emitDataUpdate();
        },

        attribution: {
            handler() {
                this.emitDataUpdate();
            },
            deep: true
        },

        pwaConfig: {
            handler() {
                this.emitDataUpdate();
            },
            deep: true
        },

        customJsonString() {
            if (this.isValidJson) {
                this.customJsonError = '';
                this.emitDataUpdate();
            } else {
                this.customJsonError = 'Invalid JSON syntax';
            }
        }
    },
    mounted() {
        this.setupDragAndDrop();
        this.initializeFromProps();
    },
    methods: {
        initializeFromProps() {
            if (Object.keys(this.initialCustomJson).length > 0) {
                this.customJsonString = JSON.stringify(this.initialCustomJson, null, 2);

                // Load existing dApp structure if present
                if (this.initialCustomJson.dappStructure) {
                    this.dappStructure = { ...this.dappStructure, ...this.initialCustomJson.dappStructure };
                }

                if (this.initialCustomJson.dAppType) {
                    this.selectedDAppType = this.initialCustomJson.dAppType;
                }

                if (this.initialCustomJson.dappCID) {
                    this.dappCID = this.initialCustomJson.dappCID;
                }

                if (this.initialCustomJson.attribution) {
                    this.attribution = this.initialCustomJson.attribution;
                }

                // Load PWA configuration
                if (this.initialCustomJson.appIcons) {
                    this.pwaConfig.appIcons = this.initialCustomJson.appIcons;
                }
                if (this.initialCustomJson.morePrecacheUrls) {
                    this.pwaConfig.morePrecacheUrls = this.initialCustomJson.morePrecacheUrls;
                }
                if (this.initialCustomJson.sw) {
                    this.pwaConfig.customServiceWorker = this.initialCustomJson.sw;
                }
                if (this.initialCustomJson.appTitle) {
                    this.pwaConfig.appTitle = this.initialCustomJson.appTitle;
                }
                if (this.initialCustomJson.appDescription) {
                    this.pwaConfig.appDescription = this.initialCustomJson.appDescription;
                }
                if (this.initialCustomJson.shortName) {
                    this.pwaConfig.shortName = this.initialCustomJson.shortName;
                }
                if (this.initialCustomJson.themeColor) {
                    this.pwaConfig.themeColor = this.initialCustomJson.themeColor;
                }
                if (this.initialCustomJson.backgroundColor) {
                    this.pwaConfig.backgroundColor = this.initialCustomJson.backgroundColor;
                }
                if (this.initialCustomJson.displayMode) {
                    this.pwaConfig.displayMode = this.initialCustomJson.displayMode;
                }
                if (this.initialCustomJson.enableServiceWorker !== undefined) {
                    this.pwaConfig.enableServiceWorker = this.initialCustomJson.enableServiceWorker;
                }

                // Convert license from name back to ID for internal use
                if (this.initialCustomJson.license) {
                    const licenseEntry = Object.entries(this.licenses).find(([id, license]) =>
                        license.name === this.initialCustomJson.license
                    );
                    if (licenseEntry) {
                        this.selectedLicense = licenseEntry[0];
                    }
                }
            }
        },

        // File management
        addFileToStructure(fileData) {
            const fileName = fileData.fileName || fileData.name || fileData.filename || 'unknown';
            const fileType = this.getFileType(fileName);
            const category = this.getCategoryForFile(fileName, fileType);

            const fileObject = {
                cid: fileData.cid || fileData.hash || fileData.url,
                name: fileName,
                type: fileType,
                contractId: fileData.contractId || fileData.id || fileData.contract,
                size: fileData.size || 0,
                description: fileData.description || ''
            };

            console.log(`📎 Adding file to category "${category}":`, fileObject);

            if (category === 'entry') {
                this.dappStructure.entry = fileObject;
                this.dappCID = fileObject.cid; // Set dappCID when entry is added
            } else if (category === 'remixer') {
                this.dappStructure.remixer = fileObject;
            } else {
                if (!this.dappStructure[category]) {
                    this.dappStructure[category] = [];
                }
                this.dappStructure[category].push(fileObject);
            }

            this.emitDataUpdate();
        },

        updateDappCID() {
            if (this.dappStructure.entry && this.dappStructure.entry.cid) {
                this.dappCID = this.dappStructure.entry.cid;
            }
        },

        getFileType(fileName) {
            const extension = fileName.split('.').pop()?.toLowerCase();
            return extension || 'unknown';
        },

        getCategoryForFile(fileName, fileType) {
            const mapping = this.fileTypeMapping[fileType];
            if (mapping) return mapping;

            // Special logic for entry files - only HTML allowed
            if (fileName.toLowerCase().includes('index') || fileName.toLowerCase().includes('main')) {
                if (['html', 'htm'].includes(fileType)) {
                    return 'entry';
                }
            }

            return 'assets';
        },

        removeFile(category, index = null) {
            if (category === 'entry') {
                this.dappStructure.entry = null;
                this.dappCID = '';
            } else if (category === 'remixer') {
                this.dappStructure.remixer = null;
            } else if (index !== null && this.dappStructure[category]) {
                this.dappStructure[category].splice(index, 1);
            }
            this.emitDataUpdate();
        },

        moveFile(fromCategory, toCategory, fileIndex = null) {
            let file;

            if (fromCategory === 'entry') {
                file = this.dappStructure.entry;
                this.dappStructure.entry = null;
                this.dappCID = '';
            } else if (fromCategory === 'remixer') {
                file = this.dappStructure.remixer;
                this.dappStructure.remixer = null;
            } else {
                file = this.dappStructure[fromCategory][fileIndex];
                this.dappStructure[fromCategory].splice(fileIndex, 1);
            }

            if (toCategory === 'entry') {
                this.dappStructure.entry = file;
                this.dappCID = file.cid;
            } else if (toCategory === 'remixer') {
                this.dappStructure.remixer = file;
            } else {
                if (!this.dappStructure[toCategory]) {
                    this.dappStructure[toCategory] = [];
                }
                this.dappStructure[toCategory].push(file);
            }

            this.emitDataUpdate();
        },

        // Attribution management
        addAttribution() {
            this.attribution.push('');
        },

        removeAttribution(index) {
            this.attribution.splice(index, 1);
        },

        // PWA Configuration Management
        addAppIcon() {
            this.pwaConfig.appIcons.push({
                src: '',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any'
            });
        },

        removeAppIcon(index) {
            this.pwaConfig.appIcons.splice(index, 1);
        },

        addPrecacheUrl() {
            this.pwaConfig.morePrecacheUrls.push('');
        },

        removePrecacheUrl(index) {
            this.pwaConfig.morePrecacheUrls.splice(index, 1);
        },

        resetToDefaultIcons() {
            this.pwaConfig.appIcons = [
                { 'src': 'https://dlux.io/img/dlux-hive-logo-alpha.svg', 'sizes': '192x192', 'type': 'image/svg+xml' },
                { 'src': 'https://dlux.io/img/dlux-logo-icon.png', 'sizes': '695x695', 'type': 'image/png', 'purpose': 'any' },
                { 'src': 'https://dlux.io/img/dlux-icon-192.png', 'sizes': '192x192', 'type': 'image/png', 'purpose': 'any maskable' }
            ];
        },

        // Drag and drop
        setupDragAndDrop() {
            const dropZones = this.$el.querySelectorAll('[data-drop-category]');

            dropZones.forEach(zone => {
                ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                    zone.addEventListener(eventName, this.preventDefaults, false);
                });

                ['dragenter', 'dragover'].forEach(eventName => {
                    zone.addEventListener(eventName, () => zone.classList.add('dragover'), false);
                });

                ['dragleave', 'drop'].forEach(eventName => {
                    zone.addEventListener(eventName, () => zone.classList.remove('dragover'), false);
                });

                zone.addEventListener('drop', (e) => this.handleDrop(e, zone.dataset.dropCategory), false);
            });
        },

        preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        },

        handleDrop(e, category) {
            this.preventDefaults(e);

            // Check if this is a drag from SPK Drive
            const itemIds = e.dataTransfer.getData('itemids');
            const contractId = e.dataTransfer.getData('contractid');

            if (itemIds && contractId) {
                try {
                    const parsedIds = JSON.parse(itemIds);
                    parsedIds.forEach(fileId => {
                        if (!fileId.startsWith('folder-')) {
                            const spkFileData = {
                                cid: fileId,
                                hash: fileId,
                                url: fileId,
                                name: fileId,
                                filename: fileId,
                                contractId: contractId,
                                fromDragDrop: true,
                                targetCategory: category
                            };

                            // For entry and remixer, only allow HTML files
                            if ((category === 'entry' || category === 'remixer')) {
                                const fileType = this.getFileType(fileId);
                                if (!['html', 'htm'].includes(fileType)) {
                                    console.warn(`Only HTML files allowed for ${category}. Skipping ${fileId}`);
                                    return;
                                }
                            }

                            console.log('🎯 Processing dropped SPK file for category:', category, spkFileData);
                            this.addFileToStructure(spkFileData);
                        }
                    });
                } catch (error) {
                    console.error('Failed to parse dropped SPK file IDs:', error);
                }
                return;
            }

            // Handle regular file drops
            const files = Array.from(e.dataTransfer.files);
            // TODO: Implement file upload to SPK
            console.log('Regular files dropped:', files);
        },

        // Custom JSON management
        toggleJsonEditor() {
            this.isJsonEditorLocked = !this.isJsonEditorLocked;
        },

        formatJson() {
            if (this.isValidJson && this.customJsonString.trim()) {
                const parsed = JSON.parse(this.customJsonString);
                this.customJsonString = JSON.stringify(parsed, null, 2);
            }
        },

        minifyJson() {
            if (this.isValidJson && this.customJsonString.trim()) {
                const parsed = JSON.parse(this.customJsonString);
                this.customJsonString = JSON.stringify(parsed);
            }
        },

        // Licensing management
        isLicenseCompatible(licenseId) {
            const license = this.licenses[licenseId];
            return license && license.allowsDerivatives;
        },

        // Data emission
        emitDataUpdate() {
            // Update the custom JSON string to reflect current structure
            this.customJsonString = JSON.stringify(this.combinedDappData, null, 2);
            this.$emit('dapp-updated', this.combinedDappData);
        },

        // Utility methods
        getFileIcon(fileType) {
            const iconMap = {
                'html': 'fa-brands fa-html5',
                'css': 'fa-brands fa-css3-alt',
                'js': 'fa-brands fa-js',
                'json': 'fa-solid fa-code',
                'png': 'fa-solid fa-image',
                'jpg': 'fa-solid fa-image',
                'jpeg': 'fa-solid fa-image',
                'gif': 'fa-solid fa-image',
                'svg': 'fa-solid fa-image',
                'mp3': 'fa-solid fa-music',
                'mp4': 'fa-solid fa-video',
                'pdf': 'fa-solid fa-file-pdf',
                'zip': 'fa-solid fa-file-archive'
            };

            return iconMap[fileType] || 'fa-solid fa-file';
        },

        getCategoryIcon(category) {
            const iconMap = {
                'entry': 'fa-solid fa-home',
                'assets': 'fa-solid fa-images',
                'remixer': 'fa-solid fa-shuffle'
            };

            return iconMap[category] || 'fa-solid fa-folder';
        },

        getCategoryDescription(category) {
            const descriptions = {
                'entry': 'Main application entry point (must be HTML file)',
                'assets': 'Static assets like images, fonts, media files, CSS, JS, and other resources',
                'remixer': 'Base HTML file from existing dApp to remix from (must be HTML file)'
            };

            return descriptions[category] || 'Files';
        }
    },

    template: `
        <div class="dapp-manager">
            <!-- Header -->
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h6 class="mb-0">
                    <i class="fa-solid fa-mobile-screen-button fa-fw me-2"></i>dApp Structure Manager
                </h6>
                <div class="text-muted small">
                    {{ totalFiles }} file{{ totalFiles !== 1 ? 's' : '' }} organized
                </div>
            </div>
            
            <!-- File Organization Zones -->
            <div class="row g-3 mb-4">
                <!-- Entry File -->
                <div class="col-12">
                    <div class="card bg-darker border-primary" 
                         data-drop-category="entry"
                         :class="{ 'border-success': hasEntryFile }">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h6 class="mb-0">
                                <i :class="getCategoryIcon('entry')" class="fa-fw me-2"></i>
                                Entry Point
                                <span v-if="hasEntryFile" class="badge bg-success ms-2">Set</span>
                                <span v-else class="badge bg-warning ms-2">Required</span>
                            </h6>
                        </div>
                        <div class="card-body" style="min-height: 100px;">
                            <div v-if="!dappStructure.entry" class="drop-zone text-center py-3">
                                <i class="fa-solid fa-cloud-upload-alt fa-2x mb-2 text-muted"></i>
                                <p class="mb-1 text-muted">Drop your main application file here</p>
                                <small class="text-muted">{{ getCategoryDescription('entry') }}</small>
                            </div>
                            <div v-else class="d-flex justify-content-between align-items-center">
                                <div class="d-flex align-items-center">
                                    <i :class="getFileIcon(dappStructure.entry.type)" class="fa-fw me-2"></i>
                                    <div>
                                        <div class="fw-bold">{{ dappStructure.entry.name }}</div>
                                        <small class="text-muted">{{ dappStructure.entry.type.toUpperCase() }} • Entry point</small>
                                    </div>
                                </div>
                                <button type="button" 
                                        class="btn btn-sm btn-outline-danger"
                                        @click="removeFile('entry')">
                                    <i class="fa-solid fa-trash fa-fw"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- ReMixer File -->
                <div class="col-md-6">
                    <div class="card bg-darker border-info" 
                         data-drop-category="remixer"
                         :class="{ 'border-success': hasRemixerFile }">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h6 class="mb-0">
                                <i :class="getCategoryIcon('remixer')" class="fa-fw me-2"></i>
                                ReMixer Base
                                <span v-if="hasRemixerFile" class="badge bg-success ms-2">Set</span>
                                <span v-else class="badge bg-info ms-2">Optional</span>
                            </h6>
                        </div>
                        <div class="card-body" style="min-height: 120px;">
                            <div v-if="!dappStructure.remixer" class="drop-zone text-center py-3">
                                <i class="fa-solid fa-shuffle fa-2x mb-2 text-muted"></i>
                                <p class="mb-1 text-muted">Drop an HTML file to remix</p>
                                <small class="text-muted">{{ getCategoryDescription('remixer') }}</small>
                            </div>
                            <div v-else class="d-flex justify-content-between align-items-center">
                                <div class="d-flex align-items-center">
                                    <i :class="getFileIcon(dappStructure.remixer.type)" class="fa-fw me-2"></i>
                                    <div>
                                        <div class="fw-bold">{{ dappStructure.remixer.name }}</div>
                                        <small class="text-muted">{{ dappStructure.remixer.type.toUpperCase() }} • ReMixer base</small>
                                    </div>
                                </div>
                                <div class="btn-group">
                                    <button type="button" 
                                            class="btn btn-sm btn-outline-warning"
                                            @click="moveFile('remixer', 'entry')"
                                            v-if="!hasEntryFile"
                                            title="Set as entry point">
                                        <i class="fa-solid fa-home fa-fw"></i>
                                    </button>
                                    <button type="button" 
                                            class="btn btn-sm btn-outline-danger"
                                            @click="removeFile('remixer')">
                                        <i class="fa-solid fa-trash fa-fw"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Assets -->
                <div class="col-md-6">
                    <div class="card bg-darker" data-drop-category="assets">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h6 class="mb-0">
                                <i :class="getCategoryIcon('assets')" class="fa-fw me-2"></i>
                                Assets
                                <span class="badge bg-secondary ms-2">{{ dappStructure.assets?.length || 0 }}</span>
                            </h6>
                        </div>
                        <div class="card-body" style="min-height: 120px;">
                            <div v-if="!dappStructure.assets || dappStructure.assets.length === 0" 
                                 class="drop-zone text-center py-3">
                                <i class="fa-solid fa-plus fa-lg mb-2 text-muted"></i>
                                <p class="mb-1 text-muted">Drop files here</p>
                                <small class="text-muted">{{ getCategoryDescription('assets') }}</small>
                            </div>
                            <div v-else>
                                <div v-for="(file, index) in dappStructure.assets" 
                                     :key="index" 
                                     class="d-flex justify-content-between align-items-center mb-2 p-2 bg-secondary rounded">
                                    <div class="d-flex align-items-center">
                                        <i :class="getFileIcon(file.type)" class="fa-fw me-2"></i>
                                        <div>
                                            <div class="small fw-bold">{{ file.name }}</div>
                                            <small class="text-muted">{{ file.type.toUpperCase() }}</small>
                                        </div>
                                    </div>
                                    <div class="btn-group">
                                        <button type="button" 
                                                class="btn btn-sm btn-outline-warning"
                                                @click="moveFile('assets', 'entry', index)"
                                                v-if="!hasEntryFile && ['html', 'htm'].includes(file.type)"
                                                title="Set as entry point">
                                            <i class="fa-solid fa-home fa-fw"></i>
                                        </button>
                                        <button type="button" 
                                                class="btn btn-sm btn-outline-info"
                                                @click="moveFile('assets', 'remixer', index)"
                                                v-if="!hasRemixerFile && ['html', 'htm'].includes(file.type)"
                                                title="Set as ReMixer base">
                                            <i class="fa-solid fa-shuffle fa-fw"></i>
                                        </button>
                                        <button type="button" 
                                                class="btn btn-sm btn-outline-danger"
                                                @click="removeFile('assets', index)">
                                            <i class="fa-solid fa-trash fa-fw"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- SPK Drive Integration Note -->
            <div class="alert alert-info">
                <i class="fa-solid fa-info-circle fa-fw me-1"></i>
                <strong>Tip:</strong> Drag files from "Your Files" section above directly into the appropriate categories.
                The entry point must be an HTML file. Use the ReMixer to select a base HTML file from an existing dApp to build upon.
            </div>
            
            <!-- Licensing Selection -->
            <div class="card bg-darker mb-3">
                <div class="card-header">
                    <h6 class="mb-0">
                        <i class="fa-brands fa-creative-commons fa-fw me-2"></i>
                        Licensing
                    </h6>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <label class="form-label">Select License:</label>
                        <select v-model="selectedLicense" class="form-select">
                            <option v-for="(license, id) in licenses" :key="id" :value="id">
                                {{ license.name }} - {{ license.name === 'CC0' ? 'Public Domain' : 
                                   (license.commercial ? 'Commercial' : 'Non-Commercial') + 
                                   (license.allowsDerivatives ? ', Derivatives Allowed' : ', No Derivatives') }}
                            </option>
                        </select>
                    </div>
                    
                    <div class="d-flex align-items-center gap-2">
                        <span v-for="icon in licenses[selectedLicense]?.fa || []" :key="icon.fa">
                            <i :class="icon.fa" :title="icon.l"></i>
                        </span>
                        <span class="fw-bold">{{ licenses[selectedLicense]?.name }}</span>
                    </div>
                </div>
            </div>
            
            <!-- dApp Type & Metadata -->
            <div class="card bg-darker mb-3">
                <div class="card-header">
                    <h6 class="mb-0">
                        <i class="fa-solid fa-tag fa-fw me-2"></i>dApp Type & Metadata
                    </h6>
                </div>
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label">dApp Type:</label>
                            <select v-model="selectedDAppType" class="form-select">
                                <option v-for="(type, key) in dappTypes" :key="key" :value="key">
                                    {{ type.name }}
                                </option>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Entry Point CID:</label>
                            <input v-model="dappCID" type="text" class="form-control" 
                                   placeholder="Automatically set from entry file"
                                   :class="{ 'bg-secondary': !dappCID }" readonly>
                        </div>
                    </div>
                    
                    <!-- Attribution -->
                    <div class="mt-3">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <label class="form-label mb-0">Attribution (Referenced Works):</label>
                            <button type="button" class="btn btn-sm btn-outline-primary" @click="addAttribution()">
                                <i class="fa-solid fa-plus fa-fw me-1"></i>Add Attribution
                            </button>
                        </div>
                        <div v-if="attribution.length === 0" class="text-muted small">
                            No referenced works to attribute
                        </div>
                        <div v-for="(attr, index) in attribution" :key="index" class="input-group mb-2">
                            <span class="input-group-text">/@</span>
                            <input v-model="attribution[index]" type="text" class="form-control" 
                                   placeholder="author/permlink">
                            <button type="button" class="btn btn-outline-danger" @click="removeAttribution(index)">
                                <i class="fa-solid fa-trash fa-fw"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- PWA Configuration -->
            <div class="card bg-darker mb-3">
                <div class="card-header">
                    <h6 class="mb-0">
                        <i class="fa-solid fa-mobile-screen fa-fw me-2"></i>PWA Configuration
                        <div class="form-check form-switch d-inline-block ms-3">
                            <input class="form-check-input" type="checkbox" v-model="pwaConfig.enabled" id="pwaEnabled">
                            <label class="form-check-label" for="pwaEnabled">
                                Enable PWA Features
                            </label>
                        </div>
                    </h6>
                </div>
                <div class="card-body" v-if="pwaConfig.enabled">
                    <!-- Basic PWA Settings -->
                    <div class="row g-3 mb-4">
                        <div class="col-md-6">
                            <label class="form-label">App Title:</label>
                            <input v-model="pwaConfig.appTitle" type="text" class="form-control" 
                                   placeholder="Leave empty to use post title">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Short Name:</label>
                            <input v-model="pwaConfig.shortName" type="text" class="form-control" 
                                   placeholder="DLUX-dApp" maxlength="12">
                        </div>
                        <div class="col-12">
                            <label class="form-label">App Description:</label>
                            <textarea v-model="pwaConfig.appDescription" class="form-control" rows="2"
                                     placeholder="Leave empty to use post content description"></textarea>
                        </div>
                    </div>
                    
                    <!-- Display & Theme Settings -->
                    <div class="row g-3 mb-4">
                        <div class="col-md-4">
                            <label class="form-label">Display Mode:</label>
                            <select v-model="pwaConfig.displayMode" class="form-select">
                                <option value="standalone">Standalone (Recommended)</option>
                                <option value="fullscreen">Fullscreen</option>
                                <option value="minimal-ui">Minimal UI</option>
                                <option value="browser">Browser</option>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Theme Color:</label>
                            <div class="input-group">
                                <input v-model="pwaConfig.themeColor" type="color" class="form-control form-control-color">
                                <input v-model="pwaConfig.themeColor" type="text" class="form-control" placeholder="#111222">
                            </div>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Background Color:</label>
                            <div class="input-group">
                                <input v-model="pwaConfig.backgroundColor" type="color" class="form-control form-control-color">
                                <input v-model="pwaConfig.backgroundColor" type="text" class="form-control" placeholder="#111222">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Service Worker Configuration -->
                    <div class="card bg-secondary mb-3">
                        <div class="card-header">
                            <h6 class="mb-0">
                                <i class="fa-solid fa-cogs fa-fw me-2"></i>Service Worker
                                <div class="form-check form-switch d-inline-block ms-3">
                                    <input class="form-check-input" type="checkbox" v-model="pwaConfig.enableServiceWorker" id="swEnabled">
                                    <label class="form-check-label" for="swEnabled">
                                        Enable Service Worker
                                    </label>
                                </div>
                            </h6>
                        </div>
                        <div class="card-body" v-if="pwaConfig.enableServiceWorker">
                            <div class="mb-3">
                                <label class="form-label">Custom Service Worker (Optional):</label>
                                <input v-model="pwaConfig.customServiceWorker" type="text" class="form-control" 
                                       placeholder="CID of custom service worker file (leave empty for auto-generated)">
                                <small class="text-muted">If provided, this custom service worker will be used instead of the auto-generated one.</small>
                            </div>
                            
                            <!-- Additional Precache URLs -->
                            <div>
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <label class="form-label mb-0">Additional Precache URLs:</label>
                                    <button type="button" class="btn btn-sm btn-outline-primary" @click="addPrecacheUrl()">
                                        <i class="fa-solid fa-plus fa-fw me-1"></i>Add URL
                                    </button>
                                </div>
                                <div v-if="pwaConfig.morePrecacheUrls.length === 0" class="text-muted small mb-2">
                                    No additional URLs to precache. Your entry point and assets will be automatically cached.
                                </div>
                                <div v-for="(url, index) in pwaConfig.morePrecacheUrls" :key="index" class="input-group mb-2">
                                    <input v-model="pwaConfig.morePrecacheUrls[index]" type="text" class="form-control" 
                                           placeholder="https://example.com/resource.js">
                                    <button type="button" class="btn btn-outline-danger" @click="removePrecacheUrl(index)">
                                        <i class="fa-solid fa-trash fa-fw"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- App Icons Configuration -->
                    <div class="card bg-secondary">
                        <div class="card-header">
                            <div class="d-flex justify-content-between align-items-center">
                                <h6 class="mb-0">
                                    <i class="fa-solid fa-image fa-fw me-2"></i>App Icons
                                </h6>
                                <div class="btn-group">
                                    <button type="button" class="btn btn-sm btn-outline-primary" @click="addAppIcon()">
                                        <i class="fa-solid fa-plus fa-fw me-1"></i>Add Icon
                                    </button>
                                    <button type="button" class="btn btn-sm btn-outline-secondary" @click="resetToDefaultIcons()">
                                        <i class="fa-solid fa-undo fa-fw me-1"></i>Reset to Defaults
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div v-if="pwaConfig.appIcons.length === 0" class="text-muted small mb-2">
                                No app icons configured. Add icons for your PWA.
                            </div>
                            <div v-for="(icon, index) in pwaConfig.appIcons" :key="index" class="card bg-dark mb-2">
                                <div class="card-body p-3">
                                    <div class="row g-2">
                                        <div class="col-md-6">
                                            <label class="form-label small">Source URL:</label>
                                            <input v-model="icon.src" type="text" class="form-control form-control-sm" 
                                                   placeholder="https://example.com/icon.png">
                                        </div>
                                        <div class="col-md-2">
                                            <label class="form-label small">Sizes:</label>
                                            <input v-model="icon.sizes" type="text" class="form-control form-control-sm" 
                                                   placeholder="192x192">
                                        </div>
                                        <div class="col-md-2">
                                            <label class="form-label small">Type:</label>
                                            <select v-model="icon.type" class="form-select form-select-sm">
                                                <option value="image/png">PNG</option>
                                                <option value="image/svg+xml">SVG</option>
                                                <option value="image/jpeg">JPEG</option>
                                                <option value="image/webp">WebP</option>
                                            </select>
                                        </div>
                                        <div class="col-md-2">
                                            <label class="form-label small">Purpose:</label>
                                            <select v-model="icon.purpose" class="form-select form-select-sm">
                                                <option value="any">Any</option>
                                                <option value="maskable">Maskable</option>
                                                <option value="any maskable">Any + Maskable</option>
                                            </select>
                                        </div>
                                        <div class="col-12">
                                            <button type="button" class="btn btn-sm btn-outline-danger" @click="removeAppIcon(index)">
                                                <i class="fa-solid fa-trash fa-fw me-1"></i>Remove Icon
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card-body text-muted" v-else>
                    <i class="fa-solid fa-info-circle fa-fw me-1"></i>
                    PWA features are disabled. Enable them to configure Progressive Web App settings, service worker, and app icons for your dApp.
                </div>
            </div>
            
            <!-- Custom JSON Editor -->
            <div class="card bg-darker">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h6 class="mb-0">
                        <i class="fa-solid fa-code fa-fw me-2"></i>
                        Custom JSON
                    </h6>
                    <div class="btn-group">
                        <button type="button" 
                                class="btn btn-sm"
                                :class="isJsonEditorLocked ? 'btn-outline-warning' : 'btn-outline-success'"
                                @click="toggleJsonEditor()">
                            <i :class="isJsonEditorLocked ? 'fa-solid fa-lock' : 'fa-solid fa-lock-open'" class="fa-fw me-1"></i>
                            {{ isJsonEditorLocked ? 'Locked' : 'Unlocked' }}
                        </button>
                        <button type="button" 
                                class="btn btn-sm btn-outline-secondary"
                                @click="formatJson"
                                :disabled="!isValidJson || isJsonEditorLocked">
                            <i class="fa-solid fa-code fa-fw me-1"></i>Format
                        </button>
                        <button type="button" 
                                class="btn btn-sm btn-outline-secondary"
                                @click="minifyJson"
                                :disabled="!isValidJson || isJsonEditorLocked">
                            <i class="fa-solid fa-compress fa-fw me-1"></i>Minify
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <textarea 
                        v-model="customJsonString"
                        class="form-control bg-dark text-white font-monospace"
                        :class="{ 
                            'border-danger': customJsonError,
                            'border-success': isValidJson && customJsonString.trim(),
                            'bg-secondary': isJsonEditorLocked
                        }"
                        :readonly="isJsonEditorLocked"
                        rows="8"
                        placeholder="Enter additional custom JSON data here..."
                        style="font-size: 13px; line-height: 1.4;">
                    </textarea>
                    <div v-if="customJsonError" class="text-danger small mt-1">
                        <i class="fa-solid fa-exclamation-triangle fa-fw me-1"></i>{{ customJsonError }}
                    </div>
                    <div v-else-if="isValidJson && customJsonString.trim()" class="text-success small mt-1">
                        <i class="fa-solid fa-check-circle fa-fw me-1"></i>Valid JSON
                    </div>
                </div>
            </div>
            
            <!-- Empty State -->
            <div v-if="totalFiles === 0" class="text-center py-5 mt-4">
                <i class="fa-solid fa-mobile-screen-button fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">No Files Added</h5>
                <p class="text-muted">Drag files from your SPK Drive to start building your dApp</p>
            </div>
        </div>
    `
};

// Make component available globally
if (typeof window !== 'undefined') {
    window.DappManager = DappManager;
}

export default DappManager;
