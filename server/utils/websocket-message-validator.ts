import { z } from "zod";
import { toLoggableError } from "@shared/utils/type-guards";
import { websocketMessageSchema } from "@shared/websocket-schemas";
import { logger } from "../logger";

// Type for WebRTC SDP (Session Description Protocol)
const webrtcSDPSchema = z.object({
  type: z.enum(["offer", "answer"]),
  sdp: z.string(),
});

// Type for WebRTC ICE candidate
const webrtcICECandidateSchema = z.object({
  candidate: z.string(),
  sdpMLineIndex: z.number().nullable(),
  sdpMid: z.string().nullable(),
});

// Outgoing WebSocket message schemas
export const outgoingMessageSchemas = {
  // Error messages
  error: z.object({
    type: z.literal("error"),
    message: z.string(),
    code: z.string().optional(),
    details: z.unknown().optional(),
  }),

  // Game room messages
  player_joined: z.object({
    type: z.literal("player_joined"),
    player: z.object({
      id: z.string(),
      name: z.string(),
      avatar: z.string().optional(),
    }),
    players: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        avatar: z.string().optional(),
      }),
    ),
  }),

  message: z.object({
    type: z.literal("message"),
    message: z.object({
      id: z.string(),
      senderId: z.string(),
      sender: z.object({
        firstName: z.string(),
        email: z.string(),
        profileImageUrl: z.string().optional(),
      }),
      content: z.string(),
      timestamp: z.string(),
      type: z.enum(["chat", "system", "notification"]),
    }),
  }),

  game_action: z.object({
    type: z.literal("game_action"),
    action: z.string(),
    player: z.string(),
    result: z.unknown().optional(),
    data: z.record(z.unknown()),
  }),

  // WebRTC messages
  webrtc_offer: z.object({
    type: z.literal("webrtc_offer"),
    fromPlayer: z.string(),
    offer: webrtcSDPSchema,
  }),

  webrtc_answer: z.object({
    type: z.literal("webrtc_answer"),
    fromPlayer: z.string(),
    answer: webrtcSDPSchema,
  }),

  webrtc_ice_candidate: z.object({
    type: z.literal("webrtc_ice_candidate"),
    fromPlayer: z.string(),
    candidate: webrtcICECandidateSchema,
  }),

  camera_status: z.object({
    type: z.literal("camera_status"),
    playerId: z.string(),
    playerName: z.string(),
    cameraOn: z.boolean(),
  }),

  mic_status: z.object({
    type: z.literal("mic_status"),
    playerId: z.string(),
    playerName: z.string(),
    micOn: z.boolean(),
  }),

  // Collaborative streaming messages
  collaborator_joined: z.object({
    type: z.literal("collaborator_joined"),
    collaborator: z.object({
      userId: z.string(),
      userName: z.string(),
      userAvatar: z.string().optional(),
      role: z.enum(["host", "co_host", "participant"]),
    }),
    activeCollaborators: z.array(
      z.object({
        userId: z.string(),
        userName: z.string(),
        userAvatar: z.string().optional(),
        status: z.string(),
      }),
    ),
  }),

  collaborator_left: z.object({
    type: z.literal("collaborator_left"),
    collaborator: z.object({
      userId: z.string(),
      userName: z.string(),
    }),
    activeCollaborators: z.array(
      z.object({
        userId: z.string(),
        userName: z.string(),
        userAvatar: z.string().optional(),
        status: z.string(),
      }),
    ),
  }),

  phase_updated: z.object({
    type: z.literal("phase_updated"),
    eventId: z.string(),
    newPhase: z.enum(["preparation", "live", "break", "wrap_up", "ended"]),
    updatedBy: z.object({
      userId: z.string(),
      userName: z.string(),
    }),
    timestamp: z.string(),
  }),

  phase_change_error: z.object({
    type: z.literal("phase_change_error"),
    eventId: z.string(),
    error: z.string(),
    code: z.string().optional(),
  }),

  coordination_event_broadcast: z.object({
    type: z.literal("coordination_event_broadcast"),
    eventId: z.string(),
    eventType: z.string(),
    eventData: z.record(z.unknown()),
    broadcastBy: z.object({
      userId: z.string(),
      userName: z.string(),
    }),
    timestamp: z.string(),
  }),

  collaborator_status_changed: z.object({
    type: z.literal("collaborator_status_changed"),
    eventId: z.string(),
    userId: z.string(),
    statusUpdate: z.record(z.unknown()),
    timestamp: z.string(),
  }),

  // Rate limiting messages
  rate_limit_warning: z.object({
    type: z.literal("rate_limit_warning"),
    message: z.string(),
    remaining: z.number(),
    resetTime: z.number(),
  }),

  // Authentication messages
  auth_required: z.object({
    type: z.literal("auth_required"),
    reason: z.string(),
    expiry: z.number().optional(),
  }),

  auth_refreshed: z.object({
    type: z.literal("auth_refreshed"),
    expiresAt: z.number(),
  }),

  // Event broadcast messages
  event_created: z.object({
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
  }),

  event_updated: z.object({
    type: z.literal("event:updated"),
    timestamp: z.string(),
    id: z.string().optional(),
    data: z.object({
      eventId: z.string(),
      changes: z.record(z.any()),
      updatedBy: z.string(),
    }),
  }),

  event_deleted: z.object({
    type: z.literal("event:deleted"),
    timestamp: z.string(),
    id: z.string().optional(),
    data: z.object({
      eventId: z.string(),
      deletedBy: z.string(),
    }),
  }),

  // Pod broadcast messages
  player_joined_pod: z.object({
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
  }),

  player_left_pod: z.object({
    type: z.literal("pod:player_left"),
    timestamp: z.string(),
    id: z.string().optional(),
    data: z.object({
      podId: z.string(),
      playerId: z.string(),
      currentPlayerCount: z.number().int().nonnegative(),
    }),
  }),

  pod_full: z.object({
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
  }),

  pod_status_changed: z.object({
    type: z.literal("pod:status_changed"),
    timestamp: z.string(),
    id: z.string().optional(),
    data: z.object({
      podId: z.string(),
      oldStatus: z.string(),
      newStatus: z.enum(["waiting", "active", "finished", "cancelled"]),
    }),
  }),

  // Chat and system messages
  chat_message: z.object({
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
  }),

  system_notification: z.object({
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
  }),

  connection_status: z.object({
    type: z.literal("system:connection_status"),
    timestamp: z.string(),
    id: z.string().optional(),
    data: z.object({
      status: z.enum(["connected", "disconnected", "reconnecting"]),
      serverId: z.string().optional(),
    }),
  }),
};

