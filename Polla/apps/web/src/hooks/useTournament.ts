import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export type TournamentId = 'WC2026' | 'UCL2526';

export const useTournament = () => {
  const searchParams = useSearchParams();
  
  // Helper to detect tournament synchronously for initial state
  const getDetectedTournament = (): TournamentId => {
    if (typeof window === 'undefined') return 'WC2026';
    
    // 1. URL Params
    const urlParams = new URL(window.location.href).searchParams;
    const queryTournament = urlParams.get('tournament') || urlParams.get('tournamentId');
    if (queryTournament && (queryTournament === 'WC2026' || queryTournament === 'UCL2526')) {
      return queryTournament as TournamentId;
    }

    // 2. LocalStorage
    const stored = localStorage.getItem('selectedTournament');
    if (stored && (stored === 'WC2026' || stored === 'UCL2526')) {
      return stored as TournamentId;
    }

    // 3. Fallback: Hostname/Env
    const hostname = window.location.hostname;
    const envTheme = process.env.NEXT_PUBLIC_APP_THEME;
    return (hostname.includes('champions') || envTheme === 'CHAMPIONS') ? 'UCL2526' : 'WC2026';
  };

  const [tournamentId, setTournamentId] = useState<TournamentId>(getDetectedTournament());
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const detect = getDetectedTournament();
    setTournamentId(detect);
    
    // Persistence
    if (typeof window !== 'undefined') {
        const urlParams = new URL(window.location.href).searchParams;
        const query = urlParams.get('tournament') || urlParams.get('tournamentId');
        if (query === 'WC2026' || query === 'UCL2526') {
            localStorage.setItem('selectedTournament', query);
        }
    }
    
    setIsReady(true);
  }, [searchParams]);

  return { tournamentId, isReady };
};
