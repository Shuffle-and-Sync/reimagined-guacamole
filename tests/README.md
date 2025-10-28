# Comprehensive Test Strategy

This directory contains comprehensive tests for the synchronization system covering unit tests, integration tests, end-to-end tests, performance benchmarks, and chaos engineering tests.

## Directory Structure

```
tests/
├── unit/                    # Unit tests for individual components
│   ├── StateManager.test.ts      # State management tests
│   └── OTEngine.test.ts          # Operational transformation tests
├── integration/             # Integration tests for complete flows
│   └── SyncFlow.test.ts          # Multi-client sync integration
├── e2e/                    # End-to-end game flow tests
│   └── MTGGame.test.ts           # Complete MTG game scenarios
├── performance/            # Performance benchmarks
│   └── StateUpdates.bench.ts    # State update and OT performance
├── chaos/                  # Chaos engineering tests
│   └── NetworkChaos.test.ts     # Network failure resilience
└── helpers/                # Test utilities and helpers
    └── TestHelpers.ts            # Common test utilities
```

## Running Tests

### Run All Sync Tests

```bash
npm run test:sync:all
```

### Run by Category

**Unit Tests** - Test individual components in isolation:

```bash
npm run test:unit:sync
```

**Integration Tests** - Test complete synchronization flows:

```bash
npm run test:integration:sync
```

**End-to-End Tests** - Test complete game scenarios:

```bash
npm run test:e2e:sync
```

**Performance Tests** - Benchmark performance characteristics:

```bash
npm run test:performance:sync
```

**Chaos Tests** - Test resilience under adverse conditions:

```bash
npm run test:chaos
```

### Run Specific Test Files

```bash
# Run StateManager tests
npm test tests/unit/StateManager.test.ts

# Run OT Engine tests
npm test tests/unit/OTEngine.test.ts

# Run network chaos tests
npm test tests/chaos/NetworkChaos.test.ts
```

### Watch Mode

```bash
npm run test:watch
```

### Coverage

```bash
npm run test:coverage
```

## Test Categories

### 1. Unit Tests

Located in `tests/unit/`, these tests verify individual components in isolation:

- **StateManager** - State creation, updates, versioning, checksum validation, and merging
- **OTEngine** - Operation transformation, conflict resolution, vector clocks, tombstones

**Key Features:**

- Fast execution (< 1ms per test)
- No external dependencies
- High code coverage target (90%+)

### 2. Integration Tests

Located in `tests/integration/`, these tests verify complete synchronization flows:

- Multi-client state synchronization
- Concurrent action handling
- Network partition and recovery
- Operation transformation integration
- State convergence

**Key Features:**

- Test realistic scenarios with multiple clients
- Verify consistency across clients
- Test error handling and recovery

### 3. End-to-End Tests

Located in `tests/e2e/`, these tests simulate complete game flows:

- Complete MTG game from setup through multiple turns
- Combat phases with life changes
- Spell casting and resolution
- Complex turns with multiple operations

**Key Features:**

- Test complete user workflows
- Verify game rule enforcement
- Test edge cases in game flow

### 4. Performance Tests

Located in `tests/performance/`, these tests benchmark system performance:

- State update throughput (target: 1000 updates < 500ms)
- OT transformation speed (target: 1000 ops < 200ms)
- Multi-client scalability (target: 10 clients < 100ms)
- High-frequency operations (target: 100 ops/sec sustained)

**Key Features:**

- Measure execution time
- Verify performance requirements
- Test scalability characteristics
- Memory efficiency validation

### 5. Chaos Engineering Tests

Located in `tests/chaos/`, these tests verify system resilience:

- Random network failures and recovery
- Message loss and out-of-order delivery
- Concurrent client disconnections
- Rapid connect/disconnect cycles
- High load with failures

**Key Features:**

- Simulate adverse conditions
- Verify system eventually converges
- Test failure recovery mechanisms
- Stress test under load

