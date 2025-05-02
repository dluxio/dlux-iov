/**
 * Render the asset manager UI
 * @param {HTMLElement} container - Container element
 * @param {Object} state - Application state
 * @param {Function} updateState - Function to update state
 */
function renderAssetManager(container, state, updateState) {
  const assetManager = document.createElement('div');
  assetManager.className = 'asset-manager';
  
  // Create header and add button
  const header = document.createElement('div');
  header.className = 'inspector-section-header';
  header.innerHTML = '<h3>Assets</h3>';
  
  const addButton = document.createElement('button');
  addButton.innerHTML = '+ Add Asset';
  addButton.className = 'add-asset-btn';
  addButton.addEventListener('click', () => {
    // Show asset upload modal
    showAssetUploadModal(state, updateState);
  });
  
  header.appendChild(addButton);
  assetManager.appendChild(header);
  
  // Create asset list
  const assetList = document.createElement('div');
  assetList.className = 'asset-list';
  
  // Render assets if we have any
  if (state.assets && Object.keys(state.assets).length > 0) {
    Object.values(state.assets).forEach(asset => {
      const assetItem = createAssetListItem(asset, state, updateState);
      assetList.appendChild(assetItem);
    });
  } else {
    // No assets message
    const noAssets = document.createElement('div');
    noAssets.className = 'no-assets';
    noAssets.textContent = 'No assets added yet. Click "Add Asset" to upload.';
    assetList.appendChild(noAssets);
  }
  
  assetManager.appendChild(assetList);
  container.appendChild(assetManager);
}

/**
 * Create a single asset list item
 * @param {Object} asset - Asset object
 * @param {Object} state - Application state
 * @param {Function} updateState - Function to update state
 * @returns {HTMLElement} Asset list item element
 */
function createAssetListItem(asset, state, updateState) {
  const assetItem = document.createElement('div');
  assetItem.className = 'asset-item';
  assetItem.dataset.assetId = asset.id;
  
  // Create thumbnail/preview based on asset type
  const preview = document.createElement('div');
  preview.className = 'asset-preview';
  
  switch (asset.type) {
    case 'image':
      const img = document.createElement('img');
      img.src = asset.src;
      img.alt = asset.id;
      preview.appendChild(img);
      break;
    case 'video':
      preview.innerHTML = '<i class="fas fa-film"></i>';
      break;
    case 'audio':
      preview.innerHTML = '<i class="fas fa-music"></i>';
      break;
    case 'model':
      preview.innerHTML = '<i class="fas fa-cube"></i>';
      break;
    default:
      preview.innerHTML = '<i class="fas fa-file"></i>';
  }
  
  assetItem.appendChild(preview);
  
  // Asset info
  const info = document.createElement('div');
  info.className = 'asset-info';
  
  const name = document.createElement('div');
  name.className = 'asset-name';
  name.textContent = asset.id;
  
  const type = document.createElement('div');
  type.className = 'asset-type';
  type.textContent = asset.type;
  
  info.appendChild(name);
  info.appendChild(type);
  assetItem.appendChild(info);
  
  // Actions
  const actions = document.createElement('div');
  actions.className = 'asset-actions';
  
  // Edit button
  const editBtn = document.createElement('button');
  editBtn.className = 'asset-edit-btn';
  editBtn.innerHTML = '<i class="fas fa-edit"></i>';
  editBtn.title = 'Edit Asset';
  editBtn.addEventListener('click', () => {
    showAssetEditModal(asset, state, updateState);
  });
  
  // Delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'asset-delete-btn';
  deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
  deleteBtn.title = 'Delete Asset';
  deleteBtn.addEventListener('click', () => {
    // Confirm deletion
    if (confirm(`Are you sure you want to delete the asset "${asset.id}"?`)) {
      const newState = {...state};
      delete newState.assets[asset.id];
      updateState(newState);
    }
  });
  
  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);
  assetItem.appendChild(actions);
  
  return assetItem;
}

/**
 * Show modal for adding a new asset
 * @param {Object} state - Application state
 * @param {Function} updateState - Function to update state
 */
