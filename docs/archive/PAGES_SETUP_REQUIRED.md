# ⚠️ GitHub Pages Configuration Required

## Issue

GitHub Pages deployment workflow is failing with error:

```
Error: Failed to create deployment (status: 422)
HttpError: Validation Failed
```

## Root Cause

The repository has GitHub Pages enabled, but it's configured to deploy from a branch instead of GitHub Actions. This causes the deployment workflow to fail with a validation error.

## Quick Fix (2 minutes)

### Option 1: Enable GitHub Actions for Pages ✅ (Recommended)

If you want to host documentation at `https://shuffle-and-sync.github.io/reimagined-guacamole/`:

1. **Go to**: [Repository Settings → Pages](../../settings/pages)
2. **Under "Build and deployment"**:
   - Change **Source** from ~~"Deploy from a branch"~~ to **"GitHub Actions"**
3. **Click Save**

**After configuring:**

- Edit `.github/workflows/pages.yml` and remove the `if: github.event_name == 'workflow_dispatch'` condition
- The workflow will then automatically deploy the `docs/` directory on every push to main

### Option 2: Disable Pages 🛑 (If not needed)

If you don't need GitHub Pages:

1. **Go to**: [Repository Settings → Pages](../../settings/pages)
2. **Under "Build and deployment"**:
   - Change **Source** to **"None"**
3. **Click Save**
4. **Optional**: Delete `.github/workflows/pages.yml` to remove the workflow entirely

## What This Fixes

- ✅ Stops the recurring deployment failures
- ✅ Allows GitHub Actions to deploy to Pages (if Option 1)
- ✅ Removes Pages entirely (if Option 2)

## Why This Happened

GitHub Pages has two deployment modes:

1. **Deploy from a branch** (default) - Uses Jekyll to build from a branch like `gh-pages` or `main`
2. **GitHub Actions** - Uses custom workflows to deploy artifacts

This repository has a GitHub Actions workflow (`.github/workflows/pages.yml`) but Pages is still set to "Deploy from a branch", causing the mismatch.

## Application Context

**Shuffle & Sync** is primarily deployed to **Google Cloud Run**, not GitHub Pages. GitHub Pages deployment is optional and only useful for:

- Hosting the documentation site
- Providing a static reference for the `docs/` folder

The main application deployment uses Cloud Run and does not depend on Pages.

## More Information

- 📖 [Detailed Fix Guide](docs/GITHUB_PAGES_DEPLOYMENT_FIX.md)
- 📖 [Previous Pages Fix](docs/GITHUB_PAGES_FIX_SUMMARY.md)
- 📖 [GitHub Pages Actions Documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site#publishing-with-a-custom-github-actions-workflow)

---

**Date**: 2025-10-14  
**Status**: ⏳ Awaiting repository settings update  
**Workflow**: Temporarily disabled for automatic runs
