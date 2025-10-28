/**
 * End-to-End Game Flow Tests
 *
 * Complete game scenarios testing full integration from
 * game creation through multiple turns with all operations.
 */

import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  createMoveCardOperation,
  createTapCardOperation,
  createPlayCardOperation,
} from "../../src/ot/operations/CardOperations";
import { createUpdateLifeOperation } from "../../src/ot/operations/PlayerOperations";
import { OTEngine } from "../../src/ot/OTEngine";
import { StateManager } from "../../src/state/StateManager";
import { wait } from "../helpers/TestHelpers";
import type { VectorClock } from "../../src/ot/types";

interface MTGGameState {
  gameId: string;
  players: Array<{
    id: string;
    name: string;
    life: number;
    library: string[];
    hand: string[];
    battlefield: string[];
    graveyard: string[];
  }>;
  turn: number;
  phase: string;
  activePlayer: string;
}

describe("Complete Game Flow E2E", () => {
  let player1Manager: StateManager<MTGGameState>;
  let player2Manager: StateManager<MTGGameState>;
  let engine1: OTEngine;
  let engine2: OTEngine;

  beforeEach(() => {
    player1Manager = new StateManager<MTGGameState>("player1");
    player2Manager = new StateManager<MTGGameState>("player2");
    engine1 = new OTEngine();
    engine2 = new OTEngine();
  });

  test("should play a complete MTG game flow", async () => {
    // === Game Setup ===
    const initialState: MTGGameState = {
      gameId: "game1",
      players: [
        {
          id: "player1",
          name: "Alice",
          life: 20,
          library: [
            "forest1",
            "forest2",
            "llanowar-elves",
            "giant-growth",
            "forest3",
          ],
          hand: [],
          battlefield: [],
          graveyard: [],
        },
        {
          id: "player2",
          name: "Bob",
          life: 20,
          library: [
            "mountain1",
            "mountain2",
            "lightning-bolt",
            "mountain3",
            "goblin-guide",
          ],
          hand: [],
          battlefield: [],
          graveyard: [],
        },
      ],
      turn: 1,
      phase: "untap",
      activePlayer: "player1",
    };

    const gameState = player1Manager.createState(initialState);
    player2Manager.mergeRemoteState(gameState);

    // === Draw opening hands ===
    let currentState = gameState;

    // Player 1 draws 7 cards
    for (let i = 0; i < 7; i++) {
      currentState = player1Manager.updateState(currentState.id, (draft) => {
        const card = draft.players[0].library.pop();
        if (card) {
          draft.players[0].hand.push(card);
        }
      });
    }

    // Player 2 draws 7 cards
    for (let i = 0; i < 7; i++) {
      currentState = player1Manager.updateState(currentState.id, (draft) => {
        const card = draft.players[1].library.pop();
        if (card) {
          draft.players[1].hand.push(card);
        }
      });
    }

    player2Manager.mergeRemoteState(currentState);

    // Verify opening hands
    let state = player1Manager.getState();
    expect(state?.data.players[0].hand.length).toBeLessThanOrEqual(7);
    expect(state?.data.players[1].hand.length).toBeLessThanOrEqual(7);

    // === Turn 1: Player 1 ===
    // Untap phase (nothing to untap)
    currentState = player1Manager.updateState(currentState.id, (draft) => {
      draft.phase = "upkeep";
    });

    // Draw phase
    currentState = player1Manager.updateState(currentState.id, (draft) => {
      const card = draft.players[0].library.pop();
      if (card) {
        draft.players[0].hand.push(card);
      }
      draft.phase = "main1";
    });

    // Main phase: Play a land (Forest)
    currentState = player1Manager.updateState(currentState.id, (draft) => {
      const forestIndex = draft.players[0].hand.findIndex((c) =>
        c.includes("forest"),
      );
      if (forestIndex !== -1) {
        const forest = draft.players[0].hand.splice(forestIndex, 1)[0];
        draft.players[0].battlefield.push(forest);
      }
    });

    // End turn
    currentState = player1Manager.updateState(currentState.id, (draft) => {
      draft.phase = "end";
      draft.turn = 2;
      draft.activePlayer = "player2";
    });

    player2Manager.mergeRemoteState(currentState);

    state = player1Manager.getState();
    expect(state?.data.turn).toBe(2);
    expect(state?.data.players[0].battlefield.length).toBeGreaterThan(0);

    // === Turn 2: Player 2 ===
    currentState = player1Manager.updateState(currentState.id, (draft) => {
      draft.phase = "upkeep";
    });

    // Draw
    currentState = player1Manager.updateState(currentState.id, (draft) => {
      const card = draft.players[1].library.pop();
      if (card) {
        draft.players[1].hand.push(card);
      }
      draft.phase = "main1";
    });

    // Play a land (Mountain)
    currentState = player1Manager.updateState(currentState.id, (draft) => {
      const mountainIndex = draft.players[1].hand.findIndex((c) =>
        c.includes("mountain"),
      );
      if (mountainIndex !== -1) {
        const mountain = draft.players[1].hand.splice(mountainIndex, 1)[0];
        draft.players[1].battlefield.push(mountain);
      }
    });

    // End turn
    currentState = player1Manager.updateState(currentState.id, (draft) => {
      draft.phase = "end";
      draft.turn = 3;
      draft.activePlayer = "player1";
    });

    player2Manager.mergeRemoteState(currentState);

    state = player1Manager.getState();
    expect(state?.data.turn).toBe(3);
    expect(state?.data.players[1].battlefield.length).toBeGreaterThan(0);

    // === Turn 3: Player 1 ===
    currentState = player1Manager.updateState(currentState.id, (draft) => {
      draft.phase = "upkeep";
    });

    // Draw
    currentState = player1Manager.updateState(currentState.id, (draft) => {
      const card = draft.players[0].library.pop();
      if (card) {
        draft.players[0].hand.push(card);
      }
      draft.phase = "main1";
    });

    // Play another land
    currentState = player1Manager.updateState(currentState.id, (draft) => {
      const forestIndex = draft.players[0].hand.findIndex((c) =>
        c.includes("forest"),
      );
      if (forestIndex !== -1) {
        const forest = draft.players[0].hand.splice(forestIndex, 1)[0];
        draft.players[0].battlefield.push(forest);
      }
    });

    // Cast Llanowar Elves (if in hand and enough mana)
    currentState = player1Manager.updateState(currentState.id, (draft) => {
      const elvesIndex = draft.players[0].hand.findIndex((c) =>
        c.includes("llanowar-elves"),
      );
      if (elvesIndex !== -1 && draft.players[0].battlefield.length >= 1) {
        const elves = draft.players[0].hand.splice(elvesIndex, 1)[0];
        draft.players[0].battlefield.push(elves);
      }
    });

    player2Manager.mergeRemoteState(currentState);

    // Verify game state
    state = player1Manager.getState();
    expect(state?.data.turn).toBe(3);
    expect(state?.data.players[0].battlefield.length).toBeGreaterThan(1);

    // Verify both players have consistent view
    const state1 = player1Manager.getState();
    const state2 = player2Manager.getState();

    expect(state1?.data.turn).toBe(state2?.data.turn);
    expect(state1?.data.players[0].life).toBe(20);
    expect(state2?.data.players[1].life).toBe(20);
  });

  test("should handle combat phase with life changes", async () => {
    const initialState: MTGGameState = {
      gameId: "game2",
      players: [
        {
          id: "player1",
          name: "Alice",
          life: 20,
          library: [],
          hand: [],
          battlefield: ["llanowar-elves"],
          graveyard: [],
        },
        {
          id: "player2",
          name: "Bob",
          life: 20,
          library: [],
          hand: [],
          battlefield: [],
          graveyard: [],
        },
      ],
      turn: 3,
      phase: "combat",
      activePlayer: "player1",
    };

    let currentState = player1Manager.createState(initialState);
    player2Manager.mergeRemoteState(currentState);

    // Declare attackers
    currentState = player1Manager.updateState(currentState.id, (draft) => {
      draft.phase = "declare-attackers";
    });

    // No blockers
    currentState = player1Manager.updateState(currentState.id, (draft) => {
      draft.phase = "declare-blockers";
    });

    // Deal combat damage
    currentState = player1Manager.updateState(currentState.id, (draft) => {
      draft.players[1].life -= 1; // Llanowar Elves deals 1 damage
      draft.phase = "combat-damage";
    });

    player2Manager.mergeRemoteState(currentState);

    const state = player1Manager.getState();
    expect(state?.data.players[1].life).toBe(19);
  });

  test("should handle spell casting and resolution", async () => {
    const initialState: MTGGameState = {
      gameId: "game3",
      players: [
        {
          id: "player1",
          name: "Alice",
          life: 20,
          library: [],
          hand: ["lightning-bolt"],
          battlefield: ["mountain1"],
          graveyard: [],
        },
        {
          id: "player2",
          name: "Bob",
          life: 20,
          library: [],
          hand: [],
          battlefield: [],
          graveyard: [],
        },
      ],
      turn: 1,
      phase: "main1",
      activePlayer: "player1",
    };

    let currentState = player1Manager.createState(initialState);
    player2Manager.mergeRemoteState(currentState);

    // Cast Lightning Bolt targeting opponent
    currentState = player1Manager.updateState(currentState.id, (draft) => {
      const boltIndex = draft.players[0].hand.findIndex((c) =>
        c.includes("lightning-bolt"),
      );
      if (boltIndex !== -1) {
        const bolt = draft.players[0].hand.splice(boltIndex, 1)[0];
        draft.players[1].life -= 3;
        draft.players[0].graveyard.push(bolt);
      }
    });

    player2Manager.mergeRemoteState(currentState);

    const state = player1Manager.getState();
    expect(state?.data.players[1].life).toBe(17);
    expect(state?.data.players[0].graveyard).toContain("lightning-bolt");
  });

  test("should handle complex turn with multiple operations", async () => {
    const initialState: MTGGameState = {
      gameId: "game4",
      players: [
        {
          id: "player1",
          name: "Alice",
          life: 15,
          library: ["forest3"],
          hand: ["giant-growth"],
          battlefield: ["forest1", "forest2", "llanowar-elves"],
          graveyard: [],
        },
        {
          id: "player2",
          name: "Bob",
          life: 18,
          library: ["mountain3"],
          hand: [],
          battlefield: ["mountain1", "mountain2", "goblin-guide"],
          graveyard: [],
        },
      ],
      turn: 4,
      phase: "main1",
      activePlayer: "player1",
    };

    let currentState = player1Manager.createState(initialState);
    player2Manager.mergeRemoteState(currentState);

    // Player 1 plays a land
    currentState = player1Manager.updateState(currentState.id, (draft) => {
      const card = draft.players[0].library.pop();
      if (card) {
        draft.players[0].hand.push(card);
      }
    });

    currentState = player1Manager.updateState(currentState.id, (draft) => {
      const forestIndex = draft.players[0].hand.findIndex((c) =>
        c.includes("forest"),
      );
      if (forestIndex !== -1) {
        const forest = draft.players[0].hand.splice(forestIndex, 1)[0];
        draft.players[0].battlefield.push(forest);
      }
    });

    // Combat phase
    currentState = player1Manager.updateState(currentState.id, (draft) => {
      draft.phase = "combat";
    });

    player2Manager.mergeRemoteState(currentState);

    const state = player1Manager.getState();
    expect(state?.data.players[0].battlefield.length).toBeGreaterThan(2);
    expect(state?.data.phase).toBe("combat");
  });
});
