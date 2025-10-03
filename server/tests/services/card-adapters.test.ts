/**
 * Card Adapters Unit Tests
 * 
 * Tests for Scryfall and Custom game adapters
 */

import { scryfallAdapter } from '../../services/card-recognition/adapters/scryfall.adapter';
import { CustomGameAdapter } from '../../services/card-recognition/adapters/custom.adapter';
import { cardRecognitionService } from '../../services/card-recognition';
import { db } from '../../../shared/database-unified';

// Mock the old card recognition service
jest.mock('../../services/card-recognition', () => ({
  cardRecognitionService: {
    searchCards: jest.fn(),
    getCardById: jest.fn(),
    getCardByName: jest.fn(),
    autocomplete: jest.fn(),
    getRandomCard: jest.fn(),
  }
}));

// Mock the database for custom adapter
jest.mock('../../../shared/database-unified', () => ({
  db: {
    select: jest.fn(),
  }
}));

describe('ScryfallAdapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchCards', () => {
    it('should search cards and transform to universal format', async () => {
      const mockMtgCards = [{
        id: 'mtg-card-1',
        name: 'Lightning Bolt',
        manaCost: '{R}',
        typeLine: 'Instant',
        setCode: 'lea',
        setName: 'Limited Edition Alpha',
        collectorNumber: '161',
        rarity: 'common',
      }];

      (cardRecognitionService.searchCards as jest.Mock).mockResolvedValue({
        cards: mockMtgCards,
        total: 1,
        page: 1,
        hasMore: false,
      });

      const result = await scryfallAdapter.searchCards('bolt');

      expect(result.cards).toHaveLength(1);
      expect(result.cards[0].gameId).toBe('mtg-official');
      expect(result.cards[0].name).toBe('Lightning Bolt');
      expect(result.cards[0].attributes.manaCost).toBe('{R}');
      expect(result.cards[0].attributes.typeLine).toBe('Instant');
      expect(result.cards[0].externalSource).toBe('scryfall');
      expect(cardRecognitionService.searchCards).toHaveBeenCalledWith('bolt', undefined);
    });

    it('should pass options to underlying service', async () => {
      (cardRecognitionService.searchCards as jest.Mock).mockResolvedValue({
        cards: [],
        total: 0,
        page: 1,
        hasMore: false,
      });

      await scryfallAdapter.searchCards('dragon', {
        set: 'khm',
        format: 'commander',
        page: 2,
        limit: 50,
      });

      expect(cardRecognitionService.searchCards).toHaveBeenCalledWith('dragon', {
        set: 'khm',
        format: 'commander',
        page: 2,
        limit: 50,
      });
    });
  });

  describe('getCardById', () => {
    it('should get card by ID and transform to universal format', async () => {
      const mockCard = {
        id: 'card-123',
        name: 'Black Lotus',
        manaCost: '{0}',
        typeLine: 'Artifact',
      };

      (cardRecognitionService.getCardById as jest.Mock).mockResolvedValue(mockCard);

      const result = await scryfallAdapter.getCardById('card-123');

      expect(result).toBeDefined();
      expect(result?.gameId).toBe('mtg-official');
      expect(result?.name).toBe('Black Lotus');
      expect(result?.externalSource).toBe('scryfall');
    });

    it('should return null if card not found', async () => {
      (cardRecognitionService.getCardById as jest.Mock).mockResolvedValue(null);

      const result = await scryfallAdapter.getCardById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getCardByName', () => {
    it('should get card by name', async () => {
      const mockCard = {
        id: 'card-456',
        name: 'Mox Ruby',
        manaCost: '{0}',
      };

      (cardRecognitionService.getCardByName as jest.Mock).mockResolvedValue(mockCard);

      const result = await scryfallAdapter.getCardByName('Mox Ruby', { set: 'lea' });

      expect(result).toBeDefined();
      expect(result?.name).toBe('Mox Ruby');
      expect(cardRecognitionService.getCardByName).toHaveBeenCalledWith('Mox Ruby', { set: 'lea' });
    });
  });

  describe('autocomplete', () => {
    it('should autocomplete card names', async () => {
      const mockResult = {
        suggestions: [
          { name: 'Lightning Bolt' },
          { name: 'Lightning Strike' },
        ],
      };

      (cardRecognitionService.autocomplete as jest.Mock).mockResolvedValue(mockResult);

      const result = await scryfallAdapter.autocomplete('light', 10);

      expect(result.suggestions).toHaveLength(2);
      expect(cardRecognitionService.autocomplete).toHaveBeenCalledWith('light', 10);
    });
  });

  describe('getRandomCard', () => {
    it('should get random card', async () => {
      const mockCard = {
        id: 'random-1',
        name: 'Random Card',
      };

      (cardRecognitionService.getRandomCard as jest.Mock).mockResolvedValue(mockCard);

      const result = await scryfallAdapter.getRandomCard({ format: 'commander' });

      expect(result).toBeDefined();
      expect(result.gameId).toBe('mtg-official');
      expect(cardRecognitionService.getRandomCard).toHaveBeenCalledWith({ format: 'commander' });
    });
  });

  describe('getGameId', () => {
    it('should return mtg-official as game ID', () => {
      expect(scryfallAdapter.getGameId()).toBe('mtg-official');
    });
  });
});

