# Architecture Refactoring Action Plan

This document provides specific, actionable steps to implement the recommendations from the Architecture Review. Each section includes concrete examples and file paths.

## Quick Reference

| Priority  | Action                                  | Files Affected | Estimated Time      |
| --------- | --------------------------------------- | -------------- | ------------------- |
| 🔴 High   | Move auth routes to features            | 6 files        | 2 hours             |
| 🔴 High   | Create collaborative-streaming feature  | 10+ files      | 4 hours             |
| 🟡 Medium | Extract friend request logic to service | 3 files        | 1 hour              |
| 🟡 Medium | Standardize import ordering             | 100+ files     | 4 hours (automated) |
| 🟢 Low    | Rename page files to PascalCase         | 19 files       | 2 hours             |

---

## Action 1: Move Auth Routes to Features [HIGH PRIORITY]

### Current Structure

```
server/routes/auth/
├── index.ts
├── mfa.ts
├── middleware.ts
├── password.ts
├── register.ts
└── tokens.ts
```

### Target Structure

```
server/features/auth/
├── auth.routes.ts              (existing)
├── auth.service.ts             (existing)
├── auth.types.ts               (existing)
└── routes/                     (new directory)
    ├── index.ts                (move from server/routes/auth/)
    ├── mfa.routes.ts           (rename from mfa.ts)
    ├── middleware.ts           (move as-is)
    ├── password.routes.ts      (rename from password.ts)
    ├── register.routes.ts      (rename from register.ts)
    └── tokens.routes.ts        (rename from tokens.ts)
```

### Steps

1. **Create routes subdirectory**

```bash
mkdir -p server/features/auth/routes
```

2. **Move and rename files**

```bash
mv server/routes/auth/index.ts server/features/auth/routes/index.ts
mv server/routes/auth/mfa.ts server/features/auth/routes/mfa.routes.ts
mv server/routes/auth/middleware.ts server/features/auth/routes/middleware.ts
mv server/routes/auth/password.ts server/features/auth/routes/password.routes.ts
mv server/routes/auth/register.ts server/features/auth/routes/register.routes.ts
mv server/routes/auth/tokens.ts server/features/auth/routes/tokens.routes.ts
rmdir server/routes/auth
```

3. **Update imports in moved files**

In `server/features/auth/routes/mfa.routes.ts`:

```typescript
// Before
import { logger } from "../../logger";
import { storage } from "../../storage";

// After
import { logger } from "../../../logger";
import { storage } from "../../../storage";
```

4. **Update imports in server/index.ts**

Find this line:

```typescript
// import authRoutesFixed from "./auth/auth.routes";  // Currently commented
```

Replace with:

```typescript
import authRouter from "./features/auth/routes/index";
```

5. **Update main auth routes export**

In `server/features/auth/routes/index.ts`, ensure it exports the router:

```typescript
import { Router } from "express";
import mfaRouter from "./mfa.routes";
import passwordRouter from "./password.routes";
import registerRouter from "./register.routes";
import tokensRouter from "./tokens.routes";

const router = Router();

router.use("/mfa", mfaRouter);
router.use("/password", passwordRouter);
router.use("/register", registerRouter);
router.use("/tokens", tokensRouter);

export default router;
```

6. **Test**

```bash
npm run check
npm test -- server/features/auth
npm run dev  # Manually test auth endpoints
```

---

## Action 2: Create Collaborative Streaming Feature [HIGH PRIORITY]

### Files to Move

**Services:**

- `server/services/collaborative-streaming.ts` → `server/features/collaborative-streaming/collaborative-streaming.service.ts`
- `server/services/streaming-coordinator.ts` → `server/features/collaborative-streaming/streaming-coordinator.service.ts`
- `server/services/ai-streaming-matcher.ts` → `server/features/collaborative-streaming/ai-streaming-matcher.service.ts`

**Routes:**

- `server/routes/streaming/*` → `server/features/collaborative-streaming/routes/`

### Steps

1. **Create feature directory structure**

```bash
mkdir -p server/features/collaborative-streaming/routes
```

2. **Move service files**

```bash
mv server/services/collaborative-streaming.ts \
   server/features/collaborative-streaming/collaborative-streaming.service.ts

mv server/services/streaming-coordinator.ts \
   server/features/collaborative-streaming/streaming-coordinator.service.ts

mv server/services/ai-streaming-matcher.ts \
   server/features/collaborative-streaming/ai-streaming-matcher.service.ts
```

