'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, LogOut, Settings, User, ChevronDown } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useRouter } from 'next/navigation';

interface UniversalGameHeaderProps {
    leagueName: string;
    tournamentId: string;
    logoUrl?: string;
    onBack?: () => void;
    isEnterprise?: boolean;
}

export function UniversalGameHeader({ 
    leagueName, 
    tournamentId, 
    logoUrl, 
    onBack,
    isEnterprise = false 
}: UniversalGameHeaderProps) {
    const router = useRouter();
    const { user, logout } = useAppStore();
    const [isScrolled, setIsScrolled] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    // Logos del torneo
    const tournamentLogo = tournamentId === 'UCL2526' 
        ? '/images/ucl-logo.png' 
        : '/images/wc-logo.png';

    // Logo por defecto si no hay uno (LPV)
    const displayLogo = logoUrl || '/images/lpv/lpv-full-logo.png';

    return (
        <header 
            className={`sticky top-0 z-[100] w-full transition-all duration-300 ${
                isScrolled 
                ? 'bg-[#0F172A]/85 backdrop-blur-[20px] shadow-2xl py-1' 
                : 'bg-[#0F172A] py-2'
            }`}
        >
            <div className="max-w-7xl mx-auto px-4 flex flex-col gap-2">
                {/* FILA 1: Torneo | Nombre | Avatar */}
                <div className="flex items-center justify-between h-10">
                    {/* Izquierda: Logo Torneo */}
                    <div className="flex items-center w-1/3">
                        <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center">
                            <img 
                                src={tournamentLogo} 
                                alt="Tournament" 
                                className={`h-8 w-auto object-contain ${tournamentId === 'UCL2526' ? 'brightness-0 invert' : ''}`}
                            />
                        </div>
                    </div>

                    {/* Centro: Nombre Liga/Empresa */}
                    <div className="flex-1 text-center">
                        <h1 className="text-white font-black text-sm uppercase tracking-tight truncate max-w-[150px] mx-auto opacity-90">
                            {leagueName}
                        </h1>
                    </div>

                    {/* Derecha: Avatar */}
                    <div className="flex items-center justify-end w-1/3 relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="flex items-center gap-1.5 p-1 rounded-full hover:bg-white/5 transition-colors"
                        >
                            <div className="w-8 h-8 rounded-full bg-[#00E676] text-[#0F172A] flex items-center justify-center font-bold text-xs ring-2 ring-white/10">
                                {user?.nickname?.[0]?.toUpperCase() || user?.fullName?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <ChevronDown size={14} className={`text-slate-400 transition-transform ${showMenu ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Menu */}
                        {showMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                                <div className="absolute right-0 top-11 w-48 bg-[#1E293B] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                    <div className="px-4 py-2 border-b border-white/5 bg-black/20">
                                        <p className="text-xs font-bold text-white truncate">{user?.nickname || user?.fullName}</p>
                                        <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                                    </div>
                                    <div className="py-1">
                                        <button 
                                            onClick={() => { setShowMenu(false); router.push('/profile'); }}
                                            className="w-full px-4 py-2 text-left text-xs text-slate-300 hover:bg-white/5 flex items-center gap-2"
                                        >
                                            <User size={14} /> Mi Perfil
                                        </button>
                                        <button 
                                            onClick={handleLogout}
                                            className="w-full px-4 py-2 text-left text-xs text-red-500 hover:bg-red-500/10 flex items-center gap-2"
                                        >
                                            <LogOut size={14} /> Cerrar Sesión
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* FILA 2: Volver | Logo Empresa (Card) */}
                <div className="flex items-center justify-between h-14 relative pb-1">
                    {/* Izquierda: Flecha Volver */}
                    <div className="absolute left-0">
                        <button 
                            onClick={onBack}
                            className="p-2 text-[#64748B] hover:text-white transition-all hover:scale-110 active:scale-95"
                            title="Volver"
                        >
                            <ChevronLeft size={20} strokeWidth={2.5} />
                        </button>
                    </div>

                    {/* Centro: Logo Card Glassmorphism */}
                    <div className="mx-auto">
                        <div 
                            className="flex items-center justify-center px-4 py-2 bg-white/5 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl"
                            style={{ 
                                background: 'rgba(255, 255, 255, 0.08)',
                                backdropFilter: 'blur(12px)',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)'
                            }}
                        >
                            <img 
                                src={displayLogo} 
                                alt="League Logo" 
                                className="h-10 w-auto object-contain max-w-[80px]"
                            />
                        </div>
                    </div>

                    {/* Espaciador para balancear la flecha de la izquierda */}
                    <div className="w-[36px]" />
                </div>
            </div>
        </header>
    );
}

export default UniversalGameHeader;
