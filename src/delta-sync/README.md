# Delta Sync with JSON Patch (RFC 6902)

Efficient delta synchronization using JSON Patch (RFC 6902) standard for real-time state updates across distributed clients.

## Overview

This module implements a complete delta synchronization system that:

- Generates minimal JSON Patches from state changes
- Applies patches atomically with validation
- Optimizes patch sequences for bandwidth efficiency
- Resolves conflicts between concurrent patches
- Compresses patches for network transmission

## Features

- ✅ **RFC 6902 Compliant**: Full implementation of JSON Patch standard
- ✅ **Efficient Diffing**: Generates minimal patch sets from state changes
- ✅ **Atomic Operations**: All-or-nothing patch application with rollback
- ✅ **Patch Optimization**: Combines, deduplicates, and optimizes patches
- ✅ **Conflict Resolution**: Three-way merge for concurrent patches
- ✅ **Compression**: Automatic gzip compression for large patches
- ✅ **Type Safe**: Full TypeScript support with comprehensive types
- ✅ **Immutable**: Original state never modified
- ✅ **Tested**: 58 tests covering all operations and edge cases

## Installation

```typescript
import { DeltaSyncEngine } from "./src/delta-sync";
```

## Quick Start

```typescript
import { DeltaSyncEngine } from "./src/delta-sync";

// Create engine instance
const engine = new DeltaSyncEngine();

// Generate patches from state changes
const oldState = { user: { name: "Alice", score: 100 } };
const newState = { user: { name: "Alice", score: 150 } };

const patches = engine.generatePatches(oldState, newState);
// Output: [{ op: "replace", path: "/user/score", value: 150 }]

// Apply patches to state
const result = engine.applyPatches(oldState, patches);
console.log(result.newState); // { user: { name: "Alice", score: 150 } }
```

## Core Components

### DeltaSyncEngine

Main orchestration engine that coordinates all delta sync operations.

```typescript
const engine = new DeltaSyncEngine({
  generator: { optimize: true, maxDepth: 100 },
  applier: { validate: true, atomic: true },
  optimizer: { combineSequential: true, removeRedundant: true },
  resolver: { defaultResolution: "skip", autoResolve: true },
  compressor: { threshold: 1024, level: 6 },
});
```

### PatchGenerator

Generates RFC 6902-compliant JSON Patches from state differences.

```typescript
import { PatchGenerator } from "./src/delta-sync";

const generator = new PatchGenerator({ maxDepth: 100 });
const patches = generator.generate(oldState, newState);
```

**Supported Operations:**

- `add` - Add new property or array element
- `remove` - Remove property or array element
- `replace` - Replace existing value
- `move` - Move value from one path to another
- `copy` - Copy value from one path to another
- `test` - Test that value at path matches expected

### PatchApplier

Applies patches to state with validation and atomic operations.

```typescript
import { PatchApplier } from "./src/delta-sync";

const applier = new PatchApplier({
  validate: true, // Validate patches before applying
  atomic: true, // All-or-nothing application
});

const result = applier.apply(state, patches);
```

**Result Structure:**

```typescript
{
  newState: T,              // Updated state
  applied: JsonPatch[],     // Successfully applied patches
  failed: JsonPatch[],      // Failed patches
  conflicts: PatchConflict[] // Conflicts encountered
}
```

### PatchOptimizer

Optimizes patch sequences to minimize bandwidth.

```typescript
import { PatchOptimizer } from "./src/delta-sync";

const optimizer = new PatchOptimizer({
  combineSequential: true, // Combine sequential patches to same path
  removeRedundant: true, // Remove redundant patches (add then remove)
  optimizeMoves: true, // Optimize move operations
  deduplicate: true, // Remove duplicate patches
});

const optimized = optimizer.optimize(patches);
```

**Optimizations:**

- Combines multiple replace operations to the same path
- Removes add/remove pairs that cancel out
- Optimizes move chains (A→B→C becomes A→C)
- Deduplicates identical patches

### ConflictResolver

Resolves conflicts between concurrent patch sets.

```typescript
import { ConflictResolver } from "./src/delta-sync";

const resolver = new ConflictResolver({
  defaultResolution: "skip", // or 'retry', 'merge'
  autoResolve: true,
});

// Three-way merge
const merged = resolver.threeWayMerge(base, patches1, patches2);

// Detect conflicts
const conflicts = resolver.detectConflicts(patches1, patches2);
```

