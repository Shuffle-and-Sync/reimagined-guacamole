import { addDays, format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

interface DateRangePickerProps {
  dateRange?: DateRange;
  onDateRangeChange: (range: DateRange | undefined) => void;
  className?: string;
}

/**
 * DateRangePicker - Component for selecting a date range for calendar filtering
 *
 * Features:
 * - Date range selection using react-day-picker
 * - Quick presets (This Week, This Month, Next Month)
 * - Clear button to reset selection
 * - Accessible with keyboard navigation
 */
export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handlePresetClick = (preset: "week" | "month" | "nextMonth") => {
    const today = new Date();
    let range: DateRange;

    switch (preset) {
      case "week":
        range = {
          from: today,
          to: addDays(today, 7),
        };
        break;
      case "month":
        range = {
          from: today,
          to: addDays(today, 30),
        };
        break;
      case "nextMonth":
        range = {
          from: addDays(today, 30),
          to: addDays(today, 60),
        };
        break;
    }

    onDateRangeChange(range);
    setIsOpen(false);
  };

  const handleClear = () => {
    onDateRangeChange(undefined);
    setIsOpen(false);
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "w-full md:w-[300px] justify-start text-left font-normal",
              !dateRange && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "LLL dd, y")} -{" "}
                  {format(dateRange.to, "LLL dd, y")}
                </>
              ) : (
                format(dateRange.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex flex-col space-y-2 p-3 border-b">
            <div className="text-sm font-medium">Quick Select</div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePresetClick("week")}
                className="flex-1"
              >
                This Week
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePresetClick("month")}
                className="flex-1"
              >
                This Month
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePresetClick("nextMonth")}
                className="flex-1"
              >
                Next Month
              </Button>
            </div>
          </div>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={onDateRangeChange}
            numberOfMonths={2}
          />
          <div className="flex justify-end p-3 border-t">
            <Button variant="ghost" size="sm" onClick={handleClear}>
              Clear
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
