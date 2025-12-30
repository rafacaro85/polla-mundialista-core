"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import LeagueThemeProvider from './LeagueThemeProvider';
import { PlusIcon, Shield } from 'lucide-react';
import useSWR from 'swr';
import Link from 'next/link';
import { Header } from './ui/Header';
import { GroupStageView } from './GroupStageView';
import { BracketView } from './BracketView';
import { BonusView } from './BonusView';

import { BottomNav } from './BottomNav';

import { LeaguesList } from '@/modules/core-dashboard/components/LeaguesList';
import { GlobalHome } from '@/modules/core-dashboard/components/GlobalHome';
import { GlobalRankingTable } from '@/modules/core-dashboard/components/GlobalRankingTable';
import { SocialLeagueHome } from '@/modules/social-league/components/SocialLeagueHome';
import { SocialRankingTable } from '@/modules/social-league/components/SocialRankingTable';
import { SocialFixture } from '@/modules/social-league/components/SocialFixture';
import { useMyPredictions } from '@/shared/hooks/useMyPredictions';
import { toast } from 'sonner';
import { getTeamFlagUrl } from '@/shared/utils/flags';

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

// Modular views imported above

interface DashboardClientProps {
  defaultLeagueId?: string;
  initialTab?: 'home' | 'game' | 'leagues' | 'ranking' | 'bracket' | 'bonus';
}

