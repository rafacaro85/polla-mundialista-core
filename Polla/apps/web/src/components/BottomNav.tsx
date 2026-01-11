import React from 'react';
import { Calendar, Trophy, Activity, Star, MessageSquare, Users } from 'lucide-react';

interface BottomNavProps {
    activeTab: 'home' | 'game' | 'leagues' | 'ranking' | 'bracket' | 'bonus' | 'muro';
    onTabChange: (tab: 'home' | 'game' | 'leagues' | 'ranking' | 'bracket' | 'bonus' | 'muro') => void;
    showLeaguesTab?: boolean;
    showMuroTab?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, showLeaguesTab = true, showMuroTab = false }) => {
    return (
        <nav
            className="fixed bottom-0 left-0 right-0 w-full bg-[#0F172A]/95 backdrop-blur-xl border-t border-[#1E293B] z-[9999] shadow-[0_-4px_20px_rgba(0,0,0,0.5)]"
            style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999, paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)', paddingTop: '12px' }}
        >
            <div className="max-w-md mx-auto flex justify-around items-center px-2">

                {/* 0. INICIO (LOGO N) */}
                <button
                    onClick={() => onTabChange('home')}
                    className={`relative flex flex-col items-center gap-1 transition-all duration-300 bg-transparent border-none outline-none p-0 w-14 ${activeTab === 'home' ? '-translate-y-1' : 'opacity-60 hover:opacity-100'}`}
                >
                    {activeTab === 'home' && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#00E676] rounded-full shadow-[0_0_15px_2px_rgba(0,230,118,0.6)] animate-pulse"></div>
                    )}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${activeTab === 'home' ? 'bg-[#00E676] border-[#00E676] text-obdisian shadow-lg' : 'border-slate-400 bg-transparent text-slate-400'}`}>
                        <span className={`font-black text-[10px] ${activeTab === 'home' ? 'text-black' : 'text-slate-400'}`}>N</span>
                    </div>
                    <span className={`text-[9px] font-black tracking-widest uppercase mt-1 ${activeTab === 'home' ? 'text-white' : 'text-slate-400'}`}>Inicio</span>
                </button>

                {/* 1. JUEGO (PARTIDOS) */}
                <button
                    onClick={() => onTabChange('game')}
                    className={`relative flex flex-col items-center gap-1 transition-all duration-300 bg-transparent border-none outline-none p-0 w-14 ${activeTab === 'game' ? 'text-[#00E676] -translate-y-1' : 'text-slate-400 hover:text-white'}`}
                >
                    {activeTab === 'game' && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#00E676] rounded-full shadow-[0_0_15px_2px_rgba(0,230,118,0.6)] animate-pulse"></div>
                    )}
                    <Calendar size={22} strokeWidth={activeTab === 'game' ? 2.5 : 2} />
                    <span className="text-[9px] font-black tracking-widest uppercase mt-1">Juego</span>
                </button>

                {/* 2. POLLAS (Visible solo en Dashboard General) */}
                {showLeaguesTab && (
                    <button
                        onClick={() => onTabChange('leagues')}
                        className={`relative flex flex-col items-center gap-1 transition-all duration-300 bg-transparent border-none outline-none p-0 w-14 ${activeTab === 'leagues' ? 'text-[#00E676] -translate-y-1' : 'text-slate-400 hover:text-white'}`}
                    >
                        {activeTab === 'leagues' && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#00E676] rounded-full shadow-[0_0_15px_2px_rgba(0,230,118,0.6)] animate-pulse"></div>
                        )}
                        <Users size={22} strokeWidth={activeTab === 'leagues' ? 2.5 : 2} />
                        <span className="text-[9px] font-black tracking-widest uppercase mt-1">Pollas</span>
                    </button>
                )}

                {/* 3. RANKING */}
                <button
                    onClick={() => onTabChange('ranking')}
                    className={`relative flex flex-col items-center gap-1 transition-all duration-300 bg-transparent border-none outline-none p-0 w-14 ${activeTab === 'ranking' ? 'text-[#00E676] -translate-y-1' : 'text-slate-400 hover:text-white'}`}
                >
                    {activeTab === 'ranking' && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#00E676] rounded-full shadow-[0_0_15px_2px_rgba(0,230,118,0.6)] animate-pulse"></div>
                    )}
                    <Trophy size={22} strokeWidth={activeTab === 'ranking' ? 2.5 : 2} />
                    <span className="text-[9px] font-black tracking-widest uppercase mt-1">Rank</span>
                </button>

                {/* 4. SIMULADOR */}
                <button
                    onClick={() => onTabChange('bracket')}
                    className={`relative flex flex-col items-center gap-1 transition-all duration-300 bg-transparent border-none outline-none p-0 w-14 ${activeTab === 'bracket' ? 'text-[#00E676] -translate-y-1' : 'text-slate-400 hover:text-white'}`}
                >
                    {activeTab === 'bracket' && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#00E676] rounded-full shadow-[0_0_15px_2px_rgba(0,230,118,0.6)] animate-pulse"></div>
                    )}
                    <Activity size={22} strokeWidth={activeTab === 'bracket' ? 2.5 : 2} />
                    <span className="text-[9px] font-black tracking-widest uppercase mt-1">Sim</span>
                </button>

                {/* 5. BONUS */}
                <button
                    onClick={() => onTabChange('bonus')}
                    className={`relative flex flex-col items-center gap-1 transition-all duration-300 bg-transparent border-none outline-none p-0 w-14 ${activeTab === 'bonus' ? 'text-[#00E676] -translate-y-1' : 'text-slate-400 hover:text-white'}`}
                >
                    {activeTab === 'bonus' && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#00E676] rounded-full shadow-[0_0_15px_2px_rgba(0,230,118,0.6)] animate-pulse"></div>
                    )}
                    <Star size={22} strokeWidth={activeTab === 'bonus' ? 2.5 : 2} />
                    <span className="text-[9px] font-black tracking-widest uppercase mt-1">Bonus</span>
                </button>

                {/* 6. MURO (SOCIAL) - Si aplica */}
                {showMuroTab && (
                    <button
                        onClick={() => onTabChange('muro')}
                        className={`relative flex flex-col items-center gap-1 transition-all duration-300 bg-transparent border-none outline-none p-0 w-14 ${activeTab === 'muro' ? 'text-[#00E676] -translate-y-1' : 'text-slate-400 hover:text-white'}`}
                    >
                        {activeTab === 'muro' && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#00E676] rounded-full shadow-[0_0_15px_2px_rgba(0,230,118,0.6)] animate-pulse"></div>
                        )}
                        <MessageSquare size={22} strokeWidth={activeTab === 'muro' ? 2.5 : 2} />
                        <span className="text-[9px] font-black tracking-widest uppercase mt-1">Muro</span>
                    </button>
                )}

            </div>
        </nav>
    );
};
