# TableSync Feature: Deep Dive Analysis & Optimization Recommendations

**Date:** October 27, 2025  
**Scope:** Comprehensive review of TableSync architecture, scalability, and optimization opportunities  
**Status:** Analysis Complete

---

## Executive Summary

TableSync is a real-time trading card game (TCG) coordination platform that enables remote gameplay through WebSocket-based synchronization, WebRTC video/audio streaming, and collaborative game state management. This analysis examines the current implementation across three key areas: WebSocket Architecture, Game State Sync, and Multi-game Support.

**Key Strengths:**

- Robust WebSocket infrastructure with connection management
- Comprehensive authentication and rate limiting
- WebRTC integration for video chat
- Clean separation of concerns (client/server)
- Efficient compression for large payloads

**Critical Areas for Improvement:**

- Game state representation lacks structure and versioning
- No conflict resolution mechanisms for concurrent actions
- Missing undo/redo functionality
- Limited adapter pattern implementation for multi-game support
- Potential race conditions in connection management

---

## 1. WebSocket Architecture Analysis

### Current Implementation

#### 1.1 Connection Management (`websocket-connection-manager.ts`)

**Strengths:**

- ✅ Singleton pattern with centralized connection tracking
- ✅ Separate room management (game rooms vs collaborative streaming)
- ✅ Automatic stale connection cleanup (5-minute interval)
- ✅ Heartbeat mechanism (30-second ping/pong)
- ✅ Authentication token expiry tracking (1-hour default)
- ✅ Activity-based connection health monitoring

**Issues Identified:**

1. **Race Condition Risk - Connection Registration**

   ```typescript
   // In registerConnection():
   ws.connectionId = connectionId;
   ws.userId = userId;
   ws.lastActivity = Date.now();
   this.connections.set(connectionId, ws);
   ```

   - ⚠️ Multiple rapid connections from same user could create conflicts
   - No atomic operation guarantee
   - Missing connection limit per user

2. **Room Join Race Condition**

   ```typescript
   // In joinGameRoom():
   if (!this.gameRooms.has(sessionId)) {
     this.gameRooms.set(sessionId, new Set());
   }
   ws.sessionId = sessionId;
   const room = this.gameRooms.get(sessionId);
   ```

   - ⚠️ Multiple simultaneous joins could hit the same check
   - No mutex/lock mechanism for room creation
   - Potential for duplicate room creation

3. **Memory Leak Risk**
   - Stale connections accumulate in memory between cleanup cycles
   - No maximum connection limit enforcement
   - Missing circuit breaker for connection floods

**Recommendations:**

**CRITICAL - Add Connection Limits and Locks**

```typescript
// Add to WebSocketConnectionManager class
private readonly MAX_CONNECTIONS_PER_USER = 3;
private readonly MAX_TOTAL_CONNECTIONS = 10000;
private userConnections = new Map<string, Set<string>>(); // userId -> connectionIds
private roomLocks = new Map<string, Promise<void>>();

async registerConnection(
  ws: ExtendedWebSocket,
  userId: string,
  authToken?: string,
): Promise<string> {
  // Check global limit
  if (this.connections.size >= this.MAX_TOTAL_CONNECTIONS) {
    throw new Error('Server at maximum capacity');
  }

  // Check per-user limit
  const userConns = this.userConnections.get(userId) || new Set();
  if (userConns.size >= this.MAX_CONNECTIONS_PER_USER) {
    // Close oldest connection
    const oldestId = Array.from(userConns)[0];
    if (oldestId) {
      this.removeConnection(oldestId);
    }
  }

  const connectionId = this.generateConnectionId();
  ws.connectionId = connectionId;
  ws.userId = userId;
  ws.lastActivity = Date.now();

  if (authToken) {
    ws.authToken = authToken;
    ws.authExpiry = Date.now() + this.authExpiryTimeout;
  }

  this.connections.set(connectionId, ws);
  userConns.add(connectionId);
  this.userConnections.set(userId, userConns);

  this.setupConnectionHandlers(ws);
  logger.info("WebSocket connection registered", {
    connectionId,
    userId,
    totalConnections: this.connections.size,
  });

  return connectionId;
}

async joinGameRoom(connectionId: string, sessionId: string): Promise<boolean> {
  // Use lock to prevent race conditions
  const lockKey = `room:${sessionId}`;

  // Wait for any existing lock
  const existingLock = this.roomLocks.get(lockKey);
  if (existingLock) {
    await existingLock;
  }

  // Create new lock
  let releaseLock: () => void;
  const lock = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });
  this.roomLocks.set(lockKey, lock);

  try {
    const ws = this.connections.get(connectionId);
    if (!ws) {
      return false;
    }

    if (!this.gameRooms.has(sessionId)) {
      this.gameRooms.set(sessionId, new Set());
    }

    ws.sessionId = sessionId;
    const room = this.gameRooms.get(sessionId);
    if (room) {
      room.add(ws);
    }

    logger.debug("Connection joined game room", { connectionId, sessionId });
    return true;
  } finally {
    // Release lock
    releaseLock!();
    this.roomLocks.delete(lockKey);
  }
}
```

#### 1.2 Reconnection Logic (`websocket-client.ts`)

**Strengths:**

- ✅ Exponential backoff for reconnection attempts
- ✅ Multiple fallback URL strategies
- ✅ Proper connection state tracking
- ✅ Maximum retry limit (5 attempts)

**Issues Identified:**

1. **Missing Reconnection State Persistence**
   - No room/session recovery after reconnection
   - Client needs to manually rejoin rooms
   - Lost in-flight messages not retried

2. **Incomplete Connection Recovery**

   ```typescript
   ws.onclose = (event) => {
     logger.info("WebSocket connection closed");
     this.connectionPromise = null;

     if (
       event.code !== 1000 &&
       this.reconnectAttempts < this.maxReconnectAttempts
     ) {
       this.scheduleReconnect();
     }
   };
   ```

   - ⚠️ No state synchronization after reconnect
   - ⚠️ No message queue for offline period
   - ⚠️ No notification to user about connection state

