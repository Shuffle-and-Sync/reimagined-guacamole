# Integration Tests

This directory contains end-to-end integration tests for critical user flows in the Shuffle & Sync application.

## Overview

Integration tests verify complete user journeys through the application, simulating real user interactions and API responses. These tests ensure that different components work together correctly and that the application behaves as expected from a user's perspective.

## Test Suites

### 1. User Registration and Sign-In (`user-registration-signin.test.tsx`)

Tests the complete user authentication flow:

- **Registration Flow:**
  - New user registration with valid credentials
  - Password strength validation
  - Password confirmation matching
  - Email uniqueness validation
  - Terms and conditions acceptance
  - Registration error handling

- **Sign-In Flow:**
  - Successful sign-in with valid credentials
  - Form validation for empty fields
  - Authentication error handling
  - CSRF token handling
  - Session management

- **Complete Journey:**
  - End-to-end flow from registration to authenticated state

### 2. Tournament Creation and Registration (`tournament-creation-registration.test.tsx`)

Tests the tournament lifecycle:

- **Tournament Creation:**
  - Creating a tournament with valid data
  - Form validation for required fields
  - Tournament creation error handling
  - Tournament listing and display

- **Tournament Registration:**
  - Registering for an available tournament
  - Preventing registration for full tournaments
  - Registration error handling
  - Viewing tournament details

- **Tournament Management:**
  - Viewing list of tournaments
  - Filtering tournaments by status
  - Empty state handling

- **Complete Journey:**
  - End-to-end flow from creation to participant registration

### 3. Matchmaking Queue and Game Initiation (`matchmaking-queue-initiation.test.tsx`)

Tests the matchmaking and game creation flow:

- **Preference Setup:**
  - Setting matchmaking preferences
  - Loading existing preferences
  - Preference validation
  - Saving preferences

- **Queue Management:**
  - Joining the matchmaking queue
  - Leaving the queue
  - Queue timeout handling
  - Queue position tracking

- **Match Found:**
  - Match notification
  - Opponent information display
  - Match acceptance
  - Navigation to game room

- **Complete Journey:**
  - End-to-end flow from preferences to game room

## Running Integration Tests

### Run All Integration Tests

```bash
npm run test:frontend -- client/src/tests/integration
```

### Run Specific Test Suite

```bash
# User registration and sign-in
npm run test:frontend -- client/src/tests/integration/user-registration-signin.test.tsx

# Tournament creation and registration
npm run test:frontend -- client/src/tests/integration/tournament-creation-registration.test.tsx

# Matchmaking queue and game initiation
npm run test:frontend -- client/src/tests/integration/matchmaking-queue-initiation.test.tsx
```

### Run in Watch Mode

```bash
npm run test:frontend:watch -- client/src/tests/integration
```

### Run with Coverage

```bash
npm run test:frontend:coverage -- client/src/tests/integration
```

## Test Structure

Each integration test follows this structure:

1. **Setup:** Configure MSW handlers for API mocking
2. **Render:** Render the component with necessary providers
3. **Interact:** Simulate user interactions (clicks, typing, etc.)
4. **Assert:** Verify expected outcomes and state changes
5. **Cleanup:** Automatic cleanup handled by test framework

## Mocking Strategy

### MSW (Mock Service Worker)

All integration tests use MSW to mock API requests and responses. MSW handlers are defined in:

- `client/src/test-utils/mocks/handlers.ts` - Default handlers
- Individual test files - Test-specific handlers using `server.use()`

### Benefits of MSW:

- **Realistic:** Intercepts actual network requests
- **Isolated:** Tests don't depend on backend availability
- **Flexible:** Easy to simulate different scenarios (success, errors, edge cases)
- **Fast:** No network latency

## Best Practices

### Writing Integration Tests

1. **Test User Journeys:** Focus on complete flows, not isolated components
2. **Use Realistic Data:** Create mock data that matches production schemas
3. **Test Happy Path First:** Verify successful flows before edge cases
4. **Test Error Scenarios:** Ensure graceful error handling
5. **Keep Tests Independent:** Each test should work in isolation
6. **Use Descriptive Names:** Test names should clearly describe the scenario

### Common Patterns

```typescript
// 1. Setup MSW handler for specific test
server.use(
  http.post("/api/endpoint", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ success: true, data: body });
  })
);

// 2. Render component with providers
const user = userEvent.setup();
renderWithProviders(<MyComponent />);

// 3. Wait for element to appear
await waitFor(() => {
  expect(screen.getByText(/expected text/i)).toBeInTheDocument();
});

// 4. Simulate user interaction
const button = screen.getByRole("button", { name: /click me/i });
await user.click(button);

// 5. Verify outcome
await waitFor(() => {
  expect(screen.getByText(/success message/i)).toBeInTheDocument();
});
```

### Debugging Tips

1. **Use `screen.debug()`:** Print current DOM state

   ```typescript
   screen.debug(); // Print entire DOM
   screen.debug(element); // Print specific element
   ```

2. **Increase Timeout:** For slow operations

   ```typescript
   await waitFor(
     () => {
       expect(screen.getByText(/text/i)).toBeInTheDocument();
     },
     { timeout: 10000 },
   );
   ```

3. **Check Console Output:** MSW logs unhandled requests
4. **Use Test UI:** Run with `npm run test:frontend:ui`

## Maintenance

### Adding New Tests

1. Create new test file in `client/src/tests/integration/`
2. Follow existing naming convention: `feature-flow.test.tsx`
3. Import necessary utilities from `@/test-utils`
4. Add MSW handlers for required API endpoints
5. Write test scenarios covering happy path and errors
6. Update this README with new test suite description

### Updating Tests

When adding new features or modifying existing flows:

1. Review affected integration tests
2. Update MSW handlers if API contracts changed
3. Add new test cases for new functionality
4. Ensure existing tests still pass
5. Update mock data if schema changed

## Coverage Goals

Integration tests should cover:

- ✅ All critical user flows
- ✅ Form validation and submission
- ✅ API error handling
- ✅ Navigation between pages
- ✅ State persistence
- ✅ User feedback (toasts, messages)

## Related Documentation

- [Test Utils](../test-utils/README.md) - Testing utilities and helpers
- [MSW Documentation](https://mswjs.io/) - Mock Service Worker guide
- [Vitest Documentation](https://vitest.dev/) - Test framework documentation
- [Testing Library](https://testing-library.com/) - Component testing best practices

## Troubleshooting

### Tests Fail Intermittently

- Increase timeout values
- Check for race conditions
- Ensure proper cleanup between tests
- Verify MSW handlers are properly reset

### "Cannot find element" Errors

- Use `waitFor` for async operations
- Check element selectors (role, text, label)
- Verify element is actually rendered
- Use `screen.debug()` to inspect DOM

### MSW Not Intercepting Requests

- Verify MSW server is started in setup
- Check handler URL patterns match requests
- Ensure handlers are added before making request
- Review console for unhandled request warnings

## Future Enhancements

Potential additions to integration test suite:

- [ ] Social features integration tests
- [ ] Deck building flow tests
- [ ] Community management tests
- [ ] Event calendar integration tests
- [ ] Messaging system tests
- [ ] Profile management tests
- [ ] Admin functionality tests
