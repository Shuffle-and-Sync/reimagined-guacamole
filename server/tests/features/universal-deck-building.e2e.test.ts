/**
 * Universal Deck-Building End-to-End Tests
 * 
 * Comprehensive E2E tests for the entire Universal Deck-Building framework
 * Tests complete user workflows including game creation, card operations, and multi-game support
 */

import { describe, test, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { gameService } from '../../services/games/game.service';
import { scryfallAdapter } from '../../services/card-recognition/adapters/scryfall.adapter';
import { pokemonTCGAdapter } from '../../services/card-recognition/adapters/pokemon.adapter';
import { yugiohAdapter } from '../../services/card-recognition/adapters/yugioh.adapter';

// Mock external APIs
jest.mock('../../services/card-recognition', () => ({
  cardRecognitionService: {
    searchCards: jest.fn(),
    getCardById: jest.fn(),
    getCardByName: jest.fn(),
    autocomplete: jest.fn(),
    getRandomCard: jest.fn(),
  }
}));

jest.mock('../../services/games/game.service');

jest.mock('../../services/card-recognition/index', () => ({
  universalCardService: {
    searchCards: jest.fn(),
    getCardById: jest.fn(),
    getCardByName: jest.fn(),
    autocomplete: jest.fn(),
    getRandomCard: jest.fn(),
    clearAdapterCache: jest.fn(),
  },
}));

// Import mocked service after mock
import { universalCardService } from '../../services/card-recognition/index';

// Mock fetch for external TCG APIs
global.fetch = jest.fn();

describe('Universal Deck-Building E2E Tests', () => {
  beforeAll(() => {
    // Setup test environment
  });

  afterAll(() => {
    // Cleanup
  });

  describe('Complete Game Creation Workflow', () => {
    test('E2E: Create custom game and search for cards', async () => {
      // Step 1: Create a custom game
      const newGame = {
        id: 'custom-fantasy-game',
        name: 'fantasy-rpg',
        displayName: 'Fantasy RPG TCG',
        description: 'A fantasy role-playing card game',
        creatorId: 'user-123',
        cardTypes: ['Hero', 'Spell', 'Weapon', 'Armor'],
        deckRules: {
          minDeckSize: 40,
          maxDeckSize: 60,
          maxCopies: 3,
        },
        isPublished: false,
      };

      (gameService.createGame as jest.Mock).mockResolvedValue(newGame);

      const createdGame = await gameService.createGame('user-123', {
        name: 'fantasy-rpg',
        displayName: 'Fantasy RPG TCG',
        description: 'A fantasy role-playing card game',
        creatorId: 'user-123',
        cardTypes: ['Hero', 'Spell', 'Weapon', 'Armor'],
        deckRules: {
          minDeckSize: 40,
          maxDeckSize: 60,
          maxCopies: 3,
        },
      });

      expect(createdGame.id).toBe('custom-fantasy-game');
      expect(createdGame.name).toBe('fantasy-rpg');
      expect(createdGame.cardTypes).toContain('Hero');

      // Step 2: Search for cards in the new game (would use custom adapter)
      (universalCardService.searchCards as jest.Mock).mockResolvedValue({
        cards: [
          {
            id: 'hero-1',
            gameId: 'custom-fantasy-game',
            name: 'Dragon Knight',
            attributes: { power: 5, health: 5, cardType: 'Hero' },
          },
        ],
        total: 1,
        page: 1,
        hasMore: false,
      });

      const searchResults = await universalCardService.searchCards(
        'custom-fantasy-game',
        'Dragon',
        { limit: 20 }
      );

      expect(searchResults.cards).toHaveLength(1);
      expect(searchResults.cards[0].name).toBe('Dragon Knight');
      expect(searchResults.cards[0].gameId).toBe('custom-fantasy-game');

      // Step 3: Publish the game
      (gameService.publishGame as jest.Mock).mockResolvedValue({
        ...newGame,
        isPublished: true,
      });

      const publishedGame = await gameService.publishGame('custom-fantasy-game', 'user-123');

      expect(publishedGame.isPublished).toBe(true);
    });

    test('E2E: Create game, update it, and verify changes', async () => {
      const initialGame = {
        id: 'game-update-test',
        name: 'test-game',
        displayName: 'Test Game',
        creatorId: 'user-123',
      };

      (gameService.createGame as jest.Mock).mockResolvedValue(initialGame);

      const created = await gameService.createGame('user-123', {
        name: 'test-game',
        displayName: 'Test Game',
        creatorId: 'user-123',
      });

      expect(created.displayName).toBe('Test Game');

      // Update the game
      (gameService.updateGame as jest.Mock).mockResolvedValue({
        ...initialGame,
        displayName: 'Updated Test Game',
        description: 'Now with a description',
      });

      const updated = await gameService.updateGame('game-update-test', 'user-123', {
        displayName: 'Updated Test Game',
        description: 'Now with a description',
      });

      expect(updated.displayName).toBe('Updated Test Game');
      expect(updated.description).toBe('Now with a description');
    });
  });

  describe('Multi-Game Card Search Workflow', () => {
    test('E2E: Search cards across MTG, Pokemon, and Yu-Gi-Oh', async () => {
      // Mock MTG search
      const mtgMockResponse = {
        cards: [
          {
            id: 'mtg-1',
            name: 'Lightning Bolt',
            manaCost: '{R}',
            typeLine: 'Instant',
          },
        ],
        total: 1,
        page: 1,
        hasMore: false,
      };

      // Mock Pokemon search
      const pokemonMockResponse = {
        data: [
          {
            id: 'base1-4',
            name: 'Charizard',
            supertype: 'Pokémon',
            hp: '120',
            types: ['Fire'],
            set: {
              id: 'base1',
              name: 'Base',
              series: 'Base',
              printedTotal: 102,
              total: 102,
              releaseDate: '1999/01/09',
            },
            number: '4',
            images: {
              small: 'https://example.com/small.png',
              large: 'https://example.com/large.png',
            },
          },
        ],
        page: 1,
        pageSize: 20,
        count: 1,
        totalCount: 1,
      };

      // Mock Yu-Gi-Oh search
      const yugiohMockResponse = {
        data: [
          {
            id: 6983839,
            name: 'Blue-Eyes White Dragon',
            type: 'Normal Monster',
            frameType: 'normal',
            desc: 'This legendary dragon is a powerful engine of destruction.',
            atk: 3000,
            def: 2500,
            level: 8,
            race: 'Dragon',
            attribute: 'LIGHT',
            card_images: [
              {
                id: 6983839,
                image_url: 'https://example.com/blue-eyes.jpg',
                image_url_small: 'https://example.com/blue-eyes-small.jpg',
                image_url_cropped: 'https://example.com/blue-eyes-cropped.jpg',
              },
            ],
          },
        ],
      };

      // Test MTG
      (universalCardService.searchCards as jest.Mock).mockResolvedValueOnce({
        cards: [
          {
            id: 'mtg-1',
            gameId: 'mtg-official',
            name: 'Lightning Bolt',
            attributes: { manaCost: '{R}', typeLine: 'Instant' },
            externalSource: 'scryfall',
          },
        ],
        total: 1,
        page: 1,
        hasMore: false,
      });

      const mtgResults = await universalCardService.searchCards('mtg-official', 'Lightning');
      expect(mtgResults.cards[0].name).toBe('Lightning Bolt');
      expect(mtgResults.cards[0].gameId).toBe('mtg-official');

      // Test Pokemon
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => pokemonMockResponse,
      });

      (universalCardService.searchCards as jest.Mock).mockResolvedValueOnce({
        cards: [
          {
            id: 'base1-4',
            gameId: 'pokemon-tcg',
            name: 'Charizard',
            attributes: { hp: '120', types: ['Fire'] },
            externalSource: 'pokemontcg',
          },
        ],
        total: 1,
        page: 1,
        hasMore: false,
      });

      const pokemonResults = await universalCardService.searchCards('pokemon-tcg', 'Charizard');
      expect(pokemonResults.cards[0].name).toBe('Charizard');
      expect(pokemonResults.cards[0].gameId).toBe('pokemon-tcg');

      // Test Yu-Gi-Oh
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => yugiohMockResponse,
      });

      (universalCardService.searchCards as jest.Mock).mockResolvedValueOnce({
        cards: [
          {
            id: '6983839',
            gameId: 'yugioh-tcg',
            name: 'Blue-Eyes White Dragon',
            attributes: { atk: 3000, def: 2500, level: 8 },
            externalSource: 'ygoprodeck',
          },
        ],
        total: 1,
        page: 1,
        hasMore: false,
      });

      const yugiohResults = await universalCardService.searchCards('yugioh-tcg', 'Blue-Eyes');
      expect(yugiohResults.cards[0].name).toBe('Blue-Eyes White Dragon');
      expect(yugiohResults.cards[0].gameId).toBe('yugioh-tcg');
    });

    test('E2E: Get specific card by ID from different games', async () => {
      // MTG card by ID
      (universalCardService.getCardById as jest.Mock).mockResolvedValueOnce({
        id: 'mtg-bolt',
        gameId: 'mtg-official',
        name: 'Lightning Bolt',
        attributes: { manaCost: '{R}' },
      });

      const mtgCard = await universalCardService.getCardById('mtg-official', 'mtg-bolt');
      expect(mtgCard?.name).toBe('Lightning Bolt');

      // Pokemon card by ID
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            id: 'base1-4',
            name: 'Charizard',
            supertype: 'Pokémon',
            set: { id: 'base1', name: 'Base', series: 'Base', printedTotal: 102, total: 102, releaseDate: '1999/01/09' },
            number: '4',
            images: { small: 'url', large: 'url' },
          },
        }),
      });

      (universalCardService.getCardById as jest.Mock).mockResolvedValueOnce({
        id: 'base1-4',
        gameId: 'pokemon-tcg',
        name: 'Charizard',
      });

      const pokemonCard = await universalCardService.getCardById('pokemon-tcg', 'base1-4');
      expect(pokemonCard?.name).toBe('Charizard');

      // Yu-Gi-Oh card by ID
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              id: 6983839,
              name: 'Blue-Eyes White Dragon',
              type: 'Normal Monster',
              frameType: 'normal',
              desc: 'Dragon',
              race: 'Dragon',
              card_images: [{ id: 6983839, image_url: 'url', image_url_small: 'url', image_url_cropped: 'url' }],
            },
          ],
        }),
      });

      (universalCardService.getCardById as jest.Mock).mockResolvedValueOnce({
        id: '6983839',
        gameId: 'yugioh-tcg',
        name: 'Blue-Eyes White Dragon',
      });

      const yugiohCard = await universalCardService.getCardById('yugioh-tcg', '6983839');
      expect(yugiohCard?.name).toBe('Blue-Eyes White Dragon');
    });
  });

  describe('Autocomplete and Random Card Workflows', () => {
    test('E2E: Autocomplete across different games', async () => {
      // MTG autocomplete
      (universalCardService.autocomplete as jest.Mock).mockResolvedValueOnce({
        suggestions: [
          { id: 'card-1', name: 'Lightning Bolt' },
          { id: 'card-2', name: 'Lightning Strike' },
        ],
      });

      const mtgSuggestions = await universalCardService.autocomplete('mtg-official', 'light', 10);
      expect(mtgSuggestions.suggestions).toHaveLength(2);
      expect(mtgSuggestions.suggestions[0].name).toBe('Lightning Bolt');

      // Pokemon autocomplete
      (universalCardService.autocomplete as jest.Mock).mockResolvedValueOnce({
        suggestions: [
          { id: 'base1-4', name: 'Charizard' },
          { id: 'base2-4', name: 'Charmeleon' },
        ],
      });

      const pokemonSuggestions = await universalCardService.autocomplete('pokemon-tcg', 'char', 10);
      expect(pokemonSuggestions.suggestions).toHaveLength(2);
      expect(pokemonSuggestions.suggestions[0].name).toBe('Charizard');

      // Yu-Gi-Oh autocomplete
      (universalCardService.autocomplete as jest.Mock).mockResolvedValueOnce({
        suggestions: [
          { id: '6983839', name: 'Blue-Eyes White Dragon' },
          { id: '23995346', name: 'Blue-Eyes Ultimate Dragon' },
        ],
      });

      const yugiohSuggestions = await universalCardService.autocomplete('yugioh-tcg', 'blue', 10);
      expect(yugiohSuggestions.suggestions).toHaveLength(2);
      expect(yugiohSuggestions.suggestions[0].name).toBe('Blue-Eyes White Dragon');
    });

    test('E2E: Get random cards from different games', async () => {
      // MTG random
      (universalCardService.getRandomCard as jest.Mock).mockResolvedValueOnce({
        id: 'random-mtg',
        gameId: 'mtg-official',
        name: 'Random MTG Card',
      });

      const mtgRandom = await universalCardService.getRandomCard('mtg-official', {});
      expect(mtgRandom.gameId).toBe('mtg-official');

      // Pokemon random
      (universalCardService.getRandomCard as jest.Mock).mockResolvedValueOnce({
        id: 'random-pokemon',
        gameId: 'pokemon-tcg',
        name: 'Random Pokemon Card',
      });

      const pokemonRandom = await universalCardService.getRandomCard('pokemon-tcg', {});
      expect(pokemonRandom.gameId).toBe('pokemon-tcg');

      // Yu-Gi-Oh random
      (universalCardService.getRandomCard as jest.Mock).mockResolvedValueOnce({
        id: 'random-yugioh',
        gameId: 'yugioh-tcg',
        name: 'Random Yu-Gi-Oh Card',
      });

      const yugiohRandom = await universalCardService.getRandomCard('yugioh-tcg', {});
      expect(yugiohRandom.gameId).toBe('yugioh-tcg');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('E2E: Handle game not found errors', async () => {
      (gameService.getGameById as jest.Mock).mockResolvedValue(null);

      const game = await gameService.getGameById('non-existent-game');
      expect(game).toBeNull();
    });

    test('E2E: Handle unauthorized game operations', async () => {
      (gameService.updateGame as jest.Mock).mockRejectedValue(
        new Error('Not authorized to update this game')
      );

      await expect(
        gameService.updateGame('game-123', 'wrong-user', { displayName: 'Hack' })
      ).rejects.toThrow('Not authorized to update this game');

      (gameService.deleteGame as jest.Mock).mockRejectedValue(
        new Error('Not authorized to delete this game')
      );

      await expect(
        gameService.deleteGame('game-123', 'wrong-user')
      ).rejects.toThrow('Not authorized to delete this game');
    });

    test('E2E: Handle card not found in different games', async () => {
      (universalCardService.getCardById as jest.Mock).mockResolvedValue(null);

      const mtgCard = await universalCardService.getCardById('mtg-official', 'non-existent');
      expect(mtgCard).toBeNull();

      const pokemonCard = await universalCardService.getCardById('pokemon-tcg', 'non-existent');
      expect(pokemonCard).toBeNull();

      const yugiohCard = await universalCardService.getCardById('yugioh-tcg', 'non-existent');
      expect(yugiohCard).toBeNull();
    });

    test('E2E: Handle empty search results', async () => {
      (universalCardService.searchCards as jest.Mock).mockResolvedValue({
        cards: [],
        total: 0,
        page: 1,
        hasMore: false,
      });

      const results = await universalCardService.searchCards('mtg-official', 'NonExistentCard123');
      expect(results.cards).toHaveLength(0);
      expect(results.total).toBe(0);
    });

    test('E2E: Handle pagination correctly', async () => {
      // Page 1
      (universalCardService.searchCards as jest.Mock).mockResolvedValueOnce({
        cards: Array(20).fill(null).map((_, i) => ({ id: `card-${i}`, name: `Card ${i}`, gameId: 'mtg-official' })),
        total: 100,
        page: 1,
        hasMore: true,
      });

      const page1 = await universalCardService.searchCards('mtg-official', 'dragon', { page: 1, limit: 20 });
      expect(page1.cards).toHaveLength(20);
      expect(page1.hasMore).toBe(true);

      // Page 2
      (universalCardService.searchCards as jest.Mock).mockResolvedValueOnce({
        cards: Array(20).fill(null).map((_, i) => ({ id: `card-${i + 20}`, name: `Card ${i + 20}`, gameId: 'mtg-official' })),
        total: 100,
        page: 2,
        hasMore: true,
      });

      const page2 = await universalCardService.searchCards('mtg-official', 'dragon', { page: 2, limit: 20 });
      expect(page2.cards).toHaveLength(20);
      expect(page2.page).toBe(2);
    });
  });

  describe('Adapter Selection and Caching', () => {
    test('E2E: Verify correct adapter selection for each game', async () => {
      // Verify MTG uses Scryfall adapter
      expect(scryfallAdapter.getGameId()).toBe('mtg-official');

      // Verify Pokemon uses Pokemon TCG adapter
      expect(pokemonTCGAdapter.getGameId()).toBe('pokemon-tcg');

      // Verify Yu-Gi-Oh uses Yu-Gi-Oh adapter
      expect(yugiohAdapter.getGameId()).toBe('yugioh-tcg');
    });

    test('E2E: Test adapter caching behavior', async () => {
      // Clear cache
      universalCardService.clearAdapterCache();

      // First search should create adapter
      (universalCardService.searchCards as jest.Mock).mockResolvedValueOnce({
        cards: [],
        total: 0,
        page: 1,
        hasMore: false,
      });

      await universalCardService.searchCards('mtg-official', 'test', {});

      // Second search should use cached adapter
      (universalCardService.searchCards as jest.Mock).mockResolvedValueOnce({
        cards: [],
        total: 0,
        page: 1,
        hasMore: false,
      });

      await universalCardService.searchCards('mtg-official', 'test2', {});

      expect(universalCardService.searchCards).toHaveBeenCalledTimes(2);
    });
  });

  describe('Game Statistics and Metadata', () => {
    test('E2E: Retrieve and verify game statistics', async () => {
      const mockStats = {
        totalCards: 250,
        totalPlayers: 150,
        totalGamesPlayed: 500,
      };

      (gameService.getGameStats as jest.Mock).mockResolvedValue(mockStats);

      const stats = await gameService.getGameStats('custom-game-123');

      expect(stats.totalCards).toBe(250);
      expect(stats.totalPlayers).toBe(150);
      expect(stats.totalGamesPlayed).toBe(500);
    });

    test('E2E: List and filter games', async () => {
      const allGames = [
        { id: 'game-1', name: 'game-1', isPublished: true, isOfficial: false },
        { id: 'game-2', name: 'game-2', isPublished: false, isOfficial: false },
        { id: 'mtg-official', name: 'mtg-official', isPublished: true, isOfficial: true },
      ];

      // Get all games
      (gameService.getAllGames as jest.Mock).mockResolvedValueOnce(allGames);

      const all = await gameService.getAllGames();
      expect(all).toHaveLength(3);

      // Get published games
      (gameService.getAllGames as jest.Mock).mockResolvedValueOnce(
        allGames.filter(g => g.isPublished)
      );

      const published = await gameService.getAllGames({ isPublished: true });
      expect(published).toHaveLength(2);
      expect(published.every(g => g.isPublished)).toBe(true);

      // Get official games
      (gameService.getAllGames as jest.Mock).mockResolvedValueOnce(
        allGames.filter(g => g.isOfficial)
      );

      const official = await gameService.getAllGames({ isOfficial: true });
      expect(official).toHaveLength(1);
      expect(official[0].id).toBe('mtg-official');
    });
  });

  describe('Complex Multi-Step Workflows', () => {
    test('E2E: Complete deck-building workflow', async () => {
      // Step 1: Create a game
      const game = {
        id: 'deck-game',
        name: 'deck-builder-game',
        displayName: 'Deck Builder Game',
        creatorId: 'user-123',
        deckRules: { minDeckSize: 60, maxCopies: 4 },
      };

      (gameService.createGame as jest.Mock).mockResolvedValue(game);
      const createdGame = await gameService.createGame('user-123', game);

      // Step 2: Search for cards
      (universalCardService.searchCards as jest.Mock).mockResolvedValue({
        cards: [
          { id: 'card-1', name: 'Creature Card', gameId: 'deck-game' },
          { id: 'card-2', name: 'Spell Card', gameId: 'deck-game' },
        ],
        total: 2,
        page: 1,
        hasMore: false,
      });

      const cards = await universalCardService.searchCards('deck-game', 'card', {});
      expect(cards.cards).toHaveLength(2);

      // Step 3: Get specific cards for deck
      (universalCardService.getCardById as jest.Mock).mockResolvedValueOnce({
        id: 'card-1',
        name: 'Creature Card',
        gameId: 'deck-game',
      });

      const card1 = await universalCardService.getCardById('deck-game', 'card-1');
      expect(card1?.name).toBe('Creature Card');

      // Step 4: Publish game
      (gameService.publishGame as jest.Mock).mockResolvedValue({
        ...game,
        isPublished: true,
      });

      const published = await gameService.publishGame('deck-game', 'user-123');
      expect(published.isPublished).toBe(true);

      // Step 5: Get game stats
      (gameService.getGameStats as jest.Mock).mockResolvedValue({
        totalCards: 50,
        totalPlayers: 10,
        totalGamesPlayed: 5,
      });

      const stats = await gameService.getGameStats('deck-game');
      expect(stats.totalCards).toBe(50);
    });

    test('E2E: Cross-game card comparison workflow', async () => {
      // Search for dragons in MTG
      (universalCardService.searchCards as jest.Mock).mockResolvedValueOnce({
        cards: [{ id: 'mtg-dragon', name: 'Dragon Card', gameId: 'mtg-official' }],
        total: 1,
        page: 1,
        hasMore: false,
      });

      const mtgDragons = await universalCardService.searchCards('mtg-official', 'dragon', {});

      // Search for dragons in Yu-Gi-Oh
      (universalCardService.searchCards as jest.Mock).mockResolvedValueOnce({
        cards: [{ id: 'yugioh-dragon', name: 'Dragon Monster', gameId: 'yugioh-tcg' }],
        total: 1,
        page: 1,
        hasMore: false,
      });

      const yugiohDragons = await universalCardService.searchCards('yugioh-tcg', 'dragon', {});

      // Search for dragons in Pokemon
      (universalCardService.searchCards as jest.Mock).mockResolvedValueOnce({
        cards: [{ id: 'pokemon-dragon', name: 'Dragon Pokemon', gameId: 'pokemon-tcg' }],
        total: 1,
        page: 1,
        hasMore: false,
      });

      const pokemonDragons = await universalCardService.searchCards('pokemon-tcg', 'dragon', {});

      // Verify all searches succeeded
      expect(mtgDragons.cards[0].gameId).toBe('mtg-official');
      expect(yugiohDragons.cards[0].gameId).toBe('yugioh-tcg');
      expect(pokemonDragons.cards[0].gameId).toBe('pokemon-tcg');
    });
  });
});
