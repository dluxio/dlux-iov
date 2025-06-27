// 3Speak Publisher dApp
// Main application logic

// Global variables
let hlsPlayer = null;
let videoData = {
    ipfs: '',
    filename: '',
    duration: 0,
    size: 0,
    thumbnail: ''
};
let updateDebounceTimer = null;
let isInitializing = false;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    console.log('3Speak Publisher dApp initialized');
    
    // Set up event listeners
    setupDropZone();
    setupFormHandlers();
    setupButtonHandlers();
    setupParentCommunication();
    
    // Check for initial data from parent
    checkInitialData();
    
    // Enable debug mode with URL parameter
    if (window.location.search.includes('debug=true')) {
        document.getElementById('debugPanel').classList.remove('d-none');
    }
}

// Drop zone functionality
function setupDropZone() {
    const dropZone = document.getElementById('dropZone');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight(e) {
        dropZone.classList.add('drag-over');
    }
    
    function unhighlight(e) {
        dropZone.classList.remove('drag-over');
    }
    
    // Handle dropped files
    dropZone.addEventListener('drop', handleDrop, false);
    
    // Handle click to browse
    dropZone.addEventListener('click', function() {
        // Send message to parent to open SPK file browser
        sendToParent({
            type: 'requestSPKBrowser',
            fileType: 'm3u8'
        });
    });
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0) {
        // Handle local file drop (for testing)
        handleLocalFile(files[0]);
    } else {
        // Check for SPK file data
        const spkData = dt.getData('application/spk-file');
        if (spkData) {
            try {
                const fileData = JSON.parse(spkData);
                handleSPKFile(fileData);
            } catch (err) {
                console.error('Error parsing SPK file data:', err);
            }
        }
    }
}

// Handle SPK file from drag or selection
function handleSPKFile(fileData) {
    console.log('Handling SPK file:', fileData);
    
    if (!fileData.url || !fileData.url.includes('.m3u8')) {
        showStatus('Please select a valid m3u8 file', 'error');
        return;
    }
    
    // Extract IPFS hash from URL
    const ipfsMatch = fileData.url.match(/ipfs:\/\/([a-zA-Z0-9]+)/);
    if (ipfsMatch) {
        videoData.ipfs = ipfsMatch[1];
    }
    
    videoData.filename = fileData.name || 'video.m3u8';
    videoData.size = fileData.size || 0;
    
    // Load video in player
    loadVideo(fileData.url);
    
    // Update UI
    updateVideoInfo();
    showVideoPlayer();
    
    // Send reactive update
    sendReactiveUpdate();
}

// Handle local file (for testing)
function handleLocalFile(file) {
    if (!file.name.endsWith('.m3u8')) {
        showStatus('Please select a valid m3u8 file', 'error');
        return;
    }
    
    const url = URL.createObjectURL(file);
    videoData.filename = file.name;
    videoData.size = file.size;
    
    loadVideo(url);
    updateVideoInfo();
    showVideoPlayer();
}

// Load video using HLS.js
function loadVideo(url) {
    const video = document.getElementById('videoPlayer');
    
    if (hlsPlayer) {
        hlsPlayer.destroy();
    }
    
    if (Hls.isSupported()) {
        hlsPlayer = new Hls();
        hlsPlayer.loadSource(url);
        hlsPlayer.attachMedia(video);
        
        hlsPlayer.on(Hls.Events.MANIFEST_PARSED, function() {
            console.log('HLS manifest loaded');
            // Auto-play muted for better UX
            video.muted = true;
            video.play().catch(err => console.log('Autoplay prevented:', err));
        });
        
        hlsPlayer.on(Hls.Events.ERROR, function(event, data) {
            console.error('HLS error:', data);
            showStatus('Error loading video', 'error');
        });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        video.src = url;
    } else {
        showStatus('HLS is not supported in this browser', 'error');
    }
    
    // Get video duration when metadata loads
    video.addEventListener('loadedmetadata', function() {
        videoData.duration = Math.floor(video.duration);
        updateVideoInfo();
    });
}

