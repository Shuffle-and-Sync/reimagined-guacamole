# Security Hardening Quick Reference Guide

This guide provides quick commands and checks for each item in the Security Audit & Hardening Checklist.

## Quick Status Check

Run all security checks at once:
```bash
npm run security:check
```

## Individual Checklist Items

### ✅ 1. Dependencies Audited and Vulnerabilities Addressed

**Check for vulnerabilities:**
```bash
npm audit
npm audit --production  # Production dependencies only
```

**Fix vulnerabilities:**
```bash
npm audit fix
npm audit fix --force  # For major version updates (review changes!)
```

**View detailed audit:**
```bash
npm audit --json | jq  # Requires jq for formatted output
```

**Test:**
```bash
npm test server/tests/security/security-audit-comprehensive.test.ts -- -t "Dependencies"
```

---

### ✅ 2. Authentication Flows Tested

**Run authentication tests:**
```bash
npm run test:auth
```

**Verify Auth.js configuration:**
```bash
cat server/auth/auth.config.ts | grep -A5 "trustHost\|httpOnly\|strategy"
```

**Check MFA implementation:**
```bash
grep -r "mfaEnabled\|MFA_REQUIRED" server/auth/
```

**Test:**
```bash
npm test server/tests/security/security-audit-comprehensive.test.ts -- -t "Authentication"
```

---

### ✅ 3. API Rate Limiting Implemented

**Verify rate limiting configuration:**
```bash
cat server/rate-limiting.ts
```

**Check rate limits:**
```bash
grep -E "max:\s*[0-9]+" server/rate-limiting.ts
grep -E "windowMs:\s*[0-9]+" server/rate-limiting.ts
```

**Test:**
```bash
npm test server/tests/security/security-audit-comprehensive.test.ts -- -t "rate limiting"
```

---

### ✅ 4. Environment Variables Properly Secured

**Check .gitignore:**
```bash
grep -E "\.env" .gitignore
```

**Verify no .env in git history:**
```bash
git log --all --name-only --pretty=format: | grep -E "^\.env\." | sort -u
```

**Validate environment variables:**
```bash
npm run env:validate
```

**Check for committed credentials:**
```bash
git grep -E "(sk_live_|AIza[A-Za-z0-9_-]{35})" -- ":(exclude)*.test.ts" ":(exclude).env.example"
```

**Test:**
```bash
npm test server/tests/security/security-audit-comprehensive.test.ts -- -t "Environment"
```

---

### ✅ 5. CORS Settings Appropriate for Production

**Check CORS configuration:**
```bash
grep -A10 "corsHandler\|Access-Control" server/shared/middleware.ts
```

**Verify allowed origins:**
```bash
echo $ALLOWED_ORIGINS  # Should be set in production
```

**Test:**
```bash
npm test server/tests/security/security-audit-comprehensive.test.ts -- -t "CORS"
```

---

### ✅ 6. Content Security Policy (CSP) Headers Configured

**Check CSP configuration:**
```bash
grep -A20 "Content-Security-Policy" server/validation.ts
```

**Verify security headers:**
```bash
grep -E "X-Frame-Options|X-Content-Type|X-XSS-Protection" server/validation.ts
```

**Test CSP in production mode:**
```bash
NODE_ENV=production npm test server/tests/security/security-audit-comprehensive.test.ts -- -t "CSP"
```

---

### ✅ 7. Input Validation Implemented Across All User Inputs

**Check validation schemas:**
```bash
grep "export const validate" server/validation.ts
```

**Verify sanitization:**
```bash
grep -A5 "sanitizeInput" server/validation.ts
```

**Test input validation:**
```bash
npm test server/tests/security/input-sanitization.test.ts
npm test server/tests/security/enhanced-sanitization.test.ts
```

---

### ✅ 8. Sensitive Data Handling Reviewed for Compliance

**Check for console.log in sensitive files:**
```bash
grep -n "console.log" server/auth/*.ts server/storage.ts
```

**Verify structured logging:**
```bash
grep -c "logger\." server/auth/*.ts
```

**Check password hashing:**
```bash
grep -E "bcrypt|argon2" server/auth/password.ts
```

**Test:**
```bash
npm test server/tests/security/security-audit-comprehensive.test.ts -- -t "Sensitive data"
```

---

### ✅ 9. OAuth Scopes Minimized to Necessary Permissions

**Check OAuth configuration:**
```bash
grep -A10 "Google\|Twitch" server/auth/auth.config.ts
```

**Verify no excessive scopes:**
```bash
grep -E "scope|drive|calendar" server/auth/auth.config.ts
```

**Test:**
```bash
npm test server/tests/security/security-audit-comprehensive.test.ts -- -t "OAuth"
```

---

### ✅ 10. Third-Party Service Credentials Rotated Before Deployment

**Generate new AUTH_SECRET:**
```bash
openssl rand -base64 32
```

**Generate encryption key:**
```bash
openssl rand -hex 16
```

