# Google Auth Callback URL Fix

## Problem

The Google OAuth callback endpoint at `/api/auth/callback/google` was not properly accessible due to incorrect mounting pattern for the ExpressAuth middleware.

## Root Cause

The Auth.js ExpressAuth middleware was mounted incorrectly. According to the [@auth/express documentation](https://authjs.dev/reference/express), the correct pattern when using Express is:

```typescript
app.use("/auth/*", ExpressAuth({ providers: [GitHub] }));
```

However, our implementation had:

1. A Router wrapping ExpressAuth instead of mounting the middleware directly
2. Mounting at `/api/auth` instead of `/api/auth/*`

## Solution

### Changed Files

#### 1. `server/auth/auth.routes.ts`

**Before:**

```typescript
const router = Router();
router.use(
  "*",
  ExpressAuth({
    ...authConfig,
    basePath: "/api/auth",
  }),
);
export default router;
```

**After:**

```typescript
// Export ExpressAuth middleware directly
export default ExpressAuth(authConfig);
```

**Rationale:**

- Removed unnecessary Router wrapper
- Simplified the implementation
- Follows @auth/express documentation pattern
- ExpressAuth automatically calculates basePath from request headers

#### 2. `server/index.ts`

**Before:**

```typescript
app.use("/api/auth", authRoutesFixed);
```

**After:**

```typescript
app.use("/api/auth/*", authRoutesFixed);
```

**Rationale:**

- The `/*` wildcard pattern ensures Express properly captures all sub-paths
- ExpressAuth uses `req.params[0]` to calculate the basePath
- This matches the documented @auth/express mounting pattern

## How It Works

When a request comes to `/api/auth/callback/google`:

1. Express matches the route with `/api/auth/*`
2. The wildcard `*` captures `callback/google` in `req.params[0]`
3. ExpressAuth's internal `getBasePath()` function:
   ```typescript
   function getBasePath(req) {
     return req.baseUrl.split(req.params[0])[0].replace(/\/$/, "");
   }
   ```
   Extracts `/api/auth` as the basePath
4. Auth.js handles the callback at the correct path

## Testing

Created comprehensive tests in `server/tests/auth-routes.test.ts` to verify:

- ✅ Correct wildcard pattern is used
- ✅ ExpressAuth auto-detects basePath
- ✅ Google OAuth callback route is accessible
- ✅ All required Auth.js endpoints work correctly

## Verification

To verify the fix works in deployment:

1. **Check providers endpoint:**

   ```bash
   curl https://shuffle-sync-backend-*.run.app/api/auth/providers
   ```

   Should return JSON with Google provider info.

2. **Test OAuth flow:**
   - Visit the frontend
   - Click "Sign in with Google"
   - Should redirect to Google OAuth
   - After authentication, should callback to `/api/auth/callback/google`
   - Should successfully create session and redirect to `/home`

## Related Documentation

- [@auth/express documentation](https://authjs.dev/reference/express)
- [ExpressAuth source code](https://github.com/nextauthjs/next-auth/blob/main/packages/frameworks-express/src/index.ts)
- [CLOUD_RUN_AUTH_FIX.md](./CLOUD_RUN_AUTH_FIX.md) - General Cloud Run auth setup
- [AUTHENTICATION.md](./AUTHENTICATION.md) - Complete authentication documentation
