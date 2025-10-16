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
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.js',
    '**/tests/**/*.test.ts',
    '**/tests/**/*.test.js'
  ],
  
  // Module path mapping to match tsconfig paths
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/client/src/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1'
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/server/tests/setup.ts'],
  
  // Coverage configuration
  collectCoverageFrom: [
    'server/**/*.{ts,js}',
    'shared/**/*.{ts,js}',
    '!server/**/*.test.{ts,js}',
    '!server/**/*.d.ts',
    '!server/tests/**/*',
    '!server/node_modules/**/*'
  ],
  
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Transform configuration for TypeScript and ESM JavaScript
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      useESM: true
    }],
    '^.+\\.jsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      useESM: true
    }]
  },
  
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  
  // Transform ignore patterns for node_modules
  // By default, Jest doesn't transform node_modules. However, some packages like
  // nanoid and @node-rs/argon2 use pure ESM syntax and must be transformed.
  // The negative lookahead (?!...) tells Jest to transform these specific packages.
  transformIgnorePatterns: [
    'node_modules/(?!nanoid|@node-rs/argon2)'
  ],
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Test timeout
  testTimeout: 10000,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Verbose output
  verbose: true
};