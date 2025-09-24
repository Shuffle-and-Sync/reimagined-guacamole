/**
 * Game Statistics Custom Hook
 * 
 * This hook demonstrates proper React patterns and state management
 * following the Shuffle & Sync repository conventions:
 * - TanStack React Query for server state management
 * - Custom hooks for shared logic
 * - Proper error handling and loading states
 * - Type-safe API interactions with Zod validation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  GameStats,
  GameResult,
  GameStatsResponse,
  CreateGameResultData,
  GameStatsQuery,
  gameResultSchema,
  gameStatsFiltersSchema,
} from '../types';

// Query keys following repository patterns
const QUERY_KEYS = {
  gameStats: ['game-stats'] as const,
  gameStatsUser: (userId: string) => ['game-stats', 'user', userId] as const,
  gameResults: ['game-results'] as const,
  gameResultsUser: (userId: string, filters?: GameStatsQuery) => 
    ['game-results', 'user', userId, filters] as const,
};

/**
 * Custom hook for managing game statistics
 * Demonstrates proper server state management with React Query
 */
export function useGameStats(filters?: GameStatsQuery) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Validate filters using Zod schema
  const validatedFilters = filters ? gameStatsFiltersSchema.parse(filters) : undefined;

  // Fetch user's game statistics
  const {
    data: gameStatsData,
    isLoading: isLoadingStats,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: user ? QUERY_KEYS.gameStatsUser(user.id) : ['game-stats-anonymous'],
    queryFn: async (): Promise<GameStatsResponse> => {
      if (!user) throw new Error('User not authenticated');
      
      const params = new URLSearchParams();
      if (validatedFilters) {
        Object.entries(validatedFilters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }
      
      return apiRequest(`/api/game-stats?${params}`);
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch recent game results
  const {
    data: recentResults,
    isLoading: isLoadingResults,
    error: resultsError,
  } = useQuery({
    queryKey: user && validatedFilters ? 
      QUERY_KEYS.gameResultsUser(user.id, validatedFilters) : 
      ['game-results-anonymous'],
    queryFn: async (): Promise<GameResult[]> => {
      if (!user) throw new Error('User not authenticated');
      
      const params = new URLSearchParams();
      if (validatedFilters) {
        Object.entries(validatedFilters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }
      
      return apiRequest(`/api/game-results?${params}`);
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Mutation for creating new game results
  const createGameResultMutation = useMutation({
    mutationFn: async (data: CreateGameResultData): Promise<GameResult> => {
      if (!user) throw new Error('User not authenticated');
      
      // Validate data using Zod schema
      const validatedData = gameResultSchema.parse(data);
      
      return apiRequest('/api/game-results', {
        method: 'POST',
        body: JSON.stringify(validatedData),
      });
    },
    onSuccess: (newResult) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.gameStats });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.gameResults });
      
      // Show success toast
      toast({
        title: 'Game Result Recorded',
        description: `Your ${newResult.result} has been added to your stats.`,
        variant: 'default',
      });
    },
    onError: (error) => {
      console.error('Failed to create game result:', error);
      toast({
        title: 'Error',
        description: 'Failed to record game result. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Mutation for updating game statistics preferences
  const updateGameStatsMutation = useMutation({
    mutationFn: async (data: { gameType: string; favoriteFormat?: string }): Promise<GameStats> => {
      if (!user) throw new Error('User not authenticated');
      
      return apiRequest('/api/game-stats', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      // Invalidate and refetch game stats
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.gameStats });
      
      toast({
        title: 'Stats Updated',
        description: 'Your game statistics preferences have been updated.',
        variant: 'default',
      });
    },
    onError: (error) => {
      console.error('Failed to update game stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to update statistics. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Helper functions
  const createGameResult = (data: CreateGameResultData) => {
    return createGameResultMutation.mutateAsync(data);
  };

  const updateGameStats = (data: { gameType: string; favoriteFormat?: string }) => {
    return updateGameStatsMutation.mutateAsync(data);
  };

  return {
    // Data
    gameStats: gameStatsData?.stats || [],
    recentResults: recentResults || [],
    totalRecords: gameStatsData?.totalRecords || 0,
    
    // Loading states
    isLoading: isLoadingStats || isLoadingResults,
    isLoadingStats,
    isLoadingResults,
    isCreating: createGameResultMutation.isPending,
    isUpdating: updateGameStatsMutation.isPending,
    
    // Error states
    error: statsError || resultsError,
    createError: createGameResultMutation.error,
    updateError: updateGameStatsMutation.error,
    
    // Actions
    createGameResult,
    updateGameStats,
    refetchStats,
    
    // Utilities
    isAuthenticated: !!user,
  };
}

/**
 * Hook for getting aggregate statistics across all game types
 */
export function useAggregateGameStats() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: user ? ['aggregate-game-stats', user.id] : ['aggregate-game-stats-anonymous'],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      return apiRequest('/api/game-stats/aggregate');
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for getting leaderboard data
 */
export function useGameStatsLeaderboard(gameType?: string) {
  return useQuery({
    queryKey: ['game-stats-leaderboard', gameType],
    queryFn: async () => {
      const params = gameType ? `?gameType=${gameType}` : '';
      return apiRequest(`/api/game-stats/leaderboard${params}`);
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}