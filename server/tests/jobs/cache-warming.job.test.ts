/**
 * Tests for Cache Warming Job
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import {
  warmCache,
  scheduleCacheWarming,
  cacheWarmingConfig,
} from "../../jobs/cache-warming.job";

// Mock fetch
global.fetch = jest.fn() as any;

// Mock logger
jest.mock("../../logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe("Cache Warming Job", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as any).mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("cacheWarmingConfig", () => {
    it("should have high value endpoints configured", () => {
      expect(cacheWarmingConfig.highValueEndpoints).toBeDefined();
      expect(cacheWarmingConfig.highValueEndpoints.length).toBeGreaterThan(0);
    });

    it("should have endpoints with valid priorities", () => {
      cacheWarmingConfig.highValueEndpoints.forEach((endpoint) => {
        expect(["high", "medium", "low"]).toContain(endpoint.priority);
      });
    });

    it("should have endpoints with path and params", () => {
      cacheWarmingConfig.highValueEndpoints.forEach((endpoint) => {
        expect(endpoint.path).toBeDefined();
        expect(typeof endpoint.path).toBe("string");
        expect(endpoint.params).toBeDefined();
      });
    });
  });

  describe("warmCache", () => {
    it("should successfully warm all endpoints", async () => {
      // Mock successful responses
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
      });

      const result = await warmCache();

      expect(result.success).toBeGreaterThan(0);
      expect(result.failed).toBe(0);
      expect(global.fetch).toHaveBeenCalled();
    });

    it("should handle failed endpoint warming", async () => {
      // Mock one successful and one failed response
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        });

      const result = await warmCache();

      expect(result.success).toBeGreaterThan(0);
      expect(result.failed).toBeGreaterThan(0);
    });

    it("should handle network errors", async () => {
      // Mock network error
      (global.fetch as any).mockRejectedValue(new Error("Network error"));

      const result = await warmCache();

      expect(result.failed).toBe(cacheWarmingConfig.highValueEndpoints.length);
      expect(result.success).toBe(0);
    });

    it("should send correct headers", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
      });

      await warmCache();

      // Check that fetch was called with correct headers
      const firstCall = (global.fetch as any).mock.calls[0];
      expect(firstCall[1].headers["User-Agent"]).toBe(
        "ShuffleSync-CacheWarmer/1.0",
      );
      expect(firstCall[1].headers["X-Cache-Warming"]).toBe("true");
    });

    it("should construct correct URLs with query params", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
      });

      await warmCache();

      // Check that URLs are constructed correctly
      const calls = (global.fetch as any).mock.calls;
      expect(calls.length).toBeGreaterThan(0);

      // At least one call should have query params
      const callWithParams = calls.find((call: any[]) => call[0].includes("?"));
      expect(callWithParams).toBeDefined();
    });

    it("should process endpoints in priority order", async () => {
      const callOrder: string[] = [];

      (global.fetch as any).mockImplementation((url: string) => {
        callOrder.push(url);
        return Promise.resolve({ ok: true, status: 200 });
      });

      await warmCache();

      // Verify that high priority endpoints are called first
      const highPriorityEndpoints = cacheWarmingConfig.highValueEndpoints
        .filter((e) => e.priority === "high")
        .map((e) => e.path);

      const firstHighPriorityIndex = callOrder.findIndex((url) =>
        highPriorityEndpoints.some((path) => url.includes(path)),
      );

      const firstLowPriorityIndex = callOrder.findIndex((url) =>
        cacheWarmingConfig.highValueEndpoints
          .filter((e) => e.priority === "low")
          .map((e) => e.path)
          .some((path) => url.includes(path)),
      );

      if (firstHighPriorityIndex !== -1 && firstLowPriorityIndex !== -1) {
        expect(firstHighPriorityIndex).toBeLessThan(firstLowPriorityIndex);
      }
    });
  });

  describe("scheduleCacheWarming", () => {
    it("should schedule cache warming with default interval", () => {
      const timer = scheduleCacheWarming();

      expect(timer).toBeDefined();
      clearInterval(timer);
    });

    it("should schedule cache warming with custom interval", () => {
      const customInterval = 30 * 60 * 1000; // 30 minutes
      const timer = scheduleCacheWarming(customInterval);

      expect(timer).toBeDefined();
      clearInterval(timer);
    });

    it("should warm cache immediately on schedule", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
      });

      const timer = scheduleCacheWarming();

      // Wait a bit for initial warmup
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(global.fetch).toHaveBeenCalled();

      clearInterval(timer);
    });
  });
});
