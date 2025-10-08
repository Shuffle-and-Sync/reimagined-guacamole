// Auth.js v5 configuration for Express.js integration
import Google from "@auth/core/providers/google";
import Twitch from "@auth/core/providers/twitch";
import Credentials from "@auth/core/providers/credentials";
import type { AuthConfig } from "@auth/core/types";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@shared/database-unified";
import { comparePassword, checkAuthRateLimit, recordAuthFailure, clearAuthFailures } from "./password";
import { storage } from "../storage";

// Validate critical environment variables at startup
if (!process.env.AUTH_SECRET) {
  throw new Error('AUTH_SECRET environment variable is required');
}

// In production, AUTH_URL is optional when trustHost is enabled
// Auth.js will auto-detect the host from request headers
if (process.env.NODE_ENV === 'production') {
  if (!process.env.AUTH_URL && !process.env.NEXTAUTH_URL) {
    console.warn('[AUTH] No AUTH_URL set - relying on trustHost for URL detection');
  }
  
  // Warn if OAuth providers are not configured in production
  const hasGoogleOAuth = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
  const hasTwitchOAuth = process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET;
  
  if (!hasGoogleOAuth && !hasTwitchOAuth) {
    console.warn('[AUTH] WARNING: No OAuth providers configured (Google or Twitch)');
    console.warn('[AUTH] Users will only be able to sign in with credentials');
    console.warn('[AUTH] Set GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET or TWITCH_CLIENT_ID/TWITCH_CLIENT_SECRET');
  }
}