**Recommendations:**

**HIGH PRIORITY - Add Reconnection State Management**

```typescript
// Add to WebSocketClient class
private reconnectionState: {
  gameRoomId?: string;
  collaborativeRoomId?: string;
  pendingMessages: WebSocketMessage[];
  lastMessageId?: string;
} = {
  pendingMessages: [],
};

private connectionStateCallbacks: Array<(state: ConnectionState) => void> = [];

async connect(): Promise<void> {
  if (this.connectionPromise) {
    return this.connectionPromise;
  }

  this.connectionPromise = new Promise((resolve, reject) => {
    try {
      const wsUrl = this.buildWebSocketUrl();
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        logger.info("WebSocket connected successfully");
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;

        // Notify listeners of connection state
        this.notifyConnectionState('connected');

        // Restore previous state if reconnecting
        if (this.reconnectionState.gameRoomId) {
          this.rejoinGameRoom(this.reconnectionState.gameRoomId);
        }
        if (this.reconnectionState.collaborativeRoomId) {
          this.rejoinCollaborativeRoom(this.reconnectionState.collaborativeRoomId);
        }

        // Replay pending messages
        this.replayPendingMessages();

        resolve();
      };

      this.ws.onclose = (event) => {
        logger.info("WebSocket connection closed", {
          code: event.code,
          reason: event.reason,
        });

        this.notifyConnectionState('disconnected');
        this.connectionPromise = null;

        // Attempt to reconnect if not a manual close
        if (event.code !== 1000 &&
            this.reconnectAttempts < this.maxReconnectAttempts) {
          this.notifyConnectionState('reconnecting');
          this.scheduleReconnect();
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          this.notifyConnectionState('failed');
        }
      };

      // ... rest of connection setup
    } catch (error) {
      logger.error("Failed to create WebSocket connection", error);
      reject(error);
    }
  });

  return this.connectionPromise;
}

private rejoinGameRoom(roomId: string): void {
  // Implementation to rejoin after reconnect
  this.send({
    type: "join_room",
    sessionId: roomId,
    user: this.getUserInfo(), // Store user info for reconnection
    isReconnect: true,
  });
}

private replayPendingMessages(): void {
  const pending = this.reconnectionState.pendingMessages;
  this.reconnectionState.pendingMessages = [];

  for (const message of pending) {
    this.send(message);
  }
}

send(message: WebSocketMessage): void {
  if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
    // Queue message for sending after reconnect
    this.reconnectionState.pendingMessages.push(message);
    logger.warn("Queued message for later sending", { type: message.type });
    return;
  }

  // ... existing send logic
}

onConnectionStateChange(callback: (state: ConnectionState) => void): () => void {
  this.connectionStateCallbacks.push(callback);

  return () => {
    const index = this.connectionStateCallbacks.indexOf(callback);
    if (index > -1) {
      this.connectionStateCallbacks.splice(index, 1);
    }
  };
}

private notifyConnectionState(state: ConnectionState): void {
  this.connectionStateCallbacks.forEach(callback => {
    try {
      callback(state);
    } catch (error) {
      logger.error("Error in connection state callback", error);
    }
  });
}
```

#### 1.3 Rate Limiting (`websocket-rate-limiter.ts`)

**Strengths:**

- ✅ Sliding window rate limiting
- ✅ Separate limits for high-frequency operations
- ✅ Per-connection and per-message-type tracking

**Issues Identified:**

1. **No Adaptive Rate Limiting**
   - Fixed rate limits regardless of server load
   - No dynamic adjustment based on connection count
   - Missing priority queue for critical messages

2. **Rate Limit Granularity**
   - Same limits for all users (no premium tiers)
   - No differentiation between host and participants
   - Missing burst allowance for initial connection

**Recommendations:**

**MEDIUM PRIORITY - Implement Adaptive Rate Limiting**

```typescript
export class AdaptiveRateLimiter extends RateLimiter {
  private serverLoadFactor: number = 1.0;
  private connectionCount: number = 0;

  updateServerLoad(load: number): void {
    // load: 0.0 (idle) to 1.0 (maximum capacity)
    this.serverLoadFactor = load;

    // Reduce limits under high load
    if (load > 0.8) {
      this.maxRequests = Math.floor(this.baseMaxRequests * 0.5);
    } else if (load > 0.6) {
      this.maxRequests = Math.floor(this.baseMaxRequests * 0.75);
    } else {
      this.maxRequests = this.baseMaxRequests;
    }
  }

  isAllowed(
    connectionId: string,
    messageType: string,
    priority: "low" | "normal" | "high" = "normal",
  ): boolean {
    // Always allow high-priority messages
    if (priority === "high") {
      return true;
    }

    // Apply stricter limits for low-priority under load
    if (this.serverLoadFactor > 0.7 && priority === "low") {
      return false;
    }

    return super.isAllowed(connectionId, messageType);
  }
}
```

---

## 2. Game State Sync Analysis

### Current Implementation

#### 2.1 Board State Representation

**Current Structure:**

```typescript
interface GameSession {
  boardState: text("board_state"), // JSON string
  gameData: text("game_data"),     // JSON string
  gameType: text("game_type").notNull(),
  // ... other fields
}
```

**Issues Identified:**

1. **Lack of Structure**
   - ❌ No defined schema for boardState
   - ❌ JSON string provides no type safety
   - ❌ No validation of game state
   - ❌ Difficult to query or index specific state elements

2. **No Versioning**
   - ❌ No version tracking for state changes
   - ❌ Cannot track state history
   - ❌ Impossible to implement undo/redo
   - ❌ No conflict detection mechanism

3. **Performance Issues**
   - ❌ Full state sent on every update
   - ❌ No delta/patch mechanism
   - ❌ Large payloads for complex game states
   - ❌ Unnecessary bandwidth usage

