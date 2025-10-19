# TableSync Universal Framework - Implementation Roadmap

**Date**: December 2024  
**PRD Version**: 3.0  
**Document Version**: 1.0

---

## Executive Summary

This roadmap outlines the implementation plan to transform TableSync into a universal deck-building card game (DBCG) framework as specified in PRD v3.0. The implementation is divided into 4 phases over 12-14 weeks.

**Current Status**: Schema Foundation Complete (Week 1)  
**Next Phase**: Game Creator API (Week 2-3)

---

## Phase 1: Database Foundation ✅ COMPLETE

**Duration**: Week 1  
**Status**: ✅ Complete

### Completed Tasks

- [x] Design universal database schema
- [x] Add `games` table for user-defined games
- [x] Add `cards` table for universal card storage
- [x] Add `game_card_attributes` table for dynamic schemas
- [x] Add `game_formats` table for format definitions
- [x] Add `card_submissions` table for UGC workflow
- [x] Add `game_analytics` table for metrics
- [x] Create Zod validation schemas
- [x] Add TypeScript type definitions
- [x] Verify TypeScript compilation
- [x] Write comprehensive audit document
- [x] Create migration guide

### Deliverables

- ✅ `TABLESYNC_UNIVERSAL_FRAMEWORK_AUDIT.md` - 35KB comprehensive audit
- ✅ `TABLESYNC_UNIVERSAL_FRAMEWORK_MIGRATION.md` - 14KB migration guide
- ✅ Updated `shared/schema.ts` with 6 new tables
- ✅ All TypeScript types and validation schemas

---

## Phase 2: Game Creator API

**Duration**: Weeks 2-3  
**Priority**: Critical  
**Status**: 🔲 Not Started

### Week 2: Core API Implementation

#### 2.1 Game Service Layer

**File**: `server/services/games/game.service.ts`

```typescript
Tasks:
- [ ] Create GameService class
- [ ] Implement createGame(userId, gameData)
- [ ] Implement updateGame(gameId, updates)
- [ ] Implement deleteGame(gameId, userId)
- [ ] Implement publishGame(gameId, userId)
- [ ] Add game ownership validation
- [ ] Add game schema validation
- [ ] Write unit tests (target: 90% coverage)
```

**Estimated Time**: 2 days

#### 2.2 Game CRUD Routes

**File**: `server/features/games/games.routes.ts`

```typescript
Endpoints to implement:
- [ ] POST   /api/games - Create new game
- [ ] GET    /api/games - List games (with filters)
- [ ] GET    /api/games/:id - Get game details
- [ ] PUT    /api/games/:id - Update game
- [ ] DELETE /api/games/:id - Delete game
- [ ] POST   /api/games/:id/publish - Publish game
- [ ] GET    /api/games/:id/stats - Get game statistics
```

**Estimated Time**: 1 day

#### 2.3 Game Attributes API

**File**: `server/features/games/game-attributes.routes.ts`

```typescript
Endpoints to implement:
- [ ] GET    /api/games/:id/attributes - List card attributes
- [ ] POST   /api/games/:id/attributes - Add attribute
- [ ] PUT    /api/games/:id/attributes/:attrId - Update attribute
- [ ] DELETE /api/games/:id/attributes/:attrId - Delete attribute
- [ ] POST   /api/games/:id/attributes/reorder - Reorder attributes
```

**Estimated Time**: 1 day

#### 2.4 Game Formats API

**File**: `server/features/games/game-formats.routes.ts`

```typescript
Endpoints to implement:
- [ ] GET    /api/games/:id/formats - List formats
- [ ] POST   /api/games/:id/formats - Create format
- [ ] PUT    /api/games/:id/formats/:formatId - Update format
- [ ] DELETE /api/games/:id/formats/:formatId - Delete format
```

**Estimated Time**: 0.5 days

#### 2.5 Integration & Testing

```typescript
Tasks:
- [ ] Register routes in server/routes.ts
- [ ] Add request/response validation
- [ ] Write integration tests
- [ ] Add API documentation
- [ ] Test error handling
- [ ] Performance testing
```

**Estimated Time**: 1.5 days

