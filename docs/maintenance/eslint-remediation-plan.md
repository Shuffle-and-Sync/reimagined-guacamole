# ESLint Remediation Plan

**Created:** 2025-10-19  
**Target Completion:** 4 weeks  
**Total Warnings:** 789  
**Estimated Effort:** 60-80 hours

---

## Overview

This document provides a phased, prioritized plan to remediate 789 ESLint warnings identified in the Shuffle & Sync codebase. The plan is structured to deliver quick wins early while systematically addressing deeper type safety issues in parallel with ongoing performance optimization work.

---

## Phase 1: Quick Wins (Week 1)

**Goal:** Reduce warning count by 40% with auto-fixes and simple manual fixes  
**Target:** 789 → ~470 warnings (-319)  
**Estimated Effort:** 8-12 hours  
**Priority:** Immediate execution

### 1.1 React Unescaped Entities (18 warnings)

**Estimated Time:** 30 minutes  
**Assigned to:** Any developer  
**Difficulty:** ⚡ Trivial

**Files to fix:**

```
client/src/pages/game-room.tsx (2)
client/src/pages/tournaments.tsx (2)
client/src/pages/matchmaking.tsx (2)
client/src/components/SettingsModal.tsx (0)
client/src/features/collaborative-streaming/components/PlatformAccountManager.tsx (1)
client/src/features/communities/components/realm-dashboards/DecksongDashboard.tsx (2)
client/src/features/communities/components/realm-dashboards/PokeStreamDashboard.tsx (1)
client/src/features/communities/components/realm-dashboards/ScryGatherDashboard.tsx (1)
client/src/pages/auth/verify-email.tsx (1)
client/src/pages/calendar.tsx (1)
client/src/pages/contact.tsx (1)
client/src/pages/getting-started.tsx (1)
client/src/pages/privacy.tsx (2)
client/src/pages/tablesync-landing.tsx (1)
```

**Action Steps:**

1. Search and replace patterns:
   - `'` → `&apos;` or `{\"'\"}`
   - `"` → `&quot;` or `{\'"\'}`
2. Run lint after each batch to verify
3. Test affected pages in browser

**Success Criteria:** Zero `react/no-unescaped-entities` warnings

---

### 1.2 Unused Imports (Estimated ~80-100 warnings)

**Estimated Time:** 3-4 hours  
**Assigned to:** Junior/Mid-level developer  
**Difficulty:** Simple

**Priority Files (unused imports only):**

```
server/routes.ts (many unused schema imports)
server/services/card-recognition/adapters/custom.adapter.ts
server/services/card-recognition/index.ts
server/services/games/game.service.ts
server/services/backup-service.ts
server/tests/features/*.test.ts
```

**Action Steps:**

1. For each file, identify unused imports
2. Remove import statement
3. Verify build still works: `npm run check`
4. Commit in batches of 5-10 files

**Automation Option:**

```bash
# VS Code users can use:
# 1. Open file
# 2. Ctrl+Shift+P → "Organize Imports"
# 3. Repeat for each file

# Or use ts-prune (requires install):
npx ts-prune | grep "used exports"
```

**Success Criteria:** Reduce unused-vars count by ~30%

---

### 1.3 Intentionally Unused Parameters (Estimated ~100-120 warnings)

**Estimated Time:** 4-5 hours  
**Assigned to:** Any developer  
**Difficulty:** Simple

**Pattern to fix:**

```typescript
// Before
function middleware(req, res, next) {
  // next is unused
}

// After
function middleware(req, res, _next) {
  // Prefix with _ to indicate intentionally unused
}
```

**Priority Files:**

```
server/routes.ts (Express middleware parameters)
server/services/analytics-service.ts (skeleton service methods)
server/services/ai-streaming-matcher.ts
server/services/ai-algorithm-engine.ts
server/tests/features/*.test.ts (test parameters)
```

**Action Steps:**

1. For each unused parameter, determine if:
   - Required by interface/signature → prefix with `_`
   - Truly unused → remove parameter
   - Should be used → investigate if implementation is incomplete
