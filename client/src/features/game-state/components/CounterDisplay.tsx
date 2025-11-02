/**
 * CounterDisplay Component
 *
 * Generic counter display for poison, energy, storm, etc.
 */

import { Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface CounterDisplayProps {
  label: string;
  value: number;
  icon?: string;
  color?: string;
  onIncrement: () => void;
  onDecrement: () => void;
  warningThreshold?: number;
  dangerThreshold?: number;
}

export function CounterDisplay({
  label,
  value,
  icon = "📊",
  color = "text-gray-700",
  onIncrement,
  onDecrement,
  warningThreshold,
  dangerThreshold,
}: CounterDisplayProps) {
  const isDanger = dangerThreshold !== undefined && value >= dangerThreshold;
  const isWarning =
    warningThreshold !== undefined && value >= warningThreshold && !isDanger;

  const displayColor = isDanger
    ? "text-red-600"
    : isWarning
      ? "text-orange-500"
      : color;

  const cardClass = isDanger
    ? "border-red-500 bg-red-50"
    : isWarning
      ? "border-orange-500 bg-orange-50"
      : "";

  return (
    <Card className={`p-3 ${cardClass}`}>
      <div className="space-y-2">
        <div className="text-sm font-medium text-center">
          {icon} {label}
        </div>

        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={onDecrement}
            disabled={value === 0}
          >
            <Minus className="h-4 w-4" />
          </Button>

          <div
            className={`text-2xl font-bold w-12 text-center ${displayColor}`}
          >
            {value}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={onIncrement}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {isDanger && (
          <div className="text-xs text-red-600 text-center font-bold">
            LETHAL!
          </div>
        )}
        {isWarning && !isDanger && (
          <div className="text-xs text-orange-600 text-center font-medium">
            Warning
          </div>
        )}
      </div>
    </Card>
  );
}
