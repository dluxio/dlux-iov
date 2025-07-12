#!/bin/bash

# Pull the latest changes from the repository
git pull

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

# Define the target file
file="./sw.js"

if [ -f "$file" ]; then
    # Find the line with version declaration
    version_line=$(grep -n '^this\.version = ' "$file" | head -1)
    
    if [ -z "$version_line" ]; then
        echo "Error: Could not find version line in $file"
        exit 1
    fi
    
    # Extract line number and content
    line_number=$(echo "$version_line" | cut -d: -f1)
    line_content=$(echo "$version_line" | cut -d: -f2-)
    echo "Found version at line $line_number: $line_content"

    # Get the current date in YYYY.MM.DD format
    current_day=$(date +%Y.%m.%d)

    # Regex to match the version string, e.g., this.version = "2025.02.13.15";
    version_regex='this.version = "([0-9]{4}\.[0-9]{2}\.[0-9]{2})\.([0-9]+)";'

    if [[ $line_content =~ $version_regex ]]; then
        # Extract version date and letter
        version_date="${BASH_REMATCH[1]}"
        version_letter="${BASH_REMATCH[2]}"

        # Determine new version
        if [[ $version_date == $current_day ]]; then
            new_version_letter=$((version_letter + 1))
            new_version="$current_day.$new_version_letter"
        else
            new_version="$current_day.1"
        fi

        # Update the version in sw.js (same as gs.sh)
        sed -i "${line_number}s/^.*$/this.version = \"$new_version\";/" "$file"
        echo "Line $line_number of $file updated to: $new_version"
    fi
fi


if [ "$DEPLOY" = true ]; then
    commit_message="PreDeploy $new_version"
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