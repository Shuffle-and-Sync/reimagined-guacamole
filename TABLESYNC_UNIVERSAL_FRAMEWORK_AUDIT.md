# TableSync Universal Deck-Building Framework Audit
## PRD v3.0 Compliance Review

**Date**: December 2024  
**Status**: Audit In Progress  
**Priority**: High

---

## Executive Summary

This audit reviews the current state of TableSync against the requirements outlined in **PRD v3.0: Universal Deck-Building Framework**. The goal is to transform TableSync from a platform primarily focused on specific TCGs (Magic: The Gathering, Pokemon, etc.) into a flexible, extensible, universal deck-building card game (DBCG) framework that supports:

1. **User-defined games** with custom card attributes and rules
2. **Game-agnostic database schema** for maximum flexibility
3. **Universal card scanner** adaptable to any DBCG
4. **Dynamic UI/UX** that adapts to user/game definitions
5. **Game Creator module** for community-driven game definitions
6. **UGC moderation system** for peer-reviewed card data

### Key Findings

✅ **What Exists (Foundation)**:
- Strong community-based architecture supporting multiple TCG communities
- Flexible event and game session management
- Card recognition system for MTG (Phase 1 MVP)
- Game statistics tracking with TCG type support
- PostgreSQL database with JSONB support for flexible data

❌ **What's Missing for PRD v3.0**:
- Database schema is not fully game-agnostic
- Card data is MTG-specific (hardcoded to Scryfall API)
- No "Game Creator" module for user-defined games
- No universal card database schema
- No support for custom card attributes per game
- No UGC moderation system for community card submissions
- API lacks game_id parameter for multi-game support
- No dynamic UI generation based on game definitions

---

## 1. Current State Analysis

### 1.1 Database Schema Review

**Location**: `/shared/schema.ts`

#### ✅ Strengths (Game-Agnostic Features)
- **Communities table**: Supports multiple TCG communities (MTG, Pokemon, Lorcana, Yu-Gi-Oh, etc.)
- **JSONB columns**: Extensive use of `jsonb` for flexible data storage
  - `gameData` in `gameSessions` table
  - `achievements`, `statistics` in `userGamingProfiles`
  - `sessionData` in various tables
- **Game sessions**: Generic game session management not tied to specific games
- **User gaming profiles**: Per-community profiles with flexible stats storage

#### ❌ Gaps (Not Universal)
- **No game definitions table**: Cannot store user-defined game metadata
- **No card schema table**: No universal card database schema
- **No card attributes table**: Cannot define custom card attributes per game
- **No resource types table**: Cannot define game-specific resources (mana, energy, etc.)
- **No game rules table**: Cannot store game-specific rules and validation logic
- **No card data table**: Card recognition service uses external API only, no internal storage

#### Current Schema Assessment

```typescript
// EXISTING GAME-RELATED TABLES

1. communities - Predefined TCG communities (MTG, Pokemon, etc.)
   ✅ Supports multiple games
   ❌ Games are hardcoded, not user-definable

2. gameSessions - Game session tracking
   ✅ Has `gameData: jsonb` for flexible storage
   ❌ No link to game definitions
   ❌ No validation against game rules

3. userGamingProfiles - Per-user, per-community gaming profiles
   ✅ Has `statistics: jsonb` for flexible stats
   ❌ Tied to communities, not individual games
   ❌ No support for user-defined game stats

4. events - Event scheduling
   ✅ Has `gameFormat` field
   ❌ Format is free-text, not validated against game definitions
```

### 1.2 Card Recognition System Review

**Location**: `/server/services/card-recognition.ts`, `/server/features/cards/cards.routes.ts`

#### Current Implementation
- **API**: Scryfall API integration for Magic: The Gathering
- **Caching**: In-memory LRU cache (1000 cards, 7-day TTL)
- **Endpoints**:
  - `GET /api/cards/search` - Search MTG cards
  - `GET /api/cards/:id` - Get MTG card by ID
  - `GET /api/cards/named` - Get MTG card by name
  - `GET /api/cards/autocomplete` - MTG card autocomplete
  - `GET /api/cards/random` - Random MTG card

