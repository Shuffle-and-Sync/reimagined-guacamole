# Event Scheduling & Promotion PRD - Audit Report

**Date:** December 2024  
**Version:** 1.0  
**Status:** Initial Audit Complete

## Executive Summary

This document provides a comprehensive audit of the calendar and scheduling functionality in Shuffle & Sync against the Event Scheduling & Promotion PRD requirements. The audit identifies existing features, gaps, and recommendations for enhancement.

### Overall Status
- **Backend Infrastructure:** ✅ Strong foundation with most core features implemented
- **Database Schema:** ✅ Comprehensive support for events, pods, and attendees
- **API Endpoints:** ✅ Key endpoints present with some gaps
- **Frontend UI:** ⚠️ Basic calendar interface exists but needs enhancement
- **Bulk Operations:** ⚠️ Backend support exists but no UI implementation
- **Graphics Generation:** ❌ Not implemented
- **Real-time Updates:** ⚠️ WebSocket infrastructure exists but not fully integrated

---

## 1. Calendar-Based Interface

### PRD Requirement
Calendar interface with monthly/weekly/daily views for event management.

### Current Implementation

#### ✅ What Exists
- **File:** `client/src/pages/calendar.tsx`
- Basic calendar interface with tab-based navigation
- Three main tabs: Overview, Calendar, My Events
- View mode toggle between "month" and "week" (state exists)
- Event filtering by type (tournament, convention, release, game_pod, community)
- Events automatically filtered by selected community
- Event cards with basic information (title, date, time, location, attendee count)

#### ⚠️ Gaps Identified
1. **No True Calendar Grid:** Current "calendar" view is a list/card grid, not a calendar grid with date cells
2. **No Daily View:** Only month/week toggle exists in state, but both render the same card grid
3. **No Visual Calendar Component:** Not using a proper calendar UI component (e.g., react-day-picker is imported in `ui/calendar.tsx` but not used on calendar page)
4. **No Date Navigation:** Cannot navigate between months/weeks
5. **No Drag-and-Drop:** Events cannot be moved by dragging

### Recommendation
**Priority: HIGH**
- Implement proper calendar grid component using react-day-picker or similar
- Add month/week/day view switching with actual visual differences
- Add date navigation controls (previous/next month, today button)
- Consider implementing drag-and-drop for event rescheduling

---

## 2. Bulk Scheduling via CSV Upload

### PRD Requirement
CSV upload functionality for bulk event creation.

### Current Implementation

#### ✅ Backend Support
- **Endpoint:** `POST /api/events/bulk`
- **File:** `server/features/events/events.routes.ts` (line 171-185)
- **Service:** `server/features/events/events.service.ts` (line 215-243)
- **Storage:** `server/storage.ts` - `createBulkEvents()` method
- Accepts array of events in request body
- Automatically creates TableSync sessions for game_pod events
- Validates recurrence patterns
- Rate limiting protection

#### ❌ Frontend UI Missing
- No CSV upload button or interface on calendar page
- No CSV parsing logic in client
- No CSV template download
- No validation/preview before upload
- No error handling for bulk operations

### Current API Contract
```typescript
interface BulkEventsRequest {
  events: CreateEventRequest[];
}

interface CreateEventRequest {
  title: string;
  description?: string;
  type: string;
  date: string;        // YYYY-MM-DD
  time: string;        // HH:MM
  location: string;
  communityId?: string;
  maxAttendees?: number;
  isPublic?: boolean;
  playerSlots?: number;
  alternateSlots?: number;
  gameFormat?: string;
  powerLevel?: number;
  recurrencePattern?: string;
}
```

### Recommendation
**Priority: MEDIUM**
- Add CSV upload button to calendar page header
- Implement CSV parser (consider using PapaParse library)
- Create CSV template for download
- Add preview/validation step before bulk creation
- Show progress indicator during upload
- Display summary of created events

**Sample CSV Template:**
```csv
title,description,type,date,time,location,communityId,playerSlots,gameFormat,powerLevel
Weekly EDH Pod,Commander night,game_pod,2024-12-20,18:00,Local Game Store,community-id,4,commander,7
Friday Night Magic,Standard tournament,tournament,2024-12-22,19:00,LGS Downtown,community-id,,,
```

