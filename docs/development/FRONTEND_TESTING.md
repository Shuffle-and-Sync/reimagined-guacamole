# Frontend Testing Guide

## Overview

This project uses **Vitest** + **React Testing Library** for frontend testing. Vitest provides fast, Vite-native testing with excellent TypeScript support, while React Testing Library enables testing components the way users interact with them.

## Technology Stack

- **Vitest 2.1.9** - Core testing framework
- **@vitest/ui** - Visual test UI for debugging
- **@vitest/coverage-v8** - Code coverage using V8
- **React Testing Library 16.1.0** - React component testing utilities
- **@testing-library/jest-dom** - Custom DOM matchers
- **@testing-library/user-event** - Realistic user interaction simulation
- **MSW 2.7.0** - API mocking via Mock Service Worker
- **Faker.js** - Generate realistic test data
- **happy-dom** - Lightweight DOM implementation

## Running Tests

```bash
# Run all frontend tests once
npm run test:frontend

# Run tests in watch mode (auto-rerun on changes)
npm run test:frontend:watch

# Run tests with visual UI
npm run test:frontend:ui

# Generate coverage report
npm run test:frontend:coverage

# Run backend tests (Jest)
npm run test:backend

# Run all tests (backend + frontend)
npm test
```

## Project Structure

```
client/src/
├── components/
│   └── ui/
│       ├── button.tsx
│       ├── button.test.tsx        # Component tests
│       ├── card.tsx
│       └── card.test.tsx
├── test-utils/
│   ├── setup.ts                   # Global test setup (MSW, mocks)
│   ├── render.tsx                 # Custom render with providers
│   ├── generators.ts              # Mock data factories (Faker)
│   ├── index.ts                   # Central exports
│   └── mocks/
│       ├── handlers.ts            # MSW request handlers
│       ├── server.ts              # MSW server for Node tests
│       └── browser.ts             # MSW worker for browser tests
└── ...
```

## Writing Tests

### Component Tests

Use the `renderWithProviders` function to render components with all necessary context providers (QueryClient, CommunityProvider, TooltipProvider).

```typescript
import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen, userEvent } from "@/test-utils";
import { Button } from "./button";

describe("Button Component", () => {
  it("renders with default props", () => {
    renderWithProviders(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("handles click events", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    renderWithProviders(<Button onClick={handleClick}>Click me</Button>);

    await user.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("can be disabled", () => {
    renderWithProviders(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
```

### Hook Tests

Test custom React hooks using `renderHook` from React Testing Library.

```typescript
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

describe("useAuth Hook", () => {
  it("returns user data when authenticated", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(true);
  });
});
```

### Integration Tests

Test complete user flows with mocked API responses using MSW.

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { renderWithProviders, screen, waitFor } from "@/test-utils";
import { server } from "@/test-utils/mocks/server";
import { http, HttpResponse } from "msw";
import { TournamentsList } from "./tournaments-list";
import { createMockTournament } from "@/test-utils/generators";

describe("TournamentsList Integration", () => {
  const mockTournaments = [
    createMockTournament({ name: "Tournament 1" }),
    createMockTournament({ name: "Tournament 2" }),
  ];

  beforeEach(() => {
    server.use(
      http.get("/api/tournaments", () => {
        return HttpResponse.json({ tournaments: mockTournaments });
      }),
    );
  });

  it("fetches and displays tournaments", async () => {
    renderWithProviders(<TournamentsList />);

    await waitFor(() => {
      expect(screen.getByText("Tournament 1")).toBeInTheDocument();
      expect(screen.getByText("Tournament 2")).toBeInTheDocument();
    });
  });
});
```

## Best Practices

### 1. Query Priorities

Use Testing Library queries in this order (most to least preferred):

1. `getByRole` - Best for accessibility
2. `getByLabelText` - Good for form fields
3. `getByPlaceholderText` - When label is missing
4. `getByText` - For non-interactive elements
5. `getByTestId` - Last resort only

```typescript
// ✅ GOOD - Uses semantic queries
const button = screen.getByRole("button", { name: /submit/i });
const input = screen.getByLabelText("Email address");

// ❌ BAD - Relies on implementation details
const button = screen.getByTestId("submit-button");
```

### 2. User Interactions

Always use `userEvent` instead of `fireEvent` for more realistic simulations.

```typescript
// ✅ GOOD - Realistic user interaction
const user = userEvent.setup();
await user.click(button);
await user.type(input, "test@example.com");

// ❌ BAD - Low-level event firing
fireEvent.click(button);
fireEvent.change(input, { target: { value: "test@example.com" } });
```

### 3. Async Operations

Use `waitFor` for async updates and assertions.

```typescript
// ✅ GOOD - Waits for async update
await waitFor(() => {
  expect(screen.getByText("Loaded")).toBeInTheDocument();
});

