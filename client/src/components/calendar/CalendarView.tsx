import { addMonths, subMonths } from "date-fns";
import { lazy, Suspense } from "react";
import { LazyLoadErrorBoundary } from "@/components/LazyLoadErrorBoundary";
import { CalendarSkeleton } from "@/components/skeletons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExtendedEvent } from "@/hooks/useCalendarEvents";
import { CalendarFilters } from "./CalendarFilters";
import { CalendarHeader } from "./CalendarHeader";
import type { EventType } from "./types";

// Lazy load the calendar grid component
const CalendarGrid = lazy(() =>
  import("./CalendarGrid").then((m) => ({ default: m.CalendarGrid })),
);

interface CalendarViewProps {
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  filteredEvents: ExtendedEvent[];
  filterType: string;
  onFilterTypeChange: (type: string) => void;
  viewMode: string;
  onViewModeChange: (mode: string) => void;
  eventTypes: EventType[];
  communityName?: string;
  eventsTerminology: string;
}

/**
 * CalendarView - Calendar tab content with grid and filters
 * Extracted from calendar.tsx to reduce file size
 */
export function CalendarView({
  currentMonth,
  setCurrentMonth,
  filteredEvents,
  filterType,
  onFilterTypeChange,
  viewMode,
  onViewModeChange,
  eventTypes,
  communityName,
  eventsTerminology,
}: CalendarViewProps) {
  return (
    <div className="space-y-6">
      {/* Filters */}
      <CalendarFilters
        filterType={filterType}
        onFilterTypeChange={onFilterTypeChange}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        eventTypes={eventTypes}
        communityName={communityName}
        eventsTerminology={eventsTerminology}
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
          <LazyLoadErrorBoundary>
            <Suspense fallback={<CalendarSkeleton />}>
              <CalendarGrid
                currentDate={currentMonth}
                events={filteredEvents}
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
        </CardContent>
      </Card>
    </div>
  );
}
