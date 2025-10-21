// Auth.js v5 types
export interface AuthUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  // Additional fields for compatibility with existing components
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  profileImageUrl?: string | null;
  primaryCommunity?: string | null;
  communities?: unknown[] | null;
}

export interface AuthSession {
  user?: AuthUser;
  expires: string;
}

export interface AuthState {
  session: AuthSession | null;
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// OAuth provider types
export type OAuthProvider = "google" | "github" | "discord";

export interface AuthProviderConfig {
  id: string;
  name: string;
  type: string;
  signinUrl: string;
  callbackUrl: string;
}

// Form types for authentication
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
  firstName?: string;
  lastName?: string;
}