**Recommendations:**

**CRITICAL - Implement Structured Game State with Versioning**

```typescript
// shared/game-state-schema.ts
export interface GameStateBase {
  version: number;
  timestamp: number;
  lastModifiedBy: string;
  gameType: string;
}

export interface TCGGameState extends GameStateBase {
  gameType: "tcg";
  players: Array<{
    id: string;
    name: string;
    lifeTotal: number;
    poisonCounters?: number;
    hand: CardReference[];
    battlefield: ZoneState;
    graveyard: ZoneState;
    library: { count: number }; // Private zone
    exile: ZoneState;
  }>;
  turnOrder: string[];
  currentTurn: {
    playerId: string;
    phase: "untap" | "upkeep" | "draw" | "main1" | "combat" | "main2" | "end";
    step: string;
  };
  stack: StackItem[];
  battlefield: {
    permanents: Permanent[];
  };
}

export interface ZoneState {
  cards: CardReference[];
  isPublic: boolean;
}

export interface CardReference {
  id: string;
  name?: string; // For public zones
  isTapped?: boolean;
  counters?: Record<string, number>;
  attachments?: string[];
}

export interface StackItem {
  id: string;
  type: "spell" | "ability";
  source: CardReference;
  controller: string;
  targets?: string[];
}

export interface GameStateAction {
  id: string;
  type: "draw" | "play" | "tap" | "untap" | "counter" | "damage" | "move_zone";
  playerId: string;
  timestamp: number;
  payload: unknown;
  previousStateVersion: number;
  resultingStateVersion: number;
}

// Implement operational transformation for conflict resolution
export class GameStateManager {
  private stateHistory: Map<number, TCGGameState> = new Map();
  private actionLog: GameStateAction[] = [];
  private currentVersion: number = 0;

  applyAction(
    action: GameStateAction,
    currentState: TCGGameState,
  ): TCGGameState {
    // Validate action against current state
    if (action.previousStateVersion !== this.currentVersion) {
      // Handle conflict
      return this.resolveConflict(action, currentState);
    }

    // Apply action to create new state
    const newState = this.executeAction(action, currentState);
    newState.version = ++this.currentVersion;
    newState.timestamp = Date.now();
    newState.lastModifiedBy = action.playerId;

    // Store in history for undo/redo
    this.stateHistory.set(newState.version, newState);
    this.actionLog.push(action);

    // Trim history (keep last 100 versions)
    if (this.stateHistory.size > 100) {
      const oldestVersion = Math.min(...this.stateHistory.keys());
      this.stateHistory.delete(oldestVersion);
    }

    return newState;
  }

  private resolveConflict(
    action: GameStateAction,
    currentState: TCGGameState,
  ): TCGGameState {
    // Operational Transformation: Transform action to apply to current state
    const transformedAction = this.transformAction(
      action,
      this.getActionsSince(action.previousStateVersion),
    );

    return this.executeAction(transformedAction, currentState);
  }

  private transformAction(
    action: GameStateAction,
    concurrentActions: GameStateAction[],
  ): GameStateAction {
    // Implement OT algorithm for different action types
    // Example: if both players draw cards simultaneously, both actions are valid
    // Example: if trying to tap an already tapped permanent, action becomes no-op

    let transformed = { ...action };

    for (const concurrent of concurrentActions) {
      transformed = this.transformAgainst(transformed, concurrent);
    }

    return transformed;
  }

  private transformAgainst(
    action: GameStateAction,
    against: GameStateAction,
  ): GameStateAction {
    // Implement specific transformation rules
    if (action.type === "tap" && against.type === "tap") {
      if (action.payload.cardId === against.payload.cardId) {
        // Both trying to tap same card - first one wins, second becomes no-op
        return { ...action, type: "no-op" };
      }
    }

    // Add more transformation rules for different action combinations
    return action;
  }

  undo(steps: number = 1): TCGGameState | null {
    if (this.currentVersion - steps < 0) {
      return null;
    }

    const targetVersion = this.currentVersion - steps;
    const previousState = this.stateHistory.get(targetVersion);

    if (previousState) {
      this.currentVersion = targetVersion;
      return previousState;
    }

    return null;
  }

  redo(steps: number = 1): TCGGameState | null {
    const targetVersion = this.currentVersion + steps;
    const nextState = this.stateHistory.get(targetVersion);

    if (nextState) {
      this.currentVersion = targetVersion;
      return nextState;
    }

    return null;
  }

  getActionsSince(version: number): GameStateAction[] {
    return this.actionLog.filter(
      (action) => action.previousStateVersion >= version,
    );
  }

  private executeAction(
    action: GameStateAction,
    state: TCGGameState,
  ): TCGGameState {
    // Deep clone state
    const newState = JSON.parse(JSON.stringify(state)) as TCGGameState;

    switch (action.type) {
      case "draw":
        return this.handleDraw(newState, action);
      case "play":
        return this.handlePlay(newState, action);
      case "tap":
        return this.handleTap(newState, action);
      // ... other action handlers
      default:
        return newState;
    }
  }

  // Action handlers
  private handleDraw(
    state: TCGGameState,
    action: GameStateAction,
  ): TCGGameState {
    const player = state.players.find((p) => p.id === action.playerId);
    if (!player) return state;

    // Draw card logic
    if (player.library.count > 0) {
      player.library.count--;
      player.hand.push({ id: crypto.randomUUID() });
    }

    return state;
  }

  private handleTap(
    state: TCGGameState,
    action: GameStateAction,
  ): TCGGameState {
    const { cardId } = action.payload as { cardId: string };
    const card = state.battlefield.permanents.find((p) => p.id === cardId);

    if (card && !card.isTapped) {
      card.isTapped = true;
    }

    return state;
  }

  // ... more action handlers
}

// Schema updates
export const gameStateHistory = sqliteTable(
  "game_state_history",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    sessionId: text("session_id")
      .notNull()
      .references(() => gameSessions.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    state: text("state").notNull(), // JSON GameState
    actionId: text("action_id"),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    index("idx_game_state_session").on(table.sessionId),
    index("idx_game_state_version").on(table.sessionId, table.version),
    unique().on(table.sessionId, table.version),
  ],
);

export const gameActions = sqliteTable(
  "game_actions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    sessionId: text("session_id")
      .notNull()
      .references(() => gameSessions.id, { onDelete: "cascade" }),
    playerId: text("player_id").notNull(),
    actionType: text("action_type").notNull(),
    payload: text("payload").notNull(), // JSON
    previousVersion: integer("previous_version").notNull(),
    resultingVersion: integer("resulting_version").notNull(),
    timestamp: integer("timestamp", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => [
    index("idx_game_actions_session").on(table.sessionId),
    index("idx_game_actions_timestamp").on(table.sessionId, table.timestamp),
  ],
);
```

