#!/bin/bash

echo "🔧 Rebuilding TipTap v3 Collaboration Bundle..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "⚠️  node_modules not found. Installing dependencies..."
    npm install
fi

# Check if the old package is installed and needs updating
if npm list @tiptap/extension-collaboration-cursor &>/dev/null; then
    echo "📦 Updating from collaboration-cursor to collaboration-caret..."
    npm uninstall @tiptap/extension-collaboration-cursor
    npm install @tiptap/extension-collaboration-caret@^3.0.0
fi

# Install any missing v3 packages
echo "📦 Checking for missing packages..."
npm install @tiptap/extension-history@^3.0.0 @tiptap/extension-link@^3.0.0 @tiptap/extension-image@^3.0.0 @tiptap/extension-code-block@^3.0.0 --save

# Clean old bundle
echo "🧹 Cleaning old bundle..."
rm -f js/tiptap-collaboration.bundle.js

# Build the bundle
echo "🏗️  Building bundle..."
npm run build

# Check if build was successful
if [ -f "js/tiptap-collaboration.bundle.js" ]; then
    echo "✅ Bundle rebuilt successfully!"
    echo "📦 Bundle location: js/tiptap-collaboration.bundle.js"
    
    # Show bundle size
    size=$(ls -lh js/tiptap-collaboration.bundle.js | awk '{print $5}')
    echo "📏 Bundle size: $size"
else
    echo "❌ Build failed! Check the error messages above."
    exit 1
fi

echo ""
echo "🎉 Done! The TipTap v3 bundle has been rebuilt with CollaborationCaret support."