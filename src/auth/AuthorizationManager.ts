/**
 * AuthorizationManager
 *
 * Core authorization system that manages rules and evaluates authorization requests.
 */

import { AuditLogger } from "./AuditLogger";
import { AuthorizationRule, AuthContext, AuthResult } from "./types";

export class AuthorizationManager {
  private rules: AuthorizationRule[] = [];
  private auditLogger: AuditLogger;

  constructor(auditLogger?: AuditLogger) {
    this.auditLogger = auditLogger || new AuditLogger();
    this.registerDefaultRules();
  }

  /**
   * Add a new authorization rule
   */
  addRule(rule: AuthorizationRule): void {
    this.rules.push(rule);
    // Sort by priority (highest first)
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Remove a rule by name
   */
  removeRule(name: string): boolean {
    const index = this.rules.findIndex((rule) => rule.name === name);
    if (index !== -1) {
      this.rules.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get all rules
   */
  getRules(): AuthorizationRule[] {
    return [...this.rules];
  }

  /**
   * Get a rule by name
   */
  getRule(name: string): AuthorizationRule | undefined {
    return this.rules.find((rule) => rule.name === name);
  }

  /**
   * Clear all rules
   */
  clearRules(): void {
    this.rules = [];
  }

  /**
   * Authorize an action
   */
  async authorize(
    action: string,
    context: AuthContext,
    state: any,
  ): Promise<AuthResult> {
    // Find matching rules
    const matchingRules = this.rules.filter((rule) =>
      rule.match(action, context),
    );

    if (matchingRules.length === 0) {
      const result = this.deny("No matching authorization rule");
      await this.auditLogger.log({
        userId: context.userId,
        sessionId: context.sessionId,
        gameId: context.gameId,
        action,
        result: result.authorized,
        reason: result.reason,
        timestamp: Date.now(),
      });
      return result;
    }

    // Apply first matching rule (highest priority)
    const result = matchingRules[0].authorize(action, context, state);

    // Audit log
    await this.auditLogger.log({
      userId: context.userId,
      sessionId: context.sessionId,
      gameId: context.gameId,
      action,
      result: result.authorized,
      reason: result.reason,
      timestamp: Date.now(),
      metadata: {
        ruleName: matchingRules[0].name,
        priority: matchingRules[0].priority,
      },
    });

    return result;
  }

  /**
   * Check if an action is authorized without auditing
   */
  checkAuthorization(
    action: string,
    context: AuthContext,
    state: any,
  ): AuthResult {
    const matchingRules = this.rules.filter((rule) =>
      rule.match(action, context),
    );

    if (matchingRules.length === 0) {
      return this.deny("No matching authorization rule");
    }

    return matchingRules[0].authorize(action, context, state);
  }

  /**
   * Get the audit logger
   */
  getAuditLogger(): AuditLogger {
    return this.auditLogger;
  }

  /**
   * Create a denial result
   */
  private deny(reason: string, requiredPermissions?: string[]): AuthResult {
    return {
      authorized: false,
      reason,
      requiredPermissions,
    };
  }

  /**
   * Register default authorization rules
   */
  private registerDefaultRules(): void {
    // Admin bypass rule - highest priority
    this.addRule({
      name: "admin-bypass",
      priority: 1000,
      match: (action, context) => context.role === "admin",
      authorize: () => ({ authorized: true }),
    });

    // Spectator read-only rule
    this.addRule({
      name: "spectator-readonly",
      priority: 200,
      match: (action, context) => context.role === "spectator",
      authorize: (action) => {
        const isReadAction =
          action.startsWith("game.view.") || action.startsWith("game.read.");

        if (!isReadAction) {
          return {
            authorized: false,
            reason: "Spectators cannot modify game state",
          };
        }

        return { authorized: true };
      },
    });

    // Moderator permissions
    this.addRule({
      name: "moderator-permissions",
      priority: 500,
      match: (action, context) => context.role === "moderator",
      authorize: (action) => {
        // Moderators can read anything
        if (
          action.startsWith("game.view.") ||
          action.startsWith("game.read.")
        ) {
          return { authorized: true };
        }

        // Moderators can manage game state
        if (
          action.startsWith("game.moderate.") ||
          action.startsWith("game.admin.") ||
          action.startsWith("game.reset.")
        ) {
          return { authorized: true };
        }

        // But cannot perform player actions
        if (action.startsWith("game.action.")) {
          return {
            authorized: false,
            reason: "Moderators cannot perform player actions",
          };
        }

        return { authorized: true };
      },
    });
  }
}
