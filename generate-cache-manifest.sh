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

# Output files
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

# Define redirect files (without leading slash to match array format)
REDIRECT_FILES=(
    "packages/ffmpeg/package/dist/umd/ffmpeg-core.wasm"
    "packages/core/package/dist/umd/ffmpeg-core.js"
)

# Initialize array to track added files
ADDED_FILES=()

# Extract file arrays from existing cacheManifest in sw.js
echo "📋 Extracting file lists from service worker cache manifest..."

if grep -q "self.cacheManifest =" sw.js; then
    echo "   📝 Found existing cache manifest, extracting files..."
    
    CRITICAL_FILES=($(awk '/self\.cacheManifest = /,/^};?$/' sw.js | \
                     grep -A 3 '"priority": "critical"' | \
                     grep -B 3 '"priority": "critical"' | \
                     grep -o '"/[^"]*"' | \
                     sed 's/"//g' | sed 's|^/||'))
    
    IMPORTANT_FILES=($(awk '/self\.cacheManifest = /,/^};?$/' sw.js | \
                      grep -A 3 '"priority": "important"' | \
                      grep -B 3 '"priority": "important"' | \
                      grep -o '"/[^"]*"' | \
                      sed 's/"//g' | sed 's|^/||'))
    
    PAGE_SPECIFIC_FILES=($(awk '/self\.cacheManifest = /,/^};?$/' sw.js | \
                          grep -A 3 '"priority": "page-specific"' | \
                          grep -B 3 '"priority": "page-specific"' | \
                          grep -o '"/[^"]*"' | \
                          sed 's/"//g' | sed 's|^/||'))
    
    SKIPPED_FILES=($(awk '/self\.cacheManifest = /,/^};?$/' sw.js | \
                    grep -A 3 '"priority": "lazy"' | \
                    grep -B 3 '"priority": "lazy"' | \
                    grep -o '"/[^"]*"' | \
                    sed 's/"//g' | sed 's|^/||'))
else
    echo "   📝 No existing cache manifest found, will use fallback..."
    CRITICAL_FILES=()
    IMPORTANT_FILES=()
    PAGE_SPECIFIC_FILES=()
    SKIPPED_FILES=()
fi

echo "📊 Extracted from service worker:"
echo "   🚀 Critical files: ${#CRITICAL_FILES[@]}"
echo "   ⚡ Important files: ${#IMPORTANT_FILES[@]}"
echo "   🎯 Page-specific files: ${#PAGE_SPECIFIC_FILES[@]}"
echo "   🐌 Skipped files (will be lazy): ${#SKIPPED_FILES[@]}"

