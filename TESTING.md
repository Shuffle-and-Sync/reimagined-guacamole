# Testing Best Practices Guide

This guide provides comprehensive testing patterns and best practices for the Shuffle & Sync platform. It covers unit tests, integration tests, database testing, and API testing to ensure consistency and quality across the team.

---

## Table of Contents

1. [Writing Effective Tests](#1-writing-effective-tests)
2. [Database Testing Pattern](#2-database-testing-pattern)
3. [API/Integration Testing Pattern](#3-apiintegration-testing-pattern)
4. [How to Run Tests](#4-how-to-run-tests)

---

## 1. Writing Effective Tests

### React Component Testing with @testing-library/react

While the project currently focuses on backend and integration testing, here's the recommended pattern for testing React components when needed.

#### Basic Component Test Example

```typescript
/**
 * Example: Testing a Login Form Component
 *
 * This example demonstrates:
 * - User interactions (typing, clicking)
 * - Form validation
 * - Error state handling
 * - Accessibility testing
 */

import { describe, test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '@/components/LoginForm';

describe('LoginForm Component', () => {
  // Setup and teardown
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test 1: Rendering and Accessibility
   * Verify that the component renders with proper ARIA labels
   */
  test('renders login form with accessible elements', () => {
    render(<LoginForm />);

    // Check for form elements with proper labels
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();

    // Verify button has accessible name
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    expect(submitButton).toBeInTheDocument();

    // Check for proper ARIA attributes
    const emailInput = screen.getByLabelText('Email');
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('aria-required', 'true');
  });

  /**
   * Test 2: User Interaction
   * Test typing and form submission
   */
  test('handles user input correctly', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();

    render(<LoginForm onSubmit={onSubmit} />);

    // Type into email field
    const emailInput = screen.getByLabelText('Email');
    await user.type(emailInput, 'test@example.com');
    expect(emailInput).toHaveValue('test@example.com');

    // Type into password field
    const passwordInput = screen.getByLabelText('Password');
    await user.type(passwordInput, 'password123');
    expect(passwordInput).toHaveValue('password123');

    // Click submit button
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    // Verify submission was called with correct data
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  /**
   * Test 3: Error State Handling
   * Verify error messages are displayed correctly
   */
  test('displays validation errors for invalid input', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    // Submit with empty fields
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    // Check for error messages
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });

    // Verify error announcements for screen readers
    const emailError = screen.getByText(/email is required/i);
    expect(emailError).toHaveAttribute('role', 'alert');
    expect(emailError).toHaveAttribute('aria-live', 'polite');
  });

  /**
   * Test 4: Loading State
   * Test loading indicator during form submission
   */
  test('shows loading state during submission', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<LoginForm onSubmit={onSubmit} />);

    // Fill and submit form
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Verify loading state
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading');
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  /**
   * Test 5: Keyboard Navigation
   * Verify keyboard accessibility
   */
  test('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    // Tab through form elements
    await user.tab();
    expect(screen.getByLabelText('Email')).toHaveFocus();

    await user.tab();
    expect(screen.getByLabelText('Password')).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: /sign in/i })).toHaveFocus();

    // Submit with Enter key
    await user.keyboard('{Enter}');
    // Form should attempt submission
  });
});
```

### Key Principles for Component Testing

1. **Test User Behavior, Not Implementation**: Focus on what users see and do
2. **Use Semantic Queries**: Prefer `getByRole`, `getByLabelText` over `getByTestId`
3. **Test Accessibility**: Verify ARIA labels, keyboard navigation, screen reader support
4. **Handle Async Operations**: Use `waitFor` for async state changes
5. **Clean Up**: Use `beforeEach` to reset mocks and clear state

---

## 2. Database Testing Pattern

### Testing Database Queries with Drizzle ORM

The project uses **Drizzle ORM** exclusively for all database operations. Here's how to test database functionality.

#### Database Test Example

```typescript
/**
 * Example: Testing a User Repository
 *
 * This example demonstrates:
 * - Database setup and teardown
 * - Testing CRUD operations
 * - Drizzle ORM query patterns
 * - Data validation
 */

import { describe, test, expect, beforeEach, afterAll } from "@jest/globals";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq, and, like } from "drizzle-orm";
import { users } from "@shared/schema";
import * as schema from "@shared/schema";

// Test database setup
let testDb: ReturnType<typeof drizzle>;
let sqlite: Database.Database;

/**
 * Setup: Initialize test database before each test
 * Uses in-memory SQLite database for fast, isolated tests
 */
beforeEach(async () => {
  // Create in-memory database
  sqlite = new Database(":memory:");
  testDb = drizzle(sqlite, { schema });

  // Create tables
  sqlite.exec(`
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      status TEXT DEFAULT 'active',
      role TEXT DEFAULT 'user',
      createdAt INTEGER DEFAULT (unixepoch()),
      updatedAt INTEGER DEFAULT (unixepoch())
    );
  `);
});

/**
 * Teardown: Clean up database after all tests
 */
afterAll(() => {
  if (sqlite) {
    sqlite.close();
  }
});

describe("User Repository - Database Operations", () => {
  /**
   * Test 1: Create User
   * Verify user can be inserted into database
   */
  test("should create a new user", async () => {
    const userData = {
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
      status: "active",
      role: "user",
    };

    // Insert user using Drizzle ORM
    await testDb.insert(users).values(userData);

    // Query to verify insertion
    const [result] = await testDb
      .select()
      .from(users)
      .where(eq(users.id, userData.id));

    // Assertions
    expect(result).toBeDefined();
    expect(result.email).toBe(userData.email);
    expect(result.name).toBe(userData.name);
    expect(result.status).toBe("active");
  });

  /**
   * Test 2: Find User by Email
   * Test query with where condition
   */
  test("should find user by email", async () => {
    // Insert test data
    await testDb.insert(users).values([
      { id: "user-1", email: "alice@example.com", name: "Alice" },
      { id: "user-2", email: "bob@example.com", name: "Bob" },
    ]);

    // Query with WHERE clause
    const [result] = await testDb
      .select()
      .from(users)
      .where(eq(users.email, "alice@example.com"));

    expect(result).toBeDefined();
    expect(result.name).toBe("Alice");
    expect(result.email).toBe("alice@example.com");
  });

  /**
   * Test 3: Update User
   * Test update operation
   */
  test("should update user data", async () => {
    // Insert initial user
    await testDb.insert(users).values({
      id: "user-123",
      email: "test@example.com",
      name: "Old Name",
      status: "active",
    });

    // Update user name
    await testDb
      .update(users)
      .set({ name: "New Name", updatedAt: Date.now() })
      .where(eq(users.id, "user-123"));

    // Verify update
    const [updated] = await testDb
      .select()
      .from(users)
      .where(eq(users.id, "user-123"));

    expect(updated.name).toBe("New Name");
  });

  /**
   * Test 4: Delete User
   * Test delete operation
   */
  test("should delete user", async () => {
    // Insert user
    await testDb.insert(users).values({
      id: "user-to-delete",
      email: "delete@example.com",
      name: "Delete Me",
    });

    // Delete user
    await testDb.delete(users).where(eq(users.id, "user-to-delete"));

    // Verify deletion
    const result = await testDb
      .select()
      .from(users)
      .where(eq(users.id, "user-to-delete"));

    expect(result).toHaveLength(0);
  });

  /**
   * Test 5: Complex Query with Multiple Conditions
   * Test AND conditions and LIKE operator
   */
  test("should handle complex queries", async () => {
    // Insert test users
    await testDb.insert(users).values([
      {
        id: "user-1",
        email: "admin@example.com",
        name: "Admin User",
        role: "admin",
        status: "active",
      },
      {
        id: "user-2",
        email: "user@example.com",
        name: "Regular User",
        role: "user",
        status: "active",
      },
      {
        id: "user-3",
        email: "suspended@example.com",
        name: "Suspended User",
        role: "user",
        status: "suspended",
      },
    ]);

    // Complex query: Find active users with specific role
    const results = await testDb
      .select()
      .from(users)
      .where(and(eq(users.status, "active"), eq(users.role, "user")));

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Regular User");
  });

  /**
   * Test 6: Search with LIKE
   * Test pattern matching queries
   */
  test("should search users by name pattern", async () => {
    // Insert test users
    await testDb.insert(users).values([
      { id: "user-1", email: "john@example.com", name: "John Doe" },
      { id: "user-2", email: "jane@example.com", name: "Jane Smith" },
      { id: "user-3", email: "johnny@example.com", name: "Johnny Appleseed" },
    ]);

    // Search for users with "John" in name
    const results = await testDb
      .select()
      .from(users)
      .where(like(users.name, "%John%"));

    expect(results).toHaveLength(2);
    expect(results.map((u) => u.name)).toContain("John Doe");
    expect(results.map((u) => u.name)).toContain("Johnny Appleseed");
  });

  /**
   * Test 7: Unique Constraint Handling
   * Test database constraint enforcement
   */
  test("should enforce unique email constraint", async () => {
    // Insert first user
    await testDb.insert(users).values({
      id: "user-1",
      email: "duplicate@example.com",
      name: "User One",
    });

    // Attempt to insert duplicate email
    await expect(
      testDb.insert(users).values({
        id: "user-2",
        email: "duplicate@example.com", // Duplicate email
        name: "User Two",
      }),
    ).rejects.toThrow(/UNIQUE constraint failed/);
  });
});
```

### Key Principles for Database Testing

1. **Use In-Memory Database**: Fast, isolated tests with `:memory:` SQLite
2. **Clean State**: Use `beforeEach` to create fresh database for each test
3. **Test with Real Queries**: Use actual Drizzle ORM queries, not mocks
4. **Verify Constraints**: Test unique constraints, foreign keys, validations
5. **Close Connections**: Always close database in `afterAll`

---

## 3. API/Integration Testing Pattern

### Testing API Endpoints and Integration Flows

Integration tests verify that multiple components work together correctly. Here's the pattern for testing API endpoints.

#### API Integration Test Example

```typescript
/**
 * Example: Testing Authentication API Endpoints
 *
 * This example demonstrates:
 * - API endpoint testing
 * - Request/response validation
 * - Error handling
 * - Session management
 * - Integration between multiple services
 */

import { describe, test, expect, beforeEach, jest } from "@jest/globals";

// Mock Express request and response
const createMockRequest = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: null,
  session: {},
  ip: "127.0.0.1",
  method: "GET",
  url: "/test",
  ...overrides,
});

const createMockResponse = () => {
  const res: any = {
    statusCode: 200,
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    getHeader: jest.fn(),
    end: jest.fn().mockReturnThis(),
  };
  return res;
};

describe("Authentication API Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test 1: Successful Login Flow
   * Test complete authentication flow
   */
  test("POST /api/auth/login - successful authentication", async () => {
    const req = createMockRequest({
      method: "POST",
      body: {
        email: "test@example.com",
        password: "password123",
      },
    });
    const res = createMockResponse();

    // Mock authentication service
    const authService = {
      login: jest.fn().mockResolvedValue({
        user: {
          id: "user-123",
          email: "test@example.com",
          name: "Test User",
        },
        token: "session-token-xyz",
      }),
    };

    // Simulate API handler
    const loginHandler = async (req: any, res: any) => {
      try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
          return res.status(400).json({ error: "Email and password required" });
        }

        // Call auth service
        const result = await authService.login(email, password);

        // Set session
        req.session.userId = result.user.id;
        req.session.token = result.token;

        return res.status(200).json({
          success: true,
          user: result.user,
        });
      } catch (error) {
        return res.status(500).json({ error: "Authentication failed" });
      }
    };

    // Execute handler
    await loginHandler(req, res);

    // Assertions
    expect(authService.login).toHaveBeenCalledWith(
      "test@example.com",
      "password123",
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        user: expect.objectContaining({
          email: "test@example.com",
        }),
      }),
    );
    expect(req.session.userId).toBe("user-123");
  });

  /**
   * Test 2: Invalid Credentials
   * Test error handling for failed authentication
   */
  test("POST /api/auth/login - invalid credentials", async () => {
    const req = createMockRequest({
      method: "POST",
      body: {
        email: "test@example.com",
        password: "wrong-password",
      },
    });
    const res = createMockResponse();

    // Mock auth service with rejection
    const authService = {
      login: jest.fn().mockRejectedValue(new Error("Invalid credentials")),
    };

    const loginHandler = async (req: any, res: any) => {
      try {
        const { email, password } = req.body;
        const result = await authService.login(email, password);
        return res.status(200).json({ success: true, user: result.user });
      } catch (error) {
        return res.status(401).json({
          error: "Invalid credentials",
          success: false,
        });
      }
    };

    await loginHandler(req, res);

    // Verify error response
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Invalid credentials",
        success: false,
      }),
    );
  });

  /**
   * Test 3: Missing Required Fields
   * Test input validation
   */
  test("POST /api/auth/login - missing fields", async () => {
    const req = createMockRequest({
      method: "POST",
      body: {
        email: "test@example.com",
        // password missing
      },
    });
    const res = createMockResponse();

    const loginHandler = async (req: any, res: any) => {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          error: "Email and password required",
        });
      }

      // ... rest of handler
    };

    await loginHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Email and password required",
    });
  });

  /**
   * Test 4: Session Validation
   * Test protected endpoint with session
   */
  test("GET /api/user/profile - authenticated request", async () => {
    const req = createMockRequest({
      method: "GET",
      session: {
        userId: "user-123",
        token: "valid-token",
      },
    });
    const res = createMockResponse();

    const userService = {
      getProfile: jest.fn().mockResolvedValue({
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        role: "user",
      }),
    };

    const profileHandler = async (req: any, res: any) => {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const profile = await userService.getProfile(req.session.userId);
      return res.status(200).json({ user: profile });
    };

    await profileHandler(req, res);

    expect(userService.getProfile).toHaveBeenCalledWith("user-123");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      user: expect.objectContaining({
        email: "test@example.com",
      }),
    });
  });

  /**
   * Test 5: Unauthorized Access
   * Test protected endpoint without session
   */
  test("GET /api/user/profile - unauthenticated request", async () => {
    const req = createMockRequest({
      method: "GET",
      session: {}, // No userId in session
    });
    const res = createMockResponse();

    const profileHandler = async (req: any, res: any) => {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      // ... rest of handler
    };

    await profileHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
  });

  /**
   * Test 6: Server Error Handling
   * Test 500 error scenarios
   */
  test("POST /api/auth/login - server error", async () => {
    const req = createMockRequest({
      method: "POST",
      body: {
        email: "test@example.com",
        password: "password123",
      },
    });
    const res = createMockResponse();

    // Mock service throwing unexpected error
    const authService = {
      login: jest
        .fn()
        .mockRejectedValue(new Error("Database connection failed")),
    };

    const loginHandler = async (req: any, res: any) => {
      try {
        const { email, password } = req.body;
        await authService.login(email, password);
      } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
          error: "Internal server error",
          success: false,
        });
      }
    };

    await loginHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "Internal server error",
      success: false,
    });
  });
});
```

### Integration Test with Multiple Services

```typescript
/**
 * Example: Multi-Service Integration Test
 * Tests interaction between authentication, user, and event services
 */

describe("Event Creation Integration", () => {
  test("should create event with authenticated user", async () => {
    // Mock services
    const authService = {
      validateSession: jest.fn().mockResolvedValue({
        userId: "user-123",
        role: "user",
      }),
    };

    const userService = {
      getUser: jest.fn().mockResolvedValue({
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
      }),
    };

    const eventService = {
      createEvent: jest.fn().mockResolvedValue({
        id: "event-456",
        title: "Friday Night Magic",
        creatorId: "user-123",
        date: "2024-12-20",
      }),
    };

    // Mock request
    const req = createMockRequest({
      method: "POST",
      session: { userId: "user-123", token: "valid-token" },
      body: {
        title: "Friday Night Magic",
        date: "2024-12-20",
        type: "tournament",
      },
    });
    const res = createMockResponse();

    // Handler that integrates multiple services
    const createEventHandler = async (req: any, res: any) => {
      // 1. Validate session
      const session = await authService.validateSession(req.session.token);
      if (!session) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // 2. Get user details
      const user = await userService.getUser(session.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // 3. Create event
      const event = await eventService.createEvent({
        ...req.body,
        creatorId: user.id,
      });

      return res.status(201).json({ event });
    };

    // Execute handler
    await createEventHandler(req, res);

    // Verify service interactions
    expect(authService.validateSession).toHaveBeenCalledWith("valid-token");
    expect(userService.getUser).toHaveBeenCalledWith("user-123");
    expect(eventService.createEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Friday Night Magic",
        creatorId: "user-123",
      }),
    );

    // Verify response
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      event: expect.objectContaining({
        id: "event-456",
        title: "Friday Night Magic",
      }),
    });
  });
});
```

### Key Principles for API/Integration Testing

1. **Mock External Services**: Use Jest mocks for database, APIs, email services
2. **Test Happy Path and Error Paths**: Cover both success and failure scenarios
3. **Validate Input/Output**: Check request validation and response format
4. **Test Authentication/Authorization**: Verify protected endpoints require valid sessions
5. **Test Service Integration**: Verify multiple services work together correctly
6. **Use Realistic Data**: Mock data should match production data structures

---

## 4. How to Run Tests

### Available npm Scripts

The project provides comprehensive npm scripts for running different types of tests:

#### Run All Tests

```bash
# Run complete test suite
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Generate coverage report (requires 70%+ coverage)
npm run test:coverage

# Run tests in CI mode (no watch, generates coverage)
npm run test:ci
```

#### Run Specific Test Suites

```bash
# Feature tests (authentication, tournaments, events, etc.)
npm run test:features

# Authentication tests only
npm run test:auth

# Tournament tests only
npm run test:tournaments

# Matchmaking tests only
npm run test:matchmaking

# Calendar tests only
npm run test:calendar

# Messaging tests only
npm run test:messaging

# Unit tests only (excludes integration tests)
npm run test:unit

# Security tests (input sanitization, credential protection)
npm run test:security

# Generate test coverage for features
npm run test:coverage:features
```

#### Performance Tests

```bash
# Run load tests
npm run test:load

# Run stress tests
npm run test:stress

# Run performance test demo
npm run test:performance:demo
```

#### Auto-Generate Tests

```bash
# Generate tests for new features using AI agent
npm run test:generate
```

### Test Configuration

Tests are configured in `jest.config.js`:

- **Test Environment**: Node.js
- **Test Files**: `**/*.test.ts`, `**/*.test.js`
- **Setup File**: `server/tests/setup.ts` (global test utilities)
- **Coverage Threshold**: 70% for all metrics (branches, functions, lines, statements)
- **Timeout**: 10 seconds per test
- **ESM Support**: Full ES modules support with ts-jest

### Test File Locations

```
server/tests/
├── admin/               # Admin initialization tests
├── environment/         # Environment validation tests
├── features/            # Feature integration tests
│   ├── authentication.test.ts
│   ├── tournaments.test.ts
│   ├── matchmaking.test.ts
│   └── ...
├── schema/              # Database schema tests
├── security/            # Security and validation tests
├── services/            # Service layer tests
├── typescript/          # TypeScript compliance tests
├── utils/               # Utility function tests
├── ux/                  # UX and accessibility tests
├── setup.ts             # Global test setup
└── simple.test.ts       # Basic sanity test
```

### Writing and Running Your Tests

1. **Create Test File**: Place in appropriate directory under `server/tests/`
2. **Follow Naming Convention**: `*.test.ts` or `*.test.tsx`
3. **Import Test Framework**: Use `@jest/globals` for type-safe imports
4. **Run Tests**: Use `npm test` or watch mode for active development
5. **Check Coverage**: Run `npm run test:coverage` to ensure adequate coverage

### Test Utilities

Global test utilities are available via `global.testUtils` (defined in `setup.ts`):

```typescript
// Create mock user
const mockUser = global.testUtils.createMockUser({
  email: "custom@example.com",
});

// Create mock request
const req = global.testUtils.createMockRequest({
  body: { key: "value" },
});

// Create mock response
const res = global.testUtils.createMockResponse();

// Sleep utility for async tests
await global.testUtils.sleep(100); // Wait 100ms
```

### Debugging Tests

```bash
# Run with verbose output
npm test -- --verbose

# Run specific test file
npm test -- server/tests/features/authentication.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should create user"

# Update snapshots (if using snapshot testing)
npm test -- --updateSnapshot

# Enable verbose test logs
VERBOSE_TESTS=true npm test
```

### Best Practices Summary

1. ✅ **Run tests before committing**: Ensure all tests pass
2. ✅ **Write tests for new features**: Follow existing patterns
3. ✅ **Maintain 70%+ coverage**: Use `npm run test:coverage` to check
4. ✅ **Use descriptive test names**: Clearly describe what is being tested
5. ✅ **Clean up after tests**: Use `beforeEach` and `afterAll` hooks
6. ✅ **Mock external dependencies**: Don't make real API calls or database connections in unit tests
7. ✅ **Test edge cases**: Cover error scenarios and boundary conditions
8. ✅ **Keep tests fast**: Use in-memory databases, avoid unnecessary delays

---

## Additional Resources

- **Jest Documentation**: https://jestjs.io/docs/getting-started
- **Testing Library**: https://testing-library.com/docs/react-testing-library/intro/
- **Drizzle ORM**: https://orm.drizzle.team/docs/overview
- **Project Testing Setup**: `jest.config.js`
- **Test Utilities**: `server/tests/setup.ts`
- **Example Tests**: `server/tests/features/` and `server/tests/utils/`

---

**Last Updated**: January 2025  
**Maintainer**: Shuffle & Sync Development Team