#### ❌ Limitations for Universal Framework
1. **Hardcoded to MTG**: Service is `MtgCard` interface specific
2. **Single API source**: Only Scryfall API, no multi-game support
3. **No game_id parameter**: Cannot differentiate between games
4. **Fixed card schema**: Card attributes are MTG-specific (mana_cost, cmc, power, toughness)
5. **No extensibility**: Cannot add custom card attributes
6. **No UGC support**: No ability to submit community card data

### 1.3 Game Statistics System Review

**Location**: `/server/features/game-stats/`

#### Current Implementation
```typescript
// Supports multiple game types
interface GameStats {
  gameType: string; // mtg, pokemon, lorcana, yugioh, etc.
  format: string;
  // ... stats fields
}
```

#### ✅ Strengths
- Already supports multiple game types via `gameType` field
- Flexible format tracking
- Generic win/loss tracking

#### ❌ Gaps
- `gameType` is free-text, not validated against game definitions
- No link to actual game metadata
- Cannot track game-specific stats (e.g., commander damage for MTG)

### 1.4 API Architecture Review

**Current State**: RESTful API with feature-based routing

#### ❌ Missing Universal Support
- No `/api/games/` endpoint for game definitions
- No `/api/games/:game_id/cards/` nested routing
- No game-specific validation middleware
- No dynamic schema validation per game

### 1.5 Frontend/UI Review

**Location**: `/client/src/`

#### Current State
- Static UI components for specific games
- Hardcoded game types in dropdowns
- Fixed card display layouts

#### ❌ Missing Dynamic UI
- No dynamic form generation based on game schema
- No runtime card attribute display
- No game-specific UI themes from user definitions

---

## 2. PRD v3.0 Requirements Gap Analysis

### 2.1 Universal, Flexible Database Schema

**Requirement**: Game-agnostic schema supporting user-defined games with custom attributes

**Current State**: Partial support via JSONB columns, but no formal game definition system

**Gaps**:
- [ ] No `games` table for storing user-defined game metadata
- [ ] No `game_card_attributes` table for custom card schemas per game
- [ ] No `game_resources` table for resource types (mana, energy, etc.)
- [ ] No `game_rules` table for validation logic
- [ ] No `cards` universal table for storing card data across all games
- [ ] No `card_attribute_values` table for dynamic card data

**Recommendation**: Add comprehensive game definition schema (see Section 4)

### 2.2 Game Creator Module

**Requirement**: Users can define new games, card attributes, resources, and rules

**Current State**: Does not exist

**Gaps**:
- [ ] No UI for game creation
- [ ] No API endpoints for game CRUD operations
- [ ] No game schema designer
- [ ] No card attribute builder
- [ ] No rules definition interface
- [ ] No game publishing workflow
- [ ] No game versioning system

**Recommendation**: Implement Game Creator module (see Section 5)

### 2.3 Universal Card Scanner

**Requirement**: Support any deck-building card game, not just MTG

**Current State**: MTG-only via Scryfall API

**Gaps**:
- [ ] No multi-game API integration
- [ ] No game selection in card search
- [ ] No game-specific card parsers
- [ ] No custom card data input for user-defined games
- [ ] No OCR adaptable to different card layouts

**Recommendation**: Refactor card recognition service (see Section 6)

### 2.4 Dynamic In-Game UI and Overlays

**Requirement**: UI adapts to user/game definitions automatically

**Current State**: Static UI with hardcoded game types

**Gaps**:
- [ ] No dynamic form generation from game schema
- [ ] No runtime card display configuration
- [ ] No game-specific overlay templates
- [ ] No theme customization per game

**Recommendation**: Implement dynamic UI framework (see Section 7)

### 2.5 Universal API with game_id Support

**Requirement**: All endpoints support game-specific operations via game_id

**Current State**: Single-game-focused API

**Gaps**:
- [ ] No `/api/games/` resource
- [ ] No game_id parameter in card endpoints
- [ ] No game-scoped validation
- [ ] No multi-game batch operations

**Recommendation**: Extend API architecture (see Section 8)

### 2.6 Scalable Backend (NoSQL Consideration)

**Requirement**: Consider NoSQL for highly flexible schema

**Current State**: PostgreSQL with JSONB

**Assessment**:
- ✅ PostgreSQL JSONB provides schema flexibility
- ✅ ACID transactions important for game integrity
- ✅ Relational model good for game relationships
- ⚠️ Migration to NoSQL would be costly and risky
- ✅ Current stack can support universal framework with schema additions

