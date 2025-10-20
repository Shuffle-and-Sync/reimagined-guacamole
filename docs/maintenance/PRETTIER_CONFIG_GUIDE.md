# Prettier Configuration Guide

This document explains the recommended Prettier configuration for the Shuffle & Sync project and the rationale behind each setting.

---

## Configuration File

**Location:** `.prettierrc.json` (in project root)

```json
{
  "$schema": "https://json.schemastore.org/prettierrc",
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

---

## Setting Explanations

### `"semi": true`

**What it does:** Adds semicolons at the end of statements

**Example:**

```typescript
// With semi: true
const name = "Alice";
const age = 30;

// With semi: false
const name = "Alice";
const age = 30;
```

**Rationale:**

- ✅ Standard in TypeScript/JavaScript community
- ✅ Prevents edge-case ASI (Automatic Semicolon Insertion) bugs
- ✅ Clearer statement boundaries
- ✅ Matches TypeScript compiler behavior
- ✅ Recommended by Google, Airbnb, Standard style guides

**Team preference:** Explicit is better than implicit

---

### `"singleQuote": false`

**What it does:** Uses double quotes for strings (except when avoiding escapes)

**Example:**

```typescript
// With singleQuote: false
const greeting = "Hello, world!";
const name = "Alice's cat";

// With singleQuote: true
const greeting = "Hello, world!";
const name = "Alice's cat"; // Auto-switched to avoid escaping
```

**Rationale:**

- ✅ Consistent with JSX convention (JSX always uses double quotes)
- ✅ Matches JSON format
- ✅ Standard in React community
- ✅ Easier to type (no Shift key needed)
- ✅ Avoids switching between single/double when writing JSX

**Team preference:** Consistency with JSX

---

### `"tabWidth": 2`

**What it does:** Uses 2 spaces for indentation

**Example:**

```typescript
// With tabWidth: 2
function greet() {
  if (true) {
    console.log("Hello");
  }
}

// With tabWidth: 4
function greet() {
  if (true) {
    console.log("Hello");
  }
}
```

**Rationale:**

- ✅ Standard for React/TypeScript projects
- ✅ Saves horizontal space
- ✅ Better for deeply nested JSX
- ✅ Matches most popular style guides (Airbnb, Google)
- ✅ Default for most frontend frameworks

**Team preference:** Industry standard for web development

---

### `"trailingComma": "all"`

**What it does:** Adds trailing commas wherever possible (objects, arrays, function params)

**Example:**

```typescript
// With trailingComma: "all"
const person = {
  name: "Alice",
  age: 30,
  city: "NYC",
};

const colors = ["red", "green", "blue"];

function greet(firstName: string, lastName: string) {
  // ...
}

// With trailingComma: "none"
const person = {
  name: "Alice",
  age: 30,
  city: "NYC",
};
```

**Rationale:**

- ✅ Cleaner git diffs (adding items doesn't modify previous line)
- ✅ Easier to reorder items
- ✅ Prevents forgotten commas when adding items
- ✅ Supported in all modern browsers/Node.js
- ✅ Standard in TypeScript community

**Team preference:** Better version control and easier refactoring

---

### `"printWidth": 80`

**What it does:** Wraps lines that exceed 80 characters

**Example:**

```typescript
// With printWidth: 80
const message =
  "This is a very long message that will be wrapped " + "to multiple lines";

// With printWidth: 120
const message =
  "This is a very long message that will be wrapped to multiple lines";
```

**Rationale:**

- ✅ Classic standard (dates back to punch cards)
- ✅ Readable on small screens
- ✅ Easier to review in PR diffs
- ✅ Fits well with side-by-side editors
- ✅ Forces concise code
- ✅ Standard in most style guides

**Team preference:** Readability and review-friendliness

**Note:** This is a soft limit. Prettier may exceed it if wrapping would make code less readable.

---

### `"arrowParens": "always"`

**What it does:** Always includes parentheses around arrow function parameters

**Example:**

```typescript
// With arrowParens: "always"
const square = (x) => x * x;
const greet = (name) => `Hello, ${name}`;

