# A-Frame & Networked Application Integration

This document explains how the enhanced `dlux-wallet.js` automatically integrates with A-Frame scenes and provides room functionality for any type of application on DLUX post pages.

## Overview

When the DLUX wallet is injected into a post page (e.g., `/@author/permlink`), it automatically:

1. **Detects A-Frame scenes** and their networking capabilities
2. **Provides appropriate integration** based on what's found
3. **Creates post-specific VR rooms** using the author/permlink format
4. **Supports sub-rooms** for specialized functionality (chess games, private chats, etc.)

## Integration Types

### 1. Networked A-Frame (NAF) - Existing Implementation

**Scenario:** Post has an A-Frame scene with NAF already configured.

**What happens:**
- Wallet detects existing NAF setup
- Configures NAF to use DLUX presence server
- Provides WebRTC credentials from `presence.dlux.io`
- Connects to room: `author-permlink-main`

**Example Post Content:**
```html
<a-scene networked-scene="app:myapp;room:custom-room">
  <a-assets>
    <template id="avatar-template">
      <a-sphere color="red"></a-sphere>
    </template>
  </a-assets>
  
  <a-entity id="player" 
    camera 
    wasd-controls 
    look-controls
    networked="template:#avatar-template">
  </a-entity>
  
  <a-box networked="template:#box-template" position="0 1 -5"></a-box>
</a-scene>
```

**Developer API:**
```javascript
// Access the enhanced scene
const scene = document.querySelector('a-scene');

// Listen for DLUX networking events
scene.addEventListener('connected', () => {
  console.log('Connected to DLUX room');
});

// VR room will be: author-permlink-main
// Example: disregardfiat-my-vr-world-main
```

### 2. A-Frame Without Networking - Auto-Enhancement

**Scenario:** Post has A-Frame scene but no networking.

**What happens:**
- Wallet detects A-Frame scene
- Dynamically loads NAF library
- Adds networking components to existing scene
- Creates default avatar system
- Connects to DLUX presence server

**Example Post Content:**
```html
<a-scene>
  <a-box position="0 1 -5" color="red"></a-box>
  <a-sphere position="2 1 -5" color="blue"></a-sphere>
  
  <a-entity camera wasd-controls look-controls position="0 1.6 3">
  </a-entity>
</a-scene>
```

**What gets added automatically:**
```html
<a-scene networked-scene="app:dlux-vr;room:author-permlink-main;...">
  <a-assets>
    <!-- Auto-added avatar template -->
    <template id="avatar-template">
      <a-entity class="avatar">
        <a-sphere class="head" color="#5985ff" scale="0.45 0.5 0.38" position="0 1.6 0"></a-sphere>
        <a-cylinder class="body" color="#5985ff" scale="0.25 0.7 0.25" position="0 1 0"></a-cylinder>
        <a-text class="nametag" value="" position="0 2.2 0" align="center" scale="0.8 0.8 0.8"></a-text>
      </a-entity>
    </template>
  </a-assets>
  
  <!-- Your existing content -->
  <a-box position="0 1 -5" color="red"></a-box>
  <a-sphere position="2 1 -5" color="blue"></a-sphere>
  
  <!-- Enhanced camera with networking -->
  <a-entity id="player" camera wasd-controls look-controls position="0 1.6 3"
    networked="template:#avatar-template;attachTemplateToLocal:false;">
  </a-entity>
</a-scene>
```

**Developer API:**
```javascript
// Wait for enhancement to complete
window.addEventListener('vr:aframe_enhanced', (event) => {
  const { author, permlink, subspace, nafConfig, scene } = event.detail;
  console.log(`A-Frame enhanced for ${author}/${permlink}:${subspace}`);
  
  // Now you can use NAF normally
  scene.addEventListener('clientConnected', (e) => {
    console.log('New user joined:', e.detail.clientId);
  });
});
```

### 3. Generic Applications - Universal Room API

**Scenario:** Post has no A-Frame but needs networking (games, chats, collaborative tools).

