#!/bin/sh
set -e

# Default to localhost backend if not specified
: ${BACKEND_URL:=http://localhost:8080}

echo "Configuring NGINX to proxy /api/ to: $BACKEND_URL"

# Validate BACKEND_URL is set properly
if [ "$BACKEND_URL" = "http://localhost:8080" ]; then
    echo "⚠️  WARNING: BACKEND_URL is using default value (http://localhost:8080)"
    echo "⚠️  This will NOT work in Cloud Run production deployment"
    echo "⚠️  Set BACKEND_URL environment variable to your actual backend service URL"
    echo "⚠️  Example: https://shuffle-sync-backend-123456789.us-central1.run.app"
fi

# Substitute environment variables in NGINX config
envsubst '$BACKEND_URL' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

echo "NGINX configuration:"
cat /etc/nginx/conf.d/default.conf

# Start NGINX
exec nginx -g "daemon off;"
