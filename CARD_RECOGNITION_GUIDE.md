# TableSync Card Recognition - Implementation Guide

## Overview

This guide provides instructions for using the TableSync Card Recognition API for Magic: The Gathering cards. The implementation is complete and ready for use.

## Quick Start

### 1. Search for Cards

Search for MTG cards by name, with optional filters for set and format:

```bash
GET /api/cards/search?q=Lightning+Bolt&format=modern&limit=10
```

Response:
```json
{
  "cards": [
    {
      "id": "ce711943-c1a1-43a0-8b89-8d169cfb8e06",
      "name": "Lightning Bolt",
      "manaCost": "{R}",
      "cmc": 1,
      "typeLine": "Instant",
      "oracleText": "Lightning Bolt deals 3 damage to any target.",
      "setCode": "lea",
      "setName": "Limited Edition Alpha",
      "rarity": "common",
      "imageUris": {
        "small": "https://cards.scryfall.io/small/...",
        "normal": "https://cards.scryfall.io/normal/...",
        "large": "https://cards.scryfall.io/large/..."
      },
      "prices": {
        "usd": "99.99"
      }
    }
  ],
  "total": 234,
  "page": 1,
  "hasMore": true
}
```

### 2. Get Card by ID

Retrieve a specific card by its Scryfall ID:

```bash
GET /api/cards/ce711943-c1a1-43a0-8b89-8d169cfb8e06
```

### 3. Get Card by Name

Get a card using its exact name:

```bash
GET /api/cards/named?exact=Lightning+Bolt
```

For a specific set version:

```bash
GET /api/cards/named?exact=Lightning+Bolt&set=m21
```

### 4. Autocomplete

Get card name suggestions for autocomplete:

```bash
GET /api/cards/autocomplete?q=light&limit=10
```

Response:
```json
{
  "suggestions": [
    { "name": "Lightning Bolt" },
    { "name": "Lightning Strike" },
    { "name": "Lightning Helix" }
  ]
}
```

### 5. Random Card

Get a random MTG card (useful for discovery):

```bash
GET /api/cards/random
```

With filters:

```bash
GET /api/cards/random?format=commander&set=cmr
```

## API Endpoints

### Search Cards
**Endpoint**: `GET /api/cards/search`

**Query Parameters**:
- `q` (required): Search query (card name or text)
- `set` (optional): Filter by set code (e.g., "lea", "m21")
- `format` (optional): Filter by format legality
  - Values: `standard`, `modern`, `commander`, `legacy`, `vintage`, `pioneer`, `pauper`
- `page` (optional): Page number (default: 1, max: 100)
- `limit` (optional): Results per page (default: 20, max: 100)

**Example**:
```bash
curl "https://shuffleandsync.org/api/cards/search?q=counterspell&format=modern&limit=5"
```

### Get Card by ID
**Endpoint**: `GET /api/cards/:id`

**Parameters**:
- `id` (required): Scryfall card ID

**Example**:
```bash
curl "https://shuffleandsync.org/api/cards/ce711943-c1a1-43a0-8b89-8d169cfb8e06"
```

### Get Card by Name
**Endpoint**: `GET /api/cards/named`

**Query Parameters**:
- `exact` (optional): Exact card name
- `fuzzy` (optional): Fuzzy card name (use when exact name unknown)
- `set` (optional): Prefer specific set version

**Example**:
```bash
curl "https://shuffleandsync.org/api/cards/named?exact=Lightning+Bolt&set=lea"
```

### Autocomplete
**Endpoint**: `GET /api/cards/autocomplete`

**Query Parameters**:
- `q` (required): Partial card name (min 2 characters)
- `limit` (optional): Max suggestions (default: 10, max: 20)

**Example**:
```bash
curl "https://shuffleandsync.org/api/cards/autocomplete?q=mana&limit=10"
```

### Random Card
**Endpoint**: `GET /api/cards/random`

**Query Parameters**:
- `set` (optional): Random card from specific set
- `format` (optional): Random card legal in format

**Example**:
```bash
curl "https://shuffleandsync.org/api/cards/random?format=commander"
```

