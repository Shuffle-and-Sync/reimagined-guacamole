// Auth.js v5 types
export interface AuthUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
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
export type OAuthProvider = 'google' | 'github' | 'discord';

export interface AuthProviderConfig {
  id: string;
  name: string;
  type: string;
  signinUrl: string;
  callbackUrl: string;
}