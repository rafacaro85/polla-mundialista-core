"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useRouter } from 'next/navigation';
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
import { PaymentMethods } from '@/components/dashboard/PaymentMethods';
import PaymentStatusCard from '@/components/dashboard/PaymentStatusCard';
import { EnterpriseRankingTable } from '@/modules/enterprise-league/components/EnterpriseRankingTable';

import { useMatches } from '@/hooks/useMatches';
import { useCurrentLeague } from '@/hooks/useCurrentLeague';
import { useKnockoutPhases } from '@/hooks/useKnockoutPhases';
import { useLeagues } from '@/hooks/useLeagues';
import { useTournament } from '@/hooks/useTournament';

import { PredictionsView } from './dashboard/views/PredictionsView';
import { RankingView } from './dashboard/views/RankingView';
import { SmartLeagueHome } from './dashboard/home/SmartLeagueHome';
import { ErrorBoundary } from '@/components/ErrorBoundary';

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
  const router = useRouter();
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
  const { currentLeague, participants, isEnterpriseMode, isWallEnabled, isLoading: isLeagueLoading } = useCurrentLeague(selectedLeagueId, activeTab);
  // Pass league's tournamentId directly to ensure correct matches are fetched
  // (e.g. UCL2526 for Champions leagues, WC2026 for World Cup)
  const leagueTournamentId = currentLeague?.tournamentId;
  const { matches, matchesData, loading: isLoadingMatchesSWR, isRefreshing, handleManualRefresh } = useMatches(predictions, leagueTournamentId);
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

  const [isSuperAdminMode, setIsSuperAdminMode] = useState(false);
  const [impersonatedUserId, setImpersonatedUserId] = useState<string>('');

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('actAsSuperAdmin') === 'true') {
        setIsSuperAdminMode(true);
        const storedId = sessionStorage.getItem('impersonateUserId');
        if (storedId) setImpersonatedUserId(storedId);
      } else {
        sessionStorage.removeItem('impersonateUserId');
      }
    }
  }, []);

  const handleImpersonateUserChange = (uid: string) => {
    setImpersonatedUserId(uid);
    if (uid) {
      sessionStorage.setItem('impersonateUserId', uid);
    } else {
      sessionStorage.removeItem('impersonateUserId');
    }
    window.location.reload();
  };

  const [superAdminParticipants, setSuperAdminParticipants] = useState<any[]>([]);
  useEffect(() => {
    if (isSuperAdminMode && selectedLeagueId && selectedLeagueId !== 'global') {
      api.get(`/leagues/${selectedLeagueId}/participants`)
         .then(res => {
           const participantsArray = Array.isArray(res.data) ? res.data : (res.data?.data || []);
           setSuperAdminParticipants(participantsArray);
         })
         .catch(err => console.error('Error fetching participants for super admin:', err));
    }
  }, [isSuperAdminMode, selectedLeagueId]);

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

  // Invite Logic - BLOCKING CHECK
  const [isCheckingInvite, setIsCheckingInvite] = useState(true);

  useEffect(() => {
    const checkInvite = () => {
        const getCookie = (name: string) => {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop()?.split(';').shift();
          return null;
        };
    
        const cookieCode = getCookie('pendingInviteCode');
        const localCode = localStorage.getItem('pendingInviteCode');
        const code = cookieCode || localCode;
    
        if (code) {
            console.log('🚀 [Dashboard] Pending Invite Found. Auto-redirecting to processor:', code);
            setPendingInvite(code);
            // FORCE REDIRECT to process the invite immediately.
            window.location.replace(`/invite/${code}`);
            return; // Keep isCheckingInvite true to block render
        }
        
        // No invite found, proceed to render
        setIsCheckingInvite(false);
    };
    
    checkInvite();
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


  // PREVENT FLASH: Wait for tournament context to stabilize AND invite check
  if (!mounted || !isReady || isCheckingInvite) {
      return (
          <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00E676]"></div>
              {isCheckingInvite && <p className="text-slate-400 text-sm animate-pulse">Verificando invitaciones...</p>}
          </div>
      );
  }

  // PREVENT CONTENT FLASH: Wait for league data (userStatus) before rendering
  // Fix: use props.defaultLeagueId (available immediately) instead of selectedLeagueId
  // (selectedLeagueId starts as 'global' in the store before useEffect syncs it)
  const isWaitingForLeague = !!props.defaultLeagueId && (isLeagueLoading || currentLeague === null);
  if (isWaitingForLeague) {
      return (
          <div className="flex h-screen w-full items-center justify-center bg-[#0F172A]">
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
        className="min-h-screen bg-[#0F172A] text-white flex flex-col font-sans relative pb-24 md:pb-0 overflow-x-hidden w-full md:pl-[68px]"
      >
        {/* Header only shown in Global/Main dashboard, league pages have it in LeagueLayout */}
        {!isEnterpriseMode && selectedLeagueId === 'global' && (
          <Header
            userName={user?.nickname || 'Invitado'}
            leagueName={selectedLeagueId !== 'global' ? currentLeague?.name : undefined}
            tournamentId={currentLeague?.tournamentId}
            isEnterprise={isEnterpriseMode}
            backUrl={isEnterpriseMode ? '/empresa/mis-pollas' : '/social/mis-pollas'}
          />
        )}

        {/* IMPERSONATION BAR FOR SUPER ADMIN */}
        {isSuperAdminMode && currentLeague && (
          <div className="w-full bg-gradient-to-r from-purple-900 to-[#1E293B] border-b border-purple-500/30 p-3 flex flex-col md:flex-row items-center justify-between z-50 sticky top-0 md:static gap-3">
            <div className="flex items-center gap-2 text-purple-300">
              <Shield size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Modo Super Admin</span>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs text-slate-300 hidden md:inline">Ver como:</span>
              <select 
                className="bg-[#0F172A] border border-purple-500/50 text-white text-xs rounded-lg px-2 py-1.5 outline-none w-full md:w-64"
                value={impersonatedUserId}
                onChange={(e) => handleImpersonateUserChange(e.target.value)}
              >
                <option value="">-- Mi vista (Admin) --</option>
                {superAdminParticipants?.map((p: any) => (
                  <option key={p.id} value={p.user?.id}>
                    {p.user?.fullName || p.user?.nickname || p.user?.email} {p.isAdmin ? '(👑)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {pendingInvite && (
          <PendingInviteBanner
            inviteCode={pendingInvite}
            onDiscard={handleDiscardInvite}
            onProcess={handleProcessInvite}
          />
        )}

        {/* PAYMENT BLOCK v2 */}

        {/* ESTATUS DE PAGO (REMOVIDO PARA COINCIDIR CON FLUJO EMPRESARIAL) */}


        {/* BLOQUEO DE PAGO PENDIENTE (REMOVIDO PARA COINCIDIR CON FLUJO EMPRESARIAL) */}
        {/* El usuario prefiere que se pueda ingresar y ver el banner de estado en lugar de un bloqueo total */}

        {(() => {
          const status = currentLeague?.userStatus;
          console.log('[DashboardClient] userStatus check:', status, 'league:', currentLeague?.id);
          return null;
        })()}

        {currentLeague && currentLeague.userStatus === 'PENDING_PAYMENT' && user?.role !== 'SUPER_ADMIN' && (
          <div className="fixed inset-0 z-[9999] bg-[#0F172A] flex flex-col items-center justify-start p-6 pt-12 text-center animate-in fade-in duration-500 overflow-y-auto">
            <PaymentLockOverlay
              leagueName={currentLeague.name}
              leagueId={currentLeague.id}
              amount={
                (() => {
                  const type = (currentLeague.packageType || '').toLowerCase();
                  if (type === 'parche' || type === 'amateur') return 30000;
                  if (type === 'amigos' || type === 'semi-pro') return 80000;
                  if (type === 'lider' || type === 'pro') return 180000;
                  if (type === 'influencer' || type === 'elite') return 350000;
                  if (type === 'bronze' || type === 'enterprise_bronze') return 100000;
                  if (type === 'silver' || type === 'enterprise_silver') return 175000;
                  if (type === 'gold' || type === 'enterprise_gold') return 450000;
                  if (type === 'platinum' || type === 'enterprise_platinum') return 750000;
                  if (type === 'diamond' || type === 'enterprise_diamond') return 1000000;
                  return 50000;
                })()
              }
              packageId={currentLeague.packageType}
            />
          </div>
        )}

        {/* PENDING APPROVAL OVERLAY (RE-IMPLEMENTADO COMO MENSAJE DE ESPERA) */}
        {currentLeague && currentLeague.userStatus === 'PENDING' && selectedLeagueId !== 'global' && user?.role !== 'SUPER_ADMIN' && (
             <div className="absolute inset-0 z-50 bg-[#0F172A]/90 backdrop-blur-sm flex items-start justify-center pt-24 p-6 text-center animate-in fade-in duration-500">
                <div className="bg-[#1E293B] border border-white/10 p-8 rounded-3xl shadow-2xl max-w-sm w-full relative overflow-hidden flex flex-col items-center justify-center">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-50"></div>
                    
                    <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.1)]">
                        <Shield className="w-8 h-8 text-orange-500" />
                    </div>
                    
                    <h2 className="text-2xl font-black text-white mb-2 uppercase italic tracking-tight">
                        SOLICITUD <span className="text-orange-500">RECIBIDA</span>
                    </h2>
                    
                    <p className="text-slate-400 mb-6 text-sm leading-relaxed">
                        Tu solicitud para unirte a <span className="text-white font-bold">{currentLeague.name}</span> ha sido recibida exitosamente.
                    </p>

                    <div className="bg-orange-500/5 border border-orange-500/10 rounded-2xl p-4 mb-6">
                        <p className="text-xs text-orange-500 font-bold uppercase tracking-widest">Estado: Pendiente de Activación</p>
                        <p className="text-[10px] text-slate-500 mt-1">El administrador debe confirmar tu ingreso para que puedas empezar a jugar.</p>
                    </div>
                    
                    <div className="flex flex-col gap-3 w-full">
                        <Button 
                            variant="outline" 
                            className="bg-transparent border-white/10 text-slate-300 hover:bg-white/5 hover:text-white"
                            onClick={() => {
                                const url = currentLeague?.isEnterprise ? '/empresa/mis-pollas' : '/social/mis-pollas';
                                router.push(url);
                            }}
                        >
                            Ir a Mis Pollas
                        </Button>
                    </div>
                </div>
             </div>
        )}


        {/* REJECTED STATUS LOCK */}
        {currentLeague && currentLeague.userStatus === 'REJECTED' && selectedLeagueId !== 'global' && (
             <div className="absolute inset-x-0 bottom-0 top-16 z-50 bg-[#0F172A] flex flex-col items-center justify-start p-6 pt-12 text-center animate-in fade-in duration-500 overflow-y-auto">
                <div className="bg-[#1E293B] border border-white/10 p-8 rounded-3xl shadow-2xl max-w-sm w-full relative overflow-hidden flex flex-col items-center justify-center">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50"></div>
                    
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                        <Shield className="w-8 h-8 text-red-500" />
                    </div>
                    
                    <h2 className="text-2xl font-black text-white mb-2 uppercase italic tracking-tight">
                        PAGO <span className="text-red-500">RECHAZADO</span>
                    </h2>
                    
                    <p className="text-slate-400 mb-6 leading-relaxed text-xs">
                        Hubo un problema con tu comprobante para la polla <span className="text-white font-bold">{currentLeague.name}</span>. Por favor, intenta subirlo de nuevo.
                    </p>
                    
                    <div className="w-full flex flex-col gap-4">
                        <PaymentMethods 
                            leagueId={currentLeague.id} 
                            amount={
                                (() => {
                                  const type = (currentLeague.packageType || '').toLowerCase();
                                  // Social Plans
                                  if (type === 'parche' || type === 'amateur') return 30000;
                                  if (type === 'amigos' || type === 'semi-pro') return 80000;
                                  if (type === 'lider' || type === 'pro') return 180000;
                                  if (type === 'influencer' || type === 'elite') return 350000;

                                  // Enterprise Plans
                                  if (type === 'bronze' || type === 'enterprise_bronze') return 100000;
                                  if (type === 'silver' || type === 'enterprise_silver') return 175000;
                                  if (type === 'gold' || type === 'enterprise_gold') return 450000;
                                  if (type === 'platinum' || type === 'enterprise_platinum') return 750000;
                                  if (type === 'diamond' || type === 'enterprise_diamond') return 1000000;

                                  return 50000;
                                })()
                            }
                            tournamentId={currentLeague.tournamentId}
                            packageId={currentLeague.packageType}
                            onSuccess={() => window.location.reload()} 
                        />
                        <Button 
                            variant="ghost" 
                            className="text-slate-500 hover:text-white text-xs underline"
                            onClick={() => {
                                const url = currentLeague?.isEnterprise ? '/empresa/mis-pollas' : '/social/mis-pollas';
                                router.push(url);
                            }}
                        >
                            Volver a Mis Pollas
                        </Button>
                    </div>
                </div>
             </div>
        )}

        <main className="flex-1 w-full max-w-none px-4 pt-4 md:px-8 md:pt-6 overflow-hidden">

          {/* VISTAS */}
          
          {/* 1. HOME */}
          {activeTab === 'home' && (
            <div className="animate-in fade-in duration-300">
              {selectedLeagueId === 'global' ? (
                // Global: saludo básico (ya no accesible desde el flujo principal)
                <div className="text-center py-10 px-6">
                  <h1 className="text-3xl font-russo text-white mb-2">
                    HOLA, <span className="text-[#00E676]">{user?.nickname?.toUpperCase() || 'CRACK'}</span>
                  </h1>
                  <p className="text-slate-400 text-sm max-w-xs mx-auto">
                    {tournamentId === 'UCL2526'
                      ? 'Bienvenido a la Champions 2025-26. ¡Predice y compite!'
                      : 'Bienvenido al Mundial 2026. ¡Predice, compite y gana!'}
                  </p>
                </div>
              ) : (
                // Liga Social: Dashboard inteligente
                <ErrorBoundary>
                  <SmartLeagueHome
                    currentLeague={currentLeague as any}
                    matches={matches}
                    onNavigate={setActiveTab}
                  />
                </ErrorBoundary>
              )}
            </div>
          )}

          {activeTab === 'leagues' && (
            <ErrorBoundary>
              <LeaguesList initialTab={leaguesTab} />
            </ErrorBoundary>
          )}

          {/* 3. PREDICTIONS (Unified View) */}
          {activeTab === 'predictions' && (
             <ErrorBoundary>
               <PredictionsView 
                  matches={matches}
                  onRefresh={handleFullRefresh}
                  isRefreshing={isRefreshing}
                  leagueId={selectedLeagueId}
                  tournamentId={leagueTournamentId}
               />
             </ErrorBoundary>
          )}

          {/* 4. RANKING (Unified View) */}
          {activeTab === 'ranking' && (
             <ErrorBoundary>
               <RankingView 
                  leagueId={selectedLeagueId}
                  isEnterpriseMode={isEnterpriseMode}
                  currentLeague={currentLeague}
                  matches={matches}
                  tournamentId={tournamentId}
               />
             </ErrorBoundary>
          )}

          {/* 5. BONUS */}
          {activeTab === 'bonus' && (
              <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <ErrorBoundary>
                  <BonusView leagueId={selectedLeagueId === 'global' ? undefined : selectedLeagueId} />
                </ErrorBoundary>
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
