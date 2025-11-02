/**
 * CommanderDamageTracker Component
 *
 * Tracks commander damage for Commander/EDH format
 */

import { Shield, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PlayerState } from "../types/game-state.types";

interface CommanderDamageTrackerProps {
  player: PlayerState;
  commanders: Array<{ id: string; name: string }>;
  onDamageChange: (commanderId: string, delta: number) => void;
}

export function CommanderDamageTracker({
  player,
  commanders,
  onDamageChange,
}: CommanderDamageTrackerProps) {
  const commanderDamage = player.commanderDamage || {};

  // Check for lethal commander damage (21+)
  const hasLethalDamage = Object.values(commanderDamage).some(
    (damage) => damage >= 21,
  );

  return (
    <Card className={hasLethalDamage ? "border-red-500" : ""}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Commander Damage: {player.playerName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {commanders.map((commander) => {
          const damage = commanderDamage[commander.id] || 0;
          const isLethal = damage >= 21;

          return (
            <div
              key={commander.id}
              className={`flex items-center justify-between p-2 rounded ${
                isLethal ? "bg-red-50 border border-red-300" : "bg-gray-50"
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{commander.name}</p>
                {isLethal && (
                  <p className="text-xs text-red-600 font-bold">LETHAL!</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onDamageChange(commander.id, -1)}
                  disabled={damage === 0}
                >
                  <Minus className="h-3 w-3" />
                </Button>

                <span
                  className={`text-lg font-bold w-8 text-center ${
                    isLethal ? "text-red-600" : ""
                  }`}
                >
                  {damage}
                </span>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onDamageChange(commander.id, 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          );
        })}

        {commanders.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-2">
            No commanders in game
          </p>
        )}
      </CardContent>
    </Card>
  );
}
