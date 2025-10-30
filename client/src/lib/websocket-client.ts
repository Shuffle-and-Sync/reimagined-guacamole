import { queryClient } from "@/lib/queryClient";
import { logger } from "./logger";

// Type definitions for WebSocket message payloads
export interface GameActionData {
  [key: string]: unknown;
}

export interface CollaboratorInfo {
  id: string;
  name: string;
  status?: string;
  platform?: string;
}

export interface CoordinationEventData {
  [key: string]: unknown;
}

export interface StatusUpdate {
  status: string;
  isLive?: boolean;
  platform?: string;
  timestamp?: number;
}

export interface WebRTCOffer {
  type: "offer";
  sdp: string;
}

export interface WebRTCAnswer {
  type: "answer";
  sdp: string;
}

export interface WebRTCIceCandidate {
  candidate: string;
  sdpMLineIndex?: number | null;
  sdpMid?: string | null;
}

// Event callback data types
export interface CollaboratorJoinedData {
  type: "collaborator_joined";
  eventId: string;
  collaborator: CollaboratorInfo;
}

export interface CollaboratorLeftData {
  type: "collaborator_left";
  eventId: string;
  collaboratorId: string;
}

export interface PhaseUpdatedData {
  type: "phase_updated";
  eventId: string;
  newPhase: string;
  hostUserId?: string;
}

export interface CoordinationEventBroadcast {
  type: "coordination_event_broadcast";
  eventId: string;
  eventType: string;
  eventData: CoordinationEventData;
}

export interface CollaboratorStatusChanged {
  type: "collaborator_status_changed";
  eventId: string;
  userId: string;
  statusUpdate: StatusUpdate;
}

export interface PhaseChangeError {
  type: "phase_change_error";
  eventId: string;
  error: string;
  phase?: string;
}

export type WebSocketEventData =
  | CollaboratorJoinedData
  | CollaboratorLeftData
  | PhaseUpdatedData
  | CoordinationEventBroadcast
  | CollaboratorStatusChanged
  | PhaseChangeError
  | WebSocketMessage;

export type WebSocketMessage =
  // Game room messages
  | {
      type: "join_room";
      sessionId: string;
      user: { id: string; name: string; avatar?: string };
    }
  | {
      type: "message";
      sessionId: string;
      user: { id: string; name: string; avatar?: string };
      content: string;
    }
  | {
      type: "game_action";
      sessionId: string;
      action: string;
      user: { id: string; name: string; avatar?: string };
      data: GameActionData;
    }
  // Collaborative streaming messages
  | {
      type: "join_collab_stream";
      eventId: string;
      collaborator?: CollaboratorInfo;
    }
  | {
      type: "phase_change";
      eventId: string;
      newPhase: string;
      hostUserId?: string;
    }
  | {
      type: "coordination_event";
      eventId: string;
      eventType: string;
      eventData: CoordinationEventData;
    }
  | {
      type: "collaborator_status_update";
      eventId: string;
      userId?: string;
      statusUpdate: StatusUpdate;
    }
  // WebRTC messages
  | {
      type: "webrtc_offer";
      sessionId: string;
      targetPlayer: string;
      offer: WebRTCOffer;
    }
  | {
      type: "webrtc_answer";
      sessionId: string;
      targetPlayer: string;
      answer: WebRTCAnswer;
    }
  | {
      type: "webrtc_ice_candidate";
      sessionId: string;
      targetPlayer: string;
      candidate: WebRTCIceCandidate;
    }
  | {
      type: "camera_toggle";
      sessionId: string;
      user: { id: string; name: string };
      cameraOn: boolean;
    }
  | {
      type: "mic_toggle";
      sessionId: string;
      user: { id: string; name: string };
      micOn: boolean;
    };

export type WebSocketEventListener<T = WebSocketEventData> = (data: T) => void;

// Connection state types
export type ConnectionState =
  | "connected"
  | "disconnected"
  | "reconnecting"
  | "failed";

export type ConnectionStateCallback = (
  state: ConnectionState,
  attempt?: number,
) => void;

// Reconnection state interface
export interface ReconnectionState {
  gameRoomId?: string;
  collaborativeRoomId?: string;
  pendingMessages: Array<{
    message: WebSocketMessage;
    timestamp: number;
    id: string;
  }>;
  lastMessageId?: string;
}

// Queued message interface
export interface QueuedMessage {
  message: WebSocketMessage;
  timestamp: number;
  id: string;
}

