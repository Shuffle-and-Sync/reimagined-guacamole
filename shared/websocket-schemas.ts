import { z } from 'zod';

// WebSocket Message Schemas for validation
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

// Union of all WebSocket message schemas
export const websocketMessageSchema = z.discriminatedUnion('type', [
  joinCollabStreamSchema,
  phaseChangeSchema,
  coordinationEventSchema,
  collaboratorStatusUpdateSchema,
  // Legacy game room schemas for backward compatibility
  z.object({
    type: z.literal('join_room'),
    sessionId: z.string().min(1),
    user: z.record(z.any()),
  }),
  z.object({
    type: z.literal('message'),
    sessionId: z.string().min(1),
    user: z.record(z.any()),
    content: z.string(),
  }),
  z.object({
    type: z.literal('game_action'),
    sessionId: z.string().min(1),
    action: z.string(),
    user: z.record(z.any()),
    data: z.record(z.any()),
  }),
]);

export type WebSocketMessage = z.infer<typeof websocketMessageSchema>;