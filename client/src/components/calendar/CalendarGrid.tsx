import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import React from "react";
import type { Event } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CalendarGridProps {
  currentDate: Date;
  events: Event[];
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: Event) => void;
}

/**
 * Color classes for different event types
 * Module-level constant to avoid recreation on every render
 * Reserved for future use in event styling
 */
const _EVENT_TYPE_COLORS: Record<string, string> = {
  tournament:
    "bg-purple-500/20 hover:bg-purple-500/30 text-purple-700 dark:text-purple-300",
  stream:
    "bg-blue-500/20 hover:bg-blue-500/30 text-blue-700 dark:text-blue-300",
  game_pod:
    "bg-green-500/20 hover:bg-green-500/30 text-green-700 dark:text-green-300",
  convention:
    "bg-orange-500/20 hover:bg-orange-500/30 text-orange-700 dark:text-orange-300",
  release:
    "bg-pink-500/20 hover:bg-pink-500/30 text-pink-700 dark:text-pink-300",
  community:
    "bg-teal-500/20 hover:bg-teal-500/30 text-teal-700 dark:text-teal-300",
  personal:
    "bg-gray-500/20 hover:bg-gray-500/30 text-gray-700 dark:text-gray-300",
};

const _DEFAULT_EVENT_COLOR =
  "bg-gray-500/20 hover:bg-gray-500/30 text-gray-700 dark:text-gray-300";

/**
 * Get event status based on start and end times
 */
function getEventStatus(
  event: Event,
): "upcoming" | "ongoing" | "past" | "draft" {
  if (!event.startTime) return "draft"; // Events without startTime are drafts/unpublished

  const now = new Date();
  const startTime = new Date(event.startTime);
  const endTime = event.endTime ? new Date(event.endTime) : null;

  if (endTime && endTime < now) {
    return "past";
  }

  if (startTime <= now) {
    if (!endTime) {
      // If no end time, consider ongoing if started less than 4 hours ago
      const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);
      return startTime > fourHoursAgo ? "ongoing" : "past";
    }
    return "ongoing";
  }

  return "upcoming";
}

/**
 * Get color class based on event type and status
 */
function getEventColorClass(event: Event): string {
  const status = getEventStatus(event);

  // Base color by event type
  const typeColors: Record<string, string> = {
    tournament:
      "bg-purple-500/20 hover:bg-purple-500/30 text-purple-700 dark:text-purple-300",
    stream:
      "bg-blue-500/20 hover:bg-blue-500/30 text-blue-700 dark:text-blue-300",
    game_pod:
      "bg-green-500/20 hover:bg-green-500/30 text-green-700 dark:text-green-300",
    convention:
      "bg-orange-500/20 hover:bg-orange-500/30 text-orange-700 dark:text-orange-300",
    release:
      "bg-pink-500/20 hover:bg-pink-500/30 text-pink-700 dark:text-pink-300",
    community:
      "bg-teal-500/20 hover:bg-teal-500/30 text-teal-700 dark:text-teal-300",
    personal:
      "bg-gray-500/20 hover:bg-gray-500/30 text-gray-700 dark:text-gray-300",
  };

  const baseColor =
    typeColors[event.type] ||
    "bg-gray-500/20 hover:bg-gray-500/30 text-gray-700 dark:text-gray-300";

  // Add opacity for past events
  if (status === "past") {
    return `${baseColor} opacity-60`;
  }

  // Add pulsing animation for ongoing events
  if (status === "ongoing") {
    return `${baseColor} ring-2 ring-current animate-pulse`;
  }

  return baseColor;
}

export function CalendarGrid({
  currentDate,
  events,
  onDateClick,
  onEventClick,
}: CalendarGridProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getEventsForDay = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return events.filter((event) => {
      if (!event.startTime) return false;
      const eventDate = format(new Date(event.startTime), "yyyy-MM-dd");
      return eventDate === dateStr;
    });
  };

  return (
    <div className="calendar-grid">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-semibold text-muted-foreground p-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());

          return (
            <Card
              key={day.toISOString()}
              className={cn(
                "min-h-[100px] p-2 cursor-pointer hover:border-primary/50 transition-colors",
                !isCurrentMonth && "opacity-40 bg-muted/20",
                isToday && "border-primary border-2",
              )}
              onClick={() => onDateClick?.(day)}
            >
              <div className="flex flex-col h-full">
                <div
                  className={cn(
                    "text-sm font-medium mb-1",
                    isToday && "text-primary font-bold",
                  )}
                >
                  {format(day, "d")}
                </div>
                <div className="flex-1 space-y-1 overflow-y-auto">
                  {dayEvents.slice(0, 3).map((event) => {
                    const status = getEventStatus(event);
                    return (
                      <div
                        key={event.id}
                        className={cn(
                          "text-xs p-1 rounded truncate cursor-pointer relative",
                          getEventColorClass(event),
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick?.(event);
                        }}
                        title={`${event.title} - ${status}`}
                      >
                        {/* Status indicator */}
                        {status === "ongoing" && (
                          <span className="absolute top-0 left-0 h-full w-1 bg-current rounded-l" />
                        )}
                        <div className="flex items-center gap-1">
                          {event.startTime && (
                            <span className="font-medium">
                              {format(new Date(event.startTime), "HH:mm")}
                            </span>
                          )}
                          <span className="truncate">{event.title}</span>
                        </div>
                      </div>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-current" />
          <span>Upcoming</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-current ring-2 ring-current" />
          <span>Ongoing</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-current opacity-60" />
          <span>Past</span>
        </div>
      </div>
    </div>
  );
}
