/**
 * Unit tests for useGameState hook
 * Tests game state management, life tracking, and synchronization
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { useGameState } from "../hooks/useGameState";
import type { Socket } from "socket.io-client";

// Mock Socket.io
const createMockSocket = (): Socket => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listeners: Record<string, ((...args: any[]) => void)[]> = {};

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    on: (event: string, callback: (...args: any[]) => void) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(callback);
      return {} as Socket;
    },
    off: (event: string) => {
      delete listeners[event];
      return {} as Socket;
    },
    emit: vi.fn(),
    trigger: (event: string, ...args: unknown[]) => {
      listeners[event]?.forEach((cb) => cb(...args));
    },
  } as unknown as Socket;
};

describe("useGameState", () => {
  let mockSocket: Socket & {
    trigger: (event: string, ...args: unknown[]) => void;
  };

  beforeEach(() => {
    mockSocket = createMockSocket();
    vi.clearAllMocks();
  });

  it("should initialize with default game state", () => {
    const { result } = renderHook(() =>
      useGameState({
        gameId: "test-game",
        userId: "user-1",
        socket: mockSocket,
        format: "standard",
      }),
    );

    expect(result.current.gameState).toBeDefined();
    expect(result.current.gameState.gameId).toBe("test-game");
    expect(result.current.gameState.turnNumber).toBe(1);
  });

  it("should initialize players with correct starting life for standard", () => {
    const { result } = renderHook(() =>
      useGameState({
        gameId: "test-game",
        userId: "user-1",
        socket: mockSocket,
        format: "standard",
      }),
    );

    act(() => {
      result.current.initializeGame(["user-1", "user-2"], {
        "user-1": "Player 1",
        "user-2": "Player 2",
      });
    });

    expect(result.current.gameState.players["user-1"].lifeTotal).toBe(20);
    expect(result.current.gameState.players["user-2"].lifeTotal).toBe(20);
  });

  it("should initialize players with correct starting life for commander", () => {
    const { result } = renderHook(() =>
      useGameState({
        gameId: "test-game",
        userId: "user-1",
        socket: mockSocket,
        format: "commander",
      }),
    );

    act(() => {
      result.current.initializeGame(["user-1", "user-2"], {
        "user-1": "Player 1",
        "user-2": "Player 2",
      });
    });

    expect(result.current.gameState.players["user-1"].lifeTotal).toBe(40);
    expect(result.current.gameState.players["user-2"].lifeTotal).toBe(40);
  });

  it("should update life total", () => {
    const { result } = renderHook(() =>
      useGameState({
        gameId: "test-game",
        userId: "user-1",
        socket: mockSocket,
        format: "standard",
      }),
    );

    act(() => {
      result.current.initializeGame(["user-1", "user-2"], {
        "user-1": "Player 1",
        "user-2": "Player 2",
      });
    });

    act(() => {
      result.current.updateLife("user-1", -3);
    });

    expect(result.current.gameState.players["user-1"].lifeTotal).toBe(17);
    expect(mockSocket.emit).toHaveBeenCalledWith("game-state-update", {
      gameId: "test-game",
      type: "life-change",
      playerId: "user-1",
      delta: -3,
    });
  });

  it("should update commander damage", () => {
    const { result } = renderHook(() =>
      useGameState({
        gameId: "test-game",
        userId: "user-1",
        socket: mockSocket,
        format: "commander",
      }),
    );

    act(() => {
      result.current.initializeGame(["user-1", "user-2"], {
        "user-1": "Player 1",
        "user-2": "Player 2",
      });
    });

    act(() => {
      result.current.updateCommanderDamage("user-2", "user-1", 5);
    });

    expect(
      result.current.gameState.players["user-2"].commanderDamage?.["user-1"],
    ).toBe(5);
  });

  it("should pass turn to next player", () => {
    const { result } = renderHook(() =>
      useGameState({
        gameId: "test-game",
        userId: "user-1",
        socket: mockSocket,
        format: "standard",
      }),
    );

    act(() => {
      result.current.initializeGame(["user-1", "user-2", "user-3"], {
        "user-1": "Player 1",
        "user-2": "Player 2",
        "user-3": "Player 3",
      });
    });

    const initialTurn = result.current.gameState.currentTurn;

    act(() => {
      result.current.passTurn();
    });

    expect(result.current.gameState.currentTurn).not.toBe(initialTurn);
    expect(result.current.gameState.turnNumber).toBe(2);
  });

  it("should update poison counters", () => {
    const { result } = renderHook(() =>
      useGameState({
        gameId: "test-game",
        userId: "user-1",
        socket: mockSocket,
        format: "standard",
      }),
    );

    act(() => {
      result.current.initializeGame(["user-1", "user-2"], {
        "user-1": "Player 1",
        "user-2": "Player 2",
      });
    });

    act(() => {
      result.current.updateCounter("user-1", "poison", 3);
    });

    expect(result.current.gameState.players["user-1"].poisonCounters).toBe(3);
  });

  it("should handle remote state updates", () => {
    const { result } = renderHook(() =>
      useGameState({
        gameId: "test-game",
        userId: "user-1",
        socket: mockSocket,
        format: "standard",
      }),
    );

    act(() => {
      result.current.initializeGame(["user-1", "user-2"], {
        "user-1": "Player 1",
        "user-2": "Player 2",
      });
    });

    act(() => {
      mockSocket.trigger("game-state-update", {
        gameId: "test-game",
        type: "life-change",
        playerId: "user-2",
        delta: -5,
      });
    });

    waitFor(() => {
      expect(result.current.gameState.players["user-2"].lifeTotal).toBe(15);
    });
  });

  it("should end game", () => {
    const { result } = renderHook(() =>
      useGameState({
        gameId: "test-game",
        userId: "user-1",
        socket: mockSocket,
        format: "standard",
      }),
    );

    act(() => {
      result.current.initializeGame(["user-1", "user-2"], {
        "user-1": "Player 1",
        "user-2": "Player 2",
      });
    });

    act(() => {
      result.current.endGame();
    });

    expect(mockSocket.emit).toHaveBeenCalledWith("end-game", {
      gameId: "test-game",
    });
  });
});
