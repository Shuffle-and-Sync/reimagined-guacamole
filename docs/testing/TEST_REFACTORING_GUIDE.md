# Test Suite Refactoring Guide

This guide documents the test refactoring patterns and provides instructions for completing the remaining test file refactoring.

## Refactoring Completed

### Phase 1: Fix Test Failures ✅

- Fixed 3 TypeScript strict mode compliance tests
- Fixed tournament factory to include `participants` array
- Fixed security audit tests (quote style mismatches)
- **Result**: All 1029 tests passing, 0 failures

### Phase 2: Refactoring Examples ✅

- Refactored `server/tests/services/card-adapters.test.ts`
- Refactored `server/tests/services/game.service.test.ts`
- Added centralized factory imports
- Added cleanup hooks (`afterEach`)

## Refactoring Pattern

### 1. Import Factories

Add factory imports at the top of the test file:

```typescript
import {
  createMockUser,
  createMockTournament,
  createMockCard,
  createMockGame,
  // ... other factories as needed
} from "../__factories__";
```

### 2. Replace Inline Mock Data

**Before**:

```typescript
const mockCard = {
  id: "card-123",
  name: "Lightning Bolt",
  manaCost: "{R}",
};
```

**After**:

```typescript
const mockCard = createMockCard({
  id: "card-123",
  name: "Lightning Bolt",
  manaCost: "{R}",
});
```

### 3. Add Cleanup Hooks

Add `afterEach` hooks to clean up resources:

```typescript
describe("MyTest", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
    // Add other cleanup as needed
  });
});
```

### 4. Integration Test Database Cleanup

For integration tests that use the database:

```typescript
afterEach(async () => {
  // Clear test data
  await db.delete(users).where(eq(users.email, "test@example.com"));

  // Close any open connections if needed
  jest.clearAllTimers();
});

afterAll(async () => {
  // Final cleanup
  // Close database connections if needed
});
```

## Files Needing Refactoring

### High Priority (Using Inline Mock Data)

#### Services Tests (3 files)

- [x] `server/tests/services/card-adapters.test.ts` ✅
- [x] `server/tests/services/game.service.test.ts` ✅
- [ ] `server/tests/services/pokemon-yugioh-adapters.test.ts`

#### Feature Tests (12 files)

- [ ] `server/tests/features/calendar.test.ts` - Has inline mock event data
- [ ] `server/tests/features/card-recognition.test.ts` - API test, minimal refactoring needed
- [ ] `server/tests/features/messaging.test.ts` - Needs message factories
- [ ] `server/tests/features/tournaments.test.ts` - Already uses factories! ✅
- [ ] `server/tests/features/universal-deck-building.e2e.test.ts` - Check for inline mocks
- [ ] `server/tests/features/universal-deck-building.integration.test.ts` - Check for inline mocks
- [ ] `server/tests/features/user-management.integration.test.ts` - Needs user factories
- [ ] `server/tests/features/auth-credentials-oauth.test.ts` - Check cleanup hooks
- [ ] `server/tests/features/auth-error-handling.test.ts` - Check cleanup hooks
- [ ] `server/tests/features/authentication.test.ts` - Already uses factories! ✅
- [ ] `server/tests/features/events.integration.test.ts` - Needs event factories
- [ ] `server/tests/features/registration-login-integration.test.ts` - Check for inline mocks

#### Error Tests (8 files)

- [ ] `server/tests/errors/authentication/jwt-auth-errors.test.ts`
- [ ] `server/tests/errors/authentication/session-auth-errors.test.ts`
- [ ] `server/tests/errors/authorization/ownership-errors.test.ts`
- [ ] `server/tests/errors/authorization/rbac-errors.test.ts`
- [ ] `server/tests/errors/database/connection-errors.test.ts`
- [ ] `server/tests/errors/database/constraint-errors.test.ts`
- [ ] `server/tests/errors/database/transaction-errors.test.ts`
- [ ] `server/tests/errors/external-services/external-api-errors.test.ts`

### Medium Priority (Cleanup Hooks Only)

#### Utility Tests (2 files)

- [ ] `server/tests/utils/database-pagination.test.ts` - No inline data, just add cleanup
- [ ] `server/tests/utils/database.utils.test.ts` - No inline data, just add cleanup

#### Admin Tests (1 file)

