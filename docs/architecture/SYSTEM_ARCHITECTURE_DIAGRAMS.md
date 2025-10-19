# System Architecture Diagrams

This document contains visual representations of the Shuffle & Sync system architecture.

---

## Table of Contents

- [High-Level System Architecture](#high-level-system-architecture)
- [Database Schema Overview](#database-schema-overview)
- [Authentication Flow](#authentication-flow)
- [Deployment Architecture](#deployment-architecture)
- [Real-Time Communication Flow](#real-time-communication-flow)
- [Platform OAuth Flow](#platform-oauth-flow)

---

## High-Level System Architecture

This diagram shows the overall system architecture and how components interact.

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser]
        Mobile[Mobile Browser]
    end

    subgraph "CDN & Load Balancing"
        CloudRun[Google Cloud Run]
        LB[Load Balancer]
    end

    subgraph "Application Layer"
        Frontend[React Frontend<br/>Vite + TypeScript]
        Backend[Express Backend<br/>Node.js + TypeScript]
    end

    subgraph "Authentication"
        AuthJS[Auth.js v5<br/>Google OAuth 2.0]
    end

    subgraph "Data Layer"
        DrizzleORM[Drizzle ORM]
        SQLiteCloud[(SQLite Cloud<br/>Database)]
    end

    subgraph "External Services"
        Google[Google OAuth]
        Twitch[Twitch API]
        YouTube[YouTube API]
        Facebook[Facebook Gaming API]
        SendGrid[SendGrid Email]
    end

    subgraph "Monitoring & Logging"
        CloudMonitoring[Cloud Monitoring]
        CloudLogging[Cloud Logging]
    end

    Browser --> LB
    Mobile --> LB
    LB --> CloudRun
    CloudRun --> Frontend
    CloudRun --> Backend

    Frontend --> Backend
    Backend --> AuthJS
    Backend --> DrizzleORM
    DrizzleORM --> SQLiteCloud

    AuthJS --> Google
    Backend --> Twitch
    Backend --> YouTube
    Backend --> Facebook
    Backend --> SendGrid

    Backend --> CloudMonitoring
    Backend --> CloudLogging
    Frontend --> CloudMonitoring

    style SQLiteCloud fill:#e1f5ff
    style AuthJS fill:#ffe1e1
    style CloudRun fill:#e8f5e9
```

---

## Database Schema Overview

Core database tables and their relationships.

```mermaid
erDiagram
    USERS ||--o{ USER_COMMUNITIES : "joins"
    USERS ||--o{ EVENTS : "creates"
    USERS ||--o{ TOURNAMENTS : "participates"
    USERS ||--o{ MESSAGES : "sends"
    USERS ||--o{ PLATFORM_ACCOUNTS : "connects"
    USERS ||--|| SESSIONS : "has"

    COMMUNITIES ||--o{ USER_COMMUNITIES : "has"
    COMMUNITIES ||--o{ EVENTS : "hosts"
    COMMUNITIES ||--o{ TOURNAMENTS : "organizes"

    TOURNAMENTS ||--o{ MATCHES : "contains"
    MATCHES ||--o{ MATCH_RESULTS : "has"

    GAMES ||--o{ CARDS : "contains"
    USERS ||--o{ DECKS : "owns"
    DECKS ||--o{ DECK_CARDS : "includes"
    CARDS ||--o{ DECK_CARDS : "in"

    USERS {
        uuid id PK
        string email
        string username
        string passwordHash
        uuid primaryCommunityId FK
        string profileImage
        datetime createdAt
    }

    COMMUNITIES {
        uuid id PK
        string name
        string description
        string game
        int memberCount
        datetime createdAt
    }

    USER_COMMUNITIES {
        uuid userId FK
        uuid communityId FK
        datetime joinedAt
    }

    EVENTS {
        uuid id PK
        uuid organizerId FK
        uuid communityId FK
        string title
        string description
        datetime startTime
        datetime endTime
        string type
    }

    TOURNAMENTS {
        uuid id PK
        uuid eventId FK
        string name
        string format
        int maxParticipants
        decimal entryFee
        decimal prizePool
        string status
    }

    PLATFORM_ACCOUNTS {
        uuid id PK
        uuid userId FK
        string platform
        string platformUserId
        string handle
        string accessToken
        string refreshToken
        datetime tokenExpiresAt
    }

    SESSIONS {
        string sessionToken PK
        uuid userId FK
        datetime expires
    }
```

---

## Authentication Flow

OAuth 2.0 authentication flow using Google.

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant AuthJS
    participant Google
    participant Database

    User->>Frontend: Click "Sign in with Google"
    Frontend->>Backend: GET /api/auth/signin
    Backend->>AuthJS: Initiate OAuth flow
    AuthJS->>Google: Redirect to Google OAuth
    Google->>User: Show consent screen
    User->>Google: Approve permissions
    Google->>Backend: Redirect with auth code
    Backend->>AuthJS: Handle callback
    AuthJS->>Google: Exchange code for tokens
    Google->>AuthJS: Return access token
    AuthJS->>Google: Get user profile
    Google->>AuthJS: Return user data
    AuthJS->>Database: Create/update user
    Database->>AuthJS: User record
    AuthJS->>Database: Create session
    Database->>AuthJS: Session token
    AuthJS->>Backend: Set session cookie
    Backend->>Frontend: Redirect to dashboard
    Frontend->>User: Logged in successfully
```

---

## Deployment Architecture

Google Cloud Platform deployment architecture.

```mermaid
graph TB
    subgraph "Internet"
        Users[Users]
    end

    subgraph "Google Cloud Platform"
        subgraph "Cloud Run - us-central1"
            Frontend[Frontend Service<br/>React App]
            Backend[Backend Service<br/>Express API]
        end

        subgraph "Cloud Build"
            CI[CI/CD Pipeline]
            Registry[Container Registry]
        end

        subgraph "Data Storage"
            SQLiteCloud[(SQLite Cloud<br/>Database)]
            Secrets[Secret Manager<br/>Environment Variables]
        end

        subgraph "Monitoring"
            Monitoring[Cloud Monitoring<br/>Metrics & Alerts]
            Logging[Cloud Logging<br/>Application Logs]
        end
    end

    subgraph "External"
        GitHub[GitHub Repository]
        SQLiteProvider[SQLite Cloud Provider]
    end

    Users --> Frontend
    Users --> Backend
    Frontend --> Backend

    GitHub --> CI
    CI --> Registry
    Registry --> Frontend
    Registry --> Backend

    Backend --> SQLiteCloud
    Backend --> Secrets
    SQLiteCloud -.-> SQLiteProvider

    Frontend --> Monitoring
    Backend --> Monitoring
    Frontend --> Logging
    Backend --> Logging

    style SQLiteCloud fill:#e1f5ff
    style Secrets fill:#ffe1e1
    style Frontend fill:#e8f5e9
    style Backend fill:#e8f5e9
```

---

## Real-Time Communication Flow

WebSocket-based messaging system.

```mermaid
sequenceDiagram
    participant User1
    participant Frontend1
    participant Backend
    participant WebSocket
    participant Database
    participant Frontend2
    participant User2

    User1->>Frontend1: Type message
    Frontend1->>Backend: POST /api/messages
    Backend->>Database: Store message
    Database->>Backend: Message saved
    Backend->>WebSocket: Emit message event
    WebSocket->>Frontend1: message:new event
    WebSocket->>Frontend2: message:new event
    Frontend1->>User1: Show sent message
    Frontend2->>User2: Show received message

    Note over Frontend1,Frontend2: Real-time bidirectional communication

    User2->>Frontend2: Start typing
    Frontend2->>WebSocket: Send typing event
    WebSocket->>Frontend1: typing event
    Frontend1->>User1: Show "User2 is typing..."
```

---

## Platform OAuth Flow

Streaming platform (Twitch/YouTube/Facebook) OAuth integration.

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Platform as Platform<br/>(Twitch/YouTube/FB)
    participant Database

    User->>Frontend: Click "Connect Twitch"
    Frontend->>Backend: GET /api/platforms/twitch/oauth/initiate

    Note over Backend: Generate PKCE code_verifier<br/>and code_challenge

    Backend->>Database: Store PKCE state
    Backend->>Frontend: Return auth URL
    Frontend->>Platform: Redirect to platform OAuth
    Platform->>User: Show consent screen
    User->>Platform: Approve permissions
    Platform->>Backend: Callback with auth code

    Backend->>Database: Verify PKCE state
    Database->>Backend: State valid

    Backend->>Platform: Exchange code for tokens<br/>(with code_verifier)
    Platform->>Backend: Return access + refresh tokens

    Backend->>Platform: Get user profile
    Platform->>Backend: Return platform user data

    Backend->>Database: Store encrypted tokens<br/>and user info
    Database->>Backend: Account saved

    Backend->>Frontend: Redirect with success
    Frontend->>User: Platform connected!

    Note over Backend,Database: Tokens automatically refreshed<br/>5 minutes before expiry
```

---

## Tournament Bracket System

Tournament management and bracket generation.

```mermaid
graph TB
    Start[Tournament Created] --> Reg[Registration Phase]
    Reg --> Check{Registrations<br/>Closed?}
    Check -->|No| Reg
    Check -->|Yes| CheckIn[Check-In Phase]

    CheckIn --> Seed[Seed Players]
    Seed --> GenBracket{Tournament<br/>Format?}

    GenBracket -->|Single Elim| SE[Generate Single<br/>Elimination Bracket]
    GenBracket -->|Swiss| Swiss[Generate Swiss<br/>Pairings]
    GenBracket -->|Round Robin| RR[Generate Round<br/>Robin Schedule]

    SE --> PlayMatch[Play Matches]
    Swiss --> PlayMatch
    RR --> PlayMatch

    PlayMatch --> Report[Report Results]
    Report --> Update[Update Standings]

    Update --> NextRound{More<br/>Rounds?}
    NextRound -->|Yes - Swiss/RR| Swiss
    NextRound -->|Yes - SE| SE
    NextRound -->|No| Finals[Determine Winner]

    Finals --> Prizes[Distribute Prizes]
    Prizes --> Complete[Tournament Complete]

    style Start fill:#e8f5e9
    style Complete fill:#e1f5ff
    style Prizes fill:#fff9e1
```

---

## Data Flow: Creating a Tournament

Step-by-step data flow when creating a tournament.

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Validation
    participant Database
    participant Email

    User->>Frontend: Fill tournament form
    Frontend->>Frontend: Client-side validation
    Frontend->>Backend: POST /api/tournaments
    Backend->>Validation: Validate request (Zod)

    alt Validation fails
        Validation->>Backend: Validation errors
        Backend->>Frontend: 400 Bad Request
        Frontend->>User: Show errors
    else Validation passes
        Validation->>Backend: Data valid
        Backend->>Database: Create tournament record
        Database->>Backend: Tournament created
        Backend->>Database: Create event record
        Database->>Backend: Event created
        Backend->>Email: Send confirmation email
        Backend->>Frontend: 201 Created
        Frontend->>User: Success message
        Frontend->>Frontend: Redirect to tournament page
    end
```

---

## Monitoring and Alerting Flow

How monitoring and alerting works in production.

```mermaid
graph TB
    subgraph "Application"
        App[Express Backend]
        Frontend[React Frontend]
    end

    subgraph "Instrumentation"
        Logs[Structured Logging]
        Metrics[Custom Metrics]
        Errors[Error Tracking]
    end

    subgraph "Google Cloud"
        CloudLogging[Cloud Logging]
        CloudMonitoring[Cloud Monitoring]
        Alerts[Alert Policies]
    end

    subgraph "Notifications"
        Email[Email]
        Slack[Slack]
        PagerDuty[PagerDuty]
    end

    subgraph "Response"
        OnCall[On-Call Engineer]
        Runbooks[Runbooks]
    end

    App --> Logs
    App --> Metrics
    App --> Errors
    Frontend --> Errors

    Logs --> CloudLogging
    Metrics --> CloudMonitoring
    Errors --> CloudMonitoring

    CloudMonitoring --> Alerts
    CloudLogging --> Alerts

    Alerts -->|SEV-1| PagerDuty
    Alerts -->|SEV-2| Slack
    Alerts -->|SEV-3| Email

    PagerDuty --> OnCall
    Slack --> OnCall
    Email --> OnCall

    OnCall --> Runbooks

    style Alerts fill:#ffe1e1
    style OnCall fill:#fff9e1
```

---

## Security Architecture

Security layers and controls.

```mermaid
graph TB
    subgraph "External Layer"
        Internet[Internet]
        Attackers[Potential Threats]
    end

    subgraph "Perimeter Security"
        CloudArmor[Cloud Armor<br/>DDoS Protection]
        LB[Load Balancer<br/>SSL/TLS Termination]
    end

    subgraph "Application Security"
        CORS[CORS Protection]
        CSRF[CSRF Tokens]
        RateLimit[Rate Limiting]
        InputVal[Input Validation]
    end

    subgraph "Authentication & Authorization"
        OAuth[OAuth 2.0 + PKCE]
        Sessions[Encrypted Sessions]
        RBAC[Role-Based Access Control]
    end

    subgraph "Data Security"
        DrizzleORM[Drizzle ORM<br/>SQL Injection Prevention]
        Encryption[Data Encryption<br/>at Rest & Transit]
        Secrets[Secret Manager<br/>Credential Management]
    end

    subgraph "Monitoring & Response"
        Logging[Security Logging]
        Alerts[Security Alerts]
        Audit[Audit Trail]
    end

    Internet --> CloudArmor
    Attackers -.-> CloudArmor
    CloudArmor --> LB

    LB --> CORS
    CORS --> CSRF
    CSRF --> RateLimit
    RateLimit --> InputVal

    InputVal --> OAuth
    OAuth --> Sessions
    Sessions --> RBAC

    RBAC --> DrizzleORM
    DrizzleORM --> Encryption
    Encryption --> Secrets

    Sessions --> Logging
    RBAC --> Logging
    DrizzleORM --> Logging

    Logging --> Alerts
    Logging --> Audit

    style CloudArmor fill:#ffe1e1
    style Encryption fill:#e1f5ff
    style Secrets fill:#fff9e1
```

---

## Notes

- **Mermaid Diagrams:** These diagrams are rendered automatically in GitHub and many markdown viewers
- **Updates:** Keep these diagrams updated when architecture changes
- **Detailed Docs:** Refer to specific documentation for implementation details
- **Tools:** Use Mermaid Live Editor for editing: https://mermaid.live

---

**Last Updated:** 2025-10-18

**Related Documentation:**

- [Project Architecture](PROJECT_ARCHITECTURE.md)
- [Technology Stack](TECHNOLOGY_STACK.md)
- [Database Architecture](DATABASE_ARCHITECTURE.md)
- [Authentication](AUTHENTICATION.md)
