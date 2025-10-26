# Quick Start: Writing Tests

A practical guide to get started writing tests immediately for the Shuffle & Sync codebase.

---

## Your First Test in 5 Minutes

### Step 1: Choose What to Test

Pick from the **highest priority untested files** (see [TESTING_COVERAGE_QUALITY_REVIEW.md](../TESTING_COVERAGE_QUALITY_REVIEW.md#11-critical-gaps-24-files-0-coverage)):

**Start here** (easiest high-impact tests):

1. `server/auth/password.ts` - Pure functions, easy to test
2. `server/utils/security.utils.ts` - Utility functions
3. `server/shared/utils.ts` - Helper functions

**After basics** (more complex): 4. `server/repositories/user.repository.ts` - Database integration 5. `server/features/users/users.service.ts` - Business logic 6. `server/auth/session-security.ts` - Complex auth logic

### Step 2: Create Test File

```bash
# Backend test (use Jest)
# Location: server/tests/ or next to source file

# Create test file
touch server/auth/password.test.ts
```

### Step 3: Copy Template

```typescript
// server/auth/password.test.ts

import { describe, it, expect, beforeEach } from "@jest/globals";
import { hashPassword, verifyPassword } from "./password";

describe("Password Security", () => {
  describe("hashPassword", () => {
    it("should hash password securely", async () => {
      // Arrange
      const password = "SecurePassword123!";

      // Act
      const hashed = await hashPassword(password);

      // Assert
      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
      expect(hashed.length).toBeGreaterThan(50);
    });

    it("should generate different hashes for same password", async () => {
      // Arrange
      const password = "SecurePassword123!";

      // Act
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      // Assert
      expect(hash1).not.toBe(hash2); // Salt should differ
    });
  });

  describe("verifyPassword", () => {
    it("should verify correct password", async () => {
      // Arrange
      const password = "SecurePassword123!";
      const hashed = await hashPassword(password);

      // Act
      const isValid = await verifyPassword(password, hashed);

      // Assert
      expect(isValid).toBe(true);
    });

    it("should reject incorrect password", async () => {
      // Arrange
      const password = "SecurePassword123!";
      const hashed = await hashPassword(password);

      // Act
      const isValid = await verifyPassword("WrongPassword123!", hashed);

      // Assert
      expect(isValid).toBe(false);
    });
  });
});
```

### Step 4: Run Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test password.test.ts

# Run in watch mode (auto-rerun on changes)
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Step 5: Check Coverage

```bash
# Open coverage report
open coverage/index.html

# Or check in terminal
npm run test:coverage | grep password
```

---

## Common Testing Patterns

### Pattern 1: Testing Pure Functions (Easiest)

```typescript
// utils/formatters.ts
export function formatUsername(name: string): string {
  return name.trim().toLowerCase();
}

// utils/formatters.test.ts
import { formatUsername } from "./formatters";

describe("formatUsername", () => {
  it("should trim and lowercase username", () => {
    expect(formatUsername("  JohnDoe  ")).toBe("johndoe");
  });

  it("should handle empty string", () => {
    expect(formatUsername("")).toBe("");
  });

  it("should handle special characters", () => {
    expect(formatUsername("John@Doe123")).toBe("john@doe123");
  });
});
```

### Pattern 2: Testing with Mocks (Intermediate)

```typescript
// services/user.service.ts
export class UserService {
  constructor(private db: Database) {}

  async findById(id: string) {
    return this.db.users.findOne({ id });
  }
}

// services/user.service.test.ts
import { UserService } from "./user.service";

describe("UserService", () => {
  let service: UserService;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      users: {
        findOne: jest.fn(),
      },
    };
    service = new UserService(mockDb);
  });

  it("should find user by id", async () => {
    // Arrange
    const mockUser = { id: "1", name: "John" };
    mockDb.users.findOne.mockResolvedValue(mockUser);

    // Act
    const user = await service.findById("1");

    // Assert
    expect(user).toEqual(mockUser);
    expect(mockDb.users.findOne).toHaveBeenCalledWith({ id: "1" });
  });
});
```

### Pattern 3: Integration Tests (Advanced)

```typescript
// repositories/user.repository.test.ts
import { testDb } from "@/tests/helpers/test-database";
import { UserRepository } from "./user.repository";

describe("UserRepository Integration", () => {
  let repository: UserRepository;

  beforeAll(async () => {
    await testDb.connect();
    repository = new UserRepository(testDb.db);
  });

  afterAll(async () => {
    await testDb.disconnect();
  });

  beforeEach(async () => {
    await testDb.clean(); // Clear database
  });

  it("should create and retrieve user", async () => {
    // Arrange
    const userData = {
      email: "test@example.com",
      username: "testuser",
    };

    // Act
    const created = await repository.create(userData);
    const retrieved = await repository.findById(created.id);

    // Assert
    expect(retrieved).toMatchObject(userData);
  });
});
```

---

## Frontend Testing Quick Start

### Step 1: Create Component Test

```bash
# Create test file next to component
touch client/src/components/Button.test.tsx
```

### Step 2: Basic Component Test

```typescript
// client/src/components/Button.test.tsx

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('should render button text', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    // Arrange
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={onClick}>Click Me</Button>);

    // Act
    await user.click(screen.getByRole('button'));

    // Assert
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Click Me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### Step 3: Run Frontend Tests

```bash
# Run all frontend tests
npm run test:frontend

# Run in watch mode
npm run test:frontend:watch

# With UI (recommended)
npm run test:frontend:ui
```

---

## Troubleshooting

### Problem: "Module not found"

**Solution**: Check import paths and aliases

```typescript
// ✅ GOOD - Use path aliases
import { db } from "@shared/database-unified";
import { Button } from "@/components/ui/button";

// ❌ BAD - Relative paths
import { db } from "../../../shared/database-unified";
```

### Problem: "Tests timing out"

**Solution**: Increase timeout or make async tests properly

```typescript
// Set timeout for specific test
it("should handle slow operation", async () => {
  // test code
}, 10000); // 10 second timeout

// Or globally in jest.config.js
testTimeout: 10000;
```

### Problem: "Database errors in tests"

**Solution**: Use test database and clean between tests

```typescript
beforeEach(async () => {
  await testDb.clean();
});

// Or use transactions
beforeEach(async () => {
  await db.raw("BEGIN");
});

afterEach(async () => {
  await db.raw("ROLLBACK");
});
```

### Problem: "Mocks not working"

**Solution**: Clear mocks between tests

```typescript
afterEach(() => {
  jest.clearAllMocks();
  // or
  vi.clearAllMocks();
});
```

### Problem: "Coverage not counting my test"

**Solution**: Check file paths in jest.config.js

```javascript
// jest.config.js
collectCoverageFrom: [
  'server/**/*.{ts,js}',
  'shared/**/*.{ts,js}',
  '!server/**/*.test.{ts,js}', // Exclude test files
  '!server/**/*.d.ts',          // Exclude type definitions
],
```

---

## Test-Driven Development (TDD) Flow

### Red-Green-Refactor Cycle

1. **Red**: Write a failing test first
2. **Green**: Write minimal code to pass test
3. **Refactor**: Clean up code while keeping tests passing

### Example TDD Session

```typescript
// 1. RED - Write failing test
describe("calculateDiscount", () => {
  it("should apply 10% discount for regular users", () => {
    expect(calculateDiscount(100, "regular")).toBe(90);
  });
});

// Run test - it fails (function doesn't exist)

// 2. GREEN - Write minimal code
export function calculateDiscount(price: number, userType: string): number {
  if (userType === "regular") {
    return price * 0.9;
  }
  return price;
}

// Run test - it passes!

// 3. REFACTOR - Add more tests and improve
describe("calculateDiscount", () => {
  it("should apply 10% discount for regular users", () => {
    expect(calculateDiscount(100, "regular")).toBe(90);
  });

  it("should apply 20% discount for premium users", () => {
    expect(calculateDiscount(100, "premium")).toBe(80);
  });

  it("should apply no discount for unknown types", () => {
    expect(calculateDiscount(100, "unknown")).toBe(100);
  });
});

// Refactor implementation
const DISCOUNTS = {
  regular: 0.1,
  premium: 0.2,
};

export function calculateDiscount(price: number, userType: string): number {
  const discount = DISCOUNTS[userType as keyof typeof DISCOUNTS] || 0;
  return price * (1 - discount);
}
```

---

## Best Practices Checklist

### Before Writing Tests

- [ ] Read existing tests in same directory for patterns
- [ ] Understand what the code does (read source first)
- [ ] Identify happy path, error cases, and edge cases
- [ ] Check if test utilities/factories exist

### While Writing Tests

- [ ] Use descriptive test names ("should do X when Y")
- [ ] Follow AAA pattern (Arrange, Act, Assert)
- [ ] One assertion per test (usually)
- [ ] Test behavior, not implementation
- [ ] Clean up after tests (mocks, database)

### After Writing Tests

- [ ] Run tests and verify they pass
- [ ] Check coverage increased
- [ ] Verify tests fail when they should
- [ ] Code review for test quality
- [ ] Document complex test scenarios

---

## Testing Checklist for PR

Before submitting a PR, verify:

```bash
# 1. All tests pass
npm test

# 2. No linting errors
npm run lint

# 3. Type checking passes
npm run check

# 4. Coverage didn't decrease
npm run test:coverage

# 5. New code is tested
# Verify coverage of files you changed
```

### Coverage Requirements

- **New code**: 80% coverage minimum
- **Changed code**: Don't decrease existing coverage
- **Critical paths**: 90%+ coverage (auth, payments, data access)

---

## Getting Help

### Resources

1. **Documentation**
   - [Full Coverage Report](../TESTING_COVERAGE_QUALITY_REVIEW.md)
   - [Test Templates](TEST_TEMPLATES.md)
   - [Jest Docs](https://jestjs.io/)
   - [Testing Library](https://testing-library.com/)
   - [Vitest Docs](https://vitest.dev/)

2. **Examples in Codebase**
   - `server/tests/features/` - Integration tests
   - `server/tests/utils/` - Unit tests
   - `client/src/pages/*.test.tsx` - Component tests

3. **Ask for Help**
   - Check existing tests first
   - Ask in team chat
   - Reference this guide in questions

---

## Quick Commands Reference

```bash
# Backend (Jest)
npm test                          # Run all backend tests
npm run test:watch               # Watch mode
npm run test:coverage            # With coverage
npm test path/to/file.test.ts   # Specific file

# Frontend (Vitest)
npm run test:frontend            # Run all frontend tests
npm run test:frontend:watch      # Watch mode
npm run test:frontend:ui         # Interactive UI
npm run test:frontend:coverage   # With coverage

# Quality Checks
npm run lint                     # Lint code
npm run check                    # Type check
npm run format                   # Format code

# Coverage
npm run test:coverage            # Generate report
open coverage/index.html         # View in browser
```

---

## Next Steps

1. **Start Simple**
   - Pick one utility function
   - Write 3-5 tests for it
   - Get comfortable with the flow

2. **Progress Gradually**
   - Move to services (with mocks)
   - Then repositories (with database)
   - Finally integration tests

3. **Follow the Plan**
   - Review [prioritized test writing plan](../TESTING_COVERAGE_QUALITY_REVIEW.md#6-prioritized-test-writing-plan)
   - Start with Phase 1 (Critical Security)
   - Contribute to coverage goals

4. **Share Knowledge**
   - Document patterns you discover
   - Help teammates with testing
   - Improve test utilities

---

## Success Metrics

Track your progress:

- [ ] First test written and passing
- [ ] 5 tests written this week
- [ ] Coverage increased on file you're working on
- [ ] Integration test written
- [ ] Component test written
- [ ] Helped teammate with testing
- [ ] Contributed to 70%+ coverage goal

**Remember**: Every test counts! Even small tests improve code quality and team confidence.

---

**Questions?** Check the [comprehensive review](../TESTING_COVERAGE_QUALITY_REVIEW.md) or ask the team!
