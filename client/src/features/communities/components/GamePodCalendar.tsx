import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

interface GamePodCalendarProps {
  communityId: string;
  communityName: string;
  theme?: any;
}

export function GamePodCalendar({
  _communityId,
  communityName,
  _theme,
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