2. Update function calls if parameters removed
3. Run tests: `npm test`

**Success Criteria:** Reduce unused-vars count by another ~40%

---

### 1.4 Phase 1 Tracking

**Daily Progress Log:**

```
Day 1: React unescaped entities (18) - Target: Complete
Day 2: Unused imports batch 1 (40) - Target: 50% done
Day 3: Unused imports batch 2 (40) - Target: Complete
Day 4: Unused parameters batch 1 (60) - Target: 50% done
Day 5: Unused parameters batch 2 (60) - Target: Complete
```

**Week 1 Metrics:**

- Starting warnings: 789
- Target warnings: 470
- Reduction target: 319 (40%)
- Estimated hours: 8-12

**Verification:**

```bash
npm run lint -- --format stylish > week1-results.txt
# Count warnings: should be ~470
```

---

## Phase 2: Performance-Critical Type Safety (Week 2)

**Goal:** Resolve all warnings blocking performance optimization tasks  
**Target:** 470 → ~300 warnings (-170)  
**Estimated Effort:** 16-20 hours  
**Priority:** Integrates with ongoing performance work

### 2.1 Database Query Types

**Related to:** Performance Task 4 (Database Optimization)  
**Estimated Time:** 8-10 hours  
**Assigned to:** Senior developer with Drizzle ORM experience  
**Difficulty:** Moderate

**Files to fix (priority order):**

1. `server/storage.ts` (48 `any` instances)
2. `server/repositories/base.repository.ts` (25 `any` instances)
3. `server/features/events/events.service.ts` (2 `any` instances)

**Action Plan:**

#### storage.ts Strategy

```typescript
// Pattern 1: Query result types
// Before
async function getUserEvents(userId: string): Promise<any[]> {
  return db.select().from(events).where(eq(events.userId, userId));
}

// After - Use Drizzle's InferModel
import { InferModel } from "drizzle-orm";
type Event = InferModel<typeof events>;

async function getUserEvents(userId: string): Promise<Event[]> {
  return db.select().from(events).where(eq(events.userId, userId));
}

// Pattern 2: Join results
// Before
async function getEventWithAttendees(eventId: string): Promise<any> {
  return db
    .select()
    .from(events)
    .leftJoin(eventAttendees, eq(events.id, eventAttendees.eventId))
    .where(eq(events.id, eventId));
}

// After - Define joined result type
interface EventWithAttendees {
  event: Event;
  attendees: EventAttendee[];
}

async function getEventWithAttendees(
  eventId: string,
): Promise<EventWithAttendees> {
  const results = await db
    .select()
    .from(events)
    .leftJoin(eventAttendees, eq(events.id, eventAttendees.eventId))
    .where(eq(events.id, eventId));

  // Transform and return typed result
  return transformJoinedResult(results);
}
```

**Checklist:**

- [ ] Audit all Drizzle queries in storage.ts
- [ ] Create type definitions file: `server/types/database.ts`
- [ ] Replace `any` with proper types (group by entity)
- [ ] Update dependent services
- [ ] Run integration tests: `npm run test:features`
- [ ] Benchmark queries before/after (no performance regression)

**Success Criteria:** Zero `any` types in database query layer

---

### 2.2 WebSocket Type Safety

**Related to:** Real-time features, TableSync  
**Estimated Time:** 4-5 hours  
**Assigned to:** Developer familiar with WebSocket implementation  
**Difficulty:** Moderate

**Files to fix:**

```
client/src/lib/websocket-client.ts (18 `any` instances)
server/utils/websocket-server-enhanced.ts (9 `any` instances)
server/utils/websocket-message-validator.ts (7 `any` instances)
server/utils/websocket-connection-manager.ts (3 `any` instances)
```

**Action Plan:**

#### Define WebSocket Message Types

