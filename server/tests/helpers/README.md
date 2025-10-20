# Test Utilities Documentation

This directory contains comprehensive test utilities and helpers for both backend and frontend testing.

## Directory Structure

```
server/tests/helpers/         # Backend test utilities
├── database.helper.ts        # Database seeding and cleanup utilities
├── fixtures.ts               # Centralized mock data fixtures
├── mock-handlers.ts          # API mock handlers
├── user-actions.helper.ts    # User flow simulation helpers
└── index.ts                  # Central export point

client/src/test-utils/        # Frontend test utilities
├── render.tsx                # React component testing utilities
├── generators.ts             # Frontend test data generators
├── setup.ts                  # Vitest setup file
└── index.ts                  # Central export point
```

## Backend Test Utilities

### Database Helpers

Located in `server/tests/helpers/database.helper.ts`

#### Test Data Generators

Create mock data for testing:

```typescript
import { testDataGenerators } from "../helpers";

// Generate a mock user
const user = testDataGenerators.user({
  email: "custom@example.com",
  role: "admin",
});

// Generate a mock event
const event = testDataGenerators.event({
  title: "Custom Event",
  maxParticipants: 16,
});
```

Available generators:

- `user()` - Generate mock users
- `community()` - Generate mock communities
- `event()` - Generate mock events
- `tournament()` - Generate mock tournaments
- `game()` - Generate mock games
- `card()` - Generate mock cards

#### Database Seeding

Insert test data into the database:

```typescript
import { seedDatabase } from "../helpers";

// Create a single user
const user = await seedDatabase.createUser({
  email: "test@example.com",
});

// Create multiple users
const users = await seedDatabase.createUsers(5);

// Create and join a community
const community = await seedDatabase.createCommunity();
await seedDatabase.joinCommunity(user.id, community.id);
```

Available seed functions:

- `createUser()` - Create a single user
- `createUsers(count)` - Create multiple users
- `createCommunity()` - Create a community
- `createEvent()` - Create an event
- `createTournament()` - Create a tournament
- `createGame()` - Create a game
- `joinCommunity()` - Join a user to a community

#### Database Cleanup

Clean up test data after tests:

```typescript
import { cleanDatabase } from "../helpers";

afterEach(async () => {
  // Clean all test data
  await cleanDatabase.cleanAll();
});

// Or clean specific tables
afterEach(async () => {
  await cleanDatabase.deleteAllUsers();
  await cleanDatabase.deleteAllEvents();
});
```

Available cleanup functions:

- `cleanAll()` - Delete all test data
- `deleteAllUsers()` - Delete all users
- `deleteAllCommunities()` - Delete all communities
- `deleteAllEvents()` - Delete all events
- `deleteAllTournaments()` - Delete all tournaments
- `deleteAllGames()` - Delete all games
- `deleteAllCards()` - Delete all cards
- `deleteUser(id)` - Delete a specific user

### Test Fixtures

Located in `server/tests/helpers/fixtures.ts`

Centralized mock data for consistent testing:

```typescript
import { mockUsers, mockEvents, mockCommunities } from "../helpers";

// Use predefined fixtures
const user = mockUsers.regularUser;
const admin = mockUsers.adminUser;
const event = mockEvents.upcomingTournament;

// Clone fixtures to prevent modification
import { cloneFixture } from "../helpers";
const userCopy = cloneFixture(mockUsers.regularUser);
userCopy.email = "modified@example.com";
```

Available fixtures:

- `mockUsers` - User fixtures (regular, admin, unverified, banned)
- `mockCommunities` - Community fixtures (mtg, pokemon, yugioh)
- `mockEvents` - Event fixtures (upcoming, ongoing, completed)
- `mockTournaments` - Tournament fixtures
- `mockGames` - Game fixtures
- `mockCards` - Card fixtures
- `mockSessions` - Session fixtures
- `mockOAuthProfiles` - OAuth profile fixtures
- `mockAPIResponses` - API response fixtures
- `mockRegistrationData` - Registration data fixtures
- `mockDecks` - Deck fixtures

### Mock API Handlers

Located in `server/tests/helpers/mock-handlers.ts`

Mock API responses without making HTTP requests:

