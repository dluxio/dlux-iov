#!/bin/bash

# Git pre-commit hook to automatically generate cache manifest
# Place this in .git/hooks/pre-commit and make it executable

echo "🔍 Checking for cached file changes..."

# Check if any cached files have been modified
CACHED_FILES_CHANGED=false

# Define patterns for files that should trigger cache manifest regeneration
CACHE_FILE_PATTERNS=(
    "*.html"
    "*.css" 
    "*.js"
    "img/*"
    "css/*"
    "js/*"
)

# Check if any cached files are in the commit
for pattern in "${CACHE_FILE_PATTERNS[@]}"; do
    if git diff --cached --name-only | grep -E "$pattern" >/dev/null 2>&1; then
        CACHED_FILES_CHANGED=true
        break
    fi
done

if [ "$CACHED_FILES_CHANGED" = true ]; then
    echo "📦 Cached files changed, regenerating cache manifest..."
    
    # Check if generate script exists
    if [ ! -f "generate-cache-manifest.sh" ]; then
        echo "⚠️  generate-cache-manifest.sh not found, skipping cache manifest generation"
        exit 0
    fi
    
    # Make sure the script is executable
    chmod +x generate-cache-manifest.sh
    
    # Run the cache manifest generator
    ./generate-cache-manifest.sh
    
    # Check if generation was successful
    if [ $? -eq 0 ]; then
        echo "✅ Cache manifest updated successfully"
        
        # Add the updated sw.js to the commit
        if [ -f "sw.js" ]; then
            git add sw.js
            echo "➕ Added updated sw.js to commit"
        fi
        
        # Add the cache manifest if it exists
        if [ -f "cache-manifest.json" ]; then
            git add cache-manifest.json
            echo "➕ Added cache-manifest.json to commit"
        fi
        
        echo "🎉 Smart cache update ready for commit!"
    else
        echo "❌ Cache manifest generation failed"
        echo "Commit aborted. Please fix the cache manifest generator and try again."
        exit 1
    fi
else
    echo "ℹ️  No cached files changed, skipping cache manifest generation"
fi

exit 0 