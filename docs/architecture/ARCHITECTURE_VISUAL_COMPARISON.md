# Architecture Visual Comparison

This document provides visual representations of the current and proposed architecture using Mermaid diagrams.

## Current Architecture (Scattered Organization)

```mermaid
graph TB
    subgraph "Current Server Structure"
        Features[server/features/]
        Services[server/services/]
        Routes[server/routes/]
        Repos[server/repositories/]

        Features --> |"✅ auth"| AuthFeature[auth/]
        Features --> |"✅ users"| UsersFeature[users/]
        Features --> |"✅ events"| EventsFeature[events/]
        Features --> |"✅ communities"| CommFeature[communities/]

        Services --> |"❌ Should be in features"| ScatteredServices["
            - collaborative-streaming.ts
            - streaming-coordinator.ts
            - ai-streaming-matcher.ts
            - card-recognition.ts
            - waitlist.ts
            - user.service.ts
            - notification services (3)
            - platform APIs (4)
            - analytics-service.ts
            - real-time-matching-api.ts
        "]

        Routes --> |"❌ Should be in features"| ScatteredRoutes["
            - auth/ (6 files)
            - streaming/ (5 files)
            - analytics.ts
            - forum.routes.ts
            - game-sessions.routes.ts
            - matching.ts
            - platforms.routes.ts
            - user-profile.routes.ts
            - notification-preferences.ts
        "]

        Repos --> |"❌ Should be in features"| ScatteredRepos["
            - user.repository.ts
        "]

        Routes --> |"✅ Infrastructure (OK here)"| InfraRoutes["
            - backup.ts
            - cache-health.ts
            - database-health.ts
            - monitoring.ts
            - webhooks.ts
        "]

        Services --> |"✅ Infrastructure (OK here)"| InfraServices["
            - cache-service.ts
            - backup-service.ts
            - monitoring-service.ts
            - error-tracking.ts
            - redis-client.ts
        "]
    end

    style ScatteredServices fill:#ffcccc
    style ScatteredRoutes fill:#ffcccc
    style ScatteredRepos fill:#ffcccc
    style AuthFeature fill:#ccffcc
    style UsersFeature fill:#ccffcc
    style EventsFeature fill:#ccffcc
    style CommFeature fill:#ccffcc
    style InfraRoutes fill:#ccffcc
    style InfraServices fill:#ccffcc
```

## Proposed Architecture (Feature-Based Organization)

```mermaid
graph TB
    subgraph "Proposed Server Structure"
        Features2[server/features/]
        Services2[server/services/]
        Routes2[server/routes/]
        Repos2[server/repositories/]

        Features2 --> Auth2[auth/]
        Features2 --> Users2[users/]
        Features2 --> Events2[events/]
        Features2 --> Comm2[communities/]
        Features2 --> Stream2[collaborative-streaming/]
        Features2 --> Analytics2[analytics/]
        Features2 --> Match2[matchmaking/]
        Features2 --> Platform2[platforms/]
        Features2 --> Forum2[forum/]
        Features2 --> GameSess2[game-sessions/]

        Auth2 --> |"All auth-related files"| AuthFiles["
            ✅ auth.routes.ts
            ✅ auth.service.ts
            ✅ auth.types.ts
            ✅ routes/
                - mfa.routes.ts
                - password.routes.ts
                - register.routes.ts
                - tokens.routes.ts
        "]

        Users2 --> |"All user-related files"| UserFiles["
            ✅ users.routes.ts
            ✅ users.service.ts
            ✅ users.repository.ts
            ✅ users.types.ts
            ✅ routes/
                - profile.routes.ts
        "]

        Stream2 --> |"All streaming files"| StreamFiles["
            ✅ collaborative-streaming.service.ts
            ✅ streaming-coordinator.service.ts
            ✅ ai-streaming-matcher.service.ts
            ✅ routes/
                - events.routes.ts
                - collaborators.routes.ts
                - coordination.routes.ts
                - suggestions.routes.ts
        "]

        Events2 --> |"All event-related files"| EventFiles["
            ✅ events.routes.ts
            ✅ events.service.ts
            ✅ events.types.ts
            ✅ waitlist.service.ts
        "]

        Services2 --> |"✅ Infrastructure only"| InfraServices2["
            - cache-service.ts
            - backup-service.ts
            - monitoring-service.ts
            - error-tracking.ts
            - redis-client.ts
        "]

        Routes2 --> |"✅ Infrastructure only"| InfraRoutes2["
            - backup.ts
            - cache-health.ts
            - database-health.ts
            - monitoring.ts
            - webhooks.ts
        "]

        Repos2 --> |"✅ Shared only"| BaseRepo["
            - base.repository.ts
        "]
    end

    style AuthFiles fill:#ccffcc
    style UserFiles fill:#ccffcc
    style StreamFiles fill:#ccffcc
    style EventFiles fill:#ccffcc
    style InfraServices2 fill:#ccffcc
    style InfraRoutes2 fill:#ccffcc
    style BaseRepo fill:#ccffcc
```

