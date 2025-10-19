# Administrator Deployment Setup Guide

This comprehensive guide provides step-by-step instructions for system administrators to set up and deploy Shuffle & Sync in a production environment.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Database Configuration](#database-configuration)
- [Authentication Setup](#authentication-setup)
- [Server Deployment](#server-deployment)
- [Administrator Account Initialization](#administrator-account-initialization)
- [Verification and Testing](#verification-and-testing)
- [Troubleshooting](#troubleshooting)
- [Maintenance and Operations](#maintenance-and-operations)
- [Related Documentation](#related-documentation)

---

## Overview

Shuffle & Sync is a comprehensive TCG (Trading Card Game) streaming coordination platform built with:

- **Backend**: Node.js with Express.js and TypeScript
- **Frontend**: React 18 with Vite and TypeScript
- **Database**: SQLite Cloud with Drizzle ORM
- **Authentication**: Auth.js v5 with Google OAuth 2.0
- **Deployment**: Google Cloud Platform (Cloud Run)

This guide focuses on production deployment procedures for system administrators, covering infrastructure setup, environment configuration, and operational best practices.

### Key Architecture Components

- **Cloud Run**: Container-based backend and frontend services
- **SQLite Cloud**: Cloud-hosted database with global distribution
- **Drizzle ORM**: Type-safe database operations and migrations
- **Auth.js**: Secure authentication with database sessions
- **Secret Manager**: Secure environment variable and credential storage

---

## Prerequisites

Before deploying Shuffle & Sync to production, ensure you have the following tools, accounts, and access permissions.

### Required Tools

- **Node.js** (v18 or later) and npm - [Download](https://nodejs.org/)
- **Google Cloud SDK (gcloud CLI)** - [Installation Guide](https://cloud.google.com/sdk/docs/install)
- **Docker** (optional, Cloud Build can be used) - [Download](https://www.docker.com/products/docker-desktop)
- **Git** - For version control
- **Text editor** - VS Code, vim, or your preferred editor

### Required Accounts

- **Google Cloud Platform account** with billing enabled
- **SQLite Cloud account** - [Sign up](https://sqlitecloud.io)
- **Google Cloud Console access** - For OAuth 2.0 credentials
- **SendGrid account** (optional) - For email notifications

### GCP Project Setup

1. **Create or select a GCP project**:

   ```bash
   # List existing projects
   gcloud projects list

   # Create new project
   gcloud projects create shuffle-sync-prod --name="Shuffle & Sync Production"

   # Set as active project
   gcloud config set project shuffle-sync-prod
   ```

2. **Enable billing** for the project through the GCP Console

3. **Enable required APIs**:
   ```bash
   gcloud services enable \
     run.googleapis.com \
     cloudbuild.googleapis.com \
     sql-component.googleapis.com \
     sqladmin.googleapis.com \
     secretmanager.googleapis.com \
     cloudresourcemanager.googleapis.com
   ```

### Access and Permissions

Ensure your GCP account has the following IAM roles:

- **Cloud Run Admin** - Deploy and manage Cloud Run services
- **Cloud Build Editor** - Build and deploy containers
- **Secret Manager Admin** - Manage secrets and environment variables
- **Service Account User** - Use service accounts for deployments

---

## Environment Setup

### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/Shuffle-and-Sync/reimagined-guacamole.git
cd reimagined-guacamole

# Install dependencies
npm install --legacy-peer-deps
```

### 2. Create Production Environment File

```bash
# Copy the production template
cp .env.production.template .env.production
```

### 3. Configure Environment Variables

Edit `.env.production` and configure the following **critical** variables:

#### Core Configuration

| Variable          | Description                       | How to Generate                                                                     |
| ----------------- | --------------------------------- | ----------------------------------------------------------------------------------- |
| `NODE_ENV`        | Runtime environment               | Set to `production`                                                                 |
| `DATABASE_URL`    | SQLite Cloud connection string    | From SQLite Cloud dashboard (see [Database Configuration](#database-configuration)) |
| `AUTH_SECRET`     | Authentication secret (64+ chars) | `openssl rand -base64 64`                                                           |
| `AUTH_URL`        | Production domain URL             | `https://your-domain.com` (or leave empty for auto-detection)                       |
| `AUTH_TRUST_HOST` | Enable host header detection      | Set to `true` for Cloud Run                                                         |

#### Authentication Provider

| Variable               | Description                | How to Generate                                                                                                   |
| ---------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID     | From [Google Cloud Console](https://console.cloud.google.com) (see [Authentication Setup](#authentication-setup)) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | From Google Cloud Console                                                                                         |

#### Administrator Account

| Variable                | Description               | Example                                 |
| ----------------------- | ------------------------- | --------------------------------------- |
| `MASTER_ADMIN_EMAIL`    | Admin email address       | `admin@yourdomain.com`                  |
| `MASTER_ADMIN_PASSWORD` | Admin password (optional) | Generate with `openssl rand -base64 16` |

> **Note**: If `MASTER_ADMIN_PASSWORD` is not set, the admin must authenticate via Google OAuth.

#### Optional Services

| Variable                    | Description               | Purpose             |
| --------------------------- | ------------------------- | ------------------- |
| `SENDGRID_API_KEY`          | SendGrid API key          | Email notifications |
| `SENDGRID_SENDER`           | Default sender email      | Email notifications |
| `STREAM_KEY_ENCRYPTION_KEY` | Encryption key (32 chars) | Stream key security |

### 4. Validate Environment Configuration

```bash
npm run env:validate
```

This command validates that:

- All required variables are set
- Variable formats are correct
- Secrets are not using demo/default values
- Database connection string is valid

### 5. Store Secrets in GCP Secret Manager

For production deployments, store sensitive environment variables in Google Cloud Secret Manager:

```bash
# Create secrets
echo -n "your-auth-secret" | gcloud secrets create auth-secret --data-file=-
echo -n "your-google-client-secret" | gcloud secrets create google-client-secret --data-file=-
echo -n "your-database-url" | gcloud secrets create database-url --data-file=-

# Grant access to Cloud Run service account
gcloud secrets add-iam-policy-binding auth-secret \
  --member="serviceAccount:YOUR_SERVICE_ACCOUNT@YOUR_PROJECT.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

See [Managing Secrets in GCP](../../MANAGING_SECRETS_GCP.md) for detailed instructions.

---

## Database Configuration

Shuffle & Sync uses **SQLite Cloud** as its database, accessed via **Drizzle ORM** for all database operations.

### 1. Create SQLite Cloud Database

1. **Sign up** for SQLite Cloud at [https://sqlitecloud.io](https://sqlitecloud.io)

2. **Create a new database instance**:
   - Log in to SQLite Cloud dashboard
   - Click "Create Database"
   - Choose a region close to your Cloud Run deployment
   - Note the database name (e.g., `shuffleandsync`)

3. **Generate API Key**:
   - Navigate to database settings
   - Create a new API key
   - Copy the full connection string

4. **Set DATABASE_URL**:
   ```bash
   # Format: sqlitecloud://hostname:port/database?apikey=YOUR_API_KEY
   # Example:
   DATABASE_URL=sqlitecloud://your-host.sqlite.cloud:8860/shuffleandsync?apikey=YOUR_API_KEY
   ```

### 2. Initialize Database Schema

The application uses Drizzle ORM for schema management. Initialize the database:

```bash
# Initialize SQLite Cloud database
npm run db:init

# Push schema to database (development)
npm run db:push
```

For production, use migrations:

```bash
# Generate migration
npx drizzle-kit generate

# Apply migrations (in production environment)
npx drizzle-kit migrate
```

### 3. Verify Database Connection

```bash
npm run db:health
```

This should output:

```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-10-14T20:00:00.000Z"
}
```

### Database Architecture Notes

- **Single Database**: All data is stored in SQLite Cloud
- **Drizzle ORM**: Primary ORM for all runtime operations
- **Schema Source**: `shared/schema.ts` is the authoritative schema
- **Session Storage**: Auth.js sessions stored via Drizzle adapter
- **Migrations**: Managed by Drizzle Kit

See [Database Architecture Guide](../../DATABASE_ARCHITECTURE.md) for comprehensive details.

---

## Authentication Setup

Shuffle & Sync uses Auth.js v5 with Google OAuth 2.0 for authentication.

### 1. Configure Google OAuth 2.0

1. **Navigate to Google Cloud Console**:
   - Go to [https://console.cloud.google.com](https://console.cloud.google.com)
   - Select your project (or create a new one for OAuth)

2. **Enable Google+ API** (if not already enabled):

   ```bash
   gcloud services enable people.googleapis.com
   ```

3. **Create OAuth 2.0 Credentials**:
   - Navigate to **APIs & Services** > **Credentials**
   - Click **Create Credentials** > **OAuth client ID**
   - Application type: **Web application**
   - Name: `Shuffle & Sync Production`

4. **Configure Authorized Redirect URIs**:
   Add the following URLs:

   ```
   https://your-domain.com/api/auth/callback/google
   https://your-backend-service.run.app/api/auth/callback/google
   ```

   For development:

   ```
   http://localhost:3000/api/auth/callback/google
   ```

5. **Copy Credentials**:
   - Copy the **Client ID** and **Client Secret**
   - Set in `.env.production`:
     ```bash
     GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
     GOOGLE_CLIENT_SECRET=your-client-secret
     ```

### 2. Configure Auth.js

The application is pre-configured with Auth.js. Verify the configuration:

- **Auth Secret**: Must be at least 32 characters (generate with `openssl rand -base64 64`)
- **Auth URL**: Production domain (can be auto-detected in Cloud Run if `AUTH_TRUST_HOST=true`)
- **Session Strategy**: Database sessions via Drizzle adapter (configured automatically)

### 3. Security Considerations

- **HTTPS Only**: OAuth requires HTTPS in production (Cloud Run provides this automatically)
- **CSRF Protection**: Enabled by default in Auth.js
- **Session Security**: HTTP-only secure cookies
- **Domain Verification**: Ensure redirect URIs match your production domain exactly

---

## Server Deployment

Shuffle & Sync is optimized for Google Cloud Run deployment.

### Automated Deployment

Use the automated deployment script:

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
3. Run tests (skip with `--skip-tests`)
4. Build Docker containers
5. Deploy to Cloud Run
6. Run database migrations
7. Verify deployment health

### Manual Deployment Steps

For more control, deploy manually:

#### 1. Build Application

```bash
# Build the application
npm run build

# Verify build
npm run build:verify
```

#### 2. Build and Push Docker Image

```bash
# Set variables
export PROJECT_ID="your-gcp-project-id"
export REGION="us-central1"

# Build backend image
gcloud builds submit --tag gcr.io/$PROJECT_ID/shuffle-sync-backend

# Build frontend image (optional, for separate frontend service)
gcloud builds submit --tag gcr.io/$PROJECT_ID/shuffle-sync-frontend \
  --config cloudbuild-frontend.yaml
```

#### 3. Deploy to Cloud Run

```bash
# Deploy backend service
gcloud run deploy shuffle-sync-backend \
  --image gcr.io/$PROJECT_ID/shuffle-sync-backend \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production \
  --set-secrets DATABASE_URL=database-url:latest,AUTH_SECRET=auth-secret:latest,GOOGLE_CLIENT_SECRET=google-client-secret:latest \
  --min-instances 1 \
  --max-instances 5 \
  --cpu 1 \
  --memory 512Mi
```

#### 4. Configure Custom Domain (Optional)

```bash
# Map custom domain
gcloud run domain-mappings create \
  --service shuffle-sync-backend \
  --domain your-domain.com \
  --region $REGION
```

Follow the instructions to configure DNS records.

### Component-Specific Deployment

Deploy individual components:

```bash
# Backend only
npm run deploy:backend

# Frontend only
npm run deploy:frontend

# Database migrations only
npm run db:migrate:production
```

---

## Administrator Account Initialization

After deploying the application, initialize the administrator account.

### 1. Set Admin Configuration

Ensure `MASTER_ADMIN_EMAIL` is set in your environment:

```bash
# In .env.production or Secret Manager
MASTER_ADMIN_EMAIL=admin@yourdomain.com

# Optional: Set password for credentials authentication
MASTER_ADMIN_PASSWORD=$(openssl rand -base64 16)
```

> **Important**: Store the password securely in a password manager.

### 2. Initialize Admin Account

```bash
# Initialize admin account
npm run admin:init
```

This will:

- Check if admin user exists
- Create user if needed with `super_admin` role
- Set up OAuth authentication
- Configure credentials authentication (if password provided)

### 3. Verify Admin Account

```bash
# Verify admin account exists and is configured correctly
npm run admin:verify
```

Expected output:

```
✅ Admin account verified
   Email: admin@yourdomain.com
   Role: super_admin
   OAuth: Enabled (Google)
   Credentials: Enabled (password set)
```

### 4. First Login

1. Navigate to `https://your-domain.com`
2. Click "Sign in with Google"
3. Authenticate with the admin email
4. Verify super_admin access in user profile

### Admin Account Security

- **Use OAuth**: Prefer Google OAuth for admin access in production
- **Strong Password**: If using credentials, use a strong password (16+ characters)
- **MFA**: Enable multi-factor authentication on Google account
- **Dedicated Email**: Use a dedicated admin email, not a personal account
- **Regular Rotation**: Rotate admin credentials every 90 days
- **Audit Logs**: Monitor admin access in application logs

See [Administrator Account Setup Guide](../../ADMIN_SETUP.md) for comprehensive admin management instructions.

---

## Verification and Testing

After deployment, perform comprehensive verification.

### 1. Health Check

```bash
# Automated verification
npm run verify:production

# Manual health check
BACKEND_URL=$(gcloud run services describe shuffle-sync-backend \
  --region $REGION \
  --format "value(status.url)")

curl -f $BACKEND_URL/api/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2024-10-14T20:00:00.000Z",
  "environment": "production",
  "uptime": 123.456,
  "database": "connected"
}
```

### 2. Frontend Accessibility

```bash
# Verify frontend loads
FRONTEND_URL=$(gcloud run services describe shuffle-sync-frontend \
  --region $REGION \
  --format "value(status.url)")

curl -f $FRONTEND_URL
```

### 3. Authentication Flow

1. Navigate to `https://your-domain.com`
2. Click "Sign in with Google"
3. Authenticate with Google
4. Verify successful redirect and session creation
5. Check user profile displays correctly

### 4. Database Connectivity

```bash
# Test database connection
npm run db:health

# Verify migrations applied
npx drizzle-kit studio
```

### 5. Admin API Verification

```bash
# Verify admin endpoints (requires authentication)
curl -X GET $BACKEND_URL/api/admin/status \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 6. Log Analysis

```bash
# View recent logs
gcloud run services logs read shuffle-sync-backend \
  --region $REGION \
  --limit 50

# Filter for errors
gcloud run services logs read shuffle-sync-backend \
  --region $REGION \
  --filter "severity>=ERROR"
```

### 7. Security Verification

- [ ] HTTPS working correctly (not HTTP)
- [ ] Security headers present (HSTS, CSP, X-Frame-Options)
- [ ] Authentication required for protected routes
- [ ] Rate limiting functional
- [ ] No sensitive data in logs or error messages

---

## Troubleshooting

Common deployment issues and solutions.

### Environment Validation Failures

**Problem**: Environment validation fails with missing or invalid variables.

**Solution**:

```bash
# Check environment configuration
npm run env:validate

# View environment variable definitions
npm run env:definitions

# Review .env.production file
cat .env.production

# Ensure all required variables are set
# - DATABASE_URL
# - AUTH_SECRET
# - GOOGLE_CLIENT_ID
# - GOOGLE_CLIENT_SECRET
# - MASTER_ADMIN_EMAIL
```

### Database Connection Issues

**Problem**: Application cannot connect to SQLite Cloud database.

**Solution**:

```bash
# Verify DATABASE_URL format
# Correct: sqlitecloud://hostname:port/database?apikey=KEY
# Incorrect: Missing apikey, wrong port, invalid hostname

# Test connection
npm run db:health

# Check SQLite Cloud dashboard for database status
# Ensure API key is valid and not expired
# Verify network connectivity to SQLite Cloud
```

### OAuth Redirect URI Mismatch

**Problem**: Google OAuth returns "redirect_uri_mismatch" error.

**Solution**:

1. Check Google Cloud Console OAuth credentials
2. Verify redirect URIs include:
   - `https://your-domain.com/api/auth/callback/google`
   - `https://your-backend-service.run.app/api/auth/callback/google`
3. Ensure URIs match exactly (including trailing slashes)
4. Wait 5-10 minutes for Google to propagate changes
5. Clear browser cache and retry

### Health Check Failures

**Problem**: Cloud Run health checks fail, service shows as unhealthy.

**Solution**:

```bash
# Check application logs
gcloud run services logs read shuffle-sync-backend --region $REGION

# Verify health endpoint
curl -f https://your-backend-service.run.app/health

# Common causes:
# - Database connection failure (check DATABASE_URL)
# - Missing environment variables (check Secret Manager)
# - Insufficient memory/CPU (increase Cloud Run resources)
# - Long startup time (increase timeout in cloudbuild.yaml)
```

### Build Failures

**Problem**: Docker build fails or Cloud Build errors.

**Solution**:

```bash
# Check build logs
gcloud builds list --limit=10
gcloud builds log BUILD_ID

# Common causes:
# - npm install failures (check package.json, use --legacy-peer-deps)
# - TypeScript compilation errors (run npm run check locally)
# - Missing files (ensure .dockerignore is correct)
# - Build timeout (increase timeout in cloudbuild.yaml)

# Test build locally
npm run build
docker build -t shuffle-sync-backend .
```

### Admin Account Issues

**Problem**: Cannot initialize or verify admin account.

**Solution**:

```bash
# Check admin configuration
echo $MASTER_ADMIN_EMAIL

# Verify database connection
npm run db:health

# Re-initialize admin account
npm run admin:init

# Check application logs for errors
gcloud run services logs read shuffle-sync-backend \
  --region $REGION \
  --filter "admin"

# Verify user exists in database
npx drizzle-kit studio
# Navigate to 'users' table and search for admin email
```

### Memory Issues

**Problem**: Cloud Run service crashes due to insufficient memory.

**Solution**:

```bash
# Increase memory allocation
gcloud run services update shuffle-sync-backend \
  --region $REGION \
  --memory 1Gi

# Monitor memory usage
gcloud run services logs read shuffle-sync-backend \
  --region $REGION \
  --filter "memory"

# Consider:
# - Optimizing database queries
# - Implementing caching (Redis)
# - Reducing concurrent connections
```

### Getting Help

If issues persist:

1. **Review logs**: `gcloud run services logs read shuffle-sync-backend --region $REGION`
2. **Check documentation**:
   - [Deployment Guide](../../../DEPLOYMENT.md)
   - [Production Deployment Checklist](../PRODUCTION_DEPLOYMENT_CHECKLIST.md)
   - [Database Architecture](../../DATABASE_ARCHITECTURE.md)
   - [Administrator Account Setup](../../ADMIN_SETUP.md)
3. **Validate environment**: `npm run env:validate`
4. **Verify prerequisites**: Ensure all required APIs are enabled
5. **Community support**: Open an issue on GitHub with detailed error logs

---

## Maintenance and Operations

### Regular Maintenance Tasks

#### Database Backups

```bash
# SQLite Cloud provides automatic backups
# Configure backup schedule in SQLite Cloud dashboard

# Manual backup (export database)
# Use SQLite Cloud dashboard or CLI tools
```

#### Log Monitoring

```bash
# Set up log-based metrics in GCP
gcloud logging metrics create error-rate \
  --description="Error rate metric" \
  --log-filter='resource.type="cloud_run_revision" AND severity>=ERROR'

# Create alerts
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="High Error Rate" \
  --condition-threshold-value=10
```

#### Security Updates

```bash
# Regularly update dependencies
npm audit
npm audit fix

# Update npm packages
npm update

# Rebuild and redeploy
npm run build
npm run deploy:production
```

#### Admin Credential Rotation

```bash
# Rotate admin password (every 90 days)
export NEW_PASSWORD=$(openssl rand -base64 16)
echo "MASTER_ADMIN_PASSWORD=$NEW_PASSWORD" >> .env.production

# Update secret in Secret Manager
echo -n "$NEW_PASSWORD" | gcloud secrets versions add master-admin-password --data-file=-

# Re-initialize admin account
npm run admin:init
```

#### Monitoring and Alerts

- **Uptime Monitoring**: Configure uptime checks in GCP Monitoring
- **Error Tracking**: Set up Sentry or GCP Error Reporting
- **Performance Metrics**: Monitor Cloud Run metrics (CPU, memory, latency)
- **Log Analysis**: Review logs regularly for anomalies

### Scaling Considerations

```bash
# Adjust Cloud Run scaling parameters
gcloud run services update shuffle-sync-backend \
  --region $REGION \
  --min-instances 2 \
  --max-instances 10 \
  --cpu 2 \
  --memory 1Gi

# Consider:
# - Auto-scaling based on traffic
# - Regional deployment for lower latency
# - CDN for static assets
# - Database connection pooling
```

### Rollback Procedures

```bash
# List previous revisions
gcloud run revisions list \
  --service shuffle-sync-backend \
  --region $REGION

# Rollback to previous revision
gcloud run services update-traffic shuffle-sync-backend \
  --region $REGION \
  --to-revisions REVISION_NAME=100

# Verify rollback
npm run verify:production
```

See [Deployment Guide - Rollback Strategies](../../../DEPLOYMENT.md#rollback-strategies) for detailed procedures.

---

## Related Documentation

### Core Documentation

- **[README.md](../../../README.md)** - Project overview and quick start
- **[CONTRIBUTING.md](../../../CONTRIBUTING.md)** - Contributing guidelines
- **[.env.example](../../../.env.example)** - Environment variables reference

### Deployment Documentation

- **[Deployment Guide](../../../DEPLOYMENT.md)** - Comprehensive deployment procedures
- **[Production Deployment Checklist](../PRODUCTION_DEPLOYMENT_CHECKLIST.md)** - Pre-deployment checklist
- **[Managing Secrets in GCP](../../MANAGING_SECRETS_GCP.md)** - Secret Manager guide

### Database Documentation

- **[Database Architecture](../../DATABASE_ARCHITECTURE.md)** - Database design and architecture
- **[Database FAQ](../../DATABASE_FAQ.md)** - Common database questions
- **[Database README](../../DATABASE_README.md)** - Database quick reference

### Administrator Documentation

- **[Administrator Account Setup](../../ADMIN_SETUP.md)** - Admin account management
- **[Security Improvements](../../SECURITY_IMPROVEMENTS.md)** - Security best practices

### Configuration Files

- **[.env.production.template](../../../.env.production.template)** - Production environment template
- **[cloudbuild.yaml](../../../cloudbuild.yaml)** - Backend Cloud Build configuration
- **[cloudbuild-frontend.yaml](../../../cloudbuild-frontend.yaml)** - Frontend Cloud Build configuration
- **[Dockerfile](../../../Dockerfile)** - Backend container configuration
- **[Dockerfile.frontend](../../../Dockerfile.frontend)** - Frontend container configuration

### Scripts

- **[deploy-production.sh](../../../scripts/deploy-production.sh)** - Automated deployment script
- **[init-admin.ts](../../../scripts/init-admin.ts)** - Admin initialization script
- **[verify-production.sh](../../../scripts/verify-production.sh)** - Post-deployment verification

> **Note**: Run shell scripts with `bash scripts/scriptname.sh` for cross-platform compatibility (especially on Windows with Git Bash/MINGW64).

### External Resources

- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Google Cloud Build Documentation](https://cloud.google.com/build/docs)
- [Google Secret Manager Documentation](https://cloud.google.com/secret-manager/docs)
- [SQLite Cloud Documentation](https://sqlitecloud.io/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Auth.js Documentation](https://authjs.dev)

---

## Support

For deployment issues or questions:

1. **Check documentation** thoroughly (links above)
2. **Review logs**: `gcloud run services logs read shuffle-sync-backend --region $REGION`
3. **Validate environment**: `npm run env:validate`
4. **Verify prerequisites**: Ensure all required APIs and tools are installed
5. **Community support**: Open an issue on GitHub with:
   - Detailed error messages
   - Environment configuration (redact secrets)
   - Steps to reproduce
   - Deployment logs

---

**Document Version**: 1.0  
**Last Updated**: 2024-10-14  
**Maintained By**: DevOps Team  
**Target Audience**: System Administrators, DevOps Engineers