3. **Move route files**

```bash
mv server/routes/streaming/events.ts \
   server/features/collaborative-streaming/routes/events.routes.ts

mv server/routes/streaming/collaborators.ts \
   server/features/collaborative-streaming/routes/collaborators.routes.ts

mv server/routes/streaming/coordination.ts \
   server/features/collaborative-streaming/routes/coordination.routes.ts

mv server/routes/streaming/suggestions.ts \
   server/features/collaborative-streaming/routes/suggestions.routes.ts

mv server/routes/streaming/index.ts \
   server/features/collaborative-streaming/routes/index.ts

rmdir server/routes/streaming
```

4. **Create types file**

Create `server/features/collaborative-streaming/collaborative-streaming.types.ts`:

```typescript
// Extract types from service files and centralize here
export interface StreamingEvent {
  // ... types
}

export interface StreamCollaborator {
  // ... types
}

// etc.
```

5. **Update imports in service files**

In `server/features/collaborative-streaming/collaborative-streaming.service.ts`:

```typescript
// Before
import { logger } from "../logger";
import { storage } from "../storage";
import { streamingCoordinator } from "./streaming-coordinator";

// After
import { logger } from "../../logger";
import { storage } from "../../storage";
import { streamingCoordinator } from "./streaming-coordinator.service";
import type {
  StreamingEvent,
  StreamCollaborator,
} from "./collaborative-streaming.types";
```

6. **Update imports in route files**

In `server/features/collaborative-streaming/routes/events.routes.ts`:

```typescript
// Before
import { collaborativeStreamingService } from "../../services/collaborative-streaming";

// After
import { collaborativeStreamingService } from "../collaborative-streaming.service";
```

7. **Update imports in server/routes.ts**

Find:

```typescript
import streamingRouter from "./routes/streaming";
```

Replace with:

```typescript
import streamingRouter from "./features/collaborative-streaming/routes";
```

8. **Create feature README**

Create `server/features/collaborative-streaming/README.md`:

````markdown
# Collaborative Streaming Feature

Manages multi-streamer coordination, automated scheduling, and real-time collaboration.

## Components

- `collaborative-streaming.service.ts` - Main service for collaborative streaming
- `streaming-coordinator.service.ts` - Coordinates between multiple streamers
- `ai-streaming-matcher.service.ts` - AI-powered matching for stream collaborations
- `routes/` - API endpoints for streaming coordination

## API Endpoints

- `POST /api/collaborative-streams` - Create new streaming event
- `GET /api/collaborative-streams/:id` - Get streaming event details
- `POST /api/collaborative-streams/:id/collaborators` - Add collaborator
- ... (document all endpoints)

## Usage

```typescript
import { collaborativeStreamingService } from "./features/collaborative-streaming/collaborative-streaming.service";

const event = await collaborativeStreamingService.createCollaborativeEvent(
  userId,
  eventData,
);
```
````

````

9. **Test**
```bash
npm run check
npm test -- server/features/collaborative-streaming
npm run dev  # Test streaming endpoints
````

---

## Action 3: Extract Friend Request Logic to Service [MEDIUM PRIORITY]

### Current Implementation (in server/routes.ts)

Lines 138-186 contain business logic in route handler.

### Refactored Implementation

**Step 1: Create service method**

In `server/features/users/users.service.ts`, add:

```typescript
/**
 * Send a friend request to another user
 * @throws ValidationError if trying to send request to self
 * @throws ConflictError if friendship already exists
 */
async sendFriendRequest(
  requesterId: string,
  addresseeId: string
): Promise<Friendship> {
  // Validate business rules
  if (requesterId === addresseeId) {
    throw new ValidationError("Cannot send friend request to yourself");
  }

  // Check for existing friendship
  const existingFriendship = await storage.checkFriendshipStatus(
    requesterId,
    addresseeId
  );
  if (existingFriendship) {
    throw new ConflictError("Friendship request already exists");
  }

  // Create friendship
  const friendship = await storage.sendFriendRequest(requesterId, addresseeId);

  // Send notification (part of business logic)
  await storage.createNotification({
    userId: addresseeId,
    type: "friend_request",
    title: "New Friend Request",
    message: `You have a new friend request`,
    data: JSON.stringify({
      friendshipId: friendship.id,
      requesterId
    }),
  });

  logger.info("Friend request sent", {
    requesterId,
    addresseeId,
    friendshipId: friendship.id,
  });

  return friendship;
}

