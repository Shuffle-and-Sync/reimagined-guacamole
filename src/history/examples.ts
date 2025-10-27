/**
 * Integration example showing how to use the History system with State management
 *
 * This example demonstrates:
 * - Creating a game state
 * - Using commands to modify state
 * - Undo/redo operations
 * - Multi-user scenarios
 *
 * Note: This file uses console.log for demonstration purposes
 */
/* eslint-disable no-console, @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */

import {
  MoveCardCommand,
  TapCardCommand,
  AddCounterCommand,
  GameState,
} from "./commands/CardCommands";
import { AdvanceTurnCommand, FullGameState } from "./commands/GameCommands";
import {
  UpdateLifeCommand,
  GameStateWithPlayers,
} from "./commands/PlayerCommands";
import { HistoryManager } from "./HistoryManager";

/**
 * Example 1: Basic Undo/Redo
 */
export function basicUndoRedoExample() {
  console.log("=== Basic Undo/Redo Example ===\n");

  // Create history manager
  const history = new HistoryManager<GameState>();

  // Initial game state
  const initialState: GameState = {
    board: {
      hand: ["Lightning Bolt", "Mountain"],
      battlefield: [],
      graveyard: [],
      library: ["Shock", "Island"],
      exile: [],
      command: [],
      sideboard: [],
    },
    cards: {},
  };

  // Execute: Play Lightning Bolt
  const playCard = new MoveCardCommand(
    "player1",
    "Lightning Bolt",
    "hand",
    "battlefield",
  );
  history.push(playCard);
  let state = playCard.execute(initialState);

  console.log("After playing card:");
  console.log("Hand:", state.board.hand);
  console.log("Battlefield:", state.board.battlefield);

  // Undo: Return card to hand
  state = history.undo("player1", state);
  console.log("\nAfter undo:");
  console.log("Hand:", state.board.hand);
  console.log("Battlefield:", state.board.battlefield);

  // Redo: Play card again
  state = history.redo("player1", state);
  console.log("\nAfter redo:");
  console.log("Hand:", state.board.hand);
  console.log("Battlefield:", state.board.battlefield);

  return state;
}

/**
 * Example 2: Multi-User Game
 */
export function multiUserExample() {
  console.log("\n\n=== Multi-User Game Example ===\n");

  const history = new HistoryManager<any>();

  const initialState: any = {
    board: {
      hand: ["Creature A", "Creature B"],
      battlefield: [],
      graveyard: [],
      library: ["Spell"],
      exile: [],
      command: [],
      sideboard: [],
    },
    cards: {},
    players: {
      player1: { id: "player1", name: "Alice", life: 20 },
      player2: { id: "player2", name: "Bob", life: 20 },
    },
  };

  // Player 1 plays a creature
  const p1Play = new MoveCardCommand(
    "player1",
    "Creature A",
    "hand",
    "battlefield",
  );
  history.push(p1Play);
  let state = p1Play.execute(initialState);

  // Player 2 takes damage
  const p2Damage = new UpdateLifeCommand("player2", "player2", -3);
  history.push(p2Damage);
  state = p2Damage.execute(state);

  console.log("After Player 1 plays creature and Player 2 takes damage:");
  console.log("Battlefield:", state.board.battlefield);
  console.log("Player 2 life:", state.players.player2.life);

  // Player 1 undoes their action
  state = history.undo("player1", state);
  console.log("\nAfter Player 1 undo:");
  console.log("Battlefield:", state.board.battlefield);
  console.log("Player 2 life:", state.players.player2.life); // Still damaged

  // Check undo/redo availability per user
  console.log("\nPlayer 1 can undo:", history.canUndo("player1")); // false
  console.log("Player 2 can undo:", history.canUndo("player2")); // true

  return state;
}

/**
 * Example 3: Conflict Detection
 */
