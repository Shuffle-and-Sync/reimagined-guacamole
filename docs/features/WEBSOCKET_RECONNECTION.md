# WebSocket Reconnection State Manager

## Overview

The WebSocket client now includes robust reconnection logic with state preservation and message queuing. This ensures that users can seamlessly recover from connection drops without losing data or context.

## Features

### 1. Connection State Management

The client now tracks and notifies about connection state changes:

- `connected` - WebSocket is connected and ready
- `disconnected` - WebSocket is disconnected
- `reconnecting` - WebSocket is attempting to reconnect (includes attempt number)
- `failed` - Reconnection has failed after maximum attempts

### 2. Message Queuing

Messages sent while disconnected are automatically queued and replayed upon reconnection:

- Automatic queueing when connection is unavailable
- Maximum queue size of 100 messages (oldest removed when full)
- Messages replayed in timestamp order after reconnection
- Each message gets a unique ID for tracking

### 3. Room State Persistence

The client automatically remembers which rooms you were in:

- Game room IDs are preserved
- Collaborative streaming room IDs are preserved
- Rooms can be automatically rejoined after reconnection

### 4. Message Deduplication

Prevents duplicate message processing:

- Each message gets a unique ID
- Previously processed message IDs are tracked (up to 1000)
- Duplicate messages are automatically filtered out

## Usage Examples

### Listening to Connection State Changes

```typescript
import { webSocketClient } from "@/lib/websocket-client";

// Register a callback to be notified of connection state changes
const unsubscribe = webSocketClient.onConnectionStateChange(
  (state, attempt) => {
    switch (state) {
      case "connected":
        console.log("✅ WebSocket connected");
        // showNotification is a placeholder - use your app's notification system
        // Example: toast.success('Connected');
        break;
      case "disconnected":
        console.log("❌ WebSocket disconnected");
        // Example: toast.warning('Disconnected');
        break;
      case "reconnecting":
        console.log(`🔄 Reconnecting... (attempt ${attempt})`);
        // Example: toast.info(`Reconnecting (attempt ${attempt})`);
        break;
      case "failed":
        console.log("💥 Reconnection failed");
        // Example: toast.error('Connection failed');
        break;
    }
  },
);

// Don't forget to unsubscribe when component unmounts
return () => unsubscribe();
```

### React Hook Example

```typescript
import { useState, useEffect } from "react";
import { webSocketClient, ConnectionState } from "@/lib/websocket-client";

export function useWebSocketStatus() {
  const [status, setStatus] = useState<ConnectionState>("disconnected");
  const [reconnectAttempt, setReconnectAttempt] = useState<number>(0);

  useEffect(() => {
    const unsubscribe = webSocketClient.onConnectionStateChange(
      (state, attempt) => {
        setStatus(state);
        setReconnectAttempt(attempt || 0);
      },
    );

    return unsubscribe;
  }, []);

  return { status, reconnectAttempt, isConnected: status === "connected" };
}
```

### UI Component Example

```typescript
import { useWebSocketStatus } from './useWebSocketStatus';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function ConnectionStatus() {
  const { status, reconnectAttempt } = useWebSocketStatus();

  if (status === 'connected') {
    return null; // Don't show anything when connected
  }

  return (
    <Alert variant={status === 'failed' ? 'destructive' : 'default'}>
      <AlertDescription>
        {status === 'disconnected' && 'Connection lost. Attempting to reconnect...'}
        {status === 'reconnecting' && `Reconnecting (attempt ${reconnectAttempt})...`}
        {status === 'failed' && 'Connection failed. Please refresh the page.'}
      </AlertDescription>
    </Alert>
  );
}
```

### Managing Room State

```typescript
import { collaborativeStreamingWS } from "@/lib/websocket-client";

// Join a collaborative streaming room
await collaborativeStreamingWS.joinCollaborativeStream("event-123", {
  id: "user-456",
  name: "John Doe",
});

// The room ID is automatically stored for reconnection
// If connection drops and reconnects, the client will remember this room

// When leaving, clear the room state
collaborativeStreamingWS.leaveCollaborativeStream("event-123");
```

### Checking Connection State

