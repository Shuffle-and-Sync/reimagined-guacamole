# Universal Deck-Building API Documentation

## Overview

The Universal Deck-Building API provides a flexible framework for managing multiple trading card games within the Shuffle & Sync platform. It introduces game-scoped card operations and maintains backward compatibility with existing MTG-focused endpoints.

## Architecture

### Adapter Pattern

The card service uses the adapter pattern to support multiple card sources:

- **Scryfall Adapter**: For Magic: The Gathering via Scryfall API
- **Pokemon TCG Adapter**: For Pokemon via Pokemon TCG API
- **Yu-Gi-Oh Adapter**: For Yu-Gi-Oh via YGOPRODeck API
- **Custom Game Adapter**: For user-defined games with database-backed cards
- **Future Adapters**: Additional games can be easily added

### Components

1. **Game Service** (`server/services/games/game.service.ts`)
   - Manages user-defined games
   - Handles game CRUD operations
   - Validates ownership and permissions

2. **Universal Card Service** (`server/services/card-recognition/index.ts`)
   - Routes requests to appropriate adapters
   - Manages adapter registry and caching
   - Provides uniform interface for all card operations

3. **Adapters** (`server/services/card-recognition/adapters/`)
   - Base interface defining contract
   - Scryfall adapter for MTG
   - Pokemon TCG adapter for Pokemon
   - Yu-Gi-Oh adapter for Yu-Gi-Oh
   - Custom adapter for database-backed cards

## API Endpoints

### Game Management

#### Create Game

```http
POST /api/games
Authorization: Required

Request Body:
{
  "name": "my-custom-game",
  "displayName": "My Custom Game",
  "description": "A custom trading card game",
  "playerCount": { "min": 2, "max": 4 },
  "complexity": 3,
  "cardTypes": ["Creature", "Spell", "Artifact"],
  "deckRules": {
    "minDeckSize": 40,
    "maxDeckSize": 60,
    "maxCopies": 3
  }
}

Response: 201 Created
{
  "id": "uuid",
  "name": "my-custom-game",
  "displayName": "My Custom Game",
  "creatorId": "user_id",
  "isPublished": false,
  ...
}
```

#### List Games

```http
GET /api/games?published=true&official=false

Response: 200 OK
[
  { "id": "...", "name": "...", ... }
]
```

#### Get Game

```http
GET /api/games/:id

Response: 200 OK
{
  "id": "uuid",
  "name": "my-custom-game",
  ...
}
```

#### Update Game

```http
PUT /api/games/:id
Authorization: Required (must be creator)

Request Body:
{
  "displayName": "Updated Name",
  "description": "Updated description"
}

Response: 200 OK
```

#### Delete Game

```http
DELETE /api/games/:id
Authorization: Required (must be creator)

Response: 200 OK
{ "success": true }
```

#### Publish Game

```http
POST /api/games/:id/publish
Authorization: Required (must be creator)

Response: 200 OK
{
  "id": "uuid",
  "isPublished": true,
  ...
}
```

#### Get Game Stats

```http
GET /api/games/:id/stats

Response: 200 OK
{
  "totalCards": 150,
  "totalPlayers": 42,
  "totalGamesPlayed": 128
}
```

### Game-Scoped Card Operations

All card endpoints now support game-specific contexts via the `game_id` parameter.

#### Search Cards

```http
GET /api/games/:game_id/cards/search?q=dragon&limit=20

Response: 200 OK
{
  "cards": [
    {
      "id": "card_id",
      "gameId": "game_id",
      "name": "Dragon Whelp",
      "attributes": { ... },
      "imageUris": { ... }
    }
  ],
  "total": 45,
  "page": 1,
  "hasMore": true
}
```

#### Get Card by ID

```http
GET /api/games/:game_id/cards/:card_id

Response: 200 OK
{
  "id": "card_id",
  "gameId": "game_id",
  "name": "Lightning Bolt",
  "attributes": { ... }
}
```

#### Get Card by Name

```http
GET /api/games/:game_id/cards/named?exact=Lightning+Bolt

Response: 200 OK
{
  "id": "card_id",
  "gameId": "game_id",
  "name": "Lightning Bolt",
  ...
}
```

#### Autocomplete

```http
GET /api/games/:game_id/cards/autocomplete?q=light&limit=10

Response: 200 OK
{
  "suggestions": [
    { "id": "...", "name": "Lightning Bolt" },
    { "id": "...", "name": "Light of Hope" }
  ]
}
```

#### Random Card

```http
GET /api/games/:game_id/cards/random?format=commander

Response: 200 OK
{
  "id": "card_id",
  "gameId": "game_id",
  "name": "Random Card",
  ...
}
```

### Legacy Card Endpoints (Deprecated)

The following endpoints are maintained for backward compatibility but are deprecated. They internally redirect to the MTG Official game.

All responses include a deprecation warning:

