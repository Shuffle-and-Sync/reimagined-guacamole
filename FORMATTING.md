# Code Formatting Guide

Welcome to the Shuffle & Sync code formatting guide! This document explains how we maintain consistent code style across the project using Prettier.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [What is Prettier?](#what-is-prettier)
3. [Setup for New Developers](#setup-for-new-developers)
4. [Daily Workflow](#daily-workflow)
5. [Editor Setup](#editor-setup)
6. [Available Commands](#available-commands)
7. [Pre-commit Hooks](#pre-commit-hooks)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)
10. [FAQ](#faq)

---

## Quick Start

**New to the project? Here's all you need to know:**

```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Configure git blame
git config blame.ignoreRevsFile .git-blame-ignore-revs

# 3. That's it! Pre-commit hooks will auto-format your code.
```

**Want to manually format?**
```bash
npm run format
```

---

## What is Prettier?

[Prettier](https://prettier.io/) is an opinionated code formatter that:

- ✅ Formats code automatically
- ✅ Eliminates style debates in code reviews
- ✅ Ensures 100% consistent code style
- ✅ Saves time - no manual formatting needed
- ✅ Works with TypeScript, JavaScript, JSX, JSON, Markdown, and more

### Why Prettier?

**Before Prettier:**
```typescript
// Different developers, different styles
const user={name:"Alice",age:30,email:"alice@example.com"}

const user = {
  name:    "Alice",
  age: 30,
  email:   "alice@example.com"
}
```

**With Prettier:**
```typescript
// Everyone writes the same style
const user = {
  name: "Alice",
  age: 30,
  email: "alice@example.com",
};
```

**Benefits:**
- No arguing about code style
- Faster code reviews
- Cleaner git diffs
- Consistent codebase
- Onboarding is easier

---

## Setup for New Developers

### Step 1: Install Dependencies

```bash
npm install --legacy-peer-deps
```

This installs Prettier and all pre-commit hooks.

### Step 2: Configure Git Blame

To exclude bulk formatting commits from `git blame`:

```bash
git config blame.ignoreRevsFile .git-blame-ignore-revs
```

### Step 3: Install Editor Extension (Recommended)

#### VS Code
1. Install [Prettier - Code formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
2. Settings are already configured in `.vscode/settings.json`
3. Code will auto-format on save! ✨

#### WebStorm / IntelliJ IDEA
1. Go to Settings → Languages & Frameworks → JavaScript → Prettier
2. Set Prettier package: `{project}/node_modules/prettier`
3. Check "On save" and "On Reformat Code"

#### Vim / Neovim
```vim
" Add to your .vimrc
Plug 'prettier/vim-prettier', { 'do': 'npm install' }
let g:prettier#autoformat = 1
let g:prettier#autoformat_require_pragma = 0
```

#### Sublime Text
Install [JsPrettier](https://packagecontrol.io/packages/JsPrettier) via Package Control

### Step 4: Verify Setup

```bash
# Make a small change to a file
echo "const test = 1" >> test.ts

# Try to commit (hook should format it)
git add test.ts
git commit -m "test"

# Clean up
git reset HEAD~1
rm test.ts
```

If the file was auto-formatted before commit, you're all set! ✅

---

## Daily Workflow

### Normal Development (Auto-formatting)

With pre-commit hooks, you don't need to think about formatting:

```bash
# 1. Make your changes
vim server/features/users/users.service.ts

# 2. Stage and commit as usual
git add server/features/users/users.service.ts
git commit -m "feat: add user lookup endpoint"

# 🎉 Prettier runs automatically before commit!
```

### Manual Formatting (Optional)

If you want to format manually:

```bash
# Format all files
npm run format

# Format specific files
npx prettier --write server/index.ts

# Format all TypeScript files
npx prettier --write "**/*.ts"
```

### Checking Formatting (CI/Local)

```bash
# Check if files are formatted (doesn't modify)
npm run format:check

# This is what CI runs
```

---

## Editor Setup

### VS Code (Recommended)

#### Automatic Setup
The repository includes `.vscode/settings.json` with optimal settings. Just install the Prettier extension!

#### Manual Setup
If settings aren't applying:

1. Open VS Code Settings (Cmd/Ctrl + ,)
2. Search for "format on save"
3. Check ✅ "Editor: Format On Save"
4. Search for "default formatter"
5. Select "Prettier - Code formatter"

**Settings JSON:**
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

#### Keyboard Shortcuts

- **Format Document:** `Shift + Alt + F` (Windows/Linux) or `Shift + Option + F` (Mac)
- **Format Selection:** `Cmd/Ctrl + K, Cmd/Ctrl + F`

### WebStorm / IntelliJ IDEA

1. **Preferences → Languages & Frameworks → JavaScript → Prettier**
2. **Prettier package:** `{project}/node_modules/prettier`
3. **Check:** "Run on save" and "On Reformat Code"

**Keyboard Shortcuts:**
- Format Document: `Cmd/Ctrl + Alt + L`

### Vim / Neovim

**Using vim-prettier:**
```vim
" Auto-format on save
let g:prettier#autoformat = 1
let g:prettier#autoformat_require_pragma = 0

" Format command
:Prettier
```

**Using ALE:**
```vim
let g:ale_fixers = {
  \ 'typescript': ['prettier'],
  \ 'typescriptreact': ['prettier'],
  \ 'javascript': ['prettier'],
  \ 'json': ['prettier'],
\}
let g:ale_fix_on_save = 1
```

### Emacs

**Using prettier-js:**
```elisp
(require 'prettier-js)
(add-hook 'typescript-mode-hook 'prettier-js-mode)
(add-hook 'js-mode-hook 'prettier-js-mode)
```

---

## Available Commands

### Format Commands

```bash
# Format all files (writes changes)
npm run format

# Check formatting without modifying files
npm run format:check

# Format with verbose output
npm run format:fix
```

### Build & Validation Commands

```bash
# Type checking
npm run check

# Linting (includes formatting rules)
npm run lint

# Run tests
npm test

# Full build
npm run build
```

### Combined Workflow

```bash
# Recommended: Run all checks before pushing
npm run format && npm run lint && npm test && npm run build
```

---

## Pre-commit Hooks

### How They Work

We use [Husky](https://typicode.github.io/husky/) and [lint-staged](https://github.com/okonet/lint-staged) to automatically format code before commits.

**What happens when you commit:**

1. You run `git commit`
2. Husky triggers `.husky/pre-commit` hook
3. lint-staged finds staged files
4. Prettier formats those files
5. ESLint fixes issues
6. Changes are automatically staged
7. Commit proceeds

### Configured Hooks

**.husky/pre-commit:**
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
```

**lint-staged (in package.json):**
```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "prettier --write",
      "eslint --fix"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

### Skipping Hooks (Not Recommended)

In rare cases, you can skip hooks:

```bash
git commit --no-verify -m "emergency fix"
```

⚠️ **Warning:** CI will still check formatting and may fail your PR.

### Disabling Hooks

If you need to temporarily disable hooks:

```bash
# Disable
mv .husky/pre-commit .husky/pre-commit.disabled

# Re-enable
mv .husky/pre-commit.disabled .husky/pre-commit
```

---

## Troubleshooting

### Problem: Pre-commit hook not running

**Symptoms:** Code isn't being formatted on commit

**Solutions:**

1. **Reinstall hooks:**
   ```bash
   rm -rf .husky
   npm install --legacy-peer-deps
   npx husky install
   npx husky add .husky/pre-commit "npx lint-staged"
   chmod +x .husky/pre-commit
   ```

2. **Check file permissions:**
   ```bash
   chmod +x .husky/pre-commit
   ```

3. **Verify husky is installed:**
   ```bash
   npm list husky
   ```

### Problem: "Prettier not found" error

**Symptoms:** `npx prettier` fails or hooks don't run

**Solutions:**

1. **Install Prettier:**
   ```bash
   npm install --save-dev prettier --legacy-peer-deps
   ```

2. **Clear npm cache:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install --legacy-peer-deps
   ```

3. **Use npx:**
   ```bash
   npx prettier --version
   ```

### Problem: Formatting conflicts with ESLint

**Symptoms:** ESLint errors about formatting, or ESLint and Prettier disagree

**Solutions:**

1. **Verify eslint-config-prettier is installed:**
   ```bash
   npm list eslint-config-prettier
   ```

2. **Check eslint.config.js:**
   Should include:
   ```javascript
   import prettierConfig from "eslint-config-prettier";
   
   export default [
     // ... other config
     prettierConfig, // Must be last!
   ];
   ```

3. **Run both tools:**
   ```bash
   npm run format && npm run lint
   ```

### Problem: Files keep getting reformatted

**Symptoms:** Prettier changes files, then changes them back

**Solutions:**

1. **Check for multiple configs:**
   ```bash
   find . -name ".prettierrc*" -o -name "prettier.config.*"
   ```
   Should only be one `.prettierrc.json` in root

2. **Check .prettierignore:**
   Make sure you're not ignoring files you want formatted

3. **Clear editor cache:**
   - VS Code: Reload window
   - WebStorm: Invalidate caches and restart

### Problem: Merge conflicts after formatting

**Symptoms:** Git merge conflicts in files after bulk formatting

**Solutions:**

1. **Rebase your branch:**
   ```bash
   git checkout feature-branch
   git fetch origin
   git rebase origin/main
   # Resolve conflicts
   npm run format
   git add -A
   git rebase --continue
   ```

2. **Accept both changes, then format:**
   ```bash
   # In conflict resolution
   # Accept both versions
   npm run format path/to/file.ts
   git add path/to/file.ts
   ```

3. **Use formatting commit in git-blame-ignore-revs:**
   ```bash
   git config blame.ignoreRevsFile .git-blame-ignore-revs
   ```

### Problem: Prettier is slow

**Symptoms:** Formatting takes a long time

**Solutions:**

1. **Format only changed files:**
   ```bash
   git diff --name-only | xargs npx prettier --write
   ```

2. **Use lint-staged** (automatic with hooks)

3. **Exclude large directories:**
   Add to `.prettierignore`:
   ```
   large-directory/
   ```

### Problem: CI formatting check fails

**Symptoms:** GitHub Actions fails on formatting check

**Solutions:**

1. **Run locally:**
   ```bash
   npm run format:check
   ```

2. **Fix formatting:**
   ```bash
   npm run format
   git add -A
   git commit --amend --no-edit
   git push --force-with-lease
   ```

3. **Check .prettierignore:**
   Make sure CI and local use same ignore rules

---

## Best Practices

### ✅ Do

- **Let Prettier do its job** - Don't fight the formatter
- **Format before committing** - Use pre-commit hooks
- **Format entire files** - Not just changed lines
- **Use editor integration** - Auto-format on save
- **Keep config simple** - Stick to team standards
- **Run format:check in CI** - Catch issues early

### ❌ Don't

- **Don't manually format** - Let Prettier handle it
- **Don't use `// prettier-ignore`** - Unless absolutely necessary
- **Don't skip pre-commit hooks** - They're there for a reason
- **Don't commit unformatted code** - CI will reject it
- **Don't argue about style** - Prettier decides
- **Don't edit .prettierrc** - Without team discussion

### Special Cases: When to Use `// prettier-ignore`

Rare situations where Prettier makes code less readable:

#### Example 1: Alignment for readability
```typescript
// prettier-ignore
const matrix = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];
```

#### Example 2: Regex patterns
```typescript
// prettier-ignore
const phoneRegex = /^\+?1?\s*?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;
```

#### Example 3: Long template strings
```typescript
// prettier-ignore
const sql = `
  SELECT id, name, email
  FROM users
  WHERE status = 'active'
  ORDER BY created_at DESC
`;
```

**Rule of thumb:** Use `// prettier-ignore` for less than 1% of code.

---

## FAQ

### Q: Why do we use Prettier?

**A:** To eliminate style debates, ensure consistency, and speed up code reviews. No more discussions about tabs vs spaces, quote styles, or line length.

### Q: Can I change the Prettier configuration?

**A:** Only with team approval. Formatting is a team decision. Propose changes in a team meeting, then update `.prettierrc.json` and reformat the entire codebase.

### Q: What files does Prettier format?

**A:** TypeScript (.ts, .tsx), JavaScript (.js, .jsx), JSON (.json), and Markdown (.md) files. See `.prettierrc.json` for full config.

### Q: Will Prettier break my code?

**A:** No. Prettier only changes formatting (whitespace, quotes, etc.), not functionality. If code has syntax errors, Prettier will refuse to format it.

### Q: Can I format only part of a file?

**A:** Not recommended. Prettier formats entire files for consistency. If you must, use `// prettier-ignore` comments.

### Q: What if I prefer different formatting?

**A:** Prettier is intentionally opinionated. The goal is consistency, not personal preference. Discuss with team if you feel strongly about a rule.

### Q: How do I format files Prettier doesn't support?

**A:** Prettier doesn't format all file types. For others:
- **CSS/SCSS:** Prettier supports these
- **Python:** Use Black
- **Go:** Use gofmt
- **Rust:** Use rustfmt

### Q: Can I disable Prettier for a directory?

**A:** Yes, add to `.prettierignore`:
```
directory-to-ignore/
```

### Q: What's the difference between Prettier and ESLint?

**A:**
- **Prettier:** Code formatting (whitespace, quotes, etc.)
- **ESLint:** Code quality (bugs, best practices, etc.)
- **Both:** We use both! ESLint catches bugs, Prettier formats code.

### Q: Why does Prettier format my code differently than my editor?

**A:** Your editor may be using a different Prettier version or configuration. Make sure your editor uses the project's Prettier:
- VS Code: Set "Prettier: Require Config" to true
- Use project's node_modules/prettier

### Q: Can I run Prettier on Windows?

**A:** Yes! Prettier works on Windows, macOS, and Linux. Use npm commands, not bash scripts.

---

## Configuration Reference

### Current Configuration (.prettierrc.json)

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 80,
  "arrowParens": "always",
  "endOfLine": "lf",
  "bracketSpacing": true,
  "jsxSingleQuote": false,
  "quoteProps": "as-needed",
  "proseWrap": "preserve"
}
```

**See [PRETTIER_CONFIG_GUIDE.md](./PRETTIER_CONFIG_GUIDE.md) for detailed explanation of each setting.**

### Files Ignored (.prettierignore)

```
# Dependencies
node_modules/
package-lock.json

# Build outputs
dist/
.vite/
coverage/

# Generated files
*.d.ts

# Database
drizzle/

# Logs
*.log

# Environment
.env*
!.env.example

# IDE
.vscode/
.idea/
```

---

## Resources

### Official Documentation
- [Prettier Website](https://prettier.io/)
- [Prettier Playground](https://prettier.io/playground/) - Test formatting online
- [Prettier Options](https://prettier.io/docs/en/options.html)

### Editor Plugins
- [VS Code - Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [WebStorm - Built-in](https://www.jetbrains.com/help/webstorm/prettier.html)
- [Vim - vim-prettier](https://github.com/prettier/vim-prettier)
- [Sublime - JsPrettier](https://packagecontrol.io/packages/JsPrettier)

### Related Tools
- [Husky](https://typicode.github.io/husky/) - Git hooks
- [lint-staged](https://github.com/okonet/lint-staged) - Run linters on staged files
- [ESLint](https://eslint.org/) - JavaScript linting

### Project Documentation
- [prettier-audit-report.md](./prettier-audit-report.md) - Formatting audit results
- [prettier-remediation-plan.md](./prettier-remediation-plan.md) - Implementation plan
- [PRETTIER_CONFIG_GUIDE.md](./PRETTIER_CONFIG_GUIDE.md) - Configuration details
- [CONTRIBUTING.md](./CONTRIBUTING.md) - General contribution guidelines

---

## Need Help?

1. **Check this guide** - Most issues are covered here
2. **Check Prettier docs** - [prettier.io/docs](https://prettier.io/docs/)
3. **Ask the team** - Someone has probably seen the issue before
4. **File an issue** - If it's a bug in our setup

---

## Changelog

### 2025-10-20 - Initial Setup
- Added Prettier configuration
- Set up pre-commit hooks
- Created comprehensive documentation
- Formatted entire codebase

---

**Last Updated:** October 20, 2025  
**Maintainer:** Development Team  
**Questions?** See #dev-questions or ask in team chat
