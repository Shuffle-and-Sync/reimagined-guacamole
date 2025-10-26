#!/bin/bash
# Bundle Size Monitor
# This script checks bundle sizes and alerts if they exceed thresholds

set -e

DIST_DIR="dist/public/assets/js"
MAX_CHUNK_SIZE_KB=100  # Maximum size for any route chunk (KB)
MAX_VENDOR_SIZE_KB=200 # Maximum size for vendor chunks (KB)

echo "📦 Bundle Size Analysis"
echo "======================"
echo ""

if [ ! -d "$DIST_DIR" ]; then
    echo "❌ Error: Build output not found. Please run 'npm run build' first."
    exit 1
fi

echo "Route Chunks (Lazy Loaded):"
echo "----------------------------"

# Find all route chunks (excluding vendor chunks)
route_chunks=$(find "$DIST_DIR" -name "*.js" ! -name "*vendor*" ! -name "index-*.js" -exec du -k {} \; | sort -rn)

violations=0

while IFS= read -r line; do
    size=$(echo "$line" | awk '{print $1}')
    file=$(echo "$line" | awk '{print $2}')
    filename=$(basename "$file")
    
    # Skip very small chunks (utilities, etc.)
    if [ "$size" -lt 5 ]; then
        continue
    fi
    
    # Check if route chunk exceeds threshold
    if [ "$size" -gt "$MAX_CHUNK_SIZE_KB" ]; then
        echo "⚠️  ${filename}: ${size}KB (exceeds ${MAX_CHUNK_SIZE_KB}KB threshold)"
        violations=$((violations + 1))
    else
        echo "✓ ${filename}: ${size}KB"
    fi
done <<< "$route_chunks"

echo ""
echo "Vendor Chunks:"
echo "-------------"

# Check vendor chunks
vendor_chunks=$(find "$DIST_DIR" -name "*vendor*.js" -exec du -k {} \; | sort -rn)

while IFS= read -r line; do
    size=$(echo "$line" | awk '{print $1}')
    file=$(echo "$line" | awk '{print $2}')
    filename=$(basename "$file")
    
    if [ "$size" -gt "$MAX_VENDOR_SIZE_KB" ]; then
        echo "⚠️  ${filename}: ${size}KB (exceeds ${MAX_VENDOR_SIZE_KB}KB threshold)"
        violations=$((violations + 1))
    else
        echo "✓ ${filename}: ${size}KB"
    fi
done <<< "$vendor_chunks"

echo ""
echo "Total Bundle Size:"
echo "-----------------"
total_size=$(du -sh "$DIST_DIR" | awk '{print $1}')
echo "Total: $total_size"

echo ""
echo "Summary:"
echo "--------"
if [ "$violations" -gt 0 ]; then
    echo "❌ $violations chunk(s) exceed size thresholds"
    echo "Consider further code splitting or optimization"
    exit 1
else
    echo "✅ All chunks are within acceptable size limits"
    echo "✅ Lazy loading is working effectively"
fi
