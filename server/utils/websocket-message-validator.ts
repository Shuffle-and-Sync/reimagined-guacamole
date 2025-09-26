import { z } from 'zod';
import { websocketMessageSchema } from '../../shared/websocket-schemas';
import { logger } from '../logger';

// Outgoing WebSocket message schemas
export const outgoingMessageSchemas = {
  // Error messages
  error: z.object({
    type: z.literal('error'),
    message: z.string(),
    code: z.string().optional(),
    details: z.any().optional()
  }),

  // Game room messages
  player_joined: z.object({
    type: z.literal('player_joined'),
    player: z.object({
      id: z.string(),
      name: z.string(),
      avatar: z.string().optional()
    }),
    players: z.array(z.object({
      id: z.string(),
      name: z.string(),
      avatar: z.string().optional()
    }))
  }),

  message: z.object({
    type: z.literal('message'),
    message: z.object({
      id: z.string(),
      senderId: z.string(),
      sender: z.object({
        firstName: z.string(),
        email: z.string(),
        profileImageUrl: z.string().optional()
      }),
      content: z.string(),
      timestamp: z.string(),
      type: z.enum(['chat', 'system', 'notification'])
    })
  }),

  game_action: z.object({
    type: z.literal('game_action'),
    action: z.string(),
    player: z.string(),
    result: z.any().optional(),
    data: z.record(z.any())
  }),

  // WebRTC messages
  webrtc_offer: z.object({
    type: z.literal('webrtc_offer'),
    fromPlayer: z.string(),
    offer: z.any()
  }),

  webrtc_answer: z.object({
    type: z.literal('webrtc_answer'),
    fromPlayer: z.string(),
    answer: z.any()
  }),

  webrtc_ice_candidate: z.object({
    type: z.literal('webrtc_ice_candidate'),
    fromPlayer: z.string(),
    candidate: z.any()
  }),

  camera_status: z.object({
    type: z.literal('camera_status'),
    playerId: z.string(),
    playerName: z.string(),
    cameraOn: z.boolean()
  }),

  mic_status: z.object({
    type: z.literal('mic_status'),
    playerId: z.string(),
    playerName: z.string(),
    micOn: z.boolean()
  }),

  // Collaborative streaming messages
  collaborator_joined: z.object({
    type: z.literal('collaborator_joined'),
    collaborator: z.object({
      userId: z.string(),
      userName: z.string(),
      userAvatar: z.string().optional(),
      role: z.enum(['host', 'co_host', 'participant'])
    }),
    activeCollaborators: z.array(z.object({
      userId: z.string(),
      userName: z.string(),
      userAvatar: z.string().optional(),
      status: z.string()
    }))
  }),

  collaborator_left: z.object({
    type: z.literal('collaborator_left'),
    collaborator: z.object({
      userId: z.string(),
      userName: z.string()
    }),
    activeCollaborators: z.array(z.object({
      userId: z.string(),
      userName: z.string(),
      userAvatar: z.string().optional(),
      status: z.string()
    }))
  }),

  phase_updated: z.object({
    type: z.literal('phase_updated'),
    eventId: z.string(),
    newPhase: z.enum(['preparation', 'live', 'break', 'wrap_up', 'ended']),
    updatedBy: z.object({
      userId: z.string(),
      userName: z.string()
    }),
    timestamp: z.string()
  }),

  phase_change_error: z.object({
    type: z.literal('phase_change_error'),
    eventId: z.string(),
    error: z.string(),
    code: z.string().optional()
  }),

  coordination_event_broadcast: z.object({
    type: z.literal('coordination_event_broadcast'),
    eventId: z.string(),
    eventType: z.string(),
    eventData: z.record(z.any()),
    broadcastBy: z.object({
      userId: z.string(),
      userName: z.string()
    }),
    timestamp: z.string()
  }),

  collaborator_status_changed: z.object({
    type: z.literal('collaborator_status_changed'),
    eventId: z.string(),
    userId: z.string(),
    statusUpdate: z.record(z.any()),
    timestamp: z.string()
  }),

  // Rate limiting messages
  rate_limit_warning: z.object({
    type: z.literal('rate_limit_warning'),
    message: z.string(),
    remaining: z.number(),
    resetTime: z.number()
  }),

  // Authentication messages
  auth_required: z.object({
    type: z.literal('auth_required'),
    reason: z.string(),
    expiry: z.number().optional()
  }),

  auth_refreshed: z.object({
    type: z.literal('auth_refreshed'),
    expiresAt: z.number()
  })
};

