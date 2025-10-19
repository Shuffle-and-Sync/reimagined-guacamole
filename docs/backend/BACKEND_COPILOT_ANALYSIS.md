# Backend Copilot Agent Report

Backend Copilot Agent Analysis Summary:

- Files analyzed: 91
- Total issues: 508
  - Errors: 5
  - Warnings: 296
  - Info: 207

Issues by category:

- typescript: 333
- express: 11
- performance: 39
- drizzle: 98
- security: 27

## Recommendations

- 🔧 Fix TypeScript errors to improve type safety and prevent runtime issues
- 🚀 Improve Express.js patterns: add error handling, input validation, and proper separation of concerns
- 🗄️ Optimize Drizzle ORM usage: use transactions, proper indexing, and efficient query patterns
- ⚡ Improve performance: add database indexing, implement pagination, optimize queries
- 🔒 Address security vulnerabilities: remove hardcoded credentials, prevent SQL injection

## Detailed Issues

### server/admin/admin.middleware.ts

⚠️ **Line 461**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 467**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 483**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 490**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 497**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 517**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 562**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 563**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 432**: Request body used without validation
💡 _Add Zod schema validation for request body_

⚠️ **Line 439**: Request body used without validation
💡 _Add Zod schema validation for request body_

⚠️ **Line 527**: Request body used without validation
💡 _Add Zod schema validation for request body_

### server/agents/backend-copilot-agent.ts

⚠️ **Line 143**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

ℹ️ **Line 157**: Non-null assertion operator usage
💡 _Consider using optional chaining or proper null checks_

⚠️ **Line 255**: Console.log usage detected
💡 _Use structured logging instead of console.log_

⚠️ **Line 263**: Console.log usage detected
💡 _Use structured logging instead of console.log_

### server/agents/drizzle-analyzer.ts

⚠️ **Line 294**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

🚨 **Line 169**: Potential N+1 query problem detected
💡 _Use joins or batch queries instead of queries inside loops_

⚠️ **Line 294**: Avoid using "any" type in database queries
💡 _Use proper Drizzle-generated types instead of "any"_

### server/auth/session-security.ts

ℹ️ **Line 422**: Non-null assertion operator usage
💡 _Consider using optional chaining or proper null checks_

⚠️ **Line 488**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 643**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

### server/auth/tokens.ts

⚠️ **Line 539**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 540**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 573**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 2512**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 2547**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 2617**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 3048**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 3663**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 3776**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 3809**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 4746**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 4813**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 4843**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 5442**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

ℹ️ **Line 618**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 618**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 674**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 674**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 742**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 759**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 759**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 764**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 764**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 2403**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 2403**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 2454**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 2454**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 2496**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 2496**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 2527**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 2527**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 2552**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 2552**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 2600**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 2600**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 3886**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 3887**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 3931**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 4067**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 4194**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 4194**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 4313**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 4313**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 4358**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 4358**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 4437**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 4437**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 4466**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 4486**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 4486**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 4515**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 4535**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 4535**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 4564**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 4575**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 4632**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 4652**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 4652**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 4789**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

🚨 **Line 4897**: Potential N+1 query problem detected
💡 _Use joins or batch queries instead of queries inside loops_

ℹ️ **Line 4902**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 4938**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 4938**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 5067**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 5067**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 5141**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 5193**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 5193**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 5344**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

🚨 **Line 5350**: Potential N+1 query problem detected
💡 _Use joins or batch queries instead of queries inside loops_

ℹ️ **Line 5354**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 5364**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 5364**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 5391**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 5411**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 5411**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 5482**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 5482**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 5514**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 5514**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 5540**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 5557**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 5557**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 5571**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 5571**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 5664**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 5676**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 5676**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 5735**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 5735**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 5783**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 5830**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 5830**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 5923**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 5923**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

⚠️ **Line 2383**: Console.log usage detected
💡 _Use structured logging instead of console.log_

⚠️ **Line 6043**: Console.log usage detected
💡 _Use structured logging instead of console.log_

### server/email-service.ts

⚠️ **Line 24**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

ℹ️ **Line 129**: Non-null assertion operator usage
💡 _Consider using optional chaining or proper null checks_

ℹ️ **Line 255**: Non-null assertion operator usage
💡 _Consider using optional chaining or proper null checks_

### server/features/auth/auth.service.ts

⚠️ **Line 9**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

### server/features/auth/auth.types.ts

⚠️ **Line 21**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

### server/features/communities/communities.types.ts

⚠️ **Line 12**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

### server/features/game-stats/game-stats.routes.ts

ℹ️ **Line 68**: Non-null assertion operator usage
💡 _Consider using optional chaining or proper null checks_

ℹ️ **Line 94**: Non-null assertion operator usage
💡 _Consider using optional chaining or proper null checks_