#### 2.2 State Delta/Patch System

**Recommendation - Implement Efficient Delta Sync**

```typescript
// shared/game-state-delta.ts
export interface GameStateDelta {
  baseVersion: number;
  targetVersion: number;
  operations: DeltaOperation[];
  timestamp: number;
}

export type DeltaOperation =
  | { op: "add"; path: string; value: unknown }
  | { op: "remove"; path: string }
  | { op: "replace"; path: string; value: unknown }
  | { op: "move"; from: string; path: string };

export class GameStateDeltaCompressor {
  static createDelta(
    oldState: TCGGameState,
    newState: TCGGameState,
  ): GameStateDelta {
    // Use JSON Patch (RFC 6902) algorithm
    const operations = this.computeDiff(oldState, newState);

    return {
      baseVersion: oldState.version,
      targetVersion: newState.version,
      operations,
      timestamp: Date.now(),
    };
  }

  static applyDelta(state: TCGGameState, delta: GameStateDelta): TCGGameState {
    if (state.version !== delta.baseVersion) {
      throw new Error(
        `Version mismatch: expected ${delta.baseVersion}, got ${state.version}`,
      );
    }

    let result = JSON.parse(JSON.stringify(state));

    for (const op of delta.operations) {
      result = this.applyOperation(result, op);
    }

    result.version = delta.targetVersion;
    return result;
  }

  private static computeDiff(
    oldObj: any,
    newObj: any,
    path: string = "",
  ): DeltaOperation[] {
    const operations: DeltaOperation[] = [];

    // Implementation of diff algorithm
    // Compare objects recursively and generate operations

    return operations;
  }

  private static applyOperation(obj: any, op: DeltaOperation): any {
    const result = { ...obj };
    const pathParts = op.path.split("/").filter(Boolean);

    switch (op.op) {
      case "replace":
        this.setPath(result, pathParts, op.value);
        break;
      case "add":
        this.setPath(result, pathParts, op.value);
        break;
      case "remove":
        this.removePath(result, pathParts);
        break;
      // ... more operations
    }

    return result;
  }

  // Helper methods for path operations
  private static setPath(obj: any, path: string[], value: unknown): void {
    // Implementation
  }

  private static removePath(obj: any, path: string[]): void {
    // Implementation
  }
}

// Update WebSocket messages to use deltas
export interface GameStateSyncMessage {
  type: "game_state_sync";
  sessionId: string;
  syncType: "full" | "delta";
  fullState?: TCGGameState;
  delta?: GameStateDelta;
  timestamp: number;
}
```

---

## 3. Multi-Game Support Analysis

### Current Implementation

**Current Approach:**

- Generic `gameType` field in database
- `gameData` as flexible JSON field
- No explicit game adapters or interfaces

**Issues Identified:**

1. **No Adapter Pattern Implementation**
   - ❌ No common game interface
   - ❌ Game-specific logic scattered across codebase
   - ❌ Difficult to add new games
   - ❌ No validation of game-specific rules

2. **TCG-Specific Hardcoding**
   - Current implementation assumes MTG-like structure
   - Power levels, format names are MTG-specific
   - No abstraction for different game mechanics

**Recommendations:**

**HIGH PRIORITY - Implement Game Adapter Pattern**

