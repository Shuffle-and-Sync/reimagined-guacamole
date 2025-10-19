import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import type { Community } from "@shared/schema";
import {
  getCommunityTheme,
  applyCommunityTheme,
  type CommunityTheme,
} from "../utils/communityThemes";

interface CommunityContextType {
  selectedCommunity: Community | null;
  setSelectedCommunity: (community: Community | null) => void;
  communities: Community[];
  isLoading: boolean;
  communityTheme: CommunityTheme;
}

const CommunityContext = createContext<CommunityContextType | undefined>(
  undefined,
);

export function CommunityProvider({ children }: { children: ReactNode }) {
  const [selectedCommunity, setSelectedCommunityState] =
    useState<Community | null>(null);
  const [communityTheme, setCommunityTheme] = useState<CommunityTheme>(() =>
    getCommunityTheme(null),
  );
  const initializedRef = useRef(false);

  // Fetch all communities
  const { data: communities = [], isLoading } = useQuery<Community[]>({
    queryKey: ["/api/communities"],
  });

  // Set initial community (saved preference only, default to All Realms)
  useEffect(() => {
    if (
      communities.length > 0 &&
      selectedCommunity === null &&
      !initializedRef.current
    ) {
      initializedRef.current = true;
      // Try to get saved community from localStorage
      const savedCommunityId = localStorage.getItem("selectedCommunityId");
      if (savedCommunityId && savedCommunityId !== "null") {
        const savedCommunity = communities.find(
          (c) => c.id === savedCommunityId,
        );
        if (savedCommunity) {
          // Use requestAnimationFrame to defer state update and avoid cascading renders
          requestAnimationFrame(() => {
            setSelectedCommunityState(savedCommunity);
          });
          return;
        }
      }
      // Default to All Realms (null) - don&apos;t auto-select a community
      requestAnimationFrame(() => {
        setSelectedCommunityState(null);
      });
    }
  }, [communities, selectedCommunity]);

  const setSelectedCommunity = (community: Community | null) => {
    setSelectedCommunityState(community);
    if (community) {
      localStorage.setItem("selectedCommunityId", community.id);
    } else {
      localStorage.setItem("selectedCommunityId", "null"); // Explicitly save "All Realms" choice
    }
  };

  // Apply theme when community changes
  useEffect(() => {
    const theme = getCommunityTheme(selectedCommunity?.id);
    applyCommunityTheme(theme);
    // Use requestAnimationFrame to defer state update and avoid cascading renders
    requestAnimationFrame(() => {
      setCommunityTheme(theme);
    });
  }, [selectedCommunity]);

  return (
    <CommunityContext.Provider
      value={{
        selectedCommunity,
        setSelectedCommunity,
        communities,
        isLoading,
        communityTheme,
      }}
    >
      {children}
    </CommunityContext.Provider>
  );
}

export function useCommunity() {
  const context = useContext(CommunityContext);
  if (context === undefined) {
    throw new Error("useCommunity must be used within a CommunityProvider");
  }
  return context;
}
