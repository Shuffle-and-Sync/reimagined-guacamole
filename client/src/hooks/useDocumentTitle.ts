import { useEffect } from 'react';

export function useDocumentTitle(title: string, communityName?: string) {
  useEffect(() => {
    const fullTitle = communityName 
      ? `${title} - ${communityName} | Shuffle & Sync`
      : `${title} | Shuffle & Sync`;
    document.title = fullTitle;
    
    // Cleanup function to reset title
    return () => {
      document.title = 'Shuffle & Sync';
    };
  }, [title, communityName]);
}