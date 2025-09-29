# Backend Copilot Agent Report

Backend Copilot Agent Analysis Summary:
- Files analyzed: 98
- Total issues: 478
  - Errors: 3
  - Warnings: 340
  - Info: 135

Issues by category:
  - typescript: 346
  - express: 11
  - performance: 38
  - drizzle: 51
  - security: 32


## Recommendations

- 🔧 Fix TypeScript errors to improve type safety and prevent runtime issues
- 🚀 Improve Express.js patterns: add error handling, input validation, and proper separation of concerns
- 🗄️ Optimize Drizzle ORM usage: use transactions, proper indexing, and efficient query patterns
- ⚡ Improve performance: add database indexing, implement pagination, optimize queries
- 🔒 Address security vulnerabilities: remove hardcoded credentials, prevent SQL injection

## Detailed Issues

### server/admin/admin.middleware.ts

⚠️ **Line 461**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 467**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 483**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 490**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 497**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 517**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 562**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 563**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 432**: Request body used without validation
   💡 *Add Zod schema validation for request body*

⚠️ **Line 439**: Request body used without validation
   💡 *Add Zod schema validation for request body*

⚠️ **Line 527**: Request body used without validation
   💡 *Add Zod schema validation for request body*

### server/agents/backend-copilot-agent.ts

⚠️ **Line 143**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

ℹ️ **Line 157**: Non-null assertion operator usage
   💡 *Consider using optional chaining or proper null checks*

ℹ️ **Line 397**: Non-null assertion operator usage
   💡 *Consider using optional chaining or proper null checks*

⚠️ **Line 255**: Console.log usage detected
   💡 *Use structured logging instead of console.log*

⚠️ **Line 263**: Console.log usage detected
   💡 *Use structured logging instead of console.log*

### server/agents/drizzle-analyzer.ts

⚠️ **Line 294**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

🚨 **Line 169**: Potential N+1 query problem detected
   💡 *Use joins or batch queries instead of queries inside loops*

⚠️ **Line 294**: Avoid using "any" type in database queries
   💡 *Use proper Drizzle-generated types instead of "any"*

### server/auth/auth.middleware.ts

⚠️ **Line 43**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

### server/auth/session-security.ts

ℹ️ **Line 423**: Non-null assertion operator usage
   💡 *Consider using optional chaining or proper null checks*

⚠️ **Line 489**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 644**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

### server/auth/tokens.ts

⚠️ **Line 285**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

### server/email-service.ts

⚠️ **Line 24**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

ℹ️ **Line 129**: Non-null assertion operator usage
   💡 *Consider using optional chaining or proper null checks*

ℹ️ **Line 255**: Non-null assertion operator usage
   💡 *Consider using optional chaining or proper null checks*

### server/features/auth/auth.service.ts

⚠️ **Line 9**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

### server/features/auth/auth.types.ts

⚠️ **Line 21**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

### server/features/communities/communities.types.ts

⚠️ **Line 12**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

### server/features/game-stats/game-stats.routes.ts

ℹ️ **Line 69**: Non-null assertion operator usage
   💡 *Consider using optional chaining or proper null checks*

ℹ️ **Line 95**: Non-null assertion operator usage
   💡 *Consider using optional chaining or proper null checks*

ℹ️ **Line 116**: Non-null assertion operator usage
   💡 *Consider using optional chaining or proper null checks*

ℹ️ **Line 165**: Non-null assertion operator usage
   💡 *Consider using optional chaining or proper null checks*

ℹ️ **Line 187**: Non-null assertion operator usage
   💡 *Consider using optional chaining or proper null checks*

ℹ️ **Line 213**: Non-null assertion operator usage
   💡 *Consider using optional chaining or proper null checks*

⚠️ **Line 226**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

### server/features/game-stats/game-stats.service.ts

⚠️ **Line 243**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

ℹ️ **Line 74**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 149**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 183**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 246**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 287**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

