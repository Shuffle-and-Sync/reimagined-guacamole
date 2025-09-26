import { logger } from '../logger';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxMessages: number; // Maximum messages per window
  skipSuccessfulRequests?: boolean;
}

interface MessageRecord {
  timestamp: number;
  type: string;
}

export class WebSocketRateLimiter {
  private connectionLimits = new Map<string, MessageRecord[]>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      windowMs: 60 * 1000, // Default: 1 minute
      maxMessages: 100, // Default: 100 messages per minute
      skipSuccessfulRequests: false,
      ...config
    };
  }

  /**
   * Check if a message should be rate limited
   * @param connectionId - Unique identifier for the WebSocket connection
   * @param messageType - Type of the message being sent
   * @returns true if the message should be allowed, false if rate limited
   */
  isAllowed(connectionId: string, messageType: string): boolean {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get or create message history for this connection
    let messageHistory = this.connectionLimits.get(connectionId);
    if (!messageHistory) {
      messageHistory = [];
      this.connectionLimits.set(connectionId, messageHistory);
    }

    // Remove old messages outside the window
    const recentMessages = messageHistory.filter(msg => msg.timestamp > windowStart);
    this.connectionLimits.set(connectionId, recentMessages);

    // Check if under the limit
    if (recentMessages.length >= this.config.maxMessages) {
      logger.warn('WebSocket rate limit exceeded', {
        connectionId,
        messageType,
        messageCount: recentMessages.length,
        limit: this.config.maxMessages,
        windowMs: this.config.windowMs
      });
      return false;
    }

    // Add the current message to history
    recentMessages.push({
      timestamp: now,
      type: messageType
    });

    return true;
  }

  /**
   * Get rate limit status for a connection
   */
  getStatus(connectionId: string): { 
    remaining: number; 
    resetTime: number; 
    totalHits: number;
  } {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const messageHistory = this.connectionLimits.get(connectionId) || [];
    const recentMessages = messageHistory.filter(msg => msg.timestamp > windowStart);
    
    return {
      remaining: Math.max(0, this.config.maxMessages - recentMessages.length),
      resetTime: windowStart + this.config.windowMs,
      totalHits: recentMessages.length
    };
  }

  /**
   * Clean up rate limit data for disconnected connections
   */
  cleanup(connectionId: string): void {
    this.connectionLimits.delete(connectionId);
    logger.debug('Cleaned up rate limit data for connection', { connectionId });
  }

  /**
   * Periodic cleanup of old connection data
   */
  periodicCleanup(): void {
    const now = Date.now();
    const cutoff = now - (this.config.windowMs * 2); // Keep data for 2 windows

    for (const [connectionId, messages] of this.connectionLimits.entries()) {
      const recentMessages = messages.filter(msg => msg.timestamp > cutoff);
      
      if (recentMessages.length === 0) {
        this.connectionLimits.delete(connectionId);
      } else {
        this.connectionLimits.set(connectionId, recentMessages);
      }
    }

    logger.debug('Performed periodic cleanup of rate limit data', {
      activeConnections: this.connectionLimits.size
    });
  }

  /**
   * Get rate limiting statistics
   */
  getStats(): {
    activeConnections: number;
    totalMessages: number;
    config: RateLimitConfig;
  } {
    let totalMessages = 0;
    for (const messages of this.connectionLimits.values()) {
      totalMessages += messages.length;
    }

    return {
      activeConnections: this.connectionLimits.size,
      totalMessages,
      config: this.config
    };
  }
}

// Default rate limiter instances for different message types
export const defaultRateLimiter = new WebSocketRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxMessages: 100 // 100 messages per minute per connection
});

export const highFrequencyRateLimiter = new WebSocketRateLimiter({
  windowMs: 10 * 1000, // 10 seconds  
  maxMessages: 20 // 20 messages per 10 seconds for high-frequency events
});

// Set up periodic cleanup every 5 minutes
setInterval(() => {
  defaultRateLimiter.periodicCleanup();
  highFrequencyRateLimiter.periodicCleanup();
}, 5 * 60 * 1000);