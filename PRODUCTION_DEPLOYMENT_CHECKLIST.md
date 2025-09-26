# Production Deployment Checklist

This comprehensive checklist ensures a successful production deployment of Shuffle & Sync to Google Cloud Platform.

## Pre-Deployment Setup

### 1. Infrastructure Setup (GCP)
- [ ] **Google Cloud Project Created**
  - [ ] Project ID configured and noted
  - [ ] Billing account linked to project
  - [ ] Required APIs enabled:
    - [ ] Cloud Run API
    - [ ] Cloud Build API
    - [ ] Container Registry API
    - [ ] Cloud SQL API
    - [ ] Secret Manager API
    - [ ] Cloud Storage API

- [ ] **Service Accounts & IAM**
  - [ ] Cloud Build service account has necessary permissions
  - [ ] Cloud Run service account configured
  - [ ] Database connection permissions set up

### 2. Database Setup (Cloud SQL PostgreSQL)
- [ ] **Cloud SQL Instance Created**
  - [ ] PostgreSQL instance provisioned
  - [ ] Instance tier appropriate for expected load
  - [ ] Database created (e.g., `shuffleandsync_prod`)
  - [ ] Database user created with strong password
  - [ ] Connection security configured (private IP recommended)

- [ ] **Database Configuration**
  - [ ] `DATABASE_URL` connection string prepared
  - [ ] Database migrations tested locally
  - [ ] Backup and recovery procedures documented

### 3. Secret Management
- [ ] **Google Secret Manager Setup**
  - [ ] `AUTH_SECRET` stored (64+ character random string)
  - [ ] `DATABASE_URL` stored
  - [ ] `GOOGLE_CLIENT_ID` stored
  - [ ] `GOOGLE_CLIENT_SECRET` stored
  - [ ] `SENDGRID_API_KEY` stored (if using email)
  - [ ] `STREAM_KEY_ENCRYPTION_KEY` stored (32 characters)

### 4. OAuth Configuration
- [ ] **Google OAuth Setup**
  - [ ] OAuth 2.0 credentials created in Google Console
  - [ ] Authorized redirect URIs configured for production domain
  - [ ] Client ID and secret obtained and stored securely

## Application Configuration

### 5. Environment Variables
- [ ] **Production Environment File**
  - [ ] Copy `.env.production.template` to `.env.production`
  - [ ] Fill in all required values
  - [ ] Verify no development values remain
  - [ ] Test environment validation locally

### 6. Security Configuration
- [ ] **Security Settings Verified**
  - [ ] Strong `AUTH_SECRET` generated (64+ characters)
  - [ ] `SESSION_SECRET` different from `AUTH_SECRET`
  - [ ] CORS origins properly configured
  - [ ] Rate limiting settings appropriate for production
  - [ ] HTTPS redirect enabled

### 7. Code Quality & Testing
- [ ] **Pre-Deployment Validation**
  - [ ] All tests passing: `npm test`
  - [ ] Code linting clean: `npm run lint`
  - [ ] Build successful: `npm run build`
  - [ ] Security scan completed (if using CodeQL or similar)
  - [ ] Dependencies updated and vulnerability-free

## Deployment Process

### 8. Docker Images
- [ ] **Backend Container**
  - [ ] `Dockerfile` optimized for production
  - [ ] Health check endpoint working (`/api/health`)
  - [ ] Image builds successfully locally
  - [ ] Production dependencies only

- [ ] **Frontend Container**
  - [ ] `Dockerfile.frontend` configured with NGINX
  - [ ] Static assets served correctly
  - [ ] Image builds successfully locally
  - [ ] NGINX configuration optimized

### 9. Cloud Build Configuration
- [ ] **CI/CD Pipeline**
  - [ ] `cloudbuild.yaml` configured for backend
  - [ ] `cloudbuild-frontend.yaml` configured for frontend
  - [ ] Build triggers set up (manual or automatic)
  - [ ] Container Registry permissions configured

### 10. Cloud Run Deployment
- [ ] **Backend Service**
  - [ ] Service deployed to Cloud Run
  - [ ] Environment variables configured from Secret Manager
  - [ ] Memory and CPU allocations appropriate (1Gi, 1 CPU minimum)
  - [ ] Concurrency settings configured
  - [ ] Min/max instances configured (0 min, 10 max recommended)
  - [ ] Health check endpoint responding

- [ ] **Frontend Service**
  - [ ] Service deployed to Cloud Run
  - [ ] NGINX serving static files correctly
  - [ ] Memory allocation appropriate (512Mi recommended)
  - [ ] CDN configuration (if using)

### 11. Database Migration
- [ ] **Production Data Setup**
  - [ ] Database schema deployed: `npm run db:push`
  - [ ] Initial data seeded (if required)
  - [ ] Database connection verified from Cloud Run
  - [ ] Database performance validated