export const authConfig: AuthConfig = {
  // Secret configuration
  secret: process.env.AUTH_SECRET,
  
  // LAZY: Use a getter to delay adapter creation until first access
  // This prevents accessing db before it's initialized
  get adapter() {
    return DrizzleAdapter(db);
  },
  
  // Use database sessions with Drizzle adapter
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  // CRITICAL: Enable trustHost to allow Auth.js to detect the correct URL from request headers
  // This is essential for Cloud Run and other proxy/load balancer environments
  trustHost: true,
  
  // Use secure cookies in production
  useSecureCookies: process.env.NODE_ENV === 'production',
  
  
  // Enhanced cookie settings for production security
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    // CRITICAL FIX: Explicit CSRF token cookie configuration
    csrfToken: {
      name: process.env.NODE_ENV === 'production' ? '__Host-authjs.csrf-token' : 'authjs.csrf-token',
      options: {
        httpOnly: false, // Must be readable by JavaScript for double-submit pattern
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  
  // CRITICAL FIX: Custom error page to prevent redirect loops
  // Instead of redirecting to /api/auth/error (which can cause loops),
  // redirect to frontend error page that handles the error display
  pages: {
    error: '/auth/error', // Redirect to frontend error page instead of /api/auth/error
    signIn: '/login',      // Custom sign-in page
  },
  providers: [
    // Only include OAuth providers if properly configured
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      })
    ] : []),
    
    ...(process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET ? [
      Twitch({
        clientId: process.env.TWITCH_CLIENT_ID,
        clientSecret: process.env.TWITCH_CLIENT_SECRET,
      })
    ] : []),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        try {
          const email = credentials.email as string;
          // Extract security context (Auth.js may not always provide req)
          const ipAddress = 'unknown'; // TODO: Extract from Auth.js context when available
          const userAgent = 'unknown'; // TODO: Extract from Auth.js context when available
          
          // Apply rate limiting
          const rateLimitCheck = checkAuthRateLimit(email);
          if (!rateLimitCheck.allowed) {
            // Log rate limit hit
            await storage.createAuthAuditLog({
              userId: null,
              eventType: 'login_failure',
              ipAddress,
              userAgent,
              isSuccessful: false,
              failureReason: 'rate_limited',
              details: JSON.stringify({ 
                email: email.toLowerCase(),
                retryAfter: rateLimitCheck.retryAfter,
                reason: 'too_many_attempts'
              })
            });
            throw new Error(`Too many failed attempts. Try again in ${rateLimitCheck.retryAfter} seconds.`);
          }

          // Find user by email
          const user = await storage.getUserByEmail(email);
          if (!user) {
            recordAuthFailure(email);
            // Log failed login attempt
            await storage.createAuthAuditLog({
              userId: null,
              eventType: 'login_failure',
              ipAddress,
              userAgent,
              isSuccessful: false,
              failureReason: 'invalid_password',
              details: JSON.stringify({ 
                email: email.toLowerCase(),
                reason: 'user_not_found'
              })
            });
            throw new Error("Invalid email or password");
          }

          // Check if account is locked
          if (user.accountLockedUntil && new Date() < user.accountLockedUntil) {
            const lockTimeRemaining = Math.ceil((user.accountLockedUntil.getTime() - Date.now()) / 1000);
            await storage.createAuthAuditLog({
              userId: user.id,
              eventType: 'login_failure',
              ipAddress,
              userAgent,
              isSuccessful: false,
              failureReason: 'account_locked',
              details: JSON.stringify({ 
                email: email.toLowerCase(),
                lockTimeRemaining,
                reason: 'account_temporarily_locked'
              })
            });
            throw new Error(`Account is temporarily locked. Try again in ${Math.ceil(lockTimeRemaining / 60)} minutes.`);
          }

          // Check if email is verified
          if (!user.isEmailVerified) {
            await storage.createAuthAuditLog({
              userId: user.id,
              eventType: 'login_failure',
              ipAddress,
              userAgent,
              isSuccessful: false,
              failureReason: 'email_not_verified',
              details: JSON.stringify({ 
                email: email.toLowerCase(),
                reason: 'email_verification_required'
              })
            });
            throw new Error("Please verify your email address before signing in. Check your inbox for the verification link.");
          }

          // Check if user has a password (OAuth users might not)
          if (!user.passwordHash) {
            recordAuthFailure(email);
            await storage.createAuthAuditLog({
              userId: user.id,
              eventType: 'login_failure',
              ipAddress,
              userAgent,
              isSuccessful: false,
              failureReason: 'invalid_password',
              details: JSON.stringify({ 
                email: email.toLowerCase(),
                reason: 'oauth_account_attempted_password_login'
              })
            });
            throw new Error("This account uses OAuth authentication. Please sign in with Google or Twitch.");
          }

          // Verify password
          const isPasswordValid = await comparePassword(
            credentials.password as string,
            user.passwordHash
          );

          if (!isPasswordValid) {
            recordAuthFailure(email);
            
            // Increment failed login attempts
            const newFailedAttempts = (user.failedLoginAttempts || 0) + 1;
            const shouldLockAccount = newFailedAttempts >= 5; // Lock after 5 failed attempts
            const lockUntil = shouldLockAccount ? new Date(Date.now() + 30 * 60 * 1000) : null; // 30 minute lockout
            
            // Update user with failed attempt info
            await storage.updateUser(user.id, {
              failedLoginAttempts: newFailedAttempts,
              lastFailedLogin: new Date(),
              ...(shouldLockAccount && { accountLockedUntil: lockUntil })
            });
            
            await storage.createAuthAuditLog({
              userId: user.id,
              eventType: 'login_failure',
              ipAddress,
              userAgent,
              isSuccessful: false,
              failureReason: 'invalid_password',
              details: JSON.stringify({ 
                email: email.toLowerCase(),
                failedAttempts: newFailedAttempts,
                accountLocked: shouldLockAccount,
                reason: 'invalid_password_provided'
              })
            });
            
            if (shouldLockAccount) {
              throw new Error(`Account locked due to too many failed attempts. Try again in 30 minutes.`);
            }
            
            throw new Error("Invalid email or password");
          }

          // CRITICAL SECURITY: Check if MFA is enabled and BLOCK login until verified
          if (user.mfaEnabled) {
            // For MFA users, we MUST NOT allow login without MFA verification
            // Clear failed attempts since password was correct
            await storage.updateUser(user.id, {
              failedLoginAttempts: 0,
              lastFailedLogin: null,
              accountLockedUntil: null
            });
            
            // Log MFA requirement - this is NOT a successful login yet
            await storage.createAuthAuditLog({
              userId: user.id,
              eventType: 'login_failure',
              ipAddress,
              userAgent,
              isSuccessful: false,
              failureReason: 'mfa_required',
              details: JSON.stringify({ 
                email: email.toLowerCase(),
                mfaRequired: true,
                loginMethod: 'credentials',
                reason: 'password_verified_but_mfa_required'
              })
            });
            
            // SECURITY: Do NOT return user object - this prevents session creation
            // Frontend must handle MFA verification through dedicated endpoint
            throw new Error("MFA_REQUIRED: Please complete multi-factor authentication. Check your authenticator app for the verification code.");
          }

          // Clear failures on successful login
          clearAuthFailures(email);
          
          // Clear database lockout fields
          await storage.updateUser(user.id, {
            failedLoginAttempts: 0,
            lastFailedLogin: null,
            accountLockedUntil: null
          });

          // Log successful login
          await storage.createAuthAuditLog({
            userId: user.id,
            eventType: 'login_success',
            ipAddress,
            userAgent,
            isSuccessful: true,
            details: JSON.stringify({ 
              email: email.toLowerCase(),
              mfaEnabled: user.mfaEnabled || false,
              loginMethod: 'credentials',
              reason: 'password_verified_successfully'
            })
          });

          // Return user object for session
          return {
            id: user.id,
            email: user.email,
            name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email,
            image: user.profileImageUrl,
          };
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      }
    })
  ],
  
  // CONSOLIDATED: All callbacks in one section to fix duplicate property errors
  callbacks: {
    // JWT callback - persist user ID into token for session access
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    // Session callback - add user ID to session object
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = String(token.id);
        session.user.email = String(token.email || ''); // Fix type error
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      try {
        // For OAuth providers, ensure user exists in our database
        if (account?.provider !== "credentials") {
          let existingUser = await storage.getUserByEmail(user.email!);
          
          if (!existingUser) {
            // Create new user from OAuth profile  
            existingUser = await storage.upsertUser({
              id: crypto.randomUUID(),
              email: user.email!,
              firstName: user.name?.split(' ')[0] || '',
              lastName: user.name?.split(' ').slice(1).join(' ') || '',
              profileImageUrl: user.image || null,
              username: null,
              bio: null,
              location: null,
              website: null,
              primaryCommunity: null,
              status: "offline",
              statusMessage: null,
              timezone: null,
              dateOfBirth: null,
              isPrivate: false,
              showOnlineStatus: "everyone",
              allowDirectMessages: "everyone",
              passwordHash: null, // OAuth users don't have passwords
            });
          }
          
          // Update user ID in the user object for JWT
          if (existingUser) {
            user.id = existingUser.id;
          }
        }
        
        return true;
      } catch (error) {
        console.error("Sign-in callback error:", error);
        return false;
      }
    },
    // Add redirect callback to control where users go after authentication
    async redirect({ url, baseUrl }) {
      // CRITICAL FIX: Always use baseUrl from Auth.js - it's already resolved from request headers
      // This prevents redirect loops when AUTH_URL doesn't match the actual Cloud Run URL
      // trustHost: true ensures baseUrl is correctly detected from X-Forwarded-Host header
      
      // Log for debugging (helps diagnose redirect issues)
      if (process.env.NODE_ENV === 'development') {
        console.log('[AUTH] Redirect callback:', { url, baseUrl });
      }
      
      // Handle error redirects - prevent loops by going to frontend error page
      if (url.includes('/api/auth/error') || url.includes('error=')) {
        // Extract error parameter if present
        const urlObj = new URL(url, baseUrl);
        const error = urlObj.searchParams.get('error');
        
        if (error === 'Configuration') {
          console.error('[AUTH] Configuration error detected - check OAuth credentials');
          console.error('[AUTH] Ensure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set');
          console.error('[AUTH] Also verify redirect URI in Google Console matches backend URL');
        }
        
        // Redirect to frontend error page with error details
        return `${baseUrl}/auth/error?error=${error || 'unknown'}`;
      }
      
      // Redirect to home page after successful sign in
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (url.startsWith(baseUrl)) return url;
      
      // For absolute URLs, validate they're for the same domain
      try {
        const urlObj = new URL(url);
        const baseUrlObj = new URL(baseUrl);
        if (urlObj.hostname === baseUrlObj.hostname) {
          return url;
        }
      } catch (e) {
        // Invalid URL, fall through to default
      }
      
      return `${baseUrl}/home`; // Default redirect to home for authenticated users
    },
  },
  
  events: {
    signIn({ user, account, isNewUser }) {
      console.log(`User ${user.email} signed in via ${account?.provider}`);
    },
    signOut() {
      console.log(`User signed out`);
    },
  },
  
  debug: process.env.NODE_ENV === "development",
};