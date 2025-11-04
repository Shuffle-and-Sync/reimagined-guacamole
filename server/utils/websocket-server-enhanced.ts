import { IncomingMessage, Server as HttpServer } from "http";
import { WebSocketServer, WebSocket, type ServerOptions } from "ws";
import { WS_SERVER_CONFIG, WS_FEATURES } from "../config/websocket.config";
import { logger } from "../logger";
import {
  authorizeSessionJoin,
  authorizeGameAction,
  validateGameActionPayload,
  sanitizeGameActionData,
} from "../middleware/game-authorization.middleware";
import { collaborativeStreaming } from "../services/collaborative-streaming.service";
import { storage } from "../storage";
import {
  ExtendedWebSocket,
  connectionManager,
} from "./websocket-connection-manager";
import { envValidator } from "./websocket-env-validation";
import {
  messageValidator,
  OutgoingWebSocketMessage,
} from "./websocket-message-validator";
import {
  defaultRateLimiter,
  highFrequencyRateLimiter,
} from "./websocket-rate-limiter";

// WebSocket message interface for type safety
// Note: This is a local union type that covers the validated incoming messages.
// The message has already been validated by websocketMessageSchema at this point,
// so we know it matches one of the expected shapes. Type assertions in handlers
// are used to narrow to specific message types after the discriminated union check.
interface WebSocketMessage {
  type: string;
  sessionId?: string;
  user?: unknown;
  content?: unknown;
  action?: string;
  data?: unknown;
  eventId?: string;
  newPhase?: string;
  eventType?: string;
  eventData?: unknown;
  statusUpdate?: unknown;
  [key: string]: unknown;
}

export class EnhancedWebSocketServer {
  private wss: WebSocketServer;
  private isShuttingDown = false;
  private compressionEnabled: boolean;

  constructor(httpServer: HttpServer) {
    this.compressionEnabled = WS_FEATURES.COMPRESSION_ENABLED;

    // Configure WebSocket server with optional compression
    const wsConfig: ServerOptions = {
      server: httpServer,
      path: WS_SERVER_CONFIG.PATH,
      maxPayload: WS_SERVER_CONFIG.MAX_PAYLOAD,
    };

    // Add compression configuration if enabled
    if (this.compressionEnabled) {
      wsConfig.perMessageDeflate = WS_SERVER_CONFIG.PER_MESSAGE_DEFLATE;
    }

    this.wss = new WebSocketServer(wsConfig);

    this.setupWebSocketServer();
    this.setupGracefulShutdown();
  }

  private setupWebSocketServer(): void {
    this.wss.on("connection", async (ws: WebSocket, req: IncomingMessage) => {
      if (this.isShuttingDown) {
        ws.close(1012, "Server is shutting down");
        return;
      }

      await this.handleConnection(ws as ExtendedWebSocket, req);
    });

    this.wss.on("error", (error) => {
      logger.error(
        "WebSocket server error",
        error instanceof Error ? error : new Error(String(error)),
      );
    });

    logger.info("Enhanced WebSocket server initialized", {
      path: WS_SERVER_CONFIG.PATH,
      maxPayload: `${WS_SERVER_CONFIG.MAX_PAYLOAD / 1024}KB`,
      compressionEnabled: this.compressionEnabled,
      compressionThreshold: this.compressionEnabled
        ? `${WS_SERVER_CONFIG.PER_MESSAGE_DEFLATE.threshold / 1024}KB`
        : "N/A",
    });
  }

