// Auth.js v5 configuration for Express.js integration
import Google from "@auth/core/providers/google";
import Twitch from "@auth/core/providers/twitch";
import Credentials from "@auth/core/providers/credentials";
import type { AuthConfig } from "@auth/core/types";
import { comparePassword, checkAuthRateLimit, recordAuthFailure, clearAuthFailures } from "./password";
import { storage } from "../storage";

// Validate critical environment variables at startup
if (!process.env.AUTH_SECRET) {
  throw new Error('AUTH_SECRET environment variable is required');
}

// In production, require AUTH_URL or NEXTAUTH_URL
if (process.env.NODE_ENV === 'production') {
  if (!process.env.AUTH_URL && !process.env.NEXTAUTH_URL) {
    throw new Error('AUTH_URL or NEXTAUTH_URL environment variable is required in production');
  }
}

// Dynamic URL configuration for Auth.js
function getBaseUrl(): string {
  // In development, always use the actual Replit server URL, not AUTH_URL
  if (process.env.NODE_ENV === 'development') {
    const replitDomains = process.env.REPLIT_DOMAINS;
    if (replitDomains) {
      const computedUrl = `https://${replitDomains}`;
      console.log(`[AUTH] getBaseUrl() returning: ${computedUrl}`);
      return computedUrl;
    }
    console.log(`[AUTH] getBaseUrl() returning: http://localhost:5000`);
    return 'http://localhost:5000';
  }
  
  // In production, use AUTH_URL if available, otherwise construct from Replit domains
  const prodUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || `https://${process.env.REPLIT_DOMAINS}`;
  console.log(`[AUTH] getBaseUrl() production returning: ${prodUrl}`);
  return prodUrl;
}

export const authConfig: AuthConfig = {
  // Dynamic base URL for correct CSRF and callback handling  
  // basePath removed - router handles this to prevent redundancy warnings
  
  // CRITICAL: Override AUTH_URL in development to fix URL mismatch
  ...(process.env.NODE_ENV === 'development' && { 
    useSecureCookies: false,
    // Force Auth.js to use the actual server URL, not AUTH_URL
    url: getBaseUrl(),
    // Additional overrides to force correct URL usage
    secret: process.env.AUTH_SECRET,
    // Debug configuration
    debug: true
  }),
  
  // Use JWT sessions instead of database sessions to avoid ORM conflicts
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  trustHost: true, // Trust host for both development and production deployment
  
  
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
              details: { 
                email: email.toLowerCase(),
                retryAfter: rateLimitCheck.retryAfter,
                reason: 'too_many_attempts'
              }
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
              details: { 
                email: email.toLowerCase(),
                reason: 'user_not_found'
              }
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
              details: { 
                email: email.toLowerCase(),
                lockTimeRemaining,
                reason: 'account_temporarily_locked'
              }
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
              details: { 
                email: email.toLowerCase(),
                reason: 'email_verification_required'
              }
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
              details: { 
                email: email.toLowerCase(),
                reason: 'oauth_account_attempted_password_login'
              }
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
              details: { 
                email: email.toLowerCase(),
                failedAttempts: newFailedAttempts,
                accountLocked: shouldLockAccount,
                reason: 'invalid_password_provided'
              }
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
              details: { 
                email: email.toLowerCase(),
                mfaRequired: true,
                loginMethod: 'credentials',
                reason: 'password_verified_but_mfa_required'
              }
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
            details: { 
              email: email.toLowerCase(),
              mfaEnabled: user.mfaEnabled || false,
              loginMethod: 'credentials',
              reason: 'password_verified_successfully'
            }
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
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("=== AUTH.JS SIGNIN CALLBACK TRIGGERED ===");
      console.log("User:", user.email, user.name);
      console.log("Account:", account?.provider, account?.type);
      console.log("Profile:", profile ? "present" : "missing");
      
      try {
        // For OAuth providers, ensure user exists in our database
        if (account?.provider !== "credentials") {
          console.log("Processing OAuth provider:", account?.provider);
          console.log("Checking for existing user with email:", user.email);
          let existingUser = await storage.getUserByEmail(user.email!);
          console.log("Existing user found:", existingUser ? "YES" : "NO");
          
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
        console.error("Sign-in callback error:", {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          user: user.email,
          account: account?.provider,
        });
        return false;
      }
    },
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.userId) {
        session.user.id = token.userId as string;
        
        // Fetch fresh user data from storage for each session
        try {
          const user = await storage.getUser(token.userId as string);
          if (user) {
            session.user.email = user.email || '';
            session.user.name = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user.email || '');
            session.user.image = user.profileImageUrl;
          }
        } catch (error) {
          console.error("Session callback error:", error);
        }
      }
      return session;
    },
    // Add redirect callback to control where users go after authentication
    async redirect({ url, baseUrl }) {
      console.log(`Auth.js redirect: url=${url}, baseUrl=${baseUrl}`);
      
      // CRITICAL FIX: In development, ignore AUTH_URL and use actual server baseUrl
      const preferredBase = process.env.NODE_ENV === 'development' 
        ? baseUrl  // Use actual server URL in development
        : (process.env.AUTH_URL || baseUrl); // Use AUTH_URL in production
      
      console.log(`Using preferredBase: ${preferredBase} (NODE_ENV: ${process.env.NODE_ENV}, AUTH_URL: ${process.env.AUTH_URL})`);
      
      // Redirect to home page after successful sign in
      if (url.startsWith('/')) return `${preferredBase}${url}`;
      if (url.startsWith(preferredBase)) return url;
      if (url.startsWith(baseUrl)) return url.replace(baseUrl, preferredBase);
      return `${preferredBase}/home`; // Default redirect to home for authenticated users
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
  secret: process.env.AUTH_SECRET,
  // basePath auto-detected from AUTH_URL environment variable
};

export default authConfig;