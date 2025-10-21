# ESLint Fix Strategy for Shuffle & Sync

## Current Status

- ✅ **All 9 ESLint errors fixed** (was: 9 errors, 968 warnings)
- ⚠️ **975 warnings remaining** to address

## Warning Breakdown

```
653  @typescript-eslint/no-explicit-any     (67.0%)
319  @typescript-eslint/no-unused-vars      (32.7%)
  3  @typescript-eslint/no-non-null-assertion (0.3%)
```

---

## Phase 1: Fix Critical Errors (COMPLETED ✅)

### 1.1 Fixed Parsing Errors

- **File**: `client/src/features/events/components/JoinEventButton.test.tsx`
- **Issue**: Corrupted test file with duplicate content and orphaned assertions
- **Fix**: Reconstructed malformed tests, removed duplicate code blocks

### 1.2 Fixed require() Imports

- **Files**: `signin.test.tsx`, `calendar.test.tsx`, `tournament-detail.test.tsx`, `tournaments.test.tsx`
- **Issue**: Using `require()` instead of ES6 imports in TypeScript
- **Fix**: Converted to proper ES6 module imports with `vi.mocked()`

**Before:**

```typescript
vi.mocked(require("@/features/auth").useAuth).mockReturnValue({...});
```

**After:**

```typescript
import * as authModule from "@/features/auth";
vi.mocked(authModule.useAuth).mockReturnValue({...});
```

### 1.3 Fixed Duplicate Key

- **File**: `client/src/pages/auth/signin.test.tsx`
- **Issue**: Duplicate `href` property in object literal
- **Fix**: Changed first `href: ""` to `get href()` accessor

**Before:**

```typescript
{
  href: "",
  set href(url) {
    mockLocationHref(url);
  },
}
```

**After:**

```typescript
{
  get href() {
    return "";
  },
  set href(url) {
    mockLocationHref(url);
  },
}
```

---

## Phase 2: Address @typescript-eslint/no-explicit-any (653 warnings)

### Strategy Overview

1. **Test Files** (majority): Allow `any` in test files or replace with proper types
2. **Event Handlers**: Replace with specific event types
3. **API Responses**: Define proper response interfaces
4. **Generic Utilities**: Use proper generics instead of `any`

### Common Patterns and Fixes

#### Pattern 1: Event Handlers (Most Common)

**Location**: React components, form handlers  
**Count**: ~200 instances

**Before:**

```typescript
const handleError = (error: any) => {
  console.error(error);
  toast({ title: "Error", description: error.message });
};

const handleSubmit = (e: any) => {
  e.preventDefault();
  // handle form
};
```

**After:**

```typescript
const handleError = (error: Error | unknown) => {
  console.error(error);
  const message = error instanceof Error ? error.message : "Unknown error";
  toast({ title: "Error", description: message });
};

const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  // handle form
};
```

#### Pattern 2: Mock Data in Tests

**Location**: Test files (`.test.tsx`, `.test.ts`)  
**Count**: ~300 instances

**Before:**

```typescript
const mockUser: any = {
  id: "123",
  name: "Test User",
};
```

**After - Option A (Proper Typing)**:

```typescript
import type { User } from "@/types";

const mockUser: Partial<User> = {
  id: "123",
  name: "Test User",
};
```

**After - Option B (Keep `any` in tests)**:

```eslint
// Update eslint.config.js to allow any in test files
{
  files: ["**/*.test.ts", "**/*.test.tsx"],
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
  },
}
```

#### Pattern 3: API Response Handlers

**Location**: API service files, data fetching hooks  
**Count**: ~100 instances

**Before:**

```typescript
const fetchData = async (): Promise<any> => {
  const response = await fetch("/api/data");
  return response.json();
};
```

**After:**

```typescript
interface ApiResponse {
  data: Array<{
    id: string;
    name: string;
    // ... other fields
  }>;
  success: boolean;
}

const fetchData = async (): Promise<ApiResponse> => {
  const response = await fetch("/api/data");
  return response.json();
};
```

#### Pattern 4: Generic Utility Functions

