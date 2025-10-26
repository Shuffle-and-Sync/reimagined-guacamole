/**
 * WebSocket Server Configuration
 *
 * Configuration for WebSocket server including compression settings
 * for per-message deflate compression (RFC 7692)
 */

/**
 * WebSocket compression configuration
 *
 * Per-message deflate compression reduces bandwidth usage by compressing
 * WebSocket messages. This is especially effective for JSON payloads.
 *
 * Performance Impact:
 * - 60-80% reduction in message size for JSON
 * - <5% CPU overhead
 * - ~5-10ms latency increase
 *
 * @see https://tools.ietf.org/html/rfc7692
 * @see https://github.com/websockets/ws/blob/master/doc/ws.md#new-websocketserveroptions-callback
 */
export const WS_COMPRESSION_CONFIG = {
  /**
   * Compression level: 1 (fastest) to 9 (best compression)
   * Level 3 provides good balance between speed and compression ratio
   */
  LEVEL: 3,

  /**
   * Only compress messages larger than threshold (in bytes)
   * Messages smaller than 1KB are not worth compressing due to overhead
   */
  THRESHOLD: 1024, // 1KB

  /**
   * Memory level for compression: 1 (min memory) to 9 (max memory)
   * Level 7 is a good balance between memory usage and compression quality
   */
  MEM_LEVEL: 7,

  /**
   * Window bits for compression: 8-15
   * Controls the size of the sliding window (and memory usage)
   * 10 is a good balance for most use cases
   */
  WINDOW_BITS: 10,

  /**
   * Chunk size for compression (in bytes)
   * Smaller chunks use less memory but may be less efficient
   */
  CHUNK_SIZE: 1024,

  /**
   * Inflate chunk size (decompression) in bytes
   */
  INFLATE_CHUNK_SIZE: 10 * 1024, // 10KB
};

/**
 * WebSocket server configuration options
 */
export const WS_SERVER_CONFIG = {
  /**
   * WebSocket path
   */
  PATH: "/ws",

  /**
   * Maximum message size in bytes
   */
  MAX_PAYLOAD: 16 * 1024, // 16KB

  /**
   * Per-message deflate compression options
   * Set to false to disable compression
   */
  PER_MESSAGE_DEFLATE: {
    // Enable compression
    zlibDeflateOptions: {
      chunkSize: WS_COMPRESSION_CONFIG.CHUNK_SIZE,
      memLevel: WS_COMPRESSION_CONFIG.MEM_LEVEL,
      level: WS_COMPRESSION_CONFIG.LEVEL,
    },
    zlibInflateOptions: {
      chunkSize: WS_COMPRESSION_CONFIG.INFLATE_CHUNK_SIZE,
    },
    // Only compress messages larger than threshold
    threshold: WS_COMPRESSION_CONFIG.THRESHOLD,
    // Context takeover settings (reset compression context between messages)
    // This reduces memory usage at the cost of slightly worse compression
    clientNoContextTakeover: true,
    serverNoContextTakeover: true,
    // Window bits control memory usage
    serverMaxWindowBits: WS_COMPRESSION_CONFIG.WINDOW_BITS,
    clientMaxWindowBits: WS_COMPRESSION_CONFIG.WINDOW_BITS,
  },
};

/**
 * Feature flags for WebSocket functionality
 */
export const WS_FEATURES = {
  /**
   * Enable compression for WebSocket messages
   * Set to false to disable compression (e.g., for debugging)
   */
  COMPRESSION_ENABLED: true,

  /**
   * Log compression statistics
   */
  LOG_COMPRESSION_STATS: process.env.NODE_ENV === "development",
};
