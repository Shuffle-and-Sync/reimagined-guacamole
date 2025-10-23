# Error Handling Migration Guide

This guide demonstrates how to migrate from old error handling patterns to the new standardized error system.

## Overview

The new error standardization system provides:

- **Consistent error codes** across all APIs (AUTH_xxx, VAL_xxx, RES_xxx, etc.)
- **Production-safe messages** that don't leak implementation details
- **Structured error responses** with requestId, timestamp, and optional details
- **Backward compatibility** with existing error handlers

## Quick Start

### Import the Error Creators

```typescript
import { errors } from "../../lib/error-response";
// Or if using middleware:
import { standardizedErrorCreators as errors } from "../../middleware/error-handling.middleware";
```

### Basic Usage in Route Handlers

```typescript
// Before: Inconsistent error handling
router.get("/users/:id", async (req, res) => {
  try {
    const user = await userService.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

// After: Standardized error handling
router.get("/users/:id", async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      throw errors.invalidFormat("id", { value: req.params.id });
    }

    const user = await userService.findById(userId);

    if (!user) {
      throw errors.notFound("user", { userId });
    }

    res.json(user);
  } catch (error) {
    next(error); // Pass to error middleware
  }
});
```

## Common Error Scenarios

### Authentication Errors

```typescript
// Unauthorized access
throw errors.unauthorized();

// Invalid credentials
throw errors.invalidCredentials({ email: user.email });

// Token expired
throw errors.tokenExpired();

// Insufficient permissions
throw errors.forbidden({ requiredRole: "admin", userRole: "user" });
```

### Resource Errors

```typescript
// Resource not found
throw errors.notFound("event", { eventId: 123 });

// Resource already exists
throw errors.alreadyExists("email", { email: "user@example.com" });

// Conflict (e.g., editing an outdated resource)
throw errors.conflict({ message: "Resource has been modified" });
```

### Validation Errors

```typescript
// General validation error (automatically handled by Zod)
throw errors.validation({ fields: ["email", "password"] });

// Invalid email format
throw errors.invalidEmail({ email: "invalid" });

// Required field missing
throw errors.requiredField("username");

// Invalid format
throw errors.invalidFormat("phoneNumber", { value: "123" });
```

### Server Errors

```typescript
// Database error
try {
  await db.query(...);
} catch (dbError) {
  throw errors.databaseError({
    operation: 'insert',
    table: 'users'
  });
}

// External service error
try {
  await stripeAPI.charge(...);
} catch (err) {
  throw errors.externalServiceError('stripe', {
    message: err.message
  });
}

// Internal error (for unexpected errors)
throw errors.internal({
  message: 'Unexpected state'
});
```

### Rate Limiting

```typescript
if (requestCount > limit) {
  throw errors.rateLimitExceeded({
    limit,
    timeWindow: "15 minutes",
  });
}
```

## Error Response Format

All errors return a consistent JSON structure:

```json
{
  "error": {
    "code": "RES_001",
    "message": "The requested resource was not found",
    "requestId": "abc123xyz",
    "timestamp": "2025-01-23T16:00:00.000Z",
    "path": "/api/users/999",
    "details": {
      // Only in development
      "userId": 999,
      "resource": "user"
    }
  }
}
```

## Error Codes Reference

### Authentication (AUTH_xxx)

- `AUTH_001` - Unauthorized (401)
- `AUTH_002` - Invalid credentials (401)
- `AUTH_003` - Token expired (401)
- `AUTH_004` - Token invalid (401)
- `AUTH_005` - Session expired (401)
- `AUTH_006` - Insufficient permissions (403)
- `AUTH_007` - Device mismatch (401)

### Validation (VAL_xxx)

- `VAL_001` - Validation failed (400)
- `VAL_002` - Invalid email (400)
- `VAL_003` - Invalid password (400)
- `VAL_004` - Required field missing (400)
- `VAL_005` - Invalid format (400)
- `VAL_006` - Invalid length (400)
- `VAL_007` - Invalid range (400)

### Resources (RES_xxx)

- `RES_001` - Resource not found (404)
- `RES_002` - Resource already exists (409)
- `RES_003` - Resource conflict (409)
- `RES_004` - Resource locked (423)

### Rate Limiting (RATE_xxx)

- `RATE_001` - Rate limit exceeded (429)
- `RATE_002` - Too many requests (429)

### Server (SRV_xxx)

- `SRV_001` - Internal error (500)
- `SRV_002` - Service unavailable (503)
- `SRV_003` - Database error (500)
- `SRV_004` - External service error (503)
- `SRV_005` - Configuration error (500)

### Business Logic (BIZ_xxx)

- `BIZ_001` - Payment failed (402)
- `BIZ_002` - Insufficient balance (402)
- `BIZ_003` - Operation not allowed (403)
- `BIZ_004` - Quota exceeded (429)
- `BIZ_005` - Invalid state (400)

## Migration Strategy

1. **Keep existing error handling** - The system is backward compatible
2. **Migrate routes incrementally** - Start with new routes or high-priority endpoints
3. **Test thoroughly** - Verify error responses match expected format
4. **Update client code** - Adapt clients to use error codes instead of parsing messages

## Benefits

- ✅ **Consistent** - Same error format across all APIs
- ✅ **Secure** - Production-safe messages, no internal details leaked
- ✅ **Debuggable** - Request IDs for tracing, details in development
- ✅ **Type-safe** - TypeScript enums for error codes
- ✅ **Testable** - Easy to assert specific error codes in tests
- ✅ **Client-friendly** - Error codes enable proper i18n and custom messages

## Testing

```typescript
import { errors, ErrorCode } from "../../lib/error-response";

describe("User Routes", () => {
  it("should return RES_001 when user not found", async () => {
    const response = await request(app).get("/api/users/999").expect(404);

    expect(response.body.error.code).toBe(ErrorCode.RESOURCE_NOT_FOUND);
    expect(response.body.error.requestId).toBeDefined();
  });
});
```

## Client-Side Handling

```typescript
// TypeScript client
import { ErrorCode } from "./error-codes";

async function fetchUser(id: number) {
  try {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) {
      const error = await response.json();

      // Handle specific error codes
      switch (error.error.code) {
        case "RES_001":
          showMessage("User not found");
          break;
        case "AUTH_001":
          redirectToLogin();
          break;
        case "RATE_001":
          showMessage("Too many requests. Please wait.");
          break;
        default:
          showMessage("An error occurred. Please try again.");
      }

      // Log request ID for support
      console.error("Error", {
        requestId: error.error.requestId,
        code: error.error.code,
      });
    }
    return response.json();
  } catch (error) {
    showMessage("Network error");
  }
}
```

## Support

For questions or issues with error handling:

1. Check the error code in `server/lib/error-codes.ts`
2. Review the error creator in `server/lib/error-response.ts`
3. See tests in `server/tests/errors/error-standardization.test.ts`
