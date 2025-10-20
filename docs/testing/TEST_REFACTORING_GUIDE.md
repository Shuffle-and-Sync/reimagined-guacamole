# Test Suite Refactoring Guide

This document describes the test refactoring patterns and best practices implemented in the Shuffle & Sync test suite.

## Overview

The test suite has been refactored to improve:

1. **Test Isolation** - Each test runs independently without interference
2. **Code Reusability** - Centralized mock data factories reduce duplication
3. **Better Assertions** - More meaningful assertions verify actual behavior
4. **Resource Cleanup** - Proper cleanup prevents memory leaks

## Test Isolation

### Database Isolation

All integration tests use in-memory SQLite databases for complete isolation:

```typescript
import { createTestDb, initTestSchema, clearTestDb } from "../utils/test-db";

describe("Feature Tests", () => {
  let testDb: ReturnType<typeof createTestDb>;

  beforeEach(async () => {
    // Create fresh database for each test
    testDb = createTestDb();
    await initTestSchema(testDb.db);
  });

  afterEach(async () => {
    // Clean up database after each test
    await clearTestDb(testDb.db);
    testDb.close();
  });

  test("example test", async () => {
    // Test has isolated database
    await testDb.db.insert(users).values(userData);
  });
});
```

### Mock Reset

Always reset mocks before each test:

```typescript
describe("Service Tests", () => {
  beforeEach(() => {
    // Reset all mocks to prevent state leakage
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clear any timers that may have been set
    jest.clearAllTimers();
  });
});
```

### Timer Cleanup

The test setup automatically tracks and cleans up timers:

```typescript
// Timers are automatically tracked in server/tests/setup.ts
// and client/src/test-utils/setup.ts

// Manual cleanup if needed
afterEach(() => {
  jest.clearAllTimers();
});
```

## Centralized Mock Data Factories

### Using Factories

All tests should use centralized factories from `server/tests/__factories__`:

```typescript
import {
  createMockUser,
  createMockTournament,
  createMockEvent,
} from "../__factories__";

test("example test", () => {
  // Create with defaults
  const user = createMockUser();

  // Override specific fields
  const admin = createMockUser({ role: "admin" });

  // Create custom data
  const tournament = createMockTournament({
    name: "My Tournament",
    maxParticipants: 32,
  });
});
```

### Available Factories

**User & Auth:**

- `createMockUser(overrides?)` - Standard user
- `createMockAdmin(overrides?)` - Admin user
- `createMockSession(overrides?)` - Auth session
- `createMockAccount(overrides?)` - OAuth account
- `createMockGoogleProfile(overrides?)` - Google OAuth profile
- `createMockTwitchProfile(overrides?)` - Twitch OAuth profile

**Gaming:**

- `createMockCommunity(overrides?)` - Community
- `createMockTournament(overrides?)` - Tournament
- `createMockParticipant(overrides?)` - Tournament participant
- `createMockEvent(overrides?)` - Event
- `createMockRound(overrides?)` - Tournament round
- `createMockMatch(overrides?)` - Tournament match
- `createMockGame(overrides?)` - Game
- `createMockCard(overrides?)` - Card
- `createMockDeck(overrides?)` - Deck

**Communication:**

- `createMockMessage(overrides?)` - Message
- `createMockNotification(overrides?)` - Notification

**HTTP:**

- `createMockRequest(overrides?)` - Express request
- `createMockResponse()` - Express response

**Utilities:**

- `createMockList(factory, count, overrides?)` - Generate multiple items

## Better Assertions

### Behavioral Assertions

Test behavior, not implementation:

```typescript
// ✅ GOOD - Tests behavior
test("should validate email format", () => {
  const validEmails = ["test@example.com", "user@domain.co.uk"];
  const invalidEmails = ["invalid", "@example.com"];

  validEmails.forEach((email) => {
    expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });

  invalidEmails.forEach((email) => {
    expect(email).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });
});

// ❌ BAD - Shallow assertion
test("should validate email", () => {
  expect(true).toBe(true);
});
```

### Specific Assertions

Make assertions specific and meaningful:

```typescript
// ✅ GOOD - Specific assertions
test("should calculate compatibility score", () => {
  const score = calculateCompatibility(user1, user2);

  expect(score).toBe(0.75); // Exact expected value
  expect(score).toBeGreaterThan(0.5);
  expect(score).toBeLessThanOrEqual(1.0);
});

// ❌ BAD - Vague assertion
test("should calculate score", () => {
  const score = calculateCompatibility(user1, user2);
  expect(score).toBeDefined();
});
```

## Resource Cleanup

### Database Cleanup

Always clean up database connections:

```typescript
describe("Integration Tests", () => {
  let testDb: ReturnType<typeof createTestDb>;

  beforeEach(async () => {
    testDb = createTestDb();
    await initTestSchema(testDb.db);
  });

  afterEach(async () => {
    // IMPORTANT: Clean and close database
    await clearTestDb(testDb.db);
    testDb.close();
  });
});
```

## Examples

See these files for reference implementations:

- `server/tests/features/user-management.integration.test.ts` - Full integration test example
- `server/tests/features/authentication.test.ts` - Factory usage and assertions
- `server/tests/features/tournaments.test.ts` - Cleanup hooks pattern
- `client/src/components/ui/button.test.tsx` - Frontend component testing

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- authentication.test.ts

# Run with coverage
npm test -- --coverage

# Run frontend tests
npm run test:frontend

# Run integration tests
npm test -- integration.test.ts
```

## Contributing

When adding new tests:

1. Use existing factories or create new ones
2. Add proper cleanup hooks
3. Write specific assertions
4. Test error cases
5. Document complex test scenarios
6. Keep tests focused and isolated