**Location**: Utils, helpers  
**Count**: ~50 instances

**Before:**

```typescript
function processData(data: any) {
  return data.map((item: any) => item.value);
}
```

**After:**

```typescript
function processData<T extends { value: unknown }>(data: T[]): unknown[] {
  return data.map((item) => item.value);
}

// Or more specific:
interface DataItem {
  value: string | number;
}

function processData(data: DataItem[]): Array<string | number> {
  return data.map((item) => item.value);
}
```

---

## Phase 3: Address @typescript-eslint/no-unused-vars (319 warnings)

### Strategy Overview

1. **Remove truly unused variables**
2. **Prefix intentionally unused variables with underscore `_`**
3. **Remove unused imports**
4. **Keep destructured variables needed for type inference**

### Common Patterns and Fixes

#### Pattern 1: Unused Destructured Variables in Tests

**Count**: ~100 instances

**Before:**

```typescript
const { container } = renderWithProviders(<Component />);
// container never used

const user = userEvent.setup();
// user never used
```

**After:**

```typescript
// Just remove if not used:
renderWithProviders(<Component />);

// Or prefix with underscore if intentionally unused:
const { container: _container } = renderWithProviders(<Component />);
```

#### Pattern 2: Unused Function Parameters

**Count**: ~50 instances

**Before:**

```typescript
function MyComponent({ id, name, theme }: Props) {
  // theme never used
  return <div>{name}</div>;
}
```

**After:**

```typescript
function MyComponent({ id, name, theme: _theme }: Props) {
  // _theme prefix indicates intentionally unused
  return <div>{name}</div>;
}

// Or remove from destructuring if truly not needed:
function MyComponent({ id, name }: Props) {
  return <div>{name}</div>;
}
```

#### Pattern 3: Unused Imports

**Count**: ~80 instances

**Before:**

```typescript
import { Label, Input, Button } from "@/components/ui";
// Label never used
```

**After:**

```typescript
import { Input, Button } from "@/components/ui";
```

#### Pattern 4: Variables Assigned But Never Used

**Count**: ~89 instances

**Before:**

```typescript
const attendees = await fetchAttendees();
const user = useAuth();
// Variables defined but never referenced
```

**After:**

```typescript
// Remove if truly unused:
// (Delete the lines)

// Or use them:
const attendees = await fetchAttendees();
console.log(`Found ${attendees.length} attendees`);
```

---

## Automated Fix Commands

### Step 1: Fix Auto-fixable Issues

```bash
# Let ESLint auto-fix what it can
npm run lint

# This will automatically:
# - Remove unused imports
# - Add underscore prefixes where configured
# - Fix some formatting issues
```

### Step 2: Batch Fix Unused Vars (Manual)

```bash
# Find all unused variable warnings
npm run lint 2>&1 | grep "no-unused-vars" > unused-vars.txt

# Review and fix manually, or use sed for common patterns:
# Example: Prefix unused destructured variables
find client server -name "*.ts*" -exec sed -i 's/const { \([^}]*\)container\([^}]*\) }/const { \1container: _container\2 }/g' {} \;
```

### Step 3: Address `any` Types Systematically

#### Option A: Strict Approach (Recommended for non-test files)

Fix each `any` with proper typing. This requires manual review.

```bash
# Generate a report of all `any` usage
npm run lint 2>&1 | grep "no-explicit-any" > any-types.txt

# Work through files one by one, highest count first
```

#### Option B: Pragmatic Approach (Recommended for test files)

Allow `any` in test files via ESLint config update.

```bash
# Update eslint.config.js (see configuration section below)
```

---

## ESLint Configuration Recommendations

### 1. Allow `any` in Test Files Only

Add this override to `eslint.config.js`:

```javascript
export default [
  // ... existing config

  // Allow any in test files
  {
    files: [
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/__tests__/**/*.ts",
      "**/__tests__/**/*.tsx",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
```

**Impact**: This would remove ~300 warnings from test files, reducing total warnings from 975 to ~675.

### 2. Auto-prefix Unused Variables

Current config already has this (in `eslint.config.js`):

