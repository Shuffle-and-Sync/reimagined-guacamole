/**
 * Game Service Unit Tests
 *
 * Tests for game CRUD operations and business logic
 */

import { gameService } from "../../services/games/game.service";
import { db } from "../../../shared/database-unified";
import { games } from "../../../shared/schema";

import { createMockGame } from "../__factories__";

// Mock the database
jest.mock("../../../shared/database-unified", () => ({
  db: {
    insert: jest.fn(),
    select: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

// TODO: Re-enable when games table is implemented in schema
describe.skip("GameService", () => {
  const mockUserId = "user-123";
  const mockGameId = "game-456";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe("createGame", () => {
    it("should create a new game with valid data", async () => {
      const gameData = createMockGame({
        name: "test-game",
        description: "A test game",
      });

      const mockCreatedGame = createMockGame({
        id: mockGameId,
        name: gameData.name,
        description: gameData.description,
        isPublished: false,
        createdAt: new Date(),
      });

      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockCreatedGame]),
        }),
      });

      const result = await gameService.createGame(mockUserId, gameData);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockGameId);
      expect(result.name).toBe("test-game");
      expect(result.isPublished).toBe(false);
      expect(db.insert).toHaveBeenCalledWith(games);
    });

    it("should set default values for optional fields", async () => {
      const mockCreatedGame = createMockGame({
        id: mockGameId,
        name: "minimal-game",
        isPublished: false,
      });

      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockCreatedGame]),
        }),
      });

      const gameData = { name: "minimal-game" };
      const result = await gameService.createGame(mockUserId, gameData);

      expect(result.isPublished).toBe(false);
    });
  });

  describe("getGameById", () => {
    it("should return a game by id", async () => {
      const mockGame = createMockGame({
        id: mockGameId,
        name: "test-game",
      });

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockGame]),
          }),
        }),
      });

      const result = await gameService.getGameById(mockGameId);

      expect(result).toEqual(mockGame);
      expect(db.select).toHaveBeenCalled();
    });

    it("should return null if game not found", async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await gameService.getGameById("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("updateGame", () => {
    it("should update game when user is creator", async () => {
      const mockGame = createMockGame({
        id: mockGameId,
        name: "test-game",
      });

      const updates = {
        displayName: "Updated Game",
        description: "Updated description",
      };

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockGame]),
          }),
        }),
      });

      (db.update as jest.Mock).mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest
              .fn()
              .mockResolvedValue([{ ...mockGame, ...updates }]),
          }),
        }),
      });

      const result = await gameService.updateGame(
        mockGameId,
        mockUserId,
        updates,
      );

      expect(result.displayName).toBe("Updated Game");
      expect(db.update).toHaveBeenCalledWith(games);
    });

    it("should throw error when user is not creator", async () => {
      const mockGame = {
        id: mockGameId,
        name: "test-game",
        creatorId: "different-user",
      };

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockGame]),
          }),
        }),
      });

      await expect(
        gameService.updateGame(mockGameId, mockUserId, { displayName: "Hack" }),
      ).rejects.toThrow("Not authorized to update this game");
    });

    it("should throw error when game not found", async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(
        gameService.updateGame("non-existent", mockUserId, {}),
      ).rejects.toThrow("Game not found");
    });
  });

  describe("deleteGame", () => {
    it("should delete game when user is creator", async () => {
      const mockGame = {
        id: mockGameId,
        creatorId: mockUserId,
      };

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockGame]),
          }),
        }),
      });

      (db.delete as jest.Mock).mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });

      const result = await gameService.deleteGame(mockGameId, mockUserId);

      expect(result).toBe(true);
      expect(db.delete).toHaveBeenCalledWith(games);
    });

    it("should throw error when user is not creator", async () => {
      const mockGame = {
        id: mockGameId,
        creatorId: "different-user",
      };

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockGame]),
          }),
        }),
      });

      await expect(
        gameService.deleteGame(mockGameId, mockUserId),
      ).rejects.toThrow("Not authorized to delete this game");
    });
  });

  describe("publishGame", () => {
    it("should publish game when user is creator", async () => {
      const mockGame = {
        id: mockGameId,
        creatorId: mockUserId,
        isPublished: false,
      };

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockGame]),
          }),
        }),
      });

      (db.update as jest.Mock).mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest
              .fn()
              .mockResolvedValue([{ ...mockGame, isPublished: true }]),
          }),
        }),
      });

      const result = await gameService.publishGame(mockGameId, mockUserId);

      expect(result.isPublished).toBe(true);
    });
  });

  describe("getAllGames", () => {
    it("should return all games without filters", async () => {
      const mockGames = [
        { id: "game-1", name: "game-1" },
        { id: "game-2", name: "game-2" },
      ];

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockResolvedValue(mockGames),
      });

      const result = await gameService.getAllGames();

      expect(result).toHaveLength(2);
      expect(result).toEqual(mockGames);
    });

    it("should filter by published status", async () => {
      const mockGames = [{ id: "game-1", isPublished: true }];

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockGames),
        }),
      });

      const result = await gameService.getAllGames({ isPublished: true });

      expect(result).toHaveLength(1);
      expect(result[0].isPublished).toBe(true);
    });
  });

  describe("getGameStats", () => {
    it("should return game statistics", async () => {
      const mockGame = {
        id: mockGameId,
        totalCards: 150,
        totalPlayers: 42,
        totalGamesPlayed: 128,
      };

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockGame]),
          }),
        }),
      });

      const result = await gameService.getGameStats(mockGameId);

      expect(result.totalCards).toBe(150);
      expect(result.totalPlayers).toBe(42);
      expect(result.totalGamesPlayed).toBe(128);
    });
  });
});
