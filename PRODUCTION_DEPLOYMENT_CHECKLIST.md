# Production Deployment Checklist

This checklist ensures a successful and secure production deployment of Shuffle & Sync. Complete all items in order before deploying to production.

> **📋 Platform-Specific Guide**: For detailed Google Cloud Platform deployment instructions, see [docs/deployment/PRODUCTION_DEPLOYMENT_CHECKLIST.md](docs/deployment/PRODUCTION_DEPLOYMENT_CHECKLIST.md)

---

## 📦 Pre-Deployment Preparation

### Code Quality & Testing
- [ ] All unit tests passing: `npm test`
- [ ] Code linting clean: `npm run lint`
- [ ] Production build successful: `npm run build`
- [ ] No security vulnerabilities in dependencies: `npm audit`
- [ ] All TypeScript type checks passing: `npm run check`
- [ ] Code coverage meets minimum requirements
- [ ] No TODO or FIXME comments in critical paths

### Version Control
- [ ] All changes committed to version control
- [ ] Production branch updated (e.g., `main` or `production`)
- [ ] Git tag created for this release version
- [ ] CHANGELOG.md updated with release notes
- [ ] No uncommitted local changes

---

## 🔐 Environment & Configuration

### Environment Variables Setup
- [ ] Copy `.env.production.template` to `.env.production`
- [ ] All required environment variables configured
- [ ] Validate environment: `npm run env:validate`
- [ ] No development/demo values in production config
- [ ] Secrets stored securely (not in git)

### Critical Environment Variables
- [ ] **DATABASE_URL**: Production database connection string configured
- [ ] **AUTH_SECRET**: Strong secret generated (64+ characters)
  - Generated using: `openssl rand -base64 64`
- [ ] **AUTH_URL**: Production domain URL (HTTPS required)
- [ ] **NODE_ENV**: Set to `production`
- [ ] **GOOGLE_CLIENT_ID**: OAuth credentials configured
- [ ] **GOOGLE_CLIENT_SECRET**: OAuth credentials configured

### Optional but Recommended
- [ ] **SENDGRID_API_KEY**: Email service configured
- [ ] **REDIS_URL**: Cache layer configured
- [ ] **STREAM_KEY_ENCRYPTION_KEY**: Streaming features enabled (32 characters)
- [ ] **SENTRY_DSN**: Error tracking configured
- [ ] Platform-specific integrations (Twitch, YouTube, Discord)

---

## 🛡️ Security Configuration

### Authentication & Authorization
- [ ] OAuth redirect URIs configured for production domain
- [ ] Session secrets different from auth secrets
- [ ] Session max age configured appropriately
- [ ] Auth token expiration configured
- [ ] Password policies enforced (if applicable)

### Network Security
- [ ] HTTPS enabled and enforced
- [ ] SSL/TLS certificates valid and not expiring soon
- [ ] CORS origins properly configured (`ALLOWED_ORIGINS`)
- [ ] Security headers configured (HSTS, CSP, X-Frame-Options)
- [ ] Rate limiting enabled and configured
  - `RATE_LIMIT_WINDOW_MS` set appropriately
  - `RATE_LIMIT_MAX_REQUESTS` set appropriately

### Secrets Management
- [ ] All secrets rotated from default/demo values
- [ ] Secrets stored in platform secret manager (not environment files)
- [ ] No secrets in logs or error messages
- [ ] Secrets rotation policy documented
- [ ] Access to secrets restricted to necessary services only

### Security Audit
- [ ] Run security audit: `npm run copilot:analyze`
- [ ] No weak authentication tokens detected
- [ ] No hardcoded credentials in code
- [ ] Input validation implemented on all endpoints
- [ ] SQL injection prevention verified (using Drizzle ORM)
- [ ] XSS protection verified

---

## 🗄️ Database Configuration

### Database Setup
- [ ] Production database provisioned
- [ ] Database accessible from application servers
- [ ] Database connection pooling configured
  - `DB_POOL_MIN` and `DB_POOL_MAX` set appropriately
- [ ] Database SSL/TLS enabled (`DB_SSL_MODE=require`)
- [ ] Database timezone set correctly

### Schema & Migrations
- [ ] Database schema up to date: `npm run db:push`
- [ ] All migrations tested in staging environment
- [ ] Migration rollback plan prepared
- [ ] Database indexes optimized for queries
- [ ] Data seeding scripts ready (if needed)

### Database Security
- [ ] Database user has minimum required permissions
- [ ] Database firewall rules configured
- [ ] Database access limited to application servers
- [ ] Database audit logging enabled
- [ ] Connection encryption enforced

---

## 💾 Backup & Recovery Strategy

### Backup Configuration
- [ ] Automated database backups configured
- [ ] Backup frequency defined and scheduled
- [ ] Backup retention policy set
  - Full backups: _____ days
  - Incremental backups: _____ days
  - Critical data backups: _____ days
