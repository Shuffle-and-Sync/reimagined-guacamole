# NGINX Reverse Proxy Configuration for Shuffle & Sync

This directory contains NGINX configuration files to enable reverse proxying for the Shuffle & Sync Express application.

## Files Overview

- `sites-available-default` - Drop-in replacement for `/etc/nginx/sites-available/default`
- `shuffle-and-sync.conf` - Standalone site configuration
- `complete-nginx.conf` - Complete NGINX configuration file
- `README.md` - This deployment guide

## Quick Setup

### 1. Install NGINX

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
# or
sudo dnf install nginx

# macOS (using Homebrew)
brew install nginx
```

### 2. Configure NGINX

Choose one of the following methods:

#### Method A: Replace Default Site Configuration

```bash
# Backup existing configuration
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup

# Copy our configuration
sudo cp sites-available-default /etc/nginx/sites-available/default

# Test configuration
sudo nginx -t

# Reload NGINX
sudo systemctl reload nginx
```

#### Method B: Create New Site Configuration

```bash
# Copy site configuration
sudo cp shuffle-and-sync.conf /etc/nginx/sites-available/shuffle-and-sync

# Enable the site
sudo ln -s /etc/nginx/sites-available/shuffle-and-sync /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo unlink /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload NGINX
sudo systemctl reload nginx
```

### 3. Start Services

```bash
# Start and enable NGINX
sudo systemctl start nginx
sudo systemctl enable nginx

# Start your Express application
# Development:
npm run dev

# Production:
npm run build
npm start
```

## Configuration Details

### Port Configuration

The NGINX configuration is set up to:
- Listen on **port 80** (HTTP)
- Listen on **port 443** (HTTPS)
- Forward requests to Express app on **port 5000** (development) or **PORT environment variable** (production)

### Express App Integration

The configuration is optimized for the Shuffle & Sync Express application:

1. **Proxy Headers**: Properly configured to work with `app.set('trust proxy', 1)` in the Express app
2. **Health Check**: Special handling for `/api/health` endpoint
3. **Auth.js Support**: Optimized routing for `/api/auth/*` OAuth flows
4. **WebSocket Support**: Real-time features (TableSync, messaging) fully supported
5. **Static Assets**: Proper caching headers for performance

### SSL/HTTPS Configuration

The HTTPS configuration includes:
- Modern SSL protocols (TLSv1.2, TLSv1.3)
- Secure cipher suites
- HSTS headers
- Security headers (XSS protection, content type options, etc.)

**Note**: Update SSL certificate paths in the configuration:
```nginx
ssl_certificate /path/to/your/certificate.crt;
ssl_certificate_key /path/to/your/private.key;
```

## SSL Certificate Setup

### Using Let's Encrypt (Recommended for Production)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal is handled by systemd timer
sudo systemctl status certbot.timer
```

### Using Self-Signed Certificates (Development Only)

```bash
# Generate self-signed certificate
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/nginx-selfsigned.key \
    -out /etc/ssl/certs/nginx-selfsigned.crt

# Update configuration to use these paths
```

## Verification

### 1. Check NGINX Status

```bash
# Check if NGINX is running
sudo systemctl status nginx

# Check which ports are being used
sudo netstat -tlnp | grep nginx
# Should show:
# tcp 0 0 0.0.0.0:80 0.0.0.0:* LISTEN xxxx/nginx
# tcp 0 0 0.0.0.0:443 0.0.0.0:* LISTEN xxxx/nginx
```

### 2. Test HTTP Requests

```bash
# Test HTTP (port 80)
curl -I http://localhost/api/health

# Test HTTPS (port 443) - if SSL is configured
curl -I https://localhost/api/health

# Expected response should include Express app health check data
```

### 3. Verify Proxy Headers

The Express app should receive these headers from NGINX:
- `X-Forwarded-For`: Client IP address
- `X-Forwarded-Proto`: `http` or `https`
- `X-Forwarded-Host`: Original host header
- `Host`: Your domain name

## Troubleshooting

### Common Issues

1. **502 Bad Gateway**
   - Check if Express app is running on the configured port
   - Verify upstream server address in NGINX config

2. **Permission Denied**
   - Check NGINX user permissions
   - Verify SELinux settings (CentOS/RHEL)

3. **SSL Certificate Errors**
   - Verify certificate paths
   - Check certificate validity with `openssl x509 -in cert.pem -text -noout`

### Logs

```bash
# NGINX error log
sudo tail -f /var/log/nginx/error.log

# NGINX access log
sudo tail -f /var/log/nginx/access.log

# Express app logs (if using PM2 or systemd)
journalctl -f -u your-app-service
```

## Performance Tuning

The configuration includes several performance optimizations:

1. **Connection Pooling**: `keepalive 32` in upstream
2. **Compression**: Gzip enabled for text assets
3. **Buffering**: Optimized proxy buffers
4. **Caching**: Static asset caching with proper headers

For high-traffic environments, consider:
- Increasing `worker_processes` and `worker_connections`
- Setting up load balancing with multiple Express instances
- Implementing NGINX caching with `proxy_cache`

## Security Features

The configuration includes multiple security measures:
- Security headers (HSTS, XSS protection, content type options)
- Modern SSL configuration
- Proper proxy header handling
- Access log exclusion for health checks

## Integration with Express App Features

This NGINX configuration is specifically designed for Shuffle & Sync features:

- **Authentication**: Auth.js OAuth flows properly handled
- **Real-time Features**: WebSocket support for TableSync and messaging
- **API Routes**: Optimized routing for REST API endpoints
- **Static Assets**: Efficient serving of frontend build files
- **Health Monitoring**: Dedicated health check endpoint handling

## Environment-Specific Notes

### Development
- Uses port 5000 for Express app
- HTTP-only configuration acceptable
- Self-signed certificates for HTTPS testing

### Production
- Uses PORT environment variable (typically 8080 for Cloud Run)
- HTTPS required with valid certificates
- Additional security headers enabled
- Performance optimizations active

## Monitoring

Consider setting up monitoring for:
- NGINX metrics (requests/sec, response times)
- Upstream health (Express app availability)
- SSL certificate expiration
- Error rates and response codes

Use tools like:
- NGINX Amplify
- Prometheus + Grafana
- ELK Stack for log analysis