# Shadcn/ui Component Best Practices

## Overview
This document outlines best practices for using and extending the Shadcn/ui component library in the Shuffle & Sync application. Following these guidelines ensures consistency, accessibility, and maintainability.

---

## General Principles

### 1. Composition Over Modification
**✅ Do:** Compose existing components to create new ones
```tsx
// Create a specialized component by composing base components
function TournamentCard({ tournament }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{tournament.name}</CardTitle>
        <CardDescription>{tournament.date}</CardDescription>
      </CardHeader>
      <CardContent>
        <Badge>{tournament.status}</Badge>
        <p>{tournament.players} players</p>
      </CardContent>
      <CardFooter>
        <Button>Join Tournament</Button>
      </CardFooter>
    </Card>
  )
}
```

**❌ Don't:** Modify the base UI components directly
```tsx
// Don't edit client/src/components/ui/card.tsx to add tournament-specific logic
```

### 2. Keep UI Components Stateless
**✅ Do:** Manage state in parent components or custom hooks
```tsx
function SearchForm() {
  const [query, setQuery] = useState("")
  
  return (
    <Input 
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search..."
    />
  )
}
```

**❌ Don't:** Add state to UI components
```tsx
// Don't add useState inside the base Input component
```

### 3. Use Design Tokens
**✅ Do:** Use Tailwind design tokens
```tsx
<Card className="bg-card text-card-foreground border-border">
  Content
</Card>
```

**❌ Don't:** Use hardcoded colors
```tsx
<Card className="bg-white text-black border-gray-200">
  Content
</Card>
```

---

## Accessibility Guidelines

### Keyboard Navigation
All interactive components must be keyboard accessible:

```tsx
// ✅ Buttons are keyboard accessible by default
<Button onClick={handleClick}>Click Me</Button>

// ✅ Custom clickable elements should be buttons or have proper ARIA
<div role="button" tabIndex={0} onKeyDown={handleKeyDown}>
  Custom Element
</div>
```

### ARIA Labels
Provide descriptive labels for screen readers:

```tsx
// ✅ Icon buttons with labels
<Button size="icon" aria-label="Delete tournament">
  <TrashIcon />
</Button>

// ✅ Descriptive link text
<Button asChild>
  <Link to={`/tournaments/${id}`}>
    View Tournament Details
  </Link>
</Button>

// ❌ Generic or missing labels
<Button size="icon">
  <TrashIcon />
</Button>
```

### Form Accessibility
Always associate labels with inputs:

```tsx
// ✅ Proper label association
<div className="space-y-2">
  <Label htmlFor="email">Email Address</Label>
  <Input id="email" type="email" aria-required="true" />
</div>

// ✅ With Form component (handles association automatically)
<FormField
  control={form.control}
  name="email"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Email Address</FormLabel>
      <FormControl>
        <Input type="email" {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Error Messages
Make error messages accessible:

```tsx
// ✅ Error message with proper ARIA
<div className="space-y-2">
  <Label htmlFor="username">Username</Label>
  <Input 
    id="username" 
    aria-invalid={!!error}
    aria-describedby={error ? "username-error" : undefined}
  />
  {error && (
    <p id="username-error" className="text-sm text-destructive">
      {error}
    </p>
  )}
</div>

// ✅ Form component handles this automatically
<FormField
  control={form.control}
  name="username"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Username</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
      <FormMessage /> {/* Automatically has proper ARIA */}
    </FormItem>
  )}
/>
```

---

## Dark Theme Best Practices

### Use Theme Tokens
**✅ Do:** Use CSS custom properties
```tsx
<div className="bg-background text-foreground border-border">
  Content adapts to theme
</div>
```

**❌ Don't:** Use theme-specific classes
```tsx
<div className="bg-white dark:bg-gray-900">
  Avoid manual dark mode classes
</div>
```

### Test Both Themes
Always verify components work in both light and dark themes:

```tsx
// Component should work in both themes
<Card>
  <CardHeader>
    <CardTitle>Works in Light and Dark</CardTitle>
  </CardHeader>
  <CardContent>
    <Button>Action</Button>
  </CardContent>
</Card>
```

### Maintain Contrast
Ensure sufficient contrast in both themes:

```tsx
// ✅ Good contrast using tokens
<p className="text-foreground">Primary text</p>
<p className="text-muted-foreground">Secondary text</p>

// ❌ Poor contrast
<p className="text-gray-400">Hard to read in light mode</p>
```

---

## Form Handling

### Use React Hook Form with Zod
**✅ Do:** Use the recommended form pattern
```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const schema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
})

