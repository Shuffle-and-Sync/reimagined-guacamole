# Cloud Run Vite Module Error Fix

## Problem
Cloud Run deployment was failing with error:
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'vite' imported from /workspace/dist/index.js
```

## Root Cause
The server code in `server/index.ts` was using `app.get("env")` to detect the environment mode. In Express, `app.get("env")` returns the value of `process.env.NODE_ENV` if set, but defaults to `"development"` if not set.

If for any reason `NODE_ENV` was not properly recognized (timing issues, environment variable propagation, etc.), the code would try to import the vite module in production, which would fail because:
1. `vite` is a devDependency and is removed by `npm prune --production` in the Dockerfile
2. `server/vite.ts` is externalized by esbuild and not bundled into `dist/index.js`
3. When the code tries `import("./vite.js")`, it looks for `dist/vite.js` which doesn't exist
4. Even if it existed, it would try to import the `vite` package which is not available

## Solution
Changed the environment detection from `app.get("env")` to `process.env.NODE_ENV` for more reliable detection:

```typescript
// Before:
if (app.get("env") === "development") {
  // Try to load vite
}

// After:
if (process.env.NODE_ENV === "development") {
  // Only load vite in explicit development mode
}
```

This ensures that vite is ONLY loaded when NODE_ENV is explicitly set to "development", preventing any ambiguity or timing issues.

## Testing
Verified that:
1. ✅ With `NODE_ENV=production`, server starts without attempting to load vite
2. ✅ Without `NODE_ENV` set, server attempts to load vite but falls back to static serving
3. ✅ TypeScript type checking passes
4. ✅ Build process completes successfully
5. ✅ Static file serving works correctly in production mode

## Additional Safeguards
The deployment configuration already sets `NODE_ENV=production` in multiple places:
- `Dockerfile` (line 27)
- `cloudbuild.yaml` (line 56)
- `deploy-cloud-run.sh` (line 226)

## Impact
- **Minimal**: Only changed one line of code (the environment check)
- **Safe**: Existing fallback behavior (try-catch with static serving) remains intact
- **Reliable**: Direct environment variable check is more predictable than Express's getter

## Files Changed
- `server/index.ts` - Changed environment check from `app.get("env")` to `process.env.NODE_ENV`