ℹ️ **Line 115**: Non-null assertion operator usage
💡 _Consider using optional chaining or proper null checks_

ℹ️ **Line 164**: Non-null assertion operator usage
💡 _Consider using optional chaining or proper null checks_

ℹ️ **Line 186**: Non-null assertion operator usage
💡 _Consider using optional chaining or proper null checks_

ℹ️ **Line 212**: Non-null assertion operator usage
💡 _Consider using optional chaining or proper null checks_

⚠️ **Line 225**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

### server/features/game-stats/game-stats.service.ts

⚠️ **Line 242**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

ℹ️ **Line 73**: Query may benefit from database indexing
💡 _Consider adding database indexes for frequently queried columns_

ℹ️ **Line 148**: Query may benefit from database indexing
💡 _Consider adding database indexes for frequently queried columns_

ℹ️ **Line 182**: Query may benefit from database indexing
💡 _Consider adding database indexes for frequently queried columns_

ℹ️ **Line 245**: Query may benefit from database indexing
💡 _Consider adding database indexes for frequently queried columns_

ℹ️ **Line 286**: Query may benefit from database indexing
💡 _Consider adding database indexes for frequently queried columns_

⚠️ **Line 330**: Console.log usage detected
💡 _Use structured logging instead of console.log_

### server/features/tournaments/tournaments.service.ts

⚠️ **Line 78**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 763**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 856**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

### server/features/users/users.types.ts

⚠️ **Line 20**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 24**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 36**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

### server/index.ts

⚠️ **Line 525**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

### server/logger.ts

⚠️ **Line 24**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 34**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 49**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 57**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 65**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 74**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

### server/middleware/cache-middleware.ts

⚠️ **Line 60**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 107**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

### server/middleware/error-handling.middleware.ts

⚠️ **Line 95**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 121**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 207**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 240**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 265**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

### server/middleware/index.ts

⚠️ **Line 132**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 143**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 154**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

### server/middleware/performance.middleware.ts

⚠️ **Line 180**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 270**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 305**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

### server/middleware/security.middleware.ts

⚠️ **Line 297**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 307**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

### server/rate-limiting.ts

⚠️ **Line 16**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

### server/repositories/base.repository.ts

⚠️ **Line 29**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 60**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 64**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 464**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 481**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 501**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

ℹ️ **Line 79**: Query may benefit from database indexing
💡 _Consider adding database indexes for frequently queried columns_

ℹ️ **Line 101**: Query may benefit from database indexing
💡 _Consider adding database indexes for frequently queried columns_

ℹ️ **Line 121**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 127**: Query may benefit from database indexing
💡 _Consider adding database indexes for frequently queried columns_

ℹ️ **Line 147**: Query may benefit from database indexing
💡 _Consider adding database indexes for frequently queried columns_

ℹ️ **Line 190**: Query may benefit from database indexing
💡 _Consider adding database indexes for frequently queried columns_

ℹ️ **Line 252**: Query may benefit from database indexing
💡 _Consider adding database indexes for frequently queried columns_

ℹ️ **Line 278**: Query may benefit from database indexing
💡 _Consider adding database indexes for frequently queried columns_

ℹ️ **Line 300**: Query may benefit from database indexing
💡 _Consider adding database indexes for frequently queried columns_

ℹ️ **Line 307**: Query may benefit from database indexing
💡 _Consider adding database indexes for frequently queried columns_

ℹ️ **Line 338**: Query may benefit from database indexing
💡 _Consider adding database indexes for frequently queried columns_

ℹ️ **Line 345**: Query may benefit from database indexing
💡 _Consider adding database indexes for frequently queried columns_

ℹ️ **Line 368**: Query may benefit from database indexing
💡 _Consider adding database indexes for frequently queried columns_

ℹ️ **Line 402**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 427**: Query may benefit from database indexing
💡 _Consider adding database indexes for frequently queried columns_

### server/routes/database-health.ts

⚠️ **Line 89**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

### server/routes/matching.ts

⚠️ **Line 205**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

### server/routes/webhooks.ts

⚠️ **Line 6**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 7**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 8**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 6**: Console.log usage detected
💡 _Use structured logging instead of console.log_

### server/routes.ts

ℹ️ **Line 2168**: Non-null assertion operator usage
💡 _Consider using optional chaining or proper null checks_

⚠️ **Line 2262**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 2287**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 2302**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 2314**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 2371**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 2389**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 2414**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 2438**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 2520**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 2564**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 2578**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 2594**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 2607**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 2619**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 2649**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 2676**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 2687**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 2701**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 2759**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 2772**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 2800**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 2817**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 2844**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 2871**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 2909**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

ℹ️ **Line 3494**: Non-null assertion operator usage
💡 _Consider using optional chaining or proper null checks_

### server/services/ai-algorithm-engine.ts

