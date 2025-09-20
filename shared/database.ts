// Dual database configuration for Drizzle + Prisma transition
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { pathToFileURL } from "url";
import { resolve } from "path";
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
    // Try multiple import paths for better production compatibility
    let PrismaClient;
    let lastError: Error | null = null;
    
    // Strategy 1: Use proper file URL for generated client
    try {
      const prismaPath = resolve(process.cwd(), "generated/prisma/index.js");
      const prismaFileUrl = pathToFileURL(prismaPath).href;
      const prismaModule = await import(prismaFileUrl);
      PrismaClient = prismaModule.PrismaClient;
    } catch (error) {
      lastError = error as Error;
      
      // Strategy 2: Fallback to relative path (development)
      try {
        const prismaModule = await import("../generated/prisma/index.js");
        PrismaClient = prismaModule.PrismaClient;
      } catch (relativeError) {
        lastError = relativeError as Error;
        
        // Strategy 3: Final fallback to node_modules (if available)
        try {
          const prismaModule = await import("@prisma/client");
          PrismaClient = prismaModule.PrismaClient;
        } catch (nodeModulesError) {
          lastError = nodeModulesError as Error;
        }
      }
    }
    
    if (!PrismaClient) {
      throw new Error(`Failed to import Prisma client from any path. Last error: ${lastError?.message}`);
    }
    
    _prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      datasourceUrl: process.env.DATABASE_URL,
    });
    
    if (process.env.NODE_ENV !== 'production') {
      global.__prisma = _prisma;
    }
    
    return _prisma;
  } catch (error) {
    console.error('Failed to initialize Prisma:', error);
    console.error('Make sure the Prisma client is generated and the generated/prisma directory is available');
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