// Union of all outgoing message schemas
export const outgoingWebSocketMessageSchema = z.discriminatedUnion("type", [
  outgoingMessageSchemas.error,
  outgoingMessageSchemas.player_joined,
  outgoingMessageSchemas.message,
  outgoingMessageSchemas.game_action,
  outgoingMessageSchemas.webrtc_offer,
  outgoingMessageSchemas.webrtc_answer,
  outgoingMessageSchemas.webrtc_ice_candidate,
  outgoingMessageSchemas.camera_status,
  outgoingMessageSchemas.mic_status,
  outgoingMessageSchemas.collaborator_joined,
  outgoingMessageSchemas.collaborator_left,
  outgoingMessageSchemas.phase_updated,
  outgoingMessageSchemas.phase_change_error,
  outgoingMessageSchemas.coordination_event_broadcast,
  outgoingMessageSchemas.collaborator_status_changed,
  outgoingMessageSchemas.rate_limit_warning,
  outgoingMessageSchemas.auth_required,
  outgoingMessageSchemas.auth_refreshed,
  // New pod and event broadcast messages
  outgoingMessageSchemas.event_created,
  outgoingMessageSchemas.event_updated,
  outgoingMessageSchemas.event_deleted,
  outgoingMessageSchemas.player_joined_pod,
  outgoingMessageSchemas.player_left_pod,
  outgoingMessageSchemas.pod_full,
  outgoingMessageSchemas.pod_status_changed,
  outgoingMessageSchemas.chat_message,
  outgoingMessageSchemas.system_notification,
  outgoingMessageSchemas.connection_status,
]);