// With arrowParens: "avoid"
const square = (x) => x * x;
const greet = (name) => `Hello, ${name}`;
```

**Rationale:**

- ✅ Consistent syntax regardless of parameter count
- ✅ Easier to add types in TypeScript: `(x: number) => x * x`
- ✅ Easier to add/remove parameters
- ✅ Matches function declaration style
- ✅ No confusion about operator precedence

**Team preference:** Consistency and TypeScript-friendliness

---

### `"endOfLine": "lf"`

**What it does:** Uses Unix-style line endings (`\n`) instead of Windows (`\r\n`)

**Example:**

```
// With endOfLine: "lf"
Line 1\n
Line 2\n

// With endOfLine: "crlf"
Line 1\r\n
Line 2\r\n
```

**Rationale:**

- ✅ Standard on Linux/macOS (deployment targets)
- ✅ Smaller file sizes
- ✅ Git handles conversion automatically
- ✅ Standard for web development
- ✅ Matches .editorconfig setting

**Team preference:** Cross-platform consistency, smaller repository

---

### `"bracketSpacing": true`

**What it does:** Adds spaces inside object literal braces

**Example:**

```typescript
// With bracketSpacing: true
const obj = { name: "Alice", age: 30 };

// With bracketSpacing: false
const obj = { name: "Alice", age: 30 };
```

**Rationale:**

- ✅ More readable
- ✅ Standard in JavaScript community
- ✅ Matches most style guides
- ✅ Consistent with function call spacing: `func({ arg })`

**Team preference:** Readability

---

### `"jsxSingleQuote": false`

**What it does:** Uses double quotes in JSX attributes

**Example:**

```jsx
// With jsxSingleQuote: false
<Component name="Alice" title="Hello World" />

// With jsxSingleQuote: true
<Component name='Alice' title='Hello World' />
```

**Rationale:**

- ✅ Standard HTML uses double quotes
- ✅ Consistent with `singleQuote: false`
- ✅ React documentation uses double quotes
- ✅ Easier to copy/paste from HTML

**Team preference:** HTML/React convention

---

### `"quoteProps": "as-needed"`

**What it does:** Only adds quotes around object properties when required

**Example:**

```typescript
// With quoteProps: "as-needed"
const obj = {
  name: "Alice",
  "full-name": "Alice Smith",
  age: 30,
};

// With quoteProps: "consistent"
const obj = {
  name: "Alice",
  "full-name": "Alice Smith",
  age: 30,
};
```

**Rationale:**

- ✅ Cleaner code
- ✅ Only quotes when necessary (special chars, keywords)
- ✅ Standard in JavaScript
- ✅ Fewer characters to type

**Team preference:** Minimal syntax

---

### `"proseWrap": "preserve"`

**What it does:** Doesn't wrap markdown prose (respects original line breaks)

**Example:**

```markdown
<!-- With proseWrap: "preserve" -->

This is a very long line that will not be wrapped by Prettier.
It will stay as a single line even if it exceeds printWidth.

<!-- With proseWrap: "always" -->

This is a very long line that will be wrapped by Prettier into
multiple lines to respect the printWidth setting.
```

**Rationale:**

- ✅ Respects author's intentional line breaks
- ✅ Better for technical documentation
- ✅ Prevents unwanted wrapping in code blocks
- ✅ Compatible with different markdown renderers
- ✅ Preserves paragraph structure

**Team preference:** Documentation control

---

## Additional Settings (Not Set - Using Defaults)

These settings are not explicitly configured, so Prettier uses defaults:

### `useTabs: false` (default)

Use spaces instead of tabs for indentation

### `bracketSameLine: false` (default)

Put the `>` of a multi-line JSX element on the next line

**Example:**

```jsx
<Component
  name="Alice"
  age={30}
