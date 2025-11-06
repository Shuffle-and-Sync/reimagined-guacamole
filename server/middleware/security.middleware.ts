/**
 * Centralized Security Middleware
 *
 * This module provides comprehensive security middleware for the application,
 * following Copilot best practices for security, scalability, and maintainability.
 */

import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { toLoggableError } from "@shared/utils/type-guards";
import { logger } from "../logger";
import { validateUUID, sanitizeInput } from "../validation";
import type { ParsedQs, ParamsDictionary } from "express-serve-static-core";

// Security headers configuration
export interface SecurityHeadersConfig {
  development?: boolean;
  allowedOrigins?: string[];
  contentSecurityPolicy?: {
    enabled: boolean;
    reportOnly?: boolean;
    customPolicies?: string[];
  };
  hsts?: {
    enabled: boolean;
    maxAge: number;
    includeSubDomains: boolean;
  };
}

/**
 * Comprehensive security headers middleware
 * Configurable for development and production environments
 */
export function createSecurityHeadersMiddleware(
  config: SecurityHeadersConfig = {},
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Basic security headers
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-Download-Options", "noopen");
    res.setHeader("X-Permitted-Cross-Domain-Policies", "none");

    // CORS headers
    const allowedOrigins = config.allowedOrigins || [
      "http://localhost:3000",
      "https://*.replit.app",
    ];
    const origin = req.headers.origin;

    if (
      origin &&
      allowedOrigins.some(
        (allowed) =>
          allowed === "*" ||
          origin === allowed ||
          (allowed.includes("*") && origin.includes(allowed.replace("*", ""))),
      )
    ) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }

    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS, PATCH",
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie",
    );

    // Content Security Policy
    const cspConfig = config.contentSecurityPolicy || {
      enabled: true,
      reportOnly: config.development,
    };

    if (cspConfig.enabled) {
      const defaultPolicies = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://replit.com",
        "style-src 'self' 'unsafe-inline' fonts.googleapis.com https:",
        "font-src 'self' fonts.gstatic.com https:",
        "img-src 'self' data: blob: https:",
        "connect-src 'self' https: wss: ws:",
        "frame-ancestors 'none'",
        "object-src 'none'",
        "base-uri 'self'",
      ];

      const policies = cspConfig.customPolicies || defaultPolicies;
      const cspValue = policies.join("; ");

      if (cspConfig.reportOnly) {
        res.setHeader("Content-Security-Policy-Report-Only", cspValue);
      } else {
        res.setHeader("Content-Security-Policy", cspValue);
      }
    }

    // HTTP Strict Transport Security (HSTS)
    const hstsConfig = config.hsts || {
      enabled: !config.development,
      maxAge: 31536000,
      includeSubDomains: true,
    };

    if (hstsConfig.enabled) {
      const hstsValue = `max-age=${hstsConfig.maxAge}${hstsConfig.includeSubDomains ? "; includeSubDomains" : ""}`;
      res.setHeader("Strict-Transport-Security", hstsValue);
    }

    next();
  };
}

/**
 * Input sanitization middleware
 * Sanitizes all string inputs in request body, query, and params
 */
export function inputSanitizationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
    // Sanitize request body
    if (req.body && typeof req.body === "object") {
      req.body = sanitizeObjectInputs(req.body);
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === "object") {
      req.query = sanitizeObjectInputs(req.query) as ParsedQs;
    }

    // Sanitize route parameters
    if (req.params && typeof req.params === "object") {
      req.params = sanitizeObjectInputs(req.params) as ParamsDictionary;
    }

    next();
  } catch (error) {
    logger.error("Input sanitization error", toLoggableError(error), {
      url: req.url,
      method: req.method,
    });
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Parameter validation middleware factory
 * Creates middleware to validate specific parameters
 */
export function createParameterValidationMiddleware(
  validations: Array<{
    param: string;
    validator: (value: string) => boolean;
    errorMessage: string;
  }>,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    for (const validation of validations) {
      const value = req.params[validation.param];

      if (!value || !validation.validator(value)) {
        logger.warn("Parameter validation failed", {
          url: req.url,
          method: req.method,
          param: validation.param,
          value: value,
        });

        res.status(400).json({
          message: validation.errorMessage,
          field: validation.param,
        });
        return;
      }
    }

    next();
  };
}