class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private eventListeners: Map<string, Set<WebSocketEventListener>> = new Map();
  private connectionPromise: Promise<void> | null = null;

  // Reconnection state management
  private reconnectionState: ReconnectionState = {
    pendingMessages: [],
  };

  // Connection state callbacks
  private connectionStateCallbacks: Set<ConnectionStateCallback> = new Set();
  private currentConnectionState: ConnectionState = "disconnected";

  // Message ID tracking for deduplication
  private messageIdCounter = 0;
  private processedMessageIds: Set<string> = new Set();
  private readonly MAX_PROCESSED_IDS = 1000; // Prevent memory leak

  async connect(): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    // Set state to reconnecting if we have prior attempts
    if (this.reconnectAttempts > 0) {
      this.setConnectionState("reconnecting", this.reconnectAttempts);
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        const wsUrl = this.buildWebSocketUrl();

        logger.info("Attempting WebSocket connection", { url: wsUrl });
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          logger.info("WebSocket connected successfully");
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;
          this.setConnectionState("connected");

          // Recover state after reconnection
          this.recoverConnectionState();

          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            logger.error("Failed to parse WebSocket message", error);
          }
        };

        this.ws.onclose = (event) => {
          logger.info("WebSocket connection closed", {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
          });
          this.connectionPromise = null;

          // Update connection state
          if (event.code === 1000) {
            // Manual disconnect
            this.setConnectionState("disconnected");
          } else {
            this.setConnectionState("disconnected");
          }

          // Attempt to reconnect if not a manual close
          if (
            event.code !== 1000 &&
            this.reconnectAttempts < this.maxReconnectAttempts
          ) {
            this.scheduleReconnect();
          } else if (
            event.code !== 1000 &&
            this.reconnectAttempts >= this.maxReconnectAttempts
          ) {
            this.setConnectionState("failed");
          }
        };

        this.ws.onerror = (error) => {
          logger.error("WebSocket connection error", error);

          // Try fallback URL construction if primary fails
          if (this.reconnectAttempts === 0) {
            this.connectionPromise = null;
            this.attemptFallbackConnection().then(resolve).catch(reject);
          } else {
            reject(
              new Error(
                `WebSocket connection failed after ${this.reconnectAttempts} attempts`,
              ),
            );
          }
        };
      } catch (error) {
        logger.error("Failed to create WebSocket connection", error);
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  /**
   * Set connection state and notify all registered callbacks
   */
  private setConnectionState(state: ConnectionState, attempt?: number): void {
    if (this.currentConnectionState !== state) {
      this.currentConnectionState = state;
      logger.info("Connection state changed", { state, attempt });

      this.connectionStateCallbacks.forEach((callback) => {
        try {
          callback(state, attempt);
        } catch (error) {
          logger.error("Error in connection state callback", error);
        }
      });
    }
  }

  /**
   * Register a callback to be notified of connection state changes
   */
  onConnectionStateChange(callback: ConnectionStateCallback): () => void {
    this.connectionStateCallbacks.add(callback);

    // Immediately notify of current state
    callback(this.currentConnectionState, this.reconnectAttempts);

    // Return unsubscribe function
    return () => {
      this.connectionStateCallbacks.delete(callback);
    };
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return this.currentConnectionState;
  }

  /**
   * Recover connection state after successful reconnection
   */
  private recoverConnectionState(): void {
    logger.info("Recovering connection state", {
      gameRoomId: this.reconnectionState.gameRoomId,
      collaborativeRoomId: this.reconnectionState.collaborativeRoomId,
      pendingMessages: this.reconnectionState.pendingMessages.length,
    });

    // Rejoin game room if we were in one
    if (this.reconnectionState.gameRoomId) {
      logger.info("Rejoining game room", {
        sessionId: this.reconnectionState.gameRoomId,
      });
      // The room join will be triggered by the application
      // We just preserve the state here
    }

    // Rejoin collaborative room if we were in one
    if (this.reconnectionState.collaborativeRoomId) {
      logger.info("Rejoining collaborative room", {
        eventId: this.reconnectionState.collaborativeRoomId,
      });
      // The room join will be triggered by the application
      // We just preserve the state here
    }

    // Replay pending messages in order
    if (this.reconnectionState.pendingMessages.length > 0) {
      logger.info("Replaying pending messages", {
        count: this.reconnectionState.pendingMessages.length,
      });

      const messagesToReplay = [...this.reconnectionState.pendingMessages];
      this.reconnectionState.pendingMessages = [];

      messagesToReplay
        .sort((a, b) => a.timestamp - b.timestamp)
        .forEach(({ message, id }) => {
          logger.debug("Replaying message", { type: message.type, id });
          this.send(message, id);
        });
    }
  }

  /**
   * Store room IDs for reconnection recovery
   */
  setGameRoomId(sessionId: string | null): void {
    if (sessionId) {
      this.reconnectionState.gameRoomId = sessionId;
      logger.debug("Game room ID stored for reconnection", { sessionId });
    } else {
      delete this.reconnectionState.gameRoomId;
      logger.debug("Game room ID cleared");
    }
  }

  setCollaborativeRoomId(eventId: string | null): void {
    if (eventId) {
      this.reconnectionState.collaborativeRoomId = eventId;
      logger.debug("Collaborative room ID stored for reconnection", {
        eventId,
      });
    } else {
      delete this.reconnectionState.collaborativeRoomId;
      logger.debug("Collaborative room ID cleared");
    }
  }

  /**
   * Get stored room IDs
   */
  getReconnectionState(): Readonly<ReconnectionState> {
    return { ...this.reconnectionState };
  }

  private buildWebSocketUrl(): string {
    const host = window.location.host;
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;

    // Validate host is not undefined or empty
    if (
      !host ||
      host === "undefined" ||
      !hostname ||
      hostname === "undefined"
    ) {
      throw new Error("Invalid host configuration for WebSocket connection");
    }

    // Determine if we should use secure WebSocket
    const isSecure =
      protocol === "https:" ||
      (hostname !== "localhost" &&
        !hostname.startsWith("127.") &&
        !hostname.includes("replit.dev"));

    const wsProtocol = isSecure ? "wss:" : "ws:";
    const wsUrl = `${wsProtocol}//${host}/ws`;

    logger.debug("Built WebSocket URL", {
      wsUrl,
      protocol,
      hostname,
      host,
      isSecure,
    });

    return wsUrl;
  }

  private async attemptFallbackConnection(): Promise<void> {
    logger.info("Attempting fallback WebSocket connection");

    const fallbackUrls = this.buildFallbackUrls();

    for (const url of fallbackUrls) {
      try {
        logger.info("Trying fallback URL", { url });

        await new Promise<void>((resolve, reject) => {
          const fallbackWs = new WebSocket(url);

          const cleanup = () => {
            fallbackWs.onopen = null;
            fallbackWs.onerror = null;
            fallbackWs.onclose = null;
          };

          fallbackWs.onopen = () => {
            logger.info("Fallback WebSocket connection successful", { url });
            cleanup();

            // Replace the main WebSocket with the successful fallback
            this.ws = fallbackWs;
            this.setupWebSocketHandlers();
            resolve();
          };

          fallbackWs.onerror = (error) => {
            logger.warn("Fallback WebSocket connection failed", { url, error });
            cleanup();
            reject(new Error(`Fallback connection failed: ${url}`));
          };

          // Set a timeout for the fallback attempt
          setTimeout(() => {
            if (fallbackWs.readyState === WebSocket.CONNECTING) {
              cleanup();
              fallbackWs.close();
              reject(new Error(`Fallback connection timeout: ${url}`));
            }
          }, 5000);
        });

        // If we get here, the fallback connection succeeded
        return;
      } catch (error) {
        logger.debug("Fallback URL failed, trying next", { url, error });
        continue;
      }
    }

    throw new Error("All fallback WebSocket connection attempts failed");
  }

  private buildFallbackUrls(): string[] {
    const hostname = window.location.hostname;
    const port =
      window.location.port ||
      (window.location.protocol === "https:" ? "443" : "80");

    const fallbackUrls: string[] = [];

    // Try different protocol combinations
    if (hostname === "localhost" || hostname.startsWith("127.")) {
      // For localhost, try both ws and wss
      fallbackUrls.push(`ws://${hostname}:${port}/ws`);
      fallbackUrls.push(`wss://${hostname}:${port}/ws`);
      fallbackUrls.push(`ws://localhost:5000/ws`); // Default dev port
      fallbackUrls.push(`ws://127.0.0.1:5000/ws`);
    } else {
      // For remote hosts, prefer wss but try ws as fallback
      fallbackUrls.push(`wss://${hostname}:${port}/ws`);
      fallbackUrls.push(`ws://${hostname}:${port}/ws`);
      if (port !== "80" && port !== "443") {
        fallbackUrls.push(`wss://${hostname}/ws`);
        fallbackUrls.push(`ws://${hostname}/ws`);
      }
    }

    return fallbackUrls;
  }

  private setupWebSocketHandlers(): void {
    if (!this.ws) return;

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        logger.error("Failed to parse WebSocket message", error);
      }
    };

    this.ws.onclose = (event) => {
      logger.info("WebSocket connection closed", {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
      });
      this.connectionPromise = null;

      // Attempt to reconnect if not a manual close
      if (
        event.code !== 1000 &&
        this.reconnectAttempts < this.maxReconnectAttempts
      ) {
        this.scheduleReconnect();
      }
    };
  }

  private scheduleReconnect(): void {
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      30000,
    );

    logger.info(`Scheduling WebSocket reconnect in ${delay}ms`, {
      attempt: this.reconnectAttempts + 1,
      maxAttempts: this.maxReconnectAttempts,
    });

    setTimeout(() => {
      this.reconnectAttempts++;
      this.connect().catch((error) => {
        logger.error("WebSocket reconnect failed", error);
      });
    }, delay);
  }

  private handleMessage(data: WebSocketEventData): void {
    logger.debug("WebSocket message received", { type: data.type });

    // Handle collaborative streaming specific messages with proper cache invalidation
    switch (data.type) {
      case "collaborator_joined":
        // Invalidate collaborator queries for the specific event
        queryClient.invalidateQueries({
          queryKey: [
            "/api/collaborative-streams",
            data.eventId,
            "collaborators",
          ],
        });
        break;
      case "collaborator_left":
        // Invalidate collaborator queries for the specific event
        queryClient.invalidateQueries({
          queryKey: [
            "/api/collaborative-streams",
            data.eventId,
            "collaborators",
          ],
        });
        break;
      case "phase_updated":
        // Invalidate coordination status for the specific event
        queryClient.invalidateQueries({
          queryKey: [
            "/api/collaborative-streams",
            data.eventId,
            "coordination",
          ],
        });
        break;
      case "coordination_event_broadcast":
      case "collaborator_status_changed":
        // Invalidate coordination status and suggestions
        queryClient.invalidateQueries({
          queryKey: ["/api/collaborative-streams", data.eventId],
        });
        break;
      case "phase_change_error":
        logger.error("Phase change error", data);
        break;
    }

    // Notify event listeners
    const listeners = this.eventListeners.get(data.type);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(data);
        } catch (error) {
          logger.error("Error in WebSocket event listener", error, {
            eventType: data.type,
          });
        }
      });
    }
  }

  send(message: WebSocketMessage, messageId?: string): void {
    // Generate message ID if not provided
    const id = messageId || this.generateMessageId();

    // Check for duplicate message
    if (this.processedMessageIds.has(id)) {
      logger.debug("Skipping duplicate message", { type: message.type, id });
      return;
    }

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      logger.warn(
        "Cannot send WebSocket message - connection not open, queuing",
        {
          message: message.type,
          readyState: this.ws?.readyState,
          connectionState: this.currentConnectionState,
          messageId: id,
        },
      );

      // Queue message for later delivery
      this.queueMessage(message, id);
      return;
    }

    try {
      // Basic message validation on client side
      if (!message.type) {
        throw new Error("Message must have a type field");
      }

      // Sanitize message content to prevent issues
      const sanitizedMessage = this.sanitizeMessage(message);

      this.ws.send(JSON.stringify(sanitizedMessage));

      // Track message ID to prevent duplicates
      this.trackMessageId(id);

      // Update last message ID
      this.reconnectionState.lastMessageId = id;

      logger.debug("WebSocket message sent", { type: message.type, id });
    } catch (error) {
      logger.error("Failed to send WebSocket message", error, {
        messageType: message.type,
        messageId: id,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      // Queue message on send failure
      this.queueMessage(message, id);
    }
  }

  /**
   * Queue a message for later delivery when connection is restored
   */
  private queueMessage(message: WebSocketMessage, id: string): void {
    const queuedMessage: QueuedMessage = {
      message,
      timestamp: Date.now(),
      id,
    };

    this.reconnectionState.pendingMessages.push(queuedMessage);

    // Limit queue size to prevent memory issues
    const MAX_QUEUE_SIZE = 100;
    if (this.reconnectionState.pendingMessages.length > MAX_QUEUE_SIZE) {
      const removed = this.reconnectionState.pendingMessages.shift();
      logger.warn("Message queue full, removing oldest message", {
        removedType: removed?.message.type,
        removedId: removed?.id,
      });
    }

    logger.debug("Message queued", {
      type: message.type,
      id,
      queueSize: this.reconnectionState.pendingMessages.length,
    });
  }

  /**
   * Generate a unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${this.messageIdCounter++}`;
  }

  /**
   * Track a message ID to prevent duplicate processing
   */
  private trackMessageId(id: string): void {
    this.processedMessageIds.add(id);

    // Prevent memory leak by limiting stored IDs
    if (this.processedMessageIds.size > this.MAX_PROCESSED_IDS) {
      // Remove oldest 20% of IDs
      const toRemove = Array.from(this.processedMessageIds).slice(
        0,
        Math.floor(this.MAX_PROCESSED_IDS * 0.2),
      );
      toRemove.forEach((id) => this.processedMessageIds.delete(id));
    }
  }

  /**
   * Clear pending messages (useful for testing or manual cleanup)
   */
  clearPendingMessages(): void {
    const count = this.reconnectionState.pendingMessages.length;
    this.reconnectionState.pendingMessages = [];
    logger.info("Cleared pending messages", { count });
  }

  /**
   * Get count of pending messages
   */
  getPendingMessageCount(): number {
    return this.reconnectionState.pendingMessages.length;
  }

  private sanitizeMessage(message: WebSocketMessage): WebSocketMessage {
    // Create a deep copy to avoid mutating the original
    const sanitized = JSON.parse(JSON.stringify(message));

    // Sanitize string fields that might contain user input
    if (sanitized.content && typeof sanitized.content === "string") {
      sanitized.content = sanitized.content.substring(0, 1000); // Limit message length
    }

    return sanitized;
  }

  private getReadyStateString(): string {
    if (!this.ws) return "no-websocket";

    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return "connecting";
      case WebSocket.OPEN:
        return "open";
      case WebSocket.CLOSING:
        return "closing";
      case WebSocket.CLOSED:
        return "closed";
      default:
        return "unknown";
    }
  }

  addEventListener<T = WebSocketEventData>(
    eventType: string,
    listener: WebSocketEventListener<T>,
  ): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }

    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.add(listener as WebSocketEventListener);
    }

    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(eventType);
      if (listeners) {
        listeners.delete(listener as WebSocketEventListener);
        if (listeners.size === 0) {
          this.eventListeners.delete(eventType);
        }
      }
    };
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, "Manual disconnect");
      this.ws = null;
    }
    this.eventListeners.clear();
    this.connectionPromise = null;
    this.setConnectionState("disconnected");

    // Clear reconnection state on manual disconnect
    this.reconnectionState = {
      pendingMessages: [],
    };
    this.processedMessageIds.clear();
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }
}

