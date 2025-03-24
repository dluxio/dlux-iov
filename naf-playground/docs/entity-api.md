# Unified Entity API

## Overview

The Unified Entity API provides a single, centralized interface for all entity operations in the A-Frame Scene Builder. It ensures that all entity state changes go through the watcher as the single source of truth, maintaining consistent state management throughout the application.

## Design Principles

1. **Single Source of Truth**: All entity state changes must go through the watcher component
2. **Consistent Interface**: Provides a unified API for all entity operations
3. **Failure Safety**: Clear error reporting if the watcher is not available
4. **Asynchronous Design**: Uses async/await for all operations that could affect state
5. **Modular Architecture**: Avoids circular dependencies through dynamic imports

## Installation

The Unified Entity API is automatically initialized during application startup in `main.js`. You can also initialize it manually:

```javascript
import { initEntityAPI } from './js/entity-api.js';

// Initialize the API
await initEntityAPI();
```

## Core API

### Entity Creation

```javascript
// Create a simple entity
const boxResult = await createEntity('box', {
  position: { x: 0, y: 1, z: -3 },
  color: '#4CC3D9',
  width: 1,
  height: 1,
  depth: 1
});

// Create a component-based entity with semantic type
const customResult = await createEntity('entity', {
  position: { x: 0, y: 1, z: -3 },
  geometry: {
    primitive: 'dodecahedron',
    radius: 1
  },
  material: {
    color: '#FFC65D'
  }
}, 'dodecahedron');
```

### Entity Updating

```javascript
// Update an entity
await updateEntity('entity-uuid', {
  position: { x: 1, y: 2, z: -3 },
  color: '#FF5733'
});
```

### Entity Deletion

```javascript
// Delete a single entity
await deleteEntity('entity-uuid');

// Delete multiple entities
const boxUuids = findEntitiesByType('box');
await Promise.all(boxUuids.map(uuid => deleteEntity(uuid)));
```

### Entity Queries

```javascript
// Get all entities (optionally filtered)
const allEntities = getAllEntities();
const redBoxes = getAllEntities({
  type: 'box',
  color: '#FF0000'
});

// Find entities by type
const spheres = findEntitiesByType('sphere');

// Find entities by property
const redEntities = findEntitiesByProperty('color', '#FF0000');

// Check if entity exists
const exists = entityExists('entity-uuid');

// Get entity data from state
const entityData = getEntityData('entity-uuid');

// Get entity DOM element
const entityElement = getEntityElement('entity-uuid');
```

### Advanced Operations

```javascript
// Duplicate an entity
const newUuid = await duplicateEntity('entity-uuid', {
  // Optional property overrides
  position: { x: 2, y: 1, z: -3 }
});

// Recreate all entities from state
await recreateAllEntities();

// Force an update of the state from the DOM
const updatedState = forceStateUpdate();

// Register a new component-based entity type
await registerEntityType('custom-shape', {
  geometry: {
    primitive: 'icosahedron',
    radius: 1
  },
  material: {
    color: '#FFF',
    metalness: 0.2,
    roughness: 0.8
  }
});
```

## Comparison with Legacy API

The table below shows the mapping between legacy functions and the new Unified Entity API:

| Legacy Function | Unified API Function |
|----------------|---------------------|
| `entities.createEntity()` | `entityApi.createEntity()` |
| `entities.updateEntity()` | `entityApi.updateEntity()` |
| `entities.deleteEntity()` | `entityApi.deleteEntity()` |
| `entities.addEntity()` | `entityApi.createEntity()` |
| `entities.addMultipleEntities()` | `entityApi.addMultipleEntities()` |
| `entities.recreateEntitiesFromState()` | `entityApi.recreateAllEntities()` |
| `entities.findEntitiesByType()` | `entityApi.findEntitiesByType()` |
| `entities.findEntitiesByProperty()` | `entityApi.findEntitiesByProperty()` |
| `state.getEntity()` | `entityApi.getEntityData()` |
| N/A | `entityApi.duplicateEntity()` |
| N/A | `entityApi.getAllEntities()` |
| N/A | `entityApi.entityExists()` |
| N/A | `entityApi.forceStateUpdate()` |
| N/A | `entityApi.getEntityElement()` |
| `entities.registerPrimitiveType()` | `entityApi.registerEntityType()` |

## Migration Guide

To migrate from the legacy API to the Unified Entity API:

1. Import the required functions from the new API:
   ```javascript
   import { createEntity, updateEntity, deleteEntity /* etc. */ } from './js/entity-api.js';
   ```

2. Replace direct calls to legacy functions with their Unified API equivalents.

3. Add error handling for asynchronous operations:
   ```javascript
   try {
     const result = await createEntity('box', { /* properties */ });
     // Handle success
   } catch (error) {
     // Handle error
   }
   ```

4. Update any code that directly modifies state to use the appropriate API functions.

## Testing

A test page is available at `entity-api-test.html` that demonstrates the usage of the Unified Entity API. It provides a visual interface for creating, updating, querying, and deleting entities.

## Implementation Details

The Unified Entity API is implemented in `js/entity-api.js`. It uses dynamic imports to avoid circular dependencies and ensures that all entity operations go through the watcher by:

1. Setting up proper event listeners
2. Enforcing watcher usage with the `_ensureWatcher()` function
3. Providing useful error messages when operations fail
4. Centralizing common entity operations

Legacy functions in `entities.js` have been updated to log deprecation warnings, guiding developers to use the new Unified API.

## Best Practices

1. **Always use the Unified API for entity operations** - This ensures that all state changes go through the watcher.
2. **Handle errors properly** - All API functions are asynchronous and may throw errors if the watcher is not available.
3. **Use batch operations when possible** - For example, when creating multiple entities, use `addMultipleEntities()` instead of multiple calls to `createEntity()`.
4. **Prefer entity UUID over DOM IDs** - Always use entity UUIDs for identifying entities, as they are guaranteed to be unique and consistent.
5. **Consider using filters with getAllEntities()** - When querying entities, use the filter parameter to get a more specific set of entities. 