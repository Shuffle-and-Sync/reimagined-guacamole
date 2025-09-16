// Dual database configuration for Drizzle + Prisma transition
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { PrismaClient } from "../generated/prisma";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Drizzle configuration (existing system)
const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });

// Prisma configuration (new system for advanced features)
declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma = global.__prisma || new PrismaClient({
  log: ['error'],
  datasourceUrl: process.env.DATABASE_URL,
});

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

// Database health check utility
export async function checkDatabaseHealth() {
  try {
    // Test Drizzle connection
    await sql`SELECT 1`;
    
    // Test Prisma connection
    await prisma.$queryRaw`SELECT 1`;
    
    return { status: 'healthy', drizzle: true, prisma: true };
  } catch (error) {
    console.error('Database health check failed:', error);
    return { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Graceful shutdown
export async function closeDatabaseConnections() {
  try {
    await prisma.$disconnect();
    console.log('Database connections closed gracefully');
  } catch (error) {
    console.error('Error closing database connections:', error);
  }
}

// Export types for TypeScript
export type { PrismaClient } from "../generated/prisma";
export * from "../generated/prisma";