# Deployment Guide - Shuffle & Sync

This comprehensive guide provides step-by-step instructions for deploying Shuffle & Sync to production environments. The platform is optimized for **Google Cloud Platform (Cloud Run)** but can be adapted for other container-based hosting services.

## 📚 Quick Navigation

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
  - [Administrator Account Setup](#5-initialize-administrator-account)
- [Deployment Options](#deployment-options)
- [Deployment Procedures](#deployment-procedures)
- [Windows Deployment (Git Bash)](#windows-deployment-git-bash)
- [Rollback Strategies](#rollback-strategies)
- [Verification Steps](#verification-steps)
- [Troubleshooting](#troubleshooting)
- [Additional Resources](#additional-resources)
  - [Administrator Setup Guide](docs/ADMIN_SETUP.md)

---

## Prerequisites

Before deploying to production, ensure you have the following prerequisites in place:

### Required Tools & Access

- [ ] **Google Cloud SDK (gcloud CLI)** - [Installation Guide](https://cloud.google.com/sdk/docs/install)
- [ ] **Docker with BuildKit** - For building container images with multi-architecture support
- [ ] **Node.js** (v18 or later) and npm
- [ ] **Git** - For version control
- [ ] **Production Google Cloud Project** with billing enabled
- [ ] **Admin access** to the GCP project

### Required GCP APIs

Enable the following APIs in your Google Cloud Project:

```bash
# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  sql-component.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  cloudresourcemanager.googleapis.com
```

### Pre-Deployment Checklist

Complete the following before deploying:

- [ ] **All tests passing**: Run `npm test` to verify
- [ ] **Code linting clean**: Run `npm run lint`
- [ ] **Production build successful**: Run `npm run build`
- [ ] **Security audit clean**: Run `npm audit`
- [ ] **TypeScript checks passing**: Run `npm run check`
- [ ] **Changes committed** to version control
- [ ] **Release version tagged** in Git
- [ ] **Documentation updated** with any changes

---

## Environment Setup

### 1. Configure Environment Variables

The application requires specific environment variables to function correctly in production.

#### Step 1: Copy the Production Template

```bash
cp .env.production.template .env.production
```

#### Step 2: Configure Required Variables

Edit `.env.production` and configure the following **critical** variables:

| Variable | Description | How to Generate |
|----------|-------------|-----------------|
| `DATABASE_URL` | SQLite Cloud connection string | From SQLite Cloud dashboard |
| `AUTH_SECRET` | Authentication secret (64+ chars) | `openssl rand -base64 64` |
| `AUTH_URL` | Production domain URL | `https://your-domain.com` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | From [Google Cloud Console](https://console.cloud.google.com) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | From Google Cloud Console |
| `MASTER_ADMIN_EMAIL` | Administrator email address | Your admin email (e.g., `admin@yourdomain.com`) |

#### Step 3: Configure Optional Variables

For enhanced functionality, configure these recommended variables:

| Variable | Description | Purpose |
|----------|-------------|---------|
| `SENDGRID_API_KEY` | SendGrid API key | Email notifications |
| `STREAM_KEY_ENCRYPTION_KEY` | Encryption key (32 chars) | Stream key security |
| `REDIS_URL` | Redis connection string | Caching layer |
| `SENTRY_DSN` | Sentry error tracking | Error monitoring |
| `MASTER_ADMIN_PASSWORD` | Admin password (12+ chars) | Credentials authentication (optional, use OAuth if not set) |

#### Step 4: Validate Environment Configuration

```bash
npm run env:validate
```

This validates that all required variables are set and properly formatted.

### 2. Database Setup

> **Important**: The application requires a SQLite Cloud instance for production. Drizzle ORM handles all database operations. See [Database Architecture Guide](docs/DATABASE_ARCHITECTURE.md) for detailed explanation.

#### SQLite Cloud Setup

Set up a SQLite Cloud database for the application:

```bash
# Sign up for SQLite Cloud at https://sqlitecloud.io
# Create a new database instance
# Copy the connection string (includes API key)
# Set DATABASE_URL in your environment

# Example connection string format:
# sqlitecloud://your-host.sqlite.cloud:8860/shuffleandsync?apikey=YOUR_API_KEY

# Initialize database schema
npm run db:init
npm run db:push
```

### 3. Google OAuth Configuration

Configure OAuth credentials for authentication:

1. **Navigate to** [Google Cloud Console > APIs & Services > Credentials](https://console.cloud.google.com/apis/credentials)
2. **Create OAuth 2.0 Client ID** (Application type: Web application)
3. **Add Authorized Redirect URIs**:
   - `https://your-domain.com/api/auth/callback/google`
   - Add development URIs if needed
4. **Copy** Client ID and Client Secret to `.env.production`

### 4. Secret Management

**⚠️ IMPORTANT:** Never commit secrets to version control. Always use Google Secret Manager for production.

See **[Managing Secrets with Google Secret Manager Guide](docs/MANAGING_SECRETS_GCP.md)** for comprehensive instructions.

#### Quick Setup

Store sensitive configuration in Google Secret Manager:

```bash
# Create secrets
echo -n "$AUTH_SECRET" | gcloud secrets create auth-secret --data-file=-
echo -n "$GOOGLE_CLIENT_SECRET" | gcloud secrets create google-client-secret --data-file=-
echo -n "$DATABASE_URL" | gcloud secrets create database-url --data-file=-

# Grant Cloud Run service account access
gcloud secrets add-iam-policy-binding auth-secret \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

For complete secret management workflows including rotation, audit, and TypeScript integration, see:
- **[Complete Secret Management Guide](docs/MANAGING_SECRETS_GCP.md)**
- **[Google Cloud Commands Reference](docs/GOOGLE_CLOUD_COMMANDS_REFERENCE.md)**

---

## Deployment Options

### Option 1: Unified Deployment (Simpler)

Single Cloud Run service serving both frontend and backend.

**Pros:**
- Simpler configuration
- Single service to manage
- No CORS or proxy configuration needed

**Cons:**
- Cannot scale frontend and backend independently
- Frontend and backend share resources

### Option 2: Split Deployment (Production Recommended)

Separate services for frontend (NGINX) and backend (Node.js).

**Pros:**
- Independent scaling for frontend and backend
- Better performance (NGINX serves static files)
- Can use CDN for frontend

**Cons:**
- Requires proxy configuration
- More complex initial setup

---

## Deployment Procedures

Shuffle & Sync provides automated deployment scripts for Google Cloud Platform.

### One-Command Deployment

For a complete deployment of both backend and frontend:

```bash
# Set required environment variables
export PROJECT_ID="your-gcp-project-id"
export REGION="us-central1"

# Run automated deployment
npm run deploy:production
```

This script will:
1. Validate prerequisites (gcloud, docker, npm)
2. Validate environment variables
3. Run tests (can be skipped with `--skip-tests` flag)
4. Build Docker containers
5. Deploy to Cloud Run
6. Run database migrations
7. Verify deployment health

### Component-Specific Deployment

Deploy individual components as needed:

#### Backend Only

```bash
npm run deploy:backend
```

#### Frontend Only

```bash
npm run deploy:frontend
```

#### Database Migration Only

```bash
npm run db:migrate:production
```

### Manual Deployment Steps

If you prefer manual control or need to troubleshoot:

Before proceeding with manual deployment, ensure the following environment variables are set. These are required for tagging Docker images and deploying to the correct GCP resources.

```bash
# Set these variables with your GCP Project ID, Region, and SQL Connection Name
export PROJECT_ID="your-gcp-project-id"
export REGION="your-gcp-region" # e.g., us-central1
export CONNECTION_NAME=$(gcloud sql instances describe your-instance-name --format="value(connectionName)")
```

#### 1. Build Docker Images

**Standard Build (Single Architecture)**

```bash
# Enable Docker BuildKit for improved build performance
export DOCKER_BUILDKIT=1

# Build backend image
docker build -f Dockerfile -t gcr.io/$PROJECT_ID/shuffle-and-sync-backend:latest .

# Build frontend image
docker build -f Dockerfile.frontend -t gcr.io/$PROJECT_ID/shuffle-and-sync-frontend:latest .
```

**Multi-Architecture Build (Recommended for Production)**

For multi-architecture support (AMD64 and ARM64), use Docker Buildx:

```bash
# Create and use a new buildx builder (one-time setup)
docker buildx create --name multiarch-builder --use
docker buildx inspect --bootstrap

# Build and push backend image for multiple architectures
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -f Dockerfile \
  -t gcr.io/$PROJECT_ID/shuffle-and-sync-backend:latest \
  --push \
  .

# Build and push frontend image for multiple architectures
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -f Dockerfile.frontend \
  -t gcr.io/$PROJECT_ID/shuffle-and-sync-frontend:latest \
  --push \
  .
```

> **Note**: Multi-architecture builds require `--push` flag as multi-platform images cannot be loaded locally. Images are pushed directly to the registry.

#### 2. Push to Google Container Registry (Single Architecture Only)

If you built for a single architecture, push the images:

```bash
# Configure Docker for GCR
gcloud auth configure-docker

# Push images
docker push gcr.io/$PROJECT_ID/shuffle-and-sync-backend:latest
docker push gcr.io/$PROJECT_ID/shuffle-and-sync-frontend:latest
```

> **Note**: Skip this step if you used the multi-architecture build command above, as images are already pushed.

#### 3. Deploy to Cloud Run

```bash
# Deploy backend
gcloud run deploy shuffle-and-sync-backend \
  --image gcr.io/$PROJECT_ID/shuffle-and-sync-backend:latest \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,AUTH_TRUST_HOST=true" \
  --set-secrets "DATABASE_URL=database-url:latest,AUTH_SECRET=auth-secret:latest,GOOGLE_CLIENT_SECRET=google-client-secret:latest" \
  --add-cloudsql-instances $CONNECTION_NAME \
  --memory 1Gi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10 \
  --min-instances 0

# Deploy frontend
gcloud run deploy shuffle-and-sync-frontend \
  --image gcr.io/$PROJECT_ID/shuffle-and-sync-frontend:latest \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 5
```

#### 4. Run Database Migrations

```bash
bash scripts/migrate-production-db.sh
```

#### 5. Initialize Administrator Account

After database migrations, set up the master administrator account:

```bash
# Set admin configuration in environment or Secret Manager
export MASTER_ADMIN_EMAIL=admin@yourdomain.com
export MASTER_ADMIN_PASSWORD=$(openssl rand -base64 16)

# Initialize admin account
npm run admin:init

# Verify admin setup
npm run admin:verify
```

**Important**: 
- See [docs/ADMIN_SETUP.md](docs/ADMIN_SETUP.md) for comprehensive admin setup guide
- Store admin credentials securely in your password manager
- Enable MFA after first login
- Use OAuth (Google) for admin access in production when possible

### Deployment with Cloud Build (CI/CD)

For automated deployments via Cloud Build:

**Note:** Both `cloudbuild.yaml` and `cloudbuild-frontend.yaml` use a `_REGION` substitution that defaults to `us-central1`. You can override this by passing `--substitutions=_REGION=your-region` or by setting the `REGION` environment variable in your deployment script.

#### Backend Deployment

```bash
gcloud builds submit \
  --config cloudbuild.yaml \
  --substitutions _REGION=$REGION,_SERVICE_NAME=shuffle-and-sync-backend
```

#### Frontend Deployment

```bash
gcloud builds submit \
  --config cloudbuild-frontend.yaml \
  --substitutions _REGION=$REGION,_SERVICE_NAME=shuffle-and-sync-frontend
```

### Domain & SSL Configuration

#### Map Custom Domain

```bash
# Map domain to Cloud Run service
gcloud run domain-mappings create \
  --service shuffle-and-sync-frontend \
  --domain your-domain.com \
  --region $REGION
```

#### Configure DNS

Add the following DNS records to your domain:

```
Type: A
Name: @
Value: [IP provided by Cloud Run]

Type: AAAA
Name: @
Value: [IPv6 provided by Cloud Run]
```

SSL certificates are automatically provisioned by Cloud Run.

---

## Rollback Strategies

### Quick Rollback Procedure

If issues are detected after deployment, rollback immediately:

#### 1. Identify Previous Revision

```bash
# List revisions for backend
gcloud run revisions list \
  --service shuffle-and-sync-backend \
  --region $REGION \
  --limit 5

# List revisions for frontend
gcloud run revisions list \
  --service shuffle-and-sync-frontend \
  --region $REGION \
  --limit 5
```

#### 2. Rollback to Previous Revision

```bash
# Rollback backend to previous revision
gcloud run services update-traffic shuffle-and-sync-backend \
  --to-revisions PREVIOUS_REVISION=100 \
  --region $REGION

# Rollback frontend to previous revision
gcloud run services update-traffic shuffle-and-sync-frontend \
  --to-revisions PREVIOUS_REVISION=100 \
  --region $REGION
```

#### 3. Verify Rollback

```bash
npm run verify:production
```

### Database Rollback

For database migration rollback:

```bash
# Connect to Cloud SQL
gcloud sql connect $INSTANCE_NAME --user=app_user --database=shufflesync_prod

# Run rollback migration manually
-- Execute rollback SQL scripts as needed
```

**Important**: Always test rollback procedures in staging before production deployment.

### Traffic Splitting (Canary Deployment)

For safer deployments, gradually shift traffic to the new revision:

```bash
# Deploy new revision without traffic
gcloud run deploy shuffle-and-sync-backend \
  --image gcr.io/$PROJECT_ID/shuffle-and-sync-backend:latest \
  --region $REGION \
  --no-traffic

# Get the new revision name
NEW_REVISION=$(gcloud run revisions list \
  --service shuffle-and-sync-backend \
  --region $REGION \
  --format="value(name)" \
  --limit 1)

# Route 10% traffic to new revision
gcloud run services update-traffic shuffle-and-sync-backend \
  --to-revisions $NEW_REVISION=10,$OLD_REVISION=90 \
  --region $REGION

# Monitor metrics, then increase gradually
gcloud run services update-traffic shuffle-and-sync-backend \
  --to-revisions $NEW_REVISION=50,$OLD_REVISION=50 \
  --region $REGION

# If successful, route 100% traffic
gcloud run services update-traffic shuffle-and-sync-backend \
  --to-revisions $NEW_REVISION=100 \
  --region $REGION
```

---

## Verification Steps

After deployment, perform the following verification steps:

### 1. Health Check Verification

```bash
# Automated verification
npm run verify:production

# Manual health check
BACKEND_URL=$(gcloud run services describe shuffle-and-sync-backend \
  --region $REGION \
  --format "value(status.url)")

curl -f $BACKEND_URL/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production",
  "uptime": 123.456
}
```

### 2. Frontend Accessibility

```bash
FRONTEND_URL=$(gcloud run services describe shuffle-and-sync-frontend \
  --region $REGION \
  --format "value(status.url)")

curl -f $FRONTEND_URL
```

### 3. Authentication Flow

Test the complete OAuth flow:
1. Navigate to `https://your-domain.com`
2. Click "Sign in with Google"
3. Complete OAuth authorization
4. Verify successful login and session creation

### 4. Database Connectivity

```bash
# Check database health
npm run db:health
```

### 5. Core Feature Testing

Test critical user flows:
- [ ] User registration and authentication
- [ ] Community browsing and joining
- [ ] Event creation and viewing
- [ ] Real-time messaging (WebSocket)
- [ ] Profile updates

### 6. Performance Validation

```bash
# Check response times
curl -w "@curl-format.txt" -o /dev/null -s $BACKEND_URL/api/health

# Monitor Cloud Run metrics
gcloud run services describe shuffle-and-sync-backend \
  --region $REGION \
  --format "table(status.conditions)"
```

### 7. Log Analysis

```bash
# View recent logs
gcloud run services logs read shuffle-and-sync-backend \
  --region $REGION \
  --limit 50

# Filter for errors
gcloud run services logs read shuffle-and-sync-backend \
  --region $REGION \
  --filter "severity>=ERROR"
```

### 8. Security Verification

- [ ] HTTPS working correctly (not HTTP)
- [ ] Security headers present
- [ ] Authentication required for protected routes
- [ ] Rate limiting functional
- [ ] No sensitive data in logs or error messages

---

## Troubleshooting

### Common Deployment Issues

#### Port Binding Errors

**Symptom**: Service fails to start with port-related errors

**Solution**: Ensure PORT environment variable is properly set by Cloud Run (automatic) and the application uses it:

```bash
# Check environment variables
gcloud run services describe shuffle-and-sync-backend \
  --region $REGION \
  --format "yaml(spec.template.spec.containers[0].env)"
```

#### Environment Validation Failures

**Symptom**: Application crashes on startup with missing environment variables

**Solution**: Verify all required variables are configured:

```bash
# Check secret bindings
gcloud run services describe shuffle-and-sync-backend \
  --region $REGION \
  --format "yaml(spec.template.spec.containers[0].env)"

# Validate locally
npm run env:validate
```

#### Health Check Failures

**Symptom**: Cloud Run reports service unhealthy

**Solution**: 
1. Check logs for initialization errors
2. Verify database connectivity
3. Ensure `/api/health` endpoint is accessible
4. Increase startup timeout if needed:

```bash
gcloud run services update shuffle-and-sync-backend \
  --region $REGION \
  --timeout 300
```

#### Database Connection Issues

**Symptom**: Cannot connect to Cloud SQL database

**Solution**:
1. Verify Cloud SQL instance is running
2. Check connection name in DATABASE_URL
3. Ensure Cloud Run service has Cloud SQL client role:

```bash
# Grant Cloud SQL client role
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member "serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role "roles/cloudsql.client"
```

#### OAuth Redirect URI Mismatch

**Symptom**: Google OAuth returns redirect_uri_mismatch error

**Solution**:
1. Verify AUTH_URL matches your production domain
2. Add the exact redirect URI to Google Cloud Console:
   - `https://your-domain.com/api/auth/callback/google`
3. Ensure no trailing slashes in AUTH_URL

#### Build Failures

**Symptom**: Docker build or Cloud Build fails

**Solution**:
1. Check `cloudbuild.yaml` configuration
2. Verify all dependencies in `package.json` are available
3. Check build logs for specific errors:

```bash
gcloud builds log BUILD_ID
```

#### npm Dependency Resolution Errors

**Symptom**: `npm ci` fails with ERESOLVE errors related to `@sqlitecloud/drivers` and React Native peer dependencies

**Root Cause**: The `@sqlitecloud/drivers` package declares React Native peer dependencies (react-native-quick-base64, react-native-tcp-socket, etc.) which conflict with React 18.3.1 used by the web application. These React Native dependencies are not required for Node.js server usage.

**Solution**: The Dockerfile has been updated to use `--legacy-peer-deps` flag which instructs npm to ignore peer dependency conflicts:

```dockerfile
RUN npm ci --legacy-peer-deps
RUN npm prune --production --legacy-peer-deps
```

This is safe because:
- The application only uses `@sqlitecloud/drivers` in Node.js server context
- React Native peer dependencies are only needed for mobile apps
- The package functions correctly in Node.js despite the peer dependency warnings

**For local development**: If you encounter this error locally, use:
```bash
npm install --legacy-peer-deps
```

#### Memory Issues

**Symptom**: Container crashes with out-of-memory errors

**Solution**: Increase memory allocation:

```bash
gcloud run services update shuffle-and-sync-backend \
  --region $REGION \
  --memory 2Gi
```

#### Configuration Error on Login

**Symptoms:**
- Browser shows `ERR_TOO_MANY_ACCEPT_CH_RESTARTS`
- Redirects to `/api/auth/error?error=Configuration`

**Quick Fix:**

1. Run diagnostics:
```bash
npm run diagnose:auth
```

2. Common issues:
   - Missing OAuth credentials on backend
   - Frontend not configured with `BACKEND_URL` (split deployment)
   - OAuth redirect URIs not matching deployed URLs

See [Troubleshooting Guide](docs/troubleshooting.md) for detailed solutions.

#### Frontend Can't Reach Backend

**For split deployment**, verify:

1. Frontend has `BACKEND_URL` set:
```bash
gcloud run services describe shuffle-and-sync-frontend \
  --region=$REGION \
  --format="value(spec.template.spec.containers[0].env)" | grep BACKEND_URL
```

2. Backend URL is accessible:
```bash
curl $BACKEND_URL/health
```

3. NGINX proxy configuration is correct (see `Dockerfile.frontend`)

### Getting Help

If you encounter issues not covered here:

1. **Check Logs**: `gcloud run services logs read shuffle-and-sync-backend --region $REGION`
2. **Review Documentation**: 
   - [Production Deployment Checklist](docs/deployment/PRODUCTION_DEPLOYMENT_CHECKLIST.md)
   - [Troubleshooting Guide](docs/troubleshooting.md)
3. **Check Environment**: Run `npm run env:validate`
4. **Verify Prerequisites**: Ensure all required APIs are enabled
5. **Community Support**: Open an issue on GitHub with detailed error logs

---

## Architecture Details

### Split Deployment Architecture

```
User Browser
    ↓
Frontend Service (NGINX)
    ├── /          → Static React SPA
    └── /api/      → Proxy to Backend Service
             ↓
        Backend Service (Express + Auth.js)
             ↓
        Database (SQLite Cloud)
```

### How Frontend Proxying Works

The frontend NGINX server is configured to proxy `/api/` requests to the backend:

```nginx
location /api/ {
    proxy_pass $BACKEND_URL;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

This is configured via:
1. `BACKEND_URL` environment variable on frontend service
2. `Dockerfile.frontend` with NGINX configuration template
3. Entrypoint script that substitutes environment variables

### Why Split Deployment?

**Performance:**
- NGINX serves static files faster than Node.js
- Frontend can be cached by CDN
- Backend can scale independently based on API load

**Security:**
- Frontend has no access to database or secrets
- Backend can have stricter IAM permissions
- Separation of concerns

---

## Additional Resources

### Documentation

- **[Google Cloud Commands Reference](docs/GOOGLE_CLOUD_COMMANDS_REFERENCE.md)** - Complete gcloud CLI command reference
- **[Production Deployment Checklist](docs/deployment/PRODUCTION_DEPLOYMENT_CHECKLIST.md)** - Comprehensive pre-deployment checklist
- **[Environment Variables Guide](docs/ENVIRONMENT_VARIABLES.md)** - Complete variable reference
- **[Configuration Files Guide](docs/CONFIGURATION_FILES_GUIDE.md)** - Config file documentation
- **[Troubleshooting Guide](docs/troubleshooting.md)** - Common issues and solutions
- **[README.md](README.md)** - Project overview and quick start

### Scripts

- **[deploy-production.sh](scripts/deploy-production.sh)** - Automated deployment script
- **[migrate-production-db.sh](scripts/migrate-production-db.sh)** - Database migration script
- **[verify-production.sh](scripts/verify-production.sh)** - Post-deployment verification
- **[setup-env.sh](scripts/setup-env.sh)** - Environment setup helper

> **Note**: Run scripts with `bash scripts/scriptname.sh` for cross-platform compatibility (especially on Windows with Git Bash/MINGW64).

### Configuration Files

- **[.env.production.template](.env.production.template)** - Production environment template
- **[cloudbuild.yaml](cloudbuild.yaml)** - Backend Cloud Build configuration
- **[cloudbuild-frontend.yaml](cloudbuild-frontend.yaml)** - Frontend Cloud Build configuration
- **[Dockerfile](Dockerfile)** - Backend container configuration
- **[Dockerfile.frontend](Dockerfile.frontend)** - Frontend container configuration

### External Resources

- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Google Cloud Build Documentation](https://cloud.google.com/build/docs)
- [Google Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [Google Secret Manager Documentation](https://cloud.google.com/secret-manager/docs)
- [Auth.js Documentation](https://authjs.dev)
- [Docker Buildx Documentation](https://docs.docker.com/buildx/working-with-buildx/)

---

## Best Practices

### Security

1. **Rotate Secrets Regularly**: Change AUTH_SECRET and database passwords quarterly
2. **Use Secret Manager**: Never store secrets in environment variables or code
3. **Enable Audit Logging**: Track all configuration changes
4. **Monitor Failed Authentications**: Set up alerts for suspicious login attempts
5. **Keep Dependencies Updated**: Run `npm audit` regularly

### Performance

1. **Enable CDN**: Use Cloud CDN for static assets
2. **Configure Caching**: Use Redis for session and data caching
3. **Optimize Database Queries**: Use connection pooling and indexes
4. **Monitor Response Times**: Set up performance alerts
5. **Scale Appropriately**: Configure min/max instances based on traffic patterns

### Reliability

1. **Set Up Monitoring**: Use Cloud Monitoring for metrics and alerts
2. **Enable Backups**: Configure automated database backups
3. **Test Rollback Procedures**: Practice rollback in staging environment
4. **Use Health Checks**: Ensure health endpoint accurately reflects application state
5. **Document Incidents**: Keep a log of issues and resolutions

### Cost Optimization

1. **Use Scale-to-Zero**: Allow Cloud Run to scale to 0 instances during low traffic
2. **Right-Size Resources**: Monitor actual usage and adjust memory/CPU
3. **Clean Up Old Revisions**: Remove unused container images and revisions
4. **Use Budget Alerts**: Set up billing alerts to prevent surprises
5. **Review Logs Retention**: Configure appropriate log retention periods

---

## Windows Deployment (Git Bash)

This section provides specific guidance for deploying Shuffle & Sync on Windows using Git Bash (MINGW64). While the application is fully deployable from Windows, there are some platform-specific considerations to keep in mind.

### Prerequisites for Windows

Before deploying from Windows, ensure you have the following tools installed:

#### Required Tools

1. **Git for Windows** (includes Git Bash) - [Download](https://git-scm.com/download/win)
   - Provides the Bash shell environment
   - Includes Unix-like utilities needed by deployment scripts
   - Default installation options are usually sufficient

2. **Node.js** (v18 or later) - [Download](https://nodejs.org/)
   - Use the Windows Installer (.msi)
   - Verify installation: `node --version` and `npm --version`
   - Ensure Node.js is added to your system PATH

3. **Google Cloud SDK** - [Download](https://cloud.google.com/sdk/docs/install)
   - Use the Windows installer
   - After installation, initialize: `gcloud init`
   - Authenticate: `gcloud auth login`
   - Verify: `gcloud --version`

4. **Docker Desktop for Windows** - [Download](https://www.docker.com/products/docker-desktop)
   - Required for building container images
   - Enable WSL 2 backend for better performance
   - Verify: `docker --version`
   - Ensure Docker is running before deployment

5. **SQLite Cloud CLI** (Optional for local testing)
   - Install via npm: `npm install -g @sqlitecloud/cli`
   - Used for database management and testing

#### Optional Tools

- **Windows Terminal** - Recommended for better shell experience
- **Visual Studio Code** - For editing configuration files
- **Git Credential Manager** - For easier authentication (usually included with Git for Windows)

### Windows-Specific Environment Setup

#### Path Conventions

Windows uses different path conventions than Unix systems. Git Bash handles most of this automatically, but be aware:

```bash
# Unix-style paths (use these in Git Bash)
export PROJECT_ID="your-project-id"
cd /c/Users/YourName/projects/reimagined-guacamole

# Windows-style paths (converted automatically by Git Bash)
C:\Users\YourName\projects\reimagined-guacamole

# Git Bash converts Windows paths to Unix format automatically
cd ~/projects/reimagined-guacamole  # Recommended approach
```

#### Line Endings Configuration

Configure Git to handle line endings properly:

```bash
# Set line ending handling for this repository
git config core.autocrlf input

# Or globally for all repositories
git config --global core.autocrlf input
```

This ensures shell scripts maintain Unix-style line endings (LF) even on Windows.

#### Environment Variables Setup

Setting environment variables in Git Bash:

```bash
# Temporary (current session only)
export PROJECT_ID="your-gcp-project-id"
export REGION="us-central1"

# Verify
echo $PROJECT_ID

# For permanent environment variables, add to ~/.bashrc:
echo 'export PROJECT_ID="your-gcp-project-id"' >> ~/.bashrc
echo 'export REGION="us-central1"' >> ~/.bashrc
source ~/.bashrc
```

#### Creating .env Files

When creating environment files on Windows:

```bash
# Copy template (works in Git Bash)
cp .env.production.template .env.production

# Edit with your preferred editor
notepad .env.production  # Opens in Notepad
code .env.production     # Opens in VS Code (if installed)

# Or use nano/vim in Git Bash
nano .env.production
```

### Running Deployment Scripts on Windows

All deployment scripts are designed to work with Git Bash. Always run scripts using `bash`:

```bash
# Correct: Use bash explicitly
bash scripts/deploy-production.sh

# Also correct: Ensure script is executable
chmod +x scripts/deploy-production.sh
./scripts/deploy-production.sh

# Avoid: Running without bash may fail
scripts/deploy-production.sh  # May not work
```

#### Full Deployment Example (Windows)

```bash
# 1. Open Git Bash and navigate to project
cd ~/projects/reimagined-guacamole

# 2. Set required environment variables
export PROJECT_ID="your-gcp-project-id"
export REGION="us-central1"

# 3. Ensure Docker Desktop is running
# Check Docker status
docker ps

# 4. Authenticate with Google Cloud
gcloud auth login
gcloud config set project $PROJECT_ID

# 5. Configure Docker for GCR
gcloud auth configure-docker

# 6. Run deployment
bash scripts/deploy-production.sh
```

### Windows-Specific Commands

Some commands may need slight adjustments on Windows:

#### Secret Generation

```bash
# Using openssl (included with Git for Windows)
openssl rand -base64 64

# Alternative: Using PowerShell (from Git Bash)
powershell.exe -Command "[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Maximum 256 }))"

# Using Node.js (cross-platform)
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

#### Port Checking

```bash
# Check if port is in use (Git Bash)
netstat -ano | grep :3000

# Alternative: Using PowerShell
powershell.exe -Command "Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue"
```

#### Process Management

```bash
# Find process by port
netstat -ano | findstr :3000

# Kill process by PID (use PID from netstat output)
taskkill //F //PID <process_id>
```

### Common Windows-Specific Issues

#### Issue: "command not found" errors

**Symptom**: Commands like `gcloud`, `docker`, or `npm` not found in Git Bash

**Solution**:
1. Ensure tools are installed
2. Add installation directories to PATH:
   ```bash
   # Add to ~/.bashrc
   export PATH="$PATH:/c/Program Files/Google/Cloud SDK/google-cloud-sdk/bin"
   export PATH="$PATH:/c/Program Files/Docker/Docker/resources/bin"
   export PATH="$PATH:/c/Program Files/nodejs"
   
   # Reload configuration
   source ~/.bashrc
   ```

#### Issue: Permission denied on scripts

**Symptom**: `bash: ./script.sh: Permission denied`

**Solution**:
```bash
# Make script executable
chmod +x scripts/deploy-production.sh

# Or always use bash explicitly
bash scripts/deploy-production.sh
```

#### Issue: Line ending issues causing script failures

**Symptom**: Scripts fail with `'\r': command not found` or similar errors

**Solution**:
```bash
# Convert line endings for all scripts
dos2unix scripts/*.sh

# If dos2unix is not available, use sed
sed -i 's/\r$//' scripts/*.sh

# Or configure Git to handle it automatically
git config core.autocrlf input
git rm --cached -r .
git reset --hard
```

#### Issue: Docker daemon not running

**Symptom**: `Cannot connect to the Docker daemon`

**Solution**:
1. Start Docker Desktop from the Start menu
2. Wait for Docker to fully initialize (check system tray icon)
3. Verify: `docker ps`
4. If still failing, restart Docker Desktop

#### Issue: npm install failures with peer dependency errors

**Symptom**: `ERESOLVE unable to resolve dependency tree`

**Solution**:
```bash
# Use legacy peer deps flag (as configured in project)
npm install --legacy-peer-deps

# Clean install
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

#### Issue: Path too long errors

**Symptom**: Errors about path lengths exceeding Windows limits

**Solution**:
1. Enable long paths in Windows:
   ```powershell
   # Run in PowerShell as Administrator
   New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
   ```

2. Or clone repository closer to root:
   ```bash
   cd /c/projects  # Instead of /c/Users/YourName/Documents/Projects/...
   ```

#### Issue: Firewall blocking gcloud or Docker

**Symptom**: Connection timeouts when deploying or pulling images

**Solution**:
1. Allow gcloud and Docker through Windows Firewall
2. Check corporate firewall/proxy settings
3. Configure proxy if needed:
   ```bash
   # For gcloud
   gcloud config set proxy/type http
   gcloud config set proxy/address proxy.example.com
   gcloud config set proxy/port 8080
   
   # For Docker
   # Configure in Docker Desktop Settings > Resources > Proxies
   ```

#### Issue: Script execution policy errors (PowerShell)

**Symptom**: If you accidentally try to run scripts in PowerShell instead of Git Bash

**Solution**:
Always use Git Bash for running deployment scripts:
```bash
# Wrong: PowerShell
powershell .\scripts\deploy-production.sh

# Correct: Git Bash
bash scripts/deploy-production.sh
```

### Windows Deployment Checklist

Use this checklist to ensure Windows-specific setup is complete:

- [ ] Git for Windows installed with Git Bash
- [ ] Node.js v18+ installed and in PATH
- [ ] npm working correctly (`npm --version`)
- [ ] Google Cloud SDK installed and authenticated
- [ ] Docker Desktop installed and running
- [ ] Docker daemon accessible (`docker ps` works)
- [ ] Line endings configured (`git config core.autocrlf input`)
- [ ] All scripts have Unix line endings (LF, not CRLF)
- [ ] Environment variables set in Git Bash session
- [ ] `.env.production` created and configured
- [ ] Windows Firewall allows gcloud and Docker
- [ ] Long paths enabled (if needed)

### Testing Your Windows Setup

Before deploying to production, verify your Windows setup:

```bash
# 1. Check all prerequisites
node --version    # Should show v18 or higher
npm --version     # Should show 9.x or higher
docker --version  # Should show Docker version
gcloud --version  # Should show Google Cloud SDK version

# 2. Test Docker
docker run hello-world  # Should pull and run successfully

# 3. Test gcloud authentication
gcloud auth list  # Should show your authenticated account

# 4. Test local build
npm install --legacy-peer-deps
npm run build

# 5. Test environment validation
npm run env:validate

# 6. Run health check (if server is running)
npm run health
```

### Performance Tips for Windows

1. **Use WSL 2 for Docker**: Configure Docker Desktop to use WSL 2 backend for better performance
2. **Exclude from antivirus**: Add project directory to Windows Defender exclusions
3. **Use SSD**: Keep project on SSD rather than HDD for faster builds
4. **Close unnecessary apps**: Free up RAM during builds and deployments

### Additional Windows Resources

- **Git Bash Documentation**: [Git for Windows Wiki](https://github.com/git-for-windows/git/wiki)
- **Docker Desktop for Windows**: [Docker Windows Documentation](https://docs.docker.com/desktop/windows/)
- **Google Cloud SDK for Windows**: [Installation Guide](https://cloud.google.com/sdk/docs/install#windows)
- **Windows Terminal**: [Microsoft Documentation](https://docs.microsoft.com/en-us/windows/terminal/)

### Getting Help on Windows

If you encounter Windows-specific issues:

1. **Check Git Bash version**: `git --version` (use latest)
2. **Verify PATH configuration**: `echo $PATH`
3. **Check for WSL/Git Bash conflicts**: Ensure using correct bash
4. **Review error messages carefully**: Note any Windows-specific paths or errors
5. **Test in PowerShell**: Some commands work differently - stick to Git Bash
6. **Community Support**: Include "Windows" in your GitHub issue title

---

## Support

For deployment support:

- **Documentation Issues**: Open an issue on GitHub
- **Deployment Questions**: Check existing documentation first
- **Critical Production Issues**: Follow your organization's incident response procedures
- **Windows-Specific Issues**: Include your Git Bash version and Windows version in bug reports

---

**Last Updated**: 2025-10-16  
**Version**: 2.0.0  
**Platform**: Google Cloud Platform (Cloud Run)
