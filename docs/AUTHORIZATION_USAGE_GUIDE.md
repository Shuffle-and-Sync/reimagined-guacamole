# Authorization & Security Guard - Usage Guide

## Overview

The Authorization & Security Guard provides comprehensive security controls for game sessions and actions. It implements authorization checks, input validation, and sanitization to prevent unauthorized access and malicious input.

## Key Components

### 1. Authorization Functions

#### `authorizeSessionJoin(sessionId: string, userId: string)`

Checks if a user can join a game session.

**Checks:**

- Session exists
- Session is not full (unless user is host/co-host)
- Session is in a joinable state (not completed/cancelled)
- Host and co-host can always join their own sessions

**Usage:**

```typescript
const authResult = await authorizeSessionJoin(sessionId, userId);
if (!authResult.authorized) {
  return res.status(403).json({ error: authResult.reason });
}
```

#### `authorizeGameAction(sessionId: string, userId: string, action: object)`

Checks if a user can perform a game action.

**Checks:**

- Session exists and is active
- User is a participant (host or co-host)
- For turn-based actions: validates it's the user's turn

**Usage:**

```typescript
const authResult = await authorizeGameAction(sessionId, userId, {
  type: "play_card",
  cardId: "123",
});
if (!authResult.authorized) {
  return res.status(403).json({ error: authResult.reason });
}
```

#### `authorizeSpectate(sessionId: string, userId: string)`

Checks if a user can spectate a game session.

**Checks:**

- Session exists
- Session is not completed/cancelled

**Usage:**

```typescript
const authResult = await authorizeSpectate(sessionId, userId);
if (!authResult.authorized) {
  return res.status(403).json({ error: authResult.reason });
}
```

### 2. Action Validation

#### `validateGameActionPayload(action: unknown)`

Validates game action payloads using Zod schemas.

**Supported Action Types:**

- `play_card` - Playing a card with optional position and targets
- `draw_card` - Drawing cards (1-10 max)
- `attack` - Attack actions with attacker and target
- `end_turn` - Ending the current turn
- `move_piece` - Moving a game piece with coordinates
- `generic` - Fallback for custom actions

**Usage:**

```typescript
const validationResult = validateGameActionPayload({
  type: "play_card",
  sessionId: "uuid",
  userId: "user-id",
  cardId: "card-123",
  position: { x: 0, y: 0 },
});

if (!validationResult.valid) {
  return res.status(400).json({ error: validationResult.error });
}
```

### 3. Input Sanitization

#### `sanitizeGameInput(input: string)`

Sanitizes string input to prevent XSS attacks.

**Features:**

- Removes HTML tags
- Removes script tags
- Trims whitespace
- Limits length to 1000 characters

**Usage:**

```typescript
const safe = sanitizeGameInput(userInput);
```

#### `sanitizeGameActionData(data: Record<string, unknown>)`

Recursively sanitizes nested objects and arrays.

**Usage:**

```typescript
const sanitizedData = sanitizeGameActionData(actionData);
```

## Integration Examples

### WebSocket Handler

```typescript
import {
  authorizeGameAction,
  validateGameActionPayload,
  sanitizeGameActionData,
} from "../middleware/game-authorization.middleware";

async function handleGameAction(ws: ExtendedWebSocket, message: any) {
  // Validate payload structure
  const validationResult = validateGameActionPayload({
    type: message.action,
    sessionId: message.sessionId,
    userId: message.user.id,
    ...message.data,
  });

  if (!validationResult.valid) {
    return sendError(ws, validationResult.error);
  }

  // Authorize action
  const authResult = await authorizeGameAction(
    message.sessionId,
    message.user.id,
    { type: message.action, ...message.data },
  );

  if (!authResult.authorized) {
    return sendError(ws, authResult.reason);
  }

  // Sanitize data
  const sanitizedData = sanitizeGameActionData(message.data);

  // Process action with sanitized data
  await processGameAction(sanitizedData);
}
```

### REST API Endpoint

```typescript
import { authorizeSessionJoin } from "../middleware/game-authorization.middleware";

router.post("/:id/join", isAuthenticated, async (req, res) => {
  const userId = getAuthUserId(req);
  const { id } = req.params;

  // Authorize join
  const authResult = await authorizeSessionJoin(id, userId);
  if (!authResult.authorized) {
    return res.status(403).json({ error: authResult.reason });
  }

  // Proceed with join logic
  await storage.joinGameSession(id, userId);
  return res.json({ success: true });
});
```

## Adding New Action Types

To add a new action type:

1. **Add to schemas:**

```typescript
export const gameActionSchemas = {
  // ... existing schemas

  myNewAction: z.object({
    type: z.literal("my_new_action"),
    sessionId: z.string().uuid(),
    userId: z.string(),
    customField: z.string(),
    // Add your fields here
  }),
};
```

2. **Update schema map:**

```typescript
function getSchemaForActionType(actionType: string): z.ZodSchema | null {
  const schemaMap: Record<string, z.ZodSchema> = {
    // ... existing mappings
    my_new_action: gameActionSchemas.myNewAction,
  };
  return schemaMap[actionType] || null;
}
```

3. **Add to turn-based actions (if applicable):**

```typescript
const TURN_BASED_ACTIONS = [
  // ... existing actions
  "my_new_action",
];
```

## Security Best Practices

1. **Always validate before authorizing:** First check the payload structure, then check permissions.

2. **Sanitize all user input:** Use `sanitizeGameInput` or `sanitizeGameActionData` for all user-provided data.

3. **Check authorization on both WebSocket and REST:** Don't rely on client-side checks alone.

4. **Use specific error messages:** Help legitimate users understand why they're blocked while not revealing sensitive information to attackers.

5. **Log authorization failures:** Monitor for patterns that might indicate abuse attempts.

## Rate Limiting

The existing WebSocket rate limiter is already configured for game actions:

- **game_action**: 20 messages per 10 seconds
- Automatically applied by the WebSocket server

No additional rate limiting configuration is needed for authorization checks.

## Future Enhancements

TODO items marked in the code:

- User ban checking
- Public/private session handling
- Invitation system integration
- Community membership requirements
- Proper player tracking in sessions
- Spectator limits and permissions

## Testing

Run the authorization middleware tests:

```bash
npm test -- server/middleware/game-authorization.middleware.test.ts
```

All authorization logic is comprehensively tested with 32 test cases covering:

- Action payload validation
- Session join authorization
- Game action authorization
- Spectate authorization
- Input sanitization
