import { WebSocket } from 'ws';
import { logger } from '../logger';

export interface ExtendedWebSocket extends WebSocket {
  userId?: string;
  userName?: string;
  userAvatar?: string;
  sessionId?: string;
  eventId?: string;
  connectionId?: string;
  lastActivity?: number;
  authToken?: string;
  authExpiry?: number;
}

export interface ConnectionStats {
  totalConnections: number;
  activeConnections: number;
  staleConnections: number;
  connectionsByType: Record<string, number>;
}

export class WebSocketConnectionManager {
  private connections = new Map<string, ExtendedWebSocket>();
  private gameRooms = new Map<string, Set<ExtendedWebSocket>>();
  private collaborativeStreamRooms = new Map<string, Set<ExtendedWebSocket>>();
  private staleConnectionTimeout: number;
  private authExpiryTimeout: number;

  constructor(options: {
    staleConnectionTimeout?: number; // ms until connection is considered stale
    authExpiryTimeout?: number; // ms until auth token expires
  } = {}) {
    this.staleConnectionTimeout = options.staleConnectionTimeout || 30 * 60 * 1000; // 30 minutes
    this.authExpiryTimeout = options.authExpiryTimeout || 60 * 60 * 1000; // 1 hour
    
    // Set up periodic cleanup
    this.setupPeriodicCleanup();
  }

  /**
   * Register a new WebSocket connection
   */
  registerConnection(ws: ExtendedWebSocket, userId: string, authToken?: string): string {
    const connectionId = this.generateConnectionId();
    ws.connectionId = connectionId;
    ws.userId = userId;
    ws.lastActivity = Date.now();
    
    if (authToken) {
      ws.authToken = authToken;
      ws.authExpiry = Date.now() + this.authExpiryTimeout;
    }

    this.connections.set(connectionId, ws);
    
    // Set up connection event handlers
    this.setupConnectionHandlers(ws);
    
    logger.info('WebSocket connection registered', {
      connectionId,
      userId,
      totalConnections: this.connections.size
    });

    return connectionId;
  }

  /**
   * Update last activity timestamp for a connection
   */
  updateActivity(connectionId: string): void {
    const ws = this.connections.get(connectionId);
    if (ws) {
      ws.lastActivity = Date.now();
    }
  }

  /**
   * Check if authentication token has expired
   */
  isAuthExpired(connectionId: string): boolean {
    const ws = this.connections.get(connectionId);
    if (!ws || !ws.authExpiry) {
      return false; // No auth expiry set
    }
    
    return Date.now() > ws.authExpiry;
  }

  /**
   * Refresh authentication for a connection
   */
  refreshAuth(connectionId: string, newToken: string): boolean {
    const ws = this.connections.get(connectionId);
    if (!ws) {
      return false;
    }

    ws.authToken = newToken;
    ws.authExpiry = Date.now() + this.authExpiryTimeout;
    
    logger.debug('WebSocket authentication refreshed', { connectionId });
    return true;
  }

  /**
   * Add connection to a game room
   */
  joinGameRoom(connectionId: string, sessionId: string): boolean {
    const ws = this.connections.get(connectionId);
    if (!ws) {
      return false;
    }

    if (!this.gameRooms.has(sessionId)) {
      this.gameRooms.set(sessionId, new Set());
    }
    
    ws.sessionId = sessionId;
    this.gameRooms.get(sessionId)!.add(ws);
    
    logger.debug('Connection joined game room', { connectionId, sessionId });
    return true;
  }

  /**
   * Add connection to a collaborative streaming room
   */
  joinCollaborativeRoom(connectionId: string, eventId: string): boolean {
    const ws = this.connections.get(connectionId);
    if (!ws) {
      return false;
    }

    if (!this.collaborativeStreamRooms.has(eventId)) {
      this.collaborativeStreamRooms.set(eventId, new Set());
    }
    
    ws.eventId = eventId;
    this.collaborativeStreamRooms.get(eventId)!.add(ws);
    
    logger.debug('Connection joined collaborative room', { connectionId, eventId });
    return true;
  }

  /**
   * Get all connections in a game room
   */
  getGameRoomConnections(sessionId: string): ExtendedWebSocket[] {
    const room = this.gameRooms.get(sessionId);
    return room ? Array.from(room) : [];
  }

  /**
   * Get all connections in a collaborative streaming room
   */
  getCollaborativeRoomConnections(eventId: string): ExtendedWebSocket[] {
    const room = this.collaborativeStreamRooms.get(eventId);
    return room ? Array.from(room) : [];
  }

  /**
   * Broadcast message to all connections in a game room
   */
  broadcastToGameRoom(sessionId: string, message: any, excludeConnectionId?: string): void {
    const connections = this.getGameRoomConnections(sessionId);
    this.broadcastToConnections(connections, message, excludeConnectionId);
  }

