/**
 * AuditLogger
 *
 * Handles logging of all authorization decisions for security and debugging.
 */

import { AuditLogEntry } from "./types";

export class AuditLogger {
  private logs: AuditLogEntry[] = [];
  private maxLogs: number;
  private persistCallback?: (entry: AuditLogEntry) => Promise<void>;

  constructor(
    maxLogs = 10000,
    persistCallback?: (entry: AuditLogEntry) => Promise<void>,
  ) {
    this.maxLogs = maxLogs;
    this.persistCallback = persistCallback;
  }

  /**
   * Log an authorization decision
   */
  async log(entry: AuditLogEntry): Promise<void> {
    this.logs.push(entry);

    // Trim logs if exceeding max
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Persist if callback provided
    if (this.persistCallback) {
      try {
        await this.persistCallback(entry);
      } catch (error) {
        console.error("Failed to persist audit log:", error);
      }
    }
  }

  /**
   * Get all logs
   */
  getLogs(): AuditLogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs for a specific user
   */
  getLogsByUser(userId: string): AuditLogEntry[] {
    return this.logs.filter((log) => log.userId === userId);
  }

  /**
   * Get logs for a specific game
   */
  getLogsByGame(gameId: string): AuditLogEntry[] {
    return this.logs.filter((log) => log.gameId === gameId);
  }

  /**
   * Get logs within a time range
   */
  getLogsByTimeRange(start: number, end: number): AuditLogEntry[] {
    return this.logs.filter(
      (log) => log.timestamp >= start && log.timestamp <= end,
    );
  }

  /**
   * Get failed authorization attempts
   */
  getFailedAttempts(): AuditLogEntry[] {
    return this.logs.filter((log) => !log.result);
  }

  /**
   * Get failed attempts for a user
   */
  getFailedAttemptsByUser(userId: string): AuditLogEntry[] {
    return this.logs.filter((log) => log.userId === userId && !log.result);
  }

  /**
   * Clear all logs
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * Get statistics about authorization decisions
   */
  getStats(): {
    total: number;
    authorized: number;
    denied: number;
    denialRate: number;
  } {
    const total = this.logs.length;
    const authorized = this.logs.filter((log) => log.result).length;
    const denied = total - authorized;
    const denialRate = total > 0 ? denied / total : 0;

    return {
      total,
      authorized,
      denied,
      denialRate,
    };
  }
}
