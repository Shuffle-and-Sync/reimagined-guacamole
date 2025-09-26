# Copilot Agent Implementation for Shuffle & Sync

This document demonstrates the complete implementation of a Copilot agent that follows all the repository's coding patterns and conventions as outlined in the `.github/copilot-instructions.md`.

## 🎯 Overview

The implementation includes a comprehensive **Game Statistics** feature that showcases all the required patterns:

- **Feature-based architecture** with proper file organization
- **TypeScript strict mode** compliance with comprehensive type definitions
- **React 18** patterns with modern hooks and functional components
- **RESTful API** design with proper error handling and validation
- **Authentication integration** with Auth.js v5
- **Database operations** following Drizzle ORM patterns
- **UI components** using Shadcn/ui with Tailwind CSS
- **State management** with TanStack React Query
- **Accessibility** and responsive design best practices

## 📁 File Structure

```
client/src/features/game-stats/
├── components/
│   └── game-stats-card.tsx       # React component with Shadcn/ui
├── hooks/
│   └── use-game-stats.ts         # Custom hooks with React Query
├── types/
│   └── index.ts                  # TypeScript types and Zod schemas
└── index.ts                      # Feature exports

server/features/game-stats/
├── game-stats.routes.ts          # Express.js RESTful routes
└── game-stats.service.ts         # Business logic service layer

client/src/pages/
└── game-stats-example.tsx        # Complete page implementation
```

## 🏗️ Architecture Patterns

### Frontend Architecture

#### 1. Feature-Based Organization
```typescript
// client/src/features/game-stats/index.ts
export type { GameStats, GameResult, TCGType } from './types';
export { GameStatsCard, GameStatsCardSkeleton } from './components/game-stats-card';
export { useGameStats, useAggregateGameStats } from './hooks/use-game-stats';
```

#### 2. TypeScript Strict Configuration
```typescript
// Comprehensive type definitions with Zod validation
export interface GameStats {
  id: string;
  userId: string;
  gameType: TCGType;
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  favoriteFormat: string | null;
  lastPlayed: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Runtime validation with Zod
export const gameResultSchema = z.object({
  gameType: z.enum(['mtg', 'pokemon', 'lorcana', 'yugioh', 'flesh-and-blood', 'keyforge']),
  format: z.string().min(1, 'Format is required'),
  result: z.enum(['win', 'loss', 'draw']),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
});
```

#### 3. React Patterns with Hooks
```typescript
// Custom hook following repository conventions
export function useGameStats(filters?: GameStatsQuery) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // TanStack React Query for server state
  const { data: gameStatsData, isLoading, error } = useQuery({
    queryKey: user ? QUERY_KEYS.gameStatsUser(user.id) : ['game-stats-anonymous'],
    queryFn: async (): Promise<GameStatsResponse> => {
      if (!user) throw new Error('User not authenticated');
      return apiRequest(`/api/game-stats?${params}`);
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  return {
    gameStats: gameStatsData?.stats || [],
    isLoading,
    error,
    createGameResult: (data) => createGameResultMutation.mutateAsync(data),
  };
}
```

#### 4. Component Composition with Shadcn/ui
```typescript
// Component following repository UI patterns
export function GameStatsCard({ stats, className, onEdit }: GameStatsCardProps) {
  const theme = TCG_THEMES[stats.gameType];
  const winRate = Math.round(stats.winRate * 100);

  return (
    <Card className={cn('relative overflow-hidden transition-all duration-300', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', theme.color)}>
              {theme.icon}
            </div>
            <CardTitle>{theme.name}</CardTitle>
          </div>
          {onEdit && (
            <Button variant="ghost" size="sm" onClick={() => onEdit(stats)}>
              <Edit3 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Progress value={winRate} className="h-2" />
        {/* Additional content */}
      </CardContent>
    </Card>
  );
}
```

### Backend Architecture

#### 1. RESTful API Design
```typescript
// Express.js routes with proper HTTP methods and status codes
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const query = gameStatsQuerySchema.parse(req.query);
    const userId = req.user!.id;
    const result = await gameStatsService.getUserGameStats(userId, query);

    res.json({
      success: true,
      data: result,
      message: 'Game statistics retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
});

router.post('/game-results', requireAuth, validateRequest(createGameResultSchema), async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const newResult = await gameStatsService.createGameResult(userId, req.body);
    
    res.status(201).json({
      success: true,
      data: newResult,
      message: 'Game result recorded successfully',
    });
  } catch (error) {
    next(error);
  }
});
```

