#!/bin/bash

# Generate statistics about documentation in the repository

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Documentation Statistics ===${NC}"
echo ""

# Count total markdown files
total_md=$(find . -name "*.md" -not -path "*/node_modules/*" -not -path "*/.git/*" | wc -l)
echo -e "${CYAN}Total markdown files:${NC} $total_md"

# Count files in docs directory
docs_md=$(find docs -name "*.md" 2>/dev/null | wc -l || echo "0")
echo -e "${CYAN}Files in /docs:${NC} $docs_md"

# Count files in root
root_md=$(find . -maxdepth 1 -name "*.md" | wc -l)
echo -e "${CYAN}Files in root:${NC} $root_md"

echo ""
echo -e "${BLUE}By category:${NC}"

# Count by subdirectory in docs
if [ -d "docs" ]; then
    for dir in docs/*/; do
        if [ -d "$dir" ]; then
            count=$(find "$dir" -name "*.md" 2>/dev/null | wc -l || echo "0")
            dirname=$(basename "$dir")
            printf "  ${CYAN}%-25s${NC} %d files\n" "$dirname:" "$count"
        fi
    done
fi

echo ""

# Count total lines of documentation
total_lines=$(find docs -name "*.md" -exec wc -l {} + 2>/dev/null | tail -1 | awk '{print $1}' || echo "0")
echo -e "${CYAN}Lines of documentation:${NC} $total_lines"

# Average file size
if [ $docs_md -gt 0 ]; then
    avg_lines=$((total_lines / docs_md))
    echo -e "${CYAN}Average lines per file:${NC} $avg_lines"
fi

echo ""
echo -e "${GREEN}=== Statistics Complete ===${NC}"
