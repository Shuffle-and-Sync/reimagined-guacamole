# Calendar Date Range Filtering Feature

## Overview

This document describes the calendar date range filtering feature implementation that connects the frontend calendar view to the backend `/api/calendar/events` endpoint.

## Problem Statement

The backend had a fully functional `/api/calendar/events` endpoint with date range filtering capabilities, but the frontend calendar view was not using it. Instead, the frontend only fetched events with a simple `upcoming=true` filter, missing out on:

- Precise date range queries
- Better performance through targeted data fetching
- Ability to view events in any date range (past, present, future)

## Solution

### Architecture

```
┌─────────────────────┐
│  Calendar Page      │
│  (calendar.tsx)     │
└──────────┬──────────┘
           │
           ├─────── Overview Tab ────► useCalendarEvents (existing)
           ├─────── My Events Tab ───► useCalendarEvents (existing)
           │
           └─────── Calendar Tab ────► CalendarView (NEW)
                                         │
                                         ├─► DateRangePicker
                                         ├─► CalendarFilters
                                         │
                                         └─► useCalendarDateRange (NEW)
                                               │
                                               └─► /api/calendar/events
```

### Key Components

#### 1. DateRangePicker Component

**File:** `client/src/components/calendar/DateRangePicker.tsx`

A reusable date range selector component using `react-day-picker`.

**Features:**

- Visual calendar with 2-month view
- Quick presets: "This Week", "This Month", "Next Month"
- Clear button to reset selection
- Fully accessible (keyboard navigation, ARIA labels)
- Mobile responsive

**Usage:**

```tsx
<DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
```

#### 2. useCalendarDateRange Hook

**File:** `client/src/hooks/useCalendarDateRange.ts`

A React Query hook for fetching events with date range filtering.

**Features:**

- Fetches from `/api/calendar/events` endpoint
- Supports filters: `startDate`, `endDate`, `communityId`, `type`
- Automatically formats dates (YYYY-MM-DD)
- Returns events categorized by status (upcoming, ongoing, past)
- React Query caching for performance
- TypeScript typed for safety

**Usage:**

```tsx
const { events, eventsByStatus, isLoading, hasDateRange } =
  useCalendarDateRange({
    dateRange: { from: startDate, to: endDate },
    communityId: selectedCommunity?.id,
    eventType: filterType,
    enabled: true,
  });
```

**Return Values:**

- `events`: Array of all events in date range
- `eventsByStatus`: Object with `upcoming`, `ongoing`, `past` arrays
- `isLoading`: Boolean loading state
- `error`: Error object if fetch failed
- `hasDateRange`: Boolean indicating if date range is valid

#### 3. Updated CalendarView

**File:** `client/src/components/calendar/CalendarView.tsx`

The main calendar view component, now with date range integration.

**Changes:**

- Uses `useCalendarDateRange` instead of receiving events as props
- Calculates date range from `currentMonth` using `useMemo`
- Supports manual date range override via DateRangePicker
- Shows appropriate loading/empty states

#### 4. Enhanced CalendarGrid

**File:** `client/src/components/calendar/CalendarGrid.tsx`

Calendar grid with visual event indicators.

**Features:**

- Color coding by event type:
  - Tournament: Purple
  - Stream: Blue
  - Game Pod: Green
  - Convention: Orange
  - Release: Pink
  - Community: Teal
  - Personal: Gray
- Status indicators:
  - **Upcoming**: Normal display with type color
  - **Ongoing**: Pulsing ring animation + left border
  - **Past**: 60% opacity
- Shows up to 3 events per day with "+N more" indicator
- Event legend at bottom explaining colors/status
- Click handlers for dates and events (ready for future features)

#### 5. Enhanced CalendarFilters

**File:** `client/src/components/calendar/CalendarFilters.tsx`

Filter controls including the new DateRangePicker.

**Features:**

- Date range selection (new)
- Event type dropdown
- View mode toggle (Week/Month)
- Community indicator

## API Integration

### Backend Endpoint

**Endpoint:** `GET /api/calendar/events`

**Query Parameters:**

- `startDate` (required): ISO date string (YYYY-MM-DD)
- `endDate` (required): ISO date string (YYYY-MM-DD)
- `communityId` (optional): Filter by community
- `type` (optional): Filter by event type

**Response:**

```typescript
Array<
  Event & {
    creator: User;
    community: Community | null;
    attendeeCount: number;
    mainPlayers: number;
    alternates: number;
  }
>;
```

### Example Request

```bash
GET /api/calendar/events?startDate=2024-01-01&endDate=2024-01-31&communityId=magic-the-gathering&type=tournament
```

## Event Status Logic

Events are categorized into three statuses:

### Upcoming

- Event `startTime` is in the future
- Color: Normal (based on event type)

### Ongoing

- Event has `startTime <= now` AND `endTime > now`
- If no `endTime`, considered ongoing if started less than 4 hours ago
- Color: Normal + pulsing ring animation
- Visual: Vertical border on left side

### Past