- [ ] Backup storage location configured
- [ ] Backup encryption enabled

### Recovery Planning
- [ ] Backup restoration tested successfully
- [ ] Recovery Time Objective (RTO) defined: _____ hours
- [ ] Recovery Point Objective (RPO) defined: _____ hours
- [ ] Disaster recovery plan documented
- [ ] Disaster recovery testing scheduled
- [ ] Backup monitoring and alerting configured

### Data Integrity
- [ ] Backup verification process in place
- [ ] Checksum validation for backups
- [ ] Test restore performed in last 30 days
- [ ] Off-site backup copy maintained

---

## 🚀 Deployment Process

### Pre-Deployment Checks
- [ ] Deployment window scheduled and communicated
- [ ] Stakeholders notified of deployment
- [ ] Maintenance page prepared (if needed)
- [ ] Rollback plan documented and tested
- [ ] Support team briefed and available

### Infrastructure
- [ ] Application server(s) provisioned
- [ ] Load balancer configured (if applicable)
- [ ] Auto-scaling configured (if applicable)
- [ ] CDN configured for static assets (if applicable)
- [ ] DNS records configured and propagated

### Deployment Execution
- [ ] Build production Docker images
  - Backend: `docker build -f Dockerfile -t backend .`
  - Frontend: `docker build -f Dockerfile.frontend -t frontend .`
- [ ] Deploy backend service
  - For GCP: `npm run deploy:backend`
- [ ] Deploy frontend service
  - For GCP: `npm run deploy:frontend`
- [ ] Run database migrations: `npm run db:migrate:production`
- [ ] Verify health endpoints responding
  - Backend: `/api/health`
  - Frontend: `/`

### Service Configuration
- [ ] Memory allocation appropriate for load
- [ ] CPU allocation appropriate for load
- [ ] Concurrency settings configured
- [ ] Request timeout configured
- [ ] Maximum instances configured (auto-scaling)
- [ ] Minimum instances configured (availability)

---

## 📊 Monitoring & Observability

### Application Monitoring
- [ ] Application performance monitoring (APM) configured
- [ ] Error tracking enabled (e.g., Sentry)
- [ ] Log aggregation configured
- [ ] Log retention policy set
- [ ] Log level set to `info` or `warn` in production
- [ ] Structured logging implemented

### Infrastructure Monitoring
- [ ] Server/container health monitoring enabled
- [ ] Resource utilization monitoring (CPU, memory, disk)
- [ ] Network monitoring configured
- [ ] Database performance monitoring enabled
- [ ] Cache hit rate monitoring (if using Redis)

### Alerting Setup
- [ ] Critical alerts configured
  - Service downtime
  - High error rate (>1%)
  - Database connection failures
  - High response times (>2 seconds)
  - Resource exhaustion (>80% usage)
- [ ] Alert notification channels configured
  - Email alerts
  - Slack/Discord notifications
  - PagerDuty/on-call rotation (if applicable)
- [ ] Alert escalation policies defined

### Dashboards
- [ ] Operations dashboard created with key metrics
  - Request rate
  - Error rate
  - Response time (p50, p95, p99)
  - Active users
  - Database connections
- [ ] Business metrics dashboard (if applicable)
- [ ] Dashboard access granted to team members

---

## ✅ Post-Deployment Verification

### Smoke Testing
- [ ] Application accessible at production URL
- [ ] Homepage loads successfully
- [ ] Health check endpoint responding: `curl https://your-domain.com/api/health`
- [ ] SSL certificate valid and HTTPS working
- [ ] No console errors in browser

### Functional Testing
- [ ] User authentication flow working
  - Sign up
  - Sign in with Google OAuth
  - Sign out
  - Session persistence
- [ ] Database operations working
  - Read operations
  - Write operations
  - Update operations
  - Delete operations
- [ ] Core features functional
  - Community browsing
  - Event creation
  - Tournament management
  - Real-time messaging (WebSocket)
  - TableSync features

### Integration Testing
- [ ] Third-party API integrations working
  - Google OAuth
  - Twitch API (if configured)
  - YouTube API (if configured)
  - Discord Bot (if configured)
  - SendGrid email (if configured)
- [ ] External webhooks functioning
- [ ] Payment processing (if applicable)

### Performance Testing
- [ ] Page load times acceptable (<3 seconds)
- [ ] API response times within SLA (<500ms for most endpoints)
- [ ] Database query performance optimized
- [ ] No memory leaks detected
- [ ] Resource usage within expected limits

### Security Verification
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] Security headers present
  - `Strict-Transport-Security`
  - `X-Frame-Options`
  - `X-Content-Type-Options`
  - `X-XSS-Protection`
- [ ] CORS working correctly
- [ ] Rate limiting functional
- [ ] No sensitive data in responses
- [ ] No sensitive data in logs
- [ ] Session security working

### Automated Verification
- [ ] Run production verification: `npm run verify:production`
- [ ] All verification checks passing
- [ ] No unexpected errors in logs
- [ ] Monitoring systems receiving data