export type OutgoingWebSocketMessage = z.infer<
  typeof outgoingWebSocketMessageSchema
>;

export interface ValidationResult {
  success: boolean;
  data?: unknown;
  error?: string;
  details?: unknown;
}

export class WebSocketMessageValidator {
  /**
   * Validate incoming WebSocket message
   */
  validateIncoming(rawMessage: unknown): ValidationResult {
    try {
      const validationResult = websocketMessageSchema.safeParse(rawMessage);

      if (!validationResult.success) {
        logger.warn("Invalid incoming WebSocket message", {
          error: validationResult.error,
          message: rawMessage,
        });

        return {
          success: false,
          error: "Invalid message format",
          details: validationResult.error.format(),
        };
      }

      return {
        success: true,
        data: validationResult.data,
      };
    } catch (error) {
      logger.error(
        "Error validating incoming WebSocket message",
        toLoggableError(error),
      );
      return {
        success: false,
        error: "Validation error",
      };
    }
  }

  /**
   * Validate outgoing WebSocket message
   */
  validateOutgoing(message: unknown): ValidationResult {
    try {
      const validationResult =
        outgoingWebSocketMessageSchema.safeParse(message);

      if (!validationResult.success) {
        const messageType = (message as { type?: string })?.type || "unknown";

        logger.warn("Invalid outgoing WebSocket message", {
          error: validationResult.error,
          messageType,
          message: message,
        });

        return {
          success: false,
          error: "Invalid outgoing message format",
          details: validationResult.error.format(),
        };
      }

      return {
        success: true,
        data: validationResult.data,
      };
    } catch (error) {
      logger.error(
        "Error validating outgoing WebSocket message",
        toLoggableError(error),
      );
      return {
        success: false,
        error: "Validation error",
      };
    }
  }

  /**
   * Sanitize message content to prevent XSS and other security issues
   */
  sanitizeMessage(message: unknown): unknown {
    if (typeof message !== "object" || message === null) {
      return message;
    }

    const sanitized = { ...(message as Record<string, unknown>) };

    // Sanitize string fields that might contain user input
    const stringFields = ["content", "message", "error", "name", "userName"];

    for (const field of stringFields) {
      if (sanitized[field] && typeof sanitized[field] === "string") {
        // Simple and secure approach: HTML entity encoding
        const fieldValue = sanitized[field] as string;
        sanitized[field] = fieldValue
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#x27;")
          .replace(/\//g, "&#x2F;");

        // Length limiting for safety
        const sanitizedValue = sanitized[field] as string;
        if (sanitizedValue.length > 10000) {
          sanitized[field] = sanitizedValue.substring(0, 10000);
        }
      }
    }

    // Recursively sanitize nested objects
    for (const [key, value] of Object.entries(sanitized)) {
      if (typeof value === "object" && value !== null) {
        sanitized[key] = this.sanitizeMessage(value);
      }
    }

    return sanitized;
  }

  /**
   * Create standardized error message
   */
  createErrorMessage(
    error: string,
    code?: string,
    details?: unknown,
  ): OutgoingWebSocketMessage {
    return {
      type: "error",
      message: error,
      ...(code && { code }),
      ...(details !== undefined && { details }),
    } as OutgoingWebSocketMessage;
  }

  /**
   * Create rate limit warning message
   */
  createRateLimitWarning(
    remaining: number,
    resetTime: number,
  ): OutgoingWebSocketMessage {
    return {
      type: "rate_limit_warning",
      message: `Rate limit exceeded. ${remaining} requests remaining.`,
      remaining,
      resetTime,
    };
  }

  /**
   * Create authentication required message
   */
  createAuthRequiredMessage(
    reason: string,
    expiry?: number,
  ): OutgoingWebSocketMessage {
    return {
      type: "auth_required",
      reason,
      ...(expiry !== undefined && { expiry }),
    } as OutgoingWebSocketMessage;
  }
}

// Export singleton instance
export const messageValidator = new WebSocketMessageValidator();
