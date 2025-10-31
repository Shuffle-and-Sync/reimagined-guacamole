import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Event } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MonthViewProps {
  events: Event[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onEventClick: (event: Event) => void;
  onDayClick: (date: Date) => void;
}

export function MonthView({
  events,
  selectedDate,
  onDateChange,
  onEventClick,
  onDayClick,
}: MonthViewProps) {
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);

  // Get all days to display (including padding days from prev/next month)
  const firstDayOfMonth = monthStart.getDay();
  const calendarStart = new Date(monthStart);
  calendarStart.setDate(calendarStart.getDate() - firstDayOfMonth);

  const lastDayOfMonth = monthEnd.getDay();
  const calendarEnd = new Date(monthEnd);
  calendarEnd.setDate(calendarEnd.getDate() + (6 - lastDayOfMonth));

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });
  const weeks = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => {
      if (!event.startTime) return false;
      return isSameDay(new Date(event.startTime), day);
    });
  };

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      tournament: "bg-purple-500",
      convention: "bg-blue-500",
      release: "bg-green-500",
      community: "bg-orange-500",
      game_pod: "bg-pink-500",
      stream: "bg-red-500",
      personal: "bg-gray-500",
    };
    return colors[type] || "bg-gray-500";
  };

  const handlePrevMonth = () => {
    const prevMonth = new Date(selectedDate);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    onDateChange(prevMonth);
  };

  const handleNextMonth = () => {
    const nextMonth = new Date(selectedDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    onDateChange(nextMonth);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <h2 className="text-2xl font-bold">
            {format(selectedDate, "MMMM yyyy")}
          </h2>

          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Button variant="outline" onClick={() => onDateChange(new Date())}>
          Today
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 p-4">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-center font-medium text-sm text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1 flex-1">
          {weeks.map((week, weekIdx) =>
            week.map((day, dayIdx) => {
              const dayEvents = getEventsForDay(day);
              const isCurrentMonth = isSameMonth(day, selectedDate);
              const isDayToday = isToday(day);

              return (
                <button
                  key={`${weekIdx}-${dayIdx}`}
                  onClick={() => onDayClick(day)}
                  className={cn(
                    "min-h-[100px] p-2 border rounded-lg text-left hover:bg-accent transition-colors",
                    !isCurrentMonth && "opacity-50",
                    isDayToday && "border-primary border-2",
                  )}
                >
                  <div
                    className={cn(
                      "text-sm font-medium mb-1",
                      isDayToday && "text-primary",
                    )}
                  >
                    {format(day, "d")}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <button
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(event);
                        }}
                        className={cn(
                          "w-full text-xs p-1 rounded text-white truncate text-left hover:opacity-80",
                          getEventTypeColor(event.type),
                        )}
                      >
                        {format(new Date(event.startTime!), "h:mm a")}{" "}
                        {event.title}
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-muted-foreground pl-1">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </button>
              );
            }),
          )}
        </div>
      </div>
    </div>
  );
}
