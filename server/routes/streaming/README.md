# Collaborative Streaming Routes Module

This module contains all HTTP routes related to collaborative streaming features in Shuffle & Sync.

## Structure

```
streaming/
├── index.ts              # Main router - aggregates all sub-routers
├── events.ts             # Stream event CRUD operations
├── collaborators.ts      # Collaborator management
├── coordination.ts       # Coordination session handling
└── suggestions.ts        # Collaboration suggestions
```

## Routes

All routes are prefixed with `/api/collaborative-streams`

### Stream Events (`events.ts`)

Manages collaborative streaming events.

- `POST /` - Create a new collaborative stream event
- `GET /` - Get user's collaborative stream events
- `GET /:eventId` - Get specific stream event details
- `PATCH /:eventId` - Update stream event (creator only)
- `DELETE /:eventId` - Delete stream event (creator only)

### Collaborators (`collaborators.ts`)

Manages collaborators for streaming events.

- `POST /:eventId/collaborators` - Add a collaborator to an event
- `GET /:eventId/collaborators` - List all collaborators for an event
- `PATCH /:eventId/collaborators/:collaboratorId` - Update collaborator status
- `DELETE /:eventId/collaborators/:collaboratorId` - Remove a collaborator

### Coordination Sessions (`coordination.ts`)

Handles real-time coordination sessions for streaming events.

- `POST /:eventId/coordination/start` - Start a coordination session
- `PATCH /:eventId/coordination/phase` - Update coordination phase
- `GET /:eventId/coordination/status` - Get current coordination status

### Suggestions (`suggestions.ts`)

Provides AI-powered collaboration suggestions.

- `GET /:eventId/suggestions` - Get collaboration suggestions for an event

## Authentication

All routes require authentication via the `isAuthenticated` middleware.

## Rate Limiting

Event creation is rate-limited using `eventCreationRateLimit` middleware.

## Validation

- Request bodies are validated using Zod schemas from `@shared/schema`
- Route parameters are validated using `validateParams` and `validateUUID`

## Services

This module uses the following services:

- **CollaborativeStreamingService**: Core business logic for streaming coordination
- **storage**: Database operations for streaming data

## Real-Time Features

While this module handles HTTP routes, real-time features (WebSocket connections, event broadcasting) are handled by:

- **EnhancedWebSocketServer**: WebSocket connection management
- **CollaborativeStreamingService**: Active session state management

## Error Handling

All routes include proper error handling with:

- HTTP status codes (200, 201, 400, 403, 404, 500)
- Descriptive error messages
- Logging via the application logger

## Usage Example

```typescript
// Import in server/routes.ts
import streamingRouter from "./routes/streaming";

// Mount the router
app.use("/api/collaborative-streams", streamingRouter);
```

## Adding New Routes

To add new streaming-related routes:

1. Create a new file in this directory (e.g., `analytics.ts`)
2. Follow the existing pattern for route definition
3. Export the router as default
4. Import and mount in `index.ts`

```typescript
// streaming/analytics.ts
import { Router } from "express";
const router = Router();

router.get("/:eventId/analytics", async (req, res) => {
  // Implementation
});

export default router;
```

```typescript
// streaming/index.ts
import analyticsRouter from "./analytics";
router.use("/", analyticsRouter);
```

## Testing

Routes can be tested using:

```bash
# Run all tests
npm test

# Test specific features
npm run test:features
```

## Documentation

For detailed information about the extraction process and architecture, see:

- [Streaming Routes Extraction Guide](../../../docs/STREAMING_ROUTES_EXTRACTION.md)