>
```

### `htmlWhitespaceSensitivity: "css"` (default)

Respect CSS display property for HTML whitespace

### `embeddedLanguageFormatting: "auto"` (default)

Format code inside template strings, CSS-in-JS, etc.

---

## Configuration Alternatives

These settings were considered but not chosen:

### ❌ `singleQuote: true`

- Conflicts with JSX convention
- Requires mental switching between JS and JSX

### ❌ `printWidth: 120`

- Harder to review side-by-side
- Encourages overly complex expressions
- Poor mobile/small screen experience

### ❌ `trailingComma: "none"`

- Worse git diffs
- More error-prone when adding items

### ❌ `arrowParens: "avoid"`

- Inconsistent with TypeScript type annotations
- Confusing when adding/removing parameters

### ❌ `tabWidth: 4`

- Not standard for web development
- Wastes horizontal space in JSX

---

## File Overrides (Advanced)

If needed, you can override settings for specific file types:

```json
{
  "semi": true,
  "overrides": [
    {
      "files": "*.md",
      "options": {
        "proseWrap": "always",
        "printWidth": 100
      }
    },
    {
      "files": "*.json",
      "options": {
        "tabWidth": 4
      }
    }
  ]
}
```

**Current recommendation:** Don't use overrides unless there's a specific need. Consistency across file types is preferable.

---

## Integration with Other Tools

### ESLint

- Use `eslint-config-prettier` to disable conflicting ESLint rules
- Let Prettier handle ALL formatting
- Let ESLint handle code quality and logic issues

### EditorConfig

- `.editorconfig` provides basic editor settings
- Prettier configuration takes precedence for supported file types
- EditorConfig handles files Prettier doesn't format

### TypeScript

- Prettier doesn't change TypeScript semantics
- Type annotations are preserved
- Only formatting is changed

---

## Testing Configuration

To test a configuration change:

1. **Backup current config:**

   ```bash
   cp .prettierrc.json .prettierrc.json.backup
   ```

2. **Edit `.prettierrc.json`**

3. **Test on one file:**

   ```bash
   npx prettier --write server/index.ts
   git diff server/index.ts
   ```

4. **Review changes:**
   - Does it look better?
   - Does it match team preference?
   - Does it break anything?

5. **Rollback if needed:**

   ```bash
   mv .prettierrc.json.backup .prettierrc.json
   npm run format
   ```

6. **Discuss with team before applying to all files**

---

## Prettier Configuration Best Practices

1. **Keep it simple** - Use defaults when possible
2. **Be consistent** - One style for all file types
3. **Document changes** - Explain why settings changed
4. **Test thoroughly** - Before applying to entire codebase
5. **Get team buy-in** - Discuss controversial settings
6. **Version control** - Commit .prettierrc.json to repo
7. **Don't override often** - Overrides add complexity

---

## FAQ

### Q: Can we change a Prettier setting after initial setup?

**A:** Yes, but:

1. Discuss with team first
2. Update configuration file
3. Run `npm run format` to reformat entire codebase
4. Commit formatting changes separately
5. Add commit to `.git-blame-ignore-revs`

### Q: What if I disagree with a Prettier formatting choice?

**A:**

1. Check if there's a configuration option to change it
2. Discuss with team - formatting is a team decision
3. If no option exists, consider:
   - Using `// prettier-ignore` for specific cases (rare!)
   - Accepting Prettier's choice (recommended)
   - Filing issue on Prettier repo if it seems like a bug

### Q: Should we use `.prettierrc.js` or `.prettierrc.json`?

**A:** Use `.prettierrc.json` for this project:

- ✅ Simpler (no code execution)
- ✅ Better editor support (IntelliSense)
- ✅ Schema validation
- ❌ Can't use JavaScript logic (not needed for our use case)

### Q: How do I format only certain file types?

**A:** Modify the format script in package.json:

```json
{
  "scripts": {
    "format:ts": "prettier --write \"**/*.{ts,tsx}\"",
    "format:md": "prettier --write \"**/*.md\"",
    "format:json": "prettier --write \"**/*.json\""
  }
}
```

---

## Resources

- [Prettier Options Documentation](https://prettier.io/docs/en/options.html)
- [Prettier Playground](https://prettier.io/playground/) - Test configurations
- [Prettier Configuration Documentation](https://prettier.io/docs/en/configuration.html)
- [Why Prettier?](https://prettier.io/docs/en/why-prettier.html)

---

**Last Updated:** October 20, 2025  
**Version:** 1.0  
**Next Review:** January 2026
