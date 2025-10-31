import { addMonths, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { lazy, Suspense, useState, useMemo } from "react";
import { LazyLoadErrorBoundary } from "@/components/LazyLoadErrorBoundary";
import { CalendarSkeleton } from "@/components/skeletons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCalendarDateRange } from "@/hooks/useCalendarDateRange";
import { CalendarFilters } from "./CalendarFilters";
import { CalendarHeader } from "./CalendarHeader";
import type { EventType } from "./types";
import type { DateRange } from "react-day-picker";

// Lazy load the calendar grid component
const CalendarGrid = lazy(() =>
  import("./CalendarGrid").then((m) => ({ default: m.CalendarGrid })),
);

interface CalendarViewProps {
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  filterType: string;
  onFilterTypeChange: (type: string) => void;
  viewMode: string;
  onViewModeChange: (mode: string) => void;
  eventTypes: EventType[];
  communityId?: string;
  communityName?: string;
  eventsTerminology: string;
}

/**
 * CalendarView - Calendar tab content with grid and filters
 * Now includes date range filtering using the calendar API endpoint
 */
export function CalendarView({
  currentMonth,
  setCurrentMonth,
  filterType,
  onFilterTypeChange,
  viewMode,
  onViewModeChange,
  eventTypes,
  communityId,
  communityName,
  eventsTerminology,
}: CalendarViewProps) {
  // Calculate date range based on currentMonth - use useMemo to avoid unnecessary recalculations
  const dateRange = useMemo<DateRange>(
    () => ({
      from: startOfMonth(currentMonth),
      to: endOfMonth(currentMonth),
    }),
    [currentMonth],
  );

  // Separate state for when user manually selects a date range via picker
  const [manualDateRange, setManualDateRange] = useState<
    DateRange | undefined
  >();

  // Use manual date range if set, otherwise use calculated range from currentMonth
  const activeDateRange = manualDateRange || dateRange;

  // Fetch events using the calendar API with date range
  const { events, isLoading, hasDateRange } = useCalendarDateRange({
    dateRange: activeDateRange,
    communityId,
    eventType: filterType,
    enabled: true,
  });

  // When user changes date range via picker, update manual override
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setManualDateRange(range);
    // If range is provided and has a from date, update the current month view
    if (range?.from) {
      setCurrentMonth(range.from);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters with Date Range Picker */}
      <CalendarFilters
        filterType={filterType}
        onFilterTypeChange={onFilterTypeChange}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        eventTypes={eventTypes}
        communityName={communityName}
        eventsTerminology={eventsTerminology}
        dateRange={activeDateRange}
        onDateRangeChange={handleDateRangeChange}
      />

      {/* Calendar Grid */}
      <Card>
        <CardHeader>
          <CardTitle>{eventsTerminology} Calendar</CardTitle>
          <CalendarHeader
            currentDate={currentMonth}
            onPreviousMonth={() => setCurrentMonth(subMonths(currentMonth, 1))}
            onNextMonth={() => setCurrentMonth(addMonths(currentMonth, 1))}
            onToday={() => setCurrentMonth(new Date())}
          />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <CalendarSkeleton />
          ) : !hasDateRange ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Loading calendar view...</p>
            </div>
          ) : (
            <LazyLoadErrorBoundary>
              <Suspense fallback={<CalendarSkeleton />}>
                <CalendarGrid
                  currentDate={currentMonth}
                  events={events}
                  onDateClick={(_date) => {
                    // Could set selected date or open date view here
                    // Functionality not yet implemented
                  }}
                  onEventClick={(_event) => {
                    // Could open event details dialog here
                    // Functionality not yet implemented
                  }}
                />
              </Suspense>
            </LazyLoadErrorBoundary>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
