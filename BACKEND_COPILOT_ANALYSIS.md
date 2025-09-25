# Backend Copilot Agent Report

Backend Copilot Agent Analysis Summary:
- Files analyzed: 90
- Total issues: 522
  - Errors: 5
  - Warnings: 312
  - Info: 205

Issues by category:
  - typescript: 344
  - express: 11
  - performance: 38
  - drizzle: 98
  - security: 31


## Recommendations

- 🔧 Fix TypeScript errors to improve type safety and prevent runtime issues
- 🚀 Improve Express.js patterns: add error handling, input validation, and proper separation of concerns
- 🗄️ Optimize Drizzle ORM usage: use transactions, proper indexing, and efficient query patterns
- ⚡ Improve performance: add database indexing, implement pagination, optimize queries
- 🔒 Address security vulnerabilities: remove hardcoded credentials, prevent SQL injection

## Detailed Issues

### server/admin/admin.middleware.ts

⚠️ **Line 427**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 433**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 449**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 456**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 463**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 483**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 528**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 529**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 401**: Request body used without validation
   💡 *Add Zod schema validation for request body*

⚠️ **Line 408**: Request body used without validation
   💡 *Add Zod schema validation for request body*

⚠️ **Line 493**: Request body used without validation
   💡 *Add Zod schema validation for request body*

### server/agents/backend-copilot-agent.ts

⚠️ **Line 143**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

ℹ️ **Line 157**: Non-null assertion operator usage
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

### server/auth/session-security.ts

ℹ️ **Line 422**: Non-null assertion operator usage
   💡 *Consider using optional chaining or proper null checks*

⚠️ **Line 488**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 643**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

### server/auth/tokens.ts

⚠️ **Line 539**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 540**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 573**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2512**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2547**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2617**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 3048**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 3663**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 3776**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 3809**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 4746**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 4813**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 4843**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 5442**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

ℹ️ **Line 618**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 618**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 674**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 674**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 742**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 759**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 759**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 764**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 764**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 2403**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 2403**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 2454**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 2454**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 2496**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 2496**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 2527**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 2527**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 2552**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 2552**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 2600**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 2600**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 3886**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 3887**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 3931**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4067**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4194**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4194**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 4313**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4313**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 4358**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4358**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 4437**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4437**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 4466**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4486**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4486**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 4515**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4535**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4535**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 4564**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4575**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4632**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4652**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4652**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 4789**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

🚨 **Line 4897**: Potential N+1 query problem detected
   💡 *Use joins or batch queries instead of queries inside loops*

ℹ️ **Line 4902**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4938**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4938**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 5067**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5067**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 5141**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5193**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5193**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 5344**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

🚨 **Line 5350**: Potential N+1 query problem detected
   💡 *Use joins or batch queries instead of queries inside loops*

ℹ️ **Line 5354**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5364**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5364**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 5391**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5411**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5411**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 5482**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5482**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 5514**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5514**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 5540**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5557**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5557**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 5571**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5571**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 5664**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5676**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5676**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 5735**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5735**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 5783**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5830**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5830**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 5923**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5923**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

⚠️ **Line 2383**: Console.log usage detected
   💡 *Use structured logging instead of console.log*

⚠️ **Line 6043**: Console.log usage detected
   💡 *Use structured logging instead of console.log*

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

ℹ️ **Line 68**: Non-null assertion operator usage
   💡 *Consider using optional chaining or proper null checks*

ℹ️ **Line 94**: Non-null assertion operator usage
   💡 *Consider using optional chaining or proper null checks*

ℹ️ **Line 115**: Non-null assertion operator usage
   💡 *Consider using optional chaining or proper null checks*

ℹ️ **Line 164**: Non-null assertion operator usage
   💡 *Consider using optional chaining or proper null checks*

ℹ️ **Line 186**: Non-null assertion operator usage
   💡 *Consider using optional chaining or proper null checks*

ℹ️ **Line 212**: Non-null assertion operator usage
   💡 *Consider using optional chaining or proper null checks*

⚠️ **Line 225**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

### server/features/game-stats/game-stats.service.ts

⚠️ **Line 242**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

ℹ️ **Line 73**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 148**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 182**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 245**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 286**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

⚠️ **Line 330**: Console.log usage detected
   💡 *Use structured logging instead of console.log*

### server/features/messaging/messaging.types.ts

⚠️ **Line 10**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

### server/features/tournaments/tournaments.service.ts

⚠️ **Line 44**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 729**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 822**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

### server/features/users/users.types.ts

⚠️ **Line 20**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 24**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 36**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

### server/index.ts

⚠️ **Line 501**: Usage of "any" type reduces type safety
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

⚠️ **Line 297**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 307**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

### server/rate-limiting.ts

⚠️ **Line 16**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

### server/repositories/base.repository.ts

⚠️ **Line 28**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 59**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 63**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 391**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 451**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

ℹ️ **Line 78**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 100**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 120**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 126**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 146**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 189**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 251**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 277**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 299**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 306**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 337**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 344**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 367**: Query may benefit from database indexing
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

ℹ️ **Line 2116**: Non-null assertion operator usage
   💡 *Consider using optional chaining or proper null checks*

⚠️ **Line 2210**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2235**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2250**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2262**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2319**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2337**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2362**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2386**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2468**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2512**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2526**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2542**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2555**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2567**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2597**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2624**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2635**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2649**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2707**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2720**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2748**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2765**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2792**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2819**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2857**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

