import { useEffect, useCallback } from "react";

interface UseCalendarKeyboardOptions {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onCreateEvent?: () => void;
  enabled?: boolean;
}

export const useCalendarKeyboard = ({
  selectedDate,
  onSelectDate,
  onPreviousMonth,
  onNextMonth,
  onToday,
  onCreateEvent,
  enabled = true,
}: UseCalendarKeyboardOptions) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled || !selectedDate) return;

      // Don't handle keyboard events if user is typing in an input
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Prevent default for navigation keys
      const navigationKeys = [
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "PageUp",
        "PageDown",
        "Home",
      ];
      if (navigationKeys.includes(event.key)) {
        event.preventDefault();
      }

      const currentDate = new Date(selectedDate);

      switch (event.key) {
        // Day navigation
        case "ArrowLeft":
          currentDate.setDate(currentDate.getDate() - 1);
          onSelectDate(currentDate);
          break;

        case "ArrowRight":
          currentDate.setDate(currentDate.getDate() + 1);
          onSelectDate(currentDate);
          break;

        case "ArrowUp":
          currentDate.setDate(currentDate.getDate() - 7);
          onSelectDate(currentDate);
          break;

        case "ArrowDown":
          currentDate.setDate(currentDate.getDate() + 7);
          onSelectDate(currentDate);
          break;

        // Month navigation
        case "PageUp":
          if (event.shiftKey) {
            // Shift+PageUp: Previous year
            currentDate.setFullYear(currentDate.getFullYear() - 1);
            onSelectDate(currentDate);
          } else {
            onPreviousMonth();
          }
          break;

        case "PageDown":
          if (event.shiftKey) {
            // Shift+PageDown: Next year
            currentDate.setFullYear(currentDate.getFullYear() + 1);
            onSelectDate(currentDate);
          } else {
            onNextMonth();
          }
          break;

        // Jump to today
        case "Home":
          onToday();
          break;

        // Create event
        case "n":
        case "c":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            onCreateEvent?.();
          }
          break;

        default:
          break;
      }
    },
    [
      enabled,
      selectedDate,
      onSelectDate,
      onPreviousMonth,
      onNextMonth,
      onToday,
      onCreateEvent,
    ],
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, handleKeyDown]);
};
