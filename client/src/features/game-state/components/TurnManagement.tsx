/**
 * TurnManagement Component
 *
 * Displays current turn and provides turn pass functionality
 */

import { ArrowRight, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface TurnManagementProps {
  currentPlayerName: string;
  turnNumber: number;
  isLocalPlayerTurn: boolean;
  onPassTurn: () => void;
}

export function TurnManagement({
  currentPlayerName,
  turnNumber,
  isLocalPlayerTurn,
  onPassTurn,
}: TurnManagementProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {isLocalPlayerTurn ? (
              <Play className="w-5 h-5 text-green-500" />
            ) : (
              <Pause className="w-5 h-5 text-gray-400" />
            )}
            <h3 className="text-sm font-semibold">Turn {turnNumber}</h3>
          </div>
          <p className="text-sm text-gray-600">
            <span className="font-medium">{currentPlayerName}</span>
            {isLocalPlayerTurn && (
              <span className="text-green-600 ml-1">(Your Turn)</span>
            )}
          </p>
        </div>

        <Button
          onClick={onPassTurn}
          size="lg"
          disabled={!isLocalPlayerTurn}
          className="gap-2"
        >
          Pass Turn
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}
