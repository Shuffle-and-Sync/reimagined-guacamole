#!/bin/bash

# Find markdown files in the root directory that should be in /docs
# Excludes standard root-level files like README.md, SECURITY.md, etc.

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=== Checking for Misplaced Documentation Files ==="
echo ""

MISPLACED_COUNT=0

# Standard files that should remain in root
ALLOWED_ROOT_FILES=(
    "README.md"
    "DEPLOYMENT.md"
    "SECURITY.md"
    "CODE_OF_CONDUCT.md"
    "CONTRIBUTING.md"
    "replit.md"
    "LICENSE"
    "DOCUMENTATION_CLEANUP_COMPLETE.md"
)

# Find all markdown files in root directory
for file in $(find . -maxdepth 1 -name "*.md" -type f); do
    filename=$(basename "$file")
    
    # Check if file is in allowed list
    is_allowed=0
    for allowed in "${ALLOWED_ROOT_FILES[@]}"; do
        if [ "$filename" = "$allowed" ]; then
            is_allowed=1
            break
        fi
    done
    
    if [ $is_allowed -eq 0 ]; then
        echo -e "${YELLOW}⚠${NC}  Misplaced: $filename (should be in docs/)"
        MISPLACED_COUNT=$((MISPLACED_COUNT + 1))
    fi
done

echo ""
echo "=== Summary ==="
if [ $MISPLACED_COUNT -eq 0 ]; then
    echo -e "${GREEN}✓${NC} All documentation files are properly organized"
else
    echo -e "${YELLOW}Found $MISPLACED_COUNT misplaced file(s)${NC}"
    echo "These files should be moved to appropriate subdirectories in docs/"
fi
echo ""
