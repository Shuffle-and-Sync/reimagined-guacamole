# TableSync Universal Framework Migration Guide

**Date**: December 2024  
**Version**: 1.0  
**Status**: Ready for Implementation

---

## Overview

This guide provides step-by-step instructions for migrating TableSync to the Universal Deck-Building Framework (PRD v3.0). The migration adds support for user-defined games while maintaining backward compatibility with existing MTG card recognition features.

---

## Database Migration Strategy

### Phase 1: Schema Deployment (Week 1)

#### Step 1: Backup Production Database

```bash
# Create full database backup before migration
pg_dump $DATABASE_URL > tablesync_backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
ls -lh tablesync_backup_*.sql
```

#### Step 2: Apply Schema Changes

The new schema has been added to `shared/schema.ts`. Apply it using Drizzle:

```bash
# Generate migration
npm run db:generate

# Review migration SQL
cat migrations/XXXX_add_universal_framework_tables.sql

# Apply to development database
npm run db:push

# Test in development
npm run dev
```

#### Step 3: Verify Schema

```sql
-- Verify new tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'games',
  'cards',
  'game_card_attributes',
  'game_formats',
  'card_submissions',
  'game_analytics'
);

-- Should return 6 rows
```

---

## Data Migration

### Phase 2: Seed Official Games (Week 1)

Create entries for officially supported games to maintain backward compatibility.

#### Seed Magic: The Gathering

```typescript
// migrations/seed-official-games.ts
import { db } from "@shared/database-unified";
import { games, gameCardAttributes } from "@shared/schema";

async function seedOfficialGames() {
  // 1. Create Magic: The Gathering game
  const mtgGame = await db
    .insert(games)
    .values({
      id: "mtg-official",
      name: "mtg",
      displayName: "Magic: The Gathering",
      description: "The original trading card game by Wizards of the Coast",
      creatorId: "system", // System user
      isOfficial: true,
      isPublished: true,
      version: "1.0.0",
      playerCount: { min: 2, max: 4 },
      avgGameDuration: 30,
      complexity: 4,
      ageRating: "13+",
      cardTypes: [
        "Creature",
        "Instant",
        "Sorcery",
        "Enchantment",
        "Artifact",
        "Planeswalker",
        "Land",
        "Battle",
      ],
      resourceTypes: [
        {
          name: "Mana",
          colors: ["White", "Blue", "Black", "Red", "Green", "Colorless"],
        },
      ],
      zones: [
        "Library",
        "Hand",
        "Battlefield",
        "Graveyard",
        "Exile",
        "Command Zone",
      ],
      phaseStructure: [
        "Untap",
        "Upkeep",
        "Draw",
        "Main Phase 1",
        "Combat",
        "Main Phase 2",
        "End",
      ],
      deckRules: {
        minDeckSize: 60,
        maxDeckSize: null,
        maxCopies: 4,
        allowedSets: null,
      },
      theme: {
        primaryColor: "#0e141b",
        accentColor: "#ffd700",
        cardBackUrl: null,
      },
      moderationStatus: "approved",
    })
    .returning();

  // 2. Define MTG card attributes
  const mtgAttributes = [
    {
      gameId: "mtg-official",
      attributeName: "mana_cost",
      displayName: "Mana Cost",
      dataType: "string",
      isRequired: false,
      category: "costs",
      displayOrder: 1,
      helpText: "The mana cost to cast this card (e.g., {2}{R}{G})",
    },
    {
      gameId: "mtg-official",
      attributeName: "cmc",
      displayName: "Mana Value",
      dataType: "integer",
      isRequired: false,
      category: "costs",
      displayOrder: 2,
      helpText: "Converted mana cost (total mana required)",
      validationRules: { min: 0, max: 20 },
    },
    {
      gameId: "mtg-official",
      attributeName: "type_line",
      displayName: "Type Line",
      dataType: "string",
      isRequired: true,
      category: "stats",
      displayOrder: 3,
      helpText: "Card types and subtypes (e.g., Creature - Dragon)",
    },
    {
      gameId: "mtg-official",
      attributeName: "oracle_text",
      displayName: "Oracle Text",
      dataType: "string",
      isRequired: false,
      category: "mechanics",
      displayOrder: 4,
      helpText: "The official rules text of the card",
    },
    {
      gameId: "mtg-official",
      attributeName: "power",
      displayName: "Power",
      dataType: "string",
      isRequired: false,
      category: "stats",
      displayOrder: 5,
      helpText: "Creature power (for creatures only)",
    },
    {
      gameId: "mtg-official",
      attributeName: "toughness",
      displayName: "Toughness",
      dataType: "string",
      isRequired: false,
      category: "stats",
      displayOrder: 6,
      helpText: "Creature toughness (for creatures only)",
    },
    {
      gameId: "mtg-official",
      attributeName: "loyalty",
      displayName: "Loyalty",
      dataType: "string",
      isRequired: false,
      category: "stats",
      displayOrder: 7,
      helpText: "Planeswalker loyalty (for planeswalkers only)",
    },
    {
      gameId: "mtg-official",
      attributeName: "colors",
      displayName: "Colors",
      dataType: "array",
      isRequired: false,
      category: "stats",
      displayOrder: 8,
      helpText: "Card colors (W, U, B, R, G)",
    },
    {
      gameId: "mtg-official",
      attributeName: "color_identity",
      displayName: "Color Identity",
      dataType: "array",
      isRequired: false,
      category: "stats",
      displayOrder: 9,
      helpText: "Color identity for Commander format",
    },
    {
      gameId: "mtg-official",
      attributeName: "rarity",
      displayName: "Rarity",
      dataType: "string",
      isRequired: true,
      category: "stats",
      displayOrder: 10,
      helpText: "Card rarity (common, uncommon, rare, mythic)",
    },
  ];

  await db.insert(gameCardAttributes).values(mtgAttributes);

  console.log("✅ Magic: The Gathering game seeded successfully");
}

// Run the seed
seedOfficialGames().catch(console.error);
```

