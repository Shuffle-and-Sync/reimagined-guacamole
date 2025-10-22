# Codebase Architecture Review

**Review Date**: October 2025  
**Scope**: Feature Organization, Layer Separation, Import Patterns, and Naming Conventions

## Executive Summary

This document provides a comprehensive review of the Shuffle & Sync codebase architecture, focusing on adherence to feature-based organization, layer separation, import standards, and naming conventions as outlined in the project's coding guidelines.

### Overall Assessment

- **Feature Organization**: ⚠️ Partially Implemented - Good foundation but needs consolidation
- **Layer Separation**: ✅ Generally Good - Clear separation with minor improvements needed
- **Import Organization**: ⚠️ Inconsistent - Mixed patterns across the codebase
- **Naming Conventions**: ⚠️ Needs Improvement - Several violations of established standards

---

## 1. Feature-Based Organization

### Current State

**Server-side features** (`server/features/`):

- ✅ `auth/` - Authentication services
- ✅ `cards/` - Card recognition and management
- ✅ `communities/` - Community management
- ✅ `events/` - Event coordination
- ✅ `game-stats/` - Game statistics
- ✅ `games/` - Game CRUD operations
- ✅ `messaging/` - Messaging and notifications
- ✅ `tournaments/` - Tournament management
- ✅ `users/` - User profile management

**Client-side features** (`client/src/features/`):

- ✅ `auth/` - Authentication hooks and types
- ✅ `collaborative-streaming/` - Streaming coordination UI
- ✅ `communities/` - Community components and hooks
- ✅ `events/` - Event management UI
- ✅ `game-stats/` - Game statistics UI
- ✅ `messaging/` - Messaging components
- ✅ `users/` - User profile components

### Issues Identified

#### 1.1 Server Services Not in Features

**Problem**: 20+ service files exist in `server/services/` that should be organized into appropriate features.

**Files Requiring Organization**:

```
server/services/
├── collaborative-streaming.ts        → Should be in features/collaborative-streaming/
├── streaming-coordinator.ts          → Should be in features/collaborative-streaming/
├── ai-streaming-matcher.ts           → Should be in features/collaborative-streaming/
├── analytics-service.ts              → Could be features/analytics/
├── backup-service.ts                 → Infrastructure service (OK here)
├── cache-service.ts                  → Infrastructure service (OK here)
├── card-recognition.ts               → Should be in features/cards/
├── enhanced-notification.ts          → Should be in features/messaging/
├── enhanced-notifications.ts         → Should be in features/messaging/ (duplicate?)
├── notification-delivery.ts          → Should be in features/messaging/
├── notification-templates.ts         → Should be in features/messaging/
├── error-tracking.ts                 → Infrastructure service (OK here)
├── facebook-api.ts                   → Should be in features/platforms/
├── twitch-api.ts                     → Should be in features/platforms/
├── youtube-api.ts                    → Should be in features/platforms/
├── platform-oauth.ts                 → Should be in features/platforms/
├── graphics-generator.ts             → Should be in features/events/ or features/graphics/
├── infrastructure-test-service.ts    → Infrastructure service (OK here)
├── monitoring-service.ts             → Infrastructure service (OK here)
├── real-time-matching-api.ts         → Should be in features/matchmaking/
├── redis-client.ts                   → Infrastructure service (OK here)
├── user.service.ts                   → Should be in features/users/
├── waitlist.ts                       → Should be in features/events/
├── games/game.service.ts             → Already in correct structure ✅
```

**Recommendation**: Create a migration plan to move feature-specific services into their respective feature directories while keeping infrastructure services (cache, monitoring, error-tracking, redis) in `server/services/`.

#### 1.2 Server Routes Not in Features

**Problem**: 13 route files exist in `server/routes/` outside the feature structure.

**Files Requiring Organization**:

