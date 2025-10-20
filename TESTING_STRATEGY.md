# Testing Strategy: Shuffle & Sync

**Version**: 1.0.0  
**Date**: October 20, 2025  
**Status**: Active  
**Owner**: Development Team

---

## Executive Summary

This document defines the comprehensive testing strategy for the Shuffle & Sync platform, establishing standards, guidelines, and practices to ensure code quality, reliability, and maintainability.

### Key Objectives

- **Maintain 85%+ overall test coverage** across the codebase
- **Ensure 90%+ coverage** on critical paths (authentication, tournaments, data access)
- **Prevent regressions** through automated testing in CI/CD
- **Enable confident refactoring** with comprehensive test suites
- **Reduce production bugs** by catching issues early in development

---

## Test Pyramid Strategy

### Target Distribution

We follow the industry-standard test pyramid to balance speed, reliability, and coverage:

```
         /\
        /  \  E2E Tests (5-10%)
       /____\
      /      \  Integration Tests (20-30%)
     /________\
    /          \  Unit Tests (60-75%)
   /____________\
```

### Current vs Target Distribution

| Test Type         | Current | Target | Status      | Gap        |
| ----------------- | ------- | ------ | ----------- | ---------- |
| **Unit Tests**    | 64%     | 60-75% | ✅ On Track | -          |
| **Integration**   | 17%     | 20-30% | ⚠️ Below    | +3-13%     |
| **E2E Tests**     | 17%     | 5-10%  | ⚠️ Above    | Rebalance  |
| **Feature Tests** | 18%     | -      | -           | Reclassify |

**Analysis**: Current distribution shows good unit test coverage, but integration and E2E tests need rebalancing. Many "E2E" tests are actually integration tests and should be reclassified.

### Test Type Definitions

#### Unit Tests (60-75% of all tests)

**Purpose**: Test individual functions, methods, and components in isolation.

**Characteristics**:

- Fast execution (<100ms per test)
- No external dependencies (database, network, file system)
- Use mocks/stubs for dependencies
- Test single responsibility

**Examples**:

```typescript
// Password validation
describe("validatePassword", () => {
  test("should require minimum 8 characters", () => {
    expect(validatePassword("abc123")).toBe(false);
  });

  test("should require uppercase and lowercase", () => {
    expect(validatePassword("password")).toBe(false);
    expect(validatePassword("Password1!")).toBe(true);
  });
});

// Token generation
describe("generateJWT", () => {
  test("should create valid JWT with user payload", () => {
    const token = generateJWT({ userId: "123", role: "user" });
    expect(jwt.verify(token, JWT_SECRET)).toMatchObject({
      userId: "123",
      role: "user",
    });
  });
});
```

**When to Write**:

- Pure business logic functions
- Validators and parsers
- Utility functions
- Data transformations
- Algorithm implementations

#### Integration Tests (20-30% of all tests)

**Purpose**: Test interaction between multiple components, including database operations and API contracts.

**Characteristics**:

- Moderate execution time (100-500ms per test)
- Use test database (in-memory SQLite)
- Test component interactions
- Verify API contracts

**Examples**:

```typescript
// Database operations
describe("UserRepository", () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  test("should create user and retrieve by ID", async () => {
    const user = await userRepo.create({
      email: "test@example.com",
      name: "Test User",
    });

    const retrieved = await userRepo.findById(user.id);
    expect(retrieved).toMatchObject({
      email: "test@example.com",
      name: "Test User",
    });
  });
});

// API endpoint testing
describe("POST /api/auth/register", () => {
  test("should create user and return JWT", async () => {
    const response = await request(app).post("/api/auth/register").send({
      email: "newuser@example.com",
      password: "SecurePass123!",
      name: "New User",
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("token");
    expect(response.body.user.email).toBe("newuser@example.com");
  });
});
```

**When to Write**:

- Repository/database operations
- Service layer interactions
- API route handlers
- Authentication flows
- Middleware chains

#### E2E Tests (5-10% of all tests)

