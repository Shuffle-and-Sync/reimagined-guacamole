# Error State Tests

Comprehensive error handling tests for Shuffle & Sync platform.

## Overview

This directory contains extensive tests for all error scenarios across the application, ensuring robust error handling, consistent error responses, and helpful error messages for users.

## Organization

```
errors/
├── validation/          # Input validation errors (Zod schemas)
├── database/            # Database operation errors
├── authentication/      # Auth failure scenarios
├── authorization/       # Permission denial errors
├── external-services/   # Third-party API errors
└── integration/         # End-to-end error flows
```

## Test Coverage

### Validation Errors (`validation/`)

- **zod-validation.test.ts**: Comprehensive Zod schema validation tests
  - Email, username, password validation
  - Tournament and event validation
  - Date range validation
  - Message content validation
  - Nested object and array validation
  - Multiple simultaneous field errors
  - Custom validation rules

**Coverage:** 50+ test cases

### Database Errors (`database/`)

- **connection-errors.test.ts**: Connection and timeout handling
  - Connection refused (ECONNREFUSED)
  - Connection timeout (ETIMEDOUT)
  - Database unavailable
  - Authentication failures
  - Connection pool exhaustion
  - Query timeouts

- **constraint-errors.test.ts**: Integrity constraint violations
  - Unique constraint violations (email, username)
  - Foreign key constraint failures
  - NOT NULL constraint violations
  - Check constraint failures
  - Cascade deletion errors
  - Transaction rollbacks

**Coverage:** 60+ test cases

### Authentication Errors (`authentication/`)

- **session-auth-errors.test.ts**: Session-based authentication failures
  - Missing session cookie
  - Expired sessions
  - Invalid session signatures
  - Deleted/suspended user sessions
  - Concurrent session limits
  - Session hijacking detection
  - IP address mismatch
  - User-agent changes
  - Session revocation

**Coverage:** 40+ test cases

### Authorization Errors (`authorization/`)

- **rbac-errors.test.ts**: Role-based access control failures
  - Insufficient role level
  - Admin-only endpoint access
  - Moderator permission checks
  - Role hierarchy enforcement
  - Role assignment validation
  - Custom permission checks
  - Feature access control
  - Resource-specific permissions
  - API key permissions

**Coverage:** 35+ test cases

### External Service Errors (`external-services/`)

- **external-api-errors.test.ts**: Third-party API integration errors
  - Network connection failures
  - Request timeouts
  - Rate limiting (429 errors)
  - Authentication failures (401)
  - Server errors (500, 503)
  - Twitch API specific errors
  - YouTube API specific errors
  - Facebook API specific errors
  - Circuit breaker activation

**Coverage:** 35+ test cases

### Integration Tests (`integration/`)

- **e2e-error-scenarios.test.ts**: Complete error flow testing
  - Registration failure flows
  - Login with invalid credentials
  - Unauthorized resource access
  - Tournament creation errors
  - Message sending errors
  - Multi-step form validation
  - Error context preservation
  - Status code consistency

**Coverage:** 30+ test cases

## Running Tests

### All Error Tests

```bash
npm run test:errors
```

### By Category

```bash
# Validation errors
npm run test:errors:validation

# Database errors
npm run test:errors:database

# Authentication errors
npm run test:errors:auth

# Authorization errors
npm run test:errors:permissions

# External service errors
npm run test:errors:external

# Integration tests
npm run test:errors:integration
```

### With Coverage

```bash
npm run test:errors:coverage
```

### Watch Mode

```bash
npm run test:errors:watch
```

## Writing New Error Tests

### Pattern

```typescript
import { describe, test, expect, beforeEach } from "@jest/globals";
import { Request, Response, NextFunction } from "express";
import {
  createMockErrorResponse,
  verifyErrorResponse,
  errorFactories,
  errorAssertions,
} from "../../helpers/error-test-utils";
import { globalErrorHandler } from "../../../middleware/error-handling.middleware";

describe("Feature Error Handling", () => {
  let mockReq: Partial<Request>;
  let mockRes: any;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      url: "/api/test",
      method: "POST",
      body: {},
      query: {},
      params: {},
      get: jest.fn(),
      ip: "127.0.0.1",
    };
    mockRes = createMockErrorResponse();
    mockNext = jest.fn();
  });

  test("should return appropriate error for invalid input", () => {
    const error = errorFactories.validation("Invalid input");

    globalErrorHandler(
      error,
      mockReq as Request,
      mockRes as Response,
      mockNext,
    );

    const errorResponse = verifyErrorResponse(mockRes, 400, "VALIDATION_ERROR");
    errorAssertions.expectValidationError(errorResponse);
  });
});
```

### Best Practices

1. **Use Error Test Utilities**: Import from `helpers/error-test-utils` for consistency
2. **Test Both Condition AND Response**: Verify the error is triggered AND the response is correct
3. **Verify Error Messages**: Ensure messages are helpful and user-friendly
4. **Check No Data Leakage**: Verify sensitive data is not exposed in error responses
5. **Use Proper Status Codes**: Each error type should return the correct HTTP status
6. **Test Error Context**: Verify error context is preserved when needed
7. **Mock External Dependencies**: Keep tests fast and isolated

## Error Test Utilities

Located in `helpers/error-test-utils.ts`, provides:

