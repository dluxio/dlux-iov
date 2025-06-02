# DLUX New User Onboarding System

## Overview

This comprehensive onboarding system allows new users to create HIVE accounts through the DLUX platform with multiple secure key generation methods and payment options. The system integrates with dluxPEN for secure local key storage and supports various crypto wallets for enhanced security.

## Features Implemented

### 🎯 Core Functionality

1. **Multi-Step Onboarding Interface**
   - Clean, intuitive 3-step process
   - Progress indicators with visual feedback
   - Responsive design for all devices

2. **Username Validation**
   - Real-time availability checking
   - HIVE blockchain validation
   - Format validation with helpful error messages
   - Debounced API calls for performance

3. **Wallet Detection & Integration**
   - Automatic detection of installed crypto wallets
   - Support for MetaMask, Phantom, Coinbase Wallet, Trust Wallet, WalletConnect
   - Visual wallet selection interface

4. **Secure Key Generation**
   - **Wallet Signature Method**: Generate keys from existing wallet signatures (recommended)
   - **Random Generation**: Cryptographically secure random key generation
   - Deterministic key derivation using PBKDF2 and SHA256
   - Support for all HIVE key types (posting, active, owner, memo)

5. **dluxPEN Integration**
   - Automatic storage of generated keys in encrypted local storage
   - PIN-based encryption for security
   - Pending account support (keys stored before account creation)
   - Recovery method tracking for future key regeneration

### 💳 Payment & Account Creation Options

1. **Cryptocurrency Payments**
   - Support for multiple cryptocurrencies (SOL, ETH, MATIC, BNB)
   - Dynamic pricing table
   - Wallet integration for seamless payments
   - Placeholder for payment processor integration

2. **Account Request System**
   - Send requests to existing HIVE users
   - Include custom messages
   - Public key sharing for manual account creation
   - API-ready structure for future implementation

3. **Manual Account Creation**
   - Links to official HIVE signup services
   - Public key export for manual account creation
   - Downloadable key files

## Technical Implementation

### File Structure

```
qr/
├── index.html              # Main onboarding interface
└── js/
    └── v3-qr.js           # Onboarding logic and wallet integration

js/
└── v3-nav.js              # dluxPEN integration and key storage

img/
├── wallets/               # Wallet icons
│   ├── metamask.svg
│   ├── phantom.svg
│   ├── coinbase.svg
│   ├── trust.svg
│   └── walletconnect.svg
└── crypto/                # Cryptocurrency icons
    ├── solana.svg
    ├── ethereum.svg
    ├── polygon.svg
    └── bnb.svg
```

### Key Components

#### 1. Wallet Detection (`detectWallets()`)
```javascript
// Automatically detects installed crypto wallets
// Supports: MetaMask, Phantom, Coinbase, Trust Wallet, WalletConnect
```

#### 2. Key Generation (`generateKeys()`)
```javascript
// Two methods:
// - generateKeysFromWallet(): Uses wallet signature for deterministic keys
// - generateRandomKeys(): Cryptographically secure random generation
```

#### 3. dluxPEN Integration (`storeNewAccountInPEN()`)
```javascript
// Stores generated keys in encrypted local storage
// Handles pending accounts (before blockchain creation)
// Integrates with existing dluxPEN wallet system
```

#### 4. Username Validation (`checkUsernameAvailability()`)
```javascript
// Real-time validation against HIVE blockchain
// Format checking and availability verification
// Debounced API calls for performance
```

### Security Features

1. **Deterministic Key Generation**
   - Keys can be regenerated from wallet signatures
   - Reduces risk of key loss
   - Maintains cryptographic security

2. **Encrypted Local Storage**
   - All keys encrypted with user PIN
   - PBKDF2 key derivation for security
   - Session-based decryption

3. **Pending Account Support**
   - Keys stored before account creation
   - Verification skipped for pending accounts
   - Secure key management workflow

## Usage Guide

### For New Users

1. **Step 1: Choose Username**
   - Enter desired username
   - System validates availability and format
   - Real-time feedback provided

2. **Step 2: Generate Keys**
   - Select key generation method
   - Connect crypto wallet (recommended) or use random generation
   - Keys automatically stored in dluxPEN

3. **Step 3: Create Account**
   - Choose payment method
   - Pay with crypto, request from friend, or manual creation
   - Complete onboarding process

### For Developers

#### Adding New Wallet Support

```javascript
// In detectWallets() method
if (window.newWallet && window.newWallet.isNewWallet) {
  this.detectedWallets.push({
    name: 'New Wallet',
    network: 'Network Name',
    icon: '/img/wallets/newwallet.svg',
    provider: window.newWallet
  });
}
```

#### Adding New Cryptocurrency

```javascript
// In cryptoPricing array
{
  symbol: 'NEW',
  name: 'New Crypto',
  network: 'Network',
  price: '1.00',
  icon: '/img/crypto/newcrypto.svg'
}
```

## API Integration Points

### Account Request System
```javascript
// POST /api/account-requests
{
  newUsername: string,
  publicKeys: object,
  requesterMessage: string,
  requestedFrom: string,
  timestamp: string
}
```

### Payment Processing
```javascript
// Integration points for:
// - Solana payments
// - Ethereum payments
// - Polygon payments
// - BSC payments
```

## Testing

### Test Page
Access `test-onboarding.html` for:
- Wallet detection testing
- Key generation verification
- Feature status overview

### Manual Testing
1. Open `/qr/` page
2. Test username validation
3. Test wallet detection
4. Generate keys with different methods
5. Verify dluxPEN integration

## Future Enhancements

### Planned Features
1. **Payment Processor Integration**
   - Stripe for fiat payments
   - Crypto payment gateways
   - Real-time price updates

2. **Enhanced Wallet Support**
   - More wallet providers
   - Mobile wallet support
   - Hardware wallet integration

3. **API Development**
   - Account request system
   - Payment processing
   - Status tracking

4. **UX Improvements**
   - Better loading states
   - Enhanced error handling
   - Mobile optimization

### Security Enhancements
1. **Key Recovery System**
   - Multiple recovery methods
   - Social recovery options
   - Backup verification

2. **Advanced Encryption**
   - Hardware security module support
   - Biometric authentication
   - Multi-factor authentication

## Dependencies

- **Vue.js 2.6.14**: Frontend framework
- **dhive**: HIVE blockchain interaction
- **CryptoJS**: Cryptographic functions
- **Bootstrap 5**: UI components
- **Font Awesome**: Icons

## Browser Compatibility

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Security Considerations

1. **Private Key Handling**
   - Never transmitted over network
   - Encrypted at rest
   - Secure generation methods

2. **PIN Security**
   - PBKDF2 key derivation
   - Session-based storage
   - Automatic timeout

3. **Wallet Integration**
   - Secure signature requests
   - No private key access
   - User consent required

## Support

For issues or questions:
1. Check the test page for diagnostics
2. Review browser console for errors
3. Verify wallet installation and permissions
4. Ensure JavaScript is enabled

## License

This onboarding system is part of the DLUX project and follows the same licensing terms. 