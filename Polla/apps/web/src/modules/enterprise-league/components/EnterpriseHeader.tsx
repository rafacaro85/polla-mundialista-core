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
import { NotificationBell } from '@/components/notifications/NotificationBell';

interface EnterpriseHeaderProps {
    league: any;
    myDepartment?: string;
    isEnterprise?: boolean;
}

export const EnterpriseHeader = ({ league, myDepartment = 'General', isEnterprise }: EnterpriseHeaderProps) => {
    const router = useRouter();
    const { user, logout } = useAppStore();
    const [showMenu, setShowMenu] = useState(false);

    const nickname = (user?.nickname || user?.fullName?.split(' ')[0] || 'CRACK').toUpperCase();
    const canManageLeague = league.isAdmin || user?.role === 'SUPER_ADMIN' || league.creatorId === user?.id;

    const isEnterpriseMode = isEnterprise !== undefined ? isEnterprise : (league.type === 'COMPANY' || league.isEnterprise);
    const backUrl = isEnterpriseMode ? '/empresa/mis-pollas' : '/social/mis-pollas';

    return (
        <header className="border-b border-white/5 bg-[var(--brand-bg,#0F172A)] sticky top-0 z-50">
            {/* Fila 1: Branding y Perfil Estilo Círculo */}
            <div className="max-w-7xl mx-auto px-4 md:px-8 pt-4 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {/* LOGO MARCA / LPV */}
                    {isEnterpriseMode ? (
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl shadow-lg flex items-center justify-center border border-white/10 overflow-hidden shrink-0">
                            {league.brandingLogoUrl ? (
                                <img src={league.brandingLogoUrl} alt={league.companyName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="p-2 w-full h-full flex items-center justify-center">
                                    <Shield className="w-full h-full text-[var(--brand-primary)]" />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-12 md:h-16 flex items-center justify-center shrink-0">
                            <img src="/images/lpv/lpv-icon.png" alt="Polla Virtual Logo" className="h-full w-auto object-contain drop-shadow-xl" />
                        </div>
                    )}

                    {/* NOMBRE LIGA / EMPRESA */}
                    <div className="flex flex-col">
                        <h2 className="text-lg md:text-xl font-black uppercase tracking-tighter text-[var(--brand-heading,#FFFFFF)] leading-none italic">
                            {isEnterpriseMode ? (league.companyName || league.name) : league.name}
                        </h2>
                        {isEnterpriseMode && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="w-1.5 h-1.5 bg-[var(--brand-primary,#00E676)] rounded-full animate-pulse shadow-[0_0_8px_var(--brand-primary)]" />
                                <p className="text-[8px] md:text-[9px] text-[var(--brand-primary,#00E676)] font-black uppercase tracking-[0.2em]">
                                    Canal Corporativo
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Lado Derecho: Torneo + Perfil */}
                <div className="flex items-center gap-4">
                    <NotificationBell />
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

                                            {user?.role?.toUpperCase() === 'SUPER_ADMIN' && (
                                                <button
                                                    onClick={() => { setShowMenu(false); router.push('/super-admin'); }}
                                                    className="w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 text-yellow-500/80 hover:text-yellow-500 hover:bg-yellow-500/5 rounded-xl transition-all"
                                                >
                                                    <Shield size={14} /> Super Admin
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

            {/* Fila 2: Navegación + Torneo */}
            <div className="bg-transparent border-t border-white/5">
                <div className="max-w-7xl mx-auto px-4 md:px-8 py-2 md:py-3 flex items-center justify-between">
                    <button
                        onClick={() => router.push(backUrl)}
                        className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-white transition-colors flex items-center gap-2 group"
                    >
                        <span className="group-hover:translate-x-[-2px] transition-transform">←</span> VOLVER
                    </button>

                    {/* LOGO TORNEO */}
                    {league.tournamentId && (
                        <div className="flex items-center gap-3">
                            <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 hidden sm:block">
                                Torneo Oficial
                            </span>
                            <img
                                src={
                                    (league.tournamentId || '').toUpperCase().includes('UCL')
                                        ? '/images/ucl-logo.png'
                                        : '/images/wc-logo.png'
                                }
                                alt="Torneo"
                                className={`h-10 md:h-12 w-auto object-contain ${
                                    (league.tournamentId || '').toUpperCase().includes('UCL')
                                        ? 'brightness-0 invert'
                                        : ''
                                }`}
                            />
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};
