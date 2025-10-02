# Event Scheduling & Promotion - Implementation Roadmap

**Based on PRD Audit - December 2024**

This document provides a prioritized implementation roadmap for achieving full compliance with the Event Scheduling & Promotion PRD.

## Quick Reference: Current State

| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Basic Event CRUD | ✅ Complete | ✅ Complete | Production Ready |
| Event Types (5 types) | ✅ Complete | ✅ Complete | Production Ready |
| Community Filtering | ✅ Complete | ✅ Complete | Production Ready |
| Bulk Event API | ✅ Complete | ❌ No UI | Backend Only |
| Recurring Events API | ✅ Complete | ❌ No UI | Backend Only |
| Pod Fields (schema) | ✅ Complete | ❌ No UI | Backend Only |
| Pod Attendee Tracking | ✅ Complete | ⚠️ Basic | Needs Enhancement |
| TableSync Auto-Create | ✅ Complete | N/A | Production Ready |
| Notifications (basic) | ✅ Complete | ⚠️ Basic | Needs Enhancement |
| Calendar Grid View | N/A | ❌ Card List | Needs Implementation |
| CSV Upload | ✅ API Ready | ❌ No UI | Needs Implementation |
| Real-time Updates | ✅ WebSocket | ❌ Not Wired | Needs Implementation |
| Drag-and-Drop | N/A | ❌ Missing | Needs Implementation |
| Promotional Graphics | ❌ No API | ❌ No UI | Not Started |

---

## Phase 1: Critical UX Improvements (Week 1-2)

**Goal:** Make the calendar interface production-ready with proper pod management

### 1.1 Calendar Grid Component (3-5 days)
**Priority: CRITICAL**

**Implementation:**
```typescript
// client/src/components/calendar/CalendarGrid.tsx

import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

export function CalendarGrid({ events, onDateSelect, viewMode }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Render calendar with events on each day
  const renderDay = (date: Date) => {
    const dayEvents = events.filter(e => e.date === format(date, 'yyyy-MM-dd'));
    
    return (
      <div className="calendar-day">
        <div className="day-number">{format(date, 'd')}</div>
        {dayEvents.map(event => (
          <EventPill key={event.id} event={event} />
        ))}
      </div>
    );
  };
  
  return (
    <CalendarUI
      mode="single"
      selected={selectedDate}
      onSelect={setSelectedDate}
      components={{ Day: renderDay }}
    />
  );
}
```

**Tasks:**
- [ ] Create CalendarGrid component using react-day-picker
- [ ] Add month/week/day view switching (actual visual differences)
- [ ] Implement date navigation (prev/next, today button)
- [ ] Display events on calendar dates
- [ ] Add event pills with color coding
- [ ] Make dates clickable to show day details
- [ ] Add mini calendar sidebar for date selection

**Files to Modify:**
- `client/src/pages/calendar.tsx` - Replace card grid with calendar component
- Create `client/src/components/calendar/CalendarGrid.tsx`
- Create `client/src/components/calendar/EventPill.tsx`
- Create `client/src/components/calendar/DayView.tsx`

---

### 1.2 Pod Management UI (4-6 days)
**Priority: CRITICAL**

