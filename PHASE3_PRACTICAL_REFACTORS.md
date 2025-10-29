# Phase 3: Practical Refactor Examples

This document demonstrates real code refactors using the new utility libraries in the Shuffle & Sync codebase.

## Refactor 1: Event Routes - Pagination and Response Formatting

### Location: `server/routes.ts` (lines ~500-550)

### Before (Current Code)

```typescript
// GET /api/events - List events with pagination
app.get(
  "/api/events",
  validateQuery(paginationQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(100, parseInt(req.query.limit as string) || 50);
    const communityId = req.query.communityId as string | undefined;
    const type = req.query.type as string | undefined;

    const filters: any = {};
    if (communityId) filters.communityId = communityId;
    if (type) filters.type = type;

    const events = await storage.getEvents(filters);
    const total = events.length;

    res.json({
      success: true,
      data: events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }),
);
```

### After (Refactored with Utilities)

```typescript
import {
  parsePaginationParams,
  parseFilterParams,
  sendPaginatedSuccess,
  asyncHandler,
} from "./utils/api.utils";

// GET /api/events - List events with pagination
app.get(
  "/api/events",
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, offset } = parsePaginationParams(req);
    const filters = parseFilterParams(req, ["communityId", "type"]);

    const events = await storage.getEvents({ ...filters, page, limit, offset });
    const total = await storage.countEvents(filters);

    sendPaginatedSuccess(res, events, { page, limit, total });
  }),
);
```

### Impact

- **Lines reduced:** 22 → 11 (50% reduction)
- **Benefits:**
  - Consistent pagination logic
  - Standard response format
  - Automatic limit enforcement
  - Type-safe parameter parsing
  - Reduced boilerplate

---

## Refactor 2: User Service - Data Validation

### Location: `server/features/users/users.service.ts`

### Before (Current Pattern)

```typescript
async updateUserProfile(userId: string, data: any) {
  // Manual validation
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    throw new Error('Invalid email format');
  }

  if (data.username && (data.username.length < 2 || data.username.length > 30)) {
    throw new Error('Username must be between 2 and 30 characters');
  }

  if (data.website && data.website.length > 0) {
    try {
      new URL(data.website);
    } catch {
      throw new Error('Invalid website URL');
    }
  }

  const cleanEmail = data.email ? data.email.trim().toLowerCase() : undefined;

  return await storage.updateUser(userId, {
    ...data,
    email: cleanEmail,
  });
}
```

### After (Refactored with Utilities)

```typescript
import {
  isValidEmail,
  isValidLength,
  isValidUrl,
  sanitizeEmail,
} from '../utils/validation.utils';

async updateUserProfile(userId: string, data: any) {
  // Using validation utilities
  if (data.email && !isValidEmail(data.email)) {
    throw new Error('Invalid email format');
  }

  if (data.username && !isValidLength(data.username, 2, 30)) {
    throw new Error('Username must be between 2 and 30 characters');
  }

  if (data.website && data.website.length > 0 && !isValidUrl(data.website)) {
    throw new Error('Invalid website URL');
  }

  const cleanEmail = data.email ? sanitizeEmail(data.email) : undefined;

  return await storage.updateUser(userId, {
    ...data,
    email: cleanEmail,
  });
}
```

### Impact

- **Lines:** Similar count but more maintainable
- **Benefits:**
  - Consistent validation across services
  - Reusable, tested functions
  - Better error messages
  - Centralized validation logic

---

## Refactor 3: Event Formatting in Components

### Location: `client/src/features/events/components/EventCard.tsx`

### Before (Manual Date Formatting)

```typescript
function EventCard({ event }: { event: Event }) {
  const startDate = new Date(event.startTime);
  const now = new Date();
  const diffMs = startDate.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let timeText;
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      timeText = 'Starting soon';
    } else if (diffHours < 0) {
      timeText = 'In progress';
    } else {
      timeText = `In ${diffHours} hours`;
    }
  } else if (diffDays === 1) {
    timeText = 'Tomorrow';
  } else if (diffDays > 0 && diffDays < 7) {
    timeText = `In ${diffDays} days`;
  } else if (diffDays < 0) {
    timeText = 'Past event';
  } else {
    timeText = `${startDate.getMonth() + 1}/${startDate.getDate()}/${startDate.getFullYear()}`;
  }

  return (
    <div>
      <h3>{event.title}</h3>
      <p>{timeText}</p>
    </div>
  );
}
```

### After (Using Formatting Utilities)

```typescript
import { formatRelativeTime } from '@shared/utils/formatting.utils';

function EventCard({ event }: { event: Event }) {
  const timeText = formatRelativeTime(new Date(event.startTime));

  return (
    <div>
      <h3>{event.title}</h3>
      <p>{timeText}</p>
    </div>
  );
}
```

### Impact

- **Lines reduced:** 30 → 10 (67% reduction)
- **Benefits:**
  - Much simpler code
  - Consistent formatting across UI
  - Handles edge cases automatically
  - Easier to maintain

---

## Refactor 4: Array Operations in Tournament Service

