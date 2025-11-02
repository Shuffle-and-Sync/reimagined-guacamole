/**
 * LifeCounter Component
 *
 * Displays and controls player life totals
 */

import { Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { PlayerState } from "../types/game-state.types";

interface LifeCounterProps {
  player: PlayerState;
  onLifeChange: (delta: number) => void;
  isCurrentPlayer?: boolean;
  isLocalPlayer?: boolean;
}

export function LifeCounter({
  player,
  onLifeChange,
  isCurrentPlayer = false,
  isLocalPlayer = false,
}: LifeCounterProps) {
  const lifeColor =
    player.lifeTotal <= 0
      ? "text-red-600"
      : player.lifeTotal <= 5
        ? "text-orange-500"
        : player.lifeTotal <= 10
          ? "text-yellow-500"
          : "text-green-600";

  return (
    <Card className={`p-4 ${isCurrentPlayer ? "ring-2 ring-blue-500" : ""}`}>
      <div className="space-y-3">
        {/* Player Name */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold truncate">
            {player.playerName}
            {isLocalPlayer && (
              <span className="ml-1 text-xs text-gray-500">(You)</span>
            )}
          </h3>
          {isCurrentPlayer && (
            <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
              Active
            </span>
          )}
        </div>

        {/* Life Total */}
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onLifeChange(-1)}
            className="h-12 w-12"
          >
            <Minus className="h-5 w-5" />
          </Button>

          <div className="flex-1 text-center">
            <div className={`text-4xl font-bold ${lifeColor}`}>
              {player.lifeTotal}
            </div>
            <div className="text-xs text-gray-500">Life</div>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => onLifeChange(1)}
            className="h-12 w-12"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {/* Quick Change Buttons */}
        <div className="grid grid-cols-4 gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onLifeChange(-5)}
            className="text-xs"
          >
            -5
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onLifeChange(-10)}
            className="text-xs"
          >
            -10
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onLifeChange(+5)}
            className="text-xs"
          >
            +5
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onLifeChange(+10)}
            className="text-xs"
          >
            +10
          </Button>
        </div>

        {/* Additional Counters */}
        {player.poisonCounters !== undefined && player.poisonCounters > 0 && (
          <div className="flex items-center justify-between text-sm border-t pt-2">
            <span className="text-purple-600 font-medium">☠️ Poison:</span>
            <span className="font-bold">{player.poisonCounters}</span>
          </div>
        )}

        {player.energyCounters !== undefined && player.energyCounters > 0 && (
          <div className="flex items-center justify-between text-sm border-t pt-2">
            <span className="text-yellow-600 font-medium">⚡ Energy:</span>
            <span className="font-bold">{player.energyCounters}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