/**
 * Respond to a friend request
 * @throws NotFoundError if friendship not found
 */
async respondToFriendRequest(
  userId: string,
  friendshipId: string,
  status: "accepted" | "declined" | "blocked"
): Promise<Friendship> {
  const friendship = await storage.respondToFriendRequest(friendshipId, status);

  // Send notification if accepted
  if (status === "accepted") {
    await storage.createNotification({
      userId: friendship.requesterId,
      type: "friend_accepted",
      title: "Friend Request Accepted",
      message: `Your friend request was accepted`,
      data: JSON.stringify({ friendshipId: friendship.id }),
    });
  }

  logger.info("Friend request responded", {
    userId,
    friendshipId,
    status,
  });

  return friendship;
}
```

**Step 2: Update route handler**

In `server/routes.ts`, replace lines 138-186 with:

```typescript
app.post("/api/friend-requests", isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const requesterId = getAuthUserId(authenticatedReq);
    const { addresseeId } = req.body;

    if (!addresseeId) {
      return res.status(400).json({ message: "Addressee ID is required" });
    }

    const friendship = await usersService.sendFriendRequest(
      requesterId,
      addresseeId,
    );

    return res.status(201).json(friendship);
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ message: error.message });
    }
    if (error instanceof ConflictError) {
      return res.status(409).json({ message: error.message });
    }
    logger.error("Failed to send friend request", error, {
      userId: getAuthUserId(authenticatedReq),
    });
    return res.status(500).json({ message: "Failed to send friend request" });
  }
});

app.put("/api/friend-requests/:id", isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = getAuthUserId(authenticatedReq);
    const id = assertRouteParam(req.params.id, "id");
    const { status } = req.body;

    if (!["accepted", "declined", "blocked"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const friendship = await usersService.respondToFriendRequest(
      userId,
      id,
      status,
    );

    return res.json(friendship);
  } catch (error) {
    logger.error("Failed to respond to friend request", error, {
      userId: getAuthUserId(authenticatedReq),
    });
    return res.status(500).json({
      message: "Failed to respond to friend request",
    });
  }
});
```

**Step 3: Add tests**

Create `server/features/users/users.service.test.ts`:

```typescript
import { UsersService } from "./users.service";
import {
  ValidationError,
  ConflictError,
} from "../../middleware/error-handling.middleware";

describe("UsersService - Friend Requests", () => {
  let usersService: UsersService;

  beforeEach(() => {
    usersService = new UsersService();
  });

  describe("sendFriendRequest", () => {
    it("should throw ValidationError when sending request to self", async () => {
      const userId = "user-123";

      await expect(
        usersService.sendFriendRequest(userId, userId),
      ).rejects.toThrow(ValidationError);
    });

    it("should throw ConflictError when friendship already exists", async () => {
      // Mock existing friendship
      // ... test implementation
    });

    it("should create friendship and send notification", async () => {
      // ... test implementation
    });
  });

  describe("respondToFriendRequest", () => {
    it("should accept friend request and notify requester", async () => {
      // ... test implementation
    });

    it("should decline friend request without notification", async () => {
      // ... test implementation
    });
  });
});
```

---

## Action 4: Standardize Import Ordering [MEDIUM PRIORITY]

### Automated Approach

**Step 1: Install ESLint plugin**

```bash
npm install --save-dev --legacy-peer-deps eslint-plugin-import
```

**Step 2: Update eslint.config.js**

Add to the configuration:

```javascript
{
  plugins: {
    import: importPlugin,
  },
  rules: {
    "import/order": [
      "error",
      {
        groups: [
          "builtin",
          "external",
          "internal",
          ["parent", "sibling"],
          "index",
          "type",
        ],
        pathGroups: [
          {
            pattern: "@shared/**",
            group: "internal",
            position: "before",
          },
          {
            pattern: "@/**",
            group: "internal",
            position: "after",
          },
        ],
        pathGroupsExcludedImportTypes: ["builtin"],
        "newlines-between": "always",
        alphabetize: {
          order: "asc",
          caseInsensitive: true,
        },
      },
    ],
  },
}
```

**Step 3: Run auto-fix**

```bash
npm run lint -- --fix
```

**Step 4: Manual fixes for remaining issues**

Some files may need manual adjustment. Example fix in `server/routes/analytics.ts`:

Before:

```typescript
import { Router } from "express";
import { analyticsService } from "../services/analytics-service";
import { storage } from "../storage";
import { logger } from "../logger";
import { z } from "zod";
import { isAuthenticated, getAuthUserId } from "../auth";
```

After:

```typescript
// External libraries
import { Router } from "express";
import { z } from "zod";