```typescript
import { webSocketClient } from "@/lib/websocket-client";

// Get current connection state
const state = webSocketClient.getConnectionState();
console.log("Current state:", state);

// Check if connected (legacy API, still works)
const isConnected = webSocketClient.isConnected;

// Get pending message count
const pendingCount = webSocketClient.getPendingMessageCount();
console.log(`${pendingCount} messages waiting to be sent`);

// Get reconnection state snapshot
const reconnectionState = webSocketClient.getReconnectionState();
console.log("Game room:", reconnectionState.gameRoomId);
console.log("Collab room:", reconnectionState.collaborativeRoomId);
console.log("Pending messages:", reconnectionState.pendingMessages.length);
```

### Manually Clearing Pending Messages

```typescript
import { webSocketClient } from "@/lib/websocket-client";

// Clear all pending messages (useful for logout or reset)
webSocketClient.clearPendingMessages();
```

## Implementation Details

### Automatic Behavior

The reconnection manager automatically:

1. **Detects connection loss** - When the WebSocket closes unexpectedly
2. **Queues messages** - Any messages sent while disconnected are queued
3. **Attempts reconnection** - Uses exponential backoff (1s, 2s, 4s, 8s, 16s, max 30s)
4. **Notifies UI** - All registered callbacks are notified of state changes
5. **Recovers state** - Upon reconnection, replays queued messages
6. **Prevents duplicates** - Tracks message IDs to avoid duplicate processing

### Configuration

Current limits:

- **Maximum reconnection attempts:** 5
- **Initial reconnection delay:** 1 second
- **Maximum reconnection delay:** 30 seconds
- **Message queue size:** 100 messages
- **Message ID tracking:** 1000 message IDs

### Manual Disconnection

When disconnecting manually (e.g., logout):

```typescript
// This clears all state and prevents reconnection attempts
webSocketClient.disconnect();
```

## Testing

The reconnection state manager includes comprehensive test coverage (30 tests):

- Connection state transitions
- State callback notifications
- Room ID persistence
- Message queuing and replay
- Message ID deduplication
- Queue size limits
- Integration scenarios

Run tests:

```bash
npm run test:frontend -- websocket-client.test.ts
```

## Migration Guide

### For Existing Code

The changes are backward compatible. Existing code will continue to work without modifications:

```typescript
// This still works
const isConnected = webSocketClient.isConnected;
webSocketClient.send(message);
```

### Recommended Enhancements

Add connection status indicators to your UI. Here's an example component you can create:

```typescript
// Create this component: client/src/components/ConnectionStatus.tsx
import { useWebSocketStatus } from '@/hooks/useWebSocketStatus';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function ConnectionStatus() {
  const { status, reconnectAttempt } = useWebSocketStatus();

  if (status === 'connected') {
    return null; // Don't show anything when connected
  }

  return (
    <Alert variant={status === 'failed' ? 'destructive' : 'default'}>
      <AlertDescription>
        {status === 'disconnected' && 'Connection lost. Attempting to reconnect...'}
        {status === 'reconnecting' && `Reconnecting (attempt ${reconnectAttempt})...`}
        {status === 'failed' && 'Connection failed. Please refresh the page.'}
      </AlertDescription>
    </Alert>
  );
}

// Then use it in your app's root component
function App() {
  return (
    <>
      <ConnectionStatus />
      {/* rest of your app */}
    </>
  );
}
```

## Architecture

### State Preservation Flow

```
1. User joins room → Room ID stored
2. Connection drops → State: disconnected
3. Message sent → Added to queue
4. Reconnection starts → State: reconnecting (attempt 1)
5. Connection succeeds → State: connected
6. Messages replayed → Queue cleared
7. User continues seamlessly
```

### Message Flow

```
send(message) called
    ↓
Is connected?
    ├─ Yes → Send immediately + Track ID
    └─ No  → Add to queue
         ↓
    On reconnect → Replay queued messages
```

## Troubleshooting

### Connection keeps failing

Check browser console for WebSocket errors. Common issues:

- Server not running
- Firewall blocking WebSocket connections
- Invalid WebSocket URL configuration

### Messages not being replayed

Verify that:

- Messages were queued (check `getPendingMessageCount()`)
- Connection successfully reconnected (state = 'connected')
- No duplicate message IDs

### Memory concerns

The system automatically limits:

- Message queue: 100 messages max
- Message ID tracking: 1000 IDs max (oldest 20% removed when limit reached)

## Future Enhancements

Potential improvements:

- Configurable retry limits and delays
- Persistent storage of pending messages (localStorage)
- Priority queue for critical messages
- Bandwidth-aware message replay
- Network quality indicators