**Recommendation**: **Keep PostgreSQL**, leverage JSONB for flexibility (see Section 9)

### 2.7 Machine Learning Card Recognition

**Requirement**: ML-based recognition adaptable to new layouts and games

**Current State**: Text-based search only (Phase 1 MVP)

**Gaps**:
- [ ] No ML model infrastructure
- [ ] No card image training dataset
- [ ] No layout detection
- [ ] No OCR integration
- [ ] No confidence scoring

**Recommendation**: Phase 3 enhancement, not critical for MVP (see Section 10)

### 2.8 UGC Moderation/Peer-Review

**Requirement**: Community can submit card data with moderation workflow

**Current State**: Does not exist

**Gaps**:
- [ ] No card submission workflow
- [ ] No moderation queue for card data
- [ ] No peer review system
- [ ] No reputation/trust scoring
- [ ] No card data versioning
- [ ] No approval workflow

**Recommendation**: Implement UGC moderation system (see Section 11)

### 2.9 Metrics and Analytics

**Requirement**: Track games created, card data submitted, community participation

**Current State**: Basic analytics for streams and events

**Gaps**:
- [ ] No game creation metrics
- [ ] No card submission tracking
- [ ] No UGC contribution analytics
- [ ] No game popularity metrics
- [ ] No community engagement per game

**Recommendation**: Add universal framework metrics (see Section 12)

---

## 3. Compliance Summary Matrix

| PRD v3.0 Requirement | Current Status | Compliance | Priority |
|---------------------|----------------|------------|----------|
| Universal database schema | Partial (JSONB) | 30% | High |
| Game Creator module | Not implemented | 0% | Critical |
| Universal card scanner | MTG only | 20% | High |
| Dynamic UI/overlays | Static UI | 10% | Medium |
| Universal API (game_id) | Single-game | 15% | High |
| NoSQL/Flexible backend | PostgreSQL+JSONB | 60% | Low |
| ML card recognition | Text search only | 25% | Low |
| UGC moderation | Not implemented | 0% | High |
| Metrics & analytics | Basic tracking | 40% | Medium |

**Overall PRD v3.0 Compliance**: ~22%

---

## 4. Proposed Database Schema Extensions

### 4.1 Game Definitions Table

```typescript
// User-defined games
export const games = pgTable("games", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  displayName: varchar("display_name").notNull(),
  description: text("description"),
  creatorId: varchar("creator_id").notNull().references(() => users.id),
  isOfficial: boolean("is_official").default(false), // Official vs. community-created
  isPublished: boolean("is_published").default(false),
  version: varchar("version").default("1.0.0"),
  
  // Game metadata
  playerCount: jsonb("player_count").default({ min: 2, max: 4 }), // Min/max players
  avgGameDuration: integer("avg_game_duration"), // Minutes
  complexity: integer("complexity"), // 1-5 scale
  ageRating: varchar("age_rating"), // "7+", "13+", etc.
  
  // Game mechanics configuration
  cardTypes: jsonb("card_types").default([]), // ["Creature", "Instant", etc.]
  resourceTypes: jsonb("resource_types").default([]), // [{ name: "Mana", colors: [...] }]
  zones: jsonb("zones").default([]), // ["Hand", "Battlefield", "Graveyard"]
  phaseStructure: jsonb("phase_structure").default([]), // ["Untap", "Draw", etc.]
  
  // Validation rules (JSON schema or custom format)
  deckRules: jsonb("deck_rules").default({
    minDeckSize: 60,
    maxDeckSize: null,
    maxCopies: 4,
    allowedSets: null,
  }),
  
  // Visual customization
  theme: jsonb("theme").default({
    primaryColor: "#1a1a1a",
    accentColor: "#ffd700",
    cardBackUrl: null,
  }),
  
  // Statistics
  totalCards: integer("total_cards").default(0),
  totalPlayers: integer("total_players").default(0),
  totalGamesPlayed: integer("total_games_played").default(0),
  
  // Moderation
  moderationStatus: varchar("moderation_status").default("pending"), // pending, approved, rejected
  approvedAt: timestamp("approved_at"),
  approvedBy: varchar("approved_by").references(() => users.id),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_games_creator_id").on(table.creatorId),
  index("idx_games_published").on(table.isPublished),
  index("idx_games_official").on(table.isOfficial),
  index("idx_games_name").on(table.name),
]);
```