**Run security audit:**
```bash
npm run dev  # Audit runs on startup
# Or manually:
node -e "import('./server/utils/security.utils.js').then(m => console.log(m.auditSecurityConfiguration()))"
```

**Test:**
```bash
npm test server/tests/security/security-audit-comprehensive.test.ts -- -t "credentials"
```

---

## Security Test Suites

### Run all security tests:
```bash
npm test server/tests/security/
```

### Run specific test suites:
```bash
# Comprehensive audit
npm test server/tests/security/security-audit-comprehensive.test.ts

# Credential protection
npm test server/tests/security/credential-protection.test.ts

# GitIgnore protection
npm test server/tests/security/gitignore-env-protection.test.ts

# Input sanitization
npm test server/tests/security/input-sanitization.test.ts
npm test server/tests/security/enhanced-sanitization.test.ts

# Security utilities
npm test server/tests/security/security.utils.test.ts
```

---

## Pre-Deployment Security Checklist

Copy and paste this checklist before each deployment:

```markdown
## Security Pre-Deployment Checklist

### Environment & Credentials
- [ ] Run `npm audit --production` (0 vulnerabilities)
- [ ] Generate new AUTH_SECRET: `openssl rand -base64 32`
- [ ] Set AUTH_URL to production domain (or empty for auto-detection)
- [ ] Rotate Google OAuth credentials
- [ ] Rotate Twitch OAuth credentials (if used)
- [ ] Set MASTER_ADMIN_EMAIL
- [ ] Configure ALLOWED_ORIGINS for production domain

### Verification
- [ ] Run `npm test server/tests/security/` (all tests pass)
- [ ] Verify .gitignore protects .env files
- [ ] Check no .env files in git history
- [ ] Verify AUTH_SECRET is not demo/test value
- [ ] Run `npm run check` (TypeScript validation)

### OAuth Configuration
- [ ] Add production callback URLs to Google Console
- [ ] Add production callback URLs to Twitch Console (if applicable)
- [ ] Verify OAuth scopes are minimal (openid, profile, email only)
- [ ] Test OAuth flows in staging environment

### Security Headers & Policies
- [ ] Verify CSP headers in production
- [ ] Confirm HSTS is enabled
- [ ] Test CORS configuration
- [ ] Verify rate limiting is active

### Monitoring
- [ ] Configure error tracking (Sentry)
- [ ] Set up security event logging
- [ ] Configure rate limit alerts
- [ ] Test incident response procedures

### Documentation
- [ ] Review SECURITY_AUDIT_REPORT.md
- [ ] Update deployment documentation
- [ ] Document credential rotation schedule
```

---

## Continuous Security Practices

### Daily
```bash
# Check for new security advisories
npm audit

# Review failed authentication logs
# (Check your logging service)
```

### Weekly
```bash
# Run full security test suite
npm test server/tests/security/

# Check for dependency updates
npm outdated
```

### Monthly
```bash
# Update dependencies with security patches
npm update

# Review and rotate API keys (if needed)
# Review access logs for anomalies
```

### Quarterly
```bash
# Rotate AUTH_SECRET
openssl rand -base64 32

# Rotate all OAuth credentials
# Review security policies
# Update security documentation
```

---

## Emergency Procedures

### If credentials are compromised:

1. **Immediate Actions:**
   ```bash
   # Rotate affected credentials immediately
   openssl rand -base64 32 > new_secret.txt
   
   # Update environment variables
   # Restart application
   ```

2. **Verify Impact:**
   ```bash
   # Check audit logs
   # Review recent authentication attempts
   # Check for unauthorized access
   ```

3. **Notify Users:**
   ```bash
   # Force logout all users (clear sessions)
   # Send security notification emails
   ```

4. **Document Incident:**
   - Record timeline
   - Document actions taken
   - Update security procedures

### If vulnerability is discovered:

1. **Assess Severity:**
   ```bash
   npm audit --json | jq '.metadata.vulnerabilities'
   ```

2. **Fix Immediately:**
   ```bash
   npm audit fix
   # Or manually update specific package
   npm install package@latest
   ```

3. **Test:**
   ```bash
   npm test
   npm run check
   ```

4. **Deploy Fix:**
   ```bash
   npm run build
   # Deploy to production
   ```

---

## Security Contacts

- **Security Issues:** See SECURITY.md
- **Vulnerability Reports:** Follow responsible disclosure in SECURITY.md
- **Emergency Contact:** [Set up your emergency contact]

---

## Additional Resources

- [SECURITY_AUDIT_REPORT.md](./SECURITY_AUDIT_REPORT.md) - Full audit report
- [SECURITY.md](./SECURITY.md) - Security policy and reporting
- [.env.example](./.env.example) - Environment variable template
- [docs/security/](./docs/security/) - Detailed security documentation

---

**Last Updated:** October 18, 2025  
**Next Review:** Weekly automated checks via GitHub Actions
