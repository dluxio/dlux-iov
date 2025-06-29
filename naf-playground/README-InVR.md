# InVR - Collaborative VR Scene Editor

InVR is a **full virtual reality collaborative scene editor** that enables users to build VR experiences together in real-time with spatial presence, hand tracking, and voice communication.

## 🥽 VR-First Experience

InVR is designed for **true VR collaboration** with:

- **WebXR Support**: Native VR headset compatibility (Quest, Vive, Index, etc.)
- **Spatial Presence**: See other users as 3D avatars in shared VR space
- **Hand Tracking**: Manipulate objects with natural hand gestures
- **Spatial Audio**: Voice communication with 3D positional audio
- **Cross-Reality**: VR users can collaborate with desktop users

## ✨ Key Features

### VR Collaboration
- **Real-time presence**: See other users' avatars, hand positions, and voice indicators
- **Shared workspace**: All changes sync instantly across all users
- **Spatial audio**: Natural voice communication with distance-based volume
- **Hand menus**: Intuitive VR interfaces accessible via hand controllers

### Scene Building
- **Entity creation**: Add boxes, spheres, lights, and custom objects
- **Hand manipulation**: Grab, move, rotate, and scale objects in 3D space
- **Transform modes**: Switch between move, rotate, and scale tools
- **Real-time sync**: All changes appear instantly for all collaborators

### Integration
- **DLUX VR Presence**: Integrated with DLUX ecosystem for user authentication
- **Secure rooms**: Document-based rooms with access control
- **Cross-domain**: Works in isolated subdomains for security
- **Persistent sessions**: Save and restore collaborative sessions

## 🚀 Quick Start

### VR Mode (Recommended)
1. Put on your VR headset
2. Open InVR in a WebXR-compatible browser
3. Click "Enter VR" to start the immersive experience
4. Use hand controllers to interact with the environment

### Desktop Mode (Fallback)
1. Open InVR in any modern browser
2. Click "Desktop Mode" for traditional interaction
3. Use mouse and keyboard to navigate and build

### URL Parameters
```
?room=project-alpha          # Join specific room
?invite=token123             # Join via invitation token
```

## 🎮 VR Controls

### Hand Controllers
- **Trigger**: Select and grab objects
- **Grip**: Secondary actions and scaling
- **Menu Button**: Open hand menus for creation and transformation
- **Joystick/Trackpad**: Navigate and teleport

### Hand Menus
- **Left Hand**: Creation menu (boxes, spheres, lights, etc.)
- **Right Hand**: Transform menu (move, rotate, scale, color)

### Voice Commands
- Natural voice communication with spatial audio
- Voice activity indicators on avatars
- Automatic echo cancellation and noise suppression

## 🏗️ Technical Architecture

### VR Stack
```
WebXR (Browser VR API)
├── A-Frame (3D Scene Framework)
├── Networked A-Frame (VR Presence)
├── Web Audio API (Spatial Audio)
└── Hand Tracking API
```

### Collaboration Stack
```
YDoc (CRDT for Real-time Sync)
├── Y-Websocket (WebSocket Provider)
├── Awareness (User Presence)
└── DLUX Presence System
```

### Integration Stack
```
DLUX Ecosystem
├── dlux-wallet.js (Secure Communication)
├── VR Presence System (Room Management)
├── Hive Authentication (User Identity)
└── SPK Network (Asset Storage)
```

## 🔧 Development

### Prerequisites
- VR headset (recommended) or WebXR-compatible browser
- Modern browser with WebXR support
- Microphone access for voice chat

### Local Development
```bash
# Serve from dlux-iov/naf-playground/
python -m http.server 8080

# Access InVR
http://localhost:8080/invr.html
```

### VR Testing
1. Connect VR headset to computer
2. Open browser in VR mode
3. Navigate to InVR URL
4. Test hand tracking and spatial audio

## 🌐 Browser Compatibility

### VR Support
- **Oculus Browser** (Quest): ✅ Full support
- **Chrome/Edge** (Windows Mixed Reality): ✅ Full support
- **Firefox Reality**: ✅ Full support
- **Chrome Android** (Cardboard): ⚠️ Limited support

### Desktop Fallback
- **Chrome/Edge**: ✅ Full support
- **Firefox**: ✅ Full support
- **Safari**: ⚠️ Limited WebRTC support

## 🎭 Entity System

