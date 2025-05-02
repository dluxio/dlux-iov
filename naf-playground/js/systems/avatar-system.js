/**
 * Initialize the avatar system and its components
 */
initialize() {
  if (!this.canInitialize()) {
    console.warn('[AvatarSystem] Cannot initialize, waiting for NetworkSystem initialization');
    return;
  }

  if (this.initialized) {
    console.warn('[AvatarSystem] Already initialized, skipping');
    return;
  }

  console.log('[AvatarSystem] Initializing Avatar System');

  // Add DOM listener for avatar initialization
  document.body.addEventListener('avatarInitialized', this.onAvatarInitialized.bind(this), false);

  // Check if avatar-rig already exists to prevent duplication
  const existingRig = document.querySelector('#avatar-rig');
  if (existingRig) {
    console.log('[AvatarSystem] Found existing avatar-rig, skipping creation');
    this.avatarRig = existingRig;
    this.initializeComponents();
    this.initialized = true;
    return;
  }

  // Make sure there is a local-avatar entity set up
  let localAvatar = document.querySelector('#local-avatar');
  if (!localAvatar) {
    console.log('[AvatarSystem] Creating local-avatar');
    
    // Get avatar position from config, or use default
    let position = "0 0 3"; // Default position
    if (this.config?.spawn?.position) {
      const posData = this.config.spawn.position;
      position = `${posData.x} ${posData.y} ${posData.z}`;
    }
    
    // Create the local-avatar entity
    localAvatar = document.createElement('a-entity');
    localAvatar.id = 'local-avatar';
    localAvatar.setAttribute('networked', 'template: #avatar-template; attachTemplateToLocal: true;');
    localAvatar.setAttribute('position', position);
    
    this.sceneEl.appendChild(localAvatar);
    console.log('[AvatarSystem] Created local-avatar with position:', position);
  }

  // This will be auto-populated when the avatar template is instantiated
  this.avatarRig = null;
  
  this.initializeComponents();
  this.initialized = true;
  
  // Log status after initialization
  setTimeout(() => {
    const rig = document.querySelector('#avatar-rig');
    if (rig) {
      console.log('[AvatarSystem] Avatar rig is present after initialization');
    } else {
      console.warn('[AvatarSystem] Avatar rig not found after initialization');
    }
  }, 500);
} 