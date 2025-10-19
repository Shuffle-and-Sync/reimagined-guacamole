# Shadcn/ui Component Usage Guide

## Overview

This guide provides practical examples and best practices for using the Shadcn/ui components in the Shuffle & Sync application. All components are designed to be accessible, themeable, and work seamlessly with React Hook Form and Zod validation.

---

## Core Form Components

### Button

The Button component is the most versatile interactive element in the UI. Use it for all clickable actions.

#### Basic Usage

```tsx
import { Button } from "@/components/ui/button"

// Primary action
<Button onClick={handleSubmit}>Submit</Button>

// Secondary action
<Button variant="secondary">Cancel</Button>

// Destructive action (deletes, removes, etc.)
<Button variant="destructive" onClick={handleDelete}>
  Delete Account
</Button>
```

#### Size Variants

```tsx
// Small button (compact spaces)
<Button size="sm">Small</Button>

// Default button
<Button>Default Size</Button>

// Large button (emphasis)
<Button size="lg">Large</Button>

// Icon-only button (square)
<Button size="icon" aria-label="Settings">
  <SettingsIcon />
</Button>
```

#### Style Variants

```tsx
// Outline button (less emphasis)
<Button variant="outline">Learn More</Button>

// Ghost button (minimal, for secondary actions)
<Button variant="ghost">Skip</Button>

// Link button (styled like a link)
<Button variant="link">Read Documentation</Button>
```

#### Advanced Usage

```tsx
// Disabled state
<Button disabled>Processing...</Button>

// With loading state
<Button disabled={isLoading}>
  {isLoading ? "Saving..." : "Save"}
</Button>

// As a link (using asChild)
import { Link } from "wouter"

<Button asChild>
  <Link to="/tournaments">View Tournaments</Link>
</Button>

// With icon
<Button>
  <PlusIcon className="mr-2" />
  Create Tournament
</Button>
```

---

### Input

The Input component handles all text-based form inputs.

#### Basic Usage

```tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

<div className="space-y-2">
  <Label htmlFor="username">Username</Label>
  <Input id="username" type="text" placeholder="Enter username" />
</div>;
```

#### Input Types

```tsx
// Email input
<Input type="email" placeholder="you@example.com" />

// Password input
<Input type="password" placeholder="Enter password" />

// Number input
<Input type="number" min={0} max={100} placeholder="Age" />

// Date input
<Input type="date" />

// Search input
<Input type="search" placeholder="Search..." />

// File input
<Input type="file" accept="image/*" />
```

#### With React Hook Form

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const formSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
});

function MyForm() {
  const form = useForm({
    resolver: zodResolver(formSchema),
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Input {...form.register("username")} />
      <Input {...form.register("email")} />
      <Button type="submit">Submit</Button>
    </form>
  );
}
```

#### With Form Component (Recommended)

```tsx
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="username"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Username</FormLabel>
          <FormControl>
            <Input placeholder="johndoe" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <Button type="submit">Submit</Button>
  </form>
</Form>;
```

---

### Select

The Select component provides an accessible dropdown for choosing from multiple options.

#### Basic Usage

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

<Select>
  <SelectTrigger className="w-[200px]">
    <SelectValue placeholder="Select a game" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="mtg">Magic: The Gathering</SelectItem>
    <SelectItem value="pokemon">Pokemon TCG</SelectItem>
    <SelectItem value="yugioh">Yu-Gi-Oh!</SelectItem>
    <SelectItem value="lorcana">Disney Lorcana</SelectItem>
  </SelectContent>
</Select>;
```

#### Grouped Options

```tsx
import {
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "@/components/ui/select";

<Select>
  <SelectTrigger>
    <SelectValue placeholder="Choose a community" />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>Trading Card Games</SelectLabel>
      <SelectItem value="mtg">Magic: The Gathering</SelectItem>
      <SelectItem value="pokemon">Pokemon TCG</SelectItem>
    </SelectGroup>
    <SelectSeparator />
    <SelectGroup>
      <SelectLabel>Board Games</SelectLabel>
      <SelectItem value="settlers">Settlers of Catan</SelectItem>
      <SelectItem value="pandemic">Pandemic</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>;
```

#### With Form Component

```tsx
<FormField
  control={form.control}
  name="primaryGame"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Primary Game</FormLabel>
      <Select onValueChange={field.onChange} defaultValue={field.value}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Select your primary game" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="mtg">Magic: The Gathering</SelectItem>
          <SelectItem value="pokemon">Pokemon TCG</SelectItem>
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```

#### Disabled Items

```tsx
<SelectContent>
  <SelectItem value="free">Free Tier</SelectItem>
  <SelectItem value="premium" disabled>
    Premium (Coming Soon)
  </SelectItem>
</SelectContent>
```

---

## Layout Components

### Card

Cards are the primary container for grouped content.

#### Basic Card

```tsx
import { Card, CardContent } from "@/components/ui/card";

<Card>
  <CardContent className="p-6">Simple card content</CardContent>
</Card>;
```

#### Full Card Structure

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Tournament Details</CardTitle>
    <CardDescription>View and manage tournament information</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Tournament starts in 2 hours</p>
    <p>32 players registered</p>
  </CardContent>
  <CardFooter className="justify-between">
    <Button variant="outline">Cancel</Button>
    <Button>Register</Button>
  </CardFooter>
</Card>;
```

#### Interactive Card

```tsx
// Clickable card with hover effect
<Card
  className="hover:shadow-lg transition-shadow cursor-pointer"
  onClick={() => navigate(`/tournaments/${id}`)}
>
  <CardHeader>
    <CardTitle>Modern Tournament</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Join the weekly Modern event</p>
  </CardContent>
</Card>
```

#### Card Grid Layout

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {tournaments.map((tournament) => (
    <Card key={tournament.id}>
      <CardHeader>
        <CardTitle>{tournament.name}</CardTitle>
        <CardDescription>{tournament.date}</CardDescription>
      </CardHeader>
      <CardContent>
        <p>{tournament.players} players</p>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Join</Button>
      </CardFooter>
    </Card>
  ))}
</div>
```

---

## Form Integration Patterns

### Complete Form Example

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const profileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  primaryGame: z.string({
    required_error: "Please select a game",
  }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

function ProfileForm() {
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: "",
      email: "",
    },
  });

  function onSubmit(data: ProfileFormValues) {
    console.log(data);
    // Handle form submission
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="johndoe" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="primaryGame"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Primary Game</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your main game" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="mtg">Magic: The Gathering</SelectItem>
                  <SelectItem value="pokemon">Pokemon TCG</SelectItem>
                  <SelectItem value="yugioh">Yu-Gi-Oh!</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                This will be your default community
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Save Profile
        </Button>
      </form>
    </Form>
  );
}
```

---

## Accessibility Best Practices

### Labels and Inputs

Always associate labels with inputs for screen reader users:

```tsx
// ✅ Good - explicit association
<Label htmlFor="email">Email</Label>
<Input id="email" type="email" />

