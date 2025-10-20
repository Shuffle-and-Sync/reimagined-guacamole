/**
 * Pokemon and Yu-Gi-Oh Adapters Unit Tests
 *
 * Tests for Pokemon TCG and Yu-Gi-Oh adapters
 */

import { pokemonTCGAdapter } from "../../services/card-recognition/adapters/pokemon.adapter";
import { yugiohAdapter } from "../../services/card-recognition/adapters/yugioh.adapter";

// Mock fetch for Pokemon TCG API
global.fetch = jest.fn();

describe("PokemonTCGAdapter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe("searchCards", () => {
    it("should search Pokemon cards and transform to universal format", async () => {
      const mockPokemonResponse = {
        data: [
          {
            id: "base1-4",
            name: "Charizard",
            supertype: "Pokémon",
            subtypes: ["Stage 2"],
            hp: "120",
            types: ["Fire"],
            attacks: [
              {
                name: "Fire Spin",
                cost: ["Fire", "Fire", "Fire", "Fire"],
                convertedEnergyCost: 4,
                damage: "100",
                text: "Discard 2 Energy cards attached to Charizard.",
              },
            ],
            weaknesses: [{ type: "Water", value: "×2" }],
            resistances: [{ type: "Fighting", value: "-30" }],
            retreatCost: ["Colorless", "Colorless", "Colorless"],
            convertedRetreatCost: 3,
            set: {
              id: "base1",
              name: "Base",
              series: "Base",
              printedTotal: 102,
              total: 102,
              releaseDate: "1999/01/09",
            },
            number: "4",
            artist: "Mitsuhiro Arita",
            rarity: "Rare Holo",
            images: {
              small: "https://images.pokemontcg.io/base1/4.png",
              large: "https://images.pokemontcg.io/base1/4_hires.png",
            },
          },
        ],
        page: 1,
        pageSize: 20,
        count: 1,
        totalCount: 1,
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockPokemonResponse,
      });

      const result = await pokemonTCGAdapter.searchCards("Charizard");

      expect(result.cards).toHaveLength(1);
      expect(result.cards[0].gameId).toBe("pokemon-tcg");
      expect(result.cards[0].name).toBe("Charizard");
      expect(result.cards[0].attributes.hp).toBe("120");
      expect(result.cards[0].attributes.types).toContain("Fire");
      expect(result.cards[0].externalSource).toBe("pokemontcg");
    });

    it("should handle empty results", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        status: 404,
        ok: false,
      });

      // The adapter should handle 404s gracefully in search
      await expect(
        pokemonTCGAdapter.searchCards("NonexistentCard"),
      ).rejects.toThrow();
    });
  });

  describe("getCardById", () => {
    it("should get Pokemon card by ID", async () => {
      const mockCard = {
        id: "base1-4",
        name: "Charizard",
        supertype: "Pokémon",
        hp: "120",
        set: {
          id: "base1",
          name: "Base",
          series: "Base",
          printedTotal: 102,
          total: 102,
          releaseDate: "1999/01/09",
        },
        number: "4",
        images: {
          small: "https://images.pokemontcg.io/base1/4.png",
          large: "https://images.pokemontcg.io/base1/4_hires.png",
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockCard }),
      });

      const result = await pokemonTCGAdapter.getCardById("base1-4");

      expect(result).toBeDefined();
      expect(result?.name).toBe("Charizard");
      expect(result?.gameId).toBe("pokemon-tcg");
    });

    it("should return null if card not found", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        status: 404,
        ok: false,
      });

      const result = await pokemonTCGAdapter.getCardById("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("getGameId", () => {
    it("should return pokemon-tcg as game ID", () => {
      expect(pokemonTCGAdapter.getGameId()).toBe("pokemon-tcg");
    });
  });
});

