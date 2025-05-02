/**
 * asset-manager.js - Centralized asset management
 * 
 * This module provides utilities for managing assets in the application,
 * including registration, tracking, and loading of assets.
 */

import { getState, setState } from './state.js';
import { generateEntityId, handleError, AppError, ErrorTypes } from './utils.js';

// Constants for asset types
export const ASSET_TYPES = {
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  MODEL: 'model',
  MATERIAL: 'material',
  TEXTURE: 'texture'
};

// Cache for loaded assets
const assetCache = new Map();

/**
 * Asset Manager - provides methods for managing assets
 */
class AssetManager {
  constructor() {
    this.initialized = false;
    this.assetsLoaded = 0;
    this.assetsTotal = 0;
    this.loadingErrors = [];
  }

  /**
   * Initialize the asset manager
   */
  init() {
    if (this.initialized) return;
    console.log('[AssetManager] Initializing');
    
    // Set up event listener for asset loading events
    document.addEventListener('asset-loaded', this._handleAssetLoaded.bind(this));
    document.addEventListener('asset-error', this._handleAssetError.bind(this));
    
    this.initialized = true;
  }

  /**
   * Register a new asset in the state
   * @param {string} type - Asset type (image, video, etc)
   * @param {string} src - Asset source URL
   * @param {Object} options - Additional options
   * @returns {string} - The ID of the registered asset
   */
  registerAsset(type, src, options = {}) {
    if (!this.initialized) this.init();
    
    // Validate inputs
    if (!type || !Object.values(ASSET_TYPES).includes(type)) {
      console.error(`[AssetManager] Invalid asset type: ${type}`);
      return null;
    }
    
    if (!src) {
      console.error('[AssetManager] Asset source is required');
      return null;
    }
    
    // Generate a unique ID for this asset if not provided
    const assetId = options.id || `asset-${type}-${generateEntityId()}`;
    
    // Create asset object
    const asset = {
      id: assetId,
      type,
      src,
      loaded: false,
      loading: false,
      error: null,
      metadata: options.metadata || {},
      tags: options.tags || [],
      created: Date.now(),
      ...options
    };
    
    // Add to state
    const state = getState();
    const newAssets = {
      ...state.assets,
      [assetId]: asset
    };
    
    setState({ assets: newAssets }, 'asset-register');
    console.log(`[AssetManager] Registered asset: ${assetId} (${type})`);
    
    return assetId;
  }

  /**
   * Load an asset from the state into the DOM
   * @param {string} assetId - ID of the asset to load
   * @returns {Promise<HTMLElement>} - Promise resolving to the loaded asset element
   */
  async loadAsset(assetId) {
    if (!this.initialized) this.init();
    
    // Add diagnostic logging
    console.log(`[AssetManager] Starting to load asset: ${assetId}`);
    
    // Check if asset is already loaded
    if (this.isAssetLoaded(assetId)) {
      console.log(`[AssetManager] Asset ${assetId} already loaded`);
      return Promise.resolve(this.getAssetElement(assetId));
    }

    // Check if asset is registered
    const state = getState();
    const asset = state.assets ? state.assets[assetId] : null;
    
    if (!asset) {
      console.error(`[AssetManager] Asset ${assetId} not found in registry`);
      return Promise.reject(new Error(`Asset ${assetId} not found`));
    }
    
    // Mark asset as loading
    this._updateAssetState(assetId, { loading: true });
    
    // More diagnostic logging
    console.log(`[AssetManager] Loading ${asset.type} asset from: ${asset.src}`);

    // Create a promise to track loading
    return new Promise((resolve, reject) => {
      try {
        // Create element based on asset type
        let element;
        
        if (asset.type === ASSET_TYPES.IMAGE) {
          element = document.createElement('img');
          element.crossOrigin = 'anonymous';
        } else if (asset.type === ASSET_TYPES.VIDEO) {
          element = document.createElement('video');
          element.crossOrigin = 'anonymous';
          element.loop = true;
          element.muted = true;
          element.playsInline = true;
          element.autoplay = true;
          
          // Add additional logging for video asset
          console.log(`[AssetManager] Created video element for asset ${assetId}`);
          element.addEventListener('loadeddata', () => {
            console.log(`[AssetManager] Video data loaded for asset ${assetId}`);
          });
          element.addEventListener('error', (e) => {
            console.error(`[AssetManager] Video loading error for asset ${assetId}:`, e);
          });
        } else if (asset.type === ASSET_TYPES.AUDIO) {
          element = document.createElement('audio');
          element.crossOrigin = 'anonymous';
        } else if (asset.type === ASSET_TYPES.MODEL) {
          // For models, we use a-assets template approach
          element = document.createElement('a-asset-item');
        } else {
          console.error(`[AssetManager] Unsupported asset type: ${asset.type}`);
          reject(new Error(`Unsupported asset type: ${asset.type}`));
          return;
        }
        
        // Set common attributes
        element.id = assetId;
        element.setAttribute('src', asset.src);
        if (asset.preload !== undefined) {
          element.setAttribute('preload', asset.preload);
        }
        
        // Add additional data attributes
        if (asset.metadata) {
          element.dataset.metadata = JSON.stringify(asset.metadata);
        }
        if (asset.tags && asset.tags.length) {
          element.dataset.tags = asset.tags.join(',');
        }
        
        // Add to a-assets if it exists, otherwise to body
        const assetsEl = document.querySelector('a-assets');
        if (assetsEl) {
          // Add load event handler before adding to assets
          element.addEventListener('load', () => {
            console.log(`[AssetManager] Asset ${assetId} loaded successfully`);
            this._markAssetLoaded(assetId, element);
            resolve(element);
          });
          
          element.addEventListener('error', (err) => {
            console.error(`[AssetManager] Error loading asset ${assetId}:`, err);
            this._markAssetFailed(assetId, err);
            reject(err);
          });
          
          // Add to a-assets
          assetsEl.appendChild(element);
          console.log(`[AssetManager] Added asset ${assetId} to a-assets`);
        } else {
          console.warn(`[AssetManager] No a-assets found, adding ${assetId} to body`);
          // For non-a-frame environments
          document.body.appendChild(element);
          
          // Simulate load event for video/audio
          if (asset.type === ASSET_TYPES.VIDEO || asset.type === ASSET_TYPES.AUDIO) {
            element.addEventListener('loadeddata', () => {
              console.log(`[AssetManager] Media asset ${assetId} loaded successfully`);
              this._markAssetLoaded(assetId, element);
              resolve(element);
            });
          } else {
            element.addEventListener('load', () => {
              console.log(`[AssetManager] Asset ${assetId} loaded successfully`);
              this._markAssetLoaded(assetId, element);
              resolve(element);
            });
          }
          
          element.addEventListener('error', (err) => {
            console.error(`[AssetManager] Error loading asset ${assetId}:`, err);
            this._markAssetFailed(assetId, err);
            reject(err);
          });
        }
      } catch (error) {
        console.error(`[AssetManager] Error creating asset ${assetId}:`, error);
        this._markAssetFailed(assetId, error);
        reject(error);
      }
    });
  }