---

## 3. Event Creation Form

### PRD Requirement
Event creation form with all required fields: title, date, time, type, description, location, pod size.

### Current Implementation

#### ✅ Fields Present
- **File:** `client/src/pages/calendar.tsx` (lines 348-453)
- Title (required)
- Type (required) - dropdown with 5 event types
- Date (required) - date picker
- Time (required) - time picker
- Location (required)
- Description (optional) - textarea
- Community selection (auto-set to selected community)

#### ❌ Pod-Specific Fields Missing from UI
While the backend schema and API support pod fields, the UI does not expose them:
- `playerSlots` - Number of main player slots (backend default: 4)
- `alternateSlots` - Number of alternate slots (backend default: 2)
- `gameFormat` - Commander, Standard, Limited, etc.
- `powerLevel` - 1-10 rating for power level matching
- `maxAttendees` - General attendee limit

#### ⚠️ Additional Missing Fields
- `isPublic` - Public/private event toggle
- `isRecurring` - Recurring event checkbox
- `recurrencePattern` - Daily/weekly/monthly selection
- `recurrenceInterval` - Every X days/weeks/months
- `recurrenceEndDate` - When recurring events stop

### Current Event Types
```typescript
const EVENT_TYPES = [
  { id: "tournament", name: "Tournament", icon: "fas fa-trophy", color: "bg-yellow-500" },
  { id: "convention", name: "Convention", icon: "fas fa-building", color: "bg-purple-500" },
  { id: "release", name: "Product Release", icon: "fas fa-box", color: "bg-blue-500" },
  { id: "game_pod", name: "Game Pod", icon: "fas fa-gamepad", color: "bg-red-500" },
  { id: "community", name: "Community Event", icon: "fas fa-users", color: "bg-green-500" }
];
```

### Recommendation
**Priority: HIGH**
- Add conditional form sections based on event type
- For `game_pod` type, show:
  - Player Slots (2-8, default 4)
  - Alternate Slots (0-4, default 2)
  - Game Format dropdown (Commander, Standard, Modern, Limited, etc.)
  - Power Level slider (1-10)
- For all events, add:
  - Max Attendees field (optional, null = unlimited)
  - Public/Private toggle
  - Recurring event section (collapsible)
- Add field validation and helpful tooltips
- Show character count for description field

---

## 4. Player Pod Management

### PRD Requirement
Pod management with roles, waitlist, and real-time status updates.

### Current Implementation

#### ✅ Database Schema
**File:** `shared/schema.ts`

Events table includes:
```typescript
playerSlots: integer("player_slots").default(4),      // 2-4 main slots
alternateSlots: integer("alternate_slots").default(2), // Alternate slots
gameFormat: varchar("game_format"),                    // Commander, etc.
powerLevel: integer("power_level"),                    // 1-10 rating
```

Event Attendees table includes:
```typescript
status: attendeeStatusEnum("status").default("attending"), // attending, maybe, not_attending
role: varchar("role").default("participant"),              // participant, host, co_host, spectator
playerType: varchar("player_type").default("main"),        // main, alternate
```

#### ✅ Backend Logic
**File:** `server/routes.ts` (lines 2490-2565)

Join Event Logic:
- Checks if pod is full
- Assigns playerType (main or alternate)
- Sends notifications when pod is full or almost full
- Tracks main players vs alternates separately

Notification Types:
- `pod_filled` - When all main slots are filled
- `pod_almost_full` - When 1 slot remains
- `event_join` - When someone joins
- `event_leave` - When someone leaves
- `spectator_join` - For spectator mode

#### ⚠️ Gaps in Pod Management
1. **No Explicit Waitlist:** When pod is full, users get alternate slots but no true waitlist queue
2. **No Auto-Promotion:** When main player leaves, alternates don't auto-promote
3. **No Pod Status UI:** Frontend doesn't show pod filling status (e.g., "3/4 players")
4. **No Role Management UI:** Cannot assign/change roles from frontend
5. **No Spectator Mode:** Schema supports spectators but no UI implementation

