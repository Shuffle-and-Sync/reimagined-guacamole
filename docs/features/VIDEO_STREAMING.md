# TableSync Video Streaming Feature

## Overview

The TableSync video streaming feature enables remote paper TCG gameplay with real-time video chat, card recognition, and game state tracking. This implementation achieves feature parity with Wizards of the Coast's Spelltable platform.

## Architecture

### Technology Stack

- **WebRTC**: Peer-to-peer video/audio streaming
- **Socket.io**: Real-time signaling and state sync
- **React**: UI components
- **TypeScript**: Type-safe implementation

### Directory Structure

```
client/src/features/video/
├── types/
│   └── video.types.ts           # TypeScript interfaces
├── hooks/
│   └── useWebRTC.ts              # Main WebRTC hook
├── components/
│   ├── VideoRoom.tsx             # Video room container
│   └── VideoFeed.tsx             # Individual video stream
└── index.ts                      # Feature exports

server/features/video/
├── video-signaling.ts            # Socket.io signaling server
└── webrtc-config.ts              # ICE server configuration

server/services/
└── socket-io.service.ts          # Socket.io initialization
```

## Usage

### Basic Usage

1. Navigate to `/video-room`
2. Enter a room ID or generate one
3. Click "Join Room"
4. Allow camera/microphone access
5. Share room ID with other players

### For Developers

#### Creating a Video Room

```tsx
import { VideoRoom } from "@/features/video";
import { io } from "socket.io-client";

function MyGameRoom() {
  const socket = io("http://localhost:3000");

  return (
    <VideoRoom
      roomId="my-game-123"
      userId="user-456"
      userName="Player 1"
      socket={socket}
      onLeave={() => console.log("Left room")}
    />
  );
}
```

#### Using the WebRTC Hook

```tsx
import { useWebRTC } from "@/features/video/hooks/useWebRTC";
import { io } from "socket.io-client";

function CustomVideoComponent() {
  const socket = io("http://localhost:3000");

  const {
    localStream,
    remoteStreams,
    isConnected,
    error,
    joinRoom,
    leaveRoom,
    toggleCamera,
    toggleMicrophone,
  } = useWebRTC({
    roomId: "my-room",
    userId: "user-123",
    socket,
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  return (
    <div>
      {/* Display local and remote video streams */}
      <button onClick={joinRoom}>Join</button>
      <button onClick={leaveRoom}>Leave</button>
      <button onClick={toggleCamera}>Toggle Camera</button>
      <button onClick={toggleMicrophone}>Toggle Mic</button>
    </div>
  );
}
```

## WebRTC Connection Flow

1. **User Joins Room**
   - Client navigates to `/video-room/:roomId`
   - Socket.io connection established

2. **Media Initialization**
   - Browser requests camera/microphone permission
   - Local MediaStream created

3. **Signaling**
   - Client emits `join-video-room` with roomId and userId
   - Server adds user to room
   - Server sends list of existing users

4. **Peer Connection Setup**
   - For each peer, create RTCPeerConnection
   - Add local tracks to connection
   - Set up event handlers

5. **SDP Exchange**
   - Create and send SDP offer
   - Receive and process SDP answer
   - Set local and remote descriptions

6. **ICE Candidate Exchange**
   - Gather ICE candidates
   - Exchange candidates via Socket.io
   - Establish direct peer connection

7. **Media Streaming**
   - Receive remote MediaStream
   - Display video feeds
   - Enable/disable tracks as needed

## Socket.io Events

### Client → Server

| Event              | Payload                                                             | Description        |
| ------------------ | ------------------------------------------------------------------- | ------------------ |
| `join-video-room`  | `{ roomId: string, userId: string }`                                | Join a video room  |
| `leave-video-room` | `{ roomId: string, userId: string }`                                | Leave a video room |
| `offer`            | `{ roomId: string, to: string, offer: RTCSessionDescriptionInit }`  | Send WebRTC offer  |
| `answer`           | `{ roomId: string, to: string, answer: RTCSessionDescriptionInit }` | Send WebRTC answer |
| `ice-candidate`    | `{ roomId: string, to: string, candidate: RTCIceCandidateInit }`    | Send ICE candidate |

### Server → Client

| Event            | Payload                                               | Description           |
| ---------------- | ----------------------------------------------------- | --------------------- |
| `user-joined`    | `{ userId: string }`                                  | New user joined room  |
| `user-left`      | `{ userId: string }`                                  | User left room        |
| `existing-users` | `{ users: string[] }`                                 | List of users in room |
| `offer`          | `{ offer: RTCSessionDescriptionInit, from: string }`  | Receive WebRTC offer  |
| `answer`         | `{ answer: RTCSessionDescriptionInit, from: string }` | Receive WebRTC answer |
| `ice-candidate`  | `{ candidate: RTCIceCandidateInit, from: string }`    | Receive ICE candidate |

