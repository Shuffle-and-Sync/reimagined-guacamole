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

import { db } from "@shared/database-unified";
import { users, userRoles } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { hashPassword } from "../server/auth/password";
import { logger } from "../server/logger";
import crypto from "crypto";

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
    logger.warn('MASTER_ADMIN_EMAIL not set in environment variables');
    return null;
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    logger.error('Invalid MASTER_ADMIN_EMAIL format', { email });
    return null;
  }
  
  return {
    email,
    password: process.env.MASTER_ADMIN_PASSWORD?.trim(),
    firstName: process.env.MASTER_ADMIN_FIRST_NAME?.trim() || 'System',
    lastName: process.env.MASTER_ADMIN_LAST_NAME?.trim() || 'Administrator'
  };
}

/**
 * Check if user exists by email
 */
async function getUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  
  return user;
}

/**
 * Check if user has super_admin role
 */
async function hasSuperAdminRole(userId: string): Promise<boolean> {
  const [role] = await db
    .select()
    .from(userRoles)
    .where(
      and(
        eq(userRoles.userId, userId),
        eq(userRoles.role, 'super_admin'),
        eq(userRoles.isActive, true)
      )
    )
    .limit(1);
  
  return !!role;
}

/**
 * Create new admin user
 */
async function createAdminUser(config: AdminConfig) {
  const userId = crypto.randomUUID();
  
  // Prepare user data
  const userData: any = {
    id: userId,
    email: config.email,
    firstName: config.firstName,
    lastName: config.lastName,
    isEmailVerified: true, // Admin accounts are pre-verified
    emailVerifiedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // If password provided, hash it for credentials authentication
  if (config.password) {
    // Validate password strength
    if (config.password.length < 12) {
      throw new Error('Admin password must be at least 12 characters long');
    }
    
    userData.passwordHash = await hashPassword(config.password);
    logger.info('Admin account will use credentials authentication');
  } else {
    logger.info('Admin account will use OAuth authentication only');
  }
  
  // Create user
  const [newUser] = await db.insert(users).values(userData).returning();
  
  if (!newUser) {
    throw new Error('Failed to create admin user');
  }
  
  logger.info('Admin user created successfully', { userId, email: config.email });
  return newUser;
}

/**
 * Assign super_admin role to user
 */
async function assignSuperAdminRole(userId: string) {
  const roleId = crypto.randomUUID();
  
  const [role] = await db.insert(userRoles).values({
    id: roleId,
    userId,
    role: 'super_admin',
    permissions: ['super_admin:all'],
    assignedBy: userId, // Self-assigned for initial admin
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }).returning();
  
  if (!role) {
    throw new Error('Failed to assign super_admin role');
  }
  
  logger.info('Super admin role assigned successfully', { userId, roleId });
  return role;
}

/**
 * Initialize admin account
 */
async function initializeAdminAccount(verify = false): Promise<boolean> {
  try {
    const config = getAdminConfig();
    
    if (!config) {
      if (verify) {
        logger.warn('⚠️  No admin configuration found');
        logger.warn('   Set MASTER_ADMIN_EMAIL in your environment variables');
        return false;
      }
      logger.info('Skipping admin initialization - MASTER_ADMIN_EMAIL not configured');
      return true; // Not an error, just not configured
    }
    
    logger.info('Checking admin account configuration...', { email: config.email });
    
    // Check if user exists
    let user = await getUserByEmail(config.email);
    
    if (!user) {
      if (verify) {
        logger.error('❌ Admin account does not exist', { email: config.email });
        logger.info('   Run "npm run admin:init" to create the admin account');
        return false;
      }
      
      logger.info('Creating new admin account...', { email: config.email });
      user = await createAdminUser(config);
    } else {
      logger.info('Admin user already exists', { userId: user.id, email: user.email });
      
      // Update password if provided and different
      if (config.password && user.passwordHash) {
        logger.info('Updating admin password...');
        const newPasswordHash = await hashPassword(config.password);
        await db.update(users)
          .set({ 
            passwordHash: newPasswordHash,
            passwordChangedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(users.id, user.id));
        logger.info('✓ Admin password updated');
      }
    }
    
    // Check if user has super_admin role
    const hasRole = await hasSuperAdminRole(user.id);
    
    if (!hasRole) {
      if (verify) {
        logger.error('❌ Admin account exists but does not have super_admin role', { 
          userId: user.id, 
          email: user.email 
        });
        logger.info('   Run "npm run admin:init" to assign the super_admin role');
        return false;
      }
      
      logger.info('Assigning super_admin role...', { userId: user.id });
      await assignSuperAdminRole(user.id);
    } else {
      logger.info('User already has super_admin role', { userId: user.id });
    }
    
    if (verify) {
      logger.info('✅ Admin account verified successfully');
      logger.info('   Email: ' + config.email);
      logger.info('   User ID: ' + user.id);
      logger.info('   Role: super_admin');
      logger.info('   Auth: ' + (user.passwordHash ? 'Credentials + OAuth' : 'OAuth only'));
    } else {
      logger.info('✅ Admin account initialized successfully');
      logger.info('   Email: ' + config.email);
      logger.info('   User ID: ' + user.id);
      logger.info('   You can now sign in with admin privileges');
    }
    
    return true;
  } catch (error) {
    logger.error('Failed to initialize admin account', error);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const verifyMode = args.includes('--verify') || args.includes('-v');
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Shuffle & Sync - Admin Account Management');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  
  if (verifyMode) {
    console.log('Mode: Verification');
  } else {
    console.log('Mode: Initialize/Update');
  }
  console.log('');
  
  try {
    const success = await initializeAdminAccount(verifyMode);
    
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    
    if (success) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (error) {
    console.error('');
    console.error('ERROR:', error instanceof Error ? error.message : 'Unknown error');
    console.error('');
    console.log('═══════════════════════════════════════════════════════════');
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

// Export for use in other modules
export { initializeAdminAccount, getAdminConfig };