**Resolution Strategies:**

- `skip` - Skip conflicting patches
- `retry` - Apply conflicting patches (last write wins)
- `merge` - Attempt to merge patches intelligently

### PatchCompressor

Compresses patches for network transmission.

```typescript
import { PatchCompressor } from "./src/delta-sync/compression";

const compressor = new PatchCompressor({
  threshold: 1024, // Minimum size (bytes) to compress
  level: 6, // Compression level (1-9)
});

const { data, compressed } = compressor.compress(patches);
const decompressed = compressor.decompress(data, compressed);
```

## Usage Examples

### Basic State Synchronization

```typescript
const engine = new DeltaSyncEngine();

// Client 1: Make changes
const oldState = { counter: 0 };
const newState = { counter: 1 };
const patches = engine.generatePatches(oldState, newState);

// Send patches to server...

// Client 2: Apply patches
const result = engine.applyPatches(oldState, patches);
console.log(result.newState); // { counter: 1 }
```

### Network Transmission

```typescript
import { VectorClock } from "../state/VectorClock";

const engine = new DeltaSyncEngine();

// Create patch message with versioning
const patches = engine.generatePatches(oldState, newState);
const message = engine.createPatchMessage(
  patches,
  VectorClock.create("client1"),
  VectorClock.increment(VectorClock.create("client1"), "client1"),
);

// Verify integrity
if (engine.verifyPatchMessage(message)) {
  // Apply patches
  const result = engine.applyPatches(state, message.patches);
}
```

### Conflict Resolution

```typescript
const engine = new DeltaSyncEngine();

// Two clients modify same state concurrently
const base = { value: 1 };
const patches1 = [{ op: "replace", path: "/value", value: 2 }]; // Client 1
const patches2 = [{ op: "replace", path: "/value", value: 3 }]; // Client 2

// Merge conflicting patches
const merged = engine.mergePatchSets(base, patches1, patches2);
const result = engine.applyPatches(base, merged);
```

### Large State Changes

```typescript
const engine = new DeltaSyncEngine();

// Handle large state efficiently
const oldState = {
  users: Array.from({ length: 1000 }, (_, i) => ({ id: i, score: i * 10 })),
};
const newState = {
  users: oldState.users.map((u) => ({ ...u, score: u.score + 1 })),
};

// Generate optimized patches
const patches = engine.generatePatches(oldState, newState);

// Check compression savings
const savings = engine.calculateCompressionSavings(patches);
console.log(`Compression: ${savings.savingsPercent.toFixed(1)}%`);
```

## JSON Patch Operations

### Add Operation

Adds a new value to the target location.

```typescript
// Add property to object
{ op: "add", path: "/newProp", value: "value" }

// Add item to array
{ op: "add", path: "/array/2", value: "item" }

// Add to end of array
{ op: "add", path: "/array/-", value: "item" }
```

### Remove Operation

Removes the value at the target location.

```typescript
// Remove property from object
{ op: "remove", path: "/prop" }

// Remove item from array
{ op: "remove", path: "/array/1" }
```

### Replace Operation

Replaces the value at the target location.

```typescript
// Replace property value
{ op: "replace", path: "/prop", value: "newValue" }

// Replace array item
{ op: "replace", path: "/array/0", value: "newItem" }
```

### Move Operation

Moves a value from one location to another.

```typescript
// Move property
{ op: "move", from: "/oldProp", path: "/newProp" }

// Move array item
{ op: "move", from: "/array/0", path: "/array/2" }
```

### Copy Operation

Copies a value from one location to another.

```typescript
// Copy property
{ op: "copy", from: "/source", path: "/destination" }
```

### Test Operation

Tests that a value at the target location is equal to a specified value.

```typescript
// Test property value
{ op: "test", path: "/prop", value: "expectedValue" }
```

## RFC 6902 Compliance

This implementation fully complies with RFC 6902:

- ✅ All six operations (add, remove, replace, move, copy, test)
- ✅ JSON Pointer path format (RFC 6901)
- ✅ Special character escaping (~ and /)
- ✅ Array index handling including "-" for end
- ✅ Error handling for invalid operations
- ✅ Test operation for conditional patches

