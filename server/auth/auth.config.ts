// Auth.js v5 configuration for Express.js integration
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "@auth/core/providers/google";
import type { AuthConfig } from "@auth/core/types";
import { prisma } from "@shared/database";

export const authConfig: AuthConfig = {
  adapter: PrismaAdapter(prisma),
  trustHost: true, // Temporarily hardcode for Replit development
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // TODO: Add Twitch provider
    // Twitch({
    //   clientId: process.env.TWITCH_CLIENT_ID!,
    //   clientSecret: process.env.TWITCH_CLIENT_SECRET!,
    // }),
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
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
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
  secret: process.env.NEXTAUTH_SECRET,
  basePath: "/api/auth",
};

export default authConfig;