## Domain & SSL

### 12. Domain Configuration
- [ ] **Custom Domain Setup**
  - [ ] Domain purchased and DNS controlled
  - [ ] Cloud Run custom domain mapping configured
  - [ ] DNS records updated (A/AAAA records or CNAME)
  - [ ] SSL certificate provisioned automatically by Google

- [ ] **SSL/TLS Security**
  - [ ] HTTPS redirect enabled
  - [ ] SSL certificate valid and trusted
  - [ ] Security headers configured
  - [ ] HSTS enabled

## Monitoring & Logging

### 13. Observability Setup
- [ ] **Google Cloud Monitoring**
  - [ ] Cloud Run metrics enabled
  - [ ] Cloud SQL monitoring enabled
  - [ ] Custom dashboards created
  - [ ] Alerting policies configured

- [ ] **Logging Configuration**
  - [ ] Application logs flowing to Cloud Logging
  - [ ] Log retention policies set
  - [ ] Error tracking configured
  - [ ] Performance monitoring enabled

### 14. Health Checks & SLIs
- [ ] **Service Health**
  - [ ] Health check endpoints implemented and tested
  - [ ] Uptime monitoring configured
  - [ ] Performance SLIs defined
  - [ ] Error rate monitoring set up

## Post-Deployment Verification

### 15. Functional Testing
- [ ] **Core Features Verification**
  - [ ] User registration/authentication working
  - [ ] Google OAuth flow functional
  - [ ] Database operations working
  - [ ] API endpoints responding correctly
  - [ ] Real-time features (WebSocket) functional

- [ ] **Integration Testing**
  - [ ] Third-party API integrations working (Twitch, YouTube, etc.)
  - [ ] Email functionality tested (if configured)
  - [ ] Streaming platform integrations verified
  - [ ] Cross-browser compatibility verified

### 16. Performance & Security
- [ ] **Performance Validation**
  - [ ] Page load times acceptable (<3s)
  - [ ] API response times within SLA (<500ms)
  - [ ] Database query performance optimized
  - [ ] CDN serving static assets (if configured)

- [ ] **Security Verification**
  - [ ] HTTPS working correctly
  - [ ] Security headers present
  - [ ] Authentication/authorization working
  - [ ] Rate limiting functional
  - [ ] No sensitive data exposed in logs or responses

### 17. Backup & Recovery
- [ ] **Data Protection**
  - [ ] Database backup schedule configured
  - [ ] Backup restoration tested
  - [ ] Disaster recovery plan documented
  - [ ] RTO/RPO objectives defined

## Go-Live Checklist

### 18. Final Steps
- [ ] **Launch Preparation**
  - [ ] All stakeholders notified
  - [ ] Documentation updated with production URLs
  - [ ] Support procedures documented
  - [ ] Rollback plan prepared

- [ ] **Launch Verification**
  - [ ] Production URLs accessible
  - [ ] All critical user flows tested
  - [ ] Error rates within acceptable limits
  - [ ] Performance metrics baseline established

## Post-Launch Activities

### 19. Ongoing Maintenance
- [ ] **Regular Monitoring**
  - [ ] Daily health checks scheduled
  - [ ] Weekly performance reviews
  - [ ] Monthly security audits
  - [ ] Quarterly disaster recovery testing

- [ ] **Updates & Patches**
  - [ ] Security patch process defined
  - [ ] Feature deployment pipeline established
  - [ ] Change management process documented

## Quick Reference Commands

```bash
# Set up environment
export PROJECT_ID="your-gcp-project-id"
export REGION="us-central1"

# Deploy both services
./scripts/deploy-production.sh

# Deploy backend only
./scripts/deploy-production.sh --backend-only

# Deploy frontend only
./scripts/deploy-production.sh --frontend-only

# Check service status
gcloud run services list --region=$REGION --project=$PROJECT_ID

# View logs
gcloud logs tail "projects/$PROJECT_ID/logs/run.googleapis.com%2Frequests"

# Test health endpoints
curl -f https://your-backend-url/api/health
curl -f https://your-frontend-url/
```

## Troubleshooting

### Common Issues
1. **Build Failures**: Check `cloudbuild.yaml` configuration and dependencies
2. **Health Check Failures**: Verify `/api/health` endpoint and database connectivity
3. **Authentication Issues**: Verify OAuth configuration and redirect URIs
4. **Database Connection**: Check `DATABASE_URL` and network connectivity
5. **Environment Variables**: Ensure all required variables are set in Secret Manager

### Support Resources
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Technical deployment guide
- [SECURITY_IMPROVEMENTS.md](./SECURITY_IMPROVEMENTS.md) - Security best practices
- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Google Cloud Build Documentation](https://cloud.google.com/build/docs)

---

**Note**: This checklist should be completed in order. Each section builds upon the previous ones. Do not skip steps without careful consideration of the implications.