⚠️ **Line 423**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 424**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 425**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 426**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 590**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 604**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 621**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 649**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 660**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 672**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 685**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 698**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 714**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 736**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 763**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 764**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 795**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 796**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 812**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 843**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 844**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 878**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 893**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 907**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 921**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 930**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 951**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 968**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 1089**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

### server/services/ai-streaming-matcher.ts

⚠️ **Line 660**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 689**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 699**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 725**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 747**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

### server/services/analytics-service.ts

⚠️ **Line 36**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 292**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 293**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 294**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 295**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 296**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 365**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 366**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 483**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 488**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 499**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 509**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

### server/services/backup-service.ts

⚠️ **Line 419**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 544**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

### server/services/collaborative-streaming.ts

⚠️ **Line 7**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 8**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 9**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 135**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 137**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 280**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 321**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 368**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 401**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 402**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 416**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 964**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

### server/services/enhanced-notification.ts

⚠️ **Line 30**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 89**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 118**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 136**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 167**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 183**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 291**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 307**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 324**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 359**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

### server/services/facebook-api.ts

⚠️ **Line 29**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 235**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 278**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 314**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 323**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 463**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 591**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 633**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 172**: Console.log usage detected
💡 _Use structured logging instead of console.log_

### server/services/infrastructure-test-service.ts

⚠️ **Line 15**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 684**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

### server/services/notification-delivery.ts

⚠️ **Line 48**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 49**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 50**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 413**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

### server/services/notification-templates.ts

⚠️ **Line 34**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 41**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 51**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 64**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 65**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

ℹ️ **Line 263**: Non-null assertion operator usage
💡 _Consider using optional chaining or proper null checks_

### server/services/platform-oauth.ts

⚠️ **Line 82**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 211**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 265**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 325**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 479**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

### server/services/real-time-matching-api.ts

⚠️ **Line 44**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 406**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 534**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 629**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 660**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 690**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 879**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 897**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 912**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 972**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 986**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

### server/services/streaming-coordinator.ts

⚠️ **Line 359**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 378**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 256**: Console.log usage detected
💡 _Use structured logging instead of console.log_

⚠️ **Line 260**: Console.log usage detected
💡 _Use structured logging instead of console.log_

⚠️ **Line 290**: Console.log usage detected
💡 _Use structured logging instead of console.log_

⚠️ **Line 384**: Console.log usage detected
💡 _Use structured logging instead of console.log_

⚠️ **Line 388**: Console.log usage detected
💡 _Use structured logging instead of console.log_

⚠️ **Line 392**: Console.log usage detected
💡 _Use structured logging instead of console.log_

### server/services/twitch-api.ts

⚠️ **Line 51**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 121**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 382**: Console.log usage detected
💡 _Use structured logging instead of console.log_

⚠️ **Line 397**: Console.log usage detected
💡 _Use structured logging instead of console.log_

⚠️ **Line 404**: Console.log usage detected
💡 _Use structured logging instead of console.log_

### server/services/youtube-api.ts

⚠️ **Line 12**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 120**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 164**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 179**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 227**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 236**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 242**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 251**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 287**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 296**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 302**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 311**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 361**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 411**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 424**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 1047**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

### server/shared/middleware.ts

⚠️ **Line 6**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

### server/shared/types.ts

⚠️ **Line 10**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 17**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

### server/shared/utils.ts

⚠️ **Line 6**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

### server/startup-optimization.ts

⚠️ **Line 31**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 90**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

### server/storage.ts

⚠️ **Line 539**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 540**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 573**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 2512**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 2547**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 2617**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 3050**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 3665**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 3778**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 3811**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 4748**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 4815**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 4845**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 5444**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

ℹ️ **Line 618**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 618**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 674**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 674**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 742**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 759**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 759**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 764**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 764**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 2403**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 2403**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 2454**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 2454**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 2496**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 2496**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 2527**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 2527**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 2552**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 2552**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 2600**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 2600**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 3888**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 3889**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 3933**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 4069**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 4196**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 4196**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 4315**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 4315**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 4360**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 4360**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 4439**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 4439**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 4468**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 4488**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 4488**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 4517**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 4537**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 4537**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 4566**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 4577**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 4634**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 4654**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 4654**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 4791**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

🚨 **Line 4899**: Potential N+1 query problem detected
💡 _Use joins or batch queries instead of queries inside loops_

ℹ️ **Line 4904**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 4940**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 4940**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 5069**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 5069**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 5143**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 5195**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 5195**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 5346**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

🚨 **Line 5352**: Potential N+1 query problem detected
💡 _Use joins or batch queries instead of queries inside loops_

ℹ️ **Line 5356**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 5366**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 5366**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 5393**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 5413**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 5413**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 5484**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 5484**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 5516**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 5516**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 5542**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 5559**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 5559**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 5573**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 5573**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 5670**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 5682**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 5682**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 5744**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 5744**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 5792**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 5841**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 5841**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

