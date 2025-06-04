# DLUX - Decentralized Limitless User eXperiences

A decentralized platform for immersive content, NFTs, and virtual reality experiences built on the Hive blockchain. This code base is the static open source front end. 

## 🚀 Features

- **VR/AR Content Creation** - Build immersive experiences with A-Frame
- **NFT Marketplace** - Create, mint, and trade digital assets
- **Decentralized Storage** - IPFS integration for content distribution
- **Smart Caching** - Advanced service worker with intelligent file management
- **Cross-platform** - Web-based with progressive web app capabilities

## 📋 Contributors Guide

### Cache Management System

This project uses an advanced cache management system that automatically handles 446+ files with intelligent categorization and checksums for optimal performance.

#### 🏗️ Architecture Overview

**Current Cache Statistics:**
- 🚀 **Critical**: 18 files (fast first paint - index.html, main CSS/JS)
- ⚡ **Important**: 225 files (core functionality - navigation, auth, common features)  
- 🎯 **Page-specific**: 187 files (specialized features - aframe, monaco, playground)
- 😴 **Lazy**: 16 files (non-essential - old versions, tests, debug files)
- 📦 **Total**: 446 files with MD5 checksums

#### 🔧 For Contributors

**When adding new files:**

1. **Automatic** (Recommended for contributors): Just push your changes
   - GitHub Action detects cacheable files (`.html`, `.css`, `.js`, images, fonts)
   - New files are auto-categorized as "important" (safe default)
   - Cache manifest is updated automatically with new version
   - **No manual intervention needed** - normal git workflow!

2. **Manual** (For maintainers only):
   ```bash
   # Manual cache manifest regeneration (rarely needed)
   ./generate-cache-manifest.sh "2025.01.15.3"
   
   # Version script with cache updates (for complex changes)
   ./gs.sh
   ```

**File categorization patterns:**
- **Critical**: `index.html`, main CSS (`custom.css`, `bootstrap`), core JS (`vue.esm`, `v3-nav`)
- **Important**: Common functionality, navigation, authentication, core features
- **Page-specific**: A-Frame, Monaco editor, playground, chat, specialized tools
- **Lazy**: Files with `-old.`, `test`, `spec`, `debug`, environment thumbnails

#### 🤖 GitHub Actions Workflow

Our automated system handles cache management:

**Triggers:**
- Push to main/master with cacheable file changes
- Manual workflow dispatch

**Process:**
1. Detects new/changed cacheable files
2. Generates incremental version (YYYY.MM.DD.N format)
3. Runs `generate-cache-manifest.sh` with `--auto-important` flag
4. Auto-categorizes new files as "important" (safe for 3rd party PRs)
5. Updates service worker version in `sw.js`, `reg-sw.js`, `sw-monitor.js`
6. Commits changes back with "🤖 Auto-update cache manifest" message

**For 3rd Party PRs:** New files are automatically categorized as "important" which is safe but may not be optimal. Manual review recommended after merge for performance tuning.

#### 📁 Key Files

- **`sw.js`** - Service worker with `self.cacheManifest` (single source of truth)
- **`generate-cache-manifest.sh`** - Discovers files, generates checksums, categorizes by priority
- **`gs.sh`** - Manual version management and new file guidance
- **`.github/workflows/cache-manifest.yml`** - Automated cache management
- **`CACHE_SYSTEM.md`** - Detailed technical documentation

#### 🛠️ Cache System Commands

```bash
# Check for new files and get guidance
./gs.sh

# Generate cache manifest with auto-categorization (GitHub Actions)
./generate-cache-manifest.sh "version" --auto-important

# Manual cache manifest generation
./generate-cache-manifest.sh "2025.01.15.3"

# Force regeneration
./generate-cache-manifest.sh "version" --force
```

#### 📊 Service Worker Features

- **Smart caching**: Checksum-based cache validation
- **Priority loading**: Critical files first, background loading for others
- **Lazy loading**: Non-essential files cached on-demand
- **Cache integrity**: MD5 checksums prevent corruption
- **Automatic updates**: Seamless version transitions

#### 🔍 Debugging

1. **Check cache stats**: Look at `self.cacheManifest` in browser dev tools
2. **Monitor service worker**: Use `/sw-monitor-test.html` for real-time diagnostics
3. **Verify versions**: Check that all files have matching version numbers
4. **Test caching**: Use Network tab to verify cache hits/misses

### Development Workflow

1. **Clone repository**
   ```bash
   git clone https://github.com/dluxio/dlux-iov.git
   cd dlux-iov
   ```

2. **Make changes** to any files

3. **Test locally** using a local server

4. **Commit and push** - GitHub Actions will handle cache management automatically

5. **Monitor Actions tab** for successful cache manifest updates

### File Structure

```
dlux-iov/
├── sw.js                          # Service worker with cache manifest
├── generate-cache-manifest.sh     # Cache management script
├── gs.sh                          # Version management
├── .github/workflows/             # Automated workflows
├── css/                           # Stylesheets
├── js/                            # JavaScript files
├── img/                           # Images and assets
├── naf-playground/                # Networked A-Frame playground
├── aframe-builder/                # VR content builder
└── ...                            # Content directories
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

The cache management system will automatically handle your new files - no manual intervention needed!

### License

MIT License - see LICENSE file for details.

### Support

For questions about the cache system, see `CACHE_SYSTEM.md` or open an issue. 