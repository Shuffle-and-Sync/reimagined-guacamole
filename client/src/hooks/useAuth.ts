import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export interface AuthUser extends User {
  communities?: any[];
  authType?: 'custom' | 'replit';
}

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<AuthUser>({
    queryKey: ["/api/auth/user"],
    retry: false,
    retryOnMount: false,
  });

  // Check if the error is a 401 (not authenticated)
  const isNotAuthenticated = error && (error as any)?.message?.includes('401');

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !isNotAuthenticated,
    authType: user?.authType || 'unknown',
  };
}