#### 2. Authentication Integration
```typescript
// Auth.js v5 middleware integration
import { requireAuth } from '../../auth/auth.middleware';

// Protected route requiring authentication
router.get('/', requireAuth, async (req, res, next) => {
  const userId = req.user!.id; // TypeScript knows user exists due to requireAuth
  // Route logic...
});
```

#### 3. Service Layer with Business Logic
```typescript
// Separation of concerns with service layer
class GameStatsService {
  async getUserGameStats(userId: string, filters: GameStatsFilters) {
    try {
      // Validate user exists
      const user = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
      if (!user.length) {
        throw new NotFoundError('User not found');
      }

      // Business logic with database operations
      return await this.performDatabaseQuery(userId, filters);
    } catch (error) {
      console.error('Error fetching user game stats:', error);
      throw error;
    }
  }

  async createGameResult(userId: string, gameResultData: any) {
    // Database transaction for data consistency
    return await db.transaction(async (tx) => {
      // Create game result and update statistics atomically
      const newResult = await this.insertGameResult(tx, userId, gameResultData);
      await this.updateGameStatistics(tx, userId, gameResultData);
      return newResult;
    });
  }
}
```

#### 4. Input Validation and Error Handling
```typescript
// Zod schema validation middleware
const validateRequest = (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
      });
    }
    next(error);
  }
};

// Custom error types
export class NotFoundError extends Error {
  constructor(message: string = "Resource not found") {
    super(message);
    this.name = 'NotFoundError';
  }
}
```

## 🎨 UI/UX Patterns

### 1. Tailwind CSS with Design Tokens
```typescript
// Community theming following repository conventions
const TCG_THEMES: Record<TCGType, { color: string; icon: string; name: string }> = {
  'mtg': { color: 'bg-orange-500', icon: '🔮', name: 'Magic: The Gathering' },
  'pokemon': { color: 'bg-yellow-500', icon: '⚡', name: 'Pokémon TCG' },
  // ...
};

// Responsive design with proper spacing
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {gameStats.map((stats) => (
    <GameStatsCard key={stats.id} stats={stats} />
  ))}
</div>
```

### 2. Accessibility Best Practices
```typescript
// ARIA labels and semantic HTML
<Progress 
  value={winRate} 
  className="h-2" 
  aria-label={`Win rate: ${winRate}%`}
/>

<Button
  variant="ghost"
  size="sm"
  onClick={() => onEdit(stats)}
  aria-label={`Edit ${theme.name} statistics`}
>
  <Edit3 className="h-4 w-4" />
</Button>
```

### 3. Loading States and Error Boundaries
```typescript
// Loading skeletons following Shadcn/ui patterns
export function GameStatsCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-muted rounded-lg animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            <div className="h-3 w-24 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

// Error handling with user-friendly messages
{error ? (
  <Alert>
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Error</AlertTitle>
    <AlertDescription>
      Failed to load game statistics. Please try again.
    </AlertDescription>
  </Alert>
) : (
  // Content
)}
```

## 🔒 Security and Authentication

### 1. Authentication Flow Integration
```typescript
// Auth.js v5 integration
export function useGameStats() {
  const { user, isAuthenticated } = useAuth();

  const { data, error } = useQuery({
    queryKey: user ? QUERY_KEYS.gameStatsUser(user.id) : ['anonymous'],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      return apiRequest('/api/game-stats');
    },
    enabled: !!user, // Only run query if user is authenticated
  });
}
```

### 2. Route Protection
```typescript
// Server-side route protection
router.get('/', requireAuth, async (req, res, next) => {
  const userId = req.user!.id; // Guaranteed to exist due to requireAuth middleware
  // Protected route logic...
});

// Client-side authentication check
if (!isAuthenticated) {
  return (
    <Alert>
      <AlertTitle>Authentication Required</AlertTitle>
      <AlertDescription>Please sign in to view your game statistics.</AlertDescription>
    </Alert>
  );
}
```

## 📊 State Management

### 1. TanStack React Query Integration
```typescript
// Query client configuration following repository patterns
const queryClient = useQueryClient();

// Optimistic updates and cache invalidation
const createGameResultMutation = useMutation({
  mutationFn: async (data: CreateGameResultData) => {
    const validatedData = gameResultSchema.parse(data);
    return apiRequest('/api/game-results', {
      method: 'POST',
      body: JSON.stringify(validatedData),
    });
  },
  onSuccess: () => {
    // Invalidate related queries for fresh data
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.gameStats });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.gameResults });
  },
});
```

