# Quick Start: Bundle Size Monitoring

## Overview

This guide shows how to use the new bundle size monitoring tools added to the Shuffle & Sync project.

## Commands

### Check Bundle Sizes

After building your project, verify all chunks are within acceptable limits:

```bash
npm run build
npm run build:check-size
```

**Expected Output:**

```
✅ All chunks are within acceptable size limits
✅ Lazy loading is working effectively
```

### Generate Bundle Analysis

Create a visual report of your bundle composition:

```bash
npm run build:analyze
```

This opens `dist/stats.html` in your browser with an interactive treemap showing:

- What's in each chunk
- Size of each dependency
- Which modules are duplicated

### Run Tests

Verify lazy loading functionality:

```bash
npm run test:frontend -- client/src/App.test.tsx
```

## Thresholds

The bundle size checker enforces these limits:

- **Route Chunks**: ≤ 100KB
- **Vendor Chunks**: ≤ 200KB

If any chunk exceeds these limits, the check will fail and suggest optimization.

## CI/CD Integration

Bundle size checks run automatically on:

- ✅ Every pull request
- ✅ Every push to main/develop branches
- ✅ Manual workflow runs

The build will fail if bundle sizes exceed thresholds.

## When to Run These Checks

### During Development

Before committing large features:

```bash
npm run build
npm run build:check-size
```

### Before Pull Requests

Always check before creating a PR:

```bash
npm run build:analyze  # Review visual report
npm run build:check-size  # Verify thresholds
```

### After Adding Dependencies

New dependencies can increase bundle size:

```bash
npm install new-package
npm run build:analyze  # See where the size increased
```

## What to Do If Check Fails

### If a Route Chunk is Too Large (>100KB)

1. **Identify heavy components** in the route
2. **Split into smaller chunks** using dynamic imports:
   ```typescript
   const HeavyComponent = lazy(() => import("./HeavyComponent"));
   ```
3. **Review dependencies** - are you importing entire libraries?
4. **Use tree-shaking** - import only what you need:

   ```typescript
   // ❌ Bad - imports everything
   import _ from "lodash";

   // ✅ Good - imports only what's needed
   import debounce from "lodash/debounce";
   ```

### If a Vendor Chunk is Too Large (>200KB)

1. **Check the bundle analysis** - which dependency is large?
2. **Consider alternatives** - is there a smaller library?
3. **Update manual chunks** in `vite.config.ts`
4. **Lazy load feature dependencies**

## Monitoring Over Time

### Track Bundle Growth

Compare current vs previous builds:

```bash
# Before changes
npm run build:check-size > before.txt

# Make changes
# ...

# After changes
npm run build:check-size > after.txt

# Compare
diff before.txt after.txt
```

### Set Up Alerts

In your CI/CD pipeline, save bundle sizes and alert on growth:

```yaml
- name: Check bundle sizes
  run: |
    npm run build:check-size
    # Optional: Save metrics to monitoring system
```

## Documentation

For more details, see:

- `docs/performance/LAZY_LOADING.md` - Implementation guide
- `docs/performance/PERFORMANCE_REPORT.md` - Performance analysis
- `LAZY_LOADING_SUMMARY.md` - Executive summary

## Troubleshooting

### "No dist directory found"

**Solution**: Run `npm run build` first

```bash
npm run build
npm run build:check-size
```

### "Chunk exceeds threshold"

**Solution**: Follow the optimization steps above or adjust thresholds in `scripts/check-bundle-size.sh`

### "Bundle analyzer won't open"

**Solution**: The stats file is at `dist/stats.html`, open it manually:

```bash
open dist/stats.html  # macOS
xdg-open dist/stats.html  # Linux
start dist/stats.html  # Windows
```

## Questions?

See the full documentation in `docs/performance/` or ask the team!
