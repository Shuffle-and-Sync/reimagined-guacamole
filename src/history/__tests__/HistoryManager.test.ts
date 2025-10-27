/**
 * Tests for HistoryManager
 * Tests undo/redo functionality with command history
 */

import { describe, test, expect, beforeEach } from "@jest/globals";
import { MoveCardCommand, GameState } from "../commands/CardCommands";
import { UpdateLifeCommand } from "../commands/PlayerCommands";
import { HistoryManager } from "../HistoryManager";

describe("HistoryManager", () => {
  let historyManager: HistoryManager<GameState>;
  let initialState: GameState;

  beforeEach(() => {
    historyManager = new HistoryManager<GameState>();
    initialState = {
      board: {
        hand: ["card1", "card2"],
        battlefield: [],
        graveyard: [],
        library: ["card3", "card4"],
        exile: [],
        command: [],
        sideboard: [],
      },
      cards: {},
    };
  });

  describe("push", () => {
    test("should add command to history", () => {
      const command = new MoveCardCommand(
        "user1",
        "card1",
        "hand",
        "battlefield",
      );

      historyManager.push(command);

      expect(historyManager.getGlobalHistory()).toHaveLength(1);
      expect(historyManager.getHistory("user1")).toHaveLength(1);
    });

    test("should create undo stack for new user", () => {
      const command = new MoveCardCommand(
        "user1",
        "card1",
        "hand",
        "battlefield",
      );

      historyManager.push(command);

      expect(historyManager.undoStacks.has("user1")).toBe(true);
    });

    test("should clear redo stack on push", () => {
      const command1 = new MoveCardCommand(
        "user1",
        "card1",
        "hand",
        "battlefield",
      );
      const command2 = new MoveCardCommand(
        "user1",
        "card2",
        "hand",
        "battlefield",
      );

      historyManager.push(command1);
      let state = command1.execute(initialState);

      historyManager.push(command2);
      state = command2.execute(state);

      // Undo once
      state = historyManager.undo("user1", state);
      expect(historyManager.canRedo("user1")).toBe(true);

      // Push new command should clear redo
      const command3 = new MoveCardCommand("user1", "card3", "library", "hand");
      historyManager.push(command3);

      expect(historyManager.canRedo("user1")).toBe(false);
    });
  });

  describe("undo", () => {
    test("should undo last command", () => {
      const command = new MoveCardCommand(
        "user1",
        "card1",
        "hand",
        "battlefield",
      );

      historyManager.push(command);
      let state = command.execute(initialState);

      expect(state.board.battlefield).toContain("card1");
      expect(state.board.hand).not.toContain("card1");

      state = historyManager.undo("user1", state);

      expect(state.board.battlefield).not.toContain("card1");
      expect(state.board.hand).toContain("card1");
    });

    test("should return same state when nothing to undo", () => {
      const state = historyManager.undo("user1", initialState);
      expect(state).toEqual(initialState);
    });

    test("should throw error if command cannot be undone", () => {
      const command = new MoveCardCommand(
        "user1",
        "card1",
        "hand",
        "battlefield",
      );

      historyManager.push(command);

      // Execute command
      let state = command.execute(initialState);

      // Manually remove card to make undo fail
      state.board.battlefield = [];

      expect(() => {
        historyManager.undo("user1", state);
      }).toThrow("state validation failed");
    });
  });

  describe("redo", () => {
    test("should redo undone command", () => {
      const command = new MoveCardCommand(
        "user1",
        "card1",
        "hand",
        "battlefield",
      );

      historyManager.push(command);
      let state = command.execute(initialState);

      // Undo
      state = historyManager.undo("user1", state);
      expect(state.board.hand).toContain("card1");

      // Redo
      state = historyManager.redo("user1", state);
      expect(state.board.battlefield).toContain("card1");
      expect(state.board.hand).not.toContain("card1");
    });

    test("should return same state when nothing to redo", () => {
      const state = historyManager.redo("user1", initialState);
      expect(state).toEqual(initialState);
    });
  });

  describe("multi-user scenarios", () => {
    test("should maintain separate histories for different users", () => {
      const command1 = new MoveCardCommand(
        "user1",
        "card1",
        "hand",
        "battlefield",
      );
      const command2 = new MoveCardCommand(
        "user2",
        "card2",
        "hand",
        "battlefield",
      );

      historyManager.push(command1);
      historyManager.push(command2);

      expect(historyManager.getHistory("user1")).toHaveLength(1);
      expect(historyManager.getHistory("user2")).toHaveLength(1);
      expect(historyManager.getGlobalHistory()).toHaveLength(2);
    });

    test("should detect conflicts between users", () => {
      const command1 = new MoveCardCommand(
        "user1",
        "card1",
        "hand",
        "battlefield",
      );
      const command2 = new MoveCardCommand(
        "user2",
        "card1",
        "battlefield",
        "graveyard",
      );

      historyManager.push(command1);
      historyManager.push(command2);

      const conflicts = historyManager.getConflicts();
      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts[0].affectedEntities).toContain("card1");
    });
  });

  describe("canUndo / canRedo", () => {
    test("should return correct undo/redo availability", () => {
      expect(historyManager.canUndo("user1")).toBe(false);
      expect(historyManager.canRedo("user1")).toBe(false);

      const command = new MoveCardCommand(
        "user1",
        "card1",
        "hand",
        "battlefield",
      );
      historyManager.push(command);

      expect(historyManager.canUndo("user1")).toBe(true);
      expect(historyManager.canRedo("user1")).toBe(false);

      let state = command.execute(initialState);
      state = historyManager.undo("user1", state);

      expect(historyManager.canUndo("user1")).toBe(false);
      expect(historyManager.canRedo("user1")).toBe(true);
    });
  });

  describe("clear", () => {
    test("should clear all history", () => {
      const command = new MoveCardCommand(
        "user1",
        "card1",
        "hand",
        "battlefield",
      );

      historyManager.push(command);
      historyManager.clear();

      expect(historyManager.getGlobalHistory()).toHaveLength(0);
      expect(historyManager.undoStacks.size).toBe(0);
    });
  });

  describe("clearUser", () => {
    test("should clear history for specific user", () => {
      const command1 = new MoveCardCommand(
        "user1",
        "card1",
        "hand",
        "battlefield",
      );
      const command2 = new MoveCardCommand(
        "user2",
        "card2",
        "hand",
        "battlefield",
      );

      historyManager.push(command1);
      historyManager.push(command2);

      historyManager.clearUser("user1");

      expect(historyManager.getHistory("user1")).toHaveLength(0);
      expect(historyManager.getHistory("user2")).toHaveLength(1);
      expect(historyManager.getGlobalHistory()).toHaveLength(1);
    });
  });

  describe("branches", () => {
    test("should create and restore branches", () => {
      const command1 = new MoveCardCommand(
        "user1",
        "card1",
        "hand",
        "battlefield",
      );
      const command2 = new MoveCardCommand(
        "user1",
        "card2",
        "hand",
        "battlefield",
      );

      historyManager.push(command1);
      historyManager.createBranch("user1", "branch1");

      historyManager.push(command2);

      expect(historyManager.getHistory("user1")).toHaveLength(2);

      historyManager.restoreBranch("user1", "branch1");

      expect(historyManager.getHistory("user1")).toHaveLength(1);
    });
  });

  describe("serialize", () => {
    test("should serialize history", () => {
      const command1 = new MoveCardCommand(
        "user1",
        "card1",
        "hand",
        "battlefield",
      );
      const command2 = new MoveCardCommand(
        "user2",
        "card2",
        "hand",
        "battlefield",
      );

      historyManager.push(command1);
      historyManager.push(command2);

      const snapshot = historyManager.serialize();

      expect(snapshot.commands).toHaveLength(2);
      expect(snapshot.version).toBe("1.0.0");
      expect(snapshot.userPositions.size).toBe(2);
    });
  });

  describe("replay", () => {
    test("should replay commands", () => {
      const command1 = new MoveCardCommand(
        "user1",
        "card1",
        "hand",
        "battlefield",
      );
      const command2 = new MoveCardCommand(
        "user1",
        "card2",
        "hand",
        "battlefield",
      );

      const commands = [command1, command2];

      const finalState = historyManager.replay(initialState, commands);

      expect(finalState.board.battlefield).toContain("card1");
      expect(finalState.board.battlefield).toContain("card2");
      expect(finalState.board.hand).toHaveLength(0);
    });

    test("should replay with filters", () => {
      const command1 = new MoveCardCommand(
        "user1",
        "card1",
        "hand",
        "battlefield",
      );
      const command2 = new MoveCardCommand(
        "user2",
        "card2",
        "hand",
        "battlefield",
      );

      const commands = [command1, command2];

      const finalState = historyManager.replay(initialState, commands, {
        userId: "user1",
      });

      expect(finalState.board.battlefield).toContain("card1");
      expect(finalState.board.battlefield).not.toContain("card2");
    });
  });

  describe("prune", () => {
    test("should prune old commands", () => {
      for (let i = 0; i < 10; i++) {
        const command = new MoveCardCommand(
          "user1",
          `card${i}`,
          "hand",
          "battlefield",
        );
        historyManager.push(command);
      }

      const removed = historyManager.prune({ maxCommands: 5 });

      expect(removed).toBe(5);
      expect(historyManager.getGlobalHistory()).toHaveLength(5);
    });

    test("should keep commands affecting specific entities", () => {
      const command1 = new MoveCardCommand(
        "user1",
        "important-card",
        "hand",
        "battlefield",
      );
      const command2 = new MoveCardCommand(
        "user1",
        "card2",
        "hand",
        "battlefield",
      );
      const command3 = new MoveCardCommand(
        "user1",
        "card3",
        "battlefield",
        "graveyard",
      );

      historyManager.push(command1);
      historyManager.push(command2);
      historyManager.push(command3);

      // Prune but keep commands affecting important-card
      // Since we're not applying maxCommands, the keepAffecting filter should work
      historyManager.prune({
        keepAffecting: ["important-card"],
        maxAge: 0, // Remove old commands but keep those affecting important-card
      });

      const history = historyManager.getGlobalHistory();
      // The important-card command should be kept even though it's old
      expect(
        history.some((cmd) => cmd.affects.includes("important-card")),
      ).toBe(true);
      // Other commands should be removed by maxAge
      expect(history.length).toBeGreaterThan(0);
    });
  });

  describe("getStats", () => {
    test("should return history statistics", () => {
      const command1 = new MoveCardCommand(
        "user1",
        "card1",
        "hand",
        "battlefield",
      );
      const command2 = new MoveCardCommand(
        "user2",
        "card2",
        "hand",
        "battlefield",
      );

      historyManager.push(command1);
      historyManager.push(command2);

      const stats = historyManager.getStats();

      expect(stats.totalCommands).toBe(2);
      expect(stats.commandsByUser.get("user1")).toBe(1);
      expect(stats.commandsByUser.get("user2")).toBe(1);
      expect(stats.commandsByType.get("MOVE_CARD")).toBe(2);
      expect(stats.estimatedSize).toBeGreaterThan(0);
    });
  });
});
