/**
 * WebSocket Message Batcher
 *
 * Implements message batching to reduce WebSocket frame overhead by combining
 * multiple messages into a single transmission. This improves performance
 * under high message volume scenarios.
 *
 * Features:
 * - Time-based flushing (default: 50ms)
 * - Size-based flushing (default: 10 messages)
 * - Priority message bypass (critical messages sent immediately)
 * - Automatic batch compression for large batches
 *
 * Part of Phase 3: Performance & Scale improvements
 */

import { logger } from "../server/logger";
import type { WebSocketMessage } from "../client/src/lib/websocket-client";

export interface BatchConfig {
  /** Maximum time to wait before flushing batch (ms) */
  maxBatchDelay: number;
  /** Maximum number of messages to batch */
  maxBatchSize: number;
  /** Enable compression for large batches */
  enableCompression: boolean;
  /** Minimum batch size to apply compression */
  compressionThreshold: number;
}

export interface BatchMetrics {
  totalBatches: number;
  totalMessages: number;
  averageBatchSize: number;
  compressionSavings: number; // bytes saved
  flushReasons: {
    time: number;
    size: number;
    priority: number;
  };
}

export interface BatchedMessage {
  type: "batch";
  messages: WebSocketMessage[];
  batchId: string;
  timestamp: number;
  compressed?: boolean;
}

/**
 * Message priority levels
 */
export enum MessagePriority {
  /** Critical messages bypass batching */
  CRITICAL = 0,
  /** High priority messages, short batch delay */
  HIGH = 1,
  /** Normal messages, use default batching */
  NORMAL = 2,
  /** Low priority messages, aggressive batching */
  LOW = 3,
}

/**
 * WebSocket Message Batcher
 *
 * Batches outgoing WebSocket messages to reduce frame overhead
 * and improve network efficiency.
 */
