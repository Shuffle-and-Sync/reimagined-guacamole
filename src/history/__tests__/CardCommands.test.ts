/**
 * Tests for Card Commands
 */

import { describe, test, expect } from "@jest/globals";
import {
  MoveCardCommand,
  TapCardCommand,
  AddCounterCommand,
  DrawCardCommand,
  PlayCardCommand,
  GameState,
} from "../commands/CardCommands";

describe("CardCommands", () => {
  let initialState: GameState;

  beforeEach(() => {
    initialState = {
      board: {
        hand: ["card1", "card2"],
        battlefield: ["card3"],
        graveyard: [],
        library: ["card4", "card5"],
        exile: [],
        command: [],
        sideboard: [],
      },
      cards: {
        card3: { tapped: false, counters: {} },
      },
    };
  });

  describe("MoveCardCommand", () => {
    test("should move card between zones", () => {
      const command = new MoveCardCommand(
        "user1",
        "card1",
        "hand",
        "battlefield",
      );

      const newState = command.execute(initialState);

      expect(newState.board.hand).not.toContain("card1");
      expect(newState.board.battlefield).toContain("card1");
    });

    test("should undo card movement", () => {
      const command = new MoveCardCommand(
        "user1",
        "card1",
        "hand",
        "battlefield",
      );

      const newState = command.execute(initialState);
      const undoneState = command.undo(newState);

      expect(undoneState.board.hand).toContain("card1");
      expect(undoneState.board.battlefield).not.toContain("card1");
    });

    test("should move card to specific position", () => {
      const command = new MoveCardCommand(
        "user1",
        "card1",
        "hand",
        "battlefield",
        0,
      );

      const newState = command.execute(initialState);

      expect(newState.board.battlefield[0]).toBe("card1");
    });

    test("should validate state after execution", () => {
      const command = new MoveCardCommand(
        "user1",
        "card1",
        "hand",
        "battlefield",
      );

      const newState = command.execute(initialState);

      expect(command.canUndo(newState)).toBe(true);
    });

    test("should not mutate original state", () => {
      const command = new MoveCardCommand(
        "user1",
        "card1",
        "hand",
        "battlefield",
      );

      const originalHandLength = initialState.board.hand.length;
      command.execute(initialState);

      expect(initialState.board.hand.length).toBe(originalHandLength);
    });
  });

  describe("TapCardCommand", () => {
    test("should tap card", () => {
      const command = new TapCardCommand("user1", "card3", true);

      const newState = command.execute(initialState);

      expect(newState.cards.card3.tapped).toBe(true);
    });

    test("should untap card", () => {
      const tappedState = {
        ...initialState,
        cards: {
          card3: { tapped: true, counters: {} },
        },
      };

      const command = new TapCardCommand("user1", "card3", false);

      const newState = command.execute(tappedState);

      expect(newState.cards.card3.tapped).toBe(false);
    });

    test("should undo tap", () => {
      const command = new TapCardCommand("user1", "card3", true);

      const newState = command.execute(initialState);
      const undoneState = command.undo(newState);

      expect(undoneState.cards.card3.tapped).toBe(false);
    });

    test("should create card entry if not exists", () => {
      const command = new TapCardCommand("user1", "card-new", true);

      const newState = command.execute(initialState);

      expect(newState.cards["card-new"]).toBeDefined();
      expect(newState.cards["card-new"].tapped).toBe(true);
    });
  });

  describe("AddCounterCommand", () => {
    test("should add counters to card", () => {
      const command = new AddCounterCommand("user1", "card3", "+1/+1", 2);

      const newState = command.execute(initialState);

      expect(newState.cards.card3.counters["+1/+1"]).toBe(2);
    });

    test("should accumulate counters", () => {
      const stateWithCounters = {
        ...initialState,
        cards: {
          card3: { tapped: false, counters: { "+1/+1": 1 } },
        },
      };

      const command = new AddCounterCommand("user1", "card3", "+1/+1", 2);

      const newState = command.execute(stateWithCounters);

      expect(newState.cards.card3.counters["+1/+1"]).toBe(3);
    });

    test("should remove counters with negative amount", () => {
      const stateWithCounters = {
        ...initialState,
        cards: {
          card3: { tapped: false, counters: { "+1/+1": 3 } },
        },
      };

      const command = new AddCounterCommand("user1", "card3", "+1/+1", -2);

      const newState = command.execute(stateWithCounters);

      expect(newState.cards.card3.counters["+1/+1"]).toBe(1);
    });

    test("should undo counter addition", () => {
      const command = new AddCounterCommand("user1", "card3", "+1/+1", 2);

      const newState = command.execute(initialState);
      const undoneState = command.undo(newState);

      expect(undoneState.cards.card3.counters["+1/+1"]).toBe(0);
    });
  });

  describe("DrawCardCommand", () => {
    test("should draw card from library to hand", () => {
      const command = new DrawCardCommand("user1", "player1");

      const newState = command.execute(initialState);

      expect(newState.board.hand).toContain("card4");
      expect(newState.board.library).not.toContain("card4");
    });

    test("should draw specific card", () => {
      const command = new DrawCardCommand("user1", "player1", "card5");

      const newState = command.execute(initialState);

      expect(newState.board.hand).toContain("card5");
      expect(newState.board.library).not.toContain("card5");
    });

    test("should undo draw", () => {
      const command = new DrawCardCommand("user1", "player1");

      const newState = command.execute(initialState);
      const undoneState = command.undo(newState);

      expect(undoneState.board.library[0]).toBe("card4");
      expect(undoneState.board.hand).not.toContain("card4");
    });

    test("should throw error when library is empty", () => {
      const emptyLibraryState = {
        ...initialState,
        board: {
          ...initialState.board,
          library: [],
        },
      };

      const command = new DrawCardCommand("user1", "player1");

      expect(() => {
        command.execute(emptyLibraryState);
      }).toThrow("Cannot draw from empty library");
    });
  });

  describe("PlayCardCommand", () => {
    test("should play card from hand to battlefield", () => {
      const command = new PlayCardCommand("user1", "card1");

      const newState = command.execute(initialState);

      expect(newState.board.hand).not.toContain("card1");
      expect(newState.board.battlefield).toContain("card1");
    });

    test("should undo play", () => {
      const command = new PlayCardCommand("user1", "card1");

      const newState = command.execute(initialState);
      const undoneState = command.undo(newState);

      expect(undoneState.board.hand).toContain("card1");
      expect(undoneState.board.battlefield).not.toContain("card1");
    });

    test("should play card with position", () => {
      const command = new PlayCardCommand("user1", "card1", { x: 10, y: 20 });

      const newState = command.execute(initialState);

      expect(newState.board.battlefield).toContain("card1");
      // Position handling is game-specific
    });
  });

  describe("Command serialization", () => {
    test("should serialize command", () => {
      const command = new MoveCardCommand(
        "user1",
        "card1",
        "hand",
        "battlefield",
      );

      const serialized = command.serialize();

      expect(serialized.type).toBe("MOVE_CARD");
      expect(serialized.userId).toBe("user1");
      expect(serialized.affects).toContain("card1");
      expect(serialized.id).toBeDefined();
      expect(serialized.timestamp).toBeDefined();
    });
  });
});
