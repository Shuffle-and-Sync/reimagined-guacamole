# Games and Cards Tables Documentation

This document describes the `games` and `cards` tables added to the database schema.

## Overview

Two new tables have been added to support card management and game-specific logic:

- **games**: Stores information about TCG games (Magic: The Gathering, Pokemon, etc.)
- **cards**: Stores individual trading card information with references to their games

## Games Table

The `games` table stores information about the various trading card games supported by the platform.

### Schema

| Column      | Type      | Constraints      | Description                                   |
| ----------- | --------- | ---------------- | --------------------------------------------- |
| id          | text      | PRIMARY KEY      | UUID identifier                               |
| name        | text      | NOT NULL, UNIQUE | Full game name (e.g., "Magic: The Gathering") |
| code        | text      | NOT NULL, UNIQUE | Short code (e.g., "MTG", "POKEMON")           |
| description | text      | NULL             | Optional game description                     |
| isActive    | boolean   | DEFAULT true     | Whether the game is actively supported        |
| createdAt   | timestamp | NOT NULL         | Creation timestamp                            |
| updatedAt   | timestamp | NOT NULL         | Last update timestamp                         |

### Indexes

- `idx_games_name` on name
- `idx_games_code` on code
- `idx_games_active` on isActive

### Example Usage

```typescript
import { db } from "../shared/database-unified";
import { games, insertGameSchema } from "../shared/schema";

// Insert a new game
const newGame = insertGameSchema.parse({
  name: "Magic: The Gathering",
  code: "MTG",
  description: "A popular fantasy trading card game",
  isActive: true,
});

await db.insert(games).values(newGame);

// Query games
const activeGames = await db
  .select()
  .from(games)
  .where(eq(games.isActive, true));
```

## Cards Table

The `cards` table stores individual trading card information with a foreign key relationship to the games table.

### Schema

| Column    | Type      | Constraints  | Description                                        |
| --------- | --------- | ------------ | -------------------------------------------------- |
| id        | text      | PRIMARY KEY  | UUID identifier                                    |
| name      | text      | NOT NULL     | Card name                                          |
| gameId    | text      | NOT NULL, FK | Foreign key to games.id                            |
| type      | text      | NULL         | Card type (e.g., "Creature", "Instant", "Trainer") |
| rarity    | text      | NULL         | Card rarity (e.g., "Common", "Rare", "Mythic")     |
| setCode   | text      | NULL         | Set/expansion code                                 |
| setName   | text      | NULL         | Set/expansion name                                 |
| imageUrl  | text      | NULL         | Optional URL to card image                         |
| metadata  | text      | NULL         | JSON string for game-specific properties           |
| createdAt | timestamp | NOT NULL     | Creation timestamp                                 |
| updatedAt | timestamp | NOT NULL     | Last update timestamp                              |

### Foreign Keys

- `gameId` → `games.id` (CASCADE DELETE)

### Indexes

- `idx_cards_game` on gameId
- `idx_cards_name` on name
- `idx_cards_set_code` on setCode
- `idx_cards_game_name` on (gameId, name)

### Example Usage

```typescript
import { db } from "../shared/database-unified";
import { cards, insertCardSchema } from "../shared/schema";

// Insert a new card
const newCard = insertCardSchema.parse({
  name: "Black Lotus",
  gameId: "mtg-game-id",
  type: "Artifact",
  rarity: "Rare",
  setCode: "LEA",
  setName: "Limited Edition Alpha",
  imageUrl: "https://example.com/black-lotus.jpg",
  metadata: JSON.stringify({
    power: 0,
    toughness: 0,
    manaCost: "0",
    colors: [],
  }),
});

await db.insert(cards).values(newCard);

// Query cards by game
const mtgCards = await db
  .select()
  .from(cards)
  .where(eq(cards.gameId, "mtg-game-id"))
  .limit(10);

// Query cards by name
const cardByName = await db
  .select()
  .from(cards)
  .where(eq(cards.name, "Black Lotus"))
  .get();
```

## Migration

To apply these schema changes to your database:

```bash
npm run db:push
```

This will create the new tables in your database with all indexes and constraints.

## Type Safety

Both tables have full TypeScript support:

```typescript
import {
  Game,
  Card, // Select types
  InsertGame,
  InsertCard, // Insert types with validation
} from "../shared/schema";

// Type-safe game object
const game: Game = {
  id: "uuid",
  name: "Magic: The Gathering",
  code: "MTG",
  description: "A fantasy TCG",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Validated insert
const newGame: InsertGame = {
  name: "Pokemon",
  code: "POKEMON", // Will be converted to uppercase
  isActive: true,
};
```

## Validation

Zod schemas provide runtime validation:

- **Game validation**:
  - `name`: 1-100 characters, required
  - `code`: 1-20 characters, required, converted to uppercase
- **Card validation**:
  - `name`: 1-200 characters, required
  - `gameId`: Required
  - `type`, `rarity`, `setCode`, `setName`: Optional with length limits
  - `imageUrl`: Optional, must be valid URL format
  - `metadata`: Optional JSON string

## Future Enhancements

These tables support future features such as:

- Card collection management
- Deck building tools
- Card trading and marketplace
- Game-specific rules and formats
- Set/expansion tracking
- Card image galleries
- Advanced search and filtering
