# GitHub Pages Deployment Error - Visual Guide

## The Problem

```
❌ GitHub Pages Deployment FAILED
   └─> HttpError: Validation Failed (422)
       └─> actions/deploy-pages@v4 cannot deploy
           └─> Pages source configured incorrectly
```

## Why It Happens

### Current (Broken) Configuration

```
Repository Settings → Pages
├─ Source: "Deploy from a branch" ❌
├─ Branch: main / docs or main / (root)
└─ Result: Automatic workflow fails with 422 error
```

### What's Happening

1. **GitHub automatically creates** a "pages-build-deployment" workflow when Pages is enabled
2. This workflow uses `actions/deploy-pages@v4` action
3. The action **requires** Pages to be configured for "GitHub Actions" deployment
4. When Pages is set to "Deploy from a branch", the action fails with **Validation Failed (422)**

## The Fix

### Option 1: Use GitHub Actions (Recommended)

```
Repository Settings → Pages
├─ Source: "GitHub Actions" ✅
├─ Workflow: .github/workflows/pages.yml (custom)
└─ Result: Deploys docs/ directory successfully
```

**Steps:**

1. Go to **Settings** → **Pages**
2. Under "Build and deployment":
   - **Source**: Select **"GitHub Actions"**
3. Click **Save**

**What This Does:**

- Enables the new custom workflow (`.github/workflows/pages.yml`)
- Automatically deploys `docs/` folder to GitHub Pages
- Workflow runs on:
  - Every push to `main` that changes `docs/**`
  - Manual trigger via Actions tab

### Option 2: Disable Pages

```
Repository Settings → Pages
├─ Source: "None" 🛑
└─ Result: All Pages workflows stop running
```

**Steps:**

1. Go to **Settings** → **Pages**
2. Under "Build and deployment":
   - **Source**: Select **"None"**
3. Click **Save**

**When to Use:**

- This app is designed for Cloud Run, not GitHub Pages
- You don't need documentation hosted on Pages
- You want to stop the failing workflow

## The Solution We Created

### New Workflow: `.github/workflows/pages.yml`

```yaml
# Deploys docs/ directory to GitHub Pages
name: Deploy Documentation to Pages

on:
  push:
    branches: ["main"]
    paths: ["docs/**"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write # Required for Pages deployment
  id-token: write # Required for Pages deployment

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}

    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: "docs"
      - uses: actions/deploy-pages@v4
        id: deployment
```

### Key Features

- ✅ **Proper Permissions**: Has `pages: write` and `id-token: write`
- ✅ **Correct Setup**: Uses `configure-pages` action
- ✅ **Smart Triggers**: Only runs when docs change
- ✅ **Manual Control**: Can trigger manually via Actions tab

## Comparison

| Configuration                    | Automatic Workflow       | Custom Workflow |
| -------------------------------- | ------------------------ | --------------- |
| **Pages Source: Branch**         | ❌ Fails with 422        | ❌ Won't run    |
| **Pages Source: GitHub Actions** | ✅ Works (if configured) | ✅ Works        |
| **Pages Source: None**           | 🛑 Doesn't run           | 🛑 Doesn't run  |

## Quick Reference

### To Fix the Error:

```bash
1. Settings → Pages → Source → "GitHub Actions" → Save
   └─> Custom workflow will deploy docs/
```

### To Disable Pages:

```bash
1. Settings → Pages → Source → "None" → Save
   └─> All workflows stop
```

### To Test After Fix:

```bash
1. Make a change in docs/
2. Push to main
3. Go to Actions tab
4. Watch "Deploy Documentation to Pages" workflow
5. Visit Pages URL when complete
```

## What Gets Deployed

```
GitHub Pages Site
└─ https://<username>.github.io/<repo>/
   ├─ All files from docs/ directory
   ├─ index.html (if exists)
   └─ README.md → index.html (auto-converted)
```

## Common Questions

**Q: Why does the error say "Validation Failed"?**

> A: The `deploy-pages` action validates that Pages is configured for GitHub Actions. When it's set to "Deploy from a branch", validation fails.

**Q: Can I keep using the automatic workflow?**

> A: Yes, but you need to change Settings → Pages → Source to "GitHub Actions". The custom workflow we created is better because it only deploys docs/.

**Q: Will this affect my Cloud Run deployment?**

> A: No, this only affects GitHub Pages. Cloud Run deployment is separate.

**Q: Do I need GitHub Pages for this project?**

> A: Probably not. This is a React/Node.js app for Cloud Run. Pages would only host docs.

---

**Related Files:**

- [Quick Fix Instructions](.github/PAGES_FIX_REQUIRED.md)
- [Detailed Troubleshooting](../docs/GITHUB_PAGES_DEPLOYMENT_FIX.md)
- [New Workflow](.github/workflows/pages.yml)
