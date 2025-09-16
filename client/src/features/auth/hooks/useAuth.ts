import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback } from "react";
import { queryKeys } from "@/shared/constants/queryKeys";

// Auth.js v5 session type
export interface AuthSession {
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  expires: string;
}

export function useAuth() {
  const queryClient = useQueryClient();
  
  // Use Auth.js v5 session endpoint
  const { 
    data: session, 
    isLoading, 
    isError,
    error,
  } = useQuery<AuthSession | null>({
    queryKey: queryKeys.auth.user(),
    queryFn: async () => {
      const response = await fetch('/api/auth/session', {
        credentials: 'include',
      });
      
      // Auth.js returns 200 with null for unauthenticated users
      if (!response.ok) {
        if (response.status === 401) {
          return null;
        }
        throw new Error(`Authentication failed: ${response.status}`);
      }
      
      const sessionData = await response.json();
      return sessionData;
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
    if (session?.user?.id) {
      await Promise.all([
        queryClient.prefetchQuery({ 
          queryKey: queryKeys.users.profile(session.user.id),
          staleTime: 1000 * 60 * 10 // 10 minutes
        }),
        queryClient.prefetchQuery({ 
          queryKey: queryKeys.messaging.notifications(session.user.id),
          staleTime: 1000 * 60 * 2 // 2 minutes
        }),
      ]);
    }
  }, [session?.user?.id, queryClient]);

  // Auto-prefetch related data when user changes
  useEffect(() => {
    if (session?.user?.id && !isLoading) {
      prefetchUserData();
    }
  }, [session?.user?.id, isLoading, prefetchUserData]);

  // Auth.js v5 login/logout functions
  const signIn = useCallback((provider = 'google') => {
    window.location.href = `/api/auth/signin/${provider}`;
  }, []);

  const signOut = useCallback(() => {
    window.location.href = '/api/auth/signout';
  }, []);

  return {
    session,
    user: session?.user || null,
    isLoading,
    isAuthenticated: !!session?.user,
    smartInvalidate,
    backgroundSync,
    prefetchUserData,
    signIn,
    signOut,
  };
}