import { format } from "date-fns";
import { Button } from "@/components/ui/button";

interface CalendarHeaderProps {
  currentDate: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

/**
 * CalendarHeader - Navigation controls and current date display
 * Extracted from calendar.tsx to reduce file size and improve maintainability
 */
export function CalendarHeader({
  currentDate,
  onPreviousMonth,
  onNextMonth,
  onToday,
}: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      {/* Navigation Controls */}
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPreviousMonth}
          aria-label="Previous month"
        >
          <i className="fas fa-chevron-left"></i>
        </Button>
        <Button variant="outline" size="sm" onClick={onToday}>
          Today
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onNextMonth}
          aria-label="Next month"
        >
          <i className="fas fa-chevron-right"></i>
        </Button>
      </div>

      {/* Current Month Display */}
      <h2 className="text-2xl font-bold">{format(currentDate, "MMMM yyyy")}</h2>

      {/* Spacer for layout balance */}
      <div className="w-32"></div>
    </div>
  );
}