// Export singleton instance
export const webSocketClient = new WebSocketClient();

// Collaborative Streaming specific WebSocket helpers
export class CollaborativeStreamingWebSocket {
  constructor(private client: WebSocketClient) {}

  async joinCollaborativeStream(
    eventId: string,
    collaborator?: CollaboratorInfo,
  ): Promise<void> {
    await this.client.connect();

    // Store room ID for reconnection
    this.client.setCollaborativeRoomId(eventId);

    this.client.send({
      type: "join_collab_stream",
      eventId,
      collaborator,
    });
  }

  leaveCollaborativeStream(_eventId: string): void {
    // Clear room ID
    this.client.setCollaborativeRoomId(null);
  }

  changePhase(eventId: string, newPhase: string, hostUserId?: string): void {
    this.client.send({
      type: "phase_change",
      eventId,
      newPhase,
      hostUserId: hostUserId || "unknown",
    });
  }

  sendCoordinationEvent(
    eventId: string,
    eventType: string,
    eventData: CoordinationEventData,
  ): void {
    this.client.send({
      type: "coordination_event",
      eventId,
      eventType,
      eventData,
    });
  }

  updateCollaboratorStatus(
    eventId: string,
    userId: string,
    statusUpdate: StatusUpdate,
  ): void {
    this.client.send({
      type: "collaborator_status_update",
      eventId,
      userId,
      statusUpdate,
    });
  }

  onCollaboratorJoined(
    callback: (data: CollaboratorJoinedData) => void,
  ): () => void {
    return this.client.addEventListener("collaborator_joined", callback);
  }

  onCollaboratorLeft(
    callback: (data: CollaboratorLeftData) => void,
  ): () => void {
    return this.client.addEventListener("collaborator_left", callback);
  }

  onPhaseUpdated(callback: (data: PhaseUpdatedData) => void): () => void {
    return this.client.addEventListener("phase_updated", callback);
  }

  onCoordinationEvent(
    callback: (data: CoordinationEventBroadcast) => void,
  ): () => void {
    return this.client.addEventListener(
      "coordination_event_broadcast",
      callback,
    );
  }

  onCollaboratorStatusChanged(
    callback: (data: CollaboratorStatusChanged) => void,
  ): () => void {
    return this.client.addEventListener(
      "collaborator_status_changed",
      callback,
    );
  }

  onPhaseChangeError(callback: (data: PhaseChangeError) => void): () => void {
    return this.client.addEventListener("phase_change_error", callback);
  }
}

export const collaborativeStreamingWS = new CollaborativeStreamingWebSocket(
  webSocketClient,
);