```typescript
// Create: shared/types/websocket.ts

export type WSMessage =
  | WSJoinRoomMessage
  | WSChatMessage
  | WSGameActionMessage
  | WSErrorMessage;

export interface WSJoinRoomMessage {
  type: "join_room";
  sessionId: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface WSChatMessage {
  type: "message";
  sessionId: string;
  user: {
    id: string;
    name: string;
  };
  content: string;
}

// ... define all message types
```

#### Update WebSocket Client

```typescript
// Before
send(message: any) {
  this.ws.send(JSON.stringify(message));
}

// After
send(message: WSMessage) {
  this.ws.send(JSON.stringify(message));
}

// Before
onMessage(handler: (message: any) => void) {
  this.messageHandlers.push(handler);
}

// After
onMessage(handler: (message: WSMessage) => void) {
  this.messageHandlers.push(handler);
}
```

**Checklist:**

- [ ] Define all WebSocket message types in shared/types
- [ ] Update client message handlers
- [ ] Update server message handlers
- [ ] Add runtime validation with Zod
- [ ] Test all WebSocket features
- [ ] Verify TableSync functionality

**Success Criteria:** Zero `any` types in WebSocket layer

---

### 2.3 API Response Types

**Related to:** External integrations (Twitch, YouTube, Facebook)  
**Estimated Time:** 4-5 hours  
**Assigned to:** Developer familiar with API integrations  
**Difficulty:** Moderate

**Files to fix:**

```
server/services/youtube-api.ts (16 `any` instances)
server/services/facebook-api.ts (9 `any` instances)
server/services/twitch-api.ts (4 `any` instances)
server/services/platform-oauth.ts (7 `any` instances)
```

**Action Plan:**

#### Create API Response Type Definitions

```typescript
// Create: server/types/external-apis.ts

// YouTube API
export namespace YouTube {
  export interface VideoResponse {
    items: Array<{
      id: string;
      snippet: {
        title: string;
        description: string;
        thumbnails: {
          default: { url: string };
          high: { url: string };
        };
      };
      statistics: {
        viewCount: string;
        likeCount: string;
      };
    }>;
  }

  export interface StreamResponse {
    items: Array<{
      id: string;
      liveStreamingDetails: {
        actualStartTime: string;
        scheduledStartTime: string;
        concurrentViewers: string;
      };
    }>;
  }
}

// Twitch API
export namespace Twitch {
  export interface StreamResponse {
    data: Array<{
      id: string;
      user_id: string;
      user_name: string;
      title: string;
      viewer_count: number;
      started_at: string;
    }>;
  }
}

// ... define all API response types
```

#### Update Service Methods

```typescript
// Before
async getVideoDetails(videoId: string): Promise<any> {
  const response = await fetch(`https://youtube.com/api/...`);
  return response.json();
}

