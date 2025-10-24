/**
 * Tests for Rate Limiting Configuration
 */

import {
  rateLimitConfig,
  getRateLimitConfig,
  getWhitelistedIPs,
} from "../../config/rateLimits";

describe("Rate Limit Configuration", () => {
  describe("rateLimitConfig", () => {
    test("should have public configuration", () => {
      expect(rateLimitConfig.public).toBeDefined();
      expect(rateLimitConfig.public.windowMs).toBe(15 * 60 * 1000);
      expect(rateLimitConfig.public.max).toBe(100);
      expect(rateLimitConfig.public.message).toBeDefined();
    });

    test("should have standard configuration", () => {
      expect(rateLimitConfig.standard).toBeDefined();
      expect(rateLimitConfig.standard.windowMs).toBe(15 * 60 * 1000);
      expect(rateLimitConfig.standard.max).toBe(1000);
    });

    test("should have strict configuration", () => {
      expect(rateLimitConfig.strict).toBeDefined();
      expect(rateLimitConfig.strict.windowMs).toBe(15 * 60 * 1000);
      expect(rateLimitConfig.strict.max).toBe(50);
    });

    test("should have auth configuration with skipSuccessfulRequests", () => {
      expect(rateLimitConfig.auth).toBeDefined();
      expect(rateLimitConfig.auth.max).toBe(5);
      expect(rateLimitConfig.auth.skipSuccessfulRequests).toBe(true);
    });

    test("should have expensive configuration with short window", () => {
      expect(rateLimitConfig.expensive).toBeDefined();
      expect(rateLimitConfig.expensive.windowMs).toBe(60 * 1000); // 1 minute
      expect(rateLimitConfig.expensive.max).toBe(10);
    });

    test("should have email configuration", () => {
      expect(rateLimitConfig.email).toBeDefined();
      expect(rateLimitConfig.email.windowMs).toBe(60 * 60 * 1000); // 1 hour
      expect(rateLimitConfig.email.max).toBe(10);
    });

    test("should have upload configuration", () => {
      expect(rateLimitConfig.upload).toBeDefined();
      expect(rateLimitConfig.upload.max).toBe(20);
    });

    test("should have messaging configuration", () => {
      expect(rateLimitConfig.messaging).toBeDefined();
      expect(rateLimitConfig.messaging.windowMs).toBe(60 * 1000); // 1 minute
      expect(rateLimitConfig.messaging.max).toBe(20);
    });

    test("should have eventCreation configuration", () => {
      expect(rateLimitConfig.eventCreation).toBeDefined();
      expect(rateLimitConfig.eventCreation.max).toBe(10);
    });

    test("all configurations should have required fields", () => {
      Object.entries(rateLimitConfig).forEach(([name, config]) => {
        expect(config.windowMs).toBeDefined();
        expect(config.max).toBeDefined();
        expect(config.message).toBeDefined();
        expect(typeof config.windowMs).toBe("number");
        expect(typeof config.max).toBe("number");
        expect(typeof config.message).toBe("string");
      });
    });

    test("stricter configurations should have lower max values", () => {
      expect(rateLimitConfig.auth.max).toBeLessThan(rateLimitConfig.strict.max);
      expect(rateLimitConfig.strict.max).toBeLessThan(
        rateLimitConfig.standard.max,
      );
    });
  });

  describe("getRateLimitConfig()", () => {
    test("should return configuration by name", () => {
      const config = getRateLimitConfig("public");
      expect(config).toEqual(rateLimitConfig.public);
    });

    test("should return correct configuration for each type", () => {
      expect(getRateLimitConfig("standard")).toEqual(rateLimitConfig.standard);
      expect(getRateLimitConfig("auth")).toEqual(rateLimitConfig.auth);
      expect(getRateLimitConfig("expensive")).toEqual(
        rateLimitConfig.expensive,
      );
    });
  });

  describe("getWhitelistedIPs()", () => {
    const originalEnv = process.env.RATE_LIMIT_WHITELIST;

    afterEach(() => {
      // Restore original environment variable
      if (originalEnv !== undefined) {
        process.env.RATE_LIMIT_WHITELIST = originalEnv;
      } else {
        delete process.env.RATE_LIMIT_WHITELIST;
      }
    });

    test("should return empty array when no whitelist is configured", () => {
      delete process.env.RATE_LIMIT_WHITELIST;
      expect(getWhitelistedIPs()).toEqual([]);
    });

    test("should return empty array when whitelist is empty string", () => {
      process.env.RATE_LIMIT_WHITELIST = "";
      expect(getWhitelistedIPs()).toEqual([]);
    });

    test("should parse single IP from whitelist", () => {
      process.env.RATE_LIMIT_WHITELIST = "192.168.1.1";
      expect(getWhitelistedIPs()).toEqual(["192.168.1.1"]);
    });

    test("should parse multiple IPs from whitelist", () => {
      process.env.RATE_LIMIT_WHITELIST = "192.168.1.1,10.0.0.1,172.16.0.1";
      expect(getWhitelistedIPs()).toEqual([
        "192.168.1.1",
        "10.0.0.1",
        "172.16.0.1",
      ]);
    });

    test("should handle whitelist with spaces", () => {
      process.env.RATE_LIMIT_WHITELIST = "192.168.1.1, 10.0.0.1, 172.16.0.1";
      const ips = getWhitelistedIPs();
      expect(ips).toHaveLength(3);
      expect(ips).toContain("192.168.1.1");
      expect(ips).toContain("10.0.0.1");
      expect(ips).toContain("172.16.0.1");
    });

    test("should filter out empty strings", () => {
      process.env.RATE_LIMIT_WHITELIST = "192.168.1.1,,10.0.0.1,";
      const ips = getWhitelistedIPs();
      expect(ips).toHaveLength(2);
      expect(ips).toEqual(["192.168.1.1", "10.0.0.1"]);
    });
  });

  describe("Configuration Validation", () => {
    test("window times should be reasonable", () => {
      Object.entries(rateLimitConfig).forEach(([name, config]) => {
        // Window should be at least 1 minute
        expect(config.windowMs).toBeGreaterThanOrEqual(60 * 1000);
        // Window should not exceed 24 hours
        expect(config.windowMs).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
      });
    });

    test("max values should be positive", () => {
      Object.entries(rateLimitConfig).forEach(([name, config]) => {
        expect(config.max).toBeGreaterThan(0);
      });
    });

    test("messages should be helpful", () => {
      Object.entries(rateLimitConfig).forEach(([name, config]) => {
        expect(config.message).toMatch(
          /limit|exceeded|slow|try again|attempts/i,
        );
      });
    });
  });
});
