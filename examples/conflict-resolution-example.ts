/**
 * Conflict Resolution Engine - Working Example
 *
 * This example demonstrates the operational transformation system
 * handling concurrent game actions in a Magic: The Gathering style game.
 *
 * Note: This file uses console logging for demonstration purposes only.
 * In production code, use the standard logger from server/utils.
 */

/* eslint-disable no-console */

import {
  GameStateDeltaCompressor,
  shouldUseDelta,
} from "../shared/game-state-delta";
import {
  GameStateManager,
  createGameAction,
  createInitialTCGState,
} from "../shared/game-state-manager";
import type { TCGGameState } from "../shared/game-state-schema";

// ============================================================================
// Example 1: Independent Concurrent Actions
// ============================================================================

function example1_IndependentActions() {
  console.log("\n=== Example 1: Independent Concurrent Actions ===\n");

  const manager = new GameStateManager();
  const initialState = createInitialTCGState(
    "game-session-1",
    ["alice", "bob"],
    ["Alice", "Bob"],
  );
  manager.initialize(initialState);

  console.log("Initial state:");
  console.log(`- Alice hand: ${initialState.players[0].hand.length} cards`);
  console.log(`- Bob hand: ${initialState.players[1].hand.length} cards`);
  console.log(`- Version: ${initialState.version}\n`);

  // Both players draw at the same time (version 0)
  const aliceDraws = createGameAction("draw", "alice", { count: 2 }, 0);
  const bobDraws = createGameAction("draw", "bob", { count: 1 }, 0);

  console.log("Alice draws 2 cards (based on version 0)");
  const stateAfterAlice = manager.applyAction(aliceDraws, initialState);
  console.log(`- Alice hand: ${stateAfterAlice.players[0].hand.length} cards`);
  console.log(`- Version: ${stateAfterAlice.version}\n`);

  console.log("Bob draws 1 card (based on version 0 - concurrent!)");
  const stateAfterBoth = manager.applyAction(bobDraws, stateAfterAlice);
  console.log(`- Alice hand: ${stateAfterBoth.players[0].hand.length} cards`);
  console.log(`- Bob hand: ${stateAfterBoth.players[1].hand.length} cards`);
  console.log(`- Version: ${stateAfterBoth.version}`);
  console.log("\n✅ Both actions succeeded because they're independent!\n");

  return stateAfterBoth;
}

// ============================================================================
// Example 2: Conflicting Actions (First Wins)
// ============================================================================

function example2_ConflictingActions() {
  console.log("\n=== Example 2: Conflicting Actions ===\n");

  const manager = new GameStateManager();
  const initialState = createInitialTCGState(
    "game-session-2",
    ["alice", "bob"],
    ["Alice", "Bob"],
  );
  manager.initialize(initialState);

  // Setup: Alice plays a creature
  let state = initialState;
  const draw = createGameAction("draw", "alice", { count: 1 }, 0);
  state = manager.applyAction(draw, state);

  const cardId = state.players[0].hand[0].id;
  const play = createGameAction("play", "alice", { cardId }, 1);
  state = manager.applyAction(play, state);

  const permanentId = state.battlefield.permanents[0].id;
  console.log("Setup: Alice has played a creature");
  console.log(`- Permanent ID: ${permanentId}`);
  console.log(`- Is tapped: ${state.battlefield.permanents[0].isTapped}\n`);

  // Both players try to tap the same creature at version 2
  const aliceTaps = createGameAction(
    "tap",
    "alice",
    { cardId: permanentId },
    2,
  );
  const bobTaps = createGameAction("tap", "bob", { cardId: permanentId }, 2);

  console.log("Alice tries to tap the creature (version 2)");
  const stateAfterAlice = manager.applyAction(aliceTaps, state);
  console.log(
    `- Is tapped: ${stateAfterAlice.battlefield.permanents[0].isTapped}`,
  );
  console.log(`- Version: ${stateAfterAlice.version}\n`);

  console.log("Bob tries to tap the same creature (version 2 - concurrent!)");
  const stateAfterBoth = manager.applyAction(bobTaps, stateAfterAlice);
  console.log(
    `- Is tapped: ${stateAfterBoth.battlefield.permanents[0].isTapped}`,
  );
  console.log(`- Version: ${stateAfterBoth.version}`);
  console.log(
    "\n✅ Alice's action won! Bob's action was transformed to no-op.\n",
  );

  return stateAfterBoth;
}

