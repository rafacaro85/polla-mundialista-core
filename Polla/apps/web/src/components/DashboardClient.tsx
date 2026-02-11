"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import LeagueThemeProvider from './LeagueThemeProvider';
import { PlusIcon, Shield, Trophy } from 'lucide-react';
import useSWR from 'swr';
import Link from 'next/link';
import { Header } from './ui/Header';
import { GroupStageView } from './GroupStageView';
import { BracketView } from './BracketView';
import { BonusView } from './BonusView';
import { SocialWallWidget } from './SocialWallWidget';
import { PromoBanner } from '@/components/PromoBanner';
import PrizeCard from '@/components/PrizeCard';

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
import { useLeagues } from '@/hooks/useLeagues';
import { useTournament } from '@/hooks/useTournament';

import { PredictionsView } from './dashboard/views/PredictionsView';
import { RankingView } from './dashboard/views/RankingView';
import { OnboardingMissions } from './dashboard/home/OnboardingMissions';

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
  initialTab?: 'home' | 'leagues' | 'predictions' | 'ranking' | 'bonus';
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

  const { tournamentId, isReady } = useTournament();
  const { user, selectedLeagueId, setSelectedLeague, syncUserFromServer } = useAppStore();
  const { predictions } = useMyPredictions(selectedLeagueId === 'global' ? undefined : selectedLeagueId);

  // New Navigation State (5 Tabs)
  const [activeTab, setActiveTab] = useState<'home' | 'leagues' | 'predictions' | 'ranking' | 'bonus'>(
    props.initialTab || 'home'
  );

  const [mounted, setMounted] = useState(false);
  
  const [leaguesTab, setLeaguesTab] = useState<'social' | 'enterprise'>('social');
  const [pendingInvite, setPendingInvite] = useState<string | null>(null);

  // Custom Hooks
  const { currentLeague, participants, isEnterpriseMode, isWallEnabled } = useCurrentLeague(selectedLeagueId, activeTab);
  const { matches, matchesData, loading: isLoadingMatchesSWR, isRefreshing, handleManualRefresh } = useMatches(predictions);
  const { refetch: refetchPhases } = useKnockoutPhases();
  
  // Implement useLeagues to determine smart onboarding state
  const { leagues, loading: loadingLeagues } = useLeagues();
  const hasLeagues = leagues && leagues.length > 0;

  const handleFullRefresh = async () => {
    // Refresh both matches and tournament phases
    await Promise.all([
      handleManualRefresh(),
      refetchPhases()
    ]);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

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

    // NUCLEAR OPTION: Unregister all service workers to clear broken cache
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
            for(let registration of registrations) {
                console.log('💀 Killing Zombie Service Worker:', registration);
                registration.unregister();
            }
        });
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

  // Legacy Load Data Effect removed (replaced by SWR)
  // Mantener solo syncUserFromServer si es necesario para auth
  useEffect(() => {
    // Wrap in void to prevent returning a Promise to useEffect (which React attempts to use as cleanup)
    void syncUserFromServer();
  }, [syncUserFromServer]);


  // PREVENT FLASH: Wait for tournament context to stabilize
  if (!mounted || !isReady) {
      return (
          <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00E676]"></div>
          </div>
      );
  }

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
          
          {/* 1. HOME (ONBOARDING + LAYOUT) */}
          {activeTab === 'home' && (
            <div className="animate-in fade-in slide-in-from-left-4 duration-300 flex flex-col gap-6 pb-20">
                {/* A. HEADER (Reuse Header Logic or Global/Social headers without the lower parts if needed, but for now rendering existing headers at top) */}
                {selectedLeagueId === 'global' ? (
                     <div className="text-center py-2 animate-in fade-in slide-in-from-top-4">
                        <h1 className="text-3xl font-russo text-white mb-2">
                            HOLA, <span className="text-[var(--brand-primary,#00E676)]">{user?.nickname?.toUpperCase() || 'CRACK'}</span>
                        </h1>
                          <p className="text-slate-400 text-sm max-w-xs mx-auto">
                            {tournamentId === 'UCL2526' 
                               ? 'Bienvenido a la Polla Champions 2025-26. ¡Predice, compite y diviértete!'
                               : 'Bienvenido a la Polla Mundialista 2026. ¡Predice, compite y gana grandes premios!'}
                        </p>
                    </div>
                ) : (
                     <div className="flex flex-col gap-1 pt-2 text-center">
                        <p className="text-[#00E676] text-xs font-black uppercase tracking-[0.3em] animate-in fade-in slide-in-from-top-2">
                            ¡HOLA, {user?.nickname?.toUpperCase() || 'JUGADOR'}!
                        </p>
                        <h1 className="text-2xl font-black text-white uppercase tracking-tight leading-none italic">
                            BIENVENIDO A LA <span className="text-[#00E676]">POLLA</span> <br />
                            {currentLeague?.name.toUpperCase()}
                        </h1>
                         {/* Social League Hero Image */}
                         <div className="relative w-full min-h-[10rem] bg-gradient-to-br from-slate-900 to-[#1e293b] border border-white/5 flex flex-col items-center justify-center p-4 gap-2 overflow-hidden rounded-3xl shadow-lg text-center mt-4">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                             {currentLeague?.brandingLogoUrl ? (
                                <img
                                    src={currentLeague.brandingLogoUrl}
                                    alt={currentLeague.name}
                                    className="w-20 h-20 object-contain mx-auto z-10"
                                />
                             ) : (
                                <Shield className="w-12 h-12 text-[#00E676] mx-auto z-10" />
                             )}
                        </div>
                    </div>
                )}
                
                {/* B. ONBOARDING MISSIONS (ACCORDION) */}
                <OnboardingMissions hasLeagues={hasLeagues} onNavigate={setActiveTab} currentLeague={currentLeague} />
                
                {/* C. ENTERPRISE BANNERS / ADS (Strategic Placement) */}
                {currentLeague?.showAds && isEnterpriseMode && currentLeague?.adImages && currentLeague.adImages.length > 0 && (
                     <div className="w-full animate-in fade-in zoom-in duration-700">
                        <div className="w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative group">
                            <div className="absolute top-2 right-2 bg-black/60 text-white text-[9px] px-2 py-0.5 rounded uppercase font-bold tracking-widest backdrop-blur-sm z-10">
                                Publicidad
                            </div>
                            <img 
                                src={currentLeague.adImages[0]} 
                                alt="Publicidad" 
                                className="w-full h-auto object-cover"
                            />
                        </div>
                    </div>
                )}
                
               {/* D. SOCIAL WALL WIDGET (If Enabled) */}
               {isWallEnabled && (!currentLeague?.isEnterprise || getPlanLevel(currentLeague?.packageType) >= 3) && (
                   <div className="mt-2">
                       <h3 className="text-white font-bold mb-2 ml-1 text-sm flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00E676]"></span>
                            Muro de la Afición
                       </h3>
                        <SocialWallWidget leagueId={selectedLeagueId === 'global' ? 'global' : currentLeague?.id} />
                   </div>
               )}
               
               {/* E. PRIZE CARD & PROMO */}
               <div className="mt-4">
                   {selectedLeagueId === 'global' ? (
                       // Hide prize card on Champions tournament (beta)
                       tournamentId !== 'UCL2526' && (
                           <PrizeCard 
                               description="Participa en la polla global y gana increíbles recompensas." 
                               imageUrl="/images/wc2026_hero.png"
                           />
                       )
                   ) : (
                       (currentLeague?.prizeImageUrl || currentLeague?.prizeDetails) && (
                           <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <Trophy size={16} className="text-[#00E676]" />
                                    <h3 className="text-white text-xs font-black uppercase tracking-widest italic">Premio Mayor</h3>
                                </div>
                                <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-4 flex flex-col gap-2">
                                     {currentLeague.prizeImageUrl && <img src={currentLeague.prizeImageUrl} className="w-full h-32 object-cover rounded-lg" alt="Premio" />}
                                     <p className="text-sm font-bold">{currentLeague.prizeDetails}</p>
                                </div>
                           </div>
                       )
                   )}
               </div>
               
               {!isEnterpriseMode && (
                   <PromoBanner
                        onActionSocial={() => { setLeaguesTab('social'); setActiveTab('leagues'); }}
                        onActionEnterprise={() => { setLeaguesTab('enterprise'); setActiveTab('leagues'); }}
                   />
               )}
            </div>
          )}

          {activeTab === 'leagues' && (
            <LeaguesList initialTab={leaguesTab} />
          )}

          {/* 3. PREDICTIONS (Unified View) */}
          {activeTab === 'predictions' && (
             <PredictionsView 
                matchesData={matchesData}
                matches={matches}
                isLoadingMatches={isLoadingMatchesSWR}
                onRefresh={handleFullRefresh}
                isRefreshing={isRefreshing}
                leagueId={selectedLeagueId}
             />
          )}

          {/* 4. RANKING (Unified View) */}
          {activeTab === 'ranking' && (
             <RankingView 
                leagueId={selectedLeagueId}
                isEnterpriseMode={isEnterpriseMode}
                currentLeague={currentLeague}
                matches={matches}
                tournamentId={tournamentId}
             />
          )}

          {/* 5. BONUS */}
          {activeTab === 'bonus' && (
              <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <BonusView leagueId={selectedLeagueId === 'global' ? undefined : selectedLeagueId} />
              </div>
          )}
          
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