## Test Helpers

The `tests/helpers/TestHelpers.ts` file provides utilities for:

- **wait()** - Delay execution
- **waitFor()** - Wait for conditions
- **waitForConvergence()** - Wait for state convergence
- **createTestState()** - Create test states
- **measureTime()** - Measure execution time
- **benchmark()** - Run performance benchmarks
- **createMockCard()** - Create mock game objects
- **generateRandomOperation()** - Generate random operations for chaos testing

## Writing New Tests

### Unit Test Example

```typescript
import { describe, test, expect, beforeEach } from "@jest/globals";
import { StateManager } from "../../src/state/StateManager";

describe("MyComponent", () => {
  let stateManager: StateManager<TestState>;

  beforeEach(() => {
    stateManager = new StateManager<TestState>("test-client");
  });

  test("should do something", () => {
    const state = stateManager.createState({ value: 0 });
    expect(state.data.value).toBe(0);
  });
});
```

### Integration Test Example

```typescript
import { describe, test, expect } from "@jest/globals";
import { StateManager } from "../../src/state/StateManager";
import { wait } from "../helpers/TestHelpers";

describe("Integration Test", () => {
  test("should sync between clients", async () => {
    const client1 = new StateManager("client1");
    const client2 = new StateManager("client2");

    const state = client1.createState({ value: 0 });
    client2.mergeRemoteState(state);

    await wait(100);

    expect(client1.getState()?.data.value).toBe(client2.getState()?.data.value);
  });
});
```

### Performance Test Example

```typescript
import { describe, test, expect } from "@jest/globals";
import { measureTime } from "../helpers/TestHelpers";

describe("Performance Test", () => {
  test("should complete in < 100ms", async () => {
    const { duration } = await measureTime(() => {
      // Your code here
    });

    expect(duration).toBeLessThan(100);
  });
});
```

## Coverage Goals

- **Unit Tests**: 90%+ coverage of core components
- **Integration Tests**: Cover all major sync flows
- **E2E Tests**: Cover complete user workflows
- **Performance Tests**: Verify all performance requirements
- **Chaos Tests**: Verify resilience to common failures

## CI/CD Integration

Tests are automatically run in CI/CD pipeline:

- All tests must pass before merge
- Performance tests verify benchmarks
- Coverage reports are generated
- Chaos tests run on scheduled basis

## Best Practices

1. **Keep tests focused** - Each test should verify one specific behavior
2. **Use descriptive names** - Test names should clearly describe what is being tested
3. **Clean up after tests** - Use beforeEach/afterEach to ensure clean state
4. **Avoid test interdependencies** - Tests should be able to run in any order
5. **Mock external dependencies** - Unit tests should not depend on external services
6. **Use test helpers** - Reuse common utilities from TestHelpers
7. **Document complex scenarios** - Add comments for complex test logic
8. **Verify both success and failure cases** - Test error handling

## Troubleshooting

### Tests Timing Out

If tests are timing out, increase the timeout:

```typescript
test("my test", async () => {
  // test code
}, 10000); // 10 second timeout
```

### Flaky Tests

If tests are flaky:

- Check for race conditions
- Ensure proper async/await usage
- Use waitFor() instead of fixed delays
- Verify test cleanup

### Performance Test Failures

If performance tests fail:

- Run tests on dedicated hardware
- Check for background processes
- Verify test environment matches CI
- Consider adjusting thresholds

## Contributing

When adding new features:

1. Write unit tests for new components
2. Add integration tests for new flows
3. Update E2E tests for user-facing changes
4. Add performance tests for critical paths
5. Consider chaos tests for network interactions

## Related Documentation

- [Project Architecture](../docs/architecture/PROJECT_ARCHITECTURE.md)
- [Development Guide](../docs/development/DEVELOPMENT_GUIDE.md)
- [Testing Coverage Quality Review](../TESTING_COVERAGE_QUALITY_REVIEW.md)
