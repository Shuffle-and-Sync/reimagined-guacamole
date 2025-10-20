# Test Templates

This directory contains templates for creating new tests in the Shuffle & Sync platform.

## Available Templates

- `unit-test.template.ts` - Template for unit tests
- `integration-test.template.ts` - Template for integration tests
- `e2e-test.template.ts` - Template for end-to-end tests
- `repository-test.template.ts` - Template for repository/database tests
- `api-test.template.ts` - Template for API endpoint tests
- `service-test.template.ts` - Template for service layer tests

## Usage

1. Copy the appropriate template file
2. Rename it to match your test subject (e.g., `user.repository.test.ts`)
3. Replace the placeholder content with your actual test cases
4. Update imports and descriptions
5. Run the test to verify it works

## Template Structure

All templates follow this structure:

```
1. Imports
2. Test setup (beforeEach, afterEach, etc.)
3. Test groups (describe blocks)
4. Individual tests (test/it blocks)
5. Cleanup
```

## Best Practices

- Use descriptive test names that explain what is being tested
- Follow the AAA pattern: Arrange, Act, Assert
- Keep tests independent and isolated
- Use test utilities and factories for data creation
- Clean up resources after tests
- Group related tests in describe blocks

## Examples

See existing tests in `server/tests/` for real-world examples.