### 4.2 Universal Cards Table

```typescript
// Universal card data storage
export const cards = pgTable("cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameId: varchar("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  
  // Core identifiers
  setCode: varchar("set_code"),
  setName: varchar("set_name"),
  collectorNumber: varchar("collector_number"),
  rarity: varchar("rarity"),
  
  // External references (for official games)
  externalId: varchar("external_id"), // Scryfall ID, Pokemon TCG ID, etc.
  externalSource: varchar("external_source"), // "scryfall", "pokemontcg", "custom"
  
  // Card attributes (flexible JSON storage)
  attributes: jsonb("attributes").default({}), // { mana_cost: "{R}", power: "3", etc. }
  
  // Visual data
  imageUris: jsonb("image_uris").default({}),
  
  // Metadata
  createdBy: varchar("created_by").references(() => users.id), // For UGC
  isOfficial: boolean("is_official").default(false),
  isCommunitySubmitted: boolean("is_community_submitted").default(false),
  
  // Moderation
  moderationStatus: varchar("moderation_status").default("approved"), // For UGC
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  
  // Analytics
  searchCount: integer("search_count").default(0),
  
  // Cache management
  cachedAt: timestamp("cached_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_cards_game_id").on(table.gameId),
  index("idx_cards_name").on(table.name),
  index("idx_cards_external_id").on(table.externalId),
  index("idx_cards_set_code").on(table.setCode),
  // Full-text search index on name
  index("idx_cards_name_search").on(sql`to_tsvector('english', ${table.name})`),
  unique().on(table.gameId, table.externalId), // Prevent duplicates from same source
]);
```

### 4.3 Game Card Attributes Schema

```typescript
// Define what attributes cards can have for each game
export const gameCardAttributes = pgTable("game_card_attributes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameId: varchar("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
  attributeName: varchar("attribute_name").notNull(), // "mana_cost", "power", "type", etc.
  displayName: varchar("display_name").notNull(), // "Mana Cost", "Power", "Type"
  dataType: varchar("data_type").notNull(), // "string", "integer", "array", "object"
  isRequired: boolean("is_required").default(false),
  
  // Validation rules
  validationRules: jsonb("validation_rules").default({}), // { min: 0, max: 20, pattern: "..." }
  
  // UI hints
  displayOrder: integer("display_order").default(0),
  category: varchar("category"), // "stats", "costs", "mechanics", "flavor"
  helpText: text("help_text"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_game_card_attributes_game_id").on(table.gameId),
  unique().on(table.gameId, table.attributeName),
]);
```

### 4.4 Card Submissions (UGC)

```typescript
// Community card submissions
export const cardSubmissions = pgTable("card_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameId: varchar("game_id").notNull().references(() => games.id),
  submittedBy: varchar("submitted_by").notNull().references(() => users.id),
  
  // Card data being submitted
  cardName: varchar("card_name").notNull(),
  cardData: jsonb("card_data").notNull(), // All card attributes
  imageUrl: varchar("image_url"),
  
  // Submission metadata
  submissionNotes: text("submission_notes"),
  source: varchar("source"), // "manual", "ocr", "import"
  
  // Moderation workflow
  status: varchar("status").default("pending"), // pending, approved, rejected, needs_revision
  moderatorId: varchar("moderator_id").references(() => users.id),
  moderationNotes: text("moderation_notes"),
  reviewedAt: timestamp("reviewed_at"),
  
  // Peer review
  upvotes: integer("upvotes").default(0),
  downvotes: integer("downvotes").default(0),
  
  // If approved, link to created card
  approvedCardId: varchar("approved_card_id").references(() => cards.id),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_card_submissions_game_id").on(table.gameId),
  index("idx_card_submissions_submitted_by").on(table.submittedBy),
  index("idx_card_submissions_status").on(table.status),
]);
```

### 4.5 Game Formats