// ❌ BAD - May fail due to race condition
expect(screen.getByText("Loaded")).toBeInTheDocument();
```

### 4. Mock Data

Use the test data generators from `@/test-utils/generators` for consistent, realistic test data.

```typescript
import {
  createMockUser,
  createMockTournament,
  createMockList,
} from "@/test-utils/generators";

// Single item
const user = createMockUser({ email: "custom@example.com" });

// Multiple items
const users = createMockList(createMockUser, 5);

// With custom overrides
const tournament = createMockTournament({
  name: "Custom Tournament",
  maxParticipants: 64,
});
```

### 5. API Mocking

Add new API handlers to `client/src/test-utils/mocks/handlers.ts`.

```typescript
// Add to handlers.ts
export const handlers = [
  http.get("/api/tournaments/:id", ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      name: "Test Tournament",
      status: "upcoming",
    });
  }),
];

// Override in specific test
server.use(
  http.get("/api/tournaments/:id", () => {
    return HttpResponse.json({ error: "Not found" }, { status: 404 });
  }),
);
```

## Testing Patterns

### Testing Forms

```typescript
it("validates and submits form", async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();

  renderWithProviders(<TournamentForm onSubmit={onSubmit} />);

  // Fill out form
  await user.type(screen.getByLabelText(/tournament name/i), "Test Tournament");
  await user.selectOptions(screen.getByLabelText(/game/i), "Magic");

  // Submit
  await user.click(screen.getByRole("button", { name: /create/i }));

  // Verify submission
  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Test Tournament",
        game: "Magic",
      }),
    );
  });
});
```

### Testing Loading States

```typescript
it("shows loading spinner while fetching", () => {
  renderWithProviders(<TournamentsList />);

  // Initially loading
  expect(screen.getByRole("progressbar")).toBeInTheDocument();

  // After loading
  await waitFor(() => {
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });
});
```

### Testing Error States

```typescript
it("displays error message on fetch failure", async () => {
  server.use(
    http.get("/api/tournaments", () => {
      return HttpResponse.json({ error: "Server error" }, { status: 500 });
    }),
  );

  renderWithProviders(<TournamentsList />);

  await waitFor(() => {
    expect(screen.getByText(/error loading tournaments/i)).toBeInTheDocument();
  });
});
```

## Coverage Requirements

The project enforces minimum coverage thresholds:

- **Lines:** 70%
- **Functions:** 70%
- **Branches:** 70%
- **Statements:** 70%

View coverage reports:

```bash
npm run test:frontend:coverage

# Open HTML report
open coverage/index.html
```

## Debugging Tests

### 1. Use the Visual UI

```bash
npm run test:frontend:ui
```

Opens an interactive UI showing test results, file coverage, and allows filtering.

### 2. Debug Output

```typescript
import { screen } from "@/test-utils";

// Print current DOM
screen.debug();

// Print specific element
screen.debug(screen.getByRole("button"));
```

### 3. Watch Mode

```bash
npm run test:frontend:watch
```

Auto-reruns tests on file changes. Press `h` for help menu.

### 4. Isolate Tests

```typescript
// Run only this test
it.only("specific test case", () => {
  // ...
});

// Skip this test
it.skip("broken test to fix later", () => {
  // ...
});
```

## Common Issues

### Issue: "Cannot find module '@/test-utils'"

**Solution:** Check `vitest.config.ts` has correct path aliases:

```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, 'client', 'src'),
  },
}
```

### Issue: Tests timeout

**Solution:** Increase timeout in test or config:

```typescript
// Per test
it("slow test", async () => {
  // ...
}, { timeout: 20000 });

// Global in vitest.config.ts
test: {
  testTimeout: 20000,
}
```

### Issue: "Act" warnings

**Solution:** Wrap async updates in `waitFor`:

```typescript
await waitFor(() => {
  expect(screen.getByText("Updated")).toBeInTheDocument();
});
```

### Issue: MSW handlers not working

**Solution:** Ensure MSW server is started in setup.ts (already configured).

## CI/CD Integration

Tests run automatically in GitHub Actions on:

- Push to `main` or `develop` branches
- Pull requests targeting these branches
- Changes to `client/`, `shared/`, or test config files

See `.github/workflows/frontend-tests.yml` for configuration.

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [MSW Documentation](https://mswjs.io/)
- [Faker.js Documentation](https://fakerjs.dev/)

## Contributing

When adding new features:

1. ✅ Write tests before implementation (TDD)
2. ✅ Test user interactions, not implementation details
3. ✅ Maintain or improve code coverage
4. ✅ Add MSW handlers for new API endpoints
5. ✅ Use data generators for mock data
6. ✅ Ensure tests pass before committing

Happy Testing! 🧪