# Validate extraction and handle auto-categorization - prevent massive manifests
TOTAL_EXTRACTED=$((${#CRITICAL_FILES[@]} + ${#IMPORTANT_FILES[@]} + ${#PAGE_SPECIFIC_FILES[@]} + ${#SKIPPED_FILES[@]}))

if [ ${#CRITICAL_FILES[@]} -eq 0 ] && [ ${#IMPORTANT_FILES[@]} -eq 0 ]; then
    echo "❌ Error: No files extracted from service worker!"
    echo "   Using fallback file list..."
elif [ "$TOTAL_EXTRACTED" -gt 200 ]; then
    echo "⚠️  Warning: Extracted $TOTAL_EXTRACTED files - this may create an oversized service worker!"
    echo "   Service workers larger than ~50KB may fail to register."
    echo "   Resetting to essential files only..."
    
    CRITICAL_FILES=(
        "index.html"
        "css/custom.css"
        "js/vue.esm-browser.js"
        "js/v3-nav.js"
        "sw.js"
    )
    
    # Reset other arrays to keep manifest small
    IMPORTANT_FILES=()
    PAGE_SPECIFIC_FILES=()
    SKIPPED_FILES=()
    
    if [ "$AUTO_IMPORTANT" = true ]; then
        echo "🤖 Skipping auto-categorization due to service worker size limits..."
        
        ALL_FILES=($(git ls-files -- '*.html' '*.css' '*.js' '*.png' '*.jpg' '*.svg' '*.ico' '*.woff' '*.woff2' '*.ttf' '*.eot' | \
                    grep -vE '(.*/test/.*|.*/tests/.*|node_modules/.*|\.git/.*)'))
        
        for file in "${ALL_FILES[@]}"; do
            clean_file="${file#/}"
            
            if [[ " ${CRITICAL_FILES[@]} " =~ " ${clean_file} " ]]; then
                continue
            fi
            
            if [[ "$clean_file" =~ ^(index\.html|about/index\.html)$ ]] || \
               [[ "$clean_file" =~ \.(css)$ && "$clean_file" =~ (bootstrap|custom|v3) ]] || \
               [[ "$clean_file" =~ ^js/(vue\.esm|v3-nav|bootstrap\.bundle) ]]; then
                CRITICAL_FILES+=("$clean_file")
            elif [[ "$clean_file" =~ (aframe|monaco|playground|chat|naf-playground) ]]; then
                PAGE_SPECIFIC_FILES+=("$clean_file")
            elif [[ "$clean_file" =~ (-old\.|test|spec|debug|env_thumbs) ]] || \
                 [[ "$clean_file" =~ (monaco-editor/vs/basic-languages|monaco-editor/vs/nls\.messages) ]]; then
                SKIPPED_FILES+=("$clean_file")
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

# Function to add file with checksum or special redirect configuration
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
        
        ADDED_FILES+=("$file")
        echo "✅ /$file ($checksum)"
    else
        if [[ " ${REDIRECT_FILES[@]} " =~ " ${file} " ]]; then
            echo "    \"/$file\": {" >> "$TEMP_MANIFEST"
            echo "      \"checksum\": \"no-hash-symlink\"," >> "$TEMP_MANIFEST"
            echo "      \"size\": 0," >> "$TEMP_MANIFEST"
            echo "      \"priority\": \"lazy\"" >> "$TEMP_MANIFEST"
            echo "    }," >> "$TEMP_MANIFEST"
            
            ADDED_FILES+=("$file")
            echo "✅ Added redirect entry: /$file"
        else
            echo "⚠️  File not found: $file"
        fi
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

# Ensure redirect files are included if not already added
echo "📁 Ensuring redirect entries are included..."
for redirect_file in "${REDIRECT_FILES[@]}"; do
    if [[ ! " ${ADDED_FILES[@]} " =~ " ${redirect_file} " ]]; then
        echo "    \"/$redirect_file\": {" >> "$TEMP_MANIFEST"
        echo "      \"checksum\": \"no-hash-symlink\"," >> "$TEMP_MANIFEST"
        echo "      \"size\": 0," >> "$TEMP_MANIFEST"
        echo "      \"priority\": \"lazy\"" >> "$TEMP_MANIFEST"
        echo "    }," >> "$TEMP_MANIFEST"
        echo "✅ Added missing redirect entry: /$redirect_file"
    fi
done

# Remove trailing comma and close JSON
sed -i.bak '$ s/,$//' "$TEMP_MANIFEST" && rm "${TEMP_MANIFEST}.bak"
echo "  }" >> "$TEMP_MANIFEST"
echo "}" >> "$TEMP_MANIFEST"

echo "📦 Generated temporary cache manifest"

# Update the service worker with the new version and manifest
echo "🔄 Updating service worker..."

# Create a clean service worker without any existing cache manifest
if [ -f sw.js.backup ]; then
    echo "   📝 Using backup file..."
    cp sw.js.backup "$TEMP_SW"
elif grep -q "self.cacheManifest =" sw.js; then
    echo "   📝 Removing existing cache manifest..."
    # Remove ALL cache manifest blocks (improved pattern matching)
    awk '
        /\/\/ Cache manifest with checksums - auto-generated/ { in_manifest = 1; next }
        /^self\.cacheManifest = / { in_manifest = 1; next }
        /^self\.cacheManifest =/ { in_manifest = 1; next }
        in_manifest && /^};?$/ { in_manifest = 0; next }
        !in_manifest { print }
    ' sw.js > "$TEMP_SW"
else
    echo "   📝 No existing cache manifest found..."
    cp sw.js "$TEMP_SW"
fi

# Now insert the new cache manifest at the beginning (after initial setup)
# Create final service worker with cache manifest at the beginning
{
    # Find where to insert the cache manifest (after CACHE_NAME declaration)
    # Look for the line that defines CACHE_NAME
    cache_line=$(grep -n '^const CACHE_NAME = ' "$TEMP_SW" | head -1 | cut -d: -f1)
    
    if [ -z "$cache_line" ]; then
        echo "   ⚠️  Warning: Could not find CACHE_NAME line, using fallback position"
        cache_line=8
    fi
    
    # Copy lines up to and including CACHE_NAME
    head -n "$cache_line" "$TEMP_SW"
    
    # Add blank line and cache manifest
    echo ""
    echo "// Cache manifest with checksums - auto-generated"
    echo "self.cacheManifest = "
    cat "$TEMP_MANIFEST"
    echo ";"
    echo ""
    
    # Add the rest of the service worker
    tail -n +$((cache_line + 1)) "$TEMP_SW"
} > sw.js

rm -f "$TEMP_SW"

echo "✅ Updated sw.js with version $TIMESTAMP and cache manifest"
echo "📊 Manifest contains $(grep -c '"checksum"' "$TEMP_MANIFEST") files"

total_size=$(jq -r '.files | to_entries | map(.value.size) | add' "$TEMP_MANIFEST" 2>/dev/null || echo "unknown")
if [ "$total_size" != "unknown" ] && [ "$total_size" -gt 0 ]; then
    total_mb=$(echo "scale=2; $total_size / 1024 / 1024" | bc 2>/dev/null || echo "$(($total_size / 1024 / 1024))")
    echo "📏 Total cache size: ${total_mb}MB"
fi

rm -f "$TEMP_MANIFEST"

echo "🎉 Cache manifest integration complete!"
echo ""
echo "✅ All files now managed through self.cacheManifest in sw.js"
echo "✅ Duplicate file arrays can now be removed from sw.js"
echo "✅ No more separate cache-manifest.json file needed"