### Week 2 Deliverables

- ✅ Working Game Creator API
- ✅ Full CRUD operations for games
- ✅ Card attribute management
- ✅ Format management
- ✅ Comprehensive test coverage
- ✅ API documentation

---

### Week 3: Universal Card Service Refactor

#### 3.1 Service Architecture

**File**: `server/services/card-recognition/index.ts`

```typescript
Tasks:
- [ ] Create UniversalCardService class
- [ ] Define ICardAdapter interface
- [ ] Implement adapter pattern
- [ ] Add game-based adapter selection
- [ ] Add card caching layer
- [ ] Add search optimization
```

**Estimated Time**: 2 days

#### 3.2 Card Adapters

**Files**:

- `server/services/card-recognition/adapters/base.adapter.ts`
- `server/services/card-recognition/adapters/scryfall.adapter.ts`
- `server/services/card-recognition/adapters/custom.adapter.ts`

```typescript
Tasks:
- [ ] Refactor existing Scryfall service as adapter
- [ ] Create custom game adapter (database-backed)
- [ ] Add adapter registry
- [ ] Implement fallback mechanisms
- [ ] Add adapter health checks
```

**Estimated Time**: 2 days

#### 3.3 Universal Card Routes

**File**: `server/features/cards/universal-cards.routes.ts`

```typescript
New endpoints:
- [ ] GET /api/games/:game_id/cards/search
- [ ] GET /api/games/:game_id/cards/:id
- [ ] GET /api/games/:game_id/cards/named
- [ ] GET /api/games/:game_id/cards/autocomplete
- [ ] GET /api/games/:game_id/cards/random

Backward compatibility:
- [ ] Keep /api/cards/* endpoints
- [ ] Add internal redirect to MTG game
- [ ] Add deprecation warnings
```

**Estimated Time**: 1 day

### Week 3 Deliverables

- ✅ Universal card service with adapter pattern
- ✅ MTG adapter (Scryfall)
- ✅ Custom game adapter
- ✅ Game-scoped card endpoints
- ✅ Backward compatibility maintained

---

## Phase 3: UGC & Moderation System

**Duration**: Weeks 4-5  
**Priority**: High  
**Status**: 🔲 Not Started

### Week 4: Card Submission System

#### 4.1 Submission Service

**File**: `server/services/card-submissions/submission.service.ts`

```typescript
Tasks:
- [ ] Create SubmissionService class
- [ ] Implement submitCard(gameId, userId, cardData)
- [ ] Add duplicate detection
- [ ] Add spam filtering
- [ ] Add image validation
- [ ] Add rate limiting
- [ ] Write validation logic
```

**Estimated Time**: 2 days

#### 4.2 Submission API

**File**: `server/features/card-submissions/submissions.routes.ts`

```typescript
Endpoints:
- [ ] POST   /api/games/:id/cards/submit - Submit card
- [ ] GET    /api/games/:id/submissions - List submissions
- [ ] GET    /api/games/:id/submissions/:subId - Get submission
- [ ] PUT    /api/games/:id/submissions/:subId - Update submission
- [ ] DELETE /api/games/:id/submissions/:subId - Delete submission
- [ ] POST   /api/games/:id/submissions/:subId/vote - Peer vote
```

**Estimated Time**: 1.5 days

#### 4.3 Testing

```typescript
Tasks:
- [ ] Unit tests for submission service
- [ ] Integration tests for submission API
- [ ] Test duplicate detection
- [ ] Test rate limiting
- [ ] Test image upload
```

**Estimated Time**: 1.5 days

### Week 5: Moderation Workflow

#### 5.1 Moderation Service

**File**: `server/services/moderation/card-moderation.service.ts`

```typescript
Tasks:
- [ ] Create CardModerationService
- [ ] Implement getModeratorQueue(moderatorId)
- [ ] Implement approveSubmission(subId, moderatorId)
- [ ] Implement rejectSubmission(subId, reason)
- [ ] Implement requestRevision(subId, notes)
- [ ] Add peer review scoring
- [ ] Add auto-approval logic
```

**Estimated Time**: 2 days

#### 5.2 Moderation API