export function conflictDetectionExample() {
  console.log("\n\n=== Conflict Detection Example ===\n");

  const history = new HistoryManager<GameState>();

  const initialState: GameState = {
    board: {
      hand: [],
      battlefield: ["Shared Creature"],
      graveyard: [],
      library: [],
      exile: [],
      command: [],
      sideboard: [],
    },
    cards: {
      "Shared Creature": { tapped: false, counters: {} },
    },
  };

  // User 1 taps the creature
  const tap = new TapCardCommand("user1", "Shared Creature", true);
  history.push(tap);
  let state = tap.execute(initialState);

  // User 2 adds counters to the same creature (conflict!)
  const counter = new AddCounterCommand("user2", "Shared Creature", "+1/+1", 2);
  history.push(counter);
  state = counter.execute(state);

  // Check for conflicts
  const conflicts = history.getConflicts();
  console.log("Conflicts detected:", conflicts.length);
  if (conflicts.length > 0) {
    console.log("Affected entities:", conflicts[0].affectedEntities);
    console.log(
      "Users involved:",
      conflicts[0].commands.map((cmd) => cmd.userId),
    );
  }

  return state;
}

/**
 * Example 4: Branch Undo (Speculative Operations)
 */
export function branchUndoExample() {
  console.log("\n\n=== Branch Undo (Speculative) Example ===\n");

  const history = new HistoryManager<GameState>();

  const initialState: GameState = {
    board: {
      hand: ["Card A", "Card B", "Card C"],
      battlefield: [],
      graveyard: [],
      library: [],
      exile: [],
      command: [],
      sideboard: [],
    },
    cards: {},
  };

  // Play first card
  const play1 = new MoveCardCommand("player1", "Card A", "hand", "battlefield");
  history.push(play1);
  let state = play1.execute(initialState);

  console.log("After playing Card A:");
  console.log("Battlefield:", state.board.battlefield);

  // Create a branch for speculation
  history.createBranch("player1", "what-if");
  console.log("\nCreated speculative branch");

  // Speculative: Play more cards
  const play2 = new MoveCardCommand("player1", "Card B", "hand", "battlefield");
  const play3 = new MoveCardCommand("player1", "Card C", "hand", "battlefield");
  history.push(play2);
  state = play2.execute(state);
  history.push(play3);
  state = play3.execute(state);

  console.log("After speculative plays:");
  console.log("Battlefield:", state.board.battlefield);

  // Revert to branch (speculation didn't work out)
  history.restoreBranch("player1", "what-if");
  console.log("\nReverted to branch:");
  console.log(
    "History length:",
    history.getHistory("player1").length,
    "(back to 1)",
  );

  return state;
}

/**
 * Example 5: History Statistics
 */
export function historyStatsExample() {
  console.log("\n\n=== History Statistics Example ===\n");

  const history = new HistoryManager<GameState>();

  const initialState: GameState = {
    board: {
      hand: ["Card1", "Card2", "Card3"],
      battlefield: [],
      graveyard: [],
      library: [],
      exile: [],
      command: [],
      sideboard: [],
    },
    cards: {},
  };

  let state = initialState;

  // Simulate a game with multiple commands
  for (let i = 0; i < 10; i++) {
    const user = i % 2 === 0 ? "player1" : "player2";
    const command = new MoveCardCommand(
      user,
      `Card${i}`,
      "hand",
      "battlefield",
    );
    history.push(command);
    // Note: We're not actually executing for this example
  }

  // Get statistics
  const stats = history.getStats();

  console.log("History Statistics:");
  console.log("Total commands:", stats.totalCommands);
  console.log("Commands by user:");
  stats.commandsByUser.forEach((count, user) => {
    console.log(`  ${user}: ${count}`);
  });
  console.log("Commands by type:");
  stats.commandsByType.forEach((count, type) => {
    console.log(`  ${type}: ${count}`);
  });
  console.log("Estimated size:", stats.estimatedSize, "bytes");

  return state;
}

/**
 * Run all examples
 */
export function runAllExamples() {
  basicUndoRedoExample();
  multiUserExample();
  conflictDetectionExample();
  branchUndoExample();
  historyStatsExample();

  console.log("\n\n=== All Examples Complete ===");
}

// Auto-run when executed directly
runAllExamples();
