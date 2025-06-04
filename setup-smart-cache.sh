#!/bin/bash

# Smart Cache Setup Script
# Sets up checksum-based cache management for the DLUX PWA

echo "🚀 Setting up Smart Cache System..."

# Make scripts executable
echo "📋 Making scripts executable..."
chmod +x generate-cache-manifest.sh
chmod +x pre-commit-hook.sh

# Install git pre-commit hook
echo "🔗 Installing git pre-commit hook..."
if [ -d ".git/hooks" ]; then
    cp pre-commit-hook.sh .git/hooks/pre-commit
    chmod +x .git/hooks/pre-commit
    echo "✅ Git pre-commit hook installed"
else
    echo "⚠️  No .git directory found. Skipping git hook installation."
    echo "   You can manually copy pre-commit-hook.sh to .git/hooks/pre-commit later"
fi

# Generate initial cache manifest
echo "📦 Generating initial cache manifest..."
./generate-cache-manifest.sh

if [ $? -eq 0 ]; then
    echo "✅ Initial cache manifest generated successfully"
    
    # Show stats
    if [ -f "cache-manifest.json" ]; then
        echo ""
        echo "📊 Cache Manifest Stats:"
        
        # Count files by priority
        critical_count=$(grep -c '"priority": "critical"' cache-manifest.json)
        important_count=$(grep -c '"priority": "important"' cache-manifest.json)
        total_count=$((critical_count + important_count))
        
        echo "   Critical files: $critical_count"
        echo "   Important files: $important_count" 
        echo "   Total files: $total_count"
        
        # Calculate total size if jq is available
        if command -v jq >/dev/null 2>&1; then
            total_size=$(jq -r '.files | to_entries | map(.value.size) | add' cache-manifest.json 2>/dev/null)
            if [ "$total_size" != "null" ] && [ "$total_size" -gt 0 ]; then
                total_mb=$(echo "scale=2; $total_size / 1024 / 1024" | bc 2>/dev/null || echo "$(($total_size / 1024 / 1024))")
                echo "   Total cache size: ${total_mb}MB"
            fi
        fi
    fi
    
    echo ""
    echo "🎉 Smart Cache Setup Complete!"
    echo ""
    echo "How it works:"
    echo "1. Files are checksummed during build"
    echo "2. Service worker compares checksums before downloading"
    echo "3. Only changed files are downloaded on updates"
    echo "4. Unchanged files are transferred from old cache"
    echo ""
    echo "Benefits:"
    echo "✓ Faster updates (only download changed files)"
    echo "✓ Reduced bandwidth usage"
    echo "✓ Better user experience"
    echo "✓ Automatic git integration"
    echo ""
    echo "Next steps:"
    echo "1. Commit your changes: git add . && git commit -m 'Add smart cache system'"
    echo "2. Deploy to production"
    echo "3. Users will automatically get smart updates!"
    echo ""
    echo "To manually regenerate the cache manifest:"
    echo "  ./generate-cache-manifest.sh"
    
else
    echo "❌ Cache manifest generation failed"
    echo "Please check for errors and try again"
    exit 1
fi 