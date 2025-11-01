import { cacheInvalidation } from "../events/cache-invalidation.events";

/**
 * Cache Invalidation Hooks
 *
 * Database hooks that automatically invalidate cache when data changes.
 * These should be called after data modification operations.
 */

/**
 * Hook to invalidate tournament cache when updated
 */
export function onTournamentUpdate(tournamentId: string) {
  // Invalidate specific tournament
  cacheInvalidation.invalidateKey(
    `tournament:${tournamentId}:standings`,
    "Tournament updated",
  );

  // Invalidate tournament lists
  cacheInvalidation.invalidatePattern(
    "tournaments:list:*",
    "Tournament updated",
  );
}

/**
 * Hook to invalidate user cache when profile updated
 */
export function onUserProfileUpdate(userId: string) {
  cacheInvalidation.invalidatePattern(
    `user:${userId}:*`,
    "User profile updated",
  );
}

/**
 * Hook to invalidate community cache
 */
export function onCommunityUpdate(communityId: string) {
  cacheInvalidation.invalidatePattern(
    `community:${communityId}:*`,
    "Community updated",
  );
}

/**
 * Hook to invalidate event cache
 */
export function onEventUpdate(eventId: string) {
  cacheInvalidation.invalidateKey(`event:${eventId}`, "Event updated");

  cacheInvalidation.invalidatePattern("events:list:*", "Event updated");
}

/**
 * Hook to invalidate game cache
 */
export function onGameUpdate(gameId: string) {
  cacheInvalidation.invalidateKey(`game:${gameId}`, "Game updated");

  cacheInvalidation.invalidatePattern("games:list:*", "Game updated");
}

/**
 * Hook to invalidate card cache
 */
export function onCardUpdate(cardId: string) {
  cacheInvalidation.invalidateKey(`card:${cardId}`, "Card updated");
}