### Supported Entities
- **Primitives**: Box, Sphere, Cylinder, Plane
- **Lighting**: Point lights, directional lights
- **Text**: 3D text objects with customizable fonts
- **Models**: GLTF/GLB 3D model support
- **Images**: 2D images as planes or materials

### Entity Properties
```javascript
{
  id: "entity-123",
  type: "box",
  position: { x: 0, y: 1, z: -2 },
  rotation: { x: 0, y: 45, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
  properties: {
    geometry: { width: 1, height: 1, depth: 1 },
    material: { color: "#4CC3D9", metalness: 0.2 }
  },
  creator: "user-id",
  created_at: 1640995200000
}
```

## 👥 Collaboration Features

### Real-time Synchronization
- **Instant updates**: All changes sync in real-time via YDoc CRDTs
- **Conflict resolution**: Automatic handling of simultaneous edits
- **Presence awareness**: See who's editing what in real-time

### User Presence
- **3D avatars**: Visual representation of each user in VR space
- **Hand tracking**: See other users' hand positions and gestures
- **Voice indicators**: Visual feedback for who's speaking
- **Activity feed**: Log of recent actions and events

### Room Management
- **Document rooms**: Rooms tied to specific DLUX documents
- **Access control**: Integration with DLUX user permissions
- **Persistent state**: Rooms maintain state across sessions
- **Invitation links**: Share rooms via secure invitation tokens

## 🔐 Security & Privacy

### Subdomain Isolation
- Runs in isolated subdomain to prevent XSS attacks
- Cross-domain communication via dlux-wallet.js
- Secure token-based authentication

### Audio Privacy
- Local microphone control with mute/unmute
- Spatial audio prevents eavesdropping
- No audio recording or storage

### Data Security
- Real-time sync without server-side storage
- Client-side encryption for sensitive data
- DLUX ecosystem integration for identity

## 🎯 Use Cases

### Creative Collaboration
- **3D Art Projects**: Collaborate on VR art installations
- **Architectural Visualization**: Design buildings and spaces together
- **Game Development**: Prototype VR game environments
- **Educational Experiences**: Build interactive learning environments

### Business Applications
- **Virtual Meetings**: Meet in custom VR environments
- **Product Design**: Collaborate on 3D product prototypes
- **Training Simulations**: Build training scenarios together
- **Remote Workshops**: Conduct hands-on VR workshops

### Community Building
- **Virtual Events**: Host gatherings in custom VR spaces
- **Maker Spaces**: Collaborative creation communities
- **Art Galleries**: Curate shared VR exhibitions
- **Social Spaces**: Build hangout areas for communities

## 🐛 Troubleshooting

### VR Issues
- **Headset not detected**: Check WebXR browser support
- **Poor tracking**: Ensure good lighting and camera visibility
- **Audio problems**: Grant microphone permissions
- **Performance**: Lower quality settings or use fewer entities

### Connection Issues
- **Sync problems**: Check network connectivity
- **User not visible**: Verify NAF connection status
- **Audio cutting out**: Check microphone permissions and bandwidth

### Browser Issues
- **WebXR not supported**: Try Chrome or Edge on desktop
- **Hand tracking fails**: Ensure hand tracking is enabled in browser
- **Audio permissions**: Grant microphone access when prompted

## 🤝 Contributing

InVR is part of the DLUX ecosystem. Contributions welcome!

### Development Areas
- VR interaction improvements
- New entity types and components
- Performance optimizations
- Accessibility enhancements
- Mobile VR support

### Getting Started
1. Fork the DLUX repository
2. Set up local development environment
3. Test changes in VR and desktop modes
4. Submit pull request with detailed description

## 📄 License

InVR is part of the DLUX project and follows the same licensing terms.

## 🔗 Links

- **DLUX Main Site**: https://dlux.io
- **Documentation**: https://dlux.io/docs
- **GitHub Repository**: https://github.com/dlux-io/dlux
- **Community Discord**: [Join our community](https://discord.gg/dlux)

## 🙏 Acknowledgments

InVR builds upon amazing open-source projects:
- [A-Frame](https://aframe.io/) - Web VR framework
- [Networked A-Frame](https://github.com/networked-aframe/networked-aframe) - VR networking
- [YJS](https://github.com/yjs/yjs) - Real-time collaboration
- [WebXR](https://immersiveweb.dev/) - Browser VR standards

---

**InVR**: Where VR collaboration becomes reality. Build together, create together, experience together. 🥽✨ 