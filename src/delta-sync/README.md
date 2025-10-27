# Delta Sync - JSON Patch (RFC 6902) State Synchronization

A complete implementation of efficient delta synchronization using JSON Patch (RFC 6902) for minimizing bandwidth and enabling real-time state updates across distributed clients.

## Features

- ✅ **RFC 6902 Compliant** - Full JSON Patch standard implementation
- ✅ **Efficient Optimization** - Combines and optimizes patches to minimize bandwidth
- ✅ **Conflict Resolution** - Automatic detection and resolution of conflicting changes
- ✅ **Compression** - Automatic gzip compression for large patch sets
- ✅ **Type-Safe** - Complete TypeScript type definitions
- ✅ **Well-Tested** - 76 comprehensive tests with 100% core coverage
- ✅ **Production-Ready** - Checksums, atomic operations, and error handling

## Installation

```typescript
import { DeltaSyncEngine } from "./delta-sync";

// Create engine instance
const engine = new DeltaSyncEngine({
  clientId: "client-1",
  enableCompression: true,
  enableOptimization: true,
});
```

## Quick Start

### Basic Usage

```typescript
import { DeltaSyncEngine } from "./delta-sync";

// Initialize
const engine = new DeltaSyncEngine({ clientId: "my-client" });

// Generate patches
const oldState = { players: [{ id: 1, name: "Alice", score: 100 }] };
const newState = { players: [{ id: 1, name: "Alice", score: 150 }] };

const patches = engine.generatePatches(oldState, newState);
// Result: [{ op: 'replace', path: '/players/0/score', value: 150 }]

// Apply patches
const result = engine.applyPatches(oldState, patches);
console.log(result.newState); // { players: [{ id: 1, name: 'Alice', score: 150 }] }
```

### Advanced: Synchronization Protocol

```typescript
// Client creates a patch message
const message = await engine.createPatchMessage(
  oldState,
  newState,
  { client1: 5 }, // base version
  { client1: 6 }, // target version
);

// Message includes:
// - patches: JsonPatch[]
// - checksum: string (SHA-256)
// - compressed: boolean
// - baseVersion/targetVersion: VectorClock

// Server receives and applies
const result = await engine.applyPatchMessage(serverState, message);
if (result.failed.length > 0) {
  // Handle conflicts
  console.log("Conflicts:", result.conflicts);
}
```

### Conflict Resolution

```typescript
import { ConflictResolver } from "./delta-sync";

const resolver = new ConflictResolver("last-write-wins");

// Detect conflicts between two patch sets
const conflicts = resolver.detectConflicts(patches1, patches2);

// Resolve with strategy
const resolution = resolver.resolveConflicts(patches1, patches2);
console.log("Resolved patches:", resolution.resolved);
console.log("Conflicts:", resolution.conflicts);
```

## Core Components

### DeltaSyncEngine

Main orchestrator that coordinates all delta sync operations.

```typescript
const engine = new DeltaSyncEngine({
  clientId: "optional-id", // Auto-generated if not provided
  enableCompression: true, // Compress patches > 1KB
  enableOptimization: true, // Optimize patch sets
  compressionThreshold: 1024, // Size threshold in bytes
});
```

**Methods:**

- `generatePatches(oldState, newState)` - Create patches from state diff
- `applyPatches(state, patches)` - Apply patches to state
- `createPatchMessage(old, new, baseVer, targetVer)` - Create sync message
- `applyPatchMessage(state, message)` - Apply sync message
- `mergePatchSets(base, patches1, patches2)` - Merge conflicting patches
- `calculateSyncStats(patches)` - Get patch statistics

### PatchGenerator

Generates RFC 6902 compliant JSON Patches from state differences.