**File**: `server/features/moderation/card-moderation.routes.ts`

```typescript
Endpoints:
- [ ] GET  /api/moderation/queue - Get moderation queue
- [ ] GET  /api/moderation/submissions/:id - Get submission details
- [ ] POST /api/moderation/submissions/:id/approve - Approve
- [ ] POST /api/moderation/submissions/:id/reject - Reject
- [ ] POST /api/moderation/submissions/:id/revise - Request revision
- [ ] GET  /api/moderation/stats - Moderator statistics
```

**Estimated Time**: 1.5 days

#### 5.3 Moderation Dashboard

```typescript
Tasks:
- [ ] Design moderation UI mockups
- [ ] Implement queue interface
- [ ] Add submission detail view
- [ ] Add approval/rejection flows
- [ ] Add moderator analytics
```

**Estimated Time**: 1.5 days

### Weeks 4-5 Deliverables

- ✅ Card submission system
- ✅ Duplicate detection
- ✅ Peer review system
- ✅ Moderation workflow
- ✅ Auto-approval logic
- ✅ Moderation queue UI

---

## Phase 4: Frontend & Analytics

**Duration**: Weeks 6-8  
**Priority**: Medium-High  
**Status**: 🔲 Not Started

### Week 6: Game Creator UI

#### 6.1 Game Creation Wizard

**File**: `client/src/features/games/components/game-creator-wizard.tsx`

```typescript
Components to build:
- [ ] WizardStep1: Basic Information
- [ ] WizardStep2: Card Attributes Builder
- [ ] WizardStep3: Resource Configuration
- [ ] WizardStep4: Deck Rules
- [ ] WizardStep5: Visual Theme
- [ ] WizardStep6: Review & Publish
- [ ] WizardNavigation component
- [ ] ProgressIndicator component
```

**Estimated Time**: 3 days

#### 6.2 Attribute Builder

**File**: `client/src/features/games/components/attribute-builder.tsx`

```typescript
Features:
- [ ] Add/remove attributes
- [ ] Drag-and-drop reordering
- [ ] Type selection (string, number, array)
- [ ] Validation rules builder
- [ ] Category assignment
- [ ] Preview pane
```

**Estimated Time**: 2 days

### Week 7: Dynamic UI Framework

#### 7.1 Dynamic Form Generator

**File**: `client/src/features/games/components/dynamic-card-form.tsx`

```typescript
Tasks:
- [ ] Create DynamicFormField component
- [ ] Support all data types (string, number, array, object)
- [ ] Add field validation
- [ ] Add conditional fields
- [ ] Add help text tooltips
- [ ] Implement form state management
```

**Estimated Time**: 2 days

#### 7.2 Game-Specific Card Display

**File**: `client/src/features/cards/components/universal-card-display.tsx`

```typescript
Tasks:
- [ ] Load game schema dynamically
- [ ] Render attributes based on schema
- [ ] Apply game theme styling
- [ ] Add image carousel
- [ ] Add attribute tooltips
- [ ] Responsive design
```

**Estimated Time**: 2 days

#### 7.3 Game Selection UI

**File**: `client/src/features/games/components/game-selector.tsx`

```typescript
Features:
- [ ] Game dropdown/search
- [ ] Official games section
- [ ] Community games section
- [ ] Game preview cards
- [ ] Recently used games
- [ ] Favorite games
```

**Estimated Time**: 1 day

### Week 8: Analytics & Polish

#### 8.1 Analytics Dashboard

**File**: `client/src/features/games/pages/game-analytics.tsx`

```typescript
Metrics to display:
- [ ] Total games created
- [ ] Games by category
- [ ] Total cards submitted
- [ ] Submission approval rate
- [ ] Active game creators
- [ ] Popular games (by sessions)
- [ ] Community engagement
- [ ] Time-series charts
```

**Estimated Time**: 2 days

#### 8.2 Analytics API

**File**: `server/features/analytics/game-analytics.routes.ts`

```typescript
Endpoints:
- [ ] GET /api/analytics/games - Overall game statistics
- [ ] GET /api/analytics/games/:id - Game-specific stats
- [ ] GET /api/analytics/submissions - Submission metrics
- [ ] GET /api/analytics/community - Community engagement
- [ ] GET /api/analytics/creators - Creator leaderboard
```

