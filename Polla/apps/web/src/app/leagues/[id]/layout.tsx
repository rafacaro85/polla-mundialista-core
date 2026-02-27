'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import api from '@/lib/api';
import { LeagueNavigation } from '@/components/LeagueNavigation';
import { EnterpriseNavigation } from '@/modules/enterprise-league/components/EnterpriseNavigation';
import BrandThemeProvider from '@/components/providers/BrandThemeProvider';
import { Loader2, Timer, Shield } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { DemoControlPanel } from '@/components/DemoControlPanel';
import { PaymentMethods } from '@/components/dashboard/PaymentMethods';
import { EnterpriseHeader } from '@/modules/enterprise-league/components/EnterpriseHeader';
import { Header } from '@/components/ui/Header';

// Helper for Plan Levels
const getPlanLevel = (type?: string) => {
    if (!type) return 1;
    const t = type.toUpperCase();
    if (t.includes('DIAMOND') || t.includes('DIAMANTE')) return 5;
    if (t.includes('PLATINUM') || t.includes('PLATINO')) return 4;
    if (t.includes('BUSINESS_CORP')) return 4; // Legacy
    if (t.includes('GOLD') || t.includes('ORO')) return 3;
    if (t.includes('SILVER') || t.includes('PLATA')) return 2;
    if (t.includes('BUSINESS_GROWTH')) return 2; // Legacy
    return 1;
};

