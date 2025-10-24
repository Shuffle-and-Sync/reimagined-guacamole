import { memo } from "react";
import { Card } from "@/components/ui/card";
import { DayEvents } from "./DayEvents";
import { DayNumber } from "./DayNumber";

interface Event {
  id: string;
  title: string;
  startTime?: Date | string | null;
}

interface CalendarDayProps {
  date: Date;
  events: Event[];
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  onSelectDay: (date: Date) => void;
  onEventClick?: (event: Event) => void;
}

export const CalendarDay = memo(
  ({
    date,
    events,
    isCurrentMonth,
    isToday,
    isSelected,
    onSelectDay,
    onEventClick,
  }: CalendarDayProps) => {
    return (
      <Card
        className={`
        calendar-day min-h-[100px] p-2 cursor-pointer hover:border-primary/50 transition-colors
        ${!isCurrentMonth ? "opacity-40 bg-muted/20" : ""}
        ${isToday ? "border-primary border-2" : ""}
        ${isSelected ? "ring-2 ring-primary" : ""}
      `}
        role="gridcell"
        onClick={() => onSelectDay(date)}
      >
        <div className="flex flex-col h-full">
          <DayNumber
            date={date}
            isCurrentMonth={isCurrentMonth}
            isToday={isToday}
            isSelected={isSelected}
            onClick={() => onSelectDay(date)}
          />
          <DayEvents
            events={events}
            onEventClick={onEventClick}
            onMoreClick={() => onSelectDay(date)}
          />
        </div>
      </Card>
    );
  },
);

CalendarDay.displayName = "CalendarDay";
