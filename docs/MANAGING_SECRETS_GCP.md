# Managing Secrets with Google Secret Manager

**Last Updated:** January 2025  
**Purpose:** Comprehensive guide for secure secret management using Google Secret Manager  
**Status:** Production Ready

---

## 📚 Table of Contents

- [Overview](#overview)
- [Why Use Google Secret Manager](#why-use-google-secret-manager)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Step-by-Step Setup](#step-by-step-setup)
  - [1. Enable Secret Manager API](#1-enable-secret-manager-api)
  - [2. Create Secrets](#2-create-secrets)
  - [3. Configure Access Control](#3-configure-access-control)
  - [4. Access Secrets in Applications](#4-access-secrets-in-applications)
    - [4.3 Cloud Run Authentication Policy](#43-cloud-run-authentication-policy)
- [Local Development](#local-development)
- [CI/CD Integration](#cicd-integration)
- [Secret Rotation](#secret-rotation)
- [Audit and Monitoring](#audit-and-monitoring)
- [TypeScript/Node.js Integration](#typescriptnodejs-integration)
- [Best Practices](#best-practices)
- [Security Checklist](#security-checklist)
- [Troubleshooting](#troubleshooting)

---

## Overview

This guide provides comprehensive instructions for managing secrets securely using Google Secret Manager and the Google Cloud SDK for the Shuffle & Sync project. **NEVER commit secrets to version control** - use Secret Manager for all production secrets.

### What are Secrets?

Secrets are sensitive configuration values that should never be exposed in code or version control:

- API keys (SendGrid, Twitch, YouTube, etc.)
- OAuth client secrets (Google, Discord, etc.)
- Database credentials and connection strings
- Authentication secrets (JWT signing keys, session secrets)
- Encryption keys
- Service account keys
- Webhook verification tokens

---

## Why Use Google Secret Manager

### Benefits

✅ **Centralized Management** - All secrets in one secure location  
✅ **Version Control** - Track secret versions and rollback if needed  
✅ **Access Control** - Fine-grained IAM permissions  
✅ **Audit Logging** - Track who accessed which secrets and when  
✅ **Automatic Rotation** - Update secrets without redeploying  
✅ **Encryption** - Secrets encrypted at rest and in transit  
✅ **Integration** - Native integration with Cloud Run, Cloud Build, and other GCP services

### Comparison to Other Methods

| Method | Security | Rotation | Audit | Recommended |
|--------|----------|----------|-------|-------------|
| `.env` files in repo | ❌ Very Low | ❌ Manual | ❌ None | ❌ Never use |
| Environment variables only | ⚠️ Low | ⚠️ Manual | ⚠️ Limited | ⚠️ Development only |
| Google Secret Manager | ✅ High | ✅ Automated | ✅ Complete | ✅ Production use |

---

## Prerequisites

Before you begin, ensure you have:

- [ ] **Google Cloud SDK (gcloud CLI)** installed - [Installation Guide](https://cloud.google.com/sdk/docs/install)
- [ ] **Active GCP Project** with billing enabled
- [ ] **Appropriate IAM permissions**:
  - `roles/secretmanager.admin` - To create and manage secrets
  - `roles/iam.securityAdmin` - To grant access to secrets
- [ ] **Authenticated** with Google Cloud:
  ```bash
  gcloud auth login
  gcloud config set project YOUR_PROJECT_ID
  ```

### Verify Installation

```bash
# Check gcloud version
gcloud version

# Check current project
gcloud config get-value project

# Check authentication
gcloud auth list
```

---

## Quick Start

For experienced users, here's a rapid deployment workflow:

```bash
# 1. Set project variables
export PROJECT_ID="your-project-id"
export PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
export REGION="us-central1"

# 2. Enable Secret Manager API
gcloud services enable secretmanager.googleapis.com

# 3. Create all required secrets
echo -n "$(openssl rand -base64 64)" | gcloud secrets create auth-secret --data-file=-
echo -n "YOUR_GOOGLE_CLIENT_SECRET" | gcloud secrets create google-client-secret --data-file=-
echo -n "YOUR_DATABASE_URL" | gcloud secrets create database-url --data-file=-
echo -n "YOUR_SENDGRID_API_KEY" | gcloud secrets create sendgrid-api-key --data-file=-
echo -n "admin@yourdomain.com" | gcloud secrets create master-admin-email --data-file=-

# 4. Grant Cloud Run service access to secrets
for SECRET in auth-secret google-client-secret database-url sendgrid-api-key master-admin-email; do
  gcloud secrets add-iam-policy-binding $SECRET \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
done

# 5. Configure Cloud Run to use secrets (see deployment docs)
```

---

## Step-by-Step Setup

### 1. Enable Secret Manager API

First, enable the Secret Manager API in your Google Cloud Project:

```bash
# Enable the Secret Manager API
gcloud services enable secretmanager.googleapis.com

# Verify it's enabled
gcloud services list --enabled | grep secretmanager
```

**Expected output:**
```
secretmanager.googleapis.com          Secret Manager API
```

---

### 2. Create Secrets

Create secrets for all sensitive configuration values used by Shuffle & Sync.

#### 2.1 Authentication Secret

The most critical secret - used for JWT signing and session encryption:

```bash
# Generate and create AUTH_SECRET (64+ characters recommended)
echo -n "$(openssl rand -base64 64)" | gcloud secrets create auth-secret \
  --replication-policy="automatic" \
  --data-file=-

# Verify creation
gcloud secrets describe auth-secret
```

**Options explained:**
- `--replication-policy="automatic"` - Replicate across multiple regions for high availability
- `--data-file=-` - Read secret value from stdin (more secure than command line)
- `echo -n` - No trailing newline (important for exact secret values)

#### 2.2 Database Connection String

Store your SQLite Cloud or database connection URL:

```bash
# Create DATABASE_URL secret
# Replace with your actual connection string
echo -n "sqlitecloud://your-host.sqlite.cloud:8860/shuffleandsync?apikey=YOUR_API_KEY" | \
  gcloud secrets create database-url \
  --replication-policy="automatic" \
  --data-file=-
```

**Security Note:** Never include the connection string in command history. Consider creating from a file:

```bash
# Alternative: Create from file (more secure)
echo -n "YOUR_DATABASE_URL" > /tmp/db-url.txt
gcloud secrets create database-url \
  --replication-policy="automatic" \
  --data-file=/tmp/db-url.txt
rm /tmp/db-url.txt  # Clean up immediately
```

#### 2.3 Google OAuth Credentials

Store Google OAuth client credentials:

```bash
# Google Client ID (less sensitive, but good practice)
echo -n "YOUR_CLIENT_ID.apps.googleusercontent.com" | \
  gcloud secrets create google-client-id --data-file=-

# Google Client Secret (highly sensitive)
echo -n "GOCSPX-YOUR_CLIENT_SECRET" | \
  gcloud secrets create google-client-secret --data-file=-
```

#### 2.4 SendGrid API Key

For email notifications:

```bash
echo -n "SG.YOUR_SENDGRID_API_KEY" | \
  gcloud secrets create sendgrid-api-key --data-file=-
```

#### 2.5 Master Admin Email

Admin account configuration:

```bash
echo -n "admin@yourdomain.com" | \
  gcloud secrets create master-admin-email --data-file=-
```

#### 2.6 Streaming Platform Credentials

For Twitch, YouTube, Discord integrations:

```bash
# Twitch
echo -n "YOUR_TWITCH_CLIENT_ID" | gcloud secrets create twitch-client-id --data-file=-
echo -n "YOUR_TWITCH_CLIENT_SECRET" | gcloud secrets create twitch-client-secret --data-file=-

# YouTube
echo -n "YOUR_YOUTUBE_API_KEY" | gcloud secrets create youtube-api-key --data-file=-

# Discord
echo -n "YOUR_DISCORD_BOT_TOKEN" | gcloud secrets create discord-bot-token --data-file=-
```

#### 2.7 Encryption Keys

For stream key encryption and other sensitive operations:

```bash
# Generate 32-character encryption key
echo -n "$(openssl rand -hex 16)" | \
  gcloud secrets create stream-key-encryption-key --data-file=-
```

#### 2.8 List All Secrets

Verify all secrets are created:

```bash
# List all secrets in project
gcloud secrets list

# Get details of a specific secret (does not show value)
gcloud secrets describe auth-secret
```

---

### 3. Configure Access Control

Grant appropriate permissions to service accounts and users.

#### 3.1 Get Project Number

You'll need your project number for IAM bindings:

```bash
# Get project number
export PROJECT_ID="your-project-id"
export PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID \
  --format='value(projectNumber)')

echo "Project Number: $PROJECT_NUMBER"
```

#### 3.2 Grant Cloud Run Access

Allow Cloud Run services to access secrets:

```bash
# Default Compute Engine service account (used by Cloud Run)
export SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

# Grant access to each secret
gcloud secrets add-iam-policy-binding auth-secret \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding google-client-secret \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding database-url \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor"

# Grant access to all secrets at once (bulk operation)
for SECRET in auth-secret google-client-id google-client-secret database-url \
              sendgrid-api-key master-admin-email stream-key-encryption-key \
              twitch-client-id twitch-client-secret youtube-api-key discord-bot-token; do
  gcloud secrets add-iam-policy-binding $SECRET \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor" 2>/dev/null || echo "Secret $SECRET not found, skipping..."
done
```

#### 3.3 Grant Cloud Build Access

Allow Cloud Build to access secrets during builds:

```bash
# Cloud Build service account
export CLOUD_BUILD_ACCOUNT="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

# Grant access
for SECRET in auth-secret google-client-id google-client-secret database-url; do
  gcloud secrets add-iam-policy-binding $SECRET \
    --member="serviceAccount:${CLOUD_BUILD_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor" 2>/dev/null || echo "Secret $SECRET not found, skipping..."
done
```

#### 3.4 Grant Developer Access (Optional)

Allow specific developers to view/edit secrets:

```bash
# Grant a user access to view secret metadata (not values)
gcloud secrets add-iam-policy-binding auth-secret \
  --member="user:developer@yourdomain.com" \
  --role="roles/secretmanager.viewer"

# Grant a user access to read secret values
gcloud secrets add-iam-policy-binding auth-secret \
  --member="user:developer@yourdomain.com" \
  --role="roles/secretmanager.secretAccessor"

# Grant admin access to manage secrets
gcloud secrets add-iam-policy-binding auth-secret \
  --member="user:admin@yourdomain.com" \
  --role="roles/secretmanager.admin"
```

#### 3.5 Verify Permissions

Check IAM policy for a secret:

```bash
gcloud secrets get-iam-policy auth-secret
```

---

### 4. Access Secrets in Applications

#### 4.1 Cloud Run Configuration

Configure Cloud Run to mount secrets as environment variables:

```bash
# Deploy with secrets as environment variables
gcloud run deploy shuffle-sync-backend \
  --region=us-central1 \
  --image=gcr.io/$PROJECT_ID/shuffle-sync-backend:latest \
  --no-allow-unauthenticated \
  --set-secrets="AUTH_SECRET=auth-secret:latest" \
  --set-secrets="GOOGLE_CLIENT_SECRET=google-client-secret:latest" \
  --set-secrets="DATABASE_URL=database-url:latest" \
  --set-secrets="SENDGRID_API_KEY=sendgrid-api-key:latest"
```

**Format:** `ENV_VAR_NAME=secret-name:version`
- `latest` - Always use the latest version
- `1`, `2`, etc. - Pin to specific version

**🔒 Security Note:** Always use `--no-allow-unauthenticated` for backend services. See [section 4.3](#43-cloud-run-authentication-policy) for detailed security guidance.

#### 4.2 Cloud Build Integration

Reference secrets in `cloudbuild.yaml`:

```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - 'gcr.io/$PROJECT_ID/shuffle-sync-backend'
      - '.'
    secretEnv:
      - 'DATABASE_URL'
      - 'AUTH_SECRET'

availableSecrets:
  secretManager:
    - versionName: projects/$PROJECT_ID/secrets/database-url/versions/latest
      env: 'DATABASE_URL'
    - versionName: projects/$PROJECT_ID/secrets/auth-secret/versions/latest
      env: 'AUTH_SECRET'
```

#### 4.3 Cloud Run Authentication Policy

**🔒 SECURITY CRITICAL: Unauthenticated invocations MUST be disabled for shuffle-sync-backend**

When deploying the shuffle-sync-backend service to Google Cloud Run, **always disable unauthenticated invocations**. This is a critical security requirement to protect your backend endpoints from unauthorized access.

##### Why Disable Unauthenticated Access?

Allowing unauthenticated invocations (`--allow-unauthenticated`) exposes serious security risks:

- **❌ Public Exposure**: Backend endpoints become accessible to anyone on the internet
- **❌ Bypass Authentication**: Attackers can bypass your Auth.js authentication layer
- **❌ Data Leakage**: Sensitive data may be exposed through unprotected API endpoints
- **❌ Resource Abuse**: Services can be abused for DDoS attacks or cryptocurrency mining
- **❌ Security Compliance**: Violates security best practices and compliance requirements

##### Correct Deployment Configuration

**✅ DO - Disable unauthenticated access for backend:**

```bash
# Deploy shuffle-sync-backend with authentication required
gcloud run deploy shuffle-sync-backend \
  --region=us-central1 \
  --image=gcr.io/$PROJECT_ID/shuffle-sync-backend:latest \
  --no-allow-unauthenticated \
  --set-secrets="AUTH_SECRET=auth-secret:latest" \
  --set-secrets="GOOGLE_CLIENT_SECRET=google-client-secret:latest" \
  --set-secrets="DATABASE_URL=database-url:latest" \
  --set-secrets="SENDGRID_API_KEY=sendgrid-api-key:latest"
```

**Note:** The `--no-allow-unauthenticated` flag ensures only authenticated requests can access the backend.

**✅ Frontend services** (shuffle-sync-frontend) should allow unauthenticated access since they serve public web content:

```bash
# Frontend can allow unauthenticated access
gcloud run deploy shuffle-sync-frontend \
  --region=us-central1 \
  --image=gcr.io/$PROJECT_ID/shuffle-sync-frontend:latest \
  --allow-unauthenticated
```

##### Granting Access via IAM

When authentication is required, you must explicitly grant access using IAM policies:

```bash
# Grant the frontend service account access to invoke the backend
export PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) \
  --format='value(projectNumber)')

# Allow frontend to call backend
gcloud run services add-iam-policy-binding shuffle-sync-backend \
  --region=us-central1 \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/run.invoker"

# Allow specific users (for testing/debugging only)
gcloud run services add-iam-policy-binding shuffle-sync-backend \
  --region=us-central1 \
  --member="user:developer@yourdomain.com" \
  --role="roles/run.invoker"
```

##### Verifying Authentication Configuration

Check if authentication is properly configured:

```bash
# Check current IAM policy
gcloud run services get-iam-policy shuffle-sync-backend \
  --region=us-central1

# Verify service configuration
gcloud run services describe shuffle-sync-backend \
  --region=us-central1 \
  --format="value(spec.template.metadata.annotations['run.googleapis.com/ingress'])"
```

##### Updating Existing Services

If you have an existing service with unauthenticated access enabled, update it immediately:

```bash
# Remove public access from backend
gcloud run services update shuffle-sync-backend \
  --region=us-central1 \
  --no-allow-unauthenticated

# Grant necessary IAM permissions (see above)
```

##### References

- [Google Cloud Run: Authenticating Service-to-Service](https://cloud.google.com/run/docs/authenticating/service-to-service)
- [Google Cloud Run: Managing Access with IAM](https://cloud.google.com/run/docs/securing/managing-access)
- [Auth.js Security Best Practices](https://authjs.dev/guides/basics/security)

---

## Local Development

### Method 1: Use `.env.local` (Recommended)

For local development, use `.env.local` file (already in `.gitignore`):

```bash
# Create .env.local
cp .env.production.template .env.local

# Manually fetch secrets and populate .env.local
echo "AUTH_SECRET=$(gcloud secrets versions access latest --secret=auth-secret)" >> .env.local
echo "DATABASE_URL=$(gcloud secrets versions access latest --secret=database-url)" >> .env.local
```

**Important:** `.env.local` is in `.gitignore` and should NEVER be committed!

### Method 2: Fetch Secrets on Demand

Create a helper script to fetch secrets:

```bash
#!/bin/bash
# scripts/fetch-secrets.sh

# Fetch all secrets from Secret Manager
export AUTH_SECRET=$(gcloud secrets versions access latest --secret=auth-secret)
export DATABASE_URL=$(gcloud secrets versions access latest --secret=database-url)
export GOOGLE_CLIENT_SECRET=$(gcloud secrets versions access latest --secret=google-client-secret)
export SENDGRID_API_KEY=$(gcloud secrets versions access latest --secret=sendgrid-api-key)

echo "✅ Secrets loaded from Google Secret Manager"
echo "Run: source scripts/fetch-secrets.sh"
```

Usage:

```bash
# Make executable
chmod +x scripts/fetch-secrets.sh

# Source to load into current shell
source scripts/fetch-secrets.sh

# Run application
npm run dev
```

> **Note**: Windows users with Git Bash should run: `source scripts/fetch-secrets.sh` (the `source` command works in Git Bash).

### Method 3: Direct Access in Code

Use the Secret Manager client library (see TypeScript integration section below).

---

## CI/CD Integration

### GitHub Actions

Access secrets in GitHub Actions workflows:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloud Run

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v1
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      
      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v1
      
      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy shuffle-sync-backend \
            --region=us-central1 \
            --image=gcr.io/$PROJECT_ID/shuffle-sync-backend:latest \
            --no-allow-unauthenticated \
            --set-secrets="AUTH_SECRET=auth-secret:latest,DATABASE_URL=database-url:latest"
```

### Cloud Build

Cloud Build automatically has access to secrets via IAM (configured in step 3.3):

```yaml
# cloudbuild.yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/app', '.']
    secretEnv: ['DATABASE_URL', 'AUTH_SECRET']

  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'shuffle-sync-backend'
      - '--image=gcr.io/$PROJECT_ID/app'
      - '--region=us-central1'
      - '--no-allow-unauthenticated'
      - '--set-secrets=DATABASE_URL=database-url:latest'

availableSecrets:
  secretManager:
    - versionName: projects/$PROJECT_ID/secrets/database-url/versions/latest
      env: 'DATABASE_URL'
    - versionName: projects/$PROJECT_ID/secrets/auth-secret/versions/latest
      env: 'AUTH_SECRET'
```

---

## Secret Rotation

Regular secret rotation is critical for security.

### Manual Rotation

#### Update a Secret

```bash
# Method 1: From stdin
echo -n "NEW_SECRET_VALUE" | gcloud secrets versions add auth-secret --data-file=-

# Method 2: From file
echo -n "NEW_SECRET_VALUE" > /tmp/new-secret.txt
gcloud secrets versions add auth-secret --data-file=/tmp/new-secret.txt
rm /tmp/new-secret.txt

# Verify new version
gcloud secrets versions list auth-secret
```

#### Rotate AUTH_SECRET

```bash
# Generate new AUTH_SECRET
NEW_AUTH_SECRET=$(openssl rand -base64 64)

# Add new version
echo -n "$NEW_AUTH_SECRET" | gcloud secrets versions add auth-secret --data-file=-

# Cloud Run will automatically use the latest version on next deployment
# Or force immediate update:
gcloud run services update shuffle-sync-backend \
  --region=us-central1 \
  --update-secrets="AUTH_SECRET=auth-secret:latest"
```

### Rotation Schedule

Recommended rotation frequency:

| Secret Type | Rotation Frequency | Critical? |
|-------------|-------------------|-----------|
| AUTH_SECRET | Every 90 days | ✅ Yes |
| Database credentials | Every 90 days | ✅ Yes |
| API keys (SendGrid, etc.) | Every 180 days | ⚠️ Medium |
| OAuth client secrets | Annually or on compromise | ⚠️ Medium |
| Encryption keys | Every 90 days | ✅ Yes |

### Zero-Downtime Rotation

For critical services, use versioned deployment:

```bash
# 1. Create new secret version
echo -n "NEW_VALUE" | gcloud secrets versions add auth-secret --data-file=-

# 2. Deploy new revision with new secret
gcloud run deploy shuffle-sync-backend \
  --region=us-central1 \
  --image=gcr.io/$PROJECT_ID/shuffle-sync-backend:latest \
  --no-allow-unauthenticated \
  --set-secrets="AUTH_SECRET=auth-secret:latest" \
  --no-traffic  # Don't route traffic yet

# 3. Test new revision
# ... manual testing ...

# 4. Gradually shift traffic
gcloud run services update-traffic shuffle-sync-backend \
  --region=us-central1 \
  --to-latest=50  # 50% traffic to new revision

# 5. If successful, route all traffic
gcloud run services update-traffic shuffle-sync-backend \
  --region=us-central1 \
  --to-latest=100
```

### Disable Old Versions

```bash
# Disable a specific version (cannot be accessed)
gcloud secrets versions disable 1 --secret=auth-secret

# Re-enable if needed
gcloud secrets versions enable 1 --secret=auth-secret

# Destroy permanently (cannot be undone)
gcloud secrets versions destroy 1 --secret=auth-secret
```

---

## Audit and Monitoring

### View Secret Access Logs

```bash
# View who accessed secrets
gcloud logging read "resource.type=secretmanager_secret" \
  --limit=50 \
  --format=json

# Filter by specific secret
gcloud logging read "resource.type=secretmanager_secret AND \
  resource.labels.secret_id=auth-secret" \
  --limit=50

# View access in the last 24 hours
gcloud logging read "resource.type=secretmanager_secret AND \
  timestamp>=2025-01-01T00:00:00Z" \
  --limit=100
```

### Set Up Alerts

Create alerts for suspicious secret access:

```bash
# Create log-based metric
gcloud logging metrics create secret-access-count \
  --description="Count of secret accesses" \
  --log-filter='resource.type="secretmanager_secret"'

# Create alert policy (via Console or Cloud Monitoring API)
```

### Audit Secret Permissions

```bash
# Review all IAM policies
for SECRET in $(gcloud secrets list --format='value(name)'); do
  echo "=== $SECRET ==="
  gcloud secrets get-iam-policy $SECRET
  echo ""
done
```

### Regular Security Audit Checklist

Run this quarterly:

```bash
#!/bin/bash
# scripts/audit-secrets.sh

echo "=== Secret Manager Security Audit ==="
echo ""

echo "1. Listing all secrets:"
gcloud secrets list --format="table(name,createTime,replication)"
echo ""

echo "2. Checking for secrets without rotation:"
# Add custom logic to check last rotation date

echo "3. Reviewing IAM permissions:"
for SECRET in $(gcloud secrets list --format='value(name)'); do
  echo "Secret: $SECRET"
  gcloud secrets get-iam-policy $SECRET --format="table(bindings.members)"
done

echo "4. Checking for old versions:"
for SECRET in $(gcloud secrets list --format='value(name)'); do
  COUNT=$(gcloud secrets versions list $SECRET --format='value(name)' | wc -l)
  echo "Secret $SECRET has $COUNT versions"
done
```

---

## TypeScript/Node.js Integration

### Install Secret Manager Client

```bash
npm install @google-cloud/secret-manager
```

### Basic Usage

```typescript
// server/lib/secrets.ts
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const client = new SecretManagerServiceClient();

/**
 * Access a secret from Google Secret Manager
 * @param secretName - Name of the secret
 * @param version - Version of the secret (default: 'latest')
 * @returns Secret value as string
 */
export async function accessSecret(
  secretName: string,
  version: string = 'latest'
): Promise<string> {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  
  if (!projectId) {
    throw new Error('GOOGLE_CLOUD_PROJECT environment variable not set');
  }

  const name = `projects/${projectId}/secrets/${secretName}/versions/${version}`;

  try {
    const [version] = await client.accessSecretVersion({ name });
    const payload = version.payload?.data?.toString();
    
    if (!payload) {
      throw new Error(`Secret ${secretName} is empty`);
    }
    
    return payload;
  } catch (error) {
    console.error(`Error accessing secret ${secretName}:`, error);
    throw error;
  }
}

/**
 * Load all application secrets
 * Use this during application startup if not using Cloud Run secret mounting
 */
export async function loadSecrets(): Promise<void> {
  try {
    // Only load from Secret Manager if not already set
    if (!process.env.AUTH_SECRET) {
      process.env.AUTH_SECRET = await accessSecret('auth-secret');
    }
    
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL = await accessSecret('database-url');
    }
    
    if (!process.env.GOOGLE_CLIENT_SECRET) {
      process.env.GOOGLE_CLIENT_SECRET = await accessSecret('google-client-secret');
    }
    
    console.log('✅ Secrets loaded from Google Secret Manager');
  } catch (error) {
    console.error('❌ Failed to load secrets:', error);
    throw error;
  }
}
```

### Usage in Application

```typescript
// server/index.ts
import express from 'express';
import { loadSecrets } from './lib/secrets';

async function startServer() {
  // Load secrets before starting server (if not using Cloud Run mounting)
  if (process.env.NODE_ENV === 'production' && !process.env.AUTH_SECRET) {
    await loadSecrets();
  }

  const app = express();
  
  // ... configure app ...
  
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
```

### Caching Secrets

For better performance, cache secrets in memory:

```typescript
// server/lib/secrets-cache.ts
const secretsCache = new Map<string, { value: string; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getCachedSecret(secretName: string): Promise<string> {
  const cached = secretsCache.get(secretName);
  
  if (cached && cached.expiry > Date.now()) {
    return cached.value;
  }
  
  const value = await accessSecret(secretName);
  secretsCache.set(secretName, {
    value,
    expiry: Date.now() + CACHE_TTL
  });
  
  return value;
}
```

---

## Best Practices

### ✅ DO

1. **Use Secret Manager for all production secrets**
   - Never hardcode secrets in code
   - Never commit secrets to version control
   - Use `.gitignore` for local environment files

2. **Use meaningful secret names**
   - Good: `auth-secret`, `database-url`, `sendgrid-api-key`
   - Bad: `secret1`, `key`, `password`

3. **Use automatic replication**
   - Ensures high availability across regions
   - Recommended for production secrets

4. **Grant least-privilege access**
   - Only grant `secretAccessor` to services that need it
   - Use separate secrets for different environments
   - Regularly audit IAM permissions

5. **Rotate secrets regularly**
   - Critical secrets: every 90 days
   - Rotate immediately if compromised
   - Use versioning for zero-downtime rotation

6. **Monitor secret access**
   - Enable Cloud Logging
   - Set up alerts for unusual access patterns
   - Regular security audits

7. **Use versions**
   - Pin to specific versions in production
   - Use `latest` only for non-critical environments
   - Keep old versions for rollback

### ❌ DON'T

1. **Never commit `.env.production` to version control**
   - Use `.env.production.template` as reference only
   - `.env.production` should be in `.gitignore`
   - Delete any accidentally committed secrets immediately

2. **Don't share secrets via insecure channels**
   - No email, Slack, or chat
   - No screenshots containing secrets
   - Use Secret Manager sharing via IAM

3. **Don't use the same secret across environments**
   - Separate secrets for dev, staging, production
   - Name convention: `auth-secret-dev`, `auth-secret-prod`

4. **Don't grant broad access**
   - Avoid `roles/secretmanager.admin` for services
   - Use `roles/secretmanager.secretAccessor` for read-only
   - Limit human access to specific secrets

5. **Don't ignore rotation**
   - Set calendar reminders
   - Automate rotation where possible
   - Document rotation procedures

6. **Don't log secret values**
   - Mask secrets in application logs
   - Use structured logging
   - Be careful with error messages

---

## Security Checklist

Use this checklist for ongoing secret hygiene:

### Initial Setup
- [ ] Secret Manager API enabled
- [ ] All required secrets created
- [ ] IAM permissions configured (least-privilege)
- [ ] Cloud Run configured to use secrets
- [ ] `.env.production` deleted from repository
- [ ] `.gitignore` includes `.env.production`
- [ ] Team trained on secret management procedures

### Monthly Tasks
- [ ] Review IAM permissions for secrets
- [ ] Check for orphaned secrets
- [ ] Audit secret access logs
- [ ] Verify no secrets in code or commits
- [ ] Update documentation if procedures changed

### Quarterly Tasks
- [ ] Rotate critical secrets (AUTH_SECRET, database credentials)
- [ ] Review and disable old secret versions
- [ ] Security audit of all secrets
- [ ] Test secret rotation procedures
- [ ] Verify backup and disaster recovery

### Annual Tasks
- [ ] Comprehensive security review
- [ ] Rotate all secrets
- [ ] Review and update secret management policies
- [ ] Team security training refresher
- [ ] Disaster recovery drill

### After Security Incident
- [ ] Immediately rotate affected secrets
- [ ] Review access logs
- [ ] Disable compromised versions
- [ ] Update IAM permissions
- [ ] Document incident and lessons learned

---

## Troubleshooting

### Error: Permission denied

**Symptom:**
```
ERROR: (gcloud.secrets.versions.access) Permission denied
```

**Solution:**
```bash
# Check current permissions
gcloud secrets get-iam-policy SECRET_NAME

# Grant yourself access
gcloud secrets add-iam-policy-binding SECRET_NAME \
  --member="user:$(gcloud config get-value account)" \
  --role="roles/secretmanager.secretAccessor"
```

### Error: Secret not found

**Symptom:**
```
ERROR: (gcloud.secrets.versions.access) NOT_FOUND: Secret [projects/PROJECT_ID/secrets/SECRET_NAME] not found
```

**Solution:**
```bash
# List all secrets
gcloud secrets list

# Create the missing secret
echo -n "SECRET_VALUE" | gcloud secrets create SECRET_NAME --data-file=-
```

### Cloud Run can't access secrets

**Symptom:** Application logs show missing environment variables

**Solution:**
```bash
# 1. Verify secret exists
gcloud secrets describe SECRET_NAME

# 2. Check IAM permissions
gcloud secrets get-iam-policy SECRET_NAME

# 3. Grant Cloud Run service account access
export PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) \
  --format='value(projectNumber)')
gcloud secrets add-iam-policy-binding SECRET_NAME \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# 4. Redeploy Cloud Run service
gcloud run deploy SERVICE_NAME \
  --region=REGION \
  --set-secrets="ENV_VAR=SECRET_NAME:latest"
```

### Secrets not updating

**Symptom:** Changes to secrets not reflected in application

**Solution:**
```bash
# 1. Verify new version created
gcloud secrets versions list SECRET_NAME

# 2. Force Cloud Run to pick up new version
gcloud run services update SERVICE_NAME \
  --region=REGION \
  --update-secrets="ENV_VAR=SECRET_NAME:latest"

# 3. Check deployed revision
gcloud run revisions list --service=SERVICE_NAME --region=REGION
```

### Local development can't access secrets

**Symptom:** `gcloud secrets versions access` fails locally

**Solution:**
```bash
# 1. Ensure you're authenticated
gcloud auth login
gcloud auth application-default login

# 2. Set correct project
gcloud config set project YOUR_PROJECT_ID

# 3. Verify you have permission
gcloud secrets get-iam-policy SECRET_NAME

# 4. Grant yourself access if needed
gcloud secrets add-iam-policy-binding SECRET_NAME \
  --member="user:$(gcloud config get-value account)" \
  --role="roles/secretmanager.secretAccessor"
```

---

## Related Documentation

- [Google Secret Manager Documentation](https://cloud.google.com/secret-manager/docs)
- [Google Cloud SDK Documentation](https://cloud.google.com/sdk/docs)
- [Deployment Guide](deployment/DEPLOYMENT.md)
- [Environment Variables Documentation](../ENVIRONMENT_VARIABLES.md)
- [Google Cloud Commands Reference](GOOGLE_CLOUD_COMMANDS_REFERENCE.md)
- [Security Improvements Guide](SECURITY_IMPROVEMENTS.md)

---

## Summary

**Key Takeaways:**

1. ✅ **Always use Google Secret Manager for production secrets**
2. ❌ **Never commit `.env.production` or any file with real secrets to version control**
3. 🔄 **Rotate secrets regularly (every 90 days for critical secrets)**
4. 🔒 **Grant least-privilege IAM permissions**
5. 📊 **Monitor and audit secret access**
6. 📝 **Document all secret management procedures**
7. 🎯 **Test rotation and recovery procedures regularly**

**Remember:** Security is not a one-time task. Maintain good secret hygiene through regular audits, rotation, and team training.

---

**Questions or Issues?**

If you encounter issues not covered in this guide, please:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review [Google Secret Manager documentation](https://cloud.google.com/secret-manager/docs)
3. Open an issue in the repository with details

---

**Last Updated:** January 2025  
**Maintainer:** Shuffle & Sync Development Team