```typescript
// Game formats (e.g., Commander, Standard, Limited)
export const gameFormats = pgTable("game_formats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameId: varchar("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  displayName: varchar("display_name").notNull(),
  description: text("description"),
  
  // Format-specific rules
  deckRules: jsonb("deck_rules").default({
    minDeckSize: 60,
    maxDeckSize: null,
    sideboard: false,
    sideboardSize: 0,
  }),
  
  // Card legality
  bannedCards: jsonb("banned_cards").default([]), // Array of card IDs
  restrictedCards: jsonb("restricted_cards").default([]),
  allowedSets: jsonb("allowed_sets").default([]), // Array of set codes
  
  isOfficial: boolean("is_official").default(false),
  createdBy: varchar("created_by").references(() => users.id),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_game_formats_game_id").on(table.gameId),
  unique().on(table.gameId, table.name),
]);
```

---

## 5. Game Creator Module Design

### 5.1 Requirements

**Functionality**:
1. Create new game with basic metadata
2. Define card attributes and their types
3. Configure resource systems (mana, energy, etc.)
4. Set deck building rules
5. Define game zones (hand, battlefield, graveyard)
6. Configure turn/phase structure
7. Submit for community review or publish privately
8. Version management for game updates

### 5.2 API Endpoints

```typescript
// Game CRUD
POST   /api/games                    // Create new game
GET    /api/games                    // List all games
GET    /api/games/:id                // Get game details
PUT    /api/games/:id                // Update game
DELETE /api/games/:id                // Delete game
POST   /api/games/:id/publish        // Publish game

// Game attributes management
GET    /api/games/:id/attributes     // List card attributes for game
POST   /api/games/:id/attributes     // Add card attribute
PUT    /api/games/:id/attributes/:attrId  // Update attribute
DELETE /api/games/:id/attributes/:attrId  // Delete attribute

// Game formats
GET    /api/games/:id/formats        // List formats for game
POST   /api/games/:id/formats        // Create format
PUT    /api/games/:id/formats/:formatId  // Update format
DELETE /api/games/:id/formats/:formatId  // Delete format
```

### 5.3 UI Workflow

```
1. Game Creator Landing
   ├─ "Create New Game" button
   └─ "My Games" list

2. Game Creation Wizard
   ├─ Step 1: Basic Info (name, description, player count)
   ├─ Step 2: Card Attributes (define schema)
   ├─ Step 3: Resources & Costs
   ├─ Step 4: Deck Rules
   ├─ Step 5: Game Mechanics
   └─ Step 6: Review & Publish

3. Game Management Dashboard
   ├─ Edit game metadata
   ├─ Manage card attributes
   ├─ View analytics (players, games played)
   ├─ Moderate submitted cards (if public)
   └─ Version management
```

---

## 6. Universal Card Recognition Service Refactor

### 6.1 Architecture Changes

**Current**: Single service hardcoded to Scryfall API

**Proposed**: Plugin-based architecture with game adapters

```typescript
// Service interface
interface ICardProvider {
  searchCards(query: string, options: any): Promise<CardSearchResult>;
  getCardById(id: string): Promise<Card>;
  getCardByName(name: string): Promise<Card>;
  autocomplete(partial: string): Promise<string[]>;
}

// Adapter implementations
class ScryfallAdapter implements ICardProvider { /* MTG */ }
class PokemonTCGAdapter implements ICardProvider { /* Pokemon */ }
class CustomGameAdapter implements ICardProvider { /* User-defined */ }

// Main service
class UniversalCardService {
  private providers: Map<string, ICardProvider> = new Map();
  
  async searchCards(gameId: string, query: string) {
    const provider = this.getProvider(gameId);
    return provider.searchCards(query);
  }
  
  private getProvider(gameId: string): ICardProvider {
    // Return appropriate adapter based on game
  }
}
```

### 6.2 Updated API Endpoints

```typescript
// New universal endpoints with game_id
GET /api/games/:game_id/cards/search?q={query}
GET /api/games/:game_id/cards/:id
GET /api/games/:game_id/cards/named?exact={name}
GET /api/games/:game_id/cards/autocomplete?q={partial}

// Batch operations
POST /api/games/:game_id/cards/batch-lookup
```

---

## 7. Dynamic UI Framework

### 7.1 Requirements

- Render card forms based on game schema
- Display card attributes dynamically
- Generate search filters from game attributes
- Apply game-specific themes

### 7.2 Implementation Approach

