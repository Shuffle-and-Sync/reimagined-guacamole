/**
 * Custom Error Classes for Tournament Management
 *
 * Centralized error definitions for specialized tournament features
 */

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

export class CircuitBreakerOpenError extends Error {
  constructor(platform: string) {
    super(`Circuit breaker open for ${platform}`);
    this.name = "CircuitBreakerOpenError";
  }
}

export class InvalidBracketError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidBracketError";
  }
}

export class MatchmakingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MatchmakingError";
  }
}

export class SeedingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SeedingError";
  }
}