ℹ️ **Line 5934**: Consider using eager loading for related data
💡 _Use "with" clause to eagerly load related data and avoid N+1 queries_

ℹ️ **Line 5934**: Query result missing type annotation
💡 _Add explicit type annotation for query results to improve type safety_

### server/tests/setup.ts

⚠️ **Line 83**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 84**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 22**: Console.log usage detected
💡 _Use structured logging instead of console.log_

### server/utils/database.utils.ts

⚠️ **Line 22**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 23**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 218**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 280**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 319**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 346**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 375**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 391**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 448**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 473**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 490**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 552**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

⚠️ **Line 569**: Usage of "any" type reduces type safety
💡 _Use specific types instead of "any"_

### server/features/communities/communities.routes.ts

⚠️ **Line 102**: Request body used without validation
💡 _Add Zod schema validation for request body_

### server/features/messaging/messaging.routes.ts

⚠️ **Line 38**: Request body used without validation
💡 _Add Zod schema validation for request body_

⚠️ **Line 106**: Request body used without validation
💡 _Add Zod schema validation for request body_

### server/features/tournaments/tournaments.routes.ts

⚠️ **Line 55**: Request body used without validation
💡 _Add Zod schema validation for request body_

⚠️ **Line 57**: Request body used without validation
💡 _Add Zod schema validation for request body_

⚠️ **Line 58**: Request body used without validation
💡 _Add Zod schema validation for request body_

⚠️ **Line 149**: Request body used without validation
💡 _Add Zod schema validation for request body_

⚠️ **Line 207**: Request body used without validation
💡 _Add Zod schema validation for request body_

### server/repositories/user.repository.ts

ℹ️ **Line 68**: Query may benefit from database indexing
💡 _Consider adding database indexes for frequently queried columns_

ℹ️ **Line 100**: Query may benefit from database indexing
💡 _Consider adding database indexes for frequently queried columns_

ℹ️ **Line 150**: Query may benefit from database indexing
💡 _Consider adding database indexes for frequently queried columns_

ℹ️ **Line 243**: Query may benefit from database indexing
💡 _Consider adding database indexes for frequently queried columns_

ℹ️ **Line 254**: Query may benefit from database indexing
💡 _Consider adding database indexes for frequently queried columns_

ℹ️ **Line 265**: Query may benefit from database indexing
💡 _Consider adding database indexes for frequently queried columns_

ℹ️ **Line 280**: Query may benefit from database indexing
💡 _Consider adding database indexes for frequently queried columns_

ℹ️ **Line 312**: Query may benefit from database indexing
💡 _Consider adding database indexes for frequently queried columns_

ℹ️ **Line 327**: Query may benefit from database indexing
💡 _Consider adding database indexes for frequently queried columns_

ℹ️ **Line 334**: Query may benefit from database indexing
💡 _Consider adding database indexes for frequently queried columns_

ℹ️ **Line 361**: Query may benefit from database indexing
💡 _Consider adding database indexes for frequently queried columns_

ℹ️ **Line 375**: Query may benefit from database indexing
💡 _Consider adding database indexes for frequently queried columns_

ℹ️ **Line 381**: Query may benefit from database indexing
💡 _Consider adding database indexes for frequently queried columns_

ℹ️ **Line 416**: Query may benefit from database indexing
💡 _Consider adding database indexes for frequently queried columns_

ℹ️ **Line 453**: Query may benefit from database indexing
💡 _Consider adding database indexes for frequently queried columns_

ℹ️ **Line 463**: Query may benefit from database indexing
💡 _Consider adding database indexes for frequently queried columns_

### server/agents/automated-fixes.ts

⚠️ **Line 240**: Console.log usage detected
💡 _Use structured logging instead of console.log_

⚠️ **Line 255**: Console.log usage detected
💡 _Use structured logging instead of console.log_

⚠️ **Line 259**: Console.log usage detected
💡 _Use structured logging instead of console.log_

### server/auth/auth.config.ts

⚠️ **Line 28**: Console.log usage detected
💡 _Use structured logging instead of console.log_

⚠️ **Line 31**: Console.log usage detected
💡 _Use structured logging instead of console.log_

⚠️ **Line 37**: Console.log usage detected
💡 _Use structured logging instead of console.log_

⚠️ **Line 399**: Console.log usage detected
💡 _Use structured logging instead of console.log_

⚠️ **Line 402**: Console.log usage detected
💡 _Use structured logging instead of console.log_

### server/email.ts

⚠️ **Line 16**: Console.log usage detected
💡 _Use structured logging instead of console.log_

### server/vite.ts

⚠️ **Line 19**: Console.log usage detected
💡 _Use structured logging instead of console.log_