```
server/routes/
├── analytics.ts                      → Should be features/analytics/analytics.routes.ts
├── forum.routes.ts                   → Should be features/forum/forum.routes.ts
├── game-sessions.routes.ts           → Should be features/game-sessions/game-sessions.routes.ts
├── matching.ts                       → Should be features/matchmaking/matchmaking.routes.ts
├── notification-preferences.ts       → Should be features/messaging/notification-preferences.routes.ts
├── platforms.routes.ts               → Should be features/platforms/platforms.routes.ts
├── user-profile.routes.ts            → Should be features/users/user-profile.routes.ts
├── streaming/                        → Should be features/collaborative-streaming/routes/
│   ├── events.ts
│   ├── collaborators.ts
│   ├── coordination.ts
│   └── suggestions.ts
├── auth/                             → Should be features/auth/routes/
│   ├── mfa.ts
│   ├── password.ts
│   ├── register.ts
│   └── tokens.ts
├── backup.ts                         → Infrastructure route (OK here)
├── cache-health.ts                   → Infrastructure route (OK here)
├── database-health.ts                → Infrastructure route (OK here)
├── infrastructure-tests.ts           → Infrastructure route (OK here)
├── monitoring.ts                     → Infrastructure route (OK here)
└── webhooks.ts                       → Infrastructure route (OK here)
```

**Recommendation**: Consolidate feature-specific routes into their respective feature directories. Keep infrastructure and health check routes in `server/routes/`.

#### 1.3 Repositories Not Feature-Aligned

**Problem**: Repository pattern implementation exists but not aligned with features.

**Current Structure**:

```
server/repositories/
├── base.repository.ts                → Good base pattern
└── user.repository.ts                → Should be in features/users/
```

**Recommendation**:

- Move `user.repository.ts` to `features/users/users.repository.ts`
- Keep `base.repository.ts` as shared infrastructure
- Create repositories for other features as needed (events, communities, etc.)

#### 1.4 Missing Feature Directories

**Problem**: Some features have routes/services but no dedicated feature directory.

**Missing Features**:

- `server/features/collaborative-streaming/` - Has routes in `server/routes/streaming/` and service in `server/services/`
- `server/features/analytics/` - Has route in `server/routes/analytics.ts`
- `server/features/matchmaking/` - Has route in `server/routes/matching.ts`
- `server/features/platforms/` - Has routes and services scattered
- `server/features/forum/` - Has route in `server/routes/forum.routes.ts`
- `server/features/game-sessions/` - Has route in `server/routes/game-sessions.routes.ts`

**Recommendation**: Create these feature directories with proper structure:

```
features/{feature-name}/
├── {feature-name}.routes.ts          # Express routes
├── {feature-name}.service.ts         # Business logic
├── {feature-name}.repository.ts      # Data access (if needed)
└── {feature-name}.types.ts           # TypeScript types
```

---

## 2. Layer Separation

### Current Assessment

**✅ Strengths**:

- Clear presentation layer in React components
- Well-defined API layer with Express routes
- Service layer handles business logic
- Repository pattern established with base class

**⚠️ Areas for Improvement**:

#### 2.1 Business Logic in Routes

**Issue**: Some route handlers in `server/routes.ts` contain business logic that should be in services.

**Example - Friend Request Logic** (lines 138-186 in `server/routes.ts`):

```typescript
app.post("/api/friend-requests", isAuthenticated, async (req, res) => {
  try {
    const requesterId = getAuthUserId(authenticatedReq);
    const { addresseeId } = req.body;

    // ❌ Business logic in route handler
    if (requesterId === addresseeId) {
      return res
        .status(400)
        .json({ message: "Cannot send friend request to yourself" });
    }

    // ❌ Business logic in route handler
    const existingFriendship = await storage.checkFriendshipStatus(
      requesterId,
      addresseeId,
    );
    if (existingFriendship) {
      return res
        .status(400)
        .json({ message: "Friendship request already exists" });
    }

    const friendship = await storage.sendFriendRequest(
      requesterId,
      addresseeId,
    );

    // ❌ Business logic in route handler
    await storage.createNotification({
      userId: addresseeId,
      type: "friend_request",
      title: "New Friend Request",
      message: `You have a new friend request`,
      data: JSON.stringify({ friendshipId: friendship.id, requesterId }),
    });

    return res.status(201).json(friendship);
  } catch (error) {
    logger.error("Failed to send friend request", error);
    return res.status(500).json({ message: "Failed to send friend request" });
  }
});
```

**Recommendation**: Extract to `features/users/users.service.ts`:

```typescript
// In users.service.ts
async sendFriendRequest(requesterId: string, addresseeId: string) {
  // Validate business rules
  if (requesterId === addresseeId) {
    throw new ValidationError("Cannot send friend request to yourself");
  }

  const existingFriendship = await storage.checkFriendshipStatus(requesterId, addresseeId);
  if (existingFriendship) {
    throw new ConflictError("Friendship request already exists");
  }

  // Execute business logic
  const friendship = await storage.sendFriendRequest(requesterId, addresseeId);

  // Create notification as part of business logic
  await storage.createNotification({
    userId: addresseeId,
    type: "friend_request",
    title: "New Friend Request",
    message: `You have a new friend request`,
    data: JSON.stringify({ friendshipId: friendship.id, requesterId }),
  });

  return friendship;
}

// In routes
app.post("/api/friend-requests", isAuthenticated, async (req, res) => {
  try {
    const requesterId = getAuthUserId(authenticatedReq);
    const { addresseeId } = req.body;
    const friendship = await usersService.sendFriendRequest(requesterId, addresseeId);
    return res.status(201).json(friendship);
  } catch (error) {
    // Error handling...
  }
});
```

**Similar Issues Found In**:

- Matchmaking routes (lines 248-321)
- Event attendance routes (lines 828-919)
- Tournament routes (lines 323-447)
- Calendar/bulk event creation (lines 1178-1235)

#### 2.2 Direct Storage Access in Routes

**Issue**: Routes directly access `storage` object instead of going through service layer.

**Example** (lines 554-576 in `server/routes.ts`):

```typescript
app.get("/api/communities", async (req, res) => {
  try {
    // ❌ Direct storage access in route
    const communities = await storage.getCommunities();
    return res.json(communities);
  } catch (error) {
    logger.error("Failed to fetch communities", error);
    return res.status(500).json({ message: "Failed to fetch communities" });
  }
});
```

**Recommendation**: Use service layer:

```typescript
// In features/communities/communities.service.ts
async getCommunities() {
  return await storage.getCommunities();
}

// In route
app.get("/api/communities", async (req, res) => {
  try {
    const communities = await communitiesService.getCommunities();
    return res.json(communities);
  } catch (error) {
    // Error handling...
  }
});
```

**Count**: ~50+ instances of direct storage access in `server/routes.ts`

#### 2.3 React Components with Business Logic

**Issue**: Some React components contain complex business logic that should be in hooks or services.

