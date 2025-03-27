# Collaborative A-Frame Scene Builder

A collaborative web application that enables multiple users to build and edit 3D scenes together in real-time using A-Frame and Networked A-Frame.

## Features

- **Collaborative Scene Building**: Multiple users can add, edit, and delete entities in a shared 3D scene
- **Intuitive UI Panel**: Add basic A-Frame entities with just a click
- **Centralized State Management**: Single source of truth for the entire scene
- **Monaco Code Editor**: Directly edit the scene's HTML representation
- **A-Frame Inspector Integration**: Visual scene editing with the built-in A-Frame inspector
- **Persistent Camera Management**: Dedicated builder camera for scene preview
- **Debug Panel**: Monitor application status and actions

## Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Edge, or Safari)
- For collaborative features, a Networked A-Frame compatible WebSocket server

### Running Locally

1. Clone the repository:
```bash
git clone https://github.com/yourusername/collaborative-aframe-builder.git
cd collaborative-aframe-builder
```

2. Since this is a static web application, you can use any web server to serve the files. For example:

Using Python:
```bash
# Python 3
python -m http.server 8080
```

Using Node.js:
```bash
# Install a simple http server if you don't have one
npm install -g http-server
# Start the server
http-server -p 8080
```

3. Open your browser and navigate to `http://localhost:8080`

### Connecting to a Networked A-Frame Server

For real-time collaboration, you'll need a WebSocket server compatible with Networked A-Frame.

1. To use the default Networked A-Frame server:
   - Install the server globally: `npm install -g networked-aframe-server`
   - Run the server: `naf-server`
   - The server will be available at `ws://localhost:8080`

2. In the application, enter the WebSocket URL in the debug panel and click "Connect"

## Using the Application

### Adding Entities

1. Use the UI panel buttons to add basic entities (box, sphere, cylinder, plane, light)
2. New entities will be added in front of the current camera view

### Editing Entities

There are three ways to edit entities:

1. **A-Frame Inspector**: Click "Open Inspector" to use A-Frame's visual editor
2. **Code Editor**: Edit the HTML representation directly in the Monaco editor
3. **Programmatically**: Advanced users can use the browser console to access the API

### Camera Management

- The "Builder Camera" is always available and cannot be deleted
- Switch between cameras using the dropdown in the UI panel
- Camera positions are saved to the state automatically

### Collaborating with Others

1. Connect to the same Networked A-Frame server
2. All changes made by any user will be synchronized across all connected clients
3. User avatars will represent other users in the space

## Project Structure

- **index.html**: Main HTML document
- **css/styles.css**: Styling for the application
- **js/main.js**: Entry point for the application
- **js/core.js**: Core application logic and initialization
- **js/state.js**: Centralized state management
- **js/ui.js**: UI panel and event handlers
- **js/entities.js**: Entity creation and management
- **js/camera.js**: Camera management and builder camera logic
- **js/monaco.js**: Monaco editor integration
- **js/network.js**: Networked A-Frame setup and synchronization
- **js/debug.js**: Debug panel functionality
- **js/utils.js**: Utility functions

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [A-Frame](https://aframe.io/)
- [Networked A-Frame](https://github.com/networked-aframe/networked-aframe)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)

## Documentation Guide

### Code Documentation Standards

1. **File Headers**
   ```javascript
   /**
    * file-name.js - Brief description of the file's purpose
    * 
    * Detailed description of the file's functionality and role in the system.
    * Include any important notes about dependencies or usage.
    */
   ```

2. **Class Documentation**
   ```javascript
   /**
    * ClassName - Brief description
    * 
    * Detailed description of the class's purpose and functionality.
    * Include any important notes about usage or lifecycle.
    */
   class ClassName {
     /**
      * Constructor description
      * @param {Type} paramName - Parameter description
      */
     constructor(paramName) {
       // Implementation
     }
   }
   ```

3. **Function Documentation**
   ```javascript
   /**
    * Function description
    * @param {Type} paramName - Parameter description
    * @returns {Type} Description of return value
    * @throws {ErrorType} Description of when this error is thrown
    */
   function functionName(paramName) {
     // Implementation
   }
   ```

4. **Constants and Configuration**
   - Group related constants together
   - Use UPPER_SNAKE_CASE for constant names
   - Document the purpose and valid values
   ```javascript
   /**
    * Configuration for specific feature
    * @type {Object}
    */
   export const FEATURE_CONFIG = {
     CONSTANT_NAME: 'value', // Description
   };
   ```

### Best Practices

1. **Comments**
   - Use comments to explain "why" not "what"
   - Keep comments up to date with code changes
   - Remove commented-out code

2. **Naming Conventions**
   - Use camelCase for variables and functions
   - Use PascalCase for classes
   - Use UPPER_SNAKE_CASE for constants
   - Use descriptive, self-documenting names

3. **Code Organization**
   - Group related functionality together
   - Keep files focused and single-purpose
   - Use consistent file structure:
     ```javascript
     // Imports
     import { ... } from './module.js';
     
     // Constants
     const CONSTANT = 'value';
     
     // Class/Function definitions
     class ClassName { ... }
     
     // Exports
     export { ... };
     ```

4. **Error Handling**
   - Use the standardized error handling system
   - Always include context in error messages
   - Document error conditions in JSDoc 