### Path Format (RFC 6901)

Paths use JSON Pointer notation:

```typescript
"/user/name"; // Object property
"/users/0/name"; // Array index then property
"/array/-"; // End of array
"/prop~0name"; // Property containing ~ (escaped as ~0)
"/prop~1name"; // Property containing / (escaped as ~1)
```

## Performance

The implementation is optimized for performance:

- **Patch Generation**: O(n) where n is the number of changed nodes
- **Patch Application**: O(m) where m is the number of patches
- **Optimization**: O(m) for patch set optimization
- **Compression**: Automatic for patches > 1KB

### Benchmarks

```
Generate patches (100 changes):     ~5ms
Apply patches (100 operations):     ~3ms
Optimize patches (100 patches):     ~2ms
Compression (10KB patches):         ~5ms
```

## Integration with Existing Systems

### With VectorClock

```typescript
import { VectorClock } from "../state/VectorClock";
import { DeltaSyncEngine } from "../delta-sync";

const engine = new DeltaSyncEngine();
const clock = VectorClock.create("client1");

// Include version with patches
const message = engine.createPatchMessage(
  patches,
  clock,
  VectorClock.increment(clock, "client1"),
);
```

### With WebSocket

```typescript
import { DeltaSyncEngine } from "../delta-sync";

const engine = new DeltaSyncEngine();

// Send patches over WebSocket
ws.on("stateChange", (oldState, newState) => {
  const patches = engine.generatePatches(oldState, newState);
  const message = engine.createPatchMessage(
    patches,
    baseVersion,
    targetVersion,
  );
  ws.send(JSON.stringify(message));
});

// Receive and apply patches
ws.on("message", (data) => {
  const message = JSON.parse(data);
  if (engine.verifyPatchMessage(message)) {
    const result = engine.applyPatches(currentState, message.patches);
    currentState = result.newState;
  }
});
```

## Error Handling

```typescript
const engine = new DeltaSyncEngine();

try {
  const result = engine.applyPatches(state, patches);

  if (result.failed.length > 0) {
    console.error("Some patches failed:", result.failed);
    console.error("Conflicts:", result.conflicts);
  }

  if (result.applied.length === patches.length) {
    console.log("All patches applied successfully");
  }
} catch (error) {
  console.error("Fatal error applying patches:", error);
}
```

## Testing

Run the test suite:

```bash
npm test -- --testPathPatterns="delta-sync"
```

The module includes 58 tests covering:

- Basic operations (add, remove, replace, move, copy, test)
- Array operations and edge cases
- Nested object handling
- RFC 6902 compliance
- Optimization algorithms
- Conflict resolution
- Compression
- Performance benchmarks

## API Reference

### Types

```typescript
interface JsonPatch {
  op: "add" | "remove" | "replace" | "move" | "copy" | "test";
  path: string;
  value?: any;
  from?: string;
}

interface PatchResult<T> {
  newState: T;
  applied: JsonPatch[];
  failed: JsonPatch[];
  conflicts: PatchConflict[];
}

interface PatchMessage {
  id: string;
  baseVersion: VectorClock;
  targetVersion: VectorClock;
  patches: JsonPatch[];
  checksum: string;
  compressed: boolean;
}
```

## Best Practices

1. **Use Atomic Mode**: Always use atomic mode for critical state updates
2. **Validate Patches**: Enable validation to catch errors early
3. **Optimize First**: Let the optimizer run before sending patches
4. **Check Integrity**: Always verify patch messages with checksums
5. **Handle Conflicts**: Implement appropriate conflict resolution strategy
6. **Compress Large Patches**: Use compression for patches > 1KB
7. **Version Everything**: Use VectorClock for causality tracking
8. **Test Operations**: Use test operations for conditional updates

## Contributing

When contributing to this module:

- Maintain RFC 6902 compliance
- Add tests for new features
- Ensure TypeScript types are accurate
- Follow existing code patterns
- Update documentation

## License

MIT

## References

- [RFC 6902: JSON Patch](https://tools.ietf.org/html/rfc6902)
- [RFC 6901: JSON Pointer](https://tools.ietf.org/html/rfc6901)
- [JSON Patch Operations](https://jsonpatch.com/)
