import { createApp } from '/js/vue.esm-browser.js'

export default {
  name: 'GenerativeNftBuilder',
  props: {
    account: {
      type: String,
      default: 'GUEST'
    },
    spkapi: {
      type: Object,
      default: () => ({})
    },
    protocol: {
      type: Object,
      default: () => ({})
    },
    setAttributes: {
      type: Object,
      default: () => ({})
    },
    fileMetadata: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['script-generated', 'tosign'],
  data() {
    return {
      generativeData: {
        layers: [
          {
            name: 'Background',
            traits: [],
            zIndex: 1,
            required: true // First layer is always required
          }
        ],
        totalSupply: 1000,
        previewStart: 0,
        previewEnd: 10,
        generatedScript: '',
        scriptHash: '',
        rarityCategories: {
          common: { label: 'Common', weight: 50, color: '#6c757d' },
          uncommon: { label: 'Uncommon', weight: 30, color: '#28a745' },
          rare: { label: 'Rare', weight: 15, color: '#007bff' },
          epic: { label: 'Epic', weight: 8, color: '#6f42c1' },
          legendary: { label: 'Legendary', weight: 3, color: '#fd7e14' },
          mythic: { label: 'Mythic', weight: 1, color: '#dc3545' }
        }
      },
      isGenerating: false,
      dragOverLayer: null,
      previewNFTs: [],
      isLoadingPreview: false,
      showRarityConfig: false
    };
  },
  computed: {
    canGenerateScript() {
      return this.generativeData.layers.some(layer => layer.traits.length > 0);
    },
    totalTraits() {
      return this.generativeData.layers.reduce((total, layer) => total + layer.traits.length, 0);
    },
    estimatedCombinations() {
      return this.generativeData.layers.reduce((total, layer) => {
        return total * (layer.traits.length || 1);
      }, 1);
    },
    supportedFileTypes() {
      return '.png,.jpg,.jpeg,.svg,.webp';
    }
  },
  methods: {
    addLayer(index = null) {
      const newLayer = {
        name: `Layer ${this.generativeData.layers.length + 1}`,
        traits: [],
        zIndex: this.generativeData.layers.length + 1,
        required: false
      };
      
      if (index !== null) {
        this.generativeData.layers.splice(index, 0, newLayer);
      } else {
        this.generativeData.layers.push(newLayer);
      }
      
      this.updateLayerIndices();
    },
    
    removeLayer(index) {
      if (this.generativeData.layers.length > 1) {
        this.generativeData.layers.splice(index, 1);
        this.updateLayerIndices();
      }
    },
    
    updateLayerIndices() {
      this.generativeData.layers.forEach((layer, index) => {
        layer.zIndex = index + 1;
      });
    },
    

    
    handleDrop(event, layerIndex) {
      event.preventDefault();
      
      // Check if we're getting data from SPK file viewer
      const itemIds = event.dataTransfer.getData('itemids');
      const fileId = event.dataTransfer.getData('fileid');
      const contractId = event.dataTransfer.getData('contractid');
      
      if ((itemIds || fileId) && contractId) {
        // Handle SPK file drop
        this.processCIDDrop(event, layerIndex);
      } else {
        // No direct file upload - users must use SPK Drive
        this.showToast('Please upload files to SPK Drive above first, then drag them here', 'info');
      }
      
      this.dragOverLayer = null;
    },
    
    handleDragOver(event, layerIndex) {
      event.preventDefault();
      this.dragOverLayer = layerIndex;
    },
    
    handleDragLeave(event, layerIndex) {
      event.preventDefault();
      // Only clear if we're really leaving the drop zone
      if (!event.currentTarget.contains(event.relatedTarget)) {
        this.dragOverLayer = null;
      }
    },
    
    async processCIDDrop(event, layerIndex) {
      const layer = this.generativeData.layers[layerIndex];
      
      // Get data from SPK file drag
      let fileIds = [];
      const itemIdsStr = event.dataTransfer.getData("itemids");
      if (itemIdsStr) {
        try {
          fileIds = JSON.parse(itemIdsStr);
        } catch (e) {
          // Fallback to individual file ID
          const fileId = event.dataTransfer.getData("fileid");
          if (fileId) fileIds = [fileId];
        }
      } else {
        // Try single file ID format
        const fileId = event.dataTransfer.getData("fileid");
        if (fileId) fileIds = [fileId];
      }
      
      const contractId = event.dataTransfer.getData("contractid");
      
      if (!fileIds.length || !contractId) {
        this.showToast('No valid file data found in drop', 'warning');
        return;
      }
      
      // Process each file ID
      for (const fileId of fileIds) {
        // Skip folders
        if (fileId.startsWith('folder-')) continue;
        
        try {
          // Get file metadata from parent component
          const metadata = this.fileMetadata[contractId]?.[fileId];
          const fileName = metadata?.name || `Asset_${fileId.substring(0, 8)}`;
          const fileType = metadata?.type || 'image/png';
          
          // Use thumbnail if available for better performance
          let previewUrl = `https://ipfs.dlux.io/ipfs/${fileId}`;
          if (metadata?.thumb) {
            previewUrl = this.getSmartThumb(metadata.thumb);
          }
          
          const trait = {
            name: fileName.replace(/\.[^/.]+$/, ""), // Remove extension
            file: null, // No file object since we have CID
            preview: previewUrl, // Use thumbnail or full image
            ipfsHash: fileId, // The fileId IS the CID in SPK
            rarity: 'common', // Default rarity category
            type: fileType,
            uploading: false, // Already uploaded to IPFS
            fromSPK: true, // Flag to indicate source
            contractId: contractId,
            hasThumbnail: !!metadata?.thumb
          };
          
          layer.traits.push(trait);
          this.showToast(`Added ${trait.name} to ${layer.name}`, 'success');
          
        } catch (error) {
          console.error('Error processing CID:', fileId, error);
          this.showToast(`Error processing ${fileId}`, 'danger');
        }
      }
    },


    


    isImageFile(filename, type) {
      const supportedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
      const supportedExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.svg'];
      
      // Check by MIME type if available
      if (type && supportedTypes.includes(type.toLowerCase())) {
        return true;
      }
      
      // Check by file extension
      const extension = filename.toLowerCase().match(/\.[^.]+$/);
      return extension && supportedExtensions.includes(extension[0]);
    },

    getFileTypeFromName(filename) {
      const extension = filename.toLowerCase().match(/\.[^.]+$/);
      if (!extension) return 'image/png'; // Default
      
      switch (extension[0]) {
        case '.png': return 'image/png';
        case '.jpg':
        case '.jpeg': return 'image/jpeg';
        case '.webp': return 'image/webp';
        case '.svg': return 'image/svg+xml';
        default: return 'image/png';
      }
    },

    getSmartThumb(thumbData) {
      if (typeof thumbData === 'string') {
        if (thumbData.startsWith('https://')) {
          return thumbData;
        } else if (thumbData.startsWith('Qm')) {
          return `https://ipfs.dlux.io/ipfs/${thumbData}`;
        } else if (thumbData.startsWith('data:image/')) {
          return thumbData; // Base64 encoded image
        }
      }
      return `https://ipfs.dlux.io/ipfs/${thumbData}`; // Fallback
    },

    detectImageType(trait) {
      // Create a test image to detect the actual file type
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        // Image loaded successfully, it's a valid image
        console.log(`Successfully loaded image: ${trait.ipfsHash}`);
        
        // Try to detect type from the URL response headers
        fetch(trait.preview, { method: 'HEAD' })
          .then(response => {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.startsWith('image/')) {
              trait.type = contentType;
            }
          })
          .catch(() => {
            // If HEAD request fails, keep default type
            console.log('Could not detect content type for:', trait.ipfsHash);
          });
      };
      
      img.onerror = () => {
        // Image failed to load, might not be an image or might be SVG
        console.warn(`Failed to load as image: ${trait.ipfsHash}`);
        
        // Try to fetch as text to see if it's SVG
        fetch(trait.preview)
          .then(response => response.text())
          .then(text => {
            if (text.trim().startsWith('<svg') || text.includes('<svg')) {
              trait.type = 'image/svg+xml';
              console.log('Detected SVG file:', trait.ipfsHash);
            } else {
              // If it's not SVG and not loading as image, show warning
              this.showToast(`Warning: ${trait.name} may not be a valid image file`, 'warning');
            }
          })
          .catch(() => {
            this.showToast(`Warning: Could not verify ${trait.name} as an image`, 'warning');
          });
      };
      
      img.src = trait.preview;
    },
    

    
    validateHeaders(rawHeaders) {
      return new Promise((resolve, reject) => {
        if (!rawHeaders || rawHeaders.split(":")[0] < Date.now() - 600000000) {
          // Emit toSign event for authentication
          const authOp = {
            type: "sign_headers",
            challenge: Date.now(),
            key: "posting",
            ops: [],
            callbacks: [resolve],
            txid: 'Sign Auth Headers for NFT Upload'
          };
          this.$emit('tosign', authOp);
        } else {
          resolve(rawHeaders);
        }
      });
    },
    
    removeTrait(layerIndex, traitIndex) {
      this.generativeData.layers[layerIndex].traits.splice(traitIndex, 1);
    },

    addRarityCategory() {
      const newKey = `custom_${Date.now()}`;
      this.$set(this.generativeData.rarityCategories, newKey, {
        label: 'New Category',
        weight: 10,
        color: '#ffffff'
      });
    },

    removeRarityCategory(key) {
      // Don't allow removing if it's the last category or if traits are using it
      const categoryKeys = Object.keys(this.generativeData.rarityCategories);
      if (categoryKeys.length <= 1) {
        this.showToast('Cannot remove the last rarity category', 'warning');
        return;
      }

      // Check if any traits are using this category
      const isInUse = this.generativeData.layers.some(layer =>
        layer.traits.some(trait => trait.rarity === key)
      );

      if (isInUse) {
        this.showToast('Cannot remove category - it is in use by traits', 'warning');
        return;
      }

      this.$delete(this.generativeData.rarityCategories, key);
    },

    validateRarityWeights() {
      // Ensure weights are positive numbers
      Object.keys(this.generativeData.rarityCategories).forEach(key => {
        const category = this.generativeData.rarityCategories[key];
        if (category.weight <= 0) {
          category.weight = 1;
        }
      });
    },
    
    async generateScript() {
      if (!this.canGenerateScript) {
        this.showToast('Please add traits to at least one layer before generating', 'warning');
        return;
      }
      
      // Check if all traits are uploaded
      const pendingUploads = this.generativeData.layers.some(layer =>
        layer.traits.some(trait => trait.uploading || !trait.ipfsHash)
      );
      
      if (pendingUploads) {
        this.showToast('Please wait for all traits to finish uploading', 'warning');
        return;
      }
      
      this.isGenerating = true;
      
      try {
        // Build trait arrays for the script
        const script = this.buildGenerativeScript();
        
        this.generativeData.generatedScript = script;
        
        // Upload to IPFS
        await this.uploadScriptToIPFS(script);
        
        this.showToast('Script generated successfully!', 'success');
        
        // Generate preview NFTs
        await this.generatePreviewNFTs();
        
      } catch (error) {
        console.error('Error generating script:', error);
        this.showToast('Error generating script', 'danger');
      } finally {
        this.isGenerating = false;
      }
    },
    
    buildGenerativeScript() {
      // Build the data structures for the script
      const layerData = this.generativeData.layers.map(layer => ({
        name: layer.name,
        traits: layer.traits.map(trait => ({
          name: trait.name,
          hash: trait.ipfsHash,
          weight: this.generativeData.rarityCategories[trait.rarity]?.weight || 50,
          type: trait.type
        })),
        required: layer.required
      }));
      
      // Create the generative script template
      const script = `<!DOCTYPE html>
//<html><head><script>
function compile(m, d) {
  const layerData = ${JSON.stringify(layerData, null, 2)};
  
  const Base64 = {
    _Rixits: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+=",
    toNumber: function(chars) {
      var result = 0;
      chars = chars.split('');
      for (var e = 0; e < chars.length; e++) {
        result = (result * 64) + this._Rixits.indexOf(chars[e]);
      }
      return result;
    }
  };
  
  const uid = Base64.toNumber(m);
  const selectedTraits = [];
  const attributes = [];
  
  // Generate traits for each layer
  let seed = uid;
  layerData.forEach((layer, layerIndex) => {
    if (layer.traits.length === 0) return;
    
    // Calculate weighted random selection
    const totalWeight = layer.traits.reduce((sum, trait) => sum + trait.weight, 0);
    let random = seed % totalWeight;
    
    let selectedTrait = null;
    for (let i = 0; i < layer.traits.length; i++) {
      random -= layer.traits[i].weight;
      if (random <= 0) {
        selectedTrait = layer.traits[i];
        break;
      }
    }
    
    if (selectedTrait) {
      selectedTraits.push({
        ...selectedTrait,
        zIndex: layerIndex
      });
      
      attributes.push({
        [layer.name]: selectedTrait.name
      });
    }
    
    // Update seed for next layer
    seed = Math.floor(seed / (layer.traits.length + 1)) + 1;
  });
  
  // Build layered HTML
  let html = '<div style="position:relative; width:100%; height:100%; max-width:512px; max-height:512px; margin:0 auto;">';
  
  selectedTraits.forEach((trait) => {
    const imageUrl = \`https://ipfs.dlux.io/ipfs/\${trait.hash}\`;
    
    if (trait.type === 'image/svg+xml') {
      // For SVGs, we can embed them directly or use as img src
      html += \`<img style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:contain; z-index:\${trait.zIndex};" src="\${imageUrl}" alt="\${trait.name}">\`;
    } else {
      // For raster images (PNG, JPG, etc.)
      html += \`<img style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:contain; z-index:\${trait.zIndex};" src="\${imageUrl}" alt="\${trait.name}">\`;
    }
  });
  
  html += '</div>';
  
  if (d) {
    document.getElementById('body').innerHTML = html;
  } else {
    return {
      HTML: html,
      attributes: attributes,
      set: {
        Color1: '${this.setAttributes.color1 || '#ffffff'}',
        Color2: '${this.setAttributes.color2 || '#000000'}',
        Description: \`${this.setAttributes.description || 'A generative NFT collection'}\`,
        faicon: '${this.setAttributes.faicon || 'fa-solid fa-gem'}',
        banner: '${this.setAttributes.banner || ''}',
        featured: '${this.setAttributes.featured || ''}',
        logo: '${this.setAttributes.logo || ''}',
        wrapped: '${this.setAttributes.wrapped || ''}',
        category: ${JSON.stringify(this.setAttributes.categories || [])},
        links: ${JSON.stringify(this.setAttributes.links || [])}
      }
    };
  }
}
//</script>
/*
//<script>
if(window.addEventListener){window.addEventListener("message",onMessage,false);}else if(window.attachEvent){window.attachEvent("onmessage", onMessage, false);};function onMessage(event){var data=event.data;if(typeof (window[data.func])=="function"){const got=window[data.func].call(null,data.message);window.parent.postMessage({'func': 'compiled','message':got},"*")}};function onLoad(id){window.parent.postMessage({'func':'loaded','message':id},"*")}
//</script>
*/
//</head><body id="body">Append ?NFT_UID to the address bar to see that NFT. "...html?A6"<script>const uid = location.href.split('?')[1]; if (uid) { compile(uid, true) } else { onLoad(uid) }</script></body></html>`;
      
      return script;
    },
    
    async uploadScriptToIPFS(script) {
      try {
        const rawHeaders = localStorage.getItem(`${this.account}:auth`);
        const headers = await this.validateHeaders(rawHeaders);
        
        if (window.IpfsHttpClient) {
          const ipfs = window.IpfsHttpClient({
            host: "ipfs.dlux.io",
            port: "443",
            protocol: "https",
            headers: {
              account: this.account,
              nonce: headers.split(":")[0],
              sig: headers.split(":")[1],
            },
          });
          
          const buf = buffer.Buffer.from(script);
          
          return new Promise((resolve, reject) => {
            ipfs.add(buf, (err, ipfsReturn) => {
              if (!err && ipfsReturn && ipfsReturn[0]) {
                this.generativeData.scriptHash = ipfsReturn[0].hash;
                this.showToast(`Script uploaded to IPFS: ${ipfsReturn[0].hash}`, 'success');
                
                // Emit the script hash to parent component
                this.$emit('script-generated', {
                  hash: ipfsReturn[0].hash,
                  script: script,
                  layers: this.generativeData.layers,
                  totalSupply: this.generativeData.totalSupply
                });
                
                resolve(ipfsReturn[0].hash);
              } else {
                console.error("IPFS Upload Failed", err);
                this.showToast('Failed to upload script to IPFS', 'danger');
                reject(err);
              }
            });
          });
        }
      } catch (error) {
        console.error('Error uploading to IPFS:', error);
        this.showToast('Error uploading to IPFS', 'danger');
        throw error;
      }
    },
    
    async generatePreviewNFTs() {
      this.isLoadingPreview = true;
      this.previewNFTs = [];
      
      try {
        const start = parseInt(this.generativeData.previewStart) || 0;
        const end = Math.min(parseInt(this.generativeData.previewEnd) || 10, start + 20); // Limit to 20 previews
        
        for (let i = start; i < end; i++) {
          const uid = this.numberToBase64(i);
          const preview = this.generateSinglePreview(uid, i);
          this.previewNFTs.push(preview);
        }
      } catch (error) {
        console.error('Error generating previews:', error);
      } finally {
        this.isLoadingPreview = false;
      }
    },
    
    generateSinglePreview(uid, index) {
      // Use the same logic as in the script but synchronously
      const layerData = this.generativeData.layers.map(layer => ({
        name: layer.name,
        traits: layer.traits.map(trait => ({
          name: trait.name,
          hash: trait.ipfsHash,
          weight: this.generativeData.rarityCategories[trait.rarity]?.weight || 50,
          type: trait.type
        })),
        required: layer.required
      }));
      
      const selectedTraits = [];
      const attributes = [];
      
      let seed = index;
      layerData.forEach((layer, layerIndex) => {
        if (layer.traits.length === 0) return;
        
        const totalWeight = layer.traits.reduce((sum, trait) => sum + trait.weight, 0);
        let random = seed % totalWeight;
        
        let selectedTrait = null;
        for (let i = 0; i < layer.traits.length; i++) {
          random -= layer.traits[i].weight;
          if (random <= 0) {
            selectedTrait = layer.traits[i];
            break;
          }
        }
        
        if (selectedTrait) {
          selectedTraits.push({
            ...selectedTrait,
            zIndex: layerIndex
          });
          
          attributes.push({
            [layer.name]: selectedTrait.name
          });
        }
        
        seed = Math.floor(seed / (layer.traits.length + 1)) + 1;
      });
      
      return {
        uid,
        index,
        traits: selectedTraits,
        attributes,
        layers: selectedTraits.map(trait => ({
          url: `https://ipfs.dlux.io/ipfs/${trait.hash}`,
          name: trait.name,
          zIndex: trait.zIndex
        }))
      };
    },
    
    numberToBase64(num) {
      const glyphs = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+=";
      let result = "";
      while (num > 0) {
        result = glyphs[num % 64] + result;
        num = Math.floor(num / 64);
      }
      return result || "0";
    },
    
    showToast(message, type = 'info') {
      // Create a simple toast notification
      const toast = document.createElement('div');
      toast.className = `alert alert-${type} position-fixed`;
      toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
      toast.innerHTML = `
        <div class="d-flex align-items-center">
          <i class="fa-solid fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-circle' : 'info-circle'} fa-fw me-2"></i>
          ${message}
        </div>
      `;
      
      document.body.appendChild(toast);
      
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 3000);
    }
  },
  
  template: `
    <div class="generative-nft-builder">
      <!-- Header -->
      <div class="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 class="mb-1">
            <i class="fa-solid fa-magic fa-fw me-2"></i>Generative NFT Builder
          </h4>
          <p class="text-muted mb-0">
            Create unique collections with layered traits. Supports PNG, JPG, SVG, and WebP.
          </p>
        </div>
        <div class="text-end">
          <div class="small text-muted">
            <div><strong>{{ totalTraits }}</strong> traits uploaded</div>
            <div><strong>{{ estimatedCombinations.toLocaleString() }}</strong> possible combinations</div>
          </div>
        </div>
      </div>

      <!-- Trait Layers -->
      <div class="accordion mb-4" id="traitsAccordion">
        <div v-for="(layer, layerIndex) in generativeData.layers" :key="layerIndex" 
             class="accordion-item bg-dark border-secondary">
          <h2 class="accordion-header">
            <button class="accordion-button bg-dark text-white border-0" type="button" 
                    :data-bs-target="'#layer' + layerIndex" 
                    data-bs-toggle="collapse"
                    aria-expanded="true">
              <i class="fa-solid fa-layer-group fa-fw me-2"></i>
              {{ layer.name || ('Layer ' + (layerIndex + 1)) }}
              <span class="badge bg-primary ms-2">{{ layer.traits.length }} traits</span>
              <span v-if="layer.required" class="badge bg-warning ms-1">Required</span>
            </button>
          </h2>
          <div :id="'layer' + layerIndex" class="accordion-collapse collapse show">
            <div class="accordion-body">
              <!-- Layer Settings -->
              <div class="row mb-3">
                <div class="col-md-8">
                  <label class="form-label">Layer Name</label>
                  <input type="text" class="form-control bg-darker border-secondary text-white" 
                         v-model="layer.name" 
                         placeholder="e.g., Background, Body, Eyes, Hat">
                </div>
                <div class="col-md-4">
                  <label class="form-label">Layer Type</label>
                  <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" 
                           v-model="layer.required" 
                           :disabled="layerIndex === 0">
                    <label class="form-check-label text-white">
                      {{ layer.required ? 'Required' : 'Optional' }}
                    </label>
                  </div>
                </div>
              </div>

              <!-- Drop Zone -->
              <div class="drop-zone mb-3" 
                   :class="{ 'dragover': dragOverLayer === layerIndex }"
                   @drop="handleDrop($event, layerIndex)"
                   @dragover="handleDragOver($event, layerIndex)"
                   @dragleave="handleDragLeave($event, layerIndex)">
                <div class="drop-zone-content">
                  <i class="fa-solid fa-layer-group fa-3x mb-2"></i>
                  <p class="mb-2">Drag images from SPK Drive above</p>
                  <p class="small mb-2 text-muted">
                    <i class="fa-solid fa-hard-drive me-1"></i>Upload files to SPK Drive first, then drag them here
                  </p>
                  <p class="small text-info">
                    <i class="fa-solid fa-info-circle me-1"></i>Supports: PNG, JPG, SVG, WebP
                  </p>
                </div>
              </div>

              <!-- Trait Grid -->
              <div v-if="layer.traits.length" class="trait-grid">
                <div v-for="(trait, traitIndex) in layer.traits" :key="traitIndex" 
                     class="trait-item">
                  <!-- Trait Preview -->
                  <div class="trait-preview">
                    <div v-if="trait.uploading" class="upload-overlay">
                      <div class="spinner-border spinner-border-sm text-primary" role="status">
                        <span class="visually-hidden">Uploading...</span>
                      </div>
                    </div>
                    <img :src="trait.preview" 
                         :alt="trait.name" 
                         class="trait-image"
                         loading="lazy"
                         style="max-width: 100%; max-height: 120px; object-fit: contain;">
                    <button type="button" class="btn btn-sm btn-danger trait-remove"
                            @click="removeTrait(layerIndex, traitIndex)"
                            :disabled="trait.uploading">
                      <i class="fa-solid fa-times"></i>
                    </button>
                    <div v-if="trait.ipfsHash" class="trait-status">
                      <i class="fa-solid fa-check-circle text-success" 
                         :title="trait.hasThumbnail ? 'Using optimized thumbnail' : 'Using full resolution'"></i>
                    </div>
                    <div v-if="trait.fromSPK" class="trait-status" style="top: 24px;">
                      <i class="fa-solid fa-hard-drive text-info" title="From SPK Drive"></i>
                    </div>
                  </div>
                  
                  <!-- Trait Name -->
                  <input type="text" class="form-control form-control-sm mt-1 bg-darker border-secondary text-white" 
                         v-model="trait.name" 
                         placeholder="Trait name">
                  
                  <!-- Rarity Controls -->
                  <div class="rarity-controls mt-2">
                    <label class="small text-muted">Rarity:</label>
                    <select class="form-select form-select-sm bg-darker border-secondary text-white" 
                            v-model="trait.rarity">
                      <option v-for="(category, key) in generativeData.rarityCategories" 
                              :key="key" 
                              :value="key"
                              :style="{ color: category.color }">
                        {{ category.label }} ({{ category.weight }}%)
                      </option>
                    </select>
                  </div>
                  
                  <!-- Rarity Badge and IPFS Hash -->
                  <div class="d-flex justify-content-between align-items-center mt-1">
                    <span class="badge text-dark" 
                          :style="{ backgroundColor: generativeData.rarityCategories[trait.rarity]?.color || '#6c757d' }">
                      {{ generativeData.rarityCategories[trait.rarity]?.label || 'Common' }}
                    </span>
                    <small v-if="trait.ipfsHash" class="text-success">
                      <i class="fa-solid fa-link me-1"></i>
                      {{ trait.ipfsHash.substring(0, 6) }}...
                    </small>
                  </div>
                </div>
              </div>

              <!-- Layer Actions -->
              <div class="d-flex justify-content-between mt-3">
                <button type="button" class="btn btn-outline-success btn-sm"
                        @click="addLayer(layerIndex + 1)">
                  <i class="fa-solid fa-plus me-1"></i>Add Layer After
                </button>
                <button type="button" class="btn btn-outline-danger btn-sm"
                        @click="removeLayer(layerIndex)" 
                        :disabled="generativeData.layers.length <= 1">
                  <i class="fa-solid fa-trash me-1"></i>Remove Layer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Layer Button -->
      <div class="text-center mb-4">
        <button type="button" class="btn btn-success" @click="addLayer()">
          <i class="fa-solid fa-plus me-2"></i>Add New Layer
        </button>
      </div>

      <!-- Generation Settings -->
      <div class="row mb-4">
        <div class="col-md-4">
          <div class="card bg-dark border-secondary">
            <div class="card-body">
              <h5 class="card-title">Collection Settings</h5>
              <div class="mb-3">
                <label class="form-label">Total Supply</label>
                <input type="number" class="form-control bg-darker border-secondary text-white" 
                       v-model="generativeData.totalSupply" 
                       min="1" max="10000">
              </div>
              <div class="row">
                <div class="col-6">
                  <label class="form-label">Preview From</label>
                  <input type="number" class="form-control bg-darker border-secondary text-white" 
                         v-model="generativeData.previewStart" 
                         min="0" placeholder="0">
                </div>
                <div class="col-6">
                  <label class="form-label">Preview To</label>
                  <input type="number" class="form-control bg-darker border-secondary text-white" 
                         v-model="generativeData.previewEnd" 
                         min="1" placeholder="10">
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card bg-dark border-secondary">
            <div class="card-body">
              <h5 class="card-title">Statistics</h5>
              <ul class="list-unstyled mb-0">
                <li><strong>Layers:</strong> {{ generativeData.layers.length }}</li>
                <li><strong>Total Traits:</strong> {{ totalTraits }}</li>
                <li><strong>Combinations:</strong> {{ estimatedCombinations.toLocaleString() }}</li>
                <li><strong>Uniqueness:</strong> 
                  <span :class="estimatedCombinations >= generativeData.totalSupply ? 'text-success' : 'text-warning'">
                    {{ estimatedCombinations >= generativeData.totalSupply ? 'Sufficient' : 'Limited' }}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card bg-dark border-secondary">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="card-title mb-0">Rarity Categories</h5>
              <button type="button" class="btn btn-sm btn-outline-primary" 
                      @click="showRarityConfig = !showRarityConfig">
                <i class="fa-solid fa-cog"></i>
              </button>
            </div>
            <div class="card-body" v-show="showRarityConfig">
              <div v-for="(category, key) in generativeData.rarityCategories" :key="key" 
                   class="mb-2 p-2 border border-secondary rounded">
                <div class="row g-2">
                  <div class="col-6">
                    <input type="text" class="form-control form-control-sm bg-darker border-secondary text-white" 
                           v-model="category.label" placeholder="Category name">
                  </div>
                  <div class="col-3">
                    <input type="number" class="form-control form-control-sm bg-darker border-secondary text-white" 
                           v-model.number="category.weight" min="1" max="100" 
                           @change="validateRarityWeights">
                  </div>
                  <div class="col-2">
                    <input type="color" class="form-control form-control-color form-control-sm" 
                           v-model="category.color" style="height: 31px;">
                  </div>
                  <div class="col-1">
                    <button type="button" class="btn btn-sm btn-outline-danger" 
                            @click="removeRarityCategory(key)"
                            :disabled="Object.keys(generativeData.rarityCategories).length <= 1">
                      <i class="fa-solid fa-times"></i>
                    </button>
                  </div>
                </div>
              </div>
              <button type="button" class="btn btn-sm btn-outline-success w-100 mt-2" 
                      @click="addRarityCategory">
                <i class="fa-solid fa-plus me-1"></i>Add Category
              </button>
            </div>
            <div class="card-body" v-show="!showRarityConfig">
              <div class="d-flex flex-wrap gap-1">
                <span v-for="(category, key) in generativeData.rarityCategories" :key="key"
                      class="badge text-dark" 
                      :style="{ backgroundColor: category.color }">
                  {{ category.label }} ({{ category.weight }}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Generate Button -->
      <div class="text-center mb-4">
        <button type="button" 
                class="btn btn-primary btn-lg" 
                @click="generateScript()" 
                :disabled="!canGenerateScript || isGenerating">
          <span v-if="isGenerating" class="spinner-border spinner-border-sm me-2" role="status"></span>
          <i v-else class="fa-solid fa-magic me-2"></i>
          {{ isGenerating ? 'Generating...' : 'Generate NFT Script' }}
        </button>
      </div>

      <!-- Script Generated Success -->
      <div v-if="generativeData.scriptHash" class="alert alert-success">
        <h5><i class="fa-solid fa-check-circle me-2"></i>Script Generated Successfully!</h5>
        <p class="mb-2">Your generative NFT script has been uploaded to IPFS:</p>
        <div class="d-flex align-items-center gap-2">
          <code class="bg-dark px-2 py-1 rounded">{{ generativeData.scriptHash }}</code>
          <button class="btn btn-sm btn-outline-success" 
                  @click="navigator.clipboard.writeText(generativeData.scriptHash)">
            <i class="fa-solid fa-copy"></i>
          </button>
        </div>
      </div>

      <!-- Preview Section -->
      <div v-if="previewNFTs.length" class="mt-4">
        <h5><i class="fa-solid fa-eye me-2"></i>Preview Collection</h5>
        <div v-if="isLoadingPreview" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading previews...</span>
          </div>
        </div>
        <div v-else class="preview-grid">
          <div v-for="nft in previewNFTs" :key="nft.uid" class="preview-item">
            <div class="preview-nft">
              <div class="preview-layers">
                <img v-for="layer in nft.layers" 
                     :key="layer.url"
                     :src="layer.url" 
                     :alt="layer.name"
                     :style="{ zIndex: layer.zIndex }"
                     class="preview-layer">
              </div>
            </div>
            <div class="mt-2">
              <div class="small text-muted">NFT #{{ nft.index }} ({{ nft.uid }})</div>
              <div class="small">
                <div v-for="attr in nft.attributes" :key="Object.keys(attr)[0]" class="text-truncate">
                  <strong>{{ Object.keys(attr)[0] }}:</strong> {{ Object.values(attr)[0] }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}; 