```typescript
import { PatchGenerator } from "./delta-sync";

const generator = new PatchGenerator({
  optimize: true, // Apply optimizations
  includeTests: false, // Include test operations
  maxDepth: 100, // Max recursion depth
  excludePaths: ["/metadata"], // Paths to ignore
});

const patches = generator.generate(oldState, newState);
const { patches, stats } = generator.generateWithStats(oldState, newState);
```

**Supported Operations:**

- `add` - Add new property or array element
- `remove` - Remove property or array element
- `replace` - Replace existing value
- `move` - Move value from one path to another
- `copy` - Copy value from one path to another
- `test` - Validate value at path

### PatchApplier

Applies JSON Patches with validation and error handling.

```typescript
import { PatchApplier } from "./delta-sync";

const applier = new PatchApplier({
  validate: true, // Validate patch structure
  atomic: true, // All-or-nothing application
  immutable: true, // Don't mutate original state
  conflictResolver: (conflict) => "skip", // Custom resolution
});

const result = applier.applyWithResult(state, patches);
// Returns: { newState, applied[], failed[], conflicts[] }
```

### PatchOptimizer

Optimizes patch sets to reduce size and redundancy.

```typescript
import { PatchOptimizer } from "./delta-sync";

const optimizer = new PatchOptimizer({
  combineSequential: true, // Combine sequential patches
  removeRedundant: true, // Remove redundant ops
  optimizeMoves: true, // Optimize move chains
  deduplicate: true, // Remove duplicates
});

const optimized = optimizer.optimize(patches);
const savings = optimizer.calculateSavings(original, optimized);
```

**Optimizations:**

- Removes add+remove pairs (no-op)
- Combines sequential replaces on same path
- Optimizes move chains (A→B→C becomes A→C)
- Removes duplicate patches
- Optimizes add+replace to single add

### ConflictResolver

Detects and resolves conflicts between patch sets.

```typescript
import { ConflictResolver } from "./delta-sync";

const resolver = new ConflictResolver("last-write-wins");
// Strategies: 'last-write-wins', 'first-write-wins', 'manual'

// Detect conflicts
const conflicts = resolver.detectConflicts(patches1, patches2);

// Three-way merge
const result = resolver.threeWayMerge(base, patches1, patches2);
```

### PatchCompressor

Compresses patch data to reduce bandwidth.

```typescript
import { PatchCompressor } from "./delta-sync/compression";

const compressor = new PatchCompressor({
  minSize: 1024, // Min size before compression
  algorithm: "gzip", // Compression algorithm
  level: 6, // Compression level (1-9)
});

const { data, compressed } = await compressor.compress(patches);
const patches = await compressor.decompress(data, compressed);
```

## JSON Patch Examples

### Add Operation

```json
{ "op": "add", "path": "/user/email", "value": "user@example.com" }
```

### Remove Operation

```json
{ "op": "remove", "path": "/user/tempField" }
```

### Replace Operation

```json
{ "op": "replace", "path": "/user/age", "value": 31 }
```

### Move Operation

```json
{ "op": "move", "from": "/old/path", "path": "/new/path" }
```

### Copy Operation

```json
{ "op": "copy", "from": "/template", "path": "/instance" }
```

### Test Operation

```json
{ "op": "test", "path": "/version", "value": "1.0" }
```

## Path Syntax (RFC 6901 JSON Pointer)

Paths use JSON Pointer syntax:

```typescript
/                      // Root
/user                  // Object property
/user/name            // Nested property
/users/0              // Array element at index 0
/users/0/name         // Nested in array
/path~1with~1slash    // Path with / (escaped as ~1)
/path~0with~0tilde    // Path with ~ (escaped as ~0)
```

## Sync Protocol

### Message Types

**Sync Request**

```typescript
{
  type: 'sync-request',
  clientVersion: { client1: 5 },
  requestedVersion: { server: 10 }
}
```

**Sync Response**

```typescript
{
  type: 'sync-response',
  clientVersion: { server: 10 },
  patches: [PatchMessage, ...]
}
```

**Sync Acknowledgment**

