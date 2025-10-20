/**
 * Jest Configuration
 *
 * Test configuration following Copilot best practices for comprehensive testing.
 *
 * Key configurations for ESM support:
 * - transformIgnorePatterns: Ensures ESM-only packages like nanoid are transformed
 * - useESM: true in ts-jest options for proper ESM handling
 * - extensionsToTreatAsEsm: Treats .ts and .tsx files as ESM modules
 */

export default {
  preset: "ts-jest",
  testEnvironment: "node",

  // Test file patterns
  testMatch: [
    "**/__tests__/**/*.test.ts",
    "**/__tests__/**/*.test.js",
    "**/tests/**/*.test.ts",
    "**/tests/**/*.test.js",
    "**/*.test.ts",
    "**/*.test.js",
  ],

  // Ignore client tests (use Vitest for those)
  testPathIgnorePatterns: ["/node_modules/", "/client/", "/dist/"],

  // Module path mapping to match tsconfig paths
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/client/src/$1",
    "^@shared/(.*)$": "<rootDir>/shared/$1",
  },

  // Setup files
  setupFilesAfterEnv: ["<rootDir>/server/tests/setup.ts"],

  // Coverage configuration
  // Use V8 coverage provider for Node.js 18+ compatibility
  // This avoids test-exclude incompatibility issues with newer Node.js versions
  coverageProvider: "v8",

  collectCoverageFrom: [
    "server/**/*.{ts,js}",
    "shared/**/*.{ts,js}",
    "!server/**/*.test.{ts,js}",
    "!server/**/*.d.ts",
    "!server/tests/**/*",
    "!server/node_modules/**/*",
  ],

  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],

  // Coverage thresholds - gradually increasing to 70%+
  // Starting from current baseline (~15%) and targeting 70%+
  coverageThreshold: {
    global: {
      branches: 15,
      functions: 15,
      lines: 15,
      statements: 15,
    },
    // Critical path thresholds - will be enforced as coverage improves
    // Uncomment when Phase 1 of testing roadmap is complete
    // './server/auth/**/*.ts': {
    //   branches: 90,
    //   functions: 90,
    //   lines: 90,
    //   statements: 90,
    // },
    // './server/repositories/**/*.ts': {
    //   branches: 90,
    //   functions: 90,
    //   lines: 90,
    //   statements: 90,
    // },
    // './server/features/tournaments/**/*.ts': {
    //   branches: 85,
    //   functions: 85,
    //   lines: 85,
    //   statements: 85,
    // },
  },

  // Transform configuration for TypeScript and ESM JavaScript
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
        useESM: true,
      },
    ],
    "^.+\\.jsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
        useESM: true,
      },
    ],
  },

  extensionsToTreatAsEsm: [".ts", ".tsx"],

  // Transform ignore patterns for node_modules
  // By default, Jest doesn't transform node_modules. However, some packages like
  // nanoid, @node-rs/argon2, and jose use pure ESM syntax and must be transformed.
  // The negative lookahead (?!...) tells Jest to transform these specific packages.
  transformIgnorePatterns: ["node_modules/(?!nanoid|@node-rs/argon2|jose)"],

  // Module file extensions
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],

  // Test timeout
  testTimeout: 10000,

  // Clear mocks between tests
  clearMocks: true,

  // Verbose output
  verbose: true,
};