```typescript
// shared/game-adapters/base-game-adapter.ts
export interface GameAdapter<TState extends GameStateBase> {
  gameType: string;
  gameName: string;

  // State management
  createInitialState(config: GameConfig): TState;
  validateState(state: TState): ValidationResult;

  // Action handling
  validateAction(action: GameStateAction, state: TState): boolean;
  applyAction(action: GameStateAction, state: TState): TState;

  // Game-specific rules
  isGameOver(state: TState): boolean;
  getWinner(state: TState): string | null;
  getLegalActions(state: TState, playerId: string): GameStateAction[];

  // UI rendering helpers
  renderState(state: TState): GameStateView;
  getPlayerActions(state: TState, playerId: string): PlayerAction[];
}

export interface GameConfig {
  maxPlayers: number;
  players: Array<{ id: string; name: string }>;
  gameSpecificConfig: unknown;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface GameStateView {
  publicState: unknown;
  playerStates: Map<string, unknown>;
}

export interface PlayerAction {
  id: string;
  type: string;
  label: string;
  icon?: string;
  requiresTarget?: boolean;
}

// shared/game-adapters/mtg-adapter.ts
export class MTGAdapter implements GameAdapter<MTGGameState> {
  gameType = "mtg";
  gameName = "Magic: The Gathering";

  createInitialState(config: GameConfig): MTGGameState {
    const players = config.players.map((p) => ({
      id: p.id,
      name: p.name,
      lifeTotal: 20,
      hand: [],
      battlefield: { cards: [], isPublic: true },
      graveyard: { cards: [], isPublic: true },
      library: { count: 60 },
      exile: { cards: [], isPublic: true },
    }));

    return {
      version: 0,
      timestamp: Date.now(),
      lastModifiedBy: "system",
      gameType: "mtg",
      players,
      turnOrder: players.map((p) => p.id),
      currentTurn: {
        playerId: players[0]!.id,
        phase: "untap",
        step: "untap",
      },
      stack: [],
      battlefield: { permanents: [] },
    };
  }

  validateState(state: MTGGameState): ValidationResult {
    const errors: string[] = [];

    // Validate player life totals
    for (const player of state.players) {
      if (player.lifeTotal < 0 && !this.isGameOver(state)) {
        errors.push(
          `Player ${player.name} has negative life but game is not over`,
        );
      }
    }

    // Validate turn order
    if (state.turnOrder.length !== state.players.length) {
      errors.push("Turn order does not match player count");
    }

    // Validate current turn
    if (!state.turnOrder.includes(state.currentTurn.playerId)) {
      errors.push("Current turn player not in turn order");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  validateAction(action: GameStateAction, state: MTGGameState): boolean {
    switch (action.type) {
      case "draw":
        return this.validateDraw(action, state);
      case "play":
        return this.validatePlay(action, state);
      // ... more validations
      default:
        return false;
    }
  }

  applyAction(action: GameStateAction, state: MTGGameState): MTGGameState {
    // Delegate to specific action handlers
    // ... implementation
    return state;
  }

  isGameOver(state: MTGGameState): boolean {
    // Check win conditions
    const alivePlayers = state.players.filter((p) => p.lifeTotal > 0);
    return alivePlayers.length <= 1;
  }

  getWinner(state: MTGGameState): string | null {
    if (!this.isGameOver(state)) return null;

    const alivePlayers = state.players.filter((p) => p.lifeTotal > 0);
    return alivePlayers[0]?.id ?? null;
  }

  getLegalActions(state: MTGGameState, playerId: string): GameStateAction[] {
    // Return list of legal actions for player based on current game state
    const actions: GameStateAction[] = [];

    // Check if it's player's turn
    if (state.currentTurn.playerId === playerId) {
      // Add phase-specific actions
      if (state.currentTurn.phase === "draw") {
        actions.push({
          id: crypto.randomUUID(),
          type: "draw",
          playerId,
          timestamp: Date.now(),
          payload: {},
          previousStateVersion: state.version,
          resultingStateVersion: state.version + 1,
        });
      }
    }

    // Add actions available anytime (like concede)
    actions.push({
      id: crypto.randomUUID(),
      type: "concede",
      playerId,
      timestamp: Date.now(),
      payload: {},
      previousStateVersion: state.version,
      resultingStateVersion: state.version + 1,
    });

    return actions;
  }

  renderState(state: MTGGameState): GameStateView {
    // Create public view and per-player views
    const publicState = {
      players: state.players.map((p) => ({
        id: p.id,
        name: p.name,
        lifeTotal: p.lifeTotal,
        handSize: p.hand.length,
        librarySize: p.library.count,
      })),
      currentTurn: state.currentTurn,
      battlefield: state.battlefield,
    };

    const playerStates = new Map<string, unknown>();
    for (const player of state.players) {
      playerStates.set(player.id, {
        hand: player.hand,
        // ... player-specific state
      });
    }

    return { publicState, playerStates };
  }

  getPlayerActions(state: MTGGameState, playerId: string): PlayerAction[] {
    const legalActions = this.getLegalActions(state, playerId);

    return legalActions.map((action) => ({
      id: action.id,
      type: action.type,
      label: this.getActionLabel(action.type),
      icon: this.getActionIcon(action.type),
    }));
  }

  private validateDraw(action: GameStateAction, state: MTGGameState): boolean {
    const player = state.players.find((p) => p.id === action.playerId);
    return player !== undefined && player.library.count > 0;
  }

  private validatePlay(action: GameStateAction, state: MTGGameState): boolean {
    // Validate playing a card
    // Check: is it player's turn? do they have the card? can they afford it?
    return true; // Simplified
  }

  private getActionLabel(actionType: string): string {
    const labels: Record<string, string> = {
      draw: "Draw Card",
      play: "Play Card",
      tap: "Tap Permanent",
      untap: "Untap Permanent",
      concede: "Concede Game",
    };
    return labels[actionType] || actionType;
  }

  private getActionIcon(actionType: string): string {
    const icons: Record<string, string> = {
      draw: "fa-layer-plus",
      play: "fa-hand-sparkles",
      tap: "fa-rotate-right",
      untap: "fa-rotate-left",
      concede: "fa-flag",
    };
    return icons[actionType] || "fa-gamepad";
  }
}

// shared/game-adapters/pokemon-adapter.ts
export class PokemonAdapter implements GameAdapter<PokemonGameState> {
  gameType = "pokemon";
  gameName = "Pokémon TCG";

  createInitialState(config: GameConfig): PokemonGameState {
    const players = config.players.map((p) => ({
      id: p.id,
      name: p.name,
      prizeCards: 6,
      activePokemon: null,
      bench: [],
      hand: [],
      deck: { count: 60 },
      discardPile: { cards: [], isPublic: true },
    }));

    return {
      version: 0,
      timestamp: Date.now(),
      lastModifiedBy: "system",
      gameType: "pokemon",
      players,
      turnOrder: players.map((p) => p.id),
      currentTurn: {
        playerId: players[0]!.id,
        phase: "setup",
      },
    };
  }

  // ... implement other adapter methods
}

// shared/game-adapters/registry.ts
export class GameAdapterRegistry {
  private static adapters = new Map<string, GameAdapter<any>>();

  static register<T extends GameStateBase>(adapter: GameAdapter<T>): void {
    this.adapters.set(adapter.gameType, adapter);
  }

  static get<T extends GameStateBase>(gameType: string): GameAdapter<T> | null {
    return this.adapters.get(gameType) ?? null;
  }

  static getSupportedGames(): Array<{ type: string; name: string }> {
    return Array.from(this.adapters.values()).map((adapter) => ({
      type: adapter.gameType,
      name: adapter.gameName,
    }));
  }
}

// Register adapters
GameAdapterRegistry.register(new MTGAdapter());
GameAdapterRegistry.register(new PokemonAdapter());
// ... register other games

// Usage in server
async function handleGameAction(
  sessionId: string,
  action: GameStateAction,
): Promise<TCGGameState> {
  const session = await storage.getGameSessionById(sessionId);
  if (!session) throw new Error("Session not found");

  const adapter = GameAdapterRegistry.get(session.gameType);
  if (!adapter)
    throw new Error(`No adapter for game type: ${session.gameType}`);

  const currentState = JSON.parse(session.boardState || "{}");

  // Validate action
  if (!adapter.validateAction(action, currentState)) {
    throw new Error("Invalid action");
  }

  // Apply action
  const newState = adapter.applyAction(action, currentState);

  // Validate resulting state
  const validation = adapter.validateState(newState);
  if (!validation.valid) {
    throw new Error(`Invalid state: ${validation.errors.join(", ")}`);
  }

  // Store new state
  await storage.updateGameSession(sessionId, {
    boardState: JSON.stringify(newState),
  });

  return newState;
}
```