function MyForm() {
  const form = useForm({
    resolver: zodResolver(schema),
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}
      </form>
    </Form>
  )
}
```

### Validation Messages
Provide clear, helpful error messages:

```tsx
// ✅ Clear validation messages
const schema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username cannot exceed 20 characters"),
  email: z.string()
    .email("Please enter a valid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter"),
})

// ❌ Generic messages
const schema = z.object({
  username: z.string().min(3), // No custom message
  email: z.string().email(),    // Generic message
})
```

### Form Layout
Use consistent spacing and layout:

```tsx
// ✅ Consistent form layout
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
    <FormField
      control={form.control}
      name="username"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Username</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormDescription>
            Your public display name
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
    
    <div className="flex justify-end space-x-2">
      <Button type="button" variant="outline">Cancel</Button>
      <Button type="submit">Save</Button>
    </div>
  </form>
</Form>
```

---

## Performance Best Practices

### Memoization
Use React.memo for components that receive the same props frequently:

```tsx
import { memo } from "react"

// ✅ Memoize expensive list items
const TournamentListItem = memo(({ tournament, onSelect }) => (
  <Card onClick={() => onSelect(tournament.id)}>
    <CardHeader>
      <CardTitle>{tournament.name}</CardTitle>
    </CardHeader>
  </Card>
))

function TournamentList({ tournaments }) {
  return tournaments.map(t => (
    <TournamentListItem key={t.id} tournament={t} onSelect={handleSelect} />
  ))
}
```

### Avoid Inline Functions
Define handlers outside render when possible:

```tsx
// ✅ Handler defined outside
function MyComponent() {
  const handleClick = useCallback(() => {
    console.log("Clicked")
  }, [])
  
  return <Button onClick={handleClick}>Click</Button>
}

// ⚠️ Inline functions cause re-renders in memoized children
function MyComponent() {
  return <Button onClick={() => console.log("Clicked")}>Click</Button>
}
```

### Lazy Loading
Lazy load heavy components:

```tsx
import { lazy, Suspense } from "react"

// ✅ Lazy load Chart component
const Chart = lazy(() => import("@/components/ui/chart"))

function Dashboard() {
  return (
    <Suspense fallback={<Skeleton className="h-[300px]" />}>
      <Chart data={data} />
    </Suspense>
  )
}
```

---

## Component Organization

### File Structure
Organize feature-specific components in the features directory:

```
client/src/
├── components/
│   ├── ui/              # Base Shadcn components (don't modify)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── ...
│   └── ...              # App-specific shared components
├── features/
│   ├── tournaments/
│   │   ├── components/  # Tournament-specific components
│   │   │   ├── TournamentCard.tsx
│   │   │   └── TournamentList.tsx
│   │   ├── hooks/
│   │   └── ...
│   └── communities/
│       └── ...
```

### Component Naming
Use clear, descriptive names:

```tsx
// ✅ Clear, descriptive names
TournamentCard.tsx
TournamentList.tsx
TournamentRegistrationForm.tsx

// ❌ Generic names
Card.tsx          // Too generic for feature components
List.tsx          // What kind of list?
Form.tsx          // What form?
```

---

## Styling Guidelines

### Tailwind Utilities
Use Tailwind utility classes over custom CSS:

```tsx
// ✅ Use Tailwind utilities
<Card className="p-6 shadow-lg hover:shadow-xl transition-shadow">
  Content
</Card>

// ❌ Avoid custom CSS when Tailwind provides it
<Card className="custom-card">
  Content
</Card>
// custom.css
.custom-card {
  padding: 1.5rem;
  box-shadow: 0 10px 15px rgba(0,0,0,0.1);
}
```

### Class Organization
Use the `cn` utility for conditional classes:

```tsx
import { cn } from "@/lib/utils"

// ✅ Use cn for conditional classes
<Button 
  className={cn(
    "base-class",
    isActive && "active-class",
    variant === "special" && "special-class"
  )}
>
  Button
</Button>

// ❌ String concatenation
<Button 
  className={`base-class ${isActive ? "active-class" : ""} ${variant === "special" ? "special-class" : ""}`}
>
  Button
</Button>
```

### Responsive Design
Use responsive utilities:

```tsx
// ✅ Mobile-first responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id}>...</Card>)}
</div>

// Text sizing
<h1 className="text-2xl md:text-3xl lg:text-4xl">
  Responsive Heading
