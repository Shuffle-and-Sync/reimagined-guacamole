# TableSync Card Recognition - Game Seeding Guide

## Overview

The TableSync Universal Card Recognition system requires official game definitions to be seeded in the database. This guide explains how to seed games and verify the seeding process.

## Prerequisites

- Database connection (SQLite Cloud or local SQLite)
- Node.js 18+ installed
- npm dependencies installed

## Seeding Official Games

The system includes seed data for 4 official trading card games:

1. **Magic: The Gathering** (MTG)
2. **Pokemon Trading Card Game** (POKEMON)
3. **Yu-Gi-Oh! Trading Card Game** (YUGIOH)
4. **Disney Lorcana** (LORCANA)

### Running the Seed Script

```bash
# Seed games to database
npm run db:seed-games
```

### What the Script Does

The seed script (`scripts/seed-games.ts`) is **idempotent**, meaning it can be run multiple times safely:

- **Creates** new games that don't exist
- **Updates** existing games if their data has changed
- **Skips** games that are already up-to-date
- **Verifies** all games after seeding

### Example Output

```
🎮 Starting official games seeding...

  ✅ Created: Magic: The Gathering (MTG)
  ✅ Created: Pokemon Trading Card Game (POKEMON)
  ✅ Created: Yu-Gi-Oh! Trading Card Game (YUGIOH)
  ✅ Created: Disney Lorcana (LORCANA)

📊 Seeding Summary:
  ✨ Games created: 4
  ✏️  Games updated: 0
  ⏭️  Games skipped: 0
  📦 Total games: 4

🔍 Verifying seeded games...
  ✅ Found 4 game(s) in database:
     - Magic: The Gathering (MTG) - Active
     - Pokemon Trading Card Game (POKEMON) - Active
     - Yu-Gi-Oh! Trading Card Game (YUGIOH) - Active
     - Disney Lorcana (LORCANA) - Active

✅ Official games seeding completed successfully!
```

## Game Data Structure

Each seeded game includes:

```typescript
{
  name: string; // Full game name
  code: string; // Short code (MTG, POKEMON, YUGIOH, LORCANA)
  description: string; // Game description
  isActive: boolean; // Whether game is active (true for all official games)
  createdAt: Date; // Auto-generated
  updatedAt: Date; // Auto-generated
  id: string; // Auto-generated UUID
}
```

## Using Seeded Games

### Game Identification

Games can be identified by either:

1. **Database ID** (UUID): `"550e8400-e29b-41d4-a716-446655440000"`
2. **Game Code**: `"MTG"`, `"POKEMON"`, `"YUGIOH"`, `"LORCANA"`
3. **Legacy IDs** (for backward compatibility): `"mtg-official"`, `"pokemon-tcg"`, `"yugioh-tcg"`

### API Endpoints

#### List All Supported Games

```bash
GET /api/games
```

Response:

```json
{
  "games": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Magic: The Gathering",
      "code": "MTG"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Pokemon Trading Card Game",
      "code": "POKEMON"
    }
  ],
  "count": 2
}
```

#### Search Cards in a Game

```bash
# By game code
GET /api/games/MTG/cards/search?q=lightning+bolt

# By legacy ID (backward compatible)
GET /api/games/mtg-official/cards/search?q=lightning+bolt

# By database ID
GET /api/games/550e8400-e29b-41d4-a716-446655440000/cards/search?q=lightning+bolt
```

## Verification

### Database Queries

Check seeded games directly in the database:

```sql
SELECT id, name, code, is_active, created_at, updated_at
FROM games
WHERE is_active = true
ORDER BY name;
```

### API Verification

```bash
# Check if games endpoint works
curl http://localhost:3000/api/games

# Test card search for MTG
curl "http://localhost:3000/api/games/MTG/cards/search?q=lightning"

# Test card search for Pokemon
curl "http://localhost:3000/api/games/POKEMON/cards/search?q=pikachu"
```

## Troubleshooting

### Error: Database Connection Failed

**Problem**: Script cannot connect to database.

**Solution**:

1. Verify `DATABASE_URL` environment variable is set
2. For SQLite Cloud, ensure API key is valid
3. For local development, ensure local database file exists

```bash
# Check database connection
npm run db:health
```

### Error: Games Table Not Found

**Problem**: Database schema not initialized.

**Solution**:

```bash
# Push schema to database
npm run db:push

# Initialize database
npm run db:init

# Then run seeding
npm run db:seed-games
```

### Error: Permission Denied

**Problem**: Insufficient database permissions.

**Solution**:

- Verify database credentials have write access
- For SQLite Cloud, check API key permissions
- For local SQLite, verify file permissions: `chmod 664 dev.db`

## Adding New Games

To add a new official game, edit `scripts/seed-games.ts`:

```typescript
const officialGames: InsertGame[] = [
  // Existing games...
  {
    name: "Your New Game",
    code: "NEWGAME",
    description: "Description of the new game",
    isActive: true,
  },
];
```

Then run the seed script:

```bash
npm run db:seed-games
```

## Production Deployment

### Initial Deployment

1. Deploy application code
2. Run database migrations: `npm run db:push`
3. Seed games: `npm run db:seed-games`
4. Verify: `curl https://your-domain.com/api/games`

### Updates

The seed script is safe to run on production:

```bash
# SSH to production server
npm run db:seed-games
```

Or add to deployment pipeline:

```yaml
# Example: GitHub Actions
- name: Seed Games
  run: npm run db:seed-games
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

## Integration with Card Recognition

The Universal Card Service automatically:

1. **Validates** game IDs against the database
2. **Caches** game lookups for performance (5-minute TTL)
3. **Falls back** to hardcoded IDs if database unavailable
4. **Maps** game codes to appropriate card adapters

Example service flow:

```
User Request → Game Validation → Adapter Selection → Card API → Response
     ↓                ↓                    ↓
  "MTG"     → Database Lookup  → ScryfallAdapter → Scryfall API
  "POKEMON" → Database Lookup  → PokemonTCGAdapter → Pokemon API
  "YUGIOH"  → Database Lookup  → YugiohAdapter → YGOPRODeck API
```

## Security Considerations

- Game seeding requires **write access** to database
- Use environment variables for database credentials
- Never commit production credentials to version control
- Audit game modifications in production
- Only seed from trusted sources

## Support

For issues or questions:

1. Check logs: `npm run db:seed-games 2>&1 | tee seed-games.log`
2. Verify database connectivity: `npm run db:health`
3. Review error messages in the output
4. Consult the TableSync documentation

## Related Documentation

- [TableSync Universal Framework](../tablesync/TABLESYNC_UNIVERSAL_FRAMEWORK_README.md)
- [Card Recognition Guide](../tablesync/CARD_RECOGNITION_GUIDE.md)
- [API Documentation](../../API_DOCUMENTATION.md)
- [Database Schema](../../../shared/schema.ts)
