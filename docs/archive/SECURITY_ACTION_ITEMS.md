# Security Audit - Action Items

**Created:** October 2025  
**Status:** Audit Complete - Action Items Documented  
**Priority:** Follow roadmap below

---

## Overview

This document provides actionable steps to address the remaining security findings from the comprehensive security audit. All **CRITICAL** and **HIGH** priority items have been resolved. The items below are **MEDIUM** and **LOW** priority improvements.

---

## Immediate Actions (This Week)

### ✅ COMPLETED: Enhanced Secret Validation

**Status:** ✅ DONE  
**Implementation:** `server/env-validation.ts` updated

### ✅ COMPLETED: Replace Console.log in Auth Modules

**Status:** ✅ DONE  
**Files:** `server/auth/*.ts` updated

### ✅ COMPLETED: Add No-Console ESLint Rule

**Status:** ✅ DONE  
**File:** `eslint.config.js` updated

---

## Short-Term Actions (Within 2 Weeks)

### 1. Complete Console.log Migration

**Priority:** MEDIUM  
**Severity:** LOW (production-logger intercepts)  
**Status:** 74 instances remaining (outside auth module)

**Affected Files:**

```bash
# Run to see current usage
npm run security:console-check

# Top files with console usage:
server/storage.ts                              (~20 instances)
server/services/streaming-coordinator.service.ts  (~5 instances)
server/admin/admin.middleware.ts                  (~1 instance)
```

**Action Plan:**

1. Review `scripts/check-console-usage.sh` output
2. For each file, replace console.log/error with logger
3. Follow pattern from auth modules:

```typescript
// ❌ BEFORE
console.error("Operation failed:", error);

// ✅ AFTER
import { logger } from "./logger";
logger.error(
  "Operation failed",
  error instanceof Error ? error : new Error(String(error)),
  { context: "operation_name", userId },
);
```

**Testing:**

```bash
# After each file update:
npm run security:console-check
npm run test:security
```

**Estimated Time:** 2-3 hours

---

### 2. Audit All API Endpoints for Validation

**Priority:** MEDIUM  
**Severity:** MEDIUM  
**Status:** Major endpoints have validation, some utility endpoints need review

**Endpoints to Audit:**

1. **Webhook Endpoints** (`server/routes/webhooks.ts`)
   - Verify webhook signature validation
   - Add Zod schemas for webhook payloads
   - Rate limit webhook endpoints

2. **Monitoring Endpoints** (`server/routes/monitoring.ts`)
   - Ensure authentication required
   - Add input validation for query params
   - Rate limit monitoring requests

3. **Analytics Endpoints** (`server/routes/analytics.ts`)
   - Validate date ranges
   - Validate filter parameters
   - Add pagination validation

4. **File Upload Endpoints**
   - Verify file size limits (10MB max)
   - Validate file types (images only)
   - Sanitize file names
   - Check for malicious file content

**Action Plan:**

```typescript
// Template for adding validation
import { z } from "zod";
import { validateRequest, validateQuery } from "./validation";

const webhookSchema = z.object({
  event: z.enum(["stream.online", "stream.offline"]),
  data: z.object({
    userId: z.string().uuid(),
    platform: z.enum(["twitch", "youtube"]),
  }),
});

router.post(
  "/api/webhooks/stream",
  validateRequest(webhookSchema),
  webhookHandler,
);
```

**Testing:**

```bash
# Create test for each endpoint
# Example: server/tests/routes/webhooks.test.ts

describe('Webhook Validation', () => {
  it('should reject invalid webhook payloads', async () => {
    const response = await request(app)
      .post('/api/webhooks/stream')
      .send({ invalid: 'data' });

    expect(response.status).toBe(400);
  });
});
```

**Estimated Time:** 4-6 hours

---

### 3. Update Development Dependencies

