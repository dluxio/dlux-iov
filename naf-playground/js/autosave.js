/**
 * Autosave manager for handling state persistence
 */

import { addStateListener, getState } from './state.js';

class AutosaveManager {
  constructor() {
    this.pendingSave = null;
    this.lastSave = Date.now();
    this.minSaveInterval = 5000; // Minimum time between saves
    this.listeners = new Set();
  }

  /**
   * Initialize autosave manager
   */
  init() {
    // Listen for state changes
    addStateListener(this.handleStateChange.bind(this));
  }

  /**
   * Handle state changes
   * @param {Object} state - Current state
   * @param {string} source - Source of state change
   */
  handleStateChange(state, source) {
    // Don't trigger save for network updates
    if (source === 'network') return;

    // Debounce saves
    if (this.pendingSave) {
      clearTimeout(this.pendingSave);
    }

    // Calculate delay based on last save
    const timeSinceLastSave = Date.now() - this.lastSave;
    const delay = Math.max(0, this.minSaveInterval - timeSinceLastSave);

    this.pendingSave = setTimeout(() => {
      this.save();
    }, delay);
  }

  /**
   * Save current state
   */
  async save() {
    try {
      const state = getState();
      
      // Save state
      localStorage.setItem('scene-state', JSON.stringify(state));
      
      // Update last save time
      this.lastSave = Date.now();
      
      // Notify listeners
      this.notifyListeners('save', null);
      
      console.log('Scene state autosaved');
    } catch (error) {
      console.error('Error autosaving scene state:', error);
      this.notifyListeners('error', error);
    }
  }

  /**
   * Load saved state
   * @returns {Object} Loaded state
   */
  async load() {
    try {
      const savedState = localStorage.getItem('scene-state');
      if (!savedState) return null;

      const state = JSON.parse(savedState);
      this.notifyListeners('load', state);
      
      return state;
    } catch (error) {
      console.error('Error loading saved scene state:', error);
      this.notifyListeners('error', error);
      return null;
    }
  }

  /**
   * Add autosave event listener
   * @param {Function} listener - Event listener
   */
  addListener(listener) {
    this.listeners.add(listener);
  }

  /**
   * Remove autosave event listener
   * @param {Function} listener - Event listener
   */
  removeListener(listener) {
    this.listeners.delete(listener);
  }

  /**
   * Notify listeners of autosave events
   * @param {string} event - Event type
   * @param {*} data - Event data
   */
  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Error in autosave listener:', error);
      }
    });
  }
}

// Create singleton instance
const autosaveManager = new AutosaveManager();

export function initAutosave() {
  autosaveManager.init();
}

export function loadSavedState() {
  return autosaveManager.load();
}

export function addAutosaveListener(listener) {
  autosaveManager.addListener(listener);
}

export function removeAutosaveListener(listener) {
  autosaveManager.removeListener(listener);
}

export default autosaveManager; 