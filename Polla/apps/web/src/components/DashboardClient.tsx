"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import LeagueThemeProvider from './LeagueThemeProvider';
import { PlusIcon, Shield } from 'lucide-react';
import Link from 'next/link';
import { Header } from './ui/Header';
import DateFilter from './DateFilter';
import MatchCard from './MatchCard';
import PrizeCard from './PrizeCard';
import { GroupStageView } from './GroupStageView';
import { BracketView } from './BracketView';
import { BonusView } from './BonusView';
import MatchInfoSheet from './MatchInfoSheet';
import { BottomNav } from './BottomNav';
import { PhaseProgressDashboard } from './PhaseProgressDashboard';

import { LeaguesView } from './LeaguesView';
import { RankingView } from './RankingView';
import { toast } from 'sonner';
import { AiSuggestionsButton } from './AiSuggestionsButton';

interface Match {
  id: string;
  homeTeam: string;
  homeFlag: string;
  awayTeam: string;
  awayFlag: string;
  dateStr: string;
  displayDate: string;
  status: 'SCHEDULED' | 'FINISHED' | 'LIVE';
  date: string;
  homeScore?: number | null;
  awayScore?: number | null;
  userPrediction?: Prediction;
  phase?: string;
  group?: string;
  homeTeamPlaceholder?: string;
  awayTeamPlaceholder?: string;
  // Propiedades opcionales para manejo de estado local y respuesta de API
  userH?: string;
  userA?: string;
  prediction?: Prediction | any; // Any temporal para flexibilidad con la respuesta del backend
  isJoker?: boolean;
}

interface Prediction {
  homeScorePrediction?: number | null;
  awayScorePrediction?: number | null;
  pointsEarned?: number | null;
  homeScore?: number | null;
  awayScore?: number | null;
}

const getFlag = (teamName: string) => {
  const flags: { [key: string]: string } = {
    'Colombia': 'https://flagcdn.com/h80/co.png',
    'Argentina': 'https://flagcdn.com/h80/ar.png',
    'Brasil': 'https://flagcdn.com/h80/br.png',
    'Francia': 'https://flagcdn.com/h80/fr.png',
    'España': 'https://flagcdn.com/h80/es.png',
    'Alemania': 'https://flagcdn.com/h80/de.png',
    'USA': 'https://flagcdn.com/h80/us.png',
    'México': 'https://flagcdn.com/h80/mx.png',
    'Inglaterra': 'https://flagcdn.com/h80/gb-eng.png',
    'Italia': 'https://flagcdn.com/h80/it.png',
    'Portugal': 'https://flagcdn.com/h80/pt.png',
    'Uruguay': 'https://flagcdn.com/h80/uy.png',
  };
  return flags[teamName] || 'https://flagcdn.com/h80/un.png';
};

