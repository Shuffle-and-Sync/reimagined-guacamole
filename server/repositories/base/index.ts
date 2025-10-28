/**
 * Base Repository Pattern Exports
 *
 * This module exports all base repository functionality including:
 * - BaseRepository abstract class
 * - RepositoryFactory for dependency injection
 * - Common types and interfaces
 */

export { BaseRepository } from "./BaseRepository";
export type {
  PaginationOptions,
  SortOptions,
  FilterOptions,
  QueryOptions,
  PaginatedResult,
} from "./BaseRepository";

export { RepositoryFactory, getRepository } from "./RepositoryFactory";
export type { RepositoryConstructor } from "./RepositoryFactory";
