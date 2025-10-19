# Express.js Patterns and Best Practices

This document outlines the improved Express.js patterns implemented in the Shuffle & Sync backend for consistent error handling and input validation.

## Error Handling Patterns

### Custom Error Classes

The application uses custom error classes that extend `AppError` for better error categorization:

```typescript
import { errors } from "./middleware/error-handling.middleware";

const {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
} = errors;

// Usage in routes
throw new ValidationError("Invalid input data", { field: "email" });
throw new NotFoundError("User not found");
throw new AuthorizationError("Admin access required");
```

### AsyncHandler Wrapper

Use the `asyncHandler` wrapper to automatically catch errors in async route handlers:

```typescript
import { errorHandlingMiddleware } from "./middleware/error-handling.middleware";
const { asyncHandler } = errorHandlingMiddleware;

// Before (manual try-catch)
app.get("/api/users/:id", async (req, res) => {
  try {
    const user = await storage.getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    logger.error("Failed to get user", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// After (with asyncHandler)
app.get(
  "/api/users/:id",
  validateParamsWithSchema(uuidParamSchema),
  asyncHandler(async (req, res) => {
    const user = await storage.getUser(req.params.id);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    res.json({
      success: true,
      data: user,
    });
  }),
);
```

### Centralized Error Handling

The application uses centralized error handling middleware that should be added at the end of route registration:

```typescript
// Add these at the end of your Express app setup
app.use(errorHandlingMiddleware.notFound);
app.use(errorHandlingMiddleware.global);
```

## Input Validation Patterns

### Request Body Validation

Use `validateRequest` middleware with Zod schemas:

```typescript
import { validateRequest } from "./validation";
import { z } from "zod";

const createUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  name: z.string().min(1, "Name is required").max(100),
  age: z.number().int().min(13, "Must be at least 13 years old"),
});

app.post(
  "/api/users",
  validateRequest(createUserSchema),
  asyncHandler(async (req, res) => {
    // req.body is now validated and typed
    const user = await storage.createUser(req.body);
    res.status(201).json({
      success: true,
      data: user,
    });
  }),
);
```

### Parameter Validation

Use `validateParamsWithSchema` for URL parameters:

```typescript
import {
  validateParamsWithSchema,
  uuidParamSchema,
  userParamSchema,
} from "./validation";

// Single parameter validation
app.get(
  "/api/users/:id",
  validateParamsWithSchema(uuidParamSchema),
  asyncHandler(async (req, res) => {
    // req.params.id is validated as UUID
    const user = await storage.getUser(req.params.id);
    res.json({ success: true, data: user });
  }),
);

// Custom parameter schema
const eventParamSchema = z.object({
  eventId: z.string().uuid("Invalid event ID"),
  userId: z.string().uuid("Invalid user ID"),
});

app.post(
  "/api/events/:eventId/join/:userId",
  validateParamsWithSchema(eventParamSchema),
  asyncHandler(async (req, res) => {
    const { eventId, userId } = req.params;
    // Both parameters are validated
  }),
);
```

### Query Parameter Validation

Use `validateQuery` for query string parameters:

```typescript
import {
  validateQuery,
  paginationQuerySchema,
  searchQuerySchema,
} from "./validation";

app.get(
  "/api/users",
  validateQuery(paginationQuerySchema),
  asyncHandler(async (req, res) => {
    const { page, limit, sortBy, sortOrder } = req.query;
    // Query parameters are validated and transformed
    const users = await storage.getUsers({ page, limit, sortBy, sortOrder });
    res.json({
      success: true,
      data: users,
      meta: { page, limit },
    });
  }),
);

app.get(
  "/api/search",
  validateQuery(searchQuerySchema),
  asyncHandler(async (req, res) => {
    const { q, page, limit } = req.query;
    const results = await storage.search(q, { page, limit });
    res.json({ success: true, data: results });
  }),
);
```

## Response Format Standards

### Success Responses

All successful responses should follow this format:

```typescript
// Simple success
res.json({
  success: true,
  data: result,
});

// With metadata (pagination, etc.)
res.json({
  success: true,
  data: results,
  meta: {
    page: 1,
    limit: 20,
    total: 100,
    totalPages: 5,
  },
});

// With message
res.status(201).json({
  success: true,
  data: createdResource,
  message: "Resource created successfully",
});
```

### Error Responses

Error responses are handled automatically by the error handling middleware:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "statusCode": 400,
    "requestId": "req_123456",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "details": {
      "validationErrors": [
        {
          "field": "email",
          "message": "Invalid email format"
        }
      ]
    }
  }
}
```

## Common Validation Schemas

Pre-defined schemas for common use cases:

```typescript
import {
  uuidParamSchema, // { id: uuid }
  eventParamSchema, // { eventId: uuid }
  userParamSchema, // { userId: uuid }
  communityParamSchema, // { communityId: uuid }
  paginationQuerySchema, // { page?, limit?, sortBy?, sortOrder? }
  searchQuerySchema, // { q, ...pagination }
} from "./validation";
```

## Migration Guide

### Before (Old Pattern)

```typescript
app.get("/api/resource/:id", async (req, res) => {
  try {
    if (!validateUUID(req.params.id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const resource = await storage.getResource(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    res.json(resource);
  } catch (error) {
    logger.error("Failed to get resource", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
```

### After (New Pattern)

```typescript
app.get(
  "/api/resource/:id",
  validateParamsWithSchema(uuidParamSchema),
  asyncHandler(async (req, res) => {
    const resource = await storage.getResource(req.params.id);
    if (!resource) {
      throw new NotFoundError("Resource not found");
    }

    res.json({
      success: true,
      data: resource,
    });
  }),
);
```

## Benefits

1. **Consistency**: All routes follow the same patterns
2. **Maintainability**: Centralized error handling and validation
3. **Type Safety**: Zod schemas provide runtime and compile-time validation
4. **Better Error Messages**: Structured error responses with proper status codes
5. **Reduced Boilerplate**: Less repetitive try-catch blocks
6. **Request Tracing**: Automatic request ID generation for debugging
7. **Standardized Responses**: Consistent API response format

## Testing

The patterns include comprehensive error handling and logging. Test coverage should include:

- Valid input scenarios
- Invalid input validation
- Error condition handling
- Response format consistency
- HTTP status code correctness