```typescript
// Dynamic form generation
interface DynamicCardForm {
  gameId: string;
  attributes: GameCardAttribute[];
}

// React component
function DynamicCardForm({ gameId }: { gameId: string }) {
  const { data: attributes } = useGameAttributes(gameId);
  
  return (
    <Form>
      {attributes.map(attr => (
        <DynamicFormField 
          key={attr.id}
          attribute={attr}
          type={attr.dataType}
          validation={attr.validationRules}
        />
      ))}
    </Form>
  );
}
```

---

## 8. API Architecture Extensions

### 8.1 Game-Scoped Routing

All game-specific operations should be scoped under `/api/games/:game_id/`

### 8.2 Middleware for Game Validation

```typescript
// Validate game exists and user has access
async function validateGameAccess(req, res, next) {
  const { game_id } = req.params;
  const game = await db.query.games.findFirst({
    where: eq(games.id, game_id)
  });
  
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  if (!game.isPublished && game.creatorId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  req.game = game;
  next();
}
```

---

## 9. Database Technology Assessment

### 9.1 PostgreSQL vs. NoSQL

**Recommendation**: **Keep PostgreSQL**

**Rationale**:
1. ✅ **JSONB support**: Provides schema flexibility comparable to NoSQL
2. ✅ **ACID transactions**: Critical for game state integrity
3. ✅ **Relationships**: Game/card/user relationships are inherently relational
4. ✅ **Indexing**: PostgreSQL can index JSONB fields efficiently
5. ✅ **Mature ecosystem**: Better tooling, ORMs, and community support
6. ✅ **Cost**: No migration cost, team already familiar
7. ✅ **Full-text search**: Built-in support for card name searches

**NoSQL Concerns**:
- ❌ Transaction complexity for game logic
- ❌ Relationship management overhead
- ❌ Migration cost and risk
- ❌ Team learning curve

### 9.2 Optimization Strategies

- Use JSONB indexes for frequently queried attributes
- Implement materialized views for complex game statistics
- Add caching layer (Redis) for hot card data
- Partition large tables (cards) by game_id

---

## 10. Machine Learning Card Recognition

### Phase 3 Consideration (Not MVP)

**Recommendation**: Defer to post-MVP, current text search sufficient for launch

**Future Architecture**:
1. Image upload endpoint
2. OCR service (Tesseract.js or Google Vision)
3. Layout detection (ML model)
4. Card matching against database
5. Confidence scoring
6. Manual override for low confidence

**Estimated Effort**: 120-200 hours (Phase 3)

---

## 11. UGC Moderation System

### 11.1 Workflow

```
1. User submits card data
   ↓
2. Automated checks (spam detection, duplicate check)
   ↓
3. Community peer review (upvotes/downvotes)
   ↓
4. Moderator review queue (if enabled for game)
   ↓
5. Approval/Rejection
   ↓
6. Card published to game database
```

### 11.2 API Endpoints

```typescript
POST   /api/games/:game_id/cards/submit      // Submit card
GET    /api/games/:game_id/submissions       // List submissions
PUT    /api/games/:game_id/submissions/:id   // Update submission
POST   /api/games/:game_id/submissions/:id/vote  // Peer review vote
POST   /api/games/:game_id/submissions/:id/approve  // Moderator approve
POST   /api/games/:game_id/submissions/:id/reject   // Moderator reject
```

### 11.3 Moderation Rules

- Require minimum reputation score to submit
- Auto-approve submissions from trusted users
- Flag suspicious patterns (rapid submissions, duplicates)
- Peer review threshold: 5 upvotes for auto-approval
- Moderator override always available

---

## 12. Metrics and Analytics

### 12.1 Required Metrics

**Game Creation Metrics**:
- Total games created
- Games published vs. draft
- Official vs. community games
- Average time to publish
- Games by category/genre

**Card Data Metrics**:
- Total cards across all games
- Cards per game
- Community submissions count
- Approval rate
- Top contributors

**Community Participation**:
- Active game creators
- Card data contributors
- Moderators active
- Peer reviews submitted
- User adoption rate per game

**Session Engagement**:
- Games played per game definition
- Average session duration per game
- Player retention rate
- Format popularity

### 12.2 Analytics Tables