describe('CustomGameAdapter', () => {
  const testGameId = 'custom-game-123';
  let adapter: CustomGameAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new CustomGameAdapter(testGameId);
  });

  describe('searchCards', () => {
    it('should search cards from database', async () => {
      const mockCards = [
        {
          id: 'custom-card-1',
          gameId: testGameId,
          name: 'Dragon Hero',
          attributes: { power: 5, health: 5 },
        },
      ];

      const mockCount = { count: 1 };

      (db.select as jest.Mock)
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([mockCount])
          })
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockResolvedValue(mockCards)
              })
            })
          })
        });

      const result = await adapter.searchCards('dragon', { limit: 20, page: 1 });

      expect(result.cards).toHaveLength(1);
      expect(result.cards[0].name).toBe('Dragon Hero');
      expect(result.total).toBe(1);
      expect(result.hasMore).toBe(false);
    });

    it('should handle pagination correctly', async () => {
      const mockCount = { count: 100 };
      const mockCards = Array(20).fill(null).map((_, i) => ({
        id: `card-${i}`,
        gameId: testGameId,
        name: `Card ${i}`,
      }));

      (db.select as jest.Mock)
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([mockCount])
          })
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockResolvedValue(mockCards)
              })
            })
          })
        });

      const result = await adapter.searchCards('test', { limit: 20, page: 1 });

      expect(result.total).toBe(100);
      expect(result.hasMore).toBe(true);
      expect(result.page).toBe(1);
    });
  });

  describe('getCardById', () => {
    it('should get card by ID from database', async () => {
      const mockCard = {
        id: 'card-123',
        gameId: testGameId,
        name: 'Test Card',
      };

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockCard])
          })
        })
      });

      const result = await adapter.getCardById('card-123');

      expect(result).toBeDefined();
      expect(result?.id).toBe('card-123');
      expect(result?.gameId).toBe(testGameId);
    });

    it('should return null if card not found', async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([])
          })
        })
      });

      const result = await adapter.getCardById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getCardByName', () => {
    it('should get card by exact name', async () => {
      const mockCard = {
        id: 'card-456',
        gameId: testGameId,
        name: 'Exact Match',
      };

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockCard])
          })
        })
      });

      const result = await adapter.getCardByName('Exact Match');

      expect(result).toBeDefined();
      expect(result?.name).toBe('Exact Match');
    });
  });

  describe('autocomplete', () => {
    it('should autocomplete card names', async () => {
      const mockResults = [
        { id: 'card-1', name: 'Dragon Rider' },
        { id: 'card-2', name: 'Dragon Slayer' },
      ];

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(mockResults)
          })
        })
      });

      const result = await adapter.autocomplete('drag', 10);

      expect(result.suggestions).toHaveLength(2);
      expect(result.suggestions[0].name).toBe('Dragon Rider');
    });

    it('should return empty for short queries', async () => {
      const result = await adapter.autocomplete('d', 10);

      expect(result.suggestions).toHaveLength(0);
    });
  });

  describe('getRandomCard', () => {
    it('should get random card from database', async () => {
      const mockCard = {
        id: 'random-card',
        gameId: testGameId,
        name: 'Random',
      };

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockCard])
            })
          })
        })
      });

      const result = await adapter.getRandomCard();

      expect(result).toBeDefined();
      expect(result.gameId).toBe(testGameId);
    });

    it('should throw error if no cards found', async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([])
            })
          })
        })
      });

      await expect(adapter.getRandomCard()).rejects.toThrow('No cards found for this game');
    });
  });

  describe('getGameId', () => {
    it('should return the custom game ID', () => {
      expect(adapter.getGameId()).toBe(testGameId);
    });
  });
});
