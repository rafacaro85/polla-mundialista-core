import { useState, useEffect } from 'react';

export type TournamentId = 'WC2026' | 'UCL2526';

export const useTournament = () => {
  const [tournamentId, setTournamentId] = useState<TournamentId>('WC2026');

  useEffect(() => {
    // 1. Detect by Hostname
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      
      if (hostname.includes('champions')) {
        setTournamentId('UCL2526');
      } else {
        setTournamentId('WC2026');
      }
      
      // Override logic for development testing (optional)
      // if (window.location.search.includes('force=UCL2526')) setTournamentId('UCL2526');
    }
  }, []);

  return { tournamentId };
};
