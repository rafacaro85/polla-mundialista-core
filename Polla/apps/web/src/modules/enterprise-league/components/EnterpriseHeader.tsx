'use client';

import React, { useState } from 'react';
import { 
  Shield, 
  LogOut,
  Settings,
  User as UserIcon,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';

interface EnterpriseHeaderProps {
    league: any;
    myDepartment?: string;
}

export const EnterpriseHeader = ({ league, myDepartment = 'General' }: EnterpriseHeaderProps) => {
    const router = useRouter();
    const { user, logout } = useAppStore();
    const [showMenu, setShowMenu] = useState(false);

    const nickname = (user?.nickname || user?.fullName?.split(' ')[0] || 'CRACK').toUpperCase();
    const canManageLeague = league.isAdmin || user?.role === 'SUPER_ADMIN' || league.creatorId === user?.id;

    return (
        <header className="border-b border-white/5 bg-[var(--brand-bg,#0F172A)] sticky top-0 z-50">
            {/* Fila 1: Branding y Perfil Estilo Círculo */}
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-5 flex items-center justify-between">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-white rounded-2xl shadow-2xl flex items-center justify-center border-2 border-white/10 overflow-hidden shrink-0">
                        {league.brandingLogoUrl ? (
                            <img src={league.brandingLogoUrl} alt={league.companyName} className="w-full h-full object-cover" />
                        ) : (
                            <div className="p-2 w-full h-full flex items-center justify-center">
                                <Shield className="w-full h-full text-[var(--brand-primary)]" />
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-xl md:text-3xl font-black uppercase tracking-tighter text-[var(--brand-heading,#FFFFFF)] leading-none italic">
                            {league.companyName || league.name}
                        </h1>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="w-2.5 h-2.5 bg-[var(--brand-primary,#00E676)] rounded-full animate-pulse shadow-[0_0_10px_var(--brand-primary)]" />
                            <p className="text-[11px] text-[var(--brand-primary,#00E676)] font-black uppercase tracking-[0.2em]">
                                Canal Corporativo
                            </p>
                        </div>
                    </div>
                </div>

                {/* Lado Derecho: Torneo + Perfil */}
                <div className="flex items-center gap-4">
                    {league.tournamentId && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
                            <img
                                src={
                                    (league.tournamentId || '').toUpperCase().includes('UCL')
                                        ? '/images/ucl-logo.png'
                                        : '/images/wc-logo.png'
                                }
                                alt="Torneo"
                                className={`h-8 w-auto object-contain ${
                                    (league.tournamentId || '').toUpperCase().includes('UCL')
                                        ? 'brightness-0 invert'
                                        : ''
                                }`}
                            />
                        </div>
                    )}

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-black text-white italic">{nickname}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{myDepartment}</p>
                        </div>

                        {/* Perfil con estilo circular y Menú Desplegable */}
                        <div className="relative">
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="relative group block"
                            >
                                <div className="absolute -inset-1 bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-primary)] rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                                <Avatar className="h-14 w-14 border-2 border-[var(--brand-primary)] shadow-2xl relative bg-[#0F172A] transition-transform active:scale-90">
                                    <AvatarImage src={user?.avatarUrl} />
                                    <AvatarFallback className="bg-[#0F172A] text-[var(--brand-primary)] text-sm font-black border border-[var(--brand-primary)]/20">
                                        {nickname.substring(0,2)}
                                    </AvatarFallback>
                                </Avatar>
                            </button>

                            {/* Dropdown Menu Corporativo */}
                            {showMenu && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                                    <div
                                        className="absolute right-0 mt-4 w-60 rounded-2xl shadow-2xl border z-50 overflow-hidden animate-in fade-in zoom-in duration-200"
                                        style={{
                                            backgroundColor: 'var(--brand-secondary, #1E293B)',
                                            borderColor: 'rgba(255,255,255,0.05)'
                                        }}
                                    >
                                        <div className="px-5 py-4 border-b border-white/5 bg-black/20">
                                            <p className="text-xs font-black text-white italic truncate">{user?.nickname || user?.fullName}</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate mt-0.5">{user?.email}</p>
                                        </div>

                                        <div className="p-2">
                                            <button
                                                onClick={() => { setShowMenu(false); router.push('/profile'); }}
                                                className="w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 text-slate-400 hover:text-[var(--brand-primary)] hover:bg-white/5 rounded-xl transition-all"
                                            >
                                                <UserIcon size={14} /> Mi Perfil
                                            </button>

                                            {canManageLeague && (
                                                <button
                                                    onClick={() => { setShowMenu(false); router.push(`/leagues/${league.id}/admin`); }}
                                                    className="w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 text-slate-400 hover:text-[var(--brand-primary)] hover:bg-white/5 rounded-xl transition-all"
                                                >
                                                    <Settings size={14} /> Panel de Control
                                                </button>
                                            )}

                                            <div className="my-2 border-t border-white/5" />

                                            <button
                                                onClick={() => { logout(); router.push('/'); }}
                                                className="w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 text-red-500/80 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all"
                                            >
                                                <LogOut size={14} /> Cerrar Sesión
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Fila 2: Navegación */}
            <div className="bg-black/20 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-4 md:px-8 py-2">
                    <button
                        onClick={() => router.push('/empresa/mis-pollas')}
                        className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-white transition-colors flex items-center gap-2 group"
                    >
                        <span className="group-hover:translate-x-[-2px] transition-transform">←</span> VOLVER
                    </button>
                </div>
            </div>
        </header>
    );
};
