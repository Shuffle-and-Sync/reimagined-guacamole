# Utility Libraries Quick Reference

This guide provides a quick reference for the utility libraries created as part of the code deduplication initiative (MAINT-001).

## Overview

Four comprehensive utility libraries have been created to eliminate duplicate code patterns:

1. **validation.utils.ts** - Validation functions and Zod schemas
2. **formatting.utils.ts** - Date, string, and number formatting
3. **api.utils.ts** - API request/response utilities
4. **common.utils.ts** - Universal array, object, and type utilities

**Total:** 155+ functions | 188 tests | >90% coverage

---

## 1. Validation Utilities

**Location:** `server/utils/validation.utils.ts`  
**Tests:** 48 tests | Coverage: >90%

### Quick Examples

```typescript
import {
  isValidEmail,
  sanitizeEmail,
  emailSchema,
  usernameSchema,
  dateStringSchema,
  idSchema,
  parsePaginationSchema,
} from "./utils/validation.utils";

// Validation functions
isValidEmail("user@example.com"); // true
isValidUrl("https://example.com"); // true
isValidUsername("user_name"); // true
sanitizeEmail("  User@Example.COM  "); // 'user@example.com'

// Reusable Zod schemas
const schema = z.object({
  email: emailSchema,
  username: usernameSchema,
  birthDate: dateStringSchema,
  userId: idSchema,
});
```

### Key Functions

- `isValidEmail()`, `isValidUrl()`, `isValidUsername()`
- `isValidPhone()`, `isValidUuid()`, `isValidId()`
- `isValidDateString()`, `isValidTimeString()`
- `sanitizeEmail()`, `sanitizeString()`
- `isEmpty()`, `isValidLength()`, `isInRange()`

### Key Schemas

- `emailSchema`, `urlSchema`, `usernameSchema`
- `dateStringSchema`, `timeStringSchema`
- `idSchema`, `uuidSchema`, `phoneSchema`
- `positiveIntSchema`, `nonNegativeIntSchema`
- `paginationSchema`, `sortSchema`
- `createEnumSchema()` - Type-safe enum helper

---

## 2. Formatting Utilities

**Location:** `server/utils/formatting.utils.ts`  
**Tests:** 52 tests | Coverage: >90%

### Quick Examples

```typescript
import {
  formatDate,
  formatRelativeTime,
  formatCurrency,
  capitalize,
  toKebabCase,
  truncate,
  pluralize,
} from "./utils/formatting.utils";

// Date formatting
formatDate(new Date()); // '2024-01-15'
formatRelativeTime(date); // '2 hours ago'
formatDateTimeHuman(date); // 'Jan 15, 2024 at 3:30 PM'

// String formatting
capitalize("hello world"); // 'Hello world'
toKebabCase("helloWorld"); // 'hello-world'
truncate("Long text...", 20); // 'Long text...'

// Number formatting
formatCurrency(1234.56); // '$1,234.56'
formatFileSize(1048576); // '1 MB'
pluralize(5, "item"); // 'items'
```

### Key Functions

**Date/Time:**

- `formatDate()`, `formatTime()`, `formatDateTimeISO()`
- `formatDateHuman()`, `formatDateLong()`
- `formatRelativeTime()`, `formatDuration()`

**String:**

- `capitalize()`, `capitalizeWords()`, `toTitleCase()`
- `toKebabCase()`, `toSnakeCase()`, `toCamelCase()`, `toPascalCase()`
- `truncate()`, `truncateWords()`

**Number:**

- `formatNumber()`, `formatPercentage()`, `formatCurrency()`
- `formatFileSize()`, `formatBytesPerSecond()`

**Other:**

- `pluralize()`, `formatCount()`, `formatList()`
- `stripHtml()`, `escapeHtml()`, `getInitials()`

---

## 3. API Utilities

**Location:** `server/utils/api.utils.ts`  
**Tests:** 52 tests | Coverage: >90%

### Quick Examples

```typescript
import {
  parsePaginationParams,
  parseFilterParams,
  sendSuccess,
  sendNotFound,
  asyncHandler,
} from "./utils/api.utils";

// Request parsing
app.get("/api/items", async (req, res) => {
  const { page, limit, offset } = parsePaginationParams(req);
  const filters = parseFilterParams(req, ["category", "status"]);
  const active = parseBooleanParam(req, "active", false);

  const items = await db.getItems({ ...filters, page, limit, offset });
  const total = await db.countItems(filters);

  sendPaginatedSuccess(res, items, { page, limit, total });
});

// Error handling
app.get(
  "/api/item/:id",
  asyncHandler(async (req, res) => {
    const item = await db.getItem(req.params.id);
    if (!item) return sendNotFound(res);
    sendSuccess(res, item);
  }),
);
```

### Key Functions

**Request Parsing:**

- `parsePaginationParams()` - page, limit, offset
- `parseSortParams()` - field, direction
- `parseFilterParams()` - allowed filters
- `parseBooleanParam()`, `parseIntParam()`, `parseArrayParam()`
- `parseDateRangeParams()`, `parseSearchQuery()`

**Response Helpers:**

- `sendSuccess()`, `sendCreated()`, `sendNoContent()`
- `sendError()`, `sendValidationError()`
- `sendNotFound()`, `sendUnauthorized()`, `sendForbidden()`
- `sendBadRequest()`, `sendInternalError()`
- `sendPaginatedSuccess()` - with pagination meta

**Utilities:**

- `asyncHandler()` - Wraps async route handlers
- `getUserIdFromRequest()`, `getOptionalUserIdFromRequest()`
- `validateRequiredFields()`, `buildQueryString()`
- `buildPaginationMeta()`, `buildPaginationLinks()`

