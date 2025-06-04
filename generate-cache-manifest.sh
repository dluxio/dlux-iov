#!/bin/bash

# Cross-platform cache manifest generator with MD5 checksums
# Usage: ./generate-cache-manifest.sh [version] [--auto-important]

# Parse arguments
VERSION="$1"
AUTO_IMPORTANT=false

if [[ "$2" == "--auto-important" ]] || [[ "$3" == "--auto-important" ]]; then
    AUTO_IMPORTANT=true
fi

if [ "$AUTO_IMPORTANT" = true ]; then
    echo "🤖 Generating cache manifest with auto-categorization (new files as important)..."
else
    echo "🔧 Generating cache manifest with checksums..."
fi

# Detect platform for MD5 command
if command -v md5sum >/dev/null 2>&1; then
    # Linux
    MD5_CMD="md5sum"
    MD5_EXTRACT="cut -d' ' -f1"
elif command -v md5 >/dev/null 2>&1; then
    # macOS
    MD5_CMD="md5 -r"
    MD5_EXTRACT="cut -d' ' -f1"
else
    echo "❌ Error: Neither md5sum nor md5 command found"
    exit 1
fi

# Output files (no longer need separate cache-manifest.json)
TEMP_SW="sw-temp.js"
TEMP_MANIFEST="temp-manifest.json"

echo "📋 Platform: $(uname -s), MD5 command: $MD5_CMD"

# Get version from argument or generate timestamp
if [ -n "$VERSION" ]; then
    TIMESTAMP="$VERSION"
    echo "🕐 Using provided version: $TIMESTAMP"
else
    TIMESTAMP=$(date +"%Y.%m.%d.%H")
    echo "🕐 Generated version: $TIMESTAMP"
fi

