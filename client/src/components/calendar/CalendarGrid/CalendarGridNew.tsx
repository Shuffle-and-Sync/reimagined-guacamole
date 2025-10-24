import { memo } from "react";
import { CalendarDay } from "./CalendarDay";

interface Event {
  id: string;
  title: string;
  startTime?: Date | string | null;
}

interface CalendarGridNewProps {
  days: Date[];
  getEventsForDate: (date: Date) => Event[];
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  onEventClick?: (event: Event) => void;
  isDateInCurrentMonth: (date: Date) => boolean;
  isDateToday: (date: Date) => boolean;
  isDateSelected: (date: Date) => boolean;
}

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const CalendarGridNew = memo(
  ({
    days,
    getEventsForDate,
    onSelectDate,
    onEventClick,
    isDateInCurrentMonth,
    isDateToday,
    isDateSelected,
  }: CalendarGridNewProps) => {
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
      </div>
    );
  },
);

CalendarGridNew.displayName = "CalendarGridNew";
