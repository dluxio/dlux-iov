# Scene Handling Architecture Recommendations

## Current Architecture Analysis

The current scene handling architecture has several key components:

1. **State Management**: Centralized in `state.js`, with initial state generation in `config.js`
2. **Manager Components**:
   - `sky-manager.js`: Handles sky/background rendering
   - `environment-manager.js`: Manages environment presets including lights
   - `scene-loader.js`: Loads scenes from JSON files
3. **Entity Handling**:
   - `entities.js`: Provides functions for entity creation/manipulation
   - `entity-api.js`: A newer, more robust API for entity operations
4. **UI and Code Editor**:
   - `monaco.js`: Manages the code editor and HTML generation/parsing
5. **Change Tracking**:
   - `watcher.js`: Monitors the scene for changes and updates state

### Issues Identified

1. **Multiple Sources of Truth**: The architecture has multiple components that can initialize or modify the scene independently:
   - The state initialization in `config.js`
   - The sky manager's initialization
   - The environment manager's initialization
   - The scene loader
   - The Monaco editor

2. **Independent Entity Creation**: Components like `sky-manager.js` and `environment-manager.js` can create entities independently of the state.

3. **Inconsistent Initialization**: The scene could be initialized differently depending on which component runs first.

## Recommendations

### 1. Single Source of Truth

Strengthen the "state as single source of truth" pattern:

- **Empty Initial State**: Keep the initial state empty (as we've modified in `config.js`).
- **State-Driven Rendering**: All components should read from state and render accordingly, not maintain their own independent entities.

### 2. Manager Component Modifications

- **Sky Manager**: 
  - Keep the sky manager, but make it purely reactive to state changes.
  - Remove any auto-initialization behavior.
  - It should only create a sky entity when explicitly told to by state changes.

- **Environment Manager**:
  - Similar to the sky manager, make it purely reactive to state.
  - Remove auto-initialization.
  - Keep the presets functionality as a convenience for users.

- **Scene Loader**:
  - Maintain as the primary way to load scenes.
  - Ensure it properly clears previous state before applying new scene data.
  - Add validation to ensure all entities have proper UUIDs and structure.

### 3. Consistent Initialization Flow

Implement a clear initialization flow:

1. Initialize empty state first
2. Initialize managers (sky, environment) that listen to state
3. Initialize scene loader
4. Either load a scene from JSON or start with empty scene

### 4. Improved Monaco Editor Integration

- **State-Driven Editing**: Ensure Monaco strictly represents what's in state.
- **Bidirectional Updates**: Maintain two-way sync between editor and state.
- **Error Handling**: Add better validation and error handling for manual edits.

### 5. Architecture Simplification

- **Unify Entity APIs**: Complete the transition to `entity-api.js` and deprecate older methods.
- **Reduce Circular Dependencies**: Review and refactor circular imports between modules.
- **Clear Component Responsibilities**: Ensure each component has a single, well-defined responsibility.

### 6. Scene Loading Process

Implement a more robust scene loading process:

1. **Clear Existing Entities**: Properly clear all existing entities before loading a new scene.
2. **State Update First**: Update state completely before any DOM manipulation.
3. **DOM Recreation**: Recreate the DOM based on the new state.
4. **Monaco Update**: Update Monaco after DOM is recreated.
5. **Validation**: Add validation after loading to ensure state/DOM/Monaco consistency.

## Implementation Priority

1. **Fix State Initialization**: Ensure state starts empty (completed).
2. **Modify Managers**: Update sky and environment managers to be reactive only.
3. **Enhance Scene Loader**: Improve clearing and validation in scene loader.
4. **Update Monaco Integration**: Ensure correct bidirectional updates.
5. **Add Validation Tools**: Create utilities to verify consistency across systems.

By implementing these changes, we'll ensure that the scene handling becomes more predictable, with a clear flow from JSON → state → DOM → Monaco, with proper bidirectional updates when changes occur in any part of the system. 