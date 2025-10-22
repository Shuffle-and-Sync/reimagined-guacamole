import { Calendar } from "lucide-react";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GamePodCalendarProps {
  communityId: string;
  communityName: string;
  theme?: unknown;
}

export function GamePodCalendar({
  communityId: _communityId,
  communityName,
  theme: _theme,
}: GamePodCalendarProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {communityName} Events
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Event calendar coming soon!</p>
          <p className="text-sm">
            Stay tuned for {communityName} events and tournaments.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
