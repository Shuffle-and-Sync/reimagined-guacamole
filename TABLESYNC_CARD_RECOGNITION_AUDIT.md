# TableSync Card Recognition Engine Audit
## Magic: The Gathering Implementation Review

**Date**: December 2024  
**Status**: Implementation Required  
**Priority**: High

---

## Executive Summary

This audit reviews the current state of the TableSync card recognition engine for Magic: The Gathering (MTG) cards. **The feature is currently not implemented** and is marked as "Coming Soon" on the TableSync landing page. This document outlines the current gaps, requirements, and provides a roadmap for implementation.

### Key Findings

✅ **What Exists**:
- Marketing presence on TableSync landing page
- UI mockup for card recognition feature
- Clear feature requirements documented in landing page

❌ **What's Missing**:
- No backend card recognition service
- No MTG card API integration
- No database schema for card data
- No card recognition API routes
- No frontend implementation beyond marketing copy
- No tests for card recognition functionality

---

## Current State Analysis

### 1. Frontend Presence

**Location**: `client/src/pages/tablesync-landing.tsx`

The Card Recognition AI feature is displayed as a "Coming Soon" premium feature with the following planned capabilities:

```tsx
<h3>Card Recognition AI</h3>
<p>Smart game assistance</p>

Features:
- Instant card identification
- Real-time card info overlay
- Price tracking integration
```

**Badge Status**: 🟡 Coming Soon (opacity reduced to 75%)

### 2. Backend Services

**Status**: Not implemented

No card recognition services found in:
- `/server/services/` - No card recognition service
- `/server/features/games/` - Only basic game session management
- No API integrations with MTG card databases

### 3. Database Schema

**Status**: Not implemented

Current schema review (`/shared/schema.ts`):
- ✅ Game sessions table exists
- ✅ Event types include "game_pod"
- ❌ No card data tables
- ❌ No card metadata storage
- ❌ No card recognition history

### 4. API Integration

**Status**: Not implemented

No integrations found for:
- Scryfall API (most popular MTG card database)
- MTG JSON
- Gatherer (Wizards of the Coast official database)
- TCGPlayer API (for pricing)

### 5. Testing Infrastructure

**Status**: Not implemented

No tests found for card recognition:
- ✅ Test infrastructure exists (Jest + TypeScript)
- ❌ No card recognition tests
- ❌ No MTG API mock data

---

## Requirements Analysis

### Functional Requirements

#### 1. Card Identification
- **Input**: Image/video frame from camera feed
- **Output**: Card name, set, collector number
- **Accuracy**: >90% for tournament-legal cards
- **Performance**: <500ms per identification

#### 2. Card Metadata Extraction
Required data fields:
- Card name
- Mana cost
- Card type
- Rarity
- Set name and code
- Collector number
- Oracle text
- Power/Toughness (for creatures)
- Loyalty (for planeswalkers)

#### 3. Real-time Information Overlay
- Card image display
- Card text overlay
- Price information (optional)
- Rules clarifications
- Synergy suggestions (future)

#### 4. Integration Points
- TableSync game sessions
- OBS streaming overlays
- Real-time WebSocket updates
- Community-specific card pools (by game format)

### Non-Functional Requirements

#### 1. Performance
- API response time: <200ms for card lookup
- Image recognition: <1s per card
- Caching strategy for frequently accessed cards
- Rate limiting for external APIs

#### 2. Scalability
- Support 100+ concurrent users
- Handle 1000+ card lookups per minute
- Efficient caching layer (Redis recommended)

#### 3. Reliability
- 99.5% uptime for card data service
- Fallback mechanisms for API failures
- Offline mode with cached card database

#### 4. Security
- API key management for external services
- Rate limiting per user/session
- Input validation for card queries

---

## Technology Recommendations

### 1. Card Database Integration

**Recommended**: Scryfall API
- **Pros**: 
  - Free, comprehensive, well-documented
  - JSON API with extensive card data
  - Bulk data downloads available
  - Active maintenance
  - Includes pricing data
- **Endpoint**: `https://api.scryfall.com`
- **Rate Limit**: 10 requests per second
- **Documentation**: https://scryfall.com/docs/api

**Alternative**: MTG JSON
- Local database option
- Complete card dataset
- No API rate limits
- Requires local storage (~500MB)

### 2. Image Recognition

**Recommended Approach**: Hybrid
1. **Text-based search** (Phase 1):
   - User types card name
   - Autocomplete with Scryfall API
   - Fast, reliable, no ML required

2. **OCR-based recognition** (Phase 2):
   - Extract text from card image
   - Match against card database
   - Libraries: Tesseract.js, Google Vision API

3. **ML-based visual recognition** (Phase 3):
   - Train model on card images
   - Direct image-to-card mapping
   - Requires significant ML infrastructure

**Recommendation**: Start with Phase 1 (text search) for MVP

### 3. Caching Strategy

**Recommended**: Redis cache with tiered approach
- **Hot cache**: Most popular 1000 cards (in-memory)
- **Warm cache**: Cards accessed in last 24h (Redis)
- **Cold storage**: Full database (PostgreSQL)

