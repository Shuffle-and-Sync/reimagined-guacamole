# Backend Copilot Agent Report

Backend Copilot Agent Analysis Summary:
- Files analyzed: 90
- Total issues: 511
  - Errors: 5
  - Warnings: 299
  - Info: 207

Issues by category:
  - typescript: 332
  - express: 11
  - performance: 39
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

⚠️ **Line 439**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 445**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 461**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 468**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 475**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 495**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 540**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 541**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 413**: Request body used without validation
   💡 *Add Zod schema validation for request body*

⚠️ **Line 420**: Request body used without validation
   💡 *Add Zod schema validation for request body*

⚠️ **Line 505**: Request body used without validation
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

⚠️ **Line 463**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 480**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 500**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 560**: Usage of "any" type reduces type safety
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

ℹ️ **Line 401**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 426**: Query may benefit from database indexing
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

ℹ️ **Line 2168**: Non-null assertion operator usage
   💡 *Consider using optional chaining or proper null checks*

⚠️ **Line 2262**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2287**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2302**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2314**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2371**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2389**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2414**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2438**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2520**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2564**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2578**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2594**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2607**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2619**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2649**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2676**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2687**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2701**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2759**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2772**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2800**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2817**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2844**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2871**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 2909**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

ℹ️ **Line 3494**: Non-null assertion operator usage
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

⚠️ **Line 3050**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 3665**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 3778**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 3811**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 4748**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 4815**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 4845**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 5444**: Usage of "any" type reduces type safety
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

ℹ️ **Line 3888**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 3889**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 3933**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4069**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4196**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4196**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 4315**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4315**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 4360**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4360**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 4439**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4439**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 4468**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4488**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4488**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 4517**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4537**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4537**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 4566**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4577**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4634**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4654**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4654**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 4791**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

🚨 **Line 4899**: Potential N+1 query problem detected
   💡 *Use joins or batch queries instead of queries inside loops*

ℹ️ **Line 4904**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4940**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 4940**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 5069**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5069**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 5143**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5195**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5195**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 5346**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

🚨 **Line 5352**: Potential N+1 query problem detected
   💡 *Use joins or batch queries instead of queries inside loops*

ℹ️ **Line 5356**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5366**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5366**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 5393**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5413**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5413**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 5484**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5484**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 5516**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5516**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 5542**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5559**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5559**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 5573**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5573**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 5670**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5682**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5682**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 5744**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5744**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 5792**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5841**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5841**: Query result missing type annotation
   💡 *Add explicit type annotation for query results to improve type safety*

ℹ️ **Line 5934**: Consider using eager loading for related data
   💡 *Use "with" clause to eagerly load related data and avoid N+1 queries*

ℹ️ **Line 5934**: Query result missing type annotation
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

⚠️ **Line 400**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 425**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

⚠️ **Line 442**: Usage of "any" type reduces type safety
   💡 *Use specific types instead of "any"*

### server/features/communities/communities.routes.ts

⚠️ **Line 102**: Request body used without validation
   💡 *Add Zod schema validation for request body*

### server/features/messaging/messaging.routes.ts

⚠️ **Line 38**: Request body used without validation
   💡 *Add Zod schema validation for request body*

⚠️ **Line 106**: Request body used without validation
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

