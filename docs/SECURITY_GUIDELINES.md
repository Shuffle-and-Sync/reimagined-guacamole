# Security Guidelines - Shuffle & Sync

**Last Updated:** October 2025  
**Version:** 1.0

---

## Table of Contents

1. [Overview](#overview)
2. [Security Best Practices](#security-best-practices)
3. [Authentication & Authorization](#authentication--authorization)
4. [Input Validation](#input-validation)
5. [Sensitive Data Handling](#sensitive-data-handling)
6. [API Security](#api-security)
7. [Dependency Management](#dependency-management)
8. [Security Testing](#security-testing)
9. [Incident Response](#incident-response)
10. [Compliance](#compliance)

---

## Overview

This document provides security guidelines for developers working on the Shuffle & Sync platform. Following these guidelines ensures consistent security practices across the codebase.

### Security Posture

**Current Status:** GOOD ✅  
**Last Security Audit:** October 2025  
**Critical Vulnerabilities:** 0  
**High Vulnerabilities:** 0 (production)

---

## Security Best Practices

### General Principles

1. **Defense in Depth**: Implement multiple layers of security controls
2. **Least Privilege**: Grant minimum necessary permissions
3. **Fail Securely**: Design systems to fail in a secure state
4. **Keep it Simple**: Complexity is the enemy of security
5. **Assume Breach**: Design with the assumption that attackers may gain access

### Code Review Checklist

Before submitting code for review, verify:

- [ ] No hardcoded secrets or credentials
- [ ] All inputs are validated with Zod schemas
- [ ] User-generated content is sanitized
- [ ] Sensitive operations are logged
- [ ] Error messages don't expose internal details
- [ ] Rate limiting is applied to expensive operations
- [ ] Authentication checks are in place for protected routes
- [ ] No `console.log` in production code (use `logger` instead)

---

## Authentication & Authorization

### Authentication Implementation

We use **Auth.js v5** for authentication with multiple providers:

```typescript
// ✅ CORRECT: Using Auth.js session-based auth
import { requireAuth } from "./auth/auth.middleware";

router.get("/protected", requireAuth, async (req, res) => {
  const userId = req.user.id;
  // ... handle request
});
```

### OAuth 2.0 Configuration

**Supported Providers:**

- Google OAuth 2.0 (primary)
- Twitch OAuth

**Configuration:**

```typescript
// Environment variables required
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
AUTH_SECRET=<32+ character secure secret>
AUTH_URL=https://your-domain.com
AUTH_TRUST_HOST=true
```

**Redirect URIs:**

- Development: `http://localhost:3000/api/auth/callback/google`
- Production: `https://your-domain.com/api/auth/callback/google`

### Multi-Factor Authentication (MFA)

MFA is supported and enforced when enabled:

```typescript
// MFA verification required before session creation
if (user.mfaEnabled) {
  throw new Error("MFA_REQUIRED: Complete 2FA verification");
}
```

### Authorization Patterns

**Authenticated Routes:**

```typescript
router.get("/api/users/profile", requireAuth, handler);
```

**Admin Routes:**

```typescript
router.get("/api/admin/users", requireAuth, requireAdmin, handler);
```

**Hybrid Auth (Session or JWT):**

```typescript
router.get("/api/data", requireHybridAuth, handler);
```

### Session Security

- **Session Duration:** 30 days (configurable)
- **Session Storage:** Database-backed sessions
- **Cookie Settings:**
  - `httpOnly: true` (prevents XSS)
  - `secure: true` (production only)
  - `sameSite: 'lax'` (CSRF protection)

### Security Best Practices

**DO:**

- ✅ Use `requireAuth` middleware for protected routes
- ✅ Use `requireAdmin` for admin-only operations
- ✅ Log authentication events (login, logout, failures)
- ✅ Implement account lockout after failed attempts
- ✅ Enforce MFA for sensitive operations

**DON'T:**

- ❌ Store passwords in plain text
- ❌ Use predictable session tokens
- ❌ Expose user enumeration via error messages
- ❌ Allow password reset without email verification
- ❌ Use weak session expiry times

---

## Input Validation

### Validation Strategy

All user input MUST be validated using **Zod schemas**.

### Schema Definition

```typescript
import { z } from "zod";

export const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(["tournament", "convention", "release"]),
});
```

### Validation Middleware

```typescript
import { validateRequest } from "./validation";

router.post(
  "/api/events",
  requireAuth,
  validateRequest(createEventSchema),
  async (req, res) => {
    // req.body is validated and typed
    const event = await createEvent(req.body);
    res.json(event);
  },
);
```

### Input Sanitization

All inputs are automatically sanitized by the `inputSanitizationMiddleware`:

```typescript
// Automatically removes HTML tags and dangerous characters
app.use(inputSanitizationMiddleware);
```

### Common Validation Patterns

**UUID Validation:**

```typescript
import { validateUUID } from "./validation";

const userId = req.params.userId;
if (!validateUUID(userId)) {
  return res.status(400).json({ error: "Invalid user ID" });
}
```

**Email Validation:**

```typescript
const emailSchema = z.object({
  email: z.string().email(),
});
```

**Date Validation:**

```typescript
const dateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
```

### XSS Prevention

**Framework Protection:**

- React automatically escapes JSX content
- Never use `dangerouslySetInnerHTML` without DOMPurify

**Backend Protection:**

- Input sanitization removes `<` and `>` characters
- Content-Security-Policy headers block inline scripts

### SQL Injection Prevention

**Using Drizzle ORM:**

```typescript
// ✅ CORRECT: Parameterized queries via ORM
const user = await db.select().from(users).where(eq(users.id, userId));

// ❌ WRONG: Never use raw SQL
// const user = await db.run(`SELECT * FROM users WHERE id = '${userId}'`);
```

---

## Sensitive Data Handling

### Environment Variables

**NEVER commit sensitive data:**

```bash
# ❌ WRONG
AUTH_SECRET="my-secret-123"

# ✅ CORRECT
AUTH_SECRET=<generated secure secret>
```

**Generate Secure Secrets:**

```bash
# Generate AUTH_SECRET
openssl rand -base64 32

# Generate encryption key
openssl rand -hex 16
```

### Secret Validation

Production deployments automatically validate secrets:

```typescript
// Blocks demo/test secrets in production
if (process.env.NODE_ENV === "production") {
  if (process.env.AUTH_SECRET?.includes("demo")) {
    throw new Error("SECURITY: Demo secret detected!");
  }
}
```

### Password Storage

**ONLY use Argon2:**

```typescript
import { hash, verify } from "@node-rs/argon2";

// Hash password
const hashedPassword = await hash(password);

// Verify password
const isValid = await verify(hashedPassword, password);
```

**Never:**

- ❌ Store passwords in plain text
- ❌ Use MD5 or SHA1 for password hashing
- ❌ Use bcrypt with rounds < 10
- ❌ Log passwords or hashes

### Logging Sensitive Data

**Use Structured Logger:**

```typescript
// ✅ CORRECT
logger.info("User logged in", { userId: user.id });

// ❌ WRONG
console.log(`User ${user.email} logged in with password`);
```

**Sanitization in Logger:**

- Passwords automatically redacted
- Tokens automatically redacted
- Email addresses logged only when necessary

### Data Encryption

**At Rest:**

- Database: SQLite Cloud with encryption
- Files: Encrypt sensitive file uploads

**In Transit:**

- HTTPS enforced in production
- TLS 1.2+ required
- Secure WebSocket (WSS) for real-time

---

## API Security

### Rate Limiting

**Configured Rate Limits:**

| Endpoint Type  | Limit        | Window     |
| -------------- | ------------ | ---------- |
| General API    | 100 requests | 15 minutes |
| Authentication | 5 attempts   | 15 minutes |
| Password Reset | 3 attempts   | 1 hour     |
| Messages       | 20 messages  | 1 minute   |
| File Upload    | 10 uploads   | 1 hour     |
| Events         | 10 creates   | 1 hour     |

**Implementation:**

```typescript
import { authRateLimit } from "./rate-limiting";

router.post("/api/auth/login", authRateLimit, loginHandler);
```

### Security Headers

**Automatically Applied:**

```typescript
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: <strict policy>
Strict-Transport-Security: max-age=31536000 (production)
```

### CORS Configuration

**Allowed Origins:**

```typescript
// Development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5000

// Production
ALLOWED_ORIGINS=https://your-domain.com
```

### Error Handling

**Production Error Responses:**

```typescript
// ✅ CORRECT: Generic message in production
catch (error) {
  logger.error('Operation failed', error, { userId });

  res.status(500).json({
    message: process.env.NODE_ENV === 'production'
      ? 'An error occurred'
      : error.message,
    errorCode: 'OPERATION_FAILED'
  });
}
```

**Error Codes:**
Use standardized error codes instead of detailed messages:

- `AUTH_FAILED` - Authentication failure
- `INVALID_INPUT` - Validation error
- `NOT_FOUND` - Resource not found
- `RATE_LIMITED` - Rate limit exceeded
- `SERVER_ERROR` - Internal server error

---

## Dependency Management

### Security Scanning

**Run npm audit regularly:**

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities (production only)
npm audit --production

# Fix with automatic updates
npm audit fix --legacy-peer-deps
```

### Update Strategy

**Production Dependencies:**

- ✅ Update immediately for security patches
- ✅ Test thoroughly before deploying
- ✅ Monitor for breaking changes

**Development Dependencies:**

- ⚠️ Evaluate severity and impact
- ⚠️ Update if vulnerability affects dev workflow
- ⚠️ Can defer if only affects local dev server

### Known Vulnerabilities

**Current Status:**

- Production dependencies: ✅ Clean
- Dev dependencies: ⚠️ esbuild (affects dev server only)

### Dependency Review

**Before Adding Dependencies:**

1. Check npm audit and security advisories
2. Review package maintainership and activity
3. Verify license compatibility
4. Check bundle size impact
5. Evaluate alternatives

---

## Security Testing

### Test Suite

**Run Security Tests:**

```bash
# All security tests
npm run test:security

# Specific test suites
npm run test:auth
npm run test:errors
npm run test:coverage
```

### Test Coverage

**Current Coverage:** 87 security tests passing

**Test Categories:**

1. Authentication & Authorization (15 tests)
2. Input Validation (20 tests)
3. Rate Limiting (8 tests)
4. Session Security (12 tests)
5. Error Handling (10 tests)
6. CORS & Headers (12 tests)
7. Sensitive Data (10 tests)

### Security Test Examples

```typescript
describe("Security Tests", () => {
  it("should block XSS attempts", () => {
    const malicious = '<script>alert("xss")</script>';
    const sanitized = sanitizeInput(malicious);
    expect(sanitized).not.toContain("<script>");
  });

  it("should enforce rate limits", async () => {
    // Make multiple requests
    for (let i = 0; i < 6; i++) {
      await request(app).post("/api/auth/login");
    }
    // 6th request should be rate limited
    const response = await request(app).post("/api/auth/login");
    expect(response.status).toBe(429);
  });
});
```

### Manual Security Testing

**Periodic Reviews:**

- [ ] Review authentication flows
- [ ] Test rate limiting effectiveness
- [ ] Verify error messages don't leak info
- [ ] Check CORS policies
- [ ] Test file upload restrictions
- [ ] Verify session expiry
- [ ] Test MFA flows

---

## Incident Response

### Security Incident Procedure

**1. Detection**

- Monitor security logs
- Alert on suspicious activity
- Review error rates

**2. Assessment**

- Determine severity (Critical, High, Medium, Low)
- Identify affected systems
- Assess potential data exposure

**3. Containment**

- Isolate affected systems
- Revoke compromised credentials
- Block malicious IPs/users

**4. Investigation**

- Collect logs and evidence
- Identify root cause
- Document timeline

**5. Remediation**

- Apply security patches
- Update credentials
- Implement additional controls

**6. Communication**

- Notify affected users (if applicable)
- Document incident
- Update security procedures

### Security Contacts

**Report Security Issues:**

- Email: security@shuffleandsync.com
- GitHub Security Advisory: [Private disclosure](https://github.com/Shuffle-and-Sync/reimagined-guacamole/security/advisories)

**DO NOT:**

- ❌ Disclose vulnerabilities publicly before fix
- ❌ Test vulnerabilities on production
- ❌ Access data you're not authorized to view

---

## Compliance

### Data Protection

**GDPR Compliance:**

- ✅ User consent for data collection
- ✅ Right to access personal data
- ✅ Right to deletion
- ✅ Data portability
- ✅ Breach notification procedures

**Data Retention:**

- User accounts: Retained until deletion request
- Logs: 30 days
- Audit logs: 1 year
- Backups: 30 days

### Security Standards

**Following:**

- ✅ OWASP Top 10 2021
- ✅ Node.js Security Best Practices
- ✅ CIS Security Benchmarks
- ✅ Auth.js Security Guidelines

### Audit Schedule

**Regular Audits:**

- Security audit: Quarterly
- Dependency audit: Monthly
- Access review: Quarterly
- Penetration testing: Annually

---

## Additional Resources

### Documentation

- [SECURITY_AUDIT_REPORT.md](../SECURITY_AUDIT_REPORT.md) - Latest security audit
- [SECURITY.md](../SECURITY.md) - Security policy
- [DEPLOYMENT.md](../DEPLOYMENT.md) - Secure deployment guide

### External Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Checklist](https://github.com/goldbergyoni/nodebestpractices#6-security-best-practices)
- [Auth.js Documentation](https://authjs.dev/getting-started/introduction)
- [Zod Documentation](https://zod.dev/)

### Tools

- [npm audit](https://docs.npmjs.com/cli/v9/commands/npm-audit)
- [Snyk](https://snyk.io/)
- [OWASP ZAP](https://www.zaproxy.org/)
- [Burp Suite](https://portswigger.net/burp)

---

**Last Updated:** October 2025  
**Maintained by:** Shuffle & Sync Security Team  
**Questions?** Contact security@shuffleandsync.com
