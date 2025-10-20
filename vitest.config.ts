/**
 * Vitest Configuration for Frontend Testing
 *
 * Configuration for testing React components using Vitest and React Testing Library.
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],

  test: {
    // Test environment - using happy-dom for better performance, can switch to jsdom if needed
    environment: "happy-dom",

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
      "**/server/**",
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
        "**/*.d.ts",
        "**/*.config.*",
        "**/mockData/**",
        "**/types/**",
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

    // Parallel execution
    pool: "threads",
    poolOptions: {
      threads: {
        singleThread: false,
      },
    },

    // Reporter configuration
    reporters: ["default", "html"],
    outputFile: {
      html: "./coverage/test-report.html",
    },

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
      "@components": path.resolve(__dirname, "client", "src", "components"),
      "@hooks": path.resolve(__dirname, "client", "src", "hooks"),
      "@lib": path.resolve(__dirname, "client", "src", "lib"),
      "@pages": path.resolve(__dirname, "client", "src", "pages"),
    },
  },
});
