import { logger } from '../logger';

export interface WebSocketEnvironmentConfig {
  authUrl: string;
  port: number;
  isProduction: boolean;
  allowedOrigins: string[];
  wsProtocol: 'ws' | 'wss';
  baseUrl: string;
}

export class WebSocketEnvironmentValidator {
  private config: WebSocketEnvironmentConfig | null = null;

  /**
   * Validate and normalize WebSocket environment configuration
   */
  validateAndGetConfig(): WebSocketEnvironmentConfig {
    if (this.config) {
      return this.config;
    }

    const port = this.validatePort();
    const authUrl = this.validateAuthUrl(port);
    const isProduction = this.determineEnvironment();
    const allowedOrigins = this.buildAllowedOrigins(authUrl, port);
    const wsProtocol = this.determineWebSocketProtocol(isProduction);
    const baseUrl = this.buildBaseUrl(wsProtocol, authUrl, port);

    this.config = {
      authUrl,
      port,
      isProduction,
      allowedOrigins,
      wsProtocol,
      baseUrl
    };

    logger.info('WebSocket environment configuration validated', {
      authUrl: this.config.authUrl,
      port: this.config.port,
      isProduction: this.config.isProduction,
      allowedOrigins: this.config.allowedOrigins.length,
      wsProtocol: this.config.wsProtocol,
      baseUrl: this.config.baseUrl
    });

    return this.config;
  }

  /**
   * Get WebSocket URL for client connections
   */
  getWebSocketUrl(): string {
    const config = this.validateAndGetConfig();
    return `${config.wsProtocol}://${this.extractHostFromUrl(config.baseUrl)}/ws`;
  }

  /**
   * Check if an origin is allowed
   */
  isOriginAllowed(origin: string): boolean {
    const config = this.validateAndGetConfig();
    return config.allowedOrigins.includes(origin);
  }

  /**
   * Get authentication endpoint URL
   */
  getAuthSessionUrl(): string {
    const config = this.validateAndGetConfig();
    return `${config.authUrl}/api/auth/session`;
  }

  private validatePort(): number {
    const portEnv = process.env.PORT;
    const port = portEnv ? parseInt(portEnv, 10) : 5000;
    
    if (isNaN(port) || port < 1 || port > 65535) {
      logger.warn('Invalid PORT environment variable, using default 5000', { port: portEnv });
      return 5000;
    }

    return port;
  }

  private validateAuthUrl(port: number): string {
    let authUrl = process.env.AUTH_URL;
    
    if (!authUrl || authUrl === 'undefined' || authUrl.trim() === '') {
      // Build default auth URL based on environment
      if (this.determineEnvironment()) {
        // Production: This should be set explicitly
        logger.error('AUTH_URL is required in production environment');
        throw new Error('AUTH_URL environment variable is required in production');
      } else {
        // Development: Build localhost URL
        authUrl = `http://localhost:${port}`;
        logger.warn('AUTH_URL not set, using default for development', { authUrl });
      }
    }

    // Validate URL format
    try {
      const url = new URL(authUrl);
      return url.origin; // Normalize to origin only
    } catch (error) {
      logger.error('Invalid AUTH_URL format', { authUrl, error });
      throw new Error(`Invalid AUTH_URL format: ${authUrl}`);
    }
  }

  private determineEnvironment(): boolean {
    const nodeEnv = process.env.NODE_ENV;
    const isProduction = nodeEnv === 'production';
    
    // Additional production indicators
    const productionIndicators = [
      process.env.AUTH_URL && !process.env.AUTH_URL.includes('localhost'),
      process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost'),
      process.env.VERCEL_ENV === 'production',
      process.env.RAILWAY_ENVIRONMENT === 'production'
    ];

    return isProduction || productionIndicators.some(Boolean);
  }

  private buildAllowedOrigins(authUrl: string, port: number): string[] {
    const origins = new Set<string>();
    
    // Add AUTH_URL origin
    try {
      const authOrigin = new URL(authUrl).origin;
      origins.add(authOrigin);
    } catch (error) {
      logger.warn('Could not parse AUTH_URL for allowed origins', { authUrl });
    }

    // Add localhost origins for development
    if (!this.determineEnvironment()) {
      origins.add(`http://localhost:${port}`);
      origins.add(`https://localhost:${port}`);
      origins.add('http://127.0.0.1:' + port);
      origins.add('https://127.0.0.1:' + port);
    }

    // Add any additional allowed origins from environment
    const additionalOrigins = process.env.ALLOWED_ORIGINS;
    if (additionalOrigins) {
      additionalOrigins.split(',').forEach(origin => {
        const trimmed = origin.trim();
        if (trimmed) {
          origins.add(trimmed);
        }
      });
    }

    // Add Replit-specific origins if detected
    if (process.env.REPL_ID || process.env.REPLIT_DB_URL) {
      const replitHost = this.extractHostFromUrl(authUrl);
      if (replitHost && replitHost.includes('replit.dev')) {
        origins.add(`https://${replitHost}`);
        origins.add(`wss://${replitHost}`);
      }
    }

    const allowedOrigins = Array.from(origins).filter(Boolean);
    
    if (allowedOrigins.length === 0) {
      logger.warn('No allowed origins configured, WebSocket connections may fail');
    }

    return allowedOrigins;
  }

  private determineWebSocketProtocol(isProduction: boolean): 'ws' | 'wss' {
    if (isProduction) {
      return 'wss'; // Always use secure WebSocket in production
    }
    
    // In development, use ws:// for localhost, wss:// for everything else
    const authUrl = process.env.AUTH_URL;
    if (authUrl && !authUrl.includes('localhost') && !authUrl.includes('127.0.0.1')) {
      return 'wss';
    }
    
    return 'ws';
  }

  private buildBaseUrl(wsProtocol: 'ws' | 'wss', authUrl: string, port: number): string {
    try {
      const url = new URL(authUrl);
      const protocol = wsProtocol === 'wss' ? 'https:' : 'http:';
      return `${protocol}//${url.host}`;
    } catch (error) {
      // Fallback for localhost
      const protocol = wsProtocol === 'wss' ? 'https:' : 'http:';
      return `${protocol}//localhost:${port}`;
    }
  }

  private extractHostFromUrl(url: string): string {
    try {
      return new URL(url).host;
    } catch (error) {
      logger.warn('Could not extract host from URL', { url });
      return 'localhost';
    }
  }

  /**
   * Validate all required environment variables for WebSocket functionality
   */
  validateRequiredEnvironment(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      this.validateAndGetConfig();
    } catch (error) {
      errors.push(`Configuration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Check for required AUTH_SECRET
    if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET === 'undefined') {
      errors.push('AUTH_SECRET environment variable is required');
    }

    // Check for required DATABASE_URL
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL === 'undefined') {
      errors.push('DATABASE_URL environment variable is required');
    }

    // In production, more strict validation
    if (this.determineEnvironment()) {
      if (!process.env.AUTH_URL || process.env.AUTH_URL === 'undefined') {
        errors.push('AUTH_URL environment variable is required in production');
      }

      if (process.env.AUTH_SECRET === 'demo-secret-key-for-development-only-not-for-production') {
        errors.push('AUTH_SECRET must be changed from development default in production');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const envValidator = new WebSocketEnvironmentValidator();