**Purpose**: Test complete user journeys and critical business flows from end to end.

**Characteristics**:

- Slow execution (1-10s per test)
- Use full application stack
- Minimal mocking (only external services)
- Test user scenarios

**Examples**:

```typescript
// Complete user registration flow
describe("User Registration Journey", () => {
  test("should register, verify email, and login", async () => {
    // Step 1: Register
    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send(newUserData);
    expect(registerResponse.status).toBe(201);

    // Step 2: Verify email (simulate clicking link)
    const verifyToken = await getVerificationToken(newUserData.email);
    const verifyResponse = await request(app).get(
      `/api/auth/verify/${verifyToken}`,
    );
    expect(verifyResponse.status).toBe(200);

    // Step 3: Login
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email: newUserData.email, password: newUserData.password });
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body).toHaveProperty("token");
  });
});

// Tournament creation to matchmaking flow
describe("Tournament Creation Journey", () => {
  test("should create tournament, register players, and match them", async () => {
    // Create tournament
    const tournament = await createTournament(authToken, tournamentData);

    // Register multiple players
    const player1 = await registerForTournament(tournament.id, player1Token);
    const player2 = await registerForTournament(tournament.id, player2Token);

    // Trigger matchmaking
    const matches = await startMatchmaking(tournament.id, adminToken);

    expect(matches).toHaveLength(1);
    expect(matches[0].players).toContain(player1.id);
    expect(matches[0].players).toContain(player2.id);
  });
});
```

**When to Write**:

- Critical user journeys
- Multi-step business processes
- Cross-feature workflows
- Security-critical paths

---

## Coverage Standards

### Overall Coverage Targets

| Metric         | Minimum | Target | Critical Paths |
| -------------- | ------- | ------ | -------------- |
| **Statements** | 80%     | 85%    | 90%            |
| **Branches**   | 75%     | 80%    | 85%            |
| **Functions**  | 80%     | 85%    | 90%            |
| **Lines**      | 80%     | 85%    | 90%            |

### Coverage by Code Category

| Category           | Target | Rationale                                   |
| ------------------ | ------ | ------------------------------------------- |
| **Authentication** | 95%    | Security-critical, zero tolerance for bugs  |
| **Authorization**  | 95%    | Security-critical, controls access          |
| **Data Access**    | 90%    | Data integrity, prevents corruption         |
| **Business Logic** | 85%    | Core features, high user impact             |
| **API Routes**     | 85%    | Contract verification, integration points   |
| **Services**       | 80%    | Feature implementation, reliability         |
| **Middleware**     | 80%    | Cross-cutting concerns, consistent behavior |
| **Utilities**      | 75%    | Helper functions, lower risk                |
| **Types/Schemas**  | 50%    | Type safety provides implicit coverage      |

### Critical Paths (90%+ Coverage Required)

1. **Authentication & Authorization**
   - User registration and email verification
   - Login (credentials + OAuth)
   - Password reset flow
   - Multi-factor authentication (MFA)
   - Session management
   - Token generation and validation

2. **Tournament Management**
   - Tournament creation and configuration
   - Player registration
   - Bracket generation
   - Match reporting
   - Winner determination

3. **Matchmaking System**
   - Algorithm implementation
   - Player pairing logic
   - Skill-based matching
   - Real-time updates

4. **Data Access Layer**
   - All repository operations
   - Database transactions
   - Query optimization
   - Data validation

5. **Payment Processing** (if applicable)
   - Transaction handling
   - Refund logic
   - Payment validation

---

## Testing Practices

### Test File Organization

```
project/
├── server/
│   ├── features/
│   │   ├── auth/
│   │   │   ├── auth.service.ts
│   │   │   └── auth.routes.ts
│   ├── services/
│   │   └── user.service.ts
│   └── tests/
│       ├── features/
│       │   ├── authentication.test.ts        # Integration tests
│       │   └── auth-credentials-oauth.test.ts
│       ├── services/
│       │   └── user.service.test.ts          # Unit tests
│       ├── utils/
│       │   └── validators.test.ts            # Unit tests
│       └── e2e/                              # E2E tests (to be created)
│           └── user-journey.test.ts
```