## Configuration

### ICE Servers

Default configuration uses Google's public STUN servers:

```typescript
const DEFAULT_ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];
```

For production, consider adding TURN servers:

```typescript
const PRODUCTION_ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  {
    urls: "turn:turn.example.com:3478",
    username: process.env.TURN_USERNAME,
    credential: process.env.TURN_PASSWORD,
  },
];
```

### Environment Variables

Add to `.env.local`:

```bash
# Optional: TURN server configuration
TURN_SERVER_URL=turn:turn.example.com:3478
TURN_USERNAME=your-username
TURN_PASSWORD=your-password

# Socket.io CORS origin
VITE_API_URL=http://localhost:3000
```

## Troubleshooting

### Camera/Microphone Permission Denied

**Problem**: Browser blocks camera/microphone access

**Solution**:

1. Check browser permissions settings
2. Ensure site is served over HTTPS in production
3. Use localhost for development testing

### Peers Not Connecting

**Problem**: Video streams not appearing for other users

**Solution**:

1. Check browser console for WebRTC errors
2. Verify Socket.io connection is established
3. Ensure ICE servers are configured
4. Check firewall/NAT settings
5. Consider adding TURN server for restrictive networks

### Poor Video Quality

**Problem**: Choppy video or low resolution

**Solution**:

1. Check network bandwidth (min 5 Mbps recommended)
2. Reduce video resolution in constraints
3. Lower frame rate (15-24 fps)
4. Limit number of simultaneous peers (max 4 recommended)

### Audio Echo

**Problem**: Hearing own voice through remote stream

**Solution**:

- Local video feed is automatically muted (`muted={isLocal}`)
- Ensure echo cancellation is enabled in media constraints:

```typescript
audio: {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
}
```

## Performance Optimization

### Video Quality Settings

Adjust based on network conditions:

```typescript
// High quality (good network)
video: {
  width: { ideal: 1280 },
  height: { ideal: 720 },
  frameRate: { ideal: 30 },
}

// Medium quality (average network)
video: {
  width: { ideal: 640 },
  height: { ideal: 480 },
  frameRate: { ideal: 24 },
}

// Low quality (poor network)
video: {
  width: { ideal: 480 },
  height: { ideal: 360 },
  frameRate: { ideal: 15 },
}
```

### Connection Limits

- **Recommended**: 2-4 players per room
- **Maximum**: 8 players (may impact performance)
- Each peer requires separate WebRTC connection
- Bandwidth scales with number of peers

### State Management

- Use refs for frequently changing values
- Minimize re-renders with proper memoization
- Clean up connections on component unmount
- Handle network interruptions gracefully

## Security Considerations

- ✅ Authentication required for video rooms
- ✅ CORS configured for Socket.io
- ✅ WebRTC uses DTLS/SRTP encryption
- ⚠️ Room IDs should be unpredictable (use UUIDs)
- ⚠️ Consider rate limiting for signaling events
- ⚠️ Implement room access controls for private games

## Future Enhancements

### Planned Features

1. **Screen Sharing**: Share game boards/cards
2. **Recording**: Save gameplay sessions
3. **Bandwidth Adaptation**: Auto-adjust quality
4. **Virtual Backgrounds**: Privacy for home gaming
5. **Picture-in-Picture**: Minimize video while playing
6. **Grid Layouts**: Focus mode, speaker view
7. **Chat Overlay**: Text chat during games

### Integration Points

- Card recognition (Phase 2)
- Game state tracking (Phase 3)
- Tournament system
- Matchmaking
- Spectator mode

## Testing

### Manual Testing

1. Join room in two browser tabs
2. Verify video appears in both
3. Toggle camera/mic in each
4. Leave and rejoin rooms
5. Test with 3-4 simultaneous users
6. Test on mobile devices

### Automated Testing

```bash
# Run tests (when available)
npm test client/src/features/video

# E2E tests (when available)
npm run test:e2e video-room
```

## References

- [WebRTC API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [Socket.io Documentation](https://socket.io/docs/v4/)
- [Spelltable by Wizards of the Coast](https://spelltable.wizards.com/)
- [WebRTC Best Practices](https://webrtc.org/getting-started/overview)

## Support

For issues or questions:

1. Check troubleshooting section above
2. Review browser console logs
3. Check Socket.io connection status
4. Open GitHub issue with reproduction steps