// Internal relative imports
import { analyticsService } from "../services/analytics-service";
import { isAuthenticated, getAuthUserId } from "../auth";
import { logger } from "../logger";
import { storage } from "../storage";
```

**Step 5: Verify**

```bash
npm run check
npm run lint
npm test
```

---

## Action 5: Rename Page Files to PascalCase [LOW PRIORITY]

### Automated Approach with Script

**Step 1: Create rename script**

Create `scripts/rename-pages.sh`:

```bash
#!/bin/bash

cd client/src/pages

# Define rename mappings
declare -A renames=(
  ["api-docs.tsx"]="ApiDocs.tsx"
  ["calendar.tsx"]="Calendar.tsx"
  ["community-forum.tsx"]="CommunityForum.tsx"
  ["conduct.tsx"]="Conduct.tsx"
  ["contact.tsx"]="Contact.tsx"
  ["faq.tsx"]="FAQ.tsx"
  ["game-room.tsx"]="GameRoom.tsx"
  ["getting-started.tsx"]="GettingStarted.tsx"
  ["help-center.tsx"]="HelpCenter.tsx"
  ["home.tsx"]="Home.tsx"
  ["landing.tsx"]="Landing.tsx"
  ["matchmaking.tsx"]="Matchmaking.tsx"
  ["not-found.tsx"]="NotFound.tsx"
  ["privacy.tsx"]="Privacy.tsx"
  ["tablesync.tsx"]="TableSync.tsx"
  ["tablesync-landing.tsx"]="TableSyncLanding.tsx"
  ["terms.tsx"]="Terms.tsx"
  ["tournament-detail.tsx"]="TournamentDetail.tsx"
  ["tournaments.tsx"]="Tournaments.tsx"
)

# Rename files
for old in "${!renames[@]}"; do
  new="${renames[$old]}"
  if [ -f "$old" ]; then
    echo "Renaming $old to $new"
    git mv "$old" "$new"
  fi
done

# Also rename test files
for test_file in *.test.tsx; do
  if [ -f "$test_file" ]; then
    # Extract base name and apply same transformation
    base="${test_file%.test.tsx}"
    if [ -n "${renames[$base.tsx]}" ]; then
      new_base="${renames[$base.tsx]%.tsx}"
      new_test="${new_base}.test.tsx"
      echo "Renaming $test_file to $new_test"
      git mv "$test_file" "$new_test"
    fi
  fi
done
```

**Step 2: Update imports in App.tsx**

Find routing configuration (likely in `client/src/App.tsx`):

Before:

```typescript
import Home from "./pages/home";
import Landing from "./pages/landing";
import Calendar from "./pages/calendar";
// ... etc
```

After:

```typescript
import Home from "./pages/Home";
import Landing from "./pages/Landing";
import Calendar from "./pages/Calendar";
// ... etc
```

**Step 3: Run the script**

```bash
chmod +x scripts/rename-pages.sh
bash scripts/rename-pages.sh
```

**Step 4: Update all imports**

Use find and replace to update imports:

```bash
# Find all imports of renamed files
grep -r "from.*pages/" client/src --include="*.tsx" --include="*.ts" | grep -v "test"

# Update with sed or manually
```

**Step 5: Verify**

```bash
npm run check
npm test -- client/src/pages
npm run dev  # Check that routing still works
```

---

## Action 6: Add Service Suffix to Service Files [LOW PRIORITY]

### Files to Rename

```bash
# In server/services/ (before moving to features)
mv collaborative-streaming.ts collaborative-streaming.service.ts
mv streaming-coordinator.ts streaming-coordinator.service.ts
mv ai-streaming-matcher.ts ai-streaming-matcher.service.ts
mv card-recognition.ts card-recognition.service.ts
mv waitlist.ts waitlist.service.ts

# Update imports everywhere these files are used
```

### Update Script

Create `scripts/rename-services.sh`:

```bash
#!/bin/bash

cd server/services