// UI Updates
function showVideoPlayer() {
    document.getElementById('dropZone').classList.add('d-none');
    document.getElementById('videoContainer').classList.remove('d-none');
    document.getElementById('thumbnailSection').classList.remove('d-none');
    document.getElementById('publishBtn').disabled = false;
    
    // Show sync indicator
    document.getElementById('syncIndicator').classList.remove('d-none');
}

function updateVideoInfo() {
    // Update video info displays
    document.getElementById('videoFileName').textContent = videoData.filename;
    document.getElementById('videoDuration').textContent = formatDuration(videoData.duration);
    document.getElementById('videoSize').textContent = formatFileSize(videoData.size);
    
    // Update form fields
    document.getElementById('durationDisplay').value = formatDuration(videoData.duration);
    document.getElementById('sizeDisplay').value = formatFileSize(videoData.size);
    document.getElementById('videoDurationSeconds').value = videoData.duration;
    document.getElementById('videoSizeBytes').value = videoData.size;
    document.getElementById('videoIPFS').value = videoData.ipfs;
    document.getElementById('videoFilename').value = videoData.filename;
}

// Form handlers
function setupFormHandlers() {
    // Add reactive update handlers to all form fields
    document.getElementById('videoTitle').addEventListener('input', function() {
        if (!isUpdatingFromParent) sendReactiveUpdate();
    });
    document.getElementById('videoDescription').addEventListener('input', function() {
        if (!isUpdatingFromParent) sendReactiveUpdate();
    });
    document.getElementById('videoTags').addEventListener('input', function() {
        if (!isUpdatingFromParent) sendReactiveUpdate();
    });
    document.getElementById('isNSFW').addEventListener('change', sendReactiveUpdate);
    
    // Title sync - now uses Y.js subscriptions
    document.getElementById('syncTitle').addEventListener('change', function(e) {
        const titleInput = document.getElementById('videoTitle');
        const lockIcon = document.getElementById('titleLockIcon');
        if (e.target.checked) {
            subscribeToYjsField('title');
            titleInput.disabled = true;
            titleInput.classList.add('synced-field');
            if (lockIcon) lockIcon.style.display = 'inline';
        } else {
            unsubscribeFromYjsField('title');
            titleInput.disabled = false;
            titleInput.classList.remove('synced-field');
            if (lockIcon) lockIcon.style.display = 'none';
        }
    });
    
    // Description sync - now uses Y.js subscriptions
    document.getElementById('syncDescription').addEventListener('change', function(e) {
        const descInput = document.getElementById('videoDescription');
        const lockIcon = document.getElementById('descriptionLockIcon');
        if (e.target.checked) {
            subscribeToYjsField('body');
            descInput.disabled = true;
            descInput.classList.add('synced-field');
            if (lockIcon) lockIcon.style.display = 'inline';
        } else {
            unsubscribeFromYjsField('body');
            descInput.disabled = false;
            descInput.classList.remove('synced-field');
            if (lockIcon) lockIcon.style.display = 'none';
        }
    });
    
    // Tags sync - now uses Y.js subscriptions
    document.getElementById('syncTags').addEventListener('change', function(e) {
        const tagsInput = document.getElementById('videoTags');
        const lockIcon = document.getElementById('tagsLockIcon');
        if (e.target.checked) {
            subscribeToYjsField('tags');
            tagsInput.disabled = true;
            tagsInput.classList.add('synced-field');
            if (lockIcon) lockIcon.style.display = 'inline';
        } else {
            unsubscribeFromYjsField('tags');
            tagsInput.disabled = false;
            tagsInput.classList.remove('synced-field');
            if (lockIcon) lockIcon.style.display = 'none';
        }
    });
    
    // Beneficiaries sync - now uses Y.js subscriptions
    document.getElementById('syncBeneficiaries').addEventListener('change', function(e) {
        const addlBenDiv = document.getElementById('additionalBeneficiaries');
        const lockIcon = document.getElementById('beneficiariesLockIcon');
        if (e.target.checked) {
            subscribeToYjsField('beneficiaries');
            if (addlBenDiv) addlBenDiv.style.display = 'block';
            if (lockIcon) lockIcon.style.display = 'inline';
        } else {
            unsubscribeFromYjsField('beneficiaries');
            if (addlBenDiv) addlBenDiv.style.display = 'none';
            if (lockIcon) lockIcon.style.display = 'none';
        }
    });
    
    // Capture thumbnail
    document.getElementById('captureThumbnail').addEventListener('click', function() {
        captureThumbnail();
        // Send update after thumbnail capture
        setTimeout(sendReactiveUpdate, 100);
    });
    
    // Browse thumbnail
    document.getElementById('browseThumbnail').addEventListener('click', function() {
        sendToParent({
            type: 'requestSPKBrowser',
            fileType: 'image'
        });
    });
}

