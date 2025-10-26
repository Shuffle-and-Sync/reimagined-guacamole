# Code Quality Review - Quick Reference Guide

**For:** Development Team  
**Date:** October 26, 2025  
**Purpose:** Quick lookup for common quality issues and fixes

---

## 🚀 Quick Fixes (Do These Now)

### Fix #1: Enable Strict Equality (5 minutes)

**Problem:** 1,453 uses of `==` instead of `===`

**Fix:**

```bash
# Add to eslint.config.js
rules: {
  "eqeqeq": ["error", "always"]
}

# Auto-fix all issues
npx eslint --fix "**/*.{ts,tsx,js,jsx}"
```

**Impact:** Prevents type coercion bugs

---

### Fix #2: Add Pre-commit Hooks (10 minutes)

**Problem:** Quality issues slip through to PRs

**Fix:**

```bash
# Already have husky, just verify .husky/pre-commit:
npm run lint
npm run check
npm test
```

**Impact:** Catches issues before they reach CI

---

### Fix #3: Use Consistent Variable Names (Ongoing)

**Problem:** Abbreviations like `tmp`, `arr`, `obj`, `evt`

**Bad:**

```typescript
const tmp = user.getName();
const arr = users.filter((u) => u.active);
const evt = new CustomEvent("click");
```

**Good:**

```typescript
const userName = user.getName();
const activeUsers = users.filter((u) => u.active);
const clickEvent = new CustomEvent("click");
```

---

## 📁 File Organization

### When to Split Files

**Split if:**

- ✅ File exceeds 500 lines
- ✅ File has multiple responsibilities
- ✅ Hard to find specific functions
- ✅ Test file exceeds 300 lines

**How to split:**

```typescript
// Before: storage.ts (8,772 lines)
export function createUser() {}
export function getUser() {}
export function createEvent() {}
export function getEvent() {}
export function createTournament() {}

// After: Split by domain
// repositories/user.repository.ts
export function createUser() {}
export function getUser() {}

// repositories/event.repository.ts
export function createEvent() {}
export function getEvent() {}

// repositories/tournament.repository.ts
export function createTournament() {}
```

---

## 🔄 Avoiding Code Duplication

### Common Patterns to Extract

#### Pattern #1: Database Queries

**Before (Duplicated 50+ times):**

```typescript
const result = await db.select().from(users).where(eq(users.id, userId));
if (!result || result.length === 0) {
  return res.status(404).json({ error: "User not found" });
}
return result[0];
```

**After (Use utility):**

```typescript
// server/utils/database-helpers.ts
export async function findByIdOrThrow<T>(table: any, id: string, name: string) {
  const result = await db.select().from(table).where(eq(table.id, id));
  if (!result || result.length === 0) {
    throw new NotFoundError(`${name} not found`);
  }
  return result[0];
}

// Usage
const user = await findByIdOrThrow(users, userId, "User");
```

#### Pattern #2: API Responses

**Before (Duplicated 100+ times):**

```typescript
return res.status(200).json({
  success: true,
  data: result,
});

return res.status(404).json({
  error: "Not found",
});
```

**After (Use utility):**

```typescript
// server/utils/api-responses.ts
export class ApiResponse {
  static success(res, data) {
    return res.status(200).json({ success: true, data });
  }

  static notFound(res, message) {
    return res.status(404).json({ error: message });
  }
}

// Usage
return ApiResponse.success(res, result);
return ApiResponse.notFound(res, "User not found");
```

#### Pattern #3: React Data Fetching

**Before (Duplicated 200+ times):**

```typescript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

useEffect(() => {
  setLoading(true);
  fetch("/api/users")
    .then((res) => res.json())
    .then(setData)
    .catch(setError)
    .finally(() => setLoading(false));
}, []);
```

**After (Use custom hook):**

```typescript
// hooks/useApiQuery.ts
export function useApiQuery<T>(endpoint: string) {
  return useQuery({
    queryKey: [endpoint],
    queryFn: async () => {
      const res = await fetch(`/api${endpoint}`);
      if (!res.ok) throw new Error("Request failed");
      return res.json() as Promise<T>;
    },
  });
}

// Usage
const { data, isLoading, error } = useApiQuery("/users");
```

---

## 📝 Documentation Standards

### When to Add JSDoc

**Always document:**

- ✅ Public functions/methods
- ✅ Complex algorithms
- ✅ Functions with >3 parameters
- ✅ Functions with side effects
- ✅ Exported utilities

**Template:**

````typescript
/**
 * Brief description of what the function does
 *
 * More detailed explanation if needed, including:
 * - What problem it solves
 * - Important behavior notes
 * - Any gotchas or limitations
 *
 * @param userId - User's unique identifier
 * @param options - Optional configuration
 * @param options.includeDeleted - Whether to include deleted items
 * @returns Promise resolving to user object or null
 *
 * @throws {NotFoundError} When user doesn't exist
 * @throws {AuthenticationError} When user is not authenticated
 *
 * @example
 * ```typescript
 * const user = await getUser('user123', { includeDeleted: false });
 * ```
 */
export async function getUser(
  userId: string,
  options?: { includeDeleted?: boolean },
): Promise<User | null> {
  // Implementation
}
````

---

## 🧪 Testing Guidelines

### Test Coverage Targets

| File Type    | Target Coverage |
| ------------ | --------------- |
| Repositories | >90%            |
| Services     | >85%            |
| API Routes   | >80%            |
| Components   | >75%            |
| Utilities    | >90%            |

### Test Structure