#### ✅ TableSync Integration
**File:** `server/storage.ts` (createEvent method)

Auto-creates TableSync game sessions for `game_pod` events:
```typescript
if (event.type === 'game_pod') {
  const gameSessionData = {
    eventId: event.id,
    hostId: event.creatorId,
    status: 'waiting',
    currentPlayers: 0,
    maxPlayers: event.playerSlots || 4,
    gameData: {
      name: event.title,
      format: event.gameFormat || 'commander',
      powerLevel: event.powerLevel || 'casual',
      description: event.description || '',
    },
    communityId: event.communityId,
  };
  await this.createGameSession(gameSessionData);
}
```

### Recommendation
**Priority: HIGH**
- Add pod status display on event cards (e.g., "3/4 Main | 1/2 Alternates")
- Create dedicated pod management UI for event hosts:
  - See all participants with roles and status
  - Manually promote alternates to main
  - Remove/ban problematic players
  - Set player as spectator
- Implement true waitlist queue:
  - When pod full, add to waitlist instead of alternate
  - Auto-notify waitlist when slot opens
  - Show waitlist position to users
- Add real-time pod status updates using WebSocket
- Show pod composition on event detail page

---

## 5. TableSync Integration

### PRD Requirement
Automatic TableSync event creation and two-way sync.

### Current Implementation

#### ✅ Auto-Creation (One Direction)
**Files:**
- `server/storage.ts` - createEvent() (lines documented above)
- `server/storage.ts` - createBulkEvents() (same logic)

When creating a `game_pod` event:
1. Event is created in events table
2. Game session is automatically created in game_sessions table
3. Session linked via eventId foreign key
4. Game format, power level, and description copied to session

#### ✅ TableSync Creates Events
**File:** `client/src/pages/tablesync.tsx` (lines 131-162)

When creating a game room from TableSync:
1. Creates temporary event first
2. Then creates game session linked to that event
3. Event marked as "TableSync Remote" location

#### ⚠️ Two-Way Sync Gaps
1. **No Event → Session Updates:** If event details change (time, format, etc.), session not updated
2. **No Session → Event Updates:** If session status changes, event not updated
3. **No Sync Status Indicator:** Cannot see if event and session are in sync
4. **No Conflict Resolution:** If both are edited, unclear which takes precedence

### Recommendation
**Priority: MEDIUM**
- Implement event listener/webhook system for bidirectional sync:
  - When event updated → update linked game session
  - When session status changes → update event status
  - When session ends → mark event as completed
- Add sync status indicator on events with linked sessions
- Handle delete cascade properly (if event deleted, cancel session)
- Consider sync audit log for debugging

---

## 6. Promotional Graphic Generator

### PRD Requirement
`/api/graphics/generate` endpoint to generate promotional graphics for events.

### Current Implementation

#### ❌ Not Implemented
- No `/api/graphics/generate` endpoint exists
- No graphics generation service
- No image template system
- No frontend UI for graphic generation

### Recommendation
**Priority: LOW-MEDIUM**

This is a completely new feature. Recommended approach:

**Backend:**
1. Add image generation library (e.g., node-canvas, sharp, or Puppeteer)
2. Create graphics service: `server/services/graphics-generator.ts`
3. Design event graphic templates (consider using HTML/CSS rendered to image)
4. Add endpoint: `POST /api/graphics/generate`
   ```typescript
   interface GenerateGraphicRequest {
     eventId: string;
     template?: 'modern' | 'classic' | 'minimal';
     includeQR?: boolean;
   }
   ```
5. Return image as base64 or temporary URL

**Frontend:**
1. Add "Generate Graphic" button to event details
2. Show preview of generated graphic
3. Allow download as PNG/JPG
4. Option to share directly to social media

**Sample Templates:**
- Event title + date/time in large text
- Community branding/colors
- QR code linking to event page
- Game format/type badges
- Background image based on event type