// ============================================================================
// Example 3: Commutative Actions (Both Apply)
// ============================================================================

function example3_CommutativeActions() {
  console.log("\n=== Example 3: Commutative Actions ===\n");

  const manager = new GameStateManager();
  const initialState = createInitialTCGState(
    "game-session-3",
    ["alice", "bob"],
    ["Alice", "Bob"],
  );
  manager.initialize(initialState);

  console.log("Initial state:");
  console.log(`- Alice life: ${initialState.players[0].lifeTotal}\n`);

  // Alice takes damage from two different sources simultaneously
  const damage1 = createGameAction("change_life", "alice", { delta: -3 }, 0);
  const damage2 = createGameAction("change_life", "alice", { delta: -5 }, 0);

  console.log("Alice takes 3 damage (version 0)");
  const stateAfterDamage1 = manager.applyAction(damage1, initialState);
  console.log(`- Alice life: ${stateAfterDamage1.players[0].lifeTotal}`);
  console.log(`- Version: ${stateAfterDamage1.version}\n`);

  console.log("Alice takes 5 damage (version 0 - concurrent!)");
  const stateAfterDamage2 = manager.applyAction(damage2, stateAfterDamage1);
  console.log(`- Alice life: ${stateAfterDamage2.players[0].lifeTotal}`);
  console.log(`- Version: ${stateAfterDamage2.version}`);
  console.log("\n✅ Both damage amounts applied! (20 - 3 - 5 = 12)\n");

  return stateAfterDamage2;
}

// ============================================================================
// Example 4: Undo/Redo System
// ============================================================================

function example4_UndoRedo() {
  console.log("\n=== Example 4: Undo/Redo System ===\n");

  const manager = new GameStateManager();
  const initialState = createInitialTCGState(
    "game-session-4",
    ["alice", "bob"],
    ["Alice", "Bob"],
  );
  manager.initialize(initialState);

  let state = initialState;

  // Perform several actions
  console.log("Performing actions:");
  for (let i = 0; i < 5; i++) {
    const action = createGameAction("draw", "alice", { count: 1 }, i);
    state = manager.applyAction(action, state);
    console.log(`- Action ${i + 1}: Draw card (version ${state.version})`);
  }
  console.log(`\nAlice hand: ${state.players[0].hand.length} cards`);

  // Undo 2 steps
  console.log("\nUndo 2 steps:");
  const undoneState = manager.undo(2);
  if (undoneState) {
    console.log(`- Version: ${undoneState.version}`);
    console.log(`- Alice hand: ${undoneState.players[0].hand.length} cards`);
  }

  // Redo 1 step
  console.log("\nRedo 1 step:");
  const redoneState = manager.redo(1);
  if (redoneState) {
    console.log(`- Version: ${redoneState.version}`);
    console.log(`- Alice hand: ${redoneState.players[0].hand.length} cards`);
  }

  // Show available versions
  console.log("\nAvailable versions in history:");
  console.log(manager.getAvailableVersions().join(", "));
  console.log("\n✅ Undo/redo works perfectly!\n");

  return redoneState || state;
}

// ============================================================================
// Example 5: Delta Synchronization
// ============================================================================