/**
 * Common parameter validators
 */
export const validators = {
  uuid: (value: string) => validateUUID(value),
  positiveInteger: (value: string) =>
    /^\d+$/.test(value) && parseInt(value) > 0,
  alphanumeric: (value: string) => /^[a-zA-Z0-9]+$/.test(value),
  email: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  slug: (value: string) => /^[a-z0-9-]+$/.test(value),
};

/**
 * Rate limiting configurations for different endpoint types
 */
export const rateLimitConfigs = {
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // requests per window
    standardHeaders: true,
    legacyHeaders: false,
  },
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // auth attempts per window
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
  },
  api: {
    windowMs: 60 * 1000, // 1 minute
    max: 60, // API calls per minute
    standardHeaders: true,
    legacyHeaders: false,
  },
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // file uploads per hour
    standardHeaders: true,
    legacyHeaders: false,
  },
  message: {
    windowMs: 60 * 1000, // 1 minute
    max: 20, // messages per minute
    standardHeaders: true,
    legacyHeaders: false,
  },
};

/**
 * Create rate limiter with custom configuration
 */
export function createRateLimit(
  config: typeof rateLimitConfigs.general,
  type: string = "general",
) {
  return rateLimit({
    ...config,
    handler: (req: Request, res: Response) => {
      logger.warn(`${type} rate limit exceeded`, {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        url: req.originalUrl,
        method: req.method,
      });

      res.status(429).json({
        error: "Too many requests",
        message: `Rate limit exceeded for ${type}. Please try again later.`,
        retryAfter: Math.ceil(config.windowMs / 1000),
      });
    },
  });
}

/**
 * Security monitoring middleware
 * Logs suspicious activities and potential security threats
 */
export function securityMonitoringMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const suspiciousPatterns = [
    /(<script|javascript:|vbscript:|onload|onerror)/i,
    /(union|select|insert|update|delete|drop|create|alter)\s+/i,
    /(\.\.|\/etc\/passwd|\/proc\/|cmd\.exe)/i,
    /(eval\(|setTimeout\(|setInterval\()/i,
  ];

  const requestData = JSON.stringify({
    body: req.body,
    query: req.query,
    params: req.params,
  });

  // Check for suspicious patterns
  const hasSuspiciousContent = suspiciousPatterns.some(
    (pattern) => pattern.test(requestData) || pattern.test(req.url),
  );

  if (hasSuspiciousContent) {
    logger.warn("Suspicious request detected", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      url: req.url,
      method: req.method,
      body: req.body,
      query: req.query,
      params: req.params,
    });

    // Don't block the request, just log it
    // In production, you might want to block or rate-limit such requests
  }

  next();
}

/**
 * Request size limiting middleware
 */
export function createRequestSizeLimitMiddleware(
  maxSize: number = 10 * 1024 * 1024,
) {
  // 10MB default
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.headers["content-length"] || "0");

    if (contentLength > maxSize) {
      logger.warn("Request size limit exceeded", {
        ip: req.ip,
        url: req.url,
        method: req.method,
        contentLength,
        maxSize,
      });

      res.status(413).json({
        error: "Payload too large",
        message: `Request size exceeds maximum allowed size of ${maxSize} bytes`,
      });
      return;
    }

    next();
  };
}

// Helper functions

function sanitizeObjectInputs(obj: unknown): unknown {
  if (typeof obj === "string") {
    return sanitizeInput(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObjectInputs(item));
  }

  if (obj && typeof obj === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObjectInputs(value);
    }
    return sanitized;
  }

  return obj;
}

// Export commonly used middleware combinations
export const securityMiddleware = {
  headers: createSecurityHeadersMiddleware(),
  sanitization: inputSanitizationMiddleware,
  monitoring: securityMonitoringMiddleware,
  rateLimits: {
    general: createRateLimit(rateLimitConfigs.general, "general"),
    auth: createRateLimit(rateLimitConfigs.auth, "authentication"),
    api: createRateLimit(rateLimitConfigs.api, "API"),
    upload: createRateLimit(rateLimitConfigs.upload, "upload"),
    message: createRateLimit(rateLimitConfigs.message, "message"),
  },
  requestSizeLimit: createRequestSizeLimitMiddleware(),
};
