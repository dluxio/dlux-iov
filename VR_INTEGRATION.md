# VR Presence Integration

This document describes the VR presence integration in the DLUX frontend, enabling users to discover and join VR spaces directly from the main navigation.

## Overview

The VR presence system allows users to:
- Browse popular VR spaces created from DLUX content
- Join VR spaces with secure Hive blockchain authentication  
- Access global lobby and content-specific VR rooms
- Enjoy real-time voice communication and VR synchronization

## Components

### 1. VRPresence Component (`js/vr-presence.js`)

**Purpose:** Main Vue component that provides VR space discovery and authentication UI

**Features:**
- VR spaces modal with filtering (360°, VR scenes, documents, lobby)
- Real-time user count display
- Secure authentication flow
- Integration with existing DLUX wallet system
- Responsive design with Bootstrap styling

**Props:**
- `user` (String): Current authenticated user account

**Events Emitted:**
- None (communicates through parent methods)

### 2. Enhanced dlux-wallet.js

**New VR Methods:**
- `requestVRAuth(challenge, spaceType, spaceId)` - Request signatures for VR authentication
- `joinVRSpace(spaceType, spaceId, options)` - Join VR spaces with authentication
- `leaveVRSpace()` - Leave current VR space
- `getVRSpaces(options)` - Fetch popular VR spaces
- `getVRSpaceDetails(spaceType, spaceId)` - Get detailed space information
- `isInVRSpace()` - Check if currently in VR space
- `getVRSession()` - Get current VR session info

### 3. Enhanced v3-nav.js

**New VR Integration:**
- Import and register VRPresence component
- VR authentication handling methods
- Event system for VR operations
- Wallet message handling for VR signing
- UI state tracking for active VR sessions

**New Methods:**
- `handleVRAuthRequest(challenge, spaceType, spaceId)` - Handle VR auth requests
- `sendWalletMessage(type, data)` - Send VR-specific wallet messages
- `initVRPresence()` - Initialize VR event system
- `handleVRAuthRequired/SpaceJoined/SpaceLeft(event)` - VR event handlers

## Integration Points

### Backend API (presence.dlux.io)

The frontend communicates with the presence server API:

```javascript
// Get popular spaces
GET https://presence.dlux.io/api/spaces?limit=50

// Join a space
POST https://presence.dlux.io/api/spaces/{type}/{id}/join
{
  "subspace": "main",
  "user_account": "username",
  "challenge": "signed_challenge"
}

// Get TURN credentials
GET https://presence.dlux.io/api/turn-credentials
```

### Authentication Flow

1. User clicks VR button in navigation
2. VRPresence component fetches available spaces
3. User selects a space to join
4. If authentication required, component requests signature from parent
5. Parent v3-nav.js uses existing `signChallenge()` method
6. Signed challenge sent to presence.dlux.io
7. Server validates signature and returns WebRTC credentials
8. VR interface opens in new window with session data

### Content Integration

VR spaces are automatically created from existing DLUX content:

- **Posts:** 360° photos, VR scenes, A-Frame content, blog posts, art, games
- **Documents:** Collaborative documents become VR collaboration spaces  
- **Global:** Lobby space for general socializing

Space identification: `spaceType:spaceId:subspace`
- Example: `post:author/permlink:main`
- Example: `document:doc_id:main`
- Example: `global:lobby:main`

## File Structure

```
dlux-iov/
├── js/
│   ├── vr-presence.js          # VR presence Vue component
│   ├── dlux-wallet.js          # Enhanced with VR methods
│   └── v3-nav.js               # Enhanced with VR integration
├── css/
│   └── vr-presence.css         # VR component styling
└── VR_INTEGRATION.md           # This documentation
```

## Usage

### For Users

1. **Access VR Spaces:**
   - Click the VR button in the main navigation (only visible when logged in)
   - Browse available spaces by type (All, 360°, VR Scenes, Documents)
   - See real-time user counts for each space

2. **Join VR Space:**
   - Click "Join VR" on any space card
   - For authenticated spaces, sign the challenge when prompted
   - VR interface opens in new window
   - Enjoy shared VR experience with voice communication

3. **Global Lobby:**
   - Always available public space for socializing
   - No authentication required
   - Great starting point for new VR users

### For Developers

**Adding VR to Content:**
Content automatically becomes VR-enabled based on metadata:
- Posts with `vrml`, `aframe`, `360` tags
- Posts with VR-compatible file uploads
- Collaborative documents
- Global spaces defined by system

**Customizing VR Spaces:**
Modify space discovery logic in `vr-presence.js`:
```javascript
// Filter spaces by custom criteria
filteredSpaces() {
  return this.spaces.filter(space => {
    // Custom filtering logic
    return space.meetsCriteria();
  });
}
```

**Handling VR Events:**
Listen for VR events in parent components:
```javascript
// In v3-nav.js or other components
handleVRSpaceJoined(event) {
  const { space, credentials } = event.detail;
  // Handle VR space join
  this.updateUIForVRSession(space);
}
```

## Security

- **Hive Blockchain Authentication:** All VR space access uses Hive account signatures
- **Challenge-Response:** Each space entry requires signing a unique challenge
- **Permission Inheritance:** VR spaces inherit permissions from source content
- **Guest Access:** Public spaces allow anonymous access
- **Session Management:** VR sessions are tracked and can be terminated

## Styling

The VR component uses Bootstrap-compatible styling with DLUX theming:
- Dark theme with gradient backgrounds
- Smooth animations and transitions
- Responsive design for mobile/desktop
- Accessibility support with focus indicators
- Custom scrollbars and hover effects

## Browser Support

- **WebRTC:** Required for voice communication
- **WebSockets:** Required for real-time synchronization
- **Modern Browsers:** Chrome 88+, Firefox 85+, Safari 14+, Edge 88+
- **VR Headsets:** Oculus, HTC Vive, Windows Mixed Reality (via WebXR)
- **Mobile VR:** Google Cardboard, Samsung Gear VR support

## Development

**Testing VR Integration:**
1. Start local development server
2. Ensure presence.dlux.io is accessible
3. Login with test Hive account
4. Access VR button in navigation
5. Test space discovery and authentication flow

**Debugging:**
- Check browser console for VR-related errors
- Monitor network requests to presence.dlux.io API
- Verify WebRTC connection establishment
- Test signature generation and validation

## Future Enhancements

- **VR Content Creation:** In-browser VR scene editor
- **Spatial Audio:** 3D positional voice communication
- **Avatar System:** Custom 3D avatars and animations
- **Shared Whiteboards:** Collaborative drawing in VR
- **Event Hosting:** Scheduled VR events and meetings
- **Mobile VR Apps:** Native iOS/Android VR applications

## Support

For VR integration issues:
1. Check this documentation
2. Review browser console errors
3. Verify network connectivity to presence.dlux.io
4. Test with different VR devices/browsers
5. Contact DLUX development team with specific error details 