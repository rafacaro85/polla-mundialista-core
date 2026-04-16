'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import api from '@/lib/api';
import { QRCodeSVG } from 'qrcode.react';

export default function MatchTvPage() {
  const params = useParams();
  const matchCode = params.matchCode as string;

  const [league, setLeague] = useState<any>(null);
  const [activeMatch, setActiveMatch] = useState<any>(null);
  const [ranking, setRanking] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, [matchCode]);

  const fetchInitialData = async () => {
    try {
      const { data: leagueData } = await api.get(`/leagues/match-code/${matchCode}`);
      setLeague(leagueData);
      if (leagueData.activeMatchId) {
        // Fetch specific match info for teams/score
        const { data: matchData } = await api.get(`/matches/${leagueData.activeMatchId}`);
        setActiveMatch(matchData);
      }
      setIsLoading(false);
    } catch (e) {
      console.error('Error fetching TV data', e);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!league?.id) return;
    fetchRanking();
    const interval = setInterval(fetchRanking, 5000); // Check every 5s for Live action
    return () => clearInterval(interval);
  }, [league?.id]);

  const fetchRanking = async () => {
    try {
      const { data } = await api.get(`/leagues/${league.id}/match-mode/tv`);
      setRanking(data.ranking);
      
      const { data: matchData } = await api.get(`/matches/${league.activeMatchId}`);
      setActiveMatch(matchData);
    } catch (e) {}
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h1 className="text-white text-2xl font-black italic">CARGANDO EL JUEGO...</h1>
      </div>
    );
  }

  if (!league) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-white text-5xl font-black mb-4">MESA CERRADA</h1>
        <p className="text-slate-400 text-xl">Escanea el código QR válido de tu mesa.</p>
      </div>
    );
  }

  if (!activeMatch) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-white text-5xl font-black mb-4">ESPERANDO PARTIDO...</h1>
        <p className="text-slate-400 text-xl">El administrador pronto activará un juego para esta mesa.</p>
      </div>
    );
  }

  const isLive = activeMatch.status === 'IN_PLAY' || activeMatch.status === 'PAUSED';
  const isFinished = activeMatch.status === 'FINISHED';

  const matchDate = new Date(activeMatch.date).getTime();
  const now = Date.now();
  const hideQR = isLive || isFinished || (matchDate - now <= 2 * 60 * 1000);
  const joinUrl = typeof window !== 'undefined' ? `${window.location.origin}/match/${league.matchCode}` : '';

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col overflow-hidden relative">
      {/* Dynamic Background */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-emerald-500/10 rounded-full blur-[150px] mix-blend-screen pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-blue-500/10 rounded-full blur-[150px] mix-blend-screen pointer-events-none"></div>

      {/* Header */}
      <header className="px-10 py-6 border-b border-white/5 flex items-center justify-between bg-black/20 backdrop-blur-md relative z-10">
        <div className="flex items-center gap-6">
          {league.brandingLogoUrl ? (
            <Image src={league.brandingLogoUrl} alt="Logo" width={80} height={80} className="rounded-2xl drop-shadow-2xl border border-white/10" />
          ) : (
            <Image src="/assets/logo.png" alt="Logo" width={80} height={80} className="drop-shadow-2xl" />
          )}
          <div>
            <h1 className="text-4xl font-black text-white uppercase tracking-wider">{league.name}</h1>
            <p className="text-emerald-400 font-bold uppercase tracking-widest text-sm">POLLA MATCH</p>
          </div>
        </div>

        <div className="flex items-center gap-8 bg-black/40 px-8 py-4 rounded-3xl border border-white/10">
          <div className="text-center">
            <div className="text-white/50 text-sm font-bold uppercase tracking-widest mb-1">{activeMatch.homeTeam}</div>
            <div className="text-5xl font-black text-white">{activeMatch.homeScore ?? '-'}</div>
          </div>
          
          <div className="flex flex-col items-center justify-center px-4">
            <span className="text-white/30 text-xl font-bold mb-2">VS</span>
            {isLive ? (
              <div className="bg-red-500/20 border border-red-500 text-red-500 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                {activeMatch.minute ? `${activeMatch.minute}'` : 'EN VIVO'}
              </div>
            ) : isFinished ? (
              <div className="bg-slate-800 text-slate-400 px-3 py-1 rounded-full text-sm font-bold border border-slate-700">
                FINAL
              </div>
            ) : (
              <div className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-500 px-3 py-1 rounded-full text-sm font-bold">
                POR EMPEZAR
              </div>
            )}
          </div>

          <div className="text-center">
            <div className="text-white/50 text-sm font-bold uppercase tracking-widest mb-1">{activeMatch.awayTeam}</div>
            <div className="text-5xl font-black text-white">{activeMatch.awayScore ?? '-'}</div>
          </div>
        </div>
      </header>

      {/* Main Content - Ranking */}
      <main className="flex-1 p-10 relative z-10 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-black text-white italic uppercase tracking-wider flex items-center gap-3">
            🏆 TABLA DE POSICIONES
          </h2>
          <div className="flex items-center gap-4 text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="font-bold uppercase tracking-widest text-sm">Actualización en tiempo real</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-12 gap-y-4 auto-rows-max overflow-hidden">
          {ranking.length > 0 ? (
            <>
              {ranking.map((player: any, idx: number) => {
                const isTop = player.rank === 1;
                return (
                  <div key={idx} className={`flex items-center justify-between p-4 rounded-2xl relative overflow-hidden transition-all duration-500 ${
                    isTop 
                    ? 'bg-gradient-to-r from-emerald-500/20 to-transparent border-l-4 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.1)]' 
                    : player.sharedPrize
                      ? 'bg-amber-500/10 border-l-4 border-amber-500'
                      : 'bg-white/5 border border-white/5'
                  }`}>
                    <div className="flex items-center gap-4 z-10 relative">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black ${
                        player.rank === 1 ? 'bg-emerald-500 text-slate-900 shadow-[0_0_15px_rgba(16,185,129,0.5)]' :
                        player.rank === 2 ? 'bg-slate-300 text-slate-900' :
                        player.rank === 3 ? 'bg-[#cd7f32] text-white' :
                        'bg-white/10 text-white/50'
                      }`}>
                        {player.rank}
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className={`text-xl font-bold uppercase truncate max-w-[200px] ${isTop ? 'text-emerald-400' : 'text-white'}`}>
                            {player.name}
                          </h3>
                          {player.isJoker && <span className="text-amber-500 text-sm animate-pulse">⭐</span>}
                        </div>
                        <div className="text-white/40 text-sm font-medium uppercase tracking-widest flex items-center gap-2">
                          {league.showTableNumbers && (
                            <span>{player.tableNumber ? `MESA ${player.tableNumber}` : 'SIN MESA'}</span>
                          )}
                          {player.sharedPrize && <span className="text-amber-400 text-xs bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">EMPATE EXACTO</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 z-10 relative">
                      <div className="bg-black/50 px-4 py-2 rounded-xl border border-white/5 hidden xl:block">
                        <span className="text-white/50 text-xs font-bold mr-2 uppercase tracking-widest">PRONÓSTICO</span>
                        <span className="text-xl font-black text-white font-mono">{player.prediction.home}-{player.prediction.away}</span>
                      </div>
                      
                      <div className="text-right w-24">
                        <div className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1">PUNTOS</div>
                        <div className={`text-3xl font-black ${isTop ? 'text-emerald-400' : 'text-white'}`}>
                          {player.points}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              {!hideQR && (
                <div className="fixed bottom-10 right-10 z-50 bg-white p-6 rounded-[32px] shadow-[0_0_50px_rgba(16,185,129,0.4)] flex flex-col items-center animate-in slide-in-from-bottom-10 fade-in duration-700 border-4 border-emerald-500">
                  <p className="text-slate-900 font-black uppercase tracking-widest mb-4 text-center text-xl">¿AÚN NO JUEGAS?</p>
                  <QRCodeSVG value={joinUrl} size={150} level="Q" />
                  <p className="text-emerald-600 font-bold uppercase tracking-wider mt-4 text-sm bg-emerald-50 px-4 py-2 rounded-full">¡ESCANEA Y ÚNETE!</p>
                </div>
              )}
            </>
          ) : (
            <div className="col-span-2 flex flex-col items-center justify-center py-10 text-center animate-in zoom-in fade-in duration-1000">
              <div className="bg-white p-8 rounded-[40px] shadow-[0_0_100px_rgba(16,185,129,0.3)] mb-8 border-8 border-emerald-500">
                <QRCodeSVG value={joinUrl} size={300} level="H" />
              </div>
              <h2 className="text-5xl text-white font-black uppercase mb-4 drop-shadow-lg">¡ESCANEA PARA INGRESAR!</h2>
              <p className="text-3xl text-emerald-400 font-bold italic">Sé el primero en predecir</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