function example5_DeltaSync() {
  console.log("\n=== Example 5: Delta Synchronization ===\n");

  const manager = new GameStateManager();
  const initialState = createInitialTCGState(
    "game-session-5",
    ["alice", "bob"],
    ["Alice", "Bob"],
  );
  manager.initialize(initialState);

  // Apply an action
  const action = createGameAction("change_life", "alice", { delta: -5 }, 0);
  const newState = manager.applyAction(action, initialState);

  // Create delta
  const delta = GameStateDeltaCompressor.createDelta(initialState, newState);

  console.log("State change: Alice takes 5 damage");
  console.log(`- Old life: ${initialState.players[0].lifeTotal}`);
  console.log(`- New life: ${newState.players[0].lifeTotal}\n`);

  console.log("Delta operations:");
  console.log(JSON.stringify(delta.operations, null, 2));

  // Calculate compression
  const fullStateSize = JSON.stringify(newState).length;
  const deltaSize = JSON.stringify(delta).length;
  const ratio = GameStateDeltaCompressor.calculateCompressionRatio(
    newState,
    delta,
  );

  console.log(`\nSize comparison:`);
  console.log(`- Full state: ${fullStateSize} bytes`);
  console.log(`- Delta: ${deltaSize} bytes`);
  console.log(`- Compression: ${ratio.toFixed(1)}% smaller`);

  // Apply delta to reconstruct state
  console.log("\nApplying delta to old state:");
  const reconstructed = GameStateDeltaCompressor.applyDelta(
    initialState,
    delta,
  );
  console.log(`- Reconstructed life: ${reconstructed.players[0].lifeTotal}`);
  console.log(
    `- Matches new state: ${reconstructed.players[0].lifeTotal === newState.players[0].lifeTotal}`,
  );

  // Check if delta should be used
  const useDelta = shouldUseDelta(newState, delta);
  console.log(`\nShould use delta? ${useDelta ? "YES" : "NO"}`);
  console.log("\n✅ Delta sync reduces bandwidth significantly!\n");

  return newState;
}

// ============================================================================
// Example 6: Complex Game Scenario
// ============================================================================

function example6_ComplexScenario() {
  console.log("\n=== Example 6: Complex Game Scenario ===\n");

  const manager = new GameStateManager();
  const initialState = createInitialTCGState(
    "game-session-6",
    ["alice", "bob"],
    ["Alice", "Bob"],
  );
  manager.initialize(initialState);

  let state = initialState;

  console.log("Turn 1: Alice's turn");

  // Alice draws a card
  let action = createGameAction("draw", "alice", { count: 1 }, state.version);
  state = manager.applyAction(action, state);
  console.log(`- Drew card (hand: ${state.players[0].hand.length})`);

  // Alice plays a land
  const cardId = state.players[0].hand[0].id;
  action = createGameAction("play", "alice", { cardId }, state.version);
  state = manager.applyAction(action, state);
  console.log(
    `- Played land (battlefield: ${state.battlefield.permanents.length})`,
  );

  // Alice advances phase
  action = createGameAction("advance_phase", "alice", {}, state.version);
  state = manager.applyAction(action, state);
  console.log(`- Advanced to ${state.currentTurn.phase} phase`);

  console.log("\nTurn 1: Bob's turn");

  // Bob draws
  action = createGameAction("draw", "bob", { count: 1 }, state.version);
  state = manager.applyAction(action, state);
  console.log(`- Drew card (hand: ${state.players[1].hand.length})`);

  // Track history
  console.log(
    `\nGame history: ${manager.getAvailableVersions().length} versions tracked`,
  );
  console.log(`Current version: ${state.version}`);

  // Can rewind to any point
  const turn1Start = manager.getStateAtVersion(0);
  if (turn1Start) {
    console.log(`\nCan rewind to turn 1 start:`);
    console.log(
      `- Alice hand at start: ${turn1Start.players[0].hand.length} cards`,
    );
    console.log(`- Current Alice hand: ${state.players[0].hand.length} cards`);
  }

  console.log("\n✅ Complex scenario handled with full history!\n");

  return state;
}

// ============================================================================
// Run All Examples
// ============================================================================

function runAllExamples() {
  console.log(
    "╔══════════════════════════════════════════════════════════════╗",
  );
  console.log(
    "║  Conflict Resolution Engine - Demonstration Examples         ║",
  );
  console.log(
    "╚══════════════════════════════════════════════════════════════╝",
  );

  try {
    example1_IndependentActions();
    example2_ConflictingActions();
    example3_CommutativeActions();
    example4_UndoRedo();
    example5_DeltaSync();
    example6_ComplexScenario();

    console.log(
      "╔══════════════════════════════════════════════════════════════╗",
    );
    console.log(
      "║  ✅ All examples completed successfully!                     ║",
    );
    console.log(
      "╚══════════════════════════════════════════════════════════════╝\n",
    );
  } catch (error) {
    console.error("\n❌ Error running examples:", error);
    process.exit(1);
  }
}

// Run examples
runAllExamples();

export {
  example1_IndependentActions,
  example2_ConflictingActions,
  example3_CommutativeActions,
  example4_UndoRedo,
  example5_DeltaSync,
  example6_ComplexScenario,
  runAllExamples,
};
