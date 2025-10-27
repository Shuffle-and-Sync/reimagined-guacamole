# Authorization Middleware System

A robust, role-based authorization system for controlling game actions in the Shuffle & Sync platform. This system provides flexible, state-dependent authorization with comprehensive audit logging.

## Features

- **Role-Based Access Control (RBAC)** - Support for players, spectators, moderators, and admins
- **Action-Level Permissions** - Fine-grained control over game actions
- **State-Based Authorization** - Rules that depend on game state (turn, phase, etc.)
- **Audit Logging** - Complete tracking of all authorization decisions
- **Game-Specific Rules** - Extensible system with MTG and Pokemon TCG rules included
- **Permission System** - Flexible condition-based permission evaluation

## Installation

The authorization system is located in `src/auth/` and can be imported:

```typescript
import {
  AuthorizationManager,
  AuthorizationMiddleware,
  AuditLogger,
  PermissionEvaluator,
  baseRules,
  mtgRules,
  pokemonRules,
} from "@/auth";
```

## Quick Start

### Basic Setup

```typescript
import { AuthorizationManager, baseRules } from "@/auth";

// Create authorization manager
const auditLogger = new AuditLogger();
const authManager = new AuthorizationManager(auditLogger);

// Add base rules
baseRules.forEach((rule) => authManager.addRule(rule));

// Authorize an action
const context = {
  userId: "player-1",
  sessionId: "session-1",
  gameId: "game-1",
  role: "player",
  permissions: [],
};

const state = {
  activePlayer: "player-1",
  status: "active",
};

const result = await authManager.authorize("game.action.move", context, state);

if (result.authorized) {
  // Allow action
} else {
  // Deny with result.reason
}
```

### Express Middleware

```typescript
import { AuthorizationMiddleware } from "@/auth";

const authMiddleware = new AuthorizationMiddleware(authManager);

// Use in Express routes
app.post(
  "/api/game/:gameId/action",
  authMiddleware.expressMiddleware(),
  handleGameAction,
);
```

## Core Components

### AuthorizationManager

Central component that manages authorization rules and evaluates authorization requests.

```typescript
class AuthorizationManager {
  addRule(rule: AuthorizationRule): void;
  removeRule(name: string): boolean;
  async authorize(
    action: string,
    context: AuthContext,
    state: any,
  ): Promise<AuthResult>;
  checkAuthorization(
    action: string,
    context: AuthContext,
    state: any,
  ): AuthResult;
  getAuditLogger(): AuditLogger;
}
```

### AuditLogger

Logs all authorization decisions for security and debugging.

```typescript
class AuditLogger {
  async log(entry: AuditLogEntry): Promise<void>;
  getLogs(): AuditLogEntry[];
  getLogsByUser(userId: string): AuditLogEntry[];
  getLogsByGame(gameId: string): AuditLogEntry[];
  getFailedAttempts(): AuditLogEntry[];
  getStats(): { total; authorized; denied; denialRate };
}
```

### PermissionEvaluator

Evaluates fine-grained permissions with conditions.

```typescript
class PermissionEvaluator {
  evaluate(
    permission: Permission,
    context: AuthContext,
    resource: any,
  ): boolean;
  evaluateAll(
    permissions: Permission[],
    context: AuthContext,
    resource: any,
  ): boolean;
  hasPermission(
    context: AuthContext,
    resource: string,
    action: string,
  ): boolean;
}
```

## Authorization Rules

### Base Rules

Common rules that apply across all games:

1. **turnBasedRule** - Players can only act during their turn
2. **handVisibilityRule** - Players can only see their own hand
3. **gamePhaseRule** - Certain actions only allowed in certain phases
4. **playerCountRule** - Enforce min/max player requirements
5. **gameStateRule** - Game must be active for actions
6. **resourceOwnershipRule** - Players can only modify their own resources

### MTG Rules

Magic: The Gathering specific rules:

1. **priorityRule** - Players need priority to cast spells
2. **manaRule** - Check mana availability for spells
3. **landLimitRule** - One land per turn limit
4. **mainPhaseRule** - Sorcery-speed actions in main phase
5. **stackRule** - Respond only when stack is active
6. **commanderRule** - Commander must be cast from command zone

### Pokemon Rules

Pokemon TCG specific rules:

1. **activePokemonRule** - Must have active Pokemon to attack
2. **energyAttachmentRule** - One energy per turn
3. **attackEnergyRule** - Sufficient energy for attacks
4. **evolutionRule** - Evolution timing restrictions
5. **retreatRule** - Retreat cost requirements
6. **prizeCardRule** - Prize cards after knockouts

## Creating Custom Rules