**Priority:** MEDIUM  
**Severity:** LOW (dev-only, doesn't affect production)  
**Status:** esbuild vulnerability in vitest

**Current Vulnerability:**

```
esbuild <=0.24.2 (moderate)
Issue: Dev server can respond to any website requests
Advisory: GHSA-67mh-4wv8-2f99
Affected: vitest dependencies
```

**Action Plan:**

**Option 1: Safe Update (Recommended)**

```bash
# Check if vitest has updated
npm outdated vitest @vitest/coverage-v8 @vitest/ui

# Update to latest compatible version
npm update vitest @vitest/coverage-v8 @vitest/ui --legacy-peer-deps

# Verify tests still pass
npm run test:frontend
npm run test:backend
```

**Option 2: Force Update (if needed)**

```bash
# This may cause breaking changes
npm audit fix --force

# Then fix any broken tests
npm test
```

**Option 3: Accept Risk (temporary)**

```bash
# Document in .npmrc or CI config
# Only affects local dev environment
# Not used in production builds
```

**Recommendation:** Try Option 1 first, accept risk temporarily if breaking changes occur. This is LOW severity since it only affects local development server.

**Estimated Time:** 1-2 hours (including testing)

---

### 4. Enhance JWT Session Security

**Priority:** MEDIUM  
**Severity:** MEDIUM  
**Status:** JWT auth implemented but skips enhanced validation

**Current Gap:**

```typescript
// JWT sessions bypass device fingerprinting
if (sessionData.sessionToken) {
  // Enhanced validation only for session-based auth
  sessionSecurityValidation = await enhancedSessionManager.validateSessionSecurity(...);
}
```

**Action Plan:**

1. **Add JWT Metadata Storage:**

```typescript
// server/auth/tokens.ts
interface JWTMetadata {
  jti: string;
  userId: string;
  deviceFingerprint: string;
  userAgent: string;
  ipAddress: string;
  issuedAt: Date;
}

// Store metadata on JWT issuance
await storage.createJWTMetadata({
  jti: jwtId,
  userId: user.id,
  deviceFingerprint: extractDeviceFingerprint(req),
  userAgent: req.headers["user-agent"],
  ipAddress: req.ip,
});
```

2. **Add JWT Context Validation:**

```typescript
// server/auth/auth.middleware.ts
if (req.isJWTAuth && payload.jti) {
  const metadata = await storage.getJWTMetadata(payload.jti);

  if (metadata) {
    const currentDevice = extractDeviceFingerprint(req);
    if (currentDevice !== metadata.deviceFingerprint) {
      logger.warn("JWT device mismatch detected", {
        userId: payload.sub,
        jti: payload.jti,
      });
      // Optionally reject or flag for review
    }
  }
}
```

3. **Add JWT Revocation List:**

```typescript
// Add to schema
export const jwtRevocations = sqliteTable("jwt_revocations", {
  jti: text("jti").primaryKey(),
  userId: text("user_id").notNull(),
  revokedAt: integer("revoked_at").notNull(),
  reason: text("reason"),
});

// Check revocation on auth
const isRevoked = await storage.isJWTRevoked(payload.jti);
if (isRevoked) {
  return res.status(401).json({ message: "Token revoked" });
}
```

**Testing:**

```typescript
describe("JWT Security", () => {
  it("should detect device changes", async () => {
    const token = await generateJWT(user);

    // Simulate different device
    const response = await request(app)
      .get("/api/protected")
      .set("Authorization", `Bearer ${token}`)
      .set("User-Agent", "Different Device");

    expect(response.status).toBe(401);
  });
});
```

**Estimated Time:** 6-8 hours

---

## Medium-Term Actions (Within 1 Month)

### 5. Standardize Error Response Handling

**Priority:** MEDIUM  
**Severity:** MEDIUM  
**Status:** Some handlers expose detailed errors

**Action Plan:**

1. **Create Error Response Middleware:**

```typescript
// server/middleware/error-response.middleware.ts
export interface ErrorResponse {
  message: string;
  errorCode: string;
  statusCode: number;
  details?: unknown; // Only in development
}

export const errorResponseMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Log full error
  logger.error("Request error", err, {
    url: req.url,
    method: req.method,
    userId: req.user?.id,
  });

  // Determine error code and message
  const statusCode = err.statusCode || 500;
  const errorCode = err.code || "INTERNAL_ERROR";

  const response: ErrorResponse = {
    message:
      process.env.NODE_ENV === "production"
        ? getGenericErrorMessage(statusCode)
        : err.message,
    errorCode,
    statusCode,
  };

  // Add details in development
  if (process.env.NODE_ENV === "development") {
    response.details = {
      stack: err.stack,
      name: err.name,
    };
  }

  res.status(statusCode).json(response);
};
```

2. **Define Error Codes:**

```typescript
// server/utils/error-codes.ts
export const ERROR_CODES = {
  AUTH_FAILED: "AUTH_FAILED",
  INVALID_INPUT: "INVALID_INPUT",
  NOT_FOUND: "NOT_FOUND",
  RATE_LIMITED: "RATE_LIMITED",
  FORBIDDEN: "FORBIDDEN",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;
```

3. **Update Error Handlers:**

```typescript
// Replace individual error handling
catch (error) {
  throw new ApplicationError(
    'Failed to update profile',
    'PROFILE_UPDATE_FAILED',
    500
  );
}
```

**Estimated Time:** 4-6 hours

---

### 6. Improve CORS Configuration Flexibility

**Priority:** MEDIUM  
**Severity:** LOW  
**Status:** CORS works but uses hardcoded origins

**Action Plan:**

1. **Use Environment Variable Consistently:**

```typescript
// server/middleware/security.middleware.ts
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3000"];

// Validate origin
const origin = req.headers.origin;
if (origin && isOriginAllowed(origin, allowedOrigins)) {
  res.setHeader("Access-Control-Allow-Origin", origin);
}
```

2. **Add Origin Validation:**

```typescript
function isOriginAllowed(origin: string, allowed: string[]): boolean {
  return allowed.some((pattern) => {
    if (pattern === "*") return true;
    if (pattern.includes("*")) {
      const regex = new RegExp("^" + pattern.replace("*", ".*") + "$");
      return regex.test(origin);
    }
    return origin === pattern;
  });
}
```

3. **Add Startup Validation:**

```typescript
// Validate CORS configuration on startup
if (process.env.NODE_ENV === "production") {
  if (!process.env.ALLOWED_ORIGINS) {
    logger.warn("ALLOWED_ORIGINS not set - using default");
  } else {
    logger.info("CORS configured", {
      origins: process.env.ALLOWED_ORIGINS.split(",").length,
    });
  }
}
```

**Estimated Time:** 2-3 hours

---

### 7. Create Comprehensive Security Test Suite

**Priority:** MEDIUM  
**Severity:** LOW (already have 87 tests)  
**Status:** Good coverage, can be enhanced

**Additional Tests to Add:**

1. **Integration Tests:**

```typescript
// server/tests/security/integration.test.ts
describe("Security Integration Tests", () => {
  it("should enforce auth -> rate limit -> validation chain", async () => {
    // Test complete security flow
  });

  it("should handle concurrent rate limit attempts", async () => {
    // Test race conditions
  });
});
```

2. **Penetration Tests:**

```typescript
// server/tests/security/penetration.test.ts
describe("Penetration Tests", () => {
  it("should resist brute force attacks", async () => {
    // Simulate multiple failed login attempts
  });

  it("should resist session hijacking", async () => {
    // Test session security
  });
});
```

3. **Compliance Tests:**

```typescript
// server/tests/security/compliance.test.ts
describe("OWASP Top 10 Compliance", () => {
  it("should pass A01: Broken Access Control checks");
  it("should pass A02: Cryptographic Failures checks");
  // ... all 10
});
```

**Estimated Time:** 4-6 hours

---

## Long-Term Maintenance

### 8. Regular Security Audits

**Schedule:**

- **Weekly:** Run `npm audit --production`
- **Monthly:** Review dependency updates
- **Quarterly:** Full security audit
- **Annually:** External penetration testing

**Automated Checks:**

```bash
# Add to CI/CD pipeline
npm run security:check
npm run security:console-check
npm audit --production
```

---

### 9. Security Documentation Updates

**Maintain:**

- Update `SECURITY_AUDIT_REPORT.md` after each audit
- Update `docs/SECURITY_GUIDELINES.md` when patterns change
- Document new vulnerabilities in `SECURITY.md`
- Keep compliance documentation current

---

### 10. Security Training

**Team Knowledge:**

- Share security guidelines with team
- Review OWASP Top 10 quarterly
- Conduct security code review sessions
- Stay updated on Auth.js security advisories

---

## Progress Tracking

### Completed ✅

- [x] Enhanced secret validation
- [x] Replaced console.log in auth modules
- [x] Added no-console ESLint rule
- [x] Created security documentation (36KB)
- [x] All security tests passing (87/87)

### In Progress 🔄

- [ ] Complete console.log migration (74 remaining)
- [ ] Audit API endpoints for validation
- [ ] Update dev dependencies

### Planned 📋

- [ ] Enhance JWT session security
- [ ] Standardize error responses
- [ ] Improve CORS configuration
- [ ] Expand security test coverage

---

## Support

**Questions?**

- Review: `docs/SECURITY_GUIDELINES.md`
- Contact: security@shuffleandsync.com
- Report: [GitHub Security Advisory](https://github.com/Shuffle-and-Sync/reimagined-guacamole/security/advisories)

**Tools:**

```bash
# Check security
npm run security:check

# Check console usage
npm run security:console-check

# Run tests
npm run test:security

# Audit dependencies
npm audit --production
```

---

**Last Updated:** October 2025  
**Next Review:** January 2026
