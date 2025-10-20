# Frontend (Client) Custom Instructions

**Applies to**: `client/**/*`

## Overview

This directory contains the React-based frontend application built with Vite, TypeScript, and Tailwind CSS.

## Key Technologies

- **React 18.3.1** with TypeScript
- **Vite 6.0** for fast dev server and optimized builds
- **Shadcn/ui** component library built on Radix UI
- **Tailwind CSS 3.4** with custom design system
- **TanStack React Query v5** for server state management
- **Zustand** for client state management
- **Wouter** for lightweight routing
- **React Hook Form** with Zod validation

## Directory Structure

```
client/src/
├── components/          # Reusable UI components
│   ├── ui/             # Shadcn/ui base components (DO NOT MODIFY DIRECTLY)
│   └── shared/         # Shared application components
├── features/           # Feature modules (primary organization)
│   └── [feature]/
│       ├── components/ # Feature-specific components
│       ├── hooks/      # Feature-specific hooks
│       ├── services/   # API service functions
│       └── types.ts    # TypeScript types
├── pages/              # Top-level route components
├── hooks/              # Global custom hooks
├── lib/                # Utilities and configurations
└── shared/             # Shared utilities and types
```

## Component Development Guidelines

### Component Structure

```typescript
// Use function declarations, not arrow functions for components
export function UserProfile({ userId }: UserProfileProps) {
  // 1. Hooks first (React hooks, then custom hooks)
  const { user, isLoading } = useUser(userId);
  const [isEditing, setIsEditing] = useState(false);
  
  // 2. Event handlers
  const handleEdit = () => {
    setIsEditing(true);
  };
  
  // 3. Early returns for loading/error states
  if (isLoading) return <Skeleton />;
  if (!user) return <NotFound />;
  
  // 4. Main component render
  return (
    <div className="space-y-4">
      <h1>{user.name}</h1>
      {/* ... */}
    </div>
  );
}
```

### Shadcn/ui Components

**DO NOT modify files in `client/src/components/ui/`** - These are generated components from Shadcn/ui.

```typescript
// ✅ CORRECT - Import and use as-is
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// ✅ CORRECT - Extend with composition
export function PrimaryButton(props: ButtonProps) {
  return <Button variant="default" size="lg" {...props} />;
}

// ❌ WRONG - Don't modify ui components directly
// Don't edit client/src/components/ui/button.tsx
```

To add new Shadcn/ui components:
```bash
npx shadcn@latest add [component-name]
```

### Styling with Tailwind

```typescript
// ✅ GOOD - Use Tailwind utility classes
<div className="flex items-center gap-4 rounded-lg border p-4">

// ✅ GOOD - Use cn() for conditional classes
import { cn } from "@/lib/utils";
<div className={cn(
  "rounded-lg border p-4",
  isActive && "bg-primary text-primary-foreground"
)}>

// ❌ BAD - Inline styles (only use for dynamic values)
<div style={{ padding: '16px' }}>
```

**Color System**: Use semantic color classes:
- `text-foreground` / `bg-background` - Default text/background
- `text-primary` / `bg-primary` - Primary brand color
- `text-muted` / `bg-muted` - Muted/secondary content
- `text-destructive` / `bg-destructive` - Error/delete actions

### Data Fetching with React Query

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ✅ CORRECT - Define query keys as constants
const userKeys = {
  all: ['users'] as const,
  detail: (id: string) => [...userKeys.all, id] as const,
  communities: (id: string) => [...userKeys.detail(id), 'communities'] as const,
};

// Queries
function useUser(userId: string) {
  return useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: () => userService.getById(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Mutations
function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: UpdateUserData) => userService.update(data),
    onSuccess: (updatedUser) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      // Or update cache directly
      queryClient.setQueryData(userKeys.detail(updatedUser.id), updatedUser);
    },
  });
}
```

### Form Handling

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const formSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
});

type FormData = z.infer<typeof formSchema>;

export function UserForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  });
  
  const onSubmit = async (data: FormData) => {
    try {
      await userService.create(data);
      toast.success('User created successfully');
    } catch (error) {
      toast.error('Failed to create user');
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* ... */}
      </form>
    </Form>
  );
}
```

