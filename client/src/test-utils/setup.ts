/**
 * Vitest Setup File
 *
 * Global test setup for frontend tests using Vitest.
 * This file runs before each test file.
 *
 * Note: This file is referenced in vitest.config.ts
 * Install @testing-library/jest-dom for custom matchers:
 * npm install --save-dev @testing-library/jest-dom
 */

// Uncomment when @testing-library/jest-dom is installed:
// import '@testing-library/jest-dom';

// Type declaration for test globals
// These will be available when running tests with Vitest or Jest
declare global {
   
  var beforeAll: ((fn: () => void) => void) | undefined;
   
  var afterAll: ((fn: () => void) => void) | undefined;
}

// Mock window.matchMedia (only runs in test environment)
if (typeof window !== "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    }),
  });

  // Mock IntersectionObserver
  (global as any).IntersectionObserver = class IntersectionObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    takeRecords() {
      return [];
    }
    unobserve() {}
  };

  // Mock ResizeObserver
  (global as any).ResizeObserver = class ResizeObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
  };

  // Suppress console warnings/errors during tests unless explicitly enabled
  if (!process.env.VERBOSE_TESTS && typeof global.beforeAll !== "undefined") {
    const originalError = console.error;
    const originalWarn = console.warn;

    global.beforeAll(() => {
      console.error = () => {};
      console.warn = () => {};
    });

    if (typeof global.afterAll !== "undefined") {
      global.afterAll(() => {
        console.error = originalError;
        console.warn = originalWarn;
      });
    }
  }
}

export {};