**What happens:**
- Wallet creates generic room API
- Exposes `window.dluxRoom` object
- Provides WebSocket connection to presence server
- Offers WebRTC credentials for peer connections

**Example Applications:**

#### Chess Game
```html
<div id="chess-game">
  <div id="chess-board"></div>
  <div id="game-controls">
    <button onclick="createGame()">Create Game</button>
    <button onclick="joinGame()">Join Game</button>
  </div>
</div>

<script>
// Wait for room API to be ready
window.addEventListener('vr:generic_room_ready', (event) => {
  const { roomAPI } = event.detail;
  console.log('Chess game room ready:', roomAPI.roomId);
  
  // Set up chess game networking
  roomAPI.on('chess-move', (event) => {
    const { move, player } = event.detail;
    updateChessBoard(move, player);
  });
  
  roomAPI.on('game-request', (event) => {
    const { fromPlayer } = event.detail;
    showGameInvite(fromPlayer);
  });
});

function createGame() {
  // Create chess sub-room
  dluxRoom.joinSubRoom('chess-' + generateGameId()).then(gameRoom => {
    console.log('Chess game created:', gameRoom.roomId);
    gameRoom.send({
      type: 'game-created',
      gameType: 'chess',
      player: dluxRoom.author // Current user from post context
    });
  });
}

function makeMove(move) {
  dluxRoom.send({
    type: 'chess-move',
    move: move,
    player: dluxRoom.author,
    timestamp: Date.now()
  });
}
</script>
```

#### Collaborative Drawing
```html
<canvas id="drawing-canvas" width="800" height="600"></canvas>

<script>
window.addEventListener('vr:generic_room_ready', (event) => {
  const { roomAPI } = event.detail;
  const canvas = document.getElementById('drawing-canvas');
  const ctx = canvas.getContext('2d');
  
  // Listen for drawing updates
  roomAPI.on('draw-stroke', (event) => {
    const { x, y, color, size } = event.detail;
    drawStroke(ctx, x, y, color, size);
  });
  
  // Send drawing data
  canvas.addEventListener('mousemove', (e) => {
    if (e.buttons === 1) { // Mouse down
      roomAPI.send({
        type: 'draw-stroke',
        x: e.offsetX,
        y: e.offsetY,
        color: currentColor,
        size: currentBrushSize,
        user: roomAPI.author
      });
    }
  });
});
</script>
```

#### Private Chat System
```html
<div id="chat-system">
  <div id="main-chat"></div>
  <div id="private-chats"></div>
  <button onclick="createPrivateChat()">Start Private Chat</button>
</div>

<script>
window.addEventListener('vr:generic_room_ready', (event) => {
  const { roomAPI } = event.detail;
  
  // Main room chat
  roomAPI.on('chat-message', (event) => {
    displayMessage('main-chat', event.detail);
  });
  
  // Private chat invites
  roomAPI.on('private-chat-invite', (event) => {
    const { fromUser, chatId } = event.detail;
    showPrivateChatInvite(fromUser, chatId);
  });
});

async function createPrivateChat(targetUser) {
  const chatId = `private-${Date.now()}`;
  const privateRoom = await dluxRoom.joinSubRoom(chatId);
  
  // Invite other user
  dluxRoom.send({
    type: 'private-chat-invite',
    targetUser: targetUser,
    chatId: chatId,
    fromUser: dluxRoom.author
  });
  
  // Set up private chat UI
  createPrivateChatUI(privateRoom, targetUser);
}
</script>
```

## Room API Reference

### Generic Room API (`window.dluxRoom`)

```javascript
// Room information
dluxRoom.author        // Post author
dluxRoom.permlink      // Post permlink  
dluxRoom.subspace      // Current subspace (default: 'main')
dluxRoom.roomId        // Full room ID: "author/permlink:subspace"

// Connection
dluxRoom.connected     // Boolean: connection status
dluxRoom.socket        // WebSocket connection

// Event system
dluxRoom.on(event, callback)     // Listen for events
dluxRoom.off(event, callback)    // Remove event listener
dluxRoom.emit(event, data)       // Emit local event

// Messaging
dluxRoom.send(message)           // Send message to room

// Sub-room management
dluxRoom.joinSubRoom(name)       // Create/join sub-room
dluxRoom.getWebRTCCredentials()  // Get TURN/STUN credentials

// Disconnect
dluxRoom.disconnect()            // Leave room
```