  /**
   * Broadcast message to all connections in a collaborative room
   */
  broadcastToCollaborativeRoom(eventId: string, message: any, excludeConnectionId?: string): void {
    const connections = this.getCollaborativeRoomConnections(eventId);
    this.broadcastToConnections(connections, message, excludeConnectionId);
  }

  /**
   * Remove connection and clean up associated data
   */
  removeConnection(connectionId: string): void {
    const ws = this.connections.get(connectionId);
    if (!ws) {
      return;
    }

    // Remove from rooms
    if (ws.sessionId) {
      const gameRoom = this.gameRooms.get(ws.sessionId);
      if (gameRoom) {
        gameRoom.delete(ws);
        if (gameRoom.size === 0) {
          this.gameRooms.delete(ws.sessionId);
        }
      }
    }

    if (ws.eventId) {
      const collabRoom = this.collaborativeStreamRooms.get(ws.eventId);
      if (collabRoom) {
        collabRoom.delete(ws);
        if (collabRoom.size === 0) {
          this.collaborativeStreamRooms.delete(ws.eventId);
        }
      }
    }

    this.connections.delete(connectionId);
    
    logger.debug('WebSocket connection removed', {
      connectionId,
      userId: ws.userId,
      remainingConnections: this.connections.size
    });
  }

  /**
   * Get connection statistics
   */
  getStats(): ConnectionStats {
    const now = Date.now();
    let activeConnections = 0;
    let staleConnections = 0;
    const connectionsByType: Record<string, number> = {
      game_room: 0,
      collaborative_stream: 0,
      unassigned: 0
    };

    for (const ws of this.connections.values()) {
      // Check if connection is active
      if (ws.lastActivity && (now - ws.lastActivity) < this.staleConnectionTimeout) {
        activeConnections++;
      } else {
        staleConnections++;
      }

      // Categorize connection type
      if (ws.sessionId) {
        connectionsByType.game_room++;
      } else if (ws.eventId) {
        connectionsByType.collaborative_stream++;
      } else {
        connectionsByType.unassigned++;
      }
    }

    return {
      totalConnections: this.connections.size,
      activeConnections,
      staleConnections,
      connectionsByType
    };
  }

  /**
   * Clean up stale connections
   */
  cleanupStaleConnections(): number {
    const now = Date.now();
    const staleConnections: string[] = [];

    for (const [connectionId, ws] of this.connections.entries()) {
      const isStale = ws.lastActivity && (now - ws.lastActivity) > this.staleConnectionTimeout;
      const isAuthExpired = this.isAuthExpired(connectionId);
      
      if (isStale || isAuthExpired || ws.readyState !== WebSocket.OPEN) {
        staleConnections.push(connectionId);
      }
    }

    // Close and remove stale connections
    for (const connectionId of staleConnections) {
      const ws = this.connections.get(connectionId);
      if (ws) {
        try {
          if (ws.readyState === WebSocket.OPEN) {
            ws.close(1000, 'Connection cleanup');
          }
        } catch (error) {
          logger.warn('Error closing stale WebSocket connection', error);
        }
        this.removeConnection(connectionId);
      }
    }

    if (staleConnections.length > 0) {
      logger.info('Cleaned up stale WebSocket connections', {
        cleanedUp: staleConnections.length,
        remainingConnections: this.connections.size
      });
    }

    return staleConnections.length;
  }

  private generateConnectionId(): string {
    return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupConnectionHandlers(ws: ExtendedWebSocket): void {
    ws.on('close', () => {
      if (ws.connectionId) {
        this.removeConnection(ws.connectionId);
      }
    });

    ws.on('error', (error) => {
      logger.error('WebSocket connection error', error, {
        connectionId: ws.connectionId,
        userId: ws.userId
      });
    });

    ws.on('pong', () => {
      if (ws.connectionId) {
        this.updateActivity(ws.connectionId);
      }
    });
  }

  private broadcastToConnections(connections: ExtendedWebSocket[], message: any, excludeConnectionId?: string): void {
    const messageStr = JSON.stringify(message);
    
    for (const ws of connections) {
      if (ws.connectionId === excludeConnectionId) {
        continue;
      }
      
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(messageStr);
          if (ws.connectionId) {
            this.updateActivity(ws.connectionId);
          }
        } catch (error) {
          logger.error('Failed to send WebSocket message', error, {
            connectionId: ws.connectionId,
            userId: ws.userId
          });
        }
      }
    }
  }

  private setupPeriodicCleanup(): void {
    // Clean up stale connections every 5 minutes
    setInterval(() => {
      this.cleanupStaleConnections();
    }, 5 * 60 * 1000);

    // Send ping to all connections every 30 seconds to detect stale connections
    setInterval(() => {
      for (const ws of this.connections.values()) {
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.ping();
          } catch (error) {
            logger.warn('Failed to ping WebSocket connection', error);
          }
        }
      }
    }, 30 * 1000);
  }
}

// Export singleton instance
export const connectionManager = new WebSocketConnectionManager();