/**
 * Jest Test Setup
 *
 * Global test setup and configuration for the test suite.
 */

import { resolve } from "path";
import { beforeAll, afterAll, jest } from "@jest/globals";
import { config } from "dotenv";

// Load test environment variables
config({ path: resolve(process.cwd(), ".env.test") });

// Set test environment
process.env.NODE_ENV = "test";

// Mock console methods to reduce noise in tests
const originalConsole = { ...console };

beforeAll(async () => {
  // Suppress console output during tests unless explicitly enabled
  if (!process.env.VERBOSE_TESTS) {
    console.log = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  }

  // Wait for database to be initialized
  // This ensures the database connection and schema are ready before tests run
  try {
    const { waitForDb } = await import("@shared/database-unified");
    await waitForDb();
  } catch (error) {
    console.error("Failed to initialize database in test setup:", error);
  }
});

afterAll(() => {
  // Restore console methods
  Object.assign(console, originalConsole);
});

// Global test utilities (deprecated - use factories from __factories__ instead)
global.testUtils = {
  // Mock user data factory
  createMockUser: (overrides = {}) => ({
    id: "test-user-id",
    name: "Test User",
    email: "test@example.com",
    status: "active",
    role: "user",
    isEmailVerified: true,
    mfaEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  // Mock request object
  createMockRequest: (overrides = {}) => ({
    body: {},
    params: {},
    query: {},
    headers: {},
    user: null,
    ip: "127.0.0.1",
    method: "GET",
    url: "/test",
    ...overrides,
  }),

  // Mock response object
  createMockResponse: () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      getHeader: jest.fn(),
      end: jest.fn().mockReturnThis(),
    };
    return res;
  },

  // Sleep utility for async tests
  sleep: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),
};

// Type declarations for global test utilities
declare global {
  var testUtils: {
    createMockUser: (
      overrides?: Record<string, unknown>,
    ) => Record<string, unknown>;
    createMockRequest: (
      overrides?: Record<string, unknown>,
    ) => Record<string, unknown>;
    createMockResponse: () => Record<string, jest.Mock>;
    sleep: (ms: number) => Promise<void>;
  };
}

/**
 * Track active timers and intervals for cleanup
 * This helps prevent resource leaks in tests
 */
const activeTimers = new Set<NodeJS.Timeout>();
const activeIntervals = new Set<NodeJS.Timeout>();

const originalSetTimeout = global.setTimeout;
const originalSetInterval = global.setInterval;
const originalClearTimeout = global.clearTimeout;
const originalClearInterval = global.clearInterval;

// Wrap setTimeout to track timers
global.setTimeout = function (
  ...args: Parameters<typeof setTimeout>
): ReturnType<typeof setTimeout> {
  const timer = originalSetTimeout.apply(this, args);
  activeTimers.add(timer);
  return timer;
} as typeof setTimeout;

// Wrap setInterval to track intervals
global.setInterval = function (
  ...args: Parameters<typeof setInterval>
): ReturnType<typeof setInterval> {
  const interval = originalSetInterval.apply(this, args);
  activeIntervals.add(interval);
  return interval;
} as typeof setInterval;

// Wrap clearTimeout to untrack timers
global.clearTimeout = function (timer: NodeJS.Timeout): void {
  activeTimers.delete(timer);
  originalClearTimeout(timer);
};

// Wrap clearInterval to untrack intervals
global.clearInterval = function (interval: NodeJS.Timeout): void {
  activeIntervals.delete(interval);
  originalClearInterval(interval);
};

/**
 * Clean up all active timers and intervals after all tests
 */
afterAll(() => {
  // Clear all active timers
  activeTimers.forEach((timer) => {
    originalClearTimeout(timer);
  });
  activeTimers.clear();

  // Clear all active intervals
  activeIntervals.forEach((interval) => {
    originalClearInterval(interval);
  });
  activeIntervals.clear();
});
