import { renderHook, act } from "@testing-library/react";
import { addMonths, subMonths } from "date-fns";
import { useCalendarState } from "./useCalendarState";

describe("useCalendarState", () => {
  describe("initialization", () => {
    it("initializes with current date by default", () => {
      const { result } = renderHook(() => useCalendarState());
      expect(result.current.currentDate).toBeInstanceOf(Date);
    });

    it("initializes with provided initial date", () => {
      const initialDate = new Date(2024, 0, 15);
      const { result } = renderHook(() => useCalendarState({ initialDate }));
      expect(result.current.currentDate).toEqual(initialDate);
    });

    it("initializes with provided initial view", () => {
      const { result } = renderHook(() =>
        useCalendarState({ initialView: "week" }),
      );
      expect(result.current.view).toBe("week");
    });

    it("defaults to month view", () => {
      const { result } = renderHook(() => useCalendarState());
      expect(result.current.view).toBe("month");
    });

    it("initializes with no selected date", () => {
      const { result } = renderHook(() => useCalendarState());
      expect(result.current.selectedDate).toBeNull();
    });
  });

  describe("navigation", () => {
    it("navigates to next month", () => {
      const initialDate = new Date(2024, 0, 15);
      const { result } = renderHook(() => useCalendarState({ initialDate }));

      act(() => {
        result.current.goToNextMonth();
      });

      const expectedDate = addMonths(initialDate, 1);
      expect(result.current.currentDate.getMonth()).toBe(
        expectedDate.getMonth(),
      );
    });

    it("navigates to previous month", () => {
      const initialDate = new Date(2024, 0, 15);
      const { result } = renderHook(() => useCalendarState({ initialDate }));

      act(() => {
        result.current.goToPreviousMonth();
      });

      const expectedDate = subMonths(initialDate, 1);
      expect(result.current.currentDate.getMonth()).toBe(
        expectedDate.getMonth(),
      );
    });

    it("navigates to today and selects it", () => {
      const initialDate = new Date(2024, 0, 15);
      const { result } = renderHook(() => useCalendarState({ initialDate }));

      act(() => {
        result.current.goToToday();
      });

      const today = new Date();
      expect(result.current.currentDate.getDate()).toBe(today.getDate());
      expect(result.current.selectedDate).not.toBeNull();
    });

    it("navigates to specific date and selects it", () => {
      const { result } = renderHook(() => useCalendarState());
      const targetDate = new Date(2024, 5, 15);

      act(() => {
        result.current.goToDate(targetDate);
      });

      expect(result.current.currentDate).toEqual(targetDate);
      expect(result.current.selectedDate).toEqual(targetDate);
    });
  });

  describe("view management", () => {
    it("changes view", () => {
      const { result } = renderHook(() => useCalendarState());

      act(() => {
        result.current.changeView("week");
      });

      expect(result.current.view).toBe("week");

      act(() => {
        result.current.changeView("day");
      });

      expect(result.current.view).toBe("day");
    });
  });

  describe("date selection", () => {
    it("selects a date", () => {
      const { result } = renderHook(() => useCalendarState());
      const dateToSelect = new Date(2024, 0, 15);

      act(() => {
        result.current.selectDate(dateToSelect);
      });

      expect(result.current.selectedDate).toEqual(dateToSelect);
    });

    it("clears selection", () => {
      const { result } = renderHook(() => useCalendarState());
      const dateToSelect = new Date(2024, 0, 15);

      act(() => {
        result.current.selectDate(dateToSelect);
      });

      expect(result.current.selectedDate).toEqual(dateToSelect);

      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedDate).toBeNull();
    });
  });

  describe("computed values", () => {
    it("provides month start and end", () => {
      const initialDate = new Date(2024, 0, 15);
      const { result } = renderHook(() => useCalendarState({ initialDate }));

      expect(result.current.monthStart.getDate()).toBe(1);
      expect(result.current.monthStart.getMonth()).toBe(0);
      expect(result.current.monthEnd.getMonth()).toBe(0);
      expect(result.current.monthEnd.getDate()).toBe(31);
    });

    it("provides calendar start and end (including surrounding weeks)", () => {
      const initialDate = new Date(2024, 0, 15);
      const { result } = renderHook(() => useCalendarState({ initialDate }));

      expect(result.current.calendarStart).toBeInstanceOf(Date);
      expect(result.current.calendarEnd).toBeInstanceOf(Date);
      expect(result.current.calendarStart.getTime()).toBeLessThan(
        result.current.monthStart.getTime(),
      );
      expect(result.current.calendarEnd.getTime()).toBeGreaterThan(
        result.current.monthEnd.getTime(),
      );
    });

    it("provides calendar days array", () => {
      const initialDate = new Date(2024, 0, 15);
      const { result } = renderHook(() => useCalendarState({ initialDate }));

      expect(Array.isArray(result.current.calendarDays)).toBe(true);
      expect(result.current.calendarDays.length).toBeGreaterThan(0);
      expect(result.current.calendarDays[0]).toBeInstanceOf(Date);
    });
  });

  describe("helper functions", () => {
    it("checks if date is in current month", () => {
      const initialDate = new Date(2024, 0, 15);
      const { result } = renderHook(() => useCalendarState({ initialDate }));

      const dateInMonth = new Date(2024, 0, 20);
      const dateNotInMonth = new Date(2024, 1, 15);

      expect(result.current.isDateInCurrentMonth(dateInMonth)).toBe(true);
      expect(result.current.isDateInCurrentMonth(dateNotInMonth)).toBe(false);
    });

    it("checks if date is today", () => {
      const { result } = renderHook(() => useCalendarState());

      const today = new Date();
      const notToday = new Date(2024, 0, 15);

      expect(result.current.isDateToday(today)).toBe(true);
      expect(result.current.isDateToday(notToday)).toBe(false);
    });

    it("checks if date is selected", () => {
      const { result } = renderHook(() => useCalendarState());
      const dateToSelect = new Date(2024, 0, 15);
      const otherDate = new Date(2024, 0, 20);

      expect(result.current.isDateSelected(dateToSelect)).toBe(false);

      act(() => {
        result.current.selectDate(dateToSelect);
      });

      expect(result.current.isDateSelected(dateToSelect)).toBe(true);
      expect(result.current.isDateSelected(otherDate)).toBe(false);
    });
  });

  describe("memoization and stability", () => {
    it("maintains stable function references", () => {
      const { result, rerender } = renderHook(() => useCalendarState());

      const firstRender = {
        goToPreviousMonth: result.current.goToPreviousMonth,
        goToNextMonth: result.current.goToNextMonth,
        goToToday: result.current.goToToday,
        selectDate: result.current.selectDate,
      };

      rerender();

      expect(result.current.goToPreviousMonth).toBe(
        firstRender.goToPreviousMonth,
      );
      expect(result.current.goToNextMonth).toBe(firstRender.goToNextMonth);
      expect(result.current.goToToday).toBe(firstRender.goToToday);
      expect(result.current.selectDate).toBe(firstRender.selectDate);
    });

    it("recomputes calendar days when date changes", () => {
      const initialDate = new Date(2024, 0, 15);
      const { result } = renderHook(() => useCalendarState({ initialDate }));

      const firstMonthDays = result.current.calendarDays;

      act(() => {
        result.current.goToNextMonth();
      });

      const secondMonthDays = result.current.calendarDays;

      expect(secondMonthDays).not.toBe(firstMonthDays);
      expect(secondMonthDays[0]).not.toEqual(firstMonthDays[0]);
    });
  });
});
