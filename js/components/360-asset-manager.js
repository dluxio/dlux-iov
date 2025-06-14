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
            
            // Navigation dragging state
            isDraggingNavSphere: false,
            draggedNavIndex: -1,
            draggedNavGlobalIndex: -1, // Index in the full navigation array
            hoveringOverSphere: false, // Track if mouse is over a sphere
            
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
            } else if (this.editMode === 'navigation' && this.hoveringOverSphere) {
                cursor = 'pointer';
            } else if (this.editMode === 'focus') {
                cursor = this.mouseDown ? 'grabbing' : 'grab';
            } else if (this.isDraggingNavSphere) {
                cursor = 'move';
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
                    // Convert from stored A-Frame format back to canvas format:
                    // A-Frame X (pitch) -> Canvas Z (roll) with negative sign
                    // A-Frame Y (yaw) -> Canvas Y (pan)
                    // A-Frame Z (roll) -> Canvas X (tilt)
                    const storedRotation = asset.rotation || { x: 0, y: 0, z: 0 };
                    this.currentRotation = {
                        x: storedRotation.z,  // A-Frame roll becomes canvas tilt
                        y: storedRotation.y,  // A-Frame yaw stays as canvas pan
                        z: -storedRotation.x  // A-Frame pitch becomes canvas roll (negated)
                    };
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
            
            // Apply Z rotation (roll) - rotate the entire view around center
            if (this.currentRotation.z) {
                const centerX = canvas.width / 2;
                const centerY = canvas.height / 2;
                
                ctx.translate(centerX, centerY);
                ctx.rotate(this.currentRotation.z * Math.PI / 180);
                ctx.translate(-centerX, -centerY);
            }
            
            // Draw the equirectangular image with wrapping/tiling for seamless 360° experience
            // X and Y rotations are now handled as offsets in drawWrappedImage
            this.drawWrappedImage(ctx, canvas);
            
            // Restore context
            ctx.restore();
            
            // Draw horizon line if enabled
            this.drawHorizonLine();
            
            // Always draw navigation spheres when they exist (not just in navigation mode)
            if (this.navSpheresVisible && this.navigationForCurrentAsset.length > 0) {
                this.drawNavigationSpheres();
            }
            
            // Draw crosshair for focus point
            if (this.editMode === 'focus') {
                this.drawCrosshair();
            }
        },
        
        // Draw wrapped/tiled image for seamless 360° panning and tilting
        drawWrappedImage(ctx, canvas) {
            if (!this.currentImage) return;
            
            const imageWidth = canvas.width;
            const imageHeight = canvas.height;
            
            // Calculate horizontal pan offset based on Y rotation
            const normalizedYRotation = ((this.currentRotation.y % 360) + 360) % 360;
            const panOffset = (normalizedYRotation / 360) * imageWidth;
            
            // Calculate vertical tilt offset based on X rotation (like horizontal panning but vertical)
            const normalizedXRotation = ((this.currentRotation.x % 360) + 360) % 360;
            const tiltOffset = (normalizedXRotation / 360) * imageHeight;
            
            // Draw the main image with both horizontal and vertical offsets
            ctx.drawImage(this.currentImage, -panOffset, -tiltOffset, imageWidth, imageHeight);
            
            // Draw horizontal wrapped copies for seamless horizontal transition
            if (panOffset > 0) {
                // If panned to the right, draw image on the left side
                ctx.drawImage(this.currentImage, -panOffset + imageWidth, -tiltOffset, imageWidth, imageHeight);
            }
            if (panOffset < imageWidth) {
                // If there's space on the right, draw image on the right side
                ctx.drawImage(this.currentImage, -panOffset - imageWidth, -tiltOffset, imageWidth, imageHeight);
            }
            
            // Draw vertical wrapped copies for seamless vertical transition
            if (tiltOffset > 0) {
                // If tilted up, draw image below
                ctx.drawImage(this.currentImage, -panOffset, -tiltOffset + imageHeight, imageWidth, imageHeight);
                // Also draw horizontal wraps for the vertical copy
                if (panOffset > 0) {
                    ctx.drawImage(this.currentImage, -panOffset + imageWidth, -tiltOffset + imageHeight, imageWidth, imageHeight);
                }
                if (panOffset < imageWidth) {
                    ctx.drawImage(this.currentImage, -panOffset - imageWidth, -tiltOffset + imageHeight, imageWidth, imageHeight);
                }
            }
            if (tiltOffset < imageHeight) {
                // If there's space below, draw image above
                ctx.drawImage(this.currentImage, -panOffset, -tiltOffset - imageHeight, imageWidth, imageHeight);
                // Also draw horizontal wraps for the vertical copy
                if (panOffset > 0) {
                    ctx.drawImage(this.currentImage, -panOffset + imageWidth, -tiltOffset - imageHeight, imageWidth, imageHeight);
                }
                if (panOffset < imageWidth) {
                    ctx.drawImage(this.currentImage, -panOffset - imageWidth, -tiltOffset - imageHeight, imageWidth, imageHeight);
                }
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
                
                // Skip if position is outside visible area (but be more lenient with Y bounds for tilting)
                if (pos.x < -50 || pos.x > canvas.width + 50 || pos.y < -50 || pos.y > canvas.height + 50) {
                    return;
                }
                
                ctx.save();
                
                const isSelected = index === this.selectedNavIndex;
                const isDragging = this.isDraggingNavSphere && index === this.draggedNavIndex;
                
                // Draw glow effect (larger when dragging)
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, isDragging ? 25 : 20, 0, 2 * Math.PI);
                let glowColor = 'rgba(78, 205, 196, 0.2)';
                if (isSelected) glowColor = 'rgba(233, 30, 99, 0.2)';
                if (isDragging) glowColor = 'rgba(255, 193, 7, 0.3)'; // Yellow when dragging
                ctx.fillStyle = glowColor;
                ctx.fill();
                
                // Draw outer ring (thicker when dragging)
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, isDragging ? 18 : 15, 0, 2 * Math.PI);
                let ringColor = '#4ECDC4';
                if (isSelected) ringColor = '#E91E63';
                if (isDragging) ringColor = '#FFC107'; // Yellow when dragging
                ctx.strokeStyle = ringColor;
                ctx.lineWidth = isDragging ? 4 : 3;
                ctx.stroke();
                
                // Draw inner sphere
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, isDragging ? 10 : 8, 0, 2 * Math.PI);
                let fillColor = '#4ECDC4';
                if (isSelected) fillColor = '#E91E63';
                if (isDragging) fillColor = '#FFC107'; // Yellow when dragging
                ctx.fillStyle = fillColor;
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // Draw label with better visibility
                if (nav.label) {
                    ctx.fillStyle = '#000';
                    ctx.font = isDragging ? 'bold 14px Arial' : 'bold 12px Arial';
                    ctx.textAlign = 'center';
                    
                    // Draw background for text
                    const textWidth = ctx.measureText(nav.label).width;
                    const textHeight = isDragging ? 18 : 16;
                    const textY = isDragging ? pos.y - 35 : pos.y - 32;
                    
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                    ctx.fillRect(pos.x - textWidth/2 - 4, textY - textHeight + 4, textWidth + 8, textHeight);
                    
                    // Draw text
                    ctx.fillStyle = '#fff';
                    ctx.fillText(nav.label, pos.x, textY);
                }
                
                // Draw auto-generated indicator
                if (nav.autoGenerated) {
                    ctx.fillStyle = '#FFA500';
                    ctx.font = isDragging ? '12px Arial' : '10px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('AUTO', pos.x, pos.y + (isDragging ? 28 : 25));
                }
                
                // Draw drag cursor indicator when dragging
                if (isDragging) {
                    ctx.fillStyle = '#FFC107';
                    ctx.font = '16px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('↔', pos.x, pos.y + 45);
                }
                
                ctx.restore();
            });
        },
        
        // Convert spherical coordinates to canvas position with rotation compensation
        sphericalToCanvas(sphericalPos) {
            const { phi, theta, radius } = sphericalPos;
            
            // Apply rotation compensation to get the visual position  
            const adjustedPhi = phi - this.currentRotation.y; // Compensate for Y rotation (panning)
            
            // Convert to equirectangular projection first
            // Apply 90-degree offset to align coordinate systems (phi=0 should be at center of canvas)
            let x = ((adjustedPhi + 180) / 360) * this.canvasWidth;
            let y = ((theta / 180) * this.canvasHeight);
            
            // Apply tilt offset (similar to how panning affects X, tilting affects Y)
            y -= (this.currentRotation.x / 360) * this.canvasHeight;
            
            const centerX = this.canvasWidth / 2;
            const centerY = this.canvasHeight / 2;
            
            // Apply the same transformations that are applied to the image in the exact same order
            
            // 1. Apply Z rotation (roll) around center - same as image
            if (this.currentRotation.z) {
                // Translate to center
                x -= centerX;
                y -= centerY;
                
                const rollRadians = this.currentRotation.z * Math.PI / 180;
                const cos = Math.cos(rollRadians);
                const sin = Math.sin(rollRadians);
                
                const rotatedX = x * cos - y * sin;
                const rotatedY = x * sin + y * cos;
                
                x = rotatedX;
                y = rotatedY;
                
                // Translate back from center
                x += centerX;
                y += centerY;
            }
            
            // Normalize X coordinates (allow wrapping for horizontal panning)
            const normalizedX = ((x % this.canvasWidth) + this.canvasWidth) % this.canvasWidth;
            
            return { 
                x: normalizedX, 
                y: y // Allow Y to go off-screen when tilted/rolled
            };
        },
        
        // Convert canvas position to spherical coordinates
        canvasToSpherical(canvasPos) {
            // Apply inverse 90-degree offset to align coordinate systems
            const phi = (canvasPos.x / this.canvasWidth) * 360 -180;
            const theta = (canvasPos.y / this.canvasHeight) * 180;
            
            // Apply inverse rotation compensation to store the "neutral" position
            // This way, navigation points are stored relative to the unrotated image
            const neutralPhi = phi + this.currentRotation.y; // Add back Y rotation
            const neutralTheta = theta + this.currentRotation.x; // Add back X rotation
            
            return {
                phi: parseFloat(Math.max(-180, Math.min(180, neutralPhi)).toFixed(1)), // Store coordinates directly without offset
                theta: parseFloat(Math.max(-180, Math.min(180, neutralTheta)).toFixed(1)),
                radius: 8 // Default radius
            };
        },
        
        // Check if mouse position hits a navigation sphere
        getNavigationSphereAt(mousePos) {
            if (!this.navSpheresVisible || this.navigationForCurrentAsset.length === 0) {
                return null;
            }
            
            for (let i = 0; i < this.navigationForCurrentAsset.length; i++) {
                const nav = this.navigationForCurrentAsset[i];
                const spherePos = this.sphericalToCanvas(nav.position);
                
                // Check if click is within sphere radius (with some tolerance)
                const distance = Math.sqrt(
                    Math.pow(mousePos.x - spherePos.x, 2) + 
                    Math.pow(mousePos.y - spherePos.y, 2)
                );
                
                if (distance <= 20) { // 20px hit radius (larger than visual radius for easier clicking)
                    // Find the global index in the full navigation array
                    const globalIndex = this.navigation.findIndex(globalNav => 
                        globalNav.fromIndex === nav.fromIndex && 
                        globalNav.toIndex === nav.toIndex &&
                        globalNav.position.phi === nav.position.phi &&
                        globalNav.position.theta === nav.position.theta
                    );
                    
                    return {
                        localIndex: i,
                        globalIndex: globalIndex,
                        navigation: nav,
                        position: spherePos
                    };
                }
            }
            
            return null;
        },
        
        // Canvas mouse event handlers
        onCanvasMouseDown(event) {
            const rect = event.target.getBoundingClientRect();
            const mousePos = {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
            };
            
            // Check if clicking on a navigation sphere first (works in any mode)
            const hitSphere = this.getNavigationSphereAt(mousePos);
            
            if (hitSphere) {
                if (this.editMode === 'navigation') {
                    // Start dragging navigation sphere in navigation mode
                    this.isDraggingNavSphere = true;
                    this.draggedNavIndex = hitSphere.localIndex;
                    this.draggedNavGlobalIndex = hitSphere.globalIndex;
                    this.selectedNavIndex = hitSphere.localIndex;
                    this.redrawCanvas(); // Redraw to show selection
                } else {
                    // In focus mode, just select the sphere (don't drag, but show it's interactive)
                    this.selectedNavIndex = hitSphere.localIndex;
                    this.redrawCanvas();
                }
                
                // Prevent default image dragging in BOTH modes when clicking spheres
                event.preventDefault();
                event.stopPropagation();
                return;
            }
            
            // Normal mouse down for image dragging (only if no sphere was hit)
            this.mouseDown = true;
            this.lastMousePos = mousePos;
        },
        
        onCanvasMouseMove(event) {
            const rect = event.target.getBoundingClientRect();
            const currentPos = {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
            };
            
            // Check for sphere hover (for cursor changes)
            const hitSphere = this.getNavigationSphereAt(currentPos);
            this.hoveringOverSphere = !!hitSphere;
            
            // Handle navigation sphere dragging (only in navigation mode)
            if (this.isDraggingNavSphere && this.editMode === 'navigation' && this.draggedNavGlobalIndex >= 0) {
                // Convert mouse position to spherical coordinates
                const newSphericalPos = this.canvasToSpherical(currentPos);
                
                // Update the navigation position in real-time
                if (this.navigation[this.draggedNavGlobalIndex]) {
                    this.navigation[this.draggedNavGlobalIndex].position = newSphericalPos;
                    this.redrawCanvas(); // Redraw to show new position
                }
                
                return;
            }
            
            // Handle normal image dragging (only if not dragging a sphere)
            if (!this.mouseDown || this.isDraggingNavSphere) return;
            if (this.editMode !== 'focus') return;
            
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
            // Handle navigation sphere drag end
            if (this.isDraggingNavSphere) {
                this.isDraggingNavSphere = false;
                this.draggedNavIndex = -1;
                this.draggedNavGlobalIndex = -1;
                
                // Emit data update to save changes
                this.emitDataUpdate();
                
                return;
            }
            
            // Handle normal mouse up
            this.mouseDown = false;
        },
        
        onCanvasClick(event) {
            console.log('🖱️ Canvas clicked! Event received:', event.type, {
                editMode: this.editMode,
                isPlacingNavigation: this.isPlacingNavigation,
                isDraggingNavSphere: this.isDraggingNavSphere,
                pendingNavigation: this.pendingNavigation,
                target: event.target.tagName,
                timestamp: Date.now()
            });
            
            // Don't process click if we were just dragging a sphere
            if (this.isDraggingNavSphere) {
                return;
            }
            
            const rect = event.target.getBoundingClientRect();
            const canvasPos = {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
            };
            
            // Check if clicking on existing navigation sphere (for selection, not placement)
            const hitSphere = this.getNavigationSphereAt(canvasPos);
            if (hitSphere && this.editMode === 'navigation' && !this.isPlacingNavigation) {
                this.selectedNavIndex = hitSphere.localIndex;
                this.redrawCanvas();
                console.log('🔵 Selected navigation sphere:', hitSphere.localIndex);
                return;
            }
            
            // Handle new navigation placement
            if (this.editMode !== 'navigation' || !this.isPlacingNavigation) {
                console.log('❌ Not in navigation placement mode');
                return;
            }
            
            // Don't place navigation on existing spheres
            if (hitSphere) {
                console.log('❌ Cannot place navigation on existing sphere');
                return;
            }
            
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
                // Convert canvas editor coordinates to A-Frame coordinates when storing:
                // Canvas Roll (Z) -> A-Frame X (pitch) with negative sign
                // Canvas Pan (Y) -> A-Frame Y (yaw) 
                // Canvas Tilt (X) -> A-Frame Z (roll)
                this.currentAsset.rotation = {
                    x: -this.currentRotation.z, // Roll becomes negative pitch
                    y: this.currentRotation.y,  // Pan stays as yaw
                    z: this.currentRotation.x   // Tilt becomes roll
                };
                this.emitDataUpdate();
            }
        },
        
        updateAssetTitle(index, title) {
            if (this.assets[index]) {
                this.assets[index].title = title;
                // Update navigation labels that reference this asset
                this.updateNavigationLabels();
                this.emitDataUpdate();
            }
        },
        
        // Update navigation labels to use current asset titles
        updateNavigationLabels() {
            this.navigation.forEach(nav => {
                const targetAsset = this.assets[nav.toIndex];
                if (targetAsset && targetAsset.title) {
                    // Only update auto-generated labels or labels that look like CIDs
                    if (nav.autoGenerated || nav.label.startsWith('Qm') || nav.label.includes('To Qm')) {
                        nav.label = `To ${targetAsset.title}`;
                    }
                }
            });
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
            
            // Step 1: Ensure every asset has at least one outgoing link
            this.ensureEveryAssetHasNavigation();
            
            // Step 2: Ensure the navigation graph is connected (you can reach any photo from any other)
            this.ensureNetworkConnectivity();
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
            
            // Clean up the file name to remove extension and make it more readable
            let cleanTitle = fileName;
            if (cleanTitle.includes('.')) {
                cleanTitle = cleanTitle.substring(0, cleanTitle.lastIndexOf('.'));
            }
            // If it still looks like a CID, make a better title
            if (cleanTitle.startsWith('Qm') && cleanTitle.length > 20) {
                cleanTitle = `360° Photo ${this.assets.length + 1}`;
            }
            
            const newAsset = {
                index: this.assets.length,
                url: cid,
                thumb: fileData.thumb || cid, // Generate thumbnail if needed
                rotation: { x: 0, y: 0, z: 0 },
                title: cleanTitle, // Use the cleaned title
                description: fileData.description || '',
                contractId: contractId // Store contract ID for blockchain integration
            };
            
            console.log('✅ Adding new 360° asset with proper metadata:', newAsset);
            
            this.assets.push(newAsset);
            this.selectedAssetIndex = this.assets.length - 1;
            
            // Update any existing navigation labels that might reference CIDs
            this.updateNavigationLabels();
            
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
                                <!-- Navigation visibility toggle -->
                                <button 
                                    v-if="navigationForCurrentAsset.length > 0"
                                    type="button" 
                                    class="btn btn-sm"
                                    :class="navSpheresVisible ? 'btn-success' : 'btn-outline-secondary'"
                                    @click="navSpheresVisible = !navSpheresVisible; redrawCanvas()"
                                    :title="navSpheresVisible ? 'Hide navigation spheres' : 'Show navigation spheres'">
                                    <i class="fa-solid fa-eye fa-fw" v-if="navSpheresVisible"></i>
                                    <i class="fa-solid fa-eye-slash fa-fw" v-else></i>
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
                                Drag to adjust initial view direction. Use Tilt and Roll controls below to align the horizon.
                                <div v-if="navigationForCurrentAsset.length > 0" class="mt-1">
                                    <i class="fa-solid fa-route fa-fw me-1"></i>
                                    {{ navigationForCurrentAsset.length }} navigation link(s) visible. 
                                    <strong>Click spheres to select</strong> • Switch to Navigation mode to drag them.
                                </div>
                            </div>
                            <div v-else-if="editMode === 'navigation' && isPlacingNavigation">
                                <i class="fa-solid fa-crosshairs fa-fw me-1"></i>
                                <strong>Click on the canvas</strong> to place navigation link to "{{ assets[pendingNavigation?.toIndex]?.title }}"
                                <div class="mt-1 small">
                                    <i class="fa-solid fa-info-circle fa-fw me-1"></i>
                                    Position will be stored relative to the current rotation (φ{{ currentRotation.y.toFixed(1) }}°, θ{{ currentRotation.x.toFixed(1) }}°)
                                </div>
                            </div>
                            <div v-else-if="editMode === 'navigation'">
                                <i class="fa-solid fa-route fa-fw me-1"></i>
                                Navigation mode active. Existing spheres track the current rotation.
                                <div v-if="navigationForCurrentAsset.length === 0" class="mt-1">
                                    <i class="fa-solid fa-plus fa-fw me-1"></i>
                                    Click "Add Link" to place new navigation points.
                                </div>
                                <div v-else class="mt-1">
                                    <i class="fa-solid fa-hand-pointer fa-fw me-1"></i>
                                    <strong>Click and drag</strong> navigation spheres to reposition them. Click spheres to select.
                                </div>
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