---

## 🎯 Go-Live Checklist

### Final Verification
- [ ] All previous checklist items completed
- [ ] Production URLs documented and shared
- [ ] User documentation updated
- [ ] API documentation current (if public API)
- [ ] Support procedures documented
- [ ] Known issues documented

### Communication
- [ ] Deployment completion announced to stakeholders
- [ ] Users notified of new features (if applicable)
- [ ] Change log published
- [ ] Social media announcements (if applicable)

### Team Readiness
- [ ] Support team has access to production logs
- [ ] On-call rotation established
- [ ] Escalation procedures defined
- [ ] Incident response plan reviewed
- [ ] Rollback procedure documented and accessible

---

## 🔄 Post-Launch Activities

### Immediate Monitoring (First 24 Hours)
- [ ] Monitor error rates continuously
- [ ] Watch response times and performance
- [ ] Check database performance and connections
- [ ] Verify all alerts are working
- [ ] Review logs for unexpected errors
- [ ] Monitor user feedback and support tickets

### First Week
- [ ] Daily health checks performed
- [ ] Performance metrics reviewed
- [ ] User feedback collected and triaged
- [ ] Database backup verification
- [ ] Security scan performed
- [ ] No critical issues reported

### Ongoing Maintenance
- [ ] Weekly performance reviews scheduled
- [ ] Monthly security audits scheduled
- [ ] Quarterly disaster recovery testing scheduled
- [ ] Dependency updates scheduled
- [ ] Secret rotation schedule established (90 days recommended)
- [ ] SSL certificate renewal tracking
- [ ] Database maintenance windows scheduled

---

## 🛠️ Quick Reference Commands

### Deployment
```bash
# Set environment variables
export PROJECT_ID="your-project-id"
export REGION="your-region"

# Full deployment
npm run deploy:production

# Backend only
npm run deploy:backend

# Frontend only
npm run deploy:frontend

# Database migration
npm run db:migrate:production

# Verify deployment
npm run verify:production
```

### Health Checks
```bash
# Check backend health
curl -f https://your-backend-url/api/health

# Check frontend
curl -f https://your-frontend-url/

# Check database
npm run db:health

# Validate environment
npm run env:validate
```

### Monitoring
```bash
# View application logs (platform-specific)
# GCP: gcloud logs tail
# Docker: docker logs <container>
# Heroku: heroku logs --tail

# Check resource usage
# Docker: docker stats
# GCP: gcloud run services describe <service>
```

---

## 🚨 Troubleshooting

### Common Issues

**Build Failures**
- Check dependencies are installed: `npm install`
- Verify Node.js version matches requirements
- Check for TypeScript errors: `npm run check`
- Review build logs for specific errors

**Health Check Failures**
- Verify `/api/health` endpoint is accessible
- Check database connectivity
- Review application logs for startup errors
- Verify environment variables are set correctly

**Authentication Issues**
- Verify OAuth redirect URIs match production domain
- Check `AUTH_URL` is set to production domain
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Check session configuration

**Database Connection Issues**
- Verify `DATABASE_URL` is correct
- Check database server is accessible
- Verify firewall rules allow connections
- Check SSL/TLS configuration
- Review connection pool settings

**Performance Issues**
- Check database query performance
- Review resource allocation (CPU, memory)
- Verify cache configuration (Redis)
- Check for memory leaks
- Review auto-scaling settings

### Rollback Procedure
1. Keep previous version deployment ready
2. Document rollback commands for your platform
3. Test rollback in staging before production
4. Communicate rollback to team
5. Execute rollback: [platform-specific command]
6. Verify rollback success
7. Investigate root cause

---

## 📚 Additional Resources

- **Detailed Deployment Guide**: [docs/deployment/DEPLOYMENT.md](docs/deployment/DEPLOYMENT.md)
- **GCP-Specific Checklist**: [docs/deployment/PRODUCTION_DEPLOYMENT_CHECKLIST.md](docs/deployment/PRODUCTION_DEPLOYMENT_CHECKLIST.md)
- **Security Improvements**: [docs/SECURITY_IMPROVEMENTS.md](docs/SECURITY_IMPROVEMENTS.md)
- **Environment Template**: [.env.production.template](.env.production.template)
- **Deployment Scripts**: [scripts/](scripts/)
- **Monitoring Configuration**: [monitoring/](monitoring/)

---

## ⚠️ Important Notes

- **Complete items in order**: Each section builds upon previous ones
- **Don't skip security checks**: Security is critical for production
- **Test in staging first**: Always test deployment process in staging
- **Have a rollback plan**: Be prepared to rollback if issues arise
- **Monitor after deployment**: Watch metrics closely for 24-48 hours
- **Document everything**: Keep deployment notes for future reference

---

**Last Updated**: 2024  
**Version**: 1.0.0  
**Platform**: Multi-platform (See platform-specific guides for details)
