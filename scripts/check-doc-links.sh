#!/bin/bash

# Check for broken internal links in markdown files
# This script finds markdown links to .md files and verifies the target exists

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=== Checking Documentation Links ==="
echo ""

BROKEN_COUNT=0
CHECKED_COUNT=0

# Find all markdown files
for file in $(find . -name "*.md" -not -path "*/node_modules/*" -not -path "*/.git/*"); do
    # Extract all markdown links from the file
    # Match patterns like [text](path.md) or [text](path/to/file.md)
    grep -oh '\[.*\]([^)]*\.md[^)]*)' "$file" 2>/dev/null | while read -r match; do
        # Extract the link path from [text](path)
        link=$(echo "$match" | sed -n 's/.*](\([^)]*\)).*/\1/p')
        
        # Skip external URLs
        if [[ "$link" =~ ^https?:// ]]; then
            continue
        fi
        
        # Skip anchors within the same file
        if [[ "$link" =~ ^# ]]; then
            continue
        fi
        
        CHECKED_COUNT=$((CHECKED_COUNT + 1))
        
        # Resolve relative path
        dir=$(dirname "$file")
        
        # Handle ../path links
        if [[ "$link" =~ ^\.\. ]]; then
            target="$dir/$link"
        # Handle ./path links
        elif [[ "$link" =~ ^\. ]]; then
            target="$dir/$link"
        # Handle /path links (relative to repo root)
        elif [[ "$link" =~ ^/ ]]; then
            target=".$link"
        # Handle path without prefix (relative to current dir)
        else
            target="$dir/$link"
        fi
        
        # Normalize the path (remove . and ..)
        target=$(realpath -m "$target" 2>/dev/null || echo "$target")
        
        # Check if target file exists
        if [ ! -f "$target" ]; then
            echo -e "${RED}✗${NC} Broken link in $file"
            echo -e "  Link: $link"
            echo -e "  Resolved to: $target"
            echo -e "  ${YELLOW}File not found${NC}"
            echo ""
            BROKEN_COUNT=$((BROKEN_COUNT + 1))
        fi
    done
done

echo "=== Summary ==="
echo "Links checked: $CHECKED_COUNT"
if [ $BROKEN_COUNT -eq 0 ]; then
    echo -e "${GREEN}✓${NC} No broken documentation links found"
else
    echo -e "${RED}Found $BROKEN_COUNT broken link(s)${NC}"
    echo "Please update these links to point to the correct file locations"
fi
echo ""