**Implementation:**
```typescript
// client/src/components/events/PodStatus.tsx

export function PodStatus({ event, attendees }) {
  const mainPlayers = attendees.filter(a => 
    a.playerType === 'main' && a.status === 'attending'
  );
  const alternates = attendees.filter(a => 
    a.playerType === 'alternate' && a.status === 'attending'
  );
  
  const mainFilled = mainPlayers.length;
  const mainTotal = event.playerSlots || 4;
  const altFilled = alternates.length;
  const altTotal = event.alternateSlots || 2;
  
  return (
    <Card className="pod-status">
      <CardHeader>
        <CardTitle>Pod Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Main Players Progress */}
          <div>
            <div className="flex justify-between mb-2">
              <span>Main Players</span>
              <span className="font-bold">{mainFilled}/{mainTotal}</span>
            </div>
            <Progress value={(mainFilled / mainTotal) * 100} />
          </div>
          
          {/* Alternates Progress */}
          <div>
            <div className="flex justify-between mb-2">
              <span>Alternates</span>
              <span className="font-bold">{altFilled}/{altTotal}</span>
            </div>
            <Progress value={(altFilled / altTotal) * 100} />
          </div>
          
          {/* Player List */}
          <div className="space-y-2">
            <h4 className="font-semibold">Players</h4>
            {mainPlayers.map(player => (
              <PlayerCard key={player.id} player={player} type="main" />
            ))}
            {alternates.map(player => (
              <PlayerCard key={player.id} player={player} type="alternate" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Tasks:**
- [ ] Add pod-specific fields to event creation form
  - [ ] Player Slots slider (2-8, default 4)
  - [ ] Alternate Slots slider (0-4, default 2)
  - [ ] Game Format dropdown (Commander, Standard, Modern, etc.)
  - [ ] Power Level slider (1-10)
- [ ] Create PodStatus component showing fill status
- [ ] Display pod composition on event cards
- [ ] Show "X/4 Main | X/2 Alternates" badge
- [ ] Create participant list with roles
- [ ] Add host controls for managing participants
  - [ ] Promote alternate to main
  - [ ] Change player role
  - [ ] Remove player
- [ ] Visual indicators for pod state (full, almost full, available)

**Files to Create:**
- `client/src/components/events/PodStatus.tsx`
- `client/src/components/events/PodFieldsForm.tsx`
- `client/src/components/events/ParticipantList.tsx`
- `client/src/components/events/PlayerCard.tsx`

**Files to Modify:**
- `client/src/pages/calendar.tsx` - Add pod fields to form
- `client/src/pages/calendar.tsx` - Show pod status on event cards

---

### 1.3 Enhanced Notifications (3-4 days)
**Priority: HIGH**

**Backend Tasks:**
- [ ] Add missing notification types to enum:
  ```typescript
  'event_reminder',
  'event_updated', 
  'event_cancelled',
  'waitlist_promoted',
  'event_starting_soon',
  'event_ended',
  'rsvp_deadline',
  'capacity_warning'
  ```
- [ ] Create event notification service
- [ ] Implement scheduled notification cron job
- [ ] Add 24h, 1h, 15m event reminders
- [ ] Send notifications on event updates
- [ ] Respect user notification preferences

**Frontend Tasks:**
- [ ] Create notification dropdown in header
- [ ] Build notification center page
- [ ] Add mark as read functionality
- [ ] Show unread count badge
- [ ] Filter notifications by type
- [ ] Add notification preferences UI

**Files to Create:**
- `server/services/event-notifications.ts`
- `server/jobs/notification-scheduler.ts`
- `client/src/components/notifications/NotificationDropdown.tsx`
- `client/src/pages/notifications.tsx`

**Files to Modify:**
- `shared/schema.ts` - Add notification types
- `server/routes.ts` - Trigger notifications on event changes
- `client/src/shared/components/Header.tsx` - Add notification bell

---

## Phase 2: Data Import & Real-time Features (Week 3-4)

### 2.1 CSV Bulk Upload Interface (3-4 days)
**Priority: MEDIUM-HIGH**

**Implementation:**
```typescript
// client/src/components/events/BulkUpload.tsx

import { parse } from 'papaparse';

export function BulkUploadDialog({ isOpen, onClose }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    parse(file, {
      header: true,
      complete: (results) => {
        setPreview(results.data);
      }
    });
  };
  
  const handleUpload = async () => {
    const events = preview.map(row => ({
      title: row.title,
      description: row.description,
      type: row.type,
      date: row.date,
      time: row.time,
      location: row.location,
      playerSlots: parseInt(row.playerSlots) || 4,
      gameFormat: row.gameFormat,
      powerLevel: parseInt(row.powerLevel)
    }));
    
    await fetch('/api/events/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events })
    });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* Upload interface */}
    </Dialog>
  );
}
```

**Tasks:**
- [ ] Add CSV upload button to calendar page
- [ ] Install papaparse library for CSV parsing
- [ ] Create upload dialog with file picker
- [ ] Parse CSV and validate format
- [ ] Show preview table before upload
- [ ] Validate all events before submitting
- [ ] Show progress indicator during upload
- [ ] Display results summary (created, errors)
- [ ] Create downloadable CSV template
- [ ] Add example CSV file

**Files to Create:**
- `client/src/components/events/BulkUploadDialog.tsx`
- `client/src/components/events/BulkUploadPreview.tsx`
- `public/templates/events-template.csv`

---

### 2.2 Real-time Event Updates (4-5 days)
**Priority: MEDIUM-HIGH**

**Backend WebSocket Messages:**
```typescript
// server/websocket-events.ts

export function broadcastEventUpdate(event: Event) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'EVENT_UPDATED',
        eventId: event.id,
        communityId: event.communityId,
        changes: event
      }));
    }
  });
}

export function broadcastPodStatusChange(eventId: string, status: any) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'POD_STATUS_CHANGED',
        eventId,
        status
      }));
    }
  });
}
```

**Frontend Subscription:**
```typescript
// client/src/pages/calendar.tsx

