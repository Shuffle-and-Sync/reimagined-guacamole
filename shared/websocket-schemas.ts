import { z } from "zod";

// Incoming WebSocket Message Schemas for validation
export const joinCollabStreamSchema = z.object({
  type: z.literal("join_collab_stream"),
  eventId: z.string().min(1),
  // No userId - extracted from authenticated session
});

export const phaseChangeSchema = z.object({
  type: z.literal("phase_change"),
  eventId: z.string().min(1),
  newPhase: z.enum(["preparation", "live", "break", "wrap_up", "ended"]),
});

export const coordinationEventSchema = z.object({
  type: z.literal("coordination_event"),
  eventId: z.string().min(1),
  eventType: z.string().min(1),
  eventData: z.record(z.any()),
});

export const collaboratorStatusUpdateSchema = z.object({
  type: z.literal("collaborator_status_update"),
  eventId: z.string().min(1),
  // No userId - extracted from authenticated session
  statusUpdate: z.record(z.any()),
});

// WebRTC-related message schemas
export const webrtcOfferSchema = z.object({
  type: z.literal("webrtc_offer"),
  sessionId: z.string().min(1),
  targetPlayer: z.string().min(1),
  offer: z.any(),
});

export const webrtcAnswerSchema = z.object({
  type: z.literal("webrtc_answer"),
  sessionId: z.string().min(1),
  targetPlayer: z.string().min(1),
  answer: z.any(),
});

export const webrtcIceCandidateSchema = z.object({
  type: z.literal("webrtc_ice_candidate"),
  sessionId: z.string().min(1),
  targetPlayer: z.string().min(1),
  candidate: z.any(),
});

export const cameraToggleSchema = z.object({
  type: z.literal("camera_toggle"),
  sessionId: z.string().min(1),
  user: z.object({
    id: z.string(),
    name: z.string(),
  }),
  cameraOn: z.boolean(),
});

export const micToggleSchema = z.object({
  type: z.literal("mic_toggle"),
  sessionId: z.string().min(1),
  user: z.object({
    id: z.string(),
    name: z.string(),
  }),
  micOn: z.boolean(),
});

// Tournament-related message schemas
export const joinTournamentRoomSchema = z.object({
  type: z.literal("join_tournament_room"),
  tournamentId: z.string().min(1),
});

export const leaveTournamentRoomSchema = z.object({
  type: z.literal("leave_tournament_room"),
  tournamentId: z.string().min(1),
});

export const watchMatchSchema = z.object({
  type: z.literal("watch_match"),
  tournamentId: z.string().min(1),
  matchId: z.string().min(1),
});

// Tournament event broadcasts (outgoing)
export const tournamentMatchStartedSchema = z.object({
  type: z.literal("tournament:match_started"),
  tournamentId: z.string(),
  matchId: z.string(),
  roundId: z.string(),
  player1Id: z.string(),
  player2Id: z.string().nullable(),
});

export const tournamentMatchCompletedSchema = z.object({
  type: z.literal("tournament:match_completed"),
  tournamentId: z.string(),
  matchId: z.string(),
  winnerId: z.string(),
  player1Score: z.number().optional(),
  player2Score: z.number().optional(),
});

export const tournamentRoundAdvancedSchema = z.object({
  type: z.literal("tournament:round_advanced"),
  tournamentId: z.string(),
  roundNumber: z.number(),
  roundStatus: z.enum(["pending", "in_progress", "completed"]),
});

export const tournamentParticipantJoinedSchema = z.object({
  type: z.literal("tournament:participant_joined"),
  tournamentId: z.string(),
  userId: z.string(),
  participantCount: z.number(),
});

export const tournamentParticipantLeftSchema = z.object({
  type: z.literal("tournament:participant_left"),
  tournamentId: z.string(),
  userId: z.string(),
  participantCount: z.number(),
});

export const tournamentBracketUpdatedSchema = z.object({
  type: z.literal("tournament:bracket_updated"),
  tournamentId: z.string(),
  roundNumber: z.number(),
  matches: z.array(
    z.object({
      id: z.string(),
      matchNumber: z.number(),
      player1Id: z.string().nullable(),
      player2Id: z.string().nullable(),
      winnerId: z.string().nullable(),
      status: z.enum(["pending", "in_progress", "completed", "bye"]),
    }),
  ),
});

