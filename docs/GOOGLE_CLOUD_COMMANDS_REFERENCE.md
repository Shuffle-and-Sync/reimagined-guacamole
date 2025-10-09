# Google Cloud Commands Reference

**Last Updated:** January 2025  
**Purpose:** Comprehensive reference for all Google Cloud CLI (gcloud) commands used in Shuffle & Sync  
**Status:** Living Document

---

## 📚 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Reference](#quick-reference)
- [Command Categories](#command-categories)
  - [CLI Configuration](#cli-configuration)
  - [API Management](#api-management)
  - [Cloud Run - Service Management](#cloud-run---service-management)
  - [Cloud Run - Deployment](#cloud-run---deployment)
  - [Cloud Build](#cloud-build)
  - [Logging & Monitoring](#logging--monitoring)
  - [Secret Manager](#secret-manager)
  - [Cloud SQL](#cloud-sql)
  - [Container Registry](#container-registry)
  - [IAM & Permissions](#iam--permissions)
  - [Authentication](#authentication)
- [Common Patterns](#common-patterns)
- [Troubleshooting](#troubleshooting)
- [Related Documentation](#related-documentation)

---

## Overview

This document provides a comprehensive reference for all Google Cloud CLI commands used in the Shuffle & Sync project. Each command is documented with its purpose, usage, and relevant examples.

### Command Format

All commands are formatted for direct copy-paste execution. Replace placeholder values (in `$VARIABLE` or `YOUR_VALUE` format) with your actual values.

### Common Variables

```bash
# Project Configuration
PROJECT_ID="your-gcp-project-id"
REGION="us-central1"

# Service Names
BACKEND_SERVICE="shuffle-sync-backend"
FRONTEND_SERVICE="shuffle-sync-frontend"

# Set project (run once per session)
gcloud config set project "$PROJECT_ID"
```

---

## Prerequisites

Before using these commands, ensure you have:

1. **Google Cloud SDK (gcloud CLI)** installed - [Installation Guide](https://cloud.google.com/sdk/docs/install)
2. **Authenticated** with your Google Cloud account:
   ```bash
   gcloud auth login
   ```
3. **Selected** your project:
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```

---

## Quick Reference

### Most Common Commands

```bash
# List all Cloud Run services
gcloud run services list --region=us-central1

# Get service URL
gcloud run services describe shuffle-sync-backend \
  --region=us-central1 \
  --format='value(status.url)'

# Update service environment variables
gcloud run services update shuffle-sync-backend \
  --region=us-central1 \
  --set-env-vars GOOGLE_CLIENT_ID=your-client-id \
  --set-env-vars GOOGLE_CLIENT_SECRET=your-client-secret

# Deploy backend service
gcloud builds submit --config cloudbuild.yaml

# Deploy frontend service
gcloud builds submit --config cloudbuild-frontend.yaml

# View recent logs
gcloud logging read "resource.type=cloud_run_revision" --limit 50
```

---

## Command Categories

### CLI Configuration

#### Set Active Project

```bash
# Set the active GCP project for all subsequent commands
gcloud config set project "$PROJECT_ID"
```

**Purpose:** Configure the gcloud CLI to use a specific project  
**When to use:** At the start of each session or when switching projects  
**Documentation:** [Configuration Files Guide](CONFIGURATION_FILES_GUIDE.md)

#### Get Current Project

```bash
# Get the currently configured project
gcloud config get-value project
```

**Purpose:** Verify which project is currently active  
**Output:** Your project ID or empty if not set

---

### API Management

#### Enable Required APIs

```bash
# Enable all required Google Cloud APIs
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  sql-component.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  cloudresourcemanager.googleapis.com
```

**Purpose:** Enable Google Cloud services needed for the application  
**When to use:** During initial project setup or when adding new services  
**Required for:** Cloud Run, Cloud Build, Cloud SQL, Secret Manager  
**Documentation:** [Deployment Guide](deployment/DEPLOYMENT.md)

#### Enable Individual API

```bash
# Enable a specific API
gcloud services enable run.googleapis.com
```

**Purpose:** Enable a single Google Cloud service  
**Common APIs:**
- `run.googleapis.com` - Cloud Run
- `cloudbuild.googleapis.com` - Cloud Build
- `secretmanager.googleapis.com` - Secret Manager
- `sqladmin.googleapis.com` - Cloud SQL Administration

#### List Enabled APIs

```bash
# List all enabled APIs
gcloud services list --enabled

# Check if specific API is enabled
gcloud services list --enabled --filter="name:run.googleapis.com"

# List available APIs
gcloud services list --available
```

**Purpose:** View enabled or available Google Cloud services  
**Common filters:**
- `--enabled` - Show only enabled services
- `--available` - Show all available services
- `--filter="name:SERVICE_NAME"` - Filter by service name

---

### Cloud Run - Service Management

#### List Services

```bash
# List all Cloud Run services in a region
gcloud run services list --region=us-central1

# List with specific format (names and URLs)
gcloud run services list --region=us-central1 \
  --format="table(name,status.url)"

# Filter services by name pattern
gcloud run services list --region=us-central1 | grep shuffle-sync

# Get only service names
gcloud run services list --region=us-central1 \
  --format="value(name)"
```

**Purpose:** View all deployed Cloud Run services  
**Common filters:** `grep shuffle`, `grep backend`, `grep frontend`  
**Output formats:** `table`, `value`, `json`, `yaml`

#### Describe Service

```bash
# Get detailed service information
gcloud run services describe shuffle-sync-backend \
  --region=us-central1

# Get only the service URL
gcloud run services describe shuffle-sync-backend \
  --region=us-central1 \
  --format='value(status.url)'

# Get environment variables
gcloud run services describe shuffle-sync-backend \
  --region=us-central1 \
  --format="value(spec.template.spec.containers[0].env)"
```

**Purpose:** Inspect service configuration and status  
**Useful formats:**
- `value(status.url)` - Get service URL
- `value(spec.template.spec.containers[0].env)` - List environment variables
- `yaml` - Full configuration in YAML format

#### Update Service Environment Variables

```bash
# Update backend OAuth credentials
gcloud run services update shuffle-sync-backend \
  --region=us-central1 \
  --set-env-vars GOOGLE_CLIENT_ID=your-client-id \
  --set-env-vars GOOGLE_CLIENT_SECRET=your-client-secret \
  --set-env-vars AUTH_SECRET=$(openssl rand -hex 32) \
  --set-env-vars AUTH_TRUST_HOST=true
```

**Purpose:** Update service configuration without redeployment  
**Common use cases:**
- Set OAuth credentials
- Update backend URL on frontend
- Change database connection string
- Toggle feature flags

**Documentation:** [Configuration Files Guide](CONFIGURATION_FILES_GUIDE.md)

```bash
# Update frontend backend URL
gcloud run services update shuffle-sync-frontend \
  --region=us-central1 \
  --set-env-vars BACKEND_URL=https://your-backend-url
```

**Important:** 
- Values with spaces must be quoted
- No trailing slashes for URLs
- Use `$(command)` for generated values (e.g., secrets)

#### Delete Service

```bash
# Delete a Cloud Run service
gcloud run services delete shuffle-sync-backend \
  --region=us-central1

# Delete without confirmation prompt
gcloud run services delete shuffle-sync-backend \
  --region=us-central1 \
  --quiet
```

**Purpose:** Remove a deployed Cloud Run service  
**Warning:** This action cannot be undone  
**Use case:** Cleaning up old services or deployments

---

### Cloud Run - Deployment

#### Deploy Service

```bash
# Deploy backend service with full configuration
gcloud run deploy shuffle-sync-backend \
  --image gcr.io/$PROJECT_ID/shuffle-sync-backend:latest \
  --region=us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 5

# Deploy frontend service
gcloud run deploy shuffle-sync-frontend \
  --image gcr.io/$PROJECT_ID/shuffle-sync-frontend:latest \
  --region=us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 256Mi \
  --cpu 1
```

**Purpose:** Deploy a container image to Cloud Run  
**Common options:**
- `--memory` - Memory allocation (256Mi, 512Mi, 1Gi, etc.)
- `--cpu` - CPU allocation (1, 2, 4, etc.)
- `--max-instances` - Maximum number of instances
- `--min-instances` - Minimum number of instances (for warm starts)
- `--allow-unauthenticated` - Allow public access
- `--no-allow-unauthenticated` - Require authentication

**Note:** Typically done via Cloud Build (see [Cloud Build](#cloud-build) section)

#### Traffic Management

```bash
# Gradually shift traffic to new revision
gcloud run services update-traffic shuffle-sync-backend \
  --to-revisions REVISION_NAME=100

# Split traffic between revisions
gcloud run services update-traffic shuffle-sync-backend \
  --to-revisions REVISION_1=50,REVISION_2=50
```

**Purpose:** Control traffic distribution between service revisions  
**Use cases:**
- Canary deployments
- Blue/green deployments
- Gradual rollouts
- Rollback to previous revision

#### Revision Management

```bash
# List all revisions for a service
gcloud run revisions list \
  --service=shuffle-sync-backend \
  --region=us-central1

# Delete old revisions
gcloud run revisions delete REVISION_NAME \
  --region=us-central1
```

**Purpose:** Manage service revisions and versions  
**Note:** Each deployment creates a new revision

#### Domain Mapping

```bash
# Map custom domain to Cloud Run service
gcloud run domain-mappings create \
  --service=shuffle-sync-frontend \
  --domain=your-domain.com \
  --region=us-central1
```

**Purpose:** Configure custom domain for Cloud Run service  
**Prerequisites:** Domain ownership verification  
**Documentation:** [Cloud Run Domain Mapping](https://cloud.google.com/run/docs/mapping-custom-domains)

---

### Cloud Build

#### Submit Build

```bash
# Deploy backend using Cloud Build
gcloud builds submit --config cloudbuild.yaml

# Deploy frontend using Cloud Build
gcloud builds submit --config cloudbuild-frontend.yaml

# Submit build with substitutions
gcloud builds submit \
  --config cloudbuild.yaml \
  --substitutions=_REGION=us-central1,_ENV=production

# Submit from specific directory
gcloud builds submit \
  --config cloudbuild.yaml \
  --region=us-central1 \
  .
```

**Purpose:** Build and deploy containerized applications  
**Config files:**
- `cloudbuild.yaml` - Backend build configuration
- `cloudbuild-frontend.yaml` - Frontend build configuration

**Common substitutions:**
- `_REGION` - Deployment region
- `_ENV` - Environment (dev, staging, production)
- `_SERVICE_NAME` - Custom service name

#### View Build Logs

```bash
# View logs for a specific build
gcloud builds log BUILD_ID

# Stream logs in real-time
gcloud builds log BUILD_ID --stream
```

**Purpose:** Debug build failures and monitor build progress  
**How to get BUILD_ID:** Displayed when you submit a build

---

### Logging & Monitoring

#### Read Service Logs

```bash
# View recent Cloud Run logs (last 50 entries)
gcloud logging read "resource.type=cloud_run_revision" \
  --limit 50

# View logs for specific service
gcloud logging read \
  "resource.type=cloud_run_revision AND resource.labels.service_name=shuffle-sync-backend" \
  --limit 50

# View logs from the last hour
gcloud logging read "resource.type=cloud_run_revision" \
  --limit 100 \
  --freshness=1h

# Filter by severity
gcloud logging read \
  "resource.type=cloud_run_revision AND severity>=ERROR" \
  --limit 50
```

**Purpose:** Debug issues and monitor application behavior  
**Common filters:**
- `severity>=ERROR` - Errors only
- `severity>=WARNING` - Warnings and errors
- `resource.labels.service_name=SERVICE_NAME` - Specific service
- `timestamp>="2024-01-01T00:00:00Z"` - Time range

**Documentation:** [Troubleshooting Guide](TROUBLESHOOTING_CONFIGURATION_ERROR.md)

#### Read Cloud Run Service Logs (Simplified)

```bash
# Read service logs directly (simpler syntax)
gcloud run services logs read shuffle-sync-backend \
  --region=us-central1 \
  --limit=100
```

**Purpose:** Quick access to service logs  
**Advantages:** Simpler syntax, service-specific

---

### Secret Manager

#### Create Secret

```bash
# Create secret from literal value
gcloud secrets create auth-secret \
  --data-file=- <<< "your-secret-value"

# Create secret from file
echo -n "your-secret-value" | \
  gcloud secrets create auth-secret --data-file=-

# Create admin email secret
gcloud secrets create MASTER_ADMIN_EMAIL \
  --data-file=- <<< "admin@yourdomain.com"
```

**Purpose:** Store sensitive configuration securely  
**Common secrets:**
- `auth-secret` - Authentication secret
- `database-url` - Database connection string
- `google-client-secret` - OAuth client secret
- `MASTER_ADMIN_EMAIL` - Administrator email

#### Grant Secret Access

```bash
# Allow Cloud Run service to access secret
gcloud secrets add-iam-policy-binding auth-secret \
  --member=serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor
```

**Purpose:** Grant Cloud Run services access to secrets  
**Note:** Replace PROJECT_NUMBER with your actual project number

**Documentation:** [Admin Setup Guide](ADMIN_SETUP.md)

---

### Cloud SQL

#### Create Database

```bash
# Create production database
gcloud sql databases create shufflesync_prod \
  --instance=INSTANCE_NAME
```

**Purpose:** Create a new database in Cloud SQL instance  
**Prerequisites:** Cloud SQL instance must exist

#### Create User

```bash
# Create database user
gcloud sql users create app_user \
  --instance=INSTANCE_NAME \
  --password=SECURE_PASSWORD
```

**Purpose:** Create database user with specific permissions  
**Security:** Use strong passwords, store in Secret Manager

#### Connect to Database

```bash
# Connect to Cloud SQL database via Cloud SQL Proxy
gcloud sql connect INSTANCE_NAME \
  --user=app_user \
  --database=shufflesync_prod
```

**Purpose:** Interactive database access for administration  
**Use cases:** Database migrations, debugging, data inspection

---

### Container Registry

#### Delete Container Image

```bash
# Delete backend container image
gcloud container images delete \
  gcr.io/$PROJECT_ID/shuffle-sync-backend:TAG

# Delete frontend container image
gcloud container images delete \
  gcr.io/$PROJECT_ID/shuffle-sync-frontend:TAG

# Delete without confirmation
gcloud container images delete \
  gcr.io/$PROJECT_ID/shuffle-sync-backend:TAG \
  --quiet
```

**Purpose:** Clean up old container images to save storage costs  
**Common tags:** `latest`, version numbers, commit SHAs

---

### IAM & Permissions

#### Add IAM Policy Binding

```bash
# Grant project-level permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:SERVICE_ACCOUNT_EMAIL \
  --role=roles/run.admin
```

**Purpose:** Grant permissions to service accounts or users  
**Common roles:**
- `roles/run.admin` - Cloud Run administration
- `roles/cloudbuild.builds.builder` - Cloud Build execution
- `roles/secretmanager.secretAccessor` - Secret access
- `roles/cloudsql.client` - Cloud SQL connection

---

### Authentication

#### Configure Docker Authentication

```bash
# Configure Docker to authenticate with Google Container Registry
gcloud auth configure-docker
```

**Purpose:** Allow Docker to push/pull images from GCR  
**When to use:** Before building or pushing container images  
**Run once:** Per development machine

---

## Common Patterns

### Complete Deployment Workflow

```bash
# 1. Set project
export PROJECT_ID="your-project-id"
export REGION="us-central1"
gcloud config set project "$PROJECT_ID"

# 2. Enable required APIs
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com

# 3. Deploy backend
gcloud builds submit --config cloudbuild.yaml

# 4. Get backend URL
export BACKEND_URL=$(gcloud run services describe shuffle-sync-backend \
  --region=$REGION \
  --format='value(status.url)')

# 5. Set backend OAuth credentials
gcloud run services update shuffle-sync-backend \
  --region=$REGION \
  --set-env-vars GOOGLE_CLIENT_ID=your-client-id \
  --set-env-vars GOOGLE_CLIENT_SECRET=your-client-secret \
  --set-env-vars AUTH_SECRET=$(openssl rand -hex 32) \
  --set-env-vars AUTH_TRUST_HOST=true

# 6. Deploy frontend with backend URL
gcloud builds submit --config cloudbuild-frontend.yaml

# 7. Update frontend with backend URL (if needed)
gcloud run services update shuffle-sync-frontend \
  --region=$REGION \
  --set-env-vars BACKEND_URL=$BACKEND_URL

# 8. Verify deployment
gcloud run services list --region=$REGION
```

**Documentation:** [Deployment Checklist](DEPLOYMENT_CHECKLIST.md)

### Debugging Failed Deployment

```bash
# 1. Check service status
gcloud run services list --region=us-central1 | grep shuffle-sync

# 2. Get service details
gcloud run services describe shuffle-sync-backend \
  --region=us-central1

# 3. Check environment variables
gcloud run services describe shuffle-sync-backend \
  --region=us-central1 \
  --format="value(spec.template.spec.containers[0].env)"

# 4. View recent logs
gcloud logging read \
  "resource.type=cloud_run_revision AND resource.labels.service_name=shuffle-sync-backend" \
  --limit 50

# 5. Check build logs
gcloud builds list --limit=5
gcloud builds log BUILD_ID
```

**Documentation:** [Troubleshooting Configuration Error](TROUBLESHOOTING_CONFIGURATION_ERROR.md)

### Service Name Validation

```bash
# Find actual service names (handles naming variations)
gcloud run services list --region=us-central1 | grep shuffle

# Common variations:
# - shuffle-sync-frontend vs shuffle-sync-front
# - shuffle-sync-backend vs shuffle-sync-back

# Store in variables for consistent use
FRONTEND_SERVICE=$(gcloud run services list --region=us-central1 \
  --format="value(name)" | grep "shuffle.*front")
BACKEND_SERVICE=$(gcloud run services list --region=us-central1 \
  --format="value(name)" | grep "shuffle.*back")

echo "Frontend: $FRONTEND_SERVICE"
echo "Backend: $BACKEND_SERVICE"
```

**Why this is important:** Service names can vary between deployments  
**Documentation:** [Cloud Run Service Name Fix](CLOUD_RUN_SERVICE_NAME_FIX.md)

---

## Troubleshooting

### Common Issues

#### Issue: "Service not found"

```bash
# List all services to find correct name
gcloud run services list --region=us-central1

# Check if service exists in different region
gcloud run services list --region=us-east1
```

#### Issue: "Permission denied"

```bash
# Check current authentication
gcloud auth list

# Re-authenticate if needed
gcloud auth login

# Verify project access
gcloud projects get-iam-policy $PROJECT_ID
```

#### Issue: "API not enabled"

```bash
# Enable the required API
gcloud services enable REQUIRED_API.googleapis.com

# Example: Enable Cloud Run API
gcloud services enable run.googleapis.com
```

#### Issue: "Deployment fails"

```bash
# View build logs
gcloud builds list --limit=5
gcloud builds log FAILING_BUILD_ID

# Check Cloud Run logs
gcloud logging read "resource.type=cloud_run_revision" \
  --limit 50 \
  --freshness=1h
```

### Automated Diagnostics

```bash
# Run automated authentication diagnostics
npm run diagnose:auth

# Run deployment verification
npm run verify:cloudrun
```

**Documentation:** 
- [Quick Fix Auth Error](QUICK_FIX_AUTH_ERROR.md)
- [Auth Error Quick Reference](AUTH_ERROR_QUICK_REFERENCE.md)

---

## Related Documentation

### Deployment & Configuration
- [Deployment Guide](deployment/DEPLOYMENT.md) - Complete deployment instructions
- [Deployment Checklist](DEPLOYMENT_CHECKLIST.md) - Step-by-step deployment guide
- [Configuration Files Guide](CONFIGURATION_FILES_GUIDE.md) - Configuration management

### Troubleshooting
- [Quick Fix Auth Error](QUICK_FIX_AUTH_ERROR.md) - Fast authentication fixes
- [Auth Error Quick Reference](AUTH_ERROR_QUICK_REFERENCE.md) - Quick reference card
- [Troubleshooting Configuration Error](TROUBLESHOOTING_CONFIGURATION_ERROR.md) - Detailed troubleshooting

### Cloud Run Specific
- [Cloud Run Frontend/Backend Setup](CLOUD_RUN_FRONTEND_BACKEND_SETUP.md) - Architecture guide
- [Cloud Run Service Name Fix](CLOUD_RUN_SERVICE_NAME_FIX.md) - Service naming issues
- [Cloud Run Auth Fix](CLOUD_RUN_AUTH_FIX.md) - Authentication configuration

### Scripts & Automation
- **Deployment script**: `scripts/deploy-cloud-run.sh` - Automated deployment
- **Diagnostics script**: `scripts/diagnose-auth-error.sh` - Troubleshooting automation
- **Verification script**: `scripts/verify-cloud-run-deployment.sh` - Deployment verification

---

## Document Maintenance

### Update Process

When adding new Google Cloud commands to the project:

1. **Add command to this reference** with proper categorization
2. **Include purpose and use case** explanation
3. **Add example usage** with realistic values
4. **Link to related documentation** where the command is used
5. **Update table of contents** if adding new category
6. **Update "Last Updated" date** at the top of this document

### Contributing

To contribute improvements to this documentation:

1. Test all commands before adding them
2. Use consistent formatting (see existing examples)
3. Include error handling and troubleshooting tips
4. Cross-reference with other documentation
5. Update related guides that reference these commands

---

**Maintainers:** DevOps Team, All Contributors  
**Last Review:** January 2025  
**Next Review:** Quarterly or when significant changes are made

---

## Quick Command Index

### Deployment
- `gcloud builds submit --config cloudbuild.yaml` - Deploy backend
- `gcloud builds submit --config cloudbuild-frontend.yaml` - Deploy frontend

### Service Management
- `gcloud run services list --region=us-central1` - List services
- `gcloud run services describe SERVICE_NAME --region=us-central1` - Service details
- `gcloud run services update SERVICE_NAME --set-env-vars KEY=VALUE` - Update config

### Debugging
- `gcloud logging read "resource.type=cloud_run_revision" --limit 50` - View logs
- `gcloud run services describe SERVICE_NAME --format="value(spec.template.spec.containers[0].env)"` - Check env vars
- `npm run diagnose:auth` - Automated diagnostics

---

*For questions or issues with these commands, refer to the [Troubleshooting](#troubleshooting) section or check the [Related Documentation](#related-documentation).*