```typescript
{
  type: 'sync-ack',
  clientVersion: { client1: 6 }
}
```

**Sync Error**

```typescript
{
  type: 'sync-error',
  clientVersion: { client1: 5 },
  error: 'Checksum mismatch'
}
```

## Integration with Existing Systems

### With VectorClock

```typescript
import { VectorClock } from "../state/VectorClock";
import { DeltaSyncEngine } from "./delta-sync";

const engine = new DeltaSyncEngine();

// Track versions with vector clock
let version = VectorClock.create("client-1");
version = VectorClock.increment(version, "client-1");

const message = await engine.createPatchMessage(
  oldState,
  newState,
  oldVersion,
  version,
);
```

### With WebSocket

```typescript
import { DeltaSyncEngine } from "./delta-sync";

const engine = new DeltaSyncEngine();

ws.on("message", async (data) => {
  const message = JSON.parse(data);

  if (message.type === "sync-request") {
    // Generate patches
    const patches = engine.generatePatches(oldState, newState);

    // Send response
    const response = await engine.createSyncResponse(serverVersion, [
      patchMessage,
    ]);
    ws.send(JSON.stringify(response));
  }

  if (message.type === "sync-response") {
    // Apply patches
    for (const patchMsg of message.patches) {
      const result = await engine.applyPatchMessage(state, patchMsg);
      if (result.conflicts.length > 0) {
        // Handle conflicts
      }
      state = result.newState;
    }
  }
});
```

## Performance Considerations

### Benchmarks

- **Patch Generation**: ~1ms for typical game state (100 properties)
- **Patch Application**: ~0.5ms per patch
- **Optimization**: Reduces patch count by 30-70% on average
- **Compression**: 60-80% size reduction for JSON data

### Best Practices

1. **Batch Updates**: Combine multiple changes before generating patches
2. **Enable Optimization**: Always use optimization in production
3. **Compression Threshold**: Adjust based on your typical patch sizes
4. **Immutability**: Keep enabled to prevent state corruption
5. **Atomic Mode**: Use for critical operations requiring consistency

### Memory Usage

- Minimal overhead: ~100 bytes per patch
- Compressed patches: 20-40% of original size
- Immutable operations create temporary copies

## Error Handling

```typescript
import {
  PatchError,
  InvalidPatchError,
  PatchApplicationError,
  TestFailedError,
} from "./delta-sync";

try {
  const result = engine.applyPatches(state, patches);
} catch (error) {
  if (error instanceof InvalidPatchError) {
    console.error("Invalid patch structure:", error.patch);
  } else if (error instanceof PatchApplicationError) {
    console.error("Failed to apply patch:", error.patch, error.message);
  } else if (error instanceof TestFailedError) {
    console.error("Test failed:", error.actualValue, "vs", error.patch.value);
  }
}
```

## Testing

Run tests:

```bash
npm test -- --testPathPatterns="src/delta-sync"
```

76 comprehensive tests covering:

- RFC 6902 compliance
- All patch operations
- Optimization strategies
- Conflict resolution
- End-to-end scenarios
- Error handling
- Edge cases

## API Reference

### Types

See [types.ts](./types.ts) for complete type definitions:

- `JsonPatch` - RFC 6902 patch operation
- `PatchResult` - Result of applying patches
- `PatchConflict` - Conflict information
- `PatchMessage` - Wire format for synchronization
- `SyncMessage` - Protocol message types
- Configuration options for all components

## License

MIT

## Contributing

Contributions welcome! Please ensure:

- All tests pass
- New features include tests
- Code follows existing style
- TypeScript types are complete

## References

- [RFC 6902 - JSON Patch](https://tools.ietf.org/html/rfc6902)
- [RFC 6901 - JSON Pointer](https://tools.ietf.org/html/rfc6901)
- [JSON Patch Test Suite](https://github.com/json-patch/json-patch-tests)