#### Seed Other Official Games

```typescript
// Add Pokemon, Lorcana, Yu-Gi-Oh, One Piece TCG
const pokemonGame = {
  id: "pokemon-official",
  name: "pokemon",
  displayName: "Pokemon TCG",
  description: "The Pokemon Trading Card Game",
  creatorId: "system",
  isOfficial: true,
  isPublished: true,
  // ... similar structure
};

const lorcanaGame = {
  id: "lorcana-official",
  name: "lorcana",
  displayName: "Disney Lorcana",
  description: "Disney Lorcana Trading Card Game",
  creatorId: "system",
  isOfficial: true,
  isPublished: true,
  // ... similar structure
};

// And so on...
```

---

## API Migration

### Phase 3: Update Card Recognition Service (Week 2)

#### Current Structure

```
server/services/card-recognition.ts (MTG-only)
server/features/cards/cards.routes.ts (MTG-only)
```

#### New Structure

```
server/services/card-recognition/
├── index.ts                    // Main service
├── adapters/
│   ├── scryfall.adapter.ts     // MTG via Scryfall
│   ├── pokemon.adapter.ts      // Pokemon TCG
│   ├── custom.adapter.ts       // User-defined games
│   └── base.adapter.ts         // Interface
└── types.ts                    // Shared types
```

#### Backward Compatibility

Keep existing endpoints working:

```typescript
// OLD (deprecated but functional)
GET /api/cards/search?q=lightning
// Internally redirects to:
GET /api/games/mtg-official/cards/search?q=lightning

// NEW (preferred)
GET /api/games/:game_id/cards/search?q=lightning
```

---

## Code Migration Examples

### Before: MTG-Specific Service

```typescript
// server/services/card-recognition.ts
export interface MtgCard {
  id: string;
  name: string;
  manaCost?: string;
  typeLine: string;
  // ... MTG-specific fields
}

class CardRecognitionService {
  async searchCards(query: string): Promise<MtgCard[]> {
    // Hardcoded Scryfall API
  }
}
```

### After: Universal Service

```typescript
// server/services/card-recognition/index.ts
export interface UniversalCard {
  id: string;
  gameId: string;
  name: string;
  attributes: Record<string, any>; // Flexible attributes
  imageUris?: Record<string, string>;
  // ... game-agnostic fields
}

interface ICardAdapter {
  searchCards(query: string, options?: any): Promise<UniversalCard[]>;
  getCardById(id: string): Promise<UniversalCard | null>;
}

class UniversalCardService {
  private adapters = new Map<string, ICardAdapter>();

  async searchCards(gameId: string, query: string): Promise<UniversalCard[]> {
    const adapter = this.getAdapter(gameId);
    return adapter.searchCards(query);
  }

  private getAdapter(gameId: string): ICardAdapter {
    // Return appropriate adapter based on game
    if (this.adapters.has(gameId)) {
      return this.adapters.get(gameId)!;
    }

    // Load adapter based on game configuration
    const game = await db.query.games.findFirst({
      where: eq(games.id, gameId),
    });

    if (!game) throw new Error("Game not found");

    if (game.externalSource === "scryfall") {
      return new ScryfallAdapter();
    } else if (game.externalSource === "pokemontcg") {
      return new PokemonAdapter();
    } else {
      return new CustomGameAdapter(gameId);
    }
  }
}
```

---

## Testing Strategy

### Unit Tests