```typescript
import { AuthorizationRule } from "@/auth/types";

const customRule: AuthorizationRule = {
  name: "my-custom-rule",
  priority: 100, // Higher = applied first
  match: (action, context) => {
    // Return true if rule should apply
    return action.startsWith("game.custom.") && context.role === "player";
  },
  authorize: (action, context, state) => {
    // Evaluate authorization
    if (state.customCondition) {
      return { authorized: true };
    }
    return {
      authorized: false,
      reason: "Custom condition not met",
    };
  },
};

authManager.addRule(customRule);
```

## Roles

The system supports four roles with different permissions:

### Admin (Priority: 1000)

- Bypass all authorization checks
- Full access to all actions

### Moderator (Priority: 500)

- Can view all game state
- Can perform moderation actions
- Cannot perform player actions

### Player (Default)

- Can perform game actions on their turn
- Can view their own resources
- Subject to all game rules

### Spectator (Priority: 200)

- Read-only access
- Can view public game state
- Cannot modify anything

## Action Naming Convention

Actions follow a hierarchical naming pattern:

```
game.{category}.{action}

Examples:
- game.view.board      (viewing)
- game.action.move     (player actions)
- game.update.state    (state modifications)
- game.moderate.reset  (moderator actions)
- game.admin.override  (admin actions)
```

## Permissions

Permissions support conditions for fine-grained control:

```typescript
const permission: Permission = {
  resource: "player.hand",
  action: "read",
  conditions: [
    {
      field: "ownerId",
      operator: "eq",
      value: userId,
    },
  ],
};

// Custom condition function
const advancedPermission: Permission = {
  resource: "game.state",
  action: "write",
  conditions: [
    {
      field: "custom",
      operator: "custom",
      value: null,
      customCheck: (context, state) => {
        return state.allowedPlayers.includes(context.userId);
      },
    },
  ],
};
```

## Audit Logging

Access audit logs for security monitoring:

```typescript
// Get all logs
const logs = auditLogger.getLogs();

// Get failed attempts for security monitoring
const failed = auditLogger.getFailedAttempts();

// Get stats
const stats = auditLogger.getStats();
console.log(`Denial rate: ${stats.denialRate * 100}%`);

// Persist logs to database
const logger = new AuditLogger(10000, async (entry) => {
  await database.auditLogs.insert(entry);
});
```

## Testing

The authorization system includes comprehensive tests:

```bash
# Run all auth tests
npm test -- src/auth/__tests__/

# Run specific test suites
npm test -- src/auth/__tests__/AuditLogger.test.ts
npm test -- src/auth/__tests__/AuthorizationManager.test.ts
npm test -- src/auth/__tests__/PermissionEvaluator.test.ts
npm test -- src/auth/__tests__/BaseRules.test.ts
npm test -- src/auth/__tests__/integration.test.ts
```

## Performance

- Rules are sorted by priority once when added
- Authorization checks use O(n) where n = number of matching rules
- Most games will have 10-20 rules total
- Typical authorization check: < 1ms
- Audit logging is async and non-blocking

## Security Considerations

1. **Audit all decisions** - Every authorization decision is logged
2. **Fail secure** - Default deny when no rule matches
3. **Priority system** - Higher priority rules override lower ones
4. **State validation** - Always validate game state before authorization
5. **Rate limiting** - Consider rate limiting failed authorization attempts

## Examples

### Game Turn System

```typescript
const result = await authManager.authorize("game.action.move", context, {
  activePlayer: context.userId,
  status: "active",
  currentPhase: {
    name: "main",
    allowedActions: ["move", "attack"],
  },
});
```

### Hand Visibility

```typescript
const result = await authManager.authorize("game.view.hand", context, {
  requestedPlayerId: targetPlayerId,
});
```

### Resource Management

```typescript
const result = await authManager.authorize("game.action.use", context, {
  targetPlayerId: context.userId, // Must own the resource
});
```

## Architecture

```
src/auth/
├── types.ts                    # Type definitions
├── AuditLogger.ts              # Audit logging
├── PermissionEvaluator.ts      # Permission evaluation
├── AuthorizationManager.ts     # Rule management
├── AuthorizationMiddleware.ts  # Express integration
├── rules/
│   ├── BaseRules.ts           # Common rules
│   ├── MTGRules.ts            # Magic rules
│   └── PokemonRules.ts        # Pokemon rules
├── __tests__/                  # Test suite
└── index.ts                    # Module exports
```

## Contributing

When adding new rules:

1. Define rule in appropriate file (BaseRules, MTGRules, etc.)
2. Set appropriate priority (0-1000, higher = applied first)
3. Implement match and authorize functions
4. Add comprehensive tests
5. Update this README with examples

## License

MIT
