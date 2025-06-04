#!/bin/bash

# Cross-platform cache manifest generator with MD5 checksums
# Usage: ./generate-cache-manifest.sh [version]

echo "🔧 Generating cache manifest with checksums..."

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
MANIFEST_FILE="cache-manifest.json"
TEMP_SW="sw-temp.js"

echo "📋 Platform: $(uname -s), MD5 command: $MD5_CMD"

# Get version from argument or generate timestamp
if [ -n "$1" ]; then
    TIMESTAMP="$1"
    echo "🕐 Using provided version: $TIMESTAMP"
else
    TIMESTAMP=$(date +"%Y.%m.%d.%H")
    echo "🕐 Generated version: $TIMESTAMP"
fi

# Initialize manifest
cat > "$MANIFEST_FILE" << EOF
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

echo "📊 Extracted from service worker:"
echo "   🚀 Critical files: ${#CRITICAL_FILES[@]}"
echo "   ⚡ Important files: ${#IMPORTANT_FILES[@]}"
echo "   🎯 Page-specific files: ${#PAGE_SPECIFIC_FILES[@]}"

# Validate extraction
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
    IMPORTANT_FILES=()
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
        
        echo "    \"/$file\": {" >> "$MANIFEST_FILE"
        echo "      \"checksum\": \"$checksum\"," >> "$MANIFEST_FILE"
        echo "      \"size\": $size," >> "$MANIFEST_FILE"
        echo "      \"priority\": \"$priority\"" >> "$MANIFEST_FILE"
        echo "    }," >> "$MANIFEST_FILE"
        
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

# Remove trailing comma and close JSON
sed -i.bak '$ s/,$//' "$MANIFEST_FILE" && rm "${MANIFEST_FILE}.bak"
echo "  }" >> "$MANIFEST_FILE"
echo "}" >> "$MANIFEST_FILE"

echo "📦 Generated cache manifest: $MANIFEST_FILE"

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

cat "$MANIFEST_FILE" >> "$TEMP_SW"
echo ";" >> "$TEMP_SW"

# Replace original service worker
mv "$TEMP_SW" sw.js

echo "✅ Updated sw.js with version $TIMESTAMP and cache manifest"
echo "📊 Manifest contains $(grep -c '"checksum"' "$MANIFEST_FILE") files"

# Calculate total size
total_size=$(jq -r '.files | to_entries | map(.value.size) | add' "$MANIFEST_FILE" 2>/dev/null || echo "unknown")
if [ "$total_size" != "unknown" ] && [ "$total_size" -gt 0 ]; then
    total_mb=$(echo "scale=2; $total_size / 1024 / 1024" | bc 2>/dev/null || echo "$(($total_size / 1024 / 1024))")
    echo "📏 Total cache size: ${total_mb}MB"
fi

echo "🎉 Cache manifest generation complete!"
echo ""
echo "Next steps:"
echo "1. Commit the updated sw.js"
echo "2. Deploy to enable smart cache updates"
echo "3. Users will only download changed files on next visit" 