// After
async getVideoDetails(videoId: string): Promise<YouTube.VideoResponse> {
  const response = await fetch(`https://youtube.com/api/...`);
  return response.json() as YouTube.VideoResponse;
}
```

**Checklist:**

- [ ] Document API response structures (from API docs)
- [ ] Create type definitions for each API
- [ ] Update service methods with types
- [ ] Add runtime validation where critical
- [ ] Test API integrations
- [ ] Document any breaking changes

**Success Criteria:** Zero `any` types in external API layer

---

### 2.4 Phase 2 Tracking

**Daily Progress Log:**

```
Day 1-3: Database query types (storage.ts)
Day 4: Database query types (repositories)
Day 5: WebSocket type safety (client)
Day 6: WebSocket type safety (server)
Day 7: API response types (YouTube, Twitch)
Day 8: API response types (Facebook, OAuth)
```

**Week 2 Metrics:**

- Starting warnings: 470
- Target warnings: 300
- Reduction target: 170 (36%)
- Estimated hours: 16-20

**Integration Checkpoints:**

- [ ] Database types ready before query optimization work
- [ ] WebSocket types verified in TableSync feature
- [ ] API types tested with live streaming features

---

## Phase 3: Code Quality & Maintainability (Week 3-4)

**Goal:** Resolve High and Medium priority warnings systematically  
**Target:** 300 → <50 warnings (-250)  
**Estimated Effort:** 24-32 hours  
**Priority:** Systematic cleanup

### 3.1 Service Layer Type Safety

**Estimated Time:** 12-16 hours  
**Assigned to:** 2-3 developers (parallel work)  
**Difficulty:** Moderate

**Files by developer:**

**Developer A - Analytics & Monitoring**

```
server/services/analytics-service.ts (25 `any` instances)
server/services/monitoring-service.ts (3 `any` instances)
server/services/error-tracking.ts (5 `any` instances)
server/middleware/performance.middleware.ts (8 `any` instances)
```

**Developer B - Streaming & Collaboration**

```
server/services/collaborative-streaming.ts (13 `any` instances)
server/services/real-time-matching-api.ts (14 `any` instances)
server/services/streaming-coordinator.ts (3 `any` instances)
server/services/ai-streaming-matcher.ts (7 `any` instances)
```

**Developer C - Notifications & Communications**

```
server/services/enhanced-notification.ts (12 `any` instances)
server/services/notification-delivery.ts (4 `any` instances)
server/services/notification-templates.ts (5 `any` instances)
server/services/enhanced-notifications.ts (4 `any` instances)
```

**Common Patterns to Fix:**

#### 1. Error Handler Types

```typescript
// Before
catch (error: any) {
  logger.error('Failed', error);
}

// After
catch (error) {
  if (error instanceof Error) {
    logger.error('Failed', { message: error.message, stack: error.stack });
  } else {
    logger.error('Failed', { error: String(error) });
  }
}
```

#### 2. Event Data Types

```typescript
// Before
function trackEvent(eventName: string, data: any) {
  analytics.track(eventName, data);
}

// After
interface EventData {
  [key: string]: string | number | boolean | null;
}

function trackEvent(eventName: string, data: EventData) {
  analytics.track(eventName, data);
}
```

#### 3. Configuration Objects

```typescript
// Before
function configureService(options: any) {
  // ...
}

// After
interface ServiceOptions {
  timeout?: number;
  retries?: number;
  enabled: boolean;
}

