/**
 * Centralized Query Key Factory
 * Provides type-safe, consistent query keys across all features
 */

export const queryKeys = {
  // Auth queries
  auth: {
    all: ["/api/auth"] as const,
    user: () => [...queryKeys.auth.all, "user"] as const,
    profile: (userId: string) =>
      [...queryKeys.auth.all, "profile", userId] as const,
  },

  // Community queries
  communities: {
    all: ["/api/communities"] as const,
    list: () => [...queryKeys.communities.all, "list"] as const,
    detail: (id: string) =>
      [...queryKeys.communities.all, "detail", id] as const,
    members: (id: string) =>
      [...queryKeys.communities.all, id, "members"] as const,
    stats: (id: string) => [...queryKeys.communities.all, id, "stats"] as const,
  },

  // Event queries
  events: {
    all: ["/api/events"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.events.all, "list", filters] as const,
    detail: (id: string) => [...queryKeys.events.all, "detail", id] as const,
    byUserCommunity: (userId: string, communityId: string) =>
      [
        ...queryKeys.events.all,
        "user",
        userId,
        "community",
        communityId,
      ] as const,
    calendar: (month: string, year: string) =>
      [...queryKeys.events.all, "calendar", month, year] as const,
  },

  // User queries
  users: {
    all: ["/api/users"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.users.all, "list", filters] as const,
    detail: (id: string) => [...queryKeys.users.all, "detail", id] as const,
    profile: (id: string) => [...queryKeys.users.all, "profile", id] as const,
    settings: (id: string) => [...queryKeys.users.all, "settings", id] as const,
    activity: (id: string) => [...queryKeys.users.all, "activity", id] as const,
  },

  // Messaging queries
  messaging: {
    all: ["/api/messaging"] as const,
    notifications: (userId: string) =>
      [...queryKeys.messaging.all, "notifications", userId] as const,
    unreadCount: (userId: string) =>
      [...queryKeys.messaging.all, "unread-count", userId] as const,
    conversations: (userId: string) =>
      [...queryKeys.messaging.all, "conversations", userId] as const,
  },
} as const;

/**
 * Query Key Utilities
 */
export const queryUtils = {
  /**
   * Invalidate all queries for a specific feature
   */
  invalidateFeature: (
    queryClient: unknown,
    feature: keyof typeof queryKeys,
  ) => {
    return queryClient.invalidateQueries({
      queryKey: queryKeys[feature].all,
    });
  },

  /**
   * Remove all queries for a specific feature
   */
  removeFeature: (queryClient: unknown, feature: keyof typeof queryKeys) => {
    return queryClient.removeQueries({
      queryKey: queryKeys[feature].all,
    });
  },

  /**
   * Prefetch related data for better UX
   */
  prefetchRelatedData: async (
    queryClient: unknown,
    type: "user" | "community" | "event",
    id: string,
  ) => {
    switch (type) {
      case "user":
        // Prefetch user profile, activity, and settings
        await Promise.all([
          queryClient.prefetchQuery({ queryKey: queryKeys.users.profile(id) }),
          queryClient.prefetchQuery({ queryKey: queryKeys.users.activity(id) }),
          queryClient.prefetchQuery({
            queryKey: queryKeys.messaging.notifications(id),
          }),
        ]);
        break;
      case "community":
        // Prefetch community members and stats
        await Promise.all([
          queryClient.prefetchQuery({
            queryKey: queryKeys.communities.members(id),
          }),
          queryClient.prefetchQuery({
            queryKey: queryKeys.communities.stats(id),
          }),
        ]);
        break;
      case "event":
        // Prefetch event details
        await queryClient.prefetchQuery({
          queryKey: queryKeys.events.detail(id),
        });
        break;
    }
  },
};