describe("YuGiOhAdapter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe("searchCards", () => {
    it("should search Yu-Gi-Oh cards and transform to universal format", async () => {
      const mockYuGiOhResponse = {
        data: [
          {
            id: 6983839,
            name: "Blue-Eyes White Dragon",
            type: "Normal Monster",
            frameType: "normal",
            desc: "This legendary dragon is a powerful engine of destruction.",
            atk: 3000,
            def: 2500,
            level: 8,
            race: "Dragon",
            attribute: "LIGHT",
            card_sets: [
              {
                set_name: "Legend of Blue Eyes White Dragon",
                set_code: "LOB-001",
                set_rarity: "Ultra Rare",
                set_rarity_code: "UR",
                set_price: "45.99",
              },
            ],
            card_images: [
              {
                id: 6983839,
                image_url:
                  "https://images.ygoprodeck.com/images/cards/6983839.jpg",
                image_url_small:
                  "https://images.ygoprodeck.com/images/cards_small/6983839.jpg",
                image_url_cropped:
                  "https://images.ygoprodeck.com/images/cards_cropped/6983839.jpg",
              },
            ],
            card_prices: [
              {
                cardmarket_price: "10.50",
                tcgplayer_price: "12.00",
                ebay_price: "15.00",
                amazon_price: "18.00",
                coolstuffinc_price: "11.00",
              },
            ],
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockYuGiOhResponse,
      });

      const result = await yugiohAdapter.searchCards("Blue-Eyes");

      expect(result.cards).toHaveLength(1);
      expect(result.cards[0].gameId).toBe("yugioh-tcg");
      expect(result.cards[0].name).toBe("Blue-Eyes White Dragon");
      expect(result.cards[0].attributes.atk).toBe(3000);
      expect(result.cards[0].attributes.def).toBe(2500);
      expect(result.cards[0].externalSource).toBe("ygoprodeck");
    });

    it("should handle empty results", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        status: 404,
        ok: false,
      });

      const result = await yugiohAdapter.searchCards("NonexistentCard");

      expect(result.cards).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe("getCardById", () => {
    it("should get Yu-Gi-Oh card by ID", async () => {
      const mockCard = {
        id: 6983839,
        name: "Blue-Eyes White Dragon",
        type: "Normal Monster",
        frameType: "normal",
        desc: "This legendary dragon is a powerful engine of destruction.",
        atk: 3000,
        def: 2500,
        level: 8,
        race: "Dragon",
        attribute: "LIGHT",
        card_sets: [
          {
            set_name: "Legend of Blue Eyes White Dragon",
            set_code: "LOB-001",
            set_rarity: "Ultra Rare",
            set_rarity_code: "UR",
            set_price: "45.99",
          },
        ],
        card_images: [
          {
            id: 6983839,
            image_url: "https://images.ygoprodeck.com/images/cards/6983839.jpg",
            image_url_small:
              "https://images.ygoprodeck.com/images/cards_small/6983839.jpg",
            image_url_cropped:
              "https://images.ygoprodeck.com/images/cards_cropped/6983839.jpg",
          },
        ],
        card_prices: [
          {
            cardmarket_price: "10.50",
            tcgplayer_price: "12.00",
            ebay_price: "15.00",
            amazon_price: "18.00",
            coolstuffinc_price: "11.00",
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [mockCard] }),
      });

      const result = await yugiohAdapter.getCardById("6983839");

      expect(result).toBeDefined();
      expect(result?.name).toBe("Blue-Eyes White Dragon");
      expect(result?.gameId).toBe("yugioh-tcg");
    });

    it("should return null if card not found", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        status: 404,
        ok: false,
      });

      const result = await yugiohAdapter.getCardById("99999999");

      expect(result).toBeNull();
    });
  });

  describe("autocomplete", () => {
    it("should autocomplete Yu-Gi-Oh card names", async () => {
      const mockResponse = {
        data: [
          {
            id: 6983839,
            name: "Blue-Eyes White Dragon",
            type: "Normal Monster",
            frameType: "normal",
            desc: "Dragon",
            race: "Dragon",
            card_images: [
              {
                id: 6983839,
                image_url:
                  "https://images.ygoprodeck.com/images/cards/6983839.jpg",
                image_url_small:
                  "https://images.ygoprodeck.com/images/cards_small/6983839.jpg",
                image_url_cropped:
                  "https://images.ygoprodeck.com/images/cards_cropped/6983839.jpg",
              },
            ],
          },
          {
            id: 23995346,
            name: "Blue-Eyes Ultimate Dragon",
            type: "Fusion Monster",
            frameType: "fusion",
            desc: "Dragon",
            race: "Dragon",
            card_images: [
              {
                id: 23995346,
                image_url:
                  "https://images.ygoprodeck.com/images/cards/23995346.jpg",
                image_url_small:
                  "https://images.ygoprodeck.com/images/cards_small/23995346.jpg",
                image_url_cropped:
                  "https://images.ygoprodeck.com/images/cards_cropped/23995346.jpg",
              },
            ],
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await yugiohAdapter.autocomplete("Blue-Eyes");

      expect(result.suggestions).toHaveLength(2);
      expect(result.suggestions[0].name).toBe("Blue-Eyes White Dragon");
      expect(result.suggestions[1].name).toBe("Blue-Eyes Ultimate Dragon");
    });
  });

  describe("getRandomCard", () => {
    it("should get random Yu-Gi-Oh card", async () => {
      const mockCard = {
        id: 12345,
        name: "Random Card",
        type: "Effect Monster",
        frameType: "effect",
        desc: "Random effect",
        race: "Warrior",
        card_images: [
          {
            id: 12345,
            image_url: "https://images.ygoprodeck.com/images/cards/12345.jpg",
            image_url_small:
              "https://images.ygoprodeck.com/images/cards_small/12345.jpg",
            image_url_cropped:
              "https://images.ygoprodeck.com/images/cards_cropped/12345.jpg",
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [mockCard] }),
      });

      const result = await yugiohAdapter.getRandomCard();

      expect(result).toBeDefined();
      expect(result.gameId).toBe("yugioh-tcg");
    });
  });

  describe("getGameId", () => {
    it("should return yugioh-tcg as game ID", () => {
      expect(yugiohAdapter.getGameId()).toBe("yugioh-tcg");
    });
  });
});