### Naming Conventions

| Test Type   | File Naming              | Example                               |
| ----------- | ------------------------ | ------------------------------------- |
| Unit        | `*.test.ts`              | `password-validator.test.ts`          |
| Integration | `*.integration.test.ts`  | `user-repository.integration.test.ts` |
| E2E         | `*.e2e.test.ts`          | `tournament-creation.e2e.test.ts`     |
| Feature     | `<feature-name>.test.ts` | `authentication.test.ts`              |

### Test Structure (AAA Pattern)

```typescript
describe("Feature/Component Name", () => {
  // Setup (runs before each test)
  beforeEach(() => {
    // Arrange: Set up test environment
  });

  // Cleanup (runs after each test)
  afterEach(() => {
    // Clean up: Reset state, close connections
  });

  describe("Specific Functionality", () => {
    test("should do expected behavior when condition", () => {
      // Arrange: Set up test data and dependencies
      const input = createTestInput();
      const expected = createExpectedOutput();

      // Act: Execute the code under test
      const result = functionUnderTest(input);

      // Assert: Verify the outcome
      expect(result).toEqual(expected);
    });

    test("should handle error case appropriately", () => {
      // Arrange
      const invalidInput = createInvalidInput();

      // Act & Assert
      expect(() => functionUnderTest(invalidInput)).toThrow(
        "Expected error message",
      );
    });
  });
});
```

### Test Data Management

**Use Test Factories for Reusable Data:**

```typescript
// server/tests/factories/user.factory.ts
export const createTestUser = (overrides = {}) => ({
  email: `test-${nanoid()}@example.com`,
  name: "Test User",
  password: "SecurePass123!",
  role: "user",
  ...overrides,
});

export const createTestTournament = (overrides = {}) => ({
  name: `Test Tournament ${nanoid()}`,
  game: "Magic: The Gathering",
  format: "Standard",
  maxPlayers: 32,
  startDate: new Date(Date.now() + 86400000), // Tomorrow
  ...overrides,
});

// Usage in tests
test("should create user with valid data", async () => {
  const userData = createTestUser({ role: "admin" });
  const user = await userService.create(userData);
  expect(user.role).toBe("admin");
});
```

### Database Testing Strategy

**Use In-Memory Database for Tests:**

```typescript
// server/tests/setup.ts
import { db } from "@shared/database-unified";

beforeAll(async () => {
  // Initialize in-memory test database
  await initializeTestDatabase();
});

beforeEach(async () => {
  // Reset database to clean state before each test
  await resetTestDatabase();
});

afterAll(async () => {
  // Clean up database connection
  await db.close();
});
```

### Mocking Guidelines

**When to Mock:**

- ✅ External API calls (Twitch, YouTube, SendGrid)
- ✅ File system operations
- ✅ Time-dependent functions (Date.now())
- ✅ Random number generation
- ✅ Third-party services

**When NOT to Mock:**

- ❌ Database in integration tests (use test DB)
- ❌ Internal application code (test real interactions)
- ❌ Simple utilities (test actual implementation)

```typescript
// Good mocking example
jest.mock("@sendgrid/mail");
import sgMail from "@sendgrid/mail";

test("should send verification email", async () => {
  const sendMock = jest.fn().mockResolvedValue([{ statusCode: 202 }]);
  (sgMail as any).send = sendMock;

  await emailService.sendVerification("user@example.com", "token123");

  expect(sendMock).toHaveBeenCalledWith(
    expect.objectContaining({
      to: "user@example.com",
      subject: expect.stringContaining("verification"),
    }),
  );
});
```

---

## CI/CD Integration

### Automated Testing Workflow

Tests run automatically on:

- Every push to any branch
- Every pull request
- Before merging to main
- On scheduled intervals (nightly)

### Test Execution Stages

