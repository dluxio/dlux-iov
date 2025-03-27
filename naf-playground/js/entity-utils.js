import {
  INTERNAL_ATTRIBUTES,
  PRESERVED_DATA_ATTRIBUTES,
  VECTOR_ATTRIBUTES,
  COMPONENT_BASED_TYPES,
  STANDARD_PRIMITIVES,
  GEOMETRY_ATTRIBUTES,
  VECTOR_DEFAULTS,
  GEOMETRY_DEFAULTS
} from './config.js';

/**
 * Check if an attribute should be skipped during processing
 * @param {string} name - Attribute name
 * @returns {boolean} True if attribute should be skipped
 */
export function shouldSkipAttribute(name) {
  if (INTERNAL_ATTRIBUTES.includes(name)) return true;
  if (name.startsWith('data-') && !PRESERVED_DATA_ATTRIBUTES.includes(name)) return true;
  return false;
}

/**
 * Parse a vector string or object into a standardized vector object
 * @param {string|Object} value - Vector value to parse
 * @param {string} type - Vector type (position, rotation, scale)
 * @returns {Object} Standardized vector object
 */
export function parseVector(value, type) {
  const defaults = VECTOR_DEFAULTS[type];
  
  // Handle empty or undefined values
  if (!value || value === '') return defaults;
  
  try {
    // Handle string format "x y z"
    if (typeof value === 'string') {
      const parts = value.trim().split(/\s+/).map(v => {
        const parsed = parseFloat(v);
        return isNaN(parsed) ? 0 : parsed;
      });
      
      return {
        x: parts[0] ?? defaults.x,
        y: parts[1] ?? defaults.y,
        z: parts[2] ?? defaults.z
      };
    }
    
    // Handle object format {x, y, z}
    if (typeof value === 'object' && value !== null) {
      return {
        x: typeof value.x === 'number' ? value.x : defaults.x,
        y: typeof value.y === 'number' ? value.y : defaults.y,
        z: typeof value.z === 'number' ? value.z : defaults.z
      };
    }
  } catch (error) {
    console.warn('Error parsing vector:', error);
  }
  
  return defaults;
}

/**
 * Convert a vector object to string format
 * @param {Object} vector - Vector object
 * @returns {string} Vector string
 */
export function vectorToString(vector) {
  if (!vector || typeof vector !== 'object') return '0 0 0';
  return `${vector.x || 0} ${vector.y || 0} ${vector.z || 0}`;
}

/**
 * Extract geometry data from an entity
 * @param {Element} entity - Entity element
 * @param {string} type - Entity type
 * @returns {Object} Geometry data
 */
export function extractGeometryData(entity, type) {
  // Start with type-specific defaults
  const defaults = GEOMETRY_DEFAULTS[type] || {};
  const data = { ...defaults };
  
  // For component-based types, get geometry component
  if (COMPONENT_BASED_TYPES.includes(type)) {
    const geometry = entity.getAttribute('geometry');
    if (geometry && typeof geometry === 'object') {
      Object.assign(data, geometry);
    }
  }
  
  // Get direct geometry attributes
  GEOMETRY_ATTRIBUTES.forEach(attr => {
    const value = entity.getAttribute(attr);
    if (value !== null && value !== undefined) {
      data[attr.replace('-', '')] = isNaN(value) ? value : Number(value);
    }
  });
  
  return data;
}

/**
 * Apply geometry data to an entity
 * @param {Element} entity - Entity element
 * @param {Object} data - Geometry data
 * @param {string} type - Entity type
 */
export function applyGeometryData(entity, data, type) {
  if (COMPONENT_BASED_TYPES.includes(type)) {
    // For component-based types, set as geometry component
    const geometryData = { primitive: type, ...data };
    entity.setAttribute('geometry', geometryData);
  } else {
    // For standard primitives, set individual attributes
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        entity.setAttribute(key, value);
      }
    });
  }
}

/**
 * Clean and standardize entity data for state storage
 * @param {Object} data - Raw entity data
 * @returns {Object} Cleaned entity data
 */
export function cleanEntityData(data) {
  const cleaned = {};
  
  Object.entries(data).forEach(([key, value]) => {
    // Skip internal attributes
    if (shouldSkipAttribute(key)) return;
    
    // Handle vector attributes
    if (VECTOR_ATTRIBUTES.includes(key)) {
      cleaned[key] = parseVector(value, key);
      return;
    }
    
    // Handle geometry data
    if (key === 'geometry' || GEOMETRY_ATTRIBUTES.includes(key)) {
      if (!cleaned.geometry) cleaned.geometry = {};
      if (key === 'geometry') {
        Object.assign(cleaned.geometry, value);
      } else {
        cleaned.geometry[key] = value;
      }
      return;
    }
    
    // Include all other non-null values
    if (value !== null && value !== undefined) {
      cleaned[key] = value;
    }
  });
  
  return cleaned;
}

/**
 * Extract all relevant attributes from an entity
 * @param {Element} entity - The A-Frame entity element
 * @param {string} type - The entity type (box, sphere, etc.)
 * @returns {Object} - Complete entity properties
 */
export function extractEntityAttributes(entity, type) {
  try {
    // Start with type
    const data = { type };
    
    // Get all attributes
    Array.from(entity.attributes).forEach(attr => {
      const name = attr.name;
      
      // Skip internal/system attributes
      if (shouldSkipAttribute(name)) return;
      
      // Get attribute value
      let value = entity.getAttribute(name);
      
      // Skip empty values
      if (value === null || value === undefined || value === '') return;
      
      // Parse vector attributes
      if (VECTOR_ATTRIBUTES.includes(name)) {
        value = parseVector(value, name);
      }
      
      // Store non-null values
      if (value !== null) {
        data[name] = value;
      }
    });
    
    // Extract geometry data
    const geometryData = extractGeometryData(entity, type);
    if (Object.keys(geometryData).length > 0) {
      data.geometry = geometryData;
    }
    
    // Clean and standardize the data
    return cleanEntityData(data);
  } catch (error) {
    console.error('Error extracting entity attributes:', error);
    return { type };
  }
} 