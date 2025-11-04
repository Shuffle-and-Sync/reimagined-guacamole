#!/usr/bin/env tsx
/**
 * Admin Account Initialization Script
 *
 * This script ensures the master administrator account is properly configured.
 * It can be run manually or automatically on startup to ensure admin access is available.
 *
 * Usage:
 *   npm run admin:init              - Initialize admin account
 *   npm run admin:verify            - Verify admin account exists
 *   tsx scripts/init-admin.ts       - Direct execution
 */

import { storage } from "../server/storage";
import { db } from "@shared/database-unified";
import { hashPassword } from "../server/auth/password";
import { logger } from "../server/logger";
import crypto from "crypto";
import { sql } from "drizzle-orm";
import { toLoggableError } from "@shared/utils/type-guards";

/**
 * Wait for database connection to be ready
 */
async function waitForDatabase(
  maxAttempts = 10,
  delayMs = 1000,
): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      // Try a simple database query to check connection
      await db.execute(sql`SELECT 1 as test`);
      logger.info("✓ Database connection established");
      return; // Connection is ready
    } catch (error) {
      if (i < maxAttempts - 1) {
        logger.info(
          `Waiting for database connection... (attempt ${i + 1}/${maxAttempts})`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        throw new Error(
          `Database connection timeout: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }
  }
}

interface AdminConfig {
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Get admin configuration from environment variables
 */
function getAdminConfig(): AdminConfig | null {
  const email = process.env.MASTER_ADMIN_EMAIL?.trim();

  if (!email) {
    logger.warn("MASTER_ADMIN_EMAIL not set in environment variables");
    return null;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    logger.error("Invalid MASTER_ADMIN_EMAIL format", { email });
    return null;
  }

  return {
    email,
    password: process.env.MASTER_ADMIN_PASSWORD?.trim(),
    firstName: process.env.MASTER_ADMIN_FIRST_NAME?.trim() || "System",
    lastName: process.env.MASTER_ADMIN_LAST_NAME?.trim() || "Administrator",
  };
}

/**
 * Check if user exists by email
 */
async function getUserByEmail(email: string) {
  try {
    const user = await storage.getUserByEmail(email);
    return user;
  } catch (_error) {
    // User not found
    return undefined;
  }
}

/**
 * Check if user has super_admin role
 */
async function hasSuperAdminRole(userId: string): Promise<boolean> {
  try {
    const userRoles = await storage.getUserRoles(userId);
    return userRoles.some(
      (role) => role.role === "super_admin" && role.isActive,
    );
  } catch (_error) {
    return false;
  }
}

/**
 * Create new admin user
 */
async function createAdminUser(config: AdminConfig) {
  const userId = crypto.randomUUID();

  // Prepare user data
  const userData: unknown = {
    id: userId,
    email: config.email,
    firstName: config.firstName,
    lastName: config.lastName,
    isEmailVerified: true, // Admin accounts are pre-verified
    emailVerifiedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // If password provided, hash it for credentials authentication
  if (config.password) {
    // Validate password strength
    if (config.password.length < 12) {
      throw new Error("Admin password must be at least 12 characters long");
    }

    userData.passwordHash = await hashPassword(config.password);
    logger.info("Admin account will use credentials authentication");
  } else {
    logger.info("Admin account will use OAuth authentication only");
  }

  // Create user using storage
  const newUser = await storage.createUser(userData);

  if (!newUser) {
    throw new Error("Failed to create admin user");
  }

  logger.info("Admin user created successfully", {
    userId,
    email: config.email,
  });
  return newUser;
}

/**
 * Assign super_admin role to user
 */
async function assignSuperAdminRole(userId: string) {
  const roleId = crypto.randomUUID();

  const role = await storage.createUserRole({
    id: roleId,
    userId,
    role: "super_admin",
    permissions: ["super_admin:all"],
    assignedBy: userId, // Self-assigned for initial admin
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  if (!role) {
    throw new Error("Failed to assign super_admin role");
  }

  logger.info("Super admin role assigned successfully", { userId, roleId });
  return role;
}

/**
 * Initialize admin account
 */
async function initializeAdminAccount(verify = false): Promise<boolean> {
  try {
    // Wait for database connection to be ready
    console.log("Waiting for database connection...");
    await waitForDatabase();
    console.log("Database connection ready");

    const config = getAdminConfig();

    if (!config) {
      if (verify) {
        console.warn("⚠️  No admin configuration found");
        console.warn("   Set MASTER_ADMIN_EMAIL in your environment variables");
        return false;
      }
      console.log(
        "Skipping admin initialization - MASTER_ADMIN_EMAIL not configured",
      );
      return true; // Not an error, just not configured
    }

    console.log("Checking admin account configuration for:", config.email);

    // Check if user exists
    console.log("Checking if admin user exists...");
    let user = await getUserByEmail(config.email);
    console.log("User exists:", !!user);

    if (!user) {
      if (verify) {
        console.error("❌ Admin account does not exist");
        console.error("   Email:", config.email);
        console.error(
          '   Run "npm run admin:init" to create the admin account',
        );
        return false;
      }

      console.log("Creating new admin account...");
      user = await createAdminUser(config);
      console.log("✓ Admin user created");
    } else {
      console.log("Admin user already exists, checking role...");
      logger.info("Admin user already exists", {
        userId: user.id,
        email: user.email,
      });

      // Update password if provided and different
      if (config.password && user.passwordHash) {
        logger.info("Updating admin password...");
        const newPasswordHash = await hashPassword(config.password);
        await storage.updateUser(user.id, {
          passwordHash: newPasswordHash,
          passwordChangedAt: new Date(),
          updatedAt: new Date(),
        });
        logger.info("✓ Admin password updated");
      }
    }

    // Check if user has super_admin role
    console.log("Checking if user has super_admin role...");
    const hasRole = await hasSuperAdminRole(user.id);
    console.log("Has super_admin role:", hasRole);

    if (!hasRole) {
      if (verify) {
        console.error(
          "❌ Admin account exists but does not have super_admin role",
        );
        console.error("   User ID:", user.id);
        console.error("   Email:", user.email);
        console.error(
          '   Run "npm run admin:init" to assign the super_admin role',
        );
        return false;
      }

      console.log("Assigning super_admin role...");
      await assignSuperAdminRole(user.id);
      console.log("✓ Super admin role assigned");
    } else {
      console.log("✓ User already has super_admin role");
    }

    if (verify) {
      console.log("");
      console.log("✅ Admin account verified successfully");
      console.log("   Email:", config.email);
      console.log("   User ID:", user.id);
      console.log("   Role: super_admin");
      console.log(
        "   Auth:",
        user.passwordHash ? "Credentials + OAuth" : "OAuth only",
      );
    } else {
      console.log("");
      console.log("✅ Admin account initialized successfully");
      console.log("   Email:", config.email);
      console.log("   User ID:", user.id);
      console.log("   You can now sign in with admin privileges");
    }

    return true;
  } catch (error) {
    logger.error("Failed to initialize admin account", toLoggableError(error));
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const verifyMode = args.includes("--verify") || args.includes("-v");

  console.log("");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Shuffle & Sync - Admin Account Management");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("");

  if (verifyMode) {
    console.log("Mode: Verification");
  } else {
    console.log("Mode: Initialize/Update");
  }
  console.log("");

  try {
    const success = await initializeAdminAccount(verifyMode);

    console.log("");
    console.log("═══════════════════════════════════════════════════════════");

    if (success) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (error) {
    console.error("");
    console.error(
      "ERROR:",
      error instanceof Error ? error.message : "Unknown error",
    );
    console.error("");
    console.log("═══════════════════════════════════════════════════════════");
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

// Export for use in other modules
export { initializeAdminAccount, getAdminConfig };
