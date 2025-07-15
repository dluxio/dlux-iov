# DLUX Wallet Cross-Domain Messaging System

This system enables subdomains (like `publisher1.ipfs.dlux.io`) to communicate with main DLUX domains for user authentication and transaction signing, while maintaining security through origin validation and user confirmation prompts.

## Architecture

### Components

1. **`dlux-wallet.js`** - Subdomain client script
2. **`v3-nav.js`** - Main domain navigation component with messaging handlers
3. **PostMessage API** - Secure cross-origin communication

### Domain Priority

The wallet automatically detects available master domains in order of preference:

1. `vue.dlux.io` (nightly/testing environment)
2. `dlux.io` (main production)
3. `www.dlux.io` (www redirect)

## Security Model

### Origin Validation

- **Subdomain origins** are validated against patterns:
  - `*.ipfs.dlux.io`
  - `*.dlux.io` 
  - `*.test.dlux.io`

### User Confirmation Requirements

- **Get User Info**: ✅ Unrestricted
- **Navigation Requests**: ⚠️ Requires user confirmation
- **Transaction Signing**: ⚠️ Requires user confirmation
- **Challenge Signing**: ⚠️ Requires user confirmation

## API Reference

### Subdomain Usage (`dlux-wallet.js`)

```javascript
// Wait for wallet to be ready
window.addEventListener('dlux-wallet-ready', (event) => {
    console.log('Wallet ready!', event.detail);
});

// Get current user (unrestricted)
const user = await window.dluxWallet.getCurrentUser();

// Request navigation (requires confirmation)
await window.dluxWallet.requestNavigation('/@username/permlink');

// Sign transaction and broadcast (requires confirmation)
const result = await window.dluxWallet.signTransaction([
    'username',
    [['vote', { voter: 'username', author: 'author', permlink: 'post', weight: 10000 }]],
    'posting'
]);

// Sign transaction without broadcasting (requires confirmation)
const signedTx = await window.dluxWallet.signOnly([
    'username',
    [['vote', { voter: 'username', author: 'author', permlink: 'post', weight: 10000 }]],
    'posting'
]);

// Sign challenge (requires confirmation)
const signature = await window.dluxWallet.signChallenge('challenge-string', 'posting');
```

### Event Listeners

```javascript
// Wallet ready
window.addEventListener('dlux-wallet-ready', (e) => {
    console.log('Master:', e.detail.master, 'User:', e.detail.user);
});

// User changed
window.addEventListener('dlux-wallet-userChanged', (e) => {
    console.log('New user:', e.detail.user);
});

// User logout
window.addEventListener('dlux-wallet-logout', () => {
    console.log('User logged out');
});

// Wallet error
window.addEventListener('dlux-wallet-error', (e) => {
    console.error('Wallet error:', e.detail.message);
});

// Secure window opened (when no master domain available)
window.addEventListener('dlux-wallet-secure-window-opened', (e) => {
    console.log('Secure wallet window opened:', e.detail.window);
});
```

## Message Protocol

### Message Structure

All messages include:
```javascript
{
    id: 'unique-message-id',
    type: 'message-type',
    data: { /* payload */ },
    source: 'dlux-wallet' | 'dlux-nav',
    origin: 'https://subdomain.dlux.io',
    timestamp: 1234567890
}
```

### Message Types

#### 1. Get User (`get-user`)

**Request:**
```javascript
{
    type: 'get-user',
    data: {}
}
```

**Response:**
```javascript
{
    data: {
        user: 'username' | null,
        isLoggedIn: boolean,
        signerType: 'HAS' | 'HKC' | 'PEN' | 'HSR' | 'none'
    }
}
```

#### 2. Request Navigation (`request-navigation`)

**Request:**
```javascript
{
    type: 'request-navigation',
    data: {
        path: '/@username/permlink'
    }
}
```

**Response:**
```javascript
{
    data: {
        success: true
    }
}
```

#### 3. Sign Transaction (`sign-transaction`)

**Request:**
```javascript
{
    type: 'sign-transaction',
    data: {
        transaction: ['username', [operations], 'keyType']
    }
}
```

**Response:**
```javascript
{
    data: {
        result: { /* hive transaction result */ },
        success: true
    }
}
```

#### 4. Sign Only (`sign-only`)

**Request:**
```javascript
{
    type: 'sign-only',
    data: {
        transaction: ['username', [operations], 'keyType']
    }
}
```

**Response:**
```javascript
{
    data: {
        result: { /* signed transaction object */ },
        success: true
    }
}
```

#### 5. Sign Challenge (`sign-challenge`)

**Request:**
```javascript
{
    type: 'sign-challenge',
    data: {
        challenge: 'string-to-sign',
        keyType: 'posting',
        username: 'username'
    }
}
```

**Response:**
```javascript
{
    data: {
        signature: 'signature-string'
    }
}
```

## Implementation Details

### Master Domain Detection

The wallet attempts to establish communication with master domains by:

1. Creating hidden iframes
2. Testing for successful load
3. Using the first available domain
4. Falling back to next priority if unavailable

### Message Handling

- **Timeout**: 60 seconds for all requests (VR-friendly)
- **Cleanup**: Automatic cleanup of expired pending messages
- **Retry**: No automatic retry (client must implement)
- **Secure Window**: Opens dlux.io in new window when no master domain available

