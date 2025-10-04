# Schema Validation Guide

## Overview

This document describes the schema validation approach for the Shuffle & Sync application, including validation scripts, insert schemas, and best practices for maintaining schema integrity.

## Validation Script

The project includes a comprehensive schema validation script at `scripts/validate-schema-fixes.ts` that performs the following checks:

### Check 1: Insert Schema Validation
Verifies that all required Zod insert schemas are present and valid:
- `insertUserSchema`
- `insertCommunitySchema`
- `insertEventSchema`
- `insertTournamentSchema`
- `insertFriendshipSchema`
- `insertStreamSessionSchema`
- And 15+ other schemas

### Check 2: Enum Type Consistency
Validates that enum values are consistent between database schema and application code:
- User Status: `online`, `offline`, `away`, `busy`, `gaming`
- Show Online Status: `everyone`, `friends_only`, `private`
- Allow Direct Messages: `everyone`, `friends_only`, `private`
- Event Type: `tournament`, `convention`, `release`, `stream`, `community`, `personal`, `game_pod`
- Event Status: `active`, `cancelled`, `completed`, `draft`
- Tournament Status: `upcoming`, `active`, `completed`, `cancelled`
- Tournament Participant Status: `registered`, `active`, `eliminated`, `winner`
- Friendship Status: `pending`, `accepted`, `declined`, `blocked`
- Stream Session Status: `scheduled`, `live`, `ended`, `cancelled`

### Check 3: Database Connection Health
Verifies that the database connection is healthy and functional.

### Check 4: Core Tables Validation
Checks that all core tables exist in the database:
- `users`
- `communities`
- `events`
- `tournaments`
- `messages`
- `notifications`
- `user_roles`
- `accounts`
- `sessions`

### Check 5: Schema Coverage Analysis
Identifies important tables that should have insert schemas and warns if any are missing.

## Running Validation

To run the schema validation script:

```bash
npx tsx scripts/validate-schema-fixes.ts
```

Expected output when all checks pass:
```
✨ All critical schema validations passed!
```

## Insert Schemas

### Purpose
Insert schemas provide runtime validation using Zod to ensure data integrity before inserting into the database. They:
- Validate required fields
- Enforce type constraints
- Validate enum values
- Provide custom validation rules
- Auto-omit generated fields (id, createdAt, updatedAt)

### Example Insert Schema

```typescript
export const insertTournamentSchema = createInsertSchema(tournaments, {
  name: z.string().min(1).max(200),
  gameType: z.string().min(1),
  format: z.string().min(1),
  status: z.enum(['upcoming', 'active', 'completed', 'cancelled']).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
```

### Available Insert Schemas

The following insert schemas are available in `shared/schema.ts`:

**Core Entities:**
- `insertUserSchema` - User account creation/updates
- `insertCommunitySchema` - Community creation
- `insertEventSchema` - Event creation with validation

**Tournament System:**
- `insertTournamentSchema` - Tournament creation with status validation
- `insertTournamentParticipantSchema` - Tournament participant registration

**Social Features:**
- `insertFriendshipSchema` - Friend request creation
- `insertMessageSchema` - Message creation with content validation
- `insertNotificationSchema` - Notification creation

**Streaming Features:**
- `insertStreamSessionSchema` - Stream session creation
- `insertCollaborativeStreamEventSchema` - Collaborative stream events
- `insertStreamCollaboratorSchema` - Stream collaborator management
- `insertStreamCoordinationSessionSchema` - Stream coordination

**Content Moderation:**
- `insertContentReportSchema` - Content report submission
- `insertModerationActionSchema` - Moderation action logging
- `insertModerationQueueSchema` - Moderation queue items
- `insertCmsContentSchema` - CMS content management
- `insertUserAppealSchema` - User appeal submission
- `insertAdminAuditLogSchema` - Admin action auditing

**Permissions:**
- `insertUserRoleSchema` - User role assignment

**Game Sessions:**
- `insertGameSessionSchema` - Game session creation
- `insertEventAttendeeSchema` - Event attendee management

## Type Exports

For each insert schema, there's a corresponding TypeScript type:

```typescript
export type InsertTournament = z.infer<typeof insertTournamentSchema>;
export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;
export type InsertStreamSession = z.infer<typeof insertStreamSessionSchema>;
// etc.
```

These types can be used throughout the application for type-safe database operations.

## Best Practices

### 1. Always Use Insert Schemas for User Input
When creating records from user input, always validate using the appropriate insert schema:

```typescript
// ✅ Good
const validatedData = insertTournamentSchema.parse(userInput);
await db.insert(tournaments).values(validatedData);

// ❌ Bad - No validation
await db.insert(tournaments).values(userInput);
```

### 2. Update Schemas When Tables Change
When modifying table definitions in `shared/schema.ts`:
1. Update the table definition
2. Update the corresponding insert schema if it exists
3. Update enum validation if enum values change
4. Run `npm run check` to verify TypeScript types
5. Run the validation script to ensure consistency

### 3. Add Insert Schemas for New Tables
When adding new tables, especially for user-facing features:
1. Define the table in `shared/schema.ts`
2. Create an insert schema with appropriate validation
3. Export the corresponding type
4. Update the validation script to check for the new schema

### 4. Regular Validation
Run schema validation before deployments:

```bash
npm run check                    # TypeScript type checking
npx tsx scripts/validate-schema-fixes.ts  # Schema validation
npm test                         # Run all tests
```

### 5. Enum Consistency
When adding new enum values:
1. Update the table definition comment with allowed values
2. Update the insert schema with the new enum values
3. Update the validation script's enum checks
4. Update any TypeScript types that reference the enum

## Integration with CI/CD

The schema validation script can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Validate Schemas
  run: npx tsx scripts/validate-schema-fixes.ts
```

The script exits with code 0 on success and code 1 on failure, making it suitable for automated checks.

## Troubleshooting

### Missing Schema Error
If you see "Missing schema: insertXxxSchema":
1. Check if the schema is defined in `shared/schema.ts`
2. Ensure it's exported with the correct name
3. Verify it uses `createInsertSchema()` from drizzle-zod

### Enum Validation Errors
If enum validation fails:
1. Check that enum values in the schema match the database comments
2. Ensure the insert schema includes enum validation using `z.enum()`
3. Verify TypeScript types match the enum values

### Database Connection Errors
If database health check fails:
1. Verify DATABASE_URL is set correctly in `.env.local`
2. Check database credentials
3. Ensure the database is accessible

## Related Documentation

- [Schema Mismatch Resolution](./SCHEMA_MISMATCH_RESOLUTION.md) - Previous schema fixes
- [Database Improvements Summary](./DATABASE_IMPROVEMENTS_SUMMARY.md) - Performance improvements
- [Drizzle ORM Review](./DRIZZLE_ORM_REVIEW.md) - ORM implementation details
- [Database Architecture](./DATABASE_ARCHITECTURE.md) - Overall architecture

## Conclusion

Schema validation is critical for maintaining data integrity and type safety throughout the application. By following these practices and regularly running validation checks, we can catch schema issues early and maintain a robust database layer.

**Status**: ✅ All schema validations implemented and passing
