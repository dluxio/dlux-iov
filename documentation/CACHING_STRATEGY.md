# Tiered Service Worker Caching Strategy

## Overview

The service worker now implements a sophisticated tiered caching strategy designed to optimize first paint time, interactivity, and overall user experience. Instead of caching 400+ files during installation (which was slow), we now use a three-tier approach.

## Caching Tiers

### Priority 1: Critical Resources (Cached Immediately)
**Goal**: Fast first paint and basic functionality
**When**: During service worker installation
**Size**: ~15 files

Includes:
- Core HTML pages (`index.html`, `about/index.html`)
- Essential CSS (`bootstrap.css`, `custom.css`, `v3.css`)
- Core JavaScript (`vue.esm-browser.js`, `v3-app.js`, `v3-index.js`, `v3-nav.js`)
- Essential images and icons
- Service worker registration script

### Priority 2: Important Resources (Background Cached)
**Goal**: Common interactions without network delays
**When**: Background caching after service worker activation
**Size**: ~25 files

Includes:
- Common HTML pages (`create`, `nfts`, `user`, `dlux`, `dex`, `hub`, `dao`, `blog`)
- Additional CSS frameworks
- Important JavaScript modules for common functionality
- Token icons and branding images

### Priority 3: Page-Specific Resources (On-Demand)
**Goal**: Specialized functionality cached only when needed
**When**: Triggered by navigation to specific pages
**Size**: Variable (5-50 files per page type)

Page-specific groups:
- **Create page**: Upload components, markdown editor, tag system
- **A-Frame/VR**: A-Frame framework, VR components, 3D assets
- **Monaco Editor**: Code editor, language support, syntax highlighting
- **Playground**: Interactive development environment
- **Chat**: Chat components and AI integration
- **Mint/NFT**: NFT creation and minting tools

## Performance Benefits

### Before (Old Strategy)
- 400+ files cached during installation
- Slow initial service worker installation (5-15 seconds)
- Blocked first paint until all resources cached
- High bandwidth usage on first visit
- All-or-nothing caching approach

### After (Tiered Strategy)
- 15 critical files cached during installation (1-2 seconds)
- Fast first paint and immediate interactivity
- Progressive enhancement as user navigates
- Reduced bandwidth usage - only cache what's needed
- Graceful degradation if caching fails

## Implementation Details

### Batched Caching
- Resources cached in small batches (5-10 files) to avoid overwhelming the browser
- Small delays between batches to prevent blocking the main thread
- Error handling continues with next batch if some resources fail

### Navigation-Triggered Caching
- Page navigation automatically triggers caching of relevant resources
- Proactive caching based on URL patterns
- Resources checked for existing cache to avoid duplicate requests

### Cache Management
- Old caches automatically cleaned up during activation
- Background processes don't block critical functionality
- Comprehensive error handling and logging

## Monitoring and Debugging

Console logs help track caching progress:
- `SW: Caching critical resources for fast first paint...`
- `SW: Background caching important resources...`
- `SW: Cached batch X/Y`
- `SW: Proactively caching resources for /page`

## Configuration

To modify the caching strategy, edit the arrays in `sw.js`:
- `criticalResources`: Adjust for faster/slower first paint
- `importantResources`: Add commonly used resources
- `pageSpecificResources`: Add new page types or modify existing ones

## Fallback Strategy

If resources aren't cached:
1. Attempt network fetch
2. Cache successful responses for future use
3. Return cached version if network fails
4. Return 503 Service Unavailable as last resort (except for external APIs)

This tiered approach provides the best balance of performance, reliability, and resource efficiency. 