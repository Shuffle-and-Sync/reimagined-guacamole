// Dual database configuration for Drizzle + Prisma transition
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Drizzle configuration (existing system)
const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });

// Prisma configuration (new system for advanced features) - using dynamic import
declare global {
  var __prisma: any | undefined;
}

let _prisma: any = null;

export const prisma = new Proxy({}, {
  get: function(target, prop) {
    if (_prisma === null) {
      throw new Error('Prisma not initialized. Call initializePrisma() first.');
    }
    return _prisma[prop];
  }
});

// Initialize Prisma with dynamic import
export async function initializePrisma() {
  if (global.__prisma) {
    _prisma = global.__prisma;
    return _prisma;
  }

  try {
    const { PrismaClient } = await import("../generated/prisma/index.js");
    _prisma = new PrismaClient({
      log: ['error'],
      datasourceUrl: process.env.DATABASE_URL,
    });
    
    if (process.env.NODE_ENV !== 'production') {
      global.__prisma = _prisma;
    }
    
    return _prisma;
  } catch (error) {
    console.error('Failed to initialize Prisma:', error);
    throw error;
  }
}

// Database health check utility
export async function checkDatabaseHealth() {
  try {
    // Test Drizzle connection
    await sql`SELECT 1`;
    
    // Test Prisma connection
    if (_prisma === null) {
      await initializePrisma();
    }
    await _prisma.$queryRaw`SELECT 1`;
    
    return { status: 'healthy', drizzle: true, prisma: true };
  } catch (error) {
    console.error('Database health check failed:', error);
    return { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Graceful shutdown
export async function closeDatabaseConnections() {
  try {
    if (_prisma) {
      await _prisma.$disconnect();
    }
    console.log('Database connections closed gracefully');
  } catch (error) {
    console.error('Error closing database connections:', error);
  }
}