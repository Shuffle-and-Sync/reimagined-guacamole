import { queryClient } from '@/lib/queryClient';
import { logger } from './logger';

export type WebSocketMessage = 
  // Game room messages
  | { type: 'join_room'; sessionId: string; user: any }
  | { type: 'message'; sessionId: string; user: any; content: string }
  | { type: 'game_action'; sessionId: string; action: string; user: any; data: any }
  // Collaborative streaming messages
  | { type: 'join_collab_stream'; eventId: string; collaborator: any }
  | { type: 'phase_change'; eventId: string; newPhase: string; hostUserId: string }
  | { type: 'coordination_event'; eventId: string; eventType: string; eventData: any }
  | { type: 'collaborator_status_update'; eventId: string; userId: string; statusUpdate: any };

export type WebSocketEventListener = (data: any) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private eventListeners: Map<string, Set<WebSocketEventListener>> = new Map();
  private connectionPromise: Promise<void> | null = null;

  async connect(): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        // Always use wss:// in production, ws:// only for local development
        const isProduction = window.location.hostname !== 'localhost' && !window.location.hostname.startsWith('127.');
        const protocol = (window.location.protocol === 'https:' || isProduction) ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
          logger.info('WebSocket connected');
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            logger.error('Failed to parse WebSocket message', error);
          }
        };

        this.ws.onclose = (event) => {
          logger.info('WebSocket connection closed', { code: event.code, reason: event.reason });
          this.connectionPromise = null;
          
          // Attempt to reconnect if not a manual close
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          logger.error('WebSocket error', error);
          reject(new Error('WebSocket connection failed'));
        };
      } catch (error) {
        logger.error('Failed to create WebSocket connection', error);
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  private scheduleReconnect(): void {
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts), 30000);
    
    logger.info(`Scheduling WebSocket reconnect in ${delay}ms`, {
      attempt: this.reconnectAttempts + 1,
      maxAttempts: this.maxReconnectAttempts
    });
    
    setTimeout(() => {
      this.reconnectAttempts++;
      this.connect().catch(error => {
        logger.error('WebSocket reconnect failed', error);
      });
    }, delay);
  }

  private handleMessage(data: any): void {
    logger.debug('WebSocket message received', { type: data.type });
    
    // Handle collaborative streaming specific messages with proper cache invalidation
    switch (data.type) {
      case 'collaborator_joined':
      case 'collaborator_left':
        // Invalidate collaborator queries for the specific event
        queryClient.invalidateQueries({ 
          queryKey: ['/api/collaborative-streams', data.eventId || data.collaborator?.eventId, 'collaborators'] 
        });
        break;
      case 'phase_updated':
        // Invalidate coordination status for the specific event  
        queryClient.invalidateQueries({ 
          queryKey: ['/api/collaborative-streams', data.eventId, 'coordination'] 
        });
        break;
      case 'coordination_event_broadcast':
      case 'collaborator_status_changed':
        // Invalidate coordination status and suggestions
        queryClient.invalidateQueries({ 
          queryKey: ['/api/collaborative-streams', data.eventId] 
        });
        break;
      case 'phase_change_error':
        logger.error('Phase change error', data);
        break;
    }
    
    // Notify event listeners
    const listeners = this.eventListeners.get(data.type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          logger.error('Error in WebSocket event listener', error, { eventType: data.type });
        }
      });
    }
  }

  send(message: WebSocketMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      logger.warn('Cannot send WebSocket message - connection not open', { message });
      return;
    }

    try {
      this.ws.send(JSON.stringify(message));
      logger.debug('WebSocket message sent', { type: message.type });
    } catch (error) {
      logger.error('Failed to send WebSocket message', error, { message });
    }
  }

  addEventListener(eventType: string, listener: WebSocketEventListener): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    
    this.eventListeners.get(eventType)!.add(listener);
    
    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(eventType);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          this.eventListeners.delete(eventType);
        }
      }
    };
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
    this.eventListeners.clear();
    this.connectionPromise = null;
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

  async joinCollaborativeStream(eventId: string, collaborator?: any): Promise<void> {
    await this.client.connect();
    this.client.send({
      type: 'join_collab_stream',
      eventId,
      collaborator: collaborator || {}
    });
  }

  changePhase(eventId: string, newPhase: string, hostUserId?: string): void {
    this.client.send({
      type: 'phase_change',
      eventId,
      newPhase,
      hostUserId: hostUserId || 'unknown'
    });
  }

  sendCoordinationEvent(eventId: string, eventType: string, eventData: any): void {
    this.client.send({
      type: 'coordination_event',
      eventId,
      eventType,
      eventData
    });
  }

  updateCollaboratorStatus(eventId: string, userId: string, statusUpdate: any): void {
    this.client.send({
      type: 'collaborator_status_update',
      eventId,
      userId,
      statusUpdate
    });
  }

  onCollaboratorJoined(callback: (data: any) => void): () => void {
    return this.client.addEventListener('collaborator_joined', callback);
  }

  onCollaboratorLeft(callback: (data: any) => void): () => void {
    return this.client.addEventListener('collaborator_left', callback);
  }

  onPhaseUpdated(callback: (data: any) => void): () => void {
    return this.client.addEventListener('phase_updated', callback);
  }

  onCoordinationEvent(callback: (data: any) => void): () => void {
    return this.client.addEventListener('coordination_event_broadcast', callback);
  }

  onCollaboratorStatusChanged(callback: (data: any) => void): () => void {
    return this.client.addEventListener('collaborator_status_changed', callback);
  }

  onPhaseChangeError(callback: (data: any) => void): () => void {
    return this.client.addEventListener('phase_change_error', callback);
  }
}

export const collaborativeStreamingWS = new CollaborativeStreamingWebSocket(webSocketClient);