```yaml
# .github/workflows/test.yml
1. Fast Feedback (runs first, ~2 min)
- Linting
- Type checking
- Unit tests

2. Integration Testing (~5 min)
- Integration tests with test database
- API contract tests

3. E2E Testing (~10 min)
- Critical user journeys
- Complete workflows

4. Coverage Report
- Generate coverage report
- Upload to coverage service
- Comment on PR with results
```

### Coverage Gates

**PR Requirements (enforced by CI):**

- ✅ All tests must pass
- ✅ Overall coverage must not decrease
- ✅ New code must have ≥80% coverage
- ✅ Critical paths must maintain ≥90% coverage
- ✅ No skipped tests without justification

**Fail Conditions:**

- ❌ Any test failure
- ❌ Coverage drops below 80%
- ❌ New files with <80% coverage
- ❌ Critical path coverage below 90%

---

## Tools & Infrastructure

### Current Stack

| Tool              | Purpose               | Version |
| ----------------- | --------------------- | ------- |
| **Jest**          | Test runner           | 30.1.3  |
| **ts-jest**       | TypeScript support    | 29.4.4  |
| **@jest/globals** | Test utilities        | 30.1.2  |
| **supertest**     | HTTP endpoint testing | Latest  |

### Configuration

```javascript
// jest.config.js
export default {
  preset: "ts-jest",
  testEnvironment: "node",

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Critical path thresholds
  coverageThresholds: {
    "./server/auth/**/*.ts": {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    "./server/repositories/**/*.ts": {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
};
```

---

## Best Practices

### DO ✅

1. **Write tests first** for critical features (TDD)
2. **Test behavior, not implementation** (avoid testing internal details)
3. **Use descriptive test names** that explain what is being tested
4. **Keep tests independent** (no shared state between tests)
5. **Use setup/teardown** for common initialization
6. **Mock external dependencies** to isolate tests
7. **Test edge cases** and error conditions
8. **Maintain test speed** (unit tests <100ms, integration <500ms)

### DON'T ❌

1. **Don't skip tests** without documented reason
2. **Don't test third-party libraries** (trust they work)
3. **Don't use production database** in tests
4. **Don't write flaky tests** (inconsistent pass/fail)
5. **Don't test multiple things** in one test
6. **Don't leave commented-out tests** (delete or fix)
7. **Don't ignore failing tests** (fix immediately)
8. **Don't sacrifice coverage** for speed (both matter)

---

## Maintenance & Evolution

### Regular Review Schedule

- **Weekly**: Review failing tests and flaky test reports
- **Monthly**: Analyze coverage trends and identify gaps
- **Quarterly**: Update testing strategy based on learnings
- **Annually**: Evaluate testing tools and infrastructure

### Metrics to Track

1. **Test Count**: Total number of tests (trending up)
2. **Coverage Percentage**: Overall and by category
3. **Test Execution Time**: Keep under 10 minutes total
4. **Flaky Test Rate**: Should be <1%
5. **Test-to-Code Ratio**: Aim for 1:1 or higher
6. **Bug Escape Rate**: Bugs found in production vs. tests

### Continuous Improvement

- Analyze production bugs and add regression tests
- Identify and fix flaky tests immediately
- Refactor slow tests to improve CI performance
- Update test patterns based on team feedback
- Add tests for every bug fix (prevent regression)

---

## Resources

### Documentation

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://testingjavascript.com/)
- [TESTING_ROADMAP.md](./TESTING_ROADMAP.md) - Implementation timeline

### Internal References

- [TESTING_AUDIT_PART1.md](./TESTING_AUDIT_PART1.md) - Current coverage analysis
- [Contributing Guidelines](./CONTRIBUTING.md) - PR requirements
- [Development Guide](./docs/development/DEVELOPMENT_GUIDE.md)

### Example Tests

- `server/tests/features/registration-login-integration.test.ts` - Integration pattern
- `server/tests/services/game.service.test.ts` - Unit test pattern
- `server/tests/features/events.integration.test.ts` - Feature testing

---

**Document Owner**: Development Team  
**Last Updated**: October 20, 2025  
**Next Review**: January 20, 2026
