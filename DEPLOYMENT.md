# Deployment Guide - Shuffle & Sync

This comprehensive guide provides step-by-step instructions for deploying Shuffle & Sync to production environments. The platform is optimized for **Google Cloud Platform (Cloud Run)** but can be adapted for other container-based hosting services.

## 📚 Quick Navigation

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Deployment Procedures](#deployment-procedures)
- [Rollback Strategies](#rollback-strategies)
- [Verification Steps](#verification-steps)
- [Troubleshooting](#troubleshooting)
- [Additional Resources](#additional-resources)

---

## Prerequisites

Before deploying to production, ensure you have the following prerequisites in place:

### Required Tools & Access

- [ ] **Google Cloud SDK (gcloud CLI)** - [Installation Guide](https://cloud.google.com/sdk/docs/install)
- [ ] **Docker** - For building container images
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
| `DATABASE_URL` | PostgreSQL connection string | From Cloud SQL or your database provider |
| `AUTH_SECRET` | Authentication secret (64+ chars) | `openssl rand -base64 64` |
| `AUTH_URL` | Production domain URL | `https://your-domain.com` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | From [Google Cloud Console](https://console.cloud.google.com) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | From Google Cloud Console |

#### Step 3: Configure Optional Variables

For enhanced functionality, configure these recommended variables:

| Variable | Description | Purpose |
|----------|-------------|---------|
| `SENDGRID_API_KEY` | SendGrid API key | Email notifications |
| `STREAM_KEY_ENCRYPTION_KEY` | Encryption key (32 chars) | Stream key security |
| `REDIS_URL` | Redis connection string | Caching layer |
| `SENTRY_DSN` | Sentry error tracking | Error monitoring |

#### Step 4: Validate Environment Configuration

```bash
npm run env:validate
```

This validates that all required variables are set and properly formatted.

### 2. Database Setup

#### Cloud SQL PostgreSQL Instance

Create a Cloud SQL PostgreSQL instance:

```bash
# Set variables
export PROJECT_ID="your-gcp-project-id"
export REGION="us-central1"
export INSTANCE_NAME="shuffle-sync-db"

# Create Cloud SQL instance
gcloud sql instances create $INSTANCE_NAME \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=$REGION \
  --root-password="your-secure-root-password" \
  --backup-start-time="03:00" \
  --enable-bin-log \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=03
```

#### Create Production Database

```bash
# Create the application database
gcloud sql databases create shufflesync_prod \
  --instance=$INSTANCE_NAME

# Create application user
gcloud sql users create app_user \
  --instance=$INSTANCE_NAME \
  --password="your-secure-app-password"
```

#### Configure Database Connection

```bash
# Get the connection name
CONNECTION_NAME=$(gcloud sql instances describe $INSTANCE_NAME \
  --format="value(connectionName)")

# For Cloud Run, use Unix socket connection
DATABASE_URL="postgresql://app_user:password@/$DB_NAME?host=/cloudsql/$CONNECTION_NAME"
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

#### 1. Build Docker Images

```bash
# Build backend image
docker build -f Dockerfile -t gcr.io/$PROJECT_ID/shuffle-sync-backend:latest .

# Build frontend image
docker build -f Dockerfile.frontend -t gcr.io/$PROJECT_ID/shuffle-sync-frontend:latest .
```

#### 2. Push to Google Container Registry

```bash
# Configure Docker for GCR
gcloud auth configure-docker

# Push images
docker push gcr.io/$PROJECT_ID/shuffle-sync-backend:latest
docker push gcr.io/$PROJECT_ID/shuffle-sync-frontend:latest
```

#### 3. Deploy to Cloud Run

```bash
# Deploy backend
gcloud run deploy shuffle-sync-backend \
  --image gcr.io/$PROJECT_ID/shuffle-sync-backend:latest \
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
gcloud run deploy shuffle-sync-frontend \
  --image gcr.io/$PROJECT_ID/shuffle-sync-frontend:latest \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 5
```

#### 4. Run Database Migrations

```bash
./scripts/migrate-production-db.sh
```

### Deployment with Cloud Build (CI/CD)

For automated deployments via Cloud Build:

#### Backend Deployment

```bash
gcloud builds submit \
  --config cloudbuild.yaml \
  --substitutions _REGION=$REGION,_SERVICE_NAME=shuffle-sync-backend
```

#### Frontend Deployment

```bash
gcloud builds submit \
  --config cloudbuild-frontend.yaml \
  --substitutions _REGION=$REGION,_SERVICE_NAME=shuffle-sync-frontend
```

### Domain & SSL Configuration

#### Map Custom Domain

```bash
# Map domain to Cloud Run service
gcloud run domain-mappings create \
  --service shuffle-sync-frontend \
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
  --service shuffle-sync-backend \
  --region $REGION \
  --limit 5

# List revisions for frontend
gcloud run revisions list \
  --service shuffle-sync-frontend \
  --region $REGION \
  --limit 5
```

#### 2. Rollback to Previous Revision

```bash
# Rollback backend to previous revision
gcloud run services update-traffic shuffle-sync-backend \
  --to-revisions PREVIOUS_REVISION=100 \
  --region $REGION

# Rollback frontend to previous revision
gcloud run services update-traffic shuffle-sync-frontend \
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
gcloud run deploy shuffle-sync-backend \
  --image gcr.io/$PROJECT_ID/shuffle-sync-backend:latest \
  --region $REGION \
  --no-traffic

# Get the new revision name
NEW_REVISION=$(gcloud run revisions list \
  --service shuffle-sync-backend \
  --region $REGION \
  --format="value(name)" \
  --limit 1)

# Route 10% traffic to new revision
gcloud run services update-traffic shuffle-sync-backend \
  --to-revisions $NEW_REVISION=10,$OLD_REVISION=90 \
  --region $REGION

# Monitor metrics, then increase gradually
gcloud run services update-traffic shuffle-sync-backend \
  --to-revisions $NEW_REVISION=50,$OLD_REVISION=50 \
  --region $REGION

# If successful, route 100% traffic
gcloud run services update-traffic shuffle-sync-backend \
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
BACKEND_URL=$(gcloud run services describe shuffle-sync-backend \
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
FRONTEND_URL=$(gcloud run services describe shuffle-sync-frontend \
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
gcloud run services describe shuffle-sync-backend \
  --region $REGION \
  --format "table(status.conditions)"
```

### 7. Log Analysis

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
gcloud run services describe shuffle-sync-backend \
  --region $REGION \
  --format "yaml(spec.template.spec.containers[0].env)"
```

#### Environment Validation Failures

**Symptom**: Application crashes on startup with missing environment variables

**Solution**: Verify all required variables are configured:

```bash
# Check secret bindings
gcloud run services describe shuffle-sync-backend \
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
gcloud run services update shuffle-sync-backend \
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

#### Memory Issues

**Symptom**: Container crashes with out-of-memory errors

**Solution**: Increase memory allocation:

```bash
gcloud run services update shuffle-sync-backend \
  --region $REGION \
  --memory 2Gi
```

### Getting Help

If you encounter issues not covered here:

1. **Check Logs**: `gcloud run services logs read shuffle-sync-backend --region $REGION`
2. **Review Documentation**: 
   - [Detailed Cloud Run Guide](docs/deployment/DEPLOYMENT.md)
   - [Production Deployment Checklist](PRODUCTION_DEPLOYMENT_CHECKLIST.md)
   - [GCP-Specific Checklist](docs/deployment/PRODUCTION_DEPLOYMENT_CHECKLIST.md)
3. **Check Environment**: Run `npm run env:validate`
4. **Verify Prerequisites**: Ensure all required APIs are enabled
5. **Community Support**: Open an issue on GitHub with detailed error logs

---

## Additional Resources

### Documentation

- **[Production Deployment Checklist](PRODUCTION_DEPLOYMENT_CHECKLIST.md)** - Comprehensive pre-deployment checklist
- **[Cloud Run Deployment Guide](docs/deployment/DEPLOYMENT.md)** - Platform-specific technical details
- **[GCP Deployment Checklist](docs/deployment/PRODUCTION_DEPLOYMENT_CHECKLIST.md)** - Detailed GCP setup instructions
- **[README.md](README.md)** - Project overview and quick start

### Scripts

- **[deploy-production.sh](scripts/deploy-production.sh)** - Automated deployment script
- **[migrate-production-db.sh](scripts/migrate-production-db.sh)** - Database migration script
- **[verify-production.sh](scripts/verify-production.sh)** - Post-deployment verification
- **[setup-env.sh](scripts/setup-env.sh)** - Environment setup helper

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

## Support

For deployment support:

- **Documentation Issues**: Open an issue on GitHub
- **Deployment Questions**: Check existing documentation first
- **Critical Production Issues**: Follow your organization's incident response procedures

---

**Last Updated**: 2024  
**Version**: 1.0.0  
**Platform**: Google Cloud Platform (Cloud Run)
