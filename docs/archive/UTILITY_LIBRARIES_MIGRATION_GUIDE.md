# Code Deduplication - Utility Libraries Migration Guide

## Overview

This guide provides instructions for migrating existing code to use the new utility libraries created as part of the code deduplication initiative (Risk ID: MAINT-001).

## New Utility Libraries

### 1. `server/utils/validation.utils.ts`

**Purpose:** Common validation functions and reusable Zod schemas

**When to use:**

- Email, URL, username, phone number validation
- Date/time string validation
- Input sanitization
- Zod schema composition

**Example Migration:**

**Before:**

```typescript
// Scattered validation logic
if (!email || !email.includes("@")) {
  throw new Error("Invalid email");
}
const cleanEmail = email.trim().toLowerCase();

// Inline Zod schemas
const schema = z.object({
  email: z.string().email(),
  username: z.string().min(2).max(30),
});
```

**After:**

```typescript
import {
  isValidEmail,
  sanitizeEmail,
  emailSchema,
  usernameSchema,
} from "@/utils/validation.utils";

// Use validation function
if (!isValidEmail(email)) {
  throw new Error("Invalid email");
}
const cleanEmail = sanitizeEmail(email);

// Use reusable schemas
import { z } from "zod";
const schema = z.object({
  email: emailSchema,
  username: usernameSchema,
});
```

### 2. `server/utils/formatting.utils.ts`

**Purpose:** Date, time, string, and number formatting

**When to use:**

- Formatting dates for display
- Converting string cases (camelCase, kebab-case, etc.)
- Number formatting (currency, percentages, file sizes)
- String truncation and pluralization

**Example Migration:**

**Before:**

```typescript
// Manual date formatting
const date = new Date();
const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

// Manual pluralization
const text = count === 1 ? "item" : "items";

// Manual truncation
const short = longText.length > 100 ? longText.slice(0, 97) + "..." : longText;
```

**After:**

```typescript
import { formatDate, pluralize, truncate } from "@/utils/formatting.utils";

const formatted = formatDate(new Date());
const text = pluralize(count, "item");
const short = truncate(longText, 100);
```

### 3. `server/utils/api.utils.ts`

**Purpose:** API request/response utilities

**When to use:**

- Parsing query parameters (pagination, sort, filters)
- Sending standardized API responses
- Request validation
- Building query strings

**Example Migration:**

**Before:**

```typescript
// Manual pagination parsing
const page = Math.max(1, parseInt(req.query.page as string) || 1);
const limit = Math.min(100, parseInt(req.query.limit as string) || 50);
const offset = (page - 1) * limit;

// Manual response formatting
res.status(200).json({
  success: true,
  data: items,
  meta: { page, limit, total },
});
```

**After:**

```typescript
import { parsePaginationParams, sendPaginatedSuccess } from "@/utils/api.utils";

const { page, limit, offset } = parsePaginationParams(req);

sendPaginatedSuccess(res, items, { page, limit, total });
```

### 4. `shared/utils/common.utils.ts`

**Purpose:** Universal utilities for arrays, objects, and type guards

**When to use:**

- Array operations (unique, groupBy, sortBy, chunk)
- Object manipulation (pick, omit, deepClone, deepMerge)
- Type guards (isString, isNumber, isObject)
- Retry logic with exponential backoff

**Example Migration:**

**Before:**

```typescript
// Manual unique array
const unique = [...new Set(array)];

// Manual grouping
const grouped = array.reduce((acc, item) => {
  const key = item.type;
  if (!acc[key]) acc[key] = [];
  acc[key].push(item);
  return acc;
}, {});

// Manual type checking
if (value !== null && value !== undefined && typeof value === "string") {
  // ...
}
```

**After:**

```typescript
import {
  unique,
  groupBy,
  isString,
  isDefined,
} from "@shared/utils/common.utils";

const uniqueItems = unique(array);
const grouped = groupBy(array, "type");

if (isDefined(value) && isString(value)) {
  // ...
}
```

## Migration Strategy

### Phase 1: Low-Risk Migrations (Week 1)

**Priority:** Start with utility functions that have no side effects

1. **String formatting** (`formatting.utils.ts`)
   - Search for: date formatting, string case conversions, truncation
   - Low risk: These are pure functions with predictable output

2. **Type guards** (`common.utils.ts`)
   - Search for: `typeof value === 'string'`, `Array.isArray()`, null checks
   - Low risk: Simple replacements

3. **Array utilities** (`common.utils.ts`)
   - Search for: `[...new Set(array)]`, manual reduce operations
   - Low risk: Well-tested utilities

### Phase 2: Medium-Risk Migrations (Week 2)

**Priority:** API utilities and validation

1. **Query parameter parsing** (`api.utils.ts`)
   - Search for: `req.query`, pagination logic, filter parsing
   - Medium risk: Affects API behavior

2. **Validation functions** (`validation.utils.ts`)
   - Search for: email validation, URL validation, regex patterns
   - Medium risk: Validation logic changes

3. **Response formatting** (`api.utils.ts`)
   - Search for: `res.json()`, `res.status()`
   - Medium risk: Changes API response structure

### Phase 3: High-Impact Migrations (Week 3)

**Priority:** Complex operations and refactoring

1. **Deep object operations** (`common.utils.ts`)
   - Search for: `JSON.parse(JSON.stringify())`, manual cloning
   - Higher risk: Complex operations

