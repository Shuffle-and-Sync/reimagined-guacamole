/**
 * Vitest Setup File
 *
 * Global test setup for frontend tests using Vitest.
 * This file runs before each test file.
 *
 * Refactored for:
 * - Better test isolation
 * - Proper resource cleanup
 * - MSW server reset
 */

import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll, afterAll, vi } from "vitest";
import { server } from "./mocks/server";

// Track active timers for cleanup
const activeTimers = new Set<ReturnType<typeof setTimeout>>();
const originalSetTimeout = global.setTimeout;
const originalClearTimeout = global.clearTimeout;

// Wrap setTimeout to track timers
global.setTimeout = function (...args: any[]): any {
  const timer = originalSetTimeout.apply(this, args as any);
  activeTimers.add(timer);
  return timer;
} as any;

// Wrap clearTimeout to untrack timers
global.clearTimeout = function (timer: ReturnType<typeof setTimeout>): void {
  activeTimers.delete(timer);
  originalClearTimeout(timer);
};

// Start MSW server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: "warn" });
});

// Automatically cleanup after each test and reset MSW handlers
afterEach(() => {
  // Cleanup DOM and React components
  cleanup();

  // Reset MSW server handlers to prevent test interference
  server.resetHandlers();

  // Clear all active timers to prevent memory leaks
  activeTimers.forEach((timer) => {
    originalClearTimeout(timer);
  });
  activeTimers.clear();

  // Clear all mocks
  vi.clearAllMocks();
});

// Stop MSW server after all tests
afterAll(() => {
  server.close();

  // Final cleanup of any remaining timers
  activeTimers.forEach((timer) => {
    originalClearTimeout(timer);
  });
  activeTimers.clear();
});

// Mock window.matchMedia (required for responsive components)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver (required for lazy loading components)
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock ResizeObserver (required for responsive components)
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Suppress console errors in tests (optional - remove if debugging)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === "string" &&
      (args[0].includes("Warning: ReactDOM.render") ||
        args[0].includes("Not implemented: HTMLFormElement.prototype.submit"))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
