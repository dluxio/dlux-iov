#!/bin/bash

# Prompt for commit description
read -p "Commit description: " desc

# Pull the latest changes from the repository
git pull

# Define the target files
sw_file="./sw.js"
reg_sw_file="./reg-sw.js"

if [ -f "$sw_file" ]; then
    # Read the first line of sw.js
    first_line=$(head -n 1 "$sw_file")
    echo "$first_line"

    # Get the current date in YYYY.MM.DD format
    current_day=$(date +%Y.%m.%d)

    # Regex to match the version string, e.g., this.version = "2025.02.13.15";
    version_regex='this.version = "([0-9]{4}\.[0-9]{2}\.[0-9]{2})\.([0-9]+)";'

    if [[ $first_line =~ $version_regex ]]; then
        # Extract version date and number
        version_date="${BASH_REMATCH[1]}"
        version_number="${BASH_REMATCH[2]}"

        # Determine new version
        if [[ $version_date == $current_day ]]; then
            new_version_number=$((version_number + 1))
            new_version="$current_day.$new_version_number"
        else
            new_version="$current_day.1"
        fi

        # Update sw.js first line using a temp file
        temp_file=$(mktemp)
        echo "this.version = \"$new_version\";" > "$temp_file"
        tail -n +2 "$sw_file" >> "$temp_file"
        mv "$temp_file" "$sw_file"
        echo "First line of $sw_file updated to: $new_version"

        # Generate the new urlsToCache list from tracked files
        new_list=$(git ls-files -- '*.html' '*.css' '*.js' '*.png' '*.jpg' '*.svg' '*.m4v' | sed 's|^|  `/|' | sed 's|$|`,|')

        # Find the line numbers for the urlsToCache array boundaries
        N=$(grep -n "var urlsToCache = \[" "$sw_file" | cut -d: -f1)
        if [ -z "$N" ]; then
            echo "Error: Could not find 'var urlsToCache = [' in $sw_file"
            exit 1
        fi

        M=$(awk "NR>$N && /];/{print NR; exit}" "$sw_file")
        if [ -z "$M" ]; then
            echo "Error: Could not find '];' after 'var urlsToCache = [' in $sw_file"
            exit 1
        fi

        # Update urlsToCache using a temp file
        temp_file=$(mktemp)
        head -n "$N" "$sw_file" > "$temp_file"
        echo "$new_list" >> "$temp_file"
        tail -n "+$M" "$sw_file" >> "$temp_file"
        mv "$temp_file" "$sw_file"
        echo "Updated urlsToCache in $sw_file"

        # Update version in reg-sw.js using a temp file
        if [ -f "$reg_sw_file" ]; then
            temp_file=$(mktemp)
            sed "s/const version = '[0-9.]*'/const version = '$new_version'/" "$reg_sw_file" > "$temp_file"
            mv "$temp_file" "$reg_sw_file"
            echo "Updated $reg_sw_file version:"
            grep "const version" "$reg_sw_file"
        else
            echo "Warning: $reg_sw_file not found, skipping version update"
        fi

        # Debug: Verify changes
        echo "Updated $sw_file first line:"
        head -n 1 "$sw_file"
    else
        echo "Invalid format in the first line of $sw_file."
        exit 1
    fi
else
    echo "$sw_file does not exist in the current directory."
    exit 1
fi

# Stage, commit, and push changes
git add . && \
git add -u && \
git commit -m "$desc" && \
git push