**Libraries to Consider:**
- `sharp` - High-performance image processing
- `canvas` - Server-side canvas rendering
- `Puppeteer` - Render HTML to image (heavier but flexible)
- `qrcode` - QR code generation (already in package.json)

---

## 7. Notification System

### PRD Requirement
Comprehensive notification system for pod status and event changes.

### Current Implementation

#### ✅ Database Schema
**File:** `shared/schema.ts`

```typescript
export const notificationTypeEnum = pgEnum('notification_type', [
  'event_join', 
  'event_leave', 
  'game_invite', 
  'message', 
  'system', 
  'friend_request', 
  'friend_accepted', 
  'pod_filled',        // ✅ Implemented
  'pod_almost_full',   // ✅ Implemented
  'spectator_join'     // ✅ Schema exists
]);

export const notificationPriorityEnum = pgEnum('notification_priority', [
  'low', 'normal', 'high', 'urgent'
]);
```

Notification fields:
- userId, type, title, message
- data (JSONB for context)
- isRead, priority
- communityId
- createdAt, expiresAt

#### ✅ Implemented Notifications
**File:** `server/routes.ts`

1. **Pod Filled** (line ~2512-2524)
   - Trigger: When last main player slot filled
   - Recipients: All participants
   - Priority: high

2. **Pod Almost Full** (line ~2525-2533)
   - Trigger: When one main slot remains
   - Recipients: Event creator
   - Priority: normal

3. **Event Join** (notification system ready, can be expanded)
4. **Event Leave** (line ~2546-2557)
   - Trigger: When participant leaves
   - Recipients: Event creator
   - Priority: normal

#### ⚠️ Missing Notification Triggers (per PRD)
Based on typical PRD requirements for event scheduling, likely missing:
1. **Event Reminder** - X hours before event starts
2. **Event Update** - When event details change
3. **Event Cancelled** - When event is cancelled
4. **Waitlist Promoted** - When moved from alternate to main
5. **Event Starting Soon** - 15-30 min warning
6. **Event Ended** - Post-event summary
7. **RSVP Deadline** - Reminder before RSVP closes
8. **Capacity Warning** - For event creators when nearing capacity

#### ⚠️ User Notification Preferences
**File:** `shared/schema.ts` (lines ~90-110)

Schema includes comprehensive notification settings in users table:
```typescript
notificationSettings: jsonb("notification_settings").default({
  browser: true,
  email: true,
  push: false,
  sms: false,
  webhook: false,
  
  streamStarted: { browser: true, email: false, push: true, sms: false },
  streamEnded: { browser: true, email: false, push: false, sms: false },
  collaborationInvite: { browser: true, email: true, push: true, sms: false },
  raidIncoming: { browser: true, email: false, push: true, sms: false },
  eventReminders: { browser: true, email: true, push: true, sms: false },
  friendRequests: { browser: true, email: true, push: false, sms: false },
  // ... more
})
```

This is excellent foundation but needs:
- Specific settings for each event notification type
- UI to manage these preferences
- Respect user preferences when sending notifications

### Recommendation
**Priority: MEDIUM-HIGH**

1. **Add Missing Notification Types:**
   ```typescript
   export const notificationTypeEnum = pgEnum('notification_type', [
     // ... existing
     'event_reminder',
     'event_updated',
     'event_cancelled',
     'waitlist_promoted',
     'event_starting_soon',
     'event_ended',
     'rsvp_deadline',
     'capacity_warning'
   ]);
   ```

2. **Implement Notification Service:**
   Create `server/services/event-notifications.ts`:
   - Centralized notification logic
   - Respect user preferences
   - Support multiple delivery channels
   - Batch notifications to reduce spam

3. **Add Scheduled Notifications:**
   - Cron job or scheduled task for reminders
   - Check events starting in next 24h, 1h, etc.
   - Send appropriate reminders

4. **Frontend Improvements:**
   - Real-time notification dropdown
   - Notification center page
   - Mark as read functionality
   - Filter by type/priority

5. **Email Templates:**
   - Design email templates for each notification type
   - Include event details and action buttons
   - Add "Manage Preferences" footer link

---

## 8. API Endpoints Review

### PRD Required Endpoints

