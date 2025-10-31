import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangePicker } from "./DateRangePicker";
import type { DateRange } from "react-day-picker";

interface EventType {
  id: string;
  name: string;
}

interface CalendarFiltersProps {
  filterType: string;
  onFilterTypeChange: (value: string) => void;
  viewMode: string;
  onViewModeChange: (mode: string) => void;
  eventTypes: EventType[];
  communityName?: string;
  eventsTerminology: string;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
}

/**
 * CalendarFilters - Filter and view mode controls for calendar
 * Extracted from calendar.tsx to reduce file size and improve maintainability
 */
export function CalendarFilters({
  filterType,
  onFilterTypeChange,
  viewMode,
  onViewModeChange,
  eventTypes,
  communityName,
  eventsTerminology,
  dateRange,
  onDateRangeChange,
}: CalendarFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Date Range Picker */}
      {onDateRangeChange && (
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium">Date Range</label>
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={onDateRangeChange}
          />
        </div>
      )}

      {/* Filters and View Mode */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center space-x-4">
          <Select value={filterType} onValueChange={onFilterTypeChange}>
            <SelectTrigger className="w-48" data-testid="select-filter-type">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {eventTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="text-sm text-muted-foreground bg-muted/30 px-3 py-2 rounded-md border">
            <span className="font-medium">
              {communityName || "Unknown Community"}
            </span>{" "}
            {eventsTerminology}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => onViewModeChange("week")}
          >
            Week
          </Button>
          <Button
            variant={viewMode === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => onViewModeChange("month")}
          >
            Month
          </Button>
        </div>
      </div>
    </div>
  );
}