### Mock Response Creation

```typescript
const mockRes = createMockErrorResponse();
```

### Error Response Verification

```typescript
const error = verifyErrorResponse(mockRes, 400, "VALIDATION_ERROR");
```

### Error Factories

```typescript
errorFactories.validation("message");
errorFactories.authentication("message");
errorFactories.authorization("message");
errorFactories.notFound("Resource");
errorFactories.conflict("message");
errorFactories.database("message");
errorFactories.rateLimit();
errorFactories.externalService("ServiceName", "message");
```

### Database Error Simulators

```typescript
databaseErrorSimulators.connectionError();
databaseErrorSimulators.timeoutError();
databaseErrorSimulators.constraintViolation("constraint_name");
databaseErrorSimulators.foreignKeyViolation();
databaseErrorSimulators.notNullViolation("column_name");
```

### Zod Error Creation

```typescript
const zodError = createZodError([
  { path: ["field"], message: "Error message" },
]);
```

### External API Error Simulators

```typescript
externalAPIErrorSimulators.networkError();
externalAPIErrorSimulators.timeout();
externalAPIErrorSimulators.rateLimitExceeded();
externalAPIErrorSimulators.unauthorized();
externalAPIErrorSimulators.serverError();
```

### Error Assertions

```typescript
errorAssertions.expectValidationError(error, "fieldName");
errorAssertions.expectAuthenticationError(error);
errorAssertions.expectAuthorizationError(error);
errorAssertions.expectNotFoundError(error);
errorAssertions.expectDatabaseError(error);
```

## Error Response Format

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "User-friendly error message",
    "statusCode": 400,
    "requestId": "unique-request-id",
    "timestamp": "2025-01-20T12:00:00.000Z",
    "details": {
      // Optional: included only in development or for validation errors
    }
  }
}
```

## Error Codes and Status Codes

| Error Type       | Error Code             | HTTP Status |
| ---------------- | ---------------------- | ----------- |
| Validation       | VALIDATION_ERROR       | 400         |
| Authentication   | AUTHENTICATION_ERROR   | 401         |
| Authorization    | AUTHORIZATION_ERROR    | 403         |
| Not Found        | NOT_FOUND_ERROR        | 404         |
| Conflict         | CONFLICT_ERROR         | 409         |
| Rate Limit       | RATE_LIMIT_ERROR       | 429         |
| Database         | DATABASE_ERROR         | 500         |
| External Service | EXTERNAL_SERVICE_ERROR | 503         |

## Quality Standards

Every error test must:

1. ✅ Verify correct HTTP status code
2. ✅ Check error response format consistency
3. ✅ Validate error code matches scenario
4. ✅ Ensure error message is user-friendly
5. ✅ Verify no sensitive data leaked
6. ✅ Test error recovery where applicable

## Coverage Goals

- **Overall Error Handling:** 90%+ coverage
- **Validation Errors:** 95%+ coverage
- **Authentication/Authorization:** 95%+ coverage
- **Database Errors:** 90%+ coverage
- **External Service Errors:** 85%+ coverage

## Testing Principles

- **Comprehensive:** Cover all error paths
- **Consistent:** Use same patterns across tests
- **Clear:** Test names explain what's being tested
- **Isolated:** No test dependencies
- **Fast:** Mock external calls
- **Reliable:** No flaky tests

## Common Patterns

### Testing Validation Errors

```typescript
const zodError = createZodError([
  { path: ["email"], message: "Invalid email" },
]);

globalErrorHandler(zodError, mockReq as Request, mockRes as Response, mockNext);

const error = verifyErrorResponse(mockRes, 400, "VALIDATION_ERROR");
errorAssertions.expectValidationError(error, "email");
```

### Testing Authentication Errors

```typescript
const authError = errorFactories.authentication("Session expired");

globalErrorHandler(
  authError,
  mockReq as Request,
  mockRes as Response,
  mockNext,
);

const error = verifyErrorResponse(mockRes, 401, "AUTHENTICATION_ERROR");
errorAssertions.expectAuthenticationError(error);
```

### Testing Database Errors

```typescript
const dbError = errorFactories.database("Connection failed");

globalErrorHandler(dbError, mockReq as Request, mockRes as Response, mockNext);

const error = verifyErrorResponse(mockRes, 500, "DATABASE_ERROR");
errorAssertions.expectDatabaseError(error);
```

## Maintenance

- **Keep tests updated** with new error scenarios
- **Update utilities** when error handling patterns change
- **Document new error types** in this README
- **Review test coverage** regularly
- **Refactor** when patterns emerge

## Resources

- **Error Handling Middleware**: `server/middleware/error-handling.middleware.ts`
- **Error Test Utilities**: `server/tests/helpers/error-test-utils.ts`
- **Jest Configuration**: `jest.config.js`
- **Testing Strategy**: `TESTING_STRATEGY.md` (root directory)

## Contributing

When adding new error tests:

1. Place them in the appropriate category directory
2. Follow existing naming conventions
3. Use error test utilities for consistency
4. Update this README with new test descriptions
5. Ensure tests are well-documented
6. Run `npm run test:errors:coverage` to verify coverage

---

**Last Updated:** January 2025  
**Total Test Cases:** 250+  
**Test Coverage:** 90%+  
**Maintainer:** Shuffle & Sync Development Team
