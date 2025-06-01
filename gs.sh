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
            sed -i "1 s/^.*$/this.version = \"$new_version\";/" "$file"
            echo "First line of $file incremented to: $new_version"
        else
            new_version="$current_day.1"
            sed -i "1 s/^.*$/this.version = \"$new_version\";/" "$file"
            echo "First line of $file updated to: $new_version"
        fi

        # Get all cacheable files from git
        echo "Analyzing cacheable files..."
        all_files=$(git ls-files -- '*.html' '*.css' '*.js' '*.png' '*.jpg' '*.svg' '*.ico' '*.woff' '*.woff2' '*.ttf' '*.eot' | \
                   grep -vE '(.*/test/.*|.*/tests/.*|node_modules/.*|\.git/.*)')

        # Extract current cached files from sw.js
        echo "Extracting currently cached files from service worker..."
        
        # Get critical resources - improved regex
        critical_files=$(awk '/const criticalResources = \[/,/^\];$/' "$file" | grep -o '`/[^`]*`' | sed 's/`\///g' | sed 's/`//g')
        
        # Get important resources - improved regex
        important_files=$(awk '/const importantResources = \[/,/^\];$/' "$file" | grep -o '`/[^`]*`' | sed 's/`\///g' | sed 's/`//g')
        
        # Get page-specific resources - improved regex for nested structure
        pagespecific_files=$(awk '/const pageSpecificResources = \{/,/^\};$/' "$file" | grep -o '`/[^`]*`' | sed 's/`\///g' | sed 's/`//g')
        
        # Get skipped resources - improved regex
        skipped_files=$(awk '/const skippedResources = \[/,/^\];$/' "$file" | grep -o '`/[^`]*`' | sed 's/`\///g' | sed 's/`//g')
        
        # Combine all cached files and remove duplicates
        cached_files=$(echo -e "$critical_files\n$important_files\n$pagespecific_files\n$skipped_files" | sort | uniq | grep -v '^$')
        
        # Debug output to verify extraction
        total_cached=$(echo "$cached_files" | grep -v '^$' | wc -l)
        critical_count=$(echo "$critical_files" | grep -v '^$' | wc -l)
        important_count=$(echo "$important_files" | grep -v '^$' | wc -l)
        pagespecific_count=$(echo "$pagespecific_files" | grep -v '^$' | wc -l)
        skipped_count=$(echo "$skipped_files" | grep -v '^$' | wc -l)
        
        echo "📊 Current service worker cache status:"
        echo "   🚀 Critical: $critical_count files"
        echo "   ⚡ Important: $important_count files"
        echo "   🎯 Page-specific: $pagespecific_count files"
        echo "   ❌ Skipped: $skipped_count files"
        echo "   📝 Total tracked: $total_cached files"
        
        if [ "$total_cached" -lt 50 ]; then
            echo "⚠️  Warning: Expected more tracked files, only found $total_cached"
        else
            echo "✅ Cache extraction looks good"
        fi
        
        # Find new files not in any cache tier
        new_files=()
        while IFS= read -r file_path; do
            if ! echo "$cached_files" | grep -q "^$file_path$"; then
                new_files+=("$file_path")
            fi
        done <<< "$all_files"

        # Check for new files and prompt for categorization
        if [ ${#new_files[@]} -gt 0 ]; then
            echo ""
            echo "🔍 Found ${#new_files[@]} new cacheable files not in service worker:"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            
            for new_file in "${new_files[@]}"; do
                echo "📄 $new_file"
            done
            
            echo ""
            echo "Categorization Guide:"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "🚀 [C]ritical - Essential for first paint (index.html, core CSS/JS)"
            echo "⚡ [I]mportant - Common functionality (main pages, frequent JS modules)"
            echo "🎯 [P]age-specific - Specialized features (A-Frame, Monaco, etc.)"
            echo "❌ [S]kip - Non-essential or generated files"
            echo ""

            critical_additions=()
            important_additions=()
            page_additions=()
            skipped_additions=()

            for new_file in "${new_files[@]}"; do
                # Auto-suggest based on file patterns
                suggestion=""
                if [[ "$new_file" =~ ^(index\.html|about/index\.html)$ ]]; then
                    suggestion=" (suggested: Critical)"
                elif [[ "$new_file" =~ \.(css)$ ]] && [[ "$new_file" =~ (bootstrap|custom|v3) ]]; then
                    suggestion=" (suggested: Critical)"
                elif [[ "$new_file" =~ ^js/(v3-|vue\.esm|bootstrap\.bundle) ]]; then
                    suggestion=" (suggested: Critical)"
                elif [[ "$new_file" =~ ^(create|nfts|user|dlux|dex|hub|dao|blog)/index\.html$ ]]; then
                    suggestion=" (suggested: Important)"
                elif [[ "$new_file" =~ ^js/(v3-|methods-|nav|session|data) ]]; then
                    suggestion=" (suggested: Important)"
                elif [[ "$new_file" =~ (aframe|monaco|playground|chat) ]]; then
                    suggestion=" (suggested: Page-specific)"
                elif [[ "$new_file" =~ (test|spec|example|demo) ]]; then
                    suggestion=" (suggested: Skip)"
                fi

                while true; do
                    echo -n "📄 $new_file$suggestion - [C/I/P/S]: "
                    read -r choice
                    case $choice in
                        [Cc]* ) 
                            critical_additions+=("$new_file")
                            echo "   ✅ Added to Critical resources"
                            break;;
                        [Ii]* ) 
                            important_additions+=("$new_file")
                            echo "   ✅ Added to Important resources"
                            break;;
                        [Pp]* ) 
                            echo -n "   Which page group? [create/aframe/monaco/playground/chat/mint/other]: "
                            read -r page_group
                            page_additions+=("$page_group:$new_file")
                            echo "   ✅ Added to $page_group page-specific resources"
                            break;;
                        [Ss]* ) 
                            skipped_additions+=("$new_file")
                            echo "   ⏭️  Added to skipped list"
                            break;;
                        * ) echo "   ❌ Please choose C, I, P, or S.";;
                    esac
                done
            done

            # Update service worker with new categorizations
            if [ ${#critical_additions[@]} -gt 0 ] || [ ${#important_additions[@]} -gt 0 ] || [ ${#page_additions[@]} -gt 0 ] || [ ${#skipped_additions[@]} -gt 0 ]; then
                echo ""
                echo "📝 Updating service worker with new categorizations..."
                
                # Backup original file
                cp "$file" "${file}.backup"
                
                # Add critical resources
                for new_file in "${critical_additions[@]}"; do
                    # Insert before the closing bracket of criticalResources
                    sed -i "/const criticalResources = \[/,/\];/{
                        /\];/{
                            i\\  \`/$new_file\`,
                        }
                    }" "$file"
                    echo "   ✅ Added /$new_file to criticalResources"
                done
                
                # Add important resources
                for new_file in "${important_additions[@]}"; do
                    sed -i "/const importantResources = \[/,/\];/{
                        /\];/{
                            i\\  \`/$new_file\`,
                        }
                    }" "$file"
                    echo "   ✅ Added /$new_file to importantResources"
                done
                
                # Add page-specific resources
                for addition in "${page_additions[@]}"; do
                    page_group="${addition%%:*}"
                    new_file="${addition#*:}"
                    
                    # Insert into the appropriate page group
                    sed -i "/'\\/$page_group': \\[/,/\\]/{ 
                        /\\]/{
                            i\\    \`/$new_file\`,
                        }
                    }" "$file"
                    echo "   ✅ Added /$new_file to $page_group page-specific resources"
                done
                
                # Add skipped resources
                for new_file in "${skipped_additions[@]}"; do
                    sed -i "/const skippedResources = \[/,/\];/{
                        /\];/{
                            i\\  \`/$new_file\`,
                        }
                    }" "$file"
                    echo "   ✅ Added /$new_file to skippedResources"
                done
                
                echo ""
                echo "📊 Categorization Summary:"
                echo "   🚀 Critical: ${#critical_additions[@]} files"
                echo "   ⚡ Important: ${#important_additions[@]} files" 
                echo "   🎯 Page-specific: ${#page_additions[@]} files"
                echo "   ❌ Skipped: ${#skipped_additions[@]} files"
                echo ""
                echo "   🎉 Service worker updated successfully!"
                echo "   💾 Backup saved as ${file}.backup"
            fi
        else
            echo "✅ No new cacheable files found - service worker is up to date!"
        fi

        # Update version in reg-sw.js files
        find . -name "reg-sw.js" -exec sed -i "s/const version = '[0-9.]*'/const version = '$new_version'/" {} \;
        echo "📝 Updated version in reg-sw.js files"
        
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

# Stage, commit, and push changes
echo ""
echo "🚀 Committing and pushing changes..."
git add . && \
git add -u && \
git commit -m "$commit_message" && \
git push

echo "✅ Done! Version $new_version deployed."