---

## 4. Performance Optimization Opportunities

### 4.1 Database Performance

**Current Issues:**

- Full game state stored as JSON text
- No indexes on game state fields
- Inefficient queries for active sessions

**Recommendations:**

```sql
-- Add indexes for common queries
CREATE INDEX idx_game_sessions_status_created
ON game_sessions(status, created_at DESC);

CREATE INDEX idx_game_sessions_community_status
ON game_sessions(community_id, status);

CREATE INDEX idx_game_sessions_host_active
ON game_sessions(host_id, status)
WHERE status IN ('waiting', 'active');

-- Add materialized view for active sessions
CREATE VIEW active_game_sessions AS
SELECT
  gs.*,
  u.first_name AS host_first_name,
  u.email AS host_email,
  c.name AS community_name,
  json_extract(gs.game_data, '$.name') AS game_name,
  json_extract(gs.game_data, '$.format') AS game_format
FROM game_sessions gs
JOIN users u ON gs.host_id = u.id
LEFT JOIN communities c ON gs.community_id = c.id
WHERE gs.status IN ('waiting', 'active');
```

### 4.2 WebSocket Message Optimization

**Current Issues:**

- Broadcast sends full state to all players
- No message batching
- No prioritization

**Recommendations:**

```typescript
// Add message batching
export class MessageBatcher {
  private batches = new Map<string, Array<unknown>>();
  private batchTimeouts = new Map<string, NodeJS.Timeout>();
  private readonly BATCH_DELAY = 50; // ms
  private readonly MAX_BATCH_SIZE = 10;

  queueMessage(connectionId: string, message: unknown): void {
    if (!this.batches.has(connectionId)) {
      this.batches.set(connectionId, []);
    }

    const batch = this.batches.get(connectionId)!;
    batch.push(message);

    // Send immediately if batch is full
    if (batch.length >= this.MAX_BATCH_SIZE) {
      this.flushBatch(connectionId);
    } else {
      // Schedule batch send
      this.scheduleBatchSend(connectionId);
    }
  }

  private scheduleBatchSend(connectionId: string): void {
    // Clear existing timeout
    const existing = this.batchTimeouts.get(connectionId);
    if (existing) {
      clearTimeout(existing);
    }

    // Schedule new timeout
    const timeout = setTimeout(() => {
      this.flushBatch(connectionId);
    }, this.BATCH_DELAY);

    this.batchTimeouts.set(connectionId, timeout);
  }

  private flushBatch(connectionId: string): void {
    const batch = this.batches.get(connectionId);
    if (!batch || batch.length === 0) return;

    // Send batch
    const ws = connectionManager.getConnection(connectionId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "batch",
          messages: batch,
          timestamp: Date.now(),
        }),
      );
    }

    // Clear batch
    this.batches.set(connectionId, []);
    const timeout = this.batchTimeouts.get(connectionId);
    if (timeout) {
      clearTimeout(timeout);
      this.batchTimeouts.delete(connectionId);
    }
  }
}
```

### 4.3 Caching Strategy

**Recommendations:**

```typescript
// Add Redis caching for game sessions
export class GameSessionCache {
  private redis: RedisClient;
  private readonly TTL = 300; // 5 minutes

  async getSession(sessionId: string): Promise<GameSession | null> {
    // Try cache first
    const cached = await this.redis.get(`session:${sessionId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // Fallback to database
    const session = await storage.getGameSessionById(sessionId);
    if (session) {
      // Cache for future
      await this.redis.setex(
        `session:${sessionId}`,
        this.TTL,
        JSON.stringify(session),
      );
    }

    return session;
  }

  async updateSession(
    sessionId: string,
    updates: Partial<GameSession>,
  ): Promise<void> {
    // Update database
    await storage.updateGameSession(sessionId, updates);

    // Invalidate cache
    await this.redis.del(`session:${sessionId}`);
  }

  async cacheActiveState(
    sessionId: string,
    state: GameStateBase,
  ): Promise<void> {
    // Cache current state separately for quick access
    await this.redis.setex(
      `session:${sessionId}:state`,
      60, // 1 minute TTL for state
      JSON.stringify(state),
    );
  }
}
```

---

## 5. Security Considerations

### 5.1 Current Security Measures

**Strengths:**

- ✅ Authentication required for WebSocket connections
- ✅ Rate limiting implemented
- ✅ Origin validation
- ✅ Message validation

**Vulnerabilities:**

1. **No Authorization Checks**

   ```typescript
   // Current code doesn't verify if user is allowed to join session
   async handleJoinRoom(ws: ExtendedWebSocket, message: unknown) {
     const { sessionId, user } = message;
     connectionManager.joinGameRoom(connectionId, sessionId);
     // ⚠️ Missing: Check if session is full, if user is banned, etc.
   }
   ```

2. **No Input Sanitization for Game State**
   - User can potentially send malformed game states
   - No schema validation for game actions

**Recommendations:**

```typescript
// Add authorization middleware
export async function authorizeGameAction(
  sessionId: string,
  userId: string,
  action: GameStateAction,
): Promise<boolean> {
  const session = await storage.getGameSessionById(sessionId);
  if (!session) return false;

  // Check if user is participant
  const isParticipant = session.players?.includes(userId);
  if (!isParticipant) return false;

  // Check if it's user's turn (for turn-based actions)
  if (requiresTurn(action.type)) {
    const state = JSON.parse(session.boardState || "{}");
    if (state.currentTurn?.playerId !== userId) {
      return false;
    }
  }

  return true;
}

