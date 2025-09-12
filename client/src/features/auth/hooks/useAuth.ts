import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback } from "react";
import type { User } from "@shared/schema";
import { queryKeys } from "@/shared/constants/queryKeys";
import { useOptimizedQuery } from "@/shared/hooks/useOptimizedQuery";

export function useAuth() {
  const queryClient = useQueryClient();
  
  // Use standard useQuery for auth with explicit queryFn
  const { 
    data: user, 
    isLoading, 
    isError,
    error,
  } = useQuery<User & { communities?: any[] }>({
    queryKey: queryKeys.auth.user(),
    queryFn: async () => {
      const response = await fetch('/api/auth/user', {
        credentials: 'include',
      });
      
      // Treat 401 as "not authenticated" rather than an error
      if (response.status === 401) {
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status}`);
      }
      
      return response.json();
    },
    retry: false, // No retries for auth
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false, // Don't refetch on focus for auth
    refetchOnReconnect: false, // Don't auto-refetch on reconnect
  });

  // Simple smart invalidation function
  const smartInvalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.auth.user() });
  }, [queryClient]);

  const backgroundSync = useCallback(() => {
    queryClient.prefetchQuery({ queryKey: queryKeys.auth.user() });
  }, [queryClient]);


  // Prefetch user-related data when user is loaded
  const prefetchUserData = useCallback(async () => {
    if (user?.id) {
      await Promise.all([
        queryClient.prefetchQuery({ 
          queryKey: queryKeys.users.profile(user.id),
          staleTime: 1000 * 60 * 10 // 10 minutes
        }),
        queryClient.prefetchQuery({ 
          queryKey: queryKeys.messaging.notifications(user.id),
          staleTime: 1000 * 60 * 2 // 2 minutes
        }),
      ]);
    }
  }, [user?.id, queryClient]);

  // Auto-prefetch related data when user changes
  useEffect(() => {
    if (user?.id && !isLoading) {
      prefetchUserData();
    }
  }, [user?.id, isLoading, prefetchUserData]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    smartInvalidate,
    backgroundSync,
    prefetchUserData,
  };
}