function configureService(options: ServiceOptions) {
  // ...
}
```

**Checklist per file:**

- [ ] Identify all `any` usages
- [ ] Define proper types/interfaces
- [ ] Update function signatures
- [ ] Update tests
- [ ] Run service-specific tests
- [ ] Document any breaking changes

**Success Criteria:** <50 `any` types remain in service layer

---

### 3.2 Remaining Unused Variables

**Estimated Time:** 6-8 hours  
**Assigned to:** Any developer  
**Difficulty:** Simple

**Focus Areas:**

```
server/storage.ts (remaining unused vars)
server/services/*.ts (skeleton implementations)
server/tests/features/*.test.ts (test cleanup)
client/src/pages/*.tsx (component cleanup)
```

**Strategy:**

1. Review each unused variable warning
2. Categorize:
   - Dead code → Remove
   - Skeleton code → Implement or remove
   - Future implementation → Add TODO comment + prefix with `_`
3. Batch commits by category

**Success Criteria:** <20 unused variable warnings remain

---

### 3.3 Test File Cleanup

**Estimated Time:** 4-6 hours  
**Assigned to:** QA or Test-focused developer  
**Difficulty:** Simple

**Files to clean:**

```
server/tests/features/registration-login-integration.test.ts (13 unused)
server/tests/features/events.integration.test.ts (3 unused)
server/tests/features/universal-deck-building.e2e.test.ts (2 unused)
server/tests/security/*.test.ts (various)
```

**Action Plan:**

1. Remove unused test fixtures
2. Complete skeleton test cases or mark as `.skip()`
3. Remove unused mock objects
4. Clean up test setup functions

**Success Criteria:** <5 warnings in test files

---

### 3.4 Client-side Type Safety

**Estimated Time:** 4-6 hours  
**Assigned to:** Frontend developer  
**Difficulty:** Moderate

**Priority Files:**

```
client/src/shared/utils/performance.ts (11 `any`)
client/src/shared/constants/queryKeys.ts (5 `any`)
client/src/shared/hooks/useOptimizedQuery.ts (5 `any`)
client/src/lib/queryClient.ts (2 `any`)
client/src/lib/logger.ts (5 `any`)
```

**Action Plan:**

#### Performance Utilities

```typescript
// Before
export function measurePerformance(name: string, fn: () => any): any {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  return result;
}

// After
export function measurePerformance<T>(name: string, fn: () => T): T {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  logger.debug(`${name} took ${duration}ms`);
  return result;
}
```

#### Query Keys

```typescript
// Before
export const queryKeys = {
  user: (id: string): any => ["user", id],
  events: (filters: any): any => ["events", filters],
};

// After
export const queryKeys = {
  user: (id: string): readonly ["user", string] => ["user", id] as const,
  events: (filters: EventFilters): readonly ["events", EventFilters] =>
    ["events", filters] as const,
};
```

**Success Criteria:** <10 `any` types in client utilities

---

### 3.5 Phase 3 Tracking

**Week 3 Progress:**

```
Days 1-3: Service layer cleanup (parallel work by 3 devs)
Day 4-5: Remaining unused variables
Days 6-7: Test file cleanup + Client-side types
```

**Week 4 Progress:**

```
Days 1-2: Final service layer files
Days 3-4: Documentation updates
Day 5: Final verification and testing
```

**Week 3-4 Metrics:**

- Starting warnings: 300
- Target warnings: <50
- Reduction target: 250+ (83%)
- Estimated hours: 24-32

---

## Phase 4: Configuration & Prevention (Ongoing)

**Goal:** Prevent new warnings and optimize remaining warnings  
**Target:** <50 → <10 warnings  
**Estimated Effort:** 4-8 hours setup + ongoing maintenance

### 4.1 ESLint Configuration Updates

#### Update eslint.config.js

```javascript
export default [
  // ... existing config
  {
    rules: {
      // Promote to error for new files only
      "@typescript-eslint/no-explicit-any": [
        "warn",
        {
          ignoreRestArgs: false,
          fixToUnknown: true,
        },
      ],

      // Stricter unused vars detection
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],

      // Auto-fixable rules as errors
      "react/no-unescaped-entities": "error",
    },
  },
];
```

#### Add Override for New Code

```javascript
{
  // Stricter rules for newly created files (after Phase 3)
  files: ['**/*.ts', '**/*.tsx'],
  excludedFiles: [
    // Exempt legacy files from strict rules
    'server/storage.ts',
    'server/routes.ts',
    // ... other legacy files
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error', // Block new any types
  }
}
```

---

### 4.2 Pre-commit Hooks

#### Install and Configure Husky + lint-staged

```bash
npm install --save-dev husky lint-staged

# Initialize husky
npx husky init

# Add pre-commit hook
echo "npx lint-staged" > .husky/pre-commit
```

#### Configure lint-staged (package.json)

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

**Goal:** Catch and auto-fix warnings before commit

---

### 4.3 CI/CD Integration

#### GitHub Action: .github/workflows/eslint-check.yml

```yaml
name: ESLint Check

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint -- --format json --output-file eslint-results.json
        continue-on-error: true

      - name: Analyze Results
        id: analyze
        run: |
          WARNINGS=$(cat eslint-results.json | jq '[.[] | .warningCount] | add')
          echo "warnings=$WARNINGS" >> $GITHUB_OUTPUT

          # Fail if warnings increased
          if [ -f baseline-warnings.txt ]; then
            BASELINE=$(cat baseline-warnings.txt)
            if [ $WARNINGS -gt $BASELINE ]; then
              echo "❌ Warning count increased: $BASELINE → $WARNINGS"
              exit 1
            fi
          fi

          echo "✅ Warning count: $WARNINGS"

      - name: Comment PR
        uses: actions/github-script@v6
        with:
          script: |
            const warnings = '${{ steps.analyze.outputs.warnings }}';
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## ESLint Check Results\n\n⚠️ Total Warnings: ${warnings}\n\nTarget: <50 warnings by end of Phase 3`
            });
```

#### Baseline Warning Count

```bash
# Store current warning count as baseline
echo "789" > baseline-warnings.txt
git add baseline-warnings.txt
git commit -m "Set ESLint warning baseline"

# Update baseline after each phase completion
```

**Goal:** Block PRs that introduce new warnings

---

### 4.4 Developer Documentation

#### Create: docs/eslint-guide.md

````markdown
# ESLint Guidelines for Shuffle & Sync

## Type Safety Best Practices

### ✅ DO: Use Specific Types

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): Promise<User> {
  return api.get<User>(`/users/${id}`);
}
```
````

### ❌ DON'T: Use `any`

```typescript
function getUser(id: string): Promise<any> {
  return api.get(`/users/${id}`);
}
```

### 🔧 WHEN `any` IS ACCEPTABLE

- Third-party library with no types (add `// eslint-disable-line`)
- Truly dynamic runtime data (use `unknown` instead)
- Migration phase (add `// TODO: type this` comment)

## Unused Variables

### ✅ DO: Prefix with `_` if Intentionally Unused

```typescript
function middleware(req: Request, res: Response, _next: NextFunction) {
  // _next indicates "I know this is unused but required by signature"
}
```

### ❌ DON'T: Leave Unused Variables

```typescript
function processData(data: any[]) {
  const result = transform(data);
  const formatted = format(data); // Unused!
  return result;
}
```

## Pre-Commit Checklist

- [ ] Run `npm run lint` locally
- [ ] Fix all auto-fixable issues
- [ ] Verify no new warnings introduced
- [ ] Document any necessary `eslint-disable` comments

```

---

### 4.5 Remaining Warnings Strategy

After Phase 3, <50 warnings will remain. Categorize them:

#### Category A: Technical Debt (Target: Document & Schedule)
- Complex refactoring required
- Dependency on external library updates
- Low priority / low risk

**Action:** Add to technical debt backlog with priority

#### Category B: Acceptable Violations (Target: Suppress with Justification)
- Third-party library limitations
- Performance-critical code with valid `any` usage
- Test utilities with dynamic types

**Action:** Add `// eslint-disable-next-line` with comment explaining why

#### Category C: Future Work (Target: Defer)
- Nice-to-have type improvements
- Non-critical code quality issues

**Action:** Create tracking issue, defer to Phase 5

---

### 4.6 Phase 4 Tracking

**Setup Checklist:**
- [ ] Update ESLint configuration
- [ ] Install and configure Husky
- [ ] Set up lint-staged
- [ ] Create GitHub Action workflow
- [ ] Set warning baseline
- [ ] Document guidelines
- [ ] Train team on new processes

**Ongoing Metrics:**
- Warning count trend (graph weekly)
- New warnings introduced per PR
- Time to fix warnings (velocity tracking)
- Developer adherence to guidelines

---

## Success Metrics & Tracking

### Overall Progress Dashboard

```

┌─────────────────────────────────────────────────────────────┐
│ ESLint Remediation Progress │
├─────────────────────────────────────────────────────────────┤
│ │
│ Phase 1 (Week 1) ████████████░░░░░░░░ 60% → Target: 100%│
│ Phase 2 (Week 2) ███░░░░░░░░░░░░░░░░░ 15% → Target: 100%│
│ Phase 3 (Week 3-4) ░░░░░░░░░░░░░░░░░░░ 0% → Target: 100%│
│ Phase 4 (Ongoing) ░░░░░░░░░░░░░░░░░░░ 0% → Target: 100%│
│ │
│ Total Warnings: 789 → 470 → 300 → <50 → <10 │
│ │
└─────────────────────────────────────────────────────────────┘

````

### Weekly Reporting Template

```markdown
## Week [N] ESLint Progress Report

**Date:** [Date]
**Phase:** [Current Phase]

### Metrics
- Starting warnings: [N]
- Ending warnings: [N]
- Warnings fixed: [N] (-[%]%)
- Hours invested: [N]
- Files updated: [N]

### Highlights
- ✅ Completed: [List of accomplishments]
- 🚧 In Progress: [Current work]
- ⚠️ Blockers: [Any issues]

### Next Week Goals
1. [Goal 1]
2. [Goal 2]
3. [Goal 3]

### Team Feedback
- [Any learnings or suggestions]
````

---

## Risk Mitigation

### Risk: Breaking Changes During Type Safety Work

**Mitigation:**

- Comprehensive test suite run after each batch
- Pair programming for complex type changes
- Rollback plan (Git branching strategy)
- Incremental PRs vs. massive changes

### Risk: Developer Fatigue / Burnout

**Mitigation:**

- Rotate assignments between developers
- Mix easy wins with challenging work
- Celebrate milestones (post in team channel)
- Flexible timeline - phases can slip by a few days

### Risk: New Warnings During Remediation

**Mitigation:**

- CI/CD blocks new warnings immediately
- Daily lint checks in standup
- Feature freeze on high-warning files during cleanup

### Risk: Scope Creep

**Mitigation:**

- Strict focus on warning remediation only
- Defer "nice to have" refactorings
- Document future improvements separately
- Time-box each task

---

## Communication Plan

### Daily Standups

- Report: Warnings fixed yesterday
- Plan: Warnings to fix today
- Blockers: Any type-related issues

### Weekly Team Sync

- Review progress dashboard
- Adjust timeline if needed
- Share learnings and patterns
- Plan next week's assignments

### PR Guidelines

- PR Title: `[ESLint] Fix [rule-name] in [file/feature]`
- PR Description template:

  ```
  ## Warnings Fixed
  - [File]: [N] warnings ([rule-name])

  ## Changes
  - [Describe changes]

  ## Testing
  - [x] Tests pass
  - [x] No new warnings introduced
  - [x] Manually verified affected features

  ## Related
  - Phase: [N]
  - Tracking Issue: #[N]
  ```

---

## Appendix

### A. Quick Reference - Fix Patterns

**Pattern 1: Database Query Types**

```typescript
// Before
const results: any = await db.select().from(table);

// After
const results: InferModel<typeof table>[] = await db.select().from(table);
```

**Pattern 2: API Response Types**

```typescript
// Before
const response: any = await fetch(url).then((r) => r.json());

// After
interface APIResponse {
  /* ... */
}
const response: APIResponse = await fetch(url).then((r) => r.json());
```

**Pattern 3: Event Handlers**

```typescript
// Before
const handleClick = (e: any) => {
  /* ... */
};