// Union of all outgoing message schemas
export const outgoingWebSocketMessageSchema = z.discriminatedUnion('type', [
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
  outgoingMessageSchemas.auth_refreshed
]);

export type OutgoingWebSocketMessage = z.infer<typeof outgoingWebSocketMessageSchema>;

export interface ValidationResult {
  success: boolean;
  data?: any;
  error?: string;
  details?: any;
}

export class WebSocketMessageValidator {
  /**
   * Validate incoming WebSocket message
   */
  validateIncoming(rawMessage: any): ValidationResult {
    try {
      const validationResult = websocketMessageSchema.safeParse(rawMessage);
      
      if (!validationResult.success) {
        logger.warn('Invalid incoming WebSocket message', {
          error: validationResult.error,
          message: rawMessage
        });
        
        return {
          success: false,
          error: 'Invalid message format',
          details: validationResult.error.format()
        };
      }

      return {
        success: true,
        data: validationResult.data
      };
    } catch (error) {
      logger.error('Error validating incoming WebSocket message', error);
      return {
        success: false,
        error: 'Validation error'
      };
    }
  }

  /**
   * Validate outgoing WebSocket message
   */
  validateOutgoing(message: any): ValidationResult {
    try {
      const validationResult = outgoingWebSocketMessageSchema.safeParse(message);
      
      if (!validationResult.success) {
        logger.warn('Invalid outgoing WebSocket message', {
          error: validationResult.error,
          messageType: message?.type,
          message: message
        });
        
        return {
          success: false,
          error: 'Invalid outgoing message format',
          details: validationResult.error.format()
        };
      }

      return {
        success: true,
        data: validationResult.data
      };
    } catch (error) {
      logger.error('Error validating outgoing WebSocket message', error);
      return {
        success: false,
        error: 'Validation error'
      };
    }
  }

  /**
   * Sanitize message content to prevent XSS and other security issues
   */
  sanitizeMessage(message: any): any {
    if (typeof message !== 'object' || message === null) {
      return message;
    }

    const sanitized = { ...message };

    // Sanitize string fields that might contain user input
    const stringFields = ['content', 'message', 'error', 'name', 'userName'];
    
    for (const field of stringFields) {
      if (sanitized[field] && typeof sanitized[field] === 'string') {
        // Remove HTML tags and script content
        sanitized[field] = sanitized[field]
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/javascript:/gi, '') // Remove javascript: URLs
          .replace(/on\w+\s*=/gi, '') // Remove event handlers
          .trim();
      }
    }

    // Recursively sanitize nested objects
    for (const [key, value] of Object.entries(sanitized)) {
      if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeMessage(value);
      }
    }

    return sanitized;
  }

  /**
   * Create standardized error message
   */
  createErrorMessage(error: string, code?: string, details?: any): OutgoingWebSocketMessage {
    return {
      type: 'error',
      message: error,
      ...(code && { code }),
      ...(details && { details })
    };
  }

  /**
   * Create rate limit warning message
   */
  createRateLimitWarning(remaining: number, resetTime: number): OutgoingWebSocketMessage {
    return {
      type: 'rate_limit_warning',
      message: `Rate limit exceeded. ${remaining} requests remaining.`,
      remaining,
      resetTime
    };
  }

  /**
   * Create authentication required message
   */
  createAuthRequiredMessage(reason: string, expiry?: number): OutgoingWebSocketMessage {
    return {
      type: 'auth_required',
      reason,
      ...(expiry && { expiry })
    };
  }
}

// Export singleton instance
export const messageValidator = new WebSocketMessageValidator();