- [ ] `server/tests/admin/admin-initialization.test.ts` - Check if needs factories

#### Security Tests (6 files)

- [ ] `server/tests/security/input-sanitization.test.ts` - Has cleanup, check for inline data
- [ ] `server/tests/security/enhanced-sanitization.test.ts`
- [ ] `server/tests/security/credential-protection.test.ts`
- [ ] `server/tests/security/security.utils.test.ts`
- [ ] `server/tests/security/security-audit-comprehensive.test.ts` - Spec test, minimal changes
- [ ] `server/tests/security/gitignore-env-protection.test.ts` - Spec test, minimal changes

### Low Priority (Specification Tests)

These tests validate requirements rather than testing logic with mock data. They typically don't need factories:

#### UX Tests (6 files)

- `server/tests/ux/accessibility.test.ts`
- `server/tests/ux/form-validation.test.ts`
- `server/tests/ux/loading-error-states.test.ts`
- `server/tests/ux/mobile-responsiveness.test.ts`
- `server/tests/ux/routing.test.ts`
- `server/tests/ux/user-feedback-cards.test.ts`

#### Other Spec Tests

- `server/tests/typescript/strict-mode-compliance.test.ts` - Already updated ✅
- `server/tests/schema/cards-games-schema.test.ts` - Schema spec test
- `server/tests/simple.test.ts` - Basic test, no changes needed

### Client Tests (5 files)

- [ ] `client/src/components/ui/badge.test.tsx`
- [ ] `client/src/components/ui/button.test.tsx`
- [ ] `client/src/components/ui/card.test.tsx`
- [ ] `client/src/components/ui/input.test.tsx`
- [ ] `client/src/pages/faq.test.tsx`

## Available Factories

Located in `server/tests/__factories__/index.ts`:

- `createMockUser(overrides)` - User accounts
- `createMockAdmin(overrides)` - Admin users
- `createMockCommunity(overrides)` - Game communities
- `createMockTournament(overrides)` - Tournaments (includes `participants: []`)
- `createMockParticipant(overrides)` - Tournament participants
- `createMockEvent(overrides)` - Events
- `createMockRound(overrides)` - Tournament rounds
- `createMockMatch(overrides)` - Tournament matches
- `createMockGame(overrides)` - Games
- `createMockCard(overrides)` - Cards
- `createMockDeck(overrides)` - Decks
- `createMockSession(overrides)` - Auth sessions
- `createMockAccount(overrides)` - OAuth accounts
- `createMockMessage(overrides)` - Messages
- `createMockNotification(overrides)` - Notifications
- `createMockRequest(overrides)` - Express requests
- `createMockResponse()` - Express responses
- `createMockGoogleProfile(overrides)` - Google OAuth profiles
- `createMockTwitchProfile(overrides)` - Twitch OAuth profiles
- `createMockList(factory, count, overrides)` - Generate multiple items

## Testing Checklist

After refactoring each file:

1. ✅ Run the specific test file: `npm test -- path/to/file.test.ts`
2. ✅ Run the full test suite: `npm test`
3. ✅ Verify test count remains the same
4. ✅ Verify all tests still pass
5. ✅ Check for any new warnings or errors

## Coverage Goals

- **Current Coverage**: ~70% (estimated based on test count)
- **Target Coverage**: 70%+ overall
- **Critical Paths**: 90%+ (authentication, data access)

After completing all refactoring:

1. Run coverage analysis: `npm run test:coverage`
2. Identify gaps in coverage
3. Add new tests for uncovered code
4. Re-run coverage to verify 70%+ target

## Example Refactoring PR

See commits:

- `16e88e6` - Refactored card-adapters.test.ts
- `4acedc9` - Fixed all failing tests

## Notes

- **Test-Exclude Errors**: When running `npm run test:coverage`, you may see test-exclude errors. These are related to code coverage collection, not test failures. Tests themselves run fine.
- **Skipped Tests**: Some tests are intentionally skipped (23 total) - these are for features not yet implemented
- **Integration Tests**: Be extra careful with database cleanup in integration tests to prevent test pollution

## Next Steps

1. Continue refactoring test files in order of priority
2. Focus on files with inline mock data first
3. Add cleanup hooks to all test files
4. Run coverage analysis after all refactoring
5. Fill coverage gaps with new tests
6. Document any remaining issues or technical debt