### API Service Functions

**Location**: `client/src/features/[feature]/services/`

```typescript
// ✅ CORRECT - Feature-based service organization
// client/src/features/users/services/user-service.ts

export const userService = {
  async getById(id: string) {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  },
  
  async create(data: CreateUserData) {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create user');
    return response.json();
  },
};
```

## Routing

**Router**: Wouter (lightweight React router)

```typescript
// pages/App.tsx
import { Route, Switch, Redirect } from 'wouter';

function App() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/communities" component={CommunitiesPage} />
      <Route path="/communities/:id" component={CommunityDetailPage} />
      <Route path="/tournaments" component={TournamentsPage} />
      
      {/* Protected routes */}
      <Route path="/admin">
        {(params) => (
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        )}
      </Route>
      
      {/* 404 Not Found */}
      <Route component={NotFoundPage} />
    </Switch>
  );
}
```

## State Management

### Server State (React Query)

Use React Query for all server data:
- User data
- Communities
- Tournaments
- Events
- Any data from API

### Client State (Zustand)

Use Zustand for UI state only:
- Theme preferences
- Sidebar open/closed
- Modal state
- Form wizards
- Filter selections

```typescript
// lib/stores/ui-store.ts
import { create } from 'zustand';

interface UIState {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));
```

## Performance Optimization

### Code Splitting

```typescript
// Use React.lazy for route-based code splitting
import { lazy, Suspense } from 'react';

const CommunitiesPage = lazy(() => import('./pages/CommunitiesPage'));

function App() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Route path="/communities" component={CommunitiesPage} />
    </Suspense>
  );
}
```

### Memoization

```typescript
import { memo, useMemo, useCallback } from 'react';

// Memoize expensive computations
function UserList({ users }: UserListProps) {
  const sortedUsers = useMemo(
    () => users.sort((a, b) => a.name.localeCompare(b.name)),
    [users]
  );
  
  // Memoize callbacks
  const handleUserClick = useCallback(
    (userId: string) => {
      navigate(`/users/${userId}`);
    },
    [navigate]
  );
  
  return (
    <div>
      {sortedUsers.map((user) => (
        <UserCard key={user.id} user={user} onClick={handleUserClick} />
      ))}
    </div>
  );
}

// Memoize components to prevent unnecessary re-renders
export const UserCard = memo(({ user, onClick }: UserCardProps) => {
  return <div onClick={() => onClick(user.id)}>{user.name}</div>;
});
```

## Common Patterns

### Loading States

```typescript
export function UserProfile({ userId }: UserProfileProps) {
  const { data: user, isLoading, error } = useUser(userId);
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load user profile</AlertDescription>
      </Alert>
    );
  }
  
  if (!user) {
    return <NotFound resource="User" />;
  }
  
  return <div>{/* User content */}</div>;
}
```

### Error Boundaries

```typescript
import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 text-center">
          <h2>Something went wrong</h2>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

## Testing

### Component Tests

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserProfile } from './UserProfile';

describe('UserProfile', () => {
  it('renders user information', async () => {
    render(<UserProfile userId="123" />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });
  
  it('handles edit button click', async () => {
    const user = userEvent.setup();
    render(<UserProfile userId="123" />);
    
    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);
    
    expect(screen.getByRole('form')).toBeInTheDocument();
  });
});
```

## Common Issues

### Issue: Hydration Mismatch

**Problem**: React hydration errors in production.

**Solution**: Ensure server-rendered HTML matches client-rendered HTML. Avoid using Date.now(), Math.random(), or browser-only APIs during render.

### Issue: Stale Data After Mutation

**Problem**: UI doesn't update after creating/updating data.

**Solution**: Invalidate or update React Query cache:
```typescript
const queryClient = useQueryClient();
queryClient.invalidateQueries({ queryKey: ['users'] });
```

### Issue: Infinite Re-renders

**Problem**: Component re-renders infinitely.

**Solution**: Check useEffect dependencies, ensure callbacks are memoized, verify state updates don't trigger themselves.

---

**Remember**: Frontend code should be organized by feature, use TypeScript strictly, leverage React Query for server state, and follow Shadcn/ui patterns for consistency.