export const tournamentStatusChangedSchema = z.object({
  type: z.literal("tournament:status_changed"),
  tournamentId: z.string(),
  status: z.enum(["upcoming", "active", "completed", "cancelled"]),
  timestamp: z.date(),
});

// Pod-related client-to-server message schemas
export const joinPodSchema = z.object({
  type: z.literal("join_pod"),
  data: z.object({
    podId: z.string().min(1),
    userId: z.string().min(1),
  }),
});

export const leavePodSchema = z.object({
  type: z.literal("leave_pod"),
  data: z.object({
    podId: z.string().min(1),
    userId: z.string().min(1),
  }),
});

export const sendChatSchema = z.object({
  type: z.literal("send_chat"),
  data: z.object({
    podId: z.string().min(1),
    message: z.string().min(1).max(1000),
  }),
});

export const subscribeEventSchema = z.object({
  type: z.literal("subscribe_event"),
  data: z.object({
    eventId: z.string().min(1),
  }),
});

export const unsubscribeEventSchema = z.object({
  type: z.literal("unsubscribe_event"),
  data: z.object({
    eventId: z.string().min(1),
  }),
});

// Pod and Event server-to-client broadcast schemas
export const eventCreatedBroadcastSchema = z.object({
  type: z.literal("event:created"),
  timestamp: z.string(),
  id: z.string().optional(),
  data: z.object({
    eventId: z.string(),
    title: z.string(),
    startTime: z.string(),
    endTime: z.string().optional(),
    createdBy: z.object({
      id: z.string(),
      username: z.string(),
    }),
  }),
});

export const eventUpdatedBroadcastSchema = z.object({
  type: z.literal("event:updated"),
  timestamp: z.string(),
  id: z.string().optional(),
  data: z.object({
    eventId: z.string(),
    changes: z.record(z.any()),
    updatedBy: z.string(),
  }),
});

export const eventDeletedBroadcastSchema = z.object({
  type: z.literal("event:deleted"),
  timestamp: z.string(),
  id: z.string().optional(),
  data: z.object({
    eventId: z.string(),
    deletedBy: z.string(),
  }),
});

export const playerJoinedPodBroadcastSchema = z.object({
  type: z.literal("pod:player_joined"),
  timestamp: z.string(),
  id: z.string().optional(),
  data: z.object({
    podId: z.string(),
    player: z.object({
      userId: z.string(),
      username: z.string(),
      status: z.enum(["ready", "registered", "waiting"]),
    }),
    currentPlayerCount: z.number().int().positive(),
    maxPlayers: z.number().int().positive(),
  }),
});

export const playerLeftPodBroadcastSchema = z.object({
  type: z.literal("pod:player_left"),
  timestamp: z.string(),
  id: z.string().optional(),
  data: z.object({
    podId: z.string(),
    playerId: z.string(),
    currentPlayerCount: z.number().int().nonnegative(),
  }),
});

export const podFullBroadcastSchema = z.object({
  type: z.literal("pod:full"),
  timestamp: z.string(),
  id: z.string().optional(),
  data: z.object({
    podId: z.string(),
    title: z.string(),
    players: z.array(
      z.object({
        userId: z.string(),
        username: z.string(),
      }),
    ),
  }),
});

export const podStatusChangedBroadcastSchema = z.object({
  type: z.literal("pod:status_changed"),
  timestamp: z.string(),
  id: z.string().optional(),
  data: z.object({
    podId: z.string(),
    oldStatus: z.string(),
    newStatus: z.enum(["waiting", "active", "finished", "cancelled"]),
  }),
});

export const chatMessageBroadcastSchema = z.object({
  type: z.literal("chat:message"),
  timestamp: z.string(),
  id: z.string().optional(),
  data: z.object({
    podId: z.string(),
    messageId: z.string(),
    userId: z.string(),
    username: z.string(),
    message: z.string(),
    timestamp: z.string(),
  }),
});

