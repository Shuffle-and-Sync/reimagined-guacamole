import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

/**
 * Global state for cross-feature coordination
 * Uses Zustand for lightweight, performant state management
 */

interface GlobalState {
  // UI State
  theme: "light" | "dark" | "system";
  sidebarCollapsed: boolean;
  notificationsPanelOpen: boolean;

  // User Preferences
  preferredCommunity: string | null;
  viewMode: "grid" | "list";

  // Real-time Updates
  unreadNotifications: number;
  onlineUsers: string[];

  // Performance Tracking
  lastActivity: number;
  backgroundSyncEnabled: boolean;

  // Actions
  setTheme: (theme: "light" | "dark" | "system") => void;
  toggleSidebar: () => void;
  setNotificationsPanelOpen: (open: boolean) => void;
  setPreferredCommunity: (communityId: string | null) => void;
  setViewMode: (mode: "grid" | "list") => void;
  setUnreadNotifications: (count: number) => void;
  addOnlineUser: (userId: string) => void;
  removeOnlineUser: (userId: string) => void;
  updateLastActivity: () => void;
  setBackgroundSyncEnabled: (enabled: boolean) => void;

  // Computed values
  isDarkMode: () => boolean;
  hasUnreadNotifications: () => boolean;
  isUserOnline: (userId: string) => boolean;
}

export const useGlobalState = create<GlobalState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        theme: "system",
        sidebarCollapsed: false,
        notificationsPanelOpen: false,
        preferredCommunity: null,
        viewMode: "grid",
        unreadNotifications: 0,
        onlineUsers: [],
        lastActivity: Date.now(),
        backgroundSyncEnabled: true,

        // Actions
        setTheme: (theme) => set({ theme }),
        toggleSidebar: () =>
          set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
        setNotificationsPanelOpen: (open) =>
          set({ notificationsPanelOpen: open }),
        setPreferredCommunity: (communityId) =>
          set({ preferredCommunity: communityId }),
        setViewMode: (mode) => set({ viewMode: mode }),
        setUnreadNotifications: (count) => set({ unreadNotifications: count }),
        addOnlineUser: (userId) =>
          set((state) => ({
            onlineUsers: state.onlineUsers.includes(userId)
              ? state.onlineUsers
              : [...state.onlineUsers, userId],
          })),
        removeOnlineUser: (userId) =>
          set((state) => ({
            onlineUsers: state.onlineUsers.filter((id) => id !== userId),
          })),
        updateLastActivity: () => set({ lastActivity: Date.now() }),
        setBackgroundSyncEnabled: (enabled) =>
          set({ backgroundSyncEnabled: enabled }),

        // Computed values
        isDarkMode: () => {
          const state = get();
          if (state.theme === "system") {
            return window.matchMedia("(prefers-color-scheme: dark)").matches;
          }
          return state.theme === "dark";
        },
        hasUnreadNotifications: () => get().unreadNotifications > 0,
        isUserOnline: (userId) => get().onlineUsers.includes(userId),
      }),
      {
        name: "shuffle-sync-global-state",
        partialize: (state) => ({
          theme: state.theme,
          sidebarCollapsed: state.sidebarCollapsed,
          preferredCommunity: state.preferredCommunity,
          viewMode: state.viewMode,
          backgroundSyncEnabled: state.backgroundSyncEnabled,
        }),
      },
    ),
    {
      name: "global-state",
    },
  ),
);

/**
 * Hook for syncing global state with React Query
 */
export function useGlobalStateSync() {
  const {
    unreadNotifications,
    setUnreadNotifications,
    updateLastActivity,
    backgroundSyncEnabled,
  } = useGlobalState();

  // Sync notification count with React Query data
  const syncNotifications = (count: number) => {
    if (count !== unreadNotifications) {
      setUnreadNotifications(count);
    }
  };

  // Track user activity
  const trackActivity = () => {
    updateLastActivity();
  };

  return {
    syncNotifications,
    trackActivity,
    backgroundSyncEnabled,
  };
}