// Button handlers
function setupButtonHandlers() {
    // Cancel button
    document.getElementById('cancelBtn').addEventListener('click', function() {
        sendToParent({ type: 'cancel' });
    });
    
    // Done button (was publish)
    document.getElementById('publishBtn').addEventListener('click', handleDone);
}

// Capture thumbnail from video
function captureThumbnail() {
    const video = document.getElementById('videoPlayer');
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to blob
    canvas.toBlob(function(blob) {
        const url = URL.createObjectURL(blob);
        document.getElementById('thumbnailPreview').src = url;
        
        // In production, would upload to IPFS
        showStatus('Thumbnail captured. In production, this would upload to IPFS.', 'info');
        
        // For now, use a placeholder
        videoData.thumbnail = 'QmThumbnailPlaceholder';
        document.getElementById('thumbnailIPFS').value = videoData.thumbnail;
    }, 'image/jpeg', 0.9);
}

// Track if we're updating from parent to prevent loops
let isUpdatingFromParent = false;

// Send reactive update to parent
function sendReactiveUpdate() {
    if (isInitializing || isUpdatingFromParent) return; // Don't send updates during initialization or parent updates
    
    // Clear existing timer
    if (updateDebounceTimer) {
        clearTimeout(updateDebounceTimer);
    }
    
    // Show syncing indicator
    const syncIndicator = document.getElementById('syncIndicator');
    if (syncIndicator) {
        syncIndicator.classList.remove('d-none');
        syncIndicator.innerHTML = '<i class="fas fa-sync fa-spin me-1"></i>Syncing...';
    }
    
    // Debounce updates to avoid excessive messages
    updateDebounceTimer = setTimeout(() => {
        const customJson = generateCustomJson();
        
        // Show in debug panel if enabled
        if (document.getElementById('debugPanel').classList.contains('d-none') === false) {
            document.getElementById('debugJson').textContent = JSON.stringify(customJson, null, 2);
        }
        
        // Send update to parent
        sendToParent({
            type: 'dapp_update',
            data: customJson
        });
        
        // Also send beneficiaries info
        sendToParent({
            type: 'beneficiaries_update',
            beneficiaries: getAllBeneficiaries()
        });
        
        // Update sync indicator
        if (syncIndicator) {
            syncIndicator.innerHTML = '<i class="fas fa-check me-1"></i>Synced';
            setTimeout(() => {
                syncIndicator.innerHTML = '<i class="fas fa-sync me-1"></i>Auto-syncing';
            }, 2000);
        }
        
        showStatus('', 'success'); // Clear status message
    }, 500); // 500ms debounce
}

// Close/Done button handler (replaces publish)
function handleDone() {
    // Send final update
    sendReactiveUpdate();
    
    // Notify parent we're done
    sendToParent({ type: 'done' });
    
    showStatus('Closing...', 'success');
}

