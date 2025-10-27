/**
 * Authorization System Integration Tests
 */

import {
  AuthorizationManager,
  AuditLogger,
  AuthorizationMiddleware,
  PermissionEvaluator,
 baseRules, mtgRules, pokemonRules } from "../../../src/auth";
import { AuthContext, GameRequest } from "../../../src/auth/types";

describe("Authorization System Integration", () => {
  let manager: AuthorizationManager;
  let middleware: AuthorizationMiddleware;
  let auditLogger: AuditLogger;

  beforeEach(() => {
    auditLogger = new AuditLogger();
    manager = new AuthorizationManager(auditLogger);
    middleware = new AuthorizationMiddleware(manager);
  });

  describe("Complete authorization flow", () => {
    it("should handle player making valid move on their turn", async () => {
      // Add base rules
      baseRules.forEach((rule) => manager.addRule(rule));

      const context: AuthContext = {
        userId: "player-1",
        sessionId: "session-1",
        gameId: "game-1",
        role: "player",
        permissions: [],
      };

      const state = {
        activePlayer: "player-1",
        status: "active",
      };

      const result = await manager.authorize(
        "game.action.move",
        context,
        state,
      );

      expect(result.authorized).toBe(true);
      expect(auditLogger.getLogs()).toHaveLength(1);
      expect(auditLogger.getLogs()[0].result).toBe(true);
    });

    it("should deny player action when not their turn", async () => {
      baseRules.forEach((rule) => manager.addRule(rule));

      const context: AuthContext = {
        userId: "player-1",
        sessionId: "session-1",
        gameId: "game-1",
        role: "player",
        permissions: [],
      };

      const state = {
        activePlayer: "player-2",
        status: "active",
      };

      const result = await manager.authorize(
        "game.action.move",
        context,
        state,
      );

      expect(result.authorized).toBe(false);
      expect(result.reason).toBe("Not your turn");

      const failedAttempts = auditLogger.getFailedAttempts();
      expect(failedAttempts).toHaveLength(1);
    });

    it("should enforce MTG priority rules", async () => {
      baseRules.forEach((rule) => manager.addRule(rule));
      mtgRules.forEach((rule) => manager.addRule(rule));

      const context: AuthContext = {
        userId: "player-1",
        sessionId: "session-1",
        gameId: "game-1",
        role: "player",
        permissions: [],
      };

      // Player has priority
      let state = {
        activePlayer: "player-1",
        status: "active",
        priority: { currentPlayer: "player-1" },
      };

      let result = await manager.authorize(
        "game.action.cast.spell",
        context,
        state,
      );
      expect(result.authorized).toBe(true);

      // Player doesn't have priority
      state = {
        activePlayer: "player-1",
        status: "active",
        priority: { currentPlayer: "player-2" },
      };

      result = await manager.authorize(
        "game.action.cast.spell",
        context,
        state,
      );
      expect(result.authorized).toBe(false);
      expect(result.reason).toBe("You do not have priority");
    });

    it("should enforce Pokemon energy attachment limits", async () => {
      baseRules.forEach((rule) => manager.addRule(rule));
      pokemonRules.forEach((rule) => manager.addRule(rule));

      const context: AuthContext = {
        userId: "player-1",
        sessionId: "session-1",
        gameId: "game-1",
        role: "player",
        permissions: [],
      };

      // First energy attachment
      let state = {
        activePlayer: "player-1",
        status: "active",
        players: [
          { id: "player-1", energiesAttachedThisTurn: 0 },
          { id: "player-2", energiesAttachedThisTurn: 0 },
        ],
      };

      let result = await manager.authorize(
        "game.action.attach.energy",
        context,
        state,
      );
      expect(result.authorized).toBe(true);

      // Second energy attachment (should fail)
      state = {
        activePlayer: "player-1",
        status: "active",
        players: [
          { id: "player-1", energiesAttachedThisTurn: 1 },
          { id: "player-2", energiesAttachedThisTurn: 0 },
        ],
      };

      result = await manager.authorize(
        "game.action.attach.energy",
        context,
        state,
      );
      expect(result.authorized).toBe(false);
      expect(result.reason).toBe("Already attached energy this turn");
    });

    it("should respect role hierarchy (admin > moderator > player > spectator)", async () => {
      baseRules.forEach((rule) => manager.addRule(rule));

      const state = { status: "active" };

      // Admin can do anything
      let context: AuthContext = {
        userId: "admin-1",
        sessionId: "session-1",
        gameId: "game-1",
        role: "admin",
        permissions: [],
      };
      let result = await manager.authorize("game.action.move", context, state);
      expect(result.authorized).toBe(true);

      // Moderator can view but not play
      context = {
        userId: "mod-1",
        sessionId: "session-1",
        gameId: "game-1",
        role: "moderator",
        permissions: [],
      };
      result = await manager.authorize("game.view.hand", context, state);
      expect(result.authorized).toBe(true);

      result = await manager.authorize("game.action.move", context, state);
      expect(result.authorized).toBe(false);

      // Spectator can only view
      context = {
        userId: "spectator-1",
        sessionId: "session-1",
        gameId: "game-1",
        role: "spectator",
        permissions: [],
      };
      result = await manager.authorize("game.view.board", context, state);
      expect(result.authorized).toBe(true);

      result = await manager.authorize("game.action.move", context, state);
      expect(result.authorized).toBe(false);
    });
  });

  describe("Permission-based authorization", () => {
    it("should evaluate permissions correctly", () => {
      const evaluator = new PermissionEvaluator();

      const context: AuthContext = {
        userId: "player-1",
        sessionId: "session-1",
        gameId: "game-1",
        role: "player",
        permissions: [
          {
            resource: "game.state",
            action: "read",
          },
          {
            resource: "player.hand",
            action: "write",
            conditions: [
              {
                field: "ownerId",
                operator: "eq",
                value: "player-1",
              },
            ],
          },
        ],
      };

      // Can read game state
      expect(evaluator.hasPermission(context, "game.state", "read")).toBe(true);

      // Can't write game state (no permission)
      expect(evaluator.hasPermission(context, "game.state", "write")).toBe(
        false,
      );

      // Can write own hand
      const ownHand = { type: "player.hand", ownerId: "player-1" };
      const writeHandPermission = context.permissions[1];
      expect(evaluator.evaluate(writeHandPermission, context, ownHand)).toBe(
        true,
      );

      // Can't write other's hand
      const otherHand = { type: "player.hand", ownerId: "player-2" };
      expect(evaluator.evaluate(writeHandPermission, context, otherHand)).toBe(
        false,
      );
    });
  });

  describe("Audit logging", () => {
    it("should track authorization patterns and detect suspicious activity", async () => {
      baseRules.forEach((rule) => manager.addRule(rule));

      const context: AuthContext = {
        userId: "player-1",
        sessionId: "session-1",
        gameId: "game-1",
        role: "player",
        permissions: [],
      };

      const wrongTurnState = {
        activePlayer: "player-2",
        status: "active",
      };

      // Simulate multiple failed attempts
      for (let i = 0; i < 5; i++) {
        await manager.authorize("game.action.move", context, wrongTurnState);
      }

      const stats = auditLogger.getStats();
      expect(stats.total).toBe(5);
      expect(stats.denied).toBe(5);
      expect(stats.denialRate).toBe(1.0);

      const failedAttempts = auditLogger.getFailedAttemptsByUser("player-1");
      expect(failedAttempts).toHaveLength(5);
      expect(
        failedAttempts.every((log) => log.reason === "Not your turn"),
      ).toBe(true);
    });
  });
});
