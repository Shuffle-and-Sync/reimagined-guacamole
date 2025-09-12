import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback } from "react";
import type { User } from "@shared/schema";
import { queryKeys } from "@/shared/constants/queryKeys";
import { useOptimizedQuery } from "@/shared/hooks/useOptimizedQuery";

export function useAuth() {
  const queryClient = useQueryClient();
  
  const { 
    data: user, 
    isLoading, 
    isError,
    error,
    smartInvalidate,
    backgroundSync 
  } = useOptimizedQuery<User & { communities?: any[] }>({
    queryKey: queryKeys.auth.user(),
    retry: false,
    backgroundRefetch: true,
    warmCache: true,
    errorRecovery: false, // Disable error recovery for auth - we want it to fail fast
  });

  // Debug logging - moved to avoid hooks order violations
  if (import.meta.env.DEV) {
    // Simple console log without useEffect to avoid hooks issues
    const authState = { 
      isLoading, 
      isAuthenticated: !!user, 
      hasUser: !!user,
      isError,
      errorStatus: error?.message?.includes('401') ? '401' : error?.message 
    };
    // Log only when state changes to avoid spam
    if (Math.random() < 0.1) {
      console.log('🔐 Auth State:', authState);
    }
  }

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