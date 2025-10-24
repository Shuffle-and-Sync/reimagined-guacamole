# API Standardization Guide

## Overview

This guide explains the standardized utilities and patterns available for building consistent, maintainable API endpoints in the Shuffle & Sync backend.

## Table of Contents

1. [Standard Response Format](#standard-response-format)
2. [Error Handling](#error-handling)
3. [Async Error Handling](#async-error-handling)
4. [Rate Limiting](#rate-limiting)
5. [Usage Examples](#usage-examples)

## Standard Response Format

All API responses follow the JSend specification for consistency.

### ApiResponse Utility

Location: `server/utils/ApiResponse.ts`

#### Success Response (2xx)

```typescript
import { ApiResponse } from "@/utils/ApiResponse";

// Simple success
return res.json(ApiResponse.success({ id: "123", name: "John" }));

// With message
return res
  .status(201)
  .json(
    ApiResponse.success(
      { id: "123" },
      "User created successfully",
    ),
  );

// Response format:
{
  "status": "success",
  "data": { "id": "123", "name": "John" },
  "message": "User created successfully",
  "meta": {
    "timestamp": "2025-01-24T20:00:00.000Z",
    "requestId": "req_1234567890_abc123xyz"
  }
}
```

#### Fail Response (4xx - Client Error)

```typescript
// Validation error
return res
  .status(400)
  .json(
    ApiResponse.fail("Validation failed", [
      { field: "email", message: "Invalid email format", code: "INVALID_EMAIL" },
      { field: "password", message: "Too short", code: "INVALID_LENGTH" },
    ]),
  );

// Response format:
{
  "status": "fail",
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email format", "code": "INVALID_EMAIL" },
    { "field": "password", "message": "Too short", "code": "INVALID_LENGTH" }
  ],
  "meta": {
    "timestamp": "2025-01-24T20:00:00.000Z",
    "requestId": "req_1234567890_abc123xyz"
  }
}
```

#### Error Response (5xx - Server Error)

```typescript
// Server error
return res
  .status(500)
  .json(ApiResponse.error("Database connection failed"));

// Response format:
{
  "status": "error",
  "message": "Database connection failed",
  "meta": {
    "timestamp": "2025-01-24T20:00:00.000Z",
    "requestId": "req_1234567890_abc123xyz"
  }
}
```

#### Paginated Response

```typescript
const users = await getUsersPaginated(page, limit);
const total = await getUserCount();

return res.json(
  ApiResponse.paginated(
    users,
    { page, limit, total },
    "Users retrieved successfully",
  ),
);

// Response format:
{
  "status": "success",
  "data": [{ "id": "1", "name": "User 1" }, { "id": "2", "name": "User 2" }],
  "message": "Users retrieved successfully",
  "meta": {
    "timestamp": "2025-01-24T20:00:00.000Z",
    "requestId": "req_1234567890_abc123xyz",
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

## Error Handling

### ApiError Utility

Location: `server/utils/ApiError.ts`

Provides convenience methods for creating standard HTTP errors.

#### Available Error Types

```typescript
import { ApiError } from "@/utils/ApiError";

// 400 Bad Request
throw ApiError.badRequest("Invalid input data");

// 401 Unauthorized
throw ApiError.unauthorized("Please login to continue");

// 403 Forbidden
throw ApiError.forbidden("You don't have permission");

// 404 Not Found
throw ApiError.notFound("User", "123"); // "User with id '123' not found"
throw ApiError.notFound("User"); // "User not found"

// 409 Conflict
throw ApiError.conflict("Email already exists");

// 422 Unprocessable Entity (Validation)
throw ApiError.validationError([
  { field: "email", message: "Invalid format" },
  { field: "age", message: "Must be positive" },
]);

// 429 Too Many Requests
throw ApiError.tooManyRequests();

// 500 Internal Server Error
throw ApiError.internal("Database connection failed");

// 503 Service Unavailable
throw ApiError.serviceUnavailable("Maintenance in progress");
```

## Async Error Handling

### catchAsync Utility

Location: `server/utils/catchAsync.ts`

Eliminates the need for try-catch blocks in route handlers.

#### Without catchAsync (Old Way)

```typescript
app.get("/api/users/:id", async (req, res, next) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) {
      throw ApiError.notFound("User", req.params.id);
    }
    res.json(ApiResponse.success(user));
  } catch (error) {
    next(error);
  }
});
```

#### With catchAsync (New Way)

```typescript
import { catchAsync } from "@/utils/catchAsync";

app.get(
  "/api/users/:id",
  catchAsync(async (req, res) => {
    const user = await getUserById(req.params.id);
    if (!user) {
      throw ApiError.notFound("User", req.params.id);
    }
    res.json(ApiResponse.success(user));
  }),
);
```

## Rate Limiting

### Configuration

Location: `server/config/rateLimits.ts`

Available rate limit categories:

- **public** - Unauthenticated endpoints (100 req/15min)
- **standard** - Authenticated GET endpoints (1000 req/15min)
- **strict** - Write operations (50 req/15min)
- **auth** - Login/register (5 req/15min)
- **expensive** - Search operations (10 req/1min)
- **email** - Email sending (10 req/1hour)
- **upload** - File uploads (20 req/1hour)
- **messaging** - Message sending (20 req/1min)
- **eventCreation** - Event creation (10 req/1hour)

### Usage

```typescript
import { rateLimiter } from "@/middleware/rateLimiter";

// Apply to routes
router.get("/", rateLimiter.public, getPublicData);
router.get("/profile", authenticate, rateLimiter.standard, getProfile);
router.post("/events", authenticate, rateLimiter.eventCreation, createEvent);
router.post("/login", rateLimiter.auth, login);
router.get("/search", rateLimiter.expensive, search);
```

### IP Whitelist

Configure via environment variable:

```bash
RATE_LIMIT_WHITELIST=192.168.1.1,10.0.0.1,172.16.0.1
```

## Usage Examples

### Complete Route Example

```typescript
import express from "express";
import { catchAsync } from "@/utils/catchAsync";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { rateLimiter } from "@/middleware/rateLimiter";
import { authenticate } from "@/middleware/auth";

const router = express.Router();

/**
 * Get all events
 */
router.get(
  "/",
  rateLimiter.standard,
  catchAsync(async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const events = await getEvents(page, limit);
    const total = await getEventCount();

    res.json(
      ApiResponse.paginated(
        events,
        { page, limit, total },
        "Events retrieved successfully",
      ),
    );
  }),
);

/**
 * Get event by ID
 */
router.get(
  "/:id",
  rateLimiter.standard,
  catchAsync(async (req, res) => {
    const event = await getEventById(req.params.id);

    if (!event) {
      throw ApiError.notFound("Event", req.params.id);
    }

    res.json(ApiResponse.success(event));
  }),
);

/**
 * Create event
 */
router.post(
  "/",
  authenticate,
  rateLimiter.eventCreation,
  catchAsync(async (req, res) => {
    // Validate input
    if (!req.body.title || !req.body.date) {
      throw ApiError.badRequest("Title and date are required");
    }

    const event = await createEvent({
      ...req.body,
      creatorId: req.user.id,
    });

    res
      .status(201)
      .json(ApiResponse.success(event, "Event created successfully"));
  }),
);

/**
 * Update event
 */
router.patch(
  "/:id",
  authenticate,
  rateLimiter.strict,
  catchAsync(async (req, res) => {
    const event = await getEventById(req.params.id);

    if (!event) {
      throw ApiError.notFound("Event", req.params.id);
    }

    // Check ownership
    if (event.creatorId !== req.user.id) {
      throw ApiError.forbidden("You don't own this event");
    }

    const updated = await updateEvent(req.params.id, req.body);

    res.json(ApiResponse.success(updated, "Event updated successfully"));
  }),
);

/**
 * Delete event
 */
router.delete(
  "/:id",
  authenticate,
  rateLimiter.strict,
  catchAsync(async (req, res) => {
    const event = await getEventById(req.params.id);

    if (!event) {
      throw ApiError.notFound("Event", req.params.id);
    }

    if (event.creatorId !== req.user.id) {
      throw ApiError.forbidden("You don't own this event");
    }

    await deleteEvent(req.params.id);

    res.json(ApiResponse.success(null, "Event deleted successfully"));
  }),
);

export default router;
```

### Migration from Old Patterns

#### Before (Old Pattern)

```typescript
app.get("/api/users", async (req, res) => {
  try {
    const users = await storage.getUsers();
    return res.json(users);
  } catch (error) {
    logger.error("Failed to fetch users", error);
    return res.status(500).json({ message: "Failed to fetch users" });
  }
});
```

#### After (New Pattern)

```typescript
app.get(
  "/api/users",
  rateLimiter.standard,
  catchAsync(async (req, res) => {
    const users = await storage.getUsers();
    res.json(ApiResponse.success(users, "Users retrieved successfully"));
  }),
);
```

## Benefits

1. **Consistency** - All endpoints return responses in the same format
2. **Type Safety** - Full TypeScript support with proper types
3. **Error Handling** - Automatic error catching and formatting
4. **Rate Limiting** - Built-in protection against abuse
5. **Logging** - Automatic request/error logging with request IDs
6. **Maintainability** - Less boilerplate, easier to understand

## Backward Compatibility

All new utilities are designed to work alongside existing patterns. You can migrate routes gradually without breaking existing functionality.

The global error handler supports both old and new error formats, ensuring seamless integration.