# Initialize manifest
cat > "$TEMP_MANIFEST" << EOF
{
  "version": "$TIMESTAMP",
  "generated": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "files": {
EOF

# Extract file arrays dynamically from sw.js
echo "📋 Extracting file lists from service worker..."

# Extract critical files
CRITICAL_FILES=($(awk '/const criticalResources = \[/,/^\];$/' sw.js | grep -o '`/[^`]*`' | sed 's/`\///g' | sed 's/`//g'))

# Extract important files  
IMPORTANT_FILES=($(awk '/const importantResources = \[/,/^\];$/' sw.js | grep -o '`/[^`]*`' | sed 's/`\///g' | sed 's/`//g'))

# Extract page-specific files
PAGE_SPECIFIC_FILES=($(awk '/const pageSpecificResources = \{/,/^\};$/' sw.js | grep -o '`/[^`]*`' | sed 's/`\///g' | sed 's/`//g'))

# Extract skipped files
SKIPPED_FILES=($(awk '/const skippedResources = \[/,/^\];$/' sw.js | grep -o '`/[^`]*`' | sed 's/`\///g' | sed 's/`//g'))

echo "📊 Extracted from service worker:"
echo "   🚀 Critical files: ${#CRITICAL_FILES[@]}"
echo "   ⚡ Important files: ${#IMPORTANT_FILES[@]}"
echo "   🎯 Page-specific files: ${#PAGE_SPECIFIC_FILES[@]}"
echo "   🐌 Skipped files (will be lazy): ${#SKIPPED_FILES[@]}"

# Validate extraction and handle auto-categorization
if [ ${#CRITICAL_FILES[@]} -eq 0 ] && [ ${#IMPORTANT_FILES[@]} -eq 0 ]; then
    echo "❌ Error: No files extracted from service worker!"
    echo "   Using fallback file list..."
    
    # Fallback to basic critical files
    CRITICAL_FILES=(
        "index.html"
        "css/custom.css"
        "js/vue.esm-browser.js"
        "js/v3-nav.js"
        "sw.js"
    )
    
    # If auto-important mode, find all cacheable files and categorize them
    if [ "$AUTO_IMPORTANT" = true ]; then
        echo "🤖 Auto-categorizing all cacheable files for GitHub Actions..."
        
        # Get all cacheable files from git (same logic as gs.sh)
        ALL_FILES=($(git ls-files -- '*.html' '*.css' '*.js' '*.png' '*.jpg' '*.svg' '*.ico' '*.woff' '*.woff2' '*.ttf' '*.eot' | \
                    grep -vE '(.*/test/.*|.*/tests/.*|node_modules/.*|\.git/.*)'))
        
        # Auto-categorize based on patterns
        for file in "${ALL_FILES[@]}"; do
            # Remove leading slash if present
            clean_file="${file#/}"
            
            # Skip if already in critical
            if [[ " ${CRITICAL_FILES[@]} " =~ " ${clean_file} " ]]; then
                continue
            fi
            
            # Critical patterns (override fallback)
            if [[ "$clean_file" =~ ^(index\.html|about/index\.html)$ ]] || \
               [[ "$clean_file" =~ \.(css)$ && "$clean_file" =~ (bootstrap|custom|v3) ]] || \
               [[ "$clean_file" =~ ^js/(vue\.esm|v3-nav|bootstrap\.bundle) ]]; then
                CRITICAL_FILES+=("$clean_file")
            # Page-specific patterns
            elif [[ "$clean_file" =~ (aframe|monaco|playground|chat|naf-playground) ]]; then
                PAGE_SPECIFIC_FILES+=("$clean_file")
            # Lazy patterns (old files, tests, etc.)
            elif [[ "$clean_file" =~ (-old\.|test|spec|debug|env_thumbs) ]] || \
                 [[ "$clean_file" =~ (monaco-editor/vs/basic-languages|monaco-editor/vs/nls\.messages) ]]; then
                SKIPPED_FILES+=("$clean_file")
            # Everything else becomes important (safe default for PRs)
            else
                IMPORTANT_FILES+=("$clean_file")
            fi
        done
        
        echo "🤖 Auto-categorization complete:"
        echo "   🚀 Critical: ${#CRITICAL_FILES[@]} files"
        echo "   ⚡ Important: ${#IMPORTANT_FILES[@]} files"
        echo "   🎯 Page-specific: ${#PAGE_SPECIFIC_FILES[@]} files"
        echo "   😴 Lazy: ${#SKIPPED_FILES[@]} files"
    else
        IMPORTANT_FILES=()
        SKIPPED_FILES=()
    fi
fi

# Function to add file with checksum
add_file_checksum() {
    local file="$1"
    local priority="$2"
    
    # Remove leading slash if present
    file="${file#/}"
    
    if [ -f "$file" ]; then
        local checksum=$(eval "$MD5_CMD \"$file\" | $MD5_EXTRACT")
        local size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo "0")
        
        echo "    \"/$file\": {" >> "$TEMP_MANIFEST"
        echo "      \"checksum\": \"$checksum\"," >> "$TEMP_MANIFEST"
        echo "      \"size\": $size," >> "$TEMP_MANIFEST"
        echo "      \"priority\": \"$priority\"" >> "$TEMP_MANIFEST"
        echo "    }," >> "$TEMP_MANIFEST"
        
        echo "✅ /$file ($checksum)"
    else
        echo "⚠️  File not found: $file"
    fi
}

echo "📁 Processing critical files..."
for file in "${CRITICAL_FILES[@]}"; do
    add_file_checksum "$file" "critical"
done

echo "📁 Processing important files..."
for file in "${IMPORTANT_FILES[@]}"; do
    add_file_checksum "$file" "important"
done

echo "📁 Processing page-specific files..."
for file in "${PAGE_SPECIFIC_FILES[@]}"; do
    add_file_checksum "$file" "page-specific"
done

echo "📁 Processing skipped files (as lazy)..."
for file in "${SKIPPED_FILES[@]}"; do
    add_file_checksum "$file" "lazy"
done

# Remove trailing comma and close JSON
sed -i.bak '$ s/,$//' "$TEMP_MANIFEST" && rm "${TEMP_MANIFEST}.bak"
echo "  }" >> "$TEMP_MANIFEST"
echo "}" >> "$TEMP_MANIFEST"

echo "📦 Generated temporary cache manifest"

# Now update the service worker with the new version and manifest
echo "🔄 Updating service worker..."

# Check if cache manifest already exists in sw.js
if grep -q "self.cacheManifest =" sw.js; then
    echo "   📝 Replacing existing cache manifest..."
    # Remove existing cache manifest (from "// Cache manifest" to the end of file)
    sed '/\/\/ Cache manifest with checksums - auto-generated/,$d' sw.js > "$TEMP_SW"
else
    echo "   📝 Adding new cache manifest..."
    # Copy sw.js without changing version (it's already updated by gs.sh)
    cp sw.js "$TEMP_SW"
fi

# Add cache manifest data to service worker
cat >> "$TEMP_SW" << 'EOF'
// Cache manifest with checksums - auto-generated
self.cacheManifest = 
EOF

cat "$TEMP_MANIFEST" >> "$TEMP_SW"
echo ";" >> "$TEMP_SW"

# Replace original service worker
mv "$TEMP_SW" sw.js

echo "✅ Updated sw.js with version $TIMESTAMP and cache manifest"
echo "📊 Manifest contains $(grep -c '"checksum"' "$TEMP_MANIFEST") files"

# Calculate total size
total_size=$(jq -r '.files | to_entries | map(.value.size) | add' "$TEMP_MANIFEST" 2>/dev/null || echo "unknown")
if [ "$total_size" != "unknown" ] && [ "$total_size" -gt 0 ]; then
    total_mb=$(echo "scale=2; $total_size / 1024 / 1024" | bc 2>/dev/null || echo "$(($total_size / 1024 / 1024))")
    echo "📏 Total cache size: ${total_mb}MB"
fi

# Clean up temporary manifest file
rm -f "$TEMP_MANIFEST"

echo "🎉 Cache manifest integration complete!"
echo ""
echo "✅ All files now managed through self.cacheManifest in sw.js"
echo "✅ Duplicate file arrays can now be removed from sw.js"
echo "✅ No more separate cache-manifest.json file needed"