#### ✅ Implemented

| Endpoint | Method | File | Notes |
|----------|--------|------|-------|
| `/api/events` | GET | events.routes.ts:14 | With filters (communityId, type, upcoming) |
| `/api/events` | POST | events.routes.ts:52 | Create single event |
| `/api/events/:id` | GET | events.routes.ts:34 | Get specific event |
| `/api/events/:id` | PUT | events.routes.ts:65 | Update event |
| `/api/events/:id` | DELETE | events.routes.ts:92 | Delete event |
| `/api/events/bulk` | POST | events.routes.ts:171 | Bulk create events ✅ |
| `/api/events/recurring` | POST | events.routes.ts:188 | Create recurring events ✅ |
| `/api/events/:eventId/join` | POST | events.routes.ts:119 | Join event ✅ |
| `/api/events/:eventId/leave` | DELETE | events.routes.ts:141 | Leave event |
| `/api/events/:eventId/attendees` | GET | events.routes.ts:159 | Get attendees list |
| `/api/calendar/events` | GET | events.routes.ts:221 | Calendar view with date range ✅ |
| `/api/user/events` | GET | events.routes.ts:206 | User's event attendance |

#### ❌ Missing (per PRD)

| Endpoint | Purpose | Priority |
|----------|---------|----------|
| `/api/graphics/generate` | Generate promotional graphics | Medium |
| `/api/events/:id/duplicate` | Quick duplicate event | Low |
| `/api/events/:id/export` | Export event to iCal/Google Calendar | Low |
| `/api/events/:id/share` | Get shareable link with metadata | Low |

#### ⚠️ Recommendations for Existing Endpoints

1. **GET /api/events**
   - Add pagination support (currently returns all matching)
   - Add sorting options (date, popularity, attendees)
   - Add search/text filter
   ```typescript
   // Recommended query params
   ?page=1&limit=20&sort=date&order=asc&search=tournament
   ```

2. **POST /api/events/:eventId/join**
   - Currently accepts optional role, status, playerType
   - Should validate pod capacity before allowing join
   - Should return waitlist position if pod full
   - Consider rate limiting (prevent spam joins)

3. **GET /api/calendar/events**
   - Good date range filtering exists
   - Consider adding groupBy option (day, week, month)
   - Add timezone support for international communities

### Additional Useful Endpoints to Consider

```typescript
// Pod-specific endpoints
GET /api/events/:id/pod-status        // Get current pod filling status
POST /api/events/:id/promote/:userId  // Promote alternate to main (host only)
POST /api/events/:id/spectate         // Join as spectator

// Notification management
GET /api/notifications                 // Get user notifications
PUT /api/notifications/:id/read       // Mark as read
DELETE /api/notifications/:id         // Dismiss notification
POST /api/notifications/mark-all-read // Bulk mark as read

// Calendar management
GET /api/events/conflicts              // Check for scheduling conflicts
POST /api/events/suggest-times         // AI-suggested event times
```

---

## 9. Responsive UI & Drag-and-Drop

### PRD Requirement
Fully responsive interface with drag-and-drop event management and real-time updates.

### Current Implementation

#### ✅ Responsive Design
**File:** `client/src/pages/calendar.tsx`

- Uses Tailwind CSS responsive classes throughout
- Grid layouts adapt: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Mobile-friendly card designs
- Responsive tabs and dialogs
- Good use of spacing and breakpoints

**Responsive Patterns Found:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">  // 2-col on desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">  // 3-col on large
<div className="flex flex-col items-end space-y-2">  // Stack on mobile
```

#### ❌ Drag-and-Drop Not Implemented
- No drag-and-drop library integrated
- Events cannot be dragged to reschedule
- No visual feedback for draggable elements
- No drop zones for date cells

#### ⚠️ Real-time Updates Partially Implemented

**WebSocket Infrastructure Exists:**
- `server/utils/websocket-server-enhanced.ts` - Enhanced WebSocket server
- `shared/websocket-schemas.ts` - WebSocket message schemas
- WebSocket server mounted in `server/routes.ts`

**But Not Used for Events:**
- Calendar page uses React Query polling (refetch on window focus)
- No WebSocket subscription for event updates
- No real-time participant list updates
- No live pod status changes

### Recommendation
**Priority: MEDIUM-HIGH**

#### 1. Implement Drag-and-Drop
Use `react-beautiful-dnd` or `@dnd-kit/core`:

```typescript
// Example with @dnd-kit
import { DndContext, DragEndEvent } from '@dnd-kit/core';