// Generate 3Speak custom JSON
function generateCustomJson() {
    const tags = document.getElementById('videoTags').value
        .split(',')
        .map(t => t.trim())
        .filter(t => t);
    
    return {
        app: '3speak/0.3',
        type: 'video',
        data: {
            title: document.getElementById('videoTitle').value.trim(),
            description: document.getElementById('videoDescription').value.trim(),
            tags: tags,
            duration: videoData.duration,
            filesize: videoData.size,
            isNsfwContent: document.getElementById('isNSFW').checked,
            thumbnail: videoData.thumbnail ? `ipfs://${videoData.thumbnail}` : '',
            video: {
                format: 'm3u8',
                url: `ipfs://${videoData.ipfs}/${videoData.filename}`,
                ipfs: videoData.ipfs
            }
        }
    };
}

// Y.js field subscriptions
let yjsFieldSubscriptions = {
    title: false,
    body: false,
    tags: false,
    beneficiaries: false
};

// Track additional beneficiaries from Y.js
let additionalBeneficiaries = [];

// Parent window communication
function setupParentCommunication() {
    window.addEventListener('message', function(event) {
        // Verify origin in production
        handleParentMessage(event.data);
    });
    
    // Set up Y.js field update handler
    setupYjsFieldHandlers();
}

function handleParentMessage(data) {
    // Ignore metamask messages
    if (data.target && data.target.includes('metamask')) {
        return;
    }
    
    console.log('Received from parent:', data);
    
    switch (data.type) {
        case 'dapp_init':
            // Initial custom JSON data from parent
            isInitializing = true;
            if (data.data && data.data.app === '3speak/0.3') {
                // Load existing 3Speak data
                const videoInfo = data.data.data;
                if (videoInfo) {
                    // Set video metadata
                    if (videoInfo.title) {
                        document.getElementById('videoTitle').value = videoInfo.title;
                    }
                    if (videoInfo.description) {
                        document.getElementById('videoDescription').value = videoInfo.description;
                    }
                    if (videoInfo.tags && Array.isArray(videoInfo.tags)) {
                        document.getElementById('videoTags').value = videoInfo.tags.join(', ');
                    }
                    if (videoInfo.isNsfwContent !== undefined) {
                        document.getElementById('isNSFW').checked = videoInfo.isNsfwContent;
                    }
                    
                    // Load video data if available
                    if (videoInfo.video && videoInfo.video.ipfs) {
                        videoData.ipfs = videoInfo.video.ipfs;
                        videoData.filename = videoInfo.video.url ? videoInfo.video.url.split('/').pop() : 'video.m3u8';
                        videoData.duration = videoInfo.duration || 0;
                        videoData.size = videoInfo.filesize || 0;
                        
                        // Load video
                        if (videoInfo.video.url) {
                            loadVideo(videoInfo.video.url);
                            updateVideoInfo();
                            showVideoPlayer();
                        }
                    }
                    
                    // Load thumbnail if available
                    if (videoInfo.thumbnail) {
                        const thumbnailHash = videoInfo.thumbnail.replace('ipfs://', '');
                        videoData.thumbnail = thumbnailHash;
                        document.getElementById('thumbnailIPFS').value = thumbnailHash;
                        document.getElementById('thumbnailPreview').src = videoInfo.thumbnail;
                    }
                }
            }
            setTimeout(() => { isInitializing = false; }, 500);
            break;
            
        case 'init':
            // Initial data from parent (legacy support)
            if (data.title && document.getElementById('syncTitle').checked) {
                document.getElementById('videoTitle').value = data.title;
            }
            if (data.body && document.getElementById('syncDescription').checked) {
                document.getElementById('videoDescription').value = data.body;
            }
            if (data.tags) {
                document.getElementById('videoTags').value = data.tags.join(', ');
            }
            break;
            
        case 'spkFileSelected':
            // File selected from SPK browser
            if (data.file) {
                if (data.file.type === 'video' || data.file.url.includes('.m3u8')) {
                    handleSPKFile(data.file);
                } else if (data.file.type === 'image') {
                    // Handle thumbnail
                    videoData.thumbnail = data.file.ipfs || data.file.hash;
                    document.getElementById('thumbnailIPFS').value = videoData.thumbnail;
                    document.getElementById('thumbnailPreview').src = data.file.url;
                    // Send update after thumbnail selection
                    sendReactiveUpdate();
                }
            }
            break;
            
        case 'titleUpdate':
            if (document.getElementById('syncTitle').checked) {
                document.getElementById('videoTitle').value = data.value;
            }
            break;
            
        case 'bodyUpdate':
            if (document.getElementById('syncDescription').checked) {
                document.getElementById('videoDescription').value = data.value;
            }
            break;
            
        case 'dapp_sync':
            // Handle Y.js sync updates from parent
            if (data.data && data.data.app === '3speak/0.3') {
                isInitializing = true;
                const videoInfo = data.data.data;
                if (videoInfo) {
                    // Update fields without triggering reactive updates
                    if (videoInfo.title) {
                        document.getElementById('videoTitle').value = videoInfo.title;
                    }
                    if (videoInfo.description) {
                        document.getElementById('videoDescription').value = videoInfo.description;
                    }
                    if (videoInfo.tags && Array.isArray(videoInfo.tags)) {
                        document.getElementById('videoTags').value = videoInfo.tags.join(', ');
                    }
                    if (videoInfo.isNsfwContent !== undefined) {
                        document.getElementById('isNSFW').checked = videoInfo.isNsfwContent;
                    }
                }
                setTimeout(() => { isInitializing = false; }, 100);
                console.log('✅ Synced 3Speak data from Y.js');
            }
            break;
            
        case 'YDOC_FIELD_UPDATE':
            // Handle Y.js field updates
            handleYjsFieldUpdate(data.field, data.value);
            break;
    }
}

