# Calendar UI/UX Components

This directory contains comprehensive calendar UI components for the Shuffle & Sync platform, providing enhanced event viewing, scheduling, and management capabilities.

## Components Overview

### 1. EventDetailsModal

A full-featured modal dialog for displaying complete event information.

**Features:**

- Complete event information display with type-based color coding
- Timezone display with globe icon
- Attendee count and capacity tracking
- Game format and power level display (for game pods)
- Recurring event badge integration
- Schedule conflict detection and highlighting
- Edit, delete, and export actions

**Usage:**

```tsx
import { EventDetailsModal } from "@/features/events";

function MyComponent() {
  const [event, setEvent] = useState<Event | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { data: allEvents = [] } = useEvents();

  return (
    <EventDetailsModal
      event={event}
      open={isOpen}
      onOpenChange={setIsOpen}
      onEdit={(event) => {
        /* Handle edit */
      }}
      onDelete={(event) => {
        /* Handle delete */
      }}
      onExport={(event) => {
        /* Handle export */
      }}
      allEvents={allEvents} // For conflict detection
    />
  );
}
```

### 2. DayView

An hour-by-hour daily calendar view with precise event positioning.

**Features:**

- 24-hour timeline grid (1440px height = 24 hours × 60px)
- Precise event positioning based on start/end times
- Day navigation controls (previous/next/today)
- Current time indicator (red line with dot)
- Type-based event styling
- Location display
- Click to view event details

**Usage:**

```tsx
import { DayView } from "@/features/events";

function MyCalendar() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { data: events = [] } = useEvents();

  return (
    <div className="h-[600px]">
      <DayView
        events={events}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onEventClick={(event) => {
          /* Handle event click */
        }}
      />
    </div>
  );
}
```

### 3. WeekView

A 7-day week calendar view with grid-based layout.

**Features:**

- Full week grid with hourly time slots
- Day headers with date display (highlights today)
- Week navigation controls
- Event display across multiple days
- Current time indicator for today
- Compact event display with hover effects

**Usage:**

```tsx
import { WeekView } from "@/features/events";

function MyCalendar() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { data: events = [] } = useEvents();

  return (
    <div className="h-[600px]">
      <WeekView
        events={events}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onEventClick={(event) => {
          /* Handle event click */
        }}
      />
    </div>
  );
}
```

### 4. DraggableEventWrapper

A drag-and-drop wrapper component using @dnd-kit/core.

**Features:**

- Visual feedback during drag (opacity change)
- Transform animations
- Works with DndContext from @dnd-kit/core

**Usage:**

```tsx
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { DraggableEvent } from "@/features/events";

function MyCalendar() {
  const handleDragEnd = (event: DragEndEvent) => {
    // Handle event drop
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <DraggableEvent id="event-1">{/* Event content */}</DraggableEvent>
    </DndContext>
  );
}
```

### 5. DroppableTimeSlot

A drop target component for time slots.

**Features:**

- Visual feedback on hover (background highlight + ring)
- Works with DndContext from @dnd-kit/core

**Usage:**

```tsx
import { DndContext } from "@dnd-kit/core";
import { DroppableTimeSlot } from "@/features/events";

function MyCalendar() {
  return (
    <DndContext onDragEnd={handleDragEnd}>
      <DroppableTimeSlot id="slot-2025-11-15-14-00">
        {/* Time slot content */}
      </DroppableTimeSlot>
    </DndContext>
  );
}
```

### 6. TimezoneSelector

A timezone selection dropdown with common timezones.

**Features:**

- 11 common timezones (ET, CT, MT, PT, AKT, HT, GMT, CET, JST, AEST, UTC)
- Globe icon indicator
- Built with Shadcn/ui Select component

**Usage:**

```tsx
import { TimezoneSelector } from "@/features/events";

function MyComponent() {
  const [timezone, setTimezone] = useState("America/New_York");

  return <TimezoneSelector value={timezone} onChange={setTimezone} />;
}
```

### 7. RecurringEventBadge

A badge component for indicating recurring events.

**Features:**

- Pattern display (daily/weekly/monthly)
- Tooltip with pattern details and end date
- Icon indicator (Repeat icon from lucide-react)

**Usage:**

```tsx
import { RecurringEventBadge } from "@/features/events";

function EventCard({ event }) {
  if (!event.isRecurring) return null;

  return (
    <RecurringEventBadge
      pattern={event.recurrencePattern}
      endDate={event.recurrenceEndDate}
    />
  );
}
```

### 8. CalendarLayerToggle

A control panel for toggling multiple calendar layers/filters.

**Features:**

- Checkbox toggles for each layer
- Color indicators
- Layer visibility management

**Usage:**

```tsx
import { CalendarLayerToggle } from "@/features/events";

function MyCalendar() {
  const [layers, setLayers] = useState([
    { id: "tournament", name: "Tournaments", color: "#a855f7", visible: true },
    { id: "convention", name: "Conventions", color: "#3b82f6", visible: true },
  ]);

  const handleToggle = (layerId: string) => {
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer,
      ),
    );
  };

  return <CalendarLayerToggle layers={layers} onToggle={handleToggle} />;
}
```

### 9. CalendarViewsDemo

A complete integration example showing all features together.

**Features:**

- Tab switching between Day and Week views
- Calendar layer filtering sidebar
- Event details modal integration
- Drag-and-drop event rescheduling
- Complete working example

**Usage:**

```tsx
import { CalendarViewsDemo } from "@/features/events/components/CalendarViewsDemo";

function MyPage() {
  return <CalendarViewsDemo communityId="optional-community-id" />;
}
```

