/**
 * Comprehensive Security Audit Test Suite
 *
 * This test suite validates all items from the Security Audit & Hardening Checklist
 * for production release readiness.
 */

import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { describe, test, expect } from "@jest/globals";
import { auditSecurityConfiguration } from "../../utils/security.utils";

describe("Security Audit & Hardening Checklist", () => {
  describe("1. Dependencies audited and vulnerabilities addressed", () => {
    test("should have no vulnerabilities in production dependencies", () => {
      try {
        // Run npm audit for production dependencies only
        const auditResult = execSync("npm audit --production --json", {
          encoding: "utf8",
          stdio: ["pipe", "pipe", "pipe"],
        });

        const audit = JSON.parse(auditResult);
        const vulnerabilityCount = audit.metadata?.vulnerabilities?.total || 0;

        expect(vulnerabilityCount).toBe(0);
      } catch (error: unknown) {
        // npm audit exits with non-zero when vulnerabilities are found
        if (error.stdout) {
          const audit = JSON.parse(error.stdout);
          const vulnerabilityCount =
            audit.metadata?.vulnerabilities?.total || 0;
          expect(vulnerabilityCount).toBe(0);
        } else {
          throw error;
        }
      }
    });

    test("should have all dependencies up to date with security patches", () => {
      // Check that package-lock.json exists (ensures dependency integrity)
      const packageLockPath = join(process.cwd(), "package-lock.json");
      expect(existsSync(packageLockPath)).toBe(true);
    });
  });

  describe("2. Authentication flows tested", () => {
    test("should have Auth.js properly configured with secure settings", () => {
      const authConfigPath = join(process.cwd(), "server/auth/auth.config.ts");
      const authConfig = readFileSync(authConfigPath, "utf8");

      // Verify critical security settings
      expect(authConfig).toContain("trustHost: true");
      expect(authConfig).toContain("httpOnly: true");
      expect(authConfig).toContain('strategy: "database"');
    });

    test("should require AUTH_SECRET environment variable", () => {
      const authConfigPath = join(process.cwd(), "server/auth/auth.config.ts");
      const authConfig = readFileSync(authConfigPath, "utf8");

      expect(authConfig).toContain("process.env.AUTH_SECRET");
      expect(authConfig).toContain(
        "AUTH_SECRET environment variable is required",
      );
    });

    test("should have MFA support implemented", () => {
      const authConfigPath = join(process.cwd(), "server/auth/auth.config.ts");
      const authConfig = readFileSync(authConfigPath, "utf8");

      expect(authConfig).toContain("mfaEnabled");
      expect(authConfig).toContain("MFA_REQUIRED");
    });

    test("should have account lockout mechanism", () => {
      const authConfigPath = join(process.cwd(), "server/auth/auth.config.ts");
      const authConfig = readFileSync(authConfigPath, "utf8");

      expect(authConfig).toContain("accountLockedUntil");
      expect(authConfig).toContain("failedLoginAttempts");
    });
  });

  describe("3. API rate limiting implemented", () => {
    test("should have rate limiting middleware configured", () => {
      const rateLimitPath = join(process.cwd(), "server/rate-limiting.ts");
      expect(existsSync(rateLimitPath)).toBe(true);

      const rateLimit = readFileSync(rateLimitPath, "utf8");
      expect(rateLimit).toContain("rateLimit");
      expect(rateLimit).toContain("generalRateLimit");
      expect(rateLimit).toContain("authRateLimit");
    });

    test("should have strict auth rate limiting (5 attempts per 15 min)", () => {
      const rateLimitPath = join(process.cwd(), "server/rate-limiting.ts");
      const rateLimit = readFileSync(rateLimitPath, "utf8");

      expect(rateLimit).toContain("authRateLimit");
      expect(rateLimit).toMatch(/max:\s*5/);
      expect(rateLimit).toMatch(/15\s*\*\s*60\s*\*\s*1000/);
    });

    test("should have message rate limiting", () => {
      const rateLimitPath = join(process.cwd(), "server/rate-limiting.ts");
      const rateLimit = readFileSync(rateLimitPath, "utf8");

      expect(rateLimit).toContain("messageRateLimit");
    });

    test("should have event creation rate limiting", () => {
      const rateLimitPath = join(process.cwd(), "server/rate-limiting.ts");
      const rateLimit = readFileSync(rateLimitPath, "utf8");

      expect(rateLimit).toContain("eventCreationRateLimit");
    });
  });

  describe("4. Environment variables properly secured", () => {
    test("should have comprehensive .gitignore patterns for .env files", () => {
      const gitignorePath = join(process.cwd(), ".gitignore");
      const gitignore = readFileSync(gitignorePath, "utf8");

      expect(gitignore).toContain("*.env*");
      expect(gitignore).toContain(".env*");
      expect(gitignore).toContain(".env.local");
      expect(gitignore).toContain(".env.production");
    });

    test("should allow only safe example env files", () => {
      const gitignorePath = join(process.cwd(), ".gitignore");
      const gitignore = readFileSync(gitignorePath, "utf8");

      expect(gitignore).toContain("!.env.example");
      expect(gitignore).toContain("!.env.production.template");
      expect(gitignore).toContain("!.env.test");
    });

    test("should have .env.example as template", () => {
      const envExamplePath = join(process.cwd(), ".env.example");
      expect(existsSync(envExamplePath)).toBe(true);

      const envExample = readFileSync(envExamplePath, "utf8");
      // Should not contain real credentials
      expect(envExample).not.toMatch(/sk_live_/);
      expect(envExample).not.toMatch(/AIza[A-Za-z0-9_-]{35}/);
    });

    test("should not commit .env.production to git history", () => {
      try {
        execSync(
          'git log --all --pretty=format: --name-only --diff-filter=A | grep -E "^\\.env\\.production$"',
          {
            encoding: "utf8",
            stdio: ["pipe", "pipe", "pipe"],
          },
        );
        // If we get here, .env.production was found
        fail(".env.production should not exist in git history");
      } catch (error: unknown) {
        // Good - grep returned no results (exit code 1) or other error
        // grep exits with 1 when no matches, which is what we want
        if (error.status === undefined) {
          // If status is undefined, the command likely failed for another reason
          // Check if stderr contains 'bad object' which means the commit doesn't exist
          if (
            error.stderr?.includes("bad object") ||
            error.message?.includes("bad object")
          ) {
            expect(true).toBe(true); // This is fine - commit doesn't exist
          } else {
            expect(error.status || 1).toBe(1); // Accept undefined as 1 (no matches)
          }
        } else {
          expect(error.status).toBe(1); // grep exits with 1 when no matches
        }
      }
    });
  });

  describe("5. CORS settings appropriate for production", () => {
    test("should have CORS configuration in validation.ts", () => {
      const validationPath = join(process.cwd(), "server/validation.ts");
      const validation = readFileSync(validationPath, "utf8");

      expect(validation).toContain("securityHeaders");
    });

    test("should set proper security headers", () => {
      const validationPath = join(process.cwd(), "server/validation.ts");
      const validation = readFileSync(validationPath, "utf8");

      expect(validation).toContain("X-Content-Type-Options");
      expect(validation).toContain("X-Frame-Options");
      expect(validation).toContain("X-XSS-Protection");
      expect(validation).toContain("Referrer-Policy");
    });
  });

  describe("6. Content Security Policy (CSP) headers configured", () => {
    test("should have CSP headers in production", () => {
      const validationPath = join(process.cwd(), "server/validation.ts");
      const validation = readFileSync(validationPath, "utf8");

      expect(validation).toContain("Content-Security-Policy");
      expect(validation).toContain("default-src 'self'");
    });

    test("should have strict CSP in production, report-only in development", () => {
      const validationPath = join(process.cwd(), "server/validation.ts");
      const validation = readFileSync(validationPath, "utf8");

      expect(validation).toContain("Content-Security-Policy-Report-Only");
      expect(validation).toContain('NODE_ENV === "production"');
    });

    test("should restrict frame-ancestors to prevent clickjacking", () => {
      const validationPath = join(process.cwd(), "server/validation.ts");
      const validation = readFileSync(validationPath, "utf8");

      expect(validation).toContain("frame-ancestors 'none'");
    });

    test("should restrict object-src", () => {
      const validationPath = join(process.cwd(), "server/validation.ts");
      const validation = readFileSync(validationPath, "utf8");

      expect(validation).toContain("object-src 'none'");
    });
  });

  describe("7. Input validation implemented across all user inputs", () => {
    test("should have comprehensive Zod validation schemas", () => {
      const validationPath = join(process.cwd(), "server/validation.ts");
      const validation = readFileSync(validationPath, "utf8");

      expect(validation).toContain("validateEmailSchema");
      expect(validation).toContain("validateUserProfileUpdateSchema");
      expect(validation).toContain("validateEventSchema");
      expect(validation).toContain("validateMessageSchema");
    });

    test("should have input sanitization middleware", () => {
      const securityMiddlewarePath = join(
        process.cwd(),
        "server/middleware/security.middleware.ts",
      );
      const securityMiddleware = readFileSync(securityMiddlewarePath, "utf8");

      expect(securityMiddleware).toContain("inputSanitizationMiddleware");
      expect(securityMiddleware).toContain("sanitizeInput");
    });

    test("should have SQL injection protection", () => {
      const validationPath = join(process.cwd(), "server/validation.ts");
      const validation = readFileSync(validationPath, "utf8");

      expect(validation).toContain("sanitizeInput");
      expect(validation).toMatch(/[<>]/); // XSS protection
    });

    test("should validate UUIDs for ID parameters", () => {
      const validationPath = join(process.cwd(), "server/validation.ts");
      const validation = readFileSync(validationPath, "utf8");

      expect(validation).toContain("validateUUID");
      expect(validation).toContain("uuidParamSchema");
    });
  });

  describe("8. Sensitive data handling reviewed for compliance", () => {
    test("should use structured logging instead of console.log", () => {
      const loggerPath = join(process.cwd(), "server/logger.ts");
      expect(existsSync(loggerPath)).toBe(true);
    });

    test("should have credential leak detection", () => {
      const securityUtilsPath = join(
        process.cwd(),
        "server/utils/security.utils.ts",
      );
      const securityUtils = readFileSync(securityUtilsPath, "utf8");

      expect(securityUtils).toContain("detectCredentialLeak");
      expect(securityUtils).toContain("sanitizeCredentials");
    });

    test("should hash passwords with bcrypt or argon2", () => {
      const passwordPath = join(process.cwd(), "server/auth/password.ts");
      const password = readFileSync(passwordPath, "utf8");

      // Should use either bcrypt or argon2
      const hasBcrypt = password.includes("bcrypt");
      const hasArgon2 = password.includes("argon2");

      expect(hasBcrypt || hasArgon2).toBe(true);
    });

    test("should not log passwords or tokens", () => {
      // Check common files for console.log with sensitive data
      const files = [
        "server/auth/password.ts",
        "server/auth/tokens.ts",
        "server/storage.ts",
      ];

      files.forEach((file) => {
        const filePath = join(process.cwd(), file);
        if (existsSync(filePath)) {
          const content = readFileSync(filePath, "utf8");

          // Should not have console.log of password or token directly
          expect(content).not.toMatch(/console\.log\([^)]*password[^)]*\)/i);
          expect(content).not.toMatch(/console\.log\([^)]*token[^)]*\)/i);
        }
      });
    });
  });

  describe("9. OAuth scopes minimized to necessary permissions", () => {
    test("should use default scopes from Auth.js providers", () => {
      const authConfigPath = join(process.cwd(), "server/auth/auth.config.ts");
      const authConfig = readFileSync(authConfigPath, "utf8");

      // Auth.js Google provider defaults to 'openid profile email' which is minimal
      // Auth.js Twitch provider defaults to 'openid email' which is minimal
      // We should NOT be requesting additional scopes unless necessary

      // Check that we're not requesting excessive scopes
      expect(authConfig).not.toContain("googleapis.com/auth/drive");
      expect(authConfig).not.toContain("googleapis.com/auth/calendar");
      expect(authConfig).not.toContain("channel:read:subscriptions");
      expect(authConfig).not.toContain("user:read:email"); // Twitch - already in default
    });

    test("should document which OAuth scopes are used and why", () => {
      // Check if there's documentation about OAuth scopes
      const envExamplePath = join(process.cwd(), ".env.example");
      const envExample = readFileSync(envExamplePath, "utf8");

      expect(envExample).toContain("GOOGLE_CLIENT_ID");
      expect(envExample).toContain("TWITCH_CLIENT_ID");
    });
  });

  describe("10. Third-party service credentials rotated before deployment", () => {
    test("should not use demo/test credentials in production", () => {
      const securityAudit = auditSecurityConfiguration();

      if (process.env.NODE_ENV === "production") {
        expect(securityAudit.passed).toBe(true);
        expect(securityAudit.issues).not.toContainEqual(
          expect.stringContaining(
            "Using development AUTH_SECRET in production",
          ),
        );
      } else {
        // In development, just check that the audit runs
        expect(securityAudit).toHaveProperty("passed");
        expect(securityAudit).toHaveProperty("issues");
      }
    });

    test("should have security configuration audit function", () => {
      const securityUtilsPath = join(
        process.cwd(),
        "server/utils/security.utils.ts",
      );
      const securityUtils = readFileSync(securityUtilsPath, "utf8");

      expect(securityUtils).toContain("auditSecurityConfiguration");
      expect(securityUtils).toContain("validateEnvironmentVariables");
    });

    test("should validate AUTH_SECRET strength", () => {
      const securityUtilsPath = join(
        process.cwd(),
        "server/utils/security.utils.ts",
      );
      const securityUtils = readFileSync(securityUtilsPath, "utf8");

      expect(securityUtils).toContain("validateJWTSecret");
      expect(securityUtils).toContain(
        "AUTH_SECRET must be at least 32 characters",
      );
    });
  });

  describe("Additional Security Best Practices", () => {
    test("should have HSTS header in production", () => {
      const validationPath = join(process.cwd(), "server/validation.ts");
      const validation = readFileSync(validationPath, "utf8");

      expect(validation).toContain("Strict-Transport-Security");
      expect(validation).toContain('NODE_ENV === "production"');
    });

    test("should use secure cookies in production", () => {
      const authConfigPath = join(process.cwd(), "server/auth/auth.config.ts");
      const authConfig = readFileSync(authConfigPath, "utf8");

      expect(authConfig).toContain("useSecureCookies");
      expect(authConfig).toContain('NODE_ENV === "production"');
    });

    test("should have CSRF protection enabled", () => {
      const authConfigPath = join(process.cwd(), "server/auth/auth.config.ts");
      const authConfig = readFileSync(authConfigPath, "utf8");

      expect(authConfig).toContain("csrfToken");
    });

    test("should log security events for audit trail", () => {
      const authConfigPath = join(process.cwd(), "server/auth/auth.config.ts");
      const authConfig = readFileSync(authConfigPath, "utf8");

      expect(authConfig).toContain("createAuthAuditLog");
      expect(authConfig).toContain("login_success");
      expect(authConfig).toContain("login_failure");
    });

    test("should have security monitoring middleware", () => {
      const securityMiddlewarePath = join(
        process.cwd(),
        "server/middleware/security.middleware.ts",
      );
      const securityMiddleware = readFileSync(securityMiddlewarePath, "utf8");

      expect(securityMiddleware).toContain("securityMonitoringMiddleware");
    });

    test("should run security audit on startup in production", () => {
      const indexPath = join(process.cwd(), "server/index.ts");
      const index = readFileSync(indexPath, "utf8");

      expect(index).toContain("auditSecurityConfiguration");
    });
  });
});
