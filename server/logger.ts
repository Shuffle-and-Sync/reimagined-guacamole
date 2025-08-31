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

class Logger {
  private logLevel: number;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.logLevel = this.isDevelopment ? LOG_LEVELS.DEBUG : LOG_LEVELS.ERROR;
  }

  private formatMessage(level: string, message: string, context?: any): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level}] ${message}${contextStr}`;
  }

  private shouldLog(level: number): boolean {
    return level <= this.logLevel;
  }

  error(message: string, error?: Error | any, context?: any): void {
    if (this.shouldLog(LOG_LEVELS.ERROR)) {
      const errorInfo = error instanceof Error 
        ? `\nError: ${error.message}\nStack: ${error.stack}` 
        : error ? `\nError Data: ${JSON.stringify(error)}` : '';
      
      if (this.isDevelopment) {
        console.error(this.formatMessage('ERROR', message, context) + errorInfo);
      } else {
        // In production, you might want to send to external logging service
        console.error(this.formatMessage('ERROR', message, context));
      }
    }
  }

  warn(message: string, context?: any): void {
    if (this.shouldLog(LOG_LEVELS.WARN)) {
      if (this.isDevelopment) {
        console.warn(this.formatMessage('WARN', message, context));
      }
    }
  }

  info(message: string, context?: any): void {
    if (this.shouldLog(LOG_LEVELS.INFO)) {
      if (this.isDevelopment) {
        console.info(this.formatMessage('INFO', message, context));
      }
    }
  }

  debug(message: string, context?: any): void {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      if (this.isDevelopment) {
        console.log(this.formatMessage('DEBUG', message, context));
      }
    }
  }

  // Special method for API requests (only in development)
  apiRequest(method: string, path: string, statusCode: number, duration: number, response?: any): void {
    if (this.isDevelopment) {
      let logLine = `${method} ${path} ${statusCode} in ${duration}ms`;
      if (response) {
        logLine += ` :: ${JSON.stringify(response)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  }
}

export const logger = new Logger();