useEffect(() => {
  const ws = new WebSocket(`ws://${window.location.host}`);
  
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    
    switch (message.type) {
      case 'EVENT_CREATED':
      case 'EVENT_UPDATED':
      case 'EVENT_DELETED':
        queryClient.invalidateQueries(['/api/events']);
        break;
      case 'POD_STATUS_CHANGED':
        queryClient.invalidateQueries(['/api/events', message.eventId]);
        toast({ title: 'Pod status updated', description: 'New player joined!' });
        break;
    }
  };
  
  return () => ws.close();
}, [selectedCommunity]);
```

**Tasks:**
- [ ] Add WebSocket message types for events
- [ ] Broadcast on event create/update/delete
- [ ] Broadcast on participant join/leave
- [ ] Broadcast on pod status changes
- [ ] Subscribe to WebSocket in calendar page
- [ ] Invalidate queries on updates
- [ ] Show toast notifications for changes
- [ ] Handle reconnection logic
- [ ] Filter messages by community

**Files to Create:**
- `server/websocket-events.ts`
- `shared/websocket-event-types.ts`

**Files to Modify:**
- `server/routes.ts` - Add broadcasts after mutations
- `client/src/pages/calendar.tsx` - Add WebSocket subscription

---

### 2.3 Drag-and-Drop Event Rescheduling (3-4 days)
**Priority: MEDIUM**

**Implementation:**
```typescript
// Using @dnd-kit/core

import { DndContext, DragEndEvent } from '@dnd-kit/core';

function CalendarWithDragDrop() {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const eventId = active.id as string;
    const newDate = over.id as string; // Date cell ID
    
    // Confirm and update
    if (confirm(`Move event to ${newDate}?`)) {
      updateEventMutation.mutate({ 
        id: eventId, 
        date: newDate 
      });
    }
  };
  
  return (
    <DndContext onDragEnd={handleDragEnd}>
      <CalendarGrid />
    </DndContext>
  );
}
```

**Tasks:**
- [ ] Install @dnd-kit/core library
- [ ] Make event cards draggable
- [ ] Make date cells droppable
- [ ] Add visual drag preview
- [ ] Highlight drop zones on hover
- [ ] Show confirmation dialog before move
- [ ] Update event via API
- [ ] Add undo functionality
- [ ] Handle drag between months
- [ ] Add drag handle for touch devices

---

## Phase 3: Advanced Features (Week 5-6)

### 3.1 Two-Way TableSync Synchronization (3-4 days)
**Priority: MEDIUM**

**Tasks:**
- [ ] Add event update listener to sync session
- [ ] Add session status listener to sync event
- [ ] Update session when event time/format changes
- [ ] Update event status when session ends
- [ ] Add sync status indicator on events
- [ ] Handle delete cascade (event → session)
- [ ] Create sync audit log
- [ ] Add manual re-sync button for admins

**Files to Modify:**
- `server/storage.ts` - Add sync triggers
- `server/routes.ts` - Call sync on updates
- Create `server/services/tablesync-sync.ts`

---

### 3.2 Promotional Graphics Generator (4-6 days)
**Priority: MEDIUM-LOW**

**Backend Service:**
```typescript
// server/services/graphics-generator.ts

import sharp from 'sharp';

