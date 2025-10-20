# Test Utilities Setup

This directory contains reusable test utilities, mocks, and fixtures for the Shuffle & Sync test suite.

## Directory Structure

```
test-utilities-setup/
├── README.md                 # This file
├── factories.ts              # Test data factories
├── mocks.ts                  # Mock implementations
├── fixtures.ts               # Static test data
├── database-helpers.ts       # Database test utilities
├── api-helpers.ts            # API test utilities
├── auth-helpers.ts           # Authentication test utilities
└── assertions.ts             # Custom assertions
```

## Usage

### Import in Test Files

```typescript
import {
  createTestUser,
  createTestTournament,
  mockDatabase,
  setupTestDatabase,
} from "../test-utilities-setup";
```

### Using Factories

Factories create test data with sensible defaults:

```typescript
import { createTestUser } from "../test-utilities-setup/factories";

test("should create user", () => {
  const user = createTestUser({ email: "custom@example.com" });
  expect(user.email).toBe("custom@example.com");
  expect(user.status).toBe("active"); // Default value
});
```

### Using Mocks

Mocks provide pre-configured mock implementations:

```typescript
import { mockEmailService } from "../test-utilities-setup/mocks";

test("should send email", async () => {
  const emailService = mockEmailService();
  await emailService.send({ to: "test@example.com" });
  expect(emailService.send).toHaveBeenCalled();
});
```

### Using Fixtures

Fixtures provide static test data:

```typescript
import { userFixtures } from "../test-utilities-setup/fixtures";

test("should authenticate admin", () => {
  const admin = userFixtures.adminUser;
  expect(admin.role).toBe("admin");
});
```

## Best Practices

1. **Reuse Utilities**: Don't recreate common test setup in every test
2. **Keep It Simple**: Utilities should be easy to understand and use
3. **Document Behavior**: Add JSDoc comments for complex utilities
4. **Avoid Over-Engineering**: Don't create utilities you don't need yet
5. **Update Regularly**: Keep utilities in sync with application code

## Adding New Utilities

When adding new test utilities:

1. Choose the appropriate file (factories, mocks, fixtures, etc.)
2. Add comprehensive JSDoc documentation
3. Export from the file
4. Add examples to this README
5. Update relevant test files to use the new utility

## File Descriptions

### factories.ts

Contains factory functions for creating test data objects. Use factories when you need:

- Custom test data with overrides
- Multiple variations of the same entity
- Complex object creation

### mocks.ts

Contains mock implementations of services, repositories, and external APIs. Use mocks when you need:

- To isolate the system under test
- To simulate external dependencies
- To control behavior in tests

### fixtures.ts

Contains static test data that rarely changes. Use fixtures when you need:

- Consistent test data across tests
- Reference data (e.g., game types, card rarities)
- Simple test scenarios

### database-helpers.ts

Contains utilities for database testing. Includes:

- Database setup and teardown
- Seed data helpers
- Transaction management
- Query helpers

### api-helpers.ts

Contains utilities for API testing. Includes:

- Request/response builders
- Authentication helpers
- Common API call wrappers
- Response validators

### auth-helpers.ts

Contains utilities for authentication testing. Includes:

- Login helpers
- Session creation
- Token generation
- Permission helpers

### assertions.ts

Contains custom Jest matchers and assertion helpers. Includes:

- Database assertions
- API response assertions
- Custom matchers
- Helper assertion functions

---

**Last Updated**: October 20, 2025  
**Maintainer**: Shuffle & Sync Development Team
