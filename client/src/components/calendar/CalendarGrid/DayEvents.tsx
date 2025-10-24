import { memo } from "react";

interface Event {
  id: string;
  title: string;
  startTime?: Date | string | null;
}

interface DayEventsProps {
  events: Event[];
  maxVisible?: number;
  onEventClick?: (event: Event) => void;
  onMoreClick?: () => void;
}

export const DayEvents = memo(
  ({ events, maxVisible = 3, onEventClick, onMoreClick }: DayEventsProps) => {
    const visibleEvents = events.slice(0, maxVisible);
    const remainingCount = events.length - maxVisible;

    return (
      <div className="day-events mt-1 space-y-1 overflow-y-auto">
        {visibleEvents.map((event) => (
          <button
            key={event.id}
            onClick={(e) => {
              e.stopPropagation();
              onEventClick?.(event);
            }}
            className="event-badge w-full text-left text-xs p-1 rounded bg-primary/10 hover:bg-primary/20 truncate cursor-pointer transition-colors"
            title={event.title}
          >
            {event.startTime &&
              new Date(event.startTime).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
            {event.title}
          </button>
        ))}
        {remainingCount > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoreClick?.();
            }}
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            +{remainingCount} more
          </button>
        )}
      </div>
    );
  },
);

DayEvents.displayName = "DayEvents";