⚠️ **Line 331**: Console.log usage detected
   💡 *Use structured logging instead of console.log*

### server/features/tournaments/tournaments.service.ts

⚠️ **Line 78**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 765**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 860**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

### server/features/users/users.types.ts

⚠️ **Line 20**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 24**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 36**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

### server/index.ts

⚠️ **Line 572**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

### server/logger.ts

⚠️ **Line 24**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 34**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 49**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 57**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 65**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 74**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

### server/middleware/cache-middleware.ts

⚠️ **Line 60**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 107**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

### server/middleware/error-handling.middleware.ts

⚠️ **Line 95**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 121**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 207**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 240**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 265**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

### server/middleware/index.ts

⚠️ **Line 132**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 143**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 154**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

### server/middleware/performance.middleware.ts

⚠️ **Line 180**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 270**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 305**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

### server/middleware/security.middleware.ts

⚠️ **Line 305**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 315**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

### server/rate-limiting.ts

⚠️ **Line 16**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

### server/repositories/base.repository.ts

⚠️ **Line 62**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 66**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

ℹ️ **Line 81**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 103**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 123**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 129**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 149**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 192**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 254**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 280**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 302**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 309**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 340**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 347**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 370**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 404**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 429**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

### server/routes/database-health.ts

⚠️ **Line 89**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

### server/routes/matching.ts

⚠️ **Line 205**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

### server/routes/webhooks.ts

⚠️ **Line 6**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 7**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 8**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 6**: Console.log usage detected
   💡 *Use structured logging instead of console.log*

### server/routes.ts

ℹ️ **Line 2170**: Non-null assertion operator usage
   💡 *Consider using optional chaining or proper null checks*

⚠️ **Line 2264**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2289**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2304**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2316**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2373**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2391**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2416**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2440**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2522**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2566**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2580**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2596**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2609**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2621**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2651**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2678**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2689**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2703**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2761**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2774**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2802**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2819**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2846**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2873**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

ℹ️ **Line 2951**: Non-null assertion operator usage
   💡 *Consider using optional chaining or proper null checks*

### server/services/ai-algorithm-engine.ts

⚠️ **Line 423**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 424**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 425**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 426**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 590**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 604**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 621**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 649**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 660**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 672**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 685**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 698**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 714**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 736**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 763**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 764**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 795**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 796**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 812**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 843**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 844**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 878**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 893**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 907**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 921**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 930**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 951**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 968**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 1089**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

### server/services/ai-streaming-matcher.ts

⚠️ **Line 670**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 699**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 709**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 735**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 757**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

### server/services/analytics-service.ts

⚠️ **Line 36**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 292**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 293**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 294**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 295**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 296**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 365**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 366**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 483**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 488**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 499**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 509**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

### server/services/backup-service.ts

⚠️ **Line 419**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 544**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

### server/services/collaborative-streaming.ts

⚠️ **Line 7**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 8**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 9**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 135**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 137**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 283**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 324**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 371**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 404**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 405**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 419**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 979**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

### server/services/enhanced-notification.ts

⚠️ **Line 30**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 89**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 118**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 136**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 167**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 183**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 291**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 307**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 324**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 359**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

### server/services/facebook-api.ts

⚠️ **Line 29**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 235**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 278**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 314**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 323**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 463**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 591**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 633**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 172**: Console.log usage detected
   💡 *Use structured logging instead of console.log*

### server/services/infrastructure-test-service.ts

⚠️ **Line 15**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 685**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

### server/services/notification-delivery.ts

⚠️ **Line 48**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 49**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 50**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 413**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

### server/services/notification-templates.ts

⚠️ **Line 34**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 41**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 51**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 64**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 65**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

ℹ️ **Line 263**: Non-null assertion operator usage
   💡 *Consider using optional chaining or proper null checks*

### server/services/platform-oauth.ts

⚠️ **Line 82**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 211**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 265**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 325**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 479**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

