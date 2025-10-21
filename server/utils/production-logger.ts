import { logger } from "../logger";

/**
 * Production Logger Utility
 *
 * Handles logging configuration for production environments
 * and removes/disables debug logging to prevent information leakage
 */

export class ProductionLogger {
  private isProduction: boolean;
  private originalConsole: typeof console;

  constructor() {
    this.isProduction = process.env.NODE_ENV === "production";
    this.originalConsole = { ...console };
    this.setupProductionLogging();
  }

  /**
   * Configure logging for production environment
   */
  private setupProductionLogging(): void {
    if (!this.isProduction) {
      return; // Keep all logging in development
    }

    // Override console methods in production to prevent information leakage
    console.log = this.createProductionLogger("info");
    console.info = this.createProductionLogger("info");
    console.warn = this.createProductionLogger("warn");
    console.error = this.createProductionLogger("error");
    console.debug = this.createProductionLogger("debug");
    console.trace = this.createProductionLogger("debug");

    logger.info("Production logging configuration applied", {
      environment: process.env.NODE_ENV,
      debugLoggingDisabled: true,
    });
  }

  /**
   * Create a production-safe logger function
   */
  private createProductionLogger(level: "info" | "warn" | "error" | "debug") {
    return (...args: unknown[]) => {
      // In production, only log errors and warnings through the structured logger
      if (level === "error") {
        logger.error("Console error in production", {
          args: this.sanitizeLogArgs(args),
          stack: new Error().stack,
        });
      } else if (level === "warn") {
        logger.warn("Console warning in production", {
          args: this.sanitizeLogArgs(args),
        });
      }
      // Suppress info, debug, and trace logs in production
    };
  }

  /**
   * Sanitize log arguments to remove sensitive information
   */
  private sanitizeLogArgs(args: unknown[]): unknown[] {
    return args.map((arg) => {
      if (typeof arg === "string") {
        // Remove potential sensitive patterns
        return arg
          .replace(/password[=:]\s*[^\s&]+/gi, "password=***")
          .replace(/token[=:]\s*[^\s&]+/gi, "token=***")
          .replace(/key[=:]\s*[^\s&]+/gi, "key=***")
          .replace(/secret[=:]\s*[^\s&]+/gi, "secret=***")
          .replace(/auth[=:]\s*[^\s&]+/gi, "auth=***");
      } else if (typeof arg === "object" && arg !== null) {
        return this.sanitizeObject(arg);
      }
      return arg;
    });
  }

  /**
   * Recursively sanitize objects to remove sensitive data
   */
  private sanitizeObject(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item));
    }

    if (typeof obj !== "object" || obj === null) {
      return obj;
    }

    const sanitized: any = {};
    const sensitiveKeys = [
      "password",
      "token",
      "key",
      "secret",
      "auth",
      "cookie",
      "session",
    ];

    for (const [key, value] of Object.entries(obj)) {
      const keyLower = key.toLowerCase();

      if (sensitiveKeys.some((sensitive) => keyLower.includes(sensitive))) {
        sanitized[key] = "***";
      } else if (typeof value === "object" && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Restore original console for testing or development use
   */
  restoreConsole(): void {
    if (this.isProduction) {
      Object.assign(console, this.originalConsole);
      logger.info("Console logging restored (for testing)");
    }
  }

  /**
   * Check if debug logging should be disabled
   */
  shouldDisableDebugLogging(): boolean {
    return this.isProduction;
  }

  /**
   * Create a safe logger function that respects production settings
   */
  createSafeLogger() {
    return {
      debug: (...args: unknown[]) => {
        if (!this.isProduction) {
          logger.debug("Debug log", { args });
        }
      },
      info: (...args: unknown[]) => {
        logger.info("Info log", { args: this.sanitizeLogArgs(args) });
      },
      warn: (...args: unknown[]) => {
        logger.warn("Warning log", { args: this.sanitizeLogArgs(args) });
      },
      error: (...args: unknown[]) => {
        logger.error("Error log", { args: this.sanitizeLogArgs(args) });
      },
    };
  }

  /**
   * Replace all console.log calls in a string with structured logging
   */
  static replaceConsoleLogsInCode(code: string): string {
    return code
      .replace(/console\.log\s*\(/g, "logger.info(")
      .replace(/console\.debug\s*\(/g, "logger.debug(")
      .replace(/console\.info\s*\(/g, "logger.info(")
      .replace(/console\.warn\s*\(/g, "logger.warn(")
      .replace(/console\.error\s*\(/g, "logger.error(");
  }

  /**
   * Scan for console.log usage in the codebase
   */
  static findConsoleUsage(code: string): Array<{
    line: number;
    content: string;
    type: "log" | "debug" | "info" | "warn" | "error";
  }> {
    const lines = code.split("\n");
    const usage: Array<{
      line: number;
      content: string;
      type: "log" | "debug" | "info" | "warn" | "error";
    }> = [];

    lines.forEach((line, index) => {
      const consoleRegex = /console\.(log|debug|info|warn|error)\s*\(/;
      const match = line.match(consoleRegex);

      if (match) {
        usage.push({
          line: index + 1,
          content: line.trim(),
          type: match[1] as "log" | "debug" | "info" | "warn" | "error",
        });
      }
    });

    return usage;
  }
}

// Initialize production logger
export const productionLogger = new ProductionLogger();

// Export safe logger instance
export const safeLogger = productionLogger.createSafeLogger();
