# Build Initialization - Quick Reference

## 🚀 Common Commands

### Build Commands
```bash
# Full build with all initialization
npm run build

# Verify build artifacts
npm run build:verify

# Verify runtime initialization
npm run build:verify-runtime

# Clean build (removes old artifacts first)
CLEAN_BUILD=true npm run build

# Type check only
npm run check
```

### Pre-Build Setup
```bash
# Manual pre-build validation
bash scripts/pre-build.sh

# Automatically runs before npm run build
```

> **Note**: For Windows users with Git Bash/MINGW64, always use `bash scripts/scriptname.sh` format.

## 📋 Build Process Steps

The `npm run build` command now includes:

1. ✅ **Prerequisite Verification** - Node.js, npm
2. ✅ **File Validation** - Required config files
3. ✅ **Dependency Check** - node_modules, critical packages
4. ✅ **Type Checking** - TypeScript compilation
5. ✅ **Frontend Build** - React app (Vite)
6. ✅ **Backend Build** - Server (esbuild)
7. ✅ **Post-Build Verification** - All artifacts

## 🔍 Verification Scripts

### Build Verification
```bash
npm run build:verify
```
Checks:
- Backend bundle exists (dist/index.js)
- Frontend assets built (dist/public/)
- Runtime dependencies present

### Runtime Verification
```bash
npm run build:verify-runtime
```
Checks:
- Logger initialization
- Database module loading
- Environment validation
- Authentication configuration
- Feature routes availability

## 📦 Build Artifacts

After successful build:

```
dist/
├── index.js          # Backend bundle (~700KB)
└── public/           # Frontend assets (~1-2MB)
    ├── index.html
    └── assets/

node_modules/         # Production dependencies
package.json          # For deployment
```

## 🔧 Troubleshooting

### Build Fails at Type Checking
```bash
# See detailed errors
npm run check
```

### Build Artifacts Missing
```bash
# Verify what was created
npm run build:verify

# Clean and rebuild
rm -rf dist
npm run build
```

### Runtime Errors After Build
```bash
# Check if all modules can load
npm run build:verify-runtime
```

## 🐳 Docker Build

The Dockerfile uses the same enhanced build:

```dockerfile
# Install dependencies
RUN npm ci --legacy-peer-deps

# Build with full initialization
RUN npm run build

# Remove dev dependencies
RUN npm prune --production
```

## 🚢 Deployment

### Quick Deployment Check
```bash
# 1. Build
npm run build

# 2. Verify build
npm run build:verify

# 3. Verify runtime
npm run build:verify-runtime

# 4. Deploy
bash scripts/deploy-production.sh
```

### Required Files for Deployment
- ✅ `dist/` - Backend and frontend
- ✅ `node_modules/` - Production dependencies
- ✅ `package.json` - Dependency manifest

## ⚙️ Environment Requirements

### Minimum Requirements
- Node.js 18+
- npm 9+
- SQLite Cloud database (or connection URL)

### Required Files
- `package.json`
- `tsconfig.json`
- `vite.config.ts`
- `esbuild.config.js`

## 📚 Full Documentation

- [BUILD_INITIALIZATION.md](./docs/BUILD_INITIALIZATION.md) - Complete guide
- [BUILD_INITIALIZATION_SUMMARY.md](./BUILD_INITIALIZATION_SUMMARY.md) - What changed
- [DEPLOYMENT.md](../DEPLOYMENT.md) - Production deployment

## 🎯 Quick Checklist

Before deploying:
- [ ] Run `npm run build`
- [ ] Run `npm run build:verify`
- [ ] Run `npm run build:verify-runtime`
- [ ] All checks pass ✅
- [ ] Ready to deploy! 🚀