**Cache TTL**:
- Card metadata: 7 days (rarely changes)
- Price data: 1 hour (frequently changes)
- Set information: 30 days

---

## Implementation Roadmap

### Phase 1: MVP - Text-based Card Lookup (Week 1-2)

#### Backend Tasks
- [ ] Create card recognition service (`server/services/card-recognition.ts`)
- [ ] Integrate Scryfall API client
- [ ] Add card data caching (in-memory to start)
- [ ] Create API routes:
  - `GET /api/cards/search?q={name}` - Search cards
  - `GET /api/cards/{id}` - Get card details
  - `GET /api/cards/autocomplete?q={partial}` - Autocomplete
- [ ] Add error handling and rate limiting
- [ ] Implement request logging

#### Database Tasks
- [ ] Create `mtg_cards` table for cached card data
- [ ] Create `card_lookups` table for usage analytics
- [ ] Add indexes for fast card name searches

#### Frontend Tasks
- [ ] Create card search component
- [ ] Add autocomplete input
- [ ] Display card details modal
- [ ] Integrate with TableSync game sessions

#### Testing Tasks
- [ ] Unit tests for card service
- [ ] Integration tests for Scryfall API
- [ ] API route tests
- [ ] Frontend component tests

### Phase 2: Enhanced Features (Week 3-4)

- [ ] Add card price tracking (TCGPlayer/CardMarket integration)
- [ ] Implement card collection tracking
- [ ] Add deck building features
- [ ] Create card overlay for streaming
- [ ] Add WebSocket updates for real-time card display

### Phase 3: Image Recognition (Future)

- [ ] Integrate OCR service
- [ ] Add camera feed integration
- [ ] Implement ML-based card detection
- [ ] Create training dataset
- [ ] Deploy ML model

---

## Database Schema Proposal

```typescript
// MTG Cards Cache Table
export const mtgCards = pgTable("mtg_cards", {
  id: varchar("id").primaryKey(), // Scryfall ID
  oracleId: varchar("oracle_id"), // Unique card identity
  name: varchar("name").notNull(),
  manaCost: varchar("mana_cost"),
  cmc: integer("cmc"), // Converted mana cost
  typeLine: varchar("type_line"),
  oracleText: text("oracle_text"),
  power: varchar("power"),
  toughness: varchar("toughness"),
  loyalty: varchar("loyalty"),
  colors: jsonb("colors"), // Array of color codes
  colorIdentity: jsonb("color_identity"),
  setCode: varchar("set_code"),
  setName: varchar("set_name"),
  collectorNumber: varchar("collector_number"),
  rarity: varchar("rarity"),
  imageUris: jsonb("image_uris"), // Various image sizes
  prices: jsonb("prices"), // Price data
  legalities: jsonb("legalities"), // Format legalities
  releasedAt: date("released_at"),
  scryfallUri: varchar("scryfall_uri"),
  cachedAt: timestamp("cached_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Card Lookup History
export const cardLookups = pgTable("card_lookups", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  cardId: varchar("card_id").references(() => mtgCards.id),
  sessionId: varchar("session_id").references(() => gameSessions.id),
  searchQuery: varchar("search_query"),
  resultCount: integer("result_count"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Indexes
index("idx_mtg_cards_name").on(mtgCards.name);
index("idx_mtg_cards_set").on(mtgCards.setCode);
index("idx_card_lookups_user").on(cardLookups.userId);
index("idx_card_lookups_session").on(cardLookups.sessionId);
```

---

## API Endpoints Design

### 1. Search Cards
```
GET /api/cards/search
Query params: 
  - q: string (card name)
  - set?: string (set code filter)
  - format?: string (legal format filter)
  - page?: number
  - limit?: number (max 100)

Response:
{
  "cards": [...],
  "total": 1234,
  "page": 1,
  "hasMore": true
}
```

### 2. Get Card Details
```
GET /api/cards/:id

Response:
{
  "id": "scryfall-id",
  "name": "Lightning Bolt",
  "manaCost": "{R}",
  "typeLine": "Instant",
  ...
}
```

### 3. Autocomplete
```
GET /api/cards/autocomplete
Query params:
  - q: string (min 2 chars)
  - limit?: number (max 20)

Response:
{
  "suggestions": [
    { "id": "...", "name": "Lightning Bolt" },
    { "id": "...", "name": "Lightning Strike" }
  ]
}
```

### 4. Get Card by Name (Exact Match)
```
GET /api/cards/named
Query params:
  - exact: string (exact card name)
  - fuzzy?: string (fuzzy search)
  - set?: string (prefer specific set)

Response: Single card object
```

---

## Security Considerations

### 1. API Key Management
- Store Scryfall API credentials in environment variables
- Implement API key rotation
- Use secure key vault (Cloud Secret Manager)

### 2. Rate Limiting
- **Per User**: 100 requests per minute
- **Per IP**: 200 requests per minute
- **Global**: 1000 requests per minute
- Implement exponential backoff

### 3. Input Validation
- Sanitize all card name inputs
- Validate query parameters
- Limit query string length
- Prevent SQL injection via parameterized queries