```json
{
  "cards": [...],
  "_deprecated": {
    "message": "This endpoint is deprecated. Please use /api/games/:game_id/cards/* endpoints instead.",
    "migrationGuide": "https://docs.shuffleandsync.org/api/migration-guide",
    "newEndpoint": "/api/games/mtg-official/cards/"
  }
}
```

- `GET /api/cards/search` → Redirects to `GET /api/games/mtg-official/cards/search`
- `GET /api/cards/:id` → Redirects to `GET /api/games/mtg-official/cards/:id`
- `GET /api/cards/named` → Redirects to `GET /api/games/mtg-official/cards/named`
- `GET /api/cards/autocomplete` → Redirects to `GET /api/games/mtg-official/cards/autocomplete`
- `GET /api/cards/random` → Redirects to `GET /api/games/mtg-official/cards/random`

## Universal Card Format

All cards, regardless of source, are transformed into a universal format:

```typescript
interface UniversalCard {
  id: string;
  gameId: string;
  name: string;

  // Core identifiers
  setCode?: string;
  setName?: string;
  collectorNumber?: string;
  rarity?: string;

  // External references
  externalId?: string;
  externalSource?: string;

  // Flexible attributes for game-specific data
  attributes: Record<string, any>;

  // Visual data
  imageUris?: Record<string, string>;

  // Metadata
  isOfficial?: boolean;
  isCommunitySubmitted?: boolean;
}
```

## Migration Guide

### For Existing MTG Integrations

**Old Code:**

```typescript
// Search MTG cards
const response = await fetch("/api/cards/search?q=lightning");
const data = await response.json();
```

**New Code:**

```typescript
// Search MTG cards (recommended)
const response = await fetch(
  "/api/games/mtg-official/cards/search?q=lightning",
);
const data = await response.json();

// Or continue using legacy endpoint (with deprecation warning)
const response = await fetch("/api/cards/search?q=lightning");
const data = await response.json();
// data._deprecated contains migration information
```

### For New Game Integrations

1. **Create a game:**

```typescript
const gameResponse = await fetch("/api/games", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "my-game",
    displayName: "My Game",
    cardTypes: ["Unit", "Spell"],
    // ...
  }),
});
const game = await gameResponse.json();
```

2. **Use game-scoped endpoints:**

```typescript
const cardsResponse = await fetch(
  `/api/games/${game.id}/cards/search?q=dragon`,
);
const cards = await cardsResponse.json();
```

## Error Handling

All endpoints return standard HTTP status codes:

- `200 OK` - Success
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

Error Response Format:

```json
{
  "message": "Error description",
  "errors": [
    /* validation errors if applicable */
  ]
}
```

## Security

- **Authentication**: Required for game creation, updates, and deletion
- **Authorization**: Only game creators can modify or delete their games
- **Validation**: All inputs are validated using Zod schemas
- **Rate Limiting**: Standard rate limits apply to all endpoints

## Best Practices

1. **Use game-scoped endpoints** for new integrations
2. **Handle deprecation warnings** in legacy endpoint responses
3. **Validate game existence** before performing card operations
4. **Cache adapter instances** are managed automatically by the service
5. **Use appropriate error handling** for all API calls

## Example Use Cases

### Creating a Custom Game with Cards

```typescript
// 1. Create the game
const game = await createGame({
  name: "fantasy-battles",
  displayName: "Fantasy Battles TCG",
  cardTypes: ["Hero", "Spell", "Item"],
  deckRules: { minDeckSize: 30, maxCopies: 2 },
});

// 2. Add cards to the database (separate endpoint needed)
// Cards are stored in the 'cards' table with gameId

// 3. Search cards for this game
const cards = await searchCards(game.id, "dragon");

// 4. Publish the game when ready
await publishGame(game.id);
```

### Integrating Multiple Games

```typescript
// List all published games
const games = await fetch("/api/games?published=true").then((r) => r.json());

// Search cards across different games
for (const game of games) {
  const cards = await fetch(`/api/games/${game.id}/cards/search?q=bolt`).then(
    (r) => r.json(),
  );
  console.log(`${game.displayName}: ${cards.total} results`);
}
```

## Technical Details

### Adapter Selection Logic

The Universal Card Service automatically selects the appropriate adapter:

1. For `mtg-official` game ID → Scryfall Adapter
2. For all other games → Custom Game Adapter (database-backed)
3. Adapters are cached after first use for performance

### Database Schema

Games and cards use the existing schema:

- `games` table: Stores game definitions
- `cards` table: Stores cards with `gameId` foreign key
- `game_card_attributes` table: Defines custom attributes per game

### Performance Considerations

- Adapter instances are cached per game
- Database queries are optimized with indexes
- Scryfall API calls are rate-limited (10 req/sec)
- In-memory caching for frequently accessed cards (MTG only)

## Support

For issues or questions:

- Check the [main API documentation](../API_DOCUMENTATION.md)
- Review the [migration guide](../TABLESYNC_UNIVERSAL_FRAMEWORK_MIGRATION.md)
- See the [roadmap](../TABLESYNC_UNIVERSAL_FRAMEWORK_ROADMAP.md)
