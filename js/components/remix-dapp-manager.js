// ReMix dApp Manager Component
// Provides interface for remixing existing dApps with proper licensing attribution
// and asset management for derivative works

const RemixDappManager = {
    name: 'RemixDappManager',
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
            // Available dApps for remixing
            availableDapps: [],
            selectedBaseDapp: null,
            loadingDapps: false,
            
            // Current remix structure
            remixStructure: {
                baseDapp: null, // Original dApp being remixed
                modifications: [], // Files added/modified in remix
                attribution: [], // Attribution chain
                license: null // Remix license (must be compatible)
            },
            
            // File organization (similar to dApp manager but focused on modifications)
            modificationFiles: {
                entry: null,
                assets: [],
                scripts: [],
                styles: [],
                data: [],
                other: []
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
                    { "src": "https://dlux.io/img/dlux-hive-logo-alpha.svg", "sizes": "192x192", "type": "image/svg+xml" },
                    { "src": "https://dlux.io/img/dlux-logo-icon.png", "sizes": "695x695", "type": "image/png", "purpose": "any" },
                    { "src": "https://dlux.io/img/dlux-icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" }
                ],
                morePrecacheUrls: [], // Additional URLs to precache in service worker
                customServiceWorker: '', // Optional: CID of custom service worker file
                enableServiceWorker: true // Enable automatic service worker generation
            },
            
            // Custom JSON editor
            customJsonString: '',
            customJsonError: '',
            isJsonEditorLocked: true,
            
            // Licensing for remixes
            selectedLicense: '1',
            licenseCompatibilityWarning: '',
            
            // Search and filtering
            searchQuery: '',
            licenseFilter: 'all',
            
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
            
            // Available licenses (inherited from dApp manager but with remix logic)
            licenses: {
                "1": {
                    fa: [
                        { fa: "fa-brands fa-creative-commons", l: "Creative Commons License" },
                        { fa: "fa-brands fa-creative-commons-by", l: "Attribution Required" }
                    ],
                    name: "CC BY",
                    allowsDerivatives: true,
                    commercial: true
                },
                "2": {
                    fa: [
                        { fa: "fa-brands fa-creative-commons", l: "Creative Commons License" },
                        { fa: "fa-brands fa-creative-commons-by", l: "Attribution Required" },
                        { fa: "fa-brands fa-creative-commons-sa", l: "Share Alike" }
                    ],
                    name: "CC BY-SA",
                    allowsDerivatives: true,
                    commercial: true,
                    requiresSameShare: true
                },
                "3": {
                    fa: [
                        { fa: "fa-brands fa-creative-commons", l: "Creative Commons License" },
                        { fa: "fa-brands fa-creative-commons-by", l: "Attribution Required" },
                        { fa: "fa-brands fa-creative-commons-nd", l: "No Derivatives" }
                    ],
                    name: "CC BY-ND",
                    allowsDerivatives: false,
                    commercial: true
                },
                "5": {
                    fa: [
                        { fa: "fa-brands fa-creative-commons", l: "Creative Commons License" },
                        { fa: "fa-brands fa-creative-commons-by", l: "Attribution Required" },
                        { fa: "fa-brands fa-creative-commons-nc", l: "Non-Commercial" }
                    ],
                    name: "CC BY-NC",
                    allowsDerivatives: true,
                    commercial: false
                },
                "6": {
                    fa: [
                        { fa: "fa-brands fa-creative-commons", l: "Creative Commons License" },
                        { fa: "fa-brands fa-creative-commons-by", l: "Attribution Required" },
                        { fa: "fa-brands fa-creative-commons-nc", l: "Non-Commercial" },
                        { fa: "fa-brands fa-creative-commons-sa", l: "Share Alike" }
                    ],
                    name: "CC BY-NC-SA",
                    allowsDerivatives: true,
                    commercial: false,
                    requiresSameShare: true
                },
                "7": {
                    fa: [
                        { fa: "fa-brands fa-creative-commons-zero", l: "CC0: Public Domain" }
                    ],
                    name: "CC0",
                    allowsDerivatives: true,
                    commercial: true,
                    public: true
                }
            }
        }
    },
    computed: {
        filteredDapps() {
            let filtered = this.availableDapps;
            
            // Filter by search query
            if (this.searchQuery.trim()) {
                const query = this.searchQuery.toLowerCase();
                filtered = filtered.filter(dapp => 
                    dapp.title.toLowerCase().includes(query) ||
                    dapp.author.toLowerCase().includes(query) ||
                    (dapp.description && dapp.description.toLowerCase().includes(query))
                );
            }
            
            // Filter by license
            if (this.licenseFilter !== 'all') {
                filtered = filtered.filter(dapp => {
                    const license = this.licenses[dapp.license];
                    if (this.licenseFilter === 'remixable') {
                        return license && license.allowsDerivatives;
                    }
                    return dapp.license === this.licenseFilter;
                });
            }
            
            return filtered;
        },
        
        remixableDapps() {
            return this.availableDapps.filter(dapp => {
                const license = this.licenses[dapp.license];
                return license && license.allowsDerivatives;
            });
        },
        
        totalModifications() {
            return Object.values(this.modificationFiles)
                .flat()
                .filter(item => Array.isArray(item) ? item.length > 0 : item !== null).length;
        },
        
        hasBaseDapp() {
            return this.selectedBaseDapp !== null;
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
        
        customJsonData() {
            try {
                return this.customJsonString ? JSON.parse(this.customJsonString) : {};
            } catch {
                return {};
            }
        },
        
        // Generate contracts array from modification files
        contractsArray() {
            const contracts = [];
            
            // Add entry point contract
            if (this.modificationFiles.entry && this.modificationFiles.entry.contractId) {
                contracts.push(this.modificationFiles.entry.contractId);
            }
            
            // Add all modification contracts
            Object.values(this.modificationFiles).forEach(category => {
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
            this.modificationFiles.assets.forEach(asset => {
                if (asset.cid) {
                    assets.push(asset.cid);
                }
            });
            return assets;
        },
        
        combinedRemixData() {
            // Build the complete JSON structure as requested
            const customJsonStructure = {
                app: "dlux/1.0.0b",
                dAppType: this.selectedDAppType,
                format: "markdown",
                assets: this.assetsArray,
                contracts: this.contractsArray,
                tags: ["dlux"],
                dappCID: this.dappCID || (this.modificationFiles.entry ? this.modificationFiles.entry.cid : ""),
                license: this.licenses[this.selectedLicense]?.name || "CC BY",
                attribution: this.attribution,
                // Include remix-specific data
                remixStructure: this.remixStructure,
                modificationFiles: this.modificationFiles
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
        selectedBaseDapp(newDapp) {
            if (newDapp) {
                this.setupRemixFromBase(newDapp);
            }
        },
        
        selectedLicense() {
            this.checkLicenseCompatibility();
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
        
        modificationFiles: {
            handler() {
                this.updateDappCID();
                this.emitDataUpdate();
            },
            deep: true
        },
        
        spkFileToAdd: {
            handler(newFile) {
                if (newFile) {
                    console.log('📁 SPK file received in ReMix manager:', newFile);
                    this.addModificationFile(newFile);
                }
            },
            immediate: false
        },
        
        pwaConfig: {
            handler() {
                this.emitDataUpdate();
            },
            deep: true
        }
    },
    mounted() {
        this.loadAvailableDapps();
        this.setupDragAndDrop();
        this.initializeFromProps();
    },
    methods: {
        initializeFromProps() {
            if (Object.keys(this.initialCustomJson).length > 0) {
                this.customJsonString = JSON.stringify(this.initialCustomJson, null, 2);
                
                // Load existing remix structure if present
                if (this.initialCustomJson.remixStructure) {
                    this.remixStructure = { ...this.remixStructure, ...this.initialCustomJson.remixStructure };
                }
                
                if (this.initialCustomJson.modificationFiles) {
                    this.modificationFiles = { ...this.modificationFiles, ...this.initialCustomJson.modificationFiles };
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
        
        // Load available dApps from blockchain
        async loadAvailableDapps() {
            this.loadingDapps = true;
            try {
                // TODO: Implement actual API call to fetch dApps from Hive blockchain
                // This would query for posts with custom_json dApp structure
                // and extract licensing information
                
                // Mock data for development
                this.availableDapps = [
                    {
                        id: 'dapp1',
                        title: 'Simple Calculator dApp',
                        author: 'devuser1',
                        permlink: 'simple-calculator-dapp',
                        description: 'A basic calculator built with HTML/CSS/JS',
                        license: '1', // CC BY
                        dappCID: 'QmSampleHash1',
                        created: '2024-01-01',
                        thumbnail: null,
                        files: ['index.html', 'style.css', 'script.js']
                    },
                    {
                        id: 'dapp2',
                        title: 'Photo Gallery dApp',
                        author: 'devuser2',
                        permlink: 'photo-gallery-dapp',
                        description: 'Interactive photo gallery with filtering',
                        license: '2', // CC BY-SA
                        dappCID: 'QmSampleHash2',
                        created: '2024-01-15',
                        thumbnail: null,
                        files: ['index.html', 'gallery.css', 'gallery.js', 'photos.json']
                    },
                    {
                        id: 'dapp3',
                        title: 'Task Manager',
                        author: 'devuser3',
                        permlink: 'task-manager-dapp',
                        description: 'Simple task management application',
                        license: '3', // CC BY-ND (not remixable)
                        dappCID: 'QmSampleHash3',
                        created: '2024-02-01',
                        thumbnail: null,
                        files: ['index.html', 'app.css', 'app.js']
                    }
                ];
                
                console.log('📱 Loaded available dApps:', this.availableDapps.length);
                
            } catch (error) {
                console.error('Failed to load available dApps:', error);
            } finally {
                this.loadingDapps = false;
            }
        },
        
        // Set up remix based on selected dApp
        setupRemixFromBase(baseDapp) {
            this.remixStructure.baseDapp = baseDapp;
            
            // Set up attribution chain - add base dApp to attribution
            this.attribution = [
                `${baseDapp.author}/${baseDapp.permlink}`
            ];
            
            // Set up remix structure attribution
            this.remixStructure.attribution = [
                {
                    author: baseDapp.author,
                    title: baseDapp.title,
                    permlink: baseDapp.permlink,
                    license: baseDapp.license,
                    timestamp: Date.now()
                }
            ];
            
            // Set default license based on base dApp license
            const baseLicense = this.licenses[baseDapp.license];
            if (baseLicense && baseLicense.requiresSameShare) {
                this.selectedLicense = baseDapp.license;
            }
            
            // Inherit dApp type from base if not set
            if (!this.selectedDAppType || this.selectedDAppType === 'APP') {
                // Could potentially detect type from base dApp metadata
                this.selectedDAppType = baseDapp.dAppType || 'APP';
            }
            
            this.checkLicenseCompatibility();
        },
        
        // Add modification files
        addModificationFile(fileData) {
            const fileName = fileData.fileName || fileData.name || fileData.filename || 'unknown';
            const fileType = this.getFileType(fileName);
            const category = this.getCategoryForFile(fileName, fileType);
            
            const fileObject = {
                cid: fileData.cid || fileData.hash || fileData.url,
                name: fileName,
                type: fileType,
                contractId: fileData.contractId || fileData.id || fileData.contract,
                size: fileData.size || 0,
                description: fileData.description || '',
                isModification: true
            };
            
            console.log(`📎 Adding modification file to category "${category}":`, fileObject);
            
            if (category === 'entry') {
                this.modificationFiles.entry = fileObject;
                this.dappCID = fileObject.cid; // Set dappCID when entry is added
            } else {
                if (!this.modificationFiles[category]) {
                    this.modificationFiles[category] = [];
                }
                this.modificationFiles[category].push(fileObject);
            }
            
            this.emitDataUpdate();
        },
        
        updateDappCID() {
            if (this.modificationFiles.entry && this.modificationFiles.entry.cid) {
                this.dappCID = this.modificationFiles.entry.cid;
            }
        },
        
        getFileType(fileName) {
            const extension = fileName.split('.').pop()?.toLowerCase();
            return extension || 'unknown';
        },
        
        getCategoryForFile(fileName, fileType) {
            const mapping = {
                'html': 'entry',
                'htm': 'entry',
                'js': 'scripts',
                'mjs': 'scripts',
                'ts': 'scripts',
                'css': 'styles',
                'scss': 'styles',
                'sass': 'styles',
                'less': 'styles',
                'json': 'data',
                'xml': 'data',
                'yaml': 'data',
                'yml': 'data',
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
                'webm': 'assets'
            };
            
            const mappedCategory = mapping[fileType];
            if (mappedCategory) return mappedCategory;
            
            // Special logic for entry files
            if (fileName.toLowerCase().includes('index') || fileName.toLowerCase().includes('main')) {
                if (['html', 'htm', 'js', 'mjs'].includes(fileType)) {
                    return 'entry';
                }
            }
            
            return 'other';
        },
        
        removeModificationFile(category, index = null) {
            if (category === 'entry') {
                this.modificationFiles.entry = null;
                this.dappCID = '';
            } else if (index !== null && this.modificationFiles[category]) {
                this.modificationFiles[category].splice(index, 1);
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
                { "src": "https://dlux.io/img/dlux-hive-logo-alpha.svg", "sizes": "192x192", "type": "image/svg+xml" },
                { "src": "https://dlux.io/img/dlux-logo-icon.png", "sizes": "695x695", "type": "image/png", "purpose": "any" },
                { "src": "https://dlux.io/img/dlux-icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" }
            ];
        },
        
        // License compatibility checking
        checkLicenseCompatibility() {
            this.licenseCompatibilityWarning = '';
            
            if (!this.selectedBaseDapp) return;
            
            const baseLicense = this.licenses[this.selectedBaseDapp.license];
            const selectedLicense = this.licenses[this.selectedLicense];
            
            if (!baseLicense || !baseLicense.allowsDerivatives) {
                this.licenseCompatibilityWarning = 'The selected base dApp does not allow derivatives.';
                return;
            }
            
            if (baseLicense.requiresSameShare && this.selectedLicense !== this.selectedBaseDapp.license) {
                this.licenseCompatibilityWarning = `The base dApp requires derivatives to use the same license (${baseLicense.name}).`;
                return;
            }
            
            if (!baseLicense.commercial && selectedLicense.commercial) {
                this.licenseCompatibilityWarning = 'Cannot use a commercial license for a derivative of a non-commercial work.';
                return;
            }
        },
        
        // Drag and drop
        setupDragAndDrop() {
            this.$nextTick(() => {
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
            });
        },
        
        preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        },
        
        handleDrop(e, category) {
            this.preventDefaults(e);
            
            // Check if this is a drag from SPK Drive
            const itemIds = e.dataTransfer.getData("itemids");
            const contractId = e.dataTransfer.getData("contractid");
            
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
                            
                            console.log('🎯 Processing dropped SPK file for remix category:', category, spkFileData);
                            this.addModificationFile(spkFileData);
                        }
                    });
                } catch (error) {
                    console.error('Failed to parse dropped SPK file IDs:', error);
                }
                return;
            }
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
        
        // Data emission
        emitDataUpdate() {
            // Update the custom JSON string to reflect current structure
            this.customJsonString = JSON.stringify(this.combinedRemixData, null, 2);
            this.$emit('remix-updated', this.combinedRemixData);
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
                'scripts': 'fa-brands fa-js',
                'styles': 'fa-brands fa-css3-alt',
                'data': 'fa-solid fa-database',
                'other': 'fa-solid fa-folder'
            };
            
            return iconMap[category] || 'fa-solid fa-folder';
        },
        
        formatDate(dateString) {
            return new Date(dateString).toLocaleDateString();
        }
    },
    
    template: `
        <div class="remix-dapp-manager">
            <!-- Header -->
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h6 class="mb-0">
                    <i class="fa-solid fa-shuffle fa-fw me-2"></i>ReMix dApp Manager
                </h6>
                <div class="text-muted small" v-if="hasBaseDapp">
                    Remixing: {{ selectedBaseDapp.title }}
                </div>
            </div>
            
            <!-- Base dApp Selection -->
            <div v-if="!hasBaseDapp" class="mb-4">
                <!-- Search and Filter -->
                <div class="row g-3 mb-3">
                    <div class="col-md-8">
                        <div class="input-group">
                            <span class="input-group-text bg-darker text-white border-secondary">
                                <i class="fa-solid fa-search"></i>
                            </span>
                            <input 
                                v-model="searchQuery"
                                type="text" 
                                class="form-control bg-darker text-white border-secondary"
                                placeholder="Search dApps by title, author, or description...">
                        </div>
                    </div>
                    <div class="col-md-4">
                        <select v-model="licenseFilter" class="form-select bg-darker text-white border-secondary">
                            <option value="all">All Licenses</option>
                            <option value="remixable">Remixable Only</option>
                            <option v-for="(license, id) in licenses" :key="id" :value="id">
                                {{ license.name }}
                            </option>
                        </select>
                    </div>
                </div>
                
                <!-- Available dApps -->
                <div class="card bg-darker">
                    <div class="card-header">
                        <h6 class="mb-0">
                            <i class="fa-solid fa-mobile-screen-button fa-fw me-2"></i>
                            Available dApps to ReMix
                            <span class="badge bg-secondary ms-2">{{ filteredDapps.length }}</span>
                        </h6>
                    </div>
                    <div class="card-body">
                        <div v-if="loadingDapps" class="text-center py-4">
                            <i class="fa-solid fa-spinner fa-spin fa-2x mb-2"></i>
                            <p>Loading available dApps...</p>
                        </div>
                        
                        <div v-else-if="filteredDapps.length === 0" class="text-center py-4 text-muted">
                            <i class="fa-solid fa-search fa-2x mb-2"></i>
                            <p>No dApps found matching your criteria</p>
                        </div>
                        
                        <div v-else class="row g-3">
                            <div v-for="dapp in filteredDapps" :key="dapp.id" class="col-md-6">
                                <div class="card bg-secondary h-100" 
                                     :class="{ 'border-warning': !licenses[dapp.license]?.allowsDerivatives }">
                                    <div class="card-body">
                                        <div class="d-flex justify-content-between align-items-start mb-2">
                                            <h6 class="card-title mb-0">{{ dapp.title }}</h6>
                                            <div class="d-flex align-items-center gap-1">
                                                <span v-for="icon in licenses[dapp.license]?.fa || []" :key="icon.fa">
                                                    <i :class="icon.fa" :title="icon.l" class="small"></i>
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <p class="small text-muted mb-2">
                                            by @{{ dapp.author }} • {{ formatDate(dapp.created) }}
                                        </p>
                                        
                                        <p class="small mb-3">{{ dapp.description }}</p>
                                        
                                        <div class="small text-muted mb-3">
                                            <i class="fa-solid fa-file fa-fw me-1"></i>
                                            {{ dapp.files.length }} files
                                        </div>
                                        
                                        <div v-if="!licenses[dapp.license]?.allowsDerivatives" 
                                             class="alert alert-warning py-2 mb-2">
                                            <small>
                                                <i class="fa-solid fa-exclamation-triangle fa-fw me-1"></i>
                                                No derivatives allowed
                                            </small>
                                        </div>
                                        
                                        <button 
                                            type="button"
                                            class="btn btn-primary btn-sm w-100"
                                            :disabled="!licenses[dapp.license]?.allowsDerivatives"
                                            @click="selectedBaseDapp = dapp">
                                            <i class="fa-solid fa-shuffle fa-fw me-1"></i>
                                            ReMix This dApp
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- ReMix Interface (shown after selecting base dApp) -->
            <div v-if="hasBaseDapp">
                <!-- Base dApp Info -->
                <div class="card bg-darker mb-3">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">
                            <i class="fa-solid fa-code-fork fa-fw me-2"></i>
                            Base dApp: {{ selectedBaseDapp.title }}
                        </h6>
                        <button type="button" 
                                class="btn btn-sm btn-outline-secondary"
                                @click="selectedBaseDapp = null">
                            <i class="fa-solid fa-arrow-left fa-fw me-1"></i>
                            Choose Different dApp
                        </button>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-8">
                                <p class="mb-1"><strong>Author:</strong> @{{ selectedBaseDapp.author }}</p>
                                <p class="mb-1"><strong>License:</strong> {{ licenses[selectedBaseDapp.license]?.name }}</p>
                                <p class="mb-1"><strong>Description:</strong> {{ selectedBaseDapp.description }}</p>
                                <p class="mb-0"><strong>Files:</strong> {{ selectedBaseDapp.files.join(', ') }}</p>
                            </div>
                            <div class="col-md-4">
                                <div class="d-flex align-items-center gap-2">
                                    <span v-for="icon in licenses[selectedBaseDapp.license]?.fa || []" :key="icon.fa">
                                        <i :class="icon.fa" :title="icon.l"></i>
                                    </span>
                                    <span class="fw-bold">{{ licenses[selectedBaseDapp.license]?.name }}</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Attribution Chain -->
                        <div v-if="remixStructure.attribution.length > 0" class="mt-3">
                            <small class="text-muted">Attribution Chain:</small>
                            <div v-for="attr in remixStructure.attribution" :key="attr.timestamp" class="small text-muted">
                                "{{ attr.title }}" by @{{ attr.author }} ({{ licenses[attr.license]?.name }})
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- License Compatibility Warning -->
                <div v-if="licenseCompatibilityWarning" class="alert alert-warning mb-3">
                    <i class="fa-solid fa-exclamation-triangle fa-fw me-1"></i>
                    {{ licenseCompatibilityWarning }}
                </div>
                
                <!-- dApp Type & Metadata -->
                <div class="card bg-darker mb-3">
                    <div class="card-header">
                        <h6 class="mb-0">
                            <i class="fa-solid fa-tag fa-fw me-2"></i>ReMix Type & Metadata
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
                                No additional referenced works to attribute
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
                                <input class="form-check-input" type="checkbox" v-model="pwaConfig.enabled" id="pwaEnabledRemix">
                                <label class="form-check-label" for="pwaEnabledRemix">
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
                                        <input class="form-check-input" type="checkbox" v-model="pwaConfig.enableServiceWorker" id="swEnabledRemix">
                                        <label class="form-check-label" for="swEnabledRemix">
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
                                        No additional URLs to precache. Your entry point and modifications will be automatically cached.
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
                        PWA features are disabled. Enable them to configure Progressive Web App settings, service worker, and app icons for your remix.
                    </div>
                </div>
                
                <!-- Modification Files -->
                <div class="card bg-darker mb-3">
                    <div class="card-header">
                        <h6 class="mb-0">
                            <i class="fa-solid fa-edit fa-fw me-2"></i>
                            Your Modifications
                            <span class="badge bg-secondary ms-2">{{ totalModifications }}</span>
                        </h6>
                    </div>
                    <div class="card-body">
                        <div class="row g-3">
                            <!-- Entry Point Override -->
                            <div class="col-12">
                                <div class="card bg-secondary" data-drop-category="entry">
                                    <div class="card-header">
                                        <h6 class="mb-0">
                                            <i class="fa-solid fa-home fa-fw me-2"></i>
                                            Entry Point Override
                                            <span v-if="modificationFiles.entry" class="badge bg-success ms-2">Modified</span>
                                        </h6>
                                    </div>
                                    <div class="card-body" style="min-height: 80px;">
                                        <div v-if="!modificationFiles.entry" class="drop-zone text-center py-2">
                                            <i class="fa-solid fa-plus fa-lg mb-1 text-muted"></i>
                                            <p class="mb-0 small text-muted">Drop your custom entry file here to override the original</p>
                                        </div>
                                        <div v-else class="d-flex justify-content-between align-items-center">
                                            <div class="d-flex align-items-center">
                                                <i :class="getFileIcon(modificationFiles.entry.type)" class="fa-fw me-2"></i>
                                                <div>
                                                    <div class="fw-bold">{{ modificationFiles.entry.name }}</div>
                                                    <small class="text-muted">{{ modificationFiles.entry.type.toUpperCase() }} • Override</small>
                                                </div>
                                            </div>
                                            <button type="button" 
                                                    class="btn btn-sm btn-outline-danger"
                                                    @click="removeModificationFile('entry')">
                                                <i class="fa-solid fa-trash fa-fw"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Other Modification Categories -->
                            <div v-for="category in ['assets', 'scripts', 'styles', 'data', 'other']" 
                                 :key="category" class="col-md-6">
                                <div class="card bg-secondary" :data-drop-category="category">
                                    <div class="card-header">
                                        <h6 class="mb-0">
                                            <i :class="getCategoryIcon(category)" class="fa-fw me-2"></i>
                                            {{ category.charAt(0).toUpperCase() + category.slice(1) }}
                                            <span class="badge bg-dark ms-2">{{ modificationFiles[category]?.length || 0 }}</span>
                                        </h6>
                                    </div>
                                    <div class="card-body" style="min-height: 100px;">
                                        <div v-if="!modificationFiles[category] || modificationFiles[category].length === 0" 
                                             class="drop-zone text-center py-2">
                                            <i class="fa-solid fa-plus fa-lg mb-1 text-muted"></i>
                                            <p class="mb-0 small text-muted">Add/override files</p>
                                        </div>
                                        <div v-else>
                                            <div v-for="(file, index) in modificationFiles[category]" 
                                                 :key="index" 
                                                 class="d-flex justify-content-between align-items-center mb-1 p-1 bg-dark rounded">
                                                <div class="d-flex align-items-center">
                                                    <i :class="getFileIcon(file.type)" class="fa-fw me-1 small"></i>
                                                    <div>
                                                        <div class="small fw-bold">{{ file.name }}</div>
                                                    </div>
                                                </div>
                                                <button type="button" 
                                                        class="btn btn-sm btn-outline-danger"
                                                        @click="removeModificationFile(category, index)">
                                                    <i class="fa-solid fa-trash fa-fw"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- SPK Drive Integration Note -->
                        <div class="alert alert-info mt-3 mb-0">
                            <i class="fa-solid fa-info-circle fa-fw me-1"></i>
                            <strong>Tip:</strong> Drag files from "Your Files" section above to add modifications to your remix.
                            These files will be added to or replace the original dApp files.
                        </div>
                    </div>
                </div>
                
                <!-- Remix Licensing -->
                <div class="card bg-darker mb-3">
                    <div class="card-header">
                        <h6 class="mb-0">
                            <i class="fa-brands fa-creative-commons fa-fw me-2"></i>
                            ReMix Licensing
                        </h6>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label class="form-label">License for Your ReMix:</label>
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
                            rows="6"
                            placeholder="Enter additional custom JSON data for your remix..."
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
            </div>
            
            <!-- Empty State -->
            <div v-if="!hasBaseDapp && !loadingDapps && remixableDapps.length === 0" class="text-center py-5">
                <i class="fa-solid fa-mobile-screen-button fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">No Remixable dApps Available</h5>
                <p class="text-muted">No dApps with compatible licensing are currently available for remixing</p>
            </div>
        </div>
    `
};

// Make component available globally
if (typeof window !== 'undefined') {
    window.RemixDappManager = RemixDappManager;
}

export default RemixDappManager; 