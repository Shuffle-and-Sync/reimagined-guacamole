/**
 * Delta Sync Usage Examples
 *
 * Demonstrates real-world scenarios for using the delta-sync module
 * in a trading card game streaming coordination platform.
 */

/* eslint-disable no-console */

import { DeltaSyncEngine, PatchGenerator, PatchApplier } from "./index";
import type { JsonPatch } from "./types";

/**
 * Example 1: Basic State Synchronization
 *
 * Two clients synchronizing a simple game state
 */
export function basicSynchronization() {
  console.log("=== Example 1: Basic State Synchronization ===\n");

  const engine = new DeltaSyncEngine({ clientId: "client-1" });

  // Initial state
  const oldState = {
    gameId: "mtg-stream-001",
    players: [
      { id: "p1", name: "Alice", lifeTotal: 20, poison: 0 },
      { id: "p2", name: "Bob", lifeTotal: 20, poison: 0 },
    ],
    turn: 1,
    phase: "main1",
  };

  // Updated state (Alice takes damage)
  const newState = {
    gameId: "mtg-stream-001",
    players: [
      { id: "p1", name: "Alice", lifeTotal: 17, poison: 0 },
      { id: "p2", name: "Bob", lifeTotal: 20, poison: 0 },
    ],
    turn: 1,
    phase: "main1",
  };

  // Generate patches
  const patches = engine.generatePatches(oldState, newState);
  console.log("Generated patches:", JSON.stringify(patches, null, 2));

  // Apply patches
  const result = engine.applyPatches(oldState, patches);
  console.log(
    "\nApplied successfully:",
    result.applied.length === patches.length,
  );
  console.log(
    "New state matches:",
    JSON.stringify(result.newState) === JSON.stringify(newState),
  );
  console.log();
}

/**
 * Example 2: Multi-Client Synchronization
 *
 * Multiple clients making concurrent changes
 */
export async function multiClientSync() {
  console.log("=== Example 2: Multi-Client Synchronization ===\n");

  const client1 = new DeltaSyncEngine({ clientId: "client-1" });
  const client2 = new DeltaSyncEngine({ clientId: "client-2" });

  // Shared initial state
  let state1 = {
    tournament: {
      name: "Friday Night Magic",
      round: 1,
      matches: [
        { table: 1, player1: "Alice", player2: "Bob", winner: null },
        { table: 2, player1: "Carol", player2: "Dave", winner: null },
      ],
    },
  };

  let state2 = JSON.parse(JSON.stringify(state1)); // Deep clone

  // Client 1 updates match 1
  const newState1 = JSON.parse(JSON.stringify(state1));
  newState1.tournament.matches[0].winner = "Alice";

  // Client 2 updates match 2
  const newState2 = JSON.parse(JSON.stringify(state2));
  newState2.tournament.matches[1].winner = "Carol";

  // Generate patches from each client
  const patches1 = client1.generatePatches(state1, newState1);
  const patches2 = client2.generatePatches(state2, newState2);

  console.log("Client 1 patches:", JSON.stringify(patches1, null, 2));
  console.log("\nClient 2 patches:", JSON.stringify(patches2, null, 2));

  // Merge patches (no conflicts since different paths)
  const merged = client1.mergePatchSets(state1, patches1, patches2);
  console.log("\nMerged patches:", JSON.stringify(merged, null, 2));

  // Apply merged patches
  const result = client1.applyPatches(state1, merged);
  console.log("\nFinal state:", JSON.stringify(result.newState, null, 2));
  console.log();
}

/**
 * Example 3: Conflict Resolution
 *
 * Handling conflicting changes to the same data
 */
export async function conflictResolution() {
  console.log("=== Example 3: Conflict Resolution ===\n");

  const client1 = new DeltaSyncEngine({ clientId: "client-1" });
  const client2 = new DeltaSyncEngine({ clientId: "client-2" });

  const baseState = {
    streamConfig: {
      title: "MTG Commander Stream",
      viewerCount: 100,
      isLive: true,
    },
  };

  // Client 1 changes title
  const state1 = JSON.parse(JSON.stringify(baseState));
  state1.streamConfig.title = "MTG Commander - Game 2";

  // Client 2 also changes title (conflict!)
  const state2 = JSON.parse(JSON.stringify(baseState));
  state2.streamConfig.title = "MTG Commander - Epic Game";

  const patches1 = client1.generatePatches(baseState, state1);
  const patches2 = client2.generatePatches(baseState, state2);

  console.log("Client 1 wants:", patches1[0].value);
  console.log("Client 2 wants:", patches2[0].value);

  // Merge with conflict resolution (last-write-wins by default)
  const merged = client1.mergePatchSets(baseState, patches1, patches2);
  const result = client1.applyPatches(baseState, merged);

  console.log("\nResolved title:", result.newState.streamConfig.title);
  console.log();
}

/**
 * Example 4: Optimized Patch Generation
 *
 * Demonstrating patch optimization
 */
export function patchOptimization() {
  console.log("=== Example 4: Patch Optimization ===\n");

  const generator = new PatchGenerator({ optimize: false });
  const engine = new DeltaSyncEngine({ enableOptimization: true });

  const oldState = {
    counter: 1,
    temp: "will be removed",
    value: 100,
  };

  // Make several changes
  let state = { ...oldState };
  state.counter = 2;
  state.counter = 3;
  state.counter = 4;
  delete state.temp;
  state.value = 200;
  state.value = 150;

  const newState = {
    counter: 4,
    value: 150,
  };

  // Unoptimized patches
  const unoptimized = generator.generate(oldState, newState);
  console.log("Unoptimized patches:", unoptimized.length);
  console.log(JSON.stringify(unoptimized, null, 2));

  // Optimized patches
  const optimized = engine.generatePatches(oldState, newState);
  console.log("\nOptimized patches:", optimized.length);
  console.log(JSON.stringify(optimized, null, 2));

  console.log(
    `\nReduction: ${((1 - optimized.length / unoptimized.length) * 100).toFixed(1)}%`,
  );
  console.log();
}

