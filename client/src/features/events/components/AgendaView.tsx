import { format, isSameDay, startOfDay, addDays } from "date-fns";
import {
  Calendar,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Event } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface AgendaViewProps {
  events: Event[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onEventClick: (event: Event) => void;
  daysToShow?: number;
}

export function AgendaView({
  events,
  selectedDate,
  onDateChange,
  onEventClick,
  daysToShow = 7,
}: AgendaViewProps) {
  // Generate array of dates to show
  const dates = Array.from({ length: daysToShow }, (_, i) =>
    addDays(startOfDay(selectedDate), i),
  );

  // Group events by date
  const eventsByDate = dates.map((date) => ({
    date,
    events: events
      .filter((event) => {
        if (!event.startTime) return false;
        return isSameDay(new Date(event.startTime), date);
      })
      .sort((a, b) => {
        if (!a.startTime || !b.startTime) return 0;
        return (
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );
      }),
  }));

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

  const getEventTypeBorderColor = (type: string) => {
    const colors: Record<string, string> = {
      tournament: "border-purple-500",
      convention: "border-blue-500",
      release: "border-green-500",
      community: "border-orange-500",
      game_pod: "border-pink-500",
      stream: "border-red-500",
      personal: "border-gray-500",
    };
    return colors[type] || "border-gray-500";
  };

  const handlePrevPeriod = () => {
    const prevDate = new Date(selectedDate);
    prevDate.setDate(prevDate.getDate() - daysToShow);
    onDateChange(prevDate);
  };

  const handleNextPeriod = () => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + daysToShow);
    onDateChange(nextDate);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={handlePrevPeriod}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <h2 className="text-xl font-bold">
            Agenda: {format(selectedDate, "MMM d")} -{" "}
            {format(dates[dates.length - 1] || selectedDate, "MMM d, yyyy")}
          </h2>

          <Button variant="outline" size="icon" onClick={handleNextPeriod}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Button variant="outline" onClick={() => onDateChange(new Date())}>
          Today
        </Button>
      </div>

      {/* Agenda List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {eventsByDate.map(({ date, events: dayEvents }) => (
            <div key={date.toISOString()}>
              {/* Date Header */}
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">
                  {format(date, "EEEE, MMMM d, yyyy")}
                </h3>
              </div>

              {/* Events for this date */}
              {dayEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground ml-8 py-2">
                  No events scheduled
                </p>
              ) : (
                <div className="space-y-2 ml-8">
                  {dayEvents.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className={cn(
                        "w-full text-left p-4 border-l-4 rounded-lg hover:bg-accent transition-colors",
                        getEventTypeBorderColor(event.type),
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getEventTypeColor(event.type)}>
                              {event.type.replace("_", " ").toUpperCase()}
                            </Badge>
                            <span className="font-medium">
                              {event.startTime &&
                                format(new Date(event.startTime), "h:mm a")}
                              {event.endTime &&
                                ` - ${format(new Date(event.endTime), "h:mm a")}`}
                            </span>
                          </div>

                          <h4 className="font-semibold text-lg mb-1">
                            {event.title}
                          </h4>

                          {event.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {event.description}
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {event.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {event.location}
                              </div>
                            )}
                            {event.maxAttendees && (
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {event.maxAttendees} max
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <Separator className="mt-6" />
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
