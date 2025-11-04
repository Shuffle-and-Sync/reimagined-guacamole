# WebSocket Message Types Documentation

This document describes the comprehensive WebSocket message type system for the Shuffle & Sync platform.

## Overview

The WebSocket system provides real-time communication for:

- Event updates (created, updated, deleted)
- Pod management (player join/leave, status changes)
- Chat messages
- System notifications

## Message Structure

All WebSocket messages follow a common base structure:

```typescript
interface BaseWebSocketMessage {
  type: string; // Message type identifier
  timestamp: string; // ISO 8601 timestamp
  id?: string; // Optional message ID for tracking
}
```

## Server-to-Client Messages

### Event Messages

#### Event Created

Sent when a new event is created.

```typescript
{
  type: 'event:created',
  timestamp: '2025-01-03T12:00:00Z',
  data: {
    eventId: 'evt_123',
    title: 'Commander Night',
    startTime: '2025-01-10T19:00:00Z',
    endTime: '2025-01-10T23:00:00Z',
    createdBy: {
      id: 'user_456',
      username: 'john_doe'
    }
  }
}
```

#### Event Updated

Sent when an event is modified.

```typescript
{
  type: 'event:updated',
  timestamp: '2025-01-03T12:00:00Z',
  data: {
    eventId: 'evt_123',
    changes: {
      title: 'Commander Night - Updated',
      startTime: '2025-01-10T18:00:00Z'
    },
    updatedBy: 'user_456'
  }
}
```

#### Event Deleted

Sent when an event is removed.

```typescript
{
  type: 'event:deleted',
  timestamp: '2025-01-03T12:00:00Z',
  data: {
    eventId: 'evt_123',
    deletedBy: 'user_456'
  }
}
```

### Pod Messages

#### Player Joined Pod

Sent when a player joins a game pod.

```typescript
{
  type: 'pod:player_joined',
  timestamp: '2025-01-03T12:00:00Z',
  data: {
    podId: 'pod_789',
    player: {
      userId: 'user_456',
      username: 'john_doe',
      status: 'ready'  // 'ready' | 'registered' | 'waiting'
    },
    currentPlayerCount: 3,
    maxPlayers: 4
  }
}
```

#### Player Left Pod

Sent when a player leaves a game pod.

```typescript
{
  type: 'pod:player_left',
  timestamp: '2025-01-03T12:00:00Z',
  data: {
    podId: 'pod_789',
    playerId: 'user_456',
    currentPlayerCount: 2
  }
}
```

#### Pod Full

Sent when a pod reaches maximum capacity.

```typescript
{
  type: 'pod:full',
  timestamp: '2025-01-03T12:00:00Z',
  data: {
    podId: 'pod_789',
    title: 'Commander Pod #1',
    players: [
      { userId: 'user_1', username: 'player1' },
      { userId: 'user_2', username: 'player2' },
      { userId: 'user_3', username: 'player3' },
      { userId: 'user_4', username: 'player4' }
    ]
  }
}
```

#### Pod Status Changed

Sent when a pod's status changes.

```typescript
{
  type: 'pod:status_changed',
  timestamp: '2025-01-03T12:00:00Z',
  data: {
    podId: 'pod_789',
    oldStatus: 'waiting',
    newStatus: 'active'  // 'waiting' | 'active' | 'finished' | 'cancelled'
  }
}
```

### Chat Messages

#### Chat Message Received

Sent when a chat message is received in a pod.

```typescript
{
  type: 'chat:message',
  timestamp: '2025-01-03T12:00:00Z',
  data: {
    podId: 'pod_789',
    messageId: 'msg_abc',
    userId: 'user_456',
    username: 'john_doe',
    message: 'Good game everyone!',
    timestamp: '2025-01-03T12:00:00Z'
  }
}
```

### System Messages

#### System Notification

Sent for system-wide notifications.

```typescript
{
  type: 'system:notification',
  timestamp: '2025-01-03T12:00:00Z',
  data: {
    severity: 'info',  // 'info' | 'warning' | 'error' | 'success'
    title: 'System Update',
    message: 'Scheduled maintenance in 1 hour',
    action: {
      label: 'Learn More',
      url: '/announcements/maintenance'
    }
  }
}
```

#### Connection Status

Sent when connection status changes.

```typescript
{
  type: 'system:connection_status',
  timestamp: '2025-01-03T12:00:00Z',
  data: {
    status: 'connected',  // 'connected' | 'disconnected' | 'reconnecting'
    serverId: 'server_1'
  }
}
```

## Client-to-Server Messages

### Pod Management

#### Join Pod

Request to join a game pod.

```typescript
{
  type: 'join_pod',
  data: {
    podId: 'pod_789',
    userId: 'user_456'
  }
}
```

#### Leave Pod

Request to leave a game pod.

```typescript
{
  type: 'leave_pod',
  data: {
    podId: 'pod_789',
    userId: 'user_456'
  }
}
```

#### Send Chat Message

Send a chat message to a pod.

```typescript
{
  type: 'send_chat',
  data: {
    podId: 'pod_789',
    message: 'Good game everyone!'
  }
}
```

### Event Subscriptions

#### Subscribe to Event

Subscribe to real-time updates for an event.

```typescript
{
  type: 'subscribe_event',
  data: {
    eventId: 'evt_123'
  }
}
```

#### Unsubscribe from Event

Unsubscribe from event updates.

```typescript
{
  type: 'unsubscribe_event',
  data: {
    eventId: 'evt_123'
  }
}
```

## Type Guards

Use type guards for runtime type checking:

```typescript
import {
  isPlayerJoinedPodMessage,
  isPodStatusChangedMessage,
  isEventCreatedMessage,
} from "@shared/types/websocket.types";

// In message handler
if (isPlayerJoinedPodMessage(message)) {
  // TypeScript knows message.data.player exists
  const { podId, player, currentPlayerCount } = message.data;
  console.log(`${player.username} joined pod ${podId}`);
}
```

## Usage with React Hook

The `useWebSocket` hook provides a type-safe way to work with WebSocket connections:

```typescript
import { useWebSocket } from '@/hooks/useWebSocket';
import { isPlayerJoinedPodMessage } from '@shared/types/websocket.types';

function MyComponent() {
  const { state, joinPod, leavePod, sendChatMessage } = useWebSocket({
    url: 'wss://example.com/ws',
    onMessage: (message) => {
      if (isPlayerJoinedPodMessage(message)) {
        console.log('Player joined:', message.data.player.username);
      }
    },
    onConnect: () => console.log('Connected!'),
    reconnect: true,
    reconnectAttempts: 5
  });

  // Join a pod
  const handleJoinPod = () => {
    joinPod('pod_789', 'user_456');
  };

  // Send chat message
  const handleSendMessage = (text: string) => {
    sendChatMessage('pod_789', text);
  };

  return (
    <div>
      {state.isConnected ? 'Connected' : 'Disconnected'}
      {state.isReconnecting && 'Reconnecting...'}
    </div>
  );
}
```

## Validation

All messages are validated using Zod schemas:

### Client-side Validation

Messages are validated before sending to ensure correct structure.

### Server-side Validation

Incoming messages are validated with schemas in `shared/websocket-schemas.ts`:

- Type checking
- Data format validation
- Length limits (e.g., chat messages max 1000 chars)
- Rate limiting per message type

### Rate Limiting

Different message types have different rate limits:

| Message Type         | Window | Max Messages |
| -------------------- | ------ | ------------ |
| `game_action`        | 10s    | 20           |
| `coordination_event` | 10s    | 15           |
| `send_chat`          | 10s    | 20           |
| `message`            | 60s    | 30           |
| `subscribe_event`    | 60s    | 30           |
| `join_pod`           | 60s    | 10           |
| `phase_change`       | 60s    | 5            |

## Error Handling

The system provides comprehensive error messages:

```typescript
{
  type: 'error',
  message: 'Failed to join pod',
  code: 'POD_FULL',
  details: {
    podId: 'pod_789',
    maxPlayers: 4
  }
}
```

## Best Practices

1. **Always use type guards** when handling incoming messages
2. **Subscribe to events** you need updates for
3. **Unsubscribe** when component unmounts
4. **Handle disconnections** gracefully with the `isReconnecting` state
5. **Queue messages** when disconnected (handled automatically by the hook)
6. **Respect rate limits** to avoid throttling

## Example: Complete Pod Management

```typescript
import { useWebSocket } from '@/hooks/useWebSocket';
import {
  isPlayerJoinedPodMessage,
  isPlayerLeftPodMessage,
  isPodStatusChangedMessage,
  isChatMessageReceived
} from '@shared/types/websocket.types';
import { useState, useEffect } from 'react';

function PodComponent({ podId, userId }: Props) {
  const [players, setPlayers] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const { state, joinPod, leavePod, sendChatMessage } = useWebSocket({
    url: WS_URL,
    onMessage: (message) => {
      if (isPlayerJoinedPodMessage(message) && message.data.podId === podId) {
        setPlayers(prev => [...prev, message.data.player.username]);
      }

      if (isPlayerLeftPodMessage(message) && message.data.podId === podId) {
        setPlayers(prev =>
          prev.filter(p => p !== message.data.playerId)
        );
      }

      if (isChatMessageReceived(message) && message.data.podId === podId) {
        setMessages(prev => [...prev, {
          id: message.data.messageId,
          user: message.data.username,
          text: message.data.message,
          timestamp: message.data.timestamp
        }]);
      }
    }
  });

  useEffect(() => {
    if (state.isConnected) {
      joinPod(podId, userId);
    }

    return () => {
      if (state.isConnected) {
        leavePod(podId, userId);
      }
    };
  }, [state.isConnected, podId, userId]);

  return (
    <div>
      <h2>Pod Players: {players.length}</h2>
      <ul>
        {players.map(player => <li key={player}>{player}</li>)}
      </ul>

      <div>
        {messages.map(msg => (
          <div key={msg.id}>
            <strong>{msg.user}:</strong> {msg.text}
          </div>
        ))}
      </div>

      <input
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            sendChatMessage(podId, e.currentTarget.value);
            e.currentTarget.value = '';
          }
        }}
      />
    </div>
  );
}
```

## Migration Guide

If you have existing WebSocket code, here's how to migrate:

### Before (Untyped)

```typescript
const ws = new WebSocket(url);
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === "player_joined") {
    // Prone to typos!
    // No type safety
    console.log(data.player.name);
  }
};
```

### After (Typed)

```typescript
const { state, subscribeToEvent } = useWebSocket({
  url: WS_URL,
  onMessage: (message) => {
    if (isPlayerJoinedPodMessage(message)) {
      // Full type safety!
      console.log(message.data.player.username);
    }
  },
});
```

## Related Files

- **Types**: `shared/types/websocket.types.ts`
- **Schemas**: `shared/websocket-schemas.ts`
- **Hook**: `client/src/hooks/useWebSocket.ts`
- **Server Validator**: `server/utils/websocket-message-validator.ts`
- **Server Handler**: `server/utils/websocket-server-enhanced.ts`