// Theme Engine Layout
export default function LeagueLayout({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const router = useRouter();
    const pathname = usePathname(); // MOVED UP: Hooks must be called before any early return
    const { user, setSelectedLeague } = useAppStore();
    const [league, setLeague] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Sync selected league to global store when entering a league
    useEffect(() => {
        if (params.id) {
            setSelectedLeague(params.id as string);
        }
    }, [params.id, setSelectedLeague]);

    // 1. Fetch League Data (Client Side because we need auth token from cookie implicit in browser or api interceptor)
    useEffect(() => {
        const init = async () => {
            if (!params.id) return;

            // Ensure user data is fresh (crucial for permissions)
            await useAppStore.getState().syncUserFromServer();

            try {
                // Try fetching specific league details. 
                // Since we don't have a direct /leagues/:id public endpoint documented yet that returns EVERYTHING,
                // we will use the logic we found robust: getMyLeagues or getAll (if admin).

                // OPTIMIZACION: Si ya existe un endpoint de detalle, usarlo.
                // Por ahora, usaremos '/leagues/my' para obtener info básica + roles.
                // Y si es admin, quizas '/leagues/all'.
                // PERO... necesitamos los colores. El fix anterior añadió colores a 'leagues/my'.

                let foundLeague = null;

                // 1. Siempre llamar primero al endpoint directo (incluye userStatus)
                try {
                    const { data } = await api.get(`/leagues/${params.id}`);
                    foundLeague = data;
                } catch (e) {
                    console.error('Direct fetch failed', e);
                }

                // 2. Fallback: buscar en la lista general
                if (!foundLeague) {
                    try {
                        const { data: myLeagues } = await api.get('/leagues/my');
                        foundLeague = myLeagues.find((l: any) => l.id === params.id);
                    } catch (e) {
                        // Silent fail
                    }
                }

                if (foundLeague) {
                    setLeague(foundLeague);
                } else {
                    console.error('Liga no encontrada o no tienes acceso.');
                }

            } catch (error) {
                console.error("Error fetching league layout data", error);
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [params.id]);


    // 2. Loading State (Full Screen Spinner to prevent FOUC)
    if (loading) {
        return (
            <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
                <Loader2 className="animate-spin text-[#00E676]" size={40} />
            </div>
        );
    }

    if (!league) {
        return (
            <div className="min-h-screen bg-[#0F172A] flex items-center justify-center text-white">
                Liga no encontrada o acceso denegado.
            </div>
        );
    }

    // 3. THEME INJECTION - Usar BrandThemeProvider
    const isEnterprise = (league.type === 'COMPANY' || league.isEnterprise);
    const primaryColor = isEnterprise ? (league.brandColorPrimary || '#00E676') : '#00E676';
    const secondaryColor = isEnterprise ? (league.brandColorSecondary || '#1E293B') : '#1E293B';
    const bgColor = isEnterprise ? (league.brandColorBg || '#0F172A') : '#0F172A';
    const textColor = isEnterprise ? (league.brandColorText || '#F8FAFC') : '#F8FAFC';
    const headingColor = isEnterprise ? (league.brandColorHeading || '#FFFFFF') : '#FFFFFF';
    const barsColor = isEnterprise ? (league.brandColorBars || '#00E676') : '#00E676';
    
    // Calculate Plan Level for Navigation Restrictions
    const planLevel = getPlanLevel(league.packageType);

    // Check if main dashboard
    const isDashboardRoot = pathname === `/leagues/${params.id}`;
    // ALWAYS SHOW HEADER in game pages, except studio
    const showLayoutUI = !pathname?.includes('/studio'); 
    // Hide layout nav on admin/settings/studio routes and Dashboard root
    const isAdminRoute = pathname?.includes('/admin')
        || pathname?.includes('/settings')
        || pathname?.includes('/studio');
    const showLayoutNav = showLayoutUI && !isDashboardRoot && !isAdminRoute;

    // 3b. Check if user has REJECTED or PENDING status
    const userStatus = league.userStatus;
    const isRejected = userStatus === 'REJECTED';
    const isPendingApproval = userStatus === 'PENDING' && !isEnterprise; // Enterprise has its own timer screen

    if (isRejected) {
        const getAmount = () => {
            const type = (league.packageType || '').toLowerCase();
            if (type === 'bronze' || type === 'enterprise_bronze') return 100000;
            if (type === 'silver' || type === 'enterprise_silver') return 175000;
            if (type === 'gold' || type === 'enterprise_gold') return 450000;
            if (type === 'platinum' || type === 'enterprise_platinum') return 750000;
            if (type === 'diamond' || type === 'enterprise_diamond') return 1000000;
            if (type === 'parche' || type === 'amateur') return 30000;
            if (type === 'amigos' || type === 'semi-pro') return 80000;
            if (type === 'lider' || type === 'pro') return 180000;
            if (type === 'influencer' || type === 'elite') return 350000;
            return 50000;
        };

        return (
            <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-start p-6 pt-24 text-center animate-in fade-in duration-500 overflow-y-auto">
                <div className="bg-[#1E293B] border border-white/10 p-8 rounded-3xl shadow-2xl max-w-sm w-full relative overflow-hidden flex flex-col items-center justify-center">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00E676] to-transparent opacity-50" />
                    
                    {isRejected ? (
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                            <Shield className="w-8 h-8 text-red-500" />
                        </div>
                    ) : league.hasPendingTransaction ? (
                        <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-yellow-500/20">
                            <Timer className="w-8 h-8 text-yellow-500 animate-pulse" />
                        </div>
                    ) : (
                        <div className="w-16 h-16 bg-[#00E676]/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#00E676]/20">
                            <Shield className="w-8 h-8 text-[#00E676]" />
                        </div>
                    )}

                    <h2 className="text-2xl font-black text-white mb-2 uppercase italic tracking-tight leading-tight">
                        {isRejected ? (
                            <>PAGO <span className="text-red-500">RECHAZADO</span></>
                        ) : league.hasPendingTransaction ? (
                            <>PAGO EN <span className="text-yellow-500">REVISIÓN</span></>
                        ) : (
                            <>ACTIVA TU <span className="text-[#00E676]">POLLA</span></>
                        )}
                    </h2>
                    
                    <p className="text-slate-400 mb-6 leading-relaxed text-xs">
                        {isRejected ? (
                            <>Hubo un problema con tu comprobante para la polla <span className="text-white font-bold">{league.name}</span>. Por favor, intenta subirlo de nuevo.</>
                        ) : league.hasPendingTransaction ? (
                            <>Estamos validando tu comprobante para la polla <span className="text-white font-bold">{league.name}</span>. En unos minutos podrás empezar a jugar.</>
                        ) : (
                            <>Para activar la polla <span className="text-white font-bold">{league.name}</span>, realiza el pago correspondiente y sube el comprobante.</>
                        )}
                    </p>

                    <div className="w-full flex flex-col gap-4">
                        {(isRejected || !league.hasPendingTransaction) && (
                            <PaymentMethods
                                leagueId={league.id}
                                amount={getAmount()}
                                tournamentId={league.tournamentId}
                                onSuccess={() => {
                                    setTimeout(() => {
                                        router.push(isEnterprise ? '/empresa/mis-pollas' : '/social/mis-pollas');
                                    }, 1500);
                                }}
                            />
                        )}
                        
                        <button
                            className="text-slate-500 hover:text-white text-xs underline transition-colors"
                            onClick={() => router.push(isEnterprise ? '/empresa/mis-pollas' : '/social/mis-pollas')}
                        >
                            Volver a Mis Pollas
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 3c-SOCIAL: Polla social PENDIENTE de activación (PENDING + !isEnterprise)
    // Sin este bloque, el usuario con estado PENDING entra directo al home.
    if (isPendingApproval) {
        // BUG 2 FIX: Si soy invitado (no el creador ni admin de liga), me salteo el cobro.
        const isCreator = (league.creatorId === user?.id) || league.isAdmin;

        // Si es invitado de polla SOCIAL, mostramos banner amistoso, no bloqueamos la pantalla completa.
        if (!isCreator) {
            return (
                <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-start p-6 pt-24 text-center animate-in fade-in duration-500">
                    <div className="bg-[#1E293B] border border-white/10 p-8 rounded-3xl shadow-xl max-w-md w-full relative overflow-hidden flex flex-col items-center justify-center">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#FFD700] to-transparent opacity-50" />
                        
                        <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-yellow-500/20">
                            <Timer className="w-8 h-8 text-yellow-500 animate-pulse" />
                        </div>

                        <h2 className="text-2xl font-black text-white mb-2 uppercase italic tracking-tight">
                            Polla <span className="text-[#00E676]">Pendiente</span>
                        </h2>
                        
                        <p className="text-slate-300 mb-6 leading-relaxed text-sm">
                            El administrador aún no ha activado esta polla. <br/>
                            <span className="text-slate-400 text-xs mt-2 block">
                                Pronto podrás empezar a jugar 🏆
                            </span>
                        </p>

                        <button
                            className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-xl transition-colors w-full"
                            onClick={() => router.push('/social/mis-pollas')}
                        >
                            Volver a Mis Pollas
                        </button>
                    </div>
                </div>
            );
        }

        // Si es el creador, le cobramos:
        const getAmount = () => {
            const type = (league.packageType || '').toLowerCase();
            if (type === 'parche' || type === 'amateur') return 30000;
            if (type === 'amigos' || type === 'semi-pro') return 80000;
            if (type === 'lider' || type === 'pro') return 180000;
            if (type === 'influencer' || type === 'elite') return 350000;
            return 50000;
        };

        return (
            <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-start p-6 pt-24 text-center animate-in fade-in duration-500 overflow-y-auto">
                <div className="bg-[#1E293B] border border-white/10 p-8 rounded-3xl shadow-2xl max-w-sm w-full relative overflow-hidden flex flex-col items-center justify-center">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00E676] to-transparent opacity-50" />

                    {league.hasPendingTransaction ? (
                        <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-yellow-500/20">
                            <Timer className="w-8 h-8 text-yellow-500 animate-pulse" />
                        </div>
                    ) : (
                        <div className="w-16 h-16 bg-[#00E676]/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#00E676]/20">
                            <Shield className="w-8 h-8 text-[#00E676]" />
                        </div>
                    )}

                    <h2 className="text-2xl font-black text-white mb-2 uppercase italic tracking-tight leading-tight">
                        {league.hasPendingTransaction ? (
                            <>PAGO EN <span className="text-yellow-500">REVISIÓN</span></>
                        ) : (
                            <>ACTIVA TU <span className="text-[#00E676]">POLLA</span></>
                        )}
                    </h2>

                    <p className="text-slate-400 mb-6 leading-relaxed text-xs">
                        {league.hasPendingTransaction ? (
                            <>Estamos validando tu comprobante para la polla <span className="text-white font-bold">{league.name}</span>. En unos minutos podrás empezar a jugar.</>
                        ) : (
                            <>Para activar la polla <span className="text-white font-bold">{league.name}</span>, realiza el pago correspondiente y sube el comprobante.</>
                        )}
                    </p>

                    <div className="w-full flex flex-col gap-4">
                        {/* Solo mostrar pago si NO hay comprobante pendiente */}
                        {!league.hasPendingTransaction && (
                            <PaymentMethods
                                leagueId={league.id}
                                amount={getAmount()}
                                tournamentId={league.tournamentId}
                                onSuccess={() => {
                                    setTimeout(() => {
                                        router.push('/social/mis-pollas');
                                    }, 1500);
                                }}
                            />
                        )}

                        <button
                            className="text-slate-500 hover:text-white text-xs underline transition-colors"
                            onClick={() => router.push('/social/mis-pollas')}
                        >
                            Volver a Mis Pollas
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 3d. Check if pending activation (only for non-rejected enterprise)
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';
    if (isEnterprise && !league.isEnterpriseActive && !isSuperAdmin) {
        const getAmount = () => {
            const type = (league.packageType || '').toLowerCase();
            if (type === 'bronze' || type === 'enterprise_bronze') return 100000;
            if (type === 'silver' || type === 'enterprise_silver') return 175000;
            if (type === 'gold' || type === 'enterprise_gold') return 450000;
            if (type === 'platinum' || type === 'enterprise_platinum') return 750000;
            if (type === 'diamond' || type === 'enterprise_diamond') return 1000000;
            return 100000;
        };

        return (
            <div className="flex h-screen w-full flex-col items-center justify-center p-6 text-center bg-[#0F172A] text-white overflow-y-auto">
                <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center mb-6 border border-yellow-500/20">
                    <Timer size={40} className="text-yellow-500 animate-pulse" />
                </div>
                <h2 className="text-2xl font-russo uppercase mb-2 italic tracking-tight">Polla en Revisión</h2>
                <p className="text-slate-400 max-w-sm mb-6 leading-relaxed text-sm">
                    Esta polla empresarial está en proceso de activación. 
                    Estamos validando tu pago y configurando los servidores. 
                    Normalmente toma menos de 2 horas. Te avisaremos.
                </p>

                {/* Status Box */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-8 w-full max-w-xs text-left">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Estado del Pago</p>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                        <span className="text-xs font-bold text-yellow-500 uppercase">Validando Comprobante</span>
                    </div>
                </div>

                <div className="flex flex-col gap-3 w-full max-w-xs">
                    <button 
                        onClick={() => router.push('/empresa/mis-pollas')}
                        className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all font-russo"
                    >
                        Ir a mis pollas
                    </button>
                    
                    {/* Retry Drawer for PENDING Enterprise */}
                    <div className="mt-4 pt-4 border-t border-white/5">
                        <p className="text-[10px] text-slate-500 mb-4 italic">¿Subiste el comprobante equivocado?</p>
                        <PaymentMethods
                            leagueId={league.id}
                            amount={getAmount()}
                            onSuccess={() => window.location.reload()}
                        />
                    </div>

                    <a 
                        href="https://wa.me/573105973421" 
                        target="_blank" 
                        className="text-[#00E676] text-[10px] font-black uppercase tracking-widest hover:underline font-russo mt-4"
                    >
                        Contactar Soporte WhatsApp
                    </a>
                </div>
            </div>
        );
    }

    return (
        <BrandThemeProvider
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            bgColor={bgColor}
            textColor={textColor}
            headingColor={headingColor}
            barsColor={barsColor}
            logoUrl={league.brandingLogoUrl}
            companyName={league.companyName || league.name}
        >
            <div className="min-h-screen w-full transition-colors duration-500 bg-brand-bg text-brand-text flex flex-col md:flex-row">
                {/* PERSISTENT NAVIGATION (Sidebar/Bottom) - HIDDEN IN STUDIO AND DASHBOARD ROOT */}
                {showLayoutNav && isEnterprise && (
                    <EnterpriseNavigation
                        leagueId={league.id}
                        isEnterpriseActive={league.isEnterpriseActive || false}
                        planLevel={planLevel}
                    />
                )}

                {/* SOCIAL NAVIGATION (non-Enterprise) */}
                {showLayoutNav && !isEnterprise && (
                    <LeagueNavigation
                        leagueId={league.id}
                        isAdmin={league.isAdmin || false}
                        isEnterpriseActive={false}
                    />
                )}

                {/* MAIN CONTENT AREA - Responsive and Centered */}
                <main className={`flex-1 w-full ${
                    showLayoutNav
                        ? 'md:pl-64 pb-24 md:pb-0'
                        : ''
                    }`}>
                    
                    {/* ENTERPRISE HEADER — MOVED FROM PAGE TO LAYOUT FOR CONSISTENCY */}
                    {isEnterprise && showLayoutUI && (
                        <EnterpriseHeader 
                            league={league} 
                            myDepartment={league.userDepartment} 
                        />
                    )}

                    {/* SOCIAL HEADER — Standard UI for non-enterprise leagues */}
                    {!isEnterprise && showLayoutUI && (
                        <EnterpriseHeader
                            league={league}
                            isEnterprise={false}
                        />
                    )}


                    <div className="w-full mx-auto px-4 md:px-6 lg:px-8 max-w-full md:max-w-[768px] lg:max-w-[1280px]">
                        {children}
                    </div>
                </main>
                
                {/* Panel de Control para el Demo */}
                <DemoControlPanel leagueId={league.id} />
            </div>
        </BrandThemeProvider>
    );
}
