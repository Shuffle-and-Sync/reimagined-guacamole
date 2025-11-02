/**
 * useGameState Hook
 *
 * Main hook for managing game state in remote TCG gameplay
 */

import { useState, useCallback, useEffect, useRef } from "react";
import {
  emitGameStateUpdate,
  initializeGame,
} from "../services/game-state-sync";
import type {
  GameState,
  PlayerState,
  UseGameStateOptions,
  LifeChangeUpdate,
  CommanderDamageUpdate,
  CounterChangeUpdate,
} from "../types/game-state.types";

const DEFAULT_STARTING_LIFE: Record<string, number> = {
  mtg: 20,
  commander: 40,
  pokemon: 60,
  yugioh: 8000,
  lorcana: 20,
};

export const useGameState = (options: UseGameStateOptions) => {
  const {
    gameId,
    roomId,
    userId,
    socket,
    gameType = "mtg",
    format = "casual",
    startingLifeTotal,
    playerNames = {},
  } = options;

  const initialLifeTotal =
    startingLifeTotal ||
    (format.toLowerCase() === "commander"
      ? 40
      : DEFAULT_STARTING_LIFE[gameType] || 20);

  const [gameState, setGameState] = useState<GameState>({
    gameId,
    roomId,
    gameType,
    format,
    players: {},
    currentTurn: "",
    turnNumber: 1,
    startingLifeTotal: initialLifeTotal,
    isGameActive: false,
  });

  const gameStateRef = useRef(gameState);

  // Keep ref in sync
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  /**
   * Initialize game with players
   */
  const startGame = useCallback(
    (playerIds: string[]) => {
      const players: Record<string, PlayerState> = {};

      playerIds.forEach((playerId) => {
        players[playerId] = {
          playerId,
          playerName: playerNames[playerId] || `Player ${playerId.slice(0, 6)}`,
          lifeTotal: initialLifeTotal,
          commanderDamage: {},
          poisonCounters: 0,
          energyCounters: 0,
          stormCount: 0,
          customCounters: {},
          isActive: false,
        };
      });

      const newGameState: GameState = {
        ...gameStateRef.current,
        players,
        currentTurn: playerIds[0] || "",
        turnNumber: 1,
        gameStartTime: new Date(),
        isGameActive: true,
      };

      setGameState(newGameState);
      initializeGame(socket, newGameState);

      emitGameStateUpdate(socket, {
        gameId,
        type: "game-start",
        timestamp: new Date(),
      });
    },
    [gameId, socket, initialLifeTotal, playerNames],
  );

  /**
   * Update player life total
   */
  const updateLife = useCallback(
    (playerId: string, delta: number) => {
      setGameState((prev) => {
        const player = prev.players[playerId];
        if (!player) return prev;

        const newTotal = Math.max(0, player.lifeTotal + delta);

        const update: LifeChangeUpdate = {
          playerId,
          delta,
          newTotal,
        };

        emitGameStateUpdate(socket, {
          gameId,
          type: "life-change",
          playerId,
          data: update,
          timestamp: new Date(),
        });

        return {
          ...prev,
          players: {
            ...prev.players,
            [playerId]: {
              ...player,
              lifeTotal: newTotal,
            },
          },
        };
      });
    },
    [gameId, socket],
  );

  /**
   * Update commander damage
   */
  const updateCommanderDamage = useCallback(
    (victimId: string, commanderId: string, delta: number) => {
      setGameState((prev) => {
        const victim = prev.players[victimId];
        if (!victim) return prev;

        const currentDamage = victim.commanderDamage?.[commanderId] || 0;
        const newTotal = Math.max(0, currentDamage + delta);

        const update: CommanderDamageUpdate = {
          victimId,
          commanderId,
          delta,
          newTotal,
        };

        emitGameStateUpdate(socket, {
          gameId,
          type: "commander-damage",
          playerId: victimId,
          data: update,
          timestamp: new Date(),
        });

        return {
          ...prev,
          players: {
            ...prev.players,
            [victimId]: {
              ...victim,
              commanderDamage: {
                ...victim.commanderDamage,
                [commanderId]: newTotal,
              },
            },
          },
        };
      });
    },
    [gameId, socket],
  );

  /**
   * Update counter (poison, energy, etc.)
   */
  const updateCounter = useCallback(
    (
      playerId: string,
      counterType: "poison" | "energy" | "storm",
      delta: number,
    ) => {
      setGameState((prev) => {
        const player = prev.players[playerId];
        if (!player) return prev;

        let newTotal = 0;
        const updatedPlayer = { ...player };

        if (counterType === "poison") {
          newTotal = Math.max(0, (player.poisonCounters || 0) + delta);
          updatedPlayer.poisonCounters = newTotal;
        } else if (counterType === "energy") {
          newTotal = Math.max(0, (player.energyCounters || 0) + delta);
          updatedPlayer.energyCounters = newTotal;
        } else if (counterType === "storm") {
          newTotal = Math.max(0, (player.stormCount || 0) + delta);
          updatedPlayer.stormCount = newTotal;
        }

        const update: CounterChangeUpdate = {
          playerId,
          counterType,
          delta,
          newTotal,
        };

        emitGameStateUpdate(socket, {
          gameId,
          type: "counter-change",
          playerId,
          data: update,
          timestamp: new Date(),
        });

        return {
          ...prev,
          players: {
            ...prev.players,
            [playerId]: updatedPlayer,
          },
        };
      });
    },
    [gameId, socket],
  );

  /**
   * Pass turn to next player
   */
  const passTurn = useCallback(() => {
    setGameState((prev) => {
      const playerIds = Object.keys(prev.players);
      if (playerIds.length === 0) return prev;

      const currentIndex = playerIds.indexOf(prev.currentTurn);
      const nextIndex = (currentIndex + 1) % playerIds.length;
      const nextPlayerId = playerIds[nextIndex];

      const newTurnNumber = prev.turnNumber + 1;

      emitGameStateUpdate(socket, {
        gameId,
        type: "turn-pass",
        data: {
          nextPlayer: nextPlayerId,
          turnNumber: newTurnNumber,
        },
        timestamp: new Date(),
      });

      return {
        ...prev,
        currentTurn: nextPlayerId,
        turnNumber: newTurnNumber,
        timerConfig: prev.timerConfig
          ? {
              ...prev.timerConfig,
              timeRemaining: prev.timerConfig.timePerTurn,
            }
          : undefined,
      };
    });
  }, [gameId, socket]);

  /**
   * End game
   */
  const endGame = useCallback(
    (winnerId?: string) => {
      setGameState((prev) => ({
        ...prev,
        isGameActive: false,
        gameEndTime: new Date(),
      }));

      emitGameStateUpdate(socket, {
        gameId,
        type: "game-end",
        playerId: winnerId,
        timestamp: new Date(),
      });
    },
    [gameId, socket],
  );

  /**
   * Listen for game state updates from other players
   */
  useEffect(() => {
    const handleGameStateUpdate = (update: any) => {
      if (update.gameId !== gameId) return;

      switch (update.type) {
        case "life-change": {
          const data = update.data as LifeChangeUpdate;
          setGameState((prev) => ({
            ...prev,
            players: {
              ...prev.players,
              [data.playerId]: {
                ...prev.players[data.playerId],
                lifeTotal: data.newTotal,
              },
            },
          }));
          break;
        }

        case "commander-damage": {
          const data = update.data as CommanderDamageUpdate;
          setGameState((prev) => ({
            ...prev,
            players: {
              ...prev.players,
              [data.victimId]: {
                ...prev.players[data.victimId],
                commanderDamage: {
                  ...prev.players[data.victimId].commanderDamage,
                  [data.commanderId]: data.newTotal,
                },
              },
            },
          }));
          break;
        }

        case "counter-change": {
          const data = update.data as CounterChangeUpdate;
          setGameState((prev) => {
            const player = prev.players[data.playerId];
            const updatedPlayer = { ...player };

            if (data.counterType === "poison") {
              updatedPlayer.poisonCounters = data.newTotal;
            } else if (data.counterType === "energy") {
              updatedPlayer.energyCounters = data.newTotal;
            } else if (data.counterType === "storm") {
              updatedPlayer.stormCount = data.newTotal;
            }

            return {
              ...prev,
              players: {
                ...prev.players,
                [data.playerId]: updatedPlayer,
              },
            };
          });
          break;
        }

        case "turn-pass": {
          const data = update.data as any;
          setGameState((prev) => ({
            ...prev,
            currentTurn: data.nextPlayer,
            turnNumber: data.turnNumber,
          }));
          break;
        }

        case "game-start": {
          // Game started by another player
          break;
        }

        case "game-end": {
          setGameState((prev) => ({
            ...prev,
            isGameActive: false,
            gameEndTime: new Date(),
          }));
          break;
        }
      }
    };

    socket.on("game-state-update", handleGameStateUpdate);

    return () => {
      socket.off("game-state-update", handleGameStateUpdate);
    };
  }, [gameId, socket]);

  return {
    gameState,
    startGame,
    updateLife,
    updateCommanderDamage,
    updateCounter,
    passTurn,
    endGame,
  };
};
