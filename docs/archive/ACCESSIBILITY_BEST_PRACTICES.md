# Accessibility Best Practices for Shuffle & Sync

This guide provides practical guidelines for maintaining and improving accessibility (a11y) in the Shuffle & Sync codebase.

## Table of Contents

1. [Quick Checklist](#quick-checklist)
2. [Semantic HTML](#semantic-html)
3. [ARIA Attributes](#aria-attributes)
4. [Keyboard Navigation](#keyboard-navigation)
5. [Screen Reader Support](#screen-reader-support)
6. [Color and Contrast](#color-and-contrast)
7. [Component Patterns](#component-patterns)
8. [Testing](#testing)
9. [Resources](#resources)

---

## Quick Checklist

Use this checklist when creating or reviewing components:

### Every Component Should

- [ ] Use semantic HTML elements (`<button>`, `<nav>`, `<main>`, etc.)
- [ ] Have proper heading hierarchy (h1 → h2 → h3)
- [ ] Include visible focus indicators (already handled by Tailwind)
- [ ] Work with keyboard only (Tab, Enter, Space, Escape)

### Interactive Elements Must

- [ ] Be focusable (use `<button>` or `<a>`, not `<div onClick>`)
- [ ] Have descriptive text or `aria-label`
- [ ] Show focus indicator when focused
- [ ] Respond to keyboard events (Enter/Space for buttons)

### Images and Icons Must

- [ ] Have `alt` text (or empty `alt=""` if decorative)
- [ ] Decorative icons have `aria-hidden="true"`
- [ ] Icon-only buttons have `aria-label`

### Forms Must

- [ ] Use `<label>` elements associated with inputs
- [ ] Show validation errors in accessible way
- [ ] Announce errors to screen readers
- [ ] Group related fields with `<fieldset>` and `<legend>`

---

## Semantic HTML

### Use the Right Element for the Job

```tsx
// ✅ GOOD - Semantic button
<button onClick={handleClick}>
  Click me
</button>

// ❌ BAD - Non-semantic clickable
<div onClick={handleClick}>
  Click me
</div>
```

### Landmark Elements

Every page should have these landmarks:

```tsx
function MyPage() {
  return (
    <>
      <SkipLink /> {/* Skip to main content */}
      <header>{/* Header component */}</header>
      <nav>{/* Primary navigation */}</nav>
      <main id="main-content">{/* Main page content */}</main>
      <footer>{/* Footer component */}</footer>
    </>
  );
}
```

### Heading Hierarchy

```tsx
// ✅ GOOD - Logical hierarchy
<h1>Page Title</h1>
<section>
  <h2>Section Title</h2>
  <h3>Subsection Title</h3>
</section>

// ❌ BAD - Skipping levels
<h1>Page Title</h1>
<h4>Section Title</h4>  {/* Skipped h2 and h3 */}
```

---

## ARIA Attributes

### When to Use ARIA

> **First Rule of ARIA**: Don't use ARIA. Use semantic HTML instead.
>
> **Second Rule**: If you must use ARIA, use it correctly.

### Common ARIA Patterns

#### 1. Icon-Only Buttons

```tsx
// ✅ GOOD - Has aria-label
<Button size="icon" aria-label="Open menu">
  <MenuIcon aria-hidden="true" />
</Button>

// ❌ BAD - No label for screen readers
<Button size="icon">
  <MenuIcon />
</Button>
```

#### 2. Decorative Icons

```tsx
// ✅ GOOD - Hidden from screen readers
<i className="fas fa-star" aria-hidden="true"></i>
Rating: 5 stars

// ❌ BAD - Screen reader says "star image" unnecessarily
<i className="fas fa-star"></i>
Rating: 5 stars
```

#### 3. Loading States

```tsx
// ✅ GOOD - Announces loading state
<div
  role="status"
  aria-label="Loading data"
  className="spinner"
>
  <span className="sr-only">Loading...</span>
</div>

// ❌ BAD - Silent loading spinner
<div className="spinner" />
```

#### 4. Live Regions

```tsx
// For dynamic content that should be announced
<div role="alert" aria-live="assertive">
  Error: Form submission failed
</div>

<div role="status" aria-live="polite">
  5 items added to cart
</div>
```

#### 5. Expandable Sections

```tsx
// Already handled by Radix UI, but for reference:
<button
  aria-expanded={isOpen}
  aria-controls="content-id"
>
  Toggle Content
</button>
<div id="content-id" hidden={!isOpen}>
  {/* Content */}
</div>
```

---

## Keyboard Navigation

### Required Keyboard Support

| Element  | Keys         | Action         |
| -------- | ------------ | -------------- |
| Button   | Enter, Space | Activate       |
| Link     | Enter        | Navigate       |
| Dropdown | ↑↓←→         | Navigate items |
| Dialog   | Escape       | Close          |
| Tabs     | ←→           | Switch tabs    |

### Focus Management

```tsx
// ✅ GOOD - Focus management in dialog
function MyDialog({ open, onClose }) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      closeButtonRef.current?.focus();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogTitle>Dialog Title</DialogTitle>
        <DialogClose ref={closeButtonRef}>Close</DialogClose>
      </DialogContent>
    </Dialog>
  );
}
```

### Skip Links

Every page needs a skip link:

```tsx
import { SkipLink } from "@/components/SkipLink";

function MyPage() {
  return (
    <>
      <SkipLink />
      <Header />
      <main id="main-content">{/* Page content */}</main>
    </>
  );
}
```

### Focus Indicators

Our Tailwind setup provides focus indicators automatically:

```tsx
// These classes are already included in our button component
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-ring
focus-visible:ring-offset-2
```

---

## Screen Reader Support

### Alt Text for Images

```tsx
// ✅ GOOD - Descriptive alt text
<img
  src="/profile.jpg"
  alt="User profile photo showing John Smith smiling"
/>

// ✅ GOOD - Empty alt for decorative images
<img
  src="/decorative-border.png"
  alt=""
  aria-hidden="true"
/>

// ❌ BAD - Missing alt text
<img src="/profile.jpg" />

// ❌ BAD - Redundant alt text
<img src="/profile.jpg" alt="Image of profile photo" />
```

### Screen Reader Only Text

Use the `.sr-only` class for text that should only be read by screen readers:

```tsx
// Example: Loading indicator
<div className="spinner" role="status">
  <span className="sr-only">Loading...</span>
</div>

// Example: External link indicator
<a href="https://example.com">
  Visit Example
  <span className="sr-only">(opens in new tab)</span>
</a>
```

### Form Labels and Errors

```tsx
// ✅ GOOD - Using our Form components (React Hook Form + Radix)
<Form {...form}>
  <FormField
    control={form.control}
    name="email"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Email Address</FormLabel>
        <FormControl>
          <Input
            type="email"
            placeholder="you@example.com"
            {...field}
          />
        </FormControl>
        <FormDescription>
          We'll never share your email
        </FormDescription>
        <FormMessage />  {/* Errors announced automatically */}
      </FormItem>
    )}
  />
</Form>

// ❌ BAD - No label association
<div>
  <span>Email</span>
  <input type="email" />
</div>
```

### Announcements

For dynamic content updates:

```tsx
// ✅ GOOD - Polite announcement (doesn't interrupt)
const { toast } = useToast();
toast({
  title: "Success",
  description: "Your changes have been saved",
});

// ✅ GOOD - Assertive announcement (interrupts)
toast({
  title: "Error",
  description: "Failed to save changes",
  variant: "destructive",
});
```

---

## Color and Contrast

### Contrast Requirements (WCAG 2.1 AA)

- **Normal text**: 4.5:1 minimum
- **Large text** (18pt+ or 14pt+ bold): 3:1 minimum
- **UI components**: 3:1 minimum
- **Focus indicators**: 3:1 minimum

### Using Design Tokens

Our theme colors meet WCAG AA standards:

```tsx
// ✅ GOOD - Using theme colors
<Button variant="primary">
  Primary Action
</Button>

// ⚠️ CAUTION - Custom colors (verify contrast)
<Button className="bg-gray-400 text-gray-500">
  Custom Colors  {/* May not meet contrast requirements */}
</Button>
```

### Testing Contrast

Use browser DevTools or WebAIM Contrast Checker:

- Chrome DevTools: Inspect → Accessibility → Contrast
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Never Use Color Alone

```tsx
// ❌ BAD - Color only for status
<span className="text-red-500">Error</span>
<span className="text-green-500">Success</span>

// ✅ GOOD - Color + icon + text
<span className="text-red-500">
  <XCircleIcon aria-hidden="true" />
  Error: Invalid input
</span>
<span className="text-green-500">
  <CheckCircleIcon aria-hidden="true" />
  Success: Saved
</span>
```

---

## Component Patterns

### Button vs Link

```tsx
// ✅ Use <button> for actions
<Button onClick={handleDelete}>
  Delete Item
</Button>

// ✅ Use <Link> for navigation
<Link href="/profile">
  View Profile
</Link>

// ✅ Use <Button asChild> for link styling
<Button asChild>
  <Link href="/dashboard">Go to Dashboard</Link>
</Button>
```

### Modal Dialogs

Already accessible via Radix UI:

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// ✅ GOOD - Full accessibility built-in
<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Are you sure?</DialogTitle>
      <DialogDescription>This action cannot be undone.</DialogDescription>
    </DialogHeader>
    {/* Dialog content */}
  </DialogContent>
</Dialog>;
```

### Dropdown Menus

Already accessible via Radix UI:

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ✅ GOOD - Full accessibility built-in
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon" aria-label="Open menu">
      <MenuIcon aria-hidden="true" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={handleProfile}>
      <UserIcon aria-hidden="true" />
      Profile
    </DropdownMenuItem>
    <DropdownMenuItem onClick={handleSettings}>
      <SettingsIcon aria-hidden="true" />
      Settings
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>;
```

### Custom Interactive Elements

If you must create a custom interactive element:

```tsx
// ✅ GOOD - Full keyboard and screen reader support
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
  aria-label="Custom action"
>
  Custom Button
</div>

// ✅ BETTER - Just use a button
<button onClick={handleClick} className="custom-styles">
  Custom Button
</button>
```

---

## Testing

### Manual Testing

#### Keyboard Navigation Test

1. Close your eyes or look away from the screen
2. Use only Tab, Shift+Tab, Enter, Space, Escape, and arrow keys
3. Can you navigate the entire page?
4. Can you activate all interactive elements?
5. Is the focus indicator always visible?

#### Screen Reader Test

1. Install NVDA (Windows) or use VoiceOver (Mac)
2. Enable screen reader and close your eyes
3. Navigate the page using screen reader commands
4. Does everything make sense?
5. Are loading states announced?
6. Are errors announced?

### Automated Testing

We will add automated accessibility testing with jest-axe:

```tsx
import { axe } from "jest-axe";
import { render } from "@testing-library/react";

test("MyComponent has no accessibility violations", async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Browser Extensions

Install these for development:

- **axe DevTools** - Automated accessibility testing
- **WAVE** - Visual accessibility feedback
- **Lighthouse** - Accessibility audit in Chrome DevTools

---

## Common Mistakes to Avoid

### ❌ Don't Do This

```tsx
// Using div as button
<div onClick={handleClick}>Click me</div>

// Icon without label
<Button size="icon">
  <MenuIcon />
</Button>

// Missing alt text
<img src="/photo.jpg" />

// Color-only indication
<span className="text-red-500">!</span>

// Skipping heading levels
<h1>Title</h1>
<h3>Section</h3>  {/* Skipped h2 */}

// Placeholder as label
<input placeholder="Email" />

// Disabled form submission without explanation
<Button disabled>Submit</Button>

// Custom dropdown without keyboard support
<div className="dropdown">
  <div onClick={toggleDropdown}>Menu</div>
  {isOpen && <div>Items</div>}
</div>
```

### ✅ Do This Instead

```tsx
// Use semantic button
<button onClick={handleClick}>Click me</button>

// Icon button with label
<Button size="icon" aria-label="Open menu">
  <MenuIcon aria-hidden="true" />
</Button>

// Image with alt text
<img src="/photo.jpg" alt="Team photo from 2024 retreat" />

// Multiple indicators
<span className="text-red-500" role="alert">
  <AlertIcon aria-hidden="true" />
  Error: Invalid input
</span>

// Proper heading hierarchy
<h1>Title</h1>
<h2>Section</h2>
<h3>Subsection</h3>

// Label with input
<Label htmlFor="email">Email</Label>
<Input id="email" type="email" />

// Disabled button with reason
<Tooltip>
  <TooltipTrigger asChild>
    <span>
      <Button disabled aria-describedby="submit-disabled-reason">
        Submit
      </Button>
    </span>
  </TooltipTrigger>
  <TooltipContent id="submit-disabled-reason">
    Complete all required fields to submit
  </TooltipContent>
</Tooltip>

// Use our dropdown components
<DropdownMenu>
  <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Item 1</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

## Resources

### WCAG Guidelines

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [Understanding WCAG 2.1](https://www.w3.org/WAI/WCAG21/Understanding/)

### ARIA

- [ARIA Authoring Practices Guide (APG)](https://www.w3.org/WAI/ARIA/apg/)
- [ARIA in HTML](https://www.w3.org/TR/html-aria/)

### Component Libraries

- [Radix UI Accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility)
- [React Accessibility Docs](https://react.dev/learn/accessibility)
- [Tailwind Accessibility](https://tailwindcss.com/docs/accessibility)

### Testing Tools

- [axe DevTools Browser Extension](https://www.deque.com/axe/devtools/)
- [WAVE Browser Extension](https://wave.webaim.org/extension/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Lighthouse (built into Chrome)](https://developers.google.com/web/tools/lighthouse)

### Screen Readers

- [NVDA (Windows)](https://www.nvaccess.org/) - Free
- [JAWS (Windows)](https://www.freedomscientific.com/products/software/jaws/) - Commercial
- [VoiceOver (macOS/iOS)](https://www.apple.com/accessibility/voiceover/) - Built-in
- [TalkBack (Android)](https://support.google.com/accessibility/android/answer/6283677) - Built-in

### Learning Resources

- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
- [MDN Accessibility Guide](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM Training](https://webaim.org/training/)

---

## Getting Help

### Questions?

- Check the [WCAG 2.1 Compliance Report](./ACCESSIBILITY_WCAG_COMPLIANCE_REPORT.md)
- Ask in team chat or during code review
- Consult the resources above

### Found an Accessibility Issue?

1. Create a GitHub issue with label `accessibility`
2. Include:
   - Location (component/page)
   - WCAG criterion affected
   - How to reproduce
   - Suggested fix

### Contributing Accessibility Fixes

1. Reference this guide
2. Test with keyboard and screen reader
3. Add accessibility tests if possible
4. Document any new patterns

---

**Remember**: Accessibility is not a feature, it's a requirement. Every user deserves equal access to our platform.

---

_Last Updated: January 2025_  
_For questions or updates: See [CONTRIBUTING.md](./CONTRIBUTING.md)_
