# NFT Script Execution Security Improvement

## Summary

This document describes the security improvements made to NFT generative script execution in the DLUX platform.

## Problem

Previously, NFT generative scripts were executed using direct `eval()` calls in multiple contexts:

1. **Service Worker** - Arbitrary user scripts executed with high privileges
2. **Main Thread** - Direct `eval()` calls in Vue components
3. **No Sandboxing** - Scripts had access to global objects and APIs

This approach posed serious security risks:
- Code injection attacks
- Access to sensitive APIs (localStorage, cookies, etc.)
- Potential for malicious scripts to compromise user data
- Service worker privilege escalation

## Solution

### New Secure Architecture

1. **Removed from Service Worker**
   - Completely removed dangerous `eval()` code from `sw.js`
   - Service worker no longer executes arbitrary user scripts

2. **Sandboxed Iframe Execution**
   - Created `nft-script-executor.js` with isolated execution environment
   - Scripts run in sandboxed iframe with `allow-scripts` only
   - No access to parent window, DOM, or sensitive APIs

3. **Input Validation**
   - Basic script validation to block obviously dangerous patterns
   - Blacklist of dangerous functions and objects

4. **Timeout Protection**
   - 5-second execution timeout prevents hanging scripts
   - Proper cleanup of execution contexts

### Files Modified

- `sw.js` - Removed NFT script execution functions
- `js/nft-script-executor.js` - New secure execution environment
- `js/v3-user.js` - Updated to use secure executor
- `js/vueme.js` - Updated to use secure executor  
- `js/v3-nfts.js` - Updated to use secure executor
- `js/nftsvue.js` - Updated to use secure executor
- `js/spkvue.js` - Updated to use secure executor
- `user/index.html` - Added secure executor script
- `nfts/index.html` - Added secure executor script

### Security Features

1. **Iframe Sandbox**
   ```html
   <iframe sandbox="allow-scripts">
   ```

2. **Message-Based Communication**
   - Scripts execute in isolation
   - Results passed via `postMessage`
   - No direct object sharing

3. **Pattern Validation**
   - Blocks dangerous patterns like `document.`, `window.`, `eval(`, etc.
   - Prevents obvious attack vectors

4. **Execution Timeout**
   - Scripts must complete within 5 seconds
   - Prevents infinite loops and hanging

## Usage

The new secure executor maintains the same API:

```javascript
// Old way (insecure)
const result = eval(userScript);

// New way (secure)
const result = await window.NFTScriptExecutor.callScript(nftData);
```

## Backward Compatibility

- API remains the same for existing components
- No breaking changes to Vue component interfaces
- Scripts should continue to work as before (if legitimate)

## Future Improvements

1. **WebAssembly Sandbox** - Even more isolated execution
2. **Resource Limits** - Memory and CPU constraints
3. **Allowlist Validation** - Only allow specific function calls
4. **Script Signing** - Cryptographic verification of scripts

## Testing

Test that:
1. Legitimate NFT scripts continue to work
2. Malicious scripts are blocked or sandboxed
3. Performance impact is minimal
4. Error handling works correctly

## Security Note

While this is a significant improvement, NFT script execution still involves running untrusted code. Users should be cautious about interacting with NFTs from unknown sources. 