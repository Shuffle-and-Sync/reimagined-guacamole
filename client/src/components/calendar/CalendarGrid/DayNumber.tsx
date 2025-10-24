import { memo } from "react";

interface DayNumberProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  onClick: () => void;
}

export const DayNumber = memo(
  ({ date, isCurrentMonth, isToday, isSelected, onClick }: DayNumberProps) => {
    const dayNumber = date.getDate();

    return (
      <button
        onClick={onClick}
        className={`
        day-number
        ${!isCurrentMonth ? "text-gray-400" : "text-gray-900 dark:text-gray-100"}
        ${isToday ? "bg-primary text-primary-foreground font-bold" : ""}
        ${isSelected ? "ring-2 ring-primary" : ""}
        hover:bg-accent
        rounded-full w-8 h-8 flex items-center justify-center
        transition-colors text-sm font-medium
      `}
        aria-label={`${date.toLocaleDateString()}`}
        aria-current={isToday ? "date" : undefined}
      >
        {dayNumber}
      </button>
    );
  },
);

DayNumber.displayName = "DayNumber";