## Hooks

### useConflictDetection

A hook for detecting schedule conflicts between events.

**Features:**

- Time overlap detection
- Self-exclusion (doesn't detect conflict with same event)
- Default 1-hour duration for events without endTime
- Returns array of conflicting events

**Usage:**

```tsx
import { useConflictDetection } from '@/features/events';

function MyComponent() {
  const { data: events = [] } = useEvents();
  const { detectConflicts } = useConflictDetection(events);

  const checkConflict = (newEvent: Event) => {
    const conflicts = detectConflicts(newEvent);
    if (conflicts.length > 0) {
      console.log('Conflicts found:', conflicts);
    }
  };

  return (/* ... */);
}
```

## Complete Integration Example

Here's a complete example showing how to use all components together:

```tsx
import { useState } from "react";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DayView,
  WeekView,
  EventDetailsModal,
  CalendarLayerToggle,
  useEvents,
  useUpdateEvent,
  useConflictDetection,
} from "@/features/events";

export function MyCustomCalendar() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [activeView, setActiveView] = useState<"day" | "week">("week");

  const [layers, setLayers] = useState([
    { id: "tournament", name: "Tournaments", color: "#a855f7", visible: true },
    { id: "convention", name: "Conventions", color: "#3b82f6", visible: true },
  ]);

  const { data: allEvents = [] } = useEvents();
  const updateEvent = useUpdateEvent();
  const { detectConflicts } = useConflictDetection(allEvents);

  // Filter events by visible layers
  const visibleEvents = allEvents.filter((event) => {
    const layer = layers.find((l) => l.id === event.type);
    return layer?.visible ?? true;
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    // Parse time slot and update event
    // Implementation details in CalendarViewsDemo.tsx
  };

  const handleLayerToggle = (layerId: string) => {
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer,
      ),
    );
  };

  return (
    <div className="flex gap-4">
      <div className="flex-1">
        <Tabs
          value={activeView}
          onValueChange={(v) => setActiveView(v as "day" | "week")}
        >
          <TabsList>
            <TabsTrigger value="day">Day</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
          </TabsList>

          <TabsContent value="day" className="h-[600px]">
            <DndContext onDragEnd={handleDragEnd}>
              <DayView
                events={visibleEvents}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                onEventClick={setSelectedEvent}
              />
            </DndContext>
          </TabsContent>

          <TabsContent value="week" className="h-[600px]">
            <DndContext onDragEnd={handleDragEnd}>
              <WeekView
                events={visibleEvents}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                onEventClick={setSelectedEvent}
              />
            </DndContext>
          </TabsContent>
        </Tabs>
      </div>

      <div className="w-64">
        <CalendarLayerToggle layers={layers} onToggle={handleLayerToggle} />
      </div>

      <EventDetailsModal
        event={selectedEvent}
        open={!!selectedEvent}
        onOpenChange={() => setSelectedEvent(null)}
        allEvents={allEvents}
      />
    </div>
  );
}
```

## Event Type Colors

The components use consistent color coding for event types:

| Type       | Color  | Background (Day View)                | Solid (Week View) |
| ---------- | ------ | ------------------------------------ | ----------------- |
| tournament | Purple | `bg-purple-500/20 border-purple-500` | `bg-purple-500`   |
| convention | Blue   | `bg-blue-500/20 border-blue-500`     | `bg-blue-500`     |
| release    | Green  | `bg-green-500/20 border-green-500`   | `bg-green-500`    |
| community  | Orange | `bg-orange-500/20 border-orange-500` | `bg-orange-500`   |
| game_pod   | Pink   | `bg-pink-500/20 border-pink-500`     | `bg-pink-500`     |
| stream     | Red    | `bg-red-500/20 border-red-500`       | `bg-red-500`      |
| personal   | Gray   | `bg-gray-500/20 border-gray-500`     | `bg-gray-500`     |

## Testing

All components have comprehensive test coverage:

- **EventDetailsModal**: 10 tests covering rendering, interactions, and conflict detection
- **DayView**: 9 tests covering rendering, navigation, and event display
- **useConflictDetection**: 8 tests covering all conflict detection scenarios

Run tests with:

```bash
npm run test:frontend -- client/src/features/events/
```

## Dependencies

These components require:

- `@dnd-kit/core` and `@dnd-kit/utilities` for drag-and-drop
- `date-fns` for date manipulation
- `lucide-react` for icons
- `@radix-ui/*` components (via Shadcn/ui)
- `@tanstack/react-query` for data fetching

All dependencies are already included in the project's package.json.

## Accessibility

All components follow accessibility best practices:

- Proper ARIA labels
- Keyboard navigation support (buttons, dialogs)
- Focus management
- Screen reader friendly
- Color contrast compliance

## Browser Support

Components are tested and work in:

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Performance Considerations

- DayView and WeekView use fixed-height containers for predictable layout
- ScrollArea component from Shadcn/ui provides optimized scrolling
- Event filtering is memoized in integration examples
- Drag-and-drop uses CSS transforms for smooth performance

## Future Enhancements

Potential future improvements:

1. Mobile-optimized responsive views
2. Advanced keyboard navigation (arrow keys to navigate days/weeks)
3. Print-friendly styles
4. Calendar export to various formats (ICS, Google Calendar, etc.)
5. Advanced recurring event patterns (nth weekday, custom intervals)
6. Multi-day event spanning
7. Event search and filtering
8. Time zone conversion display
