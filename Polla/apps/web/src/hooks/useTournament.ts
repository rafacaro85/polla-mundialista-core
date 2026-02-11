import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export type TournamentId = 'WC2026' | 'UCL2526';

export const useTournament = () => {
  const searchParams = useSearchParams();
  const [tournamentId, setTournamentId] = useState<TournamentId>('WC2026');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const detectTournament = () => {
      // 1. Priority: URL Params
      const urlParams = new URL(window.location.href).searchParams;
      const queryTournament = urlParams.get('tournament') || urlParams.get('tournamentId');
      
      if (queryTournament && (queryTournament === 'WC2026' || queryTournament === 'UCL2526')) {
        setTournamentId(queryTournament as TournamentId);
        localStorage.setItem('selectedTournament', queryTournament);
        setIsReady(true);
        return;
      }

      // 2. Priority: LocalStorage
      const stored = typeof window !== 'undefined' ? localStorage.getItem('selectedTournament') : null;
      if (stored && (stored === 'WC2026' || stored === 'UCL2526')) {
        setTournamentId(stored as TournamentId);
        setIsReady(true);
        return;
      }

      // 3. Fallback: Hostname/Env
      const hostname = window.location.hostname;
      const envTheme = process.env.NEXT_PUBLIC_APP_THEME;
      const detectedId = (hostname.includes('champions') || envTheme === 'CHAMPIONS') ? 'UCL2526' : 'WC2026';
      setTournamentId(detectedId);
      setIsReady(true);
    };

    detectTournament();
  }, [searchParams]);

  return { tournamentId, isReady };
};
