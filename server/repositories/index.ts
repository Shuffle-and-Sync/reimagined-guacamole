/**
 * Repository Barrel Exports
 *
 * Central export point for all repository classes, making imports cleaner
 * and easier to manage throughout the application.
 *
 * @example
 * ```typescript
 * import { EventRepository, NotificationRepository } from './repositories';
 * ```
 */

// Base classes
export { BaseRepository } from "./base/BaseRepository";
export {
  RepositoryFactory,
  getRepository,
  type RepositoryConstructor,
} from "./base/RepositoryFactory";

// Domain repositories
export { EventRepository } from "./EventRepository";
export { NotificationRepository } from "./NotificationRepository";
export { MessagingRepository } from "./MessagingRepository";
export { CommunityRepository } from "./CommunityRepository";

// Re-export types from base repository
export type {
  PaginationOptions,
  SortOptions,
  FilterOptions,
  QueryOptions,
  PaginatedResult,
} from "./base/BaseRepository";

// Re-export types from domain repositories
export type {
  EventFilters,
  CalendarEventFilters,
  EventWithDetails,
} from "./EventRepository";

export type { NotificationQueryOptions } from "./NotificationRepository";

export type {
  MessageWithDetails,
  MessageQueryOptions,
} from "./MessagingRepository";

export type {
  UserCommunityWithDetails,
  CommunityWithStats,
  CommunityActiveUsersOptions,
} from "./CommunityRepository";