  private async handleConnection(
    ws: ExtendedWebSocket,
    req: IncomingMessage,
  ): Promise<void> {
    logger.info("WebSocket connection attempt", {
      origin: req.headers.origin,
      userAgent: req.headers["user-agent"],
    });

    try {
      // Validate environment and origin
      const authResult = await this.authenticateConnection(ws, req);
      if (!authResult.success) {
        this.closeConnectionWithError(
          ws,
          authResult.error || "Authentication failed",
          authResult.code,
        );
        return;
      }

      if (!authResult.userId) {
        this.closeConnectionWithError(ws, "User ID not found", "NO_USER_ID");
        return;
      }

      // Register connection with manager
      const connectionId = connectionManager.registerConnection(
        ws,
        authResult.userId,
        authResult.token,
      );

      logger.info("WebSocket connection established", {
        connectionId,
        userId: authResult.userId,
      });

      // Set up message handling
      this.setupMessageHandling(ws, connectionId);
    } catch (error) {
      logger.error(
        "WebSocket connection setup failed",
        error instanceof Error ? error : new Error(String(error)),
      );
      this.closeConnectionWithError(
        ws,
        "Connection setup failed",
        "SETUP_ERROR",
      );
    }
  }

  private async authenticateConnection(
    _ws: WebSocket,
    req: IncomingMessage,
  ): Promise<{
    success: boolean;
    userId?: string;
    token?: string;
    error?: string;
    code?: string;
  }> {
    // Validate environment configuration
    const envValidation = envValidator.validateRequiredEnvironment();
    if (!envValidation.valid) {
      logger.error("WebSocket environment validation failed", {
        errors: envValidation.errors,
      });
      return {
        success: false,
        error: "Server configuration error",
        code: "CONFIG_ERROR",
      };
    }

    // Validate origin
    const origin = req.headers.origin;
    if (!origin) {
      return {
        success: false,
        error: "Origin header required",
        code: "ORIGIN_REQUIRED",
      };
    }

    if (!envValidator.isOriginAllowed(origin)) {
      logger.warn("WebSocket connection rejected - origin not allowed", {
        origin,
        allowedOrigins: envValidator.validateAndGetConfig().allowedOrigins,
      });
      return {
        success: false,
        error: "Origin not allowed",
        code: "ORIGIN_NOT_ALLOWED",
      };
    }

    // Extract and validate session
    const cookies = req.headers.cookie;
    if (!cookies) {
      return {
        success: false,
        error: "Authentication required - no cookies",
        code: "NO_COOKIES",
      };
    }

    try {
      const authSessionUrl = envValidator.getAuthSessionUrl();
      const response = await fetch(authSessionUrl, {
        headers: { cookie: cookies },
      });

      if (!response.ok) {
        logger.warn(
          "WebSocket authentication failed - session endpoint error",
          {
            status: response.status,
            statusText: response.statusText,
          },
        );
        return {
          success: false,
          error: "Session validation failed",
          code: "SESSION_INVALID",
        };
      }

      const session = await response.json();

      if (!session?.user?.id) {
        return {
          success: false,
          error: "No valid user session",
          code: "NO_USER_SESSION",
        };
      }

      return {
        success: true,
        userId: session.user.id,
        token: cookies, // Store cookies as token for now
      };
    } catch (error) {
      logger.error(
        "WebSocket authentication error",
        error instanceof Error ? error : new Error(String(error)),
      );
      return {
        success: false,
        error: "Authentication error",
        code: "AUTH_ERROR",
      };
    }
  }