```typescript
// server/tests/services/universal-card-service.test.ts
describe("UniversalCardService", () => {
  it("should search MTG cards via Scryfall adapter", async () => {
    const service = new UniversalCardService();
    const results = await service.searchCards("mtg-official", "Lightning Bolt");
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Lightning Bolt");
  });

  it("should search custom game cards from database", async () => {
    // Create custom game and cards
    const game = await createTestGame();
    await createTestCard(game.id, "Test Card");

    const service = new UniversalCardService();
    const results = await service.searchCards(game.id, "Test Card");
    expect(results).toHaveLength(1);
  });

  it("should maintain backward compatibility with old endpoints", async () => {
    const response = await request(app).get("/api/cards/search?q=bolt");
    expect(response.status).toBe(200);
    // Should work as before
  });
});
```

---

## Frontend Migration

### Update API Calls

```typescript
// Before
const { data } = await fetch("/api/cards/search?q=lightning");

// After
const gameId = "mtg-official"; // or from user selection
const { data } = await fetch(`/api/games/${gameId}/cards/search?q=lightning`);
```

### Dynamic UI Updates

```typescript
// Load game schema dynamically
const { data: gameSchema } = useQuery({
  queryKey: ['game-schema', gameId],
  queryFn: () => fetch(`/api/games/${gameId}/attributes`).then(r => r.json())
});

// Render form fields based on schema
<DynamicCardForm schema={gameSchema} />
```

---

## Rollback Plan

If issues arise, rollback is straightforward since new tables don't affect existing functionality:

```sql
-- Rollback: Drop new tables (doesn't affect existing features)
DROP TABLE IF EXISTS game_analytics CASCADE;
DROP TABLE IF EXISTS card_submissions CASCADE;
DROP TABLE IF EXISTS game_formats CASCADE;
DROP TABLE IF EXISTS game_card_attributes CASCADE;
DROP TABLE IF EXISTS cards CASCADE;
DROP TABLE IF EXISTS games CASCADE;
```

---

## Performance Considerations

### Indexing Strategy

All necessary indexes are defined in the schema:

```sql
-- Games table indexes
CREATE INDEX idx_games_creator_id ON games(creator_id);
CREATE INDEX idx_games_published ON games(is_published);
CREATE INDEX idx_games_official ON games(is_official);

-- Cards table indexes
CREATE INDEX idx_cards_game_id ON cards(game_id);
CREATE INDEX idx_cards_name ON cards(name);
CREATE INDEX idx_cards_name_tsvector ON cards USING GIN (to_tsvector('english', name));
```

### Caching Strategy

```typescript
// Cache game definitions (rarely change)
const GAME_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Cache card data (update frequently)
const CARD_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

// Cache search results (short TTL)
const SEARCH_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
```

---

## Monitoring

### Key Metrics to Track

1. **Game Creation Rate**: New games created per day
2. **Card Submission Rate**: Community card submissions per day
3. **API Performance**: Response times for game-specific endpoints
4. **Cache Hit Rate**: Effectiveness of caching strategy
5. **Database Load**: Query performance on new tables

### Alerts

Set up monitoring for:

- Slow queries on `cards` table (>500ms)
- High rejection rate for card submissions (>50%)
- Game creation failures
- Schema validation errors

---

## Security Checklist

- [ ] Rate limit game creation (5 games per user per day)
- [ ] Rate limit card submissions (50 per user per day)
- [ ] Validate all card attributes against game schema
- [ ] Sanitize user-submitted game descriptions
- [ ] Implement content filtering for card names
- [ ] Require email verification for game creators
- [ ] Add CAPTCHA for public game submissions
- [ ] Audit log for all game modifications

---

## Timeline

### Week 1: Database & Seed Data

- Deploy schema changes
- Seed official games (MTG, Pokemon, Lorcana, etc.)
- Verify data integrity

### Week 2: API Refactoring

- Implement universal card service
- Add game-scoped endpoints
- Maintain backward compatibility

### Week 3: Frontend Updates

- Update API calls to use game_id
- Implement dynamic forms
- Add game selection UI

### Week 4: Testing & Launch

- Comprehensive testing
- Performance optimization
- Beta launch with community game creators

---

## Success Criteria

- ✅ All existing MTG card searches work without changes
- ✅ New games can be created via API
- ✅ Card searches work for all official games
- ✅ Response times <500ms for card searches
- ✅ No production downtime during migration
- ✅ TypeScript compilation passes
- ✅ All tests pass

---

## Next Steps

1. **Review this migration guide** with the team
2. **Schedule migration window** (recommend off-peak hours)
3. **Test in staging environment** first
4. **Create database backup** before production deployment
5. **Deploy schema changes** to production
6. **Run seed scripts** for official games
7. **Monitor performance** for 48 hours post-migration
8. **Announce new feature** to community

---

## Support

For issues or questions during migration:

- Check audit document: `TABLESYNC_UNIVERSAL_FRAMEWORK_AUDIT.md`
- Review schema: `shared/schema.ts`
- Contact: TableSync Engineering Team

---

**Document Version**: 1.0  
**Last Updated**: December 2024  
**Owner**: TableSync Engineering Team