// Add game action validation
export function validateGameAction(action: GameStateAction): boolean {
  const schema = z.object({
    id: z.string(),
    type: z.string(),
    playerId: z.string(),
    timestamp: z.number(),
    payload: z.unknown(),
    previousStateVersion: z.number(),
    resultingStateVersion: z.number(),
  });

  try {
    schema.parse(action);
    return true;
  } catch {
    return false;
  }
}
```

---

## 6. Testing Recommendations

### Current Test Coverage

**Existing Tests:**

- `websocket-server-integration.test.ts` - Basic WebSocket tests
- `websocket.config.test.ts` - Configuration tests
- `game-room.test.tsx` - UI component tests

**Missing Tests:**

- ❌ Game state synchronization tests
- ❌ Conflict resolution tests
- ❌ Undo/redo functionality tests
- ❌ Multi-player concurrent action tests
- ❌ Performance/load tests

**Recommendations:**

```typescript
// tests/game-state-sync.test.ts
describe("Game State Synchronization", () => {
  describe("Conflict Resolution", () => {
    it("should resolve concurrent draw actions", async () => {
      const initialState = createMockGameState();
      const manager = new GameStateManager();

      // Simulate two players drawing simultaneously
      const action1: GameStateAction = {
        id: "1",
        type: "draw",
        playerId: "player1",
        timestamp: Date.now(),
        payload: {},
        previousStateVersion: 0,
        resultingStateVersion: 1,
      };

      const action2: GameStateAction = {
        id: "2",
        type: "draw",
        playerId: "player2",
        timestamp: Date.now(),
        payload: {},
        previousStateVersion: 0,
        resultingStateVersion: 1,
      };

      // Apply first action
      const state1 = manager.applyAction(action1, initialState);
      expect(state1.version).toBe(1);

      // Apply second action (concurrent with first)
      const state2 = manager.applyAction(action2, state1);
      expect(state2.version).toBe(2);

      // Verify both players drew cards
      expect(state2.players[0].hand.length).toBe(1);
      expect(state2.players[1].hand.length).toBe(1);
    });

    it("should resolve conflicting tap actions", async () => {
      const initialState = createMockGameState();
      const manager = new GameStateManager();

      // Both players try to tap same permanent
      const action1: GameStateAction = {
        id: "1",
        type: "tap",
        playerId: "player1",
        timestamp: Date.now(),
        payload: { cardId: "card123" },
        previousStateVersion: 0,
        resultingStateVersion: 1,
      };

      const action2: GameStateAction = {
        id: "2",
        type: "tap",
        playerId: "player2",
        timestamp: Date.now(),
        payload: { cardId: "card123" },
        previousStateVersion: 0,
        resultingStateVersion: 1,
      };

      const state1 = manager.applyAction(action1, initialState);
      const state2 = manager.applyAction(action2, state1);

      // Card should only be tapped once
      const card = state2.battlefield.permanents.find(
        (p) => p.id === "card123",
      );
      expect(card?.isTapped).toBe(true);
    });
  });

  describe("Undo/Redo", () => {
    it("should undo last action", async () => {
      const initialState = createMockGameState();
      const manager = new GameStateManager();

      // Draw card
      const drawAction: GameStateAction = {
        id: "1",
        type: "draw",
        playerId: "player1",
        timestamp: Date.now(),
        payload: {},
        previousStateVersion: 0,
        resultingStateVersion: 1,
      };

      const afterDraw = manager.applyAction(drawAction, initialState);
      expect(afterDraw.players[0].hand.length).toBe(1);

      // Undo
      const afterUndo = manager.undo();
      expect(afterUndo).not.toBeNull();
      expect(afterUndo!.players[0].hand.length).toBe(0);
    });

    it("should redo undone action", async () => {
      const initialState = createMockGameState();
      const manager = new GameStateManager();

      const drawAction: GameStateAction = {
        id: "1",
        type: "draw",
        playerId: "player1",
        timestamp: Date.now(),
        payload: {},
        previousStateVersion: 0,
        resultingStateVersion: 1,
      };

      manager.applyAction(drawAction, initialState);
      manager.undo();

      const afterRedo = manager.redo();
      expect(afterRedo).not.toBeNull();
      expect(afterRedo!.players[0].hand.length).toBe(1);
    });
  });
});

// tests/performance/websocket-load.test.ts
describe("WebSocket Load Tests", () => {
  it("should handle 1000 concurrent connections", async () => {
    const connections: WebSocket[] = [];

    // Create 1000 connections
    for (let i = 0; i < 1000; i++) {
      const ws = new WebSocket("ws://localhost:5000/ws");
      connections.push(ws);
    }

    // Wait for all to connect
    await Promise.all(
      connections.map(
        (ws) =>
          new Promise((resolve) => {
            ws.on("open", resolve);
          }),
      ),
    );

    // Verify all connected
    expect(
      connections.filter((ws) => ws.readyState === WebSocket.OPEN).length,
    ).toBe(1000);

    // Cleanup
    connections.forEach((ws) => ws.close());
  });

  it("should handle message throughput of 10,000 msg/sec", async () => {
    // Performance test implementation
  });
});
```

---

## 7. Scalability Recommendations

### 7.1 Horizontal Scaling

**Current Limitation:**

- In-memory connection management doesn't scale across servers
- No shared state between instances

**Recommendation:**

```typescript
// Add Redis-based connection manager for multi-server setup
export class DistributedConnectionManager {
  private redis: RedisClient;
  private pubsub: RedisPubSub;
  private localConnections = new Map<string, ExtendedWebSocket>();