/**
 * Example 5: Compressed Synchronization
 *
 * Using compression for large state changes
 */
export async function compressedSync() {
  console.log("=== Example 5: Compressed Synchronization ===\n");

  const engine = new DeltaSyncEngine({
    enableCompression: true,
    compressionThreshold: 100, // Compress if larger than 100 bytes
  });

  // Large state with many cards
  const oldState = {
    battlefield: Array.from({ length: 50 }, (_, i) => ({
      id: `card-${i}`,
      name: `Creature ${i}`,
      power: 2,
      toughness: 2,
      tapped: false,
    })),
  };

  // Tap all creatures
  const newState = {
    battlefield: oldState.battlefield.map((card) => ({
      ...card,
      tapped: true,
    })),
  };

  const message = await engine.createPatchMessage(
    oldState,
    newState,
    { client: 1 },
    { client: 2 },
  );

  console.log("Patches count:", message.patches.length);
  console.log("Compressed:", message.compressed);
  console.log("Message size:", JSON.stringify(message).length, "bytes");
  console.log();
}

/**
 * Example 6: Real-time Game State Updates
 *
 * Simulating a real-time card game with frequent updates
 */
export function realtimeGameUpdates() {
  console.log("=== Example 6: Real-time Game State Updates ===\n");

  const engine = new DeltaSyncEngine();

  let gameState = {
    players: [
      {
        id: "p1",
        name: "Alice",
        life: 20,
        hand: ["Forest", "Llanowar Elves", "Giant Growth"],
        battlefield: [],
        graveyard: [],
      },
      {
        id: "p2",
        name: "Bob",
        life: 20,
        hand: ["Mountain", "Goblin Guide", "Lightning Bolt"],
        battlefield: [],
        graveyard: [],
      },
    ],
    turn: 1,
    activePlayer: "p1",
  };

  console.log("Initial state - Turn 1");

  // Action 1: Alice plays a Forest
  const action1 = JSON.parse(JSON.stringify(gameState));
  action1.players[0].hand = action1.players[0].hand.filter(
    (c) => c !== "Forest",
  );
  action1.players[0].battlefield.push("Forest");

  let patches = engine.generatePatches(gameState, action1);
  console.log("\nAction: Play Forest");
  console.log("Patches:", patches.length);
  gameState = engine.applyPatches(gameState, patches).newState;

  // Action 2: Alice plays Llanowar Elves
  const action2 = JSON.parse(JSON.stringify(gameState));
  action2.players[0].hand = action2.players[0].hand.filter(
    (c) => c !== "Llanowar Elves",
  );
  action2.players[0].battlefield.push("Llanowar Elves");

  patches = engine.generatePatches(gameState, action2);
  console.log("\nAction: Play Llanowar Elves");
  console.log("Patches:", patches.length);
  gameState = engine.applyPatches(gameState, patches).newState;

  // Action 3: Pass turn
  const action3 = JSON.parse(JSON.stringify(gameState));
  action3.turn = 2;
  action3.activePlayer = "p2";

  patches = engine.generatePatches(gameState, action3);
  console.log("\nAction: Pass turn");
  console.log("Patches:", patches.length);
  gameState = engine.applyPatches(gameState, patches).newState;

  console.log("\nFinal state - Turn 2");
  console.log("Active player:", gameState.activePlayer);
  console.log("Alice's battlefield:", gameState.players[0].battlefield);
  console.log();
}

/**
 * Example 7: Error Handling
 *
 * Handling various error scenarios
 */
export function errorHandling() {
  console.log("=== Example 7: Error Handling ===\n");

  const applier = new PatchApplier({ atomic: true, validate: true });

  const state = {
    user: { name: "Alice", age: 30 },
  };

  // Invalid patch - missing required field
  const invalidPatches: JsonPatch[] = [
    { op: "add", path: "/user/email" } as any, // Missing 'value'
  ];

  try {
    applier.apply(state, invalidPatches);
  } catch (error: any) {
    console.log("Caught error:", error.name);
    console.log("Message:", error.message);
  }

  // Test operation failure
  const testPatches: JsonPatch[] = [
    { op: "test", path: "/user/age", value: 25 }, // Wrong value
  ];

  try {
    applier.apply(state, testPatches);
  } catch (error: any) {
    console.log("\nCaught error:", error.name);
    console.log("Expected 25, got:", state.user.age);
  }

  // Partial failure with non-atomic mode
  const nonAtomic = new PatchApplier({ atomic: false });
  const mixedPatches: JsonPatch[] = [
    { op: "replace", path: "/user/name", value: "Bob" },
    { op: "remove", path: "/user/nonexistent" }, // Will fail
    { op: "add", path: "/user/email", value: "bob@example.com" },
  ];

  const result = nonAtomic.applyWithResult(state, mixedPatches);
  console.log("\nNon-atomic mode:");
  console.log("Applied:", result.applied.length, "patches");
  console.log("Failed:", result.failed.length, "patches");
  console.log("New state:", result.newState);
  console.log();
}

/**
 * Run all examples
 */
export function runAllExamples() {
  basicSynchronization();
  multiClientSync();
  conflictResolution();
  patchOptimization();
  compressedSync();
  realtimeGameUpdates();
  errorHandling();

  console.log("=== All Examples Complete ===");
}

// Run examples if executed directly
if (require.main === module) {
  runAllExamples();
}
