# 360° VR Gallery System Documentation

A modular WebXR/VR system for creating immersive 360° photo galleries with spatial commenting and navigation built on A-Frame and DLUX.

## 📋 Table of Contents

- [Overview](#overview)
- [Post Metadata Format](#post-metadata-format)
- [Asset Structure](#asset-structure)
- [Navigation System](#navigation-system)
- [Comment System](#comment-system)
- [Rotational Data](#rotational-data)
- [Builder Component Usage](#builder-component-usage)
- [Implementation Examples](#implementation-examples)

## 🌟 Overview

This system allows creation of interconnected 360° photo experiences where users can:
- View 360° photos in VR/desktop environments
- Leave spatial comments pinned to specific points in 3D space
- Navigate between connected photos via navigation spheres
- Experience consistent visual navigation with thumbnail previews

## 📝 Post Metadata Format

### Primary Post Structure
```json
{
  "app": "dlux/360gallery",
  "format": "360-gallery",
  "title": "Coastal Bike Tour in Buenos Aires",
  "description": "A immersive journey through Buenos Aires coastal bike paths",
  "assets": [
    {
      "index": 0,
      "url": "https://ipfs.io/ipfs/QmHash1/photo1.jpg",
      "thumb": "https://ipfs.io/ipfs/QmHash1/thumb1.jpg",
      "rotation": {
        "x": 0,
        "y": 180,
        "z": 0
      },
      "title": "Starting Point - Puerto Madero",
      "description": "Beginning of the coastal bike tour"
    },
    {
      "index": 1,
      "url": "https://ipfs.io/ipfs/QmHash2/photo2.jpg", 
      "thumb": "https://ipfs.io/ipfs/QmHash2/thumb2.jpg",
      "rotation": {
        "x": 0,
        "y": 45,
        "z": 0
      },
      "title": "Ecological Reserve Entrance",
      "description": "Entering the nature reserve area"
    }
  ],
  "navigation": [
    {
      "fromIndex": 0,
      "toIndex": 1,
      "position": {
        "phi": 45,
        "theta": 90,
        "radius": 8
      },
      "label": "To Ecological Reserve",
      "description": "Continue along the bike path"
    },
    {
      "fromIndex": 1,
      "toIndex": 0,
      "position": {
        "phi": -135,
        "theta": 90,
        "radius": 8
      },
      "label": "Back to Puerto Madero",
      "description": "Return to starting point"
    }
  ]
}
```

## 🖼️ Asset Structure

### Individual Asset Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `index` | number | ✅ | Unique identifier for the photo in sequence |
| `url` | string | ✅ | Full resolution 360° image URL (IPFS recommended) |
| `thumb` | string | ✅ | Thumbnail for navigation preview (equirectangular) |
| `rotation` | object | ❌ | Initial rotation correction for proper orientation |
| `title` | string | ❌ | Human-readable title for the location |
| `description` | string | ❌ | Detailed description of the scene |

### Rotation Object
```json
{
  "x": 0,    // Pitch: up/down rotation in degrees
  "y": 180,  // Yaw: left/right rotation in degrees  
  "z": 0     // Roll: tilt rotation in degrees (rarely used)
}
```

**Common Rotation Values:**
- `y: 0` - Image faces forward as captured
- `y: 180` - Image faces opposite direction (common for phone captures)
- `y: 90` - Image rotated 90° clockwise
- `y: -90` - Image rotated 90° counter-clockwise

## 🧭 Navigation System

### Polar Coordinate System

Navigation uses spherical coordinates relative to the viewer:

```json
{
  "phi": 45,      // Horizontal angle: -180° to 180° (azimuth)
  "theta": 90,    // Vertical angle: 0° to 180° (elevation) 
  "radius": 8     // Distance from center (recommended: 6-10)
}
```

**Coordinate Reference:**
- `phi = 0°`: Forward direction
- `phi = 90°`: Right side
- `phi = -90°`: Left side  
- `phi = 180°`: Behind viewer
- `theta = 0°`: Straight up
- `theta = 90°`: Eye level
- `theta = 180°`: Straight down

### Navigation Point Structure

```json
{
  "fromIndex": 0,                    // Source photo index
  "toIndex": 1,                      // Destination photo index
  "position": {
    "phi": 45,
    "theta": 90, 
    "radius": 8
  },
  "label": "To Kitchen",             // Display name
  "description": "Enter the kitchen", // Tooltip text
  "style": {                         // Optional visual customization
    "color": "#4ECDC4",
    "emissiveIntensity": 0.4,
    "scale": 1.0
  }
}
```

### Navigation Sphere Rendering

Navigation points appear as **floating spheres with 360° thumbnail previews**:

```javascript
// A-Frame component structure
<a-entity 
  polar-position="phi: 45; theta: 90; radius: 8; photoIndex: 0"
  nav-point="targetPhoto: 1; label: To Kitchen"
  geometry="primitive: sphere; radius: 0.15" 
  material="src: #thumbnail1; transparent: true; opacity: 0.8">
  
  <!-- Label text -->
  <a-text value="To Kitchen" position="0 0.3 0" align="center"></a-text>
</a-entity>
```

## 💬 Comment System

### Comment Metadata Format

Comments are stored as Hive blockchain replies with spatial metadata:

```json
{
  "app": "dlux/360gallery",
  "format": "spatial-comment",
  "spatial": {
    "phi": 120,           // Horizontal position
    "theta": 75,          // Vertical position  
    "radius": 8,          // Distance from center
    "photoIndex": 0       // Which photo the comment belongs to
  },
  "parent": {
    "author": "markegiles",
    "permlink": "coastal-bike-tour-in-buenos-aires"
  }
}
```

### Comment Rendering

Comments appear as **pulsing red spheres** that expand on hover:

```javascript
<a-entity 
  polar-position="phi: 120; theta: 75; radius: 8; photoIndex: 0"
  comment-marker="commentId: abc123; author: username; content: Amazing view!"
  geometry="primitive: sphere; radius: 0.1"
  material="color: #FF6B6B; emissive: #FF6B6B; emissiveIntensity: 0.3"
  animation__pulse="property: scale; to: 1.2 1.2 1.2; direction: alternate; loop: true">
</a-entity>
```

## 🔄 Rotational Data

### Purpose of Rotation Correction

360° cameras often capture images that need orientation correction:

1. **Camera Mounting**: Different mounting positions affect initial orientation
2. **Capture Direction**: Mobile phones vs dedicated 360° cameras have different defaults
3. **Content Focus**: Rotate to ensure the most interesting view faces forward by default

### Applying Rotations

The system applies rotations to the `<a-sky>` element:

```javascript
// Initial photo load with rotation
const sky = document.querySelector('#image-360');
sky.setAttribute('material', 'src', asset.url);

if (asset.rotation) {
  sky.setAttribute('rotation', `${asset.rotation.x} ${asset.rotation.y} ${asset.rotation.z}`);
}
```

### Determining Rotation Values

**Method 1: Visual Inspection**
1. Load image with `rotation: { x: 0, y: 0, z: 0 }`
2. Note where the "forward" view should be
3. Adjust `y` value in 90° increments until correct

**Method 2: EXIF Data**
```javascript
// Extract orientation from EXIF if available
function getRotationFromEXIF(imageUrl) {
  // Implementation would parse EXIF orientation tag
  // and convert to rotation values
}
```

## 🔧 Builder Component Usage

### Automatic Gallery Construction

The builder component processes metadata and creates the full experience:

```javascript
// Gallery initialization
const galleryData = {
  assets: [...],     // Photo assets with rotations
  navigation: [...], // Navigation connections
  comments: [...]    // Existing spatial comments
};

// Builder creates:
// 1. Photo navigation thumbnails
// 2. Navigation spheres between photos  
// 3. Comment markers from blockchain
// 4. Interaction handlers

function buildGallery(data) {
  createPhotoAssets(data.assets);
  createNavigationSpheres(data.navigation);
  loadSpatialComments(data.comments);
  setupInteractionHandlers();
}
```

### Navigation Consistency

Navigation spheres use **thumbnail textures** for visual consistency:

```javascript
function createNavSphere(navPoint) {
  const targetAsset = assets[navPoint.toIndex];
  
  const sphere = document.createElement('a-entity');
  sphere.setAttribute('geometry', 'primitive: sphere; radius: 0.15');
  sphere.setAttribute('material', {
    src: targetAsset.thumb,
    transparent: true,
    opacity: 0.8
  });
  
  // Apply polar positioning
  sphere.setAttribute('polar-position', 
    `phi: ${navPoint.position.phi}; theta: ${navPoint.position.theta}; radius: ${navPoint.position.radius}`
  );
}
```

## 📚 Implementation Examples

### Basic Tour Setup

```javascript
// 1. Define your tour metadata
const tourData = {
  title: "My VR House Tour",
  assets: [
    {
      index: 0,
      url: "ipfs://living-room.jpg",
      thumb: "ipfs://living-room-thumb.jpg", 
      rotation: { x: 0, y: 180, z: 0 },
      title: "Living Room"
    },
    {
      index: 1, 
      url: "ipfs://kitchen.jpg",
      thumb: "ipfs://kitchen-thumb.jpg",
      rotation: { x: 0, y: 90, z: 0 },
      title: "Kitchen"
    }
  ],
  navigation: [
    {
      fromIndex: 0,
      toIndex: 1,
      position: { phi: 45, theta: 90, radius: 8 },
      label: "To Kitchen"
    }
  ]
};

// 2. Post to Hive blockchain with DLUX
const postMetadata = {
  json_metadata: JSON.stringify(tourData)
};

// 3. Gallery auto-builds from blockchain data
```

### Custom Navigation Styling

```json
{
  "navigation": [
    {
      "fromIndex": 0,
      "toIndex": 1,
      "position": { "phi": 45, "theta": 90, "radius": 8 },
      "label": "Master Bedroom",
      "style": {
        "color": "#E91E63",
        "emissiveIntensity": 0.6,
        "scale": 1.2,
        "pulseSpeed": 3000
      }
    }
  ]
}
```

---

## 🚀 Getting Started

1. **Prepare 360° Images**: Ensure equirectangular format, upload to IPFS
2. **Determine Rotations**: Test and adjust rotation values for proper orientation
3. **Plan Navigation**: Map logical connections between photos  
4. **Create Metadata**: Build JSON structure following the formats above
5. **Post to Blockchain**: Use DLUX wallet to post with metadata
6. **Test in VR**: Load gallery and verify navigation flow

The system automatically handles VR controllers, hand tracking, desktop/mobile fallbacks, and blockchain integration for a complete immersive experience.