  async registerConnection(
    ws: ExtendedWebSocket,
    userId: string,
  ): Promise<string> {
    const connectionId = this.generateConnectionId();

    // Store locally
    this.localConnections.set(connectionId, ws);

    // Register in Redis with server ID
    await this.redis.hset(`connections:${connectionId}`, {
      userId,
      serverId: process.env.SERVER_ID,
      timestamp: Date.now(),
    });

    return connectionId;
  }

  async broadcastToGameRoom(
    sessionId: string,
    message: unknown,
  ): Promise<void> {
    // Publish to Redis channel
    await this.pubsub.publish(`room:${sessionId}`, JSON.stringify(message));
  }

  private setupPubSubHandlers(): void {
    // Subscribe to room channels for messages from other servers
    this.pubsub.psubscribe("room:*", (channel, message) => {
      const sessionId = channel.replace("room:", "");
      const localConnections = this.getLocalConnectionsForRoom(sessionId);

      for (const ws of localConnections) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      }
    });
  }
}
```

### 7.2 Database Sharding

**Recommendation:**

```typescript
// Shard game sessions by session ID
export function getShardForSession(sessionId: string): number {
  const hash = crypto.createHash("md5").update(sessionId).digest("hex");
  const numShards = parseInt(process.env.DB_SHARDS || "4");
  return parseInt(hash.substring(0, 8), 16) % numShards;
}

// Route queries to appropriate shard
export async function getGameSession(sessionId: string): Promise<GameSession> {
  const shard = getShardForSession(sessionId);
  const db = getDatabaseConnection(shard);
  return db.query.gameSessions.findFirst({
    where: eq(gameSessions.id, sessionId),
  });
}
```

---

## 8. Summary of Recommendations

### Priority Matrix

| Priority     | Category      | Recommendation                                      | Effort | Impact |
| ------------ | ------------- | --------------------------------------------------- | ------ | ------ |
| **CRITICAL** | Game State    | Implement structured state with versioning          | High   | High   |
| **CRITICAL** | Concurrency   | Add connection limits and race condition prevention | Medium | High   |
| **HIGH**     | Game State    | Implement conflict resolution (OT)                  | High   | High   |
| **HIGH**     | Game State    | Add undo/redo functionality                         | Medium | High   |
| **HIGH**     | Multi-game    | Implement game adapter pattern                      | High   | High   |
| **HIGH**     | Reliability   | Add reconnection state management                   | Medium | High   |
| **MEDIUM**   | Performance   | Implement delta sync for state updates              | Medium | Medium |
| **MEDIUM**   | Performance   | Add message batching                                | Low    | Medium |
| **MEDIUM**   | Scalability   | Add Redis for distributed connection management     | High   | Medium |
| **LOW**      | Performance   | Add caching layer for sessions                      | Medium | Low    |
| **LOW**      | Rate Limiting | Implement adaptive rate limiting                    | Low    | Low    |

### Implementation Roadmap

**Phase 1: Critical Fixes (2-3 weeks)**

1. Implement connection limits and race condition prevention
2. Add structured game state schema with versioning
3. Implement basic conflict detection

**Phase 2: Core Functionality (3-4 weeks)**

1. Implement operational transformation for conflict resolution
2. Add undo/redo functionality
3. Implement game adapter pattern with MTG and Pokemon adapters
4. Add reconnection state management

**Phase 3: Performance & Scale (2-3 weeks)**

1. Implement delta sync for state updates
2. Add message batching
3. Implement caching layer
4. Add comprehensive testing

**Phase 4: Production Readiness (2 weeks)**

1. Load testing and optimization
2. Monitoring and alerting setup
3. Documentation
4. Security audit

---

## 9. Risk Assessment

### High Risk Areas

1. **State Synchronization Conflicts**
   - Risk: Multiple players editing state simultaneously causes inconsistencies
   - Mitigation: Implement OT algorithm (recommended above)
   - Timeline: Phase 2

2. **Connection Management Race Conditions**
   - Risk: Server crashes or data corruption under high load
   - Mitigation: Add locks and limits (recommended above)
   - Timeline: Phase 1 (CRITICAL)

3. **Scalability Bottleneck**
   - Risk: Single-server architecture can't handle growth
   - Mitigation: Redis-based distributed system
   - Timeline: Phase 3

### Medium Risk Areas

1. **Game State Migration**
   - Risk: Changing state schema breaks existing games
   - Mitigation: Version state schema, provide migration path
   - Timeline: Phase 1

2. **WebRTC Connection Reliability**
   - Risk: Video/audio fails for some users
   - Mitigation: Add TURN server fallback, better error handling
   - Timeline: Future enhancement

---

## 10. Conclusion

The TableSync feature provides a solid foundation for real-time TCG gameplay but requires significant architectural improvements for production readiness. The most critical areas are:

1. **Game state structure and versioning** - Essential for conflict resolution and undo/redo
2. **Concurrency control** - Prevent race conditions and data corruption
3. **Multi-game abstraction** - Enable support for diverse TCG games beyond MTG

Implementing the recommendations in this document will create a robust, scalable, and maintainable TableSync platform capable of supporting thousands of concurrent games across multiple TCG titles.

---

**Next Steps:**

1. Review and prioritize recommendations with development team
2. Create detailed technical specifications for Phase 1 work
3. Set up test environment for load testing
4. Begin implementation following the roadmap

**Questions or Clarifications:**
Contact the development team for any questions about these recommendations.