## Feature Structure Template

```mermaid
graph LR
    subgraph "Feature Directory Structure"
        Feature[feature-name/]

        Feature --> Routes[routes.ts]
        Feature --> Service[service.ts]
        Feature --> Repo[repository.ts]
        Feature --> Types[types.ts]
        Feature --> Tests[tests/]
        Feature --> SubRoutes[routes/]

        Routes --> |"Thin handlers"| RouteDesc["
            • Request validation
            • Call services
            • Return responses
            • Error handling
        "]

        Service --> |"Business logic"| ServiceDesc["
            • Validation rules
            • Business processes
            • Call repositories
            • External services
        "]

        Repo --> |"Data access"| RepoDesc["
            • Database queries
            • Data mapping
            • Cache access
        "]

        Types --> |"Type definitions"| TypesDesc["
            • Interfaces
            • Type aliases
            • DTOs
            • Request/Response types
        "]
    end

    style Routes fill:#e1f5ff
    style Service fill:#fff4e1
    style Repo fill:#ffe1f5
    style Types fill:#e1ffe1
```

## Layer Separation Flow

```mermaid
sequenceDiagram
    participant Client
    participant Route as Route Handler
    participant Service as Service Layer
    participant Repo as Repository
    participant DB as Database

    Note over Client,DB: ❌ Current: Business Logic in Route

    Client->>Route: POST /api/friend-requests
    Route->>Route: Validate (business logic)
    Route->>Route: Check existing (business logic)
    Route->>DB: Create friendship (direct access)
    Route->>DB: Create notification (direct access)
    Route->>Client: Response

    Note over Client,DB: ✅ Proposed: Service Layer

    Client->>Route: POST /api/friend-requests
    Route->>Route: Parse request
    Route->>Service: sendFriendRequest(userId, friendId)
    Service->>Service: Validate business rules
    Service->>Repo: checkExistingFriendship()
    Repo->>DB: Query
    DB->>Repo: Result
    Repo->>Service: No existing
    Service->>Repo: createFriendship()
    Repo->>DB: Insert
    DB->>Repo: Created
    Repo->>Service: Friendship
    Service->>Repo: createNotification()
    Repo->>DB: Insert
    Service->>Route: Friendship
    Route->>Client: 201 Created
```

## Import Organization Flow

```mermaid
graph TD
    subgraph "File Imports (Top to Bottom)"
        External["1. External Libraries
        ━━━━━━━━━━━━━━━━━━━
        import { Router } from 'express'
        import { z } from 'zod'
        import React from 'react'
        "]

        Internal["2. Internal Absolute (@aliases)
        ━━━━━━━━━━━━━━━━━━━
        import { User } from '@shared/schema'
        import { Button } from '@/components/ui/button'
        import { useAuth } from '@/features/auth'
        "]

        Relative["3. Relative Imports
        ━━━━━━━━━━━━━━━━━━━
        import { service } from './auth.service'
        import { types } from '../types'
        import { helper } from '../../utils/helper'
        "]

        Styles["4. Styles (if any)
        ━━━━━━━━━━━━━━━━━━━
        import './styles.css'
        import styles from './component.module.css'
        "]

        External --> Internal
        Internal --> Relative
        Relative --> Styles
    end

    style External fill:#e1f5ff
    style Internal fill:#fff4e1
    style Relative fill:#ffe1f5
    style Styles fill:#e1ffe1
```

## Migration Impact Map

```mermaid
graph TB
    subgraph "Files to Move"
        Services[20 Service Files]
        Routes[13 Route Files]
        Repos[1 Repository]
        Pages[19 Page Files]
    end

    subgraph "Affected Areas"
        Imports[100+ Import Statements]
        Tests[Test Files]
        Docs[Documentation]
        Index[server/index.ts]
        RouteFile[server/routes.ts]
    end

    Services --> |"Update paths"| Imports
    Routes --> |"Update paths"| Imports
    Repos --> |"Update paths"| Imports
    Pages --> |"Rename files"| Imports

    Imports --> Tests
    Imports --> Index
    Imports --> RouteFile

    Services --> |"Update references"| Docs
    Routes --> |"Update references"| Docs

    style Services fill:#ffcccc
    style Routes fill:#ffcccc
    style Repos fill:#ffcccc
    style Pages fill:#ffffcc
    style Imports fill:#ccccff
    style Tests fill:#ffccff
```

## Priority Roadmap

```mermaid
gantt
    title Architecture Refactoring Timeline
    dateFormat  YYYY-MM-DD
    section High Priority
    Move Auth Routes           :done, auth, 2025-10-23, 2d
    Create Streaming Feature   :done, stream, 2025-10-25, 4d
    Extract Friend Logic       :active, friend, 2025-10-29, 2d

    section Medium Priority
    Standardize Imports        :import, 2025-10-31, 4d
    Move Remaining Routes      :routes, 2025-11-04, 8d

    section Low Priority
    Rename Page Files          :pages, 2025-11-12, 2d
    Add Service Suffixes       :suffix, 2025-11-14, 1d
    Move User Repository       :repo, 2025-11-15, 1d

    section Documentation
    Update Docs                :docs, 2025-11-16, 2d
```

