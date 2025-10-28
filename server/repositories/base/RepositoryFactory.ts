/**
 * Repository Factory Pattern Implementation
 *
 * This module provides a dependency injection container for repositories,
 * following the singleton pattern for efficient resource management.
 *
 * Features:
 * - Singleton pattern for repository instances
 * - Dependency injection support
 * - Easy testing with mock repositories
 * - Centralized repository management
 *
 * @example
 * ```typescript
 * import { RepositoryFactory } from './repositories/base/RepositoryFactory';
 * import { UserRepository } from './repositories/UserRepository';
 *
 * const userRepo = RepositoryFactory.getRepository(UserRepository);
 * const user = await userRepo.findById('user-123');
 * ```
 */

import type { Database } from "@shared/database-unified";
import { db } from "@shared/database-unified";
import { logger } from "../../logger";

/**
 * Repository constructor interface
 */
export interface RepositoryConstructor<T> {
  new (db?: Database): T;
}

/**
 * Repository Factory
 *
 * Manages repository instances using the singleton pattern to ensure
 * efficient resource usage and consistent database connections.
 */
export class RepositoryFactory {
  /**
   * Map of repository instances (singleton storage)
   */
  private static instances = new Map<string, unknown>();

  /**
   * Database instance used by repositories
   * Can be overridden for testing purposes
   */
  private static database: Database = db;

  /**
   * Get or create a repository instance
   *
   * @param repositoryClass - The repository class to instantiate
   * @param customDb - Optional custom database instance (for testing)
   * @returns The repository instance
   *
   * @example
   * ```typescript
   * const userRepo = RepositoryFactory.getRepository(UserRepository);
   * const events = await userRepo.findAll();
   * ```
   */
  static getRepository<T>(
    repositoryClass: RepositoryConstructor<T>,
    customDb?: Database,
  ): T {
    const className = repositoryClass.name;

    // Use custom db if provided (useful for testing)
    const dbToUse = customDb || this.database;

    // If using custom db, create a new instance (don't cache)
    if (customDb) {
      logger.debug(`Creating new ${className} instance with custom database`);
      return new repositoryClass(customDb);
    }

    // Check if we already have a cached instance
    if (this.instances.has(className)) {
      logger.debug(`Retrieving cached ${className} instance`);
      return this.instances.get(className) as T;
    }

    // Create new instance and cache it
    logger.debug(`Creating new ${className} instance`);
    const instance = new repositoryClass(dbToUse);
    this.instances.set(className, instance);

    return instance;
  }

  /**
   * Clear all cached repository instances
   * Useful for testing or when database connection changes
   *
   * @example
   * ```typescript
   * // In test teardown
   * RepositoryFactory.clearAll();
   * ```
   */
  static clearAll(): void {
    logger.debug("Clearing all repository instances");
    this.instances.clear();
  }

  /**
   * Clear a specific repository instance from cache
   *
   * @param repositoryClass - The repository class to clear
   *
   * @example
   * ```typescript
   * RepositoryFactory.clear(UserRepository);
   * ```
   */
  static clear<T>(repositoryClass: RepositoryConstructor<T>): void {
    const className = repositoryClass.name;
    logger.debug(`Clearing ${className} instance`);
    this.instances.delete(className);
  }

  /**
   * Set the database instance for all repositories
   * Use with caution - primarily for testing
   *
   * @param database - The database instance to use
   *
   * @example
   * ```typescript
   * // In test setup
   * RepositoryFactory.setDatabase(mockDb);
   * ```
   */
  static setDatabase(database: Database): void {
    logger.debug("Setting new database instance for RepositoryFactory");
    this.database = database;
    // Clear all cached instances since they use the old database
    this.clearAll();
  }

  /**
   * Get the current database instance
   * Useful for testing or debugging
   *
   * @returns The current database instance
   */
  static getDatabase(): Database {
    return this.database;
  }

  /**
   * Get all cached repository instances
   * Useful for debugging or monitoring
   *
   * @returns Map of repository class names to instances
   */
  static getAllInstances(): Map<string, unknown> {
    return new Map(this.instances);
  }

  /**
   * Check if a repository instance exists in cache
   *
   * @param repositoryClass - The repository class to check
   * @returns True if instance exists in cache
   */
  static hasInstance<T>(repositoryClass: RepositoryConstructor<T>): boolean {
    return this.instances.has(repositoryClass.name);
  }
}

/**
 * Convenience function to get a repository instance
 * Alias for RepositoryFactory.getRepository
 *
 * @example
 * ```typescript
 * import { getRepository } from './repositories/base/RepositoryFactory';
 * import { UserRepository } from './repositories/UserRepository';
 *
 * const userRepo = getRepository(UserRepository);
 * ```
 */
export function getRepository<T>(
  repositoryClass: RepositoryConstructor<T>,
  customDb?: Database,
): T {
  return RepositoryFactory.getRepository(repositoryClass, customDb);
}
