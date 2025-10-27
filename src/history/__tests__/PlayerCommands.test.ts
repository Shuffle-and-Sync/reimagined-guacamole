/**
 * Tests for Player Commands
 */

import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  UpdateLifeCommand,
  UpdatePoisonCommand,
  UpdateEnergyCommand,
  AddPlayerCommand,
  RemovePlayerCommand,
  GameStateWithPlayers,
  PlayerState,
} from "../commands/PlayerCommands";

describe("PlayerCommands", () => {
  let initialState: GameStateWithPlayers;

  beforeEach(() => {
    initialState = {
      players: {
        player1: {
          id: "player1",
          name: "Alice",
          life: 20,
          poison: 0,
          energy: 0,
        },
        player2: {
          id: "player2",
          name: "Bob",
          life: 20,
          poison: 0,
          energy: 0,
        },
      },
    };
  });

  describe("UpdateLifeCommand", () => {
    test("should update player life", () => {
      const command = new UpdateLifeCommand("user1", "player1", -3);

      const newState = command.execute(initialState);

      expect(newState.players.player1.life).toBe(17);
    });

    test("should increase life with positive delta", () => {
      const command = new UpdateLifeCommand("user1", "player1", 5);

      const newState = command.execute(initialState);

      expect(newState.players.player1.life).toBe(25);
    });

    test("should undo life change", () => {
      const command = new UpdateLifeCommand("user1", "player1", -3);

      const newState = command.execute(initialState);
      const undoneState = command.undo(newState);

      expect(undoneState.players.player1.life).toBe(20);
    });

    test("should throw error for non-existent player", () => {
      const command = new UpdateLifeCommand("user1", "nonexistent", -3);

      expect(() => {
        command.execute(initialState);
      }).toThrow("Player not found");
    });

    test("should validate state after execution", () => {
      const command = new UpdateLifeCommand("user1", "player1", -3);

      const newState = command.execute(initialState);

      expect(command.canUndo(newState)).toBe(true);
    });
  });

  describe("UpdatePoisonCommand", () => {
    test("should add poison counters", () => {
      const command = new UpdatePoisonCommand("user1", "player1", 2);

      const newState = command.execute(initialState);

      expect(newState.players.player1.poison).toBe(2);
    });

    test("should accumulate poison counters", () => {
      const stateWithPoison = {
        ...initialState,
        players: {
          ...initialState.players,
          player1: { ...initialState.players.player1, poison: 3 },
        },
      };

      const command = new UpdatePoisonCommand("user1", "player1", 2);

      const newState = command.execute(stateWithPoison);

      expect(newState.players.player1.poison).toBe(5);
    });

    test("should undo poison addition", () => {
      const command = new UpdatePoisonCommand("user1", "player1", 2);

      const newState = command.execute(initialState);
      const undoneState = command.undo(newState);

      expect(undoneState.players.player1.poison).toBe(0);
    });

    test("should remove poison counters with negative delta", () => {
      const stateWithPoison = {
        ...initialState,
        players: {
          ...initialState.players,
          player1: { ...initialState.players.player1, poison: 5 },
        },
      };

      const command = new UpdatePoisonCommand("user1", "player1", -2);

      const newState = command.execute(stateWithPoison);

      expect(newState.players.player1.poison).toBe(3);
    });
  });

  describe("UpdateEnergyCommand", () => {
    test("should add energy", () => {
      const command = new UpdateEnergyCommand("user1", "player1", 3);

      const newState = command.execute(initialState);

      expect(newState.players.player1.energy).toBe(3);
    });

    test("should accumulate energy", () => {
      const stateWithEnergy = {
        ...initialState,
        players: {
          ...initialState.players,
          player1: { ...initialState.players.player1, energy: 2 },
        },
      };

      const command = new UpdateEnergyCommand("user1", "player1", 3);

      const newState = command.execute(stateWithEnergy);

      expect(newState.players.player1.energy).toBe(5);
    });

    test("should undo energy change", () => {
      const command = new UpdateEnergyCommand("user1", "player1", 3);

      const newState = command.execute(initialState);
      const undoneState = command.undo(newState);

      expect(undoneState.players.player1.energy).toBe(0);
    });

    test("should spend energy with negative delta", () => {
      const stateWithEnergy = {
        ...initialState,
        players: {
          ...initialState.players,
          player1: { ...initialState.players.player1, energy: 5 },
        },
      };

      const command = new UpdateEnergyCommand("user1", "player1", -2);

      const newState = command.execute(stateWithEnergy);

      expect(newState.players.player1.energy).toBe(3);
    });
  });

  describe("AddPlayerCommand", () => {
    test("should add new player", () => {
      const newPlayer: PlayerState = {
        id: "player3",
        name: "Charlie",
        life: 20,
        poison: 0,
        energy: 0,
      };

      const command = new AddPlayerCommand("user1", newPlayer);

      const newState = command.execute(initialState);

      expect(newState.players.player3).toBeDefined();
      expect(newState.players.player3.name).toBe("Charlie");
    });

    test("should undo player addition", () => {
      const newPlayer: PlayerState = {
        id: "player3",
        name: "Charlie",
        life: 20,
        poison: 0,
        energy: 0,
      };

      const command = new AddPlayerCommand("user1", newPlayer);

      const newState = command.execute(initialState);
      const undoneState = command.undo(newState);

      expect(undoneState.players.player3).toBeUndefined();
    });

    test("should throw error if player already exists", () => {
      const existingPlayer: PlayerState = {
        id: "player1",
        name: "Alice",
        life: 20,
      };

      const command = new AddPlayerCommand("user1", existingPlayer);

      expect(() => {
        command.execute(initialState);
      }).toThrow("Player already exists");
    });

    test("should create players object if not exists", () => {
      const emptyState: GameStateWithPlayers = {
        players: {},
      };

      const newPlayer: PlayerState = {
        id: "player1",
        name: "Alice",
        life: 20,
      };

      const command = new AddPlayerCommand("user1", newPlayer);

      const newState = command.execute(emptyState);

      expect(newState.players.player1).toBeDefined();
    });
  });

  describe("RemovePlayerCommand", () => {
    test("should remove player", () => {
      const command = new RemovePlayerCommand("user1", "player2");

      const newState = command.execute(initialState);

      expect(newState.players.player2).toBeUndefined();
    });

    test("should undo player removal", () => {
      const command = new RemovePlayerCommand("user1", "player2");

      const newState = command.execute(initialState);
      const undoneState = command.undo(newState);

      expect(undoneState.players.player2).toBeDefined();
      expect(undoneState.players.player2.name).toBe("Bob");
    });

    test("should throw error for non-existent player", () => {
      const command = new RemovePlayerCommand("user1", "nonexistent");

      expect(() => {
        command.execute(initialState);
      }).toThrow("Player not found");
    });

    test("should validate state after removal", () => {
      const command = new RemovePlayerCommand("user1", "player2");

      const newState = command.execute(initialState);

      expect(command.canUndo(newState)).toBe(true);
    });
  });

  describe("Command serialization", () => {
    test("should serialize life command", () => {
      const command = new UpdateLifeCommand("user1", "player1", -3);

      const serialized = command.serialize();

      expect(serialized.type).toBe("UPDATE_LIFE");
      expect(serialized.userId).toBe("user1");
      expect(serialized.affects).toContain("player1");
    });

    test("should serialize add player command", () => {
      const newPlayer: PlayerState = {
        id: "player3",
        name: "Charlie",
        life: 20,
      };

      const command = new AddPlayerCommand("user1", newPlayer);

      const serialized = command.serialize();

      expect(serialized.type).toBe("ADD_PLAYER");
      expect(serialized.affects).toContain("player3");
    });
  });
});
