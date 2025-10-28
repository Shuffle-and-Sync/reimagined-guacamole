/**
 * Test Helper Functions
 *
 * Utilities for creating test clients, servers, and waiting for convergence.
 */

export interface TestState {
  counter: number;
  value?: number;
  players?: Array<{ id: string; name: string; life: number }>;
  turn?: number;
  battlefield?: string[];
  hand?: string[];
  graveyard?: string[];
}

/**
 * Wait for a specified duration
 */
export async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  checkInterval = 50,
): Promise<void> {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const result = await condition();
    if (result) {
      return;
    }
    await wait(checkInterval);
  }

  throw new Error("Timeout waiting for condition");
}

/**
 * Wait for states to converge (all states are equal)
 */
export async function waitForConvergence<T>(
  getStates: () => T[],
  timeout = 5000,
): Promise<void> {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const states = getStates();
    const firstState = JSON.stringify(states[0]);

    if (states.every((s) => JSON.stringify(s) === firstState)) {
      return;
    }

    await wait(50);
  }

  throw new Error("States did not converge within timeout");
}

/**
 * Create a test state with default values
 */
export function createTestState(overrides?: Partial<TestState>): TestState {
  return {
    counter: 0,
    value: 0,
    players: [],
    turn: 1,
    battlefield: [],
    hand: [],
    graveyard: [],
    ...overrides,
  };
}

/**
 * Compare two states for deep equality
 */
export function areStatesEqual<T>(state1: T, state2: T): boolean {
  return JSON.stringify(state1) === JSON.stringify(state2);
}

/**
 * Generate a random game state for testing
 */
export function generateRandomGameState(): TestState {
  return {
    counter: Math.floor(Math.random() * 100),
    value: Math.floor(Math.random() * 1000),
    players: [
      { id: "p1", name: "Player 1", life: 20 },
      { id: "p2", name: "Player 2", life: 20 },
    ],
    turn: Math.floor(Math.random() * 10) + 1,
    battlefield: [],
    hand: [],
    graveyard: [],
  };
}

/**
 * Create a mock card for testing
 */
export function createMockCard(id: string, overrides?: any) {
  return {
    id,
    name: `Card ${id}`,
    zone: "hand",
    tapped: false,
    counters: {},
    ...overrides,
  };
}

/**
 * Create multiple mock clients for testing
 */
export function createMockClientIds(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `client${i + 1}`);
}

/**
 * Measure execution time of a function
 */
export async function measureTime<T>(
  fn: () => T | Promise<T>,
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  return { result, duration };
}

/**
 * Run a function multiple times and return average duration
 */
export async function benchmark(
  fn: () => void | Promise<void>,
  iterations: number,
): Promise<number> {
  const durations: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const { duration } = await measureTime(fn);
    durations.push(duration);
  }

  return durations.reduce((a, b) => a + b, 0) / durations.length;
}

/**
 * Create a delayed promise (for simulating async operations)
 */
export function delay<T>(ms: number, value?: T): Promise<T | undefined> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/**
 * Check if two vector clocks are concurrent
 */
export function areConcurrent(
  v1: Record<string, number>,
  v2: Record<string, number>,
): boolean {
  let v1Greater = false;
  let v2Greater = false;

  const allClients = new Set([...Object.keys(v1), ...Object.keys(v2)]);

  for (const clientId of allClients) {
    const t1 = v1[clientId] || 0;
    const t2 = v2[clientId] || 0;

    if (t1 > t2) v1Greater = true;
    if (t2 > t1) v2Greater = true;
  }

  return v1Greater && v2Greater;
}

/**
 * Generate random operation data for chaos testing
 */
export function generateRandomOperation(clientId: string) {
  const operations = ["DRAW_CARD", "MOVE_CARD", "TAP_CARD", "UPDATE_COUNTER"];
  const type = operations[Math.floor(Math.random() * operations.length)];

  return {
    type,
    clientId,
    timestamp: Date.now(),
    data: {
      cardId: `card${Math.floor(Math.random() * 10)}`,
      playerId: `player${Math.floor(Math.random() * 2) + 1}`,
    },
  };
}
