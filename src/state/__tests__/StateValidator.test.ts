/**
 * StateValidator Tests
 *
 * Tests for state validation, invariant checks, and migrations.
 */

import { describe, test, expect, beforeEach } from "@jest/globals";
import { z } from "zod";
import { StateManager } from "../StateManager";
import { StateValidator, createMTGStateValidator } from "../StateValidator";

interface TestGameState {
  players: Array<{ id: string; name: string; life: number }>;
  turn: number;
  phase?: string;
}

describe("StateValidator", () => {
  let validator: StateValidator<TestGameState>;
  let stateManager: StateManager<TestGameState>;

  beforeEach(() => {
    const schema = z.object({
      players: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          life: z.number().min(0),
        }),
      ),
      turn: z.number().min(1),
      phase: z.string().optional(),
    });

    validator = new StateValidator<TestGameState>(schema);
    stateManager = new StateManager<TestGameState>("test-client");
  });

  describe("schema validation", () => {
    test("should validate valid state", () => {
      const data: TestGameState = {
        players: [{ id: "p1", name: "Alice", life: 20 }],
        turn: 1,
      };

      const state = stateManager.createState(data);
      const result = validator.validate(state);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test("should detect invalid field types", () => {
      const data: any = {
        players: [{ id: "p1", name: "Alice", life: "invalid" }],
        turn: 1,
      };

      const state = stateManager.createState(data);
      const result = validator.validate(state);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test("should detect missing required fields", () => {
      const data: any = {
        players: [{ id: "p1", name: "Alice" }], // missing life
        turn: 1,
      };

      const state = stateManager.createState(data);
      const result = validator.validate(state);

      expect(result.valid).toBe(false);
    });

    test("should detect constraint violations", () => {
      const data: TestGameState = {
        players: [{ id: "p1", name: "Alice", life: -5 }], // negative life
        turn: 1,
      };

      const state = stateManager.createState(data);
      const result = validator.validate(state);

      expect(result.valid).toBe(false);
    });
  });

  describe("invariant checks", () => {
    test("should pass when all invariants hold", () => {
      validator.addInvariant(
        "validPlayerCount",
        (state) => state.players.length >= 2 && state.players.length <= 4,
      );

      const data: TestGameState = {
        players: [
          { id: "p1", name: "Alice", life: 20 },
          { id: "p2", name: "Bob", life: 20 },
        ],
        turn: 1,
      };

      const state = stateManager.createState(data);
      const result = validator.validate(state);

      expect(result.valid).toBe(true);
    });

    test("should fail when invariant is violated", () => {
      validator.addInvariant(
        "validPlayerCount",
        (state) => state.players.length >= 2,
        "Must have at least 2 players",
      );

      const data: TestGameState = {
        players: [{ id: "p1", name: "Alice", life: 20 }],
        turn: 1,
      };

      const state = stateManager.createState(data);
      const result = validator.validate(state);

      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e) => e.path.includes("validPlayerCount")),
      ).toBe(true);
    });

    test("should support multiple invariants", () => {
      validator.addInvariant(
        "validPlayerCount",
        (state) => state.players.length >= 2,
      );
      validator.addInvariant("validTurn", (state) => state.turn >= 1);

      const data: TestGameState = {
        players: [{ id: "p1", name: "Alice", life: 20 }],
        turn: 0,
      };

      const state = stateManager.createState(data);
      const result = validator.validate(state);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });

    test("should handle invariant check errors gracefully", () => {
      validator.addInvariant("throwsError", () => {
        throw new Error("Invariant check failed");
      });

      const data: TestGameState = {
        players: [],
        turn: 1,
      };

      const state = stateManager.createState(data);
      const result = validator.validate(state);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "INVARIANT_ERROR")).toBe(
        true,
      );
    });
  });

  describe("invariant management", () => {
    test("should list all invariants", () => {
      validator.addInvariant("inv1", () => true);
      validator.addInvariant("inv2", () => true);

      const invariants = validator.listInvariants();

      expect(invariants).toHaveLength(2);
      expect(invariants).toContain("inv1");
      expect(invariants).toContain("inv2");
    });

    test("should remove invariants", () => {
      validator.addInvariant("inv1", () => false);

      validator.removeInvariant("inv1");

      const data: TestGameState = {
        players: [],
        turn: 1,
      };

      const state = stateManager.createState(data);
      const result = validator.validate(state);

      expect(result.valid).toBe(true);
    });
  });

  describe("state migrations", () => {
    test("should migrate state through single version", () => {
      validator.setCurrentVersion(2);
      validator.addMigration(2, (state: any) => {
        return {
          ...state,
          phase: "main", // Add phase field
        };
      });

      const oldState: any = {
        players: [],
        turn: 1,
      };

      const migrated = validator.migrate(oldState, 1);

      expect(migrated.phase).toBe("main");
    });

    test("should migrate through multiple versions", () => {
      validator.setCurrentVersion(3);

      validator.addMigration(2, (state: any) => ({
        ...state,
        phase: "main",
      }));

      validator.addMigration(3, (state: any) => ({
        ...state,
        turn: state.turn + 1, // Increment turn
      }));

      const oldState: any = {
        players: [],
        turn: 1,
      };

      const migrated = validator.migrate(oldState, 1);

      expect(migrated.phase).toBe("main");
      expect(migrated.turn).toBe(2);
    });

    test("should skip unnecessary migrations", () => {
      validator.setCurrentVersion(3);

      validator.addMigration(2, (state: any) => ({
        ...state,
        migrated: true,
      }));

      const currentState: any = {
        players: [],
        turn: 1,
      };

      // Already at version 3
      const migrated = validator.migrate(currentState, 3);

      expect(migrated).toEqual(currentState);
      expect((migrated as any).migrated).toBeUndefined();
    });
  });

  describe("validateAndMigrate", () => {
    test("should validate without migration if versions match", () => {
      const data: TestGameState = {
        players: [{ id: "p1", name: "Alice", life: 20 }],
        turn: 1,
      };

      const state = stateManager.createState(data);
      const result = validator.validateAndMigrate(state, 1);

      expect(result.valid).toBe(true);
      expect(result.migratedState).toEqual(data);
    });

    test("should migrate and validate old state", () => {
      validator.setCurrentVersion(2);
      validator.addMigration(2, (state: any) => ({
        ...state,
        phase: "main",
      }));

      const data: any = {
        players: [{ id: "p1", name: "Alice", life: 20 }],
        turn: 1,
      };

      const state = stateManager.createState(data);
      const result = validator.validateAndMigrate(state, 1);

      expect(result.valid).toBe(true);
      expect(result.migratedState?.phase).toBe("main");
    });

    test("should handle migration errors", () => {
      validator.setCurrentVersion(2);
      validator.addMigration(2, () => {
        throw new Error("Migration failed");
      });

      const data: TestGameState = {
        players: [],
        turn: 1,
      };

      const state = stateManager.createState(data);
      const result = validator.validateAndMigrate(state, 1);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "MIGRATION_ERROR")).toBe(
        true,
      );
    });
  });

  describe("version management", () => {
    test("should get and set current version", () => {
      validator.setCurrentVersion(5);
      expect(validator.getCurrentVersion()).toBe(5);
    });
  });
});

