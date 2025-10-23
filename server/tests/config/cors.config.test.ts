/**
 * CORS Configuration Tests
 *
 * Tests for environment-based CORS configuration.
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import {
  getAllowedOrigins,
  createCorsConfig,
  createDevCorsConfig,
  validateCorsConfig,
} from "../../config/cors.config";

describe("CORS Configuration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe("getAllowedOrigins", () => {
    it("should return origins from CORS_ORIGINS env variable", () => {
      process.env.CORS_ORIGINS = "https://example.com,https://app.example.com";

      const origins = getAllowedOrigins();

      expect(origins).toHaveLength(2);
      expect(origins).toContain("https://example.com");
      expect(origins).toContain("https://app.example.com");
    });

    it("should fallback to ALLOWED_ORIGINS if CORS_ORIGINS not set", () => {
      delete process.env.CORS_ORIGINS;
      process.env.ALLOWED_ORIGINS = "https://legacy.com";

      const origins = getAllowedOrigins();

      expect(origins).toContain("https://legacy.com");
    });

    it("should trim whitespace from origins", () => {
      process.env.CORS_ORIGINS =
        " https://example.com , https://app.example.com ";

      const origins = getAllowedOrigins();

      expect(origins).toEqual([
        "https://example.com",
        "https://app.example.com",
      ]);
    });

    it("should filter out empty strings", () => {
      process.env.CORS_ORIGINS = "https://example.com,,https://app.example.com";

      const origins = getAllowedOrigins();

      expect(origins).toHaveLength(2);
      expect(origins).not.toContain("");
    });

    it("should return development defaults when not configured in development", () => {
      delete process.env.CORS_ORIGINS;
      delete process.env.ALLOWED_ORIGINS;
      process.env.NODE_ENV = "development";

      const origins = getAllowedOrigins();

      expect(origins.length).toBeGreaterThan(0);
      expect(origins).toContain("http://localhost:3000");
      expect(origins).toContain("http://localhost:5173");
    });

    it("should throw error when not configured in production", () => {
      delete process.env.CORS_ORIGINS;
      delete process.env.ALLOWED_ORIGINS;
      process.env.NODE_ENV = "production";

      expect(() => getAllowedOrigins()).toThrow(
        "CORS_ORIGINS environment variable must be set in production",
      );
    });
  });

  describe("createCorsConfig", () => {
    beforeEach(() => {
      process.env.CORS_ORIGINS = "https://example.com,https://app.example.com";
    });

    it("should create CORS config with allowed origins", () => {
      const config = createCorsConfig();

      expect(config.origin).toBeInstanceOf(Function);
      expect(config.credentials).toBe(true);
      expect(config.methods).toContain("GET");
      expect(config.methods).toContain("POST");
    });

    it("should allow requests from configured origins", (done) => {
      const config = createCorsConfig();
      const origin = "https://example.com";

      if (typeof config.origin === "function") {
        config.origin(origin, (err, allowed) => {
          expect(err).toBeNull();
          expect(allowed).toBe(true);
          done();
        });
      }
    });

    it("should block requests from non-configured origins", (done) => {
      const config = createCorsConfig();
      const origin = "https://malicious.com";

      if (typeof config.origin === "function") {
        config.origin(origin, (err, _allowed) => {
          expect(err).toBeInstanceOf(Error);
          expect(err?.message).toBe("Not allowed by CORS");
          done();
        });
      }
    });

    it("should allow requests with no origin (mobile apps, curl)", (done) => {
      const config = createCorsConfig();

      if (typeof config.origin === "function") {
        config.origin(undefined, (err, allowed) => {
          expect(err).toBeNull();
          expect(allowed).toBe(true);
          done();
        });
      }
    });

    it("should respect CORS_ALLOW_CREDENTIALS setting", () => {
      process.env.CORS_ALLOW_CREDENTIALS = "false";
      const config = createCorsConfig();
      expect(config.credentials).toBe(false);

      process.env.CORS_ALLOW_CREDENTIALS = "true";
      const config2 = createCorsConfig();
      expect(config2.credentials).toBe(true);
    });

    it("should use custom methods from environment", () => {
      process.env.CORS_METHODS = "GET,POST,DELETE";
      const config = createCorsConfig();

      expect(config.methods).toEqual(["GET", "POST", "DELETE"]);
    });

    it("should set correct exposed headers", () => {
      const config = createCorsConfig();

      expect(config.exposedHeaders).toContain("X-Request-ID");
      expect(config.exposedHeaders).toContain("X-RateLimit-Limit");
    });

    it("should set preflight options correctly", () => {
      const config = createCorsConfig();

      expect(config.preflightContinue).toBe(false);
      expect(config.optionsSuccessStatus).toBe(204);
    });

    it("should respect CORS_MAX_AGE setting", () => {
      process.env.CORS_MAX_AGE = "3600";
      const config = createCorsConfig();

      expect(config.maxAge).toBe(3600);
    });
  });

  describe("createDevCorsConfig", () => {
    it("should create permissive CORS config for development", () => {
      const config = createDevCorsConfig();

      expect(config.origin).toBe(true);
      expect(config.credentials).toBe(true);
      expect(config.methods).toContain("GET");
      expect(config.methods).toContain("POST");
      expect(config.methods).toContain("OPTIONS");
    });

    it("should allow all origins in development", () => {
      const config = createDevCorsConfig();

      expect(config.origin).toBe(true);
    });
  });

  describe("validateCorsConfig", () => {
    it("should validate correct configuration", () => {
      process.env.CORS_ORIGINS = "https://example.com,https://app.example.com";

      expect(() => validateCorsConfig()).not.toThrow();
    });

    it("should throw error for invalid URL format", () => {
      process.env.CORS_ORIGINS = "not-a-valid-url,https://example.com";

      expect(() => validateCorsConfig()).toThrow("Invalid CORS origin");
    });

    it("should throw error when no origins configured", () => {
      process.env.CORS_ORIGINS = "";
      process.env.NODE_ENV = "production";

      expect(() => validateCorsConfig()).toThrow();
    });

    it("should validate all origins are valid URLs", () => {
      process.env.CORS_ORIGINS =
        "https://example.com,http://localhost:3000,https://app.example.com";

      expect(() => validateCorsConfig()).not.toThrow();
    });

    it("should throw error for malformed origins", () => {
      process.env.CORS_ORIGINS = "example.com,https://app.example.com";

      expect(() => validateCorsConfig()).toThrow(
        "Invalid CORS origin: example.com",
      );
    });
  });
});