**Estimated Time**: 1.5 days

#### 8.3 Testing & Polish

```typescript
Tasks:
- [ ] E2E tests for game creation
- [ ] E2E tests for card submission
- [ ] Cross-browser testing
- [ ] Mobile responsiveness
- [ ] Accessibility audit
- [ ] Performance optimization
- [ ] User documentation
```

**Estimated Time**: 1.5 days

### Weeks 6-8 Deliverables

- ✅ Game Creator Wizard UI
- ✅ Dynamic form generation
- ✅ Game-specific card display
- ✅ Analytics dashboard
- ✅ Comprehensive testing
- ✅ User documentation

---

## Testing Strategy

### Unit Tests (Ongoing)

**Target Coverage**: 90%

```typescript
Test files to create:
- [ ] server/tests/services/game.service.test.ts
- [ ] server/tests/services/universal-card.service.test.ts
- [ ] server/tests/services/submission.service.test.ts
- [ ] server/tests/services/moderation.service.test.ts
- [ ] client/src/features/games/hooks/use-game-creator.test.ts
```

### Integration Tests

```typescript
Test scenarios:
- [ ] Create game → Add attributes → Publish
- [ ] Submit card → Peer review → Approval
- [ ] Search cards → Filter by game → Display
- [ ] Create custom format → Apply rules → Validate deck
- [ ] Analytics data collection → Aggregation → Display
```

### E2E Tests

```typescript
User journeys:
- [ ] New user creates first game
- [ ] User submits community card
- [ ] Moderator reviews submissions
- [ ] User searches cards across games
- [ ] User builds deck with custom game
```

---

## Performance Targets

### API Response Times

- Game list: <200ms
- Card search: <300ms
- Game creation: <1000ms
- Card submission: <500ms
- Analytics queries: <1000ms

### Database Optimization

```sql
-- Indexes already defined in schema
-- Monitor slow queries:
- [ ] Set up slow query logging
- [ ] Add query performance monitoring
- [ ] Optimize N+1 queries
- [ ] Add database connection pooling
```

### Caching Strategy

```typescript
Cache layers:
- [ ] Game definitions: Redis, 24h TTL
- [ ] Card data: Redis, 7d TTL
- [ ] Search results: Redis, 5m TTL
- [ ] User sessions: Redis, 1h TTL
```

---

## Security Implementation

### Rate Limiting

```typescript
Limits to implement:
- [ ] Game creation: 5 per user per day
- [ ] Card submission: 50 per user per day
- [ ] API calls: 100 per user per minute
- [ ] Search queries: 30 per user per minute
```

### Input Validation

```typescript
Validation rules:
- [ ] Game names: 3-50 characters, alphanumeric
- [ ] Card names: 1-200 characters
- [ ] Image uploads: Max 5MB, JPEG/PNG only
- [ ] Descriptions: Max 2000 characters
- [ ] Sanitize all user inputs
```

### Authorization

```typescript
Permissions to implement:
- [ ] Game creator can edit their games
- [ ] Moderators can approve/reject submissions
- [ ] Admins can approve games
- [ ] Users can submit cards
- [ ] Public can view published games
```

---

## Documentation Requirements

### API Documentation

```typescript
To create:
- [ ] OpenAPI/Swagger spec for all endpoints
- [ ] Request/response examples
- [ ] Error code reference
- [ ] Authentication guide
- [ ] Rate limiting documentation
```

### User Guides

```markdown
Guides to write:

- [ ] How to Create a Custom Game
- [ ] Card Submission Guidelines
- [ ] Moderation Best Practices
- [ ] Game Format Creation
- [ ] API Integration Guide
```

### Developer Documentation

```markdown
Docs to create:

- [ ] Architecture overview
- [ ] Database schema reference
- [ ] Service layer documentation
- [ ] Frontend component library
- [ ] Contributing guidelines
```

---

## Success Metrics

### Launch Targets (3 months)