  /**
   * Get an asset element by ID, loading it if necessary
   * @param {string} assetId - ID of the asset
   * @returns {Promise<HTMLElement>} - Asset element
   */
  async getAsset(assetId) {
    if (!this.initialized) this.init();
    
    // Check if already loaded
    if (assetCache.has(assetId)) {
      return assetCache.get(assetId);
    }
    
    // Load it
    return await this.loadAsset(assetId);
  }

  /**
   * Unload an asset from the DOM and cache
   * @param {string} assetId - ID of the asset to unload
   * @returns {boolean} - Success status
   */
  unloadAsset(assetId) {
    if (!assetCache.has(assetId)) {
      console.log(`[AssetManager] Asset not loaded: ${assetId}`);
      return true;
    }
    
    // Get the element
    const assetEl = assetCache.get(assetId);
    
    // Remove from DOM
    if (assetEl && assetEl.parentNode) {
      // For videos/audio, stop playback
      if (assetEl.tagName === 'VIDEO' || assetEl.tagName === 'AUDIO') {
        try {
          assetEl.pause();
          assetEl.removeAttribute('src');
          assetEl.load(); // Forces resources to be freed
        } catch (e) {
          console.warn(`[AssetManager] Error freeing media resource: ${e}`);
        }
      }
      
      assetEl.parentNode.removeChild(assetEl);
    }
    
    // Remove from cache
    assetCache.delete(assetId);
    
    // Update state
    this._updateAssetState(assetId, { loaded: false, loading: false });
    
    return true;
  }

  /**
   * Check if an asset is loaded
   * @param {string} assetId - ID of the asset
   * @returns {boolean} - True if loaded
   */
  isAssetLoaded(assetId) {
    return assetCache.has(assetId);
  }

  /**
   * Find assets by tag
   * @param {string} tag - Tag to search for
   * @returns {Array} - Array of matching assets
   */
  findAssetsByTag(tag) {
    const state = getState();
    const result = [];
    
    for (const [id, asset] of Object.entries(state.assets)) {
      if (asset.tags && asset.tags.includes(tag)) {
        result.push(asset);
      }
    }
    
    return result;
  }

  /**
   * Find assets by type
   * @param {string} type - Asset type
   * @returns {Array} - Array of matching assets
   */
  findAssetsByType(type) {
    const state = getState();
    const result = [];
    
    for (const [id, asset] of Object.entries(state.assets)) {
      if (asset.type === type) {
        result.push(asset);
      }
    }
    
    return result;
  }

  /**
   * Handle asset loaded event
   * @private
   * @param {Event} event - Asset loaded event
   */
  _handleAssetLoaded(event) {
    const { assetId, element } = event.detail;
    
    if (!assetId) return;
    
    // Update state
    this._updateAssetState(assetId, { 
      loaded: true, 
      loading: false,
      error: null
    });
    
    // Add to cache if not already there
    if (!assetCache.has(assetId) && element) {
      assetCache.set(assetId, element);
    }
    
    this.assetsLoaded++;
  }

  /**
   * Handle asset error event
   * @private
   * @param {Event} event - Asset error event
   */
  _handleAssetError(event) {
    const { assetId, error } = event.detail;
    
    if (!assetId) return;
    
    // Update state
    this._updateAssetState(assetId, { 
      loaded: false, 
      loading: false,
      error: error?.toString() || 'Unknown error loading asset'
    });
    
    this.loadingErrors.push({
      assetId,
      error,
      timestamp: Date.now()
    });
  }

  /**
   * Update an asset in the state
   * @private
   * @param {string} assetId - ID of the asset
   * @param {Object} updates - Updates to apply
   */
  _updateAssetState(assetId, updates) {
    const state = getState();
    const asset = state.assets[assetId];
    
    if (!asset) return;
    
    // Create updated asset
    const updatedAsset = {
      ...asset,
      ...updates,
      lastModified: Date.now()
    };
    
    // Update state
    setState({
      assets: {
        ...state.assets,
        [assetId]: updatedAsset
      }
    }, 'asset-update');
  }
}

// Create singleton instance
const assetManager = new AssetManager();

// Export the singleton instance
export { assetManager }; 