  private setupMessageHandling(
    ws: ExtendedWebSocket,
    connectionId: string,
  ): void {
    ws.on("message", async (data: Buffer) => {
      try {
        // Update connection activity
        connectionManager.updateActivity(connectionId);

        // Check for auth expiration
        if (connectionManager.isAuthExpired(connectionId)) {
          this.sendMessage(
            ws,
            messageValidator.createAuthRequiredMessage(
              "Authentication expired, please reconnect",
            ),
          );
          ws.close(1008, "Authentication expired");
          return;
        }

        // Parse and validate incoming message
        const rawMessage = JSON.parse(data.toString());
        const validationResult = messageValidator.validateIncoming(rawMessage);

        if (!validationResult.success) {
          this.sendMessage(
            ws,
            messageValidator.createErrorMessage(
              validationResult.error || "Validation failed",
              "VALIDATION_ERROR",
              validationResult.details,
            ),
          );
          return;
        }

        const message = validationResult.data as WebSocketMessage;

        // Apply rate limiting
        const rateLimiter = this.selectRateLimiter(message.type);
        if (!rateLimiter.isAllowed(connectionId, message.type)) {
          const status = rateLimiter.getStatus(connectionId);
          this.sendMessage(
            ws,
            messageValidator.createRateLimitWarning(
              status.remaining,
              status.resetTime,
            ),
          );
          return;
        }

        // Process the message
        await this.processMessage(ws, connectionId, message);
      } catch (error) {
        logger.error(
          "Error processing WebSocket message",
          error instanceof Error ? error : new Error(String(error)),
          {
            connectionId,
            userId: ws.userId,
          },
        );

        this.sendMessage(
          ws,
          messageValidator.createErrorMessage(
            "Message processing failed",
            "PROCESSING_ERROR",
          ),
        );
      }
    });

    ws.on("close", (code: number, reason: Buffer) => {
      logger.info("WebSocket connection closed", {
        connectionId,
        userId: ws.userId,
        code,
        reason: reason.toString(),
      });
      connectionManager.removeConnection(connectionId);
    });

    ws.on("error", (error: Error) => {
      logger.error(
        "WebSocket connection error",
        error instanceof Error ? error : new Error(String(error)),
        {
          connectionId,
          userId: ws.userId,
        },
      );
    });

    // Handle ping/pong for connection health
    ws.on("pong", () => {
      connectionManager.updateActivity(connectionId);
    });
  }

  private selectRateLimiter(messageType: string) {
    // Use high-frequency rate limiter for certain message types
    const highFrequencyTypes = [
      "game_action",
      "coordination_event",
      "webrtc_ice_candidate",
    ];

    return highFrequencyTypes.includes(messageType)
      ? highFrequencyRateLimiter
      : defaultRateLimiter;
  }

  private async processMessage(
    ws: ExtendedWebSocket,
    connectionId: string,
    message: WebSocketMessage,
  ): Promise<void> {
    switch (message.type) {
      case "join_room":
        await this.handleJoinRoom(ws, connectionId, message);
        break;

      case "message":
        await this.handleChatMessage(ws, connectionId, message);
        break;

      case "game_action":
        await this.handleGameAction(ws, connectionId, message);
        break;

      case "join_collab_stream":
        await this.handleJoinCollabStream(ws, connectionId, message);
        break;

      case "phase_change":
        await this.handlePhaseChange(ws, connectionId, message);
        break;

      case "coordination_event":
        await this.handleCoordinationEvent(ws, connectionId, message);
        break;

      case "collaborator_status_update":
        await this.handleCollaboratorStatusUpdate(ws, connectionId, message);
        break;

      default:
        logger.warn("Unknown WebSocket message type", {
          type: message.type,
          connectionId,
        });
    }
  }

  private async handleJoinRoom(
    ws: ExtendedWebSocket,
    connectionId: string,
    message: WebSocketMessage,
  ): Promise<void> {
    const { sessionId, user } = message as {
      sessionId: string;
      user: { id: string; name: string; avatar?: string };
    };

    // Verify user matches authenticated user
    if (user.id !== ws.userId) {
      this.sendMessage(
        ws,
        messageValidator.createErrorMessage(
          "User ID mismatch",
          "AUTH_MISMATCH",
        ),
      );
      return;
    }

    // Authorize session join
    const authResult = await authorizeSessionJoin(sessionId, user.id);
    if (!authResult.authorized) {
      logger.warn("Unauthorized session join attempt", {
        sessionId,
        userId: user.id,
        reason: authResult.reason,
      });
      this.sendMessage(
        ws,
        messageValidator.createErrorMessage(
          authResult.reason || "Not authorized to join this session",
          "UNAUTHORIZED",
        ),
      );
      return;
    }

    await connectionManager.joinGameRoom(connectionId, sessionId);

    // Get current room members
    const roomConnections = connectionManager.getGameRoomConnections(sessionId);
    const players = roomConnections
      .filter((conn) => conn.userId && conn.userName)
      .map((conn) => ({
        id: conn.userId as string,
        name: conn.userName as string,
        avatar: conn.userAvatar,
      }));

    const joinMessage = {
      type: "player_joined" as const,
      player: { id: user.id, name: user.name, avatar: user.avatar },
      players,
    };

    // Broadcast to all players in room
    connectionManager.broadcastToGameRoom(sessionId, joinMessage);
  }

