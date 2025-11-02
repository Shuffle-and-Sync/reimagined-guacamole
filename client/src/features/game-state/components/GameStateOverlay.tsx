/**
 * GameStateOverlay Component
 *
 * Main overlay container for game state tracking
 */

import { X, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CommanderDamageTracker } from "./CommanderDamageTracker";
import { CounterDisplay } from "./CounterDisplay";
import { LifeCounter } from "./LifeCounter";
import { TurnManagement } from "./TurnManagement";
import type { GameState } from "../types/game-state.types";

interface GameStateOverlayProps {
  gameState: GameState;
  userId: string;
  onClose: () => void;
  onLifeChange: (playerId: string, delta: number) => void;
  onCommanderDamageChange: (
    victimId: string,
    commanderId: string,
    delta: number,
  ) => void;
  onCounterChange: (
    playerId: string,
    counterType: "poison" | "energy" | "storm",
    delta: number,
  ) => void;
  onPassTurn: () => void;
}

export function GameStateOverlay({
  gameState,
  userId,
  onClose,
  onLifeChange,
  onCommanderDamageChange,
  onCounterChange,
  onPassTurn,
}: GameStateOverlayProps) {
  const players = Object.values(gameState.players);
  const localPlayer = gameState.players[userId];
  const currentPlayer = gameState.players[gameState.currentTurn];

  // Get commanders (for Commander format)
  const commanders = players
    .filter((p) => p.playerId !== userId)
    .map((p) => ({
      id: p.playerId,
      name: p.playerName,
    }));

  const isCommanderFormat =
    gameState.format?.toLowerCase() === "commander" ||
    gameState.format?.toLowerCase() === "edh";

  return (
    <Card className="fixed top-4 left-4 w-96 max-h-[90vh] shadow-2xl z-50 bg-white dark:bg-gray-900">
      <div className="relative p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Game State</h2>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon">
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {gameState.format} • {gameState.gameType.toUpperCase()}
        </p>
      </div>

      <ScrollArea className="h-[calc(90vh-100px)]">
        <div className="p-4 space-y-4">
          {/* Turn Management */}
          {currentPlayer && (
            <TurnManagement
              currentPlayerName={currentPlayer.playerName}
              turnNumber={gameState.turnNumber}
              isLocalPlayerTurn={gameState.currentTurn === userId}
              onPassTurn={onPassTurn}
            />
          )}

          {/* Life Counters */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Life Totals</h3>
            {players.map((player) => (
              <LifeCounter
                key={player.playerId}
                player={player}
                onLifeChange={(delta) => onLifeChange(player.playerId, delta)}
                isCurrentPlayer={player.playerId === gameState.currentTurn}
                isLocalPlayer={player.playerId === userId}
              />
            ))}
          </div>

          {/* Commander Damage (if Commander format) */}
          {isCommanderFormat && localPlayer && commanders.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">
                Commander Damage
              </h3>
              <CommanderDamageTracker
                player={localPlayer}
                commanders={commanders}
                onDamageChange={(commanderId, delta) =>
                  onCommanderDamageChange(userId, commanderId, delta)
                }
              />
            </div>
          )}

          {/* Additional Counters */}
          {localPlayer && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Counters</h3>
              <div className="grid grid-cols-2 gap-2">
                <CounterDisplay
                  label="Poison"
                  value={localPlayer.poisonCounters || 0}
                  icon="☠️"
                  color="text-purple-600"
                  onIncrement={() => onCounterChange(userId, "poison", 1)}
                  onDecrement={() => onCounterChange(userId, "poison", -1)}
                  dangerThreshold={10}
                  warningThreshold={7}
                />
                <CounterDisplay
                  label="Energy"
                  value={localPlayer.energyCounters || 0}
                  icon="⚡"
                  color="text-yellow-600"
                  onIncrement={() => onCounterChange(userId, "energy", 1)}
                  onDecrement={() => onCounterChange(userId, "energy", -1)}
                />
              </div>
            </div>
          )}

          {/* Game Info */}
          <Card className="p-3 bg-gray-50">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Players:</span>
                <span className="font-medium">{players.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Starting Life:</span>
                <span className="font-medium">
                  {gameState.startingLifeTotal}
                </span>
              </div>
              {gameState.gameStartTime && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">
                    {Math.floor(
                      (new Date().getTime() -
                        new Date(gameState.gameStartTime).getTime()) /
                        60000,
                    )}{" "}
                    min
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </ScrollArea>
    </Card>
  );
}
