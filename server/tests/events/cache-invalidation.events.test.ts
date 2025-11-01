import { describe, it, expect, beforeEach, jest } from "@jest/globals";

// Mock the advanced cache service
jest.mock("../../services/advanced-cache.service", () => ({
  advancedCache: {
    invalidate: jest.fn().mockResolvedValue(1),
    invalidatePattern: jest.fn().mockResolvedValue(5),
  },
}));

describe("CacheInvalidationEmitter", () => {
  let cacheInvalidation: typeof import("../../events/cache-invalidation.events").cacheInvalidation;

  beforeEach(async () => {
    jest.clearAllMocks();
    // Dynamically import to ensure mock is applied
    const module = await import("../../events/cache-invalidation.events");
    cacheInvalidation = module.cacheInvalidation;
  });

  it("should invalidate a specific key", async () => {
    const { advancedCache } = await import(
      "../../services/advanced-cache.service"
    );

    cacheInvalidation.invalidateKey("test:key", "Test reason");

    // Wait for async event handler
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(advancedCache.invalidate).toHaveBeenCalledWith("test:key");
  });

  it("should invalidate keys by pattern", async () => {
    const { advancedCache } = await import(
      "../../services/advanced-cache.service"
    );

    cacheInvalidation.invalidatePattern("test:*", "Test pattern reason");

    // Wait for async event handler
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(advancedCache.invalidatePattern).toHaveBeenCalledWith("test:*");
  });

  it("should handle multiple invalidations", async () => {
    const { advancedCache } = await import(
      "../../services/advanced-cache.service"
    );

    cacheInvalidation.invalidateKey("key1");
    cacheInvalidation.invalidateKey("key2");
    cacheInvalidation.invalidatePattern("pattern:*");

    // Wait for async event handlers
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(advancedCache.invalidate).toHaveBeenCalledTimes(2);
    expect(advancedCache.invalidatePattern).toHaveBeenCalledTimes(1);
  });
});