  private async handleChatMessage(
    ws: ExtendedWebSocket,
    _connectionId: string,
    message: WebSocketMessage,
  ): Promise<void> {
    const { sessionId, user, content } = message as {
      sessionId: string;
      user: { id: string; name: string; avatar?: string };
      content: string;
    };

    if (user.id !== ws.userId) {
      this.sendMessage(
        ws,
        messageValidator.createErrorMessage(
          "User ID mismatch",
          "AUTH_MISMATCH",
        ),
      );
      return;
    }

    const chatMessage = {
      type: "message" as const,
      message: {
        id: Date.now().toString(),
        senderId: user.id,
        sender: {
          firstName: user.name.split(" ")[0],
          email: user.name,
          profileImageUrl: user.avatar,
        },
        content: (
          messageValidator.sanitizeMessage({ content }) as { content: string }
        ).content,
        timestamp: new Date().toISOString(),
        type: "chat" as const,
      },
    };

    connectionManager.broadcastToGameRoom(sessionId, chatMessage);
  }

  private async handleGameAction(
    ws: ExtendedWebSocket,
    _connectionId: string,
    message: WebSocketMessage,
  ): Promise<void> {
    const { sessionId, action, user, data } = message as {
      sessionId: string;
      action: string;
      user: { id: string; name: string; avatar?: string };
      data?: Record<string, unknown>;
    };

    if (user.id !== ws.userId) {
      this.sendMessage(
        ws,
        messageValidator.createErrorMessage(
          "User ID mismatch",
          "AUTH_MISMATCH",
        ),
      );
      return;
    }

    // Validate action payload
    const actionPayload = {
      ...(data || {}),
      type: action,
      sessionId,
      userId: user.id,
    };

    const validationResult = validateGameActionPayload(actionPayload);
    if (!validationResult.valid) {
      logger.warn("Invalid game action payload", {
        sessionId,
        userId: user.id,
        action,
        error: validationResult.error,
      });
      this.sendMessage(
        ws,
        messageValidator.createErrorMessage(
          validationResult.error || "Invalid action payload",
          "VALIDATION_ERROR",
        ),
      );
      return;
    }

    // Authorize game action
    const authResult = await authorizeGameAction(sessionId, user.id, {
      type: action,
      ...data,
    });
    if (!authResult.authorized) {
      logger.warn("Unauthorized game action attempt", {
        sessionId,
        userId: user.id,
        action,
        reason: authResult.reason,
      });
      this.sendMessage(
        ws,
        messageValidator.createErrorMessage(
          authResult.reason || "Not authorized to perform this action",
          "UNAUTHORIZED",
        ),
      );
      return;
    }

    // Sanitize action data
    const sanitizedData = data ? sanitizeGameActionData(data) : {};

    const actionMessage = {
      type: "game_action" as const,
      action,
      player: user.name,
      result: sanitizedData.result,
      data: sanitizedData,
    };

    connectionManager.broadcastToGameRoom(sessionId, actionMessage);
  }