**Example** - Event attendance logic mixed with UI (not shown in detail, but pattern observed in:

- `client/src/components/calendar/CalendarGrid.tsx`
- `client/src/features/collaborative-streaming/components/PlatformAccountManager.tsx`

**Recommendation**:

- Extract complex state management to custom hooks
- Move data transformation logic to utility functions
- Keep components focused on presentation

---

## 3. Import Organization

### Expected Order

1. External libraries (React, Express, third-party packages)
2. Internal absolute imports (`@shared`, `@client`, `@server`)
3. Relative imports (`../`, `./`)
4. Styles (CSS imports)

### Issues Identified

#### 3.1 Inconsistent Import Ordering

**Example - Mixed Ordering in `server/routes/analytics.ts`**:

```typescript
import { Router } from "express"; // ✅ External
import { analyticsService } from "../services/analytics-service"; // ❌ Should be after all external
import { storage } from "../storage"; // ❌ Relative import mixed with external
import { logger } from "../logger"; // ❌ Relative import mixed with external
import { z } from "zod"; // ❌ External import after relative
import {
  isAuthenticated,
  getAuthUserId,
  type AuthenticatedRequest,
} from "../auth"; // ❌ Relative import mixed
import { generalRateLimit } from "../rate-limiting"; // ❌ Relative import mixed
```

**Correct Order**:

```typescript
// External libraries
import { Router } from "express";
import { z } from "zod";

// Internal absolute imports (none in this file)

// Relative imports
import { analyticsService } from "../services/analytics-service";
import { storage } from "../storage";
import { logger } from "../logger";
import {
  isAuthenticated,
  getAuthUserId,
  type AuthenticatedRequest,
} from "../auth";
import { generalRateLimit } from "../rate-limiting";
```

#### 3.2 Good Examples of Import Ordering

**Example - Proper ordering in `client/src/features/auth/hooks/useAuth.ts`**:

```typescript
// ✅ External libraries first
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback } from "react";

// ✅ Internal absolute imports second
import { queryKeys } from "@/shared/constants/queryKeys";

// ✅ Relative imports last
import type { AuthSession } from "../types";
```

**Example - Proper ordering in `client/src/components/SettingsModal.tsx`**:

```typescript
// ✅ External libraries
import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";

// ✅ Internal absolute imports
import { useAuth } from "@/features/auth";
import { useCommunity } from "@/features/communities";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { UserSettings } from "@shared/schema";
```

#### 3.3 Path Alias Usage

**✅ Good**: Consistent use of path aliases in client code:

- `@/components/...` for components
- `@/features/...` for features
- `@/hooks/...` for hooks
- `@/lib/...` for library code
- `@shared/...` for shared schema

**⚠️ Issue**: Server code uses relative imports exclusively instead of path aliases:

```typescript
// Current
import { storage } from "../storage";
import { logger } from "../logger";

// Could be (if aliases configured)
import { storage } from "@server/storage";
import { logger } from "@server/logger";
```

**Recommendation**: Server path aliases are configured but not consistently used. Consider:

1. Keep using relative imports for server (current pattern is consistent)
2. OR migrate to aliases across the board for consistency with client

#### 3.4 Circular Dependencies

**No circular dependencies detected** during review. The layered architecture (routes → services → repositories → storage) prevents this issue.

---

## 4. File Naming Conventions

### Expected Conventions

- **React Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Non-component files**: kebab-case (e.g., `auth-service.ts`)
- **Test files**: `.test` suffix (e.g., `user-service.test.ts`)

### Issues Identified

#### 4.1 Page Files Using kebab-case

**Problem**: Page files in `client/src/pages/` use kebab-case instead of PascalCase.

**Files Requiring Rename**:

```
client/src/pages/
├── api-docs.tsx              → Should be ApiDocs.tsx
├── calendar.tsx              → Should be Calendar.tsx
├── community-forum.tsx       → Should be CommunityForum.tsx
├── conduct.tsx               → Should be Conduct.tsx
├── contact.tsx               → Should be Contact.tsx
├── faq.tsx                   → Should be Faq.tsx or FAQ.tsx
├── game-room.tsx             → Should be GameRoom.tsx
├── getting-started.tsx       → Should be GettingStarted.tsx
├── help-center.tsx           → Should be HelpCenter.tsx
├── home.tsx                  → Should be Home.tsx
├── landing.tsx               → Should be Landing.tsx
├── matchmaking.tsx           → Should be Matchmaking.tsx
├── not-found.tsx             → Should be NotFound.tsx
├── privacy.tsx               → Should be Privacy.tsx
├── tablesync.tsx             → Should be TableSync.tsx
├── tablesync-landing.tsx     → Should be TableSyncLanding.tsx
├── terms.tsx                 → Should be Terms.tsx
├── tournament-detail.tsx     → Should be TournamentDetail.tsx
└── tournaments.tsx           → Should be Tournaments.tsx
```

**Impact**: Medium - These are React components and should follow PascalCase convention for consistency.

#### 4.2 Server Service Files with Inconsistent Naming

**✅ Good Examples**:

- `auth-service.ts` (but should be in features)
- `cache-service.ts` ✅
- `analytics-service.ts` (but should be in features)
- `backup-service.ts` ✅
- `monitoring-service.ts` ✅

**⚠️ Inconsistent**:

- `collaborative-streaming.ts` - Should be `collaborative-streaming.service.ts` for clarity
- `streaming-coordinator.ts` - Should be `streaming-coordinator.service.ts`
- `ai-streaming-matcher.ts` - Should be `ai-streaming-matcher.service.ts`
- `card-recognition.ts` - Should be `card-recognition.service.ts`
- `waitlist.ts` - Should be `waitlist.service.ts`

**Recommendation**: Add `.service.ts` suffix to all service files for consistency and clarity.

#### 4.3 Test Files

**✅ Good**: Most test files follow `.test.tsx` or `.test.ts` convention:

- `useAuth.test.tsx` ✅
- `CommunityCard.test.tsx` ✅
- `JoinEventButton.test.tsx` ✅

**No issues found** with test file naming.

---

## 5. Architectural Risks

### 5.1 High-Priority Risks

#### Risk 1: Scattered Feature Logic

**Severity**: High  
**Description**: Feature logic is distributed across `features/`, `services/`, and `routes/` directories, making it difficult to understand complete feature implementations.

**Impact**:

- Increased cognitive load for developers
- Harder to onboard new team members
- Difficult to maintain feature completeness
- Risk of duplicated logic

**Example**: Collaborative Streaming feature has:

- Routes in `server/routes/streaming/`
- Service in `server/services/collaborative-streaming.ts`
- Additional services in `server/services/streaming-coordinator.ts` and `ai-streaming-matcher.ts`
- No entry in `server/features/`

**Mitigation**:

1. Create `server/features/collaborative-streaming/` directory
2. Move all related files into this feature directory
3. Update imports across the codebase
4. Document the feature structure in README

#### Risk 2: Business Logic in Routes

**Severity**: Medium  
**Description**: Approximately 50+ route handlers contain business logic that should be in service layer.

**Impact**:

- Difficult to unit test business logic
- Code duplication across similar routes
- Harder to reuse logic from other contexts (CLI, jobs, etc.)
- Violates single responsibility principle

**Mitigation**:

1. Extract business logic to service methods
2. Make route handlers thin coordinators
3. Add service layer tests
4. Follow the pattern established in `features/users/users.service.ts`

#### Risk 3: Duplicate Notification Services

**Severity**: Low  
**Description**: Two similarly named notification services exist:

- `server/services/enhanced-notification.ts`
- `server/services/enhanced-notifications.ts` (plural)

**Impact**:

- Confusion about which service to use
- Potential for divergent implementations
- Maintenance burden

**Mitigation**:

1. Audit both files to understand differences
2. Consolidate into single service
3. Update all imports
4. Remove duplicate file

### 5.2 Medium-Priority Risks

#### Risk 4: Large Monolithic Routes File

**Severity**: Medium  
**Description**: `server/routes.ts` is 1398 lines long and handles multiple features.

**Impact**:

- Difficult to navigate and understand
- Higher risk of merge conflicts
- Harder to maintain and test
- Violates modular design principles

**Mitigation**: Already in progress with feature-based routing. Continue migrating routes to feature directories.

#### Risk 5: Missing Client Feature

**Severity**: Low  
**Description**: Server has `collaborative-streaming` logic but client has it in features. Server should match.

**Impact**:

- Inconsistency between client and server organization
- Confusion for developers working full-stack

**Mitigation**: Create `server/features/collaborative-streaming/` to match client structure.

---

## 6. Recommendations Summary

### Immediate Actions (High Priority)

1. **Create Missing Feature Directories**
   - `server/features/collaborative-streaming/`
   - `server/features/analytics/`
   - `server/features/matchmaking/`
   - `server/features/platforms/`
   - `server/features/forum/`
   - `server/features/game-sessions/`

2. **Move Auth Routes to Features**
   - Move `server/routes/auth/*` to `server/features/auth/routes/`
   - Update imports in `server/index.ts`

3. **Consolidate Streaming Feature**
   - Move `server/routes/streaming/*` to `server/features/collaborative-streaming/routes/`
   - Move `server/services/collaborative-streaming.ts` to `server/features/collaborative-streaming/`
   - Move related services (streaming-coordinator, ai-streaming-matcher)

4. **Extract Business Logic from Routes**
   - Start with high-traffic routes (friends, events, tournaments)
   - Create service methods
   - Update route handlers to use services

### Short-term Actions (Medium Priority)

5. **Standardize Import Ordering**
   - Create ESLint rule to enforce import order
   - Run auto-fix across codebase
   - Document import standards in CODING_PATTERNS.md

6. **Rename Page Files to PascalCase**
   - Rename all page files in `client/src/pages/`
   - Update imports in routing configuration
   - Update references in documentation

7. **Add Service Suffix to Service Files**
   - Rename service files without `.service.ts` suffix
   - Update all imports
   - Ensure consistency

8. **Move User Repository to Features**
   - Move `server/repositories/user.repository.ts` to `server/features/users/`
   - Update imports
   - Consider creating repositories for other features

### Long-term Actions (Lower Priority)

9. **Complete Feature Migration**
   - Systematically move all route files to features
   - Migrate all feature-specific services
   - Update documentation

10. **Implement Repository Pattern Across Features**
    - Create repositories for events, communities, etc.
    - Move data access logic from storage to repositories
    - Add repository tests

11. **Create Feature READMEs**
    - Document each feature's structure
    - Explain feature boundaries
    - Provide usage examples

12. **Audit and Remove Dead Code**
    - Check for unused imports
    - Remove commented-out code
    - Clean up deprecated patterns

---

## 7. Migration Plan

### Phase 1: Foundation (Week 1-2)

**Goal**: Establish feature directories and move critical features

**Tasks**:

1. Create missing feature directories with proper structure
2. Move auth routes and services
3. Move collaborative-streaming routes and services
4. Update all imports
5. Test thoroughly

**Success Criteria**:

- All feature directories exist
- Auth feature is complete
- Collaborative streaming feature is complete
- All tests pass
- No regressions in functionality

### Phase 2: Consolidation (Week 3-4)

**Goal**: Move remaining routes and services to features

**Tasks**:

1. Move analytics, matchmaking, platforms, forum routes
2. Move corresponding services
3. Extract business logic from main routes file
4. Update imports
5. Test each feature

**Success Criteria**:

- `server/routes.ts` reduced by 50%
- All feature-specific routes in features
- Business logic extracted to services
- All tests pass

### Phase 3: Refinement (Week 5-6)

**Goal**: Improve code quality and consistency

**Tasks**:

1. Standardize import ordering across codebase
2. Rename page files to PascalCase
3. Add service suffixes
4. Move user repository
5. Create feature READMEs

**Success Criteria**:

- Import ordering is consistent
- Naming conventions are followed
- Documentation is up to date
- Code quality metrics improve

### Phase 4: Optimization (Ongoing)

**Goal**: Continuous improvement

**Tasks**:

1. Monitor for architectural drift
2. Add new features using proper structure
3. Refactor legacy code opportunistically
4. Update documentation as needed

**Success Criteria**:

- New code follows architecture guidelines
- Technical debt is managed
- Team velocity is maintained or improved

---

## 8. Conclusion

The Shuffle & Sync codebase has a solid foundation with clear feature separation on both client and server. The main areas for improvement are:

1. **Consolidation**: Moving scattered feature logic into dedicated feature directories
2. **Layer Separation**: Extracting business logic from route handlers into services
3. **Consistency**: Standardizing import ordering and naming conventions
4. **Documentation**: Creating feature READMEs and updating architecture docs

Following the recommendations and migration plan outlined in this document will result in a more maintainable, scalable, and developer-friendly codebase that fully adheres to the project's architectural principles.

The estimated effort for complete migration is 4-6 weeks of focused development work, with careful testing at each phase to ensure no regressions are introduced.

---

## Appendix A: Feature Directory Template

```
server/features/{feature-name}/
├── README.md                         # Feature documentation
├── {feature-name}.routes.ts          # Express route handlers
├── {feature-name}.service.ts         # Business logic layer
├── {feature-name}.repository.ts      # Data access layer (optional)
├── {feature-name}.types.ts           # TypeScript interfaces/types
├── {feature-name}.test.ts            # Unit tests
└── routes/                           # Sub-routes (optional)
    ├── {sub-route}.ts
    └── index.ts

client/src/features/{feature-name}/
├── index.ts                          # Public API exports
├── components/                       # React components
│   ├── {ComponentName}.tsx
│   └── {ComponentName}.test.tsx
├── hooks/                            # Custom hooks
│   ├── use{FeatureName}.ts
│   └── use{FeatureName}.test.tsx
├── types/                            # TypeScript types
│   └── index.ts
└── utils/                            # Utility functions (optional)
    └── {utility-name}.ts
```

## Appendix B: Import Order ESLint Configuration

```javascript
// Add to eslint.config.js
{
  "plugins": ["import"],
  "rules": {
    "import/order": [
      "error",
      {
        "groups": [
          "builtin",        // Node.js built-in modules
          "external",       // External packages
          "internal",       // Internal aliases (@/, @shared, etc.)
          "parent",         // Parent relative imports
          "sibling",        // Sibling relative imports
          "index"           // Index imports
        ],
        "pathGroups": [
          {
            "pattern": "@shared/**",
            "group": "internal",
            "position": "before"
          },
          {
            "pattern": "@/**",
            "group": "internal",
            "position": "after"
          }
        ],
        "pathGroupsExcludedImportTypes": ["builtin"],
        "newlines-between": "always",
        "alphabetize": {
          "order": "asc",
          "caseInsensitive": true
        }
      }
    ]
  }
}
```

## Appendix C: Quick Reference Checklist

Use this checklist when creating or refactoring features:

- [ ] Feature directory exists in both `server/features/` and `client/src/features/`
- [ ] Route handlers are in `{feature}.routes.ts`
- [ ] Business logic is in `{feature}.service.ts`
- [ ] Data access is in `{feature}.repository.ts` or uses shared storage
- [ ] Types are in `{feature}.types.ts`
- [ ] Tests exist for all layers
- [ ] Imports follow correct ordering (external, internal, relative)
- [ ] React components use PascalCase
- [ ] Non-component files use kebab-case
- [ ] Feature has README documentation
- [ ] No business logic in route handlers
- [ ] No direct storage access in routes (use services)
- [ ] Feature is registered in `server/index.ts`
- [ ] All tests pass
- [ ] Documentation is updated
