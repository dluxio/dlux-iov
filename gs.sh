#!/bin/bash

# Prompt for commit description
read -p "Commit description: " desc

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

        # Generate the new urlsToCache list from tracked files
        new_list=$(git ls-files -- '*.html' '*.css' '*.js' '*.png' '*.jpg' '*.svg' '*.m4v' | sed 's|^|  `/|' | sed 's|$|`,|')

        # Find the line numbers for the urlsToCache array boundaries
        N=$(grep -n "var urlsToCache = \[" "$file" | cut -d: -f1)
        if [ -z "$N" ]; then
            echo "Error: Could not find 'var urlsToCache = [' in $file"
            exit 1
        fi

        M=$(awk "NR>$N && /];/{print NR; exit}" "$file")
        if [ -z "$M" ]; then
            echo "Error: Could not find '];' after 'var urlsToCache = [' in $file"
            exit 1
        fi

        # Write the new list to a temporary file
        echo "$new_list" > new_list.txt

        # Replace the old urlsToCache list with the new one
        sed -i "$((N+1)),$((M-1))d; ${N}r new_list.txt" "$file"

        # Clean up the temporary file
        rm new_list.txt

        # Update version in all .html files
        find . -name "reg-sw.js" -exec sed -i "s/const version = '[0-9.]*'/const version = '$new_version'/" {} \;
    else
        echo "Invalid format in the first line of $file."
        exit 1
    fi
else
    echo "$file does not exist in the current directory."
    exit 1
fi

# Stage, commit, and push changes
git add . && \
git add -u && \
git commit -m "$desc" && \
git push
