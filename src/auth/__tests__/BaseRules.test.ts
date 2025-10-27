/**
 * Base Authorization Rules Tests
 */

import {
  turnBasedRule,
  handVisibilityRule,
  gamePhaseRule,
  playerCountRule,
  gameStateRule,
  resourceOwnershipRule,
} from "../../../src/auth/rules/BaseRules";
import { AuthContext } from "../../../src/auth/types";

describe("BaseRules", () => {
  const createContext = (
    role: "player" | "spectator" | "moderator" = "player",
  ): AuthContext => ({
    userId: "user-1",
    sessionId: "session-1",
    gameId: "game-1",
    role,
    permissions: [],
  });

  describe("turnBasedRule", () => {
    it("should allow player action on their turn", () => {
      const context = createContext("player");
      const state = { activePlayer: "user-1" };

      expect(turnBasedRule.match("game.action.move", context)).toBe(true);

      const result = turnBasedRule.authorize(
        "game.action.move",
        context,
        state,
      );
      expect(result.authorized).toBe(true);
    });

    it("should deny player action when not their turn", () => {
      const context = createContext("player");
      const state = { activePlayer: "user-2" };

      const result = turnBasedRule.authorize(
        "game.action.move",
        context,
        state,
      );
      expect(result.authorized).toBe(false);
      expect(result.reason).toBe("Not your turn");
    });

    it("should not match non-action requests", () => {
      const context = createContext("player");
      expect(turnBasedRule.match("game.view.board", context)).toBe(false);
    });

    it("should not match spectator actions", () => {
      const context = createContext("spectator");
      expect(turnBasedRule.match("game.action.move", context)).toBe(false);
    });
  });

  describe("handVisibilityRule", () => {
    it("should allow player to view their own hand", () => {
      const context = createContext("player");
      const state = { requestedPlayerId: "user-1" };

      expect(handVisibilityRule.match("game.view.hand", context)).toBe(true);

      const result = handVisibilityRule.authorize(
        "game.view.hand",
        context,
        state,
      );
      expect(result.authorized).toBe(true);
    });

    it("should deny player viewing opponent's hand", () => {
      const context = createContext("player");
      const state = { requestedPlayerId: "user-2" };

      const result = handVisibilityRule.authorize(
        "game.view.hand",
        context,
        state,
      );
      expect(result.authorized).toBe(false);
      expect(result.reason).toBe("Cannot view opponent hand");
    });

    it("should allow moderator to view any hand", () => {
      const context = createContext("moderator");
      const state = { requestedPlayerId: "user-2" };

      const result = handVisibilityRule.authorize(
        "game.view.hand",
        context,
        state,
      );
      expect(result.authorized).toBe(true);
    });
  });

  describe("gamePhaseRule", () => {
    it("should allow action in correct phase", () => {
      const context = createContext("player");
      const state = {
        currentPhase: {
          name: "main",
          allowedActions: ["move", "attack", "cast"],
        },
      };

      expect(gamePhaseRule.match("game.action.move", context)).toBe(true);

      const result = gamePhaseRule.authorize(
        "game.action.move",
        context,
        state,
      );
      expect(result.authorized).toBe(true);
    });

    it("should deny action in wrong phase", () => {
      const context = createContext("player");
      const state = {
        currentPhase: {
          name: "draw",
          allowedActions: ["draw"],
        },
      };

      const result = gamePhaseRule.authorize(
        "game.action.attack",
        context,
        state,
      );
      expect(result.authorized).toBe(false);
      expect(result.reason).toContain("not allowed in draw phase");
    });

    it("should allow if no phase restrictions", () => {
      const context = createContext("player");
      const state = { currentPhase: { name: "main" } };

      const result = gamePhaseRule.authorize(
        "game.action.move",
        context,
        state,
      );
      expect(result.authorized).toBe(true);
    });
  });

  describe("playerCountRule", () => {
    it("should allow game start with valid player count", () => {
      const context = createContext("player");
      const state = {
        players: ["user-1", "user-2"],
        config: { minPlayers: 2, maxPlayers: 4 },
      };

      expect(playerCountRule.match("game.action.start", context)).toBe(true);

      const result = playerCountRule.authorize(
        "game.action.start",
        context,
        state,
      );
      expect(result.authorized).toBe(true);
    });

    it("should deny game start with too few players", () => {
      const context = createContext("player");
      const state = {
        players: ["user-1"],
        config: { minPlayers: 2, maxPlayers: 4 },
      };

      const result = playerCountRule.authorize(
        "game.action.start",
        context,
        state,
      );
      expect(result.authorized).toBe(false);
      expect(result.reason).toContain("Need at least 2 players");
    });

    it("should deny game start with too many players", () => {
      const context = createContext("player");
      const state = {
        players: ["user-1", "user-2", "user-3", "user-4", "user-5"],
        config: { minPlayers: 2, maxPlayers: 4 },
      };

      const result = playerCountRule.authorize(
        "game.action.start",
        context,
        state,
      );
      expect(result.authorized).toBe(false);
      expect(result.reason).toContain("Maximum 4 players");
    });

    it("should use default player limits", () => {
      const context = createContext("player");
      const state = {
        players: ["user-1", "user-2"],
      };

      const result = playerCountRule.authorize(
        "game.action.start",
        context,
        state,
      );
      expect(result.authorized).toBe(true);
    });
  });

  describe("gameStateRule", () => {
    it("should allow actions in active game", () => {
      const context = createContext("player");
      const state = { status: "active" };

      expect(gameStateRule.match("game.action.move", context)).toBe(true);

      const result = gameStateRule.authorize(
        "game.action.move",
        context,
        state,
      );
      expect(result.authorized).toBe(true);
    });

    it("should allow actions in in_progress game", () => {
      const context = createContext("player");
      const state = { status: "in_progress" };

      const result = gameStateRule.authorize(
        "game.action.move",
        context,
        state,
      );
      expect(result.authorized).toBe(true);
    });

    it("should deny actions in completed game", () => {
      const context = createContext("player");
      const state = { status: "completed" };

      const result = gameStateRule.authorize(
        "game.action.move",
        context,
        state,
      );
      expect(result.authorized).toBe(false);
      expect(result.reason).toContain("not active");
    });

    it("should allow game.action.start regardless of state", () => {
      const context = createContext("player");
      const state = { status: "pending" };

      const result = gameStateRule.authorize(
        "game.action.start",
        context,
        state,
      );
      expect(result.authorized).toBe(true);
    });

    it("should handle state field instead of status", () => {
      const context = createContext("player");
      const state = { state: "active" };

      const result = gameStateRule.authorize(
        "game.action.move",
        context,
        state,
      );
      expect(result.authorized).toBe(true);
    });
  });

  describe("resourceOwnershipRule", () => {
    it("should allow player to modify their own resources", () => {
      const context = createContext("player");
      const state = { targetPlayerId: "user-1" };

      expect(resourceOwnershipRule.match("game.action.use", context)).toBe(
        true,
      );

      const result = resourceOwnershipRule.authorize(
        "game.action.use",
        context,
        state,
      );
      expect(result.authorized).toBe(true);
    });

    it("should deny player from modifying other's resources", () => {
      const context = createContext("player");
      const state = { targetPlayerId: "user-2" };

      const result = resourceOwnershipRule.authorize(
        "game.action.use",
        context,
        state,
      );
      expect(result.authorized).toBe(false);
      expect(result.reason).toBe("Cannot modify another player's resources");
    });

    it("should allow if no target player specified", () => {
      const context = createContext("player");
      const state = {};

      const result = resourceOwnershipRule.authorize(
        "game.action.move",
        context,
        state,
      );
      expect(result.authorized).toBe(true);
    });

    it("should check ownerId field", () => {
      const context = createContext("player");
      const state = { ownerId: "user-2" };

      const result = resourceOwnershipRule.authorize(
        "game.action.use",
        context,
        state,
      );
      expect(result.authorized).toBe(false);
    });

    it("should match update actions", () => {
      const context = createContext("player");
      expect(resourceOwnershipRule.match("game.update.resource", context)).toBe(
        true,
      );
    });
  });
});