function CalendarGrid() {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over) {
      // Update event date to the dropped date cell
      updateEventMutation.mutate({
        eventId: active.id,
        date: over.id // date cell ID
      });
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      {/* Calendar cells and draggable events */}
    </DndContext>
  );
}
```

Features to implement:
- Drag event cards to different dates
- Visual drag preview
- Drop zones highlight on hover
- Confirm dialog for date changes
- Snap to time slots for weekly/daily views

#### 2. Implement Real-time Updates

Add WebSocket subscription in calendar page:

```typescript
// client/src/pages/calendar.tsx
useEffect(() => {
  const ws = new WebSocket('ws://localhost:3000');
  
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    
    if (message.type === 'EVENT_UPDATED' || 
        message.type === 'EVENT_JOINED' || 
        message.type === 'EVENT_LEFT') {
      // Invalidate query to refetch events
      queryClient.invalidateQueries(['/api/events']);
    }
  };
  
  return () => ws.close();
}, [selectedCommunity]);
```

Backend WebSocket messages to add:
```typescript
// server/routes.ts - after event operations
broadcast({
  type: 'EVENT_CREATED',
  eventId: event.id,
  communityId: event.communityId
});

broadcast({
  type: 'EVENT_UPDATED',
  eventId: event.id,
  changes: ['date', 'time']
});

