import { z } from 'zod';

// Incoming WebSocket Message Schemas for validation
export const joinCollabStreamSchema = z.object({
  type: z.literal('join_collab_stream'),
  eventId: z.string().min(1),
  // No userId - extracted from authenticated session
});

export const phaseChangeSchema = z.object({
  type: z.literal('phase_change'),
  eventId: z.string().min(1),
  newPhase: z.enum(['preparation', 'live', 'break', 'wrap_up', 'ended']),
});

export const coordinationEventSchema = z.object({
  type: z.literal('coordination_event'),
  eventId: z.string().min(1),
  eventType: z.string().min(1),
  eventData: z.record(z.any()),
});

export const collaboratorStatusUpdateSchema = z.object({
  type: z.literal('collaborator_status_update'),
  eventId: z.string().min(1),
  // No userId - extracted from authenticated session
  statusUpdate: z.record(z.any()),
});

// WebRTC-related message schemas
export const webrtcOfferSchema = z.object({
  type: z.literal('webrtc_offer'),
  sessionId: z.string().min(1),
  targetPlayer: z.string().min(1),
  offer: z.any()
});

export const webrtcAnswerSchema = z.object({
  type: z.literal('webrtc_answer'),
  sessionId: z.string().min(1),
  targetPlayer: z.string().min(1),
  answer: z.any()
});

export const webrtcIceCandidateSchema = z.object({
  type: z.literal('webrtc_ice_candidate'),
  sessionId: z.string().min(1),
  targetPlayer: z.string().min(1),
  candidate: z.any()
});

export const cameraToggleSchema = z.object({
  type: z.literal('camera_toggle'),
  sessionId: z.string().min(1),
  user: z.object({
    id: z.string(),
    name: z.string()
  }),
  cameraOn: z.boolean()
});

export const micToggleSchema = z.object({
  type: z.literal('mic_toggle'),
  sessionId: z.string().min(1),
  user: z.object({
    id: z.string(),
    name: z.string()
  }),
  micOn: z.boolean()
});

// Union of all incoming WebSocket message schemas
export const websocketMessageSchema = z.discriminatedUnion('type', [
  joinCollabStreamSchema,
  phaseChangeSchema,
  coordinationEventSchema,
  collaboratorStatusUpdateSchema,
  webrtcOfferSchema,
  webrtcAnswerSchema,
  webrtcIceCandidateSchema,
  cameraToggleSchema,
  micToggleSchema,
  // Legacy game room schemas for backward compatibility
  z.object({
    type: z.literal('join_room'),
    sessionId: z.string().min(1),
    user: z.object({
      id: z.string(),
      name: z.string(),
      avatar: z.string().optional()
    }),
  }),
  z.object({
    type: z.literal('message'),
    sessionId: z.string().min(1),
    user: z.object({
      id: z.string(),
      name: z.string(),
      avatar: z.string().optional()
    }),
    content: z.string().max(1000), // Limit message length
  }),
  z.object({
    type: z.literal('game_action'),
    sessionId: z.string().min(1),
    action: z.string().min(1),
    user: z.object({
      id: z.string(),
      name: z.string(),
      avatar: z.string().optional()
    }),
    data: z.record(z.any()),
  }),
]);

export type WebSocketMessage = z.infer<typeof websocketMessageSchema>;

// Additional validation utilities
export const validateMessageRate = (messageType: string): { windowMs: number; maxMessages: number } => {
  const rateConfigs: Record<string, { windowMs: number; maxMessages: number }> = {
    // High-frequency messages (stricter limits)
    'game_action': { windowMs: 10 * 1000, maxMessages: 20 }, // 20 per 10 seconds
    'coordination_event': { windowMs: 10 * 1000, maxMessages: 15 },
    'webrtc_ice_candidate': { windowMs: 10 * 1000, maxMessages: 30 },
    
    // Medium-frequency messages
    'message': { windowMs: 60 * 1000, maxMessages: 30 }, // 30 per minute
    'collaborator_status_update': { windowMs: 60 * 1000, maxMessages: 20 },
    
    // Low-frequency messages (more lenient)
    'join_room': { windowMs: 60 * 1000, maxMessages: 10 },
    'join_collab_stream': { windowMs: 60 * 1000, maxMessages: 10 },
    'phase_change': { windowMs: 60 * 1000, maxMessages: 5 }, // Very limited
    
    // Default for unknown message types
    'default': { windowMs: 60 * 1000, maxMessages: 100 }
  };
  
  return rateConfigs[messageType] || rateConfigs['default'];
};