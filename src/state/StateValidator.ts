/**
 * StateValidator for validating game states
 *
 * Provides schema validation using Zod, state invariant checks,
 * and state migration system for version upgrades.
 */

import { z } from "zod";
import {
  GameState,
  ValidationResult,
  ValidationError,
  StateMigration,
} from "./types";

export class StateValidator<T = any> {
  private schema?: z.ZodSchema<T>;
  private invariants: Map<string, (state: T) => boolean>;
  private invariantMessages: Map<string, string>;
  private migrations: Map<number, StateMigration<T>>;
  private currentVersion: number;

  constructor(schema?: z.ZodSchema<T>) {
    this.schema = schema;
    this.invariants = new Map();
    this.invariantMessages = new Map();
    this.migrations = new Map();
    this.currentVersion = 1;
  }

  /**
   * Set the Zod schema for validation
   */
  setSchema(schema: z.ZodSchema<T>): void {
    this.schema = schema;
  }

  /**
   * Validate a game state
   */
  validate(state: GameState<T>): ValidationResult {
    const errors: ValidationError[] = [];

    // Schema validation
    if (this.schema) {
      const result = this.schema.safeParse(state.data);
      if (!result.success) {
        for (const issue of result.error.issues) {
          errors.push({
            path: issue.path.join("."),
            message: issue.message,
            code: issue.code,
          });
        }
      }
    }

    // Invariant checks
    for (const [name, invariant] of this.invariants.entries()) {
      try {
        if (!invariant(state.data)) {
          errors.push({
            path: "invariant." + name,
            message:
              this.invariantMessages.get(name) || `Invariant failed: ${name}`,
            code: "INVARIANT_VIOLATION",
          });
        }
      } catch (error) {
        errors.push({
          path: "invariant." + name,
          message: `Invariant check error: ${(error as Error).message}`,
          code: "INVARIANT_ERROR",
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Add a state invariant check
   */
  addInvariant(
    name: string,
    check: (state: T) => boolean,
    message?: string,
  ): void {
    this.invariants.set(name, check);
    if (message) {
      this.invariantMessages.set(name, message);
    }
  }

  /**
   * Remove an invariant check
   */
  removeInvariant(name: string): void {
    this.invariants.delete(name);
    this.invariantMessages.delete(name);
  }

  /**
   * List all invariants
   */
  listInvariants(): string[] {
    return Array.from(this.invariants.keys());
  }

  /**
   * Add a migration for a specific version
   */
  addMigration(version: number, migration: StateMigration<T>): void {
    this.migrations.set(version, migration);
  }

  /**
   * Migrate state to current version
   */
  migrate(state: T, fromVersion: number): T {
    let migratedState = state;

    // Apply migrations in order
    for (
      let version = fromVersion + 1;
      version <= this.currentVersion;
      version++
    ) {
      const migration = this.migrations.get(version);
      if (migration) {
        migratedState = migration(migratedState);
      }
    }

    return migratedState;
  }

  /**
   * Set current schema version
   */
  setCurrentVersion(version: number): void {
    this.currentVersion = version;
  }

  /**
   * Get current schema version
   */
  getCurrentVersion(): number {
    return this.currentVersion;
  }

  /**
   * Validate and migrate a state if needed
   */
  validateAndMigrate(
    state: GameState<T>,
    stateVersion?: number,
  ): { valid: boolean; errors: ValidationError[]; migratedState?: T } {
    let data = state.data;

    // Migrate if needed
    if (stateVersion !== undefined && stateVersion < this.currentVersion) {
      try {
        data = this.migrate(data, stateVersion);
      } catch (error) {
        return {
          valid: false,
          errors: [
            {
              path: "migration",
              message: `Migration failed: ${(error as Error).message}`,
              code: "MIGRATION_ERROR",
            },
          ],
        };
      }
    }

    // Validate migrated state
    const migratedState = { ...state, data };
    const validationResult = this.validate(migratedState);

    return {
      valid: validationResult.valid,
      errors: validationResult.errors,
      migratedState: data,
    };
  }
}

/**
 * Example validator factory for MTG game state
 */
export function createMTGStateValidator() {
  // Define MTG game state schema
  const playerSchema = z.object({
    id: z.string(),
    name: z.string(),
    life: z.number().min(0),
    poison: z.number().min(0).max(10).optional(),
  });

  const zoneSchema = z.object({
    id: z.string(),
    name: z.string(),
    cards: z.array(z.string()),
  });

  const mtgGameStateSchema = z.object({
    players: z.array(playerSchema),
    board: z.object({
      zones: z.record(z.string(), zoneSchema),
    }),
    turn: z.number().min(1),
    phase: z.string().optional(),
  });

  const validator = new StateValidator(mtgGameStateSchema);

  // Add invariants for MTG rules
  validator.addInvariant(
    "validPlayerCount",
    (state) => {
      const playerCount = state.players?.length || 0;
      return playerCount >= 2 && playerCount <= 8;
    },
    "Game must have between 2 and 8 players",
  );

  validator.addInvariant(
    "validTurn",
    (state) => state.turn >= 1,
    "Turn number must be at least 1",
  );

  validator.addInvariant(
    "noNegativeLife",
    (state) => state.players?.every((p: any) => p.life >= 0) ?? true,
    "Players cannot have negative life",
  );

  // Example migration: v1 to v2 (add poison counters)
  validator.addMigration(2, (state: any) => {
    return {
      ...state,
      players: state.players.map((p: any) => ({
        ...p,
        poison: p.poison || 0,
      })),
    };
  });

  return validator;
}