export const DashboardClient: React.FC = () => {
  const { user, selectedLeagueId, syncUserFromServer } = useAppStore();

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [matches, setMatches] = useState<Match[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [simulatorPhase, setSimulatorPhase] = useState<'groups' | 'knockout'>('groups');
  const [infoMatch, setInfoMatch] = useState<Match | null>(null);
  const [activeTab, setActiveTab] = useState<'game' | 'leagues' | 'ranking' | 'bracket' | 'bonus'>('game');
  const [currentLeague, setCurrentLeague] = useState<any>(null);

  const [pendingInvite, setPendingInvite] = useState<string | null>(null);

  useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    const cookieCode = getCookie('pendingInviteCode');
    const localCode = localStorage.getItem('pendingInviteCode');
    const code = cookieCode || localCode;

    if (code) setPendingInvite(code);
  }, []);

  const handleProcessInvite = () => {
    if (pendingInvite) {
      localStorage.removeItem('pendingInviteCode');
      document.cookie = "pendingInviteCode=; path=/; max-age=0";
      window.location.href = `/invite/${pendingInvite}`;
    }
  };

  const handleDiscardInvite = () => {
    localStorage.removeItem('pendingInviteCode');
    document.cookie = "pendingInviteCode=; path=/; max-age=0";
    setPendingInvite(null);
  };

  useEffect(() => {
    const fetchCurrentLeague = async () => {
      if (selectedLeagueId && selectedLeagueId !== 'global') {
        try {
          const { data } = await api.get(`/leagues/${selectedLeagueId}/metadata`);
          console.log('🔍 [DashboardClient] League Metadata Received:', data.league);
          console.log('   -> isPaid:', data.league?.isPaid);
          console.log('   -> isPaid type:', typeof data.league?.isPaid);
          setCurrentLeague(data.league);
        } catch (error) {
          console.error('Error fetching league metadata', error);
          setCurrentLeague(null);
        }
      } else {
        setCurrentLeague(null);
      }
    };
    fetchCurrentLeague();
  }, [selectedLeagueId]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingMatches(true);
        await syncUserFromServer();

        const [matchesRes, predictionsRes] = await Promise.all([
          api.get('/matches'),
          api.get('/predictions/me')
        ]);

        const matchesData = matchesRes.data;
        const predictionsData = predictionsRes.data;

        const processedMatches = matchesData.map((m: any) => {
          const date = new Date(m.date);

          const monthNames = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
            'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
          const month = monthNames[date.getMonth()];
          const day = date.getDate();
          const dateStr = `${month} ${day}`;
          const displayDate = dateStr;

          const userPrediction = predictionsData.find((p: any) => p.match.id === m.id);

          return {
            ...m,
            dateStr,
            displayDate,
            homeTeam: { code: m.homeTeam || 'LOC', flag: m.homeFlag || getFlag(m.homeTeam) },
            awayTeam: { code: m.awayTeam || 'VIS', flag: m.awayFlag || getFlag(m.awayTeam) },
            status: m.status === 'COMPLETED' ? 'FINISHED' : m.status,
            scoreH: m.homeScore,
            scoreA: m.awayScore,
            prediction: userPrediction ? {
              homeScore: userPrediction.homeScore,
              awayScore: userPrediction.awayScore,
              points: userPrediction.points || 0
            } : undefined,
            userH: userPrediction?.homeScore?.toString() || '',
            userA: userPrediction?.awayScore?.toString() || '',
            points: userPrediction?.points || 0
          };
        });

        setMatches(processedMatches);
        const uniqueDates = Array.from(new Set(processedMatches.map((m: any) => m.displayDate)));
        setDates(uniqueDates as string[]);
        if (uniqueDates.length > 0) setSelectedDate(uniqueDates[0] as string);
      } catch (error) {
        console.error('Error cargando datos', error);
      } finally {
        setLoadingMatches(false);
      }
    };
    loadData();
  }, [syncUserFromServer]);

  const filteredMatches = useMemo(() =>
    matches.filter(m => m.displayDate === selectedDate),
    [matches, selectedDate]
  );

  const handlePredictionChange = useCallback(async (matchId: string, homeScore: any, awayScore: any, isJoker?: boolean) => {
    try {
      // CASO BORRAR: Si ambos son null
      if (homeScore === null && awayScore === null) {
        console.log(`🗑️ Eliminando predicción para partido ${matchId}`);
        await api.delete(`/predictions/${matchId}`);
        // ... (resto igual)

        setMatches(prevMatches =>
          prevMatches.map(m =>
            m.id === matchId
              ? {
                ...m,
                prediction: null,
                userH: undefined,
                userA: undefined
              }
              : m
          )
        );
        return;
      }

      // CASO GUARDAR:
      console.log(`💾 Guardando predicción para partido ${matchId}: ${homeScore} - ${awayScore} Joker:${isJoker}`);

      await api.post('/predictions', {
        matchId,
        homeScore: parseInt(homeScore),
        awayScore: parseInt(awayScore),
        leagueId: selectedLeagueId !== 'global' ? selectedLeagueId : undefined,
        isJoker // Pasamos isJoker al backend
      });

      // ... (feedbacks)

      setMatches(prevMatches =>
        prevMatches.map(m => {
          if (m.id === matchId) {
            const newPred = {
              homeScore: parseInt(homeScore),
              awayScore: parseInt(awayScore),
              points: 0,
              isJoker: isJoker // Actualizamos localmente
            };
            return {
              ...m,
              prediction: newPred,
              userH: homeScore.toString(),
              userA: awayScore.toString()
            };
          }
          // Si activó joker, desactivar en otros partidos de la misma fase (si tuviéramos fase aqui)
          // Como no tengo fase fácil, confiaré en el refresh o en la respuesta del backend.
          // Idealmente recargar data, pero por performance solo actualizamos este.
          // SI es joker=true, podriamos recorrer y poner false a otros.
          if (isJoker && m.phase === (prevMatches.find(pm => pm.id === matchId)?.phase)) {
            if (m.prediction && m.prediction.isJoker) {
              return { ...m, prediction: { ...m.prediction, isJoker: false } };
            }
          }
          return m;
        })
      );
    } catch (error) {
      // ...
    }
  }, [selectedLeagueId]);

  const handleAiPredictions = (predictions: { [matchId: string]: [number, number] }) => {
    setMatches(prevMatches => prevMatches.map(match => {
      // Si ya tiene predicción (guardada o en estado local), no sobrescribir
      const hasPrediction = (match.prediction?.homeScore != null && match.prediction?.awayScore != null) ||
        (match.userH && match.userH !== '') ||
        (match.userA && match.userA !== '');

      if (hasPrediction) return match;

      if (predictions[match.id]) {
        const [homeScore, awayScore] = predictions[match.id];
        return {
          ...match,
          userH: homeScore.toString(),
          userA: awayScore.toString()
        };
      }
      return match;
    }));
  };

  const handleClearPredictions = () => {
    setMatches(prevMatches => prevMatches.map(match => {
      // Solo limpiar si NO hay predicción guardada en BD
      const savedPrediction = match.prediction?.homeScore != null && match.prediction?.awayScore != null;

      if (!savedPrediction) {
        return {
          ...match,
          userH: '',
          userA: ''
        };
      }
      return match;
    }));
    toast.info('Se han limpiado las sugerencias no guardadas.');
  };

  const handleSaveAiPredictions = async () => {
    // Filtrar partidos que tienen predicción local pero no guardada en BD
    const predictionsToSave = matches.filter(m => {
      const hasLocalPrediction = m.userH && m.userH !== '' && m.userA && m.userA !== '';
      const isSaved = m.prediction && m.prediction.homeScore != null && m.prediction.awayScore != null;
      return hasLocalPrediction && !isSaved;
    });

    if (predictionsToSave.length === 0) {
      toast.info('No hay nuevas predicciones para guardar.');
      return;
    }

    try {
      const promises = predictionsToSave.map(m =>
        api.post('/predictions', {
          matchId: m.id,
          homeScore: parseInt(m.userH!),
          awayScore: parseInt(m.userA!),
          leagueId: selectedLeagueId !== 'global' ? selectedLeagueId : undefined
        }).then(() => {
          setMatches(prev => prev.map(pm => {
            if (pm.id === m.id) {
              return {
                ...pm,
                prediction: {
                  ...pm.prediction,
                  homeScore: parseInt(m.userH!),
                  awayScore: parseInt(m.userA!)
                }
              };
            }
            return pm;
          }));
        })
      );

      await Promise.all(promises);
      toast.success(`Guardadas ${predictionsToSave.length} predicciones exitosamente.`);
    } catch (error) {
      console.error('Error guardando predicciones masivas:', error);
      toast.error('Hubo un error al guardar algunas predicciones.');
    }
  };

  return (
    <LeagueThemeProvider
      primaryColor={currentLeague?.brandColorPrimary}
      secondaryColor={currentLeague?.brandColorSecondary}
    >
      <div
        className="min-h-screen bg-[#0F172A] text-white flex flex-col font-sans relative pb-24 overflow-x-hidden w-full"
      >
        <Header userName={user?.nickname || 'Invitado'} />

        {pendingInvite && (
          <div className="bg-indigo-600 text-white p-4 mx-4 mt-4 rounded-xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 z-50 relative">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-full">
                <PlusIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold">Tienes una invitación pendiente</p>
                <p className="text-sm text-indigo-100">Código: {pendingInvite}</p>
              </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button onClick={handleDiscardInvite} variant="ghost" className="flex-1 md:flex-none text-white hover:bg-white/20 hover:text-white">Ignorar</Button>
              <Button onClick={handleProcessInvite} className="flex-1 md:flex-none bg-white text-indigo-700 hover:bg-slate-100 font-bold">Ver Invitación</Button>
            </div>
          </div>
        )}

        {/* BLOQUEO DE PAGO PENDIENTE (Payment Lock) */}
        {currentLeague && currentLeague.isPaid === false && selectedLeagueId !== 'global' && (
          <div className="absolute inset-x-0 bottom-0 top-16 z-50 bg-[#0F172A] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
            <div className="mb-6 p-6 bg-yellow-500/10 rounded-full border border-yellow-500/20 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
              <Shield size={64} className="text-yellow-500" />
            </div>
            <h1 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Activación Pendiente</h1>
            <p className="text-slate-400 max-w-xs mb-8 leading-relaxed text-sm">
              La polla <strong className="text-white">{currentLeague.name}</strong> requiere validación del pago para ser activada.
            </p>

            <div className="bg-[#1E293B] p-6 rounded-2xl border border-white/10 max-w-sm w-full mb-8 text-left shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-500/10 rounded-bl-full"></div>
              <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-sm">👇 Pasos para activar:</h3>
              <ol className="list-decimal list-inside space-y-3 text-slate-300 text-xs">
                <li className="pl-2">Realiza el pago de tu plan.</li>
                <li className="pl-2">Envía el comprobante a soporte.</li>
                <li className="pl-2">Tu liga será activada en breve.</li>
              </ol>
            </div>

            <div className="flex gap-4">
              <Button onClick={() => window.location.href = `https://wa.me/573105973421?text=Hola,%20adjunto%20pago%20para%20activar%20liga%20${currentLeague.name}`} className="bg-green-500 hover:bg-green-600 text-white font-bold">
                Enviar Comprobante
              </Button>
              <Button onClick={() => window.location.reload()} variant="outline" className="border-slate-600 text-slate-400 hover:text-white">
                Recargar
              </Button>
            </div>
          </div>
        )}

        <main className="flex-1 container mx-auto px-4 pt-4 max-w-md w-full overflow-hidden">

          {/* VISTAS */}
          {activeTab === 'leagues' && (
            <LeaguesView />
          )}

          {activeTab === 'ranking' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <RankingView />
            </div>
          )}

          {activeTab === 'game' && (
            <div className="animate-in fade-in slide-in-from-left-4 duration-300">

              {/* Phase Progress */}
              <div className="mb-6">
                <PhaseProgressDashboard />
                <div className="mt-4 flex justify-center">
                  <AiSuggestionsButton
                    matches={matches}
                    onPredictionsGenerated={handleAiPredictions}
                    onClear={handleClearPredictions}
                    onSave={handleSaveAiPredictions}
                  />
                </div>
              </div>

              <div className="mb-4">
                <DateFilter
                  dates={dates}
                  selectedDate={selectedDate}
                  onSelect={setSelectedDate}
                />
              </div>

              <div className="flex flex-col gap-4 pb-4">
                {loadingMatches ? (
                  <div className="text-center py-20 text-slate-400 animate-pulse">Cargando partidos...</div>
                ) : matches.filter(m => m.displayDate === selectedDate).length === 0 ? (
                  <div className="text-center py-10 text-slate-500">No hay partidos para esta fecha</div>
                ) : (
                  matches
                    .filter(m => m.displayDate === selectedDate)
                    .map((match) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        showInputs={true}
                        onSavePrediction={handlePredictionChange}
                        onInfoClick={() => setInfoMatch(match)}
                        isGlobal={selectedLeagueId === 'global'}
                      />
                    ))
                )}
              </div>
            </div >
          )}

          {
            activeTab === 'bracket' && (
              <div className="h-full flex flex-col animate-in fade-in zoom-in-95 duration-300">
                {/* Selector Fase Bracket */}
                <div className="flex mb-4 bg-[#1E293B] p-1 rounded-xl w-full border border-[#334155]">
                  <button
                    onClick={() => setSimulatorPhase('groups')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${simulatorPhase === 'groups' ? 'bg-[var(--brand-primary,#00E676)] text-[#0F172A] shadow-md' : 'text-slate-400 hover:text-white'}`}
                  >
                    Fase de Grupos
                  </button>
                  <button
                    onClick={() => setSimulatorPhase('knockout')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${simulatorPhase === 'knockout' ? 'bg-[var(--brand-primary,#00E676)] text-[#0F172A] shadow-md' : 'text-slate-400 hover:text-white'}`}
                  >
                    Fase Final
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto pb-10 custom-scrollbar">
                  {simulatorPhase === 'groups' ? (
                    <GroupStageView matches={matches} />
                  ) : (
                    <BracketView
                      matches={matches.map(m => ({
                        ...m,
                        homeTeam: typeof m.homeTeam === 'object' ? (m.homeTeam as any).code : m.homeTeam,
                        awayTeam: typeof m.awayTeam === 'object' ? (m.awayTeam as any).code : m.awayTeam,
                        homeFlag: typeof m.homeTeam === 'object' ? (m.homeTeam as any).flag : m.homeFlag,
                        awayFlag: typeof m.awayTeam === 'object' ? (m.awayTeam as any).flag : m.awayFlag,
                      }))}
                      leagueId={selectedLeagueId}
                    />
                  )}
                </div>
              </div>
            )
          }

          {
            activeTab === 'bonus' && (
              <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <BonusView />
              </div>
            )
          }
        </main >

        {activeTab === 'leagues' && (
          <div className="fixed bottom-24 right-6 z-40">
            <Button className="rounded-full p-4 shadow-lg bg-[var(--brand-primary,#00E676)] text-[#0F172A] hover:bg-white transition-transform hover:scale-110" size="icon" asChild>
              <Link href="/leagues/join">
                <PlusIcon className="h-6 w-6" /><span className="sr-only">Unirse a Liga</span>
              </Link>
            </Button>
          </div>
        )}

        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

        <MatchInfoSheet match={infoMatch} onClose={() => setInfoMatch(null)} />
      </div >
    </LeagueThemeProvider>
  );
};
