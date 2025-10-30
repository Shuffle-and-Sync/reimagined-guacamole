/**
 * Tests for Game State Schema
 *
 * Validates the TypeScript interfaces and Zod schemas for game state
 */

import { describe, test, expect } from "@jest/globals";
import {
  CardReferenceSchema,
  ZoneStateSchema,
  PermanentSchema,
  StackItemSchema,
  TurnStateSchema,
  PlayerStateSchema,
  TCGGameStateSchema,
  GameStateActionSchema,
  type CardReference,
  type ZoneState,
  type Permanent,
  type PlayerState,
  type TCGGameState,
  type GameStateAction,
} from "../../../shared/game-state-schema";

describe("Game State Schema", () => {
  describe("CardReference Schema", () => {
    test("should validate a valid card reference", () => {
      const card: CardReference = {
        id: "card-123",
        name: "Lightning Bolt",
        isTapped: false,
        counters: { "+1/+1": 2 },
        isFaceUp: true,
      };

      const result = CardReferenceSchema.safeParse(card);
      expect(result.success).toBe(true);
    });

    test("should require id field", () => {
      const card = {
        name: "Lightning Bolt",
      };

      const result = CardReferenceSchema.safeParse(card);
      expect(result.success).toBe(false);
    });

    test("should allow optional fields", () => {
      const card: CardReference = {
        id: "card-123",
      };

      const result = CardReferenceSchema.safeParse(card);
      expect(result.success).toBe(true);
    });

    test("should validate card with attachments", () => {
      const card: CardReference = {
        id: "card-123",
        name: "Grizzly Bears",
        attachments: ["aura-1", "equipment-1"],
      };

      const result = CardReferenceSchema.safeParse(card);
      expect(result.success).toBe(true);
    });
  });

  describe("ZoneState Schema", () => {
    test("should validate a valid zone state", () => {
      const zone: ZoneState = {
        cards: [
          { id: "card-1", name: "Island" },
          { id: "card-2", name: "Forest" },
        ],
        isPublic: true,
        order: "top-to-bottom",
      };

      const result = ZoneStateSchema.safeParse(zone);
      expect(result.success).toBe(true);
    });

    test("should validate empty zone", () => {
      const zone: ZoneState = {
        cards: [],
        isPublic: false,
      };

      const result = ZoneStateSchema.safeParse(zone);
      expect(result.success).toBe(true);
    });

    test("should require isPublic field", () => {
      const zone = {
        cards: [],
      };

      const result = ZoneStateSchema.safeParse(zone);
      expect(result.success).toBe(false);
    });
  });

  describe("Permanent Schema", () => {
    test("should validate a valid permanent", () => {
      const permanent: Permanent = {
        id: "permanent-1",
        name: "Grizzly Bears",
        ownerId: "player-1",
        controllerId: "player-1",
        isTapped: false,
        power: 2,
        toughness: 2,
        summoningSickness: true,
      };

      const result = PermanentSchema.safeParse(permanent);
      expect(result.success).toBe(true);
    });

    test("should require ownerId and controllerId", () => {
      const permanent = {
        id: "permanent-1",
        name: "Grizzly Bears",
      };

      const result = PermanentSchema.safeParse(permanent);
      expect(result.success).toBe(false);
    });

    test("should validate permanent with counters", () => {
      const permanent: Permanent = {
        id: "permanent-1",
        name: "Gideon, Ally of Zendikar",
        ownerId: "player-1",
        controllerId: "player-1",
        counters: { loyalty: 4 },
      };

      const result = PermanentSchema.safeParse(permanent);
      expect(result.success).toBe(true);
    });
  });

  describe("StackItem Schema", () => {
    test("should validate a spell on the stack", () => {
      const stackItem = {
        id: "stack-1",
        type: "spell",
        source: { id: "card-1", name: "Lightning Bolt" },
        controller: "player-1",
        targets: ["player-2"],
      };

      const result = StackItemSchema.safeParse(stackItem);
      expect(result.success).toBe(true);
    });

    test("should validate an ability on the stack", () => {
      const stackItem = {
        id: "stack-2",
        type: "ability",
        source: { id: "permanent-1", name: "Prodigal Pyromancer" },
        controller: "player-1",
        targets: ["permanent-5"],
      };

      const result = StackItemSchema.safeParse(stackItem);
      expect(result.success).toBe(true);
    });

    test("should reject invalid stack item type", () => {
      const stackItem = {
        id: "stack-1",
        type: "invalid",
        source: { id: "card-1" },
        controller: "player-1",
      };

      const result = StackItemSchema.safeParse(stackItem);
      expect(result.success).toBe(false);
    });
  });

  describe("PlayerState Schema", () => {
    test("should validate a complete player state", () => {
      const player: PlayerState = {
        id: "player-1",
        name: "Alice",
        lifeTotal: 20,
        poisonCounters: 0,
        hand: [{ id: "card-1" }, { id: "card-2" }],
        graveyard: { cards: [], isPublic: true },
        library: { count: 53 },
        exile: { cards: [], isPublic: true },
      };

      const result = PlayerStateSchema.safeParse(player);
      expect(result.success).toBe(true);
    });

    test("should require mandatory fields", () => {
      const player = {
        id: "player-1",
        name: "Alice",
      };

      const result = PlayerStateSchema.safeParse(player);
      expect(result.success).toBe(false);
    });

    test("should validate player with command zone", () => {
      const player: PlayerState = {
        id: "player-1",
        name: "Alice",
        lifeTotal: 40,
        hand: [],
        graveyard: { cards: [], isPublic: true },
        library: { count: 99 },
        exile: { cards: [], isPublic: true },
        commandZone: {
          cards: [{ id: "commander-1", name: "Atraxa, Praetors' Voice" }],
          isPublic: true,
        },
      };

      const result = PlayerStateSchema.safeParse(player);
      expect(result.success).toBe(true);
    });

    test("should validate player who has lost", () => {
      const player: PlayerState = {
        id: "player-1",
        name: "Alice",
        lifeTotal: 0,
        hand: [],
        graveyard: { cards: [], isPublic: true },
        library: { count: 0 },
        exile: { cards: [], isPublic: true },
        hasLost: true,
        lossReason: "life total reached 0",
      };

      const result = PlayerStateSchema.safeParse(player);
      expect(result.success).toBe(true);
    });
  });

  describe("TCGGameState Schema", () => {
    test("should validate a complete game state", () => {
      const gameState: TCGGameState = {
        version: 0,
        timestamp: Date.now(),
        lastModifiedBy: "player-1",
        gameType: "tcg",
        sessionId: "session-123",
        players: [
          {
            id: "player-1",
            name: "Alice",
            lifeTotal: 20,
            hand: [],
            graveyard: { cards: [], isPublic: true },
            library: { count: 60 },
            exile: { cards: [], isPublic: true },
          },
          {
            id: "player-2",
            name: "Bob",
            lifeTotal: 20,
            hand: [],
            graveyard: { cards: [], isPublic: true },
            library: { count: 60 },
            exile: { cards: [], isPublic: true },
          },
        ],
        turnOrder: ["player-1", "player-2"],
        currentTurn: {
          playerId: "player-1",
          phase: "main1",
          turnNumber: 1,
        },
        stack: [],
        battlefield: {
          permanents: [],
        },
      };

      const result = TCGGameStateSchema.safeParse(gameState);
      expect(result.success).toBe(true);
    });

    test("should require at least 2 players", () => {
      const gameState = {
        version: 0,
        timestamp: Date.now(),
        lastModifiedBy: "player-1",
        gameType: "tcg",
        sessionId: "session-123",
        players: [
          {
            id: "player-1",
            name: "Alice",
            lifeTotal: 20,
            hand: [],
            graveyard: { cards: [], isPublic: true },
            library: { count: 60 },
            exile: { cards: [], isPublic: true },
          },
        ],
        turnOrder: ["player-1"],
        currentTurn: {
          playerId: "player-1",
          phase: "main1",
          turnNumber: 1,
        },
        stack: [],
        battlefield: { permanents: [] },
      };

      const result = TCGGameStateSchema.safeParse(gameState);
      expect(result.success).toBe(false);
    });

    test("should allow up to 10 players", () => {
      const players = Array.from({ length: 10 }, (_, i) => ({
        id: `player-${i + 1}`,
        name: `Player ${i + 1}`,
        lifeTotal: 20,
        hand: [],
        graveyard: { cards: [], isPublic: true },
        library: { count: 60 },
        exile: { cards: [], isPublic: true },
      }));

      const gameState: TCGGameState = {
        version: 0,
        timestamp: Date.now(),
        lastModifiedBy: "player-1",
        gameType: "tcg",
        sessionId: "session-123",
        players,
        turnOrder: players.map((p) => p.id),
        currentTurn: {
          playerId: "player-1",
          phase: "main1",
          turnNumber: 1,
        },
        stack: [],
        battlefield: { permanents: [] },
      };

      const result = TCGGameStateSchema.safeParse(gameState);
      expect(result.success).toBe(true);
    });

    test("should validate game with winner", () => {
      const gameState: TCGGameState = {
        version: 10,
        timestamp: Date.now(),
        lastModifiedBy: "player-1",
        gameType: "tcg",
        sessionId: "session-123",
        players: [
          {
            id: "player-1",
            name: "Alice",
            lifeTotal: 15,
            hand: [],
            graveyard: { cards: [], isPublic: true },
            library: { count: 40 },
            exile: { cards: [], isPublic: true },
          },
          {
            id: "player-2",
            name: "Bob",
            lifeTotal: 0,
            hand: [],
            graveyard: { cards: [], isPublic: true },
            library: { count: 35 },
            exile: { cards: [], isPublic: true },
            hasLost: true,
            lossReason: "life total reached 0",
          },
        ],
        turnOrder: ["player-1", "player-2"],
        currentTurn: {
          playerId: "player-1",
          phase: "main2",
          turnNumber: 5,
        },
        stack: [],
        battlefield: { permanents: [] },
        winnerId: "player-1",
        winCondition: "opponent's life total reached 0",
      };

      const result = TCGGameStateSchema.safeParse(gameState);
      expect(result.success).toBe(true);
    });
  });

  describe("GameStateAction Schema", () => {
    test("should validate a draw action", () => {
      const action: GameStateAction = {
        id: "action-1",
        type: "draw",
        playerId: "player-1",
        timestamp: Date.now(),
        payload: { count: 1 },
        previousStateVersion: 0,
        resultingStateVersion: 1,
      };

      const result = GameStateActionSchema.safeParse(action);
      expect(result.success).toBe(true);
    });

    test("should validate a play action", () => {
      const action: GameStateAction = {
        id: "action-2",
        type: "play",
        playerId: "player-1",
        timestamp: Date.now(),
        payload: { cardId: "card-123" },
        previousStateVersion: 1,
        resultingStateVersion: 2,
        description: "Play Lightning Bolt",
      };

      const result = GameStateActionSchema.safeParse(action);
      expect(result.success).toBe(true);
    });

    test("should validate a tap action", () => {
      const action: GameStateAction = {
        id: "action-3",
        type: "tap",
        playerId: "player-1",
        timestamp: Date.now(),
        payload: { cardId: "permanent-5" },
        previousStateVersion: 2,
        resultingStateVersion: 3,
      };

      const result = GameStateActionSchema.safeParse(action);
      expect(result.success).toBe(true);
    });

    test("should require all mandatory fields", () => {
      const action = {
        id: "action-1",
        type: "draw",
        playerId: "player-1",
      };

      const result = GameStateActionSchema.safeParse(action);
      expect(result.success).toBe(false);
    });

    test("should reject invalid action type", () => {
      const action = {
        id: "action-1",
        type: "invalid_action",
        playerId: "player-1",
        timestamp: Date.now(),
        payload: {},
        previousStateVersion: 0,
        resultingStateVersion: 1,
      };

      const result = GameStateActionSchema.safeParse(action);
      expect(result.success).toBe(false);
    });
  });

  describe("Game Phase Validation", () => {
    test("should validate all valid game phases", () => {
      const validPhases = [
        "untap",
        "upkeep",
        "draw",
        "main1",
        "combat_begin",
        "combat_attackers",
        "combat_blockers",
        "combat_damage",
        "combat_end",
        "main2",
        "end",
        "cleanup",
      ];

      validPhases.forEach((phase) => {
        const turnState = {
          playerId: "player-1",
          phase,
          turnNumber: 1,
        };

        const result = TurnStateSchema.safeParse(turnState);
        expect(result.success).toBe(true);
      });
    });

    test("should reject invalid game phase", () => {
      const turnState = {
        playerId: "player-1",
        phase: "invalid_phase",
        turnNumber: 1,
      };

      const result = TurnStateSchema.safeParse(turnState);
      expect(result.success).toBe(false);
    });
  });
});
