#!/bin/bash

# Initialize DEPLOY flag as false
DEPLOY=false

# Parse command-line options
while getopts "d" opt; do
    case $opt in
        d) DEPLOY=true ;;
        *) echo "Invalid option: -$OPTARG" >&2; exit 1 ;;
    esac
done
shift $((OPTIND - 1))

# OS detection and cross-platform sed function
detect_os() {
    case "$(uname -s)" in
        Darwin*)
            echo "macos"
            ;;
        Linux*)
            echo "linux"
            ;;
        *)
            echo "unknown"
            ;;
    esac
}

# Cross-platform sed in-place editing
cross_platform_sed() {
    local pattern="$1"
    local file="$2"
    
    case "$(detect_os)" in
        macos)
            sed -i "" "$pattern" "$file"
            ;;
        linux)
            sed -i "$pattern" "$file"
            ;;
        *)
            echo "Warning: Unknown OS, trying Linux sed syntax"
            sed -i "$pattern" "$file"
            ;;
    esac
}

# Display detected OS for verification
detected_os=$(detect_os)
echo "🖥️  Detected OS: $detected_os"

# Pull the latest changes from the repository
git pull

# Define the target file
file="./sw.js"

if [ -f "$file" ]; then
    # Read the first line of sw.js
    first_line=$(head -n 1 "$file")
    echo "$first_line"

    # Get the current date in YYYY.MM.DD format
    current_day=$(date +%Y.%m.%d)

    # Regex to match the version string, e.g., this.version = "2025.02.13.15";
    version_regex='this.version = "([0-9]{4}\.[0-9]{2}\.[0-9]{2})\.([0-9]+)";'

    if [[ $first_line =~ $version_regex ]]; then
        # Extract version date and letter
        version_date="${BASH_REMATCH[1]}"
        version_letter="${BASH_REMATCH[2]}"

        # Determine new version
        if [[ $version_date == $current_day ]]; then
            new_version_letter=$((version_letter + 1))
            new_version="$current_day.$new_version_letter"
            cross_platform_sed "1 s/^.*$/this.version = \"$new_version\";/" "$file"
            echo "First line of $file incremented to: $new_version"
        else
            new_version="$current_day.1"
            cross_platform_sed "1 s/^.*$/this.version = \"$new_version\";/" "$file"
            echo "First line of $file updated to: $new_version"
        fi

        # Get all cacheable files from git
        echo "Analyzing cacheable files..."
        all_files=$(git ls-files -- '*.html' '*.css' '*.js' '*.png' '*.jpg' '*.svg' '*.ico' '*.woff' '*.woff2' '*.ttf' '*.eot' | \
                   grep -vE '(.*/test/.*|.*/tests/.*|node_modules/.*|\.git/.*)')

        # Extract current cached files from cacheManifest in sw.js
        echo "Extracting currently cached files from cache manifest..."
        
        # Extract files from the cacheManifest object
        cached_files=$(awk '/self\.cacheManifest = /,/^};?$/' "$file" | \
                      grep -E '^\s*"/' | \
                      sed 's/.*"\([^"]*\)".*/\1/' | \
                      sed 's|^/||' | \
                      sort | uniq)

        # Count files by priority
        critical_count=$(awk '/self\.cacheManifest = /,/^};?$/' "$file" | grep -A 3 '"priority": "critical"' | grep -c '"priority": "critical"')
        important_count=$(awk '/self\.cacheManifest = /,/^};?$/' "$file" | grep -A 3 '"priority": "important"' | grep -c '"priority": "important"')
        pagespecific_count=$(awk '/self\.cacheManifest = /,/^};?$/' "$file" | grep -A 3 '"priority": "page-specific"' | grep -c '"priority": "page-specific"')
        lazy_count=$(awk '/self\.cacheManifest = /,/^};?$/' "$file" | grep -A 3 '"priority": "lazy"' | grep -c '"priority": "lazy"')

        total_cached=$(echo "$cached_files" | grep -v '^$' | wc -l)

        echo "📊 Current cache manifest status:"
        echo "   🚀 Critical: $critical_count files"
        echo "   ⚡ Important: $important_count files"
        echo "   🎯 Page-specific: $pagespecific_count files"
        echo "   😴 Lazy: $lazy_count files"
        echo "   📝 Total tracked: $total_cached files"

        if [ "$total_cached" -lt 50 ]; then
            echo "⚠️  Warning: Expected more tracked files, only found $total_cached"
        else
            echo "✅ Cache manifest extraction looks good"
        fi

        new_files=()
        while IFS= read -r file_path; do
            if ! echo "$cached_files" | grep -q "^$file_path$"; then
                new_files+=("$file_path")
            fi
        done <<< "$all_files"

        if [ ${#new_files[@]} -gt 0 ]; then
            echo ""
            echo "🔍 Found ${#new_files[@]} new cacheable files not in cache manifest:"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            for new_file in "${new_files[@]}"; do echo "📄 $new_file"; done

            echo ""
            echo "❗ IMPORTANT: The cache manifest system has changed!"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "The service worker now uses a cache manifest instead of hardcoded arrays."
            echo "To add these files to the cache:"
            echo ""
            echo "1. 🛠️  Run: ./generate-cache-manifest.sh \"$new_version\""
            echo "   This will categorize and add the new files automatically"
            echo ""
            echo "2. 📝 Or manually edit the generated manifest if needed"
            echo ""
            echo "3. 🔧 For automated management, consider using GitHub Actions"
            echo ""
            echo "Categorization Guide:"
            echo "🚀 Critical - Essential for first paint (index.html, main CSS/JS)"
            echo "⚡ Important - Common functionality (navigation, auth, core features)"
            echo "🎯 Page-specific - Specialized features (aframe, monaco, playground)"
            echo "😴 Lazy - Non-essential files (old versions, tests, optional assets)"
            
            echo ""
            echo "✅ Version updated to $new_version"
            echo "ℹ️  Run ./generate-cache-manifest.sh \"$new_version\" to update cache manifest"
        else
            echo "✅ No new cacheable files found - cache manifest is up to date!"
            echo "ℹ️  To regenerate cache manifest: ./generate-cache-manifest.sh \"$new_version\""
        fi

        # Cross-platform compatible in-place editing
        echo "📝 Updating versions in related files..."
        
        # Update reg-sw.js files
        if find . -name "reg-sw.js" -type f | head -1 | grep -q .; then
            while IFS= read -r -d '' reg_file; do
                cross_platform_sed "s/const version = '[^']*'/const version = '$new_version'/" "$reg_file"
            done < <(find . -name "reg-sw.js" -type f -print0)
            echo "   ✅ Updated version in reg-sw.js files to $new_version"
        else
            echo "   ⚠️  No reg-sw.js files found"
        fi

        # Update sw-monitor.js
        sw_monitor_file="./js/sw-monitor.js"
        if [ -f "$sw_monitor_file" ]; then
            # Check if desiredVersion exists, if not add it
            if grep -q "desiredVersion:" "$sw_monitor_file"; then
                cross_platform_sed "s/desiredVersion: '[^']*'/desiredVersion: '$new_version'/" "$sw_monitor_file"
                echo "   ✅ Updated desiredVersion in sw-monitor.js to $new_version"
            else
                # Add desiredVersion after swVersion: null,
                cross_platform_sed "/swVersion: null,/a\\      desiredVersion: '$new_version'," "$sw_monitor_file"
                echo "   ✅ Added desiredVersion to sw-monitor.js: $new_version"
            fi
        else
            echo "   ⚠️  Warning: sw-monitor.js not found at $sw_monitor_file"
        fi

    else
        echo "Invalid format in the first line of $file."
        exit 1
    fi
else
    echo "$file does not exist in the current directory."
    current_day=$(date +%Y.%m.%d)
    new_version="$current_day"
fi

if [ "$DEPLOY" = true ]; then
    commit_message="Deploy $new_version"
else
    commit_message="$new_version"
fi

echo ""
echo "🚀 Committing and pushing changes..."
git add . && \
git add -u && \
git commit -m "$commit_message" && \
git push

echo "✅ Done! Version $new_version deployed."