- [ ] 10+ user-created games published
- [ ] 1,000+ community-submitted cards
- [ ] 100+ active game creators
- [ ] 5+ official game integrations
- [ ] 90%+ card approval rate
- [ ] <500ms average API response time

### Long-term Goals (6-12 months)

- [ ] 100+ published games
- [ ] 10,000+ cards in database
- [ ] 1,000+ daily active users
- [ ] 50,000+ game sessions using custom games
- [ ] Community-driven databases for 3+ major TCGs
- [ ] ML card recognition for top 10 games

---

## Risk Mitigation

### Technical Risks

| Risk                             | Impact | Mitigation                                      |
| -------------------------------- | ------ | ----------------------------------------------- |
| Database performance degradation | High   | Proper indexing, query optimization, monitoring |
| API response time increases      | High   | Caching layer, CDN for images, load testing     |
| Schema complexity                | Medium | Clear documentation, validation at all layers   |
| Backward compatibility breaks    | High   | Extensive testing, gradual migration            |

### Product Risks

| Risk                   | Impact | Mitigation                                        |
| ---------------------- | ------ | ------------------------------------------------- |
| Low community adoption | High   | Pre-seed with official games, marketing campaign  |
| UGC quality issues     | Medium | Strong moderation, peer review, reputation system |
| Feature complexity     | Medium | Phased rollout, user testing, clear UI/UX         |
| Abuse/spam submissions | Medium | Rate limiting, spam detection, bans               |

---

## Team Assignments

### Backend Team (2 developers)

**Developer 1**: Game Creator API

- Weeks 2-3: Game service and API
- Weeks 4-5: Card submission system

**Developer 2**: Universal Card Service

- Weeks 2-3: Card service refactor
- Weeks 4-5: Moderation system

### Frontend Team (2 developers)

**Developer 3**: Game Creator UI

- Weeks 6-7: Game creation wizard
- Week 8: Polish and testing

**Developer 4**: Dynamic UI Framework

- Weeks 6-7: Dynamic forms and display
- Week 8: Analytics dashboard

### QA/DevOps (1 developer)

- Ongoing: Test infrastructure
- Weeks 2-8: Integration and E2E tests
- Week 8: Performance testing and optimization

---

## Sprint Planning

### Sprint 1 (Week 2): Game Creator API

- Game service implementation
- CRUD endpoints
- Attribute management
- Format management

### Sprint 2 (Week 3): Universal Card Service

- Service refactor
- Adapter pattern implementation
- Game-scoped endpoints
- Backward compatibility

### Sprint 3 (Week 4): Card Submissions

- Submission service
- Submission API
- Duplicate detection
- Testing

### Sprint 4 (Week 5): Moderation

- Moderation service
- Moderation API
- Queue UI
- Auto-approval logic

### Sprint 5 (Week 6): Game Creator UI

- Creation wizard
- Attribute builder
- Format editor

### Sprint 6 (Week 7): Dynamic UI

- Dynamic forms
- Card display
- Game selector

### Sprint 7 (Week 8): Analytics & Launch

- Analytics dashboard
- Performance optimization
- Documentation
- Beta launch

---

## Next Immediate Actions

### This Week (Week 1 Complete)

- [x] Database schema design
- [x] Schema implementation
- [x] Audit documentation
- [x] Migration guide

### Next Week (Week 2 - Starting Now)

- [ ] Create `server/services/games/` directory
- [ ] Implement GameService class
- [ ] Create games API routes
- [ ] Write initial unit tests
- [ ] Update API documentation

### Week 3

- [ ] Refactor card recognition service
- [ ] Implement adapter pattern
- [ ] Add game-scoped card endpoints
- [ ] Test backward compatibility

---

## Conclusion

This roadmap provides a clear path to implementing PRD v3.0's Universal Deck-Building Framework. With the database foundation complete, we're ready to begin Phase 2 (Game Creator API) immediately.

**Estimated Total Effort**: 12-14 weeks  
**Current Progress**: Week 1 Complete (8% overall)  
**Next Milestone**: Game Creator API (Weeks 2-3)

---

**Document Version**: 1.0  
**Last Updated**: December 2024  
**Owner**: TableSync Engineering Team  
**Status**: Ready for Implementation
