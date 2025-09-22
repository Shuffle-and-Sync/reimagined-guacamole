// Auth.js v5 configuration for Express.js integration
import Google from "@auth/core/providers/google";
import Twitch from "@auth/core/providers/twitch";
import Credentials from "@auth/core/providers/credentials";
import type { AuthConfig } from "@auth/core/types";
import { comparePassword, checkAuthRateLimit, recordAuthFailure, clearAuthFailures } from "./password";
import { storage } from "../storage";

// Validate critical environment variables at startup
if (process.env.NODE_ENV === 'production') {
  if (!process.env.AUTH_SECRET) {
    throw new Error('AUTH_SECRET environment variable is required in production');
  }
  if (!process.env.AUTH_URL && !process.env.NEXTAUTH_URL) {
    throw new Error('AUTH_URL or NEXTAUTH_URL environment variable is required in production');
  }
}

export const authConfig: AuthConfig = {
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
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Twitch({
      clientId: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        try {
          const email = credentials.email as string;
          
          // Apply rate limiting
          const rateLimitCheck = checkAuthRateLimit(email);
          if (!rateLimitCheck.allowed) {
            throw new Error(`Too many failed attempts. Try again in ${rateLimitCheck.retryAfter} seconds.`);
          }

          // Find user by email
          const user = await storage.getUserByEmail(email);
          if (!user) {
            recordAuthFailure(email);
            throw new Error("Invalid email or password");
          }

          // Check if user has a password (OAuth users might not)
          if (!user.passwordHash) {
            recordAuthFailure(email);
            throw new Error("This account uses OAuth authentication. Please sign in with Google or Twitch.");
          }

          // Verify password
          const isPasswordValid = await comparePassword(
            credentials.password as string,
            user.passwordHash
          );

          if (!isPasswordValid) {
            recordAuthFailure(email);
            throw new Error("Invalid email or password");
          }

          // Clear failures on successful login
          clearAuthFailures(email);

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
      // Prefer AUTH_URL over dynamic baseUrl to ensure consistent redirects to custom domain
      const preferredBase = process.env.AUTH_URL || baseUrl;
      console.log(`Using preferredBase: ${preferredBase} (AUTH_URL: ${process.env.AUTH_URL})`);
      
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