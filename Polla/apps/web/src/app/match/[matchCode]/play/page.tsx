'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Image from 'next/image';
import api from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';

export default function MatchPlayPage() {
  const params = useParams();
  const matchCode = params.matchCode as string;
  const router = useRouter();

  const user = useAppStore((s) => s.user);
  const [league, setLeague] = useState<any>(null);
  const [activeMatch, setActiveMatch] = useState<any>(null);
  const [ranking, setRanking] = useState<any[]>([]);
  const [prediction, setPrediction] = useState<{ home: number | ''; away: number | '' }>({ home: '', away: '' });
  const [isJoker, setIsJoker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedPrediction, setSavedPrediction] = useState<any>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return; // Wait for Zustand to hydrate from localStorage
    
    if (!user) {
      router.push(`/match/${matchCode}`);
      return;
    }
    fetchData();
    const interval = setInterval(fetchRanking, 10000); // Polling ranking every 10s
    return () => clearInterval(interval);
  }, [user, isHydrated, matchCode, router]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      // Fetch league basic info
      const { data: leagueData } = await api.get(`/leagues/match-code/${matchCode}`);
      setLeague(leagueData);

      if (leagueData.activeMatchId) {
        // Fetch specific match info
        const { data: matchData } = await api.get(`/matches/${leagueData.activeMatchId}`);
        setActiveMatch(matchData);

        // Fetch User's Prediction if any
        try {
          const { data: myPred } = await api.get(`/predictions/my-matches/${leagueData.activeMatchId}?leagueId=${leagueData.id}`);
          if (myPred) {
            setSavedPrediction(myPred);
            setPrediction({ home: myPred.homeScore, away: myPred.awayScore });
            setIsJoker(myPred.isJoker);
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
      
      // Update match status too if available
      const { data: matchData } = await api.get(`/matches/${activeMatch?.id || league.activeMatchId}`);
      setActiveMatch(matchData);
    } catch (e) {}
  };

  const handleSave = async () => {
    if (prediction.home === '' || prediction.away === '') {
      toast.error('Debes completar ambos marcadores');
      return;
    }

    try {
      setIsSaving(true);
      if (savedPrediction) {
        await api.put(`/predictions/${savedPrediction.id}`, {
          homeScore: Number(prediction.home),
          awayScore: Number(prediction.away),
          isJoker
        });
      } else {
        await api.post(`/predictions`, {
          matchId: activeMatch.id,
          leagueId: league.id,
          homeScore: Number(prediction.home),
          awayScore: Number(prediction.away),
          isJoker
        });
      }
      toast.success('¡Predicción guardada! 🎯');
      fetchData(); // reload
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isLocked = activeMatch?.status === 'IN_PLAY' || activeMatch?.status === 'PAUSED' || activeMatch?.status === 'FINISHED' || activeMatch?.isManuallyLocked;

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-2">
            {league?.brandingLogoUrl ? (
              <Image src={league.brandingLogoUrl} alt="Logo" width={32} height={32} className="rounded-full" />
            ) : (
              <Image src="/assets/logo.png" alt="Logo" width={32} height={32} />
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
          <div className="text-center p-8 bg-slate-900 rounded-2xl border border-slate-800 mt-8">
            <span className="text-4xl mb-4 block">⏳</span>
            <h2 className="text-xl font-bold text-white mb-2">Aún no hay partido</h2>
            <p className="text-slate-400">El administrador aún no ha activado ningún partido.<br/>¡Vuelve pronto!</p>
          </div>
        ) : (
          <>
            {/* Prediction Card */}
            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-green-400"></div>
              
              <div className="text-center mb-6">
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                  activeMatch.status === 'FINISHED' ? 'bg-slate-800 text-slate-400' :
                  activeMatch.status === 'IN_PLAY' ? 'bg-red-500/20 text-red-500 border border-red-500/50 animate-pulse' :
                  'bg-emerald-500/20 text-emerald-500 border border-emerald-500/50'
                }`}>
                  {activeMatch.status === 'FINISHED' ? 'FINALIZADO' :
                   activeMatch.status === 'IN_PLAY' ? `EN VIVO ${activeMatch.minute || ''}'` :
                   'PROGRAMADO'}
                </div>
              </div>

              <div className="flex items-center justify-between mb-8">
                {/* Home */}
                <div className="flex flex-col items-center flex-1">
                  <div className="w-16 h-16 relative bg-slate-800 rounded-2xl p-2 mb-2 flex items-center justify-center border border-slate-700">
                    {activeMatch.homeFlag && <Image src={activeMatch.homeFlag} alt={activeMatch.homeTeam} fill className="object-contain p-1" />}
                  </div>
                  <span className="text-white font-bold text-sm text-center">{activeMatch.homeTeam}</span>
                  <input
                    type="number"
                    value={prediction.home}
                    onChange={(e) => setPrediction({...prediction, home: e.target.value === '' ? '' : Number(e.target.value)})}
                    disabled={isLocked || isSaving}
                    className="w-16 h-16 bg-slate-950 border-2 border-slate-700 rounded-2xl mt-4 text-center text-3xl font-black text-white focus:border-emerald-500 focus:outline-none transition-all disabled:opacity-50"
                  />
                </div>

                <div className="text-slate-500 font-black text-xl px-4 mt-8">VS</div>

                {/* Away */}
                <div className="flex flex-col items-center flex-1">
                  <div className="w-16 h-16 relative bg-slate-800 rounded-2xl p-2 mb-2 flex items-center justify-center border border-slate-700">
                    {activeMatch.awayFlag && <Image src={activeMatch.awayFlag} alt={activeMatch.awayTeam} fill className="object-contain p-1" />}
                  </div>
                  <span className="text-white font-bold text-sm text-center">{activeMatch.awayTeam}</span>
                  <input
                    type="number"
                    value={prediction.away}
                    onChange={(e) => setPrediction({...prediction, away: e.target.value === '' ? '' : Number(e.target.value)})}
                    disabled={isLocked || isSaving}
                    className="w-16 h-16 bg-slate-950 border-2 border-slate-700 rounded-2xl mt-4 text-center text-3xl font-black text-white focus:border-emerald-500 focus:outline-none transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              {!isLocked && (
                 <button
                  onClick={() => setIsJoker(!isJoker)}
                  className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 mb-4 transition-all ${
                    isJoker ? 'bg-amber-500/20 text-amber-500 border-2 border-amber-500' : 'bg-slate-950 text-slate-400 border-2 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  ⭐ {isJoker ? 'Comodín Activado (Puntos x2)' : 'Usar Comodín (Puntos x2)'}
                </button>
              )}

              {!isLocked ? (
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full bg-gradient-to-r from-emerald-500 to-green-400 text-slate-950 font-black py-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] disabled:opacity-70"
                >
                  {isSaving ? 'GUARDANDO...' : savedPrediction ? 'ACTUALIZAR 🎯' : 'GUARDAR 🎯'}
                </button>
              ) : (
                <div className="bg-slate-800 text-slate-300 text-center py-3 rounded-xl font-bold border border-slate-700">
                  {savedPrediction ? 'PREDICCIÓN GUARDADA 🔒' : 'TIEMPO AGOTADO 🔒'}
                </div>
              )}
            </div>

            {/* Realtime Ranking */}
            <div>
              <h3 className="text-slate-400 font-bold mb-4 ml-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                RANKING EN VIVO
              </h3>
              
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl">
                {ranking.length === 0 ? (
                  <p className="text-slate-500 text-center py-4 text-sm">Aún no hay predicciones.</p>
                ) : (
                  <div className="space-y-3">
                    {ranking.map((row, i) => (
                      <div key={i} className={`flex items-center justify-between p-3 rounded-2xl ${
                        row.name === (user?.name || user?.fullName) ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-slate-950'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black ${
                            row.rank === 1 ? 'bg-amber-500 text-white' : 
                            row.rank === 2 ? 'bg-slate-400 text-white' :
                            row.rank === 3 ? 'bg-amber-700 text-white' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            {row.rank}
                          </div>
                          <div>
                            <div className="text-white font-bold text-sm flex items-center gap-2">
                              {row.name}
                              {row.isJoker && <span className="text-amber-500 text-xs">⭐</span>}
                            </div>
                            <div className="text-slate-500 text-xs">Mesa: {row.tableNumber || '-'}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="bg-slate-800 px-2 py-1 rounded border border-slate-700 tracking-widest text-slate-300 font-mono text-xs">
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
            </div>
          </>
        )}
      </div>
    </div>
  );
}
