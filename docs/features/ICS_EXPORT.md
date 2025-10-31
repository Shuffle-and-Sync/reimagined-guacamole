# ICS Export Feature Documentation

## Overview

The ICS Export feature allows users to export Shuffle & Sync events to standard iCalendar (.ics) format, which can be imported into any calendar application that supports RFC 5545 (Google Calendar, Outlook, Apple Calendar, etc.).

## Backend API Endpoints

### 1. Export Single Event

**Endpoint**: `GET /api/events/:id/export/ics`

**Description**: Exports a single event as an ICS file.

**Example**:

```bash
curl -O -J http://localhost:3000/api/events/event-123/export/ics
```

**Response**: Downloads an `.ics` file named `{event-title}-{date}.ics`

### 2. Export Multiple Events

**Endpoint**: `POST /api/events/export/ics`

**Description**: Exports multiple events as a single ICS file.

**Request Body**:

```json
{
  "eventIds": ["event-1", "event-2", "event-3"]
}
```

**Example**:

```bash
curl -X POST http://localhost:3000/api/events/export/ics \
  -H "Content-Type: application/json" \
  -d '{"eventIds": ["event-1", "event-2"]}' \
  -O -J
```

**Response**: Downloads an `.ics` file named `shuffle-sync-events-{date}.ics`

### 3. Export Calendar Range

**Endpoint**: `GET /api/calendar/events/export/ics?startDate={start}&endDate={end}`

**Description**: Exports all events within a date range for authenticated user.

**Query Parameters**:

- `startDate` (required): Start date in ISO format (e.g., "2025-11-01")
- `endDate` (required): End date in ISO format (e.g., "2025-11-30")

**Example**:

```bash
curl -H "Authorization: Bearer {token}" \
  "http://localhost:3000/api/calendar/events/export/ics?startDate=2025-11-01&endDate=2025-11-30" \
  -O -J
```

**Response**: Downloads an `.ics` file named `shuffle-sync-calendar-{date}.ics`

## Frontend Usage

### Using the Hook

The `useICSExport` hook provides three mutation functions for exporting events.

```typescript
import { useICSExport } from "@/hooks/useICSExport";

function MyComponent() {
  const { exportSingleEvent, exportMultipleEvents, exportCalendar } = useICSExport();

  // Export a single event
  const handleExportEvent = (eventId: string) => {
    exportSingleEvent.mutate({ eventId });
  };

  // Export multiple events
  const handleExportSelected = (eventIds: string[]) => {
    exportMultipleEvents.mutate({ eventIds });
  };

  // Export calendar range
  const handleExportCalendar = () => {
    exportCalendar.mutate({
      startDate: "2025-11-01",
      endDate: "2025-11-30",
    });
  };

  return (
    <>
      <button onClick={() => handleExportEvent("event-123")}>
        Export Event
      </button>
      <button onClick={() => handleExportSelected(["event-1", "event-2"])}>
        Export Selected
      </button>
      <button onClick={handleExportCalendar}>
        Export Calendar
      </button>
    </>
  );
}
```

### Adding Export Button to Event Details

```typescript
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useICSExport } from "@/hooks/useICSExport";

function EventDetailsModal({ event }) {
  const { exportSingleEvent } = useICSExport();

  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{event.title}</DialogTitle>
        </DialogHeader>

        {/* Event details here */}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => exportSingleEvent.mutate({ eventId: event.id })}
            disabled={exportSingleEvent.isPending}
          >
            <Download className="mr-2 h-4 w-4" />
            Export to Calendar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Adding Export to Calendar View

```typescript
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useICSExport } from "@/hooks/useICSExport";
import { format, startOfMonth, endOfMonth } from "date-fns";

function CalendarView() {
  const { exportCalendar } = useICSExport();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handleExportMonth = () => {
    exportCalendar.mutate({
      startDate: format(startOfMonth(currentMonth), "yyyy-MM-dd"),
      endDate: format(endOfMonth(currentMonth), "yyyy-MM-dd"),
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2>Calendar</h2>
        <Button
          variant="outline"
          onClick={handleExportMonth}
          disabled={exportCalendar.isPending}
        >
          <Download className="mr-2 h-4 w-4" />
          Export This Month
        </Button>
      </div>
      {/* Calendar component */}
    </div>
  );
}
```

## ICS File Format

The exported ICS files include:

- **UID**: Unique identifier for each event (`shuffle-sync-event-{id}@shuffleandsync.com`)
- **Title**: Event title
- **Description**: Event description (if available)
- **Location**: Event location (if available)
- **Start/End Time**: Event date and time
- **Categories**: Event type (tournament, convention, etc.)
- **URL**: Link back to event on Shuffle & Sync
- **Status**: CONFIRMED
- **Product ID**: shuffleandsync/calendar

## Importing into Calendar Applications

### Google Calendar

1. Download the `.ics` file
2. Go to Google Calendar
3. Click the "+" next to "Other calendars"
4. Select "Import"
5. Choose the downloaded `.ics` file
6. Select the calendar to add events to
7. Click "Import"

### Outlook

1. Download the `.ics` file
2. Open Outlook
3. Go to File > Open & Export > Import/Export
4. Select "Import an iCalendar (.ics) or vCalendar file"
5. Browse to the downloaded file
6. Click "OK"

### Apple Calendar

1. Download the `.ics` file
2. Double-click the file, or
3. Open Calendar app
4. Go to File > Import
5. Select the downloaded `.ics` file

### Mobile Devices

1. Email the `.ics` file to yourself
2. Open the email on your mobile device
3. Tap the `.ics` attachment
4. Select "Add to Calendar"

## Error Handling

The hook provides automatic error handling with toast notifications:

- **Success**: Shows "Event Exported" or "Calendar Exported" toast
- **Failure**: Shows "Export Failed" toast with error message

## Testing

Run the ICS export tests:

```bash
npm test -- server/tests/features/ics-export.test.ts
```

Test coverage includes:

- Single event ICS generation
- Multiple events ICS generation
- Default end time handling
- Unique UID generation
- Filename generation and sanitization
- Empty event array handling

## Security Considerations

- Calendar export endpoint requires authentication
- Event export respects event visibility settings (public/private)
- UIDs are unique per event to allow calendar applications to update events
- Filenames are sanitized to prevent security issues

## Performance Notes

- Single event export is lightweight and fast
- Multiple event export processes events in parallel
- Calendar range export is optimized for date range queries
- ICS generation is performed server-side to avoid client-side overhead

## Future Enhancements

Potential improvements for future versions:

1. **Recurring Events**: Add support for RRULE in ICS files
2. **Attendee Information**: Include event attendees in ICS
3. **Reminders**: Add alarm/reminder support
4. **Timezone Handling**: Enhanced timezone support for event display
5. **Batch Export**: Export entire calendar or community events
6. **Subscribe URL**: Generate calendar subscription URLs for live updates
