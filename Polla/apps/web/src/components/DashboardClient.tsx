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
import { SocialWallWidget } from './SocialWallWidget';

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
import { PendingInviteBanner } from '@/components/dashboard/PendingInviteBanner';
import { PaymentLockOverlay } from '@/components/dashboard/PaymentLockOverlay';
import PaymentStatusCard from '@/components/dashboard/PaymentStatusCard';
import { EnterpriseRankingTable } from '@/modules/enterprise-league/components/EnterpriseRankingTable';

import { useMatches } from '@/hooks/useMatches';
import { useCurrentLeague } from '@/hooks/useCurrentLeague';
import { useKnockoutPhases } from '@/hooks/useKnockoutPhases';

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
  initialTab?: 'home' | 'game' | 'leagues' | 'ranking' | 'bracket' | 'bonus' | 'muro';
}

const getPlanLevel = (type?: string) => {
  if (!type) return 1;
  const t = type.toUpperCase();
  if (t.includes('DIAMOND') || t.includes('DIAMANTE')) return 5;
  if (t.includes('PLATINUM') || t.includes('PLATINO')) return 4;
  if (t.includes('BUSINESS_CORP')) return 4;
  if (t.includes('GOLD') || t.includes('ORO')) return 3;
  if (t.includes('SILVER') || t.includes('PLATA')) return 2;
  if (t.includes('BUSINESS_GROWTH')) return 2;
  return 1;
};

export const DashboardClient: React.FC<DashboardClientProps> = (props) => {

  // ... (other imports)

  // Inside DashboardClient component:

  const { user, selectedLeagueId, setSelectedLeague, syncUserFromServer } = useAppStore();
  const { predictions } = useMyPredictions(selectedLeagueId === 'global' ? undefined : selectedLeagueId);

  const [simulatorPhase, setSimulatorPhase] = useState<'groups' | 'knockout'>('groups');

  const [activeTab, setActiveTab] = useState<'home' | 'game' | 'leagues' | 'ranking' | 'bracket' | 'bonus' | 'muro'>(
    props.initialTab || 'home'
  );
  const [leaguesTab, setLeaguesTab] = useState<'social' | 'enterprise'>('social');
  const [pendingInvite, setPendingInvite] = useState<string | null>(null);

  // Custom Hooks
  const { currentLeague, participants, isEnterpriseMode, isWallEnabled } = useCurrentLeague(selectedLeagueId, activeTab);
  const { matches, matchesData, loading: isLoadingMatchesSWR, isRefreshing, handleManualRefresh } = useMatches(predictions);
  const { refetch: refetchPhases } = useKnockoutPhases();

  const handleFullRefresh = async () => {
    // Refresh both matches and tournament phases
    await Promise.all([
      handleManualRefresh(),
      refetchPhases()
    ]);
  };

  // Data Fetching
  const { data: latestTransaction } = useSWR(user ? '/transactions/my-latest?scope=account' : null, async (url) => {
    try {
      const res = await api.get(url);
      return res.data;
    } catch (e) {
      return null;
    }
  });

  // Initialization Effects
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

  // Invite Logic
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

  // Tab Guard Effect
  useEffect(() => {
    if (activeTab === 'muro' && (selectedLeagueId === 'global' || !isWallEnabled)) {
      setActiveTab('home');
    }
  }, [activeTab, selectedLeagueId, isWallEnabled]);

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
          <PendingInviteBanner
            inviteCode={pendingInvite}
            onDiscard={handleDiscardInvite}
            onProcess={handleProcessInvite}
          />
        )}

        {/* ESTATUS DE PAGO (NUEVO) */}
        {user && !isEnterpriseMode && currentLeague && !currentLeague.isPaid && (
          <PaymentStatusCard
            user={user}
            pendingTransaction={latestTransaction}
          />
        )}

        {/* BLOQUEO DE PAGO PENDIENTE (Payment Lock) */}
        {currentLeague && currentLeague.isPaid === false && !currentLeague.isEnterpriseActive && selectedLeagueId !== 'global' && (
          <PaymentLockOverlay
            leagueName={currentLeague.name}
            leagueId={currentLeague.id}
            amount={
              // Map packageType to price
              (() => {
                const type = currentLeague.packageType?.toLowerCase();
                // Social Plans
                if (type === 'parche' || type === 'amateur') return 30000;
                if (type === 'amigos' || type === 'semi-pro') return 80000;
                if (type === 'lider' || type === 'pro') return 180000;
                if (type === 'influencer' || type === 'elite') return 350000;

                // Enterprise Plans
                if (type === 'enterprise_bronze' || type === 'bronze') return 100000;
                if (type === 'enterprise_silver' || type === 'silver') return 175000;
                if (type === 'enterprise_gold' || type === 'gold') return 450000;
                if (type === 'enterprise_platinum' || type === 'platinum') return 750000;
                if (type === 'enterprise_diamond' || type === 'diamond') return 1000000;

                return 50000; // Default fallback
              })()
            }
          />
        )}

        <main className="flex-1 container mx-auto px-4 pt-4 max-w-md w-full overflow-hidden">

          {/* VISTAS */}
          {/* VISTAS */}
          {activeTab === 'home' && (
            <div className="animate-in fade-in slide-in-from-left-4 duration-300">
              {selectedLeagueId === 'global' ? (
                <GlobalHome
                  userName={user?.nickname || user?.fullName?.split(' ')[0]}
                  onNavigateToLeagues={() => { setLeaguesTab('social'); setActiveTab('leagues'); }}
                  onNavigateToBusiness={() => { setLeaguesTab('enterprise'); setActiveTab('leagues'); }}
                  onNavigateToGames={() => setActiveTab('game')}
                />
              ) : (
                <SocialLeagueHome
                  league={currentLeague}
                  participants={participants}
                  onTabChange={setActiveTab}
                  onNavigateToLeagues={() => { setLeaguesTab('social'); setActiveTab('leagues'); }}
                  onNavigateToBusiness={() => { setLeaguesTab('enterprise'); setActiveTab('leagues'); }}
                />
              )}
            </div>
          )}

          {activeTab === 'leagues' && (
            <LeaguesList initialTab={leaguesTab} />
          )}

          {activeTab === 'ranking' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              {selectedLeagueId === 'global' ? (
                <GlobalRankingTable />
              ) : isEnterpriseMode ? (
                <EnterpriseRankingTable
                  leagueId={selectedLeagueId}
                  enableDepartmentWar={currentLeague?.enableDepartmentWar && getPlanLevel(currentLeague?.packageType) >= 4}
                />
              ) : (
                <SocialRankingTable leagueId={selectedLeagueId} />
              )}
            </div>
          )}

          {activeTab === 'game' && (
            <SocialFixture
              matchesData={matchesData}
              loading={isLoadingMatchesSWR}
              onRefresh={handleFullRefresh}
              isRefreshing={isRefreshing}
              leagueId={selectedLeagueId}
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
                <BonusView leagueId={selectedLeagueId === 'global' ? undefined : selectedLeagueId} />
              </div>
            )
          }

          {
            activeTab === 'muro' && selectedLeagueId !== 'global' && (
              <div className="mt-4 animate-in fade-in slide-in-from-bottom-4 duration-300 custom-scrollbar overflow-y-auto max-h-screen pb-32">
                <SocialWallWidget leagueId={selectedLeagueId} />
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
            showMuroTab={!!(isWallEnabled && (!currentLeague?.isEnterprise || getPlanLevel(currentLeague?.packageType) >= 3))}
          />
        )}


      </div >
    </LeagueThemeProvider>
  );
};
