import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  addWeeks,
  subWeeks,
  isToday,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Event } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface WeekViewProps {
  events: Event[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onEventClick: (event: Event) => void;
}

export function WeekView({
  events,
  selectedDate,
  onDateChange,
  onEventClick,
}: WeekViewProps) {
  const weekStart = startOfWeek(selectedDate);
  const weekEnd = endOfWeek(selectedDate);
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => {
      if (!event.startTime) return false;
      return isSameDay(new Date(event.startTime), day);
    });
  };

  const getEventPosition = (event: Event) => {
    if (!event.startTime) return { top: "0%", height: "40px" };

    const start = new Date(event.startTime);
    const end = event.endTime
      ? new Date(event.endTime)
      : new Date(start.getTime() + 3600000);

    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();
    const duration = Math.max(endMinutes - startMinutes, 30); // Minimum 30 minutes

    return {
      top: `${(startMinutes / 1440) * 100}%`,
      height: `${(duration / 1440) * 100}%`,
    };
  };

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      tournament: "bg-purple-500 hover:bg-purple-600",
      convention: "bg-blue-500 hover:bg-blue-600",
      release: "bg-green-500 hover:bg-green-600",
      community: "bg-orange-500 hover:bg-orange-600",
      game_pod: "bg-pink-500 hover:bg-pink-600",
      stream: "bg-red-500 hover:bg-red-600",
      personal: "bg-gray-500 hover:bg-gray-600",
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
            onClick={() => onDateChange(subWeeks(selectedDate, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="text-center">
            <h2 className="text-xl font-bold">
              {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
            </h2>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => onDateChange(addWeeks(selectedDate, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Button variant="outline" onClick={() => onDateChange(new Date())}>
          Today
        </Button>
      </div>

      {/* Days header */}
      <div className="grid grid-cols-8 border-b">
        <div className="p-2 border-r" /> {/* Time column */}
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              "p-2 text-center border-r",
              isToday(day) && "bg-primary/10",
            )}
          >
            <div className="text-sm font-medium">{format(day, "EEE")}</div>
            <div
              className={cn(
                "text-2xl font-bold",
                isToday(day) && "text-primary",
              )}
            >
              {format(day, "d")}
            </div>
          </div>
        ))}
      </div>

      {/* Time Grid */}
      <ScrollArea className="flex-1">
        <div className="relative grid grid-cols-8" style={{ height: "1440px" }}>
          {/* Time labels */}
          <div className="border-r">
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-[60px] border-b flex items-start justify-end pr-2 pt-1"
              >
                <span className="text-xs text-muted-foreground">
                  {format(new Date().setHours(hour, 0, 0, 0), "h a")}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day) => {
            const dayEvents = getEventsForDay(day);

            return (
              <div key={day.toISOString()} className="relative border-r">
                {/* Hour lines */}
                {hours.map((hour) => (
                  <div key={hour} className="h-[60px] border-b" />
                ))}

                {/* Events */}
                <div className="absolute inset-0 p-1">
                  {dayEvents.map((event) => {
                    const position = getEventPosition(event);
                    return (
                      <button
                        key={event.id}
                        className={cn(
                          "absolute left-1 right-1 rounded text-white text-xs p-1 overflow-hidden transition-all hover:shadow-lg",
                          getEventTypeColor(event.type),
                        )}
                        style={position}
                        onClick={() => onEventClick(event)}
                      >
                        <div className="font-medium truncate">
                          {event.title}
                        </div>
                        {event.startTime && (
                          <div className="truncate opacity-90">
                            {format(new Date(event.startTime), "h:mm a")}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Current time indicator */}
                {isToday(day) && (
                  <div
                    className="absolute left-0 right-0 border-t-2 border-red-500 z-10"
                    style={{
                      top: `${((new Date().getHours() * 60 + new Date().getMinutes()) / 1440) * 100}%`,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
