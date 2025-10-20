/**
 * Vitest Configuration for Frontend Testing
 *
 * This configuration is for testing React components using Vitest.
 *
 * To use this configuration:
 * 1. Install Vitest and related dependencies:
 *    npm install --save-dev vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
 *
 * 2. Add test scripts to package.json:
 *    "test:client": "vitest --config vitest.config.ts"
 *    "test:client:ui": "vitest --ui --config vitest.config.ts"
 *    "test:client:coverage": "vitest run --coverage --config vitest.config.ts"
 *
 * 3. Run tests:
 *    npm run test:client
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],

  test: {
    // Test environment
    environment: "jsdom",

    // Global test setup
    globals: true,

    // Setup files to run before each test file
    setupFiles: ["./client/src/test-utils/setup.ts"],

    // File patterns to include
    include: [
      "client/**/*.{test,spec}.{ts,tsx}",
      "client/**/__tests__/**/*.{ts,tsx}",
    ],

    // File patterns to exclude
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/cypress/**",
      "**/.{idea,git,cache,output,temp}/**",
    ],

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      include: ["client/src/**/*.{ts,tsx}"],
      exclude: [
        "client/src/**/*.test.{ts,tsx}",
        "client/src/**/*.spec.{ts,tsx}",
        "client/src/test-utils/**",
        "client/src/**/__tests__/**",
        "client/src/main.tsx",
        "client/src/vite-env.d.ts",
      ],

      // Coverage thresholds
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },

    // Test timeout
    testTimeout: 10000,

    // Reporter configuration
    reporters: ["verbose"],

    // Mock configuration
    mockReset: true,
    restoreMocks: true,
    clearMocks: true,
  },

  // Resolve configuration (same as main vite.config.ts)
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
});
