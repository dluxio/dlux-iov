// 360° Asset Manager Component
// Provides drag-and-drop asset management, canvas editing for focus/horizon adjustment,
// and navigation sphere placement for 360° gallery posts

const Asset360Manager = {
    name: 'Asset360Manager',
    props: {
        account: String,
        spkApi: Object,
        initialAssets: {
            type: Array,
            default: () => []
        },
        initialNavigation: {
            type: Array,
            default: () => []
        },
        spkFileToAdd: {
            type: Object,
            default: null
        }
    },
    data() {
        return {
            assets: [...this.initialAssets],
            navigation: [...this.initialNavigation],
            selectedAssetIndex: 0,
            editMode: 'focus', // 'focus' or 'navigation'
            draggedFiles: [],
            uploadProgress: {},
            canvasWidth: 800,
            canvasHeight: 400,
            currentRotation: { x: 0, y: 0, z: 0 },
            isPlacingNavigation: false,
            showTargetSelection: false,
            pendingNavigation: null,
            previewScale: 1,
            mouseDown: false,
            lastMousePos: { x: 0, y: 0 },
            
            // Navigation placement state
            navSpheresVisible: true,
            selectedNavIndex: -1,
            
            // File type filters for 360° images
            acceptedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        }
    },
    computed: {
        currentAsset() {
            return this.assets[this.selectedAssetIndex] || null;
        },
        navigationForCurrentAsset() {
            return this.navigation.filter(nav => nav.fromIndex === this.selectedAssetIndex);
        },
        canvasStyle() {
            let cursor = 'grab';
            if (this.editMode === 'navigation' && this.isPlacingNavigation) {
                cursor = 'crosshair';
            } else if (this.editMode === 'focus') {
                cursor = this.mouseDown ? 'grabbing' : 'grab';
            }
            
            return {
                width: `${this.canvasWidth}px`,
                height: `${this.canvasHeight}px`,
                border: '2px solid #495057',
                borderRadius: '8px',
                cursor: cursor,
                touchAction: 'none' // Prevent default touch behaviors
            };
        }
    },
            watch: {
        selectedAssetIndex(newIndex) {
            this.loadAssetOnCanvas(newIndex);
            // Re-initialize canvas to ensure event listeners are working
            this.$nextTick(() => {
                this.initializeCanvas();
            });
        },
        currentRotation: {
            handler() {
                this.updateAssetRotation();
                this.redrawCanvas();
            },
            deep: true
        },
        spkFileToAdd: {
            handler(newFile) {
                if (newFile) {
                    console.log('📁 SPK file received in 360° manager:', newFile);
                    this.addAssetFromSPK(newFile);
                }
            },
            immediate: false
        }
    },
    mounted() {
        this.$nextTick(() => {
            this.initializeCanvas();
            this.setupDragAndDrop();
            
            // Normalize existing navigation coordinates to use toFixed(1) precision
            this.normalizeNavigationPrecision();
            
            if (this.assets.length > 0) {
                this.loadAssetOnCanvas(0);
            }
        });
    },
    methods: {
        // Canvas initialization and management
        initializeCanvas() {
            const canvas = this.$refs.canvas;
            if (!canvas) {
                console.warn('⚠️ Canvas ref not found during initialization');
                return;
            }
            
            console.log('🎨 Initializing canvas with event listeners');
            
            const ctx = canvas.getContext('2d');
            canvas.width = this.canvasWidth;
            canvas.height = this.canvasHeight;
            
            // Remove existing event listeners to prevent duplicates
            canvas.removeEventListener('mousedown', this.onCanvasMouseDown);
            canvas.removeEventListener('mousemove', this.onCanvasMouseMove);
            canvas.removeEventListener('mouseup', this.onCanvasMouseUp);
            canvas.removeEventListener('click', this.onCanvasClick);
            canvas.removeEventListener('wheel', this.onCanvasWheel);
            
            // Set up canvas event listeners
            canvas.addEventListener('mousedown', this.onCanvasMouseDown);
            canvas.addEventListener('mousemove', this.onCanvasMouseMove);
            canvas.addEventListener('mouseup', this.onCanvasMouseUp);
            canvas.addEventListener('click', this.onCanvasClick);
            canvas.addEventListener('wheel', this.onCanvasWheel, { passive: false });
            
            console.log('✅ Canvas event listeners attached');
        },
        
        // Load 360° image onto canvas
        async loadAssetOnCanvas(assetIndex) {
            if (!this.assets[assetIndex]) return;
            
            const canvas = this.$refs.canvas;
            const ctx = canvas.getContext('2d');
            const asset = this.assets[assetIndex];
            
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            try {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                
                img.onload = () => {
                    // Store image for redraws
                    this.currentImage = img;
                    this.currentRotation = asset.rotation || { x: 0, y: 0, z: 0 };
                    this.redrawCanvas();
                };
                
                img.onerror = () => {
                    console.error('Failed to load image:', asset.url);
                    ctx.fillStyle = '#495057';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = '#fff';
                    ctx.font = '16px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('Failed to load image', canvas.width / 2, canvas.height / 2);
                };
                
                // Load image from IPFS or direct URL
                const imageUrl = asset.url.startsWith('Qm') ? 
                    `https://ipfs.dlux.io/ipfs/${asset.url}` : asset.url;
                img.src = imageUrl;
                
            } catch (error) {
                console.error('Error loading asset on canvas:', error);
            }
        },
        
        // Redraw canvas with current rotation and overlays
        redrawCanvas() {
            if (!this.currentImage) return;
            
            const canvas = this.$refs.canvas;
            const ctx = canvas.getContext('2d');
            
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Save context state
            ctx.save();
            
            // Apply 3D rotation transforms (X, Y, Z)
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            
            ctx.translate(centerX, centerY);
            
            // Apply rotations properly for 360° image viewing
            // Note: Y rotation (panning) is now handled in drawWrappedImage for seamless wrapping
            
            // Z rotation (roll) - rotate the entire view
            if (this.currentRotation.z) {
                ctx.rotate(this.currentRotation.z * Math.PI / 180);
            }
            
            // X rotation (pitch) - simulate up/down tilt
            if (this.currentRotation.x) {
                const pitchRadians = this.currentRotation.x * Math.PI / 180;
                const offsetY = Math.sin(pitchRadians) * canvas.height * 0.3;
                const scaleY = Math.cos(pitchRadians);
                
                ctx.translate(0, offsetY);
                ctx.scale(1, Math.max(0.1, scaleY)); // Prevent negative scaling
            }
            
            ctx.translate(-centerX, -centerY);
            
            // Draw the equirectangular image with wrapping/tiling for seamless 360° experience
            this.drawWrappedImage(ctx, canvas);
            
            // Restore context
            ctx.restore();
            
            // Draw horizon line if enabled
            this.drawHorizonLine();
            
            // Draw navigation spheres
            if (this.navSpheresVisible && this.editMode === 'navigation') {
                this.drawNavigationSpheres();
            }
            
            // Draw crosshair for focus point
            if (this.editMode === 'focus') {
                this.drawCrosshair();
            }
        },
        
        // Draw wrapped/tiled image for seamless 360° panning
        drawWrappedImage(ctx, canvas) {
            if (!this.currentImage) return;
            
            const imageWidth = canvas.width;
            const imageHeight = canvas.height;
            
            // For 360° images, we want seamless horizontal wrapping
            // Calculate the pan offset based on Y rotation
            const normalizedRotation = ((this.currentRotation.y % 360) + 360) % 360;
            const panOffset = (normalizedRotation / 360) * imageWidth;
            
            // Draw the main image
            ctx.drawImage(this.currentImage, -panOffset, 0, imageWidth, imageHeight);
            
            // Draw wrapped copies for seamless transition
            if (panOffset > 0) {
                // If panned to the right, draw image on the left side
                ctx.drawImage(this.currentImage, -panOffset + imageWidth, 0, imageWidth, imageHeight);
            }
            if (panOffset < imageWidth) {
                // If there's space on the right, draw image on the right side
                ctx.drawImage(this.currentImage, -panOffset - imageWidth, 0, imageWidth, imageHeight);
            }
        },
        
        // Draw horizon reference line
        drawHorizonLine() {
            const canvas = this.$refs.canvas;
            const ctx = canvas.getContext('2d');
            
            ctx.save();
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 5]);
            ctx.beginPath();
            ctx.moveTo(0, canvas.height / 2);
            ctx.lineTo(canvas.width, canvas.height / 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
        },
        
        // Draw center crosshair for focus adjustment
        drawCrosshair() {
            const canvas = this.$refs.canvas;
            const ctx = canvas.getContext('2d');
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            
            ctx.save();
            ctx.strokeStyle = '#4ECDC4';
            ctx.lineWidth = 2;
            ctx.beginPath();
            // Horizontal line
            ctx.moveTo(centerX - 20, centerY);
            ctx.lineTo(centerX + 20, centerY);
            // Vertical line
            ctx.moveTo(centerX, centerY - 20);
            ctx.lineTo(centerX, centerY + 20);
            ctx.stroke();
            ctx.restore();
        },
        
        // Draw navigation spheres on canvas
        drawNavigationSpheres() {
            const canvas = this.$refs.canvas;
            const ctx = canvas.getContext('2d');
            
            this.navigationForCurrentAsset.forEach((nav, index) => {
                const pos = this.sphericalToCanvas(nav.position);
                
                ctx.save();
                
                // Draw sphere
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, 12, 0, 2 * Math.PI);
                ctx.fillStyle = index === this.selectedNavIndex ? '#E91E63' : '#4ECDC4';
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // Draw label
                if (nav.label) {
                    ctx.fillStyle = '#fff';
                    ctx.font = '12px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(nav.label, pos.x, pos.y - 18);
                }
                
                ctx.restore();
            });
        },
        
        // Convert spherical coordinates to canvas position
        sphericalToCanvas(sphericalPos) {
            const { phi, theta, radius } = sphericalPos;
            
            // Convert spherical coordinates to equirectangular projection
            const x = ((phi + 180) / 360) * this.canvasWidth;
            const y = ((theta) / 180) * this.canvasHeight;
            
            return { x: Math.max(0, Math.min(this.canvasWidth, x)), 
                     y: Math.max(0, Math.min(this.canvasHeight, y)) };
        },
        
        // Convert canvas position to spherical coordinates
        canvasToSpherical(canvasPos) {
            const phi = (canvasPos.x / this.canvasWidth) * 360 - 180;
            const theta = (canvasPos.y / this.canvasHeight) * 180;
            
            return {
                phi: parseFloat(Math.max(-180, Math.min(180, phi)).toFixed(1)),
                theta: parseFloat(Math.max(0, Math.min(180, theta)).toFixed(1)),
                radius: 8 // Default radius
            };
        },
        
        // Canvas mouse event handlers
        onCanvasMouseDown(event) {
            console.log('🖱️ Canvas mouse down');
            this.mouseDown = true;
            const rect = event.target.getBoundingClientRect();
            this.lastMousePos = {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
            };
        },
        
        onCanvasMouseMove(event) {
            if (!this.mouseDown) return;
            if (this.editMode !== 'focus') return;
            
            console.log('🖱️ Canvas mouse move - dragging');
            
            const rect = event.target.getBoundingClientRect();
            const currentPos = {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
            };
            
            // Calculate rotation delta
            const deltaX = currentPos.x - this.lastMousePos.x;
            const deltaY = currentPos.y - this.lastMousePos.y;
            
            // Update rotation
            this.currentRotation.y += deltaX * 0.5;
            this.currentRotation.x += deltaY * 0.5;
            
            // Clamp rotation values
            this.currentRotation.y = this.currentRotation.y % 360;
            this.currentRotation.x = Math.max(-90, Math.min(90, this.currentRotation.x));
            
            this.lastMousePos = currentPos;
        },
        
        onCanvasMouseUp() {
            console.log('🖱️ Canvas mouse up');
            this.mouseDown = false;
        },
        
        onCanvasClick(event) {
            console.log('🖱️ Canvas clicked! Event received:', event.type, {
                editMode: this.editMode,
                isPlacingNavigation: this.isPlacingNavigation,
                pendingNavigation: this.pendingNavigation,
                target: event.target.tagName,
                timestamp: Date.now()
            });
            
            if (this.editMode !== 'navigation' || !this.isPlacingNavigation) {
                console.log('❌ Not in navigation placement mode');
                return;
            }
            
            const rect = event.target.getBoundingClientRect();
            const canvasPos = {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
            };
            
            const sphericalPos = this.canvasToSpherical(canvasPos);
            console.log('🌐 Canvas position converted to spherical:', { canvasPos, sphericalPos });
            
            if (this.pendingNavigation) {
                // Complete navigation placement
                this.pendingNavigation.position = sphericalPos;
                this.pendingNavigation.label = `To ${this.assets[this.pendingNavigation.toIndex]?.title}`;
                
                this.navigation.push({ ...this.pendingNavigation });
                
                console.log('✅ Navigation link placed:', this.pendingNavigation);
                console.log('📍 All navigation links:', this.navigation);
                
                this.pendingNavigation = null;
                this.isPlacingNavigation = false;
                this.redrawCanvas();
                this.emitDataUpdate();
            } else {
                console.log('❌ No pending navigation to place');
            }
        },
        
        onCanvasWheel(event) {
            event.preventDefault();
            // Zoom functionality could be added here
        },
        
        // Drag and drop functionality
        setupDragAndDrop() {
            const dropZone = this.$refs.dropZone;
            if (!dropZone) return;
            
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                dropZone.addEventListener(eventName, this.preventDefaults, false);
            });
            
            ['dragenter', 'dragover'].forEach(eventName => {
                dropZone.addEventListener(eventName, this.highlight, false);
            });
            
            ['dragleave', 'drop'].forEach(eventName => {
                dropZone.addEventListener(eventName, this.unhighlight, false);
            });
            
            dropZone.addEventListener('drop', this.handleDrop, false);
        },
        
        preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        },
        
        highlight() {
            this.$refs.dropZone.classList.add('dragover');
        },
        
        unhighlight() {
            this.$refs.dropZone.classList.remove('dragover');
        },
        
        handleDrop(e) {
            this.preventDefaults(e);
            this.unhighlight();
            
            // Check if this is a drag from SPK Drive
            const itemIds = e.dataTransfer.getData("itemids");
            const contractId = e.dataTransfer.getData("contractid");
            
            if (itemIds && contractId) {
                console.log('📁 SPK files dropped on 360° manager:', { itemIds, contractId });
                
                try {
                    const parsedIds = JSON.parse(itemIds);
                    // Handle each file ID
                    parsedIds.forEach(fileId => {
                        if (!fileId.startsWith('folder-')) {
                            // Create SPK file data format with proper metadata lookup
                            // This should match the data structure from actual SPK file operations
                            const spkFileData = {
                                cid: fileId,
                                hash: fileId,
                                url: fileId,
                                name: fileId, // Will be enhanced by parent component
                                filename: fileId,
                                contractId: contractId,
                                contract: contractId,
                                id: contractId,
                                // Signal that this is from drag/drop and needs metadata lookup
                                fromDragDrop: true
                            };
                            
                            console.log('🎯 Processing dropped SPK file:', spkFileData);
                            this.addAssetFromSPK(spkFileData);
                        }
                    });
                } catch (error) {
                    console.error('Failed to parse dropped SPK file IDs:', error);
                }
                return;
            }
            
            // Handle regular file drops
            const files = Array.from(e.dataTransfer.files);
            this.processFiles(files);
        },
        
        onFileInputChange(event) {
            const files = Array.from(event.target.files);
            this.processFiles(files);
        },
        
        // Process uploaded files
        processFiles(files) {
            const imageFiles = files.filter(file => 
                this.acceptedTypes.includes(file.type));
            
            if (imageFiles.length === 0) {
                alert('Please upload valid image files (JPEG, PNG, WebP)');
                return;
            }
            
            imageFiles.forEach(this.uploadFile);
        },
        
        // Upload file to SPK network (integration point)
        async uploadFile(file) {
            // TODO: Integrate with SPK upload system
            // This should use the same upload mechanism as contract-vue component
            
            const uploadId = Date.now() + Math.random();
            this.uploadProgress[uploadId] = { progress: 0, file: file.name };
            
            try {
                // Simulate upload process - replace with actual SPK upload
                console.log('Uploading file to SPK network:', file.name);
                
                // Create preview URL for immediate display
                const previewUrl = URL.createObjectURL(file);
                
                // Add asset to collection
                const newAsset = {
                    index: this.assets.length,
                    url: previewUrl, // Will be replaced with IPFS hash after upload
                    thumb: previewUrl, // Will be replaced with thumbnail hash
                    rotation: { x: 0, y: 0, z: 0 },
                    title: file.name.replace(/\.[^/.]+$/, ""),
                    description: '',
                    uploadId: uploadId,
                    status: 'uploading'
                };
                
                this.assets.push(newAsset);
                
                // Select newly added asset
                this.selectedAssetIndex = this.assets.length - 1;
                
                // Simulate upload progress
                const progressInterval = setInterval(() => {
                    this.uploadProgress[uploadId].progress += 10;
                    if (this.uploadProgress[uploadId].progress >= 100) {
                        clearInterval(progressInterval);
                        delete this.uploadProgress[uploadId];
                        newAsset.status = 'uploaded';
                        // TODO: Replace previewUrl with actual IPFS hash
                    }
                }, 200);
                
                this.emitDataUpdate();
                
            } catch (error) {
                console.error('Upload failed:', error);
                delete this.uploadProgress[uploadId];
            }
        },
        
        // Asset management methods
        removeAsset(index) {
            if (confirm('Remove this asset? This will also remove any associated navigation links.')) {
                // Remove navigation links involving this asset
                this.navigation = this.navigation.filter(nav => 
                    nav.fromIndex !== index && nav.toIndex !== index);
                
                // Remove asset
                this.assets.splice(index, 1);
                
                // Update indices
                this.reindexAssets();
                
                // Adjust selected index
                if (this.selectedAssetIndex >= this.assets.length) {
                    this.selectedAssetIndex = Math.max(0, this.assets.length - 1);
                }
                
                this.emitDataUpdate();
            }
        },
        
        reindexAssets() {
            // Update asset indices
            this.assets.forEach((asset, index) => {
                const oldIndex = asset.index;
                asset.index = index;
                
                // Update navigation references
                this.navigation.forEach(nav => {
                    if (nav.fromIndex === oldIndex) nav.fromIndex = index;
                    if (nav.toIndex === oldIndex) nav.toIndex = index;
                });
            });
        },
        
        updateAssetRotation() {
            if (this.currentAsset) {
                this.currentAsset.rotation = { ...this.currentRotation };
                this.emitDataUpdate();
            }
        },
        
        updateAssetTitle(index, title) {
            if (this.assets[index]) {
                this.assets[index].title = title;
                this.emitDataUpdate();
            }
        },
        
        updateAssetDescription(index, description) {
            if (this.assets[index]) {
                this.assets[index].description = description;
                this.emitDataUpdate();
            }
        },
        
        // Navigation management
        startNavigationPlacement() {
            if (this.assets.length < 2) {
                alert('You need at least 2 assets to create navigation links.');
                return;
            }
            
            // Show target selection instead of auto-selecting next
            this.showTargetSelection = true;
        },
        
        selectNavigationTarget(targetIndex) {
            if (targetIndex === this.selectedAssetIndex) {
                alert('Cannot link to the same asset');
                return;
            }
            
            this.isPlacingNavigation = true;
            this.showTargetSelection = false;
            this.pendingNavigation = {
                fromIndex: this.selectedAssetIndex,
                toIndex: targetIndex,
                position: { phi: 0, theta: 90, radius: 8 },
                label: `To ${this.assets[targetIndex]?.title || 'Asset ' + (targetIndex + 1)}`,
                description: ''
            };
        },
        
        cancelNavigationPlacement() {
            this.isPlacingNavigation = false;
            this.showTargetSelection = false;
            this.pendingNavigation = null;
        },
        
        getNextAssetIndex() {
            return (this.selectedAssetIndex + 1) % this.assets.length;
        },
        
        removeNavigation(navItemOrIndex) {
            // Handle removing navigation either by index in full array or by nav item
            if (typeof navItemOrIndex === 'number') {
                // Remove by index from full navigation array
                this.navigation.splice(navItemOrIndex, 1);
            } else {
                // Remove by finding the nav item in the full array
                const fullIndex = this.navigation.indexOf(navItemOrIndex);
                if (fullIndex > -1) {
                    this.navigation.splice(fullIndex, 1);
                }
            }
            this.redrawCanvas();
            this.emitDataUpdate();
        },
        
        editNavigation(index) {
            this.selectedNavIndex = index;
            // Navigation editing UI would open here
        },
        
        // Utility methods
        resetRotation() {
            this.currentRotation = { x: 0, y: 0, z: 0 };
        },
        
        // Data emission for parent component integration
        emitDataUpdate() {
            // Ensure navigation connectivity before emitting
            this.ensureNavigationConnectivity();
            
            this.$emit('assets-updated', {
                assets: this.assets.map(asset => ({
                    ...asset,
                    // Remove UI-specific properties
                    uploadId: undefined,
                    status: undefined
                })).filter(asset => asset.status !== 'uploading'),
                navigation: this.navigation
            });
        },
        
        // Ensure complete navigation connectivity
        ensureNavigationConnectivity() {
            if (this.assets.length < 2) return; // Need at least 2 assets for navigation

            console.log('🔗 Checking navigation connectivity...');
            
            // Step 1: Ensure every asset has at least one outgoing link
            this.ensureEveryAssetHasNavigation();
            
            // Step 2: Ensure the navigation graph is connected (you can reach any photo from any other)
            this.ensureNetworkConnectivity();
            
            console.log('✅ Navigation connectivity ensured');
        },

        // Ensure every asset has at least one outgoing navigation link
        ensureEveryAssetHasNavigation() {
            for (let i = 0; i < this.assets.length; i++) {
                const hasOutgoingNav = this.navigation.some(nav => nav.fromIndex === i);
                
                if (!hasOutgoingNav) {
                    // Add navigation to the next asset (circular)
                    const targetIndex = (i + 1) % this.assets.length;
                    
                    const autoNav = {
                        fromIndex: i,
                        toIndex: targetIndex,
                        position: this.generateDefaultNavPosition(i, targetIndex),
                        label: `To ${this.assets[targetIndex]?.title || 'Next Photo'}`,
                        description: 'Auto-generated navigation',
                        autoGenerated: true
                    };
                    
                    this.navigation.push(autoNav);
                    console.log(`🔗 Auto-generated navigation from asset ${i} to ${targetIndex}`);
                }
            }
        },

        // Ensure the navigation network is fully connected using graph connectivity
        ensureNetworkConnectivity() {
            if (this.assets.length < 2) return;

            // Build adjacency list representation of the navigation graph
            const adjacencyList = {};
            for (let i = 0; i < this.assets.length; i++) {
                adjacencyList[i] = [];
            }
            
            this.navigation.forEach(nav => {
                if (!adjacencyList[nav.fromIndex].includes(nav.toIndex)) {
                    adjacencyList[nav.fromIndex].push(nav.toIndex);
                }
            });

            // Check connectivity using BFS from each node
            const isConnected = this.isGraphConnected(adjacencyList);
            
            if (!isConnected) {
                console.log('⚠️ Navigation graph is not fully connected, adding missing links...');
                this.addMissingConnections(adjacencyList);
            }
        },

        // Check if the navigation graph is connected (all nodes reachable from any node)
        isGraphConnected(adjacencyList) {
            const visited = new Set();
            const queue = [0]; // Start from first asset
            visited.add(0);

            // BFS to find all reachable nodes
            while (queue.length > 0) {
                const current = queue.shift();
                
                adjacencyList[current].forEach(neighbor => {
                    if (!visited.has(neighbor)) {
                        visited.add(neighbor);
                        queue.push(neighbor);
                    }
                });
            }

            // Check if all assets are reachable
            return visited.size === this.assets.length;
        },

        // Add missing connections to make the graph connected
        addMissingConnections(adjacencyList) {
            // Find disconnected components
            const visited = new Set();
            const components = [];

            for (let i = 0; i < this.assets.length; i++) {
                if (!visited.has(i)) {
                    const component = [];
                    this.dfsComponent(i, adjacencyList, visited, component);
                    components.push(component);
                }
            }

            // Connect components by adding links between them
            for (let i = 1; i < components.length; i++) {
                const fromComponent = components[i - 1];
                const toComponent = components[i];
                
                // Connect the last node of previous component to first node of next component
                const fromIndex = fromComponent[fromComponent.length - 1];
                const toIndex = toComponent[0];
                
                const connectingNav = {
                    fromIndex,
                    toIndex,
                    position: this.generateDefaultNavPosition(fromIndex, toIndex),
                    label: `To ${this.assets[toIndex]?.title || 'Photo ' + (toIndex + 1)}`,
                    description: 'Auto-generated connection',
                    autoGenerated: true
                };
                
                this.navigation.push(connectingNav);
                console.log(`🔗 Added connecting navigation from asset ${fromIndex} to ${toIndex}`);
            }
        },

        // DFS to find connected components
        dfsComponent(node, adjacencyList, visited, component) {
            visited.add(node);
            component.push(node);
            
            adjacencyList[node].forEach(neighbor => {
                if (!visited.has(neighbor)) {
                    this.dfsComponent(neighbor, adjacencyList, visited, component);
                }
            });
        },

        // Generate a default navigation position for auto-generated links
        generateDefaultNavPosition(fromIndex, toIndex) {
            // Generate position based on target index to avoid overlapping
            const angleOffset = (toIndex * 60) % 360; // Spread out by 60 degrees
            const baseAngle = -90 + angleOffset; // Start at right side, spread around
            
            return {
                phi: parseFloat(baseAngle.toFixed(1)),
                theta: parseFloat((90 + (toIndex % 3) * 10).toFixed(1)), // Vary height slightly
                radius: 8
            };
        },

        // Remove auto-generated navigation links (useful for cleanup)
        removeAutoGeneratedNavigation() {
            this.navigation = this.navigation.filter(nav => !nav.autoGenerated);
            this.redrawCanvas();
            this.emitDataUpdate();
        },
        
        // Handle assets selected from SPK drive
        // Debug method to test canvas events
        testCanvasEvents() {
            console.log('🔧 Testing canvas events...');
            const canvas = this.$refs.canvas;
            if (!canvas) {
                console.error('❌ Canvas ref not found!');
                return;
            }
            
            console.log('✅ Canvas found:', canvas);
            console.log('✅ Canvas dimensions:', canvas.width, 'x', canvas.height);
            console.log('✅ Canvas style:', canvas.style.cursor);
            
            // Test simulated click
            const rect = canvas.getBoundingClientRect();
            const simulatedEvent = {
                target: canvas,
                clientX: rect.left + rect.width / 2,
                clientY: rect.top + rect.height / 2,
                type: 'click'
            };
            
            console.log('🖱️ Simulating canvas click at center...');
            this.onCanvasClick(simulatedEvent);
        },
        
        addAssetFromSPK(spkFile) {
            // Handle proxy object and extract actual data
            let fileData = spkFile;
            if (spkFile && typeof spkFile === 'object' && spkFile.constructor.name === 'Object') {
                // Convert proxy to plain object if needed
                fileData = JSON.parse(JSON.stringify(spkFile));
            }
            
            console.log('🔍 Processing SPK file data:', fileData);
            
            // Use the proper fields from the addToPost event
            const fileName = fileData.fileName || fileData.name || fileData.filename || `Asset ${this.assets.length + 1}`;
            const fileType = fileData.fileType || fileData.type || '';
            const cid = fileData.cid || fileData.hash || fileData.url;
            const contractId = fileData.contractId || fileData.id || fileData.contract;
            
            const newAsset = {
                index: this.assets.length,
                url: cid,
                thumb: fileData.thumb || cid, // Generate thumbnail if needed
                rotation: { x: 0, y: 0, z: 0 },
                title: fileName,
                description: fileData.description || `${fileType} file`,
                contractId: contractId // Store contract ID for blockchain integration
            };
            
            console.log('✅ Adding new 360° asset with proper metadata:', newAsset);
            
            this.assets.push(newAsset);
            this.selectedAssetIndex = this.assets.length - 1;
            
            // Load the new asset on canvas
            this.$nextTick(() => {
                this.loadAssetOnCanvas(this.selectedAssetIndex);
            });
            
            this.emitDataUpdate();
        },
        
        // Normalize existing navigation coordinates to use toFixed(1) precision
        normalizeNavigationPrecision() {
            this.navigation.forEach(nav => {
                if (nav.position) {
                    nav.position.phi = parseFloat(nav.position.phi.toFixed(1));
                    nav.position.theta = parseFloat(nav.position.theta.toFixed(1));
                    // radius can stay as is
                }
            });
        },
        
        // Test method to verify connectivity functionality (remove in production)
        testConnectivity() {
            console.log('🧪 Testing navigation connectivity...');
            
            // Test with sample data
            const testAssets = [
                { index: 0, title: 'Photo 1' },
                { index: 1, title: 'Photo 2' },
                { index: 2, title: 'Photo 3' }
            ];
            
            const testNavigation = [
                { fromIndex: 0, toIndex: 1, position: { phi: 45.0, theta: 90.0, radius: 8 } }
                // Missing links: 1->?, 2->?
            ];
            
            // Temporarily use test data
            const originalAssets = [...this.assets];
            const originalNavigation = [...this.navigation];
            
            this.assets = testAssets;
            this.navigation = testNavigation;
            
            console.log('Before connectivity check:', this.navigation.length, 'links');
            this.ensureNavigationConnectivity();
            console.log('After connectivity check:', this.navigation.length, 'links');
            console.log('Navigation links:', this.navigation.map(nav => `${nav.fromIndex}->${nav.toIndex}`));
            
            // Restore original data
            this.assets = originalAssets;
            this.navigation = originalNavigation;
            
            console.log('✅ Connectivity test completed');
        }
    },
    
    template: `
        <div class="asset-360-manager">
            <!-- Header -->
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h6 class="mb-0">
                    <i class="fa-solid fa-globe fa-fw me-2"></i>360° Asset Manager
                </h6>
                <div class="btn-group">
                    <button 
                        type="button" 
                        class="btn btn-sm"
                        :class="editMode === 'focus' ? 'btn-primary' : 'btn-outline-primary'"
                        @click="editMode = 'focus'">
                        <i class="fa-solid fa-crosshairs fa-fw me-1"></i>Focus
                    </button>
                    <button 
                        type="button" 
                        class="btn btn-sm"
                        :class="editMode === 'navigation' ? 'btn-primary' : 'btn-outline-primary'"
                        @click="editMode = 'navigation'">
                        <i class="fa-solid fa-route fa-fw me-1"></i>Navigation
                    </button>
                    <!-- Temporary test button -->
                    <button 
                        type="button" 
                        class="btn btn-sm btn-outline-info"
                        @click="testConnectivity()"
                        title="Test navigation connectivity">
                        <i class="fa-solid fa-flask fa-fw"></i>
                    </button>
                </div>
            </div>
            
            <!-- Upload Area -->
            <div 
                ref="dropZone"
                class="drop-zone mb-3"
                @click="$refs.fileInput.click()">
                <div class="drop-zone-content">
                    <i class="fa-solid fa-cloud-upload-alt fa-2x mb-2"></i>
                    <p class="mb-1">Drop 360° images here or click to browse</p>
                    <small class="text-muted">Supports JPEG, PNG, WebP • Equirectangular format recommended</small>
                </div>
                <input 
                    ref="fileInput"
                    type="file" 
                    multiple 
                    accept="image/*"
                    style="display: none"
                    @change="onFileInputChange">
            </div>
            
            <!-- SPK Drive Integration Note -->
            <div class="text-center mb-3">
                <small class="text-muted">
                    <i class="fa-solid fa-info-circle fa-fw me-1"></i>
                    Tip: You can also drag files from "Your Files" section above directly to this area
                </small>
            </div>
            
            <!-- Upload Progress -->
            <div v-if="Object.keys(uploadProgress).length > 0" class="mb-3">
                <div v-for="(upload, id) in uploadProgress" :key="id" class="mb-2">
                    <div class="d-flex justify-content-between small mb-1">
                        <span>{{ upload.file }}</span>
                        <span>{{ upload.progress }}%</span>
                    </div>
                    <div class="progress" style="height: 4px;">
                        <div 
                            class="progress-bar progress-bar-striped progress-bar-animated"
                            :style="{ width: upload.progress + '%' }">
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Asset List -->
            <div v-if="assets.length > 0" class="mb-3">
                <h6>Assets ({{ assets.length }})</h6>
                <div class="list-group list-group-flush">
                    <div 
                        v-for="(asset, assetIndex) in assets"
                        :key="assetIndex"
                        class="list-group-item list-group-item-action bg-darker"
                        :class="{ active: selectedAssetIndex === assetIndex }"
                        @click="selectedAssetIndex = assetIndex">
                        <div class="d-flex justify-content-between align-items-center">
                            <div class="d-flex align-items-center">
                                <img 
                                    :src="asset.thumb || asset.url" 
                                    class="me-2 rounded"
                                    style="width: 40px; height: 40px; object-fit: cover"
                                    :alt="asset.title">
                                <div>
                                    <h6 class="mb-0">{{ asset.title || 'Untitled' }}</h6>
                                    <small class="text-muted">{{ asset.description || 'No description' }}</small>
                                </div>
                            </div>
                            <div class="btn-group">
                                <button 
                                    type="button" 
                                    class="btn btn-sm btn-outline-danger"
                                    @click.stop="removeAsset(assetIndex)">
                                    <i class="fa-solid fa-trash fa-fw"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Canvas Editor (moved below asset list) -->
                <div v-if="currentAsset" class="row">
                    <div class="col-lg-8 mx-auto">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h6 class="mb-0">{{ editMode === 'focus' ? 'Adjust Focus & Horizon' : 'Place Navigation' }}</h6>
                            <div class="btn-group">
                                <button 
                                    v-if="editMode === 'focus'"
                                    type="button" 
                                    class="btn btn-sm btn-outline-secondary"
                                    @click="resetRotation()">
                                    <i class="fa-solid fa-undo fa-fw me-1"></i>Reset
                                </button>
                                <button 
                                    v-if="editMode === 'navigation'"
                                    type="button" 
                                    class="btn btn-sm btn-outline-primary"
                                    :disabled="isPlacingNavigation || showTargetSelection"
                                    @click="startNavigationPlacement()">
                                    <i class="fa-solid fa-plus fa-fw me-1"></i>Add Link
                                </button>
                                <button 
                                    v-if="editMode === 'navigation' && isPlacingNavigation"
                                    type="button" 
                                    class="btn btn-sm btn-outline-secondary"
                                    @click="cancelNavigationPlacement()">
                                    <i class="fa-solid fa-times fa-fw me-1"></i>Cancel
                                </button>
                            </div>
                        </div>
                        
                        <!-- Target Selection UI -->
                        <div v-if="showTargetSelection" class="card bg-darker mb-3">
                            <div class="card-body p-3">
                                <h6 class="card-title mb-2">
                                    <i class="fa-solid fa-bullseye fa-fw me-1"></i>
                                    Select Target Photo
                                </h6>
                                <p class="small text-muted mb-3">Choose which photo this navigation link should go to:</p>
                                <div class="row g-2">
                                    <div 
                                        v-for="(asset, assetIndex) in assets"
                                        :key="assetIndex"
                                        class="col-md-4"
                                        v-if="assetIndex !== selectedAssetIndex">
                                        <div 
                                            class="card bg-secondary text-white h-100 cursor-pointer"
                                            @click="selectNavigationTarget(assetIndex)"
                                            style="transition: all 0.2s;">
                                            <img 
                                                :src="asset.thumb || asset.url" 
                                                class="card-img-top"
                                                style="height: 80px; object-fit: cover;"
                                                :alt="asset.title">
                                            <div class="card-body p-2">
                                                <h6 class="card-title small mb-0">{{ asset.title || 'Untitled' }}</h6>
                                                <small class="text-muted">Photo {{ assetIndex + 1 }}</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="d-flex justify-content-end mt-3">
                                    <button 
                                        type="button" 
                                        class="btn btn-sm btn-outline-secondary"
                                        @click="cancelNavigationPlacement()">
                                        <i class="fa-solid fa-times fa-fw me-1"></i>Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Canvas Debug Info -->
                        <div class="small text-muted mb-1">
                            Debug: editMode={{editMode}}, isPlacingNavigation={{isPlacingNavigation}}, mouseDown={{mouseDown}}
                            <button @click="testCanvasEvents()" class="btn btn-sm btn-outline-info ms-2">Test Canvas Events</button>
                        </div>
                        
                        <!-- Canvas -->
                        <canvas
                            ref="canvas"
                            :style="canvasStyle"
                            class="mb-2"
                            @mousedown="onCanvasMouseDown"
                            @mousemove="onCanvasMouseMove"
                            @mouseup="onCanvasMouseUp"
                            @click="onCanvasClick"
                            @mouseenter="() => console.log('🖱️ Mouse entered canvas')"
                            @mouseleave="() => console.log('🖱️ Mouse left canvas')">
                        </canvas>
                        
                        <!-- Instructions -->
                        <div class="small text-muted mb-2">
                            <div v-if="editMode === 'focus'">
                                <i class="fa-solid fa-info-circle fa-fw me-1"></i>
                                Drag to adjust initial view direction. Red line shows horizon.
                            </div>
                            <div v-else-if="editMode === 'navigation' && isPlacingNavigation">
                                <i class="fa-solid fa-crosshairs fa-fw me-1"></i>
                                <strong>Click on the canvas</strong> to place navigation link to "{{ assets[pendingNavigation?.toIndex]?.title }}"
                                <div class="mt-1 small">
                                    <i class="fa-solid fa-info-circle fa-fw me-1"></i>
                                    The click position will be converted to polar coordinates for the 360° space
                                </div>
                            </div>
                            <div v-else-if="editMode === 'navigation'">
                                <i class="fa-solid fa-route fa-fw me-1"></i>
                                Navigation spheres shown. Click "Add Link" to place new navigation points.
                            </div>
                        </div>
                        
                        <!-- Asset Properties -->
                        <div class="card bg-darker">
                            <div class="card-body p-3">
                                <div class="mb-2">
                                    <label class="form-label small">Title</label>
                                    <input 
                                        type="text" 
                                        class="form-control form-control-sm"
                                        :value="currentAsset.title"
                                        @input="updateAssetTitle(selectedAssetIndex, $event.target.value)">
                                </div>
                                <div class="mb-2">
                                    <label class="form-label small">Description</label>
                                    <textarea 
                                        class="form-control form-control-sm"
                                        rows="2"
                                        :value="currentAsset.description"
                                        @input="updateAssetDescription(selectedAssetIndex, $event.target.value)">
                                    </textarea>
                                </div>
                                <div class="row">
                                    <div class="col-4">
                                        <label class="form-label small">Pan Left/Right</label>
                                        <input 
                                            type="number" 
                                            class="form-control form-control-sm"
                                            v-model.number="currentRotation.y"
                                            step="5"
                                            placeholder="Y degrees">
                                    </div>
                                    <div class="col-4">
                                        <label class="form-label small">Tilt Up/Down</label>
                                        <input 
                                            type="number" 
                                            class="form-control form-control-sm"
                                            v-model.number="currentRotation.x"
                                            step="5"
                                            placeholder="X degrees">
                                    </div>
                                    <div class="col-4">
                                        <label class="form-label small">Roll</label>
                                        <input 
                                            type="number" 
                                            class="form-control form-control-sm"
                                            v-model.number="currentRotation.z"
                                            step="5"
                                            placeholder="Z degrees">
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Navigation Links for Current Asset -->
                        <div v-if="navigationForCurrentAsset.length > 0" class="mt-3">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <h6 class="small mb-0">Navigation from this photo:</h6>
                                <div class="btn-group" v-if="navigation.some(nav => nav.autoGenerated)">
                                    <button 
                                        type="button" 
                                        class="btn btn-sm btn-outline-warning"
                                        @click="removeAutoGeneratedNavigation()"
                                        title="Remove auto-generated navigation links">
                                        <i class="fa-solid fa-robot fa-fw me-1"></i>Clear Auto
                                    </button>
                                </div>
                            </div>
                            <div class="list-group list-group-flush">
                                <div 
                                    v-for="(nav, navIndex) in navigationForCurrentAsset"
                                    :key="navIndex"
                                    class="list-group-item list-group-item-action bg-darker d-flex justify-content-between align-items-center"
                                    :class="{ 'border-warning': nav.autoGenerated }">
                                    <div>
                                        <span class="fw-bold">
                                            {{ nav.label }}
                                            <i v-if="nav.autoGenerated" 
                                               class="fa-solid fa-robot fa-fw ms-1 text-warning" 
                                               title="Auto-generated navigation"></i>
                                        </span>
                                        <small class="text-muted d-block">
                                            To: {{ assets[nav.toIndex]?.title }}
                                            <span v-if="nav.autoGenerated" class="text-warning">
                                                • Position: φ{{ nav.position.phi }}° θ{{ nav.position.theta }}°
                                            </span>
                                        </small>
                                    </div>
                                    <button 
                                        type="button" 
                                        class="btn btn-sm btn-outline-danger"
                                        @click="removeNavigation(nav)">
                                        <i class="fa-solid fa-trash fa-fw"></i>
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Connectivity Status -->
                            <div class="mt-2">
                                <small class="text-muted">
                                    <i class="fa-solid fa-info-circle fa-fw me-1"></i>
                                    Navigation coordinates use 1 decimal precision (φ{{ navigationForCurrentAsset[0]?.position.phi }}°, θ{{ navigationForCurrentAsset[0]?.position.theta }}°)
                                    {{ navigation.some(nav => nav.autoGenerated) ? ' • Auto-links ensure full connectivity' : '' }}
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Empty State -->
            <div v-else class="text-center py-5">
                <i class="fa-solid fa-images fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">No 360° Images Added</h5>
                <p class="text-muted">Upload or select 360° images to start building your gallery</p>
            </div>
        </div>
    `
};

// Make component available globally
if (typeof window !== 'undefined') {
    window.Asset360Manager = Asset360Manager;
}

export default Asset360Manager; 