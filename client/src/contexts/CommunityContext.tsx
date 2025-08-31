import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Community } from '@shared/schema';
import { getCommunityTheme, applyCommunityTheme } from '@/lib/communityThemes';

interface CommunityContextType {
  selectedCommunity: Community | null;
  setSelectedCommunity: (community: Community | null) => void;
  communities: Community[];
  isLoading: boolean;
}

const CommunityContext = createContext<CommunityContextType | undefined>(undefined);

export function CommunityProvider({ children }: { children: ReactNode }) {
  const [selectedCommunity, setSelectedCommunityState] = useState<Community | null>(null);
  
  // Fetch all communities
  const { data: communities = [], isLoading } = useQuery<Community[]>({
    queryKey: ['/api/communities'],
  });

  // Set initial community (first one or saved preference)
  useEffect(() => {
    if (communities.length > 0 && !selectedCommunity) {
      // Try to get saved community from localStorage
      const savedCommunityId = localStorage.getItem('selectedCommunityId');
      if (savedCommunityId) {
        const savedCommunity = communities.find(c => c.id === savedCommunityId);
        if (savedCommunity) {
          setSelectedCommunityState(savedCommunity);
          return;
        }
      }
      // Default to first community
      setSelectedCommunityState(communities[0]);
    }
  }, [communities, selectedCommunity]);

  const setSelectedCommunity = (community: Community | null) => {
    setSelectedCommunityState(community);
    if (community) {
      localStorage.setItem('selectedCommunityId', community.id);
    } else {
      localStorage.removeItem('selectedCommunityId');
    }
    
    // Apply community theme
    const theme = getCommunityTheme(community?.id);
    applyCommunityTheme(theme);
  };

  // Apply theme when community changes
  useEffect(() => {
    const theme = getCommunityTheme(selectedCommunity?.id);
    applyCommunityTheme(theme);
  }, [selectedCommunity]);

  return (
    <CommunityContext.Provider
      value={{
        selectedCommunity,
        setSelectedCommunity,
        communities,
        isLoading,
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