import React from "react";
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
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Event } from "@shared/schema";

interface CalendarGridProps {
  currentDate: Date;
  events: Event[];
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: Event) => void;
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
    // return events.filter(event => event.date === dateStr); // TODO: date property doesn&apos;t exist
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
              className={`
                min-h-[100px] p-2 cursor-pointer hover:border-primary/50 transition-colors
                ${!isCurrentMonth ? "opacity-40 bg-muted/20" : ""}
                ${isToday ? "border-primary border-2" : ""}
              `}
              onClick={() => onDateClick?.(day)}
            >
              <div className="flex flex-col h-full">
                <div
                  className={`text-sm font-medium mb-1 ${isToday ? "text-primary font-bold" : ""}`}
                >
                  {format(day, "d")}
                </div>
                <div className="flex-1 space-y-1 overflow-y-auto">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className="text-xs p-1 rounded bg-primary/10 hover:bg-primary/20 truncate cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event);
                      }}
                      title={event.title}
                    >
                      {/* {event.time} {event.title} */}{" "}
                      {/* TODO: time property doesn&apos;t exist */}
                      {event.startTime &&
                        format(new Date(event.startTime), "HH:mm")}{" "}
                      {event.title}
                    </div>
                  ))}
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
    </div>
  );
}
