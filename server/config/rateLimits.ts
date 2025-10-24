/**
 * Centralized Rate Limiting Configuration
 *
 * Defines rate limit policies for different types of API endpoints
 * to protect against abuse and ensure fair usage
 */

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

/**
 * Rate limit configurations by category
 */
export const rateLimitConfig = {
  /**
   * Public endpoints (lenient) - For unauthenticated users
   * Example: Public data fetching, documentation
   */
  public: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: "Too many requests from this IP, please try again later",
  } as RateLimitConfig,

  /**
   * Standard authenticated endpoints
   * Example: Most GET requests, regular operations
   */
  standard: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per window (generous for authenticated users)
    message: "Rate limit exceeded, please try again later",
  } as RateLimitConfig,

  /**
   * Strict endpoints (write operations)
   * Example: POST, PUT, PATCH, DELETE operations
   */
  strict: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // 50 write operations per window
    message: "Too many requests, please slow down",
  } as RateLimitConfig,

  /**
   * Auth endpoints (login, register, password reset)
   * Very strict to prevent brute force attacks
   */
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Only 5 attempts per window
    skipSuccessfulRequests: true, // Don't count successful logins
    message: "Too many authentication attempts, please try again later",
  } as RateLimitConfig,

  /**
   * Search/expensive operations
   * More restrictive due to computational cost
   */
  expensive: {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 searches per minute
    message: "Search rate limit exceeded, please try again in a minute",
  } as RateLimitConfig,

  /**
   * Email sending endpoints
   * Strict to prevent spam
   */
  email: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 emails per hour
    message: "Email rate limit exceeded, please try again later",
  } as RateLimitConfig,

  /**
   * File upload endpoints
   * Moderate to balance usability and abuse prevention
   */
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 uploads per hour
    message: "Upload rate limit exceeded, please try again later",
  } as RateLimitConfig,

  /**
   * Message sending endpoints
   * Prevents message spam
   */
  messaging: {
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 messages per minute
    message: "You are sending messages too quickly, please slow down",
  } as RateLimitConfig,

  /**
   * Event creation endpoints
   * Prevents event spam
   */
  eventCreation: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 events per hour
    message: "Event creation rate limit exceeded, please try again later",
  } as RateLimitConfig,
};

/**
 * Whitelist of IPs exempt from rate limiting
 * Can be configured via environment variable
 */
export function getWhitelistedIPs(): string[] {
  const whitelist = process.env.RATE_LIMIT_WHITELIST || "";
  return whitelist
    .split(",")
    .map((ip) => ip.trim())
    .filter((ip) => ip.length > 0);
}

/**
 * Get rate limit configuration by name
 */
export function getRateLimitConfig(
  name: keyof typeof rateLimitConfig,
): RateLimitConfig {
  return rateLimitConfig[name];
}