- Event has `endTime < now`
- If no `endTime`, considered past if started more than 4 hours ago
- Color: Type color at 60% opacity

## User Experience Improvements

### Before

- Calendar showed only upcoming events
- No way to view specific date ranges
- No visual distinction between event states
- Single color for all events

### After

- Select any date range (past, present, future)
- Quick presets for common ranges
- Clear visual indicators for event status
- Color-coded by event type
- Legend explaining the visual system
- Better performance (fetch only what's needed)

## Testing

### Unit Tests

**File:** `client/src/hooks/useCalendarDateRange.test.tsx`

Tests cover:

- ✅ Empty state when no date range provided
- ✅ Validation of incomplete date ranges
- ✅ Date range detection
- ✅ Event categorization by status

**Run tests:**

```bash
npm run test:frontend -- useCalendarDateRange
```

### Manual Testing Checklist

- [ ] Date range picker opens and closes properly
- [ ] Quick preset buttons work (This Week, Month, Next Month)
- [ ] Custom date selection works
- [ ] Clear button resets selection
- [ ] Events load when date range is selected
- [ ] Event type filter works
- [ ] Month navigation updates date range
- [ ] Events are colored by type
- [ ] Ongoing events show pulsing animation
- [ ] Past events appear faded
- [ ] Legend is visible and accurate
- [ ] Loading states show during data fetch
- [ ] Mobile responsive design works
- [ ] Keyboard navigation works

## Performance Considerations

### React Query Caching

The `useCalendarDateRange` hook uses React Query's caching mechanism:

- Cache key includes: `startDate`, `endDate`, `communityId`, `eventType`
- Queries are cached and reused across component renders
- Stale time can be configured for different use cases

### Optimizations

1. **Date Range Calculation**: Uses `useMemo` to avoid recalculation on every render
2. **Lazy Loading**: CalendarGrid is lazy-loaded with `React.lazy()`
3. **Conditional Fetching**: Only fetches when date range is valid
4. **Event Categorization**: Memoized to avoid recalculating on every render

## Future Enhancements

Potential improvements for future iterations:

1. **Event Details Modal**: Click event to see full details
2. **Day View**: Click date to see all events for that day
3. **Week View**: Implement actual week view (currently just toggle)
4. **Drag and Drop**: Reschedule events by dragging
5. **Export**: Export calendar events to ICS format
6. **Timezone Support**: Show events in user's timezone
7. **Recurring Events**: Better display of recurring event series
8. **Conflict Detection**: Highlight scheduling conflicts
9. **Multiple Calendars**: View multiple community calendars simultaneously
10. **Calendar Sync**: Sync with Google Calendar, Outlook, etc.

## Migration Guide

### For Developers

If you need to add similar date range filtering elsewhere:

1. **Import the hook:**

```tsx
import { useCalendarDateRange } from "@/hooks/useCalendarDateRange";
```

2. **Set up date range state:**

```tsx
const [dateRange, setDateRange] = useState<DateRange>();
```

3. **Use the hook:**

```tsx
const { events, isLoading } = useCalendarDateRange({
  dateRange,
  communityId: yourCommunityId,
  eventType: yourEventType,
});
```

4. **Add the DateRangePicker:**

```tsx
<DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
```

## Dependencies

### New Dependencies

None! All features use existing dependencies:

- `react-day-picker`: Already in use for calendar UI
- `date-fns`: Already in use for date manipulation
- `@tanstack/react-query`: Already in use for data fetching

### Updated Files

- `client/src/components/calendar/CalendarView.tsx`
- `client/src/components/calendar/CalendarFilters.tsx`
- `client/src/components/calendar/CalendarGrid.tsx`
- `client/src/pages/calendar.tsx`

### New Files

- `client/src/components/calendar/DateRangePicker.tsx`
- `client/src/hooks/useCalendarDateRange.ts`
- `client/src/hooks/useCalendarDateRange.test.tsx`

## Accessibility

### Keyboard Navigation

- **DateRangePicker**: Full keyboard navigation via react-day-picker
- **Tab**: Navigate between elements
- **Arrow Keys**: Navigate calendar dates
- **Enter/Space**: Select date
- **Escape**: Close popover

### Screen Readers

- All buttons have proper labels
- Calendar has ARIA roles and labels
- Event status communicated via title attributes
- Legend explains visual indicators

### Visual Accessibility

- High contrast colors for event types
- Status indicators have multiple cues (color + animation + opacity)
- Text remains readable at all color combinations
- Clear focus indicators

## Known Issues

None specific to this feature. Pre-existing test failures in other parts of the codebase are unrelated to these changes.

## Support

For questions or issues related to calendar date range filtering:

1. Check this documentation first
2. Review the test files for usage examples
3. Check the backend API endpoint documentation
4. Review React Query documentation for caching behavior

## Version History

- **v1.0.0** (2025-10-31): Initial implementation
  - DateRangePicker component
  - useCalendarDateRange hook
  - Visual event indicators
  - Full integration with backend API
