/**
 * Jest Test Setup
 *
 * Global test setup and configuration for the test suite.
 */

import { beforeAll, afterAll, jest } from "@jest/globals";
import { config } from "dotenv";
import { resolve } from "path";

// Load test environment variables
config({ path: resolve(process.cwd(), ".env.test") });

// Set test environment
process.env.NODE_ENV = "test";

// Mock console methods to reduce noise in tests
const originalConsole = { ...console };

beforeAll(() => {
  // Suppress console output during tests unless explicitly enabled
  if (!process.env.VERBOSE_TESTS) {
    console.log = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  }
});

afterAll(() => {
  // Restore console methods
  Object.assign(console, originalConsole);
});

// Global test utilities
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
    createMockUser: (overrides?: any) => any;
    createMockRequest: (overrides?: any) => any;
    createMockResponse: () => any;
    sleep: (ms: number) => Promise<void>;
  };
}