### server/services/real-time-matching-api.ts

⚠️ **Line 45**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 406**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 535**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 633**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 664**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 694**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 883**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 901**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 916**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 976**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 990**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

### server/services/streaming-coordinator.ts

⚠️ **Line 359**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 378**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 256**: Console.log usage detected
   💡 *Use structured logging instead of console.log*

⚠️ **Line 260**: Console.log usage detected
   💡 *Use structured logging instead of console.log*

⚠️ **Line 290**: Console.log usage detected
   💡 *Use structured logging instead of console.log*

⚠️ **Line 384**: Console.log usage detected
   💡 *Use structured logging instead of console.log*

⚠️ **Line 388**: Console.log usage detected
   💡 *Use structured logging instead of console.log*

⚠️ **Line 392**: Console.log usage detected
   💡 *Use structured logging instead of console.log*

### server/services/twitch-api.ts

⚠️ **Line 51**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 121**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 382**: Console.log usage detected
   💡 *Use structured logging instead of console.log*

⚠️ **Line 397**: Console.log usage detected
   💡 *Use structured logging instead of console.log*

⚠️ **Line 404**: Console.log usage detected
   💡 *Use structured logging instead of console.log*

### server/services/youtube-api.ts

⚠️ **Line 12**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 120**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 164**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 179**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 227**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 236**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 242**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 251**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 287**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 296**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 302**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 311**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 361**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 411**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 424**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 1047**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

### server/shared/middleware.ts

⚠️ **Line 6**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

### server/shared/types.ts

⚠️ **Line 21**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

### server/shared/utils.ts

⚠️ **Line 6**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

### server/startup-optimization.ts

⚠️ **Line 31**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 90**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

### server/storage.ts

⚠️ **Line 416**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 540**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 541**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 574**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 1456**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 1464**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 1479**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2673**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2681**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2728**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2762**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2832**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2973**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 3005**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 3099**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 3173**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 3199**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 3200**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 3256**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 3257**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 3268**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 3308**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 3343**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 3476**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 3556**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 3634**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 3657**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 3672**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 3680**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 3695**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 3733**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 3865**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 3953**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 4049**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 4066**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 4099**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 4174**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 4224**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 4414**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 5036**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 5103**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 5133**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 5676**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 5737**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 5793**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 5824**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

ℹ️ **Line 619**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 619**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 675**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 675**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 764**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 781**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 781**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 786**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 786**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 2539**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 2539**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 2590**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 2590**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 2636**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 2657**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 2657**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 2716**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 2716**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 2742**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 2742**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 2767**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 2767**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 2815**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 2815**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 4176**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4177**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4221**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4357**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4484**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4484**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 4603**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4603**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 4648**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4648**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 4727**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4727**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 4756**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4776**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4776**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 4805**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4825**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4825**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 4854**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4865**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4922**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4942**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4942**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 5079**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

🚨 **Line 5187**: Potential N+1 query problem detected
   💡 *Use joins or batch queries instead of queries inside loops*

ℹ️ **Line 5192**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5228**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5228**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 5357**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5357**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 5431**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5483**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5483**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 5639**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

🚨 **Line 5645**: Potential N+1 query problem detected
   💡 *Use joins or batch queries instead of queries inside loops*

ℹ️ **Line 5649**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5659**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5659**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 5686**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5706**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5706**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 5777**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5777**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 5809**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5809**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 5835**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5852**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5852**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 5866**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5866**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 5963**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5975**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5975**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 6037**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 6037**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 6085**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 6134**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 6134**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 6227**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 6227**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

### server/tests/setup.ts

⚠️ **Line 84**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 85**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 23**: Console.log usage detected
   💡 *Use structured logging instead of console.log*

### server/utils/database.utils.ts

⚠️ **Line 22**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 23**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 220**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 282**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 321**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 348**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 377**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 393**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 450**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 475**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 492**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 554**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 571**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

