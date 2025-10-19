import React from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Event } from "@shared/schema";

interface PodStatusBadgeProps {
  event: Event;
  mainPlayers?: number;
  alternates?: number;
}

export function PodStatusBadge({
  event,
  mainPlayers = 0,
  alternates = 0,
}: PodStatusBadgeProps) {
  if (event.type !== "game_pod") return null;

  // const playerSlots = event.playerSlots || 4; // TODO: playerSlots doesn't exist in schema
  // const alternateSlots = event.alternateSlots || 2; // TODO: alternateSlots doesn't exist in schema
  const playerSlots = 4; // Default player slots
  const alternateSlots = 2; // Default alternate slots
  const mainProgress = (mainPlayers / playerSlots) * 100;
  const isFull = mainPlayers >= playerSlots;
  const isAlmostFull = mainPlayers === playerSlots - 1;

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Badge
          variant={isFull ? "default" : isAlmostFull ? "secondary" : "outline"}
          className="flex items-center space-x-1"
        >
          <i className="fas fa-users text-xs"></i>
          <span>
            {mainPlayers}/{playerSlots} Main
          </span>
        </Badge>
        {alternateSlots > 0 && (
          <Badge variant="outline" className="flex items-center space-x-1">
            <i className="fas fa-user-clock text-xs"></i>
            <span>
              {alternates}/{alternateSlots} Alt
            </span>
          </Badge>
        )}
        {isFull && (
          <Badge variant="destructive" className="flex items-center space-x-1">
            <i className="fas fa-exclamation-circle text-xs"></i>
            <span>FULL</span>
          </Badge>
        )}
      </div>
      <Progress value={mainProgress} className="h-1" />
    </div>
  );
}