### Error Handling

All errors return in this format:
```javascript
{
    id: 'message-id',
    error: 'Error message',
    data: null
}
```

## User Confirmation Dialogs

### Navigation Confirmation
```
[subdomain.dlux.io] wants to navigate to:
/@username/permlink

Do you want to allow this navigation?
[Cancel] [OK]
```

### Transaction Confirmation
```
[subdomain.dlux.io] wants to sign a Hive transaction with 1 operation(s).

Do you want to allow this transaction signing?
[Cancel] [OK]
```

### Sign-Only Confirmation
```
[subdomain.dlux.io] wants to sign a Hive transaction with 1 operation(s) WITHOUT broadcasting it to the blockchain.

This will create a signed transaction that can be broadcast later.

Do you want to allow this signing?
[Cancel] [OK]
```

### Challenge Confirmation
```
[subdomain.dlux.io] wants to sign a challenge with your posting key.

Challenge: challenge-string-preview...

Do you want to allow this signing?
[Cancel] [OK]
```

### No Master Domain Available
```
Unable to establish secure communication with DLUX wallet.

Would you like to open dlux.io in a new window to securely manage your Hive data?

This will allow you to:
• Log in to your Hive account
• Sign transactions securely  
• Return to this page when ready

[Cancel] [OK]
```

## Integration Examples

### Basic HTML Integration

```html
<!DOCTYPE html>
<html>
<head>
    <title>My DLUX App</title>
</head>
<body>
    <script src="https://dlux.io/js/dlux-wallet.js"></script>
    <script>
        window.addEventListener('dlux-wallet-ready', async () => {
            const user = await window.dluxWallet.getCurrentUser();
            if (user) {
                console.log('User is logged in:', user);
            }
        });
    </script>
</body>
</html>
```

### React Integration

```javascript
import { useEffect, useState } from 'react';

function useDluxWallet() {
    const [wallet, setWallet] = useState(null);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const handleReady = (event) => {
            setWallet(window.dluxWallet);
            setUser(event.detail.user);
        };

        const handleUserChanged = (event) => {
            setUser(event.detail.user);
        };

        window.addEventListener('dlux-wallet-ready', handleReady);
        window.addEventListener('dlux-wallet-userChanged', handleUserChanged);

        // Check if already ready
        if (window.dluxWallet?.isWalletReady()) {
            setWallet(window.dluxWallet);
            setUser(window.dluxWallet.currentUser);
        }

        return () => {
            window.removeEventListener('dlux-wallet-ready', handleReady);
            window.removeEventListener('dlux-wallet-userChanged', handleUserChanged);
        };
    }, []);

    return { wallet, user };
}
```

## Testing

Use the provided `wallet-example.html` file to test all wallet functions:

1. Host the file on a subdomain (e.g., `test.dlux.io`)
2. Ensure main domain is accessible
3. Test each function through the interface
4. Monitor console for detailed logs

## Browser Support

- **Chrome**: ✅ Full support
- **Firefox**: ✅ Full support  
- **Safari**: ✅ Full support
- **Edge**: ✅ Full support

Requires modern browsers with:
- PostMessage API
- Promise support
- ES6 Classes
- Custom Events

## Troubleshooting

### Common Issues

1. **No master domain available**
   - Check network connectivity
   - Verify CORS settings
   - Confirm master domains are accessible

2. **Origin validation failed**
   - Verify subdomain matches allowed patterns
   - Check for typos in domain configuration

3. **Transaction signing fails**
   - Ensure user is logged in on master domain
   - Verify signing method is properly configured
   - Check transaction format

4. **Message timeouts**
   - Check for popup blockers
   - Verify iframe loading
   - Monitor network requests

### Debug Mode

Enable verbose logging:
```javascript
// In browser console
localStorage.setItem('dlux-wallet-debug', 'true');
```

This will provide detailed logging of all message exchanges and internal wallet operations.

## Device Connection System

DLUX Wallet includes a powerful device connection system that enables cross-device wallet functionality. This is perfect for VR headsets, public terminals, and any scenario where you want to keep your wallet secure on one device while using another device for interaction.

### Key Features

- **6-digit pairing codes** for easy device connection
- **Remote transaction signing** with user confirmation
- **VR-optimized timeouts** (60 seconds) for comfortable use
- **Secure backend communication** through data.dlux.io
- **Multi-device support** for various use cases

### Quick Start

```javascript
// On signing device (phone/tablet with wallet)
const pairCode = await dluxWallet.requestDevicePairing();
console.log('Share this code:', pairCode); // e.g., "A3X9K2"

// On requesting device (VR headset/kiosk)
await dluxWallet.connectToDevice('A3X9K2');

// Send transaction to signing device
const result = await dluxWallet.requestRemoteSign(transaction);
```

For complete documentation, see [DEVICE-CONNECTION.md](./DEVICE-CONNECTION.md).

## Future Enhancements

- WebSocket support for real-time communication
- Multi-tab synchronization for wallet state
- Enhanced security with device fingerprinting
- Support for additional wallet types (browser extension wallets)
- Transaction batching for multiple operations
- Offline transaction signing capabilities
- QR code pairing for device connections
- Multi-device management interface 