```typescript
import { authHandlers, eventHandlers } from "../helpers";

// Mock authentication
const loginResponse = authHandlers.login("user@example.com", "password");
expect(loginResponse.status).toBe(200);

// Mock event creation
const eventResponse = eventHandlers.create({
  title: "Test Event",
  eventType: "tournament",
  startTime: new Date(),
  endTime: new Date(),
});
expect(eventResponse.status).toBe(201);
```

Available handlers:

- `authHandlers` - Authentication operations (login, register, logout, OAuth)
- `communityHandlers` - Community operations (getAll, getById, join)
- `eventHandlers` - Event operations (CRUD operations)
- `tournamentHandlers` - Tournament operations (CRUD, registration)

### User Action Helpers

Located in `server/tests/helpers/user-actions.helper.ts`

Simulate complete user flows:

```typescript
import {
  authFlows,
  eventFlows,
  tournamentFlows,
  userJourneys,
} from "../helpers";

// Simulate complete registration
const result = await authFlows.completeRegistration({
  email: "newuser@example.com",
});

// Simulate event creation and joining
const event = await eventFlows.createEvent();
await eventFlows.joinEvent(event.data.id, user.id);

// Simulate complete user journey
const journey = await userJourneys.newUserToFirstEvent();
expect(journey.registration.status).toBe(200);
expect(journey.join.status).toBe(200);
```

Available flows:

- `authFlows` - Authentication flows (registration, login, OAuth, logout)
- `eventFlows` - Event management flows (create, join, leave, update, cancel)
- `tournamentFlows` - Tournament flows (create, register, submit results)
- `communityFlows` - Community interaction flows
- `deckFlows` - Deck building flows
- `socialFlows` - Social interaction flows
- `userJourneys` - Complete user journeys (e2e flows)

## Frontend Test Utilities

### Render Utilities

Located in `client/src/test-utils/render.tsx`

Custom render function with all providers:

```typescript
import { renderWithProviders, screen } from '@/test-utils';

test('renders component with providers', () => {
  renderWithProviders(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});

// With custom route
renderWithProviders(<MyComponent />, {
  route: '/events/123',
});

// With custom query client
const queryClient = createTestQueryClient();
renderWithProviders(<MyComponent />, { queryClient });
```

**Note**: Install `@testing-library/react` and `@testing-library/jest-dom` for full functionality.

### Test Data Generators

Located in `client/src/test-utils/generators.ts`

Generate mock data for frontend tests:

```typescript
import {
  createMockUser,
  createMockEvent,
  createMockList,
  createPaginatedResponse,
} from "@/test-utils";

// Generate single items
const user = createMockUser({ role: "admin" });
const event = createMockEvent({ maxParticipants: 32 });

// Generate lists
const users = createMockList(createMockUser, 10);

// Create paginated response
const response = createPaginatedResponse(users, 1, 5);
```

Available generators:

- `createMockUser()` - Generate mock users
- `createMockCommunity()` - Generate mock communities
- `createMockEvent()` - Generate mock events
- `createMockTournament()` - Generate mock tournaments
- `createMockCard()` - Generate mock cards
- `createMockDeck()` - Generate mock decks
- `createMockGameSession()` - Generate mock game sessions
- `createMockMessage()` - Generate mock messages
- `createMockNotification()` - Generate mock notifications
- `createMockList()` - Generate lists of items
- `createPaginatedResponse()` - Create paginated API responses
- `createSuccessResponse()` - Create success API responses
- `createErrorResponse()` - Create error API responses

## Testing Best Practices

### 1. Use Test Utilities to Reduce Boilerplate

❌ **Bad** - Manual setup in every test:

```typescript
test("creates a user", async () => {
  const user = {
    id: nanoid(),
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
    // ... many more fields
  };
  await db.insert(users).values(user);
  // test logic
});
```

✅ **Good** - Use helpers:

```typescript
test("creates a user", async () => {
  const user = await seedDatabase.createUser();
  // test logic
});
```

### 2. Clean Up After Tests

Always clean up database state:

```typescript
describe("User tests", () => {
  afterEach(async () => {
    await cleanDatabase.cleanAll();
  });

  test("creates a user", async () => {
    const user = await seedDatabase.createUser();
    expect(user.email).toBeDefined();
  });
});
```

