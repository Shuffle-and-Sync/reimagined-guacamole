#!/bin/bash

# Validate markdown files for common formatting issues
# This script checks for unpaired code blocks that would break Jekyll builds

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=== Markdown Validation ==="
echo ""

ERRORS=0

# Check for unpaired code blocks
echo "Checking for unpaired code blocks..."

find . -name "*.md" -not -path "./node_modules/*" -not -path "./.git/*" | while read -r file; do
    # Count code block markers
    count=$(grep -c '^```' "$file" || true)
    
    # Check if count is odd (unpaired) - only if count is greater than 0
    if [ "$count" -gt 0 ]; then
        remainder=$((count % 2))
        if [ "$remainder" -ne 0 ]; then
            echo -e "${RED}✗${NC} UNPAIRED CODE BLOCKS: $file (count: $count)"
            ERRORS=$((ERRORS + 1))
        fi
    fi
done

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓${NC} All markdown files have properly paired code blocks"
    echo ""
    echo "=== Validation Passed ==="
    exit 0
else
    echo ""
    echo -e "${RED}=== Validation Failed ===${NC}"
    echo -e "${RED}Found $ERRORS file(s) with formatting issues${NC}"
    exit 1
fi