// After
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  /* ... */
};
```

**Pattern 4: Error Handling**

```typescript
// Before
catch (error: any) { console.error(error); }

// After
catch (error) {
  if (error instanceof Error) {
    console.error(error.message);
  }
}
```

---

### B. Useful Commands

```bash
# Count warnings by file
npm run lint -- --format json | jq '[.[] | {file: .filePath, warnings: .warningCount}] | sort_by(.warnings) | reverse | .[0:20]'

# Count warnings by rule
npm run lint -- --format json | jq '[.[] | .messages[] | .ruleId] | group_by(.) | map({rule: .[0], count: length}) | sort_by(.count) | reverse'

# Find files with specific rule
npm run lint -- --format json | jq '.[] | select(.messages[] | .ruleId == "rule-name") | .filePath'

# Lint specific directory
npm run lint -- server/services/

# Lint and fix specific file
npm run lint -- --fix server/storage.ts
```

---

### C. Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [ESLint TypeScript Plugin](https://typescript-eslint.io/)
- [Drizzle ORM Type Inference](https://orm.drizzle.team/docs/goodies#type-api)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

---

**Document Status:** Living document - update weekly during remediation  
**Owner:** Development Team Lead  
**Last Updated:** 2025-10-19  
**Next Review:** After Phase 1 completion