  private async handleJoinCollabStream(
    ws: ExtendedWebSocket,
    connectionId: string,
    message: WebSocketMessage,
  ): Promise<void> {
    const { eventId } = message as { eventId: string };

    try {
      // Validate event access
      const event = await storage.getCollaborativeStreamEvent(eventId);
      if (!event) {
        this.sendMessage(
          ws,
          messageValidator.createErrorMessage(
            "Event not found",
            "EVENT_NOT_FOUND",
          ),
        );
        return;
      }

      const collaborators = await storage.getStreamCollaborators(eventId);
      const userCollaborator = collaborators.find(
        (c) => c.userId === ws.userId,
      );
      if (!userCollaborator) {
        this.sendMessage(
          ws,
          messageValidator.createErrorMessage(
            "Access denied - not a collaborator",
            "ACCESS_DENIED",
          ),
        );
        return;
      }

      await connectionManager.joinCollaborativeRoom(connectionId, eventId);

      // Get active collaborators
      const roomConnections =
        connectionManager.getCollaborativeRoomConnections(eventId);
      const activeCollaborators = roomConnections
        .filter((conn) => conn.userId && conn.userName)
        .map((conn) => ({
          userId: conn.userId as string,
          userName: conn.userName as string,
          userAvatar: conn.userAvatar,
          status: "connected",
        }));

      if (!ws.userId || !ws.userName) {
        logger.error("WebSocket missing userId or userName for collaboration");
        return;
      }

      const joinMessage = {
        type: "collaborator_joined" as const,
        collaborator: {
          userId: ws.userId,
          userName: ws.userName,
          userAvatar: ws.userAvatar,
          role: userCollaborator.role,
        },
        activeCollaborators,
      };

      connectionManager.broadcastToCollaborativeRoom(eventId, joinMessage);
    } catch (error) {
      logger.error(
        "Failed to handle collab stream join",
        error instanceof Error ? error : new Error(String(error)),
      );
      this.sendMessage(
        ws,
        messageValidator.createErrorMessage(
          "Failed to join collaborative stream",
          "JOIN_FAILED",
        ),
      );
    }
  }

  private async handlePhaseChange(
    ws: ExtendedWebSocket,
    _connectionId: string,
    message: WebSocketMessage,
  ): Promise<void> {
    const { eventId, newPhase } = message as {
      eventId: string;
      newPhase: string;
    };

    try {
      // Verify authorization
      const event = await storage.getCollaborativeStreamEvent(eventId);
      if (!event) {
        this.sendMessage(
          ws,
          messageValidator.createErrorMessage(
            "Event not found",
            "EVENT_NOT_FOUND",
          ),
        );
        return;
      }

      const collaborators = await storage.getStreamCollaborators(eventId);
      const userCollaborator = collaborators.find(
        (c) => c.userId === ws.userId,
      );

      const isHost = event.organizerId === ws.userId; // Note: schema uses organizerId not creatorId
      const isCoHost = userCollaborator?.role === "co_host";

      if (!isHost && !isCoHost) {
        this.sendMessage(ws, {
          type: "phase_change_error",
          eventId,
          error: "Access denied - only hosts and co-hosts can change phases",
          code: "ACCESS_DENIED",
        });
        return;
      }

      if (!ws.userId || !ws.userName) {
        logger.error("WebSocket missing userId or userName for phase update");
        return;
      }

      // Update phase in service
      await collaborativeStreaming.updateCoordinationPhase(
        eventId,
        newPhase as "preparation" | "live" | "break" | "wrap_up" | "ended",
        ws.userId,
      );

      const phaseMessage = {
        type: "phase_updated" as const,
        eventId,
        newPhase,
        updatedBy: {
          userId: ws.userId,
          userName: ws.userName,
        },
        timestamp: new Date().toISOString(),
      };

      connectionManager.broadcastToCollaborativeRoom(eventId, phaseMessage);
    } catch (error) {
      logger.error(
        "Failed to handle phase change",
        error instanceof Error ? error : new Error(String(error)),
      );
      this.sendMessage(ws, {
        type: "phase_change_error",
        eventId,
        error: "Failed to change phase",
        code: "PHASE_CHANGE_FAILED",
      });
    }
  }