// ❌ Bad - no association
<p>Email</p>
<Input type="email" />
```

### Button Labels

Icon-only buttons must have accessible labels:

```tsx
// ✅ Good - has aria-label
<Button size="icon" aria-label="Open settings">
  <SettingsIcon />
</Button>

// ❌ Bad - no accessible label
<Button size="icon">
  <SettingsIcon />
</Button>
```

### Form Validation

Always show validation errors:

```tsx
// ✅ Good - shows error message
<FormField
  control={form.control}
  name="username"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Username</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
      <FormMessage /> {/* Shows validation errors */}
    </FormItem>
  )}
/>
```

---

## Dark Theme Support

All components automatically support dark theme through CSS custom properties. No additional configuration needed.

### Testing Dark Theme

```tsx
// Toggle dark mode (example with next-themes)
import { useTheme } from "next-themes";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      Toggle Theme
    </Button>
  );
}
```

### Custom Theme Colors

Components use these design tokens (defined in `tailwind.config.ts`):

- `background` / `foreground`
- `card` / `card-foreground`
- `primary` / `primary-foreground`
- `secondary` / `secondary-foreground`
- `muted` / `muted-foreground`
- `accent` / `accent-foreground`
- `destructive` / `destructive-foreground`

---

## Performance Tips

### Memoization

For expensive components or lists, consider memoization:

```tsx
import { memo } from "react";

const TournamentCard = memo(({ tournament }) => (
  <Card>
    <CardHeader>
      <CardTitle>{tournament.name}</CardTitle>
    </CardHeader>
  </Card>
));
```

### Lazy Loading

For heavy components like Calendar or Chart:

```tsx
import { lazy, Suspense } from "react";

const Calendar = lazy(() => import("@/components/ui/calendar"));

function MyComponent() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Calendar />
    </Suspense>
  );
}
```

---

## Common Patterns

### Loading State

```tsx
function MyForm() {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <form>
      <Input disabled={isLoading} />
      <Button disabled={isLoading}>{isLoading ? "Saving..." : "Save"}</Button>
    </form>
  );
}
```

### Error State

```tsx
function MyInput() {
  const [error, setError] = useState("");

  return (
    <div className="space-y-2">
      <Label htmlFor="username">Username</Label>
      <Input id="username" className={error ? "border-destructive" : ""} />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
```

### Confirmation Dialog

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Deletion</DialogTitle>
      <DialogDescription>
        This action cannot be undone. Are you sure?
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button variant="destructive" onClick={handleDelete}>
        Delete
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>;
```

---

## Additional Resources

- [Radix UI Documentation](https://www.radix-ui.com/docs/primitives/overview/introduction)
- [React Hook Form Documentation](https://react-hook-form.com/)
- [Zod Documentation](https://zod.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
