import { memo } from "react";
import { CalendarDay } from "./CalendarDay";

interface Event {
  id: string;
  title: string;
  startTime?: Date | string | null;
}

interface CalendarWeekProps {
  days: Date[];
  getEventsForDate: (date: Date) => Event[];
  selectedDate: Date | null;
  isDateInCurrentMonth: (date: Date) => boolean;
  isDateToday: (date: Date) => boolean;
  isDateSelected: (date: Date) => boolean;
  onSelectDate: (date: Date) => void;
  onEventClick?: (event: Event) => void;
}

export const CalendarWeek = memo(
  ({
    days,
    getEventsForDate,
    onSelectDate,
    isDateInCurrentMonth,
    isDateToday,
    isDateSelected,
    onEventClick,
  }: CalendarWeekProps) => {
    return (
      <div className="grid grid-cols-7 gap-1">
        {days.map((date) => (
          <CalendarDay
            key={date.toISOString()}
            date={date}
            events={getEventsForDate(date)}
            isCurrentMonth={isDateInCurrentMonth(date)}
            isToday={isDateToday(date)}
            isSelected={isDateSelected(date)}
            onSelectDay={onSelectDate}
            onEventClick={onEventClick}
          />
        ))}
      </div>
    );
  },
);

CalendarWeek.displayName = "CalendarWeek";