describe("createMTGStateValidator", () => {
  test("should create MTG validator with schema", () => {
    const validator = createMTGStateValidator();

    const data: any = {
      players: [
        { id: "p1", name: "Alice", life: 20, poison: 0 },
        { id: "p2", name: "Bob", life: 20, poison: 0 },
      ],
      board: { zones: {} },
      turn: 1,
    };

    const stateManager = new StateManager("test-client");
    const state = stateManager.createState(data);
    const result = validator.validate(state);

    expect(result.valid).toBe(true);
  });

  test("should enforce MTG-specific invariants", () => {
    const validator = createMTGStateValidator();

    // Invalid player count
    const data: any = {
      players: [{ id: "p1", name: "Alice", life: 20 }],
      board: { zones: {} },
      turn: 1,
    };

    const stateManager = new StateManager("test-client");
    const state = stateManager.createState(data);
    const result = validator.validate(state);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.path.includes("validPlayerCount"))).toBe(
      true,
    );
  });

  test("should include poison counter migration", () => {
    const validator = createMTGStateValidator();
    validator.setCurrentVersion(2);

    const oldState: any = {
      players: [
        { id: "p1", name: "Alice", life: 20 },
        { id: "p2", name: "Bob", life: 20 },
      ],
      board: { zones: {} },
      turn: 1,
    };

    const migrated = validator.migrate(oldState, 1);

    expect(migrated.players[0].poison).toBe(0);
    expect(migrated.players[1].poison).toBe(0);
  });
});
