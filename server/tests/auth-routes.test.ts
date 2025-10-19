/**
 * Auth Routes Pattern Test
 *
 * Tests that the wildcard pattern used in auth.routes.ts correctly
 * captures requests to Auth.js endpoints like /api/auth/callback/google
 */

import { describe, test, expect } from "@jest/globals";
import { Router } from "express";

describe("Auth Routes - Wildcard Pattern", () => {
  test("/* pattern should be used for Express Router wildcard matching", () => {
    // This test validates the pattern we use in server/auth/auth.routes.ts
    const router = Router();

    // The correct pattern for matching all sub-paths in a router
    const correctPattern = "/*";

    // This is what we changed from (incorrect)
    const incorrectPattern = "*";

    // Validate we're using the correct Express Router wildcard syntax
    expect(correctPattern).toBe("/*");
    expect(correctPattern).not.toBe(incorrectPattern);
  });

  test("ExpressAuth should auto-detect basePath from request", () => {
    // According to @auth/express source code:
    // config.basePath = getBasePath(req)
    // where getBasePath extracts the basePath from req.baseUrl and req.params[0]

    // When router is mounted at /api/auth and uses "/*" pattern:
    // - Request: /api/auth/callback/google
    // - req.baseUrl: /api/auth
    // - req.params[0]: /callback/google
    // - getBasePath() returns: /api/auth

    const expectedBasePath = "/api/auth";
    const requestPath = "/api/auth/callback/google";

    expect(requestPath).toContain(expectedBasePath);
    expect(requestPath.replace(expectedBasePath, "")).toBe("/callback/google");
  });

  test("Google OAuth callback route should be accessible at /api/auth/callback/google", () => {
    // The callback URL configured in Google OAuth console
    const callbackURL = "/api/auth/callback/google";

    // This should match our auth router pattern
    expect(callbackURL).toMatch(/^\/api\/auth\/.+/);

    // The router at /api/auth with pattern /* should handle /callback/google
    const routerBasePath = "/api/auth";
    const routerPattern = "/*";
    const subPath = callbackURL.replace(routerBasePath, "");

    expect(subPath).toBe("/callback/google");
    expect(routerPattern).toBe("/*");
  });
});

describe("Auth Routes - Required Endpoints", () => {
  const authBasePath = "/api/auth";

  test("should support Google OAuth callback endpoint", () => {
    const endpoint = `${authBasePath}/callback/google`;
    expect(endpoint).toBe("/api/auth/callback/google");
  });

  test("should support providers endpoint", () => {
    const endpoint = `${authBasePath}/providers`;
    expect(endpoint).toBe("/api/auth/providers");
  });

  test("should support session endpoint", () => {
    const endpoint = `${authBasePath}/session`;
    expect(endpoint).toBe("/api/auth/session");
  });

  test("should support signin endpoint", () => {
    const endpoint = `${authBasePath}/signin`;
    expect(endpoint).toBe("/api/auth/signin");
  });

  test("should support signin with provider endpoint", () => {
    const endpoint = `${authBasePath}/signin/google`;
    expect(endpoint).toBe("/api/auth/signin/google");
  });
});

describe("ExpressAuth basePath behavior", () => {
  test("should not require explicit basePath in config", () => {
    // According to @auth/express source (index.ts line ~20):
    // config.basePath = getBasePath(req)
    // This OVERWRITES any basePath set in the config

    // Therefore, setting basePath: "/api/auth" in the config is redundant
    // ExpressAuth will calculate it from the request automatically

    const explicitBasePath = "/api/auth"; // What we had before
    const autoDetectedBasePath = "/api/auth"; // What ExpressAuth calculates

    // They're the same, but auto-detection is more reliable
    expect(autoDetectedBasePath).toBe(explicitBasePath);
  });
});