### server/utils/production-logger.ts

⚠️ **Line 46**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 65**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 85**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 94**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 134**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 139**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 142**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 145**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

### server/utils/websocket-connection-manager.ts

ℹ️ **Line 121**: Non-null assertion operator usage
   💡 *Consider using optional chaining or proper null checks*

ℹ️ **Line 141**: Non-null assertion operator usage
   💡 *Consider using optional chaining or proper null checks*

⚠️ **Line 166**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 174**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 323**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

### server/utils/websocket-message-validator.ts

⚠️ **Line 203**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 205**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 212**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 245**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 279**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 320**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

### server/utils/websocket-server-enhanced.ts

⚠️ **Line 281**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 319**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 351**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 381**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 403**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 460**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 517**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 535**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

### server/features/communities/communities.routes.ts

⚠️ **Line 115**: Request body used without validation
   💡 *Add Zod schema validation for request body*

### server/features/messaging/messaging.routes.ts

⚠️ **Line 39**: Request body used without validation
   💡 *Add Zod schema validation for request body*

⚠️ **Line 107**: Request body used without validation
   💡 *Add Zod schema validation for request body*

### server/features/tournaments/tournaments.routes.ts

⚠️ **Line 56**: Request body used without validation
   💡 *Add Zod schema validation for request body*

⚠️ **Line 58**: Request body used without validation
   💡 *Add Zod schema validation for request body*

⚠️ **Line 59**: Request body used without validation
   💡 *Add Zod schema validation for request body*

⚠️ **Line 150**: Request body used without validation
   💡 *Add Zod schema validation for request body*

⚠️ **Line 208**: Request body used without validation
   💡 *Add Zod schema validation for request body*

### server/repositories/user.repository.ts

ℹ️ **Line 69**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 101**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 148**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 175**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 266**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 277**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 288**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 303**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 335**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 350**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 357**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 384**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 398**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 404**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 439**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 476**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 486**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

### server/agents/automated-fixes.ts

⚠️ **Line 243**: Console.log usage detected
   💡 *Use structured logging instead of console.log*

⚠️ **Line 258**: Console.log usage detected
   💡 *Use structured logging instead of console.log*

⚠️ **Line 262**: Console.log usage detected
   💡 *Use structured logging instead of console.log*

### server/auth/auth.config.ts

⚠️ **Line 28**: Console.log usage detected
   💡 *Use structured logging instead of console.log*

⚠️ **Line 31**: Console.log usage detected
   💡 *Use structured logging instead of console.log*

⚠️ **Line 37**: Console.log usage detected
   💡 *Use structured logging instead of console.log*

⚠️ **Line 399**: Console.log usage detected
   💡 *Use structured logging instead of console.log*

⚠️ **Line 402**: Console.log usage detected
   💡 *Use structured logging instead of console.log*

### server/email.ts

⚠️ **Line 16**: Console.log usage detected
   💡 *Use structured logging instead of console.log*

### server/env-validation.ts

⚠️ **Line 50**: HTTP URL detected (should use HTTPS)
   💡 *Use HTTPS URLs for production endpoints*

### server/static-server.ts

⚠️ **Line 20**: Console.log usage detected
   💡 *Use structured logging instead of console.log*

⚠️ **Line 43**: Console.log usage detected
   💡 *Use structured logging instead of console.log*

⚠️ **Line 48**: Console.log usage detected
   💡 *Use structured logging instead of console.log*

### server/utils/websocket-env-validation.ts

⚠️ **Line 143**: HTTP URL detected (should use HTTPS)
   💡 *Use HTTPS URLs for production endpoints*

### server/vite.ts

⚠️ **Line 22**: Console.log usage detected
   💡 *Use structured logging instead of console.log*

⚠️ **Line 45**: Console.log usage detected
   💡 *Use structured logging instead of console.log*

⚠️ **Line 50**: Console.log usage detected
   💡 *Use structured logging instead of console.log*