### 2. Community Integration
```typescript
// Community theming and context integration
const { selectedCommunity, communityTheme } = useCommunity();

// Dynamic theming based on selected community
<div 
  style={{ 
    background: communityTheme ? 
      `linear-gradient(135deg, ${communityTheme.primaryColor}20 0%, ${communityTheme.secondaryColor}20 100%)` :
      undefined 
  }}
>
```

## 🧪 Testing Considerations

### 1. Component Testing
```typescript
// Test data and mock implementations
const mockGameStats: GameStats = {
  id: '1',
  userId: 'user-1',
  gameType: 'mtg',
  totalGames: 45,
  wins: 28,
  losses: 15,
  draws: 2,
  winRate: 0.62,
  favoriteFormat: 'Commander',
  lastPlayed: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Component props validation
interface GameStatsCardProps {
  stats: GameStats;
  className?: string;
  onEdit?: (stats: GameStats) => void;
}
```

### 2. API Testing
```typescript
// Mock service implementations for testing
class MockGameStatsService {
  async getUserGameStats(userId: string, filters: GameStatsFilters) {
    return {
      stats: [mockGameStats],
      recentGames: [mockGameResult],
      totalRecords: 1,
    };
  }
}
```

## 🚀 Performance Optimization

### 1. Query Optimization
```typescript
// Stale time and garbage collection configuration
const { data } = useQuery({
  queryKey: QUERY_KEYS.gameStatsUser(user.id),
  queryFn: fetchGameStats,
  staleTime: 5 * 60 * 1000,  // 5 minutes
  gcTime: 10 * 60 * 1000,    // 10 minutes
});
```

### 2. Code Splitting and Lazy Loading
```typescript
// Feature-based code organization enables easy code splitting
import { GameStatsCard } from '@/features/game-stats';

// Lazy loading for pages
const GameStatsPage = lazy(() => import('@/pages/game-stats-example'));
```

## 📋 Checklist: Implementation Compliance

### ✅ Core Architecture
- [x] Feature-based file organization
- [x] TypeScript strict configuration compliance
- [x] Proper separation of client/server/shared code
- [x] Consistent naming conventions (kebab-case files, PascalCase components, camelCase functions)

### ✅ Frontend Implementation
- [x] React 18 functional components with hooks
- [x] TanStack React Query for server state management
- [x] Wouter routing integration
- [x] Shadcn/ui components with consistent styling
- [x] Tailwind CSS with design tokens and dark theme support

### ✅ Backend Implementation
- [x] Express.js RESTful API design
- [x] Auth.js v5 authentication middleware integration
- [x] Drizzle ORM type-safe database operations
- [x] Proper error handling with custom error types
- [x] Input validation using Zod schemas
- [x] Consistent response formats

### ✅ Code Quality
- [x] Comprehensive TypeScript type definitions
- [x] Detailed comments and documentation
- [x] Error boundaries and loading states
- [x] Accessibility best practices
- [x] Responsive design patterns
- [x] Security best practices

### ✅ Testing & Performance
- [x] Mock implementations for testing
- [x] Performance optimization with query caching
- [x] Code splitting readiness
- [x] Error handling and user feedback

## 🎓 Usage Examples

### Running the Example
1. Navigate to `/game-stats-example` in the application
2. Sign in with your account
3. Explore the different tabs:
   - **Overview**: View aggregate statistics and game cards
   - **Detailed Stats**: See recent game results
   - **Leaderboard**: Compare with other players
   - **Add Result**: Record new game results

### API Endpoints
```
GET    /api/game-stats              - Get user's game statistics
PUT    /api/game-stats              - Update statistics preferences
GET    /api/game-stats/aggregate    - Get aggregate statistics
GET    /api/game-stats/leaderboard  - Get leaderboard data
POST   /api/game-results            - Create new game result
GET    /api/game-results            - Get user's game results
DELETE /api/game-results/:id        - Delete a game result
```

## 📚 Further Reading

- [Shuffle & Sync Repository Documentation](./replit.md)
- [TypeScript Best Practices](./tsconfig.json)
- [Shadcn/ui Component Library](./components.json)
- [Tailwind CSS Configuration](./tailwind.config.ts)
- [Authentication Configuration](./server/auth/)

This implementation serves as a comprehensive example of how to build features that follow all the Shuffle & Sync repository conventions and can be used as a template for future development.