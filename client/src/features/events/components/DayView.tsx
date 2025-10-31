import { format, isSameDay, addDays, subDays } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Event } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface DayViewProps {
  events: Event[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onEventClick: (event: Event) => void;
}

export function DayView({
  events,
  selectedDate,
  onDateChange,
  onEventClick,
}: DayViewProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const dayEvents = events.filter((event) => {
    if (!event.startTime) return false;
    return isSameDay(new Date(event.startTime), selectedDate);
  });

  const getEventPosition = (event: Event) => {
    if (!event.startTime)
      return { top: "0%", height: "40px", minHeight: "40px" };

    const start = new Date(event.startTime);
    const end = event.endTime
      ? new Date(event.endTime)
      : new Date(start.getTime() + 3600000); // Default 1 hour

    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();
    const duration = Math.max(endMinutes - startMinutes, 30); // Minimum 30 minutes

    return {
      top: `${(startMinutes / 1440) * 100}%`,
      height: `${(duration / 1440) * 100}%`,
      minHeight: "40px",
    };
  };

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      tournament:
        "bg-purple-500/20 border-purple-500 text-purple-700 dark:text-purple-300",
      convention:
        "bg-blue-500/20 border-blue-500 text-blue-700 dark:text-blue-300",
      release:
        "bg-green-500/20 border-green-500 text-green-700 dark:text-green-300",
      community:
        "bg-orange-500/20 border-orange-500 text-orange-700 dark:text-orange-300",
      game_pod:
        "bg-pink-500/20 border-pink-500 text-pink-700 dark:text-pink-300",
      stream: "bg-red-500/20 border-red-500 text-red-700 dark:text-red-300",
      personal:
        "bg-gray-500/20 border-gray-500 text-gray-700 dark:text-gray-300",
    };
    return colors[type] || colors.personal;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onDateChange(subDays(selectedDate, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="text-center">
            <h2 className="text-2xl font-bold">
              {format(selectedDate, "EEEE")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {format(selectedDate, "MMMM d, yyyy")}
            </p>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => onDateChange(addDays(selectedDate, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Button variant="outline" onClick={() => onDateChange(new Date())}>
          Today
        </Button>
      </div>

      {/* Time Grid */}
      <ScrollArea className="flex-1">
        <div className="relative" style={{ height: "1440px" }}>
          {" "}
          {/* 24 hours * 60px */}
          {/* Hour lines */}
          {hours.map((hour) => (
            <div
              key={hour}
              className="absolute left-0 right-0 border-t border-border"
              style={{ top: `${(hour / 24) * 100}%` }}
            >
              <span className="absolute -top-3 left-2 text-xs text-muted-foreground bg-background px-1">
                {format(new Date().setHours(hour, 0, 0, 0), "h:mm a")}
              </span>
            </div>
          ))}
          {/* Events */}
          <div className="absolute left-20 right-4 top-0 bottom-0">
            {dayEvents.map((event) => {
              const position = getEventPosition(event);
              return (
                <button
                  key={event.id}
                  className={cn(
                    "absolute left-0 right-0 rounded-lg border-l-4 p-2 text-left transition-all hover:shadow-lg cursor-pointer",
                    getEventTypeColor(event.type),
                  )}
                  style={position}
                  onClick={() => onEventClick(event)}
                >
                  <div className="font-medium text-sm truncate">
                    {event.title}
                  </div>
                  {event.startTime && (
                    <div className="text-xs truncate mt-1">
                      {format(new Date(event.startTime), "h:mm a")}
                      {event.endTime &&
                        ` - ${format(new Date(event.endTime), "h:mm a")}`}
                    </div>
                  )}
                  {event.location && (
                    <div className="text-xs truncate mt-1 opacity-75">
                      📍 {event.location}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          {/* Current time indicator */}
          {isSameDay(selectedDate, new Date()) && (
            <div
              className="absolute left-0 right-0 border-t-2 border-red-500 z-10"
              style={{
                top: `${((new Date().getHours() * 60 + new Date().getMinutes()) / 1440) * 100}%`,
              }}
            >
              <div className="absolute -left-2 -top-2 h-4 w-4 rounded-full bg-red-500" />
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