// Set up Y.js field handlers
function setupYjsFieldHandlers() {
    console.log('🔗 Setting up Y.js field handlers');
    
    // Check initial state of sync checkboxes and subscribe if needed
    setTimeout(() => {
        const syncTitle = document.getElementById('syncTitle');
        const syncDesc = document.getElementById('syncDescription');
        const syncTags = document.getElementById('syncTags');
        const titleInput = document.getElementById('videoTitle');
        const descInput = document.getElementById('videoDescription');
        const tagsInput = document.getElementById('videoTags');
        const titleLock = document.getElementById('titleLockIcon');
        const descLock = document.getElementById('descriptionLockIcon');
        const tagsLock = document.getElementById('tagsLockIcon');
        
        if (syncTitle.checked) {
            subscribeToYjsField('title');
            titleInput.disabled = true;
            titleInput.classList.add('synced-field');
            if (titleLock) titleLock.style.display = 'inline';
        }
        if (syncDesc.checked) {
            subscribeToYjsField('body');
            descInput.disabled = true;
            descInput.classList.add('synced-field');
            if (descLock) descLock.style.display = 'inline';
        }
        if (syncTags.checked) {
            subscribeToYjsField('tags');
            tagsInput.disabled = true;
            tagsInput.classList.add('synced-field');
            if (tagsLock) tagsLock.style.display = 'inline';
        }
        
        // Check beneficiaries sync
        const syncBen = document.getElementById('syncBeneficiaries');
        if (syncBen && syncBen.checked) {
            subscribeToYjsField('beneficiaries');
            const addlBenDiv = document.getElementById('additionalBeneficiaries');
            const benLock = document.getElementById('beneficiariesLockIcon');
            if (addlBenDiv) addlBenDiv.style.display = 'block';
            if (benLock) benLock.style.display = 'inline';
        }
    }, 500); // Small delay to ensure parent is ready
}

// Subscribe to Y.js field
function subscribeToYjsField(field) {
    console.log(`📡 Subscribing to Y.js field: ${field}`);
    yjsFieldSubscriptions[field] = true;
    
    sendToParent({
        type: 'SUBSCRIBE_YDOC_FIELD',
        field: field
    });
}

