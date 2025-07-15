# DLUX New Post Page Consolidation

## Overview

The DLUX new post page has been consolidated from 5 post types (Blog, Video, 360°, dApp, ReMix) down to 3 streamlined types that better reflect the dApps.md API schema and user workflows.

## New Post Type Structure

### 1. Blog Posts (`vrHash: 'blog'`)
- **Purpose**: Traditional content posts with images, videos, and markdown
- **Functionality**: Supports media uploads and text content
- **API Fields**: Basic post structure without dApp-specific fields

### 2. ReMix dApp (`vrHash: 'remix'`)
- **Purpose**: User-friendly dApp builder for remixing existing applications
- **Key Features**:
  - Load existing ReMix applications via CID or DLUX post URL
  - Browse popular ReMix applications from DLUX API
  - iframe-based editing of loaded applications
  - Proper attribution and licensing preservation
- **API Fields**: 
  - `dappCID`: The main dApp content
  - `ReMix`: The source ReMix CID being customized
  - `.lic`: License information
  - `tags`: Categorization
  - `originalApp`: Preserved for collaborative editing state restoration

### 3. New dApp (`vrHash: 'dapp'`)
- **Purpose**: Advanced dApp builder for creating original applications
- **Key Features**:
  - Create original dApp applications from scratch
  - Includes consolidated 360° gallery functionality
  - Advanced file organization and management
  - Creates applications that can be remixed by others
- **API Fields**:
  - `dappCID`: The main dApp content
  - `.lic`: License information
  - `tags`: Categorization

## Removed Functionality

### Video Post Type (`vrHash: 'video'`)
- **Status**: Removed
- **Migration**: Video functionality moved to Blog posts
- **Reason**: Videos can be handled as media within blog posts

### 360° Gallery Post Type (`vrHash: 'QmcAkxXzczkzUJWrkWNhkJP9FF1L9Lu5sVCrUFtAZvem3k'`)
- **Status**: Removed as standalone type
- **Migration**: Functionality integrated into ReMix and New dApp builders
- **Reason**: 360° content is better served as a dApp application type

## API Integration

### DLUX Data API Endpoints
The page now integrates with the DLUX dApp API documented in `dapps.md`:

- `GET /remix/apps/popular` - Load popular ReMix applications
- `GET /remix/apps/:remixCid` - Get details about specific ReMix applications
- `GET /remix/derivatives/@:author` - Get derivative works by author

### Custom JSON Structure
Posts now follow the API schema requirements:

```javascript
// Blog Post
{
  "vrHash": "blog"
  // Standard blog fields
}

// ReMix dApp
{
  "vrHash": "remix",
  "dappCID": "QmMainDappContent...",
  "ReMix": "QmSourceRemixCID...",
  ".lic": "CC BY-SA 4.0",
  "tags": ["music", "gallery", "remix"],
  "originalApp": { /* preserved state for collaborative editing */ }
}

// New dApp
{
  "vrHash": "dapp",
  "dappCID": "QmNewDappContent...",
  ".lic": "CC BY-SA 4.0",
  "tags": ["tool", "game", "utility"]
}
```

## Technical Implementation

### New JavaScript Helpers
Added `window.dappApiHelpers` with functions for:
- Loading ReMix application details from API
- Extracting ReMix CIDs from DLUX URLs
- Generating proper custom JSON structures
- Creating IPFS iframe sources

### Component Updates
- **ReMix dApp Manager**: Enhanced with iframe loading and API integration
- **New dApp Manager**: Consolidated with 360° functionality
- **TipTap Editor**: Updated to handle new custom JSON structures

### UI/UX Improvements
- Streamlined post type selection (3 instead of 5 options)
- Better visual hierarchy with clear use case descriptions
- Integrated browsing of popular ReMix applications
- Proper attribution display for remixed content

## Migration Path

### For Existing Content
- **Video posts**: Will continue to work, can be edited as blog posts
- **360° posts**: Functionality preserved in dApp builders
- **dApp posts**: Enhanced with new API integration
- **ReMix posts**: Significant improvements with iframe loading

### For Developers
- Update components to use new API helper functions
- Implement iframe communication protocol for ReMix applications
- Update custom JSON generation to match API schema
- Add support for collaborative editing state preservation

## Benefits

1. **Simplified User Experience**: 3 clear post types instead of 5 confusing options
2. **Better API Alignment**: Custom JSON structure matches DLUX API schema
3. **Enhanced ReMix Workflow**: Direct loading and browsing of existing applications
4. **Consolidated Functionality**: 360° features integrated where they make sense
5. **Future-Ready**: Structure supports planned dApp ecosystem features

## Implementation Notes

### Vue App Methods Needed
The Vue app will need new methods to handle:

```javascript
// ReMix application loading
async loadRemixApplication() {
  // Load from API and display in iframe
}

async loadPopularRemixApps() {
  // Browse popular applications
}

// Custom JSON handling
handleRemixUpdated(customJson) {
  // Update post custom JSON with ReMix data
}

handleDappUpdated(customJson) {
  // Update post custom JSON with dApp data
}

// iframe integration
getRemixIframeSrc(remixCid) {
  return window.dappApiHelpers.getRemixIframeSrc(remixCid);
}
```

### Required Vue Data Properties
```javascript
data() {
  return {
    remixCidToLoad: '',
    loadedRemixCid: null,
    remixApplicationDetails: null,
    showRemixDetails: false,
    // ... existing properties
  }
}
```

## Testing Checklist

- [ ] Blog posts work with image/video uploads
- [ ] ReMix dApp can load existing applications via CID
- [ ] ReMix dApp can load applications via DLUX post URL
- [ ] New dApp builder includes 360° functionality
- [ ] Custom JSON structures match API schema
- [ ] Collaborative editing preserves ReMix state
- [ ] iframe communication works properly
- [ ] API integration handles errors gracefully

## Future Enhancements

1. **Advanced ReMix Discovery**: Enhanced search and filtering
2. **License Validation**: Automatic license compatibility checking
3. **Collaborative ReMix**: Real-time collaborative editing of remixed applications
4. **Analytics Integration**: Usage tracking for ReMix applications
5. **Template Marketplace**: Curated template store integration 