/**
 * Tests for Cost-Based Rate Limiter Middleware
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import {
  costBasedRateLimitUtils,
  operationCosts,
} from "../../middleware/cost-based-rate-limiter.middleware";
import type { Request, Response } from "express";

const { getRouteCost, getUserKey, getUserQuota, deductQuota, quotaStore } =
  costBasedRateLimitUtils;

describe("Cost-Based Rate Limiter Middleware", () => {
  beforeEach(() => {
    // Clear quota store before each test
    quotaStore.clear();
  });

  describe("getRouteCost", () => {
    it("should return correct cost for predefined endpoints", () => {
      const req = {
        method: "GET",
        route: { path: "/api/v1/events" },
      } as Partial<Request>;

      const cost = getRouteCost(req as Request);
      expect(cost).toBe(1);
    });

    it("should return cost for search endpoint", () => {
      const req = {
        method: "GET",
        route: { path: "/api/v1/search" },
      } as Partial<Request>;

      const cost = getRouteCost(req as Request);
      expect(cost).toBe(5);
    });

    it("should return cost for analytics endpoint", () => {
      const req = {
        method: "POST",
        route: { path: "/api/v1/analytics/report" },
      } as Partial<Request>;

      const cost = getRouteCost(req as Request);
      expect(cost).toBe(10);
    });

    it("should return default cost for unknown endpoints", () => {
      const req = {
        method: "GET",
        route: { path: "/api/unknown" },
      } as Partial<Request>;

      const cost = getRouteCost(req as Request);
      expect(cost).toBe(1);
    });

    it("should handle missing route", () => {
      const req = {
        method: "GET",
        path: "/api/test",
      } as Partial<Request>;

      const cost = getRouteCost(req as Request);
      expect(cost).toBe(1);
    });
  });

  describe("getUserKey", () => {
    it("should return user ID for authenticated users", () => {
      const req = {
        user: { id: "user-123" },
      } as any;

      const key = getUserKey(req);
      expect(key).toBe("user-123");
    });

    it("should return IP for unauthenticated users", () => {
      const req = {
        ip: "192.168.1.1",
      } as Partial<Request>;

      const key = getUserKey(req as Request);
      expect(key).toBe("192.168.1.1");
    });

    it("should return 'anonymous' when no user or IP", () => {
      const req = {} as Partial<Request>;

      const key = getUserKey(req as Request);
      expect(key).toBe("anonymous");
    });
  });

  describe("getUserQuota", () => {
    it("should return default quota for new users", () => {
      const req = {
        user: { id: "user-123" },
      } as any;

      const quota = getUserQuota(req, 60000);
      expect(quota).toBe(100);
    });

    it("should return remaining quota for existing users", () => {
      const req = {
        user: { id: "user-123" },
      } as any;

      // Set initial quota
      quotaStore.set("user-123", {
        remaining: 50,
        resetAt: Date.now() + 60000,
      });

      const quota = getUserQuota(req, 60000);
      expect(quota).toBe(50);
    });

    it("should reset quota when window expired", () => {
      const req = {
        user: { id: "user-123" },
      } as any;

      // Set expired quota
      quotaStore.set("user-123", {
        remaining: 10,
        resetAt: Date.now() - 1000, // Expired
      });

      const quota = getUserQuota(req, 60000);
      expect(quota).toBe(100); // Reset to default
    });
  });

  describe("deductQuota", () => {
    it("should deduct cost from existing quota", () => {
      const req = {
        user: { id: "user-123" },
      } as any;

      // Set initial quota
      quotaStore.set("user-123", {
        remaining: 100,
        resetAt: Date.now() + 60000,
      });

      deductQuota(req, 10, 60000);

      const quota = quotaStore.get("user-123");
      expect(quota?.remaining).toBe(90);
    });

    it("should initialize quota for new users", () => {
      const req = {
        user: { id: "user-456" },
      } as any;

      deductQuota(req, 5, 60000);

      const quota = quotaStore.get("user-456");
      expect(quota?.remaining).toBe(95);
      expect(quota?.resetAt).toBeGreaterThan(Date.now());
    });

    it("should reset and deduct when quota expired", () => {
      const req = {
        user: { id: "user-123" },
      } as any;

      // Set expired quota
      quotaStore.set("user-123", {
        remaining: 10,
        resetAt: Date.now() - 1000, // Expired
      });

      deductQuota(req, 20, 60000);

      const quota = quotaStore.get("user-123");
      expect(quota?.remaining).toBe(80); // 100 - 20
    });

    it("should allow negative remaining (over quota)", () => {
      const req = {
        user: { id: "user-123" },
      } as any;

      // Set low quota
      quotaStore.set("user-123", {
        remaining: 5,
        resetAt: Date.now() + 60000,
      });

      deductQuota(req, 10, 60000);

      const quota = quotaStore.get("user-123");
      expect(quota?.remaining).toBe(-5);
    });
  });

  describe("operationCosts", () => {
    it("should have costs defined for common endpoints", () => {
      const eventsEndpoint = operationCosts.find(
        (op) => op.endpoint === "GET /api/v1/events",
      );
      expect(eventsEndpoint).toBeDefined();
      expect(eventsEndpoint?.cost).toBe(1);

      const searchEndpoint = operationCosts.find(
        (op) => op.endpoint === "GET /api/v1/search",
      );
      expect(searchEndpoint).toBeDefined();
      expect(searchEndpoint?.cost).toBe(5);

      const analyticsEndpoint = operationCosts.find(
        (op) => op.endpoint === "POST /api/v1/analytics/report",
      );
      expect(analyticsEndpoint).toBeDefined();
      expect(analyticsEndpoint?.cost).toBe(10);
    });

    it("should have costs in valid range (1-10)", () => {
      operationCosts.forEach((op) => {
        expect(op.cost).toBeGreaterThanOrEqual(1);
        expect(op.cost).toBeLessThanOrEqual(10);
      });
    });
  });
});