ℹ️ **Line 3438**: Non-null assertion operator usage
   💡 *Consider using optional chaining or proper null checks*

### server/services/ai-algorithm-engine.ts

⚠️ **Line 67**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 68**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 76**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 77**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 78**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 148**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 149**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 207**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 208**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 209**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 210**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 273**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 274**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 357**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 358**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 359**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 360**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 524**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 538**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 555**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 583**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 594**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 606**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 619**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 632**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 648**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 670**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 697**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 698**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 729**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 730**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 746**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 777**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 778**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 812**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 827**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 841**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 855**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 864**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 885**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 902**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 1023**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

### server/services/ai-streaming-matcher.ts

⚠️ **Line 660**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 689**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 699**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 725**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 747**: Usage of "any" type reduces type safety
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

### server/services/cache-service.ts

⚠️ **Line 32**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 144**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 169**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 195**: Usage of "any" type reduces type safety
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

⚠️ **Line 280**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 321**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 368**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 401**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 402**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 416**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 964**: Usage of "any" type reduces type safety
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

⚠️ **Line 684**: Usage of "any" type reduces type safety
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

⚠️ **Line 44**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 406**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 534**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 629**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 660**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 690**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 879**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 897**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 912**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 972**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 986**: Usage of "any" type reduces type safety
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

⚠️ **Line 9**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 117**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 161**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 176**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 224**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 233**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 239**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 248**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 284**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 293**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 299**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 308**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 358**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 408**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 421**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 1036**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 975**: Console.log usage detected
   💡 *Use structured logging instead of console.log*

⚠️ **Line 982**: Console.log usage detected
   💡 *Use structured logging instead of console.log*

⚠️ **Line 1014**: Console.log usage detected
   💡 *Use structured logging instead of console.log*

### server/shared/middleware.ts

⚠️ **Line 6**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

### server/shared/types.ts

⚠️ **Line 10**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 17**: Usage of "any" type reduces type safety
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

⚠️ **Line 539**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 540**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 573**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2512**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2547**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2617**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 3048**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 3663**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 3776**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 3809**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 4746**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 4813**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 4843**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 5442**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

ℹ️ **Line 618**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 618**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 674**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 674**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 742**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 759**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 759**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 764**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 764**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 2403**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 2403**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 2454**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 2454**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 2496**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 2496**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 2527**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 2527**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 2552**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 2552**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 2600**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 2600**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 3886**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 3887**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 3931**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4067**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4194**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4194**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 4313**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4313**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 4358**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4358**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 4437**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4437**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 4466**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4486**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4486**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 4515**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4535**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4535**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 4564**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4575**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4632**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4652**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4652**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 4789**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

🚨 **Line 4897**: Potential N+1 query problem detected
   💡 *Use joins or batch queries instead of queries inside loops*

ℹ️ **Line 4902**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4938**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4938**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 5067**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5067**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 5141**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5193**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5193**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 5344**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

🚨 **Line 5350**: Potential N+1 query problem detected
   💡 *Use joins or batch queries instead of queries inside loops*

ℹ️ **Line 5354**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5364**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5364**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 5391**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5411**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5411**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 5482**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5482**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 5514**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5514**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 5540**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5557**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5557**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 5571**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5571**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 5664**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5676**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5676**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 5736**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5736**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 5784**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5831**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5831**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 5924**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5924**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

⚠️ **Line 2383**: Console.log usage detected
   💡 *Use structured logging instead of console.log*

### server/tests/setup.ts

⚠️ **Line 83**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 84**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 22**: Console.log usage detected
   💡 *Use structured logging instead of console.log*

### server/utils/database.utils.ts

⚠️ **Line 22**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 23**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 218**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 232**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 271**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 298**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 327**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 343**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

### server/features/communities/communities.routes.ts

⚠️ **Line 102**: Request body used without validation
   💡 *Add Zod schema validation for request body*

### server/features/messaging/messaging.routes.ts

⚠️ **Line 33**: Request body used without validation
   💡 *Add Zod schema validation for request body*

⚠️ **Line 95**: Request body used without validation
   💡 *Add Zod schema validation for request body*

### server/features/tournaments/tournaments.routes.ts

⚠️ **Line 55**: Request body used without validation
   💡 *Add Zod schema validation for request body*

⚠️ **Line 57**: Request body used without validation
   💡 *Add Zod schema validation for request body*

⚠️ **Line 58**: Request body used without validation
   💡 *Add Zod schema validation for request body*

⚠️ **Line 149**: Request body used without validation
   💡 *Add Zod schema validation for request body*

⚠️ **Line 207**: Request body used without validation
   💡 *Add Zod schema validation for request body*

### server/repositories/user.repository.ts

ℹ️ **Line 68**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 100**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 150**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 243**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 254**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 265**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 280**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 312**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 327**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 334**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 361**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 375**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 381**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 416**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 453**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

ℹ️ **Line 463**: Query may benefit from database indexing
   💡 *Consider adding database indexes for frequently queried columns*

### server/agents/automated-fixes.ts

⚠️ **Line 240**: Console.log usage detected
   💡 *Use structured logging instead of console.log*

⚠️ **Line 255**: Console.log usage detected
   💡 *Use structured logging instead of console.log*

⚠️ **Line 259**: Console.log usage detected
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

### server/vite.ts

⚠️ **Line 19**: Console.log usage detected
   💡 *Use structured logging instead of console.log*