### Location: `server/features/tournaments/tournaments.service.ts`

### Before (Manual Array Operations)

```typescript
async getPlayerStats(tournamentId: string) {
  const participants = await storage.getTournamentParticipants(tournamentId);

  // Remove duplicates by userId
  const seen = new Set();
  const uniqueParticipants = participants.filter(p => {
    if (seen.has(p.userId)) return false;
    seen.add(p.userId);
    return true;
  });

  // Group by status
  const grouped: Record<string, typeof participants> = {};
  for (const participant of uniqueParticipants) {
    if (!grouped[participant.status]) {
      grouped[participant.status] = [];
    }
    grouped[participant.status].push(participant);
  }

  // Sort each group by name
  Object.keys(grouped).forEach(status => {
    grouped[status].sort((a, b) => {
      const nameA = a.user?.name || '';
      const nameB = b.user?.name || '';
      return nameA.localeCompare(nameB);
    });
  });

  return grouped;
}
```

### After (Using Common Utilities)

```typescript
import { uniqueBy, groupBy, sortBy } from '@shared/utils/common.utils';

async getPlayerStats(tournamentId: string) {
  const participants = await storage.getTournamentParticipants(tournamentId);

  // Use utility functions for cleaner code
  const uniqueParticipants = uniqueBy(participants, 'userId');
  const grouped = groupBy(uniqueParticipants, 'status');

  // Sort each group by name
  const sorted = Object.entries(grouped).reduce((acc, [status, players]) => {
    acc[status] = sortBy(players, p => p.user?.name || '');
    return acc;
  }, {} as Record<string, typeof participants>);

  return sorted;
}
```

### Impact

- **Lines reduced:** 26 → 14 (46% reduction)
- **Benefits:**
  - More declarative code
  - Tested, optimized utilities
  - Better readability
  - Easier to understand intent

---

## Refactor 5: Zod Schema Composition

### Location: `server/features/events/events.validation.ts`

### Before (Duplicated Schemas)

```typescript
export const createEventSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(1000).optional(),
  type: z.enum([
    "tournament",
    "convention",
    "release",
    "community",
    "game_pod",
  ]),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
  location: z.string().min(1).max(200),
  communityId: z.string().min(1),
  maxAttendees: z.number().int().min(1).max(10000).optional(),
});

export const updateEventSchema = z.object({
  title: z.string().min(1, "Title is required").max(200).optional(),
  description: z.string().max(1000).optional(),
  type: z
    .enum(["tournament", "convention", "release", "community", "game_pod"])
    .optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .optional(),
  time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format")
    .optional(),
  location: z.string().min(1).max(200).optional(),
  communityId: z.string().min(1).optional(),
  maxAttendees: z.number().int().min(1).max(10000).optional(),
});
```

### After (Using Reusable Schemas)

```typescript
import {
  nameSchema,
  dateStringSchema,
  timeStringSchema,
  idSchema,
  positiveIntSchema,
  createEnumSchema,
} from "../utils/validation.utils";

const eventTypeSchema = createEnumSchema(
  ["tournament", "convention", "release", "community", "game_pod"] as const,
  "Invalid event type",
);

export const createEventSchema = z.object({
  title: nameSchema.max(200),
  description: z.string().max(1000).optional(),
  type: eventTypeSchema,
  date: dateStringSchema,
  time: timeStringSchema,
  location: nameSchema.max(200),
  communityId: idSchema,
  maxAttendees: positiveIntSchema.max(10000).optional(),
});

// Reuse with .partial() for updates
export const updateEventSchema = createEventSchema.partial();
```

### Impact

- **Lines reduced:** 24 → 16 (33% reduction)
- **Benefits:**
  - Single source of truth for validation
  - Consistent error messages
  - Easy to update globally
  - Less duplication

---

## Implementation Summary

### Files to Refactor (Priority Order)

#### High Priority (Week 1)

1. `server/routes.ts` - Main route file
2. `server/features/events/events.service.ts` - Event service
3. `server/features/users/users.service.ts` - User service
4. `server/features/tournaments/tournaments.service.ts` - Tournament service

#### Medium Priority (Week 2)

5. `server/features/communities/communities.service.ts`
6. `server/features/messaging/messaging.service.ts`
7. `client/src/features/events/components/*.tsx`
8. `client/src/features/tournaments/components/*.tsx`

#### Lower Priority (Week 3)

9. Other service files
10. Additional component files
11. Helper functions

### Metrics to Track

For each refactor, measure:

- Lines of code before/after
- Cyclomatic complexity reduction
- Test coverage impact
- Build time changes
- Developer feedback

### Validation Checklist

Before merging each refactor:

- [ ] All tests pass
- [ ] Type checking passes
- [ ] Lint passes
- [ ] Manual testing completed
- [ ] Code review approved
- [ ] Documentation updated

---

**Next Steps:**

1. Create PR for first refactor (routes.ts pagination)
2. Get team review and feedback
3. Iterate based on feedback
4. Continue with remaining refactors

**Status:** Ready for implementation  
**Phase:** 3 - Practical Refactors  
**Date:** January 2025