### 4. Caching Security
- Cache only public card data
- Don't cache user-specific information
- Implement cache invalidation
- Use secure cache keys

---

## Performance Optimization

### 1. Caching Strategy
```typescript
// Three-tier caching
1. In-memory cache (Node.js Map): 1000 most popular cards
2. Redis cache: Cards accessed in last 24 hours
3. PostgreSQL: Full card database cache
```

### 2. Database Optimization
- Create indexes on frequently queried fields
- Use full-text search for card names
- Implement query result pagination
- Use connection pooling

### 3. API Optimization
- Batch card lookups when possible
- Implement request deduplication
- Use HTTP caching headers
- Compress API responses

---

## Testing Strategy

### 1. Unit Tests
- Card service methods
- API client functions
- Cache operations
- Data transformation utilities

### 2. Integration Tests
- Scryfall API integration
- Database operations
- Cache layer functionality
- API route handlers

### 3. End-to-End Tests
- Card search workflow
- Card detail retrieval
- Autocomplete functionality
- Error handling scenarios

### 4. Performance Tests
- Load testing card search
- Cache hit rate validation
- API response time benchmarks

---

## Monitoring and Analytics

### Metrics to Track
- Card search queries per minute
- Cache hit/miss ratio
- API response times (p50, p95, p99)
- Scryfall API rate limit usage
- Most searched cards
- User engagement with card data

### Logging
- All external API calls
- Cache operations
- User search queries (anonymized)
- Errors and exceptions

---

## Cost Analysis

### Infrastructure Costs
- **Scryfall API**: Free (with rate limits)
- **Redis Cache**: ~$10/month (minimal data)
- **Database Storage**: ~$5/month (card data ~500MB)
- **Total**: ~$15/month estimated

### Development Costs
- **Phase 1 (MVP)**: 40-60 hours
- **Phase 2 (Enhanced)**: 60-80 hours
- **Phase 3 (ML/Vision)**: 120-200 hours

---

## Recommendations

### Immediate Actions (High Priority)
1. ✅ **Create this audit document**
2. 🔲 **Implement basic card lookup service** (Phase 1 MVP)
   - Start with Scryfall API integration
   - Text-based search only
   - Basic caching strategy
3. 🔲 **Update database schema** for card data storage
4. 🔲 **Create API routes** for card operations
5. 🔲 **Add comprehensive tests**

### Short-term Goals (4-6 weeks)
1. Complete Phase 1 MVP implementation
2. Deploy to production with feature flag
3. Gather user feedback
4. Add price tracking integration
5. Implement deck building features

### Long-term Goals (3-6 months)
1. Explore OCR-based card recognition
2. Investigate ML-based visual recognition
3. Add support for other TCGs (Pokemon, Lorcana)
4. Create mobile app integration
5. Build community card database

### Risk Mitigation
- **Scryfall API dependency**: Cache extensively, plan for alternative APIs
- **Rate limiting**: Implement request queuing and user-level throttling
- **Data accuracy**: Regular cache invalidation and verification
- **Performance**: Continuous monitoring and optimization

---

## Conclusion

The TableSync card recognition engine for Magic: The Gathering is currently **not implemented**. This audit identifies all gaps and provides a clear roadmap for implementation. 

**Recommendation**: Proceed with **Phase 1 MVP** implementation focusing on text-based card lookup with Scryfall API integration. This provides immediate value to users while laying the foundation for more advanced features.

**Estimated Timeline**: 
- Phase 1 MVP: 2-3 weeks
- User testing: 1 week
- Phase 2 enhancements: 3-4 weeks

**Total Time to Full Feature**: 6-8 weeks for a production-ready card recognition system.

---

## Appendix

### A. Scryfall API Examples

```bash
# Search for a card
curl "https://api.scryfall.com/cards/search?q=lightning+bolt"

# Get card by name
curl "https://api.scryfall.com/cards/named?exact=Lightning+Bolt"

# Autocomplete
curl "https://api.scryfall.com/cards/autocomplete?q=light"

# Get random card
curl "https://api.scryfall.com/cards/random"
```

### B. Example Card Data Structure

```json
{
  "id": "ce711943-c1a1-43a0-8b89-8d169cfb8e06",
  "name": "Lightning Bolt",
  "mana_cost": "{R}",
  "cmc": 1,
  "type_line": "Instant",
  "oracle_text": "Lightning Bolt deals 3 damage to any target.",
  "colors": ["R"],
  "color_identity": ["R"],
  "set": "lea",
  "set_name": "Limited Edition Alpha",
  "rarity": "common",
  "image_uris": {
    "small": "https://...",
    "normal": "https://...",
    "large": "https://..."
  },
  "prices": {
    "usd": "99.99",
    "eur": "89.99"
  }
}
```

### C. Related Documentation
- Scryfall API: https://scryfall.com/docs/api
- MTG JSON: https://mtgjson.com/
- MTG Rules: https://magic.wizards.com/en/rules
- TableSync Architecture: `/docs/backend/`

---

**Document Version**: 1.0  
**Last Updated**: December 2024  
**Next Review**: After Phase 1 completion
