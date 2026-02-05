import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Users, ArrowRight, Settings, Briefcase, Trophy } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import api from '@/lib/api';
import { CreateLeagueDialog } from '@/components/CreateLeagueDialog';
import { CreateBusinessLeagueDialog } from '@/components/CreateBusinessLeagueDialog';
import { JoinLeagueDialog } from '@/components/JoinLeagueDialog';
import { LeagueSettings as AdminLeagueSettings } from '@/components/AdminLeagueSettings';

import { useLeagues } from '@/hooks/useLeagues';

// --- INTERFACES: Imported from hook implied or just use inferred types

/* =============================================================================
   COMPONENTE: LEAGUES LIST (ESTILO TACTICAL CON TABS)
   ============================================================================= */
export const LeaguesList = ({ initialTab = 'social' }: { initialTab?: 'social' | 'enterprise' }) => {
    const router = useRouter();
    const { user } = useAppStore();
    const [activeTab, setActiveTab] = useState<'social' | 'enterprise'>(initialTab);

    // Custom Hook
    const { leagues, loading, fetchLeagues, socialLeagues, enterpriseLeagues } = useLeagues();

    // Force Social tab if Champions Theme
    const isChampionsTheme = process.env.NEXT_PUBLIC_APP_THEME === 'CHAMPIONS';

    React.useEffect(() => {
        if (isChampionsTheme) {
            setActiveTab('social');
        } else if (initialTab) {
            setActiveTab(initialTab);
        }
    }, [initialTab, isChampionsTheme]);

    // Lista a mostrar según tab
    const displayLeagues = activeTab === 'social' ? socialLeagues : enterpriseLeagues;

    return (
        <div className="p-4 pb-[100px] bg-[#0F172A] min-h-screen font-sans">

            {/* 1. HEADER SECCIÓN */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="font-russo text-2xl text-white uppercase tracking-widest leading-[1.1]">Mis Pollas</h2>
                        <p className="text-[11px] text-[#94A3B8] mt-1 font-semibold">GESTIONA TUS TORNEOS</p>
                    </div>
                </div>

                {/* TOGGLE TABS (Solo si NO es Champions) */}
                {!isChampionsTheme && (
                    <div className="flex bg-[#1E293B] rounded-xl p-1 mb-6 border border-[#334155]">
                        <button
                            className={`flex-1 p-2.5 rounded-lg border-none font-russo text-xs uppercase cursor-pointer transition-all flex items-center justify-center gap-2 ${activeTab === 'social' ? 'bg-[#00E676] text-[#0F172A]' : 'bg-transparent text-[#94A3B8]'}`}
                            onClick={() => setActiveTab('social')}
                        >
                            <Trophy size={14} /> Sociales
                        </button>
                        <button
                            className={`flex-1 p-2.5 rounded-lg border-none font-russo text-xs uppercase cursor-pointer transition-all flex items-center justify-center gap-2 ${activeTab === 'enterprise' ? 'bg-[#00E676] text-[#0F172A]' : 'bg-transparent text-[#94A3B8]'}`}
                            onClick={() => setActiveTab('enterprise')}
                        >
                            <Briefcase size={14} /> Empresas
                        </button>
                    </div>
                )}

                {/* BOTONES DE ACCIÓN (DINÁMICOS) */}
                <div className="flex gap-3 mb-6">
                    {activeTab === 'social' ? (
                        <>
                            <CreateLeagueDialog onLeagueCreated={fetchLeagues}>
                                <button className="flex-1 bg-[#00E676] text-[#0F172A] border-none p-3 rounded-xl font-black text-[11px] uppercase tracking-wider shadow-[0_4px_15px_rgba(0,230,118,0.3)] cursor-pointer flex items-center justify-center gap-1.5">
                                    + CREAR POLLA
                                </button>
                            </CreateLeagueDialog>
                            <JoinLeagueDialog onLeagueJoined={fetchLeagues}>
                                <button className="flex-1 bg-transparent border border-[#00E676] text-[#00E676] p-3 rounded-xl font-black text-[11px] uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5">
                                    UNIRSE CON CÓDIGO
                                </button>
                            </JoinLeagueDialog>
                        </>
                    ) : (
                        <>
                            <CreateBusinessLeagueDialog onLeagueCreated={fetchLeagues}>
                                <button className="flex-1 bg-[#0072FF] text-white border-none p-3 rounded-xl font-black text-[11px] uppercase tracking-wider shadow-[0_4px_15px_rgba(0,114,255,0.3)] cursor-pointer flex items-center justify-center gap-1.5">
                                    + CREAR EMPRESA
                                </button>
                            </CreateBusinessLeagueDialog>
                            <JoinLeagueDialog onLeagueJoined={fetchLeagues}>
                                <button className="flex-1 bg-transparent border border-[#0072FF] text-[#0072FF] p-3 rounded-xl font-black text-[11px] uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5">
                                    UNIRSE CON CÓDIGO
                                </button>
                            </JoinLeagueDialog>
                        </>
                    )}
                </div>
            </div>

            {/* 2. LISTA DE LIGAS FILTRADA */}
            <div className="flex flex-col gap-3">
                {displayLeagues.map((league) => (
                    <div key={league.id} className="bg-[#1E293B] border border-[#334155] rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden shadow-[0_4px_10px_rgba(0,0,0,0.2)]">

                        {/* Indicador lateral */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${league.isEnterprise ? 'bg-[#0072FF]' : (league.isAdmin ? 'bg-[#00E676]' : 'bg-[#334155]')}`} />

                        {/* Icono / Inicial */}
                        <div className="w-12 h-12 rounded-xl bg-[#0F172A] border border-[#334155] flex items-center justify-center shrink-0">
                            <span className={`font-russo text-xl ${league.isEnterprise ? 'text-[#0072FF]' : (league.isAdmin ? 'text-[#00E676]' : 'text-[#94A3B8]')}`}>
                                {league.isEnterprise ? <Briefcase size={20} /> : league.initial}
                            </span>
                        </div>

                        {/* Información */}
                        <div className="flex-1 min-w-0">
                            <h3 className="font-russo text-base text-white mb-1 whitespace-nowrap overflow-hidden text-ellipsis">{league.name}</h3>
                            <div className="flex items-center gap-2 text-[10px] text-[#94A3B8] font-semibold">
                                <span className="flex items-center gap-1">
                                    <Users size={10} /> {league.members}
                                </span>
                                <span>•</span>
                                <span>Admin: <span className="text-white">{league.admin}</span></span>
                                {league.isEnterprise && !league.isEnterpriseActive && (
                                    <span className="text-orange-500 ml-1">• BORRADOR</span>
                                )}
                            </div>
                        </div>

                        <div>
                            {league.isAdmin && league.isEnterpriseActive ? (
                                // CASO 1: Empresa Activa (Admin)
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => router.push(`/leagues/${league.id}/admin`)}
                                        className="h-8 w-8 p-0 rounded-md bg-[#334155] text-[#94A3B8] border-none cursor-pointer flex items-center justify-center hover:bg-[#475569] transition-colors"
                                        title="Configuración"
                                    >
                                        <Settings size={14} />
                                    </button>
                                    <button
                                        onClick={() => router.push(`/leagues/${league.id}`)}
                                        className="h-8 px-3 rounded-md text-[10px] font-extrabold uppercase border-none cursor-pointer flex items-center justify-center bg-[#0072FF] text-white shadow-[0_0_10px_rgba(0,114,255,0.4)]"
                                    >
                                        INGRESAR
                                    </button>
                                </div>
                            ) : league.isAdmin && league.isEnterprise && !league.isEnterpriseActive ? (
                                // CASO 2: Empresa Borrador (Admin) -> Ir a Studio
                                <button
                                    onClick={() => router.push(`/leagues/${league.id}/studio`)}
                                    className="h-8 px-3 rounded-md text-[10px] font-extrabold uppercase border-none cursor-pointer flex items-center justify-center bg-orange-500 text-white"
                                >
                                    DISEÑAR
                                </button>
                            ) : !league.isAdmin ? (
                                // CASO 3: Participante -> Jugar
                                <button
                                    onClick={() => router.push(`/leagues/${league.id}`)}
                                    className="h-8 px-3 rounded-md text-[10px] font-extrabold uppercase cursor-pointer flex items-center justify-center bg-transparent border border-[#475569] text-white"
                                >
                                    JUGAR
                                </button>
                            ) : (
                                // CASO 4: Admin Polla Social
                                <div className="flex gap-2">
                                    {league.isPaid && (
                                        <button
                                            onClick={() => router.push(`/leagues/${league.id}/admin`)}
                                            className="h-8 w-8 p-0 rounded-md bg-[#334155] text-[#94A3B8] border-none cursor-pointer flex items-center justify-center hover:bg-[#475569] transition-colors"
                                            title="Configuración"
                                        >
                                            <Settings size={14} />
                                        </button>
                                    )}

                                    {!league.isPaid ? (
                                        <button
                                            onClick={() => router.push(`/leagues/${league.id}`)}
                                            className="h-8 px-3 rounded-md text-[10px] font-extrabold uppercase border border-[#FACC15] cursor-pointer flex items-center justify-center bg-[#FACC15]/20 text-[#FACC15] hover:bg-[#FACC15] hover:text-[#0F172A] transition-all"
                                        >
                                            PENDIENTE
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => router.push(`/leagues/${league.id}`)}
                                            className="h-8 px-3 rounded-md text-[10px] font-extrabold uppercase border-none cursor-pointer flex items-center justify-center bg-[#00E676] text-[#0F172A] shadow-[0_0_10px_rgba(0,230,118,0.2)]"
                                        >
                                            INGRESAR
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                    </div>
                ))}
            </div>

            {/* Empty State */}
            {
                !loading && displayLeagues.length === 0 && (
                    <div className="text-center mt-10 opacity-50">
                        <Shield size={48} className="mx-auto mb-4 text-[#334155]" />
                        <p className="text-[#94A3B8] text-xs">
                            No tienes pollas {activeTab === 'social' ? 'sociales' : 'empresariales'} aún.
                        </p>
                    </div>
                )
            }

        </div >
    );
};