// Unsubscribe from Y.js field
function unsubscribeFromYjsField(field) {
    console.log(`🔕 Unsubscribing from Y.js field: ${field}`);
    yjsFieldSubscriptions[field] = false;
    
    sendToParent({
        type: 'UNSUBSCRIBE_YDOC_FIELD',
        field: field
    });
}

// Handle Y.js field update
function handleYjsFieldUpdate(field, value) {
    console.log(`📥 Y.js field update: ${field} =`, value);
    
    // Only update if we're subscribed and sync is enabled
    if (!yjsFieldSubscriptions[field]) return;
    
    // Set flag to prevent feedback loop
    isUpdatingFromParent = true;
    
    switch(field) {
        case 'title':
            if (document.getElementById('syncTitle').checked) {
                document.getElementById('videoTitle').value = value || '';
                console.log('✅ Updated video title from Y.js:', value);
            }
            break;
            
        case 'body':
            if (document.getElementById('syncDescription').checked) {
                document.getElementById('videoDescription').value = value || '';
                console.log('✅ Updated video description from Y.js:', value);
            }
            break;
            
        case 'tags':
            if (document.getElementById('syncTags').checked) {
                // Convert tags array to comma-separated string
                const tagsString = Array.isArray(value) ? value.join(', ') : '';
                document.getElementById('videoTags').value = tagsString;
                console.log('✅ Updated video tags from Y.js:', tagsString);
            }
            break;
            
        case 'beneficiaries':
            if (document.getElementById('syncBeneficiaries').checked) {
                // Store additional beneficiaries (excluding 3Speak required ones)
                additionalBeneficiaries = Array.isArray(value) ? value.filter(ben => 
                    ben.account !== 'spk.beneficiary' && ben.account !== 'threespeakleader'
                ) : [];
                
                // Update UI to show additional beneficiaries
                updateBeneficiariesDisplay();
                console.log('✅ Updated beneficiaries from Y.js:', additionalBeneficiaries);
            }
            break;
    }
    
    // Re-enable reactive updates after a short delay
    setTimeout(() => { 
        isUpdatingFromParent = false; 
    }, 200);
}

function sendToParent(message) {
    if (window.parent && window.parent !== window) {
        window.parent.postMessage(message, '*');
    }
}

function requestParentData(field) {
    sendToParent({
        type: 'requestData',
        field: field
    });
}

// Check for initial data
function checkInitialData() {
    // Request initial data from parent
    sendToParent({ type: 'ready' });
}

// Utility functions
function formatDuration(seconds) {
    if (!seconds || seconds === 0) return '--:--';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
}

function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '-- MB';
    
    const mb = bytes / (1024 * 1024);
    return mb.toFixed(2) + ' MB';
}

function showStatus(message, type = 'info') {
    const statusEl = document.getElementById('statusMessage');
    statusEl.textContent = message;
    statusEl.className = 'text-' + (type === 'error' ? 'danger' : type === 'success' ? 'success' : 'muted') + ' small';
    
    if (type !== 'error') {
        setTimeout(() => {
            statusEl.textContent = '';
        }, 3000);
    }
}

// Update beneficiaries display
function updateBeneficiariesDisplay() {
    const listEl = document.getElementById('additionalBeneficiariesList');
    if (!listEl) return;
    
    listEl.innerHTML = '';
    
    if (additionalBeneficiaries.length === 0) {
        listEl.innerHTML = '<li class="text-muted">None</li>';
    } else {
        additionalBeneficiaries.forEach(ben => {
            const li = document.createElement('li');
            li.innerHTML = `<i class="fas fa-user me-1"></i>${ben.account}: ${(ben.weight / 100).toFixed(1)}%`;
            listEl.appendChild(li);
        });
    }
}

// Get all beneficiaries (3Speak required + additional)
function getAllBeneficiaries() {
    const required = [
        { account: 'spk.beneficiary', weight: 900 },
        { account: 'threespeakleader', weight: 100 }
    ];
    
    if (document.getElementById('syncBeneficiaries').checked) {
        return [...required, ...additionalBeneficiaries];
    }
    
    return required;
}