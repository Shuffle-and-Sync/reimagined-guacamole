# Code Deduplication - Example Refactors

This document provides concrete examples of how existing code can be refactored to use the new utility libraries.

## Example 1: Event Service Refactor

### Before

```typescript
// server/features/events/events.service.ts (partial)
async createEvent(userId: string, eventData: CreateEventRequest): Promise<Event> {
  try {
    // Manual validation
    if (!eventData.title || eventData.title.trim().length === 0) {
      throw new Error("Title is required");
    }
    if (eventData.title.length > 200) {
      throw new Error("Title must not exceed 200 characters");
    }

    // Manual date validation
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(eventData.date)) {
      throw new Error("Invalid date format");
    }

    const parsedEventData = insertEventSchema.parse({
      ...eventData,
      creatorId: userId,
      hostId: userId,
    });

    const event = await storage.createEvent(parsedEventData);

    logger.info("Event created", {
      eventId: event.id,
      userId,
      title: event.title,
    });

    return event;
  } catch (error) {
    logger.error("Failed to create event", error, { userId });
    throw error;
  }
}
```

### After

```typescript
// server/features/events/events.service.ts (refactored)
import { isEmpty, isValidLength, isValidDateString } from '@/utils/validation.utils';
import { formatDate } from '@/utils/formatting.utils';

async createEvent(userId: string, eventData: CreateEventRequest): Promise<Event> {
  try {
    // Using validation utilities
    if (isEmpty(eventData.title)) {
      throw new Error("Title is required");
    }
    if (!isValidLength(eventData.title, 1, 200)) {
      throw new Error("Title must be between 1 and 200 characters");
    }
    if (!isValidDateString(eventData.date)) {
      throw new Error("Invalid date format");
    }

    const parsedEventData = insertEventSchema.parse({
      ...eventData,
      creatorId: userId,
      hostId: userId,
    });

    const event = await storage.createEvent(parsedEventData);

    logger.info("Event created", {
      eventId: event.id,
      userId,
      title: event.title,
    });

    return event;
  } catch (error) {
    logger.error("Failed to create event", error, { userId });
    throw error;
  }
}
```

**Benefits:**

- Consistent validation across services
- Reusable validation functions tested separately
- Less code duplication
- Better error messages

## Example 2: API Route Handler Refactor

### Before

```typescript
// Hypothetical route handler
app.get("/api/events", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit as string) || 50),
    );
    const offset = (page - 1) * limit;

    const sortBy = (req.query.sortBy as string) || "createdAt";
    const order =
      (req.query.order as string)?.toLowerCase() === "asc" ? "asc" : "desc";

    const filters: any = {};
    if (req.query.communityId) {
      filters.communityId = req.query.communityId;
    }
    if (req.query.type) {
      filters.type = req.query.type;
    }

    const events = await storage.getEvents({
      ...filters,
      page,
      limit,
      offset,
      sortBy,
      order,
    });

    const total = await storage.countEvents(filters);

    res.status(200).json({
      success: true,
      data: events,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});
```

### After

```typescript
import {
  parsePaginationParams,
  parseSortParams,
  parseFilterParams,
  sendPaginatedSuccess,
  sendInternalError,
  logApiRequest,
  logApiError,
  asyncHandler,
} from "@/utils/api.utils";

app.get(
  "/api/events",
  asyncHandler(async (req, res) => {
    logApiRequest(req);

    const { page, limit, offset } = parsePaginationParams(req);
    const { field: sortBy, direction: order } = parseSortParams(req);
    const filters = parseFilterParams(req, ["communityId", "type"]);

    const events = await storage.getEvents({
      ...filters,
      page,
      limit,
      offset,
      sortBy,
      order,
    });

    const total = await storage.countEvents(filters);

    sendPaginatedSuccess(res, events, { page, limit, total });
  }),
);
```

**Benefits:**

- 60% less code
- Consistent parameter parsing
- Standard error handling
- Automatic request logging
- Standard response format

## Example 3: Data Transformation Refactor

### Before

```typescript
// Manual array operations
function processUsers(users: User[]): ProcessedUser[] {
  // Remove duplicates by email
  const seen = new Set();
  const unique = users.filter((user) => {
    if (seen.has(user.email)) return false;
    seen.add(user.email);
    return true;
  });

  // Group by role
  const grouped: Record<string, User[]> = {};
  for (const user of unique) {
    if (!grouped[user.role]) {
      grouped[user.role] = [];
    }
    grouped[user.role].push(user);
  }

  // Sort by name
  Object.keys(grouped).forEach((role) => {
    grouped[role].sort((a, b) => {
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      return 0;
    });
  });

  // Transform to display format
  const result: ProcessedUser[] = [];
  Object.entries(grouped).forEach(([role, users]) => {
    users.forEach((user) => {
      result.push({
        id: user.id,
        name: user.name,
        email: user.email.toLowerCase().trim(),
        role: role.charAt(0).toUpperCase() + role.slice(1),
        initials: user.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase(),
      });
    });
  });

  return result;
}
```

### After

