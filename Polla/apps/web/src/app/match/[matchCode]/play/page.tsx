'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Image from 'next/image';
import api from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import MatchCard from '@/components/MatchCard';
import { getTeamFlagUrl } from '@/shared/utils/flags';

// Helper to ensure flag is a URL
const ensureFlagUrl = (flag: string | null | undefined, teamName: string) => {
    if (flag && (flag.startsWith('http') || flag.startsWith('/'))) return flag;
    if (flag && flag.length <= 3 && !flag.includes('/')) return `https://flagcdn.com/h80/${flag}.png`;
    return getTeamFlagUrl(teamName);
};

export default function MatchPlayPage() {
  const params = useParams();
  const matchCode = params.matchCode as string;
  const router = useRouter();

  const user = useAppStore((s) => s.user);
  const [league, setLeague] = useState<any>(null);
  const [activeMatch, setActiveMatch] = useState<any>(null);
  const [ranking, setRanking] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savedPrediction, setSavedPrediction] = useState<any>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    
    if (!user) {
      router.push(`/match/${matchCode}`);
      return;
    }
    fetchData();
    const interval = setInterval(fetchRanking, 30000); // Polling ranking every 30s
    return () => clearInterval(interval);
  }, [user, isHydrated, matchCode, router]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const { data: leagueData } = await api.get(`/leagues/match-code/${matchCode}`);
      setLeague(leagueData);

      if (leagueData.activeMatchId) {
        const { data: matchData } = await api.get(`/matches/${leagueData.activeMatchId}`);
        setActiveMatch(matchData);

        // Fetch User's Prediction if any
        try {
          const { data: myPred } = await api.get(`/predictions/my-matches/${leagueData.activeMatchId}?leagueId=${leagueData.id}`);
          if (myPred) {
            setSavedPrediction(myPred);
          }
        } catch (e) {}

        // Fetch Initial Ranking
        const { data: rankData } = await api.get(`/leagues/${leagueData.id}/match-mode/tv`);
        setRanking(rankData.ranking);
      }
    } catch (e: any) {
      toast.error('Error cargando los datos del partido.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRanking = async () => {
    if (!league?.id) return;
    try {
      const { data } = await api.get(`/leagues/${league.id}/match-mode/tv`);
      setRanking(data.ranking);
      
      // Update match status too
      const { data: matchData } = await api.get(`/matches/${activeMatch?.id || league.activeMatchId}`);
      setActiveMatch(matchData);
    } catch (e) {}
  };

  // Transform the active match into the format MatchCard expects
  const matchCardData = useMemo(() => {
    if (!activeMatch) return null;

    const date = new Date(activeMatch.date);
    const monthNames = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
      'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
    const dateStr = `${monthNames[date.getMonth()]} ${date.getDate()}`;

    return {
      ...activeMatch,
      dateStr,
      displayDate: dateStr,
      homeTeam: activeMatch.homeTeam || activeMatch.home_team,
      awayTeam: activeMatch.awayTeam || activeMatch.away_team,
      homeFlag: ensureFlagUrl(activeMatch.homeFlag, activeMatch.homeTeam || ''),
      awayFlag: ensureFlagUrl(activeMatch.awayFlag, activeMatch.awayTeam || ''),
      status: activeMatch.status === 'COMPLETED' ? 'FINISHED' : activeMatch.status,
      scoreH: activeMatch.homeScore,
      scoreA: activeMatch.awayScore,
      stadium: activeMatch.stadium || activeMatch.venue || '',
      group: activeMatch.group || '',
      prediction: savedPrediction ? {
        homeScore: savedPrediction.homeScore,
        awayScore: savedPrediction.awayScore,
        isJoker: false,
        points: savedPrediction.points || 0
      } : undefined,
      userH: savedPrediction?.homeScore?.toString() || '',
      userA: savedPrediction?.awayScore?.toString() || '',
      points: savedPrediction?.points || 0,
      // Hide joker for match mode
      isJoker: false
    };
  }, [activeMatch, savedPrediction]);

  const handleSavePrediction = async (matchId: string, homeScore: any, awayScore: any, _isJoker?: boolean) => {
    if ((homeScore === null || homeScore === '') && (awayScore === null || awayScore === '')) {
      // User clearing prediction
      return;
    }

    try {
      if (savedPrediction) {
        await api.put(`/predictions/${savedPrediction.id}`, {
          homeScore: Number(homeScore),
          awayScore: Number(awayScore),
          isJoker: false
        });
      } else {
        await api.post(`/predictions`, {
          matchId: activeMatch.id,
          leagueId: league.id,
          homeScore: Number(homeScore),
          awayScore: Number(awayScore),
          isJoker: false
        });
      }
      toast.success('¡Predicción guardada! 🎯');
      fetchData(); // reload
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] pb-20">
      {/* Header */}
      <div className="bg-[#1E293B] border-b border-[#334155] p-4 sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-2">
            {league?.brandingLogoUrl ? (
              <Image src={league.brandingLogoUrl} alt="Logo" width={32} height={32} className="rounded-full" />
            ) : (
              <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 font-bold text-xs">⚽</div>
            )}
            <span className="text-white font-bold text-sm truncate max-w-[150px]">{league?.name || 'Polla Match'}</span>
          </div>
          <div className="text-right">
            <div className="text-emerald-400 font-bold text-sm">👤 {user?.name || user?.fullName}</div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {!activeMatch ? (
          <div className="text-center p-8 bg-[#1E293B] rounded-2xl border border-[#334155] mt-8">
            <span className="text-4xl mb-4 block">⏳</span>
            <h2 className="text-xl font-bold text-white mb-2">Aún no hay partido</h2>
            <p className="text-slate-400">El administrador aún no ha activado ningún partido.<br/>¡Vuelve pronto!</p>
          </div>
        ) : (
          <>
            {/* ═══ SECCIÓN 1: PREDICCIÓN (Usando MatchCard de Champions/Mundial) ═══ */}
            <div>
              <h3 className="text-white font-black text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
                🎯 Tu Predicción
              </h3>

              {matchCardData && (
                <MatchCard
                  match={matchCardData}
                  showInputs={true}
                  onSavePrediction={handleSavePrediction}
                  hideJoker={true}
                />
              )}
            </div>

            {/* ═══ SECCIÓN 2: RANKING EN VIVO ═══ */}
            <div>
              <h3 className="text-slate-400 font-bold mb-4 ml-2 flex items-center gap-2 uppercase text-sm tracking-wider">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                Ranking en Vivo
              </h3>
              
              <div className="bg-[#1E293B] border border-[#334155] rounded-3xl p-4 shadow-xl">
                {ranking.length === 0 ? (
                  <p className="text-slate-500 text-center py-4 text-sm">Aún no hay predicciones.</p>
                ) : (
                  <div className="space-y-3">
                    {ranking.map((row, i) => (
                      <div key={i} className={`flex items-center justify-between p-3 rounded-2xl ${
                        row.name === (user?.name || user?.fullName) ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-[#0F172A]'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
                            row.rank === 1 ? 'bg-amber-500 text-white' : 
                            row.rank === 2 ? 'bg-slate-400 text-white' :
                            row.rank === 3 ? 'bg-amber-700 text-white' :
                            'bg-[#1E293B] text-slate-400'
                          }`}>
                            {row.rank}
                          </div>
                          <div>
                            <div className="text-white font-bold text-sm">{row.name}</div>
                            <div className="text-slate-500 text-xs">Mesa: {row.tableNumber || '-'}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="bg-[#0F172A] px-2 py-1 rounded border border-[#334155] tracking-widest text-slate-300 font-mono text-xs">
                            {row.prediction.home}-{row.prediction.away}
                          </div>
                          <div className="text-emerald-400 font-black text-lg w-8 text-right">
                            {row.points}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <p className="text-slate-600 text-[10px] text-center mt-3">
                Se actualiza automáticamente cada 30 segundos
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
