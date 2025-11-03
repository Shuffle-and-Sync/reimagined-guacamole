# WebSocket Message Type System

This directory contains the comprehensive type system for WebSocket real-time messaging in the Shuffle & Sync platform.

## Files

### Type Definitions

- **`websocket.types.ts`** - Core TypeScript type definitions for all WebSocket messages
  - Server-to-Client message types (events, pods, chat, system)
  - Client-to-Server message types (join/leave pod, subscribe to events, chat)
  - Type guards for runtime type checking
  - Connection state types

### Tests

- **`websocket.types.test.ts`** - Comprehensive test suite (14 tests, all passing)
  - Type guard validation
  - Message structure validation
  - Type narrowing verification
  - Edge case testing

## Quick Start

### Using Type Guards

```typescript
import {
  isPlayerJoinedPodMessage,
  isPodStatusChangedMessage,
} from "@shared/types/websocket.types";

// In your message handler
function handleWebSocketMessage(message: unknown) {
  if (isPlayerJoinedPodMessage(message)) {
    // TypeScript knows the exact message structure
    console.log(
      `${message.data.player.username} joined pod ${message.data.podId}`,
    );
  }

  if (isPodStatusChangedMessage(message)) {
    console.log(
      `Pod ${message.data.podId} changed from ${message.data.oldStatus} to ${message.data.newStatus}`,
    );
  }
}
```

### Using the React Hook

```typescript
import { useWebSocket } from "@/hooks/useWebSocket";

function MyComponent() {
  const { state, joinPod, sendChatMessage } = useWebSocket({
    url: "wss://example.com/ws",
    onMessage: (message) => {
      // Handle typed messages
    },
    reconnect: true,
  });

  // Join a pod
  joinPod("pod_123", "user_456");

  // Send chat
  sendChatMessage("pod_123", "Hello!");
}
```

## Type Safety Benefits

1. **Compile-time safety** - TypeScript catches errors before runtime
2. **IntelliSense support** - Full autocomplete in IDEs
3. **Refactoring confidence** - Safe to rename and restructure
4. **Runtime validation** - Type guards ensure data integrity
5. **Documentation** - Types serve as inline documentation

## Message Types

### Server-to-Client

#### Events

- `event:created` - New event notification
- `event:updated` - Event modification notification
- `event:deleted` - Event removal notification

#### Pods

- `pod:player_joined` - Player joined a pod
- `pod:player_left` - Player left a pod
- `pod:full` - Pod reached maximum capacity
- `pod:status_changed` - Pod status updated

#### Chat & System

- `chat:message` - Chat message received
- `system:notification` - System notification
- `system:connection_status` - Connection status update

### Client-to-Server

- `join_pod` - Request to join a pod
- `leave_pod` - Request to leave a pod
- `send_chat` - Send a chat message
- `subscribe_event` - Subscribe to event updates
- `unsubscribe_event` - Unsubscribe from event updates

## Validation

All messages are validated at multiple layers:

1. **TypeScript compilation** - Catches type errors at build time
2. **Runtime type guards** - Validates message structure at runtime
3. **Zod schemas** - Validates data format and constraints
4. **Rate limiting** - Prevents message flooding

## Testing

Run tests:

```bash
npm test -- shared/types/websocket.types.test.ts
```

All tests: **14 passed** ✅

## Documentation

For detailed documentation, see:

- **[Complete API Documentation](../../docs/WEBSOCKET_MESSAGE_TYPES.md)**
- **[Usage Examples](../../docs/WEBSOCKET_MESSAGE_TYPES.md#usage-with-react-hook)**
- **[Migration Guide](../../docs/WEBSOCKET_MESSAGE_TYPES.md#migration-guide)**

## Related Files

- **Validation Schemas**: `shared/websocket-schemas.ts`
- **React Hook**: `client/src/hooks/useWebSocket.ts`
- **Server Validator**: `server/utils/websocket-message-validator.ts`
- **Server Handler**: `server/utils/websocket-server-enhanced.ts`

## Contributing

When adding new message types:

1. Add TypeScript type definition to `websocket.types.ts`
2. Add Zod validation schema to `shared/websocket-schemas.ts`
3. Add type guard function to `websocket.types.ts`
4. Add server-side schema to `server/utils/websocket-message-validator.ts`
5. Add tests to `websocket.types.test.ts`
6. Update documentation in `docs/WEBSOCKET_MESSAGE_TYPES.md`

## Support

For questions or issues:

- Check the [full documentation](../../docs/WEBSOCKET_MESSAGE_TYPES.md)
- Review existing message types as examples
- Run tests to validate your changes
