import React from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

interface PodFieldsFormProps {
  playerSlots: number;
  setPlayerSlots: (value: number) => void;
  alternateSlots: number;
  setAlternateSlots: (value: number) => void;
  gameFormat: string;
  setGameFormat: (value: string) => void;
  powerLevel: number;
  setPowerLevel: (value: number) => void;
}

const GAME_FORMATS = [
  "Commander / EDH",
  "Standard",
  "Modern",
  "Pioneer",
  "Legacy",
  "Vintage",
  "Pauper",
  "Limited / Draft",
  "Sealed",
  "Brawl",
  "Historic",
  "Explorer",
  "Other",
];

export function PodFieldsForm({
  playerSlots,
  setPlayerSlots,
  alternateSlots,
  setAlternateSlots,
  gameFormat,
  setGameFormat,
  powerLevel,
  setPowerLevel,
}: PodFieldsFormProps) {
  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
      <div className="flex items-center space-x-2 mb-2">
        <i className="fas fa-gamepad text-primary"></i>
        <h3 className="text-lg font-semibold">Game Pod Settings</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Player Slots */}
        <div className="space-y-2">
          <Label htmlFor="player-slots">Main Player Slots: {playerSlots}</Label>
          <Slider
            id="player-slots"
            min={2}
            max={8}
            step={1}
            value={[playerSlots]}
            onValueChange={(values) => setPlayerSlots(values[0] || 4)}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground">
            Number of main player slots (2-8)
          </p>
        </div>

        {/* Alternate Slots */}
        <div className="space-y-2">
          <Label htmlFor="alternate-slots">
            Alternate Slots: {alternateSlots}
          </Label>
          <Slider
            id="alternate-slots"
            min={0}
            max={4}
            step={1}
            value={[alternateSlots]}
            onValueChange={(values) => setAlternateSlots(values[0] || 0)}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground">
            Number of alternate/backup slots (0-4)
          </p>
        </div>

        {/* Game Format */}
        <div className="space-y-2">
          <Label htmlFor="game-format">Game Format</Label>
          <Select value={gameFormat} onValueChange={setGameFormat}>
            <SelectTrigger id="game-format">
              <SelectValue placeholder="Select game format" />
            </SelectTrigger>
            <SelectContent>
              {GAME_FORMATS.map((format) => (
                <SelectItem key={format} value={format}>
                  {format}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Power Level */}
        <div className="space-y-2">
          <Label htmlFor="power-level">Power Level: {powerLevel}</Label>
          <Slider
            id="power-level"
            min={1}
            max={10}
            step={1}
            value={[powerLevel]}
            onValueChange={(values) => setPowerLevel(values[0] || 5)}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground">
            1 = Casual, 5 = Optimized, 10 = cEDH
          </p>
        </div>
      </div>
    </div>
  );
}
