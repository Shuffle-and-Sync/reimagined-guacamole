/**
 * Repository Factory Tests
 *
 * Unit tests for the RepositoryFactory dependency injection container.
 *
 * Tests cover:
 * - Repository instance creation and caching
 * - Singleton pattern behavior
 * - Custom database injection
 * - Instance management (clear, clearAll)
 * - Database instance management
 */

import {
  describe,
  test,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import type { Database } from "@shared/database-unified";
import { users } from "@shared/schema";
import { BaseRepository } from "../../../repositories/base/BaseRepository";
import { RepositoryFactory } from "../../../repositories/base/RepositoryFactory";

// Test repository implementation
class TestRepository extends BaseRepository<typeof users> {
  constructor(db: Database) {
    super(db, users, "users");
  }
}

// Another test repository
class AnotherRepository extends BaseRepository<typeof users> {
  constructor(db: Database) {
    super(db, users, "another");
  }
}

// Mock database
const createMockDb = () => {
  return {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    transaction: jest.fn(),
    execute: jest.fn(),
  } as unknown as Database;
};

describe("RepositoryFactory", () => {
  beforeEach(() => {
    // Clear all instances before each test
    RepositoryFactory.clearAll();
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    RepositoryFactory.clearAll();
  });

  describe("Singleton Pattern", () => {
    test("should return the same instance for the same repository class", () => {
      const instance1 = RepositoryFactory.getRepository(TestRepository);
      const instance2 = RepositoryFactory.getRepository(TestRepository);

      expect(instance1).toBe(instance2);
      expect(RepositoryFactory.hasInstance(TestRepository)).toBe(true);
    });

    test("should return different instances for different repository classes", () => {
      const instance1 = RepositoryFactory.getRepository(TestRepository);
      const instance2 = RepositoryFactory.getRepository(AnotherRepository);

      expect(instance1).not.toBe(instance2);
      expect(instance1).toBeInstanceOf(TestRepository);
      expect(instance2).toBeInstanceOf(AnotherRepository);
    });

    test("should cache repository instances", () => {
      const instance1 = RepositoryFactory.getRepository(TestRepository);

      expect(RepositoryFactory.hasInstance(TestRepository)).toBe(true);

      const instance2 = RepositoryFactory.getRepository(TestRepository);
      expect(instance1).toBe(instance2);
    });
  });

  describe("Custom Database Injection", () => {
    test("should create new instance with custom database", () => {
      const customDb = createMockDb();

      const instance1 = RepositoryFactory.getRepository(
        TestRepository,
        customDb,
      );
      const instance2 = RepositoryFactory.getRepository(
        TestRepository,
        customDb,
      );

      // Custom db should create new instances (not cached)
      expect(instance1).not.toBe(instance2);
      expect(instance1).toBeInstanceOf(TestRepository);
      expect(instance2).toBeInstanceOf(TestRepository);
    });

    test("should not cache instances created with custom database", () => {
      const customDb = createMockDb();

      RepositoryFactory.getRepository(TestRepository, customDb);

      // Should not be cached since it was created with custom db
      expect(RepositoryFactory.hasInstance(TestRepository)).toBe(false);
    });

    test("should use default database when no custom db provided", () => {
      const instance = RepositoryFactory.getRepository(TestRepository);

      expect(instance).toBeInstanceOf(TestRepository);
      expect(RepositoryFactory.hasInstance(TestRepository)).toBe(true);
    });
  });

  describe("Instance Management", () => {
    test("should clear specific repository instance", () => {
      RepositoryFactory.getRepository(TestRepository);
      RepositoryFactory.getRepository(AnotherRepository);

      expect(RepositoryFactory.hasInstance(TestRepository)).toBe(true);
      expect(RepositoryFactory.hasInstance(AnotherRepository)).toBe(true);

      RepositoryFactory.clear(TestRepository);

      expect(RepositoryFactory.hasInstance(TestRepository)).toBe(false);
      expect(RepositoryFactory.hasInstance(AnotherRepository)).toBe(true);
    });

    test("should clear all repository instances", () => {
      RepositoryFactory.getRepository(TestRepository);
      RepositoryFactory.getRepository(AnotherRepository);

      expect(RepositoryFactory.hasInstance(TestRepository)).toBe(true);
      expect(RepositoryFactory.hasInstance(AnotherRepository)).toBe(true);

      RepositoryFactory.clearAll();

      expect(RepositoryFactory.hasInstance(TestRepository)).toBe(false);
      expect(RepositoryFactory.hasInstance(AnotherRepository)).toBe(false);
    });

    test("should get all cached instances", () => {
      const instance1 = RepositoryFactory.getRepository(TestRepository);
      const instance2 = RepositoryFactory.getRepository(AnotherRepository);

      const allInstances = RepositoryFactory.getAllInstances();

      expect(allInstances.size).toBe(2);
      expect(allInstances.get("TestRepository")).toBe(instance1);
      expect(allInstances.get("AnotherRepository")).toBe(instance2);
    });

    test("should return false for non-existent instance", () => {
      expect(RepositoryFactory.hasInstance(TestRepository)).toBe(false);
    });
  });

  describe("Database Management", () => {
    test("should set database instance", () => {
      const newDb = createMockDb();

      RepositoryFactory.setDatabase(newDb);

      const currentDb = RepositoryFactory.getDatabase();
      expect(currentDb).toBe(newDb);
    });

    test("should clear all instances when setting new database", () => {
      RepositoryFactory.getRepository(TestRepository);
      expect(RepositoryFactory.hasInstance(TestRepository)).toBe(true);

      const newDb = createMockDb();
      RepositoryFactory.setDatabase(newDb);

      // All instances should be cleared
      expect(RepositoryFactory.hasInstance(TestRepository)).toBe(false);
    });

    test("should get current database instance", () => {
      const currentDb = RepositoryFactory.getDatabase();
      expect(currentDb).toBeDefined();
    });
  });

  describe("Convenience Functions", () => {
    test("should export getRepository convenience function", async () => {
      const RepositoryFactoryModule = await import(
        "../../../repositories/base/RepositoryFactory"
      );
      const { getRepository } = RepositoryFactoryModule;

      const instance1 = getRepository(TestRepository);
      const instance2 = getRepository(TestRepository);

      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(TestRepository);
    });

    test("should support custom db with convenience function", async () => {
      const RepositoryFactoryModule = await import(
        "../../../repositories/base/RepositoryFactory"
      );
      const { getRepository } = RepositoryFactoryModule;
      const customDb = createMockDb();

      const instance1 = getRepository(TestRepository, customDb);
      const instance2 = getRepository(TestRepository, customDb);

      // Custom db should create new instances
      expect(instance1).not.toBe(instance2);
    });
  });

  describe("Error Handling", () => {
    test("should handle repository with no constructor parameters", () => {
      class SimpleRepository {
        constructor() {
          // No-op
        }
      }

      // Should not throw
      expect(() => {
        RepositoryFactory.getRepository(
          SimpleRepository as unknown as RepositoryConstructor<unknown>,
        );
      }).not.toThrow();
    });

    test("should handle clearing non-existent repository", () => {
      // Should not throw
      expect(() => {
        RepositoryFactory.clear(TestRepository);
      }).not.toThrow();
    });

    test("should handle clearAll when no instances exist", () => {
      // Should not throw
      expect(() => {
        RepositoryFactory.clearAll();
      }).not.toThrow();
    });
  });

  describe("Repository Lifecycle", () => {
    test("should recreate instance after clearing", () => {
      const instance1 = RepositoryFactory.getRepository(TestRepository);

      RepositoryFactory.clear(TestRepository);

      const instance2 = RepositoryFactory.getRepository(TestRepository);

      expect(instance1).not.toBe(instance2);
      expect(instance2).toBeInstanceOf(TestRepository);
    });

    test("should maintain separate instances for different repositories", () => {
      const test1 = RepositoryFactory.getRepository(TestRepository);
      const another1 = RepositoryFactory.getRepository(AnotherRepository);

      RepositoryFactory.clear(TestRepository);

      const test2 = RepositoryFactory.getRepository(TestRepository);
      const another2 = RepositoryFactory.getRepository(AnotherRepository);

      expect(test1).not.toBe(test2);
      expect(another1).toBe(another2); // Should still be the same
    });
  });
});