2. **Zod schema composition** (`validation.utils.ts`)
   - Replace inline schemas with reusable schemas
   - Higher risk: Affects validation behavior

## Testing Checklist

Before migrating any code:

- [ ] Read the utility function documentation (JSDoc comments)
- [ ] Check the test file to understand expected behavior
- [ ] Test the migration locally
- [ ] Verify existing tests still pass
- [ ] Add tests for any new usage patterns

## Search Patterns

Use these patterns to find code that can be migrated:

### Date Formatting

```bash
# Find manual date formatting
grep -r "getFullYear\|getMonth\|getDate" --include="*.ts" --include="*.tsx"
grep -r "toISOString\|toLocaleDateString" --include="*.ts" --include="*.tsx"
```

### String Manipulation

```bash
# Find manual case conversions
grep -r "toLowerCase\|toUpperCase" --include="*.ts" --include="*.tsx"
grep -r "split.*join\|replace" --include="*.ts" --include="*.tsx"
```

### Array Operations

```bash
# Find manual array deduplication
grep -r "new Set\|filter.*indexOf" --include="*.ts" --include="*.tsx"

# Find manual grouping/sorting
grep -r "\.reduce\|\.sort" --include="*.ts" --include="*.tsx"
```

### Type Checking

```bash
# Find manual type checks
grep -r "typeof.*===\|instanceof\|Array\.isArray" --include="*.ts" --include="*.tsx"
grep -r "null.*undefined\|!= null" --include="*.ts" --include="*.tsx"
```

### Validation

```bash
# Find email/URL validation
grep -r "@.*test\|email.*includes\|url.*match" --include="*.ts" --include="*.tsx"
```

### API Utilities

```bash
# Find pagination logic
grep -r "req\.query\.page\|req\.query\.limit" --include="*.ts" --include="*.tsx"

# Find response formatting
grep -r "res\.json.*success\|res\.status.*json" --include="*.ts" --include="*.tsx"
```

## Import Optimization

Update your `tsconfig.json` paths to include the new utilities (already configured):

```json
{
  "compilerOptions": {
    "paths": {
      "@shared/*": ["./shared/*"],
      "@/utils/*": ["./server/utils/*"]
    }
  }
}
```

## Common Pitfalls

### 1. Different Default Values

Some utility functions have different defaults than your current code. Always check:

```typescript
// Old: limit defaults to 20
const limit = parseInt(req.query.limit) || 20;

// New: limit defaults to 50
const { limit } = parsePaginationParams(req);

// Solution: Override defaults if needed
const { limit } = parsePaginationParams(req);
const actualLimit = req.query.limit ? limit : 20;
```

### 2. Different Error Handling

Utility functions may throw errors differently:

```typescript
// Old: Returns null on error
const parsed = parseDate(str) || null;

// New: Returns empty string on error
const parsed = formatDate(str); // returns ""

// Solution: Handle appropriately
const parsed = formatDate(str) || null;
```

### 3. Side Effects

Ensure utilities are used where they're appropriate:

```typescript
// DON'T use utilities that modify state in pure functions
// DO use pure utilities everywhere

// Good: Pure function usage
const formatted = formatDate(date);

// Bad: Using utility with side effects in a reducer
// (None of our utilities have side effects, but be aware)
```

## Code Review Guidelines

When reviewing migrations:

1. **Verify behavior preservation:** Ensure the migrated code behaves identically
2. **Check edge cases:** Test with null, undefined, empty arrays, etc.
3. **Validate types:** TypeScript should catch type mismatches
4. **Review tests:** Existing tests should still pass
5. **Look for improvements:** Sometimes migration reveals other issues

## Success Metrics

Track these metrics for each migration:

- **Lines of code removed:** Duplicated code eliminated
- **Test coverage:** Should increase or stay the same
- **Build time:** Should improve with tree-shaking
- **Bug count:** Should decrease over time

## Getting Help

If you encounter issues during migration:

1. Check the utility function's test file for usage examples
2. Review the JSDoc comments in the utility file
3. Ask in the #code-quality Slack channel
4. Create a GitHub discussion for complex migrations

## Quick Reference

### Most Common Migrations

| Old Code                           | New Code                          | Utility               |
| ---------------------------------- | --------------------------------- | --------------------- |
| `[...new Set(arr)]`                | `unique(arr)`                     | `common.utils.ts`     |
| `date.toISOString().split('T')[0]` | `formatDate(date)`                | `formatting.utils.ts` |
| `email.trim().toLowerCase()`       | `sanitizeEmail(email)`            | `validation.utils.ts` |
| `parseInt(req.query.page) \|\| 1`  | `parsePaginationParams(req).page` | `api.utils.ts`        |
| `typeof x === 'string'`            | `isString(x)`                     | `common.utils.ts`     |
| `count === 1 ? 'item' : 'items'`   | `pluralize(count, 'item')`        | `formatting.utils.ts` |

## Next Steps

1. Start with the low-risk migrations in your area of the codebase
2. Update 2-3 files per day to avoid overwhelming changes
3. Request code reviews for each migration
4. Document any issues or improvements discovered
5. Update this guide with new patterns you find

---

**Last Updated:** [Current Date]  
**Version:** 1.0.0  
**Related:** ARCHITECTURAL_RISK_ASSESSMENT.md, CODE_QUALITY_IMPROVEMENT_ROADMAP.md
