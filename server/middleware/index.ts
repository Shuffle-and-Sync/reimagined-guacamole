/**
 * Middleware Integration Module
 *
 * This module exports all middleware in a structured way for easy integration,
 * following Copilot best practices for middleware organization and composition.
 */


// Import all middleware modules
import compressionMiddleware from "./compression.middleware";
import { costBasedRateLimiter } from "./cost-based-rate-limiter.middleware";
import { deprecated } from "./deprecation.middleware";
import { errorHandlingMiddleware } from "./error-handling.middleware";
import { performanceMonitoring } from "./performance.middleware";
import { securityMiddleware } from "./security.middleware";
import type { Express, RequestHandler } from "express";

// Re-export individual middleware for granular control
export { securityMiddleware } from "./security.middleware";
export { errorHandlingMiddleware, errors } from "./error-handling.middleware";
export { performanceMonitoring } from "./performance.middleware";
export { deprecated } from "./deprecation.middleware";
export {
  costBasedRateLimiter,
  costBasedRateLimitUtils,
} from "./cost-based-rate-limiter.middleware";
export { compressionMiddleware } from "./compression.middleware";

// Export individual middleware functions for backwards compatibility
export const {
  headers: securityHeaders,
  sanitization: inputSanitization,
  monitoring: securityMonitoring,
  rateLimits,
  requestSizeLimit,
} = securityMiddleware;

export const {
  requestId,
  notFound,
  global: globalErrorHandler,
  asyncHandler,
} = errorHandlingMiddleware;

export const {
  middleware: performanceMiddleware,
  memory: memoryMonitoring,
  requestSize: requestSizeMonitoring,
  database: databaseMonitoring,
  healthCheck,
  metrics,
} = performanceMonitoring;

/**
 * Middleware composition for different application phases
 */

// Core middleware that should be applied early
export const coreMiddleware = [
  requestId,
  securityHeaders,
  performanceMiddleware,
  memoryMonitoring,
  requestSizeMonitoring,
];

// Security middleware stack
export const securityMiddlewareStack = [
  securityHeaders,
  inputSanitization,
  securityMonitoring,
  requestSizeLimit,
];

// Monitoring middleware stack
export const monitoringMiddlewareStack = [
  performanceMiddleware,
  memoryMonitoring,
  requestSizeMonitoring,
  databaseMonitoring,
];

// Error handling middleware (should be applied last)
export const errorMiddlewareStack = [notFound, globalErrorHandler];

/**
 * Complete middleware stack for production use
 */
export const productionMiddlewareStack = [
  ...coreMiddleware,
  inputSanitization,
  securityMonitoring,
  databaseMonitoring,
];

/**
 * Development middleware stack with additional debugging
 */
export const developmentMiddlewareStack = [
  ...coreMiddleware,
  inputSanitization,
  securityMonitoring,
  databaseMonitoring,
];

/**
 * API-specific middleware stack
 */
export const apiMiddlewareStack = [
  requestId,
  performanceMiddleware,
  rateLimits.api,
  inputSanitization,
  securityMonitoring,
];

/**
 * Authentication-specific middleware stack
 */
export const authMiddlewareStack = [
  requestId,
  rateLimits.auth,
  inputSanitization,
  securityMonitoring,
];

/**
 * File upload middleware stack
 */
export const uploadMiddlewareStack = [
  requestId,
  rateLimits.upload,
  requestSizeLimit,
  securityMonitoring,
];

/**
 * Utility function to apply middleware stack to Express app
 */
export function applyMiddlewareStack(
  app: Express,
  middlewareStack: RequestHandler[],
) {
  middlewareStack.forEach((middleware) => {
    if (middleware) {
      app.use(middleware);
    }
  });
}

/**
 * Express error handler setup utility
 */
export function setupErrorHandlers(app: Express) {
  // 404 handler for unmatched routes
  app.use(notFound);

  // Global error handler (must be last)
  app.use(globalErrorHandler);
}

/**
 * Health and metrics endpoints setup
 */
export function setupMonitoringEndpoints(app: Express) {
  app.get("/health", healthCheck);
  app.get("/metrics", metrics);
}

// Default export with commonly used middleware
export default {
  security: securityMiddleware,
  errors: errorHandlingMiddleware,
  performance: performanceMonitoring,
  deprecated,
  costBasedRateLimiter,
  compression: compressionMiddleware,
  stacks: {
    production: productionMiddlewareStack,
    development: developmentMiddlewareStack,
    api: apiMiddlewareStack,
    auth: authMiddlewareStack,
    upload: uploadMiddlewareStack,
  },
  utils: {
    applyMiddlewareStack,
    setupErrorHandlers,
    setupMonitoringEndpoints,
  },
};
