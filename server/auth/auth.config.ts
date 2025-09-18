// Auth.js v5 configuration for Express.js integration
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "@auth/core/providers/google";
import Twitch from "@auth/core/providers/twitch";
import Credentials from "@auth/core/providers/credentials";
import type { AuthConfig } from "@auth/core/types";
import { prisma } from "@shared/database";
import { comparePassword } from "./password";
import { storage } from "../storage";

export const authConfig: AuthConfig = {
  adapter: PrismaAdapter(prisma),
  trustHost: true, // Temporarily hardcode for Replit development
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
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Allow all sign-ins for now
      return true;
    },
    async session({ session, user }) {
      // Add user ID to session
      if (session.user && user) {
        (session.user as any).id = user.id;
      }
      return session;
    },
    async jwt({ token, user }) {
      // Add user ID to JWT token
      if (user) {
        token.sub = user.id;
      }
      return token;
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
  secret: process.env.NEXTAUTH_SECRET,
  basePath: "/api/auth",
};

export default authConfig;