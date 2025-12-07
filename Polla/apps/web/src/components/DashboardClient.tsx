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
import { LeagueSelector } from './LeagueSelector';
import { LeagueSettings } from './LeagueSettings';
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
      console.error('❌ Error guardando predicción:', error);
      toast.error('❌ Error al guardar', {
        description: 'Inténtalo de nuevo',
        duration: 3000,
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-obsidian text-white pb-24">
      <Header userName={user?.nickname || user?.fullName || 'Viajero'} />
      <main className="mx-auto w-full max-w-7xl flex-1 p-4">


        <div className="w-full">
          {activeTab === 'game' && (
            <div className="mt-4">
              {currentLeague && (currentLeague.prizeImageUrl || currentLeague.prizeDetails) && (
                <div className="mb-6 max-w-md mx-auto">
                  <PrizeCard
                    imageUrl={currentLeague.prizeImageUrl}
                    description={currentLeague.prizeDetails}
                    logoUrl={currentLeague.brandingLogoUrl}
                  />
                </div>
              )}
              <DateFilter dates={dates} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
              <div>
                {loadingMatches ? (
                  <p className="col-span-full text-center text-tactical py-8">Cargando partidos...</p>
                ) : filteredMatches && filteredMatches.length > 0 ? (
                  filteredMatches.map((match) => (
                    <MatchCard key={match.id} match={match} onOpenInfo={() => setInfoMatch(match)} onSavePrediction={handlePredictionChange} />
                  ))
                ) : (
                  <p className="col-span-full text-center text-tactical py-8">No hay partidos para esta fecha.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'leagues' && (
            <LeaguesView />
          )}

          {activeTab === 'ranking' && (
            <RankingView />
          )}

          {activeTab === 'bracket' && (
            <div>
              <div className="mb-4">
                <h3 className="text-xl font-bold font-russo text-signal mb-2">Simulador del Torneo</h3>
                <p className="text-tactical text-sm mb-4">Visualiza el camino a la copa.</p>
                {/* --- TOGGLE SWITCH MEJORADO --- */}
                <div className="flex bg-[#1E293B] p-1 rounded-full border border-slate-700 w-full max-w-sm mx-auto mb-6 shadow-lg relative">

                  {/* Botón Fase de Grupos */}
                  <button
                    onClick={() => setSimulatorPhase('groups')}
                    className={`
      flex-1 py-3 px-4 rounded-full text-xs font-black tracking-widest transition-all duration-300 relative z-10
      ${simulatorPhase === 'groups'
                        ? 'bg-[#00E676] text-[#0F172A] shadow-[0_0_15px_rgba(0,230,118,0.4)] scale-105'
                        : 'text-[#94A3B8] hover:text-white'
                      }
    `}
                  >
                    FASE DE GRUPOS
                  </button>

                  {/* Botón Fase Final */}
                  <button
                    onClick={() => setSimulatorPhase('knockout')}
                    className={`
      flex-1 py-3 px-4 rounded-full text-xs font-black tracking-widest transition-all duration-300 relative z-10
      ${simulatorPhase === 'knockout'
                        ? 'bg-[#00E676] text-[#0F172A] shadow-[0_0_15px_rgba(0,230,118,0.4)] scale-105'
                        : 'text-[#94A3B8] hover:text-white'
                      }
    `}
                  >
                    FASE FINAL
                  </button>

                </div>
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
            <div className="mt-6">
              <BonusView />
            </div>
          )}
        </div>

        <div className="fixed bottom-24 right-6 z-40">
          <Button className="rounded-full p-4 shadow-lg bg-signal text-obsidian hover:bg-white" size="icon" asChild>
            <Link href="/leagues/join">
              <PlusIcon className="h-6 w-6" /><span className="sr-only">Unirse a Liga</span>
            </Link>
          </Button>
        </div>
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      <MatchInfoSheet match={infoMatch} onClose={() => setInfoMatch(null)} />
    </div>
  );
};