```typescript
export const gameAnalytics = pgTable("game_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameId: varchar("game_id").references(() => games.id),
  date: date("date").notNull(),
  
  // Daily metrics
  sessionsStarted: integer("sessions_started").default(0),
  uniquePlayers: integer("unique_players").default(0),
  totalPlaytime: integer("total_playtime").default(0), // minutes
  cardsSearched: integer("cards_searched").default(0),
  cardsAdded: integer("cards_added").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_game_analytics_game_date").on(table.gameId, table.date),
  unique().on(table.gameId, table.date),
]);
```

---

## 13. Implementation Roadmap

### Phase 1: Foundation (4-6 weeks)

**Priority**: Critical

1. **Database Schema** (2 weeks)
   - [ ] Add `games` table
   - [ ] Add `cards` universal table
   - [ ] Add `gameCardAttributes` table
   - [ ] Add `gameFormats` table
   - [ ] Add `cardSubmissions` table
   - [ ] Add `gameAnalytics` table
   - [ ] Create migration scripts
   - [ ] Update schema types

2. **Game Creator API** (2 weeks)
   - [ ] Implement game CRUD endpoints
   - [ ] Add game attributes management
   - [ ] Add format management
   - [ ] Add validation middleware
   - [ ] Write API tests

3. **Universal Card Service** (1 week)
   - [ ] Refactor service to adapter pattern
   - [ ] Update card endpoints with game_id
   - [ ] Migrate existing MTG adapter
   - [ ] Add custom game adapter

4. **Documentation** (1 week)
   - [ ] API documentation for new endpoints
   - [ ] Game Creator user guide
   - [ ] Schema documentation
   - [ ] Migration guide

### Phase 2: Game Creator UI (3-4 weeks)

**Priority**: High

1. **Frontend Components** (2 weeks)
   - [ ] Game creation wizard
   - [ ] Attribute builder interface
   - [ ] Format editor
   - [ ] Game management dashboard

2. **Dynamic Forms** (1 week)
   - [ ] Dynamic card form generator
   - [ ] Attribute-based validation
   - [ ] Game-specific UI theming

3. **Testing** (1 week)
   - [ ] E2E tests for game creation
   - [ ] Component tests
   - [ ] Integration tests

### Phase 3: UGC & Moderation (2-3 weeks)

**Priority**: High

1. **Card Submission System** (1 week)
   - [ ] Submission API
   - [ ] Submission UI
   - [ ] Duplicate detection

2. **Moderation Workflow** (1 week)
   - [ ] Moderation queue
   - [ ] Peer review system
   - [ ] Approval workflow

3. **Analytics** (1 week)
   - [ ] Metrics collection
   - [ ] Analytics dashboard
   - [ ] Reporting API

### Phase 4: Enhancements (3-4 weeks)

**Priority**: Medium

1. **Advanced Features**
   - [ ] Game versioning
   - [ ] Card import/export
   - [ ] Bulk operations
   - [ ] Advanced search filters

2. **Performance Optimization**
   - [ ] Caching strategy
   - [ ] Database indexes
   - [ ] Query optimization

3. **ML/OCR (Future)**
   - [ ] Research OCR integration
   - [ ] Proof of concept
   - [ ] Training data collection

---

## 14. Migration Strategy

### 14.1 Backward Compatibility

**Existing MTG Card System**:
- Create official "Magic: The Gathering" game entry
- Migrate existing MTG community to use new game entry
- Keep existing `/api/cards/*` endpoints for backward compatibility
- Add deprecation warnings to old endpoints

### 14.2 Data Migration

```sql
-- Step 1: Create official MTG game
INSERT INTO games (id, name, display_name, is_official, is_published)
VALUES ('mtg-official', 'mtg', 'Magic: The Gathering', true, true);

-- Step 2: Define MTG card attributes
INSERT INTO game_card_attributes (game_id, attribute_name, display_name, data_type)
VALUES 
  ('mtg-official', 'mana_cost', 'Mana Cost', 'string'),
  ('mtg-official', 'cmc', 'Converted Mana Cost', 'integer'),
  ('mtg-official', 'power', 'Power', 'string'),
  ('mtg-official', 'toughness', 'Toughness', 'string'),
  -- ... more attributes

-- Step 3: No existing card data to migrate (cache only)
```

### 14.3 API Migration