### Available Events

```javascript
// Connection events
dluxRoom.on('connected', (event) => {
  // Room connection established
});

dluxRoom.on('disconnected', (event) => {
  // Room connection lost
});

dluxRoom.on('error', (event) => {
  // Connection error
});

// Message events  
dluxRoom.on('message', (event) => {
  // Any message received
});

dluxRoom.on('custom-event-type', (event) => {
  // Specific message types you define
});
```

## Sub-Room Examples

### Chess Game Rooms
```javascript
// Main post room: "author/permlink:main"
// Chess game 1: "author/permlink:main-chess-game1"
// Chess game 2: "author/permlink:main-chess-game2"

const chessRoom = await dluxRoom.joinSubRoom('chess-game1');
chessRoom.send({
  type: 'chess-move',
  move: 'e2-e4',
  player: 'white'
});
```

### Private Conversations
```javascript
// Private chat: "author/permlink:main-private-alice-bob"
const privateChat = await dluxRoom.joinSubRoom('private-alice-bob');
privateChat.send({
  type: 'private-message',
  text: 'Hello!',
  from: 'alice'
});
```

### Listening Rooms
```javascript
// Public listening room: "author/permlink:main-listen-music"
const listeningRoom = await dluxRoom.joinSubRoom('listen-music');
listeningRoom.send({
  type: 'now-playing',
  track: 'Amazing Song.mp3',
  timestamp: Date.now()
});
```

## WebRTC Peer Connections

For applications needing direct peer connections:

```javascript
window.addEventListener('vr:generic_room_ready', async (event) => {
  const { roomAPI } = event.detail;
  
  // Get TURN/STUN credentials
  const credentials = roomAPI.getWebRTCCredentials();
  
  // Create peer connection
  const peerConnection = new RTCPeerConnection({
    iceServers: [
      { urls: 'stun:presence.dlux.io:3478' },
      {
        urls: 'turn:presence.dlux.io:3478',
        username: credentials.username,
        credential: credentials.credential
      }
    ]
  });
  
  // Use for voice/video/data channels
  peerConnection.createDataChannel('game-data');
});
```

## Best Practices

### 1. Always Check for Room Availability
```javascript
if (window.dluxRoom) {
  // Room API available
  setupNetworking();
} else {
  // Wait for room initialization
  window.addEventListener('vr:generic_room_ready', setupNetworking);
}
```

### 2. Handle Disconnections Gracefully
```javascript
dluxRoom.on('disconnected', () => {
  showOfflineMode();
  // Attempt reconnection
  setTimeout(reconnectToRoom, 5000);
});
```

### 3. Validate Messages
```javascript
dluxRoom.on('message', (event) => {
  const message = event.detail;
  
  // Validate message structure
  if (!message.type || !message.user) {
    console.warn('Invalid message received:', message);
    return;
  }
  
  // Process valid message
  handleMessage(message);
});
```

### 4. Clean Up Resources
```javascript
window.addEventListener('beforeunload', () => {
  if (dluxRoom) {
    dluxRoom.disconnect();
  }
});
```

## Troubleshooting

### A-Frame Not Detected
- Ensure `<a-scene>` element exists before wallet initialization
- Check browser console for A-Frame loading errors

### Room API Not Available
- Verify you're on a valid post page (`/@author/permlink`)
- Check network connectivity to `presence.dlux.io`
- Look for authentication errors in console

### NAF Connection Issues
- Verify WebRTC is supported in browser
- Check firewall settings for WebSocket connections
- Ensure TURN credentials are properly configured

### Sub-Room Creation Fails
- Must be in a main room before creating sub-rooms
- Sub-room names should be URL-safe
- Check for permission errors

This enhanced integration allows any type of networked application to work seamlessly within DLUX posts while maintaining the security and decentralization benefits of the Hive blockchain authentication system. 