### Cache Statistics
**Endpoint**: `GET /api/cards/cache/stats`

Get current cache statistics (useful for monitoring):

**Example**:
```bash
curl "https://shuffleandsync.org/api/cards/cache/stats"
```

Response:
```json
{
  "size": 245,
  "maxSize": 1000
}
```

## Frontend Integration

### React Example

```typescript
import { useQuery } from '@tanstack/react-query';

// Search for cards
function CardSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data, isLoading } = useQuery({
    queryKey: ['/api/cards/search', searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        q: searchTerm,
        limit: '20'
      });
      const response = await fetch(`/api/cards/search?${params}`);
      return response.json();
    },
    enabled: searchTerm.length > 2
  });

  return (
    <div>
      <input 
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search for cards..."
      />
      {isLoading && <div>Loading...</div>}
      {data?.cards.map(card => (
        <div key={card.id}>
          <h3>{card.name}</h3>
          <p>{card.typeLine}</p>
          {card.imageUris?.normal && (
            <img src={card.imageUris.normal} alt={card.name} />
          )}
        </div>
      ))}
    </div>
  );
}
```

### Autocomplete Example

```typescript
import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/use-debounce';

function CardAutocomplete() {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const debouncedInput = useDebounce(input, 300);

  useEffect(() => {
    if (debouncedInput.length < 2) {
      setSuggestions([]);
      return;
    }

    fetch(`/api/cards/autocomplete?q=${debouncedInput}&limit=10`)
      .then(res => res.json())
      .then(data => setSuggestions(data.suggestions));
  }, [debouncedInput]);

  return (
    <div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type card name..."
      />
      {suggestions.length > 0 && (
        <ul>
          {suggestions.map((s, i) => (
            <li key={i} onClick={() => setInput(s.name)}>
              {s.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

## Card Data Structure

Each card object contains the following fields:

```typescript
interface MtgCard {
  // Required fields
  id: string;                    // Scryfall ID
  name: string;                  // Card name
  typeLine: string;              // "Instant", "Creature — Human Wizard", etc.
  setCode: string;               // Set code (e.g., "m21")
  setName: string;               // Set name (e.g., "Core Set 2021")
  collectorNumber: string;       // Collector number in set
  rarity: string;                // "common", "uncommon", "rare", "mythic"
  
  // Optional fields
  oracleId?: string;             // Oracle ID (same across printings)
  manaCost?: string;             // Mana cost (e.g., "{2}{U}{U}")
  cmc?: number;                  // Converted mana cost
  oracleText?: string;           // Card text
  power?: string;                // Power (creatures)
  toughness?: string;            // Toughness (creatures)
  loyalty?: string;              // Loyalty (planeswalkers)
  colors?: string[];             // Color identity
  colorIdentity?: string[];      // Commander color identity
  
  // Image URLs
  imageUris?: {
    small?: string;
    normal?: string;
    large?: string;
    png?: string;
    artCrop?: string;
    borderCrop?: string;
  };
  
  // Pricing
  prices?: {
    usd?: string;
    usdFoil?: string;
    eur?: string;
    eurFoil?: string;
    tix?: string;
  };
  
  // Format legality
  legalities?: Record<string, string>;  // "legal", "not_legal", "restricted", "banned"
  