function showAssetUploadModal(state, updateState) {
  const modal = document.createElement('div');
  modal.className = 'modal asset-upload-modal';
  
  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content';
  
  // Modal header
  const header = document.createElement('div');
  header.className = 'modal-header';
  header.innerHTML = '<h2>Add New Asset</h2>';
  
  const closeBtn = document.createElement('span');
  closeBtn.className = 'close-modal';
  closeBtn.innerHTML = '&times;';
  closeBtn.addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  header.appendChild(closeBtn);
  modalContent.appendChild(header);
  
  // Modal body - form
  const form = document.createElement('form');
  form.className = 'asset-form';
  
  // Asset ID
  const idField = document.createElement('div');
  idField.className = 'form-field';
  idField.innerHTML = '<label for="asset-id">Asset ID:</label>';
  
  const idInput = document.createElement('input');
  idInput.type = 'text';
  idInput.id = 'asset-id';
  idInput.name = 'asset-id';
  idInput.required = true;
  
  idField.appendChild(idInput);
  form.appendChild(idField);
  
  // Asset type
  const typeField = document.createElement('div');
  typeField.className = 'form-field';
  typeField.innerHTML = '<label for="asset-type">Asset Type:</label>';
  
  const typeSelect = document.createElement('select');
  typeSelect.id = 'asset-type';
  typeSelect.name = 'asset-type';
  
  const types = [
    { value: 'image', label: 'Image' },
    { value: 'video', label: 'Video' },
    { value: 'audio', label: 'Audio' },
    { value: 'model', label: 'Model' }
  ];
  
  types.forEach(type => {
    const option = document.createElement('option');
    option.value = type.value;
    option.textContent = type.label;
    typeSelect.appendChild(option);
  });
  
  typeField.appendChild(typeSelect);
  form.appendChild(typeField);
  
  // Source URL
  const srcField = document.createElement('div');
  srcField.className = 'form-field';
  srcField.innerHTML = '<label for="asset-src">Asset URL:</label>';
  
  const srcInput = document.createElement('input');
  srcInput.type = 'text';
  srcInput.id = 'asset-src';
  srcInput.name = 'asset-src';
  srcInput.required = true;
  
  srcField.appendChild(srcInput);
  form.appendChild(srcField);
  
  // Submit button
  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'btn submit-asset';
  submitBtn.textContent = 'Add Asset';
  
  form.appendChild(submitBtn);
  
  // Form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const newAsset = {
      id: idInput.value.trim(),
      type: typeSelect.value,
      src: srcInput.value.trim()
    };
    
    // Validate input
    if (!newAsset.id || !newAsset.src) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Add asset to state
    const newState = {...state};
    if (!newState.assets) {
      newState.assets = {};
    }
    
    newState.assets[newAsset.id] = newAsset;
    updateState(newState);
    
    // Close modal
    document.body.removeChild(modal);
  });
  
  modalContent.appendChild(form);
  modal.appendChild(modalContent);
  
  // Add modal to document
  document.body.appendChild(modal);
}

/**
 * Show modal for editing an existing asset
 * @param {Object} asset - Asset to edit
 * @param {Object} state - Application state
 * @param {Function} updateState - Function to update state
 */
function showAssetEditModal(asset, state, updateState) {
  const modal = document.createElement('div');
  modal.className = 'modal asset-edit-modal';
  
  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content';
  
  // Modal header
  const header = document.createElement('div');
  header.className = 'modal-header';
  header.innerHTML = `<h2>Edit Asset: ${asset.id}</h2>`;
  
  const closeBtn = document.createElement('span');
  closeBtn.className = 'close-modal';
  closeBtn.innerHTML = '&times;';
  closeBtn.addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  header.appendChild(closeBtn);
  modalContent.appendChild(header);
  
  // Modal body - form
  const form = document.createElement('form');
  form.className = 'asset-form';
  
  // Asset ID (read-only)
  const idField = document.createElement('div');
  idField.className = 'form-field';
  idField.innerHTML = '<label for="asset-id">Asset ID (not editable):</label>';
  
  const idInput = document.createElement('input');
  idInput.type = 'text';
  idInput.id = 'asset-id';
  idInput.name = 'asset-id';
  idInput.value = asset.id;
  idInput.readOnly = true;
  
  idField.appendChild(idInput);
  form.appendChild(idField);
  
  // Asset type
  const typeField = document.createElement('div');
  typeField.className = 'form-field';
  typeField.innerHTML = '<label for="asset-type">Asset Type:</label>';
  
  const typeSelect = document.createElement('select');
  typeSelect.id = 'asset-type';
  typeSelect.name = 'asset-type';
  
  const types = [
    { value: 'image', label: 'Image' },
    { value: 'video', label: 'Video' },
    { value: 'audio', label: 'Audio' },
    { value: 'model', label: 'Model' }
  ];
  
  types.forEach(type => {
    const option = document.createElement('option');
    option.value = type.value;
    option.textContent = type.label;
    if (type.value === asset.type) {
      option.selected = true;
    }
    typeSelect.appendChild(option);
  });
  
  typeField.appendChild(typeSelect);
  form.appendChild(typeField);
  
  // Source URL
  const srcField = document.createElement('div');
  srcField.className = 'form-field';
  srcField.innerHTML = '<label for="asset-src">Asset URL:</label>';
  
  const srcInput = document.createElement('input');
  srcInput.type = 'text';
  srcInput.id = 'asset-src';
  srcInput.name = 'asset-src';
  srcInput.value = asset.src;
  srcInput.required = true;
  
  srcField.appendChild(srcInput);
  form.appendChild(srcField);
  
  // Submit button
  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'btn update-asset';
  submitBtn.textContent = 'Update Asset';
  
  form.appendChild(submitBtn);
  
  // Form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const updatedAsset = {
      ...asset,
      type: typeSelect.value,
      src: srcInput.value.trim()
    };
    
    // Validate input
    if (!updatedAsset.src) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Update asset in state
    const newState = {...state};
    newState.assets[asset.id] = updatedAsset;
    updateState(newState);
    
    // Close modal
    document.body.removeChild(modal);
  });
  
  modalContent.appendChild(form);
  modal.appendChild(modalContent);
  
  // Add modal to document
  document.body.appendChild(modal);
}

/**
 * Render the inspector UI
 * @param {Object} state - Current application state
 * @param {Function} updateState - Function to update state
 */
export function renderInspector(state, updateState) {
  const inspectorPanel = document.getElementById('inspector-panel');
  inspectorPanel.innerHTML = '';
  
  // First add asset manager
  renderAssetManager(inspectorPanel, state, updateState);
  
  // Then render scene settings (sky, environment, etc.)
  renderSceneSettings(inspectorPanel, state, updateState);
  
  // Then render entity inspector if entity is selected
  if (state.selectedEntity) {
    renderEntityInspector(inspectorPanel, state, updateState);
  }
} 