export async function generateEventGraphic(
  eventId: string, 
  template: 'modern' | 'classic' | 'minimal'
) {
  const event = await storage.getEvent(eventId);
  
  // Create canvas
  const svg = `
    <svg width="1200" height="630">
      <rect fill="${event.community?.themeColor}" width="1200" height="630"/>
      <text x="600" y="200" font-size="60" fill="white" text-anchor="middle">
        ${event.title}
      </text>
      <text x="600" y="300" font-size="40" fill="white" text-anchor="middle">
        ${event.date} at ${event.time}
      </text>
    </svg>
  `;
  
  const buffer = await sharp(Buffer.from(svg))
    .png()
    .toBuffer();
    
  return buffer.toString('base64');
}
```

**Tasks:**
- [ ] Install sharp or canvas library
- [ ] Create graphics service
- [ ] Design 3 templates (modern, classic, minimal)
- [ ] Add QR code generation
- [ ] Create POST /api/graphics/generate endpoint
- [ ] Add "Generate Graphic" button to events
- [ ] Show preview modal
- [ ] Allow template selection
- [ ] Add download as PNG/JPG
- [ ] Add social share buttons

**Files to Create:**
- `server/services/graphics-generator.ts`
- `server/routes/graphics.ts`
- `client/src/components/events/GraphicsGenerator.tsx`

---

### 3.3 Additional Quality-of-Life Features (2-3 days each)

#### Waitlist Queue Management
- [ ] True waitlist table in database
- [ ] Add to waitlist when pod full
- [ ] Auto-promote from waitlist when slot opens
- [ ] Show waitlist position to users
- [ ] Notify when promoted from waitlist

#### Event Duplication
- [ ] Add "Duplicate Event" button
- [ ] Copy all event details
- [ ] Allow editing before save
- [ ] Useful for recurring similar events

#### Calendar Export
- [ ] Add iCal export endpoint
- [ ] Add Google Calendar integration
- [ ] "Add to Calendar" buttons
- [ ] Download .ics file

#### Conflict Detection
- [ ] Check for scheduling conflicts
- [ ] Warn when creating overlapping events
- [ ] Show conflicts to users
- [ ] Suggest alternative times

---

## Testing Strategy

### Unit Tests
- [ ] Event creation validation
- [ ] Pod slot assignment logic
- [ ] Recurring event generation
- [ ] Notification trigger conditions
- [ ] Date/time parsing and formatting

### Integration Tests
- [x] Event CRUD operations (37 tests ✅)
- [ ] Bulk upload with various CSV formats
- [ ] WebSocket message handling
- [ ] TableSync synchronization
- [ ] Graphics generation

### E2E Tests (Optional)
- [ ] User creates and manages event
- [ ] User joins pod and gets notifications
- [ ] CSV bulk upload flow
- [ ] Drag-and-drop event rescheduling
- [ ] Real-time updates across sessions

---

## Documentation Updates

### User Documentation
- [ ] How to create events guide
- [ ] Pod management for hosts
- [ ] CSV bulk upload tutorial
- [ ] Notification settings guide

### Developer Documentation
- [ ] Event API complete reference
- [ ] WebSocket event types
- [ ] Pod lifecycle diagram
- [ ] Graphics template system

### API Documentation
- [ ] Update API_DOCUMENTATION.md with all endpoints
- [ ] Add request/response examples
- [ ] Document error codes
- [ ] Add rate limiting info

---

## Success Metrics

### Phase 1 Success Criteria
- ✅ Calendar displays in month/week/day grid views
- ✅ Pod status visible on all game_pod events
- ✅ Event form includes all pod fields
- ✅ Users receive notifications for all trigger events
- ✅ 90%+ test coverage for event features

### Phase 2 Success Criteria
- ✅ Users can bulk upload events via CSV
- ✅ Events update in real-time across all users
- ✅ Drag-and-drop rescheduling works smoothly
- ✅ Pod changes broadcast instantly

### Phase 3 Success Criteria
- ✅ TableSync and events stay synchronized
- ✅ Users can generate promotional graphics
- ✅ All advanced features operational
- ✅ Documentation complete and accurate

---

## Resource Requirements

### Development Team
- 1 Full-stack Developer (primary)
- 1 Frontend Developer (calendar UI, optional)
- 1 QA Engineer (testing, optional)

### Timeline
- **Phase 1:** 2-3 weeks (Critical UX)
- **Phase 2:** 2 weeks (Import & Real-time)
- **Phase 3:** 2-3 weeks (Advanced Features)
- **Total:** 6-8 weeks

### Libraries to Add
```json
{
  "dependencies": {
    "papaparse": "^5.4.1",
    "@dnd-kit/core": "^6.0.8",
    "@dnd-kit/sortable": "^7.0.2",
    "sharp": "^0.33.1",
    "date-fns": "^2.30.0" // Already installed
  }
}
```

---

## Risk Mitigation

### Technical Risks
- **Risk:** WebSocket scaling with many users
  - **Mitigation:** Use Redis pub/sub for horizontal scaling
  
- **Risk:** Large CSV uploads timeout
  - **Mitigation:** Implement chunked upload processing
  
- **Risk:** Graphics generation memory usage
  - **Mitigation:** Use worker threads, set memory limits

### UX Risks
- **Risk:** Calendar performance with many events
  - **Mitigation:** Implement virtual scrolling, pagination
  
- **Risk:** Drag-and-drop confusing on mobile
  - **Mitigation:** Add clear touch targets, tutorial

---

## Post-Launch Enhancements

### Advanced Features (Future)
- AI-suggested event times based on community activity
- Automatic matchmaking for pods (skill-based)
- Event analytics dashboard
- Multi-language support
- Mobile app with push notifications
- Social media auto-posting
- Payment integration for paid events

### Performance Optimizations
- Implement CDN for graphics
- Add Redis caching for events
- Database query optimization
- Frontend code splitting
- Image lazy loading

---

**Last Updated:** December 2024  
**Next Review:** After Phase 1 completion  
**Owner:** Development Team