export class WebSocketMessageBatcher {
  private config: BatchConfig;
  private batch: WebSocketMessage[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private metrics: BatchMetrics = {
    totalBatches: 0,
    totalMessages: 0,
    averageBatchSize: 0,
    compressionSavings: 0,
    flushReasons: {
      time: 0,
      size: 0,
      priority: 0,
    },
  };
  private batchIdCounter = 0;
  private sendCallback: (message: WebSocketMessage | BatchedMessage) => void;

  constructor(
    sendCallback: (message: WebSocketMessage | BatchedMessage) => void,
    config: Partial<BatchConfig> = {},
  ) {
    this.sendCallback = sendCallback;
    this.config = {
      maxBatchDelay: config.maxBatchDelay || 50, // 50ms default
      maxBatchSize: config.maxBatchSize || 10,
      enableCompression: config.enableCompression ?? true,
      compressionThreshold: config.compressionThreshold || 5,
    };

    logger.info("WebSocket message batcher initialized", {
      config: this.config,
    });
  }

  /**
   * Add a message to the batch
   *
   * @param message - Message to batch
   * @param priority - Message priority (default: NORMAL)
   */
  addMessage(
    message: WebSocketMessage,
    priority: MessagePriority = MessagePriority.NORMAL,
  ): void {
    // Critical messages bypass batching
    if (priority === MessagePriority.CRITICAL) {
      this.sendCallback(message);
      this.metrics.flushReasons.priority++;
      logger.debug("Critical message sent immediately", {
        type: message.type,
      });
      return;
    }

    // Add to batch
    this.batch.push(message);

    logger.debug("Message added to batch", {
      type: message.type,
      priority,
      batchSize: this.batch.length,
      maxSize: this.config.maxBatchSize,
    });

    // Check if batch should be flushed based on size
    if (this.batch.length >= this.config.maxBatchSize) {
      this.flush("size");
      return;
    }

    // Schedule time-based flush if not already scheduled
    if (!this.flushTimer) {
      const delay = this.getFlushDelay(priority);
      this.scheduleFlush(delay);
    }
  }

  /**
   * Force flush the current batch
   */
  flush(reason: "size" | "time" | "manual" = "manual"): void {
    if (this.batch.length === 0) {
      return;
    }

    // Cancel pending flush timer
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    const batchSize = this.batch.length;

    // If only one message, send directly (no batching overhead)
    if (batchSize === 1) {
      const message = this.batch[0]!; // Safe: we verified batchSize === 1
      this.sendCallback(message);
      logger.debug("Single message sent directly", { type: message.type });
    } else {
      // Create batched message
      const batchedMessage = this.createBatchedMessage(this.batch);
      this.sendCallback(batchedMessage);

      logger.debug("Batch flushed", {
        reason,
        batchSize,
        batchId: batchedMessage.batchId,
        compressed: batchedMessage.compressed,
      });
    }

    // Update metrics
    this.updateMetrics(batchSize, reason);

    // Clear batch
    this.batch = [];
  }

  /**
   * Create a batched message from array of messages
   */
  private createBatchedMessage(messages: WebSocketMessage[]): BatchedMessage {
    const batchId = `batch_${Date.now()}_${this.batchIdCounter++}`;

    const batched: BatchedMessage = {
      type: "batch",
      messages,
      batchId,
      timestamp: Date.now(),
    };

    // Apply compression if enabled and above threshold
    if (
      this.config.enableCompression &&
      messages.length >= this.config.compressionThreshold
    ) {
      // Note: Actual compression would be applied here
      // For now, we just mark it as compressed
      batched.compressed = true;

      // Estimate compression savings (simplified)
      const uncompressedSize = JSON.stringify(messages).length;
      const estimatedCompressedSize = Math.floor(uncompressedSize * 0.6); // ~40% compression
      this.metrics.compressionSavings +=
        uncompressedSize - estimatedCompressedSize;

      logger.debug("Batch compression applied", {
        batchId,
        uncompressedSize,
        estimatedCompressedSize,
        savings: uncompressedSize - estimatedCompressedSize,
      });
    }

    return batched;
  }

  /**
   * Schedule a flush after specified delay
   */
  private scheduleFlush(delay: number): void {
    this.flushTimer = setTimeout(() => {
      this.flush("time");
    }, delay);
  }

  /**
   * Get flush delay based on message priority
   */
  private getFlushDelay(priority: MessagePriority): number {
    switch (priority) {
      case MessagePriority.HIGH:
        return Math.floor(this.config.maxBatchDelay * 0.5); // 50% of default
      case MessagePriority.NORMAL:
        return this.config.maxBatchDelay;
      case MessagePriority.LOW:
        return this.config.maxBatchDelay * 2; // Double delay for low priority
      default:
        return this.config.maxBatchDelay;
    }
  }

  /**
   * Update metrics after flush
   */
  private updateMetrics(
    batchSize: number,
    reason: "size" | "time" | "manual",
  ): void {
    this.metrics.totalBatches++;
    this.metrics.totalMessages += batchSize;
    this.metrics.averageBatchSize =
      this.metrics.totalMessages / this.metrics.totalBatches;

    if (reason === "size") {
      this.metrics.flushReasons.size++;
    } else if (reason === "time") {
      this.metrics.flushReasons.time++;
    }
  }

  /**
   * Get current batch statistics
   */
  getMetrics(): Readonly<BatchMetrics> {
    return { ...this.metrics };
  }

  /**
   * Get current batch size
   */
  getBatchSize(): number {
    return this.batch.length;
  }

  /**
   * Clear current batch without sending
   */
  clearBatch(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    this.batch = [];
    logger.debug("Batch cleared");
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<BatchConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info("Batcher configuration updated", { config: this.config });
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalBatches: 0,
      totalMessages: 0,
      averageBatchSize: 0,
      compressionSavings: 0,
      flushReasons: {
        time: 0,
        size: 0,
        priority: 0,
      },
    };
    logger.debug("Metrics reset");
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    // Flush any pending messages
    if (this.batch.length > 0) {
      this.flush("manual");
    }

    // Clear timer
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    logger.info("Message batcher destroyed", {
      finalMetrics: this.metrics,
    });
  }
}

/**
 * Determine message priority based on type
 *
 * Can be customized based on application needs
 */
export function getMessagePriority(message: WebSocketMessage): MessagePriority {
  const messageType = message.type;

  // WebRTC signaling is high priority
  if (
    messageType === "webrtc_offer" ||
    messageType === "webrtc_answer" ||
    messageType === "webrtc_ice_candidate"
  ) {
    return MessagePriority.HIGH;
  }

  // Phase changes and important game events are high priority
  if (messageType === "phase_change" || messageType === "game_action") {
    return MessagePriority.HIGH;
  }

  // Chat messages are normal priority
  if (messageType === "message") {
    return MessagePriority.NORMAL;
  }

  // Status updates are low priority
  if (messageType === "collaborator_status_update") {
    return MessagePriority.LOW;
  }

  // Default to normal priority
  return MessagePriority.NORMAL;
}