export const systemNotificationBroadcastSchema = z.object({
  type: z.literal("system:notification"),
  timestamp: z.string(),
  id: z.string().optional(),
  data: z.object({
    severity: z.enum(["info", "warning", "error", "success"]),
    title: z.string(),
    message: z.string(),
    action: z
      .object({
        label: z.string(),
        url: z.string(),
      })
      .optional(),
  }),
});

export const connectionStatusBroadcastSchema = z.object({
  type: z.literal("system:connection_status"),
  timestamp: z.string(),
  id: z.string().optional(),
  data: z.object({
    status: z.enum(["connected", "disconnected", "reconnecting"]),
    serverId: z.string().optional(),
  }),
});

// Union of all incoming WebSocket message schemas
export const websocketMessageSchema = z.discriminatedUnion("type", [
  joinCollabStreamSchema,
  phaseChangeSchema,
  coordinationEventSchema,
  collaboratorStatusUpdateSchema,
  webrtcOfferSchema,
  webrtcAnswerSchema,
  webrtcIceCandidateSchema,
  cameraToggleSchema,
  micToggleSchema,
  // Tournament room management
  joinTournamentRoomSchema,
  leaveTournamentRoomSchema,
  watchMatchSchema,
  // Pod management (client-to-server)
  joinPodSchema,
  leavePodSchema,
  sendChatSchema,
  subscribeEventSchema,
  unsubscribeEventSchema,
  // Legacy game room schemas for backward compatibility
  z.object({
    type: z.literal("join_room"),
    sessionId: z.string().min(1),
    user: z.object({
      id: z.string(),
      name: z.string(),
      avatar: z.string().optional(),
    }),
  }),
  z.object({
    type: z.literal("message"),
    sessionId: z.string().min(1),
    user: z.object({
      id: z.string(),
      name: z.string(),
      avatar: z.string().optional(),
    }),
    content: z.string().max(1000), // Limit message length
  }),
  z.object({
    type: z.literal("game_action"),
    sessionId: z.string().min(1),
    action: z.string().min(1),
    user: z.object({
      id: z.string(),
      name: z.string(),
      avatar: z.string().optional(),
    }),
    data: z.record(z.any()),
  }),
]);

export type WebSocketMessage = z.infer<typeof websocketMessageSchema>;

// Additional validation utilities
export const validateMessageRate = (
  messageType: string,
): { windowMs: number; maxMessages: number } => {
  const rateConfigs: Record<string, { windowMs: number; maxMessages: number }> =
    {
      // High-frequency messages (stricter limits)
      game_action: { windowMs: 10 * 1000, maxMessages: 20 }, // 20 per 10 seconds
      coordination_event: { windowMs: 10 * 1000, maxMessages: 15 },
      webrtc_ice_candidate: { windowMs: 10 * 1000, maxMessages: 30 },
      send_chat: { windowMs: 10 * 1000, maxMessages: 20 }, // Chat messages

      // Medium-frequency messages
      message: { windowMs: 60 * 1000, maxMessages: 30 }, // 30 per minute
      collaborator_status_update: { windowMs: 60 * 1000, maxMessages: 20 },
      subscribe_event: { windowMs: 60 * 1000, maxMessages: 30 },
      unsubscribe_event: { windowMs: 60 * 1000, maxMessages: 30 },

      // Low-frequency messages (more lenient)
      join_room: { windowMs: 60 * 1000, maxMessages: 10 },
      join_collab_stream: { windowMs: 60 * 1000, maxMessages: 10 },
      join_pod: { windowMs: 60 * 1000, maxMessages: 10 },
      leave_pod: { windowMs: 60 * 1000, maxMessages: 10 },
      phase_change: { windowMs: 60 * 1000, maxMessages: 5 }, // Very limited

      // Default for unknown message types
      default: { windowMs: 60 * 1000, maxMessages: 100 },
    };

  // No need for a separate defaultConfig; rateConfigs["default"] is always defined.
  return (
    rateConfigs[messageType] ||
    rateConfigs["default"] || { windowMs: 60 * 1000, maxMessages: 100 }
  );
};