# Rename service files without .service suffix
for file in *.ts; do
  # Skip files that already have .service suffix or are not services
  if [[ ! "$file" =~ \.service\.ts$ ]] && [[ "$file" != "redis-client.ts" ]]; then
    new_name="${file%.ts}.service.ts"
    echo "Renaming $file to $new_name"
    git mv "$file" "$new_name"
  fi
done
```

### Update Imports

After renaming, update all imports. Example:

Before:

```typescript
import { streamingCoordinator } from "./services/streaming-coordinator";
```

After:

```typescript
import { streamingCoordinator } from "./services/streaming-coordinator.service";
```

Use global find-replace in your IDE or:

```bash
# Find all occurrences
grep -r "from.*streaming-coordinator\"" server --include="*.ts"

# Replace (be careful with this)
find server -type f -name "*.ts" -exec sed -i 's/streaming-coordinator"/streaming-coordinator.service"/g' {} +
```

---

## Action 7: Move User Repository to Features [LOW PRIORITY]

### Steps

1. **Move file**

```bash
mv server/repositories/user.repository.ts \
   server/features/users/users.repository.ts
```

2. **Update imports in users.service.ts**

Before:

```typescript
import { UserRepository } from "../repositories/user.repository";
```

After:

```typescript
import { UserRepository } from "./users.repository";
```

3. **Update imports in other files**

Search for imports:

```bash
grep -r "from.*repositories/user.repository" server --include="*.ts"
```

Update each occurrence:

```typescript
// Before
import { UserRepository } from "../repositories/user.repository";

// After (adjust path as needed)
import { UserRepository } from "../features/users/users.repository";
```

4. **Keep base.repository.ts**

The base repository should stay in `server/repositories/` as it's shared infrastructure:

```
server/repositories/
└── base.repository.ts  (keep here)
```

5. **Update base.repository import in users.repository.ts**

```typescript
// In server/features/users/users.repository.ts
import { BaseRepository } from "../../repositories/base.repository";
```

---

## Verification Checklist

After each action, verify:

- [ ] TypeScript compiles without errors: `npm run check`
- [ ] All tests pass: `npm test`
- [ ] Linting passes: `npm run lint`
- [ ] Application runs: `npm run dev`
- [ ] Manual testing of affected features works
- [ ] No broken imports in the codebase
- [ ] Documentation is updated

---

## Rollback Plan

If any action causes issues:

1. **Use git to rollback**

```bash
git status  # See what changed
git checkout -- <file>  # Rollback specific file
git reset --hard HEAD  # Rollback all changes (nuclear option)
```

2. **Incremental approach**

- Test each step before moving to the next
- Commit after each successful step
- Create a branch for major refactors

3. **Keep track of changes**

```bash
git log --oneline  # See recent commits
git diff HEAD~1    # See what changed in last commit
```

---

## Timeline Estimate

| Week   | Actions                        | Total Time  |
| ------ | ------------------------------ | ----------- |
| Week 1 | Actions 1-2 (Auth + Streaming) | 10-12 hours |
| Week 2 | Action 3 (Service extraction)  | 8-10 hours  |
| Week 3 | Action 4 (Import ordering)     | 6-8 hours   |
| Week 4 | Actions 5-7 (Naming + cleanup) | 8-10 hours  |

**Total Estimated Time**: 32-40 hours of focused development work

**Recommendation**: Spread this over 4-6 weeks with careful testing at each step to avoid disrupting ongoing development.

---

## Questions to Answer Before Starting

1. **Can we pause feature development** during refactoring to avoid merge conflicts?
2. **Do we have good test coverage** for the areas being refactored?
3. **Should we do this incrementally** (one feature at a time) or in a big bang?
4. **Who will review** the refactoring PRs?
5. **How do we communicate** these changes to the team?

---

## Communication Plan

1. **Before Starting**
   - Share architecture review and action plan with team
   - Discuss timeline and approach
   - Assign responsibilities

2. **During Refactoring**
   - Create separate PRs for each action
   - Document changes in PR descriptions
   - Update team in daily standups

3. **After Completion**
   - Update CODING_PATTERNS.md
   - Create onboarding documentation
   - Share lessons learned

---

## Success Metrics

Track these metrics before and after refactoring:

- Lines of code in `server/routes.ts` (target: reduce by 50%)
- Number of files in `server/services/` (target: reduce by 70%)
- Number of import ordering violations (target: 0)
- Number of naming convention violations (target: 0)
- Test coverage percentage (target: maintain or improve)
- Build time (target: maintain or improve)
- Developer satisfaction (survey before/after)
