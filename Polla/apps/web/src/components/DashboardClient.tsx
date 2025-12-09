"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';
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

import { LeaguesView } from './LeaguesView';
import { RankingView } from './RankingView';
import { toast } from 'sonner';

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

  useEffect(() => {
    const fetchCurrentLeague = async () => {
      if (selectedLeagueId && selectedLeagueId !== 'global') {
        try {
          const { data } = await api.get(`/leagues/${selectedLeagueId}/metadata`);
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

  const handlePredictionChange = useCallback(async (matchId: string, homeScore: any, awayScore: any) => {
    try {
      // CASO BORRAR: Si ambos son null (enviado desde MatchCard cuando están vacíos)
      if (homeScore === null && awayScore === null) {
        console.log(`🗑️ Eliminando predicción para partido ${matchId}`);
        await api.delete(`/predictions/${matchId}`);

        toast.success('🗑️ Predicción eliminada');

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
      console.log(`💾 Guardando predicción para partido ${matchId}: ${homeScore} - ${awayScore}`);

      await api.post('/predictions', {
        matchId,
        homeScore: parseInt(homeScore),
        awayScore: parseInt(awayScore),
        leagueId: selectedLeagueId !== 'global' ? selectedLeagueId : undefined
      });

      console.log(`✅ Predicción guardada exitosamente`);
      toast.success('✅ Guardado con éxito', {
        description: `${homeScore} - ${awayScore}`,
        duration: 2000,
      });

      setMatches(prevMatches =>
        prevMatches.map(m =>
          m.id === matchId
            ? {
              ...m,
              prediction: { homeScore: parseInt(homeScore), awayScore: parseInt(awayScore), points: 0 },
              userH: homeScore.toString(),
              userA: awayScore.toString()
            }
            : m
        )
      );
    } catch (error) {
      console.error('❌ Error gestionando predicción:', error);
      toast.error('❌ Error al guardar/eliminar', {
        description: 'Inténtalo de nuevo',
        duration: 3000,
      });
    }
  }, [selectedLeagueId]);

  // --- SWIPE NAVIGATION LOGIC ---
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;
  const tabs: ('game' | 'leagues' | 'ranking' | 'bracket' | 'bonus')[] = ['game', 'leagues', 'ranking', 'bracket', 'bonus'];

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe || isRightSwipe) {
      const currentIndex = tabs.indexOf(activeTab);
      if (isLeftSwipe) {
        // Swipe Left -> Next Tab
        if (currentIndex < tabs.length - 1) setActiveTab(tabs[currentIndex + 1]);
      } else {
        // Swipe Right -> Prev Tab
        if (currentIndex > 0) setActiveTab(tabs[currentIndex - 1]);
      }
    }
  };

  return (
    <div
      className="min-h-screen bg-[#0F172A] text-white flex flex-col font-sans relative pb-24 overflow-x-hidden w-full touch-pan-y"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <Header userName={user?.nickname || 'Invitado'} />

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
          </div>
        )}

        {activeTab === 'bracket' && (
          <div className="h-full flex flex-col animate-in fade-in zoom-in-95 duration-300">
            {/* Selector Fase Bracket */}
            <div className="flex justify-center mb-6 bg-[#1E293B] p-1 rounded-xl w-fit mx-auto border border-[#334155]">
              <button
                onClick={() => setSimulatorPhase('groups')}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${simulatorPhase === 'groups' ? 'bg-[#00E676] text-[#0F172A] shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                Fase de Grupos
              </button>
              <button
                onClick={() => setSimulatorPhase('knockout')}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${simulatorPhase === 'knockout' ? 'bg-[#00E676] text-[#0F172A] shadow-lg' : 'text-slate-400 hover:text-white'}`}
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
        )}

        {activeTab === 'bonus' && (
          <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <BonusView />
          </div>
        )}
      </main>

      {activeTab === 'leagues' && (
        <div className="fixed bottom-24 right-6 z-40">
          <Button className="rounded-full p-4 shadow-lg bg-[#00E676] text-[#0F172A] hover:bg-white transition-transform hover:scale-110" size="icon" asChild>
            <Link href="/leagues/join">
              <PlusIcon className="h-6 w-6" /><span className="sr-only">Unirse a Liga</span>
            </Link>
          </Button>
        </div>
      )}

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      <MatchInfoSheet match={infoMatch} onClose={() => setInfoMatch(null)} />
    </div>
  );
};
