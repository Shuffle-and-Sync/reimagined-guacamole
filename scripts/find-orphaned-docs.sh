#!/bin/bash

# Find markdown files not referenced in any other markdown file
# These are "orphaned" files that users cannot discover

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=== Finding Orphaned Documentation Files ==="
echo ""

ORPHANED_COUNT=0
CHECKED_COUNT=0

# Find all markdown files in docs/ (excluding README.md files which are indexes)
for file in $(find docs -name "*.md" -not -name "README.md" -not -name "NAVIGATION.md"); do
    filename=$(basename "$file")
    CHECKED_COUNT=$((CHECKED_COUNT + 1))
    
    # Count references in all markdown files (excluding self-references)
    refs_in_docs=$(grep -r "$filename" docs/ --include="*.md" 2>/dev/null | grep -v "^$file:" | wc -l)
    refs_in_root=$(grep -r "$filename" *.md 2>/dev/null | wc -l)
    total_refs=$((refs_in_docs + refs_in_root))
    
    if [ $total_refs -eq 0 ]; then
        echo -e "${YELLOW}⚠${NC}  Orphaned: $file (no references found)"
        ORPHANED_COUNT=$((ORPHANED_COUNT + 1))
    fi
done

echo ""
echo "=== Summary ==="
echo "Files checked: $CHECKED_COUNT"
if [ $ORPHANED_COUNT -eq 0 ]; then
    echo -e "${GREEN}✓${NC} No orphaned files found - all documentation is properly referenced"
else
    echo -e "${YELLOW}Found $ORPHANED_COUNT orphaned file(s)${NC}"
    echo "These files should either be:"
    echo "  1. Added to docs/README.md index"
    echo "  2. Linked from related documentation"
    echo "  3. Moved to docs/archive/ if outdated"
fi
echo ""