  private async handleCoordinationEvent(
    ws: ExtendedWebSocket,
    _connectionId: string,
    message: WebSocketMessage,
  ): Promise<void> {
    const { eventId, eventType, eventData } = message as {
      eventId: string;
      eventType: string;
      eventData: Record<string, unknown>;
    };

    if (!ws.userId || !ws.userName) {
      logger.error(
        "WebSocket missing userId or userName for coordination event",
      );
      return;
    }

    const broadcastMessage = {
      type: "coordination_event_broadcast" as const,
      eventId,
      eventType,
      eventData,
      broadcastBy: {
        userId: ws.userId,
        userName: ws.userName,
      },
      timestamp: new Date().toISOString(),
    };

    connectionManager.broadcastToCollaborativeRoom(eventId, broadcastMessage);
  }

  private async handleCollaboratorStatusUpdate(
    ws: ExtendedWebSocket,
    _connectionId: string,
    message: WebSocketMessage,
  ): Promise<void> {
    const { eventId, statusUpdate } = message as {
      eventId: string;
      statusUpdate: Record<string, unknown>;
    };

    if (!ws.userId) {
      logger.error("WebSocket missing userId for status update");
      return;
    }

    const statusMessage = {
      type: "collaborator_status_changed" as const,
      eventId,
      userId: ws.userId,
      statusUpdate,
      timestamp: new Date().toISOString(),
    };

    connectionManager.broadcastToCollaborativeRoom(eventId, statusMessage);
  }

  private sendMessage(
    ws: WebSocket,
    message: OutgoingWebSocketMessage | any,
  ): void {
    if (ws.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      const validation = messageValidator.validateOutgoing(message);
      if (!validation.success) {
        logger.error("Attempted to send invalid outgoing message", {
          error: validation.error,
          messageType: message?.type,
        });
        return;
      }

      ws.send(JSON.stringify(validation.data));
    } catch (error) {
      logger.error(
        "Failed to send WebSocket message",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  private closeConnectionWithError(
    ws: WebSocket,
    error: string,
    code?: string,
  ): void {
    try {
      this.sendMessage(ws, messageValidator.createErrorMessage(error, code));
      ws.close(1008, error);
    } catch (closeError) {
      logger.error(
        "Failed to close WebSocket connection cleanly",
        closeError instanceof Error
          ? closeError
          : new Error(String(closeError)),
      );
      ws.terminate();
    }
  }

  private setupGracefulShutdown(): void {
    process.on("SIGTERM", () => this.gracefulShutdown());
    process.on("SIGINT", () => this.gracefulShutdown());
  }

  private gracefulShutdown(): void {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;
    logger.info("Starting WebSocket server graceful shutdown");

    // Close all WebSocket connections
    this.wss.clients.forEach((ws) => {
      ws.close(1012, "Server is shutting down");
    });

    // Close the WebSocket server
    this.wss.close(() => {
      logger.info("WebSocket server closed");
    });
  }

  getStats() {
    return {
      connections: this.wss.clients.size,
      compression: {
        enabled: this.compressionEnabled,
        threshold: this.compressionEnabled
          ? WS_SERVER_CONFIG.PER_MESSAGE_DEFLATE.threshold
          : null,
        level: this.compressionEnabled
          ? WS_SERVER_CONFIG.PER_MESSAGE_DEFLATE.zlibDeflateOptions.level
          : null,
      },
      connectionManager: connectionManager.getStats(),
      batching: connectionManager.getBatchingMetrics(),
      rateLimiter: {
        default: defaultRateLimiter.getStats(),
        highFrequency: highFrequencyRateLimiter.getStats(),
      },
    };
  }
}

export default EnhancedWebSocketServer;