```typescript
// Old endpoint (deprecated but functional)
GET /api/cards/search?q=lightning

// Redirects internally to:
GET /api/games/mtg-official/cards/search?q=lightning
```

---

## 15. Security Considerations

### 15.1 Game Creation

- Rate limit game creation (max 5 per user per day)
- Require email verification
- Implement spam detection
- Moderate public games before visibility

### 15.2 Card Submissions

- Rate limit submissions (max 50 per user per day)
- Image size limits (max 5MB)
- Content filtering (profanity, spam)
- Reputation-based throttling

### 15.3 API Security

- Game-scoped API keys
- Rate limiting per game
- CORS restrictions
- Input validation on all attributes

---

## 16. Testing Strategy

### 16.1 Unit Tests

- Game CRUD operations
- Card attribute validation
- UGC submission workflow
- Moderation logic

### 16.2 Integration Tests

- Game creation to card submission flow
- Multi-game card searches
- Format validation
- Analytics collection

### 16.3 E2E Tests

- Complete game creator workflow
- Card search across games
- UGC submission and approval
- Dynamic UI rendering

---

## 17. Success Metrics (PRD v3.0 Goals)

### 17.1 Launch Targets (3 months)

- [ ] 10+ user-created games published
- [ ] 1,000+ community-submitted cards across all games
- [ ] 100+ active game creators
- [ ] 5+ official game integrations (MTG, Pokemon, Lorcana, Yu-Gi-Oh, One Piece)
- [ ] 90%+ card submission approval rate
- [ ] <500ms API response time for card searches

### 17.2 Long-term Goals (6-12 months)

- [ ] 100+ published games
- [ ] 10,000+ cards in universal database
- [ ] 1,000+ daily active game creators
- [ ] 50,000+ game sessions using custom games
- [ ] Community-driven card database for 3+ major TCGs
- [ ] ML card recognition for top 10 games

---

## 18. Recommendations

### 18.1 Immediate Actions (Week 1-2)

1. ✅ **Complete this audit document**
2. 🔲 **Stakeholder review and approval** of proposed architecture
3. 🔲 **Prioritize Phase 1 implementation**
4. 🔲 **Assign development team** to universal framework work
5. 🔲 **Create detailed technical specifications** for each component

### 18.2 Short-term Goals (1-3 months)

1. Complete Phase 1 & 2 implementation
2. Beta test with community game creators
3. Launch with 3-5 official game integrations
4. Implement UGC moderation system
5. Collect metrics and iterate

### 18.3 Long-term Vision (3-12 months)

1. Position TableSync as **the** universal DBCG platform
2. Build network effects through community game creation
3. Establish partnerships with TCG publishers
4. Expand ML capabilities for card recognition
5. Create marketplace for premium game definitions

---

## 19. Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Community adoption slow | High | Medium | Pre-seed with official games, marketing |
| UGC quality issues | Medium | High | Strong moderation, peer review |
| Performance degradation | High | Low | Proper indexing, caching, monitoring |
| Schema complexity | Medium | Medium | Clear documentation, validation |
| Backward compatibility | Medium | Low | Careful migration, deprecation plan |
| Security vulnerabilities | High | Low | Security audits, rate limiting |

---

## 20. Conclusion

TableSync has a **strong foundation** for becoming a universal deck-building framework, with existing support for multiple communities, flexible JSONB data storage, and a working card recognition system for MTG. However, **significant work is required** to achieve full PRD v3.0 compliance.

**Current PRD v3.0 Compliance**: ~22%

**Critical Path**:
1. Database schema extensions (games, universal cards, attributes)
2. Game Creator module (API + UI)
3. Universal card recognition service refactor
4. UGC moderation system
5. Dynamic UI framework

**Estimated Total Effort**: 12-14 weeks for Phases 1-3

**Recommendation**: **Proceed with phased implementation**, starting with database schema and Game Creator API (Phase 1). This provides immediate value while building toward the full universal framework vision.

**Next Steps**:
1. Stakeholder review and approval
2. Detailed technical specifications
3. Team assignment and sprint planning
4. Begin Phase 1 implementation

---

**Document Version**: 1.0  
**Last Updated**: December 2024  
**Next Review**: After Phase 1 completion  
**Owner**: TableSync Engineering Team
