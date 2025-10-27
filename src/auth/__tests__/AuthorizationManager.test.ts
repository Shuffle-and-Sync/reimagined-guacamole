/**
 * AuthorizationManager Tests
 */

import { AuditLogger } from "../../../src/auth/AuditLogger";
import { AuthorizationManager } from "../../../src/auth/AuthorizationManager";
import { AuthorizationRule, AuthContext } from "../../../src/auth/types";

describe("AuthorizationManager", () => {
  let manager: AuthorizationManager;
  let auditLogger: AuditLogger;

  beforeEach(() => {
    auditLogger = new AuditLogger();
    manager = new AuthorizationManager(auditLogger);
  });

  const createContext = (
    role: "player" | "spectator" | "moderator" | "admin" = "player",
  ): AuthContext => ({
    userId: "user-1",
    sessionId: "session-1",
    gameId: "game-1",
    role,
    permissions: [],
  });

  describe("addRule", () => {
    it("should add a new rule", () => {
      const rule: AuthorizationRule = {
        name: "test-rule",
        priority: 50,
        match: () => true,
        authorize: () => ({ authorized: true }),
      };

      manager.addRule(rule);
      const rules = manager.getRules();

      expect(rules).toHaveLength(4); // 3 default + 1 added
      expect(rules.some((r) => r.name === "test-rule")).toBe(true);
    });

    it("should sort rules by priority", () => {
      const rule1: AuthorizationRule = {
        name: "low-priority",
        priority: 10,
        match: () => true,
        authorize: () => ({ authorized: true }),
      };

      const rule2: AuthorizationRule = {
        name: "high-priority",
        priority: 100,
        match: () => true,
        authorize: () => ({ authorized: true }),
      };

      manager.addRule(rule1);
      manager.addRule(rule2);

      const rules = manager.getRules();
      expect(rules[0].name).toBe("admin-bypass"); // Default highest (1000)
      expect(rules[1].name).toBe("moderator-permissions"); // Default (500)
    });
  });

  describe("removeRule", () => {
    it("should remove a rule by name", () => {
      const rule: AuthorizationRule = {
        name: "test-rule",
        priority: 50,
        match: () => true,
        authorize: () => ({ authorized: true }),
      };

      manager.addRule(rule);
      expect(manager.getRules().some((r) => r.name === "test-rule")).toBe(true);

      const removed = manager.removeRule("test-rule");
      expect(removed).toBe(true);
      expect(manager.getRules().some((r) => r.name === "test-rule")).toBe(
        false,
      );
    });

    it("should return false if rule not found", () => {
      const removed = manager.removeRule("nonexistent");
      expect(removed).toBe(false);
    });
  });

  describe("getRule", () => {
    it("should get a rule by name", () => {
      const rule = manager.getRule("admin-bypass");
      expect(rule).toBeDefined();
      expect(rule?.name).toBe("admin-bypass");
    });

    it("should return undefined for nonexistent rule", () => {
      const rule = manager.getRule("nonexistent");
      expect(rule).toBeUndefined();
    });
  });

  describe("clearRules", () => {
    it("should clear all rules", () => {
      manager.clearRules();
      expect(manager.getRules()).toHaveLength(0);
    });
  });

  describe("authorize", () => {
    it("should authorize admin for any action", async () => {
      const context = createContext("admin");
      const result = await manager.authorize(
        "game.action.anything",
        context,
        {},
      );

      expect(result.authorized).toBe(true);

      const logs = auditLogger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].result).toBe(true);
    });

    it("should deny spectator write actions", async () => {
      const context = createContext("spectator");
      const result = await manager.authorize("game.action.move", context, {});

      expect(result.authorized).toBe(false);
      expect(result.reason).toBe("Spectators cannot modify game state");
    });

    it("should allow spectator read actions", async () => {
      const context = createContext("spectator");
      const result = await manager.authorize("game.view.board", context, {});

      expect(result.authorized).toBe(true);
    });

    it("should allow moderator to view anything", async () => {
      const context = createContext("moderator");
      const result = await manager.authorize("game.view.hand", context, {});

      expect(result.authorized).toBe(true);
    });

    it("should allow moderator admin actions", async () => {
      const context = createContext("moderator");
      const result = await manager.authorize(
        "game.moderate.reset",
        context,
        {},
      );

      expect(result.authorized).toBe(true);
    });

    it("should deny moderator player actions", async () => {
      const context = createContext("moderator");
      const result = await manager.authorize("game.action.move", context, {});

      expect(result.authorized).toBe(false);
      expect(result.reason).toBe("Moderators cannot perform player actions");
    });

    it("should deny when no matching rule", async () => {
      manager.clearRules();

      const context = createContext("player");
      const result = await manager.authorize("unknown.action", context, {});

      expect(result.authorized).toBe(false);
      expect(result.reason).toBe("No matching authorization rule");
    });

    it("should apply highest priority matching rule", async () => {
      const lowPriorityRule: AuthorizationRule = {
        name: "low-priority",
        priority: 10,
        match: (action) => action === "test.action",
        authorize: () => ({ authorized: false, reason: "Low priority denial" }),
      };

      const highPriorityRule: AuthorizationRule = {
        name: "high-priority",
        priority: 100,
        match: (action) => action === "test.action",
        authorize: () => ({ authorized: true }),
      };

      manager.addRule(lowPriorityRule);
      manager.addRule(highPriorityRule);

      const context = createContext("player");
      const result = await manager.authorize("test.action", context, {});

      expect(result.authorized).toBe(true); // High priority wins
    });

    it("should log all authorization decisions", async () => {
      const context = createContext("player");

      await manager.authorize("game.view.board", context, {});
      await manager.authorize("game.action.move", context, {});

      const logs = auditLogger.getLogs();
      expect(logs).toHaveLength(2);
      expect(logs[0].userId).toBe("user-1");
      expect(logs[0].gameId).toBe("game-1");
    });
  });

  describe("checkAuthorization", () => {
    it("should check authorization without auditing", async () => {
      const context = createContext("admin");
      const result = manager.checkAuthorization(
        "game.action.anything",
        context,
        {},
      );

      expect(result.authorized).toBe(true);

      const logs = auditLogger.getLogs();
      expect(logs).toHaveLength(0); // No audit log
    });
  });

  describe("getAuditLogger", () => {
    it("should return the audit logger", () => {
      const logger = manager.getAuditLogger();
      expect(logger).toBe(auditLogger);
    });
  });

  describe("default rules", () => {
    it("should have admin-bypass rule", () => {
      const rule = manager.getRule("admin-bypass");
      expect(rule).toBeDefined();
      expect(rule?.priority).toBe(1000);
    });

    it("should have spectator-readonly rule", () => {
      const rule = manager.getRule("spectator-readonly");
      expect(rule).toBeDefined();
      expect(rule?.priority).toBe(200);
    });

    it("should have moderator-permissions rule", () => {
      const rule = manager.getRule("moderator-permissions");
      expect(rule).toBeDefined();
      expect(rule?.priority).toBe(500);
    });
  });

  describe("complex scenarios", () => {
    it("should handle multiple rules matching", async () => {
      const rule1: AuthorizationRule = {
        name: "rule-1",
        priority: 60,
        match: (action) => action.startsWith("game."),
        authorize: () => ({ authorized: true }),
      };

      const rule2: AuthorizationRule = {
        name: "rule-2",
        priority: 50,
        match: (action) => action.startsWith("game.action."),
        authorize: () => ({ authorized: false, reason: "Denied by rule 2" }),
      };

      manager.addRule(rule1);
      manager.addRule(rule2);

      const context = createContext("player");
      const result = await manager.authorize("game.action.move", context, {});

      // rule-1 has higher priority
      expect(result.authorized).toBe(true);
    });

    it("should handle state-dependent authorization", async () => {
      const stateRule: AuthorizationRule = {
        name: "state-rule",
        priority: 150,
        match: (action) => action === "game.action.move",
        authorize: (action, context, state) => {
          if (state.activePlayer === context.userId) {
            return { authorized: true };
          }
          return { authorized: false, reason: "Not your turn" };
        },
      };

      manager.addRule(stateRule);

      const context = createContext("player");

      // Test when it's player's turn
      let result = await manager.authorize("game.action.move", context, {
        activePlayer: "user-1",
      });
      expect(result.authorized).toBe(true);

      // Test when it's not player's turn
      result = await manager.authorize("game.action.move", context, {
        activePlayer: "user-2",
      });
      expect(result.authorized).toBe(false);
      expect(result.reason).toBe("Not your turn");
    });
  });
});
