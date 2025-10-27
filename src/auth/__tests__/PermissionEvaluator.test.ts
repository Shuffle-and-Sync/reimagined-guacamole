/**
 * PermissionEvaluator Tests
 */

import { PermissionEvaluator } from "../../../src/auth/PermissionEvaluator";
import { Permission, AuthContext } from "../../../src/auth/types";

describe("PermissionEvaluator", () => {
  let evaluator: PermissionEvaluator;

  beforeEach(() => {
    evaluator = new PermissionEvaluator();
  });

  const createContext = (permissions: Permission[] = []): AuthContext => ({
    userId: "user-1",
    sessionId: "session-1",
    gameId: "game-1",
    role: "player",
    permissions,
  });

  describe("evaluate", () => {
    it("should grant access for matching resource without conditions", () => {
      const permission: Permission = {
        resource: "game.state",
        action: "read",
      };

      const resource = { type: "game.state", data: {} };
      const context = createContext([permission]);

      const result = evaluator.evaluate(permission, context, resource);
      expect(result).toBe(true);
    });

    it("should deny access for non-matching resource", () => {
      const permission: Permission = {
        resource: "game.state",
        action: "read",
      };

      const resource = { type: "player.hand", data: {} };
      const context = createContext([permission]);

      const result = evaluator.evaluate(permission, context, resource);
      expect(result).toBe(false);
    });

    it("should evaluate equality condition", () => {
      const permission: Permission = {
        resource: "game.state",
        action: "write",
        conditions: [
          {
            field: "ownerId",
            operator: "eq",
            value: "user-1",
          },
        ],
      };

      const resource = { type: "game.state", ownerId: "user-1" };
      const context = createContext([permission]);

      const result = evaluator.evaluate(permission, context, resource);
      expect(result).toBe(true);
    });

    it("should evaluate not-equal condition", () => {
      const permission: Permission = {
        resource: "game.state",
        action: "read",
        conditions: [
          {
            field: "status",
            operator: "ne",
            value: "deleted",
          },
        ],
      };

      const resource = { type: "game.state", status: "active" };
      const context = createContext([permission]);

      const result = evaluator.evaluate(permission, context, resource);
      expect(result).toBe(true);
    });

    it("should evaluate in condition", () => {
      const permission: Permission = {
        resource: "game.state",
        action: "read",
        conditions: [
          {
            field: "status",
            operator: "in",
            value: ["active", "pending", "in_progress"],
          },
        ],
      };

      const resource = { type: "game.state", status: "active" };
      const context = createContext([permission]);

      const result = evaluator.evaluate(permission, context, resource);
      expect(result).toBe(true);
    });

    it("should deny when in condition not met", () => {
      const permission: Permission = {
        resource: "game.state",
        action: "read",
        conditions: [
          {
            field: "status",
            operator: "in",
            value: ["active", "pending"],
          },
        ],
      };

      const resource = { type: "game.state", status: "completed" };
      const context = createContext([permission]);

      const result = evaluator.evaluate(permission, context, resource);
      expect(result).toBe(false);
    });

    it("should evaluate custom check function", () => {
      const permission: Permission = {
        resource: "game.state",
        action: "write",
        conditions: [
          {
            field: "ownerId",
            operator: "custom",
            value: null,
            customCheck: (context, resource) => {
              return resource.ownerId === context.userId;
            },
          },
        ],
      };

      const resource = { type: "game.state", ownerId: "user-1" };
      const context = createContext([permission]);

      const result = evaluator.evaluate(permission, context, resource);
      expect(result).toBe(true);
    });

    it("should evaluate nested field paths", () => {
      const permission: Permission = {
        resource: "game.state",
        action: "read",
        conditions: [
          {
            field: "metadata.visibility",
            operator: "eq",
            value: "public",
          },
        ],
      };

      const resource = {
        type: "game.state",
        metadata: { visibility: "public" },
      };
      const context = createContext([permission]);

      const result = evaluator.evaluate(permission, context, resource);
      expect(result).toBe(true);
    });

    it("should deny when all conditions not met", () => {
      const permission: Permission = {
        resource: "game.state",
        action: "write",
        conditions: [
          {
            field: "ownerId",
            operator: "eq",
            value: "user-1",
          },
          {
            field: "status",
            operator: "eq",
            value: "active",
          },
        ],
      };

      const resource = {
        type: "game.state",
        ownerId: "user-1",
        status: "completed", // Doesn't match
      };
      const context = createContext([permission]);

      const result = evaluator.evaluate(permission, context, resource);
      expect(result).toBe(false);
    });
  });

  describe("evaluateAll", () => {
    it("should grant access if any permission matches", () => {
      const permissions: Permission[] = [
        {
          resource: "game.state",
          action: "read",
          conditions: [{ field: "ownerId", operator: "eq", value: "user-2" }],
        },
        {
          resource: "game.state",
          action: "read",
          conditions: [
            { field: "visibility", operator: "eq", value: "public" },
          ],
        },
      ];

      const resource = { type: "game.state", visibility: "public" };
      const context = createContext(permissions);

      const result = evaluator.evaluateAll(permissions, context, resource);
      expect(result).toBe(true);
    });

    it("should deny if no permissions match", () => {
      const permissions: Permission[] = [
        {
          resource: "game.state",
          action: "read",
          conditions: [{ field: "ownerId", operator: "eq", value: "user-2" }],
        },
        {
          resource: "player.hand",
          action: "read",
        },
      ];

      const resource = { type: "game.state", ownerId: "user-1" };
      const context = createContext(permissions);

      const result = evaluator.evaluateAll(permissions, context, resource);
      expect(result).toBe(false);
    });
  });

  describe("matchesPattern", () => {
    it("should match exact pattern", () => {
      const permission: Permission = {
        resource: "game.state",
        action: "read",
      };

      const resource = { type: "game.state" };
      const context = createContext([permission]);

      const result = evaluator.evaluate(permission, context, resource);
      expect(result).toBe(true);
    });

    it("should match wildcard pattern", () => {
      const permission: Permission = {
        resource: "game.*",
        action: "read",
      };

      const resource = { type: "game.state" };
      const context = createContext([permission]);

      const result = evaluator.evaluate(permission, context, resource);
      expect(result).toBe(true);
    });

    it("should match wildcard with multiple levels", () => {
      const permission: Permission = {
        resource: "game.*",
        action: "read",
      };

      const resource = { type: "game.player.hand" };
      const context = createContext([permission]);

      const result = evaluator.evaluate(permission, context, resource);
      expect(result).toBe(true);
    });
  });

  describe("hasPermission", () => {
    it("should return true for exact permission match", () => {
      const context = createContext([
        { resource: "game.state", action: "read" },
        { resource: "player.hand", action: "write" },
      ]);

      expect(evaluator.hasPermission(context, "game.state", "read")).toBe(true);
      expect(evaluator.hasPermission(context, "player.hand", "write")).toBe(
        true,
      );
    });

    it("should return false for non-matching permission", () => {
      const context = createContext([
        { resource: "game.state", action: "read" },
      ]);

      expect(evaluator.hasPermission(context, "game.state", "write")).toBe(
        false,
      );
      expect(evaluator.hasPermission(context, "player.hand", "read")).toBe(
        false,
      );
    });
  });

  describe("getMatchingPermissions", () => {
    it("should return all matching permissions", () => {
      const context = createContext([
        { resource: "game.state", action: "read" },
        { resource: "game.*", action: "read" },
        { resource: "player.hand", action: "read" },
      ]);

      const matching = evaluator.getMatchingPermissions(
        context,
        "game.state",
        "read",
      );
      expect(matching).toHaveLength(2);
    });

    it("should match action wildcards", () => {
      const context = createContext([
        { resource: "game.state", action: "*" },
        { resource: "game.state", action: "read" },
      ]);

      const matching = evaluator.getMatchingPermissions(
        context,
        "game.state",
        "read",
      );
      expect(matching).toHaveLength(2);
    });
  });

  describe("edge cases", () => {
    it("should handle undefined field value", () => {
      const permission: Permission = {
        resource: "game.state",
        action: "read",
        conditions: [
          {
            field: "nonexistent",
            operator: "eq",
            value: "test",
          },
        ],
      };

      const resource = { type: "game.state" };
      const context = createContext([permission]);

      const result = evaluator.evaluate(permission, context, resource);
      expect(result).toBe(false);
    });

    it("should handle non-object resource", () => {
      const permission: Permission = {
        resource: "game.state",
        action: "read",
      };

      const resource = "simple-string";
      const context = createContext([permission]);

      // Should match based on string conversion
      const result = evaluator.evaluate(permission, context, resource);
      expect(result).toBe(false);
    });

    it("should handle null resource", () => {
      const permission: Permission = {
        resource: "game.state",
        action: "read",
      };

      const context = createContext([permission]);

      const result = evaluator.evaluate(permission, context, null);
      expect(result).toBe(false);
    });

    it("should handle in operator with non-array value", () => {
      const permission: Permission = {
        resource: "game.state",
        action: "read",
        conditions: [
          {
            field: "status",
            operator: "in",
            value: "not-an-array",
          },
        ],
      };

      const resource = { type: "game.state", status: "active" };
      const context = createContext([permission]);

      const result = evaluator.evaluate(permission, context, resource);
      expect(result).toBe(false);
    });
  });
});