```typescript
import { uniqueBy, groupBy, sortBy } from "@shared/utils/common.utils";
import {
  sanitizeEmail,
  capitalize,
  getInitials,
} from "@/utils/formatting.utils";

function processUsers(users: User[]): ProcessedUser[] {
  // Remove duplicates, group, and sort using utilities
  const unique = uniqueBy(users, "email");
  const grouped = groupBy(unique, "role");

  // Transform to display format
  return Object.entries(grouped).flatMap(([role, roleUsers]) =>
    sortBy(roleUsers, "name").map((user) => ({
      id: user.id,
      name: user.name,
      email: sanitizeEmail(user.email),
      role: capitalize(role),
      initials: getInitials(user.name),
    })),
  );
}
```

**Benefits:**

- 70% less code
- More readable and declarative
- Reusable, tested utilities
- Better performance (optimized implementations)

## Example 4: Validation Schema Refactor

### Before

```typescript
// Scattered validation schemas
const createUserSchema = z.object({
  email: z.string().email("Invalid email"),
  username: z.string().min(2).max(30),
  name: z.string().min(1).max(100),
  bio: z.string().max(500).optional(),
  website: z.string().url().optional().or(z.literal("")),
});

const updateProfileSchema = z.object({
  email: z.string().email("Invalid email").optional(),
  username: z.string().min(2).max(30).optional(),
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  website: z.string().url().optional().or(z.literal("")),
});
```

### After

```typescript
import {
  emailSchema,
  usernameSchema,
  nameSchema,
  bioSchema,
  urlSchema,
} from "@/utils/validation.utils";

const createUserSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  name: nameSchema,
  bio: bioSchema,
  website: urlSchema,
});

const updateProfileSchema = createUserSchema.partial();
```

**Benefits:**

- Consistent validation across endpoints
- Single source of truth for validation rules
- Easy to update validation globally
- Less duplication

## Example 5: Response Formatting Refactor

### Before

```typescript
// Inconsistent response formats across routes
app.get("/api/user/:id", async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/users", async (req, res) => {
  try {
    const user = await createUser(req.body);
    res.status(201).json({
      success: true,
      data: user,
      message: "User created successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});
```

### After

```typescript
import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendInternalError,
  sendBadRequest,
  asyncHandler,
} from "@/utils/api.utils";

app.get(
  "/api/user/:id",
  asyncHandler(async (req, res) => {
    const user = await getUserById(req.params.id);
    if (!user) {
      return sendNotFound(res, "User not found");
    }
    sendSuccess(res, user);
  }),
);

app.post(
  "/api/users",
  asyncHandler(async (req, res) => {
    try {
      const user = await createUser(req.body);
      sendCreated(res, user, "User created successfully");
    } catch (error) {
      sendBadRequest(res, error.message);
    }
  }),
);
```

**Benefits:**

- Consistent API response format
- Standard HTTP status codes
- Automatic error handling
- JSend specification compliance

## Example 6: Date Formatting Refactor

### Before

```typescript
// Manual date formatting scattered throughout components
function EventCard({ event }: { event: Event }) {
  const date = new Date(event.startTime);
  const formatted = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;

  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let timeText;
  if (diffDays === 0) {
    timeText = 'Today';
  } else if (diffDays === 1) {
    timeText = 'Tomorrow';
  } else if (diffDays < 7) {
    timeText = `In ${diffDays} days`;
  } else {
    timeText = formatted;
  }

  return <div>{timeText}</div>;
}
```

### After

```typescript
import { formatDateHuman, formatRelativeTime } from '@/utils/formatting.utils';

function EventCard({ event }: { event: Event }) {
  const date = new Date(event.startTime);
  const timeText = formatRelativeTime(date);

  return <div>{timeText}</div>;
}
```

**Benefits:**

- Much simpler code
- Consistent date formatting
- Handles edge cases automatically
- Localization-ready

## Example 7: Type Guards Refactor

### Before

```typescript
function processValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "N/A";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" && !isNaN(value)) {
    return value.toString();
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return JSON.stringify(value);
  }

  return "Unknown";
}
```

### After

```typescript
import {
  isNullish,
  isString,
  isNumber,
  isBoolean,
  isObject,
} from "@shared/utils/common.utils";

function processValue(value: unknown): string {
  if (isNullish(value)) return "N/A";
  if (isString(value)) return value.trim();
  if (isNumber(value)) return value.toString();
  if (isBoolean(value)) return value ? "Yes" : "No";
  if (isObject(value)) return JSON.stringify(value);

  return "Unknown";
}
```

**Benefits:**

- More readable
- Type guards provide better TypeScript inference
- Consistent type checking logic
- Tested edge cases

## Migration Metrics

Based on these examples, we can estimate:

| Refactor Type       | Lines Saved | Complexity Reduced | Readability Improved |
| ------------------- | ----------- | ------------------ | -------------------- |
| API Routes          | 40-60%      | High               | High                 |
| Data Transformation | 50-70%      | Medium             | High                 |
| Validation          | 30-50%      | Low                | Medium               |
| Date Formatting     | 70-80%      | Medium             | High                 |
| Type Guards         | 20-30%      | Low                | High                 |

**Overall Estimate:** 40-60% reduction in boilerplate code across the application.

## Next Steps

1. Identify high-traffic files to refactor first
2. Create feature-specific refactor branches
3. Test each refactor thoroughly
4. Monitor for regressions
5. Update documentation as patterns emerge

---

**Related Documents:**

- UTILITY_LIBRARIES_MIGRATION_GUIDE.md
- CODE_QUALITY_IMPROVEMENT_ROADMAP.md
- ARCHITECTURAL_RISK_ASSESSMENT.md
