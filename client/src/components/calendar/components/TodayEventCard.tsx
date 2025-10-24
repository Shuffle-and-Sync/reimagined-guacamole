import { memo } from "react";
import type { Event, Community } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EventType {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface TodayEventCardProps {
  event: Event & {
    community: Community | null;
    attendeeCount: number;
    time?: string;
  };
  eventType?: EventType;
}

/**
 * TodayEventCard - Displays a compact event card for today's events
 * Memoized to prevent unnecessary re-renders when parent state changes
 */
export const TodayEventCard = memo<TodayEventCardProps>(
  ({ event, eventType }) => {
    return (
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div
                className={`w-8 h-8 ${eventType?.color || "bg-gray-500"} rounded-lg flex items-center justify-center`}
              >
                <i
                  className={`${eventType?.icon || "fas fa-calendar"} text-white text-sm`}
                ></i>
              </div>
              <Badge variant="outline">
                {event.community?.name || "All Communities"}
              </Badge>
            </div>
            <span className="text-sm text-muted-foreground">{event.time}</span>
          </div>
          <CardTitle className="text-lg">{event.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            {event.description}
          </p>
          <div className="flex items-center justify-between text-sm">
            <span>📍 {event.location}</span>
            <span>👥 {event.attendeeCount?.toLocaleString() || "0"}</span>
          </div>
        </CardContent>
      </Card>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function - only re-render if these properties change
    return (
      prevProps.event.id === nextProps.event.id &&
      prevProps.event.title === nextProps.event.title &&
      prevProps.event.description === nextProps.event.description &&
      prevProps.event.location === nextProps.event.location &&
      prevProps.event.time === nextProps.event.time &&
      prevProps.event.attendeeCount === nextProps.event.attendeeCount &&
      prevProps.event.community?.name === nextProps.event.community?.name &&
      prevProps.eventType?.id === nextProps.eventType?.id
    );
  },
);

TodayEventCard.displayName = "TodayEventCard";