## Risk Impact Matrix

```mermaid
quadrantChart
    title Architecture Risk Assessment
    x-axis Low Impact --> High Impact
    y-axis Low Severity --> High Severity
    quadrant-1 High Priority
    quadrant-2 Monitor
    quadrant-3 Low Priority
    quadrant-4 Medium Priority

    Scattered Features: [0.9, 0.9]
    Business Logic in Routes: [0.7, 0.6]
    Large routes.ts: [0.6, 0.5]
    Duplicate Services: [0.3, 0.2]
    Import Ordering: [0.4, 0.4]
    Naming Issues: [0.3, 0.3]
```

## Success Metrics Tracking

```mermaid
graph LR
    subgraph "Before Refactoring"
        B1[Files in features: 30%]
        B2[Files properly named: 90%]
        B3[Import violations: 45]
        B4[Routes.ts lines: 1398]
    end

    subgraph "After Refactoring (Target)"
        A1[Files in features: 95%]
        A2[Files properly named: 100%]
        A3[Import violations: 0]
        A4[Routes.ts lines: 700]
    end

    B1 -.-> A1
    B2 -.-> A2
    B3 -.-> A3
    B4 -.-> A4

    style B1 fill:#ffcccc
    style B2 fill:#ffffcc
    style B3 fill:#ffcccc
    style B4 fill:#ffcccc

    style A1 fill:#ccffcc
    style A2 fill:#ccffcc
    style A3 fill:#ccffcc
    style A4 fill:#ccffcc
```

## Implementation Strategy

```mermaid
flowchart TD
    Start([Start Refactoring]) --> Review{Review Docs?}
    Review -->|Yes| Plan[Create Sprint Plan]
    Review -->|No| BackToReview[Read Architecture Review]
    BackToReview --> Review

    Plan --> Action1[Action 1: Auth Routes]
    Action1 --> Test1{Tests Pass?}
    Test1 -->|No| Fix1[Fix Issues]
    Fix1 --> Test1
    Test1 -->|Yes| PR1[Create PR]
    PR1 --> Merge1{Approved?}
    Merge1 -->|No| Fix1
    Merge1 -->|Yes| Action2[Action 2: Streaming Feature]

    Action2 --> Test2{Tests Pass?}
    Test2 -->|No| Fix2[Fix Issues]
    Fix2 --> Test2
    Test2 -->|Yes| PR2[Create PR]
    PR2 --> Merge2{Approved?}
    Merge2 -->|No| Fix2
    Merge2 -->|Yes| Continue[Continue with remaining actions...]

    Continue --> Done([Refactoring Complete])

    style Start fill:#e1f5ff
    style Done fill:#ccffcc
    style Test1 fill:#fff4e1
    style Test2 fill:#fff4e1
    style Merge1 fill:#ffe1f5
    style Merge2 fill:#ffe1f5
```

## Feature Dependencies

```mermaid
graph TD
    subgraph "Feature Dependencies"
        Auth[Auth Feature]
        Users[Users Feature]
        Events[Events Feature]
        Stream[Streaming Feature]
        Platforms[Platforms Feature]

        Auth --> Users
        Auth --> Events
        Auth --> Stream

        Users --> Events
        Users --> Stream

        Platforms --> Stream

        Events -.->|Uses services| Stream
    end

    subgraph "Infrastructure (Shared)"
        Storage[(Storage/DB)]
        Logger[Logger]
        Cache[Cache]
        Email[Email Service]

        Auth --> Storage
        Users --> Storage
        Events --> Storage
        Stream --> Storage

        Auth --> Logger
        Users --> Logger
        Events --> Logger
        Stream --> Logger
    end

    style Auth fill:#e1f5ff
    style Users fill:#fff4e1
    style Events fill:#ffe1f5
    style Stream fill:#e1ffe1
    style Platforms fill:#ffe1e1
```

---

## Key Takeaways

### 🔴 Current Problems Visualized

- Features scattered across 3+ directories
- Business logic mixed with routing layer
- Inconsistent organization patterns

### ✅ Proposed Solution Visualized

- All feature code in feature directories
- Clear layer separation
- Consistent organization patterns

### 📊 Expected Improvements

- **Maintainability**: ⬆️ 40% (easier to find and modify code)
- **Testability**: ⬆️ 50% (service layer is easily testable)
- **Onboarding**: ⬆️ 60% (clear structure, better documentation)
- **Code Quality**: ⬆️ 30% (enforced patterns, better organization)

### ⏱️ Implementation Timeline

- **Phase 1 (High Priority)**: 10-12 hours
- **Phase 2 (Medium Priority)**: 14-18 hours
- **Phase 3 (Low Priority)**: 8-10 hours
- **Total**: 32-40 hours over 4-6 weeks

---

**Note**: These diagrams are generated with Mermaid and will render properly in GitHub, VS Code, and most modern markdown viewers.
