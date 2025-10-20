# Branch Protection & CI/CD Gates

**Version**: 1.0.0  
**Date**: October 20, 2025  
**Status**: Active

---

## Overview

This document defines the branch protection rules and CI/CD gates that enforce code quality and testing standards for the Shuffle & Sync repository.

---

## Branch Protection Rules

### Main Branch (`main`)

The `main` branch represents production-ready code and has the strictest protection rules.

#### Required Status Checks

All of the following checks must pass before merging:

- ✅ **test / lint-and-typecheck** - ESLint and TypeScript validation
- ✅ **test / unit-tests** - Unit test suite execution
- ✅ **test / integration-tests** - Integration test suite execution
- ✅ **test / security-tests** - Security test suite execution
- ✅ **test / full-coverage** - Complete test suite with coverage reporting
- ✅ **test / build-check** - Build verification

**Configuration:**

```json
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "test / lint-and-typecheck",
      "test / unit-tests",
      "test / integration-tests",
      "test / security-tests",
      "test / full-coverage",
      "test / build-check"
    ]
  }
}
```

#### Pull Request Requirements

- **Required Approving Reviews**: 1 approval required
- **Dismiss Stale Reviews**: Yes (when new commits are pushed)
- **Require Review from Code Owners**: Yes (if CODEOWNERS file exists)
- **Require Conversation Resolution**: Yes (all review comments must be resolved)

**Configuration:**

```json
{
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true,
    "require_last_push_approval": false
  }
}
```

#### Additional Rules

- **Require Linear History**: No (allow merge commits)
- **Require Signed Commits**: No (recommended but not enforced)
- **Enforce for Administrators**: No (allows emergency fixes)
- **Restrict Pushes**: Yes (only via pull requests)
- **Restrict Force Pushes**: Yes (prevents history rewriting)
- **Restrict Deletions**: Yes (prevents accidental deletion)

**Configuration:**

```json
{
  "enforce_admins": false,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_signatures": false
}
```

### Develop Branch (`develop`)

The `develop` branch is for integration of features before release to production.

#### Required Status Checks

- ✅ **test / lint-and-typecheck**
- ✅ **test / unit-tests**
- ✅ **test / integration-tests**
- ✅ **test / full-coverage**
- ✅ **test / build-check**

**Note**: Security tests are recommended but not strictly required for `develop`.

#### Pull Request Requirements

- **Required Approving Reviews**: 1 approval required
- **Dismiss Stale Reviews**: Yes

### Feature Branches (`feature/**`, `fix/**`)

Feature and fix branches have lighter protection to enable faster development.

#### Required Status Checks

- ✅ **test / lint-and-typecheck**
- ✅ **test / unit-tests**

**Note**: Integration and E2E tests are run but not required to pass (allows work in progress).

#### Pull Request Requirements

- **Required Approving Reviews**: 0 (self-merge allowed)
- **Allow Force Pushes**: Yes (for rebasing during development)

---

## CI/CD Test Gates

### Test Execution Stages

The CI/CD pipeline runs tests in stages to provide fast feedback:

```
┌─────────────────────────────────────────────┐
│  Stage 1: Fast Feedback (2-3 minutes)      │
│  - Linting                                  │
│  - Type Checking                            │
│  Status: REQUIRED ✅                        │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Stage 2: Unit Tests (5-10 minutes)        │
│  - Isolated unit tests                      │
│  - No external dependencies                 │
│  Status: REQUIRED ✅                        │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Stage 3: Integration Tests (10-15 min)    │
│  - Database operations                      │
│  - Service interactions                     │
│  - API contracts                            │
│  Status: REQUIRED ✅                        │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Stage 4: Security Tests (5-10 minutes)    │
│  - Security test suite                      │
│  - NPM audit                                │
│  Status: REQUIRED ✅                        │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Stage 5: Full Coverage (15-20 minutes)    │
│  - Complete test suite                      │
│  - Coverage reporting                       │
│  - Threshold verification                   │
│  Status: REQUIRED ✅                        │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Stage 6: Build Verification (5-10 min)    │
│  - Production build                         │
│  - Artifact verification                    │
│  Status: REQUIRED ✅                        │
└─────────────────────────────────────────────┘
```

### Coverage Requirements

#### Overall Coverage Thresholds

**Minimum Thresholds (enforced in `jest.config.js`):**

```javascript
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80
  }
}
```

**Critical Path Thresholds (enforced for specific directories):**

```javascript
coverageThreshold: {
  './server/auth/**/*.ts': {
    branches: 90,
    functions: 90,
    lines: 90,
    statements: 90
  },
  './server/repositories/**/*.ts': {
    branches: 90,
    functions: 90,
    lines: 90,
    statements: 90
  },
  './server/features/tournaments/**/*.ts': {
    branches: 85,
    functions: 85,
    lines: 85,
    statements: 85
  }
}
```

#### PR-Specific Coverage Rules

**For Pull Requests:**

1. **No Coverage Decrease**: PR cannot reduce overall coverage
   - Calculated by comparing coverage between base and head branches
   - Fails if coverage drops by more than 0.5%

2. **New Code Coverage**: New/modified code must meet threshold
   - Files added in PR: ≥80% coverage required
   - Files modified in PR: coverage must not decrease
   - Critical paths: ≥90% coverage required

3. **Coverage Report**: Automatically posted as PR comment
   - Shows before/after coverage comparison
   - Highlights files with coverage changes
   - Links to full coverage report

**Example PR Comment:**

