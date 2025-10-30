/**
 * Tests for Game Authorization Middleware
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { storage } from "../storage";
import {
  authorizeSessionJoin,
  authorizeGameAction,
  authorizeSpectate,
  validateGameActionPayload,
  requiresTurnValidation,
  sanitizeGameInput,
  sanitizeGameActionData,
  gameActionSchemas,
} from "./game-authorization.middleware";

// Mock the storage module
jest.mock("../storage", () => ({
  storage: {
    getGameSessionById: jest.fn(),
  },
}));

// Mock the logger
jest.mock("../logger", () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

describe("Game Authorization Middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("validateGameActionPayload", () => {
    it("should validate a valid play_card action", () => {
      const action = {
        type: "play_card",
        sessionId: "123e4567-e89b-12d3-a456-426614174000",
        userId: "user-1",
        cardId: "card-1",
        position: { x: 0, y: 0 },
      };

      const result = validateGameActionPayload(action);
      expect(result.valid).toBe(true);
      expect(result.data).toBeDefined();
    });

    it("should validate a valid draw_card action", () => {
      const action = {
        type: "draw_card",
        sessionId: "123e4567-e89b-12d3-a456-426614174000",
        userId: "user-1",
        count: 2,
      };

      const result = validateGameActionPayload(action);
      expect(result.valid).toBe(true);
      expect(result.data).toBeDefined();
    });

    it("should validate a valid attack action", () => {
      const action = {
        type: "attack",
        sessionId: "123e4567-e89b-12d3-a456-426614174000",
        userId: "user-1",
        attackerId: "attacker-1",
        targetId: "target-1",
      };

      const result = validateGameActionPayload(action);
      expect(result.valid).toBe(true);
      expect(result.data).toBeDefined();
    });

    it("should validate a valid end_turn action", () => {
      const action = {
        type: "end_turn",
        sessionId: "123e4567-e89b-12d3-a456-426614174000",
        userId: "user-1",
      };

      const result = validateGameActionPayload(action);
      expect(result.valid).toBe(true);
      expect(result.data).toBeDefined();
    });

    it("should reject invalid action with missing required fields", () => {
      const action = {
        type: "play_card",
        // Missing sessionId and userId
      };

      const result = validateGameActionPayload(action);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should reject action with invalid UUID", () => {
      const action = {
        type: "play_card",
        sessionId: "not-a-uuid",
        userId: "user-1",
        cardId: "card-1",
      };

      const result = validateGameActionPayload(action);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should validate generic action types", () => {
      const action = {
        type: "custom_action",
        sessionId: "123e4567-e89b-12d3-a456-426614174000",
        userId: "user-1",
        data: { custom: "data" },
      };

      const result = validateGameActionPayload(action);
      expect(result.valid).toBe(true);
      expect(result.data).toBeDefined();
    });

    it("should reject draw_card with count over limit", () => {
      const action = {
        type: "draw_card",
        sessionId: "123e4567-e89b-12d3-a456-426614174000",
        userId: "user-1",
        count: 20, // Over the max of 10
      };

      const result = validateGameActionPayload(action);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("draw_card");
    });
  });

  describe("requiresTurnValidation", () => {
    it("should return true for turn-based actions", () => {
      expect(requiresTurnValidation("play_card")).toBe(true);
      expect(requiresTurnValidation("attack")).toBe(true);
      expect(requiresTurnValidation("end_turn")).toBe(true);
      expect(requiresTurnValidation("draw_card")).toBe(true);
    });

    it("should return false for non-turn-based actions", () => {
      expect(requiresTurnValidation("chat_message")).toBe(false);
      expect(requiresTurnValidation("emote")).toBe(false);
      expect(requiresTurnValidation("update_settings")).toBe(false);
    });
  });

  describe("authorizeSessionJoin", () => {
    it("should authorize join when session exists and is not full", async () => {
      const mockSession = {
        id: "session-1",
        hostId: "host-1",
        maxPlayers: 4,
        currentPlayers: 2,
        status: "waiting",
      };

      (
        storage.getGameSessionById as jest.MockedFunction<
          typeof storage.getGameSessionById
        >
      ).mockResolvedValue(mockSession as any);

      const result = await authorizeSessionJoin("session-1", "user-1");

      expect(result.authorized).toBe(true);
      expect(result.sessionData).toBeDefined();
    });

    it("should reject join when session is full", async () => {
      const mockSession = {
        id: "session-1",
        hostId: "host-1",
        maxPlayers: 4,
        currentPlayers: 4,
        status: "waiting",
      };

      (
        storage.getGameSessionById as jest.MockedFunction<
          typeof storage.getGameSessionById
        >
      ).mockResolvedValue(mockSession as any);

      const result = await authorizeSessionJoin("session-1", "user-1");

      expect(result.authorized).toBe(false);
      expect(result.reason).toBe("Session is full");
    });

    it("should reject join when session is completed", async () => {
      const mockSession = {
        id: "session-1",
        hostId: "host-1",
        maxPlayers: 4,
        currentPlayers: 2,
        status: "completed",
      };

      (
        storage.getGameSessionById as jest.MockedFunction<
          typeof storage.getGameSessionById
        >
      ).mockResolvedValue(mockSession as any);

      const result = await authorizeSessionJoin("session-1", "user-1");

      expect(result.authorized).toBe(false);
      expect(result.reason).toBe("Session is completed");
    });

    it("should authorize host to join their own session even if full", async () => {
      const mockSession = {
        id: "session-1",
        hostId: "host-1",
        maxPlayers: 4,
        currentPlayers: 4,
        status: "active",
      };

      (
        storage.getGameSessionById as jest.MockedFunction<
          typeof storage.getGameSessionById
        >
      ).mockResolvedValue(mockSession as any);

      const result = await authorizeSessionJoin("session-1", "host-1");

      expect(result.authorized).toBe(true);
    });

    it("should reject join when session does not exist", async () => {
      (
        storage.getGameSessionById as jest.MockedFunction<
          typeof storage.getGameSessionById
        >
      ).mockResolvedValue(null);

      const result = await authorizeSessionJoin("nonexistent", "user-1");

      expect(result.authorized).toBe(false);
      expect(result.reason).toBe("Session not found");
    });
  });

  describe("authorizeGameAction", () => {
    it("should authorize action for participant in active session", async () => {
      const mockSession = {
        id: "session-1",
        hostId: "user-1",
        status: "active",
        boardState: null,
      };

      (
        storage.getGameSessionById as jest.MockedFunction<
          typeof storage.getGameSessionById
        >
      ).mockResolvedValue(mockSession as any);

      const action = { type: "play_card", cardId: "card-1" };
      const result = await authorizeGameAction("session-1", "user-1", action);

      expect(result.authorized).toBe(true);
    });

    it("should reject action for non-participant", async () => {
      const mockSession = {
        id: "session-1",
        hostId: "host-1",
        coHostId: null,
        status: "active",
        boardState: null,
      };

      (
        storage.getGameSessionById as jest.MockedFunction<
          typeof storage.getGameSessionById
        >
      ).mockResolvedValue(mockSession as any);

      const action = { type: "play_card", cardId: "card-1" };
      const result = await authorizeGameAction("session-1", "user-1", action);

      expect(result.authorized).toBe(false);
      expect(result.reason).toBe("User is not a participant in this session");
    });

    it("should reject turn-based action when not user's turn", async () => {
      const mockSession = {
        id: "session-1",
        hostId: "user-1",
        status: "active",
        boardState: JSON.stringify({
          currentTurn: { playerId: "user-2" },
        }),
      };

      (
        storage.getGameSessionById as jest.MockedFunction<
          typeof storage.getGameSessionById
        >
      ).mockResolvedValue(mockSession as any);

      const action = { type: "play_card", cardId: "card-1" };
      const result = await authorizeGameAction("session-1", "user-1", action);

      expect(result.authorized).toBe(false);
      expect(result.reason).toBe("It is not your turn");
    });

    it("should authorize turn-based action when it is user's turn", async () => {
      const mockSession = {
        id: "session-1",
        hostId: "user-1",
        status: "active",
        boardState: JSON.stringify({
          currentTurn: { playerId: "user-1" },
        }),
      };

      (
        storage.getGameSessionById as jest.MockedFunction<
          typeof storage.getGameSessionById
        >
      ).mockResolvedValue(mockSession as any);

      const action = { type: "play_card", cardId: "card-1" };
      const result = await authorizeGameAction("session-1", "user-1", action);

      expect(result.authorized).toBe(true);
    });

    it("should reject action in completed session", async () => {
      const mockSession = {
        id: "session-1",
        hostId: "user-1",
        status: "completed",
        boardState: null,
      };

      (
        storage.getGameSessionById as jest.MockedFunction<
          typeof storage.getGameSessionById
        >
      ).mockResolvedValue(mockSession as any);

      const action = { type: "play_card", cardId: "card-1" };
      const result = await authorizeGameAction("session-1", "user-1", action);

      expect(result.authorized).toBe(false);
      expect(result.reason).toContain("completed");
    });
  });

  describe("authorizeSpectate", () => {
    it("should authorize spectating active session", async () => {
      const mockSession = {
        id: "session-1",
        hostId: "host-1",
        status: "active",
      };

      (
        storage.getGameSessionById as jest.MockedFunction<
          typeof storage.getGameSessionById
        >
      ).mockResolvedValue(mockSession as any);

      const result = await authorizeSpectate("session-1", "user-1");

      expect(result.authorized).toBe(true);
    });

    it("should reject spectating completed session", async () => {
      const mockSession = {
        id: "session-1",
        hostId: "host-1",
        status: "completed",
      };

      (
        storage.getGameSessionById as jest.MockedFunction<
          typeof storage.getGameSessionById
        >
      ).mockResolvedValue(mockSession as any);

      const result = await authorizeSpectate("session-1", "user-1");

      expect(result.authorized).toBe(false);
      expect(result.reason).toContain("completed");
    });

    it("should reject spectating nonexistent session", async () => {
      (
        storage.getGameSessionById as jest.MockedFunction<
          typeof storage.getGameSessionById
        >
      ).mockResolvedValue(null);

      const result = await authorizeSpectate("nonexistent", "user-1");

      expect(result.authorized).toBe(false);
      expect(result.reason).toBe("Session not found");
    });
  });

  describe("sanitizeGameInput", () => {
    it("should remove HTML tags", () => {
      const input = "Hello <script>alert('xss')</script> World";
      const result = sanitizeGameInput(input);

      expect(result).not.toContain("<script>");
      expect(result).not.toContain("</script>");
    });

    it("should remove inline HTML", () => {
      const input = "Hello <b>bold</b> text";
      const result = sanitizeGameInput(input);

      expect(result).not.toContain("<b>");
      expect(result).not.toContain("</b>");
      expect(result).toBe("Hello bold text");
    });

    it("should trim whitespace", () => {
      const input = "  Hello World  ";
      const result = sanitizeGameInput(input);

      expect(result).toBe("Hello World");
    });

    it("should limit length", () => {
      const input = "a".repeat(2000);
      const result = sanitizeGameInput(input);

      expect(result.length).toBeLessThanOrEqual(1000);
    });

    it("should handle empty string", () => {
      const input = "";
      const result = sanitizeGameInput(input);

      expect(result).toBe("");
    });
  });

  describe("sanitizeGameActionData", () => {
    it("should sanitize string values", () => {
      const data = {
        name: "Player <script>alert('xss')</script>",
        action: "play_card",
      };

      const result = sanitizeGameActionData(data);

      expect(result.name).not.toContain("<script>");
      expect(result.action).toBe("play_card");
    });

    it("should sanitize nested objects", () => {
      const data = {
        player: {
          name: "Player <b>1</b>",
          id: "player-1",
        },
      };

      const result = sanitizeGameActionData(data);

      expect((result.player as any).name).not.toContain("<b>");
      expect((result.player as any).id).toBe("player-1");
    });

    it("should sanitize arrays", () => {
      const data = {
        messages: ["Hello <script>xss</script>", "World"],
      };

      const result = sanitizeGameActionData(data);

      expect(Array.isArray(result.messages)).toBe(true);
      expect((result.messages as any)[0]).not.toContain("<script>");
      expect((result.messages as any)[1]).toBe("World");
    });

    it("should preserve non-string values", () => {
      const data = {
        count: 5,
        enabled: true,
        score: 99.5,
        nothing: null,
      };

      const result = sanitizeGameActionData(data);

      expect(result.count).toBe(5);
      expect(result.enabled).toBe(true);
      expect(result.score).toBe(99.5);
      expect(result.nothing).toBe(null);
    });
  });
});