  releasedAt?: string;           // Release date (YYYY-MM-DD)
  scryfallUri?: string;          // Scryfall page URL
}
```

## Error Handling

All endpoints return standard HTTP status codes:

- `200 OK`: Success
- `400 Bad Request`: Invalid parameters
- `404 Not Found`: Card not found
- `500 Internal Server Error`: Server error

Error response format:

```json
{
  "message": "Error description",
  "errors": [ /* Validation errors if applicable */ ]
}
```

### Example Error Handling

```typescript
try {
  const response = await fetch(`/api/cards/named?exact=${cardName}`);
  
  if (!response.ok) {
    const error = await response.json();
    console.error('Card not found:', error.message);
    return null;
  }
  
  const card = await response.json();
  return card;
} catch (error) {
  console.error('Network error:', error);
  return null;
}
```

## Performance Considerations

### Caching

The service implements intelligent caching:
- **In-memory cache**: 1000 most recently accessed cards
- **Cache TTL**: 7 days
- **LRU eviction**: Oldest cards removed when cache is full

### Rate Limiting

- **Internal rate limit**: 100ms between Scryfall API requests (10/sec)
- **Recommendation**: Debounce user input for autocomplete (300ms)
- **Best practice**: Use React Query or similar for automatic caching

### Optimization Tips

1. **Use autocomplete for search**: Better UX and faster than full search
2. **Cache card IDs locally**: Store Scryfall IDs in local state/storage
3. **Debounce search input**: Reduce API calls during typing
4. **Paginate results**: Don't load all results at once
5. **Lazy load images**: Load card images only when visible

## Integration with TableSync Features

### Game Session Card Tracking

```typescript
// Store card IDs in game session
const gameSession = {
  id: 'session-123',
  hostId: 'user-456',
  cardIds: [
    'ce711943-c1a1-43a0-8b89-8d169cfb8e06',  // Lightning Bolt
    // ... other cards
  ]
};

// Fetch full card data when needed
const cardDetails = await Promise.all(
  gameSession.cardIds.map(id => 
    fetch(`/api/cards/${id}`).then(r => r.json())
  )
);
```

### Deck Building

```typescript
interface Deck {
  name: string;
  format: 'commander' | 'modern' | 'standard';
  cards: {
    cardId: string;
    quantity: number;
  }[];
}

// Validate deck legality
async function validateDeck(deck: Deck) {
  for (const entry of deck.cards) {
    const card = await fetch(`/api/cards/${entry.cardId}`).then(r => r.json());
    
    if (!card.legalities?.[deck.format] === 'legal') {
      throw new Error(`${card.name} is not legal in ${deck.format}`);
    }
  }
  
  return true;
}
```

## Testing

The service includes comprehensive tests:

```bash
# Run card recognition tests
npm test -- card-recognition

# All tests should pass
# ✓ 22 tests passing
```

### Manual Testing

Test the API manually:

```bash
# Search for cards
curl "http://localhost:3000/api/cards/search?q=counterspell"

# Get specific card
curl "http://localhost:3000/api/cards/named?exact=Lightning+Bolt"

# Autocomplete
curl "http://localhost:3000/api/cards/autocomplete?q=mana"

# Random card
curl "http://localhost:3000/api/cards/random?format=commander"
```

## Future Enhancements

### Phase 2 (Planned)
- Price tracking and alerts
- Deck building features
- Card collection management
- Advanced search with multiple filters

### Phase 3 (Future)
- Image-based card recognition (OCR)
- ML-based visual identification
- Mobile camera integration
- Real-time card overlay for streaming

## Troubleshooting

### Common Issues

**Issue**: Search returns no results
- **Solution**: Check spelling, try fuzzy search instead of exact match

**Issue**: Autocomplete is slow
- **Solution**: Implement debouncing (300ms recommended)

**Issue**: Cards not caching
- **Solution**: Check cache stats endpoint, cache may be full

**Issue**: Rate limit errors
- **Solution**: Add delays between rapid requests

### Support

For issues or questions:
1. Check the audit document: `TABLESYNC_CARD_RECOGNITION_AUDIT.md`
2. Review API endpoint documentation above
3. Check test files for usage examples
4. Review Scryfall API docs: https://scryfall.com/docs/api

## Resources

- **Scryfall API**: https://scryfall.com/docs/api
- **MTG Rules**: https://magic.wizards.com/en/rules
- **Card Database**: https://scryfall.com/
- **Test Suite**: `server/tests/features/card-recognition.test.ts`
- **Service Code**: `server/services/card-recognition.ts`
- **API Routes**: `server/features/cards/cards.routes.ts`

## License & Attribution

Card data provided by Scryfall (https://scryfall.com/).
Card images and names © Wizards of the Coast.

---

**Implementation Status**: ✅ Complete (Phase 1 MVP)  
**Last Updated**: December 2024  
**Version**: 1.0.0