```javascript
"@typescript-eslint/no-unused-vars": [
  "warn",
  {
    argsIgnorePattern: "^_",
    varsIgnorePattern: "^_",
  },
],
```

This allows variables prefixed with `_` to be unused without warnings.

### 3. Downgrade Rules to Warnings (Already Done ✅)

Current config already uses `"warn"` for most rules, which is good for gradual cleanup:

```javascript
"@typescript-eslint/no-explicit-any": "warn",  // ✅ Already a warning
"@typescript-eslint/no-unused-vars": "warn",   // ✅ Already a warning
```

---

## Phased Rollout Plan

### Week 1: Low-Hanging Fruit (Target: -200 warnings)

- ✅ Fix all ESLint errors (COMPLETED)
- [ ] Remove unused imports (auto-fixable via `npm run lint`)
- [ ] Prefix unused destructured variables with `_`
- [ ] Allow `any` in test files via ESLint config

### Week 2: Type Safety in Core Files (Target: -150 warnings)

- [ ] Add proper types to event handlers in main components
- [ ] Define API response interfaces for core endpoints
- [ ] Fix `any` types in utility functions

### Week 3: Type Safety in Features (Target: -200 warnings)

- [ ] Fix `any` types in collaborative streaming features
- [ ] Fix `any` types in tournament features
- [ ] Fix `any` types in event/calendar features

### Week 4: Final Cleanup (Target: -425 warnings)

- [ ] Address remaining test file types (if not using config exemption)
- [ ] Review and fix edge cases
- [ ] Update documentation with type patterns

---

## Priority Files to Fix First

Based on warning concentration:

### High Priority (>20 warnings each)

```
server/utils/websocket-server-enhanced.ts         (9 warnings)
server/utils/websocket-message-validator.ts       (7 warnings)
server/utils/production-logger.ts                (10 warnings)
server/services/twitch-enhanced.ts               (20+ warnings)
server/tests/ (various test files)               (100+ warnings total)
client/src/features/collaborative-streaming/     (30+ warnings)
client/src/components/tournament/                (20+ warnings)
```

### Quick Wins (Few warnings, high impact)

```
client/src/features/auth/types/index.ts          (1 warning, core type)
client/src/features/communities/components/GamePodCalendar.tsx (3 warnings)
```

---

## Example Before/After: Full File Fix

### client/src/components/SettingsModal.tsx

**Before (4 any warnings):**

```typescript
const handleChange = (field: string, value: any) => {
  setSettings({ ...settings, [field]: value });
};

const handleSubmit = (e: any) => {
  e.preventDefault();
  onSave(settings);
};

const handleError = (error: any) => {
  toast({ description: error.message });
};
```

**After (0 any warnings):**

```typescript
interface Settings {
  theme: string;
  notifications: boolean;
  // ... other fields
}

const handleChange = (
  field: keyof Settings,
  value: Settings[keyof Settings],
) => {
  setSettings({ ...settings, [field]: value });
};

const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  onSave(settings);
};

const handleError = (error: unknown) => {
  const message = error instanceof Error ? error.message : "An error occurred";
  toast({ description: message });
};
```

---

## Monitoring Progress

### Check Current Status

```bash
npm run lint 2>&1 | tail -1
```

### Generate Detailed Report

```bash
npm run lint 2>&1 > eslint-report-$(date +%Y%m%d).txt
```

### Track by File

```bash
npm run lint 2>&1 | grep "warning" | awk '{print $1}' | cut -d: -f1 | sort | uniq -c | sort -rn | head -20
```

---

## Success Metrics

### Current State

- Errors: 0 ✅
- Warnings: 975 ⚠️

### Target State (4-week goal)

- Errors: 0 ✅
- Warnings: <100 🎯

### Ideal State (Long-term)

- Errors: 0 ✅
- Warnings: 0 or only intentional/documented exceptions ✨

---

## Additional Resources

- [TypeScript Handbook - Type Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [ESLint TypeScript Rules](https://typescript-eslint.io/rules/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

---

**Generated**: January 2025  
**Status**: All critical errors fixed, warning cleanup in progress
