# Test Mock Patterns Guide

This guide documents the standardized mock patterns used in the Shuffle & Sync test suite. Following these patterns ensures consistent, maintainable, and type-safe test code.

## Table of Contents

- [Overview](#overview)
- [Mock Factory Functions](#mock-factory-functions)
- [Component Testing Patterns](#component-testing-patterns)
- [Common Patterns](#common-patterns)
- [Best Practices](#best-practices)

## Overview

All mock factory functions are centralized in `/client/src/test-utils/generators.ts`. This provides:

- **Type Safety**: All mocks have proper TypeScript types
- **Consistency**: Reusable functions ensure tests use the same data shapes
- **Maintainability**: Changes to data structures require updates in one place
- **Flexibility**: Override specific fields while maintaining sensible defaults

## Mock Factory Functions

### Event Mocks

#### createMockCalendarEvent

Creates a mock `CalendarEvent` for testing event-related components.

```typescript
import { createMockCalendarEvent } from "@/test-utils";

const event = createMockCalendarEvent({
  id: "event-123",
  title: "Commander Night",
  playerSlots: 4,
  alternateSlots: 2,
  mainPlayers: 0,
  alternates: 0,
});
```

**Default Values:**

- `id`: Random UUID
- `title`: Faker-generated company catchphrase
- `description`: Faker-generated paragraph
- `type`: Random event type (tournament, game_pod, convention, release)
- `date`: Future date in ISO format
- `time`: "18:00"
- `location`: Faker-generated city name
- `playerSlots`: 4
- `alternateSlots`: 2
- `gameFormat`: Random format (commander, standard, modern)
- `powerLevel`: Random 1-10
- `creator`: null
- `creatorId`: Random UUID
- `attendeeCount`: 0
- `mainPlayers`: 0
- `alternates`: 0

#### createMockAttendee

Creates a mock `Attendee` for testing attendance-related features.

```typescript
import { createMockAttendee } from "@/test-utils";

const attendee = createMockAttendee({
  userId: "user-123",
  eventId: "event-123",
  playerType: "main",
});
```

**Default Values:**

- `userId`: Random UUID
- `eventId`: Random UUID
- `status`: "attending"
- `role`: "participant"
- `playerType`: Random ("main" or "alternate")
- `user.firstName`: Faker-generated first name
- `user.lastName`: Faker-generated last name
- `user.email`: Faker-generated email

### User Mocks

#### createMockUser

Creates a mock user for authentication and profile tests.

```typescript
import { createMockUser } from "@/test-utils";

const user = createMockUser({
  id: "user-123",
  email: "test@example.com",
  role: "admin",
});
```

## Component Testing Patterns

### Setting Up Tests

Always use the standardized test setup pattern:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  renderWithProviders,
  screen,
  userEvent,
  waitFor,
  createTestQueryClient,
} from "@/test-utils";
import { server } from "@/test-utils/mocks/server";

describe("ComponentName", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;
  let mockCallback: ReturnType<typeof vi.fn>;
  let mockData: DataType;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    mockCallback = vi.fn();

    mockData = {
      // Initialize test data
    };

    vi.clearAllMocks();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  // Tests go here
});
```

### Query Client Pattern

Always create a fresh QueryClient for each test to ensure isolation:

```typescript
beforeEach(() => {
  queryClient = createTestQueryClient();
});

// In test:
renderWithProviders(<Component />, { queryClient });
```

**Why:** Prevents test pollution and ensures predictable query cache behavior.

### MSW (Mock Service Worker) Patterns

Use MSW for mocking API requests instead of mocking fetch directly:

```typescript
import { http, HttpResponse } from "msw";
import { server } from "@/test-utils/mocks/server";

beforeEach(() => {
  server.use(
    http.get("/api/events/:eventId/attendees", () => {
      return HttpResponse.json([
        createMockAttendee({ userId: "test-user-123" }),
      ]);
    }),

    http.post("/api/events/:eventId/join", async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return HttpResponse.json(
        { id: "attendance-123", status: "attending" },
        { status: 200 },
      );
    }),
  );
});
```

**Error Responses:**

```typescript
http.get("/api/events/:eventId", () => {
  return new HttpResponse(JSON.stringify({ error: "Event not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
});
```

### Async Testing Patterns

#### Waiting for Elements

```typescript
await waitFor(() => {
  expect(screen.getByTestId("button-join-event-123")).toBeInTheDocument();
});
```

#### Testing User Interactions

```typescript
const user = userEvent.setup();

await user.click(screen.getByTestId("button-join-event-123"));

await waitFor(() => {
  expect(mockCallback).toHaveBeenCalledTimes(1);
});
```

#### Testing Loading States

```typescript
await user.click(button);

await waitFor(
  () => {
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent("Loading...");
  },
  { timeout: 500 },
);
```

### Type-Safe Mock Assertions

When accessing mock call arguments, use proper type guards:

```typescript
// ❌ BAD - Can throw TypeScript error
const arg = mockFn.mock.calls[0][0];
expect(arg.property).toBe(value);

// ✅ GOOD - Type-safe with guards
expect(mockFn).toHaveBeenCalled();
expect(mockFn.mock.calls.length).toBeGreaterThan(0);
const arg = mockFn.mock.calls[0]?.[0];
expect(arg).toBeDefined();
expect(arg?.property).toBe(value);
```

## Common Patterns

### Testing Component Rendering

```typescript
it('renders component correctly', async () => {
  const event = createMockCalendarEvent({ title: 'Test Event' });

  renderWithProviders(<EventCard event={event} />, { queryClient });

  await waitFor(() => {
    expect(screen.getByText('Test Event')).toBeInTheDocument();
  });
});
```

### Testing Conditional Rendering

```typescript
it('shows alternate button when main slots are full', async () => {
  const fullEvent = createMockCalendarEvent({
    playerSlots: 4,
    mainPlayers: 4,
    alternates: 0,
  });

  renderWithProviders(<JoinButton event={fullEvent} />, { queryClient });

  await waitFor(() => {
    expect(screen.getByText('Join as Alternate')).toBeInTheDocument();
  });
});
```

### Testing Mutations

```typescript
it('calls onSuccess after successful join', async () => {
  const user = userEvent.setup();
  const mockOnSuccess = vi.fn();
  const event = createMockCalendarEvent();

  server.use(
    http.post('/api/events/:eventId/join', () => {
      return HttpResponse.json({ success: true }, { status: 200 });
    }),
  );

  renderWithProviders(
    <JoinButton event={event} onSuccess={mockOnSuccess} />,
    { queryClient }
  );

  await user.click(screen.getByTestId('join-button'));

  await waitFor(() => {
    expect(mockOnSuccess).toHaveBeenCalledTimes(1);
  });
});
```

### Testing Error States

```typescript
it('shows error message on failed request', async () => {
  server.use(
    http.post('/api/events/:eventId/join', () => {
      return new HttpResponse(null, { status: 500 });
    }),
  );

  renderWithProviders(<JoinButton event={event} />, { queryClient });

  const user = userEvent.setup();
  await user.click(screen.getByTestId('join-button'));

  await waitFor(() => {
    expect(screen.getByText(/failed to join/i)).toBeInTheDocument();
  });
});
```

### Testing Query Cache Updates

```typescript
it('updates cache after mutation', async () => {
  const attendees = [createMockAttendee()];

  queryClient.setQueryData(
    ['/api/events', event.id, 'attendees'],
    attendees
  );

  renderWithProviders(<AttendeeList eventId={event.id} />, { queryClient });

  await waitFor(() => {
    const cachedData = queryClient.getQueryData(['/api/events', event.id, 'attendees']);
    expect(cachedData).toEqual(attendees);
  });
});
```

## Best Practices

### 1. Test Organization

```typescript
describe("ComponentName", () => {
  // Setup hooks
  beforeEach(() => {});
  afterEach(() => {});

  // Group related tests
  describe("Rendering", () => {
    it("renders when...", () => {});
    it("does not render when...", () => {});
  });

  describe("User Interactions", () => {
    it("handles click events", () => {});
    it("handles form submission", () => {});
  });

  describe("Error Handling", () => {
    it("shows error message", () => {});
    it("recovers from errors", () => {});
  });
});
```

### 2. Use Descriptive Test Names

```typescript
// ❌ BAD
it("works", () => {});
it("test button", () => {});

// ✅ GOOD
it("renders Join Pod button when user is not attending and slots available", () => {});
it("disables button while mutation is in progress", () => {});
```

### 3. Mock at the Network Layer

```typescript
// ❌ BAD - Mocking implementation details
vi.mock("@/api/events", () => ({
  joinEvent: vi.fn(),
}));

// ✅ GOOD - Mocking network requests
server.use(
  http.post("/api/events/:eventId/join", () => {
    return HttpResponse.json({ success: true });
  }),
);
```

### 4. Keep Tests Focused

Each test should verify one behavior:

```typescript
// ❌ BAD - Testing multiple things
it("handles full event flow", async () => {
  // Renders correctly
  expect(screen.getByText("Join")).toBeInTheDocument();

  // Handles click
  await user.click(button);

  // Shows loading
  expect(button).toBeDisabled();

  // Shows success
  await waitFor(() => {
    expect(screen.getByText("Success")).toBeInTheDocument();
  });
});

// ✅ GOOD - Separate tests
it("renders join button", () => {});
it("disables button during loading", () => {});
it("shows success message after join", () => {});
```

### 5. Clean Up Between Tests

```typescript
beforeEach(() => {
  vi.clearAllMocks();
  queryClient = createTestQueryClient();
});

afterEach(() => {
  server.resetHandlers();
});
```

### 6. Use Factory Functions Over Inline Objects

```typescript
// ❌ BAD - Repetitive, error-prone
const event = {
  id: "event-1",
  title: "Event",
  description: "Description",
  type: "game_pod",
  date: "2024-12-01",
  time: "18:00",
  location: "Location",
  playerSlots: 4,
  alternateSlots: 2,
  // ... many more fields
};

// ✅ GOOD - Concise, maintainable
const event = createMockCalendarEvent({
  id: "event-1",
  title: "Event",
});
```

### 7. Type Your Mocks

```typescript
// ❌ BAD - Loses type safety
const mockData: any = {
  /* ... */
};

// ✅ GOOD - Maintains type safety
const mockData: CalendarEvent = createMockCalendarEvent();
```

## Examples

See the following files for complete examples:

- `/client/src/features/events/components/JoinEventButton.test.tsx`
- `/client/src/features/events/components/DayView.test.tsx`
- `/client/src/test-utils/generators.ts`

## Troubleshooting

### "No value exists in scope for shorthand property"

**Problem:** Using variables that aren't in scope.

**Solution:** Move variables to `beforeEach` or declare them in the appropriate scope:

```typescript
describe("Component", () => {
  let variable: Type;

  beforeEach(() => {
    variable = createMock();
  });
});
```

### "Property does not exist on type 'undefined'"

**Problem:** Accessing optional properties without guards.

**Solution:** Use optional chaining and type guards:

```typescript
const value = mockFn.mock.calls[0]?.[0];
expect(value).toBeDefined();
expect(value?.property).toBe(expected);
```

### Tests Fail Due to Cache Pollution

**Problem:** Tests interfere with each other through shared query cache.

**Solution:** Create fresh QueryClient in `beforeEach`:

```typescript
beforeEach(() => {
  queryClient = createTestQueryClient();
});
```

## Related Documentation

- [Testing Library Best Practices](https://testing-library.com/docs/queries/about)
- [Vitest API Reference](https://vitest.dev/api/)
- [MSW Documentation](https://mswjs.io/docs/)
- [React Query Testing Guide](https://tanstack.com/query/latest/docs/framework/react/guides/testing)
