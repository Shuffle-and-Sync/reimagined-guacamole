#!/bin/sh
set -e

# Default to localhost backend if not specified
: ${BACKEND_URL:=http://localhost:8080}

echo "Configuring NGINX to proxy /api/ to: $BACKEND_URL"

# Substitute environment variables in NGINX config
envsubst '$BACKEND_URL' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

echo "NGINX configuration:"
cat /etc/nginx/conf.d/default.conf

# Start NGINX
exec nginx -g "daemon off;"