```markdown
## Test Coverage Report

### Summary

- **Overall Coverage**: 82.5% (+2.3% from base)
- **New Files**: 3 files, 85.2% average coverage
- **Modified Files**: 5 files, coverage maintained or improved

### Coverage by Category

| Category   | Base  | PR    | Change   |
| ---------- | ----- | ----- | -------- |
| Statements | 80.2% | 82.5% | +2.3% ✅ |
| Branches   | 78.5% | 81.0% | +2.5% ✅ |
| Functions  | 81.0% | 83.2% | +2.2% ✅ |
| Lines      | 80.5% | 82.8% | +2.3% ✅ |

✅ All coverage requirements met!
```

### Automatic Failure Conditions

PRs will **automatically fail** CI if:

- ❌ Any test fails
- ❌ Linting errors exist
- ❌ TypeScript compilation errors
- ❌ Overall coverage below 80%
- ❌ Critical path coverage below 90%
- ❌ New code coverage below 80%
- ❌ Coverage decreases by more than 0.5%
- ❌ Build fails
- ❌ Security vulnerabilities (high or critical)

### Manual Review Requirements

Even if all automated checks pass, PRs require manual review for:

- Code quality and design
- Test quality (not just quantity)
- Edge case coverage
- Error handling
- Documentation updates
- Security considerations

---

## Test Quality Standards

### What Makes a Good Test

✅ **Good Tests:**

- Test behavior, not implementation
- Are independent (no shared state)
- Have clear, descriptive names
- Follow AAA pattern (Arrange, Act, Assert)
- Test one thing per test
- Are fast (<100ms for unit, <500ms for integration)
- Use realistic test data
- Test edge cases and errors

❌ **Poor Tests:**

- Test internal implementation details
- Depend on execution order
- Have vague names like "test 1"
- Mix setup, execution, and assertions
- Test multiple unrelated things
- Are slow or flaky
- Use unrealistic test data
- Only test happy paths

### Example: Good vs Poor Test

**❌ Poor Test:**

```typescript
test("test user", async () => {
  const u = { e: "test@test.com", p: "123" };
  const r = await userService.create(u);
  expect(r).toBeTruthy();
  const r2 = await userService.findById(r.id);
  expect(r2.e).toBe("test@test.com");
  const r3 = await userService.delete(r.id);
  expect(r3).toBe(true);
});
```

**Issues:**

- Tests multiple things (create, find, delete)
- Poor naming (u, r, r2, r3)
- Weak assertions (.toBeTruthy())
- Leaves test data in database

**✅ Good Test:**

```typescript
describe("UserService", () => {
  afterEach(async () => {
    await resetTestDatabase();
  });

  describe("create", () => {
    test("should create user with valid data", async () => {
      // Arrange
      const userData = createTestUser({
        email: "newuser@example.com",
        password: "SecurePass123!",
      });

      // Act
      const createdUser = await userService.create(userData);

      // Assert
      expect(createdUser).toMatchObject({
        email: "newuser@example.com",
        role: "user",
      });
      expect(createdUser.id).toBeDefined();
      expect(createdUser.password).not.toBe(userData.password); // Should be hashed
    });

    test("should reject duplicate email", async () => {
      // Arrange
      const userData = createTestUser({ email: "existing@example.com" });
      await userService.create(userData);

      // Act & Assert
      await expect(userService.create(userData)).rejects.toThrow(
        "Email already exists",
      );
    });
  });
});
```

**Improvements:**

- Tests one thing per test
- Clear, descriptive names
- Strong, specific assertions
- Proper cleanup
- Tests both success and error cases

---

## Exemptions and Exceptions

### Coverage Exemption Process

In rare cases, code may be exempt from coverage requirements:

**Valid Exemption Reasons:**

- Code is deprecated and scheduled for removal
- External library type definitions
- Generated code (migrations, etc.)
- Configuration files
- Development/debugging utilities

**Exemption Process:**

1. Add `/* istanbul ignore next */` comment before code
2. Document reason in code comment
3. Get approval in PR review
4. Add to exemptions list in this document

**Example:**

```typescript
/* istanbul ignore next - Deprecated, will be removed in v2.0 */
export function legacyFunction() {
  // Old implementation
}
```

### CI Bypass (Emergency Only)

In critical situations (production outage), CI can be bypassed:

**Requirements:**

- Must be a P0 production incident
- Must have approval from Tech Lead or above
- Must create follow-up issue to add tests
- Must document decision in incident report

**Process:**

1. Create hotfix branch from `main`
2. Apply fix
3. Push with `[skip ci]` in commit message
4. Deploy to production
5. Create issue to add tests
6. Add tests in follow-up PR

**Note**: This should be extremely rare (<1% of deployments).

---

## Monitoring and Metrics

### Coverage Trends

Track coverage trends over time:

- **Daily**: Automated coverage reports
- **Weekly**: Coverage trend analysis
- **Monthly**: Coverage gap identification
- **Quarterly**: Strategy review and adjustments

### Quality Metrics Dashboard

Monitor in CI/CD dashboard:

- Test pass rate (target: 100%)
- Flaky test rate (target: <1%)
- Test execution time (target: <10 minutes)
- Coverage percentage (target: 85%+)
- PRs blocked by tests (track to identify issues)

---

## References

- [TESTING_STRATEGY.md](./TESTING_STRATEGY.md) - Overall testing approach
- [TESTING_ROADMAP.md](./TESTING_ROADMAP.md) - Implementation timeline
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines
- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)

---

## Updating This Document

This document should be reviewed and updated:

- When adding new CI/CD checks
- When changing coverage thresholds
- When modifying branch protection rules
- Quarterly as part of testing strategy review

**Document Owner**: DevOps Team & Tech Lead  
**Last Updated**: October 20, 2025  
**Next Review**: January 20, 2026