```typescript
describe("UserRepository", () => {
  describe("findById", () => {
    it("should return user when found", async () => {
      // Arrange
      const userId = "test-user-123";

      // Act
      const user = await userRepository.findById(userId);

      // Assert
      expect(user).toBeDefined();
      expect(user.id).toBe(userId);
    });

    it("should return null when not found", async () => {
      const result = await userRepository.findById("nonexistent");
      expect(result).toBeNull();
    });

    it("should throw on database error", async () => {
      // Mock database error
      await expect(userRepository.findById("error-id")).rejects.toThrow();
    });
  });
});
```

---

## ⚠️ Common Anti-Patterns

### Anti-Pattern #1: God Objects

**Bad:**

```typescript
// storage.ts - 8,772 lines doing everything
export function createUser() {}
export function updateUser() {}
export function deleteUser() {}
export function createEvent() {}
export function updateEvent() {}
export function deleteEvent() {}
// ... 200+ more functions
```

**Good:**

```typescript
// repositories/user.repository.ts - Single responsibility
export class UserRepository {
  async create() {}
  async update() {}
  async delete() {}
}

// repositories/event.repository.ts
export class EventRepository {
  async create() {}
  async update() {}
  async delete() {}
}
```

### Anti-Pattern #2: In-Memory Production Data

**Bad:**

```typescript
const sessions = new Map(); // Lost on restart!
const tokens = {}; // Cannot scale horizontally!
```

**Good:**

```typescript
import Redis from "ioredis";
const redis = new Redis(process.env.REDIS_URL);

// Persisted, scalable storage
await redis.set("session:123", JSON.stringify(session));
```

### Anti-Pattern #3: Hardcoded Mock Data

**Bad:**

```typescript
async getPlatformStatus() {
  return {
    youtube: { isConnected: false }, // TODO: Implement
    facebook: { isConnected: false }, // TODO: Implement
  };
}
```

**Good:**

```typescript
async getPlatformStatus(userId: string) {
  const youtubeToken = await getToken(userId, 'youtube');
  const facebookToken = await getToken(userId, 'facebook');

  return {
    youtube: { isConnected: !!youtubeToken },
    facebook: { isConnected: !!facebookToken },
  };
}
```

---

## 🎯 Code Review Checklist

Before submitting PR, verify:

### Quality

- [ ] No files exceed 500 lines (split if needed)
- [ ] No functions exceed 50 lines (extract if needed)
- [ ] No duplicate code (extract common patterns)
- [ ] Used `===` instead of `==` everywhere
- [ ] All variables have descriptive names
- [ ] No TODO comments without plan/ticket

### Documentation

- [ ] Public functions have JSDoc
- [ ] Complex logic has inline comments
- [ ] README updated if needed
- [ ] API docs updated if needed

### Testing

- [ ] New code has tests
- [ ] All tests pass
- [ ] Coverage hasn't decreased
- [ ] Edge cases covered

### Architecture

- [ ] Follows repository pattern
- [ ] Services use dependency injection
- [ ] No direct database access from routes
- [ ] Errors handled consistently

---

## 📊 Measuring Your Impact

### Before/After Metrics

Track these for your changes:

```typescript
// Before refactoring
File: storage.ts
Lines: 8,772
Functions: 200+
Test time: 45 seconds
Merge conflicts: High

// After refactoring
Files: 15 repositories
Lines per file: <800
Functions per file: <20
Test time: 12 seconds
Merge conflicts: Low
```

### Team Velocity

```
Sprint velocity before: 20 story points
Sprint velocity after: 26 story points (+30%)

Time to implement feature before: 3 days
Time to implement feature after: 2 days (-33%)
```

---

## 🆘 Getting Help

### Resources

1. **Documentation:**
   - [CODE_QUALITY_SCORECARD.md](./CODE_QUALITY_SCORECARD.md)
   - [CODE_QUALITY_IMPROVEMENT_ROADMAP.md](./CODE_QUALITY_IMPROVEMENT_ROADMAP.md)
   - [docs/development/CODING_PATTERNS.md](./docs/development/CODING_PATTERNS.md)

2. **Team Support:**
   - Ask in #code-quality Slack channel
   - Pair programming sessions (Tuesdays/Thursdays)
   - Office hours (Fridays 2-4pm)

3. **Tools:**
   - ESLint for code style
   - TypeScript for type safety
   - Jest for testing
   - Prettier for formatting

---

## 💡 Pro Tips

1. **Start Small:** Don't refactor everything at once
2. **Test First:** Add tests before refactoring
3. **One Thing:** Each PR should do one thing well
4. **Ask for Help:** Code review is collaborative
5. **Document Why:** Explain non-obvious decisions
6. **Consistent Style:** Follow existing patterns
7. **Incremental:** Small improvements compound
8. **Celebrate Wins:** Recognize quality improvements

---

## 🎓 Learning Path

### Week 1: Foundations

- Read CODE_QUALITY_SCORECARD.md
- Review CODING_PATTERNS.md
- Complete "Quick Fixes" above

### Week 2: Patterns

- Study repository pattern examples
- Practice writing JSDoc
- Review PR checklist

### Week 3: Implementation

- Refactor one large file
- Extract common utilities
- Add tests to coverage gaps

### Week 4: Mastery

- Help others with quality
- Review code for patterns
- Suggest improvements

---

**Remember:** Code quality is everyone's responsibility!

Small, consistent improvements lead to big results. 🚀

---

**Last Updated:** October 26, 2025  
**Owner:** Development Team  
**Questions?** Ask in #code-quality
