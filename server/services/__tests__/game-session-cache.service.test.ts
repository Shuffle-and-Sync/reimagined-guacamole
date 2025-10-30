import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import type { GameSession, GameStateHistory, GameAction } from "@shared/schema";
import { cacheService } from "../cache-service";
import { GameSessionCacheService } from "../game-session-cache.service";

// Mock the cache service
jest.mock("../cache-service", () => ({
  cacheService: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    multiGet: jest.fn(),
    multiSet: jest.fn(),
    deletePattern: jest.fn(),
    getStats: jest.fn(),
  },
}));

describe("GameSessionCacheService", () => {
  let service: GameSessionCacheService;

  const mockSession: GameSession = {
    id: "session-123",
    gameType: "Magic: The Gathering",
    status: "active",
    maxPlayers: 4,
    currentPlayers: 2,
    spectators: "[]",
    hostId: "user-host",
    coHostId: "user-cohost",
    communityId: "community-mtg",
    boardState: null,
    gameData: null,
    startedAt: null,
    endedAt: null,
    eventId: null,
    createdAt: new Date(),
  };

  const mockStateHistory: GameStateHistory = {
    id: "history-1",
    sessionId: "session-123",
    version: 1,
    state: '{"board": "state"}',
    stateHash: null,
    changedBy: null,
    changeType: null,
    changeDescription: null,
    metadata: null,
    createdAt: new Date(),
  };

  const mockAction: GameAction = {
    id: "action-1",
    sessionId: "session-123",
    userId: "user-1",
    actionType: "play_card",
    actionData: '{"card": "Lightning Bolt"}',
    targetId: null,
    resultData: null,
    stateVersion: 1,
    isValid: true,
    validationError: null,
    timestamp: new Date(),
    createdAt: new Date(),
  };

  beforeEach(() => {
    service = new GameSessionCacheService();
    jest.clearAllMocks();
  });

  describe("Individual Session Caching", () => {
    it("should cache a game session", async () => {
      (cacheService.set as jest.Mock).mockResolvedValue(true);

      const result = await service.cacheSession(mockSession);

      expect(result).toBe(true);
      expect(cacheService.set).toHaveBeenCalledWith(
        `game_session:${mockSession.id}`,
        mockSession,
        300, // activeTTL
      );
    });

    it("should retrieve a cached game session", async () => {
      (cacheService.get as jest.Mock).mockResolvedValue(mockSession);

      const result = await service.getSession("session-123");

      expect(result).toEqual(mockSession);
      expect(cacheService.get).toHaveBeenCalledWith("game_session:session-123");
    });

    it("should return null for non-existent session", async () => {
      (cacheService.get as jest.Mock).mockResolvedValue(null);

      const result = await service.getSession("non-existent");

      expect(result).toBeNull();
    });

    it("should invalidate a session", async () => {
      (cacheService.delete as jest.Mock).mockResolvedValue(true);

      const result = await service.invalidateSession("session-123");

      expect(result).toBe(true);
      expect(cacheService.delete).toHaveBeenCalledWith(
        "game_session:session-123",
      );
    });
  });

  describe("Active Sessions Caching", () => {
    it("should cache active sessions for a community", async () => {
      (cacheService.set as jest.Mock).mockResolvedValue(true);
      const sessions = [mockSession];

      const result = await service.cacheActiveSessions(
        "community-mtg",
        sessions,
      );

      expect(result).toBe(true);
      expect(cacheService.set).toHaveBeenCalledWith(
        "active_sessions:community:community-mtg",
        sessions,
        120, // listTTL
      );
    });

    it("should cache all active sessions when no community specified", async () => {
      (cacheService.set as jest.Mock).mockResolvedValue(true);
      const sessions = [mockSession];

      const result = await service.cacheActiveSessions(null, sessions);

      expect(result).toBe(true);
      expect(cacheService.set).toHaveBeenCalledWith(
        "active_sessions:all",
        sessions,
        120,
      );
    });

    it("should retrieve active sessions for a community", async () => {
      (cacheService.get as jest.Mock).mockResolvedValue([mockSession]);

      const result = await service.getActiveSessions("community-mtg");

      expect(result).toEqual([mockSession]);
      expect(cacheService.get).toHaveBeenCalledWith(
        "active_sessions:community:community-mtg",
      );
    });

    it("should invalidate active sessions for a specific community", async () => {
      (cacheService.delete as jest.Mock).mockResolvedValue(true);

      await service.invalidateActiveSessions("community-mtg");

      expect(cacheService.delete).toHaveBeenCalledTimes(2);
      expect(cacheService.delete).toHaveBeenCalledWith(
        "active_sessions:community:community-mtg",
      );
      expect(cacheService.delete).toHaveBeenCalledWith("active_sessions:all");
    });
  });

  describe("User Sessions Caching", () => {
    it("should cache user sessions", async () => {
      (cacheService.set as jest.Mock).mockResolvedValue(true);
      const sessions = [mockSession];

      const result = await service.cacheUserSessions("user-123", sessions);

      expect(result).toBe(true);
      expect(cacheService.set).toHaveBeenCalledWith(
        "user_sessions:user-123",
        sessions,
        120,
      );
    });

    it("should retrieve user sessions", async () => {
      (cacheService.get as jest.Mock).mockResolvedValue([mockSession]);

      const result = await service.getUserSessions("user-123");

      expect(result).toEqual([mockSession]);
      expect(cacheService.get).toHaveBeenCalledWith("user_sessions:user-123");
    });

    it("should invalidate user sessions", async () => {
      (cacheService.delete as jest.Mock).mockResolvedValue(true);

      const result = await service.invalidateUserSessions("user-123");

      expect(result).toBe(true);
      expect(cacheService.delete).toHaveBeenCalledWith(
        "user_sessions:user-123",
      );
    });
  });

  describe("Batch Operations", () => {
    it("should cache multiple sessions", async () => {
      (cacheService.multiSet as jest.Mock).mockResolvedValue(true);
      const sessions = [mockSession, { ...mockSession, id: "session-456" }];

      const result = await service.cacheSessions(sessions);

      expect(result).toBe(true);
      expect(cacheService.multiSet).toHaveBeenCalledWith([
        { key: "game_session:session-123", value: sessions[0], ttl: 300 },
        { key: "game_session:session-456", value: sessions[1], ttl: 300 },
      ]);
    });

    it("should retrieve multiple sessions", async () => {
      (cacheService.multiGet as jest.Mock).mockResolvedValue([
        mockSession,
        null,
      ]);

      const result = await service.getSessions(["session-123", "session-456"]);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockSession);
      expect(result[1]).toBeNull();
      expect(cacheService.multiGet).toHaveBeenCalledWith([
        "game_session:session-123",
        "game_session:session-456",
      ]);
    });
  });

  describe("Complex Invalidation", () => {
    it("should invalidate session and all related caches", async () => {
      (cacheService.delete as jest.Mock).mockResolvedValue(true);

      await service.invalidateSessionAndRelated("session-123", mockSession);

      // Should invalidate multiple related caches
      expect(cacheService.delete).toHaveBeenCalled();
      expect(cacheService.delete).toHaveBeenCalledWith(
        "game_session:session-123",
      );
      expect(cacheService.delete).toHaveBeenCalledWith(
        "user_sessions:user-host",
      );
    });
  });
});
