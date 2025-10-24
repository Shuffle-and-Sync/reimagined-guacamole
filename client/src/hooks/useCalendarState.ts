import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { useState, useCallback, useMemo } from "react";

export type CalendarView = "month" | "week" | "day";

interface UseCalendarStateOptions {
  initialDate?: Date;
  initialView?: CalendarView;
}

export const useCalendarState = (options: UseCalendarStateOptions = {}) => {
  const { initialDate = new Date(), initialView = "month" } = options;

  // State
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [view, setView] = useState<CalendarView>(initialView);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Navigation
  const goToPreviousMonth = useCallback(() => {
    setCurrentDate((prev) => subMonths(prev, 1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentDate((prev) => addMonths(prev, 1));
  }, []);

  const goToToday = useCallback(() => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  }, []);

  const goToDate = useCallback((date: Date) => {
    setCurrentDate(date);
    setSelectedDate(date);
  }, []);

  // View management
  const changeView = useCallback((newView: CalendarView) => {
    setView(newView);
  }, []);

  // Date selection
  const selectDate = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedDate(null);
  }, []);

  // Computed values
  const monthStart = useMemo(() => startOfMonth(currentDate), [currentDate]);
  const monthEnd = useMemo(() => endOfMonth(currentDate), [currentDate]);

  const calendarStart = useMemo(() => startOfWeek(monthStart), [monthStart]);

  const calendarEnd = useMemo(() => endOfWeek(monthEnd), [monthEnd]);

  // Generate calendar days for the grid
  const calendarDays = useMemo(() => {
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [calendarStart, calendarEnd]);

  // Helper functions
  const isDateInCurrentMonth = useCallback(
    (date: Date) => isSameMonth(date, currentDate),
    [currentDate],
  );

  const isDateToday = useCallback((date: Date) => isToday(date), []);

  const isDateSelected = useCallback(
    (date: Date) => {
      if (!selectedDate) return false;
      return (
        date.getFullYear() === selectedDate.getFullYear() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getDate() === selectedDate.getDate()
      );
    },
    [selectedDate],
  );

  return {
    // State
    currentDate,
    view,
    selectedDate,

    // Navigation
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    goToDate,

    // View management
    changeView,

    // Selection
    selectDate,
    clearSelection,

    // Computed values
    monthStart,
    monthEnd,
    calendarStart,
    calendarEnd,
    calendarDays,

    // Helpers
    isDateInCurrentMonth,
    isDateToday,
    isDateSelected,
  };
};
