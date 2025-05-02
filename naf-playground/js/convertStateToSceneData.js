/**
 * Convert application state to scene data format
 * This updated version uses the new sky structure with type and data fields
 */

import { getState } from './state.js';
import { engineManager } from './engine-manager.js';
import { SKY_TYPES } from './config.js';

/**
 * Convert application state to scene data format
 * @param {Object} state - The application state
 * @returns {Object} - Scene data in the expected format
 */
export function convertStateToSceneData(state = getState()) {
  const entities = [];
  let skyData = null;
  let environmentData = null;
  
  // Process all entities
  Object.entries(state.entities || {}).forEach(([uuid, entity]) => {
    // Skip system entities based on engine manager
    if (engineManager.initialized && engineManager.isSystemEntity(entity, uuid)) {
      console.log(`Skipping system entity during export: ${entity.id || entity.type}`);
      return;
    }
    
    // Add regular entity to entities array
    const cleanEntity = { ...entity };
    delete cleanEntity.uuid;
    delete cleanEntity.DOM;
    
    entities.push(cleanEntity);
  });
  
  // Process sky separately from state.sky
  if (state.sky) {
    skyData = {
      type: state.sky.type || SKY_TYPES.COLOR,
      data: { ...state.sky.data }
    };
    
    // Handle legacy data format - this can be removed once all scenes are migrated
    if (state.sky.color && !skyData.data.color) {
      skyData.type = SKY_TYPES.COLOR;
      skyData.data = { color: state.sky.color };
    }
    
    // Add metadata for image/video assets to remind users of A-Frame's asset system
    if (skyData.type === SKY_TYPES.IMAGE || skyData.type === SKY_TYPES.VIDEO) {
      const assetType = skyData.type === SKY_TYPES.IMAGE ? 'image' : 'video';
      skyData.data._note = `This ${assetType} will be loaded through A-Frame's asset management system for optimal performance.`;
    }
  }
  
  // Process environment separately from state.environment
  if (state.environment) {
    environmentData = {
      preset: state.environment.preset || 'default',
      lighting: state.environment.lighting !== false,
      ground: state.environment.ground !== false
    };
  }
  
  return {
    metadata: {
      ...(state.metadata || {}),
      modified: Date.now()
    },
    sky: skyData,
    environment: environmentData,
    entities
  };
}

export default convertStateToSceneData; 