broadcast({
  type: 'POD_STATUS_CHANGED',
  eventId: event.id,
  mainPlayers: 3,
  maxPlayers: 4
});
```

Real-time Features:
- Event creation/updates appear instantly for all users
- Pod status updates live (X/4 players)
- New attendees show immediately
- Event cancellations broadcast instantly

#### 3. UI Performance Optimizations

For real-time and drag-drop:
- Implement virtual scrolling for large event lists
- Debounce drag operations
- Optimistic UI updates (update UI before API response)
- Use React.memo for event cards to prevent unnecessary re-renders

---

## 10. Database Schema Validation

### PRD Requirement
Database must support pods, participants, roles, statuses, and all event details.

### Current Implementation - Excellent! ✅

#### Events Table
**File:** `shared/schema.ts` (lines 183-222)

All required fields present:
- ✅ Core: id, title, description, type, date, time, location
- ✅ Associations: communityId, creatorId, hostId, coHostId
- ✅ Capacity: maxAttendees
- ✅ Pod fields: playerSlots, alternateSlots, gameFormat, powerLevel
- ✅ Recurring: isRecurring, recurrencePattern, recurrenceInterval, recurrenceEndDate, parentEventId
- ✅ Status: status (active, cancelled, completed, draft)
- ✅ Privacy: isPublic
- ✅ Timestamps: createdAt, updatedAt

**Indexes for Performance:**
```sql
idx_events_creator_id              -- Find user's created events
idx_events_community_id            -- Filter by community
idx_events_date                    -- Sort by date
idx_events_status                  -- Filter active/cancelled
idx_events_scheduled_at            -- Composite date+time
idx_events_community_scheduled     -- Community + date + time
idx_events_community_date_status   -- Complex queries
```

#### Event Attendees Table
**File:** `shared/schema.ts` (lines 225-239)

All required participant tracking:
- ✅ Link to event and user
- ✅ Status: attending, maybe, not_attending
- ✅ Role: participant, host, co_host, spectator
- ✅ PlayerType: main, alternate (for pods)
- ✅ Timestamp: joinedAt

**Indexes:**
```sql
idx_event_attendees_event_id      -- Get all attendees for event
idx_event_attendees_user_id       -- Get user's event attendance
idx_event_attendees_composite     -- Event+user combo queries
idx_event_attendees_status        -- Filter by status+role
```

#### Enums - Type Safety ✅
```typescript
eventTypeEnum: ['tournament', 'convention', 'release', 'stream', 'community', 'personal', 'game_pod']
eventStatusEnum: ['active', 'cancelled', 'completed', 'draft']
attendeeStatusEnum: ['attending', 'maybe', 'not_attending']
```

### Schema Strengths
1. **Comprehensive field coverage** - All PRD requirements met
2. **Strong performance indexing** - 7+ strategic indexes
3. **Type safety** - PostgreSQL enums prevent invalid data
4. **Cascading deletes** - Proper foreign key constraints
5. **Flexibility** - JSONB fields for extensibility
6. **Recurring events** - Full support with parent/child linking

### Minor Recommendations
1. **Add constraint validation:**
   ```sql
   CHECK (player_slots >= 2 AND player_slots <= 8)
   CHECK (alternate_slots >= 0 AND alternate_slots <= 4)
   CHECK (power_level >= 1 AND power_level <= 10)
   CHECK (date >= CURRENT_DATE) -- Prevent past events
   ```

2. **Consider soft deletes:**
   Add `deletedAt` timestamp instead of hard deletes to preserve event history

3. **Event analytics:**
   Consider adding fields:
   - `viewCount` - Track event page views
   - `shareCount` - Track social shares
   - `peakAttendees` - Highest attendance reached

---

## 11. Testing & Quality Assurance

### Current Test Coverage

#### ✅ Tests That Exist
**File:** `server/tests/features/calendar.test.ts`

Basic integration tests:
- Timezone handling
- Date range validation
- Scheduling conflict detection
- Event capacity limits

**Test Quality:** Basic mock-based tests, but no actual API/database integration tests.

#### ❌ Missing Test Coverage

1. **Event CRUD Operations**
   - Create event with all field combinations
   - Update event validation
   - Delete event cascade effects
   - Bulk event creation

2. **Pod Management**
   - Join event when slots available
   - Join event when pod full (should get alternate)
   - Promote alternate to main
   - Leave event and slot reclamation

3. **Recurring Events**
   - Daily recurrence generation
   - Weekly recurrence
   - Monthly recurrence
   - End date handling

4. **Notifications**
   - Pod filled notification sent
   - Event reminder notifications
   - Notification preference filtering

5. **TableSync Integration**
   - Game session created when event created
   - Session updated when event updated
   - Event status updated when session ends

6. **Authorization**
   - Only creator can edit/delete event
   - Only attendees can leave event
   - Host can manage pod participants

### Recommendation
**Priority: HIGH**

Create comprehensive test suite:

```typescript
// server/tests/features/events.integration.test.ts
describe('Event Management Integration', () => {
  describe('Event Creation', () => {
    test('creates event with all required fields');
    test('auto-creates TableSync session for game_pod');
    test('validates pod slots are within limits');
    test('rejects past dates');
  });

  describe('Pod Management', () => {
    test('assigns main slot when available');
    test('assigns alternate slot when pod full');
    test('sends notification when pod filled');
    test('promotes alternate when main leaves');
  });

  describe('Bulk Operations', () => {
    test('creates multiple events from array');
    test('validates all events before creating any');
    test('rolls back on partial failure');
  });

  describe('Recurring Events', () => {
    test('generates daily recurring events');
    test('stops at end date');
    test('links parent and child events');
  });
});
```

---

## 12. Documentation Review

### Current Documentation

#### ✅ Exists
- `API_DOCUMENTATION.md` - General API docs
- `replit.md` - Setup and development guide
- Code comments in key files
- TypeScript interfaces serve as inline documentation

#### ⚠️ Needs Enhancement

1. **Event API Documentation**
   - Bulk upload endpoint not documented
   - Recurring events endpoint not documented
   - Calendar endpoint not documented
   - Missing request/response examples

2. **Pod Management Guide**
   - No explanation of pod lifecycle
   - No diagram of player states (main → alternate → waitlist)
   - Missing best practices for hosts

3. **Frontend Component Documentation**
   - Calendar page not documented
   - Missing props documentation
   - No usage examples

### Recommendation
**Priority: LOW-MEDIUM**

Create/update documentation:

1. **EVENT_API_GUIDE.md**
   ```markdown
   # Event Management API Guide
   
   ## Creating Events
   ### Single Event
   POST /api/events
   
   ### Bulk Upload
   POST /api/events/bulk
   
   ### Recurring Events
   POST /api/events/recurring
   
   ## Pod Management
   ...
   ```

2. **POD_MANAGEMENT_GUIDE.md**
   - How pods work
   - Player states and transitions
   - Host responsibilities
   - Notification triggers

3. **Update API_DOCUMENTATION.md**
   Add events section with all endpoints

4. **Component Documentation**
   Add JSDoc comments to calendar components:
   ```typescript
   /**
    * Calendar page component for viewing and managing events
    * 
    * Features:
    * - Monthly/weekly calendar views
    * - Event creation and editing
    * - Pod status tracking
    * - Real-time updates via WebSocket
    * 
    * @requires Authentication - Users must be logged in
    * @requires Community Selection - Events filtered by selected community
    */
   export default function Calendar() {
   ```

---

## Summary & Priority Recommendations

### Critical Priorities (Implement First)

1. **✅ COMPLETE: Backend Foundation**
   - Events, pods, attendees fully supported
   - APIs functional
   - Database schema excellent

2. **🔴 HIGH: Pod Management UI (Gaps identified)**
   - Add pod-specific fields to event creation form
   - Display pod status (X/4 main, X/2 alternates)
   - Show participant lists with roles
   - Host tools for managing participants

3. **🔴 HIGH: Calendar View Enhancement**
   - Implement proper calendar grid (not just card list)
   - True month/week/day views
   - Date navigation
   - Better visual event representation

4. **🔴 HIGH: Notification Enhancement**
   - Add missing notification types (reminders, updates, cancellations)
   - Implement scheduled notifications (cron jobs)
   - Frontend notification center
   - Email delivery

### Medium Priorities (Phase 2)

5. **🟡 MEDIUM: CSV Bulk Upload UI**
   - Upload button and file picker
   - CSV parser
   - Template download
   - Preview/validation

6. **🟡 MEDIUM: Real-time Updates**
   - WebSocket event subscriptions
   - Live pod status
   - Instant participant updates
   - Real-time notifications

7. **🟡 MEDIUM: TableSync Two-Way Sync**
   - Bidirectional updates
   - Sync status indicators
   - Conflict resolution

8. **🟡 MEDIUM: Drag-and-Drop**
   - Drag events to reschedule
   - Visual feedback
   - Drop validation

### Lower Priorities (Nice to Have)

9. **🟢 LOW: Promotional Graphics**
   - Graphics generation service
   - Templates
   - Social sharing

10. **🟢 LOW: Enhanced Features**
    - Event duplication
    - iCal export
    - Suggested event times
    - Conflict detection

### Testing & Documentation

11. **🔴 HIGH: Comprehensive Testing**
    - Integration tests for all features
    - Pod management tests
    - Bulk operation tests
    - Authorization tests

12. **🟡 MEDIUM: Documentation Updates**
    - Event API guide
    - Pod management guide
    - Component documentation
    - User guides

---

## Conclusion

The Shuffle & Sync event scheduling system has a **strong backend foundation** with comprehensive database schema, robust APIs, and good architectural patterns. The main gaps are in the **frontend user experience** and **advanced features** like real-time updates and promotional graphics.

**Estimated Work to Full PRD Compliance:**
- High Priority Items: ~40-60 hours
- Medium Priority Items: ~30-40 hours  
- Low Priority Items: ~20-30 hours
- Testing & Documentation: ~20-30 hours

**Total: 110-160 hours** (approximately 3-4 weeks for one developer)

The system is **production-ready for basic event scheduling** but needs enhancement for the full PRD vision, particularly around pod management UX, real-time collaboration, and promotional tools.

---

**Audit completed by:** GitHub Copilot  
**Review date:** December 2024  
**Next review:** After implementation of high-priority items