</h1>
```

---

## Testing Considerations

### Testable Components
Write components that are easy to test:

```tsx
// ✅ Testable - receives data as props
function TournamentCard({ tournament, onJoin }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{tournament.name}</CardTitle>
      </CardHeader>
      <CardFooter>
        <Button onClick={() => onJoin(tournament.id)}>
          Join
        </Button>
      </CardFooter>
    </Card>
  )
}

// ❌ Hard to test - fetches data internally
function TournamentCard({ tournamentId }) {
  const [tournament, setTournament] = useState(null)
  
  useEffect(() => {
    fetchTournament(tournamentId).then(setTournament)
  }, [tournamentId])
  
  // ...
}
```

### Data-testid Attributes
Use data-testid for testing:

```tsx
<Card data-testid="tournament-card">
  <CardHeader>
    <CardTitle data-testid="tournament-name">
      {tournament.name}
    </CardTitle>
  </CardHeader>
  <Button data-testid="join-button" onClick={onJoin}>
    Join
  </Button>
</Card>
```

---

## Documentation

### Component Comments
Document complex component usage:

```tsx
/**
 * TournamentCard - Displays tournament information with join action
 * 
 * @param {Tournament} tournament - Tournament data object
 * @param {Function} onJoin - Callback when user clicks join button
 * @param {boolean} isRegistered - Whether user is already registered
 */
function TournamentCard({ tournament, onJoin, isRegistered }) {
  // Implementation
}
```

### Usage Examples
Include usage examples in complex components:

```tsx
/**
 * @example
 * ```tsx
 * <TournamentCard 
 *   tournament={tournament}
 *   onJoin={handleJoin}
 *   isRegistered={false}
 * />
 * ```
 */
```

---

## Common Pitfalls to Avoid

### 1. Not Using forwardRef
When wrapping UI components:

```tsx
// ✅ Use forwardRef
const CustomButton = forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => <Button ref={ref} {...props} />
)

// ❌ Without forwardRef (ref won't work)
const CustomButton = (props: ButtonProps) => <Button {...props} />
```

### 2. Breaking Accessibility
```tsx
// ❌ Div clickable without keyboard support
<div onClick={handleClick}>Click me</div>

// ✅ Use button or add proper ARIA and keyboard handlers
<Button onClick={handleClick}>Click me</Button>
// Or
<div 
  role="button" 
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => e.key === "Enter" && handleClick()}
>
  Click me
</div>
```

### 3. Overriding Component Styles
```tsx
// ❌ Overriding internal styles
<Button className="p-0 h-auto">
  Breaks button appearance
</Button>

// ✅ Extend, don't replace
<Button className="px-6">
  Custom padding
</Button>
```

### 4. Not Handling Loading States
```tsx
// ❌ No loading state
<Button onClick={handleSubmit}>Submit</Button>

// ✅ Show loading state
<Button onClick={handleSubmit} disabled={isLoading}>
  {isLoading ? "Submitting..." : "Submit"}
</Button>
```

---

## Migration Guide

### When to Create a New Component
Create a new component when:
- You're using the same composition in 3+ places
- The component has its own state/logic
- It represents a distinct UI pattern

```tsx
// If you see this pattern repeated:
<Card>
  <CardHeader>
    <CardTitle>{user.name}</CardTitle>
    <CardDescription>{user.email}</CardDescription>
  </CardHeader>
  <CardContent>
    <Avatar src={user.avatar} />
    <Badge>{user.role}</Badge>
  </CardContent>
</Card>

// Extract to:
function UserCard({ user }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{user.name}</CardTitle>
        <CardDescription>{user.email}</CardDescription>
      </CardHeader>
      <CardContent>
        <Avatar src={user.avatar} />
        <Badge>{user.role}</Badge>
      </CardContent>
    </Card>
  )
}
```

---

## Maintenance Checklist

Before committing component changes:
- [ ] TypeScript types are properly defined
- [ ] Component works in light and dark themes
- [ ] Accessibility attributes are present
- [ ] Component is keyboard navigable
- [ ] Error states are handled
- [ ] Loading states are shown when appropriate
- [ ] Component follows naming conventions
- [ ] Documentation is updated
- [ ] Examples are provided for complex usage

---

## Resources

- **Radix UI**: https://www.radix-ui.com/
- **Tailwind CSS**: https://tailwindcss.com/
- **React Hook Form**: https://react-hook-form.com/
- **Zod**: https://zod.dev/
- **ARIA Authoring Practices**: https://www.w3.org/WAI/ARIA/apg/
- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
