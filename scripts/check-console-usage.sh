#!/bin/bash

# Check for console.log usage in server code
# This script helps maintain security by ensuring structured logging is used

set -e

CONSOLE_USAGE=$(grep -r "console\." server/ --include="*.ts" --exclude-dir=node_modules --exclude-dir=tests | grep -v "test\|production-logger\|vite.ts" | wc -l)

echo "🔍 Checking for console.log usage in server code..."
echo ""

if [ "$CONSOLE_USAGE" -gt 0 ]; then
    echo "⚠️  Found $CONSOLE_USAGE instances of console usage:"
    echo ""
    grep -n "console\." server/ -r --include="*.ts" --exclude-dir=node_modules --exclude-dir=tests | grep -v "test\|production-logger\|vite.ts" | head -20
    echo ""
    echo "❌ Please replace console.log/console.error with structured logger:"
    echo "   import { logger } from './logger';"
    echo "   logger.info('message', { context });"
    echo ""
    exit 1
else
    echo "✅ No console.log usage found in server code"
    echo ""
    exit 0
fi
