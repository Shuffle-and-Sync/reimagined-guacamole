interface LogLevel {
  ERROR: 0;
  WARN: 1;
  INFO: 2;
  DEBUG: 3;
}

const LOG_LEVELS: LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

/**
 * Logger class for application-wide logging with structured output
 * Supports both development (human-readable) and production (JSON) formats
 */
class Logger {
  private logLevel: number;
  private isDevelopment: boolean;
  private useStructuredLogging: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === "development";

    // Configure log level based on environment variable or defaults
    const configuredLevel = process.env.LOG_LEVEL?.toUpperCase();
    if (configuredLevel && configuredLevel in LOG_LEVELS) {
      this.logLevel = LOG_LEVELS[configuredLevel as keyof LogLevel];
    } else {
      this.logLevel = this.isDevelopment ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO;
    }

    // Use structured JSON logging in production for better log aggregation
    this.useStructuredLogging =
      !this.isDevelopment && process.env.STRUCTURED_LOGGING !== "false";
  }

  /**
   * Format message for human-readable output (development)
   */
  private formatMessage(level: string, message: string, context?: any): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : "";
    return `[${timestamp}] [${level}] ${message}${contextStr}`;
  }

  /**
   * Format message as structured JSON (production)
   */
  private formatStructured(
    level: string,
    message: string,
    error?: Error | any,
    context?: unknown,
  ): string {
    const logEntry: unknown = {
      timestamp: new Date().toISOString(),
      level: level.toLowerCase(),
      message,
      environment: process.env.NODE_ENV || "development",
      service: "shuffle-and-sync",
    };

    if (context) {
      logEntry.context = context;
    }

    if (error) {
      if (error instanceof Error) {
        logEntry.error = {
          name: error.name,
          message: error.message,
          stack: error.stack,
        };
      } else {
        logEntry.error = error;
      }
    }

    // Add request ID if available (from async local storage or context)
    if (context?.requestId) {
      logEntry.requestId = context.requestId;
    }

    return JSON.stringify(logEntry);
  }

  private shouldLog(level: number): boolean {
    return level <= this.logLevel;
  }

  error(message: string, error?: Error | any, context?: any): void {
    if (this.shouldLog(LOG_LEVELS.ERROR)) {
      if (this.useStructuredLogging) {
        console.error(this.formatStructured("ERROR", message, error, context));
      } else {
        const errorInfo =
          error instanceof Error
            ? `\nError: ${error.message}\nStack: ${error.stack}`
            : error
              ? `\nError Data: ${JSON.stringify(error)}`
              : "";
        console.error(
          this.formatMessage("ERROR", message, context) + errorInfo,
        );
      }
    }
  }

  warn(message: string, context?: any): void {
    if (this.shouldLog(LOG_LEVELS.WARN)) {
      if (this.useStructuredLogging) {
        console.warn(
          this.formatStructured("WARN", message, undefined, context),
        );
      } else {
        console.warn(this.formatMessage("WARN", message, context));
      }
    }
  }

  info(message: string, context?: any): void {
    if (this.shouldLog(LOG_LEVELS.INFO)) {
      if (this.useStructuredLogging) {
        console.info(
          this.formatStructured("INFO", message, undefined, context),
        );
      } else {
        console.info(this.formatMessage("INFO", message, context));
      }
    }
  }

  debug(message: string, context?: any): void {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      if (this.useStructuredLogging) {
        console.log(
          this.formatStructured("DEBUG", message, undefined, context),
        );
      } else {
        console.log(this.formatMessage("DEBUG", message, context));
      }
    }
  }

  /**
   * Log API request (development mode provides detailed output, production uses structured format)
   */
  apiRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    response?: unknown,
  ): void {
    if (this.isDevelopment) {
      let logLine = `${method} ${path} ${statusCode} in ${duration}ms`;
      if (response) {
        logLine += ` :: ${JSON.stringify(response)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    } else if (this.shouldLog(LOG_LEVELS.INFO)) {
      // In production, log structured API request data
      console.info(
        this.formatStructured("INFO", "API Request", undefined, {
          method,
          path,
          statusCode,
          duration,
          type: "api_request",
        }),
      );
    }
  }

  /**
   * Get current log level name
   */
  getLogLevel(): string {
    const levels = Object.entries(LOG_LEVELS);
    const level = levels.find(([_, value]) => value === this.logLevel);
    return level ? level[0] : "UNKNOWN";
  }

  /**
   * Check if structured logging is enabled
   */
  isStructuredLoggingEnabled(): boolean {
    return this.useStructuredLogging;
  }
}

export const logger = new Logger();
