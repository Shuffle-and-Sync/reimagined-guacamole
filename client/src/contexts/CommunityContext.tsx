import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Community } from '@shared/schema';
import { getCommunityTheme, applyCommunityTheme, type CommunityTheme } from '@/lib/communityThemes';

interface CommunityContextType {
  selectedCommunity: Community | null;
  setSelectedCommunity: (community: Community | null) => void;
  communities: Community[];
  isLoading: boolean;
  communityTheme: CommunityTheme;
}

const CommunityContext = createContext<CommunityContextType | undefined>(undefined);

export function CommunityProvider({ children }: { children: ReactNode }) {
  const [selectedCommunity, setSelectedCommunityState] = useState<Community | null>(null);
  const [communityTheme, setCommunityTheme] = useState<CommunityTheme>(() => getCommunityTheme(null));
  const hasInitialized = useRef(false);
  
  // Fetch all communities
  const { data: communities = [], isLoading } = useQuery<Community[]>({
    queryKey: ['/api/communities'],
  });

  // Set initial community (saved preference only, default to All Realms)
  useEffect(() => {
    // Only run once when communities are first loaded
    if (communities.length > 0 && !hasInitialized.current) {
      hasInitialized.current = true;
      
      // Try to get saved community from localStorage
      const savedCommunityId = localStorage.getItem('selectedCommunityId');
      if (savedCommunityId && savedCommunityId !== 'null') {
        const savedCommunity = communities.find(c => c.id === savedCommunityId);
        if (savedCommunity) {
          setSelectedCommunityState(savedCommunity);
          return;
        }
      }
      // selectedCommunity is already null by default, no need to set it again
    }
  }, [communities]);

  const setSelectedCommunity = (community: Community | null) => {
    setSelectedCommunityState(community);
    if (community) {
      localStorage.setItem('selectedCommunityId', community.id);
    } else {
      localStorage.setItem('selectedCommunityId', 'null'); // Explicitly save "All Realms" choice
    }
    
    // Apply community theme
    const theme = getCommunityTheme(community?.id);
    applyCommunityTheme(theme);
    setCommunityTheme(theme);
  };

  // Apply theme when community changes
  useEffect(() => {
    const theme = getCommunityTheme(selectedCommunity?.id);
    applyCommunityTheme(theme);
    setCommunityTheme(theme);
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
    throw new Error('useCommunity must be used within a CommunityProvider');
  }
  return context;
}