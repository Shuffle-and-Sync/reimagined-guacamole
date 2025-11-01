/**
 * Example Integration: Advanced Caching with Events Service
 *
 * This file demonstrates how to integrate the AdvancedCacheService
 * with the EventsService for improved performance using stale-while-revalidate.
 *
 * To use this in production:
 * 1. Import this service instead of the regular EventsService
 * 2. Use the cached methods for frequently accessed data
 * 3. Ensure cache invalidation hooks are called on data updates
 */

import { onEventUpdate } from "../../hooks/cache-invalidation.hooks";
import { advancedCache } from "../../services/advanced-cache.service";
import type { EventFilters } from "./events.types";

/**
 * Cached wrapper for getEventsWithAttendees
 *
 * Uses stale-while-revalidate to serve cached data immediately
 * while fetching fresh data in the background
 */
export async function getCachedEventsWithAttendees(
  filters: EventFilters,
  eventsService: any, // Replace with actual EventsService type
) {
  // Create a unique cache key based on filters
  const cacheKey = `events:list:${JSON.stringify(filters)}`;

  return advancedCache.getStaleWhileRevalidate(
    cacheKey,
    async () => {
      // This function fetches fresh data
      return await eventsService.getEventsWithAttendees(filters);
    },
    {
      ttl: 300, // Cache for 5 minutes
      staleTime: 60, // Consider stale after 1 minute
      revalidate: true, // Revalidate in background when stale
    },
  );
}

/**
 * Cached wrapper for getEventById
 *
 * Single event lookups benefit from longer cache times
 */
export async function getCachedEventById(eventId: string, eventsService: any) {
  const cacheKey = `event:${eventId}`;

  return advancedCache.getStaleWhileRevalidate(
    cacheKey,
    async () => {
      return await eventsService.getEventById(eventId);
    },
    {
      ttl: 600, // Cache for 10 minutes
      staleTime: 120, // Consider stale after 2 minutes
      revalidate: true,
    },
  );
}

/**
 * Example: Update event with cache invalidation
 *
 * This shows how to integrate cache invalidation when updating events
 */
export async function updateEventWithCacheInvalidation(
  eventId: string,
  updateData: any,
  eventsService: any,
) {
  // Perform the update
  const result = await eventsService.updateEvent(eventId, updateData);

  // Trigger cache invalidation
  onEventUpdate(eventId);

  return result;
}

/**
 * Example: Delete event with cache invalidation
 */
export async function deleteEventWithCacheInvalidation(
  eventId: string,
  eventsService: any,
) {
  // Perform the deletion
  const result = await eventsService.deleteEvent(eventId);

  // Trigger cache invalidation
  onEventUpdate(eventId);

  return result;
}

/**
 * Usage Example in a Route:
 *
 * ```typescript
 * import { getCachedEventsWithAttendees } from './events-cache-integration.example';
 * import { EventsService } from './events.service';
 *
 * const eventsService = new EventsService();
 *
 * app.get('/api/events', async (req, res) => {
 *   const filters = req.query;
 *
 *   // Use cached version for better performance
 *   const events = await getCachedEventsWithAttendees(filters, eventsService);
 *
 *   res.json(events);
 * });
 *
 * app.put('/api/events/:id', async (req, res) => {
 *   const eventId = req.params.id;
 *   const updateData = req.body;
 *
 *   // Update with automatic cache invalidation
 *   const result = await updateEventWithCacheInvalidation(
 *     eventId,
 *     updateData,
 *     eventsService
 *   );
 *
 *   res.json(result);
 * });
 * ```
 */
