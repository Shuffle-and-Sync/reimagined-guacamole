#!/bin/sh
set -e

# Default to port 8080 if not specified (Cloud Run default)
: ${PORT:=8080}

# Default to localhost backend if not specified
: ${BACKEND_URL:=http://localhost:8080}

echo "Configuring NGINX to listen on port: $PORT"
echo "Configuring NGINX to proxy /api/ to: $BACKEND_URL"

# Validate PORT is a valid number
if ! [ "$PORT" -eq "$PORT" ] 2>/dev/null; then
    echo "❌ ERROR: PORT must be a valid number, got: $PORT"
    exit 1
fi

# Validate BACKEND_URL is set properly
if [ "$BACKEND_URL" = "http://localhost:8080" ]; then
    echo "⚠️  WARNING: BACKEND_URL is using default value (http://localhost:8080)"
    echo "⚠️  This will NOT work in Cloud Run production deployment"
    echo "⚠️  Set BACKEND_URL environment variable to your actual backend service URL"
    echo "⚠️  Example: https://shuffle-sync-backend-858080302197.us-central1.run.app"
fi

# Substitute environment variables in NGINX config
envsubst '$PORT $BACKEND_URL' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

echo "NGINX configuration:"
cat /etc/nginx/conf.d/default.conf

# Start NGINX
exec nginx -g "daemon off;"
