# Cloud Run Deployment Guide

This guide addresses the deployment configuration fixes for Cloud Run compatibility and provides comprehensive production deployment instructions.

## 🚀 Quick Start for Production Deployment

### Prerequisites
1. **Follow the complete [Production Deployment Checklist](./PRODUCTION_DEPLOYMENT_CHECKLIST.md)**
2. **Configure environment variables using [.env.production.template](./.env.production.template)**
3. **Set up Google Cloud Project with required APIs enabled**

### One-Command Deployment
```bash
# Set your project details
export PROJECT_ID="your-gcp-project-id"
export REGION="us-central1"

# Deploy everything
npm run deploy:production
```

### Individual Service Deployment
```bash
# Deploy backend only
npm run deploy:backend

# Deploy frontend only  
npm run deploy:frontend

# Migrate database
npm run db:migrate:production

# Verify deployment
npm run verify:production
```

## 📋 New Production Features

### Docker Containers
- **Backend**: `Dockerfile` - Node.js production container
- **Frontend**: `Dockerfile.frontend` - NGINX-based static serving
- **Local Testing**: `docker-compose.production-test.yml` - Full production simulation

### Deployment Automation
- **Cloud Build**: `cloudbuild.yaml` and `cloudbuild-frontend.yaml` 
- **Deploy Script**: `scripts/deploy-production.sh` - Automated deployment
- **Migration Script**: `scripts/migrate-production-db.sh` - Safe database updates
- **Verification Script**: `scripts/verify-production.sh` - Post-deployment testing

### Monitoring & Observability
- **Alerting**: `monitoring/alerting-policy.yaml` - Production alerts
- **Dashboard**: `monitoring/dashboard-config.json` - Monitoring dashboard
- **Health Checks**: Enhanced `/api/health` endpoint with full system status

## Fixed Issues

### ✅ 1. Port Configuration
- **Issue**: Server was listening on port 5000 but Cloud Run expects traffic on the PORT environment variable
- **Fix**: Updated server to require PORT in production, default to 5000 only in development
- **Location**: `server/index.ts` lines 457-462

### ✅ 2. Environment Variable Validation
- **Issue**: Missing required environment variable configuration
- **Fix**: Added comprehensive environment validation system
- **Location**: `server/env-validation.ts`

### ✅ 3. Health Check Configuration
- **Issue**: Basic health check without deployment status
- **Fix**: Enhanced health check with environment status and uptime tracking
- **Location**: `server/index.ts` health endpoint

### ✅ 4. Startup Optimization
- **Issue**: Slow startup causing initialization timeouts
- **Fix**: Added startup timing, parallel initialization, and graceful shutdown
- **Location**: `server/startup-optimization.ts`

## Required Environment Variables

### Critical (Production)
- `DATABASE_URL` - PostgreSQL connection string
- `AUTH_SECRET` - Authentication secret key
- `AUTH_URL` - Application base URL for auth callbacks

### Recommended
- `SENDGRID_API_KEY` - For email functionality
- `STREAM_KEY_ENCRYPTION_KEY` - 32-character encryption key

### Platform-Managed
- `PORT` - Set automatically by Cloud Run (typically 8080)
- `NODE_ENV` - Should be set to "production"

## Deployment Configuration

### Build Optimization
The application includes:
- Code splitting for vendor libraries
- Minification and tree shaking
- Optimized dependencies

### Health Check Endpoint
- **URL**: `/api/health`
- **Method**: GET
- **Response**: Includes startup timing, environment validation, and service status

### Startup Improvements
- Environment validation with early failure
- Parallel service initialization
- Memory optimization for containers
- Graceful shutdown handlers
- Critical path warmup

## Cloud Run Specific Settings

### Container Configuration
- **Port**: Use the PORT environment variable (automatically set by Cloud Run)
- **Host**: 0.0.0.0 (already configured)
- **Health Check**: `/api/health`

### Recommended Cloud Run Settings
- **CPU**: 1 vCPU minimum for production
- **Memory**: 512Mi - 1Gi depending on load
- **Min Instances**: 0 (allow scale to zero)
- **Max Instances**: Configure based on expected traffic
- **Request Timeout**: 300 seconds (for long-running requests)
- **Startup Timeout**: 240 seconds (accounting for initialization)

### Environment Variables to Set in Cloud Run
```bash
NODE_ENV=production
AUTH_URL=https://your-domain.com
AUTH_SECRET=your-secure-secret-key
DATABASE_URL=postgresql://your-database-url
SENDGRID_API_KEY=your-sendgrid-key  # Optional
STREAM_KEY_ENCRYPTION_KEY=your-32-character-key  # Optional
```

## Verification Steps

1. **Health Check**: Verify `/api/health` returns status "ok"
2. **Environment**: Check logs for "Environment validation passed"
3. **Startup Time**: Monitor startup timing in logs
4. **Port Binding**: Confirm server binds to Cloud Run's PORT

## Troubleshooting

### Common Issues
1. **Port binding errors**: Ensure PORT environment variable is set
2. **Environment validation failures**: Check required variables are configured
3. **Slow startup**: Review startup timing logs to identify bottlenecks
4. **Health check failures**: Verify all services initialize successfully

### Log Analysis
- Search for "Environment validation" to check configuration
- Look for "Server started successfully" for port confirmation
- Monitor "Startup timing" logs for performance insights

## NGINX Reverse Proxy Configuration

For production deployments, an NGINX reverse proxy is recommended to handle load balancing, SSL termination, and static asset serving.

### Quick Setup

NGINX configuration files are available in `deployment/nginx/`:
- **`sites-available-default`** - Drop-in replacement for `/etc/nginx/sites-available/default`
- **`shuffle-and-sync.conf`** - Standalone site configuration
- **`complete-nginx.conf`** - Complete NGINX configuration file

### Features Included

✅ **HTTP (Port 80) & HTTPS (Port 443)** listening
✅ **Reverse proxy** to Express application
✅ **WebSocket support** for real-time features (TableSync, messaging)
✅ **SSL/TLS configuration** with modern security settings
✅ **Security headers** (HSTS, XSS protection, content-type options)
✅ **Performance optimization** (gzip, buffering, connection pooling)
✅ **Health check endpoint** special handling
✅ **Auth.js OAuth flow** compatibility

### Deployment Commands

```bash
# Navigate to NGINX config directory
cd deployment/nginx

# Validate configuration
./validate.sh

# Deploy (requires sudo)
sudo ./deploy.sh

# Or manual deployment:
sudo cp sites-available-default /etc/nginx/sites-available/default
sudo nginx -t
sudo systemctl reload nginx
```

### Express App Integration

The NGINX configuration is optimized for the Shuffle & Sync Express application:
- **Proxy headers** properly configured for `app.set('trust proxy', 1)`
- **Health check** endpoint at `/api/health` with no caching
- **Auth.js routes** at `/api/auth/*` for OAuth flows
- **WebSocket support** for real-time coordination features

### Verification

After deployment, verify NGINX is running and consuming the correct ports:
```bash
# Check NGINX status
sudo systemctl status nginx

# Verify ports 80 and 443 are listening
sudo netstat -tlnp | grep nginx

# Test HTTP and HTTPS endpoints
curl -I http://localhost/api/health
curl -I https://localhost/api/health  # If SSL configured
```

## Additional Optimizations

While the core deployment issues have been addressed, further optimizations could include:
- Implementing Redis caching (already supported)
- Database connection pooling optimization
- CDN configuration for static assets
- Monitoring and alerting setup
- NGINX caching layer for static assets