### 3. Use Fixtures for Consistency

Use predefined fixtures instead of creating new data:

```typescript
import { mockUsers, mockEvents } from "../helpers";

test("user can join event", () => {
  const user = mockUsers.regularUser;
  const event = mockEvents.upcomingTournament;
  // test logic
});
```

### 4. Clone Fixtures When Modifying

```typescript
import { cloneFixture, mockUsers } from "../helpers";

test("updates user email", () => {
  const user = cloneFixture(mockUsers.regularUser);
  user.email = "new@example.com"; // Safe, doesn't modify original
});
```

### 5. Use User Flows for Integration Tests

```typescript
import { userJourneys } from "../helpers";

test("complete user journey: register to first event", async () => {
  const { registration, event, join } =
    await userJourneys.newUserToFirstEvent();

  expect(registration.status).toBe(200);
  expect(event.status).toBe(201);
  expect(join.status).toBe(200);
});
```

## Running Tests

### Backend Tests

```bash
# All backend tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage

# Specific test types
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only
npm run test:e2e           # E2E tests only

# Specific features
npm run test:auth          # Authentication tests
npm run test:tournaments   # Tournament tests
npm run test:security      # Security tests
```

### Frontend Tests

**Note**: Frontend testing requires additional setup. Install dependencies:

```bash
npm install --save-dev vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

Then add to package.json:

```json
{
  "scripts": {
    "test:client": "vitest --config vitest.config.ts",
    "test:client:ui": "vitest --ui --config vitest.config.ts",
    "test:client:coverage": "vitest run --coverage --config vitest.config.ts"
  }
}
```

Run tests:

```bash
npm run test:client
npm run test:client:ui      # With UI
npm run test:client:coverage # With coverage
```

## Examples

### Example 1: Testing Authentication

```typescript
import { describe, test, expect, afterEach } from "@jest/globals";
import { seedDatabase, cleanDatabase, authFlows } from "../helpers";

describe("Authentication", () => {
  afterEach(async () => {
    await cleanDatabase.cleanAll();
  });

  test("user can register and login", async () => {
    // Register
    const registration = await authFlows.completeRegistration({
      email: "user@example.com",
    });
    expect(registration.status).toBe(200);

    // Login
    const login = await authFlows.login(
      "user@example.com",
      "SecureP@ssw0rd123!",
    );
    expect(login.status).toBe(200);
    expect(login.data.user.email).toBe("user@example.com");
  });
});
```

### Example 2: Testing Event Creation

```typescript
import { describe, test, expect, afterEach } from "@jest/globals";
import { seedDatabase, cleanDatabase, eventFlows } from "../helpers";

describe("Events", () => {
  afterEach(async () => {
    await cleanDatabase.cleanAll();
  });

  test("user can create and join event", async () => {
    const user = await seedDatabase.createUser();

    const event = await eventFlows.createEvent({
      title: "Test Tournament",
      maxParticipants: 8,
    });
    expect(event.status).toBe(201);

    const join = await eventFlows.joinEvent(event.data.id, user.id);
    expect(join.status).toBe(200);
  });
});
```

### Example 3: Testing React Components

```typescript
import { renderWithProviders, screen, createMockEvent } from '@/test-utils';
import { EventCard } from '@/components/EventCard';

test('renders event card', () => {
  const event = createMockEvent({ title: 'Test Event' });

  renderWithProviders(<EventCard event={event} />);

  expect(screen.getByText('Test Event')).toBeInTheDocument();
});
```

## Future Enhancements

Planned improvements:

- [ ] Add MSW (Mock Service Worker) for better API mocking
- [ ] Add Playwright for E2E testing
- [ ] Add visual regression testing
- [ ] Add performance testing utilities
- [ ] Add accessibility testing helpers

## Contributing

When adding new test utilities:

1. Place backend utilities in `server/tests/helpers/`
2. Place frontend utilities in `client/src/test-utils/`
3. Export from the appropriate index file
4. Add TypeScript types for all functions
5. Document usage with examples
6. Update this README

## Questions?

For questions or issues with test utilities, please:

1. Check this README first
2. Review existing test files for examples
3. Open an issue on GitHub
