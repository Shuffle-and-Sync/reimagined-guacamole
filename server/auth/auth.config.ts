// Auth.js v5 configuration for Express.js integration
import Google from "@auth/core/providers/google";
import Twitch from "@auth/core/providers/twitch";
import Credentials from "@auth/core/providers/credentials";
import type { AuthConfig } from "@auth/core/types";
import { comparePassword } from "./password";
import { storage } from "../storage";

export const authConfig: AuthConfig = {
  // Use JWT sessions instead of database sessions to avoid ORM conflicts
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  trustHost: process.env.NODE_ENV === "development", // Only trust host in development
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
          // Find user by email
          const user = await storage.getUserByEmail(credentials.email as string);
          if (!user) {
            throw new Error("No user found with this email");
          }

          // Check if user has a password (OAuth users might not)
          if (!user.passwordHash) {
            throw new Error("This account uses OAuth authentication. Please sign in with Google or Twitch.");
          }

          // Verify password
          const isPasswordValid = await comparePassword(
            credentials.password as string,
            user.passwordHash
          );

          if (!isPasswordValid) {
            throw new Error("Invalid password");
          }

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
            existingUser = await storage.createUser({
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
          user.id = existingUser.id;
        }
        
        return true;
      } catch (error) {
        console.error("Sign-in callback error:", error);
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
            session.user.email = user.email;
            session.user.name = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email;
            session.user.image = user.profileImageUrl;
          }
        } catch (error) {
          console.error("Session callback error:", error);
        }
      }
      return session;
    },
  },
  // Temporarily disable custom pages to test baseline functionality
  // pages: {
  //   signIn: "/auth/signin", 
  //   error: "/auth/error",
  // },
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
  basePath: "/api/auth",
};

export default authConfig;