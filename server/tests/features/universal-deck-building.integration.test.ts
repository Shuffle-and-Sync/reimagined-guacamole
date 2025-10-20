/**
 * Universal Deck-Building API Integration Tests
 *
 * Integration tests for Game Creator API and game-scoped card endpoints
 */

import { gameService } from "../../services/games/game.service";
import { universalCardService } from "../../services/card-recognition/index";

// Mock services
jest.mock("../../services/games/game.service");
jest.mock("../../services/card-recognition/index");

describe("Game Creator API - Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe("Game Service Integration", () => {
    it("should create a new game", async () => {
      const newGame = {
        id: "game-123",
        name: "test-game",
        displayName: "Test Game",
        creatorId: "test-user-123",
        isPublished: false,
      };

      (gameService.createGame as jest.Mock).mockResolvedValue(newGame);

      const result = await gameService.createGame("test-user-123", {
        name: "test-game",
        displayName: "Test Game",
        creatorId: "test-user-123",
        cardTypes: ["Hero", "Spell"],
      });

      expect(result.id).toBe("game-123");
      expect(result.name).toBe("test-game");
    });

    it("should list all games", async () => {
      const mockGames = [
        { id: "game-1", name: "game-1", displayName: "Game 1" },
        { id: "game-2", name: "game-2", displayName: "Game 2" },
      ];

      (gameService.getAllGames as jest.Mock).mockResolvedValue(mockGames);

      const result = await gameService.getAllGames();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("game-1");
    });

    it("should get game by id", async () => {
      const mockGame = {
        id: "game-123",
        name: "test-game",
        displayName: "Test Game",
      };

      (gameService.getGameById as jest.Mock).mockResolvedValue(mockGame);

      const result = await gameService.getGameById("game-123");

      expect(result?.id).toBe("game-123");
    });

    it("should update game", async () => {
      const updatedGame = {
        id: "game-123",
        displayName: "Updated Name",
      };

      (gameService.updateGame as jest.Mock).mockResolvedValue(updatedGame);

      const result = await gameService.updateGame("game-123", "user-123", {
        displayName: "Updated Name",
      });

      expect(result.displayName).toBe("Updated Name");
    });

    it("should delete game", async () => {
      (gameService.deleteGame as jest.Mock).mockResolvedValue(true);

      const result = await gameService.deleteGame("game-123", "user-123");

      expect(result).toBe(true);
    });

    it("should publish game", async () => {
      const publishedGame = {
        id: "game-123",
        isPublished: true,
      };

      (gameService.publishGame as jest.Mock).mockResolvedValue(publishedGame);

      const result = await gameService.publishGame("game-123", "user-123");

      expect(result.isPublished).toBe(true);
    });

    it("should get game statistics", async () => {
      const mockStats = {
        totalCards: 150,
        totalPlayers: 42,
        totalGamesPlayed: 128,
      };

      (gameService.getGameStats as jest.Mock).mockResolvedValue(mockStats);

      const result = await gameService.getGameStats("game-123");

      expect(result.totalCards).toBe(150);
    });
  });

  describe("Universal Card Service Integration", () => {
    it("should search cards for a specific game", async () => {
      const mockResult = {
        cards: [
          {
            id: "card-1",
            gameId: "custom-game",
            name: "Dragon Hero",
            attributes: {},
          },
        ],
        total: 1,
        page: 1,
        hasMore: false,
      };

      (universalCardService.searchCards as jest.Mock).mockResolvedValue(
        mockResult,
      );

      const result = await universalCardService.searchCards(
        "custom-game",
        "dragon",
        { page: 1, limit: 20 },
      );

      expect(result.cards).toHaveLength(1);
      expect(result.cards[0].gameId).toBe("custom-game");
    });

    it("should get card by ID for a specific game", async () => {
      const mockCard = {
        id: "card-123",
        gameId: "custom-game",
        name: "Test Card",
      };

      (universalCardService.getCardById as jest.Mock).mockResolvedValue(
        mockCard,
      );

      const result = await universalCardService.getCardById(
        "custom-game",
        "card-123",
      );

      expect(result?.id).toBe("card-123");
    });

    it("should get card by name", async () => {
      const mockCard = {
        id: "card-456",
        gameId: "custom-game",
        name: "Lightning Bolt",
      };

      (universalCardService.getCardByName as jest.Mock).mockResolvedValue(
        mockCard,
      );

      const result = await universalCardService.getCardByName(
        "custom-game",
        "Lightning Bolt",
        {},
      );

      expect(result?.name).toBe("Lightning Bolt");
    });

    it("should autocomplete card names", async () => {
      const mockResult = {
        suggestions: [
          { id: "card-1", name: "Lightning Bolt" },
          { id: "card-2", name: "Lightning Strike" },
        ],
      };

      (universalCardService.autocomplete as jest.Mock).mockResolvedValue(
        mockResult,
      );

      const result = await universalCardService.autocomplete(
        "custom-game",
        "light",
        10,
      );

      expect(result.suggestions).toHaveLength(2);
    });

    it("should get random card", async () => {
      const mockCard = {
        id: "random-card",
        gameId: "custom-game",
        name: "Random Card",
      };

      (universalCardService.getRandomCard as jest.Mock).mockResolvedValue(
        mockCard,
      );

      const result = await universalCardService.getRandomCard(
        "custom-game",
        {},
      );

      expect(result.id).toBe("random-card");
    });
  });

  describe("Adapter Selection Logic", () => {
    it("should use Scryfall adapter for mtg-official game", async () => {
      const mockResult = {
        cards: [{ id: "mtg-1", gameId: "mtg-official", name: "Black Lotus" }],
        total: 1,
        page: 1,
        hasMore: false,
      };

      (universalCardService.searchCards as jest.Mock).mockResolvedValue(
        mockResult,
      );

      const result = await universalCardService.searchCards(
        "mtg-official",
        "lotus",
        {},
      );

      expect(result.cards[0].gameId).toBe("mtg-official");
    });

    it("should use Custom adapter for user-defined games", async () => {
      const mockResult = {
        cards: [{ id: "custom-1", gameId: "my-game", name: "Custom Card" }],
        total: 1,
        page: 1,
        hasMore: false,
      };

      (universalCardService.searchCards as jest.Mock).mockResolvedValue(
        mockResult,
      );

      const result = await universalCardService.searchCards(
        "my-game",
        "card",
        {},
      );

      expect(result.cards[0].gameId).toBe("my-game");
    });
  });

  describe("Error Handling", () => {
    it("should handle game not found", async () => {
      (universalCardService.searchCards as jest.Mock).mockRejectedValue(
        new Error("Game not found: non-existent"),
      );

      await expect(
        universalCardService.searchCards("non-existent", "test", {}),
      ).rejects.toThrow("Game not found: non-existent");
    });

    it("should handle unauthorized game update", async () => {
      (gameService.updateGame as jest.Mock).mockRejectedValue(
        new Error("Not authorized to update this game"),
      );

      await expect(
        gameService.updateGame("game-123", "wrong-user", {
          displayName: "Hack",
        }),
      ).rejects.toThrow("Not authorized to update this game");
    });

    it("should handle unauthorized game delete", async () => {
      (gameService.deleteGame as jest.Mock).mockRejectedValue(
        new Error("Not authorized to delete this game"),
      );

      await expect(
        gameService.deleteGame("game-123", "wrong-user"),
      ).rejects.toThrow("Not authorized to delete this game");
    });
  });
});
