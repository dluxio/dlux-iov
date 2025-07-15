# Cache Manifest System

This project uses an advanced cache manifest system for the service worker that provides better performance, version control, and automated maintenance.

## Overview

The cache system has evolved from hardcoded file arrays to a dynamic manifest-based approach that includes:

- ✅ **Checksum validation** for cache integrity
- ✅ **Priority-based caching** (critical, important, page-specific, lazy)
- ✅ **Automated file discovery** and categorization
- ✅ **GitHub Actions integration** for hands-off maintenance
- ✅ **Smart cache invalidation** based on file changes

## Architecture

### Service Worker (`sw.js`)
- **Version**: Auto-incremented daily format `YYYY.MM.DD.N`
- **Cache Strategy**: Smart caching with priority levels
- **Manifest**: Self-contained `self.cacheManifest` object with checksums

### Cache Manifest Generator (`generate-cache-manifest.sh`)
- Scans all cacheable files in the repository
- Generates MD5 checksums for integrity checking
- Categorizes files by priority using intelligent rules
- Updates the manifest directly in `sw.js`

### Version Script (`gs.sh`)
- Updates service worker version number
- Detects new cacheable files
- Guides users to update the cache manifest
- No longer handles file categorization (delegated to manifest generator)

### GitHub Action (`.github/workflows/cache-manifest.yml`)
- Triggers on pushes that modify cacheable files
- Auto-generates new versions and updates manifest
- Commits changes back to repository
- Provides detailed summaries of cache statistics

## Priority Levels

### 🚀 **Critical** 
**Cached immediately during SW installation**
- Core HTML pages (`index.html`, main app pages)
- Essential CSS (`custom.css`, bootstrap core)
- Critical JavaScript (Vue.js, navigation, core functionality)
- Service worker itself

### ⚡ **Important**
**Cached in background after critical files**
- Common functionality (user management, API clients)
- Frequently used components and utilities
- Core assets (logos, icons, common images)
- Standard page templates

### 🎯 **Page-Specific**
**Cached when navigating to relevant pages**
- Specialized features (A-Frame VR, Monaco editor)
- Page-specific components and assets
- Feature-specific libraries and tools

### 😴 **Lazy**
**Cached only when requested by users**
- Old/deprecated files maintained for compatibility
- Test files and development tools
- Optional assets and non-essential resources
- Large Monaco editor language packs

## Usage

### Manual Updates

```bash
# Update cache manifest with current version
./generate-cache-manifest.sh "2025.01.15.3"

# Update version and detect new files
./gs.sh

# Deploy with auto-commit
./gs.sh -d
```

### Automated Updates (Recommended)

The GitHub Action automatically:
1. Detects changes to cacheable files
2. Generates new version numbers
3. Updates the cache manifest
4. Commits changes back to the repository

**Manual trigger**: Go to Actions → "Update Cache Manifest" → "Run workflow"

### File Categorization Rules

The system uses intelligent rules to categorize new files:

```bash
# Critical files
- index.html, main app pages
- CSS: bootstrap*, custom*, v3*
- JS: vue.esm*, v3-*, bootstrap*

# Important files  
- Common pages: create/, nfts/, user/, dex/, hub/, dao/
- JS: methods-*, nav*, session*, data*
- Core assets and frequently used components

# Page-specific files
- aframe*, monaco*, playground*, chat*
- Specialized libraries and tools

# Lazy files
- *-old.*, test*, spec*, debug*
- Monaco language packs
- Non-essential assets
```

### Adding New Files

1. **Automatic** (recommended): Just commit your changes. The GitHub Action will categorize and add them.

2. **Manual**: Run `./generate-cache-manifest.sh "version"` to scan and categorize new files.

3. **Custom**: Edit the manifest directly in `sw.js` for fine-grained control.

## Benefits

### Performance
- **Critical files** cached immediately for fast first load
- **Lazy files** only cached when needed, reducing bandwidth
- **Checksum validation** prevents stale cache issues

### Maintenance
- **Zero manual intervention** with GitHub Actions
- **Automatic version bumping** and manifest updates
- **Intelligent categorization** of new files

### Reliability
- **File integrity** checking with MD5 checksums
- **Graceful degradation** when cache misses occur
- **Smart cache invalidation** based on content changes

### Developer Experience
- **Clear priority system** for understanding cache behavior
- **Detailed logging** and error reporting
- **Easy debugging** with cache statistics

## Migration from Old System

The old system used hardcoded arrays in `sw.js`:
```javascript
// OLD - Hardcoded arrays (removed)
const criticalResources = ['/index.html', '/css/custom.css'];
const importantResources = ['/dao/index.html'];
const pageSpecificResources = {'/create': ['/create/index.html']};
const skippedResources = ['/old-file.js'];
```

The new system uses a dynamic manifest:
```javascript
// NEW - Dynamic manifest
self.cacheManifest = {
  "version": "2025.01.15.3",
  "generated": "2025-01-15T10:30:00Z",
  "files": {
    "/index.html": {
      "checksum": "abc123...",
      "size": 27470,
      "priority": "critical"
    }
  }
}
```

## Troubleshooting

### Common Issues

1. **Version mismatches**: Run `./generate-cache-manifest.sh` with the correct version
2. **Missing files**: Check that git tracks all cacheable files
3. **GitHub Action fails**: Ensure repository has write permissions for actions

### Cache Statistics

View current cache status:
```bash
# From gs.sh output
📊 Current cache manifest status:
   🚀 Critical: 5 files
   ⚡ Important: 267 files  
   🎯 Page-specific: 45 files
   😴 Lazy: 135 files
   📝 Total tracked: 452 files
```

### Debug Mode

Enable verbose logging in the service worker by checking browser DevTools → Application → Service Workers.

## Contributing

When adding new files:
1. Commit your changes normally
2. The GitHub Action will handle categorization automatically
3. Review the auto-generated PR for correctness
4. Manual adjustment available via `generate-cache-manifest.sh` if needed 