---

## 4. Common Utilities

**Location:** `shared/utils/common.utils.ts`  
**Tests:** 36 tests | Coverage: >90%

### Quick Examples

```typescript
import {
  isString,
  isDefined,
  unique,
  groupBy,
  sortBy,
  pick,
  deepClone,
  retry,
} from "@shared/utils/common.utils";

// Type guards
if (isDefined(value) && isString(value)) {
  // value is string
}

// Array operations
const uniqueItems = unique([1, 2, 2, 3]); // [1, 2, 3]
const grouped = groupBy(users, "role"); // { admin: [...], user: [...] }
const sorted = sortBy(items, "name"); // sorted by name

// Object operations
const subset = pick(obj, ["id", "name"]);
const cloned = deepClone(obj);
const merged = deepMerge(obj1, obj2);

// Async utilities
await retry(() => fetchData(), { maxAttempts: 3 });
```

### Key Functions

**Type Guards:**

- `isNullish()`, `isDefined()`, `isEmpty()`
- `isString()`, `isNumber()`, `isBoolean()`
- `isObject()`, `isPlainObject()`, `isArray()`
- `isFunction()`, `isDate()`

**Array Operations:**

- `unique()`, `uniqueBy()` - Remove duplicates
- `groupBy()`, `mapBy()` - Group/map by key
- `sortBy()` - Sort by key or function
- `chunk()`, `flatten()`, `compact()`
- `difference()`, `intersection()`
- `shuffle()`, `sample()`, `sampleSize()`

**Object Operations:**

- `pick()`, `omit()` - Select/exclude keys
- `deepClone()`, `deepMerge()` - Deep operations
- `getNestedValue()`, `setNestedValue()` - Nested access

**Async Utilities:**

- `retry()` - Retry with exponential backoff
- `sleep()` - Delay function
- `debounce()`, `throttle()` - Rate limiting
- `sequential()`, `parallelLimit()` - Promise control

**Other:**

- `safeJsonParse()`, `safeJsonStringify()`
- `clamp()`, `randomInt()`, `randomString()`
- `memoize()`, `hashString()`

---

## Common Usage Patterns

### Pattern 1: API Route with Pagination

```typescript
import { parsePaginationParams, sendPaginatedSuccess } from "./utils/api.utils";

app.get("/api/items", async (req, res) => {
  const { page, limit, offset } = parsePaginationParams(req);
  const items = await db.getItems({ page, limit, offset });
  const total = await db.countItems();
  sendPaginatedSuccess(res, items, { page, limit, total });
});
```

### Pattern 2: Validation Schema with Reusable Schemas

```typescript
import {
  emailSchema,
  usernameSchema,
  dateStringSchema,
} from "./utils/validation.utils";

const createUserSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  birthDate: dateStringSchema,
});
```

### Pattern 3: Data Transformation

```typescript
import { groupBy, sortBy, formatRelativeTime } from "./utils";

const processUsers = (users) => {
  const grouped = groupBy(users, "role");
  return Object.entries(grouped).map(([role, roleUsers]) => ({
    role,
    users: sortBy(roleUsers, "name"),
    formattedDates: roleUsers.map((u) => formatRelativeTime(u.createdAt)),
  }));
};
```

### Pattern 4: Safe Type Checking

```typescript
import { isDefined, isString, isArray } from "@shared/utils/common.utils";

function processValue(value: unknown) {
  if (!isDefined(value)) return null;
  if (isString(value)) return value.trim();
  if (isArray(value)) return value.length;
  return String(value);
}
```

---

## Migration Guide

### Step 1: Identify Code to Migrate

Search for these patterns:

```bash
# Manual pagination
grep -r "parseInt.*page\|parseInt.*limit" --include="*.ts"

# Email validation
grep -r "@.*test\|email.*includes" --include="*.ts"

# Array deduplication
grep -r "new Set\|filter.*indexOf" --include="*.ts"

# Date formatting
grep -r "getFullYear\|getMonth\|getDate" --include="*.ts"
```

### Step 2: Replace with Utilities

**Before:**

```typescript
const page = parseInt(req.query.page) || 1;
if (!email.includes("@")) throw new Error("Invalid email");
const unique = [...new Set(array)];
```

**After:**

```typescript
import { parsePaginationParams, isValidEmail, unique } from "./utils";

const { page } = parsePaginationParams(req);
if (!isValidEmail(email)) throw new Error("Invalid email");
const uniqueItems = unique(array);
```

### Step 3: Test and Validate

- Run tests: `npm test`
- Type check: `npm run check`
- Lint: `npm run lint`

---

## Best Practices

### ✅ DO

- Use utilities for all new code
- Prefer type-safe functions over manual parsing
- Import specific functions (tree-shaking friendly)
- Check utility tests for usage examples
- Use Zod schemas for validation

### ❌ DON'T

- Don't recreate utility functionality
- Don't bypass utilities with manual code
- Don't ignore TypeScript errors
- Don't use utilities with side effects in pure functions

---

## Getting Help

- **Documentation:** See full guides in `/docs` and root `.md` files
- **Examples:** Check test files for comprehensive examples
- **Migration:** See `UTILITY_LIBRARIES_MIGRATION_GUIDE.md`
- **Issues:** Create GitHub discussion for questions

---

## Statistics

- **Total Functions:** 155+
- **Total Tests:** 188 (100% passing)
- **Test Coverage:** >90%
- **Documentation:** 100% JSDoc
- **Type Safety:** Full TypeScript support

**Status:** Production Ready ✅  
**Version:** 1.0.0  
**Last Updated:** January 2025
