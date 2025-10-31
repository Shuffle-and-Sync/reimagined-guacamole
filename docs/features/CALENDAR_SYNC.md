# Calendar Sync Feature

## Overview

The Calendar Sync feature enables bidirectional synchronization between Shuffle & Sync events and external calendar platforms (Google Calendar and Outlook Calendar). Users can import events from their external calendars and export Shuffle & Sync events to their personal calendars.

## Features

### 🔄 Bidirectional Sync

- **Import**: Fetch events from Google/Outlook calendars into Shuffle & Sync
- **Export**: Push Shuffle & Sync events to external calendars
- **Configurable**: Choose sync direction per connection (import/export/both)

### 🔐 Secure Authentication

- OAuth 2.0 integration with Google Calendar (uses existing Google OAuth)
- Azure AD integration for Outlook Calendar
- Automatic token refresh (1-hour expiry)
- Encrypted token storage

### ⚙️ User Control

- Manual sync triggers
- Connection management (connect/disconnect calendars)
- Sync status monitoring
- Last sync time tracking

## Architecture

### Backend Components

#### Database Schema

- **`calendarConnections`**: Stores OAuth tokens, provider info, and sync settings per user
- **`externalEvents`**: Tracks synced events with bidirectional mapping to internal events

#### Services

- **`GoogleCalendarService`**: Handles all Google Calendar API interactions
- **`OutlookCalendarService`**: Handles all Microsoft Graph Calendar API interactions
- **`CalendarSyncService`**: Orchestrates bidirectional sync operations

#### API Routes

All routes are authenticated and require a valid user session:

| Endpoint                                          | Method | Description                       |
| ------------------------------------------------- | ------ | --------------------------------- |
| `/api/calendar-sync/connections`                  | GET    | List user's calendar connections  |
| `/api/calendar-sync/connections`                  | POST   | Connect new calendar              |
| `/api/calendar-sync/connections/:id`              | DELETE | Disconnect calendar               |
| `/api/calendar-sync/connections/:id/sync`         | POST   | Trigger manual sync               |
| `/api/calendar-sync/connections/:id/events`       | GET    | List external events              |
| `/api/calendar-sync/export/:eventId`              | POST   | Export event to external calendar |
| `/api/calendar-sync/provider/:provider/calendars` | GET    | List available calendars          |

### Frontend Components

#### Custom Hook

**`useCalendarSync`** - React hook providing:

- Query for calendar connections
- Mutations for creating/deleting connections
- Manual sync triggering
- Event export functionality
- Integrated with TanStack Query for caching
- Toast notifications for user feedback

#### UI Components

- **`CalendarSyncSettings`**: Full settings panel for managing calendar connections
- **`ExportEventButton`**: Button to export individual events to connected calendars
- **`CalendarSyncStatus`**: Status indicator showing sync health and connected calendars

## Setup

### Prerequisites

#### Google Calendar (Required)

Already configured if you have Google OAuth working:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Optional override:

- `GOOGLE_REDIRECT_URI` (defaults to OAuth callback)

#### Outlook Calendar (Optional)

Requires Azure AD application setup:

1. Go to [Azure Portal](https://portal.azure.com)
2. Create an Azure AD application
3. Configure API permissions:
   - `Calendars.ReadWrite`
   - `offline_access`
4. Create a client secret
5. Set environment variables:

```bash
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
```

### Database Migration

The calendar sync tables will be created automatically when you run:

```bash
npm run db:push
```

This creates:

- `calendar_connections` table
- `external_events` table

## Usage

### Backend API

#### Import Events from External Calendar

```typescript
import { calendarSyncService } from "./features/calendar-sync/calendar-sync.service";

// Trigger import for a specific connection
const importedCount = await calendarSyncService.importEvents(connectionId);
console.log(`Imported ${importedCount} events`);
```

#### Export Event to External Calendar

```typescript
// Export a Shuffle & Sync event to an external calendar
const externalEventId = await calendarSyncService.exportEvent(
  eventId,
  connectionId,
);
console.log(`Exported event with ID: ${externalEventId}`);
```

#### Periodic Sync (Background Job)

```typescript
// Run this via cron job or scheduled task
await calendarSyncService.syncAllConnections();
```

### Frontend Integration

#### Calendar Sync Settings Page

```typescript
import { CalendarSyncSettings } from '@/components/calendar/CalendarSyncSettings';

function SettingsPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Calendar Settings</h1>
      <CalendarSyncSettings />
    </div>
  );
}
```

#### Export Event Button

```typescript
import { ExportEventButton } from '@/components/calendar/ExportEventButton';

function EventDetails({ event }) {
  return (
    <div className="event-card">
      <h2>{event.title}</h2>
      <p>{event.description}</p>
      <div className="actions">
        <ExportEventButton eventId={event.id} />
      </div>
    </div>
  );
}
```

#### Sync Status Indicator

```typescript
import { CalendarSyncStatus } from '@/components/calendar/CalendarSyncStatus';

function Header() {
  return (
    <header className="flex items-center justify-between">
      <Logo />
      <div className="flex items-center gap-4">
        <CalendarSyncStatus variant="badge" />
        <UserMenu />
      </div>
    </header>
  );
}
```

#### Using the Hook Directly

```typescript
import { useCalendarSync } from '@/hooks/useCalendarSync';

function MyComponent() {
  const {
    connections,
    isLoadingConnections,
    syncConnection,
    exportEvent,
  } = useCalendarSync();

  const handleSync = async (connectionId: string) => {
    await syncConnection.mutateAsync(connectionId);
  };

  const handleExport = async (eventId: string, connectionId: string) => {
    await exportEvent.mutateAsync({ eventId, connectionId });
  };

  return (
    <div>
      {connections.map(conn => (
        <div key={conn.id}>
          <span>{conn.provider}</span>
          <button onClick={() => handleSync(conn.id)}>Sync</button>
        </div>
      ))}
    </div>
  );
}
```

## Event Format Conversion

The sync service automatically handles format conversion between Shuffle & Sync and external calendars:

### Mapped Fields

- **Title** → Summary/Subject
- **Description** → Description/Body
- **Location** → Location
- **Start Time** → Start Date/Time
- **End Time** → End Date/Time
- **Timezone** → Timezone
- **All-Day** → All-day flag
- **Status** → Event status (confirmed/tentative/cancelled)

### Raw Data Storage

Original event data is stored in JSON format for reference and debugging.

## Sync Direction

Each calendar connection can be configured with a sync direction:

- **`import`**: Only import events from external calendar to Shuffle & Sync
- **`export`**: Only export Shuffle & Sync events to external calendar
- **`both`**: Bidirectional sync (default)

## Token Management

### Automatic Refresh

- Tokens automatically refresh when expired (1-hour expiry)
- Refresh happens transparently during sync operations
- Failed refresh attempts are logged and reported to user

### Token Storage

- Access tokens and refresh tokens stored securely in database
- Encrypted at rest
- Associated with user ID for access control

## Error Handling

### Backend

- Comprehensive error logging with context
- Graceful degradation on token refresh failures
- Transaction support for data consistency

### Frontend

- Toast notifications for all operations
- Loading states during sync operations
- Error messages with actionable information

## Security Considerations

1. **Authentication Required**: All API endpoints require valid user session
2. **Authorization**: Users can only access their own calendar connections
3. **Token Encryption**: OAuth tokens stored encrypted in database
4. **HTTPS Only**: All external API calls use HTTPS
5. **Token Validation**: Azure credentials validated at runtime
6. **Cascade Deletion**: Deleting a connection removes all associated external events

## Limitations

- Maximum 2500 events per sync from Google Calendar
- Maximum 100 events per sync from Outlook Calendar (can be increased)
- Manual sync only (automatic periodic sync requires cron job setup)
- No conflict resolution UI (conflicts logged for review)
- No event update synchronization (only create/import)

## Future Enhancements

- [ ] Automatic periodic background sync via cron jobs
- [ ] Bidirectional event update synchronization
- [ ] Conflict resolution UI for scheduling conflicts
- [ ] Webhook support for real-time sync
- [ ] Multi-calendar support (sync to multiple calendars simultaneously)
- [ ] Calendar selection UI for choosing specific calendars
- [ ] Sync history and audit log
- [ ] Event filtering and exclusion rules

## Troubleshooting

### Connection Fails

**Google Calendar**:

1. Verify Google OAuth is working
2. Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
3. Ensure redirect URI is configured in Google Console

**Outlook Calendar**:

1. Verify Azure AD application is configured
2. Check all three Azure environment variables are set
3. Verify API permissions are granted

### Sync Fails

1. Check token expiry - tokens refresh automatically but may fail
2. Verify network connectivity to external APIs
3. Check application logs for detailed error messages
4. Ensure user has access to the calendar

### Events Not Appearing

1. Trigger manual sync via UI
2. Check sync direction is configured correctly
3. Verify events are within the sync time range
4. Check external event status (cancelled events may be excluded)

## API Documentation

For detailed API documentation, see:

- [Calendar Sync API Routes](../../reference/api/CALENDAR_SYNC_API.md) (to be created)
- [Main API Documentation](../../reference/api/API_DOCUMENTATION.md)

## Related Documentation

- [Database Architecture](../../architecture/DATABASE_ARCHITECTURE.md)
- [Authentication Guide](../../architecture/AUTHENTICATION.md)
- [ICS Export Feature](./ICS_EXPORT.md)
- [Calendar Date Range Filtering](./CALENDAR_DATE_RANGE_FILTERING.md)