export const DashboardClient: React.FC<DashboardClientProps> = (props) => {
  const { user, selectedLeagueId, setSelectedLeague, syncUserFromServer } = useAppStore();
  const { predictions } = useMyPredictions();

  const [loadingMatches, setLoadingMatches] = useState(true);
  const [simulatorPhase, setSimulatorPhase] = useState<'groups' | 'knockout'>('groups');

  // Estado inicial del tab
  const [activeTab, setActiveTab] = useState<'home' | 'game' | 'leagues' | 'ranking' | 'bracket' | 'bonus'>(
    props.initialTab || 'home'
  );


  const [currentLeague, setCurrentLeague] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]); // Para el Home

  const [pendingInvite, setPendingInvite] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Inicialización desde Props
  useEffect(() => {
    if (props.defaultLeagueId) {
      setSelectedLeague(props.defaultLeagueId);
    } else {
      setSelectedLeague('global');
    }
    if (props.initialTab) {
      setActiveTab(props.initialTab);
    }
  }, [props.defaultLeagueId, props.initialTab, setSelectedLeague]);

  // Fetch Participantes para Home
  useEffect(() => {
    const fetchParticipants = async () => {
      if (activeTab === 'home' && selectedLeagueId && selectedLeagueId !== 'global') {
        try {
          const { data } = await api.get(`/leagues/${selectedLeagueId}/ranking`);
          const mapped = Array.isArray(data) ? data.map((item: any, index: number) => ({
            id: item.id || item.user?.id,
            nickname: item.nickname || item.user?.nickname || 'Anónimo',
            avatarUrl: item.avatarUrl || item.user?.avatarUrl,
            points: item.totalPoints !== undefined ? item.totalPoints : item.points,
            rank: index + 1
          })) : [];
          setParticipants(mapped);
        } catch (error) {
          console.error("Error fetching participants for home", error);
        }
      }
    };
    fetchParticipants();
  }, [activeTab, selectedLeagueId]);


  // SWR Fetcher
  const fetcher = (url: string) => api.get(url).then(res => res.data);

  // SWR Hooks
  const { data: matchesData, mutate: mutateMatches, isLoading: isLoadingMatchesSWR } = useSWR('/matches/live', fetcher, {
    refreshInterval: 60000, // 1 minuto
    revalidateOnFocus: true,
    revalidateIfStale: false, // Optimización solicitada
  });

  // Calculate Merged Matches for Bracket/Home
  const matches = useMemo(() => {
    if (!matchesData) return [];
    return matchesData.map((m: any) => {
      const date = new Date(m.date);
      const monthNames = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
        'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
      const month = monthNames[date.getMonth()];
      const day = date.getDate();
      const dateStr = `${month} ${day}`;
      const displayDate = dateStr;

      const pred = predictions[m.id];



      return {
        ...m,
        dateStr,
        displayDate,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        homeFlag: m.homeFlag || getTeamFlagUrl(m.homeTeam || m.homeTeamPlaceholder),
        awayFlag: m.awayFlag || getTeamFlagUrl(m.awayTeam || m.awayTeamPlaceholder),
        status: m.status === 'COMPLETED' ? 'FINISHED' : m.status,
        scoreH: m.homeScore,
        scoreA: m.awayScore,
        prediction: pred ? {
          homeScore: pred.homeScore,
          awayScore: pred.awayScore,
          points: pred.points || 0
        } : undefined,
        userH: pred?.homeScore?.toString() || '',
        userA: pred?.awayScore?.toString() || '',
        points: pred?.points || 0
      };
    });
  }, [matchesData, predictions]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    // Truco UX: Animación mínima de 2 segundos
    const minWait = new Promise(resolve => setTimeout(resolve, 2000));
    const refreshPromise = mutateMatches();
    await Promise.all([minWait, refreshPromise]);
    setIsRefreshing(false);
    toast.success('Marcadores actualizados');
  };

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

  const isEnterpriseMode = currentLeague && (currentLeague.type === 'COMPANY' || currentLeague.isEnterprise);

  // Legacy Load Data Effect removed (replaced by SWR)
  // Mantener solo syncUserFromServer si es necesario para auth
  useEffect(() => {
    // Wrap in void to prevent returning a Promise to useEffect (which React attempts to use as cleanup)
    void syncUserFromServer();
  }, [syncUserFromServer]);



  return (
    <LeagueThemeProvider
      primaryColor={currentLeague?.brandColorPrimary}
      secondaryColor={currentLeague?.brandColorSecondary}
    >
      <div
        className="min-h-screen bg-[#0F172A] text-white flex flex-col font-sans relative pb-24 overflow-x-hidden w-full"
      >
        {!isEnterpriseMode && (
          <Header
            userName={user?.nickname || 'Invitado'}
            leagueName={selectedLeagueId !== 'global' ? currentLeague?.name : undefined}
          />
        )}

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
        {currentLeague && currentLeague.isPaid === false && !currentLeague.isEnterprise && !currentLeague.isEnterpriseActive && selectedLeagueId !== 'global' && (
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
          {/* VISTAS */}
          {activeTab === 'home' && (
            <div className="animate-in fade-in slide-in-from-left-4 duration-300">
              {selectedLeagueId === 'global' ? (
                <GlobalHome
                  userName={user?.nickname || user?.fullName?.split(' ')[0]}
                  onNavigateToLeagues={() => setActiveTab('leagues')}
                  onNavigateToGames={() => setActiveTab('game')}
                />
              ) : (
                <SocialLeagueHome
                  league={currentLeague}
                  participants={participants}
                  onTabChange={setActiveTab}
                />
              )}
            </div>
          )}

          {activeTab === 'leagues' && (
            <LeaguesList />
          )}

          {activeTab === 'ranking' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              {selectedLeagueId === 'global' ? (
                <GlobalRankingTable />
              ) : (
                <SocialRankingTable leagueId={selectedLeagueId} />
              )}
            </div>
          )}

          {activeTab === 'game' && (
            <SocialFixture
              matchesData={matchesData}
              loading={isLoadingMatchesSWR}
              onRefresh={handleManualRefresh}
              isRefreshing={isRefreshing}
            />
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
                      matches={matches.map((m: any) => ({
                        ...m,
                        homeTeam: typeof m.homeTeam === 'object' ? (m.homeTeam as any).code : m.homeTeam,
                        awayTeam: typeof m.awayTeam === 'object' ? (m.awayTeam as any).code : m.awayTeam,
                        homeFlag: typeof m.homeTeam === 'object' ? (m.homeTeam as any).flag : m.homeFlag,
                        awayFlag: typeof m.awayTeam === 'object' ? (m.awayTeam as any).flag : m.awayFlag,
                        homeTeamPlaceholder: m.homeTeamPlaceholder,
                        awayTeamPlaceholder: m.awayTeamPlaceholder,
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

        {!isEnterpriseMode && activeTab === 'leagues' && (
          <div className="fixed bottom-24 right-6 z-40">
            <Button className="rounded-full p-4 shadow-lg bg-[var(--brand-primary,#00E676)] text-[#0F172A] hover:bg-white transition-transform hover:scale-110" size="icon" asChild>
              <Link href="/leagues/join">
                <PlusIcon className="h-6 w-6" /><span className="sr-only">Unirse a Liga</span>
              </Link>
            </Button>
          </div>
        )}

        {!isEnterpriseMode && (
          <BottomNav
            activeTab={activeTab}
            onTabChange={setActiveTab}
            showLeaguesTab={!selectedLeagueId || selectedLeagueId === 'global'}
          />
        )}


      </